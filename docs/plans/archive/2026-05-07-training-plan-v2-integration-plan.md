## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Training Plan V2 Integration Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed historical summary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Training Plan V2 Integration Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed historical summary.

Context:
This artifact is archived history. Do not continue it by default. If training-plan import or schema work returns, start from current docs/current-* truth and current canonical storage/import owners.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. Compressed during D12 of the docs/artifact compression track.

Current truth now lives in:

- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current functional map](../../current-functional-map.md)
- [Product history digest](../../history/product-history-digest.md)

## Final Outcome

This plan defined the migration from legacy `week_1_preview[]` imports toward `training-plan-v2` without splitting runtime truth. The accepted direction was:

`raw training-plan-v2 import -> validation -> normalization -> Supabase entities -> TrainingSnapshot -> routes`

The first viable backend slice landed later: `training-plan-v2` validation shipped alongside legacy validation, both shapes normalized into canonical rows, and saved-mode home/workout detail rendered through the unchanged `TrainingSnapshot` seam.

## Key Decisions Preserved

- Routes must not read raw JSON directly.
- Legacy and v2 imports normalize into the same canonical Supabase entities.
- Runtime-only source fields such as completion state, status, and placeholder capability booleans are not canonical template truth.
- `planned_workouts.steps jsonb` is the main structured workout payload target.
- Editing preparation should use provenance and edit-state semantics rather than a separate editor-specific shadow system.
- Runner-profile hints in imported files must not silently overwrite authenticated profile truth.

## Storage And Rendering Boundary

The plan mapped v2 plan/workout/segment truth into plan cycles and planned workouts, with structured segments preserved in `steps`. It also identified optional later provenance fields such as import batch ids, source schema version, source snapshots, revision numbers, and edit state.

Rendering was intentionally kept stable:

- calendar and Today hero read the normalized snapshot
- workout detail reads normalized workout steps
- completion state and week status remain derived from persisted logs
- rest days stay sparse and separate

## Validation And Evidence

The archived plan recorded the migration phases and risks, including parser support, additive schema expansion, import normalization, rendering integration, backward compatibility, and editability preparation. The detailed old phase handoffs were removed because the current implementation/source hierarchy now owns those paths.

## Current Boundary

- Do not revive a raw-JSON route path.
- Do not create parallel legacy/v2 rendering branches.
- Do not treat archived importer details as current schema instructions without checking current code.
- Any future import/provenance work needs a fresh active plan from current docs and source.
