# Full Baseline Import And Stabilization Plan

## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-06

## Current Progress

- Phase 0 import is complete:
  the TanStack Start baseline now lives at the repo root with preserved `src/` structure, routes, shell, styles, and interaction patterns.
- Phase 1 stabilization is complete:
  visible branding is now `Hito Running`, misleading AI/sync/OCR/weather claims were neutralized, and `/progress`, `/body`, `/integrations` remain as honest preview surfaces.
- Phase 2 auth and env setup are complete:
  Supabase wiring now exists, `.env.example` matches the required contract, `/login` is live, and auth callback handling is implemented through a cookie-backed magic-link flow.
- Phase 2 auth runtime verification fixes are complete:
  callback redirects now use the live runtime origin unless `APP_BASE_URL` explicitly overrides it, and preview-mode login CTAs preserve the original safe `next` destination on `/login`.
- Temporary local saved-mode unblock is complete:
  `/login` now supports one env-backed local credentials flow with an httpOnly cookie and temporary server-side state so the saved-mode seam can be exercised while Magic Link is intentionally paused.
- Phase 3 mock replacement is complete:
  one canonical data seam now serves signed-out preview mode and authenticated persisted mode without route churn.
- Phase 4 completion persistence and week status are complete:
  workout logs persist through one backend mutation and visible week status is derived from backend truth instead of deterministic mock logic.
- Phase 5 frontend polish is complete:
  login, onboarding, saved logging feedback, and route edge-state messaging now match the persisted seam more clearly without changing the preserved baseline structure.
- Canonical plan storage cutover is implemented in code:
  local bypass sessions now map into Supabase-backed plan ownership when a server-side key is present, and a narrow current-plan import script exists for the live JSON source.
- The current local admin plan has been imported into the linked Supabase project and is now reading back through the saved-mode runtime on `/progress` and `/workout/$date`.
- Validation is complete for install, lint, build, route generation, and Supabase migration file creation.

## Context

This plan defines the single canonical path for absorbing the imported `adaptive-run-coach` GitHub repo into `hito-running` while preserving the imported UI/UX baseline as much as safely possible.

Working facts used by this plan:

- `hito-running` currently contains docs and operating scaffolding only.
- The imported app is a TanStack Start frontend baseline with a strong visual structure and no real backend, auth, session, persistence, or provider integrations.
- Imported domain data is mock-only and anchored to a hardcoded half-marathon narrative.
- Imported AI, Garmin, Strava, OCR, weather, recovery, readiness, and adaptation signals are placeholder or fake-capability signals, not implemented product.
- Product docs in this repo already establish that Hito Running v1 should preserve the planning baseline while narrowing the promise to a trustworthy plan-and-log loop.

Non-negotiable invariants for this import:

- Preserve the imported visual baseline unless a change is required for branding correction, trust correction, or data seam isolation.
- Keep one canonical application runtime during import. Do not split the imported baseline across multiple frontends.
- Do not treat imported mock data, deterministic status logic, or placeholder copy as implemented capability.
- The trusted output boundary starts only when data is backed by real auth, real persistence, and backend-owned truth.
- Placeholder surfaces may remain visible, but they must be visibly honest and must not imply live capability.

## Architecture Snapshot

Imported repo snapshot:

- Runtime layer:
  TanStack Start app with Vite-based config and generated TanStack route tree.
- Route layer:
  `src/routes/__root.tsx`
  `src/routes/index.tsx`
  `src/routes/workout.$date.tsx`
  `src/routes/progress.tsx`
  `src/routes/body.tsx`
  `src/routes/integrations.tsx`
- Shell and layout layer:
  `src/components/AppShell.tsx` owns sidebar, top bar, mobile nav, brand badge, and global status pills.
- Home composition layer:
  `src/components/TodayHero.tsx`
  `src/components/Calendar.tsx`
- Workout detail layer:
  `src/components/IntervalsViz.tsx`
  `src/components/CompletionPanel.tsx`
  route-owned side panels and tabs in `src/routes/workout.$date.tsx`
- UI primitive layer:
  `src/components/ui/*`
  large shadcn/Radix-style primitive set, mostly reusable and mostly presentation-focused.
- Styling layer:
  `src/styles.css`
  strong editorial visual identity with typography, color tokens, gradients, grain, and motion-affecting hover classes.
- Mock data layer:
  `src/data/training-plan.json`
  `src/lib/training.ts`
- Utility and local hook layer:
  `src/lib/utils.ts`
  `src/hooks/use-mobile.tsx`
- Metadata and branding layer:
  route `head()` metadata
  `stride` strings in shell
  hardcoded runner and race metadata in `training-plan.json`

Real UI logic in the imported repo:

- route composition and navigation
- month/week calendar switching
- hover tooltips and interaction states
- workout detail tab switching
- workout interval visualization
- local completion form interaction patterns
- shell navigation behavior
- responsive layout behavior

Fake product promise or mock-only logic in the imported repo:

- deterministic completion status derived from date hash in `src/lib/training.ts`
- fake current date constant `TODAY`
- hardcoded training plan JSON as the only source of truth
- AI insight cards, AI analysis tab, AI hook panels, AI coach messaging
- Garmin and Strava sync states in shell and integrations page
- OCR upload/import claims in completion flow
- body logging claims that the plan engine adapts upcoming workouts
- progress metrics, fatigue charts, readiness prediction, recovery scoring
- weather and conditions card
- connected-state and beta-state signaling in integrations

Imported surfaces by preservation class:

- Transfer intact now:
  TanStack Start route structure, `AppShell`, `TodayHero`, `Calendar`, `IntervalsViz`, `WorkoutGlyph`, most UI primitives, typography system, spacing, layout geometry, hover states, transitions, and motion patterns.
- Transfer as static or placeholder shell:
  `/progress`
  `/body`
  `/integrations`
  AI tab and sidecards in workout detail
  completion upload/import affordances
  sync pills and connected-state indicators
  conditions/weather blocks
- Later wire to real backend or services:
  auth
  onboarding state
  plan generation or retrieval
  workout logging
  week status
  provider connection state
  weather enrichment
  optional AI enrichment

## Import Strategy

Canonical import decision:

- Import the TanStack Start app into the repo root as the single application runtime.
- Keep the imported top-level structure substantially intact:
  `package.json`
  `vite.config.ts`
  `wrangler.jsonc`
  `src/`
- Keep existing repo governance files at root:
  `docs/`
  `agents/`
  `prompts/`

Why root import is the canonical choice:

- This repo currently has no competing application runtime.
- Root import preserves the imported file layout with the least churn.
- Moving the app into `apps/web` or another workspace adds structure without solving a current problem.
- Future backend, server routes, and Supabase wiring can still live inside the TanStack Start app without a second migration.

TanStack Start decision:

- Keep TanStack Start intact initially.
- Do not migrate to another framework during import.
- Do not split the imported frontend into a pure client SPA plus a separate backend app.
- Use TanStack Start route loaders and server surfaces later only when real data replacement begins.

Copy verbatim as baseline:

- `src/routes/*`
- `src/components/*`
- `src/components/ui/*`
- `src/styles.css`
- `src/router.tsx`
- `src/routeTree.gen.ts`
- `src/lib/utils.ts`
- `src/hooks/use-mobile.tsx`
- supporting build config files

Wrap, rename, or isolate:

- Replace brand strings and route metadata from `Stride` to `Hito Running`.
- Isolate imported mock plan access behind one feature-owned data seam before real backend replacement starts.
- Isolate fake capability panels behind honest `preview`, `placeholder`, or `later` states rather than deleting layout immediately.
- Keep imported route paths initially, but classify `/progress`, `/body`, and `/integrations` as presentation-only until backed by real systems.

What should be marked placeholder instead of rewritten immediately:

- AI analysis tab
- AI coach cards
- fatigue and readiness surfaces
- Garmin and Strava sync signals
- OCR upload/import controls
- adaptive engine copy
- weather/conditions blocks
- body adaptation suggestions

Preservation rule for interactions:

- Preserve imported hover behavior, tooltip behavior, tab behavior, button transitions, sidebar behavior, calendar switching, and motion classes unless a behavior directly misrepresents live capability.

Anti-overengineering decisions:

- Preserve the imported route tree before introducing any new feature routing abstraction.
- Preserve imported component structure before extracting design-system layers.
- Preserve imported visual tokens before re-theming beyond branding and promise correction.
- Use one canonical import path and no compatibility workspace.
- Do not build a second app shell, a shared package layer, or a provider abstraction layer before a real second consumer exists.
- Do not add analytics, event buses, queueing, syncing engines, or adaptation engines during baseline import.

## Canonical Boundaries

Frontend responsibility:

- render route shells, layouts, cards, forms, and motion states
- manage ephemeral client UI state such as tabs, hover, open or closed panels, local input drafts, and optimistic microstates
- present server-returned truth for plan, workout, week status, and provider states
- show honest placeholder states for not-yet-wired capabilities

Server or edge responsibility:

- session validation and route protection once auth exists
- canonical loading of runner profile, plan, workout detail, and week status
- canonical mutation endpoints for workout completion logging and week reset
- provider-side API calls and secret handling
- weather lookup proxying when secrets or privacy controls are required
- any OpenAI orchestration

Supabase responsibility:

- auth and session source of truth
- user record and profile storage
- goal and baseline storage
- plan cycle storage
- planned workout storage
- workout log storage
- provider connection metadata if later introduced

OpenAI responsibility:

- optional server-side enrichment only
- never client-side direct API access
- never primary source of plan truth in the first stable rollout
- may later summarize workout notes, generate lightweight explanations, or propose adjustments for review

Weather provider responsibility:

- return current conditions for a known coarse user location
- remain an enrichment source only
- never own user identity, plan state, or adherence state

Imported capabilities that remain presentation-only until later phases:

- AI analysis
- AI coach
- adaptive plan engine
- OCR parsing
- Garmin sync
- Strava sync
- Apple Health sync
- recovery scoring
- fatigue forecasting
- readiness prediction
- weather conditions
- body-driven auto-adjustment

Trusted output boundary:

- only authenticated profile, persisted plan data, persisted workout logs, real week status, and real provider connection state count as trusted product output
- imported mock surfaces stay outside that boundary until replaced

## Auth Decision

Rollout placement:

- Login belongs in Phase 2, after the imported baseline is safely imported and promise-corrected.

Login page decision:

- A dedicated `/login` route should exist in Phase 2.
- It should not block Phase 0 import or Phase 1 stabilization work.
- It should remain lightweight and clearly framed as account setup for saving progress, not as the main product value proposition.

Minimum recommended auth model:

- Supabase auth
- email magic link as the primary first auth method
- optional OAuth later, not in the first auth phase

Why magic link first:

- lowest implementation surface
- avoids password flows
- fits a calm product tone
- supports later cross-device continuity without expanding auth complexity early

Anonymous-first recommendation:

- Allow read-only preview access before auth during early baseline phases.
- Do not allow anonymous mode to create trusted saved history.
- If anonymous preview remains after Phase 2, label it as preview or demo behavior and keep all persistence behind auth.

Imported surfaces usable before auth:

- home shell
- weekly plan shell
- workout detail shell
- `/progress`, `/body`, and `/integrations` preview shells if retained

Imported surfaces that must require auth once real data exists:

- onboarding completion that creates a real profile
- saved plan creation
- workout result persistence
- week reset actions
- provider connection actions

## Env Contract

`.env.example` decision:

- `.env.example` is mandatory.
- It must ship with every env name required to boot the app in its current phase.
- It must clearly separate now-required vars from later-phase optional vars.

Public variables:

- `VITE_APP_NAME`
- `VITE_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only variables:

- `APP_BASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `WEATHER_PROVIDER`
- `WEATHERAPI_API_KEY`

Env usage guidance:

- Use `VITE_` only for values that are safe to expose to the browser.
- Keep all provider secrets unprefixed and server-only.
- Do not duplicate the same value under both public and server-only names.
- Do not introduce provider-specific env names until the provider is actually chosen for a live phase, except where this plan explicitly names them.

Recommended minimum phase contract:

- Phase 0 and Phase 1:
  `VITE_APP_NAME`
- Phase 2:
  `NEXT_PUBLIC_SUPABASE_URL`
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  `APP_BASE_URL`
  `SUPABASE_SERVICE_ROLE_KEY`
- Phase 5 only if enabled:
  `OPENAI_API_KEY`
  `WEATHER_PROVIDER`
  `WEATHERAPI_API_KEY`

Naming guidance:

- Keep the imported app stable by using one canonical naming scheme from the start.
- Public client config uses `VITE_*`.
- Secret config uses unprefixed server-only names.
- Avoid transitional names such as `NEXT_PUBLIC_*`, `PUBLIC_*`, or duplicate provider aliases.

## Weather Decision

Canonical later behavior:

- Weather should later show current conditions for the runner's region, not hyper-precise race analytics.
- Weather is an optional planning enrichment, not a dependency for the core plan-and-log loop.

Location strategy:

- saved profile location is the canonical long-term source
- browser geolocation is optional and opt-in for fresher local conditions
- IP fallback is allowed only as a coarse temporary estimate when no saved location exists

Privacy and permission rules:

- never require geolocation to use the core product
- request browser geolocation only when the user explicitly asks for local weather improvement
- do not persist exact coordinates unless the user explicitly confirms location saving
- prefer server-mediated provider calls once a keyed provider is used

Recommended provider:

- Open-Meteo

Recommended fallback:

- WeatherAPI

Why this pairing:

- Open-Meteo keeps Phase 5 simple and low-friction.
- WeatherAPI is a practical keyed fallback if product needs stronger support, caching control, or vendor flexibility later.

Rollout decision:

- Hold weather as placeholder through Phases 0 to 4.
- Wire it only in Phase 5 after auth, data truth, and completion persistence are already stable.

## Data Seam Plan

Phase-0 seam rule:

- Import the existing mock plan and training helpers intact first.
- Do not immediately rewrite imported components to call Supabase directly.

Isolation rule:

- The imported mock data source must become a clearly named baseline source, not an invisible default.
- The long-term goal is for route loaders and feature selectors to consume canonical plan data from one backend-backed source without forcing broad UI rewrites.

Recommended seam order:

- Step 1:
  keep `src/data/training-plan.json` and `src/lib/training.ts` as the baseline mock source during import
- Step 2:
  isolate those imports behind one feature-owned plan data module
- Step 3:
  move route-level data loading to backend-backed loaders while keeping visual components mostly unchanged
- Step 4:
  replace deterministic status logic with persisted workout-log truth

Minimum canonical data model:

- `user`
  authenticated identity
- `runner_profile`
  goal, baseline, preferred location, and product setup state
- `plan_cycle`
  one active plan context for the runner
- `planned_workout`
  date-scoped scheduled workout with type, title, structure, and display metadata
- `workout_log`
  actual result, completion state, notes, and timestamps for a planned workout
- `week_status`
  derived current-week state shown to the user

How completion logging becomes backend truth:

- each planned workout gets a stable backend identifier
- the user logs `completed`, `partial`, or `skipped` against that planned workout
- the backend persists the log
- the backend derives week status from persisted logs and active plan rules
- the frontend renders that returned week status instead of inferring it from date hashes or local heuristics

How plan status and user state replace deterministic mock behavior:

- `TODAY` becomes real current date plus user-contextual plan view
- `getStatus()` stops deriving from date hashes and instead maps from persisted state
- plan progress and completion totals come from backend-backed queries
- hardcoded runner metadata and race framing are replaced by `runner_profile` and `plan_cycle` data

Must not be coupled yet:

- plan generation logic must not be coupled to OpenAI in the first real data phase
- logging persistence must not depend on provider integrations
- week status must not depend on weather, body signals, or inferred readiness systems

## Branding And Promise Corrections

Branding correction rules:

- Replace all visible `Stride` naming with `Hito Running`.
- Replace generated app metadata such as `Lovable App` and `Lovable Generated Project`.
- Remove hardcoded runner identity such as `Ivan`.

Promise correction rules:

- Remove or neutralize sub-2-hour and half-marathon-default product framing as the global product promise.
- Remove fake synced or connected states for Garmin, Strava, Apple Health, or any provider.
- Remove claims that an AI engine is already adapting workouts.
- Remove claims that OCR parsing is available.
- Remove claims that readiness, fatigue, recovery, and predictive race outcomes are live signals.
- Remove claims that weather is live unless it is truly wired.

Preserve design while correcting misleading claims:

- keep card positions, layout, spacing, and motion where possible
- replace misleading card copy with honest labels such as `Preview`, `Later`, `Not connected`, or `Manual`
- preserve sidebars and route shells even when their actions are disabled or relabeled
- prefer neutral explanatory copy over deleting entire sections during early stabilization

Recommended surface corrections:

- sidebar `AI coach` card becomes a neutral planning note or later-feature preview
- shell sync pills become `Not connected` or are visually muted
- workout `AI analysis` tab becomes a preview tab or is hidden behind a clearly labeled later state
- completion upload/import actions become disabled placeholder affordances or a later-feature note
- `/integrations` becomes a roadmap-style preview shell, not a live connection center
- `/progress` and `/body` retain layout but drop predictive authority language

## Checklist By Phase

### Phase 0 Import Intact Baseline

- Checklist:
  completed: import the TanStack Start app into the repo root with minimal file churn
  completed: preserve the imported `src/` structure
  completed: preserve routes, components, styles, hover behavior, and motion patterns
  completed: keep placeholder surfaces visible if needed for layout preservation
- Invariants:
  one app runtime only
  no framework migration
  no backend rewrites yet
  no visual redesign
- Failure modes:
  route breakage from unnecessary file moves
  style regressions from token or font churn
  broken hover or layout behavior from premature refactor
- Rollback posture:
  rollback is whole-import scoped
  if preservation fails, revert to the last intact imported baseline rather than patching through multiple local rewrites
- What must not be coupled yet:
  Supabase
  OpenAI
  provider connections
  onboarding persistence

### Phase 1 Stabilization And Branding Correction

- Checklist:
  completed: replace brand, metadata, and misleading product copy
  completed: classify placeholder surfaces explicitly
  completed: neutralize fake connected, synced, and adaptive states
  completed: keep imported layout and interaction patterns intact
- Invariants:
  preserve baseline experience
  do not claim capability that does not exist
  do not delete whole surfaces unless they cannot be made honest
- Failure modes:
  over-editing copy and damaging baseline feel
  deleting too much shell structure and losing imported experience
  leaving fake capability claims in visible states
- Rollback posture:
  rollback by surface-level copy and state changes, not by removing the baseline import
- What must not be coupled yet:
  real auth
  real data generation
  provider APIs
  weather logic

### Phase 2 Auth And Env Setup

- Checklist:
  completed: add `.env.example`
  completed: wire Supabase auth
  completed: add `/login`
  completed: define route protection rules for persisted actions
  completed: keep preview mode separate from trusted saved mode
- Invariants:
  auth exists to support persistence, not to redefine the product
  Supabase magic link remains the intended long-term auth path
  any local credentials bypass must stay single-user, env-backed, and temporary
  no client-side secret exposure
- Failure modes:
  auth gating too early and blocking baseline review
  env confusion from mixed naming schemes
  leaking server-only secrets into client config
- Rollback posture:
  auth rollout can be paused while leaving preview shells working
  env contract changes must be reversible via `.env.example` and narrow runtime checks
- What must not be coupled yet:
  OpenAI
  weather
  provider sync
  adaptive plan logic

### Phase 3 Replace Mock Plan Source

- Checklist:
  completed: isolate imported mock source
  completed: introduce backend-backed plan loading
  completed: replace hardcoded runner and plan metadata
  completed: preserve route and component structure while swapping data source
- Invariants:
  UI structure stays largely stable
  one canonical plan source only
  no compatibility dual-source state longer than the cutover window
- Failure modes:
  mixed render states between mock and real data
  route loaders returning incomplete data shapes
  UI rewrites caused by poor seam placement
- Rollback posture:
  fallback to the isolated mock source behind the same data seam
  do not rollback by reintroducing ad hoc direct JSON imports everywhere
- What must not be coupled yet:
  week status derivation from AI
  provider ingest
  weather

### Phase 4 Completion Persistence And Week Status

- Checklist:
  completed: persist workout completion logs
  completed: derive week status from backend truth
  completed: replace deterministic completion and progress logic
  completed: ensure the weekly plan reflects logged outcomes reliably
- Invariants:
  completion log is the canonical mutation
  week status is derived from persisted workout state
  no fake auto-rebalancing claims
- Failure modes:
  local UI showing optimistic status that diverges from backend truth
  partial saves creating broken week summaries
  imported progress indicators still reading mock functions
- Rollback posture:
  rollback to persisted logging without derived week-status extras if needed
  never revert to date-hash status logic once real logs are live
- What must not be coupled yet:
  OpenAI adjustment logic
  body adaptation logic
  provider sync ingestion

### Phase 5 Optional OpenAI And Weather Enrichment

- Checklist:
  add server-only OpenAI orchestration only if a bounded use case is approved
  add weather as optional region-level enrichment
  keep enrichments secondary to the plan-and-log loop
- Invariants:
  enrichments never become the source of plan truth
  enrichments fail soft
  no client-side secret use
- Failure modes:
  AI copy drifting back into fake authority
  weather becoming a dependency for primary screens
  enrichment latency degrading the preserved baseline UX
- Rollback posture:
  disable enrichment features independently
  keep the core product operational without OpenAI or weather
- What must not be coupled yet:
  provider ingestion unless separately approved
  full adaptive engine
  OCR pipeline

## Risks

- The imported repo is visually strong but semantically over-promises; trust correction must be disciplined to avoid either deception or over-pruning.
- Root import is the least-churn path, but it requires restraint so the repo does not immediately accumulate parallel architecture ideas.
- The imported components currently rely on synchronous mock helpers; careless data replacement could force unnecessary UI rewrites.
- `/progress`, `/body`, and `/integrations` are useful baseline shells but are high-risk for misleading capability perception if not clearly marked.
- Auth timing is sensitive: too early adds friction, too late delays trusted persistence.

## Exit Criteria

- The imported TanStack Start baseline lives in `hito-running` as the only runtime with routes, styles, layout, and interaction patterns substantially preserved.
- Branding is corrected from `Stride` to `Hito Running`.
- Fake connected, AI, OCR, weather, recovery, and adaptation claims are neutralized or clearly marked as placeholder.
- One canonical app boundary exists for frontend, server, Supabase, OpenAI, and weather responsibilities.
- One canonical env contract exists with `.env.example`.
- One canonical auth decision exists with rollout sequencing.
- One canonical data seam exists for replacing mock plan data without broad UI rewrites.
- The plan defines phase-by-phase invariants, failure modes, rollback posture, and coupling constraints.

## Next Recommended Role

FRONTEND

## Suggested Next Step

Polish the authenticated UX around login, onboarding completion, saved logging feedback, and edge-state messaging while preserving the imported baseline feel and validating the new backend contract against a real Supabase project.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the canonical architecture plan for importing the full `adaptive-run-coach` TanStack Start baseline into `hito-running` with maximum UI preservation, while clearly separating intact baseline surfaces, placeholder shells, and later backend-backed capabilities.

### Key Decisions

- Keep TanStack Start intact and import it at the repo root as the single application runtime.
- Preserve routes, layout, components, styles, hover behavior, and motion patterns first, then correct branding and fake capability promises before wiring auth or backend truth.

### Current State

- `docs/plans/active/2026-05-05-full-baseline-import-and-stabilization-plan.md` now defines the canonical import, boundary, auth, env, weather, data-seam, and rollout strategy.
- No product code was changed.

### Constraints

- Do not rewrite the frontend baseline without evidence.
- Do not treat mock plan data, AI cards, sync states, OCR flows, weather blocks, or readiness metrics as implemented capability.
- Keep one canonical app runtime and avoid compatibility layers.

### Risks / Open Questions

- `/progress`, `/body`, and `/integrations` can preserve baseline breadth but must be handled carefully to avoid misleading users.
- The imported synchronous mock data layer will need a disciplined seam so backend replacement does not trigger broad component rewrites.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Execute Phase 0 and Phase 1 only: import the TanStack Start app into the repo root with minimal churn, preserve the baseline experience, and apply branding and promise-correction changes without adding auth or backend wiring yet.
```
