# Local Design Suite And Inspector Continuity

## Work Item ID

2026-07-23-local-design-suite-and-inspector-continuity

## Status

completed

## Type

plan

## Priority

high

## Owner

backend

## Scope

scripts-validators-qa-infrastructure

## Archive Intent

retain_in_place

## Task

Record the accepted loopback generated-plan fixture boundary for local design work and its
separation from the real provider.

## Stage

BACKEND fail-closed fixture repair and owner-level QA complete. The separate real-provider
long-run rejection remains an open running-engine task and is not a fixture outcome.

## Track Tags

`local-design-suite`, `local-inspector`, `qa-fixture`, `devtool`

## Product History And Root Cause

Design work on generated-plan loading and review should not repeatedly call OpenAI or require the
runner to re-enter saved baseline facts. The repository already has a loopback-only fixture provider
and a delayed fixture-response seam, but its general reset command removed the runner profile along
with plan data.

The intended local design loop is:

1. use the already authenticated local browser session with a saved baseline and accepted BPM guidance;
2. run the existing deterministic fixture provider with a chosen delay;
3. exercise the ordinary generated preview, review, and confirm path with an explicit goal;
4. remove only plan/workout data and retain the verified runner profile for the next design pass.

In `qa_fixture`, the form still uses the ordinary UI gate before preview can begin, but the fixture
response itself is one stable, reviewable fake plan. It ignores age, baseline, heart-rate profile,
availability, benchmark, target date, and selected-distance details. This makes design work
repeatable. It must wait only for the configured local delay and never call OpenAI. The selected
goal may remain visible as local UI context, but it is not authoring input for the fake plan.

On 2026-07-23, runtime evidence showed that an authenticated local session in a process labelled
`qa_fixture` was rejected before fixture dispatch because fixture access also depended on an
account-level capability. The first incorrect owner was fixture-mode authorization: explicit
loopback `qa_fixture` mode and a valid local session already form the complete local design boundary.
Requiring a second account flag made the two-command workflow incomplete.

The Local Inspector remains separate: it is route-scoped, in-memory, local-only, non-mutating, and
generates Product prompts instead of selecting or applying source changes.

## Accepted Evidence

- Canonical reset owner: [test-user.mjs](../../../scripts/test-user.mjs) and [test-user lifecycle](../../process/test-user-lifecycle.md).
- Existing fixture runtime owner: [qa-local-server.mjs](../../../scripts/qa-local-server.mjs).
- Accepted Inspector contract: [Local Inspector DS Evidence And Batch Draft UX](2026-07-21-local-inspector-ds-evidence-and-batch-drafts.md).
- The `local-inspector` label is a repository task marker. Admin does not currently expose a separate parsed tag field, so this does not invent a second metadata system.
- `reset-plan` proved local tester authorization, profile equality before/after, delayed fixture review,
  explicit confirm, zero remaining plan/workout rows, idempotency, full-reset preservation, and
  tester cleanup. It rejects missing baseline, `--plan`, and hosted configuration before mutation.

## Preserved Boundaries

- Loopback local Supabase and authenticated local sessions only.
- In `qa_fixture` mode there must be no paid provider call or hidden real-provider fallback,
  including for an unauthenticated or stale local session. Such a request must fail with an explicit
  local-fixture authorization outcome before provider invocation.
- No hosted Supabase mutation or production account.
- Fixture plans use the normal review and confirm lifecycle. The fixture does not bypass the
  ordinary UI gate for entering preview, but its static plan content is independent of form values.
- Inspector data never persists to product storage, Admin, Supabase, or localStorage.

## Accepted Completion

On 2026-07-23, Backend closed the fixture authorization boundary. Runtime `qa_fixture` now uses a
fixed 10K plan and ignores runner authoring input; an unauthenticated or stale local session receives
an explicit refusal before provider invocation. An existing authenticated local browser session can
switch with `npm run local:fixture` and `npm run local:real` without changing accounts or signing in
again. The normal UI gate remains in place, the fixture follows the ordinary delayed review and
confirm path, and cleanup preserves the saved baseline while removing plan data.

This completion makes local loader and review design safe to iterate without OpenAI calls. It does
not validate real provider output or repair the separately observed long-run target-mode rejection.

## Outcome

The fixture lifecycle is the canonical local design foundation. Any authenticated local session in
explicit loopback `qa_fixture` mode receives one static deterministic signed review after the
configured delay; unauthenticated or stale sessions get an explicit non-provider refusal. The fixture
is deterministic test data, not a copy of whichever real plan happened to be generated last and not
an authoring pass over current form values. Any later Inspector change remains a separate child task
under the `local-inspector` marker; loader/review UX remains the separate frontend specification.
