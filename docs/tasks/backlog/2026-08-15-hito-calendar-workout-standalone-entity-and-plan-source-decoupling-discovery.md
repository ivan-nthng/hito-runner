# Hito Calendar Workout Standalone Entity And Plan Source Decoupling Discovery

## Work Item ID

2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery

## Status

completed

## Type

Tracked — Cross-owner calendar entity and source-plan decoupling discovery

## Priority

high

## Owner

ARCHITECT

## Epic

runner-core-readiness

## Stage

Architecture verdict complete; predecessor BACKEND task terminal; awaiting PRODUCT serialization

## Next Recommended Role

PRODUCT

## Evidence From

- [Unified Editable Workout Document Contract Discovery](./2026-08-15-hito-unified-editable-workout-document-contract-discovery.md)
- [iPad Calendar Drag, Sidebar, And Move Recovery](./2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md)
- [Workout Move Undo Stored Rest Reversibility](./2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md)
- [Calendar Workouts Independent From Plans](./2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md)
- [Retire Active-Plan Calendar Authority](./2026-08-10-retire-active-plan-calendar-authority.md)

## Scope

Define the safe target architecture and ordered migration for user-owned Calendar workouts after
materialization. A source plan may remain immutable history and provenance, but it must not own a
workout's visibility, permission, schedule, mutation, or lifecycle.

## Archive Intent

Retain until the Backend, Frontend Product, and independent QA migration slices are terminal; then
compact this record to its decision, evidence, acceptance, and residual boundary.

## Accepted Product Decision

A plan is an AI-generated, file-imported, or manually authored source artifact used only to propose
initial workout placement. Explicit confirmation materializes ordinary runner-owned Calendar workouts.
Manual, AI-authored, imported, and subsequently edited workouts are the same persisted entity; origin
is provenance only. Past Plans retain immutable authored source truth and history only. Add, Edit,
Move, Copy, Clear, completion, results, evidence, visibility, schedule, and lifecycle never depend on
a plan. No replacement active container is allowed.

This is now both accepted Product truth in [Current Product](../../current-product.md),
[Project Context](../../context.md), and the [Glossary](../../glossary.md), and a mandatory shared
policy invariant in `AGENTS.md` under **Runner Calendar Source Boundary**. Runtime names, persisted
columns, validators, fixtures, and current implementation documents cannot override it.

## Execution Preflight

- Mode remained Tracked and the only task-owned write was this item.
- `AGENTS.md`, `agents/architect.agent.md`, `skills/hito-architecture-audit/SKILL.md`, the complete
  item, linked evidence, `current-product.md`, `context.md`, `glossary.md`, `current-system.md`,
  `current-state.md`, `current-functional-map.md`, schema migrations, current source, and relevant Git
  history were read before this write and after the Product/policy amendments.
- The Git index was empty. The checkout had unrelated modified and untracked work, all preserved.
- [Workout Move Undo Stored Rest Reversibility](./2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md)
  remained `in_progress` under BACKEND. Its source, proof, and migration bytes were not modified.
- During final documentation hygiene that predecessor reached `completed`. Its final receipt and
  accepted function/event behavior were reread; no predecessor byte was changed by this task.
- No release freeze was active and no runtime, fixture, database, hosted, or Git lifecycle action was
  performed.
- Existing seams to reuse are `planned_workouts`, immutable saved-plan payloads, runner-scoped
  advisory locks, exact workout snapshots, current review/confirm actions, and the accepted atomic
  stored-Rest Undo contract. Proposed new production artifacts: one mutation-event relation, only
  because no existing immutable owner can retain deleted/displaced row evidence after source plans
  become immutable. No new workout table, active container, framework, or parallel state model.

## Demonstrated Current System

### Persisted ownership

The original schema in
[20260506025058_phase_2_phase_3_backend_foundation.sql](../../../supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql)
made `planned_workouts.plan_cycle_id` non-null, cascade-deleting, and unique only with
`workout_date`. The same row also carries `user_id`, so the database currently stores one workout
entity across origins but makes every row structurally subordinate to a plan. The foreign key does
not itself prove that the plan and workout have the same user. The schema also retains authenticated
insert/update policies for both tables even though current reviewed mutations use server-owned atomic
seams.

### The August 10 authority cutover

[20260810132840_retire_active_plan_calendar_authority.sql](../../../supabase/migrations/20260810132840_retire_active_plan_calendar_authority.sql)
archived all active plans, changed the status default to `archived`, dropped the one-active-plan
index, renamed mutation RPCs from active-plan to Calendar language, and changed Calendar reads and
replacement to runner-wide user/date truth. Commit `23d657b3003433a2a051b505fd48645fce6692ca`
introduced that migration and deleted the former plan-lifecycle UI and transition implementation.
The [Technical Log](../../history/technical-log.md) records the accepted outcome: plans became
immutable library/provenance records and materialized workouts became independent runner-owned
Calendar rows.

Current validators reinforce the same intent:

- [validate-active-plan-schedule-edit-preview.ts](../../../scripts/validate-active-plan-schedule-edit-preview.ts)
  requires archived plan status and removal of the active-plan index.
- [validate-runner-activity-read-models.ts](../../../scripts/validate-runner-activity-read-models.ts)
  requires Calendar readback without active-plan authority.
- [validate-manual-workout-authoring.ts](../../../scripts/validate-manual-workout-authoring.ts)
  requires plan origin to be provenance rather than an action gate.

### Residual coupling after that cutover

The cutover removed active-plan status authority but retained the plan row as a mandatory runtime
container:

1. [active-plan-persistence.ts](../../../src/lib/active-plan-persistence.ts) reads every user's
   Calendar workout independently of plan status, but still resolves the latest materialized plan as
   `provenancePlan`, constructs manual-only empty plan rows, and maps each workout through
   `plan_cycle_id`.
2. [training-api.ts](../../../src/lib/training-api.ts) returns onboarding when no materialized plan
   row exists, even though Calendar rows are the intended truth. It builds one global `planMeta` from
   the latest materialized plan while individual workouts may come from different source plans.
3. Current add, copy, clear, move, edit, and content-edit paths load a plan record, pass plan identity
   and `updated_at` as a concurrency token, constrain the workout by that plan ID, and update plan
   metadata. The active
   [unified content-edit migration](../../../supabase/migrations/20260815195439_unified_workout_content_edit_atomic_protection.sql)
   demonstrates the same shape.
4. The active
   [stored-Rest Undo migration](../../../supabase/migrations/20260815212107_workout_move_undo_stored_rest_reversibility.sql)
   correctly preserves a displaced Rest and validates exact snapshots, but temporarily stores that
   recovery event inside mutable plan metadata. Its atomic result is valid; only its future metadata
   owner must change.
5. [saved plan payload migration](../../../supabase/migrations/20260810114649_saved_plan_library_payload.sql)
   already provides immutable canonical plan payloads and checksums. Applying a saved plan nevertheless
   creates a second mutable materialized plan row and records `saved_plan_record_id` in metadata.
6. Manual first creation calls `createEmptyCalendarProvenanceForUser` solely to satisfy the non-null
   plan foreign key. That row is not a reviewed AI/file/manual source artifact and carries no
   product-visible source truth.
7. [calendar-projection.ts](../../../src/components/calendar/calendar-projection.ts),
   [Calendar.tsx](../../../src/components/Calendar.tsx),
   [manual-calendar-actions.ts](../../../src/components/calendar/manual-calendar-actions.ts), and
   [workout.$date.tsx](../../../src/routes/workout.$date.tsx) still consume `activePlanId`, global
   `planMeta`, plan start date, and active-plan capability vocabulary.
8. [active-plan-export-actions.ts](../../../src/lib/active-plan-export-actions.ts) can export an
   immutable saved plan correctly, but its future Calendar export derives a plan-shaped envelope from
   the first future workout's provenance. That is not truthful for a mixed-origin Calendar.
9. [admin-analytics.server.ts](../../../src/lib/admin-analytics.server.ts) and the Admin Analytics UI
   still count/filter `status = active`, although the accepted migration archived every plan.

### Regression discriminator

This is **remaining legacy from an incomplete decoupling**, not a regression that reintroduced active
plan authority. Git history proves the August 10 change deliberately removed active status and plan
transition authority. The same commit retained `getLatestMaterializedPlanProvenance`, non-null
`plan_cycle_id`, plan-based review versions, and materialized plan rows. Later work expanded those
residual seams for unified editing and stored-Rest Undo; it did not reverse the earlier product
decision. Renaming RPCs and reads without relocating identity, version, and mutation history left the
partial architecture now being completed.

## Exact Current Dependency Graph

```text
AI/file/manual source proposal
  -> immutable saved plan row in plan_cycles (payload + checksum)
  -> second mutable materialized plan_cycles row (payload null)
  -> planned_workouts.plan_cycle_id (required, cascade owner)
  -> runner-wide Calendar read
  -> latest materialized plan row -> global planMeta/capabilities/UI actions

manual authoring
  -> empty mutable materialized plan_cycles row
  -> the same planned_workouts table and the same downstream path

Calendar mutation/review
  -> runner advisory lock + exact workout snapshots
  -> plan ID + plan updated_at gate
  -> planned_workouts mutation
  -> mutable plan goal_metadata/plan_preferences event history
```

The canonical workout row is already shared. The incorrect owners are the mandatory plan foreign key,
the latest-plan read-model gate, and mutable plan metadata. No replacement workout entity is needed.

## Target Architecture Decision

### 1. One current entity

`planned_workouts` remains the only persisted Calendar-entry relation. A non-Rest row is the one
Calendar workout entity; a stored Rest row is sparse Calendar state, not a workout or plan
placeholder. `user_id` and `workout_date` own row visibility and schedule. A runner may have at most
one persisted Calendar row per date. Logged/evidence-backed protection, past-date rules, Rest
behavior, and review/confirm remain Calendar/workout facts, not source-plan facts.

The physical table may be renamed only in a later cleanup if there is a demonstrated benefit; this
migration must not create `calendar_workouts` beside it.

### 2. Optional immutable source provenance

The existing physical `plan_cycles` relation is narrowed to immutable source-plan/archive records.
Its canonical payload and checksum, source kind, original authored dates/goal, and creation time are
historical facts. `library_removed_at` controls library visibility only; it does not delete the source
archive or any Calendar workout. Plan `status` and mutable lifecycle metadata are not target
authority.

The existing workout foreign key is transactionally renamed in the final schema contract from
`plan_cycle_id` to nullable `source_plan_id` rather than duplicated:

- confirmed AI/file/import/manual plan proposal: reference the immutable source record used at
  confirm time;
- a directly reviewed manual workout with no enclosing plan artifact: `source_plan_id = null` and
  manual origin remains attributable through the workout/mutation contract;
- edit/move/delete: preserve or remove only the workout; never mutate the source record;
- copy: preserve root source provenance when known while recording the copy mutation separately;
- saved-plan Start: reference the existing immutable saved record instead of creating a second
  mutable materialized plan row.

Each non-Rest workout also needs one immutable scalar `origin_kind` copied at confirmation
(`manual`, `ai`, or `file_import`). This is the smallest provenance needed when `source_plan_id` is
null and prevents null from ambiguously meaning manual, missing, or legacy. It is display/audit data
only and is forbidden as an editability or lifecycle gate. A stable source-workout key may be retained
only when the accepted source payload already supplies one; do not synthesize a second identity.

The foreign key must not cascade-delete workouts. A same-user composite foreign key (or equivalent
database constraint) must prevent a workout from referencing another user's source archive.

For existing source rows with no immutable payload:

- re-point to a saved record only when `saved_plan_record_id`, checksum, and canonical payload prove
  exact identity;
- otherwise freeze the existing summary as `legacy summary only` evidence; absence of an original
  payload remains explicit and must never be reconstructed from later-edited workouts;
- detach manual dummy rows and remove them only after their mutation metadata has been migrated and a
  reachability census proves no unique source evidence remains.

No new persisted provenance model is required. The nullable reference plus the existing immutable
source payload is sufficient.

### 3. Schedule and content truth

`workout_date` is the persisted schedule coordinate. `weekday` is derivable from the date in the
runner's resolved Calendar timezone and must not be an independent gate. `week_number` and `phase`
may remain descriptive authored workout metadata during this program, but they never grant
permissions or recover a current plan boundary. The accepted `WorkoutDocument` contract remains the
content truth; origin is provenance only.

The database replaces `unique(plan_cycle_id, workout_date)` with runner-wide uniqueness on
`(user_id, workout_date)` after a fail-closed collision census. Empty, Rest, ordinary workout, and
evidence-backed occupancy stay explicit through existing operation policy.

### 4. Mutation concurrency and durable Undo

Remove plan ID and plan `updated_at` from review and mutation authority. Reuse:

- the per-runner PostgreSQL advisory transaction lock;
- exact source/target workout snapshots or stable hashes;
- expected date occupancy for add/copy/move;
- the protected evidence/log set for clear or future replacement; and
- profile revision where a reviewed plan also changes profile truth.

One append-only `calendar_workout_mutation_events` relation is justified because an immutable source
plan cannot own user edits and a deleted/displaced workout cannot retain its own before-image. It is
an audit/Undo seam, not a Calendar entity, plan replacement, global version row, or event-sourcing
framework. Each event needs only runner ID, mutation kind, affected workout IDs/dates, normalized
before/after or displaced snapshots, review checksum/token evidence, creation time, optional Undo
expiry, and an optional `undo_of_event_id`. Undo appends a compensating event; it does not rewrite
source history.

The current Move -> stored Rest -> Undo algorithm and 45-second validity rule transfer intact to this
owner after the active BACKEND task is terminal. Exact source/target/displaced snapshots remain the
atomic discriminator.

### 5. Read models, permissions, and exports

- Authenticated/onboarding/Calendar mode is determined by profile and Calendar data, never by the
  existence of a source plan.
- Replace global `planMeta` with source-independent Calendar context plus optional per-workout source
  provenance. No latest plan supplies capabilities or schedule bounds.
- Operation capabilities are computed from user ownership, date, workout state, evidence/log state,
  and supported content; source kind is display provenance only.
- Tighten direct table access after server consumers are proven: authenticated users may select their
  own rows, while writes use the canonical reviewed RPC/server action boundary. Source archives are
  immutable; mutation events are server-written and user-scoped.
- Source-plan export returns the immutable source payload. Calendar export returns the selected current
  Calendar rows in an origin-neutral envelope with optional per-row provenance; it never labels a
  mixed schedule with the first workout's source plan.
- Past Plans reads immutable source records. Calendar history and Undo read mutation events. Neither
  controls the other.

## Dependency Disposition And Owner Map

| Dependency                                                      | Target disposition                                                                                               | First owning slice                                            |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `planned_workouts` table and `WorkoutDocument` mapping          | Preserve as the single current workout entity; enforce runner/date ownership                                     | BACKEND schema/contract                                       |
| Non-null cascade `plan_cycle_id`                                | Migrate in place to nullable, non-cascading, same-user `source_plan_id`; do not add a parallel FK                | BACKEND schema/contract                                       |
| Origin currently derived only through a plan row                | Add immutable scalar workout `origin_kind`; never use it as a permission or lifecycle gate                       | BACKEND schema/contract                                       |
| `unique(plan_cycle_id, workout_date)`                           | Replace with `unique(user_id, workout_date)` after collision proof                                               | BACKEND schema/contract                                       |
| `plan_cycles` saved payload/checksum                            | Preserve and freeze as source archive/history                                                                    | BACKEND source archive                                        |
| Mutable materialized plan rows                                  | Migrate exact provenance to immutable source records; detach manual rows; delete only proven empty dummy rows    | BACKEND data migration                                        |
| `status`, active-plan index/policy                              | Active index is already deleted; remove remaining status authority and later obsolete column/enum consumers      | BACKEND cleanup, then Frontend/Admin consumers                |
| Plan `goal_metadata` / `plan_preferences` mutation history      | Migrate workout events to append-only mutation events; preserve source-authored payload only                     | BACKEND mutation contract                                     |
| `active_plan_user_edit(s)` and stored-Rest before-images        | Replace metadata storage with mutation events without changing accepted atomic behavior                          | BACKEND mutation contract, after active Move/Undo closes      |
| Plan `updated_at` review gate and `p_plan_id` RPC arguments     | Delete; replace with runner lock plus exact row/occupancy/evidence discriminators                                | BACKEND mutation contract                                     |
| Reviewed AI/file/import/manual plan materialization             | Migrate to create independent workouts referencing one immutable source record                                   | BACKEND materialization                                       |
| Saved plan Start creating a second materialized plan row        | Delete the duplicate row; reference the selected immutable saved record                                          | BACKEND materialization                                       |
| Future schedule replacement                                     | Preserve runner-wide future-only semantics and evidence protection; remove plan identity from its review token   | BACKEND materialization                                       |
| Direct manual workout first/add/copy/move/edit/clear            | Migrate to standalone workout context; delete empty-plan creation and plan lookup/version requirements           | BACKEND actions                                               |
| `getLatestMaterializedPlanProvenance` and plan-gated onboarding | Delete; read profile plus runner Calendar and optional per-row source records                                    | BACKEND read model                                            |
| Global `planMeta` and plan-level capabilities                   | Replace with Calendar context and per-operation/per-row capabilities                                             | BACKEND transport, then FRONTEND Product                      |
| `activePlanId`, `no_active_plan`, plan start-date UI gates      | Delete or rename to workout/calendar vocabulary after the transport changes                                      | FRONTEND Product                                              |
| Workout route `provenancePlanId` from latest plan               | Replace with the selected workout's optional `sourcePlanId`                                                      | BACKEND read model, then FRONTEND Product                     |
| Saved-plan export                                               | Preserve immutable source export                                                                                 | BACKEND export                                                |
| Future Calendar export using first provenance                   | Replace with origin-neutral Calendar export and per-row provenance                                               | BACKEND export, then FRONTEND Product if UI copy changes      |
| Admin active-plan counts/filters                                | Replace with factual source-plan and Calendar-workout measures or delete if no product owner needs them          | BACKEND Admin read model, then FRONTEND Product Admin surface |
| RLS insert/update policies on plans/workouts                    | Replace broad direct writes with select-own plus canonical server mutation boundaries                            | BACKEND security                                              |
| Historical migrations and terminal receipts                     | Preserve byte-for-byte as historical evidence; append new migrations only                                        | BACKEND / repository history                                  |
| Fixtures, generated database types, proofs, validators          | Migrate to null/manual provenance, mixed origins, runner/date uniqueness, immutable source, and event-owned Undo | BACKEND proof owners; FRONTEND fixtures; QA acceptance        |
| `active-plan-*` runtime file/type vocabulary                    | Remove or split only after consumers move; keep source archive and Calendar persistence as distinct owners       | BACKEND cleanup, then FRONTEND Product                        |
| Current system/product/history documentation                    | Refresh only after implementation acceptance; this discovery does not rewrite them                               | PRODUCT/ARCHITECT later documented closeout                   |

## Source-Of-Truth Authority Lock

The controlling order for this migration is:

1. the direct accepted decision and the mandatory `AGENTS.md` **Runner Calendar Source Boundary**;
2. `docs/current-product.md`, `docs/context.md`, and `docs/glossary.md` for current Product meaning;
3. this canonical discovery for the demonstrated implementation gap and migration boundary;
4. current runtime/schema as temporary implementation evidence only; and
5. old migrations, terminal receipts, and history as immutable evidence of what happened, never as a
   current product decision.

`docs/current-system.md`, `docs/current-state.md`, and `docs/current-functional-map.md` are descriptive
documents. Their remaining active-plan language reports a released or implemented legacy state; it
cannot overrule the first three authorities or be copied into new code, fixtures, validators, copy,
or tasks. Each is reconciled only after the implementation layer it describes has proof. A validator
that asserts the legacy container shape proves only that shape; it cannot promote the shape back into
Product truth.

## Exhaustive Legacy Owner Inventory

Disposition vocabulary in this inventory is exact:

- **DELETE** — remove the obsolete runtime responsibility or vocabulary after its consumers move;
- **MIGRATE** — keep the owner but change it to the standalone-workout contract;
- **HISTORY** — retain immutable evidence only; never execute or quote it as current authority; and
- **TEMPORARY FACT** — keep truthful current/released implementation reporting until its associated
  implementation proof exists, then reconcile it.

### Database, RLS, RPC, and generated contract owners

| Exact owner                                                                                                                                                                                                                                                                                 | Current normative residue                                                                                                                      | Disposition                                                                                                           | Serial owner / slice                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql` and `20260508104250_phase_3_tighten_persisted_plan_semantics.sql`                                                                                                                                               | Non-null cascade `plan_cycle_id`, plan/date uniqueness, active status, mutable plan/workout policies                                           | **HISTORY** as files; **MIGRATE** effective schema through a new append-only migration                                | BACKEND Slice 1                                  |
| `20260525222734_atomic_schedule_reflow_apply.sql`, `20260526015820_fix_schedule_reflow_date_swaps.sql`, `20260526020256_restrict_schedule_reflow_rpc_execute.sql`                                                                                                                           | Plan-scoped schedule RPC history                                                                                                               | **HISTORY**; confirm no callable signature survives, then **DELETE** only the surviving function/grant                | BACKEND Slice 1 census and Slice 3 cleanup       |
| `20260716001500_restore_canonical_table_acl.sql`                                                                                                                                                                                                                                            | Effective authenticated `select, insert, update` on `plan_cycles` and `planned_workouts`                                                       | **HISTORY** as file; **MIGRATE** effective grants/policies to select-own plus server-owned writes                     | BACKEND Slice 1                                  |
| `20260718030000_atomic_active_plan_workout_content_edit.sql`, `20260718131305_atomic_plan_lifecycle_persistence.sql`, `20260718142639_atomic_clear_before_import.sql`, `20260719144111_allow_today_history_backed_workout_content_edits.sql`, `20260721130000_runner_baseline_hr_truth.sql` | Earlier plan-scoped content, lifecycle, import, and profile-revision function bodies                                                           | **HISTORY**; do not edit; prove later migrations supersede every callable signature                                   | BACKEND Slice 1 census                           |
| `20260810034530_canonical_active_plan_workout_copy.sql`                                                                                                                                                                                                                                     | Earlier plan-scoped copy mutation                                                                                                              | **HISTORY** after the current mutation RPC is accepted; no source-plan gate may be reintroduced                       | BACKEND Slice 1 census                           |
| `20260810114649_saved_plan_library_payload.sql`                                                                                                                                                                                                                                             | Reusable immutable payload/checksum trigger, but mutable-plan insert/update policies and legacy import implementation remain in replay history | **MIGRATE** effective policy/import behavior; **RETAIN** immutable source trigger semantics; file remains **HISTORY** | BACKEND Slice 1                                  |
| `20260810132840_retire_active_plan_calendar_authority.sql`                                                                                                                                                                                                                                  | Correctly archives active status, but current plan/future-schedule persistence still creates mutable materialized plan rows                    | **MIGRATE** effective RPCs; file remains **HISTORY**                                                                  | BACKEND Slice 2                                  |
| `20260811125538_clear_calendar_future_workouts.sql`                                                                                                                                                                                                                                         | Latest `apply_reviewed_plan_persistence` wrapper still returns plan-shaped materialization                                                     | **MIGRATE** to confirmed source plus independent Calendar rows                                                        | BACKEND Slice 2                                  |
| `20260815195439_unified_workout_content_edit_atomic_protection.sql`                                                                                                                                                                                                                         | Current content edit locks/version-checks/mutates a plan row                                                                                   | **TEMPORARY FACT** owned by the completed unified edit slice; supersede append-only, never rewrite                    | BACKEND Slice 1                                  |
| `20260815212107_workout_move_undo_stored_rest_reversibility.sql`                                                                                                                                                                                                                            | Completed Move/Undo correctly preserves displaced Rest but stores/validates through plan identity and metadata                                 | **TEMPORARY FACT** of the accepted predecessor; preserve bytes and behavior, then supersede append-only               | New BACKEND Slice 1 adopts its accepted behavior |
| Effective RPCs `apply_calendar_workout_mutation` and `apply_calendar_workout_content_edit`                                                                                                                                                                                                  | Plan ID/version and mutable plan metadata still own Calendar writes                                                                            | **MIGRATE** signatures/bodies; revoke obsolete overloads and prove no callable legacy signatures                      | BACKEND Slice 1                                  |
| Effective RPCs `apply_reviewed_plan_persistence` and `apply_reviewed_future_schedule_persistence`                                                                                                                                                                                           | Duplicate materialized-plan creation remains in source confirmation/future apply                                                               | **MIGRATE** to immutable source plus independent Calendar rows; revoke obsolete overloads                             | BACKEND Slice 2                                  |
| Effective RLS/ACL for `plan_cycles` / `planned_workouts`                                                                                                                                                                                                                                    | Direct mutable plan/workout authority and no same-user source FK                                                                               | **MIGRATE** to immutable own-source reads, own-workout reads, server-owned writes, and same-user source reference     | BACKEND Slice 1 security proof                   |
| `src/lib/supabase/database.ts`                                                                                                                                                                                                                                                              | Generated `plan_cycles`, `plan_cycle_id`, RPC arguments, and plan-shaped return types                                                          | **MIGRATE** by regeneration from the accepted appended migration; never hand-edit as architecture                     | BACKEND Slice 1                                  |

All older migration bytes stay immutable. “Delete” above always means an effective database object in a
new migration, never deletion or rewriting of migration history.

### Backend runtime and read-model owners

| Exact paths                                                                                                                                                                                                                                                                                       | Legacy responsibility                                                                                                     | Disposition                                                                                                                                      | Serial owner / slice                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `src/lib/active-plan-persistence.ts`, `src/lib/active-plan-lifecycle-persistence.ts`                                                                                                                                                                                                              | Latest/materialized plan context, empty plan creation, duplicate materialized plan, plan-shaped mutation transport        | **MIGRATE**, then **DELETE** obsolete functions/file names; preserve immutable source-plan and Calendar persistence as separate responsibilities | BACKEND Slices 1-2, cleanup Slice 4                                                 |
| `src/lib/active-plan-workout-editing/policy.ts`, `src/lib/active-plan-workout-editing/source-capabilities.ts`                                                                                                                                                                                     | `active_plan_user_edit(s)`, plan-derived capability and source-status gates                                               | **MIGRATE** operation policy to workout/evidence truth and mutation events; **DELETE** active-plan types/reasons                                 | BACKEND Slice 1                                                                     |
| `src/lib/training-api.ts`, `src/lib/training.ts`                                                                                                                                                                                                                                                  | Latest materialized provenance gates snapshot mode; global `planMeta` and plan-level capabilities                         | **MIGRATE** to Calendar context plus optional per-workout `sourcePlan`; **DELETE** plan-gated onboarding and global capability owner             | BACKEND Slice 2                                                                     |
| `src/lib/manual-workout-authoring/actions.ts`, `active-plan-add.ts`, `copy-paste-reconstruction.ts`, `copy-paste.ts`, `delete-clear.ts`, `edit-workout-review-token.ts`, `edit-workout.ts`, `move-workout.ts`, `persisted-workout-safety.ts`, `persistence.ts`, `saved-templates.ts`, `schema.ts` | Every Add/Edit/Move/Copy/Clear review, token, insert, and failure vocabulary still assumes plan identity or plan metadata | **MIGRATE** all operations to runner/date/workout/evidence discriminators; **DELETE** empty-plan and active-plan modes after consumers move      | BACKEND Slice 1                                                                     |
| `src/lib/running-plan-engine-actions.ts`, `src/lib/plan-apply-policy.ts`, `src/lib/persisted-plan-replacement.ts`, `src/lib/calendar-overflow-actions.ts`, `src/lib/ai-plan-generation-ledger.ts`                                                                                                 | Source confirmation/future apply still creates or reasons about a current/materialized plan and active-plan conflicts     | **MIGRATE** to immutable proposal plus explicit date-conflict handling; **DELETE** current-plan replacement authority                            | BACKEND Slice 2                                                                     |
| `src/lib/active-plan-export-actions.ts`, `src/lib/plan-export.ts`, `src/routes/api.plan.export.tsx`                                                                                                                                                                                               | Valid source export and invalid mixed-Calendar export share active-plan naming/envelope                                   | **MIGRATE** into source-plan export and Calendar export; **DELETE** first-provenance/current-plan envelope                                       | BACKEND Slice 2                                                                     |
| `src/lib/weekday-rest-invariants.ts`                                                                                                                                                                                                                                                              | `active_plan` supplies blocked weekdays                                                                                   | **MIGRATE** occupancy/rest truth to runner Calendar only; **DELETE** source label                                                                | BACKEND Slice 1                                                                     |
| `src/lib/admin-analytics.server.ts`                                                                                                                                                                                                                                                               | `status = active` defines runner conversion and activity measures                                                         | **MIGRATE** to factual source-plan and Calendar-workout measures, or **DELETE** measures without a product question                              | BACKEND Slice 2                                                                     |
| `src/lib/admin-work-items.ts`, `src/virtual-admin-repo-work-items.d.ts`                                                                                                                                                                                                                           | `active_plan` / `active_plans` are Admin backlog taxonomy, not workout authority                                          | **MIGRATE** taxonomy to `plan_sources` / `calendar_workouts`; do not confuse it with runtime persistence                                         | BACKEND Admin projection after core Slice 2; PRODUCT names Admin presentation owner |
| `src/lib/changelog-utils.ts`                                                                                                                                                                                                                                                                      | Recognizes historical “active-plan refresh/apply safety” text                                                             | **HISTORY** parser compatibility only; no Calendar decision is derived from it                                                                   | No core implementation change; ARCHITECT verifies during document reconciliation    |

The first incorrect production owner is BACKEND persistence/mutation truth, not Frontend copy. No
Frontend removal can close the task while the FK, RPC, review token, or source archive remains
plan-authoritative.

### Frontend Product, Admin, and Design System consumers

| Exact paths                                                                                                                                  | Legacy consumer/copy                                                                | Disposition                                                                                | Serial owner / slice                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `src/components/calendar/calendar-projection.ts`, `manual-calendar-actions.ts`, `src/components/Calendar.tsx`                                | `planMeta`, `activePlanId`, plan start bounds, Undo cache keyed by plan             | **MIGRATE** to Calendar/row/event contract; **DELETE** plan gates and vocabulary           | FRONTEND Product Slice 3                                                                          |
| `src/routes/workout.$date.tsx`, `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx`                                       | Latest-plan provenance is passed to an individual workout editor                    | **MIGRATE** to that workout's optional source provenance; **DELETE** plan requirement      | FRONTEND Product Slice 3                                                                          |
| `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`, `ManualWorkoutSourceActionMenu.tsx`, `manual-workout-authoring-utils.ts` | `existing_active_plan`, `no_active_plan_draft`, active-plan confirmation/error copy | **MIGRATE** to direct Calendar workout review/confirm; **DELETE** container modes and copy | FRONTEND Product Slice 3                                                                          |
| `src/components/AppShell.tsx`, `TodayHero.tsx`                                                                                               | Shell and Today messaging derive current context/start from `planMeta`              | **MIGRATE** to Calendar context; **DELETE** “current plan begins” copy                     | FRONTEND Product Slice 3                                                                          |
| `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`                                                                                | “Active plan already exists” blocks source confirmation                             | **MIGRATE** to explicit Calendar date-conflict review                                      | FRONTEND Product Slice 3                                                                          |
| `src/components/progress/SavedPlanLibraryPanel.tsx`                                                                                          | Valid source library imports active-plan-named owners                               | **MIGRATE** imports/types/copy to immutable plan source; **RETAIN** Past Plans behavior    | FRONTEND Product Slice 3 after BACKEND source transport                                           |
| `src/routes/settings.tsx`                                                                                                                    | Negated “active plan already on your calendar” still normalizes the retired model   | **MIGRATE** to profile-versus-existing-calendar copy                                       | FRONTEND Product Slice 3                                                                          |
| `src/components/admin/AdminAnalyticsSummarySections.tsx`, `admin-analytics-view-model.ts`, `src/routes/admin.analytics.tsx`                  | Active-plan counts, sorting, labels, and filters                                    | **MIGRATE** or **DELETE** after Backend supplies factual measures                          | PRODUCT must name the existing Admin presentation owner after BACKEND Slice 2; not a core blocker |
| `src/routes/admin.capture.tsx`                                                                                                               | “active plans” names a repo-work taxonomy                                           | **MIGRATE** taxonomy copy, not Calendar behavior                                           | Same explicitly named Admin presentation slice                                                    |
| `src/components/hito-ds/specimen-previews.tsx`                                                                                               | “Archive active plan?” specimen copy presents the retired model                     | **MIGRATE** to source-history/library language; no Product behavior                        | DESIGN SYSTEM after FRONTEND Product vocabulary is accepted                                       |

### Fixtures, proofs, validators, and manifests

| Exact owners                                                                                                                                                                                                                                                                                                                                                               | Legacy assertion                                                                     | Disposition                                                                                                                  | Serial owner / slice                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `scripts/manual-workout-authoring/active-plan-add-proof.ts`, `copy-paste-proof.ts`, `delete-clear-proof.ts`, `empty-plan-proof.ts`, `export-proof.ts`, `move-proof-assertions.ts`, `move-proof-fixtures.ts`, `move-proof-missed-scenarios.ts`, `move-proof.ts`, `persisted-edit-proof.ts`, `persistence-proof.ts`, `saved-template-proof.ts`, `source-capability-proof.ts` | Fixtures require plan rows/IDs, plan metadata events, or active-plan rejection codes | **MIGRATE** accepted behavior to standalone rows/events; **DELETE** empty-plan proof and invert it to prove no dummy plan    | BACKEND Slice 1 proofs; source/export cases finish in Slice 2                   |
| `scripts/running-plan-engine-confirm/persistence-proof.ts`                                                                                                                                                                                                                                                                                                                 | Confirm proves plan-cycle creation and global `planMeta`                             | **MIGRATE** to immutable source plus independent rows and Calendar context                                                   | BACKEND Slice 2                                                                 |
| `scripts/lib/runner-design-profile-fixture.ts`, `runner-activity-gate-4-fixture.ts`, `qa-test-user-lifecycle.mjs`, `scripts/test-user.mjs`                                                                                                                                                                                                                                 | Test users/fixtures materialize or clean through a plan container                    | **MIGRATE** fixture setup/cleanup to source archives, standalone rows, and event cleanup                                     | BACKEND Slice 2; QA consumes only after acceptance                              |
| `scripts/validate-active-plan-schedule-edit-preview.ts`                                                                                                                                                                                                                                                                                                                    | Validates partial August 10 retirement but still names/materializes provenance plan  | **MIGRATE** into the source-decoupling validator; **DELETE** active-plan validator identity after equivalent assertions move | BACKEND Slice 1/2                                                               |
| `scripts/validate-manual-workout-authoring.ts`, `validate-runner-activity-read-models.ts`, `validate-runner-calendar-context.ts`, `validate-calendar-overflow-future-actions.ts`, `validate-ai-generated-running-plan-creation.ts`, `validate-running-plan-engine-confirm.ts`, `validate-planned-workout-language.ts`                                                      | Current proof graph imports plan owners or asserts plan-shaped transport/reasons     | **MIGRATE** assertions to the mandatory origin-neutral contract; retain unrelated evidence assertions                        | BACKEND Slice 1/2; FRONTEND Product adds consumer proof in Slice 3              |
| `scripts/validate-runner-activity-foundation.ts`, `validate-runner-activity-gate-4.ts`, `plan-first-provider-representation-proof.ts`, `plan-authoring-doctrine/first-plan-release-gates.ts`                                                                                                                                                                               | Incidental setup or source-plan language may assume a current plan                   | **MIGRATE** only setup/terminology that reaches Calendar authority; **RETAIN** provider/source-authoring facts               | BACKEND Slice 2 reachability check                                              |
| `scripts/validate-backend.mjs`                                                                                                                                                                                                                                                                                                                                             | Validation manifest points to active-plan-named validator                            | **MIGRATE** manifest only after equivalent replacement proof exists                                                          | BACKEND Slice 2                                                                 |
| `scripts/admin-backlog-import/contract-proof.ts`, `markdown.ts`, `import-repo-work-items-to-admin-backlog.ts`, `validate-admin-capture-backlog.ts`                                                                                                                                                                                                                         | Admin taxonomy parses `active_plan(s)`                                               | **MIGRATE** taxonomy after core source/read model; it is not Calendar proof                                                  | BACKEND Admin projection slice                                                  |
| `scripts/artifact-hygiene/qa-evidence-package-selection.mjs`, `qa-folder-manifest.mjs`                                                                                                                                                                                                                                                                                     | Raw matches are historical path/category strings only                                | **HISTORY** / retain; never use them as Product authority                                                                    | No implementation change unless reachability proves an active taxonomy consumer |

### Current truth documents and historical evidence

| Document owner                                                                                  | Current state                                                                                                                                  | Disposition                                                                                                                        | Serial owner / slice                                                                  |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `AGENTS.md` Runner Calendar Source Boundary                                                     | Mandatory cross-role invariant                                                                                                                 | **RETAIN** as controlling policy; do not duplicate it into role files or validators                                                | All owners; no task-owned change                                                      |
| `docs/current-product.md`, `docs/context.md`, `docs/glossary.md`                                | Correct accepted plan-source and runner-owned workout model                                                                                    | **RETAIN** as Product truth; never weaken to match legacy code                                                                     | PRODUCT decision source; ARCHITECT verifies links/consistency at final reconciliation |
| `docs/current-system.md`                                                                        | Still calls `active plan cycle -> planned workouts` the canonical pipeline and describes replacement as intended lifecycle                     | **TEMPORARY FACT** only; label mentally as implemented legacy until proof, then **MIGRATE** to implemented standalone architecture | ARCHITECT after BACKEND Slices 1-2 and FRONTEND Slice 3 pass owner proof              |
| `docs/current-state.md`                                                                         | Truthfully reports the released baseline with active-plan persistence, but its “Current Product Truth” is no longer decision authority         | **TEMPORARY FACT** for released state; **MIGRATE** only after a new release receipt                                                | PRODUCT after release terminal state                                                  |
| `docs/current-functional-map.md`                                                                | Stale `generated-plan-creation-engine`, `active-plan-lifecycle-calendar-planned-workouts`, manual active-plan policy, and import/export owners | **TEMPORARY FACT**; **MIGRATE** rows/slugs to source-plan materialization and Calendar workout lifecycle after source proof        | ARCHITECT after Slices 1-3, before independent QA inventory is frozen                 |
| `docs/history/technical-log.md`, old migrations, completed/closed backlog receipts, Git history | Evidence of the prior active-plan model and August 10 partial retirement                                                                       | **HISTORY**; retain factual dated outcomes and never use them to override current policy/Product truth                             | No implementation owner; ARCHITECT cites only as evidence                             |

### Anti-regression admission rule

Every later slice must run a scoped reverse search for `active_plan`, `activePlan`, `ActivePlan`,
`plan_cycle`, `planMeta`, `provenancePlan`, “current plan”, and “active plan”. Each hit must be one of:

1. immutable migration/history evidence;
2. an immutable source-plan/archive fact;
3. a temporary path explicitly owned by the next serial slice; or
4. a defect that blocks closure.

A new Product surface, fixture, validator, mutation rule, current document, or generated contract may
not add those terms as Calendar authority. Source-plan wording is permitted only when it describes the
pre-confirmation artifact or Past Plans provenance. The final cleanup gate requires zero unowned
normative hits; raw historical hits are retained and explicitly excluded.

## Ordered Serial Migration Program

These slices accumulate into one unreleased candidate. No intermediate slice is independently
deployable, and no temporary path becomes product authority.

### Gate 0 — serialize existing work

**Satisfied on 2026-08-15.** The BACKEND stored-Rest Move/Undo task reached `completed` with focused
source, local database, build, and independent QA proof. Its displaced-Rest before-image,
database-time expiry, latest-event check, full-row fingerprint, evidence protection, two-readback
result, and no-partial-write negatives are fixed migration input. The new Backend task must not
reuse, rewrite, or reopen that lifecycle item or its historical migration.

### Slice 1 — BACKEND standalone Calendar write foundation

This is the **first implementation slice** and the next implementation dispatch after Gate 0. It is
not another design/discovery task.

**Outcome:** make Add, Edit, Move, Copy, Clear, content edit, and Undo operate atomically on
runner-owned Calendar workouts without a plan ID, plan version, or mutable plan metadata. Preserve the
accepted stored-Rest recovery exactly.

**Pre-write discriminator:** inventory local and later authorized hosted rows for duplicate
`(user_id, workout_date)` occupancy, cross-user references, saved/materialized/manual source rows,
exact saved-record checksum links, legacy payload gaps, parseable `active_plan_user_edit(s)`, stored
Rest before-images, logs/FIT/evidence, and every direct authenticated write caller. Record counts and
stable hashes. Stop before the migration on any unexplained collision, ownership mismatch, unknown
event shape, or ambiguous payload. Missing source payload remains explicit; it is never fabricated.

**Implementation boundary:**

1. append one fail-closed migration; never edit the active or historical migrations;
2. create only the justified append-only `calendar_workout_mutation_events` relation;
3. migrate validated edit/Move/Undo evidence from plan metadata with count/hash equality;
4. change the existing workout/source relationship to optional, same-user, and non-cascading, add
   immutable row `origin_kind`, and add runner/date uniqueness;
5. freeze source-plan facts and tighten direct RLS/ACL writes;
6. replace effective Calendar mutation/content-edit RPC plan arguments with runner, row, occupancy,
   evidence, and review discriminators;
7. migrate `src/lib/manual-workout-authoring/*`, active-plan editing policy, weekday/Rest policy, and
   low-level persistence transport to the new write contract;
8. regenerate database types; and
9. migrate the focused manual-authoring and stored-Rest proofs, including the negative assertion that
   direct manual Calendar Add creates no dummy plan row.

**Preserved:** source-plan creation/materialization reads, Product snapshot/UI consumers, exports,
Admin measures, and current documents remain unchanged for the next serial slices. The slice is not
deployable or releasable alone; any expected integration typing break must be exact and confined to
the named Slice 2/3 consumers, never hidden by a second write path or compatibility container.

**Proof:** migration apply/replay from a clean local database; row/event count and checksum equality;
RLS/ACL negative cases; direct manual, AI-provenance, imported-provenance, mixed-origin,
logged/evidence-backed, Rest, concurrent-review, and Move -> stored Rest -> Undo -> reload database
cases. No browser or release claim.

### Slice 2 — BACKEND source materialization, read model, export, and Admin facts

Within the existing reviewed confirm seams:

- persist an AI/file/manual proposal once as immutable source history and materialize independent
  workouts referencing it;
- stop creating duplicate materialized source rows and stop creating empty manual plan rows;
- keep direct manual workout review valid with no enclosing plan artifact;
- remove latest-materialized-plan gating from onboarding/snapshot mode;
- expose source-independent Calendar context and optional per-workout source provenance;
- replace plan-shaped future apply with explicit runner/date conflict handling;
- split immutable source-plan export from origin-neutral Calendar export; and
- replace or delete Admin active-plan measures with factual source/archive and Calendar measures.

Migrate the remaining Backend fixtures, validators, generated types, and validation manifest in this
slice. The Backend handoff names the exact changed Product transport; it does not preserve `planMeta`
as a second authority.

### Slice 3 — FRONTEND Product consumer and product-copy cutover

Consume Calendar context and per-workout source provenance. Remove `activePlanId`, `no_active_plan`,
global plan capabilities, plan-start eligibility, latest-plan shell/title context, current-plan copy,
and first-provenance export assumptions from Calendar, workout detail, setup, Past Plans, Settings,
and the named Product components. Preserve the current stored-Rest Undo UX and all operation-specific
safety. No Design System primitive change is implied.

Admin copy does not silently enter this slice because no canonical Admin presentation lane currently
exists. PRODUCT must name the existing presentation owner after Slice 2 supplies factual measures.

### Slice 4 — named presentation cleanup and dead-source deletion

- The PRODUCT-named Admin presentation owner migrates/deletes active-plan metrics, filters, and
  taxonomy copy.
- DESIGN SYSTEM replaces the isolated `/hitoDS` active-plan specimen phrase with source-history
  language; runtime Product behavior remains read-only for that role.
- BACKEND and FRONTEND Product, in their own serial ownership, delete dead latest-plan queries,
  empty-plan creation, duplicate materialization, obsolete RPC overloads, policy branches, types,
  files, and consumer vocabulary after reverse reachability is empty.

Dormant database columns/enum values are dropped only by an appended Backend cleanup migration after
retained evidence and rollback needs are empty. Historical migration bytes and dated receipts remain.

### Slice 5 — current truth reconciliation

After Slices 1-4 pass owner proof:

- ARCHITECT updates `docs/current-system.md` and `docs/current-functional-map.md` to implemented
  source-plan/Calendar ownership and verifies `current-product.md`, `context.md`, and `glossary.md`
  remain unchanged in meaning;
- PRODUCT updates `docs/current-state.md` only after the associated release receipt makes the new
  released baseline factual; and
- no current document update precedes source proof or substitutes for it.

### Slice 6 — independent QA and release

QA runs the acceptance inventory below against a fresh isolated runner and a separately admitted
migrated legacy fixture. It also runs the final anti-regression vocabulary census. PRODUCT routes any
failed first owner. Release begins only from a fresh repository-wide candidate freeze after every
implementation/document owner is terminal.

## Migration Failure And Rollback Contract

- Take a pre-migration backup plus row counts/hashes for source archives, workouts, logs/evidence, and
  mutation metadata. Hosted evidence requires separately authorized Backend/release work; it was not
  obtained here.
- Every backfill runs in one transaction and raises on collision, ownership mismatch, checksum
  mismatch, unknown payload shape, or event-count mismatch. A failed migration changes nothing.
- Old migrations remain immutable. Recovery is an appended forward migration or restoration of the
  pre-migration snapshot, never editing history or reconstructing source truth from current workouts.
- Before any standalone write is accepted, the whole candidate may be rolled back to the pre-cutover
  snapshot. After a null-source manual workout or plan-independent mutation exists, rollback must fix
  forward within the standalone-workout contract; it must not reinstall plan authority or discard the
  new row/event.
- The target does not require a runtime compatibility layer because Backend and Frontend slices are
  accumulated before release. If production mechanics require schema and code to run independently
  against non-empty hosted data, stop and return that demonstrated deployment constraint to PRODUCT;
  a bounded expand/contract window needs separate admission and an explicit deletion deadline.
- Ivan's earlier no-user statement is not database evidence. The release owner must still prove the
  current hosted row census before choosing an atomic cutover.

## Independent QA Acceptance Matrix — Not Run

| Scenario                                          | Required observation                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Direct manual create/edit/move/copy/delete/reload | One Calendar row per date, `origin_kind = manual`, null source plan, no dummy plan row, stable review protection    |
| Manual source-plan confirmation                   | Independent `origin_kind = manual` workouts reference one immutable manual source artifact; later actions ignore it |
| AI materialization                                | Independent workouts reference one immutable authored source; later edits do not change it                          |
| File/import materialization                       | Same entity and permissions as manual/AI; source archive remains immutable and attributable                         |
| Saved plan Start                                  | No duplicate materialized plan record; selected archive checksum and payload remain unchanged                       |
| Mixed-origin Calendar                             | Reads, capabilities, ordering, and exports work without latest/active plan selection                                |
| Existing legacy payload available                 | Exact checksum re-point succeeds with counts/hashes preserved                                                       |
| Existing legacy payload unavailable               | Workout survives; summary-only provenance is explicit; no retroactive fabrication                                   |
| Runner/date collision                             | Migration and mutation fail closed without partial writes                                                           |
| Cross-user source reference                       | Constraint/RLS/RPC reject it; no data disclosure                                                                    |
| Past/logged/FIT/evidence-backed workout           | Existing protection remains authoritative across edit/move/delete/future replacement                                |
| Rest and Move -> stored Rest -> Undo -> reload    | Original workout and original Rest are restored exactly; event and expiry are durable                               |
| Concurrent edit/move/copy                         | Runner lock and exact row/occupancy snapshot return stale review without partial mutation                           |
| Future schedule replacement                       | Only admitted future rows change; past/history/evidence survive; source archive does not become authority           |
| Source-plan export                                | Original immutable payload/checksum exported, unaffected by Calendar edits                                          |
| Calendar export                                   | Current selected rows exported truthfully across mixed origins; no first-plan envelope                              |
| Onboarding/no plan                                | Profile and Calendar truth determine mode; a manual Calendar works with zero source plans                           |
| Admin Analytics                                   | No active-plan zero-metric remains; replacement measures are factual or removed                                     |
| Rollback rehearsal                                | Pre-write rollback restores snapshot; post-write recovery preserves standalone rows/events                          |

## Rejected Alternatives

- **Second Calendar workout table:** rejected because `planned_workouts` already owns every origin and
  `WorkoutDocument` already supplies one content contract.
- **Replacement active Calendar container or version row:** rejected because user/date ownership,
  runner locks, and exact row/occupancy snapshots express the required invariants without another
  lifecycle owner.
- **Keep a mutable materialized plan as “provenance”:** rejected because it remains a hidden permission,
  version, cascade, and metadata owner and duplicates the immutable source record.
- **Store edits in the immutable source plan:** rejected because authored source history and subsequent
  user actions are different facts.
- **Store Undo only on the current workout:** rejected because clear/delete/replacement removes the row
  whose before-image must survive.
- **Reconstruct missing historical source payloads from current workouts:** rejected because edited,
  moved, or deleted workouts cannot prove the original authored document.
- **Large rename-only refactor:** rejected because vocabulary cleanup without moving FK, version, and
  mutation ownership would repeat the incomplete August 10 cutover.

## Validation Inventory

| Check                                          | Scenario / environment          | Result  | Evidence                                                                                                    |
| ---------------------------------------------- | ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| Instruction and task preflight                 | Local canonical checkout        | Passed  | Policy, role, skill, canonical item, linked items read completely                                           |
| Product/policy authority alignment             | Current Product docs + AGENTS   | Passed  | Manual/AI/import source-only and origin-neutral Calendar invariant agrees across all controlling sources    |
| Source/schema dependency census                | Local source and all migrations | Passed  | Schema, RPC, RLS, server, read-model, UI, export, Admin, fixture, validator owners mapped above             |
| Regression discriminator                       | Local Git history               | Passed  | Commit `23d657b3003433a2a051b505fd48645fce6692ca`, August 10 migration, validators, and Technical Log agree |
| Dirty-owner boundary                           | Current worktree                | Passed  | Index empty; BACKEND Move/Undo bytes remained separate and reached terminal completion                      |
| Markdown links and formatting                  | This canonical item             | Passed  | Local links, Prettier, direct trailing-whitespace scan, scoped no-index check, and repository diff check    |
| Runtime/build/browser/hosted/Global QA/release | Out of scope                    | Not run | Architecture discovery only; no acceptance inferred                                                         |

## Precise Blockers And Handoff

1. No predecessor-writer blocker remains: Move -> stored Rest -> Undo is completed and its accepted
   atomic behavior is fixed input.
2. Before schema mutation, BACKEND must produce the row/collision/payload/event census. Local source cannot
   prove current hosted data or source-payload recoverability.
3. PRODUCT must create and serialize separate canonical slices. The first implementation owner is
   **BACKEND**, bounded to the Slice 1 standalone Calendar write foundation; it begins with the
   mandatory census and continues into the appended schema/RPC/action implementation only if every
   discriminator passes. FRONTEND Product follows after Backend Slice 2 fixes the transport.
4. No unresolved product-model choice remains. A non-empty hosted dataset that forces independently
   deployable schema/code phases would be a new release constraint and must return to PRODUCT before a
   compatibility window is introduced.

## Tracked Receipt

- **Outcome:** established one standalone Calendar workout entity, optional immutable source-plan
  provenance, event-owned mutation/Undo history, exhaustive legacy-owner removal map, and a serial
  implementation migration without a replacement active container or parallel workout model.
- **Root cause:** the August 10 authority retirement changed status and reads but retained mandatory
  plan FK, latest-plan snapshot gating, plan version tokens, and mutable plan metadata.
- **Files changed:** this canonical item only.
- **Preserved:** runtime, migrations, predecessor BACKEND work, fixtures, generated output, Git/index, hosted
  state, and unrelated dirty work.
- **Acceptance:** architecture/source/Git-history evidence only. Implementation, browser QA, Global QA,
  hosted parity, release, and deployment remain unclaimed.
- **Next recommended role:** PRODUCT to dispatch the BACKEND Slice 1 standalone Calendar write
  foundation as the first implementation task.
- **Subagent:** none; direct source and Git history resolved the discriminator without interrupting an
  active named owner.
