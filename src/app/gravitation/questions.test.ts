import { describe, expect, it } from "vitest";
import { grade, QUESTIONS, questionText } from "./questions";

// Spec 04, L3 and Decision 5: the five questions of "Questions and misconceptions".
const SPEC_QUESTIONS = [
  { id: "two-falls", section: "falling", concept: "fall-direction" },
  { id: "who-pulls-harder", section: "mutual", concept: "mutual-attraction" },
  { id: "twice-as-far", section: "moon", concept: "inverse-square" },
  {
    id: "why-the-moon-does-not-fall",
    section: "orbit",
    concept: "orbit-as-falling",
  },
  { id: "twice-the-mass", section: "law", concept: "full-law" },
];

const allOptions = QUESTIONS.flatMap((question) =>
  question.options.map((option) => ({ question, option })),
);

describe("questions", () => {
  it("are the spec's five, in order, with their parts and concepts", () => {
    expect(
      QUESTIONS.map(({ id, section, concept }) => ({ id, section, concept })),
    ).toEqual(SPEC_QUESTIONS);
  });

  it("each has exactly one correct option", () => {
    for (const question of QUESTIONS) {
      expect(
        question.options.filter((option) => option.misconception === null),
      ).toHaveLength(1);
    }
  });

  it("every wrong option names a misconception", () => {
    const wrong = allOptions.filter(
      ({ option }) => option.misconception !== null,
    );

    // Three in each of the four-option questions (falling, mutual, moon and
    // orbit), two in the law's.
    expect(wrong).toHaveLength(14);
    for (const { option } of wrong) {
      expect(option.misconception).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it.each(allOptions)("grades each option: $question.id, $option.id", ({
    question,
    option,
  }) => {
    expect(grade(question.id, option.id)).toEqual(
      option.misconception === null
        ? { status: "correct" }
        : { status: "misconception", misconception: option.misconception },
    );
  });

  it("rejects an option the question does not have", () => {
    expect(() => grade("two-falls", "half")).toThrow(RangeError);
    expect(() => grade("two-falls", "half")).toThrow("option");
  });

  it.each(
    allOptions,
  )("has Spanish text for every option: $question.id, $option.id", ({
    question,
    option,
  }) => {
    const text = questionText(question.id);

    expect(text.prompt).not.toBe("");
    expect(text.option(option.id).label).not.toBe("");
    expect(text.option(option.id).feedback).not.toBe("");
  });
});
