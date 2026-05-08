# Project State Snapshot

## Status

Active

## Last Updated

2026-05-07

## Where We Are Now

- Phase 0 and Phase 1 baseline import work are implemented.
- Phase 2 auth and env setup are implemented.
- Phase 2 auth runtime QA fixes are implemented:
  auth callback redirects now resolve against the live runtime origin unless `APP_BASE_URL` explicitly overrides it, and `/login` preserves the original safe `next` intent instead of nesting login into itself.
- A temporary local account-backed auth bypass is implemented:
  `/login` now shows visible username/password login for configured local accounts, keeps Magic Link as a secondary option, and still uses an httpOnly cookie without depending on Magic Link delivery for the main local flow.
- Canonical plan storage wiring is now implemented for the current saved-mode onboarding flow:
  when a server-side Supabase key is configured, local bypass users map into a Supabase auth user, persist their generated or imported plan into Supabase, and read saved mode back from the canonical Supabase tables instead of the local state file.
- The current local admin plan has now been cut over into Supabase:
  the linked project contains the base persisted schema, the current JSON week is imported as the active canonical plan, and saved-mode SSR now resolves `/progress` and `/workout/$date` from Supabase.
- A practical tester-account lifecycle tool is now implemented:
  Backend can create a tester, reset that tester back to onboarding, optionally reseed plan data, and delete the tester through one canonical CLI path documented in `docs/process/test-user-lifecycle.md`.
- Phase 3 mock-seam replacement is implemented through one canonical backend contract.
- Phase 4 completion persistence and backend-derived week status are implemented.
- Phase 5 frontend polish for login, onboarding, workout-save feedback, and route-level edge states is implemented.
- The unauthenticated root flow is now login-first, and first-time onboarding is now text-first against the live OpenAI authoring seam, with JSON import kept as a secondary advanced path.
- The temporary local saved-mode path now persists `completed`, `partial`, and `skipped` workout outcomes truthfully through the workout logging UI, including overwrite from an existing completed result.
- Home/calendar now resolve `today` from the real runtime local date and default the planning surface to that day instead of a frozen demo date.
- The saved-mode home/calendar page now keeps the main `Today` card intact, uses one grouped support card on the right, removes the lower metadata strip, and marks completed calendar days more clearly.
- Saved-mode shell navigation back to `/` now uses a fresh home request, and the `Tomorrow` summary no longer falls through to broken `nullkm · 0′` placeholders for interval-style workouts.
- The profile/sidebar area now shows the runner name plus active plan title, removes duplicate top-level sign-out, and owns a lightweight saved-mode `Upload JSON` entry path.
- Workout detail rest days are now intentionally sparse and the right-side detail context is grouped into one tighter frame instead of multiple bordered cards.
- The first workout-page refinement pass is now implemented:
  the three-block page structure remains intact, saved result states now surface as check, dash, or cross markers near workout identity and in the right-side context, `Week Status` is progress-driven, and the log-result notes area now reserves an honest `Upload result` placeholder seam.
- The remaining upload-flow/template UI slice is now implemented:
  the saved-mode `Upload JSON` flow now accepts both the legacy `week_1_preview[]` import and the first supported `training-plan-v2` import, normalizes both into the same canonical persisted plan seam, and ignores runtime-only v2 fields that do not belong in plan truth.
  The same flow still includes a real `Download template` affordance for structured `training-plan-v2` authoring.
- The current first `training-plan-v2` slice keeps `plan_cycles` plus `planned_workouts` as the core storage model, writes richer segment structure into `planned_workouts.steps jsonb`, and deliberately defers import-batch provenance plus editability-oriented schema expansion to a later phase.
- The next contract-alignment slice is now implemented:
  persisted `steps jsonb` keeps canonical segment metadata and bounded prescription structure, including stable `segment_id`, canonical target keys, and one repeat-unit DSL that covers both interval-by-distance and interval-by-time without creating a second runtime path.
- The first structured plan-authoring backend slice is now implemented:
  the service accepts one bounded structured input contract, normalizes it server-side, generates canonical `training-plan-v2` plan data, and persists that plan through the same Supabase `plan_cycles` plus `planned_workouts` seam already used by JSON import.
  That bounded contract remains a backend and ops asset behind the visible text-first onboarding UI, and Backend plus ops can still validate and persist generated structured plans through `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>`.
- The first OpenAI-backed text-to-plan backend slice is now implemented:
  the service accepts one bounded free-text request, asks OpenAI for structured authoring input, validates that model output deterministically, and persists only the resulting canonical `training-plan-v2` plan through the same Supabase seam already used by JSON import and structured authoring.
  The visible onboarding UI is now wired to this path, and local live validation is green with a working `OPENAI_API_KEY`.
- The remaining first-pass v2 rendering-truth gaps are now fixed:
  distance-based interval reps no longer invent minute-based per-rep UI,
  tempo workouts now render with a tempo-specific visible identity on home and workout detail,
  and visible distance totals now round consistently instead of leaking floating precision.
- Saved-mode `Upload JSON` replacement now has a continuity guard:
  logged workout history is carried forward only for exact deterministic matches on logged dates, and unsafe replacements are rejected instead of silently resetting visible progress.
  Older broken replacements that already stranded logs on archived copies of the same plan window are now repaired back onto the active plan before saved-mode reads and replacement checks run.
- The Cloudflare-oriented build shape has been replaced with a Vercel-compatible Nitro deployment path.
- The repo now contains one TanStack Start runtime with preserved imported route structure, stable preview mode, authenticated saved mode backed by Supabase when full env/project setup is available, and a temporary local account-backed bypass path for immediate local use.

## Current Active Stream

QA handoff for validating the new visible text-first onboarding surface on top of the now-validated OpenAI-backed authoring seam, while local auth remains the temporary entry path.

## Next Recommended Steps

1. QA + validate the visible free-text authoring flow end to end alongside the existing structured-input and JSON fallback paths.
2. BACKEND + remove the temporary local fallback store after the Supabase-backed path is considered stable enough to be the only saved-mode source for local testing.
3. FRONTEND + continue small text-authoring polish only if QA finds clarity gaps, without expanding into a wizard.

## Canonical References

- `docs/context.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/glossary.md`
- `docs/plans/active/2026-05-05-full-baseline-import-and-stabilization-plan.md`
- relevant product briefs and frontend specs
