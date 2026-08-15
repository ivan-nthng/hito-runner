# Saved Plan Library And Future Schedule Apply

- **Work Item ID:** `2026-08-10-saved-plan-library-and-future-apply`
- **Status:** `completed`
- **Type:** `product-contract-and-library`
- **Priority:** `high`
- **Owner:** `BACKEND`
- **Scope:** `saved-plan-library-and-future-schedule-apply`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Persist every successful structured AI running-plan candidate as an immutable runner library record
before optional application. Support factual list/search/filter/sort, selected private export,
logical removal, and explicit future-only application without restoring plan authority over
Calendar workouts.

## Demonstrated Cause And Result

The preflight found `payload_owner_tables = 0`: `plan_cycles` contained summaries only,
`planned_workouts` were Calendar truth, and the AI ledger retained no payload. An unapplied,
exportable candidate therefore required one minimal payload invariant in the existing
`plan_cycles` owner.

[Migration `20260810114649_saved_plan_library_payload.sql`](../../../supabase/migrations/20260810114649_saved_plan_library_payload.sql)
added that invariant without a new table, RPC, scheduler, store, provider path, or runtime file.
Successful authenticated previews retain the reviewed canonical payload before optional confirm.
Saved records are archived immutable provenance, expose factual summaries and simple query controls,
support logical hide/remove plus selected private export, and do not create Calendar rows merely by
being saved.

Apply uses explicit empty-future, replace-future, or keep-future intent, runner-local date, and
persisted schedule preferences. It calls no provider, never mutates the selected record, and
preserves past, logged, FIT/evidence-backed, completed, skipped, comparison, and feedback truth.
Constraints, RLS, and the immutability trigger reject active saved records and immutable-field
changes; logical removal is the supported record mutation. The existing reviewed import RPC remains
the sole persistence seam.

## Canonical Sources And Successors

- [Saved-plan actions and selected export](../../../src/lib/active-plan-export-actions.ts)
- [Saved-plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Apply policy](../../../src/lib/plan-apply-policy.ts)
- [Selected private export route](../../../src/routes/api.plan.export.tsx)
- [Completed schedule-aligned Start](./2026-08-10-saved-plan-start-schedule-alignment.md)
- [Completed Progress Plans consumer](./2026-08-10-saved-plan-library-ui-and-start.md)

## Validation

Fresh migration replay and local parity passed. Focused persistence proved two retained records,
zero Calendar rows for an unapplied candidate, RLS/export isolation, logical removal, empty and
replace apply, decline no-op, zero active provenance, protected-history refusal, provider calls
zero, and cleanup convergence. Auth/export, legacy reviewed import, product projection, targeted
format/lint/diff, the original production build, and an independent read-only database review
passed.

The broad `validate:backend:local-db` run was not green: checks 1–17 passed, check 18 still expected
one legacy `status = active` fixture, and check 19 did not run. Repository-wide `tsc --noEmit`
also retained pre-existing errors in untouched generated-plan/apply-policy code. These are coverage
facts, not a focused saved-plan contract failure.

## Residual Boundary

The linked Frontend item later completed the Progress Plans UI. Hosted Supabase, live provider
transport, deployment, release parity, and Global QA Acceptance were not established by this
Backend item. Global QA remains pending as a separate gate.
