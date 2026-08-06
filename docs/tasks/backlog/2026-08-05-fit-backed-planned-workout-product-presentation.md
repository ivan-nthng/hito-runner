# FIT-Backed Planned Workout Product Presentation

## Work Item ID

2026-08-05-fit-backed-planned-workout-product-presentation

## Status

blocked

## Type

defect

## Priority

high

## Owner

frontend

## Frontend Lane

Product

## Scope

runner-workout-completion-presentation

## Parent

[Planned Workout FIT Completion Lifecycle](./2026-08-05-planned-workout-fit-completion-lifecycle.md)

## Task

Align runner-facing completion, result, and feedback presentation with the accepted FIT-backed
planned-workout completion read model.

## Stage

Browser-closure evidence remains blocked after Product correction, local contract validation, and
an exhausted local browser attachment replay.

## Demonstrated Root Cause

The persisted snapshot already projects canonical FIT completion into `Workout.status`, but Product
presentation still uses `workout.log` as a result discriminator and treats an attached feedback
marker as sufficient to expose review. This can make a valid completed FIT result appear unfinished
or expose manual/result affordances before factual metrics exist.

## Intended Outcome

- Render the existing status and validated actual-metrics/comparison readback without recreating FIT
  lifecycle truth in the client.
- Keep manual subjective inputs independent from FIT-derived objective facts.
- Retain manual no-FIT completion paths and non-persisted past-skipped presentation.
- Refresh completion and feedback presentation when backend evidence changes.

## Validation

Use the canonical local fixture and Product browser surfaces for matched FIT, no-FIT manual,
explicit partial, source removal, and activity deletion states. Verify desktop and 375px light/dark,
keyboard/focus, accessibility, overflow, console/network health, scoped static checks, build,
integrity, and managed runtime health.

## Current Execution Evidence

Status: `blocked`.

The persisted snapshot already calculates the canonical FIT-completion chain. The active Product
candidate exposes that existing fact as `Workout.completionOrigin = "fit_activity"`; it does not add
storage, a provider branch, or a client-side inference. Product consumers must use this origin with
actual-metrics/comparison readback rather than treating a broad `feedback_ready` marker as review
eligibility, because non-running evidence can still be feedback-ready while remaining skipped.

### Closure Receipt

- Product now consumes the server-projected `completionOrigin: "fit_activity"` readback rather than
  inferring FIT completion from a manual log or feedback marker. The deterministic local foundation
  validator separately proves a clean FIT-completed workout has `status: completed`,
  `completionOrigin: fit_activity`, and no synthetic workout log, alongside its no-FIT,
  skipped-to-FIT, explicit-partial, source-removal, activity-deletion, and cleanup assertions.
  Targeted lint, formatting, diff hygiene, and the prior production build passed.
- Required real-browser upload proof remains unavailable after all approved local browser paths:
  the managed in-app browser exposed the canonical input but emitted no `filechooser`; the separate
  Chrome replay reached the real Activity file Dialog and its visible `input[type=file]`, but its
  file-chooser event also did not arrive. Chrome reports that its extension needs `Allow access to
file URLs` before it can select the existing safe FIT fixture. The available Safari session
  belonged to another runner and was left untouched to preserve concurrent work. No FIT bytes were
  attached, no upload request completed, and no provider or hosted mutation occurred.
- The named local `provider-engine` runner used to reach the actual Activity file Dialog was reset
  through the canonical QA pool lifecycle; its owned rows and assets are zero. Next owner:
  Frontend Product browser-validation continuation after an approved browser with local-file access
  can attach the existing safe FIT fixture through the ordinary input. No source correction is
  implied by this QA-capability boundary.
