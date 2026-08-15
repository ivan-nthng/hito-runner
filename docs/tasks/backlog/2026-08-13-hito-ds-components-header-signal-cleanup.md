# Hito DS Visual Correction Batch — Components, Playgrounds, And Launch Surfaces

## Work Item ID

2026-08-13-hito-ds-components-header-signal-cleanup

## Status

completed

## Type

design-system visual-reference correction batch

## Priority

high

## Owner

design-system

## Mode

Tracked

## Stage

DESIGN SYSTEM completed the accepted batch and the narrow radius continuation on 2026-08-13.
`hito-launch-surface` now uses the existing `--radius-3xl` tier, the canonical physical 16px
value. Focused available-viewport replay passed; the exact 1470×801 / 375×812 browser matrix
remains a recorded platform coverage gap rather than a claimed acceptance result.

## Next Recommended Role

product

## Supersedes

[Hito DS Launch Surface Chrome Canonicalization](./2026-08-13-hito-ds-launch-surface-chrome-canonicalization.md)

## Scope

Remove the non-informative `Hito design system` signal label from the shared `/hitoDS` page header,
restore intentional vertical separation before shared `Demo` / `Variants` tabs, repair the
demonstrated Inputs and Button playground mode/control inconsistencies, make the Header input
reference specimens keep their intrinsic dimensions, promote Date & Time to its own interactive
reference sandbox, and canonicalize the shared `hito-launch-surface` chrome for the four `/hub`
destination cards and its Brand-reference consumer. This is not permission to retire
`hito-label-md` or `hito-label-signal`, delete context-bearing example labels, alter general stage
sizing, or change the distinct `hito-launcher-card` contract.

## Archive Intent

retain_in_place

## Task

Make each non-Overview header begin with its page title; make each tabbed `HitoDsPlayground`
visibly separate its metadata from the `Demo` / `Variants` control; keep the Inputs and Button
Demos active while their right-side controls update the chosen preview; make Header input specimens
hug their content rather than filling the tallest grid track; give Date & Time its own reusable
sandbox with branded selection and calendar/time behavior; and make every `hito-launch-surface`
borderless with the canonical 16px corner tier. Reuse existing shared page-header, playground,
field, select, date/time, controls, surface, focus, and token owners. Do not add a local hide rule,
replacement label, route-specific spacing/control/card recipe, field family, or card abstraction.

## User Report

- Inspector batch: `4cc26813-9a81-4ef3-8e2e-8509b2224ed5`.
- Route: `/hitoDS/componentsdropdowns`; Dark; 1470×801.
- Selected object: `p.hito-label-md.hito-label-signal`, text `Hito design system`.
- Request: remove the object.
- Scope recorded by Inspector: selected instance only. Product investigation determines the selected instance is emitted by the shared page header; the same generic label appears on the sibling non-Overview reference pages.
- Screenshot: `Screenshot 2026-08-12 at 23.01.17.png`, Header input variant in the Inputs reference. The small `Block label` specimen occupies the full height of its three-column row instead of wrapping its own header text. Ivan requests intrinsic sizing and a smaller, tokenized horizontal inset, approximately one rem.
- Screenshots: `Screenshot 2026-08-12 at 23.02.08.png` and `Screenshot 2026-08-12 at 23.02.43.png`, Inputs reference. Ivan requests Date & Time as a distinct sandbox, including the picker and selection controls. The `Workout type` example must not open the browser's system-native select menu; replace that reference input with the existing branded Hito Select.
- Inspector batch: `fce002ef-bffb-40c1-a7ff-94116b87f894`.
- Route: `/hitoDS/componentsinputs`; Dark; 1470×801. Selected object:
  `#rows > div:nth-of-type(2)` / `div.hito-ds-playground`.
- Decision: the shared vertical separation above `Demo` / `Variants` is exactly **48px**. The
  current scale has no standalone 48px primitive, so the accepted token-only composition is
  `calc(var(--space-8) + var(--space-4))` (32px + 16px). It applies to every tabbed
  `HitoDsPlayground`, including Rows, without changing its stage, controls, or global grid gap.
- Inspector batch: `99b4ba84-2c2a-420a-b63b-faa96c1e714f`.
- Route: `/hitoDS/components#icon-only-button`; Dark; 1470×801. Selected object:
  `#buttons > div:nth-of-type(2)` / `div.hito-ds-playground`.
- Decision: `Button` is the one Components-navigation destination. Remove the separate
  `Icon-only Button` navigation/deep-link entry; icon-only remains a configuration inside the
  existing Button Variants material rather than a peer component destination.
- Reported interaction: while `Demo` is selected, changing any Button control on the right sends
  the workbench to `Variants`.
- Inspector batch: `2ebb5de0-a29d-4483-be86-c3b8f0c120db`.
- Route: `/hub`; Dark; 1470×801. Target: fourth `a.hito-launch-surface`; Inspector scope:
  **all similar instances**.
- Observed: 20px padding/gap, 10px radius, `#0F0D0B9E` fill, and a 1px `--hairline` perimeter.
- Product resolution: every `hito-launch-surface` uses `--radius-3xl` (16px), with no decorative perimeter
  border in resting or hover state. The current fill/alpha is not part of this requested change.

## Evidence And Source Investigation

- `src/components/hito-ds/reference-page.tsx:140-145` renders the non-Overview page header and hard-codes `<p className="hito-label-md hito-label-signal">Hito design system</p>` before the meaningful `currentPage.label` title.
- The target on `/hitoDS/componentsdropdowns` is an instance of that shared renderer.
- This label does not distinguish one reference page from another. The page title immediately after it does.
- Nearby usages of `hito-label-md hito-label-signal` carry actual context — for example `Training`, `Route content`, `Setup`, and `Auth/photo overlay` — and are not part of this report.
- `reference-components-controls.tsx:760-784` renders the three `sm` / `md` / `lg` header specimens in `div.grid ... md:grid-cols-3`.
- `inline-editable-text.tsx:244-253` renders the header variant root as `inline-grid`; the current reference grid does not constrain that grid item's cross-axis stretching. The visible oversized `Block label` surface is therefore not evidence of a 1rem-plus horizontal inset.
- `controls-fields.css:261-292` already assigns per-size header geometry: horizontal padding is `--space-3` for `sm`, `--space-4` for `md`, and `--space-5` for `lg`; the source also carries deliberate per-size minimum widths. The screenshot alone does not prove that changing all three shared padding values is safe for Product header editing.
- `reference-components-controls.tsx:835-939` currently places the Date & Time reference list inside the broader Inputs playground. Its `Workout type` row at `:845-864` intentionally renders `HitoNativeSelectField`, whose own source (`src/components/ui/native-select-field.tsx`) is a literal HTML `<select>`.
- The system-owned menu is therefore the demonstrated native-select behavior, not a misplaced Hito Select chevron. `src/components/ui/select.tsx:16-39` already owns the branded alternative: `Select`, `SelectTrigger`, `SelectContent`, and `SelectItem` use the shared Hito field contract and `hito-ui-menu-surface`.
- `HitoNativeSelectField` has Product consumers outside this reference, including Body Notes. The report concerns only its Date & Time showcase adoption; it is not evidence that the shared native field should be retired.
- `reference-model.ts:52` declares `icon-only-button` as a standalone Components destination.
  `sectionDestination()` derives its sidebar href as `/hitoDS/components#icon-only-button`, even
  though the Button playground itself is already the canonical `buttons` section.
- `reference-components-controls.tsx:149-152` passes that same `icon-only-button` anchor with
  `tab: "variants"` into `ButtonPlayground`; the Icon-only matrix is otherwise a nested
  configuration inside its `Variants` content at `:234-241`.
- `ButtonPlayground` creates its anchors array inline on each state change. `HitoDsPlayground`'s
  effect currently depends on that array identity (`playground.tsx:47-72`), so every Button-control
  state update re-runs `activateHashExample()`. While the URL remains `#icon-only-button`, the
  matching anchor calls `setActiveTab("variants")`. This is the source-backed causal chain behind
  the reported Demo → Variants switch; an event/hash browser replay remains required before closure.
- `src/styles/foundations.css:1220-1256` is the canonical owner of the launch recipe. It currently
  groups `.hito-launcher-card` and `.hito-launch-surface` for base, hover, and focus-visible rules.
  The shared base adds a 1px `--color-hairline` border and `--radius-xl`; hover changes
  `border-color` and adds a 1px zero-spread signal edge.
- `src/routes/hub.tsx:105` renders all four Hub `hito-launch-surface` cards through one
  `HubDestinationCard`. `src/components/hito-ds/reference-brand-page.tsx:97` is the only other
  current consumer. `.hito-launcher-card` has no current rendered consumer in the inspected source,
  but remains a declared distinct contract and is outside this batch.

## Demonstrated Root Cause

Two demonstrated common owners exist:

1. The non-Overview `/hitoDS` page-header composition in `reference-page.tsx` repeats the same non-informative product-name eyebrow on every page.
2. `reference-workbench.css:120-125` owns the shared `HitoDsPlayground` tab wrapper. Its current
   `padding-top: var(--space-4)` is 16px and leaves the `Demo` / `Variants` control visually
   attached to the preceding `Used in` and metadata block, as shown in the supplied Button, Tabs,
   and Rows screenshots. Changing each reference page separately would duplicate the same geometry
   decision. The accepted replacement is
   `padding-top: calc(var(--space-8) + var(--space-4))` (48px).

3. Inputs Demo mode is intended to be live: `reference-components-controls.tsx:641-650` passes `inputVariant`, `inputSize`, `inputState`, and `inputFeedback` into its `DemoInput`. In contrast, its `Variants` state matrix deliberately renders a fixed `size="sm"` at `:688-696` and other fixed reference combinations at `:701-750`; changing the global Size control is therefore not meant to resize that static reference matrix.

4. The Header input reference's row-level stretching is caused by its grid placement: the inline-grid root has no explicit self-alignment in the three-column reference grid. The shared header trigger already has `width: auto` and `justify-self: start`; the outer inline-grid remains eligible to stretch with its grid track. The exact computed width, height, and inset for all three sizes must be captured before changing any shared spacing token or minimum-width contract.

5. Date & Time's product of a broad static reference list and a deliberately native Workout type example hides the interactive relationship Ivan expects to inspect. The existing canonical Hito Select is available for a branded listbox/menu; adoption belongs to the reference owner, while the native field remains a separate intentional primitive for its existing Product consumers.

6. The separate `Icon-only Button` destination and the shared `HitoDsPlayground` anchor-effect
   dependency create a combined navigation/state defect. The first incorrect information owner is
   the standalone destination in `reference-model.ts`; the first incorrect interaction owner is
   the shared hash synchronization in `playground.tsx`, which must not reactivate a tab merely
   because a parent control re-rendered with an equivalent anchors array.

7. The prior Hub item deliberately prohibited changes to `hito-launch-surface` and
   `foundations.css`, so its Mark/access-label implementation could not alter the shared 10px
   radius or perimeter edge. The first owner for this correction is DESIGN SYSTEM at the shared
   `hito-launch-surface` recipe, not four route-local Hub cards.

## Execution Preflight — 2026-08-13

- **Existing seams:** reuse the non-Overview header in `reference-page.tsx`, the existing
  `.hito-ds-playground-tabs` rule, `HitoDsPlayground` hash listener, the current Button/Inputs
  reference compositions, existing Hito Select/date/time primitives, and the shared
  `hito-launch-surface` recipe.
- **Smallest behavior change:** remove one generic eyebrow; increase only tabbed-playground top
  separation; make hash activation event-driven rather than inline-array-identity-driven; remove
  the duplicate Icon-only navigation/anchor; align the existing Header-input specimens
  intrinsically; move the existing Date & Time material into one sibling playground; and isolate
  only launch-surface border/radius chrome from the preserved launcher-card recipe.
- **New runtime artifacts:** none. No token, component family, route state, CSS recipe, helper file,
  compatibility path, or Product primitive is proposed.
- **Superseded responsibility removed:** the standalone Icon-only Button destination/anchor, the
  broad Inputs-owned Date & Time comparison block, and the launch-surface decorative perimeter.
  The nested icon-only Button matrix, native-select primitive, and launcher-card contract remain.
- **Dirty-work boundary:** current Data Table, Playground heading, Brand/favicon, Foundations,
  Product, validator, and other unrelated hunks are pre-existing and remain outside this batch.
- **Browser discriminator:** on
  `http://127.0.0.1:3000/hitoDS/components#icon-only-button`, selecting `Demo` left the URL and
  hash unchanged. Clicking the Button `Size` control (`xs`) then changed the selected tab from
  `Demo` to `Variants` while the URL remained identical. The matching `tab: "variants"` anchor was
  therefore re-applied by the effect dependency on a newly allocated but equivalent `anchors`
  array, not by a `hashchange`.
- **Header-input geometry discriminator:** before repair, all three `sm` / `md` / `lg` specimen
  roots computed to 76px high with `align-self:auto` / `justify-self:auto`; their horizontal
  paddings were respectively 12px / 16px / 20px and affordances 16px / 16px / 24px. The equal
  stretched row height and column width prove placement is the first incorrect owner; the existing
  size-token padding remains unchanged unless post-alignment evidence disproves it.
- **Focused proof and promotion boundary:** source/static checks plus Dark/Light desktop and exact
  375x812 replay cover the affected reference, hash, overlay, focus, and launch-surface contracts.
  A requirement for Product source, another owner, a new token/artifact, or an overlapping
  task-owned hunk returns to PRODUCT instead of expanding this batch.

## Required Change

- Remove only the hard-coded generic label from the shared non-Overview header renderer.
- Preserve the semantic header, `h1`, current page labels, overview-specific header, route IDs, navigation, and spacing appropriate after the removal.
- Remove an import or class only if it becomes unreachable from this exact edit; do not modify the shared typography role.
- Change the top separation before `Demo` / `Variants` once at `.hito-ds-playground-tabs` from
  `var(--space-4)` (16px) to the accepted
  `calc(var(--space-8) + var(--space-4))` (48px). This is the only spacing decision in scope; the
  owner records the computed result and shows that it creates a distinct group without adding a
  blank visual band.
- Apply the spacing only when shared workbench tabs exist. Preserve `.hito-ds-playground` grid gap, stage padding/min-height, controls geometry, tab behavior, anchors, focus behavior, and the layout of playgrounds without tabs.
- Remove the standalone `icon-only-button` Components destination and its Button-playground
  anchor. Retain Button as the canonical Components entry and retain the existing icon-only matrix
  only as nested Variant material; this is not permission to remove the accessible icon-only Button
  contract itself.
- Repair the shared `HitoDsPlayground` hash synchronization so a state re-render cannot switch
  `Demo` to `Variants`. It must respond to the initial deep-link and a real `hashchange`, but not
  to equivalent parent anchors being recreated during a choice-control update. Reuse the existing
  tab/hash contract; do not add route state, a compatibility layer, or per-playground control
  patches.
- Inputs expected behavior:
  - in **Demo**, `Variant`, `State`, `Feedback`, and `Size` controls update the single rendered `DemoInput` while Demo remains selected;
  - a change to `Size` visibly changes the Demo field’s shared field size; and
  - in **Variants**, static examples remain a comparison matrix. They need not inherit the global Size selection unless a later explicit design decision changes that contract.
- Header input expected behavior:
  - The `sm`, `md`, and `lg` reference specimens keep an intrinsic wrapper and no longer inherit the tallest row height or full column width.
  - Preserve the actual editable-header primitive, its truncation, edit affordance, focus/disabled/read-only behavior, and Product manual-workout consumers.
  - Before changing the shared per-size padding, capture computed horizontal padding and the rendered text/affordance width. If the root alignment repair removes the perceived excess, leave those existing padding contracts untouched. If a reduction is still needed, use one documented Hito token decision and demonstrate that it preserves all three size tiers and Product consumers; no raw pixel rule.
- Date & Time expected behavior:
  - Move the current Date & Time material out of the general Inputs comparison list into one sibling `HitoDsPlayground`, reusing the existing stage, tabs, settings controls, Field, Hito Select, HitoDateField, HitoEditableDateField, and HitoMaskedTimeField owners. Do not create a custom stage, select, menu, or date/time primitive.
  - Its live Demo makes the branded `Workout type` selection, date-picker/calendar, and masked-time interaction inspectable together. Its Variants view may retain the existing invalid, disabled, bounded, and optional-date evidence as a comparison set.
  - Replace only the reference's `HitoNativeSelectField` Workout type row with the canonical `Select` composition. The custom chevron remains positioned at the trigger edge; opening it must show the Hito menu surface rather than the browser's system menu.
  - Preserve current ISO/duration-shaped local state, labels, helpers, value options, date bounds, keyboard/focus semantics, and all underlying date/time primitive behavior.
- Before repair, reproduce the reported Button Demo → Variants switch with a real browser event
  trace. Record URL/hash, active tab before/after a Button control click, and the hash-sync path
  that fires. Then validate the source-backed shared hash repair across Button and Inputs rather
  than adding a local ChoiceSelector workaround.
- Update only the canonical `hito-launch-surface` chrome to use `var(--radius-3xl)` (16px), with
  no resting border, hover `border-color`, or hover 1px zero-spread perimeter edge. Preserve a
  visible semantic `:focus-visible` ring; that accessible focus indication is not card chrome.
- Preserve `hito-launch-surface` fill, padding, gap, min-height, content, HitoMark, destination,
  CTA, motion, access semantics, and elevation. If the grouped selector must be separated, retain
  common declarations once and isolate only this documented chrome difference; do not copy the
  whole recipe or add a route-local override.

## What Not To Touch

- `hito-label-md`, `hito-label-signal`, typography registry, and tokens; CSS changes are limited
  to the demonstrated `.hito-ds-playground-tabs` spacing, shared hash behavior as needed, and the
  documented `hito-launch-surface` chrome;
- meaningful specimen, status, route, or contextual labels;
- `HitoDsPlayground` header/title behavior currently owned by the separate Foundations
  visual-cleanup task; preserve its dirty hunks byte-for-byte and do not overwrite or absorb them;
- stage/controls sizing, global `hito-ds-playground` gap, unrelated tab/accessibility behavior, or unrelated page-level spacing; the demonstrated hash synchronization is the sole tab-contract exception;
- Header input typography, size scale, `--hito-inline-header-min-width` Product overrides, or actual manual-workout title-field geometry unless a separate source-backed cross-surface decision explicitly expands the scope;
- the fixed sizes in Inputs **Variants** specimens, unless the evidence and a separate accepted decision prove they violate their reference-matrix purpose; and
- `HitoNativeSelectField` itself or any of its non-reference Product consumers; this task changes only the demonstrated reference adoption;
- the Hito Select primitive, shared menu CSS, or new dropdown styling; reuse its existing public composition and fix only an actually discovered integration defect there;
- `.hito-launcher-card`, favicon, Brand-logo artwork, surface token values, global
  `hito-surface-flat`, Hub markup/destinations/access rules/Marks/CTA, and the unrequested
  launch-surface fill alpha;
- Product, DevTools, Marketing, Backend, Figma, generated manifests, validators, Git lifecycle, hosted state, and deployment; and
- the separate Foundations compact-specimen task.

## Focused Proof When Dispatched

- Search proves the specific hard-coded page-header copy no longer exists.
- `/hitoDS/componentsdropdowns` and one other non-Overview reference route retain their title and usable header hierarchy in Dark/Light at desktop and 375px.
- The Overview header and a meaningful signal label remain unchanged.
- Desktop and exact 375px Dark/Light representative tabbed playgrounds have visibly increased header-to-tab separation, no overflow, and unchanged Demo/Variants pointer and keyboard behavior.
- Inputs browser replay proves Demo control changes keep the Demo tab selected and update `DemoInput`; Variants retains its intentional static comparison sizes. Keyboard tabs, hash-anchor deep links, focus, overflow, and console state remain correct.
- Button browser replay proves `Button` is the sole Components-navigation destination, the nested
  icon-only matrix remains reachable inside Button Variants, and each right-side control changes the
  Demo preview without switching to Variants. A direct initial deep-link and a real later hashchange
  still select their intended tab once; no state re-render may do so.
- Header input browser replay at desktop and exact 375px proves the three reference specimens use intrinsic width/height, retain their intended `sm` / `md` / `lg` hierarchy, expose the edit affordance without clipping, and do not regress a real manual-workout header field. The receipt distinguishes the alignment repair from any separately proven tokenized inset change.
- Date & Time browser replay at desktop and exact 375px in Dark/Light proves the independent sandbox's Demo and Variants work, Workout type opens the Hito Select menu (not the native browser menu), selection updates visibly, date picker/time entry remain usable, focus returns correctly after overlay dismissal, and no overflow or console error occurs. Existing Body Notes native-select use remains source-proven unchanged.
- `/hub` browser replay at 1470×801 and exact 375×812 in Dark/Light proves all four cards have
  16px corners, no resting/hover perimeter edge, retained keyboard focus, working links, no
  overflow, and no console errors. The Brand-reference `hito-launch-surface` has the same chrome;
  `.hito-launcher-card` remains source-proven unchanged.
- Focused formatting/lint and `git diff --check` pass.

## Handoff Status

This is the single canonical execution item for the compatible Components/Hub visual batch. The
separate launch-surface intake is closed before implementation and retained as evidence only.

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Visual Correction Batch — Components, Playgrounds, And Launch Surfaces
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-components-header-signal-cleanup.md

Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md, and
skills/hito-qa-browser-regression/SKILL.md before work. Preserve all unrelated dirty work
byte-for-byte.

Implement this one accepted Design System batch at its demonstrated canonical seams:

1. Remove only the generic non-Overview `Hito design system` eyebrow from the shared reference-page
   header; retain meaningful context labels and all typography roles.
2. Change the shared tabbed-playground top separation to the accepted token-only 48px composition
   `calc(var(--space-8) + var(--space-4))`, without changing global playground gap/stage geometry or
   playgrounds without tabs.
3. Repair the shared hash synchronization demonstrated to switch Button/Inputs from Demo to
   Variants on equivalent parent-anchor rerenders. Initial deep links and real `hashchange` must
   still work. Restore Button as the sole Components destination; keep icon-only only as nested
   Button Variants content.
4. Make Inputs Demo controls update the live Demo while it remains selected; retain Variants as a
   static comparison matrix. Make Header-input reference wrappers intrinsic before considering any
   shared size-token change. Give Date & Time its own existing HitoDsPlayground, using the existing
   branded Hito Select only for the reference Workout type row; retain the native-select primitive
   and Product consumers.
5. Change only the existing shared `hito-launch-surface` contract to borderless `--radius-3xl`
   chrome in rest and hover. Retain focus-visible evidence, fill/alpha, motion, elevation, content,
   and Hub/Brand behavior. Do not change `.hito-launcher-card`, route-local Hub markup, or add a
   component, token, abstraction, or duplicate CSS recipe.

Before writing, record the existing seam and new-runtime-artifact decision (`none`). Reproduce the
Demo-to-Variants failure with its URL/hash/active-tab discriminator. Fix the first shared owner,
not individual controls or cards. If another owner, a new product decision, or an overlapping dirty
hunk is required, stop and return the exact boundary to PRODUCT.

Validate proportionally: source discriminators; focused format/lint/DS validation/diff hygiene;
desktop and exact 375×812 in Dark/Light for representative Components, Button/Inputs/Date & Time,
all four Hub cards, and Brand reference; keyboard/focus/hash behavior, select/menu behavior,
links, overflow, and console. Run a production build if the managed runtime can admit a stable
artifact. You may use only an existing named Hito QA role for a bounded read-only independent
browser review if it materially improves confidence; do not delegate any Design System
implementation slice. Update this item with an English tracked receipt. Do not claim Global QA,
release, hosted, or Figma acceptance.
```

## Tracked Implementation Receipt — 2026-08-13

### Product Outcome And Root Cause

The shared reference/header, playground spacing, hash synchronization, Components navigation,
Inputs/Header-input composition, Date & Time sandbox, and launch-surface perimeter correction were
implemented at their demonstrated Design System owners. The pre-change browser replay proved that
an equivalent inline `anchors` array caused the hash effect to run again and force Button from
`Demo` to `Variants` while the URL stayed on `#icon-only-button`. `HitoDsPlayground` now stores the
latest anchors for the real listener without treating equivalent parent rerenders as a navigation
event.

The batch was blocked at capture time because current Foundations source defines `--radius: 8px` and
`--radius-2xl: calc(var(--radius) + 4px)`, so the initially named token rendered as 12px rather
than the simultaneously required physical 16px. No unstated choice was made during implementation.
On 2026-08-13, Ivan explicitly resolved the conflict: use the existing `--radius-3xl` tier, which
is the canonical 16px value. Changing the global radius scale remains out of scope.

### Source Changes

- `src/components/hito-ds/reference-page.tsx` — removed only the generic non-Overview eyebrow.
- `src/styles/reference-workbench.css` — changed only tabbed-playground top padding to the accepted
  `calc(var(--space-8) + var(--space-4))`; rendered result is 48px.
- `src/components/hito-ds/playground.tsx` — made initial/hashchange activation event-driven through
  the latest anchors ref. The existing unrelated Playground heading hunk was preserved.
- `src/components/hito-ds/reference-model.ts` — removed the standalone Icon-only Button destination
  and added the Date & Time destination while preserving concurrent Data Table model work.
- `src/components/hito-ds/reference-components-controls.tsx` — removed the duplicate Button anchor,
  kept the icon-only matrix nested in Button Variants, made Header-input reference placement
  intrinsic, removed Date & Time from Inputs, and added one sibling playground using the existing
  Hito Select/date/time primitives. Concurrent Data Table work was preserved.
- `src/styles/foundations.css` — retained the common launch recipe once, preserved the distinct
  launcher-card border/radius/hover contract, isolated launch-surface as borderless at rest and
  hover, and changed only its radius from `var(--radius-2xl)` to the accepted
  `var(--radius-3xl)`.
- This canonical item — recorded preflight, discriminator, focused continuation proof, and the
  remaining external coverage boundaries.

New runtime artifacts: none. `HitoNativeSelectField`, its Body Notes/Admin consumers,
`InlineEditableText`, Product manual-workout source, `hito-launcher-card`, Overview's meaningful
signal eyebrow, stage geometry, tokens, manifests, validators, Product routes, and unrelated dirty
work remain intact.

### Validation Inventory

| Check                            | Scenario / environment                                         | Result           | Evidence                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-change defect replay         | Managed loopback, Button `#icon-only-button`                   | Passed           | `Demo` + unchanged hash became `Variants` after Size `xs`, proving the inline-anchor dependency cause.                                                                                                                                                                                                                |
| Source discriminators            | Current repository source                                      | Passed           | Generic eyebrow remains only in Overview; standalone `icon-only-button` is absent; native-select Product consumers remain; launch ownership remains shared.                                                                                                                                                           |
| Focused formatting               | Prettier on all task-touched source/CSS/item paths             | Passed           | All matched files use Prettier style.                                                                                                                                                                                                                                                                                 |
| Focused lint                     | ESLint on the four task-touched TS/TSX owners                  | Passed           | Exit 0, no findings.                                                                                                                                                                                                                                                                                                  |
| Full DS validator                | `npm run validate-hito-ds-components`                          | External failure | Only the pre-existing Brand background/favicon tone assertion failed; validator/source repair is outside this item.                                                                                                                                                                                                   |
| Production build                 | `npm run build`                                                | Passed           | Client, SSR, Nitro, and postbuild completed successfully.                                                                                                                                                                                                                                                             |
| Managed runtime                  | `npm run qa:server:start` then status                          | Passed           | Fresh receipt-matched built runtime is healthy at `127.0.0.1:3000`; no ad hoc server was used.                                                                                                                                                                                                                        |
| Header and Overview              | Components/Brand plus Overview, Light/Dark, available 1280x720 | Passed           | Non-Overview eyebrow absent; `Components.` and `Brand & Visuals.` remain; Overview keeps `Hito design system`; no horizontal overflow. The captured `/hitoDS/componentsdropdowns` string currently resolves to repository 404, while canonical `/hitoDS/components#dropdowns` passes.                                 |
| Button hash and controls         | Fresh built runtime                                            | Passed           | Initial `#button-group` selects Variants; a real Grouped Buttons anchor hashchange selects Variants; keyboard ArrowLeft returns to Demo with visible focus; Size changed 44px to 28px while Demo and hash remained stable. Nested Icon-only configuration and 84 named icon actions remain; standalone nav is absent. |
| Inputs and Header input          | Light, available 1280x720                                      | Passed           | Tab separation computes to 48px; Size changed Demo from 40px to 28px without leaving Demo; Variants first field stayed 32px. Header specimens now render intrinsic 50/58/76px heights and natural widths, while existing 12/16/20px padding remains unchanged.                                                        |
| Date & Time                      | Light/Dark, available 1280x720                                 | Passed           | Hito Select opened the branded menu with zero native `<select>` elements; Tempo/Intervals updated visibly. Calendar ArrowDown/Escape opened/closed and returned visible focus to Target date. Time input normalized `42030` to `4:20:30`; Variants retain invalid/disabled/bounded/optional evidence.                 |
| Hub/Brand perimeter and behavior | Light/Dark, available 1280x720                                 | Passed           | All four Hub surfaces and the Brand specimen compute to 16px corners with no resting or hover perimeter. Physical hover retains lift/elevation, keyboard focus-visible retains its semantic ring, all four hrefs remain correct, and no shared fill/content behavior changed.                                         |
| Browser console and overflow     | Complete available-viewport replay                             | Passed           | Browser log collection returned no messages; Components, Hub, Brand, and Overview had zero horizontal document overflow.                                                                                                                                                                                              |
| Exact requested viewport matrix  | 1470x801 and 375x812                                           | Not run          | The available browser is fixed at 1280x720. Its exact-viewport path was rejected by platform browser policy; policy also prohibited an alternate/indirect browser workaround. Therefore no exact desktop/mobile visual claim is made.                                                                                 |
| Diff hygiene                     | `git diff --check`                                             | Passed           | Exit 0.                                                                                                                                                                                                                                                                                                               |

No subagent was used: a bounded QA reviewer could not independently supply the platform-blocked
exact viewport evidence, and same-evidence review would not materially improve confidence.

### Remaining Boundaries

1. QA still needs an allowed exact 1470x801 / 375x812 browser path to complete the requested visual
   matrix. The current 1280x720 evidence is focused implementation proof only.
2. The separate stale Brand validator assertion remains owned by its canonical repair item; it was
   not modified here.

Implementation DoD is **completed** for this Design System batch and its documented
`--radius-3xl` continuation. This receipt does not claim Global QA, release readiness, hosted
parity, deployment, or Figma acceptance.
