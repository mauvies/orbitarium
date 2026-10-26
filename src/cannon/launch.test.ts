import { describe, expect, it } from "vitest";
import { circularSpeed, launchState } from "./launch";
import {
  EARTH_RADIUS_KM,
  engineToKmPerSecond,
  kmPerSecondToEngine,
  LAUNCH_RADIUS,
} from "./units";

// Spec 04, Decision 8: the cannon fires from 10 km, 6,381 km from the centre.
const LAUNCH_RADIUS_KM = 6_381;
const ANY_SPEED_KM_PER_SECOND = 7;
const POSITION_TOLERANCE = 1e-15;

describe("launchState", () => {
  it("launches from 10 km above the surface", () => {
    const { position } = launchState({
      speedKmPerSecond: ANY_SPEED_KM_PER_SECOND,
      angleDegrees: 0,
    });

    expect(position.x).toBe(0);
    expect(position.y * EARTH_RADIUS_KM).toBeCloseTo(LAUNCH_RADIUS_KM, 9);
  });

  it("fires along the ground at 0° and straight up at 90°", () => {
    const speed = kmPerSecondToEngine(ANY_SPEED_KM_PER_SECOND);
    const horizontal = launchState({
      speedKmPerSecond: ANY_SPEED_KM_PER_SECOND,
      angleDegrees: 0,
    });
    const straightUp = launchState({
      speedKmPerSecond: ANY_SPEED_KM_PER_SECOND,
      angleDegrees: 90,
    });

    expect(horizontal.velocity).toEqual({ x: speed, y: 0 });
    expect(Math.abs(straightUp.velocity.x)).toBeLessThan(
      POSITION_TOLERANCE * speed,
    );
    expect(straightUp.velocity.y).toBe(speed);
  });

  it.each([
    {
      field: "speedKmPerSecond",
      settings: { speedKmPerSecond: -1, angleDegrees: 0 },
    },
    {
      field: "speedKmPerSecond",
      settings: { speedKmPerSecond: Number.NaN, angleDegrees: 0 },
    },
    {
      field: "angleDegrees",
      settings: { speedKmPerSecond: 7, angleDegrees: -1 },
    },
    {
      field: "angleDegrees",
      settings: { speedKmPerSecond: 7, angleDegrees: 91 },
    },
    {
      field: "angleDegrees",
      settings: { speedKmPerSecond: 7, angleDegrees: Number.POSITIVE_INFINITY },
    },
  ])("rejects an invalid $field: $settings", ({ field, settings }) => {
    expect(() => launchState(settings)).toThrow(RangeError);
    expect(() => launchState(settings)).toThrow(field);
  });
});

describe("circularSpeed", () => {
  it("is one speed unit at the surface", () => {
    expect(circularSpeed(1)).toBe(1);
  });

  // Spec 04, Decision 8: the plan review's 7.90359 km/s at 10 km.
  it("is 7.904 km/s at the launch point", () => {
    expect(engineToKmPerSecond(circularSpeed(LAUNCH_RADIUS))).toBeCloseTo(
      7.904,
      3,
    );
  });

  it.each([0, -1, Number.NaN])("rejects a radius of %s", (radius) => {
    expect(() => circularSpeed(radius)).toThrow(RangeError);
    expect(() => circularSpeed(radius)).toThrow("radius");
  });
});
