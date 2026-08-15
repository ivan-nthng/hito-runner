# Heart-Rate Guidance Band Editor UX Redesign

- **Work Item ID:** `2026-07-22-heart-rate-zone-editor-ux-redesign`
- **Status:** `completed`
- **Type:** `frontend_spec`
- **Priority:** `high`
- **Owner:** `FRONTEND`
- **Scope:** `shared heart-rate guidance-band editor for onboarding, replacement, and Settings`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Replace the fragile heart-rate zone form with one shared, understandable editor while preserving
runner-specific guidance and the exact backend semantics consumed by plan generation.

## Result And Contract

Hito models Recovery, Easy, Long aerobic, Steady, and Tempo as ordered **guidance bands**, not
exclusive physiological zones. New or changed endpoints are bounded to 60–200 BPM; historical
40–220 profiles remain readable. Each lower endpoint must be at or below its upper endpoint, and
both lower and upper sequences must be nondecreasing. Equality, overlap, coincidence, and gaps are
valid.

The shared editor uses a fixed 60–200 scale, dual handles per band, and paired numeric endpoint
fields. Invalid typed values remain visible while Save is blocked. Save is explicit, and changes
apply only to future plans; already-reviewed workout snapshots remain immutable.

Provider output must name one full guidance band and may add one contained subrange at least 5 BPM
wide. Composite labels such as `Z1-Z2` are not canonical. A stage too short for the required
contained range fails rather than fabricating a target. Review, persistence, readback, and export
preserve the exact guidance metadata.

## Task-Owned Sources

- [Guidance-band domain owner](../../../src/lib/heart-rate-zones.ts)
- [Shared editor model](../../../src/components/settings/heart-rate-profile-editor-model.ts)
- [Shared editor UI](../../../src/components/settings/HeartRateProfileSection.tsx)
- [Settings consumer](../../../src/routes/settings.tsx)
- [Onboarding consumer](../../../src/components/onboarding/OnboardingRunnerBaseline.tsx)

## Validation And Evidence

[Focused browser evidence](../../../qa-artifacts/screenshots/2026-07-22/heart-rate-guidance-band-editor-qa/)
records pointer, touch, keyboard, invalid-input, save/cancel, persistence/reload, Light/Dark,
desktop, and 375px coverage. The production build and focused runtime checks passed in the original
implementation receipt.

## Residual Boundary

Implementation DoD passed. Broader Global QA Acceptance and a wider cross-browser/device matrix
were not assigned or claimed by this item. Future changes to clinical or coaching interpretation
must return to PRODUCT and RUNNING COACH rather than tightening the UI into exclusive zones. The
historical active-plan replacement consumer was later deleted with that retired UI; current source
consumers are Settings and onboarding.
