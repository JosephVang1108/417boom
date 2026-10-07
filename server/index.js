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
  if (req.path === '/health') return next();
  const token = req.headers['x-api-key'] || req.query.token;
  if (token !== APP_TOKEN) {
    return res.status(401).json({ error: 'invalid app token' });
  }
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

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
            stability: 0.75,
            similarity_boost: 0.9,
            style: 0.0,
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
    const voices = [String(req.query.voice || VOICE_ID), FALLBACK_VOICE_ID];
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
    Readable.fromWeb(upstream.body).pipe(res);
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
