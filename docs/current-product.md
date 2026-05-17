# Current Product

## Product Role

The implemented product is now a hybrid running-plan experience for Hito Running:

- signed-out users now enter through a login-first screen instead of landing in the calendar as the primary experience
- signed-in users can create a real profile, receive a persisted plan, log workouts, and see backend-derived weekly status
- the current local unblock path keeps a temporary local account login only for loopback development, while deploy-visible auth now exposes only the real email path and authenticated plan truth resolves through Supabase

The product still avoids claims of live coaching, connected integrations, weather-aware adaptation, or biometric authority.

## Main User Surfaces

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
  uses a dedicated design-system sidebar and compact reference surface to document the simplified live Hito product language: open route rhythm, divider-based grouping, restrained markers, quiet support copy, utility/disclosure patterns, bounded modal anatomy, controls, shell navigation, and documented visualization geometry exceptions; it is the internal reference baseline for future UI inspection and primitive extension, not a runner-facing capability

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
- authenticated users without setup complete are gated into a compact text-first onboarding request on `/`
- the primary onboarding surface now asks for one free-text description of the goal and current running context, then builds the first saved plan through the backend authoring seam
- if a signed-in user has no active saved plan yet, the app now stays honestly in that setup state instead of silently assigning a preview-derived plan
- setup-required accounts now see `Create a Plan` in the home header where saved-mode accounts see `Open plan`
- the backend now also supports one first-pass free-text authoring seam:
  one user message is turned into validated canonical plan data server-side through OpenAI before the saved weekly plan opens
- advanced JSON upload remains available as a secondary fallback path for existing plan artifacts, migration, and testing
- the temporary local login path behaves as signed-in saved mode for the configured local admin account only on loopback local runtimes, can still expand to a few local test accounts later without changing routes, and uses Supabase as the only authenticated plan store; those same loopback local runtimes no longer offer email magic links unless a real public `APP_BASE_URL` is configured
- onboarding now leads with one compact text request, and keeps JSON import visibly demoted as an advanced fallback for existing Hito plan files
- authenticated no-plan or no-workout states now render the same visible text-first plan creation surface instead of stranding users on a retry-only empty state
- the first structured authoring slice is backend-only for now:
  it validates goal, schedule, runner basics, recent result context, available days, constraints, and preferences, then generates one canonical `training-plan-v2` plan into the same persisted saved-mode seam without changing routes
- the first OpenAI-backed text authoring slice is also backend-only for now:
  it treats the user message as intent only, asks OpenAI for bounded structured authoring input, validates that output, and persists only the resulting canonical plan through the same saved-mode seam
- setup writes one profile and creates one active plan from the text-first authoring result, with JSON import retained only as an advanced fallback
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
  JSON export is shaped as canonical `training-plan-v2` truth using the active saved schedule dates, Markdown export is derived from the same payload for readable sharing, and both omit completion, Garmin, comparison, AI, and other runtime-only saved-mode state
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
  month cells carry date, completion truth, one broad-family workout glyph, one short workout-type label, the compact workout title, and a secondary feedback/evidence cue without inline distance, duration, target data, or dashboard clutter
- saved workout logging now distinguishes preview-only drafts from persisted saves, supports truthful overwrite between `completed`, `partial`, and `skipped`, and surfaces pending, success, and failure feedback without hiding backend failures
- saved workout logging now also supports workout-linked body notes as part of the saved result:
  body notes persist with the specific workout log, reload with that workout, open from a focused modal inside `Log result`, and stay out of plan-adjustment truth while optionally informing Garmin feedback only as bounded caution context
- legacy `/body` links now redirect to `/`:
  body notes no longer exist as a standalone product surface, so the most truthful recovery path is back into the runner's current plan and workout flow
- saved-mode user settings now have bounded persisted profile fields for identity, avatar metadata, age, weight, and height, resolved through the same saved runner identity used by the calendar and workout routes
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
- the first proposal-only surface for explicit plan refresh now exists inside `Open plan`:
  the backend can build one compact `RunnerCoachContext` from saved profile, active plan, remaining schedule, recent adherence, Garmin comparison signals, actual load, and workout-scoped body-note caution context
  the runner can open a quiet `Update plan` disclosure, enter short intent such as missed days, heavy fatigue, or adjusting the rest of the plan, and review a compact proposal covering why change is suggested, what would change from today forward, what stays fixed, caution context, and the explicit proposal-only boundary
  the proposal review data is now backend-shaped for runners rather than implementation-shaped: raw ids and internal field names are removed, malformed fragments fall back to clean copy, a dedicated `What stays the same` section is always provided, and scope distinguishes the total remaining schedule from the targeted upcoming changes shown in the review
  fixed weekday rest days, when known, now travel through that context as preserved plan truth, appear in the fixed-truth review copy, and are validated before any later explicit refresh apply can persist a replacement plan
  the proposal review now exposes explicit `Apply update` and `Keep current plan` actions: keeping the plan clears the review without mutation, while applying calls the backend apply seam, revalidates stale/off-day truth, normalizes refresh timeline, goal/baseline defaults, and fixed-rest-day availability so ordinary generated proposals do not leak as broken apply states, archive/replaces the active plan on success, and returns the runner to the updated active-plan view
  stale proposals show an honest stale message and ask the runner to generate a fresh proposal instead of surfacing a generic error
  no plan is silently mutated by viewing or dismissing a proposal
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
- saved-mode plan truth now also preserves higher-value richer semantics across import, structured authoring, and text authoring without adding a second runtime model:
  target date, goal metadata, plan preferences, source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority all persist into the same canonical Supabase plan rows
- home, calendar, and workout detail now render tempo workouts with a tempo-specific visible identity instead of flattening every quality workout into the same generic label, and distance-first interval reps keep visible distance-first cues in the workout structure UI
- richer imported workout detail now renders scalar target truth only, so structured metadata no longer leaks into visible `[object Object]` text
- richer imported interval workouts now keep an honest visible interval identity instead of being mislabeled as easy runs
- the advanced import flow still includes a lightweight `Download JSON template` affordance for users who already need file-based plan handoff
- the advanced import modal now follows the same stable bounded modal behavior as `Open plan` and `Body notes`, while keeping its own smaller width and import-specific content
- that downloadable template now includes one reserved `_ml_agent_template` instruction block so ML-generated files can target the canonical `training-plan-v2` contract more explicitly without turning template-only guidance into runtime truth
- rest days now stay intentionally sparse: no workout metrics, no empty targets or note sections, and no fake completion affordance from home
- auth, onboarding, advanced import, shell navigation/profile/menu chrome, home/calendar support areas, workout-detail grouped/status/metric surfaces, route-level setup/empty/error states, progress summary metrics and legends, body severity micro-UI, preserved integration utility rows, calendar/workout tooltip chrome, and deeper workout-structure plus completion-log micro-surfaces now share Hito component primitives for low-card surfaces, open/divider grouping, tiered controls, helper/error text, grouped rows, metric rows, compact legends, compact tooltips, compact severity scales, compact severity summaries, compact status pills, compact status markers, shell nav rows, shell menu rows, disclosure, labels, captions, tabs, and dividers, keeping text-first onboarding primary and advanced JSON import secondary
- remaining chart bars, plotted lines, interval block widths, SVG silhouettes, and marker coordinates are treated as product visualization geometry, not runner-facing component chrome
- from the visible product perspective, the interface is now treated as normalized into Hito DS ownership, and future UI work should reuse shared Hito primitives or documented geometry exceptions instead of adding new custom route-local chrome

## Known Allowed Fix Areas

- real-project verification of the temporary local bypass, onboarding creation, and saved logging overwrite flow
- later removal of the temporary local bypass once the intended Supabase email auth flow is restored
- validation, schema, and route-protection hardening around the new backend contract
- honest preview copy and state labeling for preserved shells
- future extension of the same seam into additional surfaces without broad UI rewrites
