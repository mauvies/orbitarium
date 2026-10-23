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

// Yoshida (1990): 1 / (2 − ∛2) and −∛2 / (2 − ∛2). Literals rather than
// Math.cbrt, so every platform uses the same bits (spec 01).
export const OUTER_WEIGHT = 1.3512071919596578;
export const INNER_WEIGHT = -1.7024143839193153;

/** 4th order: three Verlet steps, the middle one backwards in time. */
export const yoshida4Step: Step = (particles, dt, parameters) => {
  const first = verletStep(particles, OUTER_WEIGHT * dt, parameters);
  const second = verletStep(first, INNER_WEIGHT * dt, parameters);
  return verletStep(second, OUTER_WEIGHT * dt, parameters);
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
