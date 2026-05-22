# Plan Authoring Quality Refinement

## Status

Active - architecture plan ready for backend implementation

## Owner

Architect / Backend / Frontend / QA

## Last Updated

2026-05-22

## Context

Hito already has a structured first-plan constructor, a deterministic `training-plan-v2` generator, benchmark-derived `pace_min_per_km_range` support, terrain-aware hill guidance, and a proven voice-to-plan review-before-confirm pattern.

The next refinement is not a broad redesign and not only a prompt tune. It is a bounded plan-authoring quality slice that makes generated plans feel more like real running coaching:

- clearer training doctrine
- more specific workout identities
- better workout diversity
- safer metric-target rules
- richer structure for quality, long, hill, and tempo sessions
- non-mutating structured review before first-plan creation
- QA fixtures that catch generic or fake-precise plans

Current weak spots:

- structured onboarding creates a plan immediately instead of showing a review first
- too many generated workouts can still look like broad families rather than exact sessions
- pace targets can appear whenever benchmark truth exists, without enough explicit execution-mode policy
- HR target support must remain compatible with future HR zone truth without inventing numbers now
- long-run and quality-session variation needs a clearer doctrine so repetition is intentional, not accidental

## Problem Definition

The runner should not receive a plan that feels like a repetitive template. Hito should generate a coherent training block with visible coaching intent, but it must not fake precision.

The plan-authoring system must distinguish:

- what Hito knows from structured runner input
- what Hito may infer conservatively
- what Hito must leave as effort-language because exact pace or HR truth is missing
- what the runner should review before the plan becomes active

## Training Doctrine

Hito should encode a small, explicit running doctrine in the authoring layer.

Plans progress through simple phases:

- `Base`: establish repeatable running frequency, easy volume, long-run habit, and conservative quality exposure.
- `Build`: progress long run and introduce more specific tempo, interval, hill, or progression work.
- `Specific`: bias quality and long-run structure toward the goal distance, target style, and terrain context.
- `Taper / Peak`: reduce fatigue while preserving rhythm and some specificity near target races.

If the horizon is short, phases compress rather than pretending there is time for a full macrocycle.

Weekly structure should follow these rules:

- most running stays easy or steady aerobic
- long run appears weekly unless the plan is too short or deliberately cut back
- quality load depends on running days, current level, and ambition
- beginners or cautious plans get at most one quality stimulus per week
- ambitious plans may include two stressors only when frequency and spacing support recovery
- fixed rest days always override simple sequence logic
- recovery/cutback weeks appear roughly every 3-4 weeks, with lower long-run load and simpler quality

Ambition should change load and specificity:

- `Relaxed`: lower volume growth, fewer hard sessions, more easy/recovery language.
- `Balanced`: one main quality session plus long run, with moderate progression.
- `Ambitious`: stronger race-specific structure, more variation, and careful stress spacing.
- `Target time`: most specific only when benchmark truth supports it; otherwise the review must say what is missing.

## Variability Policy

Acceptable repetition:

- recurring easy runs, recovery runs, and weekly long-run rhythm
- repeated workout families inside a purposeful block when the stimulus progresses
- repeated rest days from fixed weekday preferences

Unacceptable repetition:

- consecutive quality sessions with the same title, same structure, and same target unless explicitly part of a progression
- many workouts labeled only as `Quality`
- every long run as one flat block in longer plans
- pace or HR targets repeated mechanically across workout types without reflecting purpose

Session rotation rules:

- rotate tempo, intervals, hills, steady/progression, and race-specific sessions by phase and goal
- avoid the same quality subtype more than two times in a row
- hills appear for mountain/rolling terrain goals, strength-building phases, or explicit runner context
- progression runs appear mainly in build/specific phases, not as filler every week
- cutback weeks simplify structure rather than stacking novelty

Monotony prevention should be deterministic enough to test. The generator should produce a plan-shape summary that QA can inspect for:

- quality subtype counts
- long-run progression
- cutback weeks
- exact workout title diversity
- absence of fake precision

## Workout-Type Specificity Model

Hito should separate compact display family from exact workout identity.

Compact family is for calendar and dense surfaces:

- `easy`
- `recovery`
- `steady_or_easy`
- `long_run`
- `tempo`
- `quality`
- `race`
- `rest`

Exact workout identity is for review, workout detail, export, and generation:

- `Easy aerobic run`
- `Recovery jog`
- `Steady aerobic run`
- `Progression run`
- `Long aerobic run`
- `Long run with steady finish`
- `Controlled tempo session`
- `Tempo intervals`
- `Distance intervals`
- `Time intervals`
- `Uphill repeats`
- `Rolling hills session`
- `Climbing steady run`

Policy:

- `workout_type` may remain broad for compatibility.
- `source_workout_type`, title, summary, and segments must carry the precise coaching identity.
- Generated interval and hill sessions must not surface to the runner as generic `Quality` only.
- Existing rendering should continue to work, but detail/review surfaces should prefer exact title and segment structure.

## Metric-Mode Decision Table

Hito must choose metric targets from available truth and runner execution preference.

| Input truth | Allowed output | Required behavior |
| --- | --- | --- |
| No watch/app, no benchmark, no HR zones | Effort-language only | Use RPE/cues. Do not emit `pace_min_per_km_range` or `hr_bpm_range`. |
| No watch/app, benchmark exists | Effort-language first | Benchmark may inform load internally, but no precise pace target unless runner says they can follow pace. |
| Watch/app available, no benchmark, no HR zones | Effort-language plus distance/time | Do not invent pace or HR. Review should say targets are effort-based for now. |
| Watch/app available, recent 5K benchmark exists, pace-guided preference | Pace targets | Emit broad `pace_min_per_km_range` where trustworthy. Keep ranges conservative and workout-specific. |
| HR zone truth exists, HR-guided preference | HR targets | Emit `hr_bpm_range` only from real runner-level HR zone truth. |
| Benchmark and HR zone truth both exist, mixed preference | Pace and/or HR | Prefer pace for interval/tempo specificity and HR for easy/long/recovery where useful. Do not overload every segment. |
| HR preference exists but no HR zone truth | No numeric HR | Use effort-language and review copy explaining HR targets can appear after zones are set. |

Canonical target fields stay:

- `pace_min_per_km_range`
- `hr_bpm_range`

No new metric target field should be introduced in this slice.

## Workout Structure Defaults

Single-block by default:

- recovery run
- easy aerobic run
- steady aerobic run
- simple rest / mobility support

Multi-block by default:

- tempo session: warmup / tempo block / cooldown
- tempo intervals: warmup / repeated tempo blocks with recoveries / cooldown
- interval session: warmup / reps / recoveries / cooldown
- hill repeats: warmup / uphill reps / downhill or easy recoveries / cooldown

Long runs:

- relaxed or early-base long runs may remain one aerobic block
- build/specific long runs may include a late steady finish when runner level and goal justify it
- cutback long runs should simplify and reduce load
- mountain/rolling long runs may mention terrain exposure but must not invent exact elevation gain

Hill work:

- use explicit rep logic for hill repeats
- use steady climbing exposure for mountain or rolling endurance context
- pace targets on hills must be conservative or omitted when terrain makes pace misleading

## Structured Onboarding Expansion

Add only the minimum runner input needed for safer metric specificity.

Recommended new structured fields:

- `execution.watchAccess: "none" | "watch_or_app" | "unknown"`
- `execution.guidancePreference: "effort" | "pace" | "heart_rate" | "mixed"`

UX framing:

- label this as “How will you follow workouts?”
- keep it compact and optional-looking, but backend should default safely when omitted
- do not ask for HR zones in this slice
- do not add device-brand setup here
- do not turn onboarding into a medical or settings questionnaire

Backend defaults:

- omitted `watchAccess` defaults to `unknown`
- omitted `guidancePreference` defaults to `effort`
- if runner chooses HR but no HR zone truth exists, generate effort-based plan and explain the limitation in review

Persistence policy:

- this slice may use execution fields as generation context only
- persist only if an existing settings/profile field cleanly owns the preference
- do not add noisy permanent profile truth unless the backend implementation plan explicitly adds a small schema field

## Review-Before-Create Flow

Structured onboarding should follow the proven voice-to-plan safety pattern.

New canonical flow:

1. Runner fills structured constructor.
2. Frontend submits to a non-mutating review action.
3. Backend validates input, builds authoring input, generates canonical draft plan, and returns review data.
4. Runner sees what Hito understood and what will be created.
5. Runner chooses:
   - `Yes, create plan`
   - `Back and edit`
6. Only the confirm action persists the active plan.

Review must show:

- profile basics Hito used
- benchmark or “no benchmark”
- goal distance/style
- target time/date if relevant
- terrain focus if relevant
- fixed rest days and running days per week
- execution mode and metric target policy
- estimated horizon
- rough workout count
- broad workout mix
- long-run day and quality rhythm when known
- key assumptions
- explicit safety copy that nothing has been created yet

Backend contract should mirror the voice pattern:

- `generateStructuredFirstPlanDraft`
- `confirmStructuredFirstPlanDraft`

The current `completeStructuredFirstPlanOnboarding` may remain as a temporary compatibility wrapper, but visible onboarding should move to review/confirm.

## Backend Responsibilities

Backend owns:

- structured contract validation
- execution preference parsing
- metric-mode decision
- plan doctrine and variability rules
- deterministic plan generation
- draft review payload
- confirm-time revalidation
- active-plan persistence
- no-active-plan safety check

Backend must not:

- let the client invent schedule logic
- let the client decide whether numeric pace/HR targets are allowed
- persist the plan from review alone
- emit precise HR targets without real HR zone truth
- create a second planner for structured review

Recommended backend implementation order:

1. Add execution-mode fields to structured onboarding parsing and authoring input.
2. Add a metric-mode resolver used by segment target builders.
3. Refine authoring doctrine and workout rotation rules in the existing structured generator.
4. Add structured draft/review action and confirm action, reusing voice-to-plan safety semantics.
5. Keep `completeStructuredFirstPlanOnboarding` only as temporary compatibility or test helper until frontend migrates.

## Frontend Responsibilities

Frontend owns:

- compact execution-preference controls in the constructor
- submit-to-review instead of submit-to-create
- review panel/state for the structured path
- `Yes, create plan` confirm action
- `Back and edit` return path
- rendering review assumptions without implying the plan is already active

Frontend must not:

- calculate pace/HR permissions
- generate workout mix summaries independently from backend truth
- duplicate the plan generator
- hide backend warnings about missing benchmark or HR truth

## QA Expectations

QA should use a fixed validation dataset, not only one happy path.

Minimum fixtures:

- beginner, no watch, unknown benchmark, build consistency
- watch/app, recent 5K time, balanced 10K
- watch/app, recent 5K pace, target-time half marathon
- no watch, recent 5K benchmark, relaxed 5K
- mountain-running goal with fixed Wednesday/Sunday rest days
- marathon or ultra with rolling/mountain terrain
- HR-guided preference without HR zone truth
- future mocked HR-zone truth if available behind backend test seam

Expected checks:

- review appears before active plan creation
- `Back and edit` leaves no active plan
- `Yes, create plan` persists exactly one active plan
- pace targets appear only when metric mode allows them
- HR targets do not appear without real HR truth
- interval and tempo workouts include warmup/main/cooldown structure
- hill workouts include explicit hill logic when terrain supports it
- long runs progress and cut back
- quality sessions are not all generic clones
- fixed rest days remain untouched
- calendar remains compact while detail/review uses exact workout identity

## Reference Strategy

Do not encode “AI should know running better” as vague prompt language.

Translate coaching references into explicit generation rules:

- progressive overload: gradual long-run and workload growth, not weekly jumps
- intensity distribution: majority easy, limited hard sessions
- stress/recovery spacing: quality and long run should not crowd fixed rest constraints
- cutback rhythm: lower load every 3-4 weeks for longer plans
- specificity: workouts become more goal- and terrain-specific closer to the target
- long-run progression: volume growth, cutbacks, and occasional steady finish for appropriate runners
- hill specificity: hills for mountain/rolling/strength context, not decorative text
- metric truthfulness: exact pace/HR only from usable runner truth

Prompt changes may support these rules, but the rules must live as product and generation policy first.

## Rendering Implications

No major UI redesign is required.

Required rendering implications:

- compact calendar can keep broad family/glyph behavior
- workout detail should prefer exact title, source workout type, and segment labels
- structured review should summarize plan shape before creation
- existing `pace_min_per_km_range` and `hr_bpm_range` readback should remain canonical
- avoid adding dense technical detail to compact surfaces

## Risks

- More specific generation can become verbose if every workout receives too many segments.
- Review-before-create adds one extra state to onboarding and must not feel like friction.
- Pace targets can look authoritative even when benchmark truth is weak.
- HR preferences may confuse runners if no HR zone truth exists yet.
- Over-refining the generator could make the system harder to reason about if not paired with QA fixtures.

## Exit Criteria

- Structured onboarding uses a non-mutating review before persistence.
- Confirm is the only structured first-plan mutation path in the visible UI.
- Generated plans show clearer workout identity and less generic `Quality` repetition.
- Metric targets follow the metric-mode decision table.
- HR targets remain absent unless real HR zone truth exists.
- Pace targets remain tied to watch/app plus benchmark-supported execution mode.
- QA fixtures verify diversity, structure, cutbacks, metric safety, and fixed-rest-day invariants.

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement the backend slice first: add execution-mode input fields, create the metric-mode resolver, refine structured generator doctrine/rotation rules, and add non-mutating structured draft plus explicit confirm actions before frontend changes the constructor flow.

