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

## Code

- TypeScript is strict, with `noUncheckedIndexedAccess`. No `any`, no non-null assertions (`!`) and no casts to silence the compiler.
- `src/physics` is pure: no React, Next.js, Node built-ins or DOM globals (enforced by Biome). Imports inside it are relative; code outside it imports `@/physics`.
- Code, names, comments, docs and commit messages are in English.

## Checks

- Every step: `pnpm typecheck`, `pnpm lint` and `pnpm test`.
- When a change affects CI or the build: also `pnpm exec biome ci` and `pnpm build`.
