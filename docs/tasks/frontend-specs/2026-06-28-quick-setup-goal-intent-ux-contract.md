# Quick Setup Goal Intent UX Contract

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

product

## Task

Preserve the accepted Quick setup goal-intent decision as historical context while current product,
system, and functional documentation remain canonical.

## Stage

closed / frontend implementation and generated-plan acceptance completed

## Exact Handoff Prompt

None. This contract is implemented and must not be imported or routed as active work.

## Original Problem

Quick setup once exposed goal fields before the runner had selected a coherent distance and could
send invalid combinations into preview. Direct outcome pace looked like executable workout truth,
and backend-shaped failure reasons could reach runner-facing copy.

## Accepted UX Decision

- Start with a runner-facing goal choice: 10K, Half Marathon, Marathon, or Custom.
- Treat preset choices as convenience inputs into `planGoalIntent.distanceMeters`, not separate
  backend plan families.
- Require a valid Custom distance before preview.
- Keep race day and finish time optional.
- Show finish-time-derived pace only as goal/readback context, never as an invented workout target.
- Block malformed local input before preview and use runner-facing error copy.
- Keep preview non-mutating and require explicit review and confirm before persistence.
- Preserve backend ownership of feasibility, normalization, review exactness, and persistence.

## Current Product Truth

All four visible goal choices use the same AI/local-fixture-authored distance-goal path:

`runner facts -> generated preview -> signed review -> explicit confirm -> canonical persistence`

Marathon is not a `Marathon Base` product family, and Custom is not an unsupported Advanced-setup
escape hatch. Current accepted plans preserve exact distance, optional target facts, AI-authored
workout structure, child-first repeats, canonical workout documents, and reviewed persistence.

Canonical current owners:

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Current functional map](../../current-functional-map.md)
- [Running-plan rebuild closeout](../../plans/active/2026-06-08-running-plan-creation-engine-rebuild.md)

## QA Boundary

Accepted generated-plan evidence includes:

- `qa-artifacts/screenshots/2026-06-28/quick-setup-all-goals-qa/`
- `qa-artifacts/screenshots/2026-07-06/generated-plan-early-phase-dosing-qa/`

Those artifacts cover the accepted goal variants and generated-plan readback. Later preview/loading
presentation work is owned by its own active frontend specification and does not reopen this
completed goal-intent contract.

## Historical Boundary

Earlier instructions that treated Marathon as `Marathon Base`, routed valid Custom goals away from
Quick setup, or described those limitations as current blockers are superseded. They are not
rollback guidance and must not be restored as current product truth.
