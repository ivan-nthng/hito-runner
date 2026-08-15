# Hito DS Metadata Tag Light And Accent Contract Discovery

## Work Item ID

`2026-08-13-hito-ds-metadata-tag-light-and-accent-contract-discovery`

## Status

`completed`

## Type

Tracked — Design System visual-contract discovery and implementation specification

## Priority

P1

## Owner

DESIGNER

## Scope

Define the visual and API contract for the existing shared `HitoMetadataTag` primitive across
Product, Admin, DevTools, and `/hitoDS`. The resulting specification will be handed to DESIGN
SYSTEM for implementation.

## Archive Intent

Retain one accepted visual decision, source-owner inventory, contrast evidence, and implementation
contract. Do not create a parallel component catalogue or an implementation receipt.

## Stage

DESIGNER discovery and implementation specification completed; proposed contract awaits Product
acceptance and owner routing.

## Next Recommended Role

PRODUCT — accept the restricted accent-pair contract, then route the bounded shared-primitive slice
to DESIGN SYSTEM and the separately owned consumer migrations in the recorded order.

## User Outcome

Metadata tags have two clearly differentiated, borderless visual variants:

1. **Light** — quiet metadata treatment with an understated background and legible text.
2. **Accent** — deliberately bright, expressive treatment using approved Hito palette pairings.

Accent colour may express semantic status where that is truthful, or use a non-semantic Hito palette
pairing where the tag is decorative/organizational. The contract must make those meanings explicit,
not allow arbitrary inline colour or make a decorative hue look like a success/warning/error claim.

## User Report

Ivan requested removal of metadata-tag borders and asked for two types rather than one generic
semantic recipe: a quiet borderless `light` variant and a colourful borderless `accent` variant. He
explicitly wants the colour approach designed rather than mechanically derived: accent may be
semantic or non-semantic, but it must be attractive, theme-aware, token-based, and contrast-safe.

## Current Evidence

- The shared runtime primitive is [metadata-tag.tsx](../../../src/components/ui/metadata-tag.tsx).
  It currently exposes an unconstrained `tone?: string` and emits `data-tone`.
- The shared visual owner is [controls-lists.css](../../../src/styles/controls-lists.css:1099). Its
  base rule has a `chrome-edge-default` border; semantic tone rules subsequently assign additional
  border colours and low-alpha fills.
- The primitive is physically documented at `/hitoDS/components#status`, in the `Metadata tags and
menu` variants block owned by
  [reference-components-controls.tsx](../../../src/components/hito-ds/reference-components-controls.tsx:1273).
- Existing consumers include shared/operational metadata and the `AdminMetadataMenu`; the final
  inventory must distinguish actual semantic truth from decorative grouping before proposing API
  changes.

## Observed Behaviour

The current component has one default anatomy plus free-form semantic tone styling. It always uses a
perimeter border at rest, and neither its runtime API nor its reference documentation makes a
separate visual-intensity choice (`light` versus `accent`) explicit. Consequently, Product consumers
cannot consistently express quiet metadata versus intentionally vivid tags without overloading
`tone`.

## Required Discovery

1. Inventory every live `HitoMetadataTag` consumer, the `data-tone` values it uses, whether it is
   interactive/read-only, and whether its current colour is semantic status or non-semantic
   organization.
2. Inspect the existing Hito primitive/semantic palette, foreground-pairing contracts, theme rules,
   typography, focus ring, radius, and motion contracts. Reuse them; do not use raw hex, custom
   alpha recipes, inline styles, or an arbitrary `color` API.
3. Review current authoritative Design System guidance on tags/badges/labels and accessible text
   contrast. Use it as input, not as a mandate to import another system's component.
4. Propose the smallest complete type model. At minimum, decide whether the contract should separate
   visual `variant` (`light | accent`) from meaning-bearing `tone`, and enumerate only the valid
   tone/palette combinations. Explain how non-semantic accent colours avoid implying status.
5. Provide a colour decision table for both Dark and Light themes. For each approved combination,
   specify background token/expression, foreground token, expected contrast, semantic/decorative
   meaning, intended use, prohibited use, and fallback/invalid-combination rule.
6. Define compact anatomy and states: default, light/accent, each admitted tone/palette, interactive
   hover, keyboard focus, readonly, disabled or unavailable host state where supported, long-label
   truncation, pointer/touch behaviour, and screen-reader naming. Borders must be absent in both
   variants; focus remains a canonical ring, not a replacement border.
7. Specify the exact `/hitoDS/components#status` reference matrix that makes the two variants and
   their valid meaning legible without turning the page into a colour palette.
8. Produce one implementation-ready DESIGN SYSTEM handoff in this canonical item: source seams,
   admitted files, deletion/reuse plan, consumer migration order, validation matrix, rollback, and
   stop conditions.

## Design Constraints

- Reuse the existing `HitoMetadataTag`, semantic Hito token system, typography, radius, Button/Icon
  only where existing interactions require them, and the established focus ring.
- `light` and `accent` describe visual presentation; they must not silently replace semantic
  `success`, `warning`, `destructive`, or other actual status meanings.
- A non-semantic accent must use a bounded named Hito palette choice with a documented purpose; no
  consumer-provided colours, custom CSS variables, raw hex values, or one-off alpha formulas.
- Do not introduce a generic badge/tag framework, second primitive, new colour family, Figma-only
  style, data model, persistence, or feature behaviour merely to cover combinations.
- If existing canonical colour pairs cannot satisfy the needed contrast, return that specific colour
  gap to PRODUCT. Do not invent a token during design discovery.

## What Not To Touch

- Runtime TypeScript, CSS, generated manifests, validators, Figma, Product/Admin/DevTools source,
  storage, providers, Git lifecycle, and hosted state.
- `HitoStatusPill`: its recently completed borderless change is separate and is not precedent for a
  Metadata Tag API.
- Generic status, chip, value-tag, button, menu, or surface contracts unless source inventory
  proves a direct shared ownership issue; return such expansion to PRODUCT.

## Definition Of Done

1. One evidence-backed visual/API recommendation separates presentation from semantic meaning.
2. The full consumer inventory and migration classification are recorded.
3. Both themes have exact, contrast-evaluated approved pairs and invalid-combination rules.
4. The reference matrix, states, accessibility, responsive behaviour, source seams, validation,
   rollback, and stop conditions are implementation-ready for DESIGN SYSTEM.
5. No runtime or Figma mutation occurs; Markdown links, research sources, and diff hygiene pass.

## Exact Handoff Prompt

```text
ROLE: DESIGNER

Task: Hito DS Metadata Tag Light And Accent Contract Discovery
Mode: Tracked — design discovery and implementation specification only.

Read before the first write:
- AGENTS.md
- agents/designer.agent.md
- skills/hito-frontend-design-system/SKILL.md
- skills/hito-plan-writing-and-closeout/SKILL.md only if the canonical item needs durable plan detail
- docs/tasks/backlog/2026-08-13-hito-ds-metadata-tag-light-and-accent-contract-discovery.md
- src/components/ui/metadata-tag.tsx
- src/styles/controls-lists.css
- src/components/hito-ds/reference-components-controls.tsx

Outcome:
Create one implementation-ready design contract for the existing shared `HitoMetadataTag`. It must
have two borderless visual variants: `light` for quiet metadata and `accent` for vivid Hito palette
pairings. Accent may be semantic when it truthfully represents status or non-semantic when it serves
organizational/expressive metadata, but the contract must make that distinction unambiguous.

Research and evidence:
1. Inventory every live consumer and current `data-tone`, classify semantic status versus
   decorative/organizational use, and preserve the existing source boundary.
2. Inspect existing Hito tokens and theme/foreground/focus contracts first. Research authoritative
   badge/tag and accessibility guidance as evidence; do not import another system's API or styles.
3. Propose the smallest type model, including whether `variant` (`light | accent`) and semantic
   `tone` must be separate. Do not leave an unconstrained arbitrary-colour path.
4. Supply a Dark/Light colour table for every approved pair: background source, foreground source,
   contrast evidence, meaning, intended/prohibited use, and invalid-combination behavior.
5. Define default, interactive hover, keyboard focus, readonly, disabled-host, long-label,
   touch/pointer, and screen-reader behaviour. Both variants are borderless; focus remains the
   canonical ring.
6. Specify the concise `/hitoDS/components#status` reference matrix and a single bounded DESIGN
   SYSTEM implementation handoff: source seams, expected deletion/reuse, consumer migration order,
   validation, rollback, and stop conditions.

Boundaries:
- Discovery/documentation only. Do not edit runtime code, CSS, tokens, manifests, validators,
  Figma, Product/Admin/DevTools source, data, hosted state, or Git lifecycle.
- Do not create a second tag/badge primitive, generic framework, colour family, raw hex recipe,
  custom alpha formula, consumer-provided colour API, or Figma-only truth.
- `HitoStatusPill` is out of scope. Preserve unrelated dirty work.
- Return to PRODUCT if valid accent pairings require a new token, shared colour decision, Product
  behavior, or another owner.

Validate internal/external Markdown links, scoped Prettier, and `git diff --check`.

Final receipt in English: user outcome, current-owner/consumer evidence, research sources, accepted
or proposed decision, complete colour/contrast and state matrix, source/implementation map, open
decision or exact next owner, validation, and boundaries. Do not claim implementation, browser QA,
Figma parity, Global QA, release, or deployment.
```

## Lifecycle Note

Dispatched by PRODUCT to the existing DESIGNER role for read-only discovery. No implementation has
started and no runtime source changed as part of task creation.

## Designer Decision Report — 2026-08-13

### Decision Status

**Proposed for Product acceptance.** Keep the existing `HitoMetadataTag`; give it two borderless
visual variants, and separate visual intensity from meaning. `light` is the default quiet treatment.
`accent` is an explicit, scarce treatment and admits only source-backed foreground/background pairs.

The smallest truthful API is a discriminated contract, not another free-form `tone` string:

```ts
type HitoMetadataTagIntent = "positive" | "warning" | "negative" | "informative";

type HitoMetadataTagAppearance =
  | {
      variant?: "light";
      intent?: HitoMetadataTagIntent;
      accent?: never;
    }
  | {
      variant: "accent";
      intent: "positive" | "informative";
      accent?: never;
    }
  | {
      variant: "accent";
      accent: "signal";
      intent?: never;
    };
```

- Omitted `variant`, `intent`, and `accent` means neutral `light` metadata.
- `intent` is semantic and must match the visible label and source truth.
- `accent="signal"` is explicitly non-semantic Hito emphasis. It may organize or brand metadata; it
  must not mean success, warning, error, or selection.
- `warning` and `negative` remain valid only in `light`. No safe bright Warning pair exists, and the
  current Dark Destructive pair does not meet small-text contrast.
- `muted`, `neutral`, `success`, `destructive`, `error`, `signal`, and `rollout` do not remain as
  interchangeable visual aliases. Their migration is defined below.
- Consumers cannot supply a colour, CSS custom property, raw value, alpha, or arbitrary string.

This model preserves semantic status without pretending every coloured tag is a status. It also
keeps a future palette addition an explicit Design System decision rather than an accidental
consumer API expansion.

### Execution Preflight And Source Snapshot

- Branch: `main`
- Source snapshot: `74607987885ca40f33658c79fba174d173d45646`
- The checkout was already broadly dirty. The audit was read-only except for this canonical item;
  all runtime, CSS, generated, Figma, Product, Admin, and DevTools bytes were preserved.
- Canonical owners inspected:
  - runtime/API: [metadata-tag.tsx](../../../src/components/ui/metadata-tag.tsx);
  - visual recipe: [controls-lists.css](../../../src/styles/controls-lists.css:1099);
  - semantic colours and themes: [foundations.css](../../../src/styles/foundations.css:401);
  - component reference: [reference-components-controls.tsx](../../../src/components/hito-ds/reference-components-controls.tsx:1273);
  - operational wrapper: [AdminOperationalComponents.tsx](../../../src/components/admin/AdminOperationalComponents.tsx:360);
  - reference-header wrapper: [playground.tsx](../../../src/components/hito-ds/playground.tsx:6).

The source has 27 direct JSX call sites across eight files. Two are shared fan-out seams:
`AdminMetadataMenu`, used by Admin and the component reference, and `HitoDsPlayground`, whose status
slot renders 19 current reference tags (18 `signal`, one `neutral`). Two additional playgrounds omit
`status` and therefore render no metadata tag.

### Current Consumer And Meaning Inventory

Each reachable family is classified once below. `semantic` means the label reports a real state or
priority. `organizational` means provenance, ownership, type, reference maturity, or grouping.

| Live owner / route                                                                                                                      | Current values and interaction                                                                                                                                            | Classification                                                                                                                        | Proposed migration                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Admin Work items](../../../src/routes/admin.capture.tsx:957), `/admin/capture`                                                         | Read-only status, type, priority, role, source provenance, and malformed-metadata tags; `success`, `warning`, `signal`, `rollout`, or no tone; tooltip tags are focusable | Status and high/urgent priority are semantic; type, role, and source provenance are organizational                                    | Dense statuses use `light` with the exact intent below; type/role use default `light`; repo provenance may use `accent="signal"`; metadata defects use `light` + `warning` |
| [AdminMetadataMenu](../../../src/components/admin/AdminOperationalComponents.tsx:360), `/admin/capture` and `/hitoDS/components#status` | Operational menu trigger; `asChild`, native button, `interactive`; wrapper accepts `tone?: string`                                                                        | The menu action is behavioural; its displayed status/priority may be semantic while type/role are organizational                      | Preserve the native button and chevron. Use the same appearance union; no generic interactive span and no arbitrary string                                                 |
| [Saved plan library](../../../src/components/progress/SavedPlanLibraryPanel.tsx:429), `/progress?tab=plans`                             | Read-only `success` for Available, `muted` for Hidden                                                                                                                     | Semantic record visibility                                                                                                            | `light` + `positive` for Available; default `light` for Hidden                                                                                                             |
| [Local Inspector batch](../../../src/components/devtools/LocalUiInspectorBatchReview.tsx:181), local DevTools                           | Read-only `muted` fix scope, `success` ownership label, `warning` missing target, nested visually inside the row button                                                   | Fix scope and ownership are organizational; missing target is semantic warning. The current ownership `success` is a meaning mismatch | Default `light` for scope and ownership; `light` + `warning` for missing target. Tag remains non-interactive inside the row button                                         |
| [DS Overview](../../../src/components/hito-ds/reference-overview-page.tsx:63), `/hitoDS`                                                | `warning` Figma blocker, `success` Reviewed, `muted` Secondary                                                                                                            | Blocker/review are semantic; Secondary is organizational                                                                              | `light` + `warning`; `accent` + `positive` as the sparse positive specimen; default `light`                                                                                |
| [Components reference](../../../src/components/hito-ds/reference-components-controls.tsx:1273), `/hitoDS/components#status`             | Read-only Reviewed/Plan first plus operational Review state menu; `success`, `signal`, or no tone                                                                         | Reviewed is semantic; Plan first is organizational; Draft is lifecycle information, not brand meaning                                 | Use the reference matrix below. Draft becomes `light` + `informative`; Reviewed may become `accent` + `positive` in this intentionally demonstrative surface               |
| [Figma export board](../../../src/components/hito-ds/figma-export-board.tsx:957), `/hitoDS/export/figma`                                | Static `neutral`, `success`, `warning`; `interactive signal` is currently a non-operable span                                                                             | Reference-only examples; the interactive span is invalid affordance evidence                                                          | Mirror the accepted code matrix. Replace the fake interactive span with the existing native operational-menu seam or a real button host; do not mutate Figma in this task  |
| [HitoDsPlayground](../../../src/components/hito-ds/playground.tsx:127), `/hitoDS/*`                                                     | 18 reachable `signal` labels such as “Core control” or “Pattern”; one `neutral` inventory count                                                                           | Organizational reference metadata, never semantic status                                                                              | `accent="signal"` for deliberately prominent reference classification; default `light` for the inventory count                                                             |

The current runtime values reachable from consumers are absent/default, `neutral`, `muted`,
`success`, `warning`, `signal`, and `rollout`. CSS also accepts `destructive` and `error`, and the
playground type admits `destructive`, but no current call site renders those values. The duplicate
aliases are API reach, not proof of a needed product state.

#### Exact semantic migrations for Admin state maps

These mappings remove the current `rollout` catch-all without changing underlying Product data:

| Source truth                                       | Appearance                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Capture `new`                                      | default `light`                                                                                        |
| Capture `in_review`                                | `light` + `informative`                                                                                |
| Capture `ready_for_codex`                          | `light` + `positive` in dense rows; `accent` + `positive` only where Product intentionally promotes it |
| Capture `done`                                     | `light` + `positive`                                                                                   |
| Capture `archived`                                 | default `light`                                                                                        |
| Repo `backlog`, `closed`, `archived`               | default `light`                                                                                        |
| Repo `ready`, `completed`                          | `light` + `positive`                                                                                   |
| Repo `in_progress`                                 | `light` + `informative`                                                                                |
| Repo `blocked`                                     | `light` + `warning`                                                                                    |
| Priority `high`, `urgent`                          | `light` + `warning`                                                                                    |
| Priority `low`, `medium`, unset; type; target role | default `light`                                                                                        |

The visible text remains the primary meaning. Colour never replaces “blocked”, “ready”, “invalid”,
or another state label.

### Existing Token Evidence And Colour Contract

No new colour token is needed for the admitted set. The contract reuses the semantic Foundation
owners already present in both themes:

- quiet surface: `--color-chrome-subtle`;
- quiet neutral copy: `--color-text-secondary` (replacing the marginal current tertiary copy);
- quiet semantic copy: `--color-text-positive`, `--color-text-warning`,
  `--color-text-negative`, and `--color-text-informative`;
- bright pairs: `--color-signal` / `--color-signal-foreground`,
  `--color-success` / `--color-success-foreground`, and
  `--color-info` / `--color-info-foreground`;
- focus: `--color-ring` with a transparent two-pixel offset that exposes the actual parent;
- structure: `--radius-sm`, `--space-1`, `--space-2`, and the existing `hito-label-sm` role.

Both themes currently resolve Card to Surface. Measurements nevertheless cover Canvas, Surface/Card,
Elevated, and Popover because the alpha background is parent-dependent.

#### Light variant

| Intent          | Background              | Foreground                 | Dark contrast range | Light contrast range | Intended / prohibited use                                                                   |
| --------------- | ----------------------- | -------------------------- | ------------------: | -------------------: | ------------------------------------------------------------------------------------------- |
| Neutral default | `--color-chrome-subtle` | `--color-text-secondary`   |      7.72:1 minimum |       7.40:1 minimum | Type, role, ownership, counts, hidden/archived, ordinary provenance. Not success or warning |
| `positive`      | `--color-chrome-subtle` | `--color-text-positive`    |         5.98–6.99:1 |          5.71–6.13:1 | Available, reviewed, ready, completed. Not selection or merely “present”                    |
| `warning`       | `--color-chrome-subtle` | `--color-text-warning`     |         6.02–7.04:1 |          4.91–5.27:1 | Blocked, high/urgent, invalid or missing metadata. Not general importance                   |
| `negative`      | `--color-chrome-subtle` | `--color-text-negative`    |         4.74–5.54:1 |          7.10–7.62:1 | Actual failure/error/destructive state. No current live consumer requires it                |
| `informative`   | `--color-chrome-subtle` | `--color-text-informative` |         5.82–6.81:1 |          5.20–5.59:1 | In progress, review underway, live informational state. Not brand decoration                |

#### Accent variant

| Meaning                         | Background / foreground                          | Dark text contrast | Light text contrast | Intended / prohibited use                                                                                 | Invalid behaviour                                                                  |
| ------------------------------- | ------------------------------------------------ | -----------------: | ------------------: | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Non-semantic `accent="signal"`  | `--color-signal` / `--color-signal-foreground`   |             9.42:1 |              6.15:1 | Sparse Hito reference classification or expressive provenance. Never status, selection, warning, or error | Type rejects simultaneous `intent`; unknown accent rejects at compile time         |
| Semantic `intent="positive"`    | `--color-success` / `--color-success-foreground` |             8.48:1 |              7.06:1 | One or few promoted Ready/Reviewed/Available outcomes                                                     | Copy that does not state a positive outcome must use Light or Signal               |
| Semantic `intent="informative"` | `--color-info` / `--color-info-foreground`       |             8.26:1 |              6.43:1 | One or few promoted live/in-progress informational states                                                 | Brand/category use must use Signal; warning/negative values reject at compile time |

Contrast was calculated from the current source OKLCH values, including alpha composition of
`chrome-subtle`, using the WCAG relative-luminance formula. Parent ranges cover the current Dark and
Light Canvas, Surface/Card, Elevated, and Popover values. Implementation must remeasure browser
computed colours after the actual state recipe lands; these calculations are decision evidence, not
browser QA.

The Light Signal fill has approximately 2.99:1 separation from the least contrasting Light parent.
Therefore a Signal operational tag must retain visible text plus the existing chevron/action cue;
its colour cannot be the only affordance. The canonical focus ring measures at least 6.29:1 in Dark
and 3.50:1 in Light against the tested parents.

#### Rejected accent combinations

- `accent + warning`: `--color-warn` has no canonical warning-foreground pair. Borrowing another
  role's foreground because it looks similar would be a semantic bypass.
- `accent + negative`: the existing Dark `--color-destructive` /
  `--color-destructive-foreground` pair measures about 3.75:1, below the 4.5:1 requirement for the
  current 0.6875rem tag text.
- Workout colours: these remain workout-domain roles and must not become arbitrary metadata hues.
- `rollout`, `muted`, `neutral`, and `error`: these are aliases or consumer concepts, not additional
  palette pairs.

If Ivan requires bright Warning or Negative tags, PRODUCT must first route a separate Foundation
foreground-pair decision. It is not part of this implementation slice.

### Anatomy, State, And Accessibility Contract

| State / context      | Required contract                                                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base anatomy         | One compact label with optional decorative leading icon. Border is `0` in both variants. Reuse `hito-label-sm`, `--radius-sm`, `--space-1` gap/block padding and `--space-2` inline padding. No second tag primitive                                                                              |
| Read-only            | Default host is `span`; no pointer cursor, hover state, button role, or tab stop. A tooltip is supplementary, not the accessible name                                                                                                                                                             |
| Read-only + tooltip  | The trigger may receive `tabIndex=0` so keyboard users can reveal the tooltip. Visible text stays the accessible name and the tooltip is an `aria-describedby` description; remove the duplicate composed `aria-label`/native `title` path if the existing Tooltip seam supplies that description |
| Operational          | `interactive` is valid only with `asChild` and a native actionable host. Current use is a menu button with a trailing chevron. A plain interactive `span`, fake link, icon-only tag, or multiple actions inside one tag is invalid                                                                |
| Hover                | Light moves from `chrome-subtle` to `chrome-standard`. Accent applies the existing semantic chrome state overlay without changing the base pair or adding a local percentage. No layout shift                                                                                                     |
| Active / menu open   | Use the existing `chrome-strong` state overlay and preserve foreground contrast. `data-state="open"` and pointer active share the visible state                                                                                                                                                   |
| Keyboard focus       | Two-pixel `--color-ring` outline with two-pixel transparent offset; never reintroduce a perimeter border. Ring must not be clipped and remains visible in both themes                                                                                                                             |
| Disabled native host | Native `disabled` removes operation, hover, and focus. Resolve visually to Light neutral `chrome-subtle` / `text-disabled`; do not leave a vivid accent that suggests availability. An `aria-disabled` non-native host must also suppress its action or fall back to read-only                    |
| Pointer / touch      | Operational tags reuse the Hito XS control height of 1.75rem (28px), exceeding the WCAG 24px minimum. Adjacent controls retain at least `--space-2`. Read-only labels are not touch targets                                                                                                       |
| Long label           | Tags are intended for short nouns, adjectives, or compact facts. A single long label wraps within `max-width: 100%` using normal text flow and `overflow-wrap: anywhere`; it must not overflow or silently truncate state truth. Groups wrap between tags                                         |
| Icons                | Optional icon is decorative when the text repeats its meaning. Status cannot be colour-only; visible copy names the state                                                                                                                                                                         |
| Screen reader        | No automatic `role="status"` on static metadata. Dynamic announcements belong to the mutation/live-region owner. Operational tags inherit native button/menu semantics and expose the current value in the accessible name                                                                        |
| Reduced motion       | Reuse the existing reduced-motion rule for interactive metadata tags; no new animation contract                                                                                                                                                                                                   |

The non-interactive tag does not become a copy affordance, link, selection control, dismissible chip,
or filter. Those behaviours require their existing owners rather than an overloaded tag.

### External Guidance Applied

- [GOV.UK Tag](https://design-system.service.gov.uk/components/tag/) recommends explicit status
  words, a small stable status vocabulary, consistent colours, and never colour alone. It also warns
  that an ordinary status tag should not masquerade as a link or button. Hito therefore limits
  interaction to the already explicit operational menu-button composition.
- [Carbon Tag usage](https://carbondesignsystem.com/components/tag/usage/) distinguishes read-only
  labels from operational tags, requires native interaction states only for the operational form,
  recommends concise labels and wrapping groups, and uses bounded component tokens rather than
  consumer colours. Hito keeps its own API and palette.
- [WCAG 2.2 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
  requires 4.5:1 for this small text; [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
  requires a visible cue in addition to hue; [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
  informs focus/control-state checks; and [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
  defines the 24px pointer target floor.
- The [WAI-ARIA tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) keeps focus on the
  trigger and describes the tooltip through `aria-describedby`; the tooltip itself does not receive
  focus.

These sources support the role separation and accessibility constraints; no external component API,
token name, or colour value is copied.

### Exact `/hitoDS/components#status` Reference Matrix

Keep the section compact and purpose-led:

1. **Light — quiet and dense:** neutral “Plan first”, positive “Available”, informative “In
   review”, warning “Needs QA”, and negative “Invalid metadata”. Captions say that the visible word,
   not the hue, owns meaning.
2. **Accent — sparse and explicit:** semantic positive “Ready”, semantic informative “Live sync”,
   and non-semantic Signal “Core control”. The Signal caption states “organizational, not status”.
3. **Behaviour:** one read-only tooltip specimen and the existing `AdminMetadataMenu` as a real
   native menu button with chevron, hover, open, focus, and disabled-host examples.
4. **Unavailable combinations:** one text note, not fake swatches: bright Warning and Negative are
   not admitted by the current foreground pairs.

The global theme switch supplies Dark/Light comparison. Do not duplicate the matrix per theme, add
a palette gallery, or document the legacy aliases as supported variants.

### Ownership And Migration Plan

There is no truthful one-owner atomic migration: changing the shared prop while leaving
`AdminMetadataMenu.tone?: string` breaks type validation, while DESIGN SYSTEM is not allowed to edit
Product/Admin or DevTools interaction owners. PRODUCT must serialize the following slices.

1. **DESIGN SYSTEM — bounded shared contract and DS consumers.** Implement the discriminated
   appearance contract in `metadata-tag.tsx`; update the canonical recipe in `controls-lists.css`;
   reuse `hito-label-sm`, semantic spacing, radius, motion, focus, and colour owners; update
   `reference-components-controls.tsx`, `playground.tsx`, `reference-overview-page.tsx`, and
   `figma-export-board.tsx`; extend the existing DS contract validator only if it already owns this
   source rule. Delete the perimeter border, local percentage tone fills, Light-only Signal recipe,
   typography duplicates, fake interactive span, and DS-owned legacy call sites. Do not touch Figma.
2. **FRONTEND, Product lane — consumer adoption.** Migrate `AdminMetadataMenu`, Admin Work items and
   its view-model mappings, plus Saved Plan Library, using the exact table above. Preserve Product
   data and menu behaviour; remove `tone?: string` from the operational wrapper.
3. **FRONTEND, DevTools lane — consumer adoption.** Migrate the Local Inspector batch tags and
   correct the accidental `success` ownership label to neutral Light. Preserve its row-button and
   local-only lifecycle.
4. **DESIGN SYSTEM — zero-reach cleanup.** Prove no `tone=`, legacy `data-tone`, `rollout`, `muted`,
   `error`, or arbitrary tag colour path remains; then delete any temporary compatibility branch and
   legacy CSS selectors. Regenerate existing DS output only if the repository's current generator
   truthfully includes the changed contract.

If Product requires a continuously compiling rollout, the first DS slice may temporarily accept a
closed, deprecated legacy union only long enough for slices 2–3. It must fail closed for unknown
strings, be listed as deletion debt in the implementation item, and be removed in slice 4. Do not
retain `tone?: string` or add a second compatibility component.

### Bounded DESIGN SYSTEM Handoff (Not Dispatched)

```text
ROLE: DESIGN SYSTEM

Task: Implement the accepted HitoMetadataTag Light/Accent shared contract, DS-owned consumers, and
focused validation from
docs/tasks/backlog/2026-08-13-hito-ds-metadata-tag-light-and-accent-contract-discovery.md.

Read AGENTS.md, agents/design-system.agent.md, and
skills/hito-frontend-design-system/SKILL.md before the first write. Re-capture the dirty snapshot and
preserve unrelated work byte-for-byte.

Bounded outcome:
- Keep the existing HitoMetadataTag owner.
- Add the report's discriminated light/accent appearance contract; no arbitrary colour path.
- Make both variants borderless, reuse the exact existing semantic tokens and Hito label/spacing/
  radius/motion/focus contracts, and admit only Light neutral/positive/warning/negative/informative
  plus Accent signal/positive/informative.
- Update only DESIGN SYSTEM-owned runtime/CSS, /hitoDS consumers, Figma export code, and an existing
  directly relevant DS validator. Do not mutate Figma or Product/Admin/DevTools consumers.
- Delete DS-owned border, local alpha tone recipes, aliases, fake interactive span, and duplicated
  typography where the accepted owner now replaces them.
- If a temporary legacy bridge is necessary for cross-owner compile continuity, it must be a closed
  enumerated union with an explicit deletion condition; unknown strings fall back to Light neutral
  and fail validation. Do not create a second component or registry.

Validate both themes and Canvas, Surface/Card, Elevated, and Popover parents; text contrast,
operational hover/open/focus/disabled, 28px target height, keyboard menu behavior, tooltip naming,
long-label wrapping, reduced motion, focused TypeScript/build/DS validation, and the exact showroom
matrix. Stop and return to PRODUCT before a new colour token, Warning/Negative accent, Product data
decision, Admin/Product edit, DevTools edit, Figma change, or broader tag framework.

Update the implementation lifecycle item with deletions, focused evidence, omitted checks, and the
exact remaining consumer owner. Do not claim Global QA, Figma parity, release, or deployment.
```

This prompt is intentionally the first shared-owner slice, not permission to absorb the two Frontend
lanes.

### Acceptance Matrix For Later Implementation

| Check              | Scenario / environment                                | Required result                                                                                                                                    |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| API                | TypeScript examples                                   | Valid combinations compile; `accent+warning`, `accent+negative`, mixed `accent+intent`, unknown strings, and interactive non-native spans fail     |
| Visual structure   | Dark/Light on Canvas, Surface/Card, Elevated, Popover | No perimeter border; Light stays quiet; admitted Accent pairs stay vivid and readable; no layout shift                                             |
| Text contrast      | Every admitted pair and parent                        | At least 4.5:1 for enabled 0.6875rem copy; browser-computed evidence recorded                                                                      |
| Focus / state      | Keyboard and pointer, operational menu                | Native button is the only tab stop; Enter/Space opens; Escape closes and returns focus; hover/open are visible; ring is at least 3:1 and unclipped |
| Read-only tooltip  | Keyboard, pointer, screen reader                      | Plain tag is not focusable; tooltip tag is focusable, visible text remains name, tooltip is description, Escape dismisses                          |
| Disabled host      | Dark/Light                                            | No action, hover, or focus; Light disabled treatment; no vivid availability cue                                                                    |
| Touch / responsive | 320px and ordinary mobile widths                      | Operational target is at least 28px high; tag groups wrap; long content does not overflow                                                          |
| Meaning            | Semantic and Signal examples                          | Status word is visible; Signal is labelled organizational and never used as status; no colour-only meaning                                         |
| Reachability       | Repository search after all owner slices              | No arbitrary `tone?: string`, legacy tag `data-tone`, duplicate aliases, old percentage recipes, or fake interactive tag remains                   |
| Regression         | Focused DS validation, TypeScript, build              | Existing menu, tooltip, Product, Admin, DevTools, reference, and export routes compile and retain their owned behaviour                            |

### Rollback And Stop Conditions

- Roll back by reverting the bounded shared contract and its same-slice DS consumers together; do not
  leave the new props with the old recipe or vice versa.
- During staged migration, keep the last compiling closed legacy union until both Frontend owners
  return accepted migrations; then delete it. Do not widen it to `string` to mask drift.
- Stop before implementation if Product rejects the restricted Accent set, requires bright Warning
  or Negative, or wants arbitrary organizational colours.
- Stop if browser-computed contrast falls below 4.5:1, the focus ring falls below 3:1 or clips, the
  operational host cannot remain native, or a Light parent not covered here changes the result.
- Stop and return to PRODUCT at the first Product/Admin, DevTools, Figma, token, generated-truth, or
  second-primitive boundary not explicitly admitted above.

### Final Planning Receipt

- **User outcome:** specified one existing, borderless Metadata Tag with quiet Light and restricted
  expressive/semantic Accent treatments.
- **Evidence:** inventoried every direct source seam plus the two shared fan-outs; classified current
  live values; measured current Foundation pairs in both themes and four parent surfaces; reviewed
  maintained GOV.UK, Carbon, W3C WCAG, and WAI-ARIA guidance.
- **Accepted/proposed decision:** separate presentation from meaning; default to Light; admit Accent
  Signal, Positive, and Informative only; reject arbitrary colour and unsafe bright Warning/Negative.
- **Intentionally unresolved:** whether Ivan wants a separate future Warning/Negative foreground-pair
  decision. It is not required for the recommended contract.
- **Next owner:** PRODUCT for decision acceptance and serialized owner routing; DESIGN SYSTEM is the
  first implementation owner only after acceptance.
- **Validation:** scoped Prettier passed; 17 internal Markdown links resolved; all seven cited
  official URLs opened successfully; repository `git diff --check` passed; the task file's
  untracked no-index whitespace check reported no errors. Hashes for the four inspected runtime/CSS
  owners match the preflight snapshot.
- **Boundary:** documentation changed; runtime, CSS, tokens, validators, manifests, Product/Admin,
  DevTools, Figma, data, hosted state, Git lifecycle, browser QA, Global QA, release, and deployment
  were not changed or claimed.
