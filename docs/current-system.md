# Current System

This document describes the implemented architecture and current ownership boundaries. Product
behavior belongs in [current-product.md](current-product.md), implemented and release state belong in
[current-state.md](current-state.md), and operational lifecycle belongs only in the `Hito Running`
Notion database under the [operating map](../AGENTS.md). Repository tasks, contracts and history are
linked technical evidence rather than lifecycle writers.

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
- Actor classification is an Identity-owned decision exposed through
  [`actor-classification.ts`](tasks/backlog/2026-08-21-hito-identity-owned-actor-classification.md).
  Runner persisted-user resolution and Admin consume that result; Admin presentation and analytics
  do not own or reconstruct classification policy.
- Public browser configuration uses `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Canonical server access uses only
  `SUPABASE_SECRET_KEY`; secrets stay server-side.
- RLS and table privileges protect runner-owned reads. Service-role writes remain behind existing
  Backend owners rather than direct Product database access.

## Canonical Product Data Pipeline

The persisted product path is:

`authenticated runner -> identity/profile -> reviewed source or WorkoutDocument -> explicit confirmation -> runner-owned Calendar workout -> result/evidence -> public domain projections -> Product and Progress`

The core owners are:

- Identity/profile for authenticated subject, actor classification, runner baseline and stable
  preferences;
- Runner Calendar persistence, mutations and snapshot assembly for each independently owned
  confirmed workout. The physical `planned_workouts` name is a temporary legacy storage fact, not a
  plan-owned permission or lifecycle boundary;
- source records, including the physical `plan_cycles` name, for immutable proposal/provenance
  history only;
- `workout_logs` for runner-authored completion, notes, body notes, manual actuals, and RPE;
- Result/Evidence for provider-neutral action results, completion/evidence markers, comparisons,
  availability and persisted insight projections; provider/storage/parser mechanics remain private;
- the Runner Activity Product contract for factual Progress history, missingness and visualization
  inputs.

The accepted [Runner Calendar snapshot boundary](tasks/backlog/2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md)
places persisted snapshot assembly in the Calendar owner. `src/lib/training.ts` retains shared
snapshot types and Product utilities but does not own Calendar persistence or presentation labels.
Route server functions in `src/lib/training-api.ts` are transport/authentication wrappers, and
`src/lib/route-data-actions.ts` composes accepted projections without reconstructing domain policy.
Signed-out preview data remains untrusted and never becomes saved history without an authenticated
reviewed persistence action.

## Plan And Workout Lifecycle

- Manual, template, AI and file-import entry routes supply initial content to the same reviewed
  `WorkoutDocument` contract. Explicit confirmation materializes runner-owned Calendar workouts;
  origin remains immutable provenance, not a live editor or mutation authority.
- Generated preview is non-persisting. Source artifacts and physical `plan_cycles`/`active-plan-*`
  names may retain historical proposal and review mechanics only; they cannot control current
  Calendar visibility, permissions, schedule or lifecycle.
- Add, Edit, Move, Copy, Clear, schedule reflow and completion act on Calendar workouts through
  operation-specific safety contracts. Shared plumbing may be reused only when those semantics
  remain distinct.
- Confirmed non-rest workouts scheduled today or later can enter the reviewed content-edit lifecycle;
  past workouts remain non-editable. Logs and evidence remain durable history through allowed edits.
- `training-plan-v2` remains a source import/export contract. Runtime completion, provider,
  comparison and insight state is not source content or Calendar authority.

## Workout Results And Evidence

- The accepted [Result/Evidence public contract](tasks/backlog/2026-08-21-hito-result-evidence-public-contract.md)
  is provider-neutral. Product consumers receive safe action results, completion/evidence markers,
  comparison, availability and persisted insight projections; upload limits, storage identifiers,
  raw parser shapes, provider failures and observability mechanics remain Backend-private.
- Manual result save owns runner-authored `completed`, `partial`, or `skipped` truth plus subjective
  notes, body notes, RPE, and supported manual actuals.
- FIT/ZIP intake is one adapter: it accepts one usable activity file, stores immutable source
  evidence, normalizes the activity, reconciles its exact canonical source/revision, and projects
  trusted actual metrics and factual comparison through Result/Evidence owners.
- A complete current FIT projection can establish objective Calendar-workout completion. An explicit
  runner-authored partial correction remains allowed; FIT evidence never manufactures runner RPE or
  subjective notes.
- Raw-source removal, source retry, activity correction/deletion, and projection recomputation use
  the canonical activity lifecycle. Product does not infer completion from a generic feedback marker.
- Calendar consumes only the Result/Evidence completion/protection decision. Progress consumes the
  accepted [factual Product contract](tasks/backlog/2026-08-21-hito-evidence-progress-product-contract.md),
  never provider-private read models or client-reconstructed facts.
- Factual marker state remains Result/Evidence truth; the unchanged `Evidence attached` and
  `Feedback ready` labels belong to the accepted
  [Frontend presentation owner](tasks/backlog/2026-08-21-hito-feedback-marker-presentation-owner-extraction.md),
  not `training.ts` or a provider adapter.

## Runner Activity Intelligence

- Gates 1-4 own canonical activity/source/revision truth, paginated History, immutable factual
  snapshots, context-specific whole-activity records, official record policy, and session-RPE load.
- Runner-reported RPE remains attributable to the exact canonical activity revision that accepted
  it; activity evidence changes invalidate dependent read models through their existing lifecycle.
- Gate 4 records and load expose only evidence-backed current observations. Recalculation may be
  represented as truthful `updating`; missing prerequisites remain unavailable rather than stale or
  fabricated.
- Product, Progress and shared factual visualizations consume only
  [`runner-activity/product-contract.ts`](tasks/backlog/2026-08-21-hito-evidence-progress-product-contract.md).
  Read-model types, fact snapshots, formulas, FIT joins and scale mechanics remain Backend-private.
- Gate 5 stream-dependent aerobic metrics are deliberately unavailable as
  `normalized_stream_not_persisted`. No normalized persisted sample-set truth, provider sync, or
  aerobic metric snapshot has been implemented.

## Product, Design System, DevTools, And Admin Boundaries

- `/`, `/workout/$date`, `/progress`, `/settings`, and related authenticated routes consume public
  domain contracts; Product does not own persistence, provider truth, classification policy or
  Progress formulas.
- `/hitoDS` is a production-shipped public interactive reference that consumes canonical Hito tokens,
  typography, primitives, and generated manifest projections. Its specimen state does not read or
  mutate runner data.
- TypeScript and JSON Hito DS manifests are generated from one source digest and remain separate
  because their current consumers differ.
- Local Inspector/DevTools code is lazy and loopback-gated. Its only persistence seam is an explicit
  Task/Bug/Content bug submission to the canonical Notion lifecycle through a process-local
  loopback sidecar; prompt copy remains a fallback. It cannot write runner/Admin data, expose a
  browser credential, or alter Product behavior to make inspection easier.
- `/admin/analytics` and `/admin/capture` consume Backend-owned admin view models. Manual Admin rows
  are capture/triage inbox entries only; repo-derived rows are read-only mirrors. Admin consumes the
  Identity-owned actor classification result rather than importing an Admin-owned classifier.
- The `Hito Running` Notion database is the sole operational lifecycle writer under
  [AGENTS.md](../AGENTS.md). Repository tasks, plans, current documents, dashboards and mirrors are
  linked technical evidence and cannot independently dispatch or change lifecycle.

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
- one runner-owned Calendar workout truth; source artifacts are provenance only;
- one provider-neutral Result/Evidence public contract;
- one factual Progress Product contract;
- one Identity-owned actor classification decision;
- one canonical activity/source/revision lifecycle;
- one Vercel/Nitro deployment path;
- preview remains explicit and untrusted;
- unavailable evidence remains unavailable;
- operational lifecycle remains in the `Hito Running` Notion database only.
