# Running Plan Engine R6 Half Marathon And Marathon Base Doctrine

Date: 2026-06-09
Owner: Running Coach
Status: Proposed source-of-truth for Backend Slice R6A
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

## Accepted Goal

Define the smallest coach-credible expansion doctrine for the deterministic selected-plan engine beyond the accepted 10K vertical.

This artifact covers:

- `Half Marathon`
- `Marathon Base`

It does not approve a full selected-distance Marathon endpoint in v1.

## Scope Note

This 2026-06-09 artifact is no longer canonical for beginner runner-level eligibility.

That is now governed by:

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-beginner-half-marathon-bridge-plan-contract.md`

All Half-Marathon and Marathon-Base rules below apply to family shape after eligibility is granted under the universal no-dead-end doctrine.

## Canonical Constraints To Preserve

- Hito engine builds the normal plan, not AI.
- Watch/app execution is assumed.
- No normal-path 5K benchmark.
- No fake precise pace.
- No fake personal HR.
- Hito default HR zones are editable/advisory defaults only.
- Numeric/watch-executable structure is primary.
- Cues and RPE remain secondary.
- Runner levels remain:
  - `beginner_new_runner`
  - `sometimes_runs`
  - `runs_a_lot`
  - `professional_competitive`
- Preview remains non-mutating:
  - no persistence
  - no confirm/create
  - no OpenAI
  - no Supabase mutation

## Shared Coaching Decision

1. `Half Marathon` is approved for R6 as an exact selected-distance endpoint family with explicit `21100m` final-day truth.
2. `Marathon` is not approved as a full selected-distance endpoint in this R6 v1 expansion.
3. R6 should ship only honest `Marathon Base`, with a base-durability endpoint and explicit no-full-marathon-readiness overclaim.
4. `beginner_new_runner + Half Marathon` and `beginner_new_runner + Marathon Base` are superseded by the universal auto-extension doctrine; this artifact no longer owns runner-level blocking.
5. The engine must not copy the 10K diversity pattern blindly:
   - Half Marathon should be less interval-led and more durability-led.
   - Marathon Base should be more recovery- and long-run-led, with sharper work tightly limited.

## Runner-Level Eligibility Matrix

| Family | `beginner_new_runner` | `sometimes_runs` | `runs_a_lot` | `professional_competitive` |
| --- | --- | --- | --- | --- |
| `Half Marathon` | Eligible via auto-extended bridge doctrine | Eligible | Eligible | Eligible, but still one-touch-max and not pseudo-elite |
| `Marathon Base` | Eligible via auto-extended base bridge doctrine | Eligible | Eligible | Eligible, but conservative base only |

### Blocking Rules

`beginner_new_runner` runner-level blocking is no longer the canonical rule for either family.

Structural blockers may still apply, but family ambition alone is not the normal reason to refuse preview generation.

## Half Marathon Doctrine

### Family Promise

`Half Marathon` means:

- an exact selected-distance endpoint family
- explicit final selected-distance truth at `21100m`
- visible long-run durability progression
- moderate Half-specific development
- no fake target-time specificity
- no race-pace overclaim

### Half Marathon Horizon Recommendation

- default horizon: `14 weeks`
- acceptable bounded range for backend shaping: `12-16 weeks`

R6 should not attempt ultra-short Half builds that compress long-run growth and taper into the same narrow window.

### Half Marathon Endpoint Contract

- final non-rest row must be `final_selected_distance_day`
- endpoint main segment must be exact `21100m`
- final week must foreground the endpoint, not a readiness marker
- final week must not end on:
  - `rest_and_recovery`
  - `easy_aerobic_run`
  - `long_aerobic_run`
  - `half_readiness_marker`

### Half Marathon Workout Families

Required support families:

- `easy`
- `recovery`
- `long_run`
- `cutback_long_run`
- `final_selected_distance_day`

Allowed development touches in v1:

- `strides`
- `tempo`
- `intervals`
- `hills`
- `threshold`

Half-specific priorities:

- `tempo` is the primary required development touch
- `threshold` is the stronger Half-specific touch, but only for higher-support runners
- `intervals` are supportive, not the main identity of the block
- `hills` are optional support variety, not a required anchor for all runners

### Half Marathon Development Gates By Runner Level

| Runner level | Tempo | Intervals | Hills | Threshold | Max development touches/week | Minimum acceptable diversity |
| --- | --- | --- | --- | --- | --- | --- |
| `sometimes_runs` + `standard` | Required | Allowed at most once | Optional at most once | Forbidden | 1 | `strides`, `tempo`, `long_run`, `cutback_long_run`, exact endpoint |
| `sometimes_runs` + `conservative` | Required | Forbidden | Forbidden | Forbidden | 1 | `strides`, `tempo`, `long_run`, `cutback_long_run`, exact endpoint |
| `runs_a_lot` + `standard` | Required | Allowed at most once | Allowed at most once | Required at least once | 1 | `strides`, `tempo`, `threshold`, `long_run`, `cutback_long_run`, exact endpoint |
| `runs_a_lot` + `conservative` | Required | Forbidden | Optional at most once | Forbidden | 1 | `strides`, `tempo`, `long_run`, `cutback_long_run`, exact endpoint |
| `professional_competitive` + `standard` | Required | Allowed at most once | Allowed at most once | Required at least once | 1 in this v1 engine | `strides`, `tempo`, `threshold`, `long_run`, `cutback_long_run`, exact endpoint |
| `professional_competitive` + `conservative` | Required | Forbidden | Optional at most once | Forbidden | 1 | `strides`, `tempo`, `long_run`, `cutback_long_run`, exact endpoint |

### Half Marathon Week-Shape Policy

Canonical Half Marathon development rhythm:

- Week `1`: support-led start, no sharp development required
- Week `2`: `strides`
- Week `3`: `tempo`
- Week `4`: cutback week
- Week `5`: support or `tempo`
- Week `6`: `threshold` for eligible standard-load higher-support runners; `tempo` otherwise
- Week `7`: support week
- Week `8`: cutback week
- Week `9`: `tempo` or one bounded `intervals` week for standard-load supported runners
- Week `10`: support week
- Week `11`: Half-specific controlled touch:
  - `threshold` for eligible standard-load higher-support runners
  - `tempo` otherwise
- Week `12`: final cutback / taper entry if 12-week horizon
- Penultimate week: `strides` only
- Final week: endpoint week with exact `21100m`

Backend may shift which viable weekday carries the development touch, but not the week intent, density, or recovery spacing.

### Half Marathon Recovery Spacing Gates

Backend must preserve:

1. The next actual running slot after `long_run` or `cutback_long_run` must be `recovery` or `easy`.
2. A development touch must not appear on the immediate next actual running slot after `long_run` or `cutback_long_run`.
3. `threshold` must not appear in the same week as a sharpened long-run finish concept. In this v1 engine, that means no second hidden specific load.
4. The next actual running slot after `threshold`, `intervals`, or `hills` must be `easy` or `recovery`.
5. No week may contain more than one development touch.

### Half Marathon Cutback And Taper Rules

Cutback expectations:

- at least every `4th` week
- `cutback_long_run` required
- no `threshold` in cutback week
- no `intervals` in cutback week
- if a development touch exists, it may only be `strides` or easier `tempo`

Final two weeks:

- penultimate week must not be empty filler; it should include `strides`
- final week must keep non-endpoint days to `easy` or `recovery`
- final week must not include `tempo`, `intervals`, `hills`, or `threshold`

### Half Marathon QA Failure Criteria

QA should fail a Half preview if:

- final non-rest row is not `final_selected_distance_day`
- endpoint main segment is not exact `21100m`
- the block contains no visible long-run progression
- supported standard-load output collapses into only `easy` / `recovery` / `long_run`
- supported higher-support output contains no `threshold`
- `sometimes_runs` output uses `threshold`
- cutback weeks are missing or not visibly lighter
- final two weeks become generic support-only filler before endpoint
- a non-beginner supported runner is incorrectly rejected

## Marathon Base Doctrine

### Family Promise

`Marathon Base` means:

- honest marathon durability and base-building
- visible long-run growth and cutback rhythm
- no full-race readiness claim
- no selected-distance `42195m` endpoint in this v1 expansion
- no target-time or race-pace overclaim

### Marathon Decision

R6 should not ship a full selected-distance `Marathon` endpoint.

R6 should ship only `Marathon Base`.

Reason:

- the current deterministic engine is one-touch-max per week
- its available workout families do not yet justify a full marathon selected-distance promise
- a fake `42195m` endpoint would overclaim readiness more than it would add product truth

### Marathon Base Horizon Recommendation

- default horizon: `16 weeks`
- acceptable bounded range for backend shaping: `14-18 weeks`

### Marathon Base Endpoint Contract

- final non-rest row must be `marathon_base_endpoint`
- endpoint must stay a durability/base endpoint
- endpoint must not imply:
  - full marathon race readiness
  - race peak
  - target-time specificity
  - race-pace session

### Marathon Base Workout Families

Required support families:

- `easy`
- `recovery`
- `long_run`
- `cutback_long_run`
- `marathon_base_endpoint`

Allowed development touches in v1:

- `strides`
- `tempo`
- `hills`
- `threshold`

Not allowed for Marathon Base in v1:

- `intervals`
- full selected-distance marathon endpoint

Marathon Base priorities:

- long-run durability is the main identity of the block
- `tempo` is a support durability touch, not a 10K-style sharpening cue
- `threshold` is optional and only for higher-support standard-load runners
- `hills` are optional support variety, not a required marquee identity

### Marathon Base Development Gates By Runner Level

| Runner level | Tempo | Hills | Threshold | Intervals | Max development touches/week | Minimum acceptable diversity |
| --- | --- | --- | --- | --- | --- | --- |
| `sometimes_runs` + `standard` | Required | Optional at most once | Forbidden | Forbidden | 1 | `strides`, `tempo`, `long_run`, `cutback_long_run`, honest base endpoint |
| `sometimes_runs` + `conservative` | Optional | Forbidden | Forbidden | Forbidden | 1 | `strides`, `long_run`, `cutback_long_run`, honest base endpoint |
| `runs_a_lot` + `standard` | Required | Optional at most once | Allowed at most once | Forbidden | 1 | `strides`, `tempo`, optional `threshold`, `long_run`, `cutback_long_run`, honest base endpoint |
| `runs_a_lot` + `conservative` | Required | Forbidden | Forbidden | Forbidden | 1 | `strides`, `tempo`, `long_run`, `cutback_long_run`, honest base endpoint |
| `professional_competitive` + `standard` | Required | Optional at most once | Allowed at most once | Forbidden | 1 in this v1 engine | `strides`, `tempo`, optional `threshold`, `long_run`, `cutback_long_run`, honest base endpoint |
| `professional_competitive` + `conservative` | Required | Forbidden | Forbidden | Forbidden | 1 | `strides`, `tempo`, `long_run`, `cutback_long_run`, honest base endpoint |

### Marathon Base Week-Shape Policy

Canonical Marathon Base rhythm:

- Weeks `1-2`: support-led settling with `strides`
- Early build: `tempo` appears first
- Mid-block: one optional `threshold` week for eligible standard-load higher-support runners
- Late block: another `tempo` or optional `hills` week, but never two specific touches in one week
- Cutback weeks at least every `4th` week
- Penultimate week: `strides` or support-only sharpening-lite
- Final week: `marathon_base_endpoint`

This family should look more durable than dramatic.

If the block visually reads like a 10K with longer long runs, backend copied too much from the 10K vertical.

### Marathon Base Recovery Spacing Gates

Backend must preserve:

1. The next actual running slot after `long_run` or `cutback_long_run` must be `recovery` or `easy`.
2. Any `threshold` week must keep the long run non-sharpened and clearly aerobic.
3. No `tempo`, `hills`, or `threshold` may sit on the immediate next actual running slot after the long run.
4. No week may contain more than one development touch.
5. `threshold` must be absent under conservative load.

### Marathon Base Cutback And Taper Rules

Cutback expectations:

- at least every `4th` week
- `cutback_long_run` required
- no `threshold` in cutback week
- no `hills` in cutback week
- if a development touch exists, it may only be `strides`

Final two weeks:

- penultimate week may include `strides` only
- final week must not contain `tempo`, `hills`, or `threshold`
- final week must read as honest block closeout, not full-race taper theater

### Marathon Base QA Failure Criteria

QA should fail a Marathon Base preview if:

- final non-rest row is not `marathon_base_endpoint`
- output implies full-marathon race readiness
- output includes `intervals`
- `sometimes_runs` output contains `threshold`
- higher-support standard-load output has no visible `tempo`
- long-run progression is absent or cutbacks are missing
- the block reads like generic support-only filler
- the block reads like a full Marathon race-prep plan despite the family promise
- `beginner_new_runner` is allowed through

## Shared Expansion Rules

### What May Reuse 10K Patterns

- one development touch max per week
- recovery-first next running slot after long run
- cutback-week requirement
- penultimate-week `strides` sharpening
- final-week easy/recovery-only non-endpoint shaping
- no fake pace
- no fake personal HR
- preview-only non-mutating contract

### What Must Differ From 10K

- Half Marathon must be more durability-led and less interval-led
- Marathon Base must be more long-run-led and less “quality-session identity” led
- Half may allow bounded `threshold`
- Marathon Base must not allow `intervals`
- Marathon Base endpoint must remain a base endpoint, not a selected-distance race endpoint

### What Backend Must Not Copy Blindly From 10K

- do not require intervals for every supported family
- do not require hills for Half or Marathon Base the way they are required for higher-support 10K
- do not treat the final two weeks as identical to 10K taper logic
- do not use a selected-distance final-day contract for Marathon Base
- do not let Half or Marathon/Base become 10K with bigger numbers

### Metric Truth Preservation

- Pace is not required and must not be invented.
- Personal HR truth is not required and must not be invented.
- Editable Hito default HR may appear only where already allowed by the canonical workout template contract.
- Endpoint exactness must remain mechanical:
  - Half endpoint exact `21100m`
  - Marathon Base endpoint not a selected-distance distance block

### Preview-Only Contract Preservation

R6 must preserve:

- preview only
- no persistence
- no confirm/create
- no OpenAI
- no frontend-owned workout logic

## Backend Handoff Summary

Backend should add two family-specific policy layers rather than cloning `ten-k-diversity-policy.ts`:

1. `half-marathon-diversity-policy`
2. `marathon-base-diversity-policy`

Minimum backend expectations:

1. Enforce the universal no-dead-end doctrine and the dedicated beginner Half bridge specialization.
2. Enforce exact `21100m` Half endpoint.
3. Keep Marathon Base as honest base-only endpoint.
4. Require `tempo` for supported Half and Marathon Base standard-load runners.
5. Require `threshold` at least once only for:
   - `runs_a_lot` standard Half
   - `professional_competitive` standard Half
6. For Marathon Base, keep `threshold` optional and higher-support only.
7. Keep `intervals` out of Marathon Base.
8. Preserve long-run cutback rhythm and recovery-first spacing.
9. Preserve one-touch-max weekly density.

## QA Failure Criteria

QA should compare Half and Marathon Base against accepted 10K by family truth, not by expecting identical structure.

QA should fail if:

- Half lacks exact `21100m` endpoint
- Marathon Base pretends to be a full Marathon endpoint
- supported Half looks like generic support-only filler
- supported Marathon Base looks like generic support-only filler
- Half or Marathon Base simply mirrors the 10K week map with renamed labels
- `beginner_new_runner + Half Marathon` is still rejected instead of auto-extended
- `beginner_new_runner + Marathon Base` is still rejected instead of auto-extended
- long-run progression and cutback shape are not visibly stronger than 10K
- final two weeks are empty or misleading

## Notes For Product And QA

- Half Marathon is the next natural selected-distance expansion.
- Marathon should not be overclaimed just because endpoint contracts exist in theory.
- An honest `Marathon Base` is more coach-credible than a fake full Marathon vertical.
