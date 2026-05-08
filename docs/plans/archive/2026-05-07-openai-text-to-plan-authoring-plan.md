## Status

Completed

## Owner

Architect Agent

## Last Updated

2026-05-07

## Implementation Status

- Phase 1 backend seam is now implemented in the current branch:
  one server-side free-text contract, one OpenAI generation helper, deterministic validation against bounded structured authoring input, canonical `training-plan-v2` generation, and persistence through the existing `plan_cycles` plus `planned_workouts` seam.
- JSON import remains working as the advanced path.
- The earlier backend structured-authoring seam remains working as a bounded fallback asset.
- The visible onboarding UI is now text-first, so the product-facing primary entry matches the approved authoring direction.
- Local live upstream verification is now complete:
  the existing `author-plan-from-text` path can call the real OpenAI provider, validate the returned structured authoring input, persist the generated canonical plan in Supabase, and render that plan back through the existing saved-mode routes.
- Visible live onboarding verification is now complete:
  an authenticated no-plan user can submit one compact free-text request from `/`, the request runs through the same `completeTextOnboarding` seam, and the user lands back in a coherent saved-mode plan.

## Checklist

- [x] Define one bounded free-text backend input contract
- [x] Add one server-side OpenAI generation seam
- [x] Validate model output before canonical persistence
- [x] Persist successful generated plans through the existing Supabase seam
- [x] Keep JSON import working
- [x] Add one practical ops path for Backend and QA validation
- [x] Replace the visible onboarding UI with the free-text primary path

## Context

The current system already has three relevant building blocks:

- one canonical saved-mode persistence and rendering seam:
  `plan_cycles` -> `planned_workouts` -> `TrainingSnapshot` -> existing routes
- one canonical plan contract:
  `training-plan-v2`
- two older authoring paths:
  visible JSON-first onboarding
  backend-only structured authoring

The product direction has now changed again:

- primary authoring should not be JSON-first
- primary authoring should not be structured-form-first
- primary authoring should be user free text to OpenAI
- OpenAI should produce canonical plan JSON or plan-object truth server-side

This plan corrects the earlier direction and defines one canonical path that avoids a growing pile of parallel UX flows.

## Product Decision

### Primary path

The primary plan-authoring path becomes:

- user writes free text
- server sends that text through one bounded OpenAI generation seam
- OpenAI returns canonical plan output
- the system validates and persists it

### Secondary path

JSON upload remains:

- a secondary advanced path
- an internal tooling and migration path
- a future export or debugging path
- not the normal user journey

Explicit note:

JSON should remain because it is still the cleanest internal and advanced contract for generation, validation, import, QA, and export. It should not remain the main normal-user path because normal runners should describe their intent, not author the system’s internal DSL directly.

### Voice note

Optional future voice input uses the same architecture:

- speech-to-text first
- then the same free-text-to-OpenAI path
- then the same validation, normalization, persistence, and rendering pipeline

Explicit note:

Voice must not create a second planning architecture. It is only another input modality for the same text-to-plan pipeline.

## Canonical Flow

One canonical path:

1. user writes free text
2. server assembles prompt and bounded generation context
3. OpenAI generates canonical structured plan output
4. deterministic validation checks the output against the canonical plan contract
5. normalization converts the validated plan into persisted entities
6. Supabase stores the canonical plan
7. existing saved-mode rendering continues through `TrainingSnapshot`

### Detailed flow

#### Step 1. User free text

User supplies natural language such as:

- goal
- race or time target
- current level
- recent results
- weekly availability
- constraints or injuries
- preferences

The free text is the user-intent surface only. It is not canonical plan truth.

#### Step 2. Server-side prompt and context assembly

The server should assemble:

- the user’s free text
- the canonical plan template contract rules
- bounded field definitions
- product constraints
- allowed workout and segment semantics
- safety instructions that runtime state must not appear in the output

Canonical rule:

- prompt assembly happens server-side only
- the client should not own plan-construction rules

#### Step 3. OpenAI structured generation

OpenAI should output one structured plan object in the canonical contract family.

Recommended output target:

- canonical `training-plan-v2` or its direct approved successor

#### Step 4. Deterministic validation

Validation must check:

- schema correctness
- required fields
- date consistency
- phase and week consistency
- segment DSL correctness
- bounded workout-type and target semantics
- exclusion of runtime-only fields

If validation fails:

- the plan is rejected
- the service does not persist malformed output

#### Step 5. Normalization

The validated plan normalizes into:

- `plan_cycles`
- `planned_workouts`
- `steps jsonb`

#### Step 6. Supabase persistence

Persist through the same canonical backend seam already used by import and structured authoring.

#### Step 7. Existing saved-mode rendering

The app keeps rendering through:

- `TrainingSnapshot`
- `Workout`
- derived `week_status`

Routes must not branch into a new “OpenAI runtime” rendering path.

## OpenAI Boundary

### What OpenAI should do

OpenAI should do:

- interpret free-text runner intent
- infer missing but safe structured relationships where the contract requires them
- produce canonical structured plan output
- translate human language into bounded workout and segment structure

### What deterministic system logic must still do

The system must still do:

- schema validation
- date and timeline validation
- allowed-enum validation
- canonical target-key validation
- runtime-noise stripping or rejection
- persistence normalization
- replacement safety and log carry-forward rules

### What the service must never trust without validation

The service must never trust raw OpenAI output for:

- schema shape
- workout dates
- completion or runtime fields
- unsupported target keys
- invented capability flags
- contradictory scheduling
- malformed interval structures

### How to avoid malformed or overcreative outputs

Recommended controls:

- require structured response output only
- keep the allowed plan contract bounded
- provide explicit allowed field definitions
- reject extra runtime-only fields
- reject outputs that cannot pass deterministic validation
- keep one repair or retry step on the server only if it remains bounded and deterministic

Canonical safety rule:

- OpenAI proposes structured plan truth
- validation decides whether that proposal can become persisted truth

## Relationship To Existing Paths

### Prior structured-form-first direction

The earlier structured-form-first direction is no longer the primary product path.

What happens to it:

- keep the backend structured-authoring contract logic as a bounded normalization and generation asset
- adapt it to serve prompt scaffolding, fallback extraction, or deterministic repair rules where useful
- do not turn it into the primary visible onboarding UX

### Current text-first onboarding

Current state:

- `/` now presents a compact free-text onboarding surface first
- advanced JSON import remains available behind a secondary expandable path

Corrected direction:

- keep text-first as the only primary visible onboarding path
- keep JSON clearly secondary and advanced

### Current `Upload JSON` modal

Keep:

- saved-mode replacement utility
- advanced import and migration path

Do not keep:

- as the primary normal-user creation flow

### Current backend structured authoring slice

Keep:

- validation logic
- bounded generation rules
- normalization contract

Adapt:

- from “structured form input in, plan out”
- to “OpenAI extracted or interpreted authoring intent in, plan out”

Eventually remove from primary UX:

- any assumption that the user must fill a broad explicit field wizard first

## Simplification / Deletion Strategy

The system should not accumulate permanent parallel authoring paths.

### What should remain as technical fallback only

Remain as fallback:

- advanced `Upload JSON`
- backend structured authoring primitives
- ops and CLI authoring utilities

### What should no longer be primary

No longer primary:

- visible JSON-first onboarding
- visible structured-form-first onboarding as the main user journey

### What should later be deleted or collapsed

After the free-text path is stable:

- remove JSON-first copy and framing from onboarding
- collapse overlapping onboarding logic so one visible primary entry remains
- collapse any duplicated form-first authoring UI if it is only scaffolding for the same backend path

Canonical simplification rule:

- one primary authoring UX
- one canonical plan contract
- one persistence seam
- old authoring paths either become clearly advanced or are removed

## Migration Phases

### Phase 0: Canonical text-to-plan contract

Goal:

- freeze the primary authoring decision and define the exact free-text-to-plan pipeline contract

Dependency:

- approved canonical plan template contract

Risk:

- drifting into broad “AI coach chat” scope before the authoring boundary is clear

Rollback posture:

- keep current authoring paths available while the new contract is being defined

Next likely role:

- FRONTEND

### Phase 1: Backend OpenAI generation seam

Goal:

- add one server-side OpenAI seam that turns free text into canonical plan output

Dependency:

- Phase 0 contract
- canonical `training-plan-v2` schema

Risk:

- malformed or overcreative outputs reaching persistence

Rollback posture:

- keep the seam behind server-side validation
- if generation fails, do not persist
- JSON and existing structured backend paths remain fallback

Next likely role:

- FRONTEND

### Phase 2: Minimal text input UI

Goal:

- replace visible onboarding-first JSON entry with a minimal free-text plan request surface

Dependency:

- working backend OpenAI generation seam

Risk:

- shipping UI before generation reliability is acceptable

Rollback posture:

- advanced JSON path stays available
- backend structured authoring fallback remains available

Next likely role:

- FRONTEND

### Phase 3: Demote JSON-first UX

Goal:

- move JSON upload out of first-run primary onboarding and into advanced or settings-level access

Dependency:

- free-text onboarding works for real users

Risk:

- removing JSON prominence too early before the free-text path is trustworthy

Rollback posture:

- keep saved-mode `Upload JSON` modal
- keep ops CLI import paths

Next likely role:

- QA

### Phase 4: Optional voice-ready preparation

Goal:

- prepare the same pipeline to accept speech-to-text input without changing downstream architecture

Dependency:

- stable free-text path

Risk:

- creating a separate voice-specific authoring system

Rollback posture:

- voice remains deferred until plain text is stable

Next likely role:

- BACKEND

## Anti-overengineering

Explicitly avoid:

- giant chatbot product surface first
- duplicating truth between text, form, JSON, and persisted plan
- trusting raw OpenAI output without validation
- keeping legacy primary UX paths forever
- building multiple plan-generation engines with slightly different semantics

Canonical restraint:

- one minimal text box can be enough for the first slice
- one server-side OpenAI generation seam
- one canonical validated plan output
- one existing persistence and rendering path

## Risks

- free-text input may omit details that the generator needs, so prompt and retry rules must stay bounded
- the existing backend structured authoring slice may tempt the product back toward a large explicit form if free-text generation quality is weak
- if JSON-first onboarding remains visible too long, the product will continue to teach the wrong primary behavior
- if OpenAI output is accepted too loosely, malformed plan truth can leak into the saved seam
- cleanup may stall unless deletion and demotion are treated as part of the rollout, not as optional later work

## Exit Criteria

- one approved primary authoring path exists:
  free text -> OpenAI -> validated canonical plan -> persistence
- the OpenAI boundary and deterministic validation boundary are explicit
- JSON is clearly secondary and advanced
- the prior structured-form-first direction is explicitly demoted from primary UX
- a cleanup and deletion posture exists for older visible authoring paths
- one next implementation role is named

## Next Recommended Role

QA

## Suggested Next Step

Run an end-to-end pass on the visible text-first onboarding flow in Safari, including successful free-text authoring, advanced JSON fallback visibility, and the saved-mode plan that opens after generation.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one corrected canonical plan for moving Hito Running’s primary plan-authoring flow to free text -> OpenAI -> validated canonical plan, while demoting JSON upload to an advanced and internal path.

### Key Decisions

- Free text becomes the primary normal-user authoring surface.
- OpenAI converts that text into canonical plan output server-side.
- Deterministic validation remains mandatory before persistence.
- JSON upload remains only as advanced import, tooling, migration, and export infrastructure.
- Voice later fits the same pipeline only by adding speech-to-text before the existing text path.

### Current State

- The app now shows text-first onboarding today.
- Backend already has canonical plan import and a bounded structured authoring seam.
- Saved-mode rendering already depends on canonical persisted plan data rather than raw authoring input.

### Constraints

- Do not create split truth between text input, JSON, form state, and persisted plan.
- Do not trust raw OpenAI output.
- Do not keep multiple visible primary authoring UX paths.

### Risks / Open Questions

- Free-text plan requests may be underspecified unless prompt scaffolding is well bounded.
- Old JSON-first onboarding could linger too long if demotion is not treated as part of rollout.
- The existing structured authoring slice should be reused as backend scaffolding, not revived as the main frontend flow.

### Next Recommended Role

QA

### Suggested Next Step

Validate the visible text-first onboarding flow in Safari end to end, including successful authoring and the secondary advanced JSON path.
```
