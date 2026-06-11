# Running Plan No-Dead-End Long-Horizon Coach Audit

Date: 2026-06-10
Owner: Running Coach
Status: Audit after Backend `running_plan_horizon_policy_v1` and QA pass
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
Primary doctrine: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md`

## Audit Scope

This audit judges coaching quality only:

- family identity
- phase meaning
- long-horizon richness
- beginner/conservative realism
- long-run role credibility
- development-touch cadence
- runner-facing interpretation risk

It does not judge:

- source validity
- CLI/build behavior
- DB/Supabase behavior
- persistence
- browser/UI behavior

## High-Level Verdict

The no-dead-end expansion is directionally correct and materially better than the old runner-level block behavior.

Accepted:

- `10K` beginner and supported standard-load outputs remain mostly coach-credible.
- `Half Marathon` beginner bridge and supported conservative outputs are broadly coach-credible.
- structural unavailable reasons are now more honest.

Not yet accepted:

- the newly preview-ready long-horizon `Marathon Base` beginner and conservative paths are too often stretched rather than truly composed.
- several long `Marathon Base` plans preserve endpoint honesty and long-run detail richness, but still lack enough midweek phase meaning to feel like real long-form base programs.

## What Is Working

### 10K

- exact `10000m` endpoint remains honest
- beginner 10K still stays simple rather than intensity-heavy
- supported standard-load 10K still preserves rhythm, tempo, intervals, and hills where appropriate

### Half Marathon

- exact `21100m` endpoint remains honest
- beginner bridge scenarios now show:
  - delayed strides
  - repeated long-run durability identity
  - cutbacks
  - late Half-specific sustained work
- conservative Half scenarios preserve family identity through long-run durability and steady-finish structure rather than fake sharpness

### Marathon Base

- `Marathon Base` still does not leak into fake `42195m`, race-pace, or race-readiness claims
- long-run anatomy is often strong:
  - checkpoint rotation
  - finish-role variation
  - honest time-on-feet identity

## Core Coaching Failure Pattern

The main coaching regression is not safety.

It is long-horizon flattening:

- horizon auto-extends correctly
- cutbacks remain present
- long runs become richer
- but midweek development or bridge identity sometimes disappears for too long

The result is a plan that is technically valid and safe, but reads like:

- `Easy / Recovery / Long / Cutback` for months
- then a late block where the long run finally does all the interesting work

That is not enough for a coach-credible long-form base program.

## Scenario Findings

| Scenario id | Family | Issue class | Why it is not coach-credible enough | Required coaching rule | Recommended backend owner |
| --- | --- | --- | --- | --- | --- |
| `matrix__marathon_base__beginner_new_runner__young_light__3d__none__sunday__normal_monday` | `Marathon Base` | over-extended without midweek phase meaning | `40` weeks, but the only explicit development touch is `39:strides`. Weeks `1-20` are almost entirely `easy_support`/`cutback`, and the plan waits too long before giving the runner any visible midweek bridge identity. The long run becomes richer later, but the calendar still reads too flat for too long. | Very long beginner Marathon Base plans need at least a light bridge ladder before the late long-run-specific phase: early turnover, then steady support or another light bridge expression spread across the first two thirds of the block. | `running_plan_horizon_policy_v1` + Marathon Base builder/composition policy |
| `matrix__marathon_base__beginner_new_runner__young_light__5d__monday_friday__sunday__normal_monday` | `Marathon Base` | too flat for frequency available | `24` weeks at `5d` still shows only one explicit touch: `23:strides`. That is too little visible progression for a runner training five days per week. It is safe, but it undersells what a real base program should feel like. | Five-day beginner Marathon Base should introduce at least one earlier light turnover block and at least one safe mid-block support progression signal before taper. | Marathon Base builder/composition policy |
| `beginner_marathon_base` | `Marathon Base` | acceptance-pack alias of same flattening bug | The acceptance fixture confirms the same pattern: long-run roles improve, but the non-long-run training week remains too empty for too long. | Same as above; do not treat long-run detail richness as sufficient on its own. | Marathon Base builder/composition policy |
| `matrix__marathon_base__beginner_new_runner__older_heavier__5d__none__unset_default__normal_monday` | `Marathon Base` | conservative long horizon stretched, not composed | `32` weeks, `5d`, conservative load, but again only `31:strides` as explicit touch. Conservative does not justify deleting nearly all midweek developmental shape. | Conservative long-horizon Marathon Base still needs visible but soft bridge identity, not only longer easy-running time. | Marathon Base builder/composition policy |
| `matrix__marathon_base__runs_a_lot__older_heavier__3d__none__sunday__midweek_wednesday` | `Marathon Base` | front-loaded midweek identity with long dead zone | `52` weeks. Explicit touches end at week `10`, then do not return until taper (`51:strides`). Long-run roles become stronger later, but a full-year base plan still needs occasional reintroduced soft support identity so the midweek pattern does not go dead. | Very long conservative Marathon Base blocks need re-injected mid-block support touches after the early block, even when long runs carry more of the plan identity. | Horizon policy + Marathon Base diversity policy |
| `matrix__10k__sometimes_runs__older_heavier__3d__wednesday_saturday__unset_default__midweek_wednesday` | `10K` | mild over-extension / front-loaded specificity | `20` weeks with useful work only at weeks `2,3,5,7`, then essentially nothing until taper. This is safer than the Marathon Base cases, but the later half of the block risks reading like stretched filler. | Long-horizon conservative 10K should preserve at least one late turnover or tempo reminder before taper rather than front-loading all specificity. | 10K horizon/composition policy |

## Accepted Scenarios Worth Preserving

These examples should not be over-corrected:

| Scenario id | Why it works |
| --- | --- |
| `schedule_stress__half_marathon__beginner_new_runner__none__sunday__normal_monday` | `32`-week `3d` beginner Half remains sparse, but the phase movement is visible: late strides, long-run durability, late sustained work, taper sharpening, exact endpoint. This is long, but not dead. |
| `beginner_half_marathon` | `24`-week `5d` beginner Half shows a believable bridge from early support into long-run durability and then late sustained work without fake sharpness. |
| `matrix__half_marathon__runs_a_lot__older_heavier__3d__none__sunday__normal_monday` | conservative Half stays honest yet still preserves Half identity through durability, steady-finish long runs, and late support specificity. |
| `matrix__10k__professional_competitive__young_light__4d__monday_friday__unset_default__midweek_wednesday` | standard-load 10K still differentiates pro/runs-a-lot properly with tempo, repeated intervals, and hills. |

## Coaching Rules To Encode

### 1. Long Horizon Must Add Phase Meaning, Not Only Calendar Length

Auto-extension is not complete when it only produces:

- more easy weeks
- more cutbacks
- richer long runs

It must also produce:

- visible midweek bridge progression
- reintroduced soft identity after long flat spans
- family-appropriate changes across phases

### 2. Marathon Base Needs A Soft Midweek Bridge Ladder

For beginner and conservative `Marathon Base`, allow only soft tools, but they must exist:

- early or mid-block `strides`
- later `steady_aerobic_run` where safe
- selective late `progression_run` only if still clearly base-only

Do not rely on long-run role alone to carry all richness.

### 3. Very Long Plans Need Stimulus Reintroduction

If a plan exceeds roughly:

- `20` weeks for `10K`
- `28` weeks for `Half Marathon`
- `32` weeks for `Marathon Base`

then the builder should prove that the second half of the block contains some reintroduced family identity, not just a long uninterrupted desert between early touches and taper.

### 4. Conservative Does Not Mean Blank

Conservative/heavy contexts may:

- soften
- delay
- reduce frequency

but they must not:

- erase all midweek identity
- push the first real touch almost to taper
- turn long-horizon plans into extended support-only calendars

## Next Backend Slice Recommendation

Fix priority:

1. `Marathon Base` long-horizon beginner and conservative composition
2. long-horizon conservative `10K` anti-flatness check

Do not change:

- endpoint truth
- structural unavailable cases
- fake pace/HR guardrails
- no-watch/no-app policy
- Marathon Base base-only boundary

## Recommended Next Role

`BACKEND`

