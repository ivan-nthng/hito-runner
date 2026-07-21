# Hito Backend Business-Process Canonicalization And Performance Program

## Status

archived

## Type

plan

## Priority

high

## Next Recommended Role

product

## Task

Keep the accepted backend process canonicalization and measured performance corrections closed;
select any future optimization as a separate evidence-backed task.

## Stage

ARCHITECT closeout / program closed and archived.

## Context

Runner Core is functionally accepted for local self-use and controlled local testing. Its business
flows accumulated through several accepted rebuilds: profile and settings, AI/manual/import plan
creation, review/confirm, active-plan mutations, templates, workout logging and evidence,
calendar/detail/progress reads, export/import, Admin work items, and local observability.

The current functional map records the intended converged paths, but it is not a fresh proof that
each runtime process has one canonical owner, one persistence truth, and no unnecessary sequential
work or repeated reads. This program must establish that proof before claiming backend simplicity or
performance. It is not permission for speculative rewriting or a new monitoring platform.

## Problem Definition

The visible risk is a service that has become harder to reason about or slower after many accepted
changes: parallel server actions, compatibility facades, duplicated validation or normalization,
multiple read models, redundant persistence steps, repeated route reads, and obsolete proof/runtime
branches can conceal the real owner of a business decision. The likely root cause is process-level
drift, not a known isolated endpoint defect.

The first owner is BACKEND because the question concerns server actions, canonical entities,
validation/normalization, persistence, provider boundaries, and data-loading contracts. The backend
must inspect evidence first; it must not manufacture a performance problem simply because a flow has
several modules.

## Product Boundaries

- Preserve frozen Runner Core behavior: profile truth, AI/manual/import creation, signed
  review/confirm, one-primary watch target, templates, today/future editing, logging/evidence,
  continuous `Rest` calendar grammar, export/import, and local observability.
- Preserve explicit review/confirm, transaction safety, provenance, history, auth boundaries, and
  local-only fixture isolation.
- Do not change runner-facing product rules, coaching doctrine, frontend interaction, visual design,
  hosted data, paid-provider policy, or the Supabase Auth email track.
- Do not add a new cache, telemetry platform, provider fallback, persistence model, schema, or
  migration merely to make the audit look complete. A schema or infrastructure requirement is a
  stop condition with evidence, not an implicit expansion.
- Previous validators and accepted browser/provider artifacts are guardrails, not fresh proof that
  current backend source is minimal or performant.

## Required Outcome

1. Build a concise process map from current source for these runtime families:
   - authentication/profile/settings;
   - AI plan creation through provider, compiler, review, confirm, and persistence;
   - manual authoring, templates, copy/paste, and reviewed persisted edits;
   - active-plan Add, Clear, Move, Copy, replacement, and schedule reflow;
   - calendar, home, detail, and progress data reads;
   - completion, evidence/FIT ingestion, comparison, and readback;
   - import/export; Admin repo-derived work items; and local observability.
2. For every material process, identify the entrypoint, canonical entity/owner, mutation or read
   boundary, intentional review/guard, current consumers, and any second source of truth or repeated
   work. Classify each finding as canonical, intentional exception, removable duplication, or a
   separately scoped risk.
3. Establish an evidence-based local performance baseline for the processes that actually perform
   repeated server/database/provider-adjacent work. Reuse existing local observability, validators,
   source instrumentation, and disposable loopback facilities; do not introduce a second logging
   engine. Claims about speed or query reduction must be measured, not inferred from line counts.
4. Autonomously implement and validate deletion-first, same-owner corrections when evidence proves
   a duplicate source of truth, obsolete process, redundant sequential work, or measurable local
   bottleneck. Consolidate the existing canonical seam rather than adding compatibility layers.
5. Record only durable resulting truth in current docs and this plan. Keep findings that need a
   product decision, schema/migration, cross-owner change, or hosted evidence as explicit bounded
   follow-ups rather than silently changing behavior.

## Responsibilities

- BACKEND owns source/process discovery, implementation, backend validation, and integration.
- One reusable read-only ARCHITECT subagent may independently review ownership/import reachability.
- One reusable QA subagent may validate the complete corrected workstream, including loopback
  persistence/readback only where the selected correction changes it.
- Use no more than three subagents for this workstream unless the user explicitly approves more;
  reuse them for follow-up rather than creating one per flow or validator.

## Evidence And Acceptance

- The final process map distinguishes product choices with shared persistence from actual parallel
  backend truth, so multiple entrypoints alone are not misclassified as duplication.
- Every deletion or consolidation is source-reachable, preserves its living consumer, and has
  focused regression proof.
- Every performance claim includes a current local measurement and states its boundary; no fabricated
  latency, query count, or cost estimate.
- Existing canonical entities, server action/review contracts, and transaction boundaries remain the
  only owners after a correction.
- Affected validators, targeted lint/type checks, build/integrity, and scoped diff checks pass.
- Run local persistence/readback or browser evidence only when the changed backend contract warrants
  it; do not rerun paid OpenAI or broad browser acceptance without a source-proved regression.
- Managed local runtime is restored to the accepted ordinary `providerMode: real` state if the task
  touches it. No hosted Supabase mutation or paid OpenAI call occurs.

## Stop Conditions

- A finding would alter runner-visible business policy, coaching behavior, review/confirm semantics,
  destructive/history behavior, privacy retention, auth policy, or frontend rendering contract.
- A correct fix requires a schema migration, a new RPC, new external infrastructure, hosted data,
  or a paid provider call.
- No source or measured evidence establishes that a suspected path is redundant or a bottleneck.

In these cases, retain evidence and return one precise next owner or product decision; do not ship a
compatibility workaround.

## 2026-07-21 Backend Result

- The audited runtime families converge on their existing canonical owners. Separate lifecycle,
  import/export, manual, generated-plan, and evidence entrypoints remain intentional where their
  authorization, review, or mutation policies differ.
- The manual-workout history guard redundantly queried four evidence tables even though result
  assets are the foreign-key root of metrics, comparisons, and insights. The guard now queries that
  canonical root once: measured loopback requests fell from four to one, while read-only orphan
  checks remained zero.
- Unreachable public wrappers for active-plan export, request-user lookup, and reviewed copy/paste
  were removed. Their live direct owners and proof-only `ForUser` seams remain reachable without a
  parallel runtime capability.
- The retained request-user `require*` seam now returns a persisted runner ID or throws; nullable
  admin resolution remains confined to optional `get*` consumers instead of leaking into export,
  upload, settings, and training mutations.
- Archived-log recovery remains intentionally live because it preserves accepted historical truth;
  no schema, RPC, cache, observability system, provider call, or runner-visible policy changed.
- Repeated profile reads in training route loaders remain a bounded Backend performance candidate,
  but current mixed-state timing evidence does not justify changing request/auth ownership yet.
- Admin Capture now has one canonical backend read contract for the selected filtered page and
  complete status counts independent of page limits. The route makes one server-function read and
  declares validated search as a loader dependency; the repository executes one page read plus five
  parallel exact-count reads, so this is a correctness and request-boundary reduction rather than a
  claimed database-query reduction. Deterministic `100 Active + 100 Done` proof and desktop/375px
  SPA navigation proof passed with disposable loopback rows cleaned to zero.

## Exit Criteria

The program closes when the audited process map is current, all same-owner proven corrections are
accepted, measurable claims are backed by local evidence, and remaining risks are explicitly routed
without reopening frozen behavior.

## 2026-07-21 Architecture Closeout

**Program verdict: CLOSED.** The audited process map converges on one canonical owner per material
backend decision. Source-proved same-owner corrections are accepted, retained boundaries remain
intentional, and no second Admin Capture read model or hidden compatibility path is reachable.

The final Admin Capture correction returns one selected filtered page plus independent complete
status counts through one authoritative route server-function read. The measured request-boundary
claim is exactly two server-function reads reduced to one. Repository work remains one page read
plus five parallel exact status-count reads; this program does not claim a database-query reduction.

`Implementation DoD: Passed.` `Global QA Acceptance: Passed` for this bounded program. The accepted
inventory covers the 100-new/100-done discriminator, filters/counts, auth/error shapes, desktop and
exact 375px SPA navigation, request-boundary proof, cleanup, targeted lint, production build,
build-output integrity, and scoped diff hygiene. Broader release QA and hosted behavior remain
separate gates.

Repeated profile reads remain an unselected performance candidate because current evidence does not
prove a safe ownership change. Archived-log recovery remains a required history boundary. Neither
is unfinished work in this program.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Keep the completed Backend Business-Process Canonicalization And Performance Program closed and
select any future product, release, or optimization track independently.

Stage:
PRODUCT prioritization / post-program boundary.

Constraints:
- Do not reopen frozen Runner Core behavior or accepted Admin Capture correctness without a concrete
  regression.
- Do not infer a database-query reduction from the accepted two-to-one server-function result.
- Start future optimization only from new source and measured evidence with one owner and one
  validation story.
```
