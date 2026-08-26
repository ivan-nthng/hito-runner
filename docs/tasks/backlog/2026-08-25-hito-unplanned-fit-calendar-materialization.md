# Capture Unplanned Activities and FIT Structure on Rest Days

## Work Item

- **Notion Task:** HITO-255
- **Mode:** Tracked
- **Status authority:** Hito Running Notion Tasks
- **Primary Area:** Runner
- **Epic:** Runner Progress and Insights
- **Priority:** Highest — first-user launch blocker
- **Initial owner:** ARCHITECT
- **Parent:** HITO-280 — Complete First-User Production Launch Readiness

## Outcome

A runner can open a past empty or stored-Rest Calendar date, upload one FIT/ZIP activity file,
review the facts extracted from that file, and explicitly confirm one independently runner-owned,
completed Calendar workout. The canonical activity and its immutable source/revision remain the
factual evidence owner; the Calendar workout is a materialized product projection with
`origin_kind=file_import`, not a fabricated plan or provider-specific container.

This is required before first-user launch so runners can add real runs completed before their Hito
schedule existed or on days where no workout was planned.

## User Report

Ivan currently has three real runs on prior dates while his Hito Calendar is empty. He needs to
upload those FIT files and see each activity as a completed Calendar workout. When a FIT file
contains a workout name, Hito should use it. Route/location presentation will be implemented with
the separate private activity-map task.

## Current Source Facts

- `POST /api/workout-result/upload` already accepts an omitted `plannedWorkoutId` and delegates to
  the canonical `ingestGarminWorkoutResult` owner.
- The canonical Runner Activity graph already stores an unplanned activity, immutable source and
  revision, deduplicates the exact FIT source and exposes it in Activity History.
- The FIT parser already extracts activity start/local date, summary metrics, `workoutName`, laps
  and reconstructed steps when present. Missing name or structure remains valid missingness.
- The public upload response and ordinary Product entry point are workout-detail oriented. With no
  `plannedWorkoutId`, the activity is retained but no runner-owned Calendar workout is created and
  there is no empty/Rest-day review-and-confirm flow.
- Existing standalone Calendar materialization and Runner Activity match owners must be reused.
  Do not add another activity table, upload route, Calendar writer, source model or provider DTO.

## Accepted Product Contract

### Entry and date authority

- Calendar uses one existing day-action trigger rather than a new upload surface. On desktop and
  pointer devices, every eligible past day shows the Design System icon-only `+` button on cell
  hover or keyboard focus. On mobile/touch layouts the same `+` button is always visible.
- A Calendar date without a workout is already a Rest Day. The Product must never offer `Add rest
day` for that date or create a second Rest entity.
- On a past date, the `+` opens one context menu with one action: `Add activity`. It starts FIT/ZIP
  upload and factual Review. Past dates do not offer `Add workout` or any other schedule-authoring
  action through this trigger.
- The same past-day action applies whether the date is currently Rest or already contains a
  workout. On an occupied date, Activity association is explicit in Review and is never silently
  matched or used to overwrite the workout.
- Today and future Rest Days retain their existing add-workout interaction. HITO-255 does not
  redesign that authoring menu and does not admit a completed Activity whose factual FIT date is in
  the future.
- FIT `activity_local_date` is the factual target date. If it differs from the date where upload was
  opened, Review displays the difference and materializes only on the FIT date after confirmation.
- An occupied Calendar date is never overwritten or silently matched. Review offers only an
  evidence-supported explicit association to the existing workout or cancellation.
- On a past Rest Day, Confirm atomically changes that Calendar date from Rest to one completed
  file-import workout. Cancellation leaves the Rest Day unchanged.

### Review and materialization

- Upload parses and retains the owner-bound canonical Activity before Calendar materialization.
- Review displays the extracted date, sport, duration, distance, available heart-rate/cadence/
  power/ascent facts and available FIT laps/structured steps. Missing facts stay visibly missing.
- Title priority is the FIT workout name when present. If absent, use an editable neutral `Run`
  fallback; the original filename remains provenance and is not silently promoted to workout truth.
- Confirm is the only Calendar writer. It creates exactly one completed, independently runner-owned
  workout with immutable file-import provenance and the exact canonical Activity match.
- Closing or cancelling Review retains the Activity in History and Saved/Unassigned activity
  state, creates no Calendar row and requires no re-upload to resume the review.
- Exact source re-upload is idempotent and returns the retained Activity/review instead of creating
  duplicate sources, workouts, results or Calendar rows.

### Evidence and downstream consumers

- FIT-derived completion supplies objective activity facts only. It never invents RPE, notes,
  health state, terrain meaning or coaching interpretation.
- Available laps and structured steps are retained and shown. Their absence is valid and does not
  block a summary-only run.
- Calendar, History, Progress and Runner Fitness Profile must read the same canonical Activity and
  completed workout after reload/new tab; no client-reconstructed facts or dual writes are allowed.
- Route geometry, map rendering, named location and public sharing remain in HITO-248. This task
  must neither discard future route evidence nor introduce a partial map/location model.

## Designer Interaction Specification — 2026-08-25

### Decision and current-owner evidence

The accepted experience is one Calendar-owned entry into one resumable Activity review. It is not a
second upload feature and it does not reuse the workout-detail comparison flow as if an unplanned
Activity already had a workout.

Current source establishes the implementation boundary:

- [`Calendar.tsx`](../../../src/components/Calendar.tsx) and
  [`calendar-projection.ts`](../../../src/components/calendar/calendar-projection.ts) own Calendar
  day eligibility and action composition. `resolveCalendarAddActionContext` currently exposes Add
  only on empty dates at or after `snapshot.currentDate`; a past-day Activity action is therefore a
  new Product capability at this existing seam, not a change to future Add Workout.
- [`HitoCalendarDayCell` and `HitoWorkoutDayRow`](../../../src/components/ui/hito-calendar-day.tsx)
  own desktop/week/mobile day anatomy. [`Calendar.tsx`](../../../src/components/Calendar.tsx)
  already owns the positioned, hover/focus-revealed action controls that sit above that anatomy.
- [`HitoButton`](../../../src/components/ui/button.tsx) and
  [`DropdownMenu`](../../../src/components/ui/dropdown-menu.tsx) already provide the required
  icon-only control, accessible name, focus ring, menu keyboard navigation, collision handling and
  trigger focus restoration.
- [`WorkoutActivityFileDialog.tsx`](../../../src/components/workout-completion/WorkoutActivityFileDialog.tsx)
  proves the stable modal, busy-dismissal and return-focus pattern, while
  [`CompletionPanel.tsx`](../../../src/components/CompletionPanel.tsx) proves the single hidden
  `.fit,.zip` input, 25 MB limit presentation and truthful upload errors. Their planned-workout
  comparison content must not be reused for an unplanned Activity.
- [`api.workout-result.upload.tsx`](../../../src/routes/api.workout-result.upload.tsx) accepts an
  omitted `plannedWorkoutId`, and the canonical ingest owner retains the Activity. Its current
  unmatched success response does not expose a resumable Review projection.
- [`ActivityHistoryPanel.tsx`](../../../src/components/progress/ActivityHistoryPanel.tsx) and
  [`runner-activity/product-contract.ts`](../../../src/lib/runner-activity/product-contract.ts) own
  factual History presentation and public Activity facts. The current contract has no Saved /
  Unassigned state, FIT workout name, laps/steps, review capability or deep-open parameter; those
  are Product/Backend contract gaps for HITO-255, not facts the Frontend may reconstruct.
- Calendar persistence enforces one workout per runner/date. Therefore the more-specific accepted
  occupied-date rule governs that variant: a Rest date may materialize one new completed
  `file_import` workout, while an occupied date may only explicitly associate the exact retained
  Activity with the existing eligible workout or cancel. It cannot create a second hidden workout,
  overwrite the existing workout document or change its origin.

No shared Design System primitive gap is proven. HITO-255 needs a bounded Product composition using
the existing Button, DropdownMenu, Dialog, Sheet, field, status/state-surface, disclosure, row,
toast, focus and localization owners. In particular, do not add an upload primitive, progress
framework, Calendar-action registry, status-chip family or toast action API.

### 1. Calendar entry and the `+` trigger

Eligibility is server/capability-backed and must satisfy all of the following:

- the date is before the runner's current Calendar date;
- the date is a real visible date in the active month, week or mobile list, not a duplicated
  outside-month filler cell;
- no Calendar move/undo transaction currently owns the cell;
- the runner is in persisted saved mode and the Activity-import capability is allowed.

The action is available on both Rest and occupied non-Rest dates. Past-date eligibility must not
reuse `addWorkout.allowed`, and it must not expose Add Workout, Add Rest Day, Paste, Move-target or
template actions. Today and future rendering remains byte-for-byte behaviorally unchanged.

Placement and visibility:

- **Desktop month/week, fine pointer:** place one ghost icon-only `HitoButton` with the `plus` icon
  in the existing top-right day action cluster. It is visually hidden at rest only under a genuine
  fine-pointer/hover media condition and becomes visible on cell hover, cell `focus-within`, its own
  keyboard focus and menu-open state. The control remains in the tab order while visually hidden;
  focus reveals it before activation.
- **Desktop occupied cell:** the `+` and any already-valid workout action (`More`) form one compact
  top-right action cluster. They never overlap each other, the date, status marker or feedback
  marker. Do not remove or merge an existing action whose capability remains valid.
- **Mobile/touch/coarse pointer:** the `+` is always visible in the row's right action rail and uses
  the existing 44 × 44 px route-level touch treatment demonstrated by Activity History. If `More`
  also exists, render two separate 44 px controls in the same rail without shrinking either target.
- **Visual treatment:** ghost/quiet until hover or focus, semantic focus ring, no new fill, border,
  shadow, raw colour or Calendar-state meaning. The plus icon is decorative; the localized
  accessible name carries the action and date.

Accessible names:

- English: `Add activity for {full date}`.
- Portuguese: `Adicionar atividade em {full date}`.

The date uses the existing locale formatter. `+` alone is never the accessible name.

### 2. Context menu, selection and focus

`DropdownMenu` is anchored to the `+`, aligned to the nearest safe viewport edge (`align="end"`
for the normal top-right cluster) and allowed to flip through the existing Radix collision owner.
The compact menu contains:

1. a non-interactive localized full-date label;
2. one enabled action only: icon `activity` + `Add activity` / `Adicionar atividade`.

There is no Add Workout, Add Rest Day, Replace, Paste, submenu, generic file menu or disabled future
action in this past-date menu. The trigger owns `aria-haspopup`, open state and accessible name
through the existing primitive. Arrow keys move within the menu; Enter/Space selects; Escape and
outside dismissal close it and return focus to the same `+` trigger.

Selecting Add activity closes the menu and opens the one Activity workflow overlay. It does not
immediately invoke a system picker from the disappearing menu item. The workflow heading receives
focus and its primary `Choose FIT or ZIP` control opens the native picker. This keeps picker cancel,
errors, busy state and focus return inside one stable owner instead of a toast-only dead end.

Closing the untouched workflow returns focus to the originating `+`. If Calendar refresh removes
that exact trigger, focus falls back to the Calendar heading, never to `document.body` or an
unrelated day.

### 3. Workflow shell and file selection

The workflow is one stateful overlay, not a wizard with route changes:

- **Desktop:** canonical stable Product Dialog, `workflow` width, viewport-bounded height, fixed
  header/footer and one internally scrolling body.
- **Mobile 375 px:** the existing full-height bottom Sheet pattern, `100dvh`, safe-area bottom
  padding, fixed header/footer and one scrolling body. It must not inherit a narrow side-sheet width.

Header hierarchy is stable in every state:

- eyebrow: `Activity file`;
- title: `Add activity` before parsing, then the FIT workout name or editable `Run` fallback;
- description: the localized clicked Calendar date before parsing;
- status after retention: `Saved · Not on Calendar` (`Salva · Fora do Calendário`).

File control contract:

- one hidden native input owned by this workflow;
- `accept=".fit,.zip"`, no `multiple`, no drag-and-drop requirement;
- primary action `Choose FIT or ZIP` / `Escolher FIT ou ZIP`;
- supporting copy states the current factual 25 MB limit and that a ZIP must contain exactly one FIT
  activity;
- cancelling the native picker makes no state change and returns focus to `Choose FIT or ZIP`;
- choosing another file is available only before a canonical Activity has been retained, or after a
  failed input that the server proves created no retained Activity.

### 4. Upload, parse and failure states

The visible state follows server truth. Do not animate a fake percentage or advance a timer-based
phase.

| State                                   | Visible hierarchy and action                                                                                                                         | Calendar/Activity effect                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Selecting                               | File requirements, Choose FIT or ZIP, Cancel                                                                                                         | No upload and no mutation                                                     |
| Uploading/processing, no phase readback | Indeterminate loader, selected filename, `Uploading and processing activity…`; footer actions disabled except no destructive dismissal               | No Calendar write; result not yet claimed                                     |
| Server distinguishes upload from parse  | Show `Uploading file…` then `Reading FIT facts…` only from the authoritative returned phase; determinate bytes only if transport supplies real bytes | No Calendar write                                                             |
| Unsupported/empty file                  | Inline destructive state names `.fit`/`.zip`; `Choose another file`                                                                                  | No Activity-retention claim                                                   |
| Too large                               | `This file is larger than the 25 MB limit.` and Choose another file                                                                                  | No Activity-retention claim                                                   |
| ZIP has no FIT / more than one FIT      | State the exact archive condition; Choose another file                                                                                               | No Activity-retention claim                                                   |
| FIT parse failed                        | `Hito couldn't read this FIT file.` plus safe server reason when admitted; Choose another file only if readback proves no resumable Activity         | No Calendar write; do not claim deletion or retention without server evidence |
| Network interruption, commit unknown    | `Connection interrupted. Check whether the activity was saved before uploading again.`; primary `Check upload status`, secondary Close               | Never encourage immediate duplicate upload; no Calendar write                 |
| Authentication expired                  | Preserve no speculative local success; `Sign in again`, then return to the same Activity when server identity/readback allows                        | No Calendar write                                                             |
| Retryable server failure                | Inline error and Retry using the same idempotency identity; retain filename but never raw bytes across reload                                        | No duplicate Activity or Calendar write                                       |

During the one in-flight upload request, Escape, outside dismissal and the close button are disabled
as in the existing Activity-file dialog. The busy state is announced once through `aria-busy` and a
polite live region. Errors use one inline `role="alert"`; do not duplicate the same sentence in a
toast and live region. Reduced motion uses a static indeterminate indicator with an accessible text
label.

### 5. Factual Review hierarchy

Review opens only after the response proves that the canonical Activity and exact revision are
retained. It contains, in order:

1. **Saved state and title.** Use trimmed FIT `workoutName` when present. When it is absent, show an
   editable field labelled `Activity title` with neutral value `Run`. Filename remains in Source
   details and never becomes the title. Empty edit resolves back to `Run`; do not infer a route,
   place, session purpose or workout type.
2. **Placement notice.** Show the authoritative FIT local date and any clicked-date mismatch or
   occupied-date decision before metrics and before Confirm.
3. **Primary factual rows.** Activity local date, sport, timer duration (or elapsed duration with
   the basis named), and distance. These rows remain present; a missing value reads `Not available
in this FIT file`, never `0`, an em dash without explanation or a client estimate.
4. **Available supporting facts.** Average/maximum heart rate, average/maximum power, average cadence,
   ascent/descent and calories may appear only when the public Activity Review contract supplies the
   exact fact and basis. Missing supporting facts use one concise `Not available in this FIT file`
   group rather than empty cards.
5. **Laps disclosure.** When laps exist, label the count and expose an ordered row/table readback with
   only supplied duration, distance, heart-rate, power, cadence, elevation, intensity and trigger
   facts. When absent, keep the section visible with `No laps were recorded in this FIT file.`
6. **Structured steps disclosure.** When reconstructed steps exist, show their source order and
   available lap count/duration/distance/facts. When absent, show `No structured workout steps were
recorded in this FIT file.` Do not reconstruct intervals in the client.
7. **Source details disclosure.** Original filename, extracted filename for ZIP, source kind,
   retained-source availability and Activity/revision identifiers only when appropriate for the
   existing technical-detail pattern. No storage path, parser payload or private provider detail.

Metrics use semantic description-list/row/table composition, tabular numerals and existing locale
formatters. Laps and steps are not colorful cards or charts. Every section remains understandable
without color, and unavailable facts are not counted as zero.

### 6. Calendar placement variants

The target is always the authoritative FIT local date returned by Backend. The clicked date is
context, never a competing target.

| Variant                                        | Required review copy and choice                                                                                                                                                                | Confirm result                                                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Past Rest, dates match                         | `This activity will be added to {date}.` No redundant Rest selector.                                                                                                                           | Atomically replaces the Rest representation with exactly one completed independently runner-owned `file_import` workout matched to this Activity.   |
| Clicked date differs from FIT date             | Warning: `You started from {clicked date}. This FIT file records {FIT date}, so Hito will use {FIT date}.` Re-evaluate occupancy on the FIT date.                                              | Writes only to the FIT date after the applicable Rest/occupied decision.                                                                            |
| FIT date has an eligible occupied workout      | Warning names date and existing workout. One required explicit choice: `Associate with {workout title}`. Supporting copy says its authored workout content and origin will not be overwritten. | Associates the exact Activity/revision as evidence/completion of that existing workout; does not create a second row or change its origin/document. |
| FIT date has a protected or ineligible workout | Explain `This activity is saved, but it can't be associated with the workout on {date}.` Confirm is absent; offer Close and View Activity History.                                             | Activity remains Saved/Unassigned; no Calendar mutation.                                                                                            |
| FIT date is today/future                       | Explain that a future-dated activity cannot be added from this historical flow; offer Close and History.                                                                                       | Activity remains retained only if Backend admitted it; no Calendar mutation.                                                                        |
| FIT local date missing                         | `The activity date is not available in this FIT file.` Confirm is absent.                                                                                                                      | Saved/Unassigned only; no invented date or clicked-date fallback.                                                                                   |

Occupied association is explicit but not a generic choice list: there is only the one current
workout for that date. Confirm remains disabled until the runner selects the association control.
The existing workout name, date and status are visible next to that control. HITO-255 must not offer
Replace, keep both, move, clear or title/structure editing here.

### 7. Close, Saved/Unassigned resume, duplicate and stale states

Before Activity retention, `Cancel`/Close simply dismisses the workflow. After retention, the label
changes to `Close`; closing never asks to discard the Activity and never mutates Calendar. A short
inline note states: `The activity is saved in Activity History. You can finish adding it to Calendar
later.`

History adopts a bounded resumable state using its existing row/action owner:

- internal state: `saved_unassigned`; user-facing label: `Saved · Not on Calendar`;
- row action: `Finish adding to Calendar` / `Concluir adição ao Calendário`;
- selecting it opens the same Review from server readback and returns focus to that History row on
  close;
- the normal Activity detail remains factual and does not imply a workout association while absent.

Duplicate and concurrency behavior:

- exact source uploaded while Saved/Unassigned opens the existing Activity Review with
  `This activity was already uploaded. Continue where you left off.`;
- exact source uploaded after Confirm opens an Added state with its Calendar date and links; Confirm
  is not offered;
- duplicate Confirm returns the existing successful Calendar association/materialization and the
  same Activity/workout identities, not an error or a second success object;
- if another session changes target occupancy after Review opened, Confirm returns a stale state,
  refreshes placement truth and disables mutation until the runner reviews the new Rest/occupied
  state;
- an expired review authorization with an accessible Activity reloads a fresh Review from that
  Activity. If identity/session is expired, ask the runner to sign in and resume from History. Do
  not ask for re-upload unless authoritative readback proves that no Activity/source was retained;
- if the retained source was removed but normalized Activity facts remain, Review truthfully marks
  the source unavailable. It may Confirm only when Backend declares the retained revision eligible;
  the UI cannot infer eligibility.

### 8. Confirm and success

Footer order is stable:

- secondary `Close`;
- primary `Confirm and add to Calendar` for a Rest target, or `Confirm association` for an eligible
  occupied target.

Confirm is enabled only when Review is current, the title is valid, the FIT date is an eligible past
date and any occupied association is explicitly selected. During Confirm, both footer actions are
disabled, the primary button uses its canonical loading state, and a polite announcement says
`Adding activity to Calendar…`. Upload/parse facts remain visible and do not reset.

Success is a persistent inline success state in the same overlay because the current toast contract
has no action owner. It announces `Activity added to {date}` or `Activity associated with {workout}
on {date}` and provides:

- primary `Back to Calendar`, which refreshes canonical Calendar truth, moves the current Calendar
  cursor to the FIT month/week when necessary, closes the overlay and focuses the affected day or
  its workout link;
- secondary `View activity history`, linking to `/progress?tab=history`;
- Close, which returns to the refreshed Calendar trigger/day fallback.

A short canonical success toast may repeat only the title after close; it must not be the sole
confirmation. If Calendar refresh fails after a successful server receipt, keep the success receipt
visible and offer `Refresh Calendar`; never re-enable Confirm.

### 9. Responsive, theme, localization and accessibility acceptance

| Matrix                             | Required observation                                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop 1470 × 801, month and week | Fine-pointer hover reveals `+`; Tab reveals it without hover; occupied action cluster does not overlap; menu flips within viewport; workflow header/footer remain visible while facts scroll.                                                               |
| Mobile 375 × 812                   | Every eligible past row has a visible 44 px `+`; two-control occupied rows fit without horizontal scroll; full-height Sheet respects `100dvh` and bottom safe area; footer actions remain reachable above the keyboard/safe area.                           |
| Keyboard                           | Logical order is day/workout link, `+`, existing More action; menu arrow navigation and Escape work; Dialog/Sheet traps focus; picker cancel, close, stale refresh and success navigation return focus predictably.                                         |
| Touch                              | No hover prerequisite; tapping `+` cannot activate the underlying day; menu and Sheet do not block page recovery after close; controls meet the existing 44 px Product touch treatment.                                                                     |
| Dark and Light                     | All surfaces, text, status, focus, warning, success and destructive states resolve through existing semantic tokens; no raw color or alpha recipe; state meaning remains in text/icon as well as color.                                                     |
| English and Portuguese             | Every visible/accessible string is catalog-owned; date/number/unit formatting uses current locale helpers; Portuguese expansion wraps without truncating title, notice, menu or footer controls; no English fallback in `aria-label` or live announcements. |
| Zoom/reflow                        | 200% zoom and narrow height preserve one scroll owner, visible focus and reachable Confirm/Close; no two-dimensional scrolling.                                                                                                                             |
| Reduced motion                     | No celebratory animation or progress simulation; menu/Dialog/Sheet transitions may reduce to current DS fallback; state changes are announced rather than conveyed by motion.                                                                               |

Core localized copy pairings to lock during implementation:

| English                     | Portuguese                          |
| --------------------------- | ----------------------------------- |
| Add activity                | Adicionar atividade                 |
| Choose FIT or ZIP           | Escolher FIT ou ZIP                 |
| Saved · Not on Calendar     | Salva · Fora do Calendário          |
| Finish adding to Calendar   | Concluir adição ao Calendário       |
| Confirm and add to Calendar | Confirmar e adicionar ao Calendário |
| Confirm association         | Confirmar associação                |
| Back to Calendar            | Voltar ao Calendário                |
| View activity history       | Ver histórico de atividades         |

### 10. Exact later implementation boundary

**ARCHITECT next** must define one public Review/Confirm command contract and map it to the current
unplanned Activity ingest, exact-source deduplication, runner/date occupancy, existing Activity match,
standalone Calendar write and History readback owners. It must resolve the source-backed public gaps
without a parallel upload route/table/writer: unmatched upload currently returns no Review payload;
History omits `workoutName`, laps/steps and resume capability; and current Result feedback is
planned-workout-shaped.

**BACKEND later** owns Activity-first retention, public resumable Review readback, current/stale
placement decision, idempotency, explicit occupied association, atomic Rest materialization,
owner/RLS enforcement and truthful error/commit-status responses.

**FRONTEND Product later** owns only:

- extending `calendar-projection.ts` with the server-admitted past Activity capability without
  changing today/future Add Workout;
- composing the `+`/menu/action cluster in `Calendar.tsx` around existing day anatomy;
- one Product Activity workflow using existing Dialog/Sheet/Button/Dropdown/field/state/disclosure/
  row/toast owners;
- adding Saved/Unassigned resume to the existing Activity History row/detail owner;
- locale-catalog additions and canonical route refresh/focus behavior.

`WorkoutActivityFileDialog` and `WorkoutFeedbackPanel` remain the planned-workout Feedback owner.
Frontend may extract only genuinely shared file-selection/request presentation if doing so deletes
duplication and preserves both semantic modes; it must not add an `unplanned` boolean to make the
plan-comparison component own a different lifecycle.

**Frontend Design System:** no separate implementation slice. Escalate only if implementation proves
a missing behavior in the shared primitive itself across at least two consumers. The mobile 44 px
icon target, workflow Dialog/Sheet, state surface, disclosure, loading button and focus return are
already demonstrated existing contracts.

**Stop conditions:** return to Product before implementation only if the accepted Rest-versus-
occupied outcomes change, multiple Calendar workouts per date are proposed, future-date Activity
admission is requested, missing FIT date is allowed to fall back to clicked date, or route/map scope
is pulled from HITO-248. A missing Backend readback or command seam is Architecture/Backend work on
this unchanged Task, not a new Product decision.

### Designer receipt

- **Outcome:** one implementation-ready Calendar → Activity upload → factual resumable Review →
  explicit Confirm interaction contract, including Rest, occupied, mismatch, missingness,
  duplicate, stale, expired, success, responsive, theme and locale states.
- **Evidence:** current Calendar eligibility/action owners, Hito DS primitives, planned FIT workflow,
  unmatched upload behavior, Activity History public projection and runner/date occupancy were read
  from the current checkout. No browser/runtime/provider/database mutation was used.
- **Preserved boundary:** Activity and Calendar truth remain Backend-owned; today/future authoring,
  HITO-248 maps, HITO-281 compatibility, runtime source, Design System source and unrelated dirty
  files are unchanged.
- **Decision:** no genuine shared Design System primitive gap and no unresolved Product interaction
  decision remain. The next admitted owner is ARCHITECT on the unchanged HITO-255.

## Delivery Plan

1. **DESIGNER** — complete the interaction specification before architecture or implementation:
   past-day affordance, desktop hover/focus and mobile visibility, dropdown, file selection,
   parsing/loading/error states, factual Review, date/occupied-workout conflicts, missing FIT facts,
   cancel/resume, duplicate handling, Confirm success and focus return. Reuse existing Calendar and
   Design System patterns; do not invent backend behavior.
2. **ARCHITECT** — map the existing unplanned Activity, standalone Calendar materialization,
   Review/Confirm, past Rest transition and public readback owners; define the smallest lossless
   command and migration sequence with no parallel truth.
3. **BACKEND** — implement the owner-bound upload/read/resume/review/confirm contract, atomic past
   Rest-to-completed-workout materialization, deduplication, RLS and cleanup by reusing existing
   owners.
4. **FRONTEND** — add the past-day `+ → Add activity` entry, factual Review, missingness, conflict
   handling, resume/cancel/confirm controls and localized accessible presentation using the Design
   System. Extend the existing Calendar day-action/menu owner; do not add a second floating action,
   file picker owner or one-off icon button. Keep today's/future Rest-day authoring unchanged.
5. **QA** — independently prove three distinct historical FIT imports plus past Rest and occupied,
   mismatch, duplicate, cancel/resume, reload/new-tab, RLS, History/Progress/Profile, mobile/desktop,
   English/Portuguese, console/HTTP and cleanup behavior. No paid provider is required.

Each completed owner hands the unchanged HITO-255 directly to the next existing sidebar role. A
reproduced defect returns directly to the first incorrect owner on the same Task. Product resumes
only for a changed product decision, destructive/hosted authority or final acceptance.

## What Not To Touch

- HITO-281 production-data compatibility work or its active Backend runtime.
- Provider sync, Strava/HealthKit/Garmin Connect APIs or paid AI/provider calls.
- Route-map visualization, public sharing or location naming owned by HITO-248.
- Existing runner history, source identities, confirmed Calendar workouts or formula meanings.
- Legacy deletion unless HITO-281 independently proves it safe and authorizes a separate removal.

## Acceptance

- Three real historical FIT/ZIP files can become three distinct completed Calendar workouts through
  the ordinary user flow even when the Calendar initially has no workouts.
- A FIT workout name is preserved when present; missing name/metrics/laps remain truthful and do not
  cause invented data.
- Past Rest and occupied-date behavior is explicit, atomic and reversible before Confirm.
- Cancel/close preserves the paid/free ingestion result and allows resume without another upload.
- Duplicate upload/confirm creates no duplicate Activity, source, match, result or Calendar workout.
- Calendar, History, Progress and Runner Fitness Profile remain coherent after reload and new tab.
- Owner isolation, RLS, failed-input atomicity and cleanup pass independently.
- HITO-280 cannot reach terminal first-user launch acceptance until HITO-255 is terminally accepted
  and released.

## Architecture Decision — 2026-08-25

### Verdict And First Incorrect Boundary

The canonical path is:

`existing unmatched FIT upload -> retained Activity/source/revision -> resumable Activity Review ->
existing Calendar transaction owner -> exact Activity match -> Result/Evidence projections`.

No new Activity, upload, Calendar, result or persistence owner is required. The first incorrect
boundary is the current unmatched-upload response: `ingestGarminWorkoutResult` retains the canonical
graph and exact-source deduplication, but `/api/workout-result/upload` omits its Activity receipt when
there is no `plannedWorkoutId`. The second missing public seam is a safe Activity-owned Review
readback. The current History projection exposes summary facts and an optional workout match, but
not the retained FIT name, normalized laps/steps, placement eligibility or resume action.

One model gap is real rather than presentational: the persisted WorkoutDocument/`workout_type`
vocabulary has no neutral completed recorded run. Mapping an unplanned run to `easy`,
`steady_or_easy` or `quality` would invent prescription meaning. The accepted Product contract
therefore admits one additive canonical value, `recorded_run`, with source identity
`recorded_activity`, family/icon key `recorded`, non-executable metric mode and one neutral
non-prescriptive document section. Actual duration, distance, laps, steps and other facts remain in
Result/Evidence; they are not copied into WorkoutDocument as planned targets. The existing Activity
icon is reused; this adds no Design System primitive.

### Truth Owners And Dependency Direction

| Fact or operation                                                         | Sole owner                                                                  | HITO-255 rule                                                                                                                            |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Raw FIT/ZIP, exact checksum, original/extracted filename                  | `workout_result_assets` plus current Activity source revision               | Immutable file-import provenance; never enters a client DTO as a storage path or parser payload                                          |
| Activity identity, local date, normalized facts, FIT name, laps and steps | current `runner_activities` / `runner_activity_revisions` / source revision | Activity is created before Review; current revision and source revision must agree                                                       |
| Saved/Unassigned state                                                    | Activity read model                                                         | Derived only from an accepted current Activity with no non-null Activity match; no state column or review table                          |
| Review and placement decision                                             | server Activity public contract plus current Calendar occupancy fingerprint | Rebuilt from persisted truth on every open; a signed token is authority for one current review only                                      |
| Calendar workout and occupied-date association                            | existing `apply_calendar_workout_mutation` transaction owner                | Extend this owner with one `confirm_activity` branch; no second RPC writer                                                               |
| Activity-to-workout identity                                              | `runner_activity_planned_workout_matches`                                   | Written in the same Calendar transaction; one Activity and one workout have at most one current match                                    |
| Completion and factual results                                            | Result/Evidence public contract                                             | Match plus current accepted Activity/source and parsed asset proves completion; metrics/comparison are versioned rebuildable projections |

Allowed direction is `upload adapter -> Activity -> Review -> Calendar confirmation ->
Result/Evidence -> History/Progress/Profile`. Calendar does not import parser/private source DTOs;
Frontend does not import persistence types; Result/Evidence never creates a Calendar row. A source
plan or `plan_cycle_id` is absent from the new row and cannot become a permission check.

### Public Review Contract

The existing upload route remains the only file-upload route. When called without
`plannedWorkoutId`, success returns `UnplannedActivityReviewV1` instead of planned-workout feedback.
The same safe DTO is returned by one authenticated Activity hydration action for History resume.
Its exact public shape is:

- `version`, `activityId`, `activityRevisionId`, `sourceRevisionId`, `reviewChecksum` and a short
  signed `reviewToken`; no raw provider response, source fingerprint, Storage path or credential;
- `source`: original filename, extracted FIT filename when applicable, raw-file availability and
  immutable `file_import` provenance, plus the response-scoped provider-neutral ingest disposition
  `retained | reused_exact_source`; ordinary History hydration returns `retained`, while only the
  exact-source upload response returns `reused_exact_source` for the accepted duplicate copy;
- `facts`: sport, FIT local date, start time, FIT workout name, duration with timer/elapsed basis,
  distance and optional heart-rate, cadence, power, ascent/descent and calories; every optional fact
  is an explicit `{ state: available | unavailable, value }`, never zero-filled;
- normalized `laps` and `steps` in source order using the persisted provider-neutral shapes already
  produced by the parser; absence is an explicit empty/unavailable state, not client reconstruction;
- `calendarState`: `saved_unassigned` or `confirmed`, with the confirmed workout identity when
  present;
- `placement`: exactly one of `past_rest_available`, `occupied_association_available`,
  `occupied_ineligible`, `today_or_future`, `date_missing`, `already_confirmed` or `stale`; an
  occupied variant includes only the safe existing-workout identity, while the full occupancy
  fingerprint remains server-only in the sealed authority and immutable audit;
- `capabilities`: `canConfirmRest`, `canConfirmAssociation`, `canEditFallbackTitle` and
  `canResume`, derived by the server.

The Review checksum covers owner-scoped Activity/revision/source/asset identities, current source
state, FIT local date, normalized factual payload hash, chosen title, placement kind and exact target
occupancy fingerprint. `reviewToken` is short-lived and self-contained only for verification; it is
not persistence. Reload or expiry obtains a fresh token from the same Activity. A title edit is
submitted to the Review preparation action and returns a newly sealed Review; it is not durable
until Confirm. Closing before Confirm therefore restores the immutable FIT name or neutral `Run`
fallback, never loses Activity facts and never requires re-upload.

Foreign/not-found/removed/stale outcomes are explicit. An owner cannot hydrate another user's
Activity. A missing local date, non-running activity, today/future date, non-current revision,
removed source that cannot support current projection, protected occupied workout or Activity
already matched elsewhere disables Confirm while retaining factual History where allowed.

### One Confirm Command And Transaction

`confirmUnplannedActivityReview` accepts only `activityId`, sealed Review values and one explicit
intent: `materialize_on_rest` or `associate_existing`. It reparses no file and trusts no client
Calendar row, metrics, laps or steps.

The implementation extends the existing `apply_calendar_workout_mutation` function and
`applyAtomicCalendarWorkoutMutation` wrapper with mutation kind `confirm_activity`; it does not add
another Calendar RPC. Under the existing per-user advisory lock, this branch re-reads the exact
owner/current Activity, revision, source revision, parsed asset, FIT local date, current Activity
match and target-date row, then verifies the signed Review checksum.

- **Past Rest:** an empty date or one unprotected stored Rest is the same Product state. The
  transaction preserves any stored-Rest fingerprint in the mutation audit, removes that Rest row
  only when it has no log/evidence dependency, inserts one independent `recorded_run` Calendar row
  with `origin_kind=file_import` and no plan/source-workout authority, links the retained asset and
  inserts the exact Activity match.
- **Occupied:** the transaction locks the exact reviewed non-Rest workout, preserves its
  WorkoutDocument/origin/title/date, and links the Activity only when no different Activity or
  protected incompatible evidence owns it. There is no insert, overwrite, Replace or silent match.
- **Idempotency:** a repeated Confirm for the same Activity and workout returns the original success
  identities. A different target returns conflict. A changed occupancy/current revision returns
  `stale_review` without mutation. Lost HTTP acknowledgement is recovered by Activity readback.

The transaction makes Calendar row/Rest displacement, asset association, Activity match and audit
event one atomic commit. It does not write RPE, notes or invented metrics. Completion readback is
corrected to accept this current accepted Activity/source/match/parsed-asset chain without requiring
a fabricated planned-versus-actual comparison. Result/Evidence then idempotently derives actual
metrics. For an occupied authored workout it may additionally produce the existing deterministic
comparison; for `recorded_run`, comparison remains explicitly not applicable and the marker may stay
`evidence_attached`. A projection failure returns `updating` and retries without detaching the
already confirmed canonical match.

### Reuse, Migration And Removal Ledger

| Current seam                                                                               | Decision and deletion gate                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/workout-result/upload` and `ingestGarminWorkoutResult`                               | KEEP; expose the already-returned Activity receipt for unmatched success. No second upload route.                                                                                                                                   |
| Exact source fingerprint and unplanned parsed asset                                        | KEEP; duplicate upload discards only the candidate object and hydrates the retained Review.                                                                                                                                         |
| Activity History route/read model/product projection                                       | EXTEND with Saved/Unassigned, resume capability and safe review facts; no client lookup joins.                                                                                                                                      |
| FIT parser normalized name/laps/steps in revision summary                                  | REUSE through strict provider-neutral public parsers; raw parser/provider fields remain private.                                                                                                                                    |
| `apply_calendar_workout_mutation`                                                          | EXTEND as the only Calendar writer; old add/move/clear behavior and today/future authoring remain unchanged.                                                                                                                        |
| `finalize_runner_activity_planned_workout_projection` and comparison-first completion rule | CONSOLIDATE after the new atomic match path. Retain planned-workout comparison behavior; remove the assumption that every factual completion requires comparison once direct callers and proofs use the canonical completion chain. |
| Planned-workout-shaped unmatched upload response                                           | REMOVE after upload and History consumers use `UnplannedActivityReviewV1`; zero direct consumers required.                                                                                                                          |

The additive migration adds the `recorded_run` enum/domain vocabulary, the new Calendar mutation
branch and the completion-chain rule. It edits no old migration and backfills no existing row.
Rollback disables new entry/Confirm while preserving and reading any created `recorded_run` rows;
the enum value and runner history are not destructively removed. HITO-281 parity, generated types,
RLS/grants and migration evidence are mandatory before release.

### Serial Owner Slices And Proof

1. **BACKEND:** implement the strict Review DTO/parser, unmatched upload receipt, owner-bound hydrate,
   additive vocabulary/migration, atomic Confirm branch, History resume and idempotent Result/Evidence
   reconciliation. Focused proof covers empty and stored Rest, occupied eligible/ineligible, date
   mismatch/missing/future, name/fallback, laps/steps/missing facts, close/reload, duplicate
   upload/Confirm, stale occupancy, owner/RLS, failed transaction and derived-projection retry.
2. **FRONTEND Product:** only after the server contract is lossless, compose the accepted Calendar
   `+`, existing upload route, Review/Confirm and History resume using existing Design System owners.
   No persisted client draft, parser logic or today/future authoring change.
3. **QA:** independently use three distinct historical FIT/ZIP files and prove Rest and occupied
   journeys, reload/new-tab, exact-source idempotency, facts/structure/missingness, English/
   Portuguese, desktop/mobile/keyboard, RLS, Calendar/History/Progress/Profile coherence and clean
   fixture/runtime shutdown. A reproduced defect returns to the first incorrect existing owner.
4. **BACKEND release owner:** only after QA acceptance, run the already-authorized release sweep with
   exact candidate staging, HITO-281 migration/type proof, build/validators, main push, Git-backed
   Vercel READY/HTTP 200 and clean repository/runtime invariants. No paid provider or destructive
   hosted-data action is admitted.

No Product decision remains. Stop only if implementation requires multiple Calendar workouts per
date, a future/missing-date fallback, non-running materialization policy, destructive history
rewrite, map/location scope, a second persistence owner or a different neutral recorded-workout
meaning. HITO-280 remains unchanged and returns to QA only after HITO-255 is released.

### Architecture Receipt

- **Evidence:** current unmatched ingestion, exact-source RPC, Activity revision/History contracts,
  Calendar mutation RPC, Activity-match/finalization RPC and direct Frontend callers were inspected
  from `main@44c3e0b`.
- **Decision:** one Activity-owned resumable Review and one new branch in the existing Calendar
  transaction owner; no new upload route, review table, Calendar writer or compatibility path.
- **Changed boundary:** this canonical record only. No runtime, migration, fixture, database,
  provider, Git or HITO-280 mutation was performed.
- **Omitted:** implementation, generated-type parity, local/hosted database proof, browser QA,
  release and production acceptance remain with the named later owners.

### Backend Implementation Receipt

- **Outcome:** the accepted Activity-owned Review/Confirm contract is implemented through the one
  existing upload route, the existing Activity persistence/read-model owners and the existing
  `apply_calendar_workout_mutation` transaction. No second Calendar, Activity, importer, review or
  client-state writer was introduced.
- **Public boundary:** unmatched upload and authenticated History hydration return strict
  `UnplannedActivityReviewV1` facts with explicit missingness, normalized FIT name/laps/steps,
  Saved/Unassigned or confirmed placement and resume capability. Storage paths, source fingerprints,
  parser payloads and provider-private fields remain server-private.
- **Persistence boundary:** two forward-only migrations add neutral persisted `recorded_run`
  vocabulary and the `confirm_activity` branch. Empty or eligible stored Rest materializes one
  plan-independent file-import Calendar row; an eligible occupied authored workout is preserved and
  receives only the reviewed Activity association. Stale, foreign, future/missing-date, protected or
  incompatible occupancy fails atomically. Duplicate Confirm returns the original identities.
- **Result/Evidence boundary:** the accepted current Activity/source/match/parsed-asset chain is
  sufficient for idempotent completion projection. Authored workouts retain deterministic
  comparison where available; `recorded_run` keeps comparison explicitly not applicable. Projection
  retry does not detach a confirmed canonical match.
- **Proof:** a clean pinned local Supabase reset applied all 57 repository migrations; schema lint,
  generated-type semantic parity, the focused Runner Activity foundation/read-model/language and AI
  authoring validators, scoped ESLint, Prettier, `git diff --check` and the full production build
  passed. Disposable owners, Storage and leases returned to zero and Hito Supabase stopped
  project-qualified. The working index stayed empty.
- **Historical compatibility:** the change is additive and does not rewrite existing rows, user IDs,
  ownership, provenance, formula versions or missingness. The new persisted value remains readable
  if the feature is disabled. Hosted schema/data were not mutated; HITO-281 parity remains a release
  gate.
- **Named baseline diagnostics:** full TypeScript output remains the admitted checkout-wide baseline;
  no diagnostic is owned by the new review/actions/confirmation seam. The aggregate local Backend
  validator reaches 18/21 before an unrelated retired saved-plan fixture expects
  `reviewed.savedPlanId`; direct HITO-255 validators pass. Linked deployment parity correctly reports
  the two unapplied migrations because hosted mutation is not authorized in this implementation
  slice.
- **Omitted:** Frontend composition, three-file browser acceptance, independent QA, hosted migration
  application, Git lifecycle, deployment and release were not performed. No provider was called and
  HITO-280 was not changed.
- **Next owner:** FRONTEND composes the existing Calendar upload, factual Review/Confirm and Activity
  History resume surfaces against this exact server contract, then returns the unchanged Task to
  independent QA.

### QA Fixture Capability Fix-forward Receipt

- **Discriminator closed:** independent QA proved the one available historical FIT journey but
  could not run the required three-file matrix. The existing `adaptive_engine_ui_replay_v1`
  lifecycle now has one local-only `unplanned_activity_review` checkpoint; no new command family,
  Auth seam, writer, migration or provider path was added.
- **Deterministic setup:** one retained canonical import and signed WorkoutCommand materialization
  prepare a past empty date, stored Rest, eligible occupied workout and completed/protected occupied
  workout. Five distinct mode-`0600`, parser-valid synthetic historical FIT inputs cover empty,
  same-date stale competition, stored Rest, eligible association and protected rejection. They
  contain no credentials, provider content or personal data.
- **Proof:** `seed` and independent `status` reproduced the same exact dates and owner identities,
  five distinct SHA-256 values, 3 own / 0 foreign Calendar rows through public RLS and zero provider
  dispatch. The focused Runner Activity foundation contract retained stale, foreign, transaction,
  idempotency and derived-projection retry proof. Version-confirmed `reset` returned all 26 owner
  counts, Storage and leases to zero, removed the generated FIT artifacts and retained the protected
  technical Auth identity.
- **Diagnostics:** the lifecycle validator reports four checkpoint values and zero alternate hosted
  bootstrap paths; scoped ESLint, Prettier and `git diff --check` pass. Full TypeScript output remains
  the admitted 229-line checkout baseline with no task-owned diagnostic.
- **Omitted:** Backend did not perform browser acceptance, call a provider, mutate hosted state or
  start Git/release work. Independent QA must replay the expanded historical Activity matrix.
