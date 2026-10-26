import { advance, type SystemState, type Vec2 } from "@/physics";
import type { LaunchState } from "./types";
import { EARTH_RADIUS } from "./units";

// Spec 04, Decision 10: light enough that the Earth's motion is invisible.
const SHOT_MASS = 1e-9;
// G(M + m): the Earth's mass is 1 and the engine pulls both bodies.
const GRAVITATIONAL_PARAMETER = 1 + SHOT_MASS;
const STEPS_PER_CIRCULAR_TURN = 2_000;
// The engine's own limit per call (spec 01, Decision 2), so no launch can
// freeze the page.
const MAX_STEPS = 1_000_000;

/** Why a trace stopped: the shot hit the ground, closed its orbit, or left. */
export type TraceEnd = "ground" | "period" | "stop-radius";

/** The shot's path relative to the Earth's centre, in engine units. */
export type Trace = {
  /** The launch point, then one point every `dt` of engine time. */
  readonly points: readonly Vec2[];
  readonly dt: number;
  readonly end: TraceEnd;
};

/**
 * Simulates `launch` with the engine until the first of: reaching the
 * ground, one period of a bound orbit, or passing `stopRadius` (spec 04,
 * Decision 10). The step is a 2,000th of a circular orbit at the launch
 * height, shortened so a period ends exactly on a step.
 */
export function traceLaunch(
  launch: LaunchState,
  { stopRadius }: { readonly stopRadius: number },
): Trace {
  const launchRadius = radiusOf(launch.position);
  if (!(launchRadius > EARTH_RADIUS)) {
    throw new RangeError(
      `position must be above the ground, got a radius of ${launchRadius}`,
    );
  }
  if (!(Number.isFinite(stopRadius) && stopRadius > launchRadius)) {
    throw new RangeError(
      `stopRadius must be a finite number beyond the launch radius ${launchRadius}, got ${stopRadius}`,
    );
  }
  const period = orbitalPeriod(launch);
  const maxDt =
    (2 * Math.PI * launchRadius ** 1.5) /
    Math.sqrt(GRAVITATIONAL_PARAMETER) /
    STEPS_PER_CIRCULAR_TURN;
  const steps = period === null ? MAX_STEPS : Math.ceil(period / maxDt);
  if (steps > MAX_STEPS) {
    throw new RangeError(
      `a period needs ${steps} steps, more than ${MAX_STEPS}; lower stopRadius`,
    );
  }
  const dt = period === null ? maxDt : period / steps;

  let state = initialState(launch);
  const points: Vec2[] = [launch.position];
  for (let step = 0; step < steps; step++) {
    state = advance(state, dt, { dt });
    const point = shotPosition(state);
    points.push(point);
    const r = radiusOf(point);
    if (r <= EARTH_RADIUS) {
      return { points, dt, end: "ground" };
    }
    if (r > stopRadius) {
      return { points, dt, end: "stop-radius" };
    }
  }
  if (period === null) {
    throw new RangeError(
      `the shot did not pass stopRadius ${stopRadius} within ${MAX_STEPS} steps`,
    );
  }
  return { points, dt, end: "period" };
}

/** 2π·√(a³/μ) for a bound orbit; null when the shot escapes. */
function orbitalPeriod({ position, velocity }: LaunchState): number | null {
  const speedSquared = velocity.x * velocity.x + velocity.y * velocity.y;
  const specificEnergy =
    speedSquared / 2 - GRAVITATIONAL_PARAMETER / radiusOf(position);
  if (specificEnergy >= 0) {
    return null;
  }
  const semiMajorAxis = -GRAVITATIONAL_PARAMETER / (2 * specificEnergy);
  return 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / GRAVITATIONAL_PARAMETER);
}

function initialState({ position, velocity }: LaunchState): SystemState {
  return {
    time: 0,
    bodies: [
      { mass: 1, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } },
      { mass: SHOT_MASS, position, velocity },
    ],
  };
}

function shotPosition(state: SystemState): Vec2 {
  const [earth, shot] = state.bodies;
  if (earth === undefined || shot === undefined) {
    throw new RangeError("the cannon needs the Earth and the shot");
  }
  return {
    x: shot.position.x - earth.position.x,
    y: shot.position.y - earth.position.y,
  };
}

function radiusOf({ x, y }: Vec2): number {
  return Math.sqrt(x * x + y * y);
}
