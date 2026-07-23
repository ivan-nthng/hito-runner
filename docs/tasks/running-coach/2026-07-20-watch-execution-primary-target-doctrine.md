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

Every generated runnable leaf or ordered Repeat child has exactly one numeric
`primary_execution_mode`:

| Mode | Runner-facing command | Required truth |
|---|---|---|
| `pace` | Exact or range min/km pace | AI-authored benchmark-informed or explicitly estimated pace |
| `heart_rate` | Estimated or personal BPM cap/range | Explicitly accepted HR profile, snapshotted before review |

Unaccepted estimated HR is advisory context only. Once the runner explicitly accepts the age-derived
ranges, AI may use their exact BPM snapshot as the single command for an appropriate aerobic leaf, while
the guidance remains labelled estimated rather than personal or measured. Raw `Z1-Z5` remain
internal provenance and are never runner-facing instructions. Repeat parents are structural and own
no target. Effort, RPE, talk-test, and cues may add useful context but never become a primary or
exportable command.

## Execution-Mode Matrix

| Workout or block | Default primary mode | Notes |
|---|---|---|
| Adaptation Run/Walk | `pace` | Run and Walk children each receive a broad numeric pace; timing and alternation remain structural |
| Recovery | accepted `heart_rate`, otherwise `pace` | Prefer BPM control; otherwise use a broad AI-estimated pace range |
| Easy run | `heart_rate` or `pace` | AI chooses the single command from purpose and supplied truth |
| Long run | usually `heart_rate`; `pace` for pace-specific portions | AI chooses; never competing commands |
| Warm-up / Cooldown | usually `pace`; `heart_rate` when sustained | Use a broad range unless the block is long enough for HR control to be useful |
| Steady / aerobic | `heart_rate` or `pace` | AI chooses from purpose and runner truth |
| Tempo / threshold | usually `pace`; `heart_rate` for sustained continuous blocks | Short work does not use HR as its command |
| Intervals | `pace` | Work and short movement-recovery leaves each receive numeric pace |
| Race-pace work | `pace` | AI may estimate a range without a benchmark and provenance must remain estimated |
| Strides | `pace` | Each stride and movement-recovery leaf receives its own target |
| Hills | `pace`; `heart_rate` only for sustained climbing | Terrain/grade cues stay supplemental |
| Race day | usually `pace`; `heart_rate` only for an explicitly HR-controlled strategy | AI authors the choice and numeric value |

Ordered Repeat children may use different numeric modes. Nested repeats are out of scope.

## First-Session Adaptation

For `new_to_running` and `beginner`, AI authors an adaptation opening: four spaced Run/Walk,
Easy, or Recovery contacts across the first 14 days; the first Long Run is no earlier than day 15.
Their Run and Walk leaves use broad numeric pace ranges, or accepted-profile BPM where appropriate;
conversational guidance remains cue text. `running_regularly` and
`performance_focused` do not receive this adaptation instruction.

This is AI authoring guidance, not a backend planner, post-authoring substitution, or safety veto.

## Hydration

AI may place an explicit `Hydration` step in a prolonged session, a race-specific session with known
aid access, or when supplied warm/humid context makes a water opportunity relevant. Hydration is
non-runnable and has no duration, distance, Repeat, pace, BPM, or effort target. It tells the runner
to take water without prescribing quantities, schedules, treatment, or medical claims. It is not
added mechanically to every workout and remains distinct from Rest and recovery running.

## Prior Evidence

[watch-execution-live-acceptance proof](../../../qa-artifacts/screenshots/2026-07-20/watch-execution-live-acceptance/proof.json)
accepted the prior one-command real-provider path for four persisted, exported, and re-imported plans.
That evidence does not by itself accept the newer numeric-only and Hydration contract:

| Scenario | Accepted execution proof |
|---|---|
| 10K, `new_to_running` | Prior adaptation opening used `run_walk`/`effort`; superseded as generated command modes |
| Half Marathon, `beginner` with personal profile | Personal BPM commands survive review and saved readback |
| Marathon, `running_regularly` | Pace-led quality blocks; AI did not select estimated HR for this accepted plan |
| Custom 15K, `performance_focused` | Pace-led `4:40/km` Work blocks; no competing BPM command |

All four scenarios completed the full lifecycle, so they remain regression evidence for signing,
persistence, export/re-import, fixture isolation, and target exclusivity only.

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

- Every generated runnable leaf has one and only one numeric pace or BPM primary mode.
- A mode has one compatible runner-facing command target.
- Pace and BPM never compete on the same leaf.
- Repeat parents are targetless; ordered children keep their own modes and order.
- Accepted estimated and personal BPM snapshots stay stable after a runner changes profile zones.
- The chosen mode survives review, confirm, persistence, export/import, and all readbacks.
- The normal local runner runtime uses the real provider or a bounded unavailable outcome; fixtures
  are QA-only and cannot author or persist an ordinary runner plan.
- Hydration is targetless, non-runnable, coach-authored, and never a Repeat child.

## Sources

Garmin's step-target model supports pace and heart-rate target types and informs the watch-execution
anatomy only, not Hito medical or performance claims:

- [Garmin workout step targets](https://support.garmin.com/en-US/?faq=wZ52AaLbLG2GC1Lxu2l4k7)
- [Garmin Run Coach target modes](https://support.garmin.com/en-US/?faq=xmMRe8rjaZ3CNaINXf8dLA)
- [ACSM exercise and fluid replacement position stand](https://pubmed.ncbi.nlm.nih.gov/17277604/)
- [NATA fluid replacement position statement](https://pubmed.ncbi.nlm.nih.gov/28985128/)

## Current Status

The generated provider/compiler contract now implements this doctrine. Offline lifecycle proof and
the bounded real-provider 10K canary passed with one exclusive numeric command on every runnable
leaf, targetless Repeat parents, and targetless coach-authored Hydration. Broader product-wide QA
acceptance remains a separate gate.
