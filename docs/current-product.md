# Current Product

## Product Role

The implemented product is now a hybrid running-plan experience for Hito Running:

- signed-out users now enter through a login-first screen instead of landing in the calendar as the primary experience
- signed-in users can create a real profile, receive a persisted plan, log workouts, and see backend-derived weekly status
- the current local unblock path keeps a temporary local account login only for loopback development, while deploy-visible auth now exposes only the real email path and authenticated plan truth resolves through Supabase

The product still avoids claims of live coaching, connected integrations, weather-aware adaptation, or personalized biometric authority; any age-estimated heart-rate guidance is labelled as default, not personal zone truth.

The first Basic/Pro entitlement foundation is backend-owned but pre-billing:

- users without an explicit entitlement row still resolve as effective `Pro`, so current real users keep access
- explicit `Basic` rows can enforce the first AI boundaries later
- no Stripe, billing, pricing, or subscription UI is live in this slice

## Main User Surfaces

- public destination hub `/hub`
  is a standalone launcher, not a dashboard; it uses the Hito login/desert visual treatment and links to Hito Running, Admin analytics, the Design system, and the Changelog while leaving each destination route to enforce its own auth behavior
- home `/`
  shows either:
  login-first unauthenticated entry
  setup gate for authenticated users without a profile
  persisted weekly plan for authenticated users with setup complete, keeping the large `Today` hierarchy as a lighter open header, one compact right-side support module, and the calendar below
- workout detail `/workout/$date`
  shows workout structure, logging controls, and week-status context using preview or persisted truth through one shared contract, with calmer rest-day presentation, a tighter grouped right-side panel, richer workout surfaces, and visible result-state markers for completed, partial, and skipped truth
- progress `/progress`
  is now a smaller summary route, reading persisted completion and volume aggregates when saved mode is active while keeping weekly volume and recent consistency visible without implying a mature analytics dashboard
- integrations `/integrations`
  stays a preserved status/reference utility, but no longer appears as a primary runner navigation destination; it remains reachable through quieter shell access and uses honest live/later wording: the live Garmin-enabled workout feedback path points to workout-detail `Feedback`, while screenshot import and broader plan adjustments remain clearly later
- login `/login`
  provides the current `Hito.` login-first surface, where loopback local development may still show temporary username/password login, while email sign-in appears only when the runtime can resolve a real non-loopback app URL for auth callbacks and the Supabase-hosted passwordless email path can return through the SSR callback route
- internal design-system reference `/hitoDS`
  uses a dedicated design-system sidebar and compact reference surface to document the simplified live Hito product language: semantic and primitive color tabs, canonical typography roles, the Hito icon registry, open route rhythm, divider-based grouping, restrained markers, quiet support copy, utility/disclosure patterns, bounded modal anatomy, controls, shell navigation, calendar/workout day specimen states, and documented visualization geometry exceptions; the calendar/workout playground is static display only, with future manual-workout states shown as visual specimens rather than shipped CRUD, recurrence, or production route wiring, and it shares the presentational `HitoCalendarDayCell` / `HitoWorkoutDayRow` visual seam with the real product calendar while product route links, tooltips, feedback routing, and backend-shaped schedule truth stay product-owned; `/hitoDS` is the internal reference baseline for future UI inspection and primitive extension, not a runner-facing capability

## Interaction Contracts

- month and week switching remain interactive
- calendar hover and navigation behaviors remain preserved
- workout-detail tabs remain interactive
- workout-detail tab selection now follows the route search so direct `?tab=complete` entry and reload stay aligned with the visible logging surface
- the unauthenticated root experience is now login-first instead of preview-first
- completion logging controls stay available in both modes:
  preview mode remains local-only
  saved mode persists through the backend seam
- preview surfaces continue using explicit language such as `Preview`, `Later`, and `Not connected`

## Workflow And Status Behavior

- signed-out users open into a minimal auth-first entry surface with `Hito.` branding
- authenticated users without setup complete are gated into a compact structured first-plan constructor on `/`
- the primary onboarding surface now collects required profile basics, one bounded fitness benchmark, fixed rest days, goal distance/style, conditional target and terrain context, strength/mobility preference, and one optional supporting comment before creating the first saved plan
- if a signed-in user has no active saved plan yet, the app now stays honestly in that setup state instead of silently assigning a preview-derived plan
- setup-required accounts now see `Create a Plan` in the home header where saved-mode accounts see `Open plan`
- the backend now also supports one first-pass free-text authoring seam:
  one user message is turned into validated canonical plan data server-side through OpenAI before the saved weekly plan opens; the saved-mode text replacement action explicitly opts into a separate rich workout-structure draft after structured intent validates, but backend normalization remains the only path to persisted `training-plan-v2` truth and falls back to the deterministic generator if the draft is unsafe or malformed
- the backend now also supports one first-pass voice-to-plan transcript draft seam:
  a confirmed transcript can be checked against `voice_to_plan`, validated for bounded length/usefulness and essential planning truth, and returned as either `clarification_required` with missing fields/questions or `draft_ready` with a runner-facing review of what Hito understood and the broad plan shape
  when Hito proposes a different goal style than an obvious dictated cue, such as changing balanced to relaxed, the review assumptions now call out that style change before the runner can confirm creation
  target-time voice drafts also call out when benchmark support is missing or the requested target looks aggressive instead of implying unsupported pace specificity
  transcript review is non-mutating; the separate explicit `confirmVoiceToPlanDraft` backend action creates a first active plan only after confirmation, rechecks entitlement, blocks if an active plan already exists, and still does not persist the raw transcript
  the no-plan onboarding surface now exposes this as a compact Pro `AI setup` assist above the structured constructor: the runner pastes or types what they would say out loud, asks Hito to review it, sees either missing-detail clarification or a `draft_ready` review, and only `Yes, create plan` calls the mutating confirm action
  this first UI slice still has no microphone UI, no raw audio upload, no transcript persistence as profile truth, no usage counting, and no silent plan creation or replacement
- the visible onboarding UI now consumes the structured first-plan constructor contract:
  profile measurements, progressive training preferences, one bounded fitness-level benchmark, goal distance/style/target, conditional terrain focus, strength preference, and an optional supporting comment can be submitted through one authenticated draft action
  the shared preference controls reveal fixed rest days first, then default running-days/week, then optional preferred long-run day, with fixed rest days disabled in the long-run selector and `No fixed rest days` as an explicit state
  the constructor pre-fills saved runner profile data and training preferences when available, but the runner can edit those values before draft review; the backend derives actual training weekdays through the shared runner training-preference contract, preserves fixed rest days as plan-level weekday invariant truth, and persists age/weight/height plus stable weekly defaults as runner profile fields after the runner confirms a reviewed draft
  age, weight, and height are required in the backend contract; goal distance now includes ultra marathon and mountain running, terrain defaults to standard unless a relevant goal supplies it, mountain running normalizes to mountain terrain, and target time/date context only affects target-time goals
  the visible constructor now includes compact execution-mode choices for how the runner expects to follow workouts; backend generation treats missing/no/unknown execution support as correction-required for primary structured output instead of silently creating vague effort-only plans, and this context stays generation-only rather than permanent profile truth
  terrain focus can influence rolling or mountain/trail-oriented workouts without creating exact elevation targets or route matching; mountain plans now include bounded technical-terrain caution, controlled descents/downhill durability, hike-run or power-hike allowance, climbing/rolling hill work, and time-on-feet long-run cues while taper reduces terrain stress, generated plans carry exact session identity for 5K short sharpening or strides, 10K rhythm intervals, half-marathon threshold durability, marathon steady specificity, ultra time-on-feet durability, tempo, interval, progression, hill, cutback, taper tune-up, and long-run steady-finish sessions inside the existing workout structure, AI-authored blueprint plans now select those identities through a backend-owned goal-family matrix so beginner/low-support plans stay conservative, supported 5K/10K/half-marathon target-time plans keep week-aware quality rhythm, supported balanced half-marathon plans require moderate half-specific rhythm from early weeks without target-time intensity, marathon plans show marathon-steady durability, ultra plans show time-on-feet/hike-run durability, and mountain/trail plans show terrain/downhill/climbing specificity instead of only support-run filler, half/marathon/ultra/mountain goals now use goal-family long-run progression with meaningful cutback and taper behavior, taper-labeled weeks are kept below the pre-taper peak long run, only the custom recent-5K benchmark can produce broad runner-level pace targets when execution mode says the runner can follow watch/app pace guidance, target time alone is not pace truth, and executable HR targets require personal HR-zone truth rather than age-estimated defaults; benchmark, terrain, target, execution mode, and optional comment context are treated only as bounded generation nuance rather than raw profile truth
  newly created generated plans now also keep bounded plan-scoped authoring truth for future refresh, including goal style/target-time intent, target date, benchmark truth, execution mode, rest-day/long-run preferences, and metric-policy/review assumptions, while raw optional comments or transcripts are not persisted
  generated `training-plan-v2` workouts now also carry additive backend-owned rich workout contract fields for family, exact identity, calendar icon key, goal context, and metric mode; saved-mode calendar and shared glyph rendering prefer that backend family/icon truth first, while old compact `workout_type` and `source_workout_type` remain compatible through fallback
  normal longer easy, steady, cutback, taper, and long support runs are structured with clear opener/main/finish or equivalent purpose cues instead of defaulting to one anonymous main block; when pace/HR truth is unavailable, allowed support families use `structure_only_executable` numeric duration/distance/repeat/recovery anatomy rather than fake precision or cue-only prose, and low-support balanced marathon plans can vary safe recovery/cutback support identity without adding extra hard days
  for marathon, ultra, and mountain goals, review assumptions now explicitly label low-support contexts as conservative, finish-oriented, or durability-limited when weekly frequency, benchmark support, current-load truth, target-time pressure, or timeline support is not strong enough for confident race-specific language
  manual Quick setup now follows blueprint-only review-before-create: `generateStructuredFirstPlanDraft` returns inline corrections, a non-mutating runner-facing review modal for accepted `ai_first_plan_blueprint_v1` drafts, or a clear retry/failure state when AI blueprint authoring is unavailable or invalid; it no longer silently reviews deterministic `structured_authoring_v1` fallback plans for structured onboarding, and `confirmStructuredFirstPlanDraft` is the explicit create seam that revalidates the reviewed draft, blocks existing active plans, and persists only after the modal primary confirmation
- advanced JSON upload remains available as a secondary fallback path for existing plan artifacts, migration, and testing
- the temporary local login path behaves as signed-in saved mode for configured local accounts only on loopback local runtimes and uses Supabase as the only authenticated plan store; those same loopback local runtimes no longer offer email magic links unless a real public `APP_BASE_URL` is configured
- a local-only admin `Test accounts` section now exists at `/admin/analytics`:
  local admins in local-auth bypass runtime can list tester/admin entries from the local accounts file, see only those local plaintext test passwords, inspect linked Supabase identity status, and delete tester accounts only after exact email confirmation while protected admin accounts remain blocked; this is not production credential or user management
- `/admin/analytics` now renders Phase 1 internal analytics from the backend view model:
  Overview, Funnel & Usage, Feedback, AI & Entitlements, and Users tabs summarize existing Supabase truth without adding telemetry tables, inventing charts, exposing sensitive raw payloads, or replacing the local-only Test accounts section; backend-owned classification now keeps local, admin, QA, disposable, and suspected test accounts out of real-user product counts and the Users table, while Test accounts shows those excluded rows in Hito table controls with collapsed search, active-filter summary, DS-owned sortable/non-sortable header states, header sort/filter menus, and contained horizontal scrolling
- `/admin/capture` now provides the first visible admin capture backlog:
  verified admin sessions can review text-only captured items and quick notes, filter/search by backend fields, open inline detail, update status/type/priority/target role, append notes, archive items by status, create/delete manual quick notes, and copy deterministic manual Codex handoff prompts; the backend also exposes a bounded admin debug/capture capability probe for a future route-spanning overlay, authorized only from admin session truth and not from runner/tester/product auth; normal runner/tester/public sessions cannot access backlog truth, screenshot upload and route-spanning capture overlay remain later slices, and no item is automatically sent to Codex
- repo-authored Hito work can now be explicitly mirrored into the same admin Backlog:
  `npm run import-admin-backlog-work-items` scans approved markdown task/spec/brief/plan folders and upserts bounded indexed rows into `admin_capture_items`; when docs provide canonical sections for status, type, priority, next recommended role, task, stage, and exact handoff prompt, those values drive the mirrored admin fields and copied prompt, with the first `Task` line shown as the human-readable Backlog title while source path stays metadata; older archive docs are imported conservatively with missing-metadata markers; the importer reports repo-derived mirror rows whose markdown source path no longer exists and can archive those stale mirrors only through explicit `--archive-stale`; repo-derived rows are read-only through admin mutation actions, markdown remains canonical for those repo-authored items, Supabase remains canonical for admin-created quick notes/captures, and there is still no automatic two-way sync or Codex dispatch
- `/admin/login` now provides a dedicated owner admin sign-in page:
  local/dev admin login can still use the protected local fixture, but both local fixture and deployed/runtime admin login now create signed admin-only `hito_admin_session` access for admin surfaces; valid tester/product credentials are refused with an admin-specific error instead of creating a normal product session, redirects stay limited to sanitized admin paths, admin surfaces use explicit `/api/admin/auth/logout`, and normal `/login`, Magic Link, product local-login, and runner/product logout behavior remain separate; `/admin/analytics` admin-required states now point to this admin login path
- onboarding keeps the structured constructor as the reliable primary setup path while placing the compact Pro AI assist above it, and keeps JSON import visibly demoted as an advanced fallback for existing Hito plan files
- `/settings` now separates `Personal data` from `Training preferences` with Hito tabs; personal age/height/weight use the same editable value chips as Quick setup, the personal page shows default estimated heart-rate starting ranges when profile age supports them while clearly labelling them as non-personalized, and training preferences use the same weekday choice rhythm as plan creation to save fixed rest days, default running-days/week, and preferred long-run day as future-plan defaults only, with backend validation preventing impossible rest-day and long-run combinations
- the backend-owned training-preference contract now uses one mapping between runner-facing names and storage truth:
  `fixedRestDays`, `defaultRunningDaysPerWeek`, and `preferredLongRunDay` map to stored `blocked_days`, `max_running_days_per_week`, and `preferred_long_run_day`; zero fixed rest days is valid, all seven fixed rest days is blocked, default running days must fit the available weekdays, and the default long-run fallback is Sunday, then Saturday, then the latest available weekday without being stored as an explicit preference
- authenticated no-plan or no-workout states now render the same visible structured plan creation surface instead of stranding users on a retry-only empty state
- the internal structured authoring slice remains backend-only:
  it validates goal, schedule, runner basics, recent result context, available days, constraints, preferences, and execution mode, then generates one canonical `training-plan-v2` plan into the same persisted saved-mode seam without changing routes; generated workout details now avoid generic interval labels by carrying exact session identity, phase-aware Base/Build/Specific/Taper workout choices, cutback-week simplification, credible long-run progression for longer goals, and appropriate later long-run steady-finish structure while keeping compact calendar families stable
- the first OpenAI-backed text authoring slice is also backend-only for now:
  it treats the user message as intent only, asks OpenAI for bounded structured authoring input using the same expanded goal, terrain, execution-mode, and recent-benchmark contract as structured setup, validates that output, then the saved-mode text replacement action opts into a second bounded rich workout draft that must pass backend taxonomy, rest-day, segment-structure, and metric-safety normalization before persistence; default helper usage and Dictate-to-Plan stay deterministic until their own rich-drafting slices
- setup writes one profile and creates one active plan only after the structured constructor or AI setup draft is explicitly confirmed, with JSON import retained only as an advanced fallback
- applying a generated or imported plan now uses one shared backend start-date policy:
  explicit future starts are preserved, past or non-future starts normalize to today, and the plan is persisted only after those effective dates are resolved
- saved-mode JSON import can now use one explicit chosen start day as the apply authority:
  when the caller sends that date, day 1 of the uploaded plan is intended for the chosen day, the source file’s `start_date` becomes metadata, and the backend shifts the plan block plus target date consistently
- saved-mode JSON import surfaces now ask for that chosen start day before apply, using one date input plus small Today / Tomorrow / Next week shortcuts while leaving all schedule mapping to the backend
- when the backend already knows fixed weekday off-days from saved plan preferences or imported metadata, those off-days now override simple day-by-day replay:
  a chosen start on a blocked weekday is rejected, and imported workouts are placed in their original non-rest sequence across allowed training weekdays while blocked weekdays remain rest days
- if the applied plan would start on a chosen date with a workout while that date already has a saved planned workout, the default product behavior is now the safe one:
  keep the existing workout on that date, skip the incoming first day, and start the imported original day 2 the following day
- replacing the chosen start day is now the only explicit override:
  `Replace first day` keeps incoming day 1 on the chosen start date, but it remains destructive and cannot bypass saved-history continuity protection
- the visible apply UX now follows that same backend truth:
  normal text-first and JSON apply no longer stop on a preserve-vs-ignore chooser
  safe apply keeps any existing workout on the chosen start date and starts the rest the following day
  and the replace action remains available only as an explicit destructive override behind a quieter disclosure
- saved mode now has a backend-owned plan deletion meaning:
  `Delete plan` archives the current active plan, preserves planned-workout/log history under that archived plan, removes the active schedule from saved-mode view, and returns the runner to the same no-plan creation state
- saved mode now also has a backend-owned `Clear upcoming schedule` meaning:
  it is the one-action way to remove today and future planned schedule before starting a later new plan, while preserving past history and any logged truth, including logged truth from today, under archived plan history
  the v1 model archives the active plan and returns to no-plan state rather than keeping a half-active truncated plan, because that is the smallest clean lifecycle state before create/import
- saved mode now exposes that lifecycle through one compact `Open plan` modal:
  it summarizes the active plan, offers text-first plan replacement as the primary path, keeps JSON import as an advanced path with a chosen start day, exposes `Clear upcoming schedule` as a confirmed secondary action for removing the active upcoming schedule while preserving history, and keeps `Delete plan` in a quieter destructive section
- later-starting saved-mode JSON import can also opt into clearing the previous upcoming schedule before apply:
  the UI calls the backend clear-upcoming lifecycle first, then applies the validated imported plan through the same requested-start-date seam, without per-day schedule editing
- the backend now owns the first active-plan export model for the upcoming `Open plan` export action:
  JSON export is shaped as canonical `training-plan-v2` truth using the active saved schedule dates, now including rich workout family, exact identity, calendar icon key, goal context, and metric mode; Markdown export is derived from the same payload for readable sharing with a compact workout focus line, and both omit completion, Garmin, comparison, AI, and other runtime-only saved-mode state
  visible export controls and PDF remain later slices
- home and calendar now default to the real current day instead of a frozen demo start date
- today&apos;s workout can be opened from home or calendar cells, and the user can still manually open any other planned day
- when today falls outside the current plan window, home now says so explicitly instead of silently dropping the hero
- the home support column now keeps a dismissible planning or plan-window note plus next/nearest workout context, while week status stays in the top/header treatment instead of being repeated in the side support area
- the visible home shell chrome now keeps `Week` status but no longer shows a technical backend label
- the sidebar plan note can be dismissed for the current UI session, and the sidebar no longer repeats the same week status pill already present in the header
- saved-mode shell links that return to home now intentionally reopen `/` through a fresh request so the calendar page stays reliable even from long-lived tabs
- completed calendar days now read more clearly at a glance through a green confirmation treatment without overriding the primary today highlight
- home/calendar now uses a lighter scan rhythm:
  month cells carry date, completion truth, one distinct tiny workout-type glyph, one short workout-type label, the compact workout title, and a secondary feedback/evidence cue without inline distance, duration, target data, or dashboard clutter
  the current distinct glyph set covers Easy, Recovery, Steady, Long, Tempo, Intervals, Progression, Race, Hills, Trail, legacy Quality, and Rest while preserving the existing easy, long, quality, and rest color families
  desktop and tablet month view keep the seven-column calendar grid, while narrow month view uses a vertical day list so dates, workout type, title, status, and feedback cues remain readable without horizontal squeeze
  workout hover/focus tooltips are viewport-contained so edge cells do not push tooltip content off-screen
- saved workout logging now distinguishes preview-only drafts from persisted saves, supports truthful overwrite between `completed`, `partial`, and `skipped`, and surfaces pending, success, and failure feedback without hiding backend failures
- saved workout logging now also supports workout-linked body notes as part of the saved result:
  body notes persist with the specific workout log, reload with that workout, open from a focused modal inside `Log result`, and stay out of plan-adjustment truth while optionally informing Garmin feedback only as bounded caution context
- legacy `/body` links now redirect to `/`:
  body notes no longer exist as a standalone product surface, so the most truthful recovery path is back into the runner's current plan and workout flow
- saved-mode user settings now have bounded persisted profile fields for identity, avatar metadata, age, weight, and height, resolved through the same saved runner identity used by the calendar and workout routes
- saved runner profiles now also have a backend-owned training preference slot for stable defaults such as fixed rest days, preferred long-run day, and default running days per week; the current backend can read and save those preferences without mutating the active plan, and the shared contract prevents settings and first-plan setup from drifting into different scheduling rules
- the workout-detail `Week Status` surface is now progress-based and reports completed non-rest workouts in the current week
- workout detail now separates manual `Log result` from `Feedback`: `Log result` stays focused on completion truth, notes, and manual actuals, while `Feedback` owns the live Garmin `.fit` / `.zip` upload path, parsed evidence summary, and deterministic planned-vs-actual comparison readback
- the workout-detail feedback surface now reads in plain language for normal runners:
  it explains that upload compares the planned workout with the uploaded run, keeps factual `Plan vs run` comparison above the bounded recommendation, and uses a lighter divided hierarchy instead of stacked nested cards
- the near-upload area inside `Feedback` now gives one compact state-aware payoff summary:
  before upload it explains what FIT/ZIP unlocks
  after upload it tells the runner whether the file was attached, the run was processed, the factual comparison is ready, or the recommendation is available
  and failed parses stay honest without sounding like backend diagnostics
- when Garmin evidence is attached, `Feedback` now shows the specific attached file clearly and lets the runner remove that Garmin evidence without changing the manual workout log
- `Log result` now includes a richer state-aware Garmin invitation into `Feedback`:
  before upload it explains the payoff of adding a Garmin file
  after evidence exists it turns into a continuation path for reviewing deeper feedback
  and it now reads as a lighter divided continuation row instead of a competing promo-style block
- the Garmin picker keeps Safari-compatible file selection by validating `.fit` and `.zip` after selection instead of relying on native MIME filtering
- the first deterministic Garmin comparison slice currently compares only backend-trustworthy facts:
  planned workout date vs Garmin local date
  planned duration vs actual duration
  explicit planned distance vs actual distance when the plan defines explicit distance truth
  structured-step count only when the planned workout shape is simple enough to compare honestly
- the visible comparison readback is intentionally factual rather than coach-like:
  it shows conservative matched or unclear states, evidence completeness, and a bounded confidence value before any future AI analysis exists
- the saved-mode readback now also exposes richer structured comparison facts without turning into AI commentary:
  signal-by-signal date, duration, distance, and structured-step statuses
  explicit `not applicable` and `missing actual` reasons
  honest delta and tolerance context where the metric supports it
  a deterministic support matrix that says which signals were compared, missing, not applicable, or unsupported
  ordered step-summary and warm-up/main/cooldown-style segment-group summaries when the planned and actual steps can be aligned honestly
  and explicit unsupported states for pace and heart-rate comparison until those metrics have one normalized comparable contract
- the current Garmin `Feedback` surface now also shows one bounded AI interpretation layer after a successful Garmin-backed comparison:
  it explains the most important matched or mismatched facts, gives one conservative next-workout recommendation, and keeps deterministic comparison visibly primary instead of replacing it
  that recommendation block now leads with one runner-facing next-step note, keeps supporting explanation below it, and expresses caution in plainer language when the evidence is mixed
- the detailed `Feedback` readback is now calmer and more human:
  coverage, confidence, and checks read in one quieter summary strip
  signal rows use lighter divided layout instead of boxed tiles
  and planned target labels such as effort, pace, and notes now read in more normal runner-facing language
- when Garmin evidence is already attached, `Feedback` now opens in a loaded attached-first review state:
  the top of the surface shows the attached file instead of repeating upload-first framing
  `Plan vs run` becomes the strongest loaded-state section with the final comparison verdict beside it
  recommendation remains below it as a calmer bounded note
- the saved-mode home/calendar backend seam now knows one bounded Garmin feedback-marker summary for each workout day:
  `evidence_attached` when Garmin evidence exists
  `feedback_ready` when deterministic Garmin-backed feedback exists
- saved-mode home and calendar now render those markers as small secondary evidence cues:
  `Evidence` for attached Garmin evidence
  `Feedback` when the detailed `Feedback` tab is ready
  and those cues route into the existing workout-detail `Feedback` tab without competing with completion-status semantics
- that AI layer is intentionally constrained:
  it uses only canonical backend truth from the planned workout, parsed Garmin actual metrics, deterministic comparison payload, current week context, next planned workout summary, and optional workout-scoped body-note context
  it does not parse raw FIT, does not overwrite `workout_logs`, does not silently edit the plan, does not diagnose or give medical advice from body notes, and stays cautious when deterministic evidence is partial or unclear
  visibly broken generated phrases are not shown to the runner; the backend replaces malformed recommendation text with shorter stable fallback copy when needed
  Pro gating applies only to the AI interpretation portion; deterministic Garmin upload, parse, comparison, and feedback readback remain core saved-mode truth when AI interpretation is locked
- the first proposal-only surface for explicit plan refresh now exists inside `Open plan`:
  the backend can build one compact `RunnerCoachContext` from saved profile, active plan, remaining schedule, recent adherence, Garmin comparison signals, actual load, and workout-scoped body-note caution context
  the runner can open a quiet `Update plan` disclosure, enter short intent such as missed days, heavy fatigue, or adjusting the rest of the plan, and review a compact proposal covering why change is suggested, what would change from today forward, what stays fixed, caution context, and the explicit proposal-only boundary
  the proposal review data is now backend-shaped for runners rather than implementation-shaped: raw ids and internal field names are removed, malformed fragments fall back to clean copy, a dedicated `What stays the same` section is always provided, and scope distinguishes the total remaining schedule from the targeted upcoming changes shown in the review
  fixed weekday rest days, when known, now travel through that context as preserved plan truth, appear in the fixed-truth review copy, and are validated before any later explicit refresh apply can persist a replacement plan
  the proposal review now exposes explicit `Apply update` and `Keep current plan` actions: proposal generation builds the exact non-mutating future schedule draft that the runner is reviewing, keeping the plan clears the review without mutation, and applying verifies stale/off-day/draft-checksum truth before archive/replacing the active plan with that reviewed draft rather than regenerating during apply
  stale proposals show an honest stale message and ask the runner to generate a fresh proposal instead of surfacing a generic error
  no plan is silently mutated by viewing or dismissing a proposal
  the backend now checks `ai_plan_update` entitlement before generating a proposal; missing entitlement rows remain effective `Pro`, explicit Basic gets one included successful proposal generation, and applying an approved proposal does not consume another use
- the backend now has the first non-mutating active-plan schedule edit preview contract for a later `Edit schedule` surface:
  same-frequency schedule edits can be previewed as deterministic date moves for future mutable workouts while preserving workout content, steps, rich identity, metric targets, and source metadata; changing weekly running frequency returns a bounded `requires_regeneration` result that should route through the existing active-plan refresh review/apply flow
  the preview treats past/today, logged, Garmin/evidence-backed, comparison-backed, and AI-insight-backed workouts as protected, proves proposed fixed rest days stay empty of non-rest workouts when reflow is possible, and does not update runner Settings defaults or mutate the active plan
  the backend apply seam now consumes the reviewed preview token rather than frontend-provided date moves, rebuilds the current preview before writing, rejects stale/protected/regeneration-required cases, and applies only reviewed future non-rest date metadata plus active-plan schedule preferences in one atomic database operation while keeping workout content and runner Settings defaults unchanged
  the `Open plan` modal now includes `Edit schedule`, where runners see active-plan scheduling preferences when available and can review fixed rest-day, running-day, and long-run day changes before applying; same-frequency changes apply only through the reviewed backend token, while frequency/fit changes copy a suggested prompt into `Update plan` for the existing regeneration review flow
- the first Hito design-system toast primitive now supports those long-running `Open plan` refresh actions:
  `/hitoDS` defines info, working, success, and error toast variants with Safari-stable top-center visibility, inside-toast dismiss anatomy, dismiss-only indeterminate progress for working state, and in-place working-to-success/error resolution; proposal generation and `Apply update` consume one shared action-family toast id so the latest refresh outcome replaces older proposal feedback while validation errors, proposal review, stale explanation, and mutation boundaries stay inline
- week status shown in home, workout detail, and progress is derived from workout logs and current plan state
- signed-in surfaces now expose one quiet `Export` action inside `Open plan`
  it downloads the active saved plan as canonical JSON or readable Markdown from the same backend-owned export truth
  PDF remains deferred
- the runner profile area now shows the current runner name and active plan title, keeps sign-out inside the dropdown, and offers a lightweight advanced JSON plan-replacement flow
- that advanced import replacement flow now preserves saved workout progress only when logged workouts still match the replacement JSON exactly on the logged dates; otherwise the replace action is blocked instead of silently clearing visible progress
- the same advanced import flow now accepts only the canonical `training-plan-v2` file contract, while still ignoring runtime-only v2 fields that do not belong in canonical plan truth
- when that advanced import apply succeeds, the product now returns to saved home through a fresh page load instead of leaving users in a stale in-place route refresh state
- structured imports now persist one clearer segment DSL in saved mode:
  interval-by-distance and interval-by-time both normalize into the same repeat prescription shape, and the existing home plus workout-detail routes keep rendering from that one stored contract
- workout-detail structure rows now have backend-owned execution instructions:
  every newly generated non-rest segment and expanded repeat work/recovery row must carry executable target anatomy through pace, personal HR, mixed metric, or `structure_only_executable` mode; legacy effort/cue-only rows remain readable, while the next frontend cleanup is responsible for removing vague purpose-only readback when executable target data exists
- saved-mode plan truth now also preserves higher-value richer semantics across import, structured authoring, and text authoring without adding a second runtime model:
  target date, goal metadata, plan preferences, source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority all persist into the same canonical Supabase plan rows
- home, calendar, and workout detail now render tempo workouts with a tempo-specific visible identity instead of flattening every quality workout into the same generic label, marathon-specific steady durability work reads as marathon-specific rather than generic steady while keeping a controlled steady glyph, distance-first interval reps keep visible distance-first cues in the workout structure UI, and workout detail now shows backend-owned rich workout identity, metric mode, goal context, segment guidance, cues, and hints instead of static local HR/cadence/fueling advice derived from compact workout type
- richer imported workout detail now renders scalar target truth only, so structured metadata no longer leaks into visible `[object Object]` text
- richer imported interval workouts now keep an honest visible interval identity instead of being mislabeled as easy runs, and compact reference-style plan files without explicit rich fields can preserve tempo, distance/time interval, race-rhythm, taper tune-up, hill, progression, and stride meaning through backend title/segment inference rather than frontend guesswork
- the advanced import flow still includes a lightweight `Download JSON template` affordance for users who already need file-based plan handoff
- the advanced import modal now follows the same stable bounded modal behavior as `Open plan` and `Body notes`, while keeping its own smaller width and import-specific content
- that downloadable template now includes one reserved `_ml_agent_template` instruction block plus rich workout field examples so ML-generated files can target the canonical `training-plan-v2` contract more explicitly without turning template-only guidance into runtime truth or inventing fake pace/HR targets
- rest days now stay intentionally sparse: no workout metrics, no empty targets or note sections, and no fake completion affordance from home
- auth, onboarding, advanced import, shell navigation/profile/menu chrome, home/calendar support areas, workout-detail grouped/status/metric surfaces, route-level setup/empty/error states, progress summary metrics, legends, and bar chrome, body severity micro-UI, preserved integration utility rows, public changelog editorial timeline chrome, launcher/auth/admin atmospheric shells, calendar/workout tooltip chrome, and deeper workout-structure plus completion-log micro-surfaces now share Hito component primitives for canonical typography roles, low-card surfaces, open/divider grouping, tiered controls, helper/error text, grouped rows, metric rows, compact legends, compact tooltips, compact chart notes, comparison-bar fills, editorial date rails, highlight tags, timeline entries, bounded canvas/photo/launch/state/editorial overlay recipes, Hito-native dialog/sheet/menu/select/progress/card/sidebar wrapper defaults, compact severity scales, compact severity summaries, compact status pills, compact status markers, shell nav rows, shell menu rows, disclosure, labels, captions, tabs, and dividers, keeping structured first-plan onboarding primary and advanced JSON import secondary
- the first typography canonicalization pass is implemented for the highest-drift runner-facing surfaces: `Open plan`, saved-mode JSON import, workout `Log result`/`Feedback`, and `User settings` now use shared modal title, panel title, body/body-small, form-label, feedback, and technical-mono roles instead of local heading and helper/body recipes where practical
- the first icon canonicalization pass is implemented on top of `lucide-react`: product surfaces now consume stable Hito icon names through the shared `Icon` primitive, `/hitoDS` documents approved icon names, categories, and sizes, and raw SVG icon folders are not part of the product design-system source
- remaining chart heights/widths, plotted lines, interval block widths, SVG silhouettes, and marker coordinates are treated as product visualization geometry, not runner-facing component chrome
- from the visible product perspective, the interface is now treated as normalized into Hito DS ownership, and future UI work should reuse shared Hito primitives or documented geometry exceptions instead of adding new custom route-local chrome

## Known Allowed Fix Areas

- real-project verification of the temporary local bypass, onboarding creation, and saved logging overwrite flow
- later removal of the temporary local bypass once the intended Supabase email auth flow is restored
- validation, schema, and route-protection hardening around the new backend contract
- honest preview copy and state labeling for preserved shells
- future extension of the same seam into additional surfaces without broad UI rewrites
