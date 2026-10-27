// Spec 04, Decision 1: the parts of the lesson page, in order. `cannon` is
// the band of Newton's cannon, between the orbit question and the law.
export const SECTION_IDS = [
  "falling",
  "mutual",
  "moon",
  "orbit",
  "cannon",
  "law",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function parseSection(value: string): SectionId | null {
  return SECTION_IDS.find((section) => section === value) ?? null;
}
