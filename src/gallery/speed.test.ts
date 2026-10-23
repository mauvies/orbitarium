import { describe, expect, it } from "vitest";
import { simulationTimeFor } from "./speed";

const ONE_SECOND_MS = 1_000;

// Spec 03, Decision 7: at 1×, one second on screen is one unit of time.
describe("simulationTimeFor", () => {
  it("plays one unit of simulation time per second at 1×", () => {
    expect(simulationTimeFor(ONE_SECOND_MS, 1)).toBe(1);
  });

  it.each([0.5, 2, 4] as const)("scales with the speed at %s×", (speed) => {
    expect(simulationTimeFor(ONE_SECOND_MS, speed)).toBe(speed);
  });

  it("plays nothing in no time", () => {
    expect(simulationTimeFor(0, 4)).toBe(0);
  });

  it.each([
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects an elapsed time of %s naming the field", (elapsedMs) => {
    const call = () => simulationTimeFor(elapsedMs, 1);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/elapsedMs/);
  });
});
