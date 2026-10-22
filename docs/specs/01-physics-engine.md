# Spec 01: Physics engine

Status: draft for review (2026-10-22). Committed before any engine code.

## Goal

A pure TypeScript module that advances a system of point masses under Newtonian gravity. It must be accurate enough that the periodic three-body orbits of Part B close after one period, and that the cannon trajectories of Part A close instead of spiralling. Both parts share it, and it runs in the browser (animation) and in Node (tests and build-time thumbnails).

## Why it exists (from the brief)

- **§03 Part B:** "detail view with the animated simulation of the three bodies". Three bodies have no closed-form solution, so positions must be computed by numerical integration, step by step.
- **§02 Part A:** an interactive element the user manipulates. Per the Part A design note, this is Newton's cannon: a two-body problem.
- **§09 Criteria:** decisions with a known cost, clear code and solid typing. The engine is the part most likely to be reviewed line by line.

## Decisions

Full rationale and costs will go in the README.

1. **Integrator: 4th-order Yoshida, built from velocity Verlet.** Both are symplectic: their energy error oscillates but does not grow, which is what orbits that repeat forever need. Verlet is also exported, as the baseline for tests.
2. **Fixed time step.** The caller passes a maximum step `dt`. `advance(state, duration)` splits `duration` into `n = ceil(duration / dt)` equal substeps, so the step stays uniform and the simulated time matches `duration` exactly. Cost: steps are wasted in calm phases. With three bodies this is negligible, and adaptive stepping would break the symplectic property.
3. **Dimensionless units, with `G` as a parameter (default 1).** The Part B catalog uses G = 1 and unit masses. Converting to km and km/s for Part A is the UI's job, not the engine's.
4. **Optional softening `ε`, default 0.** Part B uses exact physics. A sandbox can pass ε > 0 so that close encounters do not blow up. With ε > 0, `totalEnergy` uses the softened potential, so energy stays consistent with the forces.
5. **Pure public API.** Functions return a new state and never mutate their input. The internal representation (plain objects or reused typed arrays) is decided in the plan, by measurement. The public API does not change either way.
6. **2D only.** All six Part B orbits and the cannon are planar.
7. **No dependency on React, Next.js or the DOM.** Enforced mechanically: a lint rule forbids those imports in `src/physics`, and the engine tests run in Vitest's `node` environment, where `window` does not exist.

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

type SimulationOptions = {
  readonly dt: number;                      // maximum substep
  readonly G?: number;                      // default 1
  readonly softening?: number;              // default 0
  readonly integrator?: "yoshida4" | "verlet"; // default "yoshida4"
};

accelerations(state, options): readonly Vec2[]
advance(state, duration, options): SystemState
totalEnergy(state, options): number
linearMomentum(state): Vec2
angularMomentum(state): number
centerOfMass(state): Vec2
```

## Acceptance criteria

Tolerances marked "measured" are fixed during the build step by running the test, choosing a threshold with a safety margin and writing the value back into this table in the same commit.

"Relative" tolerances for conserved quantities are measured against a scale of the system, not against the quantity itself, because a conserved quantity can be zero (for example, total momentum in the centre-of-mass frame). The scale is Σ\|mᵢ·aᵢ\| for forces, Σ\|mᵢ·vᵢ\| for linear momentum and Σ\|rᵢ × mᵢ·vᵢ\| for angular momentum.

| ID | Criterion | Source | Verification |
|---|---|---|---|
| E1 | Pairwise gravity matches a hand-calculated case. Masses 1 at (0, 0) and 2 at (2, 0), G = 1: body 1 accelerates 0.5 towards +x, body 2 accelerates 0.25 towards −x. | §02, §03 | `gravity.test.ts`: "matches a hand-calculated two-body case" |
| E2 | Newton's third law: the sum of `mass × acceleration` over all bodies is zero, within 1e-12 relative, for an arbitrary configuration. | §02 (mutual attraction) | `gravity.test.ts`: "net internal force is zero" |
| E3 | Linear momentum is conserved by `advance`, within 1e-12 relative, and the centre of mass moves in a straight line at constant speed. | §03 | `invariants.test.ts`: "conserves linear momentum" |
| E4 | Angular momentum is conserved by `advance`, within 1e-10 relative. | §03 | `invariants.test.ts`: "conserves angular momentum" |
| E5 | Energy error is bounded and does not grow. Eccentric two-body orbit (e = 0.5): masses of 1 starting at (±1, 0) at apoapsis, each moving at √0.5 / 2 ≈ 0.3536 in opposite directions along y, G = 1, period T = 2π·√(32/27) ≈ 6.840. Over 100 periods, the maximum \|ΔE/E₀\| in periods 91 to 100 is at most twice the maximum in periods 1 to 10, and below a measured absolute threshold. An eccentric orbit is used because on a circular one the error is so small that round-off dominates and the test would measure noise. | §03 (orbits repeat forever) | `invariants.test.ts`: "energy error does not grow" |
| E6 | A circular two-body orbit closes. Two masses of 1 at distance 2, G = 1: each moves at speed 0.5 and the period is T = 4π. After T, positions return to the start within a measured tolerance. | §02 (cannon orbits close) | `integrators.test.ts`: "closes a circular two-body orbit" |
| E7 | Lagrange's equilateral solution closes after one period. Three masses of 1 on an equilateral triangle of side L, G = 1: speed 1/√L, period T = 2π·L^(3/2)/√3. After T, positions return to the start within a measured tolerance. | §03 (Lagrange) | `integrators.test.ts`: "closes Lagrange's triangle after one period" |
| E8 | Time reversibility: on the E6 configuration, advancing by one period, negating every velocity and advancing by one period again returns to the initial positions within 1e-10. A non-chaotic configuration is used on purpose: in a chaotic one, round-off grows exponentially and the test would fail for reasons unrelated to the integrator. | §03 | `integrators.test.ts`: "is time-reversible" |
| E9 | Convergence order: halving `dt` divides the error by about 2⁴ for Yoshida (ratio between 12 and 20) and about 2² for Verlet (ratio between 3 and 5). Error is measured against a reference run with a much smaller step, and `dt` values are chosen in the range where the error scales (small enough to be in the asymptotic regime, large enough to stay above round-off). | §09 (decisions with known cost) | `integrators.test.ts`: "converges at the expected order" |
| E10 | `advance(state, duration)` ends exactly at `state.time + duration`, using equal substeps no larger than `dt`. `duration = 0` returns an equal state. | §03 (playback controls) | `simulate.test.ts`: "advances by the exact duration" |
| E11 | Purity: the input state is never mutated (deep-frozen fixture), and the same input always gives the same output. | §09 (maintainability) | `simulate.test.ts`: "does not mutate its input and is deterministic" |
| E12 | Invalid input throws a `RangeError` with a clear message: `dt <= 0`, `duration < 0`, `mass <= 0`, `G < 0`, `softening < 0`, or any non-finite number. `G = 0` is allowed (no gravity), which a lesson can use to show what happens without it. | §09 | `simulate.test.ts`: "rejects invalid input" |
| E13 | The engine never returns non-finite values. With ε > 0, coincident bodies produce finite accelerations. With ε = 0, coincident bodies throw a descriptive error. | §02 (sandbox) | `gravity.test.ts`: "handles coincident bodies" |
| E14 | `src/physics` imports nothing from React, Next.js or the DOM. | Decision 7 | Lint rule in CI, plus all engine tests running in the `node` environment |
| E15 | Advancing three bodies by 1,000 substeps takes under 2 ms in Node. Measured with a local benchmark script, not a CI test (timings are noisy on shared runners). Result recorded in this spec. | §09 (UX: smooth animation) | `pnpm bench:physics`, result noted here |

## Out of scope

- Re-anchoring to the initial state after each period, and the orbit catalog: spec 02 (orbits).
- Collision with a planet's surface and classifying cannon outcomes: Part A spec.
- Adaptive time stepping.
- Performance for many bodies (N > 3).
- 3D.
- Rendering and real-unit conversion.

## Risks

- **Tolerances too tight make tests flaky; too loose makes them useless.** Mitigation: measure first, then set thresholds with an explicit margin, recorded in this spec.
- **Floating-point limits on unstable orbits.** Even a perfect integrator cannot keep Lagrange (equal masses) or most Part B orbits closed for many periods. Criteria E6 and E7 check one period only. Long-term behaviour is handled by re-anchoring in spec 02.
- **Varying frame durations change the step between calls.** Animation frames do not last exactly the same, so `advance(state, frameDuration)` would use a slightly different substep each frame, which weakens the long-term energy guarantee. Mitigation: the animation loop accumulates real time and advances the simulation in whole multiples of `dt` (the "fixed timestep with accumulator" pattern). `advance` still accepts any duration, but callers should use multiples of `dt`.
- **`noUncheckedIndexedAccess` against typed arrays in hot loops.** Every indexed read becomes possibly undefined. Mitigation: decide the representation in the plan, and if typed arrays win, keep their access inside one small file.

## Decided in the plan, not here

- Internal state representation (objects or typed arrays), backed by the E15 benchmark.
- Exact values of the "measured" tolerances.
- File layout inside `src/physics`.
