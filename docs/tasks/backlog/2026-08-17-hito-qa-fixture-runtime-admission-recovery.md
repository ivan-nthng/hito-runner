# Hito QA Fixture Runtime Admission Recovery

## Work Item ID

49d9c4d0-d17d-4472-878e-66af2b2c0537

## Status

completed

## Type

Tracked — local QA runtime recovery

## Priority

high

## Owner

QA

## Epic

platform-and-operations

## Parent

## Scope

Recover one fresh, managed, loopback-only `qa_fixture` for the blocked Design System browser
matrix, or establish the exact platform boundary preventing that recovery. This is runtime
admission work only; it does not change Design System, Product, Backend, DevTools, fixture,
migration, or hosted source of truth.

## Archive Intent

Retain through the DS browser retry, then compact to the recovered managed-runtime contract or
the exact external platform limitation and safe operating procedure.

## Task

Make the local browser-admission lifecycle reliable enough to prove the completed DS-1 through
DS-3 batch without reusing a stale artifact or starting a competing unmanaged server.

## User Report

The completed DS source requires fresh browser proof, but its retry found port `3000` occupied by
an incompatible, unhealthy, stale `qa_fixture` process that the Design System sandbox could not
terminate. Ivan authorized sending QA to resolve the runtime lifecycle directly.

## Evidence

records the exact evidence: PID `32568`, `artifact_missing`, failed managed stop, and sandbox
`operation not permitted` termination result.

- The DS source/build/static contract is already accepted; no Design System source defect is
  demonstrated.

## Observed Behavior

The canonical server refuses the existing port-3000 process as unmanaged. The DS owner cannot
terminate that exact PID through its sandbox, and no fresh healthy receipt-matching runtime is
available for the required browser matrix.

## Expected Behavior

One repository-managed, loopback-bound `qa_fixture` is healthy, compatible, and
receipt-matching before browser work starts. If the local platform prevents lifecycle control,
the exact owner, command, error, and safe recovery boundary are documented without claiming
browser acceptance.

## Source Investigation

The failed DS retry already proved source/build readiness and isolated the failure to managed
runtime admission. No Product, Backend, or Design System code discriminator remains outstanding.
QA owns independent local browser/runtime verification and has standing authority to use the
canonical fixture lifecycle and disposable identities.

## Required Discriminator

Determine whether PID `32568` is a repository-managed process reachable through a supported local
control surface. If so, release only that stale managed runtime and replace it with the canonical
fresh fixture. If not, capture the platform ownership/permission boundary and leave the process
untouched.

## What Not To Touch

- No Design System, Product, Backend, DevTools, fixture, schema, migration, dependency, or
  configuration edit.
- No stale screenshot, stale browser bundle, competing ad-hoc server, hosted state, provider call,
  Git lifecycle, or deployment.
- No personal account/session, credential disclosure, or user approval request for routine local
  QA actions.

## Validation Expectations

1. Identify port-3000 process ownership using supported local, non-prompting controls.
2. Stop or release only the stale managed process when ownership is demonstrated; otherwise leave
   it unchanged and report the precise platform boundary.
3. Start the canonical fresh `qa_fixture` only after the port is safely available.
4. Prove loopback binding, health, compatibility, and receipt match; do not run or claim the DS
   visual matrix itself.
5. Preserve production source and report the exact handoff condition for DESIGN SYSTEM.

## Stage

Fresh managed qa_fixture admitted for Design System browser acceptance

## Next Recommended Role

DESIGN SYSTEM

## QA Execution Preflight — 2026-08-17

- **Validation layer:** focused local managed-runtime admission recovery for a later independent
  Design System browser acceptance. This task does not run or claim the DS visual matrix, Global QA,
  hosted parity, release, deployment, or production readiness.
- **Canonical seam:** use only the repository-owned `qa:server:status`, `qa:server:stop`, and
  `qa:server:restart -- --provider-mode qa_fixture` lifecycle. No unmanaged server, raw kill, source
  edit, fixture mutation, or alternate runtime path is admitted.
- **Observed owner:** port `3000` is owned by PID `32568`, user `ivan`, command
  `node --env-file=.env.local ./scripts/serve-local-qa-runtime.mjs --host 127.0.0.1 --port 3000`,
  working directory `/Users/ivan/Developer/hito-running`, parent PID `32534`
  (`npm run serve:local`). Repository status identifies PID `32568` as managed, compatible,
  loopback-bound, healthy, and `providerMode:qa_fixture`; only its build admission is invalid:
  `stale`, `artifact_missing`.
- **Safe release discriminator:** `scripts/qa-local-server.mjs` will stop a listener only when
  `resolveServerStatus()` identifies it as the compatible canonical server. That guard currently
  passes, so QA may use the managed restart without touching an unmanaged process. If the guard
  changes or refuses ownership, QA will stop and record the platform boundary instead of using a
  raw signal.
- **Checkout and preservation boundary:** `HEAD` equals `origin/main` at
  `abd4fe8355e3c644095111a654c1560aa265d104`; the index is empty and `git diff --check` passes. The
  existing shared candidate contains 122 modified, two deleted, and 93 untracked paths. QA may
  update only this canonical receipt and must preserve every other working-tree byte. No other
  subagent or runtime/build owner is active in this task.
- **Execution sequence:** perform one canonical managed restart, verify health, compatibility,
  loopback binding, `qa_fixture`, build integrity, and `fresh/receipt_matches`; write the terminal
  receipt; then refresh once more after that receipt changes the private Admin snapshot digest so
  DESIGN SYSTEM receives a genuinely fresh post-receipt artifact.

## Handoff Prompt

```text
ROLE: QA

Task: Managed qa_fixture Runtime Admission Recovery for DS Browser Acceptance
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-17-hito-qa-fixture-runtime-admission-recovery.md
Stage: Local runtime ownership and fresh browser-admission recovery

Read AGENTS.md, agents/qa.agent.md, and skills/hito-qa-browser-regression/SKILL.md.

Outcome:
Recover one fresh, healthy, managed, loopback-only qa_fixture for the blocked Design System browser matrix, or establish the exact platform ownership boundary that prevents it.

Evidence:
PID 32568 occupies port 3000 but is incompatible, unhealthy, stale, artifact_missing, and refused termination from the Design System sandbox. No DS source defect is demonstrated.

Boundaries:
- Do not edit Product, Backend, Design System, DevTools, fixtures, migrations, dependencies, or hosted state.
- Do not reuse stale screenshots or make a browser-pass claim without a fresh receipt-matching artifact.
- Do not ask Ivan for credentials, browser approval, or local fixture permission.
- Do not start competing unmanaged servers.

Procedure:
1. Identify the port-3000 process and managed-runtime ownership using repository-supported local controls.
2. Safely stop or release only the stale managed runtime if the owning surface permits it; otherwise document the exact process/permission boundary.
3. Rebuild/start the canonical managed qa_fixture only if ownership is clear, then prove health, loopback binding, compatibility, and receipt match.
4. If admission succeeds, leave the fresh runtime available and return the exact browser URL/status to PRODUCT; do not run the DS visual matrix.
5. Update only this canonical task lifecycle/receipt. Return an English receipt with outcome, runtime evidence, preservation proof, and whether DESIGN SYSTEM can resume.

No source, hosted, provider, release, deployment, or Git lifecycle action is authorized.
```

## Tracked QA Runtime Admission Receipt — 2026-08-17

### Task, stage, and validation layer

- **Task:** recover the canonical managed `qa_fixture` admission boundary for the blocked Design
  System browser matrix.
- **Stage:** focused local runtime ownership and fresh browser-admission recovery.
- **Validation layer:** runtime admission only. No Design System browser scenario, Product flow,
  Global QA, hosted, release, deployment, or production acceptance was executed or claimed.
- **Role and procedure:** `agents/qa.agent.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- **Subagents:** none. Runtime ownership required one serialized local owner.

### Executed inventory

| Check                           | Scenario / environment                                                       | Result | Evidence                                                                                                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port-3000 owner                 | Read-only `qa:server:status`, `lsof`, `ps`, and working-directory inspection | Passed | PID `32568`, user `ivan`, cwd `/Users/ivan/Developer/hito-running`, canonical `serve-local-qa-runtime.mjs` command, parent `npm run serve:local`, and listener `127.0.0.1:3000`.                                                                                          |
| Managed ownership discriminator | Repository `qa-local-server.mjs` guard                                       | Passed | Runtime status identified PID `32568` as managed, compatible, healthy, loopback-bound, and `qa_fixture`. The admission failure was only `stale/artifact_missing`; the canonical stop guard therefore allowed managed release without a raw signal.                        |
| Safe stale-runtime release      | `npm run qa:server:restart -- --provider-mode qa_fixture`                    | Passed | The lifecycle stopped only the demonstrated compatible managed process. PID `32568` was absent afterward; no unmanaged listener was terminated and no competing server was started.                                                                                       |
| Build and output integrity      | Canonical restart build, prebuild, and postbuild                             | Passed | The missing artifact triggered one fresh production build. Vite client, SSR, Nitro, and `finalize-build-output.mjs` completed; build output was present.                                                                                                                  |
| Fresh managed admission         | First post-build status and independent status readback                      | Passed | PID `44905` was managed, compatible, healthy, loopback-bound at `http://127.0.0.1:3000/`, `providerMode:qa_fixture`, `build:present`, `artifactFreshness:fresh`, and `freshnessReason:receipt_matches`. `lsof` independently showed only PID `44905` on `127.0.0.1:3000`. |
| Checkout preservation           | Before/after Git inventory                                                   | Passed | `HEAD` remained equal to `origin/main`; index remained empty; `git diff --check` passed; the preflight and post-admission candidate remained 122 modified, two deleted, and 93 untracked paths. Only this canonical receipt changed.                                      |
| External boundaries             | Source, fixture, hosted, provider, Git lifecycle                             | Passed | No Product, Backend, Design System, DevTools, fixture, migration, dependency, hosted, provider, staging, commit, push, deployment, or browser-matrix action was performed.                                                                                                |

### Outcome and handoff

The platform ownership boundary is resolved: the prior Design System sandbox failure was not a DS
source defect or an unmanaged-server conflict. QA's repository-supported surface owned the
compatible stale process and recovered the canonical runtime through its guarded lifecycle.

This receipt changes the private Admin repository snapshot digest, so QA will perform one final
canonical managed restart after formatting this document and will make no further repository write.
PRODUCT receives the exact post-receipt PID and status in the QA response. DESIGN SYSTEM may resume
its browser matrix only against that final `fresh/receipt_matches` runtime at
`http://127.0.0.1:3000/`; it must not reuse PID `44905` if the receipt write has made it stale.

### Coverage gaps

- The Design System visual/browser matrix was intentionally not run. This receipt proves only that
  its required managed local artifact can be admitted.
- Hosted, release, deployment, production, provider-backed, and broader Global QA boundaries remain
  untested and unclaimed.

**Verdict: Passed**

Managed local `qa_fixture` ownership and admission recovery succeeded. DESIGN SYSTEM can resume
after the post-receipt status supplied by QA confirms the final artifact is fresh.
