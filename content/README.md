# Jireh Recorded Content — Production Guide

Pre-rendered lip-sync videos: written once, rendered once, watched by
every user. This folder holds the scripts; the rendered videos get
hosted (CDN/backend) and the app streams them.

## The library (v1)

| # | Script | Target length | Audience |
|---|--------|--------------|----------|
| 1 | story-david-goliath-adult.md | 5–6.5 min | Adults — full detail |
| 2 | story-david-goliath-kids.md | ~5 min | Kids — PG, cozy bedtime |
| 3 | sermon-come-back-home.md | 6–7 min | Not following Jesus |
| 4 | sermon-god-and-your-money.md | 6–7 min | Finances |
| 5 | sermon-the-narrow-road.md | 6–7 min | Doing the right thing |
| 6 | sermon-loved-therefore-lovely.md | 6–7 min | Loving yourself |
| 7 | sermon-he-keeps-your-tears.md | 6–7 min | Grief |

## Pipeline (per video)

1. **Audio** — generate the script in HIS ElevenLabs voice (Joseph's
   ElevenLabs account, counts against the plan quota; overage is off so
   it can never surprise-bill). Settings: speed **0.85** (0.82 for the
   grief sermon), stability ~0.55. The `…` marks in the scripts are
   deliberate pauses — keep them. Jesus does not rush.
2. **Listen first.** Approve the audio before paying for video.
3. **Video** — lipsync on Magica, source image `portrait.png`
   (the app's own portrait), 9:16, 720p:
   - ≤ ~4 min: Hedra Lipsync (~$0.055/sec at 720p)
   - longer / up to 10 min: Infinitalk (~$0.078/sec at 720p)
4. **Quality gate** — watch the whole render before publishing. Watch
   for: teeth artifacts (test clip had a slight gap — regenerate if a
   take is off), drift from his face, robotic pacing.
5. **Publish** — upload to hosting; app streams by content id. New
   content never requires an app update.

## Cost reality (why we render in stages)

Full v1 library ≈ 45–47 minutes of video:

| Quality | Approx. total |
|---------|---------------|
| 480p/540p | ~$80–110 |
| 720p (recommended) | ~$155–220 |

Plus ~$5 of TTS if not using Joseph's ElevenLabs plan. The 18-second
proof clip cost ~$1 and looked great.

**Stage plan:** render ONE full sermon first (~$25–35 at 720p), judge
it on-phone, then batch the rest. Top up Magica credits before each
stage — never render the whole library on a maybe.

## Business note

These replace live-LLM generation for the most expensive content
(stories, sermons), so marginal cost per listener drops to ~zero.
Free tier: the recorded library. Premium: custom/live generations on
top. Daily rotating sermon can draw from this library until the
one-render-per-day pipeline is running.
