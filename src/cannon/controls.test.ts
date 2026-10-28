import { describe, expect, it } from "vitest";
import { resolveRequest } from "./controls";
import type { CannonRequest, CannonSettings } from "./types";

// Spec 04, L10 and Decision 13.
const CURRENT: CannonSettings = Object.freeze({
  speedKmPerSecond: 7,
  angleDegrees: 45,
  altitudeKm: 10,
});

const SPEED_STEPS = 1_500; // 0 to 15 km/s by 0.01
const HEIGHT_STEPS = 199; // 10 to 2,000 km by 10

function applied(request: CannonRequest) {
  const result = resolveRequest(CURRENT, request);

  if (result.status !== "applied") {
    throw new Error(`expected the request to apply, got ${result.reason}`);
  }

  return result;
}

describe("resolveRequest: rejecting", () => {
  it.each([
    { name: "NaN", value: Number.NaN },
    { name: "Infinity", value: Number.POSITIVE_INFINITY },
    { name: "a string", value: "8" },
    { name: "null", value: null },
    { name: "undefined", value: undefined },
  ])("rejects $name as a speed, an angle or a height", ({ value }) => {
    expect(resolveRequest(CURRENT, { speedKmPerSecond: value })).toEqual({
      status: "rejected",
      field: "speedKmPerSecond",
      reason: "must be a finite number",
    });
    expect(resolveRequest(CURRENT, { angleDegrees: value })).toEqual({
      status: "rejected",
      field: "angleDegrees",
      reason: "must be a finite number",
    });
    expect(resolveRequest(CURRENT, { altitudeKm: value })).toEqual({
      status: "rejected",
      field: "altitudeKm",
      reason: "must be a finite number",
    });
  });

  it("checks the speed before the angle", () => {
    const result = resolveRequest(CURRENT, {
      speedKmPerSecond: Number.NaN,
      angleDegrees: Number.NaN,
    });

    expect(result).toMatchObject({
      status: "rejected",
      field: "speedKmPerSecond",
    });
  });

  it("checks the angle before the height", () => {
    const result = resolveRequest(CURRENT, {
      angleDegrees: Number.NaN,
      altitudeKm: Number.NaN,
    });

    expect(result).toMatchObject({ status: "rejected", field: "angleDegrees" });
  });

  it("applies nothing when one field is rejected", () => {
    const result = resolveRequest(CURRENT, {
      speedKmPerSecond: 9,
      angleDegrees: "high",
    });

    expect(result).toEqual({
      status: "rejected",
      field: "angleDegrees",
      reason: "must be a finite number",
    });
    expect(CURRENT).toEqual({
      speedKmPerSecond: 7,
      angleDegrees: 45,
      altitudeKm: 10,
    });
  });
});

describe("resolveRequest: rounding", () => {
  it("7.9049 km/s is applied as 7.90", () => {
    expect(applied({ speedKmPerSecond: 7.9049 }).speedKmPerSecond).toBe(7.9);
  });

  it("every speed from 0 to 15 in steps of 0.01 rounds to its two-decimal literal", () => {
    const speeds = Array.from({ length: SPEED_STEPS + 1 }, (_, i) =>
      (i / 100).toFixed(2),
    );

    const mismatches = speeds.filter(
      (literal) =>
        applied({ speedKmPerSecond: Number(literal) }).speedKmPerSecond !==
        Number(literal),
    );

    expect(mismatches).toEqual([]);
    expect(applied({ speedKmPerSecond: 0.35 }).speedKmPerSecond).toBe(0.35);
  });

  it("an angle rounds to whole degrees", () => {
    expect(applied({ angleDegrees: 29.6 }).angleDegrees).toBe(30);
  });

  it("2,004 km is applied as 2,000", () => {
    expect(applied({ altitudeKm: 2_004 }).altitudeKm).toBe(2_000);
  });

  it("every height from 10 to 2,000 km in steps of 10 is applied as itself", () => {
    const heights = Array.from(
      { length: HEIGHT_STEPS + 1 },
      (_, i) => 10 + i * 10,
    );

    const mismatches = heights.filter(
      (altitudeKm) => applied({ altitudeKm }).altitudeKm !== altitudeKm,
    );

    expect(mismatches).toEqual([]);
    expect(applied({ altitudeKm: 415 }).altitudeKm).toBe(420);
  });

  it("-0 becomes 0", () => {
    const result = applied({ speedKmPerSecond: -0, angleDegrees: -0.004 });

    expect(Object.is(result.speedKmPerSecond, 0)).toBe(true);
    expect(Object.is(result.angleDegrees, 0)).toBe(true);
    expect(result.clamped).toEqual([]);
  });
});

describe("resolveRequest: clamping", () => {
  it("50 km/s is clamped to 15", () => {
    expect(applied({ speedKmPerSecond: 50 })).toMatchObject({
      speedKmPerSecond: 15,
      clamped: ["speedKmPerSecond"],
    });
  });

  it("-3 is clamped to 0", () => {
    expect(applied({ speedKmPerSecond: -3, angleDegrees: -3 })).toMatchObject({
      speedKmPerSecond: 0,
      angleDegrees: 0,
      clamped: ["speedKmPerSecond", "angleDegrees"],
    });
  });

  it("an angle over 90° is clamped to 90", () => {
    expect(applied({ angleDegrees: 120 })).toMatchObject({
      angleDegrees: 90,
      clamped: ["angleDegrees"],
    });
  });

  it("0 km is clamped to 10", () => {
    expect(applied({ altitudeKm: 0 })).toMatchObject({
      altitudeKm: 10,
      clamped: ["altitudeKm"],
    });
  });

  it("5 km rounds to 10 and is not reported as clamped", () => {
    expect(applied({ altitudeKm: 5 })).toMatchObject({
      altitudeKm: 10,
      clamped: [],
    });
  });

  it("a height over 2,000 km is clamped to 2,000", () => {
    expect(applied({ altitudeKm: 36_000 })).toMatchObject({
      altitudeKm: 2_000,
      clamped: ["altitudeKm"],
    });
  });

  it("15.004 is not reported as clamped", () => {
    expect(applied({ speedKmPerSecond: 15.004 })).toMatchObject({
      speedKmPerSecond: 15,
      clamped: [],
    });
  });
});

describe("resolveRequest: absent fields", () => {
  it("an absent field keeps the current value", () => {
    expect(applied({ speedKmPerSecond: 9 })).toEqual({
      status: "applied",
      speedKmPerSecond: 9,
      angleDegrees: 45,
      altitudeKm: 10,
      clamped: [],
    });
    expect(applied({ angleDegrees: 10 })).toEqual({
      status: "applied",
      speedKmPerSecond: 7,
      angleDegrees: 10,
      altitudeKm: 10,
      clamped: [],
    });
    expect(applied({ altitudeKm: 400 })).toEqual({
      status: "applied",
      speedKmPerSecond: 7,
      angleDegrees: 45,
      altitudeKm: 400,
      clamped: [],
    });
  });

  it("an empty request returns the current settings", () => {
    expect(applied({})).toEqual({ status: "applied", ...CURRENT, clamped: [] });
  });
});
