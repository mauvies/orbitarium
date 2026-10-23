import { describe, expect, it } from "vitest";
import { PhysicsError } from "./errors";
import {
  angularMomentum,
  centerOfMass,
  linearMomentum,
  totalEnergy,
} from "./invariants";
import {
  circularBinary,
  coincidentTriple,
  driftingTriple,
  eccentricBinary,
  handPair,
  overflowingPair,
} from "./testing/fixtures";

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

  it("gives the drifting triple a linear momentum of (0.2, 0.25)", () => {
    const momentum = linearMomentum(driftingTriple);

    expect(momentum.x).toBeCloseTo(0.2, 15);
    expect(momentum.y).toBeCloseTo(0.25, 15);
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
