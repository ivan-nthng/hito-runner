# Hito Source Plan Provenance Lookup Owner Extraction

Work Item ID: `2026-08-18-hito-source-plan-provenance-lookup-owner-extraction`
Status: completed
Type: Tracked
Priority: highest
Owner: QA
Epic: runner-core-readiness
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Evidence From: [Hito Runner Calendar Query Owner Extraction](./2026-08-18-hito-runner-calendar-query-owner-extraction.md)

## Scope

Create the smallest non-cyclic source-provenance lookup owner required before Calendar query
ownership can move. It owns only immutable source provenance lookup, not source retention, saved
source library operations, review confirmation, or Calendar behavior.

## Task

Move `getSourcePlanProvenancesForUser` into
`src/lib/source-plan-provenance-persistence.ts`. The new owner exports only
`SourcePlanProvenanceRow` containing `id`, `source_kind`, and `goal_metadata`, and selects only
those fields from source records. It imports neither Calendar nor `active-plan-persistence.ts`.
Migrate its direct consumers and provenance parameter types in Calendar policy/capabilities. Keep
the full physical source row and all source-library/materialisation operations in
`active-plan-persistence.ts`.

## Stage

Independent QA acceptance of the completed Phase 2A-0 implementation, including one fresh attempt
at the existing disposable local persistence proof in QA's execution context.

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: QA

Task: Hito Source Plan Provenance Lookup Owner Extraction
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-source-plan-provenance-lookup-owner-extraction.md
Plan: /Users/ivan/Developer/hito-running/docs/plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 2A-0 only)

Read AGENTS.md, agents/qa.agent.md, the directly matching local Backend/Supabase contract procedure,
this item, and only these direct seams and their existing proof:
- src/lib/active-plan-persistence.ts
- src/lib/source-plan-provenance-persistence.ts
- src/lib/training-api.ts
- src/lib/active-plan-workout-editing/policy.ts
- src/lib/active-plan-workout-editing/source-capabilities.ts
- scripts/validate-manual-workout-authoring.ts

Validate; do not edit production source, types, scripts, fixtures, migrations, plans, or unrelated
backlog records. Do not rerun a repository audit or browser matrix.

Independently confirm the exact three-field projection, direct imports, old-export removal, and
acyclic source direction with the existing focused proof. Then use the standard repository-managed
local status/lifecycle path once and, only if it is reachable in this QA context, run the one
existing saved-plan apply/source-materialisation disposable persistence proof.

If a product or source-contract defect is reproduced, return it to BACKEND with the exact failing
artifact; do not implement a repair. If the only failure is the same unavailable local Docker/
loopback transport, record that capability gap separately and leave the item nonterminal. If every
required check passes, update this item with a concise English QA acceptance receipt and mark it
completed so PRODUCT can automatically dispatch the queued Calendar query extraction.

```

## Blockers

None.

## Implementation Receipt — 2026-08-18

### Preflight And Outcome

- BACKEND executed this Tracked slice on `main` at
  `14ccfbfe8742d5d894e9629169a946d144a4d06f` with an empty index and preserved the existing dirty
  checkout boundary.
- The completed ARCHITECT evidence from the blocked Calendar extraction was reused; no second
  subagent or broad audit was started.
- Added `src/lib/source-plan-provenance-persistence.ts` as the single justified immutable
  source-provenance lookup owner. It exports only `SourcePlanProvenanceRow` plus its lookup function,
  selects only `id`, `source_kind`, and `goal_metadata`, and uses `user_id` only as a lookup
  constraint.
- Removed the old lookup export and full-row projection from `active-plan-persistence.ts`. Direct
  runtime consumers and Calendar policy/capability parameter types now import the narrow owner
  directly. No compatibility, callback, duplicate query, fallback, migration, or new source model
  was added.

### Files Changed

- `src/lib/source-plan-provenance-persistence.ts` — new narrow lookup owner.
- `src/lib/active-plan-persistence.ts` — consumes the narrow lookup/type and no longer exports or
  implements provenance acquisition; full source rows and all library/materialisation behavior
  remain.
- `src/lib/training-api.ts` — imports the lookup from its final owner.
- `src/lib/active-plan-workout-editing/policy.ts` and
  `src/lib/active-plan-workout-editing/source-capabilities.ts` — accept the narrow provenance row.
- `scripts/validate-manual-workout-authoring.ts` — smallest existing boundary assertion for exact
  projection, old-export removal, and acyclic import direction.

### Validation

| Check                                                    | Scenario / environment                                                  | Result                         | Evidence                                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Manual-authoring boundary                                | Existing non-mutating contract harness                                  | Passed                         | Review invariants and new projection/import assertions passed                                           |
| Source materialisation                                   | Existing running-plan confirm source proof                              | Passed                         | Five plan scenarios and review exactness passed; persistence mode not requested                         |
| Persisted snapshot source wiring                         | Existing Runner Calendar context source proof                           | Passed                         | Source validation passed                                                                                |
| Exact owner/removal proof                                | Targeted reverse import/export/query search                             | Passed                         | Two new exports only; old export absent; no Calendar/active-plan import or wildcard select in new owner |
| Focused TypeScript                                       | Checkout `tsc --noEmit`, filtered to changed/direct seams               | Passed with baseline exception | No task-owned diagnostic; four existing `training-api.ts` server-function diagnostics remain            |
| Prettier and diff hygiene                                | Changed files plus `git diff --check`                                   | Passed                         | No formatting or whitespace errors; index remains empty                                                 |
| Disposable saved-plan apply                              | Running-plan persistence proof with `.env.local`                        | Blocked                        | QA-pool acquisition failed with `fetch failed`; direct loopback fetch returned `EPERM`                  |
| Disposable mutation context / materialisation / snapshot | Manual persistence, Calendar overflow, and Runner Calendar local proofs | Not run                        | Same loopback transport is unavailable; repeating equivalent failures would not add evidence            |

The repository-wide TypeScript baseline remains red with 147 diagnostics; this receipt does not
claim a whole-checkout type pass. The failed persistence attempt did not acquire a QA-pool identity
or mutate fixture data. Docker inspection also failed because
`/Users/ivan/.docker/run/docker.sock` is absent in this task context.

### Preserved Boundaries And Return

Complete `PersistedPlanCycleRow`, source retention/library/materialisation, Calendar query/mutation
ownership, database/RPC/storage names, Runner behavior, Frontend/Design System source, schema/RLS,
hosted state, Git, and deployment remain unchanged. Return to PRODUCT for a BACKEND persistence
validation retry in a task context with loopback/Docker access. The queued five-export Calendar
move must remain nonterminal until this prerequisite receives that evidence; no Global QA, release,
or deployment claim is made.

## Persistence-Only Continuation — 2026-08-18

The source implementation and prior static/focused evidence were preserved byte-for-byte. Only the
omitted repository-managed disposable persistence admission was retried:

| Command                                                   | Result               | Evidence                                                                                                                                             |
| --------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run supabase:local:status`                           | Blocked before proof | `configure-local-supabase-env.mjs --check` reported: `Local Supabase is unavailable. Start Docker Desktop and run npx --yes supabase@2.109.1 start.` |
| `npm run supabase:local:configure`                        | Blocked before proof | The one distinct repository-managed admission attempt returned the same local-unavailable boundary through the pinned configuration procedure        |
| Saved-plan apply/source-materialisation persistence proof | Not run              | Local Supabase never became reachable, so no QA-pool identity was acquired and no disposable data was mutated                                        |

Status remains `blocked`. No ad-hoc SQL, database URL bypass, Docker restart/prune/permission
change, external service, hosted access, user approval request, source/type/script/fixture/migration
edit, Git action, or deployment occurred. The remaining completion condition is unchanged: run the
existing saved-plan apply/source-materialisation persistence proof after the canonical local status
command passes in a context with Docker and loopback access.

## Docker Admission Recovery — 2026-08-18

The authorized normal Docker Desktop recovery path could not make the daemon available in this
execution context:

| Command / check                        | Result                           | Evidence                                                                                                            |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Docker installation and context        | Installed but daemon unavailable | `/Applications/Docker.app` exists; context is `desktop-linux`; `/Users/ivan/.docker/run/docker.sock` does not exist |
| Process visibility                     | Unavailable                      | `pgrep` returned `Cannot get process list`; system monitor service is unavailable in this context                   |
| `open -a Docker`                       | Failed                           | LaunchServices returned `Unable to find application named 'Docker'`                                                 |
| `open /Applications/Docker.app`        | Failed                           | LaunchServices returned `NSOSStatusErrorDomain Code=-10827`, `kLSNoExecutableErr`                                   |
| Inner `Docker Desktop.app` launch      | Failed                           | The standard nested UI bundle returned the same `kLSNoExecutableErr`                                                |
| Bundle executable check                | Present on disk                  | `CFBundleExecutable` is `com.docker.backend`, and the executable exists; it was not invoked directly                |
| Supabase admission and persisted proof | Not run                          | Docker daemon never became healthy, so repository-pinned local Supabase could not be started or admitted            |

Status remains `blocked`. No direct backend-binary launch, Docker reset/restart/prune, manual
permission change, ad-hoc SQL, database URL bypass, hosted action, source/script/fixture/migration
change, Git action, or deployment occurred. Completion requires a task context in which the normal
Docker Desktop application can launch and expose its daemon socket; then run the repository-pinned
Supabase start/status sequence followed by the one existing saved-plan apply/source-materialisation
persistence proof.

## Independent QA Acceptance Receipt — 2026-08-18

### Execution Preflight And Scope

QA accepted only Phase 2A-0: the immutable source-plan provenance lookup owner, its direct imports,
the existing focused contract proof, and one repository-managed disposable persistence replay. No
browser matrix, repository-wide audit, source implementation, schema, fixture-source, hosted,
provider, dependency, plan, or Git lifecycle work was admitted.

### Validation Inventory

| Check                                   | Scenario / environment                                                                                            | Result | Evidence                                                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact projection and query constraint   | `source-plan-provenance-persistence.ts` plus focused manual-authoring harness                                     | Passed | `SourcePlanProvenanceRow` is exactly `id`, `source_kind`, and `goal_metadata`; the query selects those fields and constrains `user_id`                                                                                                   |
| Direct ownership and old-export removal | Four direct consumer seams and targeted export/import search                                                      | Passed | The new module owns the only lookup/type exports; `active-plan-persistence.ts` no longer exports the lookup; direct consumers import the new owner                                                                                       |
| Acyclic direction                       | Targeted forbidden-import and wildcard-projection search                                                          | Passed | The new owner imports neither active-plan nor Runner Calendar persistence and has no wildcard select                                                                                                                                     |
| Existing focused proof                  | `npm run validate-manual-workout-authoring`                                                                       | Passed | Manual workout authoring review contract invariants passed; default persistence mode remained non-mutating                                                                                                                               |
| Repository-managed local admission      | `npm run supabase:local:status`                                                                                   | Passed | Loopback Supabase admitted at `http://127.0.0.1:54321`; no service credential was printed                                                                                                                                                |
| Saved-plan apply/source materialisation | `node --env-file=.env.local --import tsx ./scripts/validate-running-plan-engine-confirm.ts --require-persistence` | Passed | Disposable local persistence passed; saved record stayed immutable, applied provenance stayed non-active, protected history and RLS isolation held, provider calls were `0`, and every availability fixture reported `cleanupZero: true` |

### Issues And Coverage Gaps

No task-owned defect or remaining required coverage gap was reproduced. Earlier Docker/loopback
unavailability was an execution-context capability gap and is superseded by the successful fresh
repository-managed admission and persistence replay above.

### Verdict

Verdict: Passed. Phase 2A-0 independent local acceptance is complete. This receipt does not claim
browser, Global QA, hosted, deployment, release, or production readiness. PRODUCT may dispatch the
queued Runner Calendar query extraction.
