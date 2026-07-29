"""SpeedLead intent matcher — keywords + TextRazor semantics.

Goal: alert on hire intent ("need a plumber"), not complaints
("my plumber was terrible") or job posts / DIY noise.
"""

from __future__ import annotations

import os
import re
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

CLASSIFIER_ID = "speedlead_hvac_plumbing_intent"
CLASSIFIER_CSV = Path(__file__).resolve().parent / "classifiers" / "hvac_plumbing_intent.csv"

TRADE_TERMS = {
    "plumbing": {
        "plumber",
        "plumbing",
        "leak",
        "leaking",
        "pipe",
        "clog",
        "clogged",
        "drain",
        "sewer",
        "toilet",
        "water heater",
        "hot water",
        "sump pump",
        "faucet",
        "garbage disposal",
        "slab leak",
        "water line",
    },
    "hvac": {
        "hvac",
        "ac",
        "a/c",
        "air conditioner",
        "air conditioning",
        "furnace",
        "heater",
        "heating",
        "no heat",
        "no ac",
        "thermostat",
        "heat pump",
        "mini split",
        "duct",
        "ductwork",
        "ac repair",
        "furnace repair",
    },
}

HIRE_CUES = {
    "looking for",
    "need a",
    "need an",
    "anyone know",
    "any one know",
    "recommend",
    "recommendation",
    "who do you use",
    "who should i call",
    "can someone",
    "please help",
    "asap",
    "emergency",
    "urgent",
    "available today",
    "available tomorrow",
    "come out",
    "service call",
}

COMPLAINT_CUES = {
    "terrible",
    "horrible",
    "worst",
    "scam",
    "ripoff",
    "rip off",
    "ripped off",
    "never hire",
    "never use",
    "avoid",
    "do not use",
    "don't use",
    "dont use",
    "complaint",
    "complaining",
    "sucks",
    "overcharged",
    "ruined",
    "messed up",
    "nightmare",
    "waste of money",
    "stay away",
    "beware",
    "unprofessional",
    "no show",
    "didn't show",
    "did not show",
}

JOB_CUES = {
    "we are hiring",
    "we're hiring",
    "now hiring",
    "job opening",
    "looking to hire",
    "hiring plumber",
    "hiring hvac",
    "apply now",
    "seeking technician",
    "join our team",
}

DIY_CUES = {
    "how do i",
    "how to fix",
    "diy",
    "youtube",
    "myself",
    "what tool",
    "can i replace",
}

# Lemmas TextRazor may return for hire / complaint predicates
HIRE_LEMMAS = {
    "need",
    "look",
    "recommend",
    "want",
    "find",
    "call",
    "hire",
    "help",
    "fix",
}
COMPLAINT_LEMMAS = {
    "hate",
    "suck",
    "complain",
    "avoid",
    "warn",
    "rip",
    "overcharge",
    "ruin",
    "fire",
    "sue",
}


class Intent(str, Enum):
    HIRE_REQUEST = "hire_request"
    COMPLAINT = "complaint"
    JOB_POSTING = "job_posting"
    DIY_NOISE = "diy_noise"
    UNRELATED = "unrelated"


@dataclass
class MatchResult:
    intent: Intent
    should_alert: bool
    confidence: float
    trade: str | None
    matched_keywords: list[str] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)
    textrazor: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["intent"] = self.intent.value
        return data


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _find_terms(text: str, terms: set[str]) -> list[str]:
    hits: list[str] = []
    for term in sorted(terms, key=len, reverse=True):
        pattern = r"(?<!\w)" + re.escape(term) + r"(?!\w)"
        if re.search(pattern, text):
            hits.append(term)
    return hits


def _detect_trade(text: str) -> tuple[str | None, list[str]]:
    hits: list[str] = []
    scores = {"plumbing": 0, "hvac": 0}
    for trade, terms in TRADE_TERMS.items():
        found = _find_terms(text, terms)
        hits.extend(found)
        scores[trade] += len(found)
    if scores["plumbing"] == 0 and scores["hvac"] == 0:
        return None, []
    trade = max(scores, key=scores.get)
    return trade, hits


def _heuristic_intent(text: str, trade: str | None, keywords: list[str]) -> MatchResult:
    hire_hits = _find_terms(text, HIRE_CUES)
    complaint_hits = _find_terms(text, COMPLAINT_CUES)
    job_hits = _find_terms(text, JOB_CUES)
    diy_hits = _find_terms(text, DIY_CUES)

    reasons: list[str] = []
    if keywords:
        reasons.append(f"trade_terms:{','.join(keywords[:6])}")

    # Priority: job posting and DIY are never alerts
    if job_hits:
        reasons.append(f"job_cues:{','.join(job_hits)}")
        return MatchResult(
            intent=Intent.JOB_POSTING,
            should_alert=False,
            confidence=0.9,
            trade=trade,
            matched_keywords=keywords,
            reasons=reasons,
        )

    if diy_hits and not hire_hits:
        reasons.append(f"diy_cues:{','.join(diy_hits)}")
        return MatchResult(
            intent=Intent.DIY_NOISE,
            should_alert=False,
            confidence=0.75,
            trade=trade,
            matched_keywords=keywords,
            reasons=reasons,
        )

    if not trade:
        return MatchResult(
            intent=Intent.UNRELATED,
            should_alert=False,
            confidence=0.95,
            trade=None,
            matched_keywords=[],
            reasons=["no_trade_terms"],
        )

    # Complaint beats weak hire language when both present
    if complaint_hits and not hire_hits:
        reasons.append(f"complaint_cues:{','.join(complaint_hits)}")
        return MatchResult(
            intent=Intent.COMPLAINT,
            should_alert=False,
            confidence=0.88,
            trade=trade,
            matched_keywords=keywords,
            reasons=reasons,
        )

    if complaint_hits and hire_hits:
        # e.g. "Looking for a new plumber — last one was terrible"
        # Still a hire request (they're shopping). Prefer alert.
        reasons.append(f"hire_cues:{','.join(hire_hits)}")
        reasons.append(f"complaint_cues_secondary:{','.join(complaint_hits)}")
        return MatchResult(
            intent=Intent.HIRE_REQUEST,
            should_alert=True,
            confidence=0.8,
            trade=trade,
            matched_keywords=keywords,
            reasons=reasons,
        )

    if hire_hits:
        reasons.append(f"hire_cues:{','.join(hire_hits)}")
        return MatchResult(
            intent=Intent.HIRE_REQUEST,
            should_alert=True,
            confidence=0.86,
            trade=trade,
            matched_keywords=keywords,
            reasons=reasons,
        )

    # Trade mention alone is weak — do not alert without intent
    reasons.append("trade_without_clear_intent")
    return MatchResult(
        intent=Intent.UNRELATED,
        should_alert=False,
        confidence=0.55,
        trade=trade,
        matched_keywords=keywords,
        reasons=reasons,
    )


def _textrazor_client(api_key: str):
    from textrazor import TextRazor

    client = TextRazor(
        api_key,
        extractors=["entities", "topics", "words", "relations", "entailments"],
    )
    client.set_classifiers([CLASSIFIER_ID])
    return client


def ensure_classifier(api_key: str) -> None:
    """Upload / refresh the custom hire-vs-complaint classifier (paid plans)."""
    from textrazor import ClassifierManager

    csv_contents = CLASSIFIER_CSV.read_text(encoding="utf-8")
    manager = ClassifierManager(api_key)
    try:
        manager.delete_classifier(CLASSIFIER_ID)
    except Exception:
        pass
    manager.create_classifier_with_csv(CLASSIFIER_ID, csv_contents)


def _score_from_textrazor(response: Any, base: MatchResult) -> MatchResult:
    tr_info: dict[str, Any] = {
        "categories": [],
        "relations": [],
        "entities": [],
        "topics": [],
    }

    category_scores: dict[str, float] = {}
    for category in response.categories() or []:
        label = getattr(category, "label", None) or getattr(category, "category_id", "")
        cid = str(getattr(category, "category_id", "") or "")
        score = float(getattr(category, "score", 0) or 0)
        tr_info["categories"].append({"id": cid, "label": label, "score": score})
        key = cid or str(label).lower().replace(" ", "_")
        category_scores[key] = max(category_scores.get(key, 0.0), score)

    hire_rel = 0
    complaint_rel = 0
    for relation in response.relations() or []:
        predicates = []
        for word in getattr(relation, "predicate_words", []) or []:
            lemma = (getattr(word, "lemma", None) or getattr(word, "token", "") or "").lower()
            predicates.append(lemma)
            if lemma in HIRE_LEMMAS:
                hire_rel += 1
            if lemma in COMPLAINT_LEMMAS:
                complaint_rel += 1
        if predicates:
            tr_info["relations"].append(predicates)

    for entity in list(response.entities() or [])[:8]:
        tr_info["entities"].append(
            {
                "id": getattr(entity, "id", None),
                "relevance": getattr(entity, "relevance_score", None),
            }
        )

    for topic in list(response.topics() or [])[:8]:
        if float(getattr(topic, "score", 0) or 0) >= 0.3:
            tr_info["topics"].append(
                {"label": getattr(topic, "label", None), "score": getattr(topic, "score", None)}
            )

    intent = base.intent
    confidence = base.confidence
    should_alert = base.should_alert
    reasons = list(base.reasons)

    hire_score = max(
        category_scores.get("hire_request", 0.0),
        category_scores.get("seeking_service", 0.0),
    )
    complaint_score = max(
        category_scores.get("complaint", 0.0),
        category_scores.get("service_complaint", 0.0),
    )
    job_score = category_scores.get("job_posting", 0.0)
    diy_score = category_scores.get("diy_noise", 0.0)

    if hire_rel:
        reasons.append(f"textrazor_hire_relations:{hire_rel}")
        hire_score = max(hire_score, 0.55 + 0.1 * hire_rel)
    if complaint_rel:
        reasons.append(f"textrazor_complaint_relations:{complaint_rel}")
        complaint_score = max(complaint_score, 0.55 + 0.1 * complaint_rel)

    # Prefer TextRazor categories when decisive
    ranked = sorted(
        [
            (Intent.JOB_POSTING, job_score, False),
            (Intent.DIY_NOISE, diy_score, False),
            (Intent.COMPLAINT, complaint_score, False),
            (Intent.HIRE_REQUEST, hire_score, True),
        ],
        key=lambda x: x[1],
        reverse=True,
    )
    top_intent, top_score, top_alert = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0

    if top_score >= 0.45 and (top_score - second_score) >= 0.08:
        intent = top_intent
        should_alert = top_alert and base.trade is not None
        confidence = min(0.97, max(base.confidence, top_score))
        reasons.append(f"textrazor_category:{intent.value}:{top_score:.2f}")
    elif hire_score >= 0.4 and hire_score > complaint_score:
        intent = Intent.HIRE_REQUEST
        should_alert = base.trade is not None
        confidence = min(0.95, max(base.confidence, hire_score))
        reasons.append(f"textrazor_hire:{hire_score:.2f}")
    elif complaint_score >= 0.4 and complaint_score > hire_score:
        intent = Intent.COMPLAINT
        should_alert = False
        confidence = min(0.95, max(base.confidence, complaint_score))
        reasons.append(f"textrazor_complaint:{complaint_score:.2f}")

    # Safety: never alert complaints / jobs / diy
    if intent in {Intent.COMPLAINT, Intent.JOB_POSTING, Intent.DIY_NOISE, Intent.UNRELATED}:
        should_alert = False

    return MatchResult(
        intent=intent,
        should_alert=should_alert,
        confidence=round(confidence, 3),
        trade=base.trade,
        matched_keywords=base.matched_keywords,
        reasons=reasons,
        textrazor=tr_info,
    )


def classify_post(text: str, *, use_textrazor: bool | None = None) -> MatchResult:
    """Classify a Facebook-group-style post for HVAC/plumbing lead intent."""
    cleaned = _normalize(text)
    trade, keywords = _detect_trade(cleaned)
    base = _heuristic_intent(cleaned, trade, keywords)

    api_key = os.getenv("TEXTRAZOR_API_KEY", "").strip()
    if use_textrazor is None:
        use_textrazor = bool(api_key) and api_key != "your_textrazor_api_key_here"

    if not use_textrazor or not api_key:
        base.reasons.append("mode:heuristic")
        return base

    try:
        if os.getenv("TEXTRAZOR_SYNC_CLASSIFIER", "").strip() in {"1", "true", "yes"}:
            ensure_classifier(api_key)

        client = _textrazor_client(api_key)
        response = client.analyze(text)
        if not response.ok:
            base.reasons.append(f"textrazor_error:{getattr(response, 'error', 'unknown')}")
            base.reasons.append("mode:heuristic_fallback")
            return base

        result = _score_from_textrazor(response, base)
        result.reasons.append("mode:textrazor")
        return result
    except Exception as exc:  # noqa: BLE001 - keep matcher resilient
        base.reasons.append(f"textrazor_exception:{type(exc).__name__}")
        base.reasons.append("mode:heuristic_fallback")
        return base


__all__ = [
    "Intent",
    "MatchResult",
    "classify_post",
    "ensure_classifier",
    "CLASSIFIER_ID",
]
