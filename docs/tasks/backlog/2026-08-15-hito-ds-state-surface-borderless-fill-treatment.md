# Hito DS State Surface Borderless Fill Treatment — 2026-08-15

## Work Item ID

2026-08-15-hito-ds-state-surface-borderless-fill-treatment

## Status

completed

## Type

Tracked — shared State Surface visual contract

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Scope

The canonical `.hito-state-surface` treatment and every consumer of that exact class. This applies to neutral and semantic State Surface tones only; it does not change other surface families.

## Archive Intent

Compact terminal closeout after shared-consumer browser proof.

## Task

Remove the State Surface border at rest, hover, and all semantic tones. Neutral State Surface must use an existing neutral canonical fill that visibly differentiates it from the page background. Signal, success, warning, and destructive State Surfaces communicate through their semantic background fills only; they must not keep tone-specific border colours.

## User Report

Inspector item `4aa7c2a2-7d28-4aeb-93f3-36d92d9704a9`, captured `2026-08-15T13:53:04.339Z` on `/hitoDS/patterns`, Light `1470×801`, selected `article.hito-state-surface.w-full.max-w-2xl`. Ivan asked why the border remains and specified: neutral receives a neutral background colour; other tones retain only their background.

## Demonstrated Cause

`src/styles/overlays-feedback.css` defines a base `1px solid var(--color-hairline)` border for `.hito-state-surface`, then overrides its colour for signal, success, warning, and destructive. The prior responsive-preview task changed narrow padding only and did not include a chrome decision, so those declarations correctly remained.

## Expected Behavior

- No `hito-state-surface` variant renders a visible border or tone-specific border colour.
- Neutral uses one existing Hito neutral fill rather than bare page background or a custom alpha recipe.
- Semantic variants use their existing semantic fills without gradients or borders.
- Size geometry, content contrast, actions, focusable child controls, responsive 12px narrow padding, and non-State-Surface surface contracts remain unchanged.

## What Not To Touch

`hito-surface`, `hito-surface-flat`, `hito-surface-wash`, cards, dialogs, popovers, hito-row-group, focus rings, semantic text tokens, State Surface API, Product copy/flow, Figma, hosted state, and Git lifecycle. Do not add a neutral token, a gradient, a new variant, or local consumer overrides.

## Validation Expectations

Prove the shared class and every tone's computed border is none/zero; neutral and semantic fills are canonical and readable in Light/Dark; `/hitoDS` and existing Product/Admin State Surface consumers preserve action focus, responsive padding, containment, and console health. Run full DS validator, focused formatting/lint, diff hygiene, production build, and fresh browser proof when runtime ownership is available.

## Stage

Design System implementation complete; focused shared-consumer proof recorded.

## Execution Preflight — 2026-08-15

- **Visible symptom and demonstrated cause:** the selected `/hitoDS/patterns` State Surface and all
  consumers of `.hito-state-surface` inherit `border: 1px solid var(--color-hairline)`. Signal,
  success, warning, and destructive then replace only its colour with tone-specific alpha borders.
  `src/styles/overlays-feedback.css` is therefore the first incorrect canonical owner.
- **Consumer census:** current source reaches 19 consumer files: four Design System reference files,
  three Admin files, and twelve Product files. Existing uses cover neutral, signal, success,
  warning, and destructive surfaces; Product/Admin callers often keep their own token-backed
  padding utilities but do not own border or fill chrome.
- **Existing seam and smallest change:** reuse the existing `.hito-state-surface` base and tone
  selectors. Set the base border to zero, replace the neutral background mix with the existing
  canonical `--color-chrome-subtle` fill, retain the four current semantic background formulas,
  delete their tone-specific `border-color` declarations, and remove the now-dead border-colour
  transition responsibility.
- **New runtime artifacts:** none. No token, variant, helper, selector family, local override,
  component, fixture, registry, or compatibility path is required.
- **Preserved boundary:** the prior completed responsive `639px` padding rule already present in
  the same CSS owner remains byte-stable. Other surface families, State Surface API/typography,
  action/focus contracts, Product/Admin markup and behavior, Figma, hosted state, and unrelated
  dirty work remain outside this change.
- **Runtime ownership:** the managed loopback `qa_fixture` process is present and healthy but its
  artifact is stale (`artifact_missing`) after concurrent receipt/source movement. No competing
  runtime writer is demonstrated. This task will perform one fresh managed rebuild/replay only
  after source and static validation are stable.
- **Stop condition:** return to PRODUCT if `--color-chrome-subtle` fails to remain visually distinct
  from its rendered Light/Dark parents, if border removal exposes an interactive boundary that
  requires a new token/decision, or if representative Product/Admin proof requires source edits.

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS State Surface Borderless Fill Treatment
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-ds-state-surface-borderless-fill-treatment.md

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md. Do not start until any active shared-runtime writer has reached a terminal handoff; re-check the item, worktree, existing State Surface consumers, and runtime ownership first.

The demonstrated source owner is the canonical `.hito-state-surface` in `src/styles/overlays-feedback.css`: its base hairline border and semantic tone-specific border colours currently remain. Remove this chrome for every State Surface tone and size. Give neutral one existing canonical neutral fill that remains distinct from page background. Retain the existing semantic background fills for signal, success, warning, and destructive, but do not leave tone-specific borders or add gradients.

Preserve the State Surface API, sm/md/lg geometry, responsive narrow padding, text contrast, actions and their focus rings, Product/Admin consumers, and all other surface classes. Do not add tokens, variants, local overrides, Figma/hosted changes, staging, commit, push, or deployment. Reuse canonical colours; if no existing neutral fill is proven adequate, stop and return the choice to PRODUCT rather than creating a recipe.

Validate computed border removal and fills for neutral plus every semantic tone, then replay canonical and representative Product/Admin consumers in Light/Dark desktop/mobile. Check actions/focus, containment, console, full DS validator, focused Prettier/ESLint, diff hygiene, production build, and fresh browser proof when permitted. Record an English tracked receipt with affected consumers and any honest coverage gap; do not claim Global QA or release readiness.
```

## Tracked Implementation Receipt — 2026-08-15

### Task And Stage

- **Task:** Hito DS State Surface Borderless Fill Treatment.
- **Mode:** Tracked.
- **Stage completed:** canonical CSS repair, structural validator coverage, production build, and
  focused Design System/Product/Admin browser proof.
- **Acceptance boundary:** this receipt proves the assigned Design System implementation only. It
  does not claim Global QA, release readiness, deployment, hosted acceptance, or Figma parity.

### Product Outcome And Root Cause

The canonical `.hito-state-surface` is now borderless for neutral, signal, success, warning, and
destructive tones at every semantic size. Neutral reuses the existing `--color-chrome-subtle`
semantic fill; the four semantic tones retain their prior background formulas unchanged.

The demonstrated first incorrect owner was the shared rule in
`src/styles/overlays-feedback.css`: it supplied a base hairline border and four tone-specific border
colours. The repair removed that responsibility at the canonical owner instead of introducing a
consumer override. The now-dead `border-color` transition was removed with it.

### Source Census And Changed Seams

- Current reachability contains **19 direct consumer files**: four Design System reference files,
  three Admin files, and twelve Product files. The source census includes all five supported tones.
- `src/styles/overlays-feedback.css` — base border changed to zero; neutral switched to
  `var(--color-chrome-subtle)`; semantic border colours and the dead border transition were deleted.
  Existing tone fills, `sm`/`md`/`lg` geometry, and narrow `--space-3` padding remain intact.
- `scripts/validate-hito-ds-component-contracts.ts` — the existing State Surface assertion seam now
  fails if the border, neutral fill, semantic fills, or absence of tone border colours drifts.
- This canonical item — lifecycle, preflight, and receipt only.
- **New runtime artifacts:** none. No token, selector family, component, helper, variant, local
  override, fixture, registry, or compatibility path was added.

### Preserved Boundaries

State Surface API and typography, actions and child focus rings, Product/Admin markup and behavior,
semantic background formulas, desktop and responsive size geometry, and every non-State-Surface
surface class remain unchanged. No Product/Admin source, Figma, hosted state, Git lifecycle, fixture,
provider, or unrelated dirty hunk was modified.

### Validation

| Check                      | Scenario / environment                                                                        | Result                                | Evidence                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source discriminator       | Shared CSS and direct-consumer census                                                         | Passed                                | One canonical State Surface border owner; 19 direct consumer files; all five tones reachable.                                                                                                                |
| Focused formatting         | Prettier check for CSS, validator, and item                                                   | Passed                                | Targeted files conform.                                                                                                                                                                                      |
| Focused lint               | ESLint for the validator                                                                      | Passed                                | No lint error.                                                                                                                                                                                               |
| Full DS validator          | `npm run validate-hito-ds-components`                                                         | Passed                                | 328 scanned files; 43 primitives; 41 semantic tokens; 14 text styles; six workbench-settings consumers.                                                                                                      |
| Manifest parity            | `node scripts/generate-hito-ds-manifest.mjs --check`                                          | Passed                                | Generated parity remained 43 / 41 / 14; no manifest change.                                                                                                                                                  |
| Diff hygiene               | `git diff --check`                                                                            | Passed                                | No whitespace error.                                                                                                                                                                                         |
| Production build           | Managed `qa_fixture` restart/build                                                            | Passed                                | Client, SSR, and Nitro production outputs completed; existing non-task build warnings only.                                                                                                                  |
| Managed runtime            | Loopback `qa_fixture`                                                                         | Passed                                | Managed, compatible, loopback-bound, healthy, build present, fresh `receipt_matches`.                                                                                                                        |
| Canonical browser matrix   | `/hitoDS/patterns#notice-surface`; 1470×801 and 375×812; Light/Dark; five tones × three sizes | Passed                                | All 60 measured combinations computed `border-style: none` and `border-width: 0`; no horizontal overflow.                                                                                                    |
| Neutral and semantic fills | Same 60-cell matrix                                                                           | Passed                                | Neutral resolved from `--color-chrome-subtle` and remained distinct from its Light/Dark canvas; signal/success/warning/destructive retained their existing computed fills.                                   |
| Geometry                   | Desktop and narrow specimens                                                                  | Passed                                | Desktop padding remained 12/16/24px with 8/10/12px radii; narrow padding remained 12px for `sm`/`md`/`lg`, with radii unchanged.                                                                             |
| Action accessibility       | Real `Acknowledge` action                                                                     | Passed                                | Physical keyboard focus produced `:focus-visible` with the existing 2px signal outline while the parent border remained zero.                                                                                |
| Product consumer           | `/settings`; neutral surface; 1470×801 and 375×812; Light/Dark                                | Passed                                | Borderless canonical neutral fill, existing 16px caller padding, containment, and zero page overflow.                                                                                                        |
| Admin consumer             | `/admin/capture`; warning surface; 1470×801 and 375×812; Light/Dark                           | Passed for the shared visual contract | Borderless warning fill, existing 24px caller padding, containment, and zero page overflow. The fixture displayed its factual capture-load failure state; Admin feature recovery was not claimed or changed. |
| Console                    | Completed DS/Product/Admin replay                                                             | Passed                                | No browser warnings or errors were recorded.                                                                                                                                                                 |

### Coverage And Ownership

No required Design System proof was omitted. The Admin fixture's underlying capture-load failure is
outside this visual-contract task; its existing warning State Surface still provided direct Admin
consumer evidence. The next owner is **PRODUCT** for any later independent QA or release admission.
There is no remaining Design System implementation blocker in this item.

### Operating Context

- **Role file:** `agents/design-system.agent.md`.
- **Project skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- **Canonical task artifact:** this item.
- **Subagents:** none; implementation and focused proof remained with the assigned Design System
  owner.
