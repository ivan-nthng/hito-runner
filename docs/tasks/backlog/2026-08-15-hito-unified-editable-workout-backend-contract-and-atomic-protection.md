# Hito Unified Editable Workout Backend Contract And Atomic Protection

## Work Item ID

2026-08-15-hito-unified-editable-workout-backend-contract-and-atomic-protection

## Status

completed

## Type

Tracked — Backend persisted workout editing contract and transactional protection

## Priority

high

## Owner

BACKEND

## Epic

runner-core-readiness

## Parent

[Hito Unified Editable Workout Document Contract Discovery](./2026-08-15-hito-unified-editable-workout-document-contract-discovery.md)

## Evidence From

[Hito Unified Editable Workout Document Contract Discovery](./2026-08-15-hito-unified-editable-workout-document-contract-discovery.md)

## Stage

Backend Implementation DoD complete; FRONTEND Product adoption pending

## Next Recommended Role

FRONTEND

## Scope

Make `WorkoutDocument` the one origin-neutral persisted content-edit contract for valid current or
future unlogged non-Rest manual, AI-authored, and imported workouts. Restore atomic server-side
protection for logged and evidence-backed rows.

## Accepted Product Decision

Manual and AI-authored training are one planned-workout entity. Origin is immutable provenance only,
not an editor data model or content-edit eligibility rule.

## Demonstrated Cause

The persisted entity is already `planned_workouts` with `WorkoutDocument` sections, but the current
content capability, review, and confirm paths require reconstruction into the narrower manual-draft
grammar. That reconstruction loses valid document fields. The current transaction also lacks the
logged/evidence checks needed to enforce the accepted unlogged-only rule atomically.

## Existing Seams To Reuse

- `src/lib/workout-document.ts`
- `src/lib/active-plan-workout-editing/source-capabilities.ts`
- `src/lib/manual-workout-authoring/edit-workout.ts`
- `src/lib/manual-workout-authoring/edit-workout-review-token.ts`
- `src/lib/manual-workout-authoring/persisted-workout-safety.ts`
- `src/lib/active-plan-workout-editing/policy.ts`
- `apply_calendar_workout_content_edit` and the existing manual-authoring proofs

## Required Outcome

- Strictly normalize and validate the full `WorkoutDocument` at the write boundary.
- Calculate content eligibility from valid document, date, lifecycle, and evidence state — never
  origin or manual reconstruction.
- Review/sign/confirm the complete normalized candidate against an authoritative row fingerprint;
  preserve root provenance and append one origin-neutral user-edit event per confirm.
- Preserve all unedited document fields, including ordered repeats, targets, target provenance,
  arbitrary target extras, IDs, and stable row/schedule identity.
- Replace `apply_calendar_workout_content_edit` through one function-only migration that atomically
  rejects logged, skipped, result-asset, actual-metric, comparison, and AI-insight rows.

## Boundaries And Non-Goals

- No new table, persisted draft/document, generic editor framework, blanket backfill, hosted action,
  provider action, or compatibility path.
- Manual creation, copy, move, delete, Rest lifecycle, and Frontend routes/styles remain outside this
  slice. The separately demonstrated stored-Rest Move → Undo loss remains a later Backend task.
- Do not implement the editor UI, add origin-specific client policy, or make a browser workaround for
  a persistence invariant.

## Definition Of Done

- Manual, AI, and imported valid workouts share the same Backend edit capability and lossless review
  / confirm path; source origin is preserved only as provenance.
- A no-op/title-only edit retains normalized equality for all non-edited fields; exactly one existing
  row updates and date/plan/neighbours remain unchanged.
- Logged, skipped, evidence-backed, past, Rest, malformed, and non-losslessly-readable cases fail
  closed both in capability readback and direct transactional confirm, including an eligibility race.
- Existing local proofs cover rich targets/extras, ordered repeats, stale review/token rejection,
  repeated-edit root provenance, cancellation/failure byte equivalence, and consumer readback.
- Backend may use the existing named QA role only for a bounded, read-only acceptance-matrix review;
  it remains the sole production writer and returns to PRODUCT for FRONTEND Product adoption.

## Validation Expectations

Use disposable local state for migration/persistence proof; run proportional focused validators,
formatting, lint, and diff hygiene. Do not claim browser, Global QA, hosted, release, or deployment
acceptance. Report any need for a new persisted shape, a copy/move/delete rewrite, or an unresolved
product decision to PRODUCT before expanding scope.

## Backend Execution Preflight — 2026-08-15

- **Mode / owner:** Tracked / BACKEND. No other repository or managed-runtime writer was active;
  the Git index was empty before the first task-owned write.
- **Outcome:** replace the manual-draft-gated persisted edit path with one lossless
  `WorkoutDocument` review/confirm contract for valid current or future unlogged non-Rest rows, and
  restore atomic evidence protection.
- **Root-cause discriminator:** `source-capabilities.ts` and `edit-workout.ts` reconstruct persisted
  rows through the narrower manual grammar. The effective `apply_calendar_workout_content_edit`
  function checks only Rest/past state and omits workout logs, result assets, actual metrics,
  comparisons, and AI insights.
- **Existing seams reused:** `workout-document.ts`, the current capability/policy/edit/review/safety
  modules, `apply_calendar_workout_content_edit`, and the existing manual-authoring proof files.
- **Reuse-first change budget:** new production runtime artifacts: **none**. One append-only,
  function-only migration is required because historical migrations are immutable and the current
  function body is the incorrect atomic owner. No table, column, RPC signature, persisted draft,
  framework, compatibility layer, fixture path, dependency, or generated-type change is proposed.
- **Simplification:** remove manual reconstruction/review as persisted content-edit authority;
  manual creation/copy/move remain unchanged. Replace `direct_manual_edit` metadata for this path
  with one origin-neutral document-edit event while preserving earliest root provenance.
- **Dirty-work boundary:** existing unrelated Rest-proof hunks in shared validator files remain
  owned by their earlier completed item and must be preserved byte-for-byte around any additions.
- **Focused proof:** strict document normalization; manual/AI/imported positives; target extras and
  ordered repeats; same-row/root-provenance/review exactness; logged/skipped/evidence/past/Rest/
  malformed/race negatives; local migration application and disposable cleanup; focused formatting,
  lint, type, and diff hygiene.
- **Stop boundary:** no new persistence shape, Frontend edit, copy/move/delete/Rest rewrite,
  provider/hosted action, or unresolved Product decision is admitted.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Unified Editable Workout Backend Contract And Atomic Protection
Stage: Bounded Backend implementation before Frontend Product adoption
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-unified-editable-workout-backend-contract-and-atomic-protection.md
Parent evidence: docs/tasks/backlog/2026-08-15-hito-unified-editable-workout-document-contract-discovery.md

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, the complete
canonical item, and the parent discovery before the first write. This assignment supersedes no
other active Backend work; preserve every unrelated dirty hunk byte-for-byte.

Outcome: implement one origin-neutral persisted content-edit contract for every valid current or
future unlogged non-Rest planned workout. Manual, AI-authored, and imported origins are the same
entity for editing; origin is durable provenance only. `WorkoutDocument` remains the only persisted
editable value. `ManualWorkoutCanonicalDraft` remains manual-creation-only and must not gate or
reconstruct persisted content edits.

Root cause and existing seams: the parent discovery proves that manual-draft reconstruction is
lossy and currently gates capability, review, and confirm. It also proves that the existing content
edit transaction no longer atomically rejects logged/evidence-backed rows. Reuse the listed
WorkoutDocument, source-capability, edit/review-token, persisted-safety, policy, existing
`apply_calendar_workout_content_edit`, and current manual-authoring proof seams.

Implement the smallest complete Backend correction: strict document write validation; eligibility
based on valid document/date/lifecycle/evidence rather than origin; lossless full-document
review/sign/confirm against the authoritative row fingerprint; root-provenance preservation and
one origin-neutral edit event; and one function-only migration restoring atomic rejection for logs,
skips, result assets, actual metrics, comparisons, and AI insights. Preserve stable row/schedule
identity and untouched repeats, target provenance, target extras, and document metadata.

Do not change Frontend routes/styles/editor UI, manual creation, copy/move/delete, Rest lifecycle,
fixtures, providers, hosted state, or the separately queued stored-Rest Move → Undo defect. Do not
add a table, persisted draft, blanket backfill, framework, or compatibility path. Stop and return to
PRODUCT if a new persisted shape, cross-owner implementation, or product decision becomes necessary.

Validate with existing focused source and local disposable persistence proofs: manual/AI/imported
lossless positives; rich target/extras and ordered-repeat exactness; same-row readback; repeated
root provenance; stale review/token and eligibility-race rejection; protected/past/Rest/malformed
negatives; cancellation/failure byte equivalence; migration application; formatting, lint, and diff
hygiene. You may ask the existing named QA role for one bounded read-only matrix review; do not
delegate Backend implementation. Update only the canonical lifecycle truth for this task and return
to PRODUCT with the exact FRONTEND Product consumer contract. Do not claim browser, Global QA,
hosted, release, or deployment acceptance.
```

## Backend Tracked Implementation Receipt — 2026-08-15

### Task And Stage

- **Task:** Hito Unified Editable Workout Backend Contract And Atomic Protection.
- **Mode / owner:** Tracked / BACKEND.
- **Completed stage:** bounded Backend implementation and local persistence proof.
- **Lifecycle:** this Backend item is `completed`. FRONTEND Product adoption, browser QA, Global QA,
  hosted parity, release, and deployment remain separate and unclaimed.

### Product Outcome And Root Cause

The persisted content-edit path now treats every strictly readable current or future unlogged
non-Rest `planned_workouts` row as the same editable entity. Manual, AI-authored, and imported
origins affect durable provenance only. `WorkoutDocument` is normalized and signed losslessly;
`ManualWorkoutCanonicalDraft` remains limited to manual creation.

The demonstrated first incorrect owners were the persisted edit capability/review path, which
reconstructed a narrower manual draft, and the database function, which checked only date/Rest
state after review. The correction removes manual reconstruction from content eligibility and
replaces the current function through one append-only function migration with row-lock-time checks
for every protected evidence relation.

### Reused And Changed Owners

- `src/lib/workout-document.ts` now owns strict full-document write normalization, including stable
  section IDs, ordered repeat children, target provenance, arbitrary scalar target extras, and
  canonical workout semantics. This file is intentionally the consolidated document owner; adding
  a second runtime normalization module would create parallel truth. The larger owner remains under
  1,000 lines and replaces substantial manual-draft logic from the edit action/proofs.
- `src/lib/active-plan-workout-editing/source-capabilities.ts` derives content capability from the
  document, runner-local date, lifecycle, and evidence rather than plan origin.
- `src/lib/manual-workout-authoring/edit-workout.ts`,
  `edit-workout-review-token.ts`, and `persisted-workout-safety.ts` now review/sign/confirm the
  normalized document projection against the complete authoritative row fingerprint and preserve
  AI target exactness or an explicit runner-entered replacement.
- `src/lib/active-plan-workout-editing/policy.ts` preserves the earliest root provenance and appends
  one `workout_document_edit` event to each existing audit container.
- `supabase/migrations/20260815195439_unified_workout_content_edit_atomic_protection.sql` replaces
  only `apply_calendar_workout_content_edit`; it adds no table, column, RPC signature, generated
  type, compatibility path, or new privilege surface.
- Existing proofs were updated in
  `scripts/manual-workout-authoring/source-capability-proof.ts`,
  `scripts/manual-workout-authoring/persisted-edit-proof.ts`, and the task-owned sections of
  `scripts/manual-workout-authoring/persistence-proof.ts`. Pre-existing completed Rest-lifecycle
  hunks in the shared persistence proof were preserved.

No Frontend, Design System, provider, fixture framework, dependency, lockfile, hosted state, or
unrelated dirty source was changed by this task.

### Validation Inventory

| Check                            | Scenario / environment                                                | Result                   | Evidence                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-cause discriminator         | Current source                                                        | Passed                   | Persisted edit capability no longer imports manual reconstruction/review; the replacement function contains guards for `workout_logs`, `workout_result_assets`, `workout_actual_metrics`, `workout_comparisons`, and `workout_ai_insights`.                                                                                                                                           |
| Origin-neutral source matrix     | Deterministic source validator                                        | Passed                   | `npm run validate-manual-workout-authoring` covered manual, AI-authored, and imported positives; rich target/extras and ordered-repeat equality; malformed, unsafe-target, past, Rest, logged, skipped, and evidence-backed negatives; stale token/review; cancellation/failure equivalence; and repeated root provenance.                                                            |
| Disposable persistence lifecycle | Loopback Supabase `http://127.0.0.1:54321`                            | Passed                   | `node --env-file=.env.local --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence` persisted same-row edits for the canonical origins, rejected an eligibility race atomically, preserved row/plan/history bytes on failure, kept move/clear/Rest/template coverage green, reset every owned row, preserved the pooled auth user, and released the lease. |
| Migration application            | Local Supabase                                                        | Passed                   | `npx supabase migration list --local` reports `20260815195439`; live `pg_get_functiondef` contains all five evidence guards; function ACL is only `postgres` and `service_role`, with `public`, `anon`, and `authenticated` revoked.                                                                                                                                                  |
| Targeted formatting and lint     | Task-owned Markdown/TypeScript                                        | Passed                   | Focused `prettier --check` and ESLint completed without findings.                                                                                                                                                                                                                                                                                                                     |
| Backend type boundary            | Repository TypeScript diagnostic filtered to task-owned Backend seams | Passed                   | No task-owned Backend or proof error remained after the focused TypeScript diagnostic.                                                                                                                                                                                                                                                                                                |
| Frontend consumer discriminator  | Repository TypeScript diagnostic                                      | Expected handoff failure | `ManualWorkoutPersistedEditControls.tsx` still reads removed lossy `draftInput` / `draftReview` fields. This is the explicit FRONTEND Product adoption boundary; Backend did not add a false compatibility payload.                                                                                                                                                                   |
| Diff hygiene                     | Shared checkout                                                       | Passed                   | `git diff --check` completed without whitespace errors; unrelated dirty paths and the empty Git index were preserved.                                                                                                                                                                                                                                                                 |

### Exact FRONTEND Product Consumer Contract

The existing authenticated transport symbols remain
`reconstructManualWorkoutPersistedEditDraft`, `reviewManualWorkoutPersistedEditDraft`, and
`confirmManualWorkoutPersistedEdit`; their persisted-edit payload is now origin-neutral:

1. Reconstruct accepts only `{ plannedWorkoutId, workoutDate, provenancePlanId? }`. Success is
   `{ status: "document_ready", document, editProjection, provenancePlanId, ... }`.
2. Review accepts those identifiers plus the complete `editProjection`. Success is
   `{ status: "review_ready", editProjection, candidateDocument, review, ... }`; `review` contains
   the checksum and token for the normalized full document and authoritative source fingerprint.
3. Confirm accepts the same complete `editProjection`, `reviewToken`, and `reviewChecksum`. Success
   has status `updated` and returns `plannedWorkoutId`, `workoutDate`, `editedWorkout`, `planCycle`,
   and `sourceMetadata`; the row/date/schedule identity is unchanged.
4. The client must edit/render the returned document projection, submit no persisted row or manual
   draft, require explicit review confirmation, and refresh on any blocked/stale result. Capability
   is truthful through `canEditContent` / `editContentReason`; origin must not create client policy.

The former `draftInput` and `draftReview` fields are intentionally absent. FRONTEND Product is the
next owner for the existing control's lossless `WorkoutDocument` editor adoption and subsequent
browser acceptance.

### Preserved Boundaries, Omissions, And Blockers

- Manual creation, copy, move, delete, Rest lifecycle, the queued stored-Rest Move → Undo defect,
  FIT/provider flows, fixtures, authentication behavior, and row-level ownership were not changed.
- The migration was applied only to disposable local Supabase. Hosted migration parity was not run
  or changed; hosted behavior is unverified.
- A production build and the repository-wide TypeScript gate were not claimed because the old
  Frontend consumer intentionally does not yet implement this contract. This prevents any build,
  browser, Global QA, hosted, release, or deployment acceptance claim.
- No subagent was used; the source and persistence evidence was produced directly by BACKEND.
- **Blockers:** none inside Backend Implementation DoD. The next required owner is FRONTEND Product.
