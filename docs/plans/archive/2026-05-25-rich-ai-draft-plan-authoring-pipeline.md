# Rich Canonical Workout Model And AI Draft Plan Authoring Pipeline

## Status

Complete / Closed after non-voice rich authoring wave

## Owner

Architect / Running Coach / Backend / Frontend / QA

## Last Updated

2026-05-25

## Closeout Note

Closed 2026-05-25 after all intended non-voice slices passed QA.

Completed scope:

- backend rich workout taxonomy and compatibility fallback
- additive rich workout persistence/readback
- import/export/template rich workout roundtrip
- calendar/glyph rich-field-first rendering
- workout detail rich-truth rendering cleanup
- disposable saved-mode rich-workout QA fixture and browser proof path
- text-authoring OpenAI rich workout draft schema and backend normalizer
- TS-backed text-authoring ops validation path
- active-plan refresh proposal rich-draft normalization with exact reviewed draft/apply safety

Final live refresh proposal smoke:

- live proposal returned in about 47.8 seconds
- `refreshDraft.richWorkoutDraftMetadata.status` was `deterministic_fallback`
- `fallbackReason` was `refresh_proposal_timed_out`
- draft checksum was present
- no apply mutation was performed
- active plan `updated_at` stayed unchanged
- workout count stayed unchanged
- logs stayed unchanged
- disposable tester cleanup passed

Residual backlog, not active scope:

- Voice rich draft normalization remains out of scope unless product explicitly reopens Voice.
- A live `rich_draft_applied` refresh path can be observed later, but bounded timeout fallback is acceptable.
- Metric-mode copy polish remains optional later.

## Context

The current Hito plan generator is much safer and more credible than the early template system. Recent coaching hardening fixed taper/phase consistency, long-distance honesty, mountain/trail doctrine, goal-family identity, beginner consistency caps, metric gating, calendar glyph alignment, and active-plan refresh safety.

The next problem is structural:

- support runs are still too easy to flatten into broad calendar slots
- exact workout meaning is persisted mostly through `source_workout_type`, while compact UI still relies on broad `workout_type` plus inference
- some support runs can still be single-block sessions
- calendar identity is partly guessed from source type/title/steps instead of explicit canonical family/icon truth
- OpenAI text authoring currently produces structured authoring input, not rich workout truth
- refresh, text, voice, import, export, Garmin comparison, and UI readback all touch workout identity in slightly different ways

The product direction is now stricter:

Hito needs one rich canonical workout model that powers both calendar and workout detail.

Canonical pipeline:

`runner truth -> AI drafts rich workout JSON -> backend validates and normalizes -> canonical stored workout truth -> calendar renders family/icon -> workout detail renders exact segments`

This is not a prompt-only task and not a calendar polish task. The backend contract must become rich enough that the frontend no longer has to guess workout semantics.

## Problem Definition

Current plan truth is split across several layers:

- database `planned_workouts.workout_type` is a legacy compact enum:
  `easy`, `steady_or_easy`, `rest`, `long_run`, `quality`
- richer exact identity often lives in `planned_workouts.source_workout_type`
- imported `training-plan-v2` accepts a wider visible `workout_type` set than the persisted enum
- `src/lib/training.ts` resolves visible family through `source_workout_type`, broad `workout_type`, title regex, and step inspection
- `src/lib/workout-glyph.ts` maps those inferred visible families into glyphs
- workout detail renders whatever `steps` contain, so shallow backend structure creates shallow detail

That worked as a safe bridge, but it is no longer the desired architecture.

The desired architecture is:

- exact workout identity is backend-owned truth
- calendar family and icon are backend-owned truth
- all non-rest workouts carry rich segment truth
- OpenAI may draft rich workouts, but backend validates and normalizes before persistence
- UI renders canonical truth instead of deriving product meaning from title regex

## Canonical Workout Model

Every persisted/generated/imported workout should converge toward one canonical workout shape.

Required conceptual fields:

- `workout_family`
- `workout_identity`
- `calendar_icon_key`
- `title`
- `summary`
- `segments`
- `planned_rpe`
- `phase`
- `goal_context`
- `metric_mode`

Persistence can remain additive and backward-safe, but the product model should treat this shape as canonical. Existing `workout_type` and `source_workout_type` may remain compatibility fields during migration, not the long-term source of full meaning.

Suggested canonical type:

```ts
type CanonicalWorkoutFamily =
  | "rest"
  | "recovery"
  | "easy"
  | "steady"
  | "long"
  | "tempo"
  | "intervals"
  | "progression"
  | "race"
  | "hills"
  | "trail";

type CanonicalWorkoutIdentity =
  | "easy_aerobic_run"
  | "recovery_jog"
  | "steady_aerobic_run"
  | "cutback_aerobic_run"
  | "easy_run_with_strides"
  | "long_aerobic_run"
  | "long_run_with_steady_finish"
  | "cutback_long_run"
  | "taper_long_run"
  | "controlled_tempo_session"
  | "half_marathon_threshold_durability"
  | "marathon_steady_specificity"
  | "distance_intervals"
  | "time_intervals"
  | "5k_sharpening_repeats"
  | "10k_rhythm_intervals"
  | "progression_run"
  | "race_pace_session"
  | "taper_tuneup_run"
  | "uphill_repeats"
  | "rolling_hills_session"
  | "technical_trail_easy"
  | "controlled_downhill_durability"
  | "hike_run_endurance"
  | "mountain_long_run_time_on_feet";

type CalendarIconKey = CanonicalWorkoutFamily;

type CanonicalMetricMode = {
  guidance: "effort" | "pace" | "heart_rate" | "mixed";
  paceTargetsAllowed: boolean;
  hrTargetsAllowed: boolean;
  reason: string;
};

type CanonicalGoalContext = {
  goalType: string;
  goalStyle?: string | null;
  terrainFocus?: "standard" | "rolling" | "mountain";
  targetDate?: string | null;
  targetTime?: string | null;
};
```

## Two-Layer Taxonomy

### Layer A: Calendar Family / Icon

Calendar should use this compact family layer only:

- `rest`
- `recovery`
- `easy`
- `steady`
- `long`
- `tempo`
- `intervals`
- `progression`
- `race`
- `hills`
- `trail`

Rules:

- Calendar renders from explicit `workout_family` and `calendar_icon_key`.
- Calendar should not infer family from title regex.
- Calendar can keep compact labels, but those labels must come from backend family truth.
- `quality` should become a legacy compatibility fallback only, not a canonical family for newly generated rich plans.

### Layer B: Exact Workout Identity

Workout detail, review, export, comparison context, and AI explanation should use exact identity:

- `easy_aerobic_run`
- `recovery_jog`
- `steady_aerobic_run`
- `cutback_aerobic_run`
- `easy_run_with_strides`
- `long_aerobic_run`
- `long_run_with_steady_finish`
- `cutback_long_run`
- `taper_long_run`
- `controlled_tempo_session`
- `half_marathon_threshold_durability`
- `marathon_steady_specificity`
- `distance_intervals`
- `time_intervals`
- `5k_sharpening_repeats`
- `10k_rhythm_intervals`
- `progression_run`
- `race_pace_session`
- `taper_tuneup_run`
- `uphill_repeats`
- `rolling_hills_session`
- `technical_trail_easy`
- `controlled_downhill_durability`
- `hike_run_endurance`
- `mountain_long_run_time_on_feet`

Rules:

- Exact identity must persist.
- Exact identity must survive import, export, refresh, and saved-mode rendering.
- Exact identity may be shown as title/detail copy, but calendar should stay compact.
- Exact identity is the language AI should draft against.

## Mandatory Segment Richness

Every non-rest running workout must include:

- `warmup`
- `main`
- `cooldown`

No non-rest workout may remain a single-segment placeholder.

Optional segment roles when appropriate:

- `activation`
- `drills`
- `strides`
- `recovery_block`
- `fueling`
- `steady_finish`
- `hike_run`
- `mobility_note`

Family-specific requirements:

- `recovery`: short warmup, very easy main, short cooldown, no hidden intensity
- `easy`: warmup, easy main, cooldown, breathing/form cue, fallback if the run feels bad
- `steady`: warmup, controlled steady main, cooldown, clear distinction from easy
- `long`: warmup, main durability block, fueling or hydration/recovery cue when relevant, cooldown, phase-specific variant
- `tempo`: warmup, controlled tempo/threshold work, recovery if repeated, cooldown
- `intervals`: warmup, reps, recoveries, cooldown
- `progression`: warmup, easy-to-steady progression, cooldown, no racing the finish
- `hills`: warmup, hill work or controlled descent/climb work, safe recovery, cooldown
- `trail`: warmup, terrain-aware easy/main block, caution cue, cooldown
- `race`: warmup, specific tune-up/race effort, cooldown, conservative copy

Support runs should be rich without becoming hidden workouts. Richness means intent, cueing, fallback, and structure; it does not mean adding intensity everywhere.

## Metric Safety Rules

Numeric pace:

- allowed only when watch/app access is available
- runner asks for pace or mixed guidance
- usable recent 5K benchmark truth exists
- backend metric resolver approves the target

Numeric HR:

- allowed only when real runner-level HR-zone truth exists
- not allowed from age, weight, height, AI guess, generic formula, or vibe

When metric truth is missing, use:

- effort language
- talk-test cues
- breathing cues
- cadence/form cues
- drift/caution cues
- terrain-adjusted effort cues
- recovery guidance

Never invent:

- exact average HR
- exact HR zones
- fake threshold HR
- exact pace ranges without benchmark support

## Canonical Pipeline

Future canonical authoring pipeline:

`runner/profile/preferences/goal truth -> normalized authoring input -> AI rich workout draft -> backend normalization and safety validation -> canonical training-plan-v2 plan -> non-mutating review -> explicit confirm/apply -> persisted plan_cycle/planned_workouts`

Rules:

- AI drafts coaching richness.
- Backend owns truth.
- Backend validates and normalizes every drafted workout.
- Backend strips or rejects fake precision.
- Backend produces one canonical workout model.
- Frontend renders backend-shaped workout truth.
- Risky mutations still require review/confirm.

Do not use:

`runner truth -> AI final plan truth -> persistence`

AI output is draft material, not canonical truth.

## AI Draft Role

AI should draft:

- rich workout family
- exact workout identity
- calendar icon key suggestion
- richer workout titles
- workout intent
- warmup/main/cooldown structure
- optional segment roles when useful
- effort, breathing, form, fallback, terrain, fueling, and recovery cues
- phase-aware support-run variety
- long-run purpose
- quality-session structure
- terrain-specific cues when mountain/rolling/trail context exists

AI must not decide final:

- numeric HR targets
- numeric pace targets
- plan persistence
- entitlement gates
- active-plan mutation
- fixed rest-day overrides
- medical or rehab advice

## AI Draft Schema

Add one bounded internal draft schema before `training-plan-v2` normalization.

Suggested generation-only shape:

```ts
type RichWorkoutDraft = {
  workoutFamily: CanonicalWorkoutFamily;
  workoutIdentity: CanonicalWorkoutIdentity;
  calendarIconKey: CalendarIconKey;
  title: string;
  summary: string;
  phase: "Base" | "Build" | "Specific" | "Taper" | "Cutback";
  goalContext: CanonicalGoalContext;
  plannedRpe?: number;
  intent: string;
  whyToday: string;
  fallbackIfNotFeelingGood: string;
  effortCue: string;
  breathingCue?: string;
  formCue?: string;
  terrainCue?: string;
  fuelingCue?: string;
  recoveryCue?: string;
  metricMode: CanonicalMetricMode;
  segments: RichSegmentDraft[];
};

type RichSegmentDraft = {
  role:
    | "warmup"
    | "activation"
    | "drills"
    | "main"
    | "recovery_block"
    | "cooldown"
    | "strides"
    | "fueling"
    | "steady_finish"
    | "downhill_control"
    | "hike_run"
    | "mobility_note";
  label: string;
  cue: string;
  targetEffort?: string;
  durationMinutes?: number;
  distanceKm?: number;
  repetitions?: number;
  repeatUnit?: {
    mode: "time" | "distance";
    durationMinutes?: number;
    distanceKm?: number;
  };
  recoveryUnit?: {
    mode: "time" | "distance";
    durationMinutes?: number;
    distanceKm?: number;
  };
  proposedPaceRange?: unknown;
  proposedHrRange?: unknown;
};
```

This schema is generation-only. It must not become a second persisted product model.

## Canonical JSON Contract Changes

`training-plan-v2` should be upgraded additively.

Each workout should accept:

- `workout_family`
- `workout_identity`
- `calendar_icon_key`
- `goal_context`
- `metric_mode`

Keep backward compatibility:

- existing `workout_type` remains accepted for old imports and DB compatibility
- existing `source_workout_type` remains accepted as an alias/source for `workout_identity`
- existing `segments` remain the structured workout payload
- runtime-only keys stay ignored/rejected exactly as today

New files should emit the rich shape. Old files should normalize through compatibility mapping.

## Persistence Model

Recommended additive persistence path:

1. Add nullable columns on `planned_workouts`:
   - `workout_family text`
   - `workout_identity text`
   - `calendar_icon_key text`
   - `goal_context jsonb`
   - `metric_mode jsonb`

2. Keep existing columns:
   - `workout_type`
   - `source_workout_type`
   - `title`
   - `notes`
   - `steps`
   - `planned_rpe`
   - `estimated_fatigue`
   - `recovery_priority`

3. During migration:
   - write new rich fields for newly generated/imported/refreshed plans
   - mirror `workout_identity` into `source_workout_type` for compatibility
   - map `workout_family` back into legacy `workout_type` for old code paths
   - keep old plans readable by deriving missing rich fields on load

Do not replace `steps jsonb`. It remains the canonical executable workout detail payload.

## Compatibility Mapping

Suggested family to legacy `workout_type` mapping:

- `rest` -> `rest`
- `recovery` -> `easy`
- `easy` -> `easy`
- `steady` -> `steady_or_easy`
- `long` -> `long_run`
- `tempo` -> `quality` or `steady_or_easy` only as temporary DB compatibility
- `intervals` -> `quality`
- `progression` -> `quality`
- `race` -> `quality`
- `hills` -> `quality`
- `trail` -> `easy` or `quality` depending on identity, only as temporary DB compatibility

This mapping is compatibility only. Product UI should move to `workout_family` and `calendar_icon_key`.

Suggested identity to family mapping:

- `easy_aerobic_run` -> `easy`
- `recovery_jog` -> `recovery`
- `steady_aerobic_run` -> `steady`
- `cutback_aerobic_run` -> `easy`
- `easy_run_with_strides` -> `easy`
- `long_aerobic_run` -> `long`
- `long_run_with_steady_finish` -> `long`
- `cutback_long_run` -> `long`
- `taper_long_run` -> `long`
- `controlled_tempo_session` -> `tempo`
- `half_marathon_threshold_durability` -> `tempo`
- `marathon_steady_specificity` -> `steady`
- `distance_intervals` -> `intervals`
- `time_intervals` -> `intervals`
- `5k_sharpening_repeats` -> `intervals`
- `10k_rhythm_intervals` -> `intervals`
- `progression_run` -> `progression`
- `race_pace_session` -> `race`
- `taper_tuneup_run` -> `race`
- `uphill_repeats` -> `hills`
- `rolling_hills_session` -> `hills`
- `technical_trail_easy` -> `trail`
- `controlled_downhill_durability` -> `hills`
- `hike_run_endurance` -> `trail`
- `mountain_long_run_time_on_feet` -> `trail`

## Backend Normalization Rules

Backend converts draft workouts into canonical `training-plan-v2`.

Normalization must:

- preserve exact workout identity as `workout_identity`
- mirror identity into `source_workout_type` while old readers still need it
- preserve family as `workout_family`
- preserve icon as `calendar_icon_key`
- map family into legacy `workout_type` for compatibility
- convert rich segment roles into canonical `segments` / persisted `steps`
- enforce valid durations/distances/repetition counts
- ensure every non-rest workout includes warmup/main/cooldown
- collapse overlong prose into bounded notes/cues
- keep segment cues runner-facing and non-medical
- reject or strip unsupported numeric HR and pace targets
- run the existing metric resolver after AI draft parsing
- preserve fixed rest-day invariants
- preserve long-run-day preferences
- preserve taper/phase consistency
- preserve beginner/low-support caps
- preserve target-time honesty
- preserve active-plan refresh protected-history boundaries

If AI output is invalid:

- return a bounded generation error before persistence
- or fall back to the current deterministic generator only if that fallback is explicitly flagged in review assumptions
- never persist raw invalid AI output

## Seam Inventory To Update

These are the exact code seams that must converge on the rich canonical model.

### Authoring / Generation

- `src/lib/structured-plan-authoring.ts`
  - currently owns deterministic generation and many exact identities
  - must emit rich family/identity/icon/goal/metric fields
  - must remove remaining single-segment non-rest generated workouts

- `src/lib/openai-plan-authoring.ts`
  - currently asks OpenAI for structured authoring input, not rich workout JSON
  - future slice must add a separate rich draft call/schema after normalized authoring input, not replace validation
  - OpenAI must draft against `workoutFamily`, `workoutIdentity`, `calendarIconKey`, and rich segments

- `src/lib/voice-to-plan-authoring.ts`
  - must keep transcript review non-mutating
  - confirmed voice input should route into the same rich authoring seam
  - raw transcript must not become plan truth

- `src/lib/structured-first-plan-onboarding.ts`
  - structured draft review should receive canonical plan shape from the rich seam
  - no UI-only workout taxonomy should be added here

- `src/lib/active-plan-refresh-draft.ts`
  - refresh should use the rich seam for future mutable workouts
  - protected history must carry existing rich fields when present
  - old plans missing rich fields should derive compatibility values before review

- `src/lib/active-plan-refresh-actions.ts`
  - apply must persist only the exact reviewed rich draft
  - no OpenAI/regeneration during apply

### Import / Export / Persistence

- `src/lib/imported-plan.ts`
  - upgrade `training-plan-v2` schema to accept rich fields
  - preserve backward compatibility with `source_workout_type`
  - enforce mandatory warmup/main/cooldown for non-rest rich v2 workouts
  - reject unknown family/icon values

- `public/templates/hito-training-plan-v2-template.json`
  - update template to show rich workout fields
  - keep `_ml_agent_template` guidance aligned with this plan

- `src/lib/active-plan-persistence.ts`
  - write rich fields into `planned_workouts`
  - keep compatibility writes for `workout_type` and `source_workout_type`

- `src/lib/plan-apply-policy.ts`
  - preserve rich fields when carrying fixed/preserved workouts through refresh/import apply

- `src/lib/plan-export.ts`
  - export rich fields from active saved plans
  - keep old export shape only as compatibility where needed

- `src/lib/plan-authoring-snapshot.ts`
  - no raw comments/transcripts, but snapshot should retain enough authoring truth to regenerate rich workouts later

### Runtime Data / UI Rendering

- `src/lib/training.ts`
  - extend `Workout` shape with `workoutFamily`, `workoutIdentity`, `calendarIconKey`, `goalContext`, and `metricMode`
  - replace `resolveWorkoutVisibleType` title/step guessing with rich-field-first resolution
  - keep fallback inference only for old plans

- `src/lib/workout-glyph.ts`
  - add `steady`, `hills`, and `trail` glyph kinds
  - map from `calendar_icon_key` first
  - keep old `quality` only as fallback

- `src/components/WorkoutGlyph.tsx`
  - render new glyphs
  - preserve existing glyphs for old plans

- `src/components/Calendar.tsx`
  - render family/icon from canonical workout truth
  - no new regex guessing

- `src/routes/workout.$date.tsx`
  - detail should show exact identity/title/segments from backend truth
  - no route-local coaching copy invented from family

- `src/routes/hitoDS.tsx`
  - document expanded glyph/family set once product code supports it

### Feedback / Comparison / AI Interpretation

- `src/lib/workout-result-import/compare-workout-result.ts`
  - comparison should keep using canonical `steps`
  - richer family/identity should improve context but not change deterministic comparison authority

- `src/lib/workout-result-import/ingest-garmin-result.ts`
  - AI feedback context should include exact identity and rich steps when available

- `src/lib/workout-result-import/generate-workout-ai-insight.ts`
  - insight generation may use rich identity/context
  - it must not reinterpret workout family or mutate plan truth

### Scripts / QA

- `scripts/validate-plan-authoring-doctrine.ts`
  - add assertions for family/icon/identity and warmup/main/cooldown richness

- `scripts/author-structured-plan.mjs`
  - should emit/persist rich canonical plan truth once backend seam supports it

- `scripts/author-plan-from-text.ts`
  - now exercises the real TS OpenAI text path through `src/lib/openai-plan-authoring.ts`
  - defaults to deterministic no-rich-draft output and requires `--rich-draft` to validate the rich seam

- `scripts/author-plan-from-text.mjs`
  - remains only as a labeled historical fallback, not the canonical Slice 4A/4B validation path

- `docs/process/hito-plan-creation-qa-matrix.md`
  - should include rich family/icon/identity checks after implementation

## OpenAI JSON Touchpoints

OpenAI-related touchpoints must not create parallel plan outputs.

Current touchpoints:

- `src/lib/openai-plan-authoring.ts`
  - OpenAI text-to-plan currently returns `structured_plan_authoring_input`
  - this remains authoring intent extraction
  - new rich workout drafting should be a separate bounded schema after structured input validation

- `src/lib/voice-to-plan-authoring.ts`
  - transcript confirmation currently produces structured authoring truth
  - should call the same rich draft seam only after transcript sufficiency and review boundaries are met

- `src/lib/plan-refresh-proposal.ts`
  - OpenAI currently produces runner-facing refresh proposal prose
  - apply must still use exact backend draft from `active-plan-refresh-draft.ts`
  - future rich refresh should draft/normalize future workouts before proposal review, then apply exact reviewed draft

- `src/lib/workout-result-import/generate-workout-ai-insight.ts`
  - workout feedback AI can read rich workout context
  - it must never change workout identity, family, icon, targets, or segments

Required OpenAI rule:

AI may output `RichWorkoutDraft`. Backend must convert that into canonical `training-plan-v2`. AI must never output directly persisted `planned_workouts` rows.

## Migration Approach

### Phase 1: Backend canonical taxonomy and normalizer

Add the rich draft schema, canonical taxonomy helpers, compatibility mapping, and backend normalizer without changing visible product behavior.

Validate:

- valid AI-like drafts normalize to `training-plan-v2`
- unsupported HR/pace targets are stripped or rejected
- non-rest workouts require warmup/main/cooldown
- rest days remain sparse
- identity maps to family/icon
- old `source_workout_type` values still derive expected family/icon

### Phase 2: Persistence and import/export contract

Add nullable rich fields to persisted workout truth and wire:

- `imported-plan`
- active-plan persistence
- plan apply policy
- plan export
- template JSON

Keep backward compatibility for old plans.

### Phase 3: Structured authoring generation

Route structured first-plan generation through the rich canonical model.

This may still use deterministic generation first. OpenAI rich drafting can come after the backend normalizer exists.

The key requirement is that generated workouts produce:

- family
- identity
- icon
- rich segments
- goal context
- metric mode

### Phase 4: OpenAI rich drafting

Add AI rich draft generation after normalized authoring input.

Rules:

- one bounded schema
- backend validation
- no direct persistence
- no fake metrics
- deterministic fallback only with review disclosure

### Phase 5: Active-plan refresh parity

Active-plan refresh should regenerate only future mutable workouts through the same rich seam.

Preserve:

- exact reviewed draft
- stale proposal checks
- protected past/logged/Garmin/comparison/AI-backed history
- fixed rest days
- apply-without-regeneration rule

### Phase 6: Text and voice parity

Route text and voice confirmed authoring through the same rich seam.

Do not persist raw transcript or user free text as profile truth.

### Phase 7: Frontend rendering migration

Move UI from inferred visible type to canonical family/icon first.

Rules:

- calendar renders family/icon
- workout detail renders exact identity and canonical segments
- old plans keep compatibility fallback
- frontend does not invent coaching meaning

### Phase 8: QA fixture expansion

Expand plan creation QA matrix to cover:

- rich family/icon/identity truth
- every non-rest workout has warmup/main/cooldown
- support-run richness
- metric safety
- refresh preservation
- import/export compatibility

## Backend Responsibilities

- define canonical workout taxonomy
- define rich draft schema
- write the normalizer
- keep canonical persisted output as `training-plan-v2`
- add persistence fields only additively
- keep metric resolver authoritative
- enforce mandatory segment rules
- enforce safety/cap rules
- keep active-plan refresh apply exact and non-regenerating
- avoid frontend-owned coaching rules
- avoid direct AI-to-persistence paths

Likely files:

- `src/lib/structured-plan-authoring.ts`
- `src/lib/openai-plan-authoring.ts`
- `src/lib/voice-to-plan-authoring.ts`
- `src/lib/active-plan-refresh-draft.ts`
- `src/lib/active-plan-refresh-actions.ts`
- `src/lib/structured-first-plan-onboarding.ts`
- `src/lib/imported-plan.ts`
- `src/lib/active-plan-persistence.ts`
- `src/lib/plan-apply-policy.ts`
- `src/lib/plan-export.ts`
- `src/lib/plan-authoring-snapshot.ts`
- new `src/lib/rich-workout-taxonomy.ts`
- new `src/lib/rich-workout-draft-authoring.ts`
- new `src/lib/rich-workout-draft-normalizer.ts`
- `scripts/validate-plan-authoring-doctrine.ts`

## Frontend Responsibilities

Frontend should not own coaching logic.

Frontend will later need to:

- render compact family and icon from backend `workout_family` / `calendar_icon_key`
- render exact workout identity/title/summary in detail and review
- render richer warmup/main/cooldown detail already present in backend-shaped steps
- preserve compact calendar rhythm
- preserve old-plan fallback while backend migration rolls out
- avoid adding frontend-only coaching copy

Likely files:

- `src/lib/training.ts`
- `src/lib/workout-glyph.ts`
- `src/components/WorkoutGlyph.tsx`
- `src/components/Calendar.tsx`
- `src/routes/workout.$date.tsx`
- `src/routes/hitoDS.tsx`

No frontend implementation is required in the first backend slice unless existing rendering cannot load normalized rich fields safely.

## QA Matrix

Required fixture families:

- beginner build-consistency, 3 days/week, no watch, unknown benchmark
- regular 10K, 4 days/week, watch plus 5K benchmark
- balanced half marathon, 5 days/week, pace guidance
- marathon, 4 days/week, unknown benchmark
- low-frequency marathon, 2-3 days/week
- ultra, 4 days/week, no watch
- mountain running, fixed rest days, no benchmark
- mountain running, watch plus benchmark, mixed guidance
- active-plan refresh of old shallow plan
- JSON import with rich v2 fields
- JSON import missing rich fields but valid legacy v2
- heart-rate preference without HR-zone truth

Assertions:

- every non-rest running workout has warmup/main/cooldown
- easy/recovery/steady/long runs include intent and safe cues
- `workout_family` exists for new generated/imported workouts
- `workout_identity` exists for new generated/imported workouts
- `calendar_icon_key` exists and matches family
- old plans still render via compatibility fallback
- long-run variants appear across longer plans
- no fake HR targets
- no fake pace targets
- fixed rest days remain off
- beginner consistency plans stay conservative
- active-plan refresh preserves protected history
- review/confirm boundaries remain intact
- calendar uses family/icon truth after frontend migration
- workout detail renders exact segment truth without `[object Object]`

## Risks

- AI latency and cost may increase first-plan generation.
- Invalid AI output could reduce reliability if normalization is weak.
- Over-rich workouts could overwhelm beginners.
- Too much variety could become random novelty.
- Adding persisted fields without compatibility mapping could break old plans.
- Frontend may keep guessing semantics if rich fields are optional for too long.
- Fixture tests could overfit exact prose instead of stable coaching facts.
- DB enum migration could become risky if attempted too early; prefer additive rich fields first.

## What Not To Change

- Do not invent numeric HR without HR-zone truth.
- Do not invent numeric pace without watch/app plus benchmark support.
- Do not make every easy day a hidden quality day.
- Do not move coaching rules into frontend.
- Do not let AI persist final plan truth directly.
- Do not bypass review/confirm boundaries.
- Do not make `quality` the new canonical family.
- Do not delete legacy `workout_type` compatibility until old plans and DB constraints are migrated safely.
- Do not add medical diagnosis, rehab, or injury prediction behavior.

## Checklist

- [x] Define canonical workout taxonomy helper.
- [x] Define rich AI draft schema.
- [x] Add backend normalizer into canonical `training-plan-v2`.
- [x] Add compatibility mapping from identity/family to legacy `workout_type` and `source_workout_type`.
- [x] Enforce warmup/main/cooldown for non-rest running workouts.
- [x] Enforce metric safety stripping/rejection.
- [x] Add deterministic fixtures for valid and invalid drafts.
- [x] Upgrade `training-plan-v2` schema additively.
- [x] Add rich persisted workout fields.
- [x] Update import/export/template seams.
- [x] Route structured first-plan generation through the rich model.
- [x] Add OpenAI rich workout draft seam after structured input validation.
- [ ] Route active-plan refresh drafts through the same seam.
- [ ] Preserve text/voice parity through the same seam.
- [x] Move runtime/UI rendering to family/icon truth with old-plan fallback.
- [x] Move workout detail readback away from compact-type static coaching copy and onto backend-owned rich workout truth.
- [ ] Expand QA matrix for rich support runs and icon/family truth.

## Slice 1 Backend Contract Groundwork

Implemented and QA-green 2026-05-25:

- [x] Added `src/lib/rich-workout-model.ts` with canonical workout family, identity, calendar icon key, and metric-mode value contracts.
- [x] Added compatibility mapping from legacy `workout_type`, `source_workout_type`, titles, and emitted segment targets into rich workout fields.
- [x] Upgraded `training-plan-v2` workout schema additively to accept `workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, and `metric_mode`.
- [x] Structured generated plans now emit the additive rich fields while preserving compact `workout_type` and `source_workout_type`.
- [x] Runtime workout view models derive rich fields for old persisted plans without changing current calendar/detail rendering.
- [x] Rerun fix: compact-only legacy workouts without rich fields or `source_workout_type` now infer tempo, threshold, distance/time interval, progression, race/tune-up, hill, and generic quality identities from title/step semantics before falling back to `quality_session`.
- [x] Doctrine fixtures cover representative identity/family/icon/legacy mapping, compact-only title/step fallback, rest metric-mode semantics, and generated-plan rich-field presence.
- [ ] Import/export/template migration, AI rich draft schema/normalizer, and frontend rendering migration remain later slices.

## Slice 2A Additive Rich Persistence

Implemented 2026-05-25:

- [x] Added nullable `planned_workouts` columns for `workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, and `metric_mode`.
- [x] Updated local Supabase database types to expose the additive rich workout columns.
- [x] New generated/imported saved workouts now persist rich workout family, identity, calendar icon, goal context, and metric mode while continuing to write legacy `workout_type` and `source_workout_type`.
- [x] Saved-mode workout readback now prefers stored rich fields and falls back to Slice 1 compatibility derivation for old compact rows.
- [x] Preserved fixed/protected workout carry-forward uses one backend helper that keeps stored rich fields during import first-day preservation and active-plan refresh apply.
- [x] Doctrine fixtures cover rich insert row persistence, saved-workout readback, old compact-only fallback, and fixed/protected carry-forward preservation.
- [ ] UI rendering migration and OpenAI rich drafting remain later slices.

## Slice 2B Import Export Template Compatibility

Implemented 2026-05-25:

- [x] JSON export now includes `source_workout_type`, `workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, and `metric_mode` for saved workouts.
- [x] Markdown export adds a compact `Focus` line with backend-owned family and exact identity where useful without changing calendar/workout UI rendering.
- [x] Rich exported `training-plan-v2` JSON validates through the existing import schema and re-imports into saved rows with rich fields preserved.
- [x] Compact-only older `training-plan-v2` files without rich fields still import through Slice 1 compatibility derivation.
- [x] The downloadable `hito-training-plan-v2-template.json` now demonstrates the rich workout contract and metric-safety guidance without fake pace or HR targets.
- [x] Doctrine fixtures cover JSON export/import roundtrip, Markdown focus copy, template validation, and compact-only legacy import fallback.
- [x] Slice 3A frontend rendering migration now prefers backend-owned family/icon truth for calendar/glyph identity.
- [ ] OpenAI rich drafting remains a later slice.

## Slice 3A Rich Calendar / Glyph Rendering Adoption

Implemented 2026-05-25:

- [x] `workoutTypeMeta` now resolves visible calendar identity from `calendarIconKey` first, then `workoutFamily`, before falling back to legacy `sourceWorkoutType`, compact `workout_type`, title, and step inference.
- [x] Shared workout glyph resolution now follows the same rich-first visible identity path so labels and glyphs agree.
- [x] Added canonical `steady`, `hills`, and `trail` glyph kinds while keeping `quality` as a legacy fallback glyph.
- [x] Calendar month/week/tooltips keep the same compact layout and now show Steady, Hills, and Trail labels/glyphs when backend rich truth supplies those families.
- [x] `/hitoDS` calendar identity examples document the expanded glyph set.
- [x] No backend generation, persistence, import/export, OpenAI, or metric-safety behavior was changed.

## Slice 3B Workout Detail Rich-Truth Rendering Cleanup

Implemented 2026-05-25:

- [x] Workout detail now surfaces backend-owned family, exact identity, calendar icon, metric mode, and goal context in the existing right-side readback column.
- [x] The overview now renders segment `guidance`, target `cue`, and target `hint` from canonical workout steps instead of route-local generic HR, cadence, fueling, or objective advice.
- [x] Old compact-only workouts keep a safe sparse fallback when no segment guidance/cue/hint exists.
- [x] Rest-day detail remains sparse and only shows a real rest assignment when one exists.
- [x] No backend generation, persistence, import/export, OpenAI, Garmin comparison, or active-plan refresh behavior was changed.

## Slice 3C Disposable Saved-Mode Rich Workout QA Fixture

Implemented 2026-05-25:

- [x] Added `scripts/fixtures/rich-workout-saved-mode-fixture.json`, a local/test-only `training-plan-v2` fixture with stored rich `steady`, `hills`, and `trail` rows plus one compact-only legacy fallback row.
- [x] Extended the existing `npm run test-user -- create ... --plan ...` path so script-seeded workouts can persist `workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, and `metric_mode` without changing product UI or OpenAI authoring.
- [x] Fixture account for QA: username `qa-rich-workout`, email `qa-rich-workout@local.test`, password `qa-rich-workout-pass-20260525`.
- [x] Seed/reset command: `npm run test-user -- create --username qa-rich-workout --email qa-rich-workout@local.test --password qa-rich-workout-pass-20260525 --display-name "Rich Workout QA" --plan scripts/fixtures/rich-workout-saved-mode-fixture.json`.
- [x] Cleanup command: `npm run test-user -- delete --email qa-rich-workout@local.test --confirm-email qa-rich-workout@local.test`.
- [x] Doctrine validation now checks the fixture contract, stored-rich representative rows, compact fallback derivation, segment guidance/cue/hint density, and absence of fake pace/HR/cadence truth.
- [x] No production data, frontend UI, OpenAI/text/voice authoring, or active-plan refresh behavior was changed.

## Slice 4A OpenAI Rich Draft Seam For Text Authoring

Implemented 2026-05-25:

- [x] Added `src/lib/rich-workout-draft-authoring.ts` with the bounded `rich-workout-draft-v1` schema and backend normalizer.
- [x] Text authoring now keeps the first OpenAI structured-intent extraction call, validates that output, builds the deterministic canonical skeleton, then the saved-mode text replacement action explicitly opts into a separate rich workout draft.
- [x] `generateCanonicalPlanFromText` is deterministic by default; callers must pass `enableRichWorkoutDraft: true` to reach the rich draft seam.
- [x] The normalizer validates rich workout family, identity, calendar icon, goal context, metric mode, workout ids/dates, and fixed rest/rest-day boundaries before returning canonical `training-plan-v2`.
- [x] Non-rest rich drafts must include warmup, main-equivalent work, and cooldown; malformed single-segment non-rest drafts fall back to the deterministic structured generator.
- [x] AI-proposed numeric HR and pace fields are not trusted directly; safe numeric target truth can only survive from the deterministic canonical skeleton when metric gates already allow it.
- [x] Rich draft failure is exposed as bounded deterministic-fallback metadata/review assumptions and does not persist raw AI draft rows.
- [x] This slice is text-authoring only; voice-to-plan explicitly disables rich drafts and active-plan refresh, frontend rendering, schema, and mutation boundaries were not changed.
- [x] Doctrine fixtures cover valid AI-like rich draft normalization, fake HR/pace stripping, malformed single-segment fallback, opt-in text behavior, default deterministic behavior, voice deterministic consistency, and generated canonical rich fields/segments.

## Slice 4B Text Authoring Ops Smoke Path

Implemented 2026-05-25:

- [x] Added `scripts/author-plan-from-text.ts` as the canonical TS-backed ops entrypoint for text authoring smoke and persistence.
- [x] Updated `npm run author-plan-from-text` to call the TS entrypoint through `tsx` so it exercises `src/lib/openai-plan-authoring.ts` instead of the legacy MJS shim.
- [x] Added explicit `--rich-draft` opt-in; without it, the ops path reports deterministic `richDraftStatus: "not_requested"`.
- [x] Added `--dry-run`, `--mock-openai`, and `--timeout-ms` options for bounded non-persistent and live-smoke validation.
- [x] Ops output reports bounded metadata: rich draft status, fallback status/reason, workout count, sample workout family, sample identity, sample icon key, and warmup/main/cooldown segment presence.
- [x] Persistence mode reuses `applyImportedPlanForUser` plus bounded plan-scoped authoring metadata instead of manually duplicating active-plan replacement writes.
- [x] The legacy `scripts/author-plan-from-text.mjs` file is labeled as historical fallback only and is not the canonical rich-draft validation path.
- [x] No voice-to-plan, active-plan refresh, DB schema, UI rendering, raw AI draft persistence, or metric safety behavior changed.

## Slice 4D Active-Plan Refresh Proposal Rich Draft Normalization

Implemented 2026-05-25:

- [x] Refresh proposals now build the exact deterministic future refresh draft first, then optionally request an OpenAI rich workout draft for that mutable schedule before runner review.
- [x] Live refresh proposal generation is bounded: if the initial OpenAI proposal step times out before rich drafting can start, the backend returns deterministic proposal copy plus a signed deterministic refresh draft with `refresh_proposal_timed_out` fallback metadata.
- [x] Rich refresh drafts are normalized through `src/lib/rich-workout-draft-authoring.ts`, re-anchored to deterministic workout ids/dates/rest days, and re-signed into the reviewed `active-plan-refresh-draft-v1` payload.
- [x] The refresh draft exposes bounded `richWorkoutDraftMetadata` with applied, not-requested, or deterministic-fallback status; malformed, unavailable, or timed-out rich drafts keep the deterministic draft and expose fallback metadata.
- [x] Apply still parses the reviewed draft, verifies checksum/fingerprint, checks protected-history guards, and persists only that exact canonical plan; apply does not call OpenAI or regenerate workouts.
- [x] Fixed rest days, pace/HR metric gates, protected past/logged/evidence-backed rows, and no-raw-AI-draft persistence boundaries remain unchanged.
- [x] Doctrine fixtures cover deterministic no-rich refresh, normalized rich refresh, malformed fallback, simulated proposal/rich-draft timeout fallback, protected guard preservation, and source-level apply no-generation behavior.

## Exit Criteria

- Plans feel coach-authored across easy, recovery, steady, long, and quality sessions.
- Every non-rest running workout has meaningful warmup/main/cooldown structure.
- Calendar renders from explicit family/icon truth, not guessed title regex.
- Workout detail renders exact identity and canonical segments.
- Exact workout identity survives create, import, export, refresh, saved-mode rendering, and feedback context.
- Long runs vary by phase and goal.
- AI richness never becomes fake metric precision.
- Backend normalizer remains the only path to persisted canonical plan truth.
- Structured creation and active-plan refresh preserve explicit review/confirm safety.
- QA fixtures prove richer support runs without metric-safety regression.

## Next Recommended Role

None.

## Suggested Next Step

No immediate implementation or QA slice is recommended.

Only reopen this track if product explicitly reopens Voice rich drafting, a concrete bug appears in rich workout persistence/rendering, or release validation needs a live `rich_draft_applied` refresh observation beyond the accepted bounded fallback smoke.
