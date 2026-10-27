/** The Moon's distance from the Earth's centre, in Earth radii: 60.3, rounded as the lesson says it. */
export const MOON_DISTANCE_RADII = 60;

/**
 * The pull at `distanceRadii` from the Earth's centre, as a fraction of the
 * pull at the surface: 1/d² (spec 04, Decision 4). The slider moves in whole
 * radii, from the surface to the Moon.
 */
export function pullFraction(distanceRadii: number): {
  readonly denominator: number;
} {
  if (
    !(
      Number.isInteger(distanceRadii) &&
      distanceRadii >= 1 &&
      distanceRadii <= MOON_DISTANCE_RADII
    )
  ) {
    throw new RangeError(
      `distanceRadii must be a whole number from 1 to ${MOON_DISTANCE_RADII}, got ${distanceRadii}`,
    );
  }
  return { denominator: distanceRadii * distanceRadii };
}
