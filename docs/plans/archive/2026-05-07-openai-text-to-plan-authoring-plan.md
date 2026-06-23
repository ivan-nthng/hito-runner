## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived OpenAI Text-To-Plan Authoring Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed text-authoring history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived OpenAI Text-To-Plan Authoring Plan only as background for future text or AI plan-authoring work.

Stage:
ARCHITECT archive reference / text-to-plan authoring evidence.

Context:
This artifact is archived history. Do not continue it by default. Current first-plan and AI authoring truth lives in current docs and source.
```

## Archive Note

This plan captured the May 2026 pivot from JSON/structured-form-first onboarding toward free-text authoring. Later structured Quick setup, selected-plan, AI blueprint, Plan Preset, and manual-plan tracks superseded text-first as current UI truth.

## Final Outcome

The historical text-to-plan path proved that natural-language runner intent could be converted through a backend OpenAI seam into validated structured authoring input, then into canonical `training-plan-v2` persisted through `plan_cycles` and `planned_workouts`.

## Key Decisions

- Free text was intent, not trusted plan truth.
- OpenAI could propose structured authoring input, but deterministic backend validation and canonical persistence still owned truth.
- JSON import remained advanced/tooling fallback.
- Voice was treated as a future input modality feeding text, not raw audio-to-plan authority.
- Malformed or overcreative model output had to be bounded before persistence.

## Validation Evidence

Archived evidence recorded local live OpenAI provider verification, server-side validation, Supabase persistence, saved-mode readback, and visible onboarding proof at that point in product history. Detailed prompts/logs were compressed because current first-plan truth has moved on.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not restore text-first onboarding as current UI truth from this archive. Any future text/voice authoring should start from current backend AI seams, current first-plan contracts, and explicit review/confirm boundaries.
