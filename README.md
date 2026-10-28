# Orbitarium

Learn Newton's law of universal gravitation by playing with it, with an AI tutor, and explore the three-body problem through six of its periodic solutions.

**Live:** https://orbitarium-app.vercel.app

## What it does

- **The lesson** (`/gravitation`) follows Newton's reasoning, from the falling apple to the full law, on one page with five check questions. Its interactive element is Newton's cannon: set the speed, angle and height, fire, and see whether the shot falls back, orbits or escapes.
- **The AI tutor** explains and answers questions, adapts to the learner's answers to the check questions, and operates the page: it sets and fires the cannon or moves to a part, then explains what really happened.
- **The gallery** (`/three-body`) shows the six periodic orbits. Each detail page animates the three bodies with playback controls (play, restart, speed, path, trail and correction on or off) and has its own URL, with a share button.
- Spanish UI and dark theme; works on mobile and desktop and with the keyboard.

## Run locally

Requirements: Node 24 and pnpm 10.

```bash
pnpm install
pnpm dev        # http://localhost:3000

# Production build
pnpm build
pnpm start      # http://localhost:3000
```

## The tutor

The lesson at `/gravitation` has an AI tutor that explains, answers questions and operates the cannon. It runs on Google's Gemini free tier and needs a key:

1. Get a free key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY`.
3. Restart the server. `TUTOR_MODEL` is optional: it names the model as `google:<model>` and defaults to `google:gemini-3.5-flash-lite`.

**Limits:** the route refuses requests past a per-client and a global limit, both below Google's free-tier limits ([spec 05, Decision 9](docs/specs/05-tutor.md)). They are kept in memory by each server instance, so on a platform that runs several instances they are approximate.

**Without a key** the app works as usual. The tutor's panel opens and says that the tutor is not set up and points here, with its input disabled; the lesson, the cannon and the gallery do not depend on it.

**Data:** the tutor is an AI and can be wrong. What you write to it is sent to Google, whose free tier may use it to improve its products. Do not write personal data.

## How to review it

1. On `/gravitation`, answer the question of «¿Llega hasta la Luna?» wrongly, open the tutor and ask «¿y ahora qué?». It addresses the misconception your answer showed.
2. Ask the tutor «dispara a 8 km/s». It sets and fires the cannon, the conversation shows what it did, and it explains the outcome the page returned.
3. On `/three-body`, open Goggles and turn «Corrección» off: within a few periods the bodies leave their path. Go back: the gallery keeps its scroll position.
4. Read the files below.

| File | What it shows |
|---|---|
| [`src/physics/integrators.ts`](src/physics/integrators.ts) | One step of velocity Verlet and of 4th-order Yoshida, built from it. |
| [`src/physics/simulate.ts`](src/physics/simulate.ts) | `advance`: input validation, equal substeps and the finiteness check. |
| [`src/orbits/catalog.ts`](src/orbits/catalog.ts) | The six orbits as typed data, each with its source. |
| [`src/orbits/playback.ts`](src/orbits/playback.ts) | Playback in whole substeps, re-anchored to the initial state at every period. |
| [`src/app/gravitation/lesson-controls.ts`](src/app/gravitation/lesson-controls.ts) | The one path to the cannon and the navigation, shared by the learner's buttons and the tutor. |
| [`src/app/api/tutor/tutor-handler.ts`](src/app/api/tutor/tutor-handler.ts) | The tutor's route: body validation, rate limits, tool rounds and error codes. |
| [`src/app/api/tutor/instructions.ts`](src/app/api/tutor/instructions.ts) | The model's instructions, built from the lesson's own content and the learner's context. |
| [`src/app/api/tutor/rate-limit.ts`](src/app/api/tutor/rate-limit.ts) | Per-client and global sliding windows. |

[`docs/`](docs/) holds the specs, design notes, research and the decision log: useful for detail, not required reading.

## Key decisions

| Decision | Why | Cost |
|---|---|---|
| A pure TypeScript engine with a 4th-order Yoshida integrator and a fixed step ([spec 01](docs/specs/01-physics-engine.md)) | A symplectic integrator keeps the energy error bounded, so orbits close instead of spiralling. | No adaptive step, so the close-encounter orbits need up to 500,000 steps per period. |
| Orbit initial conditions refined from published values and tested to close after one period ([spec 02](docs/specs/02-orbit-catalog.md)) | The published precision is not enough for the orbits to close. | A test cannot catch a small error in the digits, so the literals were compared by hand with the research note. |
| Playback re-anchors to the initial state every period, and the gallery's «Corrección» turns it off to show the drift ([spec 02](docs/specs/02-orbit-catalog.md), [spec 03](docs/specs/03-gallery.md)) | Most of these orbits are unstable or have close encounters, and without it they leave their path within a few periods. | It is a correction, not pure simulation. |
| The gallery's preferences live in its layout, and the client router restores the scroll ([spec 03](docs/specs/03-gallery.md)) | The brief asks that returning to the gallery keeps its state, not across a reload. | Speed, path, trail and correction reset on reload and when leaving the section. |
| The lesson is one page, with Newton's cannon in a band of its own, simulated by the same engine ([spec 04](docs/specs/04-lesson.md)) | The headings carry Newton's reasoning, and a learner who prefers to try can go straight to the cannon. | The whole lesson is visible at once, so every text must stay short. |
| Gemini Flash-Lite on the free tier, behind one server route ([spec 05](docs/specs/05-tutor.md)) | In the spike it had the highest free-tier quota, the fastest first token and called the tool every time; the key stays on the server, and `server-only` fails the build on a client import. | One provider at a time; a second means a package and a registry entry. |
| The tutor operates the page through client-side tools that return what really happened ([spec 05](docs/specs/05-tutor.md)) | Without the real result, the model guesses. | Each tool call costs one more request, so they are capped at three per learner message. |
| The page sends the learner profile, the cannon's state and the current part with every message ([specs 04](docs/specs/04-lesson.md) and [05](docs/specs/05-tutor.md)) | Adaptation lives in the app, so the same context always gives the same instructions and can be tested. | Some tokens per request. |
| The route limits its own requests, per client and in all ([spec 05](docs/specs/05-tutor.md)) | The free tier's quota is shared, so one visitor could spend everyone's. | The limits are counted per instance, so they are approximate. |
| Strict TypeScript, Biome, Vitest, and Playwright with axe, all in CI ([decision log](docs/decision-log.md), [spec 03](docs/specs/03-gallery.md)) | They catch unhandled `undefined`, enforce the pure domain folders and check accessibility on every page. | Every indexed read may be `undefined` and has to be handled. |

## Limits and what I'd do with more time

- **Yin-yang I plays at about 2.3× when 4× is chosen,** on a 60 Hz display. Each frame runs at most 1,100 simulation substeps, to keep within its time budget, and yin-yang I at 4× needs 1,924. On a 120 Hz display it plays at 4×. See [spec 03, Decision 7](docs/specs/03-gallery.md).
- **Searching for new orbits,** the brief's optional extra for Part B, is not done.
- **The lesson does not reorder itself by the learner's answers;** adaptation lives in the tutor.
- **The tutor's hints can still give away the answer** to a question the learner has not answered ([spec 05, Decision 5](docs/specs/05-tutor.md)).
- **The free tier can be slow or unavailable under high demand;** the tutor then falls back to a second model, says when an answer is slow, and offers to retry if both fail ([spec 05, Decision 2](docs/specs/05-tutor.md)).

## Use of AI

I used AI throughout, with a deliberately light spec-driven development process. Claude worked as planner and reviewer in a chat, and Claude Code implemented in the repo, following `CLAUDE.md`. Each block started with a short spec in `docs/specs/`, committed before any code, whose acceptance criteria name their tests. Claude Code proposed a plan in plan mode, which I reviewed and often changed, and implemented it in small steps, tests first. It never committed: every commit is a step I reviewed and ran.

On larger projects I build more tooling around agents (custom agents, skills, frameworks such as OpenSpec). Here the scope was closed and the work was one person's for a week, so light specs, plans and human review gave every change a criterion and a check without that overhead.

The tutor's behaviour was checked by hand against the real model. That caught a rule worded in the negative that the model kept repeating to the learner, now fixed, and hints that give the answer away, listed above as a limit.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test

# End-to-end tests run against a production build
pnpm exec playwright install chromium   # once
pnpm build && pnpm test:e2e
```
