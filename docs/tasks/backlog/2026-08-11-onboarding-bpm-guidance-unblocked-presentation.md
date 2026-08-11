# Onboarding BPM Guidance Unblocked Presentation

## Work Item ID

2026-08-11-onboarding-bpm-guidance-unblocked-presentation

## Status

completed

## Type

product_ui

## Priority

high

## Owner

frontend

## Frontend Lane

product

## Scope

authenticated-onboarding-heart-rate-guidance

## Archive Intent

retain_in_place

## Task

Correct the just-completed BPM auto-reveal slice. Keep automatic initial guidance reveal and the
existing `Recommended` button, but remove the newly introduced stale-warning/gating behavior. A
runner may continue with the displayed editable guidance; `Recommended` is an optional existing
control for applying the current age-derived estimate, not a required acknowledgement or a
prerequisite for plan creation.

Also remove only the route-scoped embedded `Guidance bands` label captured by the local Inspector.

## User Report

- The visible `BPM guidance needs a refresh` state is unwanted UI and unwanted product friction.
- Do not add a warning, required refresh, fake loader, new button, or special step around BPM.
- The runner is capable of choosing whether to use the already existing `Recommended` button.
- Local Inspector batch `2026-08-11T04:37:53.025Z`, route `/`, dark, `1470x801`, requests removal
  of only the embedded `Guidance bands` label. Source attachment:
  `/Users/ivan/.codex/attachments/1ae2458c-3543-4464-90e1-c89328c0f733/pasted-text.txt`.

## Source Investigation

The preceding task introduced a single stale state into the Frontend onboarding seam:

- `use-onboarding-runner-baseline.ts` makes `isReady` false when the local snapshot input key no
  longer matches; it rejects persistence with `Apply Recommended...`; and it emits a pending preview
  context.
- `OnboardingRunnerBaseline.tsx` renders `BPM guidance needs a refresh` from that stale state.
- `OnboardingGate.tsx` uses `runnerBaseline.isReady` to hide the plan-method card and disable the
  existing creation path.
- `HeartRateProfileSection` already owns the existing `Recommended` button. Its `embedded`
  appearance is used only by onboarding; Settings retains its own section title.

The first incorrect owner is **FRONTEND Product onboarding presentation/readiness**, not the BPM
formula, Backend, persistence, or Design System. The age-derived formula and automatic initial
reveal are accepted and remain unchanged.

## Product Decision

- Valid first baseline → show editable age-derived BPM guidance automatically, without a server
  round-trip or loader.
- A later baseline edit does **not** create a warning/banner, hide the plan card, block preview,
  block manual creation, or produce a special persistence error.
- The existing `Recommended` button stays visible and optional. Its current local application of
  the canonical age-derived range remains available. Do not create, rename, duplicate, or promote
  it into a gate.
- The current editable BPM draft is what the normal existing creation action persists. No new
  persistence path, write timing, validation layer, or API is authorized.
- Remove only the `Guidance bands` label from the embedded onboarding appearance. Do not alter the
  Settings heading or shared typography class.

## Reuse-First Boundary

Reuse `buildHeartRateZonesSummary(age)`, `useOnboardingRunnerBaseline`,
`OnboardingRunnerHeartRateProfile`, `HeartRateProfileSection`, existing draft callbacks, and the
normal generated/manual creation path. New production runtime artifacts: **none**.

Do not change the BPM formula, required baseline fields, Settings behavior, shared Design System
primitives/CSS/tokens, Backend, schema, migrations, RLS, providers, plan/workout truth, auth,
Figma, dependencies, lockfile, or unrelated dirty work.

## Validation Expectations

| Check                | Scenario / environment                            | Required evidence                                                                             |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Initial reveal       | Valid onboarding baseline                         | Existing editable zones and `Recommended` appear automatically; no Show button or loader      |
| Post-edit continuity | Change age after initial reveal                   | No refresh banner, no hidden plan tabs, no creation gate, and no special persistence error    |
| Recommended          | Existing button                                   | It remains optional and applies the current age-derived range without changing flow ownership |
| Embedded label       | Onboarding and Settings source/render map         | `Guidance bands` removed only from onboarding; Settings title remains                         |
| Focused UI           | Desktop and exact 375px, keyboard, console/static | Usable contained flow with no regression                                                      |

This Lite correction proves only the Frontend onboarding presentation. It does not claim Global QA,
hosted/release readiness, deployment, or formula/persistence changes.

## Frontend Lite Receipt — 2026-08-11

### Outcome

The onboarding BPM presentation is unblocked. A valid first baseline still reveals the existing
editable guidance automatically. Later baseline edits retain the current draft and keep both plan
methods available without a stale banner, hidden method card, Recommended-specific rejection, or
forced refresh. `Recommended` remains an optional keyboard-operable action that applies the current
age-derived estimate. The embedded-only `Guidance bands` label is removed while the Settings
`Heart-rate guidance` heading is preserved.

### Reused owner and change budget

- Reused `useOnboardingRunnerBaseline`, `OnboardingRunnerHeartRateProfile`,
  `HeartRateProfileSection`, the existing draft callback, canonical estimate builder, and unchanged
  generated/manual creation callers.
- Removed the onboarding-only guidance snapshot key, stale readiness branch, stale banner,
  Recommended-specific persistence rejection, stale preview-context branch, and embedded label.
- New production runtime artifacts: **none**.
- No Backend, persistence shape, formula, Settings behavior, shared Design System source, provider,
  auth, schema, dependency, or lockfile change was required.

### Files changed

- `src/components/onboarding/use-onboarding-runner-baseline.ts`
- `src/components/onboarding/OnboardingRunnerBaseline.tsx`
- `src/components/OnboardingGate.tsx`
- `src/components/settings/HeartRateProfileSection.tsx`
- `docs/tasks/backlog/2026-08-11-onboarding-bpm-guidance-unblocked-presentation.md`

### Focused proof

| Check                              | Scenario / environment                                                                                                                                                       | Result | Evidence                                                                                                                                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial reveal                     | Fresh disposable local tester, `qa_fixture`, desktop dark `1440x1000`                                                                                                        | Passed | Saving age 34, height 178, and weight 72 revealed all five editable BPM bands and `Recommended` automatically; no Show button, loader, stale warning, or embedded `Guidance bands`; initial values were `100–120`, `110–130`, `110–140`, `130–145`, `145–160`. |
| Post-edit continuity               | Same route, age 34 → 44                                                                                                                                                      | Passed | The ten draft endpoints stayed unchanged; both method tabs remained rendered; no stale copy or Recommended-specific error appeared; selecting 10K enabled the existing generated `Create plan` action without invoking a provider.                             |
| Optional Recommended               | Keyboard focus + Enter at age 44                                                                                                                                             | Passed | Focus remained on `Recommended`; values changed to the canonical age-44 estimate `95–115`, `105–125`, `105–135`, `125–140`, `140–155`; the generated action remained enabled.                                                                                  |
| Editable draft and normal creation | Edited Recovery lower bound to 96, then changed age 44 → 45 without applying Recommended again; selected `Build myself` with ArrowRight and invoked `Create plan` with Enter | Passed | The complete current draft (`96–115`, `105–125`, `105–135`, `125–140`, `140–155`) remained available; manual creation exited onboarding normally and produced `runner_profiles=1`, `plan_cycles=1`, `planned_workouts=0`.                                      |
| Settings boundary                  | Authenticated `/settings` readback after creation, exact `375x812`, light                                                                                                    | Passed | `Heart-rate guidance` remained the Settings heading; `Guidance bands` and stale copy were absent; the persisted fields matched the current editable draft.                                                                                                     |
| Responsive/accessibility health    | Desktop dark `1440x1000` and exact mobile light `375x812`                                                                                                                    | Passed | Zero horizontal overflow, no busy/loader state, semantic method tabs supported ArrowRight selection, controls remained contained, browser console/errors were empty, and no runtime error overlay was present.                                                 |
| Static and build                   | Focused source checks and fresh managed loopback artifact                                                                                                                    | Passed | Prettier, scoped ESLint, `npm run validate-product-contracts`, `git diff --check`, scoped stale-copy/source search, and the fresh client/SSR/Nitro production build used by `npm run local:fixture` passed.                                                    |
| Fixture hygiene                    | Named disposable local tester cleanup                                                                                                                                        | Passed | Browser closed; auth/local account removed; all task-user owned row counts returned to zero; managed QA server stopped.                                                                                                                                        |

Browser captures:

- `qa-artifacts/screenshots/2026-08-11/onboarding-bpm-guidance-unblocked-presentation/desktop-dark-initial.png`
- `qa-artifacts/screenshots/2026-08-11/onboarding-bpm-guidance-unblocked-presentation/desktop-dark-age-changed.png`
- `qa-artifacts/screenshots/2026-08-11/onboarding-bpm-guidance-unblocked-presentation/mobile-375-light-current-draft.png`
- `qa-artifacts/screenshots/2026-08-11/onboarding-bpm-guidance-unblocked-presentation/mobile-375-light-manual-ready.png`

The generated provider-backed preview was intentionally not invoked because provider calls were
outside authorization; selecting a goal and observing the enabled existing generated action covers
the corrected readiness gate, but not provider generation. No subagent was used. This is
Implementation DoD for the bounded Frontend Lite correction only; Global QA Acceptance and release
readiness remain unclaimed. Next owner: Product for ordinary lifecycle review. Blockers: none.
