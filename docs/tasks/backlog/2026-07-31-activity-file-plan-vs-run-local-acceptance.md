# Activity File And Plan Vs Run Local Acceptance

## Work Item ID

2026-07-31-activity-file-plan-vs-run-local-acceptance

## Status

completed

## Type

bug

## Priority

urgent

## Owner

qa

## Scope

import-export-provider-evidence

## Archive Intent

archive_when_closed

## Task

Close the remaining local browser acceptance evidence for Activity File Dialog and the compact Plan / Run / Difference readback without reopening accepted backend behavior or creating product data outside the established local fixture boundary.

## Stage

Local acceptance complete; Global QA remains a separate release gate.

## Parent Capability

Runner-facing activity-file upload/readback: deterministic Garmin FIT evidence is compared with the planned workout, while the UI presents only truthful plan, observed run, and material difference facts.

## Accepted Work That Must Not Be Reopened

- Garmin FIT/ZIP ingestion, deterministic comparison, removal, and provider isolation passed in local real-mode evidence.
- Activity File Dialog opens over workout overview without changing the route; direct feedback links remain supported.
- Fixture readback survives Dialog close and reopen on desktop and exact 375px.
- Current served source does not reproduce the historical narrow-column mobile collapse.
- Plan / Run readback accessibility labels, non-duplicated status presentation, and upload/remove announcements have source and deterministic validator coverage.

## Accepted Result

- Native Safari confirmed fixture selection, truthful `window.confirm` clear, empty-state reset, and
  focus return to the original Activity File trigger.
- The local preview no longer leaves a stale outer readiness announcement after Clear.
- The attached-file row reflows into a readable mobile column at exact `375px`; the resolved historic
  page-wide narrow-column failure remains closed.
- Dark ready readback, exact 375px geometry, keyboard reachability, fixture isolation, cleanup, and
  local runtime health passed without provider or persistence activity.

The source-backed Activity File Dialog and Plan / Run local acceptance is complete. Real
upload/remove evidence remains covered by its previously accepted backend and real-mode local proof;
this fixture-only closeout does not claim a new release-wide regression pass.

## Evidence And Supporting Documents

- [Plan vs Run experience specification](../frontend-specs/2026-07-31-post-upload-plan-vs-run-comparison-experience.md)
- [Narrow-screen readability contract](../frontend-specs/2026-07-31-hito-ds-narrow-screen-readability-contract.md)
- [Fixture readiness proof](../../../qa-artifacts/screenshots/2026-07-31/activity-file-plan-vs-run-fixture-readiness-qa/proof.json)
- [Current-head narrow-screen proof](../../../qa-artifacts/screenshots/2026-07-31/current-head-narrow-screen-discrimination/proof.json)
- [Pre-fix acceptance and defect proof](../../../qa-artifacts/screenshots/2026-07-31/activity-file-plan-vs-run-final-acceptance/proof.json)

## Exact Handoff Prompt

```text
ROLE: QA

Task:
Final local acceptance closure for Activity File Dialog and Plan vs Run.

Stage:
QA validation with autonomous local evidence completion.

Plan files:
- docs/tasks/backlog/2026-07-31-activity-file-plan-vs-run-local-acceptance.md
- docs/tasks/frontend-specs/2026-07-31-post-upload-plan-vs-run-comparison-experience.md
- docs/tasks/frontend-specs/2026-07-31-hito-ds-narrow-screen-readability-contract.md

Required outcome:
Complete one coherent local acceptance for the existing implementation. Reuse safe local browser paths and a bounded QA subagent. Distinguish a real Product defect from a browser capability limit. Do not change product source, use an API fallback, inject DOM/CSS state, duplicate fixtures, call providers, or mutate hosted data.

Required proof:
- fixture Clear local preview reset and reopen behavior;
- dark ready Plan / Run / Difference readback after remount when the browser path permits it;
- strongest available local text-zoom evidence, with an explicit limitation if native zoom cannot be controlled;
- independent confirmation that no product-impacting regression is present.

Report one integrated inventory as Check | Scenario / environment | Result | Evidence. Keep the work item open unless every required local proof passes or the only remaining limitation is demonstrably a browser capability rather than a product failure. Preserve current fixture/runtime coordination and cleanup boundaries.

Approval policy:
Routine local inspection, fixture setup, browser QA, cleanup, and subagent use proceed under standing authorization. Do not ask the user for routine approval; exhaust safe local alternatives before reporting a capability limitation.
```

## Closure

The original QA acceptance found two Product defects. They were corrected and independently
rechecked in the linked frontend patch. No further owner work is queued from this item.

The 2026-08-01 release-reconciliation replay independently passed desktop and exact `375x812`
ready/clear behavior, native confirmation, close/reopen and focus return, fixture isolation,
persistence cleanup, zero overflow, and zero browser errors. Global QA remains a separate deploy
gate rather than a blocker to committing this accepted bounded slice.
