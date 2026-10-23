// Spec 03, Decision 7.

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export const DEFAULT_SPEED: PlaybackSpeed = 1;

/**
 * The largest count whose p99 frame cost stays within the 2 ms budget on the
 * reference machine (spec 03, "Measured during planning"). Only yin-yang I at
 * 4× reaches it on a 60 Hz display, and then plays at about 2.3×.
 */
export const MAX_SUBSTEPS_PER_FRAME = 1_100;

/** At 1×, one second on screen is one unit of simulation time. */
export function simulationTimeFor(
  elapsedMs: number,
  speed: PlaybackSpeed,
): number {
  if (!(Number.isFinite(elapsedMs) && elapsedMs >= 0)) {
    throw new RangeError(
      `elapsedMs must be a finite number greater than or equal to 0, got ${elapsedMs}`,
    );
  }
  return (elapsedMs / 1_000) * speed;
}
