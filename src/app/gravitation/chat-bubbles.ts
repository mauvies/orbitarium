// The conversation's two kinds of message (spec 05, Decision 11; visual
// style, "Tutor's panel"): the tutor's on the left on `surface`, the
// learner's on the right on `line`, the lighter of the two on the sheet and
// on the card; both in small text.
export const TUTOR_BUBBLE =
  "mr-8 space-y-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-small";

export const LEARNER_BUBBLE =
  "ml-8 rounded-[10px] bg-line px-3 py-2 text-small text-strong";
