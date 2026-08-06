# Source-Size Ledger Retirement

## Work Item ID

2026-08-05-source-size-ledger-retirement

## Status

completed

## Type

change_request

## Priority

medium

## Owner

backend

## Scope

build-tooling

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Retire the source-line writer, package alias, and generated ledger after a fresh reachability check
proves there is no external current consumer beyond the writer's own self-read/write loop.

## Stage

Completed Backend/build-tooling cleanup and release, Slice 8B.

## Next Recommended Role

backend

## Exact Handoff Prompt

```text
ROLE: BACKEND

Remove the obsolete source-size writer and generated ledger only after current consumer and
supporting-reference proof confirms no retained executable contract depends on them.
```

## Parent

[Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)

## Completion Receipt

- Root cause: the 571-line writer and 1.3 MB generated ledger formed a self-contained append loop;
  no external runtime, CI, fixture, build, or Product consumer existed.
- Deleted: `metrics:lines`, `scripts/report-line-counts.mjs`, and
  `docs/metrics/line-count-ledger.jsonl`.
- Retained: Git history preserves the historical snapshots; live cleanup selection uses fresh
  non-mutating source scans and the active source-size governance plan.
- Proof: pre/post reachability, package manifest, source/release and built-runtime suites, managed
  loopback health, diff hygiene, and independent QA passed after correcting the self-reader wording.
