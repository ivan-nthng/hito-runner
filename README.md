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

- weekly plan home and workout detail support preview mode plus authenticated saved mode through one backend seam
- `/progress`, `/body`, and `/integrations` are preserved as non-connected preview shells
- Supabase-backed auth/session wiring is implemented
- a temporary local-only single-user bypass also exists for local unblock and should remain disabled on Vercel deploys
- OpenAI, weather, and device integrations are still not wired

## Commands

[`PROJECT_PROFILE.md`](PROJECT_PROFILE.md#current-command-surface) owns the current reproducible
command surface. Use `npm ci` for the exact lockfile install, and select only the manifest-backed
validation stages admitted by the active Task. CI invokes those same package scripts; it does not
define a second command surface. Managed loopback QA uses `npm run qa:server:{status,start,restart,stop}`;
direct `npm run start` / `serve:local` is not QA admission.

## Deployment

- the canonical deployment target is now Vercel via Nitro
- `npm run build` produces `.output/` locally and `vercel build` produces `.vercel/output/`
- required Vercel env for the current live auth path:
  `NEXT_PUBLIC_SUPABASE_URL`
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- optional:
  `NEXT_PUBLIC_APP_NAME`
  `APP_BASE_URL`
- local bypass env such as `LOCAL_AUTH_BYPASS_ENABLED` should stay unset on Vercel

## Canonical References

- `docs/context.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/current-state.md`
- historical baseline record:
  `docs/plans/archive/2026-05-05-full-baseline-import-and-stabilization-plan.md`
