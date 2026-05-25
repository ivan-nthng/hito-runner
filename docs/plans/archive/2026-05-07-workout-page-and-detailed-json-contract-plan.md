Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-07

## Context

The current product already has three relevant implemented seams:

- `src/routes/workout.$date.tsx` preserves the imported workout-detail page structure with three main areas:
  main workout content
  tabbed surface with `Overview`, `Log result`, and `Preview state`
  right-side context stack with `Targets`, `Workout note`, `Week status`, and preview boundary messaging
- `src/components/CompletionPanel.tsx` already defines the canonical saved result outcomes for non-rest workouts:
  `completed`
  `partial`
  `skipped`
- `src/components/OnboardingGate.tsx` already exposes the current JSON-first upload surface and currently validates only the shallow source shape:
  `plan_name`
  `generated_for`
  `start_date`
  `week_1_preview[]`

The current visible imported JSON example at `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json` is the concrete starting point for this plan. That file currently contains:

- `plan_name: "Half Marathon Plan"`
- `generated_for: "Ivan"`
- `start_date: "2026-05-05"`
- `week_1_preview[]` with seven day entries
- workout-level fields only:
  `date`
  `weekday`
  `workout`
  `details`
  `target`

Observed limitations in that file matter for the next refinement:

- `Easy Run` and `Long Run` are encoded only as one summary line such as `45 min easy` or `60 min easy`
- `Intervals` is encoded only as `6x400m`
- targets are human-readable strings such as `HR 135-145` or `5K effort`
- rest days are represented as `workout: "Rest"`, `details: "Recovery"`, `target: null`
- there is no explicit warm-up, main block, cool-down, segment ordering, distance-vs-duration mode, or preparation horizon metadata

This plan defines one canonical next path for two connected needs:

- refine the workout-detail page without breaking the preserved imported baseline
- expand the next JSON/template contract so it can later align with canonical plan storage, future upload-result comparison, and verdict generation

## Scope

In scope:

- workout-detail page refinement and UI semantics
- week progress semantics on workout-detail and related UI
- completion status semantics for check, cross, and dash
- placeholder-only `Upload result` action contract
- future hand-off from verdict output into the next workout insight area
- next JSON/template contract expansion beyond `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json`
- `Download template` requirement in the upload JSON flow
- alignment notes with current `planned_workouts.steps` and Supabase plan storage direction

Out of scope for this artifact:

- implementation code
- full OCR pipeline
- full OpenAI extraction or verdict subsystem build
- full workout editor UI design
- broad route rewrites
- replacing TanStack Start or the imported layout system

## Current JSON Baseline

The current canonical observed source example is:

- file: `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json`
- schema posture: shallow import artifact, not final product truth
- visible plan window: one explicit week only through `week_1_preview[]`

Observed shape:

```json
{
  "plan_name": "Half Marathon Plan",
  "generated_for": "Ivan",
  "start_date": "2026-05-05",
  "week_1_preview": [
    {
      "date": "2026-05-05",
      "weekday": "Tuesday",
      "workout": "Easy Run",
      "details": "45 min easy",
      "target": "HR 135-145"
    }
  ]
}
```

Architectural reading of the current file:

- keep it importable as the current visible baseline contract
- do not make `details` and `target` the long-term canonical product truth
- treat `week_1_preview[]` as a starter import shape, not the future normalized plan structure
- keep backward compatibility explicit through schema versioning rather than letting one shallow shape silently define the database

## Workout Page Refinement Goals

### Canonical visual direction

Preserve the imported workout-detail hierarchy and keep the three main blocks separate. Do not collapse the page into one merged card.

Required refinement direction:

- keep the main content block, tabbed logging block, and right-side context block as separate surfaces
- make the main surfaces feel more premium through:
  stronger backdrop treatment
  more dimensional surface separation
  more interesting uneven or gradient border treatment
- preserve the existing baseline layout rhythm, route structure, hover behavior, and interaction patterns
- keep `Fueling & Recovery` present, but allow it to become visually richer inside the existing workout-detail composition

### Implement now as UI polish and placeholder work

These changes are safe to implement without waiting for backend contract expansion:

- stronger workout-detail surface styling
- richer border and backdrop treatment
- result-state iconography near workout identity
- right-side status symbol treatment
- progress-bar-driven `Week Status` block
- placeholder-only `Upload result` action inside the log result area
- reserved placeholder area for future next-workout insight hand-off
- `Download template` button in the upload JSON flow

### Prepare only as future contract or schema direction

These changes should be prepared in the spec now, but not treated as implemented capability:

- detailed workout JSON segment contract
- normalization of segment-level targets into canonical database structure
- screenshot ingestion
- OpenAI extraction
- planned-vs-actual comparison
- verdict storage
- feeding actual verdict content into next workout planning insight

## Completion Status Semantics

The workout result state should become explicit product semantics across workout-detail and related UI.

Canonical semantic mapping:

- `completed well` -> checkmark
- `skipped / not done` -> cross
- `done but not good enough / partial` -> dash

Canonical state mapping to current implementation terms:

- checkmark maps to `completed`
- cross maps to `skipped`
- dash maps to `partial`

UI behavior rules:

- near the workout identity area, the workout should show its current result state visually once a result exists
- the right side may repeat the same result symbol for quicker scanning
- `today` and `upcoming` are not completion results and should not reuse check, cross, or dash
- `rest` remains a non-result state by default and should not present false completion symbolism

Week completion semantics:

- `Week Status` should become a progress-bar-driven block based on scheduled non-rest workouts in the current week
- the primary fill should represent:
  number of `completed` workouts
  divided by
  total scheduled non-rest workouts for the current week
- `partial` and `skipped` should not count as completed progress
- supporting copy can still mention week quality or recovery context, but the bar itself should answer one simple question:
  how many workouts were completed this week

Recommended supporting label:

- `X of Y workouts completed`

This keeps the progress block deterministic and avoids mixing verdict quality into basic completion count.

## Upload Result Placeholder Contract

The current `Log result` area should gain a future-facing `Upload result` action.

Immediate contract:

- the action is placeholder-only
- it must not imply that Garmin, Strava, OCR, or OpenAI are already connected
- it should use honest copy such as `Later`, `Coming next`, or `Upload result placeholder`

Future canonical direction behind that action:

1. user uploads Garmin Connect or Strava screenshot evidence for one planned workout
2. screenshot evidence is stored
3. OpenAI extracts structured workout result fields
4. extracted fields are normalized
5. planned-vs-actual comparison runs
6. verdict and insight are generated
7. trusted result is stored and shown

Current product rule:

- this upload action exists now only as a structural placeholder and affordance
- no user-visible copy should suggest that the extraction or verdict path is already live

## Future Insight Hand-off To Next Workout

The current right-side note or planning area should be prepared to receive future post-run output from the previous workout, but only as a reserved boundary for now.

Canonical future path:

- one stored verdict belongs to one completed planned workout
- the next scheduled workout may surface a short derived insight from the most recent relevant verdict
- that insight is secondary guidance only
- it must not overwrite the canonical planned structure of the next workout

Current placeholder rule:

- preserve an insight or planning-note surface in the right-side column
- label it as future-facing when it is not yet wired
- do not invent AI text or fake adaptive coaching states

## Detailed Workout JSON Contract Direction

### Canonical contract decision

The next downloadable template should move from a shallow `week_1_preview[]`-only shape toward a versioned plan contract that can represent the actual workout structure stored later in Supabase.

Recommended next contract version:

- keep the current file importable as legacy `json-import-v1`
- introduce one new canonical future template contract:
  `training-plan-v2`

Recommended root direction for `training-plan-v2`:

```json
{
  "schema_version": "training-plan-v2",
  "plan_name": "Half Marathon Plan",
  "generated_for": "Ivan",
  "start_date": "2026-05-05",
  "preparation_horizon_months": 4,
  "planned_workouts": [
    {
      "date": "2026-05-07",
      "weekday": "Thursday",
      "week_number": 1,
      "phase": "Base",
      "workout_type": "easy",
      "title": "Easy Run",
      "summary": "50 min easy with calm aerobic control",
      "segments": [
        {
          "segment_type": "warmup",
          "duration_min": 10,
          "target": {
            "intensity": "easy",
            "hint": "Settle in gradually"
          }
        },
        {
          "segment_type": "main",
          "duration_min": 35,
          "target": {
            "hr_bpm": "135-145",
            "intensity": "easy"
          }
        },
        {
          "segment_type": "cooldown",
          "duration_min": 5,
          "target": {
            "hint": "Relax the finish"
          }
        }
      ]
    }
  ]
}
```

### Why this is the canonical next path

- it keeps one direct mapping target into `planned_workouts`
- it aligns with the existing `steps jsonb` seam rather than forcing a new relational stage model now
- it can represent warm-up, main work, recovery, and cool-down explicitly
- it can support duration-based and distance-based segments
- it can carry pace, heart-rate, intensity, and hint targets without depending on one summary string
- it is future-compatible with planned-vs-actual comparison logic

### Segment rules

Each workout should support ordered `segments[]`.

Each segment may specify:

- `segment_type`
  recommended values:
  `warmup`
  `main`
  `recovery`
  `cooldown`
  `rest`
- exactly one primary prescription mode where applicable:
  `duration_min`
  or
  `distance_km`
- `target`
  optional structured target payload such as:
  `pace_min_per_km`
  `hr_bpm`
  `intensity`
  `hint`

For interval-style workouts, one canonical extension is recommended:

- keep interval grouping compatible with the current `steps` model by allowing a repeat block representation during normalization
- do not force the downloadable template to flatten all interval logic into one opaque `details` string

Recommended interval direction:

- either one `segment_type: "main"` with explicit repeat metadata
- or a `segment_type: "interval_block"` internal normalized mapping during import

Architectural preference:

- keep the user-facing template readable
- normalize into the current `planned_workouts.steps`-compatible structure on import

### Fields that become descriptive only, not authoritative

In the next template contract:

- `summary` may remain display-oriented
- any top-level one-line workout description should be derived or editorial
- canonical truth should live in ordered structured segments, not only in one prose string

## Template Download Requirement

The upload JSON flow should add a `Download template` action.

Canonical requirements:

- the downloadable template must match the next canonical import contract, not a fake simplified example
- the template version must be explicit
- the template should be the source users are expected to edit for real import
- the same template shape should be the shape backend normalization expects for the next contract version

Recommended delivery posture:

- keep the current `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json` shape accepted as legacy input
- make the new downloadable template the canonical authoring format going forward

## Data/Database Alignment Notes

This refinement should align with current database direction without forcing new systems immediately.

Canonical alignment:

- `planned_workouts` remains the canonical planned workout row
- `planned_workouts.steps jsonb` remains the canonical normalized structure target for detailed segments
- `plan_import_batches.raw_payload` remains the right place for the full uploaded JSON artifact once the richer contract is imported
- `workout_logs.outcome` remains the current trusted source for completion state:
  `completed`
  `partial`
  `skipped`

Recommended mapping posture:

- current shallow legacy JSON should keep mapping through a legacy normalizer
- the next template contract should map directly into:
  plan-level metadata
  workout-level normalized columns
  structured `steps` payload

Future comparison alignment:

- planned-vs-actual comparison should compare against the normalized segment or step structure, not against raw `details` text
- verdict and insight systems should consume deterministic normalized workout structure, not parse the downloaded template again at read time

## Affected Surfaces

Primary product surfaces:

- `src/routes/workout.$date.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/OnboardingGate.tsx`

Secondary surfaces that should stay semantically aligned:

- `src/components/TodayHero.tsx`
- `src/components/Calendar.tsx`
- `src/lib/imported-plan.ts`
- Supabase plan import and storage seam documented in active plan artifacts

## Open Questions / Edge Cases

These should be resolved during implementation, but the canonical direction is already constrained:

- rest-day handling:
  rest days should remain structurally supported in the template, but should not force fake completion UX
- partial completion and week progress:
  partial remains a distinct workout outcome, but does not count as a completed unit in the week progress bar
- multi-segment intervals:
  interval workouts should normalize into structured repeat-aware steps instead of staying a single `6x400m` string
- legacy compatibility:
  `week_1_preview[]` imports should remain supported as `json-import-v1` until the new template is proven stable
- date window breadth:
  the new canonical template should not be limited to one preview week even if the current UI still initially renders one active week slice

## Out Of Scope

- implementing screenshot upload
- implementing OpenAI extraction
- implementing verdict generation
- implementing adaptive next-workout rewriting
- designing a full manual plan editor
- adding speculative queueing or workflow engines
- broad route or framework rewrites

## Implementation Split Recommendation

Use one sequential split, not parallel product divergence.

Frontend implementation later should own:

- workout-detail visual refinement
- result-state icon placement near workout identity and right-side context
- week progress bar UI
- placeholder-only `Upload result` action
- placeholder next-workout insight boundary
- `Download template` UI affordance in upload JSON flow

Backend implementation later should own:

- `training-plan-v2` validation contract
- legacy `json-import-v1` compatibility path
- normalization from `planned_workouts[].segments[]` into canonical `planned_workouts.steps`
- template file source of truth
- import versioning and raw payload storage

Canonical sequencing recommendation:

- Frontend ships the placeholder and visual refinement first without pretending backend capability exists
- Backend then lands the richer template contract and normalization path against the already-reserved UI seams

## Checklist

- [x] Confirm the workout-detail page keeps its three major blocks and does not collapse into one merged surface
- [x] Define the premium surface treatment as refinement of the imported baseline, not a redesign
- [x] Replace static `Week status` bar semantics with completion-count semantics for the current week
- [x] Document checkmark, cross, and dash as the canonical workout result symbols
- [x] Reserve identity-area and right-side completion indicators for saved result state
- [x] Add a placeholder-only `Upload result` action to the log result area
- [x] Reserve a future next-workout insight hand-off boundary without inventing live AI behavior
- [ ] Define one versioned next JSON/template contract beyond `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json`
- [ ] Add `preparation_horizon_months` to the future template direction
- [ ] Define structured workout segments as the future source-of-truth authoring format
- [x] Require `Download template` in the upload JSON flow
- [ ] Keep legacy `week_1_preview[]` input as an explicit compatibility path, not the future canonical template

## Exit Criteria

- One approved plan exists for workout-detail refinement and detailed JSON/template expansion
- The artifact explicitly references the observed current JSON file and its limitations
- The artifact clearly separates:
  implement now as UI placeholder or polish
  prepare only as future contract or schema direction
- The artifact preserves one canonical path for detailed workout data
- The artifact states how the next downloadable template should align with database normalization
- The artifact names one next recommended role only

## Next Recommended Role

FRONTEND

## Suggested Next Step

Keep this plan active for the remaining template-contract slice only:
define the versioned JSON-v2 direction and the `Download template` upload-flow affordance, while keeping screenshot extraction, verdict generation, and detailed contract storage logic explicitly non-live.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one canonical plan/spec for workout-detail refinement and next JSON/template contract expansion, anchored to the current implemented workout page, upload JSON flow, and the observed source file `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json`.

### Key Decisions

- Preserve the imported workout-detail baseline and keep the three major page blocks separate.
- Treat `completed`, `partial`, and `skipped` as the canonical result states behind check, dash, and cross symbolism.
- Make `Week Status` progress-driven by completed non-rest workouts in the current week.
- Add `Upload result` only as an honest placeholder now.
- Move the next downloadable template toward a versioned `training-plan-v2` contract with structured workout segments and `preparation_horizon_months`.

### Current State

- The app already has a preserved workout-detail route, existing completion outcomes, and a shallow JSON-first upload flow.
- The observed JSON source example is still shallow and uses `week_1_preview[]`, `details`, and `target` as human-readable fields.
- No screenshot extraction, comparison, or verdict pipeline is implemented yet.

### Constraints

- Do not rewrite the imported workout-detail layout.
- Do not present fake Garmin, Strava, OCR, OpenAI, or adaptive-coaching capability.
- Keep one canonical future contract path that aligns with `planned_workouts.steps`.

### Risks / Open Questions

- Interval workout authoring needs a readable user-facing template while still normalizing into repeat-aware structured steps.
- Legacy `json-import-v1` compatibility must remain explicit until the richer template is stable.
- Week progress semantics must stay simple and deterministic even when partial workouts exist.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the workout-detail and upload-flow UI refinement slice from this plan without turning on any non-existent extraction, verdict, or adaptive logic.
```
