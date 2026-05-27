# Hito AI First-Plan Blueprint Visual Review — 2026-05-27

## Browser Path Preflight

- Built-in Codex browser was not callable in this session, so the review used local headless Chromium automation against loopback first.
- Safari fallback was not required.
- All plan creation and screenshots used disposable local test users only.

## Scope

- Goal: inspect saved-mode first-plan output visually before rollout.
- Path used:
  - real saved-mode UI on local loopback
  - structured first-plan backend review/confirm seam
  - disposable users only
- Saved-mode screenshots are in:
  - [screenshots directory](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/)

## Saved Scenario Status

1. Half marathon target time
- Saved plan source kind: `structured_authoring_v1`
- Result: deterministic fallback, not AI-authored
- Fallback reason: `ai_first_plan_blueprint_validation_failed`
- Validation issue:
  - `missing_weekly_long_run: Week 13 needs one long-run intent so backend can preserve durability progression.`
- Visual value: still useful as a regression/control reference, but not valid evidence of AI-authored saved-mode rollout for this scenario.

2. Supported 10K target time
- Saved plan source kind: `ai_first_plan_blueprint_v1`
- Draft status: `repaired_ai_draft`
- Visual result: strong and clearly goal-specific

3. Marathon balanced
- Saved plan source kind: `ai_first_plan_blueprint_v1`
- Draft status: `repaired_ai_draft`
- Visual result: conservative but coach-credible

4. Mountain running balanced
- Saved plan source kind: `ai_first_plan_blueprint_v1`
- Draft status: `repaired_ai_draft`
- Visual result: strongest specialty case in this pass

## Screenshot Index

### Half Marathon

- [half-calendar.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/half-calendar.png)
- [half-threshold-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/half-threshold-detail.png)
- [half-long-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/half-long-detail.png)

### 10K

- [10k-calendar.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/10k-calendar.png)
- [10k-interval-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/10k-interval-detail.png)
- [10k-race-pace-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/10k-race-pace-detail.png)

### Marathon

- [marathon-calendar.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/marathon-calendar.png)
- [marathon-steady-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/marathon-steady-detail.png)
- [marathon-long-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/marathon-long-detail.png)

### Mountain

- [mountain-calendar.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/mountain-calendar.png)
- [mountain-climbing-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/mountain-climbing-detail.png)
- [mountain-long-detail.png](./screenshots/ai-first-plan-blueprint-visual-review-2026-05-27/mountain-long-detail.png)

## Coaching Assessment

## 1. Half marathon target time

- Calendar is visibly better than the old generic saved path, but this is still not rollout-grade evidence for AI-first because the saved plan fell back before persistence.
- The saved July calendar does show threshold durability, cutback, and steady-finish logic rather than pure filler.
- Workout details are runner-usable:
  - threshold workout shows executable block structure
  - default HR is clearly labelled estimated, not personalized
  - long run shows steady-finish intent rather than an empty duration bar
- The blocker is not visual thinness here. The blocker is that AI-authored save did not survive validation for this scenario.

## 2. Supported 10K target time

- This is the cleanest road-performance proof in the pass.
- Calendar shows real 10K specificity:
  - intervals
  - race pace
  - tempo
  - recovery
  - cutback/taper long-run logic
- Detail pages are clearly executable:
  - `10K rhythm intervals` shows repeat/recovery structure and pace only where benchmark/watch support allows it
  - `Race pace session` keeps pace bounded and explicitly effort-led if backend pace truth does not justify more
- This feels coach-authored, not template-slotted.

## 3. Marathon balanced

- Calendar stays conservative, but it no longer looks empty.
- `Marathon Steady Specificity` is visibly different from generic steady filler.
- `Long Run with Steady Finish` is structured and purposeful.
- Default estimated HR remains clearly bounded.
- This is credible for beginner/low-support marathon onboarding.

## 4. Mountain running balanced

- This is the strongest runner-facing scenario in the screenshot set.
- Calendar shows obvious terrain-specific variety:
  - hills
  - trail
  - climbing steady
  - downhill durability
  - mountain long runs
- Long-run detail is excellent:
  - time-on-feet framing
  - hike/run logic
  - fueling checkpoint
  - controlled descents
- `Climbing-focused steady run` also reads like actual mountain training, not renamed road running.

## Findings

- Saved-mode UI is capable of rendering rich AI-authored output well when the reviewed draft persists as `ai_first_plan_blueprint_v1`.
- 10K, marathon, and mountain scenarios look coach-credible and user-facing useful.
- Default HR guidance presentation is honest:
  - clearly labelled default/estimated
  - never presented as personalized HR zones
- Pace targets appear only in the supported 10K case, which is correct.
- Long-run identity and specialty identity survive saved mode in the working AI scenarios.

## Issues Found

- Half-marathon target-time remains a release blocker for broad rollout from the AI-first path.
- The failure is not a generic timeout in this shortened scenario.
- It is a backend blueprint validation failure on long-run intent coverage:
  - `missing_weekly_long_run: Week 13 needs one long-run intent so backend can preserve durability progression.`
- Because of that, the visually reviewed half scenario is persisted deterministic fallback, not true AI-first saved mode.

## Verdict

- `10K`: pass
- `Marathon balanced`: pass
- `Mountain running`: pass
- `Half marathon target time`: fail for AI-first rollout evidence in this pass

Overall verdict:

- Saved-mode AI blueprint output is visually strong enough for user-facing rollout in the scenarios that persisted as `ai_first_plan_blueprint_v1`.
- Broad rollout is not yet fully safe because a core half-marathon target-time scenario still falls back before save.
- Recommended release posture:
  - approve rollout only with scenario gating or after Backend repairs the half-marathon long-run-intent validation failure and QA reruns this saved-mode visual pass.
