# Hito DS Foundations Cleanup And Rollout Spec

## Status

Draft

## Owner

Design System Agent

## Last Updated

2026-05-20

## Task

Clean up and formalize the Hito design system so Frontend can migrate the service from mixed local styling to one canonical DS contract without changing product behavior.

## Stage

FRONTEND implementation spec

## Purpose

Hito already has a real design-system layer in `src/styles.css`, but it is currently strongest at the semantic and component level, not at the foundations level.

The current system has three visible problems:

- color semantics exist, but raw primitive color tokens are not explicitly defined as the first layer
- typography is partly canonicalized, but still contains near-duplicate roles and many route-local text recipes
- spacing and padding are widely used, but there is no explicit primitive spacing contract that explains how page gaps, panel padding, control insets, and grid rhythm are derived

This spec defines the exact cleanup and rollout order for Frontend.

It is not a redesign brief.
It is not permission to restyle the product.
It is not permission to introduce a theme engine, variant factory, or second UI system.

## Product Direction To Protect

The live Hito product direction remains:

- calm
- editorial
- athletic
- premium
- low-chrome
- low-card

The cleanup must make the system smaller and more consistent.
It must not make the product louder, brighter, more ornamental, or more framework-shaped.

## Canonical Source Hierarchy

When implementation questions appear, use this order:

1. implemented product behavior in current code
2. `src/styles.css`
3. `/hitoDS` in `src/routes/hitoDS.tsx`
4. `docs/current-product.md`
5. `docs/current-system.md`
6. active DS plans

If those disagree:

- report the drift explicitly in the implementation output
- choose the smallest alignment step
- do not silently invent a new pattern

## Current DS State

### What Already Exists And Should Be Preserved

- semantic product colors for background, foreground, surface, signal, success, warn, destructive, and workout families
- canonical typography roles such as `hito-page-title`, `hito-modal-title`, `hito-panel-title`, `hito-body`, `hito-caption`, `hito-form-label`, and `hito-micro-label`
- canonical field, button, tab, row-group, shell-nav, status-pill, feedback-marker, and state-surface classes
- a live DS reference page at `/hitoDS`

### What Is Still Broken Or Incomplete

- no explicit raw color primitive layer under semantic product tokens
- no explicit spacing primitive layer under route padding, panel padding, gap, and inset decisions
- no foundations section in `/hitoDS` that shows how semantic tokens derive from raw tokens
- route-local gradients, radius values, text sizes, and spacing still appear in runner-facing surfaces
- some typography roles are functionally duplicates but are not documented as a system family

## Root Cause

The system was built from the middle outward:

- semantic colors and reusable component classes landed first
- product surfaces started using those classes
- but foundations were never made explicit enough to prevent new local recipes

That is why the repo now has both:

- good canonical classes
- and a visible layer of ad hoc `text-[10px]`, `rounded-[24px]`, `bg-[linear-gradient(...)]`, route-local glows, and local spacing decisions

The fix is not broad restyling.

The fix is:

1. define foundations explicitly
2. expose them in `/hitoDS`
3. migrate the highest-drift screens in controlled slices
4. delete local styling only after migration

## Non-Negotiable Rules

- preserve product behavior and copy unless a slice explicitly includes copy cleanup
- do not redesign layout hierarchy while cleaning tokens
- prefer deletion over abstraction
- prefer one semantic token over route-local color values
- prefer one primitive over multiple local recipes
- do not add a token for a single decorative case
- do not add a new component class unless it replaces repeated real drift
- keep visualization geometry exceptions separate from component chrome
- update `/hitoDS` whenever canonical DS behavior changes

## Out Of Scope

- backend behavior
- route logic
- auth flow changes
- onboarding data contract changes
- Garmin or AI logic
- new theme switching
- light mode
- component-library replacement
- large-scale shadcn rewrite

## Files In Scope

### Canonical DS Files

- `src/styles.css`
- `src/routes/hitoDS.tsx`

### First Migration Targets

- `src/routes/workout.$date.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/Calendar.tsx`
- `src/components/AppShell.tsx`
- `src/components/AuthEntryScreen.tsx`
- `src/routes/login.tsx`
- `src/routes/settings.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/UploadJsonDialog.tsx`
- `src/components/plan-management/PlanImportPanel.tsx`
- `src/components/onboarding/JsonImportPanel.tsx`

### Secondary / Later Targets

- `src/routes/changelog.tsx`
- DS-adjacent utility surfaces only after runner-facing routes are aligned

## Foundations Architecture To Implement

## 1. Color Foundations

### Goal

Add one raw primitive color layer under the existing semantic Hito tokens.

### Why

Today `:root` mostly jumps straight into semantic color names like:

- `--background`
- `--surface`
- `--signal`
- `--easy`
- `--quality`

That works, but it leaves no explicit first layer for reuse or mapping discipline.

### Required New Structure

Keep four levels only:

1. raw primitive color tokens
2. semantic product color tokens
3. component-level usage through classes
4. route composition

### Required Primitive Token Direction

Primitive token names may describe appearance because they are raw foundations.

Use a small palette only.

Recommended raw families:

- graphite / stone family for page and surfaces
- sand / chalk family for text and contrast
- amber family for signal
- blue family for easy
- terracotta family for quality
- green family for success
- orange family for warn
- red family for destructive

Recommended token pattern:

- `--stone-950`
- `--stone-900`
- `--stone-850`
- `--stone-800`
- `--sand-50`
- `--sand-100`
- `--amber-500`
- `--amber-600`
- `--blue-500`
- `--green-500`
- `--orange-500`
- `--red-500`

Do not create a huge scale.
Only create the values that the current product really uses.

### Required Semantic Mapping

Map existing semantic tokens from raw primitives, not from hard-coded new OKLCH values sprinkled everywhere.

Semantic tokens that must remain canonical:

- `--background`
- `--foreground`
- `--surface`
- `--surface-elevated`
- `--hairline`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--signal`
- `--signal-foreground`
- `--success`
- `--success-foreground`
- `--warn`
- `--destructive`
- `--destructive-foreground`
- `--easy`
- `--long`
- `--quality`
- `--rest`

### Required Compatibility Rule

Do not break existing Tailwind-facing aliases in `@theme inline`.
Refactor the values behind them, not their public contract, unless a rename is clearly necessary and all usages are updated in the same slice.

### Required `/hitoDS` Additions

Add a new `Foundations` section that shows:

- raw primitive swatches
- semantic token swatches
- semantic-to-primitive mapping explanation
- usage rules for `signal`, `success`, `warn`, `destructive`
- usage rules for workout colors vs global CTA hierarchy

## 2. Typography Foundations

### Goal

Turn the current typography collection into one transparent family system.

### Current Issue

The product already has good type roles, but the structure is not explicit enough.
There are near-duplicates and local text recipes still bypass the system.

### Required Family Model

Document the type system as families first:

- `display`
- `title`
- `body`
- `label`
- `mono`

Then document the live roles inside those families.

### Required Canonical Roles

Keep these or equivalent wrappers:

- `hito-display-title`
- `hito-page-title`
- `hito-modal-title`
- `hito-section-title`
- `hito-panel-title`
- `hito-body`
- `hito-body-small`
- `hito-support-copy`
- `hito-caption`
- `hito-label`
- `hito-form-label`
- `hito-micro-label`
- `hito-technical-mono`
- `hito-metric-value`
- `hito-metric-label`

### Required Simplification Rule

Do not proliferate more text classes.

Instead:

- define the family model clearly
- decide which current classes are truly distinct
- keep wrappers only where the product needs separate intent

### Specific Cleanup Decisions

- `hito-label`, `hito-form-label`, and `hito-micro-label` should remain only if their jobs are clearly different in documentation
- if two classes are visually identical but semantically different, keep both only if that semantic distinction helps implementation discipline
- `hito-page-copy`, `hito-body`, and `hito-support-copy` should be explained as contextual wrappers, not treated like unrelated type systems

### Required Migration Targets

Replace obvious local text recipes first:

- `text-[10px]`
- `text-[11px]`
- `tracking-[0.18em]`
- `tracking-[0.14em]`
- local serif title sizes where a canonical display or title role should exist

### Required `/hitoDS` Additions

Expand the typography section so it shows:

- family
- role
- font
- size
- line height
- tracking
- intended use
- anti-patterns

Also add a small list of banned drift patterns:

- local uppercase micro-label recipes
- route-local serif section headings
- local tiny metadata text when `hito-caption` or `hito-micro-label` should be used

## 3. Spacing Foundations

### Goal

Create one explicit space primitive scale and map component spacing to it.

### Current Issue

Spacing is partly consistent in practice, but not explicit as a DS contract.
Frontend can currently guess the right padding, but the system does not yet teach it.

### Required Primitive Space Scale

Define one compact space scale and expose it in CSS and `/hitoDS`.

Recommended primitives:

- `--space-1: 0.25rem`
- `--space-2: 0.5rem`
- `--space-3: 0.75rem`
- `--space-4: 1rem`
- `--space-5: 1.25rem`
- `--space-6: 1.5rem`
- `--space-8: 2rem`
- `--space-10: 2.5rem`

Do not create a full enterprise spacing ladder.
The goal is not to support every possible future composition.
The goal is to describe what the product already does repeatedly.

### Required Mapping Rules

Document and implement these relationships:

- control inset
  `xs -> space-2`
  `sm -> space-3`
  `md -> space-4-ish inset`
  `lg -> space-4`
  `xl -> space-5`
- panel padding
  compact panels use `space-4`
  emphasized panels use `space-5`
- section gap
  internal grouped section gap should center around `space-3` and `space-4`
- route spacing
  page sections should center around `space-6` and `space-8`
- hero spacing
  only top-level hero moments should reach `space-10`

### Tailwind Integration Requirement

Expose any needed aliases through `@theme inline` so Tailwind usage can reference the canonical primitives instead of ad hoc values when appropriate.

### Required `/hitoDS` Additions

Add a `Spacing` or `Foundations > Spacing` section showing:

- primitive scale
- sample page rhythm
- sample panel padding
- sample row-group spacing
- sample button/input insets by size tier

## 4. Radius Foundations

### Goal

Keep the current radius system but eliminate local drift.

### Current Canonical Direction

The current radius stack already points in the right direction:

- `sm`
- `md`
- `lg`
- `xl`
- `2xl`

### Required Rule

Normalize around the existing scale and eliminate route-local values unless clearly justified.

### Explicit Drift To Remove

- `rounded-[24px]`
- `rounded-[26px]`
- `rounded-[1.75rem]`
- local rounded values that duplicate a canonical token

### Exception Rule

If an exception remains:

- name the reason
- keep it local
- document it as an exception
- do not silently treat it as a new DS token

## 5. Surface Foundations

### Goal

Reduce local gradients and ad hoc framed panels.

### Required Surface Strategy

Use a small canonical surface family:

- `hito-surface`
- `hito-surface-flat`
- `hito-state-surface`
- `hito-row-group`

Add new surface classes only if they replace repeated route-local recipes.

### Current High-Drift Surface Cases

These should migrate to DS-owned surface recipes rather than keep inline gradients forever:

- workout detail main panel chrome
- workout detail fueling/recovery block
- Garmin upload empty state block
- persisted login already-signed-in panel

### Important Rule

Do not flatten every surface.
The product still needs calm premium atmosphere.
But that atmosphere should come from a small DS-owned surface family, not from many local gradients.

## Implementation Slices

## Slice 1: Foundations Only

### Goal

Land the raw primitives and DS documentation before touching runner-facing screens.

### Files

- `src/styles.css`
- `src/routes/hitoDS.tsx`

### Required Work

- add raw color primitives
- map existing semantic tokens from raw primitives
- add explicit space primitives
- document typography family model
- add `/hitoDS` foundations section
- add `/hitoDS` spacing section
- add DS guidance about semantic tones and workout colors

### Must Not Do

- do not migrate product screens yet
- do not rename public classes unless absolutely necessary
- do not change product behavior

### Exit Criteria

- `/hitoDS` clearly teaches foundations, not just components
- raw primitives exist
- semantic tokens are visibly mapped from them
- spacing primitives are visible and documented

## Slice 2: Workout Detail Cleanup

### Goal

Migrate the highest-drift runner-facing surface first.

### Files

- `src/routes/workout.$date.tsx`
- `src/components/CompletionPanel.tsx`

### Required Work

- replace route-local gradients where a DS-owned surface should exist
- replace local text micro-recipes with canonical typography roles
- replace local tiny metadata sizes with DS roles
- replace local radius values with DS radius tokens or classes
- reduce white alpha-border recipes where a canonical surface or divider exists

### Explicit Drift To Remove

- route-local hero radial background if it is ordinary surface chrome rather than page atmosphere
- `rounded-[24px]`
- local `text-[10px]`, `text-[11px]`
- local gradient progress/fueling chrome unless documented as a visualization exception

### Guardrail

Do not change:

- workout flow
- tabs behavior
- Garmin flow
- progress logic
- result save semantics

## Slice 3: Calendar And Shell Cleanup

### Goal

Normalize the most repeated small-scale drift.

### Files

- `src/components/Calendar.tsx`
- `src/components/AppShell.tsx`

### Required Work

- migrate calendar micro-labels to canonical label roles
- migrate tooltip microtext and metric labels to canonical roles
- normalize shell profile text and menu metadata text
- remove local avatar or shell text recipes only when canonical roles can replace them cleanly

### Guardrail

Do not change calendar interaction, navigation, tooltip logic, or feedback-marker behavior.

## Slice 4: Auth And Login Cleanup

### Goal

Bring auth surfaces under the same foundations system.

### Files

- `src/components/AuthEntryScreen.tsx`
- `src/routes/login.tsx`

### Required Work

- replace local micro-label text with canonical roles
- replace route-local CTA button styling with canonical button classes
- decide whether auth glow elements are a documented premium exception or should be softened into DS-owned decoration
- ensure auth card padding and internal rhythm follow the new spacing contract

### Guardrail

Do not change auth form behavior, validation logic, or local bypass behavior.

## Slice 5: Settings, Onboarding, And Plan Import Cleanup

### Goal

Normalize the remaining form-heavy product surfaces.

### Files

- `src/routes/settings.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/UploadJsonDialog.tsx`
- `src/components/plan-management/PlanImportPanel.tsx`
- `src/components/onboarding/JsonImportPanel.tsx`

### Required Work

- align form labels, helper text, and feedback text to canonical roles
- migrate route-local radius values in avatar or selectors where possible
- map grid spacing and panel padding to canonical spacing primitives
- keep advanced JSON import secondary and calm

### Guardrail

Do not change onboarding data collection, import validation, or modal workflow behavior.

## Slice 6: Secondary Utility Cleanup

### Goal

Clean secondary surfaces after primary runner flows are aligned.

### Files

- `src/routes/changelog.tsx`

### Required Work

- remove route-local serif heading recipes
- replace glow and highlight recipes only if they can map cleanly to DS
- do not turn changelog styling into the canonical product baseline

## Exact Frontend Checklist

1. Add raw color primitives in `src/styles.css`.
2. Re-map semantic colors from primitives without breaking current public aliases.
3. Add explicit spacing primitives.
4. Add any needed `@theme inline` aliases for those primitives.
5. Re-document typography as family -> role.
6. Add a `Foundations` section to `/hitoDS`.
7. Add a `Spacing` section to `/hitoDS`.
8. Add guidance examples and anti-patterns to `/hitoDS`.
9. Migrate workout detail and completion panels.
10. Migrate calendar and shell micro-typography.
11. Migrate auth and login.
12. Migrate settings/onboarding/import surfaces.
13. Remove local legacy classes or inline styling only after replacement is complete.
14. Re-run focused checks after each slice.

## Delete / Keep Rules

### Delete

- local text sizes that duplicate DS roles
- local tracking values that duplicate DS roles
- local radius values that duplicate DS tokens
- local button recipes when canonical button classes already cover the case
- local informational surface chrome when canonical surface classes can replace it

### Keep

- visualization geometry
- chart-specific and interval-specific color geometry
- marker coordinates
- plotted line styling
- domain-specific visualization exceptions that do not define ordinary UI chrome

### Keep Temporarily With Removal Plan

- compatibility classes only if multiple surfaces still depend on them
- any temporary alias needed to keep rollout incremental

If a temporary compatibility class remains, document:

- owner
- reason
- current usages
- removal condition

## Required Validation After Each Slice

### Static Validation

- `npm run build`
- focused lint or typecheck path if available for the changed surface
- `git diff --check`

### Browser Validation

Visible UI QA must use Safari first.

After each cross-surface DS slice, QA must verify:

- layout
- typography hierarchy
- spacing rhythm
- hover/focus states
- modal behavior
- mobile bottom-nav coexistence where relevant

## QA Matrix

### Slice 1 Foundations

Check:

- `/hitoDS`
- no visible regression on `/`
- no visible regression on `/workout/$date`
- no visible regression on `/login`

Verify:

- foundations section renders correctly
- no missing colors
- no broken Tailwind alias usage

### Slice 2 Workout Detail

Check:

- `/workout/$date` overview
- `/workout/$date?tab=complete`
- `/workout/$date?tab=feedback`
- rest day and non-rest day

Verify:

- no behavior changes
- panel chrome remains calm and premium
- gradients or glows did not become louder
- spacing is more consistent
- tiny labels and metadata did not regress

### Slice 3 Calendar And Shell

Check:

- home `/`
- month calendar
- week strip
- shell nav
- profile dropdown

Verify:

- month cells still scan quickly
- feedback markers still read correctly
- shell profile row text hierarchy remains clear

### Slice 4 Auth And Login

Check:

- `/login`
- authenticated login route state

Verify:

- auth hierarchy still feels premium
- no focus/field regressions
- already-signed-in state still reads correctly

### Slice 5 Settings / Onboarding / Import

Check:

- `/settings`
- onboarding gate
- import dialogs and plan modal

Verify:

- sticky action areas still work
- modal footer/header remain reachable
- form helper/error/success text is consistent

## QA Prompt

Use this after Frontend completes a slice:

```md
You are QA.

Task:
Validate the Hito design-system cleanup slice that was just implemented.

Stage:
QA validation

Context:
The slice was intended to reduce local styling drift and align the product to canonical Hito DS foundations and primitives without changing product behavior.

Scope:
Review only the surfaces and files changed in the slice.

Requirements:
- use Safari for visible UI QA
- preserve existing product behavior and copy
- check typography hierarchy, spacing rhythm, surface chrome, focus states, and modal behavior
- call out any place where local styling drift still remains
- call out any place where the cleanup introduced visual regression, hierarchy loss, overflow, unreadable contrast, or broken interaction

Output format:
1. Task
2. Stage
3. Findings
4. System alignment
5. Regression risk
6. Required follow-up
7. Blockers
```

## Frontend Handoff Prompt

```md
You are FRONTEND.

Task:
Implement the Hito design-system foundations cleanup and rollout plan.

Stage:
FRONTEND implementation

Context:
Hito already has semantic/component DS coverage in `src/styles.css`, but lacks a clear raw foundations layer for color and spacing, and runner-facing screens still contain local gradients, text sizes, radius values, and spacing drift. Use `docs/tasks/frontend-specs/2026-05-20-hito-ds-foundations-cleanup-and-rollout-spec.md` as the canonical implementation brief.

Goal:
Define foundations first, expose them in `/hitoDS`, then migrate product surfaces slice by slice without changing product behavior.

Scope:
- `src/styles.css`
- `src/routes/hitoDS.tsx`
- then the migration files listed in the spec, in slice order

Requirements:
- preserve product behavior and copy
- do not redesign layouts
- prefer deletion over abstraction
- use existing Hito primitives first
- keep visualization geometry separate from ordinary component chrome
- update `/hitoDS` when canonical DS behavior changes
- remove local styling only after replacement is in place

Validation:
- run focused static checks after each slice
- inspect affected surfaces
- use Safari for visible UI verification when needed

Output format:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```
