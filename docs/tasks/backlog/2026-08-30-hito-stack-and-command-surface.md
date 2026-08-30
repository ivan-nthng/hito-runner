# HITO-300 — Normalize Hito Stack and Reproducible Command Surface

- Work Item ID: `HITO-300`
- Status: Done
- Type: Maintenance
- Priority: Highest
- Owner: ARCHITECT
- Primary Area: Platform
- Epic: Recover Hito Delivery Operating Model
- Lifecycle: [Live Notion Task](https://app.notion.com/p/3ccfe5f58cf581cf86b8c19aa9a3e378)
- Archive Intent: retain the accepted stack, command surface, contradiction ledger and rollback.

## Task

Make Hito's current technology/configuration owners and reproducible validation commands discoverable
without adding a second stack or hiding omitted checks.

## User Report

Routine tasks repeatedly run different commands, read a wrong checkout or infer CI/runtime state.

## Evidence And Observed Behavior

HITO-296 found no canonical local/CI command, distributed stack facts and configuration/version
ownership that must be rediscovered from package scripts and process documents.

## Expected Behavior

One current stack table and one command surface name exact owners, inputs, outputs, omissions and
release composition. CI absence remains explicit until real CI exists.

## Source Investigation And Root Cause

The stack itself is coherent; the operational contract is fragmented. Normalize truth before any
dependency or infrastructure decision.

## What Not To Touch

No dependency upgrade, new CI service, runtime/product behavior, schema, provider, deployment or
unrelated dirty bytes.

## Validation Expectations

Prove reachability, no duplicate authority, focused command reproducibility and rollback. Record
RETAIN / SUPERSEDE candidates without deleting them.

## Accepted Stack And Command Decision — 2026-08-30

[`PROJECT_PROFILE.md`](../../../PROJECT_PROFILE.md#accepted-stack-and-configuration) is the compact
current owner of Hito-local stack identity and the common command surface. Direct manifests and
configs remain executable truth; this record retains the evidence, contradictions, disposition and
rollback. It creates no registry, package, script or CI layer.

### Current Stack And Owners

| Concern               | Direct owner                                                                     | Exact current fact and policy                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package/install       | `package.json`, `package-lock.json`                                              | npm `10.9.4`; lockfile v3; manifest ranges govern allowed updates and the lock owns exact resolution. Canonical reproducible install is `npm ci`, not `npm install`.                                      |
| Runtime               | `package.json`, `.vercel/project.json`                                           | Engine floor `>=22.12.0`; local proof ran on Node `22.22.1`; Vercel config selects `24.x`. Equality is not claimed and no repository exact-Node pin exists.                                               |
| Framework             | manifest, lock, `vite.config.ts`                                                 | React/DOM `19.2.5`; TanStack Start `1.168.36`; Router `1.170.19`; Vite `7.3.6`; Nitro `3.0.260610-beta`; TypeScript `5.9.3`. Nitro is the sole Vercel adapter.                                            |
| Database/Auth/Storage | `supabase/config.toml`, `configure-local-supabase-env.mjs`, environment register | Supabase CLI `2.109.1`; Postgres `17`; JS client `2.112.0`; SSR `0.10.3`. Config/version truth does not prove a running stack or local/hosted migration parity.                                           |
| Provider              | Server-domain contracts                                                          | No product-provider SDK is installed. Provider/model/prompt versions and paid dispatch are not package-level stack facts; the optional Supabase Studio environment key is not product-provider authority. |
| Build/deploy adapter  | npm prebuild/build/postbuild, `vite.config.ts`, `.vercel/project.json`           | Build clears managed generated output, checks deployment configuration, builds Vite/Nitro and finalizes an immutable local/Vercel artifact. Running it is a mutation, not a dry check or deployment.      |
| Source validation     | `scripts/validate-backend.mjs` and direct `validate-*` consumers                 | Source suite has 15 checks; local DB adds eight persistence checks; runtime adds three loopback checks; release adds build, artifact-integrity and linked-Supabase-parity checks.                         |
| Format/lint           | `.prettierrc`, `.prettierignore`, `eslint.config.js`                             | Prettier `3.8.2`; ESLint `9.39.4`; lint includes configured Prettier diagnostics. Full `format` writes the tree; scoped `--check` is validation.                                                          |
| Browser/QA            | `qa-local-server.mjs`, QA role                                                   | Managed runtime is loopback-only. No Playwright/Cypress/browser-runner dependency or config exists; external admitted browser evidence is a separate QA layer.                                            |
| Release               | Backend release suite plus release runbook                                       | The suite is release-quality input, not release: local DB, runtime, browser, Global QA, commit, push and deployment are omitted unless the Task/runbook admits them.                                      |
| CI                    | none                                                                             | No `.github/workflows`, other CI config or canonical CI command exists. Local execution cannot claim CI parity.                                                                                           |

Manifest ranges and exact locked resolutions are not competing truth: a dependency change updates
both in one dependency-owned slice. Local Node `22.22.1` and hosted Node `24.x` are compatible with
the engine floor but are distinct environments; this Task does not choose or install a common pin.

### Canonical Local Composition

There is deliberately no new aggregate script. A Task selects the applicable ordered stages and
records every omitted layer:

1. `npm ci` establishes the exact dependency graph only when installation is in scope.
2. `npx --no-install prettier --check <admitted-paths>` checks formatting. Source changes add
   `npx --no-install eslint <admitted-source-paths>` or full `npm run lint` when risk requires it.
3. Backend-domain changes run `npm run validate:backend`; database/runtime variants require their
   separately admitted environment and are never inferred.
4. `npm run build` is the production artifact build when build proof is required. It mutates only
   managed generated output and triggers its existing pre/post hooks.
5. `git diff --check` closes tracked diff hygiene; untracked artifacts receive explicit scoped
   formatting/link/whitespace checks.
6. A release candidate uses `npm run validate:backend:release` only inside the release runbook's
   sole-writer freeze. The command does not commit, push, deploy or provide browser/Global QA.

The four backend suite shapes are inspectable without executing their checks by appending `--list`.
Managed runtime and Supabase lifecycle commands retain their own admission/cleanup contracts. The 62
package scripts include domain-specific fixture and proof commands; their existence does not make
them part of every Task's validation envelope.

### Contradiction And Duplication Disposition

| Disposition         | Exact path/responsibility                                                                       | Direct consumer/replacement proof                                                                                                                                                                         | Rollback / deletion gate                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RETAIN              | `package.json` plus `package-lock.json`                                                         | npm manifest policy and exact resolution are complementary; current installed CLI versions match the lock.                                                                                                | A dependency slice changes both together; this Task changes neither.                                                                                                  |
| RETAIN              | `vite.config.ts` Nitro/Vercel adapter and `.vercel/project.json` Node `24.x`                    | Current system names one TanStack/Vite/Nitro/Vercel application; no second build adapter config exists.                                                                                                   | Any replacement requires a successful equivalent build/deploy rollback, outside HITO-300.                                                                             |
| RETAIN              | `npm run lint` and scoped Prettier                                                              | ESLint owns source rules and embeds Prettier diagnostics; scoped Prettier gives a direct document/format result. Overlap is validation, not a second formatter.                                           | Keep while each reports a distinct contract.                                                                                                                          |
| RETAIN              | 62 package scripts                                                                              | Direct package consumers expose focused domain, fixture, environment and release operations; only the profile defines the common subset.                                                                  | Individual deletion requires zero caller and replacement proof in its owning domain.                                                                                  |
| SUPERSEDE           | Root `README.md` command list (`npm install`, `npm run start`) as canonical validation guidance | It is an imported-baseline quick start. `PROJECT_PROFILE.md` now owns reproducible install and managed validation/runtime commands.                                                                       | Retain file/path; compact only in a later admitted docs slice and restore from Git if current onboarding facts are lost.                                              |
| SUPERSEDE           | `npm run start` / `serve:local` as direct QA admission                                          | Both invoke the same loopback server, while `qa:server:*` owns current artifact freshness, slot identity, lease/state and cleanup. Historical receipts are evidence, not callers.                         | Keep scripts until all current nonhistorical consumers use the managed lifecycle and QA proves start/status/stop parity.                                              |
| RETAIN              | `local:fixture` and `local:real` wrappers                                                       | `docs/process/test-user-lifecycle.md` directly consumes both provider-mode shortcuts; they select existing `qa:server:restart`, not a second server.                                                      | Delete only after that current consumer migrates and provider-mode parity is proven.                                                                                  |
| SUPERSEDE           | `npm run format` as a validation step                                                           | The script is a whole-tree write; scoped `prettier --check` is the non-mutating validation replacement.                                                                                                   | Retain the formatting command for explicitly admitted writes; never delete while maintainers need full formatting.                                                    |
| DELETE-CANDIDATE    | `.prettierignore` entry `pnpm-lock.yaml`                                                        | npm is the sole declared package manager, `package-lock.json` is present, and no pnpm/yarn/bun lockfile exists.                                                                                           | Remove only in a later docs/config cleanup with formatting parity; rollback restores the one ignore line.                                                             |
| DELETE-CANDIDATE    | `supabase/config.toml` seed-enabled stanza pointing to absent `supabase/seed.sql`               | The environment register admits a no-seed clean baseline; the configured seed target does not exist.                                                                                                      | BACKEND must first prove CLI reset behavior and accepted no-seed reconstruction, then set seed disabled; rollback restores the stanza. No DB action is admitted here. |
| SUPERSEDE-CANDIDATE | `vite.config.ts` development host `::`                                                          | Managed QA and local-only tooling contracts require loopback, while `npm run dev` currently permits wildcard binding. This is a configuration/security mismatch, not evidence that production is exposed. | FRONTEND/Platform must prove dev/HMR behavior on loopback and preserve local tooling before changing the dirty file; rollback restores `::`.                          |
| RETAIN AS GAP       | no exact local Node pin, no standalone typecheck/test/browser command and no CI workflow        | Direct config proves absence. Fabricating aliases or CI would create unaccepted infrastructure and false parity.                                                                                          | PRODUCT admits a separate owner/slice only if these become acceptance requirements.                                                                                   |

No candidate is deleted or edited by HITO-300. In particular, the currently dirty `vite.config.ts`
belongs to another accepted writer and remains byte-for-byte protected.

## Slice Receipt And Residual Boundary

Writable paths are only `PROJECT_PROFILE.md` and this record. Their pre-slice SHA-256 values were
`b4d49dc2c10a4c920794c536d06b903e025ca9981260c7dec3f1ccbf88eb06a2` and
`a65e823bcbcf095a5fd219896285e6f09aeef580dd8db60ee48a815f56e7a12b`, respectively. The other 27
modified/untracked paths are protected by ordered `mode + SHA-256 + path` digest
`e2b3fc6f5825f09fd7a1dc78c8f83e7e59488ea7f767216535e3f47eab22eaac`.

The protected path set is exactly:

- `AGENTS.md`
- `agents/frontend.agent.md`
- `docs/current-state.md`
- `docs/process/camelot-interactive-qa-fixture.md`
- `docs/process/hito-supabase-environment-register.md`
- `docs/process/hito-task-and-role-routing.md`
- `docs/tasks/backlog/2026-08-15-hito-marketing-kinetic-icon-hero-discovery.md`
- `docs/tasks/backlog/2026-08-24-hito-camelot-interactive-qa-fixture.md`
- `docs/tasks/backlog/2026-08-25-hito-first-user-production-launch-readiness.md`
- `docs/tasks/backlog/2026-08-28-hito-full-fidelity-runner-activity-retention-and-reprocessing-discovery.md`
- `docs/tasks/backlog/2026-08-28-hito-interrupted-week-recovery-review.md`
- `docs/tasks/backlog/2026-08-28-hito-simple-public-marketing-site.md`
- `docs/tasks/backlog/2026-08-30-hito-agent-execution-constitution-and-capability-broker.md`
- `docs/tasks/backlog/2026-08-30-hito-capability-broker-admission-core.md`
- `docs/tasks/backlog/2026-08-30-hito-fit-activity-details-accuracy.md`
- `docs/tasks/backlog/2026-08-30-hito-live-task-metadata-recovery.md`
- `docs/tasks/backlog/2026-08-30-hito-operating-model-delivery-pilot.md`
- `docs/tasks/backlog/2026-08-30-hito-operating-model-recovery-closeout.md`
- `docs/tasks/backlog/2026-08-30-hito-restore-existing-camelot-after-plan-shape-drift.md`
- `scripts/camelot-interactive-qa.mjs`
- `scripts/lib/runner-design-profile-fixture.ts`
- `scripts/test-user.mjs`
- `scripts/validate-restored-saved-plan-server-fn.ts`
- `src/components/devtools/LocalDevtoolMenuItem.tsx`
- `src/components/devtools/LocalDevtoolMount.tsx`
- `src/components/devtools/local-devtool-gate.ts`
- `vite.config.ts`

### Focused Proof

- Read-only version commands reported Node `22.22.1`, npm `10.9.4`, Vite `7.3.6`, TypeScript
  `5.9.3`, ESLint `9.39.4`, Prettier `3.8.2` and tsx `4.23.5`; lockfile reads supplied the remaining
  exact package resolutions.
- Backend `--list` dry runs resolved 15 source, 21 local-DB, 17 runtime and 18 release checks without
  executing validators, building, starting a runtime or contacting Supabase. `qa-local-server help`
  resolved the single `qa_fixture` lifecycle and loopback `127.0.0.1:3000` without starting it.
- Direct config census found 62 package scripts, npm lockfile v3, no alternative lockfile, no exact
  repository Node pin, no generic test/browser config and no `.github/workflows` CI surface.
- Scoped Prettier, local Markdown links, trailing-whitespace, contradiction/reachability and
  `git diff --check` passed. The 27-path post-slice digest remained exactly
  `e2b3fc6f5825f09fd7a1dc78c8f83e7e59488ea7f767216535e3f47eab22eaac`.

Build, lint execution, source validators, database, runtime status/start, browser, hosted parity,
provider, CI, release and deployment were deliberately omitted: this architecture slice inspected
composition only and had no authority to mutate or claim those layers.

Rollback restores those two pre-slice documents only. No dependency, lockfile, config, runtime,
source, schema, migration, provider, hosted service, CI, broker, Git state, release or deployment is
changed, so no system rollback exists. HITO-301 is not dispatched.

## Product Acceptance — 2026-08-30

PRODUCT accepted the stack/config owner table, canonical local command composition, explicit CI and
browser omissions, contradiction disposition and protected-path proof. Cleanup candidates remain
unexecuted and move only through their named future owners. HITO-301 is the sole next Recovery Epic
edge.
