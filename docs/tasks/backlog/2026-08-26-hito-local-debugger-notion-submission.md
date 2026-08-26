# Local Debugger Notion Submission

- **Work Item ID:** HITO-246
- **Status:** Tracked implementation
- **Type:** Maintenance
- **Priority:** High
- **Owner:** BACKEND → FRONTEND DevTools → QA → PRODUCT
- **Primary Area:** Developer Tools
- **Epic:** None; standalone Developer Tools maintenance
- **Archive Intent:** Retain as the technical contract and terminal evidence for the local-only seam

## Outcome

From the loopback-only Debugger and Screen capture surfaces, Ivan can explicitly submit one Task,
Bug, or Content bug to the canonical `Hito Running` Notion Tasks data source. The interaction never
creates an Admin Capture row, automatic batch, production route, production writer, or browser-held
Notion credential.

## Demonstrated Cause

`LocalUiInspectorBatchReview` and `LocalScreenCaptureFlow` currently end at
`copyTextToClipboard(...)`. Their visible `Generate prompt` actions cannot write to Notion because
no server-owned local Notion seam exists.

## Accepted Contract

- One loopback sidecar is the only writer. Vite `serve` and the managed local QA runtime start that
  same sidecar beside the application port. It loads the existing operator-owned Notion credential
  process-locally and is absent from the production server and route graph.
- The browser submits only a bounded payload: capture kind, local pathname, page title, viewport,
  theme, selected target evidence, and Ivan's note. Query strings, hashes, cookies, sessions,
  credentials, screenshots, product data, and arbitrary page payloads are excluded.
- The explicit choices are `Task`, `Bug`, and `Content bug`. Bug and Content bug map to Notion
  `Category: Bug`; Content bug remains explicitly labelled in page evidence. Task maps to
  `Category: Maintenance` until Product triage.
- Every new page enters `Backlog / Intake / PRODUCT` with `Priority: Medium`. Product confirms final
  scope, area, owner, and priority before admission.
- A stable SHA-256 source key covers the normalized material capture. Submitting the exact same
  capture again returns the existing page instead of creating a duplicate.
- Prompt copy remains available as a local fallback. Submission is never automatic.

## What Not To Touch

- No Supabase table, migration, Admin Capture writer, production API route, deployment environment
  variable, observability event, or second tracker.
- No automatic task creation from hover, selection, capture, page load, or prompt generation.
- No screenshot upload or raw URL/search/hash retention.
- No Product, Runner, Calendar, provider, Auth, or user-data mutation.

## Validation

- The deterministic validator passes normalization, redaction, mapping, fingerprint stability,
  deduplication, create/error responses, and the exact Task/Bug/Content bug contract.
- The managed loopback browser proves Inspector and Screen controls, explicit review, success,
  exact deduplication, safe failure with the draft retained, desktop layout, and exact 375px mobile
  containment.
- One disposable live Content bug was created, read back with the expected lifecycle fields,
  submitted again as the same Notion page, and then trashed by exact page ID. No QA page remains in
  the backlog.
- The production build passes. Its deployable output contains the dormant loopback-gated DevTools
  client but no Notion token, API host, data-source ID, credential path, sidecar server, or local
  writer middleware.
- Focused ESLint, Prettier, the task validator, and `git diff --check` pass. Full TypeScript remains
  red from inherited checkout-wide diagnostics; none is owned by the added capture server, client,
  actions, validator, or declaration file.

## Stop Boundary

Any need for automatic batching, attachments, screenshot storage, production capture, a new Notion
schema property, or a second persistence system returns to PRODUCT on this same Task.
