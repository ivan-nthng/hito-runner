# Marathon Completion Selected-Plan Family Contract

Date: 2026-06-11
Owner: Running Coach
Status: Proposed source-of-truth for Backend Marathon Completion family implementation
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
Related doctrine:

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-rich-composition-matrix.md`
- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-11-running-plan-anti-flatness-repair-coach-acceptance.md`

## Root Cause

Visible symptom:

- Hito can build `Marathon Base`, but it still cannot honestly offer a selected-distance full marathon completion plan.

Underlying cause:

- there is no coach-owned `Marathon Completion` family contract
- `Marathon Base` is base-only and must not be stretched into a full marathon selected-distance promise

Canonical owner:

- Running Coach doctrine and source-of-truth before Backend implementation

---

## 1. Accepted Decision

Hito should add a separate deterministic selected-plan family:

- `Marathon Completion`

This family is distinct from:

- `Marathon Base`

`Marathon Completion` exists for runners whose selected-distance goal is:

- finish a full marathon
- reach an exact `42195m` endpoint honestly

It is not the same thing as:

- general marathon base building
- marathon target-time preparation
- aggressive marathon performance preparation

## 2. Family Promise And Non-Promise

### Promise

`Marathon Completion` promises:

- a finish-focused selected-distance plan for exact `42195m`
- a long enough bridge to make the request honest under the universal no-dead-end doctrine
- visible adaptation, durability, cutback, taper, and endpoint logic
- family-specific marathon completion identity, not generic distance filler

### Non-Promise

`Marathon Completion` must not imply:

- target-time readiness
- race-pace precision
- marathon race-readiness for aggressive performance goals
- hidden `Marathon Base` substitution
- elite or advanced marathon-specific performance programming

## 3. Marathon Completion Versus Marathon Base

| Family | Honest promise | Endpoint | Specificity style | Must never imply |
| --- | --- | --- | --- | --- |
| `Marathon Base` | aerobic durability and time on feet | honest non-race endpoint only | base-only support, steady support, time-on-feet growth | `42195m` completion, marathon race readiness, target-time readiness |
| `Marathon Completion` | finish-focused full marathon preparation | exact `42195m` selected-distance endpoint | long-run durability, selective marathon-specific steady support, taper, completion-specific runway | target-time pace truth, race-pace readiness, hidden performance marathon plan |

Backend and UI must never collapse these families into one label.

---

## 4. Eligibility Under Universal No-Dead-End Doctrine

### Must Not Block

The following are not valid reasons to refuse `Marathon Completion` by default:

- `beginner_new_runner`
- low current fitness by itself
- conservative or heavier load context by itself
- very long required duration by itself
- selected goal ambition by itself

### May Still Block

The following remain valid structural unavailable reasons:

- `daysPerWeek < 3`
- fixed rest days leave too few trainable days
- preferred long-run day is blocked and no honest fallback exists
- the resolved calendar cannot preserve recovery around the long run
- the resolved calendar forces unsafe compression that more weeks cannot solve
- the requested target date is too soon for the minimum honest family floor

### Minimum Availability Contract

`Marathon Completion` requires:

- `3`, `4`, or `5` running days per week

`2` or fewer running days per week should remain unavailable for this family in v1.

That is a structural family boundary, not a runner-level rejection.

---

## 5. Horizon And Auto-Extension Contract

### General Law

Backend must choose the shortest horizon that keeps all of the following honest:

- adaptation
- durable weekly consistency
- repeatable long-run growth
- clear cutback rhythm
- marathon-specific completion build
- taper
- exact `42195m` endpoint

If the family becomes dishonest when shorter, the horizon must extend automatically.

The runner must not be asked whether they want more weeks.

### Preferred Horizon Matrix

These are coach-owned preferred ranges for v1. Backend may extend longer when needed, but must not compress below the validator floor.

| Runner level | Runs per week | Standard-load preferred | Standard-load floor | Conservative-load preferred | Conservative-load floor |
| --- | --- | --- | --- | --- | --- |
| `beginner_new_runner` | `5` | `56-72 weeks` | `48 weeks` | `68-88 weeks` | `56 weeks` |
| `beginner_new_runner` | `4` | `64-84 weeks` | `56 weeks` | `76-100 weeks` | `64 weeks` |
| `beginner_new_runner` | `3` | `80-104 weeks` | `68 weeks` | `96-130 weeks` | `80 weeks` |
| `sometimes_runs` | `5` | `40-52 weeks` | `32 weeks` | `52-64 weeks` | `40 weeks` |
| `sometimes_runs` | `4` | `48-60 weeks` | `40 weeks` | `60-76 weeks` | `48 weeks` |
| `sometimes_runs` | `3` | `60-80 weeks` | `48 weeks` | `76-104 weeks` | `60 weeks` |
| `runs_a_lot` | `5` | `28-40 weeks` | `24 weeks` | `40-52 weeks` | `32 weeks` |
| `runs_a_lot` | `4` | `36-48 weeks` | `28 weeks` | `48-60 weeks` | `36 weeks` |
| `runs_a_lot` | `3` | `48-60 weeks` | `36 weeks` | `60-76 weeks` | `48 weeks` |
| `professional_competitive` | `5` | `24-36 weeks` | `20 weeks` | `36-48 weeks` | `28 weeks` |
| `professional_competitive` | `4` | `32-44 weeks` | `24 weeks` | `44-56 weeks` | `32 weeks` |
| `professional_competitive` | `3` | `44-56 weeks` | `32 weeks` | `56-72 weeks` | `44 weeks` |

### Horizon Adjustment Rules

- `conservative_load` adds time, not intensity
- lower weekly frequency adds time, not density
- long-run preference and fixed rest rules shape the schedule, but do not justify shortening the horizon
- if the runner wants a marathon too soon for the floor, Backend should return an honest compressed-goal unavailable state rather than silently squeezing the family

---

## 6. Phase Model

`Marathon Completion` must not be one flat block.

It must progress through:

1. `adaptation`
2. `base`
3. `durability_bridge`
4. `marathon_completion_build`
5. `taper`
6. `endpoint`

### Phase A: Adaptation

Purpose:

- build routine
- protect tissues and consistency
- prevent fake urgency

Allowed emphasis:

- run-walk adaptation where needed
- easy support
- recovery
- very gentle long-run growth
- cutback rhythm

### Phase B: Base

Purpose:

- establish repeatable aerobic weeks
- build support volume honestly
- introduce light leg-turnover reminders when safe

Allowed emphasis:

- easy
- recovery
- long aerobic run
- cutback long run
- easy run with strides late in the phase
- steady aerobic support when runner level and load allow

### Phase C: Durability Bridge

Purpose:

- turn consistency into marathon durability
- prepare the runner for longer long-run roles
- introduce only completion-relevant moderate work

Allowed emphasis:

- steady aerobic support
- progression support
- controlled tempo only for supported levels
- recurring long-run durability weeks
- cutbacks

### Phase D: Marathon Completion Build

Purpose:

- make the plan read as a full-marathon completion plan rather than long generic base

Allowed emphasis:

- long-run durability checkpoints
- long runs with controlled steady finish
- marathon steady specificity for supported levels
- cutbacks
- soft sharpening only where runner level supports it

### Phase E: Taper

Purpose:

- preserve confidence
- reduce fatigue
- keep identity without fake sharpness

Required emphasis:

- taper long run
- easy support
- recovery
- optional strides or taper tune-up depending on level

### Phase F: Endpoint

Required emphasis:

- exact `42195m` selected-distance endpoint
- no `marathon_base_endpoint`
- no vague finish-day surrogate

---

## 7. Week Archetype Expectations

Backend may map these to existing composition grammar names where possible, but the family must preserve these week intents.

| Week archetype | Required | Meaning |
| --- | --- | --- |
| `adaptation_run_walk_week` | conditional | run-walk or very soft support for true beginners |
| `easy_support_week` | yes | easy and recovery backbone |
| `turnover_week` | yes | strides-only leg-turnover support, never interval logic |
| `steady_support_week` | yes | marathon-support steady work without threshold inflation |
| `progression_support_week` | conditional | mild progression support when steady support is already stable |
| `tempo_support_week` | conditional | controlled tempo support only for supported levels |
| `long_run_durability_week` | yes | long run has checkpoint or durability role |
| `long_run_steady_finish_week` | yes for supported levels, conditional for beginners | long run carries the week's specific stimulus with a restrained finish role |
| `cutback_week` | yes | visible reduction in long-run burden and total strain |
| `taper_sharpening_week` | yes | light sharpening before endpoint without race-plan density |
| `endpoint_week` | yes | exact `42195m` endpoint |

### Anti-Flatness Requirement

Long horizons must show recurring midweek phase meaning.

The family fails coaching acceptance if the second half collapses into:

- only easy
- only recovery
- only generic long run
- only cutback

for long multi-week stretches with no support or specific identity.

---

## 8. Workout Pattern Inventory

### Canonical Allowed Inventory By Family

`Marathon Completion` may draw from:

- `run_walk_adaptation`
- `easy_aerobic_run`
- `recovery_jog`
- `easy_run_with_strides`
- `steady_aerobic_run`
- `progression_run`
- `controlled_tempo_session`
- `marathon_steady_specificity`
- `long_aerobic_run`
- `long_run_with_steady_finish`
- `cutback_long_run`
- `taper_long_run`
- `cutback_aerobic_run`
- `taper_tuneup_run`

### Optional Terrain-Support Identities

Only when the runner context already supports rolling/hilly terrain and Backend can keep recovery honest:

- `rolling_hills_session`

This is optional support, not a family requirement.

### Forbidden In V1 Marathon Completion

The following must remain forbidden in the normal `Marathon Completion` family:

- `distance_intervals`
- `time_intervals`
- `5k_sharpening_repeats`
- `10k_rhythm_intervals`
- `half_marathon_threshold_durability`
- `race_pace_session`
- explicit target-time marathon pace sessions
- mountain/trail/ultra specialties

Rationale:

- this family is finish-focused
- intervals and target-time sessions would drift toward a performance-marathon family that Hito has not defined yet

---

## 9. Runner-Level Intensity And Specificity Rules

### `beginner_new_runner`

Allowed:

- run-walk adaptation where needed
- easy support
- recovery
- long run
- cutback long run
- light strides after adaptation
- steady aerobic support late
- very selective late long-run steady finish only when `5d` standard-load and the bridge is already stable

Forbidden:

- progression before steady support is established
- controlled tempo
- marathon steady specificity
- intervals
- threshold-like work

### `sometimes_runs`

Allowed:

- all beginner-safe tools
- progression support
- controlled tempo support late in the build
- long-run steady finish
- selective marathon steady specificity in the final third only

Forbidden:

- weekly sharp quality
- interval logic
- two moderate weeks stacked without relief

### `runs_a_lot`

Allowed:

- all `sometimes_runs` tools
- earlier steady support
- repeated controlled tempo support
- repeated long-run steady finish
- repeated marathon steady specificity in the specific build

Forbidden:

- interval-heavy marathon build
- target-time pace blocks by default
- threshold-dominant programming

### `professional_competitive`

Allowed:

- strongest version of completion-family specificity
- earlier marathon steady specificity
- richer steady-finish long runs
- optional controlled hills support when terrain and spacing permit

Still forbidden:

- performance-marathon interval logic
- target-time or race-pace claims
- second hard session per week in this completion family

This runner level should receive a richer completion plan, not a hidden performance plan.

---

## 10. Progression Ladder

Backend should progress the family in this order:

1. `run_walk_adaptation` or pure easy support
2. `easy_aerobic_run`
3. `easy_run_with_strides`
4. `steady_aerobic_run`
5. `progression_run`
6. `controlled_tempo_session`
7. `marathon_steady_specificity`
8. `long_run_with_steady_finish`
9. `taper_tuneup_run`
10. exact `42195m` endpoint

Not every runner level needs every rung.

But the family must always feel like it is moving upward in a controlled way, not jumping from:

- easy filler

to:

- late marathon-specificity all at once

---

## 11. Long-Run Progression And Cutback Rules

### Long-Run Identity

Long runs must carry visible roles across the block:

- `support`
- `durability_checkpoint`
- `steady_finish`
- `cutback`
- `taper`
- `endpoint`

### Long-Run Structure Rules

- beginner and conservative paths should spend longer in `support` and `durability_checkpoint`
- supported paths should eventually show repeated `steady_finish` long runs
- long runs must not remain one anonymous shell for the full plan
- long-run richness must not be the only source of family richness; midweek identity still matters

### Cutback Rhythm

Required:

- early and middle phases: roughly every `3rd` or `4th` week
- late completion build: still regular enough to protect long-run growth
- taper is not a cutback replacement; taper must be its own endpoint preparation phase

### Long-Run Specificity Caps

- `beginner_new_runner`: no aggressive finish segments
- `sometimes_runs`: finish role may appear, but should be clearly controlled
- `runs_a_lot` and `professional_competitive`: finish role may recur, but cannot become marathon target-time simulation

---

## 12. Conservative And Low-Availability Behavior

### Conservative Load

Conservative Marathon Completion must:

- extend the horizon
- preserve the exact endpoint
- delay moderate work
- reduce the number of specific weeks
- keep long-run growth conservative

Conservative Marathon Completion must not:

- remove all family identity
- flatten into easy/recovery/long-only filler
- fake marathon-specific sharpness to compensate visually

### Three-Day Rule

Three-day completion plans are allowed only when:

- one long run has protected recovery context
- there is at most one moderate development idea in a week
- the moderate idea is not adjacent to the long run in a structurally unsafe way

Three-day completion plans should rely more on:

- long-run role
- steady support
- progression support

and less on:

- tempo density
- sharpening density

---

## 13. Impossible Or Compressed Goal Response

If the requested marathon target date is too soon for an honest completion plan, Backend must not:

- silently downgrade to `Marathon Base`
- silently compress the family below the floor
- pretend the runner is marathon-ready

Backend should instead return an honest unavailable state such as:

- `insufficient_horizon_for_selected_distance`

or another explicit structural-compression reason if the engine already uses a canonical unavailable taxonomy.

The runner-facing explanation should say that:

- Hito needs a longer runway to build an honest marathon completion plan from the current setup

not that:

- the runner is too beginner

---

## 14. Endpoint Rules

`Marathon Completion` must end with:

- exact `42195m`

Required endpoint rules:

- exact selected-distance endpoint truth
- taper visible before endpoint
- no `marathon_base_endpoint`
- no generic “long race effort” placeholder
- no target-time split table unless a future approved pace-truth source exists for a different family

---

## 15. Minimum Family Identity Signals

A credible `Marathon Completion` plan must show all of:

- `marathon_completion_exact_endpoint`
- `marathon_completion_time_on_feet`
- `marathon_completion_long_run_durability`
- `marathon_completion_cutback_protection`
- `marathon_completion_taper`

And at least one recurring midweek support signal from:

- `marathon_completion_turnover`
- `marathon_completion_steady_support`
- `marathon_completion_progression_support`
- `marathon_completion_specificity`

The family fails coaching acceptance if it reaches exact `42195m` but reads like:

- only a longer version of `Marathon Base`
- or only a stretched easy/long calendar with one late special week

---

## 16. Validator Expectations For Future Scenario JSON

Backend scenario JSON for `Marathon Completion` should eventually prove:

- no `unsupported_runner_level_for_family` for coach-plausible marathon completion requests
- exact `42195m` endpoint
- no `marathon_base_endpoint`
- no fake precise pace in runner-facing rows
- no fake personal HR in runner-facing rows
- no interval or race-pace leakage in this family
- visible cutback weeks
- visible taper week(s)
- development sequence not empty in long horizons
- second-half anti-flatness preserved
- long-run role sequence includes `durability_checkpoint`, `cutback`, `taper`, and `endpoint`

### Suggested Preview-Ready Acceptance Checks

For preview-ready `Marathon Completion` scenarios, QA or validator output should eventually prove:

- exact endpoint value is `42195m`
- family label is `Marathon Completion`
- family identity signals are present
- long horizon scenarios contain recurring non-long-run phase meaning
- conservative and beginner scenarios stay softer without collapsing into filler
- supported scenarios show richer marathon-completion specificity than `Marathon Base`

---

## 17. Runner-Facing Naming And Copy Constraints

### Required Naming Boundary

Use:

- `Marathon Completion`

Optional runner-facing friendly label:

- `Finish a Marathon`

Do not label this family as:

- `Marathon Base`
- `Balanced Marathon`
- `Marathon Race Plan`
- `Marathon Target Time`

### Required Copy Themes

Allowed copy themes:

- finish-focused
- exact full-marathon goal
- long runway
- durability
- time on feet
- recovery protection
- honest conservative build

Forbidden copy themes:

- goal pace
- race pace
- PR attempt
- sub-X readiness
- Boston qualifier implications
- “ready to race hard”

### Review Copy Requirements

Review copy should explicitly explain:

- Hito selected a longer duration because full-marathon completion needs a longer bridge from the current setup
- the family is finish-focused, not target-time focused
- the endpoint is exact `42195m`
- pace and HR targets remain bounded by metric-truth rules

---

## 18. Metric-Truth Policy

Preserve existing product guardrails:

- no fake precise pace
- no fake personal HR
- no 5K benchmark dependency in the normal happy path
- default HR remains editable/advisory only
- numeric watch-executable structure remains primary

For `Marathon Completion`, this means:

- beginner and completion-first plans should often be `structure_only_executable`
- pace targets are not justified by target ambition alone
- marathon-specificity can be expressed through structure and role, not fake pace truth

---

## 19. Backend Handoff Summary

Backend should implement `Marathon Completion` as a separate selected-plan family with:

- exact `42195m` endpoint
- no-dead-end auto-extension
- distinct validator and unavailable logic
- completion-specific long-run progression
- one-hard-idea-per-week ceiling
- finish-focused, not target-time-focused, identity
- explicit separation from `Marathon Base`

If the engine cannot yet meet this contract, `Marathon` selected distance should remain unavailable because:

- the family mapping is incomplete

not because:

- the runner is too beginner

---

## 20. External Sanity Check References

This doctrine was aligned against the existing Hito source-of-truth plus established marathon finish-plan conventions, including:

- Hal Higdon Novice 1 Marathon overview: `18` weeks, `4` running days, long-run progression, regular stepback weeks, conversational pacing, and walking as an acceptable finish strategy
- Boston Athletic Association beginner marathon overview: novice/beginner level built around roughly `4` days per week with substantial long-run progression

These external references are sanity checks only. Hito still owns its own longer no-dead-end bridge doctrine for true beginners, conservative load, and low-availability selected-distance marathon completion.
