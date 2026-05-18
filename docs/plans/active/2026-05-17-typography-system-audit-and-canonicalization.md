Status

First bounded implementation slice complete

Owner

FRONTEND

Last Updated

2026-05-17

Implemented Slice

- Added shared CSS typography roles for:
  display, modal title, panel title, body, body small, form label, nav text, menu text, menu metadata, technical mono, and bounded error/success text while normalizing the existing page, section, label, button, metric, status, helper, and caption roles.
- Expanded `/hitoDS#typography` into the canonical role reference with each role's rendered specimen, usage note, and rendered font/size/line-height/weight/tracking summary.
- Applied the roles only to the requested high-value surfaces:
  `PlanManagementDialog`, `UploadJsonDialog`, `CompletionPanel`, and `settings`.
- Fixed the shared dialog typography contract after Safari QA:
  `DialogTitle` and `DialogDescription` are now typography-neutral, so product dialogs render canonical Hito roles instead of inherited generic dialog defaults.
- Left broader route families such as Today hero, calendar, auth, shell microtext, charts, and geometry-tied annotations for later slices.

Context

Hito already has an approved visual direction: calm, editorial, athletic, premium, low-chrome, low-card. The live design system defines core font families and some text primitives in `src/styles.css`, and `/hitoDS` already documents part of the typography language. The remaining gap is not a visual rebrand. The gap is that the live product still mixes canonical Hito roles with route-local text sizing, tracking, and line-height decisions across shell, home/calendar, workout detail, feedback, modals, auth, settings, and preserved utility routes.

This pass defines one canonical typography system for the current product so Frontend can consolidate text roles without redesigning behavior or over-abstracting the interface.

Current Typography Inventory

Existing font families

- `Inter` is the operational UI font and already carries most body, helper, nav, button, menu, state, and form text.
- `Fraunces` is the editorial display font and already carries page titles, hero headlines, and many section or modal headlines.
- `JetBrains Mono` is the measured-value font and already carries dates, metrics, compact chart labels, and technical snippets such as pasted JSON.

Existing live role families already defined in shared CSS

- `hito-page-title`
  large Fraunces page/display role with `clamp(...)` scaling and tight line-height.
- `hito-page-copy`
  standard muted page-level support paragraph.
- `hito-section-title`
  compact Fraunces section heading.
- `hito-section-subtitle`
  uppercase micro-heading / eyebrow role.
- `hito-label`
  uppercase operational label role.
- `hito-support-copy`
  compact support paragraph role.
- `hito-caption`
  smallest standard support/caption role.
- `hito-field-helper`
  form helper copy.
- `hito-field-error`
  field-level error text.
- `hito-field-success`
  field-level success text.
- `hito-metric-value`
  compact mono metric value.
- `hito-metric-label`
  compact uppercase metric label.
- `hito-list-row-title`
  dense row title.
- `hito-list-row-copy`
  dense row support copy.
- `hito-shell-nav-row`
  primary nav row text.
- `hito-shell-menu-item`
  shell dropdown item text.
- `hito-status-pill`
  compact uppercase semantic state label.
- `hito-toast-title`
  toast headline.
- `hito-toast-description`
  toast support copy.

Live product usage patterns by surface

- Shell
  strong use of `hito-shell-nav-row`, `hito-shell-menu-item`, `hito-label`, but still contains local `text-[11px]` microtext for mode labels, profile detail, and dropdown meta.
- Home / Today hero
  uses a strong Fraunces hero and shared support copy, but still sets local hero size and line-height rather than relying on a canonical hero role.
- Calendar
  uses section-title, mono day numbers, compact glyph labels, and captions, but cell identity text still relies on route-local `text-[10px]`, `tracking-[0.14em]`, and local scale adjustments.
- Workout detail / Feedback / Completion
  richest typography drift surface; it uses good shared labels and captions, but many subsection titles, disclosure summaries, explanatory blocks, and metric summaries still rely on route-local `text-xl`, `text-2xl`, `text-sm`, and custom tracking.
- Open plan modal
  modal heading is visually right, but still locally defined; body copy, proposal subheadings, and review support copy mix shared and local styles.
- Import modal
  largely aligned with Hito field roles, but modal heading, intro copy, and advanced JSON area still rely on local sizing.
- Settings
  mostly aligned, with small pockets of local body/support sizing.
- Auth / login
  visually strong and consistent in tone, but still relies on local hero and eyebrow sizes that are not yet formalized as roles.
- Progress / integrations
  mostly stable, but still use a mix of shared roles and local body/caption sizing.
- `/hitoDS`
  currently shows only a partial type story and does not yet reflect the full live type system.

What Must Become Canonical

- One explicit hero/display role family for auth and high-emphasis top-of-page surfaces.
- One explicit modal-title role so dialogs stop inventing local display sizes.
- One explicit panel-title role for dense content blocks such as `Feedback`, `Open plan`, grouped support modules, and compact review sections.
- One explicit body-small role so helper-ish copy stops drifting between `text-sm`, `text-xs`, `hito-support-copy`, and `hito-caption`.
- One explicit technical/mono role for dates, inline metrics, JSON, and measured review facts.
- One explicit micro label family that distinguishes:
  `label`
  `eyebrow`
  `metric label`
  `status pill`
  instead of letting all-uppercase small text drift through local tracking classes.

What Can Stay Contextual

- Exact line length and max-width by surface.
- Whether a page uses one display title or a more compact page title.
- Whether a metric value is inline with text or in a dedicated metric row.
- Chart and visualization geometry labels where position is governed by the chart, not by DS text rhythm.
- Tiny calendar day-number scaling within the month-cell geometry, as long as it maps to the canonical mono role family.

What We Should Not Normalize Yet

- SVG/body-map geometry annotations or any text tied to plotted coordinates.
- Every chart hover microstate as its own typography family.
- Highly specific animation-timed text behavior.
- A giant token matrix for every responsive breakpoint.
- Separate typography families for preview-only or legacy-preserved routes if they can map to existing roles.

Canonical Type Roles

1. Display / Hero

- Purpose
  rare editorial emphasis for auth hero and top-tier product entry moments.
- Usage
  login hero, rare top-of-page identity moments, never inside dense content or row groups.

2. Page Title

- Purpose
  primary page heading for top-level product routes.
- Usage
  home sections, progress, integrations, settings, state surfaces.

3. Modal Title

- Purpose
  primary dialog heading with editorial weight but one step calmer than hero/page display.
- Usage
  `Open plan`, `Import plan`, future bounded product dialogs.

4. Section Title

- Purpose
  section-level orientation within an open surface.
- Usage
  calendar month heading, route sections, settings sections, grouped surface leads.

5. Panel Title

- Purpose
  headline for compact internal panels and review modules.
- Usage
  `Feedback`, recommendation blocks, support modules, proposal review subsections, dense route-local support frames.

6. Row Title

- Purpose
  dense list/group row title.
- Usage
  grouped rows, import summary rows, integration rows, compact metadata blocks.

7. Body / Paragraph

- Purpose
  default readable paragraph role for page and section support copy.
- Usage
  route intros, modal descriptions, empty states, explanatory copy that is still primary enough to be read.

8. Body Small

- Purpose
  smaller but still readable support text.
- Usage
  dense secondary explanations, row support, compact review notes, quieter modal support, attached-file metadata.

9. Helper Text

- Purpose
  field-adjacent or operational instruction text.
- Usage
  input hints, form instruction, bounded affordance notes.

10. Caption

- Purpose
  smallest calm descriptive text.
- Usage
  tertiary metadata, legends, tiny footnotes, low-priority supporting detail.

11. Label / Eyebrow

- Purpose
  micro orientation, not emphasis.
- Usage
  section lead-ins, form labels, tiny route headers, disclosure labels.

12. Form Label

- Purpose
  explicit label for an input control.
- Usage
  may alias `Label / Eyebrow`, but should be documented separately for clarity.

13. Button Text

- Purpose
  action text tuned to control size tier.
- Usage
  all button tiers and CTA families.

14. Nav Text

- Purpose
  shell and primary navigation text.
- Usage
  sidebar rows, mobile nav, route switching controls.

15. Menu Text

- Purpose
  dropdown and utility-menu text.
- Usage
  profile dropdown, shell utility menus.

16. Metric / Data

- Purpose
  measured truth values.
- Usage
  distance, duration, pace, counts, dates, chart anchors, completion summaries.

17. Metric Label

- Purpose
  compact label for a metric value.
- Usage
  metric rows, analytics summaries, inline support summaries.

18. Status / Badge

- Purpose
  semantic state identifier, not a heading.
- Usage
  pills, state chips, validity/readiness markers.

19. Error Text

- Purpose
  clearly actionable negative state copy.
- Usage
  field-level and bounded section-level errors.

20. Success Text

- Purpose
  clearly bounded positive confirmation.
- Usage
  save success, sent-link confirmation, action-complete feedback.

21. Technical / Mono

- Purpose
  truth that reads as measured, technical, or fixed-format.
- Usage
  JSON textarea content, date stamps, pace ranges, durations, counts, short file metadata.

Type Token Specification

Display / Hero

- Font family
  `Fraunces`
- Font size
  `clamp(3.5rem, 7vw, 5rem)`
- Line-height
  `0.98` to `1.02`
- Font weight
  `400`
- Letter spacing
  `-0.02em`
- Casing
  sentence case or title case only
- Usage rules
  one per surface; never stacked repeatedly inside dense content
- Appears in
  auth/login hero, future rare high-emphasis entry moments

Page Title

- Font family
  `Fraunces`
- Font size
  keep current `hito-page-title` scale: `clamp(3rem, 6vw, 4.5rem)`
- Line-height
  `1`
- Font weight
  `400`
- Letter spacing
  `-0.02em`
- Casing
  sentence case
- Usage rules
  only top-level route title or major state-surface heading
- Appears in
  progress, integrations, settings, state screens, DS reference

Modal Title

- Font family
  `Fraunces`
- Font size
  `2rem` desktop target, `1.75rem` compact target
- Line-height
  `1.08` to `1.12`
- Font weight
  `400`
- Letter spacing
  `-0.02em`
- Casing
  sentence case
- Usage rules
  standard dialog title; do not use page-title scale inside modal chrome
- Appears in
  `Open plan`, `Import plan`, bounded product dialogs

Section Title

- Font family
  `Fraunces`
- Font size
  `1.5rem`
- Line-height
  `1.15`
- Font weight
  `400`
- Letter spacing
  `-0.02em`
- Casing
  sentence case
- Usage rules
  for section-level hierarchy only; do not inflate with local `text-4xl` except for the calendar month heading, which should instead get an explicit page-section variant
- Appears in
  settings sections, progress sections, calendar support sections

Panel Title

- Font family
  `Fraunces`
- Font size
  `1.25rem` to `1.375rem`
- Line-height
  `1.18`
- Font weight
  `400`
- Letter spacing
  `-0.015em`
- Casing
  sentence case
- Usage rules
  for internal grouped support, feedback sections, modal subpanels, recommendation headings
- Appears in
  `Feedback`, `Open plan` review sections, support modules

Row Title

- Font family
  `Inter`
- Font size
  `0.875rem`
- Line-height
  `1.35`
- Font weight
  `500`
- Letter spacing
  `0`
- Casing
  sentence case
- Usage rules
  dense group/list rows only
- Appears in
  `hito-list-row-title` surfaces

Body / Paragraph

- Font family
  `Inter`
- Font size
  `0.875rem`
- Line-height
  `1.58`
- Font weight
  `400`
- Letter spacing
  `0`
- Casing
  sentence case
- Usage rules
  default support paragraph; do not shrink to `text-sm` route-local variants unless the copy is truly secondary
- Appears in
  page intros, state surfaces, modal descriptions

Body Small

- Font family
  `Inter`
- Font size
  `0.8125rem`
- Line-height
  `1.5`
- Font weight
  `400`
- Letter spacing
  `0`
- Casing
  sentence case
- Usage rules
  quiet but still readable; should replace many local `text-sm text-muted-foreground` and `text-xs leading-relaxed` usages
- Appears in
  list row copy, file metadata, compact status explanation, support rows

Helper Text

- Font family
  `Inter`
- Font size
  `0.75rem`
- Line-height
  `1.45`
- Font weight
  `400`
- Letter spacing
  `0`
- Casing
  sentence case
- Usage rules
  only field-adjacent or control-adjacent operational guidance
- Appears in
  `hito-field-helper`

Caption

- Font family
  `Inter`
- Font size
  `0.6875rem`
- Line-height
  `1.45`
- Font weight
  `400`
- Letter spacing
  `0`
- Casing
  sentence case by default
- Usage rules
  tertiary detail only; do not use for important meaning
- Appears in
  legends, low-priority footer notes, tiny timestamps

Label / Eyebrow

- Font family
  `Inter`
- Font size
  `0.6875rem`
- Line-height
  `1`
- Font weight
  `500`
- Letter spacing
  `0.18em`
- Casing
  uppercase
- Usage rules
  orientation only; one per block is enough; do not stack multiple all-caps roles in the same compact area
- Appears in
  `hito-label`, `hito-section-subtitle`, section prefaces

Form Label

- Font family
  `Inter`
- Font size
  `0.6875rem`
- Line-height
  `1`
- Font weight
  `500`
- Letter spacing
  `0.18em`
- Casing
  uppercase
- Usage rules
  same token family as `Label / Eyebrow`, but reserved for field ownership
- Appears in
  form controls across auth, onboarding, import, settings

Button Text

- Font family
  `Inter`
- Font size
  align to existing size tiers:
  `xs 0.6875rem`
  `sm 0.75rem`
  `md 0.875rem`
  `lg 0.875rem`
  `xl 0.9375rem`
- Line-height
  `1`
- Font weight
  `500`
- Letter spacing
  `0.01em` for `xs/sm`, `0` for `md/lg/xl`
- Casing
  sentence case
- Usage rules
  no ad hoc uppercase CTA text
- Appears in
  all Hito buttons

Nav Text

- Font family
  `Inter`
- Font size
  `0.875rem` desktop primary nav, `0.625rem` mobile nav label
- Line-height
  `1` desktop, `1.1` mobile
- Font weight
  `500`
- Letter spacing
  `0` desktop, `0.12em` mobile uppercase utility mode
- Casing
  sentence case desktop, uppercase only for the compact mobile utility strip
- Usage rules
  navigation should not invent its own scale by route
- Appears in
  shell nav, mobile nav, route utility controls

Menu Text

- Font family
  `Inter`
- Font size
  `0.8125rem`
- Line-height
  `1.3`
- Font weight
  `500`
- Letter spacing
  `0`
- Casing
  sentence case
- Usage rules
  dropdown rows should not mix with raw `text-sm` and `text-[11px]` unless the latter is explicitly metadata
- Appears in
  profile menu, dropdown actions

Metric / Data

- Font family
  `JetBrains Mono`
- Font size
  `1rem` compact metrics; larger `clamp(...)` variant for analytics only
- Line-height
  `1.1`
- Font weight
  `500` for emphasized values, `400` otherwise
- Letter spacing
  `-0.02em` for large analytics values, `0` otherwise
- Casing
  as-measured
- Usage rules
  use for measured truth only, not decorative emphasis
- Appears in
  metric rows, dates, durations, distance, analytics totals

Metric Label

- Font family
  `Inter`
- Font size
  `0.625rem`
- Line-height
  `1`
- Font weight
  `500`
- Letter spacing
  `0.16em`
- Casing
  uppercase
- Usage rules
  metric labels should be quieter than the value and should not become section headers
- Appears in
  metric rows and analytics summaries

Status / Badge

- Font family
  `Inter`
- Font size
  `0.625rem`
- Line-height
  `1`
- Font weight
  `500`
- Letter spacing
  `0.12em`
- Casing
  uppercase
- Usage rules
  semantic state only; never same hierarchy as a heading
- Appears in
  `hito-status-pill`

Error Text

- Font family
  `Inter`
- Font size
  `0.875rem`
- Line-height
  `1.45`
- Font weight
  `500`
- Letter spacing
  `0`
- Casing
  sentence case
- Usage rules
  clear and local; keep near the relevant control or action family
- Appears in
  `hito-field-error`, bounded action errors

Success Text

- Font family
  `Inter`
- Font size
  `0.875rem`
- Line-height
  `1.45`
- Font weight
  `500`
- Letter spacing
  `0`
- Casing
  sentence case
- Usage rules
  bounded and short; not for long narrative confirmation
- Appears in
  `hito-field-success`, bounded save/send confirmation

Technical / Mono

- Font family
  `JetBrains Mono`
- Font size
  `0.75rem` to `0.875rem`
- Line-height
  `1.45`
- Font weight
  `400`
- Letter spacing
  `0`
- Casing
  as-authored
- Usage rules
  reserved for JSON, file metadata, identifiers, fixed-format timestamps, and measured truth fragments
- Appears in
  pasted JSON, dates, timestamps, compact technical readback

Drift Findings

Shared primitives are strong, but current drift is visible in several repeat patterns.

One-off heading scale drift

- `TodayHero` uses local Fraunces hero sizing and line-height rather than a canonical hero role.
- `PlanManagementDialog`, `UploadJsonDialog`, and parts of `CompletionPanel` use local `text-3xl`, `text-2xl`, or custom rem-based display sizes instead of a shared modal-title or panel-title role.
- `Calendar` inflates `hito-section-title` with local `text-4xl lg:text-5xl` for the month heading rather than using an explicit page-section/title variant.

Label and eyebrow drift

- Shell, auth, calendar cells, and compact action areas still use raw `text-[10px]` or `text-[11px]` plus local tracking values that are very close to `hito-label` but not canonical.
- Some small uppercase text currently carries too much visual weight because it is used as both orientation and emphasis.

Mixed body/helper styles

- The product alternates between `hito-page-copy`, `hito-support-copy`, `hito-list-row-copy`, local `text-sm leading-relaxed`, and local `text-xs leading-relaxed` for similar jobs.
- This is most visible in `CompletionPanel`, `PlanManagementDialog`, `UploadJsonDialog`, and `AuthEntryScreen`.

Technical and metric role drift

- The mono family is present, but it is not yet formally separated into `metric/data` versus `technical/JSON` roles.
- Some measured values still use display or body styles when they should use canonical mono roles.

Modal hierarchy drift

- Dialog titles and descriptions are visually good, but they are still defined locally enough that new dialogs could drift again.
- Compact modal subsections also lack one shared `panel-title` role.

Dense-surface imbalance

- `CompletionPanel` is the biggest typography complexity hotspot.
- It mixes editorial titles, uppercase summaries, dense form labels, support readbacks, and technical caveats without one documented internal hierarchy ladder.

`/hitoDS` Requirements

`/hitoDS` should become the typography reference baseline, not just a partial example section.

It must show

- the three font families and where each is allowed
- every canonical type role from this document
- one specimen line for each role
- one short usage note for each role
- one realistic in-product example for each role family:
  page
  modal
  form
  row/group
  metric/data
  nav/menu
  status
- one explicit anti-pattern area showing:
  too many uppercase micro labels
  oversized headings in compact blocks
  body text used as helper text
  local `text-[11px]` style drift

It should not try to become

- a giant editorial typography playground
- a brand-book detached from the app
- a full accessibility treatise
- a component museum that duplicates every route

Implementation Plan

Smallest safe consolidation path

1. Canonicalize missing role classes first.

- Add explicit shared roles for:
  `hero/display`
  `modal-title`
  `panel-title`
  `body-small`
  `menu-meta`
  `technical-mono`
- Do not create dozens of near-duplicate text classes.

2. Expand `/hitoDS` typography to reflect the full live system.

- Show the complete role inventory.
- Show the font ownership rules.
- Show anti-patterns and realistic usage.

3. Normalize the highest-drift surfaces first.

- `CompletionPanel`
- `PlanManagementDialog`
- `UploadJsonDialog`
- `TodayHero`
- `Calendar`
- `AuthEntryScreen`

4. Normalize shell and utility microtext second.

- mode labels
- profile detail/meta
- dropdown metadata
- compact utility labels

5. Leave low-risk contextual text for a later cleanup pass.

- chart-local captions
- tiny visualization annotations
- edge-case preview-only explanatory microcopy

Recommended implementation discipline

- Prefer a small set of explicit CSS role classes or DS tokens over route-local utility stacks.
- Replace repeated raw Tailwind type utilities only where the semantic role is already clear.
- Do not abstract every heading into a React typography component unless repeated misuse continues after CSS canonicalization.
- Keep size responsiveness shallow:
  one mobile-safe default
  one larger desktop step for hero/page-title roles
  avoid breakpoint ladders for ordinary body and row text.

QA Expectations

- The same text job should look the same across shell, home, workout, modal, settings, and utility surfaces.
- Display text should appear only at top-of-surface emphasis layers.
- Dense support areas should use `panel-title`, `row-title`, `body-small`, `caption`, and `label` predictably.
- Uppercase microtext should never compete visually with the main heading in the same block.
- Field helper, field error, and success text should remain clearly distinct but typographically related.
- Metric rows should read as one family across home, progress, and feedback.
- Modal titles should align across `Open plan`, `Import plan`, and future bounded dialogs.
- `/hitoDS` should be sufficient for visual inspection before introducing any new route-local type treatment.

Risks

- Over-normalizing could flatten useful editorial contrast if every Fraunces usage is forced into one size.
- Under-normalizing would keep current route-level drift alive, especially in feedback and modal-heavy flows.
- If Frontend treats every local text utility as a bug, the implementation pass could become too broad.
- If `CompletionPanel` is not tackled early, typography drift will remain visible even after DS token cleanup elsewhere.

Exit Criteria

- Hito has one documented canonical typography taxonomy covering all major live text jobs.
- Shared token or role classes exist for the missing high-value roles:
  hero/display
  modal-title
  panel-title
  body-small
  technical-mono
- `/hitoDS` documents the full live type system instead of only a partial scale.
- The main drift surfaces no longer depend on one-off heading sizes, local uppercase tracking recipes, or mixed helper/body styles for the same job.
- Future UI work can map new text to existing Hito roles without inventing route-local typography.

Next Recommended Role

FRONTEND

Suggested Next Step

Implement the smallest safe typography consolidation slice in shared CSS and `/hitoDS`, then normalize `CompletionPanel`, `PlanManagementDialog`, `UploadJsonDialog`, `TodayHero`, `Calendar`, and `AuthEntryScreen` onto the new canonical roles before touching lower-priority utility surfaces.
