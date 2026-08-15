# Hito Next Visual Patch Intake

## Work Item ID

2026-08-13-hito-next-visual-patch-intake

## Status

completed

## Type

Tracked — bounded Workout visual-correction implementation

## Priority

high

## Owner

DESIGN SYSTEM

## Mode

Tracked

## Stage

Completed Design System implementation of the two bounded Workout visual corrections; the extracted
radius item remains its own completed lifecycle owner.

## Next Recommended Role

PRODUCT

## Scope

Implement the two source-proven Workout corrections at their smallest existing seams. The Local
Inspector radius defect remains extracted to its own completed lifecycle item because its root owner
is not the Workout UI.

## Archive Intent

retain_in_place

## Task

Apply `--space-1` only to the default Timeline branch's vertical rhythm while preserving horizontal
and compact behavior. Give only the route-owned Workout overview SidebarPanel an opaque canonical
background while preserving the shared Row Group border/radius contract and every other consumer.

## User Report

Ivan requested that every following visual correction be collected into this one detailed file for
the next patch rather than dispatched one by one.

## Item 1 — Workout Structure Timeline Spacing

### Inspector Evidence

- **Item ID:** `35d51e59-f83e-4bb5-b94b-3a393a504514`
- **Captured:** 2026-08-13T20:31:02.987Z
- **Route:** `/workout/2026-08-13?tab=overview`
- **Theme / viewport:** Dark, 1470×801
- **Target:** `ol`
- **Selector:** `ol.mt-5.grid.gap-3`
- **Scope:** all similar instances — find the reused source owner
- **Observed:** grid list of three items, vertical and horizontal gap `--space-3` (12px)
- **Requested:** vertical gap `--space-1` (4px); no horizontal-gap, colour, typography, chrome, or
  copy change requested.

### Source Investigation

The selector resolves to the non-compact branch of the shared
`WorkoutStructureTimeline` list in
`src/components/workout-structure/WorkoutStructureTimeline.tsx:124`:

```tsx
<ol className={cn("mt-5", density === "compact" ? "hito-row-group" : "grid gap-3")}>
```

The selected Product route consumes this component. The request therefore does not yet prove that
all `WorkoutStructureTimeline` consumers should receive smaller spacing, nor that `hito-row-group`
is incorrect. Before routing the patch, inspect the component consumer census and its `density`
contract to establish whether the first incorrect owner is the shared timeline's non-compact branch
or a Product route-level consumer.

### Expected Outcome

At the proven owner, the selected timeline list uses the requested canonical `--space-1` vertical
rhythm while preserving its unrelated horizontal layout and the compact `hito-row-group` branch.
Every affected consumer must retain readable structure and no page overflow or interaction change.

### What Not To Touch

- Workout content, plan/workout persistence, timeline semantics, and interaction logic.
- `hito-row-group`, compact-density behaviour, horizontal spacing, colours, typography, or tokens
  unless the required consumer discriminator proves they are the first incorrect owner.
- Unrelated route, Design System, backend, fixture, Figma, hosted, or Git state.

### Required Discriminator Before Dispatch

1. `WorkoutStructureTimeline` consumer census grouped by Product/DS owner and density value.
2. Source/DOM proof that reducing the non-compact branch's vertical gap to `--space-1` preserves
   the intended structure for every admitted consumer; otherwise split a route-local correction.
3. Confirm that the requested `4px` is represented by existing `--space-1`, not a raw local value.

### Proposed Proof Once Routed

Focused source assertion, formatting/lint/diff hygiene, and browser replay of the selected Workout
overview plus every admitted consumer in the changed density branch. Verify item separation,
horizontal containment, keyboard/interaction preservation, and console health.

## Item 2 — Workout Overview Sidebar Panel Surface

### Inspector Evidence

- **Item ID:** `c73a953f-ba01-4161-80f3-db30c55aaf9e`
- **Captured:** 2026-08-13T20:34:41.997Z
- **Route:** `/workout/2026-08-13?tab=overview`
- **Theme / viewport:** Dark, 1470×745
- **Target:** `div.hito-row-group`
- **Selector:** `main > div > div > div:nth-of-type(2) > aside > div`
- **Scope:** only this selected sidebar instance
- **Observed:** 1px `--hairline` border; custom computed fill `#0E0C0C6B` at 42% alpha; 10px
  computed corner radius.
- **Requested:** fill `--background` at 100%; `--radius-xl`; retain the current border. No spacing,
  typography, text, or interaction change was requested.

### Source Investigation

`src/routes/workout.$date.tsx:855-857` defines the selected route-local `SidebarPanel` as a bare
`<div className="hito-row-group">`. The visual class itself is globally owned by
`src/styles/controls-lists.css:993-998`, where it declares `--color-hairline`,
`var(--radius-xl)`, and `background: color-mix(in oklch, var(--color-background) 42%, transparent)`.
The same generic class is also used by the workout completion panel, workout document readback,
compact timeline, onboarding, and `/hitoDS` controls. The Inspector's only-here scope therefore
does not authorize a global change to `.hito-row-group`.

### Expected Outcome

Only the Workout overview sidebar panel resolves to canonical opaque `--background` and the
requested canonical radius without changing the shared Row Group treatment anywhere else. The
existing border, sidebar sections, route behavior, and horizontal containment remain intact.

### Likely Root Cause Or Required Discriminator

The route-local `SidebarPanel` is using the generic Row Group surface for a semantically distinct
sidebar container. Before routing, prove whether an existing sidebar/shell surface owner can
express the approved opaque treatment. If so, migrate this one local wrapper to that owner; do not
add a naked override or alter global Row Group. If no existing owner fits, return the component/API
decision to PRODUCT rather than inventing a local recipe.

The live foundation declaration proves `--radius: 8px` and
`--radius-xl: calc(var(--radius) + 2px)`, so its canonical computed value is **10px**. The separate
DevTools evidence below explains why the Inspector incorrectly presents 12px for that token.

### What Not To Touch

- Global `.hito-row-group` styling and its other consumers.
- Workout completion/readback panels, compact timeline, onboarding, `/hitoDS` playground controls,
  Product data, sidebar structure, border, or interactions.
- Tokens, raw color values, opacity formulas, Figma, backend, hosted state, or Git lifecycle.

### Required Discriminator Before Dispatch

1. Existing sidebar/shell surface census and owner comparison for an opaque background treatment.
2. Exact computed radius cascade at the selected element, including its canonical 10px
   `--radius-xl` result and every local override.
3. Source proof that a local semantic-owner migration leaves every other Row Group consumer
   byte-for-byte unchanged.

### Proposed Proof Once Routed

Focused source and computed-style assertion for this one Workout SidebarPanel; browser replay at
the captured Workout route in Dark/Light and supported mobile layout; verify opaque background,
canonical radius, retained border, containment, and console health.

## Item 3 — Local Inspector Radius Token Catalogue Reconciliation

### User Report And Screenshot Evidence

Ivan selected the Workout sidebar Row Group in the Local Inspector. The element computed to 10px
radius, but the radius dropdown showed `Keep current 10px` while marking `12 · --radius-xl` as the
selected canonical option. He correctly asked why a supposedly canonical 10px value is missing from
the token list.

### Demonstrated Root Cause

The runtime foundations and Local Inspector disagree about the same primitive scale:

| Token          | Canonical source in `src/styles/foundations.css` with base `--radius: 8px` | Current Inspector catalogue |
| -------------- | -------------------------------------------------------------------------- | --------------------------- |
| `--radius-sm`  | 4px                                                                        | 4px                         |
| `--radius-md`  | 6px                                                                        | 6px                         |
| `--radius-lg`  | 8px                                                                        | 8px                         |
| `--radius-xl`  | **10px**                                                                   | **12px — incorrect**        |
| `--radius-2xl` | 12px                                                                       | 16px — incorrect            |
| `--radius-3xl` | 16px                                                                       | 20px — incorrect            |
| `--radius-4xl` | 20px                                                                       | 24px — incorrect            |

`src/components/devtools/local-ui-inspector-targets.ts:63-71` has a stale hard-coded
`HITO_RADIUS_SCALE`: it assigns XL / 2XL / 3XL / 4XL deltas `+4 / +8 / +12 / +16`, while
`src/styles/foundations.css:12-19` defines `+2 / +4 / +8 / +12`. This is a Local Inspector
catalogue defect, not a non-canonical radius on the Workout Row Group.

### Expected Outcome

The Inspector's Radius menu derives or accurately mirrors the canonical foundation scale. A computed
10px Row Group using `var(--radius-xl)` appears as the selected `10 · --radius-xl` option, not as a
custom `Keep current` value. Every larger radius label/value remains consistent with the generated
Design System manifest and the CSS runtime.

### Scope And Boundaries

- **Likely owner:** FRONTEND, DevTools lane — the Local Inspector catalogue.
- **Existing seam:** `src/components/devtools/local-ui-inspector-targets.ts`; reuse generated
  manifest/token metadata if it can become the single source of truth without adding a second scale.
- Do not change `src/styles/foundations.css`, component radius use, user-facing Workout layout,
  design tokens, generated manifests, or product UI merely to match the faulty Inspector list.
- Do not add a parallel radius scale or hard-code a replacement numeric list if canonical manifest
  data can own it.

### Required Discriminator Before Dispatch

1. Confirm whether the generated manifest already exposes usable radius values for the Inspector;
   otherwise prove the smallest existing source that can replace the stale local offset table.
2. Census every Local Inspector radius picker/readback using `HITO_RADIUS_SCALE`.
3. Verify `sm → 4`, `md → 6`, `lg → 8`, `xl → 10`, `2xl → 12`, `3xl → 16`, `4xl → 20` in the
   emitted Inspector payload and menu.

### Proposed Proof Once Routed

Focused Local Inspector source assertions plus a loopback Inspector replay selecting elements using
each canonical radius tier. Confirm selected-token recognition, clear/keep-current behaviour, prompt
payload truth, and no regression to unrelated spacing or colour controls.

## Likely Root Cause Or Required Discriminator

Item 1's visible 12px rhythm is source-backed, but its correct ownership is not yet proven: the
source component serves multiple consumers and has a distinct compact branch. Item 2 has a separate
route-local wrapper but a shared Row Group surface dependency. The listed discriminators are required
before selecting FRONTEND Product, FRONTEND (ds), or DESIGN SYSTEM for either slice.

## Validation Expectations

No implementation validation is due during intake. At batch close, PRODUCT defines one proportional
proof inventory per demonstrated owner and sends only the compatible slice to an available named
sidebar role.

## Execution Preflight — 2026-08-13

- **Product routing decision:** Ivan explicitly placed the Workout corrections with DESIGN SYSTEM
  as a bounded cross-lane exception. Product data, persistence, shared Row Group CSS, and other
  routes remain excluded.
- **Timeline discriminator:** `WorkoutStructureTimeline` has one compact consumer through
  `ManualWorkoutTrainingBlockGrammar` and one default-density consumer through
  `WorkoutDocumentReadback`; both reach the same Workout route through mutually exclusive workout
  models. Only the default branch owns `grid gap-3`. The smallest change is
  `gap-x-3 gap-y-1`, which changes the requested vertical token from `--space-3` to `--space-1`
  while retaining horizontal rhythm and leaving the compact `hito-row-group` branch unchanged.
- **Sidebar discriminator:** the selected element is the single route-local `SidebarPanel` wrapper.
  Its existing `hito-row-group` already owns the retained border and canonical
  `--radius-xl` (10px). Composing the existing `bg-background` semantic utility on this one wrapper
  replaces only the shared row-group alpha fill; no global selector or new surface recipe is needed.
- **New runtime artifacts:** none. No helper, CSS selector, token, component API, or compatibility
  path is added.
- **Dirty-work boundary:** the timeline and Workout route already contain unrelated typography and
  focus changes. The task edits only the exact branch class and `SidebarPanel` class, preserving all
  other hunks byte-for-byte.
- **Proof inventory:** exact source/consumer assertions, focused formatting/lint/diff hygiene,
  relevant DS checks, and fresh Workout route browser proof in both themes and supported widths only
  after managed runtime admission.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused implementation proof for the two Workout presentation changes; no
  Product-calendar, persistence, Global QA, or release claim.
- **Artifact rule:** use the same newly built, fresh managed `qa_fixture` artifact as this batch,
  only after static validation. Do not infer proof from the previously completed QA item.
- **Browser target:** `/workout/2026-08-13?tab=overview` in Dark/Light at 1470×801 and 375×812 where
  fixture data admits the overview. Verify 4px default timeline row gap, unchanged compact source
  contract, opaque sidebar background, 10px radius, retained border, keyboard timeline behavior,
  page containment, and console health.
- **Failure rule:** setup-gated or unavailable fixture data is recorded as an exact route coverage
  gap; no product data, persistence, or temporary harness is created to force the state.

## Blockers

None for the two admitted Workout corrections. The final independent QA artifact did not contain an
opened workout because `qa_fixture` resolved to Setup required; that exact repeated-browser gap is
recorded below and does not require a temporary data harness or Product mutation.

## Tracked Implementation Receipt — 2026-08-13

- **Stage:** source-backed owner discrimination, two bounded Workout visual corrections, and
  proportional local proof.
- **Product routing decision:** DESIGN SYSTEM implemented this cross-lane exception. No Product
  data, persistence, backend, or shared Row Group contract was changed.
- **Root causes repaired:** the default Timeline list used one `gap-3` shorthand despite a
  vertical-only request; the route-owned overview `SidebarPanel` inherited the generic Row Group's
  translucent fill despite the approved opaque treatment.
- **Files changed:** `src/components/workout-structure/WorkoutStructureTimeline.tsx`,
  `src/routes/workout.$date.tsx`, and this item.
- **Smallest changes:** the non-compact list now composes `gap-x-3 gap-y-1`; the one route-owned
  sidebar wrapper composes existing `bg-background` with `hito-row-group`.
- **Preserved:** compact `hito-row-group` branch, 12px horizontal rhythm, 10px shared radius,
  existing border, all other Row Group consumers, route content/semantics/interactions, Product
  data, and unrelated focus/typography dirty hunks.
- **New runtime artifacts:** none.

| Check                         | Scenario / environment                                                                     | Result                                     | Evidence                                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consumer/source discriminator | Timeline density and SidebarPanel reachability                                             | Passed                                     | One compact and one default branch were identified; only default changed. Sidebar composition is unique to the route wrapper.                                                                                                     |
| Full DS contract              | `npm run validate-hito-ds-components`                                                      | Passed                                     | Contract completed across 327 scanned files.                                                                                                                                                                                      |
| Focused static proof          | Prettier, ESLint, `git diff --check`                                                       | Passed                                     | No focused failure.                                                                                                                                                                                                               |
| Production build              | Managed build/postbuild integrity                                                          | Passed                                     | Fresh artifact admitted with `receipt_matches`; standard non-failing bundle warnings only.                                                                                                                                        |
| Primary browser proof         | Fresh managed `qa_fixture`, `/workout/2026-08-13?tab=overview`, desktop/mobile, Light/Dark | Passed before later unrelated digest drift | Default list computed 4px row gap and 12px column gap. The route-owned panel alone computed opaque canonical background, 10px radius, retained 1px border, zero overflow, and no console errors. Timeline control retained focus. |
| Final independent QA replay   | Rebuilt fresh managed `qa_fixture`, exact four cells                                       | Coverage gap                               | Fixture rendered `Setup required / Finish setup before opening workouts`; no timeline or route-owned panel existed. Fallback had zero overflow/console errors. No provider/data mutation or temporary harness was used.           |
| Post-review runtime           | Managed fixture after QA                                                                   | External contention                        | A later private Admin digest change marked the still-healthy artifact stale/broken; no task-owned Workout source moved.                                                                                                           |

The source and primary fresh-runtime evidence satisfy the assigned implementation slice; the final
independent Workout matrix remains explicitly unclaimed because fixture truth changed. The compact
branch is source-preserved, not browser-claimed. No Global QA, Product-calendar acceptance, release,
hosted, deployment, or Figma claim is made.
