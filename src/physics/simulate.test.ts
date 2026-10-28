import { describe, expect, it } from "vitest";
import { accelerations } from "./gravity";
import {
  angularMomentum,
  centerOfMass,
  linearMomentum,
  totalEnergy,
} from "./invariants";
import { advance, planSubsteps } from "./simulate";
import { deepFreeze, maxDistance } from "./testing/assertions";
import { circularBinary, driftingTriple, headOnPair } from "./testing/fixtures";
import type { IntegratorName, SimulationOptions } from "./types";
import { add, scale } from "./vec2";

// Spec 01, E10.
const dt = 0.1;
const startTime = 1.25;
const verlet: SimulationOptions = { dt, integrator: "verlet" };
const SUBSTEP_ROUND_OFF = 1e-9;
const SPLIT_CALLS_TOLERANCE = 1e-14;

// Spec 01, E12.
const STRAIGHT_LINE_TOLERANCE = 1e-12;

const integrators: readonly IntegratorName[] = ["verlet", "yoshida4"];

describe("advances by the exact duration", () => {
  const start = { ...circularBinary, time: startTime };

  it.each([0.25, 3 * dt, 1])("ends exactly at state.time + %s", (duration) => {
    expect(advance(start, duration, verlet).time).toBe(startTime + duration);
  });

  it.each([
    { duration: 0.25, count: 3 },
    { duration: 3 * dt, count: 3 },
    { duration: 1, count: 10 },
  ])("splits $duration into $count equal substeps no larger than dt", ({
    duration,
    count,
  }) => {
    const plan = planSubsteps(duration, dt);

    expect(plan.count).toBe(count);
    expect(plan.size).toBe(duration / count);
    expect(plan.size).toBeLessThanOrEqual(dt * (1 + SUBSTEP_ROUND_OFF));
  });

  it("returns an equal state for a zero duration", () => {
    expect(advance(start, 0, verlet)).toStrictEqual(start);
  });

  it("matches three single calls when advancing by 3 · dt at once", () => {
    const once = advance(start, 3 * dt, verlet);

    const inThreeCalls = [dt, dt, dt].reduce(
      (state, duration) => advance(state, duration, verlet),
      start,
    );

    expect(
      maxDistance(
        once.bodies.map((body) => body.position),
        inThreeCalls.bodies.map((body) => body.position),
      ),
    ).toBeLessThanOrEqual(SPLIT_CALLS_TOLERANCE);
  });
});

// Spec 01, E11.
describe("does not mutate its input and is deterministic", () => {
  const state = deepFreeze(structuredClone(driftingTriple));

  const options = deepFreeze<SimulationOptions>({
    dt: 0.01,
    softening: 0.01,
    integrator: "verlet",
  });

  it("leaves the input unchanged in every public function", () => {
    const snapshot = structuredClone(state);

    accelerations(state, options);
    totalEnergy(state, options);
    linearMomentum(state);
    angularMomentum(state);
    centerOfMass(state);
    advance(state, 0.5, options);

    expect(state).toStrictEqual(snapshot);
  });

  it("gives the same output for the same input", () => {
    expect(advance(state, 0.5, options)).toStrictEqual(
      advance(state, 0.5, options),
    );
  });
});

// Spec 01, E12.
describe("every public function validates its input", () => {
  const noBodies = { time: 0, bodies: [] };

  it.each([
    {
      name: "accelerations",
      call: () => accelerations({ ...driftingTriple, time: Number.NaN }),
      message: /state\.time/,
    },
    {
      name: "totalEnergy",
      call: () => totalEnergy(driftingTriple, { G: -1 }),
      message: /options\.G/,
    },
    {
      name: "linearMomentum",
      call: () => linearMomentum(noBodies),
      message: /state\.bodies/,
    },
    {
      name: "angularMomentum",
      call: () => angularMomentum(noBodies),
      message: /state\.bodies/,
    },
    {
      name: "centerOfMass",
      call: () => centerOfMass(noBodies),
      message: /state\.bodies/,
    },
    {
      name: "advance (duration)",
      call: () => advance(driftingTriple, -1, verlet),
      message: /duration/,
    },
    {
      name: "advance (options)",
      call: () => advance(driftingTriple, 1, { dt: 0 }),
      message: /options\.dt/,
    },
  ])("$name", ({ call, message }) => {
    expect(call).toThrow(RangeError);
    expect(call).toThrow(message);
  });

  it("rejects more than 1,000,000 substeps in one call", () => {
    const call = () => advance(driftingTriple, 1e9, { ...verlet, dt: 1e-3 });

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/1000000 substeps/);
  });

  it("allows exactly 1,000,000 substeps", () => {
    expect(planSubsteps(1000, 1e-3).count).toBe(1_000_000);
  });
});

it("defaults to the yoshida4 integrator", () => {
  expect(advance(driftingTriple, 1, { dt })).toStrictEqual(
    advance(driftingTriple, 1, { dt, integrator: "yoshida4" }),
  );
});

it.each(
  integrators,
)("moves bodies in straight lines when G = 0 (%s)", (integrator) => {
  const duration = 2;
  const result = advance(circularBinary, duration, { dt, integrator, G: 0 });

  const straightLines = circularBinary.bodies.map((body) =>
    add(body.position, scale(body.velocity, duration)),
  );

  expect(
    maxDistance(
      result.bodies.map((body) => body.position),
      straightLines,
    ),
  ).toBeLessThanOrEqual(STRAIGHT_LINE_TOLERANCE);
});

// Spec 01, E13.
it("keeps a head-on collision finite with softening", () => {
  const result = advance(headOnPair, 10, {
    ...verlet,
    dt: 1e-3,
    softening: 0.1,
  });

  for (const body of result.bodies) {
    expect(Number.isFinite(body.position.x)).toBe(true);
    expect(Number.isFinite(body.position.y)).toBe(true);
    expect(Number.isFinite(body.velocity.x)).toBe(true);
    expect(Number.isFinite(body.velocity.y)).toBe(true);
  }
});
