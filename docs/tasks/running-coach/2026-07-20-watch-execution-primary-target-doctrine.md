# Watch Execution Primary Target Doctrine

**Date:** 2026-07-20
**Last Updated:** 2026-07-21
**Owner:** Running Coach
**Status:** Accepted coaching source of truth
**Plan file:** none

## Decision

Hito presents one clear execution command for every runnable workout leaf. The AI authors that
choice; backend preserves it through the provider contract, compiler, signed review, persistence,
export/import, and readback. Backend must reject contradictory data, never choose a target,
replace a target, or build a fallback workout.

Every runnable leaf or ordered Repeat child has exactly one `primary_execution_mode`:

| Mode | Runner-facing command | Required truth |
|---|---|---|
| `pace` | Exact or range min/km pace | Explicit approved benchmark-backed pace truth |
| `heart_rate` | Estimated or personal BPM cap/range | Explicitly accepted HR profile, snapshotted before review |
| `effort` | Concrete RPE, talk-test, or execution cue | AI-authored qualitative execution guidance |
| `run_walk` | Timed run and walk units plus repeat structure | AI-authored adaptation structure |

Unaccepted estimated HR is advisory context only. Once the runner explicitly accepts the age-derived
ranges, AI may use their BPM snapshot as the single command for an appropriate aerobic leaf, while
the guidance remains labelled estimated rather than personal or measured. Raw `Z1-Z5` remain
internal provenance and are never runner-facing instructions. Repeat parents are structural and own
no target. Cues may add useful context but never become a second command.

## Execution-Mode Matrix

| Workout or block | Default primary mode | Notes |
|---|---|---|
| Adaptation Run/Walk | `run_walk` | Timed run/walk units, easy cue, no pace or HR |
| Recovery | `effort` | Very easy conversational execution |
| Easy run | accepted `heart_rate` or `effort` | AI chooses; estimated availability never forces HR and pace is not a competing command |
| Long run | accepted `heart_rate` or `effort` | AI chooses; pace only for an intentionally pace-specific block |
| Warm-up / Cooldown | `effort` | Easy gradual movement or downshift |
| Steady / aerobic | `heart_rate`, `pace`, or `effort` | AI chooses the single mode from purpose and available truth |
| Tempo / threshold | `pace`, accepted `heart_rate`, or `effort` | AI chooses one; never pace and HR together as commands |
| Intervals | `pace`, otherwise `effort` | HR lag makes it non-primary on ordinary fast reps |
| Race-pace work | `pace`, otherwise `effort` | Target time alone cannot create pace truth |
| Strides / hills | `effort` | Numeric pace is normally inappropriate |
| Race day | `pace`, otherwise `effort` | Pace requires approved race-strategy truth |

Ordered Repeat children may use different modes. For example: Warm-up effort -> Work pace ->
Recover effort -> Cooldown effort. Nested repeats are out of scope.

## First-Session Adaptation

For `new_to_running` and `beginner`, AI authors an adaptation opening: four spaced Run/Walk,
Easy, or Recovery contacts across the first 14 days; the first Long Run is no earlier than day 15.
Those opening blocks use `run_walk` or `effort`, never pace or HR. `running_regularly` and
`performance_focused` do not receive this adaptation instruction.

This is AI authoring guidance, not a backend planner, post-authoring substitution, or safety veto.

## Accepted Evidence

[watch-execution-live-acceptance proof](../../../qa-artifacts/screenshots/2026-07-20/watch-execution-live-acceptance/proof.json)
accepted the real-provider path for four persisted, exported, and re-imported plans:

| Scenario | Accepted execution proof |
|---|---|
| 10K, `new_to_running` | Adaptation opening uses `run_walk`/`effort`; no false pace or HR command |
| Half Marathon, `beginner` with personal profile | Personal BPM commands survive review and saved readback |
| Marathon, `running_regularly` | Pace-led quality blocks; AI did not select estimated HR for this accepted plan |
| Custom 15K, `performance_focused` | Pace-led `4:40/km` Work blocks; no competing BPM command |

All four scenarios completed `provider -> compiler -> signed review -> one confirm -> local
persistence -> export/re-import`. QA confirmed desktop and exact 375px readback, zero competing
pace/BPM commands, zero Repeat-parent targets, no fixture/fallback, and cleanup to zero. Running
Coach accepted the four-plan matrix.

## Contract Boundary

- [Provider contract](../../../src/lib/ai-authored-plan-first-provider-contract.ts) expresses the
  AI-authored mode and its compatible target truth.
- [Compiler](../../../src/lib/ai-authored-plan-first-compiler.ts) preserves the mode or rejects
  contradictory/incomplete data before review.
- [WorkoutDocument](../../../src/lib/workout-document.ts) carries the resulting runner-facing
  command through review, persistence, export/import, and readback.

The compiler does not derive pace from a goal time, relabel estimated HR as personal, add recovery,
infer a mode, or repair an AI workout. Invalid data does not create a reviewable draft.

## Acceptance Invariants

- Every runnable leaf has one and only one primary mode.
- A mode has one compatible runner-facing command target.
- Pace and BPM never compete on the same leaf.
- Repeat parents are targetless; ordered children keep their own modes and order.
- Accepted estimated and personal BPM snapshots stay stable after a runner changes profile zones.
- The chosen mode survives review, confirm, persistence, export/import, and all readbacks.
- The normal local runner runtime uses the real provider or a bounded unavailable outcome; fixtures
  are QA-only and cannot author or persist an ordinary runner plan.

## Sources

Garmin's step-target model supports pace and heart-rate target types and informs the watch-execution
anatomy only, not Hito medical or performance claims:

- [Garmin workout step targets](https://support.garmin.com/en-US/?faq=wZ52AaLbLG2GC1Lxu2l4k7)
- [Garmin Run Coach target modes](https://support.garmin.com/en-US/?faq=xmMRe8rjaZ3CNaINXf8dLA)

## Current Status

No runtime blocker remains for this doctrine. Future changes to coaching target selection must update
this document first, then change the AI contract and re-run the four-scenario acceptance matrix.

The 2026-07-21 runner-baseline acceptance extends command eligibility from personal-only to an
explicitly accepted estimated profile. Deterministic provider/compiler proof covers that mapping;
the existing live-provider matrix remains valid evidence that AI can still choose effort or pace
instead of using available HR. A paid rerun was not required for this contract reconciliation.
