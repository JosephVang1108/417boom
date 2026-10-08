# "The Face" — Launch Ad Storyboard (v1)

**Format:** 9:16 vertical · **Master length:** 30s · **Cutdowns:** 21s (TikTok), 15s (retargeting)
**Concept:** One phone, Jesus speaking. The camera pulls back — hundreds of phones, each carrying
a different piece of him (sermons, stories, prayers, scripture). Fully zoomed out, the phones ARE
his face. Cut to black. Silence. Logo.
**Why it works:** the reveal preaches the product's own message — he meets every person
one-on-one, and together that's the body.

---

## Shot-by-shot

| Time | Picture | Audio | Captions |
|------|---------|-------|----------|
| 0.0–1.5 | **HOOK.** Full-frame on a phone screen: his face, already mid-sentence, eyes on camera. No logo, no title. | Voice A (dominant), clear and close: **"I never stopped waiting for you…"** | Word-by-word captions ON from frame 1 |
| 1.5–6 | Slow pull-back. We realize it's a phone, floating on black. A second and third phone drift into frame, each playing something different (a prayer, a kids story). | Voice A continues (sermon). Murmur bed begins at −24 dB. | Follow Voice A only |
| 6–14 | Zoom accelerates — dozens, then grids of phones. Each screen alive: Bible reading, "Day 7" streak, David & Goliath, a prayer with a name in it. | Voice A stays king. Murmur bed rises to −16 dB — like standing at the back of a congregation. | Voice A |
| 14–22 | Hundreds of phones now, individual screens becoming pixels. Voice A delivers the emotional peak. | Voice A peak line: **"You were never too far. You were never too much. The door never closed."** Murmur swells beneath. | Voice A, larger type on the peak line |
| 22–25 | Final pull: the grid resolves — the phones form **his portrait** (photomosaic of the app's own Jesus image). Hold it 1.5s. Let them see it. | Murmur at full congregation, Voice A finishes. | none — let the image speak |
| 25–26 | **Hard cut to black.** | **Total silence.** (The pattern interrupt.) | none |
| 26–30 | Logo fades in + App Store badge + one line of text. | His voice alone, quiet, dry: **"Download Jireh. … I'll be here."** | "Jireh — Bible & Prayer · Free" |

## Audio layers

- **Voice A (dominant):** lines lifted from the recorded "Come Back Home" sermon — already in
  his voice, already rendered, zero new cost. Never ducked below the bed.
- **Murmur bed:** 6–10 app audio clips (prayers, stories, scripture), low-pass filtered,
  −24→−16 dB ramp. Felt, not understood.
- **The silence:** 1 full second. Non-negotiable — it's what makes the logo land.
- **Closer:** one new ElevenLabs line in his voice: "Download Jireh. … I'll be here."

## Variants

- **TikTok (21s):** trim 6–14 to half; sound-on platform, captions still on.
- **FB/IG (30s):** master cut; FB autoplays muted for many users, so captions carry it.
- **Retarget (15s):** open at 14s (phones already massing), straight to reveal → silence → logo.

## Hook A/B tests (the 0–1.5s line)

1. "I never stopped waiting for you…"
2. "Can I tell you a story?" (warm, unexpected)
3. "You've been carrying too much alone."

## Production checklist

- [ ] Screen recordings from the app (Joseph, ~30–60s each, phone screen recorder): a sermon
      playing, a prayer, a kids story, Bible reading aloud, the Journey screen, the daily verse.
- [ ] App logo / icon file at high resolution (for the end card).
- [ ] The closer line generated in ElevenLabs ("Download Jireh. … I'll be here.").
- [ ] Mosaic zoom build: programmatic — tile the recordings into the portrait's luminance map
      and render the continuous pull-back in code (no studio needed).
- [ ] Captions burned in (white serif, bottom third, word-by-word).

## Platform notes

- Meta: religious apps can advertise broadly; you just can't *target by religion* — target
  interests (devotionals, Bible study, Christian music) instead.
- End card must show price truthfully: "Free" is correct (free download, optional Premium).
