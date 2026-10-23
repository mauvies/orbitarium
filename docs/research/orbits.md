# Initial conditions of the six orbits

How the initial conditions of the Part B orbits were found and validated. The catalog (`src/orbits/catalog.ts`, spec 02) holds the values the app uses; they are copied from the table below and checked against it by hand when written.

## Convention

G = 1 and all masses are 1. Except for Lagrange, every orbit uses the convention of Šuvakov and Dmitrašinović (2013): a collinear start with one body in the middle and zero angular momentum.

- Positions: r₁ = (−1, 0), r₂ = (1, 0), r₃ = (0, 0).
- Velocities: v₁ = v₂ = (p₁, p₂), v₃ = (−2p₁, −2p₂).

Each orbit is then defined by three numbers: p₁, p₂ and its period T.

## Sources

1. **Šuvakov and Dmitrašinović, "Three Classes of Newtonian Three-Body Planar Periodic Orbits", Phys. Rev. Lett. 110, 114301 (2013), Table I.** The original source for butterfly I, moth I, goggles and yin-yang I. Values are given to 5 decimals.
2. **Li and Liao, "More than six hundred new families of Newtonian periodic planar collisionless three-body orbits", Sci. China Phys. Mech. Astron. 60, 129511 (2017), supplementary Tables S III and S VII.** The same orbits to 10 decimals, with positions slightly off (−1, 0), so they need rescaling to be compared. Used as an independent cross-check. These tables do not include yin-yang I.
3. **Chenciner and Montgomery, Annals of Mathematics 152 (2000), with C. Simó's initial conditions.** The figure-eight, used as a cross-check of its period.

   The figure-eight's starting values in this convention (p₁ = 0.347111, p₂ = 0.532728) are not a cited value. They were taken from memory of Šuvakov's online gallery, which could not be fetched. What validates them is the rest of the method: the refinement closes the orbit to about 1e-12, and the refined period matches two independent sources, Li and Liao's (rescaled, to 1e-9) and Simó's.
4. **Lagrange (1772).** The equilateral solution has an exact analytic form and needs no table (spec 01, `lagrangeTriangle`).

## Method

1. **Check the published values.** Integrating the 5-decimal values from source 1 for one period with a high-accuracy reference integrator (SciPy DOP853, relative and absolute tolerance 1e-13) leaves the state 1e-3 to 4e-3 away from where it started. That is enough to see a jump if the animation resets every period, so the published precision is not enough.
2. **Refine them.** Newton shooting on (p₁, p₂, T): find the values for which the state after one period equals the initial state, starting from the published values and keeping the convention above. It converged in 2 or 3 iterations for every orbit, to a closure residual of 1e-10 or better.
3. **Cross-check independently.** Li and Liao's values, rescaled so that r₁ is at distance 1 (positions scale by α, periods by α^(3/2)), give the same periods as the refined values to 1e-9 for the four orbits they list. The refined figure-eight period also matches Simó's (6.32591398).
4. **Verify with the project's own engine.** Spec 02 tests that each orbit closes after one period with the engine in `src/physics`.

## Result

| Orbit | p₁ | p₂ | T | Closest approach | Stability (from a 1e-9 perturbation) |
|---|---|---|---|---|---|
| Lagrange | analytic (spec 01) | | 2π/√3 ≈ 3.627599 | 1 (side of the triangle) | Unstable: about ×100 per period |
| Figure-eight | 0.347116888118 | 0.532724945388 | 6.325913982923 | | Stable: grows slowly and linearly |
| Butterfly I | 0.306893420453 | 0.125506567018 | 6.234674838629 | 0.011 | Stable: grows slowly and linearly |
| Goggles | 0.083300071859 | 0.127889255504 | 10.464849525803 | 0.019 | Unstable: about ×20 per period |
| Moth I | 0.464445172818 | 0.396060014653 | 14.894305175019 | 0.079 | Stable: grows slowly and linearly |
| Yin-yang I (a) | 0.513938537458 | 0.304735919347 | 17.328834018431 | 0.013 | Stable: grows slowly and linearly |

Notes:

- **The refined periods differ from the printed periods of source 1 in the fourth decimal** (for example, goggles: 10.4648 refined, 10.4668 printed), while p₁ and p₂ round to the printed values. The refined periods are the ones confirmed independently by source 2.
- **Yin-yang I has two variants in source 1, (a) and (b),** with different periods. The catalog uses (a). Variant (b) refines to p₁ = 0.282702090435, p₂ = 0.327208971523, T = 10.963303088108.
- **Stability** was measured by perturbing one velocity by 1e-9 and integrating ten periods with the reference integrator. Unstable orbits drift away from their path within a few periods however accurate the integration, which is why the animation resets them every period (spec 02).
- **"Stable" means linearly stable:** a 1e-9 perturbation grows linearly. At the step counts the catalog uses, each period's truncation error is much larger (about 6e-5 for butterfly I and 7e-6 for yin-yang I). That error takes these two orbits out of the linear regime, and without the reset their drift grows about ×1.9 per period (spec 02, Decision 4).

## What this means for the engine

Butterfly I, goggles and yin-yang I bring two bodies within about 0.01 of each other. A fixed step must resolve those encounters, so it has to be far smaller than the T/1000 used to test spec 01. Measured with fixed-step Yoshida, the distance from the start after one period is:

| Steps per period | Butterfly I | Moth I | Goggles | Figure-eight |
|---|---|---|---|---|
| 1,000 | orbit destroyed | orbit destroyed | orbit destroyed | 4e-7 |
| 10,000 | orbit destroyed | 1e-3 | orbit destroyed | 7e-10 |
| 100,000 | 1e-4 | 1e-7 | 1e-4 | 7e-10 |
| 1,000,000 | 1e-8 | 8e-9 | 2e-8 | 7e-10 |

The number of steps per period is therefore a property of each orbit, chosen in spec 02.
