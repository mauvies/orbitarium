# Spec 04: Lesson (Part A)

Status: approved on 2026-10-26; amended the same day after reviews of the running lesson, the last of which gives Newton's cannon a band of its own and drops the 12 km/s prediction question: shorter texts, then one page in sections instead of a route per step, then a prototype of that page (the layout, the animations, one-click questions) whose decisions are recorded here. Amended on 2026-10-27 after a review of the running cannon: an adjustable launch height, a fifth preset and a new order of the controls; then an optional predicted path; then how the navigation tracks and reaches the parts; then where the tutor's panel sits at each width, settled as a floating card from 1,280 px after reviews of a side panel that pushed the page and of a card from 1,024 px. Amended on 2026-10-28 after a review of the home page: its lesson card opens the lesson from the top, the lead invites the learner to the cannon in a sentence of its own, and the cannon's band has a one-line description.

## Goal

The Part A lesson at `/gravitation`: one page whose sections follow the five steps of `docs/design/part-a-learning-experience.md`, each with its visual or interaction and its check question, the learner profile those questions build, and Newton's cannon simulator. It also exposes the lesson's controls (the cannon and the navigation between the page's parts) as one typed API that the page's own buttons use and that the tutor will use in spec 05. This spec contains no LLM code; it builds only the shell of the tutor's panel and makes the controls ready for it.

## Why it exists (from the brief)

- **§02 Part A:** a lesson on Newton's law of universal gravitation, an interactive element the learner manipulates, and an AI tutor.
- **§04 Whole app:** responsive on mobile and desktop; basic accessibility (keyboard, visible focus, contrast).
- **§09 Criteria:** decisions with a known cost, clear code and solid typing.

Builds on spec 01 (`@/physics`), spec 03 (layout, strings, the canvas pieces of its Decision 5) and the design note. The tutor spike (`docs/research/tutor-spike.md`) shaped Decisions 12 to 14.

## Decisions

### The lesson

1. **One page, four sections and a band.** The lesson is one static page at `/gravitation`, laid out like an explanatory article: a title, a short lead with a link to the cannon, four sections that follow Newton's reasoning and, between the last two, a band for the cannon. Everything is separated from the next by a hairline and the same space above and below.
   1. **«La manzana cae»** (`#falling`).
   2. **«La atracción es mutua»** (`#mutual`).
   3. **«¿Llega hasta la Luna?»** (`#moon`): the attraction at the Moon's distance.
   4. **«¿Por qué no cae la Luna?»** (`#orbit`): its intro and the question «¿Por qué no cae la Luna sobre la Tierra?».
   5. **The band «El cañón de Newton»** (`#cannon`), which holds only the interactive cannon (Decision 4). It is not a numbered section of the reasoning and has no question: the learner arrives at it from section 4, or from the lead (below).
   6. **«La ley completa»** (`#law`).

   The lead reads «La fuerza que hace caer una manzana es la misma que mantiene a la Luna en su órbita. Aquí verás cómo llegó Newton a esa idea y a la ley que la describe. Si prefieres aprender probando, ve directo al cañón y descúbrelo por ti mismo.», «ve directo al cañón» linking to `#cannon`: the last sentence is for a learner who would rather try than read.

   **Entry points.** Besides scrolling, `#cannon` is reachable from the lead's link and from the tutor's navigation (`goToSection("cannon")`, Decision 14). The home page's lesson card, like the header's «Gravitación», opens the lesson from the top, so a visitor meets the lead before the cannon.

   Each part has a heading and an anchor, so it can be shared by its URL. There are no routes per step and no redirect; any path below `/gravitation` is the Spanish 404. Cost: the whole lesson is visible at once, so the headings and the order carry the reasoning, and the texts stay short (Decision 4).
2. **The lesson session lives in the page.** The answers, the cannon's settings, its recent paths and whether its predicted path is shown are kept by a provider around the page, and they reset on reload, as the gallery's preferences do (spec 03, Decision 10). The tutor's panel sits inside the same provider in spec 05.
3. **Free reading order.** The learner scrolls freely and can answer the questions in any order, or not at all; the page has no step list, no previous and next links and no «Continuar». Answering has its own interaction (Decision 5).
4. **Each part: text and question on one side, the picture on the other.** From 1,024 px the two sit side by side, alternating sides from one part to the next; narrower, the part reads its heading, its text, its picture and its question, in that order, which is also the tab order. A part's text is one or two lines; facts that do not fit go into a short caption or into the questions' feedback. The question box is compact: a tight border, the options close together. The Spanish text of every sentence that states a fact is in "Physics accuracy review (L19)".
   - **`#falling`:** an SVG of the Earth with two large apple trees about 117° apart along its surface, Madrid and Bali. Each tree is drawn on top and turned about the centre, so its apple falls along its own "down". The animation loops every 7 s: Madrid's tree appears and its apple falls, then Bali's, then two dashed yellow lines draw from the apples to the Earth's centre; everything fades out at the end and the loop starts again. The apples are red and small, the lines yellow.
   - **`#mutual`:** an SVG of a red apple above the Earth with two thin force arrows of the same size, one on the apple and one on the Earth, and a caption: two equal forces, about 1 newton each for a 100 g apple. The animation loops every 5 s: the apple and its arrow fade in above, wait, fall in 0.8 s, wait on the ground and fade out; the jump back up happens while they are invisible. The arrow on the Earth stays.
   - **`#moon`:** an SVG of the Earth, drawn large, and the Moon at the same scale (its radius is 0.27 of the Earth's), joined by a dashed line cut by a break mark, labelled «60 radios terrestres»; the caption says the distance is shortened. Below the text, the question. There is no slider: the explanation and the question carry the inverse square.
   - **`#orbit`:** the text and the question «¿Por qué no cae la Luna sobre la Tierra?» beside Newton's own drawing: the static plate of the home page's card (shots that fall back ever farther and one that circles). The picture is decorative, so it has no caption.
   - **`#cannon`, the band:** a full-width band, the whole container, that breaks the two-column rhythm of the sections: a card with the title «El cañón de Newton», a one-line description that invites the learner to try it, and the interactive cannon (Decisions 7 to 11): a large canvas with the controls to its right from 1,024 px and below it narrower, and a caption (a 10 km mountain to start with, a little taller than Everest, that can rise to 2,000 km, and no air); below 640 px the description and the caption are left to screen readers, to keep the canvas and the controls in view: with the description shown, a tutor's scroll at 360 × 740 would leave 45 % of the canvas above the bottom sheet instead of about 85 %). The band holds no questions. Its anchor is the entry point of the lead's link and of the tutor.
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
8. **Launch from 10 km to start with, at a resolution of 0.01 km/s.** The cannon fires from a mountain a little taller than Everest, as in Newton's thought experiment, so the design note's reference speeds hold at the start: the circular speed there is 7.904 km/s (7.9) and the escape speed 11.177 km/s (11.2).
   - **Adjustable height.** The learner can raise the mountain from 10 to 2,000 km, in steps of 10 km: from Newton's mountain to the top of low orbit (the International Space Station flies at about 420 km). Higher up, both speeds are lower: at 2,000 km the circular speed is 6.90 km/s and the escape speed 9.76 km/s. Every launch starts at 10 km, and so does every preset. Steps of 10 km keep the slider to 200 positions and every value round. Cost: the reference speeds and the outcome's boundaries change with the height, so they are computed for the current height (Decision 11), never typed.
   - **Why 0.01 km/s.** At this height, a horizontal shot orbits only from 7.91 km/s up. At 7.90 its lowest point is 1.6 km below the surface, and it lands 0.38 of a turn later (15,200 km away, 2.4 s on screen). With steps of 0.1 km/s, 7.9 would crash and the next setting, 8.0, would already be elliptical: no setting would give a circular orbit.
   - **Controls.** Speed from 0 to 15 km/s, as a slider for coarse changes and a number field for fine ones. The slider has 1,500 positions, too many to hit with a mouse, so the field takes a typed value, and in both controls the arrow keys move the speed by 0.01 km/s. Both show the same value. Cost: two controls for one value. Step buttons would also work, but the field gives typing and arrow keys with a native element. Angle from 0° (horizontal) to 90° (straight up), in steps of 1°, and height from 10 to 2,000 km, in steps of 10 km, each with the same pair of slider and field.
   - **Order and layout.** From the top: the launch button, so firing never needs a scroll past the settings, and right under it «Borrar trayectorias», as wide but outlined, because it removes paths instead of firing; then the speed, the angle, the height and the presets. Each setting is one row: its slider takes most of the width, and its number field and unit («km/s», «°», «km») sit to its right. The reference speeds are not in the panel but on the canvas (Decision 11).
   - **The angle mostly gives lobs.** From 3° up, every shot below the escape speed hits the ground. At 1° a shot orbits from 8.32 km/s, at 2° from 10.11 km/s, and only in ellipses: a circular orbit needs 0°. The text and the tutor must not promise orbits at other angles.
   - **What is drawn.** The cannon stands on a mountain drawn to scale, up to the launch point, but never lower than 3 px: 10 km would be a fifth of a pixel; on a 640 px canvas the mountain grows from about 180 km, and 2,000 km is about 34 px. An impossibly tall mountain, as in Newton's own drawing.
   - **Cost.** Horizontal shots that fall back are short and fast: 6 km/s lands 416 km away, and even 7.8 km/s lands 2,194 km away after 0.35 s on screen. Shots above the horizontal show the ballistic case instead: 7 km/s at 45° flies 7,312 km in 2.9 s and rises 2,675 km.
9. **The outcome is computed from the launch, not from the animation.** The design note's four outcomes come from the launch's energy and periapsis, with orbital formulas:
   - **escape** when the specific energy is zero or more;
   - otherwise **ballistic** when the periapsis is at or below the surface (the shot hits the ground);
   - otherwise **circular orbit** when the eccentricity is under 0.01 (the radius stays within 1 % of its mean, under 2 % from lowest to highest point, about 3 px on screen);
   - otherwise **elliptical orbit**.

   The outcome is therefore known at once, the same for every caller, and testable without the canvas. A criterion (L8) checks that the simulated trajectory agrees with it.
10. **Simulated with the engine, one screen second per unit of time.** The shot is a body of mass 1e-9 (spec 01 requires positive masses), so the Earth's motion is invisible. Its path is computed relative to the Earth, at 2,000 steps per low-orbit period, and ends when it reaches the surface. One second on screen is one unit of engine time (13.4 minutes), the same rule as the gallery (spec 03, Decision 7): a low orbit takes 6.3 s and the elliptical preset 10.7 s. The view is fixed and centred on the Earth and reaches 3 radii from its centre to each edge, with no margin, so the Earth fills a third of it and a path that reaches the edge is cut there. From 10 km, horizontal elliptical shots stay whole in view up to 9.67 km/s (the elliptical preset reaches 1.85 radii and the long one 2.82). A shot that leaves the view stops being animated; its outcome label still applies.

    The path is traced when the shot is fired, not frame by frame. The trace stops at the first of: reaching the ground, one period (2π·a^1.5, for bound orbits), or passing a stop radius: in the UI, the view's corner, 3√2 ≈ 4.24 radii, so a shot leaves the frame instead of stopping inside it. The engine's limit of 1,000,000 steps is a backstop: a bound shot whose period needs more, near the escape speed, cannot close, and is traced until it lands or passes the stop radius, as an escaping one is. With the UI's stop radius, a trace takes at most 8,435 steps (10.05 km/s horizontal from 10 km), measured over every speed at ten angles from 0° to 90° and six heights from 10 to 2,000 km; the slowest of those 90,060 traces took 32 ms, one frame on firing. The canvas reveals it at one screen second per unit of time; a closed orbit then loops its traced period. A launch fired from elsewhere on the page, by the tutor, first scrolls the cannon into view (Decision 14) and plays there.
11. **Presets, reference speeds and paths.**
    - **Presets:** five, all from 10 km: «Cae al suelo», 7.00 km/s at 45°; «Órbita circular», 7.91 km/s at 0°; «Órbita elíptica», 9.00 km/s at 0°; «Elipse muy alargada», 9.60 km/s at 0°, which rises to 2.82 radii (11,600 km high) and stays whole in view, with a period of 16.6 s on screen; and «Escapa de la Tierra», 12.00 km/s at 0°. The long ellipse stands for a transfer orbit, the long ellipse that takes a satellite from a low orbit to a high one; a real geostationary transfer would rise to 6.6 radii and leave the view. The values may be tuned in visual review as long as each still gives its outcome, and the long ellipse stays in view (L9).
    - **Reference speeds:** two badges side by side at the canvas's top right, computed from the model for the current height, not typed, as what each speed does: «Para orbitar: ≈ 7,9 km/s» and «Para escapar: ≈ 11,2 km/s» at 10 km. They change as the height does, and sit where the learner looks while firing. Below 640 px the badges are smaller (`text-xs`, 0.75 rem) and read «Órbita: ≈ 7,9 km/s» and «Escape: ≈ 11,2 km/s», and screen readers always get the full text. Cost: the design note's km/h (≈ 28.000 km/h, which means more to a non-physicist) is no longer shown, so each badge stays short and on one line at 360 px; the speed slider's value text still gives km/h.
    - **Paths:** the current launch's path is drawn bright, and up to the last four earlier paths stay faint until the learner clears them, so speeds can be compared as in Newton's drawing.
    - **Outcome label:** at the canvas's bottom left, clear of the badges at every width, it appears when the outcome becomes visible (on landing, after one full turn, or on leaving the view), and a polite live region announces it. With reduced motion, the path is drawn complete at once, with its label. The labels are «Cae al suelo», «Órbita circular», «Órbita elíptica» and «Escapa de la Tierra», which also name four of the presets; the long ellipse's label is «Órbita elíptica».
    - **A shot that comes back from beyond the view.** A bound shot whose trace stops at the stop radius would look like an escape: from 10 km, horizontal elliptical shots from 10.06 km/s, and lobs that rise past it. Its label adds that it comes back: «Órbita elíptica: se aleja mucho, pero vuelve.» or «Cae al suelo: se aleja mucho, pero vuelve.», announced as «Resultado: órbita elíptica; se aleja mucho, pero vuelve.». It is decided by where the trace stopped and the outcome, not by a speed, because the boundary depends on the angle.
    - **Predicted path.** A checkbox «Mostrar trayectoria prevista», on by default, shows where the current settings would send the shot, so the learner sees the effect of each control before firing. Cost: the path gives the answer away before the shot; a learner who wants to predict first unticks it. It sits below the height's row and before «Ejemplos», because it goes with the settings. When it is on, the canvas draws, dashed in `accent` and beneath the real paths, the trace that a launch with the current settings would record: one function computes both, with the same stop radius, so the two match exactly. It is recomputed at most once per frame, however many slider events arrive. It never fires, never adds a launch to the session and never shows an outcome label, and the canvas's text alternative still describes the last launch, because the prediction is only visual. It is a learner preference kept in the session, so it resets on reload, and not one of the tutor's controls: `LessonControls` does not change. Like the other controls, it is disabled until the page hydrates. Cost: the worst case, 10.05 km/s at 0° from 10 km (8,435 steps), took a median of 7.2 ms (95th percentile 7.8 ms) over repeated runs in Node; it fits in a 16.7 ms frame but takes almost half of it, so on a slow phone dragging the speed slider near 10 km/s may drop frames. A 45° shot takes 0.8 ms. Dragging the speed from 9 to 11 km/s at 0° in Chromium dropped no frame (120 of 120 at 16.7 ms); with the CPU throttled 4× in DevTools, 12 of 178 frames took 33 ms (one frame skipped) and none took over 50 ms: a slight stutter.

### The lesson's controls

12. **One path to the cannon, shared by the buttons and the tutor.** The launch button, the presets and the controls do not change the cannon's state themselves: they go through the session's transitions (`setCannon`, `launchCannon`), which the controller also uses for the tutor in spec 05. There is no second path to the simulation. The sliders and fields call the controller's `set`; the launch button and the presets call a learner-side launch on the lesson's context, like answering a question, because only a launch the tutor asks for may scroll the page or move focus (Decision 14): the learner who presses «Disparar» is already looking at the cannon.
    - **Two actions:** `set` moves the controls without firing (the sliders, the field and the angle use it); `launch` applies its request the same way and then fires. A slider that fired on every change would be unusable.
    - **Input:** an optional speed in km/s, an optional angle in degrees and an optional height in km. An absent field keeps its current value, so `launch()` fires the current settings.
    - **Result:** what really happened. The speed, angle and height applied, which of them were clamped, and the outcome of Decision 9, known at once. The tutor can then explain the real result instead of guessing. In the spike, the model said a shot at 8 km/s had gone into orbit without seeing the simulation; from 10 km that launch gives an elliptical orbit.
    - **Reading the state:** the current settings, the last launch (its applied values and outcome) and the limits, so spec 05 can tell the model what the cannon is doing and what it accepts. The settings can differ from the last launch after a `set`.
13. **The controller validates its input; no schema does.** The spike showed a model sending 50 km/s past a schema's `max(15)`, which left the learner without a reply. So the tool schema in spec 05 will only say "a number", and the controller decides:
    - a non-finite number is **rejected**, with the field named;
    - a value outside its range is **clamped** to the range and reported as clamped, so one launch is enough;
    - a value is **rounded** to the control's resolution (0.01 km/s, 1°, 10 km), so the controls always show exactly what was applied.

    In that order per field: reject, round, clamp. Speed is checked first, then angle, then height, and a rejection changes nothing. Rounding is `Math.round(value * steps) / steps` with `steps = 1 / resolution` as an integer (100 and 1), and −0 becomes 0; the height's resolution is larger than 1, so it is `Math.round(value / 10) * 10`, exact in integers; `Math.round(value / resolution) * resolution` leaves float noise (0.35 becomes 0.35000000000000003, and 201 of the 1,501 speeds come out wrong). A field is clamped only when its rounded value is outside the range, so 15.004 becomes 15.00 without being clamped.

    The controller returns a rejection instead of throwing, because spec 05 sends the result back to the model, which has to read it. The pure cannon functions below it throw a `RangeError` naming the field, as everywhere else (spec 01, Decision 8).
14. **The navigation is a controller too.** `goToSection` scrolls to one of the page's parts (validated at runtime, because the tutor's input is untyped), smoothly unless the learner asked for reduced motion, and moves focus to its heading, so a screen reader follows. It replaces the URL's anchor without a history entry, so Back still leaves the lesson. It returns the part reached or a rejection. `current()` is the part at the top of the viewport: the last part whose top is at or above a line just under the viewport's top, the parts' scroll margin (32 px) plus 8 px, so a part scrolled to with subpixel rounding still counts; at the bottom of the page, where the last part cannot reach the top, it is the last part. So after `goToSection(x)` succeeds, `current()` returns `x`. `current()` is computed when it is called, from the parts' positions, not tracked on scroll: the tutor reads it rarely, and tracking it would re-render the page on every scroll. A launch the tutor requests while the cannon is out of view, that is, while less than 90 % of the canvas is in the viewport (90 % of the canvas or of the viewport, whichever is smaller), first scrolls to the `#cannon` band, so the learner sees what they asked for. Not half, as first written: on a phone the bottom sheet hid the lower third of the canvas, where the shot lands, and that still counted as in view, so the tutor fired without moving the page. Not the whole canvas either: at 360 × 640 it ends 0.8 px under the sheet after the scroll. The band's own buttons never scroll the page or move focus (Decision 12).

    **While the tutor's panel is open,** a tutor's navigation, and a tutor's launch that scrolls to the cannon, scroll and replace the anchor but leave focus in the panel, so a learner typing or reading the conversation is not pulled out of it; instead the panel's polite live region announces the move: «Ahora estás en “El cañón de Newton”.», with the part's title. The region is cleared and written again on the next frame, so a repeated move is announced again. With the panel closed, focus moves to the part's heading as above. Whether the panel is open is read from the dialog's own `open` property, not from a copy of React's state. Below 1,280 px the open panel is a bottom sheet (Decision 15), so the visible page is the part above it: a scroll still brings the part's heading 32 px from the top, inside that area, and the cannon counts as in view by the canvas's share of that area, not of the whole viewport; after the scroll the whole canvas shows above the sheet at 412 × 780, and all but 0.8 px of it at 360 × 640. From 1,280 px the floating card covers only the lower right of the viewport, and the cannon's in-view check ignores it: the canvas sits in the band's left column, beside the part it covers. The invariant holds with the panel open.
15. **The tutor's panel is only a shell.** This spec builds its placement, its opening and closing, and a short Spanish placeholder text, and nothing else: no messages, no input and no state that spec 05 would redo.
    - **From 1,280 px (`xl`), a floating card over the page.** At the bottom right, 1 rem from the right edge and 4.5 rem from the bottom, just above the toggle: 24 rem wide and `min(28rem, 100svh − 14rem)` tall, so a short laptop screen keeps page above it (at 1,280 × 720, 448 px tall with 200 px of page above; on screens under 672 px tall, 152 px above). Its content will scroll inside it in spec 05. It stands apart from the page by a `surface-raised` background and a `strong` border, without a shadow (visual style). The page does not move or reflow. While it is open the page gets a bottom padding as tall as the card and the toggle, so the end of the page can be scrolled above it.
    - **Below 1,280 px, a bottom sheet,** at 1,024 and 768 px as on a phone. Full width, `min(40svh, 24rem)` tall, and while it is open the page gets a bottom padding as tall as the sheet and the toggle, so everything can still be scrolled above it. At 40 % the canvas fits above it after a tutor's scroll (Decision 14); at 55 % it hid a third of the canvas. The heights use `svh`, the viewport with the browser's bars shown, not `dvh`: on a phone `dvh` changes each time scrolling shows or hides the bars, so the sheet, the page's padding and the toggle jumped while the learner scrolled. The floating card's height uses `svh` too.
    - **Why these two.** Opening and closing never move the reader's place, as chat panels in other applications do not. A side panel that pushed the page from 1,280 px was built and reviewed first: it covered nothing, but each opening reflowed the lesson and moved its headings 56 to 204 px under the reader, and it shrank the canvas from 640 to 422 px. A side panel over the full height was ruled out in a spike: it covered 239 of the 320 px of the cannon's controls at 1,280 px, with no way to scroll them out from under it. A floating card from 1,024 px was tried too: at that width it hid almost all of the cannon's controls, so below 1,280 px the sheet takes over, which hides nothing for good because the page scrolls above it. The card covers only the lower right of the viewport, and with the bottom padding any content can be scrolled into the space above it. Cost, with the cannon's band scrolled to the top: at 1,280 × 720 the card covers the right two thirds of the three sliders (68 %) and their number fields, «Órbita circular» and «Elipse muy alargada», and half of the other presets; «Disparar», «Borrar trayectorias» and «Mostrar trayectoria prevista» stay visible. At 1,440 × 900 only the height's slider (28 %) and field, «Órbita circular», «Elipse muy alargada» and half of «Escapa de la Tierra» are covered. The learner fires with «Disparar», scrolls the rest above the card or closes it, and the tutor sets the sliders itself through `LessonControls`.
    - **The button stays visible** while the panel is open, as a toggle: «Preguntar al tutor», with `aria-expanded` and `aria-controls`, fixed at the bottom right; from 1,280 px the card opens above it, as in chat widgets, and below it the toggle sits above the sheet. The panel is non-modal, so focus can leave it, and this is the keyboard user's short way back. Its name does not change with the state, which `aria-expanded` already carries, because a name that changes under focus is announced inconsistently. The page keeps a bottom padding as tall as the button, so the button never hides the last content.
    - **Non-modal at every width.** A `<dialog>` opened with `show()`, not `showModal()`: no focus trap and no inert page. The page must stay usable while the tutor talks, because the learner works the cannon while it explains and the tutor's own actions must be seen; a modal would make the page inert. Both placements leave the page visible, so non-modal is honest at every width.
    - **Opening and closing.** Opening moves focus to the panel's close button, explicitly (spec 05 moves it to the input). The close button, or Escape while focus is inside the panel, closes it, through a key handler in the panel, because a non-modal dialog does not close on Escape by itself; Escape on the page leaves it open, since the learner may be working there. Closing returns focus to the toggle. It opens and closes in place, without animation.
    - **Placeholder:** the heading «Tutor», «Aquí podrás conversar con un tutor sobre la lección. Llegará pronto.», and «Cerrar el tutor» on the close button; all in `src/content/es.ts`.
    - **Spec 05** replaces the placeholder with the conversation. **Superseded by spec 05, Decision 11:** the placeholder text is gone, and opening focuses the input from 1,280 px (the close button below it, as written above). The rest of this decision (placement, sizes, non-modal, Escape, the toggle) holds as built.

### The whole page

16. **Strings, colours and accessibility as in spec 03.** Every string lives in `src/content/es.ts`, numbers use Spanish formatting, and colours come from the theme tokens. All controls are native elements with Spanish labels and visible focus. The cannon's sliders have value texts with units ("7,91 km/s, 28.476 km/h"), and the canvas has a text alternative describing the last launch. The cannon's number fields share the panel's background, so their border is what identifies them, and WCAG 1.4.11 asks it for 3:1: the fields, and for consistency the presets, «Borrar trayectorias», the badges and the outcome label, are bordered with the `muted` token (5.4:1 on the surface), not `line` (1.3:1). Axe does not check this criterion, so an E2E test does.
17. **`src/cannon` is pure, like `src/orbits`.** Units, the launch state, the outcome, the trajectory, the presets and the controller's validation live in a new domain folder with the same boundary rules (spec 02, Decision 8). It is shared by the lesson and by the home page's cannon thumbnail (see "Changes to spec 03"). The React wiring of the controller lives in the `/gravitation` route.
18. **The lesson's text follows the design note's physics accuracy notes.** Equal forces are never described as unequal: the text of `#mutual` never says that one body pulls harder or more weakly, although its question asks who pulls harder and a wrong option answers it. The apple is presented as Newton's own story; fall distances are "in one second", never "per second"; distances in the inverse square are from the Earth's centre, never heights above the surface.

## The lesson's controls (shape, not final code)

```ts
type SectionId = "falling" | "mutual" | "moon" | "orbit" | "cannon" | "law";

type CannonOutcome = "ballistic" | "circular-orbit" | "elliptical-orbit" | "escape";

type CannonField = "speedKmPerSecond" | "angleDegrees" | "altitudeKm";

type CannonSettings = {
  readonly speedKmPerSecond: number;
  readonly angleDegrees: number;
  /** The launch point's height above the ground. */
  readonly altitudeKm: number;
};

/** Absent fields keep their current value. */
type CannonRequest = {
  readonly speedKmPerSecond?: number;
  readonly angleDegrees?: number;
  readonly altitudeKm?: number;
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

The controls reach the page's components through one React context. The rules (validation, clamping, rounding, the outcome, the session's state changes) are pure functions with unit tests; the context only wires them to the store and to the page's view (scrolling, focus and the anchor), the one module that touches the DOM. The session lives in a small external store read with `useSyncExternalStore`, not in `useState` as the gallery's does, so that `current()` right after `launch()` already returns the new state, as the tutor needs. `goToSection` rejects an unknown part with the reason "must be one of falling, mutual, moon, orbit, cannon, law".

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| L1 | `/gravitation` is one static page with its title, its lead and, in order, the sections `#falling`, `#mutual`, `#moon`, `#orbit`, the `#cannon` band and `#law`, each with its heading and anchor; a URL with an anchor opens at that part; any path below `/gravitation` is a 404; the home page and the header link to the lesson. | §02, Decision 1 | E2E: "the lesson is one page with its sections in order", "an anchor opens its part", "a path below /gravitation is a 404"; spec 03 G1 |
| L2 | The learner answers in any order, or not at all, by mouse and keyboard; answers and cannon settings reset on reload. | Decisions 2 and 3 | E2E: "questions can be answered in any order", "the lesson's state resets on reload" |
| L3 | The five questions are those of "Questions and misconceptions"; every wrong option names a misconception; the correct option is graded correct; one click on an option answers and shows its explanation; the first answer is the one recorded. | Decision 5 | `questions.test.ts`: "every wrong option names a misconception", "grades each option"; `lesson-session.test.ts`: "a question keeps its first answer"; E2E: "one click answers and shows the explanation" |
| L4 | The learner profile records, per question, "correct", the misconception chosen or "unknown", with the question's concept. | Decision 6 | `learner-profile.test.ts`: "an unanswered question is unknown", "records the misconception chosen", "names each question's concept" |
| L5 | Unit conversion: one engine speed unit is 7.910 km/s (to 0.001) and one time unit 805.5 s (to 0.1); km/s to engine units and back returns the input within 1e-12 relative. | Decision 7 | `units.test.ts` |
| L6 | The outcome follows Decision 9, launching from 10 km. Horizontal: 0 and 7.90 km/s ballistic, 7.91 and 7.94 km/s circular, 7.95 and 8.00 km/s elliptical, 11.17 km/s elliptical, 11.18 km/s escape. Straight up: 11.17 km/s ballistic, 11.18 km/s escape. From 3° up, nothing below 11.18 km/s orbits. At every height from 10 to 2,000 km, in steps of 10 km, a horizontal shot at that height's circular speed, rounded up to 0.01 km/s, is a circular orbit, and one at its escape speed, rounded up, escapes. | Decisions 8 and 9 | `outcome.test.ts`: one test per boundary, named by it, "3° and up never orbit below escape" and "at every height, the circular and escape speeds give their outcomes" |
| L7 | The reference speeds come from the model for the current height. At 10 km they round to the shown values: circular 7.9 km/s, escape 11.2 km/s; at 2,000 km, 6.9 and 9.8 km/s. | Decisions 8 and 11 | `presets.test.ts`: "reference speeds match the model", "reference speeds follow the height"; E2E: "the reference speeds are shown on the canvas", "the reference speeds follow the height" |
| L8 | The simulated trajectory agrees with the computed outcome, over speeds from 0 to 15 km/s in steps of 0.5 km/s and angles of 0°, 30°, 60° and 90°, plus 7.91 and 7.94 km/s at 0° (the grid has no circular launch). Ballistic shots reach the surface before one turn. Circular ones stay within 1 % of their mean radius for one period. Elliptical ones return to the launch point after one period, within a tolerance measured as in spec 01 ("Measured tolerances"): 2e-6 radii, ten times the largest error measured, 2.0e-7 at 11.0 km/s (1.3e-8 at half the step; Verlet at the same step: 2.1e-5 at 8 km/s). Escaping ones pass 20 radii. Launches within 1 % of the escape speed are left out: the slowest kept, 11.0 km/s, already needs 127,000 steps for one period. In the engine, 7.90 km/s horizontal reaches the ground and 7.91 km/s completes a period above its launch radius. | Decisions 8, 9 and 10 | `trajectory.test.ts`: "the simulation agrees with the outcome", "7.90 km/s horizontal reaches the ground in the engine", "7.91 km/s horizontal completes a period above its launch radius"; the suite's time and the tolerance recorded in "Results" |
| L9 | Each of the five presets gives its outcome, from 10 km, and the long ellipse stays whole in view. | Decision 11 | `presets.test.ts`: "each preset gives its outcome", "the long ellipse stays in view"; E2E: "each preset shows its outcome label" |
| L10 | The cannon controller validates its input. A non-finite speed, angle or height is rejected with the field named, and nothing changes. Out-of-range values are clamped and listed in `clamped`. Values are rounded to 0.01 km/s, 1° and 10 km, with no float noise. An absent field keeps its current value. `set` applies without firing; a launch returns the applied values and the outcome. | Decisions 12 and 13 | `src/cannon/controls.test.ts`: one test per rule, including "50 km/s is clamped to 15", "7.9049 km/s is applied as 7.90", "every rounded speed equals its two-decimal literal" (all 1,501 speeds), "0 km is clamped to 10", "5 km rounds to 10 and is not reported as clamped" and "2,004 km is applied as 2,000" |
| L11 | Navigation through the controller validates the part, scrolls to it and, with the tutor's panel closed, focuses its heading, without a history entry; with the panel open, focus stays in it and the move is announced, again if repeated; after it `current()` returns that part; `current()` is the part at the top of the viewport, and the last part at the bottom of the page. A tutor's launch while the cannon is out of view scrolls to it first; the band's own launch never scrolls the page or adds a history entry. | Decisions 12 and 14 | `section-position.test.ts`: "the part at the top is the last one whose top is above the line", "a part just scrolled to counts as at the top despite rounding", "at the bottom of the page, it is the last part", "at least 90 % visible", "less than 90 %", "a rect taller than the viewport is measured against the viewport"; `lesson-controls.test.ts`: "rejects an unknown part", "goToSection navigates for a valid part only", "current() is the part at the top of the viewport", "a launch from another part moves to the cannon", "a launch with the cannon in view does not scroll", "a rejected launch does not scroll", "with the tutor closed, goToSection focuses the part's heading", "with the tutor open, goToSection keeps focus in the panel and announces the part", "a tutor's launch out of view moves to the cannon by the same rule"; `section-position.test.ts`: "with the sheet open, the cannon is measured against the page above it"; E2E: "launching from the band neither scrolls the page nor adds a history entry". Driving it from the tutor is covered by spec 05's E2E. |
| L12 | The launch button, the presets and the controls change the cannon only through the session's transitions, which the controller also uses. | Decision 12 | Code review; E2E: "launching from the controls shows the outcome label" |
| L13 | The cannon works by mouse and keyboard; in the speed field and the speed slider the arrow keys change the speed by 0.01 km/s, and a typed value is applied; the angle and the height work the same way, by 1° and 10 km; the outcome label appears when the outcome is visible and is announced in a live region; the canvas has a text alternative; with reduced motion the path is drawn complete at once, and the pictures of `#falling` and `#mutual` show their final frame. | Decisions 4, 11 and 16 | E2E: "the cannon works with the keyboard", "the speed field adjusts by 0.01 km/s", "the height field adjusts by 10 km", "the outcome is announced", "reduced motion draws the path at once", "reduced motion shows the two pictures at rest" |
| L14 | Withdrawn (the `#moon` slider was dropped, Decision 4). | Decision 4 | — |
| L15 | Layout: the tutor's toggle is visible at every width, open or closed, and opens a non-modal panel that hides nothing for good and never moves the page: from 1,280 px a floating card at the bottom right, above the toggle; below, a bottom sheet with the page above it; both with a bottom padding, so the end of the last part scrolls above them. Opening focuses the close button below 1,280 px, and the input from 1,280 px (spec 05, Decision 11); the close button, or Escape inside the panel, closes it and returns focus to the toggle; Escape on the page leaves it open. No axe violations with the panel open at 360 and 1,280 px. From 1,024 px each part's text and picture sit side by side, alternating; narrower, the heading, the text, the picture and the question, in that order. A hairline and equal space separate every pair of parts, the `#cannon` band included. At 360 px, 768 px and 1,280 px there is no horizontal scroll, and the controls stay inside the viewport, not overlapping, with targets of at least 24 × 24 CSS px. | Decisions 1, 4 and 15, §04 | E2E (`tutor.spec.ts`): "the tutor button opens the panel and the page stays usable", "Escape inside the panel closes it and focus returns to the toggle", "the close button closes it and focus returns to the toggle", "Escape on the page leaves the panel open", "the toggle stays visible while the panel is open", "from 1,280 px the panel floats at the bottom right, above the toggle" (1,280 × 800 and 1,280 × 720 px), "opening and closing the panel does not move the page" (1,280 px), "below 1,280 px the panel is a bottom sheet and the page above stays visible" (360, 768 and 1,024 px), "with the panel open, the end of the last part scrolls above it" (360 and 1,280 px), "no axe violations with the panel open" (360 and 1,280 px); E2E at three viewports, as spec 03 G9: "on a phone each part reads title, description, picture, question", "from 1,024 px each part's text and picture sit side by side"; screenshots for visual review |
| L16 | Accessibility: no axe violations on the lesson page, before and after answering; every control has a label; focus is visible; the cannon's number fields have borders of at least 3:1 against the panel (WCAG 1.4.11). | §04, Decision 16 | E2E with axe (WCAG 2.1 A and AA), added to spec 03's sweeps; E2E: "the cannon's number fields have borders of at least 3:1" |
| L17 | Every string comes from `src/content/es.ts`, and colours only from the theme tokens. | Decision 16 | spec 03 G11's checks, which already cover `src` |
| L18 | `src/cannon` imports nothing from React, Next.js or Node, uses no DOM globals, and outside its own files imports only `@/physics`. | Decision 17 | Biome rules in CI, extended from spec 02 Decision 8; `environment.test.ts` |
| L19 | The lesson's text respects the physics accuracy notes of the design note. | Decision 18 | Every sentence that states a physical fact is listed in "Physics accuracy review (L19)" with its check, reviewed by a human, and recorded in "Results"; `lesson-text.test.ts`: "no lesson text says 'por segundo'" (the other rules depend on meaning, so they stay in review) |
| L20 | Answering moves focus to the explanation; «Ver opciones» shows the options again with the first answer marked «(Tu respuesta)» and moves focus to the first option; clicking another option shows its explanation without changing the recorded answer. | Decision 5 | E2E: "answering moves focus to the explanation", "Ver opciones shows the options and keeps the first answer"; `learner-profile.test.ts`: "browsing other options does not change the profile" |
| L21 | The animations of `#falling` and `#mutual` loop, each has a «Pausar»/«Reanudar» button at the corner of its own drawing that stops only that animation, and with reduced motion there is no animation and no button. | Decision 4, WCAG 2.2.2 | E2E: "the animations loop", "pausing stops only its own animation", "reduced motion shows the two pictures at rest" |
| L22 | Nothing moves when a question is answered, when «Ver opciones» is used or when another option is chosen: the box, the picture beside it and every section below keep their position and height, in every part, at 360 px and at 1,280 px. | Decision 5 | E2E: "answering moves nothing", measuring the boxes' position and height before and after, in document coordinates |
| L23 | The `#cannon` band is reachable from the lead's link, and the tutor can navigate to it (L11). Below its title, a one-line description invites the learner to try it (for screen readers only below 640 px). It spans the whole container at 1,280 px, with the controls beside the canvas, and stacks at 360 px, with the controls below. The launch button and «Borrar trayectorias», as wide, come first among the controls, and each setting's slider, field and unit share one row. It holds no questions. The page has no horizontal scroll at 360, 768 and 1,280 px, and no axe violations. | Decisions 1 and 4, §04 | E2E: "the lead links to the cannon", "the cannon band invites the learner to try it", "the cannon band spans the container at 1280 px and stacks at 360 px", "the launch and clear buttons come first and each setting is one row", "no horizontal scroll: lesson" at three widths, axe on `/gravitation` (L16) |
| L24 | The predicted path is on by default and drawn in the theme's accent. When it is on, it is the trace that a launch with the current settings would record, it follows the controls and it is recomputed at most once per frame. It never fires, adds no launch, shows no outcome label and leaves the canvas's text alternative unchanged. It resets on reload. | Decision 11 | `cannon-view.test.ts`: "the predicted path is the trace a launch records" (the five presets and 10.05 km/s), "is the engine's trace with the view's stop radius" (a preset and 10.05 km/s); `lesson-session.test.ts`: "the predicted path starts shown", "hiding the predicted path changes nothing else"; E2E: "the predicted path is on by default", "the predicted path is drawn in the theme's accent", "with the toggle off, moving a control draws no path", "the predicted path follows the speed control and never fires", "the predicted path resets on reload"; once per frame: code review |

## Changes to the visual style

`docs/design/visual-style.md` gets one new colour token, `apple` (`#e5484d`, a red), used only for the apples of the lesson's illustrations. The palette had no red, and an apple that is not an apple is hard to read. It is defined in the theme like the others (spec 03, Decision 3), so no component hardcodes it, and it has a use only in `#falling` and `#mutual`. The design note's "Motion" section also changes: besides the home hero, the two looping illustrations of the lesson move on their own, with a pause button (Decision 4).

## Changes to spec 03

- **The canvas pieces the cannon reuses move to `src/drawing`:** the world-to-canvas transform, the animation loop, the sizing and the theme colours, as spec 03 Decision 5 planned for when Part A uses them. The reduced-motion hook moves to `src/components`, since it is React. The trail and the drawing functions stay in the detail route: the cannon reveals a traced path instead of a trail, and draws open paths and the Earth.
- **The home page's cannon thumbnail uses `src/cannon`.** `(home)/newton-cannon.ts` moves its trajectory into `src/cannon`, so there is one cannon simulation. The thumbnail keeps its taller, illustrative launch point (1.35 radii), which it passes as a parameter.
- **The home page's cards are short:** a title, a line or two and an arrow, with the two plates the same size and at the same place (`docs/design/visual-style.md`, "Section card (home)"). The lesson card opens `/gravitation` from the top, like the header (Decision 1).
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
| `src/app/gravitation/page.tsx`, `layout.tsx` | The static lesson page: title, lead, the five sections of the reasoning and the `#cannon` band in order; the layout that wraps it in the lesson's provider, beside the tutor's toggle and panel |
| `src/app/gravitation/lesson-session.ts`, `lesson-store.ts`, `lesson-controls.ts`, `lesson-provider.tsx` | The session's state and pure transitions; the external store; `LessonControls`; the React context that wires them to scrolling |
| `src/lib/lesson/section-ids.ts`, `questions.ts`, `learner-profile.ts` | The parts' ids and order; the questions and their grading; the profile (Decisions 1, 5 and 6). In `src/lib` because the tutor's route (spec 05) uses them too. Not `sections.ts`, which would sit beside the `sections/` folder |
| `src/app/gravitation/section-position.ts` | The part at the top and whether a rect is mostly visible (Decision 14) |
| `src/app/gravitation/sections/lesson-section.tsx`, `section-illustration.tsx`, `section-intro.tsx`, `section-questions.tsx` | What every part shares: its two columns, with the title, description and questions beside the picture; an SVG picture with its text alternative and caption; the description; the part's questions |
| `src/app/gravitation/sections/check-question.tsx`, `question-explanation.tsx`, `pausable-animation.tsx` | A question with «Ver opciones» and reserved height; the verdict and explanation of one option; the pause button of a looping animation |
| `src/app/gravitation/sections/falling-section.tsx`, `mutual-section.tsx`, `moon-section.tsx`, `orbit-section.tsx`, `law-section.tsx` | The parts of the reasoning, one component each: its title, description, picture and questions, rendered by the page (`sections` has no `page.tsx`, so Next.js does not turn it into a route) |
| `src/app/gravitation/sections/falling-picture.tsx`, `mutual-picture.tsx`, `moon-picture.tsx`, `orbit-picture.tsx`, `law-picture.tsx` | The picture of each part |
| `src/app/gravitation/sections/falling-tree.tsx`, `falling-line-to-centre.tsx`, `falling-geometry.ts`, `mutual-arrow.tsx` | The pieces of the two drawings that have them: a tree with its apple and a line to the centre, with the drawing's measurements shared by the three files of `#falling`; a force arrow |
| `src/app/gravitation/sections/cannon-band.tsx`, then `cannon-panel.tsx`, `setting-row.tsx`, `number-field.tsx`, `cannon-canvas.tsx`, `reference-speed-badges.tsx`, `responsive-text.tsx`, `cannon-outcome-label.tsx`, `predicted-path-toggle.tsx`, `cannon-animation.ts`, `cannon-draw.ts`; `src/app/gravitation/cannon-view.ts`, `outcome-label.ts` | `#cannon`: the band, its controls, the predicted path's toggle, the canvas and its animation, the drawing; the view radius, the stop radius and the one trace shared by a launch and the predicted path; whether a shot's label says that it comes back (Decision 11) |
| `src/app/gravitation/tutor-toggle.tsx`, `tutor-panel.tsx`, `tutor-space.tsx`, `tutor-ids.ts` | The tutor's toggle and its panel, and the page's bottom padding for them, one component each, and the ids by which the toggle and the page's view find the panel, rendered by the layout inside the provider, which holds whether the panel is open and its last announcement; the panel is portalled to `body`, outside `<main>`, so its heading stays out of the lesson's outline, and mounts once the page hydrates (Decision 15) |
| `src/components/use-hydrated.ts`, `src/app/gravitation/lesson-view.ts` | Controls disabled until the page hydrates; the page's view for the controller: scrolling to a part and replacing the anchor, focusing its heading or announcing it, whether the tutor's panel is open, the part at the top and whether the cannon is in view (Decision 14) |

The tutor's conversation, route and tools, which spec 05 added to the same folder, are in spec 05's file table.

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

To be reviewed and signed by a human, and recorded in "Results". Every sentence that states a number or a physical fact, where it appears and how it was checked; the other feedback texts restate these facts. **Review** marks where a sentence rounds, simplifies or claims more than the source it rests on, so the reviewer looks there first. The tutor's replies are not in this table: spec 05 (T3, T13) covers its instructions and its eval.

| # | Where | Sentence | Check |
|---|---|---|---|
| 0 | Page lead | «La fuerza que hace caer una manzana es la misma que mantiene a la Luna en su órbita. Aquí verás cómo llegó Newton a esa idea y a la ley que la describe. Si prefieres aprender probando, ve directo al cañón y descúbrelo por ti mismo.» | Universality, the point of the lesson (accuracy note 3) |
| 1 | `#falling`, text | «Cuenta Newton que la idea se le ocurrió al ver caer una manzana: ¿por qué cae siempre hacia el suelo, y nunca de lado? Fíjate en dos manzanas que caen lejos una de otra: una en Madrid y otra en Bali.» | Newton's own question, as he told it to Stukeley in 1726: why the apple descends perpendicularly to the ground, never sideways or upwards (accuracy note 2). The question about the two falls is the lesson's, not attributed to him. Madrid and Bali are 117° apart along the surface (great-circle distance: 117.5° from Madrid, 40.4° N 3.7° W, to Denpasar, 8.7° S 115.2° E), which the drawing shows. **Review:** the source and date of Stukeley's account, and the wording «cuenta Newton», which I could not check against the text here |
| 2 | `#falling` question, correct feedback | «En una Tierra redonda, «abajo» significa «hacia el centro de la Tierra»: todo lo que cae, cae hacia el centro.» | A plumb line is off by at most about 0.2°, irrelevant here |
| 3 | `#mutual`, text | «Newton dio un paso más: todo lo que tiene masa atrae a todo lo demás. La Tierra atrae a la manzana, y la manzana también atrae a la Tierra.» | Universality and the third law (accuracy notes 1 and 3) |
| 4 | `#mutual`, caption | «Dos fuerzas iguales: para una manzana de 100 g, de alrededor de 1 newton cada una.» | 0.1 kg × 9.8 m/s² = 0.98 N |
| 5 | `#mutual` question, correct feedback | «Las dos fuerzas son iguales. Esa fuerza acelera a la manzana 9,8 m/s² y a la Tierra unos 1,6 × 10⁻²⁵ m/s², porque la Tierra tiene muchísima más masa.» | 0.98 N / 5.97 × 10²⁴ kg = 1.6 × 10⁻²⁵ m/s² |
| 5b | `#mutual` question, «La manzana» feedback | «La manzana se mueve mucho más, pero no porque sufra más fuerza: las dos fuerzas son iguales, y la manzana tiene muchísima menos masa.» | a = F/m: the same force, very different masses |
| 6 | `#moon`, text | «Si todo lo que tiene masa se atrae, la Tierra también atrae a la Luna. Pero la Luna está unas 60 veces más lejos del centro de la Tierra que la manzana.» | Universality; 384,400 / 6,371 = 60.3, from the centre |
| 6b | `#moon`, caption | «La Tierra y la Luna, a escala entre sí. La distancia está acortada: en realidad es de unos 60 radios terrestres.» | The Moon's radius is 1,737 / 6,371 = 0.27 of the Earth's; 60.3 radii |
| 7 | `#moon` question, correct feedback | «El doble de lejos, 2 × 2 = 4 veces más débil. La Luna, 60 veces más lejos, recibe 3600 veces menos: en un segundo se desvía hacia la Tierra 1,4 mm, frente a los 4,9 m que cae la manzana.» | ½ · 9.8 · 1² = 4.9 m; 4.9 / 3600 = 1.36 mm, which matches the orbit: 4π²r/T²/2 = 1.36 mm; "en un segundo", never "por segundo"; 60.34² = 3,640, so 3600 is Newton's rounding of 60²; distances from the centre. **Review:** the sentence says «60 veces» and «3600 veces» without «unas», as exact figures; the real ratios are 60.3 and 3,640 |
| 8 | `#moon` question, wrong options' feedback | «…la atracción baja con el cuadrado de la distancia. El doble de lejos, 4 veces más débil; la Luna, 60 veces más lejos, recibe 3600 veces menos.» | Inverse square; the three wrong options (half, same, double) share this correction, adapted to what each believed. **Review:** the same «60 veces» and «3600 veces» without «unas» as row 7 |
| 9 | `#orbit`, text | «Entonces, si la Tierra atrae a la Luna, ¿por qué no se cae? Newton lo pensó con un cañón en lo alto de una montaña.» | Newton's thought experiment (*A Treatise of the System of the World*); the question is rhetorical, and the lesson's answer is that the Moon does fall |
| 10 | `#cannon` band, caption | «Al principio, el cañón dispara desde una montaña de 10 km, algo más alta que el Everest; puedes subirla hasta 2.000 km. Aquí no hay aire que frene la bala.» | Everest is 8.849 km, so 10 km is 13 % higher; drag is out of scope and the caption says so. **Review:** «Aquí no hay aire» is true of the simulation only; at 10 km the real atmosphere is thin but present |
| 10a | `#cannon` band, description | «Dispara y compruébalo tú mismo: la bala siempre cae hacia la Tierra, pero si va de lado lo bastante deprisa, nunca llega al suelo y entra en órbita.» | The lesson's answer in `#orbit`: an orbit is a fall that never reaches the ground. **Review:** «lo bastante deprisa» leaves out that a much faster shot escapes, which the badges and the presets show |
| 11 | `#cannon` band, reference speed badges | «Para orbitar: ≈ 7,9 km/s», «Para escapar: ≈ 11,2 km/s» | L7: 7.904 and 11.177 km/s at 10 km; computed again for every height, 6.900 and 9.759 km/s at 2,000 km. "Orbitar" here means circling without reaching the ground: the shot still falls, as `#orbit` says |
| 12 | `#cannon` band, outcome label of a bound shot that leaves the view | «Órbita elíptica: se aleja mucho, pero vuelve.», «Cae al suelo: se aleja mucho, pero vuelve.» | Below the escape speed the energy is negative, so the shot turns back; shown only when its trace passed the stop radius (`outcome-label.test.ts`) |
| 13 | `#orbit` question, "no gravity" feedback | «Sí la hay: a la altura de la Estación Espacial, la gravedad es casi el 90 % de la de la superficie. Los astronautas flotan porque caen a la vez que la estación.» | (6,371 / 6,791)² = 0.880 at 420 km. **Review:** «casi el 90 %» rounds 88 % up |
| 14 | `#orbit` question, correct feedback | «La Luna cae hacia la Tierra, pero se mueve de lado tan deprisa, alrededor de 1 km/s, que nunca llega al suelo.» | Orbital speed 1.023 km/s, from 2π · 384,400 km / 27.32 days |
| 15 | `#orbit` question, "pushed" feedback | «La Tierra no empuja a la Luna: solo la atrae. No hace falta ninguna fuerza hacia fuera; basta con que se mueva de lado.» | In an inertial frame there is no outward force |
| 16 | `#orbit` question, "does not reach" feedback | «Sí llega: más arriba viste que allí la atracción es unas 3600 veces más débil, pero no desaparece. Esa atracción es la que curva su camino.» | Gravity has no cutoff; 1/60.3² = 1/3,640. **Review:** «unas 3600», rounded as in row 7 |
| 17 | `#law`, text | «Todo junto: la fuerza crece con cada masa y se debilita con el cuadrado de la distancia entre sus centros.» | "Centres" holds for spheres (shell theorem) |
| 18 | `#law`, line on G | «G es la constante de gravitación universal, la misma en la Tierra y en el cielo.» | Universality (accuracy note 3) |
| 19 | `#law`, caption | «Su valor es de unos 6,67 × 10⁻¹¹ N·m²/kg².» | CODATA 2018: 6.674 × 10⁻¹¹ |
| 20 | `#law` question, correct feedback | «La fuerza se duplica, pero también la masa que hay que mover, así que la manzana cae igual de deprisa.» | a = F/m, neglecting the Earth's acceleration (1.6 × 10⁻²⁵ m/s² for the apple) and air. **Review:** «igual de deprisa» holds for the apple's fall, not exactly for the pair's approach |
| 21 | `#law`, spoken form | «La fuerza es igual a G por la masa de la manzana por la masa de la Tierra, dividido entre el cuadrado de la distancia entre sus centros.» | Reads F = G · m₁ · m₂ / r² as the law states it, centres of spheres |
| 22 | Home page, lesson card | «La ley de Newton explica por qué la fuerza que hace caer una manzana mantiene a la Luna en órbita. Compruébalo con el cañón de Newton y un tutor que se adapta a ti.» | Universality, as row 0 |
| 23 | `#falling` question, wrong options' feedback | «Fíjate en las líneas: las dos caídas no son paralelas, se cruzan en el centro de la Tierra.», «Ninguna va hacia el polo sur.», «Sus direcciones son distintas, pero apuntan al mismo sitio: el centro de la Tierra.» | Radial directions meet at the centre; same check as row 2. Neither Madrid (40° N) nor Bali (9° S) falls towards the pole |
| 24 | `#mutual` question, «La Tierra» and «Solo tira la Tierra» feedback | «…la manzana atrae a la Tierra con la misma fuerza con que la Tierra atrae a la manzana.», «La atracción siempre es mutua: la manzana también atrae a la Tierra, y con la misma fuerza.» | Newton's third law (accuracy notes 1 and 3) |
| 25 | `#law` question, «Cuatro veces mayor» and «La misma» feedback | «Solo la distancia va al cuadrado. Cada masa cuenta una vez: el doble de masa, el doble de fuerza.», «Es verdad que caería igual de deprisa, pero porque la fuerza se duplica a la vez que la masa que hay que mover. La fuerza es el doble.» | F = G·m₁·m₂/r² is linear in each mass; a = F/m, as row 20 |
| 26 | `#mutual`, text alternative of the picture | «…Solo la manzana se mueve.» | The Earth's acceleration is 1.6 × 10⁻²⁵ m/s² (row 5). **Review:** «solo la manzana se mueve» is stricter than the design note's «la Tierra apenas se mueve»; the Earth does move, imperceptibly |
| 27 | Cannon, speed slider's value text | «7,91 km/s, 28.476 km/h» (the format for any speed) | 7.91 km/s × 3,600 s/h = 28,476 km/h |

### Left to visual review

- The path colours and the number of faint paths (Decision 11).
- The timing of `#falling`'s sequence, and whether 1,024 px leaves each part's text and picture enough room side by side (Decision 4).

## Results

Measured on 2026-10-27, Apple M2 Pro, Node 24.22.1.

### The simulation agrees with the outcome (L8)

`trajectory.test.ts`, "the simulation agrees with the outcome": 126 launches (the 31 speeds at 4 angles, plus 7.91 and 7.94 km/s at 0°), all agreeing with `launchOutcome`.

| Outcome | Launches |
|---|---|
| Ballistic | 85 |
| Circular orbit | 2 |
| Elliptical orbit | 7 |
| Escape | 32 |

- **Return error of the elliptical orbits:** the largest is 2.0e-7 radii, at 11.0 km/s and 0°, ten times below the test's tolerance (2e-6).
- **Time:** the grid test takes about 1.4 s, and the whole file about 3 s.

### Controls at three widths (L15)

The sweep in `responsive.spec.ts` ("lesson controls stay inside the viewport, apart, with 24 px targets") measures every visible button, input and select of `/gravitation`, the tutor's toggle included, at 360, 768 and 1,280 px. It found one failure at all three widths: the label of «Mostrar trayectoria prevista» was 20 px tall. It now has `min-h-6`, and the sweep passes: no control leaves the viewport, none overlaps another, and all are at least 24 × 24 px.

### Closing check (2026-10-28)

Run on the production build: `pnpm typecheck`, `pnpm lint`, `pnpm exec biome ci`, `pnpm test` (778 tests in 52 files), `pnpm build` and `pnpm test:e2e` (197 tests) all pass. Every criterion whose Verification names tests (L1 to L11, L13, L15, L16, L20 to L23 and the tests of L24) has them, all present and passing. Exceptions:

| Criterion | State |
|---|---|
| L8 | Met. Its text carried 5.5e-8 radii, an estimate written before the test existed; the test measured 2.0e-7 and the criterion now says so |
| L12 | Met, by code review: the launch button and the presets call `useLaunchCannon`, and the controls call the controller's `set`; no component changes the cannon's state itself |
| L14 | Withdrawn |
| L15 | Met. «Opening focuses the close button» holds below 1,280 px only; from there it focuses the input (spec 05, Decision 11), and the criterion says so |
| L17, L18 | Met by the checks they name (`src/theme.test.ts` and Biome's rules, `environment.test.ts`), which run in `pnpm test` and `pnpm lint` |
| L19 | Met. Reviewed by a human: Mauricio Viera, 2026-10-28 |
| L24, "once per frame" | Met, by code review of the predicted path's scheduling in the cannon's canvas |

### Keyboard and contrast pass (L15, L16)

At 360 and 1,280 px, from the production build, by keyboard only, with the tutor:

- **Tab stops:** 40 on the page at both widths, under the 60 that `accessibility.spec.ts` walks, so its focus test reaches the last one (the tutor's toggle) and needs no change. Each has a 2 px accent ring.
- **Order:** the header, the lead's link, then each part's picture control and question in the order of the page, the cannon's controls in the order of Decision 8, the toggle last. Not a failure, and left as built: at 1,280 px `#falling`'s picture is on the right, and its «Pausar» comes before the question on the left, because the picture comes first in the document (Decision 4 sets that order for phones).
- **No trap:** with the panel open, Tab leaves it for the end of the page and Shift+Tab comes back; Escape inside it returns focus to the toggle. Answering with Enter moves focus to the explanation, which has no ring because it is not a control (Decision 5).
- **Tutor's panel:** opening focuses the input at 1,280 px and the close button at 360 px; Tab goes through the close button, the conversation (scrollable, with a ring), the input and «Enviar». The input shows its focus as a 2 px `strong` border, not a ring (visual style, "Focus").
- **Contrast of what axe does not check:**

| Pair | Ratio |
|---|---|
| Focus ring (`accent`) on `surface` / `surface-raised` / the canvas | 10.3 / 9.7 / 11.4 |
| Control borders (`muted`) on `surface` / `surface-raised` / the canvas | 5.9 / 5.5 / 6.5 |
| Input's focus border (`strong`) on `surface` / `surface-raised` | 16.2 / 15.1 |
| Card's border (`strong`) on the page | 16.6 |
| The input's placeholder (`muted`) on `surface` | 5.9 |

No failure found, so no code changed. `visual-style.md` said `muted` on `surface-raised` is about 5.3:1; it is 5.5:1, and now says so.

### Physics accuracy review (L19)

Mechanical check, before the human review: the sentences of the table match `src/content/es.ts` (five of them, rows 0, 11 and 12, are assembled in code from their parts, and read as the table says), and the numbers they state hold when recomputed:

| Claim | Recomputed |
|---|---|
| The apple falls 4.9 m in one second; 4.9 m / 3600 | 1.36 mm |
| The Moon's fall in one second, 4π²r/T²/2 | 1.36 mm |
| The Moon's distance in Earth radii, 384,400 / 6,371; its square | 60.3; 3,640 |
| The Moon's radius against the Earth's, 1,737 / 6,371 | 0.27 |
| Gravity at 420 km, (6,371 / 6,791)² | 0.88 |
| The Moon's orbital speed | 1.02 km/s |
| The force on a 100 g apple, 0.1 kg × 9.8 m/s² | 0.98 N |
| The Earth's acceleration under 0.98 N | 1.6 × 10⁻²⁵ m/s² |
| Madrid to Bali, great-circle angle | 117.5° |
| Circular and escape speeds at 10 km; at 2,000 km | 7.904 and 11.177; 6.900 and 9.759 km/s |
| 7.91 km/s in km/h | 28,476 |

Rows marked **Review** in the table are where the reviewer should look first: the Stukeley account (row 1), the exact «60 veces» and «3600 veces» (rows 7, 8 and 16), «Aquí no hay aire» (row 10), «lo bastante deprisa» (row 10a), «casi el 90 %» (row 13), «igual de deprisa» (row 20) and «solo la manzana se mueve» (row 26).

Reviewed by a human: Mauricio Viera, 2026-10-28.
