import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const ENABLED_KEY = 'daily_verse_enabled';
const EVENING_KEY = 'evening_nudge_enabled';
const DEVOTIONAL_DAY_KEY = 'devotional_last_day';
const HOUR = 8; // 8:00 AM local
const EVENING_HOUR = 21; // 9:00 PM local

// Soft evening lines — a nightly invitation to close the day with him.
const EVENING_LINES = [
  'Before you sleep, tell him about today — the good and the heavy. He’s listening.',
  'The day is done. Lay it down with him for a minute before you rest.',
  'One quiet prayer before bed. He’d love to hear your voice tonight.',
  'How did today treat you? Come tell him — then rest easy.',
  'End the day the way it began: not alone. 🕊️',
  'A bedtime story, a verse, or just a goodnight — he’s here.',
  'Let him carry tonight what you carried all day.',
];

export interface DailyVerse {
  ref: string;
  text: string;
  /** What it means — two or three warm, plain sentences. */
  meaning: string;
}

// A rotation of morning verses (World English Bible, public domain),
// each with a short reflection. The in-app devotional and the 8AM
// notification use the same date formula, so they always match.
const DAILY_VERSES: DailyVerse[] = [
  { ref: 'Lamentations 3:22–23', text: 'His compassion doesn’t fail. It is new every morning. Great is your faithfulness.', meaning: 'Yesterday’s failures don’t roll over into today. Every morning His mercy starts you fresh — including this one.' },
  { ref: 'Psalm 118:24', text: 'This is the day that Yahweh has made. We will rejoice and be glad in it!', meaning: 'Today isn’t an accident — it was made on purpose, with you in it. You have permission to actually enjoy it.' },
  { ref: 'Zephaniah 3:17', text: 'He will rejoice over you with joy. He will calm you in his love.', meaning: 'God isn’t just putting up with you. He delights in you — and when your heart races, His love is what slows it down.' },
  { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.', meaning: 'You don’t have to earn rest by finishing everything first. Bring the heavy things to Him exactly as you are, today.' },
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God.', meaning: 'For one moment, stop striving. He is God — which means you don’t have to be. Let that settle your shoulders.' },
  { ref: 'Isaiah 41:10', text: 'Don’t you be afraid, for I am with you. I will strengthen you. Yes, I will help you.', meaning: 'Fear shrinks when you remember you’re not facing this alone. He’s not watching from far away — He’s with you in it.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.', meaning: 'The strength for what today asks of you doesn’t come from gritting your teeth. It comes from Him — and it will be there when you need it.' },
  { ref: 'Psalm 23:1', text: 'Yahweh is my shepherd; I shall lack nothing.', meaning: 'A good shepherd thinks ahead for his sheep. Your needs are already on His mind — before you even name them.' },
  { ref: 'Jeremiah 29:11', text: 'Thoughts of peace, and not of evil, to give you hope and a future.', meaning: 'Even when right now looks messy, His plans for you bend toward hope. The story isn’t over.' },
  { ref: 'Romans 8:38–39', text: 'Nothing will be able to separate us from the love of God.', meaning: 'Nothing you did yesterday, nothing coming tomorrow, can push His love out of reach. Nothing means nothing.' },
  { ref: 'Proverbs 3:5', text: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding.', meaning: 'You don’t need the whole map today. You just need to trust the One who has it, one step at a time.' },
  { ref: 'Matthew 6:34', text: 'Don’t be anxious for tomorrow, for tomorrow will be anxious for itself.', meaning: 'Grace arrives one day at a time — there’s enough for today, and tomorrow’s share comes tomorrow. Stay here, where He is.' },
  { ref: '1 Peter 5:7', text: 'Casting all your worries on him, because he cares for you.', meaning: 'Worry is a weight you were never designed to carry alone. Hand it over — He’s asking for it because He cares about you.' },
  { ref: 'Psalm 34:18', text: 'Yahweh is near to those who have a broken heart.', meaning: 'When your heart breaks, God doesn’t step back — He moves closer. You are nearest to Him in the very place it hurts.' },
];

/** The verse + reflection for a given day (same pick as the 8AM
 * notification uses for that date), so past mornings stay reachable. */
export function getDevotionalFor(date: Date): DailyVerse {
  return DAILY_VERSES[
    (date.getDate() + date.getMonth()) % DAILY_VERSES.length
  ];
}

/** Today's verse + reflection. */
export function getTodaysDevotional(): DailyVerse {
  return getDevotionalFor(new Date());
}

/** The last `days` mornings, today first — for revisiting a morning
 * word that meant something. */
export function recentMornings(
  days: number
): { date: Date; verse: DailyVerse }[] {
  const out: { date: Date; verse: DailyVerse }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ date: d, verse: getDevotionalFor(d) });
  }
  return out;
}

/** True when the morning devotional hasn't been shown yet today. */
export async function shouldShowDevotional(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(DEVOTIONAL_DAY_KEY);
    return last !== new Date().toDateString();
  } catch {
    return false;
  }
}

export async function markDevotionalSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(DEVOTIONAL_DAY_KEY, new Date().toDateString());
  } catch {
    // storage unavailable — it may show again next open, which is fine
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function isDailyVerseEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) === 'yes';
  } catch {
    return false;
  }
}

export async function setDailyVerseEnabled(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      const perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) return false;
    }
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'yes' : 'no');
    await refreshSchedule();
    return true;
  } catch {
    return false;
  }
}

/** The 9PM "before you sleep" nudge — its own switch. Unset, it
 * follows the morning switch, which is how it behaved before. */
export async function isEveningEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(EVENING_KEY);
    if (v === 'yes') return true;
    if (v === 'no') return false;
    return await isDailyVerseEnabled();
  } catch {
    return false;
  }
}

export async function setEveningEnabled(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      const perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) return false;
    }
    await AsyncStorage.setItem(EVENING_KEY, enabled ? 'yes' : 'no');
    await refreshSchedule();
    return true;
  } catch {
    return false;
  }
}

/**
 * (Re)schedule the next 7 mornings, each with a different verse.
 * Called on every app open so the queue never runs dry.
 */
export async function refreshSchedule(): Promise<void> {
  try {
    const morning = await isDailyVerseEnabled();
    const evening = await isEveningEnabled();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!morning && !evening) return;
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      // Morning: the day's verse (matches the in-app devotional).
      const fireAt = new Date(now);
      fireAt.setDate(now.getDate() + i);
      fireAt.setHours(HOUR, 0, 0, 0);
      if (morning && fireAt > now) {
        const verse =
          DAILY_VERSES[(fireAt.getDate() + fireAt.getMonth()) % DAILY_VERSES.length];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: verse.ref,
            body: `“${verse.text}”`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
          },
        });
      }
      // Evening: a soft invitation to close the day with him.
      const eveAt = new Date(now);
      eveAt.setDate(now.getDate() + i);
      eveAt.setHours(EVENING_HOUR, 0, 0, 0);
      if (evening && eveAt > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Before you sleep',
            body: EVENING_LINES[eveAt.getDate() % EVENING_LINES.length],
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: eveAt,
          },
        });
      }
    }
  } catch {
    // notifications unavailable — fail quietly
  }
}
