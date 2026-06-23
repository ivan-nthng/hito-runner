# Hito Running First Flow Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Advance Hito Running First Flow Spec.

## Stage

FRONTEND implementation spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Advance Hito Running First Flow Spec.

STAGE:
FRONTEND implementation spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-05-hito-running-first-flow-spec.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Compression Note

Compressed during Slice D21 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original file described the first imported-baseline runner loop in detail. Current
onboarding, preview, saved-mode, and running-plan truth now lives in current docs/source.

## Preserved Intent

The first flow was a bounded runner loop from no profile through onboarding, weekly plan, today
workout detail, completion/skip logging, logged result review, and reset-needed states.

## Key Decisions Preserved

- Imported UI was a visual baseline only; product briefs and current docs win when they conflict.
- Phase 1 excluded fake AI, device sync, analytics, social/sharing, and hidden persistence tricks.
- Preview/saved-mode boundaries had to be explicit instead of silently pretending local preview was
  durable product truth.
- The frontend could collect and render state, but backend/persistence would own canonical saved
  truth once saved mode became real.
- Reset/error states needed visible recovery rather than silent data loss.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Current state](../../current-state.md)
- [Running plan creation engine rebuild](../../plans/active/2026-06-08-running-plan-creation-engine-rebuild.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not implement from this early flow spec directly. Use current docs/source for onboarding,
selected-plan, manual-plan, saved-mode, and active-plan behavior.
