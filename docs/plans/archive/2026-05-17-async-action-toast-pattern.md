## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Async Action Toast Pattern plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed async feedback history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Async Action Toast Pattern plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed async feedback history.

Context:
This artifact is archived history. Do not continue it by default. Start from current Hito DS and product docs before changing toast, inline status, proposal generation, or apply feedback.
```

# Async Action Toast Pattern

## Archive Note

This archive captured the first Hito toast policy for long-running async actions. It is preserved to
explain why toast feedback is bounded and why inline validation remains attached to its source.

## Final Outcome

The approved first scope implemented a reusable Hito toast primitive and consumed it for `Open plan`
proposal generation and `Apply update` only. Other v1 candidates stayed deferred.

## Key Decisions

- Toasts are for long-running or state-changing actions where the source surface may not be enough
  to reassure the runner.
- Toasts must not replace inline validation, review content, field errors, or confirmation objects.
- Dismiss is not cancel; the UI must not imply cancellation unless abort exists.
- Staged copy must remain truthful and not fake progress.
- Export/download was excluded because browser save completion is not always knowable by the app.
- `/hitoDS` should own a compact toast family, not a large notification catalog.

## Deferred Candidates

- Saved-mode import/apply.
- `Clear upcoming schedule`.
- `Delete plan`.
- Other fast/local actions until the pattern proves itself without noise.

## Validation Evidence

Historical QA expectations covered immediate toast visibility, button/toast state alignment,
dismiss-not-cancel behavior, success only after actual success, error behavior without replacing
inline validation, one primary toast stack, and mobile placement around modal/shell chrome.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Hito DS IA plan: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not broaden toast usage from this archive. Future async feedback must start from current Hito DS
and current product action ownership.
