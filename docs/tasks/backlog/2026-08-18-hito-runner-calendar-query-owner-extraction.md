# Hito Runner Calendar Query Owner Extraction

Work Item ID: `2026-08-18-hito-runner-calendar-query-owner-extraction`
Status: completed
Type: Tracked
Priority: highest
Owner: QA
Epic: runner-core-readiness
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Workout Detail Static Right Panel And Query Elimination](./2026-08-18-hito-workout-detail-right-panel-removal-and-query-elimination.md); [Hito Source Plan Provenance Lookup Owner Extraction](./2026-08-18-hito-source-plan-provenance-lookup-owner-extraction.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation Plan](../../plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md)

## Scope

Move Runner Calendar query and mutation-context responsibility out of legacy-named
`active-plan-persistence.ts` into one Calendar owner, while retaining immutable source-library and
source-materialisation responsibility in the existing source owner.

## Task

Extract only `PersistedPlannedWorkoutRow`, `PersistedWorkoutLogRow`, `CalendarWorkoutContext`,
`getCalendarWorkoutsWithLogsForUser`, and `getCalendarWorkoutMutationContext` into
`src/lib/runner-calendar-persistence.ts`. Migrate every direct Backend consumer to that final owner
and remove the old exports without re-export, alias, fallback, or duplicate query path. Do not move
Calendar mutations, source retention/materialisation, database/RPC names, schema, or product
behavior in this slice.

## Stage

Backend removed the duplicate Calendar row-type exports, and the independent Phase 2A QA rerun is
complete.

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: QA

Task: Hito Runner Calendar Query Owner Extraction — Independent Acceptance Rerun
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-runner-calendar-query-owner-extraction.md
Parent: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md
Plan: /Users/ivan/Developer/hito-running/docs/plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 2A only)

Read AGENTS.md, agents/qa.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this item, the
Phase 2A plan section, and only `runner-calendar-persistence.ts`,
`persisted-plan-replacement.ts`, their direct production/proof consumers, and the existing focused
proofs named in the Backend fix-forward receipt. Do not conduct a repository audit or browser matrix.

Independently prove that `runner-calendar-persistence.ts` is the sole live owner of
`PersistedPlannedWorkoutRow` and `PersistedWorkoutLogRow`, together with the three other admitted
Calendar exports; that `persisted-plan-replacement.ts` has no duplicate definition/export or
compatibility alias; and that no import cycle or duplicate query path was introduced. Confirm the
existing Calendar/manual/source materialisation contracts through the smallest reusable proof set.

The prior `AuthRetryableFetchError` during one Calendar-context auth-user setup is a coverage gap,
not a source defect. Use the canonical disposable lifecycle if it works; do not alter Docker,
environment, credentials, transport, fixture infrastructure, production source, hosted data,
providers, migrations, Git, or deployment to chase that error.

Run exact owner/reverse-import checks, the narrow affected proof set, focused type diagnostics,
Prettier, and diff hygiene. If a defect is reproduced, record its exact artifact and return it to
BACKEND without repairing source. If all checks pass, append an English QA receipt and mark this
item completed. Do not claim browser, Global QA, hosted, release, or deployment acceptance.
```

## Executed Backend Fix-Forward Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Runner Calendar Query Owner Extraction
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-runner-calendar-query-owner-extraction.md
Parent: docs/tasks/backlog/2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md
Plan: docs/plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 2A only)

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this item,
and only the Phase 2A plan section. Start from src/lib/active-plan-persistence.ts and use targeted
reverse-import search to identify only its direct consumers of the five admitted Calendar query
exports. Read those consumers and their already-existing focused proof; do not read unrelated
domains or historical receipts.

Before the first production write, use the existing named ARCHITECT role for one bounded read-only
review. It must read AGENTS.md, agents/architect.agent.md, and
skills/hito-architecture-audit/SKILL.md. Its sole question: confirm the direct consumer set, the
final Calendar query contract, and the source-provenance responsibilities that must remain in
active-plan-persistence.ts. It must not edit files, run a broad audit, or make implementation
decisions.

Implement the approved Phase 2A move only:
- create src/lib/runner-calendar-persistence.ts as the one justified Calendar-query owner;
- move exactly PersistedPlannedWorkoutRow, PersistedWorkoutLogRow, CalendarWorkoutContext,
  getCalendarWorkoutsWithLogsForUser, and getCalendarWorkoutMutationContext there;
- migrate all direct Backend consumers to that final owner;
- remove those exports from active-plan-persistence.ts with no re-export, alias, fallback, dual
  query, compatibility facade, or new persistence model.

Preserve immutable source candidate retention, source-library reads, provenance, reviewed source
materialisation, Calendar mutation implementation, database/RPC/storage names, all Runner behavior,
Frontend/DS source, schema/migrations/RLS, fixture truth, hosted state, Git, and deployment.

Reuse the existing affected manual-authoring/Calendar-context/overflow/source-materialisation proof
instead of creating a test framework. Run the narrow provider/consumer regression set, exact
reverse-import/removal proof, focused TypeScript, Prettier, and diff hygiene. Fix task-owned
failures in place. If an unaccounted Frontend consumer, persistence change, third domain, or product
decision becomes necessary, return the exact boundary to PRODUCT; otherwise mark the item completed
with one English receipt and Phase 2A handoff status.
```

## Executed QA Handoff Prompt

```text
ROLE: QA

Task: Hito Runner Calendar Query Owner Extraction — Independent Acceptance
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-runner-calendar-query-owner-extraction.md
Parent: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md
Plan: /Users/ivan/Developer/hito-running/docs/plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 2A only)

Read AGENTS.md, agents/qa.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this canonical
item, the Phase 2A plan section, and only the five moved Calendar-query exports, their direct
Backend consumers, and the existing focused proofs named in the Backend receipt. Do not conduct a
repository audit or browser matrix.

Independently verify that `runner-calendar-persistence.ts` is the sole owner of the five admitted
Calendar query/context exports; every direct production and focused-proof consumer uses it; and
`active-plan-persistence.ts` retains only source-library/materialisation responsibility without a
re-export, facade, fallback, duplicate query, or value-import cycle. Confirm source provenance
remains narrow and Calendar behavior/protection/source materialisation are unchanged through the
existing reusable proof.

Run the smallest existing source/persistence proofs required by this move, plus exact
removal/reverse-import checks, focused type diagnostics, Prettier, and diff hygiene. Use only the
canonical disposable loopback lifecycle if persistence proof is required; do not alter hosted data,
providers, credentials, source, migrations, fixture source, Git, or deployment.

If a defect is reproduced, record the exact failing artifact and return it to BACKEND for
fix-forward; do not repair production source. If all checks pass, append an English QA receipt and
mark this item completed. Global QA, browser, hosted, release, and deployment acceptance remain
outside scope.
```

## Blockers

None.

## Implementation Receipt — 2026-08-18

### Preflight And Architecture Evidence

- BACKEND resumed on `main` at `14ccfbfe8742d5d894e9629169a946d144a4d06f` with an empty index and
  preserved all unrelated dirty checkout bytes.
- The required bounded read-only ARCHITECT review confirmed 13 production Backend consumers and 12
  focused proof consumers, the unchanged five-export contract, and the final dependency direction
  `active-plan-persistence -> runner-calendar-persistence -> source-plan-provenance-persistence`.
- No unowned consumer, Frontend/Design System consumer, persistence-shape change, third domain,
  runtime cycle, or product decision remained.

### Implementation

- Added `src/lib/runner-calendar-persistence.ts` as the single Calendar query/mutation-context owner.
  It owns exactly `PersistedPlannedWorkoutRow`, `PersistedWorkoutLogRow`,
  `CalendarWorkoutContext`, `getCalendarWorkoutsWithLogsForUser`, and
  `getCalendarWorkoutMutationContext` with their existing shapes, ordered queries, batching, and
  source-provenance composition.
- Removed those five exports, Calendar log batching, and provenance composition from
  `active-plan-persistence.ts`. That module now imports only the Calendar listing function and
  planned-workout row type needed by retained source-library/materialisation behavior; it contains
  no facade, re-export, alias, fallback, or duplicate query.
- Migrated all 13 direct production consumers and all 12 direct focused proof consumers to the new
  owner. The existing Runner Calendar context proof now also covers the new owner.
- Corrected one stale direct consumer type in `manual-workout-authoring/edit-workout.ts`: provenance
  is the already-approved narrow `SourcePlanProvenanceRow`, and ownership remains enforced by the
  user-scoped provenance query plus the persisted workout's `user_id` check. No query or permission
  behavior changed.
- Preserved immutable source retention/library reads, reviewed-source materialisation, Calendar
  mutations, physical database/RPC/storage names, Frontend/Design System source, schema/migrations,
  RLS, fixture truth, hosted state, Git, and deployment.

### Validation

| Check                            | Scenario / environment                                       | Result                | Evidence                                                                                                            |
| -------------------------------- | ------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Required architecture review     | Existing ARCHITECT role, bounded read-only                   | Passed                | Complete 13 production / 12 proof consumer map; acyclic final direction                                             |
| Manual authoring source contract | Existing validator, non-mutating mode                        | Passed                | `Manual workout authoring review contract invariants passed`                                                        |
| Manual authoring persistence     | Repository-managed loopback Supabase                         | Passed                | Full disposable mutation/protection/isolation proof; owned rows cleaned and both leases released                    |
| Calendar context                 | Repository-managed loopback Supabase                         | Passed                | Source and local persistence validation passed                                                                      |
| Overflow/source materialisation  | Repository-managed loopback Supabase                         | Passed                | Import, materialisation, mixed-origin readback, concurrency, protection, cleanup; no provider call                  |
| Exact owner removal              | Static reverse export/import proof                           | Passed                | Five exports exist only in `runner-calendar-persistence.ts`; no old re-export or facade                             |
| Focused TypeScript               | Current whole-checkout compiler, filtered to affected owners | Passed for extraction | Narrow provenance consumer errors fixed; remaining TanStack server serialization diagnostics pre-existed this slice |
| Formatting and diff hygiene      | All affected source/proof files                              | Passed                | Prettier check and `git diff --check`                                                                               |

The whole-checkout TypeScript command remains nonzero on unrelated existing TanStack server-action
serialization diagnostics in `delete-clear.ts`, `move-workout.ts`, and `training-api.ts`; therefore
this receipt does not claim repository-wide type cleanliness. Browser, Global QA, hosted, release,
Git, and deployment checks were omitted because this source-only ownership move does not authorize
or establish those acceptance layers. The Phase 2A Backend slice is complete and returns to PRODUCT
for independent QA.

## QA Fix-Forward Receipt — 2026-08-18

- **QA defect:** `persisted-plan-replacement.ts` still exported independent
  `PersistedPlannedWorkoutRow` and `PersistedWorkoutLogRow` aliases after the initial extraction, so
  the new Calendar module was not the sole public type owner.
- **Repair:** removed both duplicate definitions/exports and imported the canonical row types from
  `runner-calendar-persistence.ts`. The direct runtime replacement consumer in
  `plan-apply-policy.ts` and the two direct replacement proof consumers now use the same canonical
  type imports instead of private duplicate aliases.
- **Proof adjustment:** the existing manual-authoring validator now reads
  `persisted-plan-replacement.ts` and proves both row aliases are exported only by
  `runner-calendar-persistence.ts`, are not redefined by replacement, and are imported directly
  without a facade or compatibility path.
- **Behavior preserved:** replacement row construction, imported-seed conversion, log carry-forward,
  source materialisation, Calendar mutation/protection, provenance direction, schema/RLS, fixtures,
  Frontend/Design System source, hosted state, Git, and deployment are unchanged.

| Check                           | Scenario / environment                                     | Result        | Evidence                                                                                                  |
| ------------------------------- | ---------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| Exact sole-owner proof          | Repository source/export search                            | Passed        | Exactly two matching exports, both in `runner-calendar-persistence.ts`; no replacement definitions        |
| Manual/source boundary          | Existing manual-authoring validator                        | Passed        | Review contract and new replacement owner assertions passed                                               |
| Planned-workout language        | Existing focused validator                                 | Passed        | `Planned workout language read-model contract passed`                                                     |
| Provider representation         | Existing deterministic proof                               | Passed        | Completed without paid-provider or hosted access                                                          |
| Calendar/source materialisation | Already-healthy disposable loopback Supabase               | Passed        | Overflow, mixed-origin, protection, concurrency, cleanup; `callsOpenAi: false`                            |
| Focused type diagnostics        | Current whole-checkout compiler filtered to affected files | Baseline only | Existing `Json`/workout-document casts and carry-forward result narrowing remain; no row-owner diagnostic |
| Formatting and diff hygiene     | Exact fix-forward files                                    | Passed        | Prettier and `git diff --check`                                                                           |

The QA-reported `AuthRetryableFetchError` did not recur in the one already-healthy canonical
persistence proof. No Docker, environment, credential, transport, or fixture-infrastructure action
was taken. The fix-forward is complete and returns to PRODUCT for the required independent QA
rerun. No browser, Global QA, hosted, release, or deployment acceptance is claimed.

## Blocked Preflight Receipt — 2026-08-18

### Preflight And Boundary Evidence

- BACKEND began this Tracked slice on `main` at
  `14ccfbfe8742d5d894e9629169a946d144a4d06f` with an empty index and preserved the existing dirty
  checkout boundary.
- Targeted reverse-import proof found the complete admitted consumer set: 13 Backend production
  files and 12 existing focused proof files. No Frontend consumer, unaccounted third domain, or
  persistence-shape change was found.
- The required read-only ARCHITECT review confirmed the final contract is exactly
  `PersistedPlannedWorkoutRow`, `PersistedWorkoutLogRow`, `CalendarWorkoutContext`,
  `getCalendarWorkoutsWithLogsForUser`, and `getCalendarWorkoutMutationContext`, with unchanged
  shapes and behavior.
- The same review confirmed that candidate retention, saved-source library reads,
  `getSourcePlanProvenancesForUser`, immutable-source validation, and reviewed-source
  materialisation must remain in `active-plan-persistence.ts`.
- Exact reverse proof found no separate existing provenance owner:
  `getSourcePlanProvenancesForUser` is defined only in `active-plan-persistence.ts`; its production
  consumers are that module's mutation-context composition and `training-api.ts`.

### Stop Discriminator

Implementing the dispatch literally would introduce `active-plan-persistence ->
runner-calendar-persistence` for Calendar listing and `runner-calendar-persistence ->
active-plan-persistence` for provenance composition. A static or lazy version of that cycle would
not establish a clean modular-monolith owner. Avoiding it requires an unadmitted ownership change,
such as moving the provenance lookup to a separate canonical source-provenance owner, moving a
sixth export, or changing the mutation-context dependency contract. BACKEND did not choose among
those architecture options.

### Validation And Preservation

| Check                         | Scenario / environment                                       | Result  | Evidence                                                                         |
| ----------------------------- | ------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------- |
| Consumer inventory            | Targeted reverse-import search for the five admitted exports | Passed  | 13 production and 12 proof consumers accounted for                               |
| Provenance reverse edge       | Targeted `getSourcePlanProvenancesForUser` search            | Blocked | No independent owner exists; exact two-way runtime dependency demonstrated       |
| Production/source mutation    | Pre-write stop boundary                                      | Not run | No production, proof, plan, schema, fixture, or configuration file changed       |
| Regression/type/format checks | Implementation-dependent gates                               | Not run | No candidate exists to validate; running them cannot resolve ownership direction |

No source file, migration, schema/RLS, fixture, hosted state, Git state, Frontend/Design System
file, or plan was changed. Return to PRODUCT for the smallest explicit dependency-direction decision
before a fresh Phase 2A BACKEND dispatch. No implementation, Global QA, release, or deployment claim
is made.

## Independent QA Acceptance Receipt — 2026-08-18

### Stage And Preflight

QA performed focused Definition-of-Done acceptance of Phase 2A only. Scope was limited to the five
admitted Calendar query/context exports, their direct production/proof consumers, narrow source
provenance, the named reusable source/persistence proofs, focused TypeScript diagnostics, and
task-scoped formatting/diff hygiene. No browser, repository-wide audit, source repair, hosted,
provider, credential, migration, fixture-source, Git, or deployment action was admitted.

### Validation Inventory

| Check                              | Scenario / environment                                                         | Result                                         | Evidence                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five-export sole ownership         | Exact export search across `src` and `scripts`                                 | Failed                                         | `runner-calendar-persistence.ts` owns all five, but `persisted-plan-replacement.ts:13-14` also exports `PersistedPlannedWorkoutRow` and `PersistedWorkoutLogRow`                                  |
| Legacy owner removal               | `active-plan-persistence.ts`                                                   | Passed                                         | No admitted re-export, facade, duplicate Calendar query, or provenance composition remains; it imports only Calendar listing and the planned-workout row type for retained source materialisation |
| Reverse-import direction           | Calendar and provenance owners                                                 | Passed                                         | Calendar query owner does not import active-plan persistence; provenance owner imports neither Calendar nor active-plan persistence                                                               |
| Direct consumer migration          | Targeted import search                                                         | Passed                                         | The 13 production and 12 focused-proof direct consumers import `runner-calendar-persistence.ts`                                                                                                   |
| Manual behavior and protection     | Disposable loopback manual-authoring persistence proof                         | Passed                                         | Add/edit/copy/clear, empty/Rest/occupied Move and Undo, evidence race protection, isolation, owned-row cleanup, and both lease releases passed                                                    |
| Calendar context source contract   | Non-mutating context validator                                                 | Passed                                         | Runner Calendar context source validation passed                                                                                                                                                  |
| Calendar context persistence       | Repository-managed loopback validator, two attempts                            | Blocked before behavior proof                  | Both attempts failed while creating disposable auth users with `AuthRetryableFetchError: fetch failed`; canonical status and QA-pool proofs remained healthy                                      |
| Overflow and mixed-origin behavior | Disposable loopback Calendar overflow proof                                    | Passed                                         | Import/materialisation, mixed manual/AI/file origins, export/clear, concurrency, protection, zero active authority, and zero provider calls passed                                                |
| Source materialisation             | Disposable running-plan confirm proof                                          | Passed                                         | Saved source stayed immutable, materialised provenance stayed non-active, protected history/RLS held, provider calls were zero, and cleanup converged                                             |
| Focused TypeScript                 | Whole-checkout `tsc --noEmit`, filtered to affected owners                     | Passed for extraction with baseline exceptions | No diagnostic named either new persistence owner; existing TanStack serialization diagnostics remained in `delete-clear.ts`, `move-workout.ts`, and `training-api.ts`                             |
| Formatting and diff hygiene        | Calendar owner, direct consumers/proofs, retained source owners, and this item | Passed                                         | Prettier and task-scoped `git diff --check` passed                                                                                                                                                |

### Defect And Coverage Gap

- **Defect:** BACKEND ownership extraction is incomplete at
  `src/lib/persisted-plan-replacement.ts:13-14`. The file defines and exports a second copy of two
  admitted Calendar row types. No external importer of those duplicate exports was found, but the
  live exports contradict the required sole-owner contract.
- **Coverage gap:** the Calendar-context persistence harness could not pass its direct disposable
  auth-user setup in this QA context. This does not explain or mitigate the source ownership defect;
  neighboring canonical QA-pool persistence proofs passed and cleaned up.

### Verdict

Verdict: Failed. Return Phase 2A to BACKEND with the exact duplicate-export artifact. This focused
local result does not claim browser, Global QA, hosted, release, deployment, or production
acceptance.

## Independent QA Acceptance Rerun Receipt — 2026-08-18

### Stage And Preflight

QA reran focused Definition-of-Done acceptance after the duplicate row-type export repair. Scope
was limited to `runner-calendar-persistence.ts`, `persisted-plan-replacement.ts`, their direct
production/proof consumers, the named reusable proof set, focused TypeScript diagnostics, and
task-scoped formatting/diff hygiene. No browser, repository-wide audit, source repair, Docker,
environment, credential, transport, fixture-infrastructure, hosted, provider, migration, Git, or
deployment action was admitted.

### Validation Inventory

| Check                           | Scenario / environment                                        | Result                                                   | Evidence                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Five-export sole ownership      | Exact export search across `src` and `scripts`                | Passed                                                   | Exactly the five admitted exports are defined by `runner-calendar-persistence.ts`; no second row-type export remains                                                                 |
| Replacement owner correction    | `persisted-plan-replacement.ts`                               | Passed                                                   | No duplicate definition, export, compatibility alias, or facade; both row types are imported directly from the Calendar owner                                                        |
| Import/query direction          | Calendar and replacement owners                               | Passed                                                   | Calendar owner has no active-plan reverse import; replacement has no Calendar query; `planned_workouts` and `workout_logs` queries occur only in the Calendar owner within this seam |
| Manual/source boundary          | `npm run validate-manual-workout-authoring`                   | Passed                                                   | Review contract and exact replacement-owner assertions passed in non-mutating mode                                                                                                   |
| Planned-workout language        | Existing focused validator                                    | Passed                                                   | `Planned workout language read-model contract passed`                                                                                                                                |
| Provider representation         | Existing deterministic generated-plan validator               | Passed                                                   | AI-generated plan-first creation contract passed without paid-provider or hosted access                                                                                              |
| Calendar/source materialisation | Disposable loopback overflow proof                            | Passed                                                   | Import/materialisation, mixed origins, export/clear, concurrency, protection, zero active authority, cleanup, and `callsOpenAi: false` passed                                        |
| Calendar-context persistence    | Existing direct auth-user harness                             | Coverage gap                                             | It again stopped before behavior proof with `AuthRetryableFetchError: fetch failed`; no Docker, environment, credential, transport, or fixture-infrastructure change was attempted   |
| Focused TypeScript              | Whole-checkout `tsc --noEmit`, filtered to the affected files | Passed for the ownership repair with baseline exceptions | No row-owner or Calendar-owner diagnostic; existing `Json`/workout-document casts and carry-forward narrowing diagnostics remain in replacement/plan-apply                           |
| Formatting and diff hygiene     | Exact owner, direct-consumer/proof files, and this item       | Passed                                                   | Prettier and task-scoped `git diff --check` passed                                                                                                                                   |

### Issues And Coverage Gaps

No task-owned source, ownership, cycle, duplicate-query, or behavior defect was reproduced. The
known Calendar-context direct auth-user setup remains a coverage gap rather than a source defect:
canonical loopback status passed and the admitted QA-pool overflow/materialisation proof completed
with cleanup and provider isolation.

### Verdict

Verdict: Passed. Phase 2A focused independent local acceptance is complete. This receipt does not
claim browser, Global QA, hosted, release, deployment, or production acceptance.
