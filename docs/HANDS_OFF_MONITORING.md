# Hands-off Facebook monitoring (no VA)

## Your concern is right

If a human has to watch groups all day, SpeedLead is just an expensive notification tool.  
The product only works if **intake is automated**.

## Hard limit (unchanged)

Meta removed the Groups API. There is still **no official** “connect Facebook → read group posts.”

So “hands-off” does **not** mean official OAuth.  
It means: **software watches groups → posts hit SpeedLead → SMS goes out.**

---

## Best hands-off options (ranked)

### Option A — Buy monitoring, keep SpeedLead as the product (recommended)

Use a group-monitoring service that already runs 24/7 and sends webhooks.

Examples in market today:

- [Groups Watcher](https://www.groupswatcher.com/) (done-for-you / webhook, ~$15/group/mo)
- Similar Chrome/monitor tools (often need a browser left open)

**Flow:**

```text
Facebook groups
   │
   ▼
Monitoring partner (they watch 24/7)
   │  webhook every new/matched post
   ▼
SpeedLead  POST /api/hooks/posts
   │
   ▼
Matcher (hire vs complaint)
   │
   ▼
Twilio SMS → client phone
   │
   ▼
Client taps Reply on Facebook
```

**Why this fits:**

- No VA labor
- Hands-off for you and the client
- SpeedLead still owns the valuable parts: intent matching, SMS, reply UX, multi-client billing
- Cost is software (~$15/group), not payroll

**Unit economics example:**

- Charge client: $99–$149/mo  
- Watch 5 groups: ~$75 monitor cost  
- SMS: a few dollars  
- Gross still works at $149; at $99 keep groups lean (3) or raise price

This is how most “FB group lead” tools operate after Meta killed the API.

### Option B — Client-side auto watcher (cheaper, less reliable)

Chrome extension on a computer that stays logged into Facebook and scans joined groups on a timer.

- Lower cash cost
- Requires a machine always on + FB login
- Account ban / ToS risk
- Breaks when Facebook changes the page

Good as an experiment. Bad as your only production dependency.

### Option C — Build our own Facebook scraper farm

Technically possible with browser automation.  
**We should not make this the core business.**

- High ban risk
- Constant breakage
- Legal/ToS exposure
- You become a scraping company, not a lead product company

If we ever need it, treat it as a last resort behind a partner, not SpeedLead’s heart.

### Option D — Automate other sources (legal + truly API-friendly)

Run in parallel so you’re not 100% hostage to Facebook:

- Craigslist RSS / search feeds
- Google Alerts / local Reddit
- Meta **Lead Ads** (official API) for paid capture
- Website “request service” forms

Facebook groups stay the wedge. Other sources make the SaaS more durable.

---

## What we should do for SpeedLead

1. **Sell hands-off alerts** (not “Facebook OAuth”)
2. **Plug a monitor partner into** `POST /api/hooks/posts` (already built)
3. **SpeedLead differentiates on:**
   - hire-vs-complaint matching
   - SMS speed
   - human Reply-on-Facebook UX
   - multi-client agency billing for 417BOOM
4. Add more automated sources later so FB isn’t the only pipe

---

## Practical next step (no VA)

1. Pick 1 monitoring partner (start with Groups Watcher or equivalent)
2. Point their webhook to SpeedLead:
   - URL: `https://YOUR_APP/api/hooks/posts`
   - Header: `X-Speedlead-Secret: YOUR_SECRET`
3. Keywords: HVAC + plumbing pack we already have
4. Turn on SMS to the pilot shop’s cell
5. Measure: post → SMS time, and jobs won

That’s automated intake. No scrolling employee required.

---

## Plain-English pitch to clients

> “We watch the local Facebook groups for HVAC/plumbing jobs and text you when someone needs help. You tap Reply on Facebook and answer like yourself.”

You don’t mention partners, scrapers, or APIs.  
They buy the outcome.
