# Hito Running

Hito Running currently contains an imported TanStack Start frontend baseline plus the project operating docs that define how that baseline should be stabilized and later replaced with backend truth.

## Current Repo Shape

- `src/`
  imported running-plan app baseline
- `docs/`
  canonical project, product, system, and execution docs
- `agents/`
  role definitions used by project agents
- `prompts/`
  task prompt templates

## Current Product State

- weekly plan home and workout detail are implemented as honest preview surfaces
- `/progress`, `/body`, and `/integrations` are preserved as non-connected preview shells
- auth, persistence, Supabase, OpenAI, weather, and device integrations are not wired

## Commands

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run build`

## Canonical References

- `docs/context.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/current-state.md`
- `docs/plans/active/2026-05-05-full-baseline-import-and-stabilization-plan.md`
