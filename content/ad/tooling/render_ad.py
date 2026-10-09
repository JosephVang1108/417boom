#!/usr/bin/env python3
"""Render "The Face" — Jireh launch ad v1.

One phone of him preaching pulls back into a wall of phones that
resolve into his portrait; cut to black, silence, end card.
Pure PIL/numpy compositing piped into ffmpeg.
"""
import math
import os
import random
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SCRATCH = os.path.dirname(os.path.abspath(__file__))
REPO = '/home/user/417boom'
MEDIA = os.path.join(REPO, 'app/assets/media')

W, H = 1080, 1920
FPS = 30
N = 55                      # N x N grid (odd: the hero phone sits dead center)
TW, TH = 80, 142            # master tile size (phone incl. bezel)
MW, MH = N * TW, N * TH     # master mosaic size

T_HOOK = 1.5                # hold on the hero phone
T_ZOOM_END = 22.0           # fully zoomed out
T_FLASH = 23.0              # light swells WITH the final words
T_HOLD_END = 25.0           # flash peaks right after the last word
T_BLACK_END = 26.0          # light falls away to black
T_END = 30.0                # end card out
TOTAL_FRAMES = int(T_END * FPS)

HERO = (27, 27)             # the exact center cell — camera never travels, pure zoom-out
W0 = (1.0 / N) * 0.86       # initial crop: inside the hero phone's screen

SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
SERIF_B = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SERIF_I = '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'

PAPER, CARD, INK, INK_SOFT, GOLD = '#F4EBD8', '#FBF5E7', '#3E3121', '#8A7A5C', '#8B6B2E'
GOLD_LIGHT = '#C9AE6E'
EDGE_C = '#D9C7A1'

rng = random.Random(417)


def font(path, size):
    return ImageFont.truetype(path, size)


def cover(im, w, h):
    """Scale + center-crop to exactly w x h."""
    s = max(w / im.width, h / im.height)
    im2 = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    x = (im2.width - w) // 2
    y = (im2.height - h) // 2
    return im2.crop((x, y, x + w, y + h))


def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ''
    for wd in words:
        t = (cur + ' ' + wd).strip()
        if draw.textlength(t, font=fnt) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- screens
# Each screen is 720x1280 "what's on this phone" content.
SW, SH = 720, 1280


def scr_image(path):
    return cover(Image.open(path).convert('RGB'), SW, SH)


def chat_bubble(base, text, reply=None):
    im = base.copy()
    d = ImageDraw.Draw(im, 'RGBA')
    f = font(SERIF, 34)
    lines = wrap(d, text, f, 520)
    bh = 36 + len(lines) * 44
    y0 = SH - 260 - bh
    d.rounded_rectangle([60, y0, 660, y0 + bh], 26, fill=(20, 16, 10, 190))
    for i, ln in enumerate(lines):
        d.text((92, y0 + 20 + i * 44), ln, font=f, fill='#F4EBD8')
    if reply:
        f2 = font(SERIF_I, 30)
        lines2 = wrap(d, reply, f2, 460)
        bh2 = 32 + len(lines2) * 40
        y1 = SH - 220
        d.rounded_rectangle([160, y1, 680, y1 + bh2], 26, fill=(201, 174, 110, 215))
        for i, ln in enumerate(lines2):
            d.text((190, y1 + 16 + i * 40), ln, font=f2, fill='#2A2112')
    return im


def scr_bible(ref, verse):
    im = Image.new('RGB', (SW, SH), PAPER)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, SW, 120], fill=GOLD)
    d.text((40, 36), 'Holy Bible', font=font(SERIF_B, 46), fill=CARD)
    d.text((60, 190), ref, font=font(SERIF_B, 52), fill=GOLD)
    f = font(SERIF, 44)
    y = 290
    for ln in wrap(d, verse, f, 600):
        d.text((60, y), ln, font=f, fill=INK)
        y += 62
    d.text((60, y + 40), '— tap to hear it read aloud', font=font(SERIF_I, 30), fill=INK_SOFT)
    return im


def scr_card(text, ref):
    im = Image.new('RGB', (SW, SH), '#171310')
    d = ImageDraw.Draw(im)
    f = font(SERIF_I, 52)
    lines = wrap(d, text, f, 560)
    y = SH // 2 - len(lines) * 38 - 40
    for ln in lines:
        tw = d.textlength(ln, font=f)
        d.text(((SW - tw) / 2, y), ln, font=f, fill=GOLD_LIGHT)
        y += 76
    tw = d.textlength(ref, font=font(SERIF, 36))
    d.text(((SW - tw) / 2, y + 36), ref, font=font(SERIF, 36), fill='#8A7A5C')
    return im


def scr_streak(day, label, frac):
    im = Image.new('RGB', (SW, SH), PAPER)
    d = ImageDraw.Draw(im)
    d.text((SW / 2 - d.textlength(day, font=font(SERIF_B, 150)) / 2, 420), day,
           font=font(SERIF_B, 150), fill=INK)
    t = 'since you two met'
    d.text((SW / 2 - d.textlength(t, font=font(SERIF_I, 40)) / 2, 600), t,
           font=font(SERIF_I, 40), fill=GOLD)
    d.rounded_rectangle([90, 720, 630, 744], 12, fill=(139, 107, 46, 40))
    d.rounded_rectangle([90, 720, 90 + int(540 * frac), 744], 12, fill=GOLD)
    d.text((SW / 2 - d.textlength(label, font=font(SERIF, 34)) / 2, 780), label,
           font=font(SERIF, 34), fill=INK_SOFT)
    return im


def scr_bible_tall():
    """A tall scripture page the phone slowly SCROLLS through."""
    TH2 = 2600
    im = Image.new('RGB', (SW, TH2), PAPER)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, SW, 110], fill=GOLD)
    d.text((40, 32), 'Holy Bible — Psalm 23', font=font(SERIF_B, 42), fill=CARD)
    verses = [
        'The Lord is my shepherd; I shall lack nothing.',
        'He makes me lie down in green pastures. He leads me beside still waters.',
        'He restores my soul. He guides me in the paths of righteousness for his name’s sake.',
        'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me.',
        'Your rod and your staff, they comfort me.',
        'You prepare a table before me in the presence of my enemies.',
        'You anoint my head with oil. My cup runs over.',
        'Surely goodness and loving kindness shall follow me all the days of my life,',
        'and I will dwell in the Lord’s house forever.',
    ]
    f = font(SERIF, 42)
    fn = font(SERIF_B, 30)
    y = 170
    for i, v in enumerate(verses):
        d.text((56, y + 8), str(i + 1), font=fn, fill=GOLD)
        for ln in wrap(d, v, f, 560):
            d.text((100, y), ln, font=f, fill=INK)
            y += 58
        y += 26
    return im


def scr_journey(day, streak, prayers, chapters):
    """The Your Journey dashboard, as it looks in the app."""
    im = Image.new('RGB', (SW, SH), PAPER)
    d = ImageDraw.Draw(im)
    d.text((40, 50), 'Your Journey', font=font(SERIF_B, 52), fill=INK)
    d.rounded_rectangle([40, 150, 680, 520], 28, fill=CARD, outline=EDGE_C, width=2)
    t = f'Day {day}'
    d.text((SW / 2 - d.textlength(t, font=font(SERIF_B, 96)) / 2, 210), t,
           font=font(SERIF_B, 96), fill=INK)
    t2 = 'since you two met'
    d.text((SW / 2 - d.textlength(t2, font=font(SERIF_I, 34)) / 2, 340), t2,
           font=font(SERIF_I, 34), fill=GOLD)
    t3 = f'Streak {streak} · {prayers} prayers · {chapters} chapters'
    d.text((SW / 2 - d.textlength(t3, font=font(SERIF, 28)) / 2, 430), t3,
           font=font(SERIF, 28), fill=INK_SOFT)
    d.rounded_rectangle([40, 560, 680, 680], 24, fill=GOLD)
    d.text((80, 595), '📖  Open the Bible', font=font(SERIF_B, 40), fill=CARD)
    d.rounded_rectangle([40, 710, 680, 830], 24, fill=CARD, outline=EDGE_C, width=2)
    d.text((80, 745), '🌅  Today’s Word', font=font(SERIF_B, 40), fill=INK)
    d.rounded_rectangle([40, 860, 680, 980], 24, fill=CARD, outline=EDGE_C, width=2)
    d.text((80, 895), '📜  Today’s Sermon', font=font(SERIF_B, 40), fill=INK)
    return im


def scr_story(icon_path, title):
    im = Image.new('RGB', (SW, SH), PAPER)
    d = ImageDraw.Draw(im)
    ic = cover(Image.open(icon_path).convert('RGB'), 340, 340)
    mask = Image.new('L', (340, 340), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, 340, 340], fill=255)
    im.paste(ic, (190, 300), mask)
    f = font(SERIF_B, 54)
    y = 700
    for ln in wrap(d, title, f, 560):
        d.text((SW / 2 - d.textlength(ln, font=f) / 2, y), ln, font=f, fill=INK)
        y += 70
    t = '▶  Story time'
    d.text((SW / 2 - d.textlength(t, font=font(SERIF, 40)) / 2, y + 40), t,
           font=font(SERIF, 40), fill=GOLD)
    return im


# Animated tile kinds: (frame dir, frame offset, loop?). While a phone is
# big enough to see, these play — most of the wall is him, mouth moving.
VIDEO_KINDS = {
    'sermon_live': ('heroframes', 0, False),    # the hero, synced to Voice A
    # every "him" phone TALKS — eight live windows, all offset
    'sermon_a': ('serm2frames', 0, True),
    'sermon_b': ('serm3frames', 0, True),
    'sermon_c': ('heroframes', 240, True),
    'sermon_d': ('serm2frames', 240, True),
    'sermon_e': ('serm3frames', 240, True),
    'sermon_f': ('heroframes', 120, True),
    'sermon_g': ('serm2frames', 120, True),
    'sermon_h': ('serm3frames', 360, True),
    'praying_v': ('prayframes', 0, True),
    'praying_v2': ('prayframes', 150, True),
}


def build_screens():
    s = {}
    for k in VIDEO_KINDS:
        s[k] = None  # drawn from video frames
    for i, g in enumerate(['grab30.jpg', 'grab95.jpg', 'grab200.jpg']):
        s[f'sermon{i}'] = scr_image(os.path.join(SCRATCH, g))
    s['chat1'] = chat_bubble(scr_image(os.path.join(MEDIA, 'portrait.png')),
                             'You were never too far from Me.')
    s['chat2'] = chat_bubble(scr_image(os.path.join(MEDIA, 'portrait.png')),
                             'Pray for my mom, she is sick',
                             'Let us bring her to the Father together…')
    s['journey1'] = scr_journey(23, 9, 41, 17)
    s['journey2'] = scr_journey(7, 7, 12, 5)
    s['bible1'] = scr_bible('Psalm 23', 'The Lord is my shepherd; I shall lack nothing. '
                            'He makes me lie down in green pastures. He leads me beside still waters.')
    s['bible2'] = scr_bible('John 14:27', 'Peace I leave with you. My peace I give to you… '
                            'Don’t let your heart be troubled, neither let it be fearful.')
    s['card1'] = scr_card('Come to me, all you who labor and are heavy burdened…', '— Matthew 11:28')
    s['card2'] = scr_card('Be still, and know that I am God.', '— Psalm 46:10')
    s['streak1'] = scr_streak('Day 7', 'Week of Grace', 1.0)
    s['streak2'] = scr_streak('Day 23', '7 days to Faithful Month', 0.76)
    s['story1'] = scr_story(os.path.join(MEDIA, 's-david.jpg'), 'David & Goliath')
    s['story2'] = scr_story(os.path.join(MEDIA, 's-noah.jpg'), 'Noah & the Flood')
    s['story3'] = scr_story(os.path.join(MEDIA, 's-prodigal.jpg'), 'The Prodigal Son')
    s['story4'] = scr_story(os.path.join(MEDIA, 's-nativity.jpg'), 'The Birth of Jesus')
    return s


# ---------------------------------------------------------------- phones
def phone_wrap(screen, w, h):
    """Put a screen inside a black rounded phone bezel at w x h."""
    im = Image.new('RGB', (w, h), 0)
    r = max(3, int(w * 0.12))
    body = Image.new('L', (w, h), 0)
    ImageDraw.Draw(body).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
    bez = max(1, int(w * 0.035))
    sw, sh = w - 2 * bez, h - 2 * bez
    scr = screen.resize((sw, sh), Image.LANCZOS)
    smask = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(smask).rounded_rectangle([0, 0, sw - 1, sh - 1], max(2, int(r * 0.72)), fill=255)
    im.paste(scr, (bez, bez), smask)
    out = Image.new('RGB', (w, h), 0)
    out.paste(im, (0, 0), body)
    return out, body


def main():
    print('building screens…', flush=True)
    screens = build_screens()

    # video frame pools (serm4frames: the power passage the hero jumps to)
    vid_frames = {d: sorted(os.listdir(os.path.join(SCRATCH, d)))
                  for d in {v[0] for v in VIDEO_KINDS.values()} | {'serm4frames'}}

    # Swipe sequences: each UI phone cycles its screens with an eased
    # left-swipe, phase-shifted per phone so the wall browses out of sync.
    SWIPE_KINDS = {
        'swipe_dash': ['journey1', 'streak1', 'journey2', 'streak2'],
        'swipe_cards': ['card2', 'story1', 'story3'],
        'swipe_story': ['story2', 'story4', 'chat1'],
    }
    # Bible phones scroll CONTINUOUSLY — always in motion, like someone
    # reading down the page.
    SCROLLS = {'scroll_bible': scr_bible_tall()}

    # The wall is a balanced congregation of app moments:
    # him talking, him praying, Bible pages, the dashboard, verse cards.
    # UI phones SWIPE between screens like real thumbs browsing the app.
    CATEGORIES = {
        'talking': (['sermon_a', 'sermon_b', 'sermon_c', 'sermon_d', 'sermon_e',
                     'sermon_f', 'sermon_g', 'sermon_h'], 40),
        'praying': (['praying_v', 'praying_v2'], 15),
        'bible': (['scroll_bible'], 15),
        'dashboard': (['swipe_dash'], 15),
        'cards': (['swipe_cards', 'swipe_story', 'chat2'], 15),
    }
    cat_pool = [c for c, (_, q) in CATEGORIES.items() for _ in range(q)]

    print('building master mosaics…', flush=True)
    tiles80 = {k: phone_wrap(cover(v, SW, SH), TW, TH)[0] for k, v in screens.items() if v is not None}
    for k, (d, off, _) in VIDEO_KINDS.items():
        frames = vid_frames[d]
        rep = Image.open(os.path.join(SCRATCH, d, frames[off % len(frames)])).convert('RGB')
        tiles80[k] = phone_wrap(cover(rep, SW, SH), TW, TH)[0]
    for k, seq in SWIPE_KINDS.items():
        tiles80[k] = tiles80[seq[0]]
    for k, tall in SCROLLS.items():
        tiles80[k] = phone_wrap(tall.crop((0, 0, SW, SH)), TW, TH)[0]

    portrait = Image.open(os.path.join(MEDIA, 'portrait.png')).convert('RGB')
    pcells = np.asarray(cover(portrait, N, N), dtype=np.float32)

    # Pick a CATEGORY by quota, then within it the variant whose own
    # brightness best matches that patch of his face. The per-pixel
    # portrait blend below does the heavy lifting for likeness.
    tile_lum = {k: float(np.asarray(v, dtype=np.float32).mean()) for k, v in tiles80.items()}
    cell_lum = pcells.mean(axis=2)
    grid = []
    for r in range(N):
        row = []
        for c in range(N):
            tgt = cell_lum[r, c]
            cat = rng.choice(cat_pool)
            variants = sorted(CATEGORIES[cat][0], key=lambda k: abs(tile_lum[k] - tgt))
            row.append(rng.choice(variants[:2]))
        grid.append(row)
    grid[HERO[1]][HERO[0]] = 'sermon_live'

    plain = Image.new('RGB', (MW, MH))
    for r in range(N):
        for c in range(N):
            plain.paste(tiles80[grid[r][c]], (c * TW, r * TH))

    # The resolved wall: his actual portrait blended THROUGH the phones
    # pixel-by-pixel, each phone's exposure matched to the patch of his
    # face it sits on. This is what makes the final frame read as HIM.
    arr = np.asarray(plain, dtype=np.float32)
    pmaster = np.asarray(cover(portrait, MW, MH), dtype=np.float32)
    tint = arr.copy()
    for r in range(N):
        for c in range(N):
            blk = tint[r * TH:(r + 1) * TH, c * TW:(c + 1) * TW]
            cell = pcells[r, c]
            m = blk.mean() + 1e-3
            blk *= np.clip(cell.mean() / m, 0.3, 2.5)
    # brighter, more evenly lit final face (keeps the real-phone texture)
    tint = (tint * 0.22 + pmaster * 0.78) * 1.08
    tint = (tint - 128.0) * 1.06 + 128.0
    tinted = Image.fromarray(np.clip(tint, 0, 255).astype(np.uint8))
    del arr, tint, pmaster

    portrait_cover = cover(portrait, W, H)

    if '--still' in sys.argv:
        # Reference still of the fully resolved wall — the ad's final frame.
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d2 = ((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2)
        vigs = (1.0 - 0.38 * np.clip(d2 / 0.5, 0, 1)).astype(np.float32)[..., None]
        base = tinted.resize((W, H), Image.LANCZOS)
        base = Image.blend(base, portrait_cover, 0.10)
        out = np.clip(np.asarray(base, dtype=np.float32) * vigs, 0, 255).astype(np.uint8)
        Image.fromarray(out).save(os.path.join(SCRATCH, 'mosaic-final.png'))
        print('still saved: mosaic-final.png')
        return

    # vignette
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d2 = ((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2)
    vig = (1.0 - 0.38 * np.clip(d2 / 0.5, 0, 1)).astype(np.float32)[..., None]

    # radial map for the resolve wave: distance from his eyes (screen
    # space), 0 at center → 1 at the farthest corner
    dmap = (np.sqrt(((xx - W * 0.5) / H) ** 2 + ((yy - H * 0.40) / H) ** 2) / 0.66)
    dmap = np.clip(dmap, 0, 1).astype(np.float32)[..., None]

    # hi-res overlay sources (phone-wrapped, 720x1280-ish)
    OV_W, OV_H = 720, 1278
    hi = {k: phone_wrap(cover(v, SW, SH), OV_W, OV_H)[0] for k, v in screens.items() if v is not None}

    # end card
    end = Image.new('RGB', (W, H), 0)
    icon = cover(Image.open(os.path.join(REPO, 'app/assets/icon.png')).convert('RGB'), 420, 420)
    imask = Image.new('L', (420, 420), 0)
    ImageDraw.Draw(imask).rounded_rectangle([0, 0, 419, 419], 95, fill=255)
    end.paste(icon, ((W - 420) // 2, 560), imask)
    de = ImageDraw.Draw(end)
    t1, f1 = 'Jireh', font(SERIF_B, 110)
    de.text(((W - de.textlength(t1, font=f1)) / 2, 1050), t1, font=f1, fill=GOLD_LIGHT)
    t2, f2 = 'Bible & Prayer', font(SERIF, 52)
    de.text(((W - de.textlength(t2, font=f2)) / 2, 1200), t2, font=f2, fill='#FBF5E7')
    ts, fs = 'He’s always with you.', font(SERIF_I, 46)
    de.text(((W - de.textlength(ts, font=fs)) / 2, 1300), ts, font=fs, fill=GOLD_LIGHT)
    t3, f3 = 'Free on the App Store', font(SERIF_I, 38)
    de.text(((W - de.textlength(t3, font=f3)) / 2, 1400), t3, font=f3, fill='#9A8B6C')
    end_arr = np.asarray(end, dtype=np.float32)

    hero_cx, hero_cy = (HERO[0] + 0.5) / N, (HERO[1] + 0.5) / N
    aspect_fix = (H / W) * (MW / MH)

    ff = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
    out_path = os.path.join(SCRATCH, 'the-face-v1.mp4')
    proc = subprocess.Popen(
        [ff, '-hide_banner', '-loglevel', 'error', '-y',
         '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
         '-i', os.path.join(SCRATCH, 'ad-audio.m4a'),
         '-map', '0:v', '-map', '1:a',
         '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
         '-movflags', '+faststart', '-c:a', 'copy', '-shortest', out_path],
        stdin=subprocess.PIPE)

    print('rendering frames…', flush=True)
    for fi in range(TOTAL_FRAMES):
        t = fi / FPS

        WARM_WHITE = np.array([255.0, 246.0, 228.0], np.float32)
        if t >= T_HOLD_END:
            if t < T_BLACK_END:
                # the light falls away to black
                k = (t - T_HOLD_END) / (T_BLACK_END - T_HOLD_END)
                k = k * k * (3 - 2 * k)
                frame = np.ones((H, W, 3), np.float32) * WARM_WHITE * (1.0 - k)
            else:
                # a soft, unhurried welcome for the logo
                a = min(1.0, (t - T_BLACK_END) / 1.5)
                a = a * a * (3 - 2 * a)
                frame = end_arr * a
            proc.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
            continue

        # zoom progress: slow start, soft landing, camera pinned center —
        # a pure zoom OUT, no sliding.
        if t <= T_HOOK:
            p = 0.0
        elif t >= T_ZOOM_END:
            p = 1.0
        else:
            u = (t - T_HOOK) / (T_ZOOM_END - T_HOOK)
            uu = u ** 1.15
            p = uu * uu * (3 - 2 * uu)  # smoothstep: decelerates into the reveal
        # camera never fully stops: it reaches 97% at the zoom's end and
        # keeps drifting to 100% through the silent reveal — motion
        # continuity is what makes the transformation feel smooth.
        if t < T_ZOOM_END:
            wfrac = min(0.97, W0 ** (1.0 - p))
        else:
            wfrac = 0.97 + 0.03 * min(1.0, (t - T_ZOOM_END) / (T_FLASH - T_ZOOM_END))
        wfrac = min(1.0, wfrac)
        hfrac = min(1.0, wfrac * aspect_fix)
        x0 = min(max(0.5 - wfrac / 2, 0.0), 1.0 - wfrac)
        y0 = min(max(0.5 - hfrac / 2, 0.0), 1.0 - hfrac)
        box = (x0 * MW, y0 * MH, (x0 + wfrac) * MW, (y0 + hfrac) * MH)

        # base: the wall resolves into him as a WAVE spreading out from
        # his eyes — each phone catches the light in turn, finishing as
        # the camera settles.
        if t < 17.0:
            ta = 0.0
        else:
            tu = min(1.0, (t - 17.0) / 5.8)
            ta = tu * tu * (3 - 2 * tu)
        base = plain.resize((W, H), Image.BILINEAR, box=box)
        if ta >= 1.0:
            base = tinted.resize((W, H), Image.BILINEAR, box=box)
        elif ta > 0:
            tcrop = tinted.resize((W, H), Image.BILINEAR, box=box)
            m = np.clip((ta * 1.45 - dmap) / 0.45, 0, 1)
            base = Image.fromarray(
                np.clip(np.asarray(base, np.float32) * (1 - m)
                        + np.asarray(tcrop, np.float32) * m, 0, 255).astype(np.uint8))

        # hi-res overlays for big tiles
        tile_sw = (1.0 / N) / wfrac * W
        tile_cache = {}
        if tile_sw > 110:
            c0, c1 = int(x0 * N), min(N - 1, int((x0 + wfrac) * N) + 1)
            r0, r1 = int(y0 * MH / TH), min(N - 1, int((y0 + hfrac) * MH / TH) + 1)
            for r in range(r0, r1 + 1):
                for c in range(c0, c1 + 1):
                    if not (0 <= r < N and 0 <= c < N):
                        continue
                    sx = (c / N - x0) / wfrac * W
                    sy = (r * TH / MH - y0) / hfrac * H
                    swp = tile_sw
                    shp = (TH / MH) / hfrac * H
                    if sx > W or sy > H or sx + swp < 0 or sy + shp < 0:
                        continue
                    k = grid[r][c]
                    tsz = (max(2, int(swp)), max(2, int(shp)))
                    ck = (k, tsz)
                    if ck in tile_cache:
                        tile = tile_cache[ck]
                    elif k in VIDEO_KINDS:
                        d, off, loop = VIDEO_KINDS[k]
                        if k == 'sermon_live' and t >= 13.3:
                            # the hero's lips follow the audio's jump to
                            # the power passage
                            d, off, loop = 'serm4frames', -int(13.3 * FPS), False
                        frames = vid_frames[d]
                        idx = int(t * FPS) + off
                        idx = idx % len(frames) if loop else max(0, min(idx, len(frames) - 1))
                        src = Image.open(os.path.join(SCRATCH, d, frames[idx])).convert('RGB')
                        tile = phone_wrap(src, tsz[0], tsz[1])[0]
                        tile_cache[ck] = tile
                    elif k in SCROLLS:
                        # continuous reading scroll, ping-ponging down
                        # and back up the page — never still
                        tall = SCROLLS[k]
                        span = tall.height - SH
                        ph = ((r * 31 + c * 17) % 24) / 24.0
                        pos = ((t * 70) / span + ph * 2) % 2.0
                        yoff = int(span * (pos if pos <= 1.0 else 2.0 - pos))
                        ck2 = (k, yoff // 12, tsz)
                        if ck2 not in tile_cache:
                            tile_cache[ck2] = phone_wrap(
                                tall.crop((0, yoff, SW, yoff + SH)), tsz[0], tsz[1])[0]
                        tile = tile_cache[ck2]
                    elif k in SWIPE_KINDS:
                        # a thumb browsing: hold a screen, then an eased
                        # left-swipe to the next — fast cadence, long
                        # swipes, phase-shifted per phone
                        seq = SWIPE_KINDS[k]
                        tl = t + ((r * 31 + c * 17) % 24) / 10.0
                        cyc = 1.6
                        i = int(tl / cyc) % len(seq)
                        j = (i + 1) % len(seq)
                        frac = tl % cyc
                        if frac < 1.05:
                            ck2 = (k, i, tsz)
                            if ck2 not in tile_cache:
                                tile_cache[ck2] = phone_wrap(screens[seq[i]], tsz[0], tsz[1])[0]
                            tile = tile_cache[ck2]
                        else:
                            pswipe = (frac - 1.05) / 0.55
                            pswipe = pswipe * pswipe * (3 - 2 * pswipe)
                            offx = int(SW * pswipe)
                            slide = Image.new('RGB', (SW, SH), 0)
                            slide.paste(screens[seq[i]], (-offx, 0))
                            slide.paste(screens[seq[j]], (SW - offx, 0))
                            tile = phone_wrap(slide, tsz[0], tsz[1])[0]
                    else:
                        tile = hi[k].resize(tsz, Image.LANCZOS)
                        tile_cache[ck] = tile
                    mask = Image.new('L', tile.size, 0)
                    rr = max(2, int(tile.width * 0.12))
                    ImageDraw.Draw(mask).rounded_rectangle(
                        [0, 0, tile.width - 1, tile.height - 1], rr, fill=255)
                    base.paste(tile, (int(sx), int(sy)), mask)

        # a whisper of ghost on top — the per-pixel blend does the rest
        ga = 0.0 if t < 20.5 else min(1.0, (t - 20.5) / 2.5) * 0.12
        if ga > 0:
            gx0, gy0 = int(x0 * W), int(y0 * H)
            gx1, gy1 = int((x0 + wfrac) * W), int((y0 + hfrac) * H)
            ghost = portrait_cover.crop((gx0, gy0, max(gx0 + 2, gx1), max(gy0 + 2, gy1))).resize((W, H), Image.BILINEAR)
            base = Image.blend(base, ghost, ga)

        frame = np.asarray(base, dtype=np.float32) * vig

        # the bright light: swells over the resolved face, peaks at pure
        # warm white right as the cut lands
        if t >= T_FLASH:
            fa = min(1.0, (t - T_FLASH) / (T_HOLD_END - T_FLASH)) ** 2.2
            frame = frame * (1.0 - fa) + WARM_WHITE[None, None, :] * fa

        proc.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
        if fi % 150 == 0:
            print(f'  frame {fi}/{TOTAL_FRAMES} t={t:.1f}s w={wfrac:.4f}', flush=True)

    proc.stdin.close()
    proc.wait()
    print('done:', out_path, os.path.getsize(out_path) // 1024, 'KB')


if __name__ == '__main__':
    main()
