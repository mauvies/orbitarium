import { circularSpeed } from "./launch";
import type { CannonOutcome, CannonSettings } from "./types";
import { engineToKmPerSecond, LAUNCH_RADIUS } from "./units";

/**
 * One launch per outcome (spec 04, Decision 11). The escape preset is the
 * speed of step 4's prediction question. The values may be tuned in visual
 * review as long as each still gives its outcome (L9).
 */
export const CANNON_PRESETS: Readonly<Record<CannonOutcome, CannonSettings>> = {
  ballistic: { speedKmPerSecond: 7, angleDegrees: 45 },
  "circular-orbit": { speedKmPerSecond: 7.91, angleDegrees: 0 },
  "elliptical-orbit": { speedKmPerSecond: 9, angleDegrees: 0 },
  escape: { speedKmPerSecond: 12, angleDegrees: 0 },
};

export type ReferenceSpeeds = {
  readonly circularKmPerSecond: number;
  readonly escapeKmPerSecond: number;
};

const circularAtLaunch = engineToKmPerSecond(circularSpeed(LAUNCH_RADIUS));

/**
 * The two speeds shown next to the speed control, computed from the model at
 * the launch point rather than typed in (spec 04, Decision 11). Escaping
 * takes √2 times the circular speed: kinetic energy equal to the binding
 * energy.
 */
export const REFERENCE_SPEEDS: ReferenceSpeeds = {
  circularKmPerSecond: circularAtLaunch,
  escapeKmPerSecond: Math.SQRT2 * circularAtLaunch,
};
