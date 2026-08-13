# Hito DS Validator Legacy Foundations Contract Reconciliation

## Work Item ID

2026-08-12-hito-ds-validator-legacy-foundations-contract-reconciliation

## Status

completed

## Type

design-system-validation

## Priority

high

## Owner

design-system

## Mode

Tracked

## Scope

Reconcile exactly two stale `validate-hito-ds-components` Foundations assertions with the accepted
Mark playground and reference-surface contracts. This is a validator/source-of-truth repair, not a
visual redesign and not a request to restore retired UI.

## Archive Intent

retain_in_place

## Task

Restore the Design System validator to green for the two failures introduced when the accepted Mark
Foundations reference replaced its static all-size matrix with one canonical `HitoDsPlayground` and
retained the lower catalogue.

The repair must prove the current canonical contract rather than reintroducing source-string
markers or obsolete specimens solely to make a count pass. The existing validator remains the
single DS contract owner; do not add another validator, manifest field, registry, compatibility
marker, token, CSS recipe, or UI matrix.

## User Report

The completed CSS ownership slice reports two remaining legacy DS-validator failures. Ivan asked
for one small separate task for those two failures, without expanding the completed CSS task.

## Evidence

Current command, run locally on 2026-08-12:

```text
npm run validate-hito-ds-components

[hito-ds-components] validation failed
- Foundations must document the canonical Mark inventory, both shapes, five sizes and token provenance.
- Foundations reference-surface classification drifted: 11 accepted token specimens and 6 preserved distinct flat surfaces.
```

The two failing assertions are in
`scripts/validate-hito-ds-component-contracts.ts`:

- the Mark assertion at lines 1410-1416 still requires the retired literal
  `data-hito-ds-mark-size-shape-matrix`;
- the reference classification assertion at lines 1494-1496 hard-codes `12` token-specimen
  surfaces and `6` flat surfaces.

The accepted current Foundations owner is
`src/components/hito-ds/reference-foundations-page.tsx`:

- it imports `HITO_MARK_META`, `HITO_MARK_SHAPES`, `HITO_MARK_SIZES`, and `HitoMark`;
- `#marks` now uses the existing `HitoDsPlayground` with Mark, Shape, Size, and Background controls;
- `data-hito-ds-mark-gallery` remains the full 15-Mark catalogue;
- the retired static marker does not exist;
- exact source counting now yields 11 `hito-ds-token-specimen-surface` and 6
  `hito-surface-flat` occurrences across Foundations and Brand.

Related accepted work:

- [Mark Playground and Size-Aware Radius](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-mark-playground-and-size-aware-radius.md)
- [CSS Ownership and Recipe Consolidation](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-css-ownership-and-recipe-consolidation.md)

## Demonstrated Cause

The first incorrect canonical owner is the existing DS validator. Its Mark assertion is coupled to
a removed implementation marker, and its reference-surface assertion retains the former static
matrix count. The accepted Foundations implementation is the authority; no visible product or
Foundation regression is demonstrated.

Before changing either expectation, prove the second count discriminator: identify the precise
former specimen that accounted for the twelfth count and confirm that its retirement was an
intentional part of the accepted Mark playground replacement. If that proof does not hold, stop:
do not lower a count merely to make the validator pass.

## Required Outcome

1. Replace the retired static-matrix predicate with structural evidence of the current Mark
   contract: `#marks`, `HITO_MARK_META`, `HITO_MARK_SHAPES`, `HITO_MARK_SIZES`, `HitoMark`, one
   existing `HitoDsPlayground`, the retained Mark gallery, and `MarkTokenProvenance`.
2. Reconcile the reference-surface classification assertion only after the count discriminator
   proves the removed matrix specimen was the sole intentional difference. Keep the six preserved
   flat surfaces exact; make the token-specimen expectation reflect the accepted composition rather
   than a dead matrix.
3. Keep the existing borderless token-specimen CSS contract, Mark metadata, five sizes, two shapes,
   lower gallery, Mark playground controls, and all current Foundation color/context behaviour
   unchanged.

## What Not To Touch

- Do not restore `data-hito-ds-mark-size-shape-matrix`, the all-sizes matrix, or duplicate
  Foundation controls.
- Do not change `hito-mark.tsx`, token values, manifest generation, CSS, Product routes, DevTools,
  Backend, persistence, Figma, providers, hosted state, build configuration, or unrelated dirty
  work unless the required source discriminator shows the validator cannot describe the accepted
  contract without one narrowly justified Foundation reference change.
- Do not alter any other validator assertion, relax counts broadly, introduce source-file-count
  rules, or make the test green by deleting coverage.

## Validation Expectations

- Re-run and record the exact count discriminator before the edit.
- `npm run validate-hito-ds-components` passes with no skipped legacy assertion.
- `node scripts/generate-hito-ds-manifest.mjs --check` passes.
- Run focused Prettier and ESLint on changed task-owned source, plus `git diff --check`.
- If implementation changes only the validator and task record, browser/build proof is not
  required. If any rendered Foundations source changes, run focused Dark/Light desktop and
  375×812 proof for the Mark playground and gallery, including controls, containment, and console
  health.
- An independent read-only `ROLE: QA` or `ROLE: DESIGNER` review is optional only if it materially
  helps verify that the rewritten assertion still protects the accepted contract. No
  same-discipline implementation subagent.

## Stage

Completed — Design System validator-contract repair.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Stage: Validator-contract repair

Execute the canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-validator-legacy-foundations-contract-reconciliation.md`

Read `AGENTS.md`, `agents/design-system.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, the complete canonical item, the current dirty diff,
`scripts/validate-hito-ds-component-contracts.ts`,
`src/components/hito-ds/reference-foundations-page.tsx`,
`src/components/ui/hito-mark.tsx`, and the existing `HitoDsPlayground` seam before the first write.

This is one narrow validator/source-of-truth repair. The visible failures are demonstrated stale
assumptions in the existing validator after the accepted Mark Foundations matrix was replaced with
one canonical playground. You own all DESIGN SYSTEM source changes yourself. Do not delegate
DESIGN SYSTEM or FRONTEND implementation. If material, use only an existing named ROLE: QA or
ROLE: DESIGNER for a bounded read-only contract review after your source is stable.

First reproduce the two exact failures. Prove which intentionally retired Mark specimen caused the
token-specimen count to move from 12 to 11; do not lower the assertion until that discriminator is
shown. Then replace the literal retired-matrix check with a structural assertion of the current
Mark contract: the #marks section, canonical HITO_MARK metadata/shapes/sizes, HitoMark, one existing
HitoDsPlayground, the retained gallery, and provenance. Reconcile the exact surface count only when
the demonstrated retired specimen proves it is correct.

Do not reintroduce the static matrix, CSS, tokens, manifests, a new registry, compatibility marker,
Product change, or weakened broad validator. Preserve the borderless specimen contract, five sizes,
two shapes, lower gallery, Mark controls, color/context reference, and unrelated dirty work.

Run the exact discriminator, full DS validator, manifest check, focused Prettier/ESLint, and
`git diff --check`. If only the validator changes, no browser/build run is required. If a rendered
Foundations seam must change, run a focused Mark playground/gallery replay in Dark/Light at desktop
and exact 375×812 with keyboard controls, no overflow, and no console error. Append an English
Tracked implementation receipt with the former-marker proof, assertion change, checks, and any
omitted proof consequence. Do not claim Global QA, release readiness, deployment, or Product
adoption.
```

## Blockers

None. The task must stop and return to PRODUCT if the count discriminator shows a live Foundation
specimen was accidentally removed rather than intentionally replaced.

## Tracked Implementation Receipt — 2026-08-12

### Preflight and outcome

- Reused the existing `validate-hito-ds-components` owner and the accepted Mark source seams. New
  runtime artifacts: none. The only source behavior change is the validator's description of the
  already-accepted Foundations composition.
- Reproduced both reported failures before writing: the retired Mark matrix predicate and the
  `12 accepted / 6 distinct` reference-surface expectation.
- The validator is green without restoring the matrix, adding a compatibility marker, or changing
  rendered Foundations, Mark, CSS, tokens, manifests, Product code, or shared primitives.

### Former-specimen discriminator

- The completed Mark-library receipt records one compact fixed size/shape overview plus the
  retained controlled 15-Mark gallery, and its DS validator result was green at 12 accepted token
  specimens.
- The accepted follow-up explicitly replaced that `Five sizes · two shapes` overview with one
  `HitoDsPlayground`, retained the lower gallery, and recorded the resulting validator observation
  as 11 accepted token specimens / 6 distinct flat surfaces. That single retired overview was the
  twelfth token-specimen source occurrence; no live gallery or distinct flat surface was removed.
- Current exact source counting confirms 9 Foundations token-specimen occurrences + 2 Brand
  occurrences = 11, with 6 flat surfaces, one Mark playground, one retained Mark gallery, and zero
  retired matrix markers.

### Assertion repair

- Replaced the literal `data-hito-ds-mark-size-shape-matrix` requirement with structural checks for
  `#marks`, `HITO_MARK_META.map`, `HITO_MARK_SHAPES.map`, the `HITO_MARK_SIZES`-derived size list,
  `HitoMark`, exactly one `HitoDsPlayground`, the retained gallery and `MarkTokenProvenance`.
- Added an explicit negative assertion for the retired matrix marker and reconciled only the exact
  accepted token-specimen count from 12 to 11. The six preserved distinct flat surfaces remain an
  exact assertion.

### Files changed

- `scripts/validate-hito-ds-component-contracts.ts` — current Mark structural contract and exact
  accepted Foundations/Brand surface count.
- This canonical item — lifecycle and implementation receipt.

### Validation inventory

| Check               | Scenario / environment                               | Result            | Evidence                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failure replay      | Pre-edit `npm run validate-hito-ds-components`       | Passed            | Reproduced exactly the stale Mark-matrix failure and the `11 accepted / 6 distinct` count failure.                                                                              |
| Count discriminator | Current Foundations + Brand source                   | Passed            | 9 + 2 = 11 token specimens; 6 flat surfaces; 1 playground; 1 gallery; 0 retired matrix markers.                                                                                 |
| Full DS validator   | `npm run validate-hito-ds-components`                | Passed            | `contract ok`; 324 files scanned, 12 workout domain bases and 41 semantic colours.                                                                                              |
| Manifest parity     | `node scripts/generate-hito-ds-manifest.mjs --check` | Passed            | 43 primitive colours, 41 semantic colours and 14 text styles remain in parity.                                                                                                  |
| Focused formatting  | Validator source                                     | Passed            | `npx prettier --check` exited 0.                                                                                                                                                |
| Focused lint        | Validator source                                     | Passed            | `npx eslint` exited 0.                                                                                                                                                          |
| Diff hygiene        | Shared checkout                                      | Passed            | `git diff --check` exited 0.                                                                                                                                                    |
| Browser/build       | Rendered application                                 | Not run by design | Only validator source and this task record changed; the canonical item explicitly does not require rendered or build replay in that case. No rendered-behaviour claim is added. |

### Boundaries and next owner

- No subagent was used; the exact source discriminator and green contract checks closed the narrow
  evidence need without an additional review lane.
- Unrelated dirty work was preserved. No staging, commit, push, deployment, hosted access, provider
  call, Product adoption, Figma change, Global QA Acceptance, release-readiness claim, or data
  mutation occurred.
- Next owner: PRODUCT for normal queue/lifecycle routing. Blockers: none.
