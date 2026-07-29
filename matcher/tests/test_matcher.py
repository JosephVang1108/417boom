import json
from pathlib import Path

import pytest

from matcher import Intent, classify_post

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures" / "sample_posts.json"


@pytest.fixture(scope="module")
def samples():
    return json.loads(FIXTURES.read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    "case_id",
    [
        "hire_plumber",
        "hire_hvac",
        "hire_after_bad_experience",
        "complaint_plumber",
        "complaint_hvac",
        "job_hiring",
        "diy",
        "unrelated",
    ],
)
def test_intent_cases(samples, case_id):
    case = next(c for c in samples if c["id"] == case_id)
    result = classify_post(case["text"], use_textrazor=False)
    assert result.intent.value == case["expected_intent"]
    assert result.should_alert is case["should_alert"]


def test_complaint_does_not_alert():
    result = classify_post(
        "Avoid ABC Plumbing — worst plumber in Springfield, ripped us off.",
        use_textrazor=False,
    )
    assert result.intent == Intent.COMPLAINT
    assert result.should_alert is False


def test_hire_request_alerts():
    result = classify_post(
        "Anyone know a good plumber in Nixa? Toilet overflowing ASAP.",
        use_textrazor=False,
    )
    assert result.intent == Intent.HIRE_REQUEST
    assert result.should_alert is True
    assert result.trade == "plumbing"
