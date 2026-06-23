# Plan Preset Library And Custom Authoring Escape Hatch

## Status

archived

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Archived: Plan Preset discovery and custom authoring escape hatch completed for the accepted slice.

## Stage

ARCHITECT archived plan reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived Plan Preset plan only as historical context.

Stage:
ARCHITECT archived plan reference.

Context:
The accepted vertical slice is complete. Future Plan Preset families, replacement/refresh, or manual-authoring expansion must use current docs and separate backlog items.
```

## Archive Note

This archive was compressed in D1 and lightly normalized in D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. Old prompts and repeated QA routing were removed from the active reading path.

## Final Outcome

The accepted slice shipped no-active-plan Plan Preset discovery and creation support for:

- `10K Foundation`
- `Half Marathon Balanced`
- `Marathon Base`

The slice also preserved a custom authoring escape hatch for runners who need manual control.

## Key Decisions Preserved

- Plan Presets now own card discovery and eligibility, not active-plan creation truth.
- Selected running-plan preview/create owns plan creation.
- Old Plan Preset review/confirm actions were later removed from runtime.
- Backend owned duration, start date, estimated end date, workout mix, metric honesty, and active-plan-exists blocking.
- Frontend rendered backend-shaped cards and review states instead of inventing eligibility or schedule truth.
- Manual/custom authoring stayed separate from Plan Preset card discovery.

## Validation Evidence Preserved

Final browser acceptance proved card discovery, selected-plan create flow, persistence/readback,
active-plan blocking, and no revival of the old Plan Preset review/confirm seam.

## Current Owner Links

- [Plan Preset active-plan replacement/refresh backlog](../../tasks/backlog/2026-06-07-plan-preset-active-plan-replacement-refresh.md)
- [Additional Plan Preset families backlog](../../tasks/backlog/2026-06-07-additional-plan-preset-families.md)
- [Current product](../../current-product.md)
- [Current functional map](../../current-functional-map.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not treat this archived plan as the owner for new preset creation, replacement/refresh, or new
preset families. Those require current-source architecture and explicit review/confirm semantics.
