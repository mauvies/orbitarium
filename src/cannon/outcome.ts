import { launchState } from "./launch";
import type { CannonOutcome, CannonSettings } from "./types";
import { EARTH_RADIUS } from "./units";

/** The Kepler orbit a shot starts on, in engine units (G·M = 1). */
export type LaunchOrbit = {
  /** Negative for a bound orbit. */
  readonly specificEnergy: number;
  readonly eccentricity: number;
  /** The closest the orbit comes to the Earth's centre; 0 with no sideways speed. */
  readonly periapsisRadius: number;
};

// Spec 04, Decision 9: the radius then stays within 1 % of its mean.
const CIRCULAR_ECCENTRICITY = 0.01;

export function launchOrbit(settings: CannonSettings): LaunchOrbit {
  const { position, velocity } = launchState(settings);
  const radius = Math.sqrt(position.x * position.x + position.y * position.y);
  const speedSquared = velocity.x * velocity.x + velocity.y * velocity.y;
  const specificEnergy = speedSquared / 2 - 1 / radius;
  const angularMomentum = position.x * velocity.y - position.y * velocity.x;
  const angularMomentumSquared = angularMomentum * angularMomentum;

  // Rounding can leave 1 + 2εh² just below 0 for an exactly circular shot.
  const eccentricity = Math.sqrt(
    Math.max(0, 1 + 2 * specificEnergy * angularMomentumSquared),
  );

  return {
    specificEnergy,
    eccentricity,
    periapsisRadius: angularMomentumSquared / (1 + eccentricity),
  };
}

/**
 * What the shot does, known at launch from orbital formulas, without
 * simulating (spec 04, Decision 9).
 */
export function launchOutcome(settings: CannonSettings): CannonOutcome {
  const { specificEnergy, eccentricity, periapsisRadius } =
    launchOrbit(settings);

  if (specificEnergy >= 0) {
    return "escape";
  }

  if (periapsisRadius <= EARTH_RADIUS) {
    return "ballistic";
  }

  if (eccentricity < CIRCULAR_ECCENTRICITY) {
    return "circular-orbit";
  }

  return "elliptical-orbit";
}
