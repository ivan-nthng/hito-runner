# Project State Snapshot

## Status

Active product. The released baseline and the current Design System/DevTools contracts are recorded
below; detailed implementation evidence remains in canonical backlog items.

## Last Updated

2026-08-21

## Current Released Baseline

- Runtime and Product source are released through
  `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d` on `main` and `origin/main`. The exact release has
  linked Supabase migration parity and a READY Git-backed Vercel production deployment; detailed
  evidence is retained in the
  [production-release receipt](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-global-qa-approved-production-release.md).
- Current uncommitted work is not part of that released baseline. Its lifecycle remains owned by
  individual canonical backlog items.

## Current Product Truth

- Hito Running is one React/TanStack Start application with authenticated saved mode backed by
  Supabase and an explicitly untrusted signed-out preview boundary.
- Explicit review/confirm materializes manual, template, AI and imported source content as
  independently runner-owned Calendar workouts. Source records remain immutable provenance and do
  not control current Calendar permissions, visibility or lifecycle under the accepted
  [Calendar snapshot boundary](tasks/backlog/2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md).
- `planned_workouts`, `plan_cycles` and `active-plan-*` remain temporary physical implementation
  names only. The Calendar owner assembles persisted snapshots; `training-api.ts` remains transport
  and route composition rather than a second Calendar authority.
- The accepted [Result/Evidence contract](tasks/backlog/2026-08-21-hito-result-evidence-public-contract.md)
  exposes provider-neutral factual results while FIT/upload/parser/storage mechanics stay private.
  Calendar consumes only completion/protection truth, and runner-authored subjective input never
  becomes provider-derived fact.
- `/progress` and shared factual visualizations consume only the accepted
  [Progress Product contract](tasks/backlog/2026-08-21-hito-evidence-progress-product-contract.md):
  Activity History, immutable factual snapshots, whole-activity records, session-RPE load and
  explicit missingness from Runner Activity Intelligence Gates 1-4. They do not import private
  provider read models or reconstruct formulas.
- Actor classification is owned by Identity; Runner persisted-user resolution and Admin consume the
  explicit result under the accepted
  [Identity boundary](tasks/backlog/2026-08-21-hito-identity-owned-actor-classification.md).
- Feedback marker state remains Result/Evidence truth, while its unchanged labels are owned by the
  accepted [Frontend presentation contract](tasks/backlog/2026-08-21-hito-feedback-marker-presentation-owner-extraction.md),
  not `training.ts`.
- `/hitoDS` is the production-shipped public interactive reference for the same Hito tokens and
  component contracts used by Product; it is not a second Product lifecycle.
- `/admin/capture` is an Admin capture and triage inbox. It does not own operational work-item
  lifecycle or dispatch.
- Authenticated Admin Work Items reads automatically refresh repository-derived, read-only rows from
  canonical Markdown. Quick Notes remain separate Supabase-owned manual rows; automatic reads do
  not archive stale rows.

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
- The Local Inspector availability contract is complete: it is deliberately usable only on the
  canonical loopback QA origin, remains absent on non-loopback origins, and is local-only and
  non-mutating. Detailed browser evidence remains in the
  [canonical Inspector receipt](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-04-canonical-loopback-local-inspector-availability.md).
- Global QA remains separate from the accepted owner-level and release receipts recorded by the
  completed slices.
- The Admin mirror's local synchronization is completed. Its released deployed path still awaits a
  legitimate authenticated production Admin read, projection readback, unchanged second read, and
  Global QA; the deployment child remains `blocked` until then.

## Operational Work

The `Hito Running` Notion database is the sole operational lifecycle writer under the
[current operating map](../AGENTS.md). Current documents, repository tasks, supporting plans,
specifications, briefs, dashboards, Admin mirrors and historical receipts remain linked technical
documentation or evidence; they cannot independently dispatch work or change current lifecycle.

## Canonical References

- [Project context](context.md)
- [Current product](current-product.md)
- [Current system](current-system.md)
- [Current functional map](current-functional-map.md)
- [Technical log](history/technical-log.md)
- [Operational backlog](tasks/backlog/)
