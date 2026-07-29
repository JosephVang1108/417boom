# SpeedLead — brainstorm notes

## Elevator pitch

An app for local small businesses that watches Facebook groups for “looking for a [service]” posts and fires an SMS/push so the owner can reply first with a prefilled pitch.

## Why this can sell

- Local FB groups are still where a lot of demand shows up first.
- Winning is often about **being first**, not having the best website.
- Owners already feel the pain of refreshing groups all day.
- Clear ROI story: one booked job can pay for months of software.

## Why this is tricky

Meta removed the Groups API in 2024. There is **no official way** for an app to connect to Facebook and reliably read group posts.

So the product should be sold as **speed-to-lead**, not as “Facebook integration.” Monitoring becomes an adapter (concierge, share extension, partner webhook), while your real IP is:

1. Matching (is this a real lead?)
2. Alerting (SMS/push fast)
3. Reply assist (prefilled, on-brand, one tap)

## Decisions

| Question | Decision |
|---|---|
| First vertical | **HVAC + Plumbing** (two keyword packs, one product) |
| Market | 417 — Springfield / Nixa / surrounding |
| First delivery mode | Concierge pilot (manual watch → SMS → reply templates) |

See [PILOT_HVAC_PLUMBING.md](./PILOT_HVAC_PLUMBING.md) for keywords, templates, offer, and 14-day checklist.

## Best first move

Sell a **concierge pilot** to 3–6 HVAC/plumbing shops in the 417 market. Manually watch their groups. Text SMS when a match hits. Track whether they win jobs. If they renew, build the dashboard.

## Still open

- Brand: separate name vs 417BOOM white-label?
- Who monitors during pilot (you / VA / both)?
- Pilot price to quote (suggested **$99/mo**)?
