# Hito Plan Creation Richness QA Results - 2026-05-26

## Release-Readiness Supersession Note

This artifact preserves the original representative richness QA findings.

The original partial-pass verdict below is now superseded by later repair/rerun evidence:

- S7 ultra time-on-feet durability and S8 mountain/trail under-structured issues were repaired by backend segment-structure work.
- Visual QA in `docs/process/hito-plan-creation-visual-richness-qa-2026-05-26.md` passed after the repair.
- Screenshot evidence in `docs/process/screenshots/plan-creation-richness-2026-05-26/` shows ultra time-on-feet, technical trail, and climbing steady workouts rendering useful multi-block detail.
- Running Coach approved Hito plan creation as coach-credible enough for first real users / controlled beta.

Current release-readiness verdict: Passed for controlled beta. No launch blockers remain.

Backlog polish, not blockers:

- capture one visual screenshot that explicitly shows `Default HR guidance`
- keep improving plain easy/support day detail richness
- consider stronger ultra calendar wording if users still perceive relaxed ultra plans as too Long-heavy

## 1. Task

Run the full Hito plan creation richness QA matrix as a representative release-gate proof pass.

## 2. Stage

QA validation / release-gate proof pass.

## 3. Browser Path Preflight

Built-in Codex app/browser was used first for browser QA and covered the saved-mode calendar/workout-detail fixture. Safari was not used in this pass. Chrome was not used.

## 4. Matrix Coverage

Covered the requested release-gate subset:

- S1 beginner build consistency, 3 days/week, no benchmark, no watch/app, fixed rest days.
- S2 intermediate 5K target-time, recent 5K, watch/app, pace guidance, 4 days/week.
- S3 intermediate 10K balanced, mixed guidance, 4 days/week.
- S4 half marathon target-time, no benchmark, watch/app plus mixed guidance, 5 days/week.
- S5 half marathon target-time, recent 5K, watch/app plus pace guidance, 5 days/week.
- S6 marathon balanced, low-support, no benchmark, mixed/unknown execution, 4 days/week.
- S7 ultra relaxed, long horizon, no watch, effort-only.
- S8 mountain/trail, fixed rest days, no watch, unknown benchmark.
- S9 saved-mode rich fixture using `qa-rich-workout@local.test`.
- S10 active-plan refresh proposal smoke on the disposable rich fixture.

Commands/checks:

- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts` passed.
- Built-in browser saved-mode fixture smoke passed.
- Disposable fixture creation and cleanup passed.
- Build was not run because QA changed only this markdown artifact; the current known local build risk is the unrelated iCloud/FileProvider duplicate template hang noted in prior QA.

## 5. Scenario Results

### S1 - Beginner Build Consistency

- Result: Passed for safety; acceptable coaching quality.
- Plan: `Build consistency · Relaxed`, 8 weeks, 24 non-rest workouts.
- Families: easy 10, recovery 6, long 8, rest 32.
- Identities: `easy_aerobic_run`, `recovery_jog`, `long_aerobic_run`, `cutback_aerobic_run`, `cutback_long_run`, `taper_long_run`.
- Hard days: 0.
- Pace targets: 0. HR targets: 0.
- Fixed-rest violations: 0.
- Review says: `No regular quality day; runs stay mostly easy.`
- Concern: final 5.1 km `taper_long_run` is one segment. I do not classify this as blocker because it is short, but it is less polished than the newer longer taper/cutback structure.

### S2 - 5K Target-Time With Recent Benchmark

- Result: Passed.
- Plan: `5K · Target time · 00:21:00`, 12 weeks, 46 non-rest workouts.
- Families: intervals 5, race 1, steady 12, easy 15, recovery 2, long 11, rest 34.
- Key identities: `5k_sharpening_repeats`, `easy_run_with_strides`, `steady_aerobic_run`, `long_run_with_steady_finish`, `taper_tuneup_run`.
- Pace targets: 118, correctly gated by watch/app plus recent 5K plus pace guidance.
- HR targets: 0.
- Review honestly flags the target as aggressive against the supplied 5K benchmark.
- Long run: 8.0 km first, 13.5 km peak, 10.3 km taper; taper does not contain peak.

### S3 - 10K Balanced

- Result: Passed.
- Plan: `10K · Balanced`, 10 weeks, 40 non-rest workouts.
- Families: tempo 3, race 2, steady 10, easy 13, recovery 2, long 10, rest 30.
- Key identities: `controlled_tempo_session`, `easy_run_with_strides`, `steady_aerobic_run`, `taper_tuneup_run`.
- Pace targets: 0 because no usable benchmark was supplied, despite mixed guidance and watch/app availability.
- HR targets: 0.
- Long run: 8.0 km first, 15.0 km peak, 8.3 km taper; taper does not contain peak.
- Note: this no-benchmark 10K case uses tempo/tune-up rather than `10k_rhythm_intervals`. That is acceptable for this input because the matrix allows rhythm/interval/tempo variety where appropriate.

### S4 - Half Marathon Target-Time Without Benchmark

- Result: Passed.
- Plan: `Half marathon · Target time · 01:50:00`, 17 weeks, 84 non-rest workouts.
- Families: tempo 7, race 1, steady 21, easy 32, recovery 6, long 17, rest 34.
- Key identities: `half_marathon_threshold_durability`, `long_run_with_steady_finish`, `cutback_long_run`, `taper_long_run`.
- Pace targets: 0. HR targets: 0.
- Review explicitly says target-time intent is noted but the draft stays effort-based without a recent 5K benchmark.
- Long run: 10.0 km first, 20.5 km peak, 11.3 km taper; taper does not contain peak.

### S5 - Half Marathon Target-Time With Recent 5K

- Result: Passed.
- Plan: `Half marathon · Target time · 01:45:00`, 17 weeks, 84 non-rest workouts.
- Families match S4, with pace-enabled segment targets.
- Key identities: `half_marathon_threshold_durability`, `long_run_with_steady_finish`, `cutback_long_run`, `taper_long_run`.
- Pace targets: 248, correctly gated by watch/app plus recent 5K plus pace guidance.
- HR targets: 0.
- Review flags the target as aggressive against the supplied benchmark.
- Long run: 10.0 km first, 22.0 km peak, 12.1 km taper; taper does not contain peak.

### S6 - Marathon Balanced Low-Support

- Result: Passed.
- Plan: `Marathon · Balanced`, 16 weeks, 64 non-rest workouts.
- Families: easy 22, recovery 10, steady 16, long 16, rest 48.
- Hard days: 0, appropriately conservative for beginner/no-benchmark/low-support context.
- Key identities: `recovery_jog`, `cutback_aerobic_run`, `long_run_with_steady_finish`, `cutback_long_run`, `taper_long_run`.
- Pace targets: 0. HR targets: 0.
- Review includes conservative marathon support assumptions.
- Long run: 12.0 km first, 27.0 km peak, 14.9 km taper; taper does not contain peak.
- Product credibility: safe and varied enough; not copy-paste Easy/Long only.

### S7 - Ultra Relaxed Effort-Only

- Result: Safety passed; coaching-quality issue found.
- Plan: `Ultra marathon · Relaxed`, 20 weeks, 80 non-rest workouts.
- Families: easy 38, recovery 6, steady 5, long 28, race 3, rest 60.
- Key identities: `ultra_time_on_feet_durability`, `long_aerobic_run`, `cutback_long_run`, `taper_long_run`.
- Pace targets: 0. HR targets: 0.
- Long run: 14.0 km first, 34.0 km peak, 18.7 km taper; taper does not contain peak.
- Issue: 8 `ultra_time_on_feet_durability` workouts are single-segment long-family sessions, typically 65-70 minutes. They are safe effort-only sessions, but not rich enough for the “workout detail / segment structure” bar.

### S8 - Mountain/Trail Fixed-Rest Plan

- Result: Safety passed; coaching-quality issue found.
- Plan: `Mountain running · Balanced`, 12 weeks, 48 non-rest workouts.
- Families: trail 14, hills 5, steady 12, easy 9, recovery 2, long 4, race 2, rest 36.
- Key identities: `technical_trail_easy`, `mountain_long_run_time_on_feet`, `rolling_hills_session`, `uphill_repeats`, `climbing_steady_run`, `controlled_downhill_durability`.
- Pace targets: 0. HR targets: 0.
- Fixed Wednesday/Sunday rest violations: 0.
- Long run: 10.0 km first, 26.0 km peak, 14.3 km taper; taper does not contain peak.
- Issue: 6 `technical_trail_easy` workouts and 2 `climbing_steady_run` workouts are single-segment despite being trail/hill-specific sessions. `rolling_hills_session`, `controlled_downhill_durability`, and mountain long runs are structured well.

### S9 - Saved-Mode Rich Fixture

- Result: Passed.
- Seeded fixture: `qa-rich-workout@local.test`.
- Created exactly one active saved-mode plan with 4 workouts.
- Stored rich rows: `steady_aerobic_run`, `rolling_hills_session`, `technical_trail_easy`.
- Compact-only fallback row: `Controlled tempo session`, correctly rendered as Tempo via fallback.
- Browser calendar labels: Steady, Hills, Trail, Tempo.
- Workout detail pages opened for steady, hills, trail, and compact fallback tempo.
- Detail pages showed workout structure, segment guidance, cue/hint/effort, rich metadata sections, and no `[object Object]`.
- No generic local HR drift, cadence `~175`, fueling, hydration/weather, or fake metric copy appeared.
- Disposable tester cleanup succeeded.

### S10 - Active-Plan Refresh Proposal

- Result: Passed.
- Fixture: disposable `qa-rich-workout@local.test`.
- Action: generated one proposal only; did not apply.
- Result: `ok: true`.
- Elapsed: 78,779 ms.
- `refreshDraft.richWorkoutDraftMetadata.status`: `deterministic_fallback`.
- `fallbackReason`: `rich_draft_timed_out`.
- Draft checksum: present.
- Active plan count before/after: 1 -> 1.
- Plan `updated_at` before/after: unchanged.
- Workout count before/after: 4 -> 4.
- Log count before/after: 0 -> 0.
- Plan mutation: false.

## 6. Workout Diversity Findings

The generator is no longer the old generic Easy/Long calendar. Covered plans include meaningful families and identities across easy, recovery, steady, tempo, intervals, hills, trail, race/tune-up, and long-run specificity.

Best signals:

- Beginner consistency is now properly capped away from tempo/interval/race-like work.
- Marathon low-support stays conservative while still using recovery/cutback/steady/long-run variety.
- Half marathon target-time plans use threshold durability and steady-finish long runs.
- Mountain plans include trail/hill/downhill/time-on-feet identities instead of road-with-hills copy.
- Ultra plans avoid road-race sharpening and use time-on-feet durability.

Remaining concern:

- Some exact long/trail/hill identities are still one-block sessions, which makes workout detail less coach-like even though the calendar identity is correct.

## 7. Rich Identity / Icon Findings

Passed for covered surfaces.

- Deterministic plans had `missingRich: 0` across all 8 structured scenarios.
- Saved fixture calendar showed `Steady`, `Hills`, `Trail`, and fallback `Tempo`.
- Workout detail showed rich identity and backend metadata without object rendering errors.
- No covered calendar labels collapsed into generic `Quality` when richer truth existed.

## 8. Workout Detail / Segment Findings

Passed for saved fixture browser coverage, but not fully passed for generated corpus quality.

Browser-confirmed fixture detail:

- Steady: 3 blocks with warmup/main/cooldown and guidance.
- Hills: 14 blocks with repeat/recovery structure and controlled hill effort cues.
- Trail: 3 blocks with terrain-aware warmup/main/cooldown guidance.
- Compact fallback tempo: 3 blocks with warmup/tempo/cooldown guidance.

Generated-corpus concerns:

- S7 ultra: 8 `ultra_time_on_feet_durability` sessions are one segment, despite being long-family durability work.
- S8 mountain: 6 `technical_trail_easy` and 2 `climbing_steady_run` sessions are one segment.
- S1 beginner: final short `taper_long_run` is one segment; acceptable but could be more polished.

## 9. Metric Safety Findings

Passed.

- No scenario emitted HR targets without HR-zone truth.
- No no-benchmark/no-watch scenario emitted pace targets.
- Pace targets appeared only in S2 and S5, where watch/app plus recent 5K plus pace guidance were present.
- Effort/cue language was present when numeric targets were absent.

## 10. Long-Run Findings

Passed for progression, cutback/taper safety, and goal-family differentiation.

- Beginner consistency: 7.2 km -> 9.2 km peak -> 5.1 km taper.
- 5K target-time: 8.0 km -> 13.5 km peak -> 10.3 km taper.
- 10K balanced: 8.0 km -> 15.0 km peak -> 8.3 km taper.
- Half no benchmark: 10.0 km -> 20.5 km peak -> 11.3 km taper.
- Half benchmark: 10.0 km -> 22.0 km peak -> 12.1 km taper.
- Marathon low-support: 12.0 km -> 27.0 km peak -> 14.9 km taper.
- Ultra: 14.0 km -> 34.0 km peak -> 18.7 km taper.
- Mountain: 10.0 km -> 26.0 km peak -> 14.3 km taper.

No taper week contained the peak long run in covered scenarios.

## 11. Review / Saved / Refresh Truth Findings

Passed for covered boundaries.

- Structured reviews include “Nothing has been created yet” safety notes.
- Weak support cases include honest metric/target assumptions.
- Saved fixture persisted exactly one active plan after seed.
- Saved-mode readback matched rich truth where stored and fallback truth where compact-only.
- Refresh proposal returned a signed draft with bounded rich-draft fallback metadata and did not mutate active-plan, workout, or log rows.

Coverage note: this pass did not click through live structured `Yes, create plan` for all generated scenarios. It validated the backend generation/review contract deterministically and used saved-mode fixture/browser evidence for rendering truth.

## 12. Issues Found

### RC-QA-2026-05-26-1 - Ultra time-on-feet durability sessions are under-structured

- Scenario: S7 Ultra relaxed effort-only.
- Route/path or script: deterministic structured authoring harness.
- Expected: ultra durability/time-on-feet work should be runner-readable in workout detail, with purposeful structure unless intentionally short recovery.
- Observed: 8 `ultra_time_on_feet_durability` sessions are single-segment long-family workouts, typically 65-70 minutes.
- Severity: should fix.
- Likely owner: BACKEND with RUNNING COACH acceptance.

### RC-QA-2026-05-26-2 - Some mountain trail/hill sessions are under-structured

- Scenario: S8 Mountain/trail fixed-rest.
- Route/path or script: deterministic structured authoring harness.
- Expected: trail/hill sessions should expose warmup/main/cooldown or equivalent terrain-specific structure where detail/review should show exact session meaning.
- Observed: 6 `technical_trail_easy` and 2 `climbing_steady_run` sessions are single-segment.
- Severity: should fix.
- Likely owner: BACKEND with RUNNING COACH acceptance.

### RC-QA-2026-05-26-3 - Short taper long run still sometimes one-block

- Scenario: S1 Beginner build consistency.
- Route/path or script: deterministic structured authoring harness.
- Expected: taper/cutback long runs should avoid anonymous one-block workouts when duration/distance warrants structure.
- Observed: one 5.1 km `taper_long_run` is one segment.
- Severity: acceptable but could improve.
- Likely owner: RUNNING COACH / BACKEND.

## 13. Coverage Gaps

- Did not run every matrix permutation; this was the requested representative release-gate subset.
- Did not run live first-plan browser creation for all 8 structured scenarios to avoid creating many disposable active plans; deterministic backend review/generation was used for breadth.
- Did not run Voice or text authoring live in this pass; current risk assessment relies on prior QA plus doctrine fixtures.
- Did not apply active-plan refresh; proposal-only safety was the requested release-confidence check.
- Did not perform Safari-specific viewport QA in this pass because the built-in browser covered required route behavior and Safari was not necessary.

## 14. Recommended Next Role

BACKEND, with RUNNING COACH available to define whether technical trail easy and ultra time-on-feet should always split into opener/main/finish or only above a duration threshold.

## 15. Exact Follow-Up Prompt If Running Coach Or Backend Action Is Needed

```md
ROLE: BACKEND

TASK:
Fix under-structured rich workout detail for ultra time-on-feet and mountain/trail support sessions found in the 2026-05-26 plan creation richness QA pass.

STAGE:
BACKEND implementation

CONTEXT:
QA release-gate pass against `docs/process/hito-plan-creation-qa-matrix.md` found no fake metrics, no rest-day violations, and correct rich identity/icon truth, but did find workout-detail richness gaps:
- S7 Ultra relaxed effort-only generated 8 `ultra_time_on_feet_durability` sessions as single-segment long-family workouts, typically 65-70 minutes.
- S8 Mountain/trail generated 6 `technical_trail_easy` and 2 `climbing_steady_run` sessions as single-segment trail/hill workouts.
- S1 Beginner generated one short 5.1 km `taper_long_run` as one segment; this is lower priority unless the implementation can improve it safely.

GOAL:
Keep the current safe metric gating, rest-day invariants, long-run progression, taper/cutback math, and hard-day density unchanged, but make non-short ultra time-on-feet and mountain/trail/hill support sessions render with purposeful segment structure in workout detail.

ACCEPTANCE:
- `ultra_time_on_feet_durability` above a reasonable duration threshold uses opener/main/finish or equivalent time-on-feet structure with backend-owned guidance/cue/hint.
- `technical_trail_easy` above a reasonable duration threshold uses terrain-settle / main trail effort / cooldown or equivalent structure.
- `climbing_steady_run` uses warmup / climbing steady / cooldown or equivalent structure.
- Repeat/hill sessions still include recovery guidance.
- No pace targets are introduced without watch/app plus usable benchmark plus pace/mixed preference.
- No HR targets are introduced without HR-zone truth.
- Fixed rest days remain empty.
- No extra hard days are added only for cosmetic variety.
- Existing doctrine fixtures still pass and add targeted assertions for these under-structured identities.

RUN:
- `npm exec eslint -- src/lib/structured-plan-authoring.ts scripts/validate-plan-authoring-doctrine.ts`
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`
- `git diff --check`
- `npm run build` if executable code changed and the local FileProvider duplicate-template issue is cleared.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## 16. Verdict

Superseded partial pass.

Hito is safe enough on covered release-gate scenarios: no fake pace/HR targets, no rest-day violations, no missing rich fields, and saved-mode rich calendar/detail truth works. It is not a full pass for “ready to show real people” coaching polish because ultra time-on-feet and some mountain trail/hill sessions still appear as one-block workouts where richer segment structure is expected.

This verdict records the initial pre-repair QA state. It is superseded by the later backend repair, visual rerun, screenshot evidence, and Running Coach release-readiness approval described at the top of this file.
