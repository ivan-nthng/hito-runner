# Hito Running First Flow Spec

## Status

Draft

## Owner

Designer Agent

## Last Updated

2026-05-05

## Source of Truth

- `docs/tasks/product-briefs/2026-05-05-hito-running-mvp-brief.md`
- `docs/tasks/product-briefs/2026-05-05-hito-running-ui-absorption-scope.md`
- Imported UI from `adaptive-run-coach` is a visual baseline only.
- If imported UI patterns conflict with the MVP brief or absorption scope, the product documents win.

## Flow Summary

Phase 1 is one bounded runner loop:

1. New runner has no profile.
2. Runner completes onboarding in two steps: goal capture and baseline capture.
3. Runner lands on the weekly plan as the main planning surface.
4. Runner opens today's workout from the weekly plan.
5. Runner logs the result as completed, partial, or skipped.
6. Product updates the visible weekly status as `on track`, `partially off track`, or `needs reset`.
7. Runner returns to the weekly plan with a clear understanding of what changed and what to do next.

This flow must feel fast, quiet, and trustworthy. It should reduce interpretation, not create a sense of coaching depth that the MVP does not actually support.

## State Machine

### Canonical States

- `no_profile`
  Entry condition: no goal and no baseline exist for the current user context.
  Next state: `onboarding`
- `onboarding`
  Internal steps: `goal_capture` then `baseline_capture`
  Exit condition: required onboarding inputs are complete and the first plan is ready to display.
  Next state: `weekly_plan`
- `weekly_plan`
  Entry condition: user has a valid goal, baseline, and generated plan.
  Primary branch: open today's workout.
  Secondary branch: review the rest of the current week.
  Next state: `today_workout`
- `today_workout`
  Entry condition: user opens the scheduled workout for a specific date.
  Primary branch: review workout details, then log the result.
  Next state: `logged_result`
- `logged_result`
  Entry condition: user submits a workout result as completed, partial, or skipped.
  Purpose: brief confirmation and immediate explanation of effect on the current week.
  Next state: `weekly_status_updated`
- `weekly_status_updated`
  Entry condition: the system has recalculated visible week status after logging.
  Visible outcomes:
  `on track`
  `partially off track`
  `needs reset`
  Primary branch: return to the weekly plan.
  If state is `needs reset`, show the reset-needed variant inside the weekly plan.

### Transition Rules

- `no_profile -> onboarding`
  Trigger: user opens the product for the first time.
- `onboarding.goal_capture -> onboarding.baseline_capture`
  Trigger: required goal input is complete.
- `onboarding.baseline_capture -> weekly_plan`
  Trigger: required baseline input is complete.
- `weekly_plan -> today_workout`
  Trigger: user selects today's scheduled workout.
- `today_workout -> logged_result`
  Trigger: user saves a workout result.
- `logged_result -> weekly_status_updated`
  Trigger: result has been accepted and visible status is updated.
- `weekly_status_updated -> weekly_plan`
  Trigger: user returns to the planning surface.

## Screen Specs

### 1. No Profile Gate

User goal:
Understand why setup is required before a plan can exist.

Primary action:
`Start setup`

Secondary actions:

- `Learn how it works`
- `Back` only if the shell requires a neutral exit path

Required content blocks:

- short value statement
- one-sentence explanation that setup creates a plan for this runner
- progress indicator showing setup has two steps

Visible status language:

- heading: `Set up your first running plan`
- support text: `Tell us your goal and current baseline to see this week's plan.`

Notes:

- This may be a dedicated screen or a full-screen empty gate at `/`.
- Do not expose fake sample plans as the default state for a user without a profile.

### 2. Onboarding Goal Capture

User goal:
Define one clear goal for the current plan cycle.

Primary action:
`Continue`

Secondary actions:

- `Back`
- `Skip for now` is not allowed in Phase 1 because the weekly plan depends on a goal

Required content blocks:

- step label: `Step 1 of 2`
- concise explanation of why goal selection matters
- single-goal selection input
- short reassurance that only one active goal is supported right now

Visible status language:

- heading: `What are you training toward?`
- support text: `Choose one goal so Hito Running can build a plan that feels manageable.`

Design constraints:

- Keep the choice small and scannable.
- Do not frame this as advanced coaching or long-form assessment.

### 3. Onboarding Baseline Capture

User goal:
Provide just enough current-state context to make the first plan believable.

Primary action:
`See my plan`

Secondary actions:

- `Back`

Required content blocks:

- step label: `Step 2 of 2`
- short explanation of baseline purpose
- simple current-state inputs only
- confidence-setting note that the plan can start simple and be adjusted later through normal use

Visible status language:

- heading: `Where are you starting from?`
- support text: `Answer a few quick questions so this week's plan matches your current routine.`

Design constraints:

- Keep this light.
- Do not imply medical, biometric, or device-backed accuracy.

### 4. Weekly Plan

User goal:
See the current week clearly and identify today's next action immediately.

Primary action:
`Open today's workout`

Secondary actions:

- open another workout in the current week
- move between nearby weeks if that pattern is retained
- return to today

Required content blocks:

- page header with current week context
- today summary block at the top
- weekly plan grid or strip as the primary planning surface
- visible weekly status block
- short explanation of what the status means

Visible status language:

- status labels:
  `On track`
  `Partially off track`
  `Needs reset`
- helper copy for `On track`: `You're keeping up with this week's plan.`
- helper copy for `Partially off track`: `You missed or shortened part of the week, but the plan is still moving.`
- helper copy for `Needs reset`: `This week is no longer reliable as planned. Reset the week before continuing.`

Design constraints:

- Weekly plan is the main planning home, not a secondary calendar beneath another concept.
- Today's workout must be visually obvious without requiring scan of the entire week.
- Do not center analytics, streaks, or performance trends.

### 5. Today Workout Detail

User goal:
Understand what today's workout is and decide whether to log it now.

Primary action:
`Log result`

Secondary actions:

- `Back to weekly plan`
- open previous or next workout only if it does not distract from the current day's action

Required content blocks:

- workout type and date
- workout title
- workout summary or purpose in plain language
- key workout details such as duration or distance
- clear action to log the result

Visible status language:

- if workout is scheduled for today: `Today's workout`
- if workout is upcoming or past: show date-based status only, without implying adaptation

Design constraints:

- Remove AI tabs, AI sidebars, adaptation language, recovery scoring, and decorative weather from this surface.
- Keep overview and logging tightly connected so the runner does not feel bounced between unrelated modes.

### 6. Completion / Skip Logging

User goal:
Record what happened with minimal effort and understand that the week will update.

Primary action:
`Save result`

Secondary actions:

- `Cancel`
- `Back to workout`

Required content blocks:

- outcome selector: completed, partial, skipped
- planned vs actual fields only where they help explain the outcome
- optional short notes field
- explanation that saving updates the visible weekly status

Visible status language:

- section label: `Log today's result`
- helper copy: `Save what happened so your week stays accurate.`
- confirmation microcopy before save: `This updates your plan status for the current week.`

Design constraints:

- Logging must feel lighter than the imported panel.
- Do not require OCR, screenshot upload, connected imports, or subjective recovery instrumentation.
- Keep optional fields visibly optional.

### 7. Logged Result Review

User goal:
Confirm that the result was recorded and understand the immediate consequence.

Primary action:
`Back to weekly plan`

Secondary actions:

- `Review workout`

Required content blocks:

- confirmation message
- recorded outcome summary
- visible week status result
- short next-step message

Visible status language:

- completed example: `Workout logged. You're on track this week.`
- partial example: `Workout logged. This week is now partially off track.`
- skipped example when threshold is crossed: `Workout logged. This week now needs reset.`

Design constraints:

- This can be a lightweight inline confirmation state rather than a full standalone page.
- It must still be visually distinct enough that users understand something changed.

### 8. Reset-Needed State

User goal:
Understand that the current week should not be followed blindly and choose the safest next product action.

Primary action:
`Reset this week`

Secondary actions:

- `Back to weekly plan`
- `Review missed workouts`

Required content blocks:

- prominent `Needs reset` status block
- short explanation of why the current week is no longer reliable as planned
- clear next-step action

Visible status language:

- heading: `This week needs reset`
- support text: `Too much of the plan was missed or changed to treat the rest of the week as reliable.`

Design constraints:

- Do not imply that the product has already intelligently rewritten the plan.
- This state is about product honesty, not smart adaptation theater.

## State Specs

### Global Surface Rules

- All Phase 1 surfaces must support `loading`, `empty`, `error`, and success or review states where relevant.
- Loading must preserve orientation.
- Empty must explain why there is no content and what action unlocks content.
- Error must offer one clear recovery path.
- Success or review states must explain what changed in user-facing terms.

### `no_profile` / Root Gate

Loading:

- Show a lightweight full-screen shell placeholder while checking whether a profile exists.

Empty:

- This state is the productively empty state.
- Show setup gate with `Start setup`.

Error:

- Message: `We couldn't open your setup right now.`
- Recovery action: `Try again`

Success or review:

- Not applicable.

### Onboarding Goal Capture

Loading:

- Show the step shell, heading placeholder, and disabled primary action.

Empty:

- Not applicable once the screen is open.

Error:

- Inline validation if no goal is selected.
- Submission failure message: `We couldn't save your goal. Try again.`

Success or review:

- On success, transition immediately to baseline capture.

### Onboarding Baseline Capture

Loading:

- Show the step shell, field placeholders, and disabled primary action.

Empty:

- Not applicable once the screen is open.

Error:

- Inline validation for missing required inputs.
- Submission failure message: `We couldn't save your starting point. Try again.`

Success or review:

- On success, transition directly to the weekly plan.

### Weekly Plan

Loading:

- Preserve the page layout with skeletons for the today summary, weekly status block, and weekly plan grid or strip.

Empty:

- If no plan exists after onboarding, show a blocked state rather than a blank calendar.
- Message: `Your plan isn't ready yet.`
- Recovery action: `Finish setup`

Error:

- Message: `We couldn't load this week's plan.`
- Recovery actions:
  `Try again`
  `Back to setup` only if the problem is missing profile data

Success or review:

- Default success: plan is visible and today's workout can be opened.
- Review state after logging: highlight the updated day and the updated weekly status block.

### Today Workout Detail

Loading:

- Preserve header, workout summary card, and action area with skeleton placeholders.

Empty:

- If the selected date has no workout, show a calm no-workout state.
- Message: `Nothing is scheduled for this day.`
- Recovery action: `Back to weekly plan`

Error:

- Message: `We couldn't load this workout.`
- Recovery actions:
  `Try again`
  `Back to weekly plan`

Success or review:

- Default success: workout detail is visible and log action is available.
- Review state: if the workout is already logged, show recorded outcome and route the user toward the weekly plan.

### Completion / Skip Logging

Loading:

- Preserve the logging form with disabled controls while the save is in progress.
- The primary action must clearly show saving state.

Empty:

- Not applicable.

Error:

- Message: `We couldn't save this workout result.`
- Recovery action: `Try again`

Success or review:

- Show a confirmation state with the recorded outcome and updated weekly status.
- Do not silently drop the user back into the weekly plan without visible confirmation.

### Reset-Needed Variant

Loading:

- Not separate from weekly plan loading.

Empty:

- Not applicable.

Error:

- If reset action fails, message: `We couldn't reset this week. Try again.`

Success or review:

- Show that the week has been reset and return the user to a trustworthy planning state.

## Salvage From Imported UI

- `Today hero` visual bones
  Keep the strong at-a-glance top block pattern.
  Reuse the compositional idea of a prominent today card with one clear primary action.
  Remove AI insight, weather, race countdown, hardcoded pace goal, and fixed athlete assumptions.

- `Weekly planning/calendar surface`
  Keep the general planning layout pattern and workout visibility model.
  Re-center it around the current week as the primary planning surface.
  Month navigation may remain secondary if it does not compete with the weekly planning job.

- `Completion panel patterns`
  Keep the clear outcome selector and the general planned-vs-actual structure.
  Simplify the form for Phase 1 by removing imports, OCR, device hooks, recovery instrumentation, and adaptation promises.

- `Workout detail page bones`
  Keep the general detail-page hierarchy: workout header, key details, and logging action.
  Remove multi-panel coaching scaffolding that implies a more advanced product than the MVP.

## Excluded For Phase 1

- body map
- integrations hub
- OCR imports
- screenshot upload flows
- Garmin or Strava import flows
- fake AI coach panels
- AI analysis tabs
- deep progress analytics
- recovery scoring
- fatigue forecasting
- device-backed adaptation promises
- decorative weather if it does not change user action

## Open Questions

- Which exact goal options will appear in onboarding at launch?
- Does `Needs reset` require its own dedicated screen, or is a strong weekly-plan variant enough?
- Should month view remain available at all in Phase 1, or is week view alone clearer?
- How much logged detail is required for a partial workout before the form becomes too heavy?

## Exit Criteria

- The first-flow states are fixed as `no_profile`, `onboarding`, `weekly_plan`, `today_workout`, `logged_result`, and `weekly_status_updated`.
- Each relevant surface has defined loading, empty, error, and success or review behavior.
- Weekly plan is clearly the primary planning surface.
- Today's workout and logging form a coherent loop with visible week-status consequences.
- Imported UI salvage and Phase 1 exclusions are explicit enough that implementation does not accidentally restore deferred surfaces.
- The next implementation owner can build the bounded Phase 1 flow without needing new product decisions.

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement the bounded Phase 1 flow using the imported UI as a visual base only: add the no-profile and onboarding entry path, make weekly plan the primary home state, simplify workout detail and completion logging, and surface the three week-status outcomes without introducing deferred AI, device, or analytics panels.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the first implementation-driving frontend flow spec for Hito Running Phase 1, covering setup, weekly planning, today workout detail, result logging, and visible week-status update behavior.

### Key Decisions

- Treated the imported UI as a visual baseline only and fixed the canonical flow around `no_profile -> onboarding -> weekly_plan -> today_workout -> logged_result -> weekly_status_updated`.
- Kept only the today card, weekly planning surface, workout detail hierarchy, and simplified logging patterns while excluding AI-heavy, device-heavy, and analytics-heavy surfaces.

### Current State

- A frontend spec now exists in `docs/tasks/frontend-specs/`.
- The Phase 1 screens, transitions, status language, and state handling expectations are explicit enough for direct implementation.

### Constraints

- Do not change product logic beyond what is already established in the MVP brief and UI absorption scope.
- Do not reintroduce body tracking, integrations, OCR, fake AI coach patterns, or decorative surfaces that imply deeper capability than the MVP owns.

### Risks / Open Questions

- Final onboarding goal options are still not fully pinned down.
- The exact presentation of the `Needs reset` outcome may still need implementation judgment if it can remain within the weekly-plan surface.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the Phase 1 flow and states against the imported UI skeleton, preserving only the approved surfaces and copy boundaries from this spec.
```
