## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Hierarchy Cleanup After Copy Pass as historical context.

## Stage

ARCHITECT archived-plan reference / compressed UI hierarchy history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Hierarchy Cleanup After Copy Pass as historical context.

Stage:
ARCHITECT archived-plan reference / compressed UI hierarchy history.

Context:
This artifact is archived history. Do not continue it by default. Start from current Hito DS, current docs, and live components before changing action hierarchy, import disclosure, or Garmin bridge presentation.
```

# Hierarchy Cleanup After Copy Pass

## Archive Note

This archive captured an early UI hierarchy cleanup after copy was made calmer and more honest. It
is preserved to explain why destructive/expert paths are visually quieter than safe primary actions.

## Final Outcome

The implemented pass preserved behavior while changing visual hierarchy:

- A shared `hito-disclosure` primitive was added.
- Safe `Create plan` and `Import plan` actions remained primary.
- `Replace today` remained available and still submitted `replace_first_day`, but only after
  explicit disclosure.
- JSON upload stayed visible first; paste JSON and template download moved behind expert
  disclosure.
- `Log result` used a lighter divided continuation row into `Feedback`.

## Key Decisions

- Safe defaults should be the first visible action.
- Destructive overrides must not sit as equal-weight siblings beside safe actions.
- Expert JSON tools should stay available without competing with normal runner flow.
- Garmin continuation should remain discoverable but secondary to manual result logging.

## Validation Evidence

Historical QA expectations covered default/import/replace states, safe primary CTA prominence,
destructive disclosure, JSON upload/paste/template support, `Log result` Garmin secondary weight,
and mobile stacking where destructive actions are never topmost/largest by accident.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Hito DS IA plan: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not reopen this early hierarchy slice directly. Future visual hierarchy work must start from
current Hito DS primitives and live source surfaces.
