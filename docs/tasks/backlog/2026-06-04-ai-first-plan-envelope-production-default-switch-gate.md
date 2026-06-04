# AI First-Plan Envelope Production Default Switch Gate

## Status

backlog

## Type

change_request

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Create a separate architecture plan only if Hito decides to evaluate `ai-first-plan-envelope-v1` beyond internal non-default use.

## Stage

ARCHITECT backlog / future envelope rollout gate

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Create a separate architecture plan for evaluating `ai-first-plan-envelope-v1` beyond internal non-default use.

STAGE:
ARCHITECT plan / envelope selected rollout or production-default switch gate

CONTEXT:
- Source backlog item: docs/tasks/backlog/2026-06-04-ai-first-plan-envelope-production-default-switch-gate.md
- Archived completed plan: docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md
- The completed plan proved an internal/server-owned non-default envelope structured-draft option.
- QA proved no mutation before confirm and exact reviewed-plan persistence after explicit confirm on disposable local persistence seams.
- Production first-plan generation remains `ai-first-plan-blueprint-v1`.
- No runner-facing envelope option, frontend change, DB/schema change, active-plan refresh change, or default switch has been approved.

GOAL:
Decide whether Hito should evaluate envelope beyond internal/backend use, and if yes define one bounded rollout plan with explicit gates.

SCOPE TO ASSESS:
- selected low-risk internal pilot
- controlled non-default production/internal flag
- production default switch readiness
- rollback to blueprint
- QA gates
- Running Coach gates
- debug/trace requirements
- source metadata and persistence boundaries

WHAT NOT TO DO:
- Do not implement code in this architecture pass.
- Do not make envelope the production default.
- Do not expose a runner-facing option.
- Do not change frontend, DB/schema, active-plan refresh, or public onboarding.
- Do not delete or weaken `ai-first-plan-blueprint-v1`.
- Do not persist raw prompts or full AI payloads.
- Do not reintroduce `structured_authoring_v1` as successful first-plan truth.

OUTPUT:
1. Task
2. Stage
3. Current envelope status
4. Decision options
5. Recommendation
6. Scope approved, if any
7. Rollout and rollback gates
8. QA gate
9. Running Coach gate
10. Blockers
```

## User Report

The completed envelope adoption plan intentionally stopped after proving an internal non-default
structured-draft option with review/confirm exactness. Any future production/default switch is a
different risk class and should not be smuggled into that completed plan.

## Evidence

- Archived completed plan:
  `docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`
- Production default remains `ai-first-plan-blueprint-v1`.
- Internal envelope option is available only through backend/server-owned explicit use.
- QA Slice 5 proved exact reviewed-plan persistence for disposable local envelope confirm.

## Expected Behavior

If product wants envelope beyond internal/backend use, create a new active architecture plan with
explicit rollout and rollback gates. Until then, no production switch or runner-facing exposure is
approved.

## Source Investigation

Start from:

- `docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`
- `src/lib/ai-first-plan-draft-service.ts`
- `src/lib/first-plan-actions.ts`
- `src/lib/ai-first-plan-envelope-*`
- `src/lib/ai-first-plan-blueprint-*`
- `scripts/author-ai-first-plan-draft.ts`
- `scripts/validate-plan-authoring-doctrine.ts`

## Likely Root Cause

Envelope adoption is strategically promising, but moving from internal exactness proof to selected
rollout or production default changes the risk class. That decision needs its own plan rather than
remaining hidden inside the completed internal-option plan.

## What Not To Touch

- Do not reopen the archived internal-option plan.
- Do not change product code from this backlog item.
- Do not expose envelope to runners without a separate approved plan.
- Do not weaken the blueprint default or rollback route.

## Blockers

None.
