# Hito DS Inline Editable Header Text Anchor And Out-Of-Flow Affordance

## Work Item ID

2026-08-13-hito-ds-inline-editable-header-text-anchor-and-affordance

## Status

completed

## Type

design-system shared-primitive interaction correction

## Priority

high

## Owner

design_system

## Mode

Tracked

## Stage

Canonical shared-owner implementation and focused cross-surface validation completed.

## Next Recommended Role

product

## Evidence From

[Hito DS Visual Correction Batch — Components, Playgrounds, And Launch Surfaces](./2026-08-13-hito-ds-components-header-signal-cleanup.md)

## Scope

Make the canonical header variant of `InlineEditableText` read as ordinary aligned text before
interaction. Its hover, keyboard-focus, and edit affordances must not shift the text anchor, reserve
invisible horizontal icon space, or make the non-editing control look like a padded field. Apply the
shared correction to all header-variant consumers through the existing primitive, then prove the
Patterns reference and a real Product Manual Workout title preserve their editing contract.

## Archive Intent

retain_in_place

## Task

Separate read-state geometry from edit-field geometry in the existing `InlineEditableText` header
contract. In the read state, the visible text must align with surrounding non-editable page text and
have no visual background, edge, inline padding, or artificial minimum width. Hover and
focus-visible feedback may extend outside the text layout box, but must not change text coordinates
or neighboring layout. The edit affordance appears only on hover or keyboard focus, sits visually
after the text without reserving width at rest, and remains reachable through the named button.

When editing begins, the field may expose its existing input chrome, but its editable text must keep
the same left text anchor as the read state. Preserve intrinsic sizing, truncation, Enter/blur commit,
Escape cancel, validation, disabled and read-only behavior, focus restoration, and reduced-motion
behavior. Reuse the current component and stylesheet; do not introduce a new editable-heading
component, size scale, token family, wrapper, or compatibility path.

## User Report

- Inspector item: `9ac878db-5910-4f18-8cc6-a500ec13c630`.
- Route: `/hitoDS/patterns`; Dark; 1470×801.
- Target: `button[aria-label="Edit workout title"]`, confirmed DS component **Inline editable text**.
- Source identified by Inspector: `src/components/ui/inline-editable-text.tsx`.
- Visible issue: the non-hover title is visually inset and reads as a separate control rather than
  text in the page’s reading line. Ivan requests a text-aligned rest state with hover treatment that
  can sit outside layout rather than shifting the text.
- Approved design direction: rest-state text has no horizontal inset; hover/focus canvas expands
  around it out of layout; the edit icon appears without reserving width; edit-input text retains the
  rest-state left anchor.

## Evidence

- Supplied screenshot: `Screenshot 2026-08-13 at 16.52.04.png`.
- `src/components/ui/inline-editable-text.tsx` renders the header read trigger as
  `.hito-inline-header-input-trigger`; its edit affordance is currently an in-flow child whose
  opacity changes.
- `src/styles/controls-fields.css:240-323` gives that trigger per-size minimum widths and padding:
  `sm` uses `--space-3`, `md` `--space-4`, and `lg` `--space-5` horizontally. The trigger also
  currently uses `overflow: hidden`, while the affordance remains in the flex layout even when
  transparent.
- `src/components/hito-ds/reference-pattern-inline-editing.tsx` is the selected `/hitoDS` reference.
  The header variant is also a shared Product primitive; preflight must map its actual consumers
  before editing.

## Observed Behavior

The header trigger’s read state takes the geometry of a padded input. Its text is shifted from the
surrounding content alignment, and the hidden affordance still participates in the trigger’s width.
The same CSS rule owns all `sm`/`md`/`lg` header read triggers.

## Expected Behavior

- Read text is visually aligned to the containing text column and behaves like a normal heading or
  label until interaction.
- Hover and focus-visible show editability without reflow or a change to the text anchor.
- The icon never clips, never forces early truncation in its hidden state, and is accessible through
  the existing named button.
- The editing field opens from the same content anchor; no visible horizontal jump occurs.
- Header size still controls intentional type hierarchy and edit-field geometry; it does not create
  a padded read-state card.

## Source Investigation

The prior Header-input correction fixed reference-grid cross-axis stretching and deliberately
preserved this primitive’s shared padding/minimum-width contract. That closure therefore does not
cover the newly demonstrated visual defect. The first incorrect owner is the canonical header
read-trigger recipe in `src/styles/controls-fields.css`, together with the affordance composition in
`src/components/ui/inline-editable-text.tsx`; the screenshot is not evidence for a route-local
Patterns workaround.

## What Not To Touch

- Non-header `InlineEditableText` and multiline edit contracts.
- Product copy, backend/persistence behavior, Manual Workout domain logic, generated data, or route
  layout other than proof of the real header consumer.
- The `sm`/`md`/`lg` typography hierarchy, tokens, or new size tiers.
- Global field/textarea geometry, unrelated Hito DS playground layout, Figma mutation, or a new
  generic inline-editing abstraction.
- Unrelated dirty files and concurrent task artifacts.

## Execution Preflight

- Existing seam to reuse: `InlineEditableText` and the header selectors in
  `src/styles/controls-fields.css`.
- Smallest change: give only the header read trigger and its affordance a no-inset, anchor-preserving
  read geometry while preserving the current header field editing seam.
- New runtime artifacts: none.
- Simplification: remove the shared read-state padding/minimum-width/in-flow hidden-affordance
  responsibility where it is proven to create the visual offset; do not leave a parallel header
  interaction recipe active.
- Before task-owned write: record all header-variant consumers and the actual computed text/trigger
  geometry for `sm`, `md`, and `lg` in both the reference and one real Product Manual Workout title.

### Implementation preflight — 2026-08-13

- **Canonical owner and smallest seam:** confirmed. `InlineEditableText` emits the header read
  trigger and affordance; `controls-fields.css` assigns the trigger's layout-insetting padding,
  per-size minimum width and in-flow hidden affordance. The smallest correction is limited to
  those header read selectors plus the affordance composition in the primitive.
- **Consumer census:** 10 direct JSX call sites in four files expand to 18 rendered header
  specimens: one Product consumer (`ManualWorkoutConstructorEditor`, `sm`), 11 `/hitoDS`
  reference specimens, and six Figma Export specimens. `admin.capture.tsx` contains an unrelated
  `variant="header"` prop on `QuickNotePanel`, not `InlineEditableText`.
- **Existing Product seam:** Manual Workout's only local customization is
  `--hito-inline-header-min-width` on `.hito-manual-workout-title-field`; it continues to own
  header _edit-field_ width and is not a read-trigger override.
- **Observed reference geometry:** the available loopback page is stale, but the rendered
  `lg` Pattern trigger confirms the demonstrated cause: width `445.61px`, height `76px`,
  `padding-inline: 20px`, `min-width: min(256px, 100%)`, `overflow: hidden`; its text begins
  `21px` after the trigger's left edge. That matches the source-owned `lg` trigger recipe.
- **Runtime boundary:** the current managed `qa_fixture` is healthy but artifact-missing because
  of an unrelated private Admin snapshot integrity marker. It is not accepted as final browser
  evidence. Fresh reference and Manual Workout geometry will be captured after the task build.
- **New runtime artifacts:** none. **Simplification:** remove read-trigger-only padding,
  minimum-width and in-flow hidden-affordance responsibility. The existing header input retains
  its field geometry and uses the same left text anchor through compensated chrome.
- **Current ownership decision:** the direct `ROLE: DESIGN SYSTEM` assignment supersedes the older
  `FRONTEND (ds)` handoff wording. Shared primitive source, canonical component CSS, and `/hitoDS`
  are all within `design_system`; the Product consumer remains read-only proof.

## Validation Expectations

| Check              | Required proof                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consumer mapping   | Header-variant import/usage census before and after change; no route-local override introduced.                                                                                             |
| Source contract    | Read trigger has no layout-insetting horizontal padding/min-width; affordance does not reserve rest-state width; editing field retains text anchor.                                         |
| Interaction        | Pointer hover, keyboard focus, click, Enter, blur, Escape, validation, disabled, and read-only behavior remain correct.                                                                     |
| Browser            | `/hitoDS/patterns#inline-editable-text` and one real Manual Workout header: 1470×801 and 375×812, Dark/Light; inspect alignment, clipping, focus restoration, overflow, and console health. |
| Static             | Focused Prettier, ESLint, `git diff --check`, and production build if runtime source changes.                                                                                               |
| Independent review | A bounded read-only QA review is allowed for the final browser matrix; no same-role implementation delegation.                                                                              |

## Stop Conditions

- If preserving the text anchor requires Product route markup or Manual Workout behavior changes,
  stop and return the cross-owner boundary to PRODUCT.
- If the consumer census shows an existing intentional header treatment incompatible with this
  contract, report the exact consumer and discriminator rather than adding a compatibility variant.
- If a browser matrix cannot use a fresh healthy loopback artifact, record the coverage gap; do not
  claim visual closure from stale output.

## Implementation Receipt — 2026-08-13

### Preflight and demonstrated cause

- The existing canonical owner was confirmed in `src/styles/controls-fields.css`. The header read
  trigger inherited per-size padding, a minimum width, and `overflow: hidden`, while the transparent
  edit affordance still participated in flex layout. The header edit field separately inherited
  canonical field padding and a one-pixel edge, so its text began to the right of the read-state
  content column without compensation.
- The consumer census found 10 direct JSX call sites across four files, producing 18 rendered
  header instances: one Product Manual Workout consumer, 11 `/hitoDS` specimens, and six Figma
  Export specimens. The unrelated `variant="header"` in `admin.capture.tsx` is not an
  `InlineEditableText` consumer.
- `src/components/ui/inline-editable-text.tsx`, the Patterns reference, the Product Manual Workout
  consumer, and Figma Export were inspected and remained unchanged. Product required no source
  change or route-local override.
- New runtime artifacts, files, helpers, components, tokens, wrappers, compatibility paths, routes,
  state owners, and dependencies: none.

### Implementation outcome

- The header read trigger now has zero padding, border, and minimum width with a transparent rest
  background. Its hover/focus canvas is the existing semantic chrome rendered by an absolute
  pseudo-element outside layout.
- The existing edit affordance is absolute and hidden at rest, so it reserves no width and cannot
  cause early truncation. Hover, focus-visible, and the existing forced demo states reveal it
  without moving the trigger or text.
- The existing `sm`/`md`/`lg` input geometry remains canonical. Only an actual
  `data-hito-component="inline-editable-text"` header field compensates its existing padding and
  one-pixel edge with a logical negative margin, preserving the read-state text anchor in edit
  mode. Standalone header-input specimens remain unchanged.
- The obsolete mobile rule that exposed the icon at rest was removed. The existing reduced-motion
  rule now also covers the out-of-flow canvas and affordance.

### Files changed

- `src/styles/controls-fields.css` — canonical read geometry, out-of-flow hover/focus chrome and
  affordance, anchor compensation for the existing edit field, and reduced-motion coverage.
- This canonical item — lifecycle and truthful implementation receipt.

### Validation inventory

| Check                                | Scenario / environment                                                      | Result           | Evidence                                                                                                                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ownership and consumer census        | Repository source search                                                    | Passed           | One canonical CSS owner; 10 direct call sites / 18 rendered header instances; no route-local override or Product edit.                                                                                                   |
| Source contract                      | Scoped CSS inspection                                                       | Passed           | Read trigger has zero padding/border/min-width; affordance is absolute/hidden at rest; input compensation is scoped to the existing component marker; no replacement machinery.                                          |
| Focused formatting and lint          | Prettier and targeted ESLint                                                | Passed           | CSS, primitive, reference, Product consumer, and this item use canonical formatting; targeted ESLint returned no errors.                                                                                                 |
| Diff hygiene                         | Task-owned source diff                                                      | Passed           | `git diff --check -- src/styles/controls-fields.css` returned clean.                                                                                                                                                     |
| Production build                     | Canonical managed `qa_fixture` lifecycle                                    | Passed           | Production client/SSR/Nitro build completed and the managed loopback started healthy from the rebuilt artifact.                                                                                                          |
| DS read/edit anchor                  | `/hitoDS/patterns#inline-editable-text`; 1470×801 and 375×812; Light/Dark   | Passed           | Read text and trigger shared the exact x-coordinate; edit text retained the same anchor (`385px` desktop, `52px` mobile) despite existing input padding and edge.                                                        |
| Hover and keyboard focus             | Pointer plus physical keyboard                                              | Passed           | Semantic canvas and edit icon appeared without any coordinate or width change; the icon remained absolute and reserved no rest-state width.                                                                              |
| Interaction and accessibility        | Live DS Demo and Variants                                                   | Passed           | Enter and blur committed; Escape cancelled; validation retained focus with `aria-invalid`; disabled/read-only states stayed non-editable; successful commit/cancel restored focus.                                       |
| Product inheritance                  | Real unsaved Manual Workout scratch draft; 1470×801 and 375×812; Light/Dark | Passed           | Read and input anchors matched exactly (`428px` desktop, `77px` mobile); hover/focus/edit containment passed; Enter/blur remained local unsaved draft changes.                                                           |
| Truncation, containment, and console | DS and Product matrix                                                       | Passed           | Long text kept ellipsis/nowrap without icon width reservation; document width equalled viewport width; browser warning/error logs were empty.                                                                            |
| Independent QA                       | Named `QA` role, read-only                                                  | Passed           | Focused verdict passed on the fresh serialized handoff; QA made no source, backlog, fixture, data, or runtime-lifecycle mutation.                                                                                        |
| Full DS validator                    | Repository-wide DS contract validator                                       | External failure | Inline Editable Text has no failing assertion. The validator remains red only on the separately recorded stale Brand/Favicon label assertion owned by `2026-08-13-hito-ds-brand-favicon-label-validator-reconciliation`. |

### Preserved boundaries and coverage notes

- `InlineEditableText` markup and behavior, Product Manual Workout source/domain logic, persistence,
  Figma Export, shared tokens, non-header/multiline variants, and unrelated dirty work were preserved.
- In the Product modal, input Escape also closes the existing parent dialog; therefore Product
  focus restoration after that parent close is not claimed. Primitive Escape cancellation and
  focus restoration passed independently in the canonical DS specimen, and no Product behavior
  change was required or made.
- Reduced-motion coverage was source-verified for the trigger, pseudo-element, affordance, and
  read-only state. The browser session did not actively request reduced motion, so no live-emulated
  reduced-motion claim is made.
- The managed runtime was fresh at both owner and QA browser admission. Concurrent private Admin
  backlog snapshot changes can invalidate final artifact freshness after a completed matrix; that
  integration gate is reported separately and does not demonstrate an Inline Editable Text defect.
- This is focused implementation acceptance only. Global QA, hosted, release, deployment, Figma
  parity, and production readiness are not claimed.

### Next owner and blockers

- Next owner: `product` for lifecycle routing only.
- Blockers for this completed Design System implementation: none.
