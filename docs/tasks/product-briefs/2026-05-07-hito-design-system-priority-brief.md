# Hito Design System Priority Brief

## Status

backlog

## Type

product_brief

## Priority

medium

## Next Recommended Role

DESIGNER

## Task

Advance Hito Design System Priority Brief.

## Stage

DESIGNER product brief

## Exact Handoff Prompt

```text
ROLE: DESIGNER

TASK:
Advance Hito Design System Priority Brief.

STAGE:
DESIGNER product brief

CONTEXT:
- Source path: docs/tasks/product-briefs/2026-05-07-hito-design-system-priority-brief.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Product Agent

## Last Updated

2026-05-07

## Problem

Hito Running already has live product flows, shared UI primitives, and an imported visual baseline, but the current interface is still partly normalized and partly route-local. If the team keeps extending login, onboarding, home, workout detail, progress, and future surfaces before establishing one canonical design system, local styling drift will compound and create avoidable legacy cleanup.

This is no longer only a design-quality issue. It is now a product-scope issue because visual inconsistency will slow future product work, make state communication less trustworthy, and raise the cost of every new surface.

## Why Now

- the product already has enough real surfaces to define the first system from actual usage rather than from abstraction
- the current shared `src/components/ui` layer exists, but it is not yet the clear canonical source for Hito-specific interaction patterns
- several current flows still style buttons, cards, inputs, tabs, and status panels locally
- waiting longer would turn temporary local decisions into de facto product contracts

## Decision

Hito Running should prioritize the first normalized internal design system before broadening feature coverage further.

This does not mean pausing all product work for a large design-system program. It means the next wave of UI work should pass through one explicit system layer so the product stops generating new legacy while the surface area is still manageable.

## Target Outcomes

- Current core surfaces use one recognizable Hito visual and interaction language.
- Repeated patterns in login, onboarding, home, workout detail, and progress stop diverging route by route.
- Honest product states such as loading, error, preview, saved, and blocked become visually consistent and reusable.
- Future UI changes become cheaper because shared components and tokens own the pattern, not individual screens.

## In Scope

- prioritize the first pass of `Hito DS` across already-live product flows
- normalize the component families that already recur in current product work
- establish canonical rules for typography, color roles, spacing, radius, borders, status treatments, and common action hierarchy
- move current product screens toward DS-backed components where repeated local styling is already visible

## Out Of Scope

- broad enterprise-style design-system expansion
- speculative components that are not part of the current product
- visual refactoring of future-facing surfaces just because they exist
- architecture or implementation decisions about how the frontend should technically organize the DS layer
- a full-brand redesign that rewrites the product’s current visual identity from scratch

## Tradeoffs

- We accept a short-term slowdown in new UI feature velocity to reduce medium-term legacy cost.
- We prioritize normalization of current product patterns over expansion into new visual experiments.
- We keep the first DS intentionally narrow so the system becomes smaller and clearer, not broader and more theoretical.

## Acceptance Criteria

1. The team treats the design-system normalization pass as a near-term product priority, not a later cleanup task.
2. The current design-system work is explicitly anchored to already-live surfaces rather than speculative future modules.
3. The first normalized DS scope clearly covers the recurring patterns in login, onboarding, home, workout detail, and progress.
4. The resulting system defines canonical treatment for at least the core state families: loading, error, preview, saved, and blocked.
5. New UI changes in active product flows are expected to reuse or extend the DS layer instead of introducing fresh one-off styling patterns.
6. The DS effort remains bounded and does not expand into a broad component catalog unrelated to the current product.

## Existing Canonical Input

The frontend-facing design artifact already exists here:

- `docs/tasks/frontend-specs/2026-05-06-hito-ds-spec.md`

This brief establishes the product priority and scope boundary around that work. The DS spec should now be treated as a near-term execution target rather than a deferred design exercise.

## Success Signals

- fewer route-local UI variants for the same interaction pattern
- faster implementation of follow-on UI changes because shared patterns already exist
- clearer and more trustworthy state presentation across saved-mode and preview-mode flows
- less cleanup pressure before future product expansion

## Next Recommended Role

DESIGNER

## Suggested Next Step

Update the existing `Hito DS` spec from broad draft to prioritized rollout order: identify the first component families to normalize, map them to the live product surfaces, and mark which patterns must be adopted before additional UI expansion.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created a product-level priority brief that says Hito Running should normalize the first internal design system now, before more UI work turns temporary local styling into legacy.

### Key Decisions

- Treat the design-system pass as a near-term product priority rather than deferred cleanup.
- Keep the first DS narrow and anchored to live surfaces instead of broadening into a speculative component program.

### Current State

- A frontend-facing `Hito DS` spec already exists in `docs/tasks/frontend-specs/`.
- A product brief now exists in `docs/tasks/product-briefs/` that makes the timing and scope decision explicit.

### Constraints

- Do not turn this into a broad enterprise design-system effort.
- Do not let future UI work keep creating new one-off patterns in active product flows when an equivalent DS pattern should exist.

### Risks / Open Questions

- The rollout sequence inside the current DS draft is not yet prioritized tightly enough for implementation.
- Without an explicit adoption order, the team could agree in principle but still keep shipping local UI drift.

### Next Recommended Role

DESIGNER

### Suggested Next Step

Refine the existing Hito DS spec into a staged adoption plan for the already-live surfaces, starting with the most repeated components and state patterns.
```
