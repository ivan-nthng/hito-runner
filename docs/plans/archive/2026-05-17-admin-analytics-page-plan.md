# Admin Analytics And Ops Surface Plan

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Archived: admin analytics Phase 1 and local Test Accounts Phase 1A completed.

## Stage

ARCHITECT archived plan reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived admin analytics plan only as historical context.

Stage:
ARCHITECT archived plan reference.

Context:
Phase 1 existing-truth admin analytics, local Test Accounts, and dedicated admin login are complete and QA-green. Future admin work needs a new active plan based on current ops needs.
```

## Archive Note

This plan was compressed in D2 and metadata-normalized in D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. Historical visualization ideas and future event-table concepts were kept out of active
execution.

## Final Outcome

The accepted admin surface delivered `/admin/analytics`, product-health and plan/activity
visibility, local-only Test Accounts management, dedicated owner admin login at `/admin/login`,
admin gating, non-admin blocking, Safari/browser proof, and clear test/admin account exclusion from
real-user counts.

## Key Decisions Preserved

- Admin analytics uses existing Supabase/product truth first.
- Local Test Accounts are development/QA hygiene, not product user truth.
- Future event, failure, issue, and instrumentation tables require recurring ops needs before
  implementation.
- Admin placeholders and future-only UI must not be treated as shipped capability.

## Validation Evidence Preserved

The archive preserves Phase 1/1A QA-green browser coverage, client/server boundary proof,
non-admin rejection, admin login ownership, and test-account exclusion behavior.

## Current Owner Links

- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not revive speculative analytics dashboards, event tables, admin expansion, or placeholder UI
from this archive. Use a fresh active plan if current ops needs justify new admin work.
