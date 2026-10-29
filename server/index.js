// Jireh backend proxy.
//
// Holds the real API keys (environment variables) and exposes:
//   POST /v1/messages  — Claude chat, wire-compatible with the Anthropic API,
//                        so the app's Anthropic SDK just points here.
//   GET  /tts          — ElevenLabs text-to-speech, STREAMED as it generates
//                        (the app starts playing before generation finishes).
//   POST /stt          — ElevenLabs speech-to-text (audio as base64 JSON).
//   GET  /health       — liveness check.
//
// Auth: every request must carry the shared app token — either in the
// x-api-key header (what the Anthropic SDK sends) or ?token= query param.
//
// Required environment variables:
//   APP_TOKEN            shared secret the app presents (any long random string)
//   ANTHROPIC_API_KEY    real Claude key
//   ELEVENLABS_API_KEY   real ElevenLabs key
// Optional:
//   VOICE_ID             default ElevenLabs voice (falls back to the Abide voice)
//   PORT                 listen port (default 8787)

const express = require('express');
const { Readable } = require('node:stream');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Bible-reading audio cache: scripture never changes, so each passage
// is generated ONCE per voice and replayed free forever after. Lives
// on local disk — ephemeral on Render (cleared by deploys), so it
// rebuilds itself; attach a persistent disk later to make it eternal.
const CACHE_DIR = process.env.AUDIO_CACHE_DIR || path.join(__dirname, 'tts-cache');
try {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} catch (err) {
  console.error('cache dir unavailable', err);
}

const {
  APP_TOKEN,
  ANTHROPIC_API_KEY,
  ELEVENLABS_API_KEY,
  VOICE_ID = 'R9YQn8ytiYIfkeIr8wyN',
  PORT = 8787,
} = process.env;

if (!APP_TOKEN || !ANTHROPIC_API_KEY || !ELEVENLABS_API_KEY) {
  console.error(
    'Missing required env vars: APP_TOKEN, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY'
  );
  process.exit(1);
}

const FALLBACK_VOICE_ID = 'nPczCjzI2devNBz1zQrb'; // "Brian"

const app = express();

// --- auth -------------------------------------------------------------
// BEFORE the body parser: an unauthenticated request must be rejected
// from its headers alone, not after we buffered and parsed its body.
app.use((req, res, next) => {
  // Recorded media is public content (no user data, no AI spend).
  if (req.path === '/health' || req.path.startsWith('/media/')) return next();
  const token = req.headers['x-api-key'] || req.query.token;
  if (token !== APP_TOKEN) {
    return res.status(401).json({ error: 'invalid app token' });
  }
  next();
});

// --- rate limits ------------------------------------------------------
// The app token is shared by every install (and the repo is public),
// so the server must not trust clients to behave. Two layers:
//   per-IP sliding hourly windows — one abusive device can't monopolize
//   global daily circuit breakers — even a botnet can only burn one
//     day's allowance before getting 429s; the prepaid/no-overage
//     billing caps above this are the final wall.
// In-memory is fine: one Render instance, and a restart resetting the
// counters is harmless.
app.set('trust proxy', 1); // Render sits in front; req.ip = client IP

const HOUR = 3600_000;
const PER_IP_HOURLY = { '/v1/messages': 60, '/tts': 150, '/stt': 90 };
const GLOBAL_DAILY = { '/v1/messages': 3000, '/tts': 8000, '/stt': 4000 };

const ipHits = new Map(); // ip -> { route -> [timestamps] }
let globalDay = new Date().toDateString();
const globalCounts = {};

setInterval(() => {
  // Sweep idle IPs so the map can't grow forever.
  const cutoff = Date.now() - HOUR;
  for (const [ip, routes] of ipHits) {
    let alive = false;
    for (const [r, times] of Object.entries(routes)) {
      routes[r] = times.filter((t) => t > cutoff);
      if (routes[r].length) alive = true;
    }
    if (!alive) ipHits.delete(ip);
  }
}, 10 * 60_000).unref();

app.use((req, res, next) => {
  const route = Object.keys(PER_IP_HOURLY).find((r) => req.path.startsWith(r));
  if (!route) return next();

  const today = new Date().toDateString();
  if (today !== globalDay) {
    globalDay = today;
    for (const k of Object.keys(globalCounts)) globalCounts[k] = 0;
  }
  globalCounts[route] = (globalCounts[route] || 0) + 1;
  if (globalCounts[route] > GLOBAL_DAILY[route]) {
    return res.status(429).json({ error: 'resting for today — try tomorrow' });
  }

  const ip = req.ip || 'unknown';
  const now = Date.now();
  let routes = ipHits.get(ip);
  if (!routes) ipHits.set(ip, (routes = {}));
  const times = (routes[route] = (routes[route] || []).filter(
    (t) => t > now - HOUR
  ));
  if (times.length >= PER_IP_HOURLY[route]) {
    return res.status(429).json({ error: 'too many requests — slow down' });
  }
  times.push(now);
  next();
});

// Only /stt carries real payload (base64 voice recordings); everything
// else is small JSON.
app.use('/stt', express.json({ limit: '25mb' }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// --- Recorded media, proxied with honest headers ----------------------
// The videos live as GitHub release assets, but GitHub serves them as
// application/octet-stream behind a redirect, which the iPhone player
// refuses to play. This route streams the same bytes with a proper
// video/mp4 content type and Range support (required for scrubbing).
const MEDIA_RELEASE =
  'https://github.com/JosephVang1108/417boom/releases/download/media/';

app.get('/media/:file', async (req, res) => {
  const file = String(req.params.file || '');
  if (!/^[a-z0-9][a-z0-9.-]*\.mp4$/.test(file)) {
    return res.status(404).json({ error: 'not found' });
  }
  try {
    const headers = {};
    if (req.headers.range) headers.range = req.headers.range;
    // No abort timeout here: the signal would also cut off the body,
    // and a sermon stream legitimately runs for minutes.
    const upstream = await fetch(MEDIA_RELEASE + file, { headers });
    if (!(upstream.status === 200 || upstream.status === 206)) {
      upstream.body?.cancel().catch(() => {}); // release the connection
      return res
        .status(upstream.status === 404 ? 404 : 502)
        .json({ error: 'media unavailable' });
    }
    res.status(upstream.status);
    res.set('content-type', 'video/mp4');
    res.set('accept-ranges', 'bytes');
    for (const h of ['content-length', 'content-range']) {
      const v = upstream.headers.get(h);
      if (v) res.set(h, v);
    }
    // An 'error' on an unhandled source stream KILLS the whole process —
    // GitHub resetting a long video stream must only end this response.
    const media = Readable.fromWeb(upstream.body);
    media.on('error', () => res.destroy());
    media.pipe(res);
  } catch (err) {
    console.error('media error', err);
    if (!res.headersSent) res.status(502).json({ error: 'upstream failure' });
  }
});

// --- Claude chat (Anthropic-wire-compatible) --------------------------
app.post('/v1/messages', async (req, res) => {
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version':
          req.headers['anthropic-version'] || '2023-06-01',
      },
      body: JSON.stringify(req.body),
      // Stories take a while to write; a hung socket must not pin the
      // client forever.
      signal: AbortSignal.timeout(120_000),
    });
    const text = await upstream.text();
    res
      .status(upstream.status)
      .type(upstream.headers.get('content-type') || 'application/json')
      .send(text);
  } catch (err) {
    console.error('chat error', err);
    res.status(502).json({ error: 'upstream failure' });
  }
});

// --- Text-to-speech, streamed ----------------------------------------
// GET /tts?text=...&story=1&voice=<optional override>&model=<optional override>
app.get('/tts', async (req, res) => {
  const text = String(req.query.text || '').slice(0, 6000);
  if (!text.trim()) return res.status(400).json({ error: 'text required' });
  const story = req.query.story === '1';
  const pray = req.query.pray === '1';
  // The render pipeline may pin the engine: the same voice sounds audibly
  // different per model (turbo is brighter than v3/multilingual), and
  // published videos must stay timbre-consistent with earlier takes.
  const ALLOWED_MODELS = [
    'eleven_v3',
    'eleven_turbo_v2_5',
    'eleven_multilingual_v2',
  ];
  const requestedModel = ALLOWED_MODELS.includes(String(req.query.model))
    ? String(req.query.model)
    : null;

  const request = (voiceId, model) => {
    const speakable =
      model === 'eleven_v3'
        ? text
        : text.replace(/\[[^\]]*\]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    // Always maximum-consistency settings. Low stability lets the
    // expressive engines drift the ACCENT mid-passage (he slid into
    // British a few minutes into stories) — never again. Robust on v3,
    // high stability + zero style on v2.
    const voice_settings =
      model === 'eleven_v3'
        ? { stability: 1.0, use_speaker_boost: true }
        : {
            // Expressiveness is safe to give back now that Turbo pins
            // the language: stories get real inflection, prayers sit
            // between conversation and stories, conversation stays steady.
            stability: story ? 0.5 : pray ? 0.55 : 0.75,
            similarity_boost: 0.9,
            style: story ? 0.45 : pray ? 0.35 : 0.1,
            use_speaker_boost: true,
            // He never rushes, but slowing the engine irons the melody
            // flat — prayers run at conversation pace, which is the mode
            // listeners consistently call natural.
            speed: story ? 0.88 : 0.92,
          };
    // Turbo supports pinning the language — do it so long Bible
    // passages can't wander either.
    const body = {
      text: speakable,
      model_id: model,
      voice_settings,
      seed: 42,
    };
    if (model === 'eleven_turbo_v2_5') body.language_code = 'en';
    return fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        // Generous: the signal governs the whole body, and a long
        // passage streams for a couple of minutes. This only exists so
        // a HUNG socket can't pin the request forever.
        signal: AbortSignal.timeout(180_000),
      }
    );
  };

  try {
    const requestedVoice = String(req.query.voice || VOICE_ID);

    // Scripture reading (read=1) is cached: the text never changes, so
    // pay ElevenLabs once per passage per voice, then serve the saved
    // file free forever. Conversation and stories are unique each time
    // and are never cached.
    const cacheable = req.query.read === '1';
    const cacheFile = cacheable
      ? path.join(
          CACHE_DIR,
          crypto
            .createHash('sha256')
            .update(
              JSON.stringify([
                'read-v1',
                requestedVoice,
                text,
                requestedModel || 'auto',
              ])
            )
            .digest('hex') + '.mp3'
        )
      : null;
    if (cacheFile && fs.existsSync(cacheFile)) {
      res.status(200).type('audio/mpeg');
      const cached = fs.createReadStream(cacheFile);
      cached.on('error', () => res.destroy()); // deleted between check and open
      cached.pipe(res);
      return;
    }

    const voices = [requestedVoice, FALLBACK_VOICE_ID];
    // Turbo for EVERYTHING: it is the fastest engine, the cheapest, and
    // the only one that hard-pins the language to English — multilingual
    // v2 guesses the accent per request, which is where the British
    // prayers came from. Multilingual stays only as the last resort.
    const models = requestedModel
      ? [requestedModel]
      : ['eleven_turbo_v2_5', 'eleven_multilingual_v2'];
    let upstream = null;
    let usedVoice = null;
    let usedModel = null;
    outer: for (const v of voices) {
      for (const m of models) {
        upstream = await request(v, m);
        if (upstream.ok || upstream.status >= 500) {
          usedVoice = v;
          usedModel = m;
          break outer;
        }
        // Failed attempt: drop its body or the connection stays held.
        upstream.body?.cancel().catch(() => {});
      }
    }
    if (!upstream || !upstream.ok) {
      upstream?.body?.cancel().catch(() => {});
      return res.status(502).json({ error: 'voice generation failed' });
    }
    // Which voice/model actually spoke — the fallback chain is silent by
    // design for the app, but the video render pipeline must be able to
    // detect a fallback take and re-request rather than ship it.
    res.set('x-jireh-voice', usedVoice);
    res.set('x-jireh-model', usedModel);
    res.status(200).type('audio/mpeg');
    const audio = Readable.fromWeb(upstream.body);
    // Without a listener, a mid-stream ElevenLabs error would crash the
    // whole process; the cache tee below adds its own on top of this.
    audio.on('error', () => res.destroy());
    audio.pipe(res);

    if (cacheFile) {
      // Tee the stream into the cache; only a COMPLETE file is kept
      // ('wx' also means two simultaneous first listeners can't clash).
      const partFile = cacheFile + '.part';
      try {
        const sink = fs.createWriteStream(partFile, { flags: 'wx' });
        // 'wx' rejects an existing part file ASYNCHRONOUSLY (an 'error'
        // event, not a throw) — so only unlink once we know the file is
        // OURS, or a second simultaneous listener would delete the
        // first one's in-progress write.
        let owned = false;
        sink.on('open', () => {
          owned = true;
        });
        let failed = false;
        const scrap = () => {
          failed = true;
          sink.destroy();
          if (owned) fs.promises.unlink(partFile).catch(() => {});
        };
        sink.on('error', scrap);
        audio.on('error', scrap);
        audio.pipe(sink);
        sink.on('finish', () => {
          if (!failed) fs.promises.rename(partFile, cacheFile).catch(() => {});
        });
      } catch {
        // another listener is already writing it — just stream
      }
    }
  } catch (err) {
    console.error('tts error', err);
    if (!res.headersSent) res.status(502).json({ error: 'upstream failure' });
  }
});

// --- Speech-to-text ---------------------------------------------------
// POST /stt  { audioBase64: "...", mimeType: "audio/mp4" }
app.post('/stt', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/mp4' } = req.body || {};
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 required' });
    }
    const bytes = Buffer.from(audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: mimeType }), 'speech.m4a');
    form.append('model_id', 'scribe_v1');
    const upstream = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    const json = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'transcription failed' });
    }
    res.json({ text: typeof json.text === 'string' ? json.text.trim() : '' });
  } catch (err) {
    console.error('stt error', err);
    res.status(502).json({ error: 'upstream failure' });
  }
});

// Last-resort safety net: one bad stream or forgotten rejection must
// never take the server down for every user at once. Log and carry on.
process.on('uncaughtException', (err) => {
  console.error('uncaught exception', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandled rejection', err);
});

app.listen(PORT, () => {
  console.log(`Jireh server listening on :${PORT}`);
});
