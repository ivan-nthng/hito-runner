Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Architecture Legacy And Refactor Plan

## Status

Active

## Owner

Architect

## Last Updated

2026-05-09

## Context

The repo is no longer in an early import state. The system already has real architectural gains:

- one TanStack Start runtime
- one canonical route tree
- one canonical backend seam in `src/lib/training-api.ts`
- one canonical normalized view seam in `src/lib/training.ts`
- one persisted Supabase truth path for saved mode
- one bounded `training-plan-v2` contract direction
- one visible text-first onboarding direction

That is real progress and should not be thrown away in a cleanup pass.

The remaining problem is different:

- several temporary compatibility paths still coexist in production code
- some richer contract truth is still flattened into smaller persisted enums or summary fields
- some legacy paths were acceptable during migration but are now at risk of overstaying
- the codebase now needs one deliberate cleanup/refactor pass so the system becomes smaller, not more “flexible”

This plan is the canonical architecture audit and cleanup sequence for that refactor.

## What Improved

### 1. One canonical runtime and route surface

The imported baseline is no longer floating beside a second app. The project now runs as one TanStack Start app at repo root, and the main routes `/`, `/login`, `/workout/$date`, `/progress`, `/body`, and `/integrations` are all inside that same runtime.

Why this is worth preserving:

- no framework split
- no duplicate shell implementation
- imported UI/UX baseline stayed mostly intact
- future cleanup can happen inside one app instead of across multiple runtimes

### 2. One canonical saved-mode data seam

`src/lib/training.ts` now acts as the normalized read contract for:

- preview snapshots
- persisted snapshots
- status derivation
- weekly aggregates
- workout lookup and formatting helpers

`src/lib/training-api.ts` now acts as the canonical backend execution seam for:

- home/workout/progress loading
- onboarding completion
- JSON import
- text-first onboarding
- structured authoring
- workout-log mutation

Why this is worth preserving:

- route code is thinner than before
- view rendering no longer needs to know which storage source produced the data
- most new flows already converge before rendering

### 3. Saved mode has real persisted truth

Saved mode is no longer mock-only. The repo now persists:

- `runner_profiles`
- `plan_cycles`
- `planned_workouts`
- `workout_logs`

and derives `week_status` from persisted workout truth instead of client heuristics.

Why this is worth preserving:

- product truth moved from mock semantics into backend-owned rows
- multi-user ownership is structurally possible
- logging and week status have a clear trust boundary

### 4. Authoring direction is now text-first, not JSON-first

The visible onboarding direction changed in the right way:

- primary path: free text
- server-side OpenAI extraction into bounded authoring input
- deterministic validation
- canonical plan generation
- Supabase persistence

Why this is worth preserving:

- the normal-user path is more product-correct than JSON upload
- JSON is now secondary and advanced instead of primary
- canonical plan truth still stays machine-readable and importable

### 5. Import normalization is materially better

`src/lib/imported-plan.ts` now does real normalization instead of shallow pass-through:

- accepts legacy `week_1_preview[]`
- accepts richer `training-plan-v2`
- excludes runtime-only noise from v2
- maps both into one canonical saved workout seed
- normalizes interval-by-time and interval-by-distance into one bounded segment DSL

Why this is worth preserving:

- route rendering is insulated from raw uploaded JSON shapes
- the app already has a real import boundary
- future contract evolution has a place to land

### 6. Replacement safety improved

Plan replacement is no longer blind. The current apply path:

- compares current logged workouts against candidate imported workouts
- blocks replacement if logs would detach
- carries logs forward only on exact deterministic matches

Why this is worth preserving:

- saved progress is now protected
- import is no longer allowed to silently erase visible user truth

### 7. Auth and SSR state are structurally healthier

Request middleware now resolves:

- local bypass session first
- otherwise Supabase user via `getUser()`
- otherwise preview context

Why this is worth preserving:

- SSR auth state is explicit
- saved mode can resolve server-side
- preview mode no longer crashes when real auth env is absent

## Legacy Inventory

### A. Temporary local auth bypass

Files:

- [`src/lib/local-auth.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/local-auth.ts)
- [`src/lib/local-auth-supabase.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/local-auth-supabase.ts)
- [`src/routes/login.tsx`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/login.tsx)
- [`src/components/AuthEntryScreen.tsx`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/AuthEntryScreen.tsx)

What it is:

- local username/password account model
- cookie session outside normal Supabase login
- optional linking from local account to real `auth.users`

Why it exists:

- Magic Link delivery was intentionally paused
- the repo needed immediate local saved-mode use

Why it is now legacy:

- it duplicates the auth entry story
- it keeps a second identity provider in request middleware
- it keeps auth-state behavior harder to reason about than necessary

Current classification:

- acceptable temporary compatibility for loopback local testing only
- explicit deletion target after real Supabase auth is restored and stable
- current status (`2026-05-09`):
  - deploy-visible auth no longer exposes the temporary credentials path
  - `/api/auth/local-login` is now loopback local only
  - local bypass remains available only as a bounded dev convenience and removal target

### B. Temporary local persisted store

File:

- `src/lib/local-auth-store.ts` (removed on `2026-05-08`; kept here as legacy history)

What it is:

- a local JSON-backed fallback store for profile, plan, workouts, and logs

Why it exists:

- saved mode needed to work even before server-side Supabase writes were guaranteed locally

Why it is now legacy:

- it duplicates canonical saved-mode storage semantics
- it duplicates local data models for `profile`, `planCycle`, `plannedWorkouts`, `workoutLogs`
- it forces `training-api.ts` to branch between two saved-mode backends

Current classification:

- dangerous transitional storage path
- highest-risk legacy because it duplicates canonical saved runner truth

### C. Legacy JSON import contract

File:

- [`src/lib/imported-plan.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/imported-plan.ts)

What it is:

- support for the old `week_1_preview[]` upload shape

Why it exists:

- current imported artifact and early onboarding path began from that visible shape

Why it is now legacy:

- it is too shallow for long plans, editability, and future comparison
- it requires inference and synthetic segment construction

Current classification:

- acceptable temporary compatibility
- should remain only until `training-plan-v2` becomes the only supported external template

### D. Structured-authoring path as a parallel authoring lane

Files:

- [`src/lib/structured-plan-authoring.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/structured-plan-authoring.ts)
- [`src/lib/training-api.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts)

What it is:

- a deterministic structured authoring input contract and generator

Why it exists:

- it gives the backend one stable internal authoring DSL
- it supports ops and validation without relying on frontend UX

Why it is at risk:

- if treated as a second product flow, it becomes another user-facing authoring path
- product direction is now text-first, not form-first

Current classification:

- keep as internal/canonical generation seam
- demote as product-visible path

### E. Preview baseline still embedded in runtime truth helpers

Files:

- [`src/data/training-plan.json`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/data/training-plan.json)
- [`src/lib/training.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training.ts)
- [`src/lib/training-api.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts)

What it is:

- the imported preview plan remains a real input to preview mode
- parts of saved-mode fallback/assignment logic still derive from preview assumptions

Why it exists:

- baseline UX preservation
- early bootstrap of assigned plans

Why it is now legacy-risk:

- preview is intentionally untrusted
- saved-mode bootstrap should not keep hidden dependency on preview structure forever

Current classification:

- preview rendering path is acceptable
- preview-derived saved-mode creation logic should be retired

### F. Flattened persisted enums and summary fields

Files:

- [`src/lib/supabase/database.ts`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/supabase/database.ts)
- [`supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql)

What it is:

- `runner_profiles.goal_type` is only `build_consistency | first_race | distance_build`
- `planned_workouts.workout_type` is only `easy | steady_or_easy | rest | long_run | quality`
- richer authoring truth is collapsed before persistence

Why it exists:

- minimum viable schema landed before richer authoring and v2 were stabilized

Why it is now legacy:

- richer source truth already exists upstream
- some current semantics are inferred back from title/steps instead of stored canonically

Current classification:

- dangerous structural flattening if left too long
- should be corrected before further authoring and editing expansion

## Double Sources Of Truth

### 1. Saved-mode storage truth: Supabase vs local fallback store

Where:

- Supabase path in `training-api.ts`
- local fallback path in `local-auth-store.ts`

Assessment:

- dangerous split truth

Why:

- both can produce authenticated saved-mode snapshots
- both can mutate logs and onboarding state
- behavior differs by env, not by product meaning

Canonical target:

- Supabase only for saved mode
- local store removed after local bypass can rely on Supabase consistently

### 2. Identity truth: local account session vs Supabase session

Where:

- `src/start.ts`
- `src/lib/backend/auth.ts`
- `src/lib/local-auth.ts`

Assessment:

- acceptable temporary compatibility
- dangerous if normalized into a permanent product feature

Why:

- the middleware can authenticate the same human through two different providers
- local bypass is intended as an unblock path, not product truth

Canonical target:

- one auth provider: Supabase

### 3. Authoring truth: text authoring vs structured authoring vs JSON authoring

Where:

- text in `openai-plan-authoring.ts`
- structured in `structured-plan-authoring.ts`
- import in `imported-plan.ts`

Assessment:

- partly acceptable
- partly dangerous

Acceptable:

- text-first product path
- structured internal generation seam
- advanced JSON import for migration/testing

Dangerous:

- if all three remain equal “primary” flows
- if product/UI copy treats them as peer authoring models forever

Canonical target:

- primary: text
- internal generation seam: structured
- advanced fallback only: JSON import

### 4. Template truth vs runtime/app state

Where:

- v2 import ignores runtime-only fields
- routes still carry visible preview/saved mode state

Assessment:

- acceptable compatibility, already mostly contained

Why:

- runtime-only fields are explicitly excluded by `V2_IGNORED_WORKOUT_KEYS`
- this is good and should remain

Canonical target:

- keep template truth separate from completion state, sync placeholders, and feedback placeholders

### 5. Plan contract truth: legacy JSON vs `training-plan-v2`

Where:

- `importedPlanSchema` union

Assessment:

- acceptable temporary compatibility

Why:

- both formats normalize before persistence
- runtime is not rendering directly from raw imported JSON

Risk:

- long-lived union support increases maintenance and test surface

Canonical target:

- deprecate legacy import once v2 template is stable for real users and ops

### 6. Goal semantics: richer authoring goals vs flattened stored profile goal type

Where:

- authoring supports `5k`, `10k`, `half_marathon`, `marathon`
- persisted `runner_profiles.goal_type` stores only three coarse buckets

Assessment:

- dangerous split truth

Why:

- rich plan intent exists in source authoring
- persisted profile collapses race-specific truth into `first_race`
- downstream product meaning can become lossy or misleading

Canonical target:

- either persist richer goal taxonomy directly
- or explicitly define `runner_profiles.goal_type` as coarse UI grouping only and persist real event/goal taxonomy elsewhere canonically

### 7. Workout semantics: richer workout types vs persisted coarse workout type

Where:

- v2/structured authoring can emit `tempo` and `recovery`
- persisted schema stores `quality` or `easy`
- UI re-infers tempo identity from title and segment structure

Assessment:

- dangerous split truth

Why:

- semantic truth is partly stored in columns, partly inferred from `steps`
- route rendering currently repairs the flattening instead of reading a single canonical workout identity

Canonical target:

- persist a richer canonical workout identity or subtype
- stop relying on title/segment heuristics for core workout identity

### 8. Plan provenance truth: `source_template` vs `source_kind`

Where:

- `training-plan-v2` includes `source_kind`
- `plan_cycles` persists only `source_template`

Assessment:

- moderate split truth

Why:

- the imported/generated plan knows whether it came from JSON import, structured authoring, or OpenAI text authoring
- the persisted cycle stores only a coarse template marker

Canonical target:

- one persisted provenance field family that distinguishes source contract from authoring origin

### 9. Saved-mode bootstrap truth: imported/generated plan vs preview-derived assigned plan

Where:

- `createAssignedPlan()` in `training-api.ts`

Assessment:

- dangerous legacy fallback

Why:

- if an authenticated user has a profile but no active plan, the system can still generate a saved plan from preview data
- this is older bootstrap logic that no longer matches the text-first canonical authoring direction

Canonical target:

- saved-mode plan creation should come only from canonical authoring/import seams, not from preview-derived assignment

## Top 5 Refactor Priorities

1. Remove the temporary local persisted store as a saved-mode source.
2. Eliminate preview-derived saved plan creation and require canonical authoring/import for active plans.
3. Collapse richer plan semantics into less lossy persisted fields, especially goal identity, workout identity, and plan provenance.
4. Demote non-primary authoring paths so product UX has one clear path: text-first.
5. Deprecate the legacy JSON contract after `training-plan-v2` and template tooling are stable enough to carry import/export needs alone.

## Refactor Targets

### Keep

- one TanStack Start runtime
- one route tree
- `training.ts` as normalized read seam
- `training-api.ts` as backend execution seam
- `imported-plan.ts` as import normalization boundary
- `structured-plan-authoring.ts` as internal deterministic generation seam
- `openai-plan-authoring.ts` as text-to-structured generation seam
- Supabase-backed saved-mode ownership and workout-log truth
- preview surfaces as visibly untrusted shells

### Merge

- text-first visible onboarding and backend authoring should remain one product path, with structured generation hidden underneath
- JSON import and generated plan persistence should remain one plan-apply seam
- route rendering should keep reading one normalized snapshot contract regardless of source

### Demote

- JSON upload to advanced/admin/testing path only
- structured authoring to backend and ops path only
- local bypass auth to local testing path only until deleted
- preview plan to signed-out preview only

### Delete Later

- `local-auth-store.ts` fallback store
- preview-derived `createAssignedPlan()` bootstrap behavior
- legacy single-account env fallback once accounts-file or full Supabase auth is the only supported local path
- legacy `week_1_preview[]` import support after v2 replacement window ends
- env alias compatibility (`VITE_*`, legacy service-role aliases) after deployment and local tooling are fully moved to canonical names

## Do Not Refactor Yet

- do not rewrite the imported UI baseline
- do not replace TanStack Start
- do not redesign preview shells that are already honest and bounded
- do not build the full screenshot/OCR/verdict stack yet
- do not build a plan editor UI before storage semantics are tightened
- do not split authoring into chatbot, wizard, and JSON peer flows
- do not replace `steps jsonb` with an over-normalized segment table until the actual edit/query needs prove it

## Refactor Phases

### Phase 0 — Freeze the canonical direction

- goal:
  - confirm one canonical architecture rule-set before code cleanup starts
  - saved mode = Supabase only
  - primary authoring = text-first
  - preview = preview only
- dependency:
  - this plan
- risk:
  - low
- rollback posture:
  - documentation-only
- next likely role:
  - `BACKEND`

### Phase 1 — Remove saved-mode storage split

- goal:
  - stop using `local-auth-store.ts` as an authenticated saved-mode data source
  - make local bypass authenticate locally but always read/write saved mode through Supabase
- dependency:
  - stable local bypass to Supabase-user linking
  - reliable local Supabase env and service key in dev
- risk:
  - medium
  - local testing can break if local bypass still depends on file-backed fallback
- rollback posture:
  - keep the local store code behind a short-lived branch until QA confirms local bypass can survive without it
  - do not delete the file until real local dev verification passes
- next likely role:
  - `BACKEND`
- current status (`2026-05-08`):
  - complete
  - `training-api.ts` no longer falls back to `getLocalAuthSnapshot()`, `completeLocalAuthOnboarding()`, or `saveLocalAuthWorkoutLog()`
  - authenticated local-bypass sessions now resolve to a Supabase auth user and use the same persisted snapshot, plan-apply, and workout-log seams as standard saved mode
  - `local-auth-store.ts`, the `temporary_local` runtime backend label, and the local fallback state-file contract have been removed from the active authenticated path

### Phase 2 — Remove preview-derived saved-plan bootstrap

- goal:
  - delete or hard-disable `createAssignedPlan()` as a saved-mode creation path
  - require canonical text authoring, structured ops generation, or advanced JSON import to create an active plan
- dependency:
  - Phase 1 complete
  - onboarding and ops authoring paths verified
- risk:
  - medium
  - accounts without an active plan may surface clearer empty/setup states more often
- rollback posture:
  - preserve the no-plan/setup-required UI states
  - if needed, temporarily gate the old fallback behind explicit dev-only flag rather than leaving it implicit
- next likely role:
  - `BACKEND`
- current status (`2026-05-08`):
  - complete
  - `training-api.ts` no longer auto-creates an active plan from preview data when a saved profile exists without a `plan_cycle`
  - authenticated no-plan accounts now stay honestly in setup until text authoring, structured ops generation, or advanced JSON import creates canonical persisted plan truth
  - preview-derived `createAssignedPlan()` bootstrap behavior has been removed from the active runtime path

### Phase 3 — Tighten persisted truth for richer plan semantics

- goal:
  - expand persisted schema just enough to reduce dangerous flattening
  - make goal identity, authoring provenance, and workout identity less lossy
- dependency:
  - Phase 1 and Phase 2 complete
  - active v2 contract accepted as canonical source contract
- risk:
  - medium to high
  - schema changes touch imports, rendering, and replacement logic
- rollback posture:
  - additive migration first
  - preserve existing read path until backfilled fields are populated
  - only then switch reads to new fields
- next likely role:
  - `BACKEND`
- current status (`2026-05-08`):
  - complete
  - additive schema tightening now preserves `schema_version`, `source_kind`, `target_date`, `goal_metadata`, and `plan_preferences` in `plan_cycles`
  - `planned_workouts` now preserves `source_workout_id`, `source_workout_type`, `planned_rpe`, `estimated_fatigue`, and `recovery_priority`
  - JSON import, structured authoring, and OpenAI text authoring now all persist the same richer runtime semantics into the same canonical Supabase model
  - fresh writes now store canonical target keys only, while old alias keys remain read-compatible for existing rows

### Phase 4 — Collapse non-primary authoring/product paths

- goal:
  - make product UX clearly text-first
  - keep JSON and structured authoring only where justified
- dependency:
  - Phase 3 complete enough that text-generated plans and imported plans land in the same trustworthy shape
- risk:
  - low to medium
  - risk is mostly UX confusion if demotion is partial
- rollback posture:
  - demote in UI first
  - delete hidden product entry points only after validation and ops agreement
- next likely role:
  - `FRONTEND`
- current status (`2026-05-08`):
  - complete for the visible frontend cleanup slice
  - no-plan onboarding now presents text-first plan creation as the only primary product path
  - JSON remains available only as a visibly demoted advanced import for existing Hito plan files, migration, and testing
  - structured authoring remains an internal/backend and ops capability, not a visible user-facing product flow

### Phase 5 — Deprecate legacy import and env compatibility

- goal:
  - deprecate `week_1_preview[]`
  - remove old env alias clutter once operationally safe
- dependency:
  - real v2 template usage
  - local and deployed env normalized
- risk:
  - low if done late
- rollback posture:
  - keep parser support behind explicit compatibility window until data/users are migrated
- next likely role:
  - `BACKEND`
- current status (`2026-05-09`):
  - effectively complete
  - `training-plan-v2` is now the only supported import contract in runtime, CLI tooling, and visible product copy
  - deprecated `week_1_preview[]` runtime and tooling support has been deleted
  - `VITE_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` have been removed from the active env contract
  - deprecated single-account local auth env has been removed
  - the only bounded legacy bridge still intentionally retained is the loopback-only local bypass configured through `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE`

## Smallest Viable First Cleanup Slice

Remove the local persisted fallback store as a saved-mode read/write source while keeping the visible local login bypass.

Why this is the best first slice:

- it removes the most dangerous split truth
- it does not require route redesign
- it simplifies `training-api.ts` materially
- it preserves the current local login UX while collapsing storage onto one canonical backend

Concrete first-slice target:

- local bypass may still establish identity
- but `getSnapshotForRequest()` and saved-mode mutations should stop falling back to `getLocalAuthSnapshot()` and `saveLocalAuthWorkoutLog()`
- all authenticated saved-mode data should resolve through Supabase only

## Risks

- local developer convenience may regress temporarily if Supabase-backed local setup is not reliable enough
- schema tightening can create hidden migration debt if richer goal/workout/provenance fields are added without a careful read-switch sequence
- partial cleanup is dangerous:
  leaving local store code, preview bootstrap, and legacy import all active after only half the refactor would make the system harder to reason about, not easier
- text-first product direction can still get diluted if structured/JSON paths remain too visible in UI copy

## Anti-overengineering

- do not introduce new orchestration layers just to hide migration complexity
- do not add a second normalized model beside `training.ts`
- do not introduce a generic ingestion framework
- do not normalize every segment into new relational tables before there is a proven edit/query need
- prefer deleting local fallback code over wrapping it in another abstraction
- prefer explicit demotion of old paths over keeping “just in case” compatibility forever

Canonical simplicity rule:

The cleanup pass should reduce the number of:

- auth modes
- saved-mode storage backends
- authoring entry paths
- raw import shapes
- semantic repair heuristics

## Exit Criteria

- saved mode has one storage backend only
- saved-mode plan creation no longer depends on preview-derived assignment
- persisted schema no longer forces important authoring truth to survive only via heuristics
- product UX has one clear primary authoring path
- legacy JSON import is either clearly demoted with a removal window or fully deprecated
- the codebase has fewer active compatibility layers than it has today

## Next Recommended Role

QA

## Suggested Next Step

Verify Phase 4 in Safari with one no-plan account and one saved-plan account: the no-plan surface should read as text-first, and advanced JSON import should remain discoverable without competing with the primary setup path.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Completed the Phase 4 visible frontend cleanup slice on top of the architecture audit: the product now reads as text-first, while JSON remains a demoted advanced import path.

### Key Decisions

- Keep the current runtime, route tree, `training.ts` read seam, and `training-api.ts` backend seam.
- Keep text-first authoring as the only primary product path.
- Keep JSON import only as an advanced/fallback/import path for existing Hito plan files, migration, and testing.
- Keep structured authoring internal to backend and ops; do not expose it as a normal user flow.

### Current State

- No-plan onboarding surfaces lead with one text request to create the first plan.
- Saved-mode profile actions expose `Advanced import`, not a peer authoring path.
- The plan-apply seam still supports advanced JSON import and replacement safety without changing storage.

### Constraints

- No rewrite without evidence.
- Prefer deletion over abstraction.
- Keep preview explicitly outside trusted saved-mode truth.
- Do not expand into editor, OCR, or verdict systems during this cleanup stream.
- Do not make structured authoring or JSON upload a co-equal product path.

### Risks / Open Questions

- Safari QA should still verify one no-plan account and one saved-plan account after this frontend cleanup.
- Legacy JSON compatibility remains intentionally retained until a later deprecation window.

### Next Recommended Role

QA

### Suggested Next Step

Verify Phase 4 in Safari: no-plan setup should read as one text-first product path, and advanced JSON import should remain discoverable without competing with primary onboarding.
```
