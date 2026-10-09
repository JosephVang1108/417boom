// Abide backend proxy.
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
app.use(express.json({ limit: '25mb' }));

// --- auth -------------------------------------------------------------
app.use((req, res, next) => {
  // Recorded media is public content (no user data, no AI spend).
  if (req.path === '/health' || req.path.startsWith('/media/')) return next();
  const token = req.headers['x-api-key'] || req.query.token;
  if (token !== APP_TOKEN) {
    return res.status(401).json({ error: 'invalid app token' });
  }
  next();
});

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
    const upstream = await fetch(MEDIA_RELEASE + file, { headers });
    if (!(upstream.status === 200 || upstream.status === 206)) {
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
    Readable.fromWeb(upstream.body).pipe(res);
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
// GET /tts?text=...&story=1&voice=<optional override>
app.get('/tts', async (req, res) => {
  const text = String(req.query.text || '').slice(0, 6000);
  if (!text.trim()) return res.status(400).json({ error: 'text required' });
  const story = req.query.story === '1';
  const pray = req.query.pray === '1';

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
            // the language: stories get real inflection, prayers a
            // touch of warmth, conversation stays steady.
            stability: story ? 0.5 : pray ? 0.7 : 0.75,
            similarity_boost: 0.9,
            style: story ? 0.45 : pray ? 0.2 : 0.1,
            use_speaker_boost: true,
            // He never rushes. Prayers slowest of all, stories take
            // their time, conversation stays gentle.
            speed: pray ? 0.85 : story ? 0.88 : 0.92,
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
            .update(JSON.stringify(['read-v1', requestedVoice, text]))
            .digest('hex') + '.mp3'
        )
      : null;
    if (cacheFile && fs.existsSync(cacheFile)) {
      res.status(200).type('audio/mpeg');
      fs.createReadStream(cacheFile).pipe(res);
      return;
    }

    const voices = [requestedVoice, FALLBACK_VOICE_ID];
    // Turbo for EVERYTHING: it is the fastest engine, the cheapest, and
    // the only one that hard-pins the language to English — multilingual
    // v2 guesses the accent per request, which is where the British
    // prayers came from. Multilingual stays only as the last resort.
    const models = ['eleven_turbo_v2_5', 'eleven_multilingual_v2'];
    let upstream = null;
    outer: for (const v of voices) {
      for (const m of models) {
        upstream = await request(v, m);
        if (upstream.ok || upstream.status >= 500) break outer;
      }
    }
    if (!upstream || !upstream.ok) {
      return res.status(502).json({ error: 'voice generation failed' });
    }
    res.status(200).type('audio/mpeg');
    const audio = Readable.fromWeb(upstream.body);
    audio.pipe(res);

    if (cacheFile) {
      // Tee the stream into the cache; only a COMPLETE file is kept
      // ('wx' also means two simultaneous first listeners can't clash).
      const partFile = cacheFile + '.part';
      try {
        const sink = fs.createWriteStream(partFile, { flags: 'wx' });
        let failed = false;
        const scrap = () => {
          failed = true;
          sink.destroy();
          fs.promises.unlink(partFile).catch(() => {});
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

app.listen(PORT, () => {
  console.log(`Abide server listening on :${PORT}`);
});
