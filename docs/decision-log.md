# Decision log
 
Technical decisions that matter for the result and are not recorded in a spec. Decisions about a component live in its spec (`docs/specs/`). At the end of the project, the README's "Decisions at a glance" table is built from this log and the specs.
 
Format: **decision.** Why. Cost.
 
## Project and tooling
 
- **Stricter TypeScript than the Next.js default.** `create-next-app` enables `strict`, which already forbids implicit `any` and forces `null` and `undefined` to be handled. On top of it:
  - `noUncheckedIndexedAccess`: reading an array or record by index returns `T | undefined`. It catches real bugs, such as an unknown orbit slug in the URL, which must become a 404 instead of a crash.
  - `noImplicitReturns`: every code path of a function that returns a value must return one.
  - `noFallthroughCasesInSwitch`: a `case` cannot fall into the next one by a missing `break`.
  Cost: every indexed read may be `undefined`, which is why the engine uses plain objects iterated without indexes (spec 01). `exactOptionalPropertyTypes` stays off because it clashes with library types, and `noUnused*` because Biome already reports unused code.
## Process
 
- **Light spec-driven development with plan mode.** A short spec per block, committed before code, whose criteria name their tests; Claude Code plans in plan mode and I approve each plan and commit.
## Considered and discarded
 
- **OpenSpec.** Built for evolving existing systems; with a closed scope and one week, light specs plus plan mode give the same traceability with fewer files.