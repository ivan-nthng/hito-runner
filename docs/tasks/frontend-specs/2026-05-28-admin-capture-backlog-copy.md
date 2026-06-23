# Admin Capture Backlog Copy

## Status

closed

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

product

## Task

Preserve the completed admin Backlog copy guidance as historical source-of-truth context for
`/admin/capture`.

## Stage

COPY closeout / admin Backlog copy contract preserved

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Preserve the completed admin Backlog copy guidance as closed historical context unless a fresh admin copy regression appears.

Stage:
PRODUCT closure guard / admin Backlog copy contract.

Context:
The `/admin/capture` Backlog v1 surface is implemented and QA-passed. This copy spec no longer owns an active COPY pass; it preserves the accepted internal-admin wording contract for future reference. Reopen only if source or QA proof shows a fresh copy regression in the shipped admin Backlog surface.
```

## Owner

COPY

## Last Updated

2026-06-22

## Compression Note

This file was compressed in Slice D23 after source proof showed it no longer owns an active COPY
pass. The active admin plan records `/admin/capture` Backlog v1 as QA-passed/complete, and current
docs describe the route as implemented admin functionality. Future route-spanning capture overlay
work is DESIGNER-owned, not a continuation of this copy pass.

Current owners:

- [Admin UI Capture And Backlog plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md>)
- [current-system.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md>)
- [current-product.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md>)
- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:1)

## Final Outcome

Accepted `/admin/capture` Backlog v1 copy contract:

- the page is named `Backlog`;
- the page intro is operational and internal, centered on reviewing work and copying prompts for manual handoff;
- quick note language uses `Add quick note`;
- deterministic handoff actions use `Copy prompt` and related compact clipboard feedback;
- `Ready for Codex` remains explicit manual-handoff readiness, not auto-dispatch;
- admin-only unavailable states point to admin login and do not imply runner-facing access;
- screenshot language stays quiet/non-blocking because screenshot upload and route-spanning capture are future work.

## Durable Copy Rules

- Keep the surface calm, direct, operational, and internal-admin only.
- Do not make it sound like Jira, product marketing, automatic agent workflow, or live code editing.
- Do not rename `target role` to owner/assignee/team in this surface.
- Use `Route` for route metadata and `URL` for dense URL rows.
- Keep `Add quick note` separate from future `Capture UI`; quick notes are text-first admin notes.
- Keep repo-derived markdown canonical for repo-authored work; Admin Backlog rows are mirrors for discovery and prompt copy.
- No item is automatically sent to Codex.

## Preserved Validation Evidence

The active admin plan records `/admin/capture` Backlog v1 as QA-passed:

- admin can review, filter, triage, archive, and open details for backlog items;
- admin can create quick notes and append notes;
- deterministic copy-prompt actions are available;
- Safari clipboard blocking degrades to selectable prompt fallback;
- normal users are blocked from admin backlog tools;
- narrow viewport has no page-level overflow;
- `npm run build` passed for the accepted implementation slice.

## Boundary

This spec is closed. Do not route new COPY work from it unless a fresh source-proved copy regression
appears in `/admin/capture`. Future route-spanning capture overlay work belongs to the active admin
plan's DESIGNER track.
