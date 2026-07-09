# Hito Work Dashboard

Generated: 2026-07-07T17:55:50.242Z
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

<code>in_progress</code>

#### Task
Align active-plan workout content-editability readback before the next design batch.

<sub><code>STAGE</code></sub>

<code>BACKEND implementation / active-plan content-edit capability correction.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Source Of Truth: Workout types: Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills,

<sub><code>NEXT ROLE</code></sub>

<code>backend</code>

---

### 3. [Manual Workout Authoring And User-Built Plans](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Repair manual workout template behavior around editable structure defaults, user targets, saved templates, and per-user built-in template visibility.

<sub><code>STAGE</code></sub>

<code>BACKEND implementation / manual template contract correction.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Source Of Truth: Backend owns manual workout registry truth, review/confirm, validation, persistence, saved

<sub><code>NEXT ROLE</code></sub>

<code>backend</code>

---

### 4. [Hito DS Information Architecture And Specimen Contract](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Hold Hito DS after accepted workout slice visual/runtime proof.

<sub><code>STAGE</code></sub>

<code>ARCHITECT holding / post-workout-slice visual/runtime closeout.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Root Cause: Workout color roles, manual constructor timeline adoption, and the cache-runtime workout-slice

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

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

### 6. [Hito DS External Reuse And Theme Contract](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md>)

<sub><code>STATUS</code></sub>

<code>backlog</code>

#### Task
Define and implement a safe external reuse layer for Hito DS so other projects can use Hito primitives and tokens without destabilizing the Hito product.

<sub><code>STAGE</code></sub>

<code>ARCHITECT plan / external reusable themeable Hito DS contract.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Context: which Hito primitives are stable enough to reuse;

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 7. [Hito Source-Size Governance And Cleanup Plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Align active-plan workout content-editability readback before the next design batch.

<sub><code>STAGE</code></sub>

<code>BACKEND implementation / active-plan content-edit capability correction.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Inline Editable Pattern Closeout - 2026-07-07

<sub><code>NEXT ROLE</code></sub>

<code>backend</code>

## Safety Notes

- Default refresh is non-mutating for Admin because it uses `--dry-run`.
- Use `npm run work:dashboard:apply` only when you intentionally want to upsert repo-derived work
  items into Admin.
- This file is generated by `scripts/hito-work-dashboard.mjs`.
- You can edit the script, not this generated dashboard, if the format needs to change.
- Do not delete `qa-artifacts/` or logs from this helper; artifact cleanup has its own policy.
