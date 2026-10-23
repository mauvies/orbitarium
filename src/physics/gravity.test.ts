import { describe, expect, it } from "vitest";
import { PhysicsError } from "./errors";
import { accelerations } from "./gravity";
import { forceScale, netForceMagnitude } from "./testing/assertions";
import {
  coincidentTriple,
  handPair,
  overflowingPair,
  scatteredFour,
} from "./testing/fixtures";

// Spec 01, E2.
const THIRD_LAW_TOLERANCE = 1e-12;

it("matches a hand-calculated two-body case", () => {
  const [lighter, heavier] = accelerations(handPair);

  expect(lighter?.x).toBeCloseTo(0.5, 15);
  expect(lighter?.y).toBeCloseTo(0, 15);
  expect(heavier?.x).toBeCloseTo(-0.25, 15);
  expect(heavier?.y).toBeCloseTo(0, 15);
});

it.each([
  { G: 1, softening: 0 },
  { G: 1, softening: 0.05 },
  { G: 0.5, softening: 0 },
  { G: 0.5, softening: 0.05 },
])("net internal force is zero (G = $G, softening = $softening)", (options) => {
  const result = accelerations(scatteredFour, options);

  expect(netForceMagnitude(scatteredFour, result)).toBeLessThanOrEqual(
    THIRD_LAW_TOLERANCE * forceScale(scatteredFour, result),
  );
});

describe("handles coincident bodies", () => {
  const softened = { softening: 0.1 };

  it("gives finite accelerations with softening", () => {
    for (const acceleration of accelerations(coincidentTriple, softened)) {
      expect(Number.isFinite(acceleration.x)).toBe(true);
      expect(Number.isFinite(acceleration.y)).toBe(true);
    }
  });

  it("exerts no force between coincident bodies with softening", () => {
    const [withPartner] = accelerations(coincidentTriple, softened);
    const [withoutPartner] = accelerations(
      { ...coincidentTriple, bodies: coincidentTriple.bodies.toSpliced(1, 1) },
      softened,
    );

    expect(withPartner).toEqual(withoutPartner);
  });

  it("throws a PhysicsError naming both bodies without softening", () => {
    const compute = () => accelerations(coincidentTriple);

    expect(compute).toThrow(PhysicsError);
    expect(compute).toThrow(/bodies 0 and 1/);
    expect(compute).toThrow(
      expect.objectContaining({ code: "coincident-bodies", bodies: [0, 1] }),
    );
  });
});

it("throws a PhysicsError instead of returning an overflowing acceleration", () => {
  const compute = () => accelerations(overflowingPair, { G: 10 });

  expect(compute).toThrow(PhysicsError);
  expect(compute).toThrow(expect.objectContaining({ code: "non-finite" }));
});
