# Hito DS Header Search And Context Navigation

## Work Item ID

2026-08-13-hito-ds-header-search-and-context-navigation

## Status

completed

## Type

design-system reference-shell interaction

## Priority

high

## Owner

design system

## Mode

Tracked

## Scope

Move Hito DS page discovery from the desktop left sidebar into the existing Hito-style reference
header. The header must show the current DS location, offer a right-aligned icon-only search that
expands smoothly into an accessible query field, and contain the current theme preference inside a
right-aligned menu. Preserve the existing DS navigation index, search matching semantics, desktop
sidebar navigation, mobile Sheet browsing, and theme preference truth.

## Task

Create one canonical `/hitoDS` desktop header composition that uses the established product header
surface treatment: sticky, theme-aware, blurred, and semantically composed from existing Hito
primitives. It must be the only desktop entry point for the existing `Find in Hito DS` query.

- **Left:** a compact, truthful location label derived from the active reference destination. It
  must distinguish the Design System context from the current page/section without hard-coded
  parallel navigation truth.
- **Right:** an accessible Search icon button. Activating it expands the search affordance into an
  input with the current DS query, moves focus into that input, and retains the existing search
  results, group expansion, clear, Escape, blur, pointer, and keyboard behavior. Empty search may
  collapse only when the user leaves it, and a non-empty query must remain visible and reversible.
- **Right menu:** move the existing `ThemePreferenceChoiceGroup` out of the desktop sidebar into a
  standard menu/sheet-appropriate control. Theme remains the one preference owner; no language
  picker, locale state, translation work, or persistence change is part of this task. The menu
  should provide a natural future slot for language without rendering a disabled or pretend control.

The mobile topbar and mobile browse Sheet remain responsive equivalents, not a second independent
search model. The execution owner must establish which header/action layout is appropriate at each
existing breakpoint and preserve non-overlapping navigation controls.

## User Direction

- The current left-sidebar input `Find in Hito DS` should disappear from that location.
- The desktop DS header should feel and behave like the main product header: blurred surface in
  Dark and Light, with controls on the right.
- Search begins as an icon-only button and smoothly expands to the existing search field on
  activation. Ivan states that Hito already has this interaction and wants reuse, not a new search
  pattern.
- A small left-side location label should tell the user where they are.
- Theme should no longer visually occupy the left sidebar. It belongs in a right-side menu now;
  language selection is explicitly future work only.

## Source Facts

- `src/components/hito-ds/reference-navigation.tsx:22-211` owns the current DS query state,
  matching against `HITO_DS_NAV_ITEMS`, group expansion/collapse, Escape clear, desktop navigation,
  and the rendered `Find in Hito DS` sidebar Input.
- `src/components/hito-ds/reference-page.tsx:21-150` owns the DS desktop sidebar, the mobile
  topbar/Sheet, active destination, and the existing `ThemePreferenceChoiceGroup` placements.
- `src/components/AppShell.tsx:236` is the established main-product sticky header treatment:
  `bg-background/90 backdrop-blur-xl`.
- `src/components/admin/AdminOperationalComponents.tsx:55-140` contains the existing Hito
  progressive-search behavior: an icon button opens a search field, focus enters the field, empty
  blur collapses it, non-empty state stays visible, and clear returns to a controlled query. It is a
  table-toolbar composition, not automatically a reusable DS component.
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/icon.tsx`,
  `DropdownMenu`, `Sheet`, and `ThemePreferenceChoiceGroup` are the existing primitives to inspect
  and reuse before adding any artifact.

## Demonstrated Root Cause

The existing DS shell places global discovery and theme preference inside the desktop navigation
sidebar. The search logic itself is correct, but the composition is not aligned with the accepted
reference-header hierarchy. The first incorrect owner is the `/hitoDS` shell composition in
`reference-page.tsx` together with its direct desktop navigation presentation in
`reference-navigation.tsx`; this is not a Product route or Local Inspector defect.

## Required Implementation Boundaries

- Reuse the existing DS navigation data/matching logic as the single query owner. Do not duplicate
  `query`, filtering, active-location, or theme-preference state in a new header model.
- Reuse standard Hito Button, Input, Icon, menu/sheet, motion, surface, focus, typography, spacing,
  and breakpoint contracts. Do not add raw CSS values, a parallel header CSS file, a local color
  recipe, or a generic search framework.
- Treat the Admin toolbar as behavioral evidence and existing primitive composition, not permission
  to couple DS navigation to Admin table state or move its source owner.
- Remove the desktop sidebar search object and desktop sidebar theme control only after their
  behavior is reachable through the header. Keep mobile behavior only if the source/QA matrix proves
  it remains necessary and non-duplicative.
- The header may use an existing motion primitive/utility for the opening transition. Respect
  reduced-motion behavior and do not add a custom animation system.
- Preserve DS deep links, group disclosure, keyboard navigation, active page indication, focus
  return, and all route/section search synonyms.

## Explicit Non-Goals

- No language picker, locale switch, translation string project, locale persistence, or disabled
  placeholder.
- No Local Inspector card-size changes; that separately dispatched DESIGNER discovery owns the
  future card-size decision.
- No Product AppShell migration, Admin toolbar migration, navigation IA rewrite, generated manifest,
  Figma, Backend, provider, Git, hosted, or release work.
- Do not turn the actual search input into a decorative non-functional control, or change navigation
  results in response to opening/closing alone.

## Acceptance Evidence

| Check                  | Expected outcome                                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop Dark and Light | `/hitoDS` has a sticky blurred header with one truthful left location, a collapsed Search icon, and a theme menu on the right. The sidebar contains neither the standalone query Input nor desktop theme chooser. |
| Search interaction     | Button expansion focuses the real input; typing filters the same destinations and expands matching groups; clearing, empty blur, and Escape are reversible; focus lands predictably after collapse.               |
| Theme                  | Theme selection in the header menu updates the existing preference and preserves the selected theme after menu interaction. No language control is rendered.                                                      |
| Mobile                 | Exact 375×812 Dark/Light retains a single reachable DS browse/search path without duplicated query state, horizontal overflow, clipped action controls, or lost context.                                          |
| Accessibility          | Buttons and menu have names, expanded/collapsed state is exposed, focus rings remain visible, reduced motion is respected, and keyboard navigation still reaches destinations.                                    |
| Preservation           | Page/section deep links, search synonyms, active navigation state, nested disclosure behavior, and ordinary DS reference content remain intact.                                                                   |

## Validation Expectations

Run targeted source assertions, Prettier, focused ESLint, Design System validator, production build
if runtime source changes, and `git diff --check`. Browser proof must cover the acceptance matrix
above using an uncontended, fresh local fixture. Record every unavailable browser dimension as a
coverage gap; do not claim Global QA, hosted acceptance, or release readiness.

## Stage

DESIGN SYSTEM Implementation DoD complete on a fresh managed `qa_fixture` artifact.

## Next Recommended Role

PRODUCT

## Handoff Status

Closed after the owning FRONTEND task restored the Overview specimen export and the complete Header
Search replay passed. No further Design System source work is required for this item.

## Execution Preflight — 2026-08-13

- **First owner and existing seam:** `reference-page.tsx` owns the responsive reference shell and
  `reference-navigation.tsx` owns the existing grouped matching/filtering behavior. The shell will
  own one controlled query and pass it to the existing desktop/mobile navigation renderers; no
  second query, destination index, active-location state, or theme preference owner is introduced.
- **Smallest behavior change:** reuse `hito-workbench-topbar` for desktop as well as mobile, place
  the existing controlled query behind an icon-only progressive Search action, derive the location
  from the current page and canonical section data, and render the existing
  `ThemePreferenceMenuItems` in a standard right-side Dropdown menu.
- **New runtime artifacts:** none. No component family, helper file, CSS file, token, raw color,
  locale state, registry, persistence path, or Product/Admin dependency is proposed.
- **Superseded responsibility removed:** the desktop sidebar query field and sidebar theme chooser
  are removed only after the header controls reach the same query and theme owners. The mobile
  Sheet retains one controlled browse/search presentation rather than independent query truth.
- **Dirty-work boundary:** the current non-Overview eyebrow deletion in `reference-page.tsx` and all
  unrelated Foundations, Components, Brand, Product, validator, favicon, receipt, and policy hunks
  are preserved byte-for-byte.
- **Proof and stop condition:** focused source/static/build proof plus Dark/Light desktop and exact
  375×812 replay must cover Search focus/filter/clear/Escape/blur, theme menu, deep links, responsive
  containment, keyboard focus, and console health. A required Product/AppShell change, locale
  decision, new state owner, token, or separate framework returns to PRODUCT instead of expanding
  this task.

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Header Search And Context Navigation
Mode: Tracked implementation
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-header-search-and-context-navigation.md

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md
before work. Run the required Tracked preflight and preserve unrelated dirty work byte-for-byte.

Implement the /hitoDS reference-shell composition only. Move the desktop Find in Hito DS query out
of the left sidebar and into a sticky, theme-aware blurred DS header. The header must show a
truthful current location on the left, and on the right an accessible icon-only Search trigger that
smoothly expands into the existing controlled DS query. Reuse the current Hito search behavior:
focus on open, matching/filtering and group expansion, clear, Escape, empty blur collapse, and a
non-empty query that stays visible. Do not duplicate query, navigation, or active-location state.

Move the existing theme preference UI from the desktop sidebar into a standard right-side menu while
preserving it as the sole theme-state owner. Do not render a language picker or create locale state;
leave only an architectural future slot. Preserve mobile browse/search as one coherent responsive
model rather than a second query truth.

Use existing Hito Button, Input, Icon, menu/sheet, motion, surface, focus, typography, spacing, and
breakpoint contracts. The Admin toolbar is behavioral evidence, not a component dependency. Do not
add a generic search framework, raw values, parallel CSS, new token, or new state registry. Remove
the desktop sidebar controls only after equivalent header behavior is reachable.

Validate source behavior, formatting, focused lint, DS validator, build when applicable, and fresh
browser replay in Dark/Light desktop and exact 375×812. Cover pointer and keyboard search, Escape,
focus return, theme switching, deep links, navigation filtering, responsive containment, and console
health. You may use bounded read-only QA or DESIGNER review if it materially improves evidence; do
not delegate DESIGN SYSTEM implementation. Update only this canonical item with a truthful English
receipt and return any cross-owner boundary to PRODUCT.
```

## Tracked Implementation Receipt — 2026-08-13

### Task and stage

- **Task:** Hito DS Header Search And Context Navigation.
- **Stage:** DESIGN SYSTEM Implementation DoD complete after final fresh-runtime replay.
- **Role file:** `agents/design-system.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- **Subagents:** none. The implementation and focused proof were completed by the primary Design
  System owner.

### Product outcome and demonstrated cause

The desktop sidebar no longer renders the query field or theme chooser. The existing sticky,
theme-aware `hito-workbench-topbar` now renders a canonical current-location trail, an icon-only
progressive Search action backed by the existing grouped navigation matching behavior, and the sole
existing theme-preference owner inside a standard menu. Desktop and mobile pass one controlled query
through `HitoDsNestedNav`; no second destination index, query state, theme state, language state, or
navigation registry was introduced.

The demonstrated first owner was the reference-shell composition: `HitoDsNestedNav` previously
owned its own query and therefore could not expose the same matching/filtering contract in the
header, while `reference-page.tsx` rendered discovery and theme only in the sidebar/mobile
composition. During browser replay, a second task-owned discriminator showed that Radix returned
focus to the Browse button when the controlled Sheet had been opened from the separate Search
button. The shell now records the actual opener element and prevents the default close autofocus so
focus returns to that opener without another state model.

### Files changed

- `src/components/hito-ds/reference-navigation.tsx` — converted the existing navigation search to a
  required controlled query, retained matching/group expansion/Escape behavior, and made the search
  field presentation optional for the desktop sidebar.
- `src/components/hito-ds/reference-page.tsx` — composed the responsive header, current location,
  progressive desktop Search, shared mobile query, theme menu, and explicit mobile opener focus
  return from existing primitives. The unrelated pre-existing non-Overview eyebrow deletion in this
  file was preserved and is not claimed by this task.
- `docs/tasks/backlog/2026-08-13-hito-ds-header-search-and-context-navigation.md` — recorded preflight,
  evidence, exact omissions, and the blocking external owner.

New runtime artifacts: **none**. No CSS, token, component family, helper file, framework, registry,
locale path, Product/Admin dependency, persistence path, or compatibility layer was added.

### Validation inventory

| Check                              | Scenario / environment                           | Result                                               | Evidence                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator               | Current shell/navigation source                  | Passed                                               | One shell-owned `query`; desktop navigation has `showSearch={false}`; mobile and desktop consume the same controlled query; `ThemePreferenceMenuItems` is the sole rendered preference owner.                                                                                                                                                   |
| Focused formatting                 | Prettier on both changed TSX files and this item | Passed                                               | All files match Prettier style.                                                                                                                                                                                                                                                                                                                 |
| Focused lint                       | ESLint on both changed TSX files                 | Passed                                               | No findings.                                                                                                                                                                                                                                                                                                                                    |
| Diff hygiene                       | `git diff --check`                               | Passed                                               | No whitespace errors.                                                                                                                                                                                                                                                                                                                           |
| DS validator                       | Full existing DS validator                       | External failure                                     | The only reported failure is the separate stale Brand invariant: `Brand background samples must own one truthful on-light and one on-dark tone while the favicon specimen reuses the canonical asset directly.` No task source was implicated or changed to mask it.                                                                            |
| Managed production build           | `qa_fixture` canonical runtime procedure         | Blocked after earlier green builds                   | Earlier task iterations produced a fresh/current/healthy managed artifact. After the final focus-return correction, the uncontended retry stops at `reference-overview-page.tsx:3:9`: `DataTableSpecimenPreview` is not exported by `specimen-previews.tsx`. This is an unrelated concurrently changed Overview seam and was not repaired here. |
| Desktop browser                    | Fresh managed artifact, 1470×801, Light and Dark | Passed before the final mobile-only focus correction | Sticky blurred semantic header, truthful location, icon-only Search, focus/filter/group expansion, clear, two-step Escape, empty-blur collapse, non-empty persistence, theme switching, deep link to Slider, zero horizontal overflow, and no console/runtime errors passed.                                                                    |
| Mobile browser                     | Fresh managed artifact, exact 375×812, Light     | Partial; source correction pending fresh replay      | Search opened the existing Sheet and focused the real query; filtering/group expansion, first Escape clear, containment, and zero overflow passed. Replay exposed incorrect close focus on Browse; the source correction now records and restores the actual Search opener but cannot be replayed until the external build break is resolved.   |
| Mobile Dark and final focus return | Exact 375×812 on the final source artifact       | Not run                                              | No fresh/current artifact can be admitted while the unrelated missing Overview export breaks the build. Dark mobile theme/menu, final Search focus return, final console health, and the final deep-link cell remain unclaimed.                                                                                                                 |

### Preserved boundaries and return condition

Product routes, Admin search, shared primitives, CSS/tokens, generated manifests, Local Inspector,
locale state, persistence, Backend, Figma, hosted state, and unrelated dirty work were not changed.
The managed server is currently stopped because the final build failed before runtime admission; no
ad hoc server or compatibility export was created.

At the time of the initial receipt, this task was **blocked for final implementation evidence**, not
for an additional product decision. PRODUCT returned the missing `DataTableSpecimenPreview`
export/import contract to the concurrent Overview owner; the closure replay below records the
subsequent fresh evidence. No Global QA, release readiness, hosted parity, deployment, or Figma
acceptance was claimed by the initial receipt.

### Closure replay — 2026-08-13

The prior blocked paragraph and three incomplete runtime rows above record the historical handoff
state. They are superseded by this final replay without rewriting the original evidence chronology.

| Check                    | Scenario / environment                           | Result                                     | Evidence                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed production build | Canonical `npm run local:fixture` (`qa_fixture`) | Passed                                     | Overview `DataTableSpecimenPreview` reachability was restored by its completed owner; the managed artifact is `current`, `fresh`, `healthy`, compatible, and loopback-bound.                                                                                                                                                                |
| Desktop Header Search    | 1470×801, Light and Dark                         | Passed                                     | Sticky blurred header, truthful Components/Slider and Components/Button locations, no sidebar search/theme duplication, pointer expansion, input focus, grouped filtering, clear, two-step Escape, empty-blur collapse, non-empty persistence, focus-visible return, theme switch, and deep-link navigation passed.                         |
| Mobile Header Search     | Exact 375×812, Dark and Light                    | Passed                                     | Search opened the same controlled query and focused it; filtering exposed only Slider and expanded Components; first Escape cleared without closing, second Escape closed and returned visible focus to `Search Hito DS`; Browse reused the same query and deep-linked to Slider; theme menu switched Dark/Light; zero horizontal overflow. |
| Console/runtime health   | Same four cells                                  | Passed                                     | No browser console entries, runtime errors, error overlay, clipped header actions, or blank content.                                                                                                                                                                                                                                        |
| Static checks            | Current final source                             | Passed with one external validator finding | Prettier, focused ESLint, and `git diff --check` passed. The full DS validator still reports only the unrelated Brand on-light/on-dark favicon assertion; no Header Search contract is implicated.                                                                                                                                          |

The Header Search implementation is **completed**. Product routes, Admin search, tokens/CSS,
generated manifests, Local Inspector, locale state, persistence, Backend, Figma, hosted state, and
unrelated dirty work remain unchanged. This is focused Implementation DoD only; no Global QA,
release readiness, hosted parity, deployment, or Figma acceptance is claimed.
