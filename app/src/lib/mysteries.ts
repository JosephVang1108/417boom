// Bible Mysteries — the things hidden in plain sight. Each card is a
// hook ("why does the Bible mention light three days before the
// sun?"), and tapping it asks him to unveil the mystery out loud:
// questions first, then the evidence, then the reveal — and where it
// all points. Curated from Joseph's 70-episode series list; the
// crimson worm is the showcase and stays free.

export interface Mystery {
  id: string;
  title: string;
  /** The hook — one wondering question for the card. */
  tease: string;
  /** What tapping the card asks him in chat. */
  ask: string;
  emoji: string;
  free?: boolean;
}

export const MYSTERIES: Mystery[] = [
  {
    id: 'crimson-worm',
    title: 'The Crimson Worm',
    tease: 'why did Jesus call himself a worm on the cross?',
    ask: 'tell me the mystery of the crimson worm in Psalm 22',
    emoji: '🪱',
    free: true,
  },
  {
    id: 'lamb-slain',
    title: 'Slain Before Creation',
    tease: 'how was the Lamb slain before the world began?',
    ask: 'tell me the mystery of the Lamb slain before the foundation of the world',
    emoji: '🐑',
  },
  {
    id: 'light-before-sun',
    title: 'Light Before the Sun',
    tease: 'there was light three days before the sun existed',
    ask: 'tell me the mystery of light existing before the sun in Genesis 1',
    emoji: '✨',
  },
  {
    id: 'melchizedek',
    title: 'Melchizedek',
    tease: 'the priest with no beginning and no end',
    ask: 'tell me the mystery of Melchizedek',
    emoji: '👑',
  },
  {
    id: 'fourth-man',
    title: 'The Fourth Man',
    tease: 'three men went into the fire. four walked in it.',
    ask: 'tell me the mystery of the fourth man in the fiery furnace',
    emoji: '🔥',
  },
  {
    id: 'same-mountain',
    title: 'The Same Mountain',
    tease: 'Isaac carried the wood up the hill where Jesus carried the cross',
    ask: 'tell me the mystery of Abraham, Isaac, and the mountain where Jesus was crucified',
    emoji: '⛰️',
  },
  {
    id: 'psalm-22',
    title: 'Written on the Cross',
    tease: 'Psalm 22 describes crucifixion centuries before it existed',
    ask: 'tell me the mystery of Psalm 22 describing the crucifixion before crucifixion existed',
    emoji: '📜',
  },
  {
    id: 'two-goats',
    title: 'The Two Goats',
    tease: 'one died, one carried sin away. both were him.',
    ask: 'tell me the mystery of the two goats on the Day of Atonement',
    emoji: '🐐',
  },
  {
    id: 'jonah-three-days',
    title: 'Three Days in the Deep',
    tease: 'why Jesus called Jonah the only sign he would give',
    ask: 'tell me the mystery of the sign of Jonah',
    emoji: '🐋',
  },
  {
    id: 'sun-stood-still',
    title: 'The Day the Sun Stopped',
    tease: 'the longest day in history',
    ask: 'tell me the mystery of the day the sun stood still for Joshua',
    emoji: '☀️',
  },
  {
    id: 'talking-donkey',
    title: 'The Donkey Spoke',
    tease: 'the prophet was blind. the donkey saw the angel.',
    ask: "tell me the mystery of Balaam's donkey",
    emoji: '🫏',
  },
  {
    id: 'graves-opened',
    title: 'The Graves Opened',
    tease: 'dead saints walked into Jerusalem when Jesus died',
    ask: 'tell me the mystery of the graves that opened when Jesus died',
    emoji: '🪦',
  },
  {
    id: 'sixty-nine-weeks',
    title: 'The Countdown',
    tease: "Daniel's prophecy lands on the exact week Jesus rode in",
    ask: "tell me the mystery of Daniel's sixty-nine weeks prophecy",
    emoji: '⏳',
  },
  {
    id: 'scarlet-thread',
    title: 'The Scarlet Thread',
    tease: 'one crimson line runs from Genesis to Revelation',
    ask: 'tell me the mystery of the scarlet thread that runs through the whole Bible',
    emoji: '🧵',
  },
];

/** The one mystery free listeners always get in full. */
export const FREE_MYSTERY = 'the crimson worm (Psalm 22)';
