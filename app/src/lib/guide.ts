import { GENERAL, TOPICS, Topic, Verse } from '../data/verses';

export interface GuideResponse {
  topicId: string;
  intro: string;
  verse: Verse;
}

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

/** The line spoken aloud by text-to-speech. */
export function spokenText(response: GuideResponse): string {
  return `${response.intro} As it is written in ${response.verse.ref}: ${response.verse.text}`;
}
