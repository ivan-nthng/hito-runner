# Project State Snapshot

## Status

Active

## Last Updated

2026-05-13

## Where We Are Now

- Phase 0 and Phase 1 baseline import work are implemented.
- Phase 2 auth and env setup are implemented.
- Phase 2 auth runtime QA fixes are implemented:
  auth callback redirects now resolve against the live runtime origin unless `APP_BASE_URL` explicitly overrides it, and `/login` preserves the original safe `next` intent instead of nesting login into itself.
- A temporary local account-backed auth bypass is implemented:
  `/login` now shows visible username/password login for configured local accounts, keeps an httpOnly cookie without depending on Magic Link delivery for the main local flow, and no longer offers email sign-in links from loopback local runtimes unless a real public `APP_BASE_URL` is configured.
- Canonical plan storage wiring is now implemented for the current saved-mode onboarding flow:
  when a server-side Supabase key is configured, local bypass users map into a Supabase auth user, persist their generated or imported plan into Supabase, and read saved mode back from the canonical Supabase tables instead of the local state file.
- The current local admin plan has now been cut over into Supabase:
  the linked project contains the base persisted schema, the current JSON week is imported as the active canonical plan, and saved-mode SSR now resolves `/progress` and `/workout/$date` from Supabase.
- A practical tester-account lifecycle tool is now implemented:
  Backend can create a tester, reset that tester back to onboarding, optionally reseed plan data, and delete the tester through one canonical CLI path documented in `docs/process/test-user-lifecycle.md`.
- Phase 3 architecture cleanup is now implemented through one canonical persisted richer-plan contract.
- Phase 4 completion persistence and backend-derived week status are implemented.
- Phase 5 frontend polish for login, onboarding, workout-save feedback, and route-level edge states is implemented.
- The production-facing local auth legacy cleanup slice is now implemented:
  deploy-visible login now exposes only the real email auth path, while the temporary local credentials bypass remains available only on loopback local runtimes for development.
- The urgent auth redirect-origin fix is now implemented:
  deploy-like Magic Link and callback flows no longer trust a loopback `APP_BASE_URL` override, so non-local auth redirects resolve back to the real app domain instead of falling through to `localhost`.
- The local Magic Link guard is now implemented:
  loopback local runtimes without a real public `APP_BASE_URL` no longer offer or send email sign-in links, so local auth no longer generates broken `localhost` magic-link emails that cannot be completed outside the running dev server.
- The final Phase 5 legacy-removal slice is now implemented:
  deprecated `week_1_preview[]` import support has been removed from the active runtime, CLI tooling, and visible import contract, so `training-plan-v2` is now the only remaining supported plan-import format.
- The first actual deletion slice from the final Phase 5 plan is now implemented:
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` have been removed from the active runtime and CLI env contract, so public Supabase browser config now resolves only from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- The second actual deletion slice from the final Phase 5 plan is now implemented:
  `SUPABASE_SERVICE_ROLE_KEY` has been removed from the active runtime and CLI env contract, so server-side Supabase admin/write access now resolves only from `SUPABASE_SECRET_KEY`.
- The third actual deletion slice from the final Phase 5 plan is now implemented:
  deprecated single-account local auth env support has been removed from the active runtime and local tooling, so loopback local bypass now resolves only through `LOCAL_AUTH_BYPASS_ENABLED=true` plus `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE=...`.
- The unauthenticated root flow is now login-first, and first-time onboarding is now text-first against the live OpenAI authoring seam, with JSON import visibly demoted to an advanced file-based fallback.
- The product-path recovery fix is now implemented:
  authenticated no-plan or no-workout states now show the same obvious text-entry plan creation surface, with advanced import kept secondary below it.
- The text-first onboarding post-submit transition fix is now implemented:
  successful plan creation now automatically opens a fresh saved-mode home request instead of leaving users stuck in the setup pending state.
- The temporary local saved-mode path now persists `completed`, `partial`, and `skipped` workout outcomes truthfully through the workout logging UI, including overwrite from an existing completed result.
- Home/calendar now resolve `today` from the real runtime local date and default the planning surface to that day instead of a frozen demo date.
- The saved-mode home/calendar page now keeps the main `Today` hierarchy intact as a lighter open header, uses one divided support module on the right, removes the lower metadata strip, and marks day status with compact check/dash/cross symbols instead of bulky per-day pills.
- The first deterministic Garmin comparison slice is now implemented:
  saved-mode workout detail can now upload one Garmin `.fit` file or one `.zip` archive containing exactly one FIT activity file, the backend stores the original asset plus normalized actual metrics through Supabase, and that same backend seam now also persists a conservative deterministic planned-vs-actual comparison that the dedicated workout-detail `Feedback` surface reads back directly; AI analysis, screenshot OCR, provider sync, and calendar evidence markers remain later slices.
- The planned-duration truth-alignment fix for deterministic Garmin comparison is now implemented:
  comparison duration now resolves through the same canonical planned-duration helper used by workout detail, so visible planned duration and comparison planned duration no longer drift apart on distance-backed interval workouts.
- The richer deterministic Garmin comparison payload slice is now implemented:
  the backend now persists explicit comparison signals, `missing_actual` and `not_applicable` reasons, honest delta/tolerance metadata, session-summary facts, and step-summary data when ordered per-step duration comparison is trustworthy; the saved-mode workout-detail `Feedback` surface now reads that richer structured comparison truth back without adding AI interpretation.
- The bounded Garmin AI interpretation slice is now implemented:
  saved-mode workout detail now persists one `workout_ai_insights` row linked to the latest deterministic comparison, generated only from planned workout truth, normalized Garmin actual metrics, deterministic comparison payload, current week context, and next-workout summary; the dedicated `Feedback` surface now reads that bounded AI interpretation back separately from the deterministic facts.
- The first immediate Garmin UX cleanup slice is now implemented:
  workout-detail `Feedback` now uses one calmer divided hierarchy with plain-language `Upload Garmin file`, `Plan vs run`, and `Recommendation` framing; `Log result` now includes one lightweight path into `Feedback` for deeper review; and `/integrations` no longer contradicts the live Garmin path with stale `Preview / View status / Not connected` placeholder language.
- The next post-cleanup Garmin entry slice is now implemented:
  `Log result` now shows a richer state-aware Garmin invitation that explains the payoff of upload before evidence exists and turns into a continuation path once Garmin evidence or ready feedback already exists, while `Feedback` stays the canonical detailed evidence/comparison/recommendation surface.
- The next post-`Log result` invite payoff slice is now implemented:
  the near-upload area inside workout-detail `Feedback` now uses one compact state-aware summary that tells the runner whether no evidence exists yet, a Garmin file is attached, the run summary is ready, the factual comparison is ready, the recommendation is available, or the last parse failed.
- The next post-payoff recommendation-refinement slice is now implemented:
  the bounded AI note inside workout-detail `Feedback` now leads with one runner-facing next-step takeaway, keeps the factual comparison visibly primary above it, and translates mixed-evidence caution into plainer language instead of technical AI-section framing.
- The next Feedback cleanup/humanization follow-up is now implemented:
  workout-detail `Feedback` now removes the heavy outer evidence card chrome, shows the attached Garmin file explicitly, supports removing that Garmin evidence through the saved-mode seam, merges comparison meta into one calmer strip, and humanizes planned target labels such as effort and pace in the right-side workout context.
- The loaded attached-evidence `Feedback` design pass is now implemented:
  once a Garmin file is already attached, the surface now switches to attached-first ownership, keeps one `Ready` pill at the top, strengthens `Plan vs run` with one verdict row and compact summary strip, reduces run-summary mini-card feel, and moves technical comparison caveats into one quieter disclosure.
- The bounded calendar-evidence seam is now implemented end to end:
  the canonical saved-mode workout snapshot now carries one minimal `feedbackMarker` summary derived from existing Garmin truth, with `evidence_attached` for any saved Garmin asset and `feedback_ready` for workouts that already have canonical actual metrics plus deterministic comparison; saved-mode month/week calendar cards and the current-day home hero now render that marker as a small secondary cue that routes into the workout-detail `Feedback` tab.
- The Safari Garmin picker compatibility fix is now implemented:
  the visible FIT/ZIP control no longer relies on Safari-native `accept` MIME filtering and instead validates `.fit` or `.zip` after selection before posting multipart data to the backend route.
- Saved-mode shell navigation back to `/` now uses a fresh home request, and the `Tomorrow` summary no longer falls through to broken `nullkm · 0′` placeholders for interval-style workouts.
- The profile/sidebar area now shows the runner name plus active plan title, removes duplicate top-level sign-out, and owns a lightweight saved-mode advanced import entry path.
- Workout detail rest days are now intentionally sparse and the right-side detail context is grouped into one tighter frame instead of multiple bordered cards.
- The first workout-page refinement pass is now implemented:
  the three-block page structure remains intact, saved result states now surface as check, dash, or cross markers near workout identity and in the right-side context, `Week Status` is progress-driven, `Log result` stays focused on manual completion truth, and the dedicated `Feedback` tab now owns the Garmin FIT/ZIP evidence seam with screenshot still clearly later-only.
- The remaining upload-flow/template UI slice is now implemented:
  the saved-mode advanced import flow now accepts only canonical `training-plan-v2` JSON while still normalizing that contract into the same canonical persisted plan seam and ignoring runtime-only v2 fields that do not belong in plan truth.
  The same flow still includes a real `Download JSON template` affordance for file-based plan handoff.
- The advanced import reliability pass is now implemented:
  successful `training-plan-v2` apply now exits through a fresh home reload instead of an immediate in-place router refresh, and the canonical template artifact now ships a reserved `_ml_agent_template` instruction block that is accepted but ignored at import time.
- The first-day plan-apply semantics are now deliberately simplified:
  generated and imported plans still flow through one canonical apply-time normalization seam in `src/lib/plan-apply-policy.ts`, but a today-conflict no longer blocks normal apply by default. The safe backend path now preserves today’s existing workout, drops the incoming day 1 workout, and starts original day 2 tomorrow.
- The only remaining alternate path is explicit destructive replacement:
  `replace_first_day` still exists for callers that intentionally want to replace today, and it is still blocked honestly whenever that would detach saved workout history.
- The older symmetric chooser model is no longer the canonical backend behavior:
  the existing frontend chooser can now be reduced to an optional destructive override affordance instead of a required equal-weight conflict resolver.
- The frontend simplification pass is now implemented:
  normal text-first and advanced JSON apply both follow the backend safe default without blocking on a preserve-vs-ignore chooser,
  `Replace today` remains as the only explicit destructive override,
  and the saved-mode import dialog now uses internal scroll plus shorter calmer copy.
- The hierarchy cleanup pass is now implemented:
  `Replace today` is disclosed as a secondary destructive exception instead of an equal primary sibling,
  advanced JSON paste/template tooling is quieter inside expert disclosure,
  and the `Log result` Garmin path is a lighter continuation row into `Feedback` rather than a competing block.
- The first app-wide simplification slice is now implemented:
  `/integrations` is no longer a primary desktop or mobile nav item,
  the route remains reachable as a quieter connections/status utility,
  and stale disabled shell menu utilities have been removed from the primary profile menu.
- The second app-wide simplification slice is now implemented:
  saved-mode home/calendar has a calmer rhythm,
  month cells no longer carry inline metric/dashboard clutter,
  the duplicate calendar-level week-status treatment is removed,
  and feedback markers remain as small secondary cues behind completion truth.
- The third app-wide simplification slice is now implemented:
  `/progress` is reduced to a compact summary route with one aggregate summary group,
  smaller weekly planned-vs-actual volume,
  honest sparse weekly-volume empty copy,
  recent consistency,
  and no static placeholder trend chart or heavy explanatory support frame.
- The fourth app-wide simplification slice is now implemented:
  `/body` is no longer a primary desktop or mobile nav destination,
  remains reachable as a quieter body-notes utility,
  and its route chrome is reduced to an open body-map geometry area plus divider-based selected-area,
  daily-notes,
  and current-scope sections.
- The fifth app-wide simplification slice is now implemented:
  `/hitoDS` now follows the simplified live product instead of preserving historical overbuilt examples,
  with open route rhythm,
  divider-based grouping,
  compact summary truth,
  secondary feedback/status markers,
  utility/disclosure actions,
  simplified shell navigation,
  and explicit visualization geometry exceptions.
- The current `training-plan-v2` runtime still keeps `plan_cycles` plus `planned_workouts` as the only canonical storage model, writes richer segment structure into `planned_workouts.steps jsonb`, and still deliberately defers import-batch provenance plus editability-oriented schema expansion to a later phase.
- The current Phase 3 cleanup slice is now implemented:
  persisted plan truth now preserves `schema_version`, `source_kind`, `target_date`, goal metadata, plan preferences, source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority through the same canonical Supabase rows used by JSON import, structured authoring, and OpenAI text authoring.
  New writes now persist canonical target keys only, while legacy target aliases remain read-compatible for older rows instead of being written again.
- The first post-Phase-3 correction pass is now implemented:
  richer `training-plan-v2` normalization now accepts the live fuller segment DSL used by the richer reference files, workout-detail target shaping no longer leaks opaque structured metadata into `[object Object]`, and richer imported interval workouts no longer collapse into misleading visible easy-run identity.
- The first structured plan-authoring backend slice is now implemented:
  the service accepts one bounded structured input contract, normalizes it server-side, generates canonical `training-plan-v2` plan data, and persists that plan through the same Supabase `plan_cycles` plus `planned_workouts` seam already used by JSON import.
  That bounded contract remains a backend and ops asset behind the visible text-first onboarding UI, and Backend plus ops can still validate and persist generated structured plans through `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>`.
- The first OpenAI-backed text-to-plan backend slice is now implemented:
  the service accepts one bounded free-text request, asks OpenAI for structured authoring input, validates that model output deterministically, and persists only the resulting canonical `training-plan-v2` plan through the same Supabase seam already used by JSON import and structured authoring.
  The visible onboarding UI is now wired to this path, and local live validation is green with a working `OPENAI_API_KEY`.
- The Phase 4 frontend cleanup slice is now implemented:
  visible no-plan and shell surfaces present text-first plan creation as the primary product path, while JSON remains available only as a demoted advanced import for existing Hito plan files, migration, and testing.
- The first Hito design-system implementation slices are now implemented:
  shared low-card CSS primitives exist for core surfaces, tiered buttons, tiered inputs, textareas, helper/error text, tabs, labels, captions, dividers, grouped rows, metric rows, compact summary metrics, compact chart legends, compact tooltip shells, compact severity scales, compact severity summaries, compact status pills, compact status markers, shell navigation rows, shell profile triggers, shell dropdown rows, disclosure, and setup/empty/error state surfaces; auth, text-first onboarding, advanced import, shell chrome, home/calendar support surfaces, workout-detail grouped/status/metric surfaces, route-level state surfaces, progress summary surfaces, body severity micro-UI, preserved integration utility rows, calendar and workout-structure tooltip chrome, and deeper workout-structure plus completion-log micro-surfaces now use those primitives; `/hitoDS` provides an internal simplified product-language reference with dedicated design-system navigation instead of runner-facing shell chrome; and chart bars, plotted lines, interval block widths, SVG silhouettes, and marker coordinates are documented as intentional visualization geometry exceptions.
- The full Hito design-system normalization track is now effectively complete from the visible product perspective:
  final Safari QA found no obvious stray custom UI drift in the tested runner-facing scope, `/hitoDS` is the accepted internal reference baseline, and only documented visualization geometry exceptions remain outside the shared Hito component families.
- The remaining first-pass v2 rendering-truth gaps are now fixed:
  distance-based interval reps no longer invent minute-based per-rep UI,
  tempo workouts now render with a tempo-specific visible identity on home and workout detail,
  and visible distance totals now round consistently instead of leaking floating precision.
- Saved-mode advanced import replacement now has a continuity guard:
  logged workout history is carried forward only for exact deterministic matches on logged dates, and unsafe replacements are rejected instead of silently resetting visible progress.
  Older broken replacements that already stranded logs on archived copies of the same plan window are now repaired back onto the active plan before saved-mode reads and replacement checks run.
- The Cloudflare-oriented build shape has been replaced with a Vercel-compatible Nitro deployment path.
- The repo now contains one TanStack Start runtime with preserved imported route structure, stable preview mode, authenticated saved mode backed by Supabase, and a temporary local account-backed bypass path for immediate local use.

## Current Active Stream

Post-normalization stabilization:
the visible interface is now treated as owned by shared Hito DS primitives and documented shell families, while remaining non-DS geometry stays intentionally constrained to charts, interval widths, SVG silhouettes, and marker coordinates.

## Next Recommended Steps

1. QA + validate the visible free-text authoring flow end to end alongside the demoted advanced JSON fallback, with emphasis on richer-plan route rendering and replacement continuity.
2. QA + verify that no-plan accounts read as one text-first product path in Safari and that advanced import remains discoverable without competing with onboarding.
3. Keep future UI changes inside shared Hito primitives or documented geometry exceptions, and use `/hitoDS` as the inspection surface before shipping new visual patterns.

## Canonical References

- `docs/context.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/glossary.md`
- `docs/plans/active/2026-05-05-full-baseline-import-and-stabilization-plan.md`
- relevant product briefs and frontend specs
