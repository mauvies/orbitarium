import type { SystemState, Vec2 } from "../types";

/** Freezes an object and everything it references, so mutation throws. */
export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}

export function magnitude(vector: Vec2): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

/** Σ|mᵢ·vᵢ|: the scale for relative linear momentum tolerances (spec 01). */
export function momentumScale(state: SystemState): number {
  return state.bodies.reduce(
    (sum, body) => sum + body.mass * magnitude(body.velocity),
    0,
  );
}

/** Σ|rᵢ|·|mᵢ·vᵢ|: the scale for relative angular momentum tolerances (spec 01). */
export function angularMomentumScale(state: SystemState): number {
  return state.bodies.reduce(
    (sum, body) =>
      sum + magnitude(body.position) * body.mass * magnitude(body.velocity),
    0,
  );
}

/** maxᵢ|rᵢ|: the size of the system, measured from the origin. */
export function systemSize(state: SystemState): number {
  return state.bodies.reduce(
    (largest, body) => Math.max(largest, magnitude(body.position)),
    0,
  );
}

/** The smallest distance between any two bodies. */
export function closestApproach(state: SystemState): number {
  let closest = Number.POSITIVE_INFINITY;
  for (const [index, body] of state.bodies.entries()) {
    for (const [otherIndex, other] of state.bodies.entries()) {
      if (otherIndex > index) {
        const offset = {
          x: other.position.x - body.position.x,
          y: other.position.y - body.position.y,
        };
        closest = Math.min(closest, magnitude(offset));
      }
    }
  }
  return closest;
}

/** mᵢ·aᵢ for each body. */
export function forces(
  state: SystemState,
  accelerations: readonly Vec2[],
): Vec2[] {
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

/** The largest distance between matching vectors of two equally long lists. */
export function maxDistance(
  first: readonly Vec2[],
  second: readonly Vec2[],
): number {
  if (first.length !== second.length) {
    throw new RangeError(
      `cannot compare ${first.length} vectors with ${second.length}`,
    );
  }
  return first.reduce((largest, vector, i) => {
    const other = second[i];
    if (other === undefined) {
      throw new RangeError(`second[${i}] is missing`);
    }
    const difference = { x: vector.x - other.x, y: vector.y - other.y };
    return Math.max(largest, magnitude(difference));
  }, 0);
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
