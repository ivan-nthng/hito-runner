# Hito Supabase Environment Register And Lifecycle

## Status And Purpose

Active Phase-0 secret-free register and admission runbook. It records environment identity and
authority, never credential values. A file name, URL, CLI link or Vercel label alone is not authority.
Every database/storage/auth action must resolve to exactly one admitted row and fail closed when
evidence disagrees.

## Current Register

| Environment | Identity evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Purpose and data                                                                                                                             | Allowed actions                                                                                                                                                                                                                                  | Lifecycle / unresolved proof                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local`     | [`supabase/config.toml`](../../supabase/config.toml) declares project ID `hito-running`; [`scripts/configure-local-supabase-env.mjs`](../../scripts/configure-local-supabase-env.mjs) pins CLI `2.109.1`, requires Docker context `desktop-linux` and Docker Desktop `4.83.0` / Engine `29.6.2`, and reports exact wildcard IPv4/IPv6 publications for API `54321`, database `54322`, Studio `54323`, mail `54324` and analytics `54327`. The managed API origin remains `http://127.0.0.1:54321`, but it is not listener-scope evidence.                                     | Disposable development and `qa_fixture`; synthetic role-scoped identities only; no retained personal or sensitive data                       | Bounded project-scoped lifecycle only after explicit per-run trusted/private-network admission. Pinned migrations and task-scoped disposable proof are allowed only when the active Task admits them; final project-qualified stop is mandatory. | **Admitted with Docker Desktop wildcard development exposure; final state stopped.** At `2026-08-20`, live proof established exact project/network/labels, 47/47 ordered migration parity, zero user/runtime rows, no seed, generated-type parity and unchanged Boca identities. The stack must remain stopped outside the bounded validation window; unknown/untrusted network, unexpected port/project/data or failed cleanup revokes admission. |
| `preview`   | `.vercel/.env.preview.local` exists and declares the Vercel target label `preview`, but supplies no Supabase endpoint or project reference. It does not prove a distinct provider project.                                                                                                                                                                                                                                                                                                                                                                                    | Intended isolated synthetic preview and candidate proof; production/personal data remains prohibited if a distinct preview is later admitted | Read-only local configuration inspection only                                                                                                                                                                                                    | **Unresolved and mapped to the shared hosted boundary below.** It inherits hosted restrictions. Distinct project ref, endpoint, deployment revision, synthetic-data policy, owner and lifecycle evidence are all missing.                                                                                                                                                                                                                          |
| `hosted`    | Local production configuration resolves to hosted endpoint class and project ref `dltfjwexyctmihclcjqj`, matching the intended ref in [`scripts/validate-supabase-deployment-parity.mjs`](../../scripts/validate-supabase-deployment-parity.mjs); redacted endpoint fingerprint `sha256:cfbb3b6778a8f2ba`. The linked Vercel config names project `hito-runner`, with project fingerprint `sha256:bd7419e721db5595` and organization fingerprint `sha256:f3fd755c261edcb9`; target label is `production`. These are local configuration signals, not live-provider admission. | Current hosted application data and release target; personal/production data may exist                                                       | No read/write/reset/provider/deployment action from this register. A separately authorized hosted task must first complete admission.                                                                                                            | **Unresolved shared hosted boundary.** The live CLI link, migration baseline, Vercel deployment identity/revision, provider agreement, current writer, backup/restore and rollback evidence were not inspected after the local reserved-action stop. Checkout revision `9143336bf55905f6009f4e4cd53dd64c456ce89f` is not deployment-revision proof.                                                                                                |
| `retired`   | None admitted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Bounded rollback environment after future cutover                                                                                            | Read-only verification only; no traffic or new credentials                                                                                                                                                                                       | Empty today. A future row needs owner, retention window and zero-reference decommission proof.                                                                                                                                                                                                                                                                                                                                                     |

Preview and hosted are not assumed different. If they resolve to the same project, preview inherits
hosted restrictions and may not receive destructive fixtures or resets.

## Phase-0 Admission Snapshot — 2026-08-19T21:28:00Z

The current evidence proves one configured local identity and one configured hosted boundary. It
does not prove a running local environment or a distinct preview project. The canonical local status
command was the first inspection requiring a reserved lifecycle action, so provider-linked Supabase
and Vercel inspection stopped without a bypass.

| Target                             | Data classification                                                                                                  | Permitted writes now                                                                                         | Current writer                                  | Backup / restore requirement                                                                                                                                                        | Reset authority                                                                                                                                               | Rollback target                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `local`                            | Disposable synthetic-only; no personal, sensitive or hosted identities; Docker Desktop wildcard development exposure | Only exact Task-authorized project-scoped lifecycle/data proof on an explicitly admitted trusted/private run | No current writer; final verified state stopped | No retained-data backup is required for admitted disposable Hito rows. Reconstruction uses the exact repository migration revision; no seed is part of the accepted clean baseline. | Exact Product/Ivan Task authority remains required for reset or destructive data work. Normal bounded start/status/stop follows the admitted lifecycle guard. | Current checkout plus the retained clean Hito DB/Storage volumes; project-qualified stop is the mandatory exposure rollback. |
| `preview` / shared hosted boundary | Hosted-restricted; assume production/personal data may exist until distinct synthetic preview identity is proven     | None                                                                                                         | Unresolved                                      | Before any destructive action: named export owner, encrypted export location, checksum, restore command owner and successful disposable restore evidence                            | Exact Product/Ivan authority after distinct target admission; none today                                                                                      | Tested export plus an admitted rollback environment and retention window                                                     |
| `hosted`                           | Production/personal data may exist                                                                                   | None                                                                                                         | Unresolved                                      | Same mandatory encrypted export, checksum and tested disposable restore evidence                                                                                                    | Exact Product/Ivan hosted-reset authority; none today                                                                                                         | Tested export, deployment revision and admitted rollback environment with retention window                                   |

Later clean-baseline/reset work must rerun identity immediately before mutation and additionally
record the live CLI link, configured endpoint class, exact migration history, generated-type
revision, Vercel deployment and application revision, current-writer freeze, backup checksum,
tested-restore evidence, reset scope, rollback owner and retention window. Any disagreement remains a
hard stop.

## Required Row Fields

Before any non-local environment becomes admitted, record:

- stable logical name and lifecycle state: proposed, admitted, frozen, rollback-only or retired;
- purpose, data classification and whether personal/production data is permitted;
- Supabase organization/project reference and CLI-link fingerprint;
- Vercel project/target/deployment identity and application revision;
- endpoint class (loopback/hosted) without credentials;
- schema baseline, migration history and generated-type revision;
- allowed reads/writes, fixture policy and provider mode;
- lifecycle owner, data owner and current writer;
- secret owner/provider location and rotation timestamp, never the value;
- backup/export location, checksum, restore command owner and tested-restore evidence;
- reset/destroy authority, rollback target and retention window;
- last verified timestamp and evidence links.

An unknown field stays `unresolved`; it is never inferred from an adjacent environment.

## Admission Protocol

1. State the intended environment and operation before invoking a command.
2. Resolve config, CLI link, configured URL, Vercel target/deployment and expected project identity
   without printing secrets.
3. Compare the resolved evidence with one register row. More than one match, no match or any mismatch
   stops the action.
4. Confirm data classification, current writer, allowed operation, provider mode and task authority.
5. For hosted/destructive work, prove encrypted export, checksum and a restore into a disposable
   environment; record rollback and explicit authority.
6. Recheck identity immediately before and after the operation. Unexpected project, migration,
   deployment, secret fingerprint, data or writer movement stops the task.
7. Record evidence and the environment's truthful lifecycle state without copying secret values.

## Local Lifecycle

The canonical local seam is project-scoped Supabase CLI lifecycle plus:

- `npm run supabase:local:start -- --trusted-private-network` to open one bounded Docker Desktop
  wildcard-exposure window after exact daemon, route, project, volume and listener preflight;
- `npm run supabase:local:configure -- --trusted-private-network` to write only managed local keys to
  `.env.local` while reporting the factual wildcard exposure;
- `npm run supabase:local:status -- --trusted-private-network` to verify the exact five published
  services, wildcard IPv4/IPv6 classification and disposable-data constraint;
- `npm run supabase:local:stop` to run the pinned project-qualified stop and require zero final Hito
  containers, networks and listeners;
- role-scoped `qa_fixture` identities and cleanup through existing project scripts.

Do not call this environment loopback-only, infer that wildcard publication is non-routable, start
on an unknown/untrusted network, retain personal/sensitive data, stop Docker globally, use a hosted
URL, reuse Ivan's session, expose credentials, or treat a local passing state as hosted parity.
Reset is allowed only when the active task admits persisted fixture mutation and names
cleanup/rollback.

## Preview Lifecycle

Preview must have a project identity distinct from hosted, synthetic-only data, least-privilege test
credentials, an owner, reset procedure, TTL/cleanup and deployment revision. Until all are recorded,
preview is read-only and hosted-restricted. A pulled `.vercel` environment file is local configuration
evidence, not proof that an isolated provider environment exists.

## Hosted And Reset Lifecycle

Hosted changes require a separate Tracked BACKEND task and exact authority. Admission includes project
and deployment parity, schema/migrations/types, RLS/grants/advisors, storage/auth scope, encrypted
forensic export, tested restore, current-writer freeze and rollback.

The clean-baseline programme may discard current runner FIT/feed/runtime data only under its explicit
authorization and inventory. The target schema is derived from the accepted Workout/Evidence
contract, not copied from legacy tables. Build and accept it locally and in an isolated admitted
target before cutover. Keep the old environment rollback-only for the approved window; rotate old
credentials and decommission only after zero traffic/reference proof and final Product/Ivan
acceptance.

## Secrets And Configuration

`.env.local`, `.vercel/.env.*.local`, provider dashboards and secret stores contain configuration;
they are not documentation authority. This register may store key names, owner, provider location,
fingerprints and rotation evidence, never token/password/key contents. Retired aliases are removed
only by their owning configuration task after consumer and deployment proof.

The Notion credential previously pasted into chat is outside Supabase and is not valid evidence for
any environment. It must be rotated before a separately authorized Notion pilot.

## Release Relationship

The [release runbook](hito-release-quality-sweep-runbook.md) consumes one admitted environment row.
A candidate is invalid when environment identity, provider mode, migration baseline, deployment
revision or writer changes unexpectedly. Local proof, preview proof and hosted release acceptance
remain separate layers.

## Change Control

ARCHITECT owns this register's contract and ambiguity resolution. BACKEND owns factual Supabase
identity, lifecycle and migration evidence. PRODUCT/Ivan owns new cost, destructive/hosted authority,
retention choices and final cutover acceptance. Updating a row never authorizes the action it
describes unless the active task separately grants that authority.
