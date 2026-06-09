# Admin UI Capture And Backlog Implementation Plan

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

DESIGNER

## Task

Define the portable Hito Debugger overlay and capture API contract.

## Stage

ARCHITECT / DESIGNER spec / portable debugger overlay, API boundary, and Hito DS interaction layer

## Exact Handoff Prompt

```text
ROLE: DESIGNER

TASK:
Define the portable Hito Debugger overlay interaction spec for element-level text/comment capture.

STAGE:
DESIGNER spec / portable debugger overlay and Hito DS element-inspector controls

CONTEXT:
- Source path: docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md
- Backend now exposes an admin-only `adminDebugCapture` capability probe through the canonical
  `AdminAccessContext` resolver.
- Product clarification: the debugger should be treated as a portable pseudo-service, not as a
  route-local Hito backlog widget.
- The debugger overlay opens over a target app/service, verifies Hito admin credentials or a
  Hito-owned debugger session, detects hovered elements like a browser inspector, and creates
  normalized capture records through a debugger API.
- Hito Admin Work Items consumes or mirrors those records through the API; Work Items is not the
  owner of element detection, overlay behavior, or cross-project capture.
- In the Hito context, the overlay must use Hito DS primitives for tooltip/popover chrome, menus,
  buttons, icon buttons, text inputs, textareas, selects, status pills, focus rings, and helper
  text.
- The first useful slice should support text-change tasks and element comments/design notes.
- Hito DS token/style introspection is future-capable but not required for the first capture slice.
- The future capture layer should work across accessible Hito routes first, then be portable to
  other owner projects through the same API/SDK boundary.
- `/admin/capture` remains the Work Items review queue, not the only place capture can happen.
- The capture layer must stay admin-only, internal, and non-mutating until the admin explicitly
  saves a bounded capture item.

CONSTRAINTS:
- Do not implement frontend or backend code.
- Do not create a new mini design system.
- Reuse Hito DS primitives and existing admin workbench patterns.
- Do not design live editing, automatic Codex dispatch, or background agent execution.
- Do not expose capture controls to normal runners/testers/signed-out visitors.
- Treat screenshot capture as optional/future; the design must degrade to text/selector/context
  capture if screenshots are unavailable.

OUTPUT:
1. Task
2. Stage
3. Product interaction model
4. Launcher behavior
5. Selection-mode behavior
6. Capture panel anatomy
7. Text-change capture flow
8. Element comment/design-note flow
9. Mobile/collision behavior
10. Hito DS reuse rules
11. Portable API/SDK assumptions
12. Accessibility and privacy notes
13. Frontend handoff requirements
14. Blockers
```

## Owner

Architect / Backend / Frontend / QA

## Last Updated

2026-06-03

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
- the unused screenshot asset storage seam is retired from the active backend contract; `admin_capture_items` is the only current Supabase backlog table
- `/admin/capture` Backlog v1 is implemented and QA-passed
- backend-owned backlog truth is the current source for the admin surface
- Backend Slice 7 repo work-item import/refresh is implemented: an explicit ops script mirrors
  markdown work items from the approved repo folders into `admin_capture_items` with
  `metadata.source_path`, `metadata.source_type`, and `metadata.work_item_status` while keeping
  markdown canonical for repo-authored work
- route-spanning capture overlay, screenshot upload, live editing, OpenAI, Codex auto-dispatch, and
  unified work-item/status modeling are not part of the completed v1 phase
- repo-authored tasks/plans now appear through an explicit imported mirror rather than a new docs
  folder, automatic sync, or Jira-like subsystem
- product correction after Slice 7: repo-authored markdown work items must be read-only in admin;
  changing status/type/priority/role inside `/admin/capture` must not become a second source of
  truth
- Backend Slice 8 server-side immutability guard is implemented: repo-derived rows still list,
  search, open, and copy prompts, but normal admin mutation seams reject title/body/status/type/
  priority/target-role edits with bounded read-only copy
- Backend Slice 9 markdown metadata alignment is implemented: the importer reads canonical markdown
  `Status`, `Type`, `Priority`, `Next Recommended Role`, `Task`, `Stage`, and
  `Exact Handoff Prompt` sections when present, reports missing/invalid metadata for older docs,
  and never mirrors repo-derived rows as `in_review`
- Backend Slice 10 actionable markdown cleanup is implemented: active plans, product briefs, and
  frontend specs now carry canonical metadata blocks, import with human-readable `Task` titles, and
  keep filename/source path as secondary metadata instead of primary Backlog labels
- Backend stale repo-derived mirror cleanup is implemented and QA-passed: the importer reports active
  repo-derived rows whose `metadata.source_path` no longer exists in approved import sources and
  archives those stale mirrors only when explicitly run with `--archive-stale`
- Frontend read-only metadata tag DS reuse is implemented and QA-passed: `/admin/capture` imports
  shared `HitoMetadataTag`, repo-derived/backend-owned metadata renders as static read-only tags,
  quick-note editable controls use explicit interactive mode, source-truth tooltips use shared
  Tooltip, tabs are simplified to `Active`, `Done`, and `Archived`, and the old
  `ReadOnlyMetadataTag` route-local component is gone
- Backend quick-note delete contract is implemented: `/admin/capture` exposes a bounded admin-only
  delete mutation for manual quick notes only, while repo-derived mirrors and captured UI records
  remain non-deletable through the UI/server action
- Admin auth/session consolidation is implemented and QA-passed: admin routes/server functions flow
  through one `AdminAccessContext` resolver, local `/admin/login` issues signed admin-session
  access, Supabase app-metadata admin remains deployed compatibility only, local Test Accounts
  access is an admin capability, and the bounded `adminDebugCapture` capability probe is available
  for future route-spanning capture-overlay work

Important product correction:

- the backlog/review queue lives in admin
- the capture layer itself must work across the whole Hito product
- admin should be able to open normal product routes, enable debugger/capture mode, select any
  visible product element, and save a normalized capture record through the debugger API
- `/admin/capture` is the queue, not the only place capture can happen
- Work Items consumes or mirrors debugger records; it does not own overlay inspection behavior
- for repo-authored work, markdown files are the only canonical editable task truth
- imported markdown work items in admin are for filtering, review, prompt copy, and discovery, not
  editing lifecycle attributes
- admin quick notes are scratchpad/intake records; they can be appended to and copied into a proper
  markdown backlog/task file, then deleted from the admin UI when no longer needed, but they should
  not replace canonical repo tasks

## Product Contract

V1 flow:

1. Admin signs in through `/admin/login`.
2. Admin opens any accessible Hito product/admin/public page.
3. A small admin-only debugger launcher appears after backend admin verification.
4. Admin clicks `Capture UI` / `Open debugger` in the launcher.
5. The page enters element-inspection mode.
6. Admin hovers/selects a visible UI element.
7. The debugger shows a Hito DS tooltip/popover with element context.
8. For text elements, admin creates a text-change capture with current text and desired
   replacement.
9. For other elements, admin creates a comment/design/behavior capture with bounded context.
10. The debugger API creates a normalized capture record.
11. Hito Work Items consumes or mirrors the record for review and deterministic prompt copy.
12. Admin opens Work Items, reviews the item, and copies a role-targeted prompt into Codex manually.

Repo work-item flow:

1. Architect or Backlog Manager creates or updates the canonical markdown task in the repo.
2. Backend import/refresh mirrors that task into Supabase for `/admin/capture` discovery.
3. Admin filters, opens, reads, and copies the task from the admin Backlog.
4. Admin does not edit status/type/priority/role for repo-derived tasks in the UI.
5. If extra context is needed, admin creates/appends a quick note, then a role agent turns that note
   into a canonical markdown backlog item.

V1 must not:

- edit UI live
- mutate code
- auto-send to Codex
- start agent work automatically
- expose capture tools to normal runners
- become a broad Jira/Linear replacement

## Canonical Pipeline

Portable debugger pipeline:

`target app -> Hito Debugger overlay/client -> element inspection normalization -> debugger API -> normalized capture record -> Hito Admin Work Items import/read mirror -> deterministic copy-prompt generation -> manual Codex handoff`

Hito-local compatibility pipeline:

`admin-selected UI context -> Hito Debugger overlay -> backend admin validation -> debugger capture API -> admin_capture_items mirror/storage -> Work Items review -> deterministic copy-prompt generation -> manual Codex handoff`

For repo-authored work:

`markdown task/plan/spec -> explicit import/refresh -> Supabase read mirror -> admin Backlog read/copy -> manual Codex handoff`

This follows the Hito rule: raw context is captured first, backend validates and stores canonical
truth, and any future execution still requires explicit human handoff.

## Portable Debugger Service Boundary

The route-spanning overlay should be designed as `Hito Debugger`, a reusable pseudo-service boundary
that can later attach to other owner projects without rewriting Hito Work Items.

V1 may live in this repo for speed, but the ownership boundary must already be API-shaped:

- `Hito Debugger` owns:
  - admin/debugger session verification
  - project binding
  - overlay activation
  - hover/selection inspection
  - selected-element normalization
  - selector/component hints
  - element text capture
  - bounded DOM/style metadata capture
  - capture-record creation API
  - privacy/redaction before storage or handoff
- Hito Admin Work Items owns:
  - listing/reviewing imported or mirrored capture records
  - triage/status/readback
  - deterministic prompt copy
  - conversion into canonical markdown tasks when needed
- Hito Admin Work Items must not own:
  - hover detection
  - selector generation
  - style inspection
  - cross-project project binding
  - overlay UI behavior
  - direct element editing

Portable API shape to define before implementation:

- `GET /debugger/session`
  verifies Hito admin credentials or a debugger-scoped admin session and returns bounded capability
  state.
- `POST /debugger/captures`
  creates a normalized capture record from selected element context.
- `GET /debugger/captures`
  lists capture records for Work Items import/readback.
- `GET /debugger/projects`
  returns project binding metadata only if/when multi-project support is introduced.

The API names above are architecture placeholders. BACKEND may choose exact route/function names,
but the product boundary must remain: debugger collects and normalizes, Work Items consumes.

## MVP Element Capture Flows

First useful debugger slice:

1. Admin opens a target Hito route and enables debugger mode.
2. Hovering an element highlights the element like a browser inspector.
3. The debugger opens a small Hito DS tooltip/popover near the selected element.
4. If the selected element has meaningful text, the panel shows:
   - current text
   - target role default: `copy` or `product`
   - input/textarea for replacement text
   - action: `Create text-change task`
5. If the selected element is not primarily text, the panel shows:
   - element label/role/selector hint
   - optional current text if present
   - textarea for comment
   - task type: comment, design note, behavior note
   - action: `Create element note`
6. Saved capture records appear in Work Items through the debugger API/import seam.

Out of MVP:

- live editing
- automatic code changes
- automatic Codex dispatch
- screenshot requirement
- Figma sync
- browser extension packaging
- full design-token diffing
- cross-project SDK installer

## Hito DS Overlay Contract

The overlay must use Hito DS and admin-workbench primitives rather than a new mini visual system.

Use Hito DS for:

- tooltip/popover/sheet chrome
- icon buttons
- primary/secondary/destructive button tiers
- text input
- textarea
- select/dropdown
- menu/list rows
- labels/captions/helper text
- status pills
- focus rings
- divider/hairline treatment
- compact metadata tags

Element-inspector visuals:

- selected element outline should be clearly internal/admin-only and must not look like product
  focus state.
- hover outline must ignore the debugger overlay itself.
- capture controls should be compact and collision-aware.
- disabled/future actions must be visibly disabled, not fake clickable controls.
- mobile may use a bottom sheet instead of a near-element tooltip if positioning is unsafe.

Future configurable design-system introspection:

- computed padding, margin, typography, color, border radius, and dimensions
- mapped Hito DS token names where available
- component/primitive hints where available
- "not mapped to Hito DS" warnings where useful

This introspection is future-capable. It must not block the MVP text-change and element-comment
flows.

## Recommended Route Model

Use one new admin route for backlog/triage:

- `/admin/capture`

Responsibilities:

- canonical backlog list/read surface
- item detail/review
- status/type/role/priority filters
- copy prompt actions
- optional entry links for starting capture mode on common product routes

The route must not become an editor for repo-authored task truth. Status, type, priority, role, and
body edits for markdown-derived items belong in markdown, then flow back through import/refresh.

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

Choose a Hito-hosted debugger overlay/client for the first implementation, but keep the service
boundary portable.

Why:

- it works across Hito routes without asking the product owner to install a browser extension
- it can reuse the existing server-owned admin auth/session boundary
- it can prove the debugger overlay and API contract before packaging a cross-project SDK
- it can mirror Hito debugger captures into the existing Work Items queue without making Work Items
  own hover/selector/style inspection
- it keeps capture metadata compatible with Hito route/state concepts
- it is faster to QA than a Chrome extension, Codex plugin, or VS Code extension

Other options:

- embeddable SDK/script:
  the intended portability path after Hito-local proof; it should mount the same overlay/client in
  other owner projects and send captures to the same debugger API contract
- Chrome extension:
  possible later if capture needs to work across non-Hito sites or outside the app runtime; not v1
  because extension auth, packaging, screenshot permissions, and cross-origin storage add avoidable
  complexity
- Codex plugin:
  possible later for `Open in Codex` or richer handoff; not v1 because captured items still need human triage before agent execution
- VS Code extension:
  possible later for source-side follow-up after an item is already triaged; not v1 because the selection starts from rendered UI, not code

Canonical v1:

`Hito-hosted debugger overlay/client -> debugger capture API -> Work Items mirror/import -> manual copy prompt`

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
- `Open Work Items`
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
- shows selected element text, nearby heading, route summary, and selector/component hint
- detects whether the selected element is primarily text
- for text elements, defaults to text-change capture:
  - shows current text
  - asks for replacement text
  - creates a task like "Change this text to..."
  - suggested target role: `copy` or `product`
- for non-text or mixed elements, defaults to element note/design capture:
  - asks for comment
  - lets admin choose comment/design/behavior note
  - suggested target role: `designer`, `frontend`, or `product`
- optional priority can be set now or later in Work Items
- primary action is `Save capture`
- secondary action is `Cancel`
- save goes through the debugger capture API, then Work Items consumes/mirrors the record
- after save, show success with `Open Work Items` and `Capture another`

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
- capture save API requires admin auth before accepting metadata
- prompt generation requires admin auth
- any future asset download/read URL seam must require admin auth or short-lived signed private URLs generated only for admin sessions
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

## Canonical Admin Auth / Session Contract

Decision date: 2026-06-01.

Canonical pipeline:

`request -> canonical admin eligibility -> canonical admin session resolver -> AdminAccessContext -> admin route/serverFn`

Decision 1: Supabase metadata admin source.

- Choose Option C.
- Supabase app-metadata admin may remain as explicit deployed compatibility, but it must not be a
  second local/admin fixture truth path.
- Supabase `user_metadata`, raw user-editable metadata, or JWT-only user-editable claims must not be
  admin authority.
- If Supabase compatibility is kept, the shared resolver must verify it server-side through the
  admin/service Supabase seam and accept only server-owned `app_metadata` values such as
  `hito_admin === true` or `hito_role === "admin"`.
- Local admin access should not depend on Supabase metadata.

Decision 2: local `/admin/login` session format.

- Choose Option A as the target contract.
- Local `/admin/login` should verify the protected local admin fixture on loopback runtimes, then
  issue only the signed admin session cookie (`hito_admin_session`) for admin surfaces.
- `/admin/login` must not create a runner/product local auth session for admin access.
- The signed admin session may carry enough bounded signed context to tell deployed-owner and
  local-fixture admin sessions apart.
- Local Test Accounts capability should be represented on `AdminAccessContext` as an explicit
  capability, not inferred from a separate `hito_local_auth_session` provider path.

Decision 3: logout contract.

- Choose Option B.
- Add an explicit `/api/admin/auth/logout` for admin surfaces.
- Admin UI logout should use the admin logout route so it reliably clears `hito_admin_session`
  without relying on runner/product logout semantics.
- Generic `/api/auth/logout` may remain a broad/global compatibility logout, but admin surfaces
  should not depend on it as their primary logout path.

Canonical `AdminAccessContext` should expose:

- stable admin id
- admin label
- session source, for example signed admin cookie, local fixture admin, or Supabase deployed
  compatibility
- runtime classification, including loopback/local vs deployed
- capabilities, at minimum:
  - `canAccessAdmin`
  - `canManageLocalTestAccounts`
  - `canUseAdminCapture`
  - `canUseAdminAnalytics`

Backend implementation requirements:

- make `src/lib/admin-access.server.ts` the single resolver/facade for admin route and server
  function access
- remove or delegate duplicated private admin guards from `admin-analytics.server.ts`,
  `admin-capture.server.ts`, and `admin-local-test-accounts.server.ts`
- centralize TanStack `/_serverFn/...` eligibility in the shared resolver/facade
- treat `localhost` and `127.0.0.1` as the same loopback class for local admin eligibility
- preserve product runner auth and local tester auth behavior outside admin surfaces
- preserve admin-only service-role access for Supabase admin reads/writes
- return bounded `authentication_required`, `admin_required`, and `admin_unavailable` failures

What not to do:

- do not make Supabase metadata the primary local admin truth
- do not read `user_metadata` for authorization decisions
- do not keep local admin access on `hito_local_auth_session` once the signed admin session path is
  available
- do not add a new admin table or schema for this consolidation slice
- do not change `/admin/capture` backlog semantics, repo-derived read-only behavior, or quick-note
  lifecycle in this auth slice

Backend Slice 11: canonical admin auth/session consolidation

Owner: BACKEND

Status: Implemented / browser QA passed locally

Scope:

- [x] make signed `hito_admin_session` the one admin session cookie for `/admin/login` in local and
  deployed admin surfaces
- [x] keep Supabase app-metadata admin only as explicit deployed compatibility inside the shared
  resolver
- [x] add or finish `AdminAccessContext` capabilities for admin capture, analytics, and local Test
  Accounts
- [x] add explicit `adminDebugCapture` capability for future route-spanning debug/capture tooling
- [x] migrate admin analytics, admin capture, and local test-account server code to the shared
  resolver/facade
- [x] centralize admin route/serverFn eligibility and loopback host normalization
- [x] add explicit admin logout route for admin surfaces
- [x] keep generic runner/product logout behavior separate

Exit criteria:

- [x] `/admin/login` on loopback creates admin access through `hito_admin_session`, not a product
  local auth session
- [x] `/admin/capture`, `/admin/analytics`, and local Test Accounts all authorize through
  `AdminAccessContext`
- [x] local admin works on both `localhost` and `127.0.0.1`
- [x] tester/product credentials are rejected from admin surfaces
- [x] Supabase app-metadata admin compatibility works only when explicitly verified server-side
- [x] Supabase `user_metadata` does not grant admin access
- [x] admin logout clears admin session and does not depend on runner logout
- [x] no auth loop occurs after successful admin sign-in

Validation harness requirements:

- dependency-level resolver tests or focused script coverage for:
  - [x] unauthenticated/non-admin request scope rejection
  - [x] signed admin cookie success
  - [x] invalid/expired signed admin cookie
  - [x] local fixture admin on `localhost`
  - [x] local fixture admin on `127.0.0.1` canonicalization
  - [x] encoded admin server-function eligibility
  - [x] production hashed admin server-function eligibility
  - [x] production hashed admin debug/capture probe eligibility
  - [x] admin debug/capture probe rejects signed-out, runner, and tester contexts
  - [x] mixed runner + admin browser context keeps product route identity separate from admin
    debug/capture capability
  - [x] runner logout does not own or clear admin debug/capture capability
  - [x] Supabase app-metadata admin compatibility and user-metadata rejection
  - [x] admin logout cookie clearing
  - local tester denied
  - Supabase `app_metadata` admin compatibility accepted when explicitly enabled/available
  - Supabase non-admin denied
  - Supabase `user_metadata` admin-looking values denied
  - admin route eligibility
  - admin serverFn eligibility
  - production hashed admin serverFn eligibility
  - non-admin serverFn/path denial
- browser proof for:
  - `/admin/login -> /admin/capture`
  - reload `/admin/capture`
  - `/admin/login -> /admin/analytics`
  - local Test Accounts tab under admin context
  - admin logout
  - no auth loop

Implementation note, 2026-06-01: browser QA exposed that TanStack Start client navigation calls
admin server functions as `/_serverFn/<sha256 id>` in built mode, not only as dev JSON metadata.
`admin-access.server.ts` now whitelists admin server functions by source file and generated
production function id, keeping product server functions outside admin-session eligibility while
allowing Backlog -> Analytics -> Backlog client navigation to stay authenticated.

Implementation note, 2026-06-03: Backend now exposes an explicit `adminDebugCapture` capability on
`AdminAccessContext` and a bounded `getAdminDebugCaptureCapability` server-function probe for the
future route-spanning capture overlay. The probe returns only capability/authority boundary state,
requires canonical admin access, does not require backlog storage to answer capability, and is
validated to reject signed-out, runner, local tester, product-route, and `user_metadata`-only admin
claims while accepting signed admin sessions and server-verified Supabase `app_metadata` admin
compatibility.

QA closeout evidence, 2026-06-03:

- Verdict: Passed.
- `AdminAccessContext.capabilities` includes `adminDebugCapture: true` while preserving
  `adminCapture`, `adminAnalytics`, and `localTestAccounts`.
- `getAdminDebugCaptureCapability` is exported through `createServerFn({ method: "GET" })`.
- The probe is admin-owned, whitelisted for TanStack serverFn eligibility, and covered by the
  hashed production serverFn id.
- The probe does not depend on backlog storage and returns only bounded capability data.
- The probe does not expose raw session ids, raw user ids, secrets, service keys, cookies, JWTs, or
  raw Supabase objects.
- Positive proof:
  - signed admin cookie is accepted for admin route and admin serverFn access
  - signed admin capability returns `capability: "admin_debug_capture"` and `enabled: true`
  - returned capabilities include `adminCapture: true` and `adminDebugCapture: true`
  - authority source/runtime is bounded
  - identity-boundary booleans show runner/tester/product state is ignored
  - Supabase `app_metadata` admin compatibility is accepted only where intended
- Negative proof:
  - signed-out probe returns bounded `authentication_required`
  - local tester login/probe is denied with `admin_required`
  - post-logout probe is denied
  - non-admin product route and non-admin product serverFn are rejected
  - invalid and expired signed admin cookies are rejected
  - Supabase `user_metadata` admin-looking claims are rejected
  - runner logout does not own the admin capability path
- Regression proof:
  - `node --import tsx scripts/validate-admin-auth-session.ts` passed
  - `npm run validate-admin-capture-backlog` passed
  - `npm run build` passed
  - built-in browser login spot-check reached `/admin/capture`
  - `Capture load failed` and `Backlog unavailable` were absent
- Artifact:
  - `qa-artifacts/screenshots/2026-06-03/admin-debug-capture-capability-qa/probe-runtime-proof.json`
- existing admin backlog validation:
  - `npm run validate-admin-capture-backlog`
  - `npm run validate-admin-capture-backlog:live` if linked env is available
- standard validation:
  - targeted ESLint for touched admin/auth files
  - `git diff --check`
  - `npm run build`

## Storage Model

Add backend-owned Supabase storage for capture backlog truth.

Current cleanup decision, 2026-06-01:

- `admin_capture_items` is the only implemented storage truth for admin Backlog items.
- The unused screenshot asset table and private bucket were retired before screenshot upload shipped.
- If screenshot capture returns later, it needs a fresh storage slice and migration instead of reusing a dormant legacy seam.

Cleanup closeout evidence, 2026-06-01:

- Linked Supabase project `dltfjwexyctmihclcjqj` (`hito-runn`) applied migration
  `20260601110000_remove_admin_capture_assets`.
- Pre-migration proof showed `admin_capture_items` existed with 117 rows,
  `admin_capture_assets` existed with 0 rows, and storage bucket `admin-capture-assets` had 0
  objects.
- The empty private `admin-capture-assets` bucket was removed through the Supabase Storage API
  before SQL dropped `public.admin_capture_assets`, because Supabase rejects direct SQL deletion
  from `storage.buckets`.
- Live validation proved `admin_capture_items` remains available, `admin_capture_assets` is absent
  from PostgREST, bucket `admin-capture-assets` is absent, service-role create/list/read/update
  still works, copy-prompt redaction works, manual note append works, repo-derived list/detail/copy
  still works, repo-derived mutations remain rejected, publishable read/write remains blocked, and
  disposable proof rows clean up.
- `runner_entitlements` and `runner_capability_usage` were intentionally not removed; they are not
  part of the admin capture asset cleanup.
- No legacy compatibility seam remains for `admin_capture_assets`.

Vercel build and admin availability recovery checkpoint, 2026-06-01:

- QA passed after the Nitro output finalizer fix and linked Supabase asset-seam removal.
- `npm run build` passed.
- `npx vercel build --yes` passed.
- The old Vercel failure did not recur:
  `Expected staged Nitro build output is missing: /vercel/path0/node_modules/.nitro/vite/server-output`.
- Vercel-mode artifacts existed:
  - `.vercel/output/static`
  - `.vercel/output/static/favicon.svg`
  - `.vercel/output/static/templates/hito-training-plan-v2-template.json`
  - `.vercel/output/functions/__server.func/index.mjs`
  - `.vercel/output/config.json`
  - `.vercel/output/nitro.json`
- Vercel deployment inspection showed a newer production deployment in `Ready` state.
- `npm run validate-admin-capture-backlog:live` returned `ok: true`.
- `npm run validate-admin-capture-backlog` returned `ok: true`.
- Live validation proved `admin_capture_items_exists`, `admin_capture_assets_legacy_absent`,
  `admin_capture_assets_bucket_legacy_absent`, service-role create/list/read/update,
  publishable-key read/write blocking, and cleanup.
- Local browser/admin proof passed: unauthenticated `/admin/capture` required admin login,
  authenticated admin landed on `/admin/capture?status=new&type=all&priority=all&role=all&q=`,
  backlog counts loaded, `Capture load failed` and `Backlog unavailable` were not visible, and no
  auth loop occurred after successful sign-in.
- Screenshot evidence:
  `qa-artifacts/screenshots/2026-06-01/admin-capture-vercel-build-recovery-qa/admin-capture-backlog-loaded.png`.
- Non-blocking nuance: after local `npm run build` in a workspace that already had
  `.vercel/output`, `.output/server/index.mjs` was not left in the final artifact snapshot even
  though isolated local-mode finalizer execution recreated and validated it. This does not block
  Vercel recovery or admin backlog recovery and should be tracked separately only if local `.output`
  serve behavior becomes important.

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
- `product`
- `running_coach`

Suggested `priority` values:

- `low`
- `medium`
- `high`
- `urgent`

Screenshot asset storage:

- not implemented in the current backend contract
- no `admin_capture_assets` table is part of the active model
- no `admin-capture-assets` bucket is part of the active model
- screenshots must not be stored inline in `metadata`

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

- deferred from the current backend contract
- if they return, prefer a fresh, reviewed storage slice instead of dormant legacy tables
- do not block item capture if screenshot capture is unavailable; save the item with textual/selector context instead

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
  server-only admin checks, Supabase reads/writes, prompt shaping
- `src/routes/admin.capture.tsx`
  admin backlog route
- `src/routes/api.admin.capture.items.tsx`
  future multipart capture-create endpoint only if screenshots are reintroduced
- `supabase/migrations/<timestamp>_admin_capture_backlog.sql`
  tables, checks, and indexes
- `src/lib/supabase/database.ts`
  generated/updated database types after migration

Backend must:

- verify admin before every operation
- validate item type/status/priority/role
- cap note, element text, selector, heading, URL, and metadata lengths
- return bounded errors such as `admin_required`, `invalid_payload`, `capture_not_found`
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
notes, and deterministic prompt generation.

Frontend owns interaction only:

- render backend-shaped backlog view models
- let admin filter, expand, copy, and create/append quick notes
- show loading/error/empty states honestly
- never invent backlog lifecycle rules locally

Mutation correction:

- repo-derived work items are read-only in admin
- status, type, priority, target role, title, and canonical body for repo-derived work must be
  edited in markdown and then mirrored through import/refresh
- quick notes may be created and appended in admin as scratchpad/intake context
- turning a quick note into a real task is a manual repo action owned by Architect or Backlog Manager
- no admin UI action should silently rewrite markdown or treat Supabase triage metadata as the
  canonical task lifecycle

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

## Unified Work-Item Consolidation Plan

The admin Backlog should become one admin-facing work surface for real Hito work, not only ad-hoc
capture notes.

Canonical work-item concept:

- a work item is one bounded actionable unit that can be reviewed, filtered, opened, and copied as
  a role-ready prompt
- work items can originate from:
  - Supabase admin capture/quick-note rows
  - repo backlog markdown under `docs/tasks/backlog/`
  - product briefs under `docs/tasks/product-briefs/`
  - frontend specs under `docs/tasks/frontend-specs/`
  - active plans under `docs/plans/active/`
  - archived plans under `docs/plans/archive/`
- the admin Backlog renders a normalized work-item view; it does not become the only source of
  truth for every source type

Source-of-truth decision:

- Supabase remains canonical for admin-created quick notes and future visual capture items.
- Markdown remains canonical for repo-authored briefs, specs, backlog docs, active plans, and
  archived plans.
- The admin Backlog should store or read an indexed mirror of markdown-authored work so those items
  are visible and prompt-copyable in the UI.
- Do not duplicate full markdown document truth into Supabase as editable long-form content in v1.
  Store only searchable/indexable fields, a short body excerpt, prompt text or prompt source, and a
  stable `source_path` reference.
- Admin must not edit status/type/priority/role/title/body for imported markdown items in the UI.
  Those fields are canonical in markdown and should be refreshed from repo truth.
- If admin creates a quick note, that row is Supabase scratchpad truth until a role agent turns it
  into a canonical markdown backlog item.
- Updating markdown from admin UI is out of scope. If this is ever needed, it must be an explicit
  export/PR workflow, not automatic magic.

Recommended folder/docs structure:

- keep current folders for now:
  - `docs/plans/active/`
  - `docs/plans/archive/`
  - `docs/tasks/backlog/`
  - `docs/tasks/product-briefs/`
  - `docs/tasks/frontend-specs/`
- do not create `docs/work-items/` yet
- do not move large doc trees until link/reference impact is understood
- if consolidation is still desired later, do it as a separate staged docs migration with redirect
  notes/reference updates

Required normalized work-item metadata:

- stable source key:
  - Supabase capture rows use `admin_capture_items.id`
  - markdown items use normalized `source_path`
- `title`
- normalized status:
  - `backlog`
  - `in_progress`
  - `completed`
  - `closed`
  - `archived`
- admin capture status when backed by `admin_capture_items`:
  - `new`
  - `in_review`
  - `ready_for_codex`
  - `done`
  - `archived`
- source type:
  - `admin_capture`
  - `quick_note`
  - `backlog_doc`
  - `product_brief`
  - `frontend_spec`
  - `active_plan`
  - `archived_plan`
- work type:
  - `bug`
  - `change_request`
  - `context_capture`
  - `plan`
  - `brief`
  - `frontend_spec`
  - `qa_followup`
  - `ops_followup`
- `priority`
- `target_role`
- `owner`
- `source_path`
- `created_at`
- `updated_at`
- short summary/body excerpt
- prompt/body text for copy handoff, or enough source context to generate the deterministic prompt
- evidence paths, including local `qa-artifacts/` references or committed docs assets when present

## Canonical Markdown Metadata Contract

Repo-derived Backlog items are markdown-first. The importer mirrors markdown truth into Supabase for
admin discovery; it does not create a second editable task record.

Use explicit markdown sections as the canonical contract. Frontmatter is optional later, but not
required now because current Hito plans/specs already use visible sections.

Required sections for new backlog/task docs:

````md
# <Human-readable task title>

## Status

backlog

## Type

bug | change_request | context_capture

## Priority

low | medium | high | urgent

## Next Recommended Role

ARCHITECT | BACKEND | FRONTEND | QA | DESIGNER | COPY | RUNNING COACH

## Task

<one concise task statement>

## Stage

<role/stage label, for example ARCHITECT plan, BACKEND implementation, QA validation>

## Context

<bounded context and source facts>

## Exact Handoff Prompt

```text
ROLE: <ROLE>

TASK:
<execution-ready task>

STAGE:
<stage>

...
```
````

Optional but recommended sections:

- `## Evidence`
- `## Source Investigation`
- `## Expected Behavior`
- `## Constraints`
- `## What Not To Touch`
- `## Blockers`

Allowed values:

- status:
  - `backlog`
  - `in_progress`
  - `completed`
  - `closed`
  - `archived`
- type:
  - `bug`
  - `change_request`
  - `context_capture`
- priority:
  - `low`
  - `medium`
  - `high`
  - `urgent`
- next recommended role:
  - `ARCHITECT`
  - `BACKEND`
  - `FRONTEND`
  - `QA`
  - `DESIGNER`
  - `COPY`
  - `RUNNING COACH`

Type guidance:

- use `bug` when something is broken or incorrect
- use `change_request` for product/design/copy/behavior improvements
- use `context_capture` for notes, evidence, or unclear observations that still need triage into a
  real task
- do not add broad new type taxonomy without an explicit architecture update

Status guidance:

- `backlog`: captured and not started
- `in_progress`: actively owned by a role or handed off for execution
- `completed`: implemented/validated enough to stop active work, but still useful in completed
  filters
- `closed`: intentionally not doing it, merged into another item, or no longer relevant
- `archived`: historical/old item hidden by default
- do not use `in_review` for repo-derived markdown work items

Role guidance:

- the importer must read target role from `## Next Recommended Role`
- admin UI must not choose or mutate target role for repo-derived markdown items
- if role is missing, importer should report missing metadata and use a conservative fallback only
  for display

Prompt guidance:

- `## Exact Handoff Prompt` is the preferred source for copy prompt body
- if absent, importer may build a fallback prompt from `Task`, `Stage`, `Context`, and
  `Next Recommended Role`, but must report that the markdown item is missing an exact handoff prompt
- prompt generation remains deterministic and must not call AI

Importer metadata expectations for markdown items:

- `metadata.imported_from_repo = true`
- `metadata.source_path`
- `metadata.source_type`
- `metadata.work_item_status`
- `metadata.markdown_status`
- `metadata.markdown_type`
- `metadata.markdown_priority`
- `metadata.markdown_next_role`
- `metadata.missing_required_fields` when any required section is absent

Importer must not:

- map repo-derived work to `in_review`
- let Supabase triage values override markdown status/type/priority/role
- treat old fallback metadata as canonical when explicit markdown fields exist
- silently create duplicate rows when the same `source_path` is re-imported

Status mapping:

| Source | Default active visibility | Normalized status |
| --- | --- | --- |
| manual `admin_capture_items.status = new` | Active | scratchpad intake |
| manual `admin_capture_items.status = in_review` | Active only for old/manual capture queue items | scratchpad review |
| manual `admin_capture_items.status = ready_for_codex` | Active only for old/manual capture queue items | scratchpad ready |
| manual `admin_capture_items.status = done` | Hidden unless completed/archived filters are selected | scratchpad done |
| manual `admin_capture_items.status = archived` | Hidden unless archived filter is selected | scratchpad archived |
| `docs/tasks/backlog/*.md` | Active | status from file, else `backlog` |
| `docs/tasks/product-briefs/*.md` | Active when `Draft`, `Ready`, or no completed marker | `backlog` |
| `docs/tasks/frontend-specs/*.md` | Active when `Draft`, `Ready`, or implementation is not closed | `backlog` |
| `docs/plans/active/*.md` with active/in-progress status | Active | `in_progress` |
| `docs/plans/active/*.md` with paused/backlog status | Active | `backlog` |
| `docs/plans/active/*.md` with completed-but-not-archived status | Hidden unless completed filter is selected | `completed` |
| `docs/plans/archive/*.md` | Hidden unless archived filter is selected | `archived` or `closed` |

For repo-derived rows, importer must map markdown status to the closest existing
`admin_capture_items.status` only as a UI/storage compatibility detail:

- `backlog` -> `new`
- `in_progress` -> `ready_for_codex`
- `completed` -> `done`
- `closed` -> `done`
- `archived` -> `archived`

`in_review` is not a valid repo-derived markdown status and should not be produced for imported
markdown rows.

Smallest safe import/sync mechanism:

1. Backend adds an explicit docs-to-backlog import/refresh command.
2. The command scans the allowed docs folders, extracts bounded metadata from markdown headings and
   known fields, and upserts mirrored rows into the admin backlog using a deterministic
   `source_path` key stored in `metadata`.
3. The importer should not edit markdown files.
4. The importer should not run automatically on every page request.
5. The importer should be idempotent and safe to rerun after agents create or archive docs.
6. The admin UI reads Supabase-backed rows like the current Backlog does today.
7. A later explicit export command may write admin-created quick notes back into
   `docs/tasks/backlog/` as markdown, but v1 should not try to make live two-way sync automatic.
8. Imported repo rows should be treated as read-only in the admin UI; import/refresh owns their
   lifecycle metadata.

This gives the product owner the practical flow:

`Architect/Backlog Manager creates markdown task -> explicit import/refresh -> Supabase mirror -> /admin/capture Backlog shows real item -> admin reviews/copies prompt`

And for admin-created notes:

`Admin adds quick note in /admin/capture -> Supabase row appears immediately -> admin copies note/context -> Architect or Backlog Manager creates canonical markdown task -> import/refresh mirrors it back into admin`

Backend Slice 7: repo work-item import/refresh

Owner: BACKEND

Status: Implemented / backend import and stale cleanup QA passed

Scope:

- [x] inspect the current `admin_capture_items` schema and use existing columns plus `metadata` before
  proposing schema changes
- [x] create a server/ops-only importer for:
  - `docs/tasks/backlog/*.md`
  - `docs/tasks/product-briefs/*.md`
  - `docs/tasks/frontend-specs/*.md`
  - `docs/plans/active/*.md`
  - `docs/plans/archive/*.md`
- [x] map source docs into existing backlog item shape where safe:
  - source path in `metadata.source_path`
  - source type in `metadata.source_type`
  - normalized status in `metadata.work_item_status`
  - title in `title`
  - excerpt or handoff body in `note`
  - status mapped to the closest existing admin capture status
- [x] skip `.gitkeep`, README-only policy files unless explicitly useful, and any document that cannot
  produce a bounded title/body
- [x] add a deterministic validation/report mode before live upsert if possible
- [x] preserve admin-only access and service-role storage boundaries
- [x] preserve manual status/priority/target-role triage on imported rows by default; pass
  `--refresh-triage` only when the repo import should intentionally re-own those fields
- [x] detect stale active repo-derived mirrors by `metadata.source_path` against the current
  approved repo import source set
- [x] require explicit `--archive-stale` before stale mirror cleanup mutates Supabase
- [x] keep stale mirror cleanup away from quick notes, captured UI rows, current repo-derived rows,
  and markdown files

Read-only correction note:

- normal admin UI/API mutation seams now reject repo-derived row edits server-side
- `--refresh-triage` remains an importer-only ops flag for intentionally re-owning mirrored
  status/type/priority/target-role metadata from markdown-derived import rules
- `--archive-stale` remains an importer-only ops flag for marking stale repo-derived mirrors
  archived when their markdown source path no longer exists

Exit criteria:

- [x] real markdown tasks/plans can be seeded into Supabase-backed Backlog without editing product code
  routes
- [x] rerunning the importer updates existing mirrored rows by `source_path` instead of creating
  duplicates
- [x] archived/closed docs do not flood the active Backlog by default
- [x] quick notes and visual capture items still work exactly as they do now
- [x] stale repo-derived active mirrors can be dry-run reported, explicitly archived, and then
  verified as `0` active stale mirrors

Stale mirror cleanup proof, 2026-06-03:

- `npm run import-admin-backlog-work-items -- --dry-run --archive-stale` initially reported
  `staleActiveRepoMirrorCount: 6`, `staleRepoMirrorAction: would_archive`, `manualRowCountBefore:
  0`, `duplicateCount: 0`, and `repoDerivedInReviewCount: 0`.
- `npm run import-admin-backlog-work-items -- --archive-stale` archived those 6 stale mirrors and
  reported `staleActiveRepoMirrorCountAfterCleanup: 0`, `staleRepoMirrorArchivedCount: 6`,
  `manualRowCountBefore: 0`, `manualRowCountAfter: 0`, `duplicateCount: 0`, and
  `repoDerivedInReviewCount: 0`.
- A follow-up normal `npm run import-admin-backlog-work-items` reported
  `staleActiveRepoMirrorCount: 0`, `duplicateCount: 0`, `repoDerivedInReviewCount: 0`, and manual
  rows untouched.

Stale mirror cleanup QA closeout, 2026-06-03:

- QA verdict: passed.
- `--archive-stale` is explicit in `scripts/import-repo-work-items-to-admin-backlog.ts`.
- CLI execution is guarded behind `isMainModule()`, so helper imports are safe and do not auto-run
  the importer.
- Cleanup policy is bounded to repo-derived, valid `metadata.source_path`, valid
  `metadata.source_type`, approved markdown import roots, non-archived rows, and source markdown
  absent from the current approved repo scan.
- Cleanup archives stale mirrors instead of deleting markdown and writes only bounded stale metadata
  to affected stale mirrors.
- Current normal dry-run reports `staleActiveRepoMirrorCount: 0`, `duplicateCount: 0`, and
  `repoDerivedInReviewCount: 0`.
- Current dry-run with `--archive-stale` reports `archiveStale: true`,
  `staleRepoMirrorAction: would_archive`, `staleActiveRepoMirrorCount: 0`,
  `staleActiveRepoMirrorCountAfterCleanup: 0`, `staleRepoMirrorArchivedCount: 0`,
  `manualRowCountBefore: 0`, `manualRowCountAfter: 0`, `duplicateCount: 0`, and
  `repoDerivedInReviewCount: 0`.
- Live validator remains green. Quick notes, captured UI rows, and current repo-derived rows were not
  affected.
- Active Backlog UI loads successfully; `Capture load failed` and `Backlog unavailable` are absent.
- Current important work remains discoverable, including Polar auto-sync, and the old stale active
  path query returns no active item.
- QA screenshots/artifacts are local-only under
  `qa-artifacts/screenshots/2026-06-03/admin-backlog-stale-mirror-cleanup-qa/`.
- Validation passed: targeted ESLint for the importer and validator, importer dry-run, importer
  dry-run with `--archive-stale`, local validator, live validator, `git diff --check`, and
  `npm run build`.

Frontend follow-up after Backend Slice 7:

- keep `/admin/capture` as the route
- render imported work items in the same list/detail flow
- expose source type and source path as metadata
- keep existing filters/status tabs as read/filter controls
- hide or disable status/type/priority/target-role mutation controls for repo-derived items
- keep quick-note create/append as scratchpad intake only
- do not redesign the page or add a second route
- do not invent frontend status truth; render backend-shaped status/source metadata only

Backend Slice 8: repo-derived item immutability guard

Owner: BACKEND

Status: Implemented / backend guard proof complete

Scope:

- [x] detect imported markdown rows through `metadata.imported_from_repo`
- [x] expose a backend-shaped editability flag or source classification so the frontend does not need
  to infer mutability locally
- [x] reject status/type/priority/target-role/title/body mutation for repo-derived markdown rows
- [x] keep imported rows refreshable only through the explicit import/refresh path
- [x] keep quick-note create and append behavior available for admin scratchpad intake
- [x] keep prompt generation available for repo-derived rows
- [x] preserve filters/search/list/detail behavior

Exit criteria:

- [x] direct server-action attempts to mutate repo-derived status/type/priority/role/title/body are
  rejected with a bounded read-only/source-of-truth message
- [x] import/refresh can still update mirrored repo rows from markdown truth
- [x] admin-created quick notes can still be created and appended
- [x] copied prompts still include source path/type metadata for repo-derived items

Backend Slice 9: markdown metadata contract alignment

Owner: BACKEND

Status: Implemented / backend metadata import proof complete

Scope:

- [x] update the importer to read the canonical explicit markdown sections:
  - `## Status`
  - `## Type`
  - `## Priority`
  - `## Next Recommended Role`
  - `## Task`
  - `## Stage`
  - `## Exact Handoff Prompt`
- [x] enforce allowed markdown status values:
  - `backlog`
  - `in_progress`
  - `completed`
  - `closed`
  - `archived`
- [x] never map repo-derived markdown work to `in_review`
- [x] report missing required metadata for old docs rather than silently treating fallback guesses as
  canonical
- [x] keep legacy fallback parsing conservative for old plans/specs, but surface
  `metadata.missing_required_fields`
- [x] keep quick-note/capture lifecycle separate from markdown work-item lifecycle

Exit criteria:

- [x] new markdown backlog docs import with exact status/type/priority/role from markdown
- [x] old markdown docs without required fields still import conservatively and report missing metadata
- [x] repo-derived rows never receive `in_review`
- [x] imported role comes from `## Next Recommended Role`, not admin UI heuristics
- [x] exact handoff prompt comes from `## Exact Handoff Prompt` when present

Frontend Slice 9: read-only admin Backlog correction

Owner: FRONTEND

Status: Implemented / QA-passed with shared Hito DS metadata tags

Scope:

- render repo-derived markdown rows as read-only work items
- remove or disable metadata mutation controls for repo-derived rows
- keep status/type/priority/role as visible metadata and filters only
- keep prompt copy and context copy available
- keep quick-note creation/append available as scratchpad intake
- do not redesign the Backlog page or add new UI kits

Implemented evidence:

- Shared primitive exists at `src/components/ui/metadata-tag.tsx`.
- `/admin/capture` imports and uses `HitoMetadataTag`; route-local `ReadOnlyMetadataTag` no longer
  exists.
- `HitoMetadataTag` supports read-only default rendering via `span`, explicit `interactive` mode,
  tone support, and shared Tooltip integration from `src/components/ui/tooltip.tsx`.
- Repo-derived/backend-owned tags render as read-only static tags with no chevrons, arrows,
  plus/status icon, or dropdown-trigger semantics.
- Quick-note editable controls use `HitoMetadataTag asChild interactive`.
- Tooltip copy explains source truth and where metadata should be changed.
- Workflow wording `Ready for Codex`, `Prompt ready`, and `In review` remains absent from the
  current UI; tabs remain simplified as `Active`, `Done`, and `Archived`.
- Mobile 375px layout wraps metadata tags below title/date/source metadata without horizontal
  overflow.
- Search/filter plus repo-derived open/detail/copy behavior still works, and `Capture load failed`
  / `Backlog unavailable` were not visible.
- Browser Path Preflight: built-in Codex browser was used first and covered the authenticated local
  `/admin/capture` flow; Safari fallback was not needed.
- Screenshot evidence:
  `qa-artifacts/screenshots/2026-06-01/admin-backlog-metadata-tag-ds-qa/`
  (`01-desktop-tooltip-proof.png`, `02-quick-note-interactive-controls.png`,
  `03-desktop-readonly-tags.png`, `04-mobile-375-wrap-proof.png`).
- Validation passed:
  `npm exec eslint -- src/routes/admin.capture.tsx src/components/ui/metadata-tag.tsx src/lib/admin-capture.ts src/lib/admin-capture.server.ts`,
  `git diff --check`, and `npm run build`.

Exit criteria:

- admin can filter/search/open/copy repo-derived work items
- admin cannot change repo-derived status/type/priority/role/title/body in the UI
- quick notes remain available for temporary capture and can be copied into a canonical markdown
  task by Architect or Backlog Manager
- no automatic repo writeback exists

Frontend Slice 10: markdown metadata readback alignment

Owner: FRONTEND

Scope:

- show repo-derived status/type/priority/role as markdown-owned read-only metadata
- show missing metadata hints when backend exposes `missing_required_fields`
- avoid presenting `in_review` as a repo-derived work-item state
- keep quick-note/capture queue labels separate from markdown work-item labels
- preserve current Hito DS/admin workbench layout

Backend Slice 10: actionable repo work-item canonicalization

Owner: BACKEND

Status: Implemented / markdown cleanup and import proof complete

Scope:

- [x] inventory actionable repo markdown under active plans, backlog, product briefs, and frontend
  specs
- [x] add canonical metadata sections to actionable active plans, product briefs, and frontend specs
- [x] use `## Task` as the primary human Backlog title
- [x] keep `metadata.source_path` and `metadata.source_type` as secondary provenance metadata
- [x] preserve archive docs as importable history without fully rewriting historical noise
- [x] refresh the Supabase mirror from markdown

Exit criteria:

- [x] actionable repo docs import without missing canonical metadata
- [x] imported active/product/frontend examples show human-readable titles from `## Task`
- [x] source paths remain metadata, not primary titles
- [x] repo-derived rows never receive `in_review`
- [x] duplicate source-path count remains zero
- [x] repo-derived read-only guard and manual quick-note editability still validate

## Admin Backlog Surface

Route:

- `/admin/capture`

Primary sections:

- `Active`
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

- add migration for `admin_capture_items`
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

- `supabase/migrations/20260528190000_admin_capture_backlog.sql` added the first RLS-enabled backlog tables; `supabase/migrations/20260601110000_remove_admin_capture_assets.sql` retires the unused screenshot asset table, and the empty `admin-capture-assets` bucket is removed through the Supabase Storage API before screenshot upload shipped.
- `src/lib/admin-capture.ts` and `src/lib/admin-capture.server.ts` expose admin-only availability, list, detail, create, triage, note update/append, quick-note-only delete, and deterministic copy-prompt seams.
- `scripts/validate-admin-capture-backlog.ts` proves admin create/list/read/update, quick-note delete, non-admin delete rejection, non-quick-note delete rejection, deterministic prompt output, metadata redaction, and archived-item exclusion.
- `npm run validate-admin-capture-backlog:live` probes the linked Supabase project and proves the item table exists, the retired asset table/bucket are absent, service-role create/list/read/update works, publishable-key read/write is blocked, archived items are excluded from active lists, prompt metadata is redacted, and the disposable proof row is cleaned up.
- Local cleanup validation passed with targeted ESLint, `npm run validate-admin-capture-backlog`,
  `git diff --check`, and `npm run build` on rerun. The first build retry hit the existing
  intermittent `.output` cleanup `ENOTEMPTY`; rerun passed cleanly.

### Slice 2: Deferred screenshot capture support

Owner: BACKEND

Scope:

- define a fresh screenshot storage model if capture assets become necessary
- add multipart endpoint or server action path for optional screenshot files only after the model is approved
- save screenshot assets to private storage with admin-only access
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
- [x] Repo-derived Backlog metadata renders as read-only DS-backed tags.
- [x] Copy prompt is deterministic and manual.
- [x] QA validates `/admin/capture` v1 admin-only access, triage, copy prompt, responsive behavior, and no auto-dispatch.
- [x] Admin auth/session uses one canonical `AdminAccessContext` resolver across admin surfaces.
- [x] Backend admin debug/capture capability probe exists for future route-spanning overlay work.

## Exit Criteria

- Admin can capture a UI element with note/type/context from any accessible Hito route.
- Saved capture appears in `/admin/capture`.
- Admin can triage status and target role.
- Admin can copy a role-targeted prompt.
- Normal users never see or access capture/backlog tools.
- No item is automatically sent to Codex.
- Screenshot storage, if shipped, is private and admin-only.

## Next Recommended Role

DESIGNER

## Suggested Next Step

Define Slice 4: the admin capture-layer interaction spec. Backend capability probing is now
QA-passed, so the next safe step is a design/spec pass for the route-spanning floating launcher,
selection mode, capture panel, mobile/collision behavior, privacy boundaries, and Hito DS reuse
before frontend implementation begins.

Prompt:

```md
ROLE: DESIGNER

TASK:
Define the admin capture-layer interaction spec for the route-spanning admin debug/capture overlay.

STAGE:
DESIGNER spec / route-spanning admin capture layer

PLAN:
docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md

CONTEXT:
- Backend admin auth/session consolidation is implemented and QA-passed.
- `AdminAccessContext.capabilities` includes `adminDebugCapture: true`.
- `getAdminDebugCaptureCapability` is a bounded admin-owned capability probe for future
  route-spanning capture overlay work.
- `/admin/capture` remains the backlog/review queue; the capture layer itself should work across
  accessible Hito product/admin/public/internal routes after admin verification.
- The probe is independent from backlog storage and must be used only to decide whether the
  overlay/launcher may appear.

GOAL:
Create a concrete interaction spec for the admin floating launcher, element-selection mode, capture
panel, mobile behavior, privacy boundaries, and DS reuse so FRONTEND can implement without inventing
a route-local mini design system.

REQUIREMENTS:
- Reuse Hito DS primitives and existing admin workbench patterns.
- Do not create a new design-system layer or custom route-local UI kit.
- Define when the floating launcher appears, how it is dismissed/minimized, and how it avoids
  covering primary product actions.
- Define how capture mode starts, cancels, highlights hover/selected elements, and handles elements
  near viewport edges.
- Define capture panel fields for type, note, optional priority/target role, route/component/context
  metadata, and screenshot availability/failure states.
- Define mobile/narrow viewport behavior and collision rules.
- Define privacy copy for potentially sensitive captured text/screenshots.
- Keep screenshot capture optional/future-friendly; text/selector/context capture must work without
  screenshots.
- Do not design live editing, code mutation, automatic Codex dispatch, background agent execution,
  or public runner-facing bug reporting.
- Do not change backend, frontend, Supabase schema, or product behavior in this spec slice.

OUTPUT FORMAT:
1. Task
2. Stage
3. Interaction model
4. Floating launcher spec
5. Selection-mode spec
6. Capture panel spec
7. Mobile/collision behavior
8. Hito DS reuse requirements
9. Privacy/accessibility notes
10. Frontend implementation handoff requirements
11. Blockers
```
