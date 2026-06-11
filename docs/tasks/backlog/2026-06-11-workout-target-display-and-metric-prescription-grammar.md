# Workout Target Display And Metric-Prescription Grammar Cleanup

## Status

done / QA-passed

## Type

bug

## Severity

high

## Priority

next

## Owner

FRONTEND / QA

## Reported

2026-06-11

## Task

Create one canonical runner-facing workout target display grammar so calendar, workout detail,
interval visualization, and selected-plan preview surfaces never expose raw numeric precision or
internal target labels.

## Stage

ARCHITECT acceptance closeout / workout target truth and runner-facing display source-of-truth

## User Report

Calendar and workout tooltips are exposing broken target grammar:

- duration renders as raw floating point, for example `45.850000000000001m`
- segment duration renders as unclear shorthand, for example `9.4'`
- runner-facing fields expose abstract/internal target wording such as `target`,
  `Structure-only executable target`, and `controlled tempo`

Expected behavior is closer to Garmin/Suunto-style workout targets: clear duration, distance,
pace, HR, repeats, recovery, warmup, and cooldown. Hito must not show raw floats or vague internal
labels as runner-facing workout targets.

## Evidence

Screenshot evidence is preserved in backlog assets:

- [Calendar tooltip raw duration](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-11-workout-target-display-and-metric-prescription-grammar/calendar-tooltip-raw-duration.png)
- [Interval tooltip target label](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-11-workout-target-display-and-metric-prescription-grammar/interval-tooltip-target-label.png)

Original report screenshots:

- [Screenshot 2026-06-11 at 10.17.59.png](</var/folders/3y/5cpksv511mdbm91rqfggw76h0000gn/T/TemporaryItems/NSIRD_screencaptureui_sYUfUh/Screenshot 2026-06-11 at 10.17.59.png>)
- [Screenshot 2026-06-11 at 10.18.19.png](</Users/ivan/Desktop/Screenshot 2026-06-11 at 10.18.19.png>)

## Observed Behavior

The saved calendar tooltip can render total duration using unformatted raw numeric output, such as
`45.850000000000001′`.

The interval/workout structure tooltip can render segment duration as decimal prime notation such
as `9.4′`, which is mathematically compact but not runner-friendly.

Target rows can render backend/internal grammar directly:

- `Target: Structure-only executable target`
- abstract `Target` labels instead of device-like prescriptions
- support-mode wording presented as if it were the executable workout target

## Expected Behavior

Runner-facing workout target display must use one shared grammar:

- no raw floats
- no vague `target` row labels
- no internal mode labels such as `Structure-only executable target`
- no debug/source keys in runner-facing tooltip, card, detail, preview, or export surfaces
- duration uses clear units:
  - compact surfaces round workout totals to nearest minute, for example `46 min`
  - segment/detail surfaces may show seconds when useful, for example `9 min 24 sec`
  - no decimal prime notation such as `9.4′`
- distance uses clear units:
  - intervals/repeats may use meters, for example `1500 m`
  - longer runs may use kilometers with bounded precision, for example `7.9 km` or `7.91 km`
  - no raw unbounded decimal output
- repeat structure is explicit:
  - `5 x 1500 m / 500 m jog`
  - `6 x 2 min hard / 90 sec easy`
- warmup, cooldown, recovery, and work segments render as purpose plus prescription, not raw
  internal labels
- pace appears only when pace truth exists
- personal HR appears only when personal HR-zone truth exists
- editable/default HR guidance must be labelled as advisory default guidance, not personal HR
  target truth
- structure-only mode still shows numeric executable structure: duration, distance, repeats, work,
  recovery, warmup, and cooldown

## Source Investigation

Existing product/system docs already describe the target-truth direction:

- [docs/current-product.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md) says structure-only executable targets should use numeric duration/distance/repeat/recovery anatomy rather than fake precision or cue-only prose.
- [docs/current-system.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md) says generated non-rest segments must carry executable target anatomy and must not invent fake pace or personal HR.

Relevant source findings:

- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx) currently renders tooltip duration with raw `workoutDuration(...)` output in at least one saved-calendar tooltip path, which explains the raw floating-point display.
- [src/components/IntervalsViz.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/IntervalsViz.tsx) uses `formatDurationMin(..., "prime")`, which permits decimal prime notation such as `9.4′`.
- [src/lib/training.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training.ts) has the shared `formatDurationMin(...)`, `displayTargetEntries(...)`, and `displayExecutableTargetEntries(...)` helpers. `displayExecutableTargetEntries(...)` currently treats `label` as an executable target entry, and `humanizeTargetLabel("label")` becomes `Target`.
- [src/lib/running-plan-engine-review.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/running-plan-engine-review.ts) can emit `label: "Structure-only executable target"` for structure-only target mode.
- [src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx) also has runner-facing copy that can return `Structure-only executable target.`

Nearby backlog item checked:

- [Authenticated Saved-Mode Workout Readback Browser Smoke Fixture](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-06-authenticated-saved-mode-workout-readback-browser-smoke-fixture.md)

That item is QA fixture hygiene for an older completed target-readback slice. It does not cover the
new source-of-truth cleanup for raw formatting and internal label leakage, so this item is not a
duplicate.

## Likely Root Cause

Visible symptom:

Raw duration and internal target labels leak into calendar/workout tooltips.

Likely underlying cause:

Hito does not yet have one shared runner-facing target display view model. Numeric prescriptions and
metric-truth modes exist, but UI helpers still mix:

- raw numeric duration output
- compact developer shorthand
- backend/internal target label fields
- support-mode labels treated as executable target rows

Canonical owner:

The first implementation owner is the shared rendering view model / Hito DS display grammar layer,
not a route-local tooltip patch. The immediate gate should be `FRONTEND` because the confirmed raw
float and decimal-prime symptoms are rendered in frontend helpers/surfaces. However, the frontend
must inspect backend-shaped payloads before patching; if a surface lacks numeric prescription
anatomy, it must stop and route that gap to `BACKEND`.

## Recommended Fix Direction

Implement one shared runner-facing workout target display grammar and apply it to the visible
surfaces instead of patching individual strings.

Recommended first implementation gate:

1. Add or refine a shared display helper near the existing training display utilities that turns
   canonical workout steps and metric mode into runner-facing target rows.
2. Make saved calendar tooltip duration and compact workout summaries use the shared duration
   formatter, never raw numeric interpolation.
3. Make interval visualization and segment tooltips render clear segment prescriptions:
   duration, distance, repeat count, work, recovery, warmup, cooldown, and advisory cues.
4. Stop treating `target.label` as an executable runner-facing target by default.
5. Keep support notes such as cue/hint/source note secondary and never render them as the
   executable target unless the target truth allows it.
6. Remove runner-facing `Structure-only executable target` wording from preview/tooltips/detail by
   mapping structure-only mode to concrete numeric structure.
7. Preserve metric-truth guardrails:
   - no pace unless pace truth exists
   - no personal HR unless personal HR-zone truth exists
   - editable/default HR remains advisory and labelled as such

## Frontend Implementation Result

Status:

implemented / source-build validated / awaiting saved-plan browser fixture QA.

Frontend added shared bounded duration/distance and structure readback helpers, then reused them in
calendar tooltip, interval visualization, workout detail, Today/upcoming, selected-plan preview, and
manual authoring summaries.

Implementation proof from the frontend report:

- Raw duration formatting is normalized, including deterministic proof that
  `45.850000000000001` displays as `46 min`.
- Decimal-prime segment duration is normalized, including deterministic proof that `9.4` displays
  as `9 min 24 sec`.
- Internal `target.label` is no longer treated as the runner-facing executable target by default.
- Structure-only mode now reads as concrete structure such as duration/repeats/work/recovery rather
  than internal executable-mode wording.
- Targeted ESLint passed for changed frontend/shared-display files.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- `git diff --check` passed.
- `npm run build` passed.

Known remaining proof gap:

- Built-in Browser opened the local app, but the current session had no active saved plan. Mobile
  smoke on the available surface passed at `375px` with no horizontal overflow and no forbidden
  strings, but saved-calendar tooltip and interval/segment browser proof still needs a QA fixture or
  session with an active saved plan.

## QA Acceptance Result

Status:

QA-passed / accepted on 2026-06-11.

QA validated the shared workout target display grammar cleanup with a saved active-plan browser
fixture.

Accepted proof:

- Saved calendar row proof showed the `45.85`-style fixture duration renders as `46 min`.
- Interval/segment readback proof showed `9.4 min` renders as `9 min 24 sec`.
- `Target: Structure-only executable target` is absent from runner-facing tested surfaces.
- Structure-only mode still shows concrete executable structure.
- Fake pace did not appear.
- Fake personal HR did not appear.
- Mobile `375px` layout has no horizontal overflow.
- Disposable `planned_workouts`, `plan_cycles`, `runner_profiles`, and `workout_logs` returned to
  zero after cleanup.

Closeout decision:

- This bug is closed as a runner-facing display/source-of-truth cleanup.
- The previous saved-plan browser fixture gap is resolved.
- Manual saved-template UI wiring may proceed because it no longer depends on this target display
  cleanup gate.

## What Not To Touch

- Do not mutate Supabase.
- Do not mix this with Backend Slice 4 saved templates.
- Do not redesign the calendar UI.
- Do not create a new calendar/workout UI system.
- Do not weaken metric-truth guardrails.
- Do not add fake pace.
- Do not add fake personal HR.
- Do not patch only the screenshot text while leaving raw target display helpers unresolved.
- Do not make frontend invent schedule, metric, or prescription truth.

## Validation Expectations

QA validation proved:

- no raw floating-point duration appears in saved calendar tooltip, workout detail, interval
  visualization, selected-plan preview, or manual-workout preview surfaces touched by the slice
- `9.4′`-style decimal prime notation is replaced with clear duration grammar
- `Target: Structure-only executable target` does not appear in runner-facing UI
- structure-only mode still displays concrete executable structure
- pace and HR remain hidden unless allowed by metric truth
- editable/default HR remains advisory and is not presented as personal HR target truth
- targeted ESLint passes for changed frontend/shared-display files
- `git diff --check` passes
- built-in Codex browser proof covers at least one saved calendar tooltip and one interval/segment
  tooltip/detail state
- `375px` mobile has no horizontal overflow

## Next Recommended Role

None — completed. The next related product gate lives in the active manual authoring plan.

## Previous QA Handoff Prompt

```text
ROLE: QA

1. Task

Validate shared runner-facing workout target display grammar cleanup with a saved active-plan browser fixture.

2. Stage

QA validation / workout target display and metric-prescription grammar browser proof.

3. Context

Frontend implemented the shared runner-facing target display grammar cleanup. Source/build proof passed, including deterministic proof that raw duration such as 45.850000000000001 renders as 46 min, decimal-prime duration such as 9.4 renders as 9 min 24 sec, and internal target labels are hidden from runner-facing executable target rows.

The remaining gap is browser proof on a saved active-plan fixture. The implementation browser smoke could not reach saved-calendar tooltip/interval proof because the current session had no active saved plan.

4. Browser Path Preflight

Use the built-in Codex Browser first. Use the persistent local server on the existing port when available; if the server is stale after build, restart the same server instead of starting duplicates. Safari is fallback only if the built-in Browser cannot cover the flow.

5. Files To Inspect

- AGENTS.md
- agents/qa.agent.md
- skills/hito-qa-browser-regression/SKILL.md
- docs/tasks/backlog/2026-06-11-workout-target-display-and-metric-prescription-grammar.md
- docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
- src/lib/training.ts
- src/components/Calendar.tsx
- src/components/IntervalsViz.tsx
- src/components/TodayHero.tsx
- src/routes/workout.$date.tsx
- src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx
- src/components/manual-workout/ManualWorkoutAuthoringControls.tsx

6. Validation Coverage

Run or reuse as appropriate, but report exact commands:

- targeted ESLint for changed frontend/shared-display files
- node --import tsx ./scripts/validate-manual-workout-authoring.ts
- npm run build
- git diff --check for the changed display/backlog/manual-plan files

7. Required Behavior Proof

Use or create a safe disposable/local saved active-plan fixture. The proof must cover:

- A saved calendar tooltip no longer shows raw floating-point duration such as 45.850000000000001m.
- A saved calendar tooltip shows a rounded runner-facing duration such as 46 min where appropriate.
- An interval/segment tooltip or workout detail structure no longer shows decimal-prime shorthand such as 9.4'.
- Segment/detail duration displays clear runner-facing grammar such as 9 min 24 sec.
- No runner-facing surface in the tested path shows Target: Structure-only executable target.
- Structure-only mode still shows concrete executable structure: duration, distance, repeats, work, recovery, warmup, cooldown where available.
- Pace stays hidden unless pace truth exists.
- Personal HR stays hidden unless personal HR-zone truth exists.
- Advisory/default HR remains labelled as advisory, not personal HR target truth.
- Mobile 375px no-overflow passes after opening the touched surfaces.

8. Safety / Data Rules

- Prefer a disposable local/test account.
- Do not mutate production/non-disposable data.
- If creating a disposable active plan is necessary, prove cleanup or use an already disposable fixture with documented scope.
- Do not edit product code.
- Do not run migrations.
- Do not broaden into saved-template picker wiring, copy/paste, JSON export, move workout, or running-plan engine work.

9. Stop Conditions

Fail if any tested runner-facing saved-calendar or interval/detail surface still shows raw float duration, decimal-prime shorthand, Target: Structure-only executable target, fake pace, fake personal HR, or horizontal overflow at 375px.
```

## Blockers

None.
