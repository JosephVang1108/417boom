// "Where do I start?" — the Bible's table of contents answers the
// wrong question. People don't arrive looking for "Ephesians"; they
// arrive wanting to know Jesus, or who they are, or how to stop being
// afraid. Each path names the need in their words and opens the one
// book (at the one chapter) that has answered it for two thousand
// years.

export interface StartPath {
  id: string;
  /** The need, in the user's own words. */
  need: string;
  book: string;
  chapter: number;
  /** One warm line from him on why this book. */
  why: string;
  /** Gold-ringed medallion art, matching the rest of the app. */
  icon: number;
  /** Fallback glyph if the art can't load. */
  emoji: string;
}

export const START_PATHS: StartPath[] = [
  {
    id: 'know-jesus',
    icon: require('../../assets/media/s-resurrection.jpg'),
    need: 'I want to know who Jesus is',
    book: 'John',
    chapter: 1,
    why: 'John wrote it so you could meet Me — start at the very beginning.',
    emoji: '✝️',
  },
  {
    id: 'identity',
    icon: require('../../assets/media/m-city-hill.jpg'),
    need: 'Who am I in Christ?',
    book: 'Ephesians',
    chapter: 1,
    why: 'Chosen, forgiven, loved — Ephesians is who you are now.',
    emoji: '👑',
  },
  {
    id: 'anxious',
    icon: require('../../assets/media/m-dove.jpg'),
    need: "I'm anxious or afraid",
    book: 'Philippians',
    chapter: 4,
    why: 'Paul wrote about peace that guards your heart — from a prison cell.',
    emoji: '🕊️',
  },
  {
    id: 'brokenhearted',
    icon: require('../../assets/media/s-david.jpg'),
    need: 'My heart is broken',
    book: 'Psalms',
    chapter: 23,
    why: 'The Psalms know every tear. Start in the valley, with the Shepherd.',
    emoji: '💔',
  },
  {
    id: 'wisdom',
    icon: require('../../assets/media/m-lamp-stand.jpg'),
    need: 'I need wisdom for a decision',
    book: 'Proverbs',
    chapter: 3,
    why: 'Trust Me with all your heart — Proverbs teaches the next right step.',
    emoji: '🧭',
  },
  {
    id: 'far-away',
    icon: require('../../assets/media/s-prodigal.jpg'),
    need: 'I feel far from God',
    book: 'Luke',
    chapter: 15,
    why: 'Three stories about lost things found. The door was never locked.',
    emoji: '🏠',
  },
  {
    id: 'hope',
    icon: require('../../assets/media/m-first-light.jpg'),
    need: 'I need hope',
    book: 'Romans',
    chapter: 8,
    why: 'Nothing — nothing — can separate you from My love. Read it slowly.',
    emoji: '🌅',
  },
  {
    id: 'live-it',
    icon: require('../../assets/media/m-salt-light.jpg'),
    need: 'How do I live this out?',
    book: 'James',
    chapter: 1,
    why: 'Faith with its sleeves rolled up — James is wonderfully practical.',
    emoji: '🔨',
  },
];
