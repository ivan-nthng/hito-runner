## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Hito Design System Spec And Rollout Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed historical summary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Hito Design System Spec And Rollout Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed historical summary.

Context:
This artifact is archived history. Do not continue it by default. If the design-system need returns, start from current docs, /hitoDS, src/styles.css, and the active Hito DS IA plan.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. Compressed during D12 of the docs/artifact compression track.

Current truth now lives in:

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Hito DS IA plan](../active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Product history digest](../../history/product-history-digest.md)

## Final Outcome

This plan established the early Hito design-system direction: calm, editorial, athletic, premium, low-chrome, and low-card. It translated the imported product baseline into practical UI rules for typography, spacing, surfaces, status, CTAs, empty states, dialogs, forms, tabs, rows, metrics, and workout-state color.

The plan is complete as history. It should not drive new implementation directly because the current canonical DS owner is `/hitoDS` plus the active Hito DS IA/specimen contract.

## Key Decisions Preserved

- Hito should avoid generic SaaS dashboard density, fake AI-coach language, neon sports decoration, and migration-era explanation clutter.
- Display typography should be sparse; UI text and numeric/technical values should use separate roles.
- Semantic color should remain restrained and tied to real status, workout type, or risk.
- Sparse rest days and empty states are intentional states, not missing UI.
- Cards should be used only when a bounded container improves scanability; grouped rows and dividers are preferred for related support content.
- Dialogs should be focused utility surfaces with one title, short description, clear primary action, and safe exit.
- The first rollout path targeted primary runner flow surfaces before secondary preserved routes.

## Implementation And Validation History

The plan later accumulated completed rollout evidence:

- shared low-card primitives, fields, buttons, tabs, labels, and dividers
- `/hitoDS` as an internal reference surface
- home/calendar and workout-detail primitive alignment
- Safari-visible home/calendar corrections
- secondary preserved route normalization
- workout navigation cards
- typography hierarchy and spacing rhythm
- `/hitoDS` split from runner shell chrome
- deeper support primitives for interval and completion surfaces
- status/state, analytics, and severity micro-primitives

The original handoff and phase logs were removed during compression because they are superseded by current docs and the active Hito DS IA plan.

## Current Boundary

- Do not continue this archived plan.
- New DS work should start from `/hitoDS`, [current product](../../current-product.md), [current system](../../current-system.md), and the active Hito DS IA plan.
- Product runtime behavior was not changed by this archive compression.
