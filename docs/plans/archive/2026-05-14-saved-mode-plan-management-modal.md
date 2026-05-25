Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Clear Upcoming Frontend Slice Implemented

Owner

Frontend

Last Updated

2026-05-15

Context

Saved mode now has the core ingredients for real plan management:

- one active persisted plan in `plan_cycles`
- canonical replacement semantics through the backend
- live freeform text-to-plan creation for onboarding
- live advanced JSON import for saved mode
- continuity-safe carry-forward rules for workout history
- a new planned direction where JSON import will use runner-chosen effective start date instead of source-file `start_date` authority

But saved mode still lacks one clear runner-facing management surface. Today the user sees:

- `Open plan` in the shell header
- `Import plan` in the shell profile menu
- text-first creation primarily in onboarding

Those pieces work, but they do not yet read as one coherent saved-mode plan-management flow.

Problem Definition

The current saved-mode plan-management experience is fragmented.

- `Open plan` is visible, but it is not yet a real management surface.
- JSON import exists, but it still feels like a narrow advanced tool rather than part of one plan-management model.
- Freeform creation is strong in onboarding, but not yet surfaced as a canonical saved-mode replacement path.
- Plan deletion is not yet defined as a runner-facing lifecycle action.

The user needs one small canonical surface that answers:

- what plan is active now
- how to create or replace it
- how to import an existing plan
- how to clear the current active schedule safely

This must stay much smaller than a full editor or training-plan CMS.

What Must Stay Preserved

- one active-plan truth path in the backend
- backend-owned continuity protection for saved workout history
- text-first plan creation as the primary authoring model
- advanced JSON import as a secondary expert path
- no client-side invention of plan-lifecycle or schedule-remap rules

What Becomes Easier For The Runner

- one obvious place to understand the current plan
- one obvious place to create or replace a plan in saved mode
- one clear deletion action when they want to clear the current schedule and start over
- less distinction between “onboarding creation” and “saved-mode plan replacement”

Open Plan Modal V1

Purpose

- `Open plan` becomes the first real saved-mode plan-management modal.
- It is a runner-facing summary plus action surface, not an editor.

What it shows

- current active plan title
- short plan description or metadata
- chosen start-day context when relevant
- a small set of actions

Exact minimum fields

- `Plan title`
  from active `plan_cycles.title`
- `Short description`
  use the existing goal summary or concise plan meta copy from the active plan
- `Start context`
  show the active plan start day in runner-facing language such as:
  `Started May 20`
  or
  `Starts May 20`
- `Goal / target context`
  only if already canonical and easy to express, such as target date or goal summary

Do not add in v1

- workout-by-workout tables
- edit controls for race date or goal
- deep metadata panels
- analytics or history views inside the modal

V1 actions

- `Create new plan`
  freeform text path
- `Import JSON`
  advanced path
- `Delete plan`
  destructive lifecycle action
- `Close`

Runner-facing structure

- top: current active plan summary
- middle: create or replace actions
- bottom: destructive plan deletion inside a quieter disclosure or danger section

Delete Plan Semantics

Canonical meaning in v1

- `Delete plan` means:
  remove the current plan from active saved-mode scheduling so the runner returns to a no-plan state and can immediately create or import a new plan

What happens to future workouts

- Future workouts from the active plan are removed from active saved-mode view.
- In v1, do not attempt row-by-row future-only deletion in the client mental model.
- The canonical backend move should be:
  archive the active plan so it is no longer the active plan

What happens to completed / partial / skipped history

- Logged workout history must stay preserved.
- Existing `completed`, `partial`, and `skipped` logs remain attached to their existing planned-workout rows under the archived plan.
- No saved workout history is silently deleted.

What happens to the active plan row / archived plan row

- The current active `plan_cycles` row becomes `archived`.
- The planned workouts and logs attached to that plan remain as backend history.
- No new active plan exists after deletion.

Why this is the right v1 meaning

- It is simple and safe.
- It clears the runner’s active schedule immediately.
- It preserves auditability and workout history.
- It avoids inventing a partial “delete only future rows but keep a semi-active plan” state.

Clear Upcoming Schedule Semantics

Canonical meaning in v1

- `Clear upcoming schedule` means:
  remove today and future planned schedule from active saved-mode view before the runner starts a later new plan

Backend model

- The backend archives the current active `plan_cycle`.
- Planned-workout rows and workout logs remain attached under archived history.
- No active plan remains after the action.
- The returned action status is `cleared`, with `clearedFromDate` set to today.

Why this reuses archive-to-no-plan

- It is the smallest coherent model.
- It avoids a half-active truncated plan state.
- It guarantees that a later import/create starts from a clean active schedule.
- It preserves past and logged truth without asking the frontend to delete rows manually.

Logged truth on today

- If today already has a saved log, the log is preserved under the archived plan.
- Clearing removes today from the active schedule view only.
- It does not delete or detach the saved log.

Relationship to new imports

- The frontend can ask whether to remove the previous planned schedule before applying a later-starting plan.
- If the runner chooses yes, call `clearUpcomingSchedule` first, then apply/create the new plan through the existing backend apply seam.
- This prevents old future workouts from silently remaining before the new plan starts.

What state the user lands in after delete

- saved-mode no-plan state
- same visible text-first creation surface used for authenticated no-plan users

Can they immediately create/import a new plan

- Yes.
- That is the point of the action.
- After deletion they should be able to:
  describe a new plan in free text
  or import JSON

When delete must be blocked

- no active plan exists
- another plan-mutation action is already in flight
- backend cannot guarantee lifecycle consistency for the plan row transition

Delete should not be blocked merely because history exists.
History is the reason to archive, not the reason to refuse deletion.

Saved-Mode Freeform Creation

Saved mode should gain the same freeform plan-creation path already used in onboarding.

Canonical direction

- Inside the new saved-mode plan modal, add a freeform text section as the primary create/replace path.
- Reuse the existing `completeTextOnboarding` authoring seam or its backend successor rather than creating a second authoring flow.

Why this matters

- It keeps onboarding and saved-mode replacement from feeling like two separate products.
- It reinforces text-first creation as the primary Hito authoring model.
- It keeps JSON import properly secondary.

V1 saved-mode freeform shape

- one short freeform text area
- one primary CTA to create or replace the plan
- the same compact helper guidance used in onboarding, adapted to saved-mode context

How JSON import fits

- JSON import remains available in the same modal
- but as the secondary advanced path
- likely behind a disclosure or secondary section titled `Import from JSON`

Relationship To Start-Date Selection

Saved-mode JSON import

- The new user-chosen start-date model should apply here.
- After a valid JSON file is loaded, the modal should ask:
  `When do you want to start training?`
- That chosen day becomes the effective apply start.
- Imported JSON `start_date` remains metadata only.

Saved-mode freeform creation

- Do not require the same chosen-start-date step in v1 of this modal slice.
- Reuse the current freeform authoring seam first.
- Keep the boundary explicit:
  JSON import adopts chosen-start-date first
  freeform saved-mode creation can adopt it later if needed

Why this split is acceptable in v1

- The imported-file path is where source `start_date` currently causes the most confusion.
- Freeform creation does not carry the same source-file-date mental model.
- This keeps the first saved-mode plan-management slice small.

Backend Responsibilities

- Own current-plan summary truth returned to the modal.
- Own delete-plan lifecycle semantics.
- Archive the active plan on delete so saved history remains preserved.
- Own clear-upcoming lifecycle semantics.
- Archive the active plan on clear-upcoming so no stale future schedule remains active.
- Return the post-delete no-plan state cleanly.
- Own JSON import apply semantics, including user-chosen effective start date.
- Own continuity-safe replace/default behavior when chosen start date conflicts with an existing workout.
- Reuse the existing text-first authoring seam for saved-mode freeform creation rather than creating a second backend path.

Frontend Responsibilities

- Open the `Open plan` modal from the current shell CTA.
- Render the active plan summary in small runner-facing language.
- Present one primary freeform creation surface.
- Present one secondary advanced JSON import surface.
- Present one confirmed `Clear upcoming schedule` action distinct from `Delete plan`.
- Offer a small clear-before-import choice only when applying a later-starting JSON plan over an existing active plan.
- Present one clear destructive `Delete plan` action with confirmation.
- Collect chosen start date for JSON import and submit it to the backend.
- Reflect only backend-owned lifecycle and conflict states.

The client must not:

- infer archive vs delete semantics
- decide which workouts to preserve
- remap imported schedules locally
- invent parallel authoring contracts

What We Explicitly Leave For Later

- full plan editing
- changing goal or race date from this modal
- workout-by-workout editing
- OCR/Garmin/similar-run work
- broad shell redesign
- unifying freeform creation with chosen-start-date selection in the same slice
- archived-plan browsing UI

QA Expectations

- `Open plan` opens one small saved-mode management modal, not a second onboarding app.
- Current active plan summary matches canonical saved-mode data.
- Freeform saved-mode creation uses the same primary text-first authoring path as onboarding.
- JSON import remains available and secondary.
- Chosen-start-date selection appears for saved-mode JSON import before apply.
- Delete archives the active plan, preserves logged history, and returns the runner to no-plan state.
- After delete, the runner can immediately create or import a new plan.
- No client path can silently delete saved logs or detach history.

Risks

- If delete semantics are defined as physical row deletion instead of active-plan archival, saved-history continuity becomes fragile.
- If the modal tries to combine too much authoring, import, and status detail at once, it becomes a mini CMS.
- If freeform creation and JSON import diverge visually or conceptually, saved mode will feel like two separate products again.
- If chosen-start-date is introduced to both JSON and freeform in the same slice, scope will expand quickly.

Implementation Update

- Added a backend `deleteActivePlan` action for saved mode.
- Delete archives the active `plan_cycle` instead of deleting the plan, planned workouts, or workout logs.
- The returned snapshot resolves through the existing saved-mode seam and lands in authenticated no-plan/setup-ready state.
- Saved-mode JSON import can now pass `requestedStartDate` through the same canonical apply seam.
- Added the first `Open plan` modal UI in saved mode.
- The modal shows the current plan title, goal/context copy, start/target/workout-count metadata, primary text-first replacement, secondary JSON import, and a quiet destructive delete section.
- The modal reuses `completeTextOnboarding`, `completeOnboarding`, and `deleteActivePlan` rather than adding client-owned lifecycle logic.
- The modal now reuses `clearUpcomingSchedule` for a confirmed `Clear upcoming schedule` action, with copy that explains active upcoming schedule is removed while planned workouts and logs stay as history.
- Saved-mode JSON import surfaces now show a small clear-before-import checkbox only when the chosen start day is later than today and an active plan exists; when selected, the frontend calls `clearUpcomingSchedule` first and then applies the imported plan through the existing `requestedStartDate` seam.
- Tall plan-management and import dialogs now use internal scroll with fixed header/footer rhythm so controls remain reachable on smaller laptop heights.
- Archived-plan browsing remains later work.

Exit Criteria

- [x] one canonical saved-mode `Open plan` modal is defined
- [x] `Delete plan` has one explicit safe meaning
- [x] saved-mode freeform creation is aligned to the existing text-first authoring seam
- [x] saved-mode JSON import is aligned to the new user-chosen start-date model at the backend seam
- [x] `Clear upcoming schedule` is exposed through the saved-mode plan-management modal
- [x] later-starting JSON import can explicitly clear the previous upcoming schedule before apply
- [x] tall plan-management/import dialogs keep content reachable through internal scroll
- [x] the slice stays clearly smaller than full plan editing

Next Recommended Role

QA

Suggested Next Step

Run saved-mode Safari QA for the `Open plan` modal, clear-upcoming schedule flow, delete-plan archival flow, text-first replacement, and JSON import with chosen start day plus optional clear-before-import.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Implemented the saved-mode plan-management modal slices: plan deletion has a backend archival action, clear-upcoming schedule has a backend lifecycle action and frontend control, JSON import accepts a chosen start date, and `Open plan` exposes a compact runner-facing modal.

### Key Decisions

- `Delete plan` archives the active plan and preserves logged history rather than physically deleting runner history.
- `Clear upcoming schedule` is separate from delete: it removes the active upcoming schedule from the current view while preserving planned-workout/log history under archived history.
- Saved-mode freeform creation reuses the existing text-first authoring seam.
- Saved-mode JSON import sends `requestedStartDate`; the frontend does not remap schedules locally.
- Later-starting JSON import can opt into `clearUpcomingSchedule` before apply; the frontend still does not edit individual workouts.

### Current State

- `Open plan` opens the compact saved-mode management modal.
- The modal includes active plan summary, text-first replacement, advanced JSON import with chosen start day, clear-upcoming schedule, and a destructive delete section.
- The saved-mode JSON import surfaces expose clear-before-import only when a later start date is selected and an active plan exists.

### Constraints

- Do not broaden into full plan editing or a training-plan CMS.
- Keep backend ownership of delete semantics, apply semantics, and continuity rules.
- Do not add per-day hover-checkbox schedule micromanagement.

### Risks / Open Questions

- Frontend must not infer delete/remap semantics locally; it should call the backend action/input.
- Archived-plan browsing and per-day schedule editing are intentionally not implemented.

### Next Recommended Role

QA

### Suggested Next Step

Verify the saved-mode `Open plan` modal in Safari, including internal scroll, clear-upcoming return to no-plan state, delete-plan return to no-plan state, JSON `requestedStartDate`, optional clear-before-import, and text-first replacement.
```
