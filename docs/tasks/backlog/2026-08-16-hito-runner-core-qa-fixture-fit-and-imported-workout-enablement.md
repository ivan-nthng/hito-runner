# Hito Runner Core QA Fixture FIT And Future Imported Workout Enablement

## Work Item ID

058fe9b4-135d-45ed-9dc3-0391afd12935

## Status

completed

## Type

Tracked — local acceptance enablement

## Priority

high

## Owner

BACKEND

## Epic

runner-core-readiness

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Evidence From

[Runner Core QA Audit And Defect Ledger](./2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md)

## Scope

Local loopback `qa_fixture` evidence only: make one deterministic, eligible future
`file_import` Calendar workout available through the existing fixture lifecycle, and prove the
existing durable FIT upload/import server path using the already approved
`sample-fit-from-zip.fit`. The accepted runner model remains mandatory: the imported source is
immutable provenance; the materialized workout is independently runner-owned.

## Archive Intent

Retain through the dependent Frontend browser bridge and final QA replay, then compact to the
fixture contract, durable proof, and closing acceptance result.

## Task

Enable the exact local evidence that AUD-03 and AUD-04 lacked. Extend existing fixture/server seams
only; do not add an alternate product upload, import, export, fixture store, source-plan authority,
or production-only behaviour.

## User Direction

Ivan has already provided FIT examples, including the approved local sample. The immediate goal is
product readiness: test the same durable file path a runner uses, with deterministic local inputs,
before accepting the Runner Core.

## Demonstrated Boundaries

- AUD-03: `CompletionPanel` intentionally converts file selection into an unsaved local preview in
  `qa_fixture`; this is a test capability boundary, not a demonstrated upload defect.
- AUD-04: the accepted QA profile exposes only protected historical imported workouts, while the
  existing fixture/seeding owner can materialize origin-neutral Calendar facts.
- Existing server route: `src/routes/api.workout-result.upload.tsx` is the canonical durable upload
  owner; existing sample: `sample-fit-from-zip.fit`; existing fixture owner:
  `scripts/lib/runner-design-profile-fixture.ts`.

## Required Outcome

1. One named disposable fixture setup yields exactly one future, eligible `file_import` workout
   with immutable source provenance and no runner-facing active/current plan container.
2. The approved sample reaches the existing durable server upload/parser/persistence path under
   loopback `qa_fixture` authorization, then has durable result/evidence readback and removal proof.
3. Reset/reseed/reset convergence leaves no task-owned data, assets, events, or leases.
4. No real-mode, hosted, provider, arbitrary-file, or arbitrary-path admission is added.

## What Not To Touch

Runner-facing file-picker UX, normal import/export behaviour, production routes, real identities,
hosted Supabase, providers, schemas/migrations unless the existing persistence shape demonstrably
cannot express the fixture fact, Design System, Admin, Git lifecycle, and iPad/native-drag scope.

## Validation Expectations

Focused source and local database proof must establish future imported edit eligibility, canonical
server-path FIT persistence/readback/removal, runner isolation, failed-input atomicity, and final
fixture cleanup. Use existing validation and fixture owners first. Run proportional formatting,
types/lint, and diff hygiene. Browser, managed runtime, and final QA remain separate.

## Execution Preflight

- **Mode / stage:** Tracked Backend execution for deterministic local fixture and server-path
  admission. The Git index is empty; the shared managed `qa_fixture` runtime is already running and
  remains untouched by this source/local-database slice.
- **Demonstrated red boundaries:** the local Activity-file consumer returns only an unsaved preview,
  so it cannot create durable FIT evidence; the accepted design profile contains no eligible future
  `file_import` workout, so the imported-origin positive edit branch has no honest target.
- **Existing seams reused:** the `runner-design-profile-fixture` owner and existing `test-user` QA
  pool lifecycle for one isolated disposable setup; the canonical workout-result upload/remove
  routes, `ingestGarminWorkoutResult`, the approved `sample-fit-from-zip.fit`, and the current
  imported-source retention/materialisation path.
- **Smallest change:** add one exact local fixture marker to the existing upload route and ingestion
  owner. It is admitted only for an authenticated local-provider request whose app and Supabase
  origins are loopback and whose runtime is already in `qa_fixture` mode. The marker names no path;
  the server reads one fixed repository sample and verifies its fixed checksum before invoking the
  ordinary durable ingestion path. Add one named disposable `isolation-a` fixture lifecycle that
  materialises exactly one future non-Rest imported workout from the existing canonical template.
- **Reuse-first budget:** proposed new production/runtime artifacts, files, tables, RPCs, migrations,
  providers, dependencies, storage models, and fixture frameworks: **none**. Existing concurrent
  fixture hunks remain authoritative and are preserved.
- **Superseded responsibility:** none in this Backend slice. The preview-only Product branch remains
  temporarily because removing or adopting the new durable marker is the next `FRONTEND Product`
  responsibility; normal real-mode file upload remains unchanged.
- **Focused proof:** red/green authorization matrix, deterministic future imported provenance and
  eligibility, reset/seed/reseed/reset convergence, durable sample ingestion/readback/removal,
  cross-runner and invalid-input atomicity, complete task-owned cleanup, focused format/lint/type
  checks, and diff hygiene. Managed runtime, browser, hosted, provider, Git, Global QA, and release
  acceptance are explicitly outside this stage.

## Stage

BACKEND Implementation DoD complete — FRONTEND Product bridge pending

## Next Recommended Role

FRONTEND

## Exact Handoff Prompt

```text
ROLE: FRONTEND
Lane: Product

Task: Adopt the admitted Runner Core local FIT/file-import bridge in the existing Product consumers
Mode: Tracked
Canonical item:
docs/tasks/backlog/2026-08-16-hito-runner-core-qa-fixture-fit-and-imported-workout-enablement.md
Stage: FRONTEND local qa_fixture consumer bridge
Epic: runner-core-readiness

Read AGENTS.md, agents/frontend.agent.md, the matching Frontend skill, this completed Backend
receipt, and the Runner Core QA ledger. Backend now supplies one future eligible `file_import`
workout through `npm run test-user -- runner-core-file-flow-seed --as-of-date 2026-08-16` and admits
one exact multipart marker on the existing upload route: `localQaFixture=sample-fit-from-zip.fit`
plus `plannedWorkoutId`. The server accepts it only for an authenticated local-provider, loopback,
`qa_fixture` request and sends it through the ordinary durable FIT ingestion path.

In the existing `CompletionPanel` local-fixture branch, replace the unsaved preview-only completion
with that admitted durable request so QA can exercise upload, reload readback, and the existing
remove action without browser file assignment. Preserve the normal real-mode File upload path and
all user-facing production behaviour. Use the fixture workout's existing Calendar readback; it is
`eligible_future_unlogged` with Edit/Move/Copy before evidence and becomes evidence-protected after
FIT. Do not add a client persistence path, mock payload, arbitrary path input, or plan authority.
Clean up with `npm run test-user -- pool-reset --role isolation-a`. Return the Product consumer
proof to QA; do not claim Global QA from the Frontend implementation slice.
```

## Tracked Implementation Receipt — 2026-08-16

### Outcome and root cause

Backend Implementation DoD passed. The accepted design profile remains unchanged at its canonical
55-workout / 30-activity contract. A separate named `isolation-a` setup now materialises exactly one
future, independently runner-owned imported workout from the existing template. Its immutable source
record is archived provenance (`training_plan_v2_import`), the Calendar row is
`origin_kind=file_import`, and no active or duplicate materialised plan container exists.

The two original red boundaries were confirmed: the Product consumer returned before the upload
route and produced only an in-memory preview, while the existing accepted profile exposed no future
imported row. A third fixture discriminator was found during implementation: materialisation alone
left the disposable runner without the required baseline fields, so the ordinary snapshot correctly
returned onboarding. The fixture now writes one deterministic QA baseline through the existing User
Settings seam before materialisation; the canonical authenticated snapshot then exposes the workout
with `planMeta: null` and truthful editing capabilities.

The durable local bridge is not a second upload path. The existing multipart route accepts one exact
marker only when its server-derived request context is local-provider + loopback and the existing
`qa_fixture` gate is active. The server reads only the fixed repository sample, verifies SHA-256
`fb5e9a4b3a0d9ff90e105c174bb728f730de621875b17503db8981cb80c108a2`, and delegates to
`ingestGarminWorkoutResult`. Normal File uploads and the existing removal owner are unchanged.

### Files

- `src/routes/api.workout-result.upload.tsx` — admits the exact local marker on the canonical route.
- `src/lib/workout-result-import/ingest-garmin-result.ts` — strict loopback/fixture/checksum guard,
  then delegation to ordinary durable ingestion.
- `src/lib/workout-result-import/types.ts` — two shared marker constants for the later Product
  consumer.
- `scripts/lib/runner-design-profile-fixture.ts` — separate future imported setup/readback while
  preserving the accepted design profile; also asserts authenticated Calendar eligibility and
  post-FIT evidence protection.
- `scripts/test-user.mjs` — named seed and self-cleaning proof commands reusing the existing QA pool,
  imported-source materialisation, lease, reset, and storage-cleanup owners.
- This canonical item — preflight, terminal lifecycle, evidence, and Frontend handoff.

The first two fixture files already contained concurrent completed standalone-Calendar changes; this
task preserved those bytes and added only the file-flow responsibility described above. No new file,
migration, table, RPC, storage model, provider path, dependency, or fixture framework was added.

### Validation inventory

| Check                       | Scenario / environment                              | Result | Evidence                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red discriminator           | Current source inspection                           | Passed | `CompletionPanel` local branch stops at unsaved preview; default design profile asserts AI provenance and has no future imported row.                                     |
| Canonical sample identity   | Local repository                                    | Passed | `shasum -a 256 sample-fit-from-zip.fit` matched the fixed admitted checksum.                                                                                              |
| Future imported setup       | Local Supabase, `isolation-a`, as-of `2026-08-16`   | Passed | Seed produced one `2026-08-18` Easy workout with `originKind=file_import`, stable source workout identity, one archived source, zero active/materialised plan containers. |
| Ordinary Calendar readback  | Authenticated persisted snapshot                    | Passed | `planMeta:null`; workout is `eligible_future_unlogged`, `canEditContent=true`, `canMove=true`, `canCopy=true`.                                                            |
| Reset / reseed / reset      | Existing QA pool lifecycle                          | Passed | Two seeds retained exactly one profile/source/workout and identical date/source identity without accumulation; canonical `pool-reset` returned all owned tables to zero.  |
| Local admission negatives   | Direct server owner, loopback Supabase              | Passed | Arbitrary-path marker, non-local provider, non-loopback app origin, and cross-runner workout ID all rejected; no asset/evidence mutation occurred.                        |
| Durable FIT lifecycle       | Existing parser/storage/projection, approved sample | Passed | One parsed asset, one actual-metrics row, one comparison, and one activity/workout match were read back.                                                                  |
| Evidence protection         | Canonical snapshot after FIT                        | Passed | Workout became `blocked` with `evidence_backed_workout`; Copy remained allowed while Edit/Move were denied.                                                               |
| Removal convergence         | Existing result-removal owner                       | Passed | Raw file availability changed `true -> false`; metrics and comparison identities remained stable.                                                                         |
| Isolation and cleanup       | `isolation-a` + `isolation-b`                       | Passed | Final inventory: every owned table zero, storage prefixes empty, leases empty.                                                                                            |
| QA lifecycle guard          | `npm run validate-test-user-lifecycle`              | Passed | Pool metadata authority, lease collision, cleanup-manifest, and protected-admin guards remained green.                                                                    |
| Static hygiene              | Task-owned source/docs                              | Passed | Targeted Prettier, ESLint, `node --check scripts/test-user.mjs`, filtered TypeScript, and `git diff --check` passed.                                                      |
| Shared runtime preservation | Existing managed process                            | Passed | Runtime PID remained unchanged; no start, stop, rebuild, browser, or runtime request was performed.                                                                       |

### Omitted checks and consequences

- Managed-runtime HTTP replay and browser proof were intentionally not run because this task was
  explicitly source/local-database only and the shared managed runtime was already owned. Therefore
  the later Product consumer request, reload presentation, file-dialog behaviour, and visible remove
  flow are not accepted here.
- The repository-wide TypeScript check was run and remains red on unrelated existing Frontend/Admin
  paths; filtering its output found no task-owned error. This receipt does not claim whole-repository
  type health.
- The full Backend DB suite was not run because it mutates other shared pool roles; the focused proof
  exercised the exact imported materialisation, ingestion, parser, persistence, evidence protection,
  isolation, and cleanup contracts changed here.
- A production build was not run because shared build/runtime output was occupied. Hosted Supabase,
  providers, deployment, Git lifecycle, browser acceptance, Global QA, and release readiness remain
  unclaimed.

### Ownership and next gate

- Role file: `agents/backend.agent.md`.
- Skills used: `skills/hito-backend-supabase-contract/SKILL.md` and the installed Supabase procedure.
- Subagents: none; no independent review was necessary after the deterministic persistence matrix.
- Lifecycle: **completed** for Backend Implementation DoD.
- Next owner: **FRONTEND Product** for the narrow local consumer bridge, followed by **QA** for
  independent AUD-03/AUD-04 browser replay. Global QA remains pending.
