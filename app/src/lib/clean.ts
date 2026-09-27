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

/** Mask profanity/slurs with asterisks; returns the text unchanged
 * when it's clean (the common case). */
export function cleanForDisplay(text: string): string {
  try {
    const matches = matcher.getAllMatches(text);
    if (matches.length === 0) return text;
    return censor.applyTo(text, matches);
  } catch {
    return text;
  }
}

/** True when the text contains profanity or slurs. */
export function hasProfanity(text: string): boolean {
  try {
    return matcher.hasMatch(text);
  } catch {
    return false;
  }
}
