# Hito Unified Workout Authoring Contract And Editor Consolidation

Work Item ID: `2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation`
Status: in_progress
Type: Feature
Priority: highest
Owner: PRODUCT
Epic: runner-core
Evidence From: `2026-08-19-hito-manual-template-target-selection-noop`
Parent: [Hito Clean-Slate Runner Reform And Agent Operating Model](./2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)
Depends On: [Hito Local Supabase Clean Baseline And Data Cutover](./2026-08-20-hito-local-supabase-clean-baseline-and-data-cutover.md)

## Scope

Define the incremental replacement of divergent workout-creation and editing flows with one
canonical `WorkoutDocument` contract, one editor state model, one validation/review path, and one
server-authoritative confirmation path. This applies to manual from-scratch creation, template
creation, AI-proposed detailed workouts, imported initial workouts, and editing any independently
owned Calendar workout.

Origin is provenance only: `manual`, `template`, `ai`, or `file_import` may provide initial
document content and source history, but must not choose a different editable schema, target model,
form state, validation path, or persistence authority.

## Archive Intent

Retain the source map, migration sequence, invariants, and proof boundaries because this is the
Runner Core authoring foundation for later adaptive Blueprint materialisation.

## Task

Produce a source-backed, owner-separated migration plan. Establish the existing authoring and
editing owners, duplicate contracts, and the narrow canonical contract that can replace them. The
plan must make a reliable manual workout possible without creating another one-off target fix.

## Accepted Product Invariants

- Every editable Calendar workout uses the same `WorkoutDocument` shape, editor state, target
  fields, validation, review, and confirm semantics.
- Templates and AI/file sources supply initial content only. After confirmation, the workout is
  runner-owned; source provenance is immutable history, never live edit authority.
- Editing an AI-authored, manually authored, template-originated, or file-imported workout opens
  the same editor and has the same input vocabulary. Eligibility restrictions from completed,
  protected, or FIT/evidence-backed states remain factual policy, not an alternative editor.
- FIT/raw files, results, comparisons, completion history, and protected-workout rules are
  preserved. No destructive backfill, synthetic source conversion, active-plan authority, or
  duplicate persistence model is admitted.
- The eventual change removes proven superseded authoring DTOs/branches rather than leaving a
  permanent compatibility maze.

## Evidence And Boundary

- Ivan reports that Target choices in the real production manual-template flow are unusable. Local
  fixture proof passed, proving a production/version disparity rather than closing the runner
  outcome.
- FRONTEND has now demonstrated the production bundle is behind current source: confirmed hosted
  deployment `14ccfbf…` versus current `HEAD`/`origin/main` `9143336…`; hosted migration parity is
  required before a post-deploy replay. This release boundary remains separate from the authoring
  redesign.
- This discovery must not implement a source patch, alter hosted data, deploy, call providers, or
  use Ivan's personal account.

## Required Plan Output

- One canonical `WorkoutDocument` ownership and explicit public/private contracts.
- A concise current-state map showing which current constructor/editor/review paths converge and
  which must be removed.
- A serial migration plan with discrete BACKEND, FRONTEND Product, and QA slices; each slice names
  its touched boundary, removal, and focused proof.
- A safe data transition story for existing Calendar workouts and historical source provenance.
- Exact open/close/error/focus behavior for the shared editor, including target selection.
- Rollout, rollback, and release gates that keep the existing runner journey usable throughout.
- Clear distinction between this authoring consolidation and the later adaptive Blueprint engine.

## What Not To Do

- Do not redesign visual language, replace the Design System, or add a second editor, target
  taxonomy, cache/store, persistence table, plan container, provider flow, or migration merely to
  make the plan appear comprehensive.
- Do not conflate the hosted migration/deployment blocker with the source architecture work.
- Do not implement, mutate fixtures, create a plan, or dispatch a successor role in this discovery.

## Stage

Slice 1 canonical review/confirmation implementation is independently QA-accepted. The overall
Task remains in progress and awaits Product admission of the next serial slice.

## Next Recommended Role

PRODUCT

## Architecture Discovery Handoff (Consumed 2026-08-19)

```text
ROLE: ARCHITECT

Task: Hito Unified Workout Authoring Contract And Editor Consolidation
Mode: Tracked, read-only architecture and migration discovery
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md
Evidence item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-manual-template-target-selection-noop.md

Read AGENTS.md, agents/architect.agent.md, skills/hito-architecture-audit/SKILL.md, this
canonical item, the modular-monolith plan, and only the existing manual/template/AI/import
authoring, WorkoutDocument, target, editing, review/confirmation, Calendar provenance, and
evidence-protection seams. Do not inspect unrelated product domains.

Produce the smallest source-backed migration plan to converge manual from-scratch, templates,
AI-proposed detailed workouts, imported initial workouts, and editing of independently owned
Calendar workouts onto one canonical WorkoutDocument, one editor-state model, one validation/review
contract, and one server confirmation path. Origin must be immutable provenance/initial content,
never a separate editable model or authority. Preserve runner-owned Calendar truth, FIT/results,
completion history, evidence protection, and existing source history.

Identify duplicate current contracts and exact deletions, owner-separated serial slices, data and
rollout/rollback implications, target-selection/focus requirements, focused proof per slice, and
the precise release boundary that remains separate from this redesign. Update only this canonical
item and, if necessary, one supporting active plan. No source implementation, data/fixture/hosted
mutation, provider call, Git action, or successor dispatch.
```

## Document-Native Editor Interaction Decision — 2026-08-21

### Verdict And First Incorrect Owner

Product requires the current constructor interaction quality to survive the canonical migration:
pointer and keyboard reorder, nested Repeat editing, Target selection, labels, focus restoration and
accessible announcements remain mandatory. The editable prescription state must nevertheless be
exactly one `WorkoutEditorState.document: WorkoutDocument`; legacy entries, projections and target
truth mode cannot remain as a compatibility representation.

The complete contract is not yet dispatchable to FRONTEND. Direct source inspection proved one
lossless-representation gap in the canonical document and one related server-validation gap:

- top-level `WorkoutDocument.steps` require unique stable `segment_id` values, but
  `WorkoutDocumentRepeatChildPrescription` has only `role`, `label`, positional `sequence`,
  `guidance`, unit `prescription` and `target`;
- `sequence` is normalized from array position and exported as sequence, so it cannot also be a
  stable identity across reorder;
- `WorkoutDocumentSection.children` is derived readback. The strict write parser requires it to
  equal `prescription.children` and does not retain a child `segment_id`, so it cannot become a
  hidden identity store;
- `validateWorkoutDocumentTargetEdit` compares target provenance by array-index paths. Reordering an
  unchanged AI-authored target changes that path and can be mistaken for removal/fabrication;
- `normalizeWorkoutDocumentTargetForWrite` rejects malformed scalar fields but does not enforce the
  required value/mutual-exclusion contract for pace, heart-rate and effort modes. The sealed command
  review currently delegates document validity to that normalizer.

The reverted FRONTEND attempt was therefore correct to stop. Restoring a converter to
`ManualWorkoutDraftInput`, retaining index-addressed entries, or placing UI IDs in a side store would
hide the missing canonical identity rather than solve it.

### Supported Document-Native Contract

The following boundary is source-backed and remains the required implementation contract after the
missing child identity is admitted:

- `WorkoutEditorState.document` is the only editable prescription. Initializer metadata,
  authoritative Calendar fingerprint/provenance, current dialog phase, issues and ephemeral menu,
  drag or focus handles may sit beside it, but they never duplicate document fields or survive the
  editor session.
- `document.steps` is the authoritative top-level order. `segment_id` is immutable for an existing
  section; add and duplicate create a new unique ID; reorder preserves IDs and renumbers positional
  `sequence` to array index + 1. Delete removes exactly the selected ID.
- A Repeat parent is one top-level section whose `prescription.mode` is `repeats`; its
  `repeat_count` and ordered `prescription.children` are authoritative. The materialized `children`
  field remains derived readback and is never independently edited.
- Title writes `document.title`; workout notes/cues write `document.notes`; section label and cue
  write `section.label` and `section.guidance`; quantity selection replaces the section's unit
  prescription with exactly one of `time`, `distance` or `none` and keeps mirrored executable fields
  equal when present.
- Section type/catalog selection supplies a complete canonical section initializer. Changing type
  preserves the existing `segment_id` but replaces incompatible prescription, target, label and cue
  defaults in one reducer transition. It never passes a constructor block key to the server.
- Every mutation recomputes positional sequences and document metric-mode derivation, then runs the
  canonical document issue projection. Review sends the document unchanged to the existing
  `reviewWorkoutCommandAction`; confirm sends only candidate identity, token and checksum to
  `confirmWorkoutCommandAction`.

Ephemeral interaction state is allowed only to operate the document: for example
`{ draggedNodeId, overNodeId, position }`, the open menu ID, and the ID that should receive focus
after commit. It cannot contain a second section/block/target payload.

### Legal Mutations And Rejection

| Interaction                               | Direct `WorkoutDocument` mutation                            | Rejection / invariant                                                                            |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Edit title or workout notes               | replace `title` or `notes`                                   | title is non-empty; notes remain `string \| null`                                                |
| Add section before/after                  | splice one complete section into `steps` with a new ID       | reject unknown/incomplete initializer or duplicate ID                                            |
| Duplicate section                         | deep-copy content with a new section ID                      | source ID and nested IDs must never be copied                                                    |
| Delete section                            | remove by stable ID                                          | non-Rest workout cannot review with zero executable sections                                     |
| Reorder section                           | move the same ID in `steps`; renumber sequence               | no content/provenance rewrite; pointer and keyboard call the same reducer                        |
| Change quantity                           | replace one unit prescription and matching executable fields | positive value required for time/distance; conflicting fields rejected                           |
| Edit Repeat count                         | replace `repeat_count`                                       | retain current visible 2–50 range; no nested Repeat child                                        |
| Add/duplicate/delete/reorder Repeat child | mutate `prescription.children` by stable child ID            | blocked until the canonical child identity decision below                                        |
| Edit label/cue                            | replace the selected node's `label`/`guidance`               | trimmed required label where the UI marks it required; no index-addressed write                  |
| Select or edit Target                     | replace the whole selected node `target`                     | mutually exclusive mode fields, required value and provenance rules below                        |
| Review/confirm                            | submit the exact document to the sealed command family       | server normalization, ownership, collision, evidence/protection and token exactness remain final |

Invalid transient input remains in the single document state only long enough to display a local
field issue; Review is disabled. It cannot produce a candidate. Server review must independently
reject duplicate/missing IDs, empty required fields, invalid or conflicting prescriptions, Repeat
parent targets, nested Repeat children, invalid Target combinations, stale fingerprints, forged
provenance, collision and protected evidence states.

### Target Semantics

The visible Target selector remains exactly `No target`, `Pace`, `Pace range`, `HR cap`, `HR range`
and `RPE`. Selection replaces the complete target object, clearing fields owned by the prior mode:

| Visible option | Canonical value                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| No target      | remove `target`                                                                                                                               |
| Pace           | `primary_execution_mode: "pace"`, runner-entered source and required `pace`; normalized seconds may accompany it                              |
| Pace range     | `primary_execution_mode: "pace"`, runner-entered source and required `pace_min_per_km_range`; parsed min/max seconds may accompany it         |
| HR cap         | `primary_execution_mode: "heart_rate"`, runner-entered target/HR sources and required numeric `hr_bpm_cap`; display `hr_bpm` may accompany it |
| HR range       | `primary_execution_mode: "heart_rate"`, runner-entered target/HR sources and required `hr_bpm_range`; parsed min/max may accompany it         |
| RPE            | `primary_execution_mode: "effort"`, runner-entered source, required RPE in 0–10 and optional `label`/`cue`                                    |

Selecting a mode exposes and focuses its first required input. An empty required value is an invalid
transient state, not a valid target. Choosing the already represented mode/value is a no-op and does
not dirty the document. AI/file targets remain byte-equivalent with their original provenance until
the runner explicitly replaces the complete target; replacement becomes runner-entered and the UI
cannot fabricate generated provenance.

Opening the selector focuses the current option. Escape closes unchanged and returns focus to the
trigger. A committed selection returns focus to the trigger and then the first required value.
Pointer and keyboard selection must produce byte-identical document mutations.

### DnD, Keyboard, Focus And Accessibility

- Pointer DnD and `Move up` / `Move down` use the same ID-based move reducer and the same before/after
  insertion semantics. Array indexes are render positions only, never node identity.
- Rows use stable document IDs as React keys and focus lookup keys. Add/duplicate focuses the new ID;
  move focuses the moved ID; delete focuses the next sibling or previous sibling; a failed mutation
  preserves the current focus.
- The existing live-region announcements remain: added, moved, duplicated and deleted messages name
  the section and final position. Drag handles, rows, menus, inputs and comboboxes retain accessible
  names and do not start a drag from an interactive descendant.
- Opening the authoring dialog focuses its heading/first incomplete field. Review rejection focuses
  and announces the first invalid field. Review success focuses the review heading/Confirm. Server
  failure preserves document bytes and focuses alert/retry. Close or successful confirm restores the
  exact originating Add/Edit control.
- Focus identity for a nested Repeat child cannot be correct across reorder until that child has a
  canonical stable ID; retaining an index key is explicitly rejected.

### Legacy Interaction Reuse And Deletion Map

| Current legacy owner                                                  | Document-native replacement                                         | Deletion gate                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `entries` / `ManualWorkoutConstructorEntryInput`                      | `document.steps` reducers                                           | all create/edit renders and tests read/write sections directly                       |
| `ManualWorkoutBlockInput` and block quantity/label/target fields      | `WorkoutDocumentSection` / repeat child fields                      | section catalog emits canonical nodes; zero entry/block imports                      |
| `targetTruthMode` and `ManualWorkoutTargetFields` camel-case payload  | per-node canonical `WorkoutDocumentTarget` mutation                 | all six modes pass local/server semantic parity; zero payload imports                |
| constructor index DnD/focus refs                                      | stable document-node ID reducer and ID refs                         | pointer/keyboard/focus parity, including Repeat children                             |
| `ReviewedManualDraft.input` and draft resubmission                    | reviewed command candidate carrying canonical document              | create/save callers use command review/confirm only                                  |
| saved-template `draftInput` / `legacyEditorProjection` reconstruction | `initializeWorkoutDocumentAction(saved_template)`                   | saved use/save/reload parity and zero reconstructed draft consumers                  |
| `EditableDocumentState` / `WorkoutDocumentEditProjection`             | initializer document plus immutable Calendar fingerprint/provenance | eligible Calendar edit uses the same editor and `replace_document`                   |
| locked `ManualWorkoutPersistedEditControls` constructor               | shared document-native editor                                       | all eligible origins edit structure/targets; protected origins fail closed           |
| manual create/edit/template public actions and result aliases         | existing initializer plus sealed review/confirm actions             | reverse imports zero after FRONTEND parity; BACKEND deletes in the next serial phase |

The deletion target is zero direct consumers of `ManualWorkoutDraftInput`, constructor entries,
`targetTruthMode`, saved-template legacy projection/draft reconstruction,
`WorkoutDocumentEditProjection`, `EditableDocumentState`, the locked persisted editor and the old
manual create/edit/template action aliases. The visual/interaction anatomy may be reused, but the
component cannot keep accepting legacy payload props.

### Focused Validation Inventory

| Check              | Required proof                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Document reducers  | add/change/duplicate/delete/reorder preserve IDs, normalize sequences and never create a second payload                                |
| Repeat interaction | count and child add/edit/duplicate/delete/reorder, pointer/keyboard parity, stable focus and no nested Repeat                          |
| Target interaction | six visible modes, required-state errors, mutually exclusive field clearing, AI preservation/replacement and byte parity               |
| Accessibility      | dialog entry/exit, menu Escape, ID-based focus restoration, live announcements, keyboard-only complete flow and invalid-field focus    |
| Origin matrix      | scratch, every built-in, saved template, AI/file initializer and eligible Calendar edit open the same editor state                     |
| Command boundary   | materialize, replace and save-template review/confirm exactness; stale/collision/ownership/protection rejection                        |
| Reload             | create/edit/template preserves title, notes, labels, order, repeats, targets, IDs, Calendar row/root provenance and source history     |
| Deletion           | direct import graph reaches zero for every named legacy type/action/component before deletion; no alias or compatibility state remains |

No browser, runtime, source, schema, Supabase, hosted, provider, Git, QA or release validation was run
for this documentation-only decision.

### Exact Product Decision Boundary

FRONTEND is not dispatched. Product must explicitly authorize the canonical identity semantics for
Repeat children: preferably extend the persisted repeat-child vocabulary with the same stable
`segment_id` concept used by top-level sections, unique within its parent, immutable across edit and
reorder, regenerated on duplicate, and preserved by initializer, parser, import/export, review,
persistence and reload. Existing rows without that field need one explicit bounded upgrade rule;
silently deriving index IDs, storing IDs in UI state/`extra`, or trusting materialized `children` is
not allowed.

Once that choice is accepted, BACKEND must first make child identity and identity-based Target
provenance validation canonical and enforce the Target mode/value contract in server review. Only
then is the exact next implementation owner FRONTEND Product for the document-native reducer/editor
migration above. If Product declines a canonical child identity, the accepted nested Repeat reorder
and focus requirement cannot be implemented losslessly.

## Architecture Receipt — 2026-08-19

### Preflight And Root Ownership Decision

- **Mode:** Tracked, read-only architecture and migration discovery. Only this canonical item was
  changed. No supporting plan was needed because the serial program fits in the lifecycle owner.
- **Demonstrated canonical shape:** `workout-document.ts` already defines strict
  `WorkoutDocumentContent`, full `WorkoutDocument`, target, section, prescription, normalization,
  edit projection, and persisted-row parsing. `ImportedWorkoutSeed` is already `WorkoutDocument`.
- **First incorrect owner:** the manual/template path creates a second authoring vocabulary in
  `manual-workout-authoring/schema.ts`, normalizes it to `ManualWorkoutCanonicalDraft`, wraps one
  workout in a temporary `TrainingPlanV2`, and only then reaches Calendar persistence. Copy
  reconstructs persisted documents back into supported template entries. This makes the
  manual/template representation an editing authority instead of an initializer.
- **Existing safe boundary:** persisted edit already normalizes the owned Calendar row to
  `WorkoutDocument`, signs a source fingerprint, rebuilds review server-side, and updates the same
  row. Its evidence/log protection is correct, but the current UI locks structure and targets and
  uses separate edit state and endpoint aliases.
- **New runtime artifacts proposed by discovery:** none beyond final owner modules justified by the
  implementation slices. No table, cache, duplicate store, plan container, or compatibility
  authority is proposed.

### Before And After Authority

```text
BEFORE
manual/template entries + targetTruthMode -> ManualWorkoutCanonicalDraft -> one-workout TrainingPlanV2
saved template draft_payload ------------^                              -> Calendar row
AI/file TrainingPlanV2 -> ImportedWorkoutSeed/WorkoutDocument ---------->
Calendar row -> template reconstruction -> separate manual editor ------> edit review -> same row

AFTER
scratch/template/AI/file/Calendar row
  -> one WorkoutDocument initializer
  -> one WorkoutEditorState
  -> one server WorkoutDocument review candidate
  -> one explicit confirmation command
  -> one canonical runner-owned Calendar workout record

source origin/history -------------------------------> immutable provenance only
results/FIT/completion ------------------------------> protection and factual history only
```

### Target Contract

`WorkoutDocument` is the only semantic workout input vocabulary. It owns title, notes, date,
identity/family/icon, sections, prescriptions, targets, cues, metric mode, and stable segment IDs.
Templates, AI and file imports return valid initial document content. They do not add editable
fields or alternate target semantics.

The one editor model is a Frontend-owned transient wrapper, not a second domain DTO:

```text
WorkoutEditorState {
  mode: "create" | "edit";
  document: WorkoutDocument;
  sourceWorkoutId: string | null;
  initializer: "scratch" | "template" | "ai" | "file_import" | "calendar";
  sourceFingerprint: string | null;
  dirty: boolean;
  phase: "editing" | "reviewing" | "review_ready" | "confirming" | "blocked";
  issues: WorkoutDocumentIssue[];
}
```

`initializer` selects initial content and UI copy only. It never changes validation, target fields,
review, confirmation, persistence, permissions, or editability.

BACKEND owns one operation-discriminated candidate contract:

```text
WorkoutAuthoringReviewRequest {
  operation: "materialize" | "edit_existing";
  items: [{ document, sourceWorkoutId?, sourceFingerprint?, provenanceReference? }];
}

ReviewedWorkoutAuthoringCandidate {
  candidateId; operation; canonicalDocuments; issues; warnings; collisions;
  provenanceReferences; sourceFingerprints; reviewChecksum; reviewToken; expiresAt;
}
```

`items` permits one manual/template/edit workout and a reviewed AI/file initial batch without a
second confirmation API. The server validates every document, ownership, date, collision,
protection, evidence state and provenance; retains or deterministically rebuilds the candidate; and
signs the canonical payload. `confirmReviewedWorkoutAuthoring(candidateId, reviewToken,
reviewChecksum)` rechecks current fingerprints and calls Runner Calendar's atomic materialise or
edit operation. Clients never submit trusted persistence rows. Create and edit share document
validation and exactness; Calendar may retain private operation-specific mutations.

### Source-Of-Truth Cleanup Ledger

| Current owner / carrier                                                                             | Facts carried                                                             | Classification                                | Target and consumer migration proof                                                                                                                               |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planned_workouts` row parsed by `normalizePersistedWorkoutDocument`                                | Complete confirmed prescription, date, source reference and display order | canonical persisted Calendar truth            | Keep as the only live workout record. Prove reload and identical permissions across origins.                                                                      |
| `workout_logs`, result assets/metrics/comparisons and evidence-ID projection                        | Completion, actuals and evidence protection                               | canonical persisted Calendar truth            | Keep factual history with existing owners; confirmation/edit consumes only protection. Never copy actuals into authoring documents.                               |
| `WorkoutDocument` / `WorkoutDocumentContent` / strict normalizers                                   | Sections, prescriptions, targets, cues, identity and date metadata        | transient editor draft                        | Promote as the sole authoring vocabulary while retaining strict persisted parsing. Every initializer and review consumes it directly.                             |
| `WorkoutDocumentEditProjection` and `EditableDocumentState`                                         | Editable content duplicated beside the source document                    | duplicate/compatibility candidate for removal | Replace with `WorkoutEditorState.document`; migrate persisted edit and proof, then delete projection builders/types after import zero.                            |
| `ManualWorkoutDraftInput`, constructor entry/block/repeat/target schemas and `targetTruthMode`      | Parallel title/date/sections/duration/pace/HR/RPE/cues                    | duplicate/compatibility candidate for removal | Migrate constructor, templates and proofs to `WorkoutDocument`; delete schemas, target resolver and normalizer after direct importers are zero.                   |
| `ManualWorkoutCanonicalDraft`                                                                       | `WorkoutDocumentContent` plus date/source/template/totals                 | duplicate/compatibility candidate for removal | Replace review output with canonical document plus separate provenance/review metadata; migrate actions and add, then delete the type.                            |
| `normalizeManualWorkoutDraft`, manual validator and `manualWorkoutDocumentSectionsFromEntries`      | Converts parallel editor state into canonical steps/targets               | duplicate/compatibility candidate for removal | Move required invariants into canonical document validation; prove corpus parity and delete conversion functions without re-export.                               |
| `buildManualWorkoutUserBuiltTrainingPlan` and one-workout `TrainingPlanV2`                          | Repackages one manual workout as a source plan                            | duplicate/compatibility candidate for removal | Manual confirmation calls common Calendar materialisation with reviewed document; prove zero `plan_cycles` creation and delete adapter/exports.                   |
| Built-in `ManualWorkoutTemplate` registry                                                           | Default structure, target and display starter content                     | immutable source/provenance                   | Convert each definition to valid `WorkoutDocumentContent`. Template key/version remains provenance/catalog identity only.                                         |
| `runner_manual_workout_templates.draft_payload` v1 entries/target mode                              | User-saved reusable initial content                                       | immutable source/provenance                   | Version and migrate in place to canonical document content; preserve name/icon/source checksum. Remove v1 reader after census, conversion proof and zero v1 rows. |
| AI compiler/provider draft and `ai_plan_generation_responses.response_body`                         | Generated source content and validation evidence                          | immutable source/provenance                   | Keep private immutable evidence. Compiler supplies canonical documents to common review; raw provider JSON never enters editor/Calendar.                          |
| `TrainingPlanV2.planned_workouts` for file import and historical AI sources                         | Immutable imported/source prescription                                    | immutable source/provenance                   | Keep source/history format. `buildImportedPlanSeed` already returns documents; feed them to common review/confirm.                                                |
| `plan_cycles` saved payload and `SourcePlanProvenanceRow`                                           | Historical source identity/status/metadata                                | immutable source/provenance                   | Preserve. Confirmation copies provenance references only; hiding/deleting source cannot change Calendar workouts.                                                 |
| Calendar mutation audit payload, earliest root provenance and source fingerprints                   | Prior document/provenance and mutation history                            | immutable source/provenance                   | Preserve as audit/history. It detects staleness and displays origin but never selects editor/permissions.                                                         |
| `buildManualWorkoutDraftInputFromPersistedWorkout` and persisted-steps-to-template reconstruction   | Recreates manual entries and requires a recognized template               | duplicate/compatibility candidate for removal | Copy/edit initialize from normalized document; migrate copy/move/delete-clear consumers and proofs, then delete reconstruction/template inference.                |
| `ManualWorkoutPersistedEditControls` cache, `reviewedDraft`, `reviewResult`, reconstruction cache   | Client copies of editor/review state                                      | transient editor draft                        | Consolidate under one editor controller. Cache only a fingerprint-keyed source document and invalidate on close/source change; never persist it.                  |
| Manual draft review, saved-template review and persisted-edit review DTOs                           | Parallel document/checksum/error facts                                    | duplicate/compatibility candidate for removal | Migrate callers to `ReviewedWorkoutAuthoringCandidate`; preserve safe errors in one union, then remove aliases and separate token versions.                       |
| `ManualWorkoutDocumentPreview`, training snapshot `Workout`, Calendar capability/source projections | Display duration/targets/source/edit eligibility                          | derived read projection                       | Keep only where UI consumes display/protection truth. Derive from Calendar document plus evidence and never round-trip into confirm.                              |
| `resolveCalendarWorkoutSourceEditingCapabilities`                                                   | Date/log/evidence eligibility and allowed actions                         | derived read projection                       | Preserve policy under final Calendar owner and make it origin-neutral. It gates opening/confirm, not editor vocabulary.                                           |
| Review token/checksum exactness payload                                                             | Frozen candidate/document/source fingerprint                              | transient editor draft                        | Retain exactness under one version/prefix. Remove manual/edit-specific wrappers after both consumers migrate.                                                     |

No ledger entry is deleted by name or size. Each removal requires its listed consumer migration,
reverse-import zero, focused behavior proof and deletion in the same terminal slice.

### Target Selection And Editor Interaction Contract

- Derive one selector from `WorkoutDocumentTarget.primary_execution_mode` and canonical fields:
  none, exact pace, pace range, HR cap, HR range, or RPE. There is no template-specific
  `targetTruthMode` authority.
- Pointer or keyboard selection commits one state transition, clears mutually exclusive target
  fields, sets runner-entered provenance for new/replaced guidance, updates the trigger immediately,
  and exposes only required value fields.
- Preserved AI/file guidance stays byte-equivalent until explicitly replaced. Replacement becomes
  runner-entered provenance; the editor cannot fabricate generated provenance.
- Opening the target menu focuses its current option. Escape closes unchanged and returns focus to
  the trigger. Choosing returns focus to the trigger, then the first required value input. Pointer
  and keyboard produce the same document.
- Opening uses the current accessible dialog focus seam. Closing or successful confirmation returns
  focus to the exact originating Add/Edit control. Adding a section focuses its type control.
  Review rejection keeps the editor open, focuses the first invalid field and announces the error.
  Review success focuses the review heading/Confirm action. Server failure preserves draft bytes,
  keeps the dialog open and focuses alert/retry.
- A no-op target selection is a failed editor-state transition, never a valid reviewed candidate.

### Data Transition And Rollback

- Existing Calendar rows need no blanket backfill. Normalize each through the strict parser. Valid
  rows use the shared editor; logged, evidence-backed, past/protected, Rest or unsafe rows retain
  their factual blocked state.
- Never rewrite FIT/raw assets, logs, actual metrics, comparisons, audit history or source records.
  Editing updates the same eligible Calendar row atomically and preserves stable ID/root provenance.
- Saved-template v1 payloads require a bounded row census and deterministic conversion. During that
  slice only, server reads both versions and all new writes use v2. The slice remains nonterminal
  until convertible rows are v2, exceptions are explicit/read-only and the v1 branch is deleted.
  This is a migration interval, not permanent compatibility.
- Roll back source slices through their own uncommitted diff or authorized isolated commit. A data
  slice proves transaction rollback and snapshot/restore of exact template rows before conversion.
  Never roll back by recreating a plan container, duplicate editor model or destructive rewrite.

### Serial Owner Slices And Exact Removals

1. **BACKEND — canonical review contract.** Extend canonical document validation and implement one
   review/confirmation orchestration over existing Calendar commands. Migrate manual create and
   persisted edit callers. Remove `ManualWorkoutCanonicalDraft`, review result duplication,
   separate token wrappers and one-workout `TrainingPlanV2` adapter after import zero.
2. **BACKEND — initializer convergence.** Make built-in/saved templates, AI detail and imported
   workouts return canonical initializers. Migrate saved-template payloads. Remove manual
   target/entry normalization and source-specific validation after corpus parity.
3. **BACKEND — copy/reconstruction and protection cleanup.** Initialize copy/edit from normalized
   Calendar documents, preserve root provenance/evidence gates, and migrate move/delete-clear.
   Delete persisted-to-template reconstruction, template inference, manual aliases and old-draft
   safety parsing after their consumers move.
4. **FRONTEND Product — one editor controller.** Replace add/template/saved-template and persisted
   edit state with `WorkoutEditorState`; render one unlocked document editor for every eligible
   origin; implement target/focus contract; consume common review. Delete separate persisted-edit
   controls, duplicate caches and locked edit branch after direct consumers move.
5. **QA — independent domain acceptance.** Prove scratch, built-in/saved template, AI, file import,
   copy and eligible edit through the same vocabulary/review/confirm path; prove protection,
   provenance, target/focus, exact insert/edit and reload.

Slices serialize across shared document/manual/Calendar seams. Slice 1 starts only when no release
freeze or concurrent writer owns its admitted source paths. The completed clean-baseline Task, not
the obsolete modular-transformation dependency, is its predecessor.

### Focused Proof Per Slice

| Slice                  | Required focused proof                                                                                                                      | Explicitly preserved                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Backend review/confirm | Canonical corpus; create/edit exactness; stale fingerprint; ownership; collision; atomic one/batch insert; same-row edit; server rebuild    | Calendar IDs, provenance, logs/evidence, no trusted rows |
| Initializers/templates | Scratch, every built-in template, saved v1/v2, AI and file normalize to identical rules; target provenance and segment IDs                  | Source/raw response/history, no provider call            |
| Copy/protection        | Any safe normalized origin copies without template inference; logged/FIT/evidence/past/Rest/unsafe remain blocked; root provenance survives | Results, comparisons, completion, source history         |
| Frontend editor        | Pointer/keyboard targets, section editing, required fields, errors, review, focus, responsive containment and no duplicate state            | Design System primitives and server authority            |
| Independent QA         | Origin matrix, create/edit/copy, target replacement, protected history, reload and Calendar regression                                      | Global QA and release remain separate                    |

### Release And Hosted Boundary

The current production Target report remains a separate release fact: hosted deployment
`14ccfbf…` is behind verified `HEAD`/`origin/main` `9143336…`. Migration parity, deployment of that
exact existing source and a non-personal authenticated Target -> Review -> Save -> reload replay
must finish under its existing release owner. This redesign does not replace, repair, waive or
claim that gate.

The consolidation reaches implementation DoD only after duplicate consumers and temporary
migration readers are removed and independent domain QA passes. It then requires a fresh candidate
freeze and normal build/integrity/hosted/release admission. Neither the earlier local fixture pass
nor this receipt grants Global QA, commit, push, deployment or production acceptance.

### Source-Contract Outcome And Residual Boundary

No new workout table or duplicate store is needed. One confirmed Calendar row is live truth;
`WorkoutDocument` is the authoring vocabulary; source and mutation/evidence history remain immutable
evidence; editor/review objects are transient; display/protection DTOs are derived only.

The source-contract pass is complete, but the architecture discovery remains active while its
persistence inventory is reconciled below. The first later implementation owner remains BACKEND;
no implementation handoff is admitted until the full persistence boundary is accepted. Exact DDL,
final module names and release scheduling remain later owner decisions. No runtime, data, fixture,
browser, hosted or release acceptance is claimed.

## Admitted Handoff Prompt — 2026-08-20

```text
ROLE: BACKEND

Task: Hito Unified Workout Authoring — Canonical Review And Confirmation Contract
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md
Stage: Slice 1 — canonical review and confirmation contract

Implement only Slice 1 from the accepted architecture receipt. Make WorkoutDocument the one
server-validated authoring vocabulary and expose one operation-discriminated review candidate plus
one explicit confirmation path for materialising new workouts or editing one eligible existing
Calendar workout. Reuse the strict document parser, source fingerprint/review exactness, evidence
protection and atomic Calendar commands. Migrate manual create and persisted edit Backend callers;
remove the one-workout TrainingPlanV2 adapter, ManualWorkoutCanonicalDraft and superseded
review/token aliases only when their direct imports are zero.

Do not change Frontend, migrate saved templates, call providers, alter evidence/history, create a
table, add active-plan compatibility, or stage/commit/push/deploy. Preserve unrelated dirty bytes.
Prove canonical create/edit validation, server rebuild, stale fingerprint, ownership, collision,
protection, atomic materialisation, same-row edit, provenance preservation and reload. Return any
schema, Product or cross-owner requirement to PRODUCT rather than widening.
```

## Supabase Persistence Truth Ledger — 2026-08-19

### Persistence Preflight And Decision

This pass inspected generated database types, foundational and later migrations, RLS/ACL changes,
RPC ownership, and direct source/script consumers without connecting to local or hosted Supabase.
It found no need for a new workout table or persisted editor store. The target is:

```text
immutable source input/provenance
  AI response | plan source | saved template | file source | manual initializer
                          |
                          v explicit review + confirmation
planned_workouts (runner-owned confirmed Calendar prescription truth)
                          |
          +---------------+----------------+
          v                                v
calendar mutation audit          completion / FIT / actual-result facts
(immutable history)              (evidence, never prescription authority)
```

`WorkoutDocument` is the one canonical input vocabulary, not a second database entity. Its
confirmed fields are stored on the existing Calendar row. Editor state, review candidates, tokens,
and reconstructed documents remain transient.

### Table And Persisted-Projection Ledger

| Persistence owner                                                                                               | Sole allowed role                                                               | Current writers / readers                                                                                                                                 | Classification                                    | Merge or removal prerequisite                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planned_workouts`                                                                                              | Confirmed runner-owned Calendar prescription and schedule truth                 | Service-owned Calendar materialisation/mutation/edit RPCs write; Calendar, detail, export, authoring reconstruction, result attachment and QA proofs read | Canonical persisted Calendar truth                | Keep the table and stable row ID. Migrate every writer to one server-built `WorkoutDocument` mapping; remove authoring aliases only after create/edit/copy/import reload parity. Nullable `plan_cycle_id` is provenance only and must never gate lifecycle.                                                                               |
| `plan_cycles`                                                                                                   | Immutable source artifact/library provenance                                    | Source-plan persistence writes; provenance/library/export readers and legacy materialisers read                                                           | Immutable source/provenance                       | Preserve source payload, checksum and origin history. Remove active-container semantics and live-calendar readers after source provenance has a narrow lookup contract; never move current workout edits back into its JSON.                                                                                                              |
| `runner_manual_workout_templates`                                                                               | Reusable immutable initial-content source owned by the runner                   | Saved-template repository writes/reads; fixture lifecycle cleans                                                                                          | Immutable source with duplicate authoring payload | Convert `draft_payload` transactionally to canonical `WorkoutDocument` initial content. Then remove redundant `target_truth_mode`, source family/identity and manual review-version columns only after all consumers read those facts from the versioned payload/provenance record. Keep template identity/name/icon and source checksum. |
| `ai_plan_generation_responses`                                                                                  | Exact retained provider response and compiler/schema outcome                    | Service-role AI response persistence writes; owner validation/audit reads                                                                                 | Immutable source/provenance                       | Keep exact response and outcomes; never make it Calendar truth. Authoring consumes a validated canonical initializer, not this raw body. No merge into Calendar rows.                                                                                                                                                                     |
| `calendar_workout_mutation_events`                                                                              | Append-only mutation/review/Undo evidence                                       | Service-role Calendar RPCs write; lifecycle/edit audit and proofs read                                                                                    | Immutable historical evidence                     | Keep before/after/event JSON snapshots as historical evidence. They do not become a fallback live row. Schema cleanup may occur only after Undo/audit retention and replay compatibility are separately proven; no current deletion is proposed.                                                                                          |
| `workout_logs`                                                                                                  | Runner completion/outcome assertion for one Calendar workout                    | Result-finalisation and workout-log service paths write; Calendar/detail/analytics/evidence readers read                                                  | Canonical factual completion evidence             | Keep separate from prescription. Preserve one-to-one workout FK and server-derived owner. Any authoring edit remains blocked when a log exists.                                                                                                                                                                                           |
| `workout_result_assets`                                                                                         | Raw uploaded result-asset identity and storage pointer                          | FIT/result ingestion writes; protection, readback and analytics read                                                                                      | Immutable source/evidence                         | Keep storage pointer and workout/log/activity-revision relations. Do not copy its facts into `WorkoutDocument`; edit protection uses existence through a public evidence contract.                                                                                                                                                        |
| `runner_activities`, `runner_activity_sources`, `runner_activity_source_revisions`, `runner_activity_revisions` | Canonical activity identity, raw source lineage and normalized factual revision | FIT ingestion RPC/service writes; Results/Progress read models read                                                                                       | Canonical and immutable factual evidence          | Preserve outside authoring ownership. Authoring may consume only a protected/evidence-backed discriminator; it must not parse or mutate activity internals.                                                                                                                                                                               |
| `runner_activity_planned_workout_matches`                                                                       | Attachment between factual activity and Calendar workout                        | FIT source/projection seam writes; history, metrics and protection readers read                                                                           | Evidence relation                                 | Keep nullable workout attachment and owner/RLS parity. It blocks editing when present but never supplies prescription fields.                                                                                                                                                                                                             |
| `runner_activity_evidence_revisions`                                                                            | Revisioned runner assertions/official-result evidence                           | Activity-evidence service and log backfill write; metric snapshots read                                                                                   | Immutable factual evidence history                | Keep revision chain; no merge into logs or Calendar prescription. Authoring consumes only the resulting protection state.                                                                                                                                                                                                                 |
| `workout_actual_metrics`                                                                                        | Normalized actual performance for an attached result                            | Result ingestion/projection writes; comparison/readback/analytics read                                                                                    | Derived factual projection                        | Keep while its result consumers exist. `actual_step_payload`, `lap_payload`, and `summary_payload` are actuals only; never seed an editor or overwrite planned steps.                                                                                                                                                                     |
| `workout_comparisons`                                                                                           | Deterministic planned-versus-actual comparison                                  | Comparison projection writes; result feedback/analytics read                                                                                              | Derived factual projection                        | Keep behind Results/Evidence. It may compare against the confirmed row but cannot mutate it. Removal would require replacement consumer proof and is not part of authoring consolidation.                                                                                                                                                 |
| `workout_ai_insights`                                                                                           | Advisory interpretation of actual metrics/comparison                            | Insight generation writes; result feedback/analytics read                                                                                                 | Derived advisory projection                       | Keep isolated from authoring. Recommendations are evidence-derived output, not a prescription writer or implicit Calendar edit.                                                                                                                                                                                                           |
| `runner_activity_metric_observations` and metric/fact snapshots                                                 | Progress-domain derivations from activity/evidence revisions                    | Progress metric services write/read                                                                                                                       | Derived read projection                           | Preserve out of scope. The authoring boundary receives no writable dependency on these stores.                                                                                                                                                                                                                                            |
| `runner_profiles.hidden_manual_workout_template_keys`                                                           | Runner catalog visibility preference                                            | Template visibility settings write/read                                                                                                                   | Preference only                                   | Keep; it carries no workout document truth and must not be folded into template or Calendar payloads.                                                                                                                                                                                                                                     |

The storage bucket `workout-result-assets` contains private raw result files referenced by
`workout_result_assets`; it is evidence storage, not a workout record. Its objects and policies are
outside authoring cleanup and must remain untouched.

### JSON And Relation Truth

- `planned_workouts.steps`, `metric_mode`, and `goal_context`, together with scalar identity,
  family, type, title, notes, date and schedule fields, are the persisted projection of the one
  confirmed `WorkoutDocument`. A later Backend slice must document a lossless field mapping and
  reject unknown or source-specific live fields rather than adding a second JSON document column.
- `runner_manual_workout_templates.draft_payload` duplicates the manual draft vocabulary today.
  It becomes a versioned canonical initializer payload; it is never a confirmed workout and never
  owns completion/evidence eligibility.
- `plan_cycles.saved_plan_payload`, `goal_metadata`, and `plan_preferences` retain source facts and
  historical review linkage only. Legacy `active_plan_user_edit(s)` mirrors are superseded by
  `calendar_workout_mutation_events`; no new writer or compatibility reader may be introduced.
- `calendar_workout_mutation_events.before_workout`, `after_workout`, `displaced_workout`, and
  `event_payload` are immutable audit snapshots. Current truth is always re-read from
  `planned_workouts`; an event snapshot cannot resurrect a stale prescription except through the
  existing reviewed, atomic Undo contract.
- `workout_actual_metrics.actual_step_payload`, `lap_payload`, `summary_payload`, comparison
  `difference_payload`, and insight JSON are factual or derived result data. Matching field names do
  not make them authoring inputs.
- The composite `(user_id, plan_cycle_id)` relation currently guarantees provenance ownership.
  Its nullable source relation is retained until all source readers use the provenance boundary;
  it must not be replaced with an active container. Calendar ownership remains `user_id` plus the
  stable workout row.

### RLS, ACL, RPC, And Type Boundary

- Owner-select RLS exists on Calendar, source-template, plan-source, logs, result, activity, match,
  comparison and insight tables. Generated types confirm their current columns and relations.
- Direct authenticated writes to `plan_cycles` and `planned_workouts` were revoked; Calendar writes
  are service-owned through `apply_calendar_workout_mutation` and
  `apply_calendar_workout_content_edit`. Both lock the runner, compare expected state, enforce
  ownership/protection, update the row, and append audit evidence atomically.
- Raw AI responses are service-role writable and owner-readable. Activity projection/finalisation
  also uses restricted functions. The unified confirmation contract must keep this server authority
  and must not restore authenticated table writes.
- The existing content-edit RPC already blocks Rest, past, logged, result-backed, actual-backed,
  comparison-backed, insight-backed, and activity-matched rows. The future public authoring command
  should consume one server-owned protection result rather than duplicating these table queries in
  clients.
- Any migration changing columns, relations, enum/check constraints, RPC result shapes, grants or
  policies must regenerate `src/lib/supabase/database.ts` and prove generated-type parity before its
  consumers move. UPDATE policy proof must include the corresponding SELECT visibility; service-only
  functions remain unexposed to `anon` and `authenticated`.

### Safe Persistence Migration And Cleanup Sequence

1. **Freeze the mapping, no DDL.** BACKEND defines the exact `WorkoutDocument` to
   `planned_workouts` field mapping and a server-owned protection/source-provenance contract. Prove
   current manual, AI, import, template, copy and edit corpus round-trips without changing rows.
2. **Unify server writes.** Route materialisation and same-row edit through one validated document
   builder plus the existing atomic Calendar RPC boundary. Preserve stable IDs, immutable
   `origin_kind`, nullable source provenance, audit event, collision and stale-review behavior.
   Delete old DTO/adapter writers when their direct imports reach zero.
3. **Migrate saved-template payloads.** Census v1 rows, snapshot exact rows, introduce only the
   minimum version/check needed for canonical initializer content, convert transactionally, and
   prove rollback. During this bounded interval reads may accept v1/v2 while writes emit only the
   new shape; delete the v1 reader and redundant columns after zero exceptions and consumer parity.
4. **Retire source-container mutation mirrors.** After every Calendar mutation reader uses the
   audit table and every source reader uses provenance lookup, prove no writer/reader depends on
   `active_plan_user_edit(s)` JSON. Remove only those mirrored keys/branches through a separate
   migration; retain immutable plan payloads and source checksums.
5. **Narrow protection consumers.** Replace direct cross-table authoring checks with the existing
   server evidence/protection boundary while preserving the same table-backed result. Results,
   activity, FIT, logs, comparisons and insights remain owned by their domains and unchanged.
6. **Cleanup only after proof.** Remove superseded draft fields, DTOs, aliases, constraints or JSON
   keys only when repository imports, database callers, fixtures, generated types and stored-row
   census all prove their replacement. Never drop a table merely because its name is legacy.

Each database slice is independently reversible: source changes roll back without changing data;
data conversion records pre/post counts and hashes and restores from the task-owned snapshot inside
one transaction; column/key removal occurs only in a later migration after the compatibility reader
is gone. Rollback never recreates active-plan authority or copies evidence into prescription truth.

### Required Persistence Proof

| Check                      | Required evidence before implementation closure                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema and generated types | Migration applies from clean baseline; generated types match tables, columns, relations, RPC arguments/results and contain no stale removed field                         |
| RLS and ACL                | Owner isolation for reads; no cross-user source/workout/template/evidence access; authenticated direct Calendar/source writes remain denied; service RPC grants are exact |
| Canonical round-trip       | Manual, template, AI and file initializers persist/reload the same canonical document; origin/source provenance remains immutable                                         |
| Atomicity and concurrency  | Confirm/edit either writes one exact Calendar state plus audit event or writes nothing; stale review, collision and ownership fail closed                                 |
| Protection                 | Log, FIT asset, actual metrics, comparison, insight, activity match, past and Rest cases remain non-editable; missing evidence is not inferred as safe                    |
| Template conversion        | Complete row census, deterministic v1-to-canonical conversion, count/hash parity, explicit exceptions, rollback, then zero v1 consumers                                   |
| Fixtures                   | Disposable runner fixtures cover every origin and protected state without hosted/personal data; cleanup preserves raw evidence and source history                         |
| Consumer deletion          | Direct-import/RPC/SQL search plus focused tests prove each removed writer, reader, DTO, JSON key or column has a canonical replacement                                    |

### Current State And Remaining Boundary

The source-backed persistence inventory is accepted under the clean-slate successor plan. No
supporting plan was added: the serial slices and cleanup prerequisites fit this canonical item. The
BACKEND prompt above is dispatch-ready because the local clean-baseline predecessor is completed;
the old modular-transformation dependency no longer governs this outcome. A release freeze or a
concurrent writer on the admitted Slice 1 paths still stops execution. No database connection,
migration execution, row inspection, fixture mutation, runtime, browser, build, hosted action or
release validation occurred in this documentation reconciliation.

## Slice 1 Backend Implementation Receipt — 2026-08-20

### Outcome And Boundary

- Added `workout-authoring-review.ts` as the single operation-discriminated review/confirmation
  contract. It accepts canonical `WorkoutDocument` values for `materialize` or `edit_existing`,
  signs canonical documents, provenance references, full source fingerprints, warnings and
  collisions, and fails closed on collision, stale candidate identity/checksum or invalid proof.
- Added the strict camel-case `WorkoutDocument` parser beside the existing persisted-row parser.
  Manual create now produces and persists that document directly; persisted edit rebuilds the same
  document and common candidate from the authoritative owned Calendar row before calling the
  existing atomic content-edit RPC.
- Removed `ManualWorkoutCanonicalDraft`, the one-workout `TrainingPlanV2` adapter, the old edit-token
  module and every zero-import persisted-edit schema/function/type alias. The three existing
  Frontend server-action names and two UI result type names remain only because the unchanged
  `ManualWorkoutPersistedEditControls` imports them directly; they route to the canonical Backend
  implementation and are not a second review/persistence path.
- Saved-template storage and payload semantics were not migrated. Its direct caller only reads the
  same review metadata from its new location. Calendar provenance, row identity, evidence/history,
  schema, migrations, RLS, fixtures, Frontend/Design System source and providers were unchanged.
- Existing unrelated Docker lifecycle/package work and all unrelated dirty paths were preserved.
  The Git index remained empty; no Git lifecycle, hosted action, browser QA or deployment occurred.

### Validation Inventory

| Check                             | Scenario / environment                                                               | Result                       | Evidence                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical review and confirmation | Existing manual-authoring validator, non-persistent pass                             | PASS                         | Canonical materialize/edit candidates, strict document rejection, server rebuild, stale proof and duplicate-date collision assertions passed.                                                                                                                                                                                                                           |
| Calendar persistence              | Repository-managed Docker Desktop local Supabase, explicit trusted-private admission | PASS                         | `node --env-file=.env.local --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence` passed direct manual add, same-row content edit, collision/stale review, ownership isolation, protected/evidence-race atomic rejection, provenance/audit preservation and reload assertions; both task leases were released and owned rows were cleaned. |
| Direct consumer regression        | `npm run validate-manual-workout-authoring`                                          | PASS                         | Full existing focused constructor/template/add/copy/delete/move/persisted-edit/export contract passed after cleanup.                                                                                                                                                                                                                                                    |
| Workout language readback         | `node --import tsx ./scripts/validate-planned-workout-language.ts`                   | PASS                         | Planned-workout language read-model contract passed.                                                                                                                                                                                                                                                                                                                    |
| Removal and import direction      | Targeted `rg` over `src` and `scripts`                                               | PASS                         | No live import/definition remains for the removed manual draft, one-workout plan adapter, old exactness builder, edit-token module or zero-consumer aliases; the retained UI aliases have demonstrated direct Frontend imports. No new import cycle exists.                                                                                                             |
| Focused formatting and hygiene    | Scoped Prettier plus repository `git diff --check`                                   | PASS                         | All task-owned files use Prettier style; diff hygiene passed; index remained empty.                                                                                                                                                                                                                                                                                     |
| Focused type diagnostics          | Project TypeScript output filtered to changed seams                                  | PASS WITH INHERITED OMISSION | The new review/document/manual create/edit modules and focused proofs have no diagnostics. Whole-checkout TypeScript remains non-zero on the pre-existing legacy `nestedRepeatGroup?: unknown` server-serialization boundary in delete/move/saved-template endpoints; this slice changed no such input shape and did not widen into that separate cleanup.              |
| Mandatory runtime closure         | `npm run supabase:local:stop`                                                        | PASS                         | Project-qualified stop reported runtime `stopped`, no published Hito ports, trusted-private policy retained and no service credential output.                                                                                                                                                                                                                           |

### Omitted Acceptance And Handoff

Browser, Frontend interaction, Global QA, hosted Supabase, release and deployment acceptance were not
in scope. BACKEND releases the implementation and stopped local runtime to QA for an independent,
proportional replay of Slice 1. A reproduced same-task defect returns directly to BACKEND for bounded
fix-forward; a new Product/schema/cross-owner requirement returns to PRODUCT.

History: `2026-08-20 — BACKEND completed Slice 1 implementation and focused local persistence proof;
the same Task moved to QA for independent acceptance.`

## Slice 1 Independent QA Receipt — 2026-08-20

### Verdict And Scope

QA independently accepted Slice 1. Product/runtime source remained read-only; this receipt is the
only QA write. The common `WorkoutDocument` review candidate is operation-discriminated for
`materialize` and `edit_existing`, while confirmation rebuilds current server truth before the
existing atomic Calendar materialisation or same-row content-edit RPC. No alternate persistence,
query, plan-container or client-trusted row path was found.

Static review and focused proof established strict create/edit document rejection, stale candidate
identity/checksum/token rejection, duplicate and occupied-date collision rejection, ownership
isolation, log/evidence/protected-state gates, immutable origin/root provenance, append-only mutation
history, stable edited row identity and persisted reload. The persistence replay also reproduced an
evidence race and proved that the atomic RPC rejected it without a partial write.

Targeted reverse-import proof found no live definition/import for `ManualWorkoutCanonicalDraft`,
the one-workout `TrainingPlanV2` adapter, the deleted edit-token module or the removed zero-consumer
function/type/schema aliases. The three retained old server-action names and two retained result
types have the documented direct `ManualWorkoutPersistedEditControls` consumer only and route to the
canonical implementation. The direct import graph from the common review owner is acyclic.

### Validation Inventory

| Check                         | Scenario / environment                                             | Result                       | Evidence                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Common candidate/confirmation | Existing non-persistent manual-authoring proof                     | Pass                         | Materialise/edit operation, strict invalid document, exact confirmation, stale identity/token/checksum and collision assertions passed  |
| Persistence and isolation     | Docker Desktop trusted-private local Supabase                      | Pass                         | Direct materialisation, owner isolation, same-row edit, protected/evidence race rejection, audit/provenance and persisted reload passed |
| Consumer regression           | `npm run validate-manual-workout-authoring`                        | Pass                         | Focused constructor/template/add/copy/delete/move/edit/export contract passed                                                           |
| Workout readback              | `node --import tsx ./scripts/validate-planned-workout-language.ts` | Pass                         | Planned-workout language read-model contract passed                                                                                     |
| Removal and ownership         | Targeted `rg` over direct `src`/`scripts` seams                    | Pass                         | Removed symbols/modules have zero live occurrences; only documented Frontend aliases remain                                             |
| Import direction              | Common review/document/schema/manual graph                         | Pass                         | One review owner and no cycle or compatibility facade found                                                                             |
| Focused types                 | Project TypeScript diagnostics filtered to Slice 1 paths           | Pass with inherited omission | Zero focused diagnostics; whole checkout remains non-zero on unrelated pre-existing boundaries                                          |
| Fixture cleanup               | Existing role-scoped QA pool lifecycle                             | Pass                         | Both leases released, all task-owned rows zero, stable synthetic Auth users preserved by the canonical pool contract                    |
| Mandatory stop                | `npm run supabase:local:stop`                                      | Pass                         | Zero final Hito containers, project network and five-port listeners; no credential output                                               |
| Preservation/hygiene          | Before/after source, Boca, index and diff checks                   | Pass                         | Slice 1 source digest and Boca hashes unchanged; index empty; diff hygiene passed                                                       |

The local window was admitted under the documented Docker Desktop wildcard-development constraint;
it was not called loopback-only. Browser/Frontend interaction, saved-template migration, initializer
convergence, hosted Supabase, providers, Global QA, build, Git lifecycle, release and deployment were
not run and are not implied by this verdict. The overall Task remains `in_progress`; the next owner
is PRODUCT to accept Slice 1 and admit the next serial owner boundary.

History: `2026-08-20 — QA independently accepted Slice 1 canonical review/confirmation and returned
the still-active Task to PRODUCT for the next serial admission.`

## Architecture Re-Baseline — One End-To-End Authoring Contract — 2026-08-20

This decision supersedes the earlier post-Slice-1 numbering and handoff prompt. It does not
invalidate the accepted Slice 1 implementation or QA evidence; it replaces the assumption that a
later Frontend-only consolidation could finish the architecture while legacy server contracts
remained public.

### Why The Old Slice 4 Was Structurally Wrong

The current source has one canonical create/edit review core, but its direct callers still cross
four parallel public shapes:

- `ManualWorkoutAuthoringControls` owns `ManualWorkoutDraftInput`, constructor entries,
  `targetTruthMode`, `ReviewedManualDraft.input`, and submits that legacy draft again for Calendar
  confirmation and Save as template.
- `saved-templates.ts` saves `draftInput`, persists `legacyEditorProjection`, reconstructs
  `draftInput` on use, and returns both canonical `document` and legacy `draftInput` to the client.
- `ManualWorkoutPersistedEditControls` owns a separate `EditableDocumentState`,
  `WorkoutDocumentEditProjection`, source-key cache, review result and three edit-specific server
  actions; structure and targets remain locked rather than using the create editor.
- copy, move, delete and clear expose separate schemas, result unions, token prefixes and public
  review/confirm functions. Copy is a direct mutation with `requiresExplicitConfirm: false` while
  move/delete use their own candidate proofs.

A Frontend-only Slice 4 would therefore have needed compatibility client state and endpoint-specific
payload reconstruction. It could hide divergence behind one dialog, but could not remove the
divergent authority. Save as template is a visible symptom of that design, not an isolated owner.

### Final Authority And Public Contract

```text
manual scratch | built-in template | saved template | AI | file import | Calendar row
                                  |
                                  v
                    canonical WorkoutDocument initializer
                                  |
                                  v
                  one transient WorkoutEditorState.document
                                  |
                                  v
        reviewWorkoutCommand(discriminated command + authoritative references)
                                  |
                                  v
                   ReviewedWorkoutCommandCandidate
                                  |
                                  v
        confirmWorkoutCommand(candidate identity + token + checksum)
                                  |
             +--------------------+--------------------+
             v                                         v
  private atomic Calendar executor          private template-source repository
             |                                         |
             v                                         v
runner-owned Calendar Workout                immutable canonical initializer
```

The sole live prescription entity is the runner-owned Calendar workout persisted from one
`WorkoutDocument`. `origin_kind`, source-plan ID, template ID/version, AI response ID and imported
source identity are immutable provenance only. They never select an editor, validation rule,
mutation permission, public payload or persistence writer.

The one public application family is a sealed command union, not multiple endpoint DTOs:

```text
WorkoutCommand =
  | materialize { documents: WorkoutDocument[]; provenanceReferences }
  | replace_document { workoutId; document: WorkoutDocument; expectedFingerprint }
  | save_template { document: WorkoutDocument; displayName; iconKey; expectedFingerprint? }
  | copy { workoutId; targetDate; expectedFingerprint }
  | move { workoutId; targetDate; targetPolicy; expectedFingerprints }
  | delete { workoutId; expectedFingerprint }
  | clear { workoutDate; expectedFingerprint }
```

`reviewWorkoutCommand` authenticates the runner, rebuilds source rows, normalizes all carried
documents, checks ownership, protection/evidence, collisions, target state and provenance, and signs
the complete operation payload. `confirmWorkoutCommand` re-reads those facts, verifies one candidate
identity/token/checksum and dispatches to private atomic Calendar or template persistence. Private
executors may remain operation-specific because their transactions differ; they are not public API
families or client authority.

Save as template accepts the already reviewed full `WorkoutDocument`. It stores one immutable
canonical `WorkoutDocumentContent` initializer plus catalog name/icon and provenance/version
metadata. It never stores constructor entries, target-truth mode, editor state, Calendar row data or
another prescription schema. Reusing it adds the selected date/scheduling metadata to produce a full
`WorkoutDocument`, then enters the same `materialize` review/confirm path.

### Route And Consumer Map

| Route / operation           | Current direct public owner and reconstruction                                                    | Final command                                     | Removal after migration                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Scratch / built-in template | `ManualWorkoutAuthoringControls` -> `ManualWorkoutDraftInput` -> `reviewManualWorkoutDraftAction` | `materialize` with editor-owned `WorkoutDocument` | manual draft schema, validator/normalizer/target resolver as server payload, legacy confirm union                   |
| Saved template use          | `reviewManualWorkoutSavedTemplate` returns document plus rebuilt `draftInput`                     | canonical source initializer -> `materialize`     | `buildDraftInputFromSavedTemplate`, returned `draftInput`, `legacyEditorProjection`, v1/v2 readers after row census |
| Save as template            | `saveManualWorkoutSavedTemplate` replays `draftInput` and separate review proof                   | `save_template` with reviewed document            | saved-template save DTO, manual exactness rebuild and source-specific result union                                  |
| AI / file                   | `TrainingPlanV2` -> `buildImportedPlanSeed().workouts` -> plan-specific apply functions           | canonical document batch -> `materialize`         | alternate materialisation entry points after source retention and batch parity; immutable raw/source records stay   |
| Calendar edit               | reconstruct endpoint -> `WorkoutDocumentEditProjection` -> edit-specific review/confirm           | `replace_document`                                | projection type/builders, editable projection state/cache, three edit public actions and retained aliases           |
| Copy                        | direct `copyManualWorkoutWithinActivePlan`, no explicit confirm                                   | `copy`                                            | direct-copy schema/result/version/public action; canonical document clone remains private executor input            |
| Move                        | move-specific review/token/confirm and direct-move branch                                         | `move`                                            | move public schemas/result/token/direct endpoint; atomic Move/Rest/Undo executor remains private                    |
| Delete / Clear              | delete-clear-specific review/token/confirm                                                        | `delete` or `clear`                               | public delete-clear schemas/result/token/actions; protected atomic delete/restore executor remains private          |

Calendar read models, result/FIT evidence, completion, mutation audit, Undo and immutable source
records are retained. They provide authoritative protection/fingerprint/provenance inputs; they do
not seed editor state or become command DTOs.

### Serial Migration Programme

The owner phases below form two non-releasable migration batches. Temporary coexistence is permitted
only between adjacent named owner phases because the current consumer must compile until its owner
moves; no adapter, dual-write, compatibility state or release is allowed during that interval.

1. **BACKEND — final command family foundation.** Replace the two-operation review core with the
   sealed `WorkoutCommand` candidate/confirm family and private executor interface. Implement
   `materialize`, `replace_document` and `save_template`; make canonical template writes versioned
   `WorkoutDocumentContent` only. Do not add aliases or a second review store. Existing public
   clients remain frozen until phase 2.
2. **FRONTEND Product — one editor and create/edit/template consumers.** Make
   `WorkoutEditorState.document` the only editable state for scratch, built-in/saved template and
   eligible Calendar edit. Send the final three commands directly. Remove constructor payload state,
   `ReviewedManualDraft.input`, saved-template reconstruction, persisted-edit projection/cache and
   the separate locked editor component in the same phase.
3. **BACKEND — Batch A deletion and template conversion.** After phase 2 has zero direct imports,
   delete legacy create/edit/template public actions, DTOs, result aliases, manual draft
   normalizer/validator branches and projection builders. Convert saved rows transactionally to the
   canonical initializer payload; delete old readers only after exact count/hash parity and zero
   exceptions. Batch A is accepted only after those deletions.
4. **BACKEND — Calendar lifecycle command migration.** Add `copy`, `move`, `delete` and `clear` to
   the same candidate family, reusing current server-owned protection and atomic executors. Every
   operation now requires explicit review/confirm; remove the direct-copy mutation branch only after
   focused parity.
5. **FRONTEND Product — Calendar action consumers.** Route copy/move/delete/clear controls through
   the final command family and common candidate/error state. Remove endpoint-specific client result
   state and imports; do not merge these actions into editable document state.
6. **BACKEND — Batch B deletion and source initializer convergence.** Delete old lifecycle public
   schemas/actions/token prefixes/result unions after zero imports. Route AI and file document batches
   through `materialize`, then delete alternate live materialisation entry points while retaining
   immutable source storage/export. Built-in and saved templates expose canonical content only.
7. **QA — independent domain acceptance.** Verify the origin and operation matrix, deliberate stale/
   collision/protection races, template conversion, exact deletions and reload. Global QA, hosted
   cutover and release remain later acceptance layers.

### Deletion Gates And Direct Proof

| Legacy boundary                                                                        | Required deletion discriminator                                                                          | Direct contract proof                                                                                     |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ManualWorkoutDraftInput`, constructor-entry server schemas, `targetTruthMode` payload | zero non-test server/client imports; editor emits valid `WorkoutDocument` directly                       | scratch and every built-in template round-trip; targets/repeats/cues/date exact after reload              |
| manual review/add unions and action names                                              | all create callers use `materialize`; no request contains `draftInput`                                   | invalid document, stale token/checksum, collision, ownership and atomic insert tests                      |
| saved-template `legacyEditorProjection`, rebuilt `draftInput`, old payload readers     | row census converted with count/hash parity, zero exceptions, rollback snapshot, zero old writes/readers | save/use/edit/reload same canonical content; catalog metadata and immutable provenance preserved          |
| `WorkoutDocumentEditProjection`, builders, persisted-edit cache and action aliases     | unified editor is sole direct consumer; zero imports of projection and old actions                       | every eligible origin edits all document fields; same row/ID/provenance; protected cases fail closed      |
| copy direct mutation and its version/result                                            | copy UI uses reviewed candidate; direct endpoint has zero imports                                        | explicit confirm, stale source, occupied target, protection, provenance root, atomic insert/audit         |
| move/delete/clear public DTOs, token prefixes and results                              | common command callers are sole imports; private executor tests do not import public legacy types        | Rest displacement/Undo, past/log/FIT/evidence blocks, stale target/source, atomic audit/no partial write  |
| AI/file live materialisation functions                                                 | all current AI/import confirmations call common `materialize`; source-library consumers remain proved    | multi-document checksum, duplicate/occupied dates, immutable raw/source record, exact batch insert/reload |

Targeted `rg`/import-graph proof, focused TypeScript, operation-specific unit/contract tests and local
persistence tests are mandatory at each deletion. A schema or stored JSON deletion additionally
requires clean-baseline migration replay, generated-type parity, RLS/grant proof and transactional
rollback evidence. Nothing is removed by name or age.

### Product And Schema Decision

No Product decision remains. The accepted clean-slate Workout/Evidence model already decides entity
ownership, origin neutrality, explicit review/confirm and evidence protection. Current
`planned_workouts` fields already round-trip `WorkoutDocument`; saved-template `draft_payload` can
hold the canonical initializer without a new table or column. A later owner must return to PRODUCT
only if direct implementation proves a canonical document fact cannot be represented losslessly or
requires changing evidence/protection behavior. That discriminator is not currently demonstrated.

No runtime, schema, Supabase, fixture, browser, hosted, provider, Git, QA or release action was
performed by this architecture re-baseline.

### Direct BACKEND Handoff — Dispatched 2026-08-20

```text
ROLE: BACKEND

Task: HITO-224 — Unify Workout Creation and Editing
Notion task: https://app.notion.com/p/Unify-Workout-Creation-and-Editing-3c2fe5f58cf58107b753d65b23fcdfbe
Repository document: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md
Mode: Tracked
Stage: Batch A, phase 1 — final Workout command family foundation

Read the selected Notion Task, AGENTS.md, agents/backend.agent.md, the routing contract, the
re-baselined HITO-224 receipt and only the direct WorkoutDocument, workout-authoring review,
manual create/edit/saved-template, Calendar persistence/protection and focused proof seams.

Implement only phase 1 of the accepted re-baseline. Replace the two-operation review core with one
sealed WorkoutCommand review/confirm family for materialize, replace_document and save_template,
backed by private operation executors. WorkoutDocument is the sole prescription input; save_template
persists canonical WorkoutDocumentContent plus catalog/provenance metadata only. Do not add an
adapter, compatibility DTO/client state, second review store/table, schema migration, plan authority,
provider call or later Calendar lifecycle operations.

Keep existing direct clients frozen for the immediately following FRONTEND phase; do not rewrite
Frontend. Record every temporarily retained public endpoint and its exact phase-2 consumer, and fail
the batch if the final contract would require trusted client rows, origin-specific validation or a
second persistence authority. Prove command normalization, complete signed payload exactness,
ownership, stale/collision/protection failures, atomic materialize/edit/template behavior, canonical
template round-trip, import direction and no new cycle. Preserve unrelated dirty bytes and all
evidence/provenance. Do not stage, commit, push, deploy or touch hosted state. On success, update the
same Notion Task atomically and hand it directly to FRONTEND Product for phase 2; the candidate is not
release-admissible until phase 3 deletes every legacy create/edit/template path.
```
