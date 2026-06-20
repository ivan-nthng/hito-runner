# Hito Work Dashboard

Generated: 2026-06-20T17:57:50.669Z
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

### 2. [Hito Stack Simplification Strike](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-07-hito-stack-simplification-strike.md>)

<sub><code>STATUS</code></sub>

<code>in_progress / G20 accepted; source-proof holding</code>

#### Task
Resume Hito Stack Simplification only when a concrete cleanup candidate is source-proved.

<sub><code>STAGE</code></sub>

<code>ARCHITECT source-proof holding / no safe next implementation gate selected.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

G20 Closeout — 2026-06-20: complete / G20 accepted; source-proof holding.

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 3. [Running Plan Creation Engine Rebuild](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md>)

<sub><code>STATUS</code></sub>

<code>in_progress</code>

#### Task
Resume bounded cleanup routing through the simplification strike after the accepted benchmark-backed pace truth closeout.

<sub><code>STAGE</code></sub>

<code>ARCHITECT checkpoint / post-benchmark-truth closeout and cleanup return.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Benchmark-Backed Pace Truth Closeout — 2026-06-17: Accepted / backend seam, frontend wiring, and runner-facing QA proof all passed.

<sub><code>NEXT ROLE</code></sub>

<code>architect</code>

---

### 4. [Manual Workout Authoring And User-Built Plans](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)

<sub><code>STATUS</code></sub>

<code>in_progress — manual Add, personal saved templates, manual Copy/Paste, manual Delete/Clear, manual Move Workout, Backend / Export Slice 7 manual active-plan JSON/Markdown export, universal active-plan Add/Clear/Move edi...</code>

#### Task
Validate the persisted future manual workout edit backend seam before frontend exposes `Edit training` on workout detail.

<sub><code>STAGE</code></sub>

<code>QA validation / persisted future workout editing review-confirm seam.</code>

<sub><code>LAST VISIBLE NOTE</code></sub>

Future Workout Detail Actions And Persisted Edit Contract — 2026-06-15: Accepted as product/architecture contract; backend implementation completed and awaiting QA.

<sub><code>NEXT ROLE</code></sub>

<code>qa</code>

---

### 5. [Hito DS Information Architecture And Specimen Contract](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>)

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

## Safety Notes

- Default refresh is non-mutating for Admin because it uses `--dry-run`.
- Use `npm run work:dashboard:apply` only when you intentionally want to upsert repo-derived work
  items into Admin.
- This file is generated by `scripts/hito-work-dashboard.mjs`.
- You can edit the script, not this generated dashboard, if the format needs to change.
- Do not delete `qa-artifacts/` or logs from this helper; artifact cleanup has its own policy.
