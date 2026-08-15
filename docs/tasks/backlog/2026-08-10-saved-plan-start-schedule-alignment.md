# Saved Plan Start With Schedule Alignment

- **Work Item ID:** `2026-08-10-saved-plan-start-schedule-alignment`
- **Status:** `completed`
- **Type:** `saved-plan-start-contract`
- **Priority:** `high`
- **Owner:** `BACKEND`
- **Scope:** `saved-plan Start server contract and deterministic future-Calendar projection`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Let an authenticated runner Start an immutable saved-plan record using runner-local date and
schedule preferences, with explicit future replacement and deterministic weekday alignment. The
projection must preserve source workouts, avoid providers, and never become a plan editor or
current-plan lifecycle.

## Demonstrated Cause And Result

The earlier apply policy shifted a saved seed by whole weeks and rejected fixed-rest or preferred
long-run conflicts even when they could be safely aligned. A Monday/Wednesday-rest plus
Sunday-long-run replay demonstrated the failure.

The existing weekday projection seam now aligns each source week's ordered non-Rest workouts onto
compatible weekdays. It preserves the weekly workout count and order: `max_running_days_per_week`
remains an upper-bound validity constraint, never a target used to pad or reduce the plan. The
policy may omit leading source days before the requested or earliest compatible future start and
rejects impossible capacity/order combinations without mutation.

The authenticated action accepts strict replacement intent and optional one-time start date,
fixed-rest, and preferred-long-run inputs. Omitted values use persisted runner preferences;
overrides do not change Settings. Keep is a no-op, replacement stays explicit and atomic, protected
history remains untouched, the saved record remains immutable, and the receipt returns only factual
resolved start, omission, materialization, and replacement data.

## Task-Owned Sources

- [Saved-plan library contract](./2026-08-10-saved-plan-library-and-future-apply.md)
- [Apply policy](../../../src/lib/plan-apply-policy.ts)
- [Existing weekday projection](../../../src/lib/weekday-rest-invariants.ts)
- [Saved-plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Selected-record action](../../../src/lib/active-plan-export-actions.ts)

No production artifact, migration, table, RPC, scheduler, store, provider path, compatibility layer,
or Frontend file was added. The superseded rejection-only/no-remapping branch was removed.

## Validation And Residual Boundary

Deterministic five-workout projection, strict input, explicit/default start, leading omission,
one-time preference non-persistence, impossible/no-mutation, keep/replace, protected history,
saved-record immutability, auth/RLS, and zero-provider checks passed against loopback Supabase. The
complete local Backend DB suite passed all 19 checks; targeted format/lint/diff plus the original
production build and build-integrity check passed.

The [Progress Plans consumer](./2026-08-10-saved-plan-library-ui-and-start.md) later completed the
browser-facing Start flow. This Backend closeout did not establish hosted, deployment, release, or
Global QA acceptance; Global QA remains pending.
