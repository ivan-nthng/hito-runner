# Hito Runner Core Scheduled Completion Authority Copy Closure

## Work Item ID

1bda13d2-341e-4498-9eca-77154d92c18a

## Status

completed

## Type

Bug

## Priority

critical

## Owner

FRONTEND

## Frontend Lane

Product

## Stage

Frontend Product implementation and focused browser acceptance complete

## Next Recommended Role

PRODUCT

## Parent

[Runner Core Baseline And Risk-Derived Regression Gate](./2026-08-17-hito-runner-core-baseline-and-risk-derived-regression-gate.md)

## Scope

The persisted non-FIT result footer in the existing `CompletionPanel`, including its factual branch
matrix. This is the sole confirmed source defect from the complete Runner Core baseline.

## Archive Intent

Compact after the focused Frontend repair and dependent final Runner Core QA replay.

## Task

Remove the false runner-facing plan-authority claim from a scheduled-only completed Calendar
workout. A saved standalone result must say `Saved to this workout.` It must never imply a current
or active plan container.

## Evidence

QA reproduced: create a manual Calendar workout → Add result → Complete → save → reload. Durable
truth has `planCycles:0`, one Calendar workout, one workout log, no FIT activity, no History row,
and no factual Progress observation. Yet
`src/components/CompletionPanel.tsx:620` renders `Saved to your plan.` whenever
`snapshot.source === "persisted"`.

The [Runner Core baseline receipt](./2026-08-17-hito-runner-core-baseline-and-risk-derived-regression-gate.md)
contains the full replay and screenshot evidence.

## Demonstrated Cause

The UI equates the generic persisted-snapshot discriminator with a plan container. Persistence,
Calendar ownership, FIT exclusion, History, and Progress are correct. The first incorrect owner is
the Product copy branch in `CompletionPanel`.

## Expected Behavior

- Saved non-FIT result: `Saved to this workout.`
- FIT-backed result: existing activity-file wording remains intact.
- Unsaved preview: existing `Preview only.` wording remains intact.
- No user-visible current/active/manual plan authority is introduced anywhere in the affected
  CompletionPanel result state.

## What Not To Touch

Do not change Backend facts, Calendar/result persistence, FIT ingestion/removal, History/Progress
membership, plan-source history, Design System primitives/CSS, fixtures, schema/RLS, providers,
hosted state, or Git lifecycle. Do not add state, branches for origin kind, compatibility copy, or
a new component.

## Validation Expectations

Audit the existing CompletionPanel result-copy matrix first. Prove the three persisted non-FIT,
FIT, and preview branches through the smallest existing Product seam; verify standalone durable
truth remains plan-free. Run focused formatting/lint/Product validation, production build, browser
proof at desktop/mobile in Light/Dark, console/overflow checks, and `git diff --check`. Return this
item to PRODUCT for one final QA replay of the whole Runner Core baseline and its remaining
control-path evidence gaps.

## Blocker

None. The full QA report isolated the exact owner and seam.

## Frontend Execution Preflight — 2026-08-17

- **Mode and owner:** Tracked FRONTEND implementation in the authenticated Product lane. The
  Backend/Calendar durable result, FIT exclusion, History membership, and Progress membership are
  accepted read-only facts from the latest Runner Core QA receipt.
- **Visible defect and demonstrated cause:** a persisted standalone non-FIT result renders
  `Saved to your plan.` because the existing footer equates `snapshot.source === "persisted"` with
  runner-facing plan authority. Repository reachability finds this exact false sentence only at
  the `CompletionPanel` footer owner.
- **Existing seam reused:** keep the current three-way footer matrix unchanged: FIT-backed result
  first, persisted non-FIT result second, and preview last. Replace only the persisted non-FIT
  sentence with `Saved to this workout.`
- **New runtime artifacts:** none. No component, helper, state, origin branch, compatibility copy,
  CSS, token, fixture, persistence path, API, schema, dependency, or validator is proposed.
- **Obsolete responsibility removed:** only the persisted branch's false plan-container claim is
  deleted. Existing FIT activity-file wording and `Preview only.` remain byte-for-byte intact;
  unrelated accepted dirty work already present in `CompletionPanel` remains untouched.
- **Focused proof:** source census and exact branch readback; focused Prettier, ESLint, Product and
  manual-workout checks, diff hygiene, uncontended production build, then a fresh serialized
  loopback `qa_fixture` replay of persisted non-FIT, FIT-backed, and preview states at desktop and
  exact 375x812 in Light/Dark with durable truth, containment, and console checks.
- **Return boundary:** stop and return to PRODUCT if replay requires a second production owner,
  Backend/fixture/Design System change, or behavior beyond copy. Otherwise close this Frontend
  slice and return the remaining full Runner Core baseline acceptance to QA through PRODUCT.

## Browser Path Preflight — 2026-08-17

- **Validation layer:** focused Frontend Implementation DoD for the three existing CompletionPanel
  footer branches. This is not the dependent full Runner Core QA replay, Global QA, hosted,
  release, deployment, production, or physical-device acceptance.
- **Runtime admission:** PID 90432 is managed, compatible, healthy, loopback-only, and `qa_fixture`,
  but its artifact is stale/broken on the known private Admin snapshot marker. Because Product
  source changed, one serialized normal managed rebuild/restart is required; browser evidence will
  use only the resulting fresh `receipt_matches` artifact.
- **Fixture and auth boundary:** use only the existing disposable local `qa_fixture` identities and
  canonical reset/seed/UI paths. No direct database shaping, new fixture, personal session, hosted
  account, provider dispatch, retained evidence, or credential disclosure is admitted.
- **Browser matrix:** 1470x801 and exact 375x812, Light and Dark. Prove persisted non-FIT footer plus
  durable standalone truth, retained FIT-backed activity-file footer, retained signed-out preview
  footer, focus/navigation, page containment, and zero console warnings/errors.
- **Cleanup:** remove all task-owned disposable fixture rows through their existing reset paths and
  leave the managed loopback server running. Any later external artifact drift will be reported
  separately from evidence captured on the admitted build.

## Tracked Frontend Implementation Receipt — 2026-08-17

- **Task and stage:** completed the focused Frontend Product correction and browser acceptance for
  the scheduled-completion authority copy. This receipt closes only the implementation slice.
- **Product outcome:** a persisted non-FIT result now says `Saved to this workout.` The existing FIT
  activity-file footer and signed-out `Preview only.` footer remain distinct and unchanged.
- **Root cause and owner:** `CompletionPanel` used the generic persisted-snapshot discriminator as
  if it implied a runner-facing plan container. The first incorrect owner was the existing local
  footer copy branch; Backend result truth and Calendar ownership were not involved.
- **Files changed:** `src/components/CompletionPanel.tsx` changes one sentence in the existing
  three-way footer matrix. This canonical item records preflight and closure. No runtime artifact,
  helper, state, branch, CSS, token, fixture path, API, schema, dependency, or compatibility path
  was added.
- **Preserved boundaries:** the FIT and preview branches remain byte-for-byte intact; no Backend,
  Calendar, History/Progress, source-provenance, Design System, fixture-source, provider, hosted,
  dependency, or Git-lifecycle code changed. Existing unrelated dirty hunks were preserved.

| Check                                  | Scenario / environment                                                                                          | Result | Evidence                                                                                                                                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator                   | `CompletionPanel` footer matrix and repository copy census                                                      | Passed | `Saved to your plan.` has zero `src/` reachability; one persisted non-FIT branch owns `Saved to this workout.` while the FIT and preview strings remain at their existing owner.                                                                                 |
| Focused formatting and lint            | Prettier on the source/item; ESLint on `CompletionPanel.tsx`; `git diff --check`                                | Passed | All commands exited successfully.                                                                                                                                                                                                                                |
| Product contracts                      | `npm run validate-product-contracts`; `npm run validate-manual-workout-authoring`                               | Passed | Existing Calendar/result and manual-authoring contract checks remained green.                                                                                                                                                                                    |
| Production build and runtime admission | Managed QA build, then `qa_fixture` restart at `http://127.0.0.1:3000`                                          | Passed | Client, SSR, Nitro, and postbuild completed; browser proof ran on healthy loopback PID 98769 with `artifactFreshness: fresh` and `receipt_matches`.                                                                                                              |
| Persisted non-FIT branch               | Disposable standalone Calendar workout, save result, reload; 1470x801 Light and 375x812 Dark                    | Passed | `Saved to this workout.` rendered before and after reload; the legacy, FIT, and preview footers were absent. Document/body width equaled viewport and console warning/error logs were empty.                                                                     |
| Standalone durable truth               | Task-owned disposable identity readback before cleanup                                                          | Passed | `planCycles: 0`, one Calendar workout, one workout log, and zero result assets, actual metrics, or comparisons. This confirms the copy change did not create plan or FIT authority.                                                                              |
| FIT-backed branch                      | Canonical local FIT sample through the existing durable upload path and reload; 1470x801 Dark and 375x812 Light | Passed | The result remained `Completed from activity file` and rendered only `Personal feedback only. Run data stays with the activity file.` Durable readback found one asset, one actual-metrics row, and one comparison. No page overflow or console warnings/errors. |
| Preview branch                         | Signed-out preview workout; 1470x801 Light and 375x812 Dark                                                     | Passed | `Preview only.` rendered; persisted non-FIT, FIT, and legacy plan footers were absent. No page overflow or console warnings/errors.                                                                                                                              |
| Cleanup                                | Existing role-scoped `pool-reset` paths                                                                         | Passed | Both task-owned disposable identities returned all owned tables to zero. The managed loopback server was left running.                                                                                                                                           |

- **Post-evidence runtime state:** after the fresh browser matrix and cleanup were complete, the
  still-healthy managed PID 98769 reported `stale/artifact_missing` for the private Admin repository
  snapshot marker. All browser evidence above was captured earlier on the admitted
  `fresh/receipt_matches` artifact; no rebuild loop or cross-owner Admin mutation was attempted.
- **Omitted-proof consequence:** this was not the final full Runner Core baseline replay and does not
  close its separately recorded control-path evidence gaps. No Global QA, hosted, release,
  deployment, production, or physical-device acceptance is claimed.
- **Independent reviewer:** none. The defect was a one-literal existing-owner correction and the
  primary focused browser matrix exercised every footer branch; a reviewer would not have closed
  the remaining parent-wide QA inventory.
- **Next owner:** PRODUCT should return the completed source correction to QA for the final full
  Runner Core baseline closure replay described by the parent item.
- **Blockers:** none in the Frontend Product implementation slice.
