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

/** Masses so large that, with G = 10, their pull overflows to infinity (E13). */
export const overflowingPair: SystemState = {
  time: 0,
  bodies: [
    { mass: 1e308, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } },
    { mass: 1e308, position: { x: 2, y: 0 }, velocity: { x: 0, y: 0 } },
  ],
};

/** Three unequal masses with non-zero total momentum (0.2, 0.25). */
export const driftingTriple: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: 1, y: 0 }, velocity: { x: 0.1, y: 0.6 } },
    { mass: 2, position: { x: -0.5, y: 0.8 }, velocity: { x: -0.4, y: 0.2 } },
    { mass: 3, position: { x: -0.3, y: -1.1 }, velocity: { x: 0.3, y: -0.25 } },
  ],
};
