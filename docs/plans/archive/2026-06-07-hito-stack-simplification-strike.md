# Hito Stack Simplification Strike

## Status

archived

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Hito Stack Simplification Strike completed and archived.

## Stage

ARCHITECT archive / completed cleanup ledger.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived simplification strike only as completed cleanup evidence.

Stage:
ARCHITECT archived cleanup reference.

Context:
cleanup-burndown-v1 is complete at 40/40. Future docs compression, artifact retention, or roadmap work must use separately named tracks.
```

## Archive Note

This plan was compressed in D1 and lightly normalized in D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The repetitive G-slice execution log was summarized into this ledger, the
[product history digest](../../history/product-history-digest.md), and current docs.

## Final Strike Closeout

- G23 was accepted as behavior-preserving backend cleanup.
- `cleanup-burndown-v1` is final at `40/40` complete, `0` remaining, `100%`.
- No follow-up BACKEND implementation was needed for G23 scope.
- The strike no longer owns active execution and is archived as completed cleanup history.
- Changelog stayed unchanged because final closeout was internal source/ownership cleanup, not a
  new runner-facing shipped capability.

## Key Decisions Preserved

- Cleanup selection must be source/import proved, not line-count or momentum driven.
- Broad runtime facade cleanup stays unsafe unless a narrow no-caller compatibility seam is proven.
- Frontend/manual/admin/Hito DS cleanup remains separately owned and browser-sensitive when visible.
- Docs/source-of-truth drift and generated/local artifact hygiene are valid cleanup owners.
- `logs/`, `test-results/`, and `qa-artifacts/` are generated/proof roots and must not count as
  product-code size.
- `qa-artifacts/` remains protected evidence until a QA retention policy exists.

## G23 Boundary Preserved

G23 shortened no-active-plan onboarding ownership by moving first-plan and selected-plan runtime
actions from `training-api.ts` re-exports to canonical action imports. It explicitly preserved
manual empty-plan creation, manual authoring, Plan Presets, auth/session, selected-plan behavior,
Supabase/OpenAI behavior, package scripts, and validation coverage.

## Validation Evidence Preserved

The final cleanup ledger preserved targeted ESLint, running-plan validator, build, dashboard
refresh, scoped diff check, source-proof, and subagent-driven gate selection expectations.

## Current Owner Links

- [Current functional map](../../current-functional-map.md)
- [Current state](../../current-state.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not reopen this strike for opportunistic runtime cleanup. Use the active docs/artifact
compression track, an artifact-retention plan, or a fresh source-proved product/runtime plan.
