# Hito DS Product Control Adoption

## Work Item ID

2026-08-04-hito-ds-product-control-adoption

## Status

completed

## Type

change_request

## Priority

high

## Owner

frontend

## Frontend Lane

product

## Scope

design-system-and-runner-experience

## Batch

hito-ds-product-control-adoption

## Archive Intent

retain_in_place

## Task

Complete the accepted shared Hito Button, Field, and Choice adoption across all remaining in-scope
runner-facing Product consumers. The Frontend owner works through bounded internal migration slices
without user relay, replacing route-level manual control recipes only when the canonical shared
primitive is the demonstrated owner and preserving each route's data lifecycle, behavior,
accessibility, layout composition, and visual language.

## Stage

Frontend Product implementation and owner-level independent QA are complete. The accepted
onboarding/review and Settings slices are joined by the remaining shell, calendar command,
workout-completion, Progress, plan-management, import, integration, and manual-workout consumers.
Shared primitives, tokens, Calendar compatibility, DevTools, Backend, and fixture ownership remain
unchanged. Global QA Acceptance remains separate and pending.

## Parent Evidence

- [Hito DS Component Contract Simplification](2026-08-04-hito-ds-component-contract-simplification.md)
  established the shared typed Button, Field, and Choice APIs and retained the Calendar CVA/shadcn
  Button boundary.
- Post-DS local integration QA passed: `/hitoDS`, Local Inspector, `/settings`, and public login
  remained functional at desktop and exact 375px in both themes.

## Root Cause

The shared contract is now canonical, but some Product routes still assemble Button, Field, and
Choice appearance from manual class recipes. That leaves duplicated configuration at the consumer
layer and permits the old distributed contract to return even though the shared owner is simplified.

## Required Outcome

- Migrate Product consumers in small, family-bounded slices: Button first, then Field, then Choice.
- Complete the remaining admitted consumers autonomously inside this one work item; do not return to
  Product after each ordinary internal slice.
- Use accepted shared primitives and typed inputs; retain route-owned width, grid, wrapping, and
  responsive composition where those describe placement rather than control chrome.
- Remove a manual recipe only after its consumer behavior and replacement are proven.
- Keep every result reusable through canonical tokens -> shared primitives -> Product consumers;
  no route-local component clone or compatibility styling may become a second public path.

## Accepted Slice: Onboarding And Review

The first admitted Product slice migrated six runner-facing onboarding/review files to `HitoButton`,
`Input`, and `HitoChoiceToggle`. It retained the specialized calendar Popover disclosure because its
calendar geometry and ARIA contract make it a distinct disclosure control rather than a command
Button.

Owner-level browser and independent QA evidence passed for desktop and exact 375px in light/dark,
keyboard and ARIA behavior, loading/disabled states, generated-plan form/review controls, build and
integrity. The prepared-preview Dialog's ready/loading lifecycle was not opened at runtime because
that would require a fixture-generation lifecycle; source, shared-contract, and build coverage prove
its adopted command controls only. This limitation does not claim broader preview acceptance.

## Accepted Slice: Settings

The next admitted Product slice migrated runner-facing `/settings` command actions and ordinary
identity fields to `HitoButton` and `Input`; existing training/theme selection continues to use the
typed Choice contract. `useHitoTabs`, the hidden avatar file input, `EditableValueField`, and HR
range controls remain intentionally specialized because they own behavior beyond ordinary command,
field, or choice chrome.

The complete Settings persistence and browser matrix passed in light/dark at desktop and exact 375px,
including tabs, readonly email semantics, focus/keyboard behavior, responsive containment, build,
and independent QA. Avatar upload was not replayed because its lifecycle was unchanged; the retained
hidden-input/ref contract was source-verified. This slice does not claim avatar-upload acceptance.

## Preserved Boundaries

- Do not change primitive or semantic token values, typography role meaning, theme architecture,
  workout taxonomy, Calendar CVA/shadcn Button compatibility, Product copy, persistence, auth,
  provider behavior, generated-plan lifecycle, Backend contracts, schema, migrations, package graph,
  Local Inspector, or fixture ownership.
- Do not migrate all routes in one unreviewed diff. The owner may complete the whole task, but must
  use sequential internal slices and retain source, browser, accessibility, responsive, and
  independent QA evidence for each migration family before moving forward.
- Do not modify active concurrent Backend files or contact an active Backend role.

## Definition Of Done

All remaining in-scope ordinary Product Button, Field, and Choice recipes are either migrated to the
shared primitive or explicitly retained as specialized controls with source-backed ownership. Route
behavior and data truth remain unchanged; normal and narrow layouts remain readable; keyboard, focus,
ARIA, disabled/loading/invalid states remain truthful; removed recipes have zero consumers; and every
internal slice has independent QA plus the final consolidated build/integrity evidence. Full release
acceptance remains separate.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Frontend lane: Product

Task:
Complete the accepted Hito DS Product control adoption across all remaining in-scope runner-facing
Product consumers.

Stage:
FRONTEND Product implementation with integrated independent QA, continuing after the accepted
onboarding/review and Settings slices.

Canonical task:
docs/tasks/backlog/2026-08-04-hito-ds-product-control-adoption.md

Parent evidence:
The shared Design System contracts and bounded post-DS integration QA have passed. The shared owner
is complete; this task must consume those contracts rather than redesigning or reimplementing them.

Required outcome:
- Refresh the current consumer matrix, classify every remaining ordinary route-level manual control
  owner, and retain only source-backed specialized controls.
- Complete the remaining admitted Product adoption through the accepted shared Button, Field, and
  Choice contracts.
- Preserve product behavior, persistence, accessibility, theme semantics, responsive composition,
  and all route-owned layout.
- Remove superseded manual recipes only after replacement and zero-consumer proof.
- Work through bounded internal slices with appropriate subagents and independent QA. Do not return
  after each ordinary slice; complete the full fix-forward loop before reporting back.

Boundaries:
- Do not modify Hito token values, shared primitive APIs, Calendar CVA/shadcn Button compatibility,
  DevTools, Backend contracts, auth, fixtures, schema, migrations, package dependencies, providers,
  hosted services, staging, commits, pushes, or deployment.
- Do not contact or interrupt an active Backend role. Preserve concurrent work byte-for-byte.
- Use up to six active, non-nested subagents total. Include one bounded independent QA reviewer;
  use other roles only for distinct read-only evidence within their idle availability.
- Do not create route-local compatibility recipes, raw control chrome, or a second component API.

Definition of Done:
All remaining in-scope ordinary Product control recipes render the accepted shared primitive or have
a source-backed specialized-control exception. Behavior and backend-shaped truth are unchanged;
desktop and exact 375px light/dark, keyboard/focus/ARIA and relevant control states pass; superseded
manual recipes have zero consumers; targeted checks, final build/integrity, and independent QA pass.
Return only when the full task is complete or a concrete cross-owner Product decision is required.

Approval policy:
Routine local inspection, implementation, fixture QA, build/runtime control, and validation proceed
under standing authorization. Do not request routine approval; exhaust safe local alternatives first.
```

## Current Boundary

All admitted runner-facing Product consumers now use the accepted shared Button, Field, and Choice
contracts. Retained controls are source-backed specialized owners: tabs, hidden file/transport
inputs, lifecycle checkboxes, shared Select and mobile picker triggers, whole-row
navigation/disclosure/selection, workout-structure controls, and protected Calendar geometry.
Owner-level desktop and exact 375px light/dark QA, keyboard/focus/ARIA, overflow, static checks,
fresh build, integrity, runtime health, provider isolation, and diff hygiene passed. Global QA
Acceptance remains pending.
