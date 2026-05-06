# Current Product

## Product Role

The implemented product is now a hybrid running-plan experience for Hito Running:

- signed-out users can inspect the preserved baseline as an honest preview
- signed-in users can create a real profile, receive a persisted plan, log workouts, and see backend-derived weekly status

The product still avoids claims of live coaching, connected integrations, weather-aware adaptation, or biometric authority.

## Main User Surfaces

- home `/`
  shows either:
  preview weekly plan
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
  provides the only required first auth path: email magic link with explicit send, success, callback-error, and retry messaging

## Interaction Contracts

- month and week switching remain interactive
- calendar hover and navigation behaviors remain preserved
- workout-detail tabs remain interactive
- completion logging controls stay available in both modes:
  preview mode remains local-only
  saved mode persists through the backend seam
- preview surfaces continue using explicit language such as `Preview`, `Later`, and `Not connected`

## Workflow And Status Behavior

- signed-out users open into a preserved sample weekly plan
- authenticated users without setup complete are gated into goal and baseline capture on `/`
- onboarding now runs as a compact two-step setup flow with completion feedback before returning to the saved weekly plan
- setup writes one profile and seeds one active plan from the imported template
- today&apos;s workout can be opened from home or calendar cells
- saved workout logging now distinguishes preview-only drafts from persisted saves and surfaces pending, success, and failure feedback without hiding backend failures
- week status shown in home, workout detail, and progress is derived from workout logs and current plan state

## Known Allowed Fix Areas

- real-project verification of the magic-link callback, onboarding creation, and saved logging overwrite flow against Supabase
- validation, schema, and route-protection hardening around the new backend contract
- honest preview copy and state labeling for preserved shells
- future extension of the same seam into additional surfaces without broad UI rewrites
