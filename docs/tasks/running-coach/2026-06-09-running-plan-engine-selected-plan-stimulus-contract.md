# Running Plan Engine Selected-Plan Stimulus Contract

## Task

Audit selected-plan preview workout quality and define weekly development stimulus rules before
create-path implementation.

## Stage

RUNNING COACH doctrine / selected-plan quality gate after selected-plan preview feedback.

## Current Training Quality

Selected-plan preview quality is no longer failing at the old endpoint or watch-executable level.
The current issue is training substance and family identity.

Current state by family:

- `10K`: acceptable and coach-credible in deterministic v1
- `Half Marathon`: partially acceptable, but `sometimes_runs` still feels too generic
- `Marathon Base`: acceptable and coach-credible as a base-only family

The key product problem is not "too few interval days" in the abstract. The real problem is that
the current engine can still compose a technically valid preview whose weekly development pattern
does not feel unmistakably goal-specific, especially for supported Half Marathon.

## Findings

### Root quality split

There are now two different quality layers:

1. Technical quality
   - endpoint is explicit
   - no fake pace
   - no fake personal HR
   - workouts are watch-executable
   - recovery spacing is guarded

2. Coaching quality
   - does the family feel real?
   - is the development stimulus meaningful?
   - does the preview read like a program instead of a calendar with safe labels?

Technical quality is mostly acceptable.
Coaching quality is still uneven.

### 10K

10K is now the healthiest family.

Why it works:

- beginners stay simple and safe with `strides`
- `sometimes_runs` has visible development through `tempo`, `intervals`, and `strides`
- `runs_a_lot` adds `hills`
- `professional_competitive` adds a second interval exposure instead of only relabeling the same block

This is enough for the preview to feel like a real 10K program without becoming a race-sharpening
track.

### Half Marathon

Half Marathon remains the weakest family.

What works:

- `runs_a_lot` and `professional_competitive` now show `threshold`
- long-run progression is credible
- cutbacks are present
- endpoint week is honest

What still fails to feel rich enough:

- `sometimes_runs_half_marathon` still depends on `tempo`, `tempo`, `intervals`, `tempo`, plus
  `strides`
- that pattern is orderly and safe, but not half-specific enough
- one interval-like workout is acceptable only when the rest of the block clearly expresses
  half-marathon durability through threshold or long-run-specific finish behavior
- in the current preview, that half-specific signal is still too subtle and too dependent on label
  enrichment rather than clearly distinct composition

### Marathon Base

Marathon Base is acceptable if judged as a base family, not a marathon-race family.

Why it works:

- no fake marathon readiness
- no intervals
- higher-support variants get stronger development through `threshold` and `hills`
- conservative/heavy load visibly softens the block

What remains underpowered but not blocking:

- endpoint reads honest but a bit quiet
- long-run detail is better than before, but still leans on repeating the same skeleton too often

## Safety Concerns

Do not solve the substance problem by breaking the guardrails.

Preserve:

- no fake precise pace
- no fake personal HR
- no mandatory 5K benchmark dependency
- no no-watch/no-app normal branch
- no stacked hard-week logic
- no hidden full marathon race build inside Marathon Base

Non-blocking safety note:

- `sometimes_runs_half_marathon` is safe, but currently risks being safe and bland rather than safe
  and clearly goal-shaped

## Recommended Coaching Changes

1. Strengthen `sometimes_runs_half_marathon` through composition, not by adding more random quality.
2. Keep `10K` rules largely intact.
3. Keep `Marathon Base` base-only.
4. Require that supported Half preview contains at least one unmistakable half-specific durability
   signal beyond generic tempo repetition.
5. Treat long-run-specific finish work as a valid weekly development touch when used deliberately.

## Product Rules To Encode

### Global stimulus rules

- one development touch maximum per week in deterministic v1
- development touch may be midweek or long-run-specific, but not both in the same week
- easy/recovery days must outnumber development days
- cutback weeks are visibly lighter and cannot hide serious threshold/interval/hill work
- taper/endpoint weeks cannot carry a second hard stimulus

### Recovery placement rules

- next running slot after `long_run`, `cutback_long_run`, `threshold`, `intervals`, or `hills`
  must be `recovery` or `easy`
- if a long run includes a steady finish, that long run counts as the week’s development touch
- low-frequency previews must not compress long run and quality day into back-to-back running slots

### Family identity rules

- `10K` must feel like rhythm, turnover, and controlled repeatability
- `Half Marathon` must feel like durability, sustained work, and long-run support
- `Marathon Base` must feel like durable aerobic base, not race-specific marathon sharpening

## Backend-Ready Quality Contract

### 1) Weekly development touch contract

| Family | Runner level | Load | Required development shape | Optional development shape | Forbidden development shape |
| --- | --- | --- | --- | --- | --- |
| `10K` | `beginner_new_runner` | any | `strides` some weeks | none | `tempo`, `intervals`, `hills`, `threshold` |
| `10K` | `sometimes_runs` | standard | at least one `tempo` week and one `intervals` week across the block | extra `tempo` or `strides` | `threshold` |
| `10K` | `runs_a_lot` | standard | `tempo`, `intervals`, `hills`, `strides` all present across the block | extra `tempo` | `threshold` |
| `10K` | `professional_competitive` | standard | `tempo`, `intervals`, second stronger interval-like exposure, `hills`, `strides` | richer long intervals later | `threshold` in v1 |
| `10K` | supported | conservative | `strides` plus `tempo` only | none | `intervals`, `hills`, `threshold` |
| `Half Marathon` | `beginner_new_runner` | any | blocked | none | all family generation |
| `Half Marathon` | `sometimes_runs` | standard | `strides`; at least one `tempo`; at least one clearly half-specific durability touch | one generic intervals week only if half-specific durability is also present elsewhere | `threshold` by default; `hills` unless future doctrine explicitly opens them |
| `Half Marathon` | `runs_a_lot` | standard | `strides`; `tempo`; `threshold`; second half-specific development touch later | one extra `tempo` or long-run steady finish | pure generic support-only pattern |
| `Half Marathon` | `professional_competitive` | standard | `strides`; `tempo`; `threshold`; one sharper interval-like or long-interval stimulus; second threshold-capable durability signal | richer long-run finish | two hard touches in one week |
| `Half Marathon` | supported | conservative | `strides` and `tempo` only | none | `threshold`, `intervals`, `hills` |
| `Marathon Base` | `beginner_new_runner` | any | blocked | none | all family generation |
| `Marathon Base` | `sometimes_runs` | standard | `strides`; `tempo`; later additional tempo or durability touch | long-run steady finish only if later doctrine explicitly opens it | `threshold`, `intervals` |
| `Marathon Base` | `runs_a_lot` | standard | `strides`; `tempo`; one stronger durability touch such as `threshold` or `hills` | one additional marathon-base-specific steady durability variant later | `intervals` |
| `Marathon Base` | `professional_competitive` | standard | `strides`; `tempo`; `threshold`; `hills`; second threshold-capable durability exposure | richer long-run finish detail | `intervals`, race-pace work |
| `Marathon Base` | supported | conservative | `strides` and selective `tempo` only | none | `threshold`, `intervals` |

### 2) Half Marathon minimum richness gate

`Half Marathon` preview fails coaching quality if:

- `sometimes_runs` has only `tempo` plus `strides` and one generic interval day
- no `threshold` exists for higher-support variants
- no long-run-specific durability differentiation appears across the block

Minimum acceptance:

- `sometimes_runs`
  - `strides` must appear
  - `tempo` must appear
  - one of the following must also appear:
    - dedicated half-durability tempo identity
    - long-interval half-specific identity
    - long run with controlled steady finish that clearly counts as the week’s development touch

- `runs_a_lot`
  - `threshold` is required
  - generic `tempo` alone is not enough

- `professional_competitive`
  - `threshold` is required
  - plus one sharper half-relevant stimulus such as long intervals or stronger interval durability

### 3) 10K acceptance gate

`10K` preview passes coaching quality when:

- beginner plans stay simple but not empty
- supported standard-load plans include at least `strides`, `tempo`, and `intervals`
- higher-support plans also include `hills`
- the block does not collapse into only `strides + tempo`

### 4) Marathon Base acceptance gate

`Marathon Base` preview passes coaching quality when:

- it remains clearly base-building
- `intervals` are absent
- `tempo` exists in standard-load supported blocks
- higher-support blocks may add `threshold` or `hills`
- endpoint never implies race readiness, race pace, taper peak, or target-time claim

## Scenario / Validator Expectations

Scenario JSON should prove:

1. `10K`
   - supported standard-load scenarios include required development mix
   - higher-support 10K includes `hills`
   - no `threshold`

2. `Half Marathon`
   - `beginner_new_runner` stays unavailable
   - `sometimes_runs` exposes at least one clearly half-specific durability signal, not just generic
     `tempo` copies
   - `runs_a_lot` and `professional_competitive` include `threshold`

3. `Marathon Base`
   - `beginner_new_runner` stays unavailable
   - `intervals` absent in all scenarios
   - higher-support blocks differ meaningfully from `sometimes_runs`

4. Long-run detail
   - long runs over ninety minutes should show visible checkpoint/finish variety across a block
   - detail variation should be meaningful, not random label churn

Validator expectations:

- fail if supported `Half Marathon` remains generic-tempo-heavy without clear durability signal
- fail if supported `10K` standard-load uses only `strides + tempo`
- fail if `Marathon Base` contains `intervals` or race-readiness wording
- fail if a week contains more than one development touch
- fail if the next running slot after long run or hard development is not `easy` or `recovery`

## What Not To Change

- no fake precise pace
- no fake personal HR
- no mandatory 5K benchmark
- no no-watch/no-app normal branch
- no hidden AI-authored calendar
- no silent unsafe overclaim
- no Marathon Base disguised as marathon race plan
- one canonical backend engine

## Next Recommended Role

BACKEND

## Blockers

Blocker for create-path confidence remains:

- `Half Marathon sometimes_runs` is still too easy to render as safe but under-substantive unless
  backend encodes a stronger half-specific durability requirement in the weekly stimulus contract.

`10K` and `Marathon Base` are not blocked at the same coaching-quality level.
