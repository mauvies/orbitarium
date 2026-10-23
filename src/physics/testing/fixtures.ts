import type { SystemState } from "../types";

// Named initial states from spec 01 ("Fixtures"). G = 1 and no softening
// unless a test says otherwise.

/** Three unequal masses with non-zero total momentum (0.2, 0.25). */
export const driftingTriple: SystemState = {
  time: 0,
  bodies: [
    { mass: 1, position: { x: 1, y: 0 }, velocity: { x: 0.1, y: 0.6 } },
    { mass: 2, position: { x: -0.5, y: 0.8 }, velocity: { x: -0.4, y: 0.2 } },
    { mass: 3, position: { x: -0.3, y: -1.1 }, velocity: { x: 0.3, y: -0.25 } },
  ],
};
