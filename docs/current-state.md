# Project State Snapshot

## Status

Active

## Last Updated

2026-07-19

## Where We Are Now

- July source-of-truth checkpoint:
  manual workout creation, persisted edit, and preview/readback now share one workout-document
  grammar; child-first repeat groups are treated as containers for ordered ordinary sections; saved
  calendar Move now has immediate optimistic readback plus clearer Undo; Today/workout-detail shell
  chrome and mobile `Current Plan` actions have been tightened around Hito DS primitives; and local
  inspector/screen tooling remains local-only prompt metadata tooling, not backend/Admin persistence.
- The compiler-style generated-plan rebuild is accepted and closed:
  AI/local fixture authors the dated plan, backend compiles it into canonical workout documents,
  signed review/confirm persists the reviewed plan without another AI call, and calendar, detail,
  manual readback, and evidence comparison use the new kernels. Final source and browser proof
  accepted backend-shaped reviewed workout documents, authored outcome provenance, semantic
  identity rejection, ordered Repeat `run` roundtrip, uncapped notes/cues, and review-to-saved
  parity. The accepted post-confirm product rule makes every confirmed non-rest workout on today or
  a future date editable through the same reviewed lifecycle regardless of source, logs, completion,
  or evidence; past workouts remain non-editable. Runtime reconciliation is still open: current
  backend capability/reconstruction/RPC guards and workout-detail gating implement the older
  future-unlogged subset, and full pre-edit planned truth is not yet retained for evidence-attached
  history. Paid OpenAI
  end-to-end and completed evidence-attached browser proof remain separate release/ops debt.
- The changelog/hub gap exposed a process failure, so history is now split:
  [changelog](./history/changelog.md) owns curated public highlights, while
  [technical log](./history/technical-log.md) owns the complete internal accepted-slice ledger.
  The technical log now also mirrors the older public changelog history back to project start so
  previous entries remain reachable after the split. Backlog-only compiler planning remains out of
  shipped highlights except as narrative context in the product-history digest and technical-log
  process history.

- The email-auth flow is now aligned with SSR-safe Supabase passwordless callbacks:
  link requests now ask Supabase for PKCE-oriented handling,
  `/api/auth/confirm` can now accept either an auth `code` or a `token_hash` callback,
  and the remaining live dependency is correct Supabase dashboard URL/template configuration instead of a mixed implicit-vs-SSR code path.
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
- The first local admin test-account backend contract is implemented:
  a server-action-ready local/dev-only seam can list local bypass tester/admin entries from `.tanstack/hito-running-local-accounts.json`, return bounded admin view data including local test passwords only after local-runtime plus admin checks, mark protected admin accounts as non-deletable, and delete tester accounts by removing the local entry plus linked Supabase auth user when configured.
- The first local admin Test accounts UI slice is implemented:
  `/admin/analytics` now renders the local-only backend view with account username, email, password, role, display name, local/linked identity status, protected/deletable status, bounded unavailable/empty states, and exact-email confirmation before tester deletion.
- The Phase 1 admin analytics backend loader is implemented:
  `src/lib/admin-analytics.ts` exposes a server-action-ready view model over existing Supabase auth/profile/plan/workout/Garmin/AI/entitlement truth, with aggregate overview/funnel/feedback/AI counts plus real-user rows shaped on the server and no new telemetry, failure, issue, or production user-management tables; local, admin, metadata-marked test, `@local.test`, and disposable-prefix accounts are classified out of real-user product analytics and returned as excluded ops rows.
- The Phase 1 admin analytics UI is implemented:
  `/admin/analytics` now renders Overview, Funnel & Usage, Feedback, AI & Entitlements, Users, and Test accounts tabs from backend-shaped view models, keeping the page standalone from the runner AppShell and avoiding client-side analytics authority beyond presentation formatting; the Users table shows only backend-classified real users, while Test accounts shows local/test/admin/suspected rows with contained horizontal tables, collapsed search, active-filter summaries, and DS-owned sortable/non-sortable header sort/filter states.
- The first admin capture backlog route is implemented:
  `/admin/capture` is an admin-only standalone workbench surface that renders backend-shaped capture items with status tabs, compact search/filter controls, inline detail, triage controls, quick-note creation/deletion, note append, archive-by-status, and deterministic prompt copy for manual Codex handoff. The active backend contract owns RLS-enabled `admin_capture_items` as the canonical text/metadata backlog truth; the unused `admin_capture_assets` table is retired by migration and the private `admin-capture-assets` bucket was removed through the Supabase Storage API, normal publishable access remains blocked, screenshot upload/live UI editing/route-spanning capture overlay remain future slices without a dormant server capability, and no item is automatically sent to Codex.
- Backend Slice 7 for admin Backlog work-item consolidation is implemented:
  `npm run import-admin-backlog-work-items` can dry-run or explicitly upsert markdown work items from the approved repo folders into `admin_capture_items` using deterministic source-path/source-type metadata. The importer now reads canonical markdown sections for status, type, priority, next recommended role, task, stage, and exact handoff prompt; uses the first `Task` line as the primary Backlog title; maps repo-derived status without using `in_review`; records missing/invalid section metadata for older archive docs; uses exact handoff prompt text when available; reports stale active repo-derived mirrors whose markdown `metadata.source_path` no longer exists; and archives those stale mirrors only through explicit `--archive-stale`. Re-runs update the same imported rows instead of duplicating them, keep archived/closed/completed repo docs out of active/default backlog lanes through mapped status, and do not edit markdown, move docs, call OpenAI, or dispatch Codex. Normal admin backlog mutation seams now reject repo-derived mirror edits with `repo_derived_read_only`, so imported rows can be listed, opened, searched, and copied but not edited outside markdown refresh.
- Admin Backlog read-only metadata now reuses the shared Hito DS `HitoMetadataTag` primitive:
  repo-derived/backend-owned tags render as static read-only tags with source-truth tooltips,
  quick-note editable controls opt into explicit interactive metadata tags, route-local
  `ReadOnlyMetadataTag` is gone, and the visible workflow tabs are simplified to `Active`, `Done`,
  and `Archived`.
- The Vercel production build finalizer and admin capture backlog availability recovery checkpoint is
  passed:
  `npm run build` and `npx vercel build --yes` complete without the former staged Nitro
  `server-output` failure, Vercel-mode artifacts are present under `.vercel/output`, a newer
  production deployment inspected as `Ready`, admin capture live/local validators return `ok: true`,
  the retired legacy asset table/bucket remain absent, publishable read/write remains blocked, and
  browser proof shows authenticated `/admin/capture` loads without `Capture load failed`, `Backlog
unavailable`, or an auth loop.
- The dedicated owner admin login flow is implemented:
  `/admin/login` renders a standalone `Hito Admin` sign-in page that posts username plus password to `/api/admin/auth/login`, sanitizes admin-only `next` targets back to `/admin/analytics` when unsafe, uses the local protected fixture only on loopback local runtimes, uses server-only deployed password-hash/session-secret configuration outside local fixtures, rejects tester/product credentials with bounded admin-specific copy, and issues signed admin-only `hito_admin_session` access for admin surfaces instead of creating a product/local runner session; `/api/admin/auth/logout` clears admin session truth while `/login`, `/api/auth/local-login`, and runner/product logout stay separate; `/admin/analytics` admin-required states now link to this admin login path.
- The local/dev admin fixture is now a single protected owner admin account in `.tanstack/hito-running-local-accounts.json`; the legacy QA admin fixture has been removed from the local bypass file and linked auth user, while tester accounts remain separate and are still rejected by `/admin/login`.
- The public Hito destination hub is implemented:
  `/hub` renders a standalone desert-background launcher with the Hito logo and full-card links to Hito Running, Admin analytics, Design system, and Changelog; the launcher itself is public and does not own any destination auth behavior.
- The first full DS coverage rollout slice is implemented:
  `/changelog` keeps its public editorial timeline design and behavior, but its date typography, title-adjacent text highlight/backdrop treatment, timeline entry cards, glow dots, and inline code chips now use canonical Hito DS classes documented in `/hitoDS#editorial-patterns`.
- The shared interaction wrapper DS rollout slice is implemented:
  Radix/shadcn-derived dialog, sheet, dropdown menu, and select wrappers now default to Hito DS chrome while preserving existing exports, semantics, keyboard behavior, and product call sites; unused generic progress/card/sidebar wrapper residue was later retired once product surfaces moved to Hito DS CSS primitives.
- The progress visualization chrome DS rollout slice is implemented:
  `/progress` keeps the same loader data, aggregate calculations, weekly-volume geometry, and recent-consistency geometry, but its chart section dividers, compact notes, planned/actual fills, and result-status fills now use Hito DS classes documented in `/hitoDS#analytics`.
- The internal workbench responsive shell is implemented:
  `/hitoDS` and `/admin/analytics` now share Hito DS workbench shell, sidebar, sticky topbar, current-location, quick-link rail, and summary-grid classes so desktop keeps the left navigation while tablet/mobile switch to contained top navigation without page-level table or rail overflow.
- The Hito DS calendar/workout playground is implemented:
  `/hitoDS#calendar-workout-playground` provides static desktop month-cell, mobile workout-row, and
  dense month-grid specimens across planned workout/rest, empty, outside-month, outside-plan,
  result, evidence, identity, and title-overflow states. Manual workout states such as add, edit,
  copied source, paste target, repeats, protected, and fixed rest are visual specimens only and do
  not implement CRUD, recurrence, production route wiring, backend mutations, persistence,
  generation, row-count, or schedule-semantics changes; shipped manual and active-plan editing lives
  in the product calendar plus backend review/confirm seams. The accepted shared visual seam is
  `HitoCalendarDayCell` / `HitoWorkoutDayRow`: product `Calendar.tsx` maps real
  backend-shaped snapshot/workout truth into display props and keeps product links, tooltips, and
  feedback routing, while `/hitoDS` maps local controls/specimen state into the same presentational
  components.
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
- The unauthenticated root flow is now login-first, and first-time onboarding offers Manual setup plus Quick setup; Quick setup uses the `previewRunningPlanDraft` / `confirmRunningPlanDraft` review-before-create seam, with JSON import visibly demoted to advanced file-based import.
- The product-path recovery fix is now implemented:
  authenticated no-plan or no-workout states now show the same visible manual / structured / selected-plan creation surface, with advanced import kept secondary below it.
- The onboarding post-submit transition fix is now implemented:
  successful plan creation now automatically opens a fresh saved-mode home request instead of leaving users stuck in the setup pending state.
- The structured first-plan onboarding frontend slice is now implemented:
  the normal no-plan setup surface collects the runner facts and distance goal, then calls `previewRunningPlanDraft`; the review action stays disabled until required answers are complete, and only explicit confirmation calls `confirmRunningPlanDraft`.
- The old Plan Preset card/discovery product path is retired from current runtime truth. Quick setup
  now exposes goal shortcuts for 10K, Half Marathon, Marathon, and Custom distance as convenience
  inputs into the same backend-owned distance-goal generated-plan preview/create path. Backend
  validation, normalization, review token/checksum, and confirm/persist semantics own the generated
  plan; deterministic Plan Preset programs, Marathon Base fallback truth, and backend Plan Preset
  discovery/review/confirm actions are removed. The 2026-07-06 browser/readback QA accepted 10K,
  21.1K, 42.195K, and Custom 15K creation through saved calendar and workout detail with
  AI-authored progression, exact selected-distance endpoints, child-first repeats, no fake pace/HR,
  no legacy repeat truth, and disposable cleanup to zero.
- Active-plan schedule actions and workout-content editing have separate contracts:
  saved calendars now use backend-shaped capability metadata and
  `active_plan_user_edit_v1` audit metadata for eligible today-or-future Add plus row-state Clear
  and direct Move actions across accepted active-plan sources, while preserving the original plan
  `source_kind` as provenance. For content editing, today/future confirmed non-rest workouts are
  universally available regardless of source, completion, logs, or evidence; past workouts are
  not. The reviewed server mutation, stale checks, provenance, and durable history remain mandatory.
  Current policy/capability/edit/RPC/frontend code has not yet been reconciled to that broader rule. Manual
  Copy/Paste remains a direct backend-owned mutation in the proved manual path; universal
  Copy/Paste, recurrence, Restore UI, and active-plan replacement semantics expansion remain
  future-only.
- AI-authored first-plan creation is now plan-first:
  `src/lib/ai-first-plan-draft-service.ts` and `npm run author-ai-first-plan-draft` can run the non-mutating `hito_ai_authored_full_plan_draft` path in mock, invalid, timeout, or live modes. Success returns bounded `ai_authored` canonical `training-plan-v2` output with `source_kind: ai_authored_plan_first_v1`; invalid, unsafe, unavailable, or timed-out output fails before review and persists nothing.
- The plan-first compiler is the current backend boundary:
  `src/lib/ai-authored-plan-first-provider-contract.ts` and
  `src/lib/ai-authored-plan-first-compiler.ts` now share one compact closed grammar: a flat non-rest
  workout list plus one exact endpoint, canonical identities and segment types, structural-only
  Repeat parents with ordered children, bounded prescriptions, exact min/km pace, profile-backed HR
  references, effort, and execution cues. The compiler preserves those fields without semantic
  fallback, rejects malformed transport or structurally invalid values before review, and does not
  accept plan-level provider narrative, duplicate goal presentation, or partial horizons. Replaced
  specimen/weekly/internal generated-plan variants are not rollback paths.
- Plan-first observability remains bounded:
  the non-mutating draft metadata and `npm run author-ai-first-plan-draft` report input source, fixture, model/timeout/token settings, provider phase, source status, row/workout/repeat/endpoint counts, and safe sample rows without raw prompts, secrets, full AI payloads, Supabase mutation, or product persistence.
- Saved-mode marathon-specific representation is now polished:
  `marathon_steady_specificity` keeps its canonical backend identity and steady calendar icon key, but calendar month cells display `Marathon` and workout detail displays `Marathon steady` with durability/long color treatment so the workout reads as controlled marathon-specific durability rather than generic steady filler or hard tempo/race-pace work.
- The reference-style half-marathon import richness gap is closed at the backend mapping layer:
  compact-only legacy rows without explicit rich fields now infer stronger tempo, distance/time interval, race-rhythm, taper tune-up, hill, progression, and stride identities from bounded title and segment semantics before falling back to generic quality. A disposable import of `/Users/ivan/Downloads/ivan_half_marathon_training_plan_v2_full_2026-05-05.json` validated in about 21ms, applied in about 1.6s, and persisted tempo, distance-interval, race-pace, taper tune-up, recovery, long, easy, and rest identity variety with rich fields and segment detail.
- Structured first-plan confirmation now persists exact reviewed plan truth:
  `confirmRunningPlanDraft` verifies the signed reviewed-plan token, blocks if an active plan already exists, validates fixed rest days without rewriting, and persists the reviewed canonical `training-plan-v2` calendar rows without calling OpenAI or regenerating.
- The first active-plan schedule edit preview backend contract is implemented:
  `src/lib/active-plan-schedule-edit-preview.ts` validates proposed fixed rest days, running-day count, optional explicit running weekdays, and preferred long-run day through shared training-preference rules, then returns a non-mutating `schedule_reflow` preview for same-frequency date moves or `requires_regeneration` for weekly frequency changes; protected past/today, logged, Garmin/evidence-backed, comparison-backed, and AI-insight-backed workouts stay out of proposed moves, and no OpenAI call, profile/default update, or plan mutation occurs in preview.
- Active-plan schedule reflow apply Slice 2B is implemented:
  `applyActivePlanScheduleReflowPreview` consumes the reviewed `previewToken` plus original schedule input, reloads active-plan/workout/log/evidence truth, rejects stale/protected/regeneration-required cases, and persists only reviewed future non-rest date/weekday/week/display metadata plus active-plan `plan_preferences` through one transaction-backed Supabase RPC; failed or stale applies leave workout dates and plan preferences unchanged, while runner-level `training_preferences`, workout content, rich fields, steps, metric targets, source ids, goal context, and evidence-backed rows remain unchanged.
- Active-plan schedule edit UI is implemented under the current one-calendar IA:
  the calendar overflow exposes `Edit schedule`, prefills from active-plan `plan_preferences` when
  available, reuses Hito weekday/running-day controls, calls the backend preview, renders
  `schedule_reflow` review details, and applies only with the reviewed preview token without
  changing runner Settings defaults.
- The structured review-before-create backend slice is now implemented:
  `previewRunningPlanDraft` produces a non-mutating canonical review without creating plan or workout rows, while `confirmRunningPlanDraft` verifies the reviewed draft and creates the first active plan only after explicit confirmation.
- The temporary local saved-mode path now persists `completed`, `partial`, and `skipped` workout outcomes truthfully through the workout logging UI, including overwrite from an existing completed result.
- Home/calendar now resolve `today` from the real runtime local date and default the planning surface to that day instead of a frozen demo date.
- The saved-mode home/calendar page now keeps the main `Today` hierarchy intact as a lighter open header, uses one divided support module on the right, removes the lower metadata strip, and marks day status with compact check/dash/cross symbols instead of bulky per-day pills.
- The first deterministic Garmin comparison slice is now implemented:
  saved-mode workout detail can now upload one Garmin `.fit` file or one `.zip` archive containing exactly one FIT activity file, the backend stores the original asset plus normalized actual metrics through Supabase, and that same backend seam now also persists a conservative deterministic planned-vs-actual comparison that the dedicated workout-detail `Feedback` surface reads back directly; AI analysis, screenshot OCR, provider sync, and calendar evidence markers remain later slices.
- The planned-duration truth-alignment fix for deterministic Garmin comparison is now implemented:
  comparison duration now resolves through the same canonical planned-duration helper used by workout detail, so visible planned duration and comparison planned duration no longer drift apart on distance-backed interval workouts.
- The richer deterministic Garmin comparison payload slice is now implemented:
  the backend now persists explicit comparison signals, `missing_actual` and `not_applicable` reasons, honest delta/tolerance metadata, session-summary facts, and step-summary data when ordered per-step duration comparison is trustworthy; the saved-mode workout-detail `Feedback` surface now reads that richer structured comparison truth back without adding AI interpretation.
- The first richer-comparison track implementation slice is now implemented:
  deterministic comparison payloads now also persist a support matrix plus segment-group summary, so warm-up/main/cooldown-style duration grouping is available only when ordered step comparison is trustworthy, while pace and heart-rate remain explicitly unsupported rather than inferred.
- The first richer-comparison frontend readback slice is now implemented:
  workout-detail `Feedback` now shows a compact `What this review checked` support readback plus warm-up/main/cooldown-style `Workout structure` grouping when the deterministic payload includes trustworthy segment summaries, while pace and heart rate stay quiet unsupported facts rather than implied comparisons.
- The bounded Garmin AI interpretation slice is now implemented:
  saved-mode workout detail now persists one `workout_ai_insights` row linked to the latest deterministic comparison, generated only from planned workout truth, normalized Garmin actual metrics, deterministic comparison payload, current week context, next-workout summary, and optional workout-scoped body-note context; the dedicated `Feedback` surface now reads that bounded AI interpretation back separately from the deterministic facts.
- The first Basic/Pro entitlement backend foundation slice is now implemented:
  additive `runner_entitlements` and `runner_capability_usage` tables exist for backend-owned tier and metered usage truth, missing entitlement rows resolve to effective `Pro`, `garmin_ai_interpretation` remains the only current Pro-only capability key, and retired plan-update/voice capability keys are not current product truth.
  Garmin upload/parse/deterministic comparison remain available when only AI interpretation is locked.
  The linked Supabase project has now received the entitlement migration, and local generated database types are aligned with that linked schema.
- Dictate-to-Plan / voice-to-plan is retired from current product truth:
  the old `DictateToPlanPanel` UI residue, `src/lib/voice-to-plan-authoring.ts`,
  `generateVoiceToPlanDraft`, `confirmVoiceToPlanDraft`, and the `voice_to_plan` entitlement
  capability are removed. The no-plan surface currently shows Manual setup and Quick setup with
  structured review plus selected distance-goal review/create. Do not treat transcript-based plan
  creation as shipped unless a future Product/Backend/Frontend gate rebuilds it and QA accepts it.
- The no-plan onboarding frontend ownership has been refactored without changing product behavior:
  `OnboardingGate` now orchestrates state and server actions while focused onboarding modules own the
  structured constructor UI, selected distance-goal review, manual setup, and shared constructor form
  model.
- The first-plan simplification and server-boundary cleanup slice is now implemented:
  the unused `completeStructuredOnboarding` action and unused `training-api.ts` apply re-export are removed, duplicated first-plan weekday/goal/duration/pace helpers now live in `src/lib/first-plan-authoring-utils.ts`, and Garmin feedback readback no longer imports the Node-only FIT/ZIP ingest module from the shared training API path.
- The active-plan export facade narrowing slice is now implemented:
  active-plan export action ownership lives in `src/lib/active-plan-export-actions.ts`, the export
  API route imports that canonical owner directly, and `training-api.ts` no longer keeps
  `exportActivePlan` / `exportActivePlanForUser` compatibility re-exports.
- Historical only: the former Plan Preset card facade narrowing slice was superseded by the
  pre-customer generated-plan legacy purge. Current Quick setup goal cards are distance shortcuts,
  not backend Plan Preset discovery programs.
- The auth callback exchange facade narrowing slice is now implemented:
  `/api/auth/confirm` imports `exchangeCodeForSession` directly from `src/lib/auth-actions.ts`, and
  `training-api.ts` no longer keeps the auth callback exchange compatibility re-export.
- The former plan-management type-contract facade narrowing slice is implemented:
  plan-management schedule-edit components import reflow contract types directly from
  `src/lib/active-plan-schedule-edit-preview.ts`, while `training-api.ts` keeps only the live
  schedule-edit runtime server-function wrappers.
- The bundled type-only `training-api.ts` facade narrowing slice is now implemented:
  settings, structured first-plan, selected running-plan, first-plan confirm, selected-plan confirm
  input, and active-plan lifecycle result types now import from canonical owner modules or no longer
  need `training-api.ts` compatibility re-exports. Later source proof removed the remaining manual
  authoring runtime compatibility re-exports from `training-api.ts`: direct manual
  Add/Create/Templates, Copy/Paste, Move, Delete/Clear, persisted-edit, and Review server functions
  now import from `src/lib/manual-workout-authoring/*`; `training-api.ts` no longer owns manual
  authoring runtime wrappers.
- The previous `PlanManagementDialog` decomposition work remains useful implementation history:
  export, import, lifecycle, text replacement, and summary/header UI were isolated into
  `src/components/plan-management/*`; current runner-facing IA should expose only `Add plan` plus
  overflow utilities (`Export JSON`, `Edit schedule`, `Clear upcoming schedule`) and should not
  teach `Open plan`, visible `Update plan`, or `Delete active plan` as current product concepts.
- The first `CompletionPanel` decomposition slice is now implemented:
  the workout-scoped body-note summary and modal editor UI now live in `src/components/workout-completion/BodyNotesEditor.tsx`, while the parent panel still owns completion form state, workout-log payload construction, `saveWorkoutLog`, route invalidation, Garmin upload/remove, and feedback/readback orchestration.
- The `CompletionPanel` post-save reconciliation fix is now implemented:
  after a successful completed, partial, or skipped workout-log save, the panel reconciles its local form and dirty baseline from the saved payload before refreshing route data, so Safari no longer depends on a completed route invalidation to leave `Saving result` or clear stale `Unsaved changes`.
- The second `CompletionPanel` decomposition slice is now implemented:
  the deterministic plan-vs-run comparison readback UI now lives in `src/components/workout-completion/WorkoutComparisonReadback.tsx`, while the parent panel still owns Garmin upload/remove mutation state, file input handling, route invalidation, manual save logic, body-note integration, and AI insight rendering.
- The third `CompletionPanel` decomposition slice is now implemented:
  the bounded AI insight readback UI now lives in `src/components/workout-completion/WorkoutAiInsightReadback.tsx`, while the parent panel still owns `WorkoutFeedbackPanel`, feedback data selection, Garmin upload/remove mutation state, file input handling, route invalidation, manual save logic, and body-note integration.
- The `/changelog` utility-route extraction slice is now implemented:
  markdown parsing, date/month/year grouping, source-derived count and last-updated helpers, highlight classification, and milestone title derivation now live in `src/lib/changelog-utils.ts`, while `src/routes/changelog.tsx` keeps the public route shell, tabs, timeline rendering, and inline markdown rendering.
- The first Hito DS foundations cleanup slice is now implemented:
  `src/styles.css` now defines a small raw color primitive layer underneath the existing semantic product tokens, exposes compact spacing primitives through CSS and Tailwind aliases, and `/hitoDS#foundations` documents color through Semantic Colors and Primitive tabs, with semantic token/recipe copy actions, primitive hex-copy swatches, alpha/gradient recipes kept in semantic context, typography families, semantic tone rules, workout-color boundaries, and spacing rhythm before any runner-facing screen migration.
- The workout color-token DS contract is now implemented:
  workout colors are Hito DS tokens and shared helpers rather than route-local hex values; accepted workout roles and section roles are documented on `/hitoDS`, while Repeat set stays structural-only with no standalone semantic color token.
- Manual constructor timeline adoption and target controls are now accepted:
  Review add consumes backend-owned `constructorContract.timeline`, renders structural Repeat set groups
  with ordered children, removes old reconstructed review bullets/`Editable HR guide` copy from the
  accepted UI proof, and supports per-segment No target, runner-entered pace exact/range,
  runner-entered HR bpm cap/range, and runner-entered RPE `0-10`. Backend unified block
  compatibility is accepted across manual review, persisted `planned_workouts.steps`, active-plan
  export, `training-plan-v2` parse/import, and provider comparison input. Default/age-estimated HR
  as personal truth, fake personal zones, generated manual pace, power, cadence, grade/elevation,
  route, and terrain targets still remain unsupported. Generated/AI repeat children are
  backend-validator-passed and the 2026-06-28 workout-slice visual/runtime QA proof passed over the
  relocated non-iCloud cache runtime. The accepted child-first reducer now covers planned-workout
  language, training readback, import/export, rich-workout executable checks, and provider
  comparison. Backend `plan_goal_intent_v1` and frontend guided selected-plan readback are now
  accepted: Quick setup can carry preset/custom goal distance, finish time, outcome pace, race day,
  and distinct finish-time-derived pace as backend-shaped goal/review truth. Backend flat repeat
  compatibility retirement is accepted: old segment-level `work_*` / `recovery_*` fields now reject
  and canonical output emits ordered `children[]`. FRONTEND child-first repeat consumer migration is
  also accepted. The 2026-06-28 Product-authorized BACKEND purge removed the remaining persisted
  pair-shaped repeat data from Supabase project `dltfjwexyctmihclcjqj`; post-delete readback found
  `0` legacy repeat rows. `planned_workouts.steps`, import/export, provider comparison input, manual
  reconstruction, and the runtime seed fixture now use ordered repeat `children[]`, and
  `repeat_unit` / `recovery_unit` plus persisted repeat sibling `work` / `recovery` compatibility are
  retired. Generated-plan richness over accepted `planGoalIntent` and child-first blocks is now
  accepted at backend, Running Coach, and source/CLI/artifact QA layers: fresh 2026-06-28 scenario
  and coach-review artifacts under the historical 2026-06-09 folders scanned `644` JSON files and
  found `0` repeat-unit, parent-repeat-target, missing-children, nested-repeat, fake-pace,
  fake-personal-HR, exact hill/elevation, or planGoalIntent executable-policy violations. Quick
  setup browser/readback proof is now accepted for the OpenAI/local-fixture authored dated
  generated-plan path: 10K, 21.1K, 42.195K, and Custom 15K all preview/create saved plans with
  child-first repeats and AI-authored progression. Generated plans persist canonical
  `distance_goal` truth with exact `distance_meters`, and no card/family label becomes plan truth.
  Generated-plan create-and-use browser proof is also accepted through first
  generated non-rest workout logging, child-first repeat-rich workout detail, one completed
  `workout_logs` row tied to the same planned workout id, desktop/mobile clean console, and
  disposable cleanup to zero. The 2026-07-07 workout-document readback polish and Hito inline
  editable text pattern are also accepted: generated preview/detail surfaces now use compact
  structure-strip/row readback and demote proof/debug language; passive readback remains
  non-inline-editable, while confirmed workouts on today or a future date enter a separate reviewed
  edit action regardless of origin. The manual constructor title uses shared inline editable text, `/hitoDS/patterns`
  documents read-only and local inspector task-target examples, and change-task targeting remains
  non-mutating local devtool behavior in v1.
  Garmin/FIT provider upload/comparison remains a separate later QA gate.
- The second Hito DS foundations cleanup slice is now implemented:
  workout-detail route chrome now uses existing Hito surface, row-group, hairline, tab-badge, micro-label, body-small, and technical-mono primitives instead of local radial/linear gradients, white-alpha borders, bespoke radius values, and tiny text recipes in `src/routes/workout.$date.tsx` and the Garmin upload/interval controls in `CompletionPanel`.
- The third Hito DS foundations cleanup slice is now started with a bounded calendar surface migration:
  `src/components/Calendar.tsx` now uses canonical Hito micro-label, body-small, technical-mono, metric-label, tab, and button primitives for month headers, week-strip metadata, workout type tags, tooltip metadata, compact metric readbacks, and view controls instead of local tiny text, tracking, mono, and button-spacing recipes.
- The Shell/AppShell DS foundations cleanup slice is now implemented:
  `src/components/AppShell.tsx` now uses canonical Hito menu text, menu metadata, technical-mono, button, and a small `hito-shell-avatar-fallback` primitive for profile trigger, dropdown label, top-bar date, shell CTAs, and avatar fallback styling instead of local text sizes, tracking overrides, mono helpers, and gradient avatar recipes.
- The Auth/Login DS foundations cleanup slice is now implemented:
  `src/components/AuthEntryScreen.tsx` and `src/routes/login.tsx` now use canonical Hito micro-label, tab, surface, body, modal-title, and button primitives for the login/signup tabs, email heading, already-signed-in state, and primary CTA; the auth hero keeps its existing layout while the signal dot glow now maps through the Hito signal token instead of a hard-coded rgba shadow.
- The Settings DS foundations cleanup slice is now implemented:
  `src/routes/settings.tsx` keeps the same loader, save, validation, and avatar upload behavior while the large profile avatar/fallback now uses `hito-profile-avatar` and `hito-profile-avatar-fallback` instead of route-local arbitrary radius and gradient fallback styling.
- The Hito primary sans font swap is now implemented:
  `src/styles.css` loads Poppins through the canonical Hito font import and maps `--font-sans` to Poppins, while `/hitoDS#foundations` names Poppins for body, label, control, navigation, and feedback roles without changing typography sizes, line heights, spacing, Fraunces display roles, or JetBrains Mono technical roles.
- The Hito selection-control DS slice is now implemented:
  `src/styles.css` owns checkbox, radio, and toggle-radio recipes for `sm` and `md` controls, `/hitoDS#selection-controls` documents default, selected, disabled, invalid, and destructive-confirmation examples, and the saved-mode plan/import confirmation checkboxes now use signal-selected Hito styling without changing their existing gating behavior.
- The active-plan lifecycle action extraction and G7B helper-export narrowing slices are now
  implemented:
  `src/lib/active-plan-lifecycle-actions.ts` owns Clear Upcoming Schedule behavior and the internal
  archive operation it requires, while `training-api.ts` binds the sole live top-level
  `clearUpcomingSchedule` server-action wrapper to the existing persisted snapshot loader.
- The active-plan lifecycle auth integration fix is now implemented:
  `clearUpcomingSchedule` resolves the current persisted user through the same request-auth seam as other working saved-mode mutations before delegating to `active-plan-lifecycle-actions.ts`.
- The user-settings action extraction and G7A import-map narrowing slices are now implemented:
  `src/lib/user-settings-actions.ts` owns `/settings` route data, bounded profile readback, profile-settings save behavior, `saveUserSettings`, and `UserSettingsSummary`; `training-api.ts` still binds the existing snapshot/viewer loaders for the public `getSettingsRouteData` route wrapper, while the settings route imports the save action directly from `user-settings-actions.ts`.
- The runner training-preferences backend storage slice is now implemented:
  the linked Supabase project and local database type now include `runner_profiles.training_preferences jsonb`; `user-settings-actions.ts` validates and persists bounded `blocked_days`, `preferred_long_run_day`, and `max_running_days_per_week` values without changing existing personal-data saves, and structured first-plan confirmation now stores the same stable weekly defaults alongside age, weight, and height.
- The runner training-preferences shared contract slice is now implemented:
  `src/lib/runner-training-preferences.ts` owns one pure Settings/structured-setup mapping between product-facing `fixedRestDays`, `defaultRunningDaysPerWeek`, and `preferredLongRunDay` and stored `blocked_days`, `max_running_days_per_week`, and `preferred_long_run_day`; zero fixed rest days is valid, seven fixed rest days is rejected, default running days must fit available weekdays, and an explicitly preferred long-run day cannot be blocked. Plan-first provider context does not synthesize a long-run preference when the runner omitted it.
  The same module exposes backend-compatible fitness-level mapping where only `custom` plus a direct recent 5K time in the accepted range creates numeric 5K benchmark truth; non-custom levels remain non-numeric context so they cannot create fake pace or heart-rate targets.
- The runner training-preferences frontend slice is now implemented:
  `/settings` uses Hito tabs to separate `Personal data` from `Training preferences`, reuses the structured-onboarding editable value chip for age/height/weight, shows backend-shaped default estimated heart-rate starting ranges when profile age supports them, and uses the shared progressive training-preference controls for explicit no/fixed rest days, required default running-days/week, optional preferred long-run day, and bounded fitness-level/custom-5K entry. The backend settings contract now also persists optional personal HR ranges and resolves them over estimated defaults; exposing those range editors in Settings remains a frontend follow-up. No-plan Quick setup pre-fills profile basics plus saved training preferences and keeps those values editable before review/confirm.
- The structured setup review modal slice is now implemented:
  Quick setup’s `Review setup` action remains non-mutating; `draft_ready` opens a `Review your setup` modal with explicit cancel/close and `Yes, create plan` controls, while `correction_required` stays inline near the form and never creates profile, plan, workout, or log rows.
- The workout-log save action extraction slice is now implemented:
  `src/lib/workout-log-actions.ts` owns manual workout-result validation and persistence for completed, partial, skipped, and workout-scoped body-note payloads, while `training-api.ts` keeps the same public `saveWorkoutLog` server-action wrapper used by `CompletionPanel`.
- The auth/login action extraction slice is now implemented:
  `src/lib/auth-actions.ts` owns login route data shaping, Magic Link validation/request behavior, auth callback exchange, and local-vs-public auth availability helpers, while `training-api.ts` keeps the same public `getLoginRouteData` and `requestMagicLink` wrappers for current callers; `/api/auth/confirm` now imports the auth callback exchange owner directly.
- The route-data loader extraction slice is now implemented:
  `src/lib/route-data-actions.ts` owns home, shell, workout-detail, and progress route data shaping behind injected snapshot/viewer/feedback loaders, while `training-api.ts` keeps the same public `getHomeRouteData`, `getShellRouteData`, `getWorkoutRouteData`, and `getProgressRouteData` server-function wrappers.
- The plan-replacement action extraction and saved-mode import-map narrowing slices are now
  implemented:
  `src/lib/plan-replacement-actions.ts` owns advanced JSON/imported-plan replacement and delegates
  canonical compile/apply persistence to `active-plan-persistence`; `UploadJsonDialog` imports
  `completeOnboarding` from that owner directly. The no-caller text replacement action and its
  deterministic authoring helpers have been retired.
- The old backend voice-to-plan review-assumption follow-up is historical only:
  that transcript-specific draft/confirm seam was retired with the non-visible voice-to-plan backend
  cleanup. Current visible setup uses structured/OpenAI-authored plan creation and backend-shaped
  review, not transcript-specific runner-understanding readback.
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
- The first saved-mode plan-management backend slice is now implemented:
  the JSON import apply seam accepts a `requestedStartDate` that becomes the effective schedule authority for saved-mode import.
- The first saved-mode plan-management frontend slice is now implemented:
  Current one-calendar IA does not expose an `Open plan` hub or `Delete active plan`; active-plan
  creation starts from `Add plan`, while safe utilities live in the adjacent overflow.
- The saved-mode `Clear upcoming schedule` backend lifecycle slice is now implemented:
  a canonical action archives the current active plan out of the active schedule from today forward, keeps planned-workout rows and workout logs preserved as archived history, and leaves the runner in no-plan/setup-ready state so later-starting imports or generated plans do not inherit stale future workouts.
- The saved-mode `Clear upcoming schedule` frontend slice is implemented as an overflow utility:
  the action remains confirmed, preserves history, and can support later-starting JSON import before
  applying the new backend-owned plan start.
- The first saved-mode plan-export backend slice is now implemented:
  one canonical active-plan export payload is derived from the active `plan_cycle` plus saved
  `planned_workouts`, JSON export projects that payload into `training-plan-v2` using the current
  applied dates and rich workout fields, and Markdown export uses the same payload for a concise
  runner-readable artifact with backend-owned workout focus; current visible export is the calendar
  overflow `Export JSON` utility and PDF remains later.
- The saved-mode plan-export frontend slice is implemented:
  the calendar overflow exposes `Export JSON` for active plans through backend-owned file save
  behavior and hides export when no active plan exists; Markdown/PDF/watch/share remain out of
  current header IA until accepted separately.
- The Safari export-download bugfix is implemented:
  active-plan export no longer depends on a client-side blob/objectURL download helper, so JSON
  starts through the authenticated attachment route while still using backend-owned filename,
  content type, and body truth.
- The body-notes and user-settings persistence repair is now implemented:
  the linked Supabase project now has `workout_logs.body_notes`, bounded settings/avatar columns on `runner_profiles`, and the `profile-avatars` bucket; `/settings` and shell viewer profile reads now resolve through the same persisted-user mapping used by saved mode instead of the raw local bypass id.
- The first frontend follow-up for body notes is now implemented:
  `Log result` no longer resyncs empty saved state over a newly added body-note draft, so `Add body note` now keeps the workout-scoped form open and the required fields remain available for entry.
- The first workout-scoped body-note modal slice is now implemented:
  `Log result` no longer carries the heavy inline body-note editor in the main page flow, a compact summary row now opens one modal editor for bounded body-note entries, and the modal keeps the existing saved schema of area, timing, sensation, severity, and optional note.
- The Safari body-note modal layout fix is now implemented:
  the workout-scoped body-note modal now uses the same stable bounded-height product-dialog pattern
  as other workflow dialogs, so Safari keeps the panel in-viewport, scrolls the body region
  internally, and leaves `Cancel` plus `Save body notes` reachable without page-behind scrolling.
- The Safari stable-dialog overlay cleanup is now implemented:
  the same stable dialog pair now also forces closed overlays non-blocking, so saving or cancelling the workout-scoped body-note modal no longer leaves a dimmed pointer-blocking layer over the workout page.
- The bounded modal consolidation slice is now implemented:
  `UploadJsonDialog` now uses the same stable product-dialog recipe as other saved-mode workflow
  dialogs, the shared CSS now owns the canonical three-row panel and internal scroll region, and
  `/hitoDS` documents the live modal anatomy without introducing a broad modal wrapper.
- The body-note AI context slice is now implemented:
  saved workout-scoped body notes now feed the existing bounded Garmin recommendation seam as optional caution context only, while deterministic comparison remains primary and the prompt explicitly forbids diagnosis, medical advice, injury certainty, treatment instructions, or silent plan mutation.
- The workout AI-output hygiene fix is now implemented:
  the backend now rejects malformed runner-facing AI text such as dangling fragments, ampersand continuations, replacement glyphs, or non-English character artifacts, and persists stable deterministic fallback sentences instead while preserving body-note caution and severity softening behavior.
- The first Hito design-system toast slice is now implemented:
  `/hitoDS` now documents and exercises the reusable info, working, success, and error toast
  primitive; working toasts use dismiss-only indeterminate progress with Safari-stable visible state,
  keep the dismiss action inside the toast anatomy, and can resolve in place to success or error,
  while reviewed plan actions consume one shared action-family toast id and keep source buttons plus
  inline review/stale feedback intact.
- The first Hito typography canonicalization slice is now implemented:
  shared CSS roles now cover display, page, modal, section, panel, body, body-small, helper, caption,
  label, form-label, button, nav/menu, metric, status, error/success, and technical mono text;
  `/hitoDS` now documents those roles as the canonical reference, and the first high-drift surfaces
  (saved-mode plan-management/import, workout `Log result`/`Feedback`, and `User settings`) use
  those roles for headings, form labels, helper/body copy, status feedback, and fixed-format
  metadata.
- The shared dialog typography contract is now fixed:
  Radix-backed `DialogTitle` and `DialogDescription` no longer force generic shadcn typography
  defaults over product classes, so saved-mode plan-management/import and the workout body-note modal
  resolve their title/description rhythm from canonical Hito roles.
- The Hito icon-system normalization slice is now implemented:
  Hito now owns one Tabler-backed `Icon` primitive with stable product names, four canonical sizes, and documented `/hitoDS#icons` usage examples; product-level surfaces consume that layer, and the raw SVG icon folders have been removed.
- The first `/hitoDS` card-reduction slice is now implemented:
  the Overview, Typography, and Icons reference sections use open rhythm, divider-led rows, quiet support notes, and one shared usage/demo surface where useful instead of nested bordered card grids; live product component behavior is unchanged.
- The first modal anatomy helper slice is now implemented:
  shared Hito modal classes now name content-fit and scroll-fill body modes, header, footer,
  footer-note, and footer-action anatomy; `/hitoDS#modals` documents short content-fit and tall
  scroll-fill examples separately so short modals no longer imply a dead zone above the footer,
  while saved-mode plan-management/import and `Body notes` keep their stable product behavior
  through the same named helpers.
- The first `/hitoDS` inputs normalization slice is now implemented:
  Hito fields now expose primary and secondary variants, demo-able default/hover/active/disabled/read-only states, reusable error/success feedback shell states, canonical icon padding, and matching XS input/button height plus radius rhythm; `/hitoDS#inputs` uses an interactive builder like Buttons while product form behavior remains compatible with existing `hito-field` usage.
- The Hito button variant semantics fix is now implemented:
  secondary buttons are now soft, borderless tinted support actions, while outlined buttons remain the border-led neutral-emphasis variant; `/hitoDS#buttons` shows the variant contrast directly.
- The first semantic button tone slice is now implemented:
  Hito buttons now compose default, success, and error tones with primary, secondary, outlined, and
  ghost hierarchy classes; destructive product actions in onboarding and JSON import use the
  canonical error tone instead of local red override classes, and AppShell’s repeated tiny uppercase
  chrome labels use the shared `hito-micro-label` role.
- The first weekday rest-day invariant backend slice is now implemented:
  saved-mode JSON import/apply now resolves blocked weekday truth from active plan preferences before imported metadata, rejects chosen starts on blocked weekdays, and maps incoming non-rest workouts in sequence across allowed weekdays instead of blindly replaying every source date offset.
- The saved-mode calendar-cell semantics correction is now implemented:
  month cells restore one broad-family workout-type glyph, one short type label, restrained type color, and a quiet feedback/evidence corner marker while keeping distance, duration, targets, and dashboard-style metric stacks out of month cells.
- The Calendar viewport/mobile layout fix is now implemented:
  desktop month cells keep their seven-column grid, hover/focus tooltips now clamp to the visible viewport instead of overflowing near screen edges, and narrow month view renders as a vertical day list preserving workout links, glyphs, status, today/completed treatment, and feedback markers.
- The workout-type glyph semantics slice is now implemented:
  month cells and the shared workout glyph renderer now prefer backend-owned `plannedWorkoutLanguage`, `calendarIconKey`, and `workoutFamily` truth before legacy compact fallback; primary runner-facing labels stay within Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills, and Run/Walk, while exact identities such as cutback, threshold, trail, race, or source/template keys remain secondary/internal compatibility truth.
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
  `/body` is now retired from the product,
  older `/body` links redirect quietly to `/`,
  and body-note ownership remains workout-scoped inside `Log result` instead of living as a second standalone surface.
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
  persisted plan truth now preserves `schema_version`, `source_kind`, `target_date`, goal metadata, plan preferences, source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority through the same canonical Supabase rows used by JSON import and AI/local-fixture plan-first authoring.
  New writes now persist canonical target keys only, while legacy target aliases remain read-compatible for older rows instead of being written again.
- The first post-Phase-3 correction pass is now implemented:
  richer `training-plan-v2` normalization now accepts the live fuller segment DSL used by the richer reference files, workout-detail target shaping no longer leaks opaque structured metadata into `[object Object]`, and richer imported interval workouts no longer collapse into misleading visible easy-run identity.
- The workout segment instruction-completeness contract is now implemented:
  imported, generated, preview, and persisted readback preserve authored target and guidance text; generated-plan pace is AI-authored numeric min/km truth, while authored HR references resolve to snapshot BPM from the runner's effective saved-or-estimated profile and preserve that source through export/readback.
- Plan-first provider context now carries only exact goal intent, explicit runner facts, availability,
  and fixed rest days. Backend-derived archetypes, baseline load, horizon, density, progression, and
  structured-onboarding coaching conversion are removed; current validators exercise the canonical
  provider fixture, compiler, review, import/export, WorkoutDocument, and persistence owners.
- The original direct structured plan-authoring backend action surface is superseded for visible onboarding:
  current no-plan generated-plan callers use `previewRunningPlanDraft` followed by `confirmRunningPlanDraft`; the backend validates bounded explicit profile facts, benchmark, target time/date, exact distance, availability, and rest-day inputs before review and persists only the confirmed `ai_authored_plan_first_v1` draft.
- The Phase 4 frontend cleanup slice has been superseded by the structured first-plan constructor:
  visible no-plan and shell surfaces present structured plan creation as the primary product path, while JSON remains available only as a demoted advanced import for existing Hito plan files, migration, and testing.
- The first Hito design-system implementation slices are now implemented:
  shared low-card CSS primitives exist for core surfaces, tiered buttons, tiered inputs, textareas, helper/error text, tabs, labels, captions, dividers, grouped rows, metric rows, compact summary metrics, compact chart legends, compact chart notes, comparison-bar chrome, compact tooltip shells, compact severity scales, compact severity summaries, compact status pills, compact status markers, shell navigation rows, shell profile triggers, shell dropdown rows, disclosure, and setup/empty/error state surfaces; auth, structured onboarding, advanced import, shell chrome, home/calendar support surfaces, workout-detail grouped/status/metric surfaces, route-level state surfaces, progress summary surfaces, body severity micro-UI, preserved integration utility rows, calendar and workout-structure tooltip chrome, and deeper workout-structure plus completion-log micro-surfaces now use those primitives; `/hitoDS` provides an internal simplified product-language reference with dedicated design-system navigation instead of runner-facing shell chrome; and chart heights/widths, plotted lines, interval block widths, SVG silhouettes, and marker coordinates are documented as intentional visualization geometry exceptions.
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

The Hito Stack Simplification core cleanup track is complete. The current cleanup stream is now the
separate Hito Docs and Artifact Compression track: reduce documentation/history noise, preserve
product evolution in a compact digest, and define safe local artifact retention before any evidence
or logs are deleted.

The current cleanup checkpoint is after accepted G23 business-process short-path cleanup:

- `cleanup-burndown-v1` is the active sequencing ledger: `40/40` gates are complete, `0` remain, and
  the cleanup track is `100%` complete after G23.
- G20 removed the untracked duplicate-space manual-workout backlog markdown copy while preserving
  the canonical tracked backlog item and admin importer contract.
- G21 completed the final codebase size and dead-code teardown sweep, measured the current text
  baseline, rechecked business-flow uniqueness, and found no safe backend/runtime or
  frontend/browser-sensitive deletion batch to select by momentum.
- G22 folded in current-state/dashboard sync, reran the business-process short-path audit, and
  selected the final bounded backend ownership cleanup instead of broad runtime/frontend deletion.
- G23 shortened no-active-plan onboarding ownership: first-plan and selected-plan runtime actions now
  import directly from their canonical action modules instead of through `training-api.ts`, while
  manual empty-plan creation and unrelated route-facing wrappers remain on the facade.
- The Hito Stack Simplification Strike is archived as completed cleanup history after G23; future
  docs compression, artifact retention, or roadmap review work should use separately named tracks.
- The active docs/artifact compression plan owns that follow-up track. It now separates
  docs-size-reduction, Admin metadata-quality hygiene, and local artifact retention. Docs
  compression has removed large historical Markdown surfaces, while QA artifact retention has
  advanced through accepted policy, manifest-safe quarantine, and QA-passed manual-workout image
  compression. The track is currently holding after E13/E14 until a fresh dry-run manifest and
  targeted estimate prove one material same-owner candidate with one risk class and one validation
  story.
- The G21 counted text baseline is `624` files / `261277` lines overall, with `src` at `299` files /
  `119629` lines, `scripts` at `51` files / `34066` lines, and `docs` at `196` files /
  `88955` lines.
- The active compression plan and product-history digest remain the sources for detailed D-track
  line deltas, QA artifact policy, quarantine manifests, and apply/rollback boundaries.
- Generated/protected roots remain outside product-code size claims. `logs`, `test-results`,
  `qa-artifacts/`, and `.local-artifact-archive/` must be handled only through the accepted
  artifact-retention policy and manifest-backed tooling, never by cleanup momentum.
- G22/G23 source-of-truth sync regenerated the work dashboard through the safe no-admin dashboard
  command. Runtime behavior changes, frontend rewrites, Supabase, OpenAI, Admin apply, artifact
  deletion, and browser QA were out of scope for the docs/devtools sync portion.

## Next Recommended Steps

1. Keep the Hito Docs and Artifact Compression plan in holding until a fresh manifest/estimate
   proves one material same-owner candidate with one risk class and one validation story.
2. Keep the archived Hito Stack Simplification Strike as completed cleanup evidence; do not reopen it
   unless source proof shows a missed closeout issue.
3. Use backlog-only follow-ups for additional Plan Preset families, preset-based active-plan
   replacement, recurrence, Restore UI, universal Copy/Paste, QR/share/import, and broader
   persisted workout editing beyond the proved manual scope.
4. Keep future UI changes inside shared Hito primitives or documented geometry exceptions, and use
   `/hitoDS` as the inspection surface before shipping new visual patterns.

## Canonical References

- `docs/context.md`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/glossary.md`
- `docs/plans/archive/2026-05-05-full-baseline-import-and-stabilization-plan.md`
- relevant product briefs and frontend specs
