# Hito Shell Profile Trigger Neutral Chrome Rest Fill

## Work Item ID

2026-08-16-hito-shell-profile-trigger-opaque-background

## Status

completed

## Type

Bug

## Priority

high

## Owner

DESIGN SYSTEM

## Stage

Light-theme neutral-chrome remediation completed

## Next Recommended Role

PRODUCT

## Scope

shared-shell-profile-trigger

## Archive Intent

archive_when_closed

## Task

Make the profile trigger visibly distinct from its surrounding shell canvas in both themes by
reusing the existing neutral Chrome Subtle fill. Keep one shared shell recipe rather than adding a
`/settings`-only exception or changing the global Surface token.

## Dispatched Handoff Prompt — Surface Rest Fill

```text
ROLE: DESIGN SYSTEM

Task: Hito Shell Profile Trigger Surface Rest Fill
Mode: Lite

Canonical item:
docs/tasks/backlog/2026-08-16-hito-shell-profile-trigger-opaque-background.md

Product decision:
Apply the new Local Inspector item `a523b02c-8d2a-4463-a326-94c2c6ed7ed0`. On `/settings`, Dark,
1470x801, the selected `button#radix-*R_5qkq*` with stable class
`.hito-shell-profile-trigger` resolved its opaque Fill to Background (`--background`, `#0F0D0B`).
Ivan selected the lighter opaque Surface token (`--surface`, `#161312`) to restore the intended
rest-surface distinction. The captured scope was `Only here`, but source inspection proves that the
rest fill is one shared canonical Design System recipe; do not add a route-local override or use the
ephemeral Radix id.

Outcome:
Make the existing shared `.hito-shell-profile-trigger` rest fill resolve to the existing semantic
Surface token in Light and Dark, and reconcile only its existing DS assertion. Preserve one
consistent recipe across the selected Product control, the existing Admin consumer, and the two
contained `/hitoDS` consumers.

Preserve:
- observed text color, 12px padding/gaps, 10px radius, 1px transparent border, dimensions, avatar,
  hover, focus-visible, disabled, menu, responsive, and truncation behavior;
- AppShell and Admin component markup/state, the reference-only quiet-surface recipe, tokens,
  Product data, persistence, fixtures, dependencies, and unrelated dirty work;
- the completed Compound Range caller adoption and its historical receipt.

Do not add a token, literal color, component, helper, wrapper, compatibility path, route-specific
CSS, or runtime artifact. Reuse the existing selector and Surface token. Run focused formatting,
the existing DS assertion/validator path, and diff hygiene. Use an already admissible current local
artifact for a small `/settings` plus contained `/hitoDS` Light/Dark check only if it is immediately
available; otherwise record browser proof as deferred rather than starting a new runtime or Admin
authentication lifecycle.

Update this canonical item with a concise English Lite receipt. Return to PRODUCT if another owner,
consumer-specific exception, new Design System contract, or behavior change becomes necessary. Do
not claim Global QA, hosted, release, deployment, Admin authentication, or Figma acceptance.
```

## Scope Detail

The canonical `.hito-shell-profile-trigger` rest fill and its existing Product, Admin, and contained
`/hitoDS` consumers. The new report was captured on `/settings`; its ephemeral Radix id is evidence
only and is not an implementation selector. Compact this item after the superseding shared surface
contract and focused consumer replay are proven.

## User Report

Local Inspector batch `local_ui_inspector_batch_v1`, created `2026-08-16T03:58:23.298Z`, contains
item `a523b02c-8d2a-4463-a326-94c2c6ed7ed0`, captured on `/settings`, Dark, `1470×801`, page title
`User settings — Hito Running`. The selected control was `button#radix-*R_5qkq*` with stable Hito
class `hito-shell-profile-trigger`, three children, dimensions `207×62px`, and no captured text.

The item requested `Surface` (`--surface`, `#161312`, 100% alpha) for Fill instead of the observed
`Background` (`--background`, source `--stone-900`, `#0F0D0B`, 100% alpha). Text remains unchanged
at observed Custom (computed) `#F3F1EE`, 100% alpha. No typography or chrome change was requested.
The item recorded `12px` padding on every side, `12px` horizontal and vertical gap, `10px` radius on
all corners, and a `1px solid` border; none of those properties has a desired change.

The captured scope was `Only here`. Ivan clarified that the low-contrast rest surface must be fixed
at Design System level when the selected lighter semantic surface is the intended distinction.
Therefore the instance scope constrains the requested visual property, but does not authorize a
route-local override of a demonstrated shared canonical recipe.

## Source Investigation

`src/components/AppShell.tsx` renders the selected Product control. The stable shared
`.hito-shell-profile-trigger` selector in `src/styles/shell-admin-analytics.css` owns its rest
background and resolved it to `var(--color-background)` at intake. The same class is used by
`src/components/admin/AdminWorkspaceNav.tsx` and two contained App Shell examples in
`src/components/hito-ds/reference-components-structure.tsx`. The DS validator explicitly treats
that selector as the complete shell-profile chrome owner.

`src/styles/foundations.css` maps Dark Background to `--stone-900` (`oklch(0.16 0.005 60)`) and Dark
Surface to the lighter `--stone-850` (`oklch(0.19 0.005 60)`). Light Background maps to
`--linen-100` (`oklch(0.972 0.01 78)`) and Light Surface to the still lighter `--linen-50`
(`oklch(0.988 0.006 82)`). The earlier source-only assumption that Surface would create sufficient
separation was disproved by Ivan's Light screenshot. The existing Chrome Subtle fill is the
canonical neutral interactive-chrome role and already supplies visible distinction in comparable
fields, secondary buttons, shell rows, menus, and State Surface. No new token or recipe is needed.

## Required Outcome

- Rest fill is the existing semantic Chrome Subtle token in Light and Dark.
- Existing geometry, transparent border, hover, focus-visible ring, disabled state, menu behavior,
  avatar treatment, and responsive contained-shell behavior remain unchanged.
- All consumers of the one shared profile-trigger recipe agree; no `/settings`-only style override,
  new token, new component, or duplicate shell recipe is introduced.

## What Not To Touch

AppShell interaction/state, Dropdown menu semantics, text color, padding, gap, radius, border,
hover/focus/disabled behavior, the quiet-surface recipe, Product caller markup, unrelated Admin
chrome, local Inspector, persistence, fixtures, dependencies, Git lifecycle, or unrelated dirty
work. Do not reopen or modify the completed Compound Range caller adoption.

## Focused Proof

Run a proportional focused source/static check and verify the selected `/settings` instance plus
one contained `/hitoDS` consumer in Light and Dark when an admissible current local artifact is
already available. Confirm the computed rest fill resolves to Chrome Subtle, geometry and interaction
states remain unchanged, and no overflow or console error is introduced. Do not create an Admin
authentication or fixture workflow for this elementary shared-token correction; source-backed
consumer inheritance is sufficient if no existing authorized Admin session is immediately
available.

## Historical Handoff Prompt — Completed Background And Range Slice

```text
ROLE: FRONTEND (ds)

Task: Hito Shell Profile Trigger And Heart-Rate Range Label Adoption Batch
Mode: Lite

Canonical item:
docs/tasks/backlog/2026-08-16-hito-shell-profile-trigger-opaque-background.md

Outcome:
Make the shared `.hito-shell-profile-trigger` rest fill use the canonical opaque Background token,
not the current 42%-alpha surface mix. Treat `/progress?tab=plans` as the reported instance, but
preserve one consistent shared shell recipe across its actual Product, Admin, and `/hitoDS`
consumers.

Also adopt the now-completed optional-label `HitoCompoundRangeField` contract at its sole Product
caller by removing only `label="Range"` in
`src/components/settings/HeartRateProfileSection.tsx`. The visible label and its layout slot must
disappear; the primitive derives its existing accessible group name from lower/upper labels and unit.

Demonstrated source facts:
- The selected Product control is rendered by `src/components/AppShell.tsx`.
- Its rest chrome is owned by `.hito-shell-profile-trigger` in
  `src/styles/shell-admin-analytics.css`.
- The selector is also reused by Admin and two contained App Shell examples; the DS validator
  recognizes it as the complete owner of that chrome.

Scope and constraints:
- Reuse the existing selector and semantic Background token; make the smallest shared correction.
- Preserve border, radius, spacing, text, avatar, hover, focus-visible, disabled, menus,
  responsive behavior, and quiet-surface recipe.
- Do not change range values/validation/copy, the Compound Range primitive or `/hitoDS` labelled
  specimen, AppShell interaction/state, route behavior, persistence, fixtures, dependencies, Git
  lifecycle, or unrelated dirty work.
- Do not create a Progress-only override, token, component, helper, compatibility path, hidden
  label, local CSS workaround, or any other runtime artifact.

Focused proof:
- Prove computed opaque rest fill in Light/Dark on the reported Product instance, one Admin
  consumer, and one `/hitoDS` contained-shell consumer.
- Verify hover/focus, keyboard menu activation and Escape/focus return, containment, and console.
- Run proportional focused formatting/lint/DS contract validation and `git diff --check`.
- On the Heart Rate Settings route, verify the visible `Range` label is absent, group accessibility
  remains truthful, and range keyboard/error/disabled behavior is unchanged.

Return to PRODUCT before continuing if this needs a second production owner or the actual canonical
owner is DESIGN SYSTEM. Otherwise complete the Lite correction and update the canonical receipt.
```

## Implementation Receipt

### Task And Outcome

- **Mode:** Lite.
- **Outcome:** completed. The shared profile trigger now uses the opaque semantic Background token
  at rest, and the sole Product Heart Rate caller no longer supplies the redundant visible `Range`
  label.
- **Cause:** the shared shell selector still owned the superseded 42%-alpha rest recipe, while the
  Product caller still supplied a label that the completed optional-label primitive contract no
  longer required.
- **Reuse and deletion:** reused the existing `.hito-shell-profile-trigger` owner, its existing DS
  assertion, and the accepted `label?: string` primitive API. Removed the alpha recipe and one
  caller prop. No component, token, helper, override, compatibility path, or runtime artifact was
  added.

### Files Changed

- `src/styles/shell-admin-analytics.css` — changed only the shared rest background to
  `var(--color-background)`; hover, focus, border, radius, spacing, and disabled declarations remain
  unchanged.
- `scripts/validate-hito-ds-component-contracts.ts` — reconciled only the existing shell-profile
  background assertion. Concurrent unrelated validator hunks were preserved.
- `src/components/settings/HeartRateProfileSection.tsx` — removed only `label="Range"` from the
  existing `HitoCompoundRangeField` call.
- This canonical item — lifecycle and receipt only.

### Focused Validation

| Check                                   | Result                                                                          | Evidence                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator                    | Passed                                                                          | The shared selector resolves rest fill from `var(--color-background)`; the Product caller has no `label` prop; the labelled `/hitoDS` specimen remains unchanged.                                                                                                                            |
| Prettier                                | Passed                                                                          | Focused check over the three implementation files and this item.                                                                                                                                                                                                                             |
| ESLint                                  | Passed                                                                          | Focused check over `HeartRateProfileSection.tsx` and the DS validator.                                                                                                                                                                                                                       |
| Heart-rate Product proof script         | Passed                                                                          | `scripts/heart-rate-guidance-editor-proof.ts` completed successfully.                                                                                                                                                                                                                        |
| Diff hygiene                            | Passed                                                                          | Focused `git diff --check` reported no errors.                                                                                                                                                                                                                                               |
| DS contract validator                   | Passed for the changed assertions; repository command remains red outside scope | The shell-profile and optional-label assertions produced no failure. The command exits on the unrelated current-document requirement: `Current product, system, and state docs must record the production-shipped /hitoDS role.` No unrelated documentation was changed.                     |
| Production build                        | Passed                                                                          | One canonical managed build completed before the later Product instruction to stop additional runtime work.                                                                                                                                                                                  |
| Product profile trigger                 | Passed                                                                          | Fresh local `qa_fixture`, `/progress?tab=plans`, 1470x801 Light/Dark: computed rest fill matched the opaque Background token, existing transparent border and hover remained, keyboard Enter opened the menu, Escape returned focus with the existing ring, and page width stayed contained. |
| Contained App Shell                     | Passed                                                                          | Fresh local `qa_fixture`, `/hitoDS/patterns#app-shell`: desktop Light/Dark and 375x812 Dark resolved the same opaque rest fill; the narrow 32px control and page remained contained.                                                                                                         |
| Product Range caller browser state      | Deferred                                                                        | The existing `qa-baseline` local account had no saved age, so the Product zone editor did not instantiate. Source, primitive accessibility ownership, and the focused Product proof script passed; no fixture or persistence state was changed to manufacture the missing state.             |
| Admin consumer and broad console matrix | Deferred by Product scope correction                                            | Shared-selector inheritance is source-proven. Product explicitly stopped Admin authentication/session setup and broader browser work for this elementary fix.                                                                                                                                |

### Boundaries And Handoff

- Product/Admin/App Shell behavior, primitive implementation, labelled `/hitoDS` Compound Range
  specimen, persistence, fixtures, dependencies, and unrelated dirty work were preserved.
- The local login created only a browser session for the existing `qa-baseline` account; no profile,
  fixture, provider, or hosted data was mutated.
- This is focused local implementation evidence, not Global QA, hosted, release, deployment, or
  Figma acceptance.
- **Next owner:** PRODUCT.
- **Blockers:** none for the admitted elementary source correction. Deferred browser states remain
  an acceptance-coverage boundary only.

Role file: `agents/frontend.agent.md`
Skills used: `hito-frontend-design-system`, `hito-qa-browser-regression`, `agent-browser`
Subagents: none

## Light Theme Visual Correction — Tracked Preflight

Ivan's Light-theme screenshot demonstrates that the completed Surface-token correction does not
meet the intended visible rest-surface distinction: the profile trigger and its surrounding shell
canvas appear effectively continuous. This supersedes only the Surface rest-fill choice; the
completed Compound Range caller adoption remains out of scope.

- **Mode:** promoted from Lite to Tracked because the earlier visual proof was deferred and the
  failed Light result changes the accepted semantic mapping across the shared Product, Admin, and
  `/hitoDS` consumer set.
- **First incorrect owner:** `.hito-shell-profile-trigger` in
  `src/styles/shell-admin-analytics.css`; consumer markup and the global Surface token are not the
  cause.
- **Existing seam and smallest change:** reuse `var(--color-chrome-subtle)` as the rest fill in the
  existing shared selector and reconcile its existing DS assertion. Chrome Subtle already owns
  neutral interactive fill for fields, secondary buttons, active shell rows, menu states, and State
  Surface.
- **New runtime artifacts:** none.
- **Superseded responsibility removed:** the ineffective Surface-token rest binding. No token,
  component, helper, wrapper, route override, compatibility path, or broad consumer migration is
  admitted.
- **Preserved boundaries:** geometry, text, border, avatar, hover, focus-visible, disabled, menu,
  responsive and truncation behavior; Product/Admin markup and state; global Surface semantics;
  the reference-only quiet-surface recipe; Compound Range; unrelated dirty work.
- **Proof inventory:** exact source ownership and four-consumer census; focused formatting, ESLint,
  DS assertion, and diff hygiene; then a fresh Light/Dark Product and contained `/hitoDS` browser
  replay at desktop and exact 375px when the shared runtime is uncontended.
- **Stop condition:** return to PRODUCT if the neutral chrome recipe fails visual proof, a
  consumer-specific exception is required, or another canonical owner must change.

## Light Theme Neutral Chrome Implementation Receipt

### Task, Cause, And Outcome

- **Mode:** Tracked continuation of the existing canonical bug.
- **Outcome:** completed. The shared `.hito-shell-profile-trigger` rest state now reuses
  `var(--color-chrome-subtle)`, producing a visible neutral interactive surface in Light and Dark
  across the existing Product, Admin, and contained `/hitoDS` consumers.
- **Demonstrated cause:** Ivan's Light screenshot proved that Surface and the surrounding shell
  canvas were visually indistinguishable. Source inspection showed that Light Surface is lighter
  than Background, so the previous semantic choice could not create the requested neutral control
  distinction.
- **Root owner and reuse:** the shared shell selector remains the only rest-chrome owner. Chrome
  Subtle is the existing fill contract already reused by fields, secondary buttons, active shell
  rows, menu states, and State Surface. No global token, consumer markup, or route override changed.
- **Removed responsibility:** the ineffective Surface-token binding and its old assertion were
  replaced in place. No new token, literal, component, helper, wrapper, compatibility path, or
  runtime artifact was added.

### Files Changed

- `src/styles/shell-admin-analytics.css` — changed only the shared profile-trigger rest fill to
  `var(--color-chrome-subtle)`.
- `scripts/validate-hito-ds-component-contracts.ts` — reconciled only the existing shell-profile
  background assertion; unrelated concurrent hunks remain preserved.
- This canonical item — Tracked preflight, lifecycle, and receipt.
- `qa-artifacts/screenshots/2026-08-16/hito-shell-profile-trigger-neutral-chrome/` — focused visual
  evidence only.

### Validation Inventory

| Check                                     | Scenario / environment                             | Result                                                                        | Evidence                                                                                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner and reachability                    | Shared source census                               | Passed                                                                        | One canonical CSS owner serves one Product trigger, one Admin trigger, and two contained `/hitoDS` triggers. The reference-only narrow rule changes width/padding only.                                                                             |
| Neutral chrome reuse                      | Source and generated token contract                | Passed                                                                        | Rest fill and the existing validator assertion both resolve to `var(--color-chrome-subtle)`; the token remains an existing fill-only semantic role used by comparable neutral interactive chrome.                                                   |
| Prettier                                  | Focused changed files                              | Passed                                                                        | CSS owner, validator, and canonical item use repository formatting.                                                                                                                                                                                 |
| ESLint                                    | Existing TypeScript validator                      | Passed                                                                        | No focused lint error.                                                                                                                                                                                                                              |
| DS validator                              | Full repository command                            | Passed for the changed contract; repository command remains red outside scope | The shell-profile assertion produced no failure. The command still exits only on the unrelated current-document requirement: `Current product, system, and state docs must record the production-shipped /hitoDS role.`                             |
| Production build and managed runtime      | Canonical loopback                                 | Passed                                                                        | One uncontended build completed; the public browser matrix ran while the managed loopback was healthy and fresh with `receipt_matches`.                                                                                                             |
| Final runtime freshness                   | After terminal receipt update                      | External integration gap                                                      | The managed process remained healthy, compatible, and loopback-only, but the task-document update changed the private Admin snapshot digest and status became `stale / artifact_missing`. No second rebuild was run merely to absorb receipt bytes. |
| Desktop visual contract                   | `/hitoDS/patterns#app-shell`, 1470x801, Light/Dark | Passed                                                                        | The visible profile surface resolved to Chrome Subtle against a distinct parent canvas; 12px padding/gap, 10px radius, 1px transparent border, and 62px height remained intact.                                                                     |
| Responsive visual contract                | Same route, exact 375x812, Light/Dark              | Passed                                                                        | The contained 32x32 profile control retained the same Chrome Subtle contract and stayed within a 375px document width.                                                                                                                              |
| Interaction                               | Desktop contained shell                            | Passed                                                                        | Hover remained available without geometry change; keyboard Enter opened the menu, Escape closed it and restored trigger focus, and the settled focus ring remained 2px.                                                                             |
| Console and containment                   | Entire focused browser matrix                      | Passed                                                                        | No warning/error console events; document `scrollWidth` equalled viewport width at desktop and mobile.                                                                                                                                              |
| Authenticated Product/Admin visual replay | Not run                                            | Omitted by external-state boundary                                            | The managed runtime used `providerMode: real`; only the public `/hitoDS` route was opened. Product/Admin inheritance is source-proven through the single shared selector, but no authenticated or hosted data was accessed.                         |
| Diff hygiene                              | Focused task paths                                 | Passed                                                                        | `git diff --check` reported no errors.                                                                                                                                                                                                              |

### Boundaries And Handoff

- Product/Admin markup, state, menus, persistence, and data were untouched. Text, avatar, geometry,
  border, hover, focus-visible, disabled, responsive, and truncation rules were preserved.
- The completed Compound Range caller adoption and all unrelated dirty work remain unchanged.
- Architecture review constrained “similar places” to reuse of the existing neutral-chrome contract
  and the four profile-trigger consumers; no speculative broad repaint was introduced.
- This is focused local implementation evidence, not Global QA, hosted, release, deployment,
  Admin-authentication, or Figma acceptance.
- **Next owner:** PRODUCT.
- **Blockers:** none for the shared source correction. Authenticated Product/Admin rendering remains
  an explicit coverage boundary.

Role file: `agents/design-system.agent.md`
Skills used: `hito-frontend-design-system`, `hito-architecture-audit`,
`hito-qa-browser-regression`, `control-in-app-browser`
Task artifact: this canonical item
Subagents: none

## Historical Product Routing Amendment — Surface Rest Fill

The new Inspector item supersedes only the completed slice's Background-token decision. The prior
Compound Range caller adoption remains completed and out of scope. The stable class and source
census provide positive source-backed Design System ownership; the ephemeral Radix id must not be
used as an implementation selector.

At that stage this remained Lite: one accepted semantic-token decision, one shared canonical
selector, its existing assertion, and focused proof. Ivan's later Light screenshot superseded that
assumption and promoted the continuation through the Tracked preflight above.

## Historical Surface Rest Fill Implementation Receipt

### Task And Outcome

- **Mode:** Lite.
- **Outcome:** completed. The shared `.hito-shell-profile-trigger` now uses the existing opaque
  semantic Surface token at rest across Product, Admin, and contained `/hitoDS` consumers.
- **Decision and cause:** Local Inspector item `a523b02c-8d2a-4463-a326-94c2c6ed7ed0` selected
  Surface for the `/settings` trigger. Source inspection confirmed that the shared selector, not the
  ephemeral Radix id or a route-local rule, is the canonical owner.
- **Reuse and deletion:** reused `var(--color-surface)` and the existing shell-profile assertion;
  removed the superseded Background-token binding. No token, literal, component, helper, wrapper,
  override, compatibility path, or runtime artifact was added.

### Files Changed

- `src/styles/shell-admin-analytics.css` — changed only the shared rest background from
  `var(--color-background)` to `var(--color-surface)`.
- `scripts/validate-hito-ds-component-contracts.ts` — reconciled only the existing shell-profile
  background assertion; unrelated concurrent validator hunks were preserved.
- This canonical item — terminal lifecycle and receipt only.

### Focused Validation

| Check                 | Result                                                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator  | Passed                                                                        | The shared selector and its existing assertion both resolve the rest fill to `var(--color-surface)`; the four-consumer shared ownership remains unchanged.                                                                                                                                                                                                              |
| Prettier              | Passed                                                                        | Focused check over the CSS owner, validator, and this canonical item.                                                                                                                                                                                                                                                                                                   |
| ESLint                | Passed                                                                        | Focused check over the existing TypeScript validator.                                                                                                                                                                                                                                                                                                                   |
| DS contract assertion | Passed for the changed contract; repository command remains red outside scope | The shell-profile assertion produced no failure. The command still exits on the unrelated current-document requirement: `Current product, system, and state docs must record the production-shipped /hitoDS role.`                                                                                                                                                      |
| Diff hygiene          | Passed                                                                        | Focused `git diff --check` reported no errors.                                                                                                                                                                                                                                                                                                                          |
| Browser proof         | Deferred by task boundary                                                     | Read-only `qa:server:status` reported a healthy loopback `qa_fixture` process but `stale`, `build: broken`, and `artifact_missing`, so it was not admissible for the changed source. Per the Lite instruction, no build, server restart, fixture work, or Admin-authentication lifecycle was started. The prior Background rendering is not reused as Surface evidence. |

### Boundaries And Handoff

- Text, padding, gaps, radius, transparent border, dimensions, avatar, hover, focus-visible,
  disabled, menu, responsive, and truncation contracts were unchanged.
- Product/Admin component markup and behavior, the completed Compound Range caller adoption,
  tokens, fixtures, dependencies, and unrelated dirty work were preserved.
- This is focused local implementation evidence, not Global QA, hosted, release, deployment,
  Admin-authentication, or Figma acceptance.
- **Next owner:** PRODUCT.
- **Blockers:** none for the admitted source correction. Browser rendering remains an explicit
  deferred acceptance boundary.

Role file: `agents/design-system.agent.md`
Skill used: `hito-frontend-design-system`
Task artifact: this canonical item
Subagents: none
