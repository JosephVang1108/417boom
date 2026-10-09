// "How's your heart today?" — one gentle question a day. Tapping a
// mood sends it to him as an ordinary message, so he responds the way
// he always does: personally.
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOOD_DAY_KEY = 'mood_asked_day';

export interface Mood {
  label: string;
  emoji: string;
  /** What tapping the chip says to him. */
  message: string;
}

export const MOODS: Mood[] = [
  { label: 'Heavy', emoji: '🌧', message: 'My heart feels heavy today.' },
  { label: 'Anxious', emoji: '🌀', message: "I'm feeling anxious today." },
  { label: 'Grateful', emoji: '🌤', message: "I'm feeling grateful today." },
  { label: 'Tired', emoji: '🌙', message: "I'm just tired today." },
];

/** True when today's heart check hasn't been offered yet. */
export async function shouldAskMood(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(MOOD_DAY_KEY);
    return last !== new Date().toDateString();
  } catch {
    return false;
  }
}

export async function markMoodAsked(): Promise<void> {
  try {
    await AsyncStorage.setItem(MOOD_DAY_KEY, new Date().toDateString());
  } catch {}
}
