# Spec 03: Orbit gallery (Part B)

Status: draft for review (2026-10-23). Committed before any gallery code.

## Goal

The Part B user interface: a home page, a gallery of the six orbits and a detail page per orbit with the animated simulation and its controls. It also lays the shared foundations the Part A lesson will reuse: the visual style, the page layout, the UI strings and a canvas component that animates bodies.

## Why it exists (from the brief)

- **§03 Part B:** a gallery view; a detail view with the animated simulation of the three bodies and playback controls; each solution with its own shareable URL.
- **§04 Whole app:** returning from a detail page to the gallery keeps the state of the interface (not required after a reload); responsive on mobile and desktop; basic accessibility (keyboard, visible focus, contrast).
- **§09 Criteria:** clear layout on mobile and desktop, visual appeal and user experience.

Builds on spec 02 (`@/orbits`: catalog, playback, `tracePeriod`) and on `docs/design/visual-style.md`.

## Decisions

1. **Routes.** `/` (home), `/gallery`, `/gallery/[slug]` and a placeholder `/learn` until the Part A spec replaces it. Detail pages are generated at build time with `generateStaticParams`, each with its own title and description metadata. An unknown slug returns the 404 page.
2. **Spanish UI with centralised strings.** Every user-facing string lives in one typed module (`src/content/es.ts`), not in components, and the document has `lang="es"`. No i18n library or locale routing: adding English means a second strings module plus routing, which is listed as a limitation.
3. **Visual style as design tokens.** Colours and fonts from `docs/design/visual-style.md` are defined once in the Tailwind theme (CSS variables) and loaded with `next/font`. Dark theme only. No component hardcodes a colour.
4. **Orbit paths are computed at build time.** Tracing a period costs up to 0.6 s (yin-yang I, spec 02), so pages receive the traced path as static data instead of computing it in the browser. The gallery thumbnails are static SVG drawn from the same data, so they render without JavaScript.
5. **Canvas 2D for the animation, outside React state.** The simulation lives in a ref and a `requestAnimationFrame` loop advances it with `advancePlayback` and draws it. React only renders the controls. The canvas follows its container's size and the device pixel ratio.
6. **What is drawn.** The orbit's path, faint (the traced period); a short fading trail behind each body, bright, drawn from the positions actually shown; and the three bodies. With correction off, the live trail visibly leaves the faint path, which is how chaos becomes visible.
7. **Playback speed.** At 1× one period takes a fixed number of seconds on screen, per orbit. The speeds are 0.5×, 1×, 2× and 4×. `maxSubsteps` per frame is set so that a frame's p99 cost stays within a measured budget on the slowest orbit; when the cap is reached the orbit plays slower than requested instead of dropping frames. Both values are measured in the plan with `pnpm bench:playback`.
8. **Gallery filter in the URL.** "Todas", "Se mantienen solas" and "Se deshacen sin corrección", stored as a query parameter (`/gallery?filtro=…`). Going back from a detail page restores the filter and the scroll position through normal browser navigation, and a filtered gallery can be shared.
9. **Honest stability labels.** The labels describe what the simulation shows, not a formal stability result: whether an orbit stays within 0.1 of its path for 30 periods without correction, at its spec 02 steps per period. Each preset records this as measured data, with a test.
10. **Detail preferences persist while browsing.** Speed, path, trail and correction are kept in the gallery layout, so they survive moving between orbits and back to the gallery. They reset on reload.
11. **Motion and accessibility.** All controls are native buttons, toggles and selects with Spanish labels and visible focus. The canvas has a text alternative describing the orbit. With `prefers-reduced-motion: reduce`, playback starts paused. The animation pauses while the tab is hidden, and spec 02's cap prevents a catch-up freeze on return.
12. **Tests in two layers.** Pure UI logic (filter parsing, the world-to-canvas transform, speed to simulation time) gets Vitest unit tests. Pages, navigation, state preservation, keyboard use and accessibility get Playwright end-to-end tests in Chromium with axe, run in CI against a production build. Drawing itself is reviewed visually, not asserted.

## Content per orbit

Each detail page shows the orbit's name, a two or three sentence description in plain Spanish, who found it and when, its period in simulation units, its stability label and its source. The facts:

| Orbit | Found by | Notes for the description |
|---|---|---|
| Lagrange | Joseph-Louis Lagrange, 1772 | Three equal masses at the corners of a rotating equilateral triangle. With equal masses the configuration is unstable. |
| Figure-eight | Cris Moore, 1993 (numerically); proved to exist by Alain Chenciner and Richard Montgomery, 2000 | The three bodies chase each other along one figure-eight curve. |
| Butterfly I, moth I, goggles, yin-yang I | Milovan Šuvakov and Veljko Dmitrašinović, 2013 | Found in a numerical search of 2013 that discovered 13 new families of periodic orbits. |

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| G1 | The home page links to the gallery and to the lesson. | §01 | E2E: "home links to the gallery and the lesson" |
| G2 | The gallery lists the six orbits in the brief's order, each with its name, its static path thumbnail and its stability label, linking to its detail page. | §03 | E2E: "gallery lists the six orbits"; unit test of the thumbnail path data |
| G3 | Every orbit has a detail page at `/gallery/[slug]` that loads directly (a shared link), with its own title, and an unknown slug returns a 404. | §03 (shareable URL) | E2E: "each orbit page loads from its URL"; "an unknown orbit is a 404" |
| G4 | The detail page animates the orbit: the bodies move along the faint path, and with correction on they stay on it indefinitely. | §03 | E2E: "the bodies move" (canvas pixels change over time); spec 02 O5 for staying on the path |
| G5 | Controls work by mouse and keyboard: play and pause, restart, speed (0.5×–4×), show path, show trail, correction on and off. Turning correction off makes Lagrange and goggles leave their path within a few periods. | §03 (playback controls) | E2E: "controls work with the keyboard"; spec 02 O6 for the drift |
| G6 | Going back from a detail page to the gallery keeps the filter and the scroll position; detail preferences persist across orbits. | §04 | E2E: "returning to the gallery keeps its state"; "detail preferences persist across orbits" |
| G7 | Each preset records whether it holds within 0.1 of its path for 30 periods without correction, and the gallery filter uses it. | Decision 9 | Unit test in `src/orbits` against the measured values; measurement recorded here |
| G8 | Accessibility: no axe violations on the home, gallery and every detail page; every control has a label; focus is visible; the canvas has a text alternative; reduced motion starts paused. | §04 | E2E with axe on every page; "reduced motion starts paused" |
| G9 | Responsive: at 360 px, 768 px and 1280 px wide there is no horizontal scroll, the gallery grid adapts and the detail controls stay usable. | §04 | E2E at three viewports: "no horizontal scroll"; screenshots for visual review |
| G10 | Frame cost stays within budget: at every speed on every orbit, the p99 cost of a frame stays under the budget measured in the plan, through `maxSubsteps`. | Decision 7 | `pnpm bench:playback` with the chosen settings, recorded here |
| G11 | Every user-facing string comes from `src/content/es.ts`, and colours come only from the theme tokens. | Decisions 2 and 3 | Code review; a lint or test check if a cheap one exists |

## Out of scope

- The Part A lesson, the cannon and the tutor (the `/learn` page is a placeholder).
- English UI and locale routing.
- A light theme.
- Searching for new orbits (the brief's optional extra).
- Sound, 3D or zooming and panning the canvas.

## Risks

- **Yin-yang I's frame cost** (2 ms mean, up to 5.6 ms p99 at 5 s per period, spec 02). Mitigation: a slower base period for it and the `maxSubsteps` cap (Decision 7).
- **E2E tests are slower and can be flaky.** Mitigation: run them against a production build, wait on visible state instead of timers, and keep them to the behaviours in this table.
- **Canvas testing is shallow.** E2E can only check that pixels change; whether the drawing looks right is a visual review, recorded with screenshots at the three viewports.