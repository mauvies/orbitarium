import type { CannonSettings, LaunchState } from "./types";
import { kmPerSecondToEngine, LAUNCH_RADIUS } from "./units";

// No shot starts downwards, which the outcome rule relies on (spec 04,
// Decision 9): a shot heading down could hit the ground before its periapsis.
const MAX_ANGLE_DEGREES = 90;

/**
 * The shot leaving the top of the mountain, which stands on the +y axis,
 * fired towards +x at `angleDegrees` above the horizontal.
 */
export function launchState(settings: CannonSettings): LaunchState {
  const { speedKmPerSecond, angleDegrees } = settings;
  if (!(Number.isFinite(speedKmPerSecond) && speedKmPerSecond >= 0)) {
    throw new RangeError(
      `speedKmPerSecond must be a finite number of at least 0, got ${speedKmPerSecond}`,
    );
  }
  if (
    !(
      Number.isFinite(angleDegrees) &&
      angleDegrees >= 0 &&
      angleDegrees <= MAX_ANGLE_DEGREES
    )
  ) {
    throw new RangeError(
      `angleDegrees must be a finite number from 0 to ${MAX_ANGLE_DEGREES}, got ${angleDegrees}`,
    );
  }
  const speed = kmPerSecondToEngine(speedKmPerSecond);
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    position: { x: 0, y: LAUNCH_RADIUS },
    velocity: { x: speed * Math.cos(angle), y: speed * Math.sin(angle) },
  };
}

/** The speed that keeps a shot at `radius` from the Earth's centre: √(GM/r), in engine units. */
export function circularSpeed(radius: number): number {
  if (!(Number.isFinite(radius) && radius > 0)) {
    throw new RangeError(
      `radius must be a positive finite number, got ${radius}`,
    );
  }
  return Math.sqrt(1 / radius);
}
