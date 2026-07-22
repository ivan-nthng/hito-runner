# Heart-Rate Zone Editor UX Redesign

## Status

backlog

## Type

frontend_spec

## Priority

high

## Next Recommended Role

designer

## Task

Redesign the runner-facing heart-rate zone editor so estimated and personal BPM guidance is clear,
direct to adjust, and consistent across onboarding, plan replacement, and Settings.

## Stage

DESIGNER UX audit and bounded redesign definition. Do not implement until this backlog item is
explicitly started.

## Exact Handoff Prompt

```text
ROLE: DESIGNER

Task:
Define and implement one canonical runner-facing Heart-Rate Zone Editor experience.

Stage:
DESIGNER audit, FRONTEND implementation, and integrated QA when this backlog item is started.

Backlog item:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-07-22-heart-rate-zone-editor-ux-redesign.md

Problem:
The current shared zone editor exposes five large row groups, two labeled numeric fields per row,
and separate `Use estimated ranges`, `Edit ranges`, and `Save ranges` actions. It is technically
correct but feels like a settings form rather than a clear, approachable runner control.

Required outcome:
- Establish one calm, compact, understandable interaction for reviewing estimated BPM ranges and
  correcting them into personal ranges.
- Do not require a runner to take a separate bureaucratic action merely to keep the displayed
  estimated ranges as their default guidance.
- Make it obvious whether the current ranges are estimated or personal, what editing changes, and
  that an existing confirmed plan remains unchanged.
- Use one shared experience across onboarding, active-plan replacement, and Settings.
- Reuse Hito DS primitives and the canonical Editable Value Field work when it is available; do not
  create another field, range, or profile editor system.

Preserved contracts:
- Baseline and heart-rate profile truth remain backend-owned and persist independently of plan
  creation.
- Estimated ranges derive from accepted runner baseline; manually changed ranges become personal.
- Existing confirmed workouts retain their immutable BPM snapshots after later profile changes.
- Existing validation, profile revision, preview invalidation, review/confirm, BPM-only runner
  readback, and no-raw-zone-label rules remain intact.
- This task does not change coaching doctrine, AI authoring, training targets, or database truth.

Definition of Done:
The same shared editor lets a runner understand and use default estimated ranges or make personal
corrections without a confusing multi-step form flow, while all accepted persistence and plan
immutability behavior remains unchanged.

Validation:
Use FRONTEND and QA subagents as appropriate. Derive and execute the required test inventory for
first-time estimated ranges, returning personal ranges, validation, save/cancel/error states,
onboarding, replacement, Settings, desktop and exact mobile, profile/plan snapshot boundaries,
accessibility, targeted lint, production build, build integrity, browser health, persistence
readback, cleanup, and scoped diff hygiene.

Return one integrated report with:
Check | Scenario / environment | Result | Evidence

Do not claim Implementation DoD passed unless every required check passes. Global QA remains
separate.
```

## Issue Category

design

## Severity

high

## Human Priority

now

## Human Status

ready

## Owner

DESIGNER, with FRONTEND and QA support when started

## Reported

2026-07-22

## User Report

The current heart-rate zone surface is cumbersome and visually unappealing. The runner should not
have to understand or navigate a separate action just to use estimated ranges, then another action
to edit them. The whole behavior pattern needs a future redesign, not another local field tweak.

## Evidence

![Current heart-rate zone editor](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-07-22-heart-rate-zone-editor-ux-redesign/heart-rate-zone-editor-current.png)

The screenshot shows five full-width range rows, each with separate minimum and maximum inputs,
while the estimate/personal state and action model live separately above the editor.

## Observed Behavior

- The shared editor starts in a read state with separate `Use estimated ranges` and `Edit ranges`
  actions.
- Entering edit mode reveals ten separately labeled BPM inputs across five large rows plus a later
  `Save ranges` action.
- The same anatomy is embedded in onboarding and active-plan replacement and also appears in
  Settings.
- The current surface makes a runner manage implementation states rather than simply understand and
  adjust their guidance.

## Expected Behavior

- Estimated ranges are an understandable default for a runner with a valid baseline, not a separate
  technical mode that demands an extra acknowledgement button.
- A runner can inspect and correct ranges with a compact, coherent range-editing experience.
- The interface clearly distinguishes estimated from personal guidance and explains the future-only
  effect of profile changes without overwhelming the runner.
- The same pattern behaves consistently everywhere it appears.

## Source Investigation

Confirmed shared owner:

- [HeartRateProfileSection.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/settings/HeartRateProfileSection.tsx) owns the current estimate acceptance,
  edit state, five range rows, validation, and save/cancel actions.

Confirmed consumers:

- [Settings](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/settings.tsx) renders the Settings instance.
- [OnboardingRunnerBaseline.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/OnboardingRunnerBaseline.tsx) embeds the same shared section during first-plan setup.
- [ActivePlanCreatePlanDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/ActivePlanCreatePlanDialog.tsx) embeds it for active-plan replacement.

Existing canonical backend truth and accepted lifecycle are intentionally out of scope for a visual
and interaction redesign.

## Likely Root Cause

The editor was built around persistence operations and validation boundaries rather than a runner's
mental model. One shared component correctly centralizes the data truth, but its presentation
exposes too many implementation-oriented states and controls.

## Recommended Fix Direction

Redesign the existing shared owner around runner comprehension and direct range adjustment. Extend
existing Hito DS controls and the forthcoming Editable Value Field contract rather than adding a
second heart-rate editor, a new profile model, or route-local variants.

## What Not To Touch

- No Supabase schema, migrations, profile storage model, or new persistence path without source
  evidence that the existing canonical contract cannot support the accepted UX.
- No changes to age-derived estimation, `estimated` / `personal` provenance, profile revision,
  preview invalidation, signed review/confirm, or immutable confirmed-plan BPM snapshots.
- No raw `Z1-Z5` runner labels, age-based medical claims, coaching-plan changes, or AI-contract
  changes.
- No separate onboarding, Settings, or replacement editor implementations.

## Validation Expectations

The later implementation must prove the root-cause interaction has been replaced rather than merely
restyled. Required evidence includes first-time estimated flow, returning personal flow, range
validation, cancellation/error states, save/readback, profile-change versus confirmed-plan snapshot
immutability, onboarding/replacement/Settings consistency, desktop and exact-mobile browser QA,
accessibility, local disposable persistence cleanup, and normal build/diff checks.

## Dependencies And Coordination

Coordinate with the active Editable Value Field design-system work. Reuse it when accepted; do not
wait for it or duplicate its role if the heart-rate redesign can use existing canonical field and
button primitives safely.
