import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';

const KEY_STORAGE = 'elevenlabs_api_key';

// "Brian" — a deep, resonant, comforting American ElevenLabs voice.
const ELEVEN_VOICE_ID = 'nPczCjzI2devNBz1zQrb';
const ELEVEN_MODEL = 'eleven_multilingual_v2';

let elevenKey: string | null = null;
let currentPlayer: AudioPlayer | null = null;
let audioModeReady = false;
let generation = 0; // invalidates in-flight speech when stop() is called

export async function loadVoiceKey(): Promise<boolean> {
  try {
    elevenKey = await SecureStore.getItemAsync(KEY_STORAGE);
  } catch {
    elevenKey = null;
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

/**
 * Speak text aloud. Uses ElevenLabs (soothing, natural voice) when a key
 * is set; otherwise falls back to the device voice, preferring a calm
 * male one. onDone fires when playback finishes, is stopped, or errors.
 */
export async function speak(text: string, onDone: () => void): Promise<void> {
  stop();
  const myGen = ++generation;

  if (elevenKey) {
    try {
      await speakEleven(text, myGen, onDone);
      return;
    } catch {
      if (myGen !== generation) return; // stopped while fetching
      // fall through to the device voice
    }
  }
  await speakDevice(text, onDone);
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

async function speakEleven(
  text: string,
  myGen: number,
  onDone: () => void
): Promise<void> {
  if (!audioModeReady) {
    // Play even when the iPhone silent switch is on.
    await setAudioModeAsync({ playsInSilentMode: true });
    audioModeReady = true;
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_MODEL,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (myGen !== generation) return;

  const path = `${FileSystem.cacheDirectory}abide-voice-${myGen}.mp3`;
  await FileSystem.writeAsStringAsync(path, toBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (myGen !== generation) return;

  const player = createAudioPlayer({ uri: path });
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
  Speech.speak(text, {
    voice: devicePick,
    rate: 0.88,
    pitch: 0.72,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

/**
 * Transcribe a recorded audio file with ElevenLabs speech-to-text.
 * Returns the spoken text, or null when unavailable (no key or error).
 */
export async function transcribe(uri: string): Promise<string | null> {
  if (!elevenKey) return null;
  try {
    const form = new FormData();
    form.append('file', {
      uri,
      name: 'speech.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
    form.append('model_id', 'scribe_v1');
    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': elevenKey },
      body: form,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { text?: string };
    const text = json.text?.trim();
    return text ? text : null;
  } catch {
    return null;
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
