# How SpeedLead connects to Facebook (honest plan)

## The short answer

**We cannot “Connect with Facebook” and auto-read their groups.**  
Meta removed the Facebook Groups API in 2024. There is no official switch for:

- read every post in a group
- watch trigger words in groups you don’t admin
- install an app on a Facebook group

So SpeedLead does **not** depend on Facebook Login for group monitoring.

What we sell instead: **catch the post as fast as possible → text the shop → open the thread.**

---

## What “ASAP trigger words” actually means

```text
New Facebook group post
        │
        ▼
Get the post text into SpeedLead  ← this is the hard part
        │
        ▼
Matcher (plumber / HVAC / looking for / etc.)
        │
        ▼
If it’s a real job → SMS the owner
        │
        ▼
Owner taps Reply on Facebook
```

The matcher is already built.  
The missing piece is **how the post gets into SpeedLead in seconds**.

---

## The 3 ways we’ll do it (in order)

### 1) Right now — Concierge watch (fastest to sell)

417BOOM / a VA watches the client’s groups during business hours.

When a post matches → paste/send into SpeedLead → client gets SMS.

- Works today
- No Facebook permission issues
- Perfect for first 5–10 paying HVAC/plumbing clients
- Feels “automatic” to the client even if a human helps at first

**Client pitch:**  
“We watch the local groups for you. When someone needs a plumber/HVAC tech, your phone buzzes.”

### 2) Next — Share from Facebook (owner or VA, 1 tap)

On phone:

1. See post in Facebook
2. Tap Share → SpeedLead  
   (or copy link → Paste in app)

On computer:

1. Chrome extension button: **Send to SpeedLead**
2. Post text + link go straight into the matcher

This is user-initiated (safer than scraping) and still very fast.

### 3) Later — Partner feed / webhook

If we use a monitoring partner, they send posts to:

`POST /api/hooks/posts`

SpeedLead classifies and texts only the right clients.

Still no official Meta Groups API — just a faster intake hose.

---

## What we will NOT do as the core product

- Log into the client’s Facebook and scrape groups with bots
- Promise “official Facebook integration for groups” (Meta won’t allow it)
- Auto-comment on Facebook for the client (spammy + ban risk)

Those get accounts banned and kill trust.

---

## What the client thinks is happening

They should believe:

> “SpeedLead watches my groups and texts me when there’s a job.”

Behind the scenes, for launch, that may be:

> VA / extension / share sheet → SpeedLead matcher → SMS

That’s normal for early SaaS. Zapier-era products did this for years.

---

## Recommended launch stack for 417BOOM

| Stage | Who watches Facebook | Client experience |
|---|---|---|
| Pilot (now) | You or VA | SMS + Reply on Facebook |
| Product v1 | Share + Chrome extension | Same, faster intake |
| Product v2 | Webhook partner optional | Closer to full auto |

---

## Decision for Joseph

For ASAP trigger words with real clients this month:

1. Sell the outcome (SMS on hire-intent posts)
2. Fulfill with concierge + SpeedLead matcher
3. Add Share / Chrome extension so intake gets faster
4. Never stake the business on Meta giving Groups API back

If Meta ever restores group reading, we can add a real “Connect Facebook” adapter later without changing the product promise.
