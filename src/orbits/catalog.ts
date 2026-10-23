import type { SystemState } from "@/physics";
import type { OrbitPreset } from "./types";

// The values the app uses: the refined values of docs/research/orbits.md,
// with G = 1 and unit masses (spec 02, Decision 2).

const REFINED = "refined in docs/research/orbits.md";
const SUVAKOV_TABLE =
  "Šuvakov and Dmitrašinović, Phys. Rev. Lett. 110, 114301 (2013), Table I";

/**
 * Šuvakov and Dmitrašinović's convention: a collinear start with the third
 * body in the middle and zero angular momentum, set by the velocity (p1, p2).
 */
function collinearStart(p1: number, p2: number): SystemState {
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

const triangleRadius = 1 / Math.sqrt(3);

const lagrange: OrbitPreset = {
  slug: "lagrange",
  name: "Lagrange",
  // Equilateral triangle of side 1, every body moving at speed 1, as spec 01's
  // lagrangeTriangle.
  initialState: {
    time: 0,
    bodies: [
      {
        mass: 1,
        position: { x: 0, y: triangleRadius },
        velocity: { x: -1, y: 0 },
      },
      {
        mass: 1,
        position: { x: -0.5, y: -triangleRadius / 2 },
        velocity: { x: 0.5, y: -Math.sqrt(3) / 2 },
      },
      {
        mass: 1,
        position: { x: 0.5, y: -triangleRadius / 2 },
        velocity: { x: 0.5, y: Math.sqrt(3) / 2 },
      },
    ],
  },
  period: (2 * Math.PI) / Math.sqrt(3),
  stepsPerPeriod: 1_000,
  source: "Lagrange (1772); analytic equilateral solution of side 1",
};

const figureEight: OrbitPreset = {
  slug: "figure-eight",
  name: "Figure-eight",
  initialState: collinearStart(0.347116888118, 0.532724945388),
  period: 6.325913982923,
  stepsPerPeriod: 1_000,
  source: `Chenciner and Montgomery (2000); Šuvakov's convention, ${REFINED}`,
};

const butterflyI: OrbitPreset = {
  slug: "butterfly-i",
  name: "Butterfly I",
  initialState: collinearStart(0.306893420453, 0.125506567018),
  period: 6.234674838629,
  stepsPerPeriod: 100_000,
  source: `${SUVAKOV_TABLE}; ${REFINED}`,
};

const goggles: OrbitPreset = {
  slug: "goggles",
  name: "Goggles",
  initialState: collinearStart(0.083300071859, 0.127889255504),
  period: 10.464849525803,
  stepsPerPeriod: 100_000,
  source: `${SUVAKOV_TABLE}; ${REFINED}`,
};

const mothI: OrbitPreset = {
  slug: "moth-i",
  name: "Moth I",
  initialState: collinearStart(0.464445172818, 0.396060014653),
  period: 14.894305175019,
  stepsPerPeriod: 20_000,
  source: `${SUVAKOV_TABLE}; ${REFINED}`,
};

const yinYangI: OrbitPreset = {
  slug: "yin-yang-i",
  name: "Yin-yang I",
  initialState: collinearStart(0.513938537458, 0.304735919347),
  period: 17.328834018431,
  stepsPerPeriod: 500_000,
  source: `${SUVAKOV_TABLE}, variant (a); ${REFINED}`,
};

/** The six orbits of the brief, in its order (spec 02, O1). */
export const orbits: readonly OrbitPreset[] = [
  lagrange,
  figureEight,
  butterflyI,
  goggles,
  mothI,
  yinYangI,
];

/** The orbit with this slug, or undefined for an unknown slug (for example, from a URL). */
export function getOrbit(slug: string): OrbitPreset | undefined {
  return orbits.find((orbit) => orbit.slug === slug);
}
