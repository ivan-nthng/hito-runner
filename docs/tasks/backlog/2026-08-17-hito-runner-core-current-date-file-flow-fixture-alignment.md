# Hito Runner Core Current-Date File-Flow Fixture Alignment

## Work Item ID

3fd68316-f9ac-473b-84cd-ac10c7857005

## Status

completed

## Type

Bug — Lite Backend fixture repair

## Priority

critical

## Owner

BACKEND

## Parent

[Runner Core Baseline And Risk-Derived Regression Gate](./2026-08-17-hito-runner-core-baseline-and-risk-derived-regression-gate.md)

## Scope

Restore deterministic current-date admission for the existing local Runner Core file-flow fixture.
Change only the existing fixture date-selection seam and directly related deterministic proof.

## Archive Intent

Compact after focused Backend proof and the dependent Runner Core QA replay.

## Task

For every admitted `--as-of-date`, `runner-core-file-flow-seed` must materialize exactly one
future, eligible `file_import` Calendar workout on a weekday allowed by the canonical weekday-Rest
invariant. It must retain immutable source provenance and never create runner-facing active-plan
authority.

## Evidence

The Runner Core baseline reproduced this command against a clean disposable local identity:

```text
npm run test-user -- runner-core-file-flow-seed --as-of-date 2026-08-17
```

It fails because `buildRunnerCoreFileFlowPlan()` chooses `addDaysIso(asOfDate, 2)`, which is
Wednesday for that date. `validateWorkoutsAgainstWeekdayRestInvariant` correctly rejects the
fixture's Easy workout on that blocked weekday.

## Demonstrated Cause

`scripts/lib/runner-design-profile-fixture.ts` hard-codes a two-day offset without resolving the
runner's allowed weekdays. The weekday-Rest invariant is correctly enforcing the product rule and
is not the repair target.

## Expected Behavior

- Current-date seed passes for `2026-08-17` and remains deterministic across reset/reseed.
- The one fixture workout is future, `file_import`, independently runner-owned, and eligible for
  Edit/Move/Copy before evidence.
- Source provenance stays immutable; no materialized, active, or runner-facing plan container is
  created.
- Existing fixture dates and unrelated Runner Core flows remain unchanged unless source evidence
  proves they need the same date-selection rule.

## What Not To Touch

Do not weaken or bypass weekday-Rest validation; change Product UI, Calendar behavior, source-plan
semantics, persistence/schema/RLS, upload/import flows, QA scenarios, hosted state, providers, or
Git lifecycle. Do not add a second fixture framework, compatibility path, or client-side fallback.

## Focused Proof

Reproduce the red command, then prove its green result and reset → seed → status → reseed → reset
convergence on local disposable state. Verify one future eligible imported workout, immutable
provenance, zero active/materialized plan authority, and cleanup. Run focused formatting/lint/type
checks and `git diff --check`. Promote to Tracked only if the repair reaches persistence, invariant
semantics, another owner, or a broader fixture contract.

## Next Condition

After Backend completion, QA reruns the complete existing Runner Core baseline; it must not merely
replay this one fixed seed command.

## Stage

BACKEND deterministic fixture repair completed; QA full baseline pending

## Lite Backend Receipt — 2026-08-17

- **Task and mode:** Hito Runner Core Current-Date File-Flow Fixture Alignment; Lite Backend fixture
  repair.
- **Cause and red evidence:** `npm run test-user -- runner-core-file-flow-seed --as-of-date
2026-08-17` reproduced the accepted failure. `buildRunnerCoreFileFlowPlan()` selected the static
  preferred date `asOfDate + 2`, which was blocked Wednesday, and the unchanged canonical
  `validateWorkoutsAgainstWeekdayRestInvariant` correctly rejected it. The failed seed cleaned the
  disposable identity.
- **Reused seam and change:** `scripts/lib/runner-design-profile-fixture.ts` now resolves the
  template's existing imported weekday-Rest invariant and retains the preferred `+2` date when it
  is allowed. When blocked, it deterministically selects the first allowed date within the next
  seven days using canonical `addDaysIso`, `weekdayLong`, and `resolveWeekdayRestInvariant` helpers.
  The obsolete local `Intl.DateTimeFormat` weekday helper was removed.
- **New artifacts:** none. No fixture path, runtime file, migration, schema, RPC, persistence shape,
  dependency, compatibility branch, or fallback was added.
- **Files changed:** `scripts/lib/runner-design-profile-fixture.ts` and this canonical item. Both
  were already part of the shared dirty candidate; unrelated hunks and working-tree bytes were
  preserved, and the Git index remained empty.
- **Focused green proof:** the same current-date seed passed with exactly one future Easy workout on
  Thursday `2026-08-20`, `originKind=file_import`, immutable source-workout identity, and eligible
  Edit/Move/Copy readback. Its only source record remained `archived` with
  `sourceKind=training_plan_v2_import`; the canonical readback asserted zero active plans, zero
  materialized plan containers, and `planMeta: null`.
- **Convergence:** `npm run test-user -- runner-core-file-flow-proof --as-of-date 2026-08-17`
  passed reset -> seed/readback -> reset -> reseed/readback -> durable existing FIT lifecycle ->
  final reset. Both seeds selected `2026-08-20` with the same immutable source-workout identity and
  no accumulated evidence. Fixture and isolation cleanup returned every owned row category and raw
  storage object to zero.
- **Static proof:** targeted Prettier and ESLint passed; repository TypeScript output contained no
  diagnostic for `scripts/lib/runner-design-profile-fixture.ts`; `git diff --check` passed.
- **Preserved boundaries:** weekday-Rest semantics, source-plan retention/materialization behavior,
  runner-owned Calendar truth, FIT/upload implementation, Product/Design System source, schema/RLS,
  hosted state, providers, dependencies, and Git lifecycle were unchanged.
- **Mode and next owner:** the work remained Lite because the demonstrated fixture owner and one
  existing date-selection seam were sufficient. Backend focused proof is complete. QA remains the
  next owner for the full existing Runner Core baseline; no QA, browser, hosted, release,
  deployment, or Global QA acceptance is claimed here.
- **Role and procedure:** `agents/backend.agent.md`,
  `skills/hito-backend-supabase-contract/SKILL.md`, and the local Supabase fixture procedure. No
  subagent was used.
