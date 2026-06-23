# AI First-Plan Envelope Production Adoption And Prompt Simplification

## Status

archived

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Preserve the internal non-default `ai-first-plan-envelope-v1` decision without treating it as a production switch.

## Stage

ARCHITECT archived-plan reference / compressed AI envelope history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Create a separate future plan only if Hito is ready to evaluate `ai-first-plan-envelope-v1` beyond internal non-default use.

Stage:
ARCHITECT future planning / envelope production-default switch gate.

Context:
This artifact is archived history. The approved state is internal/server-owned non-default `ai-first-plan-envelope-v1` support only. Production first-plan generation remains `ai-first-plan-blueprint-v1`.
```

## Owner

ARCHITECT / BACKEND / QA / RUNNING COACH

## Last Updated

2026-06-04

## Archive Note

This plan is complete and archived. It proved envelope as an internal option but did not approve production default use, runner-facing exposure, DB/schema changes, active-plan refresh changes, frontend changes, or blueprint deletion.

## Final Outcome

The production blueprint wave remained the default. The envelope path was validated as an internal/server-owned structured-draft option with exact review/confirm behavior, but it stayed hidden from runners.

## Key Decisions

- `ai-first-plan-blueprint-v1` remains production/default first-plan generation.
- `ai-first-plan-envelope-v1` is an internal non-default option only.
- No runner-facing selector or public onboarding switch was approved.
- No raw prompts or full AI payloads should be persisted.
- Rollback path remains blueprint.
- Any production/default switch requires a new active plan, rollback gate, QA gate, and Running Coach gate.

## Validation Evidence

Archived evidence recorded backend proof, review/confirm exactness QA on disposable local persistence seams, running-coach gate review, and rollback constraints. Detailed prompt chains and slice logs were compressed because the current approved boundary is the important preserved truth.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not switch production default away from blueprint, expose envelope to runners, change frontend, DB/schema, active-plan refresh, public onboarding, or persisted schema from this archive. Create a new active plan for any future envelope rollout.
