# Workout Detail Lifecycle IA Spec

## Status

in_progress — lifecycle IA is QA-passed; future planned workout action contract reopened for
persisted workout editing.

## Type

frontend_spec

## Priority

high

## Next Recommended Role

backend

## Task

Implement the backend-owned persisted future workout edit seam before `Edit training` becomes a live
workout-detail action.

## Stage

BACKEND implementation / persisted future workout editing review-confirm seam

## Owner

ARCHITECT

## Last Updated

2026-06-15

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement the backend-owned persisted future workout edit seam for eligible future planned manual
workouts.

Stage:
BACKEND implementation / persisted workout-content editing boundary.

Context:
Workout detail IA is already lifecycle-driven, but `Edit training` must stay blocked until backend
owns editing of an already-persisted planned workout row. Product direction now wants future workout
detail actions at the top of the page, with `Copy training`, `Delete training`, and `Edit training`.
This backend slice enables only the edit seam; Frontend action-bar wiring is a later slice.

Root cause and architecture fit:
The visible symptom is that workout detail lacks `Edit training`. The underlying cause is not a
missing button; persisted workout-content editing does not yet have a backend-owned review/confirm
contract. Reuse existing active-plan editability policy, protected-history checks, manual workout
draft review, persisted workout reconstruction, and active-plan persistence metadata before adding
anything new. Do not create a frontend-owned editor or a second workout-constructor model.

Required reading:
1. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/AGENTS.md
2. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/agents/backend.agent.md
3. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/skills/hito-backend-supabase-contract/SKILL.md
4. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-15-workout-detail-lifecycle-ia-spec.md
5. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
6. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md
7. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-workout-editing/
8. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/
9. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-persistence.ts
10. /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts

Scope:
- Add a backend persisted-workout edit review/confirm boundary for eligible future planned manual
  workouts only.
- Reconstruct the persisted planned workout into existing manual workout draft/constructor input
  through the current persisted-workout reconstruction seam.
- Review edited draft input server-side and issue a backend token/checksum before persistence.
- Confirm by rebuilding the reviewed edit server-side, verifying the source row still matches the
  planned workout id/date/active plan, and updating exactly the same `planned_workouts` row.
- Preserve original active-plan source kind/status and write `active_plan_user_edit_v1` metadata with
  `user_edited_workout`, planned workout id, previous/target date, checksum, payload version, and
  `trusted_client_rows: false`.
- Block logged, skipped-with-log, completed, partial, provider-evidence-backed, comparison-backed,
  protected-history, unsafe-metric, rest, inactive, archived, foreign-user, unreadable, or unsupported
  source rows.
- Keep date-only truth canonical; this edit seam does not move the workout date.

Out of scope:
- Frontend action-bar wiring.
- Editing generated/selected/preset/imported rows unless Backend proves the existing reconstruction
  seam safely supports them and Architect explicitly expands scope later.
- Move, Copy/Paste, Delete/Clear behavior changes.
- Completed/today/past result editing.
- Recurrence, Restore UI, active-plan replacement, migrations, OpenAI, fake pace, or fake personal HR.

Validation:
- Run targeted ESLint for changed backend files and the manual authoring validator.
- Add/extend source validation for successful edit, stale source row/date, invalid token/checksum,
  client row payload rejection, protected/logged/evidence-backed source rejection, same-row update,
  no fake pace, no fake personal HR, and metadata readback.
- Run scoped `git diff --check`.
- Run `npm run build` if runtime source changed.
```

## Future Workout Detail Action Contract Update — 2026-06-15

Status:

Accepted as product/architecture contract; not yet implemented.

What this supersedes:

- The QA-passed lifecycle IA remains accepted for lifecycle state selection, feedback/result gating,
  and no fake tabs.
- For `future_planned` workouts only, the old same-weight `Plan actions` block is superseded by a
  top action contract.

Decision:

- Future workout detail actions should live near the top page chrome/action area, not in a lower
  `Plan actions` panel.
- Desktop action presentation should be an inline Hito action bar.
- Narrow/mobile action presentation should collapse into one `...` overflow menu.
- `Move training` is not part of the workout-detail action set. Calendar remains the move surface.
- The workout-detail action set is:
  - `Copy training`
  - `Delete training`
  - `Edit training`
- `Edit training` is allowed as the target product direction only after a backend-owned persisted
  workout edit review/confirm seam exists.

Source-kind boundary:

- First supported `Edit training` scope is eligible future planned manual workout rows that can be
  reconstructed into the existing manual workout constructor draft shape.
- Selected/generated/preset/imported rows remain blocked until a separate backend proof accepts their
  reconstruction and edit semantics.
- Today, past, completed, skipped-with-log, provider-evidence-backed, comparison-backed, protected,
  rest, unsupported, or unsafe-metric rows remain read-only for workout-content editing.

Canonical editing seam:

- Do not create a second persisted workout editor.
- Reuse the existing manual workout constructor/editor anatomy and manual workout draft review.
- Reuse persisted planned-workout reconstruction before initializing edit mode.
- Backend must review and confirm edits; frontend must never persist client-sent rows, segments,
  weekday labels, metric targets, or source metadata as truth.
- Confirm must update the same planned workout row, not implement edit as copy/delete.

Workout detail edit-mode anatomy:

- The upper workout-detail rhythm stays recognizable: date, title, status, plan/source context, and
  metric-truth readback remain visible.
- The lower planned workout structure area becomes interactive.
- Interactive elements should be the existing constructor-style step/block controls for supported
  warm-up, cooldown, repeat, recovery, run, tempo, hill, interval, notes/cues, duration, distance,
  and target-truth fields.
- Read-only in this gate: workout date, active-plan source, logged result, provider evidence,
  comparison/feedback state, protected-history state, and unsupported metric truth.

Copy/Delete detail action boundary:

- `Copy training` should reuse the existing backend copy source/reconstruction rules and must still
  require an eligible target date before persistence.
- `Delete training` is the runner-facing workout-detail label for the existing clear/delete semantic:
  remove the planned future row when backend marks it eligible.
- Both actions remain backend-owned; the workout-detail route may initiate them only from
  backend-shaped capability metadata.

## QA Acceptance Result

Accepted on 2026-06-15 after real saved-mode QA against disposable persisted fixtures.

What is now true:

- Future planned workouts show planned readback plus `Plan actions`, without fake `Log result`,
  fake `Feedback`, or the old static tab row.
- Today's planned workout leads with the planned overview and completion action instead of exposing
  completed-only surfaces.
- Past unlogged workouts stay actionable through result logging without pretending completed or
  evidence-backed state.
- Completed manual-result workouts show real saved result truth only when a real workout log exists.
- Evidence-backed workouts expose real `Result` and `Feedback` surfaces only when Garmin/comparison
  evidence exists.
- Rest days stay intentionally sparse and calm.
- Invalid deep links such as `?tab=feedback` now fall back safely instead of forcing empty/fake
  feedback UI.

Non-blocking QA observation:

- Some past-unlogged wording still references saved/skipped semantics in a secondary place, but it
  did not violate the accepted lifecycle contract and did not fail the QA gate.

## Source Of Truth

- Product truth: `docs/current-product.md`
- System truth: `docs/current-system.md`
- Current route owner: `src/routes/workout.$date.tsx`
- Manual completion owner: `src/components/CompletionPanel.tsx`
- Deterministic feedback readback: `src/components/workout-completion/WorkoutComparisonReadback.tsx`
- Hito DS reference: `src/routes/hitoDS.tsx`
- Hito DS tokens/classes: `src/styles.css`

## Root Cause

Visible symptom:

- Workout detail currently renders one static tab family for every workout state:
  `Overview`, `Log result`, `Feedback`, and `Preview state`.

Likely underlying cause:

- The route UI is tab-first instead of lifecycle-first. It treats all workouts as if all surfaces are
  equally available, even when a future workout cannot be logged yet and has no feedback evidence.

Canonical owner:

- `rendering view model` and workout-detail frontend information architecture.

Root-cause fix direction:

- Derive a small workout-detail lifecycle state from backend-shaped truth, then render only the
  surfaces/actions that are real for that state.
- Do not patch by hiding labels with copy alone.
- Do not add fake disabled tabs just to preserve the existing layout.

## Design Decision

Workout detail should use one shared visual family, but the primary content model must change by
lifecycle:

- Future planned workouts are action-first.
- Today's planned workout is overview-plus-completion-action.
- Completed or evidence-backed workouts are result/readback-first, with `Feedback` only when a real
  feedback/evidence path exists.

Tabs are allowed only when they switch between real, currently useful surfaces. A tab must not
represent a placeholder, future feature, or unavailable capability.

## Lifecycle State Model

### `future_planned`

Definition:

- `workout.status === "upcoming"` or `workout.date > snapshot.currentDate`
- no saved log
- no Garmin evidence/comparison/AI feedback

Primary user question:

- "What is planned here, and what can I safely change before this day arrives?"

Visible surface model:

- No `Overview / Log result / Feedback` tab list.
- Show the planned workout readback as normal page content.
- Replace the lower `Plan actions` panel with a top action bar on desktop and a `...` overflow menu
  on narrow screens.
- The main column should keep planned workout structure/readback as real content rather than using a
  fake tab panel to preserve layout height.

Allowed actions:

- `Copy training` when backend capability exists for this source row and a target-date flow is
  available.
- `Delete training` when backend clear/delete capability exists for this future planned row.
- `Edit training` only after backend persisted workout-content editing exists for this row.

Action hierarchy:

- Desktop: show `Copy training`, `Delete training`, and `Edit training` inline near the top action
  area, with `Edit training` enabled only when the backend edit seam proves support.
- Mobile/narrow: collapse the same actions into one `...` overflow menu.
- Calendar remains the owner for `Move training`; do not show `Move training` on workout detail.
- Hidden/deferred: unsupported `Edit training`, recurrence, restore, universal edit expansion,
  generated-row editing, and batch workout-content operations.

Do not show:

- `Log result`
- `Feedback`
- `Preview state`
- Garmin upload CTA
- completed/result readback

### `today_planned`

Definition:

- `workout.status === "today"` or `workout.date === snapshot.currentDate`
- no saved log yet
- non-rest workout

Primary user question:

- "What should I do today, and how do I mark it done when I finish?"

Visible surface model:

- Show `Overview` as the default primary content.
- Avoid a tab list if `Overview` is the only live surface.
- Add a clear completion action area near the end of the main column or as a sticky-safe primary
  action on mobile:
  - `Mark as done`
  - optional quieter alternatives if already supported: `Partial`, `Skipped`
- Result logging is an action/state transition, not a separate live tab before a result exists.

Action hierarchy:

- Primary: `Mark as done`.
- Secondary: `Log partial` / `Skip` if existing completion flow supports them without creating a
  heavier form-first surface.
- Optional secondary route: `Add Garmin file after completion` should not appear before completion
  as a primary promise.

Do not show:

- `Feedback` as a live tab unless real evidence/feedback exists.
- `Preview state`.
- Future workout mutation actions as peers to completion.

### `completed_with_manual_result`

Definition:

- `workout.log` exists, or `workout.status` is `completed`, `partial`, or `skipped`
- no Garmin evidence/comparison yet

Primary user question:

- "What did I record, and can I correct or enrich it?"

Visible surface model:

- Primary content should be `Result` or `Saved result`, not `Log result`.
- The saved result readback should lead.
- Editing/overwriting the result may stay available through a quieter `Edit result` or disclosed
  correction path if the current `CompletionPanel` supports overwrites.
- Garmin enrichment can appear as a secondary continuation action if saved-mode upload is truly
  available:
  - label intent: `Add Garmin file for comparison`
  - placement: below result readback, not as a tab competing with the result until evidence exists.

Tabs:

- No tab list is required if only result readback is live.
- If Frontend chooses to retain tabs for URL compatibility, only show real surfaces and redirect
  unsupported `?tab=complete` to `Result` semantics. Do not keep the `Log result` label for an
  already-saved result.

Do not show:

- `Feedback` as a live analysis tab when there is no attached Garmin evidence and no comparison.
- `Preview state`.

### `completed_with_evidence`

Definition:

- saved result may or may not exist
- Garmin evidence exists, or deterministic comparison exists, or bounded AI insight exists:
  - `feedback.latestAsset`
  - `feedback.latestActualMetrics`
  - `feedback.latestComparison`
  - `feedback.latestAiInsight`
  - or `feedback.marker.state` is `evidence_attached` / `feedback_ready`

Primary user question:

- "How did my actual run compare with the plan, and what should I take from it?"

Visible surface model:

- Show result/readback and feedback as two real surfaces.
- Use tabs only here if both surfaces are live:
  - `Result`
  - `Feedback`
- `Feedback` should open directly when routed from calendar feedback markers or `?tab=feedback`.
- `Feedback` keeps deterministic comparison primary and recommendation secondary.

Action hierarchy:

- Primary readback: factual result/evidence status.
- Secondary action: remove/replace Garmin evidence only through the existing explicit remove/upload
  controls.
- Correction action: edit manual result stays quieter than feedback review.

Do not show:

- `Log result` as the tab label after a result already exists.
- fake future warm-up/run/cooldown comparison fields unless the backend comparison contract provides
  them.
- `Preview state`.

### `past_unlogged`

Definition:

- non-rest workout date is before `snapshot.currentDate`
- no saved log
- current inferred `workout.status` may be `skipped`

Design treatment:

- Treat as a review/correction state, not a future action state.
- Lead with a quiet status: `Not logged` or `Skipped until updated`.
- Provide the existing completion correction path if the backend still allows overwriting skipped
  truth with a real result.
- Do not show future mutation actions.
- Do not show `Feedback` unless evidence exists.

### `rest_day`

Definition:

- `workout.type === "rest"`

Design treatment:

- Keep rest days sparse.
- No `Log result` or `Feedback` tabs by default.
- If a future rest day is editable through backend Add/Clear/Move capability, the action belongs in
  the future action panel or calendar authoring flow, not in a result logging tab.
- If a rest day has a future strength/mobility assignment, render that assignment as planned content
  and keep completion behavior capability-driven.

### Preview State Boundary

The current `Preview state` tab is out of scope for this pass.

Required design decision:

- Do not include `Preview state` as a normal workout-detail lifecycle surface.
- Do not redesign signed-out preview mode or preview route behavior in this slice.
- If preview-mode needs a route-level notice, keep it in existing preview/saved-mode copy outside the
  lifecycle action surface.

## Screen Anatomy

### Shared Page Chrome

Preserve:

- calendar breadcrumb
- phase/week/date context
- workout identity and result badge area
- hero title
- metric readback for non-rest workouts
- right-side grouped support panel
- saved result badge in route chrome when applicable
- progress-based `Week Status`

Adjust:

- Main content area becomes `lifecyclePrimarySurface`, not always `tabPanel`.
- Tab row appears only when `visibleSurfaces.length > 1`.
- Unsupported route search tabs should resolve to the nearest valid surface for the lifecycle state.

### Main Column Order

Future planned:

1. Top action bar on desktop or `...` overflow menu on narrow screens.
2. Planned workout structure/readback.
3. Optional low-priority support note, only if needed.

Today planned:

1. `Overview` workout structure/readback.
2. Completion action strip or panel.
3. Optional disclosed detailed logging form after the runner chooses a result action.

Completed manual result:

1. `Saved result` readback.
2. Optional `Edit result` / correction disclosure.
3. Optional secondary Garmin continuation action if saved-mode upload is available.

Completed with evidence:

1. Real surface switcher: `Result` / `Feedback`.
2. `Result` surface: manual result and evidence summary.
3. `Feedback` surface: attached file, factual plan-vs-run comparison, recommendation.

## Surface Availability Matrix

| Lifecycle state | Overview | Future actions | Result / completion | Feedback | Preview state |
| --- | --- | --- | --- | --- | --- |
| `future_planned` | content, not tab | top bar / overflow, capability-driven | hidden | hidden | hidden |
| `today_planned` | visible | hidden | action strip, not tab until invoked | hidden unless evidence exists | hidden |
| `completed_with_manual_result` | optional support | hidden | visible as `Result` | secondary CTA only, unless evidence exists | hidden |
| `completed_with_evidence` | optional support | hidden | visible as `Result` | visible | hidden |
| `past_unlogged` | optional support | hidden | correction path if allowed | hidden unless evidence exists | hidden |
| `rest_day` | sparse rest content | capability-driven future only | hidden by default | hidden by default | hidden |

## Tab Rules

Use Hito DS tabs only when there are at least two real live surfaces.

Recommended labels:

- `Result` instead of `Log result` once a result exists.
- `Feedback` only when Garmin evidence/comparison/AI feedback exists, or when the product explicitly
  wants an upload surface for already completed saved workouts.
- `Overview` only when it is one of multiple live surfaces. If it is the only surface, render it as
  normal section content without tab chrome.

Do not:

- keep tabs visible only to preserve layout height
- show `Preview state` as a product tab
- show future-only features as disabled tabs
- show `Feedback` as an empty promise for future workouts

Route compatibility:

- Preserve incoming `?tab=feedback` when `Feedback` is valid.
- If `?tab=feedback` is invalid for the lifecycle state, route should render the lifecycle default
  and may show no toast.
- Preserve `?tab=complete` only as a compatibility alias:
  - today/no-result can open completion action mode if supported
  - completed state should map to `Result`
  - future state should map to lifecycle default

## Future Planned Top Actions

Purpose:

- Replace the fake full tab set and lower `Plan actions` panel with a compact action affordance that
  answers what can be changed before the workout happens.

Anatomy:

- desktop: top inline action bar using existing Hito button/menu primitives
- narrow screens: one `...` overflow trigger with the same action set
- no route-local mini toolbar system
- no lower card/panel just to hold actions

Allowed action examples:

- `Copy training`
- `Edit training`
- `Delete training`

Deferred / unavailable behavior:

- `Edit training` must not be live until the backend persisted workout edit seam exists.
- If Product wants discoverability before implementation, show it disabled with a clear backend-not-
  ready explanation. Do not open a fake editor.
- `Move training` does not belong on this detail surface even if calendar move remains available.

Empty capability state:

- If no future mutation capability exists, show one quiet row:
  - title: `No changes available for this workout`
  - body: explain that protected, generated, logged, or evidence-backed rows cannot be edited here
  - no fake actions

## Today Completion Action Model

Purpose:

- Let the runner act quickly without making the page feel like a form before the workout has
  happened.

Recommended interaction:

- `Mark as done` is the primary CTA.
- If the runner needs detail, `Add details` or `More result options` can disclose the existing
  richer completion form.
- `Partial` and `Skipped` should stay available, but secondary.
- Existing body notes stay inside the result flow, not as a standalone top-level tab.

Visual hierarchy:

- The planned workout overview remains the largest content.
- Completion CTA appears as a calm action strip or compact `hito-surface-flat`, not a giant card.
- Saving/pending/success/error feedback uses existing completion panel feedback patterns and Hito
  async/toast rules if already implemented.

## Completed Result And Feedback Model

Result surface:

- Lead with the saved outcome:
  - completed
  - partial
  - skipped
- Show actual distance/duration/RPE/notes/intervals/body notes only when present or relevant.
- Let correction/edit stay secondary.

Feedback surface:

- Use the existing loaded attached-first Feedback direction:
  - attached file first when evidence exists
  - `Plan vs run` as the strongest section
  - deterministic comparison primary
  - recommendation secondary
- If no evidence exists, prefer a secondary continuation action from `Result` over a live empty
  `Feedback` tab.

## State Specs

### Loading

- Use current route pending skeleton for the route-level load.
- If lifecycle actions require additional capability data, use small row skeletons inside the action
  panel rather than blocking the whole page.

### Empty

- No workout for date:
  - preserve current `No workout` / setup-required state.
- Future action panel with no available capabilities:
  - show one quiet row, no disabled button soup.
- Feedback with no evidence:
  - do not show as a tab for future/today states.
  - for completed saved workouts, show as a secondary upload/enrichment action only if upload is
    genuinely available.

### Error

- Route load error:
  - preserve current route error surface.
- Completion save error:
  - keep `CompletionPanel` field/status behavior.
- Future action errors:
  - action-specific errors should stay inside the row/dialog that initiated the mutation.
- Feedback upload/remove errors:
  - preserve existing `WorkoutFeedbackPanel` error handling.

### Success / Review

- Future actions that mutate schedule/content must remain backend-reviewed when existing seams
  require review/confirm.
- Today completion success should refresh into completed/result anatomy.
- Garmin upload success should refresh into completed-with-evidence anatomy and make `Feedback`
  eligible.

## Hito DS Reuse

Use existing primitives:

- `hito-page-title`, `hito-section-title`, `hito-panel-title`, `hito-body`, `hito-body-small`,
  `hito-label`, `hito-caption`
- `hito-tabs-simple` / `hito-tab` only when two or more real surfaces exist
- `hito-surface`, `hito-surface-flat`, `hito-row-group`, `hito-list-row`
- `hito-button` variants and sizes
- `hito-status-pill`, result badges, status markers
- existing `Icon` primitive
- existing `CompletionPanel`, `WorkoutFeedbackPanel`, and `WorkoutComparisonReadback` composition
  where behavior remains valid

Do not introduce:

- route-local tab styling
- a new workout-detail mini design system
- extra bordered cards for every subsection
- custom disabled/future-feature components

## Data / View-Model Expectations

Frontend should derive lifecycle UI from backend-shaped fields already present in the route data:

- `snapshot.currentDate`
- `snapshot.source`
- `snapshot.planMeta?.workoutEditing`
- future backend-owned persisted edit capability for the current planned workout row
- `workout.date`
- `workout.type`
- `workout.status`
- `workout.log`
- `workout.feedbackMarker`
- `feedback.latestAsset`
- `feedback.latestActualMetrics`
- `feedback.latestComparison`
- `feedback.latestAiInsight`

Do not infer mutation rights from labels, route names, or local workout source assumptions. Use
backend capability metadata when deciding whether future workout actions are live.

## Responsive Behavior

Desktop:

- Keep current two-column route rhythm.
- Top action bar sits with the workout detail header/action area, then the main lifecycle surface
  occupies the same main-column position as the current tab content.
- Right panel remains grouped and supportive.

Mobile:

- Avoid top tab overflow by hiding the tab list when only one surface is valid.
- Collapse future detail actions into a `...` overflow menu.
- Put today/result primary action strips immediately after overview/result content.
- If tabs are valid, use simple tabs with horizontal overflow only for real surfaces.
- Do not stack future planned action rows as a replacement for the overflow menu unless the overflow
  menu fails accessibility QA.

## Copy Intent

Use plain lifecycle language:

- `Move training` only for calendar-owned move surfaces, not workout detail
- `Copy training`
- `Delete training`
- `Edit training`
- `Result`
- `Saved result`
- `Mark as done`
- `Add details`
- `Feedback`

Avoid:

- `Preview state`
- `Log result` for already-saved results
- technical capability reasons in primary copy
- promises such as `Edit training` unless the action is implemented and backend-owned

COPY can refine final wording after the IA is implemented, but Frontend should not block on a copy
pass for this lifecycle structure.

## What Stays Out Of Scope

- backend workout/result/feedback semantics
- preview-mode redesign
- calendar move/copy/delete/manual authoring bug fixes
- recurrence
- frontend-only persisted workout-content editing
- generated/selected/preset/imported persisted workout-content editing until backend explicitly
  proves those source rows are reconstructable and safe
- future warm-up/run/cooldown comparison fields not present in backend comparison truth
- plan replacement/refresh semantics

## Acceptance Criteria

- Future planned non-rest workouts do not show `Overview / Log result / Feedback / Preview state` as
  live tabs.
- Future planned workouts use top actions on desktop and `...` overflow on narrow screens.
- Future planned workout detail actions are exactly `Copy training`, `Delete training`, and
  `Edit training` when backend capability supports them.
- `Move training` is absent from workout detail and remains calendar-owned.
- Today's unlogged workout shows overview and a clear completion action, without making `Feedback`
  look live before evidence exists.
- Completed manual-result workouts show result/readback language instead of `Log result` as the
  primary label.
- Garmin evidence/comparison makes `Feedback` available as a real surface and direct calendar
  feedback links still land there.
- `Preview state` is not part of the normal lifecycle IA.
- Unsupported route search tabs resolve to the nearest valid lifecycle surface.
- Existing workout overview, right-side context, completion save behavior, Garmin upload/remove
  behavior, and deterministic comparison readback are preserved.
- Mobile has no unnecessary tab row when there is only one live surface.

## Risks

- If `Edit training` is shown before backend workout-content editing exists, the UI will overpromise.
- If tabs are hidden without route-search fallback, existing deep links to `?tab=feedback` may feel
  broken.
- If `Feedback` is entirely hidden for completed saved workouts with no evidence, discoverability of
  Garmin upload may drop; solve with a secondary upload/enrichment action, not a fake tab.
- If result correction is too prominent, completed workouts may feel less settled than planned.

## Open Questions For Frontend

- Does the current route data expose enough row-level capability metadata to render future
  `Move/Copy/Clear` actions directly in workout detail, or should the first implementation route
  users back to the calendar action owner?
- Should `?tab=complete` become a compatibility alias to `Result`, or should the URL param migrate to
  a new `surface=result` value in a later cleanup?
- Should late logging for `past_unlogged` stay inline, or should it open the same completion action
  mode used by today's workout?

## Suggested Next Step

Frontend should implement a small route-level lifecycle view-model in `src/routes/workout.$date.tsx`
that controls visible surfaces, tab availability, and action-panel placement while reusing existing
completion and feedback components.
