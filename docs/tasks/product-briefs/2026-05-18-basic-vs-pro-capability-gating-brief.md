# Basic Vs Pro Capability Gating Brief

## Status

backlog

## Type

product_brief

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Advance Basic Vs Pro Capability Gating Brief.

## Stage

ARCHITECT product brief

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Advance Basic Vs Pro Capability Gating Brief.

STAGE:
ARCHITECT product brief

CONTEXT:
- Source path: docs/tasks/product-briefs/2026-05-18-basic-vs-pro-capability-gating-brief.md
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

2026-06-22

## Compression Note

D24 compressed this future monetization/capability brief. Hito has a backend-owned entitlement
foundation, but no live billing rollout. Users without explicit entitlement rows still resolve as
effective `Pro`; explicit `Basic` rows can enforce bounded AI limits later.

## Durable Product Decision

Capability gating must be backend-owned and must not live only in the UI. The intended future split
is:

- `Basic`: core saved-mode running-plan, deterministic feedback, and safe non-AI flows.
- `Pro`: AI-assisted or higher-cost capabilities such as plan refresh proposals, AI feedback
  interpretation, richer text/voice authoring, and future premium plan intelligence.

The current pre-subscription phase keeps real users effectively `Pro` while preserving a future-safe
capability model.

## Product Rules To Preserve

- no surprise lockouts for current users
- deterministic Garmin upload/parse/comparison remains core saved-mode truth
- AI interpretation can be gated without blocking deterministic feedback
- downgrade behavior must be graceful and explicit
- usage counters must be backend-owned and auditable
- future billing must not silently change existing active-plan truth

## Future Decisions

Product still needs explicit subscription copy, pricing, downgrade UX, included usage counts, and
which future AI/coach features are Pro-only.

## Links

- Current entitlement/product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
