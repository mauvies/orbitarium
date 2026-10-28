import { PhysicsError } from "./errors";
import { softenedDistanceSquared } from "./gravity";
import type { Body, ForceOptions, SystemState, Vec2 } from "./types";
import { resolveForceOptions, validateState } from "./validate";
import {
  add,
  cross,
  isFiniteVec,
  lengthSquared,
  scale,
  sub,
  ZERO,
} from "./vec2";

/** Kinetic plus softened potential energy (spec 01, Decision 4). */
export function totalEnergy(
  state: SystemState,
  options?: ForceOptions,
): number {
  validateState(state);

  const { G, softening } = resolveForceOptions(options);

  const energy =
    kineticEnergy(state.bodies) +
    potentialEnergy(state.bodies, G, softening * softening);

  if (!Number.isFinite(energy)) {
    throw overflowError("total energy", state.bodies);
  }

  return energy;
}

export function linearMomentum(state: SystemState): Vec2 {
  validateState(state);

  const momentum = state.bodies.reduce(
    (sum, body) => add(sum, scale(body.velocity, body.mass)),
    ZERO,
  );

  if (!isFiniteVec(momentum)) {
    throw overflowError("linear momentum", state.bodies);
  }

  return momentum;
}

/** About the origin. */
export function angularMomentum(state: SystemState): number {
  validateState(state);

  const momentum = state.bodies.reduce(
    (sum, body) => sum + body.mass * cross(body.position, body.velocity),
    0,
  );

  if (!Number.isFinite(momentum)) {
    throw overflowError("angular momentum", state.bodies);
  }

  return momentum;
}

export function centerOfMass(state: SystemState): Vec2 {
  validateState(state);

  const totalMass = state.bodies.reduce((sum, body) => sum + body.mass, 0);

  const weightedPosition = state.bodies.reduce(
    (sum, body) => add(sum, scale(body.position, body.mass)),
    ZERO,
  );

  const center = {
    x: weightedPosition.x / totalMass,
    y: weightedPosition.y / totalMass,
  };

  if (!isFiniteVec(center)) {
    throw overflowError("centre of mass", state.bodies);
  }

  return center;
}

function kineticEnergy(bodies: readonly Body[]): number {
  return bodies.reduce(
    (sum, body) => sum + 0.5 * body.mass * lengthSquared(body.velocity),
    0,
  );
}

function potentialEnergy(
  bodies: readonly Body[],
  G: number,
  softeningSquared: number,
): number {
  let energy = 0;

  for (const [index, body] of bodies.entries()) {
    for (const [otherIndex, other] of bodies.entries()) {
      if (otherIndex > index) {
        const distanceSquared = softenedDistanceSquared(
          sub(other.position, body.position),
          softeningSquared,
          index,
          otherIndex,
        );

        energy -= (G * body.mass * other.mass) / Math.sqrt(distanceSquared);
      }
    }
  }

  return energy;
}

// Spec 01, E13: the engine never returns non-finite values.
function overflowError(
  quantity: string,
  bodies: readonly Body[],
): PhysicsError {
  return new PhysicsError(
    "non-finite",
    bodies.map((_, index) => index),
    `the ${quantity} overflows; masses, positions or velocities are too large`,
  );
}
