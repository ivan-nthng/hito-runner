# Plan Authoring Engine Decomposition And Legacy Cleanup

## Status

archived

## Type

plan

## Priority

medium

## Next Recommended Role

architect

## Task

Archived: blueprint and structured authoring decomposition milestones completed.

## Stage

ARCHITECT archived plan reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived plan only as historical context for plan-authoring decomposition decisions.

Stage:
ARCHITECT archived plan reference.

Context:
Blueprint and structured authoring decomposition milestones are complete. Current plan-authoring truth comes from current docs, active plans, source, and validators.
```

## Archive Note

This plan was compressed in D2 and metadata-normalized in D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. Repeated implementation prompts and closeouts were removed from the current reading path.

## Final Outcome

The plan-authoring engine cleanup narrowed supported structured first-plan creation to accepted
`ai_first_plan_blueprint_v1`, decomposed blueprint/structured responsibilities into clearer seams,
and preserved deterministic structured authoring as compatibility/diagnostic truth rather than
release success for first-plan creation.

## Key Decisions Preserved

- Invalid, unavailable, or timed-out blueprint attempts fail non-mutatingly.
- Confirm rejects non-blueprint reviewed first-plan drafts.
- Blueprint authoring owns schema, policy, prompt, trace, validation, expansion, metrics, and
  builder seams for its path.
- Proof-infrastructure cleanup must not delete validation coverage or switch contracts by line
  count alone.

## Validation Evidence Preserved

The archive preserves doctrine validator coverage, blueprint/structured authoring boundaries,
non-mutating failure behavior, and later simplification proof-infrastructure context.

## Current Owner Links

- [Current system](../../current-system.md)
- [Current functional map](../../current-functional-map.md)
- [Changelog](../../history/changelog.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not resume this archive for broad authoring cleanup. Use current source/import proof and active
plans before selecting any new plan-authoring gate.
