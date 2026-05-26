# Hito Plan Creation Visual Richness QA - 2026-05-26

## 1. Task

Run visual QA for Hito plan creation diversity and workout detail structure across multiple plan types, with screenshots.

## 2. Stage

QA visual validation / release-readiness evidence.

## 3. Browser Path Preflight

Built-in Codex app/browser was used first and covered the required visual evidence. Initial direct browser `fill` was blocked by the built-in browser virtual clipboard limitation, but the same built-in browser path remained usable through DOM keyboard entry. Safari was not used. Chrome was not used.

## 4. Scenarios Captured

- Beginner build consistency: no benchmark, no watch/app, 3 days/week, fixed Tue/Fri rest.
- Supported 10K: recent 5K benchmark, watch/app, mixed guidance, 4 days/week.
- Half marathon target-time with benchmark: recent 5K, watch/app, pace guidance, 5 days/week.
- Half marathon target-time without benchmark: watch/app plus mixed guidance, no usable benchmark.
- Marathon low-support: beginner/no benchmark, unknown watch, mixed guidance, 4 days/week.
- Ultra: relaxed ultra, no watch, effort-only, 4 days/week.
- Mountain/trail: mountain running, no watch, effort-only, fixed Wed/Sun rest.

All scenarios used the disposable local tester `qa-visual-richness@local.test`; no real user plans were mutated.

## 5. Screenshot Index With Links/Paths

Screenshot folder: `docs/process/screenshots/plan-creation-richness-2026-05-26/`

- [beginner-calendar.png](screenshots/plan-creation-richness-2026-05-26/beginner-calendar.png)
- [beginner-recovery-detail.png](screenshots/plan-creation-richness-2026-05-26/beginner-recovery-detail.png)
- [beginner-long-detail.png](screenshots/plan-creation-richness-2026-05-26/beginner-long-detail.png)
- [supported-10k-calendar.png](screenshots/plan-creation-richness-2026-05-26/supported-10k-calendar.png)
- [supported-10k-interval-detail.png](screenshots/plan-creation-richness-2026-05-26/supported-10k-interval-detail.png)
- [half-target-calendar.png](screenshots/plan-creation-richness-2026-05-26/half-target-calendar.png)
- [half-threshold-detail.png](screenshots/plan-creation-richness-2026-05-26/half-threshold-detail.png)
- [half-steady-finish-long-detail.png](screenshots/plan-creation-richness-2026-05-26/half-steady-finish-long-detail.png)
- [half-no-benchmark-threshold-detail.png](screenshots/plan-creation-richness-2026-05-26/half-no-benchmark-threshold-detail.png)
- [marathon-calendar.png](screenshots/plan-creation-richness-2026-05-26/marathon-calendar.png)
- [marathon-recovery-detail.png](screenshots/plan-creation-richness-2026-05-26/marathon-recovery-detail.png)
- [marathon-cutback-long-detail.png](screenshots/plan-creation-richness-2026-05-26/marathon-cutback-long-detail.png)
- [ultra-calendar.png](screenshots/plan-creation-richness-2026-05-26/ultra-calendar.png)
- [ultra-time-on-feet-detail.png](screenshots/plan-creation-richness-2026-05-26/ultra-time-on-feet-detail.png)
- [ultra-long-detail.png](screenshots/plan-creation-richness-2026-05-26/ultra-long-detail.png)
- [mountain-calendar.png](screenshots/plan-creation-richness-2026-05-26/mountain-calendar.png)
- [mountain-trail-detail.png](screenshots/plan-creation-richness-2026-05-26/mountain-trail-detail.png)
- [mountain-climbing-detail.png](screenshots/plan-creation-richness-2026-05-26/mountain-climbing-detail.png)

## 6. Calendar Diversity Findings

Passed for the captured visual set.

- Beginner consistency correctly looks conservative rather than flashy: Easy, Recovery, Long, Rest, and Cutback patterns are visible. This is appropriate for a no-benchmark/no-watch beginner.
- Supported 10K visibly introduces Steady, Long, Easy with strides/cutback, and 10K rhythm interval work. It no longer looks like a generic easy-only plan.
- Half marathon target-time calendar shows Threshold/Tempo, Steady, Easy, Long, Cutback, Rest, and later steady-finish long runs. That is visually and coaching-wise richer than copy-paste Easy/Long.
- Marathon low-support stays conservative but not dead: Steady, Recovery, Cutback aerobic, Cutback long, Long, Easy, and Rest all appear without adding hard workouts just for variety.
- Ultra remains mostly Easy/Long/Steady/Recovery by design, but the calendar includes explicit `Ultra time-on-feet durability` and cutback/taper identities. For a relaxed effort-only ultra, this reads safe and specific enough.
- Mountain/trail calendar is the strongest visual variety case: Trail, Hills, Steady, Mountain long-run time-on-feet, Technical trail, Uphill repeats, Rolling hills, Controlled downhill, and Climbing steady identities appear where generated.

## 7. Workout Detail / Segment Findings

Passed for the captured detail pages.

- Beginner recovery and long-run details use three purposeful blocks with warmup/main/cooldown-style guidance, effort cues, identity, calendar icon, goal context, and metric policy.
- 10K rhythm intervals render a full repeat structure: warmup, four work reps, recoveries, and cooldown. Recoveries include guidance, and allowed pace ranges appear only because the scenario has watch/app plus recent 5K plus mixed guidance.
- Half marathon threshold durability renders warmup, threshold blocks, recoveries, cooldown, backend identity metadata, and clear target reasoning.
- Half marathon steady-finish long run renders the intended long-run-specific structure: easy base plus controlled steady finish. This is understandable for a runner.
- Half marathon no-benchmark threshold detail keeps the same useful structure but omits pace and HR targets.
- Marathon recovery and cutback long-run details are structured and runner-readable. The cutback long run uses three blocks and explicitly says it should absorb the block, not become a make-up workout.
- Ultra time-on-feet durability now renders as 60 min / 3 blocks with patient opening, ultra durability body, and controlled finish. The previous one-block blocker is visually fixed.
- Mountain technical trail and climbing steady details now render as 3-block workouts with terrain-control guidance. The previous one-block blocker is visually fixed.

No captured page showed `[object Object]`, blank body, generic route error, or page-level overflow in the built-in browser viewport.

## 8. Metric Target Findings

Passed.

- No captured workout showed HR targets without HR-zone truth.
- Beginner, marathon low-support, ultra, mountain/trail, and half-no-benchmark workouts all showed `PACE TARGETS Not provided` and `HR TARGETS Not provided`.
- Supported 10K and half-with-benchmark workouts showed pace ranges only where allowed by watch/app access, recent 5K truth, and pace/mixed guidance.
- When numeric pace was absent, effort/cue/hint text was present and specific enough to execute.
- Terrain sessions did not contain exact elevation prescriptions.
- The marathon cutback-long detail includes backend-provided “familiar fueling routine if used” focus copy. This is not route-local generic copy; it is bounded backend workout truth and does not prescribe fueling amounts.

## 9. Issues Found

None blocking.

Acceptable-but-watch:

- Beginner build consistency is intentionally simple. It should not be judged against advanced plan variety; the visual pattern is safe but plain.
- Ultra calendar still has a lot of Easy/Long labels. The detail pages make the ultra specificity clear, but future UX could consider exposing exact identity more strongly in dense calendar cells if runners still perceive it as generic.

## 10. Coverage Gaps

- This was visual saved-mode evidence, not live first-plan form completion for every scenario.
- Voice, text authoring, JSON import UI, and active-plan refresh proposal UI were not re-smoked in this visual pass.
- Safari was not used because built-in browser covered the required evidence after DOM keyboard entry.
- Screenshots were captured at the default built-in browser viewport; no dedicated mobile viewport pass was requested or run.

## 11. Recommended Next Role

RUNNING COACH for optional final qualitative review of the screenshots, especially whether the ultra calendar should expose “time-on-feet” more prominently at a glance.

## 12. Verdict

Verdict: Passed.

The covered visual set is safe and credible enough for release-readiness evidence: calendars show scenario-appropriate variety, workout detail pages show meaningful backend-owned segment structure, metric gating is honest, and the previous ultra/mountain under-structured blockers are visually repaired.

## 13. Release-Readiness Follow-Up

Running Coach reviewed the repaired richness evidence and approved Hito plan creation as coach-credible enough for first real users / controlled beta.

This visual pass supersedes the earlier pre-repair partial-pass concerns for S7 ultra and S8 mountain/trail segment structure. Remaining notes are backlog polish, not launch blockers:

- capture one visual screenshot that explicitly shows `Default HR guidance`
- keep improving plain easy/support day detail richness
- consider stronger ultra calendar wording if users still perceive relaxed ultra plans as too Long-heavy
