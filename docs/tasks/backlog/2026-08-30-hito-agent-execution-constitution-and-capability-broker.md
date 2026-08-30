# HITO-296 — Define Hito Agent Execution Constitution and Capability Broker

- Work Item ID: `HITO-296`
- Type: Research / Decision
- Primary Area: Platform
- Epic: `platform-and-operations`
- Lifecycle: [Live Notion Task](https://app.notion.com/p/Define-Hito-Agent-Execution-Constitution-and-Capability-Broker-3ccfe5f58cf58183914bf504b5d4b4cf)
- Archive Intent: retain the accepted architecture, failure evidence, implementation receipts,
  rollback and residual pilot boundary.

## Outcome

Hito separates source ownership from privileged host capability. Roles continue to decide and write
only their admitted source. One local execution-broker boundary performs an already-authorized
privileged operation from an immutable intent, exact manifest and acknowledged destination. It may
re-home that unchanged operation once without moving Task identity, Current owner, scope, source
ownership or acceptance authority.

The broker is not a role, service, daemon, database, queue, tracker, source owner or technology
stack. The accepted normative contract now lives only in the
[Hito Task And Role Routing](../../process/hito-task-and-role-routing.md#ivan-operator-profile-and-capability-broker).
Root [`AGENTS.md`](../../../AGENTS.md) retains one compact invariant and link.

## Demonstrated Evidence

- [HITO-233](./2026-08-21-hito-delivery-context-cost-and-modular-efficiency-audit.md) proved that
  Notion access and fresh managed-artifact identity must be admitted before Verification moves.
- [HITO-234](./2026-08-21-hito-measured-delivery-context-corrections-adoption.md) placed those gates
  in existing operating owners rather than a new framework.
- [HITO-251](../../process/portable-project-agent-operating-model.md) retains progressive loading,
  one owner, external credentials and separate implementation/QA/release claims; it remains a pure
  project-neutral bootstrap contract.
- [HITO-290](./2026-08-28-hito-reconcile-documentation-truth-and-business-processes.md) accepted the
  four-authority split: Notion lifecycle, Markdown technical truth, Git history and Supabase runtime
  truth.
- [HITO-292](./2026-08-28-hito-calendar-unified-plus-add-trigger.md) showed equivalent role hosts
  diverging on Docker, Notion, Git, cache, messaging and runtime access. An unacknowledged delivery,
  stale overlay and wrong working directory were orchestration failures, not product defects.

## Accepted Decision

- `AGENTS.md` is the compact project constitution; routing is the sole detailed Hito owner of the
  Ivan/operator profile, role/source and capability matrices, `ExecutionIntentV1`, acknowledged
  delivery, `ExecutionArtifactManifestV1`, one-time re-home, technology ownership and stop rules.
- Role identity never proves host capability. A send, queued prompt or `waitingOnApproval` state is
  not ownership transfer; the named destination turn must acknowledge the same Task and manifest.
- Freshness requires exact repository/worktree and cwd, base revision, path hashes/modes, artifact
  hash, runtime receipt and lease. A timestamp, branch, fingerprint, health response or verbal
  `fresh` claim is insufficient.
- The broker probes only the requested capability and records no credential, cookie, private
  provider payload or personal session. Missing or contradictory authority, acknowledgement,
  capability, manifest, rollback or lease fails closed.
- Notion, Git/release, Docker/Supabase/runtime, build/cache, browser and provider/hosted effects keep
  their existing decision/source owners. Broker execution never grants new authority.
- A second runtime, datastore, task system, deployment route, fixture, provider writer, Design
  System or automation path requires Product acceptance of one owner, migration, rollback and
  deletion of the superseded path. Permanent parallel operation is forbidden.

## Contract Disposition

| Disposition          | Result                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retain               | Notion/Markdown/Git/Supabase authority split, one Current owner, active role cards, portable v1.0.1, credential seam, environment/release runbooks, dirty-work and external-action boundaries. |
| Compact              | Root keeps one broker invariant and link; routing owns all detailed Hito protocol. Duplicate execution-host recovery prose is removed.                                                         |
| Replace              | Role-host capability assumptions and independent privileged attempts become per-intent probing plus one capable executor.                                                                      |
| Replace              | Fire-and-forget handoff becomes destination-turn acknowledgement before Notion owner transfer.                                                                                                 |
| Replace              | Fingerprint/timestamp/health-only freshness becomes an exact cwd/source/artifact/runtime manifest.                                                                                             |
| Preserve as evidence | HITO-233, HITO-234, HITO-251, HITO-290 and HITO-292 remain terminal and unchanged.                                                                                                             |
| Delete after pilot   | Repeated cross-role retries, Markdown lifecycle fallback, unbound cwd execution and stale-overlay acceptance are removed only after the pilot proves their replacement.                        |

## Serial Adoption Step 1 Receipt — 2026-08-30

### Implemented

- Added the single constitutional invariant and detailed-routing link to `AGENTS.md`.
- Made the routing contract the sole detailed owner of the operator profile, matrices, immutable
  intent, acknowledged state machine, exact manifest, one-time re-home, technology ownership and
  fail-closed stops.
- Removed duplicate instructions that sent an incapable role host and the Task itself to BACKEND for
  environment re-home. Only the unchanged privileged operation may now re-home; source and Task
  ownership stay fixed.
- Preserved all Product authority, source owners, one-current-owner semantics, Notion lifecycle,
  process-local secret handling, safety, QA layers and release rules.
- Left role cards unchanged because their existing links and source boundaries remain factual.

### Changed Boundary

- `AGENTS.md`
- `docs/process/hito-task-and-role-routing.md`
- this compact HITO-296 decision and receipt

No broker code, script, runtime, schema, migration, provider, browser, QA, deployment, Notion schema,
Git lifecycle, pilot or unrelated file was changed.

## Remaining Adoption And Pilot

1. **BACKEND / Platform tooling:** if PRODUCT admits it, implement one local-only, non-daemon broker
   admission core using existing Node/tooling and runbooks. It reads live Task state, resolves real
   cwd/repository, probes only requested capabilities, manages one lease and emits the accepted
   intent/manifest/receipt. It adds no product import, service, queue, registry or secret store.
2. **PRODUCT/operator integration:** bind existing Codex send/wait operations to acknowledged
   delivery. If the platform cannot return a destination turn ID and acknowledgement, stop; a
   repository script must not fake it.
3. **Representative pilot:** use one newly admitted bounded UI defect with disposable fixture,
   managed browser artifact, independent QA, exact-stage Git release and cleanup. Do not reopen
   HITO-292. One manifest lineage must survive the unchanged implementation -> QA -> release chain.
4. **QA:** prove source-owner continuity, acknowledgement, artifact/runtime lineage, proportional
   product proof, Git-backed release and stopped/clean disposable runtime before superseded behavior
   is removed.

| Signal     | HITO-292 baseline                                    | Pilot acceptance                                                                              |
| ---------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Capability | Host limits appeared after handoff/work began.       | Required capability is admitted or re-homed before dependent work.                            |
| Delivery   | Sends could stall or remain unacknowledged.          | No unacknowledged send is treated as ownership transfer.                                      |
| Artifact   | Stale overlay and wrong cwd were initially accepted. | No stale/unbound artifact reaches QA; source motion invalidates first.                        |
| Relay      | PRODUCT/root repeatedly routed unchanged recovery.   | No human relay on unchanged edges; PRODUCT handles decisions/authority/final acceptance only. |
| Privilege  | Several role hosts attempted the same effect.        | One broker receipt and one lease exist per privileged operation.                              |
| Context    | Environment failures repeated prompts and proof.     | Re-home reuses one immutable intent/manifest without unrelated history reload.                |

Elapsed time, token use, file count and test count are observable outcomes, not admission caps.

## Validation, Rollback And Residual Boundary

Scoped Prettier, local Markdown links, trailing-whitespace scan, contradiction/reachability checks
and `git diff --check` passed for Serial Adoption step 1.

Before pilot acceptance, rollback restores the pre-slice instruction text and stops broker usage;
it must not create an active parallel path. During a pilot, cancel the intent, release its lease,
stop disposable runtimes and leave the Task with its prior acknowledged owner. After acceptance, a
rollback changes execution authority and requires PRODUCT.

The next possible edge is **BACKEND / Platform tooling** for the finite admission core above. It is
not dispatched by this receipt. No runtime, browser, QA, release, deployment or broker acceptance is
claimed.
