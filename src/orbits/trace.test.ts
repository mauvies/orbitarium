import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/physics";
import { deepFreeze, maxDistance } from "@/physics/testing/assertions";
import { advancePlayback, startPlayback } from "./playback";
import { positions, presetOf } from "./testing/support";
import { tracePeriod } from "./trace";

// Spec 02, O8: spec 01's tolerance for Lagrange's closure at the same dt (E7).
// Measured: 5.3e-9.
const ROTATION_TOLERANCE = 1e-7;
const LAGRANGE_POINTS = 100;
const FIGURE_EIGHT_POINTS = 10;

const lagrange = presetOf("lagrange");
const figureEight = presetOf("figure-eight");

/** Rotates a position counter-clockwise about the origin. */
function rotate({ x, y }: Vec2, angle: number): Vec2 {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}

// Spec 02, O8.
describe("traces one period", () => {
  const trace = tracePeriod(lagrange, LAGRANGE_POINTS);

  it("returns `points` samples for each body", () => {
    expect(trace.map((track) => track.length)).toStrictEqual([
      LAGRANGE_POINTS,
      LAGRANGE_POINTS,
      LAGRANGE_POINTS,
    ]);
  });

  it("starts at the initial positions", () => {
    expect(trace.map((track) => track[0])).toStrictEqual(
      positions(lagrange.initialState),
    );
  });

  it("spaces samples evenly in time over one period", () => {
    // Lagrange's exact solution rotates the triangle rigidly about the
    // origin, once per period, so sample i is the start turned by 2π·i/points.
    const rigidRotation = lagrange.initialState.bodies.map(({ position }) =>
      Array.from({ length: LAGRANGE_POINTS }, (_, sample) =>
        rotate(position, (2 * Math.PI * sample) / LAGRANGE_POINTS),
      ),
    );

    expect(maxDistance(trace.flat(), rigidRotation.flat())).toBeLessThanOrEqual(
      ROTATION_TOLERANCE,
    );
  });

  it("passes through the positions of the playback", () => {
    const figureEightTrace = tracePeriod(figureEight, FIGURE_EIGHT_POINTS);
    const options = {
      reanchor: true,
      maxSubsteps: figureEight.stepsPerPeriod,
    };
    let playback = startPlayback(figureEight);
    for (let sample = 0; sample < FIGURE_EIGHT_POINTS; sample++) {
      expect(figureEightTrace.map((track) => track[sample])).toStrictEqual(
        positions(playback.state),
      );
      playback = advancePlayback(
        playback,
        figureEight.period / FIGURE_EIGHT_POINTS,
        options,
      );
    }
  });
});

// Spec 02, O9.
describe("does not mutate its input", () => {
  const orbit = deepFreeze(structuredClone(lagrange));

  it("leaves the orbit unchanged", () => {
    const snapshot = structuredClone(orbit);

    tracePeriod(orbit, LAGRANGE_POINTS);

    expect(orbit).toStrictEqual(snapshot);
  });

  it("gives the same output for the same input", () => {
    expect(tracePeriod(orbit, LAGRANGE_POINTS)).toStrictEqual(
      tracePeriod(orbit, LAGRANGE_POINTS),
    );
  });
});

// Spec 02, O10.
describe("rejects invalid input naming the field", () => {
  it.each([
    0,
    1.5,
    Number.NaN,
    // Lagrange has 1,000 steps per period: 3 and 2,000 do not divide it.
    3,
    2000,
  ])("rejects %s points", (points) => {
    const call = () => tracePeriod(lagrange, points);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/points/);
  });
});
