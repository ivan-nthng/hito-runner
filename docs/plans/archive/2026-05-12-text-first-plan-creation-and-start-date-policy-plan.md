## Status

Completed

## Owner

Architect + Frontend

## Last Updated

2026-05-12

## Implementation Status Update

- Backend apply-time normalization is now implemented in
  [src/lib/plan-apply-policy.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-apply-policy.ts:1)
  and wired through
  [src/lib/training-api.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts:1).
- The backend now returns one structured `decision_required` conflict state when a normalized plan
  would start today with a workout and today already has a saved workout.
- `replace_first_day` and `ignore_first_day` semantics now exist behind the same continuity guard.
- The frontend now surfaces that conflict in both text-first and advanced-import entry paths through
  [src/components/OnboardingGate.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/OnboardingGate.tsx:1),
  [src/components/UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx:1),
  and the shared
  [src/components/FirstDayConflictDecision.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/FirstDayConflictDecision.tsx:1)
  chooser. Both flows now reuse the canonical imported-plan plus apply seam instead of regenerating
  or recomputing start-date logic on the client.

## Context

The repo already has a real text-first plan-creation path and a real advanced JSON fallback path.
What it does not yet have is one canonical product and backend policy for effective start-date
normalization when a generated or imported plan is applied.

This planning pass is intentionally narrow:

- keep text-first as the visible primary path
- keep canonical `training-plan-v2` as the internal import and apply contract
- define one effective start-date policy
- define one safe first-day conflict policy
- preserve workout-history safety

## Existing Work Audit

### Existing text-first / OpenAI direction

The repo already contains a prior plan and live implementation for freeform text to canonical plan:

- [2026-05-07-openai-text-to-plan-authoring-plan.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-05-07-openai-text-to-plan-authoring-plan.md:1)
  Status: completed
  Currentness: still current for primary authoring direction
- [OnboardingGate.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/OnboardingGate.tsx:1)
  Status: implemented visible text-first onboarding
- [training-api.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts:1)
  Status: implemented `completeTextOnboarding` seam
- [openai-plan-authoring.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/openai-plan-authoring.ts:1)
  Status: implemented OpenAI free-text to canonical plan generation helper
- [structured-plan-authoring.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/structured-plan-authoring.ts:1)
  Status: implemented deterministic structured authoring generator underneath the text-first path

### Existing earlier structured-form-first direction

- [2026-05-07-plan-authoring-flow-redesign.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-07-plan-authoring-flow-redesign.md:1)
  Status: partial and partly stale
  Why: this plan assumed a structured-form-first visible replacement and still says `/` remained JSON-first at that time. The repo has since moved on to visible text-first onboarding.

### Existing advanced JSON import direction

- [UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx:1)
  Status: implemented advanced saved-mode replacement path
- [OnboardingGate.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/OnboardingGate.tsx:1)
  Status: implemented advanced fallback import inside onboarding
- [imported-plan.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/imported-plan.ts:1)
  Status: implemented canonical `training-plan-v2` validation and normalization

### Existing replacement / continuity direction

- [training-api.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts:530)
  Status: implemented replace-active-plan path with continuity guard
  Currentness: current and important
  Note: existing carry-forward safety is based on the imported plan’s final workout dates after normalization. It does not yet have a separate effective-start normalization phase.

### Existing start-date semantics

The repo already has date fields, but not a canonical apply-time start-date policy:

- [structured-plan-authoring.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/structured-plan-authoring.ts:24)
  uses `schedule.startDate`, defaulting to `today`
- [imported-plan.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/imported-plan.ts:541)
  preserves incoming `start_date` as-is in the imported seed
- [training-api.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts:500)
  persists `start_date` from the imported seed directly into `plan_cycles`

Current audit result:

- there is prior and current work for text-first creation
- there is prior and current work for advanced JSON import
- there is no prior explicit canonical effective start-date and first-day conflict policy in docs, plans, or runtime behavior

## What We Reuse From Earlier Work

- visible text-first onboarding on `/`
- server-side `free text -> OpenAI -> validated structured authoring input -> canonical training-plan-v2 -> persistence`
- canonical `training-plan-v2` as the internal and advanced import contract
- existing advanced JSON fallback pattern for migration, tooling, and expert use
- current replacement continuity guard that blocks unsafe history detachment
- current persisted plan seam:
  `plan_cycles -> planned_workouts -> TrainingSnapshot -> routes`

Canonical reuse principle:

- do not invent a new authoring architecture
- do not invent a second plan contract
- do not bypass the existing persistence seam

## Problem Definition

### Why the current JSON-first remnants are insufficient

The product direction is already text-first, but the repo still contains secondary seams and some
stale residue that can teach the wrong mental model:

- advanced JSON is still the only saved-mode replacement modal today
- some older copy still references `JSON-first onboarding`, for example in
  [\_\_root.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/__root.tsx:27)
- the current advanced import surfaces are valid but can still look like the system’s “real” input if the product policy is not restated clearly

The user intent is correct:

- normal runners should not feel like they are authoring the internal plan DSL
- arbitrary free text should stay visibly primary
- advanced JSON should stay available, but clearly secondary

### Why start-date semantics are currently too rigid

Current runtime behavior treats the incoming or generated plan’s `start_date` as the persisted
plan start truth:

- generated plans can carry a `startDate`
- imported plans preserve their raw `start_date`
- replacement continuity is then computed against those dates

This creates two gaps:

1. there is no explicit effective-start normalization rule
2. there is no explicit first-day conflict rule when a plan should start now

Without a policy, the system is too rigid for the user’s intended behavior:

- a past-dated imported plan should not quietly begin in the past
- a no-date or non-future plan should not require the runner to think in template semantics
- the app should not silently detach saved workout history just because the new plan is shifted onto today

## Product Decision

### Primary path

The primary plan-creation path remains:

- user writes arbitrary text
- backend turns it into canonical plan truth
- the plan is applied through the same saved-mode seam

This is already the correct product direction and should be reaffirmed, not replaced.

### Secondary path

Advanced JSON remains:

- a secondary expert path
- a migration and tooling path
- a debugging and QA path
- not the default normal-runner authoring path

### Surface decision

Use one shared plan-authoring pattern, not two unrelated product stories:

- no-plan onboarding:
  text-first surface on `/` with advanced JSON tucked under an advanced disclosure
- saved-mode plan replacement:
  use the same product framing, with text first and advanced JSON secondary

Canonical product rule:

- text and advanced JSON can coexist in one plan-authoring surface pattern
- they must not appear as equal primary choices
- the user should understand that free text is the normal path and JSON is the expert fallback

## Effective Start-Date Policy

This policy applies to both:

- text-generated plans
- advanced imported `training-plan-v2` plans

The policy is apply-time logic, not a new plan-contract family.

### Rule 1. Explicit future start date

If the incoming plan or parsed authoring intent contains an explicit start date after today:

- respect it
- `effective_start_date = explicit future date`
- do not normalize it back to today
- do not show the first-day conflict choice yet

Result:

- the persisted plan starts on that future date
- home can show that the plan window has not started yet until that date arrives

### Rule 2. Explicit past start date

If the incoming plan or parsed authoring intent contains a start date before today:

- do not persist that past start as active runtime truth
- `effective_start_date = today`
- shift the plan forward so its first effective day aligns to today

This treats the past date as historical template context, not current runtime truth.

### Rule 3. No usable future date

If there is no explicit future start date that the app can use safely:

- `effective_start_date = today`

This includes:

- no start date provided in the effective authoring intent
- imported start date equal to today
- imported start date in the past
- ambiguous text that does not clearly request a future start

### Rule 4. Today already contains a first-day workout

If `effective_start_date = today` and the incoming plan’s effective day 1 is a non-rest workout,
the product must ask the user to choose before apply:

- `Replace first day`
- `Ignore first day`

Do not auto-choose.

### Rule 5. `Replace first day`

`Replace first day` means:

- the incoming plan’s first day becomes today’s scheduled day in the newly applied plan
- the rest of the plan keeps its relative offsets from that effective start
- no synthetic “skipped” or “completed” log is created by the policy itself

History rule:

- this option never overrides the history-preservation guard
- if applying this option would detach or invalidate saved workout history, the option must be blocked or the whole apply must be blocked

### Rule 6. `Ignore first day`

`Ignore first day` means:

- the incoming plan’s first scheduled day is dropped from the applied runtime plan
- the remaining plan starts tomorrow from original day 2
- the rest of the plan keeps its relative order after that dropped day
- no synthetic workout log is created for the ignored day

History rule:

- this option also never overrides the history-preservation guard
- if it would still detach saved workout history, it must be blocked

### Rule 7. History continuity always wins

The first-day conflict choice is not allowed to bypass continuity safety.

Canonical rule:

- no silent history detachment
- no silent clearing of saved logs
- no silent reassignment that leaves saved workouts orphaned

If neither `Replace first day` nor `Ignore first day` can preserve safe continuity, the apply step must block with an explicit explanation.

## Truth Boundaries To Preserve

- `training-plan-v2` remains the canonical internal import and apply contract
- OpenAI output never persists directly without deterministic validation
- effective start-date and first-day conflict handling belong to the apply layer, not to a second template dialect
- `workout_logs` remain trusted persisted truth
- saved workout history must never be silently detached
- advanced JSON import must not invent a separate runtime rendering path

## Recommended UX Flow

### What the user sees first

For no-plan users on `/`:

- one visible text box
- one short explanation that free text is the normal path
- advanced JSON hidden behind an advanced disclosure

For saved-mode users replacing a plan:

- one plan-replacement surface with the same hierarchy:
  text first
  advanced JSON second

Do not keep a JSON-only replacement story as the long-term primary saved-mode replacement experience.

### Where arbitrary text goes

The arbitrary-text request stays in the main visible plan-creation area.

It should continue to be the first thing the runner sees and uses.

### Where advanced JSON lives

Advanced JSON should live:

- under an advanced disclosure in onboarding
- under an advanced import section in saved-mode replacement

It should not visually compete with the main text path.

### When the replace-or-ignore choice appears

Show the `Replace first day` / `Ignore first day` choice only after:

- the text request or JSON file is valid enough to produce a canonical plan
- the backend has computed the effective start date
- the backend knows that the plan would start today with a non-rest first day

This is an apply-time decision, not an upfront authoring burden.

### What the user should understand before applying

The user should understand:

- whether the plan starts today or on a future explicit date
- whether today’s first workout is being kept or ignored
- whether any saved workout history would block the apply step

The product should explain the effect in plain language, not in template terms.

## Implementation Decomposition

### ARCHITECT decisions now

- freeze text-first as the only primary product path
- freeze advanced JSON as secondary expert path only
- freeze `training-plan-v2` as the internal contract
- freeze one effective-start normalization policy
- freeze one first-day conflict choice policy
- freeze that continuity guard outranks first-day convenience

### BACKEND changes

- add one apply-time normalization step for generated and imported plans before persistence
- compute `effective_start_date`
- shift or trim workout dates according to the chosen policy
- evaluate continuity preservation after effective-date normalization, not before
- return a structured “decision required” response when today’s first-day conflict exists
- preserve the current no-silent-history-detachment rule

Recommended backend shape:

- keep `training-plan-v2` unchanged
- add apply options or a preview/apply handshake
- do not encode `Replace first day` or `Ignore first day` into the JSON template itself

### FRONTEND changes

- keep visible text-first onboarding as primary
- demote JSON import more consistently in saved-mode replacement
- show a clear apply preview:
  effective start date
  today conflict if any
  replace vs ignore options when required
  continuity block explanation if required

### QA requirements

- verify text-first onboarding with no explicit future date starts today
- verify text-first onboarding with an explicit future date respects that date
- verify imported past-dated plans normalize to today
- verify imported future-dated plans stay future-dated
- verify `Replace first day` and `Ignore first day` produce the intended visible schedule
- verify no saved workout history is silently detached
- verify unsafe replacement stays blocked

## What We Must Not Reintroduce

- visible JSON-first onboarding
- a second primary authoring path equal to free text
- silent replacement that clears or detaches saved history
- raw OpenAI output treated as persisted truth
- a second runtime contract separate from canonical `training-plan-v2`
- ambiguous “maybe today, maybe template date” start semantics

## Open Questions

- Should saved-mode replacement expose the text-first plan-replacement surface in the existing profile flow immediately, or first land the backend start-date policy under the current UI and expand the saved-mode surface afterward?
- Do we want to preserve the original declared source `start_date` for audit/debug metadata when effective start normalizes to today, or is effective runtime truth alone enough for the first slice?
- Should future explicit start-date intent remain free-text-only for now, or later gain a light optional assist control without weakening the text-first product posture?

## Risks

- shifting plan dates before replacement can invalidate current exact-date log carry-forward assumptions if the backend sequencing is wrong
- a weak apply-preview UI could make `Replace first day` and `Ignore first day` feel arbitrary
- leaving saved-mode replacement JSON-only for too long would dilute the text-first product story even if backend policy is correct
- over-modeling start-date rules could create a second authoring system instead of one apply policy

## QA Plan

Critical scenarios:

- no-plan text request with no explicit future date
- no-plan text request with explicit future date
- advanced import with past `start_date`
- advanced import with future `start_date`
- plan whose effective day 1 is a workout today
- both `Replace first day` and `Ignore first day`
- replacement attempt where current saved logs would be detached

Expected outcomes:

- today-normalized plans start today unless a future start was explicitly specified
- future explicit start is respected
- first-day conflict is never auto-resolved silently
- continuity guard still blocks unsafe replacements
- the user always understands whether the plan starts today, starts later, or is blocked

## Exit Criteria

- the repo has one canonical written policy for text-first creation plus advanced JSON fallback
- the repo has one canonical written effective-start-date policy
- `Replace first day` and `Ignore first day` have exact meanings
- continuity guard remains non-negotiable
- follow-up backend and frontend work can proceed without inventing parallel semantics

## Next Recommended Role

QA

## Suggested Next Step

Verify both text-first and advanced-import entry paths against a real `decision_required`
first-day conflict so `Replace first day`, `Ignore first day`, and blocked-resolution messaging
stay aligned with the canonical backend seam.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined one canonical product and architecture policy for text-first plan creation plus effective
start-date normalization, while keeping advanced JSON as the expert fallback path.

### Key Decisions

- Free text remains the only primary visible plan-creation path.
- `training-plan-v2` remains the internal and advanced import contract.
- Effective start date is apply-time policy, not a new template dialect.
- `Replace first day` and `Ignore first day` are explicit user choices only when a plan starts today with a workout.
- History continuity outranks first-day convenience.

### Current State

- Text-first onboarding is already live.
- Advanced JSON import is already live.
- No canonical effective-start policy exists yet in current runtime behavior.
- Current replacement continuity guard is live and must be preserved.

### Constraints

- Do not reintroduce JSON-first primary UX.
- Do not silently detach saved workout history.
- Do not create a second runtime contract besides canonical `training-plan-v2`.

### Risks / Open Questions

- Effective-date shifting can break current exact-date carry-forward assumptions if backend order is wrong.
- Saved-mode replacement UX still needs a cleaner text-first surface after backend policy is stabilized.

### Next Recommended Role

BACKEND

### Suggested Next Step

Add one backend normalization and decision layer for generated and imported plans that computes
effective start date, resolves first-day conflict requirements, and evaluates continuity safety
before persistence.
```
