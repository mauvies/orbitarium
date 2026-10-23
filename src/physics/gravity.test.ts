import { describe, expect, it } from "vitest";
import { PhysicsError } from "./errors";
import { accelerations } from "./gravity";
import { totalEnergy } from "./invariants";
import {
  forceScale,
  forces,
  maxDistance,
  netForceMagnitude,
} from "./testing/assertions";
import {
  coincidentTriple,
  handPair,
  overflowingPair,
  scatteredFour,
} from "./testing/fixtures";
import type { ForceOptions, SystemState, Vec2 } from "./types";
import { add, scale } from "./vec2";

// Spec 01, E2.
const THIRD_LAW_TOLERANCE = 1e-12;

// Spec 01, E16.
const GRADIENT_STEP = 1e-6;
const GRADIENT_TOLERANCE = 1e-6;

function moveBody(
  state: SystemState,
  index: number,
  offset: Vec2,
): SystemState {
  return {
    ...state,
    bodies: state.bodies.map((body, i) =>
      i === index ? { ...body, position: add(body.position, offset) } : body,
    ),
  };
}

/** ∂E/∂rᵢ by central finite differences. */
function energyGradient(
  state: SystemState,
  index: number,
  options: ForceOptions,
): Vec2 {
  const slopeAlong = (direction: Vec2) => {
    const step = scale(direction, GRADIENT_STEP);
    const ahead = totalEnergy(moveBody(state, index, step), options);
    const behind = totalEnergy(
      moveBody(state, index, scale(step, -1)),
      options,
    );
    return (ahead - behind) / (2 * GRADIENT_STEP);
  };
  return { x: slopeAlong({ x: 1, y: 0 }), y: slopeAlong({ x: 0, y: 1 }) };
}

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

it.each([
  { softening: 0 },
  { softening: 0.05 },
])("forces are the negative gradient of the potential (softening = $softening)", (options) => {
  const result = accelerations(scatteredFour, options);
  const forcesFromEnergy = scatteredFour.bodies.map((_, index) =>
    scale(energyGradient(scatteredFour, index, options), -1),
  );

  expect(
    maxDistance(forcesFromEnergy, forces(scatteredFour, result)),
  ).toBeLessThanOrEqual(GRADIENT_TOLERANCE * forceScale(scatteredFour, result));
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
