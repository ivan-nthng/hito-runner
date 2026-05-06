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
- A temporary local account-backed auth bypass is implemented:
  `/login` now shows visible username/password login for configured local accounts, keeps Magic Link as a secondary option, and still uses an httpOnly cookie without depending on Magic Link delivery for the main local flow.
- Phase 3 mock-seam replacement is implemented through one canonical backend contract.
- Phase 4 completion persistence and backend-derived week status are implemented.
- Phase 5 frontend polish for login, onboarding, workout-save feedback, and route-level edge states is implemented.
- The unauthenticated root flow is now login-first, and first-time onboarding is now JSON-first against the observed week-template structure.
- The temporary local saved-mode path now persists `completed`, `partial`, and `skipped` workout outcomes truthfully through the workout logging UI, including overwrite from an existing completed result.
- The Cloudflare-oriented build shape has been replaced with a Vercel-compatible Nitro deployment path.
- The repo now contains one TanStack Start runtime with preserved imported route structure, stable preview mode, authenticated saved mode backed by Supabase when full env/project setup is available, and a temporary local account-backed bypass path for immediate local use.

## Current Active Stream

Local auth-path refinement on top of the implemented TanStack Start + Supabase runtime, with credentials-first login, JSON-first onboarding, and Magic Link retained as a secondary option.

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
