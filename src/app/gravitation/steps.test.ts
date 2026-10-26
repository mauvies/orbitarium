import { describe, expect, it } from "vitest";
import { parseStep, STEP_IDS, stepPath } from "./steps";

// Spec 04, Decision 1: the parts of the page, in order.
describe("steps", () => {
  it("are the page's parts in order, the cannon band after the orbit question", () => {
    expect(STEP_IDS).toEqual([
      "falling",
      "mutual",
      "moon",
      "orbit",
      "cannon",
      "law",
    ]);
  });

  it("parses a part and rejects anything else", () => {
    expect(parseStep("orbit")).toBe("orbit");
    expect(parseStep("cannon")).toBe("cannon");
    expect(parseStep("prediction")).toBeNull();
  });

  it("a part's path is its anchor on the lesson page, so the tutor can open the cannon", () => {
    expect(stepPath("cannon")).toBe("/gravitation#cannon");
    expect(stepPath("falling")).toBe("/gravitation#falling");
  });
});
