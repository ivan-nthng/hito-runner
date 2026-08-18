# Hito Runner Legacy Plan Copy Removal

## Work Item ID

2026-08-16-hito-runner-legacy-plan-copy-removal

## Status

completed

## Type

Bug — Frontend Product contract correction

## Priority

high

## Owner

FRONTEND

## Stage

Frontend Product copy correction complete — focused local replay passed

## Next Recommended Role

PRODUCT

## Evidence From

[Runner Core Full Local QA Audit And Defect Ledger](./2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md)

## Scope

The manual-admission and no-runner-setup copy in `OnboardingGate.tsx`, `AppShell.tsx`, and `workout.$date.tsx`. This is a presentational correction only; it does not alter manual creation, source-plan authoring, Calendar persistence, setup fields, or routing.

## Task

Remove the false runner-facing claim that a confirmed Calendar requires a current plan. Manual, AI-authored, and imported workouts are independently runner-owned after confirmation; a plan is only an optional source artifact used for initial placement.

Use truthful runner/Calendar setup language for manual admission and the setup guard. Preserve `plan` only where it truthfully means immutable source authoring, source history, import/export, or a Past Plan.

## Demonstrated Cause

QA reproduced the false current-plan wording in three Frontend Product owners:

- `src/components/OnboardingGate.tsx` says the manual baseline is for “this plan” and presents plan-oriented admission copy;
- `src/components/AppShell.tsx` labels onboarding mode `Create plan`;
- `src/routes/workout.$date.tsx` tells a runner with no setup to `Create your plan first`.

The same QA replay established that the persisted Calendar opens without current-plan authority, so this is a false Product contract rather than a persistence defect.

## Reuse And Boundaries

- Reuse the existing manual-admission and setup state; add no component, route, state, storage, feature flag, Design System recipe, backend call, or fixture.
- Do not rename truthful source-artifact/Past Plans/import/export language.
- Do not alter Calendar mutations, source provenance, user-settings requirements, translations, AppShell structure, or unrelated dirty hunks.

## Definition Of Done

1. A manual admission and missing-setup guard describe runner or Calendar setup, never a required current plan.
2. The complete manual path still reaches the independently runner-owned Calendar and existing setup validation/recovery remains intact.
3. Search confirms that the three reported user-facing owners have no false current-plan wording; truthful source/Past Plan vocabulary remains unchanged.
4. Focused Frontend checks and a proportional browser replay pass, with named QA used for one bounded read-only confirmation if a fresh managed artifact is admissible.

## Frontend Execution Preflight — 2026-08-16

- **Mode / owner:** Tracked / FRONTEND Product. AUD-01 is the accepted external discriminator: the
  persisted standalone Calendar is correct, while three current Product copy owners still describe
  admission/setup as requiring a plan.
- **Existing seams and smallest change:** keep the current manual admission, App Shell onboarding,
  and workout missing-setup compositions unchanged; replace only the manual footer helper/action,
  onboarding mode label, and missing-setup sentence with factual runner/Calendar setup wording.
- **Proposed runtime artifacts:** **none**. No component, state, route, helper, token, CSS, translation,
  fixture, dependency, persistence path, or compatibility branch is admitted.
- **Removed/simplified responsibility:** remove only the false current-plan implication from the
  reported user-facing strings. Generated source-plan review/create copy, preview-source language,
  Past Plans, import/export, and internal legacy implementation names remain because this task does
  not own them.
- **Dirty boundary:** `AppShell.tsx` and `workout.$date.tsx` already contain accepted standalone
  Calendar, editor, focus, and sidebar changes from other completed Product items. This task edits
  only the separate reported string literals and preserves all surrounding hunks byte-for-byte.
  `OnboardingGate.tsx` has no existing tracked diff at preflight.
- **Shared lifecycle boundary:** source implementation is disjoint and may proceed. Runtime,
  disposable fixtures, browser sessions, and build output remain serialized shared resources. The
  current managed status is stopped/stale with `artifact_missing`; no restart, reseed, browser
  admission, or build will occur until a fresh ownership check proves the other task is idle.
- **Focused proof:** exact old-string removal and truthful adjacent source-plan vocabulary; focused
  Prettier, ESLint, existing Product/Calendar contract checks, and `git diff --check`; then, only on
  an admissible fresh `qa_fixture`, replay manual admission and the missing-setup guard without
  changing their validation, navigation, or persistence behavior.
- **Stop boundary:** return to PRODUCT before any Backend/persistence, route behavior, source-plan
  semantics, shared Design System, translation/locale, fixture-source, dependency, hosted/provider,
  or Git/release change.

## Handoff Prompt

```text
ROLE: FRONTEND

Lane: Product

Task: Hito Runner Legacy Plan Copy Removal

Mode: Tracked. Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, and skills/hito-qa-browser-regression/SKILL.md before acting.

Canonical item:
docs/tasks/backlog/2026-08-16-hito-runner-legacy-plan-copy-removal.md

QA evidence:
docs/tasks/backlog/2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md (AUD-01)

Outcome:
Remove the false claim that runner onboarding/manual admission requires a current plan. Confirmed Calendar workouts are independently runner-owned; a plan is only an immutable source artifact for initial placement.

First incorrect owners and seams:
- src/components/OnboardingGate.tsx manual-admission footer/action copy;
- src/components/AppShell.tsx onboarding mode label;
- src/routes/workout.$date.tsx missing-setup guard.

Reuse those existing owners and make the smallest copy-only correction. Preserve truthful source plan, Past Plans, import/export, and preview-source language. Do not change persistence, source provenance, Calendar behavior, routes, Design System code, translations, fixtures, dependencies, or unrelated dirty work. Add no runtime artifact.

Validation:
Run focused source search, formatting/lint/diff hygiene, and the existing relevant Product contract checks. Replay the manual admission plus missing-setup guard through the existing local product when a managed artifact is admissible; confirm the original Calendar setup and validation behavior stays intact. You may use the named QA sidebar role for one bounded read-only independent confirmation; do not delegate Frontend implementation. Do not start Global QA or claim release readiness.

Return:
Update only this canonical item with a compact English receipt, exact words/seams changed, validation, and any blocked evidence. Do not create a follow-up task for unrelated locale, plan-source, or Move/Undo work.
```

## Frontend Tracked Implementation Receipt — 2026-08-16

- **Task / stage:** Hito Runner Legacy Plan Copy Removal / Frontend Product copy correction and
  focused local acceptance.
- **Preflight:** AUD-01 remained the external discriminator. The persisted standalone Calendar was
  already correct; only three user-facing Product strings falsely presented a current plan as an
  admission/setup requirement. Existing source-plan review, Past Plans, import/export, preview,
  persistence, routing, and Design System owners remained outside this slice.
- **Product outcome:** manual admission now states that the saved runner baseline is ready and that
  Calendar opens without adding workouts; its action is `Open Calendar`. App Shell onboarding mode
  is `Setup`. The workout guard now asks the runner to complete runner setup before opening workouts.
- **Root cause / owner:** the incorrect contract was copy owned independently by `OnboardingGate`,
  `AppShell`, and the workout missing-setup state. No Backend or Calendar behavior change was needed.
- **Files changed:**
  - `src/components/OnboardingGate.tsx` — replaced
    `Your saved runner baseline will be used for this plan.` with
    `Your saved runner baseline is ready. Your Calendar will open without adding workouts.` and
    changed the manual idle action from `Create plan` to `Open Calendar`;
  - `src/components/AppShell.tsx` — changed the onboarding mode label from `Create plan` to `Setup`;
  - `src/routes/workout.$date.tsx` — changed `Create your plan first, then your workouts will open
here.` to `Complete your runner setup first, then your workouts will open here.`;
  - this canonical item — lifecycle, preflight, and receipt only.
- **Runtime artifacts:** none. The existing components, state, actions, routes, and validation paths
  remain the sole owners. No obsolete runtime branch was introduced or retained by this correction.
- **Preserved boundaries:** generated source-plan creation/review copy, preview-source language, Past
  Plans, import/export, source provenance, user-settings requirements, Calendar mutations, route
  behavior, translations, Design System code, dependencies, and unrelated dirty hunks were unchanged.

| Check                     | Scenario / environment                                                                                | Result | Evidence                                                                                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator      | Three reported Product owners                                                                         | Passed | Exact old helper and guard phrases are absent; `AppShell` no longer contains the onboarding `Create plan` label. Truthful generated source-plan copy remains.                                                                                      |
| Formatting / lint         | Prettier and focused ESLint on the three source files plus this item                                  | Passed | Both commands exited 0.                                                                                                                                                                                                                            |
| Product contracts         | `validate-product-contracts`, `validate-runner-calendar-context`, `validate-manual-workout-authoring` | Passed | All three focused validators exited 0; the manual-workout proof remained non-mutating.                                                                                                                                                             |
| Build / managed admission | Serialized `npm run qa:server:start`                                                                  | Passed | The previously missing artifact was rebuilt successfully; PID 60398 was healthy, loopback-only, and fresh/`receipt_matches` at browser admission.                                                                                                  |
| Manual admission          | `qa-isolation-a@local.test`, 1470×801 Light                                                           | Passed | Normal required baseline validation enabled `Open Calendar`; `Build myself` exposed the exact factual helper; activation opened `Runner Calendar`. Local inventory immediately after activation retained `plan_cycles=0` and `planned_workouts=0`. |
| Missing-setup guard       | Same disposable identity after ordinary pool reset, `/workout/2026-05-05`, 375×812 Dark               | Passed | Exact runner-setup sentence and `Back to Calendar` rendered; return navigation remained intact. Body/document width was 375/375 and console warnings/errors were zero.                                                                             |
| Cleanup                   | Local disposable tester pool                                                                          | Passed | `pool-reset --role isolation-a` left runner profile, plan, workouts, result/evidence, mutation-event, activity, entitlement, and capability rows at zero.                                                                                          |
| Independent QA            | Named `ROLE: QA`, read-only bounded replay                                                            | Passed | Independently confirmed `Setup`, exact manual helper, enabled `Open Calendar` without activation, exact guard, `Back to Calendar`, desktop Light/mobile Dark containment, zero console issues, and no persistence.                                 |
| Diff hygiene              | Checkout                                                                                              | Passed | `git diff --check` exited 0.                                                                                                                                                                                                                       |

- **Coverage / omissions:** this is Implementation DoD only. No locale expansion, source-plan
  semantics review, broad cross-flow matrix, Global QA, hosted, release, or deployment acceptance was
  run or claimed. The QA artifact was fresh at admission and throughout the replay; after proof, an
  unrelated Admin repository snapshot-marker change made checkout-wide status report
  `stale/broken: artifact_missing` while PID 60398 remained healthy. Per the shared lifecycle boundary,
  the server was not rebuilt again and that external drift does not invalidate the admitted browser
  evidence.
- **Role / skills / review:** `agents/frontend.agent.md`;
  `skills/hito-frontend-design-system/SKILL.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the local Browser control skill for the rendered
  replay; one existing named `ROLE: QA` reviewer was reused read-only and is closed.
- **Next owner:** PRODUCT for backlog routing only.
- **Blockers:** none for this Frontend slice.
