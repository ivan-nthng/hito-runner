# Hito Runner Calendar Mutation Owner Extraction

Work Item ID: `2026-08-21-hito-runner-calendar-mutation-owner-extraction`
Status: ready
Type: Maintenance
Priority: highest
Owner: BACKEND
Epic: platform-and-operations
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Runner Calendar Query Owner Extraction](./2026-08-18-hito-runner-calendar-query-owner-extraction.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md)

## Scope

Make the Runner Calendar the sole owner of its atomic workout mutations. Move only the demonstrated
Calendar mutation contract out of `active-plan-lifecycle-persistence.ts` and
`active-plan-workout-editing/` into the distinct Calendar owner. This is Phase 2B of the accepted
modular-monolith transformation.

## Archive Intent

Retain the consumer map, deletion proof, and persistence receipt as the Phase-2B evidence for the
finite HITO-218 domain-isolation outcome.

## Task

Move `applyAtomicCalendarWorkoutMutation`, `applyAtomicCalendarWorkoutContentEdit`, and
`clearAtomicCalendarFutureWorkouts` into `src/lib/runner-calendar-mutations.ts`. Move only their
Calendar constants, event payload, editability, root-provenance readback, and source-capability
decision after the direct consumer map proves the ownership boundary.

`applyAtomicReviewedPlanPersistence` and `applyAtomicReviewedFutureSchedulePersistence` remain
with source materialisation. Source provenance is an immutable input to Calendar policy; a Calendar
operation must not consult a plan for current permission, visibility, or lifecycle.

## Accepted Constraints

- Reuse the accepted `WorkoutDocument`, Calendar query owner, atomic RPCs, evidence protection,
  stored-Rest displacement, audit/Undo, and source-provenance contracts.
- The new mutation module is admitted only because it owns a distinct, cohesive Calendar command
  responsibility. It is not a facade and must not re-export legacy ownership.
- Remove moved public exports from their legacy owner in the same slice once direct imports are
  zero. Do not add aliases, compatibility state, another DTO, a table, migration, RPC rename, or
  plan container.
- Do not change Frontend, Design System, templates, AI/file providers, results/FIT/history,
  database schema/RLS, hosted state, or release/Git state.

## Source Investigation

The accepted Phase 2A proof establishes one Calendar query/context owner in
`runner-calendar-persistence.ts`; its direct consumers and the source-provenance prerequisite are
already cycle-free. The next accepted serial seam is the three Calendar mutations still physically
mixed with reviewed-source materialisation. No behavior change or new persistence shape is
admitted.

## Required Discriminator Before Write

BACKEND must enumerate every direct production and focused-proof consumer of the three mutation
operations and their required policy inputs. Stop if a caller requires source materialisation,
unadmitted persistence behavior, a second production owner, or a compatibility adapter.

## Validation Expectations

Prove sole operation ownership and zero legacy imports; exact command input/result behavior;
atomic success/failure; stale, collision, ownership, and evidence protection; empty/Rest/occupied
Move plus durable Undo; source immutability; reload; disposable cleanup; focused TypeScript;
Prettier; and diff hygiene. Browser, Global QA, hosted, release, deployment, and provider proof are
out of scope unless the implementation demonstrably changes their contract.

## Stage

Phase 2B — Calendar mutation owner extraction

## Next Recommended Role

BACKEND

## Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Runner Calendar Mutation Owner Extraction
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-21-hito-runner-calendar-mutation-owner-extraction.md
Plan: /Users/ivan/Developer/hito-running/docs/plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 2B only)
Stage: Phase 2B — Calendar mutation owner extraction

Read AGENTS.md, agents/backend.agent.md, the matching Backend/Supabase contract skill, this item,
and only the direct Phase-2B Calendar mutation, source-provenance, caller, and existing focused
proof seams.

Preflight every direct production/proof consumer of `applyAtomicCalendarWorkoutMutation`,
`applyAtomicCalendarWorkoutContentEdit`, and `clearAtomicCalendarFutureWorkouts`. Then make
`src/lib/runner-calendar-mutations.ts` the sole owner of those atomic Calendar commands and their
necessary Calendar policy inputs. Keep reviewed-source materialisation commands in their current
source owner. Preserve runner-owned Calendar truth: provenance is immutable input only; no command
may require a live plan for permission, visibility, or lifecycle.

Remove moved legacy exports and direct imports in the same slice when consumer reachability is zero.
Do not add aliases, adapters, duplicate DTO/state, a table, migration, RPC rename, Frontend change,
provider call, hosted action, Git action, or release work. Stop and return to PRODUCT if consumer
mapping requires source materialisation ownership, a second writer, a new persistence shape, or an
unadmitted compatibility path.

Prove the exact ownership and zero legacy imports, command behavior, stale/collision/ownership/
evidence protection, empty/Rest/occupied Move with durable Undo, source immutability, reload,
atomic failure, cleanup, focused types, Prettier, and diff hygiene. Use disposable local fixtures
only. Send an independent QA handoff only after implementation proof passes.
```
