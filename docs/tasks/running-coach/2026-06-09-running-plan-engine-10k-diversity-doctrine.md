# Running Plan Engine 10K Diversity Doctrine

Date: 2026-06-09
Owner: Running Coach
Status: Proposed source-of-truth for Backend Slice R4B
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

## Accepted Goal

Define the smallest deterministic 10K diversity policy that keeps the rebuilt engine coach-credible without adding fake precision, two-quality-week logic, benchmark dependency, or AI.

This doctrine is for the normal deterministic 10-week 10K engine path only.

## Scope And Contract

- Family: `10K`
- Horizon: `10 weeks`
- Output mode: watch-executable numeric structure
- Pace: not required and not invented
- HR: editable Hito default HR only when already allowed by contract, never presented as personal truth
- Maximum development density: `1` development touch per week in v1
- Development touches in this slice:
  - `strides`
  - `tempo`
  - `intervals`
  - `hills`
- Explicitly out of scope for 10K v1:
  - `threshold`
  - advanced two-quality weeks
  - race-pace precision
  - benchmark-dependent pace logic

## Coaching Decision

1. A credible deterministic 10K plan should include intervals in v1 for supported runners when `loadContext` is `standard`.
2. A credible deterministic 10K plan must not require intervals for `beginner_new_runner`.
3. `threshold` should not appear in 10K v1 for any runner level. It is unnecessary for this slice and not needed to avoid generic filler.
4. `hills` are a valid 10K diversity tool for supported runners when `loadContext` is `standard`, but they are secondary to getting one interval exposure into the block.
5. A plan that only rotates `strides` and `tempo` across the full 10-week block is too thin for supported 10K runners and should fail QA.

## Definitions

### Development Touch

A non-long-run development day selected from:

- `strides`
- `tempo`
- `intervals`
- `hills`

`easy`, `recovery`, `long_run`, `cutback_long_run`, and `final_selected_distance_day` are not counted as development touches.

### Conservative Downgrade

Use the existing builder `loadContext === "conservative"` as the downgrade trigger.

Conservative downgrade rules:

- never force `intervals`
- never force `hills`
- prefer `strides`
- allow `tempo` only for non-beginner levels when recovery spacing still stays clean

The absence of intervals is acceptable only when it is an explicit conservative downgrade, not as the default standard-load 10K pattern.

## Runner-Level Diversity Matrix

| Runner level | Intervals in v1 | Hills in v1 | Tempo in v1 | Strides in v1 | Max development touches/week | Minimum acceptable diversity across 10 weeks | Forbidden outputs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `beginner_new_runner` | Forbidden | Forbidden | Forbidden in normal v1 10K preview | Required | 1 | `easy`, `recovery`, `long_run`, `cutback_long_run`, `strides`, `final_selected_distance_day` | `intervals`, `hills`, `threshold`, back-to-back moderate weeks that remove recovery shape |
| `sometimes_runs` + `standard` | Required at least once | Allowed at most once | Required at least once | Required | 1 | `easy`, `recovery`, `long_run`, `cutback_long_run`, `strides`, `tempo`, `intervals`, `final_selected_distance_day` | no-interval block, `threshold`, development day next running slot after long run |
| `sometimes_runs` + `conservative` | Optional downgrade to none | Forbidden | Allowed at most once | Required | 1 | `easy`, `recovery`, `long_run`, `cutback_long_run`, `strides`, optional `tempo`, `final_selected_distance_day` | forced intervals or hills, generic support-only final two weeks |
| `runs_a_lot` + `standard` | Required at least once | Required at least once | Required at least once | Required | 1 | `easy`, `recovery`, `long_run`, `cutback_long_run`, `strides`, `tempo`, `intervals`, `hills`, `final_selected_distance_day` | `threshold`, two development touches in one week, quality adjacency to long run when another slot exists |
| `runs_a_lot` + `conservative` | Optional downgrade to `tempo` | Forbidden | Required at least once | Required | 1 | `easy`, `recovery`, `long_run`, `cutback_long_run`, `strides`, `tempo`, `final_selected_distance_day` | forced hills, repeated interval weeks under conservative load |
| `professional_competitive` + `standard` | Required at least once | Required at least once | Required at least once | Required | 1 in this v1 engine | `easy`, `recovery`, `long_run`, `cutback_long_run`, `strides`, `tempo`, `intervals`, `hills`, `final_selected_distance_day` | `threshold`, advanced two-quality density masquerading inside one-week structure, support-only collapse |
| `professional_competitive` + `conservative` | Optional downgrade to `tempo` | Forbidden | Required at least once | Required | 1 | `easy`, `recovery`, `long_run`, `cutback_long_run`, `strides`, `tempo`, `final_selected_distance_day` | forced intervals or hills when recovery risk is already elevated |

## Week-By-Week 10K Development Touch Policy

This table defines the canonical weekly development windows. Backend may move the touch to another valid weekday, but it must preserve the week identity and spacing rules.

| Week | Phase intent | `beginner_new_runner` | `sometimes_runs` | `runs_a_lot` | `professional_competitive` | Long-run rule |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Settle into routine | no development touch required | no development touch required | no development touch required | no development touch required | `long_run` |
| 2 | Early neuromuscular touch | `strides` required | `strides` required | `strides` required | `strides` required | `long_run` |
| 3 | First development build | easy or strides only | `tempo` required unless conservative downgrade | `tempo` required unless conservative downgrade | `tempo` required unless conservative downgrade | `long_run` |
| 4 | Cutback absorb | no sharper than `strides` | no sharper than `strides` | no sharper than `strides` | no sharper than `strides` | `cutback_long_run` required |
| 5 | Main 10K-specific build | `strides` required | `intervals` required when standard, otherwise `tempo` or `strides` | `intervals` required when standard, otherwise `tempo` | `intervals` required when standard, otherwise `tempo` | `long_run` |
| 6 | Absorb / support | no development touch required | no development touch required | no development touch required | no development touch required | `long_run` |
| 7 | Secondary specific build | `strides` required | `tempo` or `hills`; `hills` only when standard and spacing is clean | `hills` required when standard, otherwise `tempo` | `hills` required when standard, otherwise `tempo` | `long_run` |
| 8 | Second cutback | no sharper than `strides` | no sharper than `strides` | no sharper than `strides` | no sharper than `strides` | `cutback_long_run` required |
| 9 | Taper sharpening | `strides` required | `strides` required | `strides` required | `strides` required | reduced `long_run` or normal easy support only; no intervals or hills |
| 10 | Event week | no extra development touch | no extra development touch | no extra development touch | no extra development touch | `final_selected_distance_day` required and must be exact `10000m` |

## Minimum Diversity Gates

### Global 10K Gates

- Every 10K preview must contain:
  - `easy`
  - `recovery`
  - `long_run`
  - `cutback_long_run`
  - `final_selected_distance_day`
- Every 10K preview must end with `final_selected_distance_day` as the last non-rest row.
- Every 10K preview must keep `final_selected_distance_day` exact at `10000m`.

### Supported-Runner Diversity Gates

For `sometimes_runs`, `runs_a_lot`, and `professional_competitive` under `standard` load:

- at least `1` `strides` week
- at least `1` `tempo` week
- at least `1` `intervals` week
- at least `2` cutback weeks anchored by `cutback_long_run`

Additional standard-load gates:

- `runs_a_lot` must also contain at least `1` `hills` week
- `professional_competitive` must also contain at least `1` `hills` week

### Beginner Gate

For `beginner_new_runner`:

- `strides` are the only allowed development touch
- the block must stay clearly easier than supported 10K variants
- diversity must come from rhythm, cutback shape, recovery placement, and watch-executable segment detail, not from forced intensity

## Recovery Spacing Gates

Backend must preserve all of the following:

1. The next actual running slot after `long_run` or `cutback_long_run` must be `recovery` or `easy`.
2. A development touch must not appear on the immediate next actual running slot after `long_run` or `cutback_long_run`.
3. A development touch must not appear on the day immediately before the long run when another viable training day exists that week.
4. The next actual running slot after `intervals` or `hills` must be `easy` or `recovery`.
5. No week may contain more than one development touch.
6. Cutback weeks must not contain `intervals` or `hills`.
7. Final taper week must not contain `intervals`, `hills`, or `tempo`.

## Cutback And Taper Rules

### Cutback Weeks

Weeks `4` and `8` are canonical cutback weeks.

Cutback expectations:

- `cutback_long_run` required
- no `intervals`
- no `hills`
- no `threshold`
- if a development touch exists, it may only be `strides`
- overall week must read as an absorption week, not as a disguised peak week

### Final Two Weeks

Week `9`:

- must not be empty support filler
- must include `strides` for all runner levels
- must avoid sharp volume
- must not use `intervals` or `hills`

Week `10`:

- must foreground `final_selected_distance_day`
- all other non-rest days must stay `easy` or `recovery`
- must not try to compensate for missing prior specificity with a late hard session

## Forbidden Outputs

Backend should reject a 10K preview if any of the following are true:

- `threshold` appears anywhere in a 10K preview
- `beginner_new_runner` receives `intervals` or `hills`
- supported standard-load 10K preview contains no `intervals`
- `runs_a_lot` or `professional_competitive` standard-load preview contains no `hills`
- development touches are only `strides` and `tempo` across the full 10-week block for supported standard-load runners
- week `9` is support-only with no sharpening touch
- cutback week contains `intervals` or `hills`
- development touch appears as the next actual running slot after a long run
- final non-rest row is not `final_selected_distance_day`
- final endpoint is not exact `10000m`

## Backend Handoff Summary

Backend should replace the current week-number-only development selector with a small deterministic 10K diversity table keyed by:

- `runnerLevel`
- `loadContext`
- `weekNumber`

Minimum backend policy requirements:

1. Keep `threshold` unavailable for `10K`.
2. Keep `beginner_new_runner` on `strides`-only development.
3. Require at least one `intervals` week for supported standard-load runners.
4. Require at least one `tempo` week for supported runners.
5. Require at least one `hills` week for `runs_a_lot` and `professional_competitive` when `loadContext` is `standard`.
6. Preserve the current recovery-after-long-run rule and extend the same recovery-first logic after `intervals` and `hills`.
7. Preserve canonical cutback weeks at `4` and `8`.
8. Preserve week `9` as sharpening-light, not empty and not hard.
9. Preserve week `10` as endpoint week with no late compensatory quality.

## QA Failure Criteria

QA should fail the preview if:

- supported standard-load 10K has zero interval exposure
- supported standard-load 10K shows only one development family repeated mechanically
- supported standard-load 10K uses only `strides` plus `tempo`
- cutback weeks are not visibly easier than the surrounding load
- final two weeks become generic `easy` / `recovery` filler until the endpoint
- `beginner_new_runner` is made to look rich by unsafe intensity
- recovery spacing after long runs or sharper work is violated
- the visible calendar reads like a generic aerobic block rather than a 10K block

## Notes For Product And QA

- This doctrine does not require pace targets.
- This doctrine does not require personal HR truth.
- This doctrine does not require a 5K benchmark.
- This doctrine does require visible 10K identity through controlled variation of session type and week shape.
- If `professional_competitive` cannot be made credible within one development touch per week, that is a separate future scope decision, not a reason to keep all supported 10K runners on `strides` plus `tempo` only.
