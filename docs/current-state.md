# Project State Snapshot

## Status

Active

## Last Updated

2026-05-06

## Where We Are Now

- Phase 0 and Phase 1 baseline import work are implemented.
- Phase 2 auth and env setup are implemented.
- Phase 2 auth runtime QA fixes are implemented:
  auth callback redirects now resolve against the live runtime origin unless `APP_BASE_URL` explicitly overrides it, and `/login` preserves the original safe `next` intent instead of nesting login into itself.
- A temporary local single-user auth bypass is implemented:
  `/login` can now authenticate one locally configured user through env-backed credentials and an httpOnly cookie without depending on Magic Link delivery.
- Phase 3 mock-seam replacement is implemented through one canonical backend contract.
- Phase 4 completion persistence and backend-derived week status are implemented.
- Phase 5 frontend polish for login, onboarding, workout-save feedback, and route-level edge states is implemented.
- The temporary local saved-mode path now persists `completed`, `partial`, and `skipped` workout outcomes truthfully through the workout logging UI, including overwrite from an existing completed result.
- The Cloudflare-oriented build shape has been replaced with a Vercel-compatible Nitro deployment path.
- The repo now contains one TanStack Start runtime with preserved imported route structure, stable preview mode, authenticated saved mode backed by Supabase when full env/project setup is available, and a temporary local single-user bypass path for immediate local use.

## Current Active Stream

Vercel deployment validation on top of the implemented TanStack Start + Supabase runtime, with temporary local bypass still restricted to local use only.

## Next Recommended Steps

1. QA + validate the deployed Vercel preview against the live Supabase auth callback, onboarding creation, workout-log overwrite flow, and week-status transitions.
2. BACKEND + remove the temporary local bypass after Supabase email auth is restored and fully verified end to end.

## Canonical References

- `docs/context.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/glossary.md`
- `docs/plans/active/2026-05-05-full-baseline-import-and-stabilization-plan.md`
- relevant product briefs and frontend specs
