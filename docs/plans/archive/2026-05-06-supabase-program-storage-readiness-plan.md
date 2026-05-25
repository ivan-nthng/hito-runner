Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Supabase Program Storage Readiness Plan

## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-06

## Context

The current app already implements the core saved-mode surfaces needed for real training-program storage:

- login-first entry
- authenticated onboarding
- JSON-first import
- persisted plan and workout loading
- persisted workout logging
- backend-derived week status

The current business goal is narrower than the future OCR or AI roadmap:

- start using the service with real training-program storage in Supabase now
- give each authenticated user their own training program
- store imported JSON plans canonically
- load the correct plan for the authenticated user
- prepare the storage model so future editing is possible without forcing a redesign

This plan provides two outputs in one artifact:

- a readiness review of the current codebase
- one implementation-ready architecture plan for immediate Supabase-backed training-program storage

## Readiness Review

### Overall readiness verdict

The current codebase is structurally close to ready for per-user Supabase-backed training programs, but it is not fully production-ready yet for canonical multi-user program storage.

The main reason:

- the normalized per-user plan path already exists
- the per-user read path already exists
- the ownership model is mostly correct
- but plan-import provenance, replace semantics, and future edit-preparation are still too thin

### What is ready

The following is already structurally ready:

- One authenticated request context per user
  `src/start.ts` resolves auth per request and passes a stable auth context into the server seam.
- Per-user route loading
  `src/lib/training-api.ts` already loads saved data by authenticated `userId`.
- Canonical per-user plan header
  `plan_cycles` already exists and is keyed by `user_id`.
- Canonical per-user planned workouts
  `planned_workouts` already exists with `user_id`, `plan_cycle_id`, and `workout_date`.
- Canonical per-user workout logging
  `workout_logs` already exists and is linked to `planned_workouts`.
- One active plan per user
  `plan_cycles_one_active_per_user_idx` already enforces one active plan per user.
- Multi-user RLS baseline
  `runner_profiles`, `plan_cycles`, `planned_workouts`, and `workout_logs` already have per-user RLS policies.
- JSON-first normalization seam
  `src/lib/imported-plan.ts` already converts the visible JSON shape into normalized saved workout rows.
- Authenticated plan loading into the UI
  `getPersistedSnapshot()` already reads the authenticated user’s plan and workouts into the canonical frontend seam.

### What is missing

The following is missing for immediate canonical program storage:

- No raw imported JSON artifact table
  the system currently loses the original imported source shape after normalization.
- No explicit import batch or import status layer
  there is no persisted import provenance, validation state, or failure state.
- No safe replace path for an existing active plan
  onboarding only creates a plan when no active plan exists.
- No canonical plan source metadata beyond `source_template`
  current provenance is too coarse for future edits or multiple import rounds.
- No editable storage semantics on `planned_workouts`
  the current schema can store workouts, but it does not yet encode whether a row is still the imported baseline or has been manually adjusted later.
- No audit fields on `planned_workouts` beyond `created_at`
  future editing needs at least minimal update tracking.

### What is risky

The highest current risks are:

- Temporary local bypass path
  `LOCAL_AUTH_BYPASS_ENABLED` is useful for local unblock work, but it is risky if it bleeds into canonical production assumptions.
- Existing-plan import behavior
  current onboarding skips creating a new plan if an active plan already exists, so re-import and replacement behavior is not safe or explicit.
- No raw source retention
  imported plan truth is currently destructively normalized into `plan_cycles` and `planned_workouts`.
- No import transaction boundary in storage design
  the code normalizes and writes directly, but there is no explicit persisted import batch that can be marked `received`, `applied`, or `failed`.
- Editing readiness is thin
  future manual plan changes could easily overwrite the only normalized row without preserving imported truth.

### Readiness conclusion by question

Is the current codebase structurally ready for per-user training plans?

- Yes, mostly.

Is it ready for importing a new plan for a new user?

- Yes, for the first plan only.

Is it ready for storing multiple users safely?

- Yes at the ownership and RLS level, with the caveat that the temporary local bypass must stay non-canonical.

Is it ready for loading the correct plan for the authenticated user?

- Yes, through the current `getPersistedSnapshot()` path.

Is it ready for future manual editing of a plan?

- Partially.
  The existing plan and workout tables are usable, but provenance and edit semantics are not strong enough yet.

## Immediate Scope

Immediate implementation scope for service usability now:

- authenticated user owns exactly one current training program
- imported JSON is stored canonically
- planned workouts are stored per user in Supabase
- the app loads that user’s plan from Supabase through the existing server seam
- local temporary paths remain non-canonical and removable

This immediate scope should do now:

- keep `runner_profiles` as the user-side runner anchor
- keep `plan_cycles` as the canonical training-program header
- keep `planned_workouts` as the canonical program contents
- add one raw import and provenance layer
- add enough metadata for future editing preparation

This immediate scope should not do now:

- build OCR ingestion
- build verdict or AI comparison systems
- build a full editor
- generalize to multiple sports
- build generalized workflow engines

## Canonical Supabase Data Model

Recommended immediate canonical model:

### 1. `runner_profiles`

Role:

- athlete or user reference for saved-mode ownership

Keep as-is:

- this remains the per-user profile anchor

### 2. `plan_cycles`

Role:

- canonical training-program header

Keep and extend:

- keep `id`, `user_id`, `status`, `title`, `goal_summary`, `start_date`, `end_date`
- keep `status = active | archived`

Recommended immediate additions:

- `origin_import_batch_id uuid null`
- `source_kind text not null default 'json_import'`
- `source_schema_version text not null default 'json-import-v1'`
- `revision_number integer not null default 1`
- `supersedes_plan_cycle_id uuid null`
  self-reference for later replacement or version transitions

Why:

- `plan_cycles` is already the right canonical table
- these fields make it import-aware and editing-aware without introducing a second plan model

### 3. `plan_import_batches`

Role:

- raw imported JSON artifact
- normalization and import status owner
- provenance anchor

Recommended immediate columns:

- `id uuid primary key`
- `user_id uuid not null`
- `plan_cycle_id uuid null`
- `source_kind text not null`
  initial value: `json_import`
- `source_schema_version text not null`
  initial value: `json-import-v1`
- `normalizer_version text not null`
- `status text not null`
  recommended initial values:
  `received`
  `validated`
  `applied`
  `failed`
- `raw_payload jsonb not null`
- `input_checksum text not null`
- `plan_name text null`
- `generated_for_label text null`
- `start_date date null`
- `error_summary text null`
- `error_details jsonb null`
- `received_at timestamptz not null default now()`
- `applied_at timestamptz null`
- `created_at timestamptz not null default now()`

Why this table is needed now:

- preserves original imported truth
- creates a real import boundary
- allows safe future re-imports and editing preparation

### 4. `planned_workouts`

Role:

- canonical normalized planned workout rows for a user’s current program

Keep:

- `plan_cycle_id`
- `user_id`
- `workout_date`
- `weekday`
- `week_number`
- `phase`
- `workout_type`
- `title`
- `notes`
- `steps jsonb`
- `display_order`

Recommended immediate additions:

- `import_batch_id uuid null`
- `source_row_index integer null`
- `source_date date null`
- `source_kind text not null default 'json_import'`
  initial values later may include:
  `json_import`
  `manual_edit`
  `ai_adjusted`
- `updated_at timestamptz not null default now()`

Deferred but intentionally prepared:

- do not add separate stage tables now
- do not add a full workout revision table now

Why this is enough now:

- `steps jsonb` already fits current planned structure
- `source_kind` and provenance fields prepare for future edits
- `updated_at` makes later plan changes auditable enough for this stage

### 5. `workout_logs`

Role:

- actual executed workout result tied to one planned workout

Immediate recommendation:

- keep this table as-is for now
- do not broaden it into evidence or AI result storage yet

### What to defer until later

Defer:

- screenshot evidence tables
- extraction tables
- verdict tables
- workout-level revision trees
- generalized plan-edit operations tables
- multi-sport abstractions

## Multi-User Ownership Model

Canonical ownership rule:

- every canonical plan row must belong to exactly one authenticated user

### How each user sees only their own plan

- `runner_profiles.user_id` remains the identity anchor
- `plan_cycles.user_id` owns the plan header
- `planned_workouts.user_id` owns the normalized workout rows
- all saved-mode reads continue resolving by authenticated `userId`

### How one user imports a new plan without affecting another

- each import batch is created with one `user_id`
- each new `plan_cycle` is created with that same `user_id`
- each `planned_workout` row inherits that same `user_id`
- no shared global plan rows are used for saved mode

### How future test and admin flows avoid corruption

- temporary local bypass must remain clearly separate from canonical Supabase production flows
- local bypass data must not be treated as proof that the multi-user Supabase path is production-ready
- any future admin tooling must never write plans without explicit target `user_id`

### RLS and ownership expectations

High-level expectation:

- keep RLS on all user-owned tables
- allow authenticated users to read and mutate only rows where `auth.uid() = user_id`
- keep service-role use server-only for import orchestration and non-client write paths

Important posture:

- client-side direct canonical plan writes should not become the main path
- server-side orchestration remains the canonical write path

## Future Editing Preparation

Do not design the whole editor now.

Do define the storage prerequisites now:

### A. Changing workout details manually

Storage must support:

- updating `planned_workouts.title`
- updating `planned_workouts.notes`
- updating `planned_workouts.steps`
- preserving whether the row still represents imported truth or a later manual change

Immediate prerequisite:

- `planned_workouts.source_kind`
- `planned_workouts.updated_at`

### B. Editing tomorrow’s planned workout

Storage must support:

- selecting the current user’s active plan
- selecting tomorrow’s `planned_workout`
- updating that row without touching another user’s data

Immediate prerequisite:

- keep one active `plan_cycle` per user
- keep one canonical `planned_workout` row per plan and date

### C. Preserving AI-generated vs manually adjusted

Immediate preparation:

- use `planned_workouts.source_kind`
  future values can distinguish:
  `json_import`
  `manual_edit`
  `ai_adjusted`

This is enough now without building the AI system itself.

### D. Avoiding destructive loss of original imported plan truth

Immediate preparation:

- preserve raw imported JSON in `plan_import_batches.raw_payload`
- link `plan_cycles.origin_import_batch_id`
- link `planned_workouts.import_batch_id`

This means:

- future edits may change canonical planned workout rows
- original imported plan truth still survives in the raw batch and import-linked provenance

### E. Replacement semantics for later

Immediate preparation should assume:

- future “replace plan” behavior creates a new `plan_cycle`
- the old `plan_cycle` becomes `archived`
- `supersedes_plan_cycle_id` can record the relationship

That is safer than trying to mutate plan history invisibly.

## Trusted Output Boundary

### Raw imported JSON

Raw imported JSON is:

- the uploaded source artifact
- stored in `plan_import_batches.raw_payload`
- not itself trusted product output

### Normalized canonical plan data

Normalized canonical plan data is:

- `plan_cycles`
- `planned_workouts`

This is the stable application-facing plan representation.

### Trusted user-visible plan output

Trusted user-visible plan output begins when:

- the import batch reached `applied`
- the canonical `plan_cycle` exists for that user
- the canonical `planned_workouts` exist for that user
- the app reads that normalized per-user plan through the backend seam

## Checklist By Phase

### Phase 0: Finalize schema and readiness decision

- Goal:
  lock the canonical storage decision and confirm the codebase can move directly into backend implementation
- Main dependency:
  agreement that `plan_cycles` and `planned_workouts` remain the canonical plan path
- Main risk:
  reopening architecture choices and drifting into a second plan model
- Rollback posture:
  stop at the decision layer and keep current production behavior unchanged until the storage path is agreed
- Next likely role:
  BACKEND

### Phase 1: Create Supabase schema and migrations

- Goal:
  add `plan_import_batches` and the minimal provenance and edit-preparation fields on `plan_cycles` and `planned_workouts`
- Main dependency:
  approved canonical storage decision from Phase 0
- Main risk:
  adding extra speculative tables that are not needed for immediate rollout
- Rollback posture:
  migrations should remain additive and backward-safe; do not delete current plan tables
- Next likely role:
  BACKEND

### Phase 2: Implement JSON import normalization into canonical tables

- Goal:
  persist raw import batch, validate the JSON shape, normalize it, and write canonical plan and workout rows for the authenticated user
- Main dependency:
  migration support for import batches and provenance fields
- Main risk:
  partial writes where the raw artifact is stored but canonical rows are not applied cleanly
- Rollback posture:
  keep raw batch storage append-only and mark failed imports explicitly rather than silently discarding them
- Next likely role:
  BACKEND

### Phase 3: Connect onboarding and import flow to Supabase-backed per-user plans

- Goal:
  make the current JSON-first onboarding write through the canonical import path for real authenticated users
- Main dependency:
  normalized import path from Phase 2
- Main risk:
  current “create only if no active plan exists” behavior blocking legitimate first use or replacement logic
- Rollback posture:
  preserve first-plan creation behavior if replacement flow is not ready, but keep the import-batch layer in place
- Next likely role:
  BACKEND

### Phase 4: Prepare plan-editable storage semantics

- Goal:
  add the minimum semantics now so later manual workout edits and future plan replacement can happen safely
- Main dependency:
  stable canonical storage of imported plans
- Main risk:
  pretending editing is ready without provenance and source-kind fields
- Rollback posture:
  editing UI can stay deferred; only the storage semantics need to land now
- Next likely role:
  BACKEND

## Risks

- The temporary local bypass can obscure whether the live Supabase path is truly production-ready.
- The current onboarding flow cannot safely replace an existing active plan yet.
- Without raw import retention, future plan edits and re-imports will lose original source truth.
- If plan provenance is postponed again, later editing and AI-added plan changes will force a harder migration.
- If service-role assumptions are not clarified during backend implementation, production persistence may work differently than local expectations.

## Exit Criteria

- One implementation-ready storage plan exists for real per-user training programs in Supabase.
- The plan clearly states what is already ready, what is missing, and what is risky.
- The immediate scope is limited to real authenticated per-user program storage.
- The canonical schema decision keeps one plan path and one workout path.
- Multi-user ownership and high-level RLS expectations are explicit.
- Future plan editing is prepared structurally without designing the full editor now.
- One next role is chosen to implement the immediate backend integration.

## Next Recommended Role

BACKEND

## Suggested Next Step

Start the backend implementation from this plan by drafting the additive Supabase migration for `plan_import_batches` plus the minimal provenance and edit-preparation fields on `plan_cycles` and `planned_workouts`, then update the JSON onboarding import path to write through that canonical per-user storage flow.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Completed an architectural readiness review of the current codebase and produced the implementation-ready plan for immediate Supabase-backed per-user training-program storage, centered on keeping `plan_cycles` and `planned_workouts` as canonical truth while adding one raw import and provenance layer.

### Key Decisions

- The current codebase is structurally close to ready for real per-user plan storage, but it still needs a canonical import-batch layer and explicit replace/edit-preparation semantics.
- The immediate implementation path should remain narrow: one active plan per authenticated user, canonical normalized workouts in Supabase, and raw JSON retained for provenance.

### Current State

- The app already has login-first saved mode, JSON-first onboarding, per-user plan loading, workout logging, and backend-derived week status.
- This new plan now defines the exact readiness gaps and the backend-first implementation sequence needed to make real Supabase plan storage usable immediately.

### Constraints

- Do not broaden this work into OCR, verdict pipelines, multi-sport abstraction, or speculative workflow engines.
- Keep one canonical plan path and one canonical planned-workout path.

### Risks / Open Questions

- The temporary local bypass remains a non-canonical path and should not drive the production storage design.
- Existing-plan replacement behavior is still underspecified and must not be hidden behind the current first-plan-only onboarding behavior.

### Next Recommended Role

BACKEND

### Suggested Next Step

Write the concrete additive Supabase migration and backend import-flow changes for `plan_import_batches`, `plan_cycles`, and `planned_workouts` using this plan as the implementation contract.
```
