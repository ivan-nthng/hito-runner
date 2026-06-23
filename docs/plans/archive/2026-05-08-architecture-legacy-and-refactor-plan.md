# Architecture Legacy And Refactor Plan

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Archived: early architecture legacy/refactor audit is complete and superseded by current docs and later cleanup tracks.

## Stage

Complete / archived historical reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived architecture legacy/refactor plan only as historical context.

Stage:
ARCHITECT historical reference

Context:
This plan is archived. Current implemented architecture lives in docs/current-system.md and current
cleanup/source hierarchy lives in docs/current-functional-map.md plus active plans. Do not resume
this artifact directly; create a fresh active plan if a current source-proved refactor need appears.
```

## Owner

ARCHITECT

## Last Updated

2026-06-20

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup and compressed during Slice D3 of the
docs/artifact compression track. The original file captured the first deliberate architecture
cleanup map after Hito moved beyond the imported baseline. Its detailed inventories and handoff logs
are historical; current truth belongs to current docs, active plans, and source.

See also:

- [Product history digest](../../history/product-history-digest.md)
- [Current system](../../current-system.md)
- [Current functional map](../../current-functional-map.md)
- [Current state](../../current-state.md)

## Final Outcome

This plan established the early refactor direction that later cleanup tracks executed more precisely:

- preserve one TanStack Start runtime and one canonical route tree;
- keep `src/lib/training.ts` as normalized read/view truth and `training-api.ts` as a backend-facing
  facade until later source-proved narrowing;
- move saved mode toward Supabase-backed persisted truth rather than local fallback truth;
- treat `training-plan-v2` as the durable plan artifact direction;
- keep text-first onboarding and reviewed plan creation as the primary UX direction;
- reduce temporary compatibility paths only with source/import proof and validation.

The later Hito Stack Simplification Strike and docs compression tracks replaced this plan as active
execution owners.

## Key Decisions Preserved

- The imported baseline should not be thrown away; cleanup must happen inside the single app rather
  than by creating a second runtime.
- Saved mode, auth/session, import, authoring, preview, and persistence needed one canonical owner
  each.
- Legacy compatibility paths were allowed during migration but required explicit removal decisions.
- Richer plan/workout semantics should move into canonical contracts and persisted rows rather than
  route-local inference.
- Cleanup should make the system smaller, not more configurable.

## Historical Risk Inventory

The original audit called out these categories:

- local auth/session and Supabase identity split;
- local persisted store compatibility;
- legacy JSON import contract alongside `training-plan-v2`;
- text, structured, and JSON authoring lanes;
- preview-derived saved-plan bootstrap;
- flattened persisted enums and summary fields;
- plan provenance ambiguity.

Many of these were later resolved, narrowed, or explicitly deferred by current plans. This archive
must not be used as the latest risk inventory.

## Validation / Evidence Preserved

The plan was an architecture audit, not a runtime implementation slice. Its acceptance evidence was
source inspection, active-plan demotion during the 2026-05-25 inventory cleanup, and later closure by
more specific cleanup tracks.

## Current Owner References

- Implemented architecture: `docs/current-system.md`.
- Business-flow and cleanup source hierarchy: `docs/current-functional-map.md`.
- Current project snapshot: `docs/current-state.md`.
- Historical narrative: `docs/history/product-history-digest.md`.

## Boundaries

- Do not resume this plan as a broad refactor queue.
- Do not select `training-api.ts` cleanup from this archive without fresh import proof.
- Do not change runtime behavior from this historical inventory.
- Do not treat old preview/local fallback concerns as current blockers without source verification.
