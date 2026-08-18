# Hito Workout Rest And FIT Fixture Lifecycle Recovery — 2026-08-15

## Work Item ID

2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery

## Status

completed

## Type

Tracked — Backend persistence and local-fixture recovery

## Priority

high

## Owner

BACKEND

## Epic

runner-core-readiness

## Evidence From

`2026-08-15-hito-workout-core-flow-qa-scenario-catalog`

## Scope

Two local workout-lifecycle blockers only: adding a Rest day to an already reviewed editable plan, and creating/resetting a disposable compatible `2026-05-05` non-Rest workout for the approved local FIT scenario.

## Task

Fix the first incorrect Backend owner rather than hiding either failure in Calendar UI or QA data shaping. An existing reviewed plan must be able to receive an approved Rest-day mutation when the established active-plan policy permits it. The canonical disposable lifecycle must create and fully clean the exact-date FIT prerequisite through existing plan materialization/persistence paths, not direct database shaping.

## Confirmed Evidence

- `src/lib/manual-workout-authoring/actions.ts` rejects every reviewed `workoutType === "rest"` with `manual_workout_required`, while its normalization and persistence paths already represent Rest rows.
- WC-07 stopped before upload because canonical template import rejected the `2026-05-05` materialization with `Future schedule materialization accepts only reviewed future rows.`
- The FIT candidate is `sample-fit-from-zip.fit`, SHA-256 `fb5e9a4b3a0d9ff90e105c174bb728f730de621875b17503db8981cb80c108a2`; it must not be uploaded until its owned exact-date workout exists.

## Required Outcome

1. A reviewed editable plan accepts the documented Rest-day action without weakening source-protected/generated workout policy.
2. The existing local disposable lifecycle can materialize and reset a compatible owned non-Rest workout dated `2026-05-05` without direct SQL or hosted/provider use.
3. Durable readback and full reset prove no plans, workouts, results, assets, activities, comparisons, or logs remain after the fixture flow.

## Boundaries

Do not change Calendar presentation, Workout route interactions, shared Design System code, QA assertions merely to suppress failures, hosted Supabase, providers, Git lifecycle, or retained identities. Reuse existing active-plan authoring and fixture/materialization seams; add no new fixture framework unless an existing owner demonstrably cannot represent the lifecycle.

## Validation

Run focused Backend source/persistence checks and local disposable lifecycle proof. Then request bounded read-only QA replay of WC-01, stored-Rest branch of WC-05, and the exact-date prerequisite for WC-07. The FIT upload/remove branch remains QA-owned after its prerequisite passes. Record an English tracked receipt; do not claim Global QA, hosted, or release acceptance.

## Execution Preflight — 2026-08-15

- **Mode and owner:** Tracked Backend implementation. The index is empty, the pre-task dirty candidate is recorded by path/content digest, and no other execution role is active.
- **Root-cause discriminators:** a normalized reviewed Rest draft is rejected by two blanket `manual_workout_required` branches before the existing persistence path; the fixed `2026-05-05` template is passed to the canonical future-only materializer without the already-supported historical fixture `calendarInstant` and is therefore rejected before any FIT upload.
- **Existing seams reused:** `validateManualWorkoutReviewExactness` → `addManualWorkoutToActivePlanForUser` → canonical atomic reviewed persistence; `test-user reset --plan` → `materializeFirstReviewedPlanForUser(..., { calendarInstant })` → `resetQaPoolUserData`.
- **Change budget:** no new runtime artifact, migration, RPC, table, fixture framework, provider, dependency, or lockfile change. Remove the obsolete blanket Rest rejection, keep Rest outside the non-Rest count, and make the local template lifecycle use its validated start-date instant instead of the host date.
- **Focused proof:** source red-to-green; existing manual-authoring persistence proof with durable Rest readback; disposable `qa-isolation-a` reset → seed → exact-date non-Rest readback → complete reset; targeted format/lint/diff hygiene. The FIT file remains unuploaded.
- **Stop boundary:** stop before any schema, UI, provider, hosted, direct-SQL-shaping, or parallel-fixture expansion.

## Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Workout Rest And FIT Fixture Lifecycle Recovery
Stage: Backend implementation and local persistence proof
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery.md
Evidence from: docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md

Ivan authorized a focused recovery. Read AGENTS.md, agents/backend.agent.md, and skills/hito-backend-supabase-contract/SKILL.md. Re-check current dirty state and the canonical item before writing.

Fix only the first Backend owners exposed by WC-01 and WC-07. `src/lib/manual-workout-authoring/actions.ts` currently rejects every reviewed Rest draft although Rest normalization/persistence exists; make the approved Rest action work for an already reviewed editable active plan while preserving source-protected/generated policy. Separately, repair or correctly reuse the canonical disposable local materialization lifecycle so it can create and fully reset a compatible owned non-Rest workout dated 2026-05-05 for the approved FIT scenario. Use existing materialization/fixture seams; never direct-shape database rows.

Do not change Calendar/Workout UI, Design System code, QA expectations to hide the failure, hosted Supabase, providers, retained identities, Git lifecycle, or unrelated dirty work. Prove durable readback and full local cleanup. Ask the existing QA sidebar role for a bounded read-only replay only after the Backend slice is complete. Record the English tracked receipt in the canonical item and return any true Frontend/QA boundary to PRODUCT.
```

## Backend Implementation Receipt — 2026-08-15

### Stage and outcome

Backend implementation and local persistence proof are complete. A reviewed Rest draft now reaches the existing canonical Calendar add mutation when the ordinary provenance, current/future date, empty-day, log, and evidence guards permit it. The canonical disposable test-user lifecycle now materializes a fixed historical plan relative to its validated `start_date`, using the existing `calendarInstant` seam, and still relies on the unchanged future-only reviewed persistence contract.

Implementation DoD: **Passed**. Global QA Acceptance, browser acceptance, hosted parity, release, and deployment remain unclaimed.

### Root-cause discriminator

- Before the fix, a valid Rest review normalized to `workoutType: rest`, zero steps, and `executable_mode: none`, but `validateManualWorkoutReviewExactness` returned `manual_workout_required`; a second identical rejection existed in `addReviewedManualWorkoutToActivePlanForUser`. Persistence was never reached.
- Before the fix, `test-user reset --plan` passed the fixed `2026-05-05` template to `materializeFirstReviewedPlanForUser` without its supported fixture instant. The current host date therefore reached the unchanged future-only RPC contract and returned `CalendarPersistenceRejection: Future schedule materialization accepts only reviewed future rows.`
- After the fix, the two obsolete Rest-only rejections are gone, Rest is excluded from the returned non-Rest count, and the local template lifecycle passes a UTC-noon instant derived from the schema-validated plan start date. No production persistence guard was weakened.

### Files changed

- `src/lib/manual-workout-authoring/actions.ts` — removed the obsolete Rest rejection after canonical review reconstruction.
- `src/lib/manual-workout-authoring/active-plan-add.ts` — allowed reviewed Rest through the existing protected add path and corrected the non-Rest count.
- `scripts/manual-workout-authoring/active-plan-add-proof.ts` — added focused Rest review/add/count/source-safety coverage.
- `scripts/manual-workout-authoring/persistence-proof.ts` — added durable Rest row readback to the existing leased loopback persistence proof.
- `scripts/test-user.mjs` — reused `importedPlanSchema` and the existing `calendarInstant` option for deterministic fixed-template materialization.
- `docs/tasks/backlog/2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery.md` — lifecycle, preflight, and this receipt only.

No new runtime artifact, migration, RPC, table, fixture framework, dependency, lockfile entry, or compatibility path was added.

### Validation inventory

| Check                                | Scenario / environment                                                   | Result                  | Evidence                                                                                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest red discriminator               | Pure Backend review/exactness on pre-fix source                          | Passed (red reproduced) | Valid Rest normalized to zero steps / `none`, then returned `manual_workout_required`.                                                                                                                                                                      |
| Historical fixture red discriminator | Loopback Supabase; `qa-isolation-a`; canonical `reset --plan` before fix | Passed (red reproduced) | Existing future-only persistence rejected the 2026-05-05 plan with `invalid_input`; post-failure inventory was zero across every owned table.                                                                                                               |
| Rest review red-to-green             | Pure Backend review/exactness after fix                                  | Passed                  | Exact review token/checksum returned `ok: true`; canonical Rest plan retained zero executable steps and `metricTruthMode: none`.                                                                                                                            |
| Manual authoring source contract     | `npm run validate-manual-workout-authoring`                              | Passed                  | Existing add, edit, copy, move, clear, template, protected-day, logged/evidence, source, stale-review, and failure-atomic assertions stayed green; new Rest assertions reported one added Calendar row and no increase in non-Rest count.                   |
| Durable Rest persistence             | Loopback Supabase; existing leased `provider-engine` persistence proof   | Passed                  | `--require-persistence` read back `workout_type=rest`, `workout_identity=rest_and_recovery`, `calendar_icon_key=rest`, empty steps, and `executable_mode=none`; canonical cleanup returned all owned counts to zero, retained auth, and released the lease. |
| Exact-date FIT prerequisite          | Loopback Supabase; canonical `qa-isolation-a` `reset --plan`             | Passed                  | One archived provenance plan and four Calendar rows were read back; the owned non-Rest `Easy aerobic run` was exactly `2026-05-05`; result, asset, activity, comparison, evidence, and log counts stayed zero. The FIT file was not uploaded.               |
| Full disposable cleanup              | Loopback Supabase; canonical `qa-isolation-a` reset and inventory        | Passed                  | The same auth identity remained; all profile, plan, workout, log, result/asset, metric, comparison, insight, activity/source/revision/match/evidence/fact, template, entitlement, and usage counts were zero; leases were empty.                            |
| Test-user lifecycle contract         | `npm run validate-test-user-lifecycle`                                   | Passed                  | Pool roles, metadata authority, cleanup-manifest drift refusal, lease collision refusal, protected-admin handling, and canonical local-auth registry assertions passed.                                                                                     |
| Targeted syntax/lint/format          | Node syntax check, ESLint, Prettier                                      | Passed                  | `scripts/test-user.mjs` syntax/ESLint and all changed Backend/proof files' ESLint/Prettier checks passed.                                                                                                                                                   |
| Diff hygiene                         | Shared checkout                                                          | Passed                  | `git diff --check` passed; the index remained empty and unrelated dirty paths were not edited by this task.                                                                                                                                                 |

### Preserved boundaries

The unchanged guards still reject past targets, occupied targets, logged/evidence-backed targets, stale or invalid review proofs, and client-shaped workout rows. Rest remains non-copyable through the existing source capability policy. The future-only database contract, runner ownership/RLS, retained auth identities, FIT/provider boundaries, Calendar/Workout UI, Design System, hosted state, and Git lifecycle were not changed.

### Omitted checks and consequences

- WC-01 and stored-Rest WC-05 browser replay were not run. Backend persistence is proven, but user-facing Calendar acceptance remains QA-owned.
- The FIT upload/remove branch was deliberately not run. Only the exact-date owned-workout prerequisite and cleanup are proven; FIT ingestion/removal acceptance remains QA-owned.
- The full local Backend database suite and production build were not run because this slice used the focused canonical authoring persistence and fixture lifecycle proofs. Unrelated whole-repository regression and build acceptance are not claimed.
- Hosted Supabase, providers, deployment, release, and production were not accessed; no parity or readiness claim is made.

### Next owner

`QA` should replay WC-01, the stored-Rest branch of WC-05, and then the WC-07 FIT upload/remove flow using the now-proven exact-date prerequisite. Global QA remains Pending.
