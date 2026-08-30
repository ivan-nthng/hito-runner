# HITO-301 — Implement Hito Capability Broker Admission Core

- Work Item ID: `HITO-301`
- Status: Done
- Type: Maintenance
- Priority: Highest
- Owner: BACKEND
- Primary Area: Platform
- Epic: `recover-hito-delivery-operating-model`
- Lifecycle: [Live Notion Task](https://app.notion.com/p/3ccfe5f58cf581d4a89be51d2f22664b)
- Archive Intent: retain the broker contract, implementation receipt, focused proof and rollback.

## Task

Implement the smallest local non-daemon broker seam for pre-work capability admission, immutable
intent, acknowledged delivery, exact artifact manifest, one-time re-home and cleanup.

## User Report

Agents repeatedly report no access or hidden approval only after work starts, retry across roles and
require Ivan to relay unchanged operations.

## Evidence And Observed Behavior

HITO-292/HITO-296 proved divergent host capabilities, unacknowledged sends, wrong cwd and stale
artifact acceptance while the canonical root host could perform the same admitted operations.

## Expected Behavior

Capability is resolved before dependent work. One admitted operation may re-home once while Task,
owner, scope and authority remain unchanged. Failures stop at the exact boundary without routine
user approval.

## Source Investigation And Root Cause

Role identity was treated as host capability and handoff as delivery. The repair is one bounded
execution seam, not more prose, retries, roles or services.

## What Not To Touch

No product import, daemon, queue, registry, datastore, secret store, second tracker, schema/provider
work or unrelated dirty bytes.

## Validation Expectations

Focused tests cover success, acknowledgement, wrong cwd, stale source/artifact, missing capability,
one-time re-home, lease cleanup and fail-closed behavior.

## Implemented Boundary

The local non-daemon core is `scripts/lib/hito-capability-broker.mjs`. It exports four versioned
shapes: immutable execution intent, caller-supplied destination acknowledgement, capability
admission receipt and execution artifact manifest. The core:

- resolves repository, worktree and cwd real paths and binds exact source path SHA-256/mode values;
- requires caller-supplied live Task and source-state readbacks before probing exactly one requested
  capability;
- validates acknowledgement against the Task, destination, intent and source-manifest hashes;
- issues one operation-local filesystem lease only after admission and permits one unchanged re-home;
- derives the sealed executor, environment and proof identities from the immutable intent, live
  admission receipt and explicit destination acknowledgement, rejecting every conflicting caller
  value;
- binds runtime/artifact identity, rollback, cleanup, omissions and the next boundary without
  executing the admitted privileged operation.

It contains no Notion, Git, Docker, Supabase, browser, provider or deployment implementation. Those
remain caller-owned runbook seams. It cannot fabricate a destination acknowledgement.

## Focused Proof — 2026-08-30

`npm run validate-hito-capability-broker` uses disposable temporary directories and proves admitted
success, missing/unknown capability, missing/mismatched acknowledgement, wrong cwd/repository,
source hash/mode and artifact motion, live scope/authority drift, one-time re-home exhaustion and
success, lease contention, exact token-bound release and final cleanup. The independent QA
fix-forward additionally proves that forged executor host/session, environment, proof layer and an
otherwise valid but different destination acknowledgement all fail before a manifest is sealed;
the positive manifest readback contains only the admitted values. The adjacent verifier fix retains
the complete acknowledged identity in the sealed admission receipt and rejects independently
resealed manifests whose acknowledgement hash, destination owner or destination session differs.
Scoped ESLint, Prettier, Node syntax checks and diff hygiene are the proportional static boundary;
no product build is required because the module has no product/runtime import or bundle consumer.

Independent QA accepted frozen manifest
`29eec9d60380982a38e16dcedc6ae9f693667dd13e56d8aab4420da8fe03d736`. All four owned path
hashes matched before and after replay, the index remained empty, the dependency lockfile and
28-path protected inventory did not move, and every forged or resealed executor, environment,
proof-layer and acknowledgement identity mutation failed closed. HITO-301 is terminal.

## Rollback And Omissions

Rollback is removal of the package command and the two broker files; no data, runtime, credential,
service or generated artifact requires migration. No privileged capability, destination delivery,
browser, Supabase, provider, Git lifecycle or release operation was executed. Integration into a
specific privileged seam remains a later separately admitted operation after independent QA.
