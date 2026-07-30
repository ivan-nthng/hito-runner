# Hito Release Quality Sweep Runbook

## Status

Active.

## Purpose

Use this runbook before a runner-facing release or a substantial product handoff. It turns an
agent-assisted review into a finite, evidence-based loop:

`scope -> audit -> findings batch -> fix forward -> independent QA -> human review`

The goal is not to prove that no bug can exist. The goal is to find and resolve the meaningful
known defect classes for the agreed release boundary, then give a human a small, trustworthy
review packet.

## Current And Future Environments

Today, a sweep runs against the canonical local managed runtime, loopback Supabase, reusable QA
testers, and task-scoped evidence under `qa-artifacts/`. This is the current safe equivalent of a
PR preview environment.

A future AWS PR environment may use the same protocol, but it must be isolated per PR, contain no
production user data, use least-privilege test credentials, expose its provider mode, and be
destroyed after the review window. Introducing AWS is an operations task, not a prerequisite for
using this runbook locally.

## Principles

- Fix the first incorrect owner, never only the visible symptom.
- Audit one bounded capability or ownership family at a time.
- Keep one active implementation writer per source boundary. Reviewers are read-only.
- Prefer deterministic fixtures and local test data. Paid providers are exceptional evidence, not
  a default test runner.
- A finding needs a severity, reproducible evidence, canonical owner, and expected versus actual
  behavior before it enters a fix batch.
- Delete a replaced path only after a reachability check. Do not create a compatibility path merely
  to make a sweep pass.
- A passing owner-level check is not automatically release acceptance.

## Admission

Product opens a sweep only after naming:

1. The release capability and bounded source owners.
2. The expected runner-visible behavior and preserved contracts.
3. The environment and allowed mutations.
4. The paid-provider and time budget, if any.
5. The stop condition and the human who will review the final packet.

The sweep owner records a short Execution preflight before the first write. The preflight names the
root-cause evidence already available or the exact discriminator to obtain.

Do not start a sweep when another writer is actively changing the same source boundary, when the
runtime provider mode is unknown, or when the tested revision is not identified.

## Roles

| Role | Responsibility |
| --- | --- |
| PRODUCT | Defines scope, release intent, budgets, and product decisions. Does not implement or self-accept another owner's work. |
| Execution owner | Audits, fixes its bounded findings batch, removes replaced code where safe, and integrates verification. |
| ARCHITECT | Read-only review of ownership, reachability, source-of-truth, and cross-boundary risk. |
| QA | Independent adversarial validation. It does not implement fixes. |
| RUNNING COACH | Reviews coaching quality only when the release changes generated workout semantics or needs plan-quality evidence. |
| Human reviewer | Reviews the final bounded diff, residual risk, and release recommendation. Only this review may authorize merge/release. |

The execution owner may use read-only subagents for ARCHITECT and QA evidence. Do not assign two
writing agents to the same files.

## Finding Record

Every accepted finding must include:

| Field | Required content |
| --- | --- |
| ID | Stable task-local identifier. |
| Severity | `P0`, `P1`, `P2`, or explicitly non-blocking observation. |
| Surface | Runner flow, backend contract, persistence, DS primitive, performance, security, or source hygiene. |
| Reproduction | Smallest safe steps, fixture, log event, or source discriminator. |
| Expected / actual | The contract and the observed violation. |
| Canonical owner | First incorrect source-of-truth boundary. |
| Evidence | Local artifact, command output, screenshot, or source location. |
| Fix state | Open, fixed pending verification, verified, deferred by Product, or blocked. |

Use PR comments for reviewable findings when a PR exists. Keep routine screenshots and browser
artifacts under `qa-artifacts/` according to the QA artifact policy; do not commit them by default.

## Sweep Loop

### 1. Snapshot And Safety Preflight

- Record the branch, revision, dirty-worktree boundary, active runtime URL, provider mode, and
  database target.
- Verify loopback-only storage for local QA and the managed server status.
- Select or reset only named reusable QA testers. Never use an admin or an unclassified account.
- Confirm that the planned browser, provider, persistence, and cleanup actions are authorized.

### 2. Read-Only Audit

The execution owner and independent reviewers look for the full defect family, not just the report
that started the sweep:

- ownership and source-of-truth conflicts;
- duplicate or retired runtime paths;
- stale templates, docs, prompts, and compatibility contracts;
- request -> normalization -> canonical truth -> readback congruence;
- error, cancellation, retry, privacy, and empty-state paths;
- browser, keyboard, mobile, reduced-motion, performance, and accessibility regressions where the
  scope is user-facing;
- unbounded queries, N+1/readback, payload size, and timeout risks where the scope is backend.

The audit produces one findings batch. A vague concern is not a finding until it has evidence.

### 3. Batch Selection

- Fix every verified `P0` and `P1` within the assigned owner boundary.
- Include related `P2` findings only when they share the same root cause or their removal makes the
  canonical correction smaller.
- Defer unrelated `P2` findings to the backlog with evidence and an owner.
- Stop for Product if resolving a finding requires a new coaching rule, user-visible policy, data
  retention decision, or external-integration contract.

### 4. Fix Forward

The execution owner makes one coherent patch for the selected batch:

- reuse the canonical owner;
- remove obsolete helpers, branches, fixtures, or docs made redundant by the correction;
- do not add a fallback, a second store, a silent repair, or route-local workaround;
- preserve all explicitly named contracts;
- add a minimized regression discriminator when the defect is deterministic and safe to retain.

### 5. Independent QA

QA validates the changed contract and searches the adjacent regression class. The final inventory
must list every executed check and every required check not run:

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |

Use the smallest meaningful matrix. Do not run unrelated known-red repository commands as theatre.
For browser work, include Browser Path Preflight, desktop, exact 375px mobile, and focus/keyboard
coverage where relevant. For backend work, include persistence/readback only when the changed
contract reaches those boundaries.

### 6. Fix-Forward Limit

Run at most three implementation-to-QA cycles for one sweep by default.

Continue only when a newly discovered failure is in the same bounded owner family and has a clear
root-cause path. Stop and return a handoff when the new finding belongs to another owner, needs a
Product decision, requires unsafe/hosted mutation, or exceeds the agreed budget.

The limit prevents a night run from turning into unbounded agent activity. A stopped sweep is useful
when it explains exactly what is still unknown.

## Required Matrices By Scope

### Backend / Contract

- Root-cause discriminator and negative inputs.
- Canonical parse, normalization, validation, review, and confirm boundaries affected by the patch.
- Persistence/readback/export/import only when those paths are in scope.
- Privacy/redaction and error/cancellation behavior where requests or user content are involved.
- Targeted lint, relevant validators, build/integrity when executable runtime imports changed.

### Frontend / Product

- Real state transitions, failure/retry/cancel behavior, and no duplicate dispatch.
- Desktop and exact 375px mobile, light/dark when relevant, overflow, keyboard, focus return, and
  Escape.
- Fixture-first data proof. A paid provider call requires a separate evidence reason and budget.
- Browser console and failed-request ledger, plus safe test-user cleanup if persistence is used.

### Design System

- Interactive Demo and inert Variant boundaries on `/hitoDS`.
- Shared-consumer review, responsive surfaces, focus/portal containment, reduced motion, and
  Safari-specific risk when overlays or motion change.
- No Product workaround can be accepted as proof of a shared primitive correction.

### AI-Authored Training Plans

- Fixture/validator matrix before any paid dispatch.
- One user action equals at most one provider dispatch.
- Signed review before explicit confirm, then exact persisted readback if confirmation is in scope.
- Running Coach review only for plan quality or coaching-semantics changes.
- Raw prompts, provider payloads, secrets, and runner free text never enter QA artifacts.

## Paid Provider And Performance Policy

- Default to no paid calls.
- Authorize a paid call only for a specific uncertainty that fixtures, source, and deterministic
  proofs cannot resolve.
- Set an explicit maximum dispatch count, model, timeout expectation, and cleanup boundary before
  dispatch.
- Retain only redacted correlation, timing, usage, and cost evidence. Never retain raw personal
  context or provider transcripts in routine artifacts.
- A provider failure is a finding, not permission for automatic retries. Reproduction must remain
  bounded and deliberate.

## Release Exit Criteria

A sweep is ready for human review only when all are true:

- Every verified `P0` and `P1` is fixed and independently revalidated, or explicitly blocked by a
  documented Product decision.
- The final independent pass finds no new `P0` or `P1` in the agreed scope.
- The required test inventory passes, and every omission states its coverage consequence.
- Source hygiene is complete for the patch: no active duplicate path, stale contract, or failed
  attempt remains without a named reason.
- Test data and temporary accounts are cleaned up; admins and non-test users are untouched.
- The final report distinguishes `Implementation DoD` from `Global QA Acceptance`.
- The working revision, evidence locations, residual risks, and merge recommendation are explicit.

Failure to meet one of these conditions yields `Blocked` or `Failed`, never an optimistic pass.

## Human Review Packet

The night sweep returns one compact packet for the morning review:

1. Capability and revision reviewed.
2. Findings discovered, fixed, deferred, and blocked.
3. Changed files and deleted/replaced paths.
4. Validation table and evidence links.
5. Remaining risks, including platform/browser/provider gaps.
6. Recommendation: ready for human code review, needs another owner, or not releasable.

The human reviewer decides merge and deployment. Agents do not merge, deploy, apply hosted
migrations, delete production data, or make unbounded paid-provider calls during a sweep.

## Recurring Cadence

- Morning: human review, product decisions, merge and release authorization.
- Afternoon: approved feature work and bounded implementation.
- Night: one or more non-overlapping sweeps on pre-approved scopes.
- Next morning: review packets, not a stream of raw agent logs.

## Relation To Existing Policy

This runbook operationalizes, but does not replace, the root-cause, Execution preflight,
Definition-of-Done, independent-QA, artifact-retention, and Global QA rules in `AGENTS.md`, the QA
role policy, and the project Definition of Done.
