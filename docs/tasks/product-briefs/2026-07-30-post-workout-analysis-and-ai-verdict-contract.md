# Post-Workout Analysis And AI Verdict Contract

**Status:** completed

**Owner sequence:** Product -> Architect -> Backend -> Frontend Product -> QA -> Running Coach

**Operational lifecycle boundary:** This brief is accepted supporting product truth, not an active
task. Any implementation beyond the current deterministic comparison flow requires one canonical
item in `docs/tasks/backlog/`.

## Purpose

After a runner records a workout manually or attaches Garmin evidence, Hito should make the result
understandable before it asks an AI to interpret it:

1. show what was planned;
2. show what actually happened;
3. show only deterministic, source-backed differences and their confidence;
4. let the runner explicitly request an AI verdict; and
5. keep any future-plan adjustment as a separate reviewable proposal.

This is a runner-facing delivery layer on top of the existing [Provider Activity Ingestion And
Comparison Contract](2026-06-09-provider-activity-ingestion-and-comparison-contract.md) and the
[Hito Runner Profile Constitution](../running-coach/2026-07-30-hito-runner-profile-constitution.md).
It must not create a second FIT parser, actual-metrics model, comparison engine, or athlete-profile
system.

## Current Boundary

Garmin FIT/ZIP ingestion and workout-scoped actual evidence are the existing canonical intake path.
The immediate prerequisite is a normal authenticated Product upload path for a persisted non-rest
workout. Until that path has browser upload, readback, remove, and error-boundary evidence, this
brief does not claim that a runner can use the analysis experience.

The current runner-profile constitution is a future longitudinal layer. It does not make one
workout a fitness trend, readiness score, or plan-change command.

## Runner Flow

For a persisted non-rest workout that is today or in the past, the runner has two independent entry
points:

- **Add result** for `Complete`, `Partial`, or `Skipped`, optional RPE, and notes.
- **Add Garmin file** for a Garmin `.fit` activity or a `.zip` containing exactly one FIT activity,
  attached to that planned workout.

After valid evidence is available, the Feedback surface presents a compact comparison before any AI
action:

| Planned | Actual | Comparison status |
| --- | --- | --- |
| Workout identity and scheduled date | Activity type and local activity date | matched, different, or unavailable |
| Scheduled duration and explicit distance | Actual duration and explicit distance | within range, above, below, or unavailable |
| Executable blocks/intervals when comparison-ready evidence exists | Laps or indexed actual segments | matched, partial evidence, different, or unavailable |
| Pace or HR target only when both planned target and normalized compatible actual measurement exist | Actual pace or HR measurement | within target, above, below, or unavailable |
| Hydration/non-runnable instructions | No false execution metric | informational only |

`Better` and `worse` are not universal labels. The deterministic layer describes the measured
difference, the target/range when one exists, evidence coverage, and why a comparison is unavailable
or low-confidence. Coach interpretation belongs to the optional AI verdict.

## Explicit AI Verdict

`Get AI verdict` is a separate, clearly paid action after deterministic comparison is visible. It
uses the canonical planned workout, normalized actual evidence, deterministic comparison document,
and runner-provided result context. It must not receive raw FIT bytes or create a second comparison
truth.

The verdict may provide concise notes about execution, recovery/context questions, and what to watch
on the next sessions. It must:

- label its recommendations as coaching interpretation, not a measured fact;
- preserve the underlying planned, actual, and comparison provenance;
- be optional and never dispatched automatically after upload;
- be safely redacted, reviewable, and independently persisted only under the existing AI insight
  lifecycle; and
- never mutate a saved plan or runner profile as a side effect.

The runner can save manual outcome/RPE/notes through the existing result lifecycle independently of
requesting the verdict. Attaching a file records evidence; it is not an implicit AI request.

## Future Plan Adaptation

Future plan adaptation is deliberately out of the first delivery. A later slice may let the AI
produce a proposed change from multiple eligible activities and profile snapshots, but only as an
explicit review artifact. The runner must accept it before a future workout or active plan changes.
Historical planned workouts, actual evidence, deterministic comparison, and prior snapshots remain
immutable.

## Delivery Slices

1. **FIT upload readiness:** normal Product entry, upload, safe errors, persisted readback, replace
   and remove semantics.
2. **Deterministic comparison readback:** one canonical comparison document and a concise planned /
   actual / status presentation, with coverage and confidence states.
3. **Explicit AI verdict:** paid opt-in, bounded input, runner-safe output, provenance, storage and
   review contract, with no plan mutation.
4. **Longitudinal context:** only after the provider-neutral activity and snapshot architecture is
   implemented; use sufficient comparable evidence, not a single workout.
5. **Reviewable adaptation proposals:** a separate Product decision and implementation plan.

## Non-Goals

- Automatic modification of the current or future plan.
- An opaque `Fitness Score` or a verdict derived from one activity.
- Treating Garmin FIT as universal support for other watch vendors.
- Re-parsing raw provider payloads in the comparison, AI, or profile layers.
- Hiding missing data or low confidence behind a positive/negative judgement.

## Required Architecture And QA Gates

Before implementation, ARCHITECT must reconcile this delivery flow with the provider-neutral activity
foundation and current workout-scoped evidence lifecycle. BACKEND must prove canonical comparison and
AI insight boundaries before FRONTEND renders a new verdict surface. QA must exercise upload,
comparison, explicit AI dispatch, privacy/redaction, no-plan-mutation, reload/readback, remove, and
desktop/mobile states. Running Coach reviews editorial usefulness only after the deterministic facts
are proven.
