# Admin UI Capture And Backlog Brief

## Status

Draft

## Owner

PRODUCT

## Last Updated

2026-05-25

## Problem

Right now UI feedback is easy to lose or describe ambiguously.

Examples:

- "this button"
- "that card on the right"
- "this spacing is broken"
- "this should go to prompt engineer"

The product needs one internal admin-only tool that allows the product owner to point at a UI element in the browser, capture its exact context, and save it as a structured internal item.

The product also needs one canonical place where those captured items live after creation.

## Product Decision

Create one admin-only visual capture workflow with two product surfaces:

1. Browser capture mode
2. Admin backlog panel

The browser capture mode is not a live editor.

It is an internal element-selection and context-capture tool.

The admin backlog panel is the canonical storage and triage surface for captured items.

## Core Decision: Where It Lives

### 1. Capture Lives In The Browser

The product owner enters an internal inspect mode while viewing the app.

This mode should be visible only to admin users.

In this mode the user can:

- hover a UI element
- select it
- open a small capture panel
- write a short note
- classify the item

### 2. Captured Items Live In The Admin Panel

Captured items should not go directly into Codex in v1.

They should be stored in one internal admin backlog surface, for example:

- `/admin/issues`
- `/admin/capture`

Recommended v1:

- keep it inside the admin panel
- make it easy to copy a structured prompt from there
- optionally add `Copy for Codex` action per item

## Why Not Auto-Send To Codex In V1

Do not auto-send captured items directly into Codex in the first release.

Reason:

- not every capture should become an execution task
- some captures are bugs
- some are design requests
- some are observations only
- admin needs one triage step before handing off

Recommended v1 handoff pattern:

- capture item
- save to admin backlog
- review and classify it
- copy generated role prompt into Codex manually

Possible later enhancement:

- `Open in Codex`
- `Generate prompt`
- `Send to role queue`

But not in v1.

## Item Types

The capture tool should support three item types.

### 1. Bug

Use when:

- something is broken
- layout is wrong
- behavior is incorrect
- state is misleading
- action fails
- copy or visual contract regressed

### 2. Change Request

Use when:

- the UI should be improved
- the flow should change
- wording should change
- the component should behave differently
- the prompt engineer or frontend should get a targeted request

### 3. Context Capture

Use when:

- the user wants to bookmark a UI state
- the user is not ready to classify it yet
- the item should be discussed later

## Required Captured Context

Each saved item should automatically include:

- page URL
- route
- timestamp
- viewport size
- full-page screenshot
- cropped element screenshot
- element text, if available
- stable selector or DOM path
- nearby section title or heading when available
- internal item type
- user-written note
- admin creator identity

Optional later context:

- component hint
- test id
- role / aria label
- current app state metadata

## Admin Backlog Surface

The admin panel should be the canonical review queue.

Recommended sections:

### 1. New

Freshly captured items not yet triaged.

### 2. In Review

Items that have been classified and are being prepared for handoff.

### 3. Ready For Codex

Items with enough context to be sent as prompts to:

- PROMPT_ENGINEER
- FRONTEND
- DESIGNER
- QA

### 4. Done

Resolved items.

### 5. Archived

Closed or no-longer-relevant items.

## Minimal Workflow

### Capture Flow

1. Admin enters inspect mode.
2. Admin clicks an element.
3. Side panel opens.
4. Admin chooses:
   - Bug
   - Change request
   - Context capture
5. Admin writes short note.
6. Admin saves item.

### Triage Flow

1. Admin opens item in backlog.
2. Admin reviews screenshots and context.
3. Admin optionally edits title / priority / role target.
4. Admin marks item:
   - keep as backlog only
   - ready for Codex
   - done
   - archive

### Codex Handoff Flow

Recommended v1:

- `Copy prompt`
- `Copy structured context`
- `Copy bug summary`

Not recommended in v1:

- automatic Codex dispatch
- background execution trigger
- agent auto-run

## Access Model

This tool must be admin-only.

Requirements:

- not visible to normal runners
- not visible in normal runner navigation
- gated by backend admin session truth
- browser capture mode enabled only when admin auth is confirmed

## Scope

### In Scope

- admin-only inspect mode
- element selection
- screenshot capture
- structured item creation
- admin backlog storage
- copy-to-Codex handoff action
- basic filtering by:
  - type
  - status
  - date
  - page

### Out Of Scope

- live visual editing
- code editing in browser
- automatic code mutation
- automatic Codex execution
- full issue tracker replacement
- full design tool
- multi-user collaboration system
- public runner-facing reporting flow

## Acceptance Criteria

1. Admin can enter inspect mode in the browser.
2. Admin can select a visible UI element.
3. The system captures enough context to identify the selected element later.
4. Admin can save the selection as:
   - bug
   - change request
   - context capture
5. Saved items appear in one canonical admin backlog surface.
6. The backlog makes it easy to copy a role-targeted prompt into Codex.
7. Normal users never see this tool.
8. No item is automatically sent to Codex in v1.

## Tradeoffs

### Chosen Tradeoff

Prefer:

- accurate context capture
- admin review
- backlog truth

over:

- instant automation

### Why

This keeps the first release reliable and avoids noisy or accidental agent work.

## Non-Goals

- direct browser-to-code editing
- autonomous prompt dispatch
- rebuilding Jira/Linear inside Hito
- building a visual page builder
- solving component-to-source mapping perfectly in v1

## Next Recommended Role

ARCHITECT

## Suggested Next Step

Turn this brief into one concrete implementation plan that decides:

- where inspect mode runs first
- how captured items are stored
- how admin backlog statuses work
- what the minimum payload schema is
- how `Copy for Codex` is generated
