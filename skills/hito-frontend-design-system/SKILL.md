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

## Minimal Diff And Reuse Rule

- For copy-only or token-only requests, change only the requested copy/token unless a real bug blocks it.
- Before adding a component, hook, helper, or local style, search for an existing equivalent and reuse it.
- If the requested change should be one or two lines, do not turn it into a refactor.
- If implementation appears likely to touch many files, add a new abstraction, or produce a large diff for a small request, stop and get explicit confirmation first.
- Consolidate repeated UI patterns only when repetition is proven by nearby code; do not create generic components speculatively.
- Prefer deleting route-local drift and wiring to existing DS primitives over adding new wrapper layers.
- In the final report, call out when the diff stayed intentionally minimal or when a larger diff was unavoidable.

## Do Not

- add route-local color/typography/spacing recipes when Hito DS covers the need
- introduce a component family for one feature
- redesign a surface during a behavior-preserving slice
- make UI-only checks the authority for auth, admin, entitlement, lifecycle, or scheduling rules

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
