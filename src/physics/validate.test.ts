import { describe, expect, it } from "vitest";
import { driftingTriple } from "./testing/fixtures";
import type { Body, SystemState } from "./types";
import {
  parseIntegratorName,
  resolveForceOptions,
  resolveSimulationOptions,
  validateDuration,
  validateState,
} from "./validate";

function withBody(index: number, change: Partial<Body>): SystemState {
  return {
    ...driftingTriple,
    bodies: driftingTriple.bodies.map((body, i) =>
      i === index ? { ...body, ...change } : body,
    ),
  };
}

// Spec 01, E12.
describe("rejects invalid input", () => {
  it.each([
    {
      field: "empty bodies",
      check: () => validateState({ time: 0, bodies: [] }),
      message: /state\.bodies must contain at least one body/,
    },
    {
      field: "time = NaN",
      check: () => validateState({ ...driftingTriple, time: Number.NaN }),
      message: /state\.time/,
    },
    {
      field: "mass = 0",
      check: () => validateState(withBody(1, { mass: 0 })),
      message: /state\.bodies\[1\]\.mass/,
    },
    {
      field: "mass = -1",
      check: () => validateState(withBody(1, { mass: -1 })),
      message: /state\.bodies\[1\]\.mass/,
    },
    {
      field: "mass = NaN",
      check: () => validateState(withBody(1, { mass: Number.NaN })),
      message: /state\.bodies\[1\]\.mass/,
    },
    {
      field: "position.x = NaN",
      check: () =>
        validateState(withBody(2, { position: { x: Number.NaN, y: 0 } })),
      message: /state\.bodies\[2\]\.position\.x/,
    },
    {
      field: "velocity.y = Infinity",
      check: () =>
        validateState(
          withBody(0, { velocity: { x: 0, y: Number.POSITIVE_INFINITY } }),
        ),
      message: /state\.bodies\[0\]\.velocity\.y/,
    },
    {
      field: "G = -1",
      check: () => resolveForceOptions({ G: -1 }),
      message: /options\.G/,
    },
    {
      field: "G = NaN",
      check: () => resolveForceOptions({ G: Number.NaN }),
      message: /options\.G/,
    },
    {
      field: "G = Infinity",
      check: () => resolveForceOptions({ G: Number.POSITIVE_INFINITY }),
      message: /options\.G/,
    },
    {
      field: "softening = -0.01",
      check: () => resolveForceOptions({ softening: -0.01 }),
      message: /options\.softening/,
    },
    {
      field: "softening = NaN",
      check: () => resolveForceOptions({ softening: Number.NaN }),
      message: /options\.softening/,
    },
    {
      field: "dt = 0",
      check: () => resolveSimulationOptions({ dt: 0 }),
      message: /options\.dt/,
    },
    {
      field: "dt = -0.1",
      check: () => resolveSimulationOptions({ dt: -0.1 }),
      message: /options\.dt/,
    },
    {
      field: "dt = NaN",
      check: () => resolveSimulationOptions({ dt: Number.NaN }),
      message: /options\.dt/,
    },
    {
      field: "dt = Infinity",
      check: () => resolveSimulationOptions({ dt: Number.POSITIVE_INFINITY }),
      message: /options\.dt/,
    },
    {
      field: "softening < 0 in simulation options",
      check: () => resolveSimulationOptions({ dt: 0.1, softening: -1 }),
      message: /options\.softening/,
    },
    {
      field: 'integrator = "rk4"',
      check: () => parseIntegratorName("rk4"),
      message: /options\.integrator must be one of "yoshida4", "verlet"/,
    },
    {
      field: "duration = -1",
      check: () => validateDuration(-1),
      message: /duration/,
    },
    {
      field: "duration = NaN",
      check: () => validateDuration(Number.NaN),
      message: /duration/,
    },
    {
      field: "duration = Infinity",
      check: () => validateDuration(Number.POSITIVE_INFINITY),
      message: /duration/,
    },
  ])("$field", ({ check, message }) => {
    expect(check).toThrow(RangeError);
    expect(check).toThrow(message);
  });
});

describe("accepts valid input", () => {
  it("accepts a valid state", () => {
    expect(() => validateState(driftingTriple)).not.toThrow();
  });

  it("applies the default force options", () => {
    expect(resolveForceOptions()).toEqual({ G: 1, softening: 0 });
    expect(resolveForceOptions({})).toEqual({ G: 1, softening: 0 });
  });

  it("allows G = 0 (no gravity)", () => {
    expect(resolveForceOptions({ G: 0 })).toEqual({ G: 0, softening: 0 });
  });

  it("applies the default simulation options", () => {
    expect(resolveSimulationOptions({ dt: 0.1 })).toEqual({
      dt: 0.1,
      G: 1,
      softening: 0,
      integrator: "yoshida4",
    });
  });

  it("keeps explicit simulation options", () => {
    expect(
      resolveSimulationOptions({
        dt: 0.01,
        G: 0.5,
        softening: 0.05,
        integrator: "verlet",
      }),
    ).toEqual({ dt: 0.01, G: 0.5, softening: 0.05, integrator: "verlet" });
  });

  it("allows duration = 0", () => {
    expect(() => validateDuration(0)).not.toThrow();
  });
});
