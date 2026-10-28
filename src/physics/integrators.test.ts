import { describe, expect, it } from "vitest";
import { INNER_WEIGHT, OUTER_WEIGHT } from "./integrators";
import { advance } from "./simulate";
import { maxDistance } from "./testing/assertions";
import {
  circularBinary,
  circularBinaryPeriod,
  eccentricBinary,
  eccentricBinaryPeriod,
  lagrangeTriangle,
  lagrangeTrianglePeriod,
} from "./testing/fixtures";
import type { IntegratorName, SystemState, Vec2 } from "./types";
import { scale } from "./vec2";

// Spec 01, E6 and E7: measured with the default integrator at dt = T/1000.
const CLOSURE_STEPS_PER_PERIOD = 1000;
const CIRCULAR_CLOSURE_TOLERANCE = 1e-7;
const LAGRANGE_CLOSURE_TOLERANCE = 1e-7;

// Spec 01, E8.
const REVERSIBILITY_TOLERANCE = 1e-10;

const integrators: readonly IntegratorName[] = ["verlet", "yoshida4"];

function positions(state: SystemState): readonly Vec2[] {
  return state.bodies.map((body) => body.position);
}

function velocities(state: SystemState): readonly Vec2[] {
  return state.bodies.map((body) => body.velocity);
}

function withVelocitiesReversed(state: SystemState): SystemState {
  return {
    ...state,
    bodies: state.bodies.map((body) => ({
      ...body,
      velocity: scale(body.velocity, -1),
    })),
  };
}

function afterOnePeriod(
  integrator: IntegratorName,
  stepsPerPeriod: number,
): readonly Vec2[] {
  const dt = eccentricBinaryPeriod / stepsPerPeriod;

  return positions(
    advance(eccentricBinary, eccentricBinaryPeriod, { dt, integrator }),
  );
}

/** How far each body ends from its start after one period (absolute). */
function closureError(state: SystemState, period: number): number {
  const dt = period / CLOSURE_STEPS_PER_PERIOD;

  return maxDistance(
    positions(advance(state, period, { dt })),
    positions(state),
  );
}

describe("Yoshida weights", () => {
  const LITERAL_TOLERANCE = 1e-15;
  const cubeRootOfTwo = Math.cbrt(2);

  it("writes the outer weight as 1 / (2 − ∛2)", () => {
    expect(
      Math.abs(OUTER_WEIGHT - 1 / (2 - cubeRootOfTwo)),
    ).toBeLessThanOrEqual(LITERAL_TOLERANCE);
  });

  it("writes the inner weight as −∛2 / (2 − ∛2)", () => {
    expect(
      Math.abs(INNER_WEIGHT - -cubeRootOfTwo / (2 - cubeRootOfTwo)),
    ).toBeLessThanOrEqual(LITERAL_TOLERANCE);
  });
});

// Spec 01, E6.
it("closes a circular two-body orbit", () => {
  expect(
    closureError(circularBinary, circularBinaryPeriod),
  ).toBeLessThanOrEqual(CIRCULAR_CLOSURE_TOLERANCE);
});

// Spec 01, E7.
it("closes Lagrange's triangle after one period", () => {
  expect(
    closureError(lagrangeTriangle, lagrangeTrianglePeriod),
  ).toBeLessThanOrEqual(LAGRANGE_CLOSURE_TOLERANCE);
});

// Spec 01, E8.
describe("is time-reversible", () => {
  const options = { dt: circularBinaryPeriod / 1000 };

  function forwardAndBack(integrator: IntegratorName): SystemState {
    const forward = advance(circularBinary, circularBinaryPeriod, {
      ...options,
      integrator,
    });

    return advance(withVelocitiesReversed(forward), circularBinaryPeriod, {
      ...options,
      integrator,
    });
  }

  it.each(
    integrators,
  )("returns every body to its start position (%s)", (integrator) => {
    expect(
      maxDistance(
        positions(forwardAndBack(integrator)),
        positions(circularBinary),
      ),
    ).toBeLessThanOrEqual(REVERSIBILITY_TOLERANCE);
  });

  it.each(
    integrators,
  )("returns every body to its start velocity, reversed (%s)", (integrator) => {
    expect(
      maxDistance(
        velocities(forwardAndBack(integrator)),
        velocities(withVelocitiesReversed(circularBinary)),
      ),
    ).toBeLessThanOrEqual(REVERSIBILITY_TOLERANCE);
  });
});

// Spec 01, E9.
describe("converges at the expected order", () => {
  const REFERENCE_STEPS = 12_800;

  const errorAt = (integrator: IntegratorName, stepsPerPeriod: number) =>
    maxDistance(
      afterOnePeriod(integrator, stepsPerPeriod),
      afterOnePeriod("yoshida4", REFERENCE_STEPS),
    );

  const cases: readonly {
    integrator: IntegratorName;
    steps: { coarse: number; medium: number; fine: number };
    ratio: { min: number; max: number };
  }[] = [
    {
      integrator: "yoshida4",
      steps: { coarse: 100, medium: 200, fine: 400 },
      ratio: { min: 12, max: 20 },
    },
    {
      integrator: "verlet",
      steps: { coarse: 200, medium: 400, fine: 800 },
      ratio: { min: 3, max: 5 },
    },
  ];

  it.each(
    cases,
  )("halving dt divides the $integrator error by $ratio.min to $ratio.max", ({
    integrator,
    steps,
    ratio,
  }) => {
    const coarse = errorAt(integrator, steps.coarse);
    const medium = errorAt(integrator, steps.medium);
    const fine = errorAt(integrator, steps.fine);

    for (const halving of [coarse / medium, medium / fine]) {
      expect(halving).toBeGreaterThanOrEqual(ratio.min);
      expect(halving).toBeLessThanOrEqual(ratio.max);
    }
  });

  it("compares against a converged reference run", () => {
    const finestTested = errorAt("yoshida4", 400);
    const referenceError = errorAt("yoshida4", 2 * REFERENCE_STEPS);

    expect(referenceError).toBeLessThan(finestTested / 100);
  });
});
