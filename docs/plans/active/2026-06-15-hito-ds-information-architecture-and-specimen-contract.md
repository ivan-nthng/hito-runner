# Hito DS Information Architecture And Specimen Contract

## Status

completed

## Type

plan

## Priority

high

## Next Recommended Role

product

## Task

Close the Hito DS information architecture and conformance work after accepted reference-truth
parity.

## Stage

FRONTEND reference-truth implementation and integrated QA / completed.

## Exact Handoff Prompt

None. The bounded conformance sequence is complete; future product or DS work requires a new
source-proved task outside this plan.

## Owner

ARCHITECT / DESIGNER / FRONTEND / QA

## Last Updated

2026-07-18

## Root Cause

Visible symptom:

- Hito DS is visibly established, but current product consumers and the reference surface do not yet
  conform to one shared owner in every material case.
- The strongest fresh failures are local selection/field recipes, incomplete semantic
  state/elevation ownership, mobile onboarding content occlusion, and bounded specimen parity drift.

Underlying cause:

- The DS foundations and specimen rollout were accepted in slices while runtime consumer migration
  continued separately.
- Shared CSS ownership is stronger than React/shared-component adoption in a few families, and some
  `/hitoDS` examples no longer prove the live runtime owner.

Canonical owner:

- Hito DS owns shared component, semantic token, and specimen contracts.
- FRONTEND owns route/product consumers that bypass existing Hito primitives.
- Rendering-view-model and compile defects remain separate from DS remediation.

## Conformance Closeout — 2026-07-18

Accepted result:

- Consumer control convergence and mobile onboarding clearance are accepted.
- Semantic state, soft elevation, and inline-edit interaction ownership are accepted across dark and
  light themes.
- `/hitoDS` now renders the real Avatar, editable value chip, native select, metadata tag, and admin
  operational table owners where their normal behavior is being demonstrated.
- Forced loading, empty, success, and error examples remain static because the reference is
  intentionally presenting visual states rather than a product async lifecycle.
- The workout appendix covers all 32 canonical workout identities, including
  `selected_distance_completion_or_checkpoint`; compile-time and module-load parity checks prevent a
  future exhaustive claim from silently drifting.
- No shared public contract, product route behavior, token, workout taxonomy, or backend truth
  changed in the reference-truth closure.

Decision:

- Complete this plan. Future DS work requires fresh source proof and a new bounded task.

## Service-Wide Conformance Audit — 2026-07-18

Canonical audit:

- [Service-Wide Hito DS Conformance Audit](../../tasks/frontend-specs/2026-07-18-service-wide-hito-ds-conformance-audit.md)

Decision:

- Select FRONTEND consumer control convergence as the first remediation batch: Quick setup goal
  cards and shared onboarding choices, Completion outcome/interval/RPE/actual-metric controls, and
  the narrow onboarding action clearance share one presentation/interaction risk and one
  browser/accessibility validation story.
- Existing choice-card, scale, field, mobile-nav, and safe-area contracts are sufficient. This batch
  does not justify a new shared primitive or Hito DS foundation change.
- `ThemePreferenceSection` currently prevents a clean build/browser gate. It is a mandatory
  same-owner precondition inside the FRONTEND fix-forward loop, not a separate DS redesign or a
  reason to defer the consumer batch.
- The audit's original `data-mode="quick"` diagnosis is superseded: current `OnboardingGate` does
  not mount that attribute. The visible 375px occlusion remains valid, but implementation must
  identify the actual computed-layout owner and delete the dead selector if it has no consumer.
- Preserve the accepted workout-color, calendar-day, manual-editor geometry, and `/test-calendar`
  boundaries.

Residual findings outside this conformance closeout:

- Calendar Button compatibility, metric/title composition, root 404, admin mobile-title
  reproduction, motion, and technical prompt-block cleanup remain unselected audit findings.

## Architecture Decision

Create this new canonical DS IA plan instead of extending the existing workout-library plan.

Reason:

- The existing day-state/test-calendar plan is intentionally about one split:
  `/hitoDS` day-state specimens versus `/test-calendar` fake product-flow sandbox.
- The dropdown/calendar normalization spec is section-specific.
- This reset is broader: it defines how every component page in `/hitoDS` should be organized.

This plan becomes the canonical owner for `/hitoDS` page IA and component specimen grammar.

Existing narrower docs remain valid only as subordinate inputs:

- The archived day-state/test-calendar plan remains historical evidence for the separate
  `/test-calendar` product-design sandbox direction; it no longer owns active execution while no TC3
  slice is selected.
- The dropdown/calendar normalization spec remains source context for the dropdown row family and
  calendar primitive issues, but no longer owns global `/hitoDS` IA.
- The completed mobile dropdown fullscreen backlog remains historical implementation evidence. Its
  older "only long/grouped/nested mobile menus must escalate" boundary is superseded for future work
  by the adaptive global mobile menu escalation rule in this plan.

## Canonical `/hitoDS` Navigation IA

`/hitoDS` should not be one endless desert by default. It may remain one route with deep links during
incremental migration, or later split into separate `/hitoDS` pages, as long as the IA remains stable
and existing deep links are preserved or redirected.

Required top-level order:

1. Overview
2. Foundations
3. Components
4. Patterns
5. Tools / Bridge
6. Backlog / Known gaps

### Overview

Purpose:

- explain what `/hitoDS` is
- name the source hierarchy
- link to the most important starting points

Allowed sections:

- Start here
- Source hierarchy
- How to read specimens

### Foundations

Foundations come before components.

Allowed sections:

- Brand
- Color / semantic tokens
- Primitive colors, if still useful
- Typography
- Spacing
- Radius / borders / elevation
- Icons
- Motion, only when actual motion rules exist

Foundation pages do not need Demo / Variants tabs unless they show an interactive primitive. They
should still use the same header, status, contract rows, token copy, and Hito DS controls where
controls exist.

### Components

Reusable UI components live here, not hidden under Patterns.

Initial component list:

- Buttons
- Inputs / textareas / date-time fields
- Selection controls
- Tabs
- Dropdowns / menus / selects
- Dialogs / sheets
- Status pills / markers
- Calendar day / workout row
- Data table
- Toasts / async action feedback
- Shell/profile menu primitives

Every component section must use the shared specimen-page contract below.

### Patterns

Patterns are compositions made from components. They should not be a dumping ground for component
specimens.

Allowed sections:

- Product calendar composition
- Workout detail composition
- Admin table/filter composition
- Empty/loading/error/success states
- Editorial/changelog patterns
- Analytics/summary truth
- Shell navigation patterns

Patterns may use the specimen workbench when useful, but they are allowed to have richer context than
atomic components.

### Tools / Bridge

Allowed sections:

- Figma export/import board
- Code Connect / Dev Resources notes when implemented
- Token/component mapping tables

Figma remains a DS artifact and handoff/sync target, not runtime truth.

### Backlog / Known Gaps

Allowed sections:

- deprecated or legacy specimens
- future component gaps
- known visual debt
- migration notes

## Shared Component Specimen-Page Contract

Every component page/section must follow this anatomy.

### 1. Header

Required:

- component label
- clear title
- short body explaining what the component owns
- status pill: `Core`, `Pattern`, `In rollout`, `Exception`, or `Legacy`
- optional source links to product usage

### 2. Left Specimen Area

Desktop:

- left side is the primary specimen stage
- right side is settings

Mobile:

- tabs stay first
- settings may collapse below the specimen or into a disclosure if needed
- no horizontal overflow

The left specimen area has exactly two primary tabs:

- `Demo`
- `Variants`

`Demo` means:

- one realistic, product-shaped use case
- interactive only when interaction is part of the component contract
- not a stress grid
- not a fake product flow unless the component itself is a flow primitive

`Variants` means:

- systematic state coverage
- sizes, tones, densities, disabled, selected, destructive, loading, error/success, empty states, and
  responsive variants where relevant
- compact grids/tables/lists are allowed
- avoid card walls unless the component is actually a card component

### 3. Right Settings Area

Settings must be grouped and understandable.

Allowed setting groups:

- Mode / specimen state
- Anatomy
- Content
- State
- Density / size
- Behavior
- Data fixture
- Accessibility
- Boundary notes

Not every component needs every group.

Settings must use Hito DS primitives:

- `hito-button` / shared `Button`
- `hito-tab` / tab classes
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem`
- `DropdownMenu`
- `hito-field`
- `hito-control-label`
- status pills / markers
- Hito icons
- Hito menu row classes

Forbidden settings patterns:

- random route-local button grids when a DS tab/segmented button/Select pattern exists
- naked browser inputs without Hito field/control classes
- local color/spacing recipes
- settings that imply product persistence, backend mutation, auth, provider sync, AI, or route state
- settings panels that require the reader to infer what is being demonstrated

### Global Mobile Menu Escalation Rule

This plan is the canonical Hito DS source for mobile menu escalation.

On mobile/narrow sizes, dropdowns, selects, context menus, nested menus, and page-switching menus
default to adaptive escalation instead of cramped anchored popover cards inside the page. Anchored
popover/dropdown cards remain the desktop/tablet default; they are not the mobile default.

Decision tree:

- small/simple action menus may open as a bottom sheet
- large, long, nested, dense, picker-like, or page-switching menus open as a fullscreen or
  full-height Hito navigation surface
- if a menu is hard to scan, risks viewport clipping, or needs more than one navigation level, use
  the fullscreen/full-height side of the rule

Required mobile anatomy:

- both bottom-sheet and fullscreen/full-height variants use a top Hito header with a clear title and
  close affordance
- nested levels use a back affordance in the same header while close remains available
- rows use Hito menu/list-row typography, icons, metadata, selected, disabled, destructive, and
  divider rules
- body content scrolls inside the surface when needed without horizontal overflow
- triggers may still use `DropdownMenu`, `Select`, or context-menu semantics, but the mobile
  presentation escalates through the existing Sheet/Dialog overlay and header/body language
- implementation reuses `DropdownMenu`, `Select`, `Sheet`/`Dialog`, `hito-product-dialog`,
  `hito-product-dialog-header`, `hito-product-dialog-body-scroll-fill`, `hito-row-group`,
  `hito-list-row`, Hito icons, and existing typography/surface classes before adding anything new

Exceptions:

- custom anchored mobile menu exceptions require explicit Product approval
- do not create a parallel mobile menu framework; extend the existing Hito DS dropdown/select and
  overlay owners instead
- do not use mobile escalation to change product behavior, backend truth, persistence, auth,
  provider sync, or route state

Current `/hitoDS` implication:

- the mobile `Browse DS pages` jump menu is a page-switching menu; under this rule, it likely
  belongs to the fullscreen/full-height side of the decision tree
- that classification is not evidence that small/simple mobile action menus must also become
  fullscreen; those may use the bottom-sheet side of the rule
- this is an implementation follow-up only; the source-of-truth decision above is active now

### 4. Contract Rows

Every component specimen must preserve:

- `Proves`
- `Does not imply`
- `Used in`

Optional rows:

- `Source owner`
- `Migration note`
- `Known gap`

## Current Drifting Sections To Remove Or Deprecate

The first Frontend slice should inspect and clean only what is needed for the pilot, but the
accepted direction is:

- Converge `HitoDsPlayground` and `SpecimenSection` into one component-specimen workbench contract
  or make one wrap the other. Do not keep two competing page APIs long-term.
- Change dropdown section language from `Interactive demo` / `Dropdown anatomy` to `Demo` /
  `Variants`.
- Change calendar controls from a broad custom control grid into grouped right-side settings.
- Make the calendar `Demo` tab feel like the real product day-cell/mobile-row rhythm, not an
  abstract tile sample.
- Keep `Variants` for exhaustive calendar day states.
- Demote `/hitoDS#workout-library-playground` from primary component navigation if it still competes
  with the calendar-day specimen. It may become a secondary taxonomy/reference note, or move toward
  `/test-calendar` if the work is product-flow review.
- Do not use `/hitoDS` as a full fake product calendar. `/test-calendar` remains the separate
  product-design sandbox if that track is selected later.

## First Implementation Slice

Selected next gate:

`FRONTEND Slice 1: shared Hito DS specimen workbench plus Dropdowns and Calendar pilot migration`.

2026-06-15 frontend implementation note:

- Shared `HitoDsPlayground` now supports the canonical `Demo` / `Variants` specimen workbench.
- `/hitoDS#dropdowns` and `/hitoDS#calendar-workout-playground` are the two migrated pilot
  sections.
- Calendar day/workout row moved into the Components nav group while preserving the existing
  `#calendar-workout-playground` deep link.
- Status: implemented and QA-passed.

Why this is the smallest safe first slice:

- Dropdowns already have a nearly complete specimen; mapping its modes to Demo / Variants proves the
  contract with low product risk.
- Calendar is the user-reported pain point and already uses shared presentational primitives.
- Two pilot sections are enough to validate the page model without rewriting every `/hitoDS`
  section.
- Product runtime stays untouched.

In scope:

- `/hitoDS` nav IA labels/order where needed.
- Shared component-specimen workbench anatomy.
- Dropdowns pilot.
- Calendar day/workout row pilot.
- Clear demotion of competing workout-library/taxonomy ownership if it still appears as a primary
  component target.

Out of scope:

- full `/hitoDS` migration
- product calendar runtime
- `/test-calendar` implementation
- workout detail runtime
- Supabase/server actions/provider sync/OpenAI
- Figma file mutation
- broad CSS rewrite
- route split into many pages unless Frontend proves it is smaller and safer than preserving the
  current route with deep links for Slice 1

## QA Expectations

Slice 1, Slice 2, and Slice 3 QA acceptance are complete.

Required proof:

- `/hitoDS` loads.
- Foundations appear before Components.
- Dropdowns and Calendar sections use `Demo` and `Variants`.
- The specimen stage is visually primary.
- Settings are grouped and readable.
- Settings controls reuse Hito DS primitives.
- Existing deep links still work.
- `WorkoutLibraryPlayground` no longer competes as the accepted full fake calendar target.
- Desktop and `375px` mobile have no horizontal overflow.

Accepted 2026-06-15 QA result:

- Pilot sections passed.
- Shared workbench contract is now real.
- Pilot-section mobile overflow is clean.
- Remaining full-page mobile overflow belongs to older non-pilot sections and does not reopen Slice 1.

Accepted 2026-06-15 Slice 3 QA result:

- `#status`, `#modals`, and `#async-actions` now pass on the shared workbench contract.
- Desktop and `375px` mobile section-level overflow is clean for the migrated Slice 3 sections.
- Accepted Slice 1 and Slice 2 sections stayed intact during the rerun.

## Post-Pilot Rollout Decision - 2026-06-15

Slice 1 is accepted. The next issue is rollout sequencing, not pilot correctness.

Decision:

- Select `FRONTEND Slice 2: core controls workbench migration and migrated-section overflow guard`.
- Keep `/test-calendar` paused; it is a product-design sandbox and should not interrupt the DS IA
  rollout immediately after the pilot.
- Keep the dropdown/calendar normalization spec as completed subordinate history/context; it no
  longer owns execution.

Why this is the safest next slice:

- The accepted workbench should next cover the most reused component primitives before richer
  product patterns.
- `Buttons`, `Inputs`, `Tabs`, and `Selection controls` already exist in `/hitoDS`, but they still
  use older section grammar or route-local anatomy.
- Migrating one core controls group exercises settings, Demo, Variants, contract rows, and mobile
  containment without touching product runtime.
- Fixing migrated-section/page-shell overflow addresses the active symptom without pretending every
  legacy section is migrated.

In scope for Slice 2:

- `/hitoDS#buttons`
- `/hitoDS#inputs`
- `/hitoDS#tabs`
- `/hitoDS#selection-controls`
- shared `HitoDsPlayground` adjustments only when they directly support the migrated group
- migrated-group mobile and page-shell overflow containment

Out of scope for Slice 2:

- all remaining component sections
- Foundations redesign
- Patterns migration
- `/test-calendar`
- Figma export/import implementation
- product calendar/workout runtime
- route splitting unless Frontend proves it is smaller and safer than preserving deep links

Expected proof from Slice 2:

- the four migrated sections use the shared `Demo` / `Variants` workbench
- grouped settings are readable and reuse Hito DS primitives
- `Proves`, `Does not imply`, and `Used in` rows are present
- existing deep links still resolve
- accepted dropdown/calendar pilot behavior is preserved
- desktop and `375px` mobile have no horizontal overflow for the migrated group and shared shell

2026-06-15 Slice 2 implementation note:

- `/hitoDS#buttons`, `/hitoDS#inputs`, `/hitoDS#tabs`, and `/hitoDS#selection-controls` now use
  the shared `HitoDsPlayground` `Demo` / `Variants` workbench.
- The migrated sections keep grouped right-side settings, footer contract rows, and existing deep
  links.
- Local overflow guards were added to migrated specimen rows that can widen on small screens.
- Status: implemented.

2026-06-15 Slice 2 QA follow-up note:

- The remaining local mobile overflow in `/hitoDS#tabs` `Variants` mode was fixed by making the
  state-matrix specimen wrap inside the shared workbench stage instead of widening the section.
- QA rerun passed.
- Slice 2 is now accepted.

## Post-Slice-2 Rollout Decision - 2026-06-15

Slice 2 is accepted. The next issue is still rollout sequencing, not component correctness inside
the accepted slices.

Decision:

- Select `FRONTEND Slice 3: Status, Modals, and Async Actions workbench migration`.
- Keep `/test-calendar` paused. It remains a future product-design sandbox and should not compete
  with the DS IA rollout while core feedback/action primitives are still outside the shared
  specimen grammar.
- Keep accepted Slice 1 and Slice 2 sections closed unless a concrete regression appears.

Why this is the safest next slice:

- `Status`, `Modals`, and `Async Actions` are high-reuse feedback/action primitives used across
  product and admin surfaces.
- `Status` still uses the older `SpecimenSection` grammar, while `Modals` and `Async Actions`
  already use the shared component but need the accepted `Demo` / `Variants` structure and grouped
  settings discipline.
- This slice continues the DS IA rollout without touching product runtime routes, backend seams, or
  the paused `/test-calendar` sandbox.
- It is more valuable than migrating foundations immediately because foundations do not always need
  the Demo / Variants workbench, and more bounded than migrating all remaining Patterns at once.

In scope for Slice 3:

- `/hitoDS#status`
- `/hitoDS#modals`
- `/hitoDS#async-actions`
- small shared `HitoDsPlayground` adjustments only when required by these sections
- demoting duplicate dialog/sheet ownership from `/hitoDS#shared-wrappers` if it competes with the
  migrated modal specimen
- migrated-section mobile overflow containment

Out of scope for Slice 3:

- all remaining Patterns
- Foundations redesign
- `/test-calendar`
- Figma export/import implementation
- product calendar/workout runtime
- backend/Supabase/provider/OpenAI/auth seams
- route splitting unless Frontend proves it is smaller and safer than preserving deep links

Expected proof from Slice 3:

- the three migrated sections use the shared `Demo` / `Variants` workbench
- grouped settings are readable and reuse Hito DS primitives
- `Proves`, `Does not imply`, and `Used in` rows are present
- existing deep links still resolve
- accepted Slice 1 and Slice 2 behavior is preserved
- desktop and `375px` mobile have no horizontal overflow for the migrated Slice 3 sections

2026-06-15 Slice 3 implementation note:

- `/hitoDS#status`, `/hitoDS#modals`, and `/hitoDS#async-actions` now use the shared
  `HitoDsPlayground` `Demo` / `Variants` workbench.
- Status moved off the older `SpecimenSection` grammar; Modals and Async Actions kept their existing
  shared primitives but now expose systematic variants instead of a single preview.
- A narrow specimen-only toast width override keeps static async toast cards contained inside the
  workbench without changing runtime toast behavior.
- Status: implemented.

2026-06-15 Slice 3 QA follow-up note:

- QA rerun passed.
- Slice 3 is now accepted.

## Post-Slice-3 Rollout Decision - 2026-06-15

Slice 3 is accepted. The active risk is now rollout ambiguity, not correctness inside the accepted
workbench sections.

Decision:

- Select `FRONTEND Slice 4: operational patterns workbench migration`.
- Migrate `/hitoDS#data-table`, `/hitoDS#rows`, and `/hitoDS#shell`.
- Keep `/test-calendar` paused. It remains a valid future product-design sandbox, but it should not
  interrupt DS IA rollout while high-use operational patterns still sit outside the shared specimen
  contract.
- Keep accepted Slice 1, Slice 2, and Slice 3 sections closed unless a concrete regression appears.

Why this is the safest next slice:

- `Data table`, `Rows`, and `Shell nav` are product/admin operational patterns that teams use to
  reason about dense data, action rows, navigation, and account chrome.
- They are still older `/hitoDS` sections, so migrating them reduces real source-of-truth drift
  without touching product runtime behavior.
- This is more valuable than reactivating `/test-calendar` immediately because the DS grammar should
  finish covering reusable operational primitives before a product-flow sandbox competes for
  attention again.
- This is safer than migrating `#states` next because `#states` overlaps accepted status/async
  primitives and likely needs a separate demotion/consolidation decision.
- This is safer than migrating `#shared-wrappers` next because wrapper specimens duplicate parts of
  accepted Dropdowns, Modals, Inputs, and Selection Controls; they should be demoted or merged only
  after the higher-value pattern sections are stable.

In scope for Slice 4:

- `/hitoDS#data-table`
- `/hitoDS#rows`
- `/hitoDS#shell`
- small shared `HitoDsPlayground` adjustments only when required by these sections
- migrated-section desktop and `375px` mobile overflow containment
- preservation of accepted Slice 1, Slice 2, and Slice 3 deep links and behavior

Out of scope for Slice 4:

- `/test-calendar`
- `#states`
- `#shared-wrappers`
- `#analytics`
- `#workout-library-playground`
- Foundations redesign
- Figma export/import implementation
- product calendar/workout runtime
- backend/Supabase/provider/OpenAI/auth seams
- route splitting unless Frontend proves it is smaller and safer than preserving deep links

Expected proof from Slice 4:

- the three migrated sections use the shared `Demo` / `Variants` workbench
- grouped settings, when present, are readable and reuse Hito DS primitives
- `Proves`, `Does not imply`, and `Used in` rows are present
- existing deep links still resolve
- accepted Slice 1, Slice 2, and Slice 3 behavior is preserved
- desktop and `375px` mobile have no horizontal overflow for the migrated Slice 4 sections

2026-06-15 Slice 4 implementation note:

- `/hitoDS#data-table`, `/hitoDS#rows`, and `/hitoDS#shell` now use the shared
  `HitoDsPlayground` `Demo` / `Variants` workbench.
- The migrated sections reuse existing Hito DS controls and primitives:
  `DataTableSpecimenPreview`, `ToggleRow`, `ChoiceSelector`, `MenuRow`, `hito-list-row`,
  `hito-disclosure`, `hito-shell-nav`, and `hito-shell-profile-trigger`.
- No product runtime table, row, shell, calendar, workout, backend, auth, provider, or
  `/test-calendar` behavior was changed.
- Status: implemented.

2026-06-15 Slice 4 QA follow-up note:

- QA rerun passed.
- Slice 4 is now accepted.

## Post-Slice-4 Rollout Decision - 2026-06-15

Slice 4 is accepted. The active risk is no longer correctness inside the migrated workbench groups.
The remaining DS IA risk is that an older compatibility-wrapper specimen still looks like a primary
component owner.

Decision:

- Select `FRONTEND Slice 5: shared wrapper compatibility demotion and owner consolidation`.
- Keep `/test-calendar` paused. It remains a valid future product-design sandbox, but the DS should
  first remove the remaining duplicated component-owner signal inside `/hitoDS`.
- Keep accepted Slice 1, Slice 2, Slice 3, and Slice 4 sections closed unless a concrete regression
  appears.

Why this is the safest next slice:

- `/hitoDS#shared-wrappers` now duplicates accepted owners: Dropdowns, Inputs, Selection, Modals,
  Rows, Shell, and related Status/Async primitives.
- Demoting one duplicate section reduces source-of-truth drift without touching product runtime,
  backend seams, or the paused `/test-calendar` product sandbox.
- This is more valuable than migrating all remaining Patterns because it removes a competing owner
  before teams keep consulting it.
- This is safer than deleting wrapper information outright because wrapper exports and accessibility
  behavior remain real implementation facts.

In scope for Slice 5:

- `/hitoDS#shared-wrappers`
- Components nav cleanup for the wrapper entry
- preservation of the `#shared-wrappers` deep link as a compact compatibility/reference anchor
- compact contract notes that point to accepted owner sections instead of duplicating specimens
- desktop and `375px` mobile overflow containment for the changed area

Out of scope for Slice 5:

- `/test-calendar`
- `#states`
- `#analytics`
- `#surfaces`
- `#workout-library-playground`
- Foundations redesign
- Figma export/import implementation
- product calendar/workout runtime
- backend/Supabase/provider/OpenAI/auth seams
- changing shared UI primitive exports or Radix behavior

Expected proof from Slice 5:

- `#shared-wrappers` no longer appears as a competing primary component specimen.
- The deep link `/hitoDS#shared-wrappers` still resolves to a clear compatibility/reference note.
- The reference note names the accepted owner sections for Dropdowns, Inputs, Selection, Modals,
  Rows, Shell, and Status/Async where relevant.
- Accepted Slice 1, Slice 2, Slice 3, and Slice 4 behavior and deep links are preserved.
- `/test-calendar` remains paused and unimplemented.
- Desktop and `375px` mobile have no horizontal overflow for the changed wrapper reference area.

2026-06-16 Slice 5 implementation note:

- `/hitoDS#shared-wrappers` was removed from primary Components navigation and preserved as a
  compact `Wrapper notes` compatibility/reference anchor near Backlog.
- Duplicate wrapper specimen cards for select/dropdown, dialog/sheet, progress/card, and sidebar
  behavior were removed from the section.
- The wrapper reference now points readers to the accepted owner sections for Dropdowns, Inputs,
  Selection, Modals, Rows, Shell, Status, and Async Actions while preserving stable wrapper export
  and Radix behavior facts.
- No wrapper exports, runtime APIs, product routes, backend seams, auth seams, provider seams, or
  `/test-calendar` behavior changed.
- Status: implemented.

2026-06-16 Slice 5 QA follow-up note:

- QA rerun passed.
- Slice 5 is now accepted.

## Post-Slice-5 Rollout Decision - 2026-06-16

Slice 5 is accepted. The active risk is no longer duplicate wrapper ownership; it is the remaining
IA gap between the accepted component/pattern workbench and the already implemented Figma export
surface.

Decision:

- Select `FRONTEND Slice 6: Tools / Bridge and Figma export entrypoint integration`.
- Keep `/test-calendar` paused. It remains a valid future product-design sandbox, but it should not
  compete with the DS IA until `/hitoDS` exposes its own Tools / Bridge zone clearly.
- Keep accepted Slice 1, Slice 2, Slice 3, Slice 4, and Slice 5 sections closed unless a concrete
  regression appears.

Why this is the safest next slice:

- The canonical IA already reserves `Tools / Bridge` for Figma export/import, Code Connect, Dev
  Resources, and token/component mapping notes.
- The code-owned Figma export board already exists, so the next gap is discoverability and
  source-of-truth framing, not a new implementation system.
- This is smaller and safer than reactivating `/test-calendar`, because it does not create a fake
  product-flow surface or touch product calendar/workout runtime.
- This is safer than migrating all remaining non-workbench pattern sections because it closes one
  explicit IA contract gap without broad section migration.

In scope for Slice 6:

- Add an explicit `Tools / Bridge` navigation group or equivalent canonical IA entry to `/hitoDS`.
- Add a compact Figma/html.to.design bridge section inside `/hitoDS`.
- Link to the existing code-owned export board route.
- Explain that code-owned Hito DS remains source of truth and Figma/html.to.design is downstream
  capture/import.
- Reuse existing Hito DS rows, status pills, buttons/links, labels, captions, and page rhythm.
- Preserve accepted Slice 1-5 sections and deep links.

Out of scope for Slice 6:

- `/test-calendar`
- Figma API calls or Figma file mutation
- Code Connect implementation
- rebuilding the existing export board
- route-splitting the whole `/hitoDS`
- product calendar/workout runtime
- backend/Supabase/provider/OpenAI/auth seams
- broad migration of `#surfaces`, `#states`, `#analytics`, or `#workout-library-playground`

Expected proof from Slice 6:

- `/hitoDS` loads.
- `Tools / Bridge` appears in the DS IA.
- The Figma/html.to.design bridge section is reachable by deep link.
- The bridge links to the existing export board route, and that route still loads.
- Accepted Slice 1, Slice 2, Slice 3, Slice 4, and Slice 5 sections and deep links are preserved.
- `/test-calendar` remains paused and unimplemented.
- Desktop and `375px` mobile have no horizontal overflow for the changed area.

2026-06-16 Slice 6 implementation note:

- `/hitoDS` now includes a `Tools / Bridge` navigation group with a compact `Figma export` entry.
- The new `/hitoDS#figma-bridge` section links to the existing code-owned export board at
  `/hitoDS/export/figma`.
- The bridge explains that Hito code and DS owner sections remain source of truth, while
  html.to.design/Figma import is a downstream handoff artifact.
- No export-board rebuild, Figma API call, Code Connect implementation, product runtime change,
  backend seam, auth seam, provider seam, OpenAI seam, or `/test-calendar` work was included.
- Status: implemented; QA rerun is next.

2026-06-16 Slice 6 QA repair note:

- QA passed the bridge section, export route, boundary copy, overflow, and accepted-slice regression
  checks, but failed desktop nav discoverability because the single-section nav renderer showed the
  group label `Tools / Bridge` instead of the section label `Figma export`.
- The DS nav now renders the visible single-section link for this group as `Figma export` while
  preserving the `#figma-bridge` anchor, bridge section copy, and existing export route.
- Status: implemented; QA rerun is next.

2026-06-16 Slice 6 QA follow-up note:

- QA rerun passed.
- Slice 6 is now accepted.

## Post-Slice-6 Sequencing Decision - 2026-06-16

Slice 6 is accepted. The active risk is no longer `/hitoDS` IA correctness or Figma export
discoverability. The remaining sequencing risk is letting `/hitoDS` rollout and the paused
`/test-calendar` product-design sandbox compete for ownership again.

Decision:

- Reactivate `/test-calendar` as the next bounded owner.
- Pause further `/hitoDS` rollout implementation unless a concrete regression or source-of-truth drift
  appears.
- Keep `/hitoDS` as the component/specimen and Figma bridge source, not the fake product-flow
  sandbox.
- Sync the day-state/test-calendar plan so it owns the next Frontend implementation slice.

Why this is the safest next slice:

- The original blocker for `/test-calendar` was unresolved DS IA and Figma bridge discoverability.
  Slice 1-6 closed that blocker.
- Product/Design still needs one product-like fake calendar sandbox, and the accepted architecture
  already says that belongs at `/test-calendar`, not under `/hitoDS`.
- Continuing to migrate lower-priority `/hitoDS` sections now risks DS cleanup by inertia while the
  product-flow review surface remains unavailable.
- The slice can stay static/fake and frontend-only, preserving product runtime, backend, Supabase,
  provider, OpenAI, and auth boundaries.

Selected next gate:

`FRONTEND Slice TC1: /test-calendar fake product-design sandbox MVP`.

In scope for TC1:

- Direct `/test-calendar` route.
- Static fake fixtures only.
- Product-like fake calendar using existing Hito calendar visual rhythm and shared day-row/cell
  primitives where safe.
- Fake workout/rest day coverage for the visible calendar.
- Fake day click to fake workout-detail modal/sheet.
- Structure/segments, result state, feedback/evidence/provider state, and static recommendation copy.
- Floating top-right settings button with fake visual-state toggles.

Out of scope for TC1:

- `/hitoDS` redesign or reopening accepted Slice 1-6.
- Real product calendar/workout route behavior.
- Supabase, server actions, provider upload/sync, OpenAI, auth, persistence, or real mutations.
- QR/share/import, recurrence, edit workout, Restore UI, generated-plan mutation, or active-plan
  replacement.

Expected proof from TC1:

- `/test-calendar` loads directly.
- Clicking fake days opens fake detail.
- Settings toggles affect fake state only.
- `/hitoDS`, accepted Slice 1-6 anchors, and `/hitoDS/export/figma` remain healthy.
- Source proof shows no Supabase/server-action/provider/OpenAI/auth/persistence mutation path.
- Desktop and `375px` mobile have no horizontal overflow.

## Post-TC1 Sandbox Sequencing Decision - 2026-06-16

TC1 is accepted. The active risk is no longer `/hitoDS` IA correctness, Figma bridge
discoverability, or the existence of the static sandbox MVP. The remaining risk is letting a
working sandbox grow by frontend momentum before Product/Design names what the next fake product
review slice must actually prove.

Decision:

- Select `DESIGNER Slice TC2: /test-calendar product-design review and next-slice specification`.
- Do not route immediately to Frontend for another sandbox implementation slice.
- Do not pause `/test-calendar` indefinitely after TC1; continue through a design/spec gate that
  can either declare the MVP sufficient or define one bounded implementation slice.
- Keep `/hitoDS` stable as the accepted DS/specimen/Figma bridge owner.

Why this is the safest next gate:

- TC1 already proves the sandbox can exist without backend, auth, provider, OpenAI, persistence, or
  product-runtime mutation paths.
- The unresolved seam is product-design usefulness, not technical feasibility.
- `src/components/test-calendar/test-calendar-sandbox.tsx` is already near the 700-line hotspot
  threshold, so any TC2 implementation should first be justified and scoped by a design spec that
  also requires decomposition before substantial growth.
- This prevents `/test-calendar` from becoming a second product runtime and prevents `/hitoDS` from
  absorbing product-flow review again.

Selected next gate:

`DESIGNER Slice TC2: /test-calendar product-design review and next-slice specification`.

## Post-TC2 Sandbox Sequencing Decision - 2026-06-16

TC2 is accepted. The active risk is no longer `/hitoDS` IA correctness, Figma bridge
discoverability, sandbox existence, scenario coherence, static-only boundary proof, or shared
calendar-day presentation drift.

Decision:

- Pause `/test-calendar` as sufficient for now.
- Do not select a TC3 implementation slice.
- Keep `/hitoDS` stable as the accepted DS/specimen/Figma bridge owner.
- Keep `/test-calendar` available as the separate static fake-only product-design sandbox.
- Keep real product routes as the owners of persisted calendar/workout behavior.

Why this is the safest next decision:

- The original blocker for `/test-calendar` was unresolved DS IA and Figma bridge discoverability;
  Slice 1-6 closed that blocker.
- TC1 proved the sandbox could exist without backend, auth, provider, OpenAI, persistence, or
  product-runtime mutation paths.
- TC2 proved coherent scenario presets and shared calendar-day presentation parity with the real
  product calendar.
- Further sandbox work now needs a concrete Product/Design review gap; otherwise it risks fake-route
  expansion by inertia.

Future reopen rule:

- Reopen only if Product/Design identifies a concrete review gap that TC1/TC2 cannot answer.
- Any future `/test-calendar` implementation must remain static/fake-only and pass through one
  bounded Architecture checkpoint before Frontend work.

## Workbench V2 Implementation Note - 2026-06-17

FRONTEND Slice G8 follow-up implementation moved the shared `HitoDsPlayground` presentation contract
toward the accepted v2 model:

- `Demo` / `Variants` tabs now control the whole workbench section instead of sitting inside the
  specimen stage.
- Demo mode presents one centered specimen in a calmer, taller stage.
- Variants mode removes the oversized inner stage treatment and leaves the family view as the main
  actor.
- Right-side controls use the same Hito row/control grammar with lighter mode-aware surfaces.
- `/hitoDS#data-table` now uses the same DropdownMenu-backed header trigger/menu pattern as real
  Hito admin/product tables, including sortable/filtered/hover/active states and visible sort menu
  options.

Status: implemented; QA rerun is next.

## Shared Calendar-Day Historical Chrome Closeout - 2026-06-18

This shared calendar-day regression is now closed.

Accepted proof:

- Past `Rest` days no longer render through signal-accent selection chrome.
- Calm historical `rest` and `outside-month` selected states now use neutral chrome instead of the
  stronger signal treatment reserved for workout selection, today, focus, and valid action-target
  states.
- The fix was applied in the shared `HitoCalendarDayCell` / `HitoWorkoutDayRow` owner, not as a
  `/test-calendar`-only override.
- QA passed the fix on `/test-calendar` desktop and `375px` mobile plus `/hitoDS` calendar
  specimen readback, with no overflow or console regressions in the checked scope.

Boundaries preserved:

- No backend or business-logic contract changed.
- No calendar-day presentation mapping rewrite was needed.
- Product calendar, `/test-calendar`, and `/hitoDS` continue consuming the same shared
  calendar-day primitives.

Decision:

- Treat this regression as closed and do not reopen it unless a new shared primitive regression is
  found.
- Keep this broader DS IA plan active for other `/hitoDS` and shared specimen follow-up; this note
  closes only the historical rest-day chrome bug.

## Workout Color-Token DS Closeout - 2026-06-26

Accepted status:

- FRONTEND implemented workout color as a Hito DS token contract, not as route-local hex
  replacement.
- `src/styles.css` now owns primitive workout scales `50..950` plus semantic workout type and
  workout section slots.
- `src/lib/workout-color-tokens.ts` is the shared helper/readback seam for workout type and section
  color variables.
- `/hitoDS` documents the accepted workout roles and section roles, including the rule that workout
  colors describe training identity rather than CTA hierarchy.
- Workout roles are Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills,
  and Run/Walk.
- Section roles are Warm-up, Run, Work, Recover, Finish, and Cooldown.
- Repeat set remains structural-only: its children carry Work / Recover colors, and there is no
  standalone semantic repeat color token.
- The color contract lives in Hito DS token/rendering-view-model code. It does not change backend
  schema, workout identities, plan engine behavior, or metric truth.

QA proof:

- Browser proof for the workout color-token DS implementation passed in the reported scope.
- No runtime/backend/schema/source-of-truth conflict was found with planned-workout language or
  manual constructor segment/repeat doctrine.

Selected next gate:

Closed by the accepted 2026-06-27 frontend timeline adoption. No immediate Hito DS implementation
gate remains from this chain.

Reason:

- Backend already emits `manual_workout_constructor_contract_v1` with a `timeline` read model from
  the manual draft review seam.
- Frontend now renders that backend-shaped timeline using existing Hito DS list/status primitives and
  accepted workout/section color-token doctrine.
- The remaining manual-authoring question is target-input policy, which is Product/Backend contract
  work rather than DS implementation.

## Manual Constructor Timeline Adoption Closeout - 2026-06-27

Accepted status:

- Frontend manual Review add UI now consumes backend-owned `constructorContract.timeline`.
- Structural repeat groups render as compact ordered groups such as `6x [Work 2 min + Recover 1 min]`
  with child Work/Recover rows.
- Old review bullet reconstruction and visible `Editable HR guide` copy are no longer part of the
  accepted UI proof.
- Repeat set remains structural-only with no standalone section color token.
- Reported validation passed targeted ESLint, manual authoring validators, constructor contract proof,
  build, browser desktop and exact 375px checks, clean console evidence, and disposable fixture cleanup.

Decision:

- Close the manual constructor timeline gate in this DS plan.
- Do not select another DS implementation slice from this chain unless fresh source proof shows a
  shared Hito DS ownership gap.

## Workout Slice Visual And Cache Runtime QA Closeout - 2026-06-28

Accepted status:

- QA passed the workout-slice visual proof over the relocated managed local QA runtime.
- The managed QA runtime is served from
  `/Users/ivan/Library/Caches/hito-running/hito-running-4c6fe31a228f/qa-runtime`, outside the
  iCloud workspace. `.output` remains Nitro build staging, and `logs/build-output-finalized` is not
  the served runtime source.
- `/hitoDS` rendered workout type colors and section role colors.
- Repeat set remains structural-only with no standalone repeat color token.
- A real manual Intervals constructor/review rendered timeline slices and ordered repeat children.
- Final `qa:server:status`, build-output integrity, `curl`, log, and generated-conflict scans stayed
  clean after browser navigation.

Evidence:

- [QA artifact folder](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-06-28/workout-slice-cache-runtime-acceptance-qa/>)

Decision:

- Close this DS visual/runtime proof. Future DS work needs fresh source proof of a shared Hito DS
  component, token, or specimen ownership gap.

## Risks

- Migrating too many sections at once will turn this into a broad rewrite.
- Leaving both `SpecimenSection` and `HitoDsPlayground` as competing APIs will preserve the drift.
- Removing workout taxonomy too aggressively could lose useful Running Coach reference data; demote
  first if deletion is not proven safe.
- Route splitting may be useful later, but doing it in Slice 1 can break deep links and make QA too
  broad.
- Reactivating `/test-calendar` before Slice 6 would have left the DS bridge/export entrypoint
  undiscoverable. After Slice 6, `/test-calendar` may proceed only as a separate static sandbox that
  does not move product truth into `/hitoDS`.

## Exit Criteria

- A canonical specimen workbench exists.
- Dropdown and Calendar pilots use it.
- `/hitoDS` navigation reflects the accepted IA.
- No product runtime behavior changed.
- Browser QA accepts desktop and mobile proof.
- Slice 2 migrates the core controls group without broad route rewrites.
- Slice 3 migrates feedback/action primitives without reactivating `/test-calendar` or touching
  product runtime.
- Slice 4 migrates operational patterns without reactivating `/test-calendar` or touching product
  runtime.
- Slice 5 demotes duplicate shared-wrapper ownership without changing wrapper exports or product
  runtime.
- Slice 6 adds a clear Tools / Bridge entrypoint without making Figma, html.to.design, or
  `/test-calendar` the runtime source of truth.
- After Slice 6, `/test-calendar` sequencing is explicitly reactivated as a separate static
  product-design sandbox owner, not as a continuation of `/hitoDS` IA rollout.
- After TC1, `/test-calendar` continues through a Designer-owned TC2 product-design review/spec gate
  before any further frontend implementation is assigned.
- After TC2, `/test-calendar` is paused as sufficient until Product/Design identifies a concrete
  review gap that requires a new bounded Architecture checkpoint.
