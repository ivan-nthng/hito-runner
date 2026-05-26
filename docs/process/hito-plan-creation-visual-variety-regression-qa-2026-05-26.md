# Hito Plan Creation Visual Variety Regression QA - 2026-05-26

## 1. Task

Run `docs/plans/active/2026-05-26-plan-creation-visual-variety-regression-qa.md`.

## 2. Stage

QA visual regression validation.

## 3. Browser Path Preflight

Built-in Codex app/browser was used first and covered the required visual evidence. Safari was not used. Chrome was not used.

## 4. Scenarios Tested

All scenarios used disposable local tester `qa-variety-regression@local.test`. Plans were generated through the backend structured plan contract, imported into saved mode with `npm run test-user`, opened in the real calendar/workout-detail UI, screenshotted, and then the disposable tester was cleaned up.

- Beginner build consistency: age 21, no benchmark, no watch/app, 3 days/week, Tue/Fri fixed rest, relaxed consistency goal.
- Supported 10K: age 34, recent 5K `24:00`, watch/app, mixed guidance, 4 days/week.
- Half marathon target-time: age 36, recent 5K `23:30`, watch/app, pace guidance, 5 days/week, target `1:55:00`.
- Marathon low-support: age 44, no benchmark, watch unknown, mixed guidance, 4 days/week, Tue/Fri fixed rest.
- Ultra: age 41, no benchmark, no watch/app, effort guidance, relaxed ultra, rolling terrain.
- Mountain/trail: age 39, no benchmark, no watch/app, effort guidance, Wed/Sun fixed rest, mountain running.

## 5. Screenshot Index

Screenshot folder: `docs/process/screenshots/plan-creation-visual-variety-regression-2026-05-26/`

- [beginner-calendar.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/beginner-calendar.png)
- [beginner-support-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/beginner-support-detail.png)
- [beginner-long-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/beginner-long-detail.png)
- [supported-10k-calendar.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/supported-10k-calendar.png)
- [supported-10k-support-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/supported-10k-support-detail.png)
- [supported-10k-quality-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/supported-10k-quality-detail.png)
- [supported-10k-long-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/supported-10k-long-detail.png)
- [half-target-calendar.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/half-target-calendar.png)
- [half-target-support-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/half-target-support-detail.png)
- [half-target-quality-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/half-target-quality-detail.png)
- [half-target-long-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/half-target-long-detail.png)
- [marathon-calendar.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/marathon-calendar.png)
- [marathon-support-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/marathon-support-detail.png)
- [marathon-cutback-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/marathon-cutback-detail.png)
- [marathon-long-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/marathon-long-detail.png)
- [ultra-calendar.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/ultra-calendar.png)
- [ultra-support-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/ultra-support-detail.png)
- [ultra-time-on-feet-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/ultra-time-on-feet-detail.png)
- [ultra-long-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/ultra-long-detail.png)
- [mountain-calendar.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/mountain-calendar.png)
- [mountain-support-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/mountain-support-detail.png)
- [mountain-trail-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/mountain-trail-detail.png)
- [mountain-terrain-detail.png](screenshots/plan-creation-visual-variety-regression-2026-05-26/mountain-terrain-detail.png)

## 6. Calendar Variety Findings

Passed for the covered visual set.

- Beginner build consistency looks intentionally simple: Easy, Long, Recovery, Cutback, and Rest appear. This is plain, but appropriate for a no-benchmark beginner consistency plan.
- Supported 10K shows Steady, Easy, Long, Cutback, Race/taper, and explicit `10K rhythm intervals`; it does not read as generic Easy/Long copy-paste.
- Half marathon target-time shows Steady, Easy, Long, Cutback, Tempo/threshold, Recovery, and later steady-finish long runs.
- Marathon low-support stays conservative but visibly includes Steady, Recovery, Cutback aerobic, Cutback long, Long, Easy, and Rest without adding fake intensity.
- Ultra still has many Easy/Long labels, but the calendar includes Rolling hills, Cutback, Recovery, Race/taper, and explicit `Ultra time-on-feet durability`; it is safe and less generic than the earlier blocker state.
- Mountain/trail shows the strongest visible difference: Trail, Hills, Mountain long-run time-on-feet, Technical trail, Uphill repeats, Rolling hills, Climbing steady, Controlled downhill, Race/taper, and Rest appear.

## 7. Workout Detail Findings

Passed for sampled details.

- Beginner easy support run is a single easy block. That is acceptable for the scenario, and the detail still shows target/cue/readback rather than an empty shell.
- Beginner long run renders as 3 blocks with default HR guidance and runner-readable execution cues.
- Supported 10K rhythm intervals render warmup/main/recovery/cooldown-style repeat structure with pace where allowed.
- Half marathon threshold durability renders structured tempo work with pace/default HR readback. Half steady-finish long run renders as 2 meaningful blocks, not one vague block; acceptable but worth watching if Running Coach wants opener/main/finish on all substantial long runs.
- Marathon cutback aerobic run renders as 35 minutes / 3 blocks with clear cutback intent. Marathon long/steady-finish detail is not generic.
- Ultra time-on-feet durability renders as 60 minutes / 3 blocks: patient opening, ultra durability body, controlled finish. This visually confirms the prior ultra one-block regression is repaired.
- Mountain technical trail renders as 30 minutes / 3 blocks with trail-specific guidance and effort-only metric mode. Mountain climbing steady renders as 50 minutes / 3 blocks and avoids exact elevation prescription.

No sampled page showed `[object Object]`, blank body, generic route error, or visible overflow in the built-in browser viewport.

## 8. Metric Guidance Findings

Passed.

- Default estimated HR appeared when age existed and personal HR zones were absent, and was labelled `Default HR guidance` plus `Estimated from age, not personalized zones.`
- No sampled workout claimed personal HR-zone truth.
- Pace appeared only in watch/app plus benchmark plus pace/mixed scenarios: supported 10K and half target-time.
- Beginner, marathon low-support, ultra, and mountain/trail did not show fake pace precision.
- Mountain technical trail kept HR targets `Not provided`; terrain execution stayed effort-led.

## 9. Issues Found

No blockers.

Acceptable but watch:

- Beginner support detail is intentionally one block. This is acceptable for easy beginner work, but still visually plain.
- Half marathon steady-finish long run is meaningful but only 2 blocks. It passes the “not one vague block” bar, but Running Coach may prefer opener/main/finish consistency for long-run readability.
- Ultra calendar still leans Easy/Long at a glance. Detail pages now prove the specificity, but future UX could surface exact ultra identity more strongly in dense calendar cells if users still perceive it as generic.

## 10. Coverage Gaps

- This was saved-mode visual regression coverage from backend-generated structured plans, not full manual first-plan form completion for every scenario.
- Voice, text authoring, JSON import UI, active-plan refresh, and mobile viewport were not re-smoked in this pass.
- Safari was not used because the built-in Codex browser covered the requested screenshot evidence.

## 11. Recommended Next Role

RUNNING COACH only if a qualitative review is desired for the acceptable-watch items. No BACKEND/FRONTEND blocker is indicated by this pass.

## 12. Verdict

Verdict: Passed

The generated saved-mode plans are visually credible across the required scenario set. Calendars differ by goal family, sampled workout details are segmented and executable, metric guidance is honest, default estimated HR is labelled correctly, and the ultra/mountain under-structured regressions are not reproduced.
