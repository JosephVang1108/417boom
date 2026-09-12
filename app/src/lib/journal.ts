import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_KEY = 'prayer_journal_v1';
const MAX_ENTRIES = 50;

export interface PrayerEntry {
  id: number;
  /** What they asked prayer for, in their own words. */
  request: string;
  /** ISO date of the prayer. */
  date: string;
}

let entries: PrayerEntry[] | null = null;

export async function loadJournal(): Promise<PrayerEntry[]> {
  if (entries) return entries;
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    entries = raw ? (JSON.parse(raw) as PrayerEntry[]) : [];
  } catch {
    entries = [];
  }
  return entries;
}

export async function addPrayer(request: string): Promise<void> {
  const list = await loadJournal();
  list.unshift({
    id: Date.now(),
    request: request.slice(0, 400),
    date: new Date().toISOString(),
  });
  entries = list.slice(0, MAX_ENTRIES);
  try {
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  } catch {
    // storage unavailable — journal lives for this session only
  }
}

export function getJournal(): PrayerEntry[] {
  return entries ?? [];
}

/**
 * A short description of recent prayers for the AI's context, so he can
 * follow up naturally ("How did your mom's surgery go?").
 */
export function recentPrayersForPrompt(): string | null {
  const list = (entries ?? []).slice(0, 3);
  if (!list.length) return null;
  const lines = list.map((e) => {
    const days = Math.floor(
      (Date.now() - new Date(e.date).getTime()) / (24 * 60 * 60 * 1000)
    );
    const when =
      days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
    return `- ${when}: "${e.request}"`;
  });
  return lines.join('\n');
}
