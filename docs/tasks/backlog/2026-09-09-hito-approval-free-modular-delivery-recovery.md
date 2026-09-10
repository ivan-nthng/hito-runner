# HITO-328 — Make Hito Delivery Approval-Free and Modular

- Work Item ID: `HITO-328`
- Type: Maintenance
- Priority: Highest
- Primary Area: Platform
- Epic: `Recover Hito Engineering Foundation`
- Lifecycle: [Live Notion Task](https://app.notion.com/p/3d7fe5f58cf581a8914af9fcb3048f66)
- Archive Intent: retain the final execution contract and acceptance evidence; remove intermediate
  host diagnostics, ACK narration and superseded compatibility/process paths after their unique
  evidence has been compacted.

Notion is the sole operational lifecycle writer. This document owns only the durable technical
decision, execution boundary and evidence.

## Outcome

Routine Frontend and QA delivery completes without asking Ivan for approval, without ACK-only relay
turns and without rereading unrelated product code. Accepted dirty work reaches `main` through exact
owner-separated manifests, and the existing HITO-315/HITO-317 modular consolidation chain becomes
executable instead of being duplicated here.

## User Report

Small visible changes repeatedly consume tens of minutes or hours. Frontend continues to surface
`awaiting for approval` despite an explicit no-approval rule; QA repeats unavailable browser and
message operations; agents reload large persistent role histories; accepted cleanup remains in a
large dirty checkout; and mixed-owner modules force broad source reads for narrow changes.

## Confirmed Root Causes

1. The canonical Frontend execution context reports `approval_policy: on-request` with the user as
   reviewer. Repository prose cannot override that host policy. The root constitution and Frontend
   card already prohibit routine approval requests.
2. QA uses an approval-never context but lacks some message/browser/provider capabilities. Those are
   execution-environment failures, not requests for Ivan's permission. Repeated attempts and Product
   relay hide the distinction.
3. The acknowledged-delivery/capability-broker protocol records intents, acknowledgements, leases
   and manifests, but the current broker performs none of the relevant Notion, Git, build, browser,
   Supabase or delivery effects. Routine handoff therefore pays the bookkeeping cost without gaining
   capability.
4. Long-lived role threads repeatedly load stale task history. Mandatory project-profile and routing
   context are also loaded when the task does not need environment, command or ownership facts.
5. Build output defaults to a machine cache path that the canonical Frontend context cannot always
   write. Browser capability is often tested only after fixture/runtime preparation.
6. The admission census began at `main@9e1d7a3` with 159 dirty/untracked paths. While that read-only
   census was running, another writer committed and pushed HITO-327, the canonical QA binding and
   HITO-312 migration lineage. Fifty-two remaining tracked deletions belong to accepted HITO-306
   retirement, but shared files and the other paths contain work from multiple Tasks. The moving
   baseline proves that a whole-tree commit or a manifest captured without a sole-writer freeze is
   unsafe.
7. Runner Calendar, Source Authoring, Result/Evidence and Frontend responsibilities remain
   concentrated in large mixed-owner modules. HITO-315/HITO-317 already own their finite
   consolidation; their live blockers still name HITO-311/HITO-312 even though both are terminal.

## Decision

HITO-328 owns the delivery-system repair and exact release preparation only. It must not absorb or
reimplement HITO-315/HITO-317 product-domain consolidation.

- Replace or rebind the canonical Frontend and QA execution contexts so routine admitted reads,
  patches, focused validation, build, fixture and supported browser work cannot request Ivan's
  approval. A host capability failure stops that path once and may be re-homed once without changing
  Task identity or asking Ivan.
- Remove the human ACK requirement from routine owner-to-owner delivery. Transport success plus live
  Task readback is sufficient. Destination acknowledgement remains only for a genuinely privileged
  effect whose immutable target must be bound before execution.
- Restrict the broker contract to real privileged side effects. Recoverably delete the current
  broker library, validator and package command only after direct-import and operational-consumer
  counts are zero and any unique safety invariant is retained in the routing contract.
- Make build/runtime output task-local and writable through the existing
  `HITO_QA_RUNTIME_ROOT` seam. Probe browser/file-input control before starting a runtime or creating
  fixture data.
- Count an identical capability failure across the whole Task, not per turn. Do not retry it
  automatically or send it to Ivan as an approval request.
- Produce owner-separated commits from the current dirty tree. Every admitted path or hunk must name
  its Task, owner, frozen SHA, proof and rollback. Unclassified bytes remain untouched.
- After the accepted current candidate is durable, reconcile the stale HITO-315/HITO-317 dependency
  truth and continue their existing Backend then Frontend sequence. Do not create replacement Tasks
  for their domain cleanup.

## Serial Owner Sequence

1. **ARCHITECT:** freeze the current tree, classify paths/hunks and publish the exact release and
   process-removal boundary in this record.
2. **PRODUCT / execution-platform owner:** replace or rebind the canonical Frontend and QA contexts;
   verify the task identity can be read and a routine no-op capability probe produces no user
   approval request.
3. **BACKEND:** implement only the repository-owned process/build-root corrections and prepare exact
   owner-separated release candidates. Do not stage foreign or unclassified hunks.
4. **QA:** independently validate the frozen candidates and one small visible-flow pilot using only
   invalidated evidence classes.
5. **BACKEND:** commit and push the exact accepted candidates in dependency order. Deploy only when a
   candidate changes product runtime behavior and the release runbook's browser/data evidence is
   complete.
6. **PRODUCT:** accept HITO-328 and make existing HITO-315 executable; HITO-315 then owns Backend
   modular consolidation and HITO-317 owns the subsequent Frontend consumer migration.

Routine transitions above are direct same-Task handoffs. Ivan is not a relay.

## Release Boundary

`commit everything` means commit every classified, accepted current change; it does not mean stage
the shared worktree indiscriminately. Before the first commit:

- `HEAD`, branch, upstream, empty index and full dirty inventory are frozen;
- each full file or exact shared-file hunk has one owning Task and owner;
- deleted paths have replacement and zero-current-consumer proof;
- source, generated artifact, fixture/runtime, database and browser evidence remain separate;
- independent QA accepts one exact candidate digest;
- rollback is an exact inverse patch or parent commit, never deletion of unclassified work.

Commit/push are explicitly authorized by Ivan for the accepted HITO-328 sequence. Production deploy,
hosted mutation, destructive data work, credentials and paid providers retain their separate exact
authority and evidence boundaries.

## Backend Implementation Decision And Frozen Boundary

The first incorrect repository owner was the routing contract: routine delivery required a
destination acknowledgement and an executable broker even though the broker performed no Notion,
Git, build, browser, Supabase or delivery effect. The only operational consumer was the package
validator, which imported the broker directly; product/runtime imports were zero. HITO-328 therefore
removes the package command, validator and broker library without a wrapper. Historical HITO-296/301
records remain evidence only.

The retained routing contract now separates two paths:

- routine repository work and owner handoff use one complete prompt, successful transport and live
  Task readback; the recipient validates the boundary during its first useful turn;
- provider, hosted, destructive, credential, payment, Git push/deploy or another genuinely external
  effect retains exact target acknowledgement, authority, rollback and receipt.

The same contract owns one Task-scoped capability failure signature, one unchanged-operation
re-home and then `blocked(capability_unavailable)`. `waitingOnApproval` and permission-dialog paths
count as the failed attempt and are never converted into an Ivan approval request.

The pre-write freeze was `main == origin/main ==
f4fafbff37154fa268d75d42a778bbe03b7c97fe`, branch `main`, upstream `origin/main`, empty index. The
dirty tree contained 150 records: 76 modified, 52 deleted and 22 untracked. SHA-256 of raw
`git status --porcelain=v1 -z --untracked-files=all` was
`fd0a010ddc233b0d91320827ffdf01f43f5940628f8c9b0986c3b8a10081a977`.

Every pre-existing record was classified before staging:

| Class                             | Exact ownership boundary                                                                                                                                                                                                                                              | Disposition                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| HITO-328 / BACKEND whole paths    | `AGENTS.md`; `agents/frontend.agent.md`; this Repository document                                                                                                                                                                                                     | Include only after final hash and focused proof.               |
| Shared path                       | `package.json`: pre-existing HITO-306/BACKEND command-removal hunks; HITO-328/BACKEND owns only removal of `validate-hito-capability-broker`                                                                                                                          | Exact-hunk stage; preserve every HITO-306 byte.                |
| Existing Task-owned protected set | Remaining 145 records mapped by their existing HITO-288/291/298/305/306/307/310/311/312/325 and linked active-plan records; the HITO-306 ledger remains authoritative for its 113-path census, ten mixed overlaps, five migrated paths and nine exact-hunk candidates | No HITO-328 staging. Preserve full files and all shared hunks. |
| Unclassified / no owner           | `supabase/snippets/Untitled query 743.sql`                                                                                                                                                                                                                            | Never read, edit, stage, delete or infer.                      |

The HITO-328 candidate is owner-separated from that protected set:

| Candidate boundary                                                                                                                                                                                                                            | Stage form                                              | Rollback                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `AGENTS.md`; `agents/frontend.agent.md`; `agents/qa.agent.md`; `PROJECT_PROFILE.md`; `docs/process/hito-task-and-role-routing.md`; `skills/hito-qa-browser-regression/SKILL.md`; `scripts/lib/qa-runtime-paths.mjs`; this Repository document | Whole file, after exact SHA-256/mode freeze             | Revert the HITO-328 commit.                                        |
| `scripts/lib/hito-capability-broker.mjs`; `scripts/validate-hito-capability-broker.mjs`                                                                                                                                                       | Whole-file deletion after zero operational reachability | Restore both files and the package command from the parent commit. |
| `package.json`                                                                                                                                                                                                                                | One exact line deletion only                            | Apply the inverse one-line hunk; do not touch HITO-306 hunks.      |

Local non-Vercel builds now default to the workspace-owned ignored
`.tanstack/qa-runtime` tree. `HITO_QA_RUNTIME_ROOT` remains the explicit override for a narrower
Task-local root and is inherited by build, finalization and managed runtime consumers. Browser QA
must prove attachment, DOM and required file-input/download controls before build, runtime or
fixture preparation.

## Acceptance

- [ ] Canonical Frontend and QA contexts execute routine admitted work with zero Ivan approvals and
      zero `waitingOnApproval` states.
- [ ] Routine handoff produces no ACK-only turn and no Product relay.
- [ ] One identical capability failure is attempted at most once before the single admitted re-home.
- [ ] Build output is task-local; browser capability is proved before runtime/fixture preparation.
- [ ] Every committed dirty path/hunk has one Task, owner, frozen hash, validation and rollback; no
      unclassified byte is staged.
- [ ] Broker implementation has either one demonstrated privileged caller or is recoverably removed
      after zero-reachability proof; no compatibility wrapper remains.
- [ ] HITO-315/HITO-317 lifecycle dependencies reflect terminal HITO-311/HITO-312 evidence and their
      accepted modular sequence can proceed.
- [ ] One small visible fix reaches real-browser Frontend proof and independent delta-only QA with
      zero Ivan approvals, at most one re-home and one build for an unchanged SHA.
- [ ] Accepted commits are pushed non-force; `main` and `origin/main` agree and unrelated dirty work
      remains byte-identical.

## Stop And Rollback

Stop only the affected operation when its owner, Task provenance, target, capability, data boundary
or rollback is ambiguous. Do not stop unrelated classified work and do not ask Ivan to approve a
routine command. A failed candidate is rolled back by its exact inverse patch or unreleased commit;
host rebinding rolls back to the previously recorded canonical thread binding. No production data
rollback is implied by this Task.

## Evidence And Omissions

- HITO-310 supplies the accepted focused-proof, one-build, frozen-manifest and delta-only QA policy;
  it remains terminal and is not reopened.
- HITO-306/HITO-307 and terminal HITO-311/HITO-312 supply accepted cleanup and source-owner evidence;
  their lifecycle is not copied here.
- The admission audit changed no product source, runtime, data, Git index, commit, branch, provider or
  deployment.
- Exact current dirty-path commit grouping remains the first implementation discriminator; no broad
  commit is claimed safe before that ledger is complete.
