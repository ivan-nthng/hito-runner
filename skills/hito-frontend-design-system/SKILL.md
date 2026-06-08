---
name: hito-frontend-design-system
description: Use for Hito frontend work touching UI layout, components, dialogs, forms, typography, spacing, tabs, shell, onboarding, settings, admin, workout detail, or any design-system consistency question.
---

# Hito Frontend Design System

## Purpose

Build UI from Hito DS primitives and backend-shaped truth instead of adding local drift.

## Required Reading

1. `docs/current-system.md`
2. `docs/current-product.md`
3. relevant active plan/spec
4. `src/routes/hitoDS.tsx` when design-system behavior is relevant
5. nearby components/surfaces before creating new UI

## Workflow

1. Inspect existing Hito DS roles/classes/components before implementing.
2. Reuse shared primitives for:
   - buttons
   - fields
   - tabs
   - dialog/modal structure
   - status pills
   - surfaces/dividers
   - typography roles
   - spacing rhythm
3. Keep frontend logic presentational unless the plan explicitly assigns client-side draft state.
4. Render backend-shaped data; do not compute canonical business truth locally.
5. Handle loading, empty, error, success, disabled, and destructive confirmation states.
6. Verify mobile width and Safari-sensitive controls when relevant.

## Designer Spec Depth Gate

- If a Designer task is large, multi-state, cross-surface, visually nuanced, or would require a long
  handoff prompt, create or update a detailed Markdown plan/spec before Frontend implementation.
- Prefer `docs/tasks/frontend-specs/` for implementation-ready UI specs; use an active plan only
  when the work is multi-slice, risky, or cross-role.
- Do not compress complex design direction into a short chat answer. The document should be detailed
  enough that Frontend can implement without inventing layout, state, or copy behavior.
- Include user flow, screen anatomy, component/state inventory, Hito DS primitives to reuse,
  backend-shaped view-model expectations, responsive/mobile behavior, empty/loading/error/review
  states, edge cases, acceptance criteria, and validation expectations.
- The more complex the feature, the more explicit the spec should be. Detail is preferred over
  ambiguity when it prevents frontend guessing or route-local drift.

## Root-Cause Frontend Fix Gate

- Frontend bug fixes must start by naming the failing source-of-truth boundary: backend-shaped data,
  route loader state, form serialization, async lifecycle, component state, Hito DS primitive
  behavior, CSS/layout, copy source, or browser interaction.
- Do not patch only the visible symptom. Trace upstream to the first incorrect owner and fix that
  owner when the slice can safely cover it.
- If the same bug can still occur through a sibling route, reused component, shared primitive,
  viewport, or backend-shaped view model, the fix is not done.
- If the real problem is duplicated frontend truth, route-local custom UI, copied status mapping, or
  a missing Hito DS primitive/variant, prefer bounded consolidation or explicit escalation over a
  local workaround.
- If the systemic fix is too large for the current slice, report it explicitly with a proposed owner
  and do not present the symptom patch as the complete solution.
- Final reports must state the root cause, reused DS/admin/product primitive or backend-shaped
  contract, and whether any broader follow-up remains.

## Hard Hito DS Reuse Gate

- Hito DS and existing product/admin primitives are the default for every visible UI change.
- Before adding any component, wrapper, hook, class recipe, arbitrary token, variant, or interaction pattern, search `/hitoDS`, `src/routes/hitoDS.tsx`, `src/components/ui/*`, and nearby route/component code for an existing equivalent.
- If an existing primitive can cover the job, use it. Do not create a custom alternative.
- If no existing primitive can cover the job, stop and propose the new primitive/pattern first. Include why existing Hito DS/admin primitives are insufficient and where the new primitive would be reused.
- Do not implement a new UI kit, local control family, or route-specific visual language without explicit Architect/Designer approval.
- When refactoring a surface to DS, delete the replaced local styling/components whenever safe; do not leave old UI paths behind.

## Minimal Diff And Reuse Rule

- For copy-only or token-only requests, change only the requested copy/token unless a real bug blocks it.
- Before adding a component, hook, helper, or local style, search for an existing equivalent and reuse it.
- If the requested change should be one or two lines, do not turn it into a refactor.
- If implementation appears likely to touch many files, add a new abstraction, or produce a large diff for a small request, stop and get explicit confirmation first.
- Consolidate repeated UI patterns only when repetition is proven by nearby code; do not create generic components speculatively.
- Prefer deleting route-local drift and wiring to existing DS primitives over adding new wrapper layers.
- In the final report, call out when the diff stayed intentionally minimal or when a larger diff was unavoidable.

## Large Route And Component Decomposition Gate

- Before adding substantial UI logic, check whether the target route/component is already large or mixed-responsibility.
- If a file is roughly 700+ lines and the change adds a new responsibility, either extract a focused component/hook/view helper or explicitly justify why that file remains the correct owner.
- Files around 1000+ lines should not receive new responsibility without an architecture reason in the plan or final report.
- Files around 1500+ lines are active decomposition candidates unless they are generated, fixture-only, or intentionally consolidated documentation.
- Extract by stable frontend responsibility: route orchestration, presentational component, dialog/panel section, form state, formatting/readback helper, or DS-backed repeated anatomy.
- Keep frontend extraction DS-first: extracted components must reuse existing Hito DS/admin primitives and must not become a new local UI kit.
- Do not split by arbitrary line count, and do not combine broad decomposition with redesign unless the active plan explicitly scopes both.

## Do Not

- add route-local color/typography/spacing recipes when Hito DS covers the need
- introduce a component family for one feature
- redesign a surface during a behavior-preserving slice
- make UI-only checks the authority for auth, admin, entitlement, lifecycle, or scheduling rules
- ship custom admin/product UI when an existing Hito DS primitive or wrapper can do the job
- hide a new component behind "temporary" without a removal plan
- leave abandoned local components, classes, or wrappers after changing approach

## Validation

After meaningful frontend changes:

- run relevant static checks/build if product code changed
- use the built-in browser for local visual verification when practical
- hand off to Safari QA for final browser verification when the task is user-facing or Safari-sensitive

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
