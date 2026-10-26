import { describe, expect, it } from "vitest";
import { MOON_DISTANCE_RADII, pullFraction } from "./inverse-square";

// Spec 04, L14: the pull relative to the surface, at a distance from the
// Earth's centre in Earth radii.
describe("pullFraction", () => {
  it("is the whole pull at the surface", () => {
    expect(pullFraction(1)).toEqual({ denominator: 1 });
  });

  it("twice the distance is 1/4", () => {
    expect(pullFraction(2)).toEqual({ denominator: 4 });
  });

  it("60 radii, the Moon's distance, is 1/3600", () => {
    expect(MOON_DISTANCE_RADII).toBe(60);
    expect(pullFraction(MOON_DISTANCE_RADII)).toEqual({ denominator: 3600 });
  });

  it.each([0, 61, 2.5, Number.NaN])("rejects a distance of %s radii", (d) => {
    expect(() => pullFraction(d)).toThrow(RangeError);
    expect(() => pullFraction(d)).toThrow("distanceRadii");
  });
});
