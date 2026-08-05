# Backend Runtime Contract And Proof Simplification

## Work Item ID

2026-08-04-backend-runtime-contract-and-proof-simplification

## Status

completed

## Type

plan

## Priority

medium

## Owner

backend

## Scope

cross-stack-simplification

## Frontend Lane

product

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Reduce demonstrated Backend runtime, API, proof, and local-infrastructure complexity without changing
accepted product behavior, adding another truth path, or treating file size as deletion evidence.
Keep one canonical provider/compiler/review/confirm path, one canonical activity/source/revision
truth, one canonical WorkoutDocument/import/export truth, and one discoverable Backend validation
surface.

## Stage

All admitted Backend runtime/proof cleanup, the coordinated Progress/generated-preview DTO and
comparison cutover, and the final broad-module boundary audit are complete. Releases through
`5e0edd48d4d7676470d7bed4cc24ae268996ef26` remain accepted; the final audit removed two demonstrated
runtime cycles and exact proof/public-surface duplication without reopening those contracts. Future
feature, legacy-data, and cross-owner work is not an unfinished slice of this cleanup plan.

## Supporting Sources

- [Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)
  remains the cross-owner program record.
- [Runner Activity Backend Optimization Plan](2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md)
  remains the owner of accepted Runner Activity lifecycle and scalability work.
- [Hito Source-Size Governance And Cleanup Plan](../../plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md)
  remains retained cleanup history and evidence policy, not a second operational queue.
- [Current Functional Map](../../current-functional-map.md) remains the service-domain ownership and
  deletion-safety map.

## Root-Cause Summary

The current Backend does not have one single architectural failure or an unjustified framework
stack. The demonstrated complexity is concentrated at four narrower boundaries:

1. Internal canonical models are sometimes serialized directly as browser-facing API responses.
   This exposes unused lineage and receipt fields, increases payload and read cost, and lets internal
   evolution become an accidental Product API contract.
2. Backend proofs retain distinct contract assertions but repeat fixture construction, local auth,
   scenario matrices, persistence preflight, traversal, and result shaping. Important validators are
   also not discoverable from one package command.
3. A small set of source and tooling paths has no live runtime consumer or has been superseded, but
   remains present because cleanup stopped at earlier bounded slices.
4. Local-auth account-file parsing and normalization is independently implemented in several
   Backend/ops owners, while file IO, session-cookie behavior, and account normalization are combined
   in one broad module.

The accepted React, TanStack Start, Vite, Nitro, Supabase, Zod, FIT parser, and Vercel stack is not
the demonstrated cause. A framework migration, microservice split, GraphQL layer, cache, second test
framework, or second persistence model is not admitted by this plan.

## Audit Baseline

The read-only audit found approximately 102,855 lines across scoped `src/lib`, `src/routes`,
`scripts`, and migration source. Size alone is not an admission criterion, but it identifies the
owners where reachability and duplication were checked.

| Finding                                             | Source evidence                                                                                                                                               | Classification                           |                                                     Initial value |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------: |
| No canonical Backend validation entrypoint          | Critical generated-plan, confirm, Runner Activity, auth, comparison, and schedule validators are not registered behind one package command                    | Reliability and proof ownership defect   |                                     Prevent skipped release gates |
| Untracked shared Runner Activity proof runtime      | `scripts/lib/runner-activity-proof-runtime.ts` is imported by Gate 1, Gate 2, and Gate 4 validators but is absent from `git ls-files` in the audited worktree | Release integration defect               |                                 Restore reproducible proof corpus |
| Repeated generated-plan fixture/review setup        | Equivalent fixture environment and reviewed-plan setup appears in confirm, planned-language, and goal-intent proofs                                           | Bounded proof simplification             |                                                  About 75-110 LOC |
| Repeated provider/persistence/scenario setup        | Four-distance scenarios, persistence preflight/result shaping, local login/reset, and tree traversal are repeated while assertions remain distinct            | Bounded proof simplification             |                         About 255-430 LOC in the first safe batch |
| Internal Progress lineage serialized to Product     | Progress HTTP response includes revision/evidence/observation ID arrays and full snapshot evidence not consumed by Product                                    | Public DTO boundary defect               | Measured representative response about 613 KB at 3,000 activities |
| FIT service receipt spread into HTTP response       | Upload route serializes the ingestion result and computes `activityReadback`; Completion Product uses only feedback fields and router invalidation            | Public DTO and unnecessary read defect   | Remove unused payload and read amplification after contract proof |
| Generated preview exposes duplicate/internal fields | Browser draft shape carries camel/snake aliases, validation internals, provider metadata, canonical plan, and unavailable debug data beyond Product use       | Public DTO boundary defect               |                        Reduce response and accidental API surface |
| Duplicate comparison representation                 | Persisted/read payload contains both ordered `signals` and equivalent named `facts`; Product prefers `signals` and falls back to `facts`                      | Compatibility inventory required         |                    Remove one wire form after persisted-row proof |
| Zero-runtime-consumer entitlement enforcement       | `src/lib/entitlements/*` is internally closed and has no consumer outside the folder; tables remain used by Admin analytics and QA cleanup                    | Evidence-gated source deletion candidate |                         About 270 LOC, without migration deletion |
| Duplicate local-auth account parsing                | Account schema, derived ID, display name, and normalization repeat in local auth, Admin local accounts, test-user CLI, and import CLI                         | Bounded infrastructure simplification    |                About 100-180 LOC after cross-runtime design proof |
| Stale second package-manager lock                   | `bun.lockb` is tracked from the original import while current docs, scripts, deployment, and current lock updates use npm/package-lock                        | Safe tooling deletion candidate          |                                                     273,660 bytes |
| Brittle legacy source-regex proof                   | One generated-plan validator scans source words although behavioral provider/compiler/import/readback proofs own the invariant                                | Safe proof deletion candidate            |                                                   About 15-25 LOC |

## Canonical Retention Boundary

The following remain live or safety-critical and are not deletion candidates without new evidence:

- all currently reachable Product API routes;
- TanStack Start, Vite, Nitro, Supabase, Zod, the FIT parser, ZIP reader, and the single npm toolchain;
- provider-shaped full-plan authoring, compiler rejection, signed review, explicit confirm, and
  canonical persistence;
- `TrainingPlanV2`, `WorkoutDocument`, rich workout identity, long-run policy, named HR target truth,
  import/export, and historical confirmed-plan readback;
- Runner Activity Gate 1, Gate 2, and Gate 4 assertions, immutable lineage in persistence, RLS,
  privacy, source lifecycle, and explicit Gate 5 unavailability;
- manual Add, Copy/Paste, Delete/Clear, Move, Edit, template, persistence, and export assertions;
- large-plan readback, historical compatibility, unsupported-source, retired-wire, nested-HR, and
  privacy negative discriminators with a named regression purpose;
- `training.ts` and other broad modules until a concrete duplicate owner or import-cycle/coupling
  defect is proven. Moving lines between files is not a successful cleanup result.

## Implementation Slices

### Slice 0 - Integration And Proof Manifest

Goal: make the accepted Backend proof inventory reproducible before deleting shared setup.

- Reconfirm the current dirty-tree and source-control boundary.
- Integrate the maintained Runner Activity proof runtime deliberately or replace it with an existing
  tracked owner; never leave active validators dependent on an untracked helper.
- Add one thin `validate:backend` manifest/entrypoint that invokes the accepted non-hosted proof
  groups without creating a new test framework or copying assertions.
- Keep locally mutating Supabase/runtime proofs explicitly separate from source-only checks so the
  command remains truthful and safe.
- Record each retained validator's unique responsibility and remove only zero-responsibility entries.

Admission proof: source reachability, command inventory, no duplicated assertions, package command
dry run, independent QA review, and scoped diff hygiene.

### Slice 1 - Public Response Projection Boundaries

Goal: stop serializing internal canonical models as accidental browser contracts.

- Define explicit Product-facing projections at the existing Progress, FIT upload/remove, workout
  feedback, and generated-preview response owners.
- Keep full lineage, canonical plans, provider metadata, validation evidence, and internal receipts
  inside Backend review/persistence/observability owners.
- Remove only fields with proven zero Product consumer reachability. Preserve review token/checksum,
  normalized input summary, calendar rows, WorkoutDocuments, runner-safe errors, mutation identity,
  and every field required for exact Product readback.
- Measure before/after response bytes and query/write counts on the canonical small and 3,000-activity
  fixtures. Do not add caching or another read model.
- Decide the upload/remove mutation-readback boundary from evidence: either Product consumes the
  canonical readback or Backend stops computing it on endpoints that only invalidate and refetch.
  Do not retain both behaviors by default.

Stop condition: an external consumer outside the repository or a Product decision requires a field
whose current consumer cannot be proven.

### Slice 2 - Comparison Wire Reconciliation

Goal: retain one comparison representation for new writes and one normalized read boundary for any
required historical form.

- Run a read-only local and, only when separately authorized, hosted inventory of `signals` and
  `facts` payload shapes.
- If no accepted facts-only rows exist, delete `facts`, its writer, Product fallback, and duplicate
  proof branches.
- If historical facts-only rows exist, normalize them once at the existing Backend read boundary and
  emit only the canonical Product shape. Reject contradictory dual shapes rather than preferring one.
- Preserve deterministic Plan vs Run semantics, runner-safe readback, and immutable source evidence.

Stop condition: historical compatibility requires rewriting hosted user data or changing accepted
comparison semantics.

### Slice 3 - Proof Corpus Consolidation

Goal: delete repeated proof infrastructure while preserving every unique contract assertion.

- Consolidate generated-plan fixture/review setup, four-distance scenario definitions, persistence
  preflight/result shaping, local login/reset setup, and shared tree traversal through the smallest
  existing proof seam.
- Keep provider/schema/compiler, review/privacy/fixture, confirm/persistence/export, manual operation,
  Runner Activity gate, auth, observability, and build assertions distinct.
- Remove the brittle legacy source-regex scan only after behavioral proofs cover the same invariant.
- Move HR editor and comparison rendering proofs to an existing Frontend Product proof owner only
  when that owner accepts the same assertions; do not delete unique browser/SSR coverage.
- Consider table-driven manual operation scenarios only after exact assertion parity proves that
  Add, Copy, Delete, Move, and Edit safety does not collapse into a generic lifecycle.

Expected reduction: about 330-540 LOC in the first low-risk batch; a later manual-proof batch may
remove another 500-900 LOC after scenario-by-scenario parity.

### Slice 4 - Zero-Consumer Runtime And Tooling Deletion

Goal: remove source that has no accepted runtime, proof, or future-only consumer.

- Reconfirm static, dynamic-import, package-entrypoint, generated-runtime, documentation, and build
  reachability for `src/lib/entitlements/*`.
- If still closed within itself, delete the inactive enforcement registry/check/resolver/types and
  reconcile current-system documentation. Retain applied migrations, generated database types,
  Admin analytics, and QA cleanup support until the underlying tables have a separate product/data
  retirement decision.
- Delete `bun.lockb` after npm/package-lock deployment and contributor documentation parity is
  reconfirmed.
- Remove stale exports, aliases, and compatibility branches only with an exact consumer manifest.

Stop condition: a live dynamic consumer, deployed contract, or accepted future feature currently
depends on the source.

### Slice 5 - Local Auth Account Owner Consolidation

Goal: retain runner/admin/local session separation while eliminating repeated account-file truth.

- Separate pure account schema/normalization from file IO and cookie/session behavior at the existing
  local-auth owner.
- Reuse that pure owner from runtime auth, Admin local account projection, QA user lifecycle, and
  local import tooling where module/runtime compatibility is proven.
- Keep file IO server-only, loopback gating fail-closed, credentials private, explicit Logout intact,
  and runner/admin sessions separate.
- Do not add passive auto-login, a second credential registry, hosted auth behavior, or a browser
  token store.

Admission proof: account-file parity, stable derived IDs, runner/admin separation, reload/restart,
Logout, non-loopback refusal, secrecy, and independent QA.

### Slice 6 - Broad Module Boundary Audit

Goal: admit only reductions that delete duplicate ownership rather than redistribute lines.

- Re-audit `training.ts`, manual-workout-authoring, imported-plan, rich-workout-model,
  workout-document, generated-plan service/compiler/review, active-plan lifecycle, and Runner Activity
  modules after Slices 1-5 reduce their accidental coupling.
- Replace broad barrels with direct imports only when this removes client/server graph leakage or a
  proven circular/side-effect boundary. Barrel removal alone is low value.
- Admit extraction only when one independently testable lifecycle owner emerges and the old path is
  deleted in the same slice.
- Measure build graph, bundle/server reachability, LOC, and runtime behavior before and after.

Stop condition: the proposed change is file-size driven, moves code without deletion, or creates a
generic framework above domain owners.

## Cross-Owner Findings

These are evidence discovered during the Backend audit but are not to be patched around in Backend:

- Product Progress currently does not refresh Progress after an `updating` mutation readback while it
  does refresh History. Frontend Product owns the retry/readback lifecycle.
- Completion Product derives feedback state from both a Backend marker and payload presence. A later
  Frontend Product slice should consume one Backend-owned presentation state after the response DTO
  is settled.
- UI/SSR-only HR editor and comparison proof cases should move only with an accepted Frontend proof
  owner; Backend must retain them until coverage parity exists.

## 2026-08-04 Implementation Receipt

### Completed in the first cleanup batch

- Added one explicit Backend validation manifest with separate source, local-database, built-runtime,
  and release groups. Local persistence checks require their mutating mode explicitly, runtime checks
  require a loopback URL, skipped groups are printed, and the representative read-model gate includes
  the 3,000-activity scale discriminator.
- Retained `scripts/lib/runner-activity-proof-runtime.ts` as deliberate shared proof source and reused
  it for Gate 1, Gate 2, Gate 4, design-profile, and runner-auth runtime setup. Source-control tracking
  is included in the exact Backend release bundle that carries this receipt.
- Consolidated generated-plan fixture/review setup and removed the superseded source-regex proof while
  retaining distinct provider, compiler, review, confirm, persistence, and export assertions.
- Removed the zero-consumer entitlement enforcement source and stale Bun lock/config. Database tables,
  migrations, Admin analytics, and QA lifecycle support remain because they still have consumers.
- Replaced duplicate local-auth account parsing in runtime, Admin, QA lifecycle, and import tooling
  with one server-only schema/normalization/file owner. Loopback login, repeated authenticated reads,
  explicit logout, non-loopback refusal, runner/admin separation, and local registry parity pass.
- Narrowed FIT upload/remove HTTP responses to the Product-consumed feedback contract, removed the
  unnecessary upload activity-readback query, and added exact built-runtime response/privacy checks.
- Reconciled four stale reusable QA-pool registry IDs through the canonical `pool-ensure` lifecycle.
  The protected local Admin identity was deliberately not mutated.
- Made npm the only package-manager truth, declared direct CLI runtime dependencies directly, removed
  a redundant direct router-plugin dependency, upgraded compatible TanStack/Vite/Nitro/Supabase/Undici
  dependencies, and reduced the installed graph by 59 packages net. The critical audit finding and
  the vulnerable TanStack server-function version are gone.

### Deliberately retained boundaries

- Progress and generated-preview DTO reduction require a coordinated Frontend Product type/consumer
  change; Backend does not ship a server-only narrowing that leaves a false public type.
- Comparison `signals`/`facts` retirement still requires the separately authorized persisted-row
  inventory and removal of the live Frontend fallback.
- The local Admin analytics surface intentionally shows local bypass credentials only to the
  loopback-gated Admin capability. This is an explicit devtool exception, not a runner or runtime-log
  contract; raw credentials remain absent from proofs and reports.
- Lovable/Cloudflare build integration remains because its external editor consumer is not proven
  absent. The remaining npm high advisories are isolated to its and Nitro's optional
  Cloudflare/Miniflare toolchain; npm's proposed automatic fix would replace Nitro with an invalid
  breaking version, so this needs a focused toolchain-upgrade/removal slice rather than `--force`.
- No framework migration, cache, second API model, second auth registry, or alternate plan/activity
  runtime was introduced.

### Validation receipt

- `validate:backend:local-db` passes 16 checks, including signed confirm/persistence, 210+ workout
  readback, manual authoring, HR snapshots, Gate 1/2/4, RLS/privacy, cleanup, and 3,000-activity scale.
- `validate:backend:runtime` passes 15 checks against the fresh built loopback server, including exact
  FIT upload/remove response shapes, canonical History readback, login/reload/logout, provider
  isolation, and Gate 1/2/4 lifecycle behavior. The manifest refuses an orphan `--runtime-url`, and
  FIT removal authenticates before parsing while mapping authenticated malformed JSON to the stable
  runner-safe `invalid_upload` outcome.
- Fresh Vite/Nitro production build, build-output integrity, targeted ESLint/Prettier, and diff hygiene
  pass. Independent QA findings were integrated into the manifest and route/auth regressions.
- Global QA Acceptance remains separate and pending.

## 2026-08-04 Backend Owner Closure Receipt

### Additional completed Backend-only work

- Migrated 36 deprecated TanStack server-function `.inputValidator()` declarations to the current
  `.validator()` API without changing schemas, handlers, or Product behavior.
- Removed two unreachable imported-plan constants, one duplicate Gate 4 manifest invocation, and 39
  false module exports proven to have no external, barrel, dynamic-import, generated, or package API
  consumer. The underlying live implementations remain unchanged.
- Hardened the one comparison read boundary: only the accepted formula version, matching persisted and
  nested identities, five unique canonical signals, and exactly matching `signals`/`facts` are accepted.
  Contradictory or duplicate representations now fail closed instead of silently preferring one form.
- Replaced the manual persistence proof's ad hoc comparison payload with the canonical deterministic
  comparison builder and formula version.
- Applied the two accepted Runner Activity least-privilege migrations to the linked production project
  after project-ref, byte-hash, ledger, and ordered dry-run verification. Hosted history is 33/33;
  authenticated/public direct grants and policies on the private activity/projection tables are zero,
  while the expected service-role operations remain available.
- Read-only hosted comparison inventory found one row: it is an exact canonical dual representation,
  with no facts-only, signals-only, unsupported-version, identity-mismatch, duplicate, or contradictory
  row. No hosted payload or runner data was retained in evidence.

### Deliberately retained after final audit

- `facts` remains in the comparison writer/read type only because Product still has a live fallback.
  The finite hosted inventory authorizes a later coordinated signals-only cutover; it does not authorize
  a server-only breaking response change.
- Progress lineage and generated-preview internals remain until Frontend Product adopts explicit DTOs
  in the same coordinated slice.
- Small JSON conversion and mutation-metadata helpers in manual workout modules remain because their
  lifecycle inputs and write semantics are not identical enough to justify a new generic abstraction.
- Lovable/Cloudflare build integration and the retained manual operation proofs stay reachable. Their
  deletion requires consumer or toolchain evidence not established by this slice. The zero-consumer
  comparison `sessionSummary` duplicate was removed from new writes and required read shape after the
  hosted inventory proved historical rows remain readable without a migration.

### Closure boundary

All independently completable Backend-owned slices admitted by this plan have owner-level source,
local persistence, built-runtime, privacy/RLS, hosted parity, build/integrity, and independent-review
evidence. The coordinated Frontend Product DTO and comparison-consumer dependency recorded at that
closure was subsequently released in `5e0edd48d4d7676470d7bed4cc24ae268996ef26`; it is no longer a
blocker. No Product behavior, provider path, coaching policy, or second truth path was introduced.

## 2026-08-05 Broad-Module Closure Receipt

### Completed boundary reductions

- A static-and-dynamic value-import graph exposed two runtime strongly connected components. Admin
  capture shared values now live in one side-effect-free contract owner, so the server implementation
  no longer imports runtime values from the server-function facade. The superseded roles-only module
  was deleted.
- Runner Activity running-context interpretation now lives in one pure module shared by Garmin
  normalization and Gate 4 projection. The Garmin source lifecycle no longer participates in the
  `garmin-fit-source -> read-model -> metric-snapshots -> garmin-fit-source` runtime cycle.
- Progress reuses the existing shell route-data composition because its loader result was exactly
  identical. The duplicate Progress helper was deleted rather than retained as an alias.
- Five types with no external consumer are no longer exported. Their internal runtime shapes and all
  Product DTO behavior remain unchanged.
- Two manual-workout rejection fixtures that ran twice in the same canonical validator were removed;
  the constructor contract proof remains their single assertion owner. The local-DB manifest now runs
  Gate 4 before the 3,000-activity scale proof so PostgreSQL checkpoint IO cannot turn the next
  independent contract check into a false statement-timeout failure.

### Retained after reachability review

- `training.ts` remains a live graph hub with 74 direct consumers. Splitting its date, workout, or
  presentation APIs requires an atomic Backend/Product consumer migration and would currently move
  code rather than delete a duplicate owner.
- Active-plan legacy-log recovery remains reachable from persisted snapshot readback. Retirement
  requires a finite target-specific inventory; no inventory was fabricated in this cleanup slice.
- The active-plan export caller currently proves runner ownership before the lower-level
  service-role workout read. Tightening that lower-level signature is a separate security-hardening
  change, not a demonstrated current cross-runner read or a source deletion.
- Public/server environment separation remains a possible hardening slice, but no secret value is
  present in the client artifact and the change would add a boundary rather than remove duplicate
  runtime truth.
- Provider, FIT intake, runner/admin auth, plan persistence, and Gate 1/2/4 proofs remain semantically
  distinct live owners. Large or test-only source was not classified as dead without reachability
  evidence.

### Complexity accounting

| Class         | Net maintained-line change | Interpretation                                                                             |
| ------------- | -------------------------: | ------------------------------------------------------------------------------------------ |
| Runtime       |                        +20 | Two runtime cycles removed through pure owner boundaries; not presented as LOC cleanup     |
| Proof/scripts |                        -46 | Exact duplicate manual rejection fixtures removed; unique assertions retained              |
| Generated     |                          0 | No generated contract or artifact changed                                                  |
| Documentation |                        +31 | Lifecycle reconciliation and evidence receipts only; excluded from source-reduction claims |

The executable runtime/proof total is net `-26` lines. The architectural result is accepted because
the two runtime cycles and one duplicate route-data owner are gone, not because a line target was met.

## Required Validation For Every Implementation Slice

Each slice must publish its own execution preflight and a compact required test inventory. The
minimum proportional inventory is:

- pre-change source and consumer discriminator for every deletion;
- targeted canonical validators plus the new Backend manifest where applicable;
- signed review/confirm/export or activity/persistence readback when their contracts are touched;
- privacy/RLS and runner-safe error proof for API response changes;
- provider isolation and no paid call unless separately authorized;
- focused lint, formatting, `git diff --check`, and a fresh production build/integrity check when
  executable imports or package manifests change;
- built loopback runtime and Product consumer smoke for public DTO or auth changes;
- cleanup through canonical fixture/test-user seams;
- one bounded independent QA or architecture review integrated before closure;
- before/after LOC, payload, dependency, and retained-exception ledger.

## Program Definition Of Done

This plan is complete because:

- one canonical Backend validation entrypoint covers the retained proof inventory;
- no maintained validator depends on an untracked helper;
- public API responses expose explicit Product DTOs rather than internal canonical models;
- duplicate comparison and generated-preview wire truth is removed or normalized once at a proven
  historical boundary;
- every deleted runtime/helper/export has zero current consumers or a same-slice replacement;
- local-auth account normalization has one owner without changing session semantics;
- npm is the only repository package-manager truth;
- accepted provider/compiler/review/confirm, manual authoring, Runner Activity, FIT, RLS/privacy,
  import/export, and historical readback contracts still pass;
- every slice reports exact removals, retained exceptions, omissions, and independent QA evidence;
- Global QA remains a separate release gate.

## Expected Outcome

The first evidence-backed implementation batches target roughly 600-900 net source lines plus the
273,660-byte stale Bun lockfile. A later proof consolidation may bring the total to roughly
1,100-1,800 lines without reducing contract coverage. API work is judged primarily by payload and
query reduction, not by LOC. These are planning estimates, not acceptance targets; a smaller change
with stronger deletion proof is preferable to an artificial line-count goal.
