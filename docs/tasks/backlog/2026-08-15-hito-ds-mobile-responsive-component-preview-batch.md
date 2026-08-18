# Hito DS Responsive State Surface Preview And Navigation Card Batch — 2026-08-15

## Work Item ID

2026-08-15-hito-ds-mobile-responsive-component-preview-batch

## Status

completed

## Type

Tracked — Design System responsive/reference component batch

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Scope

`/hitoDS` canonical component CSS, primitives, and reference specimens only. This batch has two independent Design System slices: responsive State Surface preview and the new canonical Navigation Card. Product-route adoption remains a separate FRONTEND / Product task.

## Archive Intent

Compact terminal closeout after implementation and focused browser proof.

## Task

1. Give State Surface an explicit right-panel `Desktop` / `Mobile` preview where narrow geometry materially differs. The preview must show the same responsive contract that a real narrow viewport applies; it must not reinterpret a semantic component size as a viewport choice.

2. Establish a canonical Hito Navigation Card and physical `/hitoDS` reference from the existing Workout previous/next card. Its arrow affordance is icon-only: it has no separate arrow background or border. The card itself remains the one native interactive control.

## User Report

On `/hitoDS/patterns` in Light at `1470×801`, the selected `article.hito-state-surface.w-full.max-w-2xl` has no Desktop/Mobile selector. Ivan expects a desktop and mobile card representation: on a small screen, its padding becomes `12px` using the Hito token. Inspector item `78275a28-fd7b-4907-9e80-37808ae04067`, captured `2026-08-15T12:13:12.933Z`; selector `article.hito-state-surface.w-full.max-w-2xl`.

## Evidence And Observed Behavior

- Current State Surface reference controls expose only `Tone`, semantic `Size`, and `Actions`.
- `lg` is the default State Surface reference size and applies `--space-6` (`24px`) at every viewport.
- `sm` applies `--space-3` (`12px`), but it is a semantic size, not a mobile override.
- Existing Desktop/Mobile preview support is local to explicitly modelled specimens such as the contained App Shell; it is not a generic State Surface capability.
- `hito-nav-card` has exactly one current Product consumer: the previous/next Workout link in `src/routes/workout.$date.tsx`.
- Its local CSS is in `src/styles/calendar-state-surfaces.css`: the card has its own border/chrome, while `.hito-nav-card-arrow` separately creates a 28px bordered, filled arrow box. The Inspector request concerns this arrow-box chrome, not removal of the card's link semantics or focus state.

## Expected Behavior

- At the existing narrow Hito breakpoint, State Surface padding is `--space-3` (`12px`) regardless of its semantic `sm` / `md` / `lg` choice.
- Its right properties panel includes a `Desktop` / `Mobile` selector that previews the real responsive geometry without changing Tone, semantic Size, or Actions.
- Desktop dimensions remain unchanged. The selector and real `375px`/`320px` views agree.
- A canonical Navigation Card is physically documented in `/hitoDS` with previous/next direction, date, label, title, hover and focus behavior. The arrow is rendered as an icon with no local background/border in rest or hover. The whole card remains the clickable native anchor and owns focus-visible treatment.

## Source Investigation

- [State Surface CSS](../../../src/styles/overlays-feedback.css) defines only `data-size` padding; no narrow State Surface rule exists.
- [State Surface reference](../../../src/components/hito-ds/reference-patterns-page.tsx) owns the current demo and its three controls.
- [Playground](../../../src/components/hito-ds/playground.tsx) has no generic viewport-control contract.
- [Workout route](../../../src/routes/workout.$date.tsx) is the current single Product caller of `hito-nav-card`; its adoption must be routed to FRONTEND / Product after this DS slice. Do not edit that route in this task.

## Likely Root Cause

The completed mobile reference work compacted shared page layout and introduced preview controls only for individually modelled specimens. State Surface was excluded, so `lg` remains 24px and the reference cannot demonstrate its mobile geometry. Separately, Navigation Card is a single route-local recipe, so it has no DS reference or reusable canonical owner yet.

## What Not To Touch

- Do not change State Surface semantic tone meaning, flat semantic treatment, `sm` / `md` / `lg` API, Product/Admin consumers, global typography roles, or desktop geometry.
- Do not edit `src/routes/workout.$date.tsx`, its destinations, card-level focus/hover contract, or Product CSS. Do not delete the current local recipe until FRONTEND / Product adopts a canonical component.
- Do not add a second breakpoint, token scale, generic preview framework, route-level workaround, duplicate arrow control, or non-native navigation behavior.

## Validation Expectations

For State Surface, prove the CSS and preview-control contract together at desktop, `375px`, and `320px` in Light/Dark; verify `12px` narrow padding, preserved desktop geometry, selector keyboard behavior, zero horizontal overflow, console health, full DS validator, focused formatting/lint, and diff hygiene.

For Navigation Card, prove source ownership before adding a primitive; reuse an existing primitive if it truthfully fits, otherwise add only the smallest canonical component and its physical `/hitoDS` reference. Verify native anchor navigation, previous/next layout, icon-only arrows, hover/focus-visible, desktop/mobile containment, keyboard use, console health, and no Product-route mutation. Return FRONTEND / Product as the successor for migration of the current Workout caller.

## Stage

Design System implementation complete; Product adoption pending.

## Execution Preflight — 2026-08-15

- **Outcome and source discriminator:** `src/styles/overlays-feedback.css` is the shared owner of
  the explicit `sm` / `md` / `lg` State Surface geometry, while
  `src/components/hito-ds/reference-patterns-page.tsx` owns the selected reference and its existing
  Tone, Size, and Actions controls. Current source has no narrow rule. The only explicit runtime
  `data-size` adopters are Design System references; current Product/Admin callers omit the
  attribute, so a narrow rule scoped to the three explicit sizes preserves their current geometry.
- **Existing seam and smallest change:** reuse the existing `639px` narrow composition boundary,
  set only explicitly sized State Surfaces to `--space-3`, and add a separate controlled
  Desktop/Mobile reference choice that previews the same padding without changing Tone, semantic
  Size, or Actions. No generic viewport framework is introduced.
- **Navigation ownership census:** the only current `hito-nav-card` consumer is the local
  `NavCard` in `src/routes/workout.$date.tsx`, with its Product CSS in
  `src/styles/calendar-state-surfaces.css`. Existing Hito Button, Reference Link, shell-navigation,
  and launch-surface contracts do not represent a native multiline previous/next link carrying
  direction, date, label, and title. A smallest shared `HitoNavigationCard` primitive is therefore
  justified; the Product route and local recipe remain byte-stable pending FRONTEND / Product
  adoption.
- **New runtime artifacts:** one file,
  `src/components/ui/hito-navigation-card.tsx`, owning only the shared native-anchor anatomy and
  existing-token composition. No new CSS file, helper, token, registry, breakpoint, preview
  framework, or compatibility path.
- **Superseded responsibility:** the State Surface reference loses its inability to preview narrow
  geometry; the new shared primitive renders arrows as bare decorative icons, so it does not carry
  the route-local arrow-box border/background responsibility. The existing Product implementation
  is deliberately retained until its separate owner adopts the primitive.
- **Dirty/runtime boundary:** all admitted runtime/source files were clean before the first write;
  unrelated backlog work is preserved. The managed `qa_fixture` process was healthy but its build
  artifact was stale (`artifact_missing`), and no other role owned runtime lifecycle, so this task
  may perform one fresh managed build/replay only after source/static validation is stable.
- **Promotion/stop condition:** return to PRODUCT if implementation requires a Product-route edit,
  Product-local CSS deletion, a second breakpoint/token, a generic viewport abstraction, or another
  production owner. None is currently demonstrated.

## Next Recommended Role

FRONTEND

## Tracked Implementation Receipt — 2026-08-15

### Task And Stage

- **Task:** Hito DS Responsive State Surface Preview And Navigation Card Batch.
- **Stage:** shared Design System implementation and focused local proof completed.
- **Acceptance layer:** Implementation DoD only. This receipt does not claim Global QA, release
  readiness, Product adoption, deployment, hosted acceptance, or Figma parity.

### Demonstrated Cause And Source Hierarchy

- `src/styles/overlays-feedback.css` was the first shared owner of explicit State Surface size
  geometry. It had no narrow rule, so `md` and `lg` retained `16px` and `24px` padding at `375px`
  and `320px`.
- `src/components/hito-ds/reference-patterns-page.tsx` was the first owner of the selected reference
  controls. It exposed Tone, semantic Size, and Actions but no independent responsive-preview
  choice.
- Current reachability proved that `src/routes/workout.$date.tsx` contains the sole route-local
  previous/next card and that no existing Button, Reference Link, shell-navigation row, or launch
  surface truthfully owns its multiline date, direction, label, title, and native-anchor contract.
  One canonical `HitoNavigationCard` was therefore the smallest honest new runtime artifact.

### Files Changed

- `src/styles/overlays-feedback.css` — at the existing `639px` boundary, explicit `sm`, `md`, and
  `lg` State Surfaces now use `--space-3` padding. Omitted-size Product/Admin consumers are outside
  the selector and retain their current geometry.
- `src/components/ui/hito-navigation-card.tsx` — added the one canonical native-anchor component
  with previous/next direction, date, label, title, whole-card hover/focus treatment, and direct
  decorative arrow icons without an arrow box.
- `src/components/hito-ds/reference-patterns-page.tsx` — added the independent Desktop/Mobile
  Preview control through the existing workbench choice contract and physically documented both
  Navigation Card directions.
- `src/components/hito-ds/reference-model.ts` — registered the new in-document Patterns section.
- `scripts/validate-hito-ds-component-contracts.ts` — guards the narrow State Surface selector,
  separate preview control, native Navigation Card anatomy, two-direction reference, and the exact
  six-file workbench-settings consumer boundary.
- This canonical item — recorded preflight, evidence, lifecycle, validation, and successor.

### Reuse And Deletion Result

- Reused the existing `639px` responsive boundary, Hito spacing/radius/typography/surface/focus
  tokens, `Icon`, `HitoDsPlayground`, and `HitoDsWorkbenchChoiceControl`.
- Added no CSS file, token, helper, registry, generic viewport framework, compatibility path, or
  duplicate navigation state.
- The new shared component excludes the Product recipe's separate arrow-box background/border
  responsibility. The route-local component and CSS remain intentionally reachable until the
  Product owner adopts the shared primitive; deleting them here would cross the assigned boundary.

### Validation

| Check                          | Scenario / environment                                                              | Result          | Evidence                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source census                  | State Surface consumers, explicit `data-size` callers, navigation-card reachability | Passed          | Explicit size adoption is DS-only; the current Product navigation card has one route-local owner.                                                                                                  |
| Formatting and lint            | Focused Prettier and ESLint for changed TS/TSX/CSS/task seams                       | Passed          | No focused formatting or lint finding.                                                                                                                                                             |
| Design System validator        | Full `validate-hito-ds-components`                                                  | Passed          | 328 scanned files; the new responsive, native-anchor, reference, and exact six-consumer workbench assertions pass.                                                                                 |
| Manifest parity                | `generate-hito-ds-manifest.mjs --check`                                             | Passed          | Primitive `43`, semantic `41`, text styles `14`; generated truth is unchanged.                                                                                                                     |
| Diff hygiene                   | `git diff --check` plus new-file whitespace check                                   | Passed          | No whitespace error; unrelated dirty work remained outside this task.                                                                                                                              |
| Production build               | Fresh managed `qa_fixture` rebuild                                                  | Passed          | Build completed with the existing non-fatal chunk/module-directive warnings; admitted artifact reported `fresh` / `receipt_matches`.                                                               |
| State Surface desktop geometry | `1470×801`, Light and Dark, `sm` / `md` / `lg`                                      | Passed          | Padding remained `12px` / `16px` / `24px`; radii remained `8px` / `10px` / `12px`.                                                                                                                 |
| State Surface narrow geometry  | `375×812` and `320×812`, Light and Dark                                             | Passed          | All three semantic sizes resolved to `12px`; radii remained size-specific and every cell had `scrollWidth === clientWidth`.                                                                        |
| Preview control                | Desktop/Mobile pointer and physical keyboard selection                              | Passed          | The selected mode changed independently, Mobile produced `12px` at desktop width, `aria-checked` updated, and keyboard focus-visible remained present.                                             |
| Navigation Card presentation   | Light/Dark desktop and narrow reference                                             | Passed          | Two native `A` elements remained contained; arrows were direct `svg[aria-hidden=true]` with transparent background and `0px` border.                                                               |
| Navigation Card interaction    | Pointer hover, whole-card keyboard focus, pointer activation                        | Passed          | Hover changed the existing semantic surface; focused anchor showed the existing 2px ring; pointer activation changed `#navigation-card` to the declared destination hash.                          |
| Console                        | Completed focused browser matrix                                                    | Passed          | No warning or error entries.                                                                                                                                                                       |
| Independent QA retry           | Same exact route/matrix, read-only                                                  | Environment gap | QA saw the managed artifact and `receipt_matches` but received transient `compatible=false` / `healthy=false` before navigation, so it made no acceptance claim and no source defect was inferred. |

### Coverage Gaps And Preserved Boundaries

- The Browser control path confirmed a focused native anchor and its focus-visible ring, but a
  separate physical Enter replay did not change the hash. Native `<a href>` source semantics and
  pointer navigation are proven; independent physical Enter activation remains an exact focused
  browser-coverage gap because QA could not pass runtime admission. This does not broaden the
  implementation or justify a custom keyboard handler.
- The real Workout previous/next route was deliberately not migrated or replayed. Its current
  source and Product CSS remained byte-stable, so Product adoption and removal of the old local
  arrow-box recipe remain outside this Design System slice.

### Next Owner

`FRONTEND`, Product lane: adopt `HitoNavigationCard` in the Workout previous/next route, validate
the real destinations and fixture state, then remove the superseded route-local card/arrow-box
recipe when exact reachability reaches zero.

### Blockers

None for the assigned Design System implementation. The independent runtime-admission and physical
Enter coverage gaps are recorded above and are not presented as Global QA acceptance.

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Responsive State Surface Preview And Navigation Card Batch
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-ds-mobile-responsive-component-preview-batch.md

Ivan explicitly asked to start this work. Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md. Re-check the canonical item, dirty worktree, current runtime ownership, and existing primitives before the first write. You own only canonical DS code and `/hitoDS`; do not edit Product routes or Product-local CSS.

Slice A — State Surface: at the existing narrow breakpoint, make the real `sm`/`md`/`lg` State Surface padding resolve to `--space-3` (12px) without changing its semantic size API, tones, desktop geometry, typography, or Product/Admin consumers. Add a right-panel Desktop/Mobile selector to the State Surface reference. It must preview the actual responsive geometry and must not overload semantic Size, Tone, or Actions.

Slice B — Navigation Card: first prove whether an existing canonical primitive can truthfully own the current Workout previous/next card. If none can, add the smallest Hito Navigation Card component and a physical `/hitoDS` reference. Preserve native anchor behavior, whole-card focus-visible treatment, previous/next direction, date, label, title, and keyboard navigation. Remove the separate arrow-box background and border: arrows are icons only. Do not migrate `src/routes/workout.$date.tsx`; FRONTEND / Product will adopt the component later.

Reuse existing Hito tokens, primitives, reference patterns, and validators. Do not create a generic viewport framework, second breakpoint, new token scale, duplicate navigation behavior, route workaround, Figma mutation, hosted mutation, staging, commit, push, or deployment. You may ask existing named DESIGNER or QA roles for a bounded read-only question/review only if it materially reduces risk; do not delegate implementation.

Validate State Surface desktop/375/320 geometry in Light/Dark, selector keyboard behavior, responsive padding, and containment. Validate the Navigation Card reference's hover/focus/native navigation/icon-only arrows and desktop/mobile containment. Run proportional source checks, full DS validator, manifest parity if affected, focused Prettier/ESLint, diff hygiene, production build, and a fresh managed browser replay when runtime ownership permits. Record an English tracked receipt with files changed, Product-adoption successor, and exact omitted-proof consequences. Do not claim Global QA or release readiness.
```
