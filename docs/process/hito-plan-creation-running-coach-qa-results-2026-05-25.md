# Hito Plan Creation Running Coach QA Results - 2026-05-25

## Task

Run Hito plan creation QA scenarios and create a Running Coach handoff report.

## Stage

QA validation

## Date

2026-05-25

## Test Environment

- Repo: local Hito Running workspace.
- Browser: Safari, existing app/browser session.
- Local runtime: Vite dev server at `http://127.0.0.1:8080`.
- Deterministic runtime: `node --import tsx` local harness plus `scripts/validate-plan-authoring-doctrine.ts`.
- Data safety: no live plans were mutated, no Supabase destructive operations were run, and no active-plan refresh was applied.
- Browser Path Preflight: the built-in Codex browser was not used first because this QA task explicitly required Safari. Safari was used in the existing Safari window; a same-window local tab/navigation was used after the current tab did not reliably navigate to localhost. Chrome was not used.

## Matrix Slices Covered

- Core structured plan creation: scenarios A1, A3.
- Long-distance and terrain doctrine: scenarios B5, B7, B8.
- Safety and constraint handling: scenario C13.
- Review and mutation safety: structured draft safety and active-plan refresh/apply safety via deterministic/source validation.
- Workout identity and structure audit: deterministic corpus plus Safari product/DS glyph smoke.
- Glyph and icon audit: Safari saved-mode calendar/home smoke for visible labels/glyphs available in the fixture, plus `/hitoDS` glyph reference for the full approved label set.

## Checks Run

- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`
  - Result: passed.
  - Output: `Plan authoring doctrine fixtures passed.`
- Local deterministic non-mutating scenario harness:
  - Result: passed for covered scenario generation and review checks.
- Safari smoke:
  - Result: passed for covered `/`, Open plan modal, and `/hitoDS#patterns` checks.
- `git diff --check`
  - Result: run after report creation, passed.
- `npm run build`
  - Result: run after report creation, passed with existing non-blocking build warnings.

## Scenario Results

### A1 - Beginner, no watch/app, unknown benchmark, build consistency, 3 days/week

- Route/path or script: local deterministic structured authoring harness.
- Goal type: `build_consistency`.
- Runner level: `returning_runner`.
- Frequency: 3 days/week.
- Rest days: none fixed.
- Target date/time: none.
- Result: passed with coaching concern.
- Generated plan summary:
  - Workout count: 56.
  - Non-rest workouts: 24.
  - Type counts: `steady_or_easy` 2, `easy` 10, `long_run` 8, `quality` 3, `tempo` 1, `rest` 32.
  - Source identities included `steady_aerobic_run`, `easy_aerobic_run`, `long_aerobic_run`, `time_intervals`, `distance_intervals`, `controlled_tempo_session`, `cutback_aerobic_run`, `cutback_long_run`, `taper_tuneup_run`, and `taper_long_run`.
  - Long-run progression: first 7.2 km, peak 9.2 km, final 5.1 km.
  - Cutback sessions: 2.
  - Pace targets: 0.
  - HR targets: 0.
  - Rest-day violations: 0.
- Observations:
  - The plan stays metric-safe: no fake pace or HR targets.
  - The review assumptions call out missing 5K benchmark, default horizon, and minimal strength/mobility.
  - The plan contains more exact quality identities than expected for a pure beginner consistency plan.

### A3 - Regular runner, watch/app, recent 5K, balanced 10K, 4 days/week

- Route/path or script: local deterministic structured authoring harness.
- Goal type: `10k`.
- Runner level: `consistent_runner`.
- Frequency: 4 days/week.
- Rest days: none fixed.
- Target date/time: none.
- Result: passed.
- Generated plan summary:
  - Workout count: 70.
  - Non-rest workouts: 40.
  - Type counts: `easy` 17, `steady_or_easy` 10, `long_run` 10, `quality` 3, `rest` 30.
  - Source identities included `aerobic_strides`, `steady_aerobic_run`, `long_aerobic_run`, `easy_aerobic_run`, `cutback_aerobic_run`, `cutback_long_run`, `10k_rhythm_intervals`, `taper_tuneup_run`, and `taper_long_run`.
  - Long-run progression: first 8 km, peak 15 km, final 8.3 km.
  - Cutback sessions: 4.
  - Pace targets: 46.
  - HR targets: 0.
  - Rest-day violations: 0.
- Observations:
  - Pace targets appear only with watch/app plus custom recent 5K truth.
  - Workout identities are goal-family appropriate for 10K.
  - No numeric HR targets are emitted.

### B5 - Balanced marathon, no benchmark, watch unknown, 4 days/week

- Route/path or script: local deterministic structured authoring harness.
- Goal type: `marathon`.
- Runner level: `consistent_runner`.
- Frequency: 4 days/week.
- Rest days: none fixed.
- Target date/time: none.
- Result: passed.
- Generated plan summary:
  - Workout count: 112.
  - Non-rest workouts: 64.
  - Type counts: `steady_or_easy` 27, `long_run` 16, `easy` 21, `rest` 48.
  - Source identities included `steady_aerobic_run`, `long_aerobic_run`, `easy_aerobic_run`, `cutback_aerobic_run`, `cutback_long_run`, `marathon_steady_specificity`, `long_run_with_steady_finish`, `taper_tuneup_run`, and `taper_long_run`.
  - Long-run progression: first 12 km, peak 30 km, final 16.5 km.
  - Cutback sessions: 6.
  - Pace targets: 0.
  - HR targets: 0.
  - Rest-day violations: 0.
- Observations:
  - Marathon long-run progression is meaningfully stronger than short-goal fixtures.
  - Taper final long run is below the peak.
  - Review assumptions include conservative marathon/unknown benchmark support.

### B7 - Relaxed ultra marathon, no watch, unknown benchmark, 4 days/week

- Route/path or script: local deterministic structured authoring harness.
- Goal type: `ultra_marathon`.
- Runner level: `consistent_runner`.
- Frequency: 4 days/week.
- Rest days: none fixed.
- Target date/time: none.
- Result: passed.
- Generated plan summary:
  - Workout count: 140.
  - Non-rest workouts: 80.
  - Type counts: `steady_or_easy` 13, `easy` 47, `long_run` 20, `rest` 60.
  - Source identities included `steady_aerobic_run`, `easy_aerobic_run`, `long_aerobic_run`, `cutback_aerobic_run`, `cutback_long_run`, `ultra_time_on_feet_durability`, `taper_tuneup_run`, and `taper_long_run`.
  - Long-run progression: first 14 km, peak 34 km, final 18.7 km.
  - Cutback sessions: 8.
  - Pace targets: 0.
  - HR targets: 0.
  - Rest-day violations: 0.
- Observations:
  - Ultra plans use time-on-feet/durability identities rather than 10K-style sharpening.
  - No fake pace, HR, or elevation specificity was observed.
  - Long-run peak is materially above the earlier shallow-cap concern.

### B8 - Mountain running, fixed Wednesday/Sunday rest, no watch, unknown benchmark

- Route/path or script: local deterministic structured authoring harness.
- Goal type: `mountain_running`.
- Runner level: `consistent_runner`.
- Frequency: 4 days/week.
- Rest days: Wednesday, Sunday.
- Target date/time: none.
- Result: passed.
- Generated plan summary:
  - Workout count: 84.
  - Non-rest workouts: 48.
  - Type counts: `easy` 19, `steady_or_easy` 14, `long_run` 12, `quality` 3, `rest` 36.
  - Source identities included `technical_trail_easy`, `steady_aerobic_run`, `mountain_long_run_time_on_feet`, `cutback_aerobic_run`, `easy_aerobic_run`, `cutback_long_run`, `uphill_repeats`, `rolling_hills_session`, `climbing_steady_run`, `controlled_downhill_durability`, `taper_tuneup_run`, and `taper_long_run`.
  - Long-run progression: first 10 km, peak 26 km, final 14.3 km.
  - Cutback sessions: 4.
  - Pace targets: 0.
  - HR targets: 0.
  - Rest-day violations: 0.
- Observations:
  - Mountain/trail doctrine appears deterministic and terrain-specific.
  - Fixed Wednesday/Sunday rest-day invariants were preserved.
  - No exact elevation prescription or road-race sharpening leakage was observed.

### C13 - Heart-rate preference without HR-zone truth

- Route/path or script: local deterministic structured authoring harness.
- Goal type: `half_marathon`.
- Runner level: `consistent_runner`.
- Frequency: 4 days/week.
- Rest days: none fixed.
- Target date/time: none.
- Result: passed.
- Generated plan summary:
  - Workout count: 84.
  - Non-rest workouts: 48.
  - Type counts: `steady_or_easy` 15, `long_run` 12, `easy` 16, `tempo` 5, `rest` 36.
  - Source identities included `steady_aerobic_run`, `long_aerobic_run`, `easy_aerobic_run`, `cutback_aerobic_run`, `cutback_long_run`, `half_marathon_threshold_durability`, `long_run_with_steady_finish`, `taper_tuneup_run`, and `taper_long_run`.
  - Long-run progression: first 10 km, peak 20 km, final 11 km.
  - Cutback sessions: 4.
  - Pace targets: 0.
  - HR targets: 0.
  - Rest-day violations: 0.
- Observations:
  - Review metric policy states that heart-rate preference is noted, but numeric HR targets are omitted until real HR-zone truth exists.
  - No `hr_bpm_range` was emitted.

## Review And Mutation Safety Observations

- Structured draft review was validated through deterministic review construction, not live DB mutation.
- Covered draft/review behavior remained non-mutating in the local harness.
- Active-plan refresh/apply exact-draft safety was covered by the doctrine script and source-backed deterministic checks.
- The doctrine fixture suite passed the following safety families:
  - exact refresh draft and checksum/fingerprint coverage
  - stale proposal rejection
  - fixed rest-day preservation
  - logged/evidence-backed workout boundary protection
  - no hidden HR targets without HR-zone truth
  - pace targets only with watch/app plus pace/mixed plus usable recent benchmark truth
- Safari Open plan smoke confirmed the saved-mode refresh entry point is reachable without triggering an apply mutation.

## Workout Identity Observations

- Covered exact identities include:
  - `easy_aerobic_run`
  - `steady_aerobic_run`
  - `long_aerobic_run`
  - `long_run_with_steady_finish`
  - `controlled_tempo_session`
  - `time_intervals`
  - `distance_intervals`
  - `10k_rhythm_intervals`
  - `half_marathon_threshold_durability`
  - `marathon_steady_specificity`
  - `ultra_time_on_feet_durability`
  - `technical_trail_easy`
  - `uphill_repeats`
  - `rolling_hills_session`
  - `climbing_steady_run`
  - `controlled_downhill_durability`
  - `cutback_aerobic_run`
  - `cutback_long_run`
  - `taper_tuneup_run`
  - `taper_long_run`
- Across covered scenarios, generic `Quality` was not overused in deterministic source identities, though visible product mapping can still intentionally collapse unknown exact quality to `Quality`.
- Segment detail rendering was not exhaustively browser-opened in this pass; source/deterministic coverage confirms identities and target gating, while browser coverage focused on calendar/home visible semantics.

## Glyph And Label Observations

- Safari saved-mode home/calendar at approximately 700px rendered visible labels/glyph kinds for:
  - Easy
  - Rest
  - Intervals
  - Long
- The same Safari page had no page-level horizontal overflow.
- `/hitoDS#patterns` rendered the complete approved glyph reference set:
  - Easy
  - Recovery
  - Long
  - Tempo
  - Intervals
  - Progression
  - Race
  - Quality
  - Rest
- No observed mismatch between available product labels and glyph semantics in the saved-mode fixture.

## Findings And Concerns

### RC-1 - Beginner consistency plan may include more quality identities than expected

- Scenario id/name: A1 - Beginner/no-watch/unknown benchmark/build consistency.
- Route/path or script: local deterministic structured authoring harness.
- Expected behavior: mostly easy running, conservative weekly long run, no pace targets, effort/cue language only.
- Observed behavior: no pace or HR targets were emitted and rest-day safety passed, but the generated plan included `time_intervals`, `distance_intervals`, `controlled_tempo_session`, and `taper_tuneup_run`.
- Severity: acceptable but could improve.
- Likely owner: RUNNING COACH.
- Question: should beginner `build_consistency` remain almost entirely easy/long/recovery, or is this light quality exposure acceptable when no metric targets are attached?

### RC-2 - Beginner input mapped to `returning_runner`

- Scenario id/name: A1 - Beginner/no-watch/unknown benchmark/build consistency.
- Route/path or script: local deterministic structured authoring harness.
- Expected behavior: beginner/current-level semantics should be conservative and clear.
- Observed behavior: deterministic summary reported runner level as `returning_runner`.
- Severity: future coaching enhancement.
- Likely owner: RUNNING COACH.
- Question: should `beginner` and `new_to_running` be more explicitly separated in QA expectations, or should this scenario use `new_to_running` when QA expects a true novice plan?

## Explicit Questions For Running Coach

1. Is A1's light interval/tempo/taper-tuneup exposure acceptable for a beginner consistency plan when there are no numeric targets, or should the generator suppress those identities for this profile?
2. Should QA treat `fitnessLevel: beginner` as distinct from `new_to_running`, or should the product map beginner consistency plans to a more novice level by default?
3. Are the default long-run peaks observed here appropriate for unsupported default horizons: marathon 30 km, ultra 34 km, mountain 26 km?
4. For watch/app plus recent 5K 10K plans, is the observed pace-target density acceptable, or should pace appear on fewer segments?
5. Should future QA require at least one browser-opened workout detail per exact family to inspect segment text, repeat recovery guidance, and target/cue rendering?

## Coverage Gaps

- Full matrix scenarios not directly generated in this proof pass: A2, A4, B6, B9, B10, C11, C12, C14, D16, D17, D18, and live D19.
- Voice, text authoring, and JSON import paths were not live-executed; they were covered indirectly through source/deterministic doctrine checks and current-system contract review.
- No live OpenAI calls were run.
- No linked Supabase persistence or disposable tester cleanup was needed because no DB-mutating plan creation or refresh apply was run.
- No actual active-plan refresh proposal/apply mutation was executed.
- Product calendar fixture did not contain every approved label in one saved-mode plan; full glyph set was verified in `/hitoDS`, while product smoke covered the available saved-mode labels.

## Verdict

Passed for the covered high-risk QA slice. The current deterministic authoring and visible-glyph behavior are safe enough for Running Coach audit, with RC-1 and RC-2 handed off as coaching-quality questions rather than release blockers.
