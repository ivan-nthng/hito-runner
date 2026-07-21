# Changelog

Curated public highlights for completed implementation history.

For the complete internal accepted-slice ledger, use
[technical log](./technical-log.md). The public changelog should stay readable: it summarizes durable
product, DS, reliability, and operations wins instead of listing every implementation or QA slice.

## Highlight naming policy

The public `/changelog` Highlights view is generated from the dated entries below. Use stable product-category language so repeated infrastructure work does not crowd out runner-facing changes:

- `Run Creation Engine` for plan-authoring doctrine, workout diversity, metric-target rules, terrain logic, and coaching-quality corrections.
- `Plan Refresh Safety` for proposal/apply, reviewed-draft, stale-proposal, protected-history, and explicit-confirm behavior.
- `Calendar & Workout Identity` for visible workout labels, glyphs, calendar semantics, and compact workout identity rendering.
- `Hito DS Iteration` for design-system refinements after the initial foundation. Do not call every DS pass "new"; version-like DS labels are docs-only and should wait for a real release bundle.
- `Admin & Ops` for admin login, analytics, test-account management, and internal operational surfaces.
- `QA / Reliability` for fixture matrices, high-risk proof passes, browser-policy hardening, and regression coverage.

## 2026-07-21

- Run Creation Engine: unified first-time and returning runner baseline plus heart-rate setup.
  Runners can accept clearly estimated BPM ranges or save edited personal ranges before plan
  creation; the AI may use accepted BPM or effort as one workout command, and later Settings changes
  affect future plans without rewriting already confirmed workouts.

## 2026-07-13

- Calendar & Workout Identity: improved saved-calendar workout actions around direct Move and
  future-row editing. Calendar move now projects source/target changes immediately, shows a clearer
  `Moving` state, restores a ghost-style Undo after accepted direct move, and keeps Add/Copy/Paste
  reachable; eligible future reconstructable workouts now open the shared edit constructor through
  backend-shaped editability instead of a manual-source-only frontend gate.
- Hito DS Iteration: tightened Hito DS reuse across recent product surfaces. Today/workout-detail
  hero chrome now shares the compact workout-detail rhythm, mobile `Current Plan` actions live in
  the bottom navigation with a full-height sheet while desktop keeps the dropdown, local inspector
  controls use shared select/menu/button primitives, choice-toggle naming now uses the `card`
  display variant, and `/hitoDS` gained stricter DS-first control/typography guidance.

## 2026-07-12

- Calendar & Workout Identity: accepted the shared workout-document editor/readback grammar across
  manual create, persisted edit, and preview/readback. The constructor now uses one compact section
  language for standalone sections and child-first repeat groups, supports arbitrary ordered repeat
  children in the accepted contract, keeps generated/read-only previews on the same document grammar,
  and preserves backend review/confirm truth instead of creating separate create/edit UI systems.
- QA / Reliability: completed a behind-the-scenes source-size and proof-infrastructure cleanup wave
  without changing product truth. Manual-workout proof helpers, disposable persistence proof setup,
  calendar manual-action orchestration, workout-document notes/readback helpers, and local devtool
  screen-prompt metadata flow were consolidated around canonical owners; validation kept manual
  authoring, calendar, readback, build, and disposable cleanup paths green.

## 2026-07-11

- Hito DS Iteration: corrected the manual workout editor direction toward the compact Hito workout
  document anatomy instead of a generic form-builder. The accepted editor uses compact section rows,
  `Visible label`, smaller target/duration controls, centered Add Section affordances, shared
  header input behavior, and the same readback grammar for create/edit/preview states.
- Hito DS Iteration: shipped the product-wide light-theme correction pass. Light mode now uses warm
  Hito semantic token mappings and DS-backed component recipes rather than a dimmed dark UI, while
  dark mode remained preserved.

## 2026-07-07

- Run Creation Engine: polished generated-plan workout readback for first real users. Generated
  preview/detail now use compact workout-document rows with structure strips, semantic stripes, child
  rows, and quiet notes/cues instead of foregrounded proof/debug labels; generated rows remain
  read-only, manual editable heading is limited to true editable constructor context, and QA proved
  desktop/mobile readback, impossible-state zero persistence, completion entry, clean console, and
  disposable cleanup.
- Hito DS Iteration: promoted inline editable text into shared Hito primitives. Manual workout titles
  now use the shared inline editable primitive, `/hitoDS/patterns` documents editable, read-only, and
  non-mutating local inspector task-target states, and generated workout readback remains read-only
  without fake Admin Capture persistence.

## 2026-07-06

- Run Creation Engine: accepted the unified distance-goal generated-plan flow for first real-user
  design readiness. Quick setup now creates and reads back 10K, 21.1K, 42.195K, and Custom 15K
  generated plans through one AI/local-fixture-authored dated draft, backend validation/review,
  explicit confirm, and persisted calendar path. QA proved W1-W4 conservative adaptation,
  selected-distance endpoint exactness, child-first repeats, no fake executable pace or personal HR,
  no legacy repeat-unit truth, impossible/aggressive typed outcomes, manual-authoring smoke, and
  disposable cleanup to zero.

## 2026-06-27

- Run Creation Engine: accepted manual per-segment target inputs and unified planned-workout block
  compatibility. Manual constructor targets now support No target, runner-entered pace exact/range,
  HR bpm cap/range, and RPE `0-10` with backend source semantics; Repeat set remains structural-only,
  built-in templates do not seed pace/HR, JSON import/export and provider-comparison inputs preserve
  the accepted block/target truth, and provider comparison still avoids pace/HR/RPE without
  normalized actual evidence.

## 2026-06-20

- QA / Reliability: completed one behind-the-scenes maintenance closeout across the core Hito
  Stack Simplification track and the first docs-compression wave. The cleanup ledger closed at
  `40/40`, removed legacy duplicate/orphan code and old ops residue, shortened onboarding and plan
  action ownership to canonical owners, and started the product-history digest plus archived-plan
  compression work. This entry does not represent runner-facing plan behavior changes, Supabase
  schema changes, OpenAI behavior changes, QA artifact deletion, or log deletion.

## 2026-06-18

- Refined the shared calendar-day chrome so historical `Rest` and other calm non-active day states
  no longer inherit signal-accent selection treatment, while true active states such as today,
  workout selection, focus, and action targets keep the stronger shared calendar highlight grammar.

## 2026-06-15

- Shipped lifecycle-driven workout detail for runner-facing saved mode: future planned workouts now
  show planned readback plus `Plan actions` instead of fake result/feedback tabs, today's planned
  workout leads with completion action, past unlogged workouts stay actionable without pretending
  completed state, completed manual-result and evidence-backed workouts expose real `Result` /
  `Feedback` surfaces only when that truth exists, and rest days stay intentionally sparse. QA
  proved all major lifecycle states plus safe invalid `?tab=feedback` fallback on disposable
  persisted fixtures.

## 2026-06-13
- Simplified direct manual calendar editing for saved manual plans: manual Copy/Paste and direct
  Move now mutate through one backend-owned manual edit seam instead of runner-facing `Review
  paste` / `Review move` confirmation, while backend still re-resolves source/target truth, blocks
  protected or occupied days, preserves original plan source metadata, and appends
  `active_plan_user_edit_v1` audit history. QA proved persisted copy/paste and direct-move
  behavior on disposable manual fixtures without shipping universal Copy/Paste, generated-plan
  direct move, recurrence, workout-content editing, or Restore UI.

## 2026-06-12

- Added the saved manual-plan workout constructor UI contract: eligible `Add activity` days now
  expose `Start from scratch`, `Choose template`, and `Add rest day`; scratch opens as an empty
  backend-reviewed constructor with disabled review until supportable, repeat/loop group editing is
  visible, and template-picked workouts open the same editable constructor before reaching
  `draft_ready`. Browser QA proved no silent client rows, segments, or persistence truth before
  confirm, mobile `375px` no-overflow, and disposable cleanup; explicit persisted Rest day
  review/confirm remains a separate gate.
- Unified active-plan calendar editing for Add/Clear/Move in the proved scope: saved calendars now
  use backend-shaped editability/capability metadata instead of separate manual-vs-generated
  calendar products, so accepted active-plan sources can expose eligible future Add, Clear, and Move
  actions while preserving the original plan source and recording `active_plan_user_edit_v1` audit
  metadata. QA proved non-manual saved-plan mutation behavior plus the manual Clear rerun after the
  reconstruction-normalization fix, including browser/DB readback and cleanup, without shipping
  universal Copy/Paste, recurrence, workout-content editing, Restore UI, active-plan replacement
  expansion, or broader generated-row mutation matrices.
- Improved generated selected-plan quality in the rebuilt running-plan engine: backend-owned
  scenario, canonical review, confirm exactness, `training-plan-v2`, and imported/export-shaped
  artifacts now enforce the universal runner-facing richness bar and device-friendly prescription
  grammar across 10K, Half Marathon, Marathon Base, and Marathon Completion. QA and Running Coach
  acceptance proved zero unresolved ranges, unresolved executable segments, richness issues,
  prescription grammar issues, awkward standard durations, vague effort-only targets, fake pace,
  fake personal HR, and forbidden runner-facing language while preserving Marathon Base as base-only
  and Marathon Completion as exact `42195m` completion-focused output; this does not claim a new
  browser UI exposure or production rollout.
- Added manual Delete/Clear for existing manual active-plan calendars: runners can clear an eligible
  planned workout through backend-shaped review and confirmation, the saved calendar refreshes from
  persisted truth, the cleared day returns to `Add activity` instead of fake Rest, the active plan
  remains active, and row/non-rest counts update. Browser and DB QA proved desktop pointer behavior,
  workout-card navigation preservation, mobile `375px` no-overflow, cleanup, and no fake pace or
  personal HR without shipping Restore/Put back/Redo undo UI, export, move, edit, recurrence, or
  modal polish.
- Added JSON/Markdown export for persisted manual active plans through the existing Open plan export
  menu: exported `training-plan-v2` JSON preserves manual source metadata, safe export ids,
  canonical workout rows, structure-only metric truth, and omits deleted rows, internal DB/auth ids,
  provider tokens, fake pace, and fake personal HR. Browser/download/DB QA proved real JSON and
  Markdown downloads, mobile `375px` no-overflow, source-boundary readback from persisted
  active-plan truth, and cleanup without shipping QR codes, public share links, import from export,
  PDF, watch export, or mobile deep-link behavior.
- Added manual Move Workout for existing manual active-plan calendars: runners can move an eligible
  planned workout to another empty day through backend-reviewed confirmation, the same persisted
  `planned_workouts` row is moved, the source day returns to `Add activity`, and the target day
  keeps the workout title, identity, structure, and metric truth. Browser and DB QA proved menu and
  drag/drop-to-review paths, mobile `375px` no-overflow, cleanup, and no fake pace or personal HR
  without shipping recurrence, edit workout, Restore UI, QR/share/import, or active-plan
  replacement.

## 2026-06-11

- Extended manual user-built plans beyond the first workout: saved `manual_user_built_plan_v1`
  calendars now show the existing compact `Add` action on eligible future empty days, review the
  new workout through backend-owned manual authoring, and persist the added workout through the
  accepted active-plan add seam without client-sent rows, segments, or persistence metadata. Focused
  browser and DB QA proved the selected `Sun, Jun 14` date stayed consistent across the calendar,
  Add menu, constructor, final confirmation, persisted readback, cleanup, and `375px` mobile layout.
- Cleaned up runner-facing workout target display grammar: saved calendar and workout structure
  surfaces now show bounded durations such as `46 min` and `9 min 24 sec` instead of raw floats or
  decimal-prime shorthand, hide internal `Structure-only executable target` labels, and preserve
  concrete structure-only prescriptions without fake pace or fake personal HR. Browser QA proved the
  saved-plan fixture, workout detail, interval readback, mobile no-overflow, and disposable cleanup.
- Added manual saved-template reuse to the manual builder: reviewed manual workouts can be saved
  with a runner-provided display name and icon, reappear under `My saved templates` in the existing
  template picker, and reconstruct backend-reviewed drafts before first create or before adding to
  an existing manual active plan. Browser and DB QA proved `manual_saved_workout_template_v1`
  metadata, existing-plan Add reuse, two-workout readback after Add, strict `structure_only` target
  truth, mobile no-overflow, and disposable cleanup without adding copy/paste, recurrence, JSON
  export, move-workout behavior, or frontend-owned template rows.
- Added manual Copy/Paste for existing manual active-plan calendars: runners can copy a manual
  workout day, paste it onto an eligible future empty day, review backend-shaped source/target
  dates, structure, and metric policy, then persist through the accepted backend copy/paste seam.
  Browser and DB QA proved desktop hover/click, mobile `375px` no-overflow, two-workout readback,
  cleanup, and no raw row duplication without adding export, move, recurrence, delete/clear, or
  final modal design polish.

## 2026-06-10

- Added the first manual user-built plan creation path: no-active-plan runners can choose
  `Build my plan myself`, create and review an `Easy aerobic run`, then persist a
  `manual_user_built_plan_v1` active plan through backend review token/checksum confirmation and
  the existing active-plan persistence seam. Disposable browser QA proved the create-click flow,
  exact one-row readback, strict structure-only metric truth, mobile no-overflow, and cleanup.
- Accepted the selected running-plan Create path for the rebuilt plan engine: `10K`, `Half Marathon`,
  and `Marathon Base` previews now expose a reviewed `Create plan` action backed by server-side
  review token/checksum validation, backend preview rebuild, canonical `training-plan-v2`
  persistence through the existing active-plan seam, and built-server browser QA that created and
  cleaned up a disposable Marathon Base active plan without client-sent rows, OpenAI generation, or
  fake metric truth.

## 2026-06-09

- Simplified the `/hitoDS` route/specimen ownership without changing behavior: `/hitoDS` remains
  the shell, navigation, hash, and registry owner while large reference-anatomy and specimen-preview
  content moved into focused Hito DS modules; QA proved `/hitoDS`,
  `/hitoDS#calendar-workout-playground`, and `/hitoDS#workout-library-playground` direct loads,
  deep links, zero console warnings on a safe local production server, workout-library identity
  counts, provider/mobile overflow handling, source boundaries, targeted lint, and build.
- Deleted the obsolete product-failed Plan Preset algorithmic review expansion path and old harness
  sources while preserving backend-owned card discovery and the accepted selected-plan preview
  builders; QA proved no old review-draft builder, review-token, persistence-metadata, composition,
  or algorithmic-quality-gate imports remain, current Plan Preset cards and running-plan preview
  builders stay intact, validators pass, and production build remains green.

## 2026-06-07

- Shipped Plan Presets for no-active-plan creation: runners can start from backend-owned
  `10K Foundation`, `Half Marathon Balanced`, or `Marathon Base` cards with backend-shaped
  eligibility, duration, start/end dates, workout mix, metric honesty, and fit summaries, review the
  non-mutating draft, then create an exact canonical active plan through the existing persistence
  seam. Final QA proved the browser setup -> card -> review -> confirm -> saved-plan flow, exact
  half-marathon row persistence, mobile no-overflow, Advanced custom separation, and cleanup of
  scoped QA records.

## 2026-06-06

- Cleaned up executable workout target readback so workout detail, Today/calendar summaries,
  interval visualization, first-plan review copy, and plan export foreground backend-shaped
  executable segment anatomy while keeping cues, focus, RPE, purpose/source copy, legacy
  effort-only modes, and age-estimated/default HR visibly separate from executable target truth;
  source/helper/build QA passed, with authenticated saved-mode browser smoke left as a small
  non-blocking fixture gap.

## 2026-06-05

- Hardened generated workout target truth for structured plan authoring: new generated non-rest
  workouts now resolve through explicit executable modes, `structure_only_executable` requires
  numeric duration/distance/repeat/recovery anatomy, pace targets require execution support plus
  validated pace truth instead of target time alone, executable HR targets require personal HR-zone
  truth, and age-estimated HR remains advisory/readback-only; frontend readback cleanup remains the
  next slice for removing vague visible copy where executable target data exists.
- Accepted the shared Hito DS calendar/workout day component seam: product `Calendar.tsx` and
  `/hitoDS#calendar-workout-playground` now both render through presentational
  `HitoCalendarDayCell` / `HitoWorkoutDayRow` display props, with product links, tooltips, feedback
  routing, backend schedule truth, and manual workout mutations kept outside the shared component;
  final QA proved icon-only occupied-day actions, compact empty-day add state, aligned result
  markers, no `375px` overflow, and no fake manual action props leaking from the product calendar.

## 2026-06-04

- Added exact review/confirm proof for the internal non-default `ai-first-plan-envelope-v1` draft
  option: envelope draft creation remains non-mutating until explicit confirm, disposable confirm
  persists `ai_first_plan_envelope_v1` rows that exactly match the reviewed expanded plan, duplicate
  confirm is blocked, invalid/timeout/partial envelope failures are not confirmable, raw prompts and
  full payloads are not persisted, and production structured onboarding still defaults to
  `ai-first-plan-blueprint-v1` with no runner-facing envelope selector.
- Fixed first-plan calendar pre-start rendering so dates before a plan start display as muted
  outside-plan cells instead of rest/workout placeholders, with no rest labels, glyphs, status
  markers, feedback markers, tooltips, or workout links before the start date; mobile now collapses
  the pre-start range into a quiet `Before plan starts` row while in-plan rest and workout days keep
  normal schedule semantics.

## 2026-06-03

- Added the admin debug/capture capability probe behind canonical admin access: `AdminAccessContext`
  now exposes `adminDebugCapture`, the bounded server-function probe is whitelisted for TanStack
  server-function eligibility, signed admin sessions can prove capability for future overlay work,
  and signed-out, tester, product-route, invalid-cookie, expired-cookie, and `user_metadata`-only
  admin-looking claims are rejected without exposing session ids, user ids, cookies, JWTs, secrets,
  service keys, or raw Supabase objects.
- Hardened stale repo-derived Backlog mirror cleanup: `npm run import-admin-backlog-work-items` now
  reports stale active repo mirrors and only archives them through explicit `--archive-stale`, bounded
  to repo-derived rows with valid source metadata from approved markdown roots, while quick notes,
  captured UI rows, current repo-derived work, live validators, and active Backlog loading remain
  intact.
- Improved the active-plan schedule edit first release through final QA: `Open plan` exposes
  `Edit schedule`, same-running-count changes use reviewed backend `schedule_reflow` apply,
  frequency changes return `requires_regeneration`, only reviewed future workout dates and active-plan
  schedule preferences mutate, fixed-rest/protected-history/content invariants are preserved, and
  the mobile schedule edit layout no longer overflows at 375px.

## 2026-06-01

- Fixed and proved the Vercel Nitro output finalizer plus admin backlog recovery path: `npm run build`
  and `npx vercel build --yes` now pass without the missing `.nitro/vite/server-output` failure,
  Vercel output artifacts are present, a newer production deployment inspected as `Ready`, admin
  capture live/local validators returned `ok: true`, and browser proof showed `/admin/capture`
  loads for an authenticated admin without `Capture load failed`, `Backlog unavailable`, or an auth
  loop.
- Retired the unused admin capture screenshot storage seam: `/admin/capture` now treats `admin_capture_items` as the only current backlog storage truth, removes runtime joins/view-model fields for `admin_capture_assets`, adds a migration to drop the empty asset table, removes the empty private bucket through the Supabase Storage API, and updates the validation script to guard against the legacy asset path returning.
- Updated `/admin/capture` repo-derived metadata tags to reuse the shared Hito DS
  `HitoMetadataTag` primitive: markdown-owned status/type/priority/role tags now render as
  read-only source-truth metadata with shared tooltip behavior, quick-note controls opt into
  explicit interactive mode, route-local `ReadOnlyMetadataTag` is gone, simplified `Active` /
  `Done` / `Archived` tabs remain, and desktop/mobile Backlog filtering/open/detail/copy behavior
  stays intact.
- Improved production first-plan generation by closing the `ai-first-plan-blueprint-v1` reliability
  wave: bounded partial/timeout handling, long-horizon target-date review, date-control persistence,
  29-week review/confirm/save exactness, review title source cleanup, recovery-first post-long-run
  sequencing, phase-aware extension richness, beginner run/walk adaptation, beginner/recreational
  cadence, and supported half/marathon specificity all passed QA while production still stays on the
  blueprint contract and `ai-first-plan-envelope-v1` remains non-production.
- Added supported half-marathon and marathon goal-specific specificity to first-plan generation:
  supported half plans can progress through progression, controlled tempo, threshold durability, and
  race-pace only when metric support exists; supported marathon plans use marathon steady
  specificity, supported controlled tempo, and steady-finish long runs as appropriate; one
  moderate/specific stimulus per week remains the cap, steady remains support-only, and unsupported
  aggressive specificity is repaired or rejected.

## 2026-05-31

- Added a backend-owned beginner/recreational intensity cadence ladder for first-plan generation:
  support evidence, adaptation state, caution flags, running days, durability, and spacing now choose
  `none`, `every_two_weeks`, or `weekly` moderate work, target-time alone does not unlock aggressive
  intensity, true new runners remain run/walk-first, steady stays support rather than a quality
  trigger, and no two-quality weeks are introduced.

## 2026-05-30

- Improved first-plan coaching richness for long-horizon and beginner plans: low-support marathon
  backend extension now uses phase-aware safe archetypes instead of a visibly mechanical tail, true
  beginner or weak-support no-benchmark plans get early run/walk segment bodies in easy/recovery/
  cutback/long-run slots, and safety caps preserve fixed rest days, preferred long-run placement,
  metric gates, recovery-first sequencing, and bounded invalid/timeout/partial failure paths.
- Fixed post-long-run sequencing for low-support long-run-heavy first plans: marathon, ultra, and
  mountain running plans now identify the next actual running workout after a long run by sequence,
  repair AI blueprint violations during normalization, reject remaining violations as
  `post_long_run_recovery_first_violation`, align envelope expansion to the same policy, and keep
  the next running slot recovery/easy instead of defaulting to steady or quality work.
- Updated structured first-plan date/time controls and submit safety: onboarding now uses shared
  Hito DS `HitoDateField`, `HitoEditableDateChip`, and `HitoMaskedTimeField` primitives, `/hitoDS`
  documents the same date/time inputs, the review action wraps sync input building in safe
  try/catch/timeout handling, and valid long-horizon setup reaches draft review without mutating
  profile, plan, workout, or log rows before confirm.
- Fixed first-plan review title source-of-truth so the review modal derives runner-facing display
  titles from structured setup state instead of raw AI/generated plan names; long-horizon marathon
  target-time review now shows `Marathon 3:50 Target Plan` and no longer exposes misleading
  `16-Week`, `Opening Blueprint`, or `Base and Build Plan for New Runner` wording, without changing
  backend generation or persisted plan names.

## 2026-05-29

- Added bounded long-horizon `ai-first-plan-blueprint-v1` authoring for target-date structured first
  plans: OpenAI authors only the safe opening window, backend extends remaining weeks from validated
  setup truth, final review opens only after full-horizon slot/rest/long-run validation, trace
  metadata exposes requested/AI-authored/backend-extended week counts, and invalid, timeout, or
  partial responses remain non-mutating with deterministic fallback disabled.
- Fixed structured first-plan date persistence and exact long-horizon browser proof: controlled
  plan-start and target-date fields now submit `schedule.startDate` and `schedule.targetDate`, the
  2026-05-29 to 2026-12-11 marathon setup opened review as a 29-week / 203-row blueprint-backed
  draft, and confirm/save proved exactly one active plan cycle with 203 persisted rows, 145 non-rest
  rows, no Wednesday/Saturday workout leaks, Sunday long runs preserved, rich fields intact, and zero
  OpenAI calls during confirm.
- Added the non-live `ai-first-plan-envelope-v1` foundation beside the production blueprint path:
  envelope schema/decode/expand/trace support can expand mock envelopes into canonical
  `training-plan-v2` rows for ops comparison, invalid/live-unavailable envelope modes fail bounded,
  production first-plan generation still uses `ai-first-plan-blueprint-v1`, and no envelope draft is
  persisted or runner-facing.

## 2026-05-28

- Canonicalized real repo work items for the admin Backlog: actionable active plans, product briefs, and frontend specs now carry markdown-owned status/type/priority/role/task/stage/prompt metadata, import with human-readable task titles, and keep source paths as metadata instead of primary labels.
- Updated the repo work-item admin Backlog importer to use canonical markdown metadata: explicit `Status`, `Type`, `Priority`, `Next Recommended Role`, `Task`, `Stage`, and `Exact Handoff Prompt` sections now drive mirrored admin fields and copy prompts, older docs report missing/invalid metadata, and repo-derived rows are never imported as `in_review`.
- Added explicit repo work-item import for the admin Backlog: `npm run import-admin-backlog-work-items` now scans approved markdown task/spec/brief/plan folders, mirrors bounded source-path/source-type/status metadata into `admin_capture_items`, preserves manual triage on refresh, skips README policy docs, and keeps markdown canonical without frontend redesign, OpenAI, Codex auto-dispatch, or two-way sync.
- Hardened repo-derived admin Backlog mirrors as read-only server-side truth: imported markdown rows can still be listed, opened, searched, and copied into deterministic role prompts, but status/type/priority/target-role/title/note mutations now return `repo_derived_read_only` so markdown remains canonical.
- Added the first `/admin/capture` backlog UI: admins can open a standalone Hito workbench route, scan status-filtered capture items, use compact search/filters, expand inline details, update triage fields, create quick notes, append notes, archive by status, and copy deterministic manual Codex prompts without screenshot upload, live UI editing, or auto-dispatch.
- Added the first admin capture backlog backend foundation: RLS-enabled `admin_capture_items` and `admin_capture_assets` storage, a private `admin-capture-assets` bucket, admin-only list/detail/create/triage/note seams, and deterministic manual Codex prompt generation without screenshot upload, frontend backlog UI, or auto-dispatch.
- Applied and proved the admin capture backlog migration on the linked Supabase project: the live probe now verifies table/bucket existence, private bucket posture, service-role create/list/read/update, publishable-key RLS blocking, archived-item exclusion, metadata redaction in copied prompts, and disposable proof cleanup.
- Added local/dev structured-onboarding browser-action trace artifacts for AI first-plan review attempts, capturing sanitized request/setup/authoring summaries, effective first-plan model/timeout/token/env source, cadence slots, validation issue codes, normalized identities, and failure layer under ignored `qa-artifacts/debug/...` without prompts, secrets, or raw OpenAI payloads.
- Added a reproducible saved blueprint visual QA proof path: `npm run seed-ai-first-plan-blueprint-proof` now uses an existing disposable tester, calls live `ai-first-plan-blueprint-v1` with deterministic fallback disabled, saves only accepted blueprint truth, verifies persisted `source_kind`, reviewed/persisted row count and end date, rich rows, executable non-rest steps, and `marathon_steady_specificity`, then prints bounded login and cleanup details for browser QA.
- Fixed AI blueprint required cadence placement so supported marathon and goal-family quality slots avoid the day before or after the preferred long run when another viable running day exists; Sunday-long marathon plans now keep Monday easy/recovery and place required marathon specificity on a safer midweek slot.
- Aligned the visible structured onboarding action with the successful blueprint preview seam: first-plan review now uses first-plan-specific blueprint model/timeout defaults (`gpt-4.1-mini`, 240000 ms, 32000 output tokens unless server env overrides them) instead of inheriting the generic text-plan model route and 45s service timeout.

## 2026-05-27

- Polished saved-mode marathon-specific workout representation: `marathon_steady_specificity` now reads as `Marathon` in calendar cells and `Marathon steady` in workout detail, using durability color and the steady glyph without changing backend generation or persisted identity.
- Updated `/settings` Personal data so the avatar Edit/Upload action sits directly under the avatar tile and Heart rate zones now show backend-shaped default estimated starting ranges when profile age supports them, with copy that keeps the ranges clearly non-personalized.
- Reworked the `/hitoDS` foundations color documentation into Semantic Colors and Primitive tabs: semantic cards now copy token/recipe code, primitive swatches copy existing Hito hex values, and alpha/gradient usage stays documented as semantic context instead of becoming a separate generated palette.
- Simplified the `/hitoDS` icon registry preview so each icon renders once at the selected XS/SM/MD/LG documentation size instead of repeating every icon across all sizes.
- Wired the AI-authored blueprint planner into structured first-plan review: `generateStructuredFirstPlanDraft` now attempts `ai-first-plan-blueprint-v1`, exposes bounded source/fallback/repair/debug metadata, signs the reviewed canonical plan, and `confirmStructuredFirstPlanDraft` persists that exact reviewed plan without calling OpenAI or regenerating.
- Fixed structured first-plan confirm/save exactness: reviewed AI blueprint drafts now persist through a first-plan reviewed-draft seam that validates fixed rest days but does not run imported-plan weekday remapping, so reviewed rest rows, trailing calendar days, rich fields, steps, notes, goal context, metric mode, icons, and targets are preserved.
- Proved live AI blueprint onboarding acceptance end-to-end: the blueprint prompt now supplies exact required workout slots, the response schema excludes rest identities and requires the validated weekly running-day count, safe post-cutback long-run rebounds pass validation, and a disposable linked-DB smoke accepted a live `repaired_ai_draft` then confirmed it with exact row persistence and zero OpenAI calls during save.
- Tightened half-marathon target-time AI blueprint quality and reference-plan import richness: supported road target-time plans now enforce week-aware tempo/threshold/interval/race-rhythm cadence when runner support allows it, compact-only imported plans preserve stronger tempo/interval/race/tune-up identity from title and segment semantics, and linked/disposable smokes proved exact saved rows and rich fields while surfacing full-draft latency as the remaining rollout risk.
- Generalized AI first-plan blueprint identity selection into a backend-owned goal-family matrix: beginner/consistency, 5K, 10K, half marathon, marathon, ultra, and mountain/trail plans now validate allowed, expected, long-run, cutback/taper, specialty, and excluded identities with week-aware cadence fixtures instead of accepting generic support-filler calendars.
- Added bounded AI first-plan blueprint trace metadata: draft review and `npm run author-ai-first-plan-draft -- --trace-blueprint` can now show setup summary, required cadence slots, authored blueprint identities before normalization, validation issue codes, repair notes, normalized identities, final identity counts, and fallback boundaries without exposing prompts, secrets, or raw AI payloads.
- Fixed supported balanced half-marathon AI blueprint cadence: balanced half plans now receive moderate Week 2+ cadence slots with progression/tempo/threshold options, reject early generic support filler when runner support allows specificity, and the ops trace prints first-six-week cadence evidence for QA.
- Blocked deterministic first-plan fallback leakage from structured onboarding: `generateStructuredFirstPlanDraft` now returns a non-mutating `ai_first_plan_blueprint_unavailable` retry/failure state for invalid, timed-out, or unavailable blueprint attempts instead of reviewing `structured_authoring_v1`, confirm rejects non-blueprint reviewed drafts, the legacy direct structured create action is blocked behind review/confirm, and a live disposable marathon-balanced proof saved `ai_first_plan_blueprint_v1` rows with zero OpenAI calls during confirm.

## 2026-05-26

- Closed the remaining non-mutating AI first-plan blueprint identity coverage gap before onboarding wiring: 5K sharpening, 10K rhythm, race-pace, taper tune-up, marathon-specific, controlled downhill, hike-run, and mountain time-on-feet identities now expand into dedicated executable segment bodies, and the ops script can print a bounded coach-facing identity-coverage sample without prompts, secrets, raw AI payloads, persistence, or frontend changes.
- Repaired the non-mutating AI first-plan blueprint expander so compact AI-authored workout identities now become identity-aware executable `training-plan-v2` segments for tempo/threshold, intervals, hills, trail, ultra, long-run, cutback/taper, recovery, easy, and steady workouts without wiring onboarding, saving plans, or weakening metric gates.
- Pivoted the non-mutating AI-authored first-plan ops contract from full strict nested drafts to compact weekly coaching blueprints: OpenAI now authors phase/workout intent, backend validates and expands into canonical `training-plan-v2`, strict drafts remain diagnostic-only, and live compact blueprint smoke can return `ai_authored` without saving or wiring onboarding.
- Hardened the non-mutating AI-authored first-plan ops path for live validation: compact smoke runs can now use the existing `OPENAI_PLAN_MODEL` env route with bounded timeout/output controls, complete-horizon validation, and no-AI-HR prompt rules to produce a live `ai_authored` canonical `training-plan-v2` without saving or wiring onboarding.
- Added bounded request diagnostics and a one-week live diagnostic fixture to the AI-authored first-plan ops path, so QA can distinguish strict-schema latency timeouts from successful normalized drafts without exposing prompts, secrets, or raw AI payloads.
- Added the non-mutating AI-authored first-plan draft ops seam: backend can now call the `ai-first-plan-draft-v1` OpenAI contract from structured authoring/onboarding input, normalize only through Hito validation into canonical `training-plan-v2`, and report bounded `ai_authored`/`repaired_ai_draft`/`deterministic_fallback` metadata through `npm run author-ai-first-plan-draft` without changing onboarding or saving anything.
- Added the non-live AI-authored first-plan draft foundation: backend now has an `ai-first-plan-draft-v1` schema, prompt contract, and validator/normalizer that can convert accepted full week-by-week AI drafts into canonical `training-plan-v2` while preserving fixed-rest, rich taxonomy, segment-structure, pace/default-HR, and coaching-safety gates; the visible structured first-plan path still uses the deterministic generator.
- Updated the plan-authoring metric resolver so missing personal HR zones can still produce clearly labelled age-estimated default HR guidance from runner age, while no-age plans remain effort-only and pace gates, fixed rest days, and AI metric normalization stay backend-owned.

## 2026-05-25

- Prefilled `Open plan` schedule editing from active-plan scheduling preferences when available, so fixed rest days, weekly running days, and preferred long-run day reflect saved plan truth before a runner reviews changes.
- Added the `Open plan` schedule edit surface: runners can review fixed rest-day/running-day/long-run changes, see backend-owned date-move proof before mutation, apply same-frequency reflows only by reviewed preview token, and route regeneration-required changes into the existing Update plan review flow without changing Settings defaults.
- Hardened active-plan schedule reflow apply with one transaction-backed Supabase RPC, so reviewed date moves and active-plan schedule preferences commit atomically or not at all while preserving the same preview-token, stale, fixed-rest, and protected-history guards.
- Added token-gated active-plan schedule reflow apply: same-frequency schedule edits now rebuild the current preview server-side from the reviewed `previewToken`, reject stale/regeneration-required/protected-history cases, update only reviewed future non-rest workout date metadata plus active-plan schedule preferences, and preserve workout content, rich fields, metric targets, and runner Settings defaults.
- Added the first active-plan schedule edit preview contract: backend can now validate proposed fixed rest days/running days/long-run day, classify same-frequency edits as non-mutating `schedule_reflow`, route frequency changes to `requires_regeneration`, preserve protected logged/Garmin/evidence-backed history in preview, and return bounded date-change/fixed-rest/rich-field proof without calling OpenAI or mutating the plan.
- Tightened saved structured plan richness end to end: first-plan creation now preserves bounded rich goal context through fixed rest-day insertion, cutback/taper long runs and taper/cutback support days persist as structured multi-segment rows, and conservative low-support marathon plans vary safe recovery/cutback support identities without adding hard days or loosening pace/HR gates.
- Bounded live active-plan refresh proposals so an OpenAI proposal timeout now returns deterministic proposal/draft fallback metadata instead of hanging before `refreshDraft.richWorkoutDraftMetadata` is observable.
- Added proposal-time rich workout drafting to active-plan refresh: refresh proposals now sign the exact reviewed future draft after optional rich normalization, expose bounded rich-draft applied/fallback metadata, and keep apply as a no-OpenAI exact-draft persistence path.
- Moved the text-authoring ops smoke path onto the real TypeScript OpenAI seam: `npm run author-plan-from-text` now defaults to deterministic no-rich-draft output, supports explicit `--rich-draft`, supports dry-run/mock/timeout validation, and reports bounded rich-draft status plus sample rich workout metadata.
- Tightened the Slice 4A rich-draft boundary so `generateCanonicalPlanFromText` remains deterministic by default, saved-mode text replacement explicitly opts into OpenAI rich workout drafting, and Dictate-to-Plan stays deterministic until a dedicated voice rich-drafting slice.
- Added the first OpenAI rich-workout draft seam behind text authoring: after structured intent extraction validates, text authoring can request a bounded rich workout draft, but backend normalization still owns canonical `training-plan-v2` truth, strips unsafe metrics, enforces rest-day and warmup/main/cooldown structure, and falls back detectably to the deterministic generator when the draft is malformed or unavailable.
- Added a disposable saved-mode rich-workout QA fixture: `npm run test-user -- create ... --plan scripts/fixtures/rich-workout-saved-mode-fixture.json` now seeds one local tester with a stored rich Steady/Hills/Trail plan plus one compact fallback row so browser QA can verify calendar/detail readback before OpenAI rich drafting begins.
- Moved workout-detail coaching readback onto rich workout truth: the detail page now shows stored family, exact identity, calendar icon, metric mode, goal context, segment guidance, cues, and hints while removing route-local generic HR, cadence, fueling, and compact-type objective advice.
- Adopted rich workout family/icon truth in the frontend calendar identity path: calendar labels and shared glyphs now prefer stored `calendar_icon_key` and `workout_family`, add Steady/Hills/Trail glyphs, and keep legacy compact/source/title fallback only for older rows.
- Completed rich workout import/export/template roundtrip compatibility: active-plan JSON export now includes rich workout family, exact identity, calendar icon, goal context, metric mode, and `source_workout_type`; re-import preserves those fields, compact-only v2 files still derive fallback truth, Markdown export adds a compact focus line, and the downloadable template now shows the rich contract without fake pace/HR targets.
- Added additive saved-mode persistence for rich workout truth: `planned_workouts` can now store workout family, exact identity, calendar icon key, goal context, and metric mode; new generated/imported saves write those fields, readback prefers them, and refresh/import carry-forward keeps them for fixed or protected workouts while old rows still derive compatibility values.
- Fixed rich workout fallback inference for compact-only saved workouts: old rows like `Controlled tempo session` and `Distance intervals` now derive tempo or interval-specific canonical identities from title/step semantics instead of collapsing to generic quality, and rest days now report non-executable metric-mode semantics.
- Added the first rich canonical workout contract groundwork: backend taxonomy helpers now map legacy workout/source types into canonical family, exact identity, calendar icon, and metric-mode fields; generated `training-plan-v2` workouts emit those additive fields while old compact plan truth remains compatible.
- Preserved generated-plan authoring truth end to end: structured, voice-confirmed, and text-generated plans now store bounded plan-scoped authoring snapshots for refresh, including target-time/date intent, recent 5K benchmark context, execution mode, rest-day/long-run preferences, and metric-policy assumptions, while support runs now get clearer opener/main/finish structure without loosening pace or HR gates.
- Tightened beginner build-consistency doctrine: product `beginner` now maps to backend `new_runner`, and beginner or otherwise low-support build-consistency plans stay in easy/steady/long/cutback identities instead of tempo, interval, or race-like tune-up work.
- Refined the Hito DS workbench responsive shell: `/hitoDS` and `/admin/analytics` now use common DS sidebar, sticky topbar, current-location, quick-link rail, and summary-grid classes so desktop keeps left navigation while tablet/mobile use contained top navigation and tables keep local horizontal scrolling.
- Fixed runner-facing workout identity mapping: richer `sourceWorkoutType` values such as distance/time intervals, 5K/10K repeats, threshold/tempo durability, progression runs, race/tune-up work, and mountain/ultra endurance sessions now resolve through one visible identity so labels and glyphs agree instead of collapsing to generic `Quality`.
- Added deployed-safe dedicated admin login: `/admin/login` now verifies the owner admin through server-only password-hash/session-secret env outside local fixtures, issues an admin-route-only signed cookie, keeps tester/product accounts out of admin access, and preserves local protected-fixture behavior for loopback QA without documenting or bundling plaintext credentials.
- Sharpened deterministic goal-family workout identity: 5K plans can use safe strides or short sharpening reps, 10K plans use rhythm intervals, half marathon plans use threshold durability, marathon plans use controlled steady specificity and familiar fueling/time-on-feet cues, and ultra plans stay durability-oriented without road-race sharpening.
- Added mountain/trail doctrine v2 to deterministic plan authoring and refresh drafts: mountain contexts now include technical trail caution, controlled descents/downhill durability, hike-run or power-hike allowance, mountain long-run time-on-feet cues, and taper terrain-stress reduction without exact elevation prescriptions.
- Added long-distance honesty assumptions across structured setup, Dictate-to-Plan, text authoring instructions, and active-plan refresh draft metadata: low-support marathon, ultra, and mountain contexts now surface conservative, finish-oriented, or durability-limited language without changing load progression, pace gating, or HR suppression.
- Fixed structured plan taper/phase consistency: long-run taper reductions now use the same `Taper` phase boundary as workout labeling, peak long-run durability load occurs before taper starts, taper long runs get reduced taper identity/guidance, and deterministic doctrine fixtures cover marathon, ultra, short-goal, broader-taper, and refresh-draft cases.
- Added the canonical plan creation QA matrix: `docs/process/hito-plan-creation-qa-matrix.md` now defines high-risk structured, voice, text, import, refresh, workout-identity, glyph, metric-gating, and coaching-quality scenarios for future regression passes.

## 2026-05-24

- Upgraded active-plan refresh/apply safety: proposal generation now attaches the exact signed non-mutating future draft built from stored or reconstructed authoring truth, `Apply update` verifies that reviewed draft without calling OpenAI or regenerating, blocks if a mutable workout became logged/evidence-backed, and carries fixed logged/Garmin/comparison/AI-backed truth into the archive/replace result.
- Hardened running-plan authoring doctrine: structured generation now uses goal-family long-run floors/peaks/ceilings for half marathon, marathon, ultra, and mountain goals, applies meaningful cutback and taper reductions, branches workout identity by Base/Build/Specific/Taper phase, and keeps pace/HR targets behind the existing metric resolver safety rules.
- Aligned text, voice, and refresh authoring with the expanded structured goal contract: OpenAI text authoring now accepts ultra/mountain goals, terrain focus, execution mode, and recent 5K pace truth; Dictate-to-Plan review now preserves benchmark-derived pace context from supplements and adds target-time honesty assumptions; refresh apply repairs expanded goal, terrain, execution, and current-level defaults before canonical validation.
- Corrected Hito choice-toggle sizing: functional `xs/sm/md/lg/xl` toggles now align to the button/input size scale, while large decorative plan-builder choices have a separate `hito-choice-toggle-accent` recipe documented in `/hitoDS#selection-controls`.
- Simplified the `/hitoDS` reference workbench: sidebar navigation now groups content under Overview, Foundations, Components, Patterns, and Backlog, while Buttons, Inputs, Tabs, and Status expose a consistent preview, controls, contract, and product-usage link structure.
- Tightened `/hitoDS` interaction primitives: sidebar section links now show the active hash/scroll section, modal examples use a rounded Hito window anatomy, demo value pickers use choice toggles instead of tabs, choice toggles cover the full size scale, and checkbox controls read square while keeping signal-selected states.
- Refined two Hito DS visual recipes: settings avatar actions now use a same-width Upload/Edit action pattern tied to the rectangular avatar tile, and enclosed tab rails now use a darker inset shared DS treatment.
- Promoted `/progress` visualization chrome into Hito DS: weekly planned-vs-actual bar fills, recent-consistency status fills, chart section dividers, and compact chart notes now use shared DS classes documented in `/hitoDS#analytics` while chart heights, widths, and aggregate calculations remain route-owned geometry.
- Aligned shared Radix/shadcn-derived UI wrappers with Hito DS defaults: dialog, sheet, dropdown menu, select, progress, card, and sidebar wrappers now start from Hito overlay, surface, menu, field, signal-progress, and low-card recipes while preserving existing exports and behavior; `/hitoDS#shared-wrappers` documents the boundary.
- Formalized Hito gradient and overlay usage as a small DS family: canvas atmosphere, auth/photo overlay, auth alpha surface, elevated launch surface, state-surface wash, and editorial signal wash are now named in `src/styles.css` and documented in `/hitoDS#gradient-overlays` without expanding gradients to ordinary controls.
- Promoted the public changelog editorial timeline look into Hito DS: date rails, title-adjacent text highlights with backdrop, timeline entries, glow dots, and inline code chips now have canonical classes documented in `/hitoDS#editorial-patterns` while `/changelog` keeps the same source-backed Highlights and Technical log behavior.
- Added the public `/hub` destination launcher: a standalone Hito-logo desert-background card grid links to Hito Running, Admin analytics, the Design system, and the Changelog while leaving each destination route to own its existing user/admin/public access behavior.
- Normalized Hito brand and admin table-header treatment: logo placements now use the smaller standalone SVG wordmark without decorative signal-dot boxes, and `/admin/analytics` table headers now share DS-owned sortable/non-sortable typography and rounded active sort/filter indicators.
- Refined `/admin/analytics` operational tables: Users now shows only backend-classified real Hito users with collapsed search, active-filter summaries, header sort/filter menus, and contained horizontal scrolling, while Test accounts shows local/test/admin/suspected rows separately with classification/status columns and preserves protected-admin and tester-delete safety.
- Split admin analytics users by backend-owned account classification: `/admin/analytics` now keeps real product users and real-user aggregate counts separate from local, admin, metadata-marked test, `@local.test`, and disposable-prefix accounts, while preserving the local Test accounts delete contract.
- Replaced the legacy local QA admin fixture with a single protected owner admin account in the local bypass accounts file, removed the old linked Supabase auth user, and kept `/admin/login` limited to that configured admin role while normal tester/product login remains unchanged.

## 2026-05-23

- Added the dedicated local admin login UI: `/admin/login` now renders a standalone `Hito Admin` username/email plus password form backed by `/api/admin/auth/login`, keeps signup and Magic Link out of the admin surface, preserves sanitized admin redirects, and routes `/admin/analytics` admin-required sign-in actions to the admin login path.
- Added a dedicated local admin login backend contract: `/api/admin/auth/login` verifies exactly one configured local admin account for `/admin/login`, rejects tester credentials without setting the local auth cookie, sanitizes admin-only `next` redirects, and leaves the normal product `/login` plus `/api/auth/local-login` paths unchanged.
- Wired the Phase 1 admin analytics UI to the backend view model: `/admin/analytics` now renders Overview, Funnel & Usage, Feedback, AI & Entitlements, Users, and local Test accounts tabs from server-shaped data without adding client-side aggregation, telemetry tables, raw sensitive payloads, or runner AppShell chrome.
- Added the Phase 1 admin analytics backend loader: `src/lib/admin-analytics.ts` exposes a server-action-ready admin view model over existing Supabase auth, profile, plan, planned workout, workout log, Garmin feedback, AI insight, entitlement, and capability-usage truth, with aggregate counts and per-user rows shaped on the server without adding telemetry tables or exposing raw sensitive payloads.

## 2026-05-22

- Added the local admin Test accounts UI at `/admin/analytics`: local admins in loopback local-auth runtime can view backend-shaped local tester/admin rows, see local bypass passwords, inspect linked identity status, and delete tester rows only after exact email confirmation while protected admin rows remain non-deletable.
- Added the first local admin test-account backend contract: a server-only local/dev seam can list local bypass tester/admin entries from `.tanstack/hito-running-local-accounts.json`, expose bounded local password/view data only to a local admin session, mark protected admin accounts as non-deletable, and delete tester accounts by removing the local entry plus linked Supabase auth user when configured.
- Implemented the progressive training-preference and structured review modal frontend: Settings and Quick setup now share a fixed-rest-days -> running-days/week -> optional long-run-day -> fitness benchmark flow, custom recent-5K validation stays bounded to `18:00..55:00`, non-custom fitness levels remain non-numeric context, and structured `draft_ready` reviews open in a `Review your setup` modal while corrections stay inline.
- Added the shared runner training-preference contract: Settings and structured setup now use one backend-owned mapper/validator for `fixedRestDays`, `defaultRunningDaysPerWeek`, and `preferredLongRunDay` into stored `blocked_days`, `max_running_days_per_week`, and `preferred_long_run_day`, including 0/6/7 fixed-rest-day rules, long-run-day conflict checks, and Sunday/Saturday/latest fallback without storing derived fallback choices.
- Aligned Settings profile defaults with existing Hito onboarding patterns: `/settings` now uses Hito tabs for Personal data vs Training preferences, reuses the editable value chip for age/height/weight, reuses the shared weekday choice controls for training defaults, and keeps avatar upload visually compact without changing save or upload behavior.
- Added visible runner training preferences in Settings and no-plan onboarding prefill: `/settings` now saves fixed rest days, preferred long-run day, and default running-days/week as future-plan defaults, and Quick setup preloads those saved profile preferences while keeping them editable before draft review and explicit plan creation.
- Added runner-level training preference storage: `runner_profiles.training_preferences` now stores bounded fixed rest days, preferred long-run day, and default running-days/week settings; settings route data can read/write them safely, and structured first-plan confirmation persists the same stable weekly defaults without mutating active plans.
- Migrated manual Quick setup onboarding to structured review-before-create: the constructor now includes compact execution-preference controls, `Review setup` calls `generateStructuredFirstPlanDraft` without creating rows, and only the explicit `Yes, create plan` review action calls `confirmStructuredFirstPlanDraft`.
- Added the structured constructor review-before-create backend seam: `generateStructuredFirstPlanDraft` returns a non-mutating setup review and canonical draft plan, while `confirmStructuredFirstPlanDraft` revalidates that draft, blocks existing active plans, and creates the first active plan only through explicit confirmation.
- Refined structured plan generator doctrine: generated `training-plan-v2` workouts now preserve exact `source_workout_type` identity, use clearer distance/time interval titles, simplify quality days during cutback weeks, and split appropriate later long runs into easy-base plus controlled steady-finish segments while preserving metric-mode safety.
- Added the plan-authoring metric-mode resolver: generated structured plans now emit `pace_min_per_km_range` only when execution mode allows watch/app pace guidance and recent 5K benchmark truth exists, while omitted execution mode, no-watch mode, unknown benchmark, and HR preference without HR-zone truth stay effort/cue based without numeric HR or pace targets.
- Added the first plan-authoring quality backend slice: structured onboarding, shared structured authoring, and Dictate-to-Plan supplements now accept bounded execution-mode context (`watchAccess` and `guidancePreference`), default omitted values safely to unknown watch/app access plus effort guidance, and keep the context generation-only without changing persistence or the existing voice review/confirm boundary.
- Fixed Calendar tooltip and mobile month usability: month tooltips now render through a viewport-clamped fixed layer, while narrow month view switches to a vertical day list that preserves workout links, glyphs, status, and feedback markers instead of squeezing the desktop seven-column grid.

## 2026-05-21

- Added Hito-owned checkbox, radio, and toggle-radio selection-control recipes in `sm` and `md` sizes, documented them in `/hitoDS#selection-controls`, and migrated saved-mode plan/import confirmation checkboxes to signal-selected Hito styling while preserving existing destructive and import gating behavior.
- Replaced Hito’s primary sans font from Inter to Poppins at the design-system foundations layer: `src/styles.css` now loads Poppins and maps `--font-sans` to it, while `/hitoDS#foundations` documents Poppins for body, label, control, navigation, and feedback roles without changing type scale, spacing, Fraunces display roles, or JetBrains Mono technical roles.

## 2026-05-20

- Migrated the Settings DS cleanup slice: the large profile avatar and fallback now use DS-owned profile avatar recipes instead of route-local arbitrary radius and gradient fallback styling while preserving settings loader, save, validation, and avatar upload behavior.
- Migrated the Auth/Login DS cleanup slice: login/signup tabs, email heading, already-signed-in state, and primary signed-in CTA now use canonical Hito tab, micro-label, surface, body, modal-title, and button roles while preserving Magic Link, local login, redirect, validation, and tab behavior.
- Completed the Shell/AppShell portion of the Calendar/Shell DS cleanup slice: profile trigger and dropdown metadata now use canonical Hito menu roles, the top-bar date uses the technical mono role, shell CTAs no longer carry local tracking overrides, and the live shell plus `/hitoDS` now share one `hito-shell-avatar-fallback` recipe instead of local gradient/tiny-text avatar styling.
- Started the Calendar/Shell DS cleanup slice with the calendar surface: month headers, week-strip metadata, workout type tags, tooltip metadata, compact metric readbacks, and view controls now use canonical Hito typography/control primitives instead of local tiny text, tracking, mono, and button-spacing recipes while preserving calendar interaction, navigation, tooltip logic, and feedback markers.
- Migrated the highest-drift workout-detail DS chrome to existing Hito primitives: workout route surfaces, fueling rows, progress fill, tab metadata, rest-day dividers, interval controls, and the Garmin upload empty state now use canonical surface, row-group, hairline, typography, radius, and semantic color primitives instead of local gradients, white-alpha borders, bespoke radius values, and tiny text recipes.
- Added the first Hito DS foundations cleanup slice: raw color primitives now sit under existing semantic tokens, spacing primitives are exposed through CSS/Tailwind aliases, and `/hitoDS#foundations` documents primitive swatches, semantic mappings, typography families, tone rules, workout-color boundaries, and spacing rhythm without migrating product screens.
- Extracted `/changelog` parsing, grouping, date metadata, highlight classification, and milestone title helpers into `src/lib/changelog-utils.ts`, preserving the markdown source of truth, Highlights and Technical log behavior, source-derived count, and last-updated metadata while keeping route shell and rendering in `src/routes/changelog.tsx`.
- Extracted the workout-detail AI insight readback UI into `src/components/workout-completion/WorkoutAiInsightReadback.tsx`, preserving recommendation tone, caution-flag summary, matched-verdict copy, timestamp display, and next-step sections while keeping feedback data selection, Garmin upload/remove, and manual save orchestration in `CompletionPanel`.
- Extracted the workout-detail deterministic comparison readback UI into `src/components/workout-completion/WorkoutComparisonReadback.tsx`, preserving the plan-vs-run evidence, confidence, run summary, support matrix, segment summary, signal rows, and technical notes while keeping Garmin upload/remove and AI insight rendering in `CompletionPanel`.
- Fixed `CompletionPanel` post-save reconciliation so successful completed, partial, or skipped workout saves immediately reset the local dirty baseline, normalize skipped form state, leave `Saving result`, and refresh route data in the background instead of requiring a manual reload.
- Extracted the workout-scoped body-note editor UI from `CompletionPanel.tsx` into `src/components/workout-completion/BodyNotesEditor.tsx`, preserving the summary row, modal editor, body map, select fields, severity controls, and body-note helper behavior while keeping workout-log save orchestration in the parent panel.
- Extracted the saved-mode `Open plan` active-plan summary/header UI into `src/components/plan-management/PlanSummaryHeader.tsx`, preserving title, goal fallback, active status, date/count/target summary, export menu placement, and export error rendering while keeping export orchestration in the parent dialog.
- Extracted the saved-mode `Open plan` text replacement UI into `src/components/plan-management/PlanTextReplacementPanel.tsx`, preserving prompt copy, minimum-length gating, loading label, error rendering, and explicit `Create new plan` action while keeping `completeTextOnboarding` state and server calls in the parent dialog.

## 2026-05-19

- Fixed active-plan lifecycle server-action auth resolution after extraction: `deleteActivePlan` and `clearUpcomingSchedule` now bind as top-level `training-api.ts` server actions and resolve the persisted user through the same request-auth seam as other saved-mode mutations before delegating to lifecycle helpers.
- Extracted the saved-mode `Open plan` lifecycle controls into `src/components/plan-management/PlanLifecycleControls.tsx`, preserving clear-upcoming and delete/archive copy, confirmation checkboxes, disabled states, loading labels, and error rendering while keeping lifecycle actions and state in the parent dialog.
- Extracted the saved-mode `Open plan` JSON import UI into `src/components/plan-management/PlanImportPanel.tsx`, preserving upload, paste, template download, validation, start-date, clear-before-import, safe import, and replace-start-day behavior while keeping import state and server apply actions in the parent dialog.
- Extracted the saved-mode `Open plan` refresh proposal UI into `src/components/plan-management/PlanRefreshPanel.tsx`, preserving the same prompt, proposal review, locked/error/stale messaging, and explicit apply/keep-current boundaries while keeping backend actions and state in the parent dialog.
- Extracted the saved-mode `Open plan` export dropdown UI into `src/components/plan-management/PlanExportMenu.tsx`, preserving the same JSON/Markdown export action, authenticated iframe download path, status handling, and dialog behavior.
- Extracted advanced JSON/imported-plan replacement and saved-mode text replacement action ownership from `training-api.ts` into `src/lib/plan-replacement-actions.ts`, preserving the same public action names, authenticated persisted-user checks, start-date handling, first-day semantics, and canonical apply sequencing.
- Extracted active-plan refresh proposal/apply ownership from `training-api.ts` into `src/lib/active-plan-refresh-actions.ts`, preserving the same `Open plan` public server actions, entitlement usage timing, stale fingerprint checks, weekday rest-day validation, and archive/replace behavior.
- Extracted home, shell, workout-detail, and progress route-data helper ownership from `training-api.ts` into `src/lib/route-data-actions.ts`, preserving the same route loader imports, loader data shapes, and feedback lookup behavior.
- Extracted auth/login action ownership from `training-api.ts` into `src/lib/auth-actions.ts`, preserving the same login route data shape, Magic Link request behavior, SSR auth callback exchange, local bypass availability, and compatibility exports.
- Extracted workout-log save action ownership from `training-api.ts` into `src/lib/workout-log-actions.ts`, preserving the same public `saveWorkoutLog` server action, completed/partial/skipped semantics, and workout-scoped body-note persistence.
- Extracted user-settings action ownership from `training-api.ts` into `src/lib/user-settings-actions.ts`, preserving the same `/settings` route data shape, profile-save behavior, and compatibility exports.
- Extracted active-plan lifecycle action ownership from `training-api.ts` into `src/lib/active-plan-lifecycle-actions.ts`, preserving the same delete/clear compatibility exports and refreshed snapshot result shape.
- Extracted active-plan export action ownership from `training-api.ts` into `src/lib/active-plan-export-actions.ts`, keeping the same compatibility exports while leaving canonical export payload/document shaping in `src/lib/plan-export.ts`.

## 2026-05-18

- Removed dead first-plan compatibility seams from `training-api.ts`, collapsed duplicated structured/voice first-plan helper logic into `src/lib/first-plan-authoring-utils.ts`, and split Garmin feedback readback into a non-ingest server module so shared route data no longer pulls Node-only FIT/ZIP dependencies into the browser build.
- Extracted shared imported-plan apply and active-plan persistence primitives into `src/lib/active-plan-persistence.ts`, so `first-plan-actions.ts` no longer dynamically imports back into `training-api.ts` while compatibility exports and sequential apply behavior remain unchanged.
- Extracted first-plan server-action ownership from `training-api.ts` into `src/lib/first-plan-actions.ts`, keeping compatibility re-exports for the structured constructor and Dictate-to-Plan draft/confirm actions while preserving the sequential canonical generation/apply path.
- Refined Dictate-to-Plan into a compact Pro `AI setup` assist above the manual structured constructor: runners paste/type transcript text, review a clearer non-mutating setup verdict, and create only through explicit `Yes, create plan`, while Advanced JSON remains demoted.
- Fixed the real Dictate-to-Plan style-mismatch assumption path so explicit transcript cues such as `balanced 10K` are compared before structured constructor supplement defaults; a reviewed `Relaxed 10K` draft now carries an explicit style-change assumption instead of silently changing the runner's requested style.
- Refactored no-plan onboarding frontend ownership without changing behavior: `OnboardingGate` now orchestrates state/actions while focused onboarding modules own the structured constructor UI, Dictate-to-Plan review UI, Advanced JSON panel, and shared constructor/voice form model.
- Tightened Dictate-to-Plan review assumptions so an obvious requested goal style, such as balanced, is called out when the reviewed draft proposes a different style, such as relaxed, instead of silently hiding the change before confirmation.
- Added the first Dictate-to-Plan review UI to no-plan onboarding: runners can paste/type a transcript, generate a non-mutating review through `generateVoiceToPlanDraft`, see either clarification questions or a draft-ready summary, and create the plan only through explicit `OK, create plan` confirmation via `confirmVoiceToPlanDraft`.
- Extended the backend voice-to-plan seam with a review verdict and explicit confirm contract: `generateVoiceToPlanDraft` now returns either `draft_ready` with runner-facing understanding/plan-shape review or `clarification_required` with missing fields/questions, while `confirmVoiceToPlanDraft` is the only mutating first-plan creation path and rechecks entitlement, blocks existing active plans, preserves fixed rest days, and avoids raw transcript persistence.
- Added the first backend voice-to-plan authoring seam: confirmed transcript text now checks `voice_to_plan` entitlement, validates bounded transcript/rest-day context, routes through the existing OpenAI structured-authoring path, and returns a review-only canonical draft without raw audio handling, transcript profile persistence, usage counting, or active-plan mutation.
- Applied the Basic/Pro entitlement foundation migration to the linked Supabase project and regenerated `src/lib/supabase/database.ts` from the linked schema, removing the schema-cache mismatch where entitlement tables existed only in local code/types.
- Added the first backend-only Basic/Pro entitlement foundation: new additive entitlement and usage tables, a small capability registry/resolver/checker/recorder module family, missing-row default `Pro` behavior, `ai_plan_update` usage counting on successful proposal generation only, and `garmin_ai_interpretation` gating that skips only AI insight generation while preserving deterministic Garmin upload/comparison truth.
- Added a backend instruction-completeness guard for workout structure: imported/generated/reloaded steps now ensure every visible non-rest segment and expanded repeat work/recovery row has target or guidance copy, with safe cue fallbacks for warmup, cooldown, recovery, hard work, and mobility/strength instead of fabricated pace or heart-rate targets.
- Added benchmark-derived pace targets to structured first-plan generation: recent 5K time or pace now produces broad `pace_min_per_km_range` targets for generated running segments and repeat work/recovery rows, while unknown benchmarks keep safe effort/hint fallback copy and HR ranges are still not invented without real HR-zone truth.
- Refined the structured first-plan onboarding constructor after QA: required age/weight/height now use bounded numeric Hito fields, benchmark and strength choices use compact row selectors, availability asks only for fixed rest days while sending a conservative hidden running-day count, target and terrain controls are conditional, mountain running implies mountain terrain, the optional field is labeled `Comment`, and `Create plan` is pinned in a sticky disabled-until-valid footer.
- Tightened the structured first-plan onboarding backend contract after QA: age, weight, and height are now required with bounded ranges, `ultra_marathon` and `mountain_running` are accepted goal values, hidden terrain defaults safely, mountain running normalizes to mountain terrain, target fields only affect target-time goals, and generated plans still persist only approved profile measurements plus canonical plan truth.
- Replaced visible free-text-first onboarding with the structured first-plan constructor: `OnboardingGate` now submits profile basics, benchmark, running days, fixed rest days, goal, terrain focus, strength/mobility preference, and an optional supporting comment through `completeStructuredFirstPlanOnboarding`, while JSON import remains under Advanced.
- Implemented the backend contract for structured first-plan onboarding: added one authenticated constructor seam, translated profile/benchmark/availability/goal/terrain/strength/comment inputs into existing structured authoring, preserved fixed rest days through weekday invariant plan preferences, persisted only age/weight/height as runner profile fields, and added deterministic rolling/mountain hill-oriented generation context without changing JSON import or frontend onboarding yet.
- Added distinct tiny workout-type glyph semantics for current visible month-cell labels: Easy, Recovery, Long, Tempo, Intervals, Progression, Race, Quality, and Rest now share one frontend glyph contract while preserving existing type color families and avoiding any new Strength/OFP workout type.
- Added semantic Hito button tones across the existing hierarchy: default, success, and error now compose with primary, secondary, outlined, and ghost buttons; onboarding/import/Open plan destructive actions use the canonical error tone, and AppShell’s repeated shell micro-labels use `hito-micro-label`.
- Corrected Hito button variant semantics: secondary buttons now use a soft borderless tinted surface, outlined remains the visible-border variant, and `/hitoDS#buttons` includes a compact variant-contrast strip.
- Added canonical input feedback states to the Hito field contract: `hito-field-feedback-error` and `hito-field-feedback-success` now provide calm validation shell styling, and `/hitoDS#inputs` demonstrates error/success fields with matching feedback text and icon tone.
- Normalized `/hitoDS#inputs` toward button-builder parity: Hito fields now document primary and secondary variants, left/right icon padding, default/hover/active/disabled/read-only states, and XS input/button height plus radius alignment without changing product form workflows.
- Added the first Hito modal anatomy helper slice: shared modal classes now name content-fit and scroll-fill body modes plus header/footer anatomy, `/hitoDS#modals` shows separate short and tall modal examples without a fake dead zone above the footer, and `Open plan`, `Import plan`, and `Body notes` now use the named helpers without workflow changes.

## 2026-05-17

- Reduced `/hitoDS` reference-card clutter: Overview now uses divider-led principles, Typography uses quiet ownership copy plus open role specimens, Icons uses a divided registry plus one shared usage surface, and nested specimen/card frames were removed without changing live product components.
- Added the first Hito icon-system slice: product icon usage now flows through one Tabler-backed Hito `Icon` primitive with stable names and four canonical sizes, `/hitoDS` documents the approved icon gallery and examples, and the raw `icons-line`, `icons-fill`, and `icons-multy` SVG folders were removed instead of becoming a second source of truth.
- Fixed the shared dialog typography contract: `DialogTitle` and `DialogDescription` no longer force generic title/description utility defaults over canonical Hito role classes, so `Open plan`, JSON import, and body-note dialogs compute their title/body rhythm from `hito-modal-title` and `hito-body`.
- Added the first canonical typography slice: shared Hito text roles now cover display, modal/panel titles, body/body-small, form labels, nav/menu, metric, status, error/success, and technical mono text; `/hitoDS` documents the full role inventory, and `Open plan`, JSON import, workout `Log result`/`Feedback`, and `User settings` now use those roles for their highest-drift text decisions.
- Fixed working-toast dismissal at the DS layer: `hitoToast.working` now bypasses Sonner's loading/action button path and renders a custom Hito working-toast body with a normal in-content `Dismiss notification` button that hides the toast without cancelling the underlying action.
- Tightened Hito toast coordination and anatomy: `Open plan` refresh proposal/apply feedback now uses one shared action-family toast id so apply results replace older proposal toasts, and the DS dismiss control now sits inside the toast container instead of floating over it.
- Promoted the async toast work into a Hito design-system primitive: `/hitoDS` now documents and exercises info, working, success, and error toast variants with Safari-stable visible state, while `Open plan` proposal generation and `Apply update` consume the shared helper instead of direct Sonner calls.
- Fixed the live Sonner working-toast dismiss control: loading toasts now render an explicit icon-only dismiss action in the DOM, and `/hitoDS` demonstrates one real top-center toast updating through the async states instead of three simultaneous inline toast cards.
- Polished the v1 Hito async-action toast pattern: loading toasts now force a visible dismiss affordance without cancel semantics, and `Apply update` keeps its success state visible briefly before returning to the refreshed active-plan view.
- Added the first Hito async-action toast slice: the existing Sonner seam is now mounted as a top-center Hito toast pattern, `Open plan` proposal generation and `Apply update` show working/success/error toast lifecycles with staged indeterminate waiting copy, and `/hitoDS` documents the bounded dismiss-only pattern while inline proposal and stale-state feedback remain in place.

## 2026-05-16

- Finished the active-plan refresh apply reliability hardening: refresh apply now repairs ordinary model-returned goal, runner-baseline, schedule, and availability fields from persisted context before canonical validation, so fresh proposals with null baseline fields or blocked-day availability can archive/replace safely while malformed unsafe output still returns bounded `invalid_refresh_plan` without mutation.
- Fixed the remaining active-plan refresh apply blocker: refresh apply now runs its authoring repair before validation even when model output is schema-valid, normalizes generated availability against fixed weekday rest-day truth, clamps replacement workouts to the proposal's remaining-schedule window, and allows valid approved proposals to reach archive/replace instead of returning `invalid_refresh_plan`.
- Hardened active-plan refresh apply generation: the apply path now derives a refresh-safe start/target/horizon contract, preserves the original target date only when it is still valid for the new refresh start, repairs near-term generated authoring input before canonical validation, and returns bounded proposal-specific blocked copy instead of raw schema errors.
- Added the first runner-facing active-plan refresh confirm/apply slice: `Open plan` proposal review now offers explicit `Apply update` and `Keep current plan`, calls the backend apply seam with stale/off-day revalidation, returns to the refreshed active-plan view after success, and keeps stale proposal recovery honest.
- Added the first weekday rest-day invariant backend slice: import/apply now resolves fixed blocked weekdays from active plan preferences before imported metadata, rejects blocked chosen start dates, maps incoming non-rest workouts across allowed weekdays, and propagates the same invariant through refresh context, proposal review, stale fingerprints, and refresh apply validation.
- Aligned `/settings` profile inputs with the canonical Hito field contract: editable settings fields now use the `hito-field-md` size tier, the saved email is rendered as a read-only field, and shared field styling now covers read-only/autofill states without a route-local recipe.
- Added the first explicit active-plan refresh apply backend foundation: proposal output now carries a stale-check fingerprint, apply must be called intentionally, stale proposals are blocked, and successful apply archive/replaces the active plan with an `active_plan_refresh_v1` plan while preserving fixed workout/log truth.
- Fixed active-plan refresh proposal scope consistency so review-visible proposed changes can no longer coexist with a `0 targeted workouts` scope count when model refs are missing or discarded.
- Guaranteed the active-plan refresh proposal review's `What stays the same` content from the backend contract, so runner-facing review always states that past workouts, logged history, and only the remaining active schedule are fixed-scope truths.

## 2026-05-15

- Tightened the active-plan refresh proposal review contract: backend output now includes a review-safe shape that strips raw workout ids and internal field names, replaces malformed fragments with stable fallback copy, and distinguishes total remaining schedule size from specifically targeted upcoming workouts.
- Added the first runner-facing proposal-only `Update plan` slice inside `Open plan`: saved-mode runners can enter short refresh intent, call the backend `RunnerCoachContext` / `proposeActivePlanRefresh` seam, and review why the remaining active schedule might change without applying or mutating the active plan.
- Added the first backend-only longitudinal AI plan-refresh foundation: `RunnerCoachContext` now compacts saved runner profile, active plan, remaining schedule, recent adherence/load, Garmin comparison signals, and workout-scoped body-note cautions, and the active-plan refresh seam now returns a proposal-only artifact without mutating plan rows.
- Consolidated the current product modal recipe: `UploadJsonDialog` now uses the same stable bounded panel, internal scroll body, and Safari-safe overlay/content behavior as `Open plan` and `Body notes`, while `/hitoDS` now documents the live modal anatomy and calm action hierarchy.
- Added a backend text-quality gate for workout AI recommendations: malformed runner-facing output with dangling fragments, ampersand continuations, replacement glyphs, or non-English character artifacts now falls back to stable deterministic copy before persistence, while body-note caution and severity softening remain intact.
- Added workout-scoped body notes to the bounded Garmin AI recommendation input: saved `workout_logs.body_notes` now reach the existing workout feedback prompt as optional caution context, with explicit guardrails against diagnosis, medical advice, injury certainty, treatment instructions, or plan mutation.
- Fixed the remaining Safari closed-overlay bug for stable dialogs: the body-note modal and `Open plan` now force their shared Safari-stable overlay into explicit non-blocking closed state, so save/cancel no longer leaves the page dimmed and trapped behind a stale overlay.
- Fixed the Safari body-note modal layout bug in `Log result`: the workout-scoped body-note dialog now reuses the same stable bounded-height pattern as `Open plan`, keeping the title visible, the content scrolling internally, and `Cancel` / `Save body notes` reachable inside the viewport.
- Replaced the heavy inline workout body-note editor with the first modal flow in `Log result`: the page now shows a compact summary row plus `Add body note` / `Edit body notes`, the workout-scoped modal saves the same bounded schema fields, and bounded body-map area selection ships inside the modal without reviving `/body`.
- Retired the legacy `/body` route cleanly: the app now redirects `/body` to `/` instead of falling through to a raw 404, permanent docs no longer describe `/body` as a quiet utility surface, and `/hitoDS` menu examples now reflect `User settings` instead of `Body notes`.
- Fixed the remaining workout body-note reveal bug in `Log result`: `Add body note` now keeps the draft form open for the current workout instead of immediately resetting back to the empty state before the runner can fill in area, timing, sensation, severity, and detail.
- Applied the body-notes and user-settings persistence repair: the linked Supabase project now has `workout_logs.body_notes`, bounded settings/avatar columns on `runner_profiles`, and the `profile-avatars` bucket, while `/settings` and shell viewer profile reads now use the persisted saved-mode user mapping instead of the raw local bypass id.
- Fixed the Safari active-plan export delivery bug: `Open plan` now starts JSON and Markdown download through an authenticated attachment route instead of a client-side blob/objectURL helper, so JSON no longer sticks in `Preparing...` and Safari gets a real file download path.
- Implemented the first saved-mode plan-export frontend slice: `Open plan` now exposes one compact `Export` action for active plans, downloads backend-owned JSON and Markdown documents through real browser file-save behavior, keeps export absent when there is no active plan, and still defers PDF.
- Added the first saved-mode plan-export backend slice: one canonical active-plan export payload now reads the active `plan_cycle` plus saved `planned_workouts`, projects to `training-plan-v2` JSON with applied schedule dates, and renders Markdown from the same truth while excluding logs, Garmin evidence, comparison, and AI runtime state.
- Implemented the saved-mode calendar-cell semantics correction: month cells now show a broad-family workout glyph, short type label, restrained semantic color, completion marker, and quiet feedback/evidence marker without bringing back distance, duration, target data, or dashboard-style metric stacks.
- Implemented the saved-mode `Clear upcoming schedule` frontend slice: `Open plan` now exposes a confirmed secondary clear-schedule action, tall plan-management/import dialogs scroll internally, and later-starting JSON imports can explicitly clear the previous upcoming schedule before applying the new plan through the backend seam.
- Added the saved-mode `Clear upcoming schedule` backend lifecycle action: the current active plan is archived out of active scheduling from today forward, planned-workout rows and logs remain preserved as archived history, and the user returns to a clean no-plan state before importing or creating a later-starting plan.
- Exposed the richer deterministic comparison support-matrix and segment-summary facts inside workout-detail `Feedback`: the surface now shows what the Garmin review compared, what was unavailable or unsupported, and warm-up/main/cooldown-style grouped structure when ordered step comparison is trustworthy, while keeping pace and heart-rate comparison explicitly unsupported.

## 2026-05-14

- Implemented the first richer-comparison backend slice for Garmin feedback: deterministic comparison payloads now include a support matrix and segment-group summaries for ordered simple workouts, while pace and heart-rate comparison remain explicitly unsupported until the canonical metrics can be compared honestly.
- Implemented the first saved-mode plan-management UI slice: `Open plan` now opens a compact active-plan modal with plan summary, primary text-first replacement, secondary JSON import using a runner-chosen start day, and backend-wired `Delete plan` archival action; the existing saved-mode JSON import dialog also sends `requestedStartDate`.
- Added the first saved-mode plan-management backend slice: the server now exposes a canonical delete-plan lifecycle action that archives the active `plan_cycle` while preserving planned workouts and workout logs, and the JSON import apply seam now accepts an optional `requestedStartDate` that becomes the effective schedule authority when the saved-mode modal sends a chosen start day.

## 2026-05-13

- Aligned the Supabase email sign-in code with SSR-safe passwordless auth: magic-link requests now opt into PKCE flow, the `/api/auth/confirm` callback now accepts either an auth `code` or an email `token_hash`, and the live configuration contract now explicitly depends on Supabase URL allow-listing plus `{{ .RedirectTo }}` email-template usage instead of a mixed implicit-flow fallback to localhost.
- Implemented the fifth app-wide simplification slice for `/hitoDS`: the internal reference now follows the simplified live product language with open route rhythm, divider-based grouping, compact summary truth, restrained markers, utility/disclosure actions, simplified shell navigation, and explicit visualization geometry exceptions instead of historical overbuilt dashboard/card examples.
- Implemented the fourth app-wide simplification slice for `/body`: demoted Body from primary desktop/mobile nav, kept it reachable as a quiet utility, and flattened the body-notes route into an open body-map area with divider-based selected-area, today’s-notes, and current-scope sections instead of widgetized support panels.
- Implemented the third app-wide simplification slice for `/progress`: collapsed four peer stat cards into one compact summary group, kept weekly planned-vs-actual volume and recent consistency, replaced zero-volume chart scaffolding with honest sparse copy, removed the static placeholder activity chart, and deleted the heavy “Still growing” support frame.
- Implemented the second app-wide simplification slice for home/calendar density: month cells now prioritize date, workout identity, completion marker, and secondary feedback cue without inline metric/dashboard clutter, the duplicate calendar-level week-status treatment was removed, and the home right support rail was reduced to the next-workout context.
- Implemented the first app-wide simplification slice: `/integrations` is no longer a primary desktop or mobile nav item, remains reachable as a quieter connections/status utility, and stale disabled Settings/Account/Preferences shell menu rows were removed.
- Applied the hierarchy/disclosure cleanup after the copy pass: `Replace today` now sits behind quieter destructive disclosures in text-first and JSON apply flows, JSON paste/template tools are demoted inside expert disclosure, and the `Log result` Garmin bridge is a lighter continuation row into `Feedback` instead of a bordered promo block.
- Simplified the frontend plan-apply UX to match the rewritten backend policy: normal text-first and advanced JSON apply now use the safe default without a required preserve-vs-ignore chooser, `Replace today` remains as the only explicit destructive override, and the saved-mode import dialog now scrolls internally with calmer copy.
- Simplified the first-day plan-apply policy so a today-conflict no longer blocks normal apply by default: the canonical backend path now preserves today’s existing workout, drops the incoming first workout, and starts original day 2 tomorrow, while `replace_first_day` remains the only explicit destructive override and still respects saved-history continuity safety.
- Fixed the `ignore_first_day` plan-apply semantics so a successful choice now preserves today’s existing workout in the active plan, drops only the incoming first workout, and starts the imported original day 2 tomorrow instead of leaving today empty.

## 2026-05-12

- Implemented the frontend first-day conflict decision slice for text-first and advanced-import plan apply: onboarding and expert JSON import now stop on backend `decision_required`, explain the today-conflict in plain language, show explicit `Replace first day` and `Ignore first day` actions with honest blocked-state messaging, and resubmit through the same canonical apply seam without regenerating the plan.
- Implemented the first approved start-date policy backend slice for text-first and advanced-import plan apply: the canonical apply seam now preserves explicit future starts, normalizes past or non-future starts to today, returns a structured `decision_required` conflict state when today already has a workout, supports `replace_first_day` and `ignore_first_day` semantics behind the same continuity guard, and keeps current callers from falsely navigating on unresolved conflicts.
- Implemented the loaded attached-evidence `Feedback` refinement pass: the top of the surface now switches from upload-first framing to an attached-file owner row, `Plan vs run` now carries the stronger primary loaded-state hierarchy with a compact evidence/confidence/checks strip and quieter comparison notes, and recommendation stays visibly secondary below it.
- Cleaned up and humanized workout-detail `Feedback`: removed the heavy outer evidence-card chrome, made attached Garmin files explicit with a live remove action, merged comparison coverage/confidence/checks into one calmer strip, switched check rows to lighter divided layout, and humanized runner-facing target labels plus bounded recommendation caveats.
- Refined the bounded workout-detail Garmin recommendation block so it now leads with a clearer runner-facing next-step note, keeps factual comparison visibly primary above it, and translates mixed-evidence caution into plainer language instead of technical AI framing.
- Replaced the near-upload Garmin status plumbing in workout-detail `Feedback` with a compact state-aware payoff summary: no-evidence, attached, processed, comparison-ready, recommendation-ready, and failed states now read in plain language without overclaiming what is ready.
- Upgraded the workout-detail `Log result` Garmin bridge from a generic link into a richer state-aware invitation: no-evidence routes now explain the payoff of FIT/ZIP upload in plain language, while already-attached or ready-feedback routes now read as continuation paths into the canonical `Feedback` tab instead of first-time invites.
- Shipped the first immediate Garmin UX cleanup slice: restored the FIT/ZIP upload icon, flattened the workout-detail `Feedback` surface into one calmer divided hierarchy with plainer `Upload Garmin file`, `Plan vs run`, and `Recommendation` framing, added one lightweight `Log result` path into `Feedback`, cleaned the sidebar `Plan note` dismiss placement, and removed stale `Preview / View status / Not connected` contradiction patterns from `/integrations`.
- Rendered the bounded Garmin `feedbackMarker` seam on saved-mode home and calendar: month/week day surfaces and the current-day hero now show a small secondary `Evidence` or `Feedback` cue that routes directly into workout-detail `?tab=feedback` without competing with completion-status markers.
- Added the bounded calendar-evidence backend seam: the canonical saved-mode workout snapshot now carries a minimal `feedbackMarker` summary per workout day, derived from existing Garmin asset and deterministic comparison truth as `evidence_attached` or `feedback_ready`.

## 2026-05-11

- Added the first bounded Garmin AI interpretation slice: successful Garmin-backed comparisons now persist `workout_ai_insights` rows generated only from planned workout truth, normalized actual metrics, deterministic comparison payload, week context, and next-workout summary, and the dedicated `Feedback` surface now reads that recommendation layer back separately from deterministic facts.
- Split workout detail into a dedicated `Feedback` surface so Garmin FIT/ZIP upload, parsed evidence summary, and deterministic comparison no longer overload `Log result`, which now stays focused on manual completion truth.
- Tightened deterministic Garmin comparison readback coherence so a parent matched verdict no longer shows a conflicting step-summary mismatch block, and structured-step session summary now reads as intentionally not comparable instead of looking like broken string formatting.
- Replaced the plain-text Garmin comparison readback with a factual deterministic comparison layout in the workout `Log result` surface, including top-level evidence/completion/confidence/signal summary, compact session deltas, signal-by-signal statuses, and step-summary truth without AI interpretation.
- Enriched the deterministic Garmin comparison payload and readback contract so `workout_comparisons.difference_payload` now stores explicit signal objects, honest `missing_actual` and `not_applicable` reasons, delta/tolerance metadata, session-summary facts, and a conservative step-summary block when ordered per-step duration comparison is trustworthy.
- Fixed deterministic Garmin comparison duration truth so planned duration now comes from the same canonical helper used by workout detail, eliminating visible-vs-comparison drift on distance-backed interval workouts.
- Implemented the first deterministic Garmin planned-vs-actual comparison slice: saved-mode workout detail now persists `workout_comparisons` rows from backend-owned planned workout truth plus normalized Garmin actual metrics, classifies the result conservatively as `complete` / `partial` / `insufficient_data` and `matched` / `partially_matched` / `unclear`, and reads that comparison back into the existing `Log result` surface.
- Fixed the Safari FIT/ZIP file-picker contract for Garmin upload: the visible workout result control no longer relies on Safari-native MIME/UTI filtering and validates `.fit` or `.zip` after file selection before submitting multipart data to the backend upload route.
- Aligned the workout result upload UI with live truth: FIT/ZIP is now presented as the supported saved-mode upload action, while screenshot remains clearly marked as a later capability.
- Implemented the first real Garmin upload slice: saved-mode workout detail now accepts one Garmin `.fit` file or one `.zip` archive with exactly one FIT activity file, stores the original asset in Supabase storage, normalizes parsed actual metrics into canonical backend tables, and shows a compact parsed summary in the existing `Log result` surface without yet claiming deterministic comparison, AI analysis, screenshot OCR, or provider sync.
- Polished runner-facing support surfaces: the home side support area no longer duplicates week status, and the planning/plan-window note can be dismissed locally for the current UI session.
- Completed a near-final no-stray Hito DS cleanup: calendar and workout-structure tooltip chrome now uses one shared `hito-tooltip` primitive, calendar workout-type legend rows use the shared `hito-legend` family, `/hitoDS` documents the tooltip shell plus final visualization geometry exceptions, and chart bars, plotted lines, interval widths, SVG silhouettes, and marker coordinates remain intentionally route-owned geometry.
- Normalized shell navigation ownership: desktop and mobile AppShell navigation rows, the profile trigger, and profile dropdown menu rows now use explicit Hito shell primitives; `/integrations` data-flow utility rows now use shared grouped rows; and `/hitoDS` demonstrates the live shell navigation pattern.
- Normalized the body severity design-system slice: `/body` severity selectors now use a shared `hito-scale-control` and `hito-scale-button` pattern, active-log summaries use shared `hito-severity-bars`, and `/hitoDS` documents the live severity scale pattern while preserving the body-map SVG as visualization-specific geometry.
- Normalized the next Hito design-system progress analytics slice: `/progress` large summary stats now use a shared `hito-analytics-stat` primitive, chart legends use a shared `hito-legend` family, and `/hitoDS` demonstrates the implemented analytics primitives without changing progress data semantics.
- Added the next full design-system normalization slice: shared `hito-status-marker` and `hito-state-surface` primitives now own compact check/dash/cross status expression and setup/empty/error route surfaces across calendar, workout, progress, and home error states, with `/hitoDS` updated to demonstrate the live marker and state-surface families.
- Normalized deeper Hito design-system micro-primitives in workout support components: `IntervalsViz` now uses shared labels, captions, tooltip tone, and grouped rows, while `CompletionPanel` now uses shared flat surfaces, labels, fields, helper text, buttons, and captions for save feedback, actual metrics, interval count support, notes, and the upload-result placeholder.
- Restored `localhost:3000` as the trusted local QA runtime by replacing the stale long-lived Nitro server with the current built `.output`, adding an explicit `npm run serve:local` command for the production-like local server, and verifying current hashed assets load on port 3000.
- Reworked `/hitoDS` into a dedicated internal component playground with its own design-system sidebar, no runner-facing Today/Week/Open Plan chrome, and live primitive examples for buttons, inputs, surfaces, list items, and dropdown-style rows.
- Normalized the next Hito design-system typography and spacing slice: runner-facing page headers, section headers, support copy, captions, and route rhythm now use shared primitives across home/calendar, workout detail, progress, body, integrations, and `/hitoDS`.
- Softened the workout-detail tab chrome by adding an open Hito tab-list treatment for the route tabs, removing the tight boxed border and giving the tab row more breathing room above the section divider.
- Added the mirrored Hito workout navigation card pattern for workout-detail previous/next links, with darker low-chrome surfaces, mirrored arrow/date/label/title alignment, and a living `/hitoDS` reference example.

## 2026-05-10

- Applied the next Hito design-system rollout slice to preserved secondary surfaces: `/progress`, `/body`, and `/integrations` now use shared low-card surfaces, grouped rows, buttons, fields, and compact status treatment where they fit, while workout-detail preview support uses the same status/surface primitives.
- Simplified the home surface divider rhythm: pace guidance now sits inline with the workout subtitle, right-side Planning Note and Week Status no longer have extra top divider lines, calendar controls are no longer boxed by a top grid divider, and one shared divider now separates the hero from the calendar section.
- Fixed the remaining Safari-visible home/calendar DS regressions: prose pace guidance no longer renders as a large hero metric value, and week cards no longer duplicate status markers in the narrow footer area.
- Corrected the latest home design-system rollout by removing the reintroduced large card treatment from the Today hero and calendar frame, softening the right-side support area into divided rows, making today read through outline treatment, and replacing weekly per-day status pills with compact check/dash/cross markers.
- Applied the Hito component primitives to core runner-facing surfaces: home support panels now use grouped rows and status pills, calendar controls use shared tabs/buttons/status treatment, and workout detail uses shared metric, tab, grouped-row, and status-pill primitives for hero stats, right-side support, and result state.
- Implemented the first Hito component-system slice by adding shared tiered button variants, tiered field and textarea sizing, helper/error/success text styles, grouped row primitives, metric rows, and compact status pills; applying them to auth, onboarding, advanced import, shell chrome, and refreshing `/hitoDS` to demonstrate the real primitives.
- Implemented the first Hito design-system rollout slice by adding shared low-card surface, field, button, tab, label, and divider primitives; applying them to auth, onboarding, advanced import, and shell chrome; and adding `/hitoDS` as an internal living reference page with the existing left navigation.
- Fixed advanced `training-plan-v2` apply reliability so a successful saved-mode import no longer falls through into a generic client-side `Load failed`; the flow now exits through a fresh home reload and keeps apply-time failures specific.
- Strengthened the canonical JSON template by adding a reserved `_ml_agent_template` instruction block, and updated the import seam to accept that block as ignored template metadata instead of runtime truth.
- Fixed the text-first onboarding post-submit transition so successful plan creation automatically opens the saved-mode home route through a fresh document request instead of leaving the current setup screen stuck in its pending state.

## 2026-05-09

- Disabled localhost-origin Magic Link delivery on loopback local runtimes unless a real public `APP_BASE_URL` is configured, so `/login` no longer offers or sends broken email sign-in links that point back to `localhost`.
- Fixed the first-day conflict resolution submit crash so actionable `Replace first day` and `Ignore first day` choices now complete through the canonical backend apply seam instead of failing on a lost active-plan persistence context, while blocked history-detachment paths remain honestly blocked.
- Restored the visible text-first plan creation path for authenticated no-plan/no-workout states by reusing the primary onboarding surface and making the plan text area visually unmistakable while keeping advanced import secondary.
- Fixed auth redirect-origin resolution so deploy-like Magic Link and callback flows no longer trust a loopback `APP_BASE_URL` override and no longer send users back to `localhost:3000`.
- Completed the final Phase 5 legacy-removal slice by deleting deprecated `week_1_preview[]` compatibility from the active runtime, CLI tooling, and visible advanced-import contract, so `training-plan-v2` is now the only supported import format.
- Continued the final Phase 5 deletion window by removing deprecated single-account local auth env support from the active runtime and local tooling, cleaning `.env.example`, and making the accounts-file path the only remaining local bypass input contract.
- Continued the final Phase 5 deletion window by removing `SUPABASE_SERVICE_ROLE_KEY` from the active runtime and CLI env contract, cleaning `.env.example`, and making `SUPABASE_SECRET_KEY` the only documented server-side Supabase admin/write key.
- Started the final Phase 5 deletion window by removing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the active runtime and CLI env contract, cleaning `.env.example`, and making `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` the only documented public Supabase browser env names.
- Continued Phase 5 by quarantining the remaining legacy compatibility: the deprecated `week_1_preview[]` parser and seed mapping now live in dedicated compatibility helpers instead of staying mixed into the canonical `training-plan-v2` import path, and the tester lifecycle tool no longer merges deprecated single-account admin env into the normal accounts-file path when that file already exists.

## 2026-05-08

- Started Phase 5 carefully instead of deleting compatibility outright: `training-plan-v2` is now the explicit canonical file contract in the advanced import surface, legacy `week_1_preview[]` now surfaces as deprecated compatibility, `VITE_APP_NAME` is no longer part of the active runtime env contract, and the tester lifecycle script no longer materializes deprecated single-account local auth env into the canonical accounts file automatically.
- Demoted remaining visible non-primary authoring paths for the Phase 4 cleanup slice: no-plan setup and shell copy now present text-first plan creation as the primary product path, while JSON stays available only as an advanced import/fallback for existing Hito plan files, migration, and testing.
- Removed the production-facing local credentials path from deploy-visible auth: loopback local runtimes may still use the temporary bypass for development, but deploy-like requests now expose only the real email auth surface and `/api/auth/local-login` no longer behaves like a product login path there.
- Fixed the first richer-plan truth leaks after Phase 3: the live `training-plan-v2` validator and normalizer now accept the fuller segment DSL used by the richer reference files, route-facing target rendering suppresses opaque structured metadata instead of leaking `[object Object]`, and richer imported `intervals` workouts keep an honest visible interval identity instead of collapsing to easy-run labeling.
- Tightened canonical persisted richer-plan truth without adding a second runtime model: `plan_cycles` now preserves `schema_version`, `source_kind`, `target_date`, `goal_metadata`, and `plan_preferences`, while `planned_workouts` now preserves source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority across JSON import, structured authoring, and OpenAI text authoring.
- Removed fresh-write target alias duplication from richer plan normalization so new persisted `steps jsonb` rows keep only canonical target keys such as `hr_bpm_range` and `pace_min_per_km_range`, while older rows remain read-compatible.
- Removed preview-derived active-plan bootstrap from the authenticated saved-mode seam so accounts without an active plan now stay honestly in setup until text authoring, structured authoring, or advanced JSON import creates canonical persisted plan truth.

## 2026-05-07

- Removed `src/lib/local-auth-store.ts` from the authenticated saved-mode path so local auth now acts only as a temporary identity bridge, while all authenticated saved-mode reads, plan writes, and workout-log writes resolve through the canonical Supabase seam.
- Removed the now-dead `temporary_local` saved-mode backend branch and the obsolete local fallback state-file contract from the active runtime and tester lifecycle tooling.

- Simplified the text-first onboarding and `Upload JSON` surfaces by removing nested card chrome, flattening the advanced import layout, swapping the no-plan header CTA to `Create a Plan`, and removing the visible backend label from the home shell status area.
- Replaced the visible JSON-first onboarding entry on `/` with a compact text-first request surface wired into the live OpenAI-backed `completeTextOnboarding` seam, while keeping `Upload JSON` available as a secondary advanced fallback path.
- Added the first OpenAI-backed text-to-plan backend slice: the service now accepts one bounded free-text request, asks OpenAI for structured authoring input, validates that model output deterministically, generates canonical `training-plan-v2` plan data server-side, and persists it through the same Supabase `plan_cycles` plus `planned_workouts` seam as JSON import and structured authoring.
- Added the first structured plan-authoring backend slice: the service now accepts one bounded structured input contract, generates canonical `training-plan-v2` plan data server-side, persists it through the same Supabase `plan_cycles` plus `planned_workouts` seam as JSON import, and exposes a narrow `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>` ops path for validation before the frontend wizard exists.
- Fixed the remaining first-pass `training-plan-v2` rendering-truth gaps by keeping distance-first interval reps distance-first in workout structure UI, resolving tempo-backed quality workouts to a visible `Tempo` identity on home and workout detail, and rounding visible distance totals through one shared formatter instead of leaking floating precision.
- Tightened the live `training-plan-v2` import seam toward the approved template contract by preserving canonical segment metadata and prescription structure inside `planned_workouts.steps jsonb`, keeping bounded target keys, and normalizing both interval-by-distance and interval-by-time into the same repeat-unit DSL without adding a second storage path.
- Added the first viable `training-plan-v2` integration slice so both the legacy `week_1_preview[]` import and the richer `training-plan-v2` import now validate and normalize into the same canonical `plan_cycles` plus `planned_workouts` seam, with richer segment structure persisted in `planned_workouts.steps jsonb` and current saved-mode home plus workout-detail rendering reading the v2-backed rows through the unchanged snapshot seam.
- Finished the remaining upload-flow/template UI slice by adding a real `Download template` affordance in `Upload JSON`, shipping a static future `training-plan-v2` template artifact, and clarifying that current applied imports still use the legacy `week_1_preview[]` shape.
- Implemented the first workout-page refinement pass: preserved the three-block workout-detail layout, added richer surface treatment, surfaced check/dash/cross saved-result markers, changed `Week Status` into a progress-driven completed-workouts bar, and added an honest placeholder-only `Upload result` seam in the log-result notes area.
- Hardened saved-mode home return navigation so shell links reopen `/` through a fresh request, and fixed the grouped `Tomorrow` summary so interval-style workouts no longer render broken `nullkm · 0′` text.
- Refined the saved-mode Calendar page so the main `Today` workout card stays intact, the right-side support content is now one grouped card with dividers, the lower hero metadata strip is removed, and completed days are easier to spot in the calendar grid.

## 2026-05-06

- Repaired the live saved-mode `Upload JSON` continuity seam so already-orphaned workout logs from older broken replacements are recovered onto the active matching plan before same-template preserve or mismatch-block checks run.
- Fixed the saved-mode `Upload JSON` replace contract so logged workout history now carries forward only for exact deterministic workout matches on logged dates; unsafe replacements are rejected before apply instead of silently resetting visible progress.
- Added `npm run test-user -- ...` as the canonical tester-account lifecycle path, including create, reset, optional plan seeding, and delete against the real Supabase auth/data model, and documented the exact contract in `docs/process/test-user-lifecycle.md`.
- Tightened the saved-mode shell and workout detail UI: the sidebar profile trigger now shows runner name plus active plan, owns `Upload JSON` and sign-out, and rest-day detail now stays sparse with a grouped right-side context panel and calmer fueling surface.
- Switched local multi-tester credentials toward one ignored accounts file path so newly created tester accounts can use the visible username/password login without dashboard-only setup.
- Applied the base persisted Supabase migration to the linked `dltfjwexyctmihclcjqj` project, imported `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json` as the active canonical plan for the current local admin path, and verified saved-mode SSR now resolves `/progress` and `/workout/2026-05-08` from Supabase.
- Simplified the local-auth-to-Supabase cutover path to resolve the temporary local account into `auth.users` by email and import directly into the existing canonical tables, removing the extra mapping/snapshot schema dependency from the live cutover flow.
- Added a canonical Supabase plan-import path for the JSON-first onboarding flow, including local-account-to-Supabase-user mapping, raw imported JSON snapshots, and a narrow current-plan import script for `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json`.
- Switched the temporary local bypass to prefer Supabase-backed plan reads and workout-log writes whenever a server-side Supabase key is configured, while keeping the local state file only as a fallback when that key is absent.
- Replaced the old Cloudflare-oriented build shape with a Nitro-backed Vercel deployment path so the app now builds into `.output/` locally and `.vercel/output/` under `vercel build`.
- Removed the canonical Worker/Wrangler deploy shape from the repo and documented the Vercel env contract, including that the temporary local auth bypass must stay disabled on Vercel.
- Fixed a local auth regression where `npm run start` did not load `.env.local`, causing the built server path to miss the temporary admin credentials even though `vite dev` still worked.
- Added a temporary local-only single-user auth bypass behind env-backed credentials and an httpOnly cookie so one local runner can enter saved mode without Magic Link delivery.
- Refined the temporary local auth path into a small local account model, made username/password login the clearly visible primary path, moved the real admin credential source into an untracked local accounts file, and kept Magic Link available as a secondary option.
- Added a temporary local saved-mode store used only by the bypass path so onboarding, plan assignment, workout logging, and backend-derived week status can still be exercised without widening client-side mock truth.
- Fixed the auth runtime contract so magic-link callbacks and login redirects resolve against the live app origin instead of silently falling back to `localhost:3000`, with `APP_BASE_URL` kept as an optional server-only override.
- Fixed `/login?next=...` shell CTA behavior so `Save with login` preserves the original safe destination instead of nesting `/login` into `next`.
- Polished `/login` into an intentional magic-link surface with clearer send, success, callback-error, and retry states while preserving the imported shell and motion language.
- Upgraded authenticated onboarding into a compact two-step setup flow with clearer submission and completion feedback before returning to the weekly plan.
- Replaced the preview-first unauthenticated root with a login-first `Hito.` entry surface, added a password visibility toggle to the temporary local login form, and kept the existing local single-user auth path intact.
- Replaced the old goal/baseline onboarding wizard with a JSON-first onboarding flow that validates the observed uploaded template shape and creates the saved calendar directly from the imported week.
- Tightened `/`, `/workout/$date`, and `/progress` edge-state messaging with explicit pending, error, empty, setup-required, and no-plan states.
- Improved workout logging feedback so preview-only drafts, persisted saves, overwrite edits, and save failures are clearly distinguished inside the preserved completion panel.
- Fixed the saved-mode workout logging flow so `partial` and `skipped` outcomes persist truthfully, completed results can be overwritten to either state, skipped reloads no longer backfill planned metrics as actuals, and route-level week status follows the saved truth after reload.
- Replaced the remaining frozen home/calendar date assumption with the real runtime local date, removed stale preview-date caching, and added an explicit home state for days outside the current plan window.
- Made preview routes boot without real Supabase env values by falling back to signed-out preview auth context, while keeping live auth and persisted verification dependent on real Supabase configuration.
- Added honest signed-in copy that JSON export is a later capability, not a live feature in the current slice.
- Fixed the Supabase-backed saved workout overwrite path so a reloaded saved result becomes dirty again on outcome, notes, and actual-metric edits, and overwrite now targets the existing `workout_logs` row through `planned_workout_id` instead of leaving the CTA stuck in a false saved state.

## 2026-05-05

- Imported the `adaptive-run-coach` TanStack Start frontend baseline into the repo root as the only app runtime.
- Preserved the route structure, shell, planning layout, workout detail hierarchy, and interaction patterns from the imported baseline.
- Rebranded visible product copy and metadata from `Stride`/`Lovable` to `Hito Running`.
- Reworked `/progress`, `/body`, and `/integrations` into explicit preview shells instead of fake connected capability surfaces.
- Tightened the single mock seam in `src/lib/training.ts` and added `.env.example` for the current phase contract.
- Added Supabase foundation, including env contract hardening, request auth middleware, magic-link login, and auth callback handling.
- Added the persisted backend schema for `runner_profile`, `plan_cycle`, `planned_workout`, and `workout_log` with RLS and lifecycle triggers.
- Replaced deterministic mock plan status with one canonical preview-or-persisted seam and backend-derived week status for saved mode.
- Wired onboarding, persisted plan assignment, workout-log upsert, and progress aggregates into the preserved frontend route structure without route churn.
