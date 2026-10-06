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
  /** The calendar day they first met (ISO) — "Day N together" counts
   * from here and never resets, even when days are missed. */
  firstDay: string | null;
  /** Completed 7-day runs of daily use — the faithfulness track. */
  perfectWeeks: number;
}

const EMPTY: JourneyStats = {
  totalDays: 0,
  bestStreak: 0,
  prayers: 0,
  chapters: 0,
  stories: 0,
  shares: 0,
  lastDay: null,
  firstDay: null,
  perfectWeeks: 0,
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
  if (!cache.firstDay) cache.firstDay = today;
  if (cache.lastDay !== today) {
    cache.totalDays += 1;
    cache.lastDay = today;
    // Every unbroken run of 7 days completes another perfect week.
    if (currentStreak > 0 && currentStreak % 7 === 0) {
      cache.perfectWeeks += 1;
    }
  }
  if (currentStreak > cache.bestStreak) cache.bestStreak = currentStreak;
  save();
}

/** Calendar days since they first met, inclusive — Monday's first
 * visit makes Wednesday "Day 3" even if Tuesday was missed. */
export function daysTogether(): number {
  if (!cache.firstDay) return 1;
  const first = new Date(cache.firstDay);
  const ms = Date.now() - first.getTime();
  return Math.max(1, Math.floor(ms / 86_400_000) + 1);
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
  /** Hand-painted medallion artwork — bundled, or a URL until the
   * next media-bundling pass. */
  icon: number | string;
  name: string;
  desc: string;
  earned: boolean;
}

// The app's own medallion artwork (illuminated-manuscript style,
// generated as one matched set — no stock emojis). All bundled.
export const MEDALLIONS = {
  dove: require('../../assets/media/m-dove.jpg'),
  book: require('../../assets/media/m-book.jpg'),
  prayingHands: require('../../assets/media/m-praying-hands.jpg'),
  firstLight: require('../../assets/media/m-first-light.jpg'),
} as const;

export function getBadges(s: JourneyStats): Badge[] {
  const b = (
    id: string,
    emoji: string,
    icon: number | string,
    name: string,
    desc: string,
    earned: boolean
  ): Badge => ({ id, emoji, icon, name, desc, earned });
  return [
    b('first-light', '🌅', MEDALLIONS.firstLight, 'First Light', 'Opened the app for the first time', s.totalDays >= 1),
    b('three-days', '👣', require('../../assets/media/m-three-days.jpg'), 'Three Days Walking', 'A 3-day streak together', s.bestStreak >= 3),
    b('week-grace', '🌿', require('../../assets/media/m-week-grace.jpg'), 'Week of Grace', 'A 7-day streak together', s.bestStreak >= 7),
    b('faithful-month', '⭐', require('../../assets/media/m-faithful-month.jpg'), 'Faithful Month', 'A 30-day streak together', s.bestStreak >= 30),
    b('hundredfold', '👑', require('../../assets/media/m-hundredfold.jpg'), 'Hundredfold', 'A 100-day streak together', s.bestStreak >= 100),
    // Faithfulness: perfect weeks — all seven days, week after week.
    b('four-weeks-faithful', '🌾', require('../../assets/media/m-faithful-weeks.jpg'), 'Four Weeks Faithful', '4 perfect weeks — every single day', s.perfectWeeks >= 4),
    b('season-faithful', '🍇', require('../../assets/media/m-season-faithful.jpg'), 'A Season of Faithfulness', '12 perfect weeks of showing up', s.perfectWeeks >= 12),
    b('first-prayer', '🙏', MEDALLIONS.prayingHands, 'First Prayer', 'Prayed together for the first time', s.prayers >= 1),
    b('prayer-warrior', '🛡️', require('../../assets/media/m-prayer-warrior.jpg'), 'Prayer Warrior', '25 prayers lifted up', s.prayers >= 25),
    b('intercessor', '❤️', require('../../assets/media/m-intercessor.jpg'), 'Intercessor', '100 prayers lifted up', s.prayers >= 100),
    b('into-the-word', '📖', MEDALLIONS.book, 'Into the Word', 'Opened your first Bible chapter', s.chapters >= 1),
    b('scripture-seeker', '📚', require('../../assets/media/m-scripture-seeker.jpg'), 'Scripture Seeker', '25 chapters opened', s.chapters >= 25),
    b('deep-in-word', '🏛️', require('../../assets/media/m-deep-in-word.jpg'), 'Deep in the Word', '100 chapters opened', s.chapters >= 100),
    b('first-story', '✨', require('../../assets/media/m-first-story.jpg'), 'First Story', 'Heard your first story', s.stories >= 1),
    b('story-lover', '🌙', require('../../assets/media/m-story-lover.jpg'), 'Story Lover', '10 stories heard', s.stories >= 10),
    // Sharing light — its own track, earned by sharing verses.
    b('lamp-stand', '🕯️', require('../../assets/media/m-lamp-stand.jpg'), 'Lamp on a Stand', 'Shared your first verse', s.shares >= 1),
    b('city-hill', '🌟', require('../../assets/media/m-city-hill.jpg'), 'City on a Hill', '10 verses shared', s.shares >= 10),
    b('salt-light', '🧂', require('../../assets/media/m-salt-light.jpg'), 'Salt & Light', '25 verses shared', s.shares >= 25),
  ];
}
