Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Supabase Training Data Structure Plan

## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-06

## Context

The current app already persists runner setup, plan headers, planned workouts, and workout logs in Supabase. It also now accepts a JSON-first onboarding input and maps that input into canonical saved workouts through `src/lib/imported-plan.ts` and `src/lib/training-api.ts`.

Today, the stored contract is still narrow:

- `runner_profiles`
- `plan_cycles`
- `planned_workouts`
- `workout_logs`

The current import path normalizes the incoming JSON directly into `plan_cycles` and `planned_workouts`, but it does not yet keep a canonical raw import artifact, explicit import status, or structured provenance for the normalized plan rows.

This plan defines the narrow next architecture step:

- keep the current canonical plan and workout storage path
- add one import-aware storage layer around it
- preserve one clear boundary between raw JSON input and trusted normalized plan data
- stay forward-compatible with later workout-result comparison and AI analysis without designing those subsystems now

## Scope

In scope:

- training-plan storage only
- JSON import as the source input
- canonical Supabase persistence for imported plan data
- minimal provenance and import-status tracking
- enough structure so later results comparison can attach to a stable plan/workout model

Out of scope:

- OCR ingestion design
- AI verdict or adaptation design
- multi-sport schema design
- export pipelines
- external provider ingestion
- full workout-results subsystem redesign

## Current JSON Input Shape

Current visible JSON source shape:

- `plan_name`
- `generated_for`
- `start_date`
- `week_1_preview[]`

Current child shape inside `week_1_preview[]`:

- `date`
- `weekday`
- `workout`
- `details`
- `target`

Observed example semantics:

- `plan_name`
  display-oriented plan label, not yet a canonical goal taxonomy
- `generated_for`
  source-facing label, not a trusted auth identity
- `start_date`
  plan anchor date from the imported artifact
- `week_1_preview[]`
  currently one visible week only, but likely a partial view of a larger future plan shape
- `workout`
  human-readable label that currently drives workout-type inference
- `details`
  human-readable prescription detail that currently drives title and step construction
- `target`
  optional human-readable target string that currently becomes a lightweight normalized target payload

Architectural reading of this shape:

- it is a source artifact shape
- it is not yet the canonical storage schema
- it should remain importable even if future JSON grows beyond one week

## Canonical Supabase Data Model

Recommended canonical path:

- keep `runner_profiles` as the athlete or user profile reference
- keep `plan_cycles` as the canonical training-plan header table
- keep `planned_workouts` as the canonical normalized workout table
- add one import-batch table for raw JSON storage, normalization status, and provenance

Recommended entities:

### 1. `runner_profiles`

Role:

- reference record for one authenticated athlete or user

Why keep it:

- already exists
- already owns setup state and runner baseline
- should remain the owner-side anchor for imported plans

### 2. `plan_cycles`

Role:

- canonical saved training plan header

Recommendation:

- keep this table rather than introducing a second `training_plans` table
- extend it only where provenance is required

Recommended header meaning:

- one plan cycle is the normalized saved plan the product reads as truth
- exactly one active plan per user remains the canonical product path for now

Recommended additions:

- `origin_import_batch_id uuid null`
  foreign key to the raw import batch that created the current normalized plan
- `source_kind text not null default 'json_import'`
  keeps origin explicit without introducing a separate source system now
- `source_schema_version text not null default 'json-import-v1'`
  tracks which source contract created the plan

### 3. `plan_import_batches`

Role:

- raw imported JSON artifact
- normalization and import status owner
- minimal provenance and audit anchor

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `plan_cycle_id uuid null`
  nullable until a normalized plan is successfully applied
- `source_kind text not null`
  initial value: `json_import`
- `source_schema_version text not null`
  initial value: `json-import-v1`
- `normalizer_version text not null`
  tracks which app-side mapping logic normalized the raw artifact
- `status text not null`
  recommended values:
  `received`
  `validated`
  `normalized`
  `applied`
  `failed`
- `raw_payload jsonb not null`
- `input_checksum text not null`
  for dedupe inspection and provenance, not strict rejection
- `plan_name text null`
  copied for quick operational visibility
- `generated_for_label text null`
  copied from source for operator visibility, not identity truth
- `start_date date null`
  copied from source for filtering and debugging
- `error_summary text null`
- `error_details jsonb null`
- `received_at timestamptz not null default now()`
- `normalized_at timestamptz null`
- `applied_at timestamptz null`
- `created_at timestamptz not null default now()`

Why one batch table is enough now:

- it covers raw storage
- it covers import status
- it covers minimal versioning and provenance
- it avoids a second speculative “plan version” subsystem

### 4. `planned_workouts`

Role:

- canonical normalized plan entries that the product reads on home, calendar, workout detail, and later progress

Recommendation:

- keep this table as the trusted normalized workout surface
- keep `steps jsonb` for workout structure payload

Recommended additions:

- `import_batch_id uuid null`
  foreign key to `plan_import_batches`
- `source_row_index integer null`
  preserves ordering and traceability back to the imported source array
- `source_date date null`
  optional provenance field when normalization later needs to adjust displayed dates

Why keep `steps jsonb`:

- workout structure varies more than the current visible JSON shape
- it already fits the current UI and training seam
- it keeps the normalized workout model stable without forcing premature sub-step tables

### 5. `workout_logs`

Role in this plan:

- not redesigned here
- remains the future consumer of canonical `planned_workouts`

Boundary decision:

- this plan only ensures imported plan rows are stable enough for later log comparison

## Normalization Rules

### What must be stored raw

Store the imported artifact exactly once in `plan_import_batches.raw_payload` as JSONB.

Raw means:

- original root keys
- original child keys
- original string values
- any future extra keys not yet normalized

Reason:

- preserves source truth for debugging
- allows future re-normalization without asking the user to re-upload
- prevents coupling product truth directly to the current visible JSON subset

### What should be normalized into canonical columns

Normalize these header-level values:

- `plan_name` -> `plan_cycles.title`
- source-derived summary -> `plan_cycles.goal_summary`
- `start_date` -> `plan_cycles.start_date`
- last normalized workout date -> `plan_cycles.end_date`
- source contract marker -> `plan_cycles.source_schema_version`

Normalize these workout-level values:

- `date` -> `planned_workouts.workout_date`
- `weekday` -> `planned_workouts.weekday`
- inferred week number -> `planned_workouts.week_number`
- phase label -> `planned_workouts.phase`
- inferred workout type -> `planned_workouts.workout_type`
- normalized display title -> `planned_workouts.title`
- normalized source notes -> `planned_workouts.notes`
- normalized structure payload -> `planned_workouts.steps`
- import ordering -> `planned_workouts.display_order`

Normalize these provenance values:

- source batch id -> `plan_cycles.origin_import_batch_id`
- source batch id -> `planned_workouts.import_batch_id`
- source row order -> `planned_workouts.source_row_index`

### How to avoid coupling product truth to one raw JSON shape

- product routes must continue reading `plan_cycles` and `planned_workouts`, not `raw_payload`
- source parsing logic belongs in the normalizer, not in route loaders
- future JSON changes must be handled by new normalizer logic and `source_schema_version`, not by making product components read source-specific keys

### How future schema evolution should work

If JSON later grows beyond `week_1_preview`, the canonical rule remains:

- store the whole new artifact raw in `raw_payload`
- bump `source_schema_version`
- update the normalizer to extract the canonical subset into `plan_cycles` and `planned_workouts`
- do not back-propagate raw-shape expansion into product tables unless the product truly needs new normalized fields

Recommended evolution posture:

- prefer widening the raw artifact and normalizer first
- widen canonical columns only when the product needs stable querying or stable UI behavior

## Trusted Output Boundary

### Raw imported data

Raw imported data is:

- the uploaded JSON artifact stored in `plan_import_batches.raw_payload`
- source-facing only
- useful for replay, audit, and debugging
- not trusted product output by itself

### Normalized canonical plan data

Normalized canonical plan data is:

- `plan_cycles`
- `planned_workouts`

This is the stable application-facing representation created from the raw import.

### Trusted product output

Trusted product output begins only when:

- the import batch reached `applied`
- the normalized plan rows were written successfully
- the product reads the normalized rows, not the raw artifact

So:

- raw JSON is not trusted product output
- normalized plan data is trusted once applied successfully
- future workout logs and comparison logic must attach only to canonical normalized workouts

## Supabase Design Guidance

### Primary keys and foreign keys

Recommended key structure:

- `runner_profiles.user_id -> auth.users.id`
- `plan_cycles.user_id -> auth.users.id`
- `plan_cycles.origin_import_batch_id -> plan_import_batches.id`
- `plan_import_batches.user_id -> auth.users.id`
- `plan_import_batches.plan_cycle_id -> plan_cycles.id`
- `planned_workouts.plan_cycle_id -> plan_cycles.id`
- `planned_workouts.user_id -> auth.users.id`
- `planned_workouts.import_batch_id -> plan_import_batches.id`

### Uniqueness expectations

Keep:

- one active `plan_cycle` per user
- one `planned_workout` per `plan_cycle_id + workout_date`

Add:

- index on `plan_import_batches (user_id, created_at desc)`
- index on `plan_import_batches (status)`
- index on `planned_workouts (import_batch_id, source_row_index)`

Do not add strict uniqueness yet on `input_checksum` because:

- the same user may intentionally re-import a similar artifact
- checksum is more useful for operator visibility than hard rejection at this stage

### Versioning and import strategy

Recommended now:

- use `plan_import_batches` as the only versioning primitive
- do not add a separate `plan_versions` table yet

Reason:

- each import batch already captures source artifact + normalizer version + status
- each `plan_cycle` can point to the batch that created it
- later plan replacement can archive the old `plan_cycle` and create a new one from a new batch

This keeps one canonical path:

- raw batch
- normalize
- apply into canonical plan

### JSONB usage

Use JSONB in exactly two places:

- `plan_import_batches.raw_payload`
- `planned_workouts.steps`

Why JSONB is justified here:

- `raw_payload` is inherently variable source data
- `steps` is structured but flexible workout composition data that would be over-modeled by step tables right now

Do not spread JSONB further into plan header truth unless there is a demonstrated query need.

### What should remain deterministic vs flexible

Deterministic:

- one active plan per user
- one canonical normalized plan header table
- one canonical normalized planned workout table
- one import batch per import attempt
- product reads normalized data, never raw data directly

Flexible:

- raw imported JSON shape
- normalizer version
- workout `steps` payload
- optional future source metadata inside `error_details` or raw payload

## Anti-Overengineering

Do not build yet:

- multi-sport abstractions
- sport-agnostic polymorphic workout entity trees
- generalized ingestion orchestration tables
- OCR artifact pipelines
- AI recommendation or verdict tables
- provider-specific import systems
- per-step relational workout sub-tables
- a separate plan-version subsystem beyond import batches

Keep the system smaller by doing this instead:

- reuse `plan_cycles`
- reuse `planned_workouts`
- add one import-aware raw artifact table
- add only the provenance fields needed to keep source and normalized truth separate

## Phased Outline

### Phase 0: Finalize schema contract

- Goal:
  lock the canonical storage model and provenance rules before any further Supabase migration
- Main dependency:
  agreement that `plan_cycles` and `planned_workouts` remain the canonical normalized path
- Main risk:
  drifting into a second competing plan model
- Next likely role:
  BACKEND

### Phase 1: Create tables and migrations

- Goal:
  add `plan_import_batches` and the minimal provenance fields on canonical plan tables
- Main dependency:
  approved schema contract from Phase 0
- Main risk:
  adding more columns or tables than the product actually needs
- Next likely role:
  BACKEND

### Phase 2: Implement JSON normalization and import path

- Goal:
  persist raw imported JSON, mark import status, normalize into canonical rows, and keep failure reporting explicit
- Main dependency:
  migration availability and a locked status model
- Main risk:
  silently coupling import success to UI-only assumptions from the current one-week template
- Next likely role:
  BACKEND

### Phase 3: Connect current onboarding flow to canonical storage

- Goal:
  switch onboarding so it writes both the raw import batch and the canonical normalized plan path
- Main dependency:
  implemented import service and updated server seam
- Main risk:
  partial writes where raw import succeeds but canonical plan application is left ambiguous
- Next likely role:
  BACKEND

## Risks

- The current visible JSON is only a week preview, so overfitting canonical columns to `week_1_preview` would create avoidable migration churn later.
- The current schema already treats `plan_cycles` as truth; introducing a parallel plan header model would create unnecessary ambiguity.
- If raw artifact storage is skipped again, future debugging and re-normalization will depend on brittle reconstruction from normalized rows.
- If too much detail is normalized now, the app will inherit source-shape assumptions that belong in the import layer, not in product truth.

## Exit Criteria

- One canonical storage plan exists for imported training data in Supabase.
- The plan clearly separates raw imported JSON from normalized canonical plan data.
- The plan reuses the current `plan_cycles` and `planned_workouts` path instead of introducing a competing model.
- The plan defines a minimal import-batch layer with status and provenance.
- The plan gives a short implementation sequence with one clear next role.

## Next Recommended Role

BACKEND

## Suggested Next Step

Turn this feature-plan into one concrete Supabase migration plan that adds `plan_import_batches` plus the minimum provenance fields on `plan_cycles` and `planned_workouts`, without broadening into OCR, AI, or multi-source ingestion design.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created a focused feature-plan for storing imported training-plan data in Supabase, centered on keeping `plan_cycles` and `planned_workouts` as canonical normalized truth while adding one `plan_import_batches` layer for raw JSON, status, and provenance.

### Key Decisions

- Reuse the existing canonical plan tables instead of introducing a second training-plan model.
- Add one raw import-batch table as the only new versioning/provenance primitive, rather than designing a larger ingestion or plan-version subsystem.

### Current State

- The repo currently validates a narrow JSON onboarding shape and normalizes it directly into `plan_cycles` and `planned_workouts`.
- This new plan now defines how to preserve the raw source artifact and normalization status without changing the trusted-output boundary.

### Constraints

- Do not broaden this work into OCR, AI verdicts, multi-sport abstraction, or generalized ingestion pipelines.
- Keep one canonical normalized path for product truth and one raw JSON storage path for provenance.

### Risks / Open Questions

- The current JSON shape is only a one-week preview and should not be mistaken for the final canonical plan schema.
- Future JSON expansion will require disciplined use of `source_schema_version` and normalizer updates instead of widening product truth tables casually.

### Next Recommended Role

BACKEND

### Suggested Next Step

Draft the concrete Supabase migration plan for `plan_import_batches` and the minimal provenance-field additions to `plan_cycles` and `planned_workouts`.
```
