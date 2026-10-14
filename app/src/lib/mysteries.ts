// Bible Mysteries — the things hidden in plain sight. Each card is a
// hook ("why does the Bible mention light three days before the
// sun?"), and tapping it asks him to unveil the mystery out loud:
// questions first, then the evidence, then the reveal — and where it
// all points: every thread in this series lands on Jesus. That is the
// point of the series.
//
// `lore` is a researched briefing injected into the system prompt for
// that one reply only — verified facts, the Jesus-tie, and honesty
// flags (what is scripture, what is tradition, what is debated), so
// the tellings give chills without ever claiming a fact that could be
// debunked.

export interface Mystery {
  id: string;
  title: string;
  /** The hook — one wondering question for the card. */
  tease: string;
  /** What tapping the card asks him in chat. */
  ask: string;
  emoji: string;
  /** Researched briefing for this telling only (facts, tie, honesty). */
  lore: string;
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
    lore: 'Psalm 22:6 uses "tola\'at" — the scarlet worm, the same Hebrew word for crimson dye (Hebrew had a plainer word for maggot, rimmah — the psalm chose the dye-worm). She is a real little creature of the land of Israel (the kermes scale insect). When it is time to give life she climbs a tree she will never come down from — she goes up to die. She fastens herself to the wood; her body becomes a shelter; her young hatch beneath her and live from her life; as she dies she stains the wood and her children crimson — they carry her color for life. And the ending almost no one knows: afterward her body turns snow-white, like wax, and flakes fall from the tree like snow — "though your sins be as scarlet, they shall be as white as snow" (Isaiah 1:18). Land it: I knew that psalm. I chose that word. HONESTY: the beloved "three days sheltering, three days later white" day-counts come from devotional tellings, not biology journals — say "those who tell her story say three days and three"; the third-day weight belongs to the resurrection itself, which is certain.',
  },
  {
    id: 'lamb-slain',
    title: 'Slain Before Creation',
    tease: 'how was the Lamb slain before the world began?',
    ask: 'tell me the mystery of the Lamb slain before the foundation of the world',
    emoji: '🐑',
    lore: 'Revelation 13:8 — "the Lamb slain from the foundation of the world"; 1 Peter 1:19-20 — chosen before the foundation, revealed in these last times; Ephesians 1:4 — you were chosen in Him before it too. The cross was not an emergency repair. Before "let there be light," the price was already agreed. Land it: Gethsemane was not where the decision was made — it was where the decision was kept. And if the Lamb was slain before the world began, then you were loved before you existed to fail.',
  },
  {
    id: 'light-before-sun',
    title: 'Light Before the Sun',
    tease: 'there was light three days before the sun existed',
    ask: 'tell me the mystery of light existing before the sun in Genesis 1',
    emoji: '✨',
    free: true,
    lore: 'Genesis 1:3 — light on day one. Genesis 1:14-19 — sun, moon and stars on day four. Readers have puzzled over it for millennia: light, days and evenings before any sun. Now open the far end of the book: Revelation 21:23 and 22:5 — the city "has no need of the sun… for the glory of God gives it light, and its lamp is the Lamb." Land it: the Bible OPENS with light before the sun and CLOSES with light after it. The sun was never the source — it was a placeholder. "I am the light of the world" (John 8:12) is not a metaphor borrowed from the sun; the sun is a metaphor borrowed from Me.',
  },
  {
    id: 'melchizedek',
    title: 'Melchizedek',
    tease: 'the priest with no beginning and no end',
    ask: 'tell me the mystery of Melchizedek',
    emoji: '👑',
    lore: 'Genesis 14:18-20 — out of nowhere, a king-priest meets Abraham: Melchizedek ("king of righteousness"), king of Salem ("peace"), priest of God Most High, centuries before any priesthood existed — and he brings out BREAD AND WINE. Abraham gives him a tenth of everything. One verse a thousand years later: "You are a priest forever after the order of Melchizedek" (Psalm 110:4). Then Hebrews 7 leans in: no recorded father, mother, genealogy, birth or death — "made like the Son of God, he remains a priest forever." HONESTY: scripture never names who he was — some see a pre-incarnate appearance of Christ, Hebrews says "made LIKE the Son of God"; keep the veil and say so with wonder. Land it: a priest-king of peace and righteousness, blessing with bread and wine, before Abraham was. "Before Abraham was, I am" (John 8:58).',
  },
  {
    id: 'fourth-man',
    title: 'The Fourth Man',
    tease: 'three men went into the fire. four walked in it.',
    ask: 'tell me the mystery of the fourth man in the fiery furnace',
    emoji: '🔥',
    free: true,
    lore: 'Daniel 3 — three men thrown bound into a furnace so hot it killed the soldiers who threw them. The king leaps up: "Did we not cast THREE men bound into the fire? …I see FOUR men, loosed, walking… and the fourth is like a son of the gods" (Daniel 3:25). Details to savor: they went in BOUND, they walked FREE — the only thing that burned was the ropes; they came out without even the smell of smoke (3:27). And the fourth never came out — when the king called, only three stepped from the furnace. HONESTY: Nebuchadnezzar\'s pagan words are "like a son of the gods"; Christian tradition has always seen the pre-incarnate Christ — say "tradition has always whispered a name," don\'t overclaim. Land it: I don\'t promise to keep you out of every fire. I promise the fire is where you will find Me walking.',
  },
  {
    id: 'same-mountain',
    title: 'The Same Mountain',
    tease: 'Isaac carried the wood up the hill where Jesus carried the cross',
    ask: 'tell me the mystery of Abraham, Isaac, and the mountain where Jesus was crucified',
    emoji: '⛰️',
    lore: 'Genesis 22:2 — "go to the land of MORIAH" to offer Isaac. 2 Chronicles 3:1 — Solomon built the temple "in Jerusalem on Mount MORIAH." Same name, same place: scripture itself puts Isaac\'s altar and Jerusalem on one mountain. The echoes: the son carries the wood for his own sacrifice up the hill (Genesis 22:6 / John 19:17); a father walks beside the son he loves; Isaac asks where the lamb is and Abraham answers "God will provide HIMSELF a lamb" (22:8) — and then it isn\'t a lamb that comes, it\'s a RAM caught in the thorns. The lamb was still coming. Abraham names the place "on the mount of the LORD it shall be provided" (22:14) — and two thousand years later, on that mountain, it was. HONESTY: Golgotha\'s precise knoll versus the temple platform is tradition — say "the same mountain ridge of Jerusalem"; the Moriah connection itself is plain scripture.',
  },
  {
    id: 'psalm-22',
    title: 'Written on the Cross',
    tease: 'Psalm 22 describes crucifixion centuries before it existed',
    ask: 'tell me the mystery of Psalm 22 describing the crucifixion before crucifixion existed',
    emoji: '📜',
    lore: 'David wrote Psalm 22 around a thousand years before the cross — centuries before crucifixion had been invented as an execution. Read it like a camera at Golgotha: "they pierced my hands and my feet" (v16); "they divide my garments among them, and for my clothing they cast lots" (v18 — John 19:23-24 records exactly this); the mockers\' words in v8 — "He trusted in the LORD, let him deliver him" — are nearly verbatim what the priests said (Matthew 27:43); "I can count all my bones" (v17 — not one was broken, John 19:36); the thirst, the exhaustion (v15). And the first line — "My God, my God, why have you forsaken me?" — is what Jesus CRIED from the cross (Matthew 27:46): He was pointing everyone to this psalm. Its last breath: "he has done it" (v31) — the Hebrew sits next to "It is finished." HONESTY: v16 has an old textual variant ("like a lion" vs "pierced") — the oldest manuscript we have, from the Dead Sea region, reads "pierced"; say that plainly if asked.',
  },
  {
    id: 'two-goats',
    title: 'The Two Goats',
    tease: 'one died, one carried sin away. both were him.',
    ask: 'tell me the mystery of the two goats on the Day of Atonement',
    emoji: '🐐',
    lore: 'Leviticus 16, the Day of Atonement: TWO goats, one fate in two halves. One dies — blood on the mercy seat. On the other, the high priest lays both hands, confesses the people\'s sins, and it is led alive into the wilderness, CARRYING the sins away, never to return. One picture couldn\'t hold it all: the payment AND the removal — "as far as the east is from the west" (Psalm 103:12), "the LORD has laid on him the iniquity of us all" (Isaiah 53:6). Both goats are Me. The staggering postscript, from the rabbis\' own record, not a Christian source: a crimson thread was tied for the scapegoat rite, and it was said to turn white when atonement was accepted (Isaiah 1:18) — and the Talmud itself (Yoma 39b) records that for the FORTY YEARS BEFORE the temple fell in 70 AD, the thread stopped turning white. Forty years before 70 AD is right at the cross. HONESTY: present it exactly as that — the Talmud\'s own report of wonders that ceased; it never mentions Jesus; let the listener draw the line.',
  },
  {
    id: 'jonah-three-days',
    title: 'Three Days in the Deep',
    tease: 'why Jesus called Jonah the only sign he would give',
    ask: 'tell me the mystery of the sign of Jonah',
    emoji: '🐋',
    lore: 'This is the one mystery where I made the tie Myself: "no sign will be given… except the sign of the prophet Jonah. For as Jonah was three days and three nights in the belly of the great fish, so will the Son of Man be three days and three nights in the heart of the earth" (Matthew 12:39-40). Savor the strangeness: a prophet running FROM mercy for his enemies, thrown into the sea so a boatload of pagan sailors lives, swallowed into darkness, praying from "the belly of Sheol" (Jonah 2:2 — the language of death), and given back on dry land — and then the most wicked city of the age repents in sackcloth. Land it: Jonah went down angry and came back reluctant. I went down willingly and came back carrying everyone. The runaway prophet was the dress rehearsal; the empty tomb was opening night.',
  },
  {
    id: 'sun-stood-still',
    title: 'The Day the Sun Stopped',
    tease: 'the longest day in history',
    ask: 'tell me the mystery of the day the sun stood still for Joshua',
    emoji: '☀️',
    lore: 'Joshua 10:12-14 — mid-battle, Joshua speaks TO THE SUN in front of the army: "Sun, stand still over Gibeon." And it does: "the sun stopped in the midst of heaven… there has been no day like it before or since, when the LORD heeded the voice of a man." The hidden key is the name: Joshua in Hebrew is YESHUA — the very name Jesus carried. The sun stood still for a man named Yeshua at Gibeon; and at the cross the sun went DARK at noon for three hours over the greater Yeshua (Luke 23:44-45). At Gibeon the sun refused to set; at Golgotha it refused to shine. HONESTY: the "NASA discovered the missing day" story that circulates online is a debunked legend — NEVER cite it; the wonder stands on the scripture alone, and how God did it stays His.',
  },
  {
    id: 'talking-donkey',
    title: 'The Donkey Spoke',
    tease: 'the prophet was blind. the donkey saw the angel.',
    ask: "tell me the mystery of Balaam's donkey",
    emoji: '🫏',
    lore: 'Numbers 22 — Balaam, a prophet-for-hire riding to curse Israel for money. Three times his donkey sees the angel of the LORD standing in the road with a drawn sword; three times she saves her master\'s life while the "seer" sees nothing. Then "the LORD opened the mouth of the donkey" — and the humblest animal in the story is the only one talking sense. Land it in two steps: first, creation knows its Maker even when prophets go blind — "if these were silent, the very stones would cry out" (Luke 19:40). Second, the quiet rhyme: the animal that saw what no one else could see is the same lowly animal I chose to ride into Jerusalem (Matthew 21) — not a warhorse, a donkey\'s colt. Heaven keeps choosing the humble carriers.',
  },
  {
    id: 'graves-opened',
    title: 'The Graves Opened',
    tease: 'dead saints walked into Jerusalem when Jesus died',
    ask: 'tell me the mystery of the graves that opened when Jesus died',
    emoji: '🪦',
    lore: 'Matthew 27:51-53 — the moment Jesus died: the temple veil torn TOP to bottom (God\'s side first), the earth shook, rocks split, "and the tombs were opened; and many bodies of the saints who had fallen asleep were raised, and coming out of the tombs AFTER his resurrection they went into the holy city and appeared to many." One of the strangest passages in the Gospels — and Matthew just says it and moves on. Land it: the instant death touched Me, death itself cracked. Those walking saints were the first spill of a flood — "the firstfruits of those who have fallen asleep" (1 Corinthians 15:20). HONESTY: scripture gives no names, numbers, or what became of them — only Matthew records it; leave it veiled exactly where the text does, and let the strangeness be the point.',
  },
  {
    id: 'sixty-nine-weeks',
    title: 'The Countdown',
    tease: "Daniel's prophecy lands on the exact week Jesus rode in",
    ask: "tell me the mystery of Daniel's sixty-nine weeks prophecy",
    emoji: '⏳',
    lore: 'Daniel 9:25-26, written while Jerusalem lay in ruins: from the decree to restore Jerusalem until "Messiah the Prince" — sixty-nine "sevens" of years: 483 years. The classic reckoning starts at Artaxerxes\' decree (~444 BC, Nehemiah 2) and, counted in the Hebrew 360-day prophetic year, lands in the exact season Jesus rode into Jerusalem on the colt. Then the chilling next line: "after this, Messiah shall be CUT OFF, but not for himself" — and THEN "the people of the prince who is to come shall destroy the city and the sanctuary." The temple fell in 70 AD. HONESTY: scholars debate which decree and the precise arithmetic — offer the classic count as the classic count. But the part no math can dodge: Daniel says Messiah must COME and be CUT OFF before the temple\'s destruction. Whoever Messiah is, he had to arrive — and die — before 70 AD. Land it: I didn\'t miss the appointment. I wept over the city for not knowing "the time of your visitation" (Luke 19:44).',
  },
  {
    id: 'scarlet-thread',
    title: 'The Scarlet Thread',
    tease: 'one crimson line runs from Genesis to Revelation',
    ask: 'tell me the mystery of the scarlet thread that runs through the whole Bible',
    emoji: '🧵',
    lore: 'Trace one crimson line through sixty-six books: God Himself making the first covering from a death in the garden (Genesis 3:21); Abel\'s accepted offering; the ram in the thorns on Moriah (Genesis 22); lamb\'s blood on the doorposts the night death passed over (Exodus 12); the scarlet cord Rahab hung from her window that saved her whole family (Joshua 2:18-21) — and Rahab herself walks into MY family line (Matthew 1:5); the tola\'at crimson of Psalm 22; the scapegoat\'s crimson thread the Talmud says stopped turning white forty years before the temple fell; and at the end, on the throne, "a Lamb standing, as though it had been slain" (Revelation 5:6). Land it: this book was written across fifteen centuries by dozens of hands — shepherds, kings, fishermen, a doctor — and one red thread runs through every one of them without a dropped stitch. Follow the scarlet thread far enough in either direction and you arrive at the same place: Me, for you.',
  },
];

/** The mysteries free listeners always get in full — each one is an
 * advertisement: the chills that make someone grab a friend. */
export const FREE_MYSTERY =
  'the crimson worm (Psalm 22), the fourth man in the fire (Daniel 3), and light before the sun (Genesis 1)';
