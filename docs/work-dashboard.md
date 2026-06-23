# Hito Work Dashboard

Generated: 2026-06-23T05:17:05.376Z
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

Context: `/admin/login` is a dedicated owner-admin login surface.

<sub><code>NEXT ROLE</code></sub>

<code>DESIGNER</code>

---

### 2. [Running Plan Creation Engine Rebuild](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Hold running-plan expansion after accepted benchmark-backed pace truth and archived simplification strike.

<sub><code>STAGE</code></sub>

<code>ARCHITECT holding / post-benchmark-truth and post-cleanup sequencing.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Benchmark-Backed Pace Truth Closeout — 2026-06-17: Accepted / backend seam, frontend wiring, and runner-facing QA proof all passed.

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 3. [Manual Workout Authoring And User-Built Plans](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Simplify the manual/template workout constructor anatomy using the accepted target-truth contract.

<sub><code>STAGE</code></sub>

<code>FRONTEND implementation / manual constructor simplification and runner-facing target language.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Current Status Detail

<sub><code>NEXT ROLE</code></sub>

<code>frontend</code>

---

### 4. [Hito DS Information Architecture And Specimen Contract](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Implement Hito DS specimen workbench v2 as the shared Demo/Variants contract across `/hitoDS`, including real table-header interaction parity.

<sub><code>STAGE</code></sub>

<code>FRONTEND implementation / Hito DS workbench v2 and interaction normalization.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Root Cause: `/hitoDS#calendar-workout-playground` does not feel enough like a real product desktop day.

<sub><code>NEXT ROLE</code></sub>

<code>frontend</code>

---

### 5. [Hito Docs And Artifact Compression](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-20-hito-docs-and-artifact-compression.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Hold docs/artifact cleanup after QA-passed E13/E14 manual-workout QA image compression apply.

<sub><code>STAGE</code></sub>

<code>ARCHITECT holding / post-apply closeout and next-gate safety review.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

E14 Closeout — Manual-Workout QA Image Compression Apply Validation: passed / E13 rollback-protected image apply accepted by QA; cleanup track holding.

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

## Safety Notes

- Default refresh is non-mutating for Admin because it uses `--dry-run`.
- Use `npm run work:dashboard:apply` only when you intentionally want to upsert repo-derived work
  items into Admin.
- This file is generated by `scripts/hito-work-dashboard.mjs`.
- You can edit the script, not this generated dashboard, if the format needs to change.
- Do not delete `qa-artifacts/` or logs from this helper; artifact cleanup has its own policy.
