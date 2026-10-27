import { describe, expect, it } from "vitest";
import { parseSection, SECTION_IDS } from "./section-ids";

// Spec 04, Decision 1: the parts of the page, in order.
describe("section ids", () => {
  it("are the page's parts in order, the cannon band after the orbit question", () => {
    expect(SECTION_IDS).toEqual([
      "falling",
      "mutual",
      "moon",
      "orbit",
      "cannon",
      "law",
    ]);
  });

  it("parses a part and rejects anything else", () => {
    expect(parseSection("orbit")).toBe("orbit");
    expect(parseSection("cannon")).toBe("cannon");
    expect(parseSection("prediction")).toBeNull();
  });
});
