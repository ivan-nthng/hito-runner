# Typography System Audit And Canonicalization

## Status

Complete / archived after first bounded typography implementation slice

## Type

plan

## Priority

low

## Next Recommended Role

None

## Task

Archived: first bounded typography role canonicalization slice is complete.

## Stage

Complete / archived

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived typography audit only as historical Hito DS context.

Stage:
ARCHITECT historical reference

Context:
The first typography canonicalization slice is complete. Current typography truth lives in current
styles, `/hitoDS`, current docs, and the active Hito DS IA/specimen plan.
```

## Owner

FRONTEND / DESIGNER / ARCHITECT

## Last Updated

2026-06-20

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup and compressed during Slice D2 of the
docs/artifact compression track. The original audit contained long route-by-route typography
inventory and detailed implementation notes. This archive keeps the accepted role decisions,
boundaries, and validation evidence without acting as current implementation truth.

See also:

- [Product history digest](../../history/product-history-digest.md)
- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- Active Hito DS IA/specimen plan in `docs/plans/active/`

## Final Outcome

The first bounded typography implementation slice:

- added shared CSS typography roles for display, modal title, panel title, body, body small, form
  label, nav text, menu text, menu metadata, technical mono, and bounded error/success text;
- normalized existing page, section, label, button, metric, status, helper, and caption roles;
- expanded `/hitoDS#typography` into the canonical role reference with rendered specimens and
  usage notes;
- applied the roles to high-value surfaces: `PlanManagementDialog`, `UploadJsonDialog`,
  `CompletionPanel`, and settings;
- fixed shared dialog typography after Safari QA by making `DialogTitle` and `DialogDescription`
  typography-neutral;
- left broader route families such as Today hero, calendar, auth, shell microtext, charts, and
  geometry-tied annotations for later bounded slices.

## Key Decisions Preserved

- Hito typography should stay calm, editorial, athletic, premium, and low-chrome.
- `Inter` remained the operational UI font, `Fraunces` the editorial display font, and
  `JetBrains Mono` the measured/technical font.
- Shared typography roles should replace route-local ad hoc `text-*`, tracking, and line-height
  decisions when they represent reusable product semantics.
- Dialog primitives should not impose generic typography defaults that override product roles.
- Route-wide typography migration should be staged, not bundled into a redesign.

## Historical Role Summary

The original audit identified and formalized role families for:

- page and display titles;
- section headings and subtitles;
- labels, captions, support copy, helper/error/success text;
- metric values and metric labels;
- list row titles/copy;
- shell navigation and menu text;
- status pills and toast typography;
- modal/panel titles, body, body-small, form label, technical mono, and bounded state copy.

Current exact class names and rendered behavior must be verified from live source and `/hitoDS`.

## Validation Evidence Preserved

Historical validation included:

- targeted frontend checks for touched surfaces;
- Safari QA for dialog typography inheritance;
- `/hitoDS#typography` reference proof;
- bounded implementation proof that product behavior did not change.

## Current Owner References

- Live typography/source truth: current `src/styles.css`, shared UI components, and `/hitoDS`.
- Current DS rollout truth: active Hito DS IA/specimen plan.
- Current product/system docs: `docs/current-product.md` and `docs/current-system.md`.
- Historical narrative: `docs/history/product-history-digest.md`.

## Boundaries

- Do not reopen this audit as a broad typography migration.
- Do not infer current class names from this archive without checking live source.
- Do not turn later typography cleanup into a product redesign unless a fresh plan explicitly scopes
  that work.
- Do not override current Hito DS IA/specimen decisions with older audit details.
