# Hito Work Dashboard

Generated: 2026-07-29T12:31:31.863Z
Mode: deprecated legacy projection

This file is a retained snapshot of the former active-plan projection. It is not an operational
queue and must not be regenerated to determine current status. Read canonical item metadata in
[`docs/tasks/backlog/`](tasks/backlog/) instead.

## Operational Boundary

The legacy generator still reads `docs/plans/active/`; its output cannot represent the canonical
queue. Updating that tooling is a separate Backend/Admin mirror boundary, not part of this
documentation-only normalization.

## Admin Commands

```bash
# Dry-run repo-derived work-item import
npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000

# Live repo-derived work-item import
npm run import-admin-backlog-work-items -- --timeout-ms 30000

# Validate Admin Backlog capture/import rules
npm run validate-admin-capture-backlog
```

## Useful Daily Commands

```bash
npm run qa:server:status
npm run qa:server:restart
npm run build
npm run lint
npm run artifact:hygiene
npm run validate-manual-workout-authoring
node --import tsx ./scripts/validate-plan-authoring-doctrine.ts
node --import tsx ./scripts/validate-running-plan-engine-confirm.ts
```

## Last Refresh

- Skipped by `--no-admin`.

## Legacy Dashboard Projection

The operational queue is [`docs/tasks/backlog/README.md`](tasks/backlog/README.md). Do not use the
entries below to decide what is currently active, ready, or blocked: they are a legacy repository
projection retained until each linked record is normalized or archived with its inbound links.

## Legacy Work Inventory

### 1. [Admin UI Capture And Backlog Implementation Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>legacy metadata debt</code>

<sub><code>STATUS</code></sub>

<code>backlog</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>legacy metadata debt / legacy metadata debt</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>legacy metadata debt</code>

<sub><code>METADATA STATE</code></sub>

<code>legacy metadata debt</code>

#### Task
Decide whether to reopen the deferred Admin capture overlay as a distinct workstream from the accepted Local Inspector.

<sub><code>STAGE</code></sub>

<code>PRODUCT decision / Admin route-spanning capture overlay remains deferred; the accepted Local Inspector is local-only and does not persist to Admin.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Truth

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 2. [Running Plan Creation Engine Rebuild](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>legacy metadata debt</code>

<sub><code>STATUS</code></sub>

<code>completed</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>legacy metadata debt / legacy metadata debt</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>legacy metadata debt</code>

<sub><code>METADATA STATE</code></sub>

<code>malformed metadata: Work Item ID, Owner, Scope, Archive Intent, Exact Handoff Prompt</code>

#### Task
Keep the accepted running-plan creation engine and completed post-confirm workout-ownership reconciliation closed while future release or product work proceeds separately.

<sub><code>STAGE</code></sub>

<code>ARCHITECT source-of-truth closeout / engine and post-confirm ownership accepted.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Source Of Truth: Add, Clear, Move, Copy, and Edit are distinct operations with row-level capabilities.

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 3. [Manual Workout Authoring And User-Built Plans](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>legacy metadata debt</code>

<sub><code>STATUS</code></sub>

<code>completed</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>legacy metadata debt / legacy metadata debt</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>legacy metadata debt</code>

<sub><code>METADATA STATE</code></sub>

<code>legacy metadata debt</code>

#### Task
Keep the accepted backend-owned manual-template catalog and full AI/manual editor parity closed.

<sub><code>STAGE</code></sub>

<code>FRONTEND implementation and QA / completed.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Completed Backend Prompt: warm-up;

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 4. [Hito DS Information Architecture And Specimen Contract](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>legacy metadata debt</code>

<sub><code>STATUS</code></sub>

<code>completed</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>ARCHITECT / DESIGNER / FRONTEND / QA / legacy metadata debt</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>legacy metadata debt</code>

<sub><code>METADATA STATE</code></sub>

<code>malformed metadata: Work Item ID, Scope, Archive Intent, Owner, Exact Handoff Prompt</code>

#### Task
Close the Hito DS information architecture and conformance work after accepted reference-truth parity.

<sub><code>STAGE</code></sub>

<code>FRONTEND reference-truth implementation and integrated QA / completed.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Root Cause: Hito DS is visibly established, but current product consumers and the reference surface do not yet

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 5. [Hito Docs And Artifact Compression](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-20-hito-docs-and-artifact-compression.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>legacy metadata debt</code>

<sub><code>STATUS</code></sub>

<code>backlog</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>legacy metadata debt / legacy metadata debt</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>legacy metadata debt</code>

<sub><code>METADATA STATE</code></sub>

<code>legacy metadata debt</code>

#### Task
Hold docs/artifact cleanup after QA-passed E13/E14 manual-workout QA image compression apply.

<sub><code>STAGE</code></sub>

<code>ARCHITECT evidence-gated hold / no material same-owner cleanup candidate is currently selected.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Source Of Truth: Local gitignored `qa-artifacts/` is disposable by default only through the approved pragmatic TTL

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 6. [Hito DS Discoverability, Agent Contract, And Safe Reuse Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>legacy metadata debt</code>

<sub><code>STATUS</code></sub>

<code>backlog</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>legacy metadata debt / legacy metadata debt</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>legacy metadata debt</code>

<sub><code>METADATA STATE</code></sub>

<code>legacy metadata debt</code>

#### Task
Select a new bounded discoverability or safe-reuse outcome without reopening accepted Inspector, typography, or heart-rate guidance work.

<sub><code>STAGE</code></sub>

<code>PRODUCT selection / the former Settings-bounds blocker is superseded by accepted backend and frontend heart-rate guidance work; broader Global QA remains separate.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Next Gate

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 7. [Hito Source-Size Governance And Cleanup Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>2026-06-30-hito-source-size-governance-and-cleanup-plan</code>

<sub><code>STATUS</code></sub>

<code>backlog</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>architect / docs-source-of-truth</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>hito-stack-simplification / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>retain_in_place</code>

<sub><code>METADATA STATE</code></sub>

<code>malformed metadata: Exact Handoff Prompt</code>

#### Task
Hold further source cleanup until one current owner-scoped batch has exact reachability evidence.

<sub><code>STAGE</code></sub>

<code>Ranks 1-4 are complete. Further cleanup remains evidence-gated until a new owner-scoped candidate has exact reachability evidence and independent review.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Initial Audit Baseline - 2026-07-25: 137 tracked changed paths;

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 8. [Runner Core Freeze And Design Polish Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-07-20-runner-core-freeze-and-design-polish-plan.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>legacy metadata debt</code>

<sub><code>STATUS</code></sub>

<code>completed</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>legacy metadata debt / legacy metadata debt</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>legacy metadata debt</code>

<sub><code>METADATA STATE</code></sub>

<code>legacy metadata debt</code>

#### Task
Close the frozen Runner Core and its first bounded design-polish batch.

<sub><code>STAGE</code></sub>

<code>Completed / Runner Core freeze and first design-polish closure.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Decision

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 9. [Hito Branded Auth Email Delivery](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-07-21-hito-branded-auth-email-delivery.md>)

<sub><code>WORK ITEM ID</code></sub>

<code>2026-07-21-hito-branded-auth-email-delivery</code>

<sub><code>STATUS</code></sub>

<code>in_progress</code>

<sub><code>OWNER / SCOPE</code></sub>

<code>designer / auth-app-shell-admin-boundary</code>

<sub><code>BATCH / FRONTEND LANE</code></sub>

<code>none / none</code>

<sub><code>ARCHIVE INTENT</code></sub>

<code>archive_when_closed</code>

<sub><code>METADATA STATE</code></sub>

<code>canonical metadata</code>

#### Task
Create the Hito-branded Supabase passwordless sign-in email template now, then apply and prove hosted delivery once approved SMTP credentials and sender identity are available.

<sub><code>STAGE</code></sub>

<code>DESIGNER template direction and versioned email source / hosted delivery prerequisites pending.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Problem Definition

<sub><code>NEXT ROLE</code></sub>

<code>designer</code>

## Safety Notes

- Default refresh is non-mutating for Admin because it uses `--dry-run`.
- Do not use this snapshot or its legacy generator for lifecycle decisions.
- Admin remains a deterministic mirror; a later Backend/Admin gate may update its projection from
  canonical backlog metadata.
- Do not delete `qa-artifacts/` or logs from this helper; artifact cleanup has its own policy.
