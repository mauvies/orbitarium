import { beforeAll, describe, expect, it } from "vitest";
import { PhysicsError } from "./errors";
import {
  angularMomentum,
  centerOfMass,
  linearMomentum,
  totalEnergy,
} from "./invariants";
import { advance } from "./simulate";
import {
  angularMomentumScale,
  closestApproach,
  magnitude,
  momentumScale,
  systemSize,
} from "./testing/assertions";
import {
  circularBinary,
  coincidentTriple,
  driftingTriple,
  eccentricBinary,
  eccentricBinaryPeriod,
  handPair,
  overflowingPair,
} from "./testing/fixtures";
import type { IntegratorName, SystemState } from "./types";
import { add, scale, sub } from "./vec2";

// Spec 01, E3 and E4: driftingTriple from t = 0 to 5 in calls of 0.1.
const RUN_DURATION = 5;
const RUN_DT = 1e-3;
const SAMPLE_EVERY = 0.1;
const LINEAR_MOMENTUM_TOLERANCE = 1e-12;
const CENTER_OF_MASS_TOLERANCE = 1e-12;
const ANGULAR_MOMENTUM_TOLERANCE = 1e-10;
const MINIMUM_SEPARATION = 0.05;

const integrators: readonly IntegratorName[] = ["verlet", "yoshida4"];

/** The start state followed by the state after each call to `advance`. */
function conservationRun(
  integrator: IntegratorName,
  sampleEvery = SAMPLE_EVERY,
): SystemState[] {
  const states = [driftingTriple];
  let state = driftingTriple;

  for (let call = 0; call < Math.round(RUN_DURATION / sampleEvery); call++) {
    state = advance(state, sampleEvery, { dt: RUN_DT, integrator });
    states.push(state);
  }

  return states;
}

describe("computes known values", () => {
  it("gives the circular binary a total energy of −0.25", () => {
    expect(totalEnergy(circularBinary)).toBeCloseTo(-0.25, 15);
  });

  it("gives the eccentric binary a total energy of −0.375", () => {
    expect(totalEnergy(eccentricBinary)).toBeCloseTo(-0.375, 15);
  });

  it("uses the softened potential −G·m₁·m₂/√(r² + ε²)", () => {
    // handPair is at rest: masses 1 and 2 at distance 2, so with ε = 1 the
    // energy is −2/√5.
    expect(totalEnergy(handPair, { softening: 1 })).toBeCloseTo(
      -2 / Math.sqrt(5),
      15,
    );
  });

  it("gives the drifting triple a linear momentum of (0.6, −1.1)", () => {
    const momentum = linearMomentum(driftingTriple);

    expect(momentum.x).toBeCloseTo(0.6, 15);
    expect(momentum.y).toBeCloseTo(-1.1, 15);
  });

  it("gives the circular binary an angular momentum of 1", () => {
    expect(angularMomentum(circularBinary)).toBeCloseTo(1, 15);
  });

  it("gives the eccentric binary an angular momentum of √0.5", () => {
    expect(angularMomentum(eccentricBinary)).toBeCloseTo(Math.sqrt(0.5), 15);
  });

  it("places the hand pair's centre of mass at (4/3, 0)", () => {
    const center = centerOfMass(handPair);

    expect(center.x).toBeCloseTo(4 / 3, 15);
    expect(center.y).toBeCloseTo(0, 15);
  });
});

// Spec 01, E13.
describe("handles coincident bodies", () => {
  it("gives a finite energy with softening", () => {
    expect(
      Number.isFinite(totalEnergy(coincidentTriple, { softening: 0.1 })),
    ).toBe(true);
  });

  it("throws a PhysicsError naming both bodies without softening", () => {
    const compute = () => totalEnergy(coincidentTriple);

    expect(compute).toThrow(PhysicsError);
    expect(compute).toThrow(/bodies 0 and 1/);
    expect(compute).toThrow(
      expect.objectContaining({ code: "coincident-bodies", bodies: [0, 1] }),
    );
  });
});

// Spec 01, E13.
it.each([
  { quantity: "total energy", compute: () => totalEnergy(overflowingPair) },
  {
    quantity: "linear momentum",
    compute: () => linearMomentum(overflowingPair),
  },
  {
    quantity: "angular momentum",
    compute: () => angularMomentum(overflowingPair),
  },
  { quantity: "centre of mass", compute: () => centerOfMass(overflowingPair) },
])("throws a PhysicsError instead of returning an overflowing $quantity", ({
  compute,
}) => {
  expect(compute).toThrow(PhysicsError);
  expect(compute).toThrow(expect.objectContaining({ code: "non-finite" }));
});

it.each(
  integrators,
)("keeps every pair of the drifting triple at least 0.05 apart (%s)", (integrator) => {
  const everySubstep = conservationRun(integrator, RUN_DT);

  expect(Math.min(...everySubstep.map(closestApproach))).toBeGreaterThan(
    MINIMUM_SEPARATION,
  );
});

// Spec 01, E3.
describe("conserves linear momentum", () => {
  it.each(
    integrators,
  )("keeps the total momentum constant (%s)", (integrator) => {
    const initial = linearMomentum(driftingTriple);
    const tolerance = LINEAR_MOMENTUM_TOLERANCE * momentumScale(driftingTriple);

    for (const state of conservationRun(integrator)) {
      expect(
        magnitude(sub(linearMomentum(state), initial)),
      ).toBeLessThanOrEqual(tolerance);
    }
  });

  it.each(
    integrators,
  )("moves the centre of mass in a straight line at constant speed (%s)", (integrator) => {
    const totalMass = driftingTriple.bodies.reduce(
      (sum, body) => sum + body.mass,
      0,
    );

    const start = centerOfMass(driftingTriple);
    const velocity = scale(linearMomentum(driftingTriple), 1 / totalMass);

    for (const state of conservationRun(integrator)) {
      const onTheLine = add(start, scale(velocity, state.time));

      expect(
        magnitude(sub(centerOfMass(state), onTheLine)),
      ).toBeLessThanOrEqual(CENTER_OF_MASS_TOLERANCE * systemSize(state));
    }
  });
});

// Spec 01, E4.
it.each(integrators)("conserves angular momentum (%s)", (integrator) => {
  const initial = angularMomentum(driftingTriple);

  const tolerance =
    ANGULAR_MOMENTUM_TOLERANCE * angularMomentumScale(driftingTriple);

  for (const state of conservationRun(integrator)) {
    expect(Math.abs(angularMomentum(state) - initial)).toBeLessThanOrEqual(
      tolerance,
    );
  }
});

// Spec 01, E5: eccentricBinary with the default integrator, sampled after
// every substep, because the error peaks in a short window around periapsis.
describe("energy error does not grow", () => {
  const PERIODS = 100;
  const STEPS_PER_PERIOD = 1000;
  const GROWTH_LIMIT = 2;
  const ENERGY_ERROR_THRESHOLD = 5e-7;

  let largestErrorPerPeriod: number[] = [];

  beforeAll(() => {
    const dt = eccentricBinaryPeriod / STEPS_PER_PERIOD;
    const initialEnergy = totalEnergy(eccentricBinary);
    let state = eccentricBinary;

    largestErrorPerPeriod = Array.from({ length: PERIODS }, () => {
      let largest = 0;

      for (let step = 0; step < STEPS_PER_PERIOD; step++) {
        state = advance(state, dt, { dt });

        const relativeError = Math.abs(
          (totalEnergy(state) - initialEnergy) / initialEnergy,
        );

        largest = Math.max(largest, relativeError);
      }

      return largest;
    });
  });

  it("stays below the measured threshold over 100 periods", () => {
    expect(Math.max(...largestErrorPerPeriod)).toBeLessThanOrEqual(
      ENERGY_ERROR_THRESHOLD,
    );
  });

  it("is at most twice as large in periods 91 to 100 as in periods 1 to 10", () => {
    const early = Math.max(...largestErrorPerPeriod.slice(0, 10));
    const late = Math.max(...largestErrorPerPeriod.slice(-10));

    expect(late).toBeLessThanOrEqual(GROWTH_LIMIT * early);
  });
});
