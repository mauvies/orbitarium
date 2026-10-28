import { PhysicsError } from "./errors";
import { forceParameters } from "./gravity";
import {
  type Particle,
  type Step,
  verletStep,
  withAccelerations,
  yoshida4Step,
} from "./integrators";
import type {
  Body,
  IntegratorName,
  SimulationOptions,
  SystemState,
} from "./types";
import {
  resolveSimulationOptions,
  validateDuration,
  validateState,
} from "./validate";
import { isFiniteVec } from "./vec2";

export type SubstepPlan = {
  readonly count: number;
  readonly size: number;
};

// Spec 01, Decision 2.
const MAX_SUBSTEPS = 1_000_000;
const ROUND_OFF_MARGIN = 1e-9;

/** Advances the system by exactly `duration`, in equal substeps of at most `dt`. */
export function advance(
  state: SystemState,
  duration: number,
  options: SimulationOptions,
): SystemState {
  validateState(state);
  validateDuration(duration);

  const resolved = resolveSimulationOptions(options);
  const { count, size } = planSubsteps(duration, resolved.dt);

  if (count === 0) {
    return { bodies: state.bodies, time: state.time };
  }

  const parameters = forceParameters(resolved);
  const step = stepFor(resolved.integrator);
  let particles = withAccelerations(state.bodies, parameters);

  for (let substep = 0; substep < count; substep++) {
    particles = step(particles, size, parameters);
  }

  return { bodies: toFiniteBodies(particles), time: state.time + duration };
}

/**
 * Spec 01, Decision 2: the margin absorbs round-off, so `3 * 0.1` with
 * dt = 0.1 gives 3 substeps instead of 4.
 */
export function planSubsteps(duration: number, dt: number): SubstepPlan {
  if (duration === 0) {
    return { count: 0, size: 0 };
  }

  const count = Math.max(1, Math.ceil(duration / dt - ROUND_OFF_MARGIN));

  if (count > MAX_SUBSTEPS) {
    throw new RangeError(
      `duration / options.dt needs ${count} substeps; at most ${MAX_SUBSTEPS} substeps are allowed in one call`,
    );
  }

  return { count, size: duration / count };
}

function stepFor(integrator: IntegratorName): Step {
  switch (integrator) {
    case "verlet":
      return verletStep;
    case "yoshida4":
      return yoshida4Step;
  }
}

function toFiniteBodies(particles: readonly Particle[]): readonly Body[] {
  return particles.map(({ mass, position, velocity }, index) => {
    if (!isFiniteVec(position) || !isFiniteVec(velocity)) {
      throw new PhysicsError(
        "non-finite",
        [index],
        `the state of body ${index} overflows during the step`,
      );
    }

    return { mass, position, velocity };
  });
}
