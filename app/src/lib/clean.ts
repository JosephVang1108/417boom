// Language safety for everything shown on screen.
//
// What a person says (typed or transcribed from speech) is displayed
// under his face — profanity and slurs must never sit there in plain
// text. The obscenity package catches common profanity and slurs,
// including disguised spellings (f@ck, sh1t), and we mask them with
// asterisks for display and for anything stored (prayer journal).
//
// The ORIGINAL text still goes to the AI so he understands what was
// said and can answer it with grace — the system prompt governs how
// he responds to hateful language (never repeating it, gently
// countering it).
import {
  RegExpMatcher,
  TextCensor,
  asteriskCensorStrategy,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const censor = new TextCensor().setStrategy(asteriskCensorStrategy());

// Slurs the library's dataset misses: racial/ethnic slurs, anti-gay and
// anti-trans slurs, ableist insults. Word boundaries (\b) keep ordinary
// words that merely contain these letters unmasked ("gobbledygook",
// "Japan", "spice", "homosexual", "Montenegro" all pass).
// Identity words people use for themselves (gay, queer, Black, Jewish,
// Muslim, …) are deliberately NOT here — masking those would wound the
// very people asking sincere questions.
const EXTRA_SLURS = new RegExp(
  '\\b(?:' +
    [
      'gooks?',
      'chinks?',
      'spics?',
      'kikes?',
      'wetbacks?',
      'beaners?',
      'coons?',
      'dark(?:ie|y|ies)',
      'jigaboos?',
      'zipperheads?',
      'towel ?heads?',
      'rag ?heads?',
      'porch ?monk(?:ey|eys)',
      'camel ?jock(?:ey|eys)',
      'injuns?',
      'squaws?',
      'polacks?',
      'wops?',
      'dagos?',
      'krauts?',
      'honk(?:y|ie|ies)',
      'slant ?-?eyes?d?',
      'half ?-?breeds?',
      'redskins?',
      'negro(?:es)?',
      'sambos?',
      'yids?',
      'heebs?',
      'pakis?',
      'abos?',
      'japs?',
      'gyp(?:ped|s)?',
      'trann(?:y|ie|ies)',
      'shemales?',
      'homos?',
      'dykes?',
      'retard(?:s|ed)?',
      'midgets?',
      'spazz?(?:es)?',
      'white ?trash',
    ].join('|') +
    ')\\b',
  'gi'
);

function maskExtras(text: string): string {
  return text.replace(EXTRA_SLURS, (m) => '*'.repeat(m.length));
}

/** Mask profanity/slurs with asterisks; returns the text unchanged
 * when it's clean (the common case). */
export function cleanForDisplay(text: string): string {
  try {
    const matches = matcher.getAllMatches(text);
    const first = matches.length ? censor.applyTo(text, matches) : text;
    return maskExtras(first);
  } catch {
    return text;
  }
}

/** True when the text contains profanity or slurs. */
export function hasProfanity(text: string): boolean {
  try {
    if (matcher.hasMatch(text)) return true;
    EXTRA_SLURS.lastIndex = 0;
    return EXTRA_SLURS.test(text);
  } catch {
    return false;
  }
}
