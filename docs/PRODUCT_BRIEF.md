# SpeedLead — Product Brief

**Working name:** SpeedLead (rename later: BoomAlert, FirstReply, GroupPulse, SnapLead)  
**Owner:** 417BOOM / Joseph Vang  
**Goal:** Sell a simple SaaS to local small businesses that turns Facebook group “looking for…” posts into instant SMS/push alerts with a one-tap reply.

---

## The problem (in one sentence)

When someone posts “Need a plumber tomorrow” in a local Facebook group, the job goes to whoever replies first — and most business owners find out hours later by scrolling.

## The promise

> Spot the lead. Text you. Open Facebook with your reply ready. Be first.

Speed is the product. Everything else is packaging.

---

## Who buys it

| Segment | Example | Why they pay |
|---|---|---|
| Home services | Plumber, HVAC, electrician, roofer, cleaner | High ticket, first reply often wins |
| Local pros | Lawyer, accountant, realtor, photographer | Reputation + speed = booked consult |
| Trades / specialty | Towing, auto glass, tree service | Time-sensitive demand |
| Agencies (you) | 417BOOM white-label | Resell as a monthly retainable add-on |

**First vertical (locked):** HVAC + Plumbing in the 417 market.  
**Ideal first customer:** local HVAC or plumbing shop already active in 3–8 Facebook groups.  
**Pilot detail:** [PILOT_HVAC_PLUMBING.md](./PILOT_HVAC_PLUMBING.md)

---

## Core user flow

```text
1. Business signs up → picks trade + keywords
   ("plumber", "leak", "water heater", "looking for plumber")

2. They add the Facebook groups they care about
   (Springfield Moms, Nixa Buy/Sell, 417 Home Pros, etc.)

3. System watches new posts in those groups

4. Matcher scores a post: is this a real service request?

5. If yes → SMS + push within seconds
   "🔥 Lead in Springfield Moms
    'Anyone know a good plumber for a leak in Battlefield?'
    [Open + Reply] [Snooze]"

6. Tap opens the post (deep link) + copies a prefilled reply
   "Hi! I'm [Name] with [Business] — we can be there today.
    Call/text [phone]. Licensed & insured. Happy to help!"

7. Owner pastes / sends reply in Facebook → wins the thread
```

Optional later: auto-draft variants (friendly / premium / short), team routing, lead log, CRM sync.

---

## The hard truth: Facebook Groups API is gone

Meta **deprecated and removed the Facebook Groups API** (April 22, 2024), including:

- Reading group posts
- `groups_access_member_info`
- `publish_to_groups`
- Installing third-party apps on groups

**You cannot build “connect Facebook → we officially read your groups” as a stable, ToS-safe product today.**

That does **not** kill the idea. It changes the **ingestion layer**. The alert + reply product can still win if monitoring is solved differently.

---

## How competitors / adjacent tools get group data

| Approach | How it works | Risk | Fit for MVP |
|---|---|---|---|
| **A. Assisted monitoring (human + tools)** | Operator / partner joins groups and forwards posts to your webhook | Operational cost | Strong for concierge MVP |
| **B. Browser / device companion** | Extension or mobile share sheet: user (or VA) is in Facebook; tool extracts post → your API | Account risk if automated; OK if user-initiated | Good hybrid |
| **C. Manual / semi-manual capture** | Paste post link or text → AI matches → notify team | Low risk, slower unless VA does it | Fastest legal MVP |
| **D. Third-party group watchers** | Buy feed from services that monitor groups → webhook into your app | Dependency + ToS gray area | Possible later |
| **E. Scrape Facebook at scale** | Bots / headless browsers logged into accounts | High ban + legal risk | **Avoid as your core** |

**Recommendation:** Do **not** market “Connect Facebook OAuth and we scrape groups.” Market **“Be first on local group leads”** and ship ingestion as a modular adapter.

---

## Recommended path: 3 phases

### Phase 0 — Validate before you build (1–2 weekends)

Talk to 10 local **HVAC and plumbing** owners:

1. Which groups do you check?
2. How often do you miss jobs because someone else replied first?
3. Would you pay $49 / $99 / $199 / month for instant SMS on matching posts?
4. Who on your team should get the alert?

**Success signal:** ≥5 say “I’d pay for that” and name specific groups + keywords.

Use the locked playbook: [PILOT_HVAC_PLUMBING.md](./PILOT_HVAC_PLUMBING.md).

### Phase 1 — Concierge MVP (sell before software)

You (or a VA) manually monitor agreed groups for 3 pilot customers.

Stack:

- Shared keyword list + Google Sheet / Notion
- When a match appears → Twilio SMS with post snippet + link
- Prefilled reply templates per customer
- Log wins/misses daily

**Charge money.** Even $49–99/mo proves willingness to pay.

This validates:

- Keyword quality
- False-positive rate
- Reply templates that convert
- How fast “fast enough” is (goal: &lt;60 seconds from post → SMS)

### Phase 2 — Productize the workflow

Build the app around what already works:

1. **Tenant dashboard** — business profile, keywords, templates, phone numbers
2. **Lead inbox** — matched posts, status (notified / replied / won / ignored)
3. **Alert engine** — SMS (Twilio) + optional push (OneSignal / FCM)
4. **Ingestion adapters**
   - Manual paste / share-to-app
   - Chrome extension “Send to SpeedLead” (user-initiated while browsing FB)
   - Webhook intake (for VA tools or partners)
5. **Matcher** — keyword rules first; LLM scoring second (reduce junk)

### Phase 3 — Scale & differentiate

- Multi-seat / on-call routing (owner vs CSR)
- Quiet hours + urgency scoring
- Analytics: time-to-reply, win rate
- White-label for agencies (417BOOM resells)
- Expand sources beyond FB groups: Nextdoor (where allowed), Craigslist RSS, Google Alerts, Angi/Thumbtack *outbound* (different product), SMS tip lines

---

## MVP feature cut (build this, nothing else)

**Must have**

- Business signup + login
- Keywords + excluded words
- Reply templates with merge fields (`{business}`, `{name}`, `{phone}`, `{offer}`)
- SMS alerts with deep link + “copy reply”
- Lead history
- Webhook + manual post intake

**Nice later**

- Push notifications
- Auto-open Facebook app
- Team assignment
- Billing portal
- AI rewrite of replies
- Multi-group heatmaps

**Explicitly out of MVP**

- “Official Facebook Connect that reads all groups”
- Auto-posting replies without the human (spammy + ban risk)
- Marketplace for selling leads to multiple competitors in the same group (trust killer)

---

## Suggested architecture (when you build)

```text
[Ingestion adapters]
   manual paste | chrome share | VA webhook | partner feed
            │
            ▼
      Post Normalizer
            │
            ▼
     Matcher (keywords → LLM score)
            │
            ▼
      Lead Service (Postgres)
            │
     ┌──────┴──────┐
     ▼             ▼
 Alert (Twilio)   Inbox API
     │
     ▼
 Business owner phone / push
     │
     ▼
 One-tap: open post + copy reply template
```

**Suggested stack (pragmatic):**

- Web app: Next.js (dashboard + API)
- DB: Postgres (Supabase or Neon)
- Auth: Clerk or Supabase Auth
- SMS: Twilio
- Queue: Inngest or BullMQ
- Matcher: rules + OpenAI/Anthropic for intent scoring
- Hosting: Vercel + worker

Keep Facebook out of the critical path until Meta offers a real group content API again (unlikely soon).

---

## Pricing sketch (to test)

| Plan | Price | Includes |
|---|---|---|
| Starter | $79/mo | 1 business, 5 groups watched*, 200 SMS |
| Pro | $149/mo | 15 groups, 3 seats, 600 SMS, templates |
| Agency | $399/mo | Multi-client, white-label alerts |

\*“Watched” = via your ingestion method (concierge / extension / partner), not Meta OAuth.

Add overage SMS at cost + margin.

**Agency angle for 417BOOM:** bundle SpeedLead into SEO/web retainers as “local demand capture.”

---

## Risks & how we handle them

| Risk | Mitigation |
|---|---|
| Meta ToS / account bans | No server-side FB scraping as core; user-initiated capture + concierge |
| False positives spam the owner | Tight keywords + LLM “is this a hire request?” score + mute |
| Owner still too slow | Prefilled reply + one tap; optional “hot lead” call |
| Competition replies faster anyway | Measure win rate; improve templates & on-call routing |
| Customers churn if groups go quiet | Set expectations; expand sources; weekly digest of near-misses |

---

## Success metrics

- Median **post → SMS** latency &lt; 60s (Phase 1: &lt; 5 min is OK)
- ≥ 30% of notified leads get an owner reply within 5 minutes
- ≥ 3 paying pilots in 30 days
- Gross margin after SMS + VA time &gt; 50% before heavy automation

---

## Decision checklist (pick these next)

1. **Name** — SpeedLead vs BoomAlert vs something 417-branded  
2. **First vertical** — one trade only for pilots  
3. **Ingestion for pilots** — concierge VA (recommended) vs Chrome share-sheet  
4. **Price point** to quote in sales conversations  
5. **Build vs sell-first** — recommend sell-first with concierge for 2–4 weeks  

---

## Bottom line

The product idea is strong: **local intent + speed + prefilled reply**.

The mistake would be starting with “Facebook OAuth integration.”  
The smart start is: **prove the alert loop with real customers**, then productize intake, matching, SMS, and reply templates into a SaaS you (and 417BOOM) can sell.
