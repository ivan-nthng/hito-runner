Status

Implemented

Owner

FRONTEND

Last Updated

2026-05-18

Context

Hito already has a real bounded dialog family in production:

- `Open plan`
- `Import plan`
- `Body notes`

Those dialogs already share the right high-level direction:

- centered bounded panel
- stable overlay behavior
- header / body / footer structure
- internal scrolling for tall content
- reachable footer actions

The gap is no longer whether Hito needs a modal system. The gap is that the anatomy model is not yet described strictly enough, and `/hitoDS` currently demonstrates a bad modal example where the body stretches into a visible dead zone above the footer.

This pass defines the canonical Hito modal anatomy model, allowed header and footer variants, and the expected body-sizing modes so Frontend can align `/hitoDS` and product dialogs without route-local drift.

Current Modal Inventory

1. `Open plan`

- role
  lifecycle dialog
- current fit
  heaviest product dialog
- current anatomy
  labeled task header, long scroll body, structured sections, footer actions

2. `Import plan`

- role
  focused workflow dialog
- current fit
  compact task flow with validation and apply
- current anatomy
  simple task header, scroll body, action footer

3. `Body notes`

- role
  focused workout-scoped editor
- current fit
  content-heavy form dialog
- current anatomy
  simple task header, scroll body, footer with note plus actions

4. `/hitoDS` modal example

- role
  reference example only
- current fit
  demonstrates the right bounded shell but currently demonstrates the wrong short-content body behavior

Validation Summary

What already works

- `DialogTitle` and `DialogDescription` are typography-neutral, so product dialogs can opt into Hito roles explicitly.
- product dialogs already use `hito-product-dialog` and `hito-product-dialog-body`
- Safari-stable overlay/content classes are already in place
- `Open plan`, `Import plan`, and `Body notes` already share a strong calm header and reachable footer pattern

What is still weak

- header variants are implicit, not canonical
- footer variants are implicit, not canonical
- body mode is currently treated as one stretchable middle zone even when content is short
- `/hitoDS` demonstrates `scroll-fill` behavior as if it were the default even for short content, which creates the dead-zone bug look

Canonical Modal Anatomy Model

Required parts

1. Overlay

- required
- role
  focus isolation and background dimming

2. Panel

- required
- role
  bounded dialog shell

3. Header

- required
- role
  task framing

4. Body

- required
- role
  main task content

5. Footer

- required for product dialogs
- role
  task completion, exit, and bounded secondary action area

6. Close affordance

- required
- role
  immediate safe dismissal

Optional parts

7. Header meta / action row

- optional
- role
  status, secondary utility action, compact context

8. Body sections

- optional
- role
  internal grouping of complex content

9. Footer note / status row

- optional
- role
  one short bounded note above or beside actions

10. Disclosure area

- optional
- role
  expert or destructive path inside body, never as a fake fourth panel zone

Canonical structure

- overlay
- panel
  - header
  - body
  - footer

No extra permanent anatomy tier should sit between body and footer just to “hold space.”

Header Variants

1. Simple task header

Structure

- title
- short description

Use when

- dialog has one focused job
- no status or utility action is needed

Typography

- title: `hito-modal-title`
- description: `hito-body`

Spacing

- standard header padding
- normal divider below header

Current examples

- `Import plan`
- `Body notes`

Do not

- add extra badges or metadata if they do not affect the task

2. Labeled task header

Structure

- eyebrow / label
- title
- short description

Use when

- the dialog needs stronger categorization
- the label adds orientation without adding workflow complexity

Typography

- label: `hito-label`
- title: `hito-modal-title`
- description: `hito-body`

Spacing

- compact label-to-title gap
- description stays close to title

Do not

- stack multiple labels
- turn the header into a state dashboard

3. Header with status or metadata

Structure

- title + description
- one compact status pill or one short metadata item

Use when

- the dialog needs a quick truth marker:
  valid
  busy
  imported
  proposal stale

Typography

- title: `hito-modal-title`
- description: `hito-body`
- meta: `hito-caption` or `hito-status-pill`

Spacing

- metadata can sit beside or below the intro copy
- it should not form a second visual headline

Do not

- mix many pills or a row of badges into the header

4. Header with secondary action

Structure

- title + description
- one compact secondary action

Use when

- utility action is directly tied to the dialog object:
  export
  download template
  copy

Typography

- same as simple task header
- action remains button/menu level, not header typography

Spacing

- utility action sits in a compact meta/action lane

Do not

- add multiple peer CTA buttons in the header

5. Complex lifecycle header

Structure

- title
- short description
- compact current-object context and/or one quiet utility action

Use when

- dialog is a lifecycle surface, not just a form
- current example:
  `Open plan`

Typography

- title: `hito-modal-title`
- description: `hito-body`
- current-plan summary: `hito-body-small`, `hito-caption`, `hito-status-pill`, or compact metric/readback primitives

Spacing

- header remains one bounded intro zone
- current-object context should remain compact and not become a second body section disguised as header

Do not

- put long summaries, full row groups, or many stacked controls into the header

Header System Conclusion

- `Import plan` and `Body notes` should remain simple task headers
- `Open plan` is the only current justified complex lifecycle header
- `/hitoDS` should document these variants explicitly instead of showing only one generic header

Body Behavior

The dead-zone problem is a body-mode problem, not a footer problem.

Hito needs two explicit body modes.

1. `content-fit`

Use when

- dialog content is short
- body content can fit naturally without internal scrolling
- the footer should sit directly after content

Behavior

- body does not visually stretch to manufacture height
- panel height should shrink to content within the global viewport max
- footer stays attached directly below the content

Best for

- simple confirmations
- compact import states
- short reference examples in `/hitoDS`

2. `scroll-fill`

Use when

- dialog content may exceed the comfortable viewport
- internal scrolling is necessary
- footer must remain reachable

Behavior

- panel has bounded height
- body fills remaining middle track
- body scrolls internally

Best for

- `Open plan`
- `Body notes`
- full `Import plan` when validation or expert JSON content is open

Canonical rule

- product dialogs may support both modes
- `/hitoDS` must show both modes separately
- short-content examples must use `content-fit`
- tall-content examples must use `scroll-fill`

Do not

- use `scroll-fill` as the only visible example
- let a short-content demo stretch to full-height and imply that dead space is normal anatomy

Footer Variants

1. Close only

Use when

- modal is informational or low-risk

Button order

- single quiet close action

Alignment

- end-aligned by default

2. Cancel + primary

Use when

- standard focused workflow

Button order

- `Cancel`
- primary action on the visual right

Alignment

- right-aligned on desktop
- stacked safely on small widths

Current examples

- `Import plan`
- `Body notes`

3. Secondary + primary

Use when

- there is one safe secondary action tied to the task, but not destructive

Button order

- quiet secondary
- primary

Rule

- both actions remain in the footer only if both are genuinely part of task completion

4. Destructive confirmation

Use when

- destructive action is the immediate purpose of the modal or of the current body state

Button order

- cancel / back
- destructive action

Rule

- destructive copy may need a short footer note or body disclosure context

5. Proposal reject / apply pair

Use when

- review flow presents one reversible decision pair

Button order

- `Keep current plan`
- `Apply update`

Rule

- both actions are task-completion peers, not destructive vs safe mismatch

6. Footer note plus actions

Use when

- the runner needs one short bounded note tied to save/apply

Layout

- note and actions in one footer region
- note should be short and tertiary

Current example

- `Body notes`

Footer divider rule

- footer gets a divider whenever it is a distinct action zone from the body
- if there is no separate footer zone, do not create a fake footer just to show a border

Footer explanatory copy rule

- keep it short
- one line or one short paragraph only
- never use footer copy to compensate for missing body explanation

How to avoid dead space above footer

- choose the correct body mode
- do not rely on footer styling to fix a stretched middle track
- short-content dialog examples should collapse body height naturally

`/hitoDS` Modal Section Redesign

`/hitoDS` should stop showing one giant generic modal.

It should show

1. Header variants

- simple task header
- labeled task header
- complex lifecycle header

2. Body modes

- one short `content-fit` modal
- one tall `scroll-fill` modal

3. Footer variants

- cancel + primary
- note + actions
- proposal pair

4. Disclosure inside modal body

- one destructive/expert disclosure example inside body

5. Safari-stable behavior note

- overlay/content stability remains documented in grouped support rows, not in the modal specimen itself

It should avoid

- one fake modal with large dead empty middle space
- a specimen that implies all dialogs are tall by default
- extra bordered subcards inside the demo unless the inner border belongs to the actual modal content

Recommended `/hitoDS` modal documentation structure

- intro copy
- grouped support note:
  stable overlay
  content-fit vs scroll-fill
  footer stays reachable
- short modal specimen
- tall modal specimen
- compact footer-pattern gallery

Product Dialog Alignment

1. `Open plan`

Already matches

- bounded shell
- stable overlay
- complex lifecycle dialog role
- internal scroll
- footer separation

Should change

- no major anatomy change required
- only ensure its header remains the one justified complex variant, not the default for every dialog

Issue type

- mostly documentation/system-definition issue, not a broken product dialog

Shared helper implication

- may benefit from a named complex-header helper or clearer header/body/footer utility classes later

2. `Import plan`

Already matches

- simple task header
- bounded shell
- internal scroll
- standard action footer

Should change

- no major structural change required
- could map more explicitly to canonical `simple task header` plus `cancel + primary` footer language

Issue type

- mostly taxonomy/documentation issue

Shared helper implication

- could benefit from a canonical footer-variant helper if Frontend wants to reduce repeated class strings

3. `Body notes`

Already matches

- simple task header
- long-form body with internal scroll
- footer note + actions variant

Should change

- no major anatomy change required

Issue type

- already close to canonical

Shared helper implication

- useful as the canonical example of `scroll-fill` plus `footer note + actions`

4. `/hitoDS` modal example

Already matches

- bounded shell idea

Should change

- yes
- this is the main place that should change in the next Frontend slice

Issue type

- reference-surface problem, not product-dialog bug

Shared CSS / Class Recommendations

Keep

- `hito-product-dialog`
- `hito-product-dialog-body`
- `hito-dialog-stable`
- `hito-dialog-overlay-stable`

Add or clarify if Frontend needs them

- one explicit `content-fit` body helper
- one explicit `scroll-fill` body helper
- one header-meta/action helper
- one footer-note wrapper helper
- one compact footer action-stack helper if repeated enough

Do not overbuild

- do not create a huge modal abstraction component tree
- do not introduce speculative variants for dialogs the product does not have
- prefer a few clear helper classes over a new modal framework layer

Boundaries

This plan does not recommend changing:

- plan update/apply logic
- import/export behavior
- body-note persistence
- toast behavior
- app shell
- mobile sheet behavior

Checklist

- [x] define canonical modal parts
- [x] define allowed header variants
- [x] define body modes
- [x] define allowed footer variants
- [x] diagnose `/hitoDS` dead-zone problem
- [x] map current product dialogs to the system
- [x] keep scope strictly modal anatomy and DS alignment

Exit Criteria

- [x] Hito has one explicit modal anatomy model
- [x] `content-fit` and `scroll-fill` are clearly separated
- [x] header and footer variants are documented as a bounded system
- [x] `/hitoDS` no longer demonstrates a short-content modal with a fake dead zone
- [x] current product dialogs can be described cleanly without route-local modal taxonomy drift

Implemented Notes

- Shared CSS now names the Hito product-dialog header, content-fit panel/body, scroll-fill panel/body, footer, footer note, and footer action row anatomy.
- `/hitoDS#modals` now shows one short content-fit modal where the footer follows content naturally and one tall scroll-fill modal with an internally scrolling body and reachable footer.
- `/hitoDS#modals` documents allowed header and footer variants through compact grouped rows.
- `Open plan`, `Import plan`, and `Body notes` now use the named shared header, scroll-fill body, and footer helpers while preserving their existing widths, heights, stable overlay/content behavior, and workflows.

Next Recommended Role

QA

Suggested Next Step

Smoke `/hitoDS#modals` in Safari and confirm the short modal has no dead zone, the tall modal demonstrates internal scroll, and existing product dialogs still open with reachable footers.
