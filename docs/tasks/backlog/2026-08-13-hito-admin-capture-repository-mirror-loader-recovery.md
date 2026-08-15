# Hito Admin Capture Repository Mirror Loader Recovery

## Work Item ID

2026-08-13-hito-admin-capture-repository-mirror-loader-recovery

## Status

completed

## Type

Tracked — Admin Capture server loader/runtime recovery

## Priority

high

## Owner

backend

## Mode

Tracked

## Parent

2026-08-13-hito-admin-ds-bounded-consumer-remediation

## Evidence From

2026-08-13-hito-admin-ds-bounded-consumer-remediation

## Scope

Determine and repair the first server-side cause of Admin Capture returning `capture_load_failed`
on a fresh, authenticated managed `qa_fixture` runtime before its toolbar, prompt, item details, or
async feedback nodes mount. The work owns repository-mirror/Supabase loader truth only; it does not
change the Admin route presentation, the completed DS consumer remediation, or the private Admin
snapshot integrity policy.

## Archive Intent

retain_in_place

## User Report

After the focused Admin DS remediation compiled and passed Login/Analytics browser proof, the
Capture route rendered `Work items unavailable` at desktop and mobile in both themes. Ivan wants
the actual root fixed so Admin verification and mobile adaptation can continue; no frontend
workaround, fixture shortcut, or UI-only suppression is acceptable.

## Evidence

- The fresh managed runtime passed client, SSR, Nitro, and postbuild before the Admin remediation
  receipt. Capture then emitted `capture_load_failed` before task-owned visual elements mounted.
- `npm run import-admin-backlog-work-items -- --dry-run --debug` scanned 359 eligible Markdown
  items and found zero duplicate Work Item IDs without writing Supabase. That rules out only the
  simple duplicate-ID hypothesis; it does not prove the live loader/mirror query succeeds.
- `src/lib/admin-capture.server.ts` builds a server-side Admin Supabase client and invokes
  repository-mirror synchronization before `listBacklog`. It catches all synchronization/query
  errors and returns the generic `capture_load_failed` result.
- `src/lib/admin-repo-mirror.server.ts` selects a filesystem or bundle projection based on request
  and Supabase origins, then serializes mirror synchronization. The actual error source is not yet
  discriminated.

## Observed Behavior

On the authenticated fresh fixture route, Capture does not load repository work items. Instead it
shows the existing factual unavailable state and emits `capture_load_failed`. Login and Analytics
remain functional, so the prior DS fixes are not demonstrated as the cause.

## Expected Behavior

- A fresh local authenticated `qa_fixture` runtime synchronizes/reads canonical repository work
  items through the intended existing mirror path and renders Capture data.
- The loader returns a bounded, source-backed failure reason when its root dependency genuinely
  fails; it must not silently collapse all server failures into an uninvestigable generic error.
- Canonical Markdown remains the one-way source of truth, repository rows remain its read-only
  mirror, and Quick Notes remain separate manual rows.

## Source Investigation

Start with these existing server owners and their tests:

- `src/lib/admin-capture.server.ts`
- `src/lib/admin-repo-mirror.server.ts`
- `scripts/import-repo-work-items-to-admin-backlog.ts`
- `scripts/validate-admin-capture-backlog.ts`
- the existing Supabase server/env/client seams only when the discriminator reaches them.

`listAdminCaptureBacklogForDependencies` currently calls `synchronizeRepoMirrorBeforeRead()` and
`repository.listBacklog()` inside one broad `catch`, which returns `capture_load_failed` without
retaining which operation failed. `buildCurrentDependencies()` currently chooses the synchronizer
using the request URL and configured Supabase URL. Treat both facts as investigation seams, not as
pre-authorized code changes.

## Required Discriminator

Before repair, establish the exact failing operation and its safe diagnostic evidence:

1. whether Admin server access/client environment is available in the fresh fixture;
2. resolved mirror source mode (`filesystem`, `bundle`, or unavailable) and its origin inputs;
3. synchronization result, timeout, mirror report, and any Supabase query/error code;
4. whether the failure is a source/contract defect, local fixture data/setup issue, missing table
   or migration, environment configuration mismatch, or a provider/hosted boundary; and
5. the first incorrect canonical owner.

Do not treat the importer dry-run as a successful live synchronization/read.

## Demonstrated Boundary

The private Admin snapshot digest freshness gate is independent. Backlog/plan writes can make a
prior artifact stale, but a fresh artifact that reaches the Capture route and emits
`capture_load_failed` needs its own loader diagnosis. Do not bypass, weaken, or remove the
snapshot collector, virtual module, or output-integrity validator.

## What Not To Touch

- No Capture route UI, DS primitive/token/CSS, visual fallback, source copy, user-facing error
  suppression, browser-only workaround, or fixture-only fake data path.
- No Quick Note behavior, auth policy, Admin role policy, product data semantics, hosted Supabase,
  production credentials, migration/RLS change, provider call, staging, Git lifecycle, or Figma
  mutation unless the demonstrated root requires a separately authorized owner/scope.
- Do not update arbitrary backlog rows or mutate user data. Disposable local test data is allowed
  only when existing test procedure requires it and it is fully cleaned up.
- Preserve every unrelated dirty source and task artifact byte-for-byte.

## Validation Expectations

- Reproduce the failure in the canonical local managed `qa_fixture` path; never use stale output
  or an ad hoc runtime as acceptance evidence.
- Add or adapt only focused deterministic proof needed to distinguish the failing stage and guard
  the fixed invariant; avoid a generic logging/helper/compatibility layer.
- Run applicable backend/Admin validators, focused TypeScript/lint/formatting, diff hygiene, and a
  fresh managed build/runtime check after all writers are quiet.
- Verify authenticated Capture at desktop and 375×812 mounts canonical data, local scroll remains
  local, and browser console is clean. The parent task's remaining prompt/toolbar/live-region
  browser checks may then be replayed without changing its source.
- If the cause requires hosted configuration, a new migration/RLS policy, or a different owner,
  stop with the exact failure artifact and return it to PRODUCT. Do not invent a local fallback.

## Stage

BACKEND implementation complete. The canonical mirror loader is green on the fresh managed local
runtime; PRODUCT may resume the parent Admin consumer acceptance flow.

## Next Recommended Role

product

## Exact Backend Handoff

```text
ROLE: BACKEND

Task: Hito Admin Capture Repository Mirror Loader Recovery
Mode: Tracked root-cause investigation and repair
Canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-admin-capture-repository-mirror-loader-recovery.md`
Parent evidence:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-admin-ds-bounded-consumer-remediation.md`

Read `AGENTS.md`, `agents/backend.agent.md`, and
`skills/hito-backend-supabase-contract/SKILL.md` completely before acting.

Outcome:
Find and repair the first server-side cause of fresh authenticated managed `qa_fixture` Admin
Capture returning `capture_load_failed` before work-item data and the admitted UI mount. Restore the
existing one-way canonical Markdown -> read-only repository-mirror path. Do not create a UI/fallback
or weaken the private snapshot integrity gate.

Facts already established:
- A fresh managed build passed before the parent receipt; Login/Analytics passed browser proof.
- Capture returned `capture_load_failed`; its route showed `Work items unavailable` before toolbar,
  Prompt, detail, or feedback nodes mounted.
- A non-mutating importer dry run scanned 359 Markdown items with zero duplicate Work Item IDs.
  This does not prove live Supabase synchronization/read.
- Start with `src/lib/admin-capture.server.ts`, `src/lib/admin-repo-mirror.server.ts`,
  `scripts/import-repo-work-items-to-admin-backlog.ts`, and
  `scripts/validate-admin-capture-backlog.ts`.
- The generic catch currently hides whether synchronization, source-mode selection, timeout, or
  repository query failed. Establish that exact discriminator before editing.

Required investigation:
1. Prove server env/client availability in the fresh fixture.
2. Prove resolved mirror mode and relevant request/Supabase origin relationship.
3. Capture the safe, redacted failing stage/error code/report for synchronization or list query.
4. Classify it as source contract, fixture setup/data, missing schema/RLS, config mismatch, or
   external/hosted condition; name the first incorrect owner.
5. Repair only the demonstrated canonical server/mirror seam, with a focused deterministic guard.

Preserve:
- Markdown as canonical source; mirror rows read-only; Quick Notes separate.
- Capture route presentation, completed DS/Admin source, snapshot collector/plugin/integrity gate,
  Admin auth/access policy, product data semantics, hosted state, and unrelated dirty work.
- No migration/RLS/hosted action unless the discriminator proves it and you return to PRODUCT for a
  separate owner/scope decision. No local fake data or browser-only workaround.

Runtime serialization:
You own the canonical managed fixture lifecycle for this task. Recheck current writers and task
identity before any build/restart. Use only the repository-managed loopback `qa_fixture` procedure;
do not use an ad hoc server or stale artifact. Later DS mobile work is intentionally held until your
terminal source/runtime result.

Validate proportionally: focused server/importer/validator proof, formatting/lint/TypeScript/diff
hygiene, fresh managed production build/runtime after writers are quiet, and authenticated Capture
at desktop/375×812 with data mounting, local scroll containment and console health. Reuse any safe
existing local fixtures and clean up disposable data if created. If the parent UI needs rechecking,
report that handoff without modifying its source.

Keep the canonical item truthful with a compact English receipt: observed cause, owner, files,
source/data/runtime proof, cleanup, omitted proof, next owner and blockers. Do not stage, commit,
push, deploy, mutate hosted data, or claim Global QA/release readiness.
```

## Backend Tracked Implementation Receipt — 2026-08-13

### Preflight and outcome

- Mode: Tracked.
- Reused seams: the canonical Markdown parser/importer, the existing one-way repository mirror,
  `listAdminCaptureBacklogForDependencies`, the existing Admin validator, and the repository-managed
  loopback `qa_fixture` lifecycle.
- New production runtime artifacts: none. No migration, table, RLS change, RPC, fixture-only path,
  UI fallback, compatibility wrapper, or provider path was added.
- Result: fresh authenticated Admin Capture again synchronizes and reads canonical Markdown mirror
  rows, mounts work-item data and the Backend-generated Prompt, and preserves the existing public
  `capture_load_failed` response shape for real dependency failures.

### Root-cause discriminator

The loopback server environment, Admin Supabase client, `filesystem` source mode, table visibility,
and list/count queries were all healthy. The first live mirror write failed while refreshing
`docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md` because the importer
parsed its compact terminal metadata list as if no Work Item ID existed, then correctly refused to
erase the immutable ID already present in the mirror. The canonical parser recognized only
`## Field` lead sections, while 26 compacted terminal records use leading
`- **Field:** value` metadata. The first incorrect owner was
`scripts/admin-backlog-import/markdown.ts`, not Admin auth, Supabase schema/RLS, timeout handling,
the Capture route, or Design System source.

The parser now accepts both canonical lead formats and stops before body headings, so later evidence
cannot override lead metadata. The loader also records only a bounded stage and safe error code in
server logs while keeping internal messages and secrets out of the public response.

### Files

- Changed: `scripts/admin-backlog-import/markdown.ts`.
- Changed: `scripts/admin-backlog-import/contract-proof.ts`.
- Changed: `scripts/import-repo-work-items-to-admin-backlog.ts`.
- Changed: `src/lib/admin-capture.server.ts`.
- Changed: `scripts/validate-admin-capture-backlog.ts`.
- Added task evidence under
  `qa-artifacts/screenshots/2026-08-13/hito-admin-capture-repository-mirror-loader-recovery/`.
- Updated: this canonical item only. Capture route presentation, shared CSS/DS source, migrations,
  generated types, auth policy, snapshot integrity, providers, hosted state, and unrelated dirty
  work were not changed by this task.

### Validation inventory

| Check                                | Scenario / environment                                               | Result                  | Evidence                                                                                                                                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red source discriminator             | Live loopback mirror sync before repair                              | Passed                  | Refresh stopped at `refresh_existing_admin_capture_item` for the compact 2026-06-04 record with `Work Item ID ... is immutable`; no duplicate IDs or manual rows were involved.                                                                                  |
| Environment and source mode          | Fresh local request plus loopback Supabase                           | Passed                  | Request origin `127.0.0.1:3000`, Supabase origin `127.0.0.1:54321`, resolved mode `filesystem`; Admin client and direct list/count reads were healthy.                                                                                                           |
| Compact metadata contract            | Deterministic parser proof                                           | Passed                  | Lead Work Item ID/status/type/priority/owner/scope/archive/task parse correctly, and body Evidence status cannot replace lead status.                                                                                                                            |
| First live convergence               | Canonical one-way mirror sync                                        | Passed                  | 361 Markdown items scanned; 58 mirror rows created, 20 updated, 283 skipped; duplicate Work Item IDs `0`, manual rows `0`.                                                                                                                                       |
| Repeat convergence                   | Immediate second canonical live sync                                 | Passed                  | Created `0`, updated `0`, skipped `361`; no accumulation or duplicate identity.                                                                                                                                                                                  |
| Server read seam                     | Authenticated loopback list through canonical loader                 | Passed                  | `ok`, 89 active rows shown; counts `new=86`, `ready_for_codex=3`, `done=197`, `archived=75`; no provider response identifiers.                                                                                                                                   |
| Failure diagnostic privacy           | Deterministic sync/list/timeout failures                             | Passed                  | Validator proves safe `repository_mirror_sync` / `repository_list` stage plus bounded code; public failure remains `capture_load_failed` without internal error text.                                                                                            |
| Admin deterministic validator        | `npm run validate-admin-capture-backlog`                             | Passed                  | All 34 checks passed, including compact terminal identity and safe stage/code diagnostics.                                                                                                                                                                       |
| Full live Admin validator            | Local Supabase                                                       | Known unrelated failure | It stops on the pre-existing private legacy Storage bucket `admin-capture-assets`; table/schema checks pass and no disposable inserts were reached. The task did not delete or mutate that out-of-scope bucket.                                                  |
| Production build and managed fixture | One repository-managed `npm run local:fixture` after writers stopped | Passed                  | Client, SSR, Nitro and postbuild completed; `qa:server:status` reports managed, loopback-only, healthy, `providerMode=qa_fixture`, `artifactFreshness=fresh`, and `lastArtifactDecision=rebuilt`.                                                                |
| Authenticated Capture desktop        | 1470×801, fresh managed runtime                                      | Passed                  | 89 mirrored cards mounted; the current work item expanded with Markdown metadata and Backend-generated Prompt; document width equaled viewport width. See `capture-current-item-1470x801.png`.                                                                   |
| Authenticated Capture mobile         | Exact 375×812, fresh managed runtime                                 | Passed                  | Data and expanded Prompt mounted; document width was 375 px with no horizontal overflow; the long Prompt used its bounded `overflow-auto` surface. See `capture-detail-375x812.png`.                                                                             |
| Browser console                      | Same desktop/mobile session                                          | Passed                  | No warning or error entries.                                                                                                                                                                                                                                     |
| Runtime event discriminator          | Local observability for `/admin/capture`                             | Passed                  | Historical red events remain `capture_load_failed`; the repaired authenticated request completed with `action_completed` and HTTP 200 in 1,797 ms.                                                                                                               |
| Formatting / lint / diff hygiene     | Task-owned paths                                                     | Passed                  | Targeted Prettier, ESLint, and `git diff --check` passed.                                                                                                                                                                                                        |
| Repository-wide TypeScript           | `npx tsc --noEmit --pretty false`                                    | Known unrelated failure | The dirty candidate retains broad pre-existing errors, including unchanged importer lines and unrelated UI/training owners; no error points to this task's new hunks. The fresh production build is green, but whole-tree TypeScript cleanliness is not claimed. |

### Cleanup and boundaries

No disposable Admin row was created by the validator, so no cleanup was required. The canonical
mirror updates are the intended retained read-only projection of current Markdown. No hosted state,
production data, provider, migration, Git index, commit, push, or deployment was touched. Writing
this terminal receipt changes the private source snapshot digest after the successful fresh runtime
proof; the next managed lifecycle owner must rebuild once rather than treating expected receipt
staleness as a new Capture defect.

### Next owner and acceptance boundary

Backend Implementation DoD: passed. PRODUCT may return the parent item to its existing Frontend/QA
browser acceptance flow and may separately route legacy private Storage-bucket hygiene if that full
validator gate is required. Global QA, hosted acceptance, release readiness, and deployment were not
performed or claimed. No subagent was used.
