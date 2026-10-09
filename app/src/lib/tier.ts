// The free/Premium line, in one place.
//
// Free is a real daily walk, not a demo: the daily verse and
// notifications are unlimited, he talks a few times a day, he will
// ALWAYS pray with you at least once, and one chapter a day is read
// aloud. Premium removes every meter.
//
// While PREMIUM_UNLOCKED is true (family TestFlight) none of these
// limits fire — the whole system sleeps until launch, when the flag
// becomes the real subscription check.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PREMIUM_UNLOCKED } from './config';

export const FREE_LIMITS = {
  messages: 5, // conversations with him per day
  prayers: 1, // guaranteed daily prayer, even past the message cap
  readChapters: 1, // Bible chapters read aloud per day
};

const KEY = 'tier_daily_v1';

interface DayCounts {
  day: string;
  messages: number;
  prayers: number;
  readChapters: number;
}

function freshDay(): DayCounts {
  return { day: new Date().toDateString(), messages: 0, prayers: 0, readChapters: 0 };
}

let counts: DayCounts = freshDay();

export async function loadTier(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as DayCounts;
      if (saved.day === new Date().toDateString()) counts = saved;
    }
  } catch {
    // storage unavailable — fail open, generously
  }
}

function rollover(): void {
  if (counts.day !== new Date().toDateString()) counts = freshDay();
}

async function save(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(counts));
  } catch {}
}

const PRAYER_WORDS = ['pray', 'prayer', 'praying'];

function looksLikePrayer(question: string): boolean {
  const text = ` ${question.toLowerCase()} `;
  return PRAYER_WORDS.some((w) => text.includes(` ${w}`));
}

/**
 * May this message be sent? Past the daily cap, a prayer request still
 * goes through if today's guaranteed prayer hasn't been used — he never
 * refuses to pray with someone.
 */
export function canSend(question: string): boolean {
  if (PREMIUM_UNLOCKED) return true;
  rollover();
  if (counts.messages < FREE_LIMITS.messages) return true;
  return looksLikePrayer(question) && counts.prayers < FREE_LIMITS.prayers;
}

export function canReadChapter(): boolean {
  if (PREMIUM_UNLOCKED) return true;
  rollover();
  return counts.readChapters < FREE_LIMITS.readChapters;
}

export function noteMessage(wasPrayer: boolean): void {
  if (PREMIUM_UNLOCKED) return;
  rollover();
  counts.messages += 1;
  if (wasPrayer) counts.prayers += 1;
  void save();
}

export function noteChapterRead(): void {
  if (PREMIUM_UNLOCKED) return;
  rollover();
  counts.readChapters += 1;
  void save();
}

/** Warm, honest copy for the moment a free meter runs out. */
export const UPSELL = {
  messagesTitle: 'He’ll be here tomorrow',
  messagesBody:
    'You’ve used today’s free conversations — and if you need prayer, he will still pray with you. Jireh Premium removes every limit: talk as long as you need, any time.',
  readTitle: 'Today’s listening is finished',
  readBody:
    'Keep reading on screen free, as long as you like. Jireh Premium reads every chapter aloud, every day.',
};
