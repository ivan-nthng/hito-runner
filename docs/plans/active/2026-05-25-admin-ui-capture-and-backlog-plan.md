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

## Last Updated

2026-07-02

## Current Truth

Hito already has the admin backlog/review queue, backend admin capture contract, repo-work-item import
mirror, and admin auth/session resolver. The remaining
active work is not another backlog route. It is the local/dev-only inline debugger overlay that can
capture element-level UI feedback from any accessible Hito route and save a normalized capture item for
manual review in `/admin/capture`.

The debugger is a portable pseudo-service boundary:

`target app -> Hito Debugger overlay/client -> element inspection normalization -> debugger API -> normalized capture record -> Hito Admin Work Items -> deterministic copy-prompt generation -> manual Codex handoff`

The overlay must be absent from pushed/deployed production runtime. Production builds must not render
the launcher, activate `?adminCapture=1`, expose inline selection mode, or expose a debugger-specific
client capability, even for admins.

## Completed

- `/admin/login` is the dedicated owner-admin login surface.
- `/admin/analytics` and `/admin/capture` are standalone admin workbench routes, not runner `AppShell`
  surfaces.
- `admin_capture_items` is the current Supabase backlog table; unused screenshot asset storage was
  retired from the active contract.
- `/admin/capture` Backlog v1 lists, filters, opens, triages, and copies deterministic prompts.
- Repo-authored markdown work items can be imported as read-only mirrors with canonical metadata:
  `Status`, `Type`, `Priority`, `Next Recommended Role`, `Task`, `Stage`, and `Exact Handoff Prompt`.
- Stale repo-derived mirrors can be detected and archived only through explicit importer flags.
- Repo-derived rows are read-only in admin; markdown remains the canonical editable source.
- Manual quick notes are scratchpad/intake records and can be deleted; repo-derived mirrors and captured
  UI records are not normal delete targets.
- Admin auth/session is consolidated through `AdminAccessContext`; local admin sessions are signed,
  test accounts are separate, and normal testers/runners are rejected by admin routes.
- No dormant overlay capability or server action is kept before the local/dev debugger overlay has a
  concrete accepted consumer.

## Product Contract

V1 debugger flow:

1. Admin signs in through `/admin/login`.
2. Admin opens any accessible Hito route in local/dev.
3. Backend admin verification succeeds.
4. A small local/dev floating launcher appears.
5. Admin starts capture/inspect mode.
6. Admin hovers and selects a visible element.
7. Debugger shows Hito DS overlay chrome with selected-element context.
8. Admin creates either a text-change capture or a comment/design/behavior note.
9. Debugger API saves a normalized capture item.
10. Admin opens Work Items, reviews the item, and manually copies the role-targeted prompt into Codex.

V1 must not:

- edit UI live;
- mutate code;
- auto-send to Codex;
- start background agents;
- expose capture controls to normal runners/testers/signed-out visitors;
- become a Jira/Linear replacement;
- ship an inline debugger in production/deployed builds.

## Hito DS Overlay Rules

Reuse existing Hito DS primitives and admin workbench patterns:

- tooltip/popover/dialog chrome;
- buttons and icon buttons;
- text inputs/textareas/selects;
- status pills;
- focus rings and helper/error copy;
- compact admin list/detail rhythm.

Do not create a route-local mini design system. Screenshot capture is optional/future; text, selector,
route, and bounded DOM context must work without screenshots.

## Access And Privacy

- Overlay is local/dev-only and admin-only.
- Normal runner/product sessions must not see launcher, overlay, or capture APIs.
- `?adminCapture=1` can remain only as a local/dev QA fallback.
- Captured text/screenshots may contain private data; UI copy must warn that captures are internal.
- Screenshot tooling, if added, must be lazy-loaded and private/admin-only.
- Source/component ownership mapping is best-effort only.

## Open Work

### Slice 4: Designer Interaction Spec

Owner: DESIGNER

Define the local/dev floating launcher, element-selection mode, capture panel anatomy, parent/child
stepping, collision/mobile behavior, privacy copy, and Hito DS reuse requirements.

Exit criteria:

- Frontend can implement without inventing UI.
- Launcher and capture panel are local/dev-only, admin-only, and internal.
- Production/deployed absence is explicit.
- V1 constraints remain: no live editing, no auto-Codex, no normal-user visibility.

### Slice 5: Frontend Inspect/Capture Mode

Owner: FRONTEND

Implement the route-spanning local/dev capture layer once near the root/app-shell boundary. Verify admin
capability before rendering. Support hover/select outline, parent/child stepping, bounded capture panel,
save-to-Work-Items, post-save actions, and graceful screenshot absence.

### Slice 6: QA Matrix

Owner: QA

Validate admin-only access, local/dev-only launcher, production/deployed absence, capture save, backlog
readback, prompt copy, no auto-dispatch, mobile behavior, and no normal-runner visibility.

## Risks

- Screenshot privacy and sensitive captured text.
- Selector stability after UI refactors.
- Admin-only or production leakage.
- Bundle weight from screenshot tooling.
- Overlay collision with the exact UI being reviewed.
- False precision from best-effort source/component mapping.

## Exact Handoff Prompt

```text
ROLE: DESIGNER

TASK:
Define the local/dev-only admin capture-layer interaction spec for the route-spanning admin debug/capture overlay.

STAGE:
DESIGNER spec / local/dev route-spanning admin capture layer

PLAN:
docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md

CONTEXT:
- Backend admin auth/session consolidation is implemented and QA-passed.
- Current admin access and capture actions support the implemented backlog only; add a debugger
  capability boundary only when the overlay has an accepted consumer.
- `/admin/capture` remains the backlog/review queue; the inline capture layer itself should work
  across accessible Hito product/admin/public/internal routes after admin verification only in
  local/dev runtime.
- Production/deployed builds must not show the inline debugger even for verified admins.

GOAL:
Create a concrete interaction spec for the local/dev admin floating launcher, element-selection mode,
capture panel, mobile behavior, privacy boundaries, and DS reuse so FRONTEND can implement without
inventing a route-local mini design system.

REQUIREMENTS:
- Reuse Hito DS primitives and existing admin workbench patterns.
- Do not create a new design-system layer or custom route-local UI kit.
- Define when the local/dev floating launcher appears, how it is dismissed/minimized, and how it avoids
  covering primary product actions.
- Define the production/deployed absence contract: no launcher, no overlay, no selection mode, and
  no `?adminCapture=1` activation.
- Define how capture mode starts, cancels, highlights hover/selected elements, and handles elements
  near viewport edges.
- Define selected-element breadcrumb and parent/child stepping so admins can correct an imprecise
  click without restarting capture.
- Define capture panel fields for type, note, optional priority/target role, route/component/context
  metadata, and screenshot availability/failure states.
- Define post-save actions: `Open Work Items`, `Copy prompt`, and `Capture another`.
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
