# Managed QA Source Freshness And Phase Timings

## Work Item ID

2026-08-06-managed-qa-source-freshness-and-phase-timings

## Status

completed

## Type

change_request

## Priority

high

## Owner

backend

## Scope

developer-experience-and-delivery-safety

## Batch

hito-developer-velocity

## Archive Intent

retain_in_place

## Task

Make the existing managed QA lifecycle prove executable-input freshness, expose phase timings, and
reuse only a healthy compatible artifact whose source identity still matches.

## Stage

Backend tooling implementation and integrated QA completed.

## Next Recommended Role

backend

## Exact Handoff Prompt

```text
ROLE: BACKEND

Complete source-aware managed QA artifact reuse and phase timing through the existing runtime,
integrity, and build-lock owners without changing Product or production behavior.
```

## Parent

[Developer Velocity And Proportional Verification](2026-08-05-developer-velocity-and-proportional-verification.md)

## Execution Preflight

- Evidence: current status and start paths validate artifact integrity and process age but do not
  compare executable inputs with the artifact; status has no freshness or phase timing output.
- Canonical owner: `scripts/qa-local-server.mjs` plus existing runtime-path, integrity, and lock
  seams. The concurrently dirty finalizer is excluded.
- Outcome: artifact-local freshness evidence, truthful reuse/rebuild output, and fail-closed source,
  config, and output invalidation.
- Proof: deterministic fresh/reuse/invalidate checks, three fast status runs, required rebuild,
  build integrity, managed loopback/provider isolation, restoration, and independent QA.

## Closure Receipt

- The existing managed runtime now owns one private artifact-local receipt. It hashes executable
  build inputs and finalized output while reusing the existing runtime root, lock, integrity, and
  server lifecycle.
- Missing or incompatible receipt, source/config drift, and output drift all return stale. A
  rebuild records a receipt only after source stability and output integrity pass.
- A compatible unchanged start reported `build=0` and completed in 0.43 seconds. The three final
  status runs completed in 0.27, 0.25, and 0.25 seconds, below the 1.0-second target.
- Lifecycle output now distinguishes `reused` from `rebuilt` and reports integrity, source,
  artifact, build, server-start, health, and total phase timings.
- Live discriminators proved `executable_inputs_changed` for source and Vite config changes and
  `artifact_changed` for finalized-output mutation. Canonical start rebuilt and restored the
  loopback runtime; `qa_fixture` and `real` mode switches reused the same fresh artifact.
- The focused validator, Backend source suite, targeted ESLint, Prettier, build integrity, runtime
  health, diff hygiene, and independent QA passed. Global QA Acceptance remains pending.
