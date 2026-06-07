# Heart Rate Zones Profile And AeT Estimation Plan

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Plan the next heart-rate zones profile and AeT estimation slice.

## Stage

ARCHITECT plan

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan the next heart-rate zones profile and AeT estimation slice.

STAGE:
ARCHITECT plan

CONTEXT:
- Source path: docs/tasks/backlog/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Architect / Backend

## Last Updated

2026-06-06

## Backlog Inventory Note

Moved from active plans to backlog during the 2026-06-03 cleanup because Hito still does not have
runner-level HR-zone truth, but this is not an active implementation track.

This is not the next committed implementation slice. Treat it as a paused future physiology plan until PRODUCT/ARCHITECT explicitly prioritizes HR-zone work.

The 2026-06-06 watch-executable workout targets closeout reinforced this item as the canonical
future track for personal HR-zone truth. The completed executable target contract intentionally
keeps age-estimated/default HR advisory/readback-only and does not treat it as executable HR target
truth.

## Next Action

When prioritized, ARCHITECT should first reduce this broad plan into one backend-owned Phase 1 slice for runner-level manual zone storage and readback before guided-test estimation or active-plan reapplication.

## Context

The product already has:

- one canonical `runner_profile`
- saved-mode plan creation and replacement
- workout logging
- live Garmin FIT/ZIP upload inside workout-detail `Feedback`
- deterministic Garmin parsing
- deterministic planned-vs-actual comparison

What it does not yet have is one runner-level physiological truth seam that can inform plan targets over time.

The requested capability is:

- ask runners whether they know their heart rate zones
- let runners enter them manually if they do
- otherwise prescribe one guided aerobic test workout
- accept one uploaded FIT file for that test
- estimate AeT and derived heart rate zones deterministically
- let the runner confirm whether to apply those zones to the current active plan
- use those zones for future plan creation

This must stay smaller than a full adaptive-training engine.

## Product Decision

First release should support one bounded zone-truth model only:

- one active heart-rate-zone profile per runner
- source:
  `manual`
  `estimated_from_test`
- one bounded AeT-based estimation method
- one explicit confirmation step before active-plan application

This slice should update:

- runner profile truth
- active plan future-facing heart-rate target truth
- future plan-generation inputs

This slice should not update:

- archived plans
- completed historical workouts
- plan structure beyond heart-rate target semantics unless a full plan rebuild is explicitly chosen

## Scope

### In scope

- onboarding question about heart rate zones
- manual zone entry
- guided aerobic-test setup
- deterministic FIT validation and AeT estimation
- profile surface for body data and zone review
- explicit application of current zones to the active plan
- future plan creation using active zones

### Out of scope

- Garmin OAuth sync
- Apple Health or Strava ingestion
- medical claims
- multi-method zone estimation
- silent adaptive plan mutation
- broad account/settings center

## Core Design Choice

The most important first-release choice is how zones affect plans.

Recommended path:

- store zones at the runner-profile layer as canonical truth
- offer one explicit `Apply to current plan` action for the active plan
- ensure future plan creation always reads active profile zones

Do not make every workout independently own a permanent duplicated copy of the same zone profile unless it is required for auditability inside a rebuilt active plan.

## Option Evaluation

### Option 1: Manual zones only

Pros:

- fastest to ship
- low risk
- immediately useful for runners who already know their data

Cons:

- does not help runners who do not know their zones
- leaves Garmin evidence underused

Usefulness:

- good as a fallback
- too narrow as the only solution

### Option 2: Guided test plus deterministic estimation only

Pros:

- stronger product differentiation
- uses the existing Garmin seam well

Cons:

- slower to ship
- creates a dead end for runners who already know their zones

Usefulness:

- valuable, but incomplete alone

### Option 3: Manual zones plus guided test estimation

Pros:

- covers both runner states
- keeps one canonical output model
- uses the Garmin seam without forcing it on everyone

Cons:

- broader than a single-path slice

Recommendation:

- this is the right first-release shape

## Recommended Delivery Sequence

### Phase 1: Runner-level zone storage and manual entry

Purpose:

- create one canonical place for zone truth before adding estimation logic

Deliver:

- heart-rate-zone storage model
- manual entry flow in onboarding
- profile readback and edit entry
- future plan creation reads active zones when present

Why first:

- it creates the stable target state
- it gives immediate value even before estimation exists

### Phase 2: Guided test protocol and workout lifecycle

Purpose:

- give runners who do not know their zones one bounded way to acquire them

Deliver:

- protocol copy and instructional surface
- one explicit workout artifact or pseudo-workout assignment
- visibility of test status:
  not started
  awaiting upload
  uploaded
  valid
  rejected

### Phase 3: Deterministic FIT validity and AeT estimation

Purpose:

- turn uploaded test evidence into trustworthy estimated zones

Deliver:

- preprocessing rules
- validity checks
- AeT estimation
- derived zone calculations
- confidence state

### Phase 4: Apply zones to active plan

Purpose:

- let runner-level zone truth affect the current active plan explicitly

Deliver:

- review screen with old vs new zones
- explicit runner confirmation
- active-plan update behavior for future workouts only

### Phase 5: Profile expansion and maintenance

Purpose:

- make the capability maintainable after onboarding

Deliver:

- `User profile` surface
- bounded physical fields
- zone source and last-updated visibility
- manual re-entry or re-estimation entry point

## Data Model Direction

### Runner profile expansion

Current `runner_profiles` is too narrow for this feature.

Recommended first-release additions:

- `first_name text null`
- `last_name text null`
- `display_name text null`
- `avatar_url text null`
- `weight_kg numeric null`
- `height_cm numeric null`
- `birth_year integer null`

These should remain bounded profile fields, not a broad settings system.

### New canonical zone table

Recommended new table:

- `runner_hr_zone_profiles`

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `status text not null`
  values:
  `active`
  `superseded`
- `source_kind text not null`
  values:
  `manual`
  `estimated_from_test`
- `aet_hr integer not null`
- `z1_min integer null`
- `z1_max integer null`
- `z2_min integer null`
- `z2_max integer null`
- `z3_min integer null`
- `z3_max integer null`
- `z4_min integer null`
- `z4_max integer null`
- `z5_min integer null`
- `z5_max integer null`
- `decoupling numeric(6,4) null`
- `aerobic_efficiency numeric(8,4) null`
- `threshold_estimate numeric(8,4) null`
- `confidence_score numeric(5,4) null`
- `validation_state text not null`
  values:
  `manual`
  `estimated_valid`
  `estimated_low_confidence`
  `rejected`
- `summary_payload jsonb not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

One runner should have one active row at a time.

### Test-run provenance table

Recommended new table:

- `runner_hr_zone_tests`

Purpose:

- track the guided test lifecycle separately from general workout feedback

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid null`
- `result_asset_id uuid null`
- `actual_metrics_id uuid null`
- `hr_zone_profile_id uuid null`
- `status text not null`
  values:
  `scheduled`
  `awaiting_upload`
  `processing`
  `estimated`
  `rejected`
- `protocol_version text not null`
- `rejection_reason text null`
- `summary_payload jsonb not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

This keeps the heart-rate-zone test flow auditable without mixing it into unrelated workouts blindly.

## Plan Application Direction

The product needs one explicit rule for what `apply zones to plan` means.

Recommended first release:

- update the active plan only
- update only future workouts on that active plan
- preserve past workouts and their logged history exactly as they are

Recommended implementation style:

- use one bounded active-plan retargeting or rebuild seam
- apply heart-rate target semantics only where workouts already carry HR-targetable structure
- do not invent HR targets for workouts that currently have none unless the plan-generation logic already supports that workout family

This can be implemented in one of two ways:

### Option A: Patch future planned workouts in place

Pros:

- smaller and safer
- avoids full plan regeneration

Cons:

- works only when current workout structures are already compatible with zone substitution

### Option B: Rebuild the active plan from the same plan intent plus the new zone profile

Pros:

- cleaner if the authoring/generation layer already owns HR-target semantics centrally

Cons:

- much riskier
- can turn into a hidden plan-replacement system

Recommendation:

- prefer Option A first
- only consider full rebuild if the in-place retargeting path becomes too lossy

## Guided Test UX Direction

### Onboarding

Add one bounded question:

- `Do you know your heart rate zones?`

Paths:

- yes:
  open manual entry
- no:
  explain the guided test and let the runner continue without zones or add the test path

Important:

- the runner should not be blocked from using the product forever just because they skip the test
- the product should present the test as valuable, not mandatory for basic use

### User profile

Add one `User profile` surface reachable from the existing shell profile area.

V1 sections:

1. identity
   avatar placeholder, first name, last name, email readback
2. body data
   weight, height, optional age/birth-year style field
3. heart rate zones
   source, current AeT, current zones, last updated, edit or re-estimate action

### Guided test state copy

The test flow should communicate one of:

- no zones yet
- manual zones saved
- test assigned
- awaiting FIT upload
- test invalid, retry needed
- estimated zones ready for review
- active zones applied

## Deterministic Estimation Direction

### Required FIT signals

- `timestamp`
- `heart_rate`
- `speed` or `pace`

### Recommended supporting signals

- `cadence`
- `elevation`
- `GPS`

### Preprocessing

At minimum:

- remove paused segments
- remove GPS spikes
- remove heart-rate spikes
- suppress the first 3 minutes of unstable HR for estimation logic

### Segmentation

The system should segment the workout into:

- warmup
- stage 1
- stage 2
- stage 3
- cooldown

based on the prescribed protocol timing.

### Validity rules

First release should reject when:

- duration is below threshold
- pauses exceed threshold
- cumulative idle exceeds threshold
- terrain variance is too high
- pace variance is too high
- HR quality is poor

### Main metrics

Persist at minimum:

- AeT estimate
- zone ranges
- decoupling
- aerobic efficiency
- confidence score

### Truth boundary

OpenAI should not estimate the zones.

OpenAI may later explain the result in plain language, but:

- validity
- AeT estimation
- zone construction

must remain deterministic.

## API And Surface Direction

### Backend seams

Recommended new modules:

- `src/lib/hr-zones/manual-zone-profile.ts`
- `src/lib/hr-zones/test-protocol.ts`
- `src/lib/hr-zones/estimate-aet-from-fit.ts`
- `src/lib/hr-zones/build-zone-profile.ts`
- `src/lib/hr-zones/apply-zones-to-active-plan.ts`

### Server actions

Recommended first actions:

- `saveManualHrZones(...)`
- `startHrZoneTestProtocol(...)`
- `estimateHrZonesFromWorkoutResult(...)`
- `confirmHrZoneProfile(...)`
- `applyHrZonesToActivePlan(...)`

### Frontend surfaces

Recommended first surfaces:

- onboarding zone-question step
- manual zone-entry form
- guided test explainer surface
- `User profile` route or modal
- active-plan reapply confirmation surface

## Risks

- AeT estimation can look more certain than it really is if confidence and rejection rules are weak.
- The guided-test flow can become too heavy if it is mandatory during onboarding.
- Plan reapplication can accidentally become a hidden plan rewrite if the scope is not limited to future workouts and HR-targetable fields.
- Profile can sprawl into a generic account/settings hub if it is not kept bounded.

## Validation Plan

### Product validation

- runner can say they know or do not know their zones during onboarding
- runner can save manual zones without taking the test
- runner can postpone the test and still continue into the product
- runner can later open `User profile` and review or edit zone truth
- runner sees explicit confirmation before active-plan HR targets change

### Backend validation

- one runner has at most one active hr-zone profile
- invalid test workouts are rejected with stable reasons
- the same FIT file yields stable estimation output across repeated runs
- active-plan application changes only future workouts
- archived plans and historical logs remain unchanged

### UX validation

- onboarding does not become blocked or confusing for runners who skip the test
- profile clearly distinguishes manual vs estimated zones
- active-plan update language makes it clear what will and will not change

## Recommended Sequencing

1. Add runner-level zone storage and manual-entry path.
2. Add `User profile` surface with bounded profile fields and zone readback.
3. Add guided test protocol assignment and status model.
4. Add deterministic FIT validity and AeT estimation.
5. Add explicit active-plan reapplication confirmation flow.
6. Teach future plan creation to consume active zones automatically where supported.

## Checklist

- [ ] define the canonical active hr-zone profile model
- [ ] add bounded runner profile fields for body and identity metadata
- [ ] add manual zone entry path in onboarding
- [ ] add `User profile` entry point and heart-rate-zone section
- [ ] define the guided test lifecycle and protocol versioning
- [ ] implement deterministic FIT validity checks for the protocol
- [ ] implement deterministic AeT estimation and zone construction
- [ ] persist zone provenance and confidence
- [ ] add explicit `apply to current plan` confirmation flow
- [ ] ensure future plan creation reads active zones when present
- [ ] validate that archived plans and historical workouts remain unchanged

## Exit Criteria

- A saved-mode runner can own one canonical active heart-rate-zone profile.
- That profile can come from manual entry or deterministic guided-test estimation.
- The guided-test flow can accept or reject uploaded FIT evidence honestly.
- The runner can review current zones in `User profile`.
- The runner must explicitly confirm before the active plan is updated with new zones.
- Future plan creation can consume active heart-rate-zone truth when it exists.
- Archived plans and historical workout truth are preserved.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the implementation plan for runner-level heart-rate-zone ownership, including manual entry, guided aerobic-test estimation from FIT upload, profile visibility, and explicit active-plan reapplication.

### Key Decisions

- Use one active heart-rate-zone profile per runner with explicit provenance.
- Keep AeT estimation deterministic and FIT-based, not AI-derived.
- Support both manual entry and guided test estimation in the first release.
- Limit plan application to the active plan's future-facing truth and require runner confirmation.

### Current State

- The app already has canonical runner profiles, saved-mode plan creation and replacement, and live Garmin FIT upload plus deterministic parsing inside workout `Feedback`.
- It does not yet have runner-level zone storage, guided test orchestration, or a plan-update seam based on heart-rate-zone truth.

### Constraints

- Do not expand this into provider sync, a broad physiology dashboard, or silent adaptive coaching.
- Do not modify archived plans or historical workout truth.
- Do not let the profile surface grow into a broad account-settings product.

### Risks / Open Questions

- The exact boundary between patching future workouts and regenerating an active plan needs architectural judgment.
- AeT estimation confidence and rejection logic must be conservative to preserve trust.
- Onboarding must keep the guided test optional enough to avoid blocking adoption.

### Next Recommended Role

ARCHITECT

### Suggested Next Step

Translate this plan into a concrete schema-and-surface proposal for runner-level zone storage, test provenance, deterministic estimation, and active-plan reapplication.
```
