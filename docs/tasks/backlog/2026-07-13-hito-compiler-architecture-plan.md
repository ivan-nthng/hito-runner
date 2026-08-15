# Hito Compiler Architecture Rebuild Plan

- **Work Item ID:** `2026-07-13-hito-compiler-architecture-plan`
- **Status:** `completed`
- **Type:** `plan`
- **Priority:** `high`
- **Owner:** `ARCHITECT`, followed by domain owners per implementation phase
- **Scope:** `canonical running-plan and WorkoutDocument compilation`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Replace overlapping plan/workout representations with one reviewable compiler path shared by AI,
manual authoring, import/export, Calendar readback, and provider comparison, while keeping planned
truth separate from actual activity evidence.

## Accepted Architecture

PlanCreation now uses one direct, self-describing provider grammar: exact runner and goal facts in;
a flat non-Rest `workouts[]` list plus one selected-distance endpoint out. Every workout and
endpoint owns ordered `sections[]`. Runnable leaves own their prescription and one numeric
pace-or-BPM command; Repeat is structural and contains ordered children; targetless Hydration is
non-runnable.

There is no compact catalog, reference-table expansion phase, week wrapper, duplicate goal field,
compatibility repair, or semantic fallback. Backend validates and compiles authored truth without
adding coaching content, signs the canonical `training-plan-v2` review, and persists exactly the
confirmed reviewed document without another provider call. Frontend renders canonical
`workoutDocuments` directly rather than reconstructing them.

The completed phases established the plan-first compiler, WorkoutDocument kernel, signed
review/confirm, Calendar projection, entrypoint consolidation, evidence comparison, and direct UI
projection. Planned `WorkoutDocument` truth remains distinct from FIT/provider evidence.

## Canonical Sources

- [AI-generated running-plan owner](../../../src/lib/ai-generated-running-plan.ts)
- [Workout block contract](../../../src/lib/planned-workout-block-contract.ts)
- [Workout language](../../../src/lib/planned-workout-language.ts)
- [Training document types](../../../src/lib/training.ts)
- [Canonical plan export](../../../src/lib/plan-export.ts)
- [Canonical plan import](../../../src/lib/imported-plan.ts)
- [Current product ownership rules](../../current-product.md)

## Acceptance Evidence

- [2026-07-17 reviewed WorkoutDocument adoption](../../../qa-artifacts/screenshots/2026-07-17/reviewed-workout-document-adoption/final-proof.json)
  proved Tempo and ordered Repeat review-to-confirm-to-saved parity on desktop and exact 375px,
  stale-review tamper rejection, clean browser counters, and disposable-data cleanup.
- [2026-07-27 generated-plan full-wire Global QA](../../../qa-artifacts/screenshots/2026-07-27/generated-plan-full-wire-global-qa/proof.json)
  accepted `UI -> one real provider dispatch -> signed review -> explicit confirm -> saved readback
-> export`, including personal HR snapshots, transient context redaction, Repeat/Hydration,
  large-plan persistence, desktop and exact 375px, cleanup to zero, and protected-admin isolation.
- Large-plan readback established the shared batched PostgREST ID-query helper as part of the
  canonical Backend persistence boundary across all live consumers.

## Residual Boundary

This architecture is accepted and closed. Universal load/progression veto policy remains outside it
until PRODUCT and RUNNING COACH define that contract. Post-confirm workout editability follows
[current product policy](../../current-product.md); runtime changes to that rule require their own
canonical task. Earlier compact-wire, failed-canary, warning, assumption, weekly-wrapper, and
permissive workout-type material was historical diagnostic evidence and is not an active contract
or rollback path.
