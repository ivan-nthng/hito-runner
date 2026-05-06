# Current Product

## Product Role

The implemented product is now a hybrid running-plan experience for Hito Running:

- signed-out users now enter through a login-first screen instead of landing in the calendar as the primary experience
- signed-in users can create a real profile, receive a persisted plan, log workouts, and see backend-derived weekly status
- the current local unblock path uses a temporary local account login with visible username/password fields instead of depending on the Supabase magic-link email flow

The product still avoids claims of live coaching, connected integrations, weather-aware adaptation, or biometric authority.

## Main User Surfaces

- home `/`
  shows either:
  login-first unauthenticated entry
  setup gate for authenticated users without a profile
  persisted weekly plan for authenticated users with setup complete
- workout detail `/workout/$date`
  shows workout structure, logging controls, and week-status context using preview or persisted truth through one shared contract
- progress `/progress`
  keeps the analytics-style layout and can now read persisted completion and volume aggregates when saved mode is active
- body `/body`
  keeps the body-map layout as a manual-note preview
- integrations `/integrations`
  keeps the integrations information architecture as a not-connected preview
- login `/login`
  provides the current `Hito.` login-first surface, visible temporary local username/password login as the main path, and Magic Link as a secondary alternative

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
- authenticated users without setup complete are gated into JSON-first import on `/`
- the temporary local login path behaves as signed-in saved mode for the configured local admin account and can now expand to a few local test accounts later without changing routes
- onboarding now imports one JSON plan week, validates the expected shape, and returns into the saved weekly plan after import
- setup writes one profile and creates one active plan from the imported JSON data
- home and calendar now default to the real current day instead of a frozen demo start date
- today&apos;s workout can be opened from home or calendar cells, and the user can still manually open any other planned day
- when today falls outside the current plan window, home now says so explicitly instead of silently dropping the hero
- saved workout logging now distinguishes preview-only drafts from persisted saves, supports truthful overwrite between `completed`, `partial`, and `skipped`, and surfaces pending, success, and failure feedback without hiding backend failures
- week status shown in home, workout detail, and progress is derived from workout logs and current plan state
- signed-in surfaces now state honestly that JSON export is a later capability, not implemented in this slice yet

## Known Allowed Fix Areas

- real-project verification of the temporary local bypass, onboarding creation, and saved logging overwrite flow
- later removal of the temporary local bypass once the intended Supabase email auth flow is restored
- validation, schema, and route-protection hardening around the new backend contract
- honest preview copy and state labeling for preserved shells
- future extension of the same seam into additional surfaces without broad UI rewrites
