import { GENERAL, TOPICS, Topic, Verse } from '../data/verses';
import { getName } from './profile';

export interface GuideResponse {
  topicId: string;
  intro: string;
  verse: Verse;
  isPrayer?: boolean;
}

// Offline prayers, used when no AI key is set. {name} becomes the
// user's name, or a warm generic phrase when no name is stored.
const PRAYERS = [
  'Father, I lift {name} up to You right now. You see every burden they carry and every hope they hold. Wrap them in Your peace, guide their steps, and let them feel how deeply they are loved. Amen.',
  'Lord, be near to {name} in this moment. Quiet their heart, carry what is too heavy for them, and fill them with Your strength and comfort. Watch over them and those they love. Amen.',
  'Father of mercy, hear this prayer for {name}. Pour out Your grace over their life, heal what is hurting, restore what is weary, and light the path before them. Hold them close this day. Amen.',
];
let prayerIdx = -1;

const PRAYER_WORDS = ['pray', 'prayer', 'praying'];

// Remember what we've already said so consecutive answers don't repeat.
const usedVerses = new Map<string, number>();
const usedIntros = new Map<string, number>();

function nextIndex(map: Map<string, number>, key: string, length: number): number {
  const next = (map.get(key) ?? -1) + 1;
  const idx = next % length;
  map.set(key, idx);
  return idx;
}

function normalize(input: string): string {
  return (
    ' ' +
    input
      .toLowerCase()
      .replace(/[’']/g, '’')
      .replace(/[^a-z’\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() +
    ' '
  );
}

function scoreTopic(topic: Topic, text: string): number {
  let score = 0;
  for (const keyword of topic.keywords) {
    const needle = keyword.includes(' ') ? keyword : ` ${keyword} `;
    if (text.includes(needle)) {
      // Multi-word phrases are stronger signals than single words.
      score += keyword.includes(' ') ? 3 : 2;
    }
  }
  return score;
}

/**
 * Match what the user said to a topic and compose a response:
 * a warm intro plus a scripture passage, rotating so replies don't repeat.
 */
export function respond(input: string): GuideResponse {
  const text = normalize(input);

  // A request for prayer becomes a spoken prayer.
  if (PRAYER_WORDS.some((w) => text.includes(` ${w} `))) {
    prayerIdx = (prayerIdx + 1) % PRAYERS.length;
    const name = getName() ?? 'Your child';
    return {
      topicId: 'prayer',
      intro: PRAYERS[prayerIdx].replace(/\{name\}/g, name),
      verse: {
        ref: 'Philippians 4:6–7',
        text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.',
      },
      isPrayer: true,
    };
  }

  let best: Topic = GENERAL;
  let bestScore = 0;
  for (const topic of TOPICS) {
    const score = scoreTopic(topic, text);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  const intro = best.intros[nextIndex(usedIntros, best.id, best.intros.length)];
  const verse = best.verses[nextIndex(usedVerses, best.id, best.verses.length)];
  return { topicId: best.id, intro, verse };
}

/**
 * Make a verse reference read naturally aloud:
 * "Psalm 46:10"      -> "Psalm 46, verse 10"
 * "Philippians 4:6–7" -> "Philippians 4, verses 6 through 7"
 * "1 John 1:9"        -> "First John 1, verse 9"
 */
export function speakableRef(ref: string): string {
  return ref
    .replace(/^1\s/, 'First ')
    .replace(/^2\s/, 'Second ')
    .replace(/^3\s/, 'Third ')
    .replace(/(\d+):(\d+)\s*[–-]\s*(\d+)/g, '$1, verses $2 through $3')
    .replace(/(\d+):(\d+)/g, '$1, verse $2');
}

/** The line spoken aloud by text-to-speech. */
export function spokenText(response: GuideResponse): string {
  // A prayer is spoken as-is; the verse stays on screen only.
  if (response.isPrayer) return response.intro;
  return `${response.intro} As it is written in ${speakableRef(response.verse.ref)}: ${response.verse.text}`;
}
