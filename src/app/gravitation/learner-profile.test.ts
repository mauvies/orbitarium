import { describe, expect, it } from "vitest";
import { learnerProfile } from "./learner-profile";

// Spec 04, L4 and Decision 6.
const NO_ANSWERS = {};

describe("learnerProfile", () => {
  it("an unanswered question is unknown", () => {
    expect(
      learnerProfile(NO_ANSWERS).every(
        (entry) => entry.result.status === "unknown",
      ),
    ).toBe(true);
  });

  it("records the misconception chosen", () => {
    const entry = learnerProfile({ "twice-as-far": "half" }).find(
      ({ question }) => question === "twice-as-far",
    );

    expect(entry).toEqual({
      question: "twice-as-far",
      concept: "inverse-square",
      result: {
        status: "misconception",
        misconception: "linear-with-distance",
      },
    });
  });

  it("records a correct answer", () => {
    const entry = learnerProfile({ "who-pulls-harder": "equal" }).find(
      ({ question }) => question === "who-pulls-harder",
    );

    expect(entry?.result).toEqual({ status: "correct" });
  });

  it("names each question's concept, in the lesson's order", () => {
    expect(learnerProfile(NO_ANSWERS).map(({ concept }) => concept)).toEqual([
      "fall-direction",
      "mutual-attraction",
      "inverse-square",
      "orbit-as-falling",
      "full-law",
    ]);
  });
});
