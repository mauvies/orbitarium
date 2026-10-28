@AGENTS.md

# Orbitarium: project rules

A Next.js app that teaches Newton's law of universal gravitation (Part A: lesson, simulator and AI tutor) and shows a gallery of periodic three-body orbits (Part B). Specs live in `docs/specs/`, design notes in `docs/design/`.

## Workflow

- Every block of work starts from a spec in `docs/specs/NN-name.md`, committed before any code. Implementation follows a plan approved in plan mode.
- Tests first: red, then green. A bug fix starts with a test that reproduces it.
- One step at a time. After each step, show the output of the checks below (the red run, then the green run) and stop.
- Never commit or push. The human reviews and commits.
- Stay inside the current step. Flag any deviation from the plan or the spec explicitly instead of making it silently.
- Commit messages follow Conventional Commits and reference the spec and criteria when they apply, e.g. `feat(physics): add yoshida integrator (spec 01, E9)`.

## Decision log

Reviewers read it, so every line must earn its place.

`docs/decision-log.md` records technical decisions that no spec records.

- Add an entry only if the decision changes the result (behaviour, quality, how the app is run or reviewed) or is likely to be asked about in a review. Skip defaults, tool versions, config details and anything a reader can see in the code; a code comment is the right place for those.
- Decisions about a component go in its spec, not here.
- Describe the decision as it stands now, not how it was reached. The history lives in git.
- Format: the decision in bold, then why and its cost. One or two sentences; longer only for decisions with real weight.
- "Considered and discarded" lists only real alternatives that a reviewer could ask about.

## Code

Code is reviewed line by line by the hiring team, so optimise for a reader joining the team.

- TypeScript is strict, with `noUncheckedIndexedAccess`. No `any`, no non-null assertions (`!`) and no casts to silence the compiler.
- `src/physics` is pure: no React, Next.js, Node built-ins or DOM globals (enforced by Biome). Imports inside it are relative; code outside it imports `@/physics`.
- Clarity over cleverness. Optimise only when a measurement shows it is needed (as in spec 01, E15).
- Small functions with one responsibility. Logic lives in pure functions; side effects (DOM, network, timers) stay at the edges.
- Names say what something is in domain terms (`position`, `orbitPeriod`, `learnerProfile`). Standard physics symbols (`G`, `dt`, `r`) are fine inside formulas.
- Exported functions have explicit parameter and return types. Inside a function, let TypeScript infer.
- Fail loudly: invalid input throws an error that names the field. Never swallow an error or return a silent default.
- Comments are rare. Good names and small functions should make the code readable without them. Add one only when a reader would otherwise ask "why?" (a non-obvious choice, a workaround, a rule from a spec, cited as `spec 01, E12`). Never comment what the code already says.
- No dead code, no commented-out code and no abstractions for needs we do not have yet.
- Follow the patterns already in the codebase. If a new pattern is needed, flag it in the step summary.
- Tests read as documentation: the name states the behaviour, one concept per test, named fixtures instead of magic numbers.
- Code, names, comments, docs and commit messages are in English.

## Checks

- Every step: `pnpm typecheck`, `pnpm lint` and `pnpm test`.
- When a change affects CI or the build: also `pnpm exec biome ci` and `pnpm build`.
