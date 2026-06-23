# Hito Component System Spec

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Archived: early Hito component-system baseline is superseded by current Hito DS and current docs.

## Stage

Complete / archived

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived component-system spec only as historical design-system context.

Stage:
ARCHITECT historical reference

Context:
The current design-system execution owner is the active Hito DS information architecture/specimen
contract and live `/hitoDS` implementation. Do not resume this old component spec directly.
```

## Owner

DESIGNER / FRONTEND / ARCHITECT

## Last Updated

2026-06-20

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup and compressed during Slice D2 of the
docs/artifact compression track. The original file contained a long primitive inventory and detailed
token/component notes. Those notes were useful to establish direction, but current design-system
truth now lives in the live Hito DS route, shared primitives, current docs, and the active Hito DS
IA/specimen plan.

See also:

- [Product history digest](../../history/product-history-digest.md)
- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- Active Hito DS IA/specimen plan in `docs/plans/active/`

## Final Outcome

This early spec defined the first shared Hito component vocabulary around a calm, editorial,
athletic, premium, low-chrome, low-card direction. It helped align early frontend work around:

- consistent control sizing across buttons and inputs;
- label, body, support, metric, and status text roles;
- grouped support panels instead of stacked mini-cards;
- semantic color for meaning rather than decoration;
- restrained surfaces and clear row density;
- rest-day sparsity as a valid design state;
- primitive mapping for dialogs, forms, tabs, cards, rows, empty states, and status UI.

Later Hito DS work made this direction concrete through `/hitoDS`, shared primitives, typography
roles, specimen pages, Figma bridge/export surfaces, and current product implementation.

## Key Decisions Preserved

- Hito should borrow interaction discipline from Radix-style primitives and practical composition
  from shadcn-style layering without copying generic enterprise UI.
- The product visual language should stay quiet and scanable, closer to health/coaching editorial
  surfaces than bright SaaS dashboards.
- A small number of consistent primitives beats many ornamental variants.
- Component primitives must serve product surfaces, not become an abstract design-system exercise.
- Semantic color, typography, spacing, and grouping should remain recognizable across dialogs,
  forms, rows, tabs, cards, metrics, and status surfaces.

## Historical Primitive Summary

The original spec covered:

- spacing, size, radius, border, shadow, color, and typography foundations;
- button tones and sizes;
- input, textarea, select, search, helper/error/success, and label treatment;
- checkbox, radio, toggle/switch;
- list, menu, settings, selectable, metric, and grouped support rows;
- badges, status labels, and semantic color use;
- page, section, card/support, body, secondary, label/caption, metric, button, and tab typography;
- composition rules for dialogs, forms, hero/header sections, metric groups, tabs, cards,
  support blocks, and empty states.

Those details are no longer repeated here because the live source and `/hitoDS` are the current
reference.

## Current Owner References

- Live DS/reference route: `/hitoDS`.
- Shared style/token truth: current `src/styles.css` and current UI/DS primitives.
- Current product/system docs: `docs/current-product.md` and `docs/current-system.md`.
- Current Hito DS IA/specimen track: active Hito DS information architecture plan.
- Historical narrative: `docs/history/product-history-digest.md`.

## Boundaries

- Do not resume this old spec as an implementation plan.
- Do not override the active Hito DS IA/specimen contract with this archive.
- Do not use the old detailed token list as current truth without checking live source.
- Do not broaden DS work into product runtime redesign without a fresh active plan.
