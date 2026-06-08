# Additional Plan Preset Families

## Status

backlog

## Type

improvement

## Priority

medium

## Next Recommended Role

ARCHITECT / RUNNING COACH

## Task

Define and prioritize additional Plan Preset families after the initial three-card v1 release.

## Stage

ARCHITECT backlog / Plan Preset family expansion intake

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Define and prioritize additional Plan Preset families after the v1 Plan Preset release.

STAGE:
ARCHITECT backlog / Plan Preset family expansion intake

CONTEXT:
The completed v1 Plan Preset release supports backend-owned no-active-plan creation for:
- 10K Foundation
- Half Marathon Balanced
- Marathon Base

Future family expansion must not become frontend static cards or shallow templates. New families
must reuse backend-owned recipe, composition, metric-truth, review, and confirm seams and must pass
Running Coach doctrine before implementation.

SCOPE:
- identify candidate families by user level, distance, and intent
- decide which family is most valuable next
- define Running Coach doctrine and backend fixture requirements
- decide whether the current composition seam is enough or needs bounded cleanup

ROOT-CAUSE DISCIPLINE:
Do not add a card because the UI has space. Start from the coaching/product gap, then prove the
backend recipe can produce safe, rich, executable canonical rows without fake pace or HR truth.

DO NOT:
- do not implement recipes
- do not add frontend static cards
- do not add target-date preset behavior
- do not weaken existing Plan Preset contracts
- do not use OpenAI for preset happy path

OUTPUT:
1. Task
2. Stage
3. Candidate families
4. Recommended next family
5. Running Coach gate
6. Backend fixture requirements
7. What remains out of scope
8. Blockers
```

## Context

Plan Preset v1 shipped with three backend-backed families: `10K Foundation`,
`Half Marathon Balanced`, and `Marathon Base`.

Additional families should be considered only after a coaching/product need is clear.

## Acceptance

- Candidate families are evaluated by coaching safety, product value, and backend fixture cost.
- The next family is selected before backend implementation starts.
- Running Coach doctrine is required before implementation.
- Preset happy path remains deterministic and backend-owned.
- OpenAI remains out of the preset happy path.
