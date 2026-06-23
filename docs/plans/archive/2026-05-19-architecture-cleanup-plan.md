# Architecture Cleanup Plan

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Archived: May architecture cleanup track completed and superseded by later simplification work.

## Stage

ARCHITECT archived plan reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived architecture cleanup plan only as historical context.

Stage:
ARCHITECT archived plan reference.

Context:
The May cleanup track is complete. Current cleanup truth lives in current docs, active plans, and later simplification closeouts.
```

## Archive Note

This plan was compressed in D3 and lightly preserved in D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original file identified early mixed-responsibility hotspots that later tracks executed
or superseded with stronger source/import proof.

## Final Outcome

The May cleanup track reduced architecture pressure without changing live product behavior:
`training-api.ts` narrowed toward wrapper/facade shape, plan-management and completion surfaces
were decomposed, changelog helper logic moved to a utility module, and remaining candidates were
demoted instead of treated as blockers.

## Key Decisions Preserved

- Cleanup must preserve product behavior unless a slice explicitly scopes behavior change.
- Canonical write paths for plan creation, plan apply, refresh apply, and workout-log persistence
  must remain protected.
- Frontend cleanup that changes visible behavior requires browser QA.
- Current docs/source win over archived plans for any future cleanup selection.
- Later Hito Stack Simplification and docs/artifact compression tracks supersede this archive.

## Current Owner Links

- [Current functional map](../../current-functional-map.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)
- [Hito Stack Simplification Strike](./2026-06-07-hito-stack-simplification-strike.md)

## Do Not Continue By Default

Do not use this archive to reopen broad runtime cleanup, browser-sensitive UI cleanup, or
line-count-driven decomposition. Start with current source/import proof and current docs.
