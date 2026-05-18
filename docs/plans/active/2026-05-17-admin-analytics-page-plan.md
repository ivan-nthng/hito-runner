Status

Draft

Owner

Architect

Last Updated

2026-05-17

Context

Hito now has one runner-facing product shell, one canonical Supabase-backed saved-mode truth, and one growing set of AI-backed flows:

- text-first plan creation
- Garmin feedback
- AI workout interpretation
- `Update plan` proposal/apply

The next request is not a runner feature.

It is a small internal admin surface:

- one page for product/admin analytics
- reuse the main Hito shell/layout language
- access limited to one admin user by username/password
- start small, then upgrade later

Problem Definition

The requested admin page should now start smaller than the earlier broader analytics concept.

The current ask is closer to:

- how many users exist
- how many plans exist
- how many workout days each user has marked
- how many total workout days have been logged

That is good, because these metrics already live inside canonical saved-mode truth.

The first architectural requirement is still honesty:

- use only data Hito already persists today
- do not block v1 on telemetry we do not yet have
- do not fake online-time or token metrics in the first slice

Product Decision

Add one internal admin route:

- `/admin/analytics`

Use the main AppShell and current Hito page language as the base:

- same shell family
- same calm summary style
- no separate visual product

But do not make it part of normal runner navigation yet.

This is an internal admin surface, not a runner-facing product route.

Access Model

Use one dedicated admin-only username/password auth gate for this surface.

Canonical rule:

- do not reuse runner email auth as the protection model
- do not rely on the current loopback-only local bypass as the production/admin solution
- do not hardcode credentials in the tracked repo

Recommended v1 contract:

- one server-only admin credential source
- one httpOnly admin session cookie
- one backend role check for `/admin/analytics`

The provided username/password should live only in untracked server-only config, not in committed code or docs.

Why this model

- it matches the requested “only by username and password” access
- it keeps admin access separate from runner saved-mode auth
- it avoids pretending that the temporary local bypass is the long-term admin model

Canonical Data Truth

The page should combine only backend-owned truth.

Current canonical sources for v1:

- Supabase auth users
- `runner_profiles`
- `plan_cycles`
- `workout_logs`

Optional later sources:

- `planned_workouts`
- Garmin evidence tables
- future presence/session telemetry
- future AI usage events

No client-only counters should be treated as admin truth.

V1 Metric Groups

### 1. Accounts

Available immediately:

- total registered users
- users with runner profile
- users with active plan
- users with no plan yet

### 2. Plans

Available immediately:

- total plan cycles created
- active plans
- archived plans
- plan creations by `source_kind`
- count of `active_plan_refresh_v1` plans

### 3. Logged workout days

Available immediately from `workout_logs`:

- total logged workout days
- total `completed`
- total `partial`
- total `skipped`

### 4. Per-user summary row

Available immediately from existing truth:

- user label
- whether runner profile exists
- whether active plan exists
- total logged workout days
- completed count
- partial count
- skipped count

This is the most useful first table for the admin v1.

Smallest Useful V1

Start with one honest admin summary page:

- top summary row:
  - registered users
  - profiles created
  - active plans
  - total plans created
- second summary row:
  - total logged workout days
  - completed
  - partial
  - skipped
- lower section:
  - per-user table with the same counts per user

This is enough to make the page useful immediately without introducing telemetry or fake admin chrome.

Page Structure

Recommended page anatomy:

- AppShell
- page header:
  - `Admin analytics`
  - quiet subtitle explaining internal product summary
- grouped summary metrics using the same compact Hito analytics language as `/progress` and `/hitoDS`
- divider-based sections, not dashboard chrome

Recommended sections:

1. Product summary
2. Plan lifecycle
3. Logged workout totals
4. Per-user activity table

Do not start with:

- complex charts
- drilldown explorer
- full admin CMS
- separate admin design language

Auth And Navigation Recommendation

Route should be direct and hidden by default:

- no primary nav item
- no runner menu item for non-admin users
- optional quiet shell/menu entry only when the backend confirms admin session

This keeps the runner shell clean while still reusing the same layout family.

Explicitly Out Of V1

These are still valid later analytics directions, but not part of the first admin slice:

- time online
- active session duration
- AI token usage
- AI cost summary
- complex charts
- Garmin deep analytics

They should be added only after the small counts-based admin page is live.

Backend Responsibilities

- add one admin-only authenticated backend route/data seam for analytics
- compute immediately available product metrics from current Supabase truth
- introduce one server-only admin credential/session contract
- keep all admin metrics backend-shaped before rendering

Suggested backend output for v1:

- summary totals object
- plan totals object
- log totals object
- per-user rows array

Frontend Responsibilities

- add one `/admin/analytics` route using AppShell
- render compact grouped summary metrics using existing Hito summary primitives
- show admin entry only when backend confirms admin access
- render one simple per-user table without adding dashboard complexity

What We Reuse

- `AppShell`
- the compact summary truth pattern from `/progress`
- the summary/metric language documented in `/hitoDS`
- existing backend-owned saved-mode truth in Supabase

What We Must Not Do

- do not hardcode admin credentials in tracked files
- do not treat temporary loopback local bypass as the final admin auth model
- do not ship fake “time online” or fake “AI tokens” numbers
- do not make a separate admin dashboard design system
- do not widen this into a full admin console yet

Recommended Rollout

### Phase 1

Admin auth + page skeleton + immediately available product counts

### Phase 2

Optional later telemetry instrumentation only if still useful:

- presence/session analytics
- AI usage/token analytics

Risks

- the easiest wrong move is overbuilding v1 into a dashboard product
- if admin auth is built by reusing loopback-only local bypass, the page will not have a stable long-term access model
- if frontend invents analytics aggregation locally, the page will drift from canonical truth quickly

Exit Criteria

- one canonical admin analytics route is defined
- one admin-only username/password access model is defined without storing credentials in tracked repo files
- the first admin page can render honest existing saved-mode counts only
- per-user logged-day counts are part of the canonical v1 scope

Next Recommended Role

BACKEND

Suggested Next Step

Define the backend contract first: one admin-only auth/session model plus one analytics loader that returns summary counts and per-user logged-day totals from existing Supabase truth before any frontend page implementation begins.
