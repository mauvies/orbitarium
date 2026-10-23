# Spec 02: Orbit catalog and playback

Status: draft for review (2026-10-23). Committed before any catalog code.

## Goal

The six periodic orbits of Part B as typed data with a cited source, and a pure playback module that animates any of them indefinitely without drifting off its path. The gallery, the detail view and the build-time thumbnails all use it.

## Why it exists (from the brief)

- **§03 Part B:** a gallery of six solutions (Lagrange, figure-eight, butterfly I, goggles, moth I, yin-yang I), and a detail view with the animated simulation and playback controls. "Finding the initial conditions is part of the work."
- **§03:** each solution has its own shareable URL, so each needs a stable identifier.
- **§09:** decisions with a known cost. Most of these orbits are unstable or have close encounters, and a naive simulation falls apart within seconds.

The research behind the values is in `docs/research/orbits.md`.

## Decisions

1. **The catalog is typed data with a mandatory source.** Each orbit is an `OrbitPreset` with a slug, a display name, its initial state, its period, its steps per period and a `source` string (paper and table). A preset without a source does not typecheck.
2. **Initial conditions are the refined values in `docs/research/orbits.md`,** written as literals with 12 decimals. Lagrange is built from its analytic form, as in spec 01.
3. **Steps per period are chosen per orbit.** Close encounters (about 0.01 apart in butterfly I, goggles and yin-yang I) need far smaller steps than smooth orbits. Each orbit takes the smallest value from a fixed ladder (1,000, 2,000, 5,000, 10,000, 20,000, 50,000, 100,000, 200,000, 500,000, 1,000,000) that meets O3. Because `dt = T / stepsPerPeriod`, every period ends exactly on a substep.
4. **Re-anchoring at every period.** When playback completes a period, the state is replaced by the exact initial state and the period counter increases. This removes all accumulated error, including the exponential growth of the unstable orbits (Lagrange and goggles grow about ×100 and ×20 per period). Cost: it is a correction, not pure simulation; the "view without correction" option (Decision 5) shows what it hides.
5. **Re-anchoring can be turned off.** `reanchor: false` keeps simulating from the drifted state, to show why the three-body problem is chaotic.
6. **Playback advances in whole substeps with an accumulator.** It receives real frame durations, converts them to simulation time, runs as many whole substeps as fit and carries the remainder to the next call. Substeps are therefore always exactly `dt`. The number of substeps per call is capped, so a long pause (for example, a background tab) cannot freeze the page; excess time is dropped.
7. **Pure, like the engine.** `src/orbits` has the same boundary rules as `src/physics` (no React, Next.js, Node built-ins or DOM globals) and depends only on `@/physics`.

## Public API (shape, not final code)

```ts
type OrbitSlug =
  | "lagrange" | "figure-eight" | "butterfly-i" | "moth-i" | "goggles" | "yin-yang-i";

type OrbitPreset = {
  readonly slug: OrbitSlug;
  readonly name: string;
  readonly initialState: SystemState;
  readonly period: number;
  readonly stepsPerPeriod: number;
  readonly source: string;
};

type Playback = {
  readonly state: SystemState;
  readonly substepInPeriod: number; // 0 … stepsPerPeriod − 1
  readonly periodsCompleted: number;
  readonly carry: number;           // simulation time not yet run
};

orbits: readonly OrbitPreset[]
getOrbit(slug: string): OrbitPreset | undefined
startPlayback(orbit): Playback
advancePlayback(playback, orbit, simulationTime, options: { reanchor: boolean; maxSubsteps: number }): Playback
tracePeriod(orbit, points: number): readonly (readonly Vec2[])[] // one period, sampled, for thumbnails and trails
```

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| O1 | The catalog has exactly the six orbits of the brief, in the brief's order, with unique kebab-case slugs and a non-empty `source`. `getOrbit` returns each one by slug and `undefined` for an unknown slug. | §03 | `catalog.test.ts`: "lists the six orbits of the brief" |
| O2 | Each preset's values equal those in `docs/research/orbits.md` exactly. Every preset has zero total linear momentum, and every preset except Lagrange has zero angular momentum (the convention of the source), within 1e-12. | §03 (initial conditions) | `catalog.test.ts`: "matches the researched initial conditions" |
| O3 | Each orbit closes after one period with the spec 01 engine (Yoshida, `dt = T / stepsPerPeriod`): every position and velocity returns to its start within 1e-4 (measured; sub-pixel at any realistic canvas size). | §03 | `catalog.test.ts`: "closes every orbit after one period" |
| O4 | `stepsPerPeriod` is the smallest ladder value that meets O3, for each orbit. The measured closure at that value and at the next lower value are recorded here. | Decision 3 | Measured with a script, recorded in this spec |
| O5 | With `reanchor: true`, the state at every period boundary is exactly the initial state (strict equality), `periodsCompleted` counts the periods, and `state.time` keeps increasing. | Decision 4 | `playback.test.ts`: "re-anchors at every period" |
| O6 | Re-anchoring makes a visible difference where it matters: after 10 periods, Lagrange and goggles without re-anchoring are more than 0.1 away from the re-anchored path, and with re-anchoring stay within the O3 tolerance of it. | Decisions 4 and 5 | `playback.test.ts`: "re-anchoring keeps unstable orbits on their path" |
| O7 | Advancing by many small frame durations gives the same state as one call with their total, within 1e-12; substeps are always exactly `dt`; the remainder is carried; a call never runs more than `maxSubsteps`. | Decision 6 | `playback.test.ts`: "accumulates frame time into whole substeps" |
| O8 | `tracePeriod` returns `points` samples per body, evenly spaced in time over one period, starting at the initial positions. | §03 (thumbnails) | `playback.test.ts`: "traces one period" |
| O9 | Purity and boundaries: no input is mutated, the same input gives the same output, and `src/orbits` passes the spec 01 boundary rules. | Decision 7 | `playback.test.ts`: "does not mutate its input"; Biome rules in CI |

## Out of scope

- Rendering, the gallery, the detail page, playback controls and the playback speed: spec 03.
- How many seconds a period takes on screen (P in spec 01's "real need" formula): spec 03.
- Searching for new orbits (the brief's optional extra).
- Yin-yang I (b): documented in the research note, not in the catalog.

## Risks

- **The heaviest orbit costs the most per frame.** At 100,000 steps per period and one period per 5 seconds at 60 Hz, a frame needs about 330 substeps, about 0.3 ms at the spec 01 benchmark speed. If O4 picks a larger value for some orbit, spec 03 must slow its playback or accept the cost; the numbers are recorded here so that decision is informed.
- **Literal values copied wrong.** O2 compares every value with the research note, so a typo fails a test.

## Change to spec 01

Spec 01's "Real need" note assumes `dt = T / 1000`, which holds for the orbits spec 01 tests but not for the close encounters of butterfly I, goggles and yin-yang I. The note gets one sentence: steps per period depend on the orbit and are chosen in spec 02 (Decision 3).