import { advance, type SystemState } from "@/physics";

/**
 * Runs `count` substeps of exactly `dt`, one `advance` call each. One call
 * for count · dt would use substeps of (count · dt) / count, which can differ
 * from dt by one ulp (spec 02, Decision 6).
 */
export function runSubsteps(
  state: SystemState,
  count: number,
  dt: number,
): SystemState {
  let current = state;

  for (let substep = 0; substep < count; substep++) {
    current = advance(current, dt, { dt });
  }

  return current;
}
