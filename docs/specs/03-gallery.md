# Spec 03: Orbit gallery (Part B)

Status: implemented (2026-10-24). Approved on 2026-10-23 and amended after the implementation plan review, before any gallery code.

## Goal

The Part B user interface: a home page, a gallery of the six orbits and a detail page per orbit with the animated simulation and its controls. It also lays the shared foundations the Part A lesson will reuse: the visual style, the page layout, the UI strings and the pieces of a canvas that animates bodies.

## Why it exists (from the brief)

- **§03 Part B:** a gallery view; a detail view with the animated simulation of the three bodies and playback controls; each solution with its own shareable URL.
- **§04 Whole app:** returning from a detail page to the gallery keeps the state of the interface (not required after a reload); responsive on mobile and desktop; basic accessibility (keyboard, visible focus, contrast).
- **§09 Criteria:** clear layout on mobile and desktop, visual appeal and user experience.

Builds on spec 02 (`@/orbits`: catalog, playback, `tracePeriod`) and on `docs/design/visual-style.md`.

## Decisions

1. **Routes.** `/` (home), `/three-body`, `/three-body/[slug]` and a placeholder `/gravitation` until the Part A spec replaces it. The sections are named after what they cover: the header says "Gravitación" and "Tres cuerpos", and the pages are titled "La ley de gravitación universal" and "El problema de los tres cuerpos". "Galería" is no longer a section name, though page text may still call the six solutions a gallery. Detail pages are generated at build time with `generateStaticParams` and `dynamicParams = false`, each with its own title and description metadata. An unknown slug, like any unknown URL, returns a Spanish 404 page (Next.js's default one is in English).
2. **Spanish UI with centralised strings.** Every user-facing string lives in one typed module (`src/content/es.ts`), not in components, and the document has `lang="es"`. Numbers use Spanish formatting ("17,33", "0,5×"). No i18n library or locale routing: adding English means a second strings module plus routing, which is listed as a limitation. URL tokens (routes, slugs, the filter parameter) are identifiers in English, so they survive that change.
3. **Visual style as design tokens.** Colours and fonts from `docs/design/visual-style.md` are defined once in the Tailwind theme and loaded with `next/font`. Dark theme only. No component hardcodes a colour. Tailwind's default palette is removed (`--color-*: initial`), and every colour token is emitted as a CSS variable (`@theme static`), so the canvas reads the same tokens. Because Tailwind prefixes text colours with `text-`, the design note's names map as follows: `text-strong` → `--color-strong`, `text` → `--color-body`, `text-muted` → `--color-muted`; `surface`, `accent`, `bg-top` and `bg-bottom` keep their names.
4. **Orbit paths are computed at build time.** Tracing a period costs up to 0.6 s (yin-yang I, spec 02), so pages receive the path as static data instead of computing it in the browser. Time-uniform samples are sparse exactly where the bodies are fastest, at the close encounters: with 1,000 samples per period the polyline is up to 5.5 px off the true path on a 640 px canvas (see "Measured during planning"). Each path is therefore traced at `min(stepsPerPeriod, 10,000)` points (a divisor of every ladder value, at most 0.4 px off) and simplified to 0.25 px at the size it is drawn, which leaves 120 to 430 points per body. The gallery thumbnails are static SVG drawn from the same data, so they render without JavaScript.
5. **Canvas 2D for the animation, outside React state.** The simulation lives in a ref and a `requestAnimationFrame` loop advances it and draws it. React only renders the controls; a control change reaches the loop through one call, not through a render per frame. The canvas follows its container's width, up to 640 CSS px, and the device pixel ratio. Its aspect ratio comes from the orbit's path bounds, clamped between 1:1 and 2:1 (width : height), so flat orbits like butterfly I fill the space and none is drawn taller than it is wide. The loop draws on demand: while paused it does not run. Part A will reuse the world-to-canvas transform, the trail, the drawing functions, the loop and the sizing as plain functions; the orbit player itself is not generalised until the Part A spec says what the cannon needs.
6. **What is drawn.**
   - **Path:** the orbit's path, faint.
   - **Trail:** a short fading trail behind each body (the last 10 % of a period, tuned in visual review), bright. It is sampled every T/5,000 of simulation time (every substep when that is shorter) from positions the simulation actually passes through, not once per frame. One point per frame would cut the corners of the close encounters by 5 to 40 px depending on the speed, and the trail would leave the faint path at every encounter even with correction on.
   - **Bodies:** the three bodies.

   With correction off, the live trail visibly leaves the faint path, which is how chaos becomes visible. The trail is cleared on restart and when a period boundary snaps drifted bodies back to their path (correction turned back on, spec 02 Decision 5), so it never draws a line across the canvas.
7. **Playback speed.**
   - **At 1×, one second on screen is one unit of simulation time,** so one period takes T seconds. This gives every orbit a fixed number of seconds per period from one rule instead of six tuned values. The bodies' speeds on screen are then comparable across orbits, which share G, the masses and the length scale, and the period the page shows is its duration in seconds at 1×. The speeds are 0.5×, 1×, 2× and 4×.
   - **Frame budget: 2 ms p99 for the simulation per frame on the reference machine** (the bundled code in Node, as spec 02's benchmark). The budget is a choice, not a measurement: it is an eighth of a 60 Hz frame, so a device four times slower still spends under half a frame on the simulation.
   - **`maxSubsteps` per frame is 1,100,** the largest value measured whose p99 stays within the budget. When the cap is reached the orbit plays slower than requested instead of dropping frames. At 60 Hz this happens only to yin-yang I at 4×, which plays at about 2.3×; on a 120 Hz display it fits. This is accepted and stated in the README.
   - Both values are measured with `pnpm bench:playback` at every speed on every orbit (G10).
8. **Gallery filter in the URL.** "Todas", "Se mantienen solas" and "Se deshacen sin corrección", stored as a query parameter (`/three-body?filter=holds` or `?filter=drifts`; absent means all). An unknown value shows every orbit: a mistyped shared link should not break the gallery. Changing the filter replaces the history entry instead of adding one. Going back from a detail page restores the filter and the scroll position through normal browser navigation, and a filtered gallery can be shared. The detail page's own back link goes to the last gallery URL, filter included.
9. **Honest stability labels.** The labels describe what the simulation shows, not a formal stability result: whether an orbit stays within 0.1 of its path for 30 periods without correction, at its spec 02 steps per period. "Within 0.1 of its path" means the largest distance of any body from where it was at the same phase of the first period, sampled 1,000 times per period. Sampling only at period boundaries, as O6 does, would miss most of the drift: in period 11 butterfly I is 7 times further off mid-period than at the boundary. Each preset records the result as `holdsWithoutCorrection` (see "Change to spec 02"), with a test.
10. **Detail preferences persist while browsing.** Speed, path, trail and correction are kept in the gallery layout, so they survive moving between orbits and back to the gallery. They reset on reload, and when leaving the gallery section.
11. **Motion and accessibility.** All controls are native buttons, toggles and radio groups with Spanish labels and visible focus. The canvas has a text alternative describing the orbit. With `prefers-reduced-motion: reduce`, playback starts paused. The animation pauses while the tab is hidden, and the clock restarts on return, so there is no catch-up; spec 02's cap is only a backstop.
12. **Collisions while drifting.** Without correction the bodies can collide, and the engine throws a `PhysicsError` (spec 02 leaves the recovery to this spec). The animation stops, a polite live region announces it in Spanish, and the restart button starts over. Any other error propagates.
13. **Tests in two layers.**
    - **Unit (Vitest):** pure UI logic (filter parsing, the world-to-canvas transform, speed to simulation time, the frame advance and the trail).
    - **End to end:** pages, navigation, state preservation, keyboard use and accessibility, in Playwright with axe, in Chromium, run in CI against a production build.
    - **Not asserted:** drawing itself is reviewed visually, from screenshots at the three viewports, not through screenshot comparison, which depends on the platform's rendering.

## Content per orbit

Each detail page shows the orbit's name, a two or three sentence description in plain Spanish, who found it and when, its period in simulation units, its stability label and its source, as a Spanish citation in `es.ts`.

The display names are exactly the brief's, untranslated, because they are the names used in the literature: "Lagrange", "Figura de ocho", "Butterfly I", "Goggles", "Moth I", "Yin-Yang I". A description may explain what a name means (for example, that butterfly means mariposa). The catalog's `name` and `source` fields stay developer-facing.

| Orbit | Found by | Notes for the description |
|---|---|---|
| Lagrange | Joseph-Louis Lagrange, 1772 | Three equal masses at the corners of a rotating equilateral triangle. With equal masses the configuration is unstable. |
| Figura de ocho | Cris Moore, 1993 (numerically); proved to exist by Alain Chenciner and Richard Montgomery, 2000 | The three bodies chase each other along one figure-eight curve. |
| Butterfly I, Moth I, Goggles, Yin-Yang I | Milovan Šuvakov and Veljko Dmitrašinović, 2013 | Found in a numerical search of 2013 that discovered 13 new families of periodic orbits. |

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| G1 | The home page links to the gallery and to the lesson. | §01 | E2E: "home links to the gallery and the lesson" |
| G2 | The gallery lists the six orbits in the brief's order, each with its name, its static path thumbnail and its stability label, linking to its detail page. | §03 | E2E: "gallery lists the six orbits"; `orbit-path.test.ts`: the path data starts at the initial positions, stays within tolerance of the dense trace and fits the view box with y up |
| G3 | Every orbit has a detail page at `/three-body/[slug]` that loads directly (a shared link), with its own title, and an unknown slug returns a 404. | §03 (shareable URL) | E2E: "each orbit page loads from its URL"; "an unknown orbit is a 404" |
| G4 | The detail page animates the orbit: the bodies move along the faint path, and with correction on they stay on it indefinitely. | §03 | E2E: "the bodies move" (canvas pixels change over time, on every orbit); spec 02 O5 for staying on the path |
| G5 | Controls work by mouse and keyboard: play and pause, restart, speed (0.5×–4×), show path, show trail, correction on and off. Turning correction off makes Lagrange and goggles leave their path within 10 periods. | §03 (playback controls) | E2E: "controls work with the keyboard"; spec 02 O6 for the drift (Lagrange at period 8, goggles at period 4) |
| G6 | Going back from a detail page to the gallery keeps the filter and the scroll position; detail preferences persist across orbits. | §04 | E2E: "returning to the gallery keeps its state"; "detail preferences persist across orbits and reset on reload" |
| G7 | Each preset records whether it holds within 0.1 of its path for 30 periods without correction (Decision 9), and the gallery filter uses it. | Decision 9 | `src/orbits/stability.test.ts` for figure-eight, moth I, Lagrange and goggles; `pnpm measure:stability` for all six, failing on a mismatch, recorded here. Butterfly I and yin-yang I are left to the script: in Vitest they would add about 3 s and 20 s to the suite. |
| G8 | Accessibility: no axe violations on the home, gallery and every detail page; every control has a label; focus is visible; the canvas has a text alternative; reduced motion starts paused. | §04 | E2E with axe (WCAG 2.1 A and AA) on every page, including `/gravitation` and the 404; "focus is visible on every control"; "the canvas has a text alternative"; "reduced motion starts paused" |
| G9 | Responsive: at 360 px, 768 px and 1280 px wide there is no horizontal scroll, the gallery grid adapts and the detail controls stay usable: inside the viewport, not overlapping, with targets of at least 24 × 24 CSS px (WCAG 2.2, 2.5.8). | §04 | E2E at three viewports: "no horizontal scroll", "the gallery grid has 1, 2 and 3 columns", "detail controls stay inside the viewport with 24 px targets"; screenshots attached to the report for visual review |
| G10 | Frame cost stays within budget: at every speed on every orbit, the p99 cost of a frame stays under 2 ms on the reference machine, through `maxSubsteps`. | Decision 7 | `pnpm bench:playback` with the app's own frame function and settings, recorded here; a one-off run in Chromium with the CPU throttled ×4 |
| G11 | Every user-facing string comes from `src/content/es.ts`, and colours come only from the theme tokens. | Decisions 2 and 3 | `src/theme.test.ts`: no colour literal in `src` outside `globals.css`; Tailwind's default palette removed; Biome `noJsxLiterals` for text in JSX; strings in attributes and metadata by code review |

## Measured during planning

Measured in memory on the bundled code of spec 02 (Apple M2 Pro on AC power, Node 24.14.0, the machine of spec 02's measurements). The committed scripts measure these again in their steps, and their output replaces this section's numbers in "Results".

**Drift without correction (Decision 9).** Planning gave the same table as `pnpm measure:stability`; see "Results".

**Frame cost against substeps per frame (Decision 7).** Yin-yang I with re-anchoring, 300 warm-up and 1,000 timed calls, three runs; each range runs from the lowest to the highest p99.

| Substeps per frame | 250 | 500 | 750 | 1,000 | 1,250 | 1,500 | 2,000 |
|---|---|---|---|---|---|---|---|
| p99 | 0.38–0.45 ms | 0.70–0.76 ms | 1.08–1.10 ms | 1.42–1.44 ms | 1.72–2.13 ms | 2.05–2.15 ms | 2.77–3.05 ms |

With the cap binding on every call (four times the cap requested), the p99 is 1.46–1.49 ms at 1,000 substeps and 1.54–1.59 ms at 1,100.

Substeps per 60 Hz frame at 1× = one unit of simulation time per second (spec 02's substeps per unit of time, divided by 60):

| Orbit | 0.5× | 1× | 2× | 4× |
|---|---|---|---|---|
| Lagrange | 2 | 5 | 9 | 18 |
| Figura de ocho | 1 | 3 | 5 | 11 |
| Butterfly I | 134 | 267 | 535 | 1,069 |
| Goggles | 80 | 159 | 319 | 637 |
| Moth I | 11 | 22 | 45 | 90 |
| Yin-Yang I | 240 | 481 | 962 | 1,924, capped at 1,100 (plays at about 2.3×) |

**Path resolution (Decision 4).** The largest distance between the true path (every substep) and a polyline through time-uniform samples, on a 640 px canvas, and the points per body left after simplifying the true path to 0.25 px.

| Orbit | 1,000 samples | 10,000 samples | Simplified to 0.25 px |
|---|---|---|---|
| Lagrange | 0.0 px | — (1,000 steps per period) | 129 |
| Figura de ocho | 0.0 px | — (1,000 steps per period) | 118–122 |
| Butterfly I | 3.7 px | 0.1 px | 136–198 |
| Goggles | 4.8 px | 0.1 px | 272–422 |
| Moth I | 1.1 px | 0.0 px | 243–352 |
| Yin-Yang I | 5.5 px | 0.4 px | 255–428 |

## Results

### Stability without correction (G7)

Output of `pnpm measure:stability` (`scripts/measure-stability.mjs`, on the bundled code), 2026-10-23, Apple M2 Pro, Node 24.14.0, arm64. Distance as defined in Decision 9: the largest distance of any body from where it was at the same phase of the first period, sampled 1,000 times per period, over 30 periods without re-anchoring. The script fails if a preset's `holdsWithoutCorrection` disagrees, which was checked once by flipping yin-yang I's value. It takes about 14 s.

| Orbit | First period over 0.1 | At period boundaries only | Largest over 30 periods | Label |
|---|---|---|---|---|
| Lagrange | 8 | 8 | — | Se deshace sin corrección |
| Figure-eight | none | none | 7.7e-6 | Se mantiene sola |
| Butterfly I | 11 | 13 | — | Se deshace sin corrección |
| Goggles | 3 | 4 | — | Se deshace sin corrección |
| Moth I | none | none | 3.1e-4 | Se mantiene sola |
| Yin-yang I | 15 | 17 | — | Se deshace sin corrección |

- **The labels do not depend on the metric.** Sampling only at period boundaries gives the same labels, and the two orbits that hold stay 300 times or more inside the tolerance.
- **Spec 02 Decision 4's claim about moth I** ("within 1e-4 for at least 10 periods") holds at period boundaries only: mid-period, moth I reaches 1.5e-4 in period 2.
- **`src/orbits/stability.test.ts` covers figure-eight, moth I, Lagrange and goggles,** in 2.7 s. Butterfly I and yin-yang I are left to the script, because they would add about 3 s and 20 s to the unit suite.

### Frame cost (G10)

**G10 is not fully met: the p99 stays within the 2 ms budget in 23 of 24 rows.** In these measurements, the row over budget is yin-yang I at 2×, with intermittent outliers up to 3.5 ms. GC pauses can affect any row, so another row may show them in another run.

This is accepted:
- The outliers do not depend on the substep count: at 4× yin-yang I does more work per frame (the cap's 1,100 substeps against 962) and stays within budget.
- 10 of the 16 outliers traced coincide with GC pauses; the other 6 have an unknown cause (see below).
- The worst spike, 3.5 ms, is about a fifth of a 60 Hz frame.

The cap stays at 1,100. Lowering it below 962 would slow yin-yang I at 2× without removing the outliers.

Output of `pnpm bench:playback`'s second table (`advanceAnimation` with the app's cap, speeds and trail, correction on, 60 Hz frames, 300 warm-up and 1,000 timed frames, three runs, lowest–highest), 2026-10-23, Apple M2 Pro, Node 24.14.0:

| Orbit | Speed | Substeps per frame | Plays at | Frame mean | Frame p99 | Within budget |
|---|---|---|---|---|---|---|
| Lagrange | 0.5× | 2 | 0.5× | 0.005 ms | 0.013–0.015 ms | yes |
| Lagrange | 1× | 5 | 1.0× | 0.006–0.009 ms | 0.016–0.023 ms | yes |
| Lagrange | 2× | 9 | 2.0× | 0.012–0.013 ms | 0.019–0.028 ms | yes |
| Lagrange | 4× | 18 | 4.0× | 0.023–0.024 ms | 0.039–0.055 ms | yes |
| Figure-eight | 0.5× | 1 | 0.5× | 0.002 ms | 0.006–0.008 ms | yes |
| Figure-eight | 1× | 3 | 1.0× | 0.004 ms | 0.008–0.010 ms | yes |
| Figure-eight | 2× | 5 | 2.0× | 0.007 ms | 0.012–0.018 ms | yes |
| Figure-eight | 4× | 11 | 4.0× | 0.013–0.014 ms | 0.024–0.028 ms | yes |
| Butterfly I | 0.5× | 134 | 0.5× | 0.163–0.164 ms | 0.309–0.338 ms | yes |
| Butterfly I | 1× | 267 | 1.0× | 0.346–0.359 ms | 0.918–1.048 ms | yes |
| Butterfly I | 2× | 535 | 2.0× | 0.639–0.658 ms | 0.922–0.972 ms | yes |
| Butterfly I | 4× | 1069 | 4.0× | 1.263–1.284 ms | 1.597–1.614 ms | yes |
| Goggles | 0.5× | 80 | 0.5× | 0.095–0.100 ms | 0.298–0.331 ms | yes |
| Goggles | 1× | 159 | 1.0× | 0.192–0.195 ms | 0.440–0.453 ms | yes |
| Goggles | 2× | 319 | 2.0× | 0.380–0.397 ms | 0.634–1.047 ms | yes |
| Goggles | 4× | 637 | 4.0× | 0.752–0.762 ms | 1.032–1.052 ms | yes |
| Moth I | 0.5× | 11 | 0.5× | 0.016 ms | 0.024–0.031 ms | yes |
| Moth I | 1× | 22 | 1.0× | 0.029–0.030 ms | 0.041–0.056 ms | yes |
| Moth I | 2× | 45 | 2.0× | 0.055–0.060 ms | 0.184–0.247 ms | yes |
| Moth I | 4× | 90 | 4.0× | 0.108–0.111 ms | 0.286–0.309 ms | yes |
| Yin-yang I | 0.5× | 240 | 0.5× | 0.278–0.280 ms | 0.394–0.404 ms | yes |
| Yin-yang I | 1× | 481 | 1.0× | 0.555–0.558 ms | 0.699–0.718 ms | yes |
| Yin-yang I | 2× | 962 | 2.0× | 1.109–1.146 ms | 1.280–2.256 ms | **no** |
| Yin-yang I | 4× | 1100 | 2.3× | 1.273–1.284 ms | 1.436–1.506 ms | yes |

Yin-yang I at 2× over three invocations of the script: p99 1.280–2.256 ms, 1.341–3.503 ms and 1.309–1.743 ms, with the mean at 1.11–1.27 ms in all of them.

**What the outliers are.** A one-off trace of that row (`node --trace-gc`, with a `PerformanceObserver` on `gc` entries; 10 runs of 1,000 timed frames, three times) found 16 frames over 2 ms.
- 10 of them contain a GC pause of 0.97–2.29 ms (a scavenge, or a mark-compact), enough on its own to push a frame of about 1.2 ms past the budget.
- The other 6 contain no GC pause, or only scavenges of 0.25 ms or less, which do not account for them. Their cause is unknown.
- Scavenges run about every other frame, so a frame that merely overlaps a short one is not evidence of GC.

**In the browser, with the CPU throttled ×4.** A one-off run of yin-yang I at 4× on the production build, in headless Chromium (Playwright 1.64.1) with `Emulation.setCPUThrottlingRate` at 4, recording `requestAnimationFrame` intervals for 15 s, 2026-10-24, Apple M2 Pro:

| CPU | Frames | Median interval | p99 | Longest | Over 25 ms |
|---|---|---|---|---|---|
| Not throttled | 900 | 16.7 ms | 16.8 ms | 16.8 ms | 0 |
| Throttled ×4 | 900 | 16.7 ms | 16.8 ms | 33.3 ms | 1 |

On a device four times slower, the heaviest row still keeps 60 Hz, with one dropped frame in 15 s. Headless Chromium paces frames on its own, without a display, so this checks the budget's headroom, not real-device smoothness.

### End-to-end tests

70 tests, all in Chromium against the production build, 2026-10-24.

| Where | Workers | Build | Install Chromium | `pnpm test:e2e` | Whole CI job |
|---|---|---|---|---|---|
| Local (Apple M2 Pro, 10 cores) | 5 | 6 s | — | 7.0–7.7 s (three runs) | — |
| CI (`ubuntu-latest`, run 40069107871) | 2 | 15 s | 20 s | 28 s | 1 min 34 s |

The plan estimated about 35 tests, 15–25 s locally and 1.5–2 min more on CI. There are twice as many tests (the axe and focus sweeps cover 11 pages each), and they take a third of the estimated time; on CI, E2E adds about 50 s.

### Collisions (Decision 12)

The collision message, the disabled play button and restarting after a collision are not exercised in the browser, because no catalog orbit collides. Lagrange, goggles, butterfly I and yin-yang I each ran for 2 minutes at 4× without correction, 2026-10-24, and their bodies separated instead of meeting. Collision detection itself, a `PhysicsError` turned into `collided`, is covered by `orbit-frame.test.ts`.

## Out of scope

- The Part A lesson, the cannon and the tutor (the `/gravitation` page is a placeholder).
- English UI and locale routing.
- A light theme.
- Searching for new orbits (the brief's optional extra).
- Sound, 3D or zooming and panning the canvas.

## Risks

- **Yin-yang I's frame cost.** Mitigation: the `maxSubsteps` cap (Decision 7), measured against the budget at every speed (G10).
- **The cap is a substep count, not a time.** A device slower than the reference machine spends proportionally longer per frame. The budget leaves room for a device four times slower, which the throttled Chromium run in G10 checks.
- **E2E tests are slower and can be flaky.** Mitigation: run them against a production build, wait on visible state instead of timers, no retries (a flaky test is fixed, not retried), and keep them to the behaviours in this table.
- **Canvas testing is shallow.** E2E can only check that pixels change; whether the drawing looks right is a visual review, recorded with screenshots at the three viewports.
- **Scroll restoration on back navigation** relies on Next.js's client router and the browser. The G6 test checks it; if it fails, the fix is decided then.
- **A shared filtered link shows all six orbits until the page hydrates.** The gallery is static, so the filter can only be read in the browser (`useSearchParams` inside Suspense, with the unfiltered grid as the fallback). A dynamically rendered gallery would trace the paths on every request instead.

## Change to spec 02

- **`OrbitPreset` gains `holdsWithoutCorrection: boolean`:** measured data for Decision 9, verified by `src/orbits/stability.test.ts` and `pnpm measure:stability`.
- **Decision 4's claim about moth I** ("within 1e-4 for at least 10 periods") holds at period boundaries only; see "Results".

## Decided in the plan

### File layout

Code used by one route lives in that route's folder in `src/app/`, with its tests. Code shared by more than one route lives outside every route: components in `src/components/`, everything else in the folder of its domain: `src/physics`, `src/orbits`, or `src/drawing` for turning simulated positions into pictures. The gallery's detail page shares a few files with the gallery page; they sit in the parent segment, `src/app/three-body/`, beside the layout that wraps both.

| File | Responsibility |
|---|---|
| `src/app/layout.tsx`, `globals.css`, `not-found.tsx`, `icon.svg` | The whole app: `lang="es"`, fonts, theme tokens, skip link, site header, `main`; the Spanish 404; the icon |
| `src/app/(home)/page.tsx` | Home (a route group, so its components sit beside it without changing the URL) |
| `src/app/(home)/hero-orbit.tsx`, `cannon-thumbnail.tsx` | The figure-eight hero; Newton's cannon, traced with `@/cannon` at build time (spec 04) |
| `src/app/gravitation/` | The Part A lesson; its files are listed in spec 04 |
| `src/app/three-body/layout.tsx`, `gallery-session.tsx` | What the gallery section remembers while browsing: the last filter, the detail preferences (Decisions 8 and 10) |
| `src/app/three-body/page.tsx` | Static gallery: thumbnails built at build time, the filter in Suspense |
| `src/app/three-body/filter.ts`, `filter-controls.tsx`, `filtered-gallery.tsx` | Parsing, showing and writing the filter in the URL |
| `src/app/three-body/orbit-card.tsx`, `orbit-grid.tsx` | The gallery's cards and grid |
| `src/app/three-body/stability-status.tsx` | The stability label, shared by the gallery and the detail page |
| `src/app/three-body/[slug]/page.tsx` | Static detail page: params, metadata, facts, back link, player |
| `src/app/three-body/[slug]/orbit-facts.tsx`, `back-to-gallery-link.tsx` | The facts list; the link back to the filtered gallery |
| `src/app/three-body/[slug]/speed.ts`, `orbit-frame.ts`, `trail.ts` | Speeds and the frame cap; one frame of the animation, pure; the trail |
| `src/app/three-body/[slug]/orbit-player.tsx`, `player-controls.tsx`, `orbit-canvas.tsx`, `detail-preferences.ts` | The player: play state, restart and the collision message; the controls; the canvas element; the preferences the gallery layout keeps |
| `src/app/three-body/[slug]/orbit-animation.ts`, `draw.ts` | The animation's side effects: wiring and drawing |
| `src/components/` | Shared components: container, page header, card, plate, orbit thumbnail, site header and navigation, logo; the reduced-motion hook (moved here by spec 04) |
| `src/drawing/orbit-path.ts`, `simplify.ts` | Shared drawing geometry: an orbit's simplified path, its bounds and SVG data |
| `src/drawing/transform.ts`, `animation-loop.ts`, `canvas-size.ts`, `theme-colors.ts` | The canvas pieces Part A reuses (moved here by spec 04): the world-to-canvas transform, the `requestAnimationFrame` loop, sizing with the pixel ratio, the colour tokens |
| `src/content/es.ts` | Every UI string, the per-orbit content and Spanish number formatting |
| `e2e/*.spec.ts`, `playwright.config.ts` | End-to-end tests against the production build |
| `scripts/measure-stability.mjs` | Decision 9's measurement (G7) |
| `scripts/bench-playback.mjs` | Gains a table of frame cost at every speed with the app's settings (G10) |

Decision 5's pieces for Part A (the transform, the trail, the loop and the drawing) stay in the detail page's folder until Part A uses them, and move to `src/drawing/` then.

Unit tests sit next to the code. Vitest runs only `src/**/*.test.ts`, so it does not pick up the Playwright files.

### End-to-end setup

- **Packages:** `@playwright/test` and `@axe-core/playwright`, pinned.
- **Command:** `pnpm test:e2e`, against a production build served on port 3100 (`pnpm build && pnpm test:e2e`), so a development server on port 3000 is never tested by mistake.
- **Configuration:** Chromium only, `retries: 0` and traces kept on failure.
- **CI:** in the existing job after `pnpm build`. It installs Chromium, runs the suite and uploads the report.
- **Expected time:** about 35 tests, 15 to 25 s locally, and 1.5 to 2 extra minutes on CI including the browser install. Measured when the setup lands and recorded here.
