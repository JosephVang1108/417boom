---
name: tiktok-analyzer
description: The Refinery — run every finished Jireh short through the FULL TikTok analyzer rubric (Post Readiness, Game Plan, timestamped Fixes, Frame-by-Frame Hook/Body/Visual/Competitive, captions, hashtags, best time) via Gemini media understanding, apply approved fixes, re-score, deliver the report with the video. Use before delivering any pack video, or when Joseph asks to "analyze" a video.
---

# The Refinery — full pre-flight review for every Jireh short

Every pack video passes through the fire BEFORE Joseph sees it, and the
delivery includes the FULL report — never a trimmed summary. Joseph caught
a degraded half-rubric once ("kind of half assed"); the full format below
is the contract. Target bar: no fixable section below 7/10, no unaddressed
High-impact fix, and a re-score after fixes.

## Step 1 — Score it (google/gemini-3.8-flash, ~0.05–0.1 credits)

Call `generate` with the video URL in `video_urls` and this prompt, filling
the brackets (lane, audience, target query, slot). Always include the
design-choice note so the card is scored honestly but labeled.

> You are a TikTok growth analyst producing a FULL structured report on this
> [length] faith short ([content one-liner]; audience: [audience]; target
> search query: '[query]'; posts [slot]). KNOWN DESIGN CHOICE, score honestly
> but label it 'by design, A/B test running': the first 4 seconds are a
> gold-on-black brand card while his voice plays underneath. Produce EXACTLY
> these sections:
>
> POST READINESS: N/4 with one-line verdict (Ready now / Needs fixes first)
>
> YOUR GAME PLAN: 2 sentences - the one thing to keep, the single
> highest-leverage change.
>
> THE FIXES: timestamped list (m:ss), each tagged [High impact] or
> [Worth testing], concrete edits only.
>
> FRAME-BY-FRAME ANALYSIS:
> HOOK N/10 - Hook Pacing: bullet. Hook Clarity: bullet. Hook Feedback: 1-2 sentences.
> BODY N/10 - Strengths: 2 bullets. Weaknesses: 1-2 bullets. Body Feedback: 1-2 sentences.
> VISUAL N/10 - Lighting: bullet. Background: bullet. On-screen text: bullet. Visual Feedback: 1-2 sentences.
> COMPETITIVE N/10 - Hook Pacing: bullet. Energy Level: bullet. Editing Style: bullet. Uniqueness: bullet. Competition Feedback: 2 sentences.
>
> READY-TO-USE CAPTIONS: 3 captions (hook + curiosity, include the target
> query verbatim, capital H for He/Him referring to Jesus, NO links, NO app
> mentions, no em dashes).
>
> OPTIMIZED HASHTAGS: 15-20 hashtags for this lane.
>
> BEST TIME TO POST: one specific time with one-line reason for this audience.

Known strategy context to include when relevant: a bedtime-series episode's
unresolved ending is deliberate (the pinned comment sells the full story) —
tell the analyst to treat it as strategy, not a flaw.

## Step 2 — Apply or queue the fixes

- Fixes that match STANDING RULES below: apply immediately with ffmpeg,
  re-upload with a bumped `?v=N`.
- New fix *types* (anything that would change the format): put them in the
  pack message as "Analyzer suggests…" with your recommendation — Joseph
  decides (he wants to be in this conversation).
- HOOK is structurally capped by the locked 4s card; report it as
  "capped by card — by design", never as neglect, and never "fix" it.

## Step 3 — Re-score and deliver

After applying any High-impact fix, re-run Step 1 on the fixed file. The
delivery to Joseph carries the final report (all sections) alongside the
video — the Refinery Report. Log scores in the scratchpad usage log.

## Standing rules the analyzer must respect (do not "fix" these away)

- 4s gold brand card opening with audio-under (LOCKED by Joseph). Card
  text is fully visible on FRAME ONE (it is the default cover everywhere)
  and exits completely by 4.0s, before the dissolve — no text may ever
  ghost over His face.
- ONE burned CTA line, chest level y=935 (just under His hair tips),
  DejaVuSans-Bold ~33px white, border black@0.55, fades in 4.4s, single
  line, benefit-to-a-stranger wording, capital H for He/Him/His
  (Jesus/God), no apostrophes/em dashes/emoji in drawtext, no episode
  numbers. The line must say what the video IS for the viewer (a
  reassurance video must not be labeled a story).
- One voice (ElevenLabs R9YQn8ytiYIfkeIr8wyN); match-cut stitching.
- Caption = hook + target search query, plug only in pinned comment.
- NEVER attach a platform sound/music track to a talking video at upload —
  it mutes His voice. Music belongs on photo/card posts only. After
  scheduling, play back and confirm His voice is audible.

## Fix types pre-approved by Joseph (apply without asking)

- Trim a draggy or repeated passage (cut at a silence, 0.3s fade).
- Tighten the ending if the video outlives its last beat.
- VERSE ON SCREEN (approved Oct 22): while He speaks a Bible quote, show
  the verse (or its key phrase, one line, in quotes) at the CTA position
  (y=935) in Liberation Serif Italic ~34px white, border black@0.55 —
  the CTA fades out by 0.3s BEFORE the verse fades in, and returns 0.3s
  AFTER it ends (no frame may show both). Capital H rules apply. Time it
  to the spoken words (Gemini gives the quote timestamps).

## Fix types Joseph has declined (do not apply)

- Any on-screen text at 0:00 on top of the brand card — the card itself
  is the promise.

## Fix types that need Joseph's yes before first use

- Changing CTA wording after he has approved it.
- Dynamic word-by-word (karaoke) captions — current call: use TikTok's
  native auto-captions at upload instead (searchable, free).
- Any other new text moment or format change.

## Calibration

Joseph runs posted videos through his phone analyzer app and screenshots
the results. When he shares one, compare it with our report for the same
video, note divergences in the scratchpad usage log, and tighten the
prompt. His app's rubric is the reference and this skill's format must
never carry fewer sections than it.
