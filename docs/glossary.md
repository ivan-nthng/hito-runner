# Glossary

## Core Terms

- `baseline import`
  the imported `adaptive-run-coach` TanStack Start frontend brought into this repo with minimal structural churn
- `preview surface`
  a visible route or panel that preserves layout and flow continuity while intentionally remaining outside trusted saved runner truth
- `honest stabilization`
  copy, metadata, and state corrections that remove misleading claims while preserving the imported UI baseline
- `data seam`
  the canonical module boundary where preview data and persisted backend data are normalized into one shared contract

## Status Terms

- `on track`
  user-facing week state indicating the current week still holds together as planned
- `partially off track`
  user-facing week state indicating some work was shortened or missed
- `needs reset`
  user-facing week state indicating the current week should no longer be followed blindly
- `preview`
  intentionally not trusted and not saved as runner history
- `saved mode`
  authenticated mode where plan, logs, and week status are backed by persisted backend truth

## Entity Terms

- `runner_profile`
  persisted record for goal, baseline, and setup state
- `plan_cycle`
  persisted plan context for one runner
- `planned_workout`
  one scheduled workout entry in a persisted plan
- `workout_log`
  persisted result recorded against a planned workout
- `week_status`
  backend-derived weekly state shown to the user from workout execution

## Trusted Output Terms

- `trusted product output`
  authenticated, persisted, backend-owned runner data that the product can safely present as truth
- `sample plan`
  imported mock workout data still used only for the signed-out preview path
