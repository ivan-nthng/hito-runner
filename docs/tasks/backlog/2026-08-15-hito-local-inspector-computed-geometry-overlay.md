# Hito Local Inspector Computed Geometry Overlay — 2026-08-15

## Work Item ID

2026-08-15-hito-local-inspector-computed-geometry-overlay

## Status

completed

## Type

Tracked — DevTools interaction and visual-evidence contract

## Priority

high

## Owner

FRONTEND

## Epic

platform-and-operations

## Frontend Lane

DevTools

## Scope

The loopback-only Local Inspector selection/hover overlay and its existing computed-style evidence seam. It does not alter inspected application DOM, Hito Design System tokens, or generated Inspector task payloads.

## Archive Intent

Compact terminal closeout after browser proof.

## Task

Make Inspector geometry truthful at selection and hover. The outer highlight must use the selected element's actual computed four-corner radius rather than the Inspector's fixed `rounded-md`. Separately visualize the element's real padding, safely drawable margin, and actual flex/grid gaps, without claiming spacing that the browser layout does not create.

## User Report

Ivan cannot tell whether the uniform overlay corner radius represents the selected component. He asked for the highlight to match the component radius and, as in Chrome Inspector, for padding, margin, and gaps to be independently visible.

## Demonstrated Cause

- `InspectorHighlight` in `src/components/devtools/LocalUiInspector.tsx` receives only a `DOMRect` and always renders `rounded-md`.
- The same Inspector already reads computed four-corner radius, four paddings, row gap, and column gap through `inspectLocalUiTarget()` in `src/components/devtools/local-ui-inspector-targets.ts`.
- It currently does not read computed margins or establish whether a margin produces a safely drawable outside region.
- The available radius/padding/gap evidence is shown in the composer but is not passed to the fixed overlay, which causes the mismatch.

## Expected Behavior

- Bounds outline follows all computed corners, including asymmetric radii.
- Padding is separately visible as actual inset geometry inside the target border box, accounting for border widths.
- Margins are exposed as the four computed values and as a distinct outside region only when that region is geometrically unambiguous. Collapsed, `auto`, negative, overlapping, or otherwise non-drawable margins must be labelled truthfully rather than painted as a false box-model band.
- Gap is drawn only for verified empty intervals created by flex/grid layout between direct children. Normal block flow, wrapped/overlapping/positioned children, or ambiguous geometry must not produce a fake gap overlay.
- Hover and selected states agree, remain pointer-events-none, and do not affect element selection, scrolling, focus, capture, local Inspector persistence, or payload content.

## What Not To Touch

Product/DS component CSS, tokens, source target resolution, Inspector task schema/persistence, screenshot capture behavior, browser data, Figma, hosted state, and Git lifecycle. Do not add a live CSS editor, arbitrary style mutation, or a generic layout-analysis framework.

## Validation Expectations

Use real loopback elements with non-default and asymmetric/specified corner geometry, drawable and non-drawable margin cases, plus flex/grid targets. Prove radius fidelity, padding bounds, truthful margin readback/region eligibility, actual-gap-only behavior, hover/selection parity, pointer-event pass-through, no target-selection regression, Light/Dark desktop/mobile containment, no console error, focused Prettier/ESLint, relevant Inspector validation, and `git diff --check`.

## Stage

FRONTEND DevTools computed-geometry overlay implementation completed

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Local Inspector Computed Geometry Overlay
Mode: Tracked
Frontend lane: DevTools
Canonical item: docs/tasks/backlog/2026-08-15-hito-local-inspector-computed-geometry-overlay.md

This task is active. Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md. Re-check the item, dirty files, runtime owner, and existing Inspector seams before writing.

Correct the demonstrated overlay mismatch in `LocalUiInspector.tsx`: `InspectorHighlight` currently uses a fixed rounded-md box while Inspector evidence already reads computed per-corner radius, padding, and gaps. Reuse that evidence or the narrowest existing computed-style seam so bounds match the selected element's four computed radii.

Separately render actual padding insets, safely drawable margin regions, and actual flex/grid gaps. Read all four computed margins, but paint an outside margin band only when its geometry is unambiguous; visibly disclose non-drawable `auto`, collapsed, negative, or overlapping margins without inventing a region. Account for borders; mark only gap regions proven by direct-child geometry. Do not draw a gap for normal block flow, ambiguous wrapping/overlap, positioned children, or an unverified inference. Preserve hit-layer selection, panel positioning, pointer-event pass-through, local draft persistence, capture behavior, task payloads, and all application DOM/styles.

Do not add tokens, a live style editor, a generic layout engine, fixtures, product changes, DS CSS changes, Figma/hosted actions, staging, commit, push, or deployment. You may use QA as an existing named read-only role only for an independent browser review if it materially improves evidence; do not delegate implementation.

Validate radius, padding, margin, and gap truthfulness on real loopback elements; selected/hover parity; no target-selection or focus regression; Light/Dark desktop/mobile containment and console health; plus focused Inspector checks, Prettier, ESLint, and diff hygiene. Return an English tracked receipt with files changed and any geometry explicitly not visualized because it is ambiguous. Do not claim Global QA or release readiness.
```

## Frontend Execution Preflight — 2026-08-17

- **Mode and owner:** Tracked FRONTEND implementation in the loopback-only DevTools lane. The first
  incorrect owner remains the local overlay/evidence seam; Product, Design System, Backend, and
  Inspector payload ownership are read-only.
- **Current source discriminator:** `LocalUiInspector` stores hover as a `DOMRectReadOnly`, stores
  selection with only a live rect, and `InspectorHighlight` always applies `rounded-md`.
  `local-ui-inspector-targets.ts` already owns computed radius, padding, border, and gap reads but
  has no transient overlay geometry or margin eligibility result.
- **Existing seams reused:** extend the existing computed-style target inspection module with one
  transient overlay snapshot, then pass it through the existing hover/selected state to the current
  `InspectorHighlight`. Strip the snapshot with the existing live-target fields before any draft or
  payload serialization.
- **New runtime artifacts:** none. No file, component, wrapper, CSS recipe, token, fixture, state
  layer, persistence shape, schema, dependency, validator family, or compatibility model is added.
- **Obsolete responsibility removed:** replace rect-only hover state and the fixed-radius overlay.
  Preserve the current hit layer, portal, panel, focus isolation, scrolling lock, screenshot flow,
  draft/session behavior, selector resolution, and application DOM/styles.
- **Geometry policy:** paint border-aware padding; paint positive margin strips only when normal-flow
  flex/grid item geometry is non-auto, non-negative, and non-overlapping; paint only measured empty
  direct-child flex/grid intervals that agree with the computed gap. Ambiguous margin/gap cases get
  visible factual disclosure and no invented band.
- **Proof inventory:** focused source checks and Inspector validators; a fresh managed loopback
  browser replay for asymmetric radius, padding, drawable and non-drawable margin, verified flex/grid
  gap and block/wrap/overlap/positioned negatives; hover/selection parity, pass-through selection,
  focus, desktop/mobile Light/Dark containment, console health, Prettier, ESLint, and diff hygiene.
- **Return boundary:** stop and return to PRODUCT if truthful rendering requires shared DS CSS/token,
  Product target changes, persisted/payload geometry, a generic layout engine, or another production
  owner.

## Browser Path Preflight — 2026-08-17

- **Validation layer:** focused Frontend Implementation DoD for the loopback Inspector overlay; not
  Global QA, hosted, release, deployment, Figma, or production acceptance.
- **Runtime admission:** the one serialized managed build completed and PID 29950 is healthy,
  loopback-only, `qa_fixture`, `artifactFreshness: fresh`, and `receipt_matches` at
  `http://127.0.0.1:3000`.
- **Browser/data boundary:** use the supported in-app browser on real rendered loopback elements.
  Enable only the existing origin-scoped Inspector toggle; do not create fixture accounts, mutate
  Product data, inject test DOM/styles, use a personal session, or access hosted state.
- **Matrix:** desktop and exact 375x812 in Light/Dark. Inspect existing asymmetric-radius,
  border/padding, safe positive-margin, auto/negative/collapsible/overlap margin, flex/grid gap, and
  block/wrap/overlap/positioned negative examples where the current app exposes them. Compare hover
  and Pencil selection geometry/data attributes, pointer pass-through, focus/exit, panel
  containment, page overflow, and console health.
- **Evidence rule:** do not fabricate a case that the current rendered application does not expose.
  Any required negative discriminator unavailable without Product/DS/fixture mutation remains a
  named coverage gap rather than an invented DOM outcome.

## Tracked Frontend Implementation Receipt — 2026-08-17

### Task And Stage

- **Task:** Hito Local Inspector Computed Geometry Overlay.
- **Stage:** FRONTEND DevTools computed-geometry overlay implementation completed.
- **Implementation layer:** focused loopback-only Frontend Implementation DoD. Global QA, hosted,
  release, deployment, Figma, and production acceptance remain unclaimed.

### Product Outcome And Demonstrated Cause

`InspectorHighlight` no longer turns every target into one fixed `rounded-md` rectangle. Hover and
Pencil selection now share one transient computed-geometry snapshot: the outline receives all four
computed radii, padding is painted inside the border box, drawable margin strips remain outside the
target, verified direct-child flex/grid intervals receive a distinct gap layer, and a compact
readback exposes the four radius, padding, margin, and gap values plus the reason for every omitted
region.

The demonstrated first incorrect owner was the existing DevTools overlay/evidence seam: hover stored
only a `DOMRect`, selected targets carried only a live rect, and the renderer supplied a fixed
radius. The existing target-inspection module now owns the narrow transient geometry calculation;
the existing Inspector renderer remains the only overlay owner.

### Files Changed

- `src/components/devtools/LocalUiInspector.tsx` — replaced rect-only hover/highlight composition,
  rendered separate bounds/padding/margin/gap layers and factual readback, refreshed live geometry
  for duplicate/edit selection, and explicitly stripped geometry before draft/payload serialization.
- `src/components/devtools/local-ui-inspector-targets.ts` — added the transient computed geometry,
  matched authored `auto` margin disclosure, border-aware padding regions, conservative margin
  eligibility, and measured direct-child flex/grid interval verification.
- `docs/tasks/backlog/2026-08-15-hito-local-inspector-computed-geometry-overlay.md` — recorded
  preflight, browser path, validation, coverage limits, and terminal lifecycle truth.

New production/runtime artifacts: **none**. No component, file, CSS recipe, token, state layer,
persistence shape, payload field, fixture, dependency, compatibility path, or generic layout API was
introduced. The obsolete rect-only hover responsibility and fixed-radius highlight were removed.

### Geometry Deliberately Not Painted

- Margin bands are omitted and labelled when a side is authored `auto`, any side is negative or
  unresolved, block-flow margins may collapse/combine, a positive outside region intersects a
  sibling, or the item is positioned/non-translation-transformed.
- Gap bands are omitted and labelled for normal block flow, wrapped flex lines, fewer than two
  visible direct children, positioned direct children, auto/negative child margins, unsafe
  transforms, or measured intervals that do not equal the computed flex/grid gap.
- Grid bands are pair-bounded to the actual shared row/column extent. No full-container band is
  inferred from a gap value alone.

### Validation Inventory

| Check                        | Scenario / environment                                                           | Result               | Evidence                                                                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bounds radius                | `/admin/login`, real password reveal button, Dark desktop                        | Passed               | Hover and selected bounds equalled the 48x44 target and retained computed `0px 6px 6px 0px` corners; the password control was not activated through the hit layer.                                   |
| Border-aware padding         | `/admin/login`, identifier field with 1px border and 16px inline padding         | Passed               | Hover and selection produced left/right 16px regions inset 1px from each border and 42px high inside the 44px border box.                                                                            |
| Drawable margin              | `/hitoDS/components`, real list-copy flex item                                   | Passed               | One 4px top strip was painted outside the target; hover and selected status remained `drawable`.                                                                                                     |
| Non-drawable margins         | Real `mx-auto` header, block-flow kicker, and simple-tab button                  | Passed               | Resolved `29px (auto)` sides, collapsible 8px block margin, and `-1px` tab margin were disclosed as ambiguous with zero margin regions.                                                              |
| Verified flex gap            | `/hitoDS/components`, header controls nowrap flex                                | Passed               | Exactly one measured 8px empty direct-child interval was painted; hover and selection agreed.                                                                                                        |
| Verified grid gap            | `/hitoDS/components`, 2-column/second-row definition grid                        | Passed               | One 12px column interval and two pair-bounded 12px row intervals were painted without crossing child boxes.                                                                                          |
| Gap negatives                | Block field, wrapped reference links, and simple tabs with negative child margin | Passed               | Block flow, wrap, and negative-child cases each produced factual omission text and zero gap regions.                                                                                                 |
| Selection/focus/pass-through | Desktop Pencil hit layer and exact 375x812 sheet                                 | Passed               | Selection focused the existing Inspector heading, Escape returned focus to the Pencil exit control, overlays stayed `pointer-events:none`, and inspected controls/navigation were not activated.     |
| Responsive themes            | 1470x801 and exact 375x812, Light and Dark                                       | Passed               | Bounds/readback and the mobile sheet remained inside the viewport; document/body width equalled viewport width with no page-level overflow.                                                          |
| Console                      | Focused desktop/mobile route replay                                              | Passed               | Browser diagnostic log remained empty.                                                                                                                                                               |
| Formatting/lint/types/diff   | Task-owned files                                                                 | Passed               | Prettier check, focused ESLint, touched-file TypeScript filtering, and `git diff --check` were clean.                                                                                                |
| Production build/runtime     | Managed `qa_fixture`                                                             | Passed               | Production build completed; PID 32568 was healthy, loopback-only, `artifactFreshness: fresh`, and `receipt_matches` for the final source at evidence time.                                           |
| Hito DS validator            | Checkout-wide `validate-hito-ds-components`                                      | Blocked outside task | The only failure is the pre-existing documentation gate: current product/system/state docs do not record the production-shipped `/hitoDS` role. No Inspector geometry contract failure was reported. |

### Omitted-Proof Consequences

- The rendered checkout exposed no selectable positive-margin target whose outside strip overlapped a
  sibling, and no visible flex/grid target with a positioned direct child. Those two conservative
  source branches were retained but were not claimed as browser-accepted; creating them would have
  required forbidden Product/Design-System DOM or fixture mutation.
- Checkout-wide TypeScript diagnostics still contain unrelated existing errors; the task-owned file
  filter is clean. The separate Hito DS documentation validator remains red as recorded above.
- After the final receipt-matching browser evidence, PID 32568 remained healthy and running but the
  managed status drifted to `stale/artifact_missing` because the private Admin repository snapshot
  marker digest changed outside this task. The accepted build/browser evidence predates that drift;
  this Frontend slice did not rebuild over a foreign owner a fourth time.
- No independent QA subagent was used; the primary Frontend replay exercised the focused matrix. No
  Global QA acceptance is claimed.

### Preserved Boundaries And Next Owner

Hit-layer resolution, ordinary link/control behavior, portal and panel placement, scrolling,
focus/Escape, local drafts, duplicate identity, screenshot capture, task payload schema, and the
inspected application's DOM/styles remain unchanged. Product, Design System, Backend, fixtures,
Figma, hosted state, dependencies, and Git lifecycle were not modified.

Frontend DevTools implementation is complete. Return to **PRODUCT** for any independent acceptance
or successor decision.
