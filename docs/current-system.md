# Current System

## Runtime

- one TanStack Start application lives at the repo root
- the imported baseline structure remains preserved in `src/`, including generated route tree, shell, components, UI primitives, and styles
- build and dev commands come from `package.json`
- local production-like `npm run start` now explicitly loads `.env.local` so the temporary env-backed admin login reaches the built server path
- local QA on `localhost:3000` should use the current built output through `npm run serve:local` after `npm run build`; long-lived server processes must be restarted after rebuilds so HTML and hashed assets come from the same `.output`
- the canonical deployment runtime is now Nitro for Vercel:
  `npm run build` emits `.output/` locally
  `vercel build` emits `.vercel/output/` with Vercel functions
- request middleware in `src/start.ts` now resolves either:
  a temporary local account session from an httpOnly cookie when the local bypass env contract is enabled
  or a Supabase session through `supabase.auth.getUser()` when auth env exists
  and otherwise falls back to signed-out preview context instead of crashing preview routes

## Implemented Route Contract

- `src/routes/index.tsx`
  renders one of three states behind the same route:
  login-first unauthenticated entry
  authenticated onboarding gate
  authenticated persisted weekly plan, where the saved-mode hero keeps the preserved workout hierarchy as an open low-chrome header, a light right-side support module, and the calendar below
- `src/routes/login.tsx`
  renders either:
  a minimal `Hito.` auth-first entry screen where loopback local runtimes may still show the temporary credentials tab for development
  or the real email auth path only when the request is deploy-like
  or the email magic-link entry flow when local credentials are not configured
- `src/routes/hitoDS.tsx`
  renders the internal Hito design-system playground with its own design-system sidebar and no runner-facing shell chrome, documenting and demonstrating the implemented low-card surface, typography, button, input, row, shell navigation, card, and dropdown primitives without adding a runner-facing product capability, and now serves as the reference baseline for ongoing Hito UI inspection
- `src/routes/api.auth.confirm.tsx`
  exchanges the Supabase auth code into a cookie-backed session
- `src/routes/api.auth.local-login.tsx`
  validates the temporary local account credentials contract and sets the local auth cookie only on loopback local runtimes; deploy-like requests receive no production-facing local login path
- `src/routes/api.auth.logout.tsx`
  clears the temporary local auth cookie and signs out Supabase sessions when present
- `src/routes/workout.$date.tsx`
  renders workout detail for preview or persisted data, treats the route search as the source of truth for the active tab, preserves `tab=complete`, logs results through the canonical backend mutation when saved mode is active, now keeps rest-day detail sparse with one grouped right-side context panel, and preserves the three-block page structure with richer surface treatment, result-state badges, and progress-driven week status
- `src/routes/progress.tsx`
  renders the preserved analytics shell using preview or persisted aggregates from the same data seam, with large summary stats and chart legends now mapped to shared Hito analytics primitives
- `src/routes/body.tsx`
  renders a preserved body-note preview shell, with severity scale controls and active-log severity summaries mapped to shared Hito severity primitives while the body-map SVG remains visualization-specific
- `src/routes/integrations.tsx`
  renders a preserved integration shell that now points honestly to the live workout-detail Garmin feedback path and keeps screenshot import plus broader plan adjustments clearly later

## Data Contract

- `src/data/training-plan.json`
  remains the imported template for signed-out preview only
- `src/lib/training.ts`
  is now the canonical normalized seam for:
  preview snapshot creation
  real current-date resolution for preview and saved-mode calendar behavior
  persisted snapshot shape
  workout lookup
  status derivation
  weekly aggregates
- `src/lib/training-api.ts`
  owns server-backed loading and mutation entry points for home, workout detail, progress, login, text-first onboarding, advanced JSON import, internal structured authoring, and workout logging
- `src/lib/imported-plan.ts`
  owns the canonical `training-plan-v2` import contract, JSON validation helpers, the runtime-noise exclusions for v2, the bounded canonical target and prescription normalization rules, the accepted-but-ignored `_ml_agent_template` instruction block, and the mapping from accepted import shapes into the canonical saved workout shape
- `src/lib/structured-plan-authoring.ts`
  owns the first server-side structured authoring contract, its normalization rules, and the deterministic generator that emits canonical `training-plan-v2` plan truth before persistence
- `src/lib/openai-plan-authoring.ts`
  owns the first server-side OpenAI text-to-plan seam, prompts the model for bounded structured authoring input, validates that model output, and converts the validated authoring input into canonical `training-plan-v2` truth before persistence
- `src/lib/local-auth.ts`
  owns the temporary local account credential contract, account discovery, and cookie session helpers
- `src/lib/local-auth-supabase.ts`
  owns the temporary local-account to Supabase-user resolution used when the local bypass enters the canonical Supabase storage seam
- `supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql`
  defines the minimum persisted schema and RLS posture for runner profiles, plan cycles, planned workouts, and workout logs
- `supabase/migrations/20260508104250_phase_3_tighten_persisted_plan_semantics.sql`
  adds the current richer-plan persistence columns that matter at runtime:
  `plan_cycles.schema_version`, `source_kind`, `target_date`, `goal_metadata`, `plan_preferences`
  plus `planned_workouts.source_workout_id`, `source_workout_type`, `planned_rpe`, `estimated_fatigue`, and `recovery_priority`

## State And Lifecycle Rules

- signed-out users now hit a login-first entry surface on `/` and do not create trusted history
- signed-out preview routes can still render on direct route access when real Supabase env values are absent, but they are no longer the primary entry experience
- temporary local-bypass users may still enter saved mode through visible credentials login on loopback local runtimes only, while deploy-like runtimes expose only the real auth surface and authenticated saved-mode truth always resolves through Supabase
- authenticated users without `runner_profile` are routed into setup on `/`
- authenticated users with a saved profile but no active `plan_cycle` now also stay honestly in setup until a canonical creation path succeeds
- visible onboarding on `/` is now text-first:
  authenticated users without setup describe their goal and current context in one compact request, the backend turns that request into bounded structured authoring input through OpenAI, validates it deterministically, and only then generates canonical `training-plan-v2` plan data before persistence
- the backend now also has one first-pass free-text authoring seam:
  authenticated saved mode can accept one free-text request server-side, ask OpenAI for bounded structured authoring input, validate that output deterministically, and only then generate canonical `training-plan-v2` plan truth for persistence
- advanced JSON import remains available inside onboarding as a demoted fallback path for existing Hito plan files, migration, and testing
- text-first authoring, advanced JSON import, and internal structured authoring all create or update one `runner_profile` and one active `plan_cycle` through the same canonical persisted seam
- canonical apply-time start normalization now lives in [src/lib/plan-apply-policy.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-apply-policy.ts):
  explicit future `start_date` is preserved, while past or non-future `start_date` normalizes to `today` before persistence
- that same backend-owned apply seam now also handles first-day conflicts:
  if a normalized plan would start today with a non-rest day while the current active plan already has a non-rest workout today, the default backend behavior is now the safe path:
  preserve today’s existing workout, drop incoming day 1, and start the imported original day 2 tomorrow without blocking normal apply
- continuity safety still evaluates the final transformed workout dates, not the raw imported dates:
  the default preserved-today path still cannot detach logged history, and the only alternate path is explicit destructive `replace_first_day`, which keeps incoming day 1 on today and is blocked honestly when it would break exact saved-history carry-forward
- the frontend now mirrors that simplified policy instead of the older symmetric chooser:
  text-first apply and advanced JSON apply both use the safe backend default without a required preserve-vs-ignore modal step
  and only one explicit destructive override remains in the UI: `Replace today`, now kept behind a quieter disclosure instead of being shown as an equal sibling of the safe action
- OpenAI-generated authoring output never persists directly:
  the app validates the model response, converts it into canonical plan data, and persists through the same `plan_cycles` plus `planned_workouts` seam already used by JSON import and structured authoring
- canonical richer-plan truth now survives more explicitly in that same seam across JSON import, structured authoring, and OpenAI text authoring:
  `plan_cycles` preserves `schema_version`, `source_kind`, `target_date`, goal metadata, and plan preferences
  while `planned_workouts` preserves source workout identity plus normalized fatigue and recovery semantics
- preview-derived active-plan bootstrap has been removed from the authenticated runtime path:
  the app no longer auto-creates a saved plan from preview data behind the scenes
- the imported JSON week creates the saved `planned_workouts` directly instead of shifting the preview template onto today
- home and calendar now anchor `today` to the real runtime local date instead of a frozen template start date
- the preview snapshot no longer caches a stale `currentDate`, so reloads can reflect the actual current day
- the saved-mode home hero now keeps week status in the top/header treatment, uses a dismissible right-side `Planning Note` or plan-window support note plus the next/nearest workout context, and no longer repeats week status inside that side support area
- saved-mode home-return affordances in the shell now reopen `/` through a fresh document request so already-open tabs can recover the authoritative home route even when a stale client fetch path fails
- calendar day cells now mark completed workouts with a clearer green confirmation state while keeping today and rest states readable
- workout completion is the canonical mutation and upserts one `workout_log` per planned workout
- the sidebar profile trigger now resolves one viewer label plus current plan title from the shared auth and snapshot seam, and owns the saved-mode advanced import entry point plus sign-out action
- the sidebar plan-note support block is locally dismissible and no longer repeats the same week status already shown in the top header
- the saved-mode advanced import dialog reuses the canonical onboarding mutation instead of creating a second plan-import path
- that same saved-mode import dialog now keeps its own internal scroll and calmer copy so long apply/import content fits without turning into an oversized blocking wall
- after a successful saved-mode advanced import apply, the client now leaves the current page through a fresh document request to `/` instead of relying on an immediate in-place router refresh on the replaced plan state
- the saved-mode advanced import dialog now accepts only canonical `training-plan-v2` files, and runtime-only v2 fields such as `status`, `completion_state`, and sync or feedback placeholders remain non-canonical
- the first structured authoring generator now emits the same canonical `training-plan-v2` family used by JSON import, persists it through `plan_cycles` plus `planned_workouts`, and reuses `steps jsonb` as the only structured workout payload
- normalized `planned_workouts.steps jsonb` now preserves explicit segment-level `segment_id`, `segment_type`, `sequence`, `prescription`, and canonical target keys such as `hr_bpm_range` and `pace_min_per_km_range`
  while one bounded interval DSL supports both distance-based and time-based repeat units
  older persisted rows may still carry legacy target aliases, but new writes now persist only the canonical target keys
- richer route-facing target shaping now exposes only display-safe scalar target values and suppresses opaque nested metadata instead of letting structured extras leak into visible `[object Object]` strings
- saved-mode workout identity now keeps richer imported source workout type truth available at runtime, so canonical `intervals`, `progression`, `race`, and `recovery` imports do not silently collapse into misleading visible `easy` labels
- saved-mode rendering now keeps distance-first interval reps visible as distance-first in workout structure UI, resolves tempo-backed quality workouts to a tempo-specific visible identity, and formats visible distance totals through one shared rounding seam
- the same dialog still exposes one static `Download JSON template` affordance for file-based plan handoff, but the saved-mode apply path is no longer legacy-only
- active-plan replacement now carries saved workout logs forward only for exact deterministic matches on logged days by date, workout type, title, notes, and steps; otherwise the apply step is rejected and the current active plan remains unchanged
- if older broken replacements already stranded logs on archived plan cycles from the same user and plan window, the persisted seam repairs those orphaned same-date logs back onto the current active plan before evaluating visible state or replacement safety
- saved workout logs can be overwritten from `completed` to `partial` or `skipped`, and skipped truth persists with null actual metrics instead of backfilled planned defaults
- past-due planned workouts without a saved log are treated as `skipped` until the user overwrites them with a real result
- `week_status` is derived on the backend-facing seam from persisted workout state, not from client-only heuristics
- rest days no longer render distance, duration, load, or empty target and note sections by default; only genuine assigned rest-day content is surfaced
- workout detail now shows saved result semantics directly in the route chrome:
  check for `completed`
  dash for `partial`
  cross for `skipped`
- the workout-detail `Week Status` block now answers one deterministic question through a progress bar:
  completed non-rest workouts in the current week
- `src/components/CompletionPanel.tsx`
  now keeps `Log result` focused on manual completion truth, adds one lighter state-aware Garmin continuation row into `Feedback`, and keeps the dedicated workout-detail `Feedback` surface as the canonical owner of the live `FIT / ZIP file` control, parsed Garmin evidence summary, factual plan-vs-run comparison readback, and the bounded AI interpretation readback
- the first Garmin ingest seam accepts only:
  one `.fit` file
  or one `.zip` archive that contains exactly one usable FIT activity file
- the visible Garmin upload picker intentionally avoids Safari-native MIME/UTI filtering and validates the `.fit` or `.zip` extension after selection so Safari can pass the file to the backend route
- uploaded Garmin result truth now persists through two additive canonical tables:
  `workout_result_assets` for immutable upload metadata and parse state
  `workout_actual_metrics` for normalized actual workout metrics and structured actual step payload
- uploaded Garmin result truth now also persists one additive deterministic comparison table:
  `workout_comparisons` stores the latest backend-owned planned-vs-actual comparison for each normalized Garmin result
- uploaded Garmin feedback truth now also persists one additive interpretation table:
  `workout_ai_insights` stores one backend-generated bounded interpretation and next-workout recommendation linked to a deterministic comparison row
- the first slice stores the original asset in the private `workout-result-assets` Supabase bucket, extracts FIT deterministically, parses with a deterministic FIT parser, and normalizes summary metrics plus lap and step payload without invoking AI on raw binary data
- the second Garmin slice now computes deterministic planned-vs-actual comparison immediately after normalized Garmin metrics are written, using only backend truth from:
  planned workout date
  the same canonical planned duration seam already shown on workout detail
  explicit planned distance when the plan defines one
  structured-step count only when the workout shape is simple enough to compare honestly
- comparison truth is intentionally conservative:
  `comparison_status` is one of `complete`, `partial`, or `insufficient_data`
  `completion_state` is one of `matched`, `partially_matched`, or `unclear`
  and the stored payload now keeps:
  explicit signal objects for date, duration, distance, and structured-step-count truth
  honest `missing_actual` and `not_applicable` reasons
  bounded delta and tolerance metadata when the metric supports it
  session-summary facts plus a step-summary block when ordered per-step duration comparison is trustworthy
  instead of AI verdict prose
- the next Garmin slice now adds one bounded AI layer on top of those persisted facts only:
  `workout_ai_insights` is generated from planned workout truth, normalized actual metrics, deterministic comparison payload, week context, and next-workout summary
  it never parses raw FIT binary and never replaces deterministic comparison
- current workout-detail `Feedback` readback now exposes the latest Garmin asset, latest normalized actual metrics, latest deterministic comparison, and latest bounded AI interpretation in a dedicated evidence surface separate from manual completion logging
- that `Feedback` surface now uses a flatter divided layout with plain-language section framing:
  upload explains why it helps
  attached Garmin evidence now shows the live file state and supports explicit removal through the same saved-mode seam
  the near-upload summary now reports compact state-aware payoff such as attached, run summary ready, comparison ready, recommendation ready, or retry needed
  factual `Plan vs run` stays primary
  bounded recommendation stays secondary and now reads as one runner-facing next-step note with plainer caution context instead of a more technical AI appendix
- when Garmin evidence is already attached, the loaded `Feedback` state now switches from upload-first framing into attached-first review ownership:
  the top area shows an attached-file owner row with quiet file metadata
  upload buttons stay hidden until that evidence is removed
  `Plan vs run` now leads with a stronger verdict row, one compact `Evidence / Confidence / Checks` strip, calmer run-summary deltas, and one quieter `Comparison notes` disclosure for technical caveats
- the saved-mode workout snapshot now also carries one bounded `feedbackMarker` summary per workout day, derived only from existing Garmin feedback truth:
  `evidence_attached` when a Garmin result asset exists
  `feedback_ready` when canonical actual metrics plus deterministic comparison exist for that day
- saved-mode home and calendar now render that `feedbackMarker` as a bounded secondary evidence indicator that links directly into the existing workout-detail `Feedback` tab without replacing completion-state truth
- screenshot OCR, Garmin sync, Strava sync, and any plan-adjustment automation are still later slices
- the first Hito design-system implementation slices now exist in shared CSS primitives for low-card surfaces, tiered buttons, tiered fields, textareas, helper/error text, tabs, labels, captions, dividers, grouped rows, metric rows, compact status pills, compact status markers, setup/empty/error state surfaces, progress analytics stats, chart legends, tooltip shells, body severity scales, body severity summaries, shell navigation rows, shell profile triggers, and shell dropdown rows; those primitives are applied to auth, onboarding, advanced import, shell chrome, home/calendar support surfaces, workout-detail grouped/status/metric surfaces, deeper workout-structure and completion micro-surfaces, route-level state surfaces, progress analytics surfaces, body severity micro-UI, preserved integration utility rows, and the internal `/hitoDS` reference page
- remaining visualization-specific chart bars, plotted lines, interval block widths, SVG silhouettes, and marker coordinates are documented as intentional geometry exceptions rather than generalized Hito component families
- final Safari QA on the visible runner-facing scope found no obvious stray custom UI drift, so future UI work should extend shared Hito primitives or documented shell families instead of introducing new route-local visual treatments

## Trusted-Output Contract

- authenticated profile, plan, workout logs, and week status are trusted product output
- temporary local-bypass sessions are trusted only as a local account-backed identity bridge into the same Supabase-backed saved mode and remain a removal target
- the temporary local login path now resolves the runner into a Supabase auth user by email and reads the canonical plan, workouts, and logs from Supabase
- signed-out preview mode remains untrusted and clearly labeled as preview
- `/progress`, `/body`, and `/integrations` still preserve shell breadth without claiming provider, AI, OCR, weather, or readiness truth

## Persistence And Storage Rules

- Supabase auth remains the intended long-term session source of truth
- a temporary local-only credentials bypass may become the active session source only for loopback local runtimes when `LOCAL_AUTH_BYPASS_ENABLED=true`
- preferred public env usage is `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- app name now falls back directly to `Hito Running` when `NEXT_PUBLIC_APP_NAME` is unset
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are now the only supported public Supabase browser env names
- `APP_BASE_URL` is an optional server-only non-loopback override for auth redirects; deploy-like requests now prefer the real runtime origin over any loopback override, and local loopback development should usually leave `APP_BASE_URL` unset so magic-link and callback URLs stay on the local origin
- `SUPABASE_SECRET_KEY` is now the only supported server-only key for canonical Supabase writes, local-bypass plan imports, and admin-backed persisted saved mode
- temporary local-only auth env now uses only `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE` for an untracked local account list
- required Vercel env for the live Supabase-backed auth path is `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- temporary local-only auth env must stay unset on Vercel because the bypass store is a local unblock mechanism, not a production deployment contract
- server-side writes and persisted reads flow through one backend seam rather than direct client DB access
- `npm run import:current-plan` now exists as the narrow script for importing a canonical `training-plan-v2` file into the canonical Supabase plan tables for the current local bypass user
- `npm run test-user -- ...` is now the canonical Backend lifecycle tool for tester-account create, reset, optional plan seeding, and delete against the real Supabase auth/data model
- `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>` is now the canonical ops path for validating bounded structured authoring input and persisting the generated canonical plan into Supabase without a frontend wizard
- `npm run author-plan-from-text -- --email <tester-email> --prompt "<free text>"` is now the narrow ops path for exercising the first OpenAI-backed text-to-plan seam against the same canonical Supabase persistence path
- `.tanstack/hito-running-local-accounts.json` is now the preferred ignored local credentials file for repeatable tester login on the temporary local bypass path

## Runtime Invariants

- one app runtime only
- one canonical data seam only
- one canonical deployment path only: Vercel via Nitro
- one temporary local bypass path only while Supabase email auth is intentionally paused
- no framework migration from TanStack Start
- preview shells remain honest about not being wired to future capabilities
