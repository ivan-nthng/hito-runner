# Hito DS Brand Favicon Tone Validator Alignment

## Work Item ID

2026-08-12-hito-ds-brand-favicon-tone-validator-alignment

## Status

completed

## Type

validator-cleanup

## Priority

high

## Owner

design-system

## Mode

Lite

## Scope

Reconcile the Brand contrast assertion with the completed direct-favicon specimen without restoring
a duplicate gradient or inventing a second dark Brand surface.

## Archive Intent

retain_in_place

## Demonstrated Cause

`reference-brand-page.tsx` now has one real dark-background `LogoSpecimen` and one light-background
specimen. The `Favicon surface` is a default-toned specimen containing the self-contained canonical
`/favicon.svg`; its article label and layout are not placed on a dark surface. The validator still
requires two explicit `labelTone="on-dark"` assignments from the superseded page-local-gradient
composition. It therefore enforces stale representation rather than the current semantic contract.

The first incorrect owner is the Design System validator assertion at
`scripts/validate-hito-ds-component-contracts.ts`, not the favicon asset or the current Brand
reference source.

## Task

Update the existing Brand validator assertion to prove the actual current contract:

- exactly one explicit `on-light` Brand background specimen;
- exactly one explicit `on-dark` Brand background specimen;
- `LogoSpecimen` retains its supported tone union and the existing semantic foreground mappings;
- `Favicon surface` continues to render `/favicon.svg` directly without a page-local gradient,
  background recreation, `HitoLogoMark` reconstruction, or a false `on-dark` assignment.

Use the current assertion seam. Add no component, token, CSS recipe, helper, manifest field, Mark,
or compatibility path. Do not change `public/favicon.svg`, Product source, Figma, or release logic.

## Focused Proof

- Source discriminator proves the single actual on-light and single actual on-dark background
  specimen, while `Favicon surface` directly references `/favicon.svg`.
- Full existing DS validator passes.
- Focused Prettier/ESLint and `git diff --check` pass.
- No browser/build proof is required because rendering source and asset remain unchanged; report the
  distinction from a visual change explicitly.

## Preserved Boundaries

Do not reintroduce the rejected duplicate gradient merely to satisfy a count. Do not reopen the
completed favicon-asset task, stage, commit, push, deploy, or call hosted services.

## Product Handoff — Pending Confirmation

```text
ROLE: DESIGN SYSTEM

Mode: Lite
Stage: Brand favicon tone-validator alignment

Execute this canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-brand-favicon-tone-validator-alignment.md`

Read `AGENTS.md`, `agents/design-system.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write.

The release gate exposed a stale validator count, not a need to restore a second dark Brand
surface. `reference-brand-page.tsx` has one real dark-background sample and one real light-
background sample. `Favicon surface` is a default-toned specimen that directly renders the
canonical `/favicon.svg`; it is not a dark `LogoSpecimen` and must not receive a false
`labelTone="on-dark"` or a recreated gradient.

Update only the existing Brand assertion in
`scripts/validate-hito-ds-component-contracts.ts` so it validates one explicit on-light and one
explicit on-dark Brand-background specimen while preserving the existing tone union/mappings and
direct favicon asset assertion. New runtime artifacts, tokens, CSS, components, manifest fields,
helpers, gradients, Mark changes, Product changes, and compatibility paths: none.

Before writing, record the reused assertion seam and the stale invariant being removed. Prove the
source discriminator, full DS validator, focused formatting/lint, and `git diff --check`. No
browser or build replay is required because the rendered Brand source and favicon asset must remain
unchanged. Update this item with an English Lite receipt. Do not stage, commit, push, deploy, or
claim Global QA/release readiness.
```

## Next Recommended Role

PRODUCT — consume this Lite receipt and explicitly start any new frozen release attempt separately.

## Blockers

None for this Lite repair. Release work remains a separate Product-controlled gate and was not
started by this task.

## Design System Lite Receipt — 2026-08-12

- **Task / mode:** Brand favicon tone-validator alignment — Lite.
- **Demonstrated root cause:** the existing Brand validator still required two explicit
  `labelTone="on-dark"` assignments from the retired page-local favicon-gradient specimen. Current
  source truth contains exactly one explicit `on-light` Brand-background specimen, exactly one
  explicit `on-dark` specimen, and a default-toned `Favicon surface` that renders `/favicon.svg`
  directly.
- **Existing seam reused:** the single combined Brand assertion in
  `scripts/validate-hito-ds-component-contracts.ts`. The stale `on-dark === 2` invariant was removed
  and replaced with exact `on-light === 1` and `on-dark === 1` counts inside that assertion.
- **Preserved assertion contract:** the same assertion continues to verify the
  `default | on-light | on-dark` tone union, the existing stone/sand foreground mappings, the
  `Favicon surface` specimen, and its direct `/favicon.svg` asset reference.
- **New runtime artifacts:** none. No helper, assertion family, token, CSS, component, manifest
  field, gradient, Mark change, Product change, or compatibility path was added.
- **Files changed:**
  - `scripts/validate-hito-ds-component-contracts.ts` — one existing Brand assertion only;
  - this canonical item — lifecycle and receipt only.
- **Source stability:** `src/components/hito-ds/reference-brand-page.tsx` and
  `public/favicon.svg` were inspected but not changed by this slice. Their before/after SHA-1 values
  remained `e9fab3fce7bbe8954f93023bba73b880d4b66dd2` and
  `7c0c2246f842db5d52ca8de6fde8cbfd49e188f7`, respectively.
- **Focused proof:** the pre-change full DS validator reproduced exactly one failure — the stale
  Brand background assertion. The source discriminator then reported `onLight: 1`, `onDark: 1`,
  `favicon: true`, and `localFaviconGradient: false`. After the one-assertion correction,
  `npm run validate-hito-ds-components` passed with 324 files scanned; focused Prettier, ESLint, and
  `git diff --check` also passed.
- **Omitted proof:** browser and build replays were intentionally not run because neither rendered
  Brand source nor the canonical favicon asset changed. Their omission has no coverage consequence
  for this validator-only contract repair.
- **Boundary:** focused Lite implementation is complete with no task-owned blocker. This does not
  claim Global QA, release readiness, deployment, or a restarted release gate.
