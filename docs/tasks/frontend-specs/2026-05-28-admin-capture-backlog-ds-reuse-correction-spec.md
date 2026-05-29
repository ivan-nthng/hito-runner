# Admin Capture Backlog DS Reuse Correction Spec

## Status

backlog

## Type

frontend_spec

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Correct the admin Backlog UI to reuse Hito DS and admin workbench primitives.

## Stage

FRONTEND implementation

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Correct the admin Backlog UI to reuse Hito DS and admin workbench primitives.

STAGE:
FRONTEND implementation

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-ds-reuse-correction-spec.md
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

Design System

## Last Updated

2026-05-28

## Context

The page works functionally, but it currently behaves like a backlog-specific mini-app rather than another Hito admin workbench surface.

User feedback confirms the drift:

- search opens a custom lower input instead of matching existing admin search
- search has duplicate clear controls and an extra Apply button
- filter treatment is more custom than existing admin filter patterns
- expanded item detail repeats title and metadata already present in the row header
- prompt copy is over-promoted as the main orange CTA
- metadata editing is duplicated in the expanded body
- header metadata pills should be the editing surface
- prompt content should read like markdown/code on a quiet black surface, not like a nested card stack

Primary files:

- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:1)
- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1)
- [2026-05-28-admin-capture-backlog-page-revision.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-revision.md>)
- [2026-05-28-admin-capture-backlog-copy.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-copy.md>)

## DS Audit Summary

`/admin/capture` already reuses some correct admin primitives:

- shared admin shell/sidebar/topbar pattern
- status tabs
- `hito-row-group` and `hito-list-row`
- `hito-status-pill`
- `hito-data-table-utility-row`
- `hito-data-table-search`
- `hito-data-table-filter-summary`

But it currently recomposes them into a backlog-specific interaction model that diverges from the established admin workbench grammar.

Main drift areas:

1. search/filter behavior
2. duplicate metadata editing surfaces
3. expanded detail over-structuring
4. prompt block hierarchy and CTA hierarchy

## Existing Primitives / Patterns To Reuse

## 1. Search Input Pattern

Reuse:

- `DataTableUtilityRow` interaction model in [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1024)
- classes:
  - `hito-data-table-utility-row`
  - `hito-data-table-search`
  - `hito-data-table-search-input`
  - `hito-data-table-search-clear`
  - `hito-data-table-icon-button`

Why:

- existing admin search opens inline from a compact icon trigger
- once opened, it uses a single input and a single clear action
- no extra Apply button
- on blur, it collapses back if query is empty

## 2. Filters Pattern

Reuse:

- active-filter summary dropdown from [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1067)
- column/filter menu language from [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1146)
- menu primitives:
  - `DropdownMenu`
  - `DropdownMenuContent`
  - `DropdownMenuItem`
  - `DropdownMenuLabel`
  - `DropdownMenuSeparator`
- DS classes:
  - `hito-shell-menu`
  - `hito-shell-menu-item`
  - `hito-data-table-column-menu`
  - `hito-data-table-filter-summary`

Why:

- existing admin filters are compact, secondary, and already feel correct for internal workbench surfaces
- they expose active filters as removable items rather than as a separate apply/reset form

## 3. Table / List Row Pattern

Reuse:

- `hito-row-group`
- `hito-list-row`
- `hito-list-row-title`
- `hito-list-row-copy`

References:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2939)
- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:972)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3372)

Why:

- backlog items are closer to expandable admin work rows than to custom cards

## 4. Pills / Badges Pattern

Reuse:

- `hito-status-pill`

References:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2752)
- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1318)
- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:1350)

Why:

- status/type/priority/role already read acceptably as compact admin metadata pills
- the correction is not to invent new pill components; it is to make those pills the editing surface instead of duplicating large selects below

## 5. Dropdown / Compact Metadata Editing Pattern

Reuse:

- `DropdownMenu` row/menu pattern from admin analytics table headers and active-filter menu
- compact Hito menu chrome via:
  - `hito-shell-menu`
  - `hito-shell-menu-item`

References:

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1174)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:3127)

Why:

- current `SelectField compact` still reads like a form control
- the user wants metadata to feel like editable pills with hover/edit state
- this is already closer to compact admin grammar than stacked selects

## 6. Secondary Button Pattern

Reuse:

- `hito-button hito-button-secondary hito-button-sm`
- `hito-button hito-button-ghost hito-button-sm`

Why:

- `Copy prompt` should be secondary
- prompt viewing should not depend on an orange primary CTA

## 7. Disclosure / Detail Pattern

Reuse:

- `hito-disclosure`
- `hito-disclosure-summary`
- `hito-disclosure-body`

References:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2144)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3403)

Why:

- technical details and maybe append-note affordance should collapse into quiet disclosure areas
- they do not need to be always-open bordered cards

## 8. Markdown / Code Prompt Block Pattern

Reuse:

- `hito-technical-mono` typography
- `hito-inline-code` only for inline fragments, not the whole block
- open/divided surface rhythm rather than nested bordered cards

References:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1552)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1660)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:956)

Why:

- the prompt body should behave like technical selectable content on a quiet dark surface
- it should not sit inside another heavy card stack

## Compare Against Existing Admin References

Frontend should copy from these exact patterns:

### Search / Utility Row

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1024)
  - `DataTableUtilityRow`

### Filter Summary / Active Filters Menu

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1067)
  - active filters dropdown menu

### Compact Filter Menus

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1146)
  - `DataTableColumnHeader`

### Row Density / Status Pills / Compact Metadata

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:522)
  - `UsersSection`
- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1475)
  - `TestAccountsCard`

### Quiet Disclosure

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3403)
  - documented disclosure pattern

### Technical / Code Content Tone

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:956)
  - editorial/code content rules

## Current One-Off UI To Remove

## 1. Search Disclosure Form

Remove:

- lower opened search row with extra Apply button
- anchor-based clear action plus native input clear feel plus collapse behavior all at once

Current drift:

- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:608)

## 2. Filter Panel As Separate Apply Form

Remove:

- backlog-local filter panel that behaves as a custom mini form
- explicit `Apply filters` primary action in the panel

Current drift:

- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:671)

## 3. Expanded Detail Header Duplication

Remove:

- second large title block in expanded detail
- second metadata line that repeats what row header already shows

Current drift:

- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:1059)

## 4. Full Second Triage Form In Expanded Detail

Remove:

- four compact selects as a separate triage strip inside expanded body

Current drift:

- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:1077)

## 5. Prompt Section CTA Hierarchy

Remove:

- orange primary emphasis on `Copy prompt`

Current drift:

- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:1131)

## 6. Always-Visible Notes Append Form

Remove or demote:

- always-open append-note textarea for every item

Current drift:

- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:1217)

## Search / Filter Correction

## Search

Replace the current search behavior with the existing admin search pattern from `DataTableUtilityRow`.

Required corrections:

- search trigger remains a compact secondary icon button
- opening search expands inline in the same utility row
- input uses the existing `hito-data-table-search` pattern
- remove the extra Apply button
- keep only one clear action
- clearing the query should collapse the search back when empty, matching admin analytics behavior

Implementation note:

- `query` state should behave like the live admin search field, not a form submit with separate apply
- if preserving URL search params is required, Frontend should still make the interaction feel immediate rather than requiring an extra explicit submit button

## Filters

Replace the current filter panel with the established admin filter summary pattern.

Required corrections:

- Filters button remains compact and secondary
- active filters appear as removable items in a dropdown menu
- active filter count stays on the trigger
- clear-all stays inside that dropdown when multiple filters are active
- if a larger filter chooser is still needed, keep it secondary and not primary-action driven

Preferred implementation:

- reuse admin analytics active-filter dropdown model
- if the route still needs the three filter dimensions chooser, open it from the Filters trigger using `DropdownMenu` items or a small internal menu panel, not a separate “Apply filters” form block

## Row / Header Metadata Correction

The row header should become the primary metadata surface.

Required corrections:

- keep title, type, status, priority, role, and prompt-ready marker in the row header
- make compact pills the editable interaction surface
- keep interaction at the row/header level
- “New” can remain a small accent truth marker, not a large duplicated control
- type can stay near the title
- role and priority may move to the second metadata line if that produces a cleaner row

Preferred interaction:

- hover/focus on a pill reveals edit affordance or opens compact menu
- metadata updates save immediately
- success/error feedback stays brief and local

Do not:

- repeat the same metadata as a second set of form controls in the expanded body

## Expanded Detail Correction

Expanded detail should become a compact open document, not a second full card stack.

Required corrections:

- do not repeat title and timestamp hierarchy already present in the row
- remove the second triage control row
- use one open detail panel with internal dividers
- keep:
  - prompt
  - compact context metadata
  - created/updated
  - route / source path / screenshot paths
  - archive/status updates
- move technical fields like selector and DOM path into a quiet disclosure
- move append note into a quiet disclosure or footer utility area, not a main always-open section

Behavior that must remain unchanged:

- expanding/collapsing items
- metadata updates
- prompt copy
- append note capability
- archive/status updates

## Prompt Block Correction

The prompt is the primary detail content and should read like technical output, not like a bordered admin card.

Required corrections:

- label stays `Prompt`
- body appears on a quiet black or near-black surface
- no heavy nested border treatment around the content block
- prompt text stays visible and selectable
- preserve line breaks and technical readability
- `Copy prompt` becomes secondary, not primary orange
- if clipboard copy is blocked, fallback prompt text remains immediately selectable

Recommended treatment:

- title row:
  - left: `Prompt`
  - optional small helper beneath
  - right: secondary `Copy prompt`
- content:
  - non-editable markdown/code-style body
  - use `hito-technical-mono` or mixed markdown/code rendering if already available
  - avoid readonly textarea look if a simpler block can preserve selection without reading as a form field

Do not:

- hide the prompt until copy
- make Copy prompt the dominant CTA on the page

## What Should Remain Unchanged Behaviorally

- header action `Add quick note`
- status tabs
- row expand/collapse model
- prompt copy backend seam
- clipboard-blocked fallback behavior
- metadata update backend seams
- append note backend seam
- route-level admin shell and Backlog naming

## Frontend Implementation Instructions

1. Replace `CaptureUtilityRow` search behavior with the interaction model from `DataTableUtilityRow` in `admin.analytics`.
2. Remove the extra search Apply button and duplicate clear behavior.
3. Replace backlog-local filter form treatment with the existing compact admin filter summary/menu pattern.
4. Keep row header as the primary metadata display and edit surface.
5. Remove duplicated triage controls from expanded detail.
6. Flatten expanded detail into one quiet open document with dividers.
7. Demote `Copy prompt` to a secondary button.
8. Render the prompt body as quiet technical content on a dark surface, keeping selection fallback.
9. Move selector/DOM path and append-note editing into quieter disclosure areas.

## Validation Requirements

- visual comparison against existing admin users/test-accounts search/filter/table patterns
- verify search open/close behavior matches admin analytics expectations
- verify only one clear action exists for search
- verify active filter treatment matches admin grammar
- verify row header is sufficient without duplicated expanded metadata
- verify prompt remains visible, selectable, and copyable
- verify copy-blocked fallback still works
- verify metadata edits still save correctly
- verify archive/status updates still work
- inspect in Safari after implementation

## What Not To Touch

- backend schema
- capture/backlog status model
- admin auth
- screenshot upload/capture overlay
- Codex auto-dispatch
- generic new backlog component kit
- broad visual redesign of admin surfaces

## Next Recommended Role

FRONTEND

## Exact FRONTEND Prompt

```md
You are FRONTEND.

Task:
Correct `/admin/capture` so it reuses existing Hito admin search/filter/list/detail primitives instead of backlog-specific one-off UI.

Stage:
FRONTEND implementation

Required reading order:
1. `docs/context.md`
2. `docs/glossary.md`
3. `docs/current-product.md`
4. `docs/current-system.md`
5. `docs/current-state.md`
6. `docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md`
7. `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-revision.md`
8. `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-copy.md`
9. `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-ds-reuse-correction-spec.md`
10. `src/routes/admin.capture.tsx`
11. `src/routes/admin.analytics.tsx`
12. `src/routes/hitoDS.tsx`

Context:
The backlog route works, but it is not reusing existing admin UI patterns enough. The goal is to remove local overbuilt backlog UI behavior and bring the page back into the same admin grammar already used by users/test-accounts/search/filter/table surfaces.

Scope:
- `src/routes/admin.capture.tsx`
- `src/styles.css` only if a tiny helper is needed and only if it replaces repeated drift

Requirements:
- replace custom search disclosure/input/apply behavior with the existing admin search pattern from `DataTableUtilityRow`
- remove duplicate clear behavior and remove the extra Apply button
- replace filter treatment with the compact existing admin filter pattern
- keep title/status/type/priority/role editing in the row header metadata surface
- remove duplicated metadata controls from expanded detail
- flatten expanded detail into one quiet open document with dividers
- prompt block:
  - label `Prompt`
  - quiet dark markdown/code-style content surface
  - secondary `Copy prompt` button
  - selectable fallback when clipboard is blocked
- keep source path, route, created/updated, and screenshot paths as compact metadata
- keep archive/status updates working
- do not introduce a new backlog UI kit
- do not add a new generic component unless replacing repeated drift

Patterns to copy directly:
- search/filter utility row from `src/routes/admin.analytics.tsx`
- compact filter menus from `DataTableColumnHeader` and active-filter menu patterns in `src/routes/admin.analytics.tsx`
- disclosure pattern from `/hitoDS`
- row/list rhythm from existing `hito-row-group` / `hito-list-row`

Validation:
- run focused static checks
- inspect `/admin/capture`
- compare against `/admin/analytics` Users/Test accounts patterns
- preserve behavior
- hand off to Safari QA

Output format:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## Blockers

No hard blockers.

Only one implementation caution:

- if Frontend cannot make header pills directly editable in this pass without introducing new broad abstractions, it should still remove the duplicated expanded-detail form first and replace it with the smallest compact dropdown interaction possible.
