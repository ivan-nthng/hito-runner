# Changelog DS Extraction Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Audit the `/changelog` page, identify which parts already use Hito DS, identify custom patterns worth preserving, and extract the reusable changelog patterns into the canonical design system without changing product behavior.

## Stage

FRONTEND implementation spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Audit the `/changelog` page, identify which parts already use Hito DS, identify custom patterns worth preserving, and extract the reusable changelog patterns into the canonical design system without changing product behavior.

STAGE:
FRONTEND implementation spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-20-changelog-ds-extraction-spec.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Compression Note

Compressed during Slice D21 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original spec included element-by-element audit detail and separate frontend/QA prompts.
Current changelog behavior is covered by current docs, changelog source, and shipped-history policy.

## Preserved Intent

The changelog page had strong reusable patterns: date rails, calm timeline structure, warm highlight
tags, technical entry cards, inline code chips, and empty states. The task was to extract reusable
visual grammar without changing changelog product behavior.

## Key Decisions Preserved

- Date treatment, highlight tags, changelog entry composition, and inline code chips were valid DS
  extraction candidates.
- Changelog data/logic should stay in the changelog utility layer, not inside DS primitives.
- Extraction must not change shipped-history semantics or turn future/backlog work into changelog
  entries.
- Browser validation needed desktop/mobile no-overflow and no console errors when implementation
  happened.

## Current Owner Links

- [Current state](../../current-state.md)
- [Current product](../../current-product.md)
- [Changelog](../../history/changelog.md)
- [Hito DS IA and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not treat this old spec as current DS implementation truth. Use current `/changelog` source,
current Hito DS primitives, current docs, and the active Hito DS IA plan.
