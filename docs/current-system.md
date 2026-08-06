# Current System

This document describes the implemented architecture and current ownership boundaries. Product
behavior belongs in [current-product.md](current-product.md), current status belongs in
[current-state.md](current-state.md), operational lifecycle belongs only in
[`docs/tasks/backlog/`](tasks/backlog/), and accepted execution detail remains in the technical log,
canonical backlog receipts, and Git history.

## Runtime And Deployment

- One React application uses TanStack Start/Router, Vite, Nitro, and Vercel.
- Supabase owns authenticated identity plus Postgres and private Storage persistence.
- Tailwind, Radix-backed Hito primitives, Zod, generated Supabase types, and the npm/TypeScript
  toolchain remain the retained stack. No second application framework, backend, ORM, state manager,
  GraphQL layer, microservice, or test framework is present or admitted.
- `npm run build` is the canonical production build. Managed loopback QA uses the finalized built
  output through `npm run qa:server:start|status|restart|stop`; direct Vite development remains the
  fast local feedback path, not release evidence.
- Vercel output and hosted schema readiness are fail-closed against the append-only repository
  migration history. Immutable migration files are never rewritten as cleanup.
- The iCloud checkout requires the existing non-iCloud build/runtime cache and Nitro finalization
  lifecycle. These paths remain until a measured replacement proves equivalent behavior.

## Identity, Authority, And Environment

- Supabase sessions are the saved-mode identity source. Request middleware validates server-side
  session truth before protected reads or mutations.
- A temporary local account bypass may operate only on loopback when explicitly enabled; it maps
  into the same Supabase-backed saved mode and is not a production auth path.
- Admin authentication and runner authentication remain separate authority boundaries. Admin
  sessions cannot silently become runner sessions, and tester credentials are not admin access.
- Public browser configuration uses `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Canonical server access uses only
  `SUPABASE_SECRET_KEY`; secrets stay server-side.
- RLS and table privileges protect runner-owned reads. Service-role writes remain behind existing
  Backend owners rather than direct Product database access.

## Canonical Product Data Pipeline

The persisted product path is:

`authenticated runner -> runner profile -> reviewed plan -> active plan cycle -> planned workouts -> workout result/evidence -> backend read models`

The core owners are:

- `runner_profiles` for runner baseline and future-authoring preferences;
- `plan_cycles` and `planned_workouts` for active and historical plan truth;
- `workout_logs` for runner-authored completion, notes, body notes, manual actuals, and RPE;
- canonical activity/source/revision tables for imported or uploaded activity evidence;
- result assets, normalized actual metrics, deterministic comparisons, and bounded saved insights for
  FIT-backed feedback;
- Backend projections for home, Calendar, workout detail, Activity History, and Progress.

`src/lib/training.ts` remains the normalized Product snapshot seam. Route server functions in
`src/lib/training-api.ts` delegate behavior to focused action/read owners; they are transport
wrappers, not a second domain model. Signed-out preview data remains untrusted and never becomes
saved history without an authenticated reviewed persistence action.

## Plan And Workout Lifecycle

- Manual setup, generated Quick setup, active-plan replacement, and advanced JSON import retain
  distinct entry contracts but converge on canonical reviewed workout documents and the existing
  plan persistence owner.
- Generated preview is non-persisting. Explicit review and confirm are required before creating or
  replacing a saved plan; confirm persists the signed reviewed truth rather than regenerating it.
- Add, Edit, Move, Copy, Clear, schedule reflow, plan replacement, and export keep separate safety
  semantics. Shared plumbing may be reused only when operation-level behavior remains distinct.
- Confirmed non-rest workouts scheduled today or later can enter the reviewed content-edit lifecycle;
  past workouts remain non-editable. Logs and evidence remain durable history through allowed edits.
- `training-plan-v2` is the canonical plan import/export contract. Runtime-only completion, provider,
  comparison, and insight state is not canonical plan content.

## Workout Results And FIT Evidence

- Manual result save owns runner-authored `completed`, `partial`, or `skipped` truth plus subjective
  notes, body notes, RPE, and supported manual actuals.
- FIT/ZIP intake accepts one usable activity file, stores immutable source evidence, normalizes the
  activity, reconciles its exact canonical source/revision, and projects trusted actual metrics and
  factual comparison through Backend owners.
- A complete current FIT projection can establish objective planned-workout completion. An explicit
  runner-authored partial correction remains allowed; FIT evidence never manufactures runner RPE or
  subjective notes.
- Raw-source removal, source retry, activity correction/deletion, and projection recomputation use
  the canonical activity lifecycle. Product does not infer completion from a generic feedback marker.
- Backend FIT completion truth is released. The separate Product presentation candidate is still
  blocked on native browser attachment proof and is not part of current accepted runner-facing
  behavior.

## Runner Activity Intelligence

- Gates 1-4 own canonical activity/source/revision truth, paginated History, immutable factual
  snapshots, context-specific whole-activity records, official record policy, and session-RPE load.
- Runner-reported RPE remains attributable to the exact canonical activity revision that accepted
  it; activity evidence changes invalidate dependent read models through their existing lifecycle.
- Gate 4 records and load expose only evidence-backed current observations. Recalculation may be
  represented as truthful `updating`; missing prerequisites remain unavailable rather than stale or
  fabricated.
- Gate 5 stream-dependent aerobic metrics are deliberately unavailable as
  `normalized_stream_not_persisted`. No normalized persisted sample-set truth, provider sync, or
  aerobic metric snapshot has been implemented.

## Product, Design System, DevTools, And Admin Boundaries

- `/`, `/workout/$date`, `/progress`, `/settings`, and related authenticated routes consume
  Backend-shaped Product contracts; Product does not own persistence or provider truth.
- `/hitoDS` is a production-shipped public interactive reference that consumes canonical Hito tokens,
  typography, primitives, and generated manifest projections. Its specimen state does not read or
  mutate runner data.
- TypeScript and JSON Hito DS manifests are generated from one source digest and remain separate
  because their current consumers differ.
- Local Inspector/DevTools code is lazy, loopback-gated, and non-persisting. It cannot alter Product
  behavior to make inspection easier.
- `/admin/analytics` and `/admin/capture` consume Backend-owned admin view models. Manual Admin rows
  are capture/triage inbox entries only; repo-derived rows are read-only mirrors.
- `docs/tasks/backlog/` is the sole operational queue. Plans, briefs, specs, dashboards, mirrors, and
  current documents are supporting or historical sources and cannot independently dispatch work.

## Validation And Evidence Owners

- Backend validation is grouped by source, local database, runtime, and release risk through the
  existing validation manifest and focused domain validators.
- Product and Design System behavior changes require targeted source checks, representative browser
  proof, accessibility/focus checks, and independent owner-level review proportional to the changed
  contract.
- Persistence, auth, FIT, schema, provider, and release boundaries retain their stronger database,
  privacy/RLS, runtime, migration, and parity evidence.
- The managed QA runtime, local tester pool, redacted local observability, build-integrity validator,
  and technical log are retained canonical proof owners. Generated output, logs, and QA artifacts are
  not Product source and are managed only by their explicit lifecycle tools.

## Current Unavailable Boundaries

- Gate 5 normalized streams and aerobic metrics;
- Garmin or other provider synchronization beyond explicit runner upload;
- screenshot/OCR import and automatic plan adjustment from evidence;
- accepted runner-facing FIT completion-origin presentation until the native browser file-attachment
  replay succeeds;
- any framework migration, service split, or representation deletion without replacement and
  consumer proof.

These are unavailable or separately backlog-owned. Their presence in a supporting document does not
make them implemented.

## Runtime Invariants

- one application runtime;
- one Supabase-backed saved-mode truth;
- one canonical plan/workout persistence model;
- one canonical activity/source/revision lifecycle;
- one Vercel/Nitro deployment path;
- preview remains explicit and untrusted;
- unavailable evidence remains unavailable;
- operational work remains in `docs/tasks/backlog/` only.
