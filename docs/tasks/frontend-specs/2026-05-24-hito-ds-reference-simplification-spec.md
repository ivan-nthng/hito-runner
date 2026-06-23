# Hito DS Reference Simplification Spec

## Status

completed

## Type

frontend_spec

## Priority

low

## Next Recommended Role

frontend

## Task

Keep this completed `/hitoDS` reference simplification wave as historical context; reopen only for concrete DS-consumer pain.

## Stage

ARCHITECT closeout / completed Hito DS reference history.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Use this completed `/hitoDS` reference simplification spec only when a future concrete DS-consumer
pain point, QA finding, or product drift requires a bounded reference cleanup.

Stage:
FRONTEND implementation / future bounded Hito DS reference cleanup.

Context:
This spec is completed/paused history. Current `/hitoDS` IA, specimen workbench, and Figma bridge
truth live in the active Hito DS IA plan, current docs, and current source.

Stop if:
- the task would broadly rebuild `/hitoDS`;
- the task belongs to product runtime routes;
- current source/current docs disagree with this historical spec.
```

## Owner

Design System Designer

## Last Updated

2026-06-20

## Compression Note

This file was compressed during ARCHITECT Slice D4. It preserves the accepted outcome, IA lessons,
completed scope, and future-trigger boundaries while removing repeated implementation prompts,
section-by-section proposals, and long reference inventories superseded by current `/hitoDS`.

## Final Outcome

This `/hitoDS` workbench simplification wave is paused after the Data table conversion because the
main usability goal was met.

Completed work:

- grouped IA: Overview / Foundations / Components / Patterns / Backlog;
- sidebar active state and scrollspy preserved;
- standardized specimens for Buttons, Inputs, Tabs, Status, Selection controls, Modals / Window
  anatomy, and Data table controls;
- Backlog exists and documents known gaps and exceptions.

No immediate frontend implementation slice is recommended from this historical spec. Remaining work
is backlog or polish, not a blocker.

## Problem It Solved

`/hitoDS` had useful content but behaved like a long flat internal catalog. The intended fix was not
more DS content; it was clearer hierarchy, shorter navigation, and more consistent specimen grammar.

## Decisions To Preserve

- Organize `/hitoDS` by foundations, components, patterns, and backlog rather than a flat catalog.
- Prefer preview/demo plus controls plus contract blocks over long prose.
- Keep component references tied to real product usage.
- Keep `/hitoDS` calm and usable rather than turning it into a mini-app.
- Use backlog/exception sections to prevent demo gaps from becoming silent source-of-truth drift.
- Do not move sandbox/product runtime behavior into `/hitoDS`.

## Current Boundary

Current truth has moved forward:

- `/hitoDS` IA/specimen/Figma bridge ownership is now handled by
  `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`.
- `/test-calendar` is archived static sandbox history unless a future plan reopens it.
- Product runtime routes own persisted behavior; `/hitoDS` owns DS/specimen/reference behavior.

## Future Triggers

Reopen a bounded reference cleanup only when one of these exists:

- concrete DS-consumer confusion;
- QA finding in `/hitoDS`;
- product drift from shared primitives;
- stale specimen that misleads implementation;
- Figma bridge/export contract mismatch.

Do not reopen simply because old backlog bullets remain.

## Validation Shape For Future Reuse

Future `/hitoDS` cleanup should validate:

- source/static checks for touched files;
- browser proof for `/hitoDS` anchors and affected specimen sections;
- desktop and mobile/narrow overflow;
- interactive controls still update previews;
- dialogs, dropdowns, selects, focus-visible states, and deep links remain usable.

## Links

- Current DS IA plan: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Stop Conditions

Stop if a future task tries to use this completed spec as permission for broad `/hitoDS` rebuild,
product runtime redesign, Hito DS feature expansion, or unrelated calendar/workout behavior changes.
