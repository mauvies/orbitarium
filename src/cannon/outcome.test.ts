import { describe, expect, it } from "vitest";
import { launchOrbit, launchOutcome } from "./outcome";
import type { CannonOutcome } from "./types";
import { EARTH_RADIUS_KM } from "./units";

// Spec 04, L6. The expected values were computed independently with the
// orbital formulas during the plan review, not read back from this code.
const HORIZONTAL = 0;
const STRAIGHT_UP = 90;
const ESCAPE_SPEED_STEPS = 1_118; // 11.18 km/s, in steps of 0.01 km/s

/** Every speed below escape, as two-decimal literals: 0, 0.01, … 11.17. */
const SPEEDS_BELOW_ESCAPE = Array.from(
  { length: ESCAPE_SPEED_STEPS },
  (_, i) => i / 100,
);

function outcome(
  speedKmPerSecond: number,
  angleDegrees: number,
): CannonOutcome {
  return launchOutcome({ speedKmPerSecond, angleDegrees });
}

function perigeeAltitudeKm(speedKmPerSecond: number): number {
  const { periapsisRadius } = launchOrbit({
    speedKmPerSecond,
    angleDegrees: HORIZONTAL,
  });
  return (periapsisRadius - 1) * EARTH_RADIUS_KM;
}

function eccentricity(speedKmPerSecond: number): number {
  return launchOrbit({ speedKmPerSecond, angleDegrees: HORIZONTAL })
    .eccentricity;
}

describe("launchOutcome: hitting the ground or orbiting", () => {
  it("7.90 km/s at 0° is ballistic: its perigee is 1.57 km below the surface", () => {
    expect(perigeeAltitudeKm(7.9)).toBeCloseTo(-1.57, 2);
    expect(outcome(7.9, HORIZONTAL)).toBe("ballistic");
  });

  it("7.91 km/s at 0° orbits: its perigee is the launch point, 10 km up", () => {
    expect(perigeeAltitudeKm(7.91)).toBeCloseTo(10, 6);
    expect(outcome(7.91, HORIZONTAL)).toBe("circular-orbit");
  });
});

describe("launchOutcome: circular or elliptical", () => {
  it("7.94 km/s at 0° is a circular orbit (e = 0.00924)", () => {
    expect(eccentricity(7.94)).toBeCloseTo(0.00924, 5);
    expect(outcome(7.94, HORIZONTAL)).toBe("circular-orbit");
  });

  it("7.95 km/s at 0° is an elliptical orbit (e = 0.01178)", () => {
    expect(eccentricity(7.95)).toBeCloseTo(0.01178, 5);
    expect(outcome(7.95, HORIZONTAL)).toBe("elliptical-orbit");
  });
});

describe("launchOutcome: orbiting or escaping", () => {
  it("11.17 km/s at 0° is an elliptical orbit", () => {
    expect(outcome(11.17, HORIZONTAL)).toBe("elliptical-orbit");
  });

  it("11.18 km/s at 0° escapes", () => {
    expect(outcome(11.18, HORIZONTAL)).toBe("escape");
  });

  it("11.17 km/s at 90° is ballistic", () => {
    expect(outcome(11.17, STRAIGHT_UP)).toBe("ballistic");
  });

  it("11.18 km/s at 90° escapes", () => {
    expect(outcome(11.18, STRAIGHT_UP)).toBe("escape");
  });
});

describe("launchOutcome: no sideways speed (h = 0)", () => {
  it("speed 0 is ballistic", () => {
    expect(outcome(0, HORIZONTAL)).toBe("ballistic");
  });

  it("every speed below escape at 90° is ballistic", () => {
    const outcomes = new Set(
      SPEEDS_BELOW_ESCAPE.map((speed) => outcome(speed, STRAIGHT_UP)),
    );

    expect([...outcomes]).toEqual(["ballistic"]);
  });
});

describe("launchOutcome: angled shots", () => {
  it("from 3° up, no speed below escape gives an orbit", () => {
    const angles = Array.from({ length: 88 }, (_, i) => i + 3);
    const outcomes = new Set(
      angles.flatMap((angle) =>
        SPEEDS_BELOW_ESCAPE.map((speed) => outcome(speed, angle)),
      ),
    );

    expect([...outcomes]).toEqual(["ballistic"]);
  });

  it.each([
    { angle: 1, lastBallistic: 8.31, firstOrbit: 8.32 },
    { angle: 2, lastBallistic: 10.1, firstOrbit: 10.11 },
  ])("at $angle° orbits start at $firstOrbit km/s, and only as ellipses", ({
    angle,
    lastBallistic,
    firstOrbit,
  }) => {
    const orbiting = SPEEDS_BELOW_ESCAPE.filter(
      (speed) => outcome(speed, angle) !== "ballistic",
    );

    expect(outcome(lastBallistic, angle)).toBe("ballistic");
    expect(orbiting[0]).toBe(firstOrbit);
    expect(orbiting.at(-1)).toBe(11.17);
    expect(new Set(orbiting.map((speed) => outcome(speed, angle)))).toEqual(
      new Set(["elliptical-orbit"]),
    );
  });
});
