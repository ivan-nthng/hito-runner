# Workout Metric Enrichment Truth Audit

## Status

complete

## Type

bug

## Priority

high

## Next Recommended Role

architect

## Task

No further implementation in this bug item. Return to bounded cleanup routing unless a fresh metric
truth regression appears.

## Stage

Accepted closeout / benchmark-backed pace truth browser proof passed.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Do not open a new implementation slice from this bug item by default. Return to bounded cleanup
routing unless a fresh metric-truth regression appears.

Stage:
Accepted closeout / benchmark-backed pace truth browser proof passed.

Context:
This bug is now closed in the proved scope:
- backend benchmark-backed pace seam is QA-passed
- frontend metric-surface cleanup is implemented
- Quick setup benchmark collection is implemented
- QA proved no-benchmark preview remains structure-only
- QA proved benchmark-backed preview shows `Recent 5K benchmark pace 5:00/km · personal HR targets blocked`
- QA proved persisted workout detail shows pace where backend allows it
- QA proved no fake pace and no personal HR target truth appear

Boundary:
- provider-derived pace truth remains future
- personal HR-zone executable truth remains future
- do not reopen this item unless a fresh source or QA regression appears
```

## User Report

Workout detail can still show segment rows such as `Work 1/6` with only `Duration: 2 min`.

The runner expectation is that interval, tempo, threshold, hill, or other quality-style workout
segments should show a concrete execution instruction when Hito has valid truth: pace range, personal
HR range, repeat/recovery anatomy, RPE, or clear structure. The product question is not only how the
row renders, but why backend saved truth does or does not contain richer executable targets.

## Existing Related Work

- [Workout Target Display And Metric-Prescription Grammar Cleanup](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-11-workout-target-display-and-metric-prescription-grammar.md>)
  is completed and QA-passed. It fixed raw floats, decimal-prime shorthand, internal target labels,
  and unsafe frontend display leakage. It did not promise new backend pace or HR truth.
- [Watch-Executable Workout Targets And Metric Truth Contract](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md>)
  is the archived metric truth contract: pace targets require backend-approved pace truth; personal
  HR targets require personal HR-zone truth; age-estimated/default HR is advisory/readback-only; and
  `structure_only_executable` is valid when numeric structure exists without metric precision.
- [Provider-Derived Pace Truth Implementation](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-06-provider-derived-pace-truth-implementation.md>)
  remains the future source for broader pace truth beyond recent benchmark truth.
- [Heart Rate Zones Profile And AeT Estimation Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md>)
  remains the paused future source for runner-level personal HR-zone truth.

## Source Investigation

- [workout detail](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/workout.$date.tsx>)
  renders backend-shaped `displayExecutableTargetEntries(...)`, filtered through
  `workout.metricMode`, then falls back to structure entries when the mode is
  `structure_only_executable`.
- [training.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training.ts>)
  already filters pace and HR target entries through `paceTargetsAllowed` and `hrTargetsAllowed`,
  and exposes structure entries for duration, distance, repeats, work, recovery, warmup, and
  cooldown.
- [rich-workout-model.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/rich-workout-model.ts>)
  derives metric mode from actual target keys and refuses to count default HR as executable personal
  HR truth.
- [running-plan-engine-review.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/running-plan-engine-review.ts>)
  currently builds selected running-plan saved rows with `structure_only_executable`,
  `pace_targets_allowed: false`, and `hr_targets_allowed: false`, while segment targets are effort,
  RPE, or advisory default HR rather than pace/HR ranges.
- [Plan Preset metric truth](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-presets/progressive-metric-truth.ts>)
  allows pace only when benchmark truth exists and the runner wants pace/mixed guidance; HR remains
  disabled without personal HR-zone truth.

## Audit Classification

Duration-only readback is not automatically a frontend bug.

It is correct when:

- backend has no validated pace benchmark or provider-derived pace truth
- backend has no personal HR-zone truth
- the workout remains numerically executable through structure-only anatomy
- frontend hides pace/HR because `metricMode` says they are not allowed

It is a backend enrichment gap when:

- the runner has valid pace truth and the workout family/segment safely supports pace targets, but
  saved rows still omit `pace_min_per_km_range`
- the runner has valid personal HR-zone truth and the workout family/segment safely supports HR
  targets, but saved rows still omit `hr_bpm_range` / `hr_target_source: personal_hr_zone`
- canonical review/confirm or persistence loses target keys or downgrades `metric_mode`
- generated quality sessions collapse to only duration without repeat/work/recovery/RPE/intensity
  structure

It is a frontend readback gap only if persisted saved rows already contain valid target keys and
allowed `metricMode`, but workout detail still does not show them.

## Canonical Rules

### Structure-only executable

Use `structure_only_executable` when:

- numeric duration, distance, repeat, work, recovery, warmup, cooldown, run/walk, or hike/run
  structure exists
- valid pace truth is missing, unsafe, stale, or unsupported for the segment
- valid personal HR-zone truth is missing or unsupported for the segment

Structure-only is allowed, but it must not be vague. For repeat/quality work, it should still expose
work/recovery anatomy plus RPE/intensity/cues where useful.

### Pace targets

Emit pace targets only when:

- the runner has a valid backend-approved pace anchor, currently recent benchmark truth, or a future
  accepted provider-derived/verified pace profile
- the workout family and segment safely support pace targets
- the range is broad enough to avoid fake precision
- target time alone is not the source of pace truth

Backend must send segment-level `pace_min_per_km_range` plus `metric_mode.pace_targets_allowed:
true` when pace truth is emitted.

### HR targets

Emit executable HR targets only when:

- the runner has backend-owned personal HR-zone truth
- the workout family and segment safely support HR targets

Age-estimated/default HR can be advisory readback only. It must not set `hr_targets_allowed: true`.

Backend must send segment-level `hr_bpm_range`, `hr_target_source: personal_hr_zone`, and
`metric_mode.hr_targets_allowed: true` when personal HR truth is emitted.

## Frontend Boundary

Frontend should:

- render backend-shaped pace/HR target rows when `metricMode` allows them
- render concrete structure-only anatomy when metric truth is absent
- show bounded missing-truth explanation only from backend-shaped reason/readback fields
- never create pace, HR, schedule, or persistence truth locally

Frontend should not:

- infer pace from workout type, target time, runner level, or comments
- infer personal HR from age-estimated/default HR
- treat a duration-only segment as display-only if backend truth is actually missing

## What Not To Touch

- Do not weaken no-fake-pace or no-fake-personal-HR guardrails.
- Do not route this as a frontend copy-only patch.
- Do not mix this with manual move/copy/delete bugs.
- Do not implement provider-derived pace truth in this slice unless explicitly selected later.
- Do not implement HR-zone profile/AeT estimation in this slice.
- Do not make every workout type require pace/HR targets.
- Do not make target time unlock pace.
- Do not make age/default HR executable personal HR.

## Validation Expectations

- Deterministic backend/source proof classifies a representative saved workout that currently reads
  duration-only.
- Benchmark-supported fixture emits pace targets where safe.
- No-benchmark fixture remains `structure_only_executable`.
- Personal-HR fixture emits HR targets only from personal HR-zone truth, if such fixture support
  already exists; otherwise the gap is reported and linked to the HR-zone plan.
- Age/default-HR fixture remains advisory and does not set executable HR mode.
- Target-time-only fixture emits zero pace targets.
- Saved readback/export-shaped payload preserves `metric_mode` and target keys.
- Workout detail does not need frontend changes unless backend proof shows valid target keys are
  already present but hidden.

## Backend Audit Result

Backend audit classified the visible selected-plan duration-only cases as correct
`structure_only_executable` output for the current selected running-plan engine because that path
does not accept recent benchmark pace truth or personal HR-zone truth. The source contract remains
strict: no target-time pace, no provider-inferred pace, and no age-estimated personal HR targets.

The structured first-plan path already emits benchmark-backed `pace_min_per_km_range` when recent
5K truth plus watch/app pace or mixed guidance is present. Backend validation now also proves that
those pace targets survive the saved-workout readback path:

`training-plan-v2 -> buildImportedPlanSeed -> rich metric-mode normalization -> workout detail executable target entries`

No runtime enrichment was added for selected running-plan previews because that would require a new
Product/Architect-approved pace-truth input seam. Provider-derived pace truth and personal HR-zone
truth remain the correct future owners for broader enrichment.

## Architecture Decision

Decision date: 2026-06-15.

Selected running-plan creation should not remain permanently structure-only, but it must remain
structure-only by default.

The accepted product contract is:

- selected-plan creation may emit pace targets only when backend has validated benchmark-backed pace
  truth and the selected workout segment safely supports pace
- selected-plan creation must not require benchmark truth to create a plan
- selected-plan creation must not infer pace from target time, selected distance, runner level,
  ambition, comments, AI inference, or provider data that has not been promoted to canonical pace
  truth
- selected-plan creation must not emit executable HR targets until personal HR-zone truth exists
- age/default HR remains advisory/readback-only
- no-benchmark or no-personal-HR selected plans stay `structure_only_executable` with concrete
  duration, distance, repeat, work, recovery, warmup, cooldown, RPE, intensity, and cue anatomy

The first implementation gate is benchmark-backed pace truth only. Provider-derived pace truth and
personal HR-zone truth are intentionally separate future seams.

## Metric Truth Source Separation

### Benchmark-backed pace truth

This is the first selected-plan expansion target. Backend may reuse the existing recent-benchmark
pace resolver and canonical target keys, but must bind it through selected-plan review/confirm
exactness rather than trusting frontend rows.

### Provider-derived pace truth

Future-only for this item. Provider evidence must first become canonical, freshness-gated,
auditable pace truth through the provider-derived pace backlog before selected-plan generation may
consume it.

### Personal HR-zone truth

Future-only for this item. Executable HR targets require runner-level personal HR-zone truth. The
paused HR-zone plan remains the owner of manual zone storage/readback and later estimation work.

## Current Default

`structure_only_executable` remains a correct selected-plan outcome when metric truth is absent. It
is not a degraded state if the row still carries executable structure and runner-friendly cues.

## Blockers

- Personal HR-zone truth is not implemented yet; HR-executable targets remain future until that
  source exists.
- Provider-derived pace truth is not implemented yet; broad pace enrichment beyond recent benchmark
  truth remains future.
- Frontend selected-plan benchmark collection or profile-surface wiring may become a later gate if
  the backend slice proves the selected-plan action cannot yet receive canonical benchmark truth.
