Status

Complete / Closed

Owner

Architect / Backend / Frontend / QA

Last Updated

2026-05-20

Task

Bring the current Hito Running architecture back under control without changing live product behavior.

Stage

ARCHITECT closeout

Closeout Note

This cleanup track achieved its main purpose and is archived. `training-api.ts` was narrowed from a broad backend hub to wrapper/facade shape, `PlanManagementDialog.tsx` was decomposed into focused plan-management components, `CompletionPanel.tsx` was reduced through body-note, deterministic comparison, and AI insight readback extractions, and `/changelog` helper logic moved into `src/lib/changelog-utils.ts`.

Remaining candidates are backlog, not blockers:

- duplicated JSON import validation/paste flow
- `voice-to-plan-authoring.ts` internal decomposition
- `imported-plan.ts` contract/normalization/summary split
- utility dialog lazy-loading
- any remaining Garmin browser-boundary warning only if still reproduced by build output

No immediate next cleanup slice is recommended.

Context

The product is now functionally rich and mostly QA-green across:

- auth and saved mode
- structured first-plan onboarding
- transcript-backed Dictate-to-Plan review and confirm
- advanced JSON import/apply
- active-plan refresh proposal and apply
- Garmin upload, deterministic comparison, and bounded AI interpretation
- modal consolidation and simplified shell/product language

The system is no longer suffering from one missing capability.

It is now carrying architecture weight in a few large files and mixed-responsibility seams.

This plan defines one practical cleanup order that:

- prefers deletion over new abstraction
- prefers bounded ownership over broad rewrites
- keeps canonical write paths sequential
- improves build health and bundle boundaries
- reduces future feature cost

Non-Negotiable Rules

- Do not change live product behavior unless a slice explicitly says so.
- Do not parallelize canonical write paths for plan creation, plan apply, refresh apply, or workout-log persistence.
- Do not introduce a new framework, workflow engine, queue, or permissions system.
- Do not split deep deterministic generation logic until upstream boundary cleanup is complete.
- Temporary compatibility layers are allowed only with an explicit removal step.

Architecture Goals

1. Make the large shared hubs smaller.
2. Make ownership boundaries easier to reason about.
3. Remove duplicated domain rules and UI validation flows.
4. Fix real build warnings and client-bundle waste.
5. Keep the canonical pipeline explicit:
   first-plan input -> validation/translation -> canonical plan generation -> safe apply/persist

Current Hotspots

Highest-risk oversized or mixed-responsibility files:

- `src/components/CompletionPanel.tsx`
- `src/routes/changelog.tsx`
- `src/components/PlanManagementDialog.tsx`
- `src/lib/training-api.ts`
- `src/lib/voice-to-plan-authoring.ts`
- `src/lib/imported-plan.ts`
- `src/lib/structured-plan-authoring.ts`
- `src/lib/training.ts`

Current file sizes at audit time:

- `src/components/CompletionPanel.tsx` — 2963 lines
- `src/routes/changelog.tsx` — 713 lines
- `src/routes/hitoDS.tsx` — 1949 lines
- `src/lib/training-api.ts` — 1918 lines
- `src/lib/voice-to-plan-authoring.ts` — 1482 lines
- `src/components/PlanManagementDialog.tsx` — 1414 lines
- `src/lib/imported-plan.ts` — 1252 lines
- `src/lib/structured-plan-authoring.ts` — 1167 lines
- `src/lib/training.ts` — 995 lines
- `src/lib/workout-result-import/compare-workout-result.ts` — 934 lines
- `src/lib/workout-result-import/ingest-garmin-result.ts` — 859 lines

Root Cause Summary

The architecture has three real problems:

1. Central hubs still carry too many unrelated responsibilities.
2. Utility and validation logic is still duplicated in a few neighboring flows.
3. Client bundle boundaries are looser than they should be for utility dialogs and server-only Garmin code.

4. A few utility/reference routes now carry too much local parsing and presentation logic in one file.

The clearest example is:

- `src/routes/changelog.tsx`

It currently mixes:

- route shell and tab state
- markdown parsing
- month/day grouping
- highlight classification heuristics
- milestone title derivation
- inline markdown rendering
- date/count formatting

This is acceptable for a non-primary utility route in the short term, but it should not stay as an unowned 700+ line mixed file indefinitely.

This means the right cleanup is not “rewrite the app”.

It is:

- delete dead compatibility seams
- reduce mixed-responsibility files
- tighten server/client boundaries
- share a few small utilities where duplication is proven

Checklist

- [ ] Remove dead compatibility seams from `training-api.ts`
- [ ] Fix Garmin server-only browser-boundary warning path
- [x] Reduce `training-api.ts` to a narrower route/data hub
  - active-plan export actions moved to `src/lib/active-plan-export-actions.ts`
  - active-plan lifecycle actions moved to `src/lib/active-plan-lifecycle-actions.ts`
    with public delete/clear server-action wrappers now bound top-level in `training-api.ts` for TanStack request-auth compatibility
  - user-settings actions moved to `src/lib/user-settings-actions.ts`
  - active-plan refresh actions moved to `src/lib/active-plan-refresh-actions.ts`
  - plan-replacement actions moved to `src/lib/plan-replacement-actions.ts`
- [ ] Split `PlanManagementDialog.tsx` by product responsibility
  - [x] First bounded frontend slice:
        exported the saved-mode `Open plan` export dropdown UI into `src/components/plan-management/PlanExportMenu.tsx` while leaving export actions, status, errors, and iframe download orchestration in the parent dialog.
  - [x] Second bounded frontend slice:
        exported the refresh proposal prompt/review UI into `src/components/plan-management/PlanRefreshPanel.tsx` while leaving proposal generation, apply calls, refresh state, stale/error handling, and success navigation in the parent dialog.
  - [x] Third bounded frontend slice:
        exported the advanced JSON import UI into `src/components/plan-management/PlanImportPanel.tsx` while leaving imported-plan validation, file-read state updates, import/apply server calls, clear-before-import sequencing, and success/failure navigation in the parent dialog.
  - [x] Fourth bounded frontend slice:
        exported the clear-upcoming and delete/archive lifecycle controls into `src/components/plan-management/PlanLifecycleControls.tsx` while leaving confirmation state, lifecycle action calls, status/error handling, and success navigation in the parent dialog.
  - [x] Fifth bounded frontend slice:
        exported the text-based replacement UI into `src/components/plan-management/PlanTextReplacementPanel.tsx` while leaving prompt state, minimum-length validation, `completeTextOnboarding` server calls, replacement status/errors, and success navigation in the parent dialog.
  - [x] Sixth bounded frontend slice:
        exported the active-plan summary/header UI into `src/components/plan-management/PlanSummaryHeader.tsx` while leaving export status/errors, export download orchestration, timers, reset behavior, and server-action calls in the parent dialog.
  - [ ] Next candidate:
        decide whether the remaining parent should stay as the modal orchestrator or be considered complete for this phase.
- [ ] Split `CompletionPanel.tsx` by feedback/logging/body-note sections
  - [x] First bounded frontend slice:
        exported the workout-scoped body-note summary/modal editor UI into `src/components/workout-completion/BodyNotesEditor.tsx` while leaving completion form state, workout-log save payload construction, `saveWorkoutLog`, route invalidation, Garmin upload/remove, and feedback/readback orchestration in the parent panel.
  - [x] Follow-up fix:
        reconciled `CompletionPanel` local form state and dirty baseline immediately after successful workout-log saves, then refreshed route data non-blockingly so Safari no longer stays in a stale saving/unsaved state after persisted completed, partial, or skipped results.
  - [x] Second bounded frontend slice:
        exported the deterministic plan-vs-run comparison readback UI into `src/components/workout-completion/WorkoutComparisonReadback.tsx` while leaving Garmin upload/remove mutation orchestration, file input handling, route invalidation, manual save logic, body-note integration, and AI insight rendering in the parent panel.
  - [x] Third bounded frontend slice:
        exported the bounded AI insight readback UI into `src/components/workout-completion/WorkoutAiInsightReadback.tsx` while leaving `WorkoutFeedbackPanel`, feedback data selection, Garmin upload/remove mutation orchestration, file input handling, route invalidation, manual save logic, and body-note integration in the parent panel.
  - [ ] Next candidate:
        extract one non-mutating Feedback upload/result presentation slice while keeping Garmin mutations and feedback tab state in the parent.
- [ ] Collapse duplicated JSON import validation/paste flow
- [ ] Further reduce `voice-to-plan-authoring.ts` into bounded submodules
- [ ] Recheck `imported-plan.ts` for contract-vs-normalization-vs-summary split
- [x] Simplify `src/routes/changelog.tsx` into a small utility route plus extracted changelog parsing/presentation helpers
  - [x] First bounded frontend slice:
        moved pure markdown parsing, date/month/year grouping, source-derived count and last-updated helpers, highlight classification, and milestone title derivation into `src/lib/changelog-utils.ts` while keeping route shell, tab state, timeline JSX, visual hierarchy, and the raw markdown source import in `src/routes/changelog.tsx`.
- [ ] Lazy-load utility dialogs from shell
- [ ] Re-run build and focused regression after each bounded slice

Phased Plan

Phase 0 — Cleanup Guardrails

Goal

Establish the execution rules for the cleanup so the team does not broaden it into redesign or unstable refactor churn.

Actions

- Treat every slice as behavior-preserving unless explicitly stated otherwise.
- Require one clear owner per slice.
- Require build verification after backend boundary changes.
- Require route-level focused QA after frontend extraction changes.

Why first

This keeps the cleanup incremental and prevents “while we are here” rewrites.

Owner

Architect

Exit for this phase

- This plan is the canonical source for cleanup ordering.

Phase 1 — Delete Dead Compatibility Seams

Goal

Make the codebase smaller before adding any new structure.

Primary targets

- `src/lib/training-api.ts`

Likely deletions

- unused `completeStructuredOnboarding`
- unused re-export(s) that are no longer consumed externally
- any stale helper kept only for earlier transition paths if repo search confirms zero current callers

Why first

- Highest confidence
- Lowest risk
- Follows deletion-first rule

Expected outcome

- smaller `training-api.ts`
- less confusion about which first-plan mutation is actually canonical

Risk

- accidentally removing a compatibility seam still used by one route or one modal

Mitigation

- repo-wide reference search before deletion
- build immediately after deletion

Owner

BACKEND

QA expectation

- no visible onboarding/import/refresh regression
- `npm run build` still succeeds

Phase 2 — Fix Garmin Server-Only Boundary

Goal

Remove the real browser-compatibility warning path from build output.

Primary targets

- `src/lib/workout-result-import/ingest-garmin-result.ts`
- `src/routes/api.workout-result.upload.tsx`
- `src/routes/api.workout-result.remove.tsx`
- any helper import path that still causes Vite browser resolution of Node-only modules

What to do

- ensure Node-only Garmin ingest/archive/ZIP parsing is only referenced through server-only route seams
- keep `types.ts` as the safe shared client/server contract
- stop browser build from resolving:
  - `node:fs/promises`
  - `node:path`
  - `node:os`
  - `yauzl`

Why now

- this is the clearest current build warning tied to repo-owned code
- it is a real boundary issue, not cosmetic code-style debt

Expected outcome

- cleaner build output
- lower risk of accidental browser bundle pollution

Risk

- breaking upload/remove route behavior while tightening import boundaries

Mitigation

- change only boundary wiring, not parse logic
- verify upload/remove routes after build

Owner

BACKEND

QA expectation

- build no longer shows the Garmin browser-externalization warning path
- upload/remove still works

Phase 3 — Shrink `training-api.ts` Further

Goal

Reduce the remaining cross-product hub into a narrower route/data entrypoint module.

Primary targets

- `src/lib/training-api.ts`

Recommended extraction candidates

- settings/account route mutations and summary types — completed through `src/lib/user-settings-actions.ts`
- export helpers and export server action glue — completed through `src/lib/active-plan-export-actions.ts`
- active-plan lifecycle delete/clear helper glue — completed through `src/lib/active-plan-lifecycle-actions.ts`, with top-level server-action wrappers retained in `training-api.ts`
- workout-log save validation and persistence — completed through `src/lib/workout-log-actions.ts`
- auth/login route data, Magic Link, and callback exchange helpers — completed through `src/lib/auth-actions.ts`
- home/shell/workout/progress route-data helper shaping — completed through `src/lib/route-data-actions.ts`
- refresh proposal/apply action glue — completed through `src/lib/active-plan-refresh-actions.ts`
- imported-plan/text-plan replacement action glue — completed through `src/lib/plan-replacement-actions.ts`
- workout-result upload/remove route helper glue if still mixed into the general hub

What not to do

- do not extract everything into many tiny files
- do not move deterministic business logic just to satisfy file length

Rule for extraction

Only extract if the new module has a clear domain identity and causes a meaningful net reduction of mixed concerns in `training-api.ts`.

Expected outcome

- `training-api.ts` becomes mainly:
  - shared route loaders
  - auth entrypoints
  - truly cross-route snapshot shaping

Risk

- over-splitting into a confusing forest of tiny API files

Mitigation

- one extraction at a time
- each extraction must remove a coherent responsibility block

Owner

BACKEND

QA expectation

- route loaders unchanged
- saved mode still resolves correctly

Phase 4 — Split `PlanManagementDialog.tsx`

Goal

Reduce the largest modal surface into smaller, owned sections without changing the modal contract.

Primary targets

- `src/components/PlanManagementDialog.tsx`

Recommended decomposition

- active plan summary + top actions
- text-based replacement section
- advanced JSON import section
- export section
- refresh proposal/review/apply section
- destructive delete/clear section

What should remain local

- modal shell layout
- toast choreography specific to this surface

What should become shared if duplication is proven

- JSON import validation/readout helpers already duplicated with `UploadJsonDialog` and onboarding

Expected outcome

- smaller file
- easier ownership for future plan-management changes

Risk

- state choreography regression across many subsections

Mitigation

- extract presentational/section state gradually
- preserve one modal owner component

Owner

FRONTEND

QA expectation

- `Open plan` behavior unchanged
- refresh/apply still works
- export still works
- JSON import still works

Phase 5 — Split `CompletionPanel.tsx`

Goal

Reduce the biggest runner-facing component into clear ownership slices.

Primary targets

- `src/components/CompletionPanel.tsx`

Recommended decomposition

- manual log-result form
- saved-result readback summary
- Garmin upload / evidence row
- deterministic comparison display
- AI interpretation display
- body-note modal and body-note summary

Why after `PlanManagementDialog`

- `CompletionPanel` is the biggest file, but it also touches the most visible runner-facing detail flow
- it deserves careful UI-stable extraction rather than being first

Expected outcome

- smaller route payload ownership
- easier testing and review
- lower fear cost for future feedback/logging work

Risk

- subtle visual hierarchy regressions
- tab-state or save-state regressions

Mitigation

- do not change route contract
- do not change visible copy in the same slice unless necessary

Owner

FRONTEND

QA expectation

- workout detail behavior unchanged
- `Log result` and `Feedback` parity maintained
- body-note modal still works

Phase 6 — Collapse Duplicated JSON Import UI Logic

Goal

Stop maintaining the same JSON validation/paste/start-date/import helper flow in three places.

Primary targets

- `src/components/OnboardingGate.tsx`
- `src/components/UploadJsonDialog.tsx`
- `src/components/PlanManagementDialog.tsx`

Current duplicated concerns

- `validateImportedPlanJson(...)` handling
- field-issue formatting
- paste/file-read validation flow
- requested-start-date apply gating
- replace-today error shaping

Preferred approach

- one small shared helper or one small shared import-body component
- keep host-surface-specific copy and chrome local

What not to do

- do not invent a form framework
- do not merge onboarding JSON fallback and saved-mode import into one giant unified surface

Owner

FRONTEND

QA expectation

- onboarding Advanced still works
- shell import dialog still works
- `Open plan` import still works if still distinct

Phase 7 — Split `voice-to-plan-authoring.ts`

Goal

Reduce one large backend file that currently mixes multiple responsibilities.

Primary targets

- `src/lib/voice-to-plan-authoring.ts`

Recommended split

- contract/schema
- transcript sufficiency evaluation
- transcript inference
- review verdict shaping
- confirm parsing

What should stay unified

- one canonical public voice-to-plan interface
- one public result contract

Why later

- this file is large, but its current product behavior is QA-green and bounded
- it is safer to split after the higher-value dead-code/boundary/frontend cleanup slices

Owner

BACKEND

QA expectation

- no change to transcript review/clarification/confirm behavior

Phase 8 — Revisit `imported-plan.ts` and `training.ts`

Goal

Only after the earlier slices, evaluate whether the remaining large canonical seams should be split further.

Primary targets

- `src/lib/imported-plan.ts`
- `src/lib/training.ts`

Decision rule

Split only if the file contains clearly separable responsibilities that are currently slowing development.

Likely split directions

For `imported-plan.ts`:

- contract/schema
- runtime-noise exclusion / canonical normalization
- summaries/template helpers

For `training.ts`:

- snapshot shaping
- week-status / aggregate derivation
- workout formatting helpers

Why explicitly late

- both files are canonical seams
- premature splitting here is more dangerous than helpful

Owner

Architect + Backend

QA expectation

- no product behavior drift

Phase 9 — Simplify `ChangeLog` Utility Route

Goal

Keep the `ChangeLog` page useful without letting it remain a growing mixed-responsibility utility route.

Primary targets

- `src/routes/changelog.tsx`
- optionally one small extracted helper such as:
  - `src/lib/changelog-page.ts`
  - or `src/lib/changelog-view-model.ts`

Current problem

`src/routes/changelog.tsx` is now large enough to justify cleanup, but it is not a core runner-facing path.

It currently combines:

- route-level page rendering
- tab state
- raw markdown parsing from `docs/history/changelog.md`
- day/month grouping
- highlight extraction heuristics
- milestone classification/title derivation
- date/count formatting helpers
- inline markdown token rendering

Why this is later, not earlier

- it is isolated
- it is not part of the main plan/workout/auth critical path
- the page is functionally fine today
- the larger core architecture wins are still elsewhere

Preferred simplification direction

- keep one route component
- extract pure changelog parsing/presentation helpers out of the route file
- do not turn changelog into a CMS
- do not add server persistence, search, filters, or pagination unless a real product need appears

Suggested bounded split

- route page shell + tab state stays in `src/routes/changelog.tsx`
- pure parsing and grouping moves to one small helper module
- pure highlight classification/title/badge heuristics moves to the same helper module unless it becomes too large
- `InlineMarkdown` may stay local if it remains tiny

Expected outcome

- smaller route file
- easier future updates to changelog heuristics
- less accidental coupling between docs parsing and page rendering
- first bounded slice implemented with pure helpers in `src/lib/changelog-utils.ts` and route rendering left in `src/routes/changelog.tsx`

Risk

- low; this is a utility surface

Mitigation

- keep visible output unchanged
- regression-check latest dates, highlight tab, technical tab, and empty state behavior

Owner

FRONTEND

QA expectation

- `/changelog` still renders latest entries correctly
- highlights and technical log tabs remain unchanged in behavior
- `Last updated` and entry count remain correct

Priority Order

P0

- Phase 1
- Phase 2

P1

- Phase 3
- Phase 4
- Phase 5

P2

- Phase 6
- Phase 7
- Phase 8

P3

- Phase 9

Recommended Next Slice

Continue with one bounded cleanup slice from Phase 3 or Phase 4:

- extract one more coherent `training-api.ts` cluster, such as refresh proposal/apply glue or workout-result route helper glue
- or start the `PlanManagementDialog.tsx` split if Backend cleanup is paused

Why this is the best next move

- Phase 1 and Phase 2 are already complete
- the first Phase 3 backend extraction moved active-plan export action ownership out of `training-api.ts`
- the second Phase 3 backend extraction moved active-plan lifecycle action ownership out of `training-api.ts`
- the third Phase 3 backend extraction moved user-settings action ownership out of `training-api.ts`
- the fourth Phase 3 backend extraction moved workout-log save ownership out of `training-api.ts`
- the fifth Phase 3 backend extraction moved auth/login action ownership out of `training-api.ts`
- the sixth Phase 3 backend extraction moved route-data loader ownership out of `training-api.ts`
- the seventh Phase 3 backend extraction moved active-plan refresh proposal/apply ownership out of `training-api.ts`
- the eighth Phase 3 backend extraction moved imported-plan/text-plan replacement ownership out of `training-api.ts`
- the lifecycle auth repair kept delete/clear server-action wrappers top-level in `training-api.ts` while preserving lifecycle helper ownership in `active-plan-lifecycle-actions.ts`
- one slice at a time keeps the cleanup behavior-preserving

Files Most Likely Involved First

- `src/lib/training-api.ts`
- one focused new module for the chosen cluster
- docs/current-state/changelog updates only for implemented ownership

Risks

- removing a compatibility seam still used indirectly
- turning this cleanup into a large refactor instead of bounded slices

Mitigations

- repo-wide callsite search before deletion
- build after every backend boundary change
- one slice at a time
- no “bonus” rewrites

QA Plan

For backend cleanup slices:

- run `npm run build`
- verify onboarding structured create still works
- verify voice review/confirm still works
- verify advanced JSON import still works
- verify Garmin upload/remove still works

For frontend extraction slices:

- verify unchanged behavior in:
  - onboarding
  - `Open plan`
  - workout detail
  - progress
- verify no modal/footer/scroll regressions
- verify no mobile sticky action regressions

Exit Criteria

- dead compatibility seams are removed
- Garmin browser-boundary warning is resolved or materially reduced with clear explanation
- `training-api.ts` is meaningfully smaller and less mixed
- `PlanManagementDialog.tsx` and `CompletionPanel.tsx` are no longer mega-components
- duplicated JSON import flow is reduced to one small shared implementation seam
- voice-to-plan backend file is decomposed into clearer internal ownership
- the `ChangeLog` page no longer carries route UI, markdown parsing, and highlight heuristics in one large utility route file
- no runner-facing product behavior regresses

What We Explicitly Will Not Do In This Cleanup

- no product redesign
- no billing/Stripe work
- no concurrency rewrite of canonical write paths
- no large data-model migration
- no speculative optimization of every large file
- no broad abstraction layer “for the future”

Next Recommended Role

BACKEND

Suggested Next Step

Execute one next bounded cleanup slice only:

- extract one additional coherent `training-api.ts` responsibility cluster, such as workout-result route helper glue, if Backend continues
- or hand off to Frontend for the first `PlanManagementDialog.tsx` section split
- rebuild and verify unchanged behavior
