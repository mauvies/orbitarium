import type { SystemState } from "../types";

// Named initial states from spec 01 ("Fixtures"). G = 1 and no softening
// unless a test says otherwise.

/** Hand-calculated case for E1: body 0 accelerates 0.5 towards +x, body 1 0.25 towards −x. */
export const handPair: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } },
    { mass: 2, position: { x: 2, y: 0 }, velocity: { x: 0, y: 0 } },
  ],
};

/** Unequal masses at arbitrary positions, for the third-law check (E2). */
export const scatteredFour: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: 0.1, y: -0.4 }, velocity: { x: 0, y: 0 } },
    { mass: 2.5, position: { x: 1.7, y: 0.9 }, velocity: { x: 0, y: 0 } },
    { mass: 0.3, position: { x: -2.2, y: 1.3 }, velocity: { x: 0, y: 0 } },
    { mass: 7, position: { x: 0.6, y: -3.1 }, velocity: { x: 0, y: 0 } },
  ],
};

/** Bodies 0 and 1 share a position; body 2 is elsewhere (E13). */
export const coincidentTriple: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: 0.5, y: 0.5 }, velocity: { x: 0, y: 0 } },
    { mass: 1, position: { x: 0.5, y: 0.5 }, velocity: { x: 0, y: 0 } },
    { mass: 1, position: { x: 2, y: 0 }, velocity: { x: 0, y: 0 } },
  ],
};

/**
 * Masses so large that energy, momenta and centre of mass overflow, and so
 * does the pull with G = 10 (E13).
 */
export const overflowingPair: SystemState = {
  time: 0,
  bodies: [
    { mass: 1e308, position: { x: 0, y: 0 }, velocity: { x: 0, y: 2 } },
    { mass: 1e308, position: { x: 2, y: 0 }, velocity: { x: 0, y: -2 } },
  ],
};

/** Two unit masses at rest that fall straight into each other (E13). */
export const headOnPair: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: -1, y: 0 }, velocity: { x: 0, y: 0 } },
    { mass: 1, position: { x: 1, y: 0 }, velocity: { x: 0, y: 0 } },
  ],
};

/** Two unit masses on a circular orbit: period 4π, E = −0.25, L = 1. */
export const circularBinary: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: 1, y: 0 }, velocity: { x: 0, y: 0.5 } },
    { mass: 1, position: { x: -1, y: 0 }, velocity: { x: 0, y: -0.5 } },
  ],
};

const apoapsisSpeed = Math.sqrt(0.5) / 2;

/** e = 0.5 orbit starting at apoapsis: period 2π·√(32/27), E = −0.375, L = √0.5. */
export const eccentricBinary: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: 1, y: 0 }, velocity: { x: 0, y: apoapsisSpeed } },
    {
      mass: 1,
      position: { x: -1, y: 0 },
      velocity: { x: 0, y: -apoapsisSpeed },
    },
  ],
};

export const eccentricBinaryPeriod = 2 * Math.PI * Math.sqrt(32 / 27);

export const circularBinaryPeriod = 4 * Math.PI;

const triangleRadius = 1 / Math.sqrt(3);

/** Lagrange's equilateral solution, side 1: every body moves at speed 1. */
export const lagrangeTriangle: SystemState = {
  time: 0,
  bodies: [
    {
      mass: 1,
      position: { x: 0, y: triangleRadius },
      velocity: { x: -1, y: 0 },
    },
    {
      mass: 1,
      position: { x: -0.5, y: -triangleRadius / 2 },
      velocity: { x: 0.5, y: -Math.sqrt(3) / 2 },
    },
    {
      mass: 1,
      position: { x: 0.5, y: -triangleRadius / 2 },
      velocity: { x: 0.5, y: Math.sqrt(3) / 2 },
    },
  ],
};

/**
 * A tight binary (bodies 0 and 1) with a lighter body orbiting it, all
 * drifting together: unequal masses, total momentum (0.6, −1.1).
 */
export const driftingTriple: SystemState = {
  time: 0,
  bodies: [
    { mass: 3, position: { x: 0, y: 0 }, velocity: { x: 0.1, y: -1.1 } },
    { mass: 2, position: { x: 0.6, y: 0 }, velocity: { x: 0.1, y: 1.8 } },
    { mass: 1, position: { x: -2.5, y: 0 }, velocity: { x: 0.1, y: -1.4 } },
  ],
};
