# Hito DS Status Pill Borderless Canonical Chrome

## Work Item ID

2026-08-13-hito-ds-status-pill-borderless-canonical-chrome

## Status

completed

## Type

shared Design System component chrome

## Priority

high

## Owner

design_system

## Scope

Canonical `.hito-status-pill` CSS and focused Product, Admin, and `/hitoDS` inheritance proof.

## Archive Intent

Archive after the shared source deletion and focused cross-surface proof are complete.

## Mode

Tracked

## Task

Remove the perimeter border from the canonical `.hito-status-pill` contract everywhere it is
consumed. Delete the obsolete base border and all tone-specific and Light-theme border-color
declarations from the shared owner while preserving semantic foregrounds, translucent fills,
typography, padding, radius, truncation, status meaning, and accessibility.

Do not add a transparent border, consumer workaround, new recipe, token, file, component, runtime
artifact, or compatibility path. Product, Admin, DevTools, Figma, Backend, and individual
consumers remain read-only.

## Stage

Completed — canonical chrome removed and focused cross-surface proof passed.

## Execution Preflight — 2026-08-13

- **Accepted outcome:** `.hito-status-pill` is borderless at the one canonical CSS owner; every
  consumer inherits that result without local remediation.
- **Demonstrated owner:** repository-wide CSS inspection found the only component definition and
  every border declaration in `src/styles/shell-admin-analytics.css`. `src/styles.css` imports that
  stylesheet once. `forms-onboarding.css` contains one status-pill layout selector, but it owns only
  flex/max-width containment and no border or colour.
- **Current inventory:** nine obsolete declarations exist: the base `border`, plus `border-color`
  for success, warning, destructive/error, signal, Light signal, rollout, Light rollout, and muted.
  No TS/TSX consumer composes `border` or `ring` with `hito-status-pill`.
- **Reachability:** the current checkout contains 68 class references across 30 TS/TSX files; one
  is typography metadata and the remaining runtime references span Product, Admin, DevTools, and
  `/hitoDS`. This supersedes the older 32-consumer estimate without changing the one-owner fix.
- **Existing seam and smallest change:** edit only the existing status-pill block in
  `src/styles/shell-admin-analytics.css`; remove the nine declarations and retain every other
  property byte-for-byte.
- **New runtime artifacts:** none. No helper, file, token, CSS recipe, component, state, route,
  dependency, generated output, persistence, or compatibility layer is proposed.
- **Superseded responsibility:** perimeter geometry and all semantic perimeter colouring are
  deleted. Fill and foreground remain the complete status-tone chrome.
- **Dirty-work boundary:** the shared stylesheet is clean at preflight. All unrelated dirty source,
  backlog, generated, Product, Admin, DevTools, and `/hitoDS` work remains untouched.
- **Runtime serialization:** a separate canonical DESIGN SYSTEM Data Table task is active in
  disjoint source files but currently owns the shared loopback runtime/build lifecycle. This task's
  CSS deletion may remain, but build and browser side effects must wait until that owner is idle and
  the runtime handoff is stable.
- **Stop condition:** return to PRODUCT if another canonical border owner, a non-inheriting consumer
  override, or a cross-owner behaviour change appears.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused Design System implementation proof only; not Global QA, hosted,
  release, deployment, production, or Figma acceptance.
- **Runtime:** use only the canonical managed loopback `qa_fixture` after the CSS edit settles and a
  fresh build receipt is available. Do not use hosted data or an ad hoc server.
- **Browser path:** use a supported local browser against `http://127.0.0.1:3000` without requesting
  browser approval.
- **Matrix:** Light/Dark `/hitoDS` tone specimens plus representative Product and Admin consumers;
  verify signal, success, warning, muted, error/destructive, long-label truncation, computed
  border width/style, unchanged fill/foreground/radius/padding, horizontal containment, and console
  health.

## Validation Inventory

| Check            | Scenario                                                                | Required result                                                                          |
| ---------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Source ownership | All CSS and TS/TSX status-pill references                               | One canonical CSS owner; no consumer border override                                     |
| Direct removal   | Shared status-pill block                                                | Zero `border` or `border-color` declarations; nine obsolete declarations deleted         |
| Preservation     | Base and tone blocks                                                    | Fill, foreground, typography, padding, radius, truncation, meaning, and markup unchanged |
| Focused static   | Prettier, relevant lint/source checks, DS validator, `git diff --check` | Clean task-owned result or exact external failure                                        |
| Build/runtime    | Canonical managed `qa_fixture`                                          | Fresh, healthy, managed, compatible, loopback-bound artifact                             |
| Browser          | `/hitoDS`, Product, Admin, Light/Dark                                   | Borderless tones, long-label containment, no overflow or console errors                  |

## Next Recommended Role

PRODUCT, for lifecycle routing only. No implementation successor is required.

## Tracked Implementation Receipt — 2026-08-13

### Product Outcome And Root Cause

The canonical status pill is now borderless everywhere it is consumed. Source inspection confirmed
that `src/styles/shell-admin-analytics.css` was the first and only incorrect owner: its base
`border` created perimeter geometry and eight tone/Light-theme `border-color` declarations coloured
that perimeter. No consumer-level border owner or non-inheriting override was found.

The fix deletes that entire perimeter responsibility at the shared owner. It does not replace the
border with transparent geometry or move the recipe into consumers. Existing semantic fill and
foreground remain the complete tone chrome.

### Files Changed

- `src/styles/shell-admin-analytics.css` — deleted the base border and eight obsolete semantic
  border-colour declarations from `.hito-status-pill`; every retained declaration is unchanged.
- `docs/tasks/backlog/2026-08-13-hito-ds-status-pill-borderless-canonical-chrome.md` — recorded the
  Tracked preflight, evidence, validation, and closure.

No production file, helper, token, component, CSS recipe, state owner, route, dependency, fixture,
runtime artifact, generated output, persistence path, or compatibility layer was added.

### Preserved Boundaries

- All 68 current class references across 30 TS/TSX files inherit the one corrected contract.
- Semantic foregrounds and translucent fills, typography, padding, radius, maximum width,
  truncation, status meaning, markup, and accessibility remain unchanged.
- Product, Admin, DevTools, `/hitoDS`, Figma, Backend, providers, global tokens, and individual
  consumers were not edited for this task.
- Shared build/runtime work was serialized behind other DESIGN SYSTEM owners; no active runtime or
  source writer was interrupted.

### Validation

| Check                    | Scenario / environment                                                                             | Result                       | Evidence                                                                                                                                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership discriminator  | Repository-wide status-pill CSS and consumer scan                                                  | Passed                       | `shell-admin-analytics.css` remains the sole component owner; the separate onboarding selector owns layout only; no consumer composes a pill border or ring.                                                                                                                                  |
| Direct deletion          | Canonical `.hito-status-pill` block                                                                | Passed                       | Zero `border`/`border-color` declarations remain; exactly nine obsolete declarations were deleted with no replacement.                                                                                                                                                                        |
| Focused formatting/lint  | Prettier; ESLint on representative DS, Product, and Admin consumers                                | Passed                       | No task-owned formatting or lint error.                                                                                                                                                                                                                                                       |
| DS validator             | `npm run validate-hito-ds-components`                                                              | External failure             | The status-pill contract has no failing assertion. The only failure is the concurrent Brand favicon/background-sample contract, outside this task and untouched here.                                                                                                                         |
| Diff hygiene             | Task-scoped `git diff --check`                                                                     | Passed                       | No whitespace error in the stylesheet or canonical item.                                                                                                                                                                                                                                      |
| Build/runtime            | Canonical managed loopback, `qa_fixture`                                                           | Passed                       | Rebuilt artifact reported current, managed, compatible, loopback-bound, healthy, fresh, and `receipt_matches`.                                                                                                                                                                                |
| `/hitoDS` browser        | Status Demo/Variants, 1470×801 and exact 375×812, Light/Dark                                       | Passed                       | Neutral, signal, success, warning, muted, destructive/error, and long-label examples computed a `0px` border; semantic fills/foregrounds, 6px radius, 4px/8.8px padding, and truncation properties remained; no horizontal overflow.                                                          |
| Product browser          | `/integrations`, Light/Dark                                                                        | Passed                       | Representative warning, neutral, and success pills inherited `0px`; semantic chrome and geometry remained; no horizontal overflow.                                                                                                                                                            |
| Admin browser            | Local `qa_fixture` `/admin/analytics?section=test-accounts`, desktop and exact 375×812, Light/Dark | Passed                       | All 29 rendered Admin pills inherited `0px`; signal, success, warning, and neutral fills/foregrounds remained; 375px document width stayed contained; console warning/error log was empty.                                                                                                    |
| Independent read-only QA | `/hitoDS` Light/Dark desktop/mobile                                                                | Passed with bounded coverage | QA independently confirmed all required DS tones and the long label as borderless with retained chrome and no overflow. Shared runtime serialization interrupted its optional Product/Admin repetition; the implementation owner completed those required surfaces on a later fresh artifact. |

### Omitted-Proof Consequences And Blockers

The repository-wide DS validator is not green because of the unrelated existing Brand
favicon/background-sample assertion named above; therefore this receipt does not claim whole-DS
validation health. The optional QA reviewer did not repeat Product/Admin after the runtime was
externally stopped, so independence applies to `/hitoDS` while Product/Admin evidence is
owner-recorded focused proof. There is no demonstrated status-pill source or browser blocker.

This is focused implementation acceptance only. It does not claim Global QA, hosted parity,
release readiness, deployment readiness, production acceptance, or Figma parity.

## Consumed Dispatch Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Status Pill Borderless Canonical Chrome
Mode: Tracked
Stage: execution preflight, canonical chrome removal, focused cross-surface proof

Remove the base `.hito-status-pill` border and every obsolete tone/Light-theme border-color
declaration at the sole canonical owner. Add no replacement machinery or consumer workaround.
Preserve semantic fill/foreground, typography, spacing, radius, truncation, meaning, accessibility,
and unrelated dirty work. Prove zero remaining pill border declarations, focused static/build
health, and representative Product/Admin/DS Light/Dark browser rendering. Return cross-owner
behaviour or ownership gaps to PRODUCT.
```
