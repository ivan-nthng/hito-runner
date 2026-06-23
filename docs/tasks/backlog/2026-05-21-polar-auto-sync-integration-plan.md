# Polar Auto Sync Integration Plan

## Status

backlog

## Type

plan

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Plan the next Polar auto-sync integration slice when provider sync is prioritized.

## Stage

ARCHITECT plan / future provider sync integration.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan the next Polar auto-sync integration slice when provider sync is prioritized.

STAGE:
ARCHITECT plan / future provider sync integration

CONTEXT:
- Source path: docs/tasks/backlog/2026-05-21-polar-auto-sync-integration-plan.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.
- This plan was demoted from `docs/plans/active` during the 2026-06-15 global teardown audit
  because Polar sync is a concrete future integration, not the current active execution owner.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Architect / Backend

## Last Updated

2026-06-22

## Compression Note

D24 compressed this future-provider backlog plan from a long implementation outline into durable
architecture boundaries. The current product still owns Garmin FIT/ZIP upload and canonical
provider-evidence comparison; Polar auto-sync remains future backlog until Product explicitly
prioritizes connected-provider work.

## Durable Decision

Polar must enter the same evidence pipeline as Garmin:

`provider input -> raw provider evidence -> normalized actual metrics -> planned-workout matching -> deterministic comparison -> optional bounded AI readback`

Polar must not create:

- a second workout-feedback model
- a second planned-vs-actual comparison engine
- a route-local Polar-only feedback UI
- silent active-plan mutation from provider data
- provider-specific storage that bypasses canonical Hito workout/evidence entities

## API Direction

Use Polar AccessLink Dynamic API v4 as the primary architecture base. It supports OAuth, refresh
tokens, training session reads, profile/device reads, and documented rate limits. Older v3 exercise
transaction paths are deprecated and should not be the primary implementation base.

## Future Implementation Shape

The first implementation slice should be backend-led and provider-neutral:

1. Store a connected-provider account with encrypted token handling and user ownership.
2. Pull recent Polar training sessions without mutating plan state.
3. Preserve raw provider payload provenance before interpretation.
4. Normalize only supported run metrics into the existing actual-workout truth model.
5. Match conservatively to planned workouts by time/date/activity, surfacing unclear states.
6. Reuse existing deterministic comparison and Feedback readback surfaces.
7. Add a manual sync fallback before any webhook or freshness automation.

## Frontend Boundary

Frontend may expose connect/disconnect/sync status and route the runner to the existing Feedback
surface. It must not invent provider matching rules, comparison truth, AI interpretation, or plan
updates locally.

## QA And Validation Boundary

The future slice needs proof for OAuth/token handling, non-mutating sync, raw payload preservation,
normalization, matching ambiguity, deterministic comparison reuse, rate-limit behavior, and graceful
provider failure states. Browser QA should verify the connection/status/readback path only after the
backend evidence path is validated.

## Non-Goals

- webhook-first implementation
- provider-specific training-plan generation
- historical bulk import beyond the bounded recent-window MVP
- subscription/billing changes
- second feedback dashboard
- live provider mutation of active-plan truth

## Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`
