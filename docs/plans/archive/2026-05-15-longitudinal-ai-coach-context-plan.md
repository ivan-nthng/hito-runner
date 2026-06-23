## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Longitudinal AI Coach Context Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed historical summary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Longitudinal AI Coach Context Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed historical summary.

Context:
This artifact is archived history. Do not continue it by default. If longitudinal AI coaching returns, start from current docs/current-* truth, current AI seams, and current backend context builders.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. Compressed during D12 of the docs/artifact compression track.

Current truth now lives in:

- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Product history digest](../../history/product-history-digest.md)

## Final Outcome

This plan defined the first safe architecture for giving AI bounded access to a runner's longitudinal Hito history without turning AI into product truth.

The accepted seam was `RunnerCoachContext`: a backend-owned, task-scoped, AI-readable context object built only from canonical persisted Supabase truth and deterministic aggregates. AI may interpret bounded context, but it must not query raw tables from UI flows, compute source-of-truth metrics, diagnose injury, or silently mutate plans.

## Key Decisions Preserved

- Supabase remains the source of record for runner profile, plans, workouts, logs, evidence, comparisons, AI insights, and body notes.
- Backend builds deterministic context and recent-history aggregates before AI sees anything.
- OpenAI receives task-scoped context only and remains downstream of deterministic truth.
- A future coaching layer should start with summary/reflection and explicit proposal workflows, not broad chat or automatic adaptation.
- Active-plan refresh from history must be runner-triggered, proposal-only first, and gated by explicit review/apply.
- No persistent AI-memory subsystem was needed for v1; cached summaries were deferred until performance or token cost proved the need.

## Implementation History

The archived plan recorded two backend slices:

- `src/lib/runner-coach-context.ts` introduced the first compact `RunnerCoachContext` builder from persisted history.
- `src/lib/plan-refresh-proposal.ts` introduced a task-specific proposal consumer for active-plan refresh.
- Proposal output hygiene sanitized raw ids, implementation field names, dangling fragments, unsupported characters, ambiguous scope counts, and unsafe history references before review.
- Apply remained separate and required a fresh matching fingerprint before any archive/replace mutation.

## Boundary Notes

- AI may interpret adherence trends, workout context, load consistency, and conservative next-step suggestions.
- AI must not own completion state, date math, training volume math, lifecycle state, injury diagnosis, silent plan changes, or unsupported physiology.
- Body notes are caution context, not diagnosis.
- Prior AI outputs can be referenced but must not become canonical fact.

## Validation And QA Expectations

The original plan required proof that context stays user-isolated, deterministic aggregates match stored truth, sparse history remains honestly described, body-note caution softens language without diagnosis, and no silent plan changes occur from AI output.

Detailed old phase prompts and open-question inventories were removed because the current implementation/source hierarchy must be rechecked before any future AI-coach work resumes.
