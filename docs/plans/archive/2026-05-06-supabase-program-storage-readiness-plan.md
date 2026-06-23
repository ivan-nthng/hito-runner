## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Supabase Program Storage Readiness Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed Supabase storage history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived Supabase storage readiness history only as background for future persistence or import/export architecture work.

Stage:
ARCHITECT archive reference / Supabase storage readiness evidence.

Context:
This artifact is archived history. Do not continue it by default. Current persistence truth lives in current docs and current backend source.
```

# Supabase Program Storage Readiness Plan

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. The implemented behavior is reflected in current docs or newer closeout plans. This artifact is historical and should not drive work by inertia.

## Final Outcome

This plan established the first durable saved-mode storage direction:

- authenticated users should see their own training program
- imported plans should normalize into canonical Supabase rows
- raw imported JSON should remain provenance/audit source, not runtime authority
- user-visible plan truth should come from normalized persisted entities
- future editing should be possible without redesigning storage

## Key Decisions

- `runner_profiles`, `plan_cycles`, `planned_workouts`, `workout_logs`, and import/provenance records became the intended storage model.
- One-user-one-plan ownership and per-user filtering were mandatory.
- Raw imported JSON, normalized plan data, and trusted user-visible plan output were separate truth layers.
- Service-role/admin tooling and RLS expectations had to preserve ownership and avoid cross-user corruption.
- Replacement/import semantics needed explicit lifecycle boundaries rather than destructive overwrite by default.

## Validation Evidence

The original plan was a readiness and implementation architecture artifact. Later implementation, cleanup, and current docs supersede the detailed phase checklist. This compressed archive preserves the storage rationale and current-owner boundary rather than stale migration instructions.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not reuse old schema or phase instructions without checking current migrations, current backend source, and current docs. If persistence architecture changes, create a fresh active plan.
