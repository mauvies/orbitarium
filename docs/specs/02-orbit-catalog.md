# Spec 02: Orbit catalog and playback

Status: approved (2026-10-23), amended after the implementation plan review. Committed before any catalog code.

## Goal

The six periodic orbits of Part B as typed data with a cited source, and a pure playback module that animates any of them indefinitely without drifting off its path. The gallery, the detail view and the build-time thumbnails all use it.

## Why it exists (from the brief)

- **§03 Part B:** a gallery of six solutions (Lagrange, figure-eight, butterfly I, goggles, moth I, yin-yang I), and a detail view with the animated simulation and playback controls. "Finding the initial conditions is part of the work."
- **§03:** each solution has its own shareable URL, so each needs a stable identifier.
- **§09:** decisions with a known cost. Most of these orbits are unstable or have close encounters, and a naive simulation falls apart within seconds.

The research behind the values is in `docs/research/orbits.md`.

## Decisions

1. **The catalog is typed data with a mandatory source.** Each orbit is an `OrbitPreset` with a slug, a display name, its initial state, its period, its steps per period and a `source` string. The source names where the values start from and says they are refined in `docs/research/orbits.md`, because the published precision is not enough (see the note). A preset without a source does not typecheck.
2. **`src/orbits/catalog.ts` is the single source of the values the app uses.** They are the refined values of `docs/research/orbits.md`, written as literals with 12 decimals and checked by hand against the note when they are written. Lagrange is built from its analytic form and equals spec 01's `lagrangeTriangle`.
3. **Steps per period are chosen per orbit.** Close encounters (about 0.01 apart in butterfly I, goggles and yin-yang I) need far smaller steps than smooth orbits. Each orbit takes the smallest value from a fixed ladder (1,000, 2,000, 5,000, 10,000, 20,000, 50,000, 100,000, 200,000, 500,000, 1,000,000) that meets O3. The type of `stepsPerPeriod` is the union of the ladder values, so a value off the ladder does not typecheck. Playback counts substeps of `dt = T / stepsPerPeriod`, so every period ends exactly on a substep.
4. **Re-anchoring at every period.** When playback completes a period, the bodies are replaced by the exact initial bodies, the time is set to the initial time plus `periodsCompleted · T`, and the period counter increases. This removes all accumulated error. Four of the six orbits need it:
   - Lagrange and goggles are unstable: an error grows about ×100 and ×20 per period.
   - Butterfly I and yin-yang I are linearly stable, but at their step counts each period's truncation error (about 6e-5 and 7e-6) takes them out of the linear regime. Without re-anchoring their drift grows about ×1.9 per period (measured during planning: butterfly I is 1.8e-2 off its path after 10 periods).
   - Figure-eight and moth I stay within 1e-4 of their path for at least 10 periods without it.

   Cost: it is a correction, not pure simulation; the "view without correction" option (Decision 5) shows what it hides.
5. **Re-anchoring can be turned off.** `reanchor: false` keeps simulating from the drifted state, to show why the three-body problem is chaotic. The option is read at each period boundary. Turning it off keeps the drifted state from the next boundary on; turning it back on snaps the bodies back at the next boundary, a jump as large as the drift so far. An immediate reset is a restart (`startPlayback`), which spec 03 can offer.
6. **Playback advances in whole substeps of exactly `dt` with an accumulator.**
   - **Input.** It receives simulation time; spec 03 converts frame durations to simulation time with the playback speed.
   - **Accumulator.** It runs as many whole substeps as fit and carries the remainder to the next call (0 ≤ carry < dt). Advancing by k·dt runs exactly k substeps: the count uses spec 01's round-off margin (Decision 2).
   - **One `advance` call per substep.** Each substep is one `advance(state, dt, { dt })` call, so it is exactly `dt`, and the result does not depend on how time is split across calls. `advance(state, k·dt, { dt })` would not give that: its substep is (k·dt)/k, which can differ from `dt` by one ulp, and on Lagrange that difference grows ×100 per period. Cost: about 25% more per substep than one call for k substeps (1.23 µs against 0.98 µs bundled, measured during planning on an Apple M2 Pro with Node 24.14), because each call recomputes the accelerations and validates its input.
   - **Cap.** A call runs at most `maxSubsteps` substeps. When more are due, it runs `maxSubsteps`, still completes any period boundary inside them, and drops the rest (carry 0). A long pause (for example, a background tab) then slows the playback down instead of freezing the page.
7. **Traces share the playback's substeps.** `tracePeriod` samples one period at t = i·T/points for i = 0 … points − 1 (the end of the period equals its start). `points` must divide `stepsPerPeriod`, so every sample falls on a substep; any divisor of 1,000 works for every orbit. The samples are the playback's own positions, so the bodies ride exactly on the trail.
8. **Pure, like the engine.**
   - **Boundary rules.** `src/orbits` has the same boundary rules as `src/physics` (no React, Next.js, Node built-ins or DOM globals).
   - **Dependencies.** It depends only on the public entry point `@/physics`. Biome enforces this: no other `@/` import and no import of engine internals, except that tests may import `@/physics/testing`. `src/physics` in turn imports no `@/` path.
   - **Errors.** Invalid input throws a `RangeError` naming the field. A `PhysicsError` from the engine propagates; it can only happen while drifting without re-anchoring, and recovering from it is spec 03's job.

## Public API (shape, not final code)

```ts
type OrbitSlug =
  | "lagrange" | "figure-eight" | "butterfly-i" | "goggles" | "moth-i" | "yin-yang-i";

type StepsPerPeriod = 1_000 | 2_000 | 5_000 | 10_000 | 20_000 | 50_000
  | 100_000 | 200_000 | 500_000 | 1_000_000; // the ladder (Decision 3)

type OrbitPreset = {
  readonly slug: OrbitSlug;
  readonly name: string;
  readonly initialState: SystemState;
  readonly period: number;
  readonly stepsPerPeriod: StepsPerPeriod;
  readonly source: string;
};

type Playback = {
  readonly orbit: OrbitPreset;
  readonly state: SystemState;
  readonly substepInPeriod: number; // 0 … stepsPerPeriod − 1
  readonly periodsCompleted: number;
  readonly carry: number;           // simulation time not yet run, 0 ≤ carry < dt
};

type PlaybackOptions = {
  readonly reanchor: boolean;
  readonly maxSubsteps: number;     // a positive integer
};

orbits: readonly OrbitPreset[]
getOrbit(slug: string): OrbitPreset | undefined
startPlayback(orbit): Playback
advancePlayback(playback, simulationTime, options: PlaybackOptions): Playback
tracePeriod(orbit, points: number): readonly (readonly Vec2[])[] // [body][sample], one period
```

`Playback` holds its orbit, so a playback cannot be advanced with another orbit's period.

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| O1 | The catalog has exactly the six orbits of the brief, in the brief's order (`lagrange`, `figure-eight`, `butterfly-i`, `goggles`, `moth-i`, `yin-yang-i`), with unique kebab-case slugs and a non-empty `source`. `getOrbit` returns each one by slug and `undefined` for an unknown slug. | §03 | `catalog.test.ts`: "lists the six orbits of the brief" |
| O2 | Each preset follows the convention of `docs/research/orbits.md` exactly. Except for Lagrange: positions (−1, 0), (1, 0) and (0, 0); bodies 1 and 2 share the velocity (p₁, p₂) and body 3 moves at (−2p₁, −2p₂); unit masses; time 0. Lagrange equals spec 01's `lagrangeTriangle`, with period 2π/√3. Every preset has zero total linear momentum, and every preset except Lagrange has zero angular momentum (the convention of the source), within 1e-12. The literals are compared by hand with the research note when the catalog is written (Decision 2). | §03 (initial conditions) | `catalog.test.ts`: "follows the researched convention" |
| O3 | Each orbit closes after one period with the spec 01 engine (Yoshida, `dt = T / stepsPerPeriod`): every position and every velocity returns to its start within 1e-4. This tolerance is a requirement (sub-pixel at any realistic canvas size), not 10 times a measurement, so each orbit's margin is recorded in O4. | §03 | `catalog.test.ts`: "closes every orbit after one period" |
| O4 | `stepsPerPeriod` is the smallest ladder value that meets O3, for each orbit. Recorded below: the closure at that value, at the next lower value (none when the value is 1,000) and at twice the value. A ratio of about 16 between the first and the last shows the closure is truncation error, not round-off. | Decision 3 | `pnpm measure:orbits` (`scripts/measure-orbits.mjs`, on the bundled code as in spec 01's benchmark), which fails if a preset's value is not the smallest passing one; results recorded in this spec |
| O5 | With `reanchor: true`, at every period boundary the bodies are exactly the initial bodies (strict equality) and `state.time` is the initial time plus `periodsCompleted · T`. `periodsCompleted` counts the periods, and `state.time` keeps increasing. A call that crosses one or more boundaries restarts from the initial bodies at each. | Decision 4 | `playback.test.ts`: "re-anchors at every period" |
| O6 | Re-anchoring makes a visible difference where it matters. Without re-anchoring, Lagrange and goggles drift more than 0.1 from their initial positions at a period boundary within the first 10 periods. With re-anchoring, at that same boundary they are exactly on them. The boundary where the drift passes 0.1 is recorded (measured during planning: period 8 for Lagrange, period 4 for goggles). | Decisions 4 and 5 | `playback.test.ts`: "re-anchoring keeps unstable orbits on their path" |
| O7 | Advancing by many frame durations gives the same counters and bodies (strict equality) as one call with their total, and a carry within 1e-12. Each substep is exactly `dt`: one period without re-anchoring equals `advance(initialState, T, { dt })`. Advancing by k·dt runs exactly k substeps, and the remainder is carried. A call never runs more than `maxSubsteps`, drops the excess (carry 0), and completes a boundary reached exactly at the cap. | Decision 6 | `playback.test.ts`: "accumulates frame time into whole substeps" |
| O8 | `tracePeriod` returns `points` samples per body, at t = i·T/points for i = 0 … points − 1, starting at the initial positions. Lagrange's samples are its initial triangle rotated by 2π·i/points, within 1e-7; its exact solution is a rigid rotation, so this checks the timing independently. The samples equal the playback's positions at the same times exactly. | §03 (thumbnails), Decision 7 | `trace.test.ts`: "traces one period" |
| O9 | Purity and boundaries: no input is mutated, the same input gives the same output, and `src/orbits` passes the spec 01 boundary rules and imports only `@/physics`. | Decision 8 | `playback.test.ts` and `trace.test.ts`: "does not mutate its input"; `environment.test.ts`: "loads the public entry point without DOM globals"; Biome rules in CI, plus a one-off probe when the rules are added, with its output in the step summary |
| O10 | Invalid input throws a `RangeError` whose message names the field: `simulationTime` negative or non-finite, `maxSubsteps` not a positive integer, or `points` not a positive integer that divides `stepsPerPeriod`. | Decision 8 | `playback.test.ts` and `trace.test.ts`: "rejects invalid input naming the field" |

### Measured values (O4)

Output of `pnpm measure:orbits` (2026-10-23, Node 24.14.0, arm64). The engine uses only + − × ÷ and `Math.sqrt`, so the values are the same on every platform. CI checks them again through O3 on Linux x64.

| Orbit | T | Steps per period | Closure (position / velocity) | Margin to 1e-4 | Next lower value | At twice the steps (ratio) | Substeps per unit of time |
|---|---|---|---|---|---|---|---|
| Lagrange | 3.6276 | 1,000 | 5.2e-9 / 9.1e-9 | 11,028× | none (bottom of the ladder) | 3.3e-10 / 5.7e-10 (÷16.0) | 276 |
| Figure-eight | 6.3259 | 1,000 | 1.7e-7 / 2.3e-7 | 432× | none (bottom of the ladder) | 1.1e-8 / 1.4e-8 (÷16.0) | 158 |
| Butterfly I | 6.2347 | 100,000 | 5.8e-5 / 4.6e-5 | 1.7× | 50,000: 8.9e-4 / 7.3e-4 | 3.6e-6 / 2.9e-6 (÷15.8) | 16,039 |
| Goggles | 10.4648 | 100,000 | 6.8e-5 / 7.7e-5 | 1.3× | 50,000: 1.0e-3 / 1.3e-3 | 4.3e-6 / 4.8e-6 (÷16.0) | 9,556 |
| Moth I | 14.8943 | 20,000 | 4.2e-5 / 4.7e-5 | 2.1× | 10,000: 6.6e-4 / 7.5e-4 | 2.6e-6 / 3.0e-6 (÷15.9) | 1,343 |
| Yin-yang I | 17.3288 | 500,000 | 7.3e-6 / 7.4e-6 | 14× | 200,000: 2.8e-4 / 2.8e-4 | 4.5e-7 / 4.6e-7 (÷16.0) | 28,854 |

- **The closures are truncation error.** Doubling the steps divides every closure by 15.8 to 16.0, the fourth order of Yoshida's method. Round-off would not shrink with the step. The refined initial conditions close to 1e-10 or better. That is at least 50 times below every closure at the chosen steps, so they do not limit those closures.
- **The threshold can fail.** At the next lower value, every close-encounter orbit fails O3, by a factor of 2.8 (yin-yang I) to 13 (goggles). At 1,000 steps, the four close-encounter orbits fail it by orders of magnitude: their closures are 6.4 to 84.
- **The goggles margin is thin but stable.** At 1.3×, it is the smallest margin, but the results are deterministic, so a thin margin is not flaky. Only a change to the engine's arithmetic could move it, and that is what O3 should catch.
- **Substeps per unit of time is `stepsPerPeriod / T`.** It gives the cost of any playback speed in spec 03: at s units of simulation time per second and 60 Hz, a frame needs that number times s / 60 substeps.

## Out of scope

- Rendering, the gallery, the detail page, playback controls and the playback speed: spec 03.
- How many seconds a period takes on screen (P in spec 01's "real need" formula): spec 03.
- Recovering from a `PhysicsError` while drifting without re-anchoring: spec 03.
- Rewinding: simulation time is never negative; going back is a restart.
- Searching for new orbits (the brief's optional extra).
- Yin-yang I (b): documented in the research note, not in the catalog.

## Risks

- **The heaviest orbit costs the most per frame.** Yin-yang I needs 500,000 substeps per period (O4). At 60 Hz and P seconds of playback per period, a frame needs 500,000 / (60 · P) substeps:

  | P | Substeps per frame | Time per frame at 1.23 µs per substep |
  |---|---|---|
  | 5 s | about 1,670 | 2.1 ms |
  | 2 s | about 4,170 | 5.1 ms |
  | 1 s | about 8,330 | 10 ms, most of a 16.7 ms frame |

  Spec 03 chooses P, or a common speed in simulation time per second, from these numbers. The frame cost is measured with `pnpm bench:playback` and recorded here.
- **Tracing a period costs as much as playing it.** That is 500,000 substeps for yin-yang I, about 0.6 s. Spec 03 must build traces at build time or off the main thread, not when the page loads.
- **Literal values copied wrong.** O2 checks the convention and the momenta, not the digits, and O3 is not designed to catch a small error in p₁, p₂ or T. The literals are therefore compared by hand with the research note when the catalog is written, and the comparison goes in that step's summary.

## Change to spec 01

- **"Real need" note.** It says that steps per period depend on the orbit and are chosen here (Decision 3). Its table and its "1/60 of this load" conclusion hold only at T/1000; the per-frame load of the close-encounter orbits is in this spec's Risks.
- **"Varying frame durations" risk.** It says that the accumulator runs one `advance(state, dt, { dt })` call per substep (Decision 6). Spec 01's round-off margin keeps a multiple k·dt at k substeps, but each of them is (k·dt)/k, not exactly `dt`.

## Decided in the plan

### File layout

| File in `src/orbits` | Responsibility |
|---|---|
| `index.ts` | Public entry point: re-exports `orbits`, `getOrbit`, `startPlayback`, `advancePlayback`, `tracePeriod`, `STEPS_PER_PERIOD_LADDER` and the types, and nothing internal. |
| `types.ts` | `OrbitSlug`, `StepsPerPeriod`, `OrbitPreset`, `Playback`, `PlaybackOptions`. |
| `ladder.ts` | `STEPS_PER_PERIOD_LADDER`, the source of the `StepsPerPeriod` type. |
| `catalog.ts` | `collinearStart(p1, p2)`, the six presets, `orbits` and `getOrbit`. |
| `stepping.ts` | `runSubsteps(state, count, dt)`: one `advance(state, dt, { dt })` per substep, shared by playback and trace. |
| `playback.ts` | `startPlayback`, `advancePlayback`: accumulator, period boundary, re-anchoring, cap. |
| `trace.ts` | `tracePeriod`. |
| `validate.ts` | `RangeError` checks for `simulationTime`, `options.maxSubsteps` and `points`. |

Tests sit next to the code: `catalog.test.ts` (O1 to O3), `playback.test.ts` (O5 to O7, O9, O10), `trace.test.ts` (O8 to O10) and `environment.test.ts` (O9). They reuse `deepFreeze`, `maxDistance` and `lagrangeTriangle` from `@/physics/testing`. Outside `src/orbits`:

- `scripts/bundle.mjs` holds the Vite bundling shared by the scripts, extracted from `scripts/bench-physics.mjs`.
- `scripts/measure-orbits.mjs` measures O4.
- `scripts/bench-playback.mjs` measures the frame cost (Risks).

### Playback algorithm

```
dt     = period / stepsPerPeriod
due    = floor((carry + simulationTime) / dt + 1e-9)   // spec 01, Decision 2: k·dt runs k substeps
run    = min(due, maxSubsteps)
carry' = due > maxSubsteps ? 0 : max(0, carry + simulationTime − run · dt)
while run > 0:
  chunk = min(run, stepsPerPeriod − substepInPeriod)
  state = runSubsteps(state, chunk, dt)
  substepInPeriod += chunk; run −= chunk
  if substepInPeriod == stepsPerPeriod:                 // the boundary belongs to the period's last substep
    periodsCompleted += 1; substepInPeriod = 0
    if reanchor: state = { bodies: initialState.bodies, time: initialState.time + periodsCompleted · period }
```

| Case | Behaviour |
|---|---|
| `carry + simulationTime < dt` | No substeps; the carry grows. |
| A call crosses one or more boundaries | Runs to each boundary, completes it and continues from there. |
| A call ends exactly on a boundary, or the cap lands on one | The boundary is completed in that call; `substepInPeriod` is 0. |
| More substeps due than `maxSubsteps` | Runs `maxSubsteps`, completes the boundaries inside them, sets the carry to 0. |
| `reanchor` changes between calls | Takes effect at the next boundary (Decision 5). |
| The engine throws a `PhysicsError` | It propagates; the input playback is unchanged. |

With re-anchoring on throughout, the state at substep s of any period is identical to period 0's at substep s, and to the trace.

### Test-suite time

Vitest's module runner makes the engine about 2.2 times slower than the bundled code under `vitest run`: about 2.14 µs per substep in one `advance` call and 2.70 µs with one call per substep. (Spec 01's factor of 5 was measured in Vitest's bench mode.) This was measured during planning with Vite's SSR transform, which rewrites imports the same way, and checked against the E9 reference workload: 63 ms in Vitest, 62 to 71 ms with the transform, 29 to 42 ms bundled. To keep `pnpm test` at about 2.5 s without weakening the criteria:

| Test | Substeps | Estimate in Vitest |
|---|---|---|
| O3: every orbit, a full period | 722,000 | 1.6 s |
| O6: both arms, stopping at the first boundary past 0.1 | 816,000 | 2.2 s |
| O5, O7, O8, O9, O10: mechanisms tested on the 1,000-step orbits (Lagrange, figure-eight) | under 40,000 | under 0.1 s |

- `catalog.test.ts` and `playback.test.ts` run in parallel workers.
- The O3 and O6 cases have a named timeout of 30 s, because shared CI runners are about twice as slow and Vitest's default is 5 s per test.
- Running O5 and O6 on every orbit for 10 periods would take about 39 s. Bundling the code for the tests would save only the factor of 2.2. A separate slow suite would take O3 and O6 out of `pnpm test`. Native module loading in Vitest fails on the extensionless relative imports and the `@/` alias.
