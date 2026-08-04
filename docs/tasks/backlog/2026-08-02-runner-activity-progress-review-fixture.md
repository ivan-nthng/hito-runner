# Runner Activity Progress Review Fixture

## Work Item ID

2026-08-02-runner-activity-progress-review-fixture

## Status

completed

## Type

change_request

## Priority

high

## Owner

backend

## Scope

athlete-profile-progress

## Archive Intent

archive_when_closed

## Task

Provide one reusable local-only canonical activity fixture for browser review of Activity History and
factual Progress.

## Stage

Completed / BACKEND fixture implementation, owner-level QA, and selected Gates 1-4 functional
Global QA. Source-control release integration remains pending.

## Dependencies

- [Runner Activity Intelligence Foundation](2026-07-30-runner-activity-intelligence-foundation-architecture.md)
- [Activity History And Explainable Progress](2026-08-02-runner-activity-history-and-explainable-progress-experience.md)

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Create the canonical local-only review fixture for Activity History and factual Progress.

Stage:
BACKEND fixture implementation with integrated QA.

Canonical task:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-08-02-runner-activity-progress-review-fixture.md

Context:
Gate 1 and Gate 2 now own canonical activity/source/revision truth, authenticated History, and
weekly/rolling-28-day factual snapshots. Their validators create narrow contract data, but no
reusable browser fixture represents a realistic runner history for the approved `/progress`
experience.

Required outcome:
Create one strictly local, loopback-gated QA fixture that produces a deterministic eight-week history
of 30 canonical running activities through the same canonical activity/source/revision and snapshot
seams used by production logic. It must support review of pagination, planned and unplanned runs,
missing optional evidence, source-removed truth, and factual 28-day totals without inventing coaching
metrics, a second progress model, production data, provider calls, or hosted mutation.

Fixture policy:
The fixture is test data only, never a runner-facing fallback. It must be isolated to existing local
QA authorization, be disposable and cleanup-safe, and preserve the current qa_fixture versus real
provider boundary. Do not fabricate aerobic efficiency, HR trends, durability, load, personal bests,
or any Gate 4/5 output; those remain unavailable until their own canonical Backend gates.

Definition of Done:
The same local review identity can enter Activity History and factual Progress with deterministic,
readable data that exercises the specified states through the real Backend read models. Integrated
QA proves fixture gating, canonical provenance, cursor/readback, snapshot truth, teardown, and no
provider or hosted activity. Use a bounded QA subagent and fix same-owner findings before returning.

Approval policy:
Routine local inspection, implementation, fixture QA, and validation proceed under standing
authorization; seek a safe alternative before surfacing an environment gate. Do not request routine
approval, create a new chat, stage, commit, or push.

Dispatch status:
not sent
```

## Dispatch

Executed in the existing BACKEND task. Frontend browser acceptance remains a separate Product-owned
slice.

## Supersession

As of 2026-08-04, the activity-only command and source names recorded below are historical release
evidence. Their 30-activity corpus now belongs to the single
[`runner_design_profile_v1`](2026-08-04-canonical-local-runner-design-profile-fixture.md) lifecycle,
reached through `local:design-profile:seed`, `local:design-profile:status`, and
`local:design-profile:reset`. No runtime alias for the retired activity-only commands remains.

## Accepted Implementation

- `npm run local:activity-review:seed` resets and reuses the metadata-owned
  `saved-plan-readback` QA identity, then creates 30 canonical Garmin FIT activities across eight
  moving calendar weeks through the production activity/source/revision and snapshot seams.
- The fixture includes 23 archived-plan matches and seven unplanned runs, timer- and evidence-missing
  cases, 27 available sources, one retryable `removal_pending` source, two source-removed activities,
  retained valid FIT sources, default `20 + 10` cursor pages, and deterministic current/prior
  rolling-28-day facts.
- The retryable source is a persisted canonical source revision with its private raw object retained.
  Ordinary History readback exposes `removal_pending`, `updating: false`, and
  `canRemoveOriginalFile: true` without leaking storage identity, allowing Product browser QA to
  exercise the accepted retry presentation honestly.
- One current-window activity carries immutable runner-entered RPE through the canonical activity
  evidence lifecycle, producing a session-RPE load of `500` while the remaining current activities
  retain explicit missing-evidence counts and the prior window remains unavailable.
- One exact-distance track activity preserves its parsed FIT running context through canonical
  normalization and appears as a context-specific observed record rather than `context_unknown`.
- `npm run local:activity-review:status -- --runtime-url http://127.0.0.1:3000` verifies anonymous
  refusal plus authenticated History and factual Progress readback without private raw-source fields.
- `npm run local:activity-review:reset` removes all fixture-owned rows and raw objects while preserving
  the reusable Auth identity. A final review seed remains available at the same loopback URL.
- Fixture execution is loopback-only, lease-protected, provider-free, and independent of
  `qa_fixture` versus `real` plan-generation behavior. Gate 5 stream-dependent coaching metrics
  remain explicitly unavailable as `normalized_stream_not_persisted`.

During fixture proof, the canonical FIT parser exposed a unit-owner defect: configuring all FIT
lengths as kilometers also converted elevation before rounding. The parser now retains FIT lengths
in meters and converts only distance fields to kilometers, preserving evidence-backed elevation.

## Validation

| Check                   | Result | Evidence                                                                                                                                                                                                            |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical seed/readback | passed | Exactly 30 activities/sources/revisions, eight weeks, 23 planned and seven unplanned runs.                                                                                                                          |
| Cursor and auth         | passed | Authenticated History returned `20 + 10`; anonymous History and Progress returned `401`.                                                                                                                            |
| Factual snapshots       | passed | Current 28 days: 15 sessions, 763 min, 124.3 km, 540 m with exact partial/missing reasons; prior window also matched.                                                                                               |
| Gate 4 fixture states   | passed | Current session-RPE load is `500` from one immutable evidence row, 14 current observations remain unavailable, the previous window remains unavailable, and the observed 5 km track record retains `track` context. |
| Gate 5 boundary         | passed | Stream-dependent metrics remain unavailable with `normalized_stream_not_persisted`; no summary fallback is fabricated.                                                                                              |
| Source-removal state    | passed | One canonical source reads back as retryable `removal_pending`; its raw object remains private and retained for the ordinary retry action.                                                                          |
| Provenance/privacy      | passed | Retained FIT reparsed; removed sources stayed factual; no storage path, filename, fingerprint, or fixture metadata reached readback.                                                                                |
| Lifecycle               | passed | Reseed reused one Auth identity without accumulation; reset reached zero rows/objects, including pending-source storage; final seed restored review data.                                                           |
| Isolation               | passed | Non-loopback target refused before mutation; local event window contained zero provider events.                                                                                                                     |
| Regression              | passed | Gate 1, Gate 2, comparison, test-user lifecycle, targeted lint, fresh build integrity, runtime health, and diff hygiene passed.                                                                                     |
| Independent QA          | passed | Reusable QA reviewer found no functional or privacy defects.                                                                                                                                                        |

Implementation DoD: Passed. Functional Global QA Acceptance for Gates 1-4: Passed.
Source-control release integration: Pending.
