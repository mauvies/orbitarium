import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/physics";
import { simplifyClosedPath } from "./simplify";
import { largestDistanceToClosedPath } from "./testing/geometry";

const UNIT_CIRCLE_SAMPLES = 1_000;
const TOLERANCE = 1e-3;

const unitCircle: readonly Vec2[] = Array.from(
  { length: UNIT_CIRCLE_SAMPLES },
  (_, i) => {
    const angle = (2 * Math.PI * i) / UNIT_CIRCLE_SAMPLES;

    return { x: Math.cos(angle), y: Math.sin(angle) };
  },
);

// A square of side 2 with a point in the middle of every side.
const squareWithMidpoints: readonly Vec2[] = [
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
];

describe("simplifyClosedPath", () => {
  it("keeps every input point within the tolerance of the simplified path", () => {
    const simplified = simplifyClosedPath(unitCircle, TOLERANCE);

    expect(
      largestDistanceToClosedPath(unitCircle, simplified),
    ).toBeLessThanOrEqual(TOLERANCE);
  });

  it("keeps fewer than twice the points the tolerance needs", () => {
    // A chord of a unit circle strays 1 − cos(θ/2) from it, which stays
    // within 1e-3 for arcs of up to 0.0894 rad: at least 71 chords. Splitting
    // the circle in halves, quarters and so on stops at the first power of
    // two above that: 128.
    const fewestChords = Math.ceil(
      (2 * Math.PI) / (2 * Math.acos(1 - TOLERANCE)),
    );

    const simplified = simplifyClosedPath(unitCircle, TOLERANCE);

    expect(simplified.length).toBeGreaterThanOrEqual(fewestChords);
    expect(simplified.length).toBeLessThan(2 * fewestChords);
  });

  it("drops the points on a straight line", () => {
    expect(simplifyClosedPath(squareWithMidpoints, TOLERANCE)).toEqual([
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ]);
  });

  it("starts at the first point and keeps the input order", () => {
    const simplified = simplifyClosedPath(unitCircle, TOLERANCE);
    const indices = simplified.map((point) => unitCircle.indexOf(point));

    expect(indices[0]).toBe(0);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it.each([
    0,
    -1,
    Number.NaN,
  ])("rejects a tolerance of %s naming the field", (tolerance) => {
    const call = () => simplifyClosedPath(unitCircle, tolerance);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/tolerance/);
  });

  it("rejects a path of fewer than two points naming the field", () => {
    const call = () => simplifyClosedPath([{ x: 0, y: 0 }], TOLERANCE);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/points/);
  });
});
