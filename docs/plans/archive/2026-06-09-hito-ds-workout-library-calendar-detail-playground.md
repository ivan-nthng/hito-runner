## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

product

## Task

Use this archived `/test-calendar` sandbox plan as historical evidence only; reopen sandbox work only
from a concrete Product/Design question.

## Stage

ARCHITECT archive / compressed paused `/test-calendar` sandbox history.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Use this archived `/test-calendar` sandbox plan as historical evidence only; reopen sandbox work only from a concrete Product/Design question.

Stage:
ARCHITECT archive / compressed paused `/test-calendar` sandbox history.

Context:
This archived plan preserves accepted `/test-calendar` TC1/TC2 history. Do not reopen implementation by inertia. If Product/Design has a concrete review gap that TC1/TC2 cannot answer, route through one fresh Architecture checkpoint before Frontend work.
```

# Hito DS Day-State Specimen And Test Calendar Sandbox

## Archive Note

This plan is archived because `/test-calendar` TC1 and TC2 are QA-passed, shared calendar-day
presentation parity is accepted, and no TC3 implementation slice is selected. The active
DS/specimen/Figma bridge owner remains the Hito DS IA plan.

## Final Outcome

The work split two previously tangled surfaces:

| Surface | Owner | Purpose |
| --- | --- | --- |
| `/hitoDS#calendar-workout-playground` | Hito DS | reusable day-cell/workout-row state specimen |
| `/test-calendar` | Product-design sandbox | fake static product-calendar and workout-detail review |
| real calendar/workout routes | Product runtime | persisted saved-mode behavior |

TC1 proved a direct static `/test-calendar` route with fake fixtures, desktop/mobile calendar,
fake-day review, settings, fake workout detail, no mutation path, and no overflow.

TC2 proved coherent scenario presets and shared calendar-day presentation parity with the real
product calendar. After TC2, `/test-calendar` paused as sufficient.

## Key Decisions

- `/hitoDS` owns DS/specimen/Figma bridge truth.
- `/test-calendar` owns fake product-flow design review only.
- Real product routes own persisted behavior and backend-shaped product truth.
- The sandbox must never add Supabase, auth, provider sync, OpenAI, persistence, or real mutations.
- Future sandbox work requires a concrete Product/Design question and one Architecture checkpoint.

## Validation Evidence

Historical QA covered source boundary proof, `/hitoDS` day-state specimen proof, `/test-calendar`
direct load, fake day/detail interactions, settings toggle proof, static-only/no-mutation proof,
shared calendar-day parity, and desktop plus `375px` no-overflow checks.

## Current Owner Links

- Active Hito DS IA plan: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not reopen accepted `/hitoDS` IA slices or `/test-calendar` TC1/TC2 without a concrete regression
or Product/Design question. Do not move sandbox ownership back into `/hitoDS`.
