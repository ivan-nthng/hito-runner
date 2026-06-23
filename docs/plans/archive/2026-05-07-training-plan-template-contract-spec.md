# Training Plan Template Contract Spec

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Archived: early training-plan template contract is superseded by current `training-plan-v2` and current docs.

## Stage

Complete / archived historical reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived training-plan template contract only as historical context.

Stage:
ARCHITECT historical reference

Context:
Current import/export, selected-plan, generated-plan, and manual-plan truth lives in current source
and docs/current-*. This archive should not drive new schema work without fresh source proof.
```

## Owner

ARCHITECT / BACKEND

## Last Updated

2026-06-20

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup and compressed during Slice D3 of the
docs/artifact compression track. This was an early `training-plan-v2` authoring/import contract
artifact. Its detailed JSON skeleton and long field inventory are historical; exact current schema
truth lives in current source and docs.

See also:

- [Product history digest](../../history/product-history-digest.md)
- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current functional map](../../current-functional-map.md)

## Final Outcome

This spec established the durable direction for plan files:

- plan files describe intended planned training structure;
- app/database truth owns runtime state such as completion, logs, sync, OCR, and AI verdicts;
- JSON import normalizes into canonical `plan_cycles` and `planned_workouts`;
- workout detail, calendar, and comparison surfaces read normalized plan truth rather than raw file
  noise;
- segment metadata, bounded target keys, and repeat-based prescription structure became part of the
  richer plan contract;
- unknown benchmark or HR truth should not create fake pace or fake personal HR targets.

## Key Decisions Preserved

- `training-plan-v2` is authoring/import truth, not live runtime state.
- Plans should include stable metadata, goal/event context, runner profile context, preferences,
  phases/weeks/days, workouts, segments, segment targets, and optional guidance.
- Runtime-only fields do not belong in the template: auth/session state, completion state,
  week-status state, sync state, OCR state, AI verdict state, and UI placeholders.
- Segment targets must stay honest: pace requires pace truth; HR requires HR truth; fallback guidance
  must not masquerade as precise metrics.
- Future editability and planned-vs-actual comparison need stable planned structure, not UI-only
  prose.

## Historical Contract Summary

The original document specified:

- canonical plan metadata;
- goal/event and runner profile context;
- plan preferences and constraints;
- preparation horizon and timeline;
- phases, weeks, days, workouts, segments, and targets;
- duration, distance, repeat, recovery, rest, mobility, and strength shapes;
- rendering requirements for calendar, today, workout detail, and week status;
- separation of plan truth from runtime state.

Those details are compressed here because current implementation and validators are now the source of
truth.

## Validation Evidence Preserved

Historical acceptance was architectural/source-driven. Later implementation tracks validated import,
persistence/readback, export, selected-plan, manual-plan, and generated-plan behavior separately.

## Current Owner References

- Import contract and normalization owners: current source under `src/lib/imported-plan*`.
- Implemented architecture: `docs/current-system.md`.
- Runner-facing behavior: `docs/current-product.md`.
- Business-flow map: `docs/current-functional-map.md`.
- Historical narrative: `docs/history/product-history-digest.md`.

## Boundaries

- Do not copy the old JSON skeleton as current schema truth.
- Do not add runtime state to plan-file contracts.
- Do not infer current editability or metric rules from this archive without checking current docs.
- Do not weaken no-fake-pace or no-fake-personal-HR rules.
