# Runner Activity History And Explainable Progress Experience

## Work Item ID

2026-08-02-runner-activity-history-and-explainable-progress-experience

## Status

completed

## Type

change_request

## Priority

high

## Owner

frontend

## Frontend Lane

Product

## Next Recommended Role

frontend

## Scope

athlete-profile-progress

## Archive Intent

archive_when_closed

## Task

Implement the runner-facing activity history and explainable progress experience that consumes the
canonical Gate 1 activity foundation without inventing a second activity or fitness truth.

## Stage

Completed / FRONTEND Product implementation and integrated owner-level QA. `/progress` now consumes
the canonical Activity History and factual Progress read models without deriving activity or metric
truth locally. Functional Global QA for the selected Gates 1-4 bundle passed on 2026-08-03;
source-control release integration remains pending.

### Dependencies

- [Runner Activity Intelligence Foundation](2026-07-30-runner-activity-intelligence-foundation-architecture.md)
- [Hito Runner Profile Constitution](../running-coach/2026-07-30-hito-runner-profile-constitution.md)
- [Runner Activity History And Explainable Progress Experience](../frontend-specs/2026-08-02-runner-activity-history-and-explainable-progress-experience.md)

## Backend Gate 2 Completion

- Canonical activities now expose an authenticated keyset-paginated History collection.
- Immutable calendar-week and rolling-28-day snapshots own sessions, timer-based running time,
  observed distance/elevation, and separate longest-distance/longest-duration facts.
- Source removal, correction, and activity deletion return Backend readback or an explicit updating
  state; Frontend must not adjust trusted totals locally.
- Metric-specific missing evidence remains explicit. Coaching and longitudinal interpretation stay
  outside Gate 2.
- Local migration reset, RLS/isolation, Gate 1 regression, built-runtime routes, production build,
  integrity, cleanup, Running Coach review, and independent owner-level QA passed. Hosted deployment,
  Product Frontend implementation, and Global QA were not performed in this Backend slice.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Implement the runner-facing Activity History and factual Progress experience at `/progress`.

Stage:
FRONTEND Product implementation with integrated QA.

Frontend lane:
Product

Canonical task:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-08-02-runner-activity-history-and-explainable-progress-experience.md

Design specification:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-08-02-runner-activity-history-and-explainable-progress-experience.md

Fixture contract:
The existing local, loopback-only runner activity review fixture is available through the canonical
Backend path. It contains 30 activities across eight weeks, supports History cursor pages, planned
and unplanned runs, missing optional facts, source-removed state, and factual 28-day snapshots.
Reuse it for browser proof; do not add a screen-local data model, fixture fallback, or provider call.

Root cause:
The current `/progress` route reads plan/log aggregates from TrainingSnapshot rather than canonical
runner activities and factual snapshots. Backend Gate 2 now exposes the correct authenticated History
and Progress read models. Frontend must replace the incorrect rendering owner, not relabel old
aggregates or calculate activity/progress truth locally.

Required outcome:
Implement the approved two-tab `/progress` experience: Activity history with cursor pagination and
detail/deletion/source-state handling, plus factual Progress from Backend weekly/rolling-28-day
snapshots. Render only Backend-returned facts, availability, confidence, and updating state. Preserve
the existing workout Plan vs Run surface and all unrelated dirty work. Keep Gate 4/5 metrics absent:
do not fabricate aerobic efficiency, HR trends, durability, load, personal bests, or a score.

Definition of Done:
The review fixture proves that desktop and exact 375px users can scan 30 real canonical activities,
load the next page, distinguish planned/unplanned and source-removed activity states, view truthful
factual 28-day progress, and handle empty/loading/error/updating states without local arithmetic.
Use existing Hito DS primitives and the specified Dialog/Sheet semantics; preserve keyboard/focus,
light/dark, reduced motion, no-overflow, and accessible labels/live state. Run a bounded QA subagent
and a bounded DESIGNER source review, fix same-owner findings before reporting, and include the full
test inventory and cleanup outcome.

Autonomous completion rule:
Start or reuse one bounded ROLE: QA subagent for the local browser/data acceptance matrix. Own the
complete same-owner loop: inspect, implement, run local checks, integrate QA evidence, fix every
reproducible Frontend finding, and rerun affected proof. Do not stop for a routine checkpoint,
approval, or a separate user-mediated QA handoff. Return only with Implementation DoD passed, or
when a genuine cross-owner defect, unsafe external mutation, or unresolved Product decision prevents
further meaningful progress.

Approval policy:
Routine local inspection, implementation, fixture QA, and validation proceed under standing
authorization; seek a safe alternative before surfacing an environment gate. Do not request routine
approval, create a new chat, call a provider, mutate hosted data, stage, commit, or push.

Dispatch status:
not sent
```

## Dispatch

Executed in the existing FRONTEND task. The exact prompt above is retained as historical handoff
evidence, not as queued work.

## Accepted Frontend Completion

- `/progress` now uses the canonical authenticated Activity History and factual Progress consumers,
  including `20 + 10` cursor pagination, planned/unplanned and raw-source states, Backend mutation
  readback, and no route-local activity or metric arithmetic.
- The Product Frontend slice initially preserved truthful absence of advanced metrics. Gate 4
  records and session-RPE load were added later through the same Backend-shaped Progress seam;
  Gate 5 aerobic metrics, readiness, and fitness scoring remain unavailable.
- The accepted owner report covered desktop and exact 375px, both themes, focus/accessibility,
  bounded build/integrity checks, and independent QA. No broad release claim was made.

Implementation DoD: Passed. Functional Global QA Acceptance for Gates 1-4: Passed.
Source-control release integration: Pending.
