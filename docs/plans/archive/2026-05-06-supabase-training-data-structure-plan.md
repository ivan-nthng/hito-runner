## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Supabase Training Data Structure Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed Supabase training-data history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived Supabase Training Data Structure Plan only as background for future persistence, import, or provenance work.

Stage:
ARCHITECT archive reference / Supabase training-data structure history.

Context:
This artifact is archived history. Do not continue it by default. Current storage truth lives in current docs and current backend source.
```

# Supabase Training Data Structure Plan

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. The implemented behavior is reflected in current docs or newer closeout plans. This artifact is historical and should not drive work by inertia.

## Final Outcome

This plan extended the early Supabase storage direction by separating raw import intent from trusted normalized training data.

Historical decisions:

- `plan_cycles` and `planned_workouts` became the trusted runtime plan/workout truth.
- Raw JSON/provenance was treated as audit/source context, not user-visible plan authority.
- Import-aware storage such as `plan_import_batches` was an architectural intent for provenance and status tracking, not a reason to couple runtime rendering to raw JSON.
- `runner_profiles`, `plan_cycles`, `planned_workouts`, and `workout_logs` remained the narrow canonical saved-mode storage foundation.
- JSONB could hold source/provenance context, but deterministic columns and normalized rows had to drive product behavior.

## Key Boundaries

- Do not couple product truth to one raw JSON shape.
- Do not create flexible schemas that hide validation problems.
- Preserve user ownership and per-user plan isolation.
- Keep raw input, normalized canonical plan data, and trusted product output as separate layers.

## Validation Evidence

The original plan was architecture/readiness guidance. Later implementation and cleanup tracks supersede its phase checklist. This compressed archive preserves the storage rationale and provenance boundary.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not infer that every historical provenance table shipped as current runtime truth. Check current migrations/source before changing storage.
