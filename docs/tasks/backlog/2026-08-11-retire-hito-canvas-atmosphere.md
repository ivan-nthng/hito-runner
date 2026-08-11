# Retire Hito Canvas Atmosphere

## Work Item ID

2026-08-11-retire-hito-canvas-atmosphere

## Status

blocked

## Type

source-cleanup

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Remove the exact decorative `hito-canvas-atmosphere` background gradient everywhere it is currently
live, then delete its now-dead canonical Design System definition and Hito DS foundations demo.

The execution is deliberately staged because current consumers span Frontend Product and Design
System ownership.

## Stage

Stage 2 Design System runtime retirement implemented and validated; closure is blocked by the
excluded light-theme showcase-card surface override.

## Archive Intent

retain_in_place

## Task

Ivan has rejected this exact gradient as a design role. Retire it completely rather than remove it
only from the selected Hito DS `main` and leave the legacy role live elsewhere.

Stage 1 — FRONTEND Product:

- Remove the existing `hito-canvas-atmosphere` usage only from
  `src/components/AppShell.tsx`, `src/routes/admin.capture.tsx`, and
  `src/routes/admin.analytics.tsx`.
- Preserve existing `bg-background`, structure, layout, behavior, authentication, and all other
  class tokens. Do not substitute a custom background or a new wrapper.

Stage 2 — DESIGN SYSTEM, after Stage 1 proves zero Product/Admin consumers:

- Remove the Hito DS page usage from `src/components/hito-ds/reference-page.tsx`.
- Delete the now-dead `.hito-canvas-atmosphere` and unused `.canvas-grain` gradient rules in
  `src/styles/foundations.css`.
- Remove only the now-false foundations token/demo/copy references in
  `src/components/hito-ds/reference-foundations-page.tsx`.
- In the same existing DS reference-page composition, use the existing semantic `bg-surface` page
  background while Overview showcase cards remain `bg-background`. This yields the requested
  quieter background that is one existing semantic elevation lighter than cards in both themes;
  no color or token is invented.

## User Report

Inspector item `88ba25bc-60ce-4802-baca-39a8f0d900ed` captured `/hitoDS`, dark, `1470×801`,
targeting `main.hito-workbench-main`. Ivan requested removal of this specific gradient everywhere,
and a simple existing-token page background lighter than the cards.

## Evidence And Demonstrated Cause

- The selected `main.hito-workbench-main` itself contains no background rule at
  `src/styles/reference-workbench.css:273-276`.
- Its visual gradient is inherited from the outer `hito-canvas-atmosphere` class in
  `src/components/hito-ds/reference-page.tsx:61`.
- The exact class is also live in `AppShell.tsx:87`, `admin.capture.tsx:442,508`, and
  `admin.analytics.tsx:127`.
- The canonical gradient is defined in `src/styles/foundations.css:883-889` and has a light-theme
  companion at `943-955`; its Hito DS demo/token documentation is in
  `reference-foundations-page.tsx`.
- Existing dark tokens are `background=stone-900` and `surface=stone-850`; light tokens are
  `background=linen-100` and `surface=linen-50`. Existing showcase cards already use
  `background` in dark. The requested contrast can therefore reuse tokens rather than add a colour.

The demonstrated root cause is the shared `hito-canvas-atmosphere` design role, not a property of
the selected `main` element.

## What Not To Touch

- Any other gradient role, especially auth-photo overlays, editorial washes, or unrelated
  color-mix backgrounds.
- Product behavior, data, APIs, persistence, Admin behavior, Hito DS primitives, token values,
  Figma, hosted state, or unrelated dirty work.
- Do not replace the removed gradient with a new gradient, image, opacity recipe, custom colour,
  new token, compatibility class, or shadow.

## Validation Expectations

- Before Stage 2, a source map proves no remaining Product/Admin use of
  `hito-canvas-atmosphere`.
- After Stage 2, repository search proves no `hito-canvas-atmosphere` or `canvas-grain` runtime
  definition/consumer remains.
- Verify AppShell, both Admin routes, `/hitoDS` Overview, and one non-Overview Hito DS page in
  available themes/desktop and narrow layout appropriate to their surfaces; no unexpected
  background-image, overflow, console error, or behavior change.
- Focused DS/static checks and an uncontended build. Product and DS each report their assigned
  evidence; Global QA is not implied.

## Next Recommended Role

product

## Blockers

The authorized Stage 2 source list excludes `src/styles/reference-workbench.css`, but its accepted
dirty light-theme rule currently assigns `.hito-ds-showcase-card` the same `--color-surface` used by
the new DS page background. The rejected atmosphere role is fully retired, but the required
one-elevation page/card contrast therefore cannot be truthful in light theme without Product
authorizing that existing Design System seam. No compatibility or local override was added.

## Frontend Product Stage 1 Execution Preflight — 2026-08-11

- Stage outcome: remove only the live `hito-canvas-atmosphere` class usage from the authenticated
  AppShell and the two named Admin routes, leaving `bg-background` and all behavior/composition
  intact.
- Demonstrated cause and owner: the canonical item/source map identifies one AppShell instance,
  two Admin Capture instances, and one Admin Analytics instance as the complete Product/Admin
  consumer set; Frontend Product owns those consumers.
- Existing seam: delete the class token in place from the four existing class strings.
- New production runtime artifacts: none.
- Removed responsibility: Product/Admin surfaces stop opting into the rejected gradient role; the
  canonical role, Hito DS consumer/demo, and deletion remain exclusively in Stage 2.
- Focused proof: exact zero-Product/Admin-consumer search, preserved remaining DS-only map, focused
  formatting/lint/diff hygiene, and the fresh production build already available for the pre-edit
  queue baseline. A new build will run only if the shared output remains uncontended.
- Stop boundary: do not edit shared CSS, Hito DS reference consumers, tokens, or any other gradient;
  return to Product after the zero-consumer receipt for Design System dispatch.

## Frontend Product Stage 1 Receipt — 2026-08-11

- Task and stage: Retire Hito Canvas Atmosphere — Tracked, Stage 1 Frontend Product only.
- Product outcome: the authenticated AppShell and both named Admin routes no longer opt into the
  rejected `hito-canvas-atmosphere` gradient. Their existing `bg-background`, structure, content,
  and behavior remain unchanged.
- Root cause: the canonical source map demonstrated that the shared atmosphere role remained live
  through four Product/Admin class-string usages; those consumer opt-ins were the Frontend-owned
  portion of the retirement.
- Files changed in Stage 1: `src/components/AppShell.tsx`, `src/routes/admin.capture.tsx`,
  `src/routes/admin.analytics.tsx`, and this canonical item.
- New runtime artifacts: none.
- Preserved boundaries: the unrelated pre-existing AppShell header hunk was preserved; no shared
  CSS, Hito DS reference/demo, token, other gradient, behavior, authentication, data, or persistence
  source was changed.
- Lifecycle result: Stage 1 is complete and the item is `ready` with Product as the next owner for
  bounded Design System Stage 2 dispatch. The overall item is not completed.

| Check                             | Scenario / environment                                         | Result  | Evidence                                                                                                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product/Admin consumer retirement | Repository source map across `src/components` and `src/routes` | Passed  | Zero `hito-canvas-atmosphere` occurrences remain outside `src/components/hito-ds/`.                                                                                                                                       |
| Stage 2 boundary                  | Hito DS and foundations source map                             | Passed  | Remaining occurrences are confined to `reference-page.tsx`, `reference-foundations-page.tsx`, and `foundations.css`, exactly the deferred Design System seams.                                                            |
| Preserved semantic background     | Four edited class strings                                      | Passed  | Each retains `min-h-screen`, `bg-background`, and `text-foreground`; no substitute gradient, wrapper, or visual token was added.                                                                                          |
| Formatting and lint               | Prettier check + ESLint on the three implementation files      | Passed  | Both commands exited 0.                                                                                                                                                                                                   |
| Diff hygiene                      | Repository `git diff --check`                                  | Passed  | Exit 0; the unrelated existing AppShell header diff remains untouched.                                                                                                                                                    |
| Production compilation            | Fresh local canonical `npm run build` after Stage 1            | Passed  | Client, SSR, Nitro, and postbuild completed with exit 0; only existing dependency/chunk-size warnings were emitted.                                                                                                       |
| Rendered theme/layout replay      | AppShell and Admin desktop/narrow themes                       | Not run | The supported in-app browser URL policy blocked local DOM inspection during this queue and prohibited an alternate browser bridge; computed background-image, overflow, and console coverage remains for later visual QA. |

Frontend Product Stage 1 Implementation DoD is satisfied. Design System Stage 2, Global QA
Acceptance, release readiness, and the overall item completion remain unclaimed.

## Design System Stage 2 Receipt — 2026-08-11

- Task and stage: Retire Hito Canvas Atmosphere — Tracked, Stage 2 Design System only.
- Preflight: reuse the existing `bg-surface` page composition, remove the last DS consumer and the
  exact dead shared definitions/demo, add no runtime artifact, and preserve every other gradient
  role and unrelated dirty hunk.
- Product outcome obtained: no runtime definition or consumer of `hito-canvas-atmosphere` or
  `canvas-grain` remains under `src/`; all Hito DS reference pages now use the existing semantic
  `bg-surface` page background; false foundations token/demo/copy references are removed.
- Root cause: after the accepted Stage 1 zero-Product/Admin-consumer proof, the rejected shared role
  remained live only through the outer Hito DS reference wrapper, its shared CSS definition/alias,
  and its foundations documentation.
- Files changed in Stage 2: `src/components/hito-ds/reference-page.tsx`,
  `src/styles/foundations.css`, `src/components/hito-ds/reference-foundations-page.tsx`, and this
  canonical item.
- New runtime artifacts: none.
- Preserved boundaries: auth-photo overlays, editorial/color-mix backgrounds, token values,
  Product/Admin source, shared primitives, `bg-background` showcase base composition, Figma, data,
  APIs, and unrelated dirty work were not changed.
- Lifecycle result: Stage 2 runtime retirement is implemented, but the item remains blocked rather
  than completed because the existing light-theme showcase-card override collapses the required
  surface/background contrast and is outside the authorized file list.

| Check                         | Scenario / environment                                                       | Result  | Evidence                                                                                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 2 before map            | Repository `src/` search before the edit                                     | Passed  | All remaining `hito-canvas-atmosphere` / `canvas-grain` occurrences were confined to the three authorized Design System files.                                                                                                    |
| Runtime retirement            | Repository `src/` search after the edit                                      | Passed  | Zero definitions or consumers remain for either retired selector.                                                                                                                                                                 |
| DS page composition           | `reference-page.tsx` source inspection                                       | Passed  | The outer reference page now uses `min-h-screen bg-surface text-foreground` with no replacement image, gradient, opacity, wrapper, or token.                                                                                      |
| Dead demo and copy            | Foundations reference source                                                 | Passed  | The false semantic entry, live specimen, instructional copy, and preview branch were removed; remaining overlay roles are unchanged.                                                                                              |
| Shared DS contract            | `npm run validate-hito-ds-components`                                        | Passed  | Validator exited 0 with the current shared component/foundation/reference contract.                                                                                                                                               |
| Formatting and lint           | Scoped Prettier and ESLint                                                   | Passed  | Prettier and ESLint exited 0 for the three implementation files.                                                                                                                                                                  |
| Diff hygiene                  | Scoped `git diff --check` and source diff review                             | Passed  | No whitespace error; only the assigned class swap and exact retired-role deletions were added to the pre-existing dirty files.                                                                                                    |
| Production build              | Uncontended local `npm run build`; explicit `npm run postbuild` confirmation | Passed  | Vite client, SSR, and Nitro compilation completed; postbuild exited 0. Existing dependency directive and large-chunk warnings remain warnings only.                                                                               |
| Managed browser readiness     | `npm run qa:server:status` after build                                       | Not run | No fresh managed runtime was available: status remained stopped with `artifactFreshness: stale` and `receipt_missing_or_invalid`. Browser theme/viewport, overflow, background-image, and console proof is therefore not claimed. |
| Two-theme page/card elevation | Current semantic token and showcase CSS source                               | Blocked | Dark uses page `surface` against card `background`; light currently assigns both page and card `surface`. Correcting the accepted card override requires the excluded `reference-workbench.css` seam.                             |

Stage 2 source retirement and Implementation DoD for the authorized files are satisfied. Overall
task completion, two-theme visual parity, browser acceptance, Global QA Acceptance, and release
readiness remain unclaimed.
