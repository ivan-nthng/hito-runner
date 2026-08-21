# Hito Phase Zero Supabase Environment Admission

Work Item ID: `2026-08-19-hito-phase-zero-supabase-environment-admission`
Status: closed
Type: Migration
Priority: highest
Owner: PRODUCT
Epic: platform
Parent: `2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model`
Depends On: `2026-08-19-hito-phase-zero-routing-and-environment-documentation-batch`
Evidence From: [Hito Local Supabase Clean Baseline And Data Cutover](./2026-08-20-hito-local-supabase-clean-baseline-and-data-cutover.md)

## Scope

Resolve the factual identity and safe lifecycle of the local, preview and hosted Supabase
environments before the clean-baseline implementation. This is admission and evidence collection
only; it does not create a project, reset data, apply migrations, write fixtures, alter Vercel, or
perform a cutover.

## Archive Intent

Retain secret-free identity and lifecycle evidence that lets later clean-baseline work target exactly
one environment. Do not retain copied credentials or a second configuration source.

## Task

Admit the local environment and determine whether preview is actually isolated from hosted. Record
only evidence-backed project/deployment/configuration fingerprints and the remaining proof needed
for any unresolved row. Establish the exact preflight required before the later destructive clean
baseline/reset.

## Evidence

- [Environment register](../../process/hito-supabase-environment-register.md)
- [Phase-0 routing batch](2026-08-19-hito-phase-zero-routing-and-environment-documentation-batch.md)
- [Clean-slate plan](../../plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)

## What Not To Touch

- No Supabase schema/data/auth/storage/fixture mutation; no migration, reset, project/branch creation,
  backup, credential rotation, provider or Vercel change.
- No source, dependency, runtime, Notion, Git lifecycle, deployment or production action.
- Do not print or persist any credential, URL with embedded secret, token or private payload.
- Do not infer preview isolation from a file label; unresolved stays unresolved.

## Definition Of Done

- Local is proven loopback-only and mapped to its register row, or the precise missing capability is
  recorded without bypass.
- Preview and hosted have either distinct, source-backed identities or an explicit shared-hosted
  boundary; environment values remain redacted/fingerprinted.
- CLI link, configured endpoint class, Vercel target/revision evidence and migration baseline agree
  for every admitted row; any disagreement fails closed.
- The environment register is updated only with secret-free facts, timestamps and evidence links.
- The later clean-baseline task has an exact admission inventory: environment target, data class,
  allowed writes, current writer, backup/restore proof requirement, reset authority and rollback
  target.

## Validation

Use the canonical local/status and safe provider/configuration inspection seams. Verify no database,
storage, auth, fixture, provider, deployment or Git write occurred; redact secrets in all evidence.
Run scoped format/link/diff hygiene. No build, browser, QA, hosted mutation or release claim.

## Implementation Receipt

### Preflight

- Read the repository routing contract, BACKEND role, Supabase contract skill, this item, the
  environment register and only the applicable Phase-0 plan and identity/status seams.
- The checkout was `main` at `9143336bf55905f6009f4e4cd53dd64c456ce89f`, equal to the already
  present `origin/main` ref. The index was empty. Fifteen changed/untracked paths were present,
  including the two task-owned documents; the other thirteen paths were preserved. This task wrote
  only the register and this item.
- No credential value was printed or persisted. Environment values were reduced in process to
  endpoint class, project reference where non-secret, target label and short SHA-256 fingerprint.

### Secret-Free Identity Result

| Environment | Evidence-backed result                                                                                                                                                                                                                                                                            | Admission state                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `local`     | Repository project ID `hito-running`; configured endpoint class loopback; URL fingerprint `sha256:a43416c82b48dcd8`; repository CLI pin `2.109.1`                                                                                                                                                 | Not admitted because live status and migration history could not be read                                          |
| `preview`   | Vercel target label `preview`, but no Supabase endpoint or project ref in the pulled preview configuration                                                                                                                                                                                        | No distinct identity; explicitly shares the hosted restriction boundary                                           |
| `hosted`    | Configured hosted ref `dltfjwexyctmihclcjqj` matches the parity script's intended ref; endpoint fingerprint `sha256:cfbb3b6778a8f2ba`; Vercel project `hito-runner`, project fingerprint `sha256:bd7419e721db5595`, organization fingerprint `sha256:f3fd755c261edcb9`, target label `production` | Configuration-only shared hosted boundary; not admitted without live CLI, migration and deployment revision proof |

The checkout revision is not treated as Vercel deployment-revision evidence. Preview is not treated
as isolated merely because a preview-labelled file exists.

### Exact Stop Boundary

`npm run supabase:local:status` exited `1` through the repository-managed status seam with:
`Local Supabase is unavailable. Start Docker Desktop and run npx --yes supabase@2.109.1 start.`

Starting Docker Desktop or local Supabase is a runtime/lifecycle action excluded by this read-only
task. No start, alternate database URL, ad-hoc SQL, provider call or bypass was attempted. Per the
task's fail-closed rule, linked migration history and live Vercel inspection were not run after this
reserved-action discriminator.

### Reset Preflight Prepared

The environment register now records, for local and the shared preview/hosted boundary, the data
classification, writes permitted now, current-writer state, backup/restore requirement, reset
authority and rollback target. Before any later reset, the executing task must additionally prove
live target identity, exact migrations/types, Vercel deployment revision, writer freeze, backup
checksum, tested restore, reset scope, rollback owner and retention window.

### Validation And Preserved Boundaries

| Check                                                    | Result                      | Coverage consequence                                         |
| -------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| Repository-managed local status                          | Blocked before mutation     | Local live identity and migration baseline remain unproven   |
| Preview versus hosted configuration comparison           | Pass, secret-free           | No distinct preview identity; hosted restrictions apply      |
| Configured hosted ref versus parity-script intended ref  | Pass at configuration level | Live CLI-link and migration agreement remain unproven        |
| Vercel project/target configuration fingerprint          | Pass at configuration level | Deployment identity and application revision remain unproven |
| Database/storage/auth/fixture/provider/deployment writes | None                        | Read-only boundary preserved                                 |
| Git index                                                | Empty at preflight          | No staging, commit or push occurred                          |
| Scoped Prettier, Markdown links and whitespace hygiene   | Pass                        | No broader documentation validation was run                  |

No build, browser QA, database QA, hosted parity, deployment, reset or release acceptance is claimed.

## Stage

Closed after the successor local-clean-baseline Task completed Backend implementation and independent
QA under the accepted Docker Desktop trusted-private-network contract. The earlier stopped-runtime
blocker is retained above as historical evidence, not current lifecycle truth.

## Next Recommended Role

PRODUCT for any later preview/hosted admission; no owner is required for local Phase-0 admission.

## Closure Reconciliation — 2026-08-20

The local row is admitted only for the repository-managed, bounded Docker Desktop lifecycle proved
by the linked completed Task: pinned CLI `2.109.1`, factual wildcard IPv4/IPv6 publication, explicit
trusted-private-network admission, 47/47 migration parity, zero runtime rows, generated-type parity,
unchanged Boca identities and a final project-qualified stop. It is not loopback-only and is not an
external-hardening claim.

Preview still has no distinct proven Supabase identity and therefore remains inside the restricted
shared-hosted boundary. Hosted/preview writes, reset, cutover and cost decisions remain separately
unadmitted. Those residual external boundaries do not block local Runner implementation; the
environment register remains mandatory before any later environment action.

## Product Autonomous Runtime-Admission Authorization — 2026-08-20

When the preceding Notion reconciliation and its independent QA are passed, Ivan's Phase-0
authorization permits BACKEND to resume this exact Task without another Product prompt. It may
start only the repository-managed local Docker/Supabase runtime required to run the canonical
status and migration-history reads, then stop it if the existing local lifecycle requires that.

This changes no persistence boundary: no database reset, migration apply, SQL write, fixture,
storage/Auth/provider mutation, project/branch creation, credential/configuration change, Vercel
action, deployment or Git action is admitted. BACKEND records only redacted environment identity
and lifecycle facts, runs this Task's existing Definition of Done, and directly dispatches QA for
the independent read-only verification. QA returns any defect/evidence failure to BACKEND for
same-Task fix-forward. A pass releases the autonomous Phase-0 chain only if the parent Task's
Notion and documentation cutover criteria are already satisfied.

## Product Runtime-Data Disposition — 2026-08-20

Ivan explicitly confirms that no current Hito runtime data needs retention. Once this Task proves
the exact local and hosted Hito environment identities, the later Phase-1 clean-baseline Task may
delete all runner runtime data in its admitted target without a backup, restore rehearsal or
retention window as a decision gate. This includes Calendar workouts and source records; manual
templates; FIT/feed storage and metadata; results, logs, metrics, comparisons, insights and activity
projections; and disposable fixture identities/profiles/entitlements that belong to the target.

This does not widen the current Phase-0 read-only admission into a reset. It also does not authorize
deleting a Supabase project, Vercel configuration, Notion task data outside the Product-disposed
legacy batch, repository source/fixtures/documents, Git history, credentials, or any environment
whose identity has not first been proven as Hito's. A pre-delete count and referential-order check
remain required solely to prove the exact target and complete deletion, not to preserve data.

## Handoff Prompt

```text
ROLE: PRODUCT

Task: Hito Phase Zero Supabase Environment Admission — Runtime Admission Decision
Mode: Tracked decision and exact follow-up authorization
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-phase-zero-supabase-environment-admission.md
Environment register: /Users/ivan/Developer/hito-running/docs/process/hito-supabase-environment-register.md

The read-only BACKEND admission stopped because the canonical local status seam proved Docker/local
Supabase unavailable. Decide whether to authorize one separate BACKEND runtime-admission slice to
start Docker Desktop and repository-pinned local Supabase without reset or data mutation, then rerun
local status/migration parity and the read-only linked Supabase/Vercel identity checks. Preview has
no distinct Supabase identity and must remain the shared hosted boundary unless live evidence proves
otherwise. Do not authorize reset, migration apply, fixtures, hosted/provider mutation, deployment
or Git actions in this decision.
```

## Read-Only Runtime Admission Receipt — 2026-08-20

### Preflight And Intended Operation

- The active checkout was the isolated `codex/qa` worktree at
  `9143336bf55905f6009f4e4cd53dd64c456ce89f`, with an empty index and 29 pre-existing
  changed/untracked status records. The Notion QA writer was idle before this slice began. Only this
  canonical receipt is task-owned repository output.
- The intended environment was the register's local row: repository project ID `hito-running`,
  loopback-only status contract and repository-pinned Supabase CLI `2.109.1`. No URL, credential,
  token or database payload was printed or persisted.
- The admitted operation was limited to Docker/local Supabase lifecycle needed for read-only status
  and applied-migration identity. Reset, replay, SQL, fixtures, Auth/storage/data writes and every
  hosted/preview/provider action remained prohibited.

### Local Runtime And Migration Result

Docker context `desktop-linux` initially had no daemon socket. Docker Desktop was started through its
supported local application path; the daemon became healthy with server version `29.6.2`. Existing
project-scoped containers prove that this was a retained Hito stack rather than a new project, but
all five discovered Hito containers remained stopped:

- `supabase_auth_hito-running`: exited;
- `supabase_db_hito-running`: exited;
- `supabase_kong_hito-running`: exited;
- `supabase_rest_hito-running`: exited; and
- `supabase_storage_hito-running`: exited.

The canonical `npm run supabase:local:status` failed both before and after Docker daemon admission
with `Local Supabase is unavailable`. A normal offline invocation of pinned CLI `2.109.1` was then
allowed only to start the already-existing project stack; it exited `1` without changing any listed
container state. One bounded diagnostic invocation emitted only the privacy-safe discriminator:
`supabase start is already running`. A process inventory found no matching Supabase start process,
and a subsequent canonical status read remained unavailable.

BACKEND did not remove a lock, use `--debug`, invoke Docker container lifecycle directly, reset or
recreate the stack, or try another CLI/version. Consequently the applied local migration history,
live database identity and generated-type parity remain unreadable and are not admitted.

### Environment Admission Matrix

| Environment | Read-only result                                                                                                                   | Admission state                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Local       | Configured project `hito-running`, loopback contract, CLI `2.109.1`, healthy Docker daemon, retained but stopped Hito containers   | Blocked: canonical Supabase status and applied migration identity are unavailable |
| Preview     | Existing register supplies no distinct Supabase project ref or endpoint                                                            | Unresolved; remains part of the shared hosted restriction boundary                |
| Hosted      | Existing register configuration points to the intended hosted ref, but no live hosted/Vercel inspection was admitted in this slice | Configuration-only; not admitted and not treated as preview-isolated              |

### Validation And Preserved Boundaries

| Check                                | Scenario / environment             | Result                     | Evidence / consequence                                                                            |
| ------------------------------------ | ---------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| Docker reachability                  | Local `desktop-linux` context      | Pass after supported start | Daemon server `29.6.2`; no global Docker stop performed                                           |
| Loopback Supabase status             | Repository `supabase:local:status` | Blocked                    | Safe status seam remained unavailable; no endpoint or credentials emitted                         |
| Project lifecycle                    | Existing Hito local stack          | Blocked                    | Pinned start reports an existing start while no matching process exists; containers remain exited |
| Applied migrations                   | Pinned local CLI                   | Not run                    | Database status/identity precondition failed, so no migration list can be trusted                 |
| Preview/hosted distinction           | Environment register               | Fail-closed                | No distinct preview identity; hosted restrictions remain shared                                   |
| Database/Auth/storage/fixture writes | Local and hosted boundaries        | None                       | No reset, replay, SQL, data deletion, fixture or hosted action occurred                           |
| Git and unrelated bytes              | Active worktree                    | Preserved                  | Index stayed empty; source/configuration/dependencies were not edited                             |

Phase-1 runtime-data deletion remains strictly deferred. Independent QA was not dispatched because
there is no admitted live local environment or migration identity for QA to verify. The exact next
owner is PRODUCT for the stale/concurrent local Supabase start-state ambiguity; any fix must remain a
separate explicitly admitted lifecycle recovery and must not be treated as reset authority.

## Local Lifecycle Recovery Discriminator Receipt — 2026-08-20

### Preflight And Exact Owner

- The active `codex/qa` worktree remained at
  `9143336bf55905f6009f4e4cd53dd64c456ce89f`, with an empty index and the same 29
  changed/untracked status records. No other repository writer or matching Supabase start process
  was active. This receipt is the only task-owned repository write in this continuation.
- Docker context `desktop-linux` remained healthy on server `29.6.2`. No local or hosted endpoint,
  credential, token, private row or migration payload was printed or persisted.
- The intended recovery target remained only the retained `hito-running` local stack. Docker
  inspection proved that `supabase_db_hito-running` and `supabase_db_boca-boca` are both stopped,
  carry distinct project labels and mount distinct persistent database volumes. No other project
  would have been an implicit recovery target.

### Demonstrated Lifecycle Discriminator

A targeted search of the repository Supabase temporary directory, common Supabase cache/state
locations and operating-system temporary directories found no project-scoped start lock or PID
artifact. A second process inventory found no live Supabase or `npx` start command. Nothing temporary
therefore existed that could truthfully be removed under this task.

The exact artifact observed by pinned CLI `2.109.1` is the valid, stopped
`supabase_db_hito-running` container backed by persistent volume `supabase_db_hito-running`. This is
not a temporary lifecycle artifact. The result matches the official Supabase CLI
[v2.109.1 stopped-container defect](https://github.com/supabase/cli/issues/5917): that version's
start path reports `supabase start is already running` when the project database container exists
but is stopped. The subsequently merged
[upstream correction](https://github.com/supabase/cli/pull/5953) changes this behavior by removing
the stopped project's containers and unused networks, while retaining volumes, before normal
startup.

That upstream recovery action is outside the admitted boundary because this task explicitly forbids
container deletion. The pinned start path also does not provide sufficient evidence that a resumed
normal startup would avoid migration replay/apply. BACKEND therefore stopped before any further
start or lifecycle mutation. No lock, PID, container, network or volume was removed; no newer CLI,
direct Docker lifecycle, Compose, reset, SQL or database-URL bypass was used.

### Validation And Preserved Boundaries

| Check                              | Scenario / environment                     | Result                  | Evidence / consequence                                                                                    |
| ---------------------------------- | ------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Target project isolation           | Hito versus Boca local Docker assets       | Pass                    | Distinct project labels and persistent database volumes; no cross-project target admitted                 |
| Temporary lock/PID inventory       | Project/cache/OS temporary locations       | Pass: absent            | No removable stale temporary lifecycle artifact exists                                                    |
| Matching live process              | Supabase and `npx` start process inventory | Pass: absent            | The `already running` result is not owned by a live concurrent start                                      |
| Pinned CLI lifecycle discriminator | Supabase CLI `2.109.1`                     | Pass                    | Officially reproduced stopped-container detection defect                                                  |
| Existing-stack resume              | Repository-managed supported seam          | Blocked before mutation | Upstream recovery requires forbidden container deletion; non-replaying startup is not proven              |
| Canonical local status             | Repository status seam                     | Unavailable             | Stack remains stopped; live loopback identity is not admitted                                             |
| Applied migration identity         | Local database                             | Not run                 | Database status precondition remains unavailable; no migration result is fabricated                       |
| Database/Auth/storage/fixtures     | Local and hosted boundaries                | No mutation             | No reset, replay, apply, SQL, fixture, identity, storage, provider or Phase-1 deletion occurred           |
| Git and unrelated bytes            | Active worktree                            | Preserved               | Index remained empty; existing dirty records and all source/configuration/dependency bytes were preserved |

Preview and hosted facts remain unchanged and fail-closed. Independent QA was not dispatched
because local status and migration identity were not admitted. The next owner is PRODUCT for an
explicitly revised lifecycle boundary, such as admitting the upstream project-scoped
container-recreation behavior with separate proof of volume retention and migration semantics; it
must not be inferred from the present read-only authorization.
