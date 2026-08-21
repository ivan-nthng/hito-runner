# Hito Clean-Slate Runner Reform And Agent Operating Model

Status: active
Owner: ARCHITECT
Canonical item: [Hito Clean-Slate Runner Reform And Agent Operating Model](../../tasks/backlog/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)

## Decision

Hito will be reformed incrementally as a modular monolith around one runner-owned Calendar
`Workout`. This is a controlled replacement, not a big-bang rewrite and not a directory-first
monorepo exercise. The first implementation batch makes Runner authoring and persistence usable in
the current checkout. Package/app moves, Admin/History cleanup, Capture extraction, and broad
documentation deletion wait until that vertical slice is accepted.

The stable truth split is:

```text
Notion       current work, priority, owner, handoff, acceptance
repository   code, stable product contracts, architecture, ADRs, runbooks
Git          code history and releases
Supabase     canonical runtime facts

source artifact (manual/template/AI/import/coach/other)
             -> reviewed WorkoutDocument
             -> confirmed runner-owned Calendar Workout
             -> completion/activity/FIT evidence (factual, never prescription)
```

No new active-plan container, duplicate workout entity, persisted editor store, microservice, or
permanent Markdown/Notion mirror is admitted.

## Target Boundaries

### Runner Core

- `WorkoutDocument` is the only prescription vocabulary for create, template initialise, AI/file
  initialise, copy, and eligible edit.
- One server application service validates review exactness and confirms either create or same-row
  edit through an atomic persistence boundary.
- The confirmed Calendar row is the sole live schedule/prescription truth. Stable workout identity,
  runner ownership, scheduled date, content, immutable origin/provenance, and optimistic version are
  explicit.
- A Plan is an immutable blueprint/source. Materialisation copies reviewed initial content into
  independent workouts; deleting or archiving a Plan cannot change confirmed workouts.
- Activity, FIT, completion, actual metrics, comparison, and insight remain separate factual or
  derived evidence. They can protect a workout from editing but cannot author it.

### Supabase

- Build the target schema from a clean local database first, then an isolated preview project or
  branch. Do not mutate the current hosted project while discovering the baseline.
- Prefer one reviewed baseline migration (or generated migration from declarative schema) for the
  new environment. Keep the 47 historical migrations in the pre-reform Git tag/export, not in the
  normal new-environment bootstrap after cutover.
- Public tables use RLS. Cross-owner relations use ownership-preserving FKs. Privileged functions
  have fixed `search_path`, explicit authorization, minimal grants, and no accidental execution by
  `public`, `anon`, or `authenticated`.
- Generated TypeScript types, schema, RLS, grants, RPC contracts, fixtures, and repository adapters
  must agree before a consumer moves.

### Repository

The accepted production deployable surfaces are Runner, Admin, and History. They may later become
independent app entries only after clean-schema and Runner adoption are stable. Capture/debugger is
local-only and must have no production import, route, bundle, server/observability, or environment
activation path. If it later inspects Runner state, it consumes one narrow read-only debug contract,
never product-private imports.

Design System is shared. Domain, data-access, AI, and observability become shared packages only when
direct source evidence proves multiple production surfaces consume one stable contract. A proposed
directory tree is not sufficient reason to create a workspace or package. Dependency direction is
app -> feature/application -> domain contracts; infrastructure implements inward-facing ports.
Domain code never imports React, Supabase, OpenAI, routes, Admin, History, or Capture.

### Design System And Capture

- Design System owns reusable tokens, primitives, components, accessibility contracts, and its
  specimen surface. Product features may compose DS parts but may not create competing primitives.
- Remove current DS-to-Admin imports before package extraction. Package extraction follows a stable
  public API; it is not the first reform batch.
- Capture/inline debugger is local-only. First remove its unconditional root production-graph
  dependency and its Admin navigation edge, then prove route, server, bundle and observability
  absence. Replace its direct DS metadata/manifest and product-state imports with a narrow debug
  adapter. Move it to an isolated local tool, then consider a separate repository only after it has
  no Hito product imports.

### Admin And History

- Admin is a business/operations control surface, not a task tracker or Capture inbox.
- History is curated, read-only product evolution, not task receipts or Git narration.
- Neither is allowed to delay Runner Core. Their cleanup happens only after current task state is
  safely migrated and direct consumers are known.

### Demonstrated Surface Violations And Removal Order

- `src/routes/__root.tsx` statically imports and renders `LocalDevtoolMount`, placing a local-only
  loader in the common production route graph.
- `AdminWorkspaceNav.tsx` imports `LocalDevtoolMenuItem`, so the production Admin surface has a
  direct local-tool dependency.
- Devtools directly import DS reference metadata, the generated DS manifest, and shared UI
  implementation modules. These are current private implementation edges, not a narrow debug
  contract.
- DS reference components import `AdminOperationalComponents`; DS playgrounds also import Runner
  workout taxonomy/types. Those reverse dependencies prevent DS from being an independent shared
  owner.
- Runner, Admin, History, DS reference and local tools currently share one Vite/TanStack build. Route
  names alone do not establish deployable isolation.

Removal is serialized after Phase 1 clean schema and Phase 2/3 Runner adoption: first define the
needed DS/debug public contracts, then remove root/Admin local-tool imports and prove production
absence, then remove DS-to-Admin/Runner reverse imports with local specimen data, and only then
consider app/package moves. No package extraction or production-boundary source edit occurs in
Phase 0.

## KEEP / MOVE / MERGE / REWRITE / DELETE Ledger

| Candidate                                                                     | Decision                                    | Current consumers / evidence                                            | Replacement and removal proof                                                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/workout-document.ts` and strict parsers                              | KEEP + strengthen                           | Authoring, readback and editing contracts                               | Becomes public domain vocabulary; corpus proves every origin and reload                                                        |
| `planned_workouts` physical table                                             | REWRITE as `workouts` in clean baseline     | Calendar, detail, export, results, activity match and authoring readers | New table/contract owns runner/date/content/provenance directly; all consumers migrated and no active-plan gate remains        |
| `plan_cycles`                                                                 | REWRITE/MOVE to source `plans`              | Source library, export, materialisation and provenance lookup           | Immutable plan/blueprint plus optional source linkage; no Calendar lifecycle reader                                            |
| `runner_manual_workout_templates`                                             | MERGE payload vocabulary                    | Saved-template repository and fixtures                                  | Versioned canonical `WorkoutDocument` initializer; redundant draft/target/source columns removed after row and consumer parity |
| manual `TrainingPlanV2` one-workout adapter and `ManualWorkoutCanonicalDraft` | DELETE                                      | Manual persistence/review/editor paths                                  | Canonical document create/edit tests pass and imports are zero                                                                 |
| AI/import/template/manual producers                                           | MERGE at initializer boundary               | AI compiler, imported plan, template catalog and manual actions         | All output the same reviewed document vocabulary; raw source/provenance retained separately                                    |
| `apply_calendar_workout_mutation` and content-edit atomic behavior            | KEEP + MERGE behind one application service | Calendar add/move/clear/copy/edit and audit                             | One public use-case contract; stale, collision, ownership, audit and rollback parity                                           |
| `calendar_workout_mutation_events`                                            | KEEP                                        | Undo and audit readers                                                  | Append-only history; never current prescription fallback                                                                       |
| logs/FIT/activity/result/comparison/insight graph                             | KEEP contract, REWRITE clean baseline       | Completion, Results, Progress, protection and analytics                 | Separate evidence domain with stable workout attachment; reset current runtime rows, not the accepted semantics                |
| 47 historical migrations                                                      | MOVE out of active bootstrap after cutover  | Current database reconstruction/history                                 | Pre-reform tag + forensic export; clean baseline replays from zero with equivalent accepted invariants                         |
| custom proof scripts                                                          | MERGE/DELETE gradually                      | `package.json`, release checks and manual discovery                     | Assertions moved to domain/integration/DB/component tests; caller removal and equivalent coverage recorded                     |
| `AGENTS.md`                                                                   | REWRITE after Notion pilot                  | Every agent and current lifecycle policy                                | Short routing/safety map linking scoped domain/role instructions; Product-approved cutover and no loss of safety invariants    |
| 15 role files                                                                 | MERGE/REWRITE to five roles                 | Product dispatch and specialist ownership                               | Product, Architect, Frontend, Backend, QA cards cover ownership; specialties become scoped guidance, not extra dispatch roles  |
| eight Hito skills/prompts                                                     | MERGE/DELETE selectively                    | Task procedures                                                         | Keep only executable Hito-specific guidance not duplicated by root/role/domain docs                                            |
| `docs/tasks/backlog`, plans, dashboard and Admin task mirror                  | MOVE then DELETE                            | Current lifecycle, inbound references, Admin importer                   | Retained nonterminal work exists once in Notion with identity/link verification; stable decisions promoted to contracts/ADRs   |
| `admin_capture_items` task/capture responsibility                             | MOVE then DELETE                            | Admin Capture and repo mirror                                           | Retained tasks migrated to Notion; local Capture evidence exported; no operational consumer remains                            |
| DS implementation                                                             | MOVE later to package                       | Product UI, `/hitoDS`, Admin and current reverse imports                | Public exports and contract tests pass; DS has zero product-domain imports                                                     |
| `LocalDevtoolMount` and `src/components/devtools`                             | MOVE/quarantine, later extract              | Root route and local inspector                                          | Production graph/bundle absence, local adapter contract, zero app imports                                                      |
| Admin and History routes                                                      | KEEP product purpose, MOVE later            | Current single application routes                                       | Independent app entry/build only after Runner boundaries are stable                                                            |

No DELETE entry is executable from this document alone. Every deletion requires the named consumer,
replacement, focused proof, rollback artifact, and separate authorized owner task.

## Authorized Runtime Data Reset Boundary

Ivan authorizes deletion of current runner runtime/feed/FIT data because there are no data-bearing
users to preserve. Authorization does not waive inventory, rollback, environment identity, or
referential-order proof.

### Exact admitted data families

- Private storage objects in `workout-result-assets` and their `workout_result_assets` metadata.
- `workout_ai_insights`, `workout_comparisons`, `workout_actual_metrics`, `workout_logs`.
- `runner_activity_metric_snapshots`, `runner_activity_metric_observations`,
  `runner_activity_evidence_revisions`, `runner_activity_fact_snapshots`.
- `runner_activity_planned_workout_matches`, `runner_activity_revisions`,
  `runner_activity_source_revisions`, `runner_activity_sources`, `runner_activities`.
- Current `calendar_workout_mutation_events`, `planned_workouts`, `plan_cycles`, saved manual
  templates, AI generation response/usage rows, and other runner-owned fixture rows required for a
  coherent clean baseline.
- Disposable fixture/test auth identities, profiles, entitlements and capability usage only after
  identity classification and replacement fixture acceptance.

Admin Capture/task rows are not silently included: retained work must migrate to Notion first.
Repository-owned FIT files and deterministic source fixtures remain until replacement tests prove
equivalent coverage. Secrets, migrations, Git history, product history, and rollback exports are not
runtime data and are never deleted by this authorization.

### Reset execution protocol

1. Resolve exact local/preview/hosted project IDs and prove environment separation. Inventory row
   counts, primary IDs, FK graph, policies/grants/functions, auth identities, and storage object
   keys/sizes/hashes without printing secrets.
2. Produce an encrypted, access-limited forensic schema/data/auth/storage manifest and database dump;
   record owner, location, restore command, checksum and expiry. Test restore into a disposable
   project before deletion.
3. Freeze runner/provider/storage writes. Recompute the inventory and fail closed on drift.
4. Build and accept the clean baseline in local Supabase and an isolated preview project. Seed only
   deterministic replacement identities/fixtures.
5. Prove schema/RLS/grants/types/RPCs, authoring round-trip, evidence attachment, cleanup, and critical
   Runner flows. Only then route and switch the application environment.
6. Keep the old hosted project read-only as rollback for a bounded acceptance window when provider
   policy permits. Otherwise delete in FK-safe order after the tested export. Delete storage objects
   explicitly before removing metadata/project; never assume project deletion captured external
   objects.
7. Verify zero old environment references in Vercel/local configuration, no stale service key, and
   no old project receives traffic. Rotate superseded credentials. Decommission the old project only
   after rollback window and Product acceptance.

The preferred strategy is parallel clean project/branch plus cutover, not destructive in-place schema
surgery. If an isolated hosted target incurs a new recurring cost, PRODUCT returns that choice to
Ivan before creation.

## Validation Architecture

The target root interface is small and compositional: format, lint, typecheck, unit/domain tests,
integration tests, DB/RLS tests, focused browser E2E, build, and release checks. Existing one-off
proofs stay until their assertions have an identified replacement.

| Boundary           | Minimum durable evidence                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Workout domain     | Pure document/origin/provenance/eligibility corpus for manual, template, AI, import, copy and edit                      |
| Application        | Review fingerprint, idempotent confirm, stale/collision/ownership failures, atomic audit and rollback                   |
| Database           | Reset-from-zero, migrations, generated types, FK ownership, RLS positive/negative users, grants and advisor review      |
| Evidence           | Completion/FIT attachment, immutable raw lineage, protected edit behavior and deletion isolation                        |
| Frontend           | One editor state/controller, keyboard/pointer/focus/error/review/reload behavior and responsive containment             |
| Boundary contracts | Consumer tests for Calendar, Results, Progress, source provenance and export without private imports                    |
| Release            | Exact candidate, independent QA for affected journeys, environment parity, rollback rehearsal and clean secret boundary |

A domain change tests its domain and declared consumers. Cross-product replay is reserved for Epic or
release gates, not used to compensate for hidden coupling.

## Agent And Task Operating Model

### Authority

- The accepted `Hito Running` Notion Tasks database is the sole operational lifecycle writer.
  Markdown remains linked technical documentation/evidence; no dual writing or lifecycle fallback.
- Repository docs retain stable product contracts, architecture/ADRs, domain READMEs and runbooks.
  They do not retain task status, prompts, routine receipts, or current owner state after cutover.
- Product owns intake, priority, new product decisions, exceptions and final acceptance. Architect
  owns durable cross-domain/data decisions. Frontend owns UI/interaction/DS contribution. Backend
  owns domain, persistence, server and AI. QA owns independent risk-based acceptance. Product is not
  the routine relay between owners inside an accepted plan.

### Progressive disclosure

Future root `AGENTS.md` is a routing map, not the workflow database. It contains only source-of-truth
order, non-negotiable safety/data invariants, five-role routing, dirty-work preservation, external
mutation rules, default validation entrypoints, and links to scoped guidance. Domain contracts live
beside their domain; DB/security rules live in one Backend runbook; release rules live in one release
runbook. A task reads its Notion brief, root map, own role card, nearest domain contract, and direct
boundary contracts—everything genuinely required, but no historical receipts by default.

The active phase owner owns execution, focused validation, same-task fix-forward, lifecycle truth and
the Russian user-facing status/completion report. When the accepted plan names one unambiguous next
owner and no Product decision or reserved external authority is needed, the completed owner writes
one exact English prompt and dispatches it directly to that named owner. QA returns a reproduced
failure directly to the primary implementation owner for fix-forward. Durable repository contracts
and receipts remain English.

Risk remains proportional rather than ceremonial. The autonomous chain is bounded by the accepted
task/phase, one current production writer, named next-owner edge, unchanged acceptance, admitted
files/data/environment and existing contracts. It cannot create a new task, choose a new
product/design decision, add an unplanned owner, package/framework/state layer, broaden data
deletion, invoke external authority, absorb unrelated defects, or claim final acceptance. Any such
condition, failed rollback/recovery, ambiguous owner, or final acceptance returns to Product/Ivan.

### Notion minimum contract and connectivity boundary

The accepted model contains stable native HITO identity, human title/outcome, Status, Phase, Owner,
Area/Epic, priority, Latest update, Next action and Repository link. Each material lifecycle change
updates those fields atomically and appends one immutable task-page history line. No repository
mirror, generated snapshot, production Admin dependency or custom identifier allocator is admitted.

Ivan visually confirmed the nine current Tasks, and the accepted taxonomy cutover now relates them
to four operational finite Epics: one active Product Foundation outcome and three proposed outcomes.
Six superseded narrow or Area-shaped Epic pages remain visible as cancelled history rather than
competing current outcomes. A zero-delta second replay passed. The isolated QA context's inability to
resolve `api.notion.com` remains a transport omission, not a payload defect or authority blocker.

## Serial Implementation Phases

### Phase 0 — Operating Authority And Environment Admission

Owners serially: ARCHITECT for the repository operating map, PRODUCT for the Notion pilot and task
cutover decision, then BACKEND for Supabase environment admission. This phase changes no product
behavior and performs no database reset.

1. Keep the routing contract and environment register as durable repository policy, and keep root
   `AGENTS.md` plus active role cards as progressive-disclosure routes. Notion now owns current Task
   lifecycle; Markdown retains linked technical decisions and evidence only.
2. Define the bounded owner chain: one writer at a time; each phase owner executes, validates and
   reports to Ivan in Russian; a completed owner directly dispatches the plan's exact next named
   owner with one English prompt when no decision/authority is outstanding; QA returns failed
   acceptance evidence directly to Backend. Product is re-entered only for changed scope/owner/risk,
   product/design decisions, destructive/external action, failed recovery, ambiguity, or final
   acceptance.
3. Inventory local, preview, and hosted Supabase identities without printing secrets. Record purpose,
   project/link/deployment identity, data class, allowed writes, fixture policy, migration baseline,
   secret owner, backup/restore, reset/destroy authority, lifecycle state, and last verification.
   Treat preview and hosted as the same environment until distinct project identity is proven.
4. Retain the isolated independent-QA DNS observation as an omitted transport layer. Product's live
   visual confirmation accepts the reconciled workspace and completes the authority cutover; do not
   retry provider transport in this documentation phase.
5. Freeze the target logical data architecture before any schema implementation: one runner-owned
   `Workout` carrying the canonical `WorkoutDocument`; immutable source/provenance records; separate
   completion and Activity/FIT evidence; derived comparisons/insights; and no active container or
   origin-specific workout authority. Map accepted invariants, not current table names, to required
   persistence, ownership, retention and RLS boundaries.
6. Freeze Markdown/Admin lifecycle writers and declare Notion sole authority. Keep repository records
   as linked evidence; no backlog or Admin row is deleted by the cutover.

Exit: exactly one declared task writer exists; the accepted active-role and progressive-context
routing are usable; the target Workout/Evidence ownership model is implementation-ready; the local
environment is admitted for its documented bounded lifecycle while preview/hosted remain restricted
until separately admitted; no environment write can proceed without register admission; Notion is
the sole lifecycle writer.
Rollback requires an explicit PRODUCT decision using the preserved private export and prior
documentation revision; agents never reopen Markdown lifecycle writing implicitly.

Phase 0 is complete on this basis. The completed local clean-baseline Task is the environment
admission evidence; the accepted Notion reconciliation and Product visual confirmation are the task
authority evidence. The old modular-transformation implementation is not plan authority for Unified
Workout Authoring; this plan and its completed clean-slate decision are the accepted successor
authority.

### Phase 1 — Clean Supabase Baseline And Controlled Runtime Reset

Owner: BACKEND.

Local platform admission uses the existing Docker Desktop `desktop-linux` runtime only. Docker
Desktop `4.83.0` / Engine `29.6.2` materialises the Supabase service ports on wildcard IPv4/IPv6 even
when the supported bridge requests `127.0.0.1`; the environment must report that factual exposure
and must never call it loopback-only or externally hardened. No alternative runtime, proxy, firewall,
Compose layer, global Docker setting or new infrastructure is admitted.

The stack may run only for a bounded repository-managed validation window on an explicitly trusted
private network with disposable Hito data. Admission requires context `desktop-linux`, exact Hito
project/network/labels and expected port mappings, truthful wildcard exposure status, pinned CLI
`2.109.1`, 47/47 migrations, zero runtime rows, generated-type parity, unchanged Boca identities and
project-qualified stop to zero Hito listeners immediately after validation. Unknown/untrusted
network, sensitive data, unexpected publication, Boca movement or failed stop fails closed.

Derive the minimum physical schema from the Phase 0 logical Workout/Evidence contract, not by
renaming or squashing current tables. Current migrations, generated types, consumers and runtime rows
are evidence for invariants, deletion order and parity only. Build the baseline from zero locally and
in an isolated target; implement RLS/repositories/RPCs; generate types; prove reset/restore and
fixtures; then execute the already authorized controlled removal of current runtime/FIT/feed data and
cut over only after explicit hosted cost/environment approval.

Admission: Phase 0 contract and environment register are accepted; forensic inventory/export has an
owner and tested restore; no release freeze; Product/Ivan has decided any hosted project/branch cost.
Exit: clean baseline resets from zero; schema/RLS/grants/advisors/types and deterministic
Workout/Evidence fixtures pass; current disposable runtime data is absent from the admitted target;
old hosted state remains recoverable and receives no traffic.
Rollback: route back to the retained old environment and restore its exact configuration; do not
translate old rows into the new model after a failed cutover.

### Phase 2 — Usable Runner Core Authoring And Persistence Adoption

Owner: BACKEND.

Implement against the accepted clean schema: one canonical `WorkoutDocument` mapping and one server
review/confirm application contract. Converge manual create and eligible Calendar edit first, then
template/AI/import initializers. Preserve atomic mutation/audit/evidence protection in the new
contract. Delete each manual, plan-shaped or old-schema adapter as its consumers reach zero; do not
add a compatibility database or dual-write path.

Exit: every origin creates the same runner-owned row vocabulary; eligible edit round-trips; protected
evidence remains immutable; no one-workout plan adapter, duplicate draft or old-schema runtime
consumer remains. Rollback returns the whole candidate to the retained old application/environment
pair; it does not mix schemas.

### Phase 3 — Runner Product Adoption And Independent QA

Owners serially: FRONTEND, then QA.

Adopt one editor/controller and the new repository contracts without redesigning visual language.
Remove source-specific editor branches and prove manual/template/AI/import/copy/edit, Calendar,
completion, FIT protection and reload. QA performs independent domain and critical cross-flow
acceptance. Product decides hosted cutover/decommission after the verdict.

### Phase 4 — Validation Consolidation

Owner: BACKEND for test/tool foundation; FRONTEND contributes UI tests in a separate slice.

Create standard root checks and migrate assertions from reachable proof scripts. Delete scripts only
after caller and assertion replacement proof. Pin supported Node/toolchain and establish truthful
green baselines without disabling checks.

### Phase 5 — Retire Superseded Operational Mirrors And Documentation

Owners serially: PRODUCT for lifecycle evidence, ARCHITECT for documentation, then BACKEND and
FRONTEND for Admin mirror removal.

After the Phase 0 authority cutover has remained stable through clean baseline and Runner Core work,
delete only the
superseded operational queue, prompts, extra role cards, redundant skills/templates, Admin task
importer/mirror/Quick Note responsibilities, and duplicate process documents. Preserve durable
contracts as product/architecture/ADR/runbook material, terminal evidence through Git/history, and
every item still referenced by active work. Each removal has a direct consumer/replacement check and
a recoverable pre-removal snapshot. No bulk delete occurs merely because Notion exists.

### Phase 6 — Design System And Capture Isolation

Owners serially: FRONTEND for DS boundary, then FRONTEND DevTools/local tooling for Capture quarantine,
with QA focused bundle proof.

Remove Capture from root and Admin production graphs, replace private DS/Runner imports with a narrow
debug contract, isolate it locally, and prove route/bundle/server/observability absence. Remove DS
reverse imports and establish public exports/tests. Package DS only if stable multi-surface consumers
justify it; evaluate a separate Capture repo only after isolation proof.

### Phase 7 — Modular Workspace And Secondary Apps

Owner: ARCHITECT decision followed by owner-specific implementation tasks.

Introduce workspace/package boundaries around already stable contracts. Move Runner first, then
Admin and History. Add forbidden-import and independent-build checks. Do not combine movement with
feature behavior changes.

### Phase 8 — Admin, History, AI, And Final Legacy Removal

Owners serially by domain.

Remove Admin task/Capture responsibilities after Notion cutover, keep business operations only;
retain curated History only; improve AI timeout/idempotency/evals/telemetry after canonical authoring
is stable. Finally remove proven unreachable migrations, adapters, scripts and documentation from the
active tree while retaining the pre-reform tag/export.

## Stop Conditions And Product Decisions

Stop and return to Product/Ivan if a phase changes accepted Workout behavior, needs a second live
authority, cannot prove a consumer replacement, finds non-fixture user data, widens the authorized
deletion set, requires a paid hosted project/branch, changes privacy/AI retention, cannot restore the
forensic export, or requires an irreversible vendor/repository split.

Later Product choices are limited to: isolated Supabase target cost/ownership; forensic export
retention duration/location; Notion database workspace and access membership; eventual Capture repo
ownership; History authoring owner; and AI raw-response retention. Technical implementation inside
accepted boundaries remains owner-autonomous.

## Plan Acceptance

This plan is accepted and active. Phase 0 documentation, Notion authority cutover and local
environment admission are complete within their recorded boundaries. Product implementation
continues through the separately admitted BACKEND Runner slice. No provider mutation, deletion,
database access, source change, Git action, runtime, build or QA was performed by this documentation
cutover.
