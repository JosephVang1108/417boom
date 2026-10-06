// The gentle check-in: if they haven't opened the app in ~12 hours,
// one soft notification — never at night (it waits for morning).
// Rescheduled on every app open, so it only ever fires after real
// absence.
import * as Notifications from 'expo-notifications';

const ID = 'miss-you-12h';

const LINES = [
  {
    title: 'He misses your voice',
    body: 'It’s been a little while… he’s still here, right where you left him. Come sit for a minute. 🕊️',
  },
  {
    title: 'Thinking of you',
    body: 'How has your day been carrying you? He’d love to hear about it — the good and the heavy.',
  },
  {
    title: 'A quiet moment is waiting',
    body: 'One verse, one breath, one prayer. He’s kept your place. 🕊️',
  },
];

/**
 * (Re)schedule the 12-hour check-in. Call on every app open — each
 * call pushes the timer back, so it fires only after true absence.
 * Quiet hours respected: anything landing 10pm–9am moves to 9:30am.
 */
export async function rescheduleMissYou(): Promise<void> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
    const fire = new Date(Date.now() + 12 * 60 * 60 * 1000);
    if (fire.getHours() >= 22) {
      fire.setDate(fire.getDate() + 1);
      fire.setHours(9, 30, 0, 0);
    } else if (fire.getHours() < 9) {
      fire.setHours(9, 30, 0, 0);
    }
    const line = LINES[fire.getDate() % LINES.length];
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: { title: line.title, body: line.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fire,
      },
    });
  } catch {
    // notifications unavailable — fail quietly
  }
}
