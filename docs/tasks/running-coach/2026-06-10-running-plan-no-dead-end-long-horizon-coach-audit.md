# Running Plan No-Dead-End Long-Horizon Coach Audit

Date: 2026-06-10
Owner: Running Coach
Status: historical audit; superseded by anti-flatness repair acceptance
Stage: RUNNING COACH audit / no-dead-end long-horizon quality check

Doctrine digest:
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/running-coach-doctrine-digest.md`

Primary doctrine:
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md`

## High-Level Verdict

The no-dead-end expansion was directionally correct and materially better than the old runner-level
block behavior, but **not fully accepted yet**.

Accepted:

- `10K` beginner and supported standard-load outputs remained mostly coach-credible.
- `Half Marathon` beginner bridge and conservative supported outputs were broadly coach-credible.
- Structural unavailable reasons became more honest.

Not yet accepted:

- Newly preview-ready long-horizon `Marathon Base` beginner and conservative paths were sometimes
  stretched rather than composed.
- Long runs carried richer detail, but midweek bridge identity disappeared for too long.

## Failure Pattern To Preserve

The core failure was long-horizon flattening:

- horizon auto-extension worked
- cutbacks remained present
- long runs became richer
- but midweek development or bridge identity sometimes vanished for months

That created technically valid plans that read like extended `Easy / Recovery / Long / Cutback`
calendars until late long-run work finally carried all the meaning.

Scenario anchors:

- `matrix__marathon_base__beginner_new_runner__young_light__3d__none__sunday__normal_monday`
- `matrix__marathon_base__beginner_new_runner__young_light__5d__monday_friday__sunday__normal_monday`
- `beginner_marathon_base`
- `matrix__marathon_base__beginner_new_runner__older_heavier__5d__none__unset_default__normal_monday`
- `matrix__marathon_base__runs_a_lot__older_heavier__3d__none__sunday__midweek_wednesday`
- `matrix__10k__sometimes_runs__older_heavier__3d__wednesday_saturday__unset_default__midweek_wednesday`

Accepted examples that should not be over-corrected:

- `schedule_stress__half_marathon__beginner_new_runner__none__sunday__normal_monday`
- `beginner_half_marathon`
- `matrix__half_marathon__runs_a_lot__older_heavier__3d__none__sunday__normal_monday`
- `matrix__10k__professional_competitive__young_light__4d__monday_friday__unset_default__midweek_wednesday`

## Rules Preserved In The Digest

- Auto-extension must add phase meaning, not only calendar length.
- Beginner and conservative Marathon Base need a soft midweek bridge ladder.
- Very long plans need stimulus reintroduction after long flat spans.
- Conservative does not mean blank.
- Long-run role richness is important but cannot carry the whole plan alone.

## Boundaries Not To Change

- endpoint truth
- structural unavailable cases
- fake pace / fake personal HR guardrails
- no-watch / no-app policy
- Marathon Base base-only boundary

## Supersession

This audit created the anti-flatness repair target. The specific blocker was closed by the
2026-06-11 anti-flatness repair acceptance, which should be read next for the final accepted state.
