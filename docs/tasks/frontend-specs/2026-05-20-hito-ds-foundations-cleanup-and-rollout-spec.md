# Hito DS Foundations Cleanup And Rollout Spec

## Status

completed

## Type

frontend_spec

## Priority

low

## Next Recommended Role

frontend

## Task

Keep this completed Hito DS foundations rollout as historical context; do not resume broad rollout by inertia.

## Stage

ARCHITECT closeout / completed DS foundations history.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Use this completed DS foundations spec only as historical context when a future concrete DS drift
bug or product-surface migration explicitly references it.

Stage:
FRONTEND implementation / future bounded DS drift fix.

Context:
This spec is completed history. Current DS truth lives in src/styles.css, /hitoDS, current docs, and
the active Hito DS IA/specimen plan.

Stop if:
- the task would reopen broad foundations rollout;
- the task touches product runtime behavior;
- current /hitoDS or current docs disagree with this historical spec.
```

## Owner

Design System Agent

## Last Updated

2026-06-20

## Compression Note

This file was compressed during ARCHITECT Slice D4. It preserves the accepted outcome, source
hierarchy, DS boundaries, and validation shape while removing long implementation slice prompts,
QA matrices, stale handoff blocks, and superseded token inventories.

## Final Outcome

This rollout is complete from the visible product perspective.

Completed QA-green slices:

- foundations, raw primitives, semantic token mapping, spacing aliases, and `/hitoDS#foundations`;
- workout-detail and `CompletionPanel` DS drift cleanup;
- calendar surface DS role migration;
- shell / `AppShell` cleanup plus avatar fallback fix;
- auth/login surface cleanup;
- settings surface cleanup.

No immediate DS foundations rollout slice is recommended from this historical spec.

## Product Direction Preserved

Hito DS should remain:

- calm;
- editorial;
- athletic;
- premium;
- low-chrome;
- low-card;
- product-shaped rather than generic shadcn/default SaaS.

The rollout was never permission to redesign the product, create a second UI system, add a theme
engine, or normalize speculative components.

## Canonical Source Hierarchy

For future DS implementation questions, use this order:

1. implemented product behavior in source;
2. `src/styles.css`;
3. `/hitoDS` and current Hito DS components;
4. `docs/current-product.md`;
5. `docs/current-system.md`;
6. active DS plans/specs;
7. this compressed historical spec.

If these disagree, current source/docs win. Report the drift instead of reviving this spec as active
execution truth.

## Decisions To Preserve

- Define foundations first, but migrate product surfaces only in bounded QA-safe slices.
- Prefer semantic Hito tokens/classes over route-local visual recipes.
- Keep visualization geometry exceptions separate from ordinary UI chrome.
- Preserve product behavior and copy while cleaning DS drift.
- Prefer deletion and consolidation over adding wrappers or variant factories.
- Do not make `/hitoDS` louder than the product itself.

## Remaining Backlog-Only Notes

Remaining items are not blockers:

- onboarding/no-plan constructor may still have small local drifts and should be handled only inside
  a product-facing onboarding pass;
- import / `Open plan` residual cleanup is low value unless a concrete QA/product drift appears;
- `/changelog` and other secondary utility surfaces should only be revisited with a specific issue;
- `/hitoDS` demo exceptions should be touched only when a stale pattern is found.

## Validation Shape For Future Reuse

Any future bounded DS cleanup should validate:

- source/static checks for touched files;
- Safari/browser proof when visible UI changes;
- mobile/narrow overflow if layout changes;
- typography hierarchy, spacing rhythm, focus state, contrast, and modal/dropdown behavior;
- no product behavior or copy drift.

## Links

- Current DS/Figma owner: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Stop Conditions

Stop if a future agent tries to use this completed spec as a broad frontend rewrite, a runtime
product redesign, or a reason to touch `/hitoDS` without a concrete DS-consumer pain point.
