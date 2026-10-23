import { accelerationOf, type ForceParameters } from "./gravity";
import type { Body, Vec2 } from "./types";
import { add, scale } from "./vec2";

/** A body with the acceleration at its current position. */
export type Particle = Body & { readonly acceleration: Vec2 };

export type Step = (
  particles: readonly Particle[],
  dt: number,
  parameters: ForceParameters,
) => readonly Particle[];

export function withAccelerations(
  bodies: readonly Body[],
  parameters: ForceParameters,
): readonly Particle[] {
  return bodies.map((body, index) => ({
    ...body,
    acceleration: accelerationOf(index, body, bodies, parameters),
  }));
}

/** Kick-drift-kick velocity Verlet: symplectic and time-reversible. */
export const verletStep: Step = (particles, dt, parameters) => {
  const drifted = particles.map((particle) =>
    drift(kick(particle, dt / 2), dt),
  );
  return withAccelerations(drifted, parameters).map((particle) =>
    kick(particle, dt / 2),
  );
};

function kick(particle: Particle, dt: number): Particle {
  return {
    ...particle,
    velocity: add(particle.velocity, scale(particle.acceleration, dt)),
  };
}

function drift(particle: Particle, dt: number): Particle {
  return {
    ...particle,
    position: add(particle.position, scale(particle.velocity, dt)),
  };
}
