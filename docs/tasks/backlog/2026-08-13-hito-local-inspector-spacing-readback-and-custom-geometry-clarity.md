# Hito Local Inspector Spacing Readback And Custom Geometry Clarity

## Work Item ID

2026-08-13-hito-local-inspector-spacing-readback-and-custom-geometry-clarity

## Status

ready

## Type

Tracked — Local Inspector spacing presentation and explicit custom-request contract

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Frontend Lane

DevTools

## Scope

Make Local Inspector's spacing controls unambiguous and capable of expressing a deliberate
non-token geometry request without falsely presenting it as a Hito token. This is a user-facing
DevTools contract only: it never applies live CSS, changes the Hito spacing scale, creates a token,
or changes a Product/DS component by itself.

## Archive Intent

retain_in_place

## Task

Unify the human-facing Inspector representation of Hito spacing options. The observed/current tag,
pending choice, menu option, and accessible name must use the same compact form:
`4 · --space-1`, `8 · --space-2`, `12 · --space-3`, and so on. Do not mix `8px` chips with bare
`8` menu entries. In this user-facing Inspector UI, omit the `px` suffix; the token name gives the
canonical meaning.

Add an explicit, bounded way to request a **custom pixel value** such as `2` when the desired value
has no canonical spacing token. The UI and generated Inspector payload must call it `Custom 2`,
record that it is non-token geometry, and never map it to a nearest token or add a global token. A
custom request is a draft instruction only; it must not mutate live DOM/CSS or imply that custom
values are preferred over canonical tokens.

Make the Inspector's information hierarchy readable without changing its font family or adding a
new typography role. **Observed properties**, **Comment**, and **Scope of fix** are section labels,
not peer property labels: retain their current font/size family but increase their existing weight
using the established typography utilities so they clearly separate groups.

Make the selected-target **Text** editor compact by default. It must occupy the value column on
the same visual row as the Text label and carry the same visual mass as the other small value
controls, instead of reserving a large two-row field. A long value may expand or wrap to a second
line when necessary; it must not lose text, obscure the clear action, create horizontal overflow,
or change the current edit/clear/prompt contract.

## User Report

- On the Local Inspector, current values show `8px`, `4px`, etc., but spacing dropdown entries show
  `4 · --space-1`, `8 · --space-2`, `12 · --space-3` without the same unit treatment.
- Ivan cannot tell whether the numbers mean pixels or scale steps and asked for a single clear
  representation. His decision: remove the `px` suffix from user-facing Inspector value controls.
- Ivan also asked what to do when he intentionally needs 2px. He confirmed it should remain custom,
  not become a new global token.
- On the same Inspector composer, **Observed properties**, **Comment**, and **Scope of fix** blend
  into ordinary property labels. The target Text textarea is always tall and visually dominates the
  panel even for short values such as `/progress`.

## Source Facts And Required Discriminator

- `src/components/devtools/local-ui-inspector-targets.ts` owns option construction and currently
  sets spacing/radius `displayValue` via `formatCompactPx(...)`.
- `src/components/devtools/LocalUiTokenControls.tsx` appends `px` in current/desired tooltips and
  delegates option rendering to existing shared Inspector property primitives.
- `src/components/devtools/LocalUiTaskDraftPanel.tsx` owns the three section labels, while
  `src/components/devtools/LocalUiTextControlRow.tsx` owns the target Text textarea. The textarea
  currently has `rows={2}` and `min-h-14`, which proves the oversized short-text presentation.
- Current desired-token state is string-token based. A custom desired value therefore needs one
  deliberate existing-state extension or a proven equivalent in the existing Draft/selection/payload
  seams. The executor must establish the smallest source-backed representation before writing; do
  not invent persistence or a second custom-value model.

## What Not To Touch

- `src/styles/foundations.css`, Hito `--space-*` declarations, spacing manifests, component CSS,
  product layout, generated prompts other than the task-owned custom-spacing evidence, Inspector
  availability/persistence beyond the current local draft, Figma, hosted state, or Git lifecycle.
- Radius labels except where an existing shared formatter is proven to require the identical
  presentation correction. Do not re-open the in-progress Radius reconciliation without evidence.
- Raw value application, a live style editor, automatic nearest-token substitution, or a global 2px
  design token.
- Comment semantics, Scope options, text persistence/draft payload shape, native textarea editing,
  clear-button focus restoration, or any product surface.

## Required Preflight And Definition Of Done

Before source changes, prove the narrowest existing local draft/selection/payload seam that can
represent `token` versus `custom pixel` without persistence or live mutation. Then:

1. Every visible spacing current value and choice uses the same no-unit numeric/token form; e.g.
   `4 · --space-1`, not a mix of `4px` and `4`.
2. Existing canonical choices preserve exact values and token IDs.
3. A user can intentionally choose/enter `Custom 2`; its UI readback and generated task payload
   explicitly say custom/non-token and retain the numeric value.
4. A current computed 2px value is never falsely recognised as a token or a nearest token.
5. Radius, color, typography, local Inspector gating, and product styling remain unchanged unless a
   shared formatting seam proves a necessary identical presentation-only change.
6. Observed properties, Comment, and Scope of fix retain their current font family/size but have
   enough established-weight emphasis to read as section labels.
7. A short target Text value is compact and baseline-aligned with its label; a long value can use a
   second line without clipping, overlap, reflow surprise, lost clear control, or horizontal
   overflow.

## Validation Expectations

- Source/unit coverage for every canonical spacing option and custom `2` draft/payload state.
- Loopback Inspector replay for canonical 4/8/12 values plus a 2px custom request; keyboard,
  clear/revert, accessible names, generated prompt readback, no live style mutation, and console.
- Short and long target-text replay: one-row default geometry, controlled two-line handling, clear
  action/focus restoration, edit payload, 375×812 containment, and no collision with section labels.
- Focused Prettier, ESLint, relevant local Inspector validation, and `git diff --check`.
- Fresh managed runtime/browser proof only when no other owner controls shared runtime lifecycle.

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito Local Inspector Spacing Readback And Custom Geometry Clarity
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-13-hito-local-inspector-spacing-readback-and-custom-geometry-clarity.md

Product routing decision: Ivan explicitly assigned this bounded DevTools UI seam to DESIGN SYSTEM
as a cross-lane exception. Read AGENTS.md, agents/design-system.agent.md, and
skills/hito-frontend-design-system/SKILL.md. Do not begin until your current active task reaches a
terminal handoff; then re-check task identity, dirty files, and runtime ownership.

Correct the Inspector's confusing spacing presentation: user-facing current values and dropdown
choices must share one numeric-plus-token format with no px suffix, for example
`4 · --space-1`, `8 · --space-2`, `12 · --space-3`. Preserve the canonical values/token IDs.

Ivan also needs to express a deliberate non-token request such as 2px. First prove the smallest
existing local draft/selection/payload seam. Add a bounded Custom 2 request path only if it can
remain local draft data, explicitly marked custom/non-token, and cannot mutate live CSS/DOM or
persistence. It must never silently choose a nearest token or add --space-0.5/global 2px token.
Do not change foundations, component CSS, Product layouts, Inspector availability, or unrelated
radius/color/typography behavior.

Also repair this task-owned composer hierarchy. Retain the current font family and size of Observed
properties, Comment, and Scope of fix, but use an existing weight utility so they read as section
labels rather than ordinary property labels. Replace the always-tall target Text textarea
presentation with a compact value-column editor aligned to the Text label for short values. Permit
only controlled second-line expansion/wrapping for long content; preserve native text editing,
clear/focus behavior, exact draft/prompt text, containment, and accessibility. Do not change the
Comment textarea or Scope semantics.

Validate canonical options, Custom 2 readback/payload, keyboard, clear/revert, accessible labels,
no live mutation, section hierarchy, short/long target text editing, and clear focus restoration.
Use a fresh managed artifact only after current runtime ownership is released. Run focused
formatting, lint, Inspector coverage, and diff hygiene. Record an English tracked receipt with exact
custom-state representation, files changed, and any remaining boundary. Do not stage, commit,
deploy, or claim Global QA.
```
