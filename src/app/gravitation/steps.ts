// Spec 04, Decision 1: the five steps of the design note, in order.
export const STEP_IDS = ["falling", "mutual", "moon", "cannon", "law"] as const;

export type StepId = (typeof STEP_IDS)[number];

export function parseStep(value: string): StepId | null {
  return STEP_IDS.find((step) => step === value) ?? null;
}

export function stepPath(step: StepId): string {
  return `/gravitation/${step}`;
}

export function previousStep(step: StepId): StepId | null {
  return STEP_IDS[STEP_IDS.indexOf(step) - 1] ?? null;
}

export function nextStep(step: StepId): StepId | null {
  return STEP_IDS[STEP_IDS.indexOf(step) + 1] ?? null;
}
