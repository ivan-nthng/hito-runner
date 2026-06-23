## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Phase 5 Final Legacy Removal Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed legacy-removal history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Phase 5 Final Legacy Removal Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed legacy-removal history.

Context:
This artifact is archived history. Do not continue it by default. If the need returns, create a fresh active plan from current docs/current-* truth.
```

# Phase 5 Final Legacy Removal Plan

## Archive Note

This archived plan captured the final early-compatibility removal window after `training-plan-v2`,
Supabase-backed saved truth, and text/JSON plan authoring had become stable enough to stop carrying
several bootstrap-era compatibility paths. It is preserved as historical cleanup evidence, not as
current execution guidance.

## Final Outcome

Phase 5 defined and closed the removal discipline for early legacy surfaces:

- `training-plan-v2` remained the canonical import/file contract.
- Deprecated `week_1_preview[]` compatibility was isolated before removal.
- Vite-era environment aliases and old server-key aliases were treated as transitional, not
  permanent product API.
- Local single-account auth compatibility was kept only where current local/test tooling still
  required it.

## Key Decisions

- Compatibility should expire once source proof, validation, and migration safety show no current
  caller.
- Delete legacy seams rather than quarantining them indefinitely.
- Keep canonical contracts stable while removing old aliases around them.
- Preserve local/dev/test support only when current source proves it is live.

## Validation Evidence

Historical validation centered on source/reference proof, targeted lint/build checks, and importer
or runtime checks for the specific compatibility seam being removed. Later cleanup tracks reused the
same discipline for `training-api.ts`, local ops scripts, and duplicate residue cleanup.

## Current Owner Links

- Current implemented truth: `docs/current-system.md`
- Current product truth: `docs/current-product.md`
- Product evolution summary: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not use this archived Phase 5 plan to reopen broad compatibility removal. Any future removal must
start from fresh source/import proof, one canonical owner, and a bounded validation story.
