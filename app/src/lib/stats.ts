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
  lastDay: string | null;
}

const EMPTY: JourneyStats = {
  totalDays: 0,
  bestStreak: 0,
  prayers: 0,
  chapters: 0,
  stories: 0,
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
  kind: 'prayers' | 'chapters' | 'stories'
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
  name: string;
  desc: string;
  earned: boolean;
}

export function getBadges(s: JourneyStats): Badge[] {
  const b = (
    id: string,
    emoji: string,
    name: string,
    desc: string,
    earned: boolean
  ): Badge => ({ id, emoji, name, desc, earned });
  return [
    b('first-light', '🌅', 'First Light', 'Opened the app for the first time', s.totalDays >= 1),
    b('three-days', '🕊️', 'Three Days Walking', 'A 3-day streak together', s.bestStreak >= 3),
    b('week-grace', '🔥', 'Week of Grace', 'A 7-day streak together', s.bestStreak >= 7),
    b('faithful-month', '⭐', 'Faithful Month', 'A 30-day streak together', s.bestStreak >= 30),
    b('hundredfold', '👑', 'Hundredfold', 'A 100-day streak together', s.bestStreak >= 100),
    b('first-prayer', '🙏', 'First Prayer', 'Prayed together for the first time', s.prayers >= 1),
    b('prayer-warrior', '🛡️', 'Prayer Warrior', '25 prayers lifted up', s.prayers >= 25),
    b('intercessor', '❤️', 'Intercessor', '100 prayers lifted up', s.prayers >= 100),
    b('into-the-word', '📖', 'Into the Word', 'Opened your first Bible chapter', s.chapters >= 1),
    b('scripture-seeker', '📚', 'Scripture Seeker', '25 chapters opened', s.chapters >= 25),
    b('deep-in-word', '🏛️', 'Deep in the Word', '100 chapters opened', s.chapters >= 100),
    b('first-story', '✨', 'First Story', 'Heard your first story', s.stories >= 1),
    b('story-lover', '🌙', 'Story Lover', '10 stories heard', s.stories >= 10),
  ];
}
