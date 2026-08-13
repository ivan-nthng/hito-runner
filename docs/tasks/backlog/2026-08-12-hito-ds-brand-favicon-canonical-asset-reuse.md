# Hito DS Brand Favicon Canonical Asset Reuse

## Work Item ID

2026-08-12-hito-ds-brand-favicon-canonical-asset-reuse

## Status

completed

## Type

ui-cleanup

## Priority

medium

## Owner

design-system

## Mode

Lite

## Scope

Remove the duplicate favicon-gradient drawing from the Hito DS Brand reference by rendering the
existing canonical application favicon asset. This is a reference-only cleanup.

## Archive Intent

retain_in_place

## Task

The independent source-of-truth audit proved that the Brand favicon specimen recreates gradient
stops already canonically owned by `public/favicon.svg`. Reuse that existing asset in the Brand
reference so the specimen shows the actual application favicon instead of a second visual truth.

Reuse the existing reference seam and the application asset. Do not copy SVG paths, add a gradient,
change the favicon itself, create a Mark, alter product icons, or modify Foundations tokens,
generated manifests, validators, Product routes, or Figma.

## Evidence

- Audit finding: [UI simplification source-of-truth audit](2026-08-12-hito-ui-simplification-source-of-truth-audit.md).
- Canonical asset: `public/favicon.svg`.
- First incorrect owner: the Brand reference specimen, which duplicates its gradient rather than
  consuming the canonical asset.

## Focused Proof

- Source proves the Brand specimen resolves the existing favicon asset and no local gradient/path
  copy remains.
- Run proportionate formatting/lint and `git diff --check`.
- Verify the Brand reference at one desktop and one 375px viewport in Light and Dark only if its
  existing page/runtime is available without interfering with another owner.

## Preserved Boundaries

No favicon visual redesign, icon-library adoption, Product-source change, token change, CSS-system
change, data mutation, hosted action, commit, push, or deployment.

## Product Dispatch — 2026-08-12

```text
ROLE: DESIGN SYSTEM

Mode: Lite
Stage: Brand favicon duplicate-authority cleanup

Execute this canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-brand-favicon-canonical-asset-reuse.md`

Read `AGENTS.md`, `agents/design-system.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write.

The audit proved one source-of-truth defect: the Brand reference specimen duplicates the favicon
gradient already canonically owned by `public/favicon.svg`. Reuse that asset through the existing
Brand-reference seam and remove the local duplicate drawing. Do not copy paths, create a gradient,
change the canonical favicon asset, add a Mark, or touch tokens, generated manifests, validators,
Product routes, Figma, data, Git lifecycle, hosted state, or deployment.

Before writing, state the exact existing seam, proposed new runtime artifacts (`none` expected), and
the removed duplicate responsibility. Preserve unrelated dirty work byte-for-byte. Run focused
source/static proof and browser proof only if an existing safe runtime is available; report any
omitted visual evidence accurately. Update this item's English Lite receipt. Do not claim Global QA
or release readiness.
```

## Next Recommended Role

PRODUCT — consume the focused Lite receipt; no further implementation owner is required.

## Blockers

None.

## Design System Lite Receipt — 2026-08-12

- **Task / mode:** Brand favicon duplicate-authority cleanup — Lite.
- **Outcome and demonstrated cause:** the Brand reference's `Favicon surface` specimen no longer
  recreates the canonical favicon gradient with a page-local arbitrary background plus a separate
  `HitoLogoMark`. It now renders the existing `/favicon.svg` application asset directly. The
  gradient stops and favicon artwork remain owned only by `public/favicon.svg`.
- **Existing seam reused:** the existing `LogoSpecimen` entry in
  `src/components/hito-ds/reference-brand-page.tsx`; no component API or shared primitive changed.
- **New runtime artifacts:** none.
- **Removed duplicate responsibility:** the Brand reference no longer owns a second copy of the
  favicon background recipe or reconstructs the favicon from a separate mark over that recipe.
- **Files changed:**
  - `src/components/hito-ds/reference-brand-page.tsx` — replaced the local gradient/mark
    composition with one decorative image reference to `/favicon.svg` using the existing size
    utility;
  - this canonical item — lifecycle and receipt only.
- **Preserved boundaries:** `public/favicon.svg`, Hito logo/Mark primitives, tokens, CSS, generated
  manifests, validators, Product routes, Figma, data, hosted state, dependencies, and unrelated
  dirty work were not changed.
- **Focused proof:** source search finds `Favicon surface` immediately followed by
  `src="/favicon.svg"`; the rejected `background-image:linear-gradient(135deg,#3a3732...)` and its
  former local mark sizing are absent from the Brand source. The canonical gradient identifier and
  three stops remain present in `public/favicon.svg`, whose Git diff is empty. Focused Prettier,
  ESLint, and `git diff --check` all passed.
- **Browser evidence omitted:** the managed loopback server was healthy but its build was marked
  stale/broken by a separately owned private Admin repository snapshot digest mismatch, and the
  running artifact predated this source change. Replaying it would not prove the new asset reuse;
  no rebuild was attempted against that active external build-contention seam. Consequence: this
  Lite receipt proves canonical source reuse and static integrity, but does not add fresh rendered
  Dark/Light desktop/mobile evidence.
- **Promotion / remaining boundary:** no promotion was required and no task-owned blocker remains.
  Any later browser regression sweep or Global QA remains a separate explicitly assigned gate;
  this result does not claim Global QA or release readiness.
