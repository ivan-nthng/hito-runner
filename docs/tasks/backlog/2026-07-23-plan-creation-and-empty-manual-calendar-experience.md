# Plan Creation And Empty Manual Calendar Experience

## Work Item ID

2026-07-23-plan-creation-and-empty-manual-calendar-experience

## Status

completed

## Type

plan

## Priority

high

## Owner

frontend

## Scope

runner-profile-settings-onboarding

## Archive Intent

retain_in_place

## Frontend Lane

product

## Task

Record the accepted explicit-distance generated-plan flow and separate empty manual-calendar intent.

## Stage

FRONTEND implementation and integrated QA complete. The local design fixture is a separate retained
support capability, not an open plan-creation defect.

## Track Tags

`plan-creation`, `manual-calendar`, `generated-plan`

## Product History And Root Cause

The visible `Create plan` command previously branched on whether Advanced settings were open. With
Advanced closed, it created an empty manual calendar even when the runner had not selected a goal
or distance. That was a hidden mode switch, not a missing generated-plan validation.

Generated plan preview and confirmation already reject missing distance at the frontend and backend
boundaries. The correction is therefore a product-flow clarification:

- generated creation remains the primary `Create plan` path and requires a selected distance;
- Advanced settings change detail, not generated versus manual intent;
- manual creation remains available through an explicit `Build my plan myself` choice;
- no goal-less generated preview, provider request, or generated persistence may occur.

## Current Evidence

- Root-cause discriminator: [generated-distance root-cause evidence](../../../qa-artifacts/screenshots/2026-07-23/generated-distance-root-cause-discriminator/root-cause-discriminator.json).
- Active implementation owner: [OnboardingGate.tsx](../../../src/components/OnboardingGate.tsx).
- Generated contract owners: [selected-running-plan-flow-utils.ts](../../../src/components/onboarding/selected-running-plan-flow-utils.ts) and [running-plan-engine-actions.ts](../../../src/lib/running-plan-engine-actions.ts).
- Owner-level browser, contract, build, integrity, runtime, and cleanup evidence passed for the
  explicit generated and manual paths.

## Preserved Boundaries

- Generated plans retain preview, explicit review, signed confirm, and canonical persistence.
- Manual calendars remain a valid separate runner intent.
- Baseline and heart-rate acceptance remain independent of plan creation.
- This task does not change provider behavior, plan anatomy, or existing saved plans.

## Accepted Completion

Generated creation now always requires an explicit goal and distance, regardless of Advanced settings
visibility. `Build my plan myself` is the sole explicit route to an empty manual calendar. Owner-level
proof covered generated 10K/Custom preview, missing-goal and missing-distance blocking, no
provider/write behavior on blocked paths, explicit manual creation, active-plan replacement,
desktop/mobile keyboard behavior, build, runtime health, and disposable-data cleanup.

The accepted evidence folder is
`qa-artifacts/screenshots/2026-07-23/onboarding-generated-primary-manual-secondary/`. Broader Global
QA remains a separate release gate.
