# Spec 05: Tutor (Part A)

Status: draft, 2026-10-27. Not approved.

## Goal

The AI tutor of the lesson at `/gravitation`. It replaces the placeholder in the panel of spec 04 with a conversation in Spanish: it explains, answers free questions, follows up on the check questions, adapts to the learner profile, and operates the lesson through the `LessonControls` of spec 04 (setting and launching the cannon, moving to a part), explaining what really happened. It runs on Gemini's free tier through the AI SDK, as the spike chose, behind a route handler that limits its own requests.

## Why it exists (from the brief)

- **§02 Part A:** "an AI tutor" alongside the lesson and its interactive element.
- **§04 Whole app:** responsive and accessible, which now includes a conversation.
- **§09 Criteria:** decisions with a known cost, clear code and solid typing.

Builds on spec 04 (the panel's shell, `LessonControls`, the learner profile, Decisions 12 to 15) and the tutor spike (`docs/research/tutor-spike.md`), whose findings are taken as measured and not repeated here.

## Decisions

### The model and the route

1. **AI SDK 7 and `gemini-3.5-flash-lite`, chosen by one variable.** The spike measured it as the only Gemini text model whose free tier fits a public site (15 requests per minute, 500 per day), with a first token in about 600 ms and reliable tool calls. `TUTOR_MODEL` holds `provider:model` in the AI SDK's registry syntax (`google:gemini-3.5-flash-lite`), so the provider and the model cannot disagree; the key keeps the provider's own name, `GOOGLE_GENERATIVE_AI_API_KEY`. A committed `.env.example` documents both, with a `!.env.example` exception in `.gitignore`. A missing key or an unknown model fails the request with `unavailable` and a server log naming the variable, never a silent default. Cost: one provider at a time; a second one means a package and a registry entry.
2. **One route handler, `POST /api/tutor`, on Node.** It validates the body, checks its rate limits, builds the instructions from the context the page sends (Decision 4), and streams the answer as a UI message stream. The key never leaves the server: the model's module imports `server-only`. Retries are off (`maxRetries: 0`): the spike showed that retrying a 429 spends quota and keeps the learner waiting 7 to 10 s for the same error. A request aborts after 20 s (`abortSignal`), because the spike saw one take 299 s to its first token; `maxDuration` is 30 s.
3. **The route validates the body and fails loudly.** The page is the only intended client, but the route is public. A body that is not `{ messages, context }` of the expected shape is a 400 naming the field. The conversation is capped at 30 messages: beyond that the route answers `too-long` instead of trimming, because trimming must keep tool calls with their results and Gemini's `thoughtSignature` (spike, "Other findings"), and a learner can start a new conversation (Decision 10). A message from the learner is at most 500 characters, enforced by the input and again by the route.

### What the tutor knows

4. **The page sends its context with every message; the model's memory holds none of it.** Each request carries the learner profile (`LessonControls.learnerProfile()`), the cannon's state (`cannon.current()`: settings and last launch) and the part at the top of the viewport (`navigation.current()`). The route turns it into a short block at the end of the instructions. This is the design note's rule (the profile lives in the app and is sent with each message), and it makes adaptation testable: the same context always gives the same instructions. Cost: some tokens per request, small next to the free tier's 250,000 per minute.
5. **The instructions are built from the lesson's own content.** One pure function writes them, in English (code and prompts are in English), and tells the model to answer in Spanish. They take the parts' ids and titles, each question with its options and the correct one, and the cannon's limits and presets from `src/content/es.ts`, `questions.ts` and `@/cannon`, so they cannot drift from the page. They state:
   - who the learner is (no physics background) and the tone: short answers, one idea at a time, no formulas unless asked;
   - **plain text only, no Markdown** (the panel shows text as it comes; see Risks);
   - the physics accuracy notes of the design note: equal forces are never unequal, the apple is Newton's own story, "en un segundo" and never "por segundo", distances from the Earth's centre;
   - how to use the profile: explain the misconception a wrong answer shows, offer to move on when a concept is already right, and give a hint first, not the answer, about a question still unanswered;
   - how to use the tools: act when the learner asks or when showing helps, then explain the result the tool returned, never a guessed one;
   - to stay on the lesson's subject, and to say briefly that it cannot help with anything else.

### What the tutor can do

6. **Three client-side tools, mapped one to one onto `LessonControls`.**

   | Tool | Input | Calls | Returns |
   |---|---|---|---|
   | `setCannon` | optional `speedKmPerSecond`, `angleDegrees`, `altitudeKm` | `cannon.set` | `SetResult` |
   | `launchCannon` | the same, all optional | `cannon.launch` | `LaunchResult` |
   | `goToSection` | `section` | `navigation.goToSection` | `NavigationResult` |

   The tools have no `execute`, so the model's call reaches the page, which runs it through the controller and sends back what really happened; the spike showed that without the result the model guesses. The schemas only say "a number" or "a string": the controller validates, rounds and clamps (spec 04, Decision 13), and its rejection goes back to the model as the tool's result, so the learner always gets a reply. One pure function dispatches a tool call to the controls; an unknown tool is a rejection naming it. Reading the state needs no tool, because it travels with every message (Decision 4).
7. **At most three tool calls per learner message.** After each tool result the page sends the conversation again automatically (`sendAutomaticallyWhen`), so a model that keeps calling tools would keep spending requests. The route counts the tool calls since the learner's last message, and from the third on it runs the model without tools, so it has to answer in text. Cost: a request such as "compare five speeds" gets three launches and an explanation.
8. **Every action is visible in the conversation.** Each tool call shows a short line built from its result, from `es.ts`: «Ajusto el cañón: 8,00 km/s, 0°, 10 km.», «Disparo el cañón a 8,00 km/s: órbita elíptica.», «Voy a «El cañón de Newton».», or «No he podido ajustar el cañón: …» for a rejection. The learner sees what the tutor did to the page, and a clamped value says so («15 km/s es el máximo»).

### Limits and errors

9. **The route limits its own requests, in memory.** The free tier's limits are shared by every visitor, so one learner could spend everyone's quota. The route keeps, per server instance, a limit per client (8 requests per minute, about four actions with their explanations; the client is the first address in `x-forwarded-for`) and a global one (12 per minute and 400 per day, below Google's 15 and 500). A request over a limit is refused before any model call, with `rate-limited` or `daily-limit`. Cost: on Vercel each instance counts on its own, so the limits are approximate, and Google's own 429 is still mapped (below); an external store would make them exact at the price of an account, a key and a dependency, which this project does not need yet.
10. **Errors reach the learner as Spanish text, from stable codes.** The route maps every failure to a code and the panel maps the code to text in `es.ts`, as the spike verified:

    | Code | When | The panel says, in short |
    |---|---|---|
    | `rate-limited` | over a per-minute limit, ours or Google's | Too many questions: wait a minute |
    | `daily-limit` | over the daily limit, ours or Google's (a per-day `quotaId`) | The tutor is out of questions for today |
    | `too-long` | more than 30 messages | Start a new conversation |
    | `unavailable` | anything else, including the 20 s timeout and a missing key | The tutor is not available; try again |

    Every error but `too-long` offers «Reintentar», which sends the last message again. The spike did not reach the daily limit, so its `quotaId` is checked in the plan against Google's documentation; until then a 429 that is not recognised as daily counts as `rate-limited`.

### The panel

11. **The panel holds the conversation, and keeps it until reload.** It replaces spec 04's placeholder inside the same dialog, at the same places and sizes (spec 04, Decision 15). The conversation lives in the panel's chat state, which stays mounted while the dialog is closed, so closing and reopening keeps it, and a reload starts over, like the rest of the lesson (spec 04, Decision 2). «Nueva conversación» in the header clears it.
    - **Opening** moves focus to the input, as spec 04 announced. Escape and the close button behave as in spec 04.
    - **The input** is a text area with a label: Enter sends, Shift+Enter adds a line, at most 500 characters. «Enviar» and Enter are disabled while an answer is on its way, and the input keeps its text if the request fails.
    - **While waiting,** a status line says «Pensando…» until the first words arrive.
    - **The messages** sit in a `role="log"` region, so screen readers hear each new message once. The message being streamed is `aria-busy` until it ends, so its words are not announced one by one. The tutor's text is shown as plain text, with its line breaks.
    - **Empty, it greets:** a fixed line from `es.ts` saying what the tutor can do, including operating the cannon. It is not generated, so opening the panel spends no request.
    - **A note on data,** always visible below the input: the tutor is an AI that can be wrong, and what the learner writes is sent to Google, whose free tier may use it to improve its products; so no personal data. The README says the same.
    - **The tutor's moves:** spec 04's navigation already keeps focus in the open panel and announces the part in its live region (Decision 14); this spec only drives it from the tools.

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| T1 | `POST /api/tutor` streams an answer to a valid body. A body without `messages` or `context`, or with either of the wrong shape, is a 400 naming the field; a learner message over 500 characters is a 400; more than 30 messages is `too-long`. | Decisions 2 and 3 | Route tests with the AI SDK's mock model: "streams an answer", one test per invalid field, "a message over 500 characters is refused", "31 messages are too long" |
| T2 | The model comes from `TUTOR_MODEL`; a missing key or an unknown model gives `unavailable` and a server log naming the variable; retries are off; a request aborts after 20 s with `unavailable`. | Decisions 1 and 2 | Route tests: "an unknown model names TUTOR_MODEL", "a missing key names the variable", "a model that does not answer in 20 s is unavailable" (fake timers) |
| T3 | The instructions name every part with its id and title, every question with its correct option, the cannon's limits and presets, the four accuracy rules, Spanish and plain text; the context block lists the profile (correct, the misconception, or unknown, per question), the cannon's settings and last launch, and the part at the top. The same context always gives the same instructions. | Decisions 4 and 5 | `instructions.test.ts`: one test per item, "a misconception is named in the profile", "the same context gives the same instructions" |
| T4 | Each tool dispatches to its control with its input unchanged and returns the control's result unchanged; a rejected input returns the controller's rejection; an unknown tool returns a rejection naming it. | Decision 6 | `tutor-tools.test.ts`: one test per tool, "a speed of 50 km/s comes back clamped", "a speed given as text is rejected by the controller", "an unknown tool is rejected" |
| T5 | From the third tool call since the learner's last message, the model runs without tools. | Decision 7 | Route test: "a fourth tool call is not offered" |
| T6 | Every tool call shows its line in the conversation, built from its result, including clamped values and rejections. | Decision 8 | `tool-lines.test.ts`: one test per tool and status; E2E: "a tutor's launch shows its line and its outcome" |
| T7 | Over 8 requests per minute from one client, 12 per minute or 400 per day in all, the route answers `rate-limited` or `daily-limit` without calling the model; the windows reset. | Decision 9 | `rate-limit.test.ts` with an injected clock: one test per limit, "the minute resets", "the day resets"; route test: "a refused request never calls the model" |
| T8 | A provider 429 per minute maps to `rate-limited`, a per-day 429 to `daily-limit`, anything else to `unavailable`, also inside a `RetryError`; the panel shows each code's text from `es.ts`, with «Reintentar» except for `too-long`, and keeps the learner's text. | Decision 10 | `error-codes.test.ts` with the spike's error shapes as fixtures; E2E with the route mocked: one test per code |
| T9 | Driven by the tutor: a launch sets and fires the cannon and scrolls it into view when it is out of view; a move to a part scrolls there, and with the panel open focus stays in the input and the part is announced. | Decisions 6 and 11; spec 04, L11 | E2E with recorded streams: "the tutor launches the cannon", "the tutor's launch out of view brings the cannon into view", "the tutor moves to a part and focus stays in the panel" |
| T10 | Opening the panel focuses the input; Enter sends and Shift+Enter adds a line; the input stops at 500 characters; sending is disabled while waiting; «Pensando…» shows until the first words; the conversation survives closing and reopening, «Nueva conversación» clears it, and a reload starts over; the greeting and the data note are shown. | Decision 11 | E2E with recorded streams, one test per behaviour |
| T11 | The log announces each message once: the streaming message is `aria-busy` until it ends. No axe violations with a conversation, a tool line and an error shown, at 360 and 1,280 px; the panel's controls pass the L15 sweep. | Decision 11, §04 | E2E: "the streaming message is busy until it ends"; axe at both widths; `responsive.spec.ts` with the panel open |
| T12 | No browser code imports the model's module, and the key is never sent to the browser. | Decision 2 | `server-only` in the model's module, so a client import fails the build; code review |
| T13 | With the real model, a fixed set of prompts gives answers that respect the accuracy rules and use no Markdown, and the tool prompts call their tool. | Decisions 5 to 7 | `pnpm eval:tutor` (needs the key, not in CI): about ten prompts, each answer flagged for Markdown, "por segundo" and the expected tool; reviewed by a human and recorded in "Results" |
| T14 | The first token's latency on the deployment, through the route, is measured and recorded. | Spike, "Latency" | Measured on Vercel, recorded in "Results" |
| T15 | Every string comes from `src/content/es.ts`, and colours only from the theme tokens. | spec 04, Decision 16 | spec 03 G11's checks |

## Testing without the real model

CI has no key and must not spend quota. The route is tested with the AI SDK's mock model, which streams fixed parts and tool calls. The panel is tested in E2E with `/api/tutor` intercepted by Playwright and answered with UI message streams recorded once from the real model and committed as fixtures, so the tests read what the SDK really sends. The model's own behaviour, which no test can pin, is checked by `pnpm eval:tutor` and a human (T13).

## Out of scope

- **The free-text "explain it in your own words" question,** which spec 04 left here. Each grading would spend a request of the shared quota, and an LLM's grade is not deterministic, while the design note asks for grading done by the app. It can be a later spec.
- Keeping the conversation across reloads, and any account or history.
- Rendering Markdown (Decision 5 forbids it instead).
- Opening the panel on its own or suggesting the tutor after a question: only the toggle opens it (spec 04, Decision 15).
- Suggested prompts, voice, images and stopping an answer mid-stream.
- An exact rate limit across instances (Decision 9).
- A fallback model after a 429 (the spike's `gemini-3.1-flash-lite`): not tested, and it would double the requests a visitor can spend.
- English UI.

## Risks

- **The free tier is small and shared.** 500 requests a day, and a launch costs two. Mitigation: the route's limits (Decision 9), plain messages when they are reached (Decision 10), and the lesson works fully without the tutor.
- **Google may use the conversations.** Free-tier data may be used to improve Google's products. Mitigation: the note under the input and in the README, and the instructions never ask for personal data.
- **The model can still be wrong or use Markdown.** No test can prevent it. Mitigation: the instructions (Decision 5), the eval reviewed by a human (T13), and the data note says the tutor can be wrong. A stray `**` would show as asterisks.
- **The SDK changes fast.** AI SDK 7 already differs from most examples (spike, "Versions"). Mitigation: versions pinned, and the recorded streams fail the E2E tests if the stream format changes.
- **The limits are per instance.** Several instances could together exceed Google's limits. Mitigation: Google's 429 is mapped to the same message, so the learner sees the same thing either way.

## Decided in the plan

To be filled during planning: the file layout (the route in `src/app/api/tutor/`; what both the route and the lesson use, such as the tools' definition, the context's type and the error codes, in a new `src/lib/tutor/`; the panel's pieces in `src/app/gravitation/`), the dependencies' exact versions, how a refused request reaches `useChat` as a code, Google's per-day `quotaId`, and the Spanish texts of the greeting, the data note, the tool lines and the errors.

## Results

To be filled after implementation: T13's eval reviewed by a human, and T14's latency.
