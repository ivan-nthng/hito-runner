# Watch Execution Primary Target Doctrine

**Date:** 2026-07-20
**Last Updated:** 2026-07-23
**Owner:** Running Coach
**Status:** Accepted coaching source of truth; long-run and sequential-target refinements enforced
through canonical backend validation
**Plan file:** none

## Decision

Hito presents one clear execution command for every runnable workout leaf. The AI authors that
choice; backend preserves it through the provider contract, compiler, signed review, persistence,
export/import, and readback. Backend must reject contradictory data, never choose a target,
replace a target, or build a fallback workout.

Every generated runnable leaf or ordered Repeat child has exactly one numeric
`primary_execution_mode`:

| Mode         | Runner-facing command               | Required truth                                              |
| ------------ | ----------------------------------- | ----------------------------------------------------------- |
| `pace`       | Exact or range min/km pace          | AI-authored benchmark-informed or explicitly estimated pace |
| `heart_rate` | Estimated or personal BPM cap/range | Explicitly accepted HR profile, snapshotted before review   |

Unaccepted estimated HR is advisory context only. Once the runner explicitly accepts the age-derived
ranges, AI may use their exact BPM snapshot as the single command for an appropriate aerobic leaf, while
the guidance remains labelled estimated rather than personal or measured. Raw `Z1-Z5` remain
internal provenance and are never runner-facing instructions. Repeat parents are structural and own
no target. Effort, RPE, talk-test, and cues may add useful context but never become a primary or
exportable command.

## Execution-Mode Matrix

| Workout or block    | Default primary mode                                                       | Notes                                                                                             |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Adaptation Run/Walk | `pace`                                                                     | Run and Walk children each receive a broad numeric pace; timing and alternation remain structural |
| Recovery            | accepted `heart_rate`, otherwise `pace`                                    | Prefer BPM control; otherwise use a broad AI-estimated pace range                                 |
| Easy run            | `heart_rate` or `pace`                                                     | AI chooses the single command from purpose and supplied truth                                     |
| Long run            | one AI-selected `heart_rate` or `pace` mode                                | Use that mode across all substantive stages; see Long Aerobic Run Anatomy                          |
| Warm-up / Cooldown  | usually `pace`; `heart_rate` when sustained                                | Use a broad range unless the block is long enough for HR control to be useful                     |
| Steady / aerobic    | `heart_rate` or `pace`                                                     | AI chooses from purpose and runner truth                                                          |
| Tempo / threshold   | usually `pace`; `heart_rate` for sustained continuous blocks               | Short work does not use HR as its command                                                         |
| Intervals           | `pace`                                                                     | Work and short movement-recovery leaves each receive numeric pace                                 |
| Race-pace work      | `pace`                                                                     | AI may estimate a range without a benchmark and provenance must remain estimated                  |
| Strides             | `pace`                                                                     | Each stride and movement-recovery leaf receives its own target                                    |
| Hills               | `pace`; `heart_rate` only for sustained climbing                           | Terrain/grade cues stay supplemental                                                              |
| Race day            | usually `pace`; `heart_rate` only for an explicitly HR-controlled strategy | AI authors the choice and numeric value                                                           |

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

## Long Aerobic Run Anatomy

This section is the shared coaching contract for generated plans and the manual workout
constructor. It resolves the current drift where the manual path expects multi-block long runs
above 60 minutes while the generated path can leave a long run as one continuous leaf.

### Scope and identity

The rule applies to workouts whose canonical identity is a long-run identity:

- `long_aerobic_run`;
- `cutback_long_run`;
- `taper_long_run`;
- `long_run_with_steady_finish`;
- family-specific time-on-feet or mountain long-run identities.

It does not apply merely because an `easy_aerobic_run` happens to have a long duration. If a
session is intended to train long-run durability, it must use a long-run identity rather than
hide that purpose under an Easy label. An ordinary Easy run does not need a long-run checkpoint
or finish anatomy solely because it is longer than a usual support run.

### Duration threshold

The threshold uses total planned elapsed duration across runnable blocks and repeated runnable
children. Hydration, coach-cue notes, rest, and other non-runnable events do not add duration and
do not count as executable blocks. Do not convert a distance-only prescription into minutes using
an invented pace. If the canonical plan has no elapsed-duration value, the identity and explicit
block anatomy must carry the truth rather than a guessed threshold.

| Total planned elapsed duration                                   | Required long-run anatomy                                                                                                                                                                                                | Coaching decision                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 60 minutes or less                                               | One continuous `long_run_body_block` is allowed. Warm-up/cooldown may be separate when useful.                                                                                                                           | Do not split solely to make the workout look richer.                                                 |
| More than 60 and up to 90 minutes                                | `long_run_body_block` plus at least one additional meaningful executable block. The additional block must be an entry/opener, a settle finish, a deliberate long-run finish, or a second body block around a checkpoint. | A token one-minute shell or arbitrary equal split is not meaningful.                                 |
| More than 90 and up to 120 minutes                               | Use a long body plus a visible checkpoint or Hydration event and a distinct finish/settle block, or a second body block around the event.                                                                                | The event must serve posture, fueling, equipment, or route management; it is not decorative copy.    |
| More than 120 minutes, or an ultra/mountain time-on-feet session | Use at least two meaningful time-on-feet/body leaves separated by a checkpoint or Hydration event, with a settle or deliberate finish when the session has a closing purpose.                                            | Body leaves may differ in operational role; they must not be equal splits without a coaching reason. |

When time-based, an entry or settle block should normally be at least 5 minutes. A deliberate
steady finish should normally be at least 15 minutes so it changes the session's purpose rather
than acting as a label on a token block. These are minimum meaningful shapes, not instructions to
add extra work to a short long run.

### What makes a split meaningful

An additional block is justified only when at least one of these purposes changes:

1. **Entry:** settle into the long run before the main aerobic body.
2. **Checkpoint:** posture, fueling, equipment, route, or terrain-management pause.
3. **Hydration:** a targetless event placed at a meaningful time or distance opportunity.
4. **Progression:** a planned change from easy aerobic running to a deliberate steady finish.
5. **Finish:** a separate controlled settle-down block after the main body.

If none of these purposes changes, keep one continuous body leaf. Do not manufacture equal
20-minute or 30-minute chunks.

### Target and progression rules

Every runnable leaf still has exactly one numeric `primary_execution_mode` and target:

- A normal `long_aerobic_run` keeps one consistent mode and aerobic target across its body leaves.
  Repeating the same target across a meaningful checkpoint split is allowed; the split is for
  execution management, not hidden intensity.
- Pace may progress only when an approved pace truth exists and the workout identity explicitly
  authorizes a pace-specific finish.
- HR may progress across steps only when the identity explicitly has a controlled steady finish
  and the accepted HR profile supports both commands. Default or accepted estimated HR remains
  labelled estimated; it is not personal or measured HR truth.
- A deliberate progression changes the identity to `long_run_with_steady_finish` or another
  canonical progression identity. It must not remain a plain `long_aerobic_run` with a hidden
  harder final block.
- No leaf may show pace and HR as simultaneous primary commands. The non-primary metric is absent
  from alerts and may appear only as clearly labelled context when it is true.

### Hydration semantics

Hydration is a non-runnable, targetless event. It may have a coach-authored cue or an authored
time/distance placement marker, but it has no pace, BPM, effort target, repeat count, or color
truth. It does not count as a runnable leaf and does not satisfy the long-run multi-block rule
by itself; it makes the split meaningful only when it separates or accompanies real executable
long-run blocks.

### The 50-minute case

A 50-minute `long_aerobic_run` consisting of one continuous runnable body leaf is accepted by
this anatomy policy when:

- the workout identity is explicitly long-run, not ordinary Easy;
- the single leaf has one valid numeric pace or BPM command;
- the phase and runner-level policy make that dose credible;
- there is no hidden progression or fueling event being omitted.

It is not a policy violation merely because it has one leaf. For a true new runner, the separate
first-session adaptation doctrine can still prohibit placing a long-run identity that early; that
is a scheduling and progression decision, not a reason to split the 50-minute workout.

### Generated/manual reconciliation and enforcement owner

This is one coaching contract for both paths. Its canonical enforcement owner is
`src/lib/long-run-execution-policy.ts`, used by:

- generated AI compilation: `src/lib/ai-authored-plan-first-compiler.ts`;
- manual constructor validation: `src/lib/manual-workout-authoring/validator.ts`.

Backend rejects invalid anatomy and contradictory execution modes. It does not synthesize blocks,
targets, or progression, and it does not rewrite historical saved plans. The 60-minute threshold is
therefore one enforced contract rather than a manual-only implementation detail.

## Sequential Target Policy

A sequential strategy is an intentional change of execution command across meaningful ordered
leaves. It is not a requirement to split a long workout, and it is not a license to add a new
target every kilometer. The watch result must be either one steady numeric command or an explicit
small number of ordered numeric commands.

### Identity permissions

| Canonical identity                       | Sequential target policy                                                                                                           | Maximum substantive stages |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `long_aerobic_run`                       | No changing target. A checkpoint split may repeat the same target.                                                                 | 1 aerobic command          |
| `cutback_long_run`                       | No progression. Entry, body, settle, and cooldown remain one conservative mode.                                                    | 1 aerobic command          |
| `taper_long_run`                         | No progression. Preserve light rhythm with one command.                                                                            | 1 aerobic command          |
| `long_run_with_steady_finish`            | Allowed: easy aerobic body followed by one deliberate steady finish.                                                               | 2 aerobic commands         |
| `marathon_steady_specificity`            | Allowed only as controlled aerobic durability: body plus one steady/settle stage. No race-pace claim.                              | 2 aerobic commands         |
| `progression_run`                        | Sequential targets are the identity's purpose, but it is not a long-run identity. Use a bounded ladder, not repeated micro-stages. | 2-3 commands               |
| `race_pace_session` or race-day strategy | Not a Marathon Base identity. Reserved for a future Marathon Completion/race-execution contract with its own explicit identity.    | Future-only                |

The current taxonomy is sufficient for continuous long runs, steady-finish long runs, and Marathon
Base durability. It is not sufficient for a full marathon race-execution strategy. Do not overload
`long_run_with_steady_finish` or `marathon_steady_specificity` with opening/middle/finish race
claims. A future race-execution identity must be approved before that behavior exists.

### Stage meaning and boundaries

A target change is allowed only when the stage purpose changes and the stage is long enough to
execute as a real block. For long-run strategies, a changed time-based stage should normally be
at least 15 minutes; a distance-based stage must represent a real course or race-purpose boundary
such as a final race segment, not an arbitrary 1 km slice. Shorter blocks belong to interval or
stride identities, not progressive long-run strategy.

Use these boundaries:

- **Entry:** optional easy settling block before the main body; it does not create progression.
- **Aerobic body:** the durable long-run work; keep its command stable in `long_aerobic_run`.
- **Checkpoint/Hydration:** a targetless event or same-target pause; it is not a new intensity.
- **Steady finish:** one clearly longer closing stage, normally at least 15 minutes, with a
  controlled increase in aerobic demand.
- **Race strategy:** only a future dedicated family may use opening, middle, and protected-finish
  stages as race execution. It must not be inferred from a target date or target time.

A plan must not create sequential targets when the only reason is visual variety, calendar
density, or a generic desire to use every available segment type.

### Time versus distance

| Use time-based stages when                                                                                                       | Use distance-based stages when                                                                                                     | Do not change targets when                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Route, terrain, weather, or aid opportunities make elapsed exposure the real purpose. This is the default for aerobic long runs. | The distance itself is the coaching purpose: validated race-rhythm work, a selected-distance endpoint, or a measured race segment. | The session is ordinary aerobic durability and no purpose changes. Keep one target, even if the run is long. |
| The watch should advance through an aerobic block without pretending that pace is stable.                                        | An approved pace truth exists and the route is stable enough for the command to be honest.                                         | A guessed pace conversion would be needed to divide a distance-only long run into time stages.               |

A distance-only plan must not invent elapsed minutes from an assumed pace. If a threshold needs
to be evaluated, use an existing authored elapsed-duration value or keep the identity's explicit
multi-block anatomy without fabricated timing.

### Pace-led, BPM-led, and mixed strategies

For the substantive long-run stages, choose one strategy mode:

- **Pace-led:** every substantive stage has one validated pace command; HR is absent from alerts
  and may be non-command context only.
- **BPM-led:** every substantive stage has one accepted personal or accepted estimated BPM
  command; pace is absent from alerts and may be non-command context only.
- **Mixed-mode:** not allowed for the current long-run identities. It may be considered only by a
  future dedicated race-execution identity when each stage has independent target truth and a
  different coaching purpose. It must never be added to make a normal long run look richer.

Warm-up and cooldown leaves may follow their own normal support prescription, but they do not
turn an otherwise steady long run into a mixed strategy. Within a deliberate steady finish,
prefer same-mode progression: BPM to a higher accepted BPM range or validated pace to a faster
validated pace range. Never place pace and BPM on the same leaf as competing commands.

### Boundary examples

**Long aerobic run, 75 minutes:** opener 10 minutes at one aerobic BPM command, long body 55
minutes at the same aerobic BPM command, Hydration event if relevant, and a 10-minute settle at
the same command. This is multi-block anatomy but not progressive training.

**Long run with steady finish, 90 minutes:** opener 10 minutes, aerobic body 60 minutes at the
chosen mode, Hydration/checkpoint event, then 15-20 minutes at one higher controlled steady
command, followed by cooldown. This is one intentional change and counts as the session's
development signal.

**Marathon Base durability session:** 10-minute entry, 50-minute aerobic body, targetless
checkpoint, 15-minute controlled steady finish, cooldown. It may use one BPM-led command that
changes within accepted aerobic ranges, but it must not show marathon race pace, target-time
splits, 42.195 km endpoint, or race-readiness language.

**Future Marathon Completion race strategy:** opening, middle, and protected finish may use
distance-based or time-based stages only under a separately approved race-execution identity.
That behavior is outside the current Marathon Base product contract.

### Source basis

Garmin's official workout model is step-oriented: duration and intensity are attached to workout
steps, and target modes differ by workout purpose. Hito uses that device precedent but applies the
stricter rule of exactly one primary numeric command per runnable leaf, with targetless Hydration
events. See the Garmin links in the Sources section and the Hito provider contract.

## Prior Evidence

[watch-execution-live-acceptance proof](../../../qa-artifacts/screenshots/2026-07-20/watch-execution-live-acceptance/proof.json)
accepted the prior one-command real-provider path for four persisted, exported, and re-imported plans.
That evidence does not by itself accept the newer numeric-only and Hydration contract:

| Scenario                                        | Accepted execution proof                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 10K, `new_to_running`                           | Prior adaptation opening used `run_walk`/`effort`; superseded as generated command modes |
| Half Marathon, `beginner` with personal profile | Personal BPM commands survive review and saved readback                                  |
| Marathon, `running_regularly`                   | Pace-led quality blocks; AI did not select estimated HR for this accepted plan           |
| Custom 15K, `performance_focused`               | Pace-led `4:40/km` Work blocks; no competing BPM command                                 |

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
- A long-run identity over 60 minutes has a long body plus meaningful multi-block anatomy.
- A long-run identity at 60 minutes or less may remain one continuous body leaf.
- An `easy_aerobic_run` is not relabelled as a long run solely to satisfy anatomy.
- A plain long aerobic run has no hidden progression; deliberate progression uses a distinct
  finish identity and target.
- Sequential target changes require an identity-approved purpose and meaningful stage boundary.
- `long_aerobic_run`, `cutback_long_run`, and `taper_long_run` remain one-command strategies.
- `long_run_with_steady_finish` and `marathon_steady_specificity` may use one controlled change.
- Mixed pace/BPM strategy is not available to current long-run identities.
- Marathon Base never implies race-execution strategy or full marathon readiness.

## Sources

Garmin's step-target model supports pace and heart-rate target types and informs the watch-execution
anatomy only, not Hito medical or performance claims:

- [Garmin workout step targets](https://support.garmin.com/en-US/?faq=wZ52AaLbLG2GC1Lxu2l4k7)
- [Garmin Run Coach target modes](https://support.garmin.com/en-US/?faq=xmMRe8rjaZ3CNaINXf8dLA)
- [ACSM exercise and fluid replacement position stand](https://pubmed.ncbi.nlm.nih.gov/17277604/)
- [NATA fluid replacement position statement](https://pubmed.ncbi.nlm.nih.gov/28985128/)

## Current Status

Generated compilation and manual validation now enforce the long-run anatomy and sequential-target
policy through `long-run-execution-policy.ts`. The policy rejects invalid authored structures while
preserving AI ownership of stages and numeric commands. Targetless Hydration remains the canonical
`fueling` atom across compilation, persistence, export, and readback.

This implementation does not by itself claim browser, hosted-mutation, paid-provider, or broader
release acceptance. Global QA remains a separate release gate.
