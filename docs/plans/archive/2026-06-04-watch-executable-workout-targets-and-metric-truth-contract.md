# Watch-Executable Workout Targets And Metric Truth Contract

## Status

archived

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Preserve archived watch-executable workout targets and metric truth contract as historical context.

## Stage

ARCHITECT archived-plan reference / compressed metric-truth history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived watch-executable workout targets and metric truth contract as historical context.

Stage:
ARCHITECT archived-plan reference / compressed metric-truth history.

Context:
This artifact is archived history. Do not reopen it by default. If metric-truth behavior regresses, start from current running-plan engine docs, current system docs, and backend validators.
```

## Archive Note

Archived on 2026-06-06 after backend, frontend, and QA/source validation passed. Compressed during D12 of the docs/artifact compression track.

Current truth now lives in:

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Running plan creation engine rebuild](../active/2026-06-08-running-plan-creation-engine-rebuild.md)
- [Product history digest](../../history/product-history-digest.md)
- [Changelog](../../history/changelog.md)

## Final Outcome

This plan closed the contradiction where generated structured workouts could fall back to vague effort-only guidance. The accepted contract is that primary generated non-rest workouts must resolve to executable segment anatomy:

- validated pace targets when backend pace truth exists
- personal HR targets only when personal HR-zone truth exists
- `structure_only_executable` when numeric duration, distance, repeat, work, recovery, run/walk, or hike/run structure is sufficient
- bounded correction/blocking when no executable mode can be produced

Target time alone is not pace truth. Age-estimated HR is not personal HR-zone truth. AI may draft within backend constraints, but backend validation owns target truth.

## Key Decisions Preserved

- Backend owns execution-surface validation, pace/HR truth validation, family eligibility, segment normalization, generated target keys, persistence, and export-ready canonical shape.
- Frontend renders backend-shaped targets and must not invent local metric truth.
- Cues, focus, RPE, purpose, and source copy are secondary support, not executable target truth.
- Legacy `effort_only`, `none`, and `unknown` rows remain readable but are not the normal generated happy path.
- Rest days have no execution metric targets.
- Tempo, threshold, race-pace, road interval, and unsupported target-time specificity must not pass as structure-only when their coaching meaning depends on pace or personal HR truth.

## Accepted Implementation Evidence

Backend Slice 1 was implemented and QA-passed on 2026-06-05:

- explicit executable modes were added
- missing execution support returns bounded correction
- target time without benchmark emits no pace targets
- age-estimated HR emits no personal HR targets
- structure-only rows require numeric executable segment anatomy
- blueprint default remained production direction and envelope remained internal/non-default

Frontend readback cleanup was implemented and QA-passed on 2026-06-06:

- workout detail, Today/calendar, interval timeline, export copy, and first-plan review copy separate executable targets from cue/source/support copy
- `structure_only_executable` reads as numeric executable anatomy
- HR targets render only when backend `hrTargetsAllowed` truth permits them
- legacy modes remain readable but visibly distinct

## Residual Follow-Ups Split Out

The archive closeout split future work into separate backlog items:

- authenticated saved-mode readback browser smoke fixture
- active-plan refresh executable-target regeneration policy
- HR-zone profile/AeT estimation
- provider-derived pace truth
- watch/export integration polish

Those follow-ups remain separate and are not completed by this archive.

## Current Boundary

- Do not treat this archive as the live implementation owner.
- Do not weaken no-fake-pace or no-fake-personal-HR rules.
- Do not claim watch/provider export is complete from this plan alone.
- Future metric-truth expansion must start from current backend validators, current docs, and active running-plan plans.
