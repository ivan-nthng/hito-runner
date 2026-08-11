# Hito DS Tokenized Neutral-Chrome Migration Plan

## Work Item ID

2026-08-11-hito-ds-tokenized-neutral-chrome-migration-plan

## Status

completed

## Type

design-system-plan

## Priority

high

## Owner

designer

## Mode

Tracked

## Scope

Produce a detailed, evidence-backed implementation plan for reducing Hito's neutral interactive
chrome to semantic, tokenized overlay and text roles. The plan follows the completed discovery
decision but does not implement CSS, tokens, primitives, consumer migrations, Figma, or product
changes.

Fixed structural roles remain absolute theme-resolved colours: canvas/background, surface,
surface-elevated/card, popover/modal, and real App Shell containment. The plan concerns the
duplicated neutral recipes around buttons, fields, Select, choice controls, neutral information
states, and text/icon attenuation.

## Stage

Designer migration plan and audit complete. No source implementation was performed.

## Next Recommended Role

product

## Archive Intent

retain_in_place

## Task

Turn the accepted design direction into a staged, reversible Design System migration plan that an
implementation owner can execute without inventing local opacity values or rewriting the product.

The plan must define a small semantic token vocabulary—not raw percentages in component CSS—and
map each role to a source colour, parent structural surface, intended meaning, permitted states,
and both-theme contrast requirement. It must distinguish alpha-derived neutral chrome from fixed
structural surfaces and chromatic semantic/domain colours.

## Accepted Product Direction

- Every opacity/alpha value used for neutral chrome or text attenuation must be owned by a Hito
  semantic token. Components must not introduce literal opacity recipes.
- Start from the discovery proposal of four neutral overlay strengths: clear, subtle, standard,
  strong (initially 0/8/12/16%), but treat the numbers as hypotheses requiring rendered proof,
  not final values.
- Keep structural surfaces absolute where they express containment/elevation.
- Keep a compact text/icon hierarchy: primary, secondary, tertiary, disabled; semantic accent,
  positive, negative, informative, and warning foregrounds remain separate and theme-resolved.
- Avoid compounded attenuation such as adding opacity to `muted-foreground`.
- Reuse and consolidate existing DS seams; every later migration must remove a demonstrated
  duplicate recipe or literal. Do not create a palette rewrite, universal colour framework, or
  per-component colour API.

## Existing Evidence

- The completed discovery item is
  [Hito UI Chrome Color-Role Rationalization Discovery](2026-08-11-hito-ui-chrome-color-role-rationalization-discovery.md).
- `src/styles/foundations.css` is the canonical fixed structural and semantic foundation owner.
- `src/styles/controls-fields.css`, `src/styles/controls-lists.css`,
  `src/styles/overlays-feedback.css`, and `src/styles/forms-onboarding.css` contain the audited
  chrome recipes; discovery found 55 distinct percentage literals among the four owners.
- The first proven duplicate is Field versus SelectTrigger neutral state chrome. `SelectTrigger`
  can reuse the Field contract and delete its duplicate rest/hover/focus/placeholder/disabled
  declarations.

## Required Planning Deliverable

Append one English migration-plan artifact to this item containing:

1. **Target semantic vocabulary.** For each proposed neutral overlay and text/icon role, define
   its token name proposal, source/parent relationship, allowed use, prohibited use, and whether
   it is a final token, an alias, or needs measurement before adoption. Do not use raw percentage
   names as token names.
2. **Token-location decision.** Identify the smallest canonical owner for each role (foundation,
   shared DS CSS, or existing control contract), including generated-manifest/Figma considerations.
   Explain why no additional token framework is required.
3. **Complete candidate inventory.** Classify every neutral percentage/colour recipe in the four
   audited CSS owners as: migrate to a semantic token, delete as duplicate, retain as structural,
   retain as semantic/domain, or investigate. Include source location, consumer family, parent
   surface, and an exact discriminator for every uncertain case. Do not equate matching literals
   with matching semantics.
4. **Implementation slices in dependency order.** Propose the smallest independent slices, each
   with canonical owner, specific deletion/reuse target, expected net reduction, no-go boundaries,
   and focused proof. Slice 1 must be Field/SelectTrigger convergence. No slice may combine a
   foundation-value change with broad consumer migration.
5. **Theme and accessibility matrix.** Define the rendered checks for dark/light across background,
   surface, elevated/card, and popover/modal; rest, hover, active/pressed, selected, disabled,
   focus, placeholder, text/icon, and semantic status states. State contrast thresholds and
   required non-colour affordances.
6. **Rollout and rollback.** Define snapshot/baseline captures, source searches that prove literal
   removal, consumer verification, release ordering, and the narrow rollback unit for each slice.
   This is a plan for shared dirty-tree work: no broad cleanups bundled into the first slice.
7. **Open product/design decisions.** Name only decisions that truly require Product input. Do not
   ask to choose browser tooling, implementation mechanics, or raw values before rendered evidence
   demands it.

## What Not To Touch

- No runtime code, CSS, tokens, primitives, manifests, validators, routes, Product layouts,
  migrations, fixtures, data, hosted state, Figma, dependencies, or lockfiles.
- Do not modify the active final QA candidate or its verdict.
- Do not merge canvas/surface/elevated/card/popover/modal structural layers merely because they
  are neutral.
- Do not change workout-domain/chart palettes or safety/intent meaning; do not make status
  semantics depend on neutral tokens.
- Do not select exact final alpha values from source inspection alone.

## Validation Expectations

- The artifact maps all proposed roles to existing owners and includes deletion/reuse proof.
- Every candidate role has a two-theme parent-surface and state constraint.
- The dependency order lets DESIGN SYSTEM validate one source of truth at a time.
- External principles, if used, come from primary official design-system or WCAG sources and are
  cited only for the specific rule adopted.
- No implementation claim or code mutation is made.

## Exact Designer Handoff

```text
ROLE: DESIGNER

Mode: Tracked design-system planning and audit — no implementation.

Execute this canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-tokenized-neutral-chrome-migration-plan.md`

Read `AGENTS.md`, `agents/designer.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, and the completed predecessor:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ui-chrome-color-role-rationalization-discovery.md`.

Create the detailed English migration-plan artifact required by the canonical item. This is not a
colour implementation: do not edit runtime code, CSS, tokens, components, manifests, validators,
Figma, Product source, migrations, fixtures, data, hosted state, dependencies, or the active final
QA item. Preserve every dirty source hunk byte-for-byte.

Product direction is fixed: structural canvas/surface/elevated/card/popover layers remain absolute
when they express real containment; all neutral-chrome and text attenuation alpha must ultimately
be semantic Hito tokens rather than local literal recipes; the 0/8/12/16 overlay proposal is a
measurement hypothesis, not a final implementation decision. Plan token names by semantic purpose,
not by percentage. Reuse existing owners, prove deletion/reuse targets, and avoid a colour-system
rewrite or new framework.

Make the plan executable in small Design System slices. The first must converge `SelectTrigger` on
the existing Field chrome contract and delete its proven duplicate neutral-state recipe; later
slices must be independently auditable and net-reducing. Include the two-theme, parent-surface,
accessibility/state matrix, rollout/rollback plan, and only genuine Product decisions.

Use Russian for visible progress commentary. Append an English final planning receipt to the item,
with what was planned, evidence, intentionally unresolved values, and next recommended owner.
Do not dispatch implementation yourself, stage, commit, push, deploy, or access hosted state.
```

## Designer Migration Plan Artifact — 2026-08-11

### 1. Planned outcome and non-negotiable invariants

The migration reduces local neutral-colour recipes without replacing Hito's colour system. The
target model has four distinct planes:

1. **Structural containment:** `background`, `surface`, `surface-elevated`, `card`, `popover`,
   modal/sheet, and App Shell containment stay fixed, theme-resolved colours when they communicate
   hierarchy or elevation.
2. **Neutral interactive chrome:** a small semantic overlay vocabulary supplies clear, quiet,
   normal, and strong neutral treatment. Components choose a role by purpose; they do not own an
   alpha percentage.
3. **Content hierarchy:** primary, secondary, tertiary, and disabled text/icon roles are resolved
   from unattenuated semantic sources. A component must not apply additional opacity to an already
   attenuated content token.
4. **Chromatic meaning:** accent, positive, negative, informative, warning, workout-domain, chart,
   and safety roles keep their meaning and theme resolution. They are not aliases for neutral
   chrome.

The discovery's 0/8/12/16 proposal is only the first measurement set for the neutral overlay
ladder. No exact non-zero alpha in this artifact is an implementation decision. Final values must
come from the rendered matrix in Section 5.

### 2. Target semantic vocabulary

#### 2.1 Neutral chrome and edge roles

| Proposed semantic token | Source and parent relationship | Allowed use | Prohibited use | Decision status |
| --- | --- | --- | --- | --- |
| `--chrome-clear` / `--color-chrome-clear` | `transparent`; the inherited structural parent remains visible | Rest state for borderless/ghost controls where no fill is intended | Structural containment, invisible focus, or removal of a real card/popover layer | Final semantic alias; no measurement needed |
| `--chrome-subtle` / `--color-chrome-subtle` | Theme foreground channel composited once over the inherited structural parent | Quiet hover, low-emphasis metadata/tag fill, quiet information affordance | Text attenuation, selected/error/success meaning, or a card background | Candidate role; measure the initial 8% hypothesis |
| `--chrome-standard` / `--color-chrome-standard` | Theme foreground channel composited once over the inherited structural parent | Default neutral interactive fill where a control needs visible affordance | Universal default surface or replacement for `surface`/`input` without rendered proof | Candidate role; measure the initial 12% hypothesis |
| `--chrome-strong` / `--color-chrome-strong` | Theme foreground channel composited once over the inherited structural parent | Pressed/active or deliberately stronger neutral emphasis | Focus indication, selection meaning by itself, or semantic status | Candidate role; measure the initial 16% hypothesis |
| `--chrome-edge-default` / `--color-chrome-edge-default` | Existing neutral `hairline`/`border` source over the same parent | Default control edge where fill alone is insufficient | Focus, invalid, selected, or destructive edge | Candidate alias; first prove whether existing `--color-hairline` already owns this meaning |
| `--chrome-edge-emphasis` / `--color-chrome-edge-emphasis` | Existing `border` or unattenuated foreground channel, theme-resolved | Hover/active edge when the edge is the second affordance | Focus ring or semantic feedback | Candidate alias; source and value require matrix proof |

State names are deliberately absent from the overlay token names. A quiet metadata row can use
`chrome-subtle` at rest while a ghost button can use it on hover; making one global `hover` token
would incorrectly claim that all hover states have the same visual strength. Focus continues to
use the existing `--color-ring`/`--color-signal` contract and must not be synthesized from the
neutral ladder.

#### 2.2 Text and icon roles

| Proposed semantic token | Source and parent relationship | Allowed use | Prohibited use | Decision status |
| --- | --- | --- | --- | --- |
| Existing `--color-foreground` | Existing theme foreground on any validated structural parent | Primary text and primary neutral icons | On-tone foreground where a semantic `*-foreground` exists | Retain; canonical primary role |
| `--text-secondary` / `--color-text-secondary` | Theme foreground attenuated once over the current parent | Supporting labels, metadata, secondary icons | Placeholder, disabled, or another attenuated token as source | Candidate; measure near the discovery's ~75% starting point |
| `--text-tertiary` / `--color-text-tertiary` | Theme foreground attenuated once over the current parent | Low-emphasis, non-essential metadata | Required instructions, errors, selected value, or disabled content | Candidate; measure near ~60% |
| `--text-disabled` / `--color-text-disabled` | Theme foreground attenuated once; paired with a disabled behaviour/state | Disabled labels/icons where content remains useful | Enabled low-emphasis content or essential status | Candidate; measure near ~40%; disabled exemption is not a readability target |
| `--text-accent` / `--color-text-accent` | Existing theme-resolved signal/accent source on neutral structural parents | Accent links, accent labels, active semantic emphasis | Text placed on an accent fill; use existing `signal-foreground` there | Candidate alias; contrast must be proved in both themes |
| `--text-positive` / `--color-text-positive` | Existing success source, with theme-specific correction if required | Positive/success text and icons on neutral parents | Decorative green or workout-domain meaning | Candidate semantic alias; measure, especially in light theme |
| `--text-negative` / `--color-text-negative` | Existing destructive source, with theme-specific correction if required | Error/destructive text and icons on neutral parents | Text on destructive fill or neutral selection | Candidate semantic alias; measure, especially on dark elevated parents |
| `--text-informative` / `--color-text-informative` | Existing info source, theme-resolved | Informative text/icons on neutral parents | Quiet neutral metadata | Candidate semantic alias; measure |
| `--text-warning` / `--color-text-warning` | Existing warning source, theme-resolved | Warning text/icons on neutral parents | Accent/brand or workout intensity | Candidate semantic alias; measure |

Icons consume the matching text/content role by default. No parallel icon-opacity ladder is
planned. Semantic text tokens are for content on neutral structural parents; existing
`*-foreground` roles remain the owner for content rendered on a chromatic fill.

#### 2.3 Token-location decision

- `src/styles/foundations.css` remains the single source for theme-resolved semantic values. The
  neutral overlay, edge alias, and content roles belong beside the current semantic foundation
  mappings, not in a component file.
- The existing `@theme inline` aliases are sufficient when a Tailwind colour utility is genuinely
  needed. Shared Hito CSS can consume the semantic variable directly. A second registry, token
  resolver, component colour API, or generated runtime object would duplicate the current owner.
- `src/styles/controls-fields.css`, `src/styles/controls-lists.css`, and
  `src/styles/overlays-feedback.css` remain behaviour-family owners. They map component states to
  foundation roles; they do not define local alpha values.
- `src/styles/forms-onboarding.css` remains Product-consumer CSS. It may adopt stabilized DS roles
  in a later Frontend Product slice, but it must not become a token owner.
- `scripts/generate-hito-ds-manifest.mjs` remains the existing generated-manifest seam. A future
  token slice updates source/export markers and regenerates the manifest; the manifest is never
  hand-edited.
- Figma remains downstream. Only after code tokens and their rendered states stabilize may Product
  dispatch a separate DESIGN SYSTEM INTEGRATION task for the approved Figma file.

### 3. Complete candidate inventory

The inventory below classifies the complete percentage/transparent recipe set found in the four
audited owners. Rows group declarations only when selector family, consumer meaning, and disposition
are the same. Each value list is exhaustive for that grouped source range. Literal `opacity` used
only for entrance/drag/reveal motion is included and explicitly excluded from colour-token work.

#### 3.1 `src/styles/controls-fields.css`

| Source range and recipe family | Consumer / usual parent | Values observed | Classification and exact treatment |
| --- | --- | --- | --- |
| 2–161: Field primary/secondary rest, hover, focus, placeholder, disabled, readonly, autofill, compound wrapper | Field, Textarea, compound range on background/surface/card/popover | background 62/72/74; muted 26/54/64; foreground edge 20/32; foreground text 78; muted-foreground 72; signal ring 16 | **Migrate** neutral fill/edge/content to semantic tokens after Field/Select convergence. **Retain semantic** error/success edge/fill/ring recipes. **Retain** transparent nested input geometry. Autofill adopts the same Field role only if browser-rendered inset coverage matches normal Field; otherwise record it as a browser-specific exception, not a new generic role. |
| 203–328: header field and inline header trigger | Editable headings on surface/elevated/card | input/surface 52/48, 64/36, 72/28; trigger foreground 6/8; disabled foreground 62; affordance foreground 88; opacity 0/1/.78 | **Migrate** fill, edge, and content attenuation to the shared roles in a later Field-family slice. `opacity: 0/1` is reveal state and stays motion/visibility. The `.78` mobile affordance is **investigate**: if it expresses content hierarchy, replace it with a text role; if it only prevents disappearance of an otherwise hidden action, retain as visibility behaviour. |
| 420–537: date Field, calendar popover/navigation/day states | Date control on form parent; calendar inside popover | open edge 32; icon 84/78/42; popover 96; nav 72/8; weekday 78; day 86/8; outside 52; disabled 38; signal/semantic selection mixes | **Retain structural** popover containment. **Migrate** neutral navigation/day/text and disabled attenuation. **Retain semantic** today/selected/range/error meaning. Exact selection discriminator: if the colour identifies date selection or today independent of interaction state, it stays semantic; only unselected neutral chrome moves. |
| 616–638: editable-value label and edit affordance | Inline editable value on inherited structural parent | label opacity .7; edit icon 0/.72 | Label attenuation **migrates** to secondary/tertiary text after contrast proof. Icon `0` is hidden/reveal behaviour and stays. `.72` migrates only if it represents visible icon tone; it stays behavioural if the alternate state is intentionally hidden and the visible state should otherwise be primary. |

#### 3.2 `src/styles/overlays-feedback.css`

| Source range and recipe family | Consumer / usual parent | Values observed | Classification and exact treatment |
| --- | --- | --- | --- |
| 5–42, 108–117, 310–455, 544–632: overlay, dialog/sheet/menu/window/toast containers and shadows | Viewport backdrop; modal/popover/elevated containment | overlay background/black 78/18; dialog/menu 96; product dialog 95; window 94; info window 97; info overlay 22; toast surface/elevated/sidebar/background 88/12 and 86/14; structural shadow/inset values | **Retain structural** where the recipe creates backdrop separation, glass containment, elevation, or toast container identity. Exact discriminator for any later review: remove only the neutral tint in a controlled screenshot; if parent/child containment or elevation becomes ambiguous, it is structural and remains fixed. It is not part of the overlay ladder. |
| 44–71: dialog/sheet close rest/hover/focus | Icon button on dialog/sheet | hairline plus foreground 6; signal focus ring 20 | **Migrate** quiet action hover to neutral chrome; **retain semantic** focus ring. |
| 124–185: menu item/shortcut/separator | Menu rows inside popover | item foreground 86; focus/open 8; disabled muted 58; selected signal 10; destructive foreground 88/90 and fill 10; separator/hairline | **Migrate** neutral row fill and content attenuation; reuse existing separator/hairline. **Retain semantic** selected/destructive recipes and focus visibility; checked/selected meaning remains independently legible. |
| 191–229: SelectTrigger rest/hover/focus/open/placeholder/disabled | Select on background/surface/card/popover | exact Field values: background 62/72; edge 20/32; signal ring 16; placeholder 72; muted 26; foreground 78 | **Delete as duplicate in Slice 1.** Compose the existing Field contract. Keep only Select-specific layout, icon, Radix open/placeholder host selectors, and size differences; where a selector host differs, group it with or map it to the Field-owned value instead of retaining an overlay-owned recipe. |
| 232–238, 638–659: progress/loading tracks and fills | Progress or toast progress inside status container | progress track foreground 10; signal fill 82; toast loading muted-foreground 14/72 | Neutral tracks and neutral loading indicator **migrate** to chrome/content roles after geometry is preserved. Signal/status fill **retains semantic meaning**. |
| 240–293: neutral and intent state surfaces | Empty/info/success/error state container on structural parent | neutral surface-elevated/background 56/72; signal edge/fill/background 18/7/78; success 22/8/78; warning 24/9/78; destructive 24/10/78 | Neutral container is **investigate**: retain if it creates a real nested container, migrate if it is only quiet information tint. Intent gradients **retain semantic meaning** and must not be normalized to neutral chrome. |
| 681–708: toast dismiss rest/hover/active | Icon action on toast container | clear, foreground 7/10 | **Migrate** to clear/subtle/strong chrome roles. |
| Overlay/select/toast/dialog animation declarations | Portals and transient feedback | opacity 0/1 and library fade normalization | **Retain as motion/visibility**, not colour attenuation. |

#### 3.3 `src/styles/controls-lists.css`

| Source range and recipe family | Consumer / usual parent | Values observed | Classification and exact treatment |
| --- | --- | --- | --- |
| 2–57: generic button disabled/loading | Buttons on all validated structural parents | opacity .58/.78 | **Investigate, then migrate by meaning.** If the value attenuates label/icon/fill together, replace with explicit disabled chrome plus `text-disabled`; retain component opacity only if a non-colour behaviour requires whole-control fading and contrast is still acceptable. |
| 56–240, 260–290, 311–378, 398–425: status, primary, and chromatic secondary/outlined/ghost recipes | Primary/success/error/accent buttons and tone variants | semantic signal/success/destructive/foreground/surface blends | **Retain semantic/intent.** Theme-specific on-colour content may be corrected through existing semantic foreground owners, not neutral tokens. Neutral-looking `surface 72` inside light outlined tones is separately investigated below. |
| 81–99: Button progress track/fill | In-control progress using the Button's current semantic content colour | `currentColor` track 14; solid current-colour fill | **Retain component/data meaning.** It indicates completion geometry and inherits neutral or semantic Button content; do not map it to generic neutral chrome without proving that progress meaning remains. |
| 245–257: secondary button | Button on background/surface/elevated/card/popover | foreground fill 10/14/18; foreground text 92 | **Migrate** rest/hover/pressed fill and content to chrome/text roles; delete local percentages. |
| 293–308: outlined button | Same shared parents | edge 16/26/32; clear/foreground fill 6/9; text 88 | **Migrate** neutral edge, fill, and text roles; focus remains the shared ring. |
| 311–378: chromatic outlined variants | Semantic action on structural parent | success/destructive edge, fill, and foreground mixes plus light structural surface 72 | **Retain semantic**, with one discriminator: if `surface 72` only simulates a neutral hover rather than preserving legibility under the semantic edge, migrate just that neutral sub-recipe after isolated proof. Do not collapse the chromatic role. |
| 382–394: ghost button | Same shared parents | clear, foreground 7/10 | **Migrate** to clear/subtle/strong chrome roles. |
| 451–630: tabs, enclosed tab rail, badge | Simple/enclosed tabs on background/surface/card | structural background/surface/black blends; item hover/active 6/10/12; badge fill 8/text 72; disabled opacity .45 | **Retain/investigate structural** enclosed rail gradient because it may create containment. **Migrate** item neutral chrome, badge text/fill, and disabled content. Exact rail discriminator is the containment-removal screenshot described above. |
| 647–687: control label text/disabled wrapper | Checkbox/radio label on shared parents | foreground text 86; disabled whole-wrapper opacity .55 | **Migrate** label content to secondary/disabled text roles. Whole-wrapper opacity is retained only if behavioural evidence requires group fading; otherwise remove it so control and label use explicit disabled roles. |
| 695–829: checkbox and radio neutral states | Choice controls on shared parents | edge 22/36; background 58; hover/active fill 6/9; disabled opacity .5 | **Migrate** unselected rest/hover/active and disabled content. **Retain semantic** checked, invalid, and focus roles; checked state must not be expressed by neutral chrome alone. |
| 862–983: ChoiceToggle neutral/unselected and selected states | Toggle on shared parents and calendar surfaces | neutral fill 7/10/13; foreground text 74; disabled .5; signal/destructive selected recipes | **Migrate** neutral/unselected and disabled treatment. **Retain semantic** selected, invalid, and destructive roles. |
| 986–1214: row group, list rows, metadata tags | Lists/cards on surface/elevated/card | group background 42; muted surface 30; hover 3.5; title 90; metadata edge 14/22, fill 4/12, text 82/88; signal row 3; semantic tag hues | **Migrate** proven quiet interactive/text recipes. Row-group background is **investigate**: retain if it owns nested containment, otherwise map to chrome. Signal row and semantic tag hues **retain semantic meaning**. |
| 1219–1225: keyframe opacity | Animated list affordance | opacity animation | **Retain as motion**, not colour attenuation. |
| 1314–1714: slider and dual-range rail/markers/native tracks | Data/value control on shared parents | rail 14; marker 42; transparent native tracks; disabled .5; signal/value recipes | **Exclude from this migration plan's implementation slices.** Rail/marker colour can encode value geometry rather than ordinary chrome, and this source plus its validator currently has concurrent slider work. A later dedicated audit must prove whether each value means track, previous value, current value, marker, or disabled control before assigning a generic token. |

#### 3.4 `src/styles/forms-onboarding.css`

| Source range and recipe family | Consumer / usual parent | Values observed | Classification and exact treatment |
| --- | --- | --- | --- |
| 16–70: onboarding footer | Sticky footer over onboarding canvas | fixed background; mobile background 90, foreground shadow 14, hairline separator, blur | **Retain structural** while the footer creates sticky containment. Only the separator can reuse an existing edge role if measured equivalent. |
| 88–172: selected-plan calendar legend and cells | Calendar within onboarding surface/card | legend 66; workout tone 16/24; neutral rest 7/12; transparent child geometry | Legend **migrates** to a text role; neutral unselected chrome **migrates** after DS roles stabilize. Workout/domain cell tones **retain semantic meaning**. Transparent child geometry stays. |
| 191–235: generated-plan wait marker/progress | Waiting and completion status on onboarding surface | signal fill 9; success fill 12; success foreground/fill | **Retain semantic/status.** The marker and completion colour identify waiting versus completed; do not map them to neutral chrome. |
| 245–314: generated-plan wait transitions | Waiting/preview state | opacity 0/1, animated width, and motion timing | **Retain as motion/visibility**, not text/chrome attenuation. |
| 357–493: manual-workout canvas, surfaces, rows, nested groups, add strips, fields | Manual workout editor on background/surface/elevated hierarchy | dark canvas 92/8; surface 58/42; muted 44/56; row 58/42→68/32; add 14/22; nested 44/56; field 76/24→66/34; light analogs 54/46, 82/18, 72/28, 44/56→56/44, 42/56, 82/18, 68/32→76/24; multiple edge values | Canvas/surface/row/nested recipes are **structural or investigate**, not bulk-migration candidates. Add-strip, row-hover, and Field interaction are **candidate neutral chrome** for a later Frontend Product slice. Exact discriminator: DOM and screenshots must show whether each variable persists as a parent container at rest; persistent parent separation is structural, while a value appearing only on interaction is chrome. |
| 564–581: manual-workout secondary Field border overrides | Route-local field cascade | transparent/edge overrides | **Retain temporarily** through Slice 1 to avoid changing Product layout by accident. Delete only after the Field token slice proves the secondary Field contract makes the override redundant. |
| Manual-workout lead icon, guidance row, type trigger, repeat gutter, HR lane | Route-local quiet/actions on editor surfaces | muted icon 50; quiet surface 25; trigger clear/foreground 7; gutter 58; lane hover 3 | Quiet content/action recipes are **candidate migration** only after the shared DS roles stabilize. Guidance-row fill is **investigate** for containment versus quiet information tint. |
| Manual-workout insertion indicator | Direct-manipulation/drop target over editor surfaces | signal/white 82/8; signal edge 30; signal shadow 20 | **Retain semantic interaction meaning.** The colour identifies the active drop target and is paired with geometry; it is not ordinary neutral chrome. |
| Manual-workout row/stack backgrounds, drag/action/insertion visibility states | Editor geometry and direct manipulation | transparent plus opacity 0/1 and drag .62 | Transparent geometry and motion/drag/reveal opacity **retain**; they are not neutral colour attenuation. |

This inventory deliberately does not propose a global replacement for every matching number. For
example, `16%` can mean a focus ring, a workout tone surface, a neutral edge, or a backdrop; those
roles remain different even if the source literals match.

Two adjacent owners were evidenced by the predecessor but are not part of the required four-file
inventory: typography/content attenuation in `src/styles/layout-typography.css`, and quiet surface /
App Shell profile chrome in `src/styles/reference-workbench.css`. Slice 8 may audit the former after
foundation text roles exist. The latter needs a current consumer/ownership map before a separate DS
slice: `hito-surface` remains structural, while only the proven quiet/interactive recipes may adopt
chrome tokens. Neither source is permission for a first-slice expansion.

### 4. Dependency-ordered implementation slices

Each slice is a separate DESIGN SYSTEM patch and proof unit unless another owner is named. Before
the first write, the owner must re-read the current diff because several audited source files have
concurrent dirty work. A slice may begin only when its exact selectors can be changed without
rewriting those hunks.

#### Slice 1 — converge `SelectTrigger` on the existing Field contract

- **Canonical owner:** `SelectTrigger` composition in `src/components/ui/select.tsx`; Field state
  contract in `src/styles/controls-fields.css`.
- **Reuse/deletion:** compose `hito-field hito-field-primary hito-field-md` by default and the
  existing small Field size when requested. Delete the duplicated rest, hover, focus, placeholder,
  and disabled neutral-state recipe from `src/styles/overlays-feedback.css`. Retain only
  Select-specific layout, Radix icon/content behaviour, size overrides, and state-host selectors.
  The Radix `[data-state="open"]` and `[data-placeholder]` selectors must be grouped with or mapped
  to the Field-owned state rather than left as a second colour recipe.
- **Expected net reduction:** one full duplicate neutral-state implementation removed; no new
  colour literal, helper, token registry, or compatibility class. Existing consumers that add
  `hito-field-secondary` continue to override the primary variant through the same Field contract.
- **No-go boundary:** do not change SelectContent/menu containment, option behaviour, component API,
  manual-workout layout, foundations, token values, or current slider work.
- **Focused proof:** default/small and primary/secondary Select on dark/light background, surface,
  elevated/card, and popover; rest, hover, keyboard focus, open, placeholder, disabled, and error
  consumer state. Verify current manual-workout, value-tag, DevTools, and `/hitoDS` consumers plus
  validator/manifest checks. Inspect chevron tone separately because its current `opacity-50` is a
  text/icon attenuation candidate, not part of recipe deletion.
- **Rollback unit:** restore the Select class composition and its deleted recipe together. Do not
  create a parallel compatibility selector.

#### Slice 2 — establish measured foundation roles and migrate only Field/Select

- **Canonical owner:** semantic mappings in `src/styles/foundations.css`; existing Field contract.
- **Reuse/deletion:** add only the measured chrome, edge, and text roles required by the Field and
  Select matrix. Replace Field/Select local neutral percentages, including placeholder/disabled,
  and delete the superseded literals. Keep feedback error/success and structural parents intact.
- **Expected net reduction:** the number of removed Field-family local literals must exceed the
  number of new centralized semantic values; one canonical state contract remains.
- **No-go boundary:** no broad consumer migration in the same patch, no raw percentage token names,
  no change to workout/chart/intent palettes, and no `muted-foreground` plus opacity compounding.
- **Focused proof:** full matrix in Section 5, existing `/hitoDS` Field/Select state specimens,
  `npm run validate-hito-ds-components`, manifest generator check, and focused build. Final token
  values are selected only after computed-colour/contrast and visual comparison evidence exists.
- **Rollback unit:** before any dependent slice lands, revert token definitions and Field mapping
  as one unit. After dependents exist, keep the harmless token definitions and roll back only the
  failing consumer mapping.

#### Slice 3 — neutral Button variants

- **Canonical owner:** Button variants in `src/styles/controls-lists.css` and the existing Button
  component contract.
- **Reuse/deletion:** migrate only secondary, outlined, and ghost rest/hover/pressed/disabled
  recipes to the established roles. Delete their local neutral fill/edge/text percentages.
- **Expected net reduction:** three local state ladders become mappings to one semantic vocabulary.
- **No-go boundary:** primary, success, error, destructive, and accent button semantics remain
  untouched; do not add a per-Button colour API.
- **Focused proof:** Button state/size/icon matrix in both themes and all applicable parent surfaces,
  keyboard focus, disabled/loading, and high-colour on-tone foreground contrast.
- **Rollback unit:** revert only neutral Button mappings; shared tokens remain.

#### Slice 4 — Checkbox, Radio, and ChoiceToggle neutral states

- **Canonical owner:** choice-control sections in `src/styles/controls-lists.css`.
- **Reuse/deletion:** replace unselected rest/hover/active and disabled neutral recipes. Delete the
  replaced local literals.
- **Expected net reduction:** one shared chrome/content ladder replaces three repeated unselected
  ladders while component geometry remains separate.
- **No-go boundary:** checked/selected, invalid/destructive, focus ring, workout selection, and
  control geometry remain semantic/component-owned.
- **Focused proof:** keyboard and pointer states, checked/unchecked/indeterminate where supported,
  disabled, invalid, selected plus icon/check affordance, both themes and all structural parents.
- **Rollback unit:** one choice-family mapping patch; do not roll back tokens or Buttons.

#### Slice 5 — overlay action affordances and menu rows

- **Canonical owner:** action/menu contracts in `src/styles/overlays-feedback.css`.
- **Reuse/deletion:** migrate dialog/sheet close, toast dismiss, neutral menu row fill/content, and
  neutral progress tracks. Delete only those local neutral recipes.
- **Expected net reduction:** repeated clear/quiet/strong action ladders and attenuated row text use
  existing roles; structural container recipes remain unchanged.
- **No-go boundary:** overlay backdrop, dialog/sheet/menu/toast containment, shadows, portal motion,
  and semantic status gradients/fills.
- **Focused proof:** modal, sheet, menu, toast, and progress specimens in both themes, including
  nested popover/modal parent, pointer and keyboard focus, disabled menu item, checked menu item,
  close-label accessibility, and status meaning.
- **Rollback unit:** overlay action/menu mappings only; structural containers and tokens remain.

#### Slice 6 — date/calendar neutral chrome and content

- **Canonical owner:** date Field/calendar section in `src/styles/controls-fields.css`.
- **Reuse/deletion:** migrate unselected day/navigation hover, weekday/outside/disabled content, and
  neutral date icon states. Delete their local attenuation literals.
- **Expected net reduction:** date-specific neutral text and hover recipes become shared roles.
- **No-go boundary:** calendar popover containment, today/selected/range/error semantics, date
  logic, locale, or Product plan-calendar workout tones.
- **Focused proof:** both themes, background and popover parents, rest/hover/focus/selected/today/
  outside/disabled states, keyboard grid navigation, and visible non-colour selected/today cues.
- **Rollback unit:** date/calendar neutral mappings only.

#### Slice 7 — quiet tabs, rows, and metadata tags

- **Canonical owner:** matching sections in `src/styles/controls-lists.css`.
- **Reuse/deletion:** after the containment discriminator is recorded, migrate only proven
  interactive/quiet fills and text. Delete local hover/badge/metadata attenuation recipes.
- **Expected net reduction:** repeated quiet row/tag/tab literals converge on chrome/text roles.
- **No-go boundary:** do not change enclosed-tab or row-group structural backgrounds without
  positive containment evidence; semantic tags retain their hues.
- **Focused proof:** simple/enclosed tabs, list rows, grouped rows, and metadata tags in both themes
  and all actual parent surfaces; selected/current indicators cannot rely on colour alone.
- **Rollback unit:** split into tabs and row/tag patches if either family needs a different
  structural decision; each patch rolls back independently.

#### Slice 8 — shared content hierarchy cleanup

- **Canonical owner:** foundation text roles plus existing DS typography/control consumers.
- **Reuse/deletion:** replace remaining audited local text/icon attenuation with primary,
  secondary, tertiary, disabled, or semantic content roles. Delete superseded opacity utilities and
  mixes only where they represent tone, not reveal/motion.
- **Expected net reduction:** one content hierarchy replaces component-owned attenuation; no
  parallel icon hierarchy.
- **No-go boundary:** do not globally redefine `muted-foreground` or delete it until its complete
  consumer reachability and meaning are proven. Do not migrate motion, drag, or visibility opacity.
- **Focused proof:** typography and icon samples at normal/small sizes on every parent, semantic
  foregrounds in both themes, and a source search showing no compounded attenuation in migrated
  consumers.
- **Rollback unit:** consumer family by consumer family; tokens remain.

#### Slice 9 — route-local Product adoption, separately dispatched

- **Owner:** FRONTEND, lane Product, only after the DS roles above are stable and Product creates or
  routes a separate tracked item.
- **Reuse/deletion:** adopt tokens for selected-plan neutral calendar states and manual-workout
  interactive add-strip/row-hover/Field/action recipes. Delete each replaced local literal.
- **Expected net reduction:** Product consumers reuse DS roles; no local palette or compatibility
  layer remains for migrated states.
- **No-go boundary:** manual-workout canvas/surface/row/nested containment stays structural until
  the DOM/screenshot discriminator proves otherwise. No plan data, workout logic, drag behaviour,
  persistence, or route layout change.
- **Focused proof:** route-local dark/light editor and onboarding scenarios, including nested rows,
  hover/drag/disabled/focus states, with structural separation preserved.
- **Rollback unit:** Product consumer patch only; DS roles remain.

#### Slice 10 — reachability-led obsolete role deletion

- **Canonical owner:** `src/styles/foundations.css` plus existing generated-manifest seam.
- **Reuse/deletion:** after all consumer slices, re-run source and manifest reachability for the
  currently exported but apparently unused `secondary`/`secondary-foreground` roles and any
  superseded neutral primitives. Delete only roles proven to have zero runtime, generated, and
  approved external contract consumers.
- **Expected net reduction:** obsolete exports and source values are removed; no alias shim.
- **No-go boundary:** Product decides only if external compatibility is real and cannot be proven
  locally. Workout/domain and intent roles are out of scope.
- **Focused proof:** repository reachability search, generated-manifest check, DS validator, focused
  build, and downstream Figma mapping inventory if such mapping has been approved by then.
- **Rollback unit:** restore only the demonstrated public role if an external consumer is found.

Slider/dual-range recipes are not hidden inside any slice. They require their own later
component-meaning audit after current concurrent slider work is complete.

### 5. Theme, parent-surface, state, and accessibility matrix

#### 5.1 Required parent matrix

| Theme | Parent to render | Required families | Primary question |
| --- | --- | --- | --- |
| Dark | `background` canvas | Field/Select, neutral Buttons, choices, tabs/rows/tags | Does each state read without becoming a second structural surface? |
| Dark | `surface` | Same plus quiet information | Is the overlay visible but subordinate to real containment? |
| Dark | `surface-elevated` / `card` | Same plus editable/header control | Are edge, hover, and content roles distinct on the lighter structural layer? |
| Dark | `popover` / modal/sheet | Select/menu/action/date/toast families | Does nested chrome remain visible while backdrop and container elevation stay intact? |
| Light | `background` canvas | Field/Select, neutral Buttons, choices, tabs/rows/tags | Does a foreground-derived overlay avoid dirty or over-dark neutral fill? |
| Light | `surface` | Same plus quiet information | Are low-emphasis states visible without becoming borders everywhere? |
| Light | `surface-elevated` / `card` | Same plus editable/header control | Are rest/hover/pressed and content levels still ordered? |
| Light | `popover` / modal/sheet | Select/menu/action/date/toast families | Do nested controls and focus rings separate from the warm elevated parent? |

Card may alias surface in one theme, but it remains in the matrix because consumer context and
surrounding edge/shadow can change perception. Popover/modal is always tested as a nested parent,
not as a canvas screenshot.

#### 5.2 Required state/content matrix

| State/content | Required evidence | Accessibility constraint |
| --- | --- | --- |
| Rest | Computed fill/edge/content plus screenshot on every actual parent | Normal text at least 4.5:1; large text at least 3:1 |
| Hover | Pointer screenshot and computed delta from rest | Must be perceivable in sequence; never the only way to discover a control |
| Active/pressed | Pointer-down or deterministic demo state | Must be stronger or otherwise distinct from hover without erasing label/icon contrast |
| Selected/checked/current | Selected component specimen with icon, check, edge, shape, or text cue | Colour is not the sole indicator; relevant non-text boundary/indicator at least 3:1 against adjacent colours |
| Disabled | Native/ARIA disabled state, cursor/behaviour and content | Disabled controls are contrast-exempt, but essential instructions/status cannot be disabled styling; state cannot rely only on faintness |
| Focus visible | Keyboard focus on every interactive family and parent | Focus indicator at least 3:1 against adjacent colours and not clipped; use the existing ring/semantic contract, not neutral chrome |
| Placeholder | Empty Field and SelectTrigger | Target 4.5:1 for normal-size instructional text; placeholder must remain distinguishable from entered value by more than colour when ambiguity matters |
| Primary/secondary/tertiary text and icons | Small and normal text/icon specimens on every parent | Required readable content at least 4.5:1; large text at least 3:1; essential icons at least 3:1 |
| Accent/positive/negative/informative/warning text | Each semantic role on every neutral parent and its on-tone counterpart | Normal text at least 4.5:1; do not reuse raw hue where it fails a theme/parent |
| Error/success/info/warning control status | Field, toast/state surface, and action specimen | Meaning includes text/icon/label, not colour alone; boundary/icon contrast at least 3:1 where required |
| Forced colours / high contrast | Focused manual pass after implementation | Native state, focus, selected, and disabled affordances remain available when authored colours are overridden |

Contrast is computed from the final composited colour over each actual parent, never from the alpha
source in isolation. Adjacent interaction-state colours do not have to meet 3:1 against each other,
but the control boundary/indicator must meet applicable non-text contrast and state change must have
a legible, testable affordance.

### 6. Rollout, source proof, and rollback

#### Baseline before every slice

1. Record `git status --short` and the focused diff for the exact files. Do not clean, reset,
   reformat, or overwrite unrelated dirty hunks. The current slider and validator hunks are explicit
   exclusions.
2. Capture the existing `/hitoDS` state specimens for the affected family in dark/light and on its
   real parent surfaces. Extend an existing specimen only when the missing state cannot otherwise be
   measured; do not add a new showcase framework or fixture path.
3. Record computed foreground/background/edge colours and contrast for the matrix states. Keep the
   first 0/8/12/16 render as one hypothesis, then compare only the smallest evidence-backed
   alternatives needed to pass both themes.
4. Record focused source-search counts for `color-mix(`, neutral transparent mixes, and tone
   `opacity` in the affected selector ranges. The goal is a before/after deletion proof, not a
   repository-wide zero count because semantic/domain and structural mixes remain valid.

#### Slice acceptance and ordering

- Land and validate Slice 1 before defining new tokens. Stabilize Slice 2 values before any later
  consumer migration. Never combine a foundation-value change with Buttons, choices, overlays, or
  Product migrations in the same patch.
- For each slice, require the current focused DS validation (`npm run validate-hito-ds-components`),
  `node --import tsx scripts/generate-hito-ds-manifest.mjs --check` when token/export/component
  metadata changes, and a focused build for shared token/component changes. Run focused lint only on
  affected source where supported; do not use the write-format script as validation.
- Re-run the affected consumer list, not only `/hitoDS`. Slice 1 includes manual-workout,
  value-tag, DevTools, and reference consumers; later slices list their own consumers above.
- Acceptance requires: no new local neutral alpha literal; each replaced literal deleted; structural
  and semantic exceptions preserved; matrix contrast/state evidence recorded; validator/manifest
  source-of-truth preserved; and a net reduction in duplicate recipes or local literals.
- Local DS proof does not modify or satisfy the active final Global QA item and does not claim
  release, deployment, hosted, or Global QA readiness.
- Figma synchronization is last and separately authorized. It must reflect accepted code tokens;
  it cannot decide them or block repository rollback.

#### Rollback rules

- Treat each slice above as the narrow rollback unit. Roll back the consumer mapping and its local
  deletion together; never leave both old and new recipes active as a compatibility layer.
- Consumer slices may roll back while foundation tokens remain unused. Foundation token values can
  roll back only before dependent consumer slices exist; after that, restore the last accepted value
  or roll back dependents in reverse order.
- Structural containers, Product data/logic, workout palettes, and hosted state are unaffected by
  every planned rollback.
- A failed state on one parent surface keeps that slice open. It is not justification for a global
  opaque fallback or a new per-component token.

### 7. Genuine Product/design decisions

No Product decision is needed to start Slice 1. Its duplicate owner and preserved behaviour are
already demonstrated.

Product input is required only for these later conditions:

1. **External compatibility:** after complete reachability evidence, decide whether an apparently
   unused exported role such as `secondary` is a real external/Figma compatibility promise. With no
   demonstrated external consumer, DESIGN SYSTEM should delete it rather than preserve an alias.
2. **Route-local scheduling:** decide when to create and route the separate FRONTEND Product slice
   for onboarding/manual-workout adoption after the DS vocabulary is stable. That work must not be
   bundled into the shared token implementation.
3. **Evidence-backed visual character:** only if two or more measured ladders all pass the complete
   matrix but create materially different Hito visual character, Product chooses among those
   rendered options. Product is not asked to select raw alpha percentages in advance.

Browser choice, implementation mechanics, token percentages before measurement, and validator
commands are not Product decisions.

### 8. Intentionally unresolved values and exclusions

- The non-zero values for subtle, standard, strong, edge-emphasis, secondary, tertiary, disabled,
  and semantic text roles are unresolved until the full composited matrix is measured.
- Whether `hairline` and `border` can directly alias both proposed edge roles is unresolved pending
  state/parent proof.
- Manual-workout row, nested-group, guidance, enclosed-tab, row-group, and neutral state-surface
  fills remain structural-versus-chrome questions with exact screenshot/DOM discriminators above.
- Slider/dual-range colour remains a separate component-meaning audit because it can encode data
  geometry and has concurrent work.
- `muted-foreground`, `secondary`, and their exports are not globally redefined or deleted by this
  plan. Deletion requires proven reachability and, where real, external-contract evidence.
- No runtime source, CSS, token, component, manifest, validator, Figma file, Product source,
  migration, fixture, data, dependency, hosted state, or final QA item was changed during planning.

## Final Planning Receipt

- **Task and mode:** `2026-08-11-hito-ds-tokenized-neutral-chrome-migration-plan`; Tracked Designer
  planning/audit, no implementation.
- **Stage:** Designer migration plan complete.
- **Preflight:** accepted Product direction and Field/Select duplicate seam were confirmed before
  the only task-owned write. Existing owners are reused; proposed new runtime artifacts: none.
- **Product outcome planned:** a small semantic neutral-chrome and content vocabulary, independently
  auditable net-reducing slices, parent/theme/state accessibility evidence, and reversible rollout.
- **Evidence:** completed predecessor discovery; current `foundations.css` semantic owner;
  Field/Select source comparison; complete grouped recipe inventory across the four required CSS
  owners; current generator, component validator, and consumer seams.
- **Files inspected:** `AGENTS.md`, `agents/designer.agent.md`,
  `skills/hito-frontend-design-system/SKILL.md`, the predecessor discovery, this item, the four CSS
  owners, `src/components/ui/select.tsx`, `scripts/generate-hito-ds-manifest.mjs`,
  `scripts/validate-hito-ds-component-contracts.ts`, and `package.json` scripts.
- **Files changed:** this canonical backlog item only.
- **Preserved boundaries:** all dirty source hunks, runtime behaviour, structural/semantic/domain
  colours, Figma, Product source, data, hosted state, dependencies, and the active final QA item.
- **Intentionally unresolved:** exact non-zero alpha values, edge aliases, the listed
  containment-versus-chrome cases, external compatibility reachability, and slider meaning.

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Instruction preflight | Local main checkout, read-only source inspection | Passed | Canonical policy, Designer role, mandatory DS skill, item, and predecessor read to EOF |
| Owner/reuse audit | Current local source | Passed | Existing foundation, Field, Select, manifest, validator, and `/hitoDS` seams mapped; no new framework planned |
| Candidate coverage | Four required CSS owners | Passed | Every grouped neutral/transparent/opacity recipe classified with parent, disposition, and uncertain-case discriminator |
| Slice executability | Dependency and rollback review | Passed | Slice 1 removes Field/Select duplication; later slices are independent, bounded, and net-reducing |
| Accessibility plan | Dark/light × four parent classes × complete state set | Passed as planning evidence | Composited contrast thresholds and non-colour requirements recorded; no implementation contrast claim made |
| Dirty-tree preservation | Focused status/diff awareness | Passed | No runtime, QA, generated, Figma, Product, data, or hosted mutation performed |

- **Omitted checks and consequence:** no CSS/component validation, build, browser screenshots,
  contrast measurement, manifest generation, Figma inspection, or Global QA was run because no
  implementation occurred. Exact token values and visual acceptance therefore remain open.
- **Next recommended owner:** Product. Product may dispatch DESIGN SYSTEM Slice 1 only; this
  Designer did not dispatch implementation.
- **Blockers:** none for Slice 1. Later values are intentionally gated by rendered evidence, not a
  current blocker.
