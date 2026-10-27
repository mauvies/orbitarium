// Spec 05, T13: what the eval can check without reading. Pure, so a test pins
// it; `scripts/eval-tutor.mjs` imports it with Node's type stripping, which
// is why it has no alias and no syntax that needs a transform.

export type AnswerFlags = {
  /** Bold, code or a heading: the panel shows plain text, so they would show as symbols. */
  readonly markdown: boolean;
  /** A line that starts like a list item. */
  readonly list: boolean;
  /** «por segundo» said of something that is not a speed. */
  readonly perSecond: boolean;
};

const MARKDOWN = /\*\*|__|`|^\s*#{1,6}\s/m;
const LIST = /^\s*(?:[-*•]|\d+\.)\s/m;
const PER_SECOND = /por segundo/gi;
// Decision 5's rule is about distances fallen, which are «en un segundo»; a
// speed is «por segundo» right after its unit.
const UNIT_BEFORE = /\b(?:km|kil[oó]metros?|m|metros?)\s+$/i;

export function answerFlags(text: string): AnswerFlags {
  return {
    markdown: MARKDOWN.test(text),
    list: LIST.test(text),
    perSecond: [...text.matchAll(PER_SECOND)].some(
      ({ index }) => !UNIT_BEFORE.test(text.slice(0, index)),
    ),
  };
}
