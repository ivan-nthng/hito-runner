# Running Plan Engine Universal No-Dead-End Doctrine

Date: 2026-06-10
Owner: Running Coach
Status: Accepted source-of-truth for global running-plan eligibility and auto-extension after
Architect checkpoint on 2026-06-10
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

## Accepted Decision

Hito must not normally refuse a running plan because:

- the runner is `beginner_new_runner`
- the goal distance is ambitious
- the current fitness is low
- the load context is conservative or heavy
- the honest answer is a very long plan

If the runner input is coach-plausible, Hito must auto-extend the horizon until the family promise becomes honest.

The runner may then accept or reject that long plan.

Hito must not ask:

- whether the runner wants more weeks
- whether the runner wants a shorter unsafe version

The system may explain the chosen duration, but the duration itself is backend-owned plan truth.

## Root-Cause Correction

The old doctrine blocked some distance families at the runner-level boundary.

That was a symptom treatment.

The real owner is:

- horizon selection
- phase composition
- structural safety validation
- honest family mapping

The product problem is not:

- `beginner runner + big goal`

The product problem is:

- `the engine cannot yet produce an honest enough bridge for that goal`

The correct doctrine is therefore:

- auto-extend when more time solves honesty
- block only when more time still does not solve structure

## Canonical Constraints To Preserve

- Hito engine authors the normal plan, not AI.
- Watch/app execution remains assumed.
- No fake precise pace.
- No fake personal HR.
- Default HR remains editable/advisory only.
- Numeric structure remains primary.
- Cues and RPE remain secondary.
- Exact endpoint truth remains required where the family promises a selected distance.
- Honest non-race endpoint truth remains required where the family is base-only.

## 1. Global Eligibility Law

### Must Not Block

The following reasons must never be the normal product reason to refuse a plan:

- `beginner_new_runner`
- ambitious distance by itself
- weak current fitness by itself
- heavy/conservative load by itself
- long timeline by itself
- low support by itself when support can be compensated through more calendar time

### May Still Block

The following are valid structural unavailable reasons:

- insufficient available running days for the family contract
- fixed rest-day conflicts that make valid long-run placement impossible
- preferred long-run day is explicitly blocked and no honest fallback exists
- resolved training weekdays still create unsafe recovery compression that cannot be solved by adding more weeks
- unsupported product family where no honest family mapping exists yet

### Structural Over Ambition

The doctrine is:

- block structural impossibility
- do not block ambition

## 2. Global Family Mapping Contract

| Runner request | Honest family mapping | Normal outcome |
| --- | --- | --- |
| `10K` | `10K` exact selected-distance family | auto-extend if needed, then build exact `10000m` endpoint plan |
| `Half Marathon` | `Half Marathon` exact selected-distance family | auto-extend if needed, then build exact `21100m` endpoint plan |
| `Marathon Base` | `Marathon Base` base-only family | auto-extend if needed, then build honest base/durability plan |
| `Marathon` selected distance | separate full Marathon completion family, not Marathon Base | if Marathon family exists, auto-extend; if it does not exist yet, unavailable because family mapping is missing, not because runner level is too low |

## 3. Marathon Base Versus Marathon

`Marathon Base` must remain a base-only family.

It is not an honest substitute for:

- full marathon completion readiness
- marathon race preparation
- marathon target-time preparation

Product therefore needs a separate full Marathon selected-distance family when it wants to support actual marathon ambition honestly.

Until that family exists, `Marathon` may still be unavailable as:

- `unsupported_distance_family`
- or equivalent honest family-mapping unavailability

That is a product-family limitation, not a runner-level rejection.

## 4. Horizon Selection Principles

### General Rule

Select the shortest horizon that keeps all of the following honest:

- safe adaptation
- visible cutbacks
- long-run growth
- family-specific build
- recovery spacing
- taper or endpoint integrity

If the plan becomes unsafe or fake when shorter, extend it.

There is no aesthetic upper cap.

Multi-year plans are acceptable if that is the honest answer.

### Family Horizon Ladder

These are coach-owned preferred ranges, not artificial caps.

#### 10K

| Runs per week | Standard-load preferred | Conservative-load preferred | Notes |
| --- | --- | --- | --- |
| `5` | `12-16 weeks` | `16-20 weeks` | a true beginner can still need adaptation before the classic short 10K block |
| `4` | `14-18 weeks` | `18-22 weeks` | more time replaces density |
| `3` | `16-22 weeks` | `20-28 weeks` | low frequency means longer runway, not harder weeks |

#### Half Marathon

| Runs per week | Standard-load preferred | Conservative-load preferred | Notes |
| --- | --- | --- | --- |
| `5` | `24-28 weeks` | `28-32 weeks` | bridge plus specific Half tail |
| `4` | `28-32 weeks` | `32-36 weeks` | medium bridge |
| `3` | `32-40 weeks` | `36-48 weeks` | low frequency requires major runway |

#### Marathon Base

| Runs per week | Standard-load preferred | Conservative-load preferred | Notes |
| --- | --- | --- | --- |
| `5` | `24-36 weeks` | `32-44 weeks` | base-only promise, no race endpoint |
| `4` | `32-44 weeks` | `40-52 weeks` | long aerobic bridge emphasis |
| `3` | `40-56 weeks` | `52-72 weeks` | may be a very long durability path |

#### Marathon Completion Family

This family is future required product work, but the doctrine should exist now.

| Runs per week | Standard-load preferred | Conservative-load preferred | Notes |
| --- | --- | --- | --- |
| `5` | `40-52 weeks` | `52-64 weeks` | honest beginner marathon completion path |
| `4` | `48-60 weeks` | `60-76 weeks` | lower frequency means longer adaptation and bridge |
| `3` | `60-80 weeks` | `76-104 weeks` | multi-year is acceptable if that is the honest answer |

### Extension Logic

- More rest constraints does not justify more intensity.
- More conservative load does justify more weeks.
- Fewer running days almost always means more weeks.
- Lower current durability means more early adaptation and base time.
- Large distance jumps mean a longer durability bridge before specific work.

## 5. Universal Phase Model For Long Plans

Very long plans should not be one giant flat base phase.

They should progress through:

1. `adaptation`
2. `base`
3. `durability_bridge`
4. `distance_specific_build`
5. `taper_or_endpoint`

### Adaptation

Purpose:

- establish routine
- build tolerance
- protect the runner from false urgency

Typical ingredients:

- run-walk where needed
- easy aerobic support
- recovery
- conservative long-run growth

### Base

Purpose:

- repeatable aerobic support
- stable weekly rhythm
- early cutback discipline

Typical ingredients:

- easy
- recovery
- steady support where safe
- long run
- cutback long run
- light strides later

### Durability Bridge

Purpose:

- turn routine into distance durability
- deepen long-run identity
- introduce safe moderate work

Typical ingredients:

- strides
- steady support
- progression where safe
- long-run durability
- selective controlled sustained work

### Distance-Specific Build

Purpose:

- make the family visibly distinct

Typical ingredients by family:

- `10K`: turnover, tempo, intervals when support allows
- `Half Marathon`: sustained durability, long-run role, controlled tempo/threshold ladder as support allows
- `Marathon Base`: time on feet, durable steady support, honest base-specific long-run work
- `Marathon Completion`: completion-specific durability, time on feet, cautious marathon-specific steady work, no fake race pace

### Taper Or Endpoint

Purpose:

- reduce fatigue
- preserve the family promise
- keep endpoint honest

## 6. Weekly Shape Rules For Very Long Beginner Plans

### Three-Day Plans

The plan must stay sparse but purposeful.

Canonical shape:

- support
- soft development or bridge
- long run

Rules:

- long run carries much of the identity
- only one development idea
- more weeks instead of denser loading

### Four-Day Plans

Canonical shape:

- easy
- support
- development or steady bridge
- long run

Rules:

- enough room for one meaningful moderate idea
- still no hidden second hard day

### Five-Day Plans

Canonical shape:

- easy
- support
- development
- recovery or short support
- long run

Rules:

- extra frequency supports adaptation and durability
- extra frequency must not be spent on prettier intensity density

## 7. Beginner Marathon Examples

These are doctrine examples for Backend and Architect, not implementation proof.

### Beginner Marathon Completion, 3 Days/Week

- preferred horizon: `60-80 weeks`
- conservative horizon: `76-104 weeks`
- weekly rhythm: `support / bridge / long run`
- early phase: run-walk adaptation, easy support, conservative long-run growth
- middle phase: long base and durability bridge, multiple cutbacks, selective strides, then steady support
- late phase: completion-specific durability, not target-time logic
- forbidden: threshold-rich calendar, interval-heavy density, fake race pace

### Beginner Marathon Completion, 4 Days/Week

- preferred horizon: `48-60 weeks`
- conservative horizon: `60-76 weeks`
- weekly rhythm: `easy / support / bridge / long run`
- extra fourth day improves consistency, not aggression
- late build may include controlled progression or steady marathon-durability support

### Beginner Marathon Completion, 5 Days/Week

- preferred horizon: `40-52 weeks`
- conservative horizon: `52-64 weeks`
- weekly rhythm: `easy / support / development / recovery / long run`
- more frequent running allows shorter overall duration than `3d`, but still requires a long bridge
- late build may support stronger durability expression, but still not fake target-time specificity without truth

## 8. Family-Specific Auto-Extension Rules

### 10K

- already suitable for beginner auto-extension
- if the classic short 10K block is too abrupt, extend adaptation and base before the sharper 10K tail
- do not solve weak durability by blocking the goal

### Half Marathon

- use the dedicated beginner Half bridge logic
- long-run durability and sustained support become the core identity
- do not collapse the bridge into a short supported-Half clone

### Marathon Base

- beginner runners may receive a very long base path
- the family promise remains base-only
- no full-marathon endpoint overclaim

### Marathon Completion

- if supported by product, must auto-extend rather than runner-level block
- the full selected-distance endpoint must remain honest
- multi-year plans are allowed

## 9. UI Explanation Contract

The UI may explain the chosen duration in review.

Allowed explanation shape:

- `Hito built this as a 40-week plan because your current setup needs a longer bridge before the distance-specific phase.`
- `Hito extended this plan to 72 weeks because three running days per week require a longer durability runway for an honest marathon build.`

Forbidden explanation shape:

- `Do you want more weeks?`
- `You are too beginner for this goal.`
- `This is the same plan, just stretched.`
- `Hito could make it shorter, but this looked safer.`

## 10. Validator Expectations

Backend validator expectations:

- no `unsupported_runner_level_for_family` for coach-plausible runner-level/distance combinations
- unavailable only for structural blockers or unsupported family mapping
- scenario generation must include long-horizon beginner examples, not only blocked beginner fixtures
- fake pace remains forbidden
- fake personal HR remains forbidden
- exact endpoint truth remains required where the family promises a selected distance
- honest non-race endpoint truth remains required for `Marathon Base`

### Structural Unavailable Expectations

Valid unavailable codes or equivalent product states:

- insufficient available running days
- long-run day blocked
- structurally unsafe compression that cannot be solved by time
- unsupported family mapping

Invalid normal unavailable reasons:

- beginner runner level
- ambitious distance by itself
- long required duration
- conservative load by itself

## 11. Superseded Narrow Doctrines

This doctrine supersedes any older running-coach artifact that says the normal answer should be:

- block `beginner_new_runner + Half Marathon`
- block `beginner_new_runner + Marathon Base`
- block ambitious but structurally plausible distance goals only because the bridge would be long

Family-specific bridge artifacts remain useful only as specializations under this global law.

## 12. Coaching Basis

This doctrine follows a conservative coaching principle also visible in mainstream novice plans: published novice Half and Marathon schedules are relatively short only when they already assume some starting base.

Examples:

- Hal Higdon's marathon novice material describes an `18-week` novice block with four run days and an initial `6-mile` long run, which already assumes a runner is beyond pure zero-base adaptation: [Marathon Training for All Skill Levels](https://www.halhigdon.com/training/marathon-training/) and [Novice 1 Marathon](https://www.halhigdon.com/training-programs/marathon-training/novice-1-marathon/)
- Hal Higdon's Half Marathon material similarly separates novice plans from beginning-runner guidance, which supports adding an adaptation bridge rather than pretending every beginner can enter a short race-specific block directly: [Half Marathon Training](https://www.halhigdon.com/training/half-marathon-training/) and [Beginning Runner's Guide](https://www.halhigdon.com/training-programs/more-training/beginning-runners-guide/)

The product implication is:

- if the runner lacks that starting base, Hito should add time
- not deny the plan
