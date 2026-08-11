# Onboarding Heart-Rate Guidance Auto-Reveal

## Work Item ID

2026-08-11-onboarding-heart-rate-guidance-auto-reveal

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

authenticated onboarding baseline and Heart-rate guidance presentation

## Archive Intent

retain_in_place

## Stage

FRONTEND Product implementation and focused browser evidence completed.

## Task

Remove the extra onboarding `Show BPM guidance` step. When the runner first supplies valid required
baseline values, immediately reveal the existing editable estimated BPM guidance through the shared
HeartRateProfileSection. If the runner later changes baseline input, do not silently recompute on
each keystroke. Require the existing `Recommended` action to refresh the estimate for the current
values before the runner continues with plan creation.

## Product Decision

- The current canonical estimate is derived from **age**. Height and weight remain mandatory runner
  profile facts but do not affect the existing BPM formula; do not invent a multi-factor estimate.
- The first valid onboarding baseline shows estimated ranges automatically, without a separate
  `Show BPM guidance` button or an unnecessary server round-trip.
- Once shown, changing any relevant baseline fact leaves the previous guidance visibly stale and
  requires the existing `Recommended` action to apply a refreshed estimate. Do not auto-save or
  repeatedly recompute while fields are edited.
- A real loading/skeleton state is allowed only for actual asynchronous work. Do not simulate a
  loader around the deterministic canonical calculation.
- Existing plan/manual creation persists the chosen current baseline and guidance through its
  existing canonical action. No new persistence flow is authorized.

## Evidence And Root Cause

- `buildHeartRateZonesSummary(age)` in `src/lib/heart-rate-zones.ts` is the canonical deterministic
  estimate and needs age, not height/weight.
- `OnboardingRunnerHeartRateProfile` currently hides the editor until `summary` is available and
  exposes `Show BPM guidance`; that control calls `useOnboardingRunnerBaseline.prepare()`, which
  persists the baseline before returning a summary.
- `HeartRateProfileSection` already owns the existing `Recommended` action, editable draft, and
  `HeartRateProfileDraftState` used by the canonical creation flow.
- The first incorrect owner is FRONTEND Product onboarding presentation/state timing, not Backend
  estimation, persistence, RLS, or a new provider/API.

## Reuse-First Boundary

Reuse `buildHeartRateZonesSummary`, `HeartRateProfileSection`, `OnboardingRunnerHeartRateProfile`,
`useOnboardingRunnerBaseline`, existing draft-state callbacks, and the current plan/manual save
actions. Expected new production runtime artifacts: **none**. Do not add a BPM endpoint, helper
service, cache/store, provider, schema/migration/RPC, new profile field, duplicate editor, or a
second onboarding heart-rate component.

Do not change the estimation formula, health claims, settings/replacement consumers, heart-rate
storage model, runner baseline validation, plan/workout truth, auth, provider behavior, Figma,
Design System primitive APIs/CSS, or unrelated dirty work.

## Validation Expectations

| Check                  | Scenario / environment                                                 | Required evidence                                                                                 |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Initial reveal         | New valid onboarding baseline                                          | Estimated editable BPM guidance appears without Show BPM guidance or an invented loader           |
| Stale/refresh          | Change baseline after first reveal                                     | Existing range remains until Recommended; Recommended applies current canonical age estimate      |
| Persistence boundary   | Create plan/manual through existing path                               | Existing action persists selected current baseline/guidance; no new write path or repeated writes |
| Shared-consumer safety | Settings and replacement source map                                    | Shared HeartRateProfileSection behavior remains truthful outside onboarding                       |
| Browser/static         | Desktop and exact 375px, keyboard, console, formatting/lint/diff/build | Contained, accessible, no regressions in touched onboarding flow                                  |

## Next Recommended Role

product

## Frontend Implementation Receipt — 2026-08-11

- **Mode and preflight:** Tracked FRONTEND Product work. The source discriminator confirmed that the
  onboarding-only `Show BPM guidance` control called `prepare()`, which saved the baseline merely to
  expose the existing editor. The first incorrect owner was the onboarding presentation/state seam;
  Backend, the canonical age formula, and shared Design System source were not change owners.
- **Implementation:** the first valid baseline now creates a local age-derived guidance snapshot and
  reveals the existing `HeartRateProfileSection` immediately. A later baseline change leaves the
  rendered ranges unchanged, marks the snapshot stale, and hides plan methods until the runner
  activates the existing `Recommended` button. That activation applies the current canonical age
  estimate locally; the existing generated/manual creation path remains the only persistence path.
- **Reuse and change budget:** reused `buildHeartRateZonesSummary(age)`,
  `HeartRateProfileSection`, `useOnboardingRunnerBaseline`, current draft publication, and existing
  plan/manual callers. Added no production file, API, state store, loader, persistence shape, or
  Design System artifact. Removed the obsolete onboarding `prepare`/`canPrepare` and button branch.
- **Files changed:** `src/components/onboarding/use-onboarding-runner-baseline.ts`,
  `src/components/onboarding/OnboardingRunnerBaseline.tsx`,
  `src/components/settings/HeartRateProfileSection.tsx`, the BPM prop wiring only in
  `src/components/OnboardingGate.tsx`, and this item. Existing concurrent method-card composition in
  `OnboardingGate.tsx` was preserved.
- **Fixture lifecycle:** used a disposable local tester only. The browser session was closed and the
  account plus its one runner profile and one zero-workout manual plan cycle were removed through the
  ordinary test-user cleanup command; all post-cleanup owned-row counts were zero.

| Check                        | Scenario / environment                                   | Result | Evidence                                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initial auto-reveal          | `/`, new local tester, desktop light 1440×1000           | Passed | Valid age `34`, height `178`, weight `72`, and the existing `running_regularly` default revealed five editable zones and `Recommended`; no `Show BPM guidance`, busy state, or method duplication            |
| No immediate save            | Same session before creation, full reload                | Passed | Reload returned `Add age`, `Add height`, and `Add weight`; guidance and plan-method tabs were absent                                                                                                         |
| Stale estimate gate          | Age changed `34 → 44` after initial reveal               | Passed | All ten previous BPM endpoints remained `100/120, 110/130, 110/140, 130/145, 145/160`; stale status appeared, no loader rendered, and plan-method tabs were absent                                           |
| Explicit refresh             | Focused `Recommended`, native Enter                      | Passed | Focus remained on the semantic button; endpoints updated to `95/115, 105/125, 105/135, 125/140, 140/155`; stale status cleared and the method card returned                                                  |
| Existing persistence path    | Keyboard-selected `Build myself`, existing `Create plan` | Passed | Existing server functions completed successfully; onboarding exited to the empty Calendar; local receipt showed `runner_profiles=1`, `plan_cycles=1`, `planned_workouts=0` before cleanup                    |
| Responsive/theme/containment | Desktop light and exact 375×812 dark                     | Passed | `scrollWidth - clientWidth = 0`; all five guidance lanes and both method tabs stayed inside the 375px viewport; retained screenshots under `qa-artifacts/screenshots/2026-08-11/onboarding-bpm-auto-reveal/` |
| Keyboard and accessibility   | Recommended button and enclosed method tabs              | Passed | `Recommended` was focused and activated by Enter; ArrowRight moved selection/focus from `Create a plan` to `Build myself`; stale notice used `role=status`                                                   |
| Browser health               | Managed fresh loopback production artifact, focused flow | Passed | No framework overlay, console error, or page error; runtime logs recorded successful requests/actions                                                                                                        |
| Product/static contracts     | Focused source map and product validators                | Passed | No legacy prepare/show references remain; `validate-product-contracts` passed heart-rate editor and workout-comparison contracts                                                                             |
| Formatting/lint/diff/build   | Changed source and item; production build                | Passed | Prettier, scoped ESLint, `git diff --check`, Vite client/SSR/Nitro production build, and fresh managed artifact receipt passed                                                                               |

- **Omitted-proof consequence:** the shared Settings UI was not separately replayed after the managed
  runtime stopped following the required creation proof. Its behavior is protected by the optional
  onboarding-only callback (no Settings caller passes it), the source consumer map, focused product
  contracts, and the production build, but this receipt does not claim an additional rendered
  Settings regression pass. Generated-plan provider execution, hosted state, full cross-flow Global
  QA, release readiness, staging, commit, push, and deployment were not run or claimed.
- **Implementation DoD:** Passed. **Global QA Acceptance:** not run and not claimed.
- **Blockers:** none.
