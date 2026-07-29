# SpeedLead

SaaS MVP: alert HVAC & plumbing shops when a Facebook group post is a **hire request**, not a complaint — with a prefilled reply ready to paste.

## Quick start

```bash
pip install -r requirements.txt
cp .env.example .env
./scripts/start.sh
```

Open **http://localhost:4170** on your phone (same Wi‑Fi) or desktop.

Mobile-first UI: bottom tabs (**Inbox / Capture / Settings**), large tap targets, safe-area padding. On desktop it shows in a phone frame.

Tap **Capture → Try hire request → Classify post**.

## What you can do now

1. **Capture** a Facebook post (paste text)
2. Matcher classifies **hire vs complaint** (TextRazor when keyed, else heuristics)
3. Hire requests land in the **inbox** with a prefilled reply
4. Optional **SMS** via Twilio to the shop’s alert phone
5. Mark leads replied / won

## Docs

- [Product brief](docs/PRODUCT_BRIEF.md)
- [HVAC + Plumbing pilot](docs/PILOT_HVAC_PLUMBING.md)
- [TextRazor matcher](docs/TEXTRAZOR_MATCHER.md)

## Tests

```bash
python -m pytest matcher/tests app/tests -q
```

## API

- `POST /api/ingest` — `{ "text", "group_name?", "post_url?", "send_sms?" }`
- `GET /api/leads`
- `GET|PATCH /api/business`
- `GET /api/health`
