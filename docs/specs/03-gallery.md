# Spec 03: Orbit gallery (Part B)

Status: approved (2026-10-23) and amended after the implementation plan review, before any gallery code.

## Goal

The Part B user interface: a home page, a gallery of the six orbits and a detail page per orbit with the animated simulation and its controls. It also lays the shared foundations the Part A lesson will reuse: the visual style, the page layout, the UI strings and the pieces of a canvas that animates bodies.

## Why it exists (from the brief)

- **§03 Part B:** a gallery view; a detail view with the animated simulation of the three bodies and playback controls; each solution with its own shareable URL.
- **§04 Whole app:** returning from a detail page to the gallery keeps the state of the interface (not required after a reload); responsive on mobile and desktop; basic accessibility (keyboard, visible focus, contrast).
- **§09 Criteria:** clear layout on mobile and desktop, visual appeal and user experience.

Builds on spec 02 (`@/orbits`: catalog, playback, `tracePeriod`) and on `docs/design/visual-style.md`.

## Decisions

1. **Routes.** `/` (home), `/gallery`, `/gallery/[slug]` and a placeholder `/learn` until the Part A spec replaces it. Detail pages are generated at build time with `generateStaticParams` and `dynamicParams = false`, each with its own title and description metadata. An unknown slug, like any unknown URL, returns a Spanish 404 page (Next.js's default one is in English).
2. **Spanish UI with centralised strings.** Every user-facing string lives in one typed module (`src/content/es.ts`), not in components, and the document has `lang="es"`. Numbers use Spanish formatting ("17,33", "0,5×"). No i18n library or locale routing: adding English means a second strings module plus routing, which is listed as a limitation. URL tokens (routes, slugs, the filter parameter) are identifiers in English, so they survive that change.
3. **Visual style as design tokens.** Colours and fonts from `docs/design/visual-style.md` are defined once in the Tailwind theme and loaded with `next/font`. Dark theme only. No component hardcodes a colour. Tailwind's default palette is removed (`--color-*: initial`), and every colour token is emitted as a CSS variable (`@theme static`), so the canvas reads the same tokens. Because Tailwind prefixes text colours with `text-`, the design note's names map as follows: `text-strong` → `--color-strong`, `text` → `--color-body`, `text-muted` → `--color-muted`; `surface`, `accent`, `bg-top` and `bg-bottom` keep their names.
4. **Orbit paths are computed at build time.** Tracing a period costs up to 0.6 s (yin-yang I, spec 02), so pages receive the path as static data instead of computing it in the browser. Time-uniform samples are sparse exactly where the bodies are fastest, at the close encounters: with 1,000 samples per period the polyline is up to 5.5 px off the true path on a 640 px canvas (see "Measured during planning"). Each path is therefore traced at `min(stepsPerPeriod, 10,000)` points (a divisor of every ladder value, at most 0.4 px off) and simplified to 0.25 px at the size it is drawn, which leaves 120 to 430 points per body. The gallery thumbnails are static SVG drawn from the same data, so they render without JavaScript.
5. **Canvas 2D for the animation, outside React state.** The simulation lives in a ref and a `requestAnimationFrame` loop advances it and draws it. React only renders the controls; a control change reaches the loop through one call, not through a render per frame. The canvas follows its container's size and the device pixel ratio. The loop draws on demand: while paused it does not run. Part A will reuse the world-to-canvas transform, the trail, the drawing functions, the loop and the sizing as plain functions; the orbit player itself is not generalised until the Part A spec says what the cannon needs.
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
8. **Gallery filter in the URL.** "Todas", "Se mantienen solas" and "Se deshacen sin corrección", stored as a query parameter (`/gallery?filter=holds` or `?filter=drifts`; absent means all). An unknown value shows every orbit: a mistyped shared link should not break the gallery. Changing the filter replaces the history entry instead of adding one. Going back from a detail page restores the filter and the scroll position through normal browser navigation, and a filtered gallery can be shared. The detail page's own back link goes to the last gallery URL, filter included.
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
| G3 | Every orbit has a detail page at `/gallery/[slug]` that loads directly (a shared link), with its own title, and an unknown slug returns a 404. | §03 (shareable URL) | E2E: "each orbit page loads from its URL"; "an unknown orbit is a 404" |
| G4 | The detail page animates the orbit: the bodies move along the faint path, and with correction on they stay on it indefinitely. | §03 | E2E: "the bodies move" (canvas pixels change over time, on every orbit); spec 02 O5 for staying on the path |
| G5 | Controls work by mouse and keyboard: play and pause, restart, speed (0.5×–4×), show path, show trail, correction on and off. Turning correction off makes Lagrange and goggles leave their path within 10 periods. | §03 (playback controls) | E2E: "controls work with the keyboard"; spec 02 O6 for the drift (Lagrange at period 8, goggles at period 4) |
| G6 | Going back from a detail page to the gallery keeps the filter and the scroll position; detail preferences persist across orbits. | §04 | E2E: "returning to the gallery keeps its state"; "detail preferences persist across orbits and reset on reload" |
| G7 | Each preset records whether it holds within 0.1 of its path for 30 periods without correction (Decision 9), and the gallery filter uses it. | Decision 9 | `src/orbits/stability.test.ts` for figure-eight, moth I, Lagrange and goggles; `pnpm measure:stability` for all six, failing on a mismatch, recorded here. Butterfly I and yin-yang I are left to the script: in Vitest they would add about 3 s and 20 s to the suite. |
| G8 | Accessibility: no axe violations on the home, gallery and every detail page; every control has a label; focus is visible; the canvas has a text alternative; reduced motion starts paused. | §04 | E2E with axe (WCAG 2.1 A and AA) on every page, including `/learn` and the 404; "focus is visible on every control"; "the canvas has a text alternative"; "reduced motion starts paused" |
| G9 | Responsive: at 360 px, 768 px and 1280 px wide there is no horizontal scroll, the gallery grid adapts and the detail controls stay usable: inside the viewport, not overlapping, with targets of at least 24 × 24 CSS px (WCAG 2.2, 2.5.8). | §04 | E2E at three viewports: "no horizontal scroll", "the gallery grid has 1, 2 and 3 columns", "detail controls stay inside the viewport with 24 px targets"; screenshots attached to the report for visual review |
| G10 | Frame cost stays within budget: at every speed on every orbit, the p99 cost of a frame stays under 2 ms on the reference machine, through `maxSubsteps`. | Decision 7 | `pnpm bench:playback` with the app's own frame function and settings, recorded here; a one-off run in Chromium with the CPU throttled ×4 |
| G11 | Every user-facing string comes from `src/content/es.ts`, and colours come only from the theme tokens. | Decisions 2 and 3 | `src/theme.test.ts`: no colour literal in `src` outside `globals.css`; Tailwind's default palette removed; Biome `noJsxLiterals` for text in JSX; strings in attributes and metadata by code review |

## Measured during planning

Measured in memory on the bundled code of spec 02 (Apple M2 Pro on AC power, Node 24.14.0, the machine of spec 02's measurements). The committed scripts measure these again in their steps, and their output replaces this section's numbers in "Results".

**Drift without correction (Decision 9).** Distance as defined in Decision 9, over 30 periods without re-anchoring.

| Orbit | First period over 0.1 | At period boundaries only | Largest over 30 periods | Label |
|---|---|---|---|---|
| Lagrange | 8 | 8 | — | Se deshace sin corrección |
| Figura de ocho | none | none | 7.7e-6 | Se mantiene sola |
| Butterfly I | 11 | 13 | — | Se deshace sin corrección |
| Goggles | 3 | 4 | — | Se deshace sin corrección |
| Moth I | none | none | 3.1e-4 | Se mantiene sola |
| Yin-Yang I | 15 | 17 | — | Se deshace sin corrección |

Both metrics give the same labels, with a margin of 300 times or more for the two orbits that hold. Spec 02 Decision 4 says moth I stays within 1e-4 of its path for 10 periods without re-anchoring; that holds at period boundaries, but mid-period it reaches 1.5e-4 in period 2.

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

## Out of scope

- The Part A lesson, the cannon and the tutor (the `/learn` page is a placeholder).
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
- **Decision 4's claim about moth I** ("within 1e-4 for at least 10 periods") holds at period boundaries only; see "Measured during planning".

## Decided in the plan

### File layout

| File | Responsibility |
|---|---|
| `src/app/globals.css` | Tailwind import, colour tokens (`@theme static`, default palette removed), font tokens (`@theme inline`), background gradient, focus ring |
| `src/app/layout.tsx` | `lang="es"`, fonts, title template, skip link, site header, `main` |
| `src/app/page.tsx` | Home |
| `src/app/not-found.tsx` | Spanish 404 |
| `src/app/learn/page.tsx` | Placeholder until the Part A spec |
| `src/app/gallery/layout.tsx` | Keeps the detail preferences (Decision 10) |
| `src/app/gallery/page.tsx` | Static gallery: thumbnails built at build time, the filter in Suspense |
| `src/app/gallery/[slug]/page.tsx` | Static detail page: params, metadata, facts, back link, player |
| `src/content/es.ts` | Every UI string, the per-orbit content and Spanish number formatting |
| `src/components/site-header.tsx` | App name and navigation |
| `src/gallery/filter.ts` | Parsing and matching the gallery filter |
| `src/gallery/simplify.ts` | Simplifying a closed path to a tolerance (Ramer–Douglas–Peucker) |
| `src/gallery/orbit-path.ts` | The path of each body for a drawing size, its bounds and SVG path data |
| `src/gallery/speed.ts` | Speeds, `maxSubsteps` per frame, speed to simulation time |
| `src/gallery/orbit-frame.ts` | One frame of the animation, pure: capped advance in slices, trail samples, trail cleared on a snap, collision |
| `src/gallery/orbit-card.tsx`, `orbit-thumbnail.tsx`, `orbit-grid.tsx` | Gallery cards with static SVG thumbnails |
| `src/gallery/filtered-gallery.tsx` | Reads and writes the filter in the URL |
| `src/gallery/detail-preferences.tsx` | Preferences context and the last gallery URL |
| `src/gallery/orbit-player.tsx`, `player-controls.tsx`, `orbit-canvas.tsx` | The detail player: play state, controls, canvas element |
| `src/gallery/orbit-animation.ts` | The animation's side effects: loop, sizing, drawing |
| `src/canvas/transform.ts`, `trail.ts`, `draw.ts` | World-to-canvas transform, trail, drawing |
| `src/canvas/canvas-size.ts`, `animation-loop.ts`, `theme-colors.ts`, `use-prefers-reduced-motion.ts` | Sizing with the pixel ratio, the `requestAnimationFrame` loop, reading the colour tokens, reduced motion |
| `e2e/*.spec.ts`, `playwright.config.ts` | End-to-end tests against the production build |
| `scripts/measure-stability.mjs` | Decision 9's measurement (G7) |
| `scripts/bench-playback.mjs` | Gains a table of frame cost at every speed with the app's settings (G10) |

Unit tests sit next to the code. Vitest runs only `src/**/*.test.ts`, so it does not pick up the Playwright files.

### End-to-end setup

- **Packages:** `@playwright/test` and `@axe-core/playwright`, pinned.
- **Command:** `pnpm test:e2e`, against a production build served on port 3100 (`pnpm build && pnpm test:e2e`), so a development server on port 3000 is never tested by mistake.
- **Configuration:** Chromium only, `retries: 0` and traces kept on failure.
- **CI:** in the existing job after `pnpm build`. It installs Chromium, runs the suite and uploads the report.
- **Expected time:** about 35 tests, 15 to 25 s locally, and 1.5 to 2 extra minutes on CI including the browser install. Measured when the setup lands and recorded here.
