# Optional Weekly Running Capacity And Fixed Rest Days

## Work Item ID

2026-07-23-optional-weekly-running-capacity-and-fixed-rest-days

## Status

completed

## Type

change_request

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

Make the runner's weekly running ceiling and fixed rest days independently optional in onboarding,
Settings, and generated-plan readback.

## Stage

BACKEND contract and FRONTEND adoption accepted. Global QA Acceptance remains a separate release gate.

## Implementation Closeout

- Onboarding and Settings independently preserve all four combinations of weekly ceiling and fixed
  rest days, including clearing either preference back to absence.
- Preview and saved-plan readback distinguish runner preferences from plan-author decisions through
  `Flexible`, `Up to N`, `Plan weekdays`, and `Authored rhythm`.
- The loopback `qa_fixture` intentionally uses one frozen authoring input and one frozen plan,
  regardless of the runner's submitted availability. It proves loading/review/confirm UX, not four
  distinct AI-authored schedules. Changing that boundary would create a second fixture product.
- Four-state form, persistence, stale-review, manual-transition, and immutable-history evidence
  passed; the accepted backend/provider validators prove absence reaches the canonical generation
  contract without fabrication.

Implementation DoD: Passed. Global QA Acceptance: Pending as a separate release-level gate.

## Demonstrated Root Cause

The canonical schema already permits `maxRunningDaysPerWeek: null`, but the frontend still requires a
rest-days answer and a non-empty running-days value. It also limits selected running days according
to fixed rest days. That recreates a coupling the backend intentionally removed.

Canonical source evidence:

- `src/lib/structured-plan-authoring-schema.ts` accepts a nullable weekly ceiling.
- `src/components/onboarding/TrainingPreferenceFields.tsx` gates running-days choice on a rest-days
  answer and constrains it by fixed-rest selection.
- `src/routes/settings.tsx` requires both answers before save.

## Product Contract

The UI must express all four truthful states:

| Weekly ceiling | Fixed rest days | Meaning |
| --- | --- | --- |
| Set | Set | Runner gives both constraints. |
| Set | Unset | Runner gives a maximum; plan author chooses rest placement. |
| Unset | Set | Runner protects named rest days; plan author chooses weekly density. |
| Unset | Unset | Schedule is flexible; plan author chooses both density and rest placement. |

The plan author may use these optional inputs to distribute the plan, but AI-chosen weekdays and
actual peak density must not be written back as runner preferences. Readback must distinguish
`Up to N` from `Flexible` and must not claim AI-chosen rest days are fixed preferences.

## Preserved Boundaries

- Preserve the accepted nullable backend schema, provider/compiler/review/confirm contract, and
  profile revision behavior.
- Preserve fixed-rest safety and over-ceiling rejection when a runner did provide those constraints.
- Do not invent a frontend default, provider fallback, second persistence path, or new backend
  validation route.
- Preserve generated-plan preview, signed review, explicit confirm, manual plan creation, and
  confirmed-workout immutability.

## Definition Of Done

- Onboarding and Settings allow all four states, including clearing either constraint independently.
- The generated preview/readback labels are truthful for each state.
- The generated provider path receives absence as absence rather than fabricated availability.
- Browser form/readback and persistence evidence covers all four states, stale review after a real
  preference change, desktop and exact mobile, and disposable-data cleanup. The fixed QA fixture is
  intentionally not evidence for four distinct AI-authored schedules.
- Targeted lint, build, integrity, runtime health, and scoped diff hygiene pass.

## Stop Conditions

Stop and report if the existing backend contract cannot represent one of the four states without a
new Product decision, or if a required behavior would write plan-author choices back into runner
preferences.
