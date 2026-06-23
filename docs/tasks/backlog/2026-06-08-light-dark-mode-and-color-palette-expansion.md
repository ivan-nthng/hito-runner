# Light/Dark Mode And Color Palette Expansion

## Status

backlog

## Type

change_request

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Implement the first Hito light/dark mode foundation slice after plan creation stabilizes.

## Stage

FRONTEND implementation / Hito DS semantic color tokens and mode specimen

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Implement the first Hito light/dark mode foundation slice after plan creation stabilizes.

Stage:
FRONTEND implementation / Hito DS semantic color tokens and mode specimen.

Context:
This is future UI foundation work. The current dark-heavy UI should not be patched route by route.
The root fix is a shared Hito DS semantic color-token expansion plus a mode-aware `/hitoDS`
specimen, while preserving current dark visuals until rollout is explicitly approved.

Scope:
- Freeze current dark tokens as the `dark` semantic map.
- Add missing semantic color roles without visual regression.
- Add `/hitoDS` color specimens for dark/light with contrast examples.
- Tokenize only safe hardcoded-color findings that block light-mode readiness.
- Do not enable global light mode by default without a separate rollout decision.

Validation:
Run targeted frontend/style lint, build, `/hitoDS` browser proof, contrast spot checks, and dark-mode
regression checks.
```

## Owner

Frontend / Hito DS

## Last Updated

2026-06-22

## Compression Note

D24 compressed this future theme backlog item. The current product remains dark-mode-first; light
mode is not active and should not be introduced through route-local color patches.

## Durable Decision

The first light/dark slice must be a design-system foundation, not a product-screen redesign:

- define semantic roles in `src/styles.css`
- prove them in `/hitoDS`
- preserve the accepted dark visual language
- use contrast/accessibility checks before any global rollout
- treat hardcoded colors as token-readiness cleanup, not a broad restyle

## Current Boundary

Do not change plan creation, product logic, backend, Supabase, OpenAI, or active route behavior in
this theme foundation slice. Do not set light mode as the default until Product chooses the rollout.

## Useful Preserved Findings

- The user reported daytime discomfort with the dark-heavy UI.
- The root cause is missing semantic mode ownership, not one broken component.
- Hito DS is the canonical owner for semantic color roles, specimens, focus rings, disabled states,
  chart samples, and contrast proof.

## Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Hito DS IA plan: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
