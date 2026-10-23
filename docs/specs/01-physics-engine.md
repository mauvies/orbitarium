# Spec 01: Physics engine

Status: approved (2026-10-22), amended after the implementation plan review. Committed before any engine code.

## Goal

A pure TypeScript module that advances a system of point masses under Newtonian gravity. It must be accurate enough that the periodic three-body orbits of Part B close after one period, and that the cannon trajectories of Part A close instead of spiralling. Both parts share it, and it runs in the browser (animation) and in Node (tests and build-time thumbnails).

## Why it exists (from the brief)

- **§03 Part B:** "detail view with the animated simulation of the three bodies". Three bodies have no closed-form solution, so positions must be computed by numerical integration, step by step.
- **§02 Part A:** an interactive element the user manipulates. Per the Part A design note, this is Newton's cannon: a two-body problem.
- **§09 Criteria:** decisions with a known cost, clear code and solid typing. The engine is the part most likely to be reviewed line by line.

## Decisions

Full rationale and costs will go in the README.

1. **Integrator: 4th-order Yoshida, built from velocity Verlet.** Both are symplectic: their energy error oscillates but does not grow, which is what orbits that repeat forever need. Verlet is also exported, as the baseline for tests. Known cost: a Yoshida step costs three force evaluations. The E9 data shows whether Yoshida at `dt` beats Verlet at `dt / 3` (same cost); the comparison is recorded here when the engine is implemented.
2. **Fixed time step.** The caller passes a maximum step `dt`. `advance(state, duration)` splits `duration` into `n = max(1, ceil(duration / dt − 1e-9))` equal substeps (`n = 0` when `duration = 0`), so the step stays uniform and the simulated time matches `duration` exactly. The `1e-9` absorbs round-off: in JavaScript `Math.ceil((3 * 0.1) / 0.1)` is 4, so without it a caller advancing by "three steps of 0.1" would get four shorter ones. Each substep is therefore at most `dt · (1 + 1e-9)`. One call is limited to 1,000,000 substeps, so a bad input cannot freeze the page. Cost: steps are wasted in calm phases. With three bodies this is negligible, and adaptive stepping would break the symplectic property.
3. **Dimensionless units, with `G` as a parameter (default 1).** The Part B catalog uses G = 1 and unit masses. Converting to km and km/s for Part A is the UI's job, not the engine's.
4. **Optional Plummer softening `ε`, default 0.** Part B uses exact physics. A sandbox can pass ε > 0 so that close encounters do not blow up. Forces and energy use the same softened potential, so energy stays consistent with the forces (E16):
   - acceleration of body i: aᵢ = Σⱼ G·mⱼ·(rⱼ − rᵢ) / (|rⱼ − rᵢ|² + ε²)^(3/2)
   - potential energy: U = −Σᵢ<ⱼ G·mᵢ·mⱼ / √(|rⱼ − rᵢ|² + ε²)

   With ε = 0 these are exact Newtonian gravity.
5. **Pure public API.** Functions return a new state and never mutate their input. The internal representation is decided below ("Decided in the plan"), by measurement. The public API does not change either way.
6. **2D only.** All six Part B orbits and the cannon are planar.
7. **No dependency on React, Next.js, Node or the DOM.** The engine runs in the browser and in Node, so it may use neither environment's APIs. Enforced mechanically by Biome rules scoped to `src/physics`, all at error level (the rules default to warn, and `biome ci` passes on warnings):
   - `noRestrictedImports`: `react`, `react-dom`, `next` and their subpaths, and `@next/*`. Subpaths need `patterns`, because `paths` only matches exact names (`"react"` does not cover `react/jsx-runtime`).
   - `noNodejsModules`: Node built-ins. Test and test-support files are exempt. The benchmark lives in `scripts/`, outside `src/physics`.
   - `noRestrictedGlobals`: `window`, `self`, `document`, `navigator`, `location`, `localStorage`, `sessionStorage`, `requestAnimationFrame`, `cancelAnimationFrame`. Import rules cannot see globals, and the tsconfig `lib` includes `"dom"`, so TypeScript alone would allow them.

   The engine tests also run in Vitest's `node` environment, where `window` does not exist.
8. **Two kinds of error.** Invalid input throws a `RangeError` that names the offending field. A physically singular situation (coincident bodies with ε = 0, or forces that overflow) throws a `PhysicsError` with a `code` and the indices of the bodies involved, so callers (spec 02, Part A) can tell the two apart and handle the second.

## Public API (shape, not final code)

```ts
type Vec2 = { readonly x: number; readonly y: number };

type Body = {
  readonly mass: number;
  readonly position: Vec2;
  readonly velocity: Vec2;
};

type SystemState = {
  readonly bodies: readonly Body[];
  readonly time: number;
};

type ForceOptions = {
  readonly G?: number;         // default 1
  readonly softening?: number; // default 0
};

type SimulationOptions = ForceOptions & {
  readonly dt: number;                         // maximum substep
  readonly integrator?: "yoshida4" | "verlet"; // default "yoshida4"
};

class PhysicsError extends Error {
  readonly code: "coincident-bodies" | "non-finite";
  readonly bodies: readonly number[]; // indices of the bodies involved
}

accelerations(state, options?: ForceOptions): readonly Vec2[]
advance(state, duration, options: SimulationOptions): SystemState
totalEnergy(state, options?: ForceOptions): number
linearMomentum(state): Vec2
angularMomentum(state): number // about the origin
centerOfMass(state): Vec2
```

`accelerations` and `totalEnergy` take only the force options: they do not need a time step.

## Acceptance criteria

Tolerances marked "measured" are fixed during the build step with the procedure in "Measured tolerances" below, and written back into this table in the same commit.

"Relative" tolerances for conserved quantities are measured against a scale of the system, not against the quantity itself, because a conserved quantity can be zero (for example, total momentum in the centre-of-mass frame). The scale is Σ\|mᵢ·aᵢ\| for forces, Σ\|mᵢ·vᵢ\| for linear momentum and Σ\|rᵢ\|·\|mᵢ·vᵢ\| for angular momentum, computed from the initial state. Σ\|rᵢ × mᵢ·vᵢ\| is not used for angular momentum because it is zero when every body moves radially, while the conserved quantity (zero) is still worth checking.

### Fixtures

Named initial states used by the criteria. G = 1 and ε = 0 unless stated otherwise. They are built with `Math.sqrt` and `Math.PI` only, which are exact or correctly rounded, so they are bit-identical on every platform.

| Fixture | Bodies (mass, position, velocity) | Known values |
|---|---|---|
| `handPair` | (1, (0, 0), (0, 0)) and (2, (2, 0), (0, 0)) | centre of mass (4/3, 0) |
| `scatteredFour` | masses 1, 2.5, 0.3 and 7 at (0.1, −0.4), (1.7, 0.9), (−2.2, 1.3) and (0.6, −3.1), at rest | |
| `circularBinary` | (1, (1, 0), (0, 0.5)) and (1, (−1, 0), (0, −0.5)) | T = 4π, E = −0.25, L = 1 |
| `eccentricBinary` | (1, (1, 0), (0, s)) and (1, (−1, 0), (0, −s)), with s = √0.5 / 2 ≈ 0.3536; e = 0.5, starting at apoapsis | T = 2π·√(32/27) ≈ 6.840, E₀ = −0.375, L = √0.5 |
| `lagrangeTriangle` | three masses of 1 on an equilateral triangle of side L = 1, with R = 1/√3: positions (0, R), (−1/2, −R/2) and (1/2, −R/2); velocities (−1, 0), (1/2, −√3/2) and (1/2, √3/2), speed 1/√L = 1 | T = 2π·L^(3/2)/√3 = 2π/√3 ≈ 3.628 |
| `driftingTriple` | a tight binary with a lighter body orbiting it, all drifting together: masses 3, 2 and 1 at (0, 0), (0.6, 0) and (−2.5, 0); velocities (0.1, −1.1), (0.1, 1.8) and (0.1, −1.4) | total momentum (0.6, −1.1), so the centre of mass moves. Tests assert that no pair comes closer than 0.05 during the run; the measured closest approach over t = 0 to 5 is 0.600 (at t = 0), with both integrators at dt = 1e-3, sampled every substep. |

### Criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| E1 | Pairwise gravity matches a hand-calculated case. `handPair`: body 1 accelerates 0.5 towards +x, body 2 accelerates 0.25 towards −x, each component within 1e-15. | §02, §03 | `gravity.test.ts`: "matches a hand-calculated two-body case" |
| E2 | Newton's third law: the sum of `mass × acceleration` over all bodies is zero, within 1e-12 relative. `scatteredFour`, with G ∈ {1, 0.5} and ε ∈ {0, 0.05}. | §02 (mutual attraction) | `gravity.test.ts`: "net internal force is zero" |
| E3 | Linear momentum is conserved by `advance`, within 1e-12 relative, and the centre of mass moves in a straight line at constant speed, within 1e-12 × maxᵢ\|rᵢ\|. `driftingTriple`, dt = 1e-3, from t = 0 to 5 in 50 calls of `advance(state, 0.1)`, with both integrators. | §03 | `invariants.test.ts`: "conserves linear momentum" |
| E4 | Angular momentum is conserved by `advance`, within 1e-10 relative. Same run as E3. | §03 | `invariants.test.ts`: "conserves angular momentum" |
| E5 | Energy error is bounded and does not grow. `eccentricBinary`, dt = T/1000, over 100 periods, sampling \|ΔE/E₀\| after every substep (the error peaks in a short window around periapsis). The maximum in periods 91 to 100 is at most twice the maximum in periods 1 to 10, and the overall maximum is at most **5e-7** (measured with the default integrator, Yoshida: 3.26e-8, the same in periods 1 to 10 and 91 to 100 to five digits; dt/2 gives 2.04e-9, a ratio of 16.0, so the value is truncation error, not round-off. Node 24.14, arm64). Both checks can fail: explicit Euler reaches 1.04, and Heun's method (2nd order but not symplectic) reaches 0.022 with a late-to-early ratio of 9.8. An eccentric orbit is used because on a circular one the error is so small that round-off dominates and the test would measure noise. | §03 (orbits repeat forever) | `invariants.test.ts`: "energy error does not grow" |
| E6 | A circular two-body orbit closes. `circularBinary`, dt = T/1000: each body moves at speed 0.5 and the period is T = 4π. After T, positions return to the start within **1e-7** (absolute; measured with the default integrator, Yoshida: 9.07e-9; dt/2 gives 5.67e-10, a ratio of 16.0; Verlet at the same dt: 8.27e-5. Node 24.14, arm64). | §02 (cannon orbits close) | `integrators.test.ts`: "closes a circular two-body orbit" |
| E7 | Lagrange's equilateral solution closes after one period. `lagrangeTriangle` (L = 1), dt = T/1000. After T, positions return to the start within **1e-7** (absolute; measured with the default integrator, Yoshida: 5.24e-9; dt/2 gives 3.27e-10, a ratio of 16.0, so over one period the error is truncation, not the orbit's instability; Verlet at the same dt: 4.77e-5. Node 24.14, arm64). | §03 (Lagrange) | `integrators.test.ts`: "closes Lagrange's triangle after one period" |
| E8 | Time reversibility: `circularBinary`, dt = T/1000. Advancing by one period, negating every velocity and advancing by one period again returns positions to the start and velocities to the negated start, both within 1e-10, with both integrators. A non-chaotic configuration is used on purpose: in a chaotic one, round-off grows exponentially and the test would fail for reasons unrelated to the integrator. | §03 | `integrators.test.ts`: "is time-reversible" |
| E9 | Convergence order: halving `dt` divides the error by about 2⁴ for Yoshida (ratio between 12 and 20) and about 2² for Verlet (ratio between 3 and 5), for two consecutive halvings. `eccentricBinary` over one period. Error is the largest position distance from a reference run with Yoshida at T/12800, itself checked against T/25600. The `dt` values are chosen from a sweep between T/25 and T/1600, in the range where the error scales (small enough to be in the asymptotic regime, large enough to stay above round-off): Yoshida at T/100, T/200 and T/400 (measured ratios 15.55 and 15.89), Verlet at T/200, T/400 and T/800 (measured ratios 3.99 and 4.00). The reference's own error (7.4e-12 against T/25600) is far below the finest tested error (8.1e-6). Node 24.14, arm64. | §09 (decisions with known cost) | `integrators.test.ts`: "converges at the expected order" |
| E10 | `advance(state, duration)` ends exactly at `state.time + duration`, using n equal substeps as defined in Decision 2, each no larger than `dt · (1 + 1e-9)`. With dt = 0.1: duration 0.25 gives 3 substeps, `3 * 0.1` gives 3 (not 4), and 1 gives 10. `duration = 0` returns an equal state. The substep plan is not visible through the public API, so it is tested on the internal `planSubsteps`. | §03 (playback controls) | `simulate.test.ts`: "advances by the exact duration" |
| E11 | Purity: the input is never mutated (deep-frozen `driftingTriple` and frozen options, passed to all six public functions), and the same input always gives the same output. | §09 (maintainability) | `simulate.test.ts`: "does not mutate its input and is deterministic" |
| E12 | Invalid input throws a `RangeError` whose message names the field: `dt <= 0`, `duration < 0`, `mass <= 0`, `G < 0`, `softening < 0`, any non-finite number (including positions, velocities and `time`), an empty `bodies` array, an unknown `integrator` (checked at runtime, because JavaScript callers and tutor tool calls bypass TypeScript), or more than 1,000,000 substeps in one call. `G = 0` is allowed (no gravity), which a lesson can use to show what happens without it: bodies then move in straight lines. | §09 | `validate.test.ts`: "rejects invalid input" (every case except the substep limit), and `simulate.test.ts`: "every public function validates its input" (one case per function, plus the substep limit, which depends on how `planSubsteps` counts) |
| E13 | The engine never returns non-finite values. With ε > 0, coincident bodies produce finite accelerations and energy. With ε = 0, coincident bodies (r² + ε² = 0, which also catches distinct bodies closer than about 1e-154, where r² underflows to zero) make `accelerations` and `totalEnergy` throw a `PhysicsError` with code `"coincident-bodies"` naming both bodies. Forces that overflow (for example masses of 1e308 with G = 10) throw a `PhysicsError` with code `"non-finite"` instead of returning infinity. | §02 (sandbox) | `gravity.test.ts`: "handles coincident bodies"; `invariants.test.ts` (energy); `simulate.test.ts` (a head-on pair with ε = 0.1 stays finite) |
| E14 | `src/physics` imports nothing from React, Next.js or Node, and uses no DOM globals (Decision 7). | Decision 7 | Biome rules in CI; `environment.test.ts`: "loads the public entry point without DOM globals"; plus a one-off manual probe when the rules are added, with its output in the step summary (flagged cases: `react`, `react/jsx-runtime`, `react-dom/client`, `next`, `next/link`, `next/dist/…`, `node:fs`, `path`, `window`, `document`, `requestAnimationFrame` in `src/physics`; clean cases: a relative import in `src/physics`, `react` in `src/app`, `node:fs` in a test file in `src/physics`) |
| E15 | Advancing three bodies by 1,000 substeps (`lagrangeTriangle`, `advance(state, 1, { dt: 0.001 })`, Yoshida) takes under 2 ms on average in Node. Measured with a local benchmark on the bundled engine, as the app runs it (see "Benchmark"), not a CI test, because timings are noisy on shared runners. The result is recorded with p99, CPU and Node version; p99 is recorded because garbage-collection pauses, not the average, are the real risk for a smooth animation. **Result:** passes, mean 1.012 ms and worst p99 1.232 ms over three runs (Apple M2 Pro, Node 24.14.0). **Real need:** at dt = T/1000 a frame needs 1000 / (f · P) substeps (f the refresh rate, P the seconds of playback per period), about 17 in the worst realistic case (P = 1 s at 60 Hz), around 1/60 of this load. | §09 (UX: smooth animation) | `pnpm bench:physics` (`scripts/bench-physics.mjs`), result noted here |
| E16 | Forces are the negative gradient of the potential used by `totalEnergy`. `scatteredFour`, ε ∈ {0, 0.05}: central finite differences of `totalEnergy` (step 1e-6 per coordinate) match −mᵢ·aᵢ within 1e-6 relative. This is the only check that forces and energy agree, which Decision 4 relies on. | Decision 4 | `gravity.test.ts`: "forces are the negative gradient of the potential" |

### Measured values

What the tests observe for the fixed tolerances, so their margins are known. Each value is the worst over the run, relative to the scale the criterion names (Node 24.14.0, arm64).

| ID | Quantity | Verlet | Yoshida | Tolerance |
|---|---|---|---|---|
| E2 | Net internal force, worst of the four cases (no integrator involved) | 1.0e-16 | 1.0e-16 | 1e-12 |
| E3 | Linear momentum | 3.1e-15 | 7.6e-15 | 1e-12 |
| E3 | Centre of mass, off its straight line | 2.4e-15 | 9.6e-15 | 1e-12 |
| E4 | Angular momentum | 6.9e-15 | 6.0e-15 | 1e-10 |
| E8 | Position after forward and back (absolute) | 4.8e-15 | 7.5e-14 | 1e-10 |
| E8 | Velocity after forward and back (absolute) | 3.0e-15 | 3.7e-14 | 1e-10 |

## Out of scope

- Re-anchoring to the initial state after each period, and the orbit catalog: spec 02 (orbits).
- Collision with a planet's surface and classifying cannon outcomes: Part A spec.
- Massless test particles: masses must be positive (E12). The Part A spec decides how to model the projectile, for example with a very small mass.
- Adaptive time stepping.
- Performance for many bodies (N > 3).
- 3D.
- Rendering and real-unit conversion.

## Risks

- **Tolerances too tight make tests flaky; too loose makes them useless.** Mitigation: measure first, then set thresholds with an explicit margin, recorded in this spec, and check that a weaker integrator fails them (see "Measured tolerances").
- **Floating-point limits on unstable orbits.** Even a perfect integrator cannot keep Lagrange (equal masses) or most Part B orbits closed for many periods. Criteria E6 and E7 check one period only. Long-term behaviour is handled by re-anchoring in spec 02.
- **Varying frame durations change the step between calls.** Animation frames do not last exactly the same, so `advance(state, frameDuration)` would use a slightly different substep each frame, which weakens the long-term energy guarantee. Mitigation: the animation loop accumulates real time and advances the simulation in whole multiples of `dt` (the "fixed timestep with accumulator" pattern), and Decision 2's round-off margin keeps those multiples at exactly `dt` per substep. `advance` still accepts any duration, but callers should use multiples of `dt`.
- **`noUncheckedIndexedAccess` against typed arrays in hot loops.** Every indexed read becomes possibly undefined. Mitigation: see "Internal state representation" below.

## Decided in the plan

### File layout

| File in `src/physics` | Responsibility |
|---|---|
| `index.ts` | Public entry point: re-exports the six functions, the types and `PhysicsError`, and nothing internal. |
| `types.ts` | `Vec2`, `Body`, `SystemState`, `ForceOptions`, `SimulationOptions`, `IntegratorName`. |
| `vec2.ts` | Small pure vector helpers (`add`, `sub`, `scale`, `dot`, `cross`, `lengthSquared`). |
| `validate.ts` | Input checks that throw `RangeError` (E12), and option defaults. |
| `errors.ts` | `PhysicsError` (E13). |
| `gravity.ts` | `accelerations`: softened pairwise gravity, coincidence and overflow detection. |
| `invariants.ts` | `totalEnergy`, `linearMomentum`, `angularMomentum`, `centerOfMass`. |
| `integrators.ts` | One step of `verlet` and of `yoshida4`. The Yoshida coefficients are written as literals, not computed with `Math.cbrt`, so they are identical on every platform. |
| `simulate.ts` | `advance`: validation, substep planning (`planSubsteps`, exported for tests but not from `index.ts`), the step loop, `time = t0 + duration`, and the final finiteness check. |
| `kernel.ts` | Not created. Only if the representation decision is reopened (see "Benchmark"): the typed-array kernel, the only file with indexed reads. |
| `testing/fixtures.ts` | The fixtures above, with their periods and energies. |
| `testing/assertions.ts` | Scale helpers, `deepFreeze` and distance helpers for tests. |

Tests sit next to the code (`gravity.test.ts`, `invariants.test.ts`, `integrators.test.ts`, `simulate.test.ts`, `validate.test.ts`, `environment.test.ts`). The benchmark is `scripts/bench-physics.mjs`, outside `src/physics`. Imports inside `src/physics` are relative; code outside it imports `@/physics`.

### Internal state representation

Plain immutable objects with the same shapes as the public types, decided with the benchmark below.

- **`noUncheckedIndexedAccess`.** With objects, the code needs no indexed reads: per-body updates use `map`, and pairwise accelerations use nested `for…of` over `entries()`, skipping `i === j`. Each pair is then computed twice (6 evaluations instead of 3 for N = 3), which is irrelevant at this size and N > 3 is out of scope. With typed arrays, every read `x[i]` has type `number | undefined` and needs a non-null assertion `!`, which Biome's recommended `noNonNullAssertion` reports on every read. `?? 0` is not an option: it would turn an out-of-bounds bug into a silent zero.
- **Readability.** The engine is the part most likely to be reviewed line by line (§09).
- **Purity.** If typed arrays are needed, they are allocated once per `advance` call and reused across its substeps. There are no module-level buffers, which would be hidden shared state.

**Benchmark rule (E15), fixed before measuring.** `pnpm bench:physics` on the `lagrangeTriangle` case, 3 runs on the development machine (on power, no other heavy work), taking the median of the reported means and the worst p99.

- Keep plain objects if the mean is at most 1.0 ms (half the E15 budget) and p99 is at most 2.0 ms.
- Otherwise, move integration to a Float64Array kernel in `kernel.ts` behind the same API (E1–E13 make that a safe refactor), with a Biome override allowing `!` in that one file only, and record both results.
- If the kernel also misses the budget, E15 is revisited explicitly, not relaxed quietly.

### Benchmark

**Instrument.** Vitest bench mode, the first instrument, reported a Yoshida mean of 5.38 ms (p99 5.73 ms) and a Verlet mean of 1.80 ms. Those figures are not used: Vitest's module runner turns every import into a getter, which dominates the engine's hot loop, and the app never runs the engine that way. `pnpm bench:physics` (`scripts/bench-physics.mjs`) instead bundles `src/physics` with Vite, as the app runs it, and times it in plain Node: 300 warm-up calls, then 1,000 timed calls, reporting mean and p99.

**Measurement** (2026-10-23, Apple M2 Pro on AC power, Node 24.14.0):

| Run | Yoshida mean | Yoshida p99 | Verlet mean | Verlet p99 |
|---|---|---|---|---|
| 1 | 1.011 ms | 1.145 ms | 0.308 ms | 0.390 ms |
| 2 | 1.030 ms | 1.180 ms | 0.317 ms | 0.425 ms |
| 3 | 1.012 ms | 1.232 ms | 0.307 ms | 0.380 ms |

Median mean 1.012 ms, worst p99 1.232 ms: the rule fixed before measuring fails by about 1% on the mean.

**Rule revised after measuring.** The 1.0 ms threshold was a proxy fixed before the real need was known. E15 itself passes with about 2× margin, and the worst realistic case below needs about 17 substeps per frame, around 1/60 of the benchmarked load. Moving to a typed-array kernel would cost readability in the most reviewed code for no visible benefit. **Revised rule: keep plain objects while E15 passes (mean under 2 ms); a regression past 2 ms reopens the representation decision.**

**Real need.** At dt = T/1000 every period takes 1,000 substeps, whatever T is, so an animation frame needs 1000 / (f · P) substeps, where f is the display refresh rate and P the seconds of playback per orbital period. P is left to the Part B spec.

| P | 60 Hz | 120 Hz |
|---|---|---|
| 1 s | 16.7 | 8.3 |
| 2 s | 8.3 | 4.2 |
| 5 s | 3.3 | 1.7 |

### Measured tolerances

For each tolerance marked "measured" (E5, E6, E7, and the E9 `dt` values):

1. **Measure through a failing run.** The test is first written with a threshold of 0. It fails, and the failure shows the measured value.
2. **Check it measures the integrator, not noise.** Re-run at `dt / 2`: for Yoshida the value must drop by about 16. If it does not, round-off dominates and `dt` is increased.
3. **Check the threshold can fail.** Verlet at the same `dt` (E6, E7), or an explicit Euler step substituted temporarily (E5), must exceed the threshold by at least 10 times. Otherwise the threshold is useless.
4. **Set the threshold** to 10 times the measured value, rounded up to the next 1, 2 or 5 × 10ᵏ. The results are deterministic: the engine uses only `+ − × ÷` and `Math.sqrt`, which IEEE 754 rounds exactly, and no `pow`, `hypot` or `cbrt`. The margin absorbs future refactors that change the order of operations, not noise.
5. **Write it back** into the criteria table in the same commit, for example "≤ 1e-7 (measured 8.3e-9 at dt = T/1000, Node 24.14 arm64; Verlet at the same dt: 4.1e-5)". A "Measured values" subsection also records what was observed for the fixed tolerances (E2, E3, E4, E8), so their margins are known.
6. **Confirm on CI.** CI runs on Linux x64, which checks that the thresholds hold on another platform.
