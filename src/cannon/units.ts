// Spec 04, Decision 7: the UI speaks km and km/s; the engine runs with G = 1,
// the Earth's mass 1 and its radius 1. Conversions happen only here.
export const EARTH_RADIUS_KM = 6_371;
export const EARTH_GM_KM3_PER_SECOND2 = 398_600;

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
