import { advance, type SystemState, type Vec2 } from "@/physics";

// Newton's cannon (docs/design/part-a-learning-experience.md): a shot fired
// sideways from a mountain top falls back, circles or swings out, depending on
// its speed. G = 1, and the Earth has mass 1 and radius 1.
export const EARTH_RADIUS = 1;

/** The top of a very tall mountain, as in Newton's own drawing. */
export const LAUNCH_POINT: Vec2 = { x: 0, y: 1.35 };

/** The speed that keeps the shot at the launch height: √(GM / r). */
export const circularSpeed = Math.sqrt(1 / LAUNCH_POINT.y);

// Light enough that the shot's pull on the Earth moves it by nothing visible.
const SHOT_MASS = 1e-9;
const STEPS_PER_TURN = 2_000;
const dt = (2 * Math.PI * LAUNCH_POINT.y) / circularSpeed / STEPS_PER_TURN;
// The slowest closed shot drawn (1.08 × circularSpeed) takes 1.3 turns' time.
const MAX_STEPS = 3 * STEPS_PER_TURN;

/**
 * The shot's path relative to the Earth, fired horizontally at `launchSpeed`:
 * until it reaches the ground (the last point is at or below the surface) or
 * completes one turn around the Earth.
 */
export function cannonTrajectory(launchSpeed: number): readonly Vec2[] {
  if (!(Number.isFinite(launchSpeed) && launchSpeed > 0)) {
    throw new RangeError(
      `launchSpeed must be a positive finite number, got ${launchSpeed}`,
    );
  }
  let state: SystemState = {
    time: 0,
    bodies: [
      { mass: 1, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } },
      {
        mass: SHOT_MASS,
        position: LAUNCH_POINT,
        velocity: { x: launchSpeed, y: 0 },
      },
    ],
  };
  const points = [LAUNCH_POINT];
  let turned = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    state = advance(state, dt, { dt });
    const point = shotPosition(state);
    const previous = points.at(-1) ?? LAUNCH_POINT;
    points.push(point);
    if (Math.hypot(point.x, point.y) <= EARTH_RADIUS) {
      return points;
    }
    turned += angleBetween(previous, point);
    if (Math.abs(turned) >= 2 * Math.PI) {
      return points;
    }
  }
  return points;
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

/** The signed angle from `from` to `to` around the origin, in (−π, π]. */
function angleBetween(from: Vec2, to: Vec2): number {
  return Math.atan2(
    from.x * to.y - from.y * to.x,
    from.x * to.x + from.y * to.y,
  );
}
