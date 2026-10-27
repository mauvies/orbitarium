import { circularSpeed } from "./launch";
import type { CannonSettings } from "./types";
import {
  engineToKmPerSecond,
  launchRadius,
  MOUNTAIN_ALTITUDE_KM,
} from "./units";

/** The presets, in the order the panel shows them. */
export const CANNON_PRESET_IDS = [
  "ballistic",
  "circular-orbit",
  "elliptical-orbit",
  "long-ellipse",
  "escape",
] as const;

export type CannonPresetId = (typeof CANNON_PRESET_IDS)[number];

/**
 * One launch per outcome, plus a long ellipse that stands for a transfer
 * orbit, all from Newton's mountain (spec 04, Decision 11). The values may be
 * tuned in visual review as long as each still gives its outcome and the long
 * ellipse stays in view (L9).
 */
export const CANNON_PRESETS: Readonly<Record<CannonPresetId, CannonSettings>> =
  {
    ballistic: fromMountain(7, 45),
    "circular-orbit": fromMountain(7.91, 0),
    "elliptical-orbit": fromMountain(9, 0),
    "long-ellipse": fromMountain(9.6, 0),
    escape: fromMountain(12, 0),
  };

export type ReferenceSpeeds = {
  readonly circularKmPerSecond: number;
  readonly escapeKmPerSecond: number;
};

/**
 * The two speeds shown next to the speed control, computed from the model at
 * a launch point `altitudeKm` high rather than typed in (spec 04, Decision
 * 11). Escaping takes √2 times the circular speed: kinetic energy equal to
 * the binding energy.
 */
export function referenceSpeeds(altitudeKm: number): ReferenceSpeeds {
  const circularKmPerSecond = engineToKmPerSecond(
    circularSpeed(launchRadius(altitudeKm)),
  );
  return {
    circularKmPerSecond,
    escapeKmPerSecond: Math.SQRT2 * circularKmPerSecond,
  };
}

function fromMountain(
  speedKmPerSecond: number,
  angleDegrees: number,
): CannonSettings {
  return { speedKmPerSecond, angleDegrees, altitudeKm: MOUNTAIN_ALTITUDE_KM };
}
