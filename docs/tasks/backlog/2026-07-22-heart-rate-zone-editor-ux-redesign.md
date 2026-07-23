# Heart-Rate Zone Editor UX Redesign

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

product

## Task

Deliver one shared runner-facing heart-rate guidance-band editor for estimated and personal BPM
guidance across onboarding, plan replacement, and Settings.

## Stage

FRONTEND implementation and owner-level QA complete. The shared editor now consumes the reconciled
backend policy; broader Global QA remains a separate release gate.

## Exact Handoff Prompt

None. Backend reconciliation, shared frontend implementation, and owner-level browser and
persistence acceptance are complete.

## Issue Category

design

## Severity

high

## Human Priority

now

## Human Status

completed

## Owner

FRONTEND with bounded QA acceptance

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

## Canonical Semantic And Editing Policy

The canonical product model is **ordered workout-purpose guidance bands**, not exclusive
physiological zones and not a classifier for every possible BPM value.

- Keep the canonical order `Recovery -> Easy -> Long aerobic -> Steady -> Tempo`.
- Each band owns an inclusive lower and inclusive upper endpoint. A workout target states which
  band applies, so an endpoint shared by overlapping bands is not ambiguous in the product.
- Overlap is valid and can be intentional. Easy and Long aerobic, for example, may share much of
  their guidance because workout purpose distinguishes them.
- Gaps are also valid. Hito does not need to assign every BPM value to one band.
- Within a band, require `lower <= upper`. Across the ordered set, lower endpoints and upper
  endpoints must each remain non-decreasing. Equality is allowed.
- Use `40-220 BPM` as the editable product sanity envelope. This is an input boundary, not a
  medical assessment or a promise that every value is appropriate for every runner.
- Existing estimated values remain backend-shaped guidance. Editing must not silently rewrite the
  estimation formula or convert unchanged estimated guidance to personal truth.

Running Coach confirmed that linked, mutually exclusive zones would be a different coaching model.
A single connected five-zone boundary slider is therefore rejected: it would erase valid overlap
and gap semantics and would make adjacent handles falsely dependent.

The selected visual direction remains `Precision Lanes`, corrected as follows:

- Show one aligned dual-handle rail per guidance band on one fixed shared `40-220 BPM` scale.
- Dragging, tapping, or using the keyboard changes only the active band's endpoint. It never moves
  an adjacent band's handle automatically.
- Constrain a rail interaction to `lower <= upper` and to the non-decreasing ordered bounds. When a
  pointer reaches a valid boundary, the active handle stops; neighboring values do not move.
- Use Arrow keys for `1 BPM` changes and Page Up/Down for `5 BPM` changes. Home/End move the active
  handle to its current valid boundary. Focus remains on that handle.
- Replace the two large `Minimum` / `Maximum` fields with one compact compound range field:
  `[ lower  -  upper ] BPM`. It contains two real numeric inputs, one quiet separator, and one unit
  label. The visible field label is the small `Range`; accessible endpoint names include the band,
  for example `Recovery lower bound` and `Recovery upper bound`.
- A valid typed integer updates the matching handle. Empty, malformed, out-of-domain, reversed, or
  decreasing-order input remains visible with one inline error, keeps the last valid rail position,
  and blocks `Save ranges`; it is never silently clamped, reverted, or persisted.
- Tab order is lower endpoint, upper endpoint, then the next band. Enter accepts a valid value into
  the unsaved draft. Escape restores the active endpoint to its value when that input received
  focus. Arrow Up/Down in a numeric input changes it by `1 BPM`.
- `Save ranges` remains the only persistence action. `Cancel` restores the last persisted readback.
  Changes affect future plan authoring and never rewrite immutable confirmed-workout BPM snapshots.

Desktop and narrow layouts use the same order: identity, rail, compact range field. At exact
`375px`, the rail and compound field each occupy one full-width row. Do not repeat minimum/maximum
labels, `BPM`, or numeric readback elsewhere in the lane.

## Hito DS Ownership

Reuse the existing `HitoDualRange`, Hito Field secondary/small sizing, Button, typography, status,
divider, focus, light/dark color, spacing, and radius contracts. Keep `HeartRateProfileSection` as
the single product consumer owner across onboarding, replacement, and Settings.

The only demonstrated DS gap is the compact compound range-value field. Extend the existing Hito
Field family with one accessible two-endpoint composition and document it under `/hitoDS` Inputs.
Do not create a heart-rate-specific input, a connected multi-zone slider, a second range primitive,
or route-local field styling.

## Accepted Evidence And Remaining Gate

- Backend reconciliation accepts ordered overlapping and gapped bands inside `40-220 BPM` while
  preserving estimated/personal provenance, profile revision, immutable confirmed-workout BPM
  snapshots, and historical-data safety.
- `HeartRateProfileSection` is the shared product owner across Settings, onboarding, and plan
  replacement. It uses the fixed-scale `HitoDualRange` and the shared Hito Field compound endpoint
  control documented under `/hitoDS/components#inputs`.
- Pointer, tap, rail keyboard, numeric-input keyboard, typed invalid-state visibility, save blocking,
  cancel restoration, estimated acceptance, personal overlap/gap persistence, and reload readback
  passed.
- Light/dark desktop and exact `375px` browser evidence, including replacement-dialog containment,
  runtime health, and disposable cleanup, is stored under
  `qa-artifacts/screenshots/2026-07-22/heart-rate-guidance-band-editor-qa/`.
- Implementation DoD passed. Global QA Acceptance remains pending as the separate release gate.

## Source Investigation

Confirmed shared owner:

- [HeartRateProfileSection.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/settings/HeartRateProfileSection.tsx) owns the current estimate acceptance,
  edit state, five range rows, validation, and save/cancel actions.

Confirmed consumers:

- [Settings](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/settings.tsx) renders the Settings instance.
- [OnboardingRunnerBaseline.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/OnboardingRunnerBaseline.tsx) embeds the same shared section during first-plan setup.
- [ActivePlanCreatePlanDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/ActivePlanCreatePlanDialog.tsx) embeds it for active-plan replacement.

Confirmed canonical contract and frontend binding:

- `src/lib/heart-rate-zones.ts` owns the accepted `40-220 BPM` validation and ordered guidance-band
  semantics; application and persistence accept both overlap and gaps.
- `src/components/settings/heart-rate-profile-editor-model.ts` projects that contract into one fixed
  visual scale, endpoint validation, last-valid rail positions, and active-endpoint boundaries.
- Running Coach classified the named ranges as workout-purpose guidance bands and explicitly
  rejected exclusive-zone semantics for the current product model.

External guidance supports keeping estimates non-diagnostic: the
[American Heart Association](https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates)
calls age-derived targets general guidance, and a
[published comparison study](https://pubmed.ncbi.nlm.nih.gov/23913510/) reports wide individual
error for common age-prediction equations. The `40-220 BPM` envelope is therefore only a broad
product input sanity bound; Hito does not present it as a personalized medical range.

## Likely Root Cause

The original first incorrect owner was the canonical heart-rate validation policy: estimated
guidance allowed overlap while personal persistence rejected it. After backend reconciliation, the
remaining frontend owner still used a dynamic scale, stale validation language, and ten separate
endpoint fields. Both layers now express one ordered guidance-band contract.

## Recommended Fix Direction

Completed: the reconciled backend contract is rendered through the existing shared frontend owner,
with a fixed scale, independent-band rail behavior, and one reusable compound Hito Field.

## What Not To Touch

- No Supabase schema, migrations, profile storage model, or new persistence path without source
  evidence that the existing canonical contract cannot support the accepted UX.
- No changes to age-derived estimation, `estimated` / `personal` provenance, profile revision,
  preview invalidation, signed review/confirm, or immutable confirmed-plan BPM snapshots.
- No raw `Z1-Z5` runner labels, age-based medical claims, coaching-plan changes, or AI-contract
  changes.
- No separate onboarding, Settings, or replacement editor implementations.

## Validation Expectations

Completed owner-level validation covers overlap/gap persistence, rejected invalid matrices,
estimated/personal provenance, immutable confirmed-workout snapshots, shared fixed-scale rendering,
non-cascading handles, typed and keyboard lifecycle, light/dark desktop, exact `375px`, runtime
health, build integrity, scoped diff hygiene, and disposable cleanup.

## Dependencies And Coordination

The accepted Editable Value Field and Hito Field/Button sizing remain reference contracts, but the
compound endpoint composition belongs to the Field family rather than the single-value Editable
Value Field. Backend reconciliation and the shared frontend implementation are complete; broader
Global QA remains independent of this task-level acceptance.
