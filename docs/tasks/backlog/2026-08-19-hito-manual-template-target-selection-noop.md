# Hito Manual Template Target Selection No-Op

Work Item ID: `2026-08-19-hito-manual-template-target-selection-noop`
Status: in_progress
Type: Bug
Priority: highest
Owner: FRONTEND

## Scope

Restore target selection in the existing manual-workout constructor when a runner starts from the
`Easy` template. Selecting an eligible target must update the visible draft and leave the runner
able to review and save the workout through the existing server-authoritative path.

## Archive Intent

Retain the root-cause and proof because manual workout creation is a Runner Core critical journey.

## Task

Reproduce the reported no-op from `Add workout → Choose template → Easy → Warm-up → Target`.
Identify the first Frontend owner of the failed selection event/state transition and make the
smallest fix there. Do not redesign the constructor, replace the modal, add a menu primitive, or
change target/persistence semantics in this urgent repair.

## User Report

Ivan cannot create a manual workout: after choosing the Easy template and a Warm-up section with a
10-minute duration, opening Target shows options but choosing one does not apply it. He also reports
missing type-selection hover affordance, but that UX improvement is explicitly deferred from this
P0 capability repair.

## Evidence

- User screenshot: `/Users/ivan/Desktop/Screenshot 2026-08-19 at 10.22.25.png`.
- The screenshot shows the Target dropdown open with `No target`, `Pace`, `Pace range`, `HR cap`,
  `HR range`, and `RPE`; it does not by itself prove the event/state owner.

## Observed Behavior

Target options are rendered in the manual Easy-template constructor, but selecting an option is a
visible no-op and blocks the runner from authoring the intended workout.

## Expected Behavior

An eligible target selection updates the current section's target presentation and required target
fields according to the existing manual-workout document contract. Review and confirmation preserve
that target exactly and save one runner-owned Calendar workout without creating plan authority.

## Required Discriminator

Use a fresh local authenticated `qa_fixture` browser replay to determine whether the first failure is
the option event, constructor draft state, derived field rendering, review projection, or server
action. Do not report a source cause until the interaction trace proves it.

## What Not To Touch

- Do not alter Backend target taxonomy, manual-workout persistence, review integrity, Calendar
  authority, source provenance, FIT/evidence, schema, migrations, or provider paths.
- Do not fold in the broader hover, type-selector, modal, or Design System redesign.
- Do not add a local persistence path, compatibility target model, new component family, stylesheet,
  dependency, fixture framework, or unrelated refactor.
- Do not stage, commit, push, deploy, mutate hosted data, or use Ivan's personal account in this
  implementation slice.

## Validation Expectations

Prove the Easy-template target selection, target-specific field transition, review, confirmation,
persisted reload, and one-workout-only Calendar result in the existing local fixture. Include
keyboard/pointer behavior, focus return, console/overflow check, focused source/type validation,
Prettier, ESLint, diff hygiene, and production build. Use independent QA after the Frontend slice;
if QA finds a task-owned defect, FRONTEND fixes it forward and returns the exact scenario to QA.

## Stage

FRONTEND Product production-disparity reproduction. The local fixture passed, but Ivan remains
blocked on the real screen; this item is reopened until that observed path is explained and the
runner can complete manual authoring.

## Next Recommended Role

FRONTEND

## Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Manual Template Target Selection No-Op
Mode: Tracked
Frontend lane: Product
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-manual-template-target-selection-noop.md
Evidence: /Users/ivan/Desktop/Screenshot 2026-08-19 at 10.22.25.png

Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, the
canonical item, and only the existing manual-workout template entry, constructor target control,
target document/review contract, and focused manual-authoring proof seams. Do not read architecture
phases, redesign the modal, or inspect unrelated Calendar flows.

Reproduce in a fresh local authenticated qa_fixture: Add workout → Choose template → Easy → select
the Warm-up section → Target. The user reports that options render but selection is a no-op. Establish
the first incorrect Frontend event/state/render owner from an interaction trace, then make the
smallest source fix there. Preserve Backend target taxonomy, server review/confirm truth,
runner-owned Calendar authority, source provenance, and all other manual mutations.

Definition of done: selecting at least one non-empty eligible target visibly applies it and exposes
only its existing required fields; review/confirm preserves it through persisted reload; exactly one
runner-owned workout is created and zero plan containers are created. Verify pointer/keyboard,
focus return, console/overflow, focused Product/manual-authoring checks, Prettier, ESLint, diff
hygiene, and production build. Then autonomously send the bounded scenario to named QA. Fix any
task-owned QA finding forward before closing. Do not stage, commit, push, deploy, mutate hosted data,
use Ivan's personal account, or fold in hover/modal redesign work.
```

## Tracked Implementation Receipt — 2026-08-19

### Preflight And Demonstrated Cause

- Reused the existing `ManualWorkoutAddMenu` → template picker →
  `ManualWorkoutConstructorDialog` chain and its controlled target/document/review contract. New
  production runtime artifacts: none.
- The reported target-selection no-op did not reproduce on a fresh authenticated `qa_fixture`:
  pointer selection applied `Pace`, keyboard selection applied `Pace range`, and each selection
  exposed only its existing required value field. The existing controlled Select, constructor draft,
  review projection, and server confirmation path were preserved rather than patched speculatively.
- Independent QA demonstrated the task-owned defect that remained in the same flow: closing the
  constructor with Escape left focus on `document.body`. The chained menu/template/dialog opening
  sequence gave the constructor no live Radix trigger association for close-focus restoration. The
  first incorrect owner was the existing `ManualWorkoutAddMenu` dialog composition seam.
- The focused correction retains a ref to the existing Add-workout trigger and uses the existing
  dialog `onCloseAutoFocus` seam to return focus there. No target taxonomy, state model, persistence,
  shared Design System, Calendar authority, or Backend behavior changed. No obsolete target branch
  was removed because source and runtime evidence proved it remains correct.

### Files Changed

- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx` — route-local/manual-authoring
  focus restoration only.
- `docs/tasks/backlog/2026-08-19-hito-manual-template-target-selection-noop.md` — lifecycle and
  evidence receipt.

### Validation

| Check                     | Scenario / environment                                        | Result  | Evidence                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Target interaction        | Fresh loopback `qa_fixture`, Easy template, Warm-up           | Passed  | Pointer `Pace` and native keyboard `Pace range` visibly updated the trigger and exposed only the matching existing value field.                                                                                                                                                                                                                                                |
| Review and durable truth  | `Pace · 5:10/km`, confirm, reload                             | Passed  | Exactly one runner-owned Aug 20 workout retained the target; fixture inventory showed one `planned_workouts` row and zero `plan_cycles`.                                                                                                                                                                                                                                       |
| Focus fix                 | Fresh current-source `qa_fixture`, Aug 19, Pace range, Escape | Passed  | Active element returned to the originating `Wed, Aug 19. Add workout.` button.                                                                                                                                                                                                                                                                                                 |
| Containment and console   | Desktop focused replay                                        | Passed  | `innerWidth` and document `scrollWidth` were both 1280; browser warnings/errors were empty.                                                                                                                                                                                                                                                                                    |
| Manual authoring contract | `npm run validate-manual-workout-authoring`                   | Passed  | Existing document/review/confirm assertions remained green.                                                                                                                                                                                                                                                                                                                    |
| Static hygiene            | Focused Prettier, ESLint, and `git diff --check`              | Passed  | Changed source and this item are formatted; lint and diff hygiene are clean.                                                                                                                                                                                                                                                                                                   |
| Production build          | Isolated writable QA runtime root under `/private/tmp`        | Passed  | Client, SSR, Nitro, postbuild, and integrity checks completed; the default cache path was unavailable only because of the workspace sandbox.                                                                                                                                                                                                                                   |
| Independent QA            | Named QA replay before and after fix                          | Partial | QA independently passed pointer, keyboard, persisted readback, containment, and console, and found the focus regression fixed here. Its post-fix delta browser replay could not run because every non-personal supported browser surface was unavailable; the fresh primary replay above closes the changed behavior, but independent post-fix confirmation remains unclaimed. |

### Product Reopen — 2026-08-19

- Ivan confirms the manual Target interaction still prevents his real workout creation after the
  local fixture replay. The prior receipt therefore proves only the fixture contract, not closure
  of the reported runner path.
- Next discriminator: determine the exact deployment/version and interaction path on the reported
  screen without using Ivan's authenticated session or changing any hosted state. If the deployed
  bundle differs from the verified source, report that release boundary; if it is the same, trace
  the first state/event difference and repair only that owner.
- Do not reopen the deferred hover/type-selector/modal redesign.

### Boundaries And Return

- Hover/modal redesign, Global QA, hosted acceptance, release readiness, staging, commit, push, and
  deployment were not performed or claimed.
- Role file: `agents/frontend.agent.md`. Project skill:
  `skills/hito-frontend-design-system/SKILL.md`; browser procedure:
  `skills/hito-qa-browser-regression/SKILL.md` through the supported in-app browser surface.
- Named subagent: QA, bounded read-only browser review. No Frontend implementation was delegated.
- Next owner: PRODUCT for any broader acceptance or release routing. Blockers: none for the
  Frontend implementation slice; independent post-fix browser confirmation is the stated coverage
  gap.
