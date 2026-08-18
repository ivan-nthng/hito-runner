# Hito Unified Editable Workout Document Contract Discovery — 2026-08-15

## Work Item ID

2026-08-15-hito-unified-editable-workout-document-contract-discovery

## Status

completed

## Type

Tracked — Cross-owner canonical workout authoring and editing discovery

## Priority

high

## Owner

ARCHITECT

## Epic

runner-core-readiness

## Stage

Canonical contract and migration-boundary discovery completed

## Next Recommended Role

PRODUCT, to dispatch the first bounded BACKEND implementation slice

## Evidence From

[Hito Workout Core Flow QA Scenario Catalog](./2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md)

## Scope

Define one canonical editable workout-document contract for manually authored, AI-authored, and
imported planned workouts. Authoring origin remains durable provenance; it is not an editing data
model or capability boundary.

## Accepted Product Decision

A manual training and an AI-authored training are the same planned-workout entity. Every valid,
current or future, unlogged, non-Rest planned workout is eligible for the same content-edit path.
Past, Rest, logged, evidence-backed, malformed, or non-losslessly readable rows remain protected.

## Execution Preflight

- **Mode and owner:** Tracked read-only architecture discovery owned by ARCHITECT. Only this
  canonical item was writable.
- **Root cause:** `planned_workouts` and `WorkoutDocument` already unify persistence and readback,
  but `resolveCalendarWorkoutSourceEditingCapabilities()` and the persisted edit actions require a
  successful reconstruction into the narrower `ManualWorkoutDraftInput` and
  `ManualWorkoutCanonicalDraft` grammar. That reconstruction is not lossless.
- **Existing seams to reuse:** `WorkoutDocument`, `planned_workouts`, the source-capability read
  model, server review/confirm exactness, `apply_calendar_workout_content_edit`, and
  `active_plan_user_edits` metadata.
- **Later implementation artifacts:** no new table, persisted document model, framework, service,
  fixture system, or parallel lifecycle. The minimum is one non-persisted lossless editor boundary
  inside existing authoring seams, one origin-neutral review-payload version, and a function-only
  database migration restoring transactional eligibility guards.
- **Preservation:** the active BACKEND sidebar read-model, active FRONTEND iPad recovery, all dirty
  runtime files, fixtures, schema, migrations, packages, hosted state, and Git lifecycle remained
  untouched. The index was empty. Release Retry 7 was already `completed`; no candidate freeze was
  active.

## Demonstrated Current System

### Canonical producers and persistence

| Producer           | Current transformation                                                                                              | Durable output                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Manual constructor | `ManualWorkoutDraftInput` → `normalizeManualWorkoutDraft()` → `ManualWorkoutCanonicalDraft` → Training Plan V2 seed | One `planned_workouts` row whose `steps` are WorkoutDocument sections |
| AI plan generation | AI canonical Training Plan V2 → `buildImportedPlanSeed()`                                                           | `WorkoutDocument[]`, then the same `planned_workouts` columns         |
| Imported plan      | strict Training Plan V2 parsing → `buildImportedPlanSeed()`                                                         | `WorkoutDocument[]`, then the same `planned_workouts` columns         |

`ImportedWorkoutSeed` is already an alias of `WorkoutDocument`. AI preview explicitly obtains its
documents through `buildImportedPlanSeed(canonicalPlan)`. Manual normalization already emits
`WorkoutDocumentSection[]`. There is no origin-specific persisted workout table.

### Canonical consumers

- `src/lib/training.ts` aliases `Step`, prescriptions, and targets to WorkoutDocument types.
- `src/lib/training-api.ts` reads `planned_workouts.steps` through
  `readWorkoutDocumentSections()` and attaches Backend-owned `sourceEditing` capabilities.
- Workout detail, Calendar projection, plan export, persisted-plan replacement, result comparison,
  and the new workout-detail sidebar read model consume the same row/document truth.
- `src/routes/workout.$date.tsx` exposes Edit only when the persisted workout is non-Rest, the plan
  operation is allowed, and `workout.sourceEditing.canEditContent` is true. The menu is therefore a
  consumer, not the capability owner.

### Current manual-only editing boundary

`ManualWorkoutCanonicalDraft` extends `WorkoutDocumentContent`, but also carries a manual template,
manual source identity, derived totals, mapping gaps, and a manual target-truth mode. It is the
canonical result for **manual creation**, not the universal persisted edit document.

`buildManualWorkoutDraftInputFromPersistedWorkout()` currently sits in content capability,
reconstruct, review, and confirm. It is also reused by copy and some move/delete safety paths, so it
must not be globally removed as part of the content-edit slice. The unified edit path should detach
from it while existing copy/move/delete behavior remains separately owned.

The reconstruction is demonstrably lossy because it:

- guesses a manual template from source type, identity, family, or workout type;
- rejects sections outside the manual block grammar;
- heuristically infers repeat-child roles;
- trims or truncates title, notes, labels, and guidance to manual-form limits;
- preserves only selected target fields and selected target-source combinations;
- can omit arbitrary target `extra` fields and other valid WorkoutDocument metadata; and
- reduces target truth to `none` or `structure_only`.

The first incorrect owner is therefore the BACKEND edit-contract boundary, not the route menu.

### Current protection mismatch

`source-capabilities.ts` calculates `canEditContent` before its logged/evidence branches and carries
that value into the blocked result. Current proofs intentionally expect logged and evidence-backed
rows to retain content edit. The latest `apply_calendar_workout_content_edit` transaction rejects
only Rest and dates before the runner's current date; an earlier version's checks across
`workout_logs`, `workout_result_assets`, `workout_actual_metrics`, `workout_comparisons`, and
`workout_ai_insights` were removed. The accepted unlogged-only contract therefore requires both a
read-model correction and a transactional guard. A UI-only change would leave a time-of-check /
time-of-use bypass.

## Architecture Verdict

### 1. Canonical edited value

`WorkoutDocument` is the canonical edited value and `planned_workouts` remains the only persisted
entity. `ManualWorkoutCanonicalDraft` remains the manual-creation normalization result. It must not
be promoted into a second universal persisted or review model.

The persisted row and WorkoutDocument divide as follows:

- **Stable entity/schedule identity:** `id`, `user_id`, `plan_cycle_id`, `workout_date`, `weekday`,
  `week_number`, `phase`, `display_order`, original `source_workout_id`, and original
  `source_workout_type` do not change during a content edit. Moving/rescheduling remains a separate
  Calendar mutation.
- **Editable document content:** title, notes, ordered sections, prescriptions, guidance, and
  targets.
- **Derived current content semantics:** workout type, family, identity, icon, and metric mode may
  change only when the edited document requires it. A title-only edit preserves them exactly.
- **Preserved unless explicitly supported by a control:** goal context, planned RPE, estimated
  fatigue, recovery priority, segment IDs, and unrepresented target metadata. The editor may not
  clear them as a side effect of projection.

### 2. One non-persisted lossless editor boundary is required

The existing UI is built around manual constructor entries, so passing an arbitrary
WorkoutDocument directly into `ManualWorkoutConstructorEditor` is not currently possible. The
smallest safe bridge is one deterministic, non-persisted boundary adapter inside the existing
authoring flow:

1. Backend loads and strictly normalizes the authoritative persisted WorkoutDocument.
2. The adapter projects it into the editor's controls while retaining every canonical field,
   section identity, ordered repeat child, target field, and target provenance. Unsupported but
   valid fields remain explicit read-only passthrough data; they are never dropped.
3. Frontend returns only the edited projection and identifiers. It does not become authoritative
   for the base document or source fingerprint.
4. Backend reloads the row, rebuilds the candidate from its authoritative base plus the edit,
   validates losslessness and target rules, and produces the full normalized WorkoutDocument.
5. Review signs that full candidate and the source fingerprint. Confirm rebuilds the same result
   and atomically updates the same row.

This adapter is an authoring boundary, not a second model: it is not stored, exported, indexed, or
used by readback consumers. The current manual reconstruction is not an acceptable implementation
of it.

### 3. Round-trip invariants

For source document `S`, reviewed candidate `C`, and reloaded document `R`:

- `S` must pass a strict WorkoutDocument parse before Edit is offered. The current permissive
  `readWorkoutDocumentSections()` filter is a readback compatibility seam, not sufficient write
  validation.
- Applying no edits must yield normalized equality: `normalize(C) = normalize(S)`.
- After an edit, every field outside the explicit edit set remains normalized-equal to `S`.
- `R` must equal the reviewed normalized `C`; Calendar, workout detail, export, result comparison,
  and sidebar readback must observe the same content.
- Exactly one existing `planned_workouts.id` is updated. Date, display order, plan, and neighboring
  rows remain unchanged.
- `prescription.children` is the authoritative repeat structure. Materialized section `children`
  is derived/readback only and must agree with it; the editor never maintains two independent
  repeat sources.
- Repeat count, child role, order, sequence, labels, guidance, unit modes, duration/distance, and
  child targets survive a title-only edit and reload.
- Unchanged section IDs and ordering remain stable. New/reordered sections receive deterministic
  validated identity without colliding with existing segments.
- Empty, malformed, unsupported, or non-losslessly normalizable rows fail closed with a truthful
  capability reason and no mutation.

### 4. Target truth

- Preserve the complete WorkoutDocument target, including execution mode, target source,
  pace/HR/RPE/cadence fields, cues, hints, source notes, and arbitrary `extra` values.
- An untouched AI-authored target and its pace/HR provenance remain normalized-exact.
- A client may not alter values while retaining AI-authored provenance. It may explicitly replace
  them with runner-entered guidance, in which case the candidate records runner provenance.
- Runner-entered targets may be edited through validated controls.
- A structure-only or target-free workout must not acquire fabricated pace or heart-rate truth.
- Metric mode and executable section targets must remain coherent. Unknown unsafe target
  provenance blocks review; it is never sanitized by deletion.

The current manual checksum-count guard proves only selected AI target fields after a lossy manual
projection. The unified review must validate the complete document target before persistence.

### 5. Provenance and mutation metadata

Origin is immutable audit provenance, not current capability. Reuse
`ACTIVE_PLAN_USER_EDIT_SOURCE_KIND`, `ACTIVE_PLAN_USER_EDIT_MUTATION_KIND.editWorkout`,
`buildActivePlanUserEditMetadata()`, the existing `active_plan_user_edits` history, and the stored
`previous_workout` before-image.

The origin-neutral edit event must:

- identify the same planned workout and plan;
- retain the original plan source kind/status and confirmed import origin;
- retain the first authoring `source_workout_id` and `source_workout_type` across repeated edits;
- record the pre-edit full row, review-payload version/checksum, mutation checksum, and explicit
  user-edit source once per successful confirm; and
- describe the mutation as a unified document edit, not `direct_manual_edit`.

For a second or later edit, Backend resolves root origin from the earliest existing event for that
`planned_workout_id`; it must not relabel the preceding user-edited shape as the original author.
The shared metadata builder remains the one event authority. No third provenance store is added.

### 6. Review, confirm, and failure behavior

Reuse the current explicit review/confirm protocol and exactness helper, with an origin-neutral,
versioned payload. The signed payload includes:

- plan ID/source and current plan version;
- planned workout ID/date and a full source-row fingerprint;
- the complete normalized edited WorkoutDocument;
- root-origin and user-edit metadata to be appended;
- neighboring row identities/counts; and
- `trustedClientRows: false`.

Confirm reloads all authoritative state and reconstructs the candidate server-side. Stale plan,
row, date, steps, evidence, checksum, token, or eligibility rejects without updating the workout or
plan metadata. Cancel, parse failure, validation failure, review failure, RPC failure, and an
eligibility race leave both byte-equivalent. Old manual-specific review tokens are not accepted by
the new endpoint version.

## Eligibility Contract

| State                                                           | `canEditContent` | Direct server confirm | Reason                                  |
| --------------------------------------------------------------- | ---------------- | --------------------- | --------------------------------------- |
| Current or future, unlogged, valid non-Rest; manual origin      | true             | allowed after review  | Same entity contract                    |
| Current or future, unlogged, valid non-Rest; AI origin          | true             | allowed after review  | Origin is provenance only               |
| Current or future, unlogged, valid non-Rest; imported origin    | true             | allowed after review  | Origin is provenance only               |
| Logged, including skipped                                       | false            | atomically rejected   | Historical result owns truth            |
| Result asset, actual metrics, comparison, or AI insight exists  | false            | atomically rejected   | Evidence-backed truth is protected      |
| Past unlogged non-Rest                                          | false            | rejected              | Historical schedule boundary            |
| Rest, any date                                                  | false            | rejected              | Rest is outside workout content editing |
| Missing ownership/provenance or malformed/non-lossless document | false            | rejected              | Cannot prove a safe round trip          |

Capability computation uses document validity plus date/lifecycle/evidence state, never plan or
workout origin. Its reason must distinguish protected lifecycle from an invalid document so the UI
does not misreport a source-origin restriction.

## Migration, Legacy, and Rollback Decision

- **No table or column migration:** the shared persisted entity and JSON `steps` already represent
  the contract. Do not add a parallel editor document, manual/AI discriminator, or persisted draft.
- **One function-only migration is required:** replace `apply_calendar_workout_content_edit` in
  place to restore transactional checks for `workout_logs`, `workout_result_assets`,
  `workout_actual_metrics`, `workout_comparisons`, and `workout_ai_insights`, while retaining today
  eligibility and its source-fingerprint/plan-version guards.
- **No blanket backfill:** source evidence does not prove existing valid rows need rewriting.
  Existing rows are evaluated on demand through the strict document contract. A malformed or
  non-lossless row is ineligible and reported; it is never silently coerced. A later read-only data
  census may establish a separately owned repair, but this implementation does not invent one.
- **Rollback:** disable the new capability and restore the preceding function body/code version.
  Because no persisted shape changes, already completed edits remain valid WorkoutDocuments and no
  data rollback is required. Keep review payloads versioned so rollback rejects incompatible
  outstanding tokens. The existing `previous_workout` event remains recovery evidence, not an
  automatic destructive rollback command.

## Exact Implementation Seams and Serial Owners

### Slice 1 — BACKEND

Use the existing files and responsibilities; no new production file is required by this verdict.

1. `src/lib/workout-document.ts`: add strict normalization/write validation and equality rules for
   the existing WorkoutDocument contract, including repeats, targets, extras, and identifiers.
2. `src/lib/active-plan-workout-editing/source-capabilities.ts`: remove manual reconstruction from
   content eligibility; require valid current/future unlogged non-Rest document truth; set logged
   and evidence-backed `canEditContent` to false with precise reasons.
3. `src/lib/manual-workout-authoring/edit-workout.ts` and
   `edit-workout-review-token.ts`: make the persisted content-edit path consume the lossless
   document boundary, review/sign the full document, preserve stable row/source fields, and append
   origin-neutral metadata. Manual creation remains unchanged.
4. `src/lib/manual-workout-authoring/persisted-workout-safety.ts`: generalize target preservation to
   the complete WorkoutDocument target contract instead of selected manual fields.
5. `src/lib/active-plan-workout-editing/policy.ts`: admit the origin-neutral mutation mode and keep
   the existing shared metadata builder authoritative.
6. Replace `apply_calendar_workout_content_edit` with one function-only migration containing the
   atomic evidence guards. Do not access hosted state during implementation.
7. Extend the existing manual authoring capability, persisted-edit, and persistence proofs rather
   than adding a test framework. Reverse the current logged/evidence edit expectations and add rich
   manual/AI/imported round trips, races, same-row exactness, and repeated-edit provenance.

Backend closes only after its source tests prove the contract and migration against disposable
local state. It returns to PRODUCT; it does not implement the editor UI.

### Slice 2 — FRONTEND, Product lane

1. Reuse `ManualWorkoutPersistedEditControls.tsx` and `ManualWorkoutConstructorEditor.tsx` as the
   one visible authoring path, replacing manual draft state with the Backend-owned lossless editor
   projection.
2. Keep `src/routes/workout.$date.tsx` a capability consumer. Do not add origin checks or bypass
   `sourceEditing`.
3. Render read-only passthrough truth without dropping it, expose precise protected/invalid reasons,
   preserve cancel/review/confirm behavior, and refresh from persisted truth after save.
4. Prove desktop and 375px behavior for manual, AI, and imported positives and protected negatives.

Frontend returns to PRODUCT after focused browser proof; it does not define persistence or target
provenance.

### Slice 3 — QA

Independent QA runs only after both implementation slices are terminal and an admitted disposable
fixture contains manual, AI-authored, imported, logged/evidence, past, and Rest cases. QA owns no
fixes. Global QA and release remain later independent gates.

## Rejected Alternatives

| Alternative                                                             | Decision                                                                                                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Make `ManualWorkoutCanonicalDraft` universal                            | Rejected: template inference, text bounds, repeat-role heuristics, target filtering, and truth-mode reduction are lossy.                         |
| Enable the route menu regardless of capability                          | Rejected: bypasses Backend ownership and leaves invalid/protected direct calls.                                                                  |
| Gate by manual/AI/import source allowlists                              | Rejected: contradicts the accepted same-entity decision and reproduces the defect.                                                               |
| Trust a full client-supplied base document                              | Rejected: stale or tampered client truth could overwrite authoritative fields.                                                                   |
| Add a second persisted editor model/table                               | Rejected: `planned_workouts` plus WorkoutDocument already owns the entity.                                                                       |
| Blanket-rewrite existing rows                                           | Rejected: no demonstrated data need, silent coercion risk, and unnecessary rollback cost.                                                        |
| Protect logged/evidence state in UI only                                | Rejected: current transaction permits a review/confirm race.                                                                                     |
| Rewrite copy, move, and delete with the edit contract in the same slice | Rejected: they have separate behavior and current consumers of manual reconstruction; changing them would broaden ownership and regression risk. |

## Required Implementation and Independent QA Matrix

These are planned checks, not results.

| Check               | Scenario / environment                                                                      | Required result                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Origin neutrality   | Identical valid document persisted as manual, AI, and imported; today and future            | Same Edit capability and one authoring path; origin changes provenance only                          |
| Manual positive     | Current and future unlogged non-Rest                                                        | Open, edit, review, confirm, and reload succeed                                                      |
| AI positive         | Current/future AI workout with rich pace/HR target and repeat                               | Same path; untouched AI target truth remains exact                                                   |
| Imported positive   | Time, distance, and `none` sections                                                         | Same path; no template relabeling, truncation, or field loss                                         |
| Lossless title edit | Rich documents from all origins                                                             | All non-title fields remain normalized-equal, including IDs, order, metric mode, targets, and extras |
| Repeat exactness    | Three ordered children, duplicate roles, mixed time/distance targets                        | Count, authoritative children, roles, order, labels, guidance, and targets survive reload            |
| Target truth        | AI pace, personal/default HR, runner target, RPE, cadence, cue, hint, and arbitrary `extra` | Unchanged provenance survives; provenance tampering rejects; explicit runner replacement succeeds    |
| Same entity         | Successful edit from every origin                                                           | Same ID/date/display order/plan; exactly one row; neighbors unchanged                                |
| Provenance          | Manual/AI/imported first edit and second edit                                               | Root origin remains stable; one user-edit event per successful confirm                               |
| Logged/evidence     | Completed, skipped, result asset, actual metrics, comparison, and AI insight                | Capability false and atomic Backend rejection                                                        |
| Eligibility race    | Add log/evidence after review before confirm                                                | Confirm rejects; no workout or metadata mutation                                                     |
| Past and Rest       | Past unlogged non-Rest; current/future Rest                                                 | Capability false and direct action rejection                                                         |
| Invalid legacy      | Empty, malformed, unsupported, or non-lossless step shape                                   | Truthful fail-closed reason; no conversion or mutation                                               |
| Review exactness    | Change plan version, row/date/steps, candidate, checksum, or token                          | Stale/invalid review; no write                                                                       |
| Cancel/failure      | Close, validation failure, normalization failure, or RPC failure                            | Row and plan metadata remain byte-equivalent                                                         |
| Reload/readback     | Workout detail, Calendar, persisted API, export, result comparison                          | All consumers agree with reviewed persisted document                                                 |
| Browser contract    | Desktop and 375px, positive and protected cases                                             | One visible editor path, actionable blocked states, no origin-only branch                            |

## Independent QA Read-Only Review

The existing named QA role reviewed source and the matrix without browser, runtime, fixture, or file
mutation. It confirmed the lossy manual projection, the logged/evidence capability leak, the removed
transactional guard, and the absence of unified AI/imported browser acceptance. QA added mandatory
sentinels for arbitrary target extras, ordered repeat children, repeated-edit root provenance,
eligibility races, same-row persistence, cancel/failure byte equivalence, and cross-consumer reload.
Those checks are incorporated above.

## Risks and Return Conditions

- A UI adapter that preserves only known manual fields does not satisfy the contract.
- A Backend slice that corrects capabilities without the transactional evidence guard remains
  bypassable and must not hand off to Frontend as complete.
- The source corpus proves selected reconstructable AI/imported examples, not every persisted row;
  strict document validation and the later local fixture are required.
- If implementation needs a new persisted shape, generic editor framework, copy/move/delete rewrite,
  origin policy choice, or backfill of real rows, stop and return to PRODUCT before expanding scope.
- No unresolved Ivan decision remains for this discovery. Product still controls dispatch, fixture
  admission, Global QA, release, and any hosted action.

## Validation and Tracked Receipt

| Check                                                               | Scenario / environment                                                                             | Result  | Evidence                                                                                     |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Required reads                                                      | Policy, ARCHITECT role, architecture skill, canonical item, and complete evidence item             | Passed  | Completed before the first task-owned write                                                  |
| Source/persistence census                                           | Producers, consumers, row shape, review, capabilities, metadata, targets, and effective migrations | Passed  | Current source and migrations inspected; no runtime or hosted query used                     |
| Independent review                                                  | Existing QA role, source/evidence only                                                             | Passed  | Mandatory acceptance and silent-loss sentinels integrated                                    |
| Scope preservation                                                  | Shared dirty checkout and concurrent BACKEND/FRONTEND work                                         | Passed  | Only this canonical item changed; index remained empty                                       |
| Markdown formatting and links                                       | This item                                                                                          | Passed  | Scoped Prettier, local-link existence, direct whitespace scan, and `git diff --check` passed |
| Browser, runtime, build, local database, hosted, Global QA, release | Outside read-only discovery                                                                        | Not run | No implementation or acceptance claim is made                                                |

**Outcome:** WorkoutDocument is the canonical editable and persisted value. One non-persisted,
lossless boundary adapter is required for the existing manual-oriented editor. Backend must first
replace manual reconstruction in content editing, sign the full document, preserve root provenance,
and restore atomic logged/evidence guards. Frontend Product then adopts the adapter; independent QA
validates the full matrix.

**Residual boundary:** Implementation, migration execution, disposable fixture preparation,
browser acceptance, Global QA, hosted parity, release, and production acceptance remain pending and
separately owned.
