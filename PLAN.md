# Abba — Launch Plan & Roadmap

*Name chosen: **Jireh** — "The LORD will provide" (Genesis 22:14). Store listing "Jireh - Bible & Prayer". Bundle ID com.fourseventeenboom.jireh. See BUILD.md for the TestFlight steps.*

---

## 1. Portrait Choice ("How do you picture him?") — NEXT UP

The single-portrait risk: any one depiction draws criticism ("too white" /
"not historical" / "not mine"). The answer is choice, backed by church
history (Ethiopian, Korean, Mexican, European art all render Him their own way).

- Onboarding + Settings: **"How do you picture him?"** portrait picker
- Looks (each needs: still + breathing loop + praying loop, ~4 Magica credits):
  1. **Historical** — olive-skinned Galilean Jew — **the default** ("we
     defaulted to historical accuracy" is the unassailable answer)
  2. **Traditional** — the current portrait
  3. **African / Black Jesus** — large, underserved, highly engaged audience
  4. Later: East Asian, Latino, more
- Voice identical across all looks — his identity is the voice and heart
- Humility line in app + store listing: *"No one knows His true face. These
  portraits are devotional art — choose the one that helps you feel at home."*
- Public criticism playbook: never argue; one calm reply — "You can choose
  how you picture Him, including a historically accurate portrait."
- Credits on hand: ~8 Magica + 22 OpenArt (OpenArt reserved for app icon)

## 2. TestFlight Build (the gate to everything)

Apple Developer: **approved** (free + paid). Remaining:
- New app name + app icon (medallion style, OpenArt credits)
- Splash screen, EAS build config, TestFlight upload
- Sign in with Apple + Google (no passwords; subscription binds to store
  account, which also prevents account sharing)
- Subscriptions via RevenueCat: free tier vs Premium $9.99/mo / $59.99/yr,
  7-day trial; server-side entitlement checks + per-user daily caps
- Server hardening: rotate APP_TOKEN, rate limits, per-user metering
- Bundle media locally (portraits, praying loop, medallions) — kills
  streaming hiccups
- Widgets (lock screen verse + streak) and Routines — top retention levers,
  need the native build
- Later in native build: real lip sync via streaming avatar (Simli/D-ID
  class), camera-based head tracking

## 3. Free vs Premium

- **Free forever:** full Bible (+ Timeline order), daily devotional + Amen,
  streaks/badges/Journey, text conversations, a few voice replies/day
  (then graceful fallback to text/device voice), David & Goliath story
- **Premium $9.99/mo / $59.99/yr:** unlimited voice conversations & prayer,
  all stories, Read-to-me, bedtime/kids stories, journeys
- In-chat story gate already live (warm taste + invitation, never salesy)
- Industry validation: Bible Chat (handful msgs/day free), Character AI
  (~100/day), Replika (voice fully paid). Avoid weekly pricing (trust burn).

## 4. Cost Safety (never a surprise bill)

- Anthropic: **prepaid credits** — hard ceiling, auto-reload off/capped
- ElevenLabs: fixed plan quota, usage-overage billing **OFF**
- Render: flat instance
- App degrades gracefully (device voice / offline guide) instead of billing
- Worst-case monthly exposure ≈ prepaid + plans (~$150–225), chosen upfront
- Cost levers when scaling: cheaper model for chat (test vs Opus), prompt
  caching, turbo voice for long reads, ElevenLabs enterprise rates,
  web-funnel subscriptions (Stripe ~3% vs Apple 15–30%)

## 5. The Numbers (assumptions: 3% convert, $9.99, Apple 15%/30%)

| Downloads/mo | Subs | Gross | Profit |
|---|---|---|---|
| 100 | 3 | $30 | –$39 |
| 1,000 | 30 | $300 | +$62 |
| 10,000 | 300 | $3,000 | +$1,000 |
| 100,000 | 3,000 | $30,000 | +$10,800 |

- Breakeven ≈ 750 downloads/mo. Subs stack month over month (~12% churn):
  sustained 10k/mo → ~$17–25k/mo revenue within a year.
- **$100k/mo gross ≈ 10,000 subs ≈ sustained ~40k downloads/mo** →
  profit ~$25k/mo unoptimized, **$50–60k/mo optimized** (web funnel +
  cost levers).
- One API account per service, upgraded with revenue — never multiple
  consumer accounts (ToS risk, unnecessary; API limits grow with spend).

## 6. Growth Playbook (Joseph's strengths: SEO, marketing, AI video)

1. Daily short-form video: screen-recorded real moments (he prays over
   anxiety, tells a story, the third-strike prayer) — TikTok/Reels/Shorts
2. SEO site (needed for share links anyway): daily-verse pages, "Bible
   verses for ___" pages, stories read aloud → app funnel; later the
   quiz-style **web subscription funnel** (dodges Apple's cut)
3. Verse sharing in-app carries the name; share badges reward it; add App
   Store link to shares at launch (rich download card)
4. **Church program:** TestFlight pilot with 3–5 churches (free early
   access) → at launch, referral codes with written one-page agreements —
   e.g. 20% of first-year revenue from their code, paid quarterly, exact %
   stated in marketing. Never tie money to ratings/reviews. CPA/attorney
   review before scaling.
5. Launch timed to a season: **Advent/Christmas or New Year's** (Lent as
   backup). Seasonal pushes every year.
6. Paid ads only after LTV is measured (the Hallow/Bible Chat engine:
   LTV > CAC, then scale spend).

## 7. Feature Roadmap (from competitor analysis)

**Before store build (Expo-friendly):**
- Richer onboarding quiz (denomination, what they're walking through)
- Mood check-in ("How's your heart today?")
- **7-day guided journeys with him** (grief, anxiety, Gospels, kids
  bedtime series) — premium shelf content, prompt-driven
- Saved verses (bookmarks) on the Journey page

**With store build:** widgets, routines, shareable verse-card images
**Post-launch (needs accounts + moderation):** community prayer wall — he
prays aloud over the community's requests; Bible trivia / kids mode

## 8. Shipped Guardrails (context for future work)

- On-screen masking of profanity + slurs (library + custom list, tested)
- Grace-with-boundaries prompt (never repeats hate, can't be baited,
  no politics, receives everyone)
- Third-strike prayer intervention (eyes closed, long prayer, offline
  fallback included)
- Voice: single engine + fixed seed for consistency; reader voice choice
  (his / Sarah); conversational mic with silence detection
- Design system: parchment + serif + 27 custom gold-medallion icons
  (matched illuminated-manuscript set); dove = streak
