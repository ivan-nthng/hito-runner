# Admin UI Capture And Backlog Implementation Plan

## Status

Active / `/admin/capture` Backlog v1 QA-passed, future capture phases paused

## Owner

Architect / Backend / Frontend / QA

## Last Updated

2026-05-28

## Context

The product brief defines an admin-only browser capture workflow plus one canonical admin backlog surface. The goal is to make ambiguous UI feedback concrete without turning Hito into a live visual editor, issue-tracker clone, or automatic Codex dispatcher.

Current admin truth already exists:

- `/admin/login` is a dedicated owner-admin login surface.
- `/admin/analytics` is a standalone admin workbench route, not wrapped in runner `AppShell`.
- admin data loads are backend-shaped and protected by server-side admin checks.
- local Test accounts are explicitly local/dev-only and are not production user management.

This plan adds a new internal capture/backlog workflow alongside the existing admin surface.

Current implemented phase:

- backend storage/admin capture contract is implemented and QA-proven
- `/admin/capture` Backlog v1 is implemented and QA-passed
- backend-owned backlog truth is the current source for the admin surface
- route-spanning capture overlay, screenshot upload, live editing, OpenAI, Codex auto-dispatch, and
  unified work-item/status modeling are not part of the completed v1 phase

Important product correction:

- the backlog/review queue lives in admin
- the capture layer itself must work across the whole Hito product
- admin should be able to open normal product routes, enable capture mode, select any visible product element, and save the item into the same admin backlog
- `/admin/capture` is the queue, not the only place capture can happen

## Product Contract

V1 flow:

1. Admin signs in through `/admin/login`.
2. Admin opens any accessible Hito product/admin/public page.
3. A small admin-only floating launcher appears after backend admin verification.
4. Admin clicks `Capture UI` in the launcher.
5. The page enters element-selection mode.
6. Admin selects a visible UI element.
7. Admin writes a note, classifies the capture, and chooses an optional target role/priority.
8. Backend saves the item into the admin backlog.
9. Admin opens the backlog, triages the item, and copies a role-targeted prompt into Codex manually.

V1 must not:

- edit UI live
- mutate code
- auto-send to Codex
- start agent work automatically
- expose capture tools to normal runners
- become a broad Jira/Linear replacement

## Canonical Pipeline

`admin-selected UI context -> browser capture normalization -> backend admin validation -> canonical admin_capture_items/admin_capture_assets storage -> admin backlog triage -> deterministic copy-prompt generation -> manual Codex handoff`

This follows the Hito rule: raw context is captured first, backend validates and stores canonical truth, and any future execution still requires explicit human handoff.

## Recommended Route Model

Use one new admin route for backlog/triage:

- `/admin/capture`

Responsibilities:

- canonical backlog list
- item detail/review
- status/type/role/priority filters
- copy prompt actions
- optional entry links for starting capture mode on common product routes

Do not overload `/admin/analytics` with this backlog. Add only a small navigation/link between admin surfaces if needed.

Capture mode itself is a separate cross-product layer. It should run on any Hito route after admin verification.

Primary v1 activation:

- admin-only floating launcher
- launcher action: `Capture UI`

Technical fallback:

- `?adminCapture=1`

The query flag is useful for direct links, QA, and recovery, but it should not be the normal product-owner workflow.

The overlay must remain hidden until the browser confirms admin access through a backend admin endpoint. If the admin is not authenticated, no capture UI appears.

If the target page also requires a normal runner session, v1 does not bypass that. The browser must already have whatever normal product session is needed to see that state.

## Capture Surface Decision

Choose built-in Hito capture layer for v1.

Why:

- it works across Hito routes without asking the product owner to install a browser extension
- it can reuse the existing server-owned admin auth/session boundary
- it can save directly into the canonical `admin_capture_items` backlog
- it keeps capture metadata compatible with Hito route/state concepts
- it is faster to QA than a Chrome extension, Codex plugin, or VS Code extension

Other options:

- Chrome extension:
  possible later if capture needs to work across non-Hito sites or outside the app runtime; not v1 because extension auth, packaging, screenshot permissions, and cross-origin storage add avoidable complexity
- Codex plugin:
  possible later for `Open in Codex` or richer handoff; not v1 because captured items still need human triage before agent execution
- VS Code extension:
  possible later for source-side follow-up after an item is already triaged; not v1 because the selection starts from rendered UI, not code

Canonical v1:

`in-app admin capture layer -> backend capture API -> /admin/capture backlog -> manual copy prompt`

## Admin Floating Launcher Contract

The admin capture layer should expose one small floating launcher on accessible Hito routes after backend admin verification.

Launcher behavior:

- visible only to verified admin sessions
- absent for normal users, testers, signed-out visitors, and failed admin checks
- visually quiet and clearly internal
- fixed to a safe corner with mobile-safe placement
- collapsible/minimizable
- does not cover primary product actions by default
- can be dismissed for the current page/session
- offers a direct link to `/admin/capture`

Initial launcher actions:

- `Capture UI`
- `Open backlog`
- `Hide`

Selection mode behavior:

- cursor/hover state makes selectable elements obvious
- selected element gets a clear outline
- pressing Escape exits selection mode
- clicking outside or cancelling returns to normal page behavior
- overlay ignores its own floating launcher/panel nodes
- product clicks should not fire while element selection is active

Capture panel behavior:

- opens after element selection
- shows selected element text/nearby heading/route summary
- asks for item type:
  - `Bug`
  - `Change request`
  - `Context capture`
- asks for note
- optional target role and priority can be set now or later in backlog
- primary action is `Save to backlog`
- secondary action is `Cancel`
- after save, show success with `Open backlog` and `Capture another`

This is an internal tool, but it still must feel calm and deliberate. It should not look like a public product feature.

## Designer Slice

Before the route-spanning frontend overlay implementation, Designer should define the minimal interaction model and visual contract.

Designer owns:

- floating launcher placement and collapsed/expanded states
- selection-mode affordance
- selected-element outline treatment
- capture panel anatomy
- empty/error/saving/saved states
- mobile behavior
- how the internal tool avoids covering primary product UI
- DS class/primitive recommendations

Designer must not:

- redesign admin analytics
- redesign the backlog data model
- invent a new design system
- add live editing behavior
- make capture look like a runner-facing product feature

Designer deliverable:

- one short frontend spec under `docs/tasks/frontend-specs/`
- recommended component anatomy
- QA notes for hover/select/cancel/save states

## Admin-Only Access Model

Backend owns all authority.

Required access checks:

- cross-product capture admin probe requires admin auth
- every loader/action/API for `/admin/capture` requires admin auth
- capture save API requires admin auth before accepting metadata or files
- prompt generation requires admin auth
- asset download/read URLs require admin auth or short-lived signed private URLs generated only for admin sessions
- normal runner auth, tester auth, and public sessions cannot list, read, create, update, or delete capture items

Recommended implementation:

- reuse the existing admin auth/session contract from `src/lib/admin-auth-actions.server.ts`
- expose a small admin-capture availability/probe endpoint that returns only `{ enabled: true }` or a bounded unavailable state
- extract a small shared server-only admin access helper only if needed to avoid duplicating the private `requireAdminAccess` logic already inside `admin-analytics.server.ts`
- do not change normal `/login`, product local login, Magic Link, or runner session semantics

Important auth boundary:

- the deployed admin cookie is currently only resolved as admin context on `/admin/*` and `/api/admin/*`
- cross-product capture should therefore verify admin through an `/api/admin/capture/session` or equivalent admin API request, not by turning every product route into an admin route
- normal product loaders should continue resolving normal runner/public state
- capture overlay rendering must be an additive client-side layer, never a new source of product data truth

## Storage Model

Add backend-owned Supabase storage for capture backlog truth.

### Table: `admin_capture_items`

Suggested fields:

- `id uuid primary key`
- `item_type text not null`
- `status text not null default 'new'`
- `priority text null`
- `target_role text null`
- `title text null`
- `note text not null`
- `page_url text not null`
- `route text null`
- `created_by_user_id text not null`
- `created_by_label text null`
- `viewport_width integer null`
- `viewport_height integer null`
- `element_text text null`
- `selector text null`
- `dom_path text null`
- `nearby_heading text null`
- `bounding_rect jsonb null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz null`

Allowed `item_type` values:

- `bug`
- `change_request`
- `context_capture`

Allowed `status` values:

- `new`
- `in_review`
- `ready_for_codex`
- `done`
- `archived`

Allowed `target_role` values:

- `architect`
- `backend`
- `frontend`
- `designer`
- `copy`
- `qa`
- `prompt_engineer`
- `running_coach`

Suggested `priority` values:

- `low`
- `medium`
- `high`
- `urgent`

### Table: `admin_capture_assets`

Suggested fields:

- `id uuid primary key`
- `capture_item_id uuid not null references admin_capture_items(id) on delete cascade`
- `asset_kind text not null`
- `storage_bucket text not null`
- `storage_path text not null`
- `mime_type text not null`
- `width integer null`
- `height integer null`
- `byte_size integer null`
- `checksum text null`
- `created_at timestamptz not null default now()`

Allowed `asset_kind` values:

- `viewport_screenshot`
- `full_page_screenshot`
- `element_crop`

### Storage Bucket

Add one private Supabase bucket:

- `admin-capture-assets`

Rules:

- private only
- no public URLs
- paths should include item id and asset kind, for example:
  `admin-capture/{item_id}/viewport.png`
- store screenshots as assets, not inline table blobs
- avoid storing huge payloads in `metadata`

## Captured Context Contract

The browser should send a bounded payload:

- page URL
- route/pathname
- timestamp generated client-side and server-side `created_at`
- viewport width/height
- item type
- admin note
- selected element text, trimmed and length-capped
- selector or stable DOM path
- nearby heading/section text
- element bounding rect
- optional aria label / role / test id if present
- optional small current-state metadata when safe

Screenshots:

- `viewport_screenshot` is preferred v1 if feasible.
- `element_crop` is preferred v1 if feasible.
- `full_page_screenshot` is optional later unless the chosen browser capture library proves stable.

Do not block the whole v1 if full-page capture is brittle. Save the item with textual/selector context and a clear `screenshot_unavailable` note instead.

## Screenshot And Privacy Policy

Screenshots can contain sensitive runner data. Treat them as internal private artifacts.

Rules:

- admin-only private storage
- no public signed URLs persisted in the database
- no screenshots in client bundles
- no automatic Codex upload
- no raw secrets, tokens, cookies, service keys, or provider credentials in metadata
- redact or avoid obvious password/token fields in the browser capture layer
- cap text and metadata sizes before upload
- show a warning in capture mode that screenshots may include visible page data

## Backend Responsibilities

Likely modules/routes:

- `src/lib/admin-capture.ts`
  route-facing types and server functions for list/detail/update/copy prompt
- `src/lib/admin-capture.server.ts`
  server-only admin checks, Supabase reads/writes, storage writes, prompt shaping
- `src/routes/admin.capture.tsx`
  admin backlog route
- `src/routes/api.admin.capture.items.tsx`
  multipart capture-create endpoint if screenshots are uploaded as files
- `supabase/migrations/<timestamp>_admin_capture_backlog.sql`
  tables, checks, indexes, private bucket setup if managed through migration
- `src/lib/supabase/database.ts`
  generated/updated database types after migration

Backend must:

- verify admin before every operation
- validate item type/status/priority/role
- cap note, element text, selector, heading, URL, and metadata lengths
- accept capture creation atomically enough that failed asset upload does not leave misleading `ready` screenshot state
- store item metadata first, then upload assets and insert asset rows
- return bounded errors such as `admin_required`, `invalid_payload`, `asset_upload_failed`, `capture_not_found`
- generate deterministic copy prompts from stored item truth without calling AI
- never send items to Codex automatically

## Frontend Responsibilities

Likely modules:

- `src/components/admin-capture/AdminCaptureOverlay.tsx`
- `src/components/admin-capture/AdminCapturePanel.tsx`
- `src/components/admin-capture/AdminCaptureBacklog.tsx`
- `src/components/admin-capture/AdminCaptureItemDetail.tsx`
- `src/components/admin-capture/AdminCaptureLayer.tsx`
- optional lazy `src/lib/admin-capture-client.ts`

Frontend must:

- only show capture overlay after explicit capture-mode activation and backend admin confirmation
- mount the capture layer at app/root level or another route-spanning shell boundary so it can cover `/`, workout detail, progress, settings, `/hitoDS`, `/changelog`, `/hub`, `/admin/analytics`, and future Hito routes
- keep capture code lazy so normal runners do not pay for screenshot/overlay tooling
- highlight hovered/selectable elements without changing product behavior
- ignore the capture overlay itself during element selection
- collect type and note before save
- show screenshot capture success/unavailable states honestly
- submit all capture data to backend; do not store backlog truth in local storage
- render backlog from backend-shaped view models
- provide filters by type, status, role, priority, route/date
- provide copy actions:
  - `Copy prompt`
  - `Copy structured context`
  - `Copy bug summary`
- keep visual treatment within Hito DS/workbench classes

Frontend must not:

- make admin capture controls part of runner navigation
- rely on frontend-only admin checks
- require the product owner to enter `/admin/capture` before every capture
- make capture mode persistent after navigation unless the explicit query/flag remains present

## Backlog Design-System Contract

The admin `Backlog` surface must be built from Hito DS and existing admin workbench patterns.

This surface must not introduce a separate backlog UI kit, parallel component language, or
route-local visual system.

Canonical reuse rules:

- use the existing admin shell/tabs if they are available
- reuse Hito DS typography, surfaces, buttons, tabs, badges, dialogs, disclosures, tables, lists,
  empty states, loading states, and error states
- assemble filters, task disclosure, quick note form, prompt copy actions, status controls,
  priority controls, and role controls from existing Hito DS/admin primitives
- inspect `/hitoDS`, `src/routes/hitoDS.tsx`, and `src/components/ui/*` before creating any new
  UI primitive
- visual capture backlog items and quick notes must land in the same `/admin/capture` backlog
  surface, not a separate admin product

Forbidden:

- a new backlog-specific design system
- one-off badge/button/card/table styling when a Hito DS/admin primitive exists
- a separate visual-capture queue that bypasses the canonical backlog
- frontend-owned backlog truth, prompt generation, status rules, priority rules, or role rules

Backend remains the source of truth for capture items, quick notes, status, priority, target role,
notes, assets, and deterministic prompt generation.

Frontend owns interaction only:

- render backend-shaped backlog view models
- let admin filter, expand, copy, triage, and create quick notes
- show loading/error/empty states honestly
- never invent backlog lifecycle rules locally

Designer deliverable expectation:

- define layout anatomy using existing Hito DS/admin primitives
- specify how filters, task disclosure, item detail, quick note, and copy actions should look
- call out any truly missing primitive before requesting a new component
- avoid redesigning `/admin/analytics` or creating a new admin visual language

Copy deliverable expectation:

- write concise internal-admin copy for the page header, quick note form, empty states, unavailable
  states, copy-success states, and prompt-copy labels
- keep language operational and clear, not runner-facing marketing

Frontend implementation constraints:

- no new route beyond the planned `/admin/capture`
- no broad admin shell redesign
- no new generic component framework
- prefer deletion/reuse over adding new wrappers
- add a new primitive only when repeated backlog/admin needs prove an existing DS primitive cannot
  cover the state

QA visual checks:

- `/admin/capture` uses Hito DS/admin typography, surfaces, controls, and spacing
- filters, disclosures, quick note, copy actions, and status/priority controls match existing
  interaction patterns
- empty, loading, unavailable, and error states are present and DS-consistent
- normal runners never see backlog controls
- visual capture-created items and manual quick notes appear in the same backlog list/detail flow

## Admin Backlog Surface

Route:

- `/admin/capture`

Primary sections:

- `New`
- `In review`
- `Ready for Codex`
- `Done`
- `Archived`

Item detail should show:

- screenshot thumbnails when available
- selected element text
- route and URL
- selector/DOM path
- nearby heading
- note
- item type
- status
- priority
- target role
- created timestamp
- creator
- copy prompt buttons

Filtering/sorting:

- status
- type
- target role
- priority
- route
- date
- search text over title/note/element text

## Copy Prompt Contract

V1 prompt generation is deterministic. It should not call OpenAI.

Prompt should include:

- target role
- task type
- route/page URL
- selected element context
- admin note
- screenshot availability
- constraints:
  - inspect before changing
  - preserve Hito architecture
  - do not auto-broaden scope
  - use Hito DS for UI work
  - QA with built-in browser first

Example prompt shape:

```md
ROLE: <TARGET_ROLE>

TASK:
Resolve this captured Hito UI item.

CONTEXT:
- Type: <bug/change/context>
- Route: <route>
- URL: <url>
- Selected element: <element text>
- Nearby heading: <heading>
- Selector/DOM path: <selector>
- Admin note: <note>
- Screenshots: <available/unavailable>

CONSTRAINTS:
- Inspect current code before changing.
- Preserve canonical Hito architecture.
- Do not auto-send or mutate unrelated work.
- If UI work is needed, reuse Hito DS primitives/classes.

OUTPUT:
Use the project role output format.
```

## Implementation Slices

### Slice 1: Backend storage and admin capture contract

Owner: BACKEND

Status: Implemented / backend QA proof complete

Scope:

- add migration for `admin_capture_items`, `admin_capture_assets`, and private bucket
- add backend module types and validators
- add admin-only list/detail/create/update/copy-prompt seams
- add minimal server-side tests or deterministic helper checks where project patterns allow

Exit criteria:

- normal runner cannot call capture APIs
- admin can create a text-only capture item
- admin can list/update item status
- copy prompt is generated from stored truth
- no screenshot support required yet

Implemented evidence:

- `supabase/migrations/20260528190000_admin_capture_backlog.sql` adds RLS-enabled backlog tables and the private `admin-capture-assets` bucket.
- `src/lib/admin-capture.ts` and `src/lib/admin-capture.server.ts` expose admin-only availability, list, detail, create, triage, note update/append, and deterministic copy-prompt seams.
- `scripts/validate-admin-capture-backlog.ts` proves admin create/list/read/update, non-admin rejection, deterministic prompt output, metadata redaction, and archived-item exclusion without requiring frontend implementation.
- `npm run validate-admin-capture-backlog:live` probes the linked Supabase project and proves the tables and private bucket exist, service-role create/list/read/update works, publishable-key read/write is blocked, archived items are excluded from active lists, prompt metadata is redacted, and the disposable proof row is cleaned up.

### Slice 2: Backend asset upload support

Owner: BACKEND

Scope:

- add multipart endpoint or server action path for optional screenshot files
- save screenshot assets to private bucket
- insert asset rows linked to capture item
- handle asset upload failure without losing the item note/context

Exit criteria:

- admin can create item with optional viewport/element assets
- assets are private
- item still saves when screenshot capture is unavailable if metadata is valid

### Slice 3: Frontend admin backlog route

Owner: FRONTEND

Status: QA-passed / `/admin/capture` Backlog v1 complete

Scope:

- create `/admin/capture`
- reuse existing admin workbench shell and Hito DS table/filter primitives
- list items by status
- item detail/review
- update type/status/priority/target role
- copy prompt actions

Exit criteria:

- admin can review and triage saved items
- normal runner is redirected/blocked
- no auto-Codex behavior exists

Implemented evidence:

- `src/routes/admin.capture.tsx` adds the standalone `/admin/capture` workbench route with admin-only loader redirect, status tabs, compact search/filter controls, inline item detail, quick-note creation, triage updates, note append, archive-by-status, and deterministic copy-prompt clipboard actions.
- `src/routes/admin.analytics.tsx` links to Capture backlog as a sibling admin surface without moving backlog UI into analytics.
- The route renders backend-shaped `admin-capture` view models only; it does not add screenshot upload, route-spanning capture overlay, live UI editing, auto-Codex dispatch, or new backend schema.

Final QA evidence:

- signed-out redirect passed
- non-admin denial passed
- admin access passed
- `q` search persists and filters, including numeric-looking `q` values
- search submit persists `q`
- filters preserve `q`
- clear filters resets `q`
- inline detail opens
- status, priority, target role, and note updates persist
- archive removes item from active list and archived tab shows it
- Safari copy prompt degrades to a populated selectable fallback instead of a terminal failure when
  clipboard access is blocked
- narrow viewport has no page-level overflow
- `npm run build` passed

Non-blocking note:

- Safari may use the selectable prompt fallback when the browser blocks clipboard writes. This is
  accepted for v1 because the generated prompt remains available and copyable by the admin.

### Slice 4: Designer capture-layer interaction spec

Owner: DESIGNER

Scope:

- define the admin floating launcher UX
- define element-selection mode
- define capture panel anatomy
- define mobile and collision behavior
- define DS primitive/class usage

Exit criteria:

- Frontend has enough interaction detail to implement without inventing the UI
- Launcher and capture panel are clearly admin-only/internal
- The spec preserves the v1 constraints: no live editing, no auto-Codex, no normal-user visibility

### Slice 5: Frontend inspect/capture mode

Owner: FRONTEND

Scope:

- add route-spanning capture layer, mounted once near the root/app shell boundary
- add admin-only floating launcher as the primary activation path
- keep `?adminCapture=1` as a fallback/QA activation path
- verify admin with backend before rendering overlay
- implement hover/select overlay
- collect type/note
- capture bounded DOM context
- attempt viewport and element screenshots if feasible
- submit to backend capture API

Exit criteria:

- admin can select a visible element on normal product routes and save an item
- admin can select a visible element on admin/public/internal routes and save an item where the route is accessible
- capture overlay is absent for normal users
- overlay does not interfere with normal app behavior when disabled
- screenshot failure degrades to text/selector capture

### Slice 6: QA matrix

Owner: QA

Scope:

- admin login and access checks
- normal runner blocked
- floating launcher visible only to admin
- launcher can start and cancel selection mode
- capture mode hidden without admin
- capture item save
- capture from at least one normal product route, one admin route, and one public/internal route
- backlog list/detail/status updates
- copy prompt content
- screenshot privacy/storage behavior if implemented
- no auto-Codex dispatch
- built-in browser first; Safari only if required or blocked

Exit criteria:

- core capture -> backlog -> copy prompt flow passes
- no admin controls appear to normal runner sessions
- no sensitive raw secrets appear in client bundle or copied prompt

## QA Expectations

Required checks:

- `Browser Path Preflight` included in QA report.
- Built-in Codex browser is used first.
- `/admin/capture` redirects unauthenticated/non-admin sessions to `/admin/login?next=/admin/capture`.
- normal runner/product session cannot call capture APIs.
- admin can create a text-only item.
- admin can create an item with screenshots if screenshot slice is implemented.
- `New -> In review -> Ready for Codex -> Done -> Archived` status transitions work.
- `Copy prompt` includes route, element context, note, target role, and constraints.
- no automatic Codex dispatch occurs.
- browser capture overlay does not appear without explicit capture mode.
- admin floating launcher appears only after backend admin verification.
- browser capture overlay does not appear if backend admin check fails.
- capture overlay works outside `/admin/capture`, including a normal product page.

## Risks

- Screenshot privacy: captures may include runner data, profile data, or internal admin rows.
- Selector stability: DOM paths may break after UI refactors.
- Admin-only leakage: overlay or backlog must never be visible to normal users.
- Sensitive content storage: captured page text may include private details.
- Runtime constraints: browser-side screenshot libraries may be brittle under Vite/TanStack/Nitro.
- Bundle weight: screenshot tooling must be lazy-loaded only in capture mode.
- Auth boundary: admin session should not become a product runner session.
- Mounting boundary: route-spanning overlay must not disturb runner AppShell, admin workbench shell, public hub, or `/hitoDS` rendering.
- UI collision: launcher or capture panel could cover the exact UI being reviewed if placement/collapse behavior is careless.
- False precision: component/source mapping is best-effort only in v1.

## What We Refuse To Build In V1

- live visual editing
- code mutation from the browser
- automatic Codex dispatch
- background agent execution
- full issue tracker replacement
- source-map-to-component ownership guarantees
- multi-user collaboration workflow
- production user-management features
- public runner-facing report-a-bug flow
- Chrome extension, Codex plugin, or VS Code extension as the first implementation path

## Checklist

- [x] Backend storage migration exists.
- [x] Backend admin capture module exists.
- [x] Admin-only create/list/detail/update/copy-prompt seams exist.
- [ ] Optional screenshot asset upload is private and admin-only.
- [x] `/admin/capture` backlog route exists.
- [ ] Designer capture-layer interaction spec exists.
- [ ] Route-spanning inspect/capture overlay is explicit, admin-verified, and activated through a floating launcher.
- [ ] Capture can save bug, change request, and context capture items.
- [x] Backlog can filter by status/type/role/route/date/search.
- [x] Copy prompt is deterministic and manual.
- [x] QA validates `/admin/capture` v1 admin-only access, triage, copy prompt, responsive behavior, and no auto-dispatch.

## Exit Criteria

- Admin can capture a UI element with note/type/context from any accessible Hito route.
- Saved capture appears in `/admin/capture`.
- Admin can triage status and target role.
- Admin can copy a role-targeted prompt.
- Normal users never see or access capture/backlog tools.
- No item is automatically sent to Codex.
- Screenshot storage, if shipped, is private and admin-only.

## Next Recommended Role

ARCHITECT

## Suggested Next Step

Plan the unified admin work-item/status model across Supabase-backed backlog items, repo task docs,
and active/archive plans. This should be a separate architecture slice; do not start screenshot
upload, capture overlay, live editing, OpenAI, Codex auto-dispatch, or broad UI redesign as part of
the `/admin/capture` v1 closeout.

Prompt:

```md
ROLE: ARCHITECT

TASK:
Define the unified admin work-item/status model after `/admin/capture` Backlog v1 QA pass.

STAGE:
ARCHITECT planning

PLAN:
docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md

CONTEXT:
Backend Slice 1 and `/admin/capture` Backlog v1 are QA-passed. The current implementation uses backend-owned backlog truth, Hito DS/admin primitives, manual deterministic copy prompts, quick notes, filters, inline detail, triage updates, archive flow, and admin-only access.

GOAL:
Design a small unified work-item/status model that can eventually connect:
- Supabase admin backlog items
- repo task docs under `docs/tasks/backlog/`
- active/archive plans

REQUIREMENTS:
- Do not reopen `/admin/capture` v1 implementation.
- Do not start screenshot upload or route-spanning capture overlay.
- Do not add live editing, OpenAI generation, or Codex auto-dispatch.
- Preserve backend-owned backlog truth for the current admin surface.
- Decide whether repo markdown sync is import-only, export-only, or two-way with explicit IDs.
- Define status/type/priority/owner mappings without building a full Jira clone.
- Keep the existing Hito DS reuse contract intact.

OUTPUT FORMAT:
1. Task
2. Stage
3. Current state
4. Model options
5. Recommendation
6. Source-of-truth decision
7. Implementation slices
8. What not to touch
9. Next recommended role
10. Blockers
```
