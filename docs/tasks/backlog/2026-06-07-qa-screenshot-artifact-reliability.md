# QA Screenshot Artifact Reliability

## Status

backlog

## Type

qa_hygiene

## Priority

low

## Next Recommended Role

QA / BACKEND

## Task

Improve screenshot artifact reliability for browser QA when PNG capture times out.

## Stage

QA backlog / screenshot artifact tooling reliability

## Exact Handoff Prompt

```text
ROLE: QA

TASK:
Audit and improve screenshot artifact reliability for browser QA when PNG capture times out.

STAGE:
QA backlog / screenshot artifact tooling reliability

CONTEXT:
Several recent browser QA passes completed product validation but PNG screenshot capture timed out.
QA used approved JSON/DOM/HTML fallback artifacts, which was acceptable for closeout but still adds
friction and ambiguity to final reports.

SCOPE:
- identify whether screenshot capture failures are browser tooling, app runtime, viewport, file IO,
  or artifact-path issues
- define a reliable fallback order
- keep artifacts under `qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/`
- propose the smallest tooling or process fix

DO NOT:
- do not change product behavior
- do not require permanent committed screenshots for routine QA
- do not use Safari first unless the QA Browser Policy requires it
- do not make screenshot capture a blocker when DOM/source/browser proof is sufficient

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Recommended fix
5. Artifact policy update, if any
6. Validation
7. Blockers
```

## Context

Plan Preset final browser acceptance passed with JSON/DOM fallback artifacts because PNG capture
timed out. The product behavior was accepted, but repeated capture failure is a small tooling
friction.

## Acceptance

- QA has a reliable primary screenshot path or a documented fallback order.
- Routine screenshot artifacts remain gitignored under `qa-artifacts/`.
- Product closeouts are not blocked by screenshot tooling when stronger evidence exists.
