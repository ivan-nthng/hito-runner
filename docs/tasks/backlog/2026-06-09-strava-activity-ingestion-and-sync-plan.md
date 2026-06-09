# Strava Activity Ingestion And Sync Plan

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Plan Strava activity ingestion and sync for normalized plan-vs-actual comparison.

## Stage

ARCHITECT plan / Strava ingestion and sync

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan Strava activity ingestion and sync for normalized plan-vs-actual comparison.

STAGE:
ARCHITECT plan / Strava ingestion and sync

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-09-strava-activity-ingestion-and-sync-plan.md
- Canonical provider contract now exists in docs/tasks/product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md
- Hito already supports local Garmin FIT/ZIP upload, normalized actual metrics persistence, deterministic comparison, and bounded AI recommendation.
- Strava’s public developer API provides OAuth access plus activity detail, laps, streams, and webhooks.
- The product may later allow a runner to connect Hito to Strava so the same comparison pipeline can run without manual FIT upload.

GOAL:
Define the smallest safe Strava integration slice that reuses the canonical normalized activity contract instead of creating a second comparison model.

ASSESS:
- OAuth scopes and token lifecycle requirements
- whether Strava sync should be import-on-demand, background sync, or webhook-assisted
- which Strava endpoints are required for Hito’s comparison contract
- how to normalize Strava activity, lap, and stream payloads into canonical activity truth
- how to deduplicate Strava-synced activities against Garmin FIT uploads or other provider sources
- how to mark unsupported or partial comparison cases honestly
- what runner-facing connection and consent boundaries are needed

CONSTRAINTS:
- Do not create a second provider-specific comparison model.
- Do not infer plan-step fidelity from Strava unless canonical truth exists.
- Do not invent pace targets or personal HR targets from provider data.
- Do not silently mutate active plans.
- Reuse the existing normalized actual-metrics and deterministic comparison seam where possible.

OUTPUT:
1. Task
2. Stage
3. Decision
4. Proposed integration slice
5. Canonical seams to reuse
6. OAuth / sync model
7. Deduplication policy
8. Validation strategy
9. Blockers
```

## User Report

If the runner connects Hito with Strava and the API gives the required activity data, Hito should
have an explicit integration plan rather than relying only on manual FIT upload.

## Expected Behavior

Strava-connected activities should be able to flow into the same normalized activity contract and
comparison pipeline that FIT upload uses today, with honest handling of missing laps, missing
streams, private-activity scope gaps, and duplicate provider evidence.

## Source Investigation

Confirmed source facts:

- Strava public API access is available after user OAuth authorization.
- Strava activity APIs expose detailed activity summary, laps, and streams.
- Strava webhooks can notify on activity create/update/delete events.
- Current Hito product already has Garmin FIT upload, normalized actual metrics persistence,
  deterministic comparison, and bounded AI recommendation.

Relevant source surfaces:

- `docs/tasks/product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md`
- `src/lib/workout-result-import/*`
- `src/lib/runner-coach-context.ts`
- `src/lib/workout-result-import/compare-workout-result.ts`
- `docs/current-product.md`
- `docs/current-system.md`

## Blockers

None yet. This is a future architecture/backend integration track.
