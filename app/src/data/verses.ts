// Topical scripture database.
// Verse text is from the World English Bible (WEB), a public-domain translation.

export interface Verse {
  ref: string;
  text: string;
}

export interface Topic {
  id: string;
  keywords: string[];
  intros: string[];
  verses: Verse[];
}

export const TOPICS: Topic[] = [
  {
    id: 'anxiety',
    keywords: [
      'anxious', 'anxiety', 'worried', 'worry', 'stressed', 'stress',
      'overwhelmed', 'nervous', 'panic', 'restless', 'uneasy', 'pressure',
    ],
    intros: [
      'I hear the weight you are carrying. You were never meant to carry it alone.',
      'Breathe. Your worries are safe to set down here.',
      'Anxiety shouts, but love speaks quietly. Listen with me for a moment.',
    ],
    verses: [
      {
        ref: 'Philippians 4:6–7',
        text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.',
      },
      {
        ref: 'Matthew 6:34',
        text: 'Therefore don’t be anxious for tomorrow, for tomorrow will be anxious for itself. Each day’s own evil is sufficient.',
      },
      {
        ref: '1 Peter 5:7',
        text: 'Casting all your worries on him, because he cares for you.',
      },
      {
        ref: 'John 14:27',
        text: 'Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don’t let your heart be troubled, neither let it be fearful.',
      },
    ],
  },
  {
    id: 'fear',
    keywords: [
      'afraid', 'fear', 'scared', 'terrified', 'frightened', 'dread', 'unsafe',
    ],
    intros: [
      'Fear feels loud right now, but you are held by something stronger.',
      'You do not face this alone. Not for one moment.',
    ],
    verses: [
      {
        ref: 'Isaiah 41:10',
        text: 'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.',
      },
      {
        ref: 'Psalm 23:4',
        text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.',
      },
      {
        ref: 'Joshua 1:9',
        text: 'Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for Yahweh your God is with you wherever you go.',
      },
      {
        ref: '2 Timothy 1:7',
        text: 'For God didn’t give us a spirit of fear, but of power, love, and self-control.',
      },
    ],
  },
  {
    id: 'grief',
    keywords: [
      'grief', 'grieving', 'died', 'death', 'loss', 'lost someone', 'mourning',
      'funeral', 'miss him', 'miss her', 'miss them', 'passed away', 'heartbroken',
    ],
    intros: [
      'I am so sorry. Grief is love with nowhere to go, and yours is seen.',
      'There are no small losses. Sit here with me a while.',
    ],
    verses: [
      {
        ref: 'Matthew 5:4',
        text: 'Blessed are those who mourn, for they shall be comforted.',
      },
      {
        ref: 'Psalm 34:18',
        text: 'Yahweh is near to those who have a broken heart, and saves those who have a crushed spirit.',
      },
      {
        ref: 'Revelation 21:4',
        text: 'He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain any more. The first things have passed away.',
      },
      {
        ref: 'John 11:25',
        text: 'I am the resurrection and the life. He who believes in me will still live, even if he dies.',
      },
    ],
  },
  {
    id: 'loneliness',
    keywords: [
      'lonely', 'alone', 'isolated', 'nobody', 'no one', 'abandoned', 'friendless',
      'left out', 'invisible',
    ],
    intros: [
      'Even in the quietest room, you are not alone.',
      'You are known, fully, and still loved. Hear this:',
    ],
    verses: [
      {
        ref: 'Matthew 28:20',
        text: 'Behold, I am with you always, even to the end of the age.',
      },
      {
        ref: 'Deuteronomy 31:6',
        text: 'Be strong and courageous. Don’t be afraid or scared of them, for Yahweh your God himself is who goes with you. He will not fail you nor forsake you.',
      },
      {
        ref: 'Psalm 27:10',
        text: 'When my father and my mother forsake me, then Yahweh will take me up.',
      },
    ],
  },
  {
    id: 'guilt',
    keywords: [
      'guilt', 'guilty', 'shame', 'ashamed', 'forgive me', 'sinned', 'sin',
      'regret', 'mistake', 'failed', 'failure', 'messed up', 'unworthy',
    ],
    intros: [
      'What you did is not the whole of who you are. Grace runs deeper than regret.',
      'You came here honestly, and honesty is where mercy begins.',
    ],
    verses: [
      {
        ref: '1 John 1:9',
        text: 'If we confess our sins, he is faithful and righteous to forgive us the sins and to cleanse us from all unrighteousness.',
      },
      {
        ref: 'Psalm 103:12',
        text: 'As far as the east is from the west, so far has he removed our transgressions from us.',
      },
      {
        ref: 'Romans 8:1',
        text: 'There is therefore now no condemnation to those who are in Christ Jesus.',
      },
      {
        ref: 'Isaiah 1:18',
        text: 'Come now, and let’s reason together, says Yahweh: Though your sins are as scarlet, they shall be as white as snow. Though they are red like crimson, they shall be as wool.',
      },
    ],
  },
  {
    id: 'forgiving_others',
    keywords: [
      'forgive', 'forgiveness', 'hurt me', 'betrayed', 'betrayal', 'wronged me',
      'resent', 'resentment', 'grudge', 'bitter', 'bitterness',
    ],
    intros: [
      'Forgiveness is not saying it didn’t hurt. It is refusing to let the hurt rule you.',
      'What was done to you matters. And so does your freedom from it.',
    ],
    verses: [
      {
        ref: 'Ephesians 4:32',
        text: 'And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you.',
      },
      {
        ref: 'Matthew 6:14',
        text: 'For if you forgive men their trespasses, your heavenly Father will also forgive you.',
      },
      {
        ref: 'Colossians 3:13',
        text: 'Bearing with one another, and forgiving each other, if any man has a complaint against any; even as Christ forgave you, so you also do.',
      },
    ],
  },
  {
    id: 'anger',
    keywords: [
      'angry', 'anger', 'furious', 'mad', 'rage', 'hate', 'irritated', 'frustrated',
    ],
    intros: [
      'Anger tells you something you care about was struck. Let’s not let it strike back through you.',
      'It is okay to feel this. Let’s carry it somewhere it can’t harm you.',
    ],
    verses: [
      {
        ref: 'James 1:19–20',
        text: 'So, then, my beloved brothers, let every man be swift to hear, slow to speak, and slow to anger; for the anger of man doesn’t produce the righteousness of God.',
      },
      {
        ref: 'Ephesians 4:26',
        text: 'Be angry, and don’t sin. Don’t let the sun go down on your wrath.',
      },
      {
        ref: 'Proverbs 15:1',
        text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.',
      },
    ],
  },
  {
    id: 'hope',
    keywords: [
      'hopeless', 'despair', 'give up', 'giving up', 'pointless', 'no hope',
      'depressed', 'depression', 'sad', 'darkness', 'empty', 'numb', 'worthless',
    ],
    intros: [
      'Even now, you matter more than you can see from where you stand.',
      'This night is real, but it is not the end of your story.',
    ],
    verses: [
      {
        ref: 'Jeremiah 29:11',
        text: 'For I know the thoughts that I think toward you, says Yahweh, thoughts of peace, and not of evil, to give you hope and a future.',
      },
      {
        ref: 'Romans 15:13',
        text: 'Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope, in the power of the Holy Spirit.',
      },
      {
        ref: 'Psalm 42:11',
        text: 'Why are you in despair, my soul? Why are you disturbed within me? Hope in God! For I shall still praise him, the saving help of my countenance, and my God.',
      },
      {
        ref: 'Lamentations 3:22–23',
        text: 'It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassion doesn’t fail. They are new every morning. Great is your faithfulness.',
      },
    ],
  },
  {
    id: 'weariness',
    keywords: [
      'tired', 'weary', 'exhausted', 'burned out', 'burnout', 'rest', 'can’t sleep',
      'cant sleep', 'drained', 'worn out',
    ],
    intros: [
      'You have been carrying much. Come and rest a while.',
      'Rest is not weakness. It is trust.',
    ],
    verses: [
      {
        ref: 'Matthew 11:28–29',
        text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart; and you will find rest for your souls.',
      },
      {
        ref: 'Psalm 23:1–3',
        text: 'Yahweh is my shepherd; I shall lack nothing. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
      },
      {
        ref: 'Isaiah 40:31',
        text: 'But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.',
      },
    ],
  },
  {
    id: 'strength',
    keywords: [
      'weak', 'strength', 'strong', 'can’t do this', 'cant do this', 'struggling',
      'hard time', 'difficult', 'challenge', 'persevere', 'endure',
    ],
    intros: [
      'You are stronger than this moment feels. And you are not the only strength at work here.',
      'Take the next step. Just the next one. You are upheld.',
    ],
    verses: [
      {
        ref: 'Philippians 4:13',
        text: 'I can do all things through Christ who strengthens me.',
      },
      {
        ref: '2 Corinthians 12:9',
        text: 'My grace is sufficient for you, for my power is made perfect in weakness.',
      },
      {
        ref: 'Psalm 46:1',
        text: 'God is our refuge and strength, a very present help in trouble.',
      },
    ],
  },
  {
    id: 'healing',
    keywords: [
      'sick', 'illness', 'ill', 'healing', 'heal', 'pain', 'hurting', 'hospital',
      'disease', 'diagnosis', 'cancer', 'surgery', 'broken',
    ],
    intros: [
      'I am with you in this pain, closer than the ache itself.',
      'Your body may be weary, but you are held, all of you.',
    ],
    verses: [
      {
        ref: 'Psalm 147:3',
        text: 'He heals the broken in heart, and binds up their wounds.',
      },
      {
        ref: 'Jeremiah 17:14',
        text: 'Heal me, O Yahweh, and I shall be healed. Save me, and I shall be saved; for you are my praise.',
      },
      {
        ref: 'James 5:15',
        text: 'And the prayer of faith will heal him who is sick, and the Lord will raise him up.',
      },
    ],
  },
  {
    id: 'provision',
    keywords: [
      'money', 'bills', 'broke', 'poor', 'job', 'unemployed', 'work', 'finances',
      'financial', 'rent', 'debt', 'provide', 'provision', 'need',
    ],
    intros: [
      'Your needs are not invisible. They are counted, every one.',
      'Look at the birds of the sky, and take heart.',
    ],
    verses: [
      {
        ref: 'Matthew 6:26',
        text: 'See the birds of the sky, that they don’t sow, neither do they reap, nor gather into barns. Your heavenly Father feeds them. Aren’t you of much more value than they?',
      },
      {
        ref: 'Philippians 4:19',
        text: 'My God will supply every need of yours according to his riches in glory in Christ Jesus.',
      },
      {
        ref: 'Matthew 6:33',
        text: 'But seek first God’s Kingdom and his righteousness; and all these things will be given to you as well.',
      },
    ],
  },
  {
    id: 'guidance',
    keywords: [
      'decision', 'decide', 'choice', 'choose', 'lost', 'direction', 'confused',
      'guidance', 'what should i do', 'which way', 'path', 'purpose', 'future',
    ],
    intros: [
      'You don’t need the whole map today. Only the next faithful step.',
      'Bring the crossroads here. Let’s look at it together.',
    ],
    verses: [
      {
        ref: 'Proverbs 3:5–6',
        text: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.',
      },
      {
        ref: 'Psalm 119:105',
        text: 'Your word is a lamp to my feet, and a light for my path.',
      },
      {
        ref: 'James 1:5',
        text: 'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.',
      },
    ],
  },
  {
    id: 'doubt',
    keywords: [
      'doubt', 'doubting', 'faith', 'believe', 'unbelief', 'is god real',
      'are you real', 'questioning', 'skeptic',
    ],
    intros: [
      'Doubt that comes looking for truth is not the enemy of faith. It is often the road to it.',
      'Bring your questions. They are welcome here.',
    ],
    verses: [
      {
        ref: 'Mark 9:24',
        text: 'Immediately the father of the child cried out with tears, “I believe. Help my unbelief!”',
      },
      {
        ref: 'Matthew 7:7',
        text: 'Ask, and it will be given you. Seek, and you will find. Knock, and it will be opened for you.',
      },
      {
        ref: 'John 20:29',
        text: 'Because you have seen me, you have believed. Blessed are those who have not seen and have believed.',
      },
    ],
  },
  {
    id: 'gratitude',
    keywords: [
      'thank', 'thanks', 'grateful', 'gratitude', 'blessed', 'happy', 'joy',
      'joyful', 'good news', 'celebrate', 'amazing day', 'great day',
    ],
    intros: [
      'This gladness looks good on you. Let’s give it somewhere to go.',
      'Joy shared is joy doubled. I am glad with you.',
    ],
    verses: [
      {
        ref: '1 Thessalonians 5:16–18',
        text: 'Always rejoice. Pray without ceasing. In everything give thanks, for this is the will of God in Christ Jesus toward you.',
      },
      {
        ref: 'Psalm 118:24',
        text: 'This is the day that Yahweh has made. We will rejoice and be glad in it!',
      },
      {
        ref: 'James 1:17',
        text: 'Every good gift and every perfect gift is from above, coming down from the Father of lights.',
      },
    ],
  },
  {
    id: 'love',
    keywords: [
      'love', 'loved', 'unloved', 'relationship', 'marriage', 'breakup',
      'broke up', 'divorce', 'heartbreak', 'rejected', 'rejection',
    ],
    intros: [
      'Before anyone else’s opinion of you existed, you were already loved.',
      'Human love can wound. There is a love that does not.',
    ],
    verses: [
      {
        ref: 'Romans 8:38–39',
        text: 'For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers, nor height, nor depth, nor any other created thing will be able to separate us from the love of God which is in Christ Jesus our Lord.',
      },
      {
        ref: 'John 15:12',
        text: 'This is my commandment, that you love one another, even as I have loved you.',
      },
      {
        ref: '1 John 4:19',
        text: 'We love him, because he first loved us.',
      },
      {
        ref: 'Zephaniah 3:17',
        text: 'Yahweh, your God, is among you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing.',
      },
    ],
  },
  {
    id: 'temptation',
    keywords: [
      'temptation', 'tempted', 'addiction', 'addicted', 'relapse', 'habit',
      'struggle with', 'can’t stop', 'cant stop',
    ],
    intros: [
      'The pull you feel is real, and so is the way out. You are not trapped.',
      'One honest moment at a time. That is how freedom is built.',
    ],
    verses: [
      {
        ref: '1 Corinthians 10:13',
        text: 'No temptation has taken you except what is common to man. God is faithful, who will not allow you to be tempted above what you are able, but will with the temptation also make the way of escape, that you may be able to endure it.',
      },
      {
        ref: 'Galatians 5:1',
        text: 'Stand firm therefore in the liberty by which Christ has made us free, and don’t be entangled again with a yoke of bondage.',
      },
      {
        ref: 'Psalm 51:10',
        text: 'Create in me a clean heart, O God. Renew a right spirit within me.',
      },
    ],
  },
  {
    id: 'greeting',
    keywords: [
      'hello', 'hi', 'hey', 'good morning', 'good evening', 'good night',
      'how are you', 'greetings',
    ],
    intros: [
      'Hello, friend. I am here, and I am listening.',
      'Peace be with you. What is on your heart today?',
      'Welcome. Speak freely — nothing you say here is too small or too heavy.',
    ],
    verses: [
      {
        ref: 'Psalm 46:10',
        text: 'Be still, and know that I am God.',
      },
      {
        ref: 'Numbers 6:24–26',
        text: 'Yahweh bless you, and keep you. Yahweh make his face to shine on you, and be gracious to you. Yahweh lift up his face toward you, and give you peace.',
      },
    ],
  },
];

// Fallback when nothing matches.
export const GENERAL: Topic = {
  id: 'general',
  keywords: [],
  intros: [
    'I am listening. Tell me more about what is on your heart.',
    'Thank you for sharing that with me. Whatever you carry, you do not carry it alone.',
    'I hear you. Let these words rest with you a moment.',
  ],
  verses: [
    {
      ref: 'Psalm 46:10',
      text: 'Be still, and know that I am God.',
    },
    {
      ref: 'Matthew 7:7',
      text: 'Ask, and it will be given you. Seek, and you will find. Knock, and it will be opened for you.',
    },
    {
      ref: 'Micah 6:8',
      text: 'He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?',
    },
    {
      ref: 'Psalm 139:23–24',
      text: 'Search me, God, and know my heart. Try me, and know my thoughts. See if there is any wicked way in me, and lead me in the everlasting way.',
    },
  ],
};
