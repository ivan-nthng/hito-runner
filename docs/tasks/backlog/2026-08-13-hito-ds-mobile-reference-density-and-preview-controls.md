# Hito DS Mobile Reference Density And Responsive Preview Controls

## Work Item ID

2026-08-13-hito-ds-mobile-reference-density-and-preview-controls

## Status

completed

## Type

design-system responsive composition adoption

## Priority

high

## Owner

DESIGN SYSTEM

## Mode

Tracked

## Stage

DESIGN SYSTEM source implementation, managed-runtime proof, and the formerly blocked Patterns
overflow replay are complete.

## Next Recommended Role

PRODUCT

## Evidence From

[Mobile Density And Responsive Typography Discovery](./2026-08-13-hito-ds-mobile-density-and-responsive-typography-discovery.md)

## Scope

Apply the accepted narrow-screen density contract to shared Design System layout ownership and `/hitoDS` reference composition. Reuse the existing Hito spacing scale and the existing Desktop/Mobile workbench-control pattern already used by the Calendar and Workout Library playgrounds. Product-route adoption, App Shell source outside `/hitoDS`, DevTools, tokens, Figma, and persistence are excluded.

## Task

Below 640px, compact large **composition** spacing while preserving canonical typography roles, interactive control geometry, explicit child component layouts, local table/tab overflow, and desktop geometry. The current token scale is sufficient; do not create mobile tokens, a global multiplier, or a universal component-size API.

Implement in two ordered source slices:

1. **Shared layout ownership.** Move only generic narrow `.hito-route-stack`, `.hito-page-header`, and `.hito-section-header` rules from `src/styles/calendar-state-surfaces.css` to their existing shared owner in `src/styles/layout-typography.css`. Use the existing `<640px` breakpoint and current primitives: route stack `--space-8`, page header `--space-6`, and section gap `--space-1`. Leave Calendar-only navigation/card rules where they are.
2. **Reference composition and responsive previews.** Compact only `/hitoDS` reference wrapper, heading/showroom, tabs/playground shell, and generic stage composition on narrow screens: 16px horizontal / 24px vertical wrapper insets, remove duplicate top padding, 32px between Overview showroom groups, 16px shell/tabs/playground gaps, and content-driven generic stage geometry with 16px narrow padding. Preserve accepted desktop geometry from 640px upward and do not override an explicit child specimen that requires its own space.

For each affected **interactive responsive reference or sandbox**, expose the existing right-side `Desktop` / `Mobile` selector so an author can inspect its genuine responsive contract directly. Reuse the Calendar and Workout Library `VIEW_MODE_OPTIONS` / `ChoiceControl` design; do not create a page-global switch, synthetic mobile data path, or selector on static composition-only surfaces. Census which affected `/hitoDS` playgrounds actually render a distinct responsive contract (including the contained App Shell pattern), then add the selector only there. Its mode must render real existing desktop/mobile anatomy, retain keyboard semantics and focus, and leave the default desktop view intact.

## User Decision

- Mobile should feel denser through smaller page/composition gaps and padding, not by shrinking fields, rows, tags, tables, or touch targets.
- Typography does **not** receive a blanket mobile enlargement or reduction.
- When a Design System sandbox has a real mobile version, its standard right-side properties panel must let the user choose `Desktop` or `Mobile`, as it already does for Calendar day.

## Existing Evidence

- `src/styles/foundations.css` already provides the required 4–40px `--space-*` primitives.
- `src/styles/layout-typography.css` is the canonical shared layout owner; Calendar CSS currently contains the three misplaced generic narrow rules.
- `src/styles/reference-workbench.css`, `reference-page.tsx`, `reference-overview-page.tsx`, and `playground.tsx` own the reported `/hitoDS` composition layers.
- `calendar-workout-playground-data.ts` and `workout-library-playground-data.ts` already define `desktop | mobile` view modes and named `VIEW_MODE_OPTIONS`; `calendar-workout-playground.tsx` renders the existing right-side `ChoiceControl`.

## Execution Preflight

- Reuse the listed CSS and reference seams. New runtime artifacts: **none**.
- Before writing, map current dirty hunks in every admitted file and preserve unrelated changes byte-for-byte. `playground.tsx`, reference composition files, shared layout CSS, and workbench CSS are concurrently dirty.
- Identify every moved declaration and its consumers before deletion. Do not leave both Calendar and shared copies of a generic narrow rule active.
- Census responsive reference/sandbox candidates before adding any `Desktop`/`Mobile` control; document selected and explicitly excluded candidates.
- The active BACKEND Admin Capture task exclusively owns managed server restart, production build, and browser-runtime admission until it reaches a terminal return. During that time run only static/source validation; do not start, stop, rebuild, or claim a managed runtime.

## Implementation Preflight — 2026-08-13

- **Classification and source snapshot:** Tracked DESIGN SYSTEM implementation on `main` at
  `74607987885ca40f33658c79fba174d173d45646`. The admitted reference and shared-layout files were
  already dirty; their pre-write SHA-256 identities were recorded before editing so concurrent
  header, typography, reference-link, table-density, logo, and shell-surface hunks can remain
  byte-for-byte intact.
- **Existing seams and smallest change:** move only the three generic `<640px` declarations from
  `calendar-state-surfaces.css` into `layout-typography.css`; compact the existing narrow utility
  composition in `reference-page.tsx`, `reference-overview-page.tsx`, and
  `reference-workbench.css`; replace the contained App Shell's misuse of Demo/Variants as a
  viewport switch with one controlled preview and the existing right-panel `ChoiceControl` radio
  pattern.
- **New runtime artifacts:** none. No file, token, breakpoint, helper, registry, fixture, preview
  data path, or shared component API is required.
- **Superseded responsibility:** Calendar CSS stops owning generic route/page/section rhythm; the
  App Shell Variants tab stops acting as an undocumented mobile-view selector. Existing Calendar
  and Workout Library selectors remain the canonical working examples.
- **Moved-declaration reachability:** `.hito-route-stack`, `.hito-page-header`, and
  `.hito-section-header` are shared across Product and `/hitoDS`; the narrow declarations are not
  Calendar facts. Calendar-only `.hito-nav-card*` declarations remain in their current owner.
- **Responsive sandbox census:**
  - **Selected:** Calendar primitive and Workout taxonomy appendix already own explicit
    `desktop | mobile` state and distinct real renderers; no source change is needed. Contained App
    Shell has existing desktop sidebar/content anatomy and existing narrow topbar/bottom-nav
    anatomy, so it receives the same right-panel selector with Desktop as the default.
  - **Excluded:** Rows, Dropdowns, Buttons, Tabs, Reference Link, Inputs, Date & Time, Status,
    Selection controls, Slider, Motion, Marks, Typography Inspector, Editable Value Field, Inline
    editable text, Modals, Async action toasts, Data table composition, and Notice Surface use
    natural CSS reflow, local overflow, state/variant matrices, portals, or static documentation;
    none owns two equivalent responsive renderers. The Dropdown mobile-escalation specimen remains
    factual Variants documentation rather than a second live dropdown renderer.
- **Serialized validation boundary:**
  `2026-08-13-hito-admin-capture-repository-mirror-loader-recovery.md` remains `in_progress` and
  owns build/server/browser lifecycle. This slice may run static checks now but must not build,
  restart, stop, or browse a managed artifact until BACKEND returns terminal ownership.
- **Validator discriminator:** the first full DS validator replay correctly rejected the new App
  Shell `ChoiceControl` import because its closed reference-consumer allow-list still described the
  pre-task four-file Calendar/Workout Library boundary. The existing validator seam is therefore
  admitted only for the one path addition and matching five-file explanation; no assertion family
  or broad permission is added.

## What Not To Touch

- Product routes or `src/components/AppShell.tsx`; their mobile adoption is a separate FRONTEND consumer slice.
- Spacing token values/names, typography registry, control/row/tag/table dimensions, touch-target contracts, table/tab local scroll ownership, Figma, Local Inspector, data, providers, or Git lifecycle.
- Desktop layout at 640px and above, except a demonstrated responsive control that must render its established Desktop state.
- A wrapper/adapter, new mobile-only state store, duplicate preview component, or route-local workaround for shared DS composition.

## Acceptance

- Exactly the three generic narrow layout rules move to the shared owner; Calendar-only rules stay in Calendar CSS and no duplicate active declaration remains.
- At 375×812 and 320px, `/hitoDS` composition is visibly denser with no page-level horizontal overflow; 1470×801 desktop composition remains unchanged.
- Typography roles, field/control/touch geometry, explicit child stages, table horizontal scroll, and tab overflow behavior remain intact.
- Each selected responsive sandbox has one accessible right-side Desktop/Mobile selector reusing the existing workbench pattern; it changes real responsive anatomy. Static surfaces receive no fake selector.
- After BACKEND releases the managed lifecycle, run production build, admit a fresh loopback `qa_fixture` artifact, and verify `/hitoDS` at 1470×801 and 375×812 in Light/Dark, including selector keyboard/focus behavior, containment, and console health. If admission remains blocked, report the precise external boundary without using a stale artifact.
- Run focused Prettier/ESLint, full DS validator, and `git diff --check`; state unrelated failures separately.

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Implement the tracked Hito DS Mobile Reference Density And Responsive Preview Controls item.

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md. Own only the shared DS CSS and /hitoDS reference/sandbox seams admitted by the canonical item: docs/tasks/backlog/2026-08-13-hito-ds-mobile-reference-density-and-preview-controls.md.

Start now with preflight, source census, and static/source-owned implementation. Reuse existing spacing tokens and the Calendar/Workout Library Desktop/Mobile workbench pattern. Fix the first canonical owner; do not add mobile tokens, a global switch, synthetic preview data, new helpers, or route-local workarounds. Preserve all concurrent dirty hunks byte-for-byte.

The active BACKEND Admin Capture task owns managed build/server/browser lifecycle. Until it reports a terminal handoff, do not build, restart or stop a server, or run browser acceptance. Coordinate through the canonical item, then complete fresh build/browser proof after lifecycle ownership is released. You may use existing named Hito QA or DESIGNER roles only for bounded read-only evidence when it materially reduces risk; you remain the sole implementation writer.

Record the responsive sandbox census, selected/excluded controls, moved shared declarations, validation, and any external blocker in the same canonical item. Do not stage, commit, push, deploy, mutate Figma, fixtures, data, providers, or hosted state.
```

## Blockers

None for this Design System implementation slice. Global QA and release remain separate.

## Tracked Source Implementation Receipt — 2026-08-13 (Runtime Proof Pending)

### Product Outcome And Root Cause

The accepted narrow density contract is implemented at the shared owners without changing spacing
tokens, typography, control geometry, Product routes, or component-specific overflow. Generic
route rhythm no longer belongs to Calendar CSS. `/hitoDS` now removes only duplicate/large narrow
composition spacing, and the contained App Shell exposes its two real existing responsive anatomies
through the standard right-side radio control instead of using Demo and Variants as an undocumented
viewport switch.

### Files Changed For This Slice

- `src/styles/calendar-state-surfaces.css` — deleted only the generic narrow route, page-header,
  and section-header declarations; Calendar navigation-card rules remain.
- `src/styles/layout-typography.css` — added the single shared `<640px` owner using
  `--space-8`, `--space-6`, and `--space-1`.
- `src/styles/reference-workbench.css` — narrow playground, tab, shell, and generic Demo-stage
  composition now use 16px/content-driven geometry; the previous desktop declarations are restored
  from 640px upward.
- `src/components/hito-ds/reference-page.tsx` and
  `src/components/hito-ds/reference-overview-page.tsx` — narrow wrapper, duplicate heading/showroom
  top spacing, and showroom group rhythm now follow the accepted 16/24/32px composition while the
  prior desktop classes remain at `sm` and above.
- `src/components/hito-ds/reference-components-structure.tsx` — the contained App Shell reuses its
  existing desktop and narrow markup under one controlled Desktop/Mobile preview; Desktop remains
  the default and the existing profile/notice controls remain.
- `scripts/validate-hito-ds-component-contracts.ts` — extended only the closed workbench-settings
  consumer allow-list and its explanation from four to five files after the new canonical App Shell
  `ChoiceControl` consumer produced the exact expected stale-contract failure.
- This canonical item — recorded preflight, census, proof, and the external runtime boundary.

`src/components/hito-ds/playground.tsx`, Calendar/Workout Library renderers and data, spacing-token
definitions, Product AppShell, tables, tabs, fields, rows, and touch-target contracts received no
task-owned edit.

### Validation Inventory

| Check                            | Scenario / environment                                                               | Result                                 | Evidence / consequence                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source discriminator             | Current shared layout and Calendar CSS                                               | Passed                                 | The three generic narrow selectors are absent from Calendar's media block and exist once under shared `max-width: 639px` ownership with the accepted tokens.                                                             |
| Responsive sandbox census        | All current `HitoDsPlayground` consumers                                             | Passed                                 | Calendar and Workout Library retain their existing selectors; App Shell is the only newly selected real two-renderer reference. All CSS-reflow, portal, local-scroll, static, and state-matrix references were excluded. |
| App Shell contract               | Current source                                                                       | Passed                                 | One controlled preview selects existing desktop or narrow anatomy, defaulting to Desktop; the former App Shell `variants` viewport branch is absent.                                                                     |
| Full DS validator, first replay  | Local source                                                                         | Failed as expected, then fixed forward | The closed workbench-settings allow-list reported the new App Shell importer as its only task-owned drift. No broad assertion was weakened.                                                                              |
| Full DS validator, second replay | `npm run validate-hito-ds-components`                                                | Passed                                 | Contract reports five accepted workbench-settings consumers and scans 327 files.                                                                                                                                         |
| Focused ESLint                   | Three changed TSX owners plus the tightly coupled validator                          | Passed                                 | No lint finding.                                                                                                                                                                                                         |
| Focused Prettier                 | All changed source files and this item                                               | Passed                                 | All matched repository formatting.                                                                                                                                                                                       |
| Diff hygiene                     | `git diff --check`                                                                   | Passed                                 | No whitespace error.                                                                                                                                                                                                     |
| Production build                 | Managed lifecycle                                                                    | Not run — externally serialized        | BACKEND still owns build/server lifecycle; running it here would violate the explicit serialization gate. Build compatibility remains unproven by this slice.                                                            |
| Browser matrix                   | 1470×801, 375×812, and 320px; Dark/Light; selector keyboard/focus, overflow, console | Not run — externally serialized        | Fresh rendered density, desktop preservation, 320px reflow, and interaction acceptance remain open until BACKEND returns the managed runtime. No stale artifact is claimed.                                              |

### Preserved Boundaries And Next Owner

No new runtime artifact, token, breakpoint, helper, global switch, synthetic data, preview component,
Product change, fixture, Figma change, or compatibility path was introduced. Concurrent header,
reference-link, table-density, logo, shell-surface, Foundations, and validator hunks were preserved.

The next owner remains **DESIGN SYSTEM** after BACKEND returns terminal runtime/build ownership. It
must run the required uncontended production build, admit a fresh managed `qa_fixture`, complete the
desktop/mobile Light/Dark and 320px browser proof, fix forward any task-owned defect, and only then
decide terminal lifecycle. This receipt proves source/static Implementation progress only; it does
not claim complete Implementation DoD, Global QA, release readiness, hosted acceptance, or
deployment.

## Tracked Runtime And Stop-Condition Receipt — 2026-08-13

### Task, Stage, And Product Outcome

**Task:** Hito DS Mobile Reference Density And Responsive Preview Controls. **Stage:** final
DESIGN SYSTEM build/browser replay after the BACKEND lifecycle handoff. The task-owned shared
layout move, narrow reference density, and real responsive-preview controls are implemented. The
item remains blocked only because its route-wide no-overflow acceptance revealed a separate
shared-primitive defect outside this item's admitted source boundary.

### Final Source Outcome

- The three generic narrow layout rules have one shared owner in `layout-typography.css`; Calendar
  CSS retains only Calendar-specific navigation/card rules.
- `/hitoDS` uses 16px horizontal / 24px vertical narrow wrapper insets, zero duplicate header and
  showroom top padding, 32px Overview group rhythm, 16px playground/tabs/shell/stage composition,
  and content-driven narrow Demo stages. The previous desktop geometry resumes at 640px.
- The contained App Shell has one controlled preview and one standard right-side Desktop/Mobile
  radio group. Calendar and Workout Library retain their existing equivalent controls. No static
  reference received a synthetic selector.
- A final task-owned fix-forward added only the existing `break-words` composition utility to the
  shared reference H1 seams. This removed the demonstrated `Components.` 320px text overflow while
  preserving `hito-ui-title-xl` and all typography registry/source truth.
- New runtime artifacts, tokens, breakpoints, helpers, registries, fixtures, Product changes,
  synthetic data paths, global switches, and compatibility paths: **none**.

### Validation Inventory

| Check                        | Scenario / environment                                                    | Result                        | Evidence / consequence                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator         | Shared layout, Calendar CSS, reference wrappers, workbench CSS, App Shell | Passed                        | The generic declarations exist once in the shared owner; required narrow/desktop compositions and the one controlled App Shell preview are present.                                                                                          |
| Full DS validator            | `npm run validate-hito-ds-components`                                     | Passed                        | 327 files scanned; five closed workbench-settings consumers accepted.                                                                                                                                                                        |
| Focused Prettier             | All task-owned source plus this item                                      | Passed before final receipt   | Every checked file matched repository formatting.                                                                                                                                                                                            |
| Focused ESLint               | Changed TSX owners and tightly coupled validator                          | Passed                        | No lint finding.                                                                                                                                                                                                                             |
| Diff hygiene                 | `git diff --check`                                                        | Passed before final receipt   | No whitespace error.                                                                                                                                                                                                                         |
| Production build             | `npm run qa:server:restart` after the last source write                   | Passed                        | Client, SSR, Nitro, and postbuild completed; the managed server started from the fresh artifact.                                                                                                                                             |
| Runtime admission            | Managed loopback `qa_fixture`                                             | Passed                        | Current, managed, compatible, healthy, build present, `providerMode: qa_fixture`, `artifactFreshness: fresh`, `receipt_matches`.                                                                                                             |
| Overview matrix              | 1470×801 and 375×812, Light/Dark; 320px narrow reflow                     | Passed                        | Desktop retained 40px wrapper / 32px header top / 40px showroom top / 48px groups. Mobile rendered 16px/24px wrapper, zero duplicate top padding, 32px groups, no card or page overflow; 320px also fit.                                     |
| Components matrix            | Buttons at 1470×801 and 375×812, Light/Dark; 320px                        | Passed                        | Desktop stage remained 464px/56px; narrow stage became content-driven/16px. Demo→Variants used physical ArrowRight, retained focus-visible, and kept `#buttons`; 320px page width is exactly 320 after the shared H1 wrap fix.               |
| Responsive controls          | App Shell, Calendar, Workout Library                                      | Passed for control/anatomy    | Physical ArrowRight moved focus/selection from Desktop to Mobile with focus-visible and stable hashes. App Shell rendered its real narrow shell; Calendar rendered its mobile workout row; Workout Library rendered 32 mobile taxonomy rows. |
| Containment                  | Task-owned stages and local scroll owners                                 | Passed                        | App Shell stage/frame are 343px/311px at 375 and 288px/256px at 320; Calendar and Components pages have no horizontal overflow. Existing table/tab local-scroll contracts remain intact.                                                     |
| Console                      | Final Components/Patterns interaction replay                              | Passed                        | Zero browser warnings or errors.                                                                                                                                                                                                             |
| Route-wide Patterns overflow | `/hitoDS/patterns` at 375×812 and 320px                                   | **Blocked by separate owner** | Document widths are exactly 383px and 328px. The sole near-edge owner is `.hito-inline-header-input-affordance`, positioned at 359→383px and 304→328px after a full-width trigger. The App Shell/Workout stages themselves remain contained. |

### Preserved Boundaries, Gap, And Next Owner

No shared primitive, Product route, Product AppShell, table, field, control, token, Figma, fixture,
provider data, or hosted state was changed. The existing completed
`2026-08-13-hito-ds-inline-editable-header-text-anchor-and-affordance.md` source owns the residual
out-of-flow affordance. Changing that shared primitive or adding a reference-only padding/clipping
exception would exceed this item's explicit scope, so the route-wide 375px/320px no-overflow
acceptance cannot be truthfully claimed.

**Next owner:** PRODUCT must route a bounded DESIGN SYSTEM follow-up for the residual
InlineEditableText affordance containment, then return this item for the one missing Patterns
overflow replay. No independent subagent was used. This receipt proves the task-owned
implementation, build, and browser evidence; it does not claim complete Implementation DoD,
Global QA, release readiness, hosted acceptance, Figma acceptance, or deployment.

The terminal receipt write changed the private repository snapshot digest after that fresh proof,
so the final managed status is expectedly `stale / artifact_missing` while the already-running
loopback process remains healthy. No second rebuild was performed merely to make this receipt
self-validating; the next browser owner must admit a new fresh artifact after the shared-primitive
fix.

## Tracked Acceptance Closure — 2026-08-14

The separate shared-primitive repair in
`2026-08-13-hito-ds-inline-editable-header-narrow-overflow-repair.md` replaced the out-of-flow
`100% + gap` affordance placement with the accepted persistent logical inline-end lane. No source
owned by this mobile-density item changed during this closure.

| Check                       | Scenario / environment                                                   | Result | Evidence / consequence                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime admission           | Fresh managed loopback `qa_fixture` built after the shared source repair | Passed | Managed, compatible, healthy, build-present, fresh, and `receipt_matches` before navigation.                                                                                              |
| Exact formerly blocked cell | `/hitoDS/patterns#inline-editable-text`; 375×812 and 320×812; Light/Dark | Passed | Document widths equal viewport widths in all four cells. The `lg` label truncates inside its lane; the affordance right edges are 343px and 288px rather than the former 383px and 328px. |
| Reveal geometry             | Rest, physical pointer hover, keyboard focus                             | Passed | The 24px lane remains reserved and contained; opacity/visibility changes do not alter trigger or text geometry.                                                                           |
| Desktop preservation        | 1470×801; Light/Dark                                                     | Passed | The shared reference remains 1470px wide with unchanged text start and no reveal-time reflow.                                                                                             |
| Independent review          | Existing ROLE: QA, read-only                                             | Passed | All six viewport/theme cells, edit lifecycle, disabled/read-only states, `sm`/`md`/`lg`, and console health passed with no task-owned defect.                                             |

The only terminal blocker recorded by this item is therefore resolved at its actual shared owner;
no clipping, extra padding, mobile-density rollback, route-local exception, or second responsive
recipe was added. This closure completes the Design System implementation and its focused local
acceptance. It does not claim Global QA, release readiness, hosted acceptance, Figma parity, or
deployment. **Next owner:** PRODUCT for any broader acceptance or release routing.
