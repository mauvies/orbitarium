# Spec 04: Lesson (Part A)

Status: approved on 2026-10-26; amended the same day after reviews of the running lesson, the last of which gives Newton's cannon a band of its own and drops the 12 km/s prediction question: shorter texts, then one page in sections instead of a route per step, then a prototype of that page (the layout, the animations, one-click questions) whose decisions are recorded here.

## Goal

The Part A lesson at `/gravitation`: one page whose sections follow the five steps of `docs/design/part-a-learning-experience.md`, each with its visual or interaction and its check question, the learner profile those questions build, and Newton's cannon simulator. It also exposes the lesson's controls (the cannon and the navigation between the page's parts) as one typed API that the page's own buttons use and that the tutor will use in spec 05. This spec contains no LLM code; it builds only the shell of the tutor's panel and makes the controls ready for it.

## Why it exists (from the brief)

- **§02 Part A:** a lesson on Newton's law of universal gravitation, an interactive element the learner manipulates, and an AI tutor.
- **§04 Whole app:** responsive on mobile and desktop; basic accessibility (keyboard, visible focus, contrast).
- **§09 Criteria:** decisions with a known cost, clear code and solid typing.

Builds on spec 01 (`@/physics`), spec 03 (layout, strings, the canvas pieces of its Decision 5) and the design note. The tutor spike (`docs/research/tutor-spike.md`) shaped Decisions 12 to 14.

## Decisions

### The lesson

1. **One page, four sections and a band.** The lesson is one static page at `/gravitation`, laid out like an explanatory article: a title, a lead of two lines with a link to the cannon, four sections that follow Newton's reasoning and, between the last two, a band for the cannon. Everything is separated from the next by a hairline and the same space above and below.
   1. **«La manzana cae»** (`#falling`).
   2. **«La atracción es mutua»** (`#mutual`).
   3. **«¿Llega hasta la Luna?»** (`#moon`): the attraction at the Moon's distance.
   4. **«¿Por qué no cae la Luna?»** (`#orbit`): its intro and the question «¿Por qué no cae la Luna sobre la Tierra?».
   5. **The band «El cañón de Newton»** (`#cannon`), which holds only the interactive cannon (Decision 4). It is not a numbered section of the reasoning and has no question: the learner arrives at it from section 4, or from the lead or the home page (below).
   6. **«La ley completa»** (`#law`).

   The lead reads «La fuerza que hace caer una manzana es la misma que mantiene a la Luna en su órbita. Aquí verás cómo llegó Newton a esa idea y a la ley que la describe, o ve directo al cañón.», the last words linking to `#cannon`.

   **Entry points.** Besides scrolling, `#cannon` is reachable from the lead's link, from the home page (its lesson card links to `/gravitation#cannon`, so a visitor who wants to play lands on the cannon; the header's «Gravitación» still opens the lesson from the top) and from the tutor's navigation (`goToSection("cannon")`, Decision 14).

   Each part has a heading and an anchor, so it can be shared by its URL. There are no routes per step and no redirect; any path below `/gravitation` is the Spanish 404. Cost: the whole lesson is visible at once, so the headings and the order carry the reasoning, and the texts stay short (Decision 4).
2. **The lesson session lives in the page.** The answers, the cannon's settings and its recent paths are kept by a provider around the page, and they reset on reload, as the gallery's preferences do (spec 03, Decision 10). The tutor's panel sits inside the same provider in spec 05.
3. **Free reading order.** The learner scrolls freely and can answer the questions in any order, or not at all; the page has no step list, no previous and next links and no «Continuar». Answering has its own interaction (Decision 5).
4. **Each part: text and question on one side, the picture on the other.** From 1,024 px the two sit side by side, alternating sides from one part to the next; narrower, the picture comes first, followed by the heading, the text and the question. A part's text is one or two lines; facts that do not fit go into a short caption or into the questions' feedback. The question box is compact: a tight border, the options close together. The Spanish text of every sentence that states a fact is in "Physics accuracy review (L19)".
   - **`#falling`:** an SVG of the Earth with two large apple trees about 117° apart along its surface, Madrid and Bali. Each tree is drawn on top and turned about the centre, so its apple falls along its own "down". The animation loops every 7 s: Madrid's tree appears and its apple falls, then Bali's, then two dashed yellow lines draw from the apples to the Earth's centre; everything fades out at the end and the loop starts again. The apples are red and small, the lines yellow.
   - **`#mutual`:** an SVG of a red apple above the Earth with two thin force arrows of the same size, one on the apple and one on the Earth, and a caption: two equal forces, about 1 newton each for a 100 g apple. The animation loops every 5 s: the apple and its arrow fade in above, wait, fall in 0.8 s, wait on the ground and fade out; the jump back up happens while they are invisible. The arrow on the Earth stays.
   - **`#moon`:** an SVG of the Earth, drawn large, and the Moon at the same scale (its radius is 0.27 of the Earth's), joined by a dashed line cut by a break mark, labelled «60 radios terrestres»; the caption says the distance is shortened. Below the text, the question. There is no slider: the explanation and the question carry the inverse square.
   - **`#orbit`:** the text and the question «¿Por qué no cae la Luna sobre la Tierra?» beside Newton's own drawing: the static plate of the home page's card (shots that fall back ever farther and one that circles). The picture is decorative, so it has no caption.
   - **`#cannon`, the band:** a full-width band, the whole container, that breaks the two-column rhythm of the sections: a card with the title «El cañón de Newton», a description of one or two lines («Elige la velocidad y el ángulo, y dispara. ¿A qué velocidad deja de caer la bala?»), and the interactive cannon (Decisions 7 to 11): a large canvas with the controls to its right from 1,024 px and below it narrower, and a caption (a 10 km mountain, a little taller than Everest, and no air). The band holds no questions. Its anchor is the entry point of the lead's link, of the home card and of the tutor.
   - **`#law`:** the law as a fraction, as on paper: F = G ·, then m₁ · m₂ over a horizontal line, over r², all in white, with a caption giving G's value. Screen readers get the formula as a sentence and the drawn one is hidden from them. The symbols do not link anywhere. Beside it, the text, the line on G and the question, which applies the law. No math library.

   **Pause.** The two looping animations have a button, «Pausar»/«Reanudar», at the corner of their own drawing: bottom right in `#falling`, top left in `#mutual`. WCAG 2.2.2 requires it for moving content that starts by itself and lasts over 5 s. With `prefers-reduced-motion: reduce` nothing moves and there is no button: the pictures show their final frame.
5. **Check questions as in the design note.** Single choice, one per part with text: `#falling`, `#mutual`, `#moon`, `#orbit` and `#law`, five in all. Every wrong option names the misconception it reveals. The app grades them deterministically, because the correct option is known in advance. The design note's second question of step 4, asked before firing («¿Qué crees que pasará si lanzas a 12 km/s?»), is dropped: the cannon has a band of its own with no questions, and the question could not wait for a launch without making the band a part of the questions' flow. Its two misconceptions («everything falls back» and «more speed always means an orbit») are no longer recorded.

   **One click answers.** The options are buttons, not radio buttons: with radio buttons the arrow keys select as they move, so a keyboard user would answer by accident; with buttons, Tab and Enter do it. Answering swaps the options for the explanation in the same box: the verdict («Correcto.» or «No exactamente. La correcta: …»), why, and «Ver opciones» at the bottom right. «Ver opciones» brings the options back with the learner's answer marked «(Tu respuesta)»; clicking another one shows its explanation, so the learner can read them all. The learner profile keeps the first answer only, because it is what tells us what they believed. Focus moves to the explanation, and to the first option when «Ver opciones» is used, so a keyboard user's focus never falls back to the start of the page.

   **Nothing moves when answering.** The box reserves, from the start, the height of the longest explanation it can show, so answering, going back to the options and choosing another answer change neither the box, nor the picture beside it, nor anything below. Cost: before answering, some boxes have empty space under their options (at 1,280 px, from 0 to 25 px; at 360 px, one or two lines).

   Changes from the design note's questions, which leave four wrong options without a misconception:
   - **`#mutual`:** «La manzana» records "a bigger effect means a bigger force": the apple moves far more, so it seems to feel more force. A fourth option is added, «Solo tira la Tierra; la manzana no tira», recording "one-way attraction".

   - **`#orbit`:** "The Earth pushes it away" records "an outward force balances gravity". A fourth option, «Porque a esa distancia la gravedad ya no llega», records "gravity does not reach"; its feedback recalls `#moon`: the attraction is weaker there, but it reaches.
   - **`#moon` asks «Si la Luna estuviera el doble de lejos, la atracción sería…»,** with «La cuarta parte» correct and three wrong options: «La mitad» (linear with distance), «La misma» (distance does not matter) and «El doble» (farther means stronger). Fractions are easier to picture than the 3600 of the real Moon. Newton's Moon test goes in the correct option's feedback only, which keeps the others short: 2 × 2 = 4 times weaker, and the Moon, 60 times farther, gets 3600 times less, which in one second is the 1,4 mm it falls against the 4,9 m of the apple. The wrong options correct themselves and give the 3600 in one sentence.
   - **`#law`:** "The same" records "the same fall means the same force", because it usually comes from the correct fact that everything falls equally fast; its feedback separates force from acceleration.

   There is no "none of the above": every wrong option names a misconception. The questions, their options and what each records are in "Questions and misconceptions".
6. **The learner profile is per question.** For each question, the profile records "correct", the misconception chosen, or "unknown" (not answered). Each question names its concept (fall direction, mutual attraction, inverse square, orbit as falling, the full law), so each concept is informed by one question; "orbit as falling" now by the question of `#orbit` alone. The profile is pure data, built by a pure function from the answers, and is available read-only through the lesson's controls for spec 05.

### Newton's cannon

7. **Real units in the UI, scaled units in the engine.** The UI shows km, km/s and km/h. The engine runs with G = 1, the Earth's mass 1 and its radius 1, so its units are:
   - length: the Earth's radius, 6,371 km;
   - speed: √(GM/R) = 7.910 km/s, the circular speed at the surface;
   - time: R divided by that speed, 805.5 s (13.4 minutes).

   GM is 398,600 km³/s². The conversion lives in one module and happens only at the cannon's boundary (Decision 12). Cost: two sets of units in the code, kept apart by naming (`speedKmPerSecond` against engine values).
8. **Launch from 10 km, at a resolution of 0.01 km/s.** The cannon fires from a mountain a little taller than Everest, as in Newton's thought experiment, so the design note's reference speeds stay true: the circular speed there is 7.904 km/s (7.9) and the escape speed 11.177 km/s (11.2).
   - **Why 0.01 km/s.** At this height, a horizontal shot orbits only from 7.91 km/s up. At 7.90 its lowest point is 1.6 km below the surface, and it lands 0.38 of a turn later (15,200 km away, 2.4 s on screen). With steps of 0.1 km/s, 7.9 would crash and the next setting, 8.0, would already be elliptical: no setting would give a circular orbit.
   - **Controls.** Speed from 0 to 15 km/s, as a slider for coarse changes and a number field for fine ones. The slider has 1,500 positions, too many to hit with a mouse, so the field takes a typed value, and in both controls the arrow keys move the speed by 0.01 km/s. Both show the same value. Cost: two controls for one value. Step buttons would also work, but the field gives typing and arrow keys with a native element. Angle from 0° (horizontal) to 90° (straight up), in steps of 1°.
   - **The angle mostly gives lobs.** From 3° up, every shot below the escape speed hits the ground. At 1° a shot orbits from 8.32 km/s, at 2° from 10.11 km/s, and only in ellipses: a circular orbit needs 0°. The text and the tutor must not promise orbits at other angles.
   - **What is drawn.** The cannon is a marker at the launch point. A mountain drawn to scale would be invisible (10 km is 0.16 % of the radius).
   - **Cost.** Horizontal shots that fall back are short and fast: 6 km/s lands 416 km away, and even 7.8 km/s lands 2,194 km away after 0.35 s on screen. Shots above the horizontal show the ballistic case instead: 7 km/s at 45° flies 7,312 km in 2.9 s and rises 2,675 km.
9. **The outcome is computed from the launch, not from the animation.** The design note's four outcomes come from the launch's energy and periapsis, with orbital formulas:
   - **escape** when the specific energy is zero or more;
   - otherwise **ballistic** when the periapsis is at or below the surface (the shot hits the ground);
   - otherwise **circular orbit** when the eccentricity is under 0.01 (the radius stays within 1 % of its mean, under 2 % from lowest to highest point, about 3 px on screen);
   - otherwise **elliptical orbit**.

   The outcome is therefore known at once, the same for every caller, and testable without the canvas. A criterion (L8) checks that the simulated trajectory agrees with it.
10. **Simulated with the engine, one screen second per unit of time.** The shot is a body of mass 1e-9 (spec 01 requires positive masses), so the Earth's motion is invisible. Its path is computed relative to the Earth, at 2,000 steps per low-orbit period, and ends when it reaches the surface. One second on screen is one unit of engine time (13.4 minutes), the same rule as the gallery (spec 03, Decision 7): a low orbit takes 6.3 s and the elliptical preset 10.7 s. The view is fixed and centred on the Earth and reaches 3 radii from its centre to each edge, with no margin, so the Earth fills a third of it and a path that reaches the edge is cut there. Horizontal elliptical shots stay whole in view up to 9.67 km/s (the elliptical preset reaches 1.85 radii). A shot that leaves the view stops being animated; its outcome label still applies.

    The path is traced when the shot is fired, not frame by frame. The trace stops at the first of: reaching the ground, one period (2π·a^1.5, for bound orbits), or passing a stop radius: in the UI, the view's corner, 3√2 ≈ 4.24 radii, so a shot leaves the frame instead of stopping inside it. The engine's limit of 1,000,000 steps is a backstop: a bound shot whose period needs more, near the escape speed, cannot close, and is traced until it lands or passes the stop radius, as an escaping one is. With the UI's stop radius, a trace takes at most 8,435 steps (10.05 km/s at 1°) and 8.7 ms, measured over every speed at ten angles from 0° to 90°. The canvas reveals it at one screen second per unit of time; a closed orbit then loops its traced period. A launch fired from elsewhere on the page, by the tutor, first scrolls the cannon into view (Decision 14) and plays there.
11. **Presets, reference speeds and paths.**
    - **Presets:** ballistic 7.00 km/s at 45°, circular orbit 7.91 km/s at 0°, elliptical orbit 9.00 km/s at 0°, escape 12.00 km/s at 0°. The values may be tuned in visual review as long as each still gives its outcome (L9).
    - **Reference speeds:** shown next to the speed control and computed from the model, not typed, as what each speed does: «Para dar la vuelta sin caer: ≈ 7,9 km/s (≈ 28.000 km/h)» and «Para escapar de la Tierra: ≈ 11,2 km/s».
    - **Paths:** the current launch's path is drawn bright, and up to the last four earlier paths stay faint until the learner clears them, so speeds can be compared as in Newton's drawing.
    - **Outcome label:** it appears when the outcome becomes visible (on landing, after one full turn, or on leaving the view), and a polite live region announces it. With reduced motion, the path is drawn complete at once, with its label. The labels are «Cae al suelo», «Órbita circular», «Órbita elíptica» and «Escapa de la Tierra», which also name the presets.
    - **A shot that comes back from beyond the view.** A bound shot whose trace stops at the stop radius would look like an escape: horizontal elliptical shots from 10.06 km/s, and lobs that rise past it. Its label adds that it comes back: «Órbita elíptica: se aleja mucho, pero vuelve.» or «Cae al suelo: se aleja mucho, pero vuelve.», announced as «Resultado: órbita elíptica; se aleja mucho, pero vuelve.». It is decided by where the trace stopped and the outcome, not by a speed, because the boundary depends on the angle.

### The lesson's controls

12. **One controller for the cannon, shared by the buttons and the tutor.** The launch button, the presets and the controls do not change the cannon's state themselves: they call the controller, as the tutor will in spec 05. There is no second path to the simulation.
    - **Two actions:** `set` moves the controls without firing (the sliders, the field and the angle use it); `launch` applies its request the same way and then fires. A slider that fired on every change would be unusable.
    - **Input:** an optional speed in km/s and an optional angle in degrees. An absent field keeps its current value, so `launch()` fires the current settings.
    - **Result:** what really happened. The speed and angle applied, which of them were clamped, and the outcome of Decision 9, known at once. The tutor can then explain the real result instead of guessing. In the spike, the model said a shot at 8 km/s had gone into orbit without seeing the simulation; from 10 km that launch gives an elliptical orbit.
    - **Reading the state:** the current settings, the last launch (its applied values and outcome) and the limits, so spec 05 can tell the model what the cannon is doing and what it accepts. The settings can differ from the last launch after a `set`.
13. **The controller validates its input; no schema does.** The spike showed a model sending 50 km/s past a schema's `max(15)`, which left the learner without a reply. So the tool schema in spec 05 will only say "a number", and the controller decides:
    - a non-finite number is **rejected**, with the field named;
    - a value outside its range is **clamped** to the range and reported as clamped, so one launch is enough;
    - a value is **rounded** to the control's resolution (0.01 km/s, 1°), so the controls always show exactly what was applied.

    In that order per field: reject, round, clamp. Speed is checked before angle, and a rejection changes nothing. Rounding is `Math.round(value * steps) / steps` with `steps = 1 / resolution` as an integer (100 and 1), and −0 becomes 0; `Math.round(value / resolution) * resolution` leaves float noise (0.35 becomes 0.35000000000000003, and 201 of the 1,501 speeds come out wrong). A field is clamped only when its rounded value is outside the range, so 15.004 becomes 15.00 without being clamped.

    The controller returns a rejection instead of throwing, because spec 05 sends the result back to the model, which has to read it. The pure cannon functions below it throw a `RangeError` naming the field, as everywhere else (spec 01, Decision 8).
14. **The navigation is a controller too.** `goToSection` scrolls to one of the page's parts (validated at runtime, because the tutor's input is untyped), smoothly unless the learner asked for reduced motion, and moves focus to its heading, so a screen reader follows. It replaces the URL's anchor without a history entry, so Back still leaves the lesson. It returns the part reached or a rejection. `current()` is the part at the top of the viewport. A launch requested while the cannon is out of view first scrolls to the `#cannon` band, so the learner sees what they asked for.
15. **The tutor's panel is only a shell.** This spec builds its placement, its opening and closing, and a short Spanish placeholder text, and nothing else: no messages, no input and no state that spec 05 would redo.
    - **Placement:** a floating button, fixed at the bottom right at every width, opens the panel at the right edge. The panel is a non-modal `<dialog>` (`show()`, not `showModal()`), so the page beside it stays visible and usable: when the tutor launches the cannon, the learner sees it. Narrower than 640 px, the panel takes the full width.
    - **Opening and closing:** the button opens it; its close button or Escape closes it and returns focus to the button.
    - **Spec 05** replaces the placeholder with the conversation.

### The whole page

16. **Strings, colours and accessibility as in spec 03.** Every string lives in `src/content/es.ts`, numbers use Spanish formatting, and colours come from the theme tokens. All controls are native elements with Spanish labels and visible focus. The cannon's sliders have value texts with units ("7,91 km/s, 28.476 km/h"), and the canvas has a text alternative describing the last launch.
17. **`src/cannon` is pure, like `src/orbits`.** Units, the launch state, the outcome, the trajectory, the presets and the controller's validation live in a new domain folder with the same boundary rules (spec 02, Decision 8). It is shared by the lesson and by the home page's cannon thumbnail (see "Changes to spec 03"). The React wiring of the controller lives in the `/gravitation` route.
18. **The lesson's text follows the design note's physics accuracy notes.** Equal forces are never described as unequal: the text of `#mutual` never says that one body pulls harder or more weakly, although its question asks who pulls harder and a wrong option answers it. The apple is presented as Newton's own story; fall distances are "in one second", never "per second"; distances in the inverse square are from the Earth's centre, never heights above the surface.

## The lesson's controls (shape, not final code)

```ts
type SectionId = "falling" | "mutual" | "moon" | "orbit" | "cannon" | "law";

type CannonOutcome = "ballistic" | "circular-orbit" | "elliptical-orbit" | "escape";

type CannonField = "speedKmPerSecond" | "angleDegrees";

type CannonSettings = {
  readonly speedKmPerSecond: number;
  readonly angleDegrees: number;
};

/** Absent fields keep their current value. */
type CannonRequest = {
  readonly speedKmPerSecond?: number;
  readonly angleDegrees?: number;
};

/** The values applied: rounded, then clamped. */
type Applied = CannonSettings & { readonly clamped: readonly CannonField[] };

type Rejected = {
  readonly status: "rejected";
  readonly field: CannonField;
  readonly reason: string; // developer-facing, e.g. "must be a finite number"
};

type SetResult = ({ readonly status: "set" } & Applied) | Rejected;

type LaunchResult =
  | ({ readonly status: "launched"; readonly outcome: CannonOutcome } & Applied)
  | Rejected;

type NavigationResult =
  | { readonly status: "moved"; readonly section: SectionId }
  | { readonly status: "rejected"; readonly field: "section"; readonly reason: string };

type LessonControls = {
  readonly cannon: {
    readonly limits: Readonly<Record<CannonField, { min: number; max: number; resolution: number }>>;
    set(request: CannonRequest): SetResult;
    launch(request?: CannonRequest): LaunchResult;
    current(): {
      readonly settings: CannonSettings;
      readonly lastLaunch: (CannonSettings & { readonly outcome: CannonOutcome }) | null;
    };
  };
  readonly navigation: {
    readonly sections: readonly SectionId[];
    current(): SectionId;
    goToSection(section: unknown): NavigationResult;
  };
  learnerProfile(): LearnerProfile;
};
```

The controls reach the page's components through one React context. The rules (validation, clamping, rounding, the outcome, the session's state changes) are pure functions with unit tests; the context only wires them to the store and the router. The session lives in a small external store read with `useSyncExternalStore`, not in `useState` as the gallery's does, so that `current()` right after `launch()` already returns the new state, as the tutor needs. `goToSection` rejects an unknown part with the reason "must be one of falling, mutual, moon, orbit, cannon, law".

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| L1 | `/gravitation` is one static page with its title, its lead and, in order, the sections `#falling`, `#mutual`, `#moon`, `#orbit`, the `#cannon` band and `#law`, each with its heading and anchor; a URL with an anchor opens at that part; any path below `/gravitation` is a 404; the home page and the header link to the lesson. | §02, Decision 1 | E2E: "the lesson is one page with its sections in order", "an anchor opens its part", "a path below /gravitation is a 404"; spec 03 G1 |
| L2 | The learner answers in any order, or not at all, by mouse and keyboard; answers and cannon settings reset on reload. | Decisions 2 and 3 | E2E: "questions can be answered in any order", "the lesson's state resets on reload" |
| L3 | The five questions are those of "Questions and misconceptions"; every wrong option names a misconception; the correct option is graded correct; one click on an option answers and shows its explanation; the first answer is the one recorded. | Decision 5 | `questions.test.ts`: "every wrong option names a misconception", "grades each option"; `lesson-session.test.ts`: "a question keeps its first answer"; E2E: "one click answers and shows the explanation" |
| L4 | The learner profile records, per question, "correct", the misconception chosen or "unknown", with the question's concept. | Decision 6 | `learner-profile.test.ts`: "an unanswered question is unknown", "records the misconception chosen", "names each question's concept" |
| L5 | Unit conversion: one engine speed unit is 7.910 km/s (to 0.001) and one time unit 805.5 s (to 0.1); km/s to engine units and back returns the input within 1e-12 relative. | Decision 7 | `units.test.ts` |
| L6 | The outcome follows Decision 9, launching from 10 km. Horizontal: 0 and 7.90 km/s ballistic, 7.91 and 7.94 km/s circular, 7.95 and 8.00 km/s elliptical, 11.17 km/s elliptical, 11.18 km/s escape. Straight up: 11.17 km/s ballistic, 11.18 km/s escape. From 3° up, nothing below 11.18 km/s orbits. | Decisions 8 and 9 | `outcome.test.ts`: one test per boundary, named by it, and "3° and up never orbit below escape" |
| L7 | The reference speeds come from the model and round to the shown values: circular 7.9 km/s and 28,000 km/h, escape 11.2 km/s. | Decision 11 | `presets.test.ts`: "reference speeds match the model" |
| L8 | The simulated trajectory agrees with the computed outcome, over speeds from 0 to 15 km/s in steps of 0.5 km/s and angles of 0°, 30°, 60° and 90°, plus 7.91 and 7.94 km/s at 0° (the grid has no circular launch). Ballistic shots reach the surface before one turn. Circular ones stay within 1 % of their mean radius for one period. Elliptical ones return to the launch point after one period, within a tolerance measured as in spec 01 ("Measured tolerances"; an independent integration at the same step gives 5.5e-8 radii at 11.0 km/s). Escaping ones pass 20 radii. Launches within 1 % of the escape speed are left out: the slowest kept, 11.0 km/s, already needs 127,000 steps for one period. In the engine, 7.90 km/s horizontal reaches the ground and 7.91 km/s completes a period above its launch radius. | Decisions 8, 9 and 10 | `trajectory.test.ts`: "the simulation agrees with the outcome", "7.90 km/s horizontal reaches the ground in the engine", "7.91 km/s horizontal completes a period above its launch radius"; the suite's time and the tolerance recorded in "Results" |
| L9 | Each preset gives its outcome. | Decision 11 | `presets.test.ts`: "each preset gives its outcome"; E2E: "each preset shows its outcome label" |
| L10 | The cannon controller validates its input. A non-finite speed or angle is rejected with the field named, and nothing changes. Out-of-range values are clamped and listed in `clamped`. Values are rounded to 0.01 km/s and 1°, with no float noise. An absent field keeps its current value. `set` applies without firing; a launch returns the applied values and the outcome. | Decisions 12 and 13 | `src/cannon/controls.test.ts`: one test per rule, including "50 km/s is clamped to 15", "7.9049 km/s is applied as 7.90" and "every rounded speed equals its two-decimal literal" (all 1,501 speeds) |
| L11 | Navigation through the controller validates the part, scrolls to it and focuses its heading without a history entry, and a launch while the cannon is out of view scrolls to it first. | Decision 14 | `lesson-session.test.ts`: "rejects an unknown part", "a launch from another part moves to the cannon"; `lesson-controls.test.ts`: "goToSection navigates for a valid part only". Driving it from the tutor is covered by spec 05's E2E. |
| L12 | The launch button, the presets and the controls change the cannon only through the controller. | Decision 12 | Code review; E2E: "launching from the controls shows the outcome label" |
| L13 | The cannon works by mouse and keyboard; in the speed field and the speed slider the arrow keys change the speed by 0.01 km/s, and a typed value is applied; the outcome label appears when the outcome is visible and is announced in a live region; the canvas has a text alternative; with reduced motion the path is drawn complete at once, and the pictures of `#falling` and `#mutual` show their final frame. | Decisions 4, 11 and 16 | E2E: "the cannon works with the keyboard", "the speed field adjusts by 0.01 km/s", "the outcome is announced", "reduced motion draws the path at once", "reduced motion shows the two pictures at rest" |
| L14 | Dropped: the slider of `#moon` was removed (Decision 4). The inverse square is carried by the `#moon` question and its explanations (L19, sentence 7). | Decision 4 | — |
| L15 | Layout: the tutor's button is visible at every width and opens the panel without blocking the page; focus returns to the button when it closes. From 1,024 px each part's text and picture sit side by side, alternating; narrower, the picture comes first. A hairline and equal space separate every pair of parts, the `#cannon` band included. At 360 px, 768 px and 1,280 px there is no horizontal scroll, and the controls stay inside the viewport, not overlapping, with targets of at least 24 × 24 CSS px. | Decisions 1, 4 and 15, §04 | E2E at three viewports, as spec 03 G9: "the tutor panel opens beside the page and returns focus"; screenshots for visual review |
| L16 | Accessibility: no axe violations on the lesson page, before and after answering; every control has a label; focus is visible. | §04 | E2E with axe (WCAG 2.1 A and AA), added to spec 03's sweeps |
| L17 | Every string comes from `src/content/es.ts`, and colours only from the theme tokens. | Decision 16 | spec 03 G11's checks, which already cover `src` |
| L18 | `src/cannon` imports nothing from React, Next.js or Node, uses no DOM globals, and outside its own files imports only `@/physics`. | Decision 17 | Biome rules in CI, extended from spec 02 Decision 8; `environment.test.ts` |
| L19 | The lesson's text respects the physics accuracy notes of the design note. | Decision 18 | Every sentence that states a physical fact is listed in "Physics accuracy review (L19)" with its check, reviewed by a human, and recorded in "Results"; `lesson-text.test.ts`: "no lesson text says 'por segundo'" (the other rules depend on meaning, so they stay in review) |
| L20 | Answering moves focus to the explanation; «Ver opciones» shows the options again with the first answer marked «(Tu respuesta)» and moves focus to the first option; clicking another option shows its explanation without changing the recorded answer. | Decision 5 | E2E: "answering moves focus to the explanation", "Ver opciones shows the options and keeps the first answer"; `learner-profile.test.ts`: "browsing other options does not change the profile" |
| L21 | The animations of `#falling` and `#mutual` loop, each has a «Pausar»/«Reanudar» button at the corner of its own drawing that stops only that animation, and with reduced motion there is no animation and no button. | Decision 4, WCAG 2.2.2 | E2E: "the animations loop", "pausing stops only its own animation", "reduced motion shows the two pictures at rest" |
| L22 | Nothing moves when a question is answered, when «Ver opciones» is used or when another option is chosen: the box, the picture beside it and every section below keep their position and height, in every part, at 360 px and at 1,280 px. | Decision 5 | E2E: "answering moves nothing", measuring the boxes' position and height before and after, in document coordinates |
| L23 | The `#cannon` band is reachable from the lead's link and from the home page's lesson card, and the tutor can navigate to it (L11). It spans the whole container at 1,280 px, with the controls beside the canvas, and stacks at 360 px, with the controls below. It holds no questions. The page has no horizontal scroll at 360, 768 and 1,280 px, and no axe violations. | Decisions 1 and 4, §04 | E2E: "the lead links to the cannon", "the home card opens the cannon", "the cannon band spans the container at 1280 px and stacks at 360 px", "no horizontal scroll: lesson" at three widths, axe on `/gravitation` (L16) |

## Changes to the visual style

`docs/design/visual-style.md` gets one new colour token, `apple` (`#e5484d`, a red), used only for the apples of the lesson's illustrations. The palette had no red, and an apple that is not an apple is hard to read. It is defined in the theme like the others (spec 03, Decision 3), so no component hardcodes it, and it has a use only in `#falling` and `#mutual`. The design note's "Motion" section also changes: besides the home hero, the two looping illustrations of the lesson move on their own, with a pause button (Decision 4).

## Changes to spec 03

- **The canvas pieces the cannon reuses move to `src/drawing`:** the world-to-canvas transform, the animation loop, the sizing and the theme colours, as spec 03 Decision 5 planned for when Part A uses them. The reduced-motion hook moves to `src/components`, since it is React. The trail and the drawing functions stay in the detail route: the cannon reveals a traced path instead of a trail, and draws open paths and the Earth.
- **The home page's cannon thumbnail uses `src/cannon`.** `(home)/newton-cannon.ts` moves its trajectory into `src/cannon`, so there is one cannon simulation. The thumbnail keeps its taller, illustrative launch point (1.35 radii), which it passes as a parameter.
- **The home page's lesson card links to `/gravitation#cannon`** (Decision 1). Its E2E test in `home.spec.ts` expects that URL; the header link, `site.spec.ts` and spec 03 G1 still open `/gravitation`.
- **`/gravitation` stops being a placeholder.** It becomes the lesson itself, so the E2E tests that expect the URL `/gravitation` (`home.spec.ts`, `site.spec.ts`, `accessibility.spec.ts`) keep it, and the header marks "Gravitación" as current there.

## Out of scope

- The tutor itself, the LLM route, its tools and its error messages: spec 05. This spec provides the controls and the panel's shell.
- The free-text "explain it in your own words" question: spec 05, since an LLM grades it.
- Keeping the lesson's state across reloads.
- From the design note, to be stated in the README: atmospheric drag, CSV and PNG export, other central bodies (Moon, Mars) and a technical orbital data panel (apogee, perigee, eccentricity, period).
- Zooming and panning the cannon's view, and following shots that leave it.
- English UI.

## Risks

- **Horizontal shots that fall back are barely visible.** From 10 km they land within about 2,000 km in under half a second on screen (Decision 8). Mitigation: the ballistic preset is a 45° lob, and the lesson's only remaining question, in `#orbit`, does not depend on seeing a horizontal fall. If visual review still finds it weak, that is a decision then; raising the launch height would break the reference speeds.
- **Long ellipses and escapes leave the view.** Shots near the escape speed spend minutes outside it (11.0 km/s reaches 31 radii). Mitigation: the outcome label is computed at launch (Decision 9), so the learner and the tutor get the answer anyway, and a bound shot that leaves says that it comes back (Decision 11).
- **Two units in one code path.** A value in km/s passed where an engine speed is expected would be wrong by a factor of 7.9 and still typecheck. Mitigation: conversion only at the cannon's boundary, units in every identifier (`speedKmPerSecond`), and L6 and L10 written in km/s.
- **The controller is only half tested here.** The tutor's side, the tool calls, belongs to spec 05. Mitigation: the controller's rules are pure and unit-tested (L10, L11), and the page's own buttons use the same controller (L12), so every path the tutor will use already runs in E2E.
- **A long page.** The whole lesson on one page can overwhelm a reader without a physics background. Mitigation: four sections with one or two lines of text each, the facts in captions and feedback, and visual review at 360 px.
- **A launch out of view.** The tutor may launch while the learner reads another part. Mitigation: the launch scrolls the cannon into view first (Decision 14), and the trace is computed when the shot is fired (Decision 10), so nothing depends on when the canvas is seen.

## Decided in the plan

### File layout

Code used by one route lives in that route's folder, with its tests; code shared by more than one route lives in `src/components`, `src/drawing` or a domain folder (decision log).

| File | Responsibility |
|---|---|
| `src/cannon/index.ts`, `types.ts` | Public entry point; the settings, request, outcome and trace types |
| `src/cannon/units.ts` | The Earth's radius, GM, the launch altitude, the engine's units and the conversions (Decision 7) |
| `src/cannon/launch.ts`, `outcome.ts` | Settings to the engine's launch state; the circular and escape speeds; the outcome (Decision 9) |
| `src/cannon/controls.ts` | The limits, and the validation, rounding and clamping of a request (Decision 13) |
| `src/cannon/trajectory.ts` | Tracing a launch with the engine and how much of it is revealed at a time (Decision 10); replaces `(home)/newton-cannon.ts`, with the launch radius as a parameter |
| `src/cannon/presets.ts` | The presets and the reference speeds (Decision 11) |
| `src/drawing/transform.ts`, `animation-loop.ts`, `canvas-size.ts`, `theme-colors.ts` | Moved from the detail route (see "Changes to spec 03") |
| `src/components/use-prefers-reduced-motion.ts` | Moved from the detail route |
| `src/app/gravitation/page.tsx` | The static lesson page: title, lead, the four sections in order, inside the lesson's provider |
| `src/app/gravitation/lesson-session.ts`, `lesson-store.ts`, `lesson-controls.ts`, `lesson-provider.tsx` | The session's state and pure transitions; the external store; `LessonControls`; the React context that wires them to scrolling |
| `src/app/gravitation/sections.ts`, `questions.ts`, `learner-profile.ts` | The parts' ids and order; the questions and their grading; the profile (Decisions 1, 5 and 6) |
| `src/app/gravitation/_sections/step-layout.tsx`, `check-question.tsx`, `pausable-animation.tsx` | A part's two columns, its picture and its text; a question with its explanation, «Ver opciones» and reserved height; the pause button of a looping animation |
| `src/app/gravitation/_sections/falling-step.tsx`, `mutual-step.tsx`, `moon-step.tsx`, `orbit-step.tsx`, `law-step.tsx` | The parts of the reasoning: each one's picture and text (`_sections` is private to the page, so Next.js does not turn it into a route) |
| `src/app/gravitation/_sections/cannon-band.tsx`, then `cannon-panel.tsx`, `cannon-canvas.tsx`, `cannon-animation.ts`, `cannon-draw.ts`; `cannon-view.ts`, `outcome-label.ts` | `#cannon`: the band, its controls, the canvas and its animation, the drawing; the view radius and the stop radius of the session's traces; whether a shot's label says that it comes back (Decision 11) |
| `src/app/gravitation/tutor-panel.tsx` | The tutor's button and panel (Decision 15) |
| `src/app/gravitation/use-hydrated.ts`, `use-current-section.ts` | Controls disabled until the page hydrates; the part at the top of the viewport |

### Questions and misconceptions

Spec 04, Decision 5. Ids are those of `questions.ts`.

| Part | Question (id, concept) | Option | Records |
|---|---|---|---|
| `#falling` | «¿Qué tienen en común estas dos caídas?» (`two-falls`, fall direction) | «Las dos van hacia el centro de la Tierra.» | correct |
| | | «Las dos van hacia la parte de abajo de la pantalla.» | `absolute-down` |
| | | «Las dos van hacia el polo sur.» | `absolute-down` |
| | | «Nada: caen en direcciones distintas.» | `no-common-cause` |
| `#mutual` | «¿Quién tira más fuerte, la manzana o la Tierra?» (`who-pulls-harder`, mutual attraction) | «La Tierra.» | `larger-body-pulls-harder` |
| | | «La manzana.» | `bigger-effect-means-bigger-force` |
| | | «Solo tira la Tierra; la manzana no tira.» | `one-way-attraction` |
| | | «Tiran exactamente igual de fuerte.» | correct |
| `#moon` | «Si la Luna estuviera el doble de lejos, la atracción sería…» (`twice-as-far`, inverse square) | «La cuarta parte.» | correct |
| | | «La mitad.» | `linear-with-distance` |
| | | «La misma.» | `distance-does-not-matter` |
| | | «El doble.» | `farther-means-stronger` |
| `#orbit` | «¿Por qué no cae la Luna sobre la Tierra?» (`why-the-moon-does-not-fall`, orbit as falling) | «Porque en el espacio no hay gravedad.» | `no-gravity-in-space` |
| | | «Sí cae, pero se mueve de lado tan deprisa que nunca llega al suelo.» | correct |
| | | «Porque la Tierra la empuja hacia fuera.» | `outward-force-balances` |
| | | «Porque a esa distancia la gravedad ya no llega.» | `gravity-does-not-reach` |
| `#law` | «Si la manzana tuviera el doble de masa, la fuerza entre ella y la Tierra sería…» (`twice-the-mass`, the full law) | «El doble.» | correct |
| | | «Cuatro veces mayor.» | `mass-squared` |
| | | «La misma.» | `equal-fall-means-equal-force` |

### Physics accuracy review (L19)

Draft, to be reviewed by a human and recorded in "Results". Every sentence that states a physical fact, where it appears and how it was checked. The other feedback texts restate these facts.

| # | Where | Sentence | Check |
|---|---|---|---|
| 0 | Page lead | «La fuerza que hace caer una manzana es la misma que mantiene a la Luna en su órbita. Aquí verás cómo llegó Newton a esa idea y a la ley que la describe, o ve directo al cañón.» | Universality, the point of the lesson (accuracy note 3) |
| 1 | `#falling`, text | «Cuenta Newton que la idea se le ocurrió al ver caer una manzana: ¿por qué cae siempre hacia el suelo, y nunca de lado? Fíjate en dos manzanas que caen lejos una de otra: una en Madrid y otra en Bali.» | Newton's own question, as he told it to Stukeley in 1726: why the apple descends perpendicularly to the ground, never sideways or upwards (accuracy note 2). The question about the two falls is the lesson's, not attributed to him. Madrid and Bali are 117° apart along the surface (great-circle distance), which the drawing shows |
| 2 | `#falling` question, correct feedback | «En una Tierra redonda, «abajo» significa «hacia el centro de la Tierra»: todo lo que cae, cae hacia el centro.» | A plumb line is off by at most about 0.2°, irrelevant here |
| 3 | `#mutual`, text | «Newton dio un paso más: todo lo que tiene masa atrae a todo lo demás. La Tierra atrae a la manzana, y la manzana también atrae a la Tierra.» | Universality and the third law (accuracy notes 1 and 3) |
| 4 | `#mutual`, caption | «Dos fuerzas iguales: para una manzana de 100 g, de alrededor de 1 newton cada una.» | 0.1 kg × 9.8 m/s² = 0.98 N |
| 5 | `#mutual` question, correct feedback | «Las dos fuerzas son iguales. Esa fuerza acelera a la manzana 9,8 m/s² y a la Tierra unos 1,6 × 10⁻²⁵ m/s², porque la Tierra tiene muchísima más masa.» | 0.98 N / 5.97 × 10²⁴ kg = 1.6 × 10⁻²⁵ m/s² |
| 5b | `#mutual` question, «La manzana» feedback | «La manzana se mueve mucho más, pero no porque sufra más fuerza: las dos fuerzas son iguales, y la manzana tiene muchísima menos masa.» | a = F/m: the same force, very different masses |
| 6 | `#moon`, text | «Si todo lo que tiene masa se atrae, la Tierra también atrae a la Luna. Pero la Luna está unas 60 veces más lejos del centro de la Tierra que la manzana.» | Universality; 384,400 / 6,371 = 60.3, from the centre |
| 6b | `#moon`, caption | «La Tierra y la Luna, a escala entre sí. La distancia está acortada: en realidad es de unos 60 radios terrestres.» | The Moon's radius is 1,737 / 6,371 = 0.27 of the Earth's; 60.3 radii |
| 7 | `#moon` question, correct feedback | «El doble de lejos, 2 × 2 = 4 veces más débil. La Luna, 60 veces más lejos, recibe 3600 veces menos: en un segundo se desvía hacia la Tierra 1,4 mm, frente a los 4,9 m que cae la manzana.» | ½ · 9.8 · 1² = 4.9 m; 4.9 / 3600 = 1.36 mm, which matches the orbit: 4π²r/T²/2 = 1.36 mm; "en un segundo", never "por segundo"; 60.3² = 3636, hence «unas 3600»; distances from the centre |
| 8 | `#moon` question, wrong options' feedback | «…la atracción baja con el cuadrado de la distancia. El doble de lejos, 4 veces más débil; la Luna, 60 veces más lejos, recibe 3600 veces menos.» | Inverse square; the three wrong options (half, same, double) share this correction, adapted to what each believed |
| 9 | `#orbit`, text | «Entonces, si la Tierra atrae a la Luna, ¿por qué no se cae? Newton lo pensó con un cañón en lo alto de una montaña.» | Newton's thought experiment (*A Treatise of the System of the World*); the question is rhetorical, and the lesson's answer is that the Moon does fall |
| 10 | `#cannon` band, caption | «El cañón dispara desde una montaña de 10 km, algo más alta que el Everest, y aquí no hay aire que frene la bala.» | Everest is 8.849 km; drag is out of scope and the caption says so |
| 11 | `#cannon` band, reference speeds | «Para dar la vuelta sin caer: ≈ 7,9 km/s (≈ 28.000 km/h)», «Para escapar de la Tierra: ≈ 11,2 km/s» | L7: 7.904 km/s and 28,453 km/h; 11.177 km/s at 10 km. "Sin caer" means without reaching the ground: the shot still falls, as `#orbit` says |
| 12 | `#cannon` band, outcome label of a bound shot that leaves the view | «Órbita elíptica: se aleja mucho, pero vuelve.», «Cae al suelo: se aleja mucho, pero vuelve.» | Below the escape speed the energy is negative, so the shot turns back; shown only when its trace passed the stop radius (`outcome-label.test.ts`) |
| 13 | `#orbit` question, "no gravity" feedback | «Sí la hay: a la altura de la Estación Espacial, la gravedad es casi el 90 % de la de la superficie. Los astronautas flotan porque caen a la vez que la estación.» | (6,371 / 6,791)² = 0.88 at 420 km |
| 14 | `#orbit` question, correct feedback | «La Luna cae hacia la Tierra, pero se mueve de lado tan deprisa, alrededor de 1 km/s, que nunca llega al suelo.» | Orbital speed 1.02 km/s |
| 15 | `#orbit` question, "pushed" feedback | «La Tierra no empuja a la Luna: solo la atrae. No hace falta ninguna fuerza hacia fuera; basta con que se mueva de lado.» | In an inertial frame there is no outward force |
| 16 | `#orbit` question, "does not reach" feedback | «Sí llega: más arriba viste que allí la atracción es unas 3600 veces más débil, pero no desaparece. Esa atracción es la que curva su camino.» | Gravity has no cutoff; 1/60.3² |
| 17 | `#law`, text | «Todo junto: la fuerza crece con cada masa y se debilita con el cuadrado de la distancia entre sus centros.» | "Centres" holds for spheres (shell theorem) |
| 18 | `#law`, line on G | «G es la constante de gravitación universal, la misma en la Tierra y en el cielo.» | Universality (accuracy note 3) |
| 19 | `#law`, caption | «Su valor es de unos 6,67 × 10⁻¹¹ N·m²/kg².» | CODATA 2018: 6.674 × 10⁻¹¹ |
| 20 | `#law` question, correct feedback | «La fuerza se duplica, pero también la masa que hay que mover, así que la manzana cae igual de deprisa.» | a = F/m, neglecting the Earth's acceleration |
| 21 | `#law`, spoken form | «La fuerza es igual a G por la masa de la manzana por la masa de la Tierra, dividido entre el cuadrado de la distancia entre sus centros.» | Reads F = G · m₁ · m₂ / r² as the law states it, centres of spheres |

### Left to visual review

- The path colours and the number of faint paths (Decision 11).
- The timing of `#falling`'s sequence, and whether 1,024 px leaves each part's text and picture enough room side by side (Decision 4).
