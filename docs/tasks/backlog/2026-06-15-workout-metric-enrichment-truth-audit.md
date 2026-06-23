# Workout Metric Enrichment Truth Audit

## Status

closed

## Type

change_request

## Priority

high

## Next Recommended Role

architect

## Task

Preserve the accepted metric-truth boundary for selected-plan workout enrichment.

## Stage

ARCHITECT historical closeout / benchmark-backed pace truth accepted.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this closed metric-truth audit only as historical context if selected-plan enrichment or metric
truth boundaries regress.

Stage:
ARCHITECT source-of-truth guard / selected-plan metric truth.

Context:
The accepted boundary is strict: structure-only selected-plan workouts are valid when metric truth is
absent; benchmark-backed pace may appear only through canonical benchmark truth; provider-derived
pace and personal HR-zone executable targets remain future-only unless a dedicated owner ships them.
```

## Historical Outcome

This audit resolved whether selected-plan workouts should show richer executable targets. The final
accepted path was intentionally conservative: no-benchmark selected-plan previews stay
`structure_only_executable`, while benchmark-backed pace truth may enrich supported workouts only
after backend validation/review preserves that truth through preview, confirm, persistence, and
readback.

## Accepted Metric-Truth Rules

- `structure_only_executable` remains a correct selected-plan outcome when metric truth is absent.
- Selected-plan creation may emit pace targets only when backend has validated recent benchmark pace
  truth and the segment safely supports pace.
- Selected-plan creation must not require benchmark truth to create a plan.
- Selected-plan creation must not infer pace from target time, selected distance, runner level,
  ambition, comments, AI inference, or provider data that has not been promoted to canonical pace
  truth.
- Executable personal HR targets must not appear until personal HR-zone truth exists.
- Age/default HR remains advisory/readback-only.

## Source Separation

Benchmark-backed pace truth was accepted as the first implementation seam. Provider-derived pace
truth and personal HR-zone truth remain separate future owners and must not be smuggled into
selected-plan generation by frontend copy or backend inference.

## Validation Evidence

Accepted QA proved:

- no-benchmark preview remains structure-only;
- benchmark-backed preview shows `Recent 5K benchmark pace 5:00/km - personal HR targets blocked`;
- persisted workout detail shows pace where backend allows it;
- no fake pace appeared;
- no personal HR target truth appeared.

## What Not To Touch

- Do not reopen benchmark-backed pace truth unless source proof shows a real regression.
- Do not add provider-derived pace enrichment without its own canonical owner.
- Do not add executable HR targets without personal HR-zone truth.
- Do not weaken no-fake-pace or no-fake-personal-HR guardrails.
