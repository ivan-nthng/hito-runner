# Hito Unified Workout Authoring Contract And Editor Consolidation

Work Item ID: `2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation`
Notion Task: [HITO-224](https://app.notion.com/p/Unify-Workout-Creation-and-Editing-3c2fe5f58cf58107b753d65b23fcdfbe)
Type: Feature
Evidence From: [Hito Manual Template Target Selection No-op](./2026-08-19-hito-manual-template-target-selection-noop.md)

Notion is the operational lifecycle source. This file is the compact final technical contract,
accepted evidence and residual boundary for unified Workout authoring.

## Final Outcome

HITO-224 is Product-accepted after independent domain and focused browser QA. Manual scratch,
built-in templates, saved templates, AI-authored detail, file-imported detail and eligible Calendar
editing now use one canonical `WorkoutDocument` vocabulary, one document-native editor and one
server-owned review/confirm family.

The confirmed runner-owned Calendar workout is the sole live prescription. Origin and source records
are immutable provenance or initial content only. FIT, results, comparisons, completion and evidence
remain factual history and edit-protection inputs; they never become prescription authority.

## Final Authority

`WorkoutDocument` owns title, notes, date, identity/family/icon, ordered sections, prescriptions,
targets, cues, metric mode and stable section identities. The authority flow is:

1. scratch, built-in, saved-template and Calendar initializers, or an AI/file canonical document
   batch;
2. one transient `WorkoutEditorState.document`;
3. `reviewWorkoutCommand`, which authenticates, rebuilds source truth, normalizes documents, checks
   ownership, collisions, protection, targets and provenance, then signs the complete operation;
4. `confirmWorkoutCommand`, which verifies candidate identity, token and checksum and rechecks
   authoritative facts;
5. one private atomic Calendar executor or the private saved-template repository.

The sealed public command family is:

- `materialize { documents, provenanceReferences }`;
- `replace_document { workoutId, document, expectedFingerprint }`;
- `save_template { document, displayName, iconKey, expectedFingerprint? }`;
- `copy { workoutId, targetDate, expectedFingerprint }`;
- `move { workoutId, targetDate, targetPolicy, expectedFingerprints }`;
- `delete { workoutId, expectedFingerprint }`;
- `clear { workoutDate, expectedFingerprint }`.

Private operation-specific executors remain valid because their transactions differ. They are not
public API families, editor state or alternate authority.

## Initializer And Consumer Contract

| Entry route            | Canonical input                                                            | Preserved source fact                                  |
| ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Scratch                | server-built valid `WorkoutDocument`                                       | manual origin                                          |
| Built-in               | registered canonical document content plus selected date                   | template key/version                                   |
| Saved template         | owner-scoped canonical content rebased server-side to the selected date    | template identity, checksum and version                |
| AI / file              | validated canonical document batch                                         | raw source/response identity and immutable provenance  |
| Eligible Calendar edit | complete server-rebuilt document, expected fingerprint and root provenance | stable Calendar workout ID and original source history |

Frontend must never reconstruct a canonical document from route display data or retain
`ManualWorkoutDraftInput`, constructor entries, `targetTruthMode`,
`WorkoutDocumentEditProjection` or a source-specific editor payload beside the document.

## Document-Native Interaction Contract

- `WorkoutEditorState.document` is the only editable prescription state. Dialog phase, issues,
  dragged/focused node IDs and open-menu state may be ephemeral companions but cannot duplicate
  section, target or date facts.
- Top-level sections and Repeat children have stable IDs. Add/duplicate generates a new ID; reorder
  preserves it and recomputes positional sequence; delete addresses the ID rather than an array
  index. Nested Repeat is invalid.
- Pointer drag and keyboard Move use the same reducer. Rows use stable IDs for render and focus.
  Add/duplicate focuses the new node; move focuses the moved node; delete focuses the next or
  previous sibling; a failed mutation preserves focus.
- Target choices remain No target, Pace, Pace range, HR cap, HR range and RPE. Selection replaces the
  complete target, clears mutually exclusive fields and exposes the first required value. Invalid
  required values block Review. AI/file target provenance stays unchanged until explicit runner
  replacement, which becomes runner-entered.
- Dialog open, Escape, Review error, Review success, server failure and successful confirmation keep
  the accepted focus restoration and live-announcement behavior. Pointer and keyboard operations
  must produce byte-equivalent documents.
- Review submits the exact document. Confirm submits candidate identity, token and checksum only.
  Server normalization, ownership, stale/collision and protection checks remain final.

## Persistence And Evidence Boundary

| Owner                                                                               | Sole technical role                                                                                          |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `planned_workouts` physical rows                                                    | confirmed runner-owned Calendar prescription and schedule truth; nullable source relation is provenance only |
| `runner_manual_workout_templates`                                                   | immutable reusable canonical initializer plus catalog/provenance metadata                                    |
| `plan_cycles`, AI responses and imported source records                             | immutable source/library history; never current Calendar authority                                           |
| `calendar_workout_mutation_events`                                                  | append-only before/after, displacement and Undo evidence; never fallback live state                          |
| logs, result assets, activities, evidence revisions, actual metrics and comparisons | factual completion/evidence and edit protection; never editor input                                          |
| editor documents, review candidates, fingerprints and tokens                        | transient state only                                                                                         |

No new workout table or persisted editor store was required. Existing Calendar writes remain
server-owned and atomic. The final contract preserves stable row identity, immutable origin/root
provenance, collision and stale-review rejection, exact stored-Rest displacement/Undo and fail-closed
protection for Rest, past, logged, FIT/result/evidence-backed or foreign rows.

Saved templates store versioned canonical `WorkoutDocumentContent` plus name/icon and immutable
source metadata. The final row census contained zero legacy saved-template rows, so conversion
count/hash parity was the empty set and no data rewrite was required.

## Superseded Authority Removed

Final reverse-reachability and QA proof found no live production authority for:

- `ManualWorkoutCanonicalDraft`, the one-workout `TrainingPlanV2` adapter and old edit-token
  owner;
- manual draft/constructor entry, block, Repeat and target DTOs;
- `targetTruthMode`, rebuilt `draftInput`, `legacyEditorProjection` and old saved-template
  payload readers;
- `WorkoutDocumentEditProjection`, persisted-edit reconstruction/cache and edit-specific public
  aliases;
- direct Copy or endpoint-specific Move/Delete/Clear public schemas, token prefixes and result
  unions;
- alternate live AI/file materialisation entry points.

All current operations use the sealed command family. `applySavedPlanRecordForUser` remains the one
separately admitted source-library consumer; source storage/export remains immutable and does not
control Calendar workouts. Physical legacy database or RPC names are implementation facts, not new
product vocabulary or authority.

## Accepted Evidence

| Check                            | Result | Decisive evidence                                                                                                                                                                |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical ownership and deletion | Passed | one review/confirm owner; zero named legacy production consumers or type/runtime import cycles                                                                                   |
| Origin and command matrix        | Passed | scratch, 18 built-ins, saved template, AI/file batches and Calendar edit; materialize, replace, save, Copy, Move, Delete and Clear                                               |
| Persistence and isolation        | Passed | atomic insert/edit/batch behavior, ownership, stale/collision rejection, source exactness, reload, cleanup and lease release                                                     |
| Protection and recovery          | Passed | log/FIT/evidence/past/Rest rejection; stored-Rest and occupied displacement; exact durable Undo/audit restoration                                                                |
| Independent domain QA            | Passed | focused source and disposable local persistence acceptance; zero new focused diagnostics/cycles                                                                                  |
| Focused browser QA               | Passed | authenticated disposable runner, all six Target modes, saved-template reopen, eligible edit, Copy/Move/Undo/Clear/Delete, desktop/mobile containment, focus, console and cleanup |
| Runtime closure                  | Passed | repository-managed Hito runtime and project-qualified local Supabase stopped; task-owned rows returned to zero                                                                   |

Browser evidence is retained at
[HITO-224 focused browser screenshots](../../../qa-artifacts/screenshots/2026-08-21/hito-224-workout-authoring-phase-8/).

At final domain QA, whole-checkout TypeScript still had three unchanged imported-plan baseline
diagnostics; no changed HITO-224 line added a diagnostic. The required browser matrix passed with the
canonical baseline-no-plan pool. An optional imported file-origin browser seed remained blocked on
its separate `plan_cycle_id` fixture assertion (actual null versus generated source-plan ID), so
HITO-224 adds no imported-origin browser verdict beyond its accepted static and persistence proof.

## Residual Boundary

HITO-224 establishes the accepted Workout authoring, Calendar command, persistence and focused
browser contract. It does not claim hosted Supabase parity, provider behavior, Global QA, release,
deployment, staging, commit or push. Those layers require their own current candidate and release
evidence; an earlier deployment comparison is historical and is not current release authority.

The next modular-monolith slice is Phase 3 Result/Evidence public-contract isolation. It must consume
this Workout contract through stable Calendar and protection/evidence boundaries, not reopen
authoring or reconstruct prescription state from result data.
