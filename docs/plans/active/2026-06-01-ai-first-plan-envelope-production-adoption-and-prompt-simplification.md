# AI First-Plan Envelope Production Adoption And Prompt Simplification

## Status

not_started

## Type

plan

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Plan production adoption for `ai-first-plan-envelope-v1` and first-plan prompt/output simplification.

## Stage

ARCHITECT plan / AI contract adoption

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan production adoption for `ai-first-plan-envelope-v1` and first-plan prompt/output simplification.

STAGE:
ARCHITECT plan / AI contract adoption

CONTEXT:
- Source path: docs/plans/active/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md
- The completed production blueprint wave is archived at docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md.
- Production first-plan generation still uses `ai-first-plan-blueprint-v1`.
- `ai-first-plan-envelope-v1` exists as a non-live foundation only.
- The goal is to reduce prompt/output fragility and move more row/slot interpretation to backend-owned expansion.

GOAL:
Define whether, when, and how `ai-first-plan-envelope-v1` should replace or sit beside the row-level blueprint path in production.

REQUIREMENTS:
- Compare current `ai-first-plan-blueprint-v1` production behavior with the non-live envelope foundation.
- Preserve review/confirm, persistence, metric gates, fixed rest days, long-run day, recovery-first sequencing, and failure boundaries.
- Define feature flag or explicit backend option strategy before any default switch.
- Define QA and Running Coach gates before production adoption.
- Do not implement code in this architecture pass.

OUTPUT:
1. Task
2. Stage
3. Current state
4. Options considered
5. Recommendation
6. Proposed slices
7. Validation strategy
8. Blockers
```

## Owner

ARCHITECT / BACKEND / QA / RUNNING COACH

## Last Updated

2026-06-01

## Context

The production blueprint first-plan wave is complete and archived. That wave proved the row-level
`ai-first-plan-blueprint-v1` path can generate, review, confirm, persist, and render safe first
plans with stronger coaching richness.

The non-live `ai-first-plan-envelope-v1` foundation also exists, but it was explicitly not adopted
for production. Envelope adoption is a separate architecture decision because it changes the AI
contract shape and prompt/output strategy.

## Problem Definition

The current production blueprint path is reliable enough to archive the completed wave, but it still
has architectural pressure:

- row-level blueprint requests can remain verbose
- long-horizon generation still uses a bounded AI window plus backend extension
- future prompt/output simplification should not be mixed with already QA-green production blueprint
  behavior
- envelope adoption could improve reliability, but it must not regress coaching richness or safety

## Scope

- production adoption planning for `ai-first-plan-envelope-v1`
- prompt/output simplification
- migration from row-level blueprint where safe
- side-by-side or feature-flag strategy
- debug/trace readability for compact envelope output
- QA and Running Coach acceptance gates

## Non-Goals

- no production switch without QA gates
- no persistence or schema changes unless a later implementation slice proves they are required
- no frontend changes in the architecture decision slice
- no weakening of `ai-first-plan-blueprint-v1` safety or fallback behavior
- no deletion of the production blueprint path until envelope replacement is proven

## Suggested Slice Order

1. ARCHITECT decision: choose side-by-side, flag, or replacement strategy.
2. BACKEND implementation: wire envelope behind an explicit non-default backend option.
3. QA validation: compare envelope and blueprint behavior on first-plan fixtures.
4. RUNNING COACH review: judge coach quality against saved-mode calendar/detail evidence.
5. ARCHITECT rollout decision: decide whether to promote or keep as experimental.

## QA Expectations

- invalid/timeout/partial envelope output must remain non-mutating
- no `structured_authoring_v1` success fallback leak
- reviewed draft must persist exactly after confirm
- fixed rest days, preferred long-run day, recovery-first sequencing, metric gates, and rich fields
  must stay intact
- debug artifacts must show human-readable decoded envelope intent without raw prompts or secrets

## Exit Criteria

- production adoption strategy is documented
- implementation slices and QA gates are defined
- no production switch is implied until the gates pass

## Suggested Next Step

Run the ARCHITECT decision pass described in the handoff prompt.
