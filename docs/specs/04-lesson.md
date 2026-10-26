# Spec 04: Lesson (Part A)

Status: draft (2026-10-26), for review.

## Goal

The Part A lesson at `/gravitation`: the five steps of `docs/design/part-a-learning-experience.md`, each with its visual or interaction and its check question, the learner profile those questions build, and Newton's cannon simulator. It also exposes the lesson's controls (the cannon and the navigation between steps) as one typed API that the page's own buttons use and that the tutor will use in spec 05. This spec contains no LLM code; it builds only the shell of the tutor's panel and makes the controls ready for it.

## Why it exists (from the brief)

- **§02 Part A:** a lesson on Newton's law of universal gravitation, an interactive element the learner manipulates, and an AI tutor.
- **§04 Whole app:** responsive on mobile and desktop; basic accessibility (keyboard, visible focus, contrast).
- **§09 Criteria:** decisions with a known cost, clear code and solid typing.

Builds on spec 01 (`@/physics`), spec 03 (layout, strings, the canvas pieces of its Decision 5) and the design note. The tutor spike (`docs/research/tutor-spike.md`) shaped Decisions 12 to 14.

## Decisions

### The lesson

1. **One route per step.** `/gravitation/[step]`, with the steps `falling`, `mutual`, `moon`, `cannon` and `law`, generated at build time, each with its own title. `/gravitation` redirects to `/gravitation/falling`, so the home and header links keep working. An unknown step returns the Spanish 404. A step can be shared by its URL, and the browser's Back button goes to the previous step.
2. **The lesson session lives in the `/gravitation` layout.** The answers, the cannon's settings and its recent paths are kept in the layout, so they survive moving between steps, and they reset on reload, as the gallery's preferences do (spec 03, Decision 10). The tutor's panel sits in the same layout in spec 05, so a conversation survives moving between steps too.
3. **Free navigation.** Every step has "previous" and "next" links and a list of the five steps. The learner can always move on without answering.
4. **Step visuals.**
   - **Steps 1 and 2:** SVG illustrations with a short animation and no controls (apples falling towards the centre at several points of the globe; equal force arrows on the apple and the Earth, with only the apple moving).
   - **Step 3:** one small interaction, a distance slider from 1 to 60 Earth radii in whole steps, showing the pull relative to the surface as 1/d² (twice the distance, a quarter of the pull; at the Moon's 60 radii, 1/3,600). The text keeps the Moon test numbers of the design note (4.9 m and about 1.4 mm in one second).
   - **Step 4:** the cannon, the main interactive element (Decisions 7 to 11).
   - **Step 5:** the law, F = G·m₁·m₂/r², as styled text with a spoken form for screen readers, each symbol linked back to the step where the learner saw it. No math library.

   With `prefers-reduced-motion: reduce`, the SVG animations show their final frame.
5. **Check questions as in the design note.** Single choice, one per step except step 4, which has two (a prediction before firing and a question after experimenting). Every wrong option names the misconception it reveals. The app grades them deterministically, because the correct option is known in advance. The first answer is recorded, and the question then shows its feedback and locks, because the first answer is what tells us what the learner believed. The prediction's feedback appears after the 12 km/s launch it asks about has played (predict, observe, explain).
6. **The learner profile is per question.** For each question, the profile records "correct", the misconception chosen, or "unknown" (not answered). Each question names its concept (fall direction, mutual attraction, inverse square, orbit as falling, the full law), so step 4's two questions both inform "orbit as falling" without losing which one was missed. The profile is pure data, built by a pure function from the answers, and is available read-only through the lesson's controls for spec 05.

### Newton's cannon

7. **Real units in the UI, scaled units in the engine.** The UI shows km, km/s and km/h. The engine runs with G = 1, the Earth's mass 1 and its radius 1, so its units are:
   - length: the Earth's radius, 6,371 km;
   - speed: √(GM/R) = 7.910 km/s, the circular speed at the surface;
   - time: R divided by that speed, 805.5 s (13.4 minutes).

   GM is 398,600 km³/s². The conversion lives in one module and happens only at the cannon's boundary (Decision 12). Cost: two sets of units in the code, kept apart by naming (`speedKmPerSecond` against engine values).
8. **Launch from 10 km, at a resolution of 0.01 km/s.** The cannon fires from a mountain a little taller than Everest, as in Newton's thought experiment, so the design note's reference speeds stay true: the circular speed there is 7.904 km/s (7.9) and the escape speed 11.177 km/s (11.2).
   - **Why 0.01 km/s.** At this height, a horizontal shot orbits only from 7.91 km/s up. At 7.90 its lowest point is 1.6 km below the surface, and it lands about half a turn later. With steps of 0.1 km/s, 7.9 would crash and the next setting, 8.0, would already be elliptical: no setting would give a circular orbit.
   - **Controls.** Speed from 0 to 15 km/s, as a slider for coarse changes and a number field for fine ones. The slider has 1,500 positions, too many to hit with a mouse, so the field takes a typed value, and in both controls the arrow keys move the speed by 0.01 km/s. Both show the same value. Cost: two controls for one value. Step buttons would also work, but the field gives typing and arrow keys with a native element. Angle from 0° (horizontal) to 90° (straight up), in steps of 1°.
   - **What is drawn.** The cannon is a marker at the launch point. A mountain drawn to scale would be invisible (10 km is 0.16 % of the radius).
   - **Cost.** Horizontal shots that fall back are short and fast: 6 km/s lands 416 km away, and even 7.8 km/s lands 2,182 km away after 0.35 s on screen. Shots above the horizontal show the ballistic case instead: 7 km/s at 45° flies 7,312 km in 2.9 s and rises 2,675 km.
9. **The outcome is computed from the launch, not from the animation.** The design note's four outcomes come from the launch's energy and periapsis, with orbital formulas:
   - **escape** when the specific energy is zero or more;
   - otherwise **ballistic** when the periapsis is at or below the surface (the shot hits the ground);
   - otherwise **circular orbit** when the eccentricity is under 0.01 (the radius varies by under 1 %, invisible on screen);
   - otherwise **elliptical orbit**.

   The outcome is therefore known at once, the same for every caller, and testable without the canvas. A criterion (L8) checks that the simulated trajectory agrees with it.
10. **Simulated with the engine, one screen second per unit of time.** The shot is a body of mass 1e-9 (spec 01 requires positive masses), so the Earth's motion is invisible. Its path is computed relative to the Earth, at 2,000 steps per low-orbit period, and ends when it reaches the surface. One second on screen is one unit of engine time (13.4 minutes), the same rule as the gallery (spec 03, Decision 7): a low orbit takes 6.3 s and the elliptical preset 10.7 s. The view is fixed and centred on the Earth, and shows at least the elliptical preset's farthest point (1.85 radii from the centre). A shot that leaves the view stops being animated; its outcome label still applies.
11. **Presets, reference speeds and paths.**
    - **Presets:** ballistic 7.00 km/s at 45°, circular orbit 7.91 km/s at 0°, elliptical orbit 9.00 km/s at 0°, escape 12.00 km/s at 0° (the speed of step 4's prediction question). The values may be tuned in visual review as long as each still gives its outcome (L9).
    - **Reference speeds:** shown next to the speed control and computed from the model, not typed: circular ≈ 7.9 km/s (≈ 28,000 km/h) and escape ≈ 11.2 km/s, formatted in Spanish ("7,9 km/s", "28.000 km/h").
    - **Paths:** the current launch's path is drawn bright, and up to the last four earlier paths stay faint until the learner clears them, so speeds can be compared as in Newton's drawing.
    - **Outcome label:** it appears when the outcome becomes visible (on landing, after one full turn, or on leaving the view), and a polite live region announces it. With reduced motion, the path is drawn complete at once, with its label.

### The lesson's controls

12. **One controller for the cannon, shared by the buttons and the tutor.** The launch button, the presets and the controls do not change the cannon's state themselves: they call the controller's `launch`, as the tutor will in spec 05. There is no second path to the simulation.
    - **Input:** a speed in km/s and an optional angle in degrees (absent: the angle currently set).
    - **Result:** what really happened. The speed and angle applied, which of them were clamped, and the outcome of Decision 9, known at once. The tutor can then explain the real result instead of guessing. In the spike, the model said a shot at 8 km/s had gone into orbit without seeing the simulation; from 10 km that launch gives an elliptical orbit.
    - **Reading the state:** the current settings, the last outcome and the limits, so spec 05 can tell the model what the cannon is doing and what it accepts.
13. **The controller validates its input; no schema does.** The spike showed a model sending 50 km/s past a schema's `max(15)`, which left the learner without a reply. So the tool schema in spec 05 will only say "a number", and the controller decides:
    - a non-finite number is **rejected**, with the field named;
    - a value outside its range is **clamped** to the range and reported as clamped, so one launch is enough;
    - a value is **rounded** to the control's resolution (0.01 km/s, 1°), so the controls always show exactly what was applied.

    The controller returns a rejection instead of throwing, because spec 05 sends the result back to the model, which has to read it. The pure cannon functions below it throw a `RangeError` naming the field, as everywhere else (spec 01, Decision 8).
14. **The navigation is a controller too.** `goToStep` moves to a step (validated at runtime, because the tutor's input is untyped), pushes a history entry as the links do, and returns the step reached or a rejection. A launch requested from another step first moves to the cannon step, so the learner sees what they asked for.
15. **The tutor's panel is only a shell.** This spec builds its placement, its opening and closing, and a short Spanish placeholder text, and nothing else: no messages, no input and no state that spec 05 would redo.
    - **Placement:** a side panel next to the lesson, open from the start, at 1,024 px and wider. Narrower, a button opens it as a sheet.
    - **Opening and closing:** by the button, and the sheet closes with Escape and returns focus to the button.
    - **Spec 05** replaces the placeholder with the conversation.

### The whole page

16. **Strings, colours and accessibility as in spec 03.** Every string lives in `src/content/es.ts`, numbers use Spanish formatting, and colours come from the theme tokens. All controls are native elements with Spanish labels and visible focus. The sliders have value texts with units ("7,91 km/s, 28.476 km/h"; "el doble de lejos: 1/4 de la fuerza"), and the canvas has a text alternative describing the last launch.
17. **`src/cannon` is pure, like `src/orbits`.** Units, the launch state, the outcome, the trajectory, the presets and the controller's validation live in a new domain folder with the same boundary rules (spec 02, Decision 8). It is shared by the lesson and by the home page's cannon thumbnail (see "Changes to spec 03"). The React wiring of the controller lives in the `/gravitation` route.
18. **The lesson's text follows the design note's physics accuracy notes.** Equal forces are never described as unequal; the apple is presented as an anecdote; fall distances are "in one second", never "per second".

## The lesson's controls (shape, not final code)

```ts
type StepId = "falling" | "mutual" | "moon" | "cannon" | "law";

type CannonOutcome = "ballistic" | "circular-orbit" | "elliptical-orbit" | "escape";

type CannonField = "speedKmPerSecond" | "angleDegrees";

type LaunchRequest = {
  readonly speedKmPerSecond: number;
  readonly angleDegrees?: number; // absent: keep the current angle
};

type LaunchResult =
  | {
      readonly status: "launched";
      readonly speedKmPerSecond: number; // applied: clamped and rounded
      readonly angleDegrees: number; // applied
      readonly clamped: readonly CannonField[];
      readonly outcome: CannonOutcome;
    }
  | {
      readonly status: "rejected";
      readonly field: CannonField;
      readonly reason: string; // developer-facing, e.g. "must be a finite number"
    };

type NavigationResult =
  | { readonly status: "moved"; readonly step: StepId }
  | { readonly status: "rejected"; readonly field: "step"; readonly reason: string };

type LessonControls = {
  readonly cannon: {
    readonly limits: Readonly<Record<CannonField, { min: number; max: number; resolution: number }>>;
    launch(request: LaunchRequest): LaunchResult;
    current(): { speedKmPerSecond: number; angleDegrees: number; lastOutcome: CannonOutcome | null };
  };
  readonly navigation: {
    current(): StepId;
    goToStep(step: string): NavigationResult;
  };
  learnerProfile(): LearnerProfile;
};
```

The controls reach the `/gravitation` layout's components through one React context. The rules (validation, clamping, rounding, the outcome, the session's state changes) are pure functions with unit tests; the context only wires them to React state and the router.

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| L1 | `/gravitation` redirects to the first step; each step loads directly from its URL with its own title; an unknown step is a 404; the home page and the header still link to the lesson. | §02, Decision 1 | E2E: "each step loads from its URL", "an unknown step is a 404", "/gravitation opens the first step"; spec 03 G1 |
| L2 | The learner moves between steps with the previous and next links and the step list, by mouse and keyboard, without answering; Back returns to the previous step; answers and cannon settings survive moving between steps and reset on reload. | Decisions 2 and 3 | E2E: "steps navigate by keyboard", "the lesson keeps its state across steps and resets on reload" |
| L3 | The six questions are those of the design note; every wrong option names a misconception; the correct option is graded correct; the first answer locks the question and shows its feedback; the prediction's feedback waits for the 12 km/s launch. | Decision 5 | `questions.test.ts`: "every wrong option names a misconception", "grades each option"; E2E: "answering shows feedback and locks the question", "the launch reveals the prediction" |
| L4 | The learner profile records, per question, "correct", the misconception chosen or "unknown", with the question's concept. | Decision 6 | `learner-profile.test.ts`: "an unanswered question is unknown", "records the misconception chosen", "names each question's concept" |
| L5 | Unit conversion: one engine speed unit is 7.910 km/s (to 0.001) and one time unit 805.5 s (to 0.1); km/s to engine units and back returns the input within 1e-12 relative. | Decision 7 | `units.test.ts` |
| L6 | The outcome follows Decision 9, launching from 10 km. Horizontal: 0 and 7.90 km/s ballistic, 7.91 and 7.94 km/s circular, 7.95 and 8.00 km/s elliptical, 11.17 km/s elliptical, 11.18 km/s escape. Straight up: 11.17 km/s ballistic, 11.18 km/s escape. | Decisions 8 and 9 | `outcome.test.ts`: one test per boundary, named by it |
| L7 | The reference speeds come from the model and round to the shown values: circular 7.9 km/s and 28,000 km/h, escape 11.2 km/s. | Decision 11 | `presets.test.ts`: "reference speeds match the model" |
| L8 | The simulated trajectory agrees with the computed outcome, over speeds from 0 to 15 km/s in steps of 0.5 km/s and angles of 0°, 30°, 60° and 90°. Ballistic shots reach the surface before one turn. Circular ones stay within 1 % of their launch radius for one period. Elliptical ones return to the launch point after one period, within 1e-4 radii. Escaping ones pass 20 radii. Launches within 1 % of the escape speed are left out: the slowest kept, 11.0 km/s, already needs 127,000 steps for one period. | Decisions 9 and 10 | `trajectory.test.ts`: "the simulation agrees with the outcome" |
| L9 | Each preset gives its outcome. | Decision 11 | `presets.test.ts`: "each preset gives its outcome"; E2E: "each preset shows its outcome label" |
| L10 | The cannon controller validates its input. A non-finite speed or angle is rejected with the field named. Out-of-range values are clamped and listed in `clamped`. Values are rounded to 0.01 km/s and 1°. An absent angle keeps the current one. A launch returns the applied values and the outcome. | Decisions 12 and 13 | `cannon-controls.test.ts`: one test per rule, including "50 km/s is clamped to 15" and "7.9049 km/s is applied as 7.90" |
| L11 | Navigation through the controller validates the step and moves like a link, and a launch from another step moves to the cannon step first. | Decision 14 | `lesson-session.test.ts`: "rejects an unknown step", "a launch from another step moves to the cannon"; E2E of the links in L2. Driving it from the tutor is covered by spec 05's E2E. |
| L12 | The launch button, the presets and the controls change the cannon only through the controller. | Decision 12 | Code review; E2E: "launching from the controls shows the outcome label" |
| L13 | The cannon works by mouse and keyboard; in the speed field and the speed slider the arrow keys change the speed by 0.01 km/s, and a typed value is applied; the outcome label appears when the outcome is visible and is announced in a live region; the canvas has a text alternative; with reduced motion the path is drawn complete at once, and steps 1 and 2 show their final frame. | Decisions 4, 11 and 16 | E2E: "the cannon works with the keyboard", "the speed field adjusts by 0.01 km/s", "the outcome is announced", "reduced motion draws the path at once" |
| L14 | Step 3's slider shows 1/4 at twice the distance and 1/3,600 at 60 radii, in its text and its value text. | Decision 4 | `inverse-square.test.ts` for the fraction; E2E: "the distance slider shows the inverse square" |
| L15 | Layout: from 1,024 px the tutor panel is open beside the lesson; narrower, a button opens it as a sheet, and focus returns to the button when it closes. At 360 px, 768 px and 1,280 px there is no horizontal scroll, and the controls stay inside the viewport, not overlapping, with targets of at least 24 × 24 CSS px. | Decision 15, §04 | E2E at three viewports, as spec 03 G9; screenshots for visual review |
| L16 | Accessibility: no axe violations on any step; every control has a label; focus is visible. | §04 | E2E with axe (WCAG 2.1 A and AA) on every step, added to spec 03's sweeps |
| L17 | Every string comes from `src/content/es.ts`, and colours only from the theme tokens. | Decision 16 | spec 03 G11's checks, which already cover `src` |
| L18 | `src/cannon` imports nothing from React, Next.js or Node, uses no DOM globals, and outside its own files imports only `@/physics`. | Decision 17 | Biome rules in CI, extended from spec 02 Decision 8; `environment.test.ts` |
| L19 | The lesson's text respects the physics accuracy notes of the design note. | Decision 18 | Review against the notes' checklist, recorded in "Results" |

## Changes to spec 03

- **The canvas pieces move to `src/drawing`:** the world-to-canvas transform, the trail, the animation loop, the sizing and the drawing functions, as spec 03 Decision 5 planned for when Part A uses them.
- **The home page's cannon thumbnail uses `src/cannon`.** `(home)/newton-cannon.ts` moves its trajectory into `src/cannon`, so there is one cannon simulation. The thumbnail keeps its taller, illustrative launch point (1.35 radii), which it passes as a parameter.
- **`/gravitation` stops being a placeholder.** The E2E tests that expect the URL `/gravitation` (`home.spec.ts`, `site.spec.ts`, `accessibility.spec.ts`) follow the redirect to `/gravitation/falling`, and the header marks "Gravitación" as current on every step.

## Out of scope

- The tutor itself, the LLM route, its tools and its error messages: spec 05. This spec provides the controls and the panel's shell.
- The free-text "explain it in your own words" question: spec 05, since an LLM grades it.
- Letting the tutor move step 3's distance slider; the design note asks only for the cannon and the navigation.
- Keeping the lesson's state across reloads.
- From the design note, to be stated in the README: atmospheric drag, CSV and PNG export, other central bodies (Moon, Mars) and a technical orbital data panel (apogee, perigee, eccentricity, period).
- Zooming and panning the cannon's view, and following shots that leave it.
- English UI.

## Risks

- **Horizontal shots that fall back are barely visible.** From 10 km they land within about 2,000 km in under half a second on screen (Decision 8). Mitigation: the ballistic preset is a 45° lob, and the predict question's options do not depend on seeing a horizontal fall. If visual review still finds it weak, that is a decision then; raising the launch height would break the reference speeds.
- **Long ellipses and escapes leave the view.** Shots near the escape speed spend minutes outside it (11.0 km/s reaches 31 radii). Mitigation: the outcome label is computed at launch (Decision 9), so the learner and the tutor get the answer anyway; the view's extent is set in visual review.
- **Two units in one code path.** A value in km/s passed where an engine speed is expected would be wrong by a factor of 7.9 and still typecheck. Mitigation: conversion only at the cannon's boundary, units in every identifier (`speedKmPerSecond`), and L6 and L10 written in km/s.
- **The controller is only half tested here.** The tutor's side, the tool calls, belongs to spec 05. Mitigation: the controller's rules are pure and unit-tested (L10, L11), and the page's own buttons use the same controller (L12), so every path the tutor will use already runs in E2E.
- **State shared between the layout and the pages.** The cannon's state lives in the layout, but the canvas mounts only on step 4, so a launch from step 2 has to start once the canvas appears. Mitigation: L11 covers the session rule; the plan decides how the canvas picks up a pending launch.

## Left to the plan

- The file layout, following the decision log's rule (route code beside its route; shared code in `src/components`, `src/drawing` or `src/cannon`).
- How the canvas plays a launch: simulated frame by frame with spec 03's loop, or traced at launch and revealed along the path.
- The cannon view's extent, the path colours and the number of faint paths (Decision 11), in visual review.
- The misconception identifiers and the questions' data shape.
