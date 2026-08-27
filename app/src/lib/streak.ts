import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_DAY_KEY = 'streak_last_day';
const COUNT_KEY = 'streak_count';

function dayString(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Record today's visit and return the current streak:
 * consecutive days the app has been opened ("days walked together").
 */
export async function touchStreak(): Promise<number> {
  try {
    const today = dayString(new Date());
    const yesterday = dayString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const [lastDay, countRaw] = await Promise.all([
      AsyncStorage.getItem(LAST_DAY_KEY),
      AsyncStorage.getItem(COUNT_KEY),
    ]);
    let count = parseInt(countRaw ?? '0', 10) || 0;
    if (lastDay === today) {
      // already counted today
    } else if (lastDay === yesterday) {
      count += 1;
    } else {
      count = 1;
    }
    await Promise.all([
      AsyncStorage.setItem(LAST_DAY_KEY, today),
      AsyncStorage.setItem(COUNT_KEY, String(count)),
    ]);
    return count;
  } catch {
    return 0;
  }
}
