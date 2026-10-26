import { describe, expect, it } from "vitest";
import { grade, isStepAnswered, QUESTIONS, questionText } from "./questions";

// Spec 04, L3 and Decision 5: the six questions of "Questions and misconceptions".
const DESIGN_NOTE_QUESTIONS = [
  { id: "two-falls", step: "falling", concept: "fall-direction" },
  { id: "who-pulls-harder", step: "mutual", concept: "mutual-attraction" },
  { id: "twice-as-far", step: "moon", concept: "inverse-square" },
  { id: "launch-at-12", step: "cannon", concept: "orbit-as-falling" },
  {
    id: "why-the-moon-does-not-fall",
    step: "cannon",
    concept: "orbit-as-falling",
  },
  { id: "twice-the-mass", step: "law", concept: "full-law" },
];

const allOptions = QUESTIONS.flatMap((question) =>
  question.options.map((option) => ({ question, option })),
);

describe("questions", () => {
  it("are the spec's six, in order, with their steps and concepts", () => {
    expect(
      QUESTIONS.map(({ id, step, concept }) => ({ id, step, concept })),
    ).toEqual(DESIGN_NOTE_QUESTIONS);
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
    // the cannon's second), two in the prediction and in the law's.
    expect(wrong).toHaveLength(16);
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

// Spec 04, Decision 3: the step list marks a step once all its questions are answered.
describe("isStepAnswered", () => {
  it("a step with one question is answered once it is", () => {
    expect(isStepAnswered("falling", {})).toBe(false);
    expect(isStepAnswered("falling", { "two-falls": "centre" })).toBe(true);
  });

  it("step 4 needs both of its questions", () => {
    expect(isStepAnswered("cannon", { "launch-at-12": "escapes" })).toBe(false);
    expect(
      isStepAnswered("cannon", {
        "launch-at-12": "escapes",
        "why-the-moon-does-not-fall": "falls-sideways",
      }),
    ).toBe(true);
  });
});
