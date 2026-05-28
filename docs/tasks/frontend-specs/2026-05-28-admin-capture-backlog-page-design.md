# Admin Capture Backlog Page Design

## Status

Ready for Frontend planning after backend capture seams exist.

## Owner

DESIGNER

## Last Updated

2026-05-28

## Source Of Truth

- `docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `src/routes/admin.analytics.tsx`
- `src/routes/hitoDS.tsx`
- existing Hito DS primitives in `src/styles.css`

## Problem

Hito needs one admin-only backlog surface for captured UI feedback, quick admin notes, and future visual-capture assets. The page must make captured work easy to scan and triage without becoming a new issue tracker, live UI editor, or separate backlog design system.

Backend owns capture item truth, lifecycle values, assets, and deterministic prompt generation. Frontend owns only admin interaction: render, filter, expand, update allowed fields, copy generated prompts, and create quick notes through backend seams.

## Page Layout Recommendation

Use the existing admin workbench shell pattern from `/admin/analytics`.

- Route: `/admin/capture`.
- Shell: same standalone admin workbench shell, not runner `AppShell`.
- Sidebar: reuse HitoLogo + `Admin` lockup, `hito-shell-nav-row`, and existing admin navigation rhythm.
- Main header: open low-card page header with `hito-micro-label`, `hito-modal-title` or page title role, short support copy, and one compact secondary link back to `/admin/analytics` if needed.
- Primary content: list-first backlog with inline expandable detail. Do not start with a dense table as the primary object.

Decision: use a list-first layout with optional compact status sections, not table-first or permanent split-list/detail.

Why:

- Captured items are qualitative admin work, not pure analytics rows.
- Admins need to scan note, route, role, priority, status, and screenshot availability quickly.
- Inline expansion lets one item open without losing backlog context.
- A permanent split panel wastes space when many items are short and would become awkward under tablet widths.

Recommended structure:

1. Header: `Admin capture backlog`.
2. Utility row: collapsed search, active filters summary, compact quick note trigger.
3. Status tabs: `New`, `In review`, `Ready for Codex`, `Done`, `Archived`, plus `All` if backend view supports it.
4. Backlog list: grouped item rows ordered by newest or priority within selected status.
5. Inline item detail: opens below the selected row through disclosure/expanded row.
6. Empty/loading/error states in the list region, not as full-page replacements unless access fails.

## Admin Navigation Entry

Add `/admin/capture` as a sibling admin surface to `/admin/analytics`.

- Do not overload `/admin/analytics`.
- Existing admin tabs inside `/admin/analytics` should remain analytics-only.
- If a shared admin shell is extracted, keep the same sidebar language and active/current state rules already used by admin analytics.
- Sidebar items can be:
  - `Analytics`
  - `Capture backlog`
- Keep `Back to Hito` in the header or sidebar support region as existing admin surfaces do.

## Component Anatomy

### Backlog Utility Row

Use existing Hito data-table utility primitives even though the primary layout is a list.

- Collapsed search icon button by default.
- Expanded search field using `hito-data-table-search`.
- `Filters` button using `hito-data-table-filter-summary`.
- Active filter count badge/dot.
- Compact row count copy: `Showing X of Y items`.
- Quick note action: secondary or ghost button, visually quieter than filter/search.

Do not use standalone select dropdowns above the list.

### Status Tabs

Use `hito-tabs hito-tabs-simple`.

- Status tabs are the main backlog view switch.
- Active tab uses existing simple tab underline.
- Counts can be `hito-tab-badge` if backend provides counts.
- Avoid status cards.

### Backlog List Row

Use `hito-row-group` plus divided `hito-list-row` rhythm.

Each row should show:

- Primary title or fallback note excerpt.
- Item type pill: `Bug`, `Change request`, `Context capture`.
- Status pill.
- Priority pill only when set or high/urgent.
- Target role pill only when set.
- Route/path as technical mono or muted metadata.
- Created timestamp.
- Screenshot/asset marker when assets exist.
- Prompt-ready marker when target role and required context are enough for deterministic copy.
- Expand chevron.

Rows should be calm and dense enough for scanning:

- one primary text line
- one secondary metadata line
- right-side compact pills/actions
- no nested cards per item

### Item Detail / Disclosure

Open one item inline below its row. Multiple open items may be allowed, but v1 should prefer one open item at a time for clarity.

Detail content blocks:

- `Captured context`: route, URL, selected element text, nearby heading, selector/DOM path.
- `Admin note`: note body, with quick edit only if backend supports update.
- `Triage`: status, type, priority, target role controls.
- `Assets`: screenshot thumbnail strip when available; unavailable state when screenshot failed or none exists.
- `Prompt handoff`: deterministic prompt copy actions.
- `Metadata`: creator, created/updated time, viewport, bounded metadata summary.

Use dividers and rows before adding cards. Use `hito-disclosure` for technical metadata that should stay quiet.

### Quick Note Form

Quick note creates a backlog item without selecting a UI element.

Placement:

- Trigger in utility row: `Quick note`.
- Opens a compact dialog or inline disclosure near the top of the list.
- Prefer dialog if the form includes type, note, role, priority, and route fields.
- Prefer inline disclosure only if v1 form is note-only plus type.

Fields:

- Type: `Bug`, `Change request`, `Context capture`.
- Note: required textarea.
- Target role: optional.
- Priority: optional.
- Route/URL: optional, default empty or current admin route if backend supports it.

States:

- Saving: primary button loading.
- Saved: success state with `View item` and `Add another`.
- Error: inline `hito-field-error` plus retry.

Do not let quick notes create frontend-only backlog rows. Saved item must come from backend response.

### Prompt Copy Actions

Prompt copy belongs inside item detail, not as a loud row-level action.

Recommended actions:

- Primary within detail: `Copy prompt`.
- Secondary: `Copy context`.
- Optional: `Copy bug summary` only if backend exposes it.

States:

- Default: compact secondary button.
- Copying: button pending if async.
- Copied: short success text or toast, but no persistent card.
- Missing role/context: action stays available only if backend can generate a fallback; otherwise show quiet helper copy and role selector.

No `Send to Codex` action in v1.

## Interaction Model

### Scanning Many Items

Admins scan through:

- status tabs
- route/date search
- type/status/role/priority filters
- compact pills on each row
- screenshot marker when visual evidence exists
- newest/highest-priority ordering

Default order:

- `New`: newest first, urgent/high priority visually surfaced but not reordered unless backend/frontend sort supports it.
- `In review`: newest updated first.
- `Ready for Codex`: newest ready first.
- `Done` and `Archived`: newest updated first.

### Opening One Item

- Row click or chevron expands detail.
- Expanded row remains in list context.
- Header/metadata stays visible in expanded detail.
- Copy prompt and triage controls live in the expanded detail.
- Escape should close detail if focus is inside a popover/dialog, otherwise normal browser behavior.

### Filters

Filters live in header/menu style controls consistent with existing Hito admin data-table pattern, not standalone select rows.

Required filters:

- Status
- Type
- Target role
- Priority
- Route
- Date
- Asset presence: `Has screenshot`, `No screenshot`, only if backend exposes assets
- Source: `Captured UI`, `Quick note`, only if backend exposes source

Recommended UI:

- Status uses tabs.
- Other filters live behind `Filters` button/panel.
- Search stays separate and compact.
- Active filters appear inside the Filters panel; chips outside the panel are optional only when there are one or two active filters.

### Search

Use collapsed search from Hito data-table controls.

Search target:

- title
- note
- route/path
- URL
- selected element text
- nearby heading
- target role

Search should not become a broad query builder.

## State Model

### Loading

- Page-level admin check/loading can use `hito-state-surface`.
- List loading should be a compact skeleton/list placeholder inside the backlog region.
- Do not show fake rows that look actionable.

### Empty

No backlog items:

- Title placeholder: `No captured backlog items yet.`
- Body placeholder: `Captured UI notes and quick admin notes will appear here.`
- Actions:
  - `Open product and capture UI` if launcher route/link exists.
  - `Add quick note`.

Filtered empty:

- Title placeholder: `No items match these filters.`
- Body placeholder: `Clear filters or adjust search.`
- Action: `Clear filters`.

### Error / Unavailable

Access errors:

- Use admin unavailable state pattern.
- Redirect/CTA to `/admin/login` when admin auth is required.

List load errors:

- Use `hito-state-surface` with destructive tone.
- Keep retry action compact.

Update errors:

- Inline near the failed status/role/priority control.
- Do not optimistically leave stale visible state as saved.

### Saved / Updated

- Status/priority/role updates should resolve calmly.
- Use inline success helper or toast if existing admin action toast pattern is available.
- Keep backend response as source of visible state after mutation.

### Copy Success

- `Copied` confirmation can be:
  - in-button temporary label
  - small helper text
  - existing Hito toast if the app already uses toasts in admin
- Do not add a new notification pattern.

## DS Primitive Mapping

Reuse:

- Admin workbench shell from `/admin/analytics`
- `HitoLogo`
- `hito-shell-nav-row`
- `hito-tabs hito-tabs-simple`
- `hito-row-group`
- `hito-list-row`
- `hito-disclosure`
- `hito-status-pill`
- `hito-button`
- `hito-field`, `hito-textarea-md`, `hito-field-helper`, `hito-field-error`
- `hito-data-table-utility-row`
- `hito-data-table-search`
- `hito-data-table-filter-summary`
- `hito-data-table-scroll` only if a table-like metadata section is used
- `hito-state-surface`
- existing dialog/modal anatomy for quick note if a dialog is chosen
- existing dropdown/menu primitives for role/status/priority controls

Potential small extension:

- `hito-backlog-row` only if repeated row alignment cannot be expressed through `hito-list-row` plus existing utility classes.

Do not add:

- backlog-specific cards
- custom badge colors beyond existing status/tone tokens
- a Kanban board in v1
- a new timeline component
- a new issue detail layout system

## Visual-Capture Item Accommodation

Visual captures and quick notes share one list.

Visual capture row differences:

- show screenshot marker or small thumbnail if available
- show selected element excerpt
- show route and nearby heading
- show `Captured UI` source marker only if needed

Quick note row differences:

- no screenshot marker
- route can be absent or admin-entered
- selected element section is replaced by `No selected element`
- source marker can read `Quick note` if backend exposes source/type

Future screenshots:

- In row: small thumbnail or asset marker only.
- In detail: thumbnail strip with click-to-preview dialog if backend provides signed/private read access.
- If asset unavailable: show quiet state, not an error unless upload failed during the current save.

Privacy:

- Screenshot thumbnails should be admin-only and never public URLs.
- Show a subtle warning in detail: screenshots may include visible private data.
- Do not include screenshot binary in copied prompt; prompt should say available/unavailable.

## Mobile And Tablet Behavior

Around tablet/narrow widths:

- Keep admin shell responsive like `/admin/analytics`.
- Status tabs become horizontal scroll.
- Utility row stacks: search/filter/quick note on one wrapped row.
- Backlog rows remain list rows, not table cards.
- Metadata wraps under the title.
- Row pills wrap but stay secondary.
- Detail disclosure becomes single-column.
- Screenshot thumbnails stack or horizontally scroll inside detail.
- Prompt copy buttons wrap below triage controls.

Avoid:

- permanent split pane on mobile
- dense tables as primary backlog list
- fixed-width side panels that obscure content

## Implementation Notes For Frontend

Recommended file shape:

- `src/routes/admin.capture.tsx`
- `src/components/admin-capture/AdminCaptureBacklog.tsx`
- `src/components/admin-capture/AdminCaptureItemRow.tsx`
- `src/components/admin-capture/AdminCaptureItemDetail.tsx`
- `src/components/admin-capture/AdminCaptureQuickNoteDialog.tsx`

Implementation expectations:

- Use backend-shaped view models only.
- Keep status/type/priority/role options from backend/shared capture types, not duplicated literals where avoidable.
- Status transitions should call backend update seam and then reconcile from response or route invalidation.
- Copy prompt should call backend deterministic prompt seam, then write to clipboard.
- Search/filtering may be client-side for v1 if backend returns bounded item counts, but backend remains lifecycle truth.
- If counts grow, route can later move search/filter/sort to backend without changing page anatomy.

Do not implement:

- route-spanning capture overlay in this backlog page slice
- automatic Codex dispatch
- live editing
- source-code/component ownership resolution
- screenshot upload logic unless backend Slice 2 is already complete

## Copy Placeholders For COPY

These are temporary labels only.

- Page label: `Admin capture`
- Page title: `Capture backlog`
- Page description: `Review captured UI notes, triage work, and copy role-ready prompts.`
- Quick note button: `Quick note`
- Empty title: `No captured backlog items yet.`
- Empty body: `Captured UI notes and quick admin notes will appear here.`
- Filtered empty title: `No items match these filters.`
- Copy success: `Prompt copied.`
- Screenshot unavailable: `Screenshot unavailable; text context was saved.`
- Privacy note: `Screenshots may include visible page data.`

COPY should refine tone after the page structure is accepted.

## Open Questions

No blocking design questions.

Non-blocking questions for implementation:

- Does backend expose list counts by status in the first route view model?
- Does backend distinguish `quick_note` source from `context_capture` item type, or should source remain implicit in missing selected-element fields?
- Are screenshots available in the first UI slice, or should the page render asset placeholders only?

## Exit Criteria

- `/admin/capture` uses the existing admin workbench shell and Hito DS primitives.
- Backlog is list-first with inline item detail.
- Admin can scan by status, type, priority, role, route, and date.
- Quick note flow lands in the same backend backlog as visual captures.
- Prompt copy actions are available from item detail only.
- Empty, loading, error, saved, and copied states are defined.
- Future screenshot/visual capture items fit the same row/detail anatomy.
- No new backlog-specific UI kit is introduced.

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement the `/admin/capture` backlog route after backend capture list/detail/update/copy-prompt seams exist. Reuse the admin workbench shell and existing Hito DS/admin table/list controls before adding any new primitive.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the designer-owned `/admin/capture` backlog page plan: existing admin shell, list-first backlog, inline detail disclosure, compact filters/search, quick note flow, prompt copy placement, state model, DS primitive mapping, mobile behavior, and future visual-capture accommodation.

### Key Decisions

- `/admin/capture` should be list-first with inline detail, not table-first or permanent split-pane.
- Status is the primary view switch; other filters stay behind compact Hito admin filter controls.
- Prompt copy actions live inside item detail, not as loud row-level CTAs.
- Quick notes and visual captures land in the same canonical backend backlog.
- No new backlog-specific UI kit should be created.

### Current State

- The active plan already defines backend-owned capture item truth and Hito DS reuse constraints.
- This spec gives Frontend enough page anatomy and interaction guidance to implement the backlog route once backend seams exist.

### Constraints

- Backend owns item truth, status, type, priority, target role, notes, assets, and deterministic prompt generation.
- Frontend must not invent lifecycle rules, auto-dispatch to Codex, or build live UI editing.
- Normal runners must never see backlog or capture controls.
- Use existing Hito DS/admin primitives first.

### Risks / Open Questions

- Screenshot availability may lag the first backlog UI slice.
- Backend may or may not expose status counts or quick-note source flags in the first view model.
- If item counts grow, search/filter/sort may need to move backend-side later without changing page anatomy.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement `/admin/capture` as a Hito admin workbench route using this spec after backend capture list/detail/update/copy-prompt seams are available.
```
