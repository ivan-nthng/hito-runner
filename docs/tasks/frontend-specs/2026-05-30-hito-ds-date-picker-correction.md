# Hito DS Date Picker Correction

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Keep the corrected Hito DS Date Picker interaction and visual contract as completed historical source context.

## Stage

ARCHITECT closeout / completed frontend spec

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Use the completed Hito DS Date Picker correction spec as historical source context only.

STAGE:
ARCHITECT reference / completed frontend spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-30-hito-ds-date-picker-correction.md
- Hito DS Date Picker correction is implemented and QA-passed.
- Keep this file as compact historical frontend spec evidence.

CONSTRAINTS:
- Do not reopen implementation without a concrete regression.
- Do not claim keyboard-only focus-open or disabled-day styling as exhaustively browser-proven.
- Do not move product-specific schedule/business rules into the DS Date Picker.

OUTPUT:
Use the project role output format if a follow-up is explicitly selected.
```

## Compression Note

Compressed during Slice D22 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. This file is intentionally less compressed than older historical specs because the accepted
interaction contract and QA gaps are still useful source context.

## Accepted DS Primitive Contract

- `HitoDateField` is input-owned: clicking the input opens the calendar popover.
- The calendar icon is an inline affordance, not a separate adjacent primary trigger button.
- Typed ISO `YYYY-MM-DD` entry remains possible.
- Previous/next month navigation does not close the popover.
- Selecting a date updates the field and closes the popover.
- `Escape` and outside click close the popover.
- Invalid typed values remain correctable through calendar selection.
- The picker works in structured onboarding and `/hitoDS#inputs`.
- Narrow viewport behavior avoids horizontal overflow.
- Product-specific schedule validity remains outside the DS primitive.

## QA Closeout Preserved

QA passed on 2026-05-30.

Verified:

- `/hitoDS#inputs` Date Picker examples opened from the input, navigated months, selected dates,
  preserved typed ISO values, closed on `Escape`/outside click, and avoided `375px` overflow.
- Structured onboarding target date and optional plan start date chip used the shared picker.
- Optional start-date edit mode stayed active after calendar interaction.
- No plan/profile/workout/log mutation occurred before confirm.
- Targeted ESLint, `git diff --check`, and `npm run build` passed.
- Screenshot evidence remains under `qa-artifacts/screenshots/2026-05-30/hito-ds-date-picker-correction-qa/`.

Non-blocking gaps:

- Keyboard-only focus-open was not separately browser-proven.
- Disabled-day styling was source/CSS-inspected, not exhaustively browser-proven.

## Current Owner Links

- [Current system](../../current-system.md)
- [Current state](../../current-state.md)
- [Changelog](../../history/changelog.md)
- [Product history digest](../../history/product-history-digest.md)
- [Hito DS IA and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)

## Do Not Continue By Default

Do not reopen this completed spec unless a concrete date-picker regression appears or Product
elevates one of the non-blocking QA gaps into a new bounded task.
