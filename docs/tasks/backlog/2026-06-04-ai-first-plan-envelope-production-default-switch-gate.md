# AI First-Plan Envelope Production Default Switch Gate

## Status

closed

## Type

change_request

## Priority

medium

## Next Recommended Role

product

## Task

Preserve the retired AI first-plan envelope experiment as history.

## Stage

ARCHITECT documentation closeout / superseded authoring path.

## Exact Handoff Prompt

None. The envelope/blueprint experiment was superseded by the accepted plan-first provider to
compiler pipeline; there is no current rollout decision to make.

## User Report

The completed envelope adoption plan remains historical evidence. Current product truth is the
AI-authored full-plan draft to compiler to signed review/confirm pipeline, with no envelope or
blueprint rollback path.

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
