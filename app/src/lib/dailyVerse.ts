import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const ENABLED_KEY = 'daily_verse_enabled';
const HOUR = 8; // 8:00 AM local

// A rotation of morning verses (World English Bible, public domain).
const DAILY_VERSES: { ref: string; text: string }[] = [
  { ref: 'Lamentations 3:22–23', text: 'His compassion doesn’t fail. It is new every morning. Great is your faithfulness.' },
  { ref: 'Psalm 118:24', text: 'This is the day that Yahweh has made. We will rejoice and be glad in it!' },
  { ref: 'Zephaniah 3:17', text: 'He will rejoice over you with joy. He will calm you in his love.' },
  { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.' },
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
  { ref: 'Isaiah 41:10', text: 'Don’t you be afraid, for I am with you. I will strengthen you. Yes, I will help you.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
  { ref: 'Psalm 23:1', text: 'Yahweh is my shepherd; I shall lack nothing.' },
  { ref: 'Jeremiah 29:11', text: 'Thoughts of peace, and not of evil, to give you hope and a future.' },
  { ref: 'Romans 8:38–39', text: 'Nothing will be able to separate us from the love of God.' },
  { ref: 'Proverbs 3:5', text: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding.' },
  { ref: 'Matthew 6:34', text: 'Don’t be anxious for tomorrow, for tomorrow will be anxious for itself.' },
  { ref: '1 Peter 5:7', text: 'Casting all your worries on him, because he cares for you.' },
  { ref: 'Psalm 34:18', text: 'Yahweh is near to those who have a broken heart.' },
];

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
      await AsyncStorage.setItem(ENABLED_KEY, 'yes');
      await refreshSchedule();
      return true;
    }
    await AsyncStorage.setItem(ENABLED_KEY, 'no');
    await Notifications.cancelAllScheduledNotificationsAsync();
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
    if (!(await isDailyVerseEnabled())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const fireAt = new Date(now);
      fireAt.setDate(now.getDate() + i);
      fireAt.setHours(HOUR, 0, 0, 0);
      if (fireAt <= now) continue; // today's 8am already passed
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
  } catch {
    // notifications unavailable — fail quietly
  }
}
