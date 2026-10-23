import type { SystemState, Vec2 } from "../types";

function magnitude(vector: Vec2): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

function forces(state: SystemState, accelerations: readonly Vec2[]): Vec2[] {
  return state.bodies.map((body, i) => {
    const acceleration = accelerations[i];
    if (acceleration === undefined) {
      throw new RangeError(`accelerations[${i}] is missing`);
    }
    return { x: body.mass * acceleration.x, y: body.mass * acceleration.y };
  });
}

/** |Σ mᵢ·aᵢ|: zero when Newton's third law holds. */
export function netForceMagnitude(
  state: SystemState,
  accelerations: readonly Vec2[],
): number {
  const net = forces(state, accelerations).reduce(
    (sum, force) => ({ x: sum.x + force.x, y: sum.y + force.y }),
    { x: 0, y: 0 },
  );
  return magnitude(net);
}

/** Σ|mᵢ·aᵢ|: the scale for relative force tolerances (spec 01). */
export function forceScale(
  state: SystemState,
  accelerations: readonly Vec2[],
): number {
  return forces(state, accelerations).reduce(
    (sum, force) => sum + magnitude(force),
    0,
  );
}
