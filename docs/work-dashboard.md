# Hito Work Dashboard

Generated: 2026-07-21T23:16:19.411Z
Mode: dashboard-only

Keep this file open in a side pane. Re-run one command below whenever you want the Admin work-item
mirror and this dashboard to refresh.

## Update Commands

```bash
# Safe refresh: Admin dry-run + validator + update this Markdown file
npm run work:dashboard

# Dashboard-only refresh: do not touch Admin at all
npm run work:dashboard:no-admin

# Live Admin sync: upsert repo-derived tasks into Admin + update this Markdown file
npm run work:dashboard:apply

# Direct node fallback, if npm scripts are unavailable
node scripts/hito-work-dashboard.mjs
node scripts/hito-work-dashboard.mjs --no-admin
```

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

## Active Work

### 1. [Admin UI Capture And Backlog Implementation Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Define the portable Hito Debugger overlay and capture API contract.

<sub><code>STAGE</code></sub>

<code>ARCHITECT / DESIGNER spec / portable debugger overlay, API boundary, and Hito DS interaction layer</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Truth

<sub><code>NEXT ROLE</code></sub>

<code>DESIGNER</code>

---

### 2. [Running Plan Creation Engine Rebuild](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md>)

<sub><code>STATUS</code></sub>

<code>completed</code>

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

<sub><code>STATUS</code></sub>

<code>completed</code>

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

<sub><code>STATUS</code></sub>

<code>completed</code>

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

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Hold docs/artifact cleanup after QA-passed E13/E14 manual-workout QA image compression apply.

<sub><code>STAGE</code></sub>

<code>ARCHITECT holding / post-apply closeout and next-gate safety review.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Source Of Truth: Local gitignored `qa-artifacts/` is disposable by default only through the approved pragmatic TTL

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 6. [Hito DS Discoverability, Agent Contract, And Safe Reuse Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md>)

<sub><code>STATUS</code></sub>

<code>backlog</code>

#### Task
Select the next bounded Hito DS discoverability, agent-contract, or external-reuse gate after the Local Inspector child task's accepted owner-level closeout.

<sub><code>STAGE</code></sub>

<code>Inspector child closed / broader discoverability remains Product-selected backlog.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Next Gate

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 7. [Hito Source-Size Governance And Cleanup Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Hold source-size cleanup after the pre-commit simplification and release-bundle checkpoint.

<sub><code>STAGE</code></sub>

<code>ARCHITECT holding / clean source-control boundary established.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Pre-Commit Release Bundle Checkpoint - 2026-07-21: Classified the accumulated dirty tree by canonical owner instead of treating it as one new

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 8. [Runner Core Freeze And Design Polish Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-07-20-runner-core-freeze-and-design-polish-plan.md>)

<sub><code>STATUS</code></sub>

<code>completed</code>

#### Task
Close the frozen Runner Core and its first bounded design-polish batch.

<sub><code>STAGE</code></sub>

<code>Completed / Runner Core freeze and first design-polish closure.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Decision

<sub><code>NEXT ROLE</code></sub>

<code>product</code>

---

### 9. [Hito Branded Auth Email Delivery](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-07-21-hito-branded-auth-email-delivery.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

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
- Use `npm run work:dashboard:apply` only when you intentionally want to upsert repo-derived work
  items into Admin.
- This file is generated by `scripts/hito-work-dashboard.mjs`.
- You can edit the script, not this generated dashboard, if the format needs to change.
- Do not delete `qa-artifacts/` or logs from this helper; artifact cleanup has its own policy.
