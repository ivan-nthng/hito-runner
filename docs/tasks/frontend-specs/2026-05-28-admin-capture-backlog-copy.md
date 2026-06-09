# Admin Capture Backlog Copy

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

COPY

## Task

Apply the admin Backlog copy guidance to the `/admin/capture` surface.

## Stage

COPY pass

## Exact Handoff Prompt

```text
ROLE: COPY

TASK:
Apply the admin Backlog copy guidance to the `/admin/capture` surface.

STAGE:
COPY pass

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-copy.md
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

COPY

## Last Updated

2026-05-28

## Source Of Truth

- `docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md`
- `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-design.md`
- `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-revision.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/glossary.md`

## Copy Goal

Make `/admin/capture` read like a calm internal admin workbench page, not a runner-facing feature, not a Jira clone, and not an automatic agent workflow.

The copy should:

- stay short and operational
- support manual Codex handoff
- keep `capture`, `backlog`, and `prompt` language deliberate
- avoid implying live editing, auto-dispatch, or automatic code changes
- keep route and nav naming aligned to `Backlog`

## Tone Rules

- internal admin tool
- calm, direct, operational
- short labels over expressive labels
- clear enough for manual triage and handoff
- no product marketing tone
- no issue-tracker cosplay

## Copy Table By UI Area

### 1. Page Header

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Page micro-label | `Admin` | Reuse existing admin shell language. |
| Page title | `Backlog` | Use this wherever the route or page is named in visible UI. |
| Page intro | `Review captured work and copy prompts for manual handoff.` | Shorter revision-safe support copy. |
| Header action | `Add quick note` | Right-side header action in the revised layout. |

### 1.5. Navigation Labels

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Sidebar item | `Backlog` | Replace visible `Capture backlog` language in nav. |
| Mobile route rail item | `Backlog` | Keep the same short route name on small screens. |

### 2. Status Tabs

| Backend value | Recommended label | Notes |
| --- | --- | --- |
| `all` | `All` | Use only if the backend view model supports it. |
| `new` | `New` | Default backlog intake state. |
| `in_review` | `In review` | Keep human and operational. |
| `ready_for_codex` | `Ready for Codex` | Explicitly manual handoff-ready, not auto-send. |
| `done` | `Done` | Shorter than `Completed`. |
| `archived` | `Archived` | Matches admin/archive semantics already used elsewhere. |

### 3. Utility Row

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Search trigger | `Search` | Use on tooltip, accessible label, or expanded label. |
| Search placeholder | `Search notes, routes, text, or role` | Covers the intended search scope without turning into query-builder language. |
| Filters trigger | `Filters` | Keep generic and compact. |
| Row count summary | `Showing {shown} of {total} items` | Keep exactly this structure if counts are available. |
| Quick note trigger | `Add quick note` | Match the revised header action label. |
| Clear filters action | `Clear filters` | Use for filtered-empty and active filter reset. |

### 4. Filter Labels

| Filter | Recommended label | Notes |
| --- | --- | --- |
| Status | `Status` | Status is also represented by tabs. Use in filter panel only if needed. |
| Type | `Type` | |
| Target role | `Target role` | Keep backend term; do not rename to `Owner`. |
| Priority | `Priority` | |
| Route | `Route` | Prefer `Route` over `Page` for consistency with captured route metadata. |
| Date | `Date` | |
| Asset presence | `Screenshot` | Use only if backend exposes asset presence. |
| Source | `Source` | Use only if backend exposes source such as quick note vs captured UI. |

### 5. Type Labels

| Backend value | Recommended label |
| --- | --- |
| `bug` | `Bug` |
| `change_request` | `Change request` |
| `context_capture` | `Context capture` |

### 6. Priority Labels

| Backend value | Recommended label | Notes |
| --- | --- | --- |
| `low` | `Low` | |
| `medium` | `Medium` | |
| `high` | `High` | |
| `urgent` | `Urgent` | Prefer `Urgent` over `Critical`; do not invent a stronger label. |

### 7. Target Role Labels

| Backend value | Recommended label | Notes |
| --- | --- | --- |
| `architect` | `Architect` | |
| `backend` | `Backend` | |
| `frontend` | `Frontend` | |
| `designer` | `Designer` | |
| `copy` | `Copy` | |
| `qa` | `QA` | Keep uppercase. |
| `product` | `Product` | |
| `running_coach` | `Running Coach` | |

### 8. Backlog Row And Detail Labels

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Prompt-ready marker | `Prompt ready` | Use only when backend says enough context exists. |
| Screenshot row marker | `Screenshot paths` | Use when screenshot references exist as plain metadata. |
| No screenshot marker | `No screenshot paths` | Use only when backend exposes asset absence explicitly. |
| Source marker for captured UI | `Captured UI` | Use only if backend exposes source. |
| Source marker for quick note | `Quick note` | Use only if backend exposes source. |
| Detail section title | `Prompt` | Primary detail block heading. |
| Detail section title | `Context` | Compact replacement for `Captured context`. |
| Detail section title | `Notes` | Use only if notes remain visible below the prompt. |
| Detail section title | `Technical details` | Use for collapsed technical metadata/disclosure. |
| Missing selected element | `No selected element` | For quick-note items or source rows without capture context. |

### 9. Metadata Labels

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Title field/row | `Title` | Use only if backend exposes title. |
| Note field/row | `Note` | |
| Route metadata | `Route` | |
| Page URL metadata | `URL` | Shorter than `Page URL` in dense metadata. |
| Selected text metadata | `Selected text` | Better than `Element text` for admins. |
| Nearby heading metadata | `Nearby heading` | |
| Selector metadata | `Selector` | |
| DOM path metadata | `DOM path` | Keep technical but short. |
| Screenshot paths metadata | `Screenshot paths` | Use as plain references, not a heavy assets section. |
| Viewport metadata | `Viewport` | |
| Created by metadata | `Created by` | |
| Created at metadata | `Created` | |
| Updated at metadata | `Updated` | |
| Status control label | `Status` | |
| Type control label | `Type` | |
| Priority control label | `Priority` | |
| Target role control label | `Target role` | |

### 10. Quick Note Flow

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Dialog/disclosure title | `Add quick note` | Match the revised header action. |
| Quick note intro | `Capture a backlog item without selecting UI.` | Required short intro for the revised layout. |
| Type field label | `Type` | |
| Note field label | `Note` | |
| Note placeholder | `What should change, what looks wrong, or what context should be saved?` | Broad enough for all three item types. |
| Target role field label | `Target role` | |
| Priority field label | `Priority` | |
| Route field label | `Route or URL` | Use only if the form includes this field. |
| Primary save action | `Save note` | Better than `Create item`; keeps the flow light. |
| Secondary action | `Cancel` | |
| Post-save action | `View item` | Use only if design keeps saved-state actions. |
| Post-save action | `Add another` | Use only if design keeps saved-state actions. |

### 11. Prompt Copy Actions

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Prompt block label | `Prompt` | Primary detail block label. |
| Primary prompt action | `Copy prompt` | Main deterministic handoff action. |
| Secondary context action | `Copy context` | For raw admin context without role-targeted prompt framing. |
| Optional summary action | `Copy bug summary` | Use only if backend exposes it. |
| Pending state | `Copying...` | Use only if the action is visibly async. |
| Success state | `Copied` | Best as temporary in-button state or small helper text. |
| Failure state | `Copy blocked. Select the prompt below.` | Use when clipboard copy is blocked but the prompt text remains selectable. |
| Failure helper | `Could not copy. Try again.` | Use for generic retryable copy failure, not clipboard-blocked selection fallback. |
| Missing role helper | `Set a target role to copy a role-ready prompt.` | Use only if backend requires target role. |
| Missing context helper | `Add enough context before copying a prompt.` | Use only if backend blocks prompt generation on incomplete items. |

### 12. Empty, Filtered, Loading, Error, And Unavailable States

| State | Recommended title | Recommended body | Action |
| --- | --- | --- | --- |
| Empty backlog | `No backlog items yet.` | `Captured UI notes and quick admin notes will appear here.` | `Add quick note` |
| Empty backlog optional secondary action | n/a | n/a | `Open product and capture UI` |
| Filtered empty | `No items match these filters.` | `Clear filters or adjust search.` | `Clear filters` |
| Loading list | `Loading backlog...` | `Fetching captured items and notes.` | none |
| List load error | `Could not load the backlog.` | `Try again.` | `Retry` |
| Admin unavailable | `Admin access required.` | `Sign in with an admin account to open Backlog.` | `Go to admin login` |
| Generic unavailable | `Backlog unavailable.` | `This admin page is not available right now.` | `Retry` |

### 13. Save And Update Feedback

| State | Recommended copy | Notes |
| --- | --- | --- |
| Saving quick note | `Saving...` | Primary button loading label. |
| Quick note saved | `Note saved.` | Keep short and quiet. |
| Quick note save error | `Could not save note. Try again.` | |
| Triage update saved | `Saved` | Use as short helper or brief toast. |
| Triage update error | `Could not save changes.` | Prefer near the failed control. |
| Screenshot unavailable after save | `Screenshot unavailable. Text context was saved.` | Matches the design placeholder but reads more directly. |

### 14. Future Screenshot / Visual-Capture Labels

| UI area | Recommended copy | Notes |
| --- | --- | --- |
| Screenshot paths label | `Screenshot paths` | Preferred revised metadata label. |
| Single asset label | `Screenshot` | Use only when a single explicit screenshot reference needs a label. |
| Thumbnail action | `View screenshot` | Use only if preview/open behavior exists. |
| Asset-empty label | `No screenshot paths` | Quiet empty state for the revised plain-reference treatment. |
| Asset-unavailable label | `Screenshot unavailable` | Use when save succeeded without a usable asset. |
| Privacy note | `Screenshots may include visible page data.` | Keep subtle and admin-only. |

## Recommended Final Labels Summary

These are the most important user-facing strings to keep stable:

- Page title: `Backlog`
- Page intro: `Review captured work and copy prompts for manual handoff.`
- Header action: `Add quick note`
- Prompt label: `Prompt`
- Primary prompt action: `Copy prompt`
- Secondary prompt action: `Copy context`
- Empty state: `No backlog items yet.`
- Filtered empty: `No items match these filters.`
- Copy success: `Copied`
- Copy blocked state: `Copy blocked. Select the prompt below.`
- Quick note save error: `Could not save note. Try again.`
- Triage update error: `Could not save changes.`

## Notes For Frontend

- Keep backend values canonical. This spec defines display labels, not new enums.
- Do not rename `target role` to `owner`, `assignee`, or `team`.
- Keep `Ready for Codex` exactly as written. Do not shorten to `Ready` or change to `Send to Codex`.
- Prefer `Route` in labels and `URL` in dense metadata rows.
- Prefer `Screenshot paths` over `Assets` or `Screenshots` in the revised detail layout.
- Use `Copied` as a temporary state, not a permanent status chip.
- Use `Loading backlog...` only inside the backlog region, not as a full-page replacement unless the route has no usable admin state yet.
- Keep `Add quick note` language separate from `Capture UI`. The quick note flow is not a capture flow.
- Use `Backlog` wherever the route, page, or sidebar item is named in visible UI.
- If screenshots are not in the first UI slice, keep asset copy quiet and non-blocking. Do not show screenshot failure language unless a screenshot was actually expected in that save flow.
- Avoid backend diagnostics in admin-facing copy unless the backend explicitly returns a bounded admin-safe message.
- Do not promote `Append note` as a primary detail action for existing prompt/task-backed items. If note editing remains, keep it secondary and compact.

## Open Copy Questions

- If backend allows prompt generation without `target_role`, should `Copy prompt` stay available with a generic handoff prompt, or should the UI require a role first?
- If backend exposes both `title` and `note`, should rows prefer backend `title` before note excerpt, or should the frontend always derive the visible row title from the note?
- If screenshots are not part of the first shipped slice, should the UI hide `Screenshot paths` entirely when no screenshot references exist yet, or show quiet `No screenshot paths` copy?
