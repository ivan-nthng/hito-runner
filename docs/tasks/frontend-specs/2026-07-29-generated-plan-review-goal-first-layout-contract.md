# Generated Plan Review Goal-First Layout Contract

## Status

current_product_contract

## Owner

designer

## Last Updated

2026-07-30

## Plan File

None. This is a bounded correction to the ready-review composition. The accepted loading,
unavailable, refresh, and confirm lifecycle remains owned by
`2026-07-23-generated-plan-preview-loading-and-review-experience.md`.

## Task

Replace the ready generated-plan review Dialog's two large metadata groups with one open,
goal-first header while retaining the reviewed calendar, compact day summary, refresh, explicit
confirm, and truthful unsaved boundary.

## Stage

DESIGNER decision-ready layout specification.

## Root Cause

### Visible problem

The runner reaches the plan calendar only after scanning two bordered `hito-row-group` metadata
objects. Goal, start, duration, schedule preferences, metric policy, and technical readback compete
at nearly equal weight, so the review feels like an internal fact sheet rather than a plan decision.

### Demonstrated cause

`SelectedTenKPlanPreviewDialog.tsx` renders:

1. a nine-fact schedule/readback grid inside `hito-row-group`;
2. a second `PlanGoalIntentReadback` group containing goal facts and technical pace context;
3. a third status-like pill beside the calendar heading.

The canonical reviewed draft already retains all of this data independently of those render
branches. The problem is local preview composition, not missing Hito DS primitives or missing
backend truth.

### Canonical owner

The ready-review composition inside `SelectedTenKPlanPreviewDialog.tsx`.

Fixture or provider output that does not match the requested goal remains a separate Backend
correctness issue. This layout must not rename, suppress, or cosmetically reconcile incongruent
workout content.

## Source And Data Mapping

| Visible role | Reviewed source | Rule |
| --- | --- | --- |
| Goal | `draft.normalizedInputSummary.planGoalIntent.distance.label` | Use backend-normalized reviewed goal. Do not infer goal from workout titles. |
| Start date | `draft.canonicalPlan.start_date` | Primary plan fact. Format with existing `formatDate`. |
| Duration | `rowsByWeek.length` from signed `calendarRows` | Secondary. Render as weeks only; workout count is not needed in the header. |
| End date | final `draft.canonicalPlan.planned_workouts` date, falling back to canonical start | Secondary and aligned with persistence metadata. |
| Race date | `planGoalIntent.targetDate` | Show only when supplied. |
| Finish time | `planGoalIntent.targetFinishTime.label` | Show only when supplied. |
| Unsaved state | reviewed draft remains non-persisted before explicit confirm | Keep as quiet footer copy, not a status pill. |

The form-derived `goalLabel` prop remains valid for loading and unavailable/error copy before a
reviewed draft exists. It is not the ready-review goal authority.

## Goal-First Ready-Review Anatomy

### Content order

1. Stable Dialog header.
2. Open goal/start summary in the header, without a card or bordered fact grid.
3. Calendar heading and short interaction instruction.
4. Existing calendar and legend.
5. Compact workout summary opened from a day.
6. Stable Dialog footer with unsaved copy, Refresh, and Create.

### Header hierarchy

Use one open header composition inside the existing `hito-product-dialog-header`:

- eyebrow: `Generated plan`, using `hito-micro-label`;
- title: `{reviewed goal} plan`, using `DialogTitle` plus `hito-modal-title`;
- primary companion fact: `Starts {formatted date}`, using `hito-section-title`;
- secondary range line: `{N} weeks · Ends {formatted date}`, using `hito-body-small`;
- optional goal modifiers: supplied race date and/or finish time, using `hito-body-small`;
- description: one short `hito-body` sentence explaining that the calendar and workout overview
  are being reviewed before creation.

Goal and start date are the only dominant facts. Duration, end date, race date, and finish time
must not become equal-sized metric tiles.

Do not add a header card, gradient panel, metric grid, badge row, or new summary primitive.

### Optional race date and finish time

- If neither is supplied, omit the optional line entirely. Do not render `Not supplied`, an empty
  placeholder, or an unavailable badge.
- If only race date is supplied, show `Race day {date}`.
- If only finish time is supplied, show `Target finish {time}`.
- If both are supplied, show both in one wrapping line separated by a middle dot.
- If race date equals the canonical plan end date, avoid repeating the date: the secondary line
  becomes `{N} weeks · Ends on race day, {date}` and the optional line contains only finish time.
- If race date differs from canonical end date, show both dates honestly. Do not resolve the
  discrepancy in presentation.
- Do not move derived outcome pace, goal pace, assumptions, or metric-policy explanations into the
  header. They are not executable workout targets and are outside this compact review hierarchy.

### Calendar heading

Use an open section header:

- title: `Plan calendar`, using `hito-section-title` or the existing compact section-heading role;
- support copy: `Select a day to view the workout overview.`, using `hito-body-small`;
- no `{N} runs` pill;
- no card or extra divider beyond the existing Dialog header/body separation.

The existing calendar cells, workout identity legend, Popover behavior, and focus behavior remain
unchanged. The ready-preview Popover is intentionally not a workout editor or full executable
readback.

### Day Summary Disclosure

For a non-rest day, the Popover shows only:

- formatted date;
- runner-facing workout type/title;
- total duration and/or distance when available;
- block count; and
- an optional non-interactive 4px structure strip.

For a rest day, show only its date and `Rest day`.

Do not show pace, heart-rate ranges, individual steps, Repeat children, cues, notes, provenance,
source labels, or editing controls in the generated-plan preview. These details are intentionally
available only from the saved workout detail after explicit Create/confirm. The summary must never
claim to be an executable prescription or hide a backend goal/workout mismatch.

### Footer

- Remove the `Ready to review` success pill.
- Replace the `Not saved` muted pill with quiet `hito-caption` copy:
  `Not saved until you create the plan.`
- Keep secondary `Refresh preview`.
- Keep primary `Create plan`.
- Keep existing loading, disabled, token/checksum gating, and confirm-pending behavior.
- On narrow layouts, the unsaved note occupies its own row and the actions keep the existing Hito
  mobile Dialog action order. Do not compress the note between two buttons.

## Item 3 Tag Decision

Current source contains three pill-shaped items in the ready review:

1. `Ready to review`: a static success pill shown by the reviewed-draft render branch. It is not a
   backend lifecycle value.
2. `Not saved`: a static muted pill expressing the real pre-confirm persistence boundary.
3. `{nonRestRows.length} runs`: a signal pill beside the calendar title. It is a count, not a
   status.

The captured Item 3 most plausibly refers to the `{N} runs` pill because it belongs to the metadata
being simplified. This contract removes that pill. It also removes the redundant readiness pill
and preserves the only necessary lifecycle truth as plain unsaved footer copy. No status meaning is
lost and no new tag replaces it.

## Removed From This Dialog

Remove the rendering of:

- Goal fact inside the current schedule fact grid;
- Plan length fact card;
- Weekly ceiling;
- Workout guidance / metric truth;
- Start date fact card;
- Fixed rest;
- Long-run preference or plan-selected long-run day;
- Plan weekdays;
- Plan approach/load context;
- the full `PlanGoalIntentReadback` group;
- distance duplication;
- `Not supplied` race/finish placeholders;
- goal or derived pace readback;
- assumptions/helper text from the goal-readback group;
- `Ready to review` pill;
- `{N} runs` pill;
- pill presentation for `Not saved`.

This is rendering deletion only. Do not delete or reshape the underlying draft fields.

## Truth Retained Elsewhere

| Truth | Still retained by |
| --- | --- |
| Schedule constraints and authored rhythm | `normalizedInputSummary`, canonical plan/preferences metadata, signed review, persistence, saved schedule/editor flows |
| Distance, race date, finish time, outcome pace, assumptions | `planGoalIntent`, signed review payload, persistence metadata, export/readback owners |
| Metric policy and workout target truth | canonical workout documents, validation/review seams, saved workout detail and export |
| Exact plan rows and workout structure | calendar rows, workout documents, canonical plan, saved workout detail, export |
| Review integrity | review token/checksum and confirm action |
| Non-persisted preview state | Dialog footer copy and explicit Create boundary |

The layout must not change the canonical plan, signed review payload, confirm request, persisted
metadata, export, plan editor, or saved workout detail.

## Desktop Layout

- Keep the existing review-width, viewport-bounded, scroll-fill Dialog.
- Header uses an open two-column relationship only when space allows:
  - goal/title block takes the flexible column;
  - start-date block remains content-sized and aligned to the title baseline area.
- Duration/end and optional goal modifiers stay below the primary facts and may span the header.
- Header-to-calendar spacing uses the existing Dialog body padding plus one normal section gap.
- Calendar remains the first body object. Do not introduce a replacement summary surface.
- Long custom goal labels wrap within the title column; they never push the start date outside the
  Dialog.

## Exact 375px Layout

- Stack goal, start date, range, and optional goal modifiers in that order.
- Keep the eyebrow quiet; the goal title and start date remain visually distinct.
- Use normal wrapping, not horizontal scrolling, truncation, or a two-column fact grid.
- Keep body padding and calendar geometry owned by the existing product Dialog and selected-plan
  calendar classes.
- Keep the footer viewport-reachable. Unsaved copy sits above the action row; Create remains the
  final and strongest action.
- The selected-day summary remains viewport-contained through the existing Popover contract.

## Other Preview States

This correction changes only `ready_for_review`, plus the same visible review composition while
refreshing or confirming.

Do not change:

- initial loading;
- completion transition;
- unavailable/error copy or content-fit anatomy;
- refresh notice;
- confirm-pending notice;
- blocked-confirm behavior;
- focus return;
- close/dismiss behavior;
- reduced-motion behavior.

## Hito DS Reuse

Reuse:

- existing `Dialog`, `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter`;
- existing `hito-product-dialog-*` review and scroll-fill anatomy;
- `hito-micro-label`, `hito-modal-title`, `hito-section-title`, `hito-body`,
  `hito-body-small`, and `hito-caption`;
- existing hairline divider, spacing, color, and responsive tokens;
- existing Secondary and Primary buttons;
- existing `HitoCalendarDayCell`, calendar legend, Popover, and compact generated-plan workout summary;
- existing `formatDate` helper.

No Hito DS gap is demonstrated. Do not create a metadata-grid component, plan-summary card,
dialog variant, typography role, or route-local visual recipe.

## Frontend Implementation Boundary

One Product Frontend slice may:

- simplify the ready-review header and footer;
- remove the two obsolete preview-only metadata render branches and their now-unused local
  formatting helpers/imports;
- remove the calendar run-count pill;
- keep the selected-day preview summary constrained to its approved information boundary;
- preserve all reviewed data and existing state/action behavior;
- keep the already-large Dialog owner focused by extracting only a small presentational
  goal-summary helper if the existing file-size gate requires it.

The slice stops if it discovers that the reviewed draft cannot truthfully provide canonical start
or end dates, or if a displayed goal/workout mismatch requires fixture/provider correction.

## Acceptance Criteria

1. Goal and start date are the dominant ready-review information.
2. Duration and end date are visible but secondary.
3. Optional race date and finish time appear only when supplied.
4. The schedule fact grid and Goal readback card are absent.
5. Weekly ceiling, fixed rest, long-run day, plan weekdays, plan approach, technical goal/metric
   guidance, assumptions, and derived pace are absent from this Dialog.
6. `Ready to review` and `{N} runs` pills are absent.
7. Unsaved truth remains as quiet footer copy.
8. Calendar, legend, compact day summary disclosure, Refresh, Create, and review/confirm gating work as
   before.
9. No canonical draft, signed review, persistence, export, editor, or saved-workout data is removed.
10. Desktop and exact 375px show no header overflow, clipped optional metadata, unreachable footer,
    or new card/border layer.
11. Light and dark themes use only existing Hito DS tokens and typography.
12. Any goal/workout incongruence remains visible and is reported to Backend rather than hidden by
    frontend copy or layout.

## Required Frontend Validation

- source discriminator proving both old metadata groups and the run-count/readiness pills no longer
  render in ready review;
- ready review with no optional race date or finish time;
- ready review with race date only, finish time only, and both;
- race date equal to and different from canonical end date;
- long custom goal label;
- refresh and confirm-pending while review content remains visible;
- desktop and exact 375px in light and dark themes;
- keyboard traversal, selected-day summary disclosure, close/focus return, no overflow, and footer reach;
- targeted lint, production build, build integrity, runtime health, and scoped diff hygiene;
- independent QA subagent evidence integrated by the Product Frontend owner.

Implementation DoD remains open until that Product Frontend validation inventory passes. Global QA
Acceptance remains a separate release-level gate.
