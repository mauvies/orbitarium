import type { Vec2 } from "@/physics";

/** Where the bodies were at one moment of simulation time. */
export type TrailSample = {
  readonly time: number;
  readonly positions: readonly Vec2[];
};

/** Oldest first. */
export type Trail = readonly TrailSample[];

/**
 * The trail with `samples` added, keeping only what is at most `span` of
 * simulation time older than the newest sample.
 */
export function extendTrail(
  trail: Trail,
  samples: readonly TrailSample[],
  span: number,
): Trail {
  if (!(Number.isFinite(span) && span > 0)) {
    throw new RangeError(`span must be a positive finite number, got ${span}`);
  }

  const newest = samples.at(-1);

  if (newest === undefined) {
    return trail;
  }

  const oldestKept = newest.time - span;

  return [...trail, ...samples].filter(({ time }) => time >= oldestKept);
}
