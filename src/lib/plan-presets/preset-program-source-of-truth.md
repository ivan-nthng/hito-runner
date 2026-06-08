# Plan Preset Program Source Of Truth

## Purpose

This file is the canonical coaching doctrine artifact for rich deterministic Plan Preset programs.

It is intended to be shared across backend and frontend as the human-readable source of truth for:

- shipped preset family scope
- safe eligibility and routing
- adaptive duration and progression conservatism
- weekly composition and phase architecture
- workout identity requirements
- final outcome requirements
- metric-truth constraints
- runner-facing explanation boundaries

This file does not replace runtime code. It defines what the shipped preset families are supposed to
mean and what they must produce.

## Companion Artifacts

This source-of-truth set is intentionally split into machine-friendly companion artifacts:

- `preset-program-scenario-matrix.csv`
- `preset-program-load-adjustments.csv`
- `preset-workout-identity-library.csv`
- `preset-goal-contract-matrix.csv`
- `preset-phase-template-table.csv`
- `preset-weekly-archetype-table.csv`
- `preset-identity-placement-rules.csv`
- `preset-segment-anatomy-table.csv`
- `preset-progression-math-rules.csv`
- `preset-quality-gates.csv`
- `preset-builder-io-contract.csv`

Expected ownership:

- backend uses the scenario matrix for eligibility, duration, cadence, and routing
- backend uses the load-adjustment table for conservative duration/progression moderation
- backend and frontend use the workout identity library to keep segment richness and workout naming aligned
- backend uses the goal-contract matrix to decide whether a preset is allowed to promise completion, base-building, or only conservative visibility
- backend uses the phase and weekly-archetype tables to map adaptive duration into deterministic week patterns
- backend uses identity-placement and segment-anatomy tables to keep family-specific sessions rich, bounded, and executable
- backend and QA use progression-math and quality-gate tables to prevent support-only collapse, fake metrics, and family-contract drift
- backend uses the builder I/O contract to resolve abstract weekly slot tokens, final-outcome markers, and inheritance rules without undocumented fallback logic

## Canonical Builder Pipeline

The deterministic preset builder should follow this pipeline:

`runner inputs -> capability/load context -> goal contract -> duration model -> phase architecture -> weekly composition -> workout identity placement -> segment anatomy -> target-mode resolution -> canonical training-plan-v2 rows -> review/confirm`

Interpretation rules:

- goal contract decides whether the family promise is completion, balanced readiness, or base-building
- duration model decides the adaptive horizon before any week layout is chosen
- phase architecture decides what each block is allowed to do
- weekly composition decides how many support versus specific slots a week may carry
- identity placement decides what session type can appear in those slots, and when
- segment anatomy decides how each selected identity expands into executable rows
- target-mode resolution decides whether pace is benchmark-backed, HR is personal-zone-backed, or the workout remains `structure_only_executable`

## Shipped Families Only

The shipped preset families covered here are:

- `10K Foundation`
- `Half Marathon Balanced`
- `Marathon Base`

Not included here as shipped behavior:

- `5K`
- target-date presets
- target-time presets
- performance/two-quality presets
- ultra presets
- trail race-specific presets
- mountain race-specific presets

## Global Rules

### Richness Rules

Every shipped preset program must be rich enough to feel coach-authored.

That means:

- no support-only calendar filler under a distance-specific name
- every non-rest workout must carry explicit segment anatomy
- short support days should still have at least meaningful opener/main/finish or equivalent
- substantial sessions should prefer 3-part anatomy or repeat structure
- repeat sessions must always include repeat count, work block, and recovery block
- long runs must have clear purpose, not anonymous volume

### Weekly Load Ceiling

For shipped preset families:

- max one moderate/specific touch per week
- no two-quality-week logic
- long-run specificity may count as the main weekly specific stimulus

### Metric Truth

- watch/app support is assumed for supported preset creation
- watch/app does not create pace truth
- target time does not create pace truth
- no executable HR without personal HR-zone truth
- age-estimated HR is advisory only
- when pace/HR truth is unavailable, allowed workouts use `structure_only_executable`

### Recovery Rules

- fixed rest days must be respected
- preferred long-run day must be respected if it is viable
- recovery-first after long run remains mandatory
- cutback logic is not optional

### Custom Routing

Preset creation must route to `Advanced Custom` when:

- target date is present
- target time is present
- comments introduce unusual constraints
- caution/pain/injury-like signals are present
- family-defining workout types are removed
- safe duration would become overly long or too bespoke

## Family Overview

| Family | Goal promise | Default bias | Final outcome |
|---|---|---|---|
| `10K Foundation` | Build credible 10K completion ability with real development variety | completion + aerobic development | explicit 10K completion/test/race-style equivalent |
| `Half Marathon Balanced` | Build credible half-marathon readiness without target-time intensity | balanced durability + moderate specificity | clear half-readiness marker or completion-style equivalent |
| `Marathon Base` | Build durable marathon-specific base without pretending peak race readiness | durability/base-building | explicit base endpoint, not fake race peak |

## Runner Level Definitions

| Level | Meaning inside presets |
|---|---|
| `new_to_running` | true new runner or very limited running continuity |
| `beginner` | some running history, still building consistency and tolerance |
| `running_regularly` | stable recreational running background |
| `performance_focused` | wants more performance-oriented training, but shipped presets still stay conservative |

## Weekly Days Definitions

| Days/week | Meaning |
|---|---|
| `1` | not preset-safe for shipped families |
| `2` | very constrained; only some long-duration variants remain coach-credible |
| `3` | minimal viable rhythm for richer 10K and narrow Half / Marathon cases |
| `4` | strong preset zone |
| `5` | strongest shipped preset zone |

## Adaptive Duration Baseline

The presets must not rely on one fixed duration.

The previous fixed `10/12/16` week fixtures are historical regression references only. They are not
the product target for the rich adaptive model; Backend Slice 6 should replace fixed-duration
assertions with adaptive-duration and training-quality assertions.

### Base Duration Ranges

| Family | New to running | Beginner | Running regularly | Performance focused |
|---|---|---|---|---|
| `10K Foundation` | 14-24 weeks | 10-18 weeks | 8-14 weeks | 8-12 weeks |
| `Half Marathon Balanced` | unavailable | 14-24 weeks | 10-18 weeks | 10-16 weeks |
| `Marathon Base` | unavailable | 18-32 weeks if allowed | 14-24 weeks | 12-20 weeks |

### Weekly-Days Duration Pressure

| Days/week | 10K | Half | Marathon |
|---|---|---|---|
| `1` | unavailable | unavailable | unavailable |
| `2` | add 6-12 weeks | add 8-16 weeks if allowed | usually unavailable |
| `3` | add 2-6 weeks | add 4-8 weeks | add 6-12 weeks if allowed |
| `4` | baseline | baseline | add 2-6 weeks |
| `5` | baseline | baseline | baseline |

## Anthropometric And Age Conservatism

These inputs are conservative moderation inputs only.

They may:

- slow progression
- increase cutback frequency
- extend duration
- delay sharper work

They must never:

- diagnose health status
- infer injury
- imply weak ability
- justify fake metric precision

### Anthropometric Load Context

| Context | Meaning | Coaching effect |
|---|---|---|
| `lower_impact_load_context` | likely lower absolute impact load per step | no acceleration; just baseline progression |
| `standard_impact_load_context` | default preset assumption | baseline progression |
| `elevated_impact_load_context` | more conservative impact management is appropriate | extend duration, soften long-run ramp, earlier cutbacks |
| `high_impact_load_context` | strongest preset-safe conservatism | longest duration extension, smallest long-run jumps, lower intensity density |

Suggested backend derivation may use a BMI-like screening proxy internally, but the proxy must stay
hidden from runner-facing copy and must be treated as rough screening only.

### Age Conservatism

| Age band | Conservatism |
|---|---|
| `under_30` | baseline |
| `30_39` | baseline to slightly conservative |
| `40_49` | modest conservatism |
| `50_59` | clear conservatism |
| `60_plus` | strongest preset conservatism |

### Age/Load Effects

| Trigger | Additive effect |
|---|---|
| `elevated_impact_load_context` | +2 to +6 weeks depending family |
| `high_impact_load_context` | +4 to +12 weeks depending family |
| `40_49` | usually add 0 to 4 weeks |
| `50_59` | usually add 2 to 6 weeks |
| `60_plus` | usually add 4 to 10 weeks |

## Family Doctrine

## 10K Foundation

### Goal Promise

This preset must make the runner capable of credibly completing a 10K.

It is not acceptable for the plan to end as generic aerobic maintenance. It must culminate in one of:

- explicit 10K completion day
- explicit 10K test day
- explicit race-style 10K simulation day

### Level Availability

| Level | State | Program bias |
|---|---|---|
| `new_to_running` | available with caution | completion-oriented, longer runway |
| `beginner` | recommended | completion + development |
| `running_regularly` | recommended | strongest preset fit |
| `performance_focused` | available but conservative | base-only, not a performance block |

### Weekly Composition By Days

| Days | Structure |
|---|---|
| `2` | long/easy day + development day alternating strides/progression/tempo-lite/later rhythm work |
| `3` | easy/recovery + moderate development + long run |
| `4` | recovery/easy + moderate session + support/steady or strides + long run |
| `5` | 2 support runs + 1 moderate session + 1 lighter support/strides slot + 1 long run |

### Required Phases

- adaptation/base
- aerobic development
- rhythm/progression development
- cutback
- final completion/test week

### Optional Phases Depending On Duration

- hill-strength block
- threshold-lite block
- benchmark/reset block

### Required Workout Identities

- `easy_aerobic_run`
- `recovery_jog`
- `long_aerobic_run`
- `cutback_aerobic_run`
- `cutback_long_run`
- at least one of:
  - `easy_run_with_strides`
  - `progression_run`
  - `time_intervals`
  - `10k_rhythm_intervals`

### Allowed Workout Identities

- `easy_run_with_strides`
- `progression_run`
- `time_intervals`
- `10k_rhythm_intervals`
- `controlled_tempo_session`
- optional hills substitution where safe

### Forbidden Workout Identities

- `race_pace_session`
- `taper_tuneup_run`
- `half_marathon_threshold_durability`
- `marathon_steady_specificity`
- long-support-only calendar with no 10K-specific development pattern

## Half Marathon Balanced

### Goal Promise

This preset must produce a runner who is credibly ready for half-marathon completion or an obvious
half-readiness block.

It must not pretend to be target-time race prep, but it must still contain real half-specific
patterning.

### Level Availability

| Level | State | Program bias |
|---|---|---|
| `new_to_running` | unavailable | none |
| `beginner` | available only with support and duration | conservative completion |
| `running_regularly` | recommended | balanced half-specific build |
| `performance_focused` | available but softened | balanced base, not race sharp |

### Weekly Composition By Days

| Days | Structure |
|---|---|
| `2` | narrow conservative use only: long run + moderate/support day |
| `3` | support run + moderate half-specific session + long run |
| `4` | recovery/easy + moderate half-specific session + steady/support + long run |
| `5` | 2 support runs + 1 moderate half-specific session + 1 secondary support/steady/strides slot + 1 long run |

### Required Phases

- adaptation/base
- aerobic development
- tempo / threshold development
- long-run specificity
- cutback
- completion/readiness week

### Required Workout Identities

- `easy_aerobic_run`
- `recovery_jog`
- `steady_aerobic_run`
- `long_aerobic_run`
- `cutback_aerobic_run`
- `cutback_long_run`
- at least two of:
  - `progression_run`
  - `controlled_tempo_session`
  - `half_marathon_threshold_durability`
  - `long_run_with_steady_finish`

### Forbidden Workout Identities

- 5K-style sharpness as the main language
- `race_pace_session` as normal preset identity
- interval-heavy weeks
- support-only loop with one late half-specific exception

## Marathon Base

### Goal Promise

This preset must build durable marathon-specific base fitness.

It must not falsely imply peak marathon race readiness unless the plan is long enough and explicitly
says so, which shipped preset v1 does not.

### Level Availability

| Level | State | Program bias |
|---|---|---|
| `new_to_running` | unavailable | none |
| `beginner` | not ideal, sometimes unavailable | very conservative durability-only |
| `running_regularly` | available | durability/base |
| `performance_focused` | available but conservative | base-only |

### Weekly Composition By Days

| Days | Structure |
|---|---|
| `3` | easy/support + marathon-specific steady/support + long run |
| `4` | recovery/easy + marathon-specific support + steady/support + long run |
| `5` | 2 support runs + 1 marathon-specific steady or controlled tempo + 1 secondary support slot + 1 long run |

### Required Phases

- adaptation/base
- aerobic development
- marathon-steady durability
- long-run progression
- cutback/recovery cycles
- explicit base endpoint

### Required Workout Identities

- `easy_aerobic_run`
- `recovery_jog`
- `steady_aerobic_run`
- `long_aerobic_run`
- `cutback_aerobic_run`
- `cutback_long_run`
- at least one of:
  - `marathon_steady_specificity`
  - `long_run_with_steady_finish`

### Allowed Workout Identities

- `easy_run_with_strides`
- `controlled_tempo_session`
- `long_run_with_steady_finish`

### Forbidden Workout Identities

- `race_pace_session`
- `taper_tuneup_run`
- short interval-centric marathon weeks
- fake peak-race framing

## Workout Identity Library

| Identity | Purpose | Fits | Removable | Safe substitution |
|---|---|---|---|---|
| `recovery_jog` | absorb load | all | no | easier support day only when still preserving recovery category |
| `easy_aerobic_run` | aerobic support | all | no | none |
| `easy_run_with_strides` | safe neuromuscular variety | 10K, Half, Marathon | yes | `progression_run` or lighter support variation |
| `progression_run` | bridge toward moderate work | all | yes | `controlled_tempo_session` or structured support progression |
| `time_intervals` | controlled repeat structure | 10K, some Half | yes | `progression_run`, `controlled_tempo_session` |
| `10k_rhythm_intervals` | 10K-specific rhythm work | 10K | yes | `time_intervals`, `controlled_tempo_session` |
| `controlled_tempo_session` | moderate sustained work | 10K, Half, Marathon selective | partly | `progression_run`, family-specific steady variant |
| `half_marathon_threshold_durability` | half-specific durability | Half | usually not | `controlled_tempo_session` only in weaker variants |
| `marathon_steady_specificity` | marathon-specific durability | Marathon | not if it breaks the family | `long_run_with_steady_finish` only in weaker variants |
| `long_aerobic_run` | distance durability | all | no | none |
| `long_run_with_steady_finish` | distance-specific long-run specificity | Half, Marathon | not if it becomes a family hole | plain long run only in lower-support variants |
| `cutback_aerobic_run` | recovery rhythm | all | no | none |
| `cutback_long_run` | long-run recovery rhythm | all longer families | no | none |

## Workout Removal Rules

### Removable Or Optional

- hills
- strength/cross-training support
- some strides in lower-support variants
- some interval identity if 10K quality remains coherent via progression/tempo-lite

### Route To Custom

- remove long runs
- remove family-defining specificity
- remove multiple core types together
- remove all moderate development from a family that depends on it

## Rest-Day And Long-Run Rules

### Rest Days

- if no fixed rest days are selected, rest may float
- fixed rest days narrow the family fit
- if fixed rest days reduce runnable days below the family minimum, route away from the preset

### Long Run Day

- if no preferred long-run day is selected:
  - default to Sunday
  - otherwise Saturday
  - otherwise the latest viable training day
- if preferred long-run day conflicts with fixed rest days, resolve before final review

## Metric Truth Rules

### Pace

- pace targets allowed only from execution support plus trusted benchmark truth
- target time alone must never unlock pace

### HR

- executable HR requires personal HR-zone truth
- age-estimated HR remains advisory only

### Structure Only Executable

Allowed when:

- workout is still fully executable by numeric duration/distance/repeats/recovery
- pace truth is absent
- personal HR-zone truth is absent

Not allowed:

- vague prose replacing real structure
- cue-only workouts in the happy path

## Final Acceptance Criteria

A preset-generated plan is acceptable only if all of these are true:

- family-specific identity pattern is visible
- the plan does not collapse into support-only filler
- every non-rest workout has meaningful segment richness
- long-run progression is coherent
- cutback logic is visible
- the final outcome is explicit and family-correct
- no fake pace appears
- no executable HR appears without personal HR-zone truth
