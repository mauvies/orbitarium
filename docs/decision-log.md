# Decision log
 
Technical decisions that matter for the result and are not recorded in a spec. Decisions about a component live in its spec (`docs/specs/`). At the end of the project, the README's "Decisions at a glance" table is built from this log and the specs.
 
Format: **decision.** Why. Cost.
 
## Project and tooling
 
- **Stricter TypeScript than the Next.js default.** `create-next-app` enables `strict`, which already forbids implicit `any` and forces `null` and `undefined` to be handled. On top of it:
  - `noUncheckedIndexedAccess`: reading an array or record by index returns `T | undefined`. It catches real bugs, such as an unknown orbit slug in the URL, which must become a 404 instead of a crash.
  - `noImplicitReturns`: every code path of a function that returns a value must return one.
  - `noFallthroughCasesInSwitch`: a `case` cannot fall into the next one by a missing `break`.
  Cost: every indexed read may be `undefined`, which weighs on the engine's state representation (spec 01). `exactOptionalPropertyTypes` stays off because it clashes with library types, and `noUnused*` because Biome already reports unused code.
- **Code lives with the route that uses it.** A route's components and logic sit in its folder in `src/app/`, with their tests. Code shared by more than one route goes to `src/components/` (components) or to the folder of its domain (`src/physics`, `src/orbits`, `src/drawing`), never inside a route; there is no catch-all `lib` folder. Why: what a page needs is found beside it, and shared code is never hidden in one route. Cost: a file moves when a second route starts using it.
## Process
 
- **Light spec-driven development with plan mode.** A short spec per block, committed before code, whose criteria name their tests; Claude Code plans in plan mode, and I approve each plan and commit each step. Why: every criterion traces to a test, and every change is reviewed by a human. Cost: planning and review time on every step.
## Considered and discarded
 
- **OpenSpec.** Built for evolving existing systems; with a closed scope and one week, light specs plus plan mode give the same traceability with fewer files.