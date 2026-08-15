# Hito DS Foundations Validator Structure Reconciliation

## Work Item ID

2026-08-13-hito-ds-foundations-validator-structure-reconciliation

## Status

completed

## Type

design-system-validation

## Priority

high

## Owner

design-system

## Mode

Lite

## Stage

DESIGN SYSTEM validator-contract repair complete.

## Lite Execution Preflight

- **Outcome and evidence:** reconcile the validator with the accepted two-playground and `12 / 5`
  Foundations structure. Current source proves two distinct `HitoDsPlayground` starts, one `marks`
  identity in the first, one `typography-inspector-picker` identity in the second, three Typography
  picker cases, no retired Mark matrix, 12 aggregate token-specimen references, and five aggregate
  flat-surface references.
- **Owner and existing seam:** DESIGN SYSTEM owns the existing
  `scripts/validate-hito-ds-component-contracts.ts` assertions. Rendered Foundations and playground
  source are read-only and already correct.
- **Smallest change and artifacts:** replace only the stale single-playground and `11 / 6`
  assumptions with separate Marks/Typography structural evidence and accepted `2 / 12 / 5`
  counts. New runtime artifacts: none.
- **Focused proof:** full DS validator, manifest check, focused Prettier/ESLint, and
  `git diff --check`. Browser/build remain excluded because runtime source must not change.
- **Promotion condition:** stop and return to PRODUCT if the identities/counts cannot be proven from
  current source or a rendered-source change becomes necessary.

## Scope

Reconcile only `scripts/validate-hito-ds-component-contracts.ts` with the accepted Foundations
structure. This is a validator source-of-truth repair, not a reopening of the visual cleanup and
not permission to change rendered Foundations source.

## Archive Intent

retain_in_place

## Task

Make the existing Design System validator prove the accepted two-playground Foundations structure:
the independent Marks playground and the Typography Inspector playground, 12 accepted
token-specimen references, and five preserved flat-surface references. Keep assertions strong and
structural; do not pass by restoring retired UI, hiding current source from a count, or weakening
unrelated coverage.

## Demonstrated Root Cause

`validate-hito-ds-component-contracts.ts` currently treats every Foundations `<HitoDsPlayground>`
as the Mark playground and hard-codes `foundationReferenceSurfaceCount === 11` and
`foundationFlatSurfaceCount === 6`. These describe the prior Foundations structure. The accepted
Typography Inspector playground introduces the second playground and changes the accepted counts to
`2 / 12 / 5`.

The first incorrect owner is the Design System validator. The live playgrounds and shared surface
contracts are not incorrect.

## Existing Seams And Change Budget

- Reuse: `scripts/validate-hito-ds-component-contracts.ts` and current accepted source it reads.
- Smallest behavior change: revise only stale Foundation structural assertions and diagnostic text.
- New runtime artifacts: none.
- Simplification: delete the obsolete single-playground and `11 / 6` assumptions. Retain strong,
  separate structural evidence for Marks and Typography Inspector.

## Required Change

- Reproduce the validator failure and record the current counts plus both playground identities
  before editing.
- Make the Mark assertion specific to the canonical Marks structure: `#marks`, metadata, shapes,
  five sizes, `HitoMark`, its playground, gallery, provenance, and absence of the retired matrix.
- Add or retain a narrow assertion that the Typography Inspector playground exists with its accepted
  identity and interactive composition.
- Reconcile aggregate counts to `12` token specimens and `5` flat surfaces only after source proof.
- Preserve existing assertions for semantic-surface CSS, Foundation context, workout renderer, and
  all unrelated contracts.

## What Not To Touch

- `src/components/hito-ds/reference-foundations-page.tsx`, `src/components/hito-ds/playground.tsx`,
  CSS, tokens, manifests, generated files, primitives, Product, DevTools, Figma, fixtures, Git,
  hosted state, or deployment.
- Any assertion not demonstrated stale by this accepted Foundations change. Do not add a marker,
  registry, compatibility path, another validator, or rendered UI.
- The earlier validator-reconciliation receipt, the active Components batch, or unrelated dirty work.

## Focused Proof

- Reproduce the old failure and record current source discriminator.
- `npm run validate-hito-ds-components` passes with the strengthened current contract.
- `node scripts/generate-hito-ds-manifest.mjs --check`, focused Prettier/ESLint, and
  `git diff --check` pass.
- Browser/build are excluded because runtime source and assets must not change. Stop and return to
  PRODUCT if a rendered-source change appears necessary.

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task:
Execute the Lite validator repair in:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-ds-foundations-validator-structure-reconciliation.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- this entire item
- the latest blocked receipt in
  `docs/tasks/backlog/2026-08-13-hito-ds-foundations-compact-specimens-and-demo-signal-cleanup.md`
- `scripts/validate-hito-ds-component-contracts.ts`
- current `reference-foundations-page.tsx` and `playground.tsx`, read-only.

Outcome:
Repair only the stale Foundation validator contract after the accepted compact-specimen slice. The
validator must distinguish the Marks playground from the Typography Inspector playground and describe
the accepted `2 / 12 / 5` structure. Do not modify rendered source to satisfy validation.

Method and boundaries:
- Reproduce the existing failure, source counts, and identities before editing.
- Reuse the existing validator and revise only stale assertions/diagnostics.
- Preserve independent structural coverage for Marks metadata/shapes/sizes/gallery/provenance and
  retired matrix absence, plus the Typography Inspector identity/composition and all other checks.
- Do not weaken a broad count or use exemptions that could hide either current playground.
- No changes to runtime TSX, CSS, tokens, manifests, generated files, Product, DevTools, Figma,
  fixtures, Git, hosted state, or deployment. New runtime artifacts: none.
- Preserve unrelated dirty work byte-for-byte. Do not delegate DESIGN SYSTEM implementation. Use a
  named read-only reviewer only if a genuine contract ambiguity remains after preflight.
- Stop and return to PRODUCT if the source discriminator fails or any rendered-source edit appears
  necessary.

Focused proof:
- Full DS validator, manifest check, focused Prettier/ESLint, and `git diff --check`.
- Browser/build are omitted because runtime source remains unchanged; record this in the English Lite
  receipt.

Return only after updating this item truthfully with the discriminator, exact assertions changed,
checks, files changed, and boundary. Do not claim Global QA, release readiness, or deployment.
```

## Blockers

None.

## Lite Implementation Receipt — 2026-08-12

- **Task and mode:** Hito DS Foundations Validator Structure Reconciliation, Lite.
- **Outcome and demonstrated cause:** the existing validator counted every Foundations
  `HitoDsPlayground` as Marks and retained the previous `11 / 6` surface totals. Current source
  proves two separate playground starts, with `marks` inside the first and
  `typography-inspector-picker` inside the second; it also proves three Typography picker cases,
  no retired Mark size/shape matrix, and aggregate token/flat counts of `12 / 5`.
- **Reused seam and exact repair:** revised only
  `scripts/validate-hito-ds-component-contracts.ts`. The validator now asserts exactly two
  playgrounds, structurally associates the Marks and Typography Inspector identities with their
  respective playground positions, retains the full Mark metadata/shapes/sizes/gallery/provenance
  contract and retired-matrix absence, separately proves the Typography Inspector identity and
  interactive composition, and expects the accepted `12 / 5` surface classification. Diagnostics
  now state the expected structure explicitly.
- **Files changed:** `scripts/validate-hito-ds-component-contracts.ts` and this canonical item.
  Rendered Foundations/playground source, CSS, tokens, manifests, generated files, Product,
  DevTools, and unrelated dirty work were not changed. New runtime artifacts: none.
- **Focused proof:** `npm run validate-hito-ds-components`, manifest generator check mode,
  focused Prettier, focused ESLint, and `git diff --check` all passed.
- **Omitted proof:** browser and production build were intentionally not run because the repaired
  contract is source-only and no runtime source or asset changed; therefore this receipt makes no
  new rendered, Global QA, release-readiness, or deployment claim.
- **Remaining boundary:** none within this Lite item. PRODUCT may reconcile the predecessor item's
  lifecycle using this completed validator receipt; that earlier item was not modified here.
