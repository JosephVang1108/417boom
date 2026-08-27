import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import { BACKEND_TOKEN, BACKEND_URL, backendConfigured } from './config';

const KEY_STORAGE = 'elevenlabs_api_key';
const VOICE_ID_STORAGE = 'elevenlabs_voice_id';

// The "Abide" voice — designed with ElevenLabs Voice Design: deep,
// soft-spoken, ancient yet kind. Falls back to "Brian" (deep, calm)
// for accounts that don't have it.
const ELEVEN_VOICE_ID = 'pdNm5Q6lQvK6VrviGGq1';
const ELEVEN_FALLBACK_VOICE_ID = 'nPczCjzI2devNBz1zQrb';

// One engine for every reply so accent and pacing never shift between
// (or within) messages: expressive v3 at its most consistent setting,
// with a fixed seed. Multilingual v2 is the universal fallback.
type ElevenModel = 'eleven_v3' | 'eleven_turbo_v2_5' | 'eleven_multilingual_v2';
const VOICE_SEED = 42;

let elevenKey: string | null = null;
let customVoiceId: string | null = null;
let currentPlayer: AudioPlayer | null = null;
let audioModeReady = false;
let generation = 0; // invalidates in-flight speech when stop() is called
let fileCounter = 0;

export async function loadVoiceKey(): Promise<boolean> {
  try {
    elevenKey = await SecureStore.getItemAsync(KEY_STORAGE);
    customVoiceId = await SecureStore.getItemAsync(VOICE_ID_STORAGE);
  } catch {
    elevenKey = null;
    customVoiceId = null;
  }
  return !!elevenKey;
}

export async function setVoiceKey(key: string): Promise<void> {
  const trimmed = key.trim();
  elevenKey = trimmed || null;
  try {
    if (trimmed) {
      await SecureStore.setItemAsync(KEY_STORAGE, trimmed);
    } else {
      await SecureStore.deleteItemAsync(KEY_STORAGE);
    }
  } catch {
    // Storage unavailable — key still works for this session.
  }
}

export function hasVoiceKey(): boolean {
  return !!elevenKey;
}

/** Natural voice is possible: the backend is configured, or a key is set. */
export function voiceAvailable(): boolean {
  return backendConfigured() || !!elevenKey;
}

export async function setCustomVoiceId(id: string): Promise<void> {
  const trimmed = id.trim();
  customVoiceId = trimmed || null;
  try {
    if (trimmed) {
      await SecureStore.setItemAsync(VOICE_ID_STORAGE, trimmed);
    } else {
      await SecureStore.deleteItemAsync(VOICE_ID_STORAGE);
    }
  } catch {
    // Storage unavailable — id still applies this session.
  }
}

export function getCustomVoiceId(): string | null {
  return customVoiceId;
}

export interface SpeakOptions {
  /** Storytelling delivery: livelier, more expressive pacing. */
  story?: boolean;
  /** Long-form reading (Bible chapters): fast engine, quick start. */
  read?: boolean;
}

/**
 * Generate speech audio with ElevenLabs and return the local file uri,
 * or null when unavailable (no key, network error, all voices refused).
 * Does not play anything — pair with playUri. Safe to call while other
 * audio is playing (used to pre-generate the next Bible passage).
 */
export async function synthesize(
  text: string,
  options: SpeakOptions = {}
): Promise<string | null> {
  if (!audioModeReady) {
    // Play even when the iPhone silent switch is on.
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      audioModeReady = true;
    } catch {
      // non-fatal
    }
  }

  // Backend mode: the server streams the audio, so the "file" is simply
  // its URL — playback starts while generation is still in progress.
  if (backendConfigured()) {
    const params = new URLSearchParams({
      token: BACKEND_TOKEN!,
      text,
      ...(options.story ? { story: '1' } : {}),
      ...(options.read ? { read: '1' } : {}),
      ...(customVoiceId ? { voice: customVoiceId } : {}),
    });
    return `${BACKEND_URL}/tts?${params.toString()}`;
  }

  if (!elevenKey) return null;
  try {

    const request = (voiceId: string, model: ElevenModel) => {
      // v3 is expressive on its own and rejects some v2 settings —
      // keep its config minimal; v2 gets tuned settings.
      // Non-v3 models don't perform [audio tags], so strip them there.
      const speakable =
        model === 'eleven_v3'
          ? text
          : text.replace(/\[[^\]]*\]/g, '').replace(/\s{2,}/g, ' ').trim();
      const voice_settings =
        model === 'eleven_v3'
          ? {
              // Stories get the Natural (expressive) setting for lively
              // telling; conversation stays on Robust for consistency.
              stability: options.story ? 0.5 : 1.0,
              use_speaker_boost: true,
            }
          : {
              stability: options.story ? 0.45 : 0.65,
              similarity_boost: 0.85,
              style: options.story ? 0.35 : 0.1,
              use_speaker_boost: true,
              speed: options.story ? 1.05 : 0.95,
            };
      return fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: speakable,
            model_id: model,
            voice_settings,
            seed: VOICE_SEED,
          }),
        }
      );
    };

    const models: ElevenModel[] = options.read
      ? ['eleven_turbo_v2_5', 'eleven_multilingual_v2']
      : ['eleven_v3', 'eleven_multilingual_v2'];
    const candidates = [
      ...(customVoiceId ? [customVoiceId] : []),
      ELEVEN_VOICE_ID,
      ELEVEN_FALLBACK_VOICE_ID,
    ];
    let res: Response | null = null;
    outer: for (const voiceId of candidates) {
      for (const model of models) {
        res = await request(voiceId, model);
        if (res.ok || res.status >= 500) break outer;
      }
    }
    if (!res || !res.ok) return null;

    const bytes = new Uint8Array(await res.arrayBuffer());
    const path = `${FileSystem.cacheDirectory}abide-voice-${++fileCounter}.mp3`;
    await FileSystem.writeAsStringAsync(path, toBase64(bytes), {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  } catch {
    return null;
  }
}

/**
 * Play a local audio file (from synthesize), replacing any current
 * playback. onDone fires when it finishes naturally — not when stopped.
 */
export function playUri(uri: string, onDone: () => void): void {
  if (currentPlayer) {
    const p = currentPlayer;
    currentPlayer = null;
    try {
      p.pause();
      p.remove();
    } catch {
      // already released
    }
  }
  const player = createAudioPlayer({ uri });
  currentPlayer = player;
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      if (currentPlayer === player) currentPlayer = null;
      try {
        player.remove();
      } catch {
        // already released
      }
      onDone();
    }
  });
  player.play();
}

/**
 * Speak text aloud. Uses ElevenLabs when a key is set; otherwise falls
 * back to the device voice, preferring a calm male one. onDone fires
 * when playback finishes, is stopped, or errors.
 */
export async function speak(
  text: string,
  onDone: () => void,
  options: SpeakOptions = {}
): Promise<void> {
  stop();
  const myGen = ++generation;

  if (elevenKey || backendConfigured()) {
    // Long text (stories, prayers): split at sentence boundaries and
    // pipeline — a short opener starts quickly, and each next passage
    // is generated while the previous one plays.
    if (text.length > 1300) {
      const chunks = splitForSpeech(text);
      let upcoming = synthesize(chunks[0], options);
      const playFrom = async (i: number) => {
        const uri = await upcoming;
        if (myGen !== generation) return;
        if (!uri) {
          await speakDevice(text, onDone);
          return;
        }
        if (i + 1 < chunks.length) upcoming = synthesize(chunks[i + 1], options);
        playUri(uri, () => {
          if (myGen !== generation) return;
          if (i + 1 < chunks.length) playFrom(i + 1);
          else onDone();
        });
      };
      playFrom(0);
      return;
    }

    const uri = await synthesize(text, options);
    if (myGen !== generation) return; // stopped while generating
    if (uri) {
      playUri(uri, onDone);
      return;
    }
  }
  await speakDevice(text, onDone);
}

// Split long text into speech chunks at sentence boundaries: a short
// opener (fast start) followed by larger passages.
function splitForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+["']?\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  let limit = 400;
  for (const s of sentences) {
    if (current && current.length + s.length > limit) {
      chunks.push(current);
      current = '';
      limit = 1100;
    }
    current += s;
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

export function stop(): void {
  generation++;
  Speech.stop();
  if (currentPlayer) {
    const p = currentPlayer;
    currentPlayer = null;
    try {
      p.pause();
      p.remove();
    } catch {
      // already released
    }
  }
}

// ---------------------------------------------------------------------------

// Prefer a calm male device voice for the no-key fallback.
let devicePick: string | undefined;
let devicePicked = false;

async function speakDevice(text: string, onDone: () => void): Promise<void> {
  if (!devicePicked) {
    devicePicked = true;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const english = voices.filter((v) => v.language?.startsWith('en'));
      const preferred = ['aaron', 'daniel', 'arthur', 'fred', 'alex', 'gordon'];
      const found = english.find((v) =>
        preferred.some(
          (p) =>
            v.name?.toLowerCase().includes(p) ||
            v.identifier?.toLowerCase().includes(p)
        )
      );
      devicePick = found?.identifier;
    } catch {
      devicePick = undefined;
    }
  }
  Speech.speak(text.replace(/\[[^\]]*\]/g, ''), {
    voice: devicePick,
    rate: 0.88,
    pitch: 0.72,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export interface TranscribeResult {
  text: string | null;
  /** Set when the request failed: 'permission' (key lacks speech-to-text),
   * 'network', or 'error'. */
  problem?: 'permission' | 'network' | 'error';
}

/**
 * Transcribe a recorded audio file with ElevenLabs speech-to-text.
 */
export async function transcribe(uri: string): Promise<TranscribeResult> {
  // Backend mode: send the recording to the Abide server.
  if (backendConfigured()) {
    try {
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const res = await fetch(`${BACKEND_URL}/stt`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': BACKEND_TOKEN!,
        },
        body: JSON.stringify({ audioBase64, mimeType: 'audio/mp4' }),
      });
      if (!res.ok) return { text: null, problem: 'error' };
      const json = (await res.json()) as { text?: string };
      return { text: json.text?.trim() || null };
    } catch {
      return { text: null, problem: 'network' };
    }
  }

  if (!elevenKey) return { text: null, problem: 'permission' };
  try {
    const form = new FormData();
    form.append('file', {
      uri,
      name: 'speech.m4a',
      type: 'audio/mp4',
    } as unknown as Blob);
    form.append('model_id', 'scribe_v1');
    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': elevenKey },
      body: form,
    });
    if (res.status === 401 || res.status === 403) {
      return { text: null, problem: 'permission' };
    }
    if (!res.ok) return { text: null, problem: 'error' };
    const json = (await res.json()) as { text?: string };
    const text = json.text?.trim();
    return { text: text || null };
  } catch {
    return { text: null, problem: 'network' };
  }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? B64[b2 & 63] : '=';
  }
  return out;
}
