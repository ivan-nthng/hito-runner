# Light/Dark Mode And Color Palette Expansion

## Status

backlog

## Type

change_request

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Implement the first Hito light/dark mode foundation slice after plan creation stabilizes.

## Stage

FRONTEND implementation / Hito DS semantic color tokens and mode specimen

## Exact Handoff Prompt

```text
ROLE: FRONTEND

1. Task

Implement the first Hito light/dark mode foundation slice after plan creation stabilizes.

2. Stage

FRONTEND implementation / Hito DS semantic color tokens and mode specimen.

3. Context

The user reported that the current dark-heavy Hito UI is uncomfortable during daytime use. This is
future work after the functional plan-creation flow is complete enough not to churn the same
surfaces. Hito needs two intentional modes, light and dark, built from Hito DS semantic tokens rather
than route-local theme patches. DESIGNER has completed the audit and identified the required token
roles, accessibility rules, hardcoded-color risks, and first implementation sequence.

4. Root cause and architecture fit

Before changing styles, inspect the existing Hito DS color/token layer and route usage. Do not patch
individual screens into light mode. The root fix is a shared semantic token expansion plus a
mode-aware `/hitoDS` color specimen, while preserving current dark visuals.

5. Required implementation scope

- Freeze current dark tokens as the `dark` semantic map.
- Add missing semantic roles without changing current visuals.
- Add `/hitoDS` color specimens for dark/light with contrast samples.
- Tokenize the first safe hardcoded-color findings that block light-mode readiness only if they can
  be changed without visual regression.
- Do not enable global light mode as the default in this first slice unless a separate plan approves
  rollout.

6. Constraints

Do not redesign plan creation in this task.
Do not create route-local light mode hacks.
Do not switch the app to light mode by default without implementation and QA.
Do not break the current dark mode.
Do not introduce a second visual system outside Hito DS.
Do not change product logic, backend, Supabase, OpenAI, or plan generation.
Do not start until the current functional plan-creation flow is stable enough not to churn the same
surfaces.

7. Validation

- targeted ESLint for changed frontend/style files
- `git diff --check`
- `npm run build`
- built-in Codex browser first for `/hitoDS` color specimen
- contrast/accessibility spot checks for text, buttons, inputs, focus rings, disabled states, and
  charts represented in the specimen
- regression check that current dark mode still looks usable

8. Report format

Return:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## Severity

medium

## Owner

FRONTEND

## Reported

2026-06-08

## Intake Triage

- Status: triaged
- Type: design
- Severity: medium
- Priority: next
- Owner: DESIGNER
- Reported: 2026-06-08

## User Report

"The current dark UI is uncomfortable during the day. Hito needs a properly expanded color palette
and two intentional modes: light and dark. This should be marked important for the future, after the
functional plan-creation work is finished."

## Evidence

- User reported a real daytime usability issue with the current dark-heavy interface.
- Source search found the current Hito DS color foundation in implemented docs, but no existing
  backlog item that owns light/dark mode support or a full palette expansion.
- This is future design-system work and should not interrupt the current functional plan-creation
  flow.

## Designer Audit Closeout

Designer audit passed for the future color-system direction:

- Hito has a strong dark-first base with raw primitives:
  `stone`, `sand`, `amber`, `blue`, `terracotta`, `green`, `orange`, and `red`.
- Existing semantic tokens include:
  `background`, `foreground`, `surface`, `surface-elevated`, `popover`, `border`, `hairline`,
  `input`, `ring`, `signal`, `success`, `warn`, `destructive`, and workout colors.
- The system is not yet a full light/dark model.
- Many states rely on `color-mix(...)` against foreground, background, or signal colors and may
  become weak in light mode.
- Risk is highest in Admin shell, Work Items, Plan Preset cards, `/hitoDS`, date picker/calendar,
  tooltips/dialogs/scrims, charts, and dense data surfaces.

## Current Palette Diagnosis

- The current dark-first foundation is good and should be preserved as the baseline dark map.
- Light mode cannot be implemented safely as route-local patches or simple inversion.
- Semantic token expansion is required before light mode implementation.
- Accessibility and contrast must be verified across both modes.
- Current dark mode must remain usable after token expansion.

## Observed Behavior

The current Hito interface is strongly dark-mode biased. That visual direction can be uncomfortable
for daytime use, especially across long workflows such as onboarding, plan review, Admin work, forms,
tables, dialogs, and design-system reference pages.

## Expected Behavior

Hito should support an intentional tokenized color system with two well-designed modes:

- light mode
- dark mode

This should not be a one-off inversion, route-local theme patch, or quick switch to a light default.
Both modes should feel native to Hito and be built through shared Hito DS tokens and semantic roles.

## Semantic Token Map Proposal

Base:

- `app-bg`
- `page-bg`
- `surface`
- `surface-elevated`
- `surface-wash`
- `surface-inset`
- `text-primary`
- `text-secondary`
- `text-muted`
- `text-inverse`

Borders:

- `border-subtle`
- `border-strong`
- `divider`
- `focus-ring`
- `focus-ring-soft`

Actions:

- `action-primary`
- `action-primary-hover`
- `action-soft`
- `selected-bg`
- `selected-border`
- `selected-text`

Forms:

- `input-bg`
- `input-border`
- `input-hover`
- `input-focus`
- `input-placeholder`
- `input-disabled-bg`
- `input-disabled-text`
- `input-disabled-border`

Status:

- `success-bg`
- `success-border`
- `success-text`
- `warning-bg`
- `warning-border`
- `warning-text`
- `danger-bg`
- `danger-border`
- `danger-text`
- `info-bg`
- `info-border`
- `info-text`
- `neutral-bg`
- `neutral-border`
- `neutral-text`

Product states:

- `unavailable`
- `recommended`
- `needs-more-info`
- `not-ideal`
- `custom-route`

Charts/calendar:

- `chart-series-1..n`
- `chart-grid`
- `chart-axis`
- `calendar-today`
- `calendar-selected`
- `calendar-outside-plan`
- `calendar-evidence`
- `calendar-completed`

Overlays:

- `scrim`
- `tooltip-bg`
- `tooltip-text`
- `tooltip-border`
- `popover-bg`
- `toast-bg`
- `toast-border`

Preset cards:

- mode-aware preset accent recipe for `10K`
- mode-aware preset accent recipe for `half`
- mode-aware preset accent recipe for `marathon`
- mode-aware preset accent recipe for `custom/unavailable`

## Accessibility Rules

- WCAG AA is the minimum bar.
- Normal text must meet `4.5:1`.
- Large/display text must meet `3:1`.
- Icons, control boundaries, and focus indicators must meet `3:1`.
- Muted instructional text should still meet `4.5:1`.
- Decorative metadata may be quieter if it is not required for comprehension.
- Status must not rely on color only.
- `focus-visible` must differ from selected/current states.
- Disabled states can be lower contrast, but they must remain visibly non-interactive.
- Charts need labels, legends, and state shape, not only color.

## Hardcoded Color Findings

Mostly acceptable:

- primitive hex values in `/hitoDS` swatches
- logo light/dark specimens
- raw primitive definitions in `styles.css`

Should be tokenized before light mode:

- `bg-black/35` prompt block in `src/routes/admin.capture.tsx`
- hardcoded favicon gradient in `src/routes/hitoDS.tsx`
- `bg-black/20` contrast badge in primitive swatches
- broad black/white mixing inside shadows, enclosed tabs, dialogs, date picker, tooltips, and nav
  cards

Needs frontend audit:

- `386` `color-mix(...)` occurrences
- `41` `oklch(...)` occurrences
- `6` inline style usages
- especially Plan Presets, date picker, calendar/workout playground, data tables, state surfaces,
  tooltips, buttons, inputs, and shell/sidebar

## Light Theme Risks

Highest-risk surfaces for light mode:

- Admin shell / Work Items
- Plan Preset cards
- `/hitoDS`
- date picker / calendar
- tooltips / dialogs / scrims
- charts
- data tables / search / filters
- buttons / inputs

## Source Investigation

Checked for existing ownership across:

- `docs/tasks/backlog/`
- `docs/plans/active/`
- `docs/current-product.md`
- `docs/current-system.md`

Findings:

- No backlog item was found for light mode, dark mode, theme modes, or color palette expansion.
- `docs/current-system.md` documents the first Hito DS foundations cleanup slice with raw color
  primitives and semantic tokens, but that implemented state does not define a full light/dark mode
  system.

## Likely Root Cause

Hito has a strong dark visual identity and an initial semantic token layer, but it does not yet have
a mode-aware color contract that designs both daylight and dark usage as first-class experiences.
Without a mode-aware Hito DS palette, new surfaces keep inheriting the dark-heavy bias.

## Recommended Fix Direction

Start from Hito DS tokens and semantic color roles. Define both light and dark variants for:

- background
- surface
- elevated surface
- text primary, secondary, and muted
- borders and dividers
- accent and action
- success, warning, danger, and info
- charts and data visualization
- focus rings
- disabled states
- overlays and dialogs
- input, search, and filter states
- Admin, Work Items, onboarding, and runner app surfaces

The design pass should produce a token map and usage contract before frontend implementation begins.
Frontend should then implement through shared Hito DS tokens/classes rather than route-local light
mode hacks.

## Future Implementation Sequencing

This is important future work, but implementation should wait until the functional plan-creation
flow is complete enough that the same onboarding/card/review surfaces will not churn underneath the
theme work.

Recommended sequence:

1. Freeze current dark tokens as the `dark` semantic map.
2. Add missing semantic roles without changing visuals.
3. Add `/hitoDS` color specimen for dark/light with contrast samples.
4. Build light theme behind local/user preference.
5. Prove Admin and Work Items first.
6. Prove onboarding, Plan Presets, date picker, and calendar.
7. Finish with contrast QA across dialogs, tooltips, charts, tables, buttons, and inputs.

## Blocked Until

Implementation remains blocked until the current functional plan-creation flow is stable enough not
to churn the same onboarding, card, review, and calendar surfaces.

## What Not To Touch

- Do not redesign plan creation now.
- Do not create route-local light mode hacks.
- Do not switch the app to light mode by default without design and QA.
- Do not break current dark-mode styling.
- Do not introduce a second visual system outside Hito DS.
- Do not change product logic, backend, Supabase, OpenAI, or plan generation.
- Do not treat this as immediate implementation work while plan-creation flow is still in motion.

## Validation Expectations

Future validation should include:

- Designer audit across runner app, onboarding, Admin, Work Items, `/hitoDS`, dialogs, forms, and
  data tables.
- Token map for both light and dark modes.
- Frontend implementation using shared Hito DS tokens/classes.
- Browser QA in both modes.
- Mobile `375px` checks.
- Contrast/accessibility checks for text, buttons, inputs, focus rings, disabled states, and
  charts.
- Regression check that the existing dark mode remains usable.
