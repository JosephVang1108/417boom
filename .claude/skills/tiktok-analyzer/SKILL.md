---
name: tiktok-analyzer
description: Score a finished Jireh short against the TikTok analyzer rubric (Hook/Body/Visual/Competitive, timestamped fixes, game plan) using Gemini media understanding, then apply approved fixes. Use before delivering any pack video, or when Joseph asks to "analyze" a video.
---

# TikTok Analyzer — pre-flight review for every Jireh short

Run every finished pack video through this BEFORE delivering it to Joseph.
Target quality bar: no section below 7/10, no unaddressed High-impact fix.

## Step 1 — Score it (Gemini media understanding, ~0.03–0.1 Magica credits)

Call `generate` with `modelId: google/gemini-3.8-flash`, the video URL in
`video_urls`, and this prompt (verbatim, fill the bracket):

> You are a TikTok growth analyst reviewing a faith short (calm talking-head
> of Jesus, target audience [prayer-seekers 18-24 F / moms, per the video's
> lane]). Score four sections, each N/10 with 2-3 bullet observations and one
> "Feedback:" sentence:
> 1. HOOK — first 5s: does the opening line name a real felt need? Is the
>    on-screen text a promise of what the viewer gets?
> 2. BODY — pacing, one clear heart/takeaway, repeated or draggy passages
>    (quote them), does a new beat land every 8-10s?
> 3. VISUAL — readability of burned text, is the spoken Bible quote ALSO
>    readable on screen, framing, anything covering the face?
> 4. COMPETITIVE — versus other faith talking-head shorts: uniqueness,
>    energy fit, what one change would make it stand out?
> Then: THE FIXES — a timestamped list (mm:ss), each tagged High impact or
> Worth testing, phrased as a concrete edit. Then: GAME PLAN — 2 sentences,
> what to keep and the single highest-leverage change. Then: 3 ready-to-use
> captions (capital H for He/Him referring to Jesus, no em dashes) and the
> best posting time for this lane (prayer lane: evening/night; bedtime: 7pm;
> stories: morning).

## Step 2 — Apply or queue the fixes

- Fixes that match STANDING RULES below: apply immediately with ffmpeg,
  re-upload with a bumped `?v=N`.
- New fix *types* (anything that would change the format): put them in the
  pack message as "Analyzer suggests…" with your recommendation — Joseph
  decides (he wants to be in this conversation).
- Re-run Step 1 after edits only if a High-impact fix was applied.

## Standing rules the analyzer must respect (do not "fix" these away)

- 4s gold brand card opening with audio-under (LOCKED by Joseph).
- ONE burned CTA line, chest level y=935, DejaVuSans-Bold ~33px white,
  border black@0.55, fades in 4.4s, single line, benefit-to-a-stranger
  wording, capital H for He/Him/His (Jesus/God), no apostrophes/em
  dashes/emoji in drawtext, no episode numbers.
- One voice (ElevenLabs R9YQn8ytiYIfkeIr8wyN); match-cut stitching.
- Caption = hook + target search query, plug only in pinned comment.

## Fix types pre-approved by Joseph (apply without asking)

- Trim a draggy or repeated passage (cut at a silence, 0.3s fade).
- Tighten the ending if the video outlives its last beat.
- VERSE ON SCREEN (approved Oct 22): while He speaks a Bible quote, show
  the verse (or its key phrase, one line, in quotes) at the CTA position
  (y=935) in Liberation Serif Italic ~34px white, border black@0.55 —
  the CTA line fades out 0.3s before the verse appears and fades back
  0.3s after it ends. Capital H rules apply. Time it to the spoken words.

## Fix types Joseph has declined (do not apply)

- Any on-screen text at 0:00 on top of the brand card — the card itself
  is the promise.

## Fix types that need Joseph's yes before first use

- Changing CTA wording after he has approved it.
- Any other new text moment or format change.

## Calibration

Joseph runs posted videos through his phone analyzer app and screenshots
the results. When he shares one, compare it with our Step-1 output for the
same video, note divergences in the scratchpad usage log, and tighten the
prompt. The app's rubric is the reference: Post Readiness, Game Plan,
timestamped Fixes, Frame-by-Frame (Hook/Body/Visual/Competitive),
captions, hashtags, trending sounds, best time to post.
