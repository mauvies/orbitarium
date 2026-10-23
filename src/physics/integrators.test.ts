import { describe, expect, it } from "vitest";
import { INNER_WEIGHT, OUTER_WEIGHT } from "./integrators";
import { advance } from "./simulate";
import { maxDistance } from "./testing/assertions";
import { eccentricBinary, eccentricBinaryPeriod } from "./testing/fixtures";
import type { IntegratorName, SystemState, Vec2 } from "./types";

function positions(state: SystemState): readonly Vec2[] {
  return state.bodies.map((body) => body.position);
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
