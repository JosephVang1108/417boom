# SpeedLead

SaaS concept: alert local businesses the moment someone asks for their service in a Facebook group — with a one-tap prefilled reply.

## Docs

- [Product brief](docs/PRODUCT_BRIEF.md) — full vision, Meta constraints, MVP phases, pricing
- [Brainstorm notes](docs/BRAINSTORM.md) — short pitch and decisions
- [HVAC + Plumbing pilot playbook](docs/PILOT_HVAC_PLUMBING.md) — keywords, templates, offer, checklist
- [TextRazor matcher](docs/TEXTRAZOR_MATCHER.md) — hire-intent vs complaint semantics

## Status

Vertical locked: **HVAC + Plumbing** (417 market).  
Intent matcher scaffolded with **TextRazor** (plus heuristic fallback). Concierge pilot next.

## Matcher quickstart

```bash
pip install -r requirements.txt
python -m pytest matcher/tests -q
python -m matcher --no-textrazor "Anyone know a good plumber in Nixa?"
```
