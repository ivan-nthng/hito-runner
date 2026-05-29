# Admin Capture Backlog Page Revision

## Status

backlog

## Type

frontend_spec

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Revise the admin Backlog page so it reads as a normal Hito Admin workbench surface.

## Stage

FRONTEND implementation

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Revise the admin Backlog page so it reads as a normal Hito Admin workbench surface.

STAGE:
FRONTEND implementation

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-revision.md
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

DESIGNER

## Last Updated

2026-05-28

## Related Sources

- `docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md`
- `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-design.md`
- `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-copy.md`
- `src/routes/admin.capture.tsx`
- `src/routes/admin.analytics.tsx`
- `src/routes/hitoDS.tsx`

## 1. Task

Revise the `/admin/capture` Backlog page so it reads as a normal Hito Admin workbench page, not a separate "Capture backlog" mini-app.

## 2. Stage

DESIGNER revision / admin backlog UX correction.

## 3. UX Problem Summary

The implemented route has the right backend-owned backlog concept, but the visible page structure is too heavy and too separate from the existing admin shell.

Current issues to correct:

- The route name `Capture backlog` makes the page feel like a product sub-app. The visible label should be `Backlog`.
- Sidebar navigation currently creates two active-looking levels: `Analytics` / `Capture backlog` plus analytics tab items. Backlog should be one normal admin sidebar item alongside the admin workbench destinations.
- `Back to analytics` makes Backlog feel like a child of Analytics. It should be removed.
- `Back to Hito` should keep the existing admin behavior/pattern, not compete with page-level actions.
- The page title area is too large and duplicated by `Captured admin work`.
- `Quick note` is too prominent as a full-width disclosure. It should be a normal header action.
- Detail view uses too many nested bordered blocks.
- Triage controls feel like form selects rather than compact Hito metadata controls.
- The actual task/prompt body is not visually important enough.
- `Append note` dominates detail even when the item is already task/doc-backed.
- Screenshot/assets should not render as a heavy section in this slice.

## 4. Revised Page Structure

Canonical page structure:

1. Existing admin workbench shell.
2. Sidebar with a single admin navigation stack.
3. Compact page header.
4. Header action: `Add quick note`.
5. Status tabs.
6. Compact search/filter row.
7. Dense backlog list.
8. Inline compact detail document for the selected item.

The page should feel like another admin workbench view, not a standalone capture product.

Recommended visible hierarchy:

- Micro-label: `Admin`
- Page title: `Backlog`
- Intro copy: one short internal sentence
- Right action: `Add quick note`
- No second hero title below the header
- No `Captured admin work` section header

## 5. Sidebar / Navigation Rules

Use one admin sidebar navigation model.

Rules:

- Rename visible route label from `Capture backlog` to `Backlog`.
- Add Backlog as a normal admin sidebar item.
- Do not show `Analytics` as an active-looking parent item when `Backlog` is active.
- Do not show both `Analytics` and `Overview` active at the same time.
- If analytics subsections remain route-local tabs, they should appear only inside `/admin/analytics`, not in the `/admin/capture` sidebar.
- On `/admin/capture`, the active sidebar item is only `Backlog`.
- Remove top `Back to analytics`.
- Preserve the existing `Back to Hito` placement and visual style from admin analytics.
- Mobile admin route rail should use `Backlog`, not `Capture backlog`.

Preferred sidebar items:

- `Overview`
- `Funnel & Usage`
- `Feedback`
- `AI & Entitlements`
- `Users`
- `Test accounts`
- `Backlog`

If these analytics sections cannot route independently yet, Frontend may keep `/admin/analytics` as the destination for analytics items, but active state must not imply Backlog is nested under Analytics.

## 6. Header / Action Layout

Header should be compact and operational.

Header anatomy:

- Left:
  - `hito-micro-label`: `Admin`
  - title: `Backlog`
  - one short support line
- Right:
  - `Add quick note` button
  - existing `Back to Hito` action if the admin shell currently places it in the header

Header copy placeholders:

- Title: `Backlog`
- Support copy: `Review captured work and copy prompts for manual handoff.`
- Primary header action: `Add quick note`

Do not include:

- `Capture backlog` title
- `Captured admin work`
- `Back to analytics`
- large duplicate `Generated` block in the main visual hierarchy

Generated timestamp can move to quiet metadata near the list count or footer of the utility row.

## 7. List Layout

Keep the list-first model, but make rows more compact.

Each row should show:

- title
- status
- priority
- target role
- type
- created date
- route or file hint when present
- small prompt-ready marker if true
- screenshot/file presence as text metadata only

Row density:

- one primary line for title and compact pills
- one secondary line for route/file, created date, source, and screenshot/file hint
- chevron at far right
- no big per-row card treatment beyond the existing `hito-row-group` / `hito-list-row` rhythm

Status tabs/search/filters:

- keep `hito-tabs hito-tabs-simple`
- keep collapsed search
- keep compact Filters button
- avoid standalone select rows
- avoid extra "Captured admin work" wrapper section

## 8. Detail Layout

Detail should read like one compact work item document.

Top of detail:

- task title
- compact editable metadata controls near the title:
  - status
  - type
  - priority
  - target role
- created and updated dates as quiet metadata

Main body order:

1. Prompt/task body block
2. Context metadata
3. Notes, if useful
4. Technical details collapsed

Detail should not use nested card grids.

Replace current nested `DetailBlock` cards with:

- one open detail panel background
- internal dividers
- compact rows
- optional `hito-disclosure` for technical context

Do not render `Assets` as a card. In this slice, show screenshot/file paths as plain metadata if present.

## 9. Metadata Editing Model

Status, type, priority, and target role should feel like metadata, not a full form.

Recommended treatment:

- compact pill/dropdown controls
- use existing dropdown/menu primitives or Hito select styling only if it can be visually compact
- labels can be visually hidden or represented by pill text where accessible
- updates save immediately through backend
- show brief inline save/error feedback near metadata row

Controls:

- Status: dropdown pill
- Type: dropdown pill
- Priority: dropdown pill, can show `Unset`
- Target role: dropdown pill, can show `No role`

Do not use four large stacked select fields in the detail.

## 10. Prompt / Code Block Behavior

The prompt/task body is the primary detail content.

Prompt block anatomy:

- block header:
  - label: `Prompt`
  - small metadata such as target role if useful
  - right action: `Copy`
- body:
  - markdown/code-style block
  - monospace or technical readable treatment
  - preserves line breaks
  - selectable text
- footer/helper:
  - copy success/error only when relevant

Copy behavior:

- `Copy` button at top-right of prompt block.
- If clipboard copy works, show brief `Copied`.
- If copy is blocked, keep prompt text visible and selectable.
- Do not hide the generated prompt behind a button.
- Do not make `Copy prompt` the only way to see the task.

If backend copy prompt is generated async:

- show loading state in the prompt block.
- if generation fails, show error plus retry.
- if prompt is already included in view model, render it immediately.

## 11. What To Remove From Current UI

Remove or demote:

- `Capture backlog` visible title.
- `Captured admin work` section header.
- `Back to analytics` top action.
- duplicate active-looking `Analytics` and `Capture backlog` nav stack.
- full-width `Quick note` disclosure in the main list area.
- large nested `Captured context`, `Triage`, `Admin note`, `Assets`, `Prompt handoff`, and `Metadata` cards.
- primary visible `Append note` section for existing doc/task-backed items.
- heavy `Assets` section.
- form-like stacked selects for triage metadata.

Keep, but make quieter:

- search
- filters
- status tabs
- route/URL/selector metadata
- append note for capture/quick-note items only, behind a secondary disclosure or compact action

## 12. Hito DS Primitive Mapping

Reuse existing primitives:

- admin workbench shell from `/admin/analytics`
- `HitoLogo`
- `hito-shell-nav-row`
- `hito-workbench-topbar`
- `hito-tabs hito-tabs-simple`
- `hito-data-table-utility-row`
- `hito-data-table-search`
- `hito-data-table-filter-summary`
- `hito-row-group`
- `hito-list-row`
- `hito-status-pill`
- `hito-button`
- `hito-shell-menu`
- `hito-disclosure`
- `hito-technical-mono`
- `hito-field` only where a real text input/textarea is needed
- existing dialog anatomy if `Add quick note` opens a modal

Nearest existing primitive for metadata controls:

- use `hito-status-pill` visual language plus dropdown/menu behavior.
- if implementation needs a class, extend with a small metadata-control class only after trying `hito-button hito-button-secondary hito-button-xs` with status-pill-like content.

No new backlog UI kit.

## 13. Frontend Implementation Notes

Recommended correction sequence:

1. Rename visible labels:
   - `Capture backlog` -> `Backlog`
   - page title -> `Backlog`
   - mobile route rail -> `Backlog`
2. Normalize sidebar:
   - make Backlog one normal admin sidebar item.
   - remove duplicate parent/child active states.
3. Header cleanup:
   - remove `Back to analytics`.
   - move `Add quick note` to header right.
   - remove `Captured admin work` header block.
4. List cleanup:
   - keep tabs/search/filters.
   - keep rows compact.
5. Detail cleanup:
   - replace nested cards with one compact detail document.
   - move editable metadata controls beside title.
   - show prompt block as primary content with `Copy`.
   - demote append note.
   - render screenshot/file paths as plain text metadata.

Suggested implementation targets:

- `src/routes/admin.capture.tsx`
- shared admin shell pieces if already extracted
- no backend schema changes

If the backend currently returns prompt only through `getAdminCaptureCopyPrompt`, Frontend may fetch prompt on detail expansion and render it in the block. The key requirement is that the prompt becomes visible content, not only an invisible copy side effect.

## 14. Open Questions, Only If Blocking

No blocking design questions.

Non-blocking implementation question:

- Does the list/detail view already have prompt text in the item view model, or must Frontend call the copy-prompt seam on expansion to populate the visible prompt block?

## 15. Verdict

The page should be corrected, not redesigned. Keep the backend-owned backlog and list-first model, but make the route feel like a native Hito Admin workbench page:

- call it `Backlog`
- make it one normal sidebar item
- compact the header
- move quick note to the header action
- make detail a single work-item document
- make the prompt/task body the main content
- remove nested cards and heavy assets treatment
- keep all controls inside existing Hito DS/admin primitives

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined a focused correction pass for `/admin/capture` so the Backlog route feels native to Hito Admin instead of a separate mini-app.

### Key Decisions

- Rename visible route/page label to `Backlog`.
- Treat Backlog as one normal admin sidebar item.
- Remove `Back to analytics` and the duplicate `Captured admin work` content header.
- Move `Add quick note` to the compact page header.
- Replace nested detail cards with one compact work-item document.
- Show the prompt/task body as a visible markdown/code-style block with a top-right Copy action.

### Current State

- `/admin/capture` is implemented and QA-passed functionally, but needs visual/UX correction.
- Existing Hito DS/admin primitives are sufficient for the correction.

### Constraints

- No backend schema redesign.
- No screenshot upload implementation.
- No route-spanning capture overlay.
- No live editing.
- No Codex auto-dispatch.
- No new backlog UI kit.

### Risks / Open Questions

- Frontend may need to fetch deterministic prompt text on detail expansion if it is not already in the item view model.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Apply the `/admin/capture` Backlog UI correction using this revision spec, then run visual QA on sidebar active state, compact header, list scanability, detail prompt visibility, metadata editing, and mobile/tablet layout.
```
