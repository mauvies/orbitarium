import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/physics";
import { circularSpeed, launchState } from "./launch";
import { launchOutcome } from "./outcome";
import { finalFrame, type Trace, traceFrame, traceLaunch } from "./trajectory";
import type { CannonOutcome, CannonSettings } from "./types";
import { EARTH_RADIUS, launchRadius, MOUNTAIN_ALTITUDE_KM } from "./units";

// Spec 04, L8. The grid of the criterion: 0 to 15 km/s by 0.5, at four angles.
const GRID_SPEEDS_KM_PER_SECOND = Array.from({ length: 31 }, (_, i) => i / 2);
const GRID_ANGLES_DEGREES = [0, 30, 60, 90];

// The grid has no circular launch: the window is 7.9036 to 7.9430 km/s, at 0°.
// Nor any launch within 1 % of the escape speed, which the criterion leaves
// out because a period there needs millions of steps: the nearest are 11.0
// and 11.5 km/s.
const CIRCULAR_LAUNCHES: readonly MountainShot[] = [
  { speedKmPerSecond: 7.91, angleDegrees: 0 },
  { speedKmPerSecond: 7.94, angleDegrees: 0 },
];

const ESCAPE_STOP_RADIUS = 20;
// Beyond every bound grid shot's farthest point (30.8 radii, at 11.0 km/s).
const BOUND_STOP_RADIUS = 100;

const CIRCULAR_SPREAD = 0.01;
// Spec 01, "Measured tolerances": measured 2.0e-7 radii at 11.0 km/s, 4th
// order (1.3e-8 at half the step); Verlet at the same step: 2.1e-5 at 8 km/s.
const RETURN_TOLERANCE = 2e-6;
// Every launch below fires from Newton's mountain, 10 km up.
const LAUNCH_RADIUS = launchRadius(MOUNTAIN_ALTITUDE_KM);
// The home page's thumbnail fires from a taller, illustrative mountain.
const THUMBNAIL_LAUNCH_RADIUS = 1.35;
// Far above Yoshida's error at 2,000 steps per turn, far below a pixel.
const CIRCLE_TOLERANCE = 1e-4;
// Far below the 10 km (1.6e-3 radii) between the launch point and the ground.
const RADIUS_TOLERANCE = 1e-9;

// The lesson's stop radius: the corner of its view, 3 radii from the Earth's
// centre (spec 04, Decision 10).
const VIEW_STOP_RADIUS = 3 * Math.SQRT2;

// About 1 s locally for the whole grid; shared CI runners are slower.
const GRID_TIMEOUT_MS = 30_000;
// The engine's 1,000,000 steps: about 1.6 s locally.
const STEP_LIMIT_TIMEOUT_MS = 30_000;

const radius = ({ x, y }: Vec2) => Math.sqrt(x * x + y * y);

/** A launch from Newton's mountain, where every boundary here is measured. */
type MountainShot = Omit<CannonSettings, "altitudeKm">;

function onMountain(shot: MountainShot): CannonSettings {
  return { ...shot, altitudeKm: MOUNTAIN_ALTITUDE_KM };
}

function trace(shot: MountainShot, stopRadius: number): Trace {
  return traceLaunch(launchState(onMountain(shot)), { stopRadius });
}

function lastPoint(points: readonly Vec2[]): Vec2 {
  const point = points.at(-1);

  if (point === undefined) {
    throw new RangeError("the trace has no points");
  }

  return point;
}

/** The angle the shot sweeps around the Earth's centre, in radians. */
function sweptAngle(points: readonly Vec2[]): number {
  return points.slice(1).reduce((total, point, i) => {
    const previous = points[i] ?? point;

    return (
      total +
      Math.abs(
        Math.atan2(
          previous.x * point.y - previous.y * point.x,
          previous.x * point.x + previous.y * point.y,
        ),
      )
    );
  }, 0);
}

/** What each outcome means for the simulated path (spec 04, L8). */
function agreesWithOutcome(
  outcome: CannonOutcome,
  { points, end }: Trace,
): boolean {
  const radii = points.map(radius);

  switch (outcome) {
    case "ballistic":
      return (
        end === "ground" &&
        radii.slice(0, -1).every((r) => r > EARTH_RADIUS) &&
        sweptAngle(points) < 2 * Math.PI
      );
    case "circular-orbit": {
      const meanRadius = (Math.min(...radii) + Math.max(...radii)) / 2;

      return (
        end === "period" &&
        radii.every(
          (r) => Math.abs(r - meanRadius) <= CIRCULAR_SPREAD * meanRadius,
        )
      );
    }
    case "elliptical-orbit": {
      const launchPoint = points[0];
      const returned = lastPoint(points);

      return (
        end === "period" &&
        launchPoint !== undefined &&
        radius({
          x: returned.x - launchPoint.x,
          y: returned.y - launchPoint.y,
        }) <= RETURN_TOLERANCE
      );
    }
    case "escape":
      return (
        end === "stop-radius" && radius(lastPoint(points)) > ESCAPE_STOP_RADIUS
      );
  }
}

const gridLaunches: readonly MountainShot[] = [
  ...GRID_ANGLES_DEGREES.flatMap((angleDegrees) =>
    GRID_SPEEDS_KM_PER_SECOND.map((speedKmPerSecond) => ({
      speedKmPerSecond,
      angleDegrees,
    })),
  ),
  ...CIRCULAR_LAUNCHES,
];

describe("traceLaunch", () => {
  it("starts at the launch point", () => {
    const launch = launchState(
      onMountain({ speedKmPerSecond: 7, angleDegrees: 45 }),
    );

    expect(
      traceLaunch(launch, { stopRadius: BOUND_STOP_RADIUS }).points[0],
    ).toEqual(launch.position);
  });

  it("a shot at the circular speed stays at its launch height", () => {
    const launch = {
      position: { x: 0, y: THUMBNAIL_LAUNCH_RADIUS },
      velocity: { x: circularSpeed(THUMBNAIL_LAUNCH_RADIUS), y: 0 },
    };

    const { points, end } = traceLaunch(launch, {
      stopRadius: 2 * THUMBNAIL_LAUNCH_RADIUS,
    });

    expect(end).toBe("period");

    for (const point of points) {
      expect(Math.abs(radius(point) - THUMBNAIL_LAUNCH_RADIUS)).toBeLessThan(
        CIRCLE_TOLERANCE,
      );
    }
  });

  it("7.90 km/s horizontal reaches the ground in the engine", () => {
    const { points, end } = trace(
      { speedKmPerSecond: 7.9, angleDegrees: 0 },
      BOUND_STOP_RADIUS,
    );

    expect(end).toBe("ground");
    expect(radius(lastPoint(points))).toBeLessThanOrEqual(EARTH_RADIUS);
    expect(
      points.slice(0, -1).every((point) => radius(point) > EARTH_RADIUS),
    ).toBe(true);
  });

  it("7.91 km/s horizontal completes a period above its launch radius", () => {
    const { points, end } = trace(
      { speedKmPerSecond: 7.91, angleDegrees: 0 },
      BOUND_STOP_RADIUS,
    );

    expect(end).toBe("period");
    expect(Math.min(...points.map(radius))).toBeGreaterThanOrEqual(
      LAUNCH_RADIUS - RADIUS_TOLERANCE,
    );
  });

  it(
    "the simulation agrees with the outcome",
    () => {
      const disagreements = gridLaunches.flatMap((settings) => {
        const outcome = launchOutcome(onMountain(settings));

        const stopRadius =
          outcome === "escape" ? ESCAPE_STOP_RADIUS : BOUND_STOP_RADIUS;

        const simulated = trace(settings, stopRadius);

        return agreesWithOutcome(outcome, simulated)
          ? []
          : [{ ...settings, outcome, end: simulated.end }];
      });

      expect(disagreements).toEqual([]);
    },
    GRID_TIMEOUT_MS,
  );

  // Their periods need more than the engine's 1,000,000 steps, but they pass
  // the view's stop radius long before.
  it("a shot just below the escape speed is traced until it leaves the view", () => {
    for (const speedKmPerSecond of [11.14, 11.17]) {
      const { end } = trace(
        { speedKmPerSecond, angleDegrees: 0 },
        VIEW_STOP_RADIUS,
      );

      expect(end).toBe("stop-radius");
    }
  });

  it("rejects a stop radius that does not leave the launch point", () => {
    const launch = launchState(
      onMountain({ speedKmPerSecond: 7, angleDegrees: 0 }),
    );

    expect(() => traceLaunch(launch, { stopRadius: LAUNCH_RADIUS })).toThrow(
      "stopRadius",
    );
    expect(() => traceLaunch(launch, { stopRadius: Number.NaN })).toThrow(
      "stopRadius",
    );
  });

  it(
    "refuses a shot that neither lands, closes nor leaves within 1,000,000 steps",
    () => {
      // 11.17 km/s horizontal swings out to 760 radii, with a period of
      // about 46,500 time units: its period does not fit the engine's limit,
      // and it never reaches 1,000 radii.
      const launch = launchState(
        onMountain({ speedKmPerSecond: 11.17, angleDegrees: 0 }),
      );

      expect(() => traceLaunch(launch, { stopRadius: 1_000 })).toThrow(
        RangeError,
      );
    },
    STEP_LIMIT_TIMEOUT_MS,
  );
});

describe("traceFrame", () => {
  // The ballistic preset, a lob that lands, and the circular one.
  const lob = trace(
    { speedKmPerSecond: 7, angleDegrees: 45 },
    VIEW_STOP_RADIUS,
  );

  const ring = trace(
    { speedKmPerSecond: 7.91, angleDegrees: 0 },
    VIEW_STOP_RADIUS,
  );

  const lastIndex = (shot: Trace) => shot.points.length - 1;

  it("shows only the launch point at the start", () => {
    expect(traceFrame(lob, 0)).toEqual({
      revealedPoints: 1,
      shot: lob.points[0],
      finished: false,
      outcomeShown: false,
    });
  });

  it("reveals one point per dt of elapsed time", () => {
    expect(traceFrame(lob, 10.5 * lob.dt)).toEqual({
      revealedPoints: 11,
      shot: lob.points[10],
      finished: false,
      outcomeShown: false,
    });
  });

  it("a shot that hits the ground stops at its last point and finishes", () => {
    const afterLanding = (lastIndex(lob) + 1) * lob.dt;

    expect(traceFrame(lob, afterLanding)).toEqual({
      revealedPoints: lob.points.length,
      shot: lastPoint(lob.points),
      finished: true,
      outcomeShown: true,
    });
  });

  it("a closed orbit keeps looping after one period and never finishes", () => {
    const intoSecondTurn = (lastIndex(ring) + 10.5) * ring.dt;

    expect(traceFrame(ring, intoSecondTurn)).toEqual({
      revealedPoints: ring.points.length,
      shot: ring.points[10],
      finished: false,
      outcomeShown: true,
    });
  });

  it("an escaping shot shows its outcome once it leaves the view", () => {
    const escaping = trace(
      { speedKmPerSecond: 12, angleDegrees: 0 },
      VIEW_STOP_RADIUS,
    );

    expect(
      traceFrame(escaping, (lastIndex(escaping) - 1) * escaping.dt),
    ).toMatchObject({ outcomeShown: false });
    expect(
      traceFrame(escaping, lastIndex(escaping) * escaping.dt),
    ).toMatchObject({
      outcomeShown: true,
      finished: true,
    });
  });

  it("rejects a negative or non-finite elapsed time", () => {
    expect(() => traceFrame(lob, -1)).toThrow("elapsedTime");
    expect(() => traceFrame(lob, Number.POSITIVE_INFINITY)).toThrow(
      "elapsedTime",
    );
  });
});

describe("finalFrame", () => {
  it("shows a shot that lands whole, at its last point", () => {
    const lob = trace(
      { speedKmPerSecond: 7, angleDegrees: 45 },
      VIEW_STOP_RADIUS,
    );

    expect(finalFrame(lob)).toEqual({
      revealedPoints: lob.points.length,
      shot: lastPoint(lob.points),
      finished: true,
      outcomeShown: true,
    });
  });

  it("shows a closed orbit's whole ring, with the shot at the launch point", () => {
    const ring = trace(
      { speedKmPerSecond: 7.91, angleDegrees: 0 },
      VIEW_STOP_RADIUS,
    );

    expect(finalFrame(ring)).toEqual({
      revealedPoints: ring.points.length,
      shot: ring.points[0],
      finished: true,
      outcomeShown: true,
    });
  });
});
