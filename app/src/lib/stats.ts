// The spiritual journey: lifetime counters and the badges they earn.
//
// Counted moments — opening the app each day, prayers prayed together,
// Bible chapters opened, stories heard — accumulate for life (streaks
// can break; these never go backward). Badges are computed from them.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'journey_stats';

export interface JourneyStats {
  totalDays: number;
  bestStreak: number;
  prayers: number;
  chapters: number;
  stories: number;
  shares: number;
  lastDay: string | null;
}

const EMPTY: JourneyStats = {
  totalDays: 0,
  bestStreak: 0,
  prayers: 0,
  chapters: 0,
  stories: 0,
  shares: 0,
  lastDay: null,
};

let cache: JourneyStats = { ...EMPTY };
let loaded = false;

export async function loadStats(): Promise<JourneyStats> {
  if (loaded) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) cache = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // storage unavailable — counters live for this session only
  }
  loaded = true;
  return cache;
}

function save(): void {
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
}

/** Call once per launch, after touchStreak(): counts distinct days and
 * remembers the best streak ever reached. */
export async function recordOpen(currentStreak: number): Promise<void> {
  await loadStats();
  const today = new Date().toDateString();
  if (cache.lastDay !== today) {
    cache.totalDays += 1;
    cache.lastDay = today;
  }
  if (currentStreak > cache.bestStreak) cache.bestStreak = currentStreak;
  save();
}

export async function bump(
  kind: 'prayers' | 'chapters' | 'stories' | 'shares'
): Promise<void> {
  await loadStats();
  cache[kind] += 1;
  save();
}

export function getStats(): JourneyStats {
  return cache;
}

export interface Badge {
  id: string;
  emoji: string;
  /** Hand-painted medallion artwork, generated as a matched set. */
  icon: string;
  name: string;
  desc: string;
  earned: boolean;
}

// The app's own medallion artwork (illuminated-manuscript style,
// generated as one matched set — no stock emojis).
export const MEDALLIONS = {
  dove: 'https://g.tlcdn.com/gen/d509a396a98949b08b116e6844fe42e8.jpg',
  book: 'https://g.tlcdn.com/gen/5cc2b56e28c844349873faf89c290846.jpg',
  prayingHands: 'https://g.tlcdn.com/gen/57f34edf7d4b4c71b4ad31b071ed8a72.jpg',
} as const;

export function getBadges(s: JourneyStats): Badge[] {
  const b = (
    id: string,
    emoji: string,
    icon: string,
    name: string,
    desc: string,
    earned: boolean
  ): Badge => ({ id, emoji, icon, name, desc, earned });
  const art = (hash: string) => `https://g.tlcdn.com/gen/${hash}.jpg`;
  return [
    b('first-light', '🌅', art('3785b1ad19964d7c8f776b37b08906f7'), 'First Light', 'Opened the app for the first time', s.totalDays >= 1),
    b('three-days', '👣', art('f23ffd37849a40ed804f5ad88e30a32d'), 'Three Days Walking', 'A 3-day streak together', s.bestStreak >= 3),
    b('week-grace', '🌿', art('b0240c9e99bd4d0aab49c4fd91137dcb'), 'Week of Grace', 'A 7-day streak together', s.bestStreak >= 7),
    b('faithful-month', '⭐', art('c6a24d91076746dc83bc798961fde8da'), 'Faithful Month', 'A 30-day streak together', s.bestStreak >= 30),
    b('hundredfold', '👑', art('e45cd724154245a1ab491298659e2263'), 'Hundredfold', 'A 100-day streak together', s.bestStreak >= 100),
    b('first-prayer', '🙏', MEDALLIONS.prayingHands, 'First Prayer', 'Prayed together for the first time', s.prayers >= 1),
    b('prayer-warrior', '🛡️', art('99aba283bd044799928edc29737d805b'), 'Prayer Warrior', '25 prayers lifted up', s.prayers >= 25),
    b('intercessor', '❤️', art('2e9b055af0804805bbfa8d9419944d1f'), 'Intercessor', '100 prayers lifted up', s.prayers >= 100),
    b('into-the-word', '📖', MEDALLIONS.book, 'Into the Word', 'Opened your first Bible chapter', s.chapters >= 1),
    b('scripture-seeker', '📚', art('aff3257657fa43a5a0ed5d61672c5f55'), 'Scripture Seeker', '25 chapters opened', s.chapters >= 25),
    b('deep-in-word', '🏛️', art('2252fe9935f442faafe543b0b38e23f5'), 'Deep in the Word', '100 chapters opened', s.chapters >= 100),
    b('first-story', '✨', art('b2c39fe1ea414a669a9ada319b517b97'), 'First Story', 'Heard your first story', s.stories >= 1),
    b('story-lover', '🌙', art('c332d29dfcbf4aa7885a0732f853f621'), 'Story Lover', '10 stories heard', s.stories >= 10),
    // Sharing light — its own track, earned by sharing verses.
    b('lamp-stand', '🕯️', art('b7d416c44d014530b89509221faa4515'), 'Lamp on a Stand', 'Shared your first verse', s.shares >= 1),
    b('city-hill', '🌟', art('463e725d316f414ca8f5a02d680f76fa'), 'City on a Hill', '10 verses shared', s.shares >= 10),
    b('salt-light', '🧂', art('339a1ad2e2a74c64bd8a2d9c4aeae637'), 'Salt & Light', '25 verses shared', s.shares >= 25),
  ];
}
