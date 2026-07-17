# Plan Creation Data Inventory

Last updated: 2026-07-14

## Purpose

This guide is a product-owner reference for the data Hito needs to create a safe, useful running
plan. It separates current implementation truth from the target distance-first plan contract.

Related guide: [Plan Creation Data Policy](./plan-creation-data-policy.md).

## Current Plan Creation Pipeline

Current generated-plan creation flows through these source-of-truth seams:

1. User setup or Quick setup collects goal, schedule, profile, availability, constraints, and
   preferences.
2. `PlanGoalIntent` normalizes selected distance, target date, target finish time, target outcome
   pace, feasibility, assumptions, and metric truth policy.
3. Structured authoring input normalizes runner context and availability.
4. The AI provider or local fixture authors one `hito_ai_authored_full_plan_draft` under the
   `ai_authored_plan_first_v1` source contract.
5. The backend `plan_first` service parses and compiles that full draft through
   `ai-authored-plan-first-compiler.ts` into canonical `training-plan-v2` calendar/workout truth.
6. `first-plan-actions.ts` signs the reviewed canonical draft; confirmation persists that exact
   reviewed plan through `active-plan-persistence` without calling AI again.

## Target Direction: Distance-First Plan Contract

Target product direction:

- Goal cards are shortcuts into exact distance truth, not separate plan programs.
- Canonical goal truth is `distanceMeters` / `distanceKm`, target date or horizon, target time
  intent, runner context, availability, constraints, and benchmark confidence.
- Coaching policies may derive from distance and runner context, but legacy values such as
  `half_marathon`, `marathon`, or `distance_build` should not remain canonical generated-plan truth.

## Data Inventory By Importance

| Data | Importance | Current source | User-entered? | AI-authored? | Backend-derived/defaulted? | Current runtime owner | Notes / risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Selected distance meters/km | Critical | Quick setup card, custom distance, `PlanGoalIntent.distance` | Yes | No | Backend normalizes presets/custom distance | `plan-goal-intent.ts` | Target direction is distance-first; current code still maps some legacy goal types into preset distances. |
| Goal card/label | Medium | UI setup card / structured `goal.goalLabel` | Yes | No | May be normalized for display | `structured-plan-authoring-schema.ts` | Runner-facing label should not become canonical plan family truth. |
| Target date or horizon weeks | Critical | `schedule.targetDate` or `preparationHorizonWeeks` | Yes | No | Backend computes horizon/end date | `structured-plan-authoring-schema.ts`, date-grid | Current schema requires one of the two. |
| Target finish time | Optional | `goal.targetTime` / `PlanGoalIntent.targetFinishTime` | Optional | No | Backend derives outcome pace for review only | `plan-goal-intent.ts` | Must not create executable workout pace by itself. |
| Target outcome pace | Optional | `PlanGoalIntent.targetOutcomePace` | Optional | No | Backend may derive from finish time and distance | `plan-goal-intent.ts` | Review/goal truth only, not segment pace truth. |
| Runner experience level | Critical | `runnerProfile.experienceLevel` | Yes | No | No | `structured-plan-authoring-schema.ts` | Main safety and progression input. |
| Age | Critical | `runnerProfile.age` in current generated schema; onboarding/profile docs say required | Yes | No | Backend may derive age/load risk band | `structured-plan-authoring-schema.ts` | Should become mandatory for generated plans. |
| Height | Critical target, current mismatch | Onboarding/profile docs mention required | Yes | No | Backend may derive weight-height context | Product/UI/profile path | Current generated structured schema does not directly consume height. |
| Weight | Critical target, current mismatch | Onboarding/profile docs mention required | Yes | No | Backend may derive weight-height context | Product/UI/profile path | Current generated structured schema does not directly consume weight. |
| Baseline sessions per week | Critical | `runnerProfile.baselineSessionsPerWeek` | Yes | No | No | `structured-plan-authoring-schema.ts` | Core load-capacity input. |
| Baseline long run km or duration | Critical | `baselineLongRunKm` or `baselineLongRunDurationMin` | Yes | No | No | `structured-plan-authoring-schema.ts` | Current schema requires at least one. |
| Recent race / benchmark status | High | `currentLevel.recentRaceResults`, benchmark setup | Yes, including explicit no benchmark | No | Backend maps confidence/assumptions | `structured-plan-authoring-schema.ts`, validators | Missing benchmark should allow conservative effort/RPE plans, not fake pace. |
| Recent 5K pace | High | `currentLevel.recent5kPaceSecondsPerKm` | Optional | No | No | `structured-plan-authoring-schema.ts` | Can unlock safer pace guidance only when trustworthy and execution mode supports it. |
| Current easy pace range | Medium | `currentLevel.currentEasyPaceRange` | Optional | No | No | `structured-plan-authoring-schema.ts` | Useful context, not proof for race pace or HR. |
| Current training load summary | High | `currentLevel.currentTrainingLoadSummary` | Optional but recommended | No | Backend may derive baseline capacity when structured enough | `structured-plan-authoring-schema.ts` | Needed for better weekly-load progression, but currently text-shaped. |
| Preferred running days | Critical | `availability.preferredRunningDays` | Yes | No | Backend computes running dates | `structured-plan-authoring-schema.ts`, date-grid | Date-grid allows workouts only on these days unless endpoint override applies. |
| Unavailable / fixed rest days | Critical | `availability.unavailableDays` | Yes | No | Backend builds fixed rest dates | `structured-plan-authoring-schema.ts`, date-grid | Must be respected; AI output on these days rejects before review. |
| Max running days per week | Critical | `availability.maxRunningDaysPerWeek` | Yes | No | Backend derives weekly workout count and hard-day budget | `structured-plan-authoring-schema.ts`, date-grid | Key limiter for load and hard-day density. |
| Preferred long run day | Medium | `availability.preferredLongRunDay` | Optional | No | Backend may choose fallback long-run day | `structured-plan-authoring.ts`, date-grid | Should remain preference, not unsafe override. |
| Back-to-back policy | High | `availability.allowBackToBackDays` | Yes/explicit default | No | Backend can enforce spacing | `structured-plan-authoring-schema.ts` | Important for injury/load safety. |
| Injury constraints | Critical | `constraints.injuryConstraints` or explicit none/unknown | Yes | No | Backend derives conservative assumptions | `structured-plan-authoring-schema.ts` | AI must not invent injuries or medical status. |
| Hard constraints | Critical | `constraints.hardConstraints` | Yes/optional explicit none | No | Backend validates plan feasibility | `structured-plan-authoring-schema.ts` | Examples: no hills, travel, equipment, medical restrictions. |
| Terrain focus | Medium | `preferences.terrainFocus` | Optional | AI may reflect terrain in plan after user/backend context | Backend defaults to standard | `structured-plan-authoring-schema.ts` | Mountain/terrain plans need separate safety doctrine. |
| Workout mix preference | Medium | `preferences.preferredWorkoutMix` | Optional | AI may author within allowed policy | Backend defaults/validates | `structured-plan-authoring-schema.ts` | Must not override safety/load caps. |
| Strength/mobility interest | Optional | `preferences.strengthOrMobilityInterest` | Optional | AI may create cues/guidance, not unsupported workout truth | Backend validates structure | `structured-plan-authoring-schema.ts`, Atom Compiler | Current live-provider failures showed support concepts need clear note/cue handling. |
| Watch access / guidance preference | High | `execution.watchAccess`, `execution.guidancePreference` | Yes/defaulted | No | Backend derives metric mode | `structured-plan-authoring-schema.ts` | Pace/HR targets need real truth plus execution support. |
| AI-authored phases/weeks/workouts | Critical output | Provider/local fixture `hito_ai_authored_full_plan_draft` | No | Yes | Backend parses/validates/compiles | `ai-first-plan-draft-service.ts`, `ai-authored-plan-first-compiler.ts` | Source kind is `ai_authored_plan_first_v1`; the draft remains untrusted and non-persisted until review/confirm. |
| AI-authored steps/repeats | Critical output | Plan-first `weeks[].<weekday>.steps[]` and `blocks[]` | No | Yes | Backend compiles canonical workout/repeat structure | `ai-authored-plan-first-compiler.ts` | AI authors the workout structure; backend rejects structures it cannot safely display or persist. |
| Calendar date placement | Critical derived | AI week/day dates plus runner schedule/rest-day truth | Schedule | Draft dates | Backend validates and fills omitted dates | `ai-authored-plan-first-compiler.ts` | Weekday/date contradictions and fixed-rest-day violations block review. |
| Endpoint date | Critical derived | Runner target date or AI draft `metadata.target_date` | Optional | Optional | Backend compiles/validates | `ai-authored-plan-first-compiler.ts` | Reviewed calendar/readback preserves the compiled endpoint truth. |
| Hard-day density and progression | Critical coaching output | AI-authored workout mix and progression | No | Yes | Backend does not rebuild coaching shape | `ai-authored-plan-first-compiler.ts`, doctrine validators | Backend enforces hard safety/display/persistence boundaries without replacing the AI-authored plan. |
| Feasibility status | Critical derived | Distance, horizon, target pace/time | No | No | Yes | `plan-goal-intent.ts` | Current feasibility is limited and needs policy hardening. |
| Review token / checksum | Critical safety | Reviewed canonical plan | No | No | Backend signs/validates | review/confirm seams | Confirm must persist reviewed canonical truth only. |
| Legacy `goalType` | Legacy | `goal.goalType` enum | Currently yes | No | Backend maps some values | `structured-plan-authoring-schema.ts` and policies | Cleanup target. Should be replaced by distance-first contract plus derived policy. |
| Legacy distance family labels | Legacy | `distanceFamily`, `Half Marathon`, `Marathon Completion` | No | No | Derived/mapped in places | plan-creation engine policies | Keep only as derived coaching/readback labels if needed. |

## Required vs Optional vs Derived vs Legacy

Critical user-entered data should block plan creation if missing. Recommended data should improve
specificity but must not be invented. Derived data should be visible as assumptions where it affects
the plan. Legacy data should either be removed or isolated behind a narrow import/decode boundary.

## What AI May Author

AI may author:

- phase structure;
- week themes and microcycle intent;
- dated workouts on allowed dates;
- workout identity, title, summary, RPE, fatigue, recovery priority, and metric intent;
- ordered sections and one-level repeat children;
- cues, guidance, and conservative assumptions.

AI may not author canonical runner facts or persistence truth.

## What Backend Must Validate Or Derive

Backend must own:

- selected distance normalization;
- feasibility and assumptions;
- date grid and fixed rest-day enforcement;
- endpoint date and endpoint distance;
- hard safety, display, and persistence boundaries without rebuilding the AI-authored workout mix;
- repeat grammar;
- metric truth policy;
- review token/checksum;
- confirm-time exactness and persistence.

## Current Mismatches / Cleanup Candidates

- Current product direction is distance-first, but `structuredPlanAuthoringInputSchema.goal.goalType`
  still contains legacy family values.
- `PlanGoalIntent` already normalizes exact distance, but old `goalType` mapping still feeds it.
- Current review/readback metadata is already closer to distance-first through distance-goal truth,
  but some authoring and validation paths still use family-routing inputs.
- Height and weight are described in product/current docs as required onboarding/profile values, but
  the current generated structured schema does not directly consume them.
- The generated-plan request DTO carries age, height, and weight, while
  `structured-plan-authoring-schema.ts` currently carries only `age` into the provider-facing
  runner profile. That split must be reconciled before runtime can enforce this guide consistently.
- Race-family labels and policies still appear across generated-plan validators and coaching
  helpers. They should become derived policy from distance and runner context, not canonical input.
- Plan-first compilation validates dated structure and fixed rest days, while remaining
  selected-distance/race-week doctrine should derive from normalized distance intent rather than
  legacy `goal.goalType` routing.

## Open Product Decisions

- Should missing age/height/weight block plan creation, or allow only an explicit conservative
  unknown path?
- What exact weight-height context should Hito use: BMI band, weight band, or a more neutral
  load-risk band?
- Which fields can be defaulted by UI, and which require explicit runner confirmation?
- What is the first supported safety/load modifier algorithm for v1?
- How should legacy imported/generated plans with old goal-family truth be decoded after the
  distance-first migration?
