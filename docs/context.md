# Project Context

## Project Purpose

Hito Running is a running-plan product focused on one clear promise: help a runner understand the current week, open today's workout quickly, and stay oriented without fake coaching authority.

## Current Pipeline Summary

The implemented repo now operates as:

`preview access or magic-link auth -> runner profile onboarding -> persisted plan assignment -> planned workouts -> workout log mutation -> backend-derived week status -> preserved preview shells for later surfaces`

The imported UI baseline still exists as a read-only preview for signed-out users, but trusted runner truth now starts only after authentication and persisted backend state.

## Major Entities

- `runner_profile`
  persisted goal, baseline, and setup record keyed to one authenticated user
- `plan_cycle`
  persisted active training context for the runner
- `planned_workout`
  persisted scheduled workout entry inside one active plan
- `workout_log`
  persisted result for completed, partial, or skipped workouts
- `week_status`
  backend-derived weekly state shown to the user from persisted workout truth

## Trusted Output Boundary

Trusted product output now includes:

- authenticated runner identity
- persisted runner profile
- persisted active plan cycle
- persisted planned workouts
- persisted workout logs
- backend-derived week status

Signed-out preview mode remains intentionally outside the trusted product boundary.

## Runtime And Storage Terms

- runtime:
  one TanStack Start app at the repo root
- storage:
  Supabase auth plus persisted Postgres tables for profile, plan cycle, planned workouts, and workout logs
- seam:
  one canonical data seam in `src/lib/training.ts` with backend loading through `src/lib/training-api.ts`
- env:
  `.env.example` now defines the Phase 2 contract for public Supabase config and server-only base URL and service-role access, with `NEXT_PUBLIC_*` as the preferred public naming and legacy `VITE_*` aliases still supported

## Important Constraints

- preserve imported layout, styles, motion, and route structure unless honesty or contract safety requires change
- keep one canonical backend truth path for profile, plan, workout logs, and week status
- keep preview mode visibly separate from authenticated saved mode
- keep secrets server-only and do not expose service-role access to the client
- keep session refresh server-validated in request middleware so cookie-backed auth stays current across SSR requests

## Key Routes And Surfaces

- `/`
  weekly plan home with preview fallback, onboarding gate for authenticated users without a profile, and persisted plan view for authenticated users with setup complete
- `/login`
  magic-link entry point for saved mode
- `/api/auth/confirm`
  auth callback route that exchanges the Supabase code for a cookie-backed session
- `/workout/$date`
  workout detail and result logging surface backed by preview or persisted data through the same contract
- `/progress`
  preserved analytics shell now able to read persisted aggregates from the canonical seam
- `/body`
  legacy path that now redirects to `/` because body notes belong to workout logging, not a standalone surface
- `/integrations`
  preserved integration-preview shell
