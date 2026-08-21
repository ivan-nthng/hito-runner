# Hito Local Supabase Clean Baseline And Data Cutover

Work Item ID: `2026-08-20-hito-local-supabase-clean-baseline-and-data-cutover`
Status: completed
Type: Migration
Priority: highest
Owner: PRODUCT
Primary Area: Platform
Epic: platform-and-operations
Parent: `2026-08-19-hito-phase-zero-supabase-environment-admission`

## Scope

Recover the isolated local Hito Supabase project from the pinned CLI `2.109.1` stopped-container
detection defect by deleting only the exact admitted local Hito containers and volumes, then
recreating the project through the repository-pinned normal Supabase procedure and replaying the
current repository migration history into that newly clean local target.

## Archive Intent

Retain the exact destructive authority, resolved Docker identities, migration replay evidence,
clean-data proof and independent local QA result. Do not retain credentials, database payloads or a
second environment register.

## Product And Ivan Authorization

Ivan explicitly authorizes deletion of all current local Hito runner runtime data. Phase 0 proved
that the Hito and Boca Supabase Docker projects are isolated by distinct project labels, container
identities, persistent volumes and networks. No backup, restore rehearsal or retention window is
required for the admitted local Hito runtime data. This authorization permits normal repository
migration replay only into the newly clean local Hito target.

It does not authorize any hosted Supabase, Vercel, Notion, provider, Git, repository source,
configuration, dependency, fixture, generated-type or Boca mutation.

## Destructive Preflight Inventory — 2026-08-20

Docker context `desktop-linux` was healthy on server `29.6.2`. All admitted containers were exited.
The full Docker container IDs below are the deletion identity. Docker volume identity is its exact
engine name; the project label and creation time provide the independent scope discriminator.

### Admitted Hito Containers

| Container                       | Full Docker container ID                                           | State  | Project label  |
| ------------------------------- | ------------------------------------------------------------------ | ------ | -------------- |
| `supabase_auth_hito-running`    | `87714f108cfdca680b1b832f2520f6c597fcf1311ac5bea4230d1760515e5a69` | exited | `hito-running` |
| `supabase_db_hito-running`      | `52c62ec1f45d965a8f52cd12244a3ef5123fb58fba978ebf5d4a9b8a2328b57c` | exited | `hito-running` |
| `supabase_kong_hito-running`    | `da252e20556b5041ca5c2aeea7ff3153b930c95dd85ef39468a621142f1dfaad` | exited | `hito-running` |
| `supabase_rest_hito-running`    | `e75131e6b98c882c2f7b9a9ab964a98d32fd9d4fa63d855aee1d865010fa3bd4` | exited | `hito-running` |
| `supabase_storage_hito-running` | `45eb7139df605231c9caab3c734c4d1b6f63a42a5e21d185b7595b98c8b2f646` | exited | `hito-running` |

### Admitted Hito Volumes

| Exact Docker volume identity         | Created at             | Project label  |
| ------------------------------------ | ---------------------- | -------------- |
| `supabase_db_hito-running`           | `2026-08-19T13:09:51Z` | `hito-running` |
| `supabase_edge_runtime_hito-running` | `2026-08-09T17:26:09Z` | `hito-running` |
| `supabase_storage_hito-running`      | `2026-07-16T02:37:48Z` | `hito-running` |

The project network `supabase_network_hito-running` (`21422816ce2c`) is not admitted for manual
deletion. The repository-pinned lifecycle must own any network reuse or cleanup.

### Preserved Boca Identities

| Docker asset | Exact identity                                                                                    | Project label |
| ------------ | ------------------------------------------------------------------------------------------------- | ------------- |
| Container    | `f6b5cb719eaaf03a5b355916e4d64fe4af208b8a612a4aa417c3fa1f45607780` (`supabase_db_boca-boca`)      | `boca-boca`   |
| Container    | `184a34c80ac9379bd8633a6cb5b67d7231ca17a18da060beff61eac0709409a8` (`supabase_storage_boca-boca`) | `boca-boca`   |
| Container    | `c5914ff050d82c89c4a44983f3ba09d8989be1dc1d6843201e8c743a8ef207f2` (`supabase_rest_boca-boca`)    | `boca-boca`   |
| Container    | `52332697d7d0c3abb278de5b718489b2f1de25b573118588c670c797416ff719` (`supabase_auth_boca-boca`)    | `boca-boca`   |
| Container    | `10a908196c7c3068d8f1547866b3dcada4e13b53e1dd6ff64689cbc781657618` (`supabase_kong_boca-boca`)    | `boca-boca`   |
| Volume       | `supabase_db_boca-boca`, created `2026-08-11T19:13:58Z`                                           | `boca-boca`   |
| Volume       | `supabase_storage_boca-boca`, created `2026-08-10T23:14:39Z`                                      | `boca-boca`   |
| Network      | `supabase_network_boca-boca` (`60c44cca0ed0`)                                                     | `boca-boca`   |

No Boca asset is admitted for mutation. The repository was the `codex/qa` worktree at
`9143336bf55905f6009f4e4cd53dd64c456ce89f`, with an empty index and 29 pre-existing
changed/untracked status records. No matching Supabase lifecycle writer was active.

## Rollback Limitation

There is no rollback for erased local Hito runtime data or deleted Hito Docker volumes. Recovery is
limited to reconstructing the clean local environment from the current repository migration
history. This limitation is accepted by Product/Ivan and must not be represented as a retained-data
restore.

## Required Validation

| Check                | Required proof                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact deletion scope | Every removed container ID and volume name matches the admitted Hito inventory; every preserved Boca identity remains unchanged                |
| Pinned recreation    | Repository-pinned Supabase CLI `2.109.1` owns startup and migration replay for project ID `hito-running`                                       |
| Migration baseline   | All repository migrations apply from zero in chronological order and the applied local history matches repository truth                        |
| Canonical status     | `npm run supabase:local:status` reports the exact Docker Desktop exposure mode and expected ports without exposing credentials                 |
| Clean runtime data   | Existing Hito user/runtime data is absent after replay; no fixture seed is run                                                                 |
| Generated types      | No generated-type file is rewritten unless a direct parity failure requires it                                                                 |
| Preserved boundaries | Boca, hosted Supabase, Vercel, Notion, providers, Git, repository source/configuration/dependencies and unrelated dirty bytes remain unchanged |

## Stage

Independent Docker Desktop truthful-exposure and clean-baseline QA passed; the Hito stack is in its
required stopped terminal state and the Task awaits Product acceptance.

## Next Recommended Role

PRODUCT

## Implementation Receipt — 2026-08-20

### Preflight And Destructive Scope

- The `codex/qa` worktree was at `9143336bf55905f6009f4e4cd53dd64c456ce89f`, with an
  empty index and 29 pre-existing changed/untracked status records. No matching Supabase lifecycle
  writer was active. Creating this canonical item increased the status-record count to 30; every
  unrelated byte remained outside the task-owned write.
- Every full Hito container ID was re-resolved immediately before deletion and proved both
  `exited` state and project label `hito-running`. Every admitted volume name proved the same
  project label. The exact Boca container IDs, volume names/labels and network identity were checked
  before and after the operation.
- The five admitted stopped Hito containers and exactly three admitted Hito volumes were removed by
  full container ID and exact volume name. No glob, prune, Docker Desktop reset, force removal,
  cross-project command or hosted operation was used.

### Clean Reconstruction Result

The cached offline repository-pinned Supabase CLI reported version `2.109.1` and recreated project
ID `hito-running` through the normal `supabase start` lifecycle. It initialized a new database and
applied all 47 repository migrations in chronological order, from `20260506025058` through
`20260819124828`. A machine-readable migration comparison proved 47 repository versions, 47 applied
versions, identical order, no missing versions and no unknown versions.

No fixture command was run. The configured seed path did not exist, and startup reported that no
file matched `supabase/seed.sql`; therefore no seed SQL was applied. A supported pinned local
read-only query checked all public application tables plus user-owned Auth and Storage data seams:
36 tables were checked. All application, Auth user/session/identity, Storage object and multipart
rows were zero. The only nonzero rows were three `storage.buckets` definitions created by the three
repository migrations that explicitly insert bucket configuration; they are clean-baseline
configuration, not retained runtime content.

The direct generated-type parity gate initially differed only because raw CLI output is not
Prettier-formatted. After applying the repository's existing Prettier normalization in process, the
generated output and `src/lib/supabase/database.ts` were byte-identical: 62,934 bytes and matching
SHA-256 prefix `7492e8f8a725fca8`. The generated file was not rewritten.

### Loopback Admission Failure And Safe Stop

`npm run supabase:local:status` passed and reported API origin `http://127.0.0.1:54321`,
`loopback: true`, and no environment-file write. That canonical check classifies the reported URL,
but Docker's factual publish inventory simultaneously showed API `54321`, database `54322`, Studio
`54323`, mail `54324` and analytics `54327` bound to both `0.0.0.0` and `[::]`. The CLI itself warned
that all services were network-accessible and that Studio, pgMeta and analytics had no
authentication.

This is not a truthful physical loopback-only environment. Changing Docker/Supabase configuration,
host firewall policy or another project's runtime was not admitted. BACKEND therefore did not
dispatch QA. It used the pinned, project-qualified `supabase stop --project-id hito-running` seam to
remove the newly created Hito containers and end all wildcard listeners while preserving the newly
clean Hito database and Storage volumes. No Hito container remains running or stopped. Boca's five
original stopped container IDs and its two volume identities remain unchanged.

The normal CLI startup summary emitted generated local-development credential values in the
ephemeral command output despite the attempted line filter. No value was copied into a repository
file or this receipt, and the affected local services were stopped before task return. No hosted or
personal credential was involved.

### Validation Inventory

| Check                    | Scenario / environment                                     | Result   | Evidence / consequence                                                       |
| ------------------------ | ---------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| Exact Hito deletion      | Five admitted exited containers and three labelled volumes | Pass     | Full IDs/names and label guards matched before deletion                      |
| Boca preservation        | Five containers, two volumes and project network           | Pass     | Full container IDs and volume labels unchanged after Hito lifecycle          |
| Pinned recreation        | Offline cached Supabase CLI                                | Pass     | Exact version `2.109.1`; normal project start only                           |
| Migration replay         | Newly clean local database                                 | Pass     | 47/47 versions, ordered, no missing or unknown migration                     |
| Fixture/seed boundary    | Local startup                                              | Pass     | No fixture command; configured seed path absent and not applied              |
| Runtime-data absence     | 36 application/Auth/Storage data tables                    | Pass     | Zero user/runtime rows; only three migration-owned bucket definitions        |
| Generated types          | Clean schema versus repository file                        | Pass     | Prettier-normalized output byte-identical; no rewrite                        |
| Canonical URL status     | Repository-managed status command                          | Pass     | Reported `127.0.0.1`, loopback classification true, no env write             |
| Physical listener scope  | Docker published ports                                     | **Fail** | API/DB/Studio/mail/analytics published on wildcard IPv4 and IPv6             |
| Safe terminal lifecycle  | Project-qualified pinned stop                              | Pass     | No Hito containers/listeners remain; clean DB/Storage volumes retained       |
| Git and repository bytes | Active worktree                                            | Pass     | Index empty; source, migrations, fixtures, config and dependencies unchanged |

No independent QA, hosted Supabase, Vercel, Notion, provider, browser, build, fixture or Git
lifecycle action was performed. The exact next owner is PRODUCT for a decision and separately
admitted mechanism that makes the local Supabase port publications genuinely loopback-only. The
clean migration/data baseline itself does not authorize weakening that environment boundary.

## Loopback-Binding Mechanism Discovery Receipt — 2026-08-20

### Read-Only Preflight

- The Hito stack remained stopped throughout discovery. No Hito container or Hito project network
  existed; only the clean `supabase_db_hito-running` and `supabase_storage_hito-running` volumes
  remained. Boca's stopped containers, volumes and network were read only.
- The index remained empty and the checkout retained 30 changed/untracked status records. No
  source, configuration, dependency, Docker object, credential, data, migration, fixture, hosted
  service or Git lifecycle state was changed. This canonical receipt is the only task-owned write.
- Inspection was limited to `supabase/config.toml`, the existing local configuration/status script,
  pinned CLI `2.109.1` help/source, stopped Docker metadata and official Supabase/Docker
  documentation.

### Supported Repository-Scoped Mechanism

The repository config exposes service ports but has no supported host-bind address field. Pinned
CLI `2.109.1` does expose the global `--network-id` flag. Its exact tagged source resolves that flag
to the container network mode and otherwise falls back to `supabase_network_<project>`:

- [pinned network-ID resolution](https://raw.githubusercontent.com/supabase/cli/v2.109.1/apps/cli-go/internal/utils/config.go);
- [pinned container network selection](https://raw.githubusercontent.com/supabase/cli/v2.109.1/apps/cli-go/internal/utils/docker.go).

The same pinned start source publishes API, database, Studio, mail and analytics ports with a host
port but no explicit host IP. Docker therefore uses the selected bridge network's default published
port binding. The official
[Supabase local-development safety procedure](https://supabase.com/docs/guides/local-development)
documents the exact supported solution: create a user-defined Docker bridge with
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`, then invoke `supabase start --network-id`
with that network. Docker documents that this option restricts unspecified published-port bindings
to the selected interface rather than the default `0.0.0.0` and `[::]` behavior:

- [Docker bridge default host binding](https://docs.docker.com/engine/network/drivers/bridge/#default-host-binding-address);
- [Docker port-publishing bind option](https://docs.docker.com/engine/network/port-publishing/#setting-the-default-bind-address-for-containers).

This is project-scoped and requires neither a Docker Desktop daemon setting nor a host firewall,
proxy or Compose compatibility stack. The network must be pre-created and validated because pinned
CLI source creates an absent custom network without driver options and treats an existing network as
reusable without validating its options. The `--network-id` selection is process-local, not stored
in `config.toml`; every command that creates or recreates containers must therefore use the same
repository-managed seam. A bare later `start` or `db reset` would fall back to the wildcard-bound
default network.

### Exact Minimal Implementation Plan

1. Extend the existing `scripts/configure-local-supabase-env.mjs` local-environment owner rather
   than adding a proxy, Compose file or second runtime. Add one deterministic network constant, for
   example `supabase_loopback_hito-running`, and lifecycle modes for start/reset plus the existing
   status check.
2. Before start/reset, inspect that exact network. Create it only when absent, using Docker's
   supported bridge driver, exact Hito labels and
   `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`. Fail closed if an existing network has a
   different ID, driver, option, project labels or any foreign attached container.
3. Invoke only cached pinned CLI `2.109.1`, always with
   `--network-id supabase_loopback_hito-running`, for `start` and every container-recreating local
   database command. Keep status/configure output privacy-safe and never forward the raw CLI key
   summary. Add the corresponding package scripts so the repository has one advertised lifecycle
   path; remove the current bare-start instruction.
4. Preserve the clean DB and Storage volumes. No renewed volume deletion, migration rewrite, reset
   or fixture seed is required merely to change the container network. The next admitted start can
   attach newly created containers to the loopback bridge while reusing the already-proven clean
   volumes.
5. Validate the network option and labels before start; after start, require every published Docker
   `HostIp` to equal `127.0.0.1`, reject `0.0.0.0`, `::` and unexpected ports, and prove canonical
   status still reports `127.0.0.1`. Then rerun 47/47 migration identity, zero user/runtime rows,
   generated-type parity and Boca identity preservation before independent QA.
6. Exercise a project-qualified stop/start and, if reset remains an advertised repository command,
   one reset with the same `--network-id` to prove the flag cannot silently regress to the default
   network. Keep Global QA, hosted, release and deployment outside this task.

### Local-Key Rotation Decision

Renewing the clean stack does not rotate the values emitted by pinned CLI `2.109.1`. Its
[tagged API-key source](https://raw.githubusercontent.com/supabase/cli/v2.109.1/apps/cli-go/pkg/config/apikeys.go)
contains fixed local publishable/secret defaults and derives legacy anon/service-role JWTs from a
fixed default local JWT secret when the optional auth key fields are absent. Recreating containers
or deleting volumes with the same repository config therefore reproduces the same defaults.

The transient output did not expose a hosted or user-owned credential, and the services were
stopped. The required remediation is the loopback bind, not another destructive clean replay. If
Product independently requires non-default local credentials, pinned source supports
environment-backed `auth.jwt_secret`, `auth.anon_key`, `auth.service_role_key`,
`auth.publishable_key` and `auth.secret_key`; generating, storing and rotating those values would be
a separate credential/configuration task. It is not necessary for this clean-baseline recovery and
was not inspected or performed here.

### Discovery Validation Inventory

| Check                               | Result        | Evidence / consequence                                                                              |
| ----------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| Repository config host-bind field   | Absent        | Ports only; no truthful `config.toml` bind-address solution                                         |
| Pinned CLI custom network           | Supported     | `2.109.1 --help` and tagged source select the supplied `--network-id`                               |
| Project-scoped loopback enforcement | Supported     | Official Supabase procedure plus Docker bridge bind option                                          |
| Global Docker/firewall requirement  | Not required  | User-defined bridge option is local to one named Docker network                                     |
| Lifecycle persistence               | Not automatic | Repository wrapper must carry the network ID on every container-recreating command                  |
| Clean-volume recreation             | Not required  | Existing clean DB/Storage volumes can be reused on the custom network                               |
| Key rotation by recreation          | Not effective | Pinned CLI defaults are fixed and repeat across clean recreations                                   |
| Runtime proof                       | Not run       | Discovery prohibited starting containers; physical bind remains unaccepted until implementation     |
| Preserved boundaries                | Pass          | Hito remained stopped; Boca, repository source/config, hosted services, data and Git were untouched |

The exact next owner remains PRODUCT to admit the bounded repository lifecycle implementation above.
No QA dispatch is appropriate until the implementation produces live loopback-only Docker binding
evidence.

## Loopback Lifecycle Implementation Attempt Receipt — 2026-08-20

### Preflight And Reuse Boundary

- The active `codex/qa` worktree remained at
  `9143336bf55905f6009f4e4cd53dd64c456ce89f` with an empty index. Thirty pre-existing
  changed/untracked status records were preserved; the retained lifecycle guard increased the final
  count to 31. No unrelated byte was staged or rewritten.
- The implementation reused `scripts/configure-local-supabase-env.mjs`, the existing owner of the
  pinned local status/configuration contract. No Compose file, proxy, compatibility runner, custom
  key, dependency, migration, fixture or second lifecycle owner was added.
- Immediately before mutation, no Hito container or Hito network existed. The clean
  `supabase_db_hito-running` and `supabase_storage_hito-running` volumes existed with the expected
  Hito project labels. The five full Boca container IDs, two labelled volume identities and Boca
  network ID matched the preserved inventory above.

### Live Mechanism Result And Root Discriminator

BACKEND created only `supabase_loopback_hito-running`, using bridge driver, both exact Hito project
labels and `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`. Docker returned network ID
`14742595587c2797d0e1cdb00057f65d59b52ca35731f3167e2f692f0fd96081`, and a fresh inspection
proved the exact option and labels. Repository-pinned Supabase CLI `2.109.1` then received
`--network-id supabase_loopback_hito-running`; it attached all 12 Hito containers only to that
network and reused the clean Hito volumes. Raw CLI output remained suppressed, and no reset or seed
was run.

The supported network mechanism did not produce the documented host binding on this execution
platform. Docker Desktop `4.83.0` / Engine `29.6.2` showed an empty `HostIp` in each relevant
container's requested `HostConfig.PortBindings`, but materialised API `54321`, database `54322`,
Studio `54323`, mail `54324` and analytics `54327` on both `0.0.0.0` and `::`. This isolates the
first incorrect owner to Docker Desktop's published-port materialisation: the repository network
identity, network option, pinned CLI network selection and container attachment all matched, while
the resulting factual `HostIp` values did not.

The documented repository-scoped mechanism is the exact one used here: the
[Supabase local-development safety procedure](https://supabase.com/docs/guides/local-development)
selects a bridge with this option via `--network-id`, and
[Docker's port-publishing contract](https://docs.docker.com/engine/network/port-publishing/#setting-the-default-bind-address-for-containers)
states that the bridge option changes unspecified host bindings to `127.0.0.1`. Satisfying the
contract now requires a Docker Desktop/platform correction or an explicitly admitted different
mechanism. Global Docker settings, firewall changes, manual container recreation and a proxy or
Compose compatibility stack remain outside this task.

### Fail-Closed Result

The pinned, project-qualified stop removed only the newly created Hito containers and custom
network after the first physical-binding failure. The clean Hito database and Storage volumes were
retained, all five Hito ports have no listener, and the exact Boca container, volume and network
identities remain unchanged. No hosted service, user data, repository configuration, source domain,
fixture, Git lifecycle or credential was touched.

The retained source change strengthens the existing canonical status/configuration owner: it now
requires the exact Hito network driver, option and labels; rejects foreign attachments; requires
every Hito container to be running only on that network; and rejects every published `HostIp` other
than `127.0.0.1`. It also invokes pinned status with the exact network ID and removes the former
bare-start instruction. Consequently, a later bare start/reset that creates or uses a wildcard
network cannot be reported as an admitted local environment. The attempted start/reset wrapper was
not retained because this Docker Desktop version would create a transient wildcard listener before
the post-start guard could reject it.

### Validation Inventory

| Check                         | Scenario / environment                            | Result      | Evidence / consequence                                                                                 |
| ----------------------------- | ------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Network identity/options      | Exact Hito custom bridge                          | Pass        | Exact name, bridge driver, two Hito labels and `host_binding_ipv4=127.0.0.1`                           |
| Pinned CLI network selection  | Supabase CLI `2.109.1` start                      | Pass        | All 12 Hito containers attached only to the supplied network                                           |
| Physical listener binding     | Docker published-port inventory                   | **Fail**    | Five services materialised on `0.0.0.0` and `::`, not `127.0.0.1`                                      |
| Fail-closed canonical status  | Stopped terminal state                            | Pass        | Status rejects the absent admitted network rather than claiming URL-only loopback                      |
| Reset safety boundary         | Repository lifecycle source                       | Pass        | No reset path was retained or executed while live loopback admission is impossible                     |
| Safe terminal lifecycle       | Project-qualified pinned stop                     | Pass        | No Hito container, custom network or listener remains; clean Hito volumes retained                     |
| Prior migration/data baseline | Retained clean volumes                            | Not rerun   | Earlier 47/47 and zero-runtime-data proof remains in this item; safety stop precluded a new live query |
| Script syntax                 | Node parser                                       | Pass        | `node --check scripts/configure-local-supabase-env.mjs`                                                |
| Focused formatting            | Lifecycle script and canonical item               | Pass        | Prettier check passed                                                                                  |
| Type diagnostics              | Existing checkout dependencies                    | Not covered | Worktree lacks resolvable local `vite/client` types; no TypeScript production source changed           |
| Diff/index hygiene            | Active checkout                                   | Pass        | `git diff --check` passed; index empty; only this item and the lifecycle script are task-owned changes |
| Boca preservation             | Five containers, two labelled volumes and network | Pass        | Full IDs, stopped state, labels, creation identities and network ID unchanged                          |

Independent QA was not dispatched because the required physical loopback outcome is demonstrably
false. The smallest next owner is PRODUCT for an explicit platform-level decision. No local clean
baseline, Global QA, hosted, release or deployment acceptance is claimed.

## Docker-Only Platform Boundary Decision — 2026-08-20

### Decision

Ivan accepts the existing Docker Desktop `desktop-linux` runtime as Hito's only local container
runtime. Docker Desktop `4.83.0` / Engine `29.6.2` factually publishes the Supabase ports on
`0.0.0.0` and `::` even when the supported project bridge requests `127.0.0.1`. The local contract
therefore records a **Docker Desktop wildcard development exposure**; it never calls that state
loopback-only or externally hardened.

The exposure is admitted only for bounded repository-managed development/validation with disposable
Hito data, expected Hito ports and exact project identity. The stack remains stopped outside the
active validation window. It is forbidden on an untrusted/public network, with retained personal or
sensitive data, or when any unexpected listener/project/port appears. This is an explicit accepted
constraint, not evidence that wildcard publication is non-routable.

### Source Basis And Option Disposition

- Supabase identifies Docker Desktop as its preferred local runtime and requires localhost binding
  on an untrusted network: [Supabase local development](https://supabase.com/docs/guides/local-development).
- Supabase states that the local stack is not hardened, has default credentials and must never be
  exposed to external traffic: [Supabase local workflow](https://supabase.com/docs/guides/local-development/cli-workflows).
- Docker states that published Docker Desktop ports are made available through its backend port
  forwarding to the host or local network: [Docker Desktop networking](https://docs.docker.com/desktop/features/networking/networking-how-tos/).
- Docker treats an unspecified published address as all host addresses and `127.0.0.1` as the
  host-only form: [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/).

| Direction                                              | Decision         | Reason                                                                                                                                                           |
| ------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing Docker Desktop with truthful bounded exposure | **Accepted**     | Uses the one existing runtime and repository lifecycle; wildcard publication is recorded as a constraint and limited to disposable, task-scoped local validation |
| Alternative runtime, proxy, Compose or second stack    | Rejected by Ivan | Adds infrastructure and a second operational owner                                                                                                               |
| Host firewall or global Docker configuration           | Rejected by Ivan | Changes host-wide security semantics and can affect Boca                                                                                                         |
| Treat wildcard publication as loopback/non-routable    | Rejected         | Contradicts observed Docker state and has no source-backed routing proof                                                                                         |

### Exact Admission Proof

BACKEND may accept the Docker-only local environment only when all of the following pass in one
recorded, bounded run:

1. Docker context is exactly `desktop-linux`; the server identity/version matches the admitted
   Docker Desktop environment. No alternative daemon or persistent context change exists.
2. The active network is explicitly classified as trusted/private for this run. If trust cannot be
   established or the machine is on a public/untrusted network, keep Hito stopped; do not infer trust
   from an SSID name or from Docker output.
3. Before and after execution, the exact Boca container IDs, volumes, network and stopped state are
   unchanged. No Boca lifecycle or global Docker command is issued.
4. Pinned Supabase CLI `2.109.1` creates only project `hito-running`. Every Hito container/network,
   label and publication matches the exact expected inventory. The guard reports API, database,
   Studio, mail and analytics as wildcard IPv4/IPv6 exposure and rejects missing, additional or
   differently mapped ports.
5. Canonical status reports `exposureMode: docker-desktop-wildcard`,
   `networkConstraint: trusted-private-only`, `disposableDataOnly: true` and the expected API origin,
   without printing credentials or the false label `loopback-only`.
6. The clean target retains 47/47 migration parity, zero user/runtime rows, no fixture seed and
   generated-type parity. Only task-scoped disposable fixture data may be added later, with cleanup
   before stop.
7. The repository-managed project-qualified stop runs immediately after validation. Final proof
   shows no Hito container, network or listener remains while the retained Hito DB/Storage volumes
   and all Boca identities remain unchanged.
8. QA proportionally replays context/project/port classification, truthful status, clean-baseline
   identity, one focused local consumer smoke, cleanup/stop and Boca preservation. A same-LAN
   reachability probe, when available without new infrastructure, is recorded as exposure evidence,
   not expected to fail.

An untrusted/unknown network, non-disposable or sensitive data, unexpected port/listener/container,
foreign attachment, credential output, Boca movement, migration/data/type mismatch, failed cleanup
or inability to stop fails closed. No proxy, firewall, alternative runtime, Compose layer, global
Docker setting or policy that relabels wildcard as loopback may be added.

### Rollback And Preserved State

On any failure, invoke only the pinned project-qualified Hito stop. Remove only an exact newly
created Hito network after identity/attachment proof when the existing lifecycle owns that cleanup;
do not remove retained clean Hito DB/Storage volumes, any Boca asset or any Docker Desktop setting.
Final state is Docker context `desktop-linux`, no Hito container/network/listener, unchanged Boca
identities and retained Hito recovery volumes.

### Lifecycle And BACKEND Handoff

Ivan's Docker-only decision removes the platform-choice blocker. The existing BACKEND-owned
`scripts/configure-local-supabase-env.mjs` lifecycle/status seam is unambiguous; the same Task moves
to BACKEND as `ready`:

```text
ROLE: BACKEND

Task: Hito Local Supabase Clean Baseline And Data Cutover
Stage: Docker Desktop truthful-exposure lifecycle correction and clean-baseline continuation
Canonical item: docs/tasks/backlog/2026-08-20-hito-local-supabase-clean-baseline-and-data-cutover.md
Parent plan: docs/plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md

Ivan's accepted platform decision is Docker Desktop only. Read AGENTS.md, agents/backend.agent.md,
skills/hito-backend-supabase-contract/SKILL.md, the complete canonical item, the Phase-0
environment-admission item, the parent plan, the environment register and the existing
scripts/configure-local-supabase-env.mjs lifecycle owner.

Reuse that one lifecycle/status seam. Remove the hard HostIp=127.0.0.1 admission requirement and
replace it with truthful Docker Desktop exposure reporting and exact fail-closed checks from the
canonical decision: context desktop-linux, expected Hito project/network/labels and exact five
published service ports, wildcard IPv4/IPv6 classification, trusted/private-network constraint,
disposable-data-only boundary, secret-safe output, project-qualified stop and zero final Hito
listeners. Never call the environment loopback-only and never infer wildcard is non-routable.

Do not add another runtime, proxy, firewall, Compose layer, global Docker setting, compatibility
path or infrastructure. Preserve Boca byte-for-byte and retain the exact Hito-only destructive
authority and clean volumes. Re-establish 47/47 migration parity, zero user/runtime rows, no seed and
generated-type parity, run the smallest focused local consumer smoke, then stop Hito immediately.
Fail closed on unknown/untrusted network, unexpected Docker identity/port/listener, sensitive data,
credential output, Boca movement or cleanup failure. After implementation proof passes, hand the
same Task directly to QA for proportional independent replay of the documented inventory.

Update the existing secret-free Supabase environment register only after the live proof passes, so
its local row names the Docker Desktop wildcard development exposure, bounded trusted/private-network
and disposable-data constraint, and required final stopped state. Until then the register remains an
unmet admission contract; do not weaken it speculatively.

Do not touch hosted Supabase, Vercel, Notion, providers, fixtures, application source, Git lifecycle
or release state. Record a truthful English implementation receipt and report completion to Ivan in
Russian.
```

No runtime or source implementation occurred in this architecture decision.

## Docker Desktop Lifecycle Implementation Receipt — 2026-08-20

### Implemented Boundary

- BACKEND reused `scripts/configure-local-supabase-env.mjs` as the single local lifecycle/status
  owner and retained pinned Supabase CLI `2.109.1`. `package.json` now exposes only the corresponding
  project-scoped `start` and `stop` entry points in addition to the existing configure/status paths.
- Every lifecycle mode rejects a Docker daemon override and requires context `desktop-linux` plus
  the admitted Docker Desktop `4.83.0` / Engine `29.6.2` identity. Start, status and configure also
  require the explicit per-run `--trusted-private-network` admission and a private default IPv4
  route; no SSID or Docker output is treated as proof of trust. Stop remains available without that
  admission so an untrusted-network transition cannot prevent cleanup.
- The running guard requires the exact default Hito network, both Hito project labels, the twelve
  pinned-CLI containers, no foreign attachment and exactly five host publications: API `54321`,
  database `54322`, Studio `54323`, mail `54324` and analytics `54327`. Each service must factually
  materialise on both `0.0.0.0` and `::`; any missing, additional, empty or differently owned mapping
  fails closed.
- Safe status reports `exposureMode: docker-desktop-wildcard`,
  `networkConstraint: trusted-private-only`, `disposableDataOnly: true`, the five port names and the
  local API origin. It does not claim loopback-only exposure and does not forward CLI output or
  credentials. The existing managed `.env.local` path was used once because this worktree had no
  file; it contains only ignored local keys, has mode `0600` and was never printed.
- Project-qualified pinned stop preserves the two labelled clean Hito DB/Storage volumes and
  requires zero Hito containers, networks and five-port listeners before it returns success. No
  alternate runtime, proxy, firewall, Compose layer, global Docker setting, reset or seed path was
  added.

### Live Proof And Clean Baseline

One initial implementation attempt expected an obsolete container spelling and an unused imgproxy
container. The guard rejected the mismatch and completed the project-qualified stop before any
database proof. Read-only Docker events established the exact pinned inventory
(`supabase_pg_meta_hito-running`, no imgproxy); the corrected guard then admitted the bounded live
window.

Pinned migration history matched all 47 repository versions in exact order, from `20260506025058`
through `20260819124828`, with no missing or unknown version. A read-only aggregate inventory checked
56 base tables across `public`, `auth` and `storage`: all 53 user/runtime seams were zero and the only
allowed non-migration data was the three migration-owned `storage.buckets` definitions. No seed or
fixture source was run.

Fresh local TypeScript generation was formatted in process and matched
`src/lib/supabase/database.ts` byte-for-byte: 62,934 bytes and SHA-256
`7492e8f8a725fca847730d3355962b4b8c48652923ecb8fd9e2dcc3a328a0ffb`. The generated file was not
rewritten.

The existing local Runner Calendar context persistence proof passed using three disposable Auth
identities and its normal cleanup. Auth retained eight audit rows from that proof; the pre-smoke
inventory had established zero, so BACKEND deleted exactly those eight task-owned
`auth.audit_log_entries` rows and reran the complete 56-table inventory. Final user/runtime rows are
zero. The temporary dependency bridge used to expose the already-installed checkout dependencies
was removed, and the pre-existing worktree `node_modules/.cache` content was restored
byte-identically.

A probe through the host's private-LAN address reached all five ports, as expected for the recorded
wildcard publication. This is exposure evidence, not a loopback or external-hardening claim.

### Validation Inventory

| Check                  | Scenario / environment                    | Result | Evidence                                                                                         |
| ---------------------- | ----------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Docker identity        | Default context and daemon                | Pass   | `desktop-linux`; Docker Desktop `4.83.0`; Engine `29.6.2`; no daemon override                    |
| Network admission      | Explicit bounded run                      | Pass   | Trust flag present; default interface and gateway classified private IPv4 without SSID inference |
| Hito project identity  | Containers/network/volumes                | Pass   | Exact 12 containers, one default labelled network and two retained labelled volumes              |
| Truthful exposure      | Docker publications and host listeners    | Pass   | Exact five ports on both `0.0.0.0` and `::`; same-LAN address reachable as expected              |
| Secret-safe status     | Start/configure/status/stop               | Pass   | Only redacted JSON fields emitted; no CLI credential output forwarded                            |
| Migration parity       | Pinned local CLI                          | Pass   | 47 repository versions = 47 local versions, exact ordered match                                  |
| Runtime-data baseline  | 56 `public`/`auth`/`storage` tables       | Pass   | Zero user/runtime rows; three migration-owned bucket definitions only                            |
| Generated types        | Fresh local generation in memory          | Pass   | Exact 62,934-byte/SHA-256 match; repository file untouched                                       |
| Focused consumer smoke | Runner Calendar context persistence       | Pass   | Existing disposable three-user proof passed; eight task-owned audit rows removed afterward       |
| Final stop             | Project-qualified pinned lifecycle        | Pass   | Zero Hito containers, networks and listeners; DB/Storage volumes retained                        |
| Boca preservation      | Five containers, two volumes and network  | Pass   | Full IDs, stopped state and all four preflight inspect hashes unchanged                          |
| Static and hygiene     | Lifecycle script/package/current checkout | Pass   | Node syntax, scoped Prettier, `git diff --check` and empty index                                 |

No hosted Supabase, Vercel, Notion, provider, browser, Global QA, build, Git lifecycle, release or
deployment action was performed. Independent QA remains required and is now the current owner of
this same Task.

## Independent QA Receipt — 2026-08-20

### Verdict And Boundary

QA independently accepted the documented Docker Desktop wildcard-development lifecycle and clean
local Supabase baseline. The bounded run used only the repository-managed `supabase:local:start`,
`supabase:local:status` and project-qualified `supabase:local:stop` paths, with the explicit
`--trusted-private-network` admission where required. It did not call the environment loopback-only
or infer that wildcard publication was non-routable.

Preflight proved context `desktop-linux`, Docker Desktop `4.83.0` / Engine `29.6.2`, a private IPv4
default route, zero Hito containers/networks/listeners, exactly the retained Hito DB/Storage volumes,
an empty Git index and no competing local Supabase writer. The five full stopped Boca container IDs,
two volume identities and network ID matched the admitted inventory.

### Independent Replay

The running project contained exactly the 12 expected pinned-CLI containers on the one labelled
`supabase_network_hito-running` bridge with no foreign attachment. Docker factually published only
API `54321`, database `54322`, Studio `54323`, mail `54324` and analytics `54327`; every publication
had both `0.0.0.0` and `::` bindings. All five host listeners existed and all five were reachable
through the host private-LAN address, which is retained as expected exposure evidence.

Repository and local migration histories matched all 47 versions in exact order from
`20260506025058` through `20260819124828`. Before smoke, all 53 user/runtime tables were zero and
`storage.buckets` contained only the three migration-owned definitions. Fresh generated types were
formatted in memory and matched `src/lib/supabase/database.ts` byte-for-byte: 62,934 bytes and
SHA-256 `7492e8f8a725fca847730d3355962b4b8c48652923ecb8fd9e2dcc3a328a0ffb`; the file was not rewritten.

The existing Runner Calendar context local persistence proof passed. It left exactly eight Auth
audit rows after a proved pre-smoke count of zero and while no other writer existed. QA deleted only
those eight attributable rows with a count-guarded single-statement cleanup and proved full
53-table runtime convergence to zero again. The temporary dependency bridge was removed in the same
command, and the original `node_modules/.cache` archive hash remained
`8369850c673cef36e0fa9b4ede32c46e7c70be19f226ffd76de9250125d08ffd` before and after.

### Validation Inventory

| Check                            | Scenario / environment                               | Result | Evidence                                                                           |
| -------------------------------- | ---------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Docker and network admission     | Docker Desktop bounded private-network run           | Pass   | Exact context/daemon and explicit private-route classification                     |
| Hito project identity            | Containers, network, labels and attachments          | Pass   | Exact 12 containers, one expected bridge, no foreign attachment                    |
| Truthful exposure                | Docker publications, listeners and private-LAN probe | Pass   | Exact five ports on `0.0.0.0` and `::`; 5/5 LAN reachability                       |
| Secret-safe lifecycle            | Start/status/stop output                             | Pass   | Safe structured fields only; no credential value forwarded                         |
| Migration parity                 | Repository versus pinned local CLI                   | Pass   | 47/47 ordered, no missing or unknown version                                       |
| Clean data                       | `public`, `auth` and `storage` base tables           | Pass   | 53 runtime tables zero; three migration-owned buckets only                         |
| Generated types                  | Fresh in-memory generation                           | Pass   | Exact byte/SHA match; repository file unchanged                                    |
| Focused consumer smoke           | Runner Calendar context persistence                  | Pass   | Existing proof passed; eight attributable audit rows removed                       |
| Final cleanup                    | Project-qualified pinned stop                        | Pass   | Zero Hito containers, networks and five-port listeners; two clean volumes retained |
| Boca and repository preservation | Before/after inventories and hashes                  | Pass   | Full Boca identities/hashes unchanged; index empty; dependency cache restored      |

The first attempted audit cleanup used a multi-statement transaction form unsupported by this CLI
query seam; it failed without deleting rows. QA re-proved the count was still exactly eight, then
used one count-guarded CTE and verified zero-runtime convergence. No implementation fix was needed.

No seed, browser, hosted Supabase, Vercel, Notion, provider, Global QA, build, Git lifecycle, release
or deployment check was run. This verdict accepts only the documented local Docker Desktop
wildcard-exposure lifecycle and clean-baseline contract. The final state is context `desktop-linux`,
zero Hito containers/networks/listeners, retained Hito DB/Storage volumes, unchanged stopped Boca
assets and an empty Git index. The next owner is PRODUCT for final Task acceptance and subsequent
plan routing.
