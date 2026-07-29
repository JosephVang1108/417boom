# Pilot Playbook — HVAC & Plumbing (417 market)

**Decision locked:** First vertical = **HVAC + Plumbing**  
**Market:** Springfield / Nixa / Ozarks (417)  
**Mode:** Concierge pilot → productize later

---

## Why these two verticals first

- High ticket (one job can pay for months of software)
- Time-sensitive (“AC out”, “water leak”, “no hot water”)
- Heavy Facebook-group demand in local moms / neighborhood / buy-sell groups
- Clear keyword language owners already recognize
- You can sell both trades with the **same product**, different keyword packs + reply templates

Treat them as **two packs inside one product**, not two separate apps.

---

## Ideal pilot customer profile

- Owner-operator or small shop (1–15 techs)
- Already replies in local FB groups (or knows they should)
- Serves Springfield, Nixa, Republic, Ozark, Battlefield, Willard, etc.
- Has a phone that gets SMS during business hours
- Willing to reply within ~5 minutes when alerted

**Pilot goal:** 3 HVAC + 3 plumbing shops (or 4–6 total mixed).  
**Success:** they renew month 2 because they booked ≥1 job from alerts.

---

## Offer to quote

**Pilot — $99/mo** (first 30–60 days)

Includes:

- Keyword pack for HVAC **or** Plumbing (or both +$40)
- Up to 8 Facebook groups monitored
- SMS alerts to 1–2 phones
- 3 prefilled reply templates
- Weekly “leads sent / replied / won” recap
- Human monitoring during agreed hours (e.g. 7am–7pm CT)

Pitch line:

> “When someone in a local group asks for an HVAC or plumbing pro, you get a text in seconds with a reply ready to paste — so you’re first, not tagged a day later.”

---

## Keyword packs

### Plumbing — include

`plumber`, `plumbing`, `leak`, `leaking`, `pipe`, `clog`, `clogged`, `drain`, `sewer`, `toilet`, `water heater`, `hot water`, `no hot water`, `sump pump`, `faucet`, `garbage disposal`, `slab leak`, `water line`, `looking for a plumber`, `need a plumber`, `recommend a plumber`

### Plumbing — exclude (noise)

`diy`, `how to fix`, `youtube`, `for sale`, `selling`, `want to buy tools`, `apprentice`, `hiring plumber`, `job opening`, `resume`

### HVAC — include

`hvac`, `ac`, `a/c`, `air conditioner`, `air conditioning`, `furnace`, `heater`, `heating`, `no heat`, `no ac`, `ac not working`, `thermostat`, `heat pump`, `mini split`, `duct`, `ductwork`, `looking for hvac`, `need an hvac`, `ac repair`, `furnace repair`, `recommend hvac`

### HVAC — exclude (noise)

`window unit for sale`, `diy`, `how to recharge`, `freon for sale`, `hiring`, `job opening`, `class`, `school`, `epa certification`

### Intent phrases (boost score)

`looking for`, `need a`, `anyone know`, `recommend`, `recommendation`, `can someone`, `who do you use`, `emergency`, `asap`, `today`, `tomorrow`, `urgent`

### Soft negatives (downrank, don’t always drop)

`already booked`, `nevermind`, `found someone`, `just curious`, `ballpark for my cousin in another state`

---

## Prefilled reply templates

Keep these short and human. No em dashes. No +1. Sound like a neighbor.

Merge fields: `{name}` `{business}` `{phone}` `{city}`

### Plumbing

```text
Hey, this is {name} with {business} here in {city}. I can help. Text me at {phone} if you want.
```

### HVAC

```text
Hey, {name} here with {business}. We work around {city}. Text me at {phone} and I can take a look.
```

Better default UX: primary button is **Reply on Facebook** (opens the thread). Suggested reply is optional/hidden so it doesn’t feel automated.

---

## Group targeting (417)

Ask each pilot which groups they already use, then add:

- Springfield / Nixa / Ozark moms & community groups
- Local buy/sell / “recommend a…” groups
- Neighborhood groups in their service zips
- Homeowner / DIY groups (filter carefully — more noise)

**Rule:** quality over quantity. 5 active groups beat 20 dead ones.

Onboarding question list:

1. Which Facebook groups do you already check?
2. What cities/zips do you serve?
3. Who gets the SMS (owner, CSR, on-call)?
4. Quiet hours?
5. Any competitors you refuse to “race” in the same thread? (optional)

---

### Matcher (TextRazor)

Before an SMS fires, posts pass through `matcher.classify_post`:

- **Alert:** hire / recommend / emergency service request  
- **Skip:** complaints, “never use X”, job postings, DIY questions  

See [TEXTRAZOR_MATCHER.md](./TEXTRAZOR_MATCHER.md). This is the difference between “need a plumber” and “complaining about a plumber.”

---

## Concierge operating loop (daily)

```text
For each watched group during coverage hours:
  1. Scan new posts (newest first)
  2. If keyword/intent match → open lead card
  3. Confirm it's a hire request (not DIY advice / for sale)
  4. SMS customer within target SLA
  5. Log: time found, time texted, group, snippet, link
  6. Next day: ask “did you reply? win/loss?”
```

**SLA targets**

- Concierge pilot: post → SMS **under 5 minutes** during coverage
- Product goal later: under 60 seconds

---

## Lead log columns (Sheet is fine)

| timestamp | trade | group | post snippet | post link | keywords hit | sms sent? | customer replied? | won? | notes |
|---|---|---|---|---|---|---|---|---|---|

---

## Sales script (60 seconds)

> “You already know the job goes to whoever comments first in those Facebook groups. The problem is you’re on a job site, not refreshing Mom groups all day.  
> We watch the HVAC/plumbing posts for you and text you the second someone needs help — with a reply ready to paste.  
> One booked service call usually covers months of this. We’re piloting it at $99/mo for local shops — want in for 30 days?”

---

## 14-day pilot checklist

**Day 0**

- [ ] Pick 3–6 pilot shops (mix HVAC + plumbing)
- [ ] Collect groups, phones, templates, coverage hours
- [ ] Set up shared lead sheet + Twilio SMS (or even iMessage manually at first)

**Days 1–14**

- [ ] Monitor + alert
- [ ] Tune keywords daily (add misses, kill false positives)
- [ ] Track reply rate and wins

**Day 14 review**

- [ ] # alerts sent
- [ ] # owner replies &lt; 5 min
- [ ] # jobs won / estimated revenue
- [ ] Decision: kill, continue concierge, or build MVP dashboard

---

## What we build only after pilots prove it

1. Dashboard (keywords, templates, phones)
2. Lead inbox
3. Twilio SMS automation
4. Manual paste + Chrome “Send to SpeedLead” intake
5. Billing

Until then: spreadsheet + SMS + templates is enough.

---

## Open decisions still pending

- Brand: separate name vs 417BOOM white-label?
- VA / who monitors during pilot?
- Exact pilot price you’re comfortable quoting ($99 suggested)
