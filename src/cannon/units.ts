// Spec 04, Decision 7: the UI speaks km and km/s; the engine runs with G = 1,
// the Earth's mass 1 and its radius 1. Conversions happen only here.
export const EARTH_RADIUS_KM = 6_371;
export const EARTH_GM_KM3_PER_SECOND2 = 398_600;
const SECONDS_PER_HOUR = 3_600;

/** The Earth's radius in engine units. */
export const EARTH_RADIUS = 1;

/** A mountain a little taller than Everest, as in Newton's drawing (spec 04, Decision 8). */
export const LAUNCH_ALTITUDE_KM = 10;

/** The launch point's distance from the Earth's centre, in engine units. */
export const LAUNCH_RADIUS =
  EARTH_RADIUS + LAUNCH_ALTITUDE_KM / EARTH_RADIUS_KM;

/** One engine speed unit: the circular speed at the surface, √(GM/R). */
export const SPEED_UNIT_KM_PER_SECOND = Math.sqrt(
  EARTH_GM_KM3_PER_SECOND2 / EARTH_RADIUS_KM,
);

/** One engine time unit: the Earth's radius at one speed unit. */
export const TIME_UNIT_SECONDS = EARTH_RADIUS_KM / SPEED_UNIT_KM_PER_SECOND;

export function kmPerSecondToEngine(speedKmPerSecond: number): number {
  return speedKmPerSecond / SPEED_UNIT_KM_PER_SECOND;
}

export function engineToKmPerSecond(speed: number): number {
  return speed * SPEED_UNIT_KM_PER_SECOND;
}

export function kmPerSecondToKmPerHour(speedKmPerSecond: number): number {
  return speedKmPerSecond * SECONDS_PER_HOUR;
}
