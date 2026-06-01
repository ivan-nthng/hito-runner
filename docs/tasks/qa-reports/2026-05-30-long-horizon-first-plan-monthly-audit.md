# Long-Horizon First-Plan Monthly Audit

## Task

Create and audit a long-horizon structured first plan with month-by-month screenshots and a written coaching/backend QA report.

## Stage

QA validation / long-horizon plan quality and persistence audit.

## Browser Path Preflight

Built-in Codex browser was used first. It could not complete authenticated interaction reliably in this pass because local auth/form text entry was blocked by the in-app browser environment, so Safari fallback was used in the existing Safari window only. No extra Safari windows were opened.

## Setup Used

Disposable tester:

- Email: `qa-long-horizon-audit-20260530@local.test`
- User id: `609d3cd7-7c35-4534-b6e1-3b0227ada66e`

Structured onboarding setup:

- Plan start date: `2026-05-29`
- Goal: `Marathon`
- Goal style: `Target time`
- Target time: `3:50:00`
- Target date: `2026-12-11`
- Experience: `new_to_running`
- Running days per week: `5`
- Fixed rest days: `Wednesday`, `Saturday`
- Preferred long run day: `Sunday`
- Terrain: `rolling`
- Extras: `mobility`
- Guidance: `mixed`
- Watch/app access: `watch_or_app`

Pre-submit live form proof:

- `formValid: true`
- `schedule.startDate = 2026-05-29`
- `schedule.targetDate = 2026-12-11`
- `targetTime = 3:50:00`
- No visible local validation errors

## Validation Commands

Passed:

- `npm exec eslint -- src/components/OnboardingGate.tsx src/components/onboarding/StructuredPlanConstructor.tsx src/components/onboarding/onboarding-form-model.ts src/components/ui/hito-date-time-input.tsx src/components/ui/hito-date-time-utils.ts src/lib/structured-first-plan-onboarding.ts src/lib/first-plan-actions.ts`
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`
- `npm run author-ai-first-plan-draft -- --mock-openai --contract blueprint --fixture marathon-target-long --trace-blueprint`
- `git diff --check`
- `npm run build`
- `git diff --check -- docs/tasks/qa-reports/2026-05-30-long-horizon-first-plan-monthly-audit.md`

## Persisted Data Proof

Review boundary:

- Review modal opened successfully before confirm.
- Fresh draft artifact:
  - `qa-artifacts/debug/2026-05-30/structured-onboarding-browser-action/2026-05-30T13-52-31-933Z-generateStructuredFirstPlanDraft-draft_ready-f2d1434bf77b.json`
- Draft artifact facts:
  - `targetDatePresent: true`
  - `requestedHorizonWeeks: 29`
  - `sourceKind: ai_first_plan_blueprint_v1`
  - `sourceStatus: repaired_ai_draft`
  - `fallbackReason: null`
  - `workoutCount: 203`
  - `openAiElapsedMs: 98388`

Persisted cycle after confirm:

- Cycle id: `9e7d469c-ad90-46f0-88b4-ac7987b461cf`
- `plan_cycles.source_kind = ai_first_plan_blueprint_v1`
- `start_date = 2026-05-29`
- `target_date = 2026-12-11`
- `end_date = 2026-12-17`
- `status = active`

Persisted-proof artifact:

- `qa-artifacts/debug/2026-05-30/structured-onboarding-browser-action/2026-05-30T13-52-31-933Z-long-horizon-persisted-proof-f2d1434bf77b.json`

Persisted-proof summary:

- `203` total calendar rows
- `145` non-rest rows
- `0` Wednesday/Saturday workout leaks
- `0` rich-field gaps
- `0` one-segment non-rest regressions
- All `29` long-run transitions resolved to `recovery_jog`
- Sunday long runs remained preserved throughout the plan

## Screenshot Folder

- `qa-artifacts/screenshots/2026-05-30/long-horizon-plan-monthly-audit/`

Key screenshot set:

- Review modal before confirm
- Saved plan overview after confirm
- Monthly calendar screenshots for May through December 2026
- Workout detail screenshots for:
  - early long run
  - mid-plan long run
  - taper long run
  - post-long-run recovery

## Month-by-Month Audit

### May 2026

- Non-rest workouts: `2`
- Long runs:
  - `2026-05-31 long_aerobic_run`
- Recovery/easy after long run:
  - `2026-06-01 recovery_jog` (next running slot, proven in persisted transition summary)
- Steady/quality/specialty:
  - none in May
- Cutback/taper signs:
  - none
- Fixed rest day violations:
  - none
- Readability note:
  - the calendar month naturally shows many pre-start rest placeholders before `2026-05-29`; not a persistence bug, but it makes the first month look visually emptier than the true plan start suggests

### June 2026

- Non-rest workouts: `22`
- Long runs:
  - `2026-06-07 long_aerobic_run`
  - `2026-06-14 long_aerobic_run`
  - `2026-06-21 long_aerobic_run`
  - `2026-06-28 long_aerobic_run`
- Recovery/easy after long runs:
  - `2026-06-08 recovery_jog`
  - `2026-06-15 recovery_jog`
  - `2026-06-22 recovery_jog`
  - `2026-06-29 recovery_jog`
- Steady/quality/specialty:
  - `2026-06-02 steady_aerobic_run`
  - no quality/specialty sessions
- Cutback/taper signs:
  - none
- Fixed rest day violations:
  - none
- Coaching note:
  - conservative and safe base month for a new runner; low variety, but not unsafe

### July 2026

- Non-rest workouts: `22`
- Long runs:
  - `2026-07-05 long_run_with_steady_finish`
  - `2026-07-12 long_run_with_steady_finish`
  - `2026-07-19 long_run_with_steady_finish`
  - `2026-07-26 long_run_with_steady_finish`
- Recovery/easy after long runs:
  - `2026-07-06 recovery_jog`
  - `2026-07-13 recovery_jog`
  - `2026-07-20 recovery_jog`
  - `2026-07-27 recovery_jog`
- Steady/quality/specialty:
  - no standalone quality/specialty sessions
- Cutback/taper signs:
  - none
- Fixed rest day violations:
  - none
- Coaching note:
  - shift from purely aerobic long runs into steady-finish long runs is coherent, but the month becomes highly templated

### August 2026

- Non-rest workouts: `22`
- Long runs:
  - `2026-08-02 long_run_with_steady_finish`
  - `2026-08-09 long_run_with_steady_finish`
  - `2026-08-16 cutback_long_run`
  - `2026-08-23 long_run_with_steady_finish`
  - `2026-08-30 long_run_with_steady_finish`
- Recovery/easy after long runs:
  - `2026-08-03 recovery_jog`
  - `2026-08-10 recovery_jog`
  - `2026-08-17 recovery_jog`
  - `2026-08-24 recovery_jog`
  - `2026-08-31 recovery_jog`
- Steady/quality/specialty:
  - none
- Cutback/taper signs:
  - clear cutback week around `2026-08-16`
- Fixed rest day violations:
  - none
- Coaching note:
  - first visible cutback is a good safety sign; still very repetitive outside the cutback shape

### September 2026

- Non-rest workouts: `21`
- Long runs:
  - `2026-09-06 long_run_with_steady_finish`
  - `2026-09-13 long_run_with_steady_finish`
  - `2026-09-20 long_run_with_steady_finish`
  - `2026-09-27 long_run_with_steady_finish`
- Recovery/easy after long runs:
  - `2026-09-07 recovery_jog`
  - `2026-09-14 recovery_jog`
  - `2026-09-21 recovery_jog`
  - `2026-09-28 recovery_jog`
- Steady/quality/specialty:
  - `2026-09-22 steady_aerobic_run`
  - `2026-09-29 steady_aerobic_run`
  - no quality/specialty sessions
- Cutback/taper signs:
  - none
- Fixed rest day violations:
  - none
- Coaching note:
  - density remains safe, but the block shows mechanical repetition and almost no workout-family diversity beyond easy/steady/long/recovery

### October 2026

- Non-rest workouts: `22`
- Long runs:
  - `2026-10-04 long_run_with_steady_finish`
  - `2026-10-11 cutback_long_run`
  - `2026-10-18 long_run_with_steady_finish`
  - `2026-10-25 long_run_with_steady_finish`
- Recovery/easy after long runs:
  - `2026-10-05 recovery_jog`
  - `2026-10-12 recovery_jog`
  - `2026-10-19 recovery_jog`
  - `2026-10-26 recovery_jog`
- Steady/quality/specialty:
  - `2026-10-06 steady_aerobic_run`
  - `2026-10-13 steady_aerobic_run`
  - `2026-10-20 steady_aerobic_run`
  - `2026-10-27 steady_aerobic_run`
  - no quality/specialty sessions
- Cutback/taper signs:
  - cutback long run on `2026-10-11`
- Fixed rest day violations:
  - none
- Coaching note:
  - strong consistency and safety, but still little evidence of broader marathon-specific variety

### November 2026

- Non-rest workouts: `22`
- Long runs:
  - `2026-11-01 long_run_with_steady_finish`
  - `2026-11-08 cutback_long_run`
  - `2026-11-15 long_run_with_steady_finish`
  - `2026-11-22 taper_long_run`
  - `2026-11-29 taper_long_run`
- Recovery/easy after long runs:
  - `2026-11-02 recovery_jog`
  - `2026-11-09 recovery_jog`
  - `2026-11-16 recovery_jog`
  - `2026-11-23 recovery_jog`
  - `2026-11-30 recovery_jog`
- Steady/quality/specialty:
  - `2026-11-03 steady_aerobic_run`
  - `2026-11-10 steady_aerobic_run`
  - `2026-11-17 steady_aerobic_run`
  - `2026-11-24 steady_aerobic_run`
  - no quality/specialty sessions
- Cutback/taper signs:
  - cutback on `2026-11-08`
  - taper signs on `2026-11-22` and `2026-11-29`
- Fixed rest day violations:
  - none
- Coaching note:
  - taper presence is clear and coherent; no unsafe density spike appears late in the build

### December 2026

- Non-rest workouts: `12`
- Long runs:
  - `2026-12-06 cutback_long_run`
  - `2026-12-13 cutback_long_run`
- Recovery/easy after long runs:
  - `2026-12-07 recovery_jog`
  - `2026-12-14 recovery_jog`
- Steady/quality/specialty:
  - `2026-12-01 steady_aerobic_run`
  - `2026-12-08 steady_aerobic_run`
  - `2026-12-15 steady_aerobic_run`
  - no quality/specialty sessions
- Cutback/taper signs:
  - two cutback long runs after the target-date window
- Fixed rest day violations:
  - none
- Coaching note:
  - the persisted cycle extends beyond the target date to `2026-12-17`, which is consistent with canonical cycle-window semantics but can feel slightly unintuitive from a runner-facing “goal date” perspective

## Coaching Quality Findings

Strong points:

- Safety rules held throughout the full plan:
  - Wednesday/Saturday stayed rest-only
  - every post-long-run next running slot was `recovery_jog`
  - no rich-row or segment-array regressions appeared
- Long-run progression is broadly sensible:
  - early `long_aerobic_run`
  - middle `long_run_with_steady_finish`
  - visible cutback weeks
  - visible taper late in the cycle
- The plan is conservative enough for a new runner targeting `3:50:00`.

Concerns:

- The plan is highly repetitive, especially from July onward.
- There is almost no specialty/quality diversity across a 29-week horizon.
- Backend extension after week 16 is coherent and safe, but it reads as mechanical rather than richly periodized.
- For a beginner, the lack of aggressive quality is acceptable, but the same few identities repeat so often that coaching value can feel flat.
- Titles and summaries are generally not misleading, but the review surface still frames the draft as a 16-week blueprint even though the persisted plan is a 29-week extended result.

Overall coaching read:

- Safe: yes
- Coherent: yes
- Varied/interesting: only moderately
- Overloaded for a new runner: no
- Likely under-varied for a premium long-horizon coaching experience: yes

## Backend Findings

Positive backend findings:

- Confirm/save persisted exactly the reviewed blueprint-backed plan.
- Persistence counts matched expected long-horizon counts exactly.
- Rich metadata completeness was strong:
  - `workout_family`
  - `workout_identity`
  - `calendar_icon_key`
  - `metric_mode`
  - meaningful `steps`
- Recovery-first sequencing policy held on every long-run transition.
- No deterministic fallback success leaked into the final accepted plan.

Potential backend/product issues:

- The review copy still emphasizes the 16-week blueprint identity more than the final 29-week product truth.
- Extension logic appears safe but pattern-heavy; the extended horizon may need more controlled micro-variation to feel less mechanical without breaking doctrine.

## Issues Found

No release-blocking persistence or safety defect was reproduced.

Non-blocking issues:

- Coaching variety is limited across the full 29-week horizon.
- The runner-facing review language can under-describe the fact that the final saved plan is backend-extended beyond the 16-week AI-authored core.
- Month-one readability is slightly awkward because pre-start calendar cells visually dominate the May screenshot.

## Recommendations for RUNNING COACH

- Review whether a 29-week beginner marathon plan should include a little more bounded variety while staying conservative.
- Consider whether some late-cycle steady days could rotate among a small safe set of identities to reduce monotony.
- Review whether the long block of `long_run_with_steady_finish` is too repetitive for perceived coaching quality, even if it is doctrine-safe.

## Recommendations for BACKEND

- Preserve the current safety envelope: recovery-first sequencing, fixed-rest protection, and rich-row completeness all looked strong.
- Improve runner-facing copy so review/persisted surfaces describe the extended long-horizon plan more explicitly instead of reading like a plain 16-week blueprint.
- Consider adding bounded variation rules inside backend extension so long-horizon output feels less mechanical without introducing unsafe quality density.
- Keep the canonical persisted proof hooks; they made this audit significantly easier and more trustworthy.

## Coverage Gaps

- This pass audited one exact long-horizon beginner marathon setup, not the full space of long-horizon goals/styles.
- Metric-mode safety was checked through persisted metadata completeness and UI review, not by a separate physiology audit of every metric target.
- No live provider/device sync was involved in this slice.

## Cleanup

Cleanup completed after screenshots and persisted proof:

- Deleted disposable tester auth/local account
- Deleted disposable runner profile
- Deleted persisted plan cycle and planned workouts
- Verified zero residual rows for:
  - `runner_profiles`
  - `plan_cycles`
  - `planned_workouts`
  - `workout_logs`

Post-cleanup verification:

- `authUserExists: false`
- `runnerProfiles: 0`
- `planCycles: 0`
- `plannedWorkouts: 0`
- `workoutLogs: 0`

## Verdict

Passed with non-blocking coaching-quality observations.

The long-horizon structured first plan was successfully reviewed, confirmed, persisted, audited across every calendar month, and cleaned up afterward. Persistence exactness, recovery sequencing, fixed-rest protection, Sunday long-run preservation, and metadata completeness all held. The main follow-up is not a correctness bug but a product-quality concern: the long-horizon extension is safe and coherent, yet noticeably repetitive and a bit under-explained in runner-facing copy.
