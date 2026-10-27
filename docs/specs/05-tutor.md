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

1. **AI SDK 7 and `gemini-3.5-flash-lite`, chosen by one variable.** The spike measured it as the only Gemini text model whose free tier fits a public site (15 requests per minute, 500 per day), with a first token in about 600 ms and reliable tool calls. `TUTOR_MODEL` holds `provider:model` in the AI SDK's registry syntax (`google:gemini-3.5-flash-lite`), so the provider and the model cannot disagree; the key keeps the provider's own name, `GOOGLE_GENERATIVE_AI_API_KEY`. A committed `.env.example` documents both, with a `!.env.example` exception in `.gitignore`.
   - **The key is required; the model is optional.** When `TUTOR_MODEL` is unset the tutor uses `google:gemini-3.5-flash-lite`, a single constant that `.env.example` repeats, so a clone needs only the key. A `TUTOR_MODEL` that is set but is not `google:<model>`, and a missing key, fail the request with `unavailable` and a server log naming the variable: a wrong value never falls back to the default.
   - The page also knows beforehand whether the tutor is set up (Decision 12).

   Cost: one provider at a time; a second one means a package and a registry entry.
2. **One route, `/api/tutor`, on Node.** `GET` says whether the tutor is available (Decision 12). `POST` validates the body, checks its rate limits, builds the instructions from the context the page sends (Decision 4), and streams the answer as a UI message stream. The key never leaves the server: the model's module imports `server-only`. Retries are off (`maxRetries: 0`): the spike showed that retrying a 429 spends quota and keeps the learner waiting 7 to 10 s for the same error. A request times out after 20 s (the SDK's `timeout`), because the spike saw one take 299 s to its first token; `maxDuration` is 30 s.
3. **The route validates the body and fails loudly.** The page is the only intended client, but the route is public. A body that is not `{ messages, context }` of the expected shape is a 400 naming the field.
   - **The context is validated strictly,** field by field: the part and the question ids, the concepts, the misconceptions and the outcomes must be values of their enums; the settings must be finite numbers; each profile entry's result must be "correct", "unknown" or a known misconception. The context has no free text, so nothing in it can carry instructions into the prompt; the only free text the model reads is the learner's own messages.
   - **The conversation is capped at 30 messages.** They are the SDK's UI messages: each learner message is one, and each tutor answer is one assistant message, which holds its tool calls and their results along with its text, including the text that follows the automatic resend after a tool (Decision 7). So 30 messages are about 15 exchanges. Beyond that the route answers `too-long` instead of trimming, because trimming must keep tool calls with their results and Gemini's `thoughtSignature` (spike, "Other findings"), and a learner can start a new conversation (Decision 10). That a tool's continuation stays in the same assistant message is checked in the plan against a recorded stream from the real model; if it does not, the count is revisited before anything changes.
   - **A message from the learner is at most 500 characters,** enforced by the input and again by the route.

### What the tutor knows

4. **The page sends its context with every message; the model's memory holds none of it.** Each request carries the learner profile (`LessonControls.learnerProfile()`), the cannon's state (`cannon.current()`: settings and last launch) and the part at the top of the viewport (`navigation.current()`). The page builds it when each request is sent, including the automatic resend after a tool result (in `useChat`'s request preparation or equivalent), never when the chat mounts: a context captured once would tell the model about a launch older than the one it just made. The route turns it into a short block at the end of the instructions. This is the design note's rule (the profile lives in the app and is sent with each message), and it makes adaptation testable: the same context always gives the same instructions. Cost: some tokens per request, small next to the free tier's 250,000 per minute.
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

   The tools have no `execute`, so the model's call reaches the page, which runs it through the controller and sends back what really happened; the spike showed that without the result the model guesses. The schemas only say "a number" or "a string", and the SDK does not validate the input against them (`jsonSchema` without a validator), so a malformed call reaches the page instead of ending in a `tool-input-error` with no reply, as in the spike. The page passes the input to the controller unchanged: it already takes `unknown` values, rejects one that is not a finite number naming the field, and rounds and clamps the rest (spec 04, Decision 13). Its rejection goes back to the model as the tool's result, so the learner always gets a reply. One pure function per tool calls its control. The route offers only these three tools, so a call to any other is a bug, and the page throws naming it. Reading the state needs no tool, because it travels with every message (Decision 4).
7. **At most three tool calls per learner message.** After each tool result the page sends the conversation again automatically (`sendAutomaticallyWhen`), so a model that keeps calling tools would keep spending requests. The route counts the tool calls since the learner's last message, and from the third on it runs the model without tools, so it has to answer in text. Cost: a request such as "compare five speeds" gets three launches and an explanation.
8. **Every action is visible in the conversation.** Each tool call shows a short line built from its result, from `es.ts`: «Ajusto el cañón: 8,00 km/s, 0°, 10 km.», «Disparo el cañón a 8,00 km/s: órbita elíptica.», «Voy a “El cañón de Newton”.», or «No he podido ajustar el cañón: …» for a rejection. The learner sees what the tutor did to the page, and a clamped value says so («15 km/s es el máximo»).

### Limits and errors

9. **The route limits its own requests, in memory.** The free tier's limits are shared by every visitor, so one learner could spend everyone's quota. The route keeps, per server instance, a limit per client (8 requests per minute, about four actions with their explanations) and a global one (12 per minute and 400 per day, below Google's 15 and 500). A request over a limit is refused before any model call, with `rate-limited` or `daily-limit`.
   - **The client is the first address in `x-forwarded-for`.** Without the header, as when the app runs in Docker with no proxy in front, every request shares one client key, `unknown`, so the per-client limit applies to all of them together.
   - **A forged header** lets a client escape its own limit, by sending a new address each time, but not the global one, which counts every request. Cost: on Vercel each instance counts on its own, so the limits are approximate, and Google's own 429 is still mapped (below); an external store would make them exact at the price of an account, a key and a dependency, which this project does not need yet.
10. **Errors reach the learner as Spanish text, from stable codes.** The route maps every failure to a code and the panel maps the code to text in `es.ts`, as the spike verified:

    | Code | When | The panel says, in short |
    |---|---|---|
    | `rate-limited` | over a per-minute limit, ours or Google's | Too many questions: wait a minute |
    | `daily-limit` | over the daily limit, ours or Google's (a per-day `quotaId`) | The tutor is out of questions for today |
    | `too-long` | more than 30 messages | Start a new conversation |
    | `unavailable` | anything else, including the 20 s timeout and a missing key | The tutor is not available; try again |

    - **`too-long` is checked by the panel before it sends,** with the same count as the route: the notice shows and nothing is sent. The route keeps its own check, because it is public.
    - **Every other error offers «Reintentar»,** which asks the tutor to answer the last message again (`regenerate`). The learner's message stays visible in the conversation; the input was cleared when it was sent, and is not filled again, which would show the message twice. Cost: if the failure came after a tool call, retrying may run the tool again, so a launch can fire twice.
    - **An error is announced once,** in the same hidden polite region as a finished message (Decision 11); focus does not move.
    - **The daily limit is recognised by a `quotaId` that contains `PerDay`.** The spike did not reach it. Forum reports of the free tier show `GenerateRequestsPerDayPerProjectPerModel-FreeTier` next to the per-minute `GenerateRequestsPerMinutePerProjectPerModel-FreeTier` that the spike measured, but Google's own documentation does not list the ids, so the match is on the pattern and not on one exact id. A 429 with no recognisable `quotaId` counts as `rate-limited`.

### The panel

11. **The panel holds the conversation, and keeps it until reload.** It replaces spec 04's placeholder inside the same dialog, at the same places and sizes (spec 04, Decision 15). The conversation lives in the panel's chat state, which stays mounted while the dialog is closed, so closing and reopening keeps it, and a reload starts over, like the rest of the lesson (spec 04, Decision 2).
    - **The header** holds the title, at a card's size, a compact close button («×», named «Cerrar el tutor») and, once there are messages, «Nueva conversación», a quiet text button that clears them. With nothing to clear it is not shown.
    - **Opening** moves focus to the input from 1,280 px (`xl`), where the panel is a floating card. Below, where it is a bottom sheet, focus goes to the panel's close button, as in spec 04, so opening the sheet on a phone does not raise the keyboard over the page; the learner moves to the input when they want to write. Escape and the close button behave as in spec 04. This refines spec 04, Decision 15, which announced the input at every width.
    - **The input** is a text area with a label, in one field that grows with the text and holds «Enviar» as an icon button with that name: Enter sends, Shift+Enter adds a line, at most 500 characters. Enter is ignored while a composition is in progress (`isComposing`), so typing an accent with a dead key does not send. «Enviar» and Enter are disabled while an answer is on its way. The input is cleared when a message is sent, and stays empty if the request fails: the failed message stays visible in the conversation and «Reintentar» answers it again (Decision 10).
    - **Scrolling over the panel never scrolls the page behind it,** whether the pointer is on the header, the messages or the input, and also when a long conversation reaches its end (`overscroll-behavior: contain`). The page keeps its place under a floating card or a sheet.
    - **While waiting,** a status line says «Pensando…» until the first words arrive.
    - **The messages** are shown as plain text, with their line breaks, in a list that is not a live region, so the words of an answer that is still arriving are never read one by one. Each tutor message is announced once, in full, when it ends, through a visually hidden polite region of its own, which also announces an error's text (Decision 10). The tutor's moves keep theirs, the one spec 04 added to the panel (Decision 14), so a move and the message that follows it are both heard instead of one replacing the other. The learner's own messages are not announced, and a launch's outcome is announced by the cannon's own live region (spec 04, Decision 11).
    - **Messages look like a conversation:** in small text, the tutor's on the left, on `surface` with a `line` border; the learner's on the right, on `line`, which is lighter than the panel at both widths. The tutor's actions show inside its message, as quieter lines.
    - **Empty, it greets** with what looks like the tutor's first message: a fixed text from `es.ts` saying what the tutor can do, including operating the cannon. When the panel opens with the cannon at the top of the viewport (`navigation.current()` is `cannon`), it adds one line suggesting that the learner ask it to fire («Pídeme que dispare, sin tocar nada.»). Both are fixed, not generated, so opening the panel spends no request.
    - **No note on data in the panel.** It was drafted below the input, and took as much room as the greeting; the README says that the tutor is an AI that can be wrong and that what the learner writes is sent to Google, whose free tier may use it (Decision 13). Cost: a learner who never reads the README is not told, inside the app, where their messages go.
    - **The tutor's moves:** spec 04's navigation already keeps focus in the open panel and announces the part in its live region (Decision 14); this spec only drives it from the tools.
12. **Without a key, the panel says how to enable the tutor.** `GET /api/tutor` answers `{ available: boolean }`: whether `GOOGLE_GENERATIVE_AI_API_KEY` is set and `TUTOR_MODEL`, if set, is a valid `google:<model>` (Decision 1). It is read on each request and never carries the key or any part of it. It is read at request time, not when the page is built, because a Docker image is built without a key and receives it when the container starts. The panel asks once, when the learner first opens it (from the open action, so a second render or a Strict Mode double effect cannot ask twice), and keeps the answer until reload; until it arrives, «Enviar» and Enter are disabled. The check parses the variables and calls no model, and does not count toward the limits of Decision 9.
    - **Without a key, or with a model that does not parse,** the panel shows a fixed text from `es.ts` saying that the tutor is not set up, that it needs a Google AI Studio key, and pointing to the README, which also covers `TUTOR_MODEL`. «Enviar» is disabled and the field read-only, so a clone of the repository works without an account and says why the tutor is silent.
    - **The field is read-only, not disabled,** while the tutor is not ready: a disabled field cannot hold focus, so the focus that opening the panel gives it would be lost, and with it the Escape key (Decision 11). The same goes for a conversation at its cap (Decision 10), where the panel shows `too-long` as soon as the next message would not fit, and sends nothing.
    - **If the check itself fails,** the panel shows the `unavailable` text with «Reintentar», which asks again (Decision 10).
    - **`POST` still answers `unavailable` without a key** (Decision 1), in case it is called directly.

    Cost: a key that is set but invalid still shows the conversation, and its first request fails with `unavailable`.

### Documentation

13. **This spec's part of the README:** how to set the key (`.env.local` from `.env.example`, and where to get a free key), that `TUTOR_MODEL` is optional and what its default is (Decision 1), what the tutor does without a key (Decision 12), and the data note (Decision 11). Running it in Docker and deploying to Vercel stay for the final block.

## Acceptance criteria

| ID | Criterion | Source | Verification |
|---|---|---|---|
| T1 | `POST /api/tutor` streams an answer to a valid body. A body without `messages` or `context`, or with either of the wrong shape, is a 400 naming the field; every context field is checked against its enum or as a finite number, and free text in it is refused; a learner message over 500 characters is a 400; more than 30 UI messages is `too-long`. | Decisions 2 and 3 | Route tests with the AI SDK's mock model: "streams an answer", one test per invalid field of the body and of the context (an unknown part, question, concept, misconception or outcome, a setting given as text or not finite, an unknown profile state, an extra text field), "a message over 500 characters is refused", "31 messages are too long" |
| T2 | The model comes from `TUTOR_MODEL`, and is `google:gemini-3.5-flash-lite` when it is unset; a missing key, or a `TUTOR_MODEL` that is set but does not parse, gives `unavailable` and a server log naming the variable; retries are off; a request aborts after 20 s with `unavailable`. | Decisions 1 and 2 | `model-id.test.ts`: "an unset model is the default", "an unknown provider names TUTOR_MODEL", "a missing key names the variable"; route tests: "a model that cannot be set up is unavailable", "a model that does not answer within the timeout is unavailable" (the timeout is injected, so the test waits 50 ms, not 20 s) |
| T3 | The instructions name every part with its id and title, every question with its correct option, the cannon's limits and presets, the four accuracy rules, Spanish and plain text; the context block lists the profile (correct, the misconception, or unknown, per question), the cannon's settings and last launch, and the part at the top. The same context always gives the same instructions. The page builds the context when each request is sent, the automatic resend after a tool included. | Decisions 4 and 5 | `instructions.test.ts`: one test per item, "a misconception is named in the profile", "the same context gives the same instructions"; E2E with recorded streams: "the resend after a tool carries the latest launch" |
| T4 | Each tool dispatches to its control with its input unchanged and returns the control's result unchanged; a rejected input returns the controller's rejection; a call to a tool the route does not offer throws, naming it. | Decision 6 | `tutor-tools.test.ts`: one test per tool, "a speed of 50 km/s comes back clamped", "a speed given as text is rejected by the controller", "a part that does not exist is rejected" |
| T5 | From the third tool call since the learner's last message, the model runs without tools. | Decision 7 | Route test: "a fourth tool call is not offered" |
| T6 | Every tool call shows its line in the conversation, built from its result, including clamped values and rejections. | Decision 8 | `tool-lines.test.ts`: one test per tool and status; E2E: "a tutor's launch shows its line and its outcome" |
| T7 | Over 8 requests per minute from one client, 12 per minute or 400 per day in all, the route answers `rate-limited` or `daily-limit` without calling the model; the windows reset. | Decision 9 | `rate-limit.test.ts` with an injected clock: one test per limit, "the minute resets", "the day resets"; route test: "a refused request never calls the model" |
| T8 | A provider 429 per minute maps to `rate-limited`, a per-day 429 (a `quotaId` containing `PerDay`) to `daily-limit`, anything else to `unavailable`, also inside a `RetryError`; the panel shows each code's text from `es.ts`, announces it once, and offers «Reintentar» except for `too-long`; the failed message stays visible, and «Reintentar» answers it again. With 30 messages the panel shows `too-long` and sends nothing. | Decision 10 | `error-code.test.ts` (the route's mapping) and `error-codes.test.ts` (the codes shared with the page), with the spike's error shapes as fixtures; E2E with the route mocked: one test per code, "the failed message stays visible", «Reintentar» answers again, "the error text reaches the announcements' region", "the thirty-first message is not sent" |
| T9 | Driven by the tutor: a launch sets and fires the cannon and scrolls it into view when it is out of view; a move to a part scrolls there, and with the panel open focus stays in the panel and the part is announced. | Decisions 6 and 11; spec 04, L11 | E2E with recorded streams: "the tutor launches the cannon", "the tutor's launch out of view brings the cannon into view", "the tutor moves to a part and focus stays in the panel" |
| T10 | Opening the panel focuses the input from 1,280 px and the close button below; Enter sends, Shift+Enter adds a line, and Enter during a composition does not send; the input stops at 500 characters; sending is disabled while waiting; «Pensando…» shows until the first words; scrolling over the panel never scrolls the page behind it; the conversation survives closing and reopening, «Nueva conversación» clears it, and a reload starts over; the greeting is shown, and adds its line about firing when the cannon is at the top; «Nueva conversación» shows only once there are messages. | Decision 11 | E2E with recorded streams, one test per behaviour, including "from 1,280 px opening focuses the input", "below 1,280 px opening focuses the close button", "Enter while composing does not send", "with the cannon at the top the greeting suggests firing", "«Nueva conversación» appears once there are messages", "scrolling over the panel does not scroll the page behind it" (360 and 1,280 px, with and without a long conversation) |
| T11 | The message list is not a live region; each finished tutor message, and an error's text, is announced once, in full, through its own visually hidden polite region, separate from the one for the tutor's moves, and nothing is announced while it streams; a move followed by a message leaves both announced. No axe violations with a conversation, a tool line and an error shown, at 360 and 1,280 px; the panel's controls pass the L15 sweep. | Decision 11, §04 | `finished-answer.test.ts`: "is nothing while the answer streams"; E2E: "a finished answer is announced once, in full", "while waiting, sending is disabled, «Pensando…» shows and nothing is announced", "a move and the message after it are both announced"; axe at both widths; `responsive.spec.ts` with the panel open |
| T12 | No browser code imports the model's module, and the key is never sent to the browser. | Decision 2 | `server-only` in the model's module, so a client import fails the build; code review |
| T13 | With the real model, a fixed set of prompts gives answers that respect the accuracy rules and use no Markdown, and the tool prompts call their tool. | Decisions 5 to 7 | `pnpm eval:tutor` (needs the key, not in CI): about ten prompts, each answer flagged for Markdown, "por segundo" and the expected tool; reviewed by a human and recorded in "Results" |
| T14 | The first token's latency on the deployment, through the route, is measured and recorded. | Spike, "Latency" | Measured on Vercel, recorded in "Results" |
| T15 | Every string comes from `src/content/es.ts`, and colours only from the theme tokens. | spec 04, Decision 16 | spec 03 G11's checks |
| T16 | `GET /api/tutor` answers `{ available }` from the environment at request time (a key is set and `TUTOR_MODEL`, if set, parses), with nothing of the key, and calls no model. The panel asks once, from the open action; without a key, or with a model that does not parse, it shows the fixed text pointing to the README, with «Enviar» disabled and the field read-only; a failed check shows `unavailable` with «Reintentar». | Decision 12 | Route tests: "available is true with a key", "available is true with a valid model", "available is false without a key", "available is false with a model that does not parse", "the answer contains nothing of the key" (the check takes only the environment, so it cannot call a model); E2E with the `GET` intercepted: "without a key the panel explains how to enable the tutor", "the panel asks once", "a failed check offers to retry" |
| T17 | The README says how to set the key, what the tutor does without one, and the data note. | Decision 13 | Review |

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
- **Google may use the conversations.** Free-tier data may be used to improve Google's products. Mitigation: the README says so (Decision 13), and the instructions never ask for personal data. The panel does not (Decision 11).
- **The model can still be wrong or use Markdown.** No test can prevent it. Mitigation: the instructions (Decision 5), and the eval reviewed by a human (T13). A stray `**` would show as asterisks.
- **The SDK changes fast.** AI SDK 7 already differs from most examples (spike, "Versions"). Mitigation: versions pinned, and the recorded streams fail the E2E tests if the stream format changes.
- **The limits are per instance.** Several instances could together exceed Google's limits. Mitigation: Google's 429 is mapped to the same message, so the learner sees the same thing either way.

## Decided in the plan

### File layout

| Files | What they hold |
|---|---|
| `src/lib/lesson/section-ids.ts`, `questions.ts`, `learner-profile.ts` | Moved from `src/app/gravitation/` (spec 04's file table), because the route needs the parts, the questions with their correct options and the profile's types; `src/lib` holds code shared by more than one route |
| `src/lib/tutor/tools.ts`, `context.ts`, `limits.ts`, `error-codes.ts` | What the route and the page share: the three tools' definitions and the `TutorMessage` type; the context's strict schema and type; 500 characters and 30 messages; the error codes and `parseErrorCode` |
| `src/app/api/tutor/route.ts` | `GET` and `POST`, thin, with `maxDuration` |
| `src/app/api/tutor/tutor-handler.ts`, `model.ts`, `model-id.ts`, `instructions.ts`, `tool-rounds.ts`, `error-code.ts`, `rate-limit.ts` | The request's handling, with the model, the timeout, the clock and the log injected for tests; the model's wiring, which imports `server-only` and so cannot load in Vitest, and the tested check of `TUTOR_MODEL` and the key; the instructions; the tool calls since the learner's last message; a failure to its code; the limiter |
| `src/app/gravitation/tutor-context.ts`, `run-tutor-tool.ts`, `tool-lines.ts`, `message-blocks.ts`, `finished-answer.ts`, `use-tutor-chat.ts` | The context from the controls, built in the transport's request preparation; each tool call to its control; a tool's result to its line; a message as text blocks and action lines with stable keys; the finished answer to announce; the chat, its transport and its tool calls |
| `src/app/gravitation/tutor-conversation.tsx`, `tutor-chat-message.tsx`, `tutor-input.tsx`, `tutor-greeting.tsx` | The conversation's components, one per file, inside spec 04's panel, which holds the chat so «Nueva conversación» can sit in its header |
| `src/cannon/types.ts` | Gains `CANNON_OUTCOMES`, the outcomes as values, for the context's schema |
| `scripts/record-tutor-streams.mjs`, `scripts/eval-tutor.mjs` | `pnpm record:tutor` and `pnpm eval:tutor`: both post fixed bodies to a running server, so they test the real route |
| `e2e/fixtures/tutor/`, `e2e/tutor-conversation.spec.ts` | Streams recorded from the real model; the conversation's E2E tests |

### Steps

Each step ends somewhere shippable:

1. Move the shared lesson files (no behaviour).
2. The route.
3. The panel and the tools: **the tutor works locally with a key.**
4. Errors and no-key mode: **safe to deploy without a key.**
5. Rate limiting: **the public deployment may get the key.**
6. The eval and the latency.

### Settled during implementation

- **Versions,** pinned: `ai` 7.0.153, `@ai-sdk/google` 4.0.105, `@ai-sdk/react` 4.0.157, `zod` 4.6.7 (the spike's), `server-only` 0.0.1.
- **A tool's continuation stays in the same assistant message** (Decision 3), checked with streams recorded from the real model through the real chat: after a launch and a new question, the three requests carry 1, 2 and 3 messages (`user`, `assistant`, `user`). The 30-message count stands.
- **The Spanish texts** of the greeting and the tool lines are in `src/content/es.ts`; those of the errors come with them.
- **Every tutor E2E test** intercepts `/api/tutor`; from the no-key mode on it also intercepts `GET /api/tutor`, answering `available: true` for the conversation's tests and `false` for T16, so one build without a key serves the whole suite.
- **A failure reaches `useChat` as its code in `error.message`,** whichever way it arrives: a non-OK response becomes an error whose message is the response body, and a stream's `error` chunk becomes one whose message is its `errorText` (read in the installed `ai` 7.0.153). So the route answers the code as the body (`too-long`, `unavailable`) or as `errorText`, and the panel reads it with `parseErrorCode`; any other text, such as a network failure's, is `unavailable`.
- **The per-day `quotaId`** is not in Google's documentation; forum reports show `GenerateRequestsPerDayPerProjectPerModel-FreeTier` (Decision 10). The route matches `PerDay` in the id of a 429's quota violation.
- **New files of the errors and no-key mode:** `src/app/gravitation/use-tutor-availability.ts` (the one check, started by the open action) and `tutor-notice.tsx` (the error or no-key text with «Reintentar»), beside the panel's other components.
- **The timeout ends the stream with an `abort` chunk, not an `error` one** (seen in a test with a model that never answers, with both `abortSignal` and the SDK's `timeout`). The page would read it as an empty answer, so the route turns that chunk into `unavailable`; a learner who leaves has no reader, so any abort is the timeout.

## Results

To be filled after implementation: T13's eval reviewed by a human, and T14's latency.
