# Current System

## Runtime

- one TanStack Start application lives at the repo root
- the imported baseline structure remains preserved in `src/`, including generated route tree, shell, components, UI primitives, and styles
- build and dev commands come from `package.json`
- local development and mutable QA are configured to target the repository Supabase stack on loopback only: `npx --yes supabase@2.109.1 start` starts canonical Auth/Postgres/REST storage, `npm run supabase:local:configure` writes its current public/server credentials to the ignored mode-`0600` `.env.local`, and `npm run supabase:local:status` verifies the local target without printing credentials; hosted Supabase configuration remains deployment-only
- fresh databases receive canonical table ACLs from the append-only Supabase migration history: `authenticated` privileges mirror existing own-row RLS policies, server-only `service_role` privileges match backend persistence usage, and `anon` / `public` receive no canonical table access
- local production-like `npm run start` explicitly loads `.env.local` so server-only admin and loopback Supabase env reaches the built server path
- local QA on `127.0.0.1:3000` uses the finalized local build snapshot through `npm run serve:local` after `npm run build`; the server refuses non-loopback Supabase configuration or a non-loopback bind, while `npm run qa:server:start|status|restart|stop` manages that canonical built server lifecycle and keeps executable runtime, PID/log state, build-output staging, Vite cache, and build-output locks under the non-iCloud local cache family resolved from `HITO_QA_RUNTIME_ROOT` or `~/Library/Caches/hito-running/<workspace-hash>/`
- for this iCloud workspace, the default managed QA runtime resolves to `/Users/ivan/Library/Caches/hito-running/hito-running-4c6fe31a228f/qa-runtime`; `logs/build-output-finalized` is not the served managed QA runtime source, and generated conflict siblings such as `server 2`, `public 2`, or `index 2.mjs` are build-output lifecycle red flags rather than product UI failures
- managed QA runtime proof commands are `npm run qa:server:status`, `node scripts/validate-build-output-integrity.mjs`, and `curl -I http://127.0.0.1:3000/`
- the managed loopback launcher supplies the canonical runtime URL to the server, which enables one private local observability owner at `~/Library/Caches/hito-running/local-runtime-observability/`; request, server-action, and AI plan-generation outcomes share redacted correlation fields and safe reason codes, while each local OpenAI PlanCreation call adds one raw request/response sidecar referenced only by its metadata event. The latest three calendar days remain under `active/`, older days move to `archive/` without deletion, normal `npm run local:logs` queries stay metadata-only, and one selected sidecar is read explicitly with `--raw-transcript` plus a request, generation, or provider-response ID.
- managed-server stdout is transport evidence rather than lifecycle truth; it is capped and archived separately by the QA server manager, while metadata JSONL records never include request bodies, query values, cookies, credentials, raw prompts, provider payloads, database rows, runner free text, or error messages and are disabled outside a loopback runtime
- local artifact hygiene uses `npm run artifact:hygiene` as a non-mutating dry-run reporter for `logs/`, build-output residues, and generated `test-results/`; `qa-artifacts/` remains protected evidence and is counted only with explicit `--include-qa-artifacts` as non-disposable
- the canonical deployment runtime is now Nitro for Vercel:
  `npm run build` emits local Nitro/Vite staging under the non-iCloud cache root and publishes the managed local QA runtime from there; repo-local `.output/` should not be regenerated during normal local QA build flow
  `vercel build` emits `.vercel/output/` with Vercel functions
- Nitro still writes its hardcoded well-known pointer at `node_modules/.nitro/last-build.json` during local production builds; this is not served runtime or Vite staging/cache, and generated conflict siblings there remain a build-output lifecycle red flag
- admin login requires server-only `HITO_ADMIN_SESSION_SECRET`; deployed admin login also requires `HITO_ADMIN_PASSWORD_HASH`; the admin username is fixed by the backend contract and plaintext admin passwords are not stored in tracked source or public bundles
- request middleware in `src/start.ts` now resolves:
  a signed admin session cookie for eligible admin routes/server functions only, including loopback local fixture admin sessions created through `/admin/login`
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
  renders the internal Hito design-system reference with its own design-system sidebar and no runner-facing shell chrome, documenting the simplified live product language around canonical typography roles, the Hito icon registry, open route rhythm, divider-based grouping, restrained markers, quiet support copy, utility/disclosure treatment, the current bounded product-dialog anatomy, shell navigation, controls, inline editable/read-only text patterns, local inspector task-target examples, and documented visualization geometry exceptions without adding a runner-facing product capability
- `src/routes/api.auth.confirm.tsx`
  exchanges the Supabase auth code into a cookie-backed session and now also accepts token-hash email callbacks for SSR-compatible Supabase passwordless flows
- `src/routes/api.auth.local-login.tsx`
  validates the temporary local account credentials contract and sets the local auth cookie only on loopback local runtimes; deploy-like requests receive no production-facing local login path
- `src/routes/api.admin.auth.login.tsx`
  exposes the dedicated admin login POST endpoint for `/admin/login`:
  it accepts owner admin credentials plus a sanitized admin-only `next`, verifies local fixture credentials on loopback local runtimes or server-only deployed hash configuration elsewhere, issues signed `hito_admin_session` admin access, refuses invalid configuration and tester credentials with bounded admin-specific redirects, and does not change the normal product `/login` or `/api/auth/local-login` paths
- `src/routes/api.admin.auth.logout.tsx`
  owns admin logout for admin surfaces:
  it clears signed admin session cookies, clears the legacy local admin compatibility cookie if present, and redirects back to `/admin/login` with a sanitized admin-only `next`
- `src/routes/admin.login.tsx`
  renders the standalone admin login page:
  it reuses the product login visual language without runner AppShell chrome, brands the experience as `Hito Admin`, posts username/email plus password to the admin login endpoint, preserves sanitized admin-only `next` redirects, and keeps signup, Magic Link, and normal runner login paths out of the admin surface
- `src/routes/api.auth.logout.tsx`
  clears the temporary runner/local auth cookie and signs out Supabase sessions when present without owning the signed admin session
- `src/routes/workout.$date.tsx`
  renders workout detail for preview or persisted data, derives the main surface from backend-shaped lifecycle truth instead of one static tab family, preserves compatibility search handling such as `tab=complete`, safely falls back when an invalid tab requests an unavailable surface, logs results through the canonical backend mutation when saved mode is active, keeps rest-day detail sparse with one grouped right-side context panel, reads backend-owned workout family, exact identity, calendar icon, metric mode, goal context, segment guidance, target cue, and target hint instead of route-local generic coaching advice, and preserves the three-block page structure with richer surface treatment, result-state badges, and progress-driven week status
- `src/routes/progress.tsx`
  renders a compact progress summary using preview or persisted aggregates from the same data seam, with completion, volume, weekly planned-vs-actual mileage, and recent workout consistency kept intentionally small instead of presenting a full analytics dashboard; sparse zero-volume states show short honest copy instead of an empty chart frame
- `src/routes/body.tsx`
  exists only as a legacy route guard and redirects `/body` to `/`, so older links no longer fall through to a raw 404 after body-note ownership moved into workout logging
- `src/routes/integrations.tsx`
  renders a preserved integration shell that now points honestly to the live workout-detail Garmin feedback path and keeps screenshot import plus broader plan adjustments clearly later

## Data Contract

- `src/data/signed-out-preview-plan.ts`
  owns the compact signed-out preview seed used only when no authenticated saved plan is available
- `src/lib/training.ts`
  is now the canonical normalized seam for:
  signed-out preview snapshot creation from the compact seed
  real current-date resolution for preview and saved-mode calendar behavior
  persisted snapshot shape
  rich workout family/identity/icon/goal-context/metric compatibility fields read from persisted rich workout columns when available or derived from legacy `source_workout_type`/`workout_type` fallback for old plans
  visible workout language through backend-owned `plannedWorkoutLanguage`, with glyph identity preferring backend-owned `calendarIconKey` and `workoutFamily` before falling back to legacy source/title/step compatibility for old rows
  workout lookup
  status derivation
  weekly aggregates
- `src/lib/training-api.ts`
  owns the remaining route-facing server-function wrapper layer for home, shell, workout detail, progress, settings route data, login, active-plan lifecycle, schedule edit/reflow, and workout log. It no longer owns extracted implementation bodies, proved type-only/import-map contracts, plan replacement action names, or manual Add/Create/Templates/Copy/Move/Delete/Clear/Edit/Review runtime wrappers whose canonical owner modules already exist; active-plan export routes import the canonical export action owner directly, no-active-plan first-plan and selected-plan creation imports now call the canonical action owners directly, saved-mode JSON replacement imports call `src/lib/plan-replacement-actions.ts` directly, `/api/auth/confirm` imports the canonical auth callback exchange owner directly, the settings route imports `saveUserSettings` directly from the user-settings action owner, settings/first-plan/selected-plan type consumers import contract types from their canonical action modules, and manual authoring runtime actions import directly from `src/lib/manual-workout-authoring/*`, including `reviewManualWorkoutDraftAction`
- `src/lib/route-data-actions.ts`
  owns the shared route-data helper layer:
  home, shell, workout-detail, and progress data shaping now live there behind injected snapshot/viewer/feedback loaders, while `training-api.ts` keeps the public TanStack `createServerFn` wrappers so existing route imports and loader data shapes stay stable
- `src/lib/auth-actions.ts`
  owns the auth/login helper layer:
  login route data shaping, loopback local-login availability, safe Magic Link availability, Magic Link request validation and Supabase OTP request behavior, and `/api/auth/confirm` code or token-hash callback exchange now live there; `training-api.ts` keeps only the public login route data and Magic Link request server-function wrappers for current route/component callers
- `src/lib/admin-auth-actions.ts`
  owns the dedicated admin-login contract for `/admin/login` UI:
  it exposes the admin-only redirect sanitizer and route data contract, while `src/lib/admin-auth-actions.server.ts` verifies local/dev fixture credentials only on loopback local runtimes, verifies the deployed owner admin against server-only `HITO_ADMIN_PASSWORD_HASH` plus `HITO_ADMIN_SESSION_SECRET` outside local fixtures, rejects tester credentials without creating a session, and sets only signed admin-only session truth after admin verification; `src/lib/admin-access.server.ts` is the shared admin resolver/facade for route/server-function eligibility, signed admin session resolution, Supabase app-metadata compatibility, and `AdminAccessContext` capabilities for capture, analytics, and local Test Accounts; ordinary tester/product accounts are never accepted by `/admin/login`
- `src/lib/admin-capture.ts` owns the backend contract for the current `/admin/capture` backlog:
  it exposes only the admin server functions used by the current backlog route: backlog list, text-only quick-note create, triage updates, note append, quick-note-only deletion, and deterministic copy-prompt generation; `src/lib/admin-capture.server.ts` verifies the existing admin session boundary before every operation, reads/writes only through the service/admin Supabase seam, keeps item lookup internal to prompt/readback shaping, caps captured text and metadata, redacts secret-like metadata keys/values before prompt output, stores quick-note history in bounded item metadata, rejects title/body/status/type/priority/target-role mutation attempts for repo-derived imported rows with `repo_derived_read_only`, and returns frontend-ready view models rather than local mock state; route-spanning UI capture, screenshot upload, and automatic Codex dispatch are not implemented
- `scripts/import-repo-work-items-to-admin-backlog.ts`
  owns the explicit repo-work mirror into the admin Backlog:
  it scans markdown only from `docs/tasks/backlog`, `docs/tasks/product-briefs`, `docs/tasks/frontend-specs`, `docs/plans/active`, and `docs/plans/archive`; skips README policy docs; parses canonical markdown sections for `Status`, `Type`, `Priority`, `Next Recommended Role`, `Task`, `Stage`, and `Exact Handoff Prompt`; uses the first meaningful `Task` line as the primary Backlog title; mirrors valid markdown truth into `admin_capture_items` fields plus `metadata.markdown_status`, `metadata.markdown_type`, `metadata.markdown_priority`, `metadata.markdown_next_role`, `metadata.work_item_status`, `metadata.source_path`, and `metadata.source_type`; marks old archive docs with `metadata.missing_required_fields` / `metadata.invalid_required_fields`; never maps repo-derived rows to `in_review`; upserts by source path/type without touching admin-created quick notes or capture rows; reports stale active repo-derived mirrors whose `metadata.source_path` no longer exists in approved repo import sources; archives those stale mirrors only through the explicit `--archive-stale` flag; and keeps markdown as canonical for repo-authored work while normal admin mutation seams treat imported rows as read-only mirrors
- `src/routes/admin.capture.tsx`
  owns the first visible admin capture backlog route:
  `/admin/capture` is an admin-only standalone workbench sibling to `/admin/analytics`; one canonical backlog read returns the selected status/filter page plus complete status-tab counts independent of the page limit, and validated search state is a loader dependency so SPA tab/filter navigation cannot retain stale rows; the route renders backend-shaped backlog items with status tabs, compact search/filter controls, inline item detail, triage controls, quick-note creation, note append, archive-by-status, and deterministic copy-prompt clipboard actions while leaving admin access, storage, prompt shaping, lifecycle validation, screenshots, live UI capture, and any Codex dispatch on backend/future seams
- Quick setup goal cards are UI shortcuts into `planGoalIntent.distanceMeters`, not backend Plan
  Preset programs:
  selected running-plan preview/create is owned by `src/lib/running-plan-engine-actions.ts` and
  `src/lib/running-plan-engine-review.ts`. The old Plan Preset discovery/review/confirm actions and
  deterministic product builders are removed from current runtime truth.
- `src/lib/active-plan-persistence.ts`
  owns the shared imported-plan apply and active-plan persistence primitives used by first-plan creation and saved-mode flows:
  `applyImportedPlanForUser`, active-plan lookup, planned-workout/log readback with archived-log recovery, reviewed plan/profile/workout shaping, nullable rich workout family/identity/icon/goal-context/metric-mode persistence, and structured first-plan training preference snapshots live there so running-plan confirm and saved-mode import share one prepared persistence contract
- `src/lib/active-plan-lifecycle-persistence.ts`
  owns the service-role wrappers for transaction-backed active-plan workout mutations, reviewed plan creation/replacement, and reviewed clear-before-import apply. Add/Clear/Move plus multi-entity plan apply commit through the append-only atomic lifecycle migrations; stale review, protected history, or an RPC failure leaves the prior persisted plan state unchanged instead of relying on compensating rollback.
- `src/lib/plan-authoring-snapshot.ts`
  owns the small additional plan-metadata merge contract shared by reviewed plan persistence.
  The retired structured/text authoring snapshot builder and refresh metadata vocabulary no longer
  persist a parallel plan-authoring model.
- `src/lib/active-plan-export-actions.ts`
  owns the active-plan export server-action and user-scoped export helper:
  it resolves the authenticated persisted user, reads the current active plan through `active-plan-persistence`, delegates payload/document shaping to `plan-export.ts`, and is imported directly by the active-plan export API route rather than through `training-api.ts`
- `src/lib/plan-export.ts`
  owns active-plan export shaping:
  JSON export projects saved plans into canonical `training-plan-v2` with legacy `workout_type`/`source_workout_type` plus rich `workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, and `metric_mode`; Markdown export is still runner-readable and now adds a compact backend-owned family/identity `Focus` line where useful without exposing runtime-only Garmin/log/AI state
- `src/lib/active-plan-lifecycle-actions.ts`
  owns the active-plan Clear Upcoming Schedule helper:
  it archives the current active plan without deleting planned workouts or logs and accepts the existing persisted snapshot loader from `training-api.ts` so the live action returns the refreshed saved-mode snapshot without making the lifecycle module own route snapshot shaping; `training-api.ts` owns the top-level TanStack server-action wrapper so the lifecycle click resolves auth through the same persisted-user seam as other working mutations
- `src/lib/plan-replacement-actions.ts`
  owns the saved-mode plan replacement action layer:
  advanced JSON import validates canonical `training-plan-v2`, resolves the authenticated persisted user, preserves explicit start-date and first-day resolution policy, and delegates one reviewed apply intent to `active-plan-persistence`; the optional clear-before-import choice is part of that same atomic request, while the standalone Clear Upcoming Schedule remains a separate reachable lifecycle action
- `src/lib/changelog-utils.ts`
  owns pure `/changelog` markdown parsing, date/month/year grouping, source-derived shipped-change count and last-updated helpers, highlight classification, and milestone title derivation while the public route keeps shell, tabs, timeline rendering, and the existing `docs/history/changelog.md?raw` source import
- `src/lib/user-settings-actions.ts`
  owns the user-settings route/action layer:
  it resolves setup and Settings through the same persisted-user mapping as saved mode, creates or updates the complete age/height/weight/fitness baseline without requiring plan rows, owns optimistic `baseline_revision`, delegates runner-level `training_preferences` validation, persists accepted estimated or personal heart-rate provenance, and returns the single `UserSettingsSummary`/plan-authoring snapshot used by setup, preview, review, and confirm
- `src/lib/heart-rate-zones.ts`
  owns the effective heart-rate profile contract:
  unchanged age-derived ranges can be explicitly accepted as `estimated`, changed complete ranges become `personal`, and age changes regenerate only accepted estimated profiles. Stable zone references remain internal authoring provenance, while review/readback resolves accepted profiles to immutable numeric BPM snapshots with `personal_hr_zone` or `default_estimated_hr` target source truth.
- `src/lib/runner-training-preferences.ts`
  owns the shared pure runner training-preference contract used by settings and structured first-plan setup:
  it maps product-facing `fixedRestDays`, `defaultRunningDaysPerWeek`, and `preferredLongRunDay` into the stored `blocked_days`, `max_running_days_per_week`, and `preferred_long_run_day` shape; validates that fixed rest days leave at least one trainable weekday, default running days fit the available weekdays, and an explicitly preferred long-run day is not blocked; and exposes bounded fitness-level mapping where only a direct recent 5K time or pace produces numeric benchmark truth
- `src/lib/rich-workout-model.ts`
  owns the first backend-only rich workout taxonomy contract:
  it defines allowed canonical `workout_family`, `workout_identity`, `calendar_icon_key`, and `metric_mode` values; maps current legacy `workout_type`, `source_workout_type`, title, and segment target truth into rich compatibility fields; for compact-only old rows without `source_workout_type`, it infers tempo, threshold, interval, progression, race/tune-up, hill, or generic quality identity from title/step semantics before falling back to `quality_session`; maps rich family/identity back to the legacy DB `workout_type` family for old paths; and derives metric mode from actual emitted target keys without inventing pace or HR truth, with rest days marked as having no execution metric targets
- `src/lib/persisted-plan-replacement.ts`
  owns shared saved-workout replacement helpers:
  new plan inserts now write nullable rich workout fields from canonical seeds, fixed weekday rest insertion carries the same bounded goal context while using rest-specific metric mode, and preserved planned-workout rows can be converted back into imported-workout seeds while keeping stored rich family, identity, icon, goal context, and metric mode before falling back to compatibility inference
- `src/lib/workout-log-actions.ts`
  owns the workout-log save action helper layer:
  it validates completed, partial, and skipped workout-result payloads, normalizes skipped results to null actual metrics, validates bounded workout-scoped body notes, checks that the planned workout belongs to the persisted user and is not a rest day, and upserts the canonical `workout_logs` row while `training-api.ts` keeps the public `saveWorkoutLog` server-action wrapper for compatibility
  current QA acceptance includes saving a completed first generated non-rest workout from a Quick
  setup-created 10K generated plan and reading back the same planned workout id through
  `workout_logs`; Garmin/FIT provider evidence remains owned by the separate feedback upload seam
- `src/lib/first-plan-authoring-utils.ts`
  owns the small shared first-plan authoring helper layer used by structured onboarding:
  bounded visible form values, weekday de-duplication, real-date validation, and duration/pace parsing live there instead of being duplicated across first-plan modules; it no longer owns execution defaults, long-run selection, day spreading, or goal coaching helpers
- `src/lib/structured-first-plan-onboarding.ts`
  owns the visible first-plan form type contract still consumed by frontend constructor code. The
  live generated-plan serializer is
  `buildAiGeneratedRunningPlanAuthoringInput`, which sends only explicit runner facts, exact goal
  intent, and declared calendar constraints to the provider; current review/confirm truth belongs
  to the running-plan engine review/actions seams, not to a second structured review model.
- `src/lib/structured-plan-authoring-schema.ts`
  owns the bounded plan-first provider-context schema: exact goal intent, explicit runner facts,
  declared availability, fixed rest days, and the effective runner heart-rate profile. It does not
  derive runner archetypes, baseline load, horizon, workout density, progression, or other coaching
  decisions; HR references are resolved deterministically from profile truth rather than interpreted
  as backend coaching.
- `src/lib/imported-plan.ts`
  owns the canonical `training-plan-v2` import contract, JSON validation helpers, the runtime-noise exclusions for v2, the bounded canonical target and prescription normalization rules, the accepted-but-ignored `_ml_agent_template` instruction block, optional exact `source_workout_type` identity, additive rich workout fields (`workout_family`, `workout_identity`, `calendar_icon_key`, `goal_context`, `metric_mode`), compatibility derivation for older compact-only v2 files missing those rich fields, and the mapping from accepted import shapes into the canonical saved workout shape
- The historical strict nested, compact weekly, and internal generated-plan draft variants are no
  longer current PlanCreation authoring paths. Current generated first-plan work is owned by
  `src/lib/ai-first-plan-draft-service.ts`, `src/lib/ai-authored-plan-first-compiler.ts`,
  `src/lib/ai-generated-running-plan.ts`, and the running-plan review/confirm seams.
- `src/lib/ai-first-plan-draft-service.ts`
  owns the non-mutating AI-authored plan-first service: it accepts the canonical runner-facts and
  calendar-constraints input, requests one `hito_ai_authored_full_plan_draft` response from OpenAI
  or the loopback-only provider fixture, and accepts one compact closed response containing a flat
  non-rest `workouts[]` list plus one exact endpoint. Provider output uses canonical workout and
  segment enums, structural-only Repeat parents, ordered child truth, bounded numeric prescriptions,
  exact min/km pace, and effective-profile HR references; it has no plan-level narrative metadata,
  duplicate goal presentation, week wrappers, or alternate authoring grammar. The service compiles
  that response into canonical `training-plan-v2` and returns either `ai_authored` output or a
  bounded unavailable result before review. It does not save plans, call AI at confirm, or expose
  alternate generated-plan authoring modes.
- `src/lib/ai-authored-plan-first-compiler.ts`
  owns the backend parser/atomizer/compiler boundary for that same closed provider contract: every
  provider-valid field has one lossless canonical projection, while malformed transport or
  contract-invalid structure fails before review. AI owns titles, phases, identities, sections,
  numeric `M:SS/km` or `M:SS-M:SS/km` pace guidance, supplied HR references, effort, and cues;
  backend owns date/rest-day integrity, structural Repeat conversion, deterministic
  reference-to-BPM resolution from the effective profile, canonical `training-plan-v2` output, and
  exact review/readback fields without semantic fallback or coaching substitution.
- `src/lib/entitlements/*`
  owns the first backend-only Basic/Pro entitlement foundation:
  one canonical capability registry for `garmin_ai_interpretation`;
  entitlement resolution that treats a missing row as effective `Pro`; capability checks with
  bounded locked responses
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
  it renders backend-shaped Overview, Funnel & Usage, Feedback, AI & Entitlements, Users, and Test accounts tabs, keeps the Users table scoped to backend-classified real users, keeps local/test/admin/suspected rows in Test accounts, links to `/admin/capture` as a sibling admin surface, and uses Hito table controls with collapsed search, active-filter summary, DS-owned sortable/non-sortable table headers, header sort/filter menus, and contained horizontal scrolling while leaving admin checks, account-file access, Supabase deletion, analytics aggregation, and all credential/sensitive-payload safety rules on server contracts
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
- `supabase/migrations/20260528190000_admin_capture_backlog.sql`
  adds the first admin capture backlog storage foundation:
  RLS-enabled `admin_capture_items` storage for text/metadata capture truth; the earlier unused screenshot asset table is removed by `supabase/migrations/20260601110000_remove_admin_capture_assets.sql`, and the empty `admin-capture-assets` bucket is removed through the Supabase Storage API because direct storage catalog deletion is not allowed, so runner/public clients cannot directly read or write backlog truth and all current access goes through admin-verified service-role server seams
- `scripts/validate-admin-capture-backlog.ts`
  owns the backend proof harness for the capture backlog:
  the default deterministic mode verifies admin create/list/read/update, non-admin rejection, deterministic prompt generation, archived-list behavior, metadata redaction, quick-note-only deletion, repo-derived read-only behavior, and stale repo-derived mirror cleanup policy; `--live-supabase` / `npm run validate-admin-capture-backlog:live` probes the linked Supabase project for item-table availability, absence of the retired asset table/bucket, service-role operations, publishable-key RLS blocking, and disposable-row cleanup without printing secrets

## State And Lifecycle Rules

- signed-out users now hit a login-first entry surface on `/` and do not create trusted history
- signed-out preview routes can still render on direct route access when real Supabase env values are absent, but they are no longer the primary entry experience
- temporary local-bypass users may still enter saved mode through visible credentials login on loopback local runtimes only, while deploy-like runtimes expose only the real auth surface and authenticated saved-mode truth always resolves through Supabase
- entitlement rollout is backend-owned and pre-billing:
  if a user has no `runner_entitlements` row, the effective tier is `Pro`; an explicit active
  `basic` row can enforce the current Pro-only `garmin_ai_interpretation` capability
- authenticated users without `runner_profile` are routed into setup on `/`
- authenticated users with a saved profile but no active `plan_cycle` now also stay honestly in setup until a canonical creation path succeeds
- Quick setup goal cards are now non-mutating distance-goal shortcuts:
  the setup surface can show 10K, Half Marathon, Marathon, and Custom distance choices, then enters
  the same backend-owned OpenAI/local-fixture-authored dated generated-plan preview/create truth.
  Direct selected-plan create applies only when there is no active plan through that normal creation
  seam; starting a generated plan from an existing
  `manual_user_built_plan_v1` uses the separate backend-owned reviewed transition seam in
  `src/lib/active-plan-transition-actions.ts`, not the removed Plan Preset review/confirm seam.
  That transition review is non-mutating, signs stable selected-plan plus active-plan revision
  truth, and confirm archives/supersedes the old manual plan before activating the reviewed selected
  plan without merging upcoming manual workouts.
  Quick setup now treats visible goal cards as convenience inputs into the same backend-owned
  OpenAI/local-fixture-authored dated generated-plan path for 10K, Half Marathon, Marathon, and
  Custom distance. Custom requires a valid distance before preview; accepted generated plans
  persist canonical `distance_goal` truth with exact `distance_meters`, not a card/family value.
  Deterministic selected-plan product builders and backend Plan Preset discovery are removed from
  current product truth.
- Manual user-built plans are now a canonical no-active-plan and saved-calendar creation path:
  `src/lib/manual-workout-authoring/*` owns draft validation, backend template registry, review
  token/checksum exactness, first manual plan confirm, and adding one reviewed workout into an
  active plan; the manual Add mutation accepts eligible Rest/no-workout targets on today or future dates
  while keeping past, occupied, logged/evidence-backed, and protected targets blocked.
  `src/lib/active-plan-workout-editing/policy.ts` owns the shared active-plan operation policy, while
  `source-capabilities.ts` projects row capabilities. Add/Clear/Move/Copy remain separate operation
  contracts. Every confirmed non-rest workout on today or a future date enters reviewed editing
  regardless of source, logs, completion, or evidence; past rows are rejected before review.
  Policy, capability projection, persisted-edit reconstruction, the atomic edit RPC, and workout
  detail share that contract, while retaining the original workout row as durable pre-edit history.
  `Calendar.tsx` and workout detail consume those backend-shaped capabilities. Runner-facing Add date labels use the shared date-only
  helper and final confirmation repeats the selected date/weekday; backend persistence remains the
  source for `workout_date`, weekday readback, source kind, row counts, edit metadata, and
  metric-truth metadata.
  Manual Review add now consumes the backend-owned `manual_workout_constructor_contract_v1`
  `constructorContract.timeline` for segment/repeat readback; Repeat set remains structural-only,
  while accepted v1 runner-entered manual targets normalize through backend target source truth:
  no target, pace exact/range, HR bpm cap/range, and RPE/effort. The accepted compatibility proof now
  covers manual review -> persisted `planned_workouts.steps` -> active-plan export ->
  `training-plan-v2` parse/import -> provider comparison input. Generated/inferred pace,
  default/age-estimated HR as personal truth, personal-zone claims, and unsupported target families
  still reject through backend validation. Backend `plan_goal_intent_v1` and frontend Quick setup /
  guided selected-plan readback are accepted; outcome pace and distinct derived pace render as
  goal/review truth, not executable workout targets. Backend has retired old flat segment-level
  `training-plan-v2` repeat fields, frontend runtime-visible repeat consumers now use centralized
  child-first repeat readback, and the 2026-06-28 Product-authorized legacy repeat purge removed the
  remaining persisted pair-shaped repeat data from Supabase project `dltfjwexyctmihclcjqj`.
  `planned_workouts.steps`, import/export, provider comparison input, manual reconstruction, and the
  runtime seed fixture now use ordered repeat `children[]`; `repeat_unit` / `recovery_unit` and
  persisted repeat sibling `work` / `recovery` compatibility are retired.
  Backend personal saved-template truth is also implemented through the
  `runner_manual_workout_templates` table and manual authoring saved-template actions: reviewed
  manual workouts can be saved as current-user-owned templates with display name/icon metadata,
  listed for the owner, protected by RLS/current-user ownership, and reconstructed into future
  non-persisted manual drafts through `reviewManualWorkoutDraft(...)`. The same owner now provides
  personal-template deletion plus one backend-shaped catalog that combines the global built-in
  registry with per-runner hide/restore state stored on `runner_profiles`; built-ins remain
  immutable global structure defaults and seed no pace, HR, or RPE. The frontend picker now consumes
  that catalog and its personal delete plus per-runner hide/restore actions instead of owning a
  static built-in list.
  Saved manual calendars now
  also support personal-template picker reuse, direct backend-owned manual Copy/Paste, Delete/Clear
  review/confirm, and direct backend-owned Move Workout. Move updates the same persisted
  `planned_workouts` row date/weekday/week truth; frontend renders the menu, drag/drop affordance,
  and refresh from persisted state without owning schedule mutation truth. The persisted edit
  lifecycle uses the same server review/confirm, stale protection, atomic edit-audit persistence,
  source provenance, and retained pre-edit planned truth described above; today, logged, and
  evidence-backed rows preserve their attached history through the edit.
  Persisted AI-authored workouts use that same full constructor and preserve canonical identity,
  notes/cues, primary execution mode, exact ordered Repeat child roles, and unchanged AI target
  provenance; runner-changed targets normalize to runner-entered truth. Shared target readback
  exposes exactly one authored effort command, including numeric RPE when that is the selected
  command.
  Universal Copy/Paste, recurrence, Restore/Put back/Redo UI, active-plan replacement semantics
  expansion, QR/share/import, PDF/watch export, and coach/organization templates are not implemented.
- visible onboarding on `/` is now split between manual setup and quick setup:
  authenticated users without setup can create an empty manual plan from required basics, or use
  Quick setup for backend-owned selected distance-goal review. `previewRunningPlanDraft` runs the
  non-mutating plan-first AI/local-fixture path, compiles accepted
  `hito_ai_authored_full_plan_draft` output into canonical `training-plan-v2`, and returns the signed
  review. `confirmRunningPlanDraft` verifies that review and persists it without a second AI call.
  The structured constructor supplies advanced Quick setup inputs but does not own another
  generated-plan action path.
- Dictate-to-Plan / voice-to-plan is retired from current system truth:
  the old `src/components/onboarding/DictateToPlanPanel.tsx` UI residue, the
  `src/lib/voice-to-plan-authoring.ts` backend seam, the `voice_to_plan` entitlement capability,
  and the `generateVoiceToPlanDraft` / `confirmVoiceToPlanDraft` first-plan actions are removed.
  Do not describe the compact Pro `AI setup`, microphone, transcript paste, or voice setup assist as
  live until a future Product/Backend/Frontend gate reselects and rebuilds it from the current
  structured plan-authoring contract.
- the no-plan onboarding frontend implementation now keeps orchestration in `OnboardingGate` while
  the structured constructor, selected distance-goal review, manual setup, and shared onboarding
  form model live in focused `src/components/onboarding/*` modules so those paths share option
  registries and request-building helpers instead of maintaining separate local truth
- current generated-plan onboarding uses `previewRunningPlanDraft` followed by
  `confirmRunningPlanDraft`; the backend validates required explicit runner facts, impossible
  running-day/rest-day combinations, exact selected distance, optional benchmark, target time, and
  target date, and persists only after an explicit confirmed `ai_authored_plan_first_v1` review
  benchmark and target-time/date details remain generation/plan context rather than long-lived runner profile truth
  recent 5K time or pace is provider context, not a backend workout-authoring algorithm; the AI/local fixture authors the complete plan and one primary execution mode per runnable leaf. The compiler preserves benchmark-backed pace, references from an explicitly accepted estimated or personal HR profile resolved to snapshot BPM, effort, or Run/Walk exactly as authored, keeps leaf cues as separate non-command context, rejects unsupported or contradictory commands, and never falls back to a deterministic plan
- the visible constructor now starts from saved runner profile defaults when available:
  age, weight, height, fixed rest days, default running-days/week, and preferred long-run day prefill from `runner_profiles`, remain editable in the constructor, and the confirmed first plan persists the edited values back to runner-level profile defaults without mutating any existing active plan
- settings and structured onboarding share the same frontend primitives for those profile defaults:
  `EditableValueChip` owns the compact age/height/weight add-edit-save interaction, and `TrainingPreferenceFields` owns the progressive Hito controls for explicit no/fixed rest days, required default running-days/week, optional preferred long-run day, and bounded fitness-level/custom-5K entry while leaving validation and persistence to backend-owned settings and running-plan actions
- advanced JSON import remains available inside onboarding as a demoted fallback path for existing Hito plan files, migration, and testing
- structured first-plan onboarding feeds the AI/local-fixture plan-first compiler, while advanced JSON import applies canonical `training-plan-v2`; both persist reviewed profile, plan, and workout truth through the same atomic lifecycle seam, and the clear-before-import choice is one transaction-backed import intent rather than a committed clear followed by a separate apply
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
- saved mode also has a narrower backend `Clear upcoming schedule` lifecycle action:
  clearing the upcoming schedule archives the current active `plan_cycle` from the active schedule view, preserves all planned-workout rows and workout logs under archived history, records the clear cutoff as today for the action result, and returns the runner to the authenticated no-plan/setup-ready state so a later-starting imported or generated plan cannot inherit stale future workouts
  if today already has logged truth, that log remains attached to its archived planned-workout row; the action removes it only from the active schedule, not from saved history
- the saved-mode calendar header overflow now exposes that clear-upcoming lifecycle as a confirmed
  utility; later-starting JSON import carries its optional clear-before-import choice inside the
  same transaction-backed apply request rather than committing a clear before apply; visible
  `Delete active plan` is not part of current accepted IA
  the clear-upcoming control is isolated in [src/components/plan-management/PlanLifecycleControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanLifecycleControls.tsx), while `PlanManagementDialog` remains the owner of confirmation state, lifecycle server calls, errors, status transitions, and success navigation
- saved mode now has a backend-owned active-plan export seam:
  [src/lib/active-plan-export-actions.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-export-actions.ts) owns the authenticated action/helper layer and [src/lib/plan-export.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-export.ts) builds one canonical payload from the current active `plan_cycle` plus its saved `planned_workouts`, then projects that same payload into `training-plan-v2` JSON and runner-readable Markdown
  exported dates come from the active saved workout rows, so chosen-start-day effects are reflected in the artifact, and runtime-only saved-mode state such as logs, Garmin evidence, comparisons, and AI feedback is intentionally excluded
  the saved-mode calendar header overflow now exposes one compact `Export JSON` action using that
  same backend-owned document truth and backend-provided filename
  Safari-compatible delivery now uses one authenticated attachment route for the actual browser download request instead of reconstructing files from a client-side blob URL
  the active-plan summary/header UI is isolated in [src/components/plan-management/PlanSummaryHeader.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/PlanSummaryHeader.tsx), preserving title, goal fallback, active status, and date/count/target summary
  the calendar header overflow in [src/components/AppShell.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/AppShell.tsx) owns the visible `Export JSON` action, while [src/components/plan-management/plan-export-download.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/plan-management/plan-export-download.ts) owns the Safari-compatible iframe download helper
  PDF export remains a later slice, but it must reuse this same payload rather than shaping a second export truth
- the frontend now mirrors that simplified policy instead of the older symmetric chooser:
  text-first apply and advanced JSON apply both use the safe backend default without a required preserve-vs-ignore modal step
  and only one explicit destructive override remains in the UI, now kept behind a quieter disclosure instead of being shown as an equal sibling of the safe action
  saved-mode import uses [src/components/UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx), while current calendar IA routes plan creation through `Add plan` and safe utilities through overflow instead of a runner-facing `Open plan` hub
- AI-authored plan output never persists directly:
  the app validates and compiles the model or local-fixture response into canonical reviewed
  `WorkoutDocument`/`training-plan-v2` truth, then persists the confirmed document through the same
  `plan_cycles` plus `planned_workouts` seam used by JSON import; raw provider output is not a
  persisted plan and no deterministic fallback author rewrites it
- saved mode now also has a backend-only active-plan schedule edit preview contract:
  [src/lib/active-plan-schedule-edit-contract.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-contract.ts) owns the public schedule-edit input/result/readback types, while [src/lib/active-plan-schedule-edit-preview.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts) remains the stable runtime facade and validates proposed fixed rest days, running-day count, optional explicit running weekdays, and preferred long-run day through the shared runner training-preference rules before building a non-mutating preview from the active `plan_cycle` and saved `planned_workouts`
  when the weekly running-day count stays the same, the preview returns `schedule_reflow` with proposed future date moves, protected-history counts, fixed-rest-day proof, long-run-day result, bounded rich-field/step-count summaries, warnings, and a preview token; no OpenAI call, regeneration, profile/default update, or plan mutation occurs
  when the weekly running-day count changes or the proposed schedule cannot safely fit future mutable workouts, the preview returns `requires_regeneration` with a bounded reason and context for a separately reviewed replacement plan; schedule reflow does not generate or apply one
  past/today, logged, Garmin asset, actual metrics, comparison, and AI-insight-backed workouts are treated as protected and stay out of proposed date moves
  the same module now owns the schedule reflow apply seam: `applyActivePlanScheduleReflowPreview` accepts the reviewed `previewToken` plus the original schedule input, reloads active-plan/workout/log/evidence truth, rebuilds the preview server-side, rejects stale or regeneration-required results, and calls one transaction-backed Supabase RPC so reviewed future non-rest workout date/weekday/week/display metadata and active-plan schedule preferences commit atomically; workout content, steps, rich fields, metric mode, goal context, source ids, logged/evidence-backed rows, and runner-level Settings defaults are not changed
  the saved-mode calendar header overflow exposes this through `Edit schedule`, which prefills from
  active-plan `plan_preferences` when available, collects rest-day/running-day/long-run choices,
  renders the backend review, and applies only the reviewed preview token without mutating from the
  schedule panel
- canonical richer-plan truth survives in that same seam across JSON import and AI-authored plan-first creation:
  `plan_cycles` preserves `schema_version`, `source_kind`, `target_date`, goal metadata, and plan preferences
  while `planned_workouts` preserves source workout identity plus normalized fatigue and recovery semantics
- preview-derived active-plan bootstrap has been removed from the authenticated runtime path:
  the app no longer auto-creates a saved plan from preview data behind the scenes
- the imported JSON week creates the saved `planned_workouts` directly instead of shifting the preview template onto today
- home and calendar now anchor `today` to the real runtime local date instead of a frozen template start date
- the preview snapshot no longer caches a stale `currentDate`, so reloads can reflect the actual current day
- the saved-mode home hero now resolves an active-schedule date without a persisted workout through the same continuous `Rest` projection used by Calendar, including dates after the final scheduled workout; the separate pre-start and genuine no-plan/onboarding states remain intact
- the saved-mode home hero keeps week status in the top/header treatment, uses a dismissible right-side `Planning Note` or pre-start support note plus next-workout context where relevant, and no longer repeats week status inside that side support area
- saved-mode home-return affordances in the shell now reopen `/` through a fresh document request so already-open tabs can recover the authoritative home route even when a stale client fetch path fails
- calendar day cells now mark completed workouts with a clearer green confirmation state while keeping today and rest states readable
- saved-mode home/calendar now follows the simplified P0 rhythm: cells prioritize date, backend-owned rich family/icon workout identity, completion marker, and secondary feedback cue while detailed distance/duration context stays in hover or the larger week context; old compact rows still render through source/title/step compatibility fallback
- calendar month tooltips now render through one viewport-clamped fixed layer instead of absolute cell-local placement, and narrow month view switches to a vertical day list while preserving workout links, glyphs, status markers, today/completed treatment, and feedback markers
- workout completion is the canonical mutation and upserts one `workout_log` per planned workout
- the sidebar profile trigger now resolves one viewer label plus current plan title from the shared auth and snapshot seam, and owns the saved-mode advanced import entry point plus sign-out action
- the saved-mode calendar header uses primary `Add plan` plus adjacent overflow; overflow utilities
  are `Export JSON`, `Edit schedule`, and `Clear upcoming schedule`, and the old `Open plan`,
  `Update plan`, and `Delete active plan` concepts are not current product IA
- `/integrations` remains routable as a quiet connections/status utility, but it is no longer part of the primary desktop or mobile runner navigation
- `/body` is now a retired legacy path that redirects to `/`, so older bookmarks recover into the current plan experience instead of opening a competing body-notes surface or a raw 404
- the sidebar plan-note support block is locally dismissible and no longer repeats the same week status already shown in the top header
- the saved-mode advanced import dialog reuses the canonical onboarding mutation instead of creating a second plan-import path
- that same saved-mode import dialog now follows the same stable product-dialog recipe as the other
  saved-mode workflow dialogs: bounded panel height, internal body scroll, reachable footer, stable
  Safari content behavior, and stable non-blocking overlay close behavior
- after a successful saved-mode advanced import apply, the client now leaves the current page through a fresh document request to `/` instead of relying on an immediate in-place router refresh on the replaced plan state
- the saved-mode advanced import dialog now accepts only canonical `training-plan-v2` files, and runtime-only v2 fields such as `status`, `completion_state`, and sync or feedback placeholders remain non-canonical
- the downloadable `training-plan-v2` JSON template now demonstrates rich workout family, exact identity, calendar icon, goal context, and metric mode fields plus metric-safety guidance; its instruction block remains accepted-but-ignored template guidance, not persisted runtime truth
- the structured first-plan constructor feeds the AI/local-fixture plan-first compiler, whose reviewed output uses the same canonical `training-plan-v2` family as JSON import and persists through `plan_cycles` plus `planned_workouts` with `steps jsonb` as the structured workout payload
- normalized `planned_workouts.steps jsonb` now preserves explicit segment-level `segment_id`, `segment_type`, `sequence`, `prescription`, and canonical target keys such as `hr_bpm_range` and `pace_min_per_km_range`
  while one bounded interval DSL supports both distance-based and time-based repeat units
  older persisted rows may still carry legacy target aliases, but new writes now persist only the canonical target keys
- executable workout steps are now normalized with runner-facing instruction truth before workout detail readback:
  non-rest segments and ordered Repeat children carry executable structure plus exactly one AI-authored primary target mode; plan-first pace commands accept only numeric min/km values backed by explicit benchmark truth, heart-rate commands require an explicitly accepted estimated or personal profile and resolve to labelled snapshot BPM guidance, effort and Run/Walk remain first-class commands, and leaf guidance stays separate from the watch command. Repeat parents remain targetless, and the compiler never invents fallback pace, HR, recovery, or deterministic workout content
- workout detail now renders those executable step instructions directly:
  the route surfaces backend-shaped executable target entries separately from segment `guidance`, target `cue`, target `hint`, focus/RPE/source copy, unaccepted age-estimated context, and backend family/identity/icon/metric/goal readbacks; old compact-only or legacy effort/cue-only rows remain readable without producing preferred executable target entries, while Today/calendar readback, interval visualization, first-plan review copy, and plan export use the same display-safe target helpers instead of computing metric truth locally
- plan-first generated workouts carry the AI-authored exact session identity without changing the broad calendar family:
  `source_workout_type`, title, summary, and segments preserve the compiled workout meaning while `workout_type` remains compatibility-safe for compact surfaces
- richer route-facing target shaping now exposes only display-safe scalar target values and suppresses opaque nested metadata instead of letting structured extras leak into visible `[object Object]` strings
- saved-mode workout identity now keeps richer imported source workout type truth available at runtime, so canonical `intervals`, `progression`, `race`, and `recovery` imports do not silently collapse into misleading visible `easy` labels; compact-only legacy imports without explicit rich fields also infer tempo, distance/time intervals, race-rhythm, taper tune-up, hill, progression, and stride identities from bounded title and segment semantics before falling back to generic quality
- saved-mode rendering now keeps distance-first interval reps visible as distance-first in workout structure UI, resolves tempo-backed quality workouts to a tempo-specific visible identity, gives `marathon_steady_specificity` a runner-facing marathon-specific display override without changing its canonical identity, and formats visible distance totals through one shared rounding seam
- the same dialog still exposes one static `Download JSON template` affordance for file-based plan handoff, but the saved-mode apply path is no longer legacy-only
- active-plan replacement now carries saved workout logs forward only for exact deterministic matches on logged days by date, workout type, title, notes, and steps; otherwise the apply step is rejected and the current active plan remains unchanged
- if older broken replacements already stranded logs on archived plan cycles from the same user and plan window, the persisted seam repairs those orphaned same-date logs back onto the current active plan before evaluating visible state or replacement safety
- saved workout logs can be overwritten from `completed` to `partial` or `skipped`, and skipped truth persists with null actual metrics instead of backfilled planned defaults
- saved workout logs now also carry optional workout-linked `body_notes` as bounded JSON array truth; those notes belong to the specific workout result and are read back through the same saved-mode workout snapshot seam as completion notes and actual metrics
- past-due planned workouts without a saved log are treated as `skipped` until the user overwrites them with a real result
- `week_status` is derived on the backend-facing seam from persisted workout state, not from client-only heuristics
- rest days no longer render distance, duration, load, or placeholder target and note sections by default; only genuine assigned rest-day content is surfaced
- workout detail now shows saved result semantics directly in the route chrome:
  check for `completed`
  dash for `partial`
  cross for `skipped`
- the workout-detail `Week Status` block now answers one deterministic question through a progress bar:
  completed non-rest workouts in the current week
- `src/components/CompletionPanel.tsx`
  now keeps `Log result` focused on manual completion truth, uses a compact workout-scoped body-note summary row plus modal editor instead of the older inline body-note block, keeps that body-note modal on the same Safari-stable bounded-height dialog pattern used by product workflow dialogs so the title, internal scroll, and footer actions stay reachable, adds one lighter state-aware Garmin continuation row into `Feedback`, and keeps the dedicated workout-detail `Feedback` surface as the canonical owner of the live `FIT / ZIP file` control, parsed Garmin evidence summary, factual plan-vs-run comparison readback, and the bounded AI interpretation readback
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
- the first Hito design-system implementation slices now exist in shared CSS primitives for canonical typography roles, low-card surfaces, tiered buttons, tiered fields, textareas, helper/error text, tabs, labels, captions, dividers, grouped rows, metric rows, compact status pills, compact status markers, setup/empty/error state surfaces, compact summary metrics, chart legends, chart notes, comparison-bar chrome, tooltip shells, editorial timeline date rails, highlight tags, editorial backdrops, timeline entries, timeline dots, inline code chips, canvas/auth/launch/state/editorial overlay recipes, Hito-owned shared wrapper defaults for dialog, sheet, dropdown menu, and select, Hito progress/card/sidebar chrome recipes, internal workbench shell/sidebar/topbar/quick-link/summary-grid recipes, body severity scales, body severity summaries, shell navigation rows, shell profile triggers, shell dropdown rows, and disclosure; those primitives are applied to auth, onboarding, advanced import, shell chrome, home/calendar support surfaces, workout-detail grouped/status/metric surfaces, deeper workout-structure and completion micro-surfaces, route-level state surfaces, progress summary surfaces, body severity micro-UI, preserved integration utility rows, public changelog rendering, launcher/admin/auth atmospheric shells, shared interaction wrappers, `/admin/analytics`, and the internal `/hitoDS` reference page
- `/hitoDS#calendar-workout-playground` now documents static calendar/workout day specimens for desktop month cells, mobile workout rows, dense month-grid stress, workout/rest/no-workout/outside-plan states, result/evidence markers, title overflow, and manual-authoring visual states; `src/components/ui/hito-calendar-day.tsx` owns the shared presentational `HitoCalendarDayCell` / `HitoWorkoutDayRow` anatomy, product `Calendar.tsx` maps real backend-shaped `TrainingSnapshot` / `Workout` truth into display props and keeps product links/tooltips/feedback routing, and `/hitoDS` maps controls/specimen state into the same display props without wiring CRUD, recurrence, backend mutations, persistence, generation, row-count, or product calendar semantics. Shipped manual-plan editing belongs to the product calendar and backend manual authoring seams, not to `/hitoDS`.
- the first Hito DS foundations cleanup slice now adds a raw color primitive layer underneath the existing semantic product tokens, exposes compact `--space-*` primitives plus Tailwind-facing Hito spacing aliases, and documents color through `/hitoDS#foundations` Semantic Colors and Primitive tabs: semantic cards copy token/recipe code, primitive swatches copy existing Hito hex values, and alpha/gradient recipes stay semantic rather than becoming generated primitive palettes; typography families, semantic tone rules, workout-color boundaries, and spacing rhythm remain documented without changing runner-facing screen behavior
- the accepted workout color-token DS contract now lives in the Hito DS token/rendering layer: `src/styles.css` owns primitive workout scales and semantic workout/section slots, `src/lib/workout-color-tokens.ts` owns shared workout color helpers, `/hitoDS` documents the workout roles Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills, and Run/Walk plus section roles Warm-up, Run, Work, Recover, Finish, and Cooldown, and Repeat set remains structural-only with no standalone semantic color token
- the accepted inline editable text contract now lives in `src/components/ui/inline-editable-text.tsx` and `/hitoDS/patterns#inline-editable-text`: `InlineEditableText` is for direct editable contexts such as the manual constructor title, `InlineReadOnlyText` documents passive preview/readback without edit chrome, explicit post-confirm workout editing remains a separate backend-reviewed action, and local inspector task targeting remains a non-mutating local-only devtool behavior until a backend Admin Capture persistence slice explicitly accepts persisted task creation
- the second Hito DS foundations cleanup slice migrates the highest-drift workout-detail chrome to existing DS primitives: the workout route now uses Hito surfaces, row groups, hairlines, tab badges, micro-labels, body-small text, and semantic signal fills instead of local hero gradients, bespoke rounded values, white-alpha borders, and tiny text recipes; `CompletionPanel` keeps the same save/Garmin behavior while using DS surface/radius/text primitives for interval controls and the Garmin upload empty state
- the third Hito DS foundations cleanup slice starts the Calendar/Shell rollout with the calendar surface only: month headers, week-strip metadata, workout type tags, tooltip metadata, compact metric readbacks, and view controls now use existing Hito micro-label, body-small, technical-mono, metric-label, tab, and button primitives instead of local tiny text, tracking, mono, and button-spacing recipes, while calendar interaction, navigation, tooltip logic, and feedback markers stay unchanged
- the Shell/AppShell DS foundations cleanup slice now normalizes profile trigger and dropdown text with `hito-menu-text` and `hito-menu-meta`, uses `hito-technical-mono` for the top-bar date, removes local shell CTA tracking overrides, and introduces `hito-shell-avatar-fallback` as the single DS-owned profile fallback recipe used by both the live shell and `/hitoDS`
- the Auth/Login DS foundations cleanup slice now normalizes auth tabs, email heading, and signed-in route state with existing Hito tab, micro-label, surface, body, modal-title, and button roles; the auth hero remains intentionally unique, but its signal dot glow now uses the semantic `--color-signal` token instead of a route-local rgba shadow
- the Settings DS foundations cleanup slice now keeps `/settings` behavior stable while moving the large profile avatar surface to DS-owned `hito-profile-avatar` and `hito-profile-avatar-fallback` recipes, removing route-local arbitrary radius and gradient fallback styling from the settings avatar cluster
- the Hito primary sans family is now Poppins at the foundations layer: `src/styles.css` loads Poppins through the canonical font import and maps `--font-sans` to Poppins, while Fraunces display roles and JetBrains Mono technical/metric roles remain unchanged
- Hito now owns selection-control recipes for checkbox, radio, and toggle-radio controls in `sm` and `md` sizes; selected states use the normal `signal` tone, focus-visible stays separate from selected state, labels provide the click target, and destructive confirmation keeps destructive meaning in warning copy/icons/buttons rather than red selected controls
- the first canonical typography normalization slice now defines reusable text roles for display, page title, modal title, section title, panel title, body, body small, helper, caption, label, form label, button, navigation/menu, metric, status, error/success, and technical mono text; saved-mode plan-management/import, `Log result`/`Feedback` typography hotspots, and `/settings` now use those roles for their highest-drift headings, form labels, helper/body copy, status text, and technical metadata
- shared Radix dialog title and description primitives are now typography-neutral so product dialogs must opt into canonical Hito roles such as `hito-modal-title` and `hito-body`; the primitive preserves accessibility behavior without reintroducing generic `text-lg`, `font-semibold`, `leading-none`, `tracking-tight`, or muted-description defaults that can override the design-system contract
- the Hito icon-system slice now centralizes product icon usage in `src/components/ui/icon.tsx`: the Hito `Icon` primitive maps stable product names to the approved Tabler source set, limits ordinary usage to `xs`, `sm`, `md`, and `lg` sizes, and keeps raw SVG folders out of the design-system source of truth
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
- `npm run import:current-plan` is now a hardened local ops helper for canonical `training-plan-v2` import preflight; the default command prints help and does not mutate, `--dry-run --plan-file <path>` validates the seed without opening a Supabase client, and `--apply` is blocked unless the caller also passes `--allow-local-supabase-mutation` against a loopback Supabase URL
- `npm run test-user -- ...` is the canonical Backend lifecycle tool for tester-account create, reset, optional plan seeding, and cleanup-to-zero delete against the local loopback Supabase auth/data model; it refuses non-loopback targets before creating a client and has no hosted mutation override
- `.tanstack/hito-running-local-accounts.json` is now the preferred ignored local credentials file for repeatable tester login on the temporary local bypass path

## Runtime Invariants

- one app runtime only
- one canonical data seam only
- one canonical deployment path only: Vercel via Nitro
- one temporary local bypass path only while Supabase email auth is intentionally paused
- no framework migration from TanStack Start
- preview shells remain honest about not being wired to future capabilities
