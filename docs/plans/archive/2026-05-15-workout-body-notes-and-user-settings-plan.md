## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Workout Body Notes And User Settings Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed body-note/settings history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Workout Body Notes And User Settings Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed body-note/settings history.

Context:
This artifact is archived history. Do not continue it by default. Start from current docs/current-* truth before changing workout body notes, runner profile settings, avatar storage, or shell profile affordances.
```

# Workout Body Notes And User Settings Plan

## Archive Note

This archive captured the initial persistence and surface direction for workout-linked body notes
and bounded runner settings. It is preserved to explain why body notes belong to workout logging
instead of a standalone utility.

## Final Outcome

The accepted direction and repair established:

- `workout_logs.body_notes` for workout-linked body-note truth;
- bounded runner profile fields for identity, avatar, age, weight, and height;
- `profile-avatars` storage for processed avatar assets;
- saved-mode persisted-user lookup for settings/profile data;
- body-note entry inside workout-detail `Log result`;
- no standalone `/body` product surface;
- settings as bounded runner metadata, not a broad account center.

## Key Decisions

- Body discomfort notes attach to a specific workout result.
- Body notes do not create recovery advice, automatic plan changes, or a medical subsystem.
- Avatar upload should store processed square assets, not raw source images.
- Settings/profile work stays bounded to runner metadata and future heart-rate-zone ownership.

## Validation Evidence

Historical validation covered persistence/reload, workout-specific ownership, shell route cleanup,
saved-mode settings access, avatar storage replacement, and the later modal UI follow-up.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not reopen this archive as settings or recovery scope. Future work must preserve workout-scoped
body-note ownership and current settings boundaries.
