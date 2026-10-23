import { describe, expect, it } from "vitest";
import {
  advance,
  angularMomentum,
  linearMomentum,
  type SystemState,
  type Vec2,
} from "@/physics";
import { magnitude, maxDistance } from "@/physics/testing/assertions";
import {
  lagrangeTriangle,
  lagrangeTrianglePeriod,
} from "@/physics/testing/fixtures";
import { getOrbit, orbits } from "./catalog";
import { HEAVY_TEST_TIMEOUT_MS, positions } from "./testing/support";

// Spec 02, O1: the order of the brief (§03).
const BRIEF_ORDER = [
  "lagrange",
  "figure-eight",
  "butterfly-i",
  "goggles",
  "moth-i",
  "yin-yang-i",
];
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Spec 02, O2.
const MOMENTUM_TOLERANCE = 1e-12;

// Spec 02, O3: a requirement (sub-pixel), not ten times a measurement.
const CLOSURE_TOLERANCE = 1e-4;

const collinearOrbits = orbits.filter((orbit) => orbit.slug !== "lagrange");

function velocities(state: SystemState): readonly Vec2[] {
  return state.bodies.map((body) => body.velocity);
}

/** The convention of docs/research/orbits.md, from the velocity (p₁, p₂). */
function collinearConvention({ x: p1, y: p2 }: Vec2): SystemState {
  return {
    time: 0,
    bodies: [
      { mass: 1, position: { x: -1, y: 0 }, velocity: { x: p1, y: p2 } },
      { mass: 1, position: { x: 1, y: 0 }, velocity: { x: p1, y: p2 } },
      {
        mass: 1,
        position: { x: 0, y: 0 },
        velocity: { x: -2 * p1, y: -2 * p2 },
      },
    ],
  };
}

function firstVelocity(state: SystemState): Vec2 {
  const first = state.bodies[0];
  if (first === undefined) {
    throw new RangeError("state.bodies is empty");
  }
  return first.velocity;
}

describe("lists the six orbits of the brief", () => {
  it("lists the slugs in the brief's order", () => {
    expect(orbits.map((orbit) => orbit.slug)).toStrictEqual(BRIEF_ORDER);
  });

  it.each(orbits)("gives $slug a kebab-case slug and a source", ({
    slug,
    source,
  }) => {
    expect(slug).toMatch(KEBAB_CASE);
    expect(source.trim()).not.toBe("");
  });

  it.each(orbits)("finds $slug by its slug", (orbit) => {
    expect(getOrbit(orbit.slug)).toBe(orbit);
  });

  it.each([
    "",
    "unknown",
    "Lagrange",
    "yin-yang-i-b",
  ])("returns undefined for the unknown slug %j", (slug) => {
    expect(getOrbit(slug)).toBeUndefined();
  });
});

describe("follows the researched convention", () => {
  it.each(
    collinearOrbits,
  )("starts $slug from Šuvakov's collinear convention", ({ initialState }) => {
    expect(initialState).toStrictEqual(
      collinearConvention(firstVelocity(initialState)),
    );
  });

  it("builds Lagrange from its analytic form", () => {
    const lagrange = getOrbit("lagrange");

    expect(lagrange?.initialState).toStrictEqual(lagrangeTriangle);
    expect(lagrange?.period).toBe(lagrangeTrianglePeriod);
  });

  it.each(orbits)("gives $slug zero linear momentum", ({ initialState }) => {
    expect(magnitude(linearMomentum(initialState))).toBeLessThanOrEqual(
      MOMENTUM_TOLERANCE,
    );
  });

  it.each(collinearOrbits)("gives $slug zero angular momentum", ({
    initialState,
  }) => {
    expect(Math.abs(angularMomentum(initialState))).toBeLessThanOrEqual(
      MOMENTUM_TOLERANCE,
    );
  });
});

describe("closes every orbit after one period", () => {
  it.each(orbits)(
    "closes $slug after one period ($stepsPerPeriod steps)",
    ({ initialState, period, stepsPerPeriod }) => {
      const end = advance(initialState, period, {
        dt: period / stepsPerPeriod,
      });

      expect(
        maxDistance(positions(end), positions(initialState)),
      ).toBeLessThanOrEqual(CLOSURE_TOLERANCE);
      expect(
        maxDistance(velocities(end), velocities(initialState)),
      ).toBeLessThanOrEqual(CLOSURE_TOLERANCE);
    },
    HEAVY_TEST_TIMEOUT_MS,
  );
});
