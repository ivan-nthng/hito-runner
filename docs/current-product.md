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
  persisted weekly plan for authenticated users with setup complete, keeping the large `Today` card, one compact right-side support card, and the calendar below
- workout detail `/workout/$date`
  shows workout structure, logging controls, and week-status context using preview or persisted truth through one shared contract, with calmer rest-day presentation, a tighter grouped right-side panel, richer workout surfaces, and visible result-state markers for completed, partial, and skipped truth
- progress `/progress`
  keeps the analytics-style layout and can now read persisted completion and volume aggregates when saved mode is active
- body `/body`
  keeps the body-map layout as a manual-note preview
- integrations `/integrations`
  keeps the integrations information architecture as a not-connected preview
- login `/login`
  provides the current `Hito.` login-first surface, where loopback local development may still show temporary username/password login, but deploy-visible environments show only the real email sign-in path

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
- the temporary local login path behaves as signed-in saved mode for the configured local admin account only on loopback local runtimes, can still expand to a few local test accounts later without changing routes, and uses Supabase as the only authenticated plan store
- onboarding now leads with one compact text request, and keeps JSON import visibly demoted as an advanced fallback for existing Hito plan files
- the first structured authoring slice is backend-only for now:
  it validates goal, schedule, runner basics, recent result context, available days, constraints, and preferences, then generates one canonical `training-plan-v2` plan into the same persisted saved-mode seam without changing routes
- the first OpenAI-backed text authoring slice is also backend-only for now:
  it treats the user message as intent only, asks OpenAI for bounded structured authoring input, validates that output, and persists only the resulting canonical plan through the same saved-mode seam
- setup writes one profile and creates one active plan from the text-first authoring result, with JSON import retained only as an advanced fallback
- home and calendar now default to the real current day instead of a frozen demo start date
- today&apos;s workout can be opened from home or calendar cells, and the user can still manually open any other planned day
- when today falls outside the current plan window, home now says so explicitly instead of silently dropping the hero
- the home support column is now one grouped card for `Planning Note`, `Week Status`, and `Tomorrow`, and the old lower metadata strip has been removed
- the visible home shell chrome now keeps `Week` status but no longer shows a technical backend label
- saved-mode shell links that return to home now intentionally reopen `/` through a fresh request so the calendar page stays reliable even from long-lived tabs
- completed calendar days now read more clearly at a glance through a green confirmation treatment without overriding the primary today highlight
- saved workout logging now distinguishes preview-only drafts from persisted saves, supports truthful overwrite between `completed`, `partial`, and `skipped`, and surfaces pending, success, and failure feedback without hiding backend failures
- the workout-detail `Week Status` surface is now progress-based and reports completed non-rest workouts in the current week
- the workout-detail notes area now includes an honest `Upload result` placeholder seam for future evidence import, without claiming connected extraction
- week status shown in home, workout detail, and progress is derived from workout logs and current plan state
- signed-in surfaces now state honestly that JSON export is a later capability, not implemented in this slice yet
- the runner profile area now shows the current runner name and active plan title, keeps sign-out inside the dropdown, and offers a lightweight advanced JSON plan-replacement flow
- that advanced import replacement flow now preserves saved workout progress only when logged workouts still match the replacement JSON exactly on the logged dates; otherwise the replace action is blocked instead of silently clearing visible progress
- the same advanced import flow now accepts only the canonical `training-plan-v2` file contract, while still ignoring runtime-only v2 fields that do not belong in canonical plan truth
- structured imports now persist one clearer segment DSL in saved mode:
  interval-by-distance and interval-by-time both normalize into the same repeat prescription shape, and the existing home plus workout-detail routes keep rendering from that one stored contract
- saved-mode plan truth now also preserves higher-value richer semantics across import, structured authoring, and text authoring without adding a second runtime model:
  target date, goal metadata, plan preferences, source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority all persist into the same canonical Supabase plan rows
- home, calendar, and workout detail now render tempo workouts with a tempo-specific visible identity instead of flattening every quality workout into the same generic label, and distance-first interval reps keep visible distance-first cues in the workout structure UI
- richer imported workout detail now renders scalar target truth only, so structured metadata no longer leaks into visible `[object Object]` text
- richer imported interval workouts now keep an honest visible interval identity instead of being mislabeled as easy runs
- the advanced import flow still includes a lightweight `Download JSON template` affordance for users who already need file-based plan handoff
- rest days now stay intentionally sparse: no workout metrics, no empty targets or note sections, and no fake completion affordance from home

## Known Allowed Fix Areas

- real-project verification of the temporary local bypass, onboarding creation, and saved logging overwrite flow
- later removal of the temporary local bypass once the intended Supabase email auth flow is restored
- validation, schema, and route-protection hardening around the new backend contract
- honest preview copy and state labeling for preserved shells
- future extension of the same seam into additional surfaces without broad UI rewrites
