# Generated-Plan Setup State Convergence

## Work Item ID

2026-08-05-generated-plan-setup-state-convergence

## Status

completed

## Type

change_request

## Priority

medium

## Owner

frontend

## Frontend Lane

Product

## Scope

generated-plan-product-state

## Archive Intent

retain_in_place

## Task

Consolidate the duplicated generated-plan setup draft and reset state while preserving separate
first-plan and active-plan replacement lifecycles.

## Stage

Frontend Product implementation and integrated QA completed.

## Parent

[Hito Stack Complexity Reduction Program](./2026-08-04-hito-stack-complexity-reduction-program.md)

## Demonstrated Root Cause

First-plan onboarding and active-plan replacement independently instantiate the same generated-plan
setup draft, setter bundle, custom-goal reset rule, and baseline reset behavior before handing that
same state to the shared form and preview-controller seams.

## Intended Outcome

One Product-owned generated-plan setup state/view-model supplies the equivalent form state while
first-plan confirmation and active-plan replacement transition lifecycles remain separate.

## Boundaries

Do not merge review/confirm semantics, active-plan replacement truth, manual-plan creation, preview
request cancellation, backend contracts, or shared Design System primitives.

## Closure Receipt

- `useGeneratedPlanSetupState` now owns only the equivalent setup draft, setter bundle, custom-goal
  clearing rule, and reset operation. Onboarding and active-plan replacement retain separate preview,
  confirm, cancellation, error, and persistence lifecycles.
- Removed the unused `StructuredConstructorState.targetDate` declaration after a repository
  reachability scan found no property consumer.
- The pre-fix replacement-dialog close returned focus to `body`; `AppShell` now records the invoking
  desktop or mobile Current Plan control and restores focus only after that Product dialog closes.
- Fixture browser replay covered replacement review, invalidation after a relevant input change,
  desktop and exact 375px containment, Tab/Shift+Tab containment, and focus return. Targeted lint,
  build, build-integrity, runtime health, and independent read-only QA passed.

## Lifecycle

completed
