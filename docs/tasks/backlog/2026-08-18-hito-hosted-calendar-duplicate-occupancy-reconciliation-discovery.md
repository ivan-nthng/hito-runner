# Hito Hosted Calendar Duplicate Occupancy Reconciliation Discovery

Work Item ID: `2026-08-18-hito-hosted-calendar-duplicate-occupancy-reconciliation-discovery`
Status: completed
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: runner-core-readiness
Parent: [Hito Hosted Runner Core Migration Parity And Production Deploy](./2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md)
Evidence From: [Hito Hosted Runner Core Migration Parity And Production Deploy](./2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md)

## Scope

Read only the hosted duplicate `(user_id, workout_date)` Calendar occupancies that block migration
`20260816004652`. Establish a privacy-preserving inventory and a deterministic, source-backed
reconciliation policy that never deletes or overwrites FIT/evidence/log-backed workouts.

## Archive Intent

Retain until Product has authorized the exact bounded reconciliation and the hosted migration retry
has independently recorded its outcome.

## Task

Identify the duplicate groups, their lifecycle/evidence/provenance relationships, and whether every
group can be reconciled by one existing source-of-truth rule. The accepted runner model permits one
Calendar workout per runner/date, but this discovery must prove which existing row is canonical
before any hosted mutation.

## User Report

The authorized hosted migration stopped because current production data violates the one-runner,
one-date Calendar occupancy invariant. Ivan asked to change only what is necessary and wants the
production release unblocked quickly.

## Evidence

The normal hosted migration push applied versions `20260815195439` and `20260815212107`, then
`20260816004652` raised `Standalone Calendar migration stopped: runner/date occupancy is not
unique.` Remaining migrations and deploy are blocked.

## Observed Behavior

At least one hosted `planned_workouts` duplicate group exists. The migration safety guard correctly
refuses to add the unique constraint rather than silently deleting one row.

## Expected Behavior

One explicit reconciliation policy preserves canonical runner workouts and all protected evidence;
if any group cannot be resolved without a product choice, it is reported precisely rather than
modified.

## Required Discriminator

For each duplicate group, establish opaque group identity/count, each row's calendar date,
lifecycle, source provenance, and protected evidence/log/result/comparison/insight/activity-match
state. Determine whether one row is authoritative using already accepted Calendar protection rules.

## What Not To Touch

Do not mutate hosted data, apply migrations, run deploys, edit source/migrations/configuration,
expose runner identities or private payloads, use providers, alter local state, or perform Git
actions. Do not use ad-hoc mutation SQL or weaken the unique invariant.

## Validation Expectations

- Use existing linked hosted read-only access and canonical Calendar/evidence definitions.
- Return an aggregate/privacy-safe inventory and deterministic reconciliation matrix.
- Identify the smallest future mutation boundary, rollback evidence, and exact condition requiring
  Product direction.
- Record only task-local documentation and preserve concurrent hosted-deploy work.

## Stage

Duplicate occupancy repair completed; parent retry blocked on origin classification

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Hosted Calendar Duplicate Occupancy Reconciliation Discovery
Stage: Read-only hosted duplicate occupancy inventory and reconciliation decision
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-hosted-calendar-duplicate-occupancy-reconciliation-discovery.md
Blocked parent: docs/tasks/backlog/2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, the two
canonical items, and only existing Calendar/evidence protection seams necessary to interpret the
duplicates. This is read-only discovery; Ivan has not authorized data deletion or hosted mutation.

Use the existing linked hosted Supabase read-only procedure to inventory exactly the duplicate
`planned_workouts (user_id, workout_date)` groups blocking migration `20260816004652`. Do not expose
names, emails, raw FIT data, workout content, storage IDs, or user IDs. For every group, classify
only the factual lifecycle, provenance, and protection/evidence states needed to decide canonical
survival. Reuse accepted Calendar protection rules: FIT/result/log/comparison/insight/activity-match
backed rows must never be automatically deleted or overwritten.

Return a privacy-safe aggregate plus a deterministic reconciliation matrix, or the exact product
decision required for any ambiguous group. Do not mutate data, run migrations/deploy, edit source,
use ad-hoc mutation SQL, or touch Git/local fixtures. Update only this item with an English receipt
and route the smallest authorized mutation slice back to PRODUCT.
```

## Blockers

None for duplicate occupancy reconciliation. The parent release is independently blocked by the
next migration guard because three hosted legacy source kinds cannot be mapped to an accepted
Calendar origin without a Product provenance decision.

## Implementation Receipt — Authorized Hosted Repair — 2026-08-18

### Scope Change And Preflight

Ivan explicitly superseded the read-only boundary and authorized deletion of only the extra hosted
Calendar rows in each duplicate `(user_id, workout_date)` group, followed by an immediate retry of
the blocked migration/deployment chain. The linked project remained the expected healthy production
project `dltfjwexyctmihclcjqj`; local `main` remained at
`14ccfbfe8742d5d894e9629169a946d144a4d06f`, and the Git index remained empty.

The accepted protection seam was reused without exposing identities or payloads. A row was treated
as evidence-protected when linked by any of `workout_logs`, `workout_result_assets`,
`workout_actual_metrics`, `workout_comparisons`, `workout_ai_insights`, or
`runner_activity_planned_workout_matches`.

### Aggregate Repair Evidence

- **Before:** `341` duplicate occupancy groups and `1,561` extra Calendar rows.
- **Deterministic keeper rule:** within each group, rank evidence-protected rows first, then
  `created_at` ascending, then primary key ascending. Retain rank one and target only ranks greater
  than one.
- **Dependency guard:** the single explicit transaction locked the Calendar and six evidence tables
  for the bounded operation and would raise/roll back if any targeted extra row had a protected
  dependency. No guard fired; no evidence row was deleted, nulled, or overwritten.
- **Mutation:** one explicit transaction deleted exactly `1,561` targeted extra
  `planned_workouts` rows and no other direct rows.
- **After:** `0` duplicate occupancy groups and `0` extra Calendar rows, proved both before commit
  by the transaction assertion and after commit by a privacy-safe aggregate read.

No names, emails, user IDs, workout/storage IDs, dates, workout content, FIT payloads, or private
source payloads were selected into the receipt or reported.

### Validation And Release-Chain Result

| Check                       | Scenario / environment                            | Result             | Evidence                                                                                 |
| --------------------------- | ------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| Linked target               | Existing production Supabase project              | Passed             | Exact project ref `dltfjwexyctmihclcjqj`, status healthy                                 |
| Pre-repair aggregate        | Privacy-safe grouped read                         | Passed             | 341 groups; 1,561 extras; no row identities or content returned                          |
| Minimal deletion            | One guarded explicit hosted transaction           | Passed             | 1,561 direct Calendar extras deleted; target/deletion equality asserted                  |
| Protected dependencies      | Six canonical evidence tables                     | Passed             | Transaction would roll back on any dependency; no dependency guard fired                 |
| Post-repair invariant       | Privacy-safe grouped read                         | Passed             | Zero duplicate groups and zero extras                                                    |
| Remaining migration dry-run | Repository-pinned Supabase CLI `2.109.1`          | Passed             | Proposed only `20260816004652`, `20260816020328`, and `20260816171845`                   |
| Remaining migration apply   | Normal linked `db push`                           | Blocked safely     | `20260816004652` stopped with `a workout origin cannot be classified` before application |
| Hosted parity               | Pinned migration history and repository validator | Failed as expected | 43 hosted versions; exact three-version missing delta; no unknown hosted version         |
| Vercel deploy and HTTP      | Conditional on hosted parity                      | Not run            | Migration parity remained red, so no deployment or candidate reachability claim exists   |

### New Independent Boundary

The duplicate repair is complete. A privacy-safe aggregate found `315` remaining workouts across
`8` materialized source records whose source kinds are outside the migration's accepted origin
set:

| Hosted source kind                             | Source records | Workouts |
| ---------------------------------------------- | -------------: | -------: |
| `plan_preset_v1`                               |              2 |       19 |
| `running_plan_engine_marathon_base_builder_v1` |              1 |       70 |
| `structured_authoring_v1`                      |              5 |      226 |

The task did not infer whether those facts are manual, AI, or file-import provenance. It did not
rewrite source kinds, weaken the migration, retry in a loop, or widen deletion. PRODUCT must select
the truthful accepted origin mapping before any separately authorized hosted provenance repair or
migration change.

### Preserved Boundaries And Return

No source, migration, generated type, script, fixture, dependency, configuration, secret, local
database, provider integration, Git history, Supabase/Vercel setting, or domain was changed. No reset,
ad-hoc migration SQL, deployment, browser QA, Global QA, or production-product acceptance ran. The
only repository write is this task-local receipt plus the explicitly required parent receipt.

Return to PRODUCT with the exact three-kind provenance decision above. After that separate bounded
repair is authorized and completed, the parent release must start again from a fresh exact migration
preflight.
