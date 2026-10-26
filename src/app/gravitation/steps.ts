// Spec 04, Decision 1: the parts of the lesson page, in order. `cannon` is the
// band of Newton's cannon, between the orbit question and the law.
export const STEP_IDS = [
  "falling",
  "mutual",
  "moon",
  "orbit",
  "cannon",
  "law",
] as const;

export type StepId = (typeof STEP_IDS)[number];

export function parseStep(value: string): StepId | null {
  return STEP_IDS.find((step) => step === value) ?? null;
}

/** A part's address: its anchor on the lesson page. */
export function stepPath(step: StepId): string {
  return `/gravitation#${step}`;
}
