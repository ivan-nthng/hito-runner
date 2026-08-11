# Hito UI Chrome Color-Role Rationalization Discovery

## Work Item ID

2026-08-11-hito-ui-chrome-color-role-rationalization-discovery

## Status

completed

## Type

design-system-audit

## Priority

high

## Owner

designer

## Mode

Tracked

## Scope

Research and make an evidence-backed design decision for the shared Hito colour roles used by
interactive chrome: buttons, fields, selection controls, toasts/notices, quiet information blocks,
and their rest/hover/active/selected/disabled/focus states. The 2026-08-11 clarification also adds
the shared text/icon hierarchy and its accent, positive, negative, informative/warning, and
disabled meanings to the decision boundary.

This is not an implementation or token-rewrite task. It must preserve the current fixed structural
surface hierarchy and separate domain/intent colours from neutral chrome.

## Stage

Designer discovery completed: source inventory, comparable-system research, and a bounded
recommendation returned to Product. No implementation was dispatched.

## Next Recommended Role

product

## Archive Intent

retain_in_place

## Task

Determine how Hito can reduce visually redundant neutral colours without flattening the hierarchy
or replacing the system wholesale.

The accepted product direction is:

- **Fixed absolute structural roles remain valid:** canvas/background, primary surface,
  elevated/card, and popover/modal may each be an absolute semantic colour when they define real
  elevation or containment.
- **Text remains a compact hierarchy:** primary text is the clearest fixed role; secondary and
  tertiary/de-emphasized text may use source-backed alpha treatment where it preserves contrast and
  readability.
- **Interactive UI chrome should become smaller and more relational:** ordinary controls and quiet
  information states should derive calm contrast from the existing structural role plus a limited
  alpha overlay/tint model, rather than introduce many nearly identical opaque neutral fills.
- When a child needs to read darker/lighter than its parent, it should use a documented semantic
  overlay relation where viable, not a new arbitrary neutral colour.
- Existing workout-domain colours and semantic intent/safety colours are out of scope unless the
  audit proves a neutral-chrome recipe is incorrectly consuming them.

The audit must distinguish a real structural/elevation colour from duplicated UI chrome before
recommending consolidation. It must not pre-decide that every surface is transparent.

## User Report

Ivan reports that the current UI has too many similar colour entities. The concern is not the
existence of the canvas/surface/card/modal elevations themselves; it is the proliferation of
similar opaque neutral fills across buttons, inputs, toasts, info blocks, and local state recipes.
He wants a smaller palette expressed more often through alpha relationships to an existing parent
surface, while retaining a clear hierarchy and avoiding a rewrite.

## Current Evidence

- `src/styles/foundations.css` already owns fixed semantic structural roles such as
  `--color-background`, `--color-surface`, `--color-surface-elevated`, `--color-card`, and
  `--color-popover`.
- The same source correctly contains separate workout-domain and intent role families; those are
  not evidence that neutral UI chrome needs more colours.
- Shared and route-local chrome currently uses many related neutral mixtures in
  `src/styles/controls-fields.css`, `src/styles/controls-lists.css`,
  `src/styles/overlays-feedback.css`, and `src/styles/forms-onboarding.css`, alongside utility
  alpha uses in Product components. Their necessity and duplication have not yet been classified.
- An older [light/dark palette item](2026-06-08-light-dark-mode-and-color-palette-expansion.md)
  established that semantic theme ownership belongs in Hito DS. It is related but not sufficient:
  it predates the current light/dark system and does not answer the present structural-versus-
  interactive alpha distinction.

## Required Discriminator

For each candidate neutral role, the audit must show:

1. its canonical source and all live consumers;
2. whether it represents structural elevation/containment, content hierarchy, interaction state, or
   an accidental local duplicate;
3. whether an existing fixed semantic role plus an alpha relation can reproduce the intended
   contrast in both themes without breaking focus, disabled, selected, error, or success meaning;
   and
4. the minimum retained vocabulary if it cannot be safely consolidated.

A visually similar colour alone is not proof that two roles may be merged.

## Research Deliverable

The Designer produces a concise English decision artifact in this item containing:

- a map of retained fixed structural roles versus candidate alpha-derived chrome roles;
- a small proposed neutral-chrome state vocabulary, explicitly marked **proposal** until Design
  System implementation accepts it;
- 2–4 current, primary-source design-system references used only for reasoning, with the specific
  principle adopted or rejected (do not copy a foreign token model);
- examples of 3–5 Hito consumer families that demonstrate the reduction opportunity and 2–3 that
  must remain absolute or semantically separate;
- accessibility and contrast constraints for both themes; and
- one smallest Design System implementation slice, with a deletion/replacement target and a
  consumer proof plan. It must state what remains untouched.

## What Not To Touch

- No runtime code, CSS, token, Figma, manifest, validator, Product layout, backend, persistence,
  provider, auth, hosted state, or generated source mutation.
- Do not propose a new universal opacity scale, a new colour framework, per-component colour API,
  route-local palette, or a wholesale visual redesign.
- Do not merge structural elevations merely because they are both neutral.
- Do not alter workout-domain palettes, status/intent semantics, data visualisation colours,
  accessibility meaning, or current user data.

## Validation Expectations

- Source inventory is bounded to the canonical foundation and chrome owners; it names evidence
  rather than raw grep counts alone.
- External reference claims link to primary official design-system documentation.
- The recommendation is checked against light and dark structural contrast, interactive state
  distinction, readable text, focus visibility, and intent/workout exclusions.
- The final deliverable contains no implementation or false claim that the palette was simplified.

## Exact Designer Handoff

```text
ROLE: DESIGNER

Mode: Tracked discovery — no implementation

Execute the canonical research item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ui-chrome-color-role-rationalization-discovery.md`

Read AGENTS.md, agents/designer.agent.md, and skills/hito-frontend-design-system/SKILL.md before
research. This is a decision/audit task only: do not edit runtime code, CSS, tokens, Figma,
manifests, validators, Product source, data, or hosted state.

Product decision to preserve:
- Canvas/background, surface, elevated/card, and popover/modal may stay fixed absolute semantic
  colours when they express real containment/elevation.
- Do not make every surface transparent.
- The reduction target is ordinary interactive chrome: buttons, fields, selection, quiet
  information/toast states, and their UI states. Prefer a small source-backed alpha-overlay
  relationship to an existing structural role over many visually redundant opaque neutral fills.
- Text hierarchy, workout-domain colours, intent/safety colours, and data visualisations remain
  semantically distinct unless evidence shows a neutral-chrome misuse.

Inventory the current canonical foundation/chrome owners. For each consolidation candidate, prove
whether it is structural, textual, interactive, semantic/intent, or an accidental duplicate; do
not merge on visual similarity alone. Research 2–4 current primary official design-system sources
for principles, not code/token copying.

Append an English decision artifact to the canonical item: retained structural roles, proposed
neutral-chrome vocabulary, concrete Hito candidate/exception consumer families, contrast and state
constraints in both themes, and one minimal later Design System slice that deletes/replaces a
demonstrated redundant recipe. State exact unknowns and what must not be touched.

Use Russian commentary and an English final research receipt. Do not hand off implementation; the
next owner remains Product unless the audit makes the canonical Design System seam unambiguous.
```

## Designer Decision Artifact — 2026-08-11

### Decision

Hito should keep its fixed structural surface hierarchy and reduce ordinary neutral chrome to a
small set of parent-relative overlays. It should not use one universal opacity scale for every
colour purpose.

The system should be reasoned about as four independent planes:

| Plane | Purpose | Decision |
| --- | --- | --- |
| Structural surface | Canvas, content containment, elevation, transient overlays | Retain fixed theme-resolved semantic colours where the layer is real. |
| Neutral chrome | Rest, hover, pressed, quiet, disabled, focus treatment | Consolidate around a short parent-relative overlay grammar. |
| Content foreground | Primary, secondary, tertiary, disabled text and icons | Use a short contrast-checked hierarchy; do not attenuate an already-muted role again. |
| Chromatic meaning | Accent, informative, positive, warning, negative, workout identity, charts | Preserve the existing Hito hue families and resolve their foreground/surface use separately. |

Alpha is appropriate when it expresses a relationship to a known parent. It is not a semantic role
by itself. A percentage must therefore never be named or justified without its source colour,
parent surface, purpose, state, and contrast target.

### User clarification and visual-direction reading

The 2026-08-11 clarification expands the content hierarchy beyond neutral primary and secondary
text. Hito may use accent, positive, negative, informative/warning, and disabled text when the
meaning is real and the resolved colour is readable in both themes.

The supplied visual reference is an aesthetic direction, not a palette to copy. Its useful
properties are:

- one deep, quiet canvas;
- repeated container geometry rather than many neutral fill levels;
- a small number of confident chromatic fields;
- a single high-contrast foreground treatment for the abstract icons; and
- colour used as a deliberate content/meaning moment, not as decoration on every control.

For Hito, this means calm neutral application chrome plus occasional strong Hito-colour surfaces.
A solid accent/positive/negative/informative tile may be valid for a selected, featured, summary,
or illustrative moment when it uses an explicit readable `on-colour` foreground. It is not the
default treatment for buttons, inputs, tables, or navigation. Existing Hito icon ownership and
geometry remain unchanged; the reference does not authorize a new icon family.

### Current canonical owner and role inventory

| Canonical source | Live owner/families | Classification | Decision |
| --- | --- | --- | --- |
| `src/styles/foundations.css` | `background`, `surface`, `surface-elevated`, `card`, `popover`, sidebar, foreground, intent, workout, and chart roles | Structural, textual, semantic/intent, and domain | Retain as the foundation owner. Do not collapse unlike role groups. |
| `src/styles/layout-typography.css` | Labels, micro-labels, body/caption hierarchy, signal labels | Textual | Add the clarified text-role decision here conceptually; local signal/foreground blends show why readable semantic text cannot reuse a surface colour blindly. |
| `src/styles/controls-fields.css` | Field, secondary field, header input, date field, textarea, field feedback | Interactive with semantic feedback exceptions | Candidate for neutral rest/hover/disabled consolidation. Error and success feedback remain semantic. |
| `src/styles/controls-lists.css` | Button variants, checkbox/radio, choice toggle, tabs, metadata tags, slider | Interactive plus semantic/intent and data-like exceptions | Neutral button/toggle recipes are candidates. Signal/success/error states and slider meaning remain separate. |
| `src/styles/overlays-feedback.css` | Dialog/sheet/menu/select, state surface, toast | Mixed structural, interactive, and semantic | Dialog/sheet/menu/toast containers remain structural. Select chrome and neutral state recipes are candidates. Intent state-surface tones remain semantic. |
| `src/styles/reference-workbench.css` | `hito-surface`, `hito-surface-flat`, `hito-surface-quiet`, App Shell profile trigger | Structural and quiet-interactive | `hito-surface` remains structural. The `42%` quiet-surface and `58%` hover recipes are candidates, but their production use from a reference-named owner is an ownership unknown, not permission to move them in this task. |
| `src/styles/forms-onboarding.css` | Onboarding/manual-workout local rows, fields, selected states, surfaces | Product-local consumer recipes | Inventory as consumers only. Do not create a route-local colour source or migrate them in the first slice. |
| `src/components/ui/hito-control-contract.ts` and shared UI primitives | Canonical class composition for Button, Field, and Choice Toggle | Interactive contract | Reuse this seam before adding tokens or per-component colour APIs. |

Foundation-specific findings:

- `--secondary` and `--secondary-foreground` are exported in the foundation and generated manifest,
  but source search found no runtime consumer outside those definitions. They are an orphan-role
  candidate, not yet an authorized deletion because generated/export consumers must be proven.
- `--muted` is live as both a neutral fill source and, through `muted-foreground`, a content role.
  Those responsibilities must be separated by use before either role can be simplified.
- `--accent` is live in calendar range selection, a Body Notes selection treatment, router fallback
  chrome, and one controls gradient. It is a selection/accent role, not a generic neutral fill.
- `--input` is live in header-field mixtures, manual-workout field recipes, and calendar borders.
  Its usage is not yet consistent enough to rename or delete in the first slice.
- `card` currently aliases `surface` while `popover` aliases `surface-elevated` in light theme and is
  distinct in dark theme. Shared values do not make their semantic roles duplicates.
- In the four audited chrome CSS owners, source inspection found 55 distinct percentage literals.
  The literal `42%` occurs 15 times, but represents unrelated concepts including shadow opacity,
  focus/border strength, semantic foreground mixing, structural mixing, and gradient stops. This is
  evidence that a percentage is not currently a reliable role; it is not evidence that every `42%`
  use is wrong.

### Candidate consumer-family classification

| Candidate family | Canonical source and live consumer map | Classification and decision |
| --- | --- | --- |
| Field and Select trigger | `hito-field` in `controls-fields.css` through Input, Textarea, inline editing, compound range, date fields, auth/admin/manual-workout consumers; `hito-ui-select-trigger` in `overlays-feedback.css` through manual-workout editors, DS specimens/playgrounds, workbench/devtools controls, and Value Tag | Interactive. The base, hover, focus, and disabled neutral recipes are duplicated and should share Field chrome. |
| Secondary, outlined, and ghost buttons | `hito-button-*` in `controls-lists.css`, composed by `hito-control-contract.ts`, with Product, auth, admin, devtools, and `/hitoDS` consumers | Interactive. Map neutral states to the proposed overlay grammar. Primary signal and success/error tones stay semantic. |
| Choice Toggle, menu item, and calendar selection | `hito-choice-toggle` and calendar selection in `controls-lists.css`/`calendar.tsx`; menu items and select items in `overlays-feedback.css`; Calendar, DS, and workbench consumers | Interactive selection. Neutral rest/hover may share chrome tiers; selected must retain an accent edge/fill plus a non-colour indicator or explicit selected state. |
| Quiet information and neutral feedback | `hito-surface-quiet`, neutral `hito-state-surface`, muted metadata/status tags, neutral/info toast body | Mixed. Quiet non-interactive information may use the lowest neutral overlay. Toast/dialog containers remain elevated structural surfaces; only the neutral informational treatment is a chrome candidate. |
| Text and icons | Foundation `foreground`/`muted-foreground`, typography classes, and utility consumers across Product, admin, devtools, and `/hitoDS` | Textual. Consolidate primary/secondary/tertiary/disabled attenuation and add contrast-resolved accent/positive/negative meanings only where live semantics require them. |

Exceptions that must not be folded into neutral chrome:

1. Dialog, sheet, popover/menu, toast container, App Shell/sidebar, card, and elevated content
   surfaces when they express real containment or elevation.
2. `signal`, `success`, `warn`, `destructive`, and `info` meaning, including feedback borders/icons;
   colour must be paired with text, an icon, shape, or programmatic state.
3. Workout-type/section identity and chart/data-visualisation roles. Their colours encode domain or
   categorical meaning and are not neutral-palette duplication.

### Proposed neutral-chrome vocabulary

This is a **proposal**, not an implemented token contract. The numeric values are starting points
for rendered proof, not approved final values.

| Proposed role | Starting source weight | Intended use |
| --- | ---: | --- |
| `neutral-clear` | `0%` | Ghost/default rest when the parent already provides enough containment. |
| `neutral-subtle` | `8%` | Quiet information, ghost hover, very low emphasis chrome. |
| `neutral-standard` | `12%` | Secondary control rest or neutral hover. |
| `neutral-strong` | `16%` | Pressed/active neutral chrome or the strongest neutral state. |

The source should normally be the theme foreground composited over the known parent structural
surface. State mapping should be family-based, for example:

- ghost: clear → subtle hover → standard pressed;
- secondary: subtle/standard rest → standard hover → strong pressed;
- quiet information: subtle with no interactive escalation unless the whole row is interactive;
- selected: semantic accent-soft fill at a measured low tier plus accent edge/icon/text;
- disabled: keep the rest/clear fill and change the content affordance; do not invent a separate
  opaque disabled neutral;
- focus: use the existing ring/stroke contract independently of fill. Focus is not the next alpha
  step.

If `8/12/16` cannot produce distinguishable states on every retained structural parent, the owner
must adjust the family mapping or add a second indicator. It must not create `13/14/18/21/26/42%`
local exceptions without a demonstrated contrast or perception requirement.

Chromatic soft surfaces may reuse the same semantic state names but must be resolved from the
existing Hito hue roles and tested independently. A red, green, blue, orange, or signal overlay is
not guaranteed to have the same perceived strength at the same percentage. No universal coloured
opacity scale is approved by this artifact.

### Proposed text and icon vocabulary

This is also a **proposal** pending rendered contrast proof.

| Proposed role | Starting relationship | Constraint |
| --- | --- | --- |
| `text-primary` | Existing fixed `foreground` | Main copy, titles, values; no attenuation. |
| `text-secondary` | Foreground at approximately `75%` over the known structural parent | Supporting copy that remains fully readable. |
| `text-tertiary` | Foreground at approximately `60%` over the known structural parent | Metadata/captions only; normal-size text must still meet 4.5:1. |
| `text-disabled` | Foreground at approximately `40%` | Inactive controls only; never use for essential explanatory content. |
| `text-accent` | Existing `signal` hue resolved against foreground per theme | Accent/action meaning; not raw signal if contrast fails. |
| `text-positive`, `text-negative`, `text-informative`, `text-warning` | Existing intent hue resolved per theme and parent | Semantic meaning only; pair with text/icon/state and meet normal text contrast. |

Do not derive tertiary or disabled text by applying opacity to `muted-foreground`; that compounds
two attenuation decisions and makes the result dependent on both the theme and parent.

A source-value check of the declared OKLCH foundation values gives useful discriminators:

- foreground at `75%` remains above approximately 8:1 on the four retained structural parents in
  both themes;
- foreground at `60%` remains approximately 6.27:1 or higher in dark and 4.80:1 or higher in light;
- foreground at `55%` drops to approximately 4.07:1 on a light structural surface, so it is not a
  safe universal normal-text tier;
- raw light `signal` is approximately 3:1 against light canvas/surface and is not normal body text;
  the current label CSS already mixes it with foreground in light theme;
- raw dark `destructive` drops to approximately 4.36:1 on the elevated surface, so negative text
  also needs a theme-resolved foreground recipe rather than blind raw-token reuse.

These are calculations from source values, not browser acceptance. The final implementation must
measure rendered results after colour mixing, compositing, and actual typography.

### External primary-source principles

1. [Material Design 3 — States](https://m3.material.io/foundations/interaction/states/overview):
   adopt consistent state treatment and at least two visual indicators where accessibility needs
   them. Reject copying Material state-layer percentages or its component palette.
2. [Fluent 2 — Color tokens](https://fluent2.microsoft.design/color-tokens/): adopt the separation
   of neutral, brand, and status aliases, explicit semantic foreground roles, and a transparent
   subtle rest state with defined interaction states. Reject Fluent's large token inventory and
   opaque neutral ladder as Hito's model.
3. [Carbon — Layering colours](https://carbondesignsystem.com/elements/color/usage/): adopt the
   distinction between structural layers and contextual component treatment, and the principle
   that text/icon roles need not multiply with every structural layer. Reject Carbon's nested layer
   machinery and numbered layer sets for Hito.
4. [Spectrum — Color fundamentals](https://spectrum.adobe.com/page/color-fundamentals/) and
   [Spectrum — Color system](https://spectrum.adobe.com/page/color-system/): adopt theme-specific
   target contrast, perceptual evaluation, sparse semantic colour, and explicit positive/negative/
   informative/accent meanings. Also adopt Spectrum's warning that alpha contrast is not inherently
   predictable. Reject its large colour scale and any assumption that one alpha works for every hue
   and background.

These sources inform the reasoning only. No foreign token names, values, or component recipes are
proposed for copying.

### Accessibility and state constraints

| Check | Required constraint |
| --- | --- |
| Normal text | At least 4.5:1 against every supported parent on which the role is allowed. |
| Large text | At least 3:1 when it qualifies as large text. |
| Control boundary/state indicator | Required visual information must reach at least 3:1 against adjacent colours. |
| Focus | Keep an explicit visible ring/stroke; target 3:1 adjacent contrast and do not express focus through fill alone. |
| Hover/pressed/selected | Remain distinguishable in both themes; pair colour with edge, motion, icon, shape, or selected semantics when needed. |
| Disabled | WCAG exempts inactive controls from minimum contrast, but essential information must not be placed in disabled styling. |
| Intent/accent | Never rely on hue alone. Preserve text/icon/state labels and programmatic meaning. |
| Alpha compositing | Test on `background`, `surface`, `surface-elevated/card`, and `popover/modal`; no result may be inferred from one parent or one theme. |
| High-colour surfaces | Use an explicit on-colour foreground pair and verify text/icons in light and dark themes; do not assume black or white always works. |

The normative baseline is [WCAG 2.2](https://www.w3.org/TR/WCAG22/), particularly 1.4.1,
1.4.3, and 1.4.11. Colour meaning must have another cue, normal text must meet 4.5:1, and visual
information required to identify controls/states must meet 3:1 against adjacent colours.

### Smallest later Design System slice

**Slice:** make `SelectTrigger` reuse the existing Field chrome contract and delete its duplicated
neutral-state recipe.

Demonstrated duplication:

- `.hito-field` and `.hito-ui-select-trigger` use the same base border, base background, foreground,
  hover border/background, focus border/ring, placeholder attenuation, and disabled fill/text.
- The duplicated definitions live in `controls-fields.css` and `overlays-feedback.css` respectively.
- `SelectTrigger` is a shared primitive in `src/components/ui/select.tsx`, so this is a canonical DS
  seam rather than a Product-route workaround.

Later implementation boundary:

1. Compose the existing `hito-field`, `hito-field-primary`, and matching size classes into the
   shared Select trigger without adding a new colour API or token.
2. Preserve select-specific layout, icon, `data-state="open"`, placeholder, and Radix behaviour.
3. Delete the duplicated base/hover/focus/disabled neutral declarations from
   `.hito-ui-select-trigger`; keep only select-specific structure/state rules that Field cannot own.
4. Preserve existing consumers that intentionally add `hito-field-secondary` and prove cascade
   parity before deletion.

Consumer proof plan:

- shared Select default and small sizes;
- rest, hover, open/focus, placeholder, and disabled states;
- dark and light on background, surface, and elevated parents;
- manual-workout Select consumers, Value Tag select, devtools/workbench selects, and `/hitoDS`
  live/static specimens;
- class/metadata validation and focused build only as required by the implementation contract.

This slice intentionally does not change foundation colour values or introduce the proposed alpha
vocabulary. It first removes a duplicate owner so a later measured Field/Select chrome adjustment
has one source of truth.

### Exact unknowns and stop boundaries

Unknowns that require later rendered Design System proof:

- whether `8/12/16%` gives enough state separation on every retained parent in both themes;
- the final theme-resolved values for accent/positive/negative/informative/warning text;
- whether the zero-runtime `secondary` export has downstream manifest/Figma consumers;
- whether `hito-surface*` should remain in the reference-named CSS owner after its Product consumer
  map is confirmed;
- which Product moments, if any, should adopt the supplied high-colour tile aesthetic; and
- forced-colour/high-contrast behaviour and browser-rendered compositing after an implementation
  exists.

Must not be touched by this discovery or the first slice:

- fixed structural surface values and App Shell/sidebar containment;
- workout-domain colours, chart/data-visualisation roles, or their mappings;
- semantic intent meaning, provider/backend/data/auth state, or user data;
- route-local palette creation, universal opacity tooling, a new token framework, a new icon family,
  Figma, generated manifests, validators, or Product layout unless a later scoped implementation
  proves that exact owner is required.

Product remains the next owner. The Select/Field Design System seam is unambiguous, but this artifact
does not authorize or dispatch implementation. Product must first accept or revise the proposed
vocabulary and create/route a separate bounded implementation item.

### Discovery validation

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Canonical instructions | Read-only Designer discovery | Passed | `AGENTS.md`, `agents/designer.agent.md`, and `skills/hito-frontend-design-system/SKILL.md` were read before research. |
| Source ownership | Current shared checkout; canonical foundation/chrome owners | Passed | Foundation, typography, field, control, overlay/feedback, reference surface, onboarding consumer, and shared primitive seams classified above. |
| Duplicate discriminator | Field versus Select neutral state recipes | Passed | Matching base/hover/focus/placeholder/disabled recipes and shared Select entry point identified. |
| Both-theme text discriminator | Declared OKLCH foundation values; source-level calculation | Passed for decision boundary | `75%`/`60%` candidates remain above the stated source-level thresholds; `55%` light, raw light signal, and raw dark destructive expose unsafe universal reuse. Browser acceptance remains intentionally open. |
| External research | Current primary official Design System sources | Passed | Material 3, Fluent 2, Carbon, and Spectrum principles linked and bounded above. |
| Visual reference | User-supplied 2026-08-11 screenshot | Passed for direction | Structural calm, repeated geometry, sparse high-colour fields, and high-contrast icon treatment translated without palette/icon copying. |
| Repository mutation boundary | Shared dirty main checkout | Passed | Only this canonical backlog item was changed; no runtime, CSS, token, Figma, manifest, validator, Product, data, or hosted mutation was made. |
