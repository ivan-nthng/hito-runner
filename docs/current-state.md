# Project State Snapshot

## Status

Active product; the admitted Hito stack cleanup sequence is complete through Slice 8H.

## Last Updated

2026-08-06

## Current Released Baseline

- Runtime and Product source are released through `d5dccefc5d4c3bdba03b35399d083bb3de4f2e2e`
  on `main` and `origin/main` before this documentation-only closeout.
- Backend/security cleanup, Slices 8A-8G, and their owner-level validation are released. Their exact
  commits and receipts remain in the
  [Hito Stack Complexity Reduction Program](tasks/backlog/2026-08-04-hito-stack-complexity-reduction-program.md)
  and Git history.
- Slice 8H removes stale routing and release chronology from the current documents. It does not
  change runtime behavior and does not claim Global QA Acceptance.

## Current Product Truth

- Hito Running is one React/TanStack Start application with authenticated saved mode backed by
  Supabase and an explicitly untrusted signed-out preview boundary.
- Runner profile, active plan, planned workouts, workout logs, schedule operations, plan
  review/confirm, exports, and settings use the existing Backend-owned persistence seams.
- Manual and generated plan creation share reviewed canonical workout-document truth while keeping
  their operation-specific lifecycle and safety contracts separate.
- Workout completion, body notes, FIT evidence, normalized actual metrics, factual Plan-vs-Run
  comparison, and bounded feedback remain separate evidence layers. Runner-authored subjective
  input never becomes provider-derived fact.
- `/progress` exposes canonical Activity History, immutable factual snapshots, whole-activity
  records, and session-RPE load from Runner Activity Intelligence Gates 1-4.
- `/hitoDS` is the production-shipped public interactive reference for the same Hito tokens and
  component contracts used by Product; it is not a second Product lifecycle.
- `/admin/capture` is an Admin capture and triage inbox. It does not own operational work-item
  lifecycle or dispatch.

Detailed runner-facing behavior belongs in [current-product.md](current-product.md). Implemented
runtime and ownership boundaries belong in [current-system.md](current-system.md).

## Truthful Unavailable And Blocked Boundaries

- Runner Activity Gate 5 aerobic metrics remain unavailable as
  `normalized_stream_not_persisted`. Normalized persisted sample streams, Gate 5 formulas, and
  provider sync are future work.
- Backend FIT completion truth is accepted and released. The separate runner-facing FIT-backed
  planned-workout presentation record at
  `docs/tasks/backlog/2026-08-05-fit-backed-planned-workout-product-presentation.md` remains blocked
  and uncommitted: no approved local browser could attach the safe FIT fixture through the native
  file input, so no real upload request or end-to-end browser readback was proven. This is a browser
  capability/evidence gate, not accepted Product UI and not a new source defect.
- The Local Inspector work item remains an independent Frontend DevTools evidence boundary. Source
  reachability cannot substitute for its required loopback and non-loopback browser proof.
- Global QA remains separate from the accepted owner-level and release receipts recorded by the
  completed slices.

## Operational Work

`docs/tasks/backlog/` is the only live operational queue. Current documents, supporting plans,
specifications, briefs, dashboards, Admin mirrors, and historical receipts cannot independently
dispatch work or override backlog lifecycle.

The completed cleanup parent makes
[Developer Velocity And Proportional Verification](tasks/backlog/2026-08-05-developer-velocity-and-proportional-verification.md)
eligible as the next Architect-owned backlog item. That successor has not started in this Slice 8H
task. It alone owns the later refresh of `current-functional-map.md` and the proportional local
verification work.

## Canonical References

- [Project context](context.md)
- [Current product](current-product.md)
- [Current system](current-system.md)
- [Current functional map](current-functional-map.md)
- [Technical log](history/technical-log.md)
- [Operational backlog](tasks/backlog/)
