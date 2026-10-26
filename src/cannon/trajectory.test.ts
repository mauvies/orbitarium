import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/physics";
import { launchState } from "./launch";
import { launchOutcome } from "./outcome";
import { type Trace, traceLaunch } from "./trajectory";
import type { CannonOutcome, CannonSettings } from "./types";
import { EARTH_RADIUS, LAUNCH_RADIUS } from "./units";

// Spec 04, L8. The grid of the criterion: 0 to 15 km/s by 0.5, at four angles.
const GRID_SPEEDS_KM_PER_SECOND = Array.from({ length: 31 }, (_, i) => i / 2);
const GRID_ANGLES_DEGREES = [0, 30, 60, 90];
// The grid has no circular launch: the window is 7.9036 to 7.9430 km/s, at 0°.
// Nor any launch within 1 % of the escape speed, which the criterion leaves
// out because a period there needs millions of steps: the nearest are 11.0
// and 11.5 km/s.
const CIRCULAR_LAUNCHES: readonly CannonSettings[] = [
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
// Far below the 10 km (1.6e-3 radii) between the launch point and the ground.
const RADIUS_TOLERANCE = 1e-9;

// About 1 s locally for the whole grid; shared CI runners are slower.
const GRID_TIMEOUT_MS = 30_000;

const radius = ({ x, y }: Vec2) => Math.sqrt(x * x + y * y);

function trace(settings: CannonSettings, stopRadius: number): Trace {
  return traceLaunch(launchState(settings), { stopRadius });
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

const gridLaunches: readonly CannonSettings[] = [
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
    const launch = launchState({ speedKmPerSecond: 7, angleDegrees: 45 });

    expect(
      traceLaunch(launch, { stopRadius: BOUND_STOP_RADIUS }).points[0],
    ).toEqual(launch.position);
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
        const outcome = launchOutcome(settings);
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

  it("rejects a stop radius that does not leave the launch point", () => {
    const launch = launchState({ speedKmPerSecond: 7, angleDegrees: 0 });

    expect(() => traceLaunch(launch, { stopRadius: LAUNCH_RADIUS })).toThrow(
      "stopRadius",
    );
    expect(() => traceLaunch(launch, { stopRadius: Number.NaN })).toThrow(
      "stopRadius",
    );
  });

  it("refuses a trace longer than 1,000,000 steps", () => {
    // 11.17 km/s horizontal swings out to 760 radii, with a period of
    // about 46,500 time units.
    const launch = launchState({ speedKmPerSecond: 11.17, angleDegrees: 0 });

    expect(() => traceLaunch(launch, { stopRadius: 1_000 })).toThrow(
      RangeError,
    );
  });
});
