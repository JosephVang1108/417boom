# Intent matcher (TextRazor)

Semantic layer that separates **hire requests** from **complaints** (and job posts / DIY noise).

## Why

Keywords alone fail:

| Post | Keywords | Real intent |
|---|---|---|
| "Anyone know a plumber in Nixa?" | plumber | **Lead — alert** |
| "Worst plumber ever, ripped us off" | plumber | **Complaint — skip** |

TextRazor adds entities, relations, entailments, and a custom classifier so SpeedLead only texts shops when someone is actually looking for service.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Add your key from https://www.textrazor.com/
```

Optional (paid TextRazor plans): sync the custom classifier once:

```bash
TEXTRAZOR_SYNC_CLASSIFIER=1 python -m matcher --sync-classifier
```

## Classify a post

```bash
# Heuristic-only (no API key needed)
python -m matcher --no-textrazor "Anyone know a good plumber in Nixa? Toilet overflowing ASAP."

# With TextRazor (requires TEXTRAZOR_API_KEY)
python -m matcher "Stay away from Joe's Plumbing — worst scam ever."

python -m matcher --json "Looking for HVAC — AC not working today."
```

## Tests

```bash
python -m pytest matcher/tests -q
```

## How scoring works

1. Detect HVAC / plumbing trade terms  
2. Heuristic cues for hire / complaint / job / DIY  
3. If `TEXTRAZOR_API_KEY` is set → enrich with TextRazor categories + relation lemmas  
4. Alert **only** on `hire_request`

Custom classifier CSV: `matcher/classifiers/hvac_plumbing_intent.csv`
