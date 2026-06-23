## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived AI-Assisted Plan Refresh From History plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed active-plan refresh history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived AI-Assisted Plan Refresh From History plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed active-plan refresh history.

Context:
This artifact is archived history. Do not continue it by default. Start from current active-plan lifecycle docs and backend review/apply contracts before changing refresh behavior.
```

# AI-Assisted Plan Refresh From History

## Archive Note

This plan captured the historical creation of explicit active-plan refresh from saved runner history.
It is now archived because current active-plan lifecycle and backend action ownership supersede the
old execution prompts.

## Final Outcome

The accepted model was an explicit `Update plan` / refresh proposal workflow:

- backend builds a task-scoped runner context from saved truth;
- generation is proposal-only until the runner reviews it;
- refresh scope is clamped to remaining active schedule, not past history;
- apply uses stale-proposal/fingerprint safeguards before mutation;
- accepted apply archives/replaces safely rather than silently rewriting existing history.

## Key Decisions

- AI may propose changes, but backend owns lifecycle, date mapping, validation, and apply safety.
- Past logged/protected workouts are fixed truth.
- The runner must confirm before any active-plan refresh mutation.
- Same-goal refresh stays distinct from new plan creation or active-plan replacement.
- Review copy must hide raw ids, internal field names, dangling fragments, and implementation-only
  payload details.

## Validation Evidence

Historical validation covered proposal-only generation, review-safe output shaping, stale apply
blocking, fixed weekday/rest-day invariants, archive/replace continuity, double-submit blocking, and
consistent active-plan state after apply or cancel.

## Current Owner Links

- Current system truth: `docs/current-system.md`
- Current product truth: `docs/current-product.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not revive AI refresh as silent automation. Any future refresh work must preserve explicit
review/confirm, protected history, backend-owned apply, and deterministic validation boundaries.
