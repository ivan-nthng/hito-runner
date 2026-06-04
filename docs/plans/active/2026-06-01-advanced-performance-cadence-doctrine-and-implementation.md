# Advanced Performance Cadence Doctrine And Implementation

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

RUNNING COACH

## Task

Define advanced/performance cadence doctrine before backend implementation.

## Stage

RUNNING COACH doctrine / advanced performance cadence

## Exact Handoff Prompt

```text
ROLE: RUNNING COACH

TASK:
Define advanced/performance cadence doctrine before backend implementation.

STAGE:
RUNNING COACH doctrine / advanced performance cadence

CONTEXT:
- Source path: docs/plans/active/2026-06-01-advanced-performance-cadence-doctrine-and-implementation.md
- The completed production blueprint wave is archived at docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md.
- Beginner/new-runner run/walk adaptation is already implemented.
- Beginner/recreational supported cadence is already implemented.
- Supported half/marathon goal-specific specificity is already implemented.
- This plan is for broader advanced/performance cadence, not the completed conservative/supported layers.

GOAL:
Define when Hito may use advanced performance cadence, including whether two-quality weeks are ever allowed, for supported experienced runners.

REQUIREMENTS:
- Define runner-support prerequisites for advanced cadence.
- Define goal-family differences for 5K, 10K, half marathon, marathon, ultra, and mountain/trail where relevant.
- Define hard-day density, recovery, cutback, taper, long-run, and metric-truth safety limits.
- Preserve no fake pace and no fake personal HR precision.
- Do not implement code in the Running Coach pass.

OUTPUT:
1. Task
2. Stage
3. Coaching verdict
4. Advanced cadence prerequisites
5. Goal-family rules
6. Safety limits
7. Backend enforcement recommendations
8. Blockers
```

## Owner

RUNNING COACH / BACKEND / QA

## Last Updated

2026-06-01

## Context

The production blueprint first-plan wave completed the reliability and core coaching-richness work
needed for controlled first-plan generation. Hito now has conservative beginner adaptation,
beginner/recreational supported cadence, and supported half/marathon specificity.

Advanced/performance cadence is intentionally separate because it can introduce higher training
load, more complex hard-day density, and more sensitive metric assumptions.

## Problem Definition

The next performance step is not just "add more workouts." Hito needs doctrine for:

- when a runner has enough support truth for advanced cadence
- whether two-quality weeks are ever allowed
- how target-time pressure interacts with benchmark truth
- how to avoid unsafe race-pace, interval, or threshold overreach
- how to keep cutback, taper, long-run, and recovery structure honest

## Scope

- advanced/performance cadence
- possible two-quality-week doctrine
- target-time improvement for supported experienced runners
- backend-enforceable safety gates
- metric truth requirements for pace and HR
- QA fixtures for accepted and rejected advanced cadence

## Non-Goals

- no changes to beginner/new-runner adaptation
- no changes to beginner/recreational cadence
- no production envelope adoption
- no frontend changes
- no metric precision without valid backend truth

## Suggested Slice Order

1. RUNNING COACH doctrine.
2. ARCHITECT implementation-slice selection.
3. BACKEND enforcement and generation changes.
4. QA doctrine and fixture validation.
5. RUNNING COACH final quality review.

## QA Expectations

- advanced cadence must never leak into unsupported beginner/recreational cases
- target-time alone must not unlock advanced work
- two-quality weeks, if allowed, must be explicitly gated and tested
- recovery-first after long runs and fixed rest days must remain protected
- pace/HR gates must remain backend-owned

## Exit Criteria

- doctrine exists and is implementation-ready
- backend enforcement requirements are explicit
- advanced cadence remains separate from completed conservative/supported layers

## Suggested Next Step

Run the RUNNING COACH doctrine pass described in the handoff prompt.
