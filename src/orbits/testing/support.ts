import type { SystemState, Vec2 } from "@/physics";
import { getOrbit } from "../catalog";
import type { OrbitPreset, OrbitSlug } from "../types";

/**
 * For tests that integrate a heavy orbit: up to 500,000 substeps per period
 * (yin-yang I), about 1 s locally. Shared CI runners are about twice as slow,
 * and Vitest's default is 5 s per test.
 */
export const HEAVY_TEST_TIMEOUT_MS = 30_000;

/** The catalog preset with this slug. */
export function presetOf(slug: OrbitSlug): OrbitPreset {
  const preset = getOrbit(slug);
  if (preset === undefined) {
    throw new RangeError(`no orbit with slug "${slug}"`);
  }
  return preset;
}

export function positions(state: SystemState): readonly Vec2[] {
  return state.bodies.map((body) => body.position);
}
