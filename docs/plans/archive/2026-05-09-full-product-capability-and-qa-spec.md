Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Stale / archive with note.

Reason: Current implemented behavior now lives in docs/current-system.md, docs/current-product.md, docs/current-state.md, and the QA-owned plan creation matrix. This older QA spec should not compete with those canonical sources.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Full Product Capability And QA Spec

## Status

Active

## Owner

Architect

## Last Updated

2026-05-09

## Context

This document is the canonical QA-facing source of truth for the currently implemented Hito Running product.

It exists for one purpose:

- define what the app currently does
- define which flows are canonical
- define what QA should verify end to end

It does not describe roadmap ideas as if they were shipped.

This spec reflects the current implemented state after:

- text-first onboarding became the primary plan-creation path
- `training-plan-v2` became the only supported advanced import contract
- saved-mode plan truth moved fully to Supabase-backed storage
- final legacy import and env compatibility cleanup was completed

## Capability Inventory

### 1. Auth states

- Signed-out users land in an auth-first entry state, not in saved-mode training data.
- Signed-in users resolve into one of three runtime states:
  - `onboarding`
  - `authenticated`
  - `preview`
- Deploy-visible auth is the real email / magic-link path.
- Local credentials login remains a loopback-local development convenience only when local bypass is enabled.

### 2. Text-first onboarding

- Authenticated users without a saved runner profile or active plan see `Create a Plan` on home.
- The primary onboarding UI is free-text input.
- Free text is sent through the server-side authoring seam.
- OpenAI output is validated and normalized before persistence.
- A successful text onboarding result creates saved plan truth and returns the user to the saved home/calendar experience.

### 3. Advanced `training-plan-v2` import

- Advanced JSON import exists in two honest places:
  - onboarding fallback
  - saved-mode replacement/import dialog
- The only supported advanced import contract is `training-plan-v2`.
- Invalid JSON, malformed JSON, or unsupported contract shapes are rejected.
- Replacement import is guarded so saved workout history is not silently detached.

### 4. Saved-mode home/calendar

- Saved-mode home reads from persisted plan truth through the normalized snapshot seam.
- Calendar/home no longer auto-bootstraps from preview data.
- Real current date drives the today state.
- Users can switch visible weeks/months and open workout detail from the calendar.
- Home sidebar support cards remain:
  - `Planning Note`
  - `Week Status`
  - `Tomorrow`

### 5. Workout detail

- Workout detail exists at `/workout/$date`.
- It supports:
  - `Overview`
  - `Log result`
  - `Preview state`
- Workout identity chrome reflects result state when available.
- `Week Status` is rendered as a progress-based block.
- Rest days render as sparse honest detail states rather than fake workout stats.
- `Upload result` exists only as a placeholder direction inside the completion flow.

### 6. Progress view

- `/progress` is implemented and preserved.
- In saved mode it reads real persisted plan/log truth for visible aggregates.
- In preview mode it remains a preserved shell that uses deterministic sample data rather than saved runner history.
- If setup is incomplete or no plan exists, the route shows an honest gated state instead of fake progress.

### 7. Body view

- `/body` is implemented as a preserved shell.
- It supports local-only body-region interaction and note entry.
- It does not persist body data.
- It does not adapt the plan.
- It does not sync to any provider.

### 8. Integrations view

- `/integrations` is implemented as a preserved shell.
- It intentionally does not represent live Garmin, Strava, Apple Health, OCR, or adaptive coaching connectivity.
- The route is honest placeholder UI only.

### 9. Workout completion and logging states

- Saved-mode logging supports:
  - `completed`
  - `partial`
  - `skipped`
- Users can overwrite an existing saved result.
- Rest days are not treated as normal runnable completion targets.
- Past-due workouts without a saved log are treated as skipped in derived status semantics until overwritten by a real result.

### 10. Current constraints and intentionally simplified areas

- Preview mode is still a shell and not trusted saved truth.
- Body and Integrations are intentionally preserved non-connected surfaces.
- `Upload result` is placeholder-only and does not upload, parse, or compare screenshots yet.
- Advanced JSON import is intentionally secondary, not the normal-user primary path.

## Canonical Flows

### 1. Signed-out entry

1. User opens `/`.
2. App resolves preview/auth-first state.
3. User sees the auth entry surface instead of a persisted plan.
4. User can continue through the available auth path for the environment.

Expected result:

- no saved training truth is shown before authentication
- preview does not pretend to be authenticated saved mode

### 2. Signed-in no-plan setup

1. User is authenticated.
2. User has no runner profile and/or no active plan.
3. Home renders onboarding state.
4. User sees the text-first plan creation path.
5. Advanced JSON remains available only as a secondary path.

Expected result:

- no fake sample plan is auto-assigned
- setup is explicit and honest

### 3. Create plan from text

1. User enters meaningful free text.
2. Client submits through the text-first onboarding seam.
3. Server generates a bounded structured plan input.
4. System validates and normalizes the result.
5. Canonical persisted plan is stored in Supabase.
6. User returns to saved-mode home/calendar.

Expected result:

- saved mode becomes active
- home, calendar, and workout detail all read from the persisted snapshot

### 4. Import plan from canonical JSON

1. User opens advanced JSON import in onboarding or saved mode.
2. User uploads or pastes JSON.
3. System validates that it is canonical `training-plan-v2`.
4. If valid and safe, the plan is normalized and persisted.
5. If replacement would detach saved history, the apply action is blocked.

Expected result:

- import succeeds only for canonical `training-plan-v2`
- unsafe replacement is blocked, not silently accepted

### 5. View saved plan

1. User opens `/` after setup is complete.
2. Home loads persisted snapshot data.
3. User sees the saved weekly plan, status context, and tomorrow card.
4. User can navigate the visible schedule and open workout details.

Expected result:

- data shown on home is consistent with persisted plan truth

### 6. Open workout detail

1. User opens a scheduled day from home/calendar.
2. Workout route loads the persisted workout when saved mode is active.
3. User can switch between `Overview`, `Log result`, and `Preview state`.
4. Sidebar shows targets, note/assignment, and progress-based week status.

Expected result:

- route state matches the selected workout day
- rest days remain honest sparse states

### 7. Mark workout complete / partial / skipped

1. User opens `Log result`.
2. User saves one of the supported outcomes.
3. Saved log upserts backend truth for that workout.
4. User-visible status updates on workout detail and home/calendar.

Expected result:

- `completed`, `partial`, and `skipped` remain distinct
- overwrite flow is deterministic and coherent

### 8. Revisit progress/history surfaces

1. User opens `/progress`, `/body`, or `/integrations`.
2. Each route loads through the current normalized snapshot seam.
3. Saved mode or preview mode is stated honestly in route copy and behavior.

Expected result:

- Progress uses real saved data in saved mode
- Body remains local-only shell
- Integrations remains placeholder-only shell

### 9. Replacement/import continuity rule

1. User with saved logs attempts advanced import replacement.
2. System compares candidate workouts against currently logged persisted workouts.
3. Only deterministic exact carry-forward matches are preserved.
4. Non-matching replacements that would detach history are blocked.

Expected result:

- saved history is protected
- the app does not create silent log drift across plan replacement

## Source Of Truth Rules

### Canonical runtime truth

- Authenticated saved-mode truth is Supabase-backed persisted data.
- Route data flows through:
  - persisted rows
  - normalization in `src/lib/training.ts`
  - backend loading/mutation in `src/lib/training-api.ts`
  - route rendering

### Canonical import contract

- The only supported advanced import contract is `training-plan-v2`.
- Canonical import parsing and normalization live in `src/lib/imported-plan.ts`.

### What is no longer supported

- Legacy `week_1_preview[]` import is no longer an active supported contract.
- Preview-derived saved-plan bootstrap is no longer part of the saved-mode product path.
- Vite-era public Supabase env aliases are no longer part of the active runtime contract.

### What is dev-only

- Loopback local credentials login is dev-only compatibility.
- It must not be treated as the deploy-visible auth product path.

### What is advanced / fallback only

- `Upload JSON` is an advanced path.
- `Download JSON template` is an advanced path.
- Structured authoring is an internal bounded authoring seam, not a separate visible primary UX.

### What is not product truth

- Preview sample data
- UI placeholder states on Body and Integrations
- `Upload result` placeholder copy and controls

## QA Scenario Matrix

| Group | Scenario | Expected outcome | Priority |
| --- | --- | --- | --- |
| Auth / session | Signed-out user opens `/` | Auth-first entry is shown; no saved plan appears | Must-pass |
| Auth / session | Signed-out user opens `/login` | Auth entry renders the environment-appropriate auth path | Must-pass |
| Auth / session | Deploy-like env without local bypass | Local credentials tab is not exposed | Must-pass |
| Auth / session | Loopback local env with local bypass | Local credentials path appears and works only as local-dev path | Should-pass |
| Auth / session | Authenticated user with no plan opens `/` | `Create a Plan` onboarding state appears | Must-pass |
| No-plan onboarding | Onboarding text shorter than required threshold | Submission is blocked with honest validation feedback | Should-pass |
| Text-to-plan generation | Valid free text request in configured env | Plan is generated, persisted, and saved-mode home loads | Must-pass |
| Text-to-plan generation | Generation failure or unavailable provider | User sees an honest failure state; no broken half-plan is created | Must-pass |
| Advanced import validation | Valid `training-plan-v2` uploaded in onboarding | Plan is accepted and persisted | Must-pass |
| Advanced import validation | Invalid JSON pasted | Validation error is shown; apply path stays blocked | Must-pass |
| Advanced import validation | Non-canonical or legacy contract uploaded | Import is rejected | Must-pass |
| Advanced import apply / replacement | Saved-mode advanced import with safe replacement | Imported plan applies and saved-mode snapshot updates | Must-pass |
| Advanced import apply / replacement | Replacement would detach saved history | Apply is blocked with continuity warning | Must-pass |
| Home / calendar | Saved-mode home after successful setup | Real saved plan renders with current date and stable shell | Must-pass |
| Home / calendar | Navigate week/month controls | Visible schedule changes without mixed state or broken navigation | Should-pass |
| Home / calendar | Open workout from calendar | Correct workout-detail route opens | Must-pass |
| Workout detail rendering | Scheduled run day with normal workout | Identity block, metrics, targets, and note render coherently | Must-pass |
| Workout detail rendering | Rest day | Sparse honest rest-day state renders without fake stats | Must-pass |
| Workout detail rendering | Date with no workout in current view | Honest no-workout state appears with route recovery CTA | Should-pass |
| Workout detail tabs | Switch `Overview` / `Log result` / `Preview state` | Search-driven tab state stays coherent and stable | Should-pass |
| Workout structure UX | Interval or structured workout overview | Segment visualization renders and preserves hover/interaction baseline without broken layout | Should-pass |
| Workout structure UX | Week Status block | Progress bar, counts, and percent match visible workout completion state | Must-pass |
| Workout logging | Save `completed` result | Workout state updates to completed and persists | Must-pass |
| Workout logging | Save `partial` result | Workout state updates to partial and persists | Must-pass |
| Workout logging | Save `skipped` result | Workout state updates to skipped and persists | Must-pass |
| Workout logging | Overwrite existing result | New saved outcome replaces old one coherently | Must-pass |
| Workout logging | Preview-mode log interaction | Local preview feedback appears, but no fake persisted truth is implied | Should-pass |
| Workout logging | Attempt to treat rest day like runnable result | Flow stays honest and does not create invalid runnable completion semantics | Should-pass |
| Progress page | Saved-mode `/progress` | Aggregates reflect persisted plan/log truth | Must-pass |
| Progress page | Onboarding `/progress` | Setup-required state appears | Should-pass |
| Progress page | No-plan `/progress` | Honest unavailable state appears | Should-pass |
| Body page | Interact with body markers | Local-only interaction works; no persistence or adaptive claims appear | Should-pass |
| Integrations page | Open `/integrations` | Placeholder surfaces stay clearly non-connected | Should-pass |
| Legacy rejection behavior | Upload legacy `week_1_preview[]` file | Explicit rejection; no silent compatibility behavior | Must-pass |
| Local vs deploy boundary | Deploy-like run | Only real email auth path is user-visible | Must-pass |
| Local vs deploy boundary | Local loopback run | Local bypass remains bounded to local/dev context only | Should-pass |

## Risk Priorities

### Must-pass critical scenarios

- Signed-out users must not see fake saved-mode plan truth.
- Authenticated no-plan users must land in text-first onboarding, not in preview-derived fallback.
- Successful text-first plan creation must persist and render through the saved-mode seam.
- Advanced JSON must accept only canonical `training-plan-v2`.
- Unsafe replacement import must be blocked.
- Saved-mode home and workout detail must read persisted truth consistently.
- Workout logging must preserve `completed`, `partial`, and `skipped` as distinct backend-visible outcomes.
- Deploy-visible auth must not expose the local credentials path.

### Should-pass important scenarios

- Local loopback bypass remains usable for local-only development.
- Calendar navigation and workout-detail tab state remain stable.
- Progress saved-mode aggregates remain coherent after logging changes.
- Preview-mode feedback remains honest and visually stable.
- Body and Integrations shells preserve layout and interaction without implying shipped capability.

### Low-priority polish checks

- Hover fidelity and motion on preserved imported UI shells
- Minor copy consistency across gated states
- Empty-state spacing, gradients, and shell polish on non-critical placeholder routes

## Critical Pass/Fail Signals

- Pass: a real authenticated no-plan account can create a first plan from free text and immediately land in a stable saved-mode weekly plan.
- Pass: a canonical `training-plan-v2` file can be imported successfully through the advanced path.
- Pass: a legacy or malformed JSON file is rejected cleanly.
- Pass: a saved workout can move between `completed`, `partial`, and `skipped` without corrupting visible status.
- Pass: the workout-detail `Week Status` block reflects completed workouts in the current visible week.
- Pass: `/progress` reflects persisted truth in saved mode.
- Fail: preview or placeholder surfaces present themselves as real provider connectivity, AI adaptation, or persisted body data.
- Fail: deploy-visible auth exposes loopback local credentials.
- Fail: plan replacement can silently detach existing workout history.
- Fail: saved-mode home or workout detail still depends on preview bootstrap behavior.

## Known Limitations

- Body notes are local-only and do not persist.
- Integrations is still an honest placeholder shell with no live provider sync.
- `Upload result` is placeholder-only and does not yet upload or parse screenshots.
- Preview mode still exists as a shell and is not trusted saved truth.
- Progress preview visuals are deterministic sample surfaces, not saved runner history.
- Some auth environments may intentionally lack magic-link configuration and should surface honest messaging instead of a live flow.

## Out Of Scope For This QA Pass

- Future screenshot ingestion, OCR, OpenAI workout extraction, or verdict generation
- Future Garmin, Strava, Apple Health, or weather provider integrations
- Future manual workout editing flows
- Future voice-first authoring
- Performance/load testing beyond broad product smoke coverage
- Model-quality benchmarking beyond bounded success/failure and validation behavior

## Smallest Sensible First QA Sweep

If staged execution is preferred, run this first before the full matrix:

1. Signed-out `/` and `/login` auth-entry check
2. Authenticated no-plan text-first onboarding success path
3. Saved-mode home render after plan creation
4. One workout-detail open + one `completed` log save
5. `/progress` verification after the saved log
6. Advanced `training-plan-v2` import success path
7. Advanced replacement block path with continuity protection

This first sweep gives the highest signal on the canonical product path before spending time on secondary shells and polish.

## Exit Criteria

- One QA owner can execute a broad end-to-end pass from this document alone.
- Implemented product behavior is described without roadmap leakage.
- Canonical flows and advanced/fallback paths are clearly separated.
- Must-pass scenarios are explicit enough to gate release confidence.
- Known limitations are documented so honest placeholder behavior is not misfiled as regression.

## Next Recommended Role

QA

## Suggested Next Step

Run the smallest sensible first QA sweep in Safari against one deploy-like environment and one loopback-local environment, then expand to the full matrix only after the canonical auth, text-first onboarding, saved-mode rendering, and advanced import seams are green.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one canonical product capability and QA coverage specification for the currently implemented Hito Running app.

### Key Decisions

- This spec describes implemented behavior only, not roadmap behavior.
- The canonical product path for QA is auth-first entry -> text-first onboarding -> persisted saved-mode rendering.

### Current State

- `training-plan-v2` is the only supported advanced import contract.
- Saved-mode plan truth is Supabase-backed.
- Body and Integrations remain honest placeholder shells.

### Constraints

- QA should treat preview mode, advanced JSON import, and local bypass auth as bounded secondary paths.
- Deploy-visible auth must be verified separately from loopback-local bypass behavior.

### Risks / Open Questions

- Auth behavior differs intentionally between deploy-like and loopback-local environments.
- Some environments may intentionally lack magic-link readiness and should fail honestly rather than appear broken silently.

### Next Recommended Role

QA

### Suggested Next Step

Execute the staged first QA sweep from this spec in Safari, then expand to the full matrix once the canonical auth, onboarding, saved-mode, and import seams are green.
```
