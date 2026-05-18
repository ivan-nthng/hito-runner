Status

Implemented

Owner

FRONTEND

Last Updated

2026-05-17

Context

`/hitoDS` is the internal reference baseline for the live Hito design system. Its job is to document the product language clearly enough that Frontend can inspect primitives and extend them without inventing route-local UI drift.

The content direction is largely correct. The current issue is visual grammar. `/hitoDS` still overuses bordered cards and nested bordered frames in places where the live Hito product would prefer open rhythm, dividers, grouped rows, and calmer spacing. This makes the reference page feel more like a dashboard of framed tiles than a low-chrome editorial system reference.

Current Problem

The current `/hitoDS` surface creates unnecessary border ladders:

- overview and anti-pattern content often resolves into equal-weight `TokenCard` blocks
- typography uses one bordered frame for `Font ownership`, then another bordered card per role, then another bordered specimen box inside that role card
- icons use one bordered card per icon, then another bordered container for the size strip inside each card
- several sections combine one bordered demo surface with additional bordered explanation cards even when rows or dividers would be enough

This is not a component-contract problem. It is a presentation-grammar problem inside the reference page itself.

Design Direction For This Pass

- `/hitoDS` should read like a reference page, not a widget dashboard.
- hierarchy should come primarily from:
  spacing
  typography
  open layout
  hairline dividers
  grouped rows
- bordered surfaces should appear only when the specimen is showing a real owned product component or a payload container that actually needs a boundary
- nested bordered cards should be exceptional

New `/hitoDS` Surface Grammar

1. No frame

Use for:

- section intros
- editorial explanation
- typography ownership notes
- large type specimens
- icon usage guidance
- short anti-pattern guidance

Rule:

- this is the default state for reference content

2. Divider only

Use for:

- separating role examples
- splitting overview principles
- separating icon registry rows
- section-level continuation after intro copy

Rule:

- if content is informational rather than component-owned, prefer divider rhythm before adding a surface

3. Grouped row

Use for:

- compact metadata
- rules
- principle lists
- “do / avoid” comparisons
- support notes beside a specimen

Rule:

- `hito-row-group` should be the default compact reference wrapper when multiple related facts belong together

4. Soft section surface

Use for:

- one interactive specimen area
- one owned component preview
- one payload-like example where boundary helps

Rule:

- this is the main place where `hito-surface-flat` remains valid inside `/hitoDS`
- only one soft surface should usually appear per demo cluster

5. Bordered card

Use for:

- real component anatomy previews that genuinely need a shell:
  modal
  toast container
  shell nav block
  state surface

Rule:

- bordered cards are reserved for actual component ownership, not for every explanatory block around them

6. Nested bordered card

Use for:

- almost nothing

Allowed only when:

- the inner border is part of the real component contract being demonstrated
- removing it would falsify the product component anatomy

Rule:

- typography specimens should not use nested bordered cards
- icon size strips should not use nested bordered cards
- overview principles should never use nested bordered cards

Overview Recommendation

Before

- overview reads like a top intro plus multiple equal-weight framed summaries
- principle-like content gets boxed too early

After

- keep the main page intro open
- keep the `Rule` note in the sidebar as a simple divider-led note
- replace equal-weight overview summary cards with one open principle stack or one `hito-row-group`
- reserve actual framed surfaces for later sections where real components are being demonstrated

Recommended overview rhythm

- open page intro
- one divider
- one grouped principle block:
  `Open rhythm first`
  `Cards only when they earn it`
  `Rows before boxes`
  `Nested borders are exceptional`

Typography Recommendation

Current issue

- the section uses:
  one bordered ownership block
  one bordered role card per type role
  one bordered inner specimen inside each card
  then another row of bordered anti-pattern cards
- this is the clearest `card soup` zone on the page

Recommendation

1. Remove the `Font ownership` block as a standalone card-like object.

- keep the typography intro open
- add one quiet supporting line directly below it:
  `Font ownership`
  followed by one short `body-small` explanation
- this should read as reference copy, not as a specimen card

2. Change typography role examples from `card grid` to `open specimen list`.

Recommended rhythm per role:

- divider
- role name and short use note
- open specimen line or short block
- quieter technical metadata underneath:
  class name
  size
  line-height
  weight
  tracking

3. Remove the inner specimen border.

- the type specimen itself should be open on the page
- if separation is needed, use padding or a very light local backdrop wash, not a bordered inset card

4. Make class/spec metadata quieter.

- keep class names in `technical-mono`
- move full spec line below the specimen in `caption` or `body-small`
- do not give metadata the same visual weight as the role specimen

5. Replace anti-pattern cards with one grouped “Avoid” list.

- one `hito-row-group`
- three compact rows:
  `Oversized compact headings`
  `Stacked uppercase micro labels`
  `Helper text as body copy`

Typography target structure

- open intro
- quiet `Font ownership` note
- vertical role list with dividers
- grouped anti-pattern list

Icons Recommendation

Current issue

- each icon entry is a bordered card
- inside it, the size examples live in another bordered block
- usage examples are again separate bordered cards
- the section becomes a grid of tiles instead of a readable registry

Recommendation

1. Treat the registry as an open icon catalog, not as cards.

- show icon rows in an open grid or divided list
- each row should include:
  icon name
  category
  label
  inline size examples

2. Remove the inner bordered size strip.

- size examples can sit inline in a four-column mini strip without a bordered inset
- if separation is needed, use spacing and muted labels only

3. Keep the canonical sizing note as grouped support, not as its own headline card.

- one row in a `hito-row-group` is enough

4. Consolidate icon usage examples.

- instead of five equal-weight usage cards, show one open usage grid with small labeled lanes
- if a boundary is needed, use one shared soft surface around the whole usage gallery, not one box per example

Icon target structure

- open intro
- one grouped note for sizing rules
- open divided icon registry
- one shared usage gallery, preferably one soft surface or one open multi-column block

Buttons Recommendation

Keep

- the current interactive builder model is valid
- one control column plus one owned preview surface is appropriate

Reduce

- do not add more surrounding framed explanation blocks here
- keep the preview surface as the single bordered specimen
- keep the footer guidance open with a divider

Inputs Recommendation

Keep

- open labeled examples are already close to the right grammar

Reduce

- no extra framing needed around each field example
- keep this section mostly open

Async Actions / Toast Recommendation

Keep

- the toast demo area can justify one owned preview surface because it demonstrates a real component pattern

Reduce

- supporting notes should remain in `hito-row-group`
- avoid adding secondary summary cards beside the toast specimen unless they add new information
- prefer one framed live demo plus open or grouped explanatory support

Modals Recommendation

Keep

- the modal specimen should remain framed because the dialog shell itself is the thing being documented

Reduce

- side explanation should remain grouped rows, not extra cards
- avoid nested explanatory panels inside the modal demo beyond real modal dividers that belong to the actual component anatomy

Shell Examples Recommendation

Keep

- one shell-nav specimen surface is reasonable

Reduce

- profile and menu examples should lean on grouped rows and open spacing
- do not box every shell sub-example independently

Dropdowns Recommendation

Keep

- one trigger specimen and one grouped menu anatomy block is enough

Reduce

- avoid treating the trigger and the menu as two equal card objects if one can be open or lighter

Other `/hitoDS` Sections To Simplify

States

- keep state-surface specimens framed because they are real route-level components
- reduce side explanation cards where grouped rows can do the same job

Analytics

- mostly good already
- keep summary truth grouped and open
- avoid extra framed note blocks unless the example is truly a component shell

Rows & disclosure

- already close to the right grammar
- should remain primarily divider- and row-driven

Concrete Section Decisions

Bordered cards should remain common only in:

- component previews where the border belongs to the actual component contract
- modal shell examples
- toast container examples
- state-surface examples
- one button preview surface
- one shell nav specimen where needed

Bordered cards should be reduced in:

- overview
- typography
- icons
- any anti-pattern or explanatory section that currently uses `TokenCard`

Nested bordered cards should be removed from:

- typography role specimen blocks
- icon size specimen blocks

Keep Actual Product Components Safe

This pass is only about `/hitoDS` presentation grammar.

Do not change through this recommendation:

- product modal behavior
- toast behavior
- button/input contracts
- calendar cells
- app shell
- workout pages

Checklist

- [x] define one explicit `/hitoDS` surface grammar
- [x] remove nested-card recommendation from typography specimens
- [x] remove nested-card recommendation from icon specimens
- [x] reduce overview from equal-weight cards to editorial rows/dividers
- [x] keep true component-shell demos safely framed

Exit Criteria

- [x] `/hitoDS` reads as a low-chrome reference page instead of a dashboard of bordered tiles
- [x] typography examples rely on open rhythm and dividers rather than nested cards
- [x] icon registry becomes more scanable with fewer tile boxes
- [x] overview principles read editorially, not as card stacks
- [x] actual product component previews remain accurately represented where framing is part of the component itself

Implemented Notes

- `/hitoDS` now has small reference-page grammar helpers for quiet notes, divider-led rows, open specimens, and quiet metadata.
- Overview uses one open principles stack instead of card summaries.
- Typography ownership is support copy; role examples are open divider rows with unframed specimens and quieter class/spec metadata; the avoid guidance is one grouped row list.
- Icons use quiet sizing copy, a divider-led registry with inline size examples, and one shared usage surface instead of one bordered tile per example.
- Live product components, modal behavior, toast behavior, button/input contracts, icon registry behavior, and typography role definitions were not changed.

Next Recommended Role

QA

Suggested Next Step

Smoke `/hitoDS#overview`, `/hitoDS#typography`, and `/hitoDS#icons` in Safari to confirm the reference surface reads as lower chrome while canonical typography and icon content remains complete.
