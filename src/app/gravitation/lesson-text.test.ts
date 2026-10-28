import { describe, expect, it } from "vitest";
import { es } from "@/content/es";

// Spec 04, L19 and Decision 18: distances fallen are "in one second", never a
// speed. The other accuracy rules depend on meaning, so they stay in review.
const FORBIDDEN = /por segundo/i;
// Template functions are called with these to check what they produce.
const SAMPLE_ARGUMENTS = [1, 2, 60] as const;

function lessonTexts(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "function") {
    return SAMPLE_ARGUMENTS.map((sample) => String(value(sample)));
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(lessonTexts);
  }

  return [];
}

describe("lesson text", () => {
  it("no lesson text says 'por segundo'", () => {
    const texts = lessonTexts(es.gravitation);

    expect(texts.length).toBeGreaterThan(50);
    expect(texts.filter((text) => FORBIDDEN.test(text))).toEqual([]);
  });
});
