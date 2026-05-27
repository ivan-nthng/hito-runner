# Current System

## Runtime

- one TanStack Start application lives at the repo root
- the imported baseline structure remains preserved in `src/`, including generated route tree, shell, components, UI primitives, and styles
- build and dev commands come from `package.json`
- local production-like `npm run start` now explicitly loads `.env.local` so server-only admin and Supabase env reaches the built server path
- local QA on `localhost:3000` should use the current built output through `npm run serve:local` after `npm run build`; long-lived server processes must be restarted after rebuilds so HTML and hashed assets come from the same `.output`
- the canonical deployment runtime is now Nitro for Vercel:
  `npm run build` emits `.output/` locally
  `vercel build` emits `.vercel/output/` with Vercel functions
- deployed admin login requires server-only `HITO_ADMIN_PASSWORD_HASH` and `HITO_ADMIN_SESSION_SECRET`; the admin username is fixed by the backend contract and plaintext admin passwords are not stored in tracked source or public bundles
- request middleware in `src/start.ts` now resolves:
  a signed deployed admin session cookie for admin routes only
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
  or the real email auth path only when the request can resolve a non-loopback auth redirect origin
  while loopback local runtimes without a public `APP_BASE_URL` now keep email sign-in honestly unavailable instead of offering broken localhost magic links
- `src/routes/hitoDS.tsx`
  renders the internal Hito design-system reference with its own design-system sidebar and no runner-facing shell chrome, documenting the simplified live product language around canonical typography roles, the Hito icon registry, open route rhythm, divider-based grouping, restrained markers, quiet support copy, utility/disclosure treatment, the current bounded product-dialog anatomy, shell navigation, controls, and documented visualization geometry exceptions without adding a runner-facing product capability
- `src/routes/api.auth.confirm.tsx`
  exchanges the Supabase auth code into a cookie-backed session and now also accepts token-hash email callbacks for SSR-compatible Supabase passwordless flows
- `src/routes/api.auth.local-login.tsx`
  validates the temporary local account credentials contract and sets the local auth cookie only on loopback local runtimes; deploy-like requests receive no production-facing local login path
- `src/routes/api.admin.auth.login.tsx`
  exposes the dedicated admin login POST endpoint for `/admin/login`:
  it accepts owner admin credentials plus a sanitized admin-only `next`, verifies local fixture credentials on loopback local runtimes or server-only deployed hash configuration elsewhere, refuses invalid configuration and tester credentials with bounded admin-specific redirects, and does not change the normal product `/login` or `/api/auth/local-login` paths
- `src/routes/admin.login.tsx`
  renders the standalone admin login page:
  it reuses the product login visual language without runner AppShell chrome, brands the experience as `Hito Admin`, posts username/email plus password to the admin login endpoint, preserves sanitized admin-only `next` redirects, and keeps signup, Magic Link, and normal runner login paths out of the admin surface
- `src/routes/api.auth.logout.tsx`
  clears the temporary local auth cookie and signs out Supabase sessions when present
- `src/routes/workout.$date.tsx`
  renders workout detail for preview or persisted data, treats the route search as the source of truth for the active tab, preserves `tab=complete`, logs results through the canonical backend mutation when saved mode is active, keeps rest-day detail sparse with one grouped right-side context panel, reads backend-owned workout family, exact identity, calendar icon, metric mode, goal context, segment guidance, target cue, and target hint instead of route-local generic coaching advice, and preserves the three-block page structure with richer surface treatment, result-state badges, and progress-driven week status
- `src/routes/progress.tsx`
  renders a compact progress summary using preview or persisted aggregates from the same data seam, with completion, volume, weekly planned-vs-actual mileage, and recent workout consistency kept intentionally small instead of presenting a full analytics dashboard; sparse zero-volume states show short honest copy instead of an empty chart frame
- `src/routes/body.tsx`
  exists only as a legacy route guard and redirects `/body` to `/`, so older links no longer fall through to a raw 404 after body-note ownership moved into workout logging
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
  rich workout family/identity/icon/goal-context/metric compatibility fields read from persisted rich workout columns when available or derived from legacy `source_workout_type`/`workout_type` fallback for old plans
  visible workout labels and glyph identity that prefer backend-owned `calendarIconKey` and `workoutFamily` before falling back to legacy source/title/step compatibility
  workout lookup
  status derivation
  weekly aggregates
- `src/lib/training-api.ts`
  owns the remaining route-facing server-function wrapper layer for home, shell, workout detail, progress, settings, login, text compatibility onboarding, advanced JSON import, and active-plan refresh server-action binding; it re-exports auth/login, first-plan, route-data, active-plan export, active-plan lifecycle, active-plan refresh, plan replacement, user-settings, and workout-log action names for compatibility, but no longer owns those extracted implementation bodies
- `src/lib/route-data-actions.ts`
  owns the shared route-data helper layer:
  home, shell, workout-detail, and progress data shaping now live there behind injected snapshot/viewer/feedback loaders, while `training-api.ts` keeps the public TanStack `createServerFn` wrappers so existing route imports and loader data shapes stay stable
- `src/lib/auth-actions.ts`
  owns the auth/login helper layer:
  login route data shaping, loopback local-login availability, safe Magic Link availability, Magic Link request validation and Supabase OTP request behavior, and `/api/auth/confirm` code or token-hash callback exchange now live there while `training-api.ts` keeps the public route-facing wrappers/import path stable
- `src/lib/admin-auth-actions.ts`
  owns the dedicated admin-login contract for `/admin/login` UI:
  it exposes the admin-only redirect sanitizer and route data contract, while `src/lib/admin-auth-actions.server.ts` verifies local/dev fixture credentials only on loopback local runtimes, verifies the deployed owner admin against server-only `HITO_ADMIN_PASSWORD_HASH` plus `HITO_ADMIN_SESSION_SECRET` outside local fixtures, rejects tester credentials without creating a session, and sets either the existing local auth cookie or a signed admin-only cookie after admin verification; the local bypass fixture still keeps one protected owner admin account for local QA, and ordinary tester/product accounts are never accepted by `/admin/login`
- `src/lib/first-plan-actions.ts`
  owns the first-plan server-action layer for the structured constructor and transcript-backed voice-to-plan path:
  `completeStructuredFirstPlanOnboarding`, `generateStructuredFirstPlanDraft`, `confirmStructuredFirstPlanDraft`, `generateVoiceToPlanDraft`, `confirmVoiceToPlanDraft`, and `completeStructuredFirstPlanOnboardingForUser` now live there while preserving the existing public imports through `training-api.ts`; the canonical write path remains sequential and calls the lower-level active-plan persistence seam directly only after validation/generation/review boundaries are satisfied
- `src/lib/active-plan-persistence.ts`
  owns the shared imported-plan apply and active-plan persistence primitives used by first-plan creation and saved-mode flows:
  `applyImportedPlanForUser`, active-plan lookup, planned-workout/log readback with archived-log recovery, assigned-plan insertion including nullable rich workout family/identity/icon/goal-context/metric-mode columns, profile upsert during apply including structured first-plan training preference snapshots, optional bounded plan-scoped authoring metadata, and rollback of inserted plans now live there so first-plan actions no longer depend backward on `training-api.ts`
- `src/lib/plan-authoring-snapshot.ts`
  owns the bounded plan-scoped structured authoring snapshot mapper:
  structured, voice-confirmed, and text-generated plans can persist the validated authoring truth needed for later refresh, including goal family/style, target time/date intent, recent 5K benchmark truth, execution mode, fixed rest days, preferred long-run day, review assumptions, and metric-policy summary, while raw optional comments and transcript text are filtered out instead of becoming long-lived plan/profile truth
- `src/lib/active-plan-export-actions.ts`
  owns the active-plan export server-action and user-scoped export helper:
  it resolves the authenticated persisted user, reads the current active plan through `active-plan-persistence`, delegates payload/document shaping to `plan-export.ts`, and keeps the old `training-api.ts` public export names as compatibility re-exports
- `src/lib/plan-export.ts`
  owns active-plan export shaping:
  JSON export projects saved plans into canonical `training-plan-v2` with legacy `workout_type`/`source_workout_type` plus rich `workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, and `metric_mode`; Markdown export is still runner-readable and now adds a compact backend-owned family/identity `Focus` line where useful without exposing runtime-only Garmin/log/AI state
- `src/lib/active-plan-lifecycle-actions.ts`
  owns the active-plan lifecycle helper layer for delete/archive and clear-upcoming schedule:
  it archives the current active plan without deleting planned workouts or logs and accepts the existing persisted snapshot loader from `training-api.ts` so the old public action results keep returning the same refreshed saved-mode snapshot without making the lifecycle module own route snapshot shaping; `training-api.ts` owns the top-level TanStack server-action wrappers so lifecycle clicks resolve auth through the same persisted-user seam as other working mutations
- `src/lib/active-plan-refresh-draft.ts`
  owns the exact active-plan refresh draft contract:
  proposal generation now resolves a `RefreshAuthoringSnapshot` from stored plan-scoped authoring truth when available or reconstructed active-plan/profile/preference truth for older plans, builds the exact non-mutating future refresh draft with the deterministic structured authoring engine, signs it with a backend checksum, and exposes review metadata for affected range, preserved/regenerated counts, long-run peak, source assumption, metric policy, target-time honesty, and long-distance conservative/durability assumptions
- `src/lib/active-plan-refresh-actions.ts`
  owns the active-plan refresh proposal/apply action layer:
  it checks `ai_plan_update` entitlement before proposal generation, records usage only after a successful proposal with an exact draft attached, validates stale fingerprints before apply, applies only the reviewed draft without calling OpenAI or regenerating, blocks if a formerly mutable workout became logged or evidence-backed, archive/replaces the active plan while preserving fixed history/logged/Garmin evidence truth including stored rich workout fields for fixed/protected rows, and accepts the existing persisted snapshot loader from `training-api.ts` so public action result shapes remain stable
- `src/lib/plan-replacement-actions.ts`
  owns the saved-mode plan replacement action layer:
  advanced JSON import and text compatibility replacement actions validate their existing inputs, resolve the authenticated persisted user, preserve start-date and first-day resolution behavior, and apply canonical `training-plan-v2` plan truth through `active-plan-persistence` while `training-api.ts` keeps the old public action names as compatibility re-exports
- `src/lib/changelog-utils.ts`
  owns pure `/changelog` markdown parsing, date/month/year grouping, source-derived shipped-change count and last-updated helpers, highlight classification, and milestone title derivation while the public route keeps shell, tabs, timeline rendering, and the existing `docs/history/changelog.md?raw` source import
- `src/lib/user-settings-actions.ts`
  owns the user-settings route/action layer:
  it resolves settings route data through the same persisted-user mapping as saved mode, reads and updates bounded `runner_profiles` settings fields, delegates runner-level `training_preferences` validation to the shared runner training-preference contract, and accepts the existing snapshot/viewer loaders from `training-api.ts` so the `/settings` route data shape and compatibility imports stay backward-safe
- `src/lib/runner-training-preferences.ts`
  owns the shared pure runner training-preference contract used by settings and structured first-plan setup:
  it maps product-facing `fixedRestDays`, `defaultRunningDaysPerWeek`, and `preferredLongRunDay` into the stored `blocked_days`, `max_running_days_per_week`, and `preferred_long_run_day` shape; validates that fixed rest days leave at least one trainable weekday, default running days fit the available weekdays, and long-run day is not blocked; derives the Sunday/Saturday/latest-available long-run fallback for generation/review without storing that fallback as an explicit runner choice; and exposes bounded fitness-level mapping where only `custom` plus a direct recent 5K time produces numeric benchmark truth
- `src/lib/rich-workout-model.ts`
  owns the first backend-only rich workout taxonomy contract:
  it defines allowed canonical `workout_family`, `workout_identity`, `calendar_icon_key`, and `metric_mode` values; maps current legacy `workout_type`, `source_workout_type`, title, and segment target truth into rich compatibility fields; for compact-only old rows without `source_workout_type`, it infers tempo, threshold, interval, progression, race/tune-up, hill, or generic quality identity from title/step semantics before falling back to `quality_session`; maps rich family/identity back to the legacy DB `workout_type` family for old paths; and derives metric mode from actual emitted target keys without inventing pace or HR truth, with rest days marked as having no execution metric targets
- `src/lib/persisted-plan-replacement.ts`
  owns shared saved-workout replacement helpers:
  new plan inserts now write nullable rich workout fields from canonical seeds, fixed weekday rest insertion carries the same bounded goal context while using rest-specific metric mode, and preserved planned-workout rows can be converted back into imported-workout seeds while keeping stored rich family, identity, icon, goal context, and metric mode before falling back to compatibility inference
- `src/lib/workout-log-actions.ts`
  owns the workout-log save action helper layer:
  it validates completed, partial, and skipped workout-result payloads, normalizes skipped results to null actual metrics, validates bounded workout-scoped body notes, checks that the planned workout belongs to the persisted user and is not a rest day, and upserts the canonical `workout_logs` row while `training-api.ts` keeps the public `saveWorkoutLog` server-action wrapper for compatibility
- `src/lib/first-plan-authoring-utils.ts`
  owns the small shared first-plan authoring helper layer used by structured onboarding and Dictate-to-Plan:
  bounded goal distance/style/terrain/execution values, safe execution defaults, guidance-preference-to-effort-language mapping, weekday de-duplication and long-run/day spreading helpers, goal label formatting, and duration/pace parsing live there instead of being duplicated across first-plan modules
- `src/lib/structured-first-plan-onboarding.ts`
  owns the backend contract for the structured first-plan constructor:
  required age, weight, and height profile basics, one bounded 5K benchmark mode plus backend-compatible fitness-level input, `runningDaysPerWeek`, `fixedRestDays`, goal distance/style/conditional terrain, optional execution mode (`watchAccess`, `guidancePreference`), bounded strength preference, and an optional supporting comment
  it translates that visible contract into the existing structured authoring input, derives preferred running days from running-days/week plus fixed rest days, maps product `beginner` fitness level to backend `new_runner` unless stronger benchmark truth is supplied, defaults omitted execution mode to unknown watch/app access plus effort guidance, derives broad internal pace context only from recent 5K time or pace truth, builds a runner-facing non-mutating review summary for the structured draft path including target-time honesty when benchmark support is missing or aggressive plus conservative/finish-oriented/durability-limited assumptions for low-support marathon, ultra, and mountain contexts, keeps fixed rest days in the weekday rest-day invariant system, and persists only approved profile measurements plus stable weekly training preference defaults to `runner_profiles`
- `src/lib/imported-plan.ts`
  owns the canonical `training-plan-v2` import contract, JSON validation helpers, the runtime-noise exclusions for v2, the bounded canonical target and prescription normalization rules, the accepted-but-ignored `_ml_agent_template` instruction block, optional exact `source_workout_type` identity, additive rich workout fields (`workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, `metric_mode`), compatibility derivation for older compact-only v2 files missing those rich fields, and the mapping from accepted import shapes into the canonical saved workout shape
- `src/lib/structured-plan-authoring.ts`
  owns the first server-side structured authoring contract, its normalization rules, and the deterministic generator that emits canonical `training-plan-v2` plan truth before persistence; it now also accepts bounded `terrainFocus`, `ultra_marathon`, `mountain_running`, explicit goal style/target-time context, and execution-mode context, carries exact generated workout identity through `source_workout_type` plus titles, emits additive rich `workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, and `metric_mode` fields for generated workouts, uses goal-family long-run floors/peaks/ceilings for half marathon, marathon, ultra, and mountain plans, applies runner-fit safety adjustments from age, benchmark presence, weekly frequency, and ambition/target pressure, caps beginner or otherwise low-support `build_consistency` plans to easy/steady/long/cutback identities instead of tempo, interval, or race-like tune-up work, selects different workout identities across `Base`, `Build`, `Specific`, and `Taper` phases, aligns long-run taper reductions with the same phase boundary so peak durability load happens before any `Taper` week, uses meaningful cutbacks, splits normal longer easy/steady/cutback/taper/long support runs into purposeful opener/main/finish or equivalent segments with runner-facing cues instead of one anonymous block, can vary conservative low-support support days with safe recovery/cutback identities without adding hard days, can split appropriate later long runs into easy-base plus steady-finish blocks, adds mountain/trail-specific identities for technical trail easy running, controlled downhill durability, hike-run endurance, climbing/rolling hill work, and mountain long-run time-on-feet without exact elevation prescriptions, adds goal-family quality identities for 5K short sharpening/strides, 10K rhythm intervals, half-marathon threshold durability, marathon steady specificity, and ultra time-on-feet durability, and uses one metric-mode resolver so generated `pace_min_per_km_range` targets appear only when the runner has watch/app access, asks for pace or mixed guidance, and has recent 5K benchmark truth, while heart-rate targets distinguish personal zones, clearly labelled age-estimated defaults, and effort-only fallback
- `src/lib/ai-first-plan-draft-authoring.ts`
  owns the non-live `ai-first-plan-draft-v1` diagnostic foundation for full strict nested first-plan drafts: it defines the OpenAI response schema and prompt contract for full week-by-week AI-authored drafts, strips runtime/reference noise from prompt examples, validates rich workout taxonomy, fixed rest days, running-days/week, long-run placement, segment structure, metric gates, beginner quality caps, taper/long-run sanity, exact-elevation and medical-claim bans, and normalizes accepted drafts into canonical `training-plan-v2` with source/repair metadata; the visible structured first-plan path is not wired to this module, and the production direction has pivoted away from using this heavy nested schema as the default live contract
- `src/lib/ai-first-plan-blueprint-authoring.ts`
  owns the non-mutating `ai-first-plan-blueprint-v1` contract for the production AI first-plan direction: OpenAI returns compact weekly coaching authorship such as phase/theme, microcycle intent, long-run notes, workout identity/family/icon, segment intent, and metric intent, then the backend validates fixed rest days, running-days/week, preferred long-run placement, hard-day density, taxonomy, low-support caps, exact-elevation/medical/unsupported-metric claims, and expands the blueprint into canonical `training-plan-v2` segments with backend-owned pace/default-HR policy; the prompt includes exact required date/weekday slots, the response schema requires the validated weekly running-day count, and authored workouts exclude rest identities because backend owns rest-day filling; blueprint expansion is identity-aware for tempo/threshold, interval, hill, trail, ultra, long-run, cutback/taper, recovery, easy, steady, 5K sharpening, 10K rhythm, race-pace, taper tune-up, marathon-specific, controlled downhill, hike-run, and mountain time-on-feet workouts instead of relying on generic family-only warmup/main/cooldown copy; the ops script can emit a bounded coach-facing `--fixture identity-coverage --coach-sample` artifact for those expanded segment bodies without prompts, secrets, raw AI payloads, persistence, or frontend wiring; invalid blueprints fall back to deterministic structured generation, while valid identity/family/icon drift is canonicalized with repair metadata
- `src/lib/ai-first-plan-draft-service.ts`
  owns the non-mutating AI-authored first-plan ops service used by QA: it accepts validated structured authoring context or structured onboarding input, defaults to the compact `ai-first-plan-blueprint-v1` OpenAI contract, keeps the strict `ai-first-plan-draft-v1` contract behind an explicit diagnostic option, normalizes only through backend validation, returns canonical `training-plan-v2` plus source/fallback/debug metadata, and falls back to the deterministic structured generator when OpenAI is missing, malformed, invalid, incomplete, or timed out; it does not save plans or change the visible structured onboarding path, and live validation shows the two-week blueprint compact smoke can return `sourceStatus: ai_authored` far faster than the strict nested draft contract
- `src/lib/openai-plan-authoring.ts`
  owns the server-side OpenAI text-to-plan seam: it first prompts the model for bounded structured authoring input, validates that model output, and defaults to the deterministic structured generator; the saved-mode text replacement action explicitly opts into a separate bounded rich workout draft against that deterministic canonical skeleton, then `src/lib/rich-workout-draft-authoring.ts` validates and normalizes the draft into canonical `training-plan-v2` truth, enforcing taxonomy, rest-day boundaries, warmup/main/cooldown structure, and metric safety before persistence, while malformed or unavailable rich drafts fall back to the deterministic structured generator with bounded fallback metadata
- `src/lib/rich-workout-draft-authoring.ts`
  owns the backend-only rich workout draft schema and normalizer used by text authoring and active-plan refresh proposals:
  AI may suggest `workoutFamily`, `workoutIdentity`, `calendarIconKey`, `goalContext`, `metricMode`, and rich segment structure, but the normalizer re-anchors every draft to the existing deterministic workout ids/dates/rest days, strips or preserves numeric metric targets only from backend-approved canonical truth, rejects unsafe single-segment non-rest drafts, and returns detectable deterministic-fallback metadata instead of persisting raw AI draft rows
- `src/lib/voice-to-plan-authoring.ts`
  owns the first backend voice-to-plan authoring seam:
  it accepts confirmed transcript text plus optional structured supplements, including the same bounded execution-mode fields as structured onboarding, checks `voice_to_plan` entitlement, applies transcript length/noise, fixed-rest-day, and planning-sufficiency validation, returns either `draft_ready` with a runner-facing review verdict or `clarification_required` with missing fields/questions, explicitly calls out obvious requested-vs-proposed goal-style changes, target-time honesty, and long-distance conservative/durability assumptions in review assumptions, repairs recent 5K pace/time supplements into numeric benchmark context for the metric resolver, and can parse an explicit confirm payload into canonical structured authoring truth without persisting raw transcript text
- `src/lib/entitlements/*`
  owns the first backend-only Basic/Pro entitlement foundation:
  one canonical capability registry for `ai_plan_update`, `voice_to_plan`, and `garmin_ai_interpretation`; entitlement resolution that treats a missing row as effective `Pro`; capability checks with bounded locked responses; and metered lifetime usage recording for included Basic AI plan updates
- `src/lib/local-auth.ts`
  owns the temporary local account credential contract, account discovery, and cookie session helpers
- `src/lib/local-auth-supabase.ts`
  owns the temporary local-account to Supabase-user resolution used when the local bypass enters the canonical Supabase storage seam
- `src/lib/admin-local-test-accounts.ts`
  owns the first backend contract for local admin test-account management:
  it exposes server-action-ready list and delete seams for the `/admin/analytics` `Test accounts` section, while the server-only implementation reads `.tanstack/hito-running-local-accounts.json`, returns bounded local account view data only after local-runtime plus admin checks, marks protected admin accounts as non-deletable, and deletes only local tester accounts through the same local-file plus Supabase-auth-user safety semantics as the tester lifecycle script
- `src/lib/admin-analytics.ts`
  owns the Phase 1 backend admin analytics contract:
  it exposes a server-action-ready loader for `/admin/analytics` overview/funnel/integrations/AI/user sections, while the server-only implementation verifies admin access, reads only existing Supabase truth through the admin client, classifies local/test/admin/suspected accounts before aggregation, returns real-user product counts plus real-user rows separately from excluded test/local/suspected rows, and avoids raw payloads, prompts, transcripts, FIT contents, body-note text, storage paths, service keys, tokens, or sessions
- `src/routes/admin.analytics.tsx`
  owns the Phase 1 admin analytics UI plus the local-only Test accounts UI:
  it renders backend-shaped Overview, Funnel & Usage, Feedback, AI & Entitlements, Users, and Test accounts tabs, keeps the Users table scoped to backend-classified real users, keeps local/test/admin/suspected rows in Test accounts, and uses Hito table controls with collapsed search, active-filter summary, DS-owned sortable/non-sortable table headers, header sort/filter menus, and contained horizontal scrolling while leaving admin checks, account-file access, Supabase deletion, analytics aggregation, and all credential/sensitive-payload safety rules on server contracts
- `src/routes/hub.tsx`
  owns the public standalone Hito destination launcher:
  it renders a desert-background card grid for Hito Running, Admin analytics, Design system, and Changelog links without runner AppShell chrome, while the target routes continue to own normal user auth, admin auth, or public access behavior
- `supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql`
  defines the minimum persisted schema and RLS posture for runner profiles, plan cycles, planned workouts, and workout logs
- `supabase/migrations/20260508104250_phase_3_tighten_persisted_plan_semantics.sql`
  adds the current richer-plan persistence columns that matter at runtime:
  `plan_cycles.schema_version`, `source_kind`, `target_date`, `goal_metadata`, `plan_preferences`
  plus `planned_workouts.source_workout_id`, `source_workout_type`, `planned_rpe`, `estimated_fatigue`, and `recovery_priority`
- `supabase/migrations/20260515093000_workout_body_notes_and_user_settings.sql`
  adds the bounded profile/settings persistence used by the current settings slice:
  `runner_profiles.first_name`, `last_name`, `display_name`, `avatar_url`, `avatar_storage_path`, `age`, `weight_kg`, and `height_cm`
  plus `workout_logs.body_notes jsonb` for workout-linked manual body notes and the public `profile-avatars` storage bucket for processed avatar images
- `supabase/migrations/20260518183000_basic_pro_entitlement_foundation.sql`
  adds the first entitlement storage foundation:
  `runner_entitlements` for explicit backend-owned Basic/Pro rows and `runner_capability_usage` for lifetime metered capability counters; both tables have RLS enabled with authenticated read-own policies only, while writes remain server/admin-owned
- `supabase/migrations/20260522153725_runner_profile_training_preferences.sql`
  adds `runner_profiles.training_preferences jsonb` for bounded runner-level training defaults using plan-preference-compatible keys such as `blocked_days`, `preferred_long_run_day`, and `max_running_days_per_week`

## State And Lifecycle Rules

- signed-out users now hit a login-first entry surface on `/` and do not create trusted history
- signed-out preview routes can still render on direct route access when real Supabase env values are absent, but they are no longer the primary entry experience
- temporary local-bypass users may still enter saved mode through visible credentials login on loopback local runtimes only, while deploy-like runtimes expose only the real auth surface and authenticated saved-mode truth always resolves through Supabase
- entitlement rollout is backend-owned and pre-billing:
  if a user has no `runner_entitlements` row, the effective tier is `Pro`; an explicit active `basic` row can enforce the first limits, including one lifetime included `ai_plan_update`, while `voice_to_plan` and `garmin_ai_interpretation` are Pro-only capabilities
- authenticated users without `runner_profile` are routed into setup on `/`
- authenticated users with a saved profile but no active `plan_cycle` now also stay honestly in setup until a canonical creation path succeeds
- visible onboarding on `/` is now structured-first:
  authenticated users without setup answer the bounded first-plan constructor for required profile basics, progressive training preferences, bounded fitness-level benchmark context, execution preference, goal, conditional target/terrain context, strength/mobility support, and optional comment; the frontend calls `generateStructuredFirstPlanDraft` first, keeps `correction_required` inline near the form, opens a `Review your setup` modal only for `draft_ready`, and calls `confirmStructuredFirstPlanDraft` only from the modal `Yes, create plan` action
- structured constructor review-before-create is now the visible manual onboarding path:
  `generateStructuredFirstPlanDraft` validates the same structured setup contract, attempts the non-mutating `ai-first-plan-blueprint-v1` planner, normalizes the result into canonical `training-plan-v2`, falls back to the deterministic structured generator with bounded metadata when AI is missing/invalid/timed out, and returns runner-facing review data without writing profile, plan, planned-workout, workout-log, usage, or transcript/comment rows; the draft payload includes bounded source/fallback/repair/debug metadata plus a signed reviewed-plan token. `confirmStructuredFirstPlanDraft` accepts only that validated draft payload, blocks if an active plan already exists, revalidates the setup and structured authoring input, verifies the reviewed-plan token, validates fixed rest days without rewriting the plan, and then persists the exact reviewed canonical calendar rows through a first-plan reviewed-draft persistence seam without imported-plan weekday remapping, OpenAI calls, or regeneration.
- the same no-plan onboarding surface also exposes a compact Pro transcript-first `AI setup` assist:
  it sits above the manual structured constructor, calls `generateVoiceToPlanDraft` from `Review AI setup`, renders backend-owned `clarification_required` or `draft_ready` review data inline, and calls `confirmVoiceToPlanDraft` only from the explicit `Yes, create plan` action after a ready draft
  the frontend does not store transcript text outside component state and does not call confirm from the review/generate path
- the no-plan onboarding frontend implementation now keeps orchestration in `OnboardingGate` while the structured constructor, Dictate-to-Plan review panel, Advanced JSON import panel, and shared onboarding form model live in focused `src/components/onboarding/*` modules so those paths share option registries and request-building helpers instead of maintaining separate local truth
- the backend now also has one first-pass free-text authoring seam:
  authenticated saved mode can accept one free-text request server-side, ask OpenAI for bounded structured authoring input, validate that output deterministically, then the saved-mode text replacement action explicitly asks OpenAI for a richer workout-structure draft that is normalized through backend taxonomy and metric gates before canonical `training-plan-v2` persistence; default helper usage and Dictate-to-Plan remain deterministic for this slice, and if the rich draft fails validation or is unavailable, the same deterministic structured plan is applied with fallback exposed in bounded metadata/review assumptions
- active-plan refresh proposals now use the same rich workout draft normalizer only during proposal generation:
  the backend asks OpenAI for bounded proposal copy with an abortable timeout, falls back to a deterministic proposal if that live proposal step stalls, builds the exact deterministic future refresh draft, optionally enriches that reviewed draft through OpenAI rich drafting with a bounded timeout, re-signs the canonical `training-plan-v2` draft with rich-draft status metadata, and falls back detectably to the deterministic draft if proposal or rich normalization times out or fails; apply still parses the signed reviewed draft, validates freshness/protected-history guards, and persists that exact canonical draft without calling OpenAI or regenerating workouts
- the backend now has one first-pass voice-to-plan transcript seam:
  authenticated callers can submit a bounded confirmed transcript plus optional constructor context/supplements, the server checks `voice_to_plan`, rejects empty/noisy/too-long or impossible rest-day context with bounded copy, returns `clarification_required` when essential profile/goal/readiness/availability/timeline truth is missing, and returns `draft_ready` with runner-understanding and plan-shape review data when enough truth exists
  if the transcript clearly asks for one goal style such as relaxed, balanced, ambitious, or target-time, but the reviewed draft proposes a different style, the backend adds a runner-facing assumption explaining the change instead of silently hiding it or forcing the requested style; explicit transcript style cues are compared before constructor supplement defaults so frontend state cannot mask a dictated style change
  transcript review never mutates saved truth; only the explicit `confirmVoiceToPlanDraft` action can create the first active plan, and it rechecks `voice_to_plan`, blocks if an active plan already exists, rebuilds the canonical plan from validated structured authoring input, persists profile age/weight/height, preserves fixed rest-day invariant truth, and still does not persist the raw transcript
  this slice does not handle raw audio, does not persist the transcript as profile truth, does not count usage, and does not replace an existing active plan
- the backend retains the legacy direct structured first-plan action as compatibility, but visible manual onboarding now uses review/confirm:
  authenticated no-plan callers can submit the bounded constructor contract instead of a free-text prompt, the backend validates required profile basics, impossible running-day/rest-day combinations, supported goal distance, benchmark or bounded fitness-level context, execution preference, target-time, target-date, and terrain formats, translates the request into deterministic structured authoring input, and writes only `age`, `weight_kg`, `height_cm`, and stable weekly training preferences from the request into `runner_profiles` after explicit draft confirmation
  benchmark, terrain focus, target-time/date details, and the optional comment remain generation/plan context rather than long-lived runner profile truth; omitted terrain defaults to `standard` for normal goals, `mountain_running` normalizes to `mountain`, and non-target-time target fields are ignored after valid parsing
  recent 5K time or pace is used only as generation context to derive broad pace ranges for generated warmups, easy/long/steady/tempo/interval work, recovery, cooldown, and hill-oriented segments; unknown benchmark keeps effort/cue fallbacks, personal HR zones remain the only personalized HR truth, and when personal zones are missing the backend can emit broad age-estimated default HR ranges only if profile age exists
- the visible constructor now starts from saved runner profile defaults when available:
  age, weight, height, fixed rest days, default running-days/week, and preferred long-run day prefill from `runner_profiles`, remain editable in the constructor, and the confirmed first plan persists the edited values back to runner-level profile defaults without mutating any existing active plan
- settings and structured onboarding share the same frontend primitives for those profile defaults:
  `EditableValueChip` owns the compact age/height/weight add-edit-save interaction, and `TrainingPreferenceFields` owns the progressive Hito controls for explicit no/fixed rest days, required default running-days/week, optional preferred long-run day, and bounded fitness-level/custom-5K entry while leaving validation and persistence to backend-owned settings and first-plan actions
- advanced JSON import remains available inside onboarding as a demoted fallback path for existing Hito plan files, migration, and testing
- structured first-plan onboarding, advanced JSON import, and backend text compatibility authoring all create or update one `runner_profile` and one active `plan_cycle` through the same canonical persisted seam
- canonical apply-time start normalization now lives in [src/lib/plan-apply-policy.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-apply-policy.ts):
  explicit future `start_date` is preserved, while past or non-future `start_date` normalizes to `today` before persistence
- saved-mode JSON import now collects an explicit start day in the visible saved-mode import surfaces and passes it as backend-owned `requestedStartDate`; when present, that date becomes the effective apply authority, the imported JSON `start_date` remains source metadata, and the imported workout sequence is shifted as one block around the chosen date
- when weekday off-day truth is already known, that start-date apply seam now treats fixed weekday rest days as stronger than blind linear shifting:
  [src/lib/weekday-rest-invariants.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/weekday-rest-invariants.ts) resolves blocked weekdays from runner/profile-shaped preferences, active plan preferences, then imported metadata; chosen starts on blocked weekdays are rejected, imported non-rest workouts are mapped in sequence across allowed weekdays with blocked weekdays preserved as rest days, and the resolved blocked weekday set is carried into the replacement plan preferences so later refresh/import work keeps the invariant
- that same backend-owned apply seam now also handles first-day conflicts:
  if an applied plan would start on a chosen date with a non-rest day while the current active plan already has a non-rest workout on that date, the default backend behavior is now the safe path:
  preserve the existing workout on the chosen date, drop incoming day 1, and start the imported original day 2 on the following day without blocking normal apply
- continuity safety still evaluates the final transformed workout dates, not the raw imported dates:
  the default preserved-start-day path still cannot detach logged history, and the only alternate path is explicit destructive `replace_first_day`, which keeps incoming day 1 on the chosen start date and is blocked honestly when it would break exact saved-history carry-forward
- saved mode now has a backend delete-plan lifecycle action:
  deleting an active plan archives the active `plan_cycle`, keeps its planned workouts and workout logs attached as history, leaves no active plan, and returns the runner to the authenticated no-plan/setup-ready state
- saved mode also has a narrower backend `Clear upcoming schedule` lifecycle action:
  clearing the upcoming schedule archives the current active `plan_cycle` from the active schedule view, preserves all planned-workout rows and workout logs under archived history, records the clear cutoff as today for the action result, and returns the runner to the authenticated no-plan/setup-ready state so a later-starting imported or generated plan cannot inherit stale future workouts
  if today already has logged truth, that log remains attached to its archived planned-workout row; the action removes it only from the active schedule, not from saved history
- the saved-mode `Open plan` modal now exposes that clear-upcoming lifecycle as a confirmed secondary action distinct from `Delete plan`, and later-starting JSON import surfaces can explicitly clear the current upcoming schedule before applying the new plan through the backend seam
  the clear-upcoming and delete/archive controls are isolated in [src/components/plan-management/PlanLifecycleControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanLifecycleControls.tsx), while `PlanManagementDialog` remains the owner of confirmation state, lifecycle server calls, errors, status transitions, and success navigation
- saved mode now has a backend-owned active-plan export seam:
  [src/lib/active-plan-export-actions.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-export-actions.ts) owns the authenticated action/helper layer and [src/lib/plan-export.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-export.ts) builds one canonical payload from the current active `plan_cycle` plus its saved `planned_workouts`, then projects that same payload into `training-plan-v2` JSON and runner-readable Markdown
  exported dates come from the active saved workout rows, so chosen-start-day effects are reflected in the artifact, and runtime-only saved-mode state such as logs, Garmin evidence, comparisons, and AI feedback is intentionally excluded
  the saved-mode `Open plan` modal now exposes one compact `Export` action for JSON and Markdown download using that same backend-owned document truth and backend-provided filename
  Safari-compatible delivery now uses one authenticated attachment route for the actual browser download request instead of reconstructing files from a client-side blob URL
  the active-plan summary/header UI is isolated in [src/components/plan-management/PlanSummaryHeader.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanSummaryHeader.tsx), preserving title, goal fallback, active status, date/count/target summary, export menu placement, and export error rendering
  the export dropdown UI is isolated in [src/components/plan-management/PlanExportMenu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanExportMenu.tsx), while `PlanManagementDialog` remains the owner of export status, errors, iframe download orchestration, and the surrounding plan-management modal state
  PDF export remains a later slice, but it must reuse this same payload rather than shaping a second export truth
- the frontend now mirrors that simplified policy instead of the older symmetric chooser:
  text-first apply and advanced JSON apply both use the safe backend default without a required preserve-vs-ignore modal step
  and only one explicit destructive override remains in the UI, now kept behind a quieter disclosure instead of being shown as an equal sibling of the safe action
  the saved-mode `Open plan` text replacement UI is isolated in [src/components/plan-management/PlanTextReplacementPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanTextReplacementPanel.tsx), while `PlanManagementDialog` remains the owner of prompt state, minimum-length validation, `completeTextOnboarding` server calls, replacement status/errors, and success navigation
  the saved-mode `Open plan` JSON import UI is isolated in [src/components/plan-management/PlanImportPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanImportPanel.tsx), while `PlanManagementDialog` remains the owner of imported-plan validation state, file-read state updates, import/apply server calls, clear-before-import sequencing, and success/failure navigation
- OpenAI-generated authoring output never persists directly:
  the app validates model responses, converts them into canonical plan data, and persists through the same `plan_cycles` plus `planned_workouts` seam already used by JSON import and structured authoring; the richer text-authoring draft is never stored as a raw AI artifact and can only survive after backend normalization into canonical `training-plan-v2` workouts
- saved mode now has the first active-plan refresh foundation and proposal UI:
  [src/lib/runner-coach-context.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/runner-coach-context.ts) builds one compact `RunnerCoachContext` from persisted runner profile, active plan, remaining active schedule, recent workout logs, Garmin actual/comparison truth, workout-scoped body-note cautions, and the resolved weekday rest-day invariant when available
  [src/lib/plan-refresh-proposal.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-refresh-proposal.ts) consumes that context plus an explicit runner prompt to generate a proposal-only `active-plan refresh` artifact scoped to `remaining_active_schedule_only`
  the returned review contract is runner-facing: it hides raw workout ids and prompt-internal field names, quality-gates incomplete or malformed prose, guarantees a dedicated fixed-truth section for past/logged history and remaining-schedule-only scope, and separately reports total remaining schedule size versus the number of targeted upcoming changes shown in the review
  proposal generation now also builds an exact non-mutating refresh draft before usage is recorded: the draft uses a `RefreshAuthoringSnapshot`, carries a backend checksum, review metadata, and mutable-workout guards, and is the only schedule apply can persist
  explicit proposal apply now exists as a backend-only seam: apply must be called intentionally, revalidates a backend fingerprint against current active-plan/context truth including fixed weekday rest-day constraints, verifies the reviewed draft checksum, blocks stale or genuinely invalid proposals with bounded proposal-specific copy, and uses archive/replace by creating a new `active_plan_refresh_v1` plan while archiving the previous active plan
  apply no longer calls OpenAI or regenerates the schedule; if a previously mutable workout becomes logged, Garmin evidence-backed, comparison-backed, or AI-insight-backed after proposal generation, apply blocks and asks for a fresh proposal
  past/logged/Garmin-backed history remains fixed by carrying fixed workout/log/evidence truth into the replacement active plan and retaining the previous plan as archived audit history
  the saved-mode `Open plan` modal now exposes a quiet `Update plan` disclosure that collects a short runner prompt, calls the backend proposal seam, renders the proposal review, and lets the runner explicitly choose `Apply update` or `Keep current plan`
  the refresh proposal disclosure and review UI are isolated in [src/components/plan-management/PlanRefreshPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanRefreshPanel.tsx), while `PlanManagementDialog` remains the owner of proposal/apply server calls, refresh state transitions, stale/error handling, and success navigation
  `Apply update` calls the backend apply seam and returns to the refreshed active-plan view after success; `Keep current plan` clears the proposal review without mutation; stale apply responses stay in the modal with a fresh-proposal recovery action
  proposal generation now checks `ai_plan_update` entitlement before OpenAI generation and records usage only after successful proposal generation for explicit Basic users; applying an approved proposal does not consume additional usage
- saved mode now also has a backend-only active-plan schedule edit preview contract:
  [src/lib/active-plan-schedule-edit-preview.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts) validates proposed fixed rest days, running-day count, optional explicit running weekdays, and preferred long-run day through the shared runner training-preference rules, then builds a non-mutating preview from the active `plan_cycle` and saved `planned_workouts`
  when the weekly running-day count stays the same, the preview returns `schedule_reflow` with proposed future date moves, protected-history counts, fixed-rest-day proof, long-run-day result, bounded rich-field/step-count summaries, warnings, and a preview token; no OpenAI call, regeneration, profile/default update, or plan mutation occurs
  when the weekly running-day count changes or the proposed schedule cannot safely fit future mutable workouts, the preview returns `requires_regeneration` with a bounded reason and refresh prompt so the existing exact-reviewed active-plan refresh flow remains the only regeneration path
  past/today, logged, Garmin asset, actual metrics, comparison, and AI-insight-backed workouts are treated as protected and stay out of proposed date moves
  the same module now owns the schedule reflow apply seam: `applyActivePlanScheduleReflowPreview` accepts the reviewed `previewToken` plus the original schedule input, reloads active-plan/workout/log/evidence truth, rebuilds the preview server-side, rejects stale or regeneration-required results, and calls one transaction-backed Supabase RPC so reviewed future non-rest workout date/weekday/week/display metadata and active-plan schedule preferences commit atomically; workout content, steps, rich fields, metric mode, goal context, source ids, logged/evidence-backed rows, and runner-level Settings defaults are not changed
  the saved-mode `Open plan` modal exposes this through an `Edit schedule` disclosure that prefills from active-plan `plan_preferences` when available, collects rest-day/running-day/long-run choices, renders the backend review, applies only the reviewed preview token, and copies regeneration-required prompts into the existing `Update plan` flow without mutating from the schedule panel
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
- saved-mode home/calendar now follows the simplified P0 rhythm: cells prioritize date, backend-owned rich family/icon workout identity, completion marker, and secondary feedback cue while detailed distance/duration context stays in hover or the larger week context; old compact rows still render through source/title/step compatibility fallback
- calendar month tooltips now render through one viewport-clamped fixed layer instead of absolute cell-local placement, and narrow month view switches to a vertical day list while preserving workout links, glyphs, status markers, today/completed treatment, and feedback markers
- workout completion is the canonical mutation and upserts one `workout_log` per planned workout
- the sidebar profile trigger now resolves one viewer label plus current plan title from the shared auth and snapshot seam, and owns the saved-mode advanced import entry point plus sign-out action
- the saved-mode header `Open plan` action now opens one compact plan-management modal around the active plan summary, text-first replacement, advanced JSON import, and backend-owned plan deletion
- `/integrations` remains routable as a quiet connections/status utility, but it is no longer part of the primary desktop or mobile runner navigation
- `/body` is now a retired legacy path that redirects to `/`, so older bookmarks recover into the current plan experience instead of opening a competing body-notes surface or a raw 404
- the sidebar plan-note support block is locally dismissible and no longer repeats the same week status already shown in the top header
- the saved-mode advanced import dialog reuses the canonical onboarding mutation instead of creating a second plan-import path
- that same saved-mode import dialog now follows the same stable product-dialog recipe as `Open plan` and `Body notes`: bounded panel height, internal body scroll, reachable footer, stable Safari content behavior, and stable non-blocking overlay close behavior
- after a successful saved-mode advanced import apply, the client now leaves the current page through a fresh document request to `/` instead of relying on an immediate in-place router refresh on the replaced plan state
- the saved-mode advanced import dialog now accepts only canonical `training-plan-v2` files, and runtime-only v2 fields such as `status`, `completion_state`, and sync or feedback placeholders remain non-canonical
- the downloadable `training-plan-v2` JSON template now demonstrates rich workout family, exact identity, calendar icon, goal context, and metric mode fields plus metric-safety guidance; its instruction block remains accepted-but-ignored template guidance, not persisted runtime truth
- the structured first-plan constructor and the internal structured authoring generator now emit the same canonical `training-plan-v2` family used by JSON import, persist it through `plan_cycles` plus `planned_workouts`, and reuse `steps jsonb` as the only structured workout payload
- normalized `planned_workouts.steps jsonb` now preserves explicit segment-level `segment_id`, `segment_type`, `sequence`, `prescription`, and canonical target keys such as `hr_bpm_range` and `pace_min_per_km_range`
  while one bounded interval DSL supports both distance-based and time-based repeat units
  older persisted rows may still carry legacy target aliases, but new writes now persist only the canonical target keys
- executable workout steps are now normalized with runner-facing instruction truth before workout detail readback:
  non-rest segments and expanded repeat work/recovery units must carry a target or guidance; generated structured plans can emit broad benchmark-derived `pace_min_per_km_range` targets only when the execution-mode resolver allows watch/app pace guidance, can emit `default_estimated_hr` ranges from age for appropriate recovery/easy/steady/long/sustained-tempo work when personal zones are absent, and otherwise adds bounded cue/hint fallbacks such as easy warmup, very easy recovery, repeatable hard work, or supportive mobility/strength guidance instead of inventing fake metrics
- workout detail now renders those executable step instructions directly:
  the route surfaces segment `guidance`, target `cue`, and target `hint` plus backend family/identity/icon/metric/goal readbacks, while old compact-only rows without those fields fall back to sparse non-coaching copy instead of inventing HR, cadence, fueling, terrain, or recovery advice locally
- generated structured plan workouts now carry exact session identity without changing the broad calendar family:
  `source_workout_type`, title, summary, and segments distinguish controlled tempo, distance intervals, time intervals, rolling hills, uphill repeats, climbing steady runs, cutback aerobic runs, cutback long runs, and long runs with steady finish while `workout_type` remains compatibility-safe for compact surfaces
- richer route-facing target shaping now exposes only display-safe scalar target values and suppresses opaque nested metadata instead of letting structured extras leak into visible `[object Object]` strings
- saved-mode workout identity now keeps richer imported source workout type truth available at runtime, so canonical `intervals`, `progression`, `race`, and `recovery` imports do not silently collapse into misleading visible `easy` labels
- saved-mode rendering now keeps distance-first interval reps visible as distance-first in workout structure UI, resolves tempo-backed quality workouts to a tempo-specific visible identity, and formats visible distance totals through one shared rounding seam
- the same dialog still exposes one static `Download JSON template` affordance for file-based plan handoff, but the saved-mode apply path is no longer legacy-only
- active-plan replacement now carries saved workout logs forward only for exact deterministic matches on logged days by date, workout type, title, notes, and steps; otherwise the apply step is rejected and the current active plan remains unchanged
- if older broken replacements already stranded logs on archived plan cycles from the same user and plan window, the persisted seam repairs those orphaned same-date logs back onto the current active plan before evaluating visible state or replacement safety
- saved workout logs can be overwritten from `completed` to `partial` or `skipped`, and skipped truth persists with null actual metrics instead of backfilled planned defaults
- saved workout logs now also carry optional workout-linked `body_notes` as bounded JSON array truth; those notes belong to the specific workout result and are read back through the same saved-mode workout snapshot seam as completion notes and actual metrics
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
  now keeps `Log result` focused on manual completion truth, uses a compact workout-scoped body-note summary row plus modal editor instead of the older inline body-note block, keeps that body-note modal on the same Safari-stable bounded-height dialog pattern already used by `Open plan` so the title, internal scroll, and footer actions stay reachable, adds one lighter state-aware Garmin continuation row into `Feedback`, and keeps the dedicated workout-detail `Feedback` surface as the canonical owner of the live `FIT / ZIP file` control, parsed Garmin evidence summary, factual plan-vs-run comparison readback, and the bounded AI interpretation readback
  the workout-scoped body-note summary/modal editor UI is isolated in [src/components/workout-completion/BodyNotesEditor.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/workout-completion/BodyNotesEditor.tsx), while `CompletionPanel` remains the owner of completion form state, save payload construction, `saveWorkoutLog`, route invalidation, Garmin upload/remove behavior, and feedback/readback orchestration
  the deterministic comparison readback UI is isolated in [src/components/workout-completion/WorkoutComparisonReadback.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/workout-completion/WorkoutComparisonReadback.tsx), while `CompletionPanel` remains the owner of Garmin file input, upload/remove mutations, route invalidation, and AI insight rendering
  the bounded AI insight readback UI is isolated in [src/components/workout-completion/WorkoutAiInsightReadback.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/workout-completion/WorkoutAiInsightReadback.tsx), while `CompletionPanel` remains the owner of `WorkoutFeedbackPanel`, feedback data selection, Garmin file input, upload/remove mutations, route invalidation, manual save logic, and body-note integration
  after a successful manual save, `CompletionPanel` reconciles the visible form and dirty baseline from the saved payload before firing a non-blocking route refresh, so persisted DB truth and immediate Safari UI state stay aligned for completed, partial, and skipped outcomes
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
  session-summary facts, a deterministic support matrix, an ordered step-summary block, and warm-up/main/cooldown-style segment-group summaries when ordered per-step duration comparison is trustworthy
  explicit unsupported states for pace and heart-rate comparison until planned targets and Garmin metrics share one normalized comparable unit
  instead of AI verdict prose
- the next Garmin slice now adds one bounded AI layer on top of those persisted facts only:
  `workout_ai_insights` is generated from planned workout truth, normalized actual metrics, deterministic comparison payload, week context, next-workout summary, and optional saved workout-scoped body-note context
  it never parses raw FIT binary, never replaces deterministic comparison, and treats body notes only as bounded caution context rather than diagnosis or medical advice
  generated runner-facing text passes through a small backend quality gate before persistence, so malformed fragments or non-English artifacts fall back to stable deterministic copy instead of surfacing in `Feedback`
  `garmin_ai_interpretation` entitlement gates only this AI insight generation step; Garmin upload, parsing, normalized actual metrics, deterministic comparison, and feedback persistence stay available when AI interpretation is locked
- current workout-detail `Feedback` readback now exposes the latest Garmin asset, latest normalized actual metrics, latest deterministic comparison, and latest bounded AI interpretation in a dedicated evidence surface separate from manual completion logging
- Garmin feedback readback now lives outside the Node-only FIT/ZIP ingest module:
  `src/lib/workout-result-import/read-workout-result-feedback.ts` owns latest-feedback and calendar-marker read queries, while `src/lib/workout-result-import/ingest-garmin-result.ts` remains the server-only upload, storage, extraction, parsing, comparison, and AI-interpretation write path
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
- the first Hito design-system implementation slices now exist in shared CSS primitives for canonical typography roles, low-card surfaces, tiered buttons, tiered fields, textareas, helper/error text, tabs, labels, captions, dividers, grouped rows, metric rows, compact status pills, compact status markers, setup/empty/error state surfaces, compact summary metrics, chart legends, chart notes, comparison-bar chrome, tooltip shells, editorial timeline date rails, highlight tags, editorial backdrops, timeline entries, timeline dots, inline code chips, canvas/auth/launch/state/editorial overlay recipes, Hito-owned shared wrapper defaults for dialog, sheet, dropdown menu, select, progress, card, and sidebar chrome, internal workbench shell/sidebar/topbar/quick-link/summary-grid recipes, body severity scales, body severity summaries, shell navigation rows, shell profile triggers, shell dropdown rows, and disclosure; those primitives are applied to auth, onboarding, advanced import, shell chrome, home/calendar support surfaces, workout-detail grouped/status/metric surfaces, deeper workout-structure and completion micro-surfaces, route-level state surfaces, progress summary surfaces, body severity micro-UI, preserved integration utility rows, public changelog rendering, launcher/admin/auth atmospheric shells, shared interaction wrappers, `/admin/analytics`, and the internal `/hitoDS` reference page
- the first Hito DS foundations cleanup slice now adds a raw color primitive layer underneath the existing semantic product tokens, exposes compact `--space-*` primitives plus Tailwind-facing Hito spacing aliases, and documents color through `/hitoDS#foundations` Semantic Colors and Primitive tabs: semantic cards copy token/recipe code, primitive swatches copy existing Hito hex values, and alpha/gradient recipes stay semantic rather than becoming generated primitive palettes; typography families, semantic tone rules, workout-color boundaries, and spacing rhythm remain documented without changing runner-facing screen behavior
- the second Hito DS foundations cleanup slice migrates the highest-drift workout-detail chrome to existing DS primitives: the workout route now uses Hito surfaces, row groups, hairlines, tab badges, micro-labels, body-small text, and semantic signal fills instead of local hero gradients, bespoke rounded values, white-alpha borders, and tiny text recipes; `CompletionPanel` keeps the same save/Garmin behavior while using DS surface/radius/text primitives for interval controls and the Garmin upload empty state
- the third Hito DS foundations cleanup slice starts the Calendar/Shell rollout with the calendar surface only: month headers, week-strip metadata, workout type tags, tooltip metadata, compact metric readbacks, and view controls now use existing Hito micro-label, body-small, technical-mono, metric-label, tab, and button primitives instead of local tiny text, tracking, mono, and button-spacing recipes, while calendar interaction, navigation, tooltip logic, and feedback markers stay unchanged
- the Shell/AppShell DS foundations cleanup slice now normalizes profile trigger and dropdown text with `hito-menu-text` and `hito-menu-meta`, uses `hito-technical-mono` for the top-bar date, removes local shell CTA tracking overrides, and introduces `hito-shell-avatar-fallback` as the single DS-owned profile fallback recipe used by both the live shell and `/hitoDS`
- the Auth/Login DS foundations cleanup slice now normalizes auth tabs, email heading, and signed-in route state with existing Hito tab, micro-label, surface, body, modal-title, and button roles; the auth hero remains intentionally unique, but its signal dot glow now uses the semantic `--color-signal` token instead of a route-local rgba shadow
- the Settings DS foundations cleanup slice now keeps `/settings` behavior stable while moving the large profile avatar surface to DS-owned `hito-profile-avatar` and `hito-profile-avatar-fallback` recipes, removing route-local arbitrary radius and gradient fallback styling from the settings avatar cluster
- the Hito primary sans family is now Poppins at the foundations layer: `src/styles.css` loads Poppins through the canonical font import and maps `--font-sans` to Poppins, while Fraunces display roles and JetBrains Mono technical/metric roles remain unchanged
- Hito now owns selection-control recipes for checkbox, radio, and toggle-radio controls in `sm` and `md` sizes; selected states use the normal `signal` tone, focus-visible stays separate from selected state, labels provide the click target, and destructive confirmation keeps destructive meaning in warning copy/icons/buttons rather than red selected controls
- the first canonical typography normalization slice now defines reusable text roles for display, page title, modal title, section title, panel title, body, body small, helper, caption, label, form label, button, navigation/menu, metric, status, error/success, and technical mono text; `Open plan`, the saved-mode JSON import dialog, `Log result`/`Feedback` typography hotspots, and `/settings` now use those roles for their highest-drift headings, form labels, helper/body copy, status text, and technical metadata
- shared Radix dialog title and description primitives are now typography-neutral so product dialogs must opt into canonical Hito roles such as `hito-modal-title` and `hito-body`; the primitive preserves accessibility behavior without reintroducing generic `text-lg`, `font-semibold`, `leading-none`, `tracking-tight`, or muted-description defaults that can override the design-system contract
- the first Hito icon-system slice now centralizes product icon usage in `src/components/ui/icon.tsx`: the Hito `Icon` primitive maps stable product names to the approved `lucide-react` source set, limits ordinary usage to `xs`, `sm`, `md`, and `lg` sizes, and keeps raw SVG folders out of the design-system source of truth
- the product modal family now also has a small shared recipe:
  `hito-product-dialog` owns the bounded three-row panel structure, `hito-product-dialog-body` owns the internal scroll region, and the existing stable overlay/content classes remain opt-in for real product dialogs rather than being forced onto sheet, alert-dialog, or command scaffolding
- remaining visualization-specific chart heights/widths, plotted lines, interval block widths, SVG silhouettes, and marker coordinates are documented as intentional geometry exceptions rather than generalized Hito component families
- final Safari QA on the visible runner-facing scope found no obvious stray custom UI drift, so future UI work should extend shared Hito primitives or documented shell families instead of introducing new route-local visual treatments

## Trusted-Output Contract

- authenticated profile, plan, workout logs, and week status are trusted product output
- temporary local-bypass sessions are trusted only as a local account-backed identity bridge into the same Supabase-backed saved mode and remain a removal target
- the temporary local login path now resolves the runner into a Supabase auth user by email and reads the canonical plan, workouts, and logs from Supabase
- signed-out preview mode remains untrusted and clearly labeled as preview
- `/progress` and `/integrations` still preserve shell breadth without claiming provider, AI, OCR, weather, or readiness truth

## Persistence And Storage Rules

- Supabase auth remains the intended long-term session source of truth
- a temporary local-only credentials bypass may become the active session source only for loopback local runtimes when `LOCAL_AUTH_BYPASS_ENABLED=true`
- preferred public env usage is `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- app name now falls back directly to `Hito Running` when `NEXT_PUBLIC_APP_NAME` is unset
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are now the only supported public Supabase browser env names
- `APP_BASE_URL` is an optional server-only non-loopback override for auth redirects; when it is set to a real public origin, magic-link emails and callbacks use it, and loopback local runtimes without that override now keep email sign-in links disabled instead of generating localhost redirects
- Supabase dashboard URL configuration and email templates still remain part of the live auth contract:
  hosted URL configuration must allow the real production callback URL
  and passwordless email templates must use `{{ .RedirectTo }}` for the SSR callback path instead of forcing `{{ .SiteURL }}`
- `SUPABASE_SECRET_KEY` is now the only supported server-only key for canonical Supabase writes, local-bypass plan imports, and admin-backed persisted saved mode
- temporary local-only auth env now uses only `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE` for an untracked local account list
- required Vercel env for the live Supabase-backed auth path is `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- temporary local-only auth env must stay unset on Vercel because the bypass store is a local unblock mechanism, not a production deployment contract
- server-side writes and persisted reads flow through one backend seam rather than direct client DB access
- settings, avatar metadata, and settings viewer labels resolve through the same persisted-user mapping used by saved mode, so temporary local-bypass identities do not read settings from the raw local session id
- `npm run import:current-plan` now exists as the narrow script for importing a canonical `training-plan-v2` file into the canonical Supabase plan tables for the current local bypass user
- `npm run test-user -- ...` is now the canonical Backend lifecycle tool for tester-account create, reset, optional plan seeding, and delete against the real Supabase auth/data model
- `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>` is now the canonical ops path for validating bounded structured authoring input and persisting the generated canonical plan into Supabase without a frontend wizard
- `npm run author-plan-from-text -- --email <tester-email> --prompt "<free text>"` is now the narrow TS-backed ops path for exercising the real OpenAI text-to-plan seam against the same canonical Supabase apply helper; it defaults to deterministic `richDraftStatus: "not_requested"`, supports `--rich-draft` for the Slice 4A rich-workout draft seam, supports `--dry-run` for non-persistent smoke, and reports bounded rich-draft status, fallback, workout-count, sample rich identity, icon, and segment-presence metadata
- `.tanstack/hito-running-local-accounts.json` is now the preferred ignored local credentials file for repeatable tester login on the temporary local bypass path

## Runtime Invariants

- one app runtime only
- one canonical data seam only
- one canonical deployment path only: Vercel via Nitro
- one temporary local bypass path only while Supabase email auth is intentionally paused
- no framework migration from TanStack Start
- preview shells remain honest about not being wired to future capabilities
