# Admin Analytics And Ops Surface Plan

## Status

Complete / Closed / archived after Phase 1 and Phase 1A

## Type

plan

## Priority

low

## Next Recommended Role

None

## Task

Archived: admin analytics Phase 1 and local Test Accounts Phase 1A are complete.

## Stage

Complete / archived

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Keep the completed admin analytics plan available as historical product context.

STAGE:
ARCHITECT closeout

CONTEXT:
- Source path: docs/plans/active/2026-05-17-admin-analytics-page-plan.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Architect / Backend / Frontend / QA

## Last Updated

2026-06-03

## Archive Note

Archived on 2026-06-03 during active-plan cleanup. Phase 1 existing-truth admin analytics,
Phase 1A local Test Accounts, and dedicated admin login were already complete and QA-green. Future
event/failure instrumentation or internal issue backlog work should start from a new active plan only
when a concrete ops need proves it is worth doing.

## Pause Note

Phase 1 and Phase 1A are complete and QA-green. `/admin/analytics` now has backend-shaped existing-truth analytics, bounded admin tabs, local-only Test accounts management, admin gating, non-admin blocking, Safari coverage, and client/server boundary verification.

The dedicated owner admin login flow is also implemented. `/admin/login` remains separate from normal product login, uses the protected local fixture only on loopback local runtimes, and uses server-only deployed password-hash/session-secret configuration outside local fixtures.

Operational follow-up for real deployment is non-blocking and remains outside product code closeout:

- configure `HITO_ADMIN_PASSWORD_HASH` in the real deployed environment
- configure `HITO_ADMIN_SESSION_SECRET` in the real deployed environment
- repeat a deployed URL smoke test after those env values are set

The local/dev admin fixture now has exactly one protected owner admin account. The legacy QA admin fixture has been removed from the local bypass accounts file and linked Supabase auth.

The admin analytics backend now classifies users before aggregation: real-user product counts and the `Users` dataset exclude local bypass, metadata-marked test/admin, `@local.test`, and disposable-prefix accounts, and the excluded rows are returned separately for Test accounts / ops review.

Further admin work should be demand-driven by concrete ops needs, recurring failures, or product-analysis gaps. Do not continue into dashboard polish, frontend-only metrics, `app_events`, `app_failures`, or `admin_issues` just because Phase 1 is complete.

## Historical Inventory Note

Kept active during the 2026-05-25 inventory cleanup because Phase 2 event/failure instrumentation and Phase 3 internal issue backlog remained possible future roadmap. Archived during the 2026-06-03 cleanup because no immediate admin analytics implementation slice remains active.

No immediate admin implementation slice is recommended.

## Checklist

- [x] Complete Phase 1A local Test accounts backend contract.
- [x] Complete Phase 1A local Test accounts UI.
- [x] Complete Phase 1 backend analytics loader from existing Supabase truth.
- [x] Complete Phase 1 admin analytics UI tabs.
- [x] Complete dedicated owner admin login flow.
- [ ] Phase 2 event/failure instrumentation, only when concrete ops failures justify it.
- [ ] Phase 3 internal issue backlog, only when recurring failures need triage inside Hito.
- [ ] Deployed URL smoke after real env setup for `HITO_ADMIN_PASSWORD_HASH` and `HITO_ADMIN_SESSION_SECRET`.

## Context

Hito already has enough backend-owned truth to make an internal admin surface useful. The first draft admin plan focused on top-level counts. That remains a good Phase 1, but it is too narrow for the next product need.

The admin surface should become an internal product-analysis and operations tool for:

- product health
- onboarding and activation understanding
- plan usage and adherence
- Garmin/feedback pipeline health
- AI and entitlement usage understanding
- recurring failures
- small internal issue triage

This must still stay bounded. It is not a BI suite, not a broad admin console, and not a Jira clone.

## Product Goal

Build one internal admin/ops surface that answers:

- how many real users are using Hito?
- where do users activate or drop off?
- how are plans created and used?
- how healthy is Garmin upload, parse, comparison, and AI feedback?
- which premium/AI capabilities are being used or blocked?
- what is currently broken, recurring, or worth triage?

## Admin Information Architecture

Keep one primary internal route:

- `/admin/analytics`

Use one page with bounded tabs or sections:

1. `Overview`
2. `Funnel & Usage`
3. `Integrations / Feedback`
4. `AI & Entitlements`
5. `Test accounts`
6. `Issues`

Do not split into a suite of admin routes until the single surface becomes genuinely too crowded.

Navigation:

- hidden from normal runner navigation
- optional quiet entry only for confirmed admin session
- direct URL access requires admin auth

Auth:

- server-only admin credential/session contract
- httpOnly admin session cookie
- backend admin check before any admin data loads
- do not hardcode credentials in tracked files
- do not rely on loopback-only local bypass as the production admin model

Implemented admin-login flow:

- `/admin/login` renders a standalone `Hito Admin` sign-in page without runner AppShell chrome
- `/admin/login` posts username/email plus password to `/api/admin/auth/login`
- `/admin/analytics` admin-required sign-in actions link to `/admin/login?next=/admin/analytics`
- backend verifies local/dev fixture credentials only on loopback local runtimes
- backend verifies deployed admin credentials from server-only password-hash/session-secret env outside local fixtures
- deployed admin username is the single owner-admin username and is not backed by a normal runner account
- local/dev fixture login requires exactly one configured account with `role: "admin"`
- valid tester credentials return a bounded admin-required result and do not create a session
- the existing local auth cookie is set only after local admin role verification passes, while deployed admin login sets a signed admin-only cookie
- `next` redirects are sanitized to same-origin `/admin/*` paths, with unsafe paths and `/admin/login` loops falling back to `/admin/analytics`
- normal `/login`, Magic Link, product local-login, tester login, and production auth behavior stay unchanged

## Local Test Accounts Section

Add one bounded admin-adjacent section:

- `Test accounts`

Scope:

- local/dev-only tester account management
- loopback local-auth runtime only
- not production credential management
- not a broad user-management system

Current sources of truth:

- `.tanstack/hito-running-local-accounts.json`
- Supabase auth user linkage where a local tester account has a linked auth identity
- existing safety semantics from `scripts/test-user.mjs`
- existing local bypass account reader in `src/lib/local-auth.ts`

Rules:

- the section must be hidden or unavailable outside loopback local-auth runtime
- backend guards must enforce local runtime plus admin access before any account data loads
- plaintext passwords may be shown only for local bypass tester accounts because that local file already stores local test passwords in plaintext
- never expose real Supabase auth passwords, tokens, sessions, magic links, service keys, production credentials, or provider credentials
- protected admin accounts must not be deletable from this UI
- deleting a tester must reuse or extract the same safety behavior as `scripts/test-user.mjs`
- deleting a tester should remove the local account and delete/reset the linked Supabase tester auth/data where applicable
- script-created tester accounts should appear automatically after refresh because the UI reads the same local accounts file
- optional tester creation is allowed only if it reuses or extracts the existing `test-user` create/reset semantics and creates confirmed tester auth users safely

Recommended UI:

- table with username, email, local password, role, display name, and linked Supabase status
- protected admin rows visibly marked and delete-disabled
- delete action requires explicit confirmation
- optional add-tester form only after backend helper extraction exists
- clear unavailable state when not running in local-auth loopback mode

This section belongs near Phase 1 because it uses existing local truth and helps internal QA/ops immediately, but it must remain explicitly local-only.

## What Useful Data We Already Collect Today

### Accounts

Current sources:

- Supabase auth users
- `runner_profiles`
- `plan_cycles`

Useful metrics now:

- total users
- users with profile
- users without profile
- users with active plan
- users without active plan
- newly created users over time, if auth user creation timestamps are available through admin API
- profile completion ratio

### Onboarding / Activation

Current sources:

- `runner_profiles`
- `plan_cycles.source_kind`
- `plan_cycles.schema_version`
- `plan_cycles.created_at`

Useful metrics now:

- users who completed setup
- users who created a first plan
- setup-to-active-plan conversion
- plan creation source mix:
  - structured constructor
  - text / AI
  - voice
  - JSON import
  - active-plan refresh replacement
- first-plan creation over time
- active vs archived plan counts

Limit:

- exact “onboarding submitted but not created” needs event instrumentation later.

### Plan Usage / Adherence

Current sources:

- `planned_workouts`
- `workout_logs`
- `plan_cycles`

Useful metrics now:

- total planned workouts
- total logged workouts
- completed / partial / skipped counts
- completion rate
- completion trend by day/week
- per-user planned vs logged summary
- users with active plan but no recent logging
- users with no workout logs after plan creation
- active plans with upcoming workouts

### Garmin / Workout Feedback

Current sources:

- `workout_result_assets`
- `workout_actual_metrics`
- `workout_comparisons`
- `workout_ai_insights`
- `planned_workouts`
- `workout_logs`

Useful metrics now:

- workouts with evidence attached
- asset upload count
- parse success vs parse failure from asset parse status/error fields
- normalized actual metrics count
- comparisons generated vs missing
- AI insights generated vs missing
- upload -> actual metrics -> comparison -> AI insight funnel
- common parse failure summaries when normalized enough to group
- feedback coverage by user

Limit:

- “upload started but failed before asset row” needs event instrumentation later.

### AI / Monetization Readiness

Current sources:

- `runner_entitlements`
- `runner_capability_usage`
- `workout_ai_insights`
- plan-refresh proposal/apply rows if emitted as plan/source truth

Useful metrics now:

- effective no-row Pro users
- explicit Pro users
- explicit Basic users
- active vs inactive entitlement rows
- capability usage by capability key
- included Basic `ai_plan_update` usage
- generated workout AI insights count
- premium actions blocked only where backend records capability usage/blocked events later

Limit:

- token counts and model costs are not available until product emits that truth.
- do not invent token/cost graphs in Phase 1.

## Recommended Visualizations

Use compact, useful charts only.

### Phase 1 Visualizations From Existing Truth

- overview metric cards:
  - users
  - profiles
  - active plans
  - logged workouts
  - Garmin evidence
  - AI insights
- daily/weekly new users line chart when auth created timestamps are available
- setup -> active plan conversion funnel
- plan creation source stacked bars
- completed / partial / skipped trend bars
- Garmin upload -> parsed -> compared -> AI ready funnel
- active users by logging recency buckets:
  - logged in last 7 days
  - 8-30 days
  - 31+ days
  - never logged
- entitlement mix stacked bar:
  - no-row effective Pro
  - explicit Pro
  - explicit Basic
- per-user sortable table with activity summary

### Phase 2 Visualizations After Events/Failures

- top recurring failure reasons table
- failures over time by feature area
- capability locked events over time
- onboarding review/confirm funnel
- Garmin upload started -> asset row -> parsed -> compared -> AI insight funnel
- plan refresh requested -> proposed -> applied/stale/blocked funnel

### Not Worth Adding Yet

- time online
- session duration
- token/cost charts
- retention curves beyond rough logging recency
- dashboard-style vanity charts without a decision attached

## Operational Event Layer

Add one backend-owned event model in Phase 2.

Recommended table:

- `app_events`

Purpose:

- capture important product workflow events that are not already represented by canonical entity rows
- support funnels and operational debugging
- avoid parsing server logs for product analytics

Suggested fields:

- `id`
- `event_name`
- `feature_area`
- `user_id nullable`
- `session_id nullable`
- `plan_cycle_id nullable`
- `planned_workout_id nullable`
- `workout_log_id nullable`
- `provider nullable`
- `capability_key nullable`
- `status`
- `severity`
- `occurred_at`
- `request_id nullable`
- `metadata jsonb`

Event names to support first:

- `onboarding_submitted`
- `onboarding_review_ready`
- `first_plan_created`
- `plan_refresh_proposed`
- `plan_refresh_applied`
- `workout_log_saved`
- `garmin_upload_started`
- `garmin_parse_failed`
- `garmin_comparison_generated`
- `workout_ai_insight_generated`
- `voice_to_plan_draft_requested`
- `voice_to_plan_clarification_required`
- `voice_to_plan_confirmed`
- `capability_locked`

Payload rules:

- store small normalized metadata only
- no raw transcripts
- no raw FIT data
- no full OpenAI prompts/responses
- no access tokens
- no large payload blobs
- no sensitive body-note text unless explicitly reviewed and redacted

Retention posture:

- keep raw events for a bounded window later, such as 90-180 days, if volume grows
- aggregate only after raw event volume proves meaningful
- Phase 2 can start without automatic retention cleanup if volume is tiny, but the table design should not assume infinite growth

## Error / Failure Tracking

Use a separate lightweight failure table rather than overloading `app_events`.

Recommended table:

- `app_failures`

Reason:

- events are chronological workflow facts
- failures need grouping, recurrence, and triage-friendly fields
- keeping failures separate prevents analytics events from becoming noisy bug records

Suggested fields:

- `id`
- `failure_key`
- `category`
- `feature_area`
- `action_name`
- `user_id nullable`
- `plan_cycle_id nullable`
- `planned_workout_id nullable`
- `workout_log_id nullable`
- `provider nullable`
- `capability_key nullable`
- `severity`
- `normalized_error_code`
- `summary`
- `details jsonb`
- `first_seen_at`
- `last_seen_at`
- `occurrence_count`
- `last_request_id nullable`
- `status`

Failure categories:

- `server_action_failed`
- `validation_failed`
- `parse_failed`
- `ai_generation_failed`
- `stale_apply_failed`
- `capability_blocked`
- `external_integration_failed`
- `persistence_failed`

Grouping rule:

- one recurring failure group should aggregate by normalized feature/action/error code, not raw stack text
- raw details should be small and redacted
- repeated failures increment `occurrence_count` and update `last_seen_at`

Examples:

- Garmin parse failure for unsupported FIT structure
- OpenAI plan refresh proposal validation failure
- stale proposal apply blocked
- capability locked for `voice_to_plan`
- settings save validation failure

## Bug Backlog / Issue Queue

Raw events are not bugs.

Raw failures are not necessarily bugs.

Issues are curated triage records created from recurring failures or admin observation.

Recommended Phase 3 table:

- `admin_issues`

Suggested fields:

- `id`
- `title`
- `description`
- `feature_area`
- `status`
- `severity`
- `priority`
- `owner`
- `created_by`
- `created_at`
- `updated_at`
- `first_seen_at`
- `last_seen_at`
- `recurrence_count`
- `linked_failure_key nullable`
- `linked_user_id nullable`
- `linked_plan_cycle_id nullable`
- `linked_planned_workout_id nullable`
- `linked_provider nullable`
- `notes jsonb`

Statuses:

- `open`
- `triaged`
- `in_progress`
- `blocked`
- `resolved`
- `wont_fix`

V1 issue capabilities:

- create issue from a failure group
- create issue from manual admin observation
- link issue to user/feature/failure/workout/provider where relevant
- update status/severity/priority/owner
- add short notes or reproduction hints

Do not build:

- comments threads
- file attachments
- sprint boards
- full external tracker replacement
- assignment notifications
- public support tooling

External tracker posture:

- keep issues inside Hito first for fast internal triage
- design IDs and fields so later export/push to Linear/GitHub/Jira is possible
- do not integrate external tracker in v1

## Admin Usability Recommendations

The admin page should be calm and useful, not flashy.

Useful controls:

- time range filter:
  - 7 days
  - 30 days
  - 90 days
  - all time
- feature area filter
- status filter for failures/issues
- severity filter
- entitlement tier filter
- user search by email/name/id
- click metric -> supporting table rows
- copyable IDs and timestamps
- sort by:
  - most broken
  - most active
  - recently active
  - needs attention
  - highest recurrence

Useful tables:

- per-user activity summary
- recent plans
- Garmin feedback pipeline rows
- recurring failures
- issues

Per-user drilldown should stay bounded:

- user identity/profile summary
- active/archived plan count
- planned/logged counts
- last workout log date
- Garmin evidence count
- AI/entitlement usage
- recent failures linked to that user

Do not expose raw sensitive payloads by default.

## Phase 1 - Existing Truth Analytics

Goal:

- make `/admin/analytics` useful immediately without new telemetry tables

Scope:

- admin auth/session
- analytics loader using existing Supabase/admin auth truth
- Overview
- Funnel & Usage basics
- Integrations / Feedback basics
- AI & Entitlements basics
- per-user table

Implementation status:

- Complete and QA-green as the Phase 1 milestone.
- Backend loader contract slice implemented on 2026-05-23:
  `src/lib/admin-analytics.ts` exposes a server-action-ready Phase 1 analytics loader, and `src/lib/admin-analytics.server.ts` owns admin verification, existing Supabase truth aggregation, bounded accounts/activation, plan, workout, Garmin feedback, AI/entitlement, and per-user view-model shaping, plus sensitive payload exclusion.
- Backend classification slice implemented on 2026-05-24:
  `src/lib/admin-user-classification.ts` owns real/test/local/admin/suspected user classification, `src/lib/admin-analytics.server.ts` filters product analytics to real users only, returns excluded classified rows separately, and `src/lib/admin-local-test-accounts.server.ts` adds matching classification metadata to local Test accounts rows without changing delete behavior.
- Frontend rendering slice implemented on 2026-05-23:
  `/admin/analytics` now renders Overview, Funnel & Usage, Feedback, AI & Entitlements, and Users tabs from the backend analytics view model while keeping local Test accounts as its own guarded tab.
- Frontend operational table slice implemented on 2026-05-24:
  `/admin/analytics` keeps the Users table scoped to backend-classified real users, moves local/test/admin/suspected rows into Test accounts, and adds Hito table controls with collapsed search, active-filter summaries, DS-owned sortable/non-sortable table-header states, wider true-table layouts, and contained horizontal scrolling without changing backend classification, analytics aggregation, admin auth, or tester deletion contracts.
- Safari QA passed with a single protected local admin fixture; normal tester access is blocked; public/client bundle scan found no sensitive admin analytics payload strings or server-only leaks.

Backend:

- admin auth check
- aggregate existing truth
- return backend-shaped view model

Frontend:

- one admin page with tabs/sections
- compact charts/tables using existing Hito primitives
- no separate admin design system

QA:

- admin-only access
- non-admin blocked
- counts match DB spot checks
- empty states work

## Phase 1A - Local Test Account Management

Goal:

- make local tester account operations visible and safer for internal QA without creating production user management

Implementation status:

- Complete and QA-green as the Phase 1A milestone.
- Backend contract slice implemented on 2026-05-22:
  `src/lib/admin-local-test-accounts.ts` exposes server-action-ready list/delete seams, and `src/lib/admin-local-test-accounts.server.ts` owns the local-runtime/admin guard, local accounts-file read/write, protected-admin refusal, bounded view model, and Supabase auth-user deletion for local tester accounts.
- Frontend rendering slice implemented on 2026-05-22:
  `/admin/analytics` now exposes the local-only `Test accounts` section, renders the backend-shaped account table and bounded unavailable/empty states, shows local bypass passwords only from that backend view model, and requires exact email confirmation before calling the server delete action for tester rows.
- Safari QA passed for admin table render, protected admin row, tester deletion, exact email confirmation, non-admin gating, and client/server boundary. Preserve exactly one protected local admin fixture for future QA.

Scope:

- `Test accounts` section inside `/admin/analytics`
- server-only local test-account loader
- server-only tester delete action
- optional tester create/reset action only if the existing `test-user` semantics are reused or extracted
- local-runtime unavailable state outside loopback local-auth mode

Backend:

- guard every loader/action with admin access plus local loopback/runtime checks
- read `.tanstack/hito-running-local-accounts.json` server-side only
- include username, email, local password, role, display name, and linked status in the admin view model
- mark protected admin accounts and block deletion server-side
- reuse or extract shared helpers from `scripts/test-user.mjs` for create/reset/delete behavior
- never return real Supabase auth secrets, sessions, tokens, magic links, service keys, or production credentials

Frontend:

- render a small table
- show local plaintext passwords only for local tester accounts
- disable protected admin delete
- require explicit confirmation before delete
- show refresh/unavailable/empty states
- do not build general user search, role management, or password reset UI

QA:

- admin in local runtime sees accounts
- normal runner is blocked
- non-local runtime shows unavailable state and returns no account data
- protected admin delete is blocked
- delete removes local tester and linked tester auth/data safely
- script-created tester appears after refresh

## Phase 2 - Events And Failures

Goal:

- add operational visibility for workflows not captured by entity rows

Scope:

- `app_events`
- `app_failures`
- event writer helper
- failure recorder helper
- bounded instrumentation on high-value workflows
- recurring failure summary

Start instrumentation with:

- onboarding review/confirm
- voice-to-plan draft/confirm
- plan refresh propose/apply
- workout log save
- Garmin upload/parse/comparison/AI insight
- entitlement locked

Do not instrument every function.

## Phase 3 - Internal Issue Backlog

Goal:

- stop losing recurring product problems in logs

Scope:

- `admin_issues`
- create issue from failure group
- manual issue creation
- issue status/severity/priority/owner
- issue list and detail drawer/section

Keep it internal and small.

## Backend Responsibilities

- own admin auth/session truth
- own admin analytics aggregation
- own local-runtime/admin guards for the local `Test accounts` section
- own server-only local test-account loading from `.tanstack/hito-running-local-accounts.json`
- own tester create/reset/delete actions only by reusing or extracting existing `scripts/test-user.mjs` safety semantics
- own `app_events` and `app_failures` write APIs
- own failure grouping and recurrence increments
- own issue persistence and transitions
- redact sensitive metadata before persistence
- keep admin APIs unavailable to normal runner auth
- keep local test-account APIs unavailable outside loopback local-auth runtime

## Frontend Responsibilities

- render backend-shaped admin data
- provide filters, tables, compact charts, and drilldowns
- render local `Test accounts` rows from the backend view model only
- show local plaintext passwords only where the backend has identified a local tester account
- require explicit confirmation before test-account deletion
- expose failure-to-issue and manual issue creation only after backend supports it
- show empty/error states
- avoid client-only analytics calculations beyond presentation-level grouping
- avoid client-side credential or account-management authority

## QA Expectations

Phase 1 QA:

- admin auth required
- normal runner cannot access route or loader
- summary counts match database queries
- per-user table counts match spot-check users
- Garmin/AI/entitlement counts handle zero rows cleanly

Phase 1A test-account QA:

- section is visible only in local loopback local-auth runtime for admin
- normal runner cannot load local test account data
- local tester username/email/password/role/display name/link status are visible
- passwords are shown only for local bypass tester accounts
- protected admin delete is disabled in UI and blocked by backend
- delete removes the local account and safely deletes/resets linked tester Supabase auth/data using the existing test-user semantics
- tester accounts created by script appear after refresh
- unavailable state appears outside local runtime

Phase 2 QA:

- events are emitted once per important workflow action
- failures group by normalized key instead of duplicating raw errors
- sensitive payloads are not stored
- recurring failure count increments

Phase 3 QA:

- issue can be created from recurring failure
- issue can be created manually
- linked user/feature/failure references persist
- status/severity/priority updates persist

## Boundaries

Do not:

- build a broad BI system
- build a full bug tracker inside Hito
- invent time-online metrics
- invent token/cost metrics before the product emits them
- create a second admin design system
- expose admin tools to normal runner auth
- depend on loopback local bypass as final admin auth
- expose local test-account management outside local loopback runtime
- expose real Supabase auth passwords, tokens, sessions, magic links, service keys, or production credentials
- create a broad production user-management or credential-management system
- store raw prompts, raw transcripts, raw FIT payloads, tokens, or sensitive body-note text in events

## Risks

- Admin metrics can become misleading if frontend aggregates locally from partial data.
- Raw logs can become noisy if every validation error becomes a bug.
- Event payloads can accidentally store sensitive user context.
- A small issue queue can sprawl into a tracker product if scope is not enforced.
- Admin auth must not piggyback on local development bypass.
- Test-account management can become dangerous if local-only guards are UI-only instead of backend-owned.
- Deleting local testers can corrupt useful QA state if it duplicates, rather than reuses, the existing `scripts/test-user.mjs` safety semantics.

## Exit Criteria

Phase 1 exit:

- Complete.
- `/admin/analytics` has admin-only access
- existing-truth Overview and per-user table are live
- onboarding/plan/log/Garmin/AI/entitlement metrics are backend-shaped

Phase 1A test-account exit:

- Complete.
- local-only `Test accounts` section is guarded by backend admin plus local-runtime checks
- table reads `.tanstack/hito-running-local-accounts.json` through a server-only loader
- protected admin accounts cannot be deleted
- tester delete reuses/extracts existing `scripts/test-user.mjs` safety behavior
- script-created testers appear after refresh
- no production credentials or real auth secrets are exposed

Phase 2 exit:

- event/failure model exists
- high-value workflows emit bounded events/failures
- recurring failure summary appears in admin

Phase 3 exit:

- admin can create and triage small internal issues
- issues can link to failure groups and product entities
- raw failures remain separate from curated issues

## Next Recommended Role

None

## Suggested Next Step

No next step in this archived plan. Start a new active plan for Phase 2 `app_events` /
`app_failures` only when a concrete ops need, recurring failure pattern, or product-analysis gap
proves that existing-truth analytics are no longer enough.
