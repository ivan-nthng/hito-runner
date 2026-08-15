# Hito DS Brand Favicon Label Validator Reconciliation

## Work Item ID

2026-08-13-hito-ds-brand-favicon-label-validator-reconciliation

## Status

completed

## Type

Lite — Design System validator reconciliation

## Priority

high

## Owner

DESIGN SYSTEM

## Stage

Completed — validator-only reconciliation and focused static proof passed.

## Evidence From

- [Brand favicon tone-validator alignment](./2026-08-12-hito-ds-brand-favicon-tone-validator-alignment.md)
- [Reference contract and table-density batch](./2026-08-13-hito-ds-reference-contract-and-table-density-batch.md)

## Scope

Reconcile one stale Brand-source literal in the existing Hito DS validator with the accepted current
Brand specimen label. This is a validator-only repair; the rendered Brand source and favicon asset
are read-only evidence.

## Archive Intent

retain_in_place

## Demonstrated Cause

`src/components/hito-ds/reference-brand-page.tsx` now renders the canonical direct-asset specimen
as `<LogoSpecimen label="Favicon">`, while
`scripts/validate-hito-ds-component-contracts.ts` still requires the retired literal
`<LogoSpecimen label="Favicon surface">`. The assertion therefore fails despite the accepted
Brand source. The first incorrect owner is the Design System validator assertion, not the favicon
asset, Brand component, or reference composition.

## Task

Update only the existing combined Brand assertion so it requires the accepted `Favicon` specimen
literal while preserving all other checks: exactly one `on-light`, exactly one `on-dark`, the
existing tone union and foreground mappings, and direct `/favicon.svg` reuse.

Reuse the existing validator seam. New runtime artifacts, CSS, tokens, components, manifests,
helpers, gradients, compatibility paths, or source changes: none.

## What Not To Touch

- `src/components/hito-ds/reference-brand-page.tsx`, `public/favicon.svg`, any Product/Admin
  surface, and the completed favicon implementation.
- Managed runtime, build output, Admin snapshot contract, Figma, hosted state, Git lifecycle, or
  the separate browser replay for the blocked reference batch.
- Unrelated validator assertions or dirty work.

## Focused Proof

- Reproduce the exact stale-literal failure or source discriminator before the edit.
- Verify `Favicon` is accepted and the stale `Favicon surface` literal is no longer required.
- Run the full Hito DS validator, focused Prettier and ESLint, and `git diff --check`.
- Browser/build replay is not required because rendered source and assets must remain unchanged.
  If unrelated validator failures remain, report them separately rather than modifying their
  owners.

## Promotion Condition

Promote and return to PRODUCT if the repair needs any rendered Brand/Favicon source change, shared
contract change, build/runtime ownership change, or another production owner.

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Brand Favicon Label Validator Reconciliation
Mode: Lite
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-brand-favicon-label-validator-reconciliation.md

Read AGENTS.md, agents/design-system.agent.md, and
skills/hito-frontend-design-system/SKILL.md before acting.

Outcome:
Repair the stale Brand validator literal so the full DS validator accepts the already approved
`<LogoSpecimen label="Favicon">` source.

Demonstrated cause and existing seam:
- `src/components/hito-ds/reference-brand-page.tsx` uses `label="Favicon"`.
- The combined Brand assertion in `scripts/validate-hito-ds-component-contracts.ts` still requires
  `label="Favicon surface"`.
- The validator is the first incorrect canonical owner.

Change only that existing assertion. Preserve its checks for one `on-light`, one `on-dark`, the
existing tone union and foreground mappings, and direct `/favicon.svg` reuse. Do not edit rendered
Brand/Favicon source, Product/Admin surfaces, runtime/build scripts, Figma, tokens, CSS, manifests,
or unrelated validator assertions. Add no file, helper, compatibility path, or new contract.

Run a focused before/after source discriminator, the full DS validator, focused Prettier and
ESLint, and `git diff --check`. Browser/build replay is intentionally out of scope because no
rendered source or asset may change. Record an English Lite receipt in this canonical item. If an
unrelated gate remains red, report its exact owner and evidence without repairing it.
```

## Blockers

None for this narrow validator repair. The separate managed-runtime admission and independent
browser replay remain owned by their existing acceptance path after this item completes.

## Lite Implementation Receipt — 2026-08-13

- **Task / mode:** Hito DS Brand Favicon Label Validator Reconciliation; Lite.
- **Outcome and demonstrated cause:** the pre-change full DS validator failed only the combined
  Brand assertion because accepted rendered source uses `<LogoSpecimen label="Favicon">` while the
  assertion still required the retired `Favicon surface` label. The Design System validator was
  the first incorrect owner.
- **Existing seam and change budget:** reused the existing combined Brand assertion in
  `scripts/validate-hito-ds-component-contracts.ts`; changed only its favicon label literal. New
  runtime artifacts, helpers, files, tokens, CSS, components, manifests, compatibility paths, and
  rendered-source changes: none.
- **Preserved contract:** the same assertion still requires exactly one `on-light`, exactly one
  `on-dark`, the existing `default | on-light | on-dark` tone union, the stone/sand foreground
  mappings, and direct `src="/favicon.svg"` reuse. `reference-brand-page.tsx` and `public/favicon.svg`
  were read-only evidence and were not edited by this task.
- **Files changed:** `scripts/validate-hito-ds-component-contracts.ts` and this canonical receipt.
- **Focused proof:** before the edit, `npm run validate-hito-ds-components` reproduced the exact
  Brand assertion failure. After the edit, source and validator both contain the accepted
  `<LogoSpecimen label="Favicon">`, the validator contains zero `Favicon surface` literals, and the
  full DS validator passes (`scannedFiles=327`). Focused Prettier, focused ESLint, and
  `git diff --check` pass.
- **Omitted proof:** browser and production-build replay were intentionally not run because this
  task changed no rendered source, asset, runtime contract, or generated output; no visual/runtime
  claim is made.
- **Remaining boundary:** the managed-runtime admission and browser matrix from the dependent
  reference batch remain separate acceptance work. This Lite result does not claim Global QA,
  release readiness, deployment, hosted acceptance, or Figma parity.
- **Operating context:** role file `agents/design-system.agent.md`; skill
  `skills/hito-frontend-design-system/SKILL.md`; no subagent used.
