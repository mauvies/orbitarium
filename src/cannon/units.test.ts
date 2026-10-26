import { describe, expect, it } from "vitest";
import {
  engineToKmPerSecond,
  kmPerSecondToEngine,
  SPEED_UNIT_KM_PER_SECOND,
  TIME_UNIT_SECONDS,
} from "./units";

// Spec 04, L5.
const ROUND_TRIP_TOLERANCE = 1e-12;
const SPEEDS_KM_PER_SECOND = {
  "the finest step": 0.01,
  "a circular orbit": 7.91,
  "the escape speed": 11.18,
  "the fastest launch": 15,
};

describe("units", () => {
  it("one speed unit is 7.910 km/s, the circular speed at the surface", () => {
    expect(SPEED_UNIT_KM_PER_SECOND).toBeCloseTo(7.91, 3);
  });

  it("one time unit is 805.5 s", () => {
    expect(TIME_UNIT_SECONDS).toBeCloseTo(805.5, 1);
  });

  it.each(
    Object.entries(SPEEDS_KM_PER_SECOND),
  )("km/s to engine units and back returns the input: %s", (_, speedKmPerSecond) => {
    const roundTrip = engineToKmPerSecond(
      kmPerSecondToEngine(speedKmPerSecond),
    );

    expect(Math.abs(roundTrip - speedKmPerSecond)).toBeLessThanOrEqual(
      ROUND_TRIP_TOLERANCE * speedKmPerSecond,
    );
  });
});
