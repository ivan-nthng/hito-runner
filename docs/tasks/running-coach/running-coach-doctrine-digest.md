# Running Coach Doctrine Digest

Status: current orientation digest
Owner: Running Coach
Last updated: 2026-07-25

## Source Hierarchy

This digest reconciles coaching doctrine with current implemented product truth. The hierarchy is:

1. current provider, compiler, review, persistence, and readback source
2. `docs/current-product.md`, `docs/current-system.md`, and `docs/current-state.md`
3. accepted focused current coaching doctrine
4. this orientation digest
5. dated historical decision records

Dated Running Coach files are either focused current doctrine or historical decision records. A
historical file cannot override the hierarchy above.

## Current Plan-First Contract

The canonical generated-plan path is:

`runner facts -> AI-authored full plan -> backend validation and compilation -> non-mutating review -> exact confirm and persistence -> readback/export`

- AI owns horizon, phases, workout selection, density, progression, long runs, repeats, numeric pace
  or BPM target selection, effort context, Hydration placement, and cues.
- Backend owns input validation, calendar/rest integrity, contract validation, canonical compilation,
  target provenance, signed review, exact confirmation, persistence, and readback.
- Backend must reject invalid output rather than silently authoring, repairing, or substituting a
  deterministic coaching plan.
- Confirm must preserve the reviewed plan exactly and must not call AI again.

## Durable Coaching Guardrails

- Plans must have plausible adaptation, progression, recovery spacing, long-run development,
  cutbacks, taper or endpoint preparation where relevant, and goal-specific training identity.
- Beginner and conservative plans may be simpler, but not unsafe, compressed, or long stretches of
  generic filler.
- Fixed rest days and explicitly supplied availability remain hard constraints.
- A runner without meaningful running history starts with a 14-day Run/Walk, Easy, or Recovery
  bridge: at least four adaptation contacts, recovery/rest between contacts, and no true Long Run
  before calendar day 15. The focused first-session doctrine remains the coaching reference.
- Ambition, runner level, body size, or the need for a long horizon are not by themselves reasons
  to shame or medically classify a runner.
- Coaching copy must avoid medical claims, unsupported physiological certainty, and personal-BPM
  claims that the accepted profile does not support.

## Execution-Target Truth

- Every generated runnable leaf or ordered Repeat child has exactly one numeric primary command:
  `pace` or `heart_rate`.
- Pace may be benchmark-informed or AI-estimated. A benchmark improves precision but is not required;
  provenance must remain honest and estimated pace must not be presented as measured truth.
- Heart-rate commands must exactly match an explicitly accepted profile snapshot. That snapshot may
  be `estimated` or `personal`; its source must remain visible and immutable for the confirmed plan.
- Never invent unsupported personal BPM, alter an accepted range, or put competing pace and BPM
  commands on one runnable leaf.
- Effort, RPE, Run/Walk text, and cues are supplemental coaching context, not a replacement generated
  command mode.
- Repeat parents and Hydration are targetless. Hydration is a separate non-runnable event.
- Accepted command mode, numeric value, and provenance must survive review, confirm, persistence,
  export/import, and readback.

Canonical detail:

- [First-session adaptation doctrine](2026-07-19-first-session-adaptation-doctrine.md)
- [Watch-execution primary-target doctrine](2026-07-20-watch-execution-primary-target-doctrine.md)
- [Manual workout constructor taxonomy](2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md)

## Goal And Workout Quality

- Current Quick setup uses selected goal distance and runner facts, not deterministic Plan Preset,
  Marathon Base, or Marathon Completion programs.
- Exact selected-distance endpoint truth is required when the reviewed goal promises a race
  distance.
- Workout variety must be purposeful: support, quality, long-run, recovery, cutback, and endpoint
  roles should express the goal without random novelty or unsafe hard-day density.
- Long-run richness cannot carry the entire plan; midweek identity and phase meaning must remain
  visible.
- Ordinary long aerobic work must not be mislabeled as progression, race execution, or target-time
  preparation. Meaningful target changes require a matching workout purpose.

## Historical Records

The following stable paths preserve superseded deterministic decisions and durable lessons. They are
not current implementation instructions:

- [Foundational deterministic engine doctrine](2026-06-08-running-plan-engine-coach-doctrine.md)
- [Half Marathon and Marathon Base R6 doctrine](2026-06-09-running-plan-engine-r6-half-marathon-marathon-base-doctrine.md)
- [Selected-plan stimulus contract](2026-06-09-running-plan-engine-selected-plan-stimulus-contract.md)
- [Universal no-dead-end doctrine](2026-06-10-running-plan-universal-no-dead-end-doctrine.md)
- [Marathon Completion deterministic family contract](2026-06-11-marathon-completion-selected-plan-family-contract.md)

Use Git history when the full dated matrix or scenario detail is needed. Do not revive a historical
backend-authoring rule, deterministic family matrix, benchmark-only pace rule, or
age-estimated-HR-readback-only rule without a new explicit Product and Running Coach decision.
