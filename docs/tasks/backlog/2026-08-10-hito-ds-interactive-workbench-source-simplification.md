# Hito DS Interactive Workbench Source Simplification

## Work Item ID

2026-08-10-hito-ds-interactive-workbench-source-simplification

## Status

completed

## Type

cleanup

## Priority

high

## Owner

design_system

## Scope

shared-design-system-reference

## Stage

Completed — Design System Button pilot and bounded Tabs adoption.

## Archive Intent

retain_in_place

## Task

Simplify the internal implementation of the existing interactive `/hitoDS` component workbench
without reducing what reviewers can click, change, focus, restore, open, sort, filter, or otherwise
exercise. Reuse the accepted `HitoDsPlayground` shell and canonical live components. Remove
reference-only state, rendering, matrix, and overview duplication only where the same behavior can
be expressed through one family-owned story state and one reusable component renderer.

This is source simplification, not a visual redesign, a new documentation system, or permission to
replace the current live reference with static screenshots.

## Dependency And Start Condition

Do not start implementation until
[Hito DS Showcase Navigation And Catalog Information Architecture](2026-08-10-hito-ds-showcase-navigation-and-catalog-ia.md)
has completed its current implementation and focused owner validation. That item owns the active
showcase/navigation integration set and must not be edited, restructured, or absorbed by this
deferred cleanup.

When the dependency is complete, Product may advance this item to `ready` and prepare the exact
Design System handoff from then-current source evidence. No implementation is authorized by this
backlog capture alone.

## Product Dispatch Decision — 2026-08-11

Ivan explicitly authorized this task to begin. The dependency's repository implementation and focused
owner validation are complete; its only remaining block is the missing approved external Hito Running
Library Figma URL. That external link insertion neither overlaps nor authorizes this source cleanup.
Proceed only on the current repository source while preserving the completed showcase/navigation
integration set byte-for-byte. Do not access, infer, or mutate Figma as part of this task.

## Design System Execution Preflight — 2026-08-11

- **Outcome:** prove a net-negative Button pilot by moving Button-only reference state and rendering
  out of the six-family `HitoDsComponentControls` owner and replacing its repeated visual-state JSX
  with named local cases rendered through the existing `DemoButton` adapter.
- **Current evidence:** the post-showcase source is 1,580 lines and has 42 state declarations in
  `reference-components-controls.tsx`; seven declarations and the lines 151–363 workbench belong to
  Button. `DemoButton` and `IconOnlyButtonMatrix` remain runtime-reachable from the Figma export
  route, while `DemoButton` also renders the Input height comparison.
- **First incorrect owner and reused seam:** the cross-family reference composition owner is the
  demonstrated cause. The pilot reuses the existing `HitoDsPlayground`, canonical `HitoButton`,
  control-contract arrays, `ChoiceSelector`, `ToggleRow`, and `DemoButton` seams.
- **New runtime artifacts:** none. The Button owner and named case data stay local to the existing
  controls module; no registry, schema, wrapper API, route, dependency, token, primitive, or second
  playground is introduced.
- **Removal and retention:** remove seven Button state responsibilities from the cross-family parent
  and nine repeated state-matrix invocations. Retain forced hover/focus/active rendering and the
  icon-only matrix because live interaction cannot provide stable visual-QA/Figma-capture evidence.
  Retain the accepted grouped composition and Overview action behavior byte-for-byte rather than
  widen a shared reference API for one custom-label interaction.
- **Preserved boundaries:** no Overview, Figma-export, shared primitive/API/CSS/token, Product,
  Backend, Inspector, validator, or unrelated dirty-work mutation. The pre-write source snapshots
  are held outside the repository for exact comparison.
- **Focused proof:** source/reachability comparison, Hito DS validator, targeted lint/format and diff
  hygiene, current build/integrity proof after source settles, then independent desktop and exact
  375px light/dark Demo/Variants/Overview keyboard, focus, overflow, navigation, and console replay.
- **Stop/expansion condition:** stop after Button if the pilot is not source/responsibility
  net-negative or if preservation requires a new framework/API. Adopt another simple family only
  after Button evidence passes and a separate deletion case is demonstrated.

## User Report

Ivan likes the current `/hitoDS` behavior and explicitly requires the reference to remain fully
interactive: reviewers must continue to be able to click and manipulate the live examples.

The implementation nevertheless feels too large. The desired direction is a simpler component
story in which one preview owner renders the real canonical component, the properties panel drives
that same state, and purposeful variants reuse the same renderer rather than repeating specimen
markup and behavior.

Ivan supplied four Astryx reference screenshots on 2026-08-10:

- `Screenshot 2026-08-10 at 23.15.42.png`: Button Overview with a large live preview.
- `Screenshot 2026-08-10 at 23.16.05.png`: Properties view with one preview and editable props.
- `Screenshot 2026-08-10 at 23.16.18.png`: component invocation/code presentation.
- `Screenshot 2026-08-10 at 23.16.39.png`: separate split editor/preview playground.

The screenshots are interaction and information-architecture references. They do not authorize
copying Astryx styling, packages, code-editor infrastructure, or public-library breadth.

## Evidence

Current source inspection on 2026-08-10 found:

- `src/components/hito-ds/playground.tsx` already owns the shared stage, right-side controls, and
  `Demo / Variants` shell. A second universal Playground is not required.
- `src/components/hito-ds` currently contains 26 files, 17 `HitoDsPlayground` instances, and 50
  `useState` calls. These are size signals, not automatic deletion authorization.
- `src/components/hito-ds/reference-components-controls.tsx` is 1,569 lines, contains 25
  `useState` calls, and coordinates six component families: Button, Tabs, Data Table, Input,
  Status, and Selection Controls.
- `src/components/hito-ds/specimen-previews.tsx` is 848 lines and contains shared specimen helpers,
  including adapters that are also consumed by the Figma export board.
- `src/components/hito-ds/reference-overview-page.tsx` is 370 lines and owns additional interactive
  showroom state for actions, date, selection, slider, and tabs.
- The current dirty `/hitoDS` integration set is still active under the dependency item. Its source
  must be treated as concurrent work and preserved byte-for-byte until that owner closes.

## Observed Behavior

1. The live workbench behavior is useful and accepted.
2. The shared shell is already reusable, but several simple component stories are assembled inside
   one cross-family state owner.
3. Demo controls, live preview, purposeful state matrices, Overview examples, and visual-QA
   adapters can encode overlapping reference-only responsibilities.
4. Simple state matrices contain repeated component invocations that can often be represented as
   named cases passed to one renderer.
5. Complex Calendar, Workout Library, Data Table, overlay, and motion workbenches carry real
   scenario behavior and must not be forced into a generic primitive-props schema merely to reduce
   line count.

## Expected Behavior

- `/hitoDS` remains a live, fully interactive reference in desktop and narrow layouts.
- A simple component family has one local story-state owner and one canonical preview renderer.
- The right-side properties controls update that same live preview.
- Purposeful variants and simulated visual states reuse the same family renderer or an explicitly
  retained visual-QA adapter.
- The Overview remains clickable and demonstrative while reusing canonical live behavior instead
  of creating a second behavioral implementation.
- Complex scenario workbenches retain their truthful domain-specific controls and interactions.
- The final implementation is net-negative in duplicated responsibility and source. Moving the
  same volume into more files without deletion is not completion.

## Source Investigation And Likely Root Cause

The demonstrated first incorrect owner is the reference composition layer, especially the
cross-family state and rendering responsibility in `reference-components-controls.tsx`, not the
canonical Hito primitives, shared control APIs, tokens, or Product consumers.

`HitoDsPlayground` already provides the correct shared seam. The likely simplification path is to
co-locate each simple family's state and rendering, then reuse one renderer for its live preview and
case-driven matrices. A single universal component switch, runtime prop-introspection system, or
embedded code editor would move the complexity into a new framework rather than remove it.

The Button family is the required pilot because it has a canonical component API, canonical
variant/size/tone arrays, live and forced-state examples, and Figma-export consumers. It can prove
whether the approach actually deletes duplication while preserving every interaction and evidence
boundary.

## Reuse-First Budget

Reuse:

- `HitoDsPlayground` and the accepted `Demo / Variants` interaction grammar;
- `HitoDsWorkbenchChoiceControl`, `HitoDsWorkbenchSelectControl`, `ChoiceSelector`, and `ToggleRow`
  where they already express the needed property control;
- canonical Hito component APIs and their existing size/variant/tone/state arrays;
- current controlled callbacks, native interaction, accessibility semantics, and focus behavior;
- existing visual-state adapters where forced hover/focus/active proof or Figma export genuinely
  requires them;
- the existing Hito DS validator and current build/browser paths.

Expected new production runtime artifacts: **none**.

A new reference-only story module is allowed only when it takes over a distinct family
responsibility and the completed slice removes more duplicated source/responsibility than it adds.
Do not add a generic story registry, prop-schema framework, runtime TypeScript introspection,
Storybook, Sandpack, Monaco editor, second renderer, token family, component wrapper, or route.

## Execution Shape

### Gate 1 — Button pilot

- Reconfirm the post-dependency source and exact Button/Figma-export consumers.
- Keep one live canonical Button preview controlled by the existing properties UI.
- Express purposeful Button cases through one renderer and named case data where this removes
  repeated JSX.
- Retain simulated-state helpers only for responsibilities a real live Button cannot prove.
- Keep Overview Button interactions working through canonical live behavior.
- Stop if the pilot is not net-negative or needs a new framework/API.

### Gate 2 — Bounded simple-family adoption

Only after the Button pilot passes, apply the proven shape to simple families with demonstrated
duplication, initially Input, Tabs, Status, and Selection Controls. Do not rewrite Calendar,
Workout Library, Data Table, overlays, motion, or other scenario workbenches without a separate
source-backed deletion case.

### Gate 3 — Cleanup and proof

- Remove superseded cross-family state, repeated specimen markup, and redundant Overview behavior.
- Record every retained adapter and why it cannot yet be removed.
- Compare before/after source size and responsibility ownership; explain any material growth.
- Run the focused validation inventory and update this item with a compact English receipt.

## Validation Expectations

| Check                      | Scenario / environment                                                                | Required evidence                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Source ownership           | Shared shell, Button pilot, adopted simple families, Overview, Figma export consumers | One state/render owner per simple family; no second framework or compatibility layer                     |
| Deletion proof             | Exact before/after file, line, state-owner, helper, and consumer map                  | Net-negative duplicated responsibility; every removed helper has zero remaining reachability             |
| DS contract                | Existing Hito DS validator                                                            | Canonical component APIs, supported matrices, and visual-state boundaries remain valid                   |
| Static quality             | Touched source and canonical item                                                     | Focused lint/format and `git diff --check` pass                                                          |
| Build                      | Fresh production build and existing integrity check when applicable                   | Current source produces valid client/SSR output                                                          |
| Live interaction           | Every touched Demo and its Overview entry                                             | Pointer controls change the preview; open/sort/filter/restore behavior remains truthful where applicable |
| Keyboard and accessibility | Properties, live components, tabs, focus-visible, disabled/invalid states             | Native keyboard behavior, focus, names, ARIA, and state announcements are preserved                      |
| Variants evidence          | Purposeful case matrices                                                              | Required visual-QA states remain distinguishable without becoming live fake product state                |
| Responsive and themes      | Desktop and exact 375px, light and dark                                               | Preview and properties remain usable, reachable, and free of page-level overflow                         |
| Runtime health             | Touched `/hitoDS` destinations                                                        | No new console, hydration, anchor, or navigation failures                                                |
| Diff hygiene               | Shared dirty checkout                                                                 | Dependency output and unrelated integration hunks remain byte-for-byte preserved                         |

This owner validation proves only the Design System implementation slice. It does not claim Global
QA Acceptance, release readiness, hosted proof, or Figma-library parity.

## Definition Of Done

1. All pre-existing supported `/hitoDS` interactions remain available and usable.
2. The Button pilot and every adopted simple family use the existing shared workbench shell rather
   than a new documentation/playground framework.
3. Each adopted family has one local state/render owner for its live preview and case-driven
   specimens.
4. Overview remains live and clickable without duplicating family behavior that can reuse the
   canonical reference owner.
5. Complex scenario workbenches remain intact unless exact evidence authorizes a bounded deletion.
6. No canonical primitive API, visual language, token, Product behavior, persistence, Figma export
   semantics, or accessibility contract changes as a side effect.
7. The final receipt proves net-negative duplicated responsibility and source. A file split alone
   does not satisfy this criterion.
8. Every required focused check passes or the item remains open with the exact coverage consequence.

## What Not To Touch

- The active showcase/navigation implementation before its canonical dependency is complete.
- Product routes, App Shell behavior, Calendar eligibility, workout behavior, persistence, Backend,
  Supabase, auth, providers, fixtures, or product data.
- Shared component visual design, public APIs, CSS/tokens, size/radius scales, or semantic states
  unless a separate demonstrated Design System defect is assigned.
- Figma files, mappings, publication, library hygiene, or export-board semantics.
- Local Inspector, DevTools behavior, generated manifests, validators, or QA paths except for the
  smallest update required by an actual deleted reference responsibility.
- Unrelated dirty work, staging, commits, pushes, deployments, hosted systems, or paid providers.

## Stop And Escalation Conditions

Return to Product without expanding the task when:

- preserving the accepted interaction requires a new shared component API or Product-state choice;
- the Button pilot adds comparable or greater complexity instead of deleting it;
- a universal registry, code editor, new dependency, route, token, or second playground becomes
  necessary;
- an Overview interaction cannot be preserved without duplicating Product behavior;
- Figma export or Inspector ownership would need a semantic change rather than reference-only reuse;
- a required build, browser, accessibility, or diff-hygiene check fails outside Design System
  ownership; or
- the dependency item is still active on a required source seam.

## Design System Implementation Receipt — 2026-08-11

### Task, Mode, And Stage

- **Task:** simplify the interactive `/hitoDS` reference composition at its demonstrated
  cross-family state/rendering owner without changing accepted behavior.
- **Mode:** Tracked.
- **Completed stage:** Button pilot plus the one additional simple family with a measured deletion
  case, Tabs.
- **Validation layer:** focused Design System implementation proof. This is not Global QA,
  release readiness, hosted proof, or Figma parity.

### Product Outcome And Root Cause

`HitoDsComponentControls` no longer owns Button or Tabs reference state/rendering. The existing
`HitoDsPlayground` remains the only workbench shell. `ButtonPlayground` and `TabsPlayground` are
same-file local owners, while `DemoButton` remains the one existing reusable Button renderer.

The demonstrated first incorrect owner was the six-family reference composition component. The
pilot removed that cross-family ownership and repeated case JSX; it did not change canonical Hito
primitive APIs, CSS, tokens, Product behavior, Figma export semantics, or the Overview showcase.

### Exact Before/After Evidence

| Measure                                                              |              Before |                                               After | Result                                |
| -------------------------------------------------------------------- | ------------------: | --------------------------------------------------: | ------------------------------------- |
| `reference-components-controls.tsx` source                           |         1,580 lines |                                         1,563 lines | Net −17 lines                         |
| State declarations in cross-family `HitoDsComponentControls`         |                  42 |                                                  29 | Button and Tabs no longer owned there |
| Local Button state owner                                             |                none |                  `ButtonPlayground`, 7 declarations | One family-local owner                |
| Local Tabs state owner                                               |                none | `TabsPlayground`, 6 declarations plus `useHitoTabs` | One family-local owner                |
| Repeated Button state-matrix invocations                             | 9 explicit branches |                          1 `BUTTON_STATE_CASES` map | One existing renderer path            |
| Repeated live Tabs invocations                                       | 4 explicit branches |                                   1 `TAB_ITEMS` map | One family-local renderer path        |
| New runtime files, routes, APIs, dependencies, tokens, or primitives |                   0 |                                                   0 | None introduced                       |

The total number of state declarations remains 42 because this cleanup changes truthful ownership,
not interaction state. The source reduction comes from deleting repeated Button and Tabs rendering.

### Retained Adapters And Excluded Families

- `DemoButton` and `IconOnlyButtonMatrix` remain because the live Figma export route imports both;
  `DemoButton` also renders the Input height comparison.
- Forced hover/focus/active cases remain because live pointer state cannot provide deterministic
  simultaneous visual-QA and export capture evidence.
- The accepted grouped Button composition and Overview Button action/status behavior remain
  byte-identical. Widening `DemoButton` with arbitrary labels/callbacks or adding a second shared
  wrapper for one Overview card was rejected.
- Tabs keeps its forced non-interactive state matrix while the live named item renderer owns Plan,
  Progress, Updates, and the conditionally rendered disabled Archived tab.
- Input was not adopted: its basic state matrix is already data-driven, while its field, range,
  select, date, and time examples are distinct live scenarios.
- Selection Controls was not adopted: the live Demo already uses `SelectionControlPreview`, and the
  remaining states/compositions are distinct visual adapters. Unification would require API and
  Overview changes.
- Status was not adopted: the possible source saving was only a projection and did not establish a
  sufficiently stronger deletion than the additional renderer and workbench relocation would add.
- Data Table, Calendar, Workout Library, overlays, motion, and all other domain workbenches were not
  changed.

### Files Inspected And Changed

Changed:

- `src/components/hito-ds/reference-components-controls.tsx`
- this canonical item

Inspected but byte-identical to the pre-write snapshots:

- `src/components/hito-ds/reference-overview-page.tsx`
- `src/components/hito-ds/specimen-previews.tsx`
- `src/components/hito-ds/figma-export-board.tsx`
- `src/components/hito-ds/playground.tsx`

All unrelated dirty work was preserved. No file was staged, committed, pushed, deployed, or mutated
in Figma or hosted systems.

### Subagent Findings

- The read-only Design System reachability reviewer proved that `DemoButton`, the icon-only matrix,
  Figma state data, Input comparison Button, grouped composition, and Overview behavior were not
  deletion candidates. Its Gate 2 audit authorized Tabs and rejected Input/Selection expansion.
- The read-only QA/browser reviewer independently verified the touched Button and Tabs live paths,
  retained variants/deep links, Overview regression, keyboard/focus behavior, exact 375px and
  desktop light/dark layouts, overflow ownership, console health, and canonical runtime integrity.

### Validation Inventory

| Check                             | Scenario / environment                                 | Result | Evidence                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership and deletion     | Pre-write snapshot vs final controls module            | Passed | 1,580 → 1,563 lines; parent owner 42 → 29 states; Button 9 branches → one case map; Tabs 4 branches → one item map                                       |
| Preserved dependency/export files | SHA/blob comparison                                    | Passed | Overview, specimen adapters, Figma export board, and shared playground matched their pre-write hashes                                                    |
| Design System contract            | `npm run validate-hito-ds-components`                  | Passed | 320 files; 4 Button sizes, 3 tones, 4 variants; reference workbench consumers remained valid                                                             |
| Static quality                    | Targeted ESLint, Prettier, and `git diff --check`      | Passed | No touched-source or lifecycle formatting errors                                                                                                         |
| Targeted TypeScript discriminator | Full `tsc` output filtered to the changed module       | Passed | No error referenced `reference-components-controls.tsx`                                                                                                  |
| Production build/integrity        | Canonical `npm run qa:server:start`                    | Passed | Client, SSR, Nitro, postbuild, Admin snapshot integrity, and fresh `receipt_matches` completed                                                           |
| Button live/keyboard              | 1440×900, Light, Chrome                                | Passed | Properties rerendered the same preview; pressed/loading/feedback/progress, Enter/Space/Arrow, disabled behavior, and 2px focus outline remained truthful |
| Button variants/deep links        | `#button-group`, `#icon-only-button`                   | Passed | Variants tab/hash activation, grouped actions, state evidence, and 84 named icon-only buttons remained present                                           |
| Tabs live/keyboard                | Desktop Chrome                                         | Passed | Pointer, ArrowRight, Home, End, icon/badge/dot controls, style, and hidden/restored disabled Archived behavior passed                                    |
| Overview regression               | `/hitoDS`, 1440×900 and 375×812                        | Passed | Previous/Today/Next status, keyboard activation, and the Button reference link remained live                                                             |
| Responsive/themes/overflow        | Desktop and exact 375×812, Light/Dark                  | Passed | Workbench and Overview remained contained; page client/scroll width was 375/375; Tabs overflow stayed in its own scroller                                |
| Console/runtime health            | Chrome plus in-app browser; canonical loopback runtime | Passed | Error logs empty; final QA runtime was current, managed, compatible, loopback-only, healthy, and fresh                                                   |
| Diff hygiene                      | Shared dirty checkout                                  | Passed | Task-owned delta stayed in the controls module and this item; source snapshots proved protected `/hitoDS` files unchanged                                |

### Omitted Check Consequence

Full-repository `npx tsc --noEmit` remains failed by a broad existing error set across scripts,
Admin, Product, manual-workout, generated/reference, Supabase typing, and route code. No reported error
named the changed controls module, and the production build passed, but this receipt does not claim a
clean repository-wide typecheck.

### Next Owner And Blockers

The assigned Design System implementation slice is complete with no local blocker. Product may
close or archive the item according to backlog policy. The missing approved Hito Running Library
Figma URL belongs to the separate showcase/navigation dependency and remains explicitly outside
this task.
