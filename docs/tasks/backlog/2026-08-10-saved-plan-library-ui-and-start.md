# Saved Plan Library UI And Start

- **Work Item ID:** `saved-plan-library-ui-and-start`
- **Status:** `completed`
- **Type:** `frontend-product-integration`
- **Priority:** `high`
- **Owner:** `FRONTEND`
- **Scope:** `Progress Plans tab, saved-plan table, selected-record download/hide/Start interaction`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Expose the completed saved-plan Backend contract in authenticated Progress so a runner can browse
factual saved records, search and sort them, download or hide one, and Start it through the existing
future-replacement contract without restoring current-plan or browser-owned schedule truth.

## Result

Progress now has a third `Plans` tab. One route-local panel renders only Backend summaries and
provides plan-name search; newest, oldest, name, and workout-count sorts; record-state visibility;
selected private JSON download; logical hide; and Backend-shaped Start/Replace interactions and
receipts. History and Progress retain their existing lazy data paths.

The first incorrect owner was the Frontend Product Progress route, which had no consumer for the
already-completed actions. Browser replay also found that `createdAt` is an ISO timestamp while the
existing formatter accepts a date-only value; the row now passes the returned calendar-date prefix
instead of rendering `Invalid Date`.

The implementation reused Progress search-param tabs, the existing Progress experience, shared
Hito data-table and control patterns, saved-plan actions, and the selected export route. Its only
new production artifact is the route-local Plans owner:
[SavedPlanLibraryPanel.tsx](../../../src/components/progress/SavedPlanLibraryPanel.tsx). No shared
primitive, store, hook framework, API/RPC, scheduler, payload copy, persistence path, compatibility
layer, or active-plan branch was added.

## Canonical Sources

- [Progress route](../../../src/routes/progress.tsx)
- [Progress experience](../../../src/components/progress/RunnerActivityProgressExperience.tsx)
- [Saved-plan actions](../../../src/lib/active-plan-export-actions.ts)
- [Selected private export](../../../src/routes/api.plan.export.tsx)
- [Backend library contract](./2026-08-10-saved-plan-library-and-future-apply.md)
- [Backend schedule-aligned Start](./2026-08-10-saved-plan-start-schedule-alignment.md)

## Validation And Evidence

[Focused browser artifacts](../../../qa-artifacts/screenshots/2026-08-10/saved-plan-library-ui-and-start/)
cover available/empty and search states, every sort selection, selected download, empty-future
Start, Calendar refresh, replacement cancellation, positive replacement, logical hide, existing
Progress tabs, and exact 375×812 containment. The replay materialized 55 Calendar rows with 32
non-Rest workouts, proved cancellation preserved the schedule, proved replacement changed its row
identity while retaining the selected record, and cleaned the disposable fixture to zero. No
browser console errors were recorded. Focused static checks and the original production build
passed.

## Coverage Gap And Residual Boundary

The disposable lifecycle retained one canonical record, so the UI exercised every sort state but
did not compare relative ordering across multiple rows; the deterministic route-local comparator
received source/static coverage only. No broad browser/device/theme matrix beyond the recorded
views, hosted environment, provider call, deployment, release, or Global QA Acceptance was run or
claimed. Global QA remains pending.
