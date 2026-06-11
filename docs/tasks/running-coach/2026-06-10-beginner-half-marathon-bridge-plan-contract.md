# Running Plan Engine Beginner Half Marathon Auto-Extended Bridge Plan Contract

Date: 2026-06-10
Owner: Running Coach
Status: Proposed source-of-truth for Backend beginner Half Marathon auto-extension
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

## Scope Note

This artifact is now a family-specific specialization under the global doctrine:

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md`

Use the global doctrine for eligibility law and blocking logic.

Use this artifact only for Half-specific bridge shape, duration details, and workout-pattern boundaries.

## Accepted Decision

`beginner_new_runner + Half Marathon` is no longer a normal `unsupported_runner_level_for_family` outcome.

If the runner input is coach-plausible, Hito must automatically extend the total plan horizon and build a beginner-safe bridge plan that leads into an honest Half Marathon endpoint.

The runner must not be asked whether they want more weeks.

The UI may explain the automatically selected duration, but it must not introduce a separate opt-in gate.

## Why The Old Outcome Is Obsolete

The previous deterministic v1 block solved a real coaching problem: a short supported-Half shape would have been too thin for a true beginner.

That root cause is now owned by duration and composition, not by the frontend CTA:

- the problem was not the disabled Create button
- the problem was that the builder only had a short Half horizon
- the correct fix is an auto-extended beginner bridge contract

## Canonical Constraints To Preserve

- Hito engine authors the normal plan, not AI.
- Watch/app execution remains assumed.
- No fake precise pace.
- No fake personal HR.
- Default HR guidance may be editable/advisory only.
- Numeric structure stays primary.
- Cues and RPE remain secondary.
- `Half Marathon` must still end with exact `21100m` endpoint truth.
- This slice does not change `Marathon Base`.

## 1. Eligibility And Auto-Extended Horizon

### Coach-Plausible Beginner Half Eligibility

`beginner_new_runner + Half Marathon` is eligible only when all of the following are true:

- `daysPerWeek` is `3`, `4`, or `5`
- fixed rest days still leave enough trainable weekdays after long-run placement
- preferred long-run day is not blocked by explicit fixed rest
- weekly shape can preserve recovery after the long run
- weekly shape can avoid hidden compression around the single moderate touch

### Still-Blocked Beginner Half Cases

The builder should still return preview-unavailable when the request is structurally dishonest:

- `daysPerWeek < 3`
- preferred long-run day is explicitly blocked by fixed rest days
- fixed rest days leave too few trainable weekdays
- the resolved weekly shape cannot provide a recovery/easy next running slot after the long run
- the resolved weekly shape forces the only moderate touch adjacent to the long run in a way that cannot be softened honestly

Do not use `unsupported_runner_level_for_family` as the normal beginner Half outcome.

### Horizon Matrix

Backend should use the preferred totals below as the v1 contract.

Minimum totals are validator floors only. They exist to prevent future silent compression, not to encourage shorter beginner Half plans.

| Runs per week | Standard-load preferred total | Standard-load minimum | Conservative-load preferred total | Conservative-load minimum | Bridge-prefix intent before the final Half-specific tail |
| --- | --- | --- | --- | --- | --- |
| `5` | `24 weeks` | `22 weeks` | `28 weeks` | `26 weeks` | shorter bridge because weekly exposure is higher, but still not a short novice Half shortcut |
| `4` | `28 weeks` | `26 weeks` | `32 weeks` | `30 weeks` | medium bridge with longer consistency and long-run buildup |
| `3` | `32 weeks` | `30 weeks` | `36 weeks` | `34 weeks` | longest bridge because low frequency needs more calendar time, not denser stress |

### Duration Rules

- The final beginner Half endpoint remains exact `21100m`.
- `conservative_load` adds `4 weeks` to the preferred total.
- Fixed rest days and long-run preference shape the calendar, but do not shorten the horizon.
- Backend may extend beyond the preferred total only in a future dedicated restart or medical-safe slice, not in this v1 contract.
- Backend must not silently squeeze a beginner Half request into the supported non-beginner `14-week` Half builder.

## 2. Bridge-Plan Weekly Shape

### Weekly Shape By Availability

| Runs per week | Canonical weekly rhythm | Coaching intent |
| --- | --- | --- |
| `3` | `support / support-or-touch / long run` | low frequency means the long run carries more identity; the single moderate touch must stay soft and well-separated |
| `4` | `easy / support / touch-or-steady / long run` | enough room for one meaningful development idea without making the week feel dense |
| `5` | `easy / support / touch / recovery-or-short-support / long run` | extra frequency supports habit and durability, not extra hardness |

### Fixed Rest Day And Long-Run Preference Rules

- Long run should remain on the runner's preferred long-run day when that day is valid.
- If long run is on `Sunday`, the next actual running slot must be `easy`, `recovery`, or very soft run-walk.
- If long run is on `Saturday` and `Sunday` is a running day, `Sunday` must be easy/recovery only.
- The moderate touch must not sit in the last pre-long-run running slot for `3-day` beginner Half plans.
- `4-day` and `5-day` beginner Half plans should keep at least one support-only running slot between the moderate touch and the long run whenever the resolved weekday pattern allows it.

## 3. Required Beginner Half Week Archetypes

Backend may map these to existing grammar names or extend the grammar explicitly, but the plan must preserve these week intents.

| Week archetype | Required in block | What it means |
| --- | --- | --- |
| `adaptation_run_walk_week` | yes | short run-walk or very easy continuous support, habit-first, no sharp development |
| `adaptation_easy_support_week` | yes | easy/support backbone with conservative long-run growth |
| `beginner_turnover_week` | yes | light strides only, never full interval logic |
| `beginner_steady_support_week` | yes | steady aerobic support without threshold inflation |
| `beginner_progression_support_week` | yes | mild progression only after base consistency exists |
| `beginner_long_run_durability_week` | yes | long run has a clear durability checkpoint role, not anonymous filler |
| `beginner_cutback_week` | yes | visibly reduced long run and softer total stress |
| `beginner_tempo_durability_week` | conditional | conservative sustained work late in the block, never threshold-like |
| `beginner_taper_sharpening_week` | yes | strides-only or very light sharpening before endpoint |
| `beginner_half_endpoint_week` | yes | exact `21100m` endpoint, no fake race-readiness copy |

## 4. Phase Contract

The beginner Half bridge plan is not one long generic base block. It must move through clear phases.

### Phase A: Adaptation

Typical duration:

- `5d standard`: first `4 weeks`
- `4d standard`: first `6 weeks`
- `3d standard`: first `8 weeks`
- `conservative_load`: add `2 weeks`

Allowed patterns:

- run-walk support
- easy aerobic support
- recovery jog or very soft easy support
- long run
- cutback long run

Required behavior:

- no strides in the first half of this phase
- no progression
- no steady finish long run
- no tempo-like work
- long run grows gently and visibly

### Phase B: Aerobic Bridge

This phase turns beginner habit into beginner durability.

Allowed patterns:

- easy aerobic support
- recovery jog
- light strides
- steady aerobic support
- long run durability
- cutback long run

Required behavior:

- first `strides` may appear only after the runner has completed at least one cutback week
- `steady_aerobic_run` may appear before any progression or tempo-like durability
- the week still has only one development idea
- long run remains more important than calendar busyness

### Phase C: Beginner Half-Specific Bridge

This phase introduces Half identity without pretending the runner is already a supported performance Half athlete.

Allowed patterns:

- easy aerobic support
- recovery jog
- strides
- steady aerobic support
- progression run
- controlled tempo-like durability
- long run durability
- cutback long run
- selective late long run with controlled steady finish

Required behavior:

- `progression_run` may appear only after the runner has already shown multiple steady-support weeks
- `controlled tempo-like durability` is a late-block tool, not an early-block shortcut
- long run durability must appear repeatedly across this phase
- the plan must read like a Half bridge, not like a slow 10K clone

### Phase D: Taper And Endpoint

Required behavior:

- penultimate week is `taper_sharpening`
- final week is `beginner_half_endpoint_week`
- non-endpoint workouts in the final week must stay `easy`, `recovery`, or very soft run-walk

## 5. When Specific Patterns May Appear

| Pattern | Earliest safe appearance | Standard-load ceiling | Conservative-load ceiling | Forbidden behavior |
| --- | --- | --- | --- | --- |
| `strides` | after at least one cutback and after the first adaptation half is complete | regular light turnover signal in the second half of the block | lighter and less frequent, still present | no strides as a disguised interval workout |
| `steady_aerobic_run` | early-to-middle bridge once basic easy consistency exists | repeatable support tool | repeatable support tool | must not read as threshold by label or target |
| `progression_run` | middle-to-late bridge only after steady support exists | up to `2` total for `4d/5d standard`, up to `1` total for `3d standard` | up to `1` total late only | must not become race-pace or threshold-in-disguise |
| `controlled tempo-like durability` | final third of the block only | up to `2` total for `5d standard`, up to `1` total for `4d standard`, optional none for `3d standard` | optional `1` total only, and only if long-run durability is already stable | no threshold language, no race pace, no precise pace truth |
| `long_run_durability` | throughout the block after initial adaptation weeks | recurring identity | recurring identity | must not be anonymous one-block filler |
| `long_run_with_steady_finish` | late only, after repeated plain durability long runs | allowed once for `5d standard`, optional once for `4d standard` | forbidden | must count as the week's only development stimulus |

## 6. Forbidden Patterns For Beginner Half

These are forbidden across the entire beginner Half auto-extension contract:

- `threshold`
- `intervals`
- `hills`
- `race_pace_session`
- fake precise pace
- fake personal HR
- exact pace derived from target time alone
- aggressive steady-finish long runs repeated like performance workouts
- any week that looks like a compressed supported-performance Half plan

## 7. Long-Run Progression Contract

### Long-Run Identity

Beginner Half long runs must be progressive and descriptive:

- opener
- durable main body
- one explicit checkpoint or settle role
- controlled finish or settle-down close

Do not use one anonymous single-block long run shell for the whole block.

### Long-Run Duration Intent

Backend may use time-first expression. The exact minutes may still be shaped by the runner's availability, but the following intent must hold:

| Runs per week | Start-zone intent | Peak pre-taper intent | Notes |
| --- | --- | --- | --- |
| `3` | roughly `50-60 min` | roughly `1h45m-1h55m` | more calendar time instead of sharper loading |
| `4` | roughly `55-65 min` | roughly `1h50m-2h00m` | standard beginner Half durability path |
| `5` | roughly `60-70 min` | roughly `1h55m-2h05m` | extra frequency supports the bridge, not a faster endpoint promise |

### Cutback Rules

- cutback long runs must appear at least every `4th` week once the block is beyond the earliest adaptation stage
- cutback must be visibly lighter, not a token `5-minute` trim
- cutback weeks may keep `strides`, but must not carry progression plus long-run finish in the same week

## 8. Metric Truth Contract

Beginner Half bridge plans should default to:

- `numeric_structure` for all non-rest workouts
- `structure_only_executable` when pace truth does not exist
- optional editable/advisory default HR guidance for easy, recovery, and controlled steady work only

Do not use:

- precise pace targets
- personal HR-zone claims
- fake threshold HR
- target-time-derived pace specificity

## 9. Runner-Facing Review Copy Contract

The review surface should explain the longer duration, but must not ask permission for it.

Required copy shape:

- explain that Hito automatically extended the plan because the runner is building from a beginner/new-runner starting point
- explain that the early bridge builds consistency and long-run durability before the Half-specific phase
- name the total duration selected

Good product direction:

`Hito extended your Half Marathon plan to 28 weeks so the early phase can safely build consistency and long-run durability before the Half-specific phase.`

Forbidden product direction:

- `Do you want a longer plan?`
- `This is the normal Half plan but stretched out.`
- `You are race-ready now and just need extra weeks.`

## 10. Backend Validator Expectations

Backend validation should fail beginner Half output when any of the following are true:

- the result returns `unsupported_runner_level_for_family` for a coach-plausible beginner Half request
- total horizon is below the minimum for the resolved days/week and load context
- final non-rest row is not exact Half endpoint truth
- the plan contains `threshold`, `intervals`, `hills`, or `race_pace_session`
- the next actual running slot after the long run is not easy/recovery/soft run-walk
- the plan never introduces `strides`
- the plan never introduces `steady support`, `progression`, or `controlled tempo-like durability` where the resolved horizon should be rich enough to support at least one of them
- long runs stay anonymous and do not rotate checkpoint/finish role
- conservative-load output collapses into generic filler with no Half-specific durability identity

### Minimum Richness Gates

| Runs per week | Standard-load minimum richness | Conservative-load minimum richness |
| --- | --- | --- |
| `3` | run-walk adaptation, `strides >= 2`, `steady/progression signal >= 1`, repeated long-run durability, `cutback_long_run >= 4`, exact endpoint | run-walk adaptation, `strides >= 2`, repeated long-run durability, `cutback_long_run >= 5`, exact endpoint |
| `4` | run-walk adaptation, `strides >= 2`, `steady/progression/tempo-like signal >= 2`, repeated long-run durability, `cutback_long_run >= 4`, exact endpoint | run-walk adaptation, `strides >= 2`, `steady/progression/tempo-like signal >= 1`, repeated long-run durability, `cutback_long_run >= 4`, exact endpoint |
| `5` | run-walk adaptation, `strides >= 3`, `steady/progression/tempo-like signal >= 2`, repeated long-run durability, `cutback_long_run >= 4`, exact endpoint | run-walk adaptation, `strides >= 2`, `steady/progression/tempo-like signal >= 1`, repeated long-run durability, `cutback_long_run >= 4`, exact endpoint |

## 11. Backend Handoff Summary

Backend should implement beginner Half as:

- a family-specific auto-extended builder path
- not as a frontend opt-in
- not as reuse of the supported non-beginner `14-week` Half path unchanged
- not as a blocked preview unless the request is structurally impossible

The clean ownership boundary is:

- Backend owns eligibility, horizon selection, archetype selection, validator gates, and truthful preview-unavailable cases
- Frontend only explains the chosen duration and renders the backend-shaped review truth
