# HITO-275 Residual Worktree Consolidation And Release Hardening

## Decision

Treat `main@191b5a8f86d795845211eb28ba368efef07c619c` as the completed HITO-250
baseline. Do not merge any residual branch or worktree as a blob. Preserve the accepted execution-host
recovery rule from the two root documentation edits, rebase it onto the released compact contracts,
and recoverably retire every superseded residual before removing a worktree or branch.

The inventory contains 53 path-level deltas: 2 `integrate`, 0 `preserve`, and 51
`recoverably retire`. No residual delta qualifies for preservation merely because it duplicates an
accepted byte already present on `main`. No runtime/source delta is admitted. The released application therefore needs
no replacement deployment from this cleanup; the final release action is a documentation-only
commit/push after independent proof and a fresh release freeze.

## Evidence Codes

- **E1 — released baseline:** local `main`, `origin/main`, and `origin/HEAD` resolve to `191b5a8`;
  the commit is `release: consolidate adaptive engine foundation`.
- **E2 — mixed root edits:** both root files add the accepted same-Task execution-host recovery rule,
  but also replace live Notion property `Repository document` with obsolete `Repository link`, refer
  to absent `Template Agents/`, `Template Skills/`, and `agents/design-system.agent.md`, duplicate
  safety/release text, and remove the accepted source-of-truth split, portable-contract adoption,
  owner-boundary admission, proportional validation, and HITO-245 recovery pointer.
- **E3 — merged QA checkout:** `codex/qa@9143336` is an ancestor of `191b5a8`; its dirty patch ID is
  `18873042833f1b5e5a7bf4b9a7838007790ffd80`. Exactly three dirty/untracked files are byte-identical
  to main: `scripts/configure-local-supabase-env.mjs`, the environment register, and the progressive
  context receipt. The remaining files are older role/process/task/package forms; absent candidates
  have zero current inbound references except the obsolete Design System card reference introduced
  by the mixed root routing edit.
- **E4 — merged DS checkout:** detached `e7a1528` is an ancestor of `191b5a8`; the one dirty receipt
  has patch ID `505ae8626717050787064daddd0fc9c53c15e23b`. Main already retains the compact terminal
  outcome, sources, independent-QA/build level, and residual boundary. The dirty copy adds historical
  narration, not a new current contract.
- **E5 — divergent mixed commit:** `bf8bdee` has patch ID
  `755da70d4d2300ac5c9a59fe386b264ca0b5b78e` and neither commit is an ancestor of the other. All 18
  touched paths evolved on main. Its FIT completion projection, proof, Completion/Today/workout UI,
  and finalized-output fix are present in current owners; `training-api.ts` responsibility moved to
  `runner-calendar-snapshot.ts`. Its speculative `ui-display-title` is explicitly rejected by the
  current terminal DS receipt, while the accepted UI-title tiers are already implemented.
- **E6 — lifecycle omission:** this host could not resolve `api.notion.com`; no Markdown lifecycle
  fallback was written. HITO-275 Repository document and lifecycle handoff must be completed from an
  approved local context before implementation.

## Path-Level Manifest

`Preserve` means the current main byte is canonical and no content import is required. `Recoverably
retire` means capture the exact residual byte/patch externally before removing its checkout owner.

### Root Main Working Tree

| Path                                         | Disposition | First owner | Direct proof / exact boundary                                                                                                                                                                              |
| -------------------------------------------- | ----------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                  | integrate   | ARCHITECT   | E2; retain the compact released map and add only the accepted missing-lifecycle-versus-broken-host rule. Retire expanded duplication, absent-template references and obsolete property wording.            |
| `docs/process/hito-task-and-role-routing.md` | integrate   | ARCHITECT   | E2; retain released source split, portable adoption, owner-boundary admission, validation, release and recovery ownership. Add only the matching execution-host recovery rule using `Repository document`. |

The pre-integration working bytes are mode `100644`, SHA-256
`88c7ae91a2383e2627b7a60446420934bd61387bc3c156582f71978d8d07b4b3` and
`fdcf1e0d0dddc8407c0f12ac0569e9b66f8fc1ed9b179ce83894e36b0ff28e57`, respectively. Their released
parents are `c30fbc96651435db8071b98ecd2104222c6aad58dc7e5d4463a4734189128d44` and
`a3cd0bdca8e426b81cc9a2050c7c030e7c3dd99afd30ca9be921cfc38f709aa4`.

### Merged `codex/qa` Worktree

| Path                                                                                                        | Disposition        | First owner | Proof                                                                                            |
| ----------------------------------------------------------------------------------------------------------- | ------------------ | ----------- | ------------------------------------------------------------------------------------------------ |
| `AGENTS.md`                                                                                                 | recoverably retire | ARCHITECT   | E2/E3; older mixed operating model.                                                              |
| `agents/architect.agent.md`                                                                                 | recoverably retire | ARCHITECT   | E3; predates Notion Repository document load.                                                    |
| `agents/backend.agent.md`                                                                                   | recoverably retire | ARCHITECT   | E3; predates current progressive load and current Backend contract.                              |
| `agents/design-system-integration.agent.md`                                                                 | recoverably retire | ARCHITECT   | E3; stale lifecycle-receipt and role wording.                                                    |
| `agents/design-system.agent.md`                                                                             | recoverably retire | ARCHITECT   | E3; owner was retired; current path is absent.                                                   |
| `agents/designer.agent.md`                                                                                  | recoverably retire | ARCHITECT   | E3; predates current Notion-linked load.                                                         |
| `agents/frontend.agent.md`                                                                                  | recoverably retire | ARCHITECT   | E3; predates current DS-first constitution and progressive load.                                 |
| `agents/product.agent.md`                                                                                   | recoverably retire | ARCHITECT   | E3; uses superseded canonical-task authority.                                                    |
| `agents/qa.agent.md`                                                                                        | recoverably retire | ARCHITECT   | E3; predates current QA/environment handoff rule.                                                |
| `agents/running-coach-agent.md`                                                                             | recoverably retire | ARCHITECT   | E3; predates current Notion-linked load.                                                         |
| `docs/README.md`                                                                                            | recoverably retire | ARCHITECT   | E3; uses Markdown task authority instead of live Notion routing.                                 |
| `docs/tasks/backlog/2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery.md` | recoverably retire | ARCHITECT   | E3; historical expanded receipt superseded by current Notion contract.                           |
| `docs/tasks/backlog/2026-08-19-hito-manual-template-target-selection-noop.md`                               | recoverably retire | ARCHITECT   | E3; current main retains the later compact evidence.                                             |
| `package.json`                                                                                              | recoverably retire | BACKEND     | E3; older script set omits released adaptive/replay commands and has no unique addition.         |
| `scripts/configure-local-supabase-env.mjs`                                                                  | recoverably retire | BACKEND     | E3; exact byte already at main, so the residual copy has no unique value.                        |
| `docs/plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md`                  | recoverably retire | ARCHITECT   | E3; absent from current authority with zero inbound references.                                  |
| `docs/process/hito-supabase-environment-register.md`                                                        | recoverably retire | BACKEND     | E3; exact byte already at main, so the residual copy has no unique value.                        |
| `docs/process/hito-task-and-role-routing.md`                                                                | recoverably retire | ARCHITECT   | E3; pre-cutover contract superseded by the released route.                                       |
| `docs/tasks/backlog/2026-08-19-hito-active-role-matrix-and-routing-correction.md`                           | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-19-hito-canonical-backlog-legacy-reachability-prune.md`                         | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md`                 | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-19-hito-notion-current-work-human-brief-mapping.md`                             | recoverably retire | ARCHITECT   | E3; current main owns the later compact mapping.                                                 |
| `docs/tasks/backlog/2026-08-19-hito-notion-human-workflow-schema-and-current-work-reconciliation.md`        | recoverably retire | ARCHITECT   | E3; current main owns the accepted later schema evidence.                                        |
| `docs/tasks/backlog/2026-08-19-hito-notion-operational-task-control-pilot-and-cutover.md`                   | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-19-hito-notion-task-workflow-and-human-taxonomy-discovery.md`                   | recoverably retire | ARCHITECT   | E3; current main owns the later compact decision.                                                |
| `docs/tasks/backlog/2026-08-19-hito-operating-model-documentation-and-supabase-environment-reset.md`        | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-19-hito-phase-zero-routing-and-environment-documentation-batch.md`              | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-19-hito-phase-zero-supabase-environment-admission.md`                           | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-19-hito-progressive-context-agent-instructions-and-documentation-map.md`        | recoverably retire | ARCHITECT   | E3; exact byte already at main, so the residual copy has no unique value.                        |
| `docs/tasks/backlog/2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md`         | recoverably retire | ARCHITECT   | E3; current main owns the accepted later compact contract.                                       |
| `docs/tasks/backlog/2026-08-19-hito-work-areas-outcome-epics-and-agent-operating-contract-discovery.md`     | recoverably retire | ARCHITECT   | E3; absent with zero inbound references.                                                         |
| `docs/tasks/backlog/2026-08-20-hito-local-supabase-clean-baseline-and-data-cutover.md`                      | recoverably retire | ARCHITECT   | E3; absent with zero inbound references; current environment register owns the durable contract. |

### Detached DS Worktree

| Path                                                                               | Disposition        | First owner | Proof                                                                                                                  |
| ---------------------------------------------------------------------------------- | ------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `docs/tasks/backlog/2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md` | recoverably retire | ARCHITECT   | E4; main has the terminal compact decision and validation level; preserve the detailed dirty receipt only in recovery. |

### Detached Mixed Commit `bf8bdee`

| Path                                                                                | Disposition        | First owner | Proof                                                                                                          |
| ----------------------------------------------------------------------------------- | ------------------ | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                                         | recoverably retire | ARCHITECT   | E5; superseded operating authority.                                                                            |
| `agents/design-system-integration.agent.md`                                         | recoverably retire | ARCHITECT   | E5; current role card evolved.                                                                                 |
| `agents/design-system.agent.md`                                                     | recoverably retire | ARCHITECT   | E5; role is retired and absent.                                                                                |
| `docs/current-functional-map.md`                                                    | recoverably retire | ARCHITECT   | E5; current modular owner map evolved through the released Foundation.                                         |
| `docs/tasks/backlog/2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md`         | recoverably retire | ARCHITECT   | E5; terminal legacy record was retired from current checkout.                                                  |
| `docs/tasks/backlog/2026-08-05-developer-velocity-and-proportional-verification.md` | recoverably retire | ARCHITECT   | E5; current main retains its later lifecycle/evidence.                                                         |
| `docs/tasks/backlog/2026-08-05-fit-backed-planned-workout-product-presentation.md`  | recoverably retire | ARCHITECT   | E5; current main retains the terminal compact receipt.                                                         |
| `docs/tasks/backlog/2026-08-06-developer-velocity-patch-pack-fast-visual-lane.md`   | recoverably retire | ARCHITECT   | E5; current main retains the terminal compact receipt.                                                         |
| `docs/tasks/backlog/2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md`  | recoverably retire | ARCHITECT   | E4/E5; current receipt rejects the speculative display role and records main reconciliation.                   |
| `scripts/finalize-build-output.mjs`                                                 | recoverably retire | BACKEND     | E5; exact finalized-runtime responsibility already exists in current main.                                     |
| `scripts/validate-runner-activity-foundation.ts`                                    | recoverably retire | BACKEND     | E5; FIT-only completion and `completionOrigin` assertions already exist in current proof.                      |
| `skills/hito-frontend-design-system/SKILL.md`                                       | recoverably retire | FRONTEND    | E5; uses retired Design System owner/subagent routing; current constitution evolved.                           |
| `src/components/CompletionPanel.tsx`                                                | recoverably retire | FRONTEND    | E5; accepted FIT completion/feedback behavior exists in current main and has later changes.                    |
| `src/components/TodayHero.tsx`                                                      | recoverably retire | FRONTEND    | E5; accepted completion-origin result behavior exists in current main and has later changes.                   |
| `src/lib/hito-typography-roles.ts`                                                  | recoverably retire | FRONTEND    | E5; current five-tier UI-title contract supersedes and rejects the speculative role.                           |
| `src/lib/training-api.ts`                                                           | recoverably retire | BACKEND     | E5; completion projection moved to `runner-calendar-snapshot.ts`; importing this hunk would regress ownership. |
| `src/lib/training.ts`                                                               | recoverably retire | BACKEND     | E5; current type already owns `completionOrigin` with later domain changes.                                    |
| `src/routes/workout.$date.tsx`                                                      | recoverably retire | FRONTEND    | E5; current route already owns the accepted FIT Review/Result discrimination and later UI.                     |

## Serial Implementation Boundary

1. From an approved local context, update HITO-275 to the new Repository document and record this
   decision. Do not proceed if live Task identity, owner or admitted scope differs.
2. Create one external HITO-275 recovery root. Before changing anything, store: root-file originals;
   a binary patch plus every dirty/untracked QA and DS file with relative path, mode and SHA-256; a
   `git format-patch --binary -1 bf8bdee`; worktree HEAD/branch/ancestry; and one manifest with exact
   rollback commands. Read every artifact back and verify hashes/modes.
3. Reconcile only the two root documents against `191b5a8` as specified above. No role, product,
   package, runtime, Supabase or provider file changes are admitted.
4. Re-run the path census. If any residual gained a live Notion Repository document, main changed,
   a hash moved or a replacement disappeared, stop without removing its checkout.
5. Remove the three residual worktrees through supported Git worktree lifecycle only after recovery
   proof. Delete `codex/qa` with the safe merged-branch command only after its ancestor proof repeats.
   Do not force-delete any unrecorded byte or create a compatibility branch.
6. Run documentation links, Prettier, whitespace, `git diff --check`, worktree/branch/ref census,
   empty-index proof and remote parity. Independent QA verifies recovery and authority resolution.
   Then open a fresh documentation-only release freeze, stage only the three admitted Markdown
   files, commit and push. Do not deploy unchanged runtime output.

Rollback restores the two root originals and recreates each worktree from its recorded HEAD before
reapplying its verified binary patch/files. Stop on Notion drift, main/remote drift, missing recovery
bytes, hash/mode mismatch, unexpected current consumer, non-ancestor branch state, dirty index,
unrelated writer activity or any need to import a retired runtime hunk.

## Next Owner

BACKEND is the single next execution owner for the recoverable Platform/Git consolidation batch. The
documentation reconciliation is mechanical and fully specified above; any semantic deviation returns
to ARCHITECT/PRODUCT. FRONTEND owns no implementation because no UI/DS source delta is admitted.
Independent QA follows before the documentation-only release freeze.

## Omitted Evidence

No worktree, branch, source, runtime, Supabase, provider, hosted state, index, commit, remote or
deployment was changed. No build/browser/runtime/Global QA/release acceptance is claimed. Live Notion
read/update was unavailable from the ARCHITECT host because `api.notion.com` did not resolve; this is
an execution-context defect, not Markdown lifecycle authority. The exact unchanged implementation
edge was dispatched to the existing BACKEND sidebar role with Notion re-homing as its first gate.

## Backend Consolidation And Release Manifest

- The verified external recovery root is
  `/Users/ivan/Developer/hito-running-hito275-recovery/2026-08-24-main-191b5a8`: the root remains mode
  `0700`; `manifest.json`, `verification.json` and `recovery-tree.sha256` remain mode `0600`; their
  recorded bytes and checksums were not changed by consolidation or release.
- `adaptive_engine_ui_replay_v1` remains the single provider-free UI replay fixture owned by the
  existing `test-user` lifecycle. Its current `qa:adaptive-ui-replay:seed`, `status` and `reset`
  commands remain intact; no alternate Auth, Calendar, importer, persistence or fixture writer was
  introduced or restored.
- HITO-275 did not invoke the fixture lifecycle or touch disposable fixture rows, storage or leases,
  so no data reset/readback was required or claimed. Final state evidence instead proved no listener
  on ports `3000` or `3100` and no managed Vite, Nitro or `qa_fixture` process. No live QA server was
  retained.
- HITO-271 evidence and every accepted recovery artifact were preserved without content or access-
  mode changes. The release boundary is documentation-only: exactly `AGENTS.md`, the routing
  contract and this technical record; runtime output is unchanged and no deployment is required.
