# Hito Project Profile

Status: current non-secret project identity and routing adapter. This file records stable facts and
explicit gaps; it does not grant authority or prove that a host currently has a capability. Detailed
behavior remains in the linked contracts.

## Project Identity

| Fact                    | Verified value                                                                    |
| ----------------------- | --------------------------------------------------------------------------------- |
| Project                 | Hito Running                                                                      |
| Canonical repository    | `ivan-nthng/hito-runner`                                                          |
| Canonical local root    | `/Users/ivan/Developer/hito-running`                                              |
| Default branch          | `main`                                                                            |
| Live Git authority      | `main`; resolve its exact revision from Git and the live HITO-303 release receipt |
| Operator                | Ivan through PRODUCT                                                              |
| Operational task system | Hito Running Notion; stable Task prefix `HITO`                                    |

Git identifies code history. Notion owns current lifecycle; Markdown owns technical contracts and
evidence; Supabase owns runtime data. The behavioral contract is the
[task and role routing contract](docs/process/hito-task-and-role-routing.md).

## Applications And Surfaces

| Boundary                       | Current fact                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| Production deployable surfaces | Runner, Admin and History in one React/TanStack Start application                            |
| Shared repository UI           | Frontend-owned Design System; `/hitoDS` is its reference surface, not a separate application |
| Local-only surfaces            | Inline Debugger/Capture, Camelot and `qa_fixture`; none is production authority              |
| Marketing                      | Future public surface; not a separate deployed application today                             |
| Native mobile                  | No admitted iOS or Android application in this repository                                    |

## Environment, Service And Deployment Identity

| System                     | Non-secret identity                                                                                          | Current boundary                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| GitHub                     | `ivan-nthng/hito-runner`, default branch `main`                                                              | Code and review history only                                                    |
| Notion Tasks               | data source `3c1fe5f5-8cf5-8036-bbcb-000b43565fa9`                                                           | Sole operational lifecycle writer                                               |
| Notion Epics               | data source `3c2fe5f5-8cf5-8119-a9fe-000b8582d761`                                                           | Finite outcome grouping                                                         |
| Notion parent database     | `3c1fe5f5-8cf5-80b1-82b9-ea04ffe33296`                                                                       | Project-local Notion container                                                  |
| Local Supabase             | project ID `hito-running`; CLI `2.109.1`; Docker context `desktop-linux`                                     | Disposable, synthetic-only; final verified state stopped                        |
| Hosted Supabase            | project ref `dltfjwexyctmihclcjqj`                                                                           | Production data boundary; current parity not re-proved in this slice            |
| Preview Supabase           | unresolved                                                                                                   | No distinct project identity is admitted                                        |
| Vercel                     | project `hito-runner`; project ID `prj_2vQ43bjCsO7JEbH1Ggv93avrUcyL`; org ID `team_jK6pcC3dgzpQAcgEwx05ozx4` | Git-backed application deployment                                               |
| Accepted Vercel deployment | `dpl_2u1gAPpRMVgwDg9dWcKnJWVtWjCd` for source revision `fca161507e9dd344a141712d48d799b4204091d8`            | READY; application evidence only, not Supabase parity                           |
| OpenAI/provider project    | unresolved                                                                                                   | No identifier or provider authority is inferred                                 |
| Figma file/project         | unresolved                                                                                                   | Active role identity; each mutation still requires an admitted target and scope |

HITO-302 released commit `28cddb8f90b094c66eacae3d9a903a0889336b2b`, whose parent is
`fca161507e9dd344a141712d48d799b4204091d8`; it removed `pnpm-lock.yaml` from `.prettierignore`, was
not deployed and carries no new runtime claim. The exact live `main` revision is resolved from Git
and the live [HITO-303 release receipt](https://app.notion.com/p/3ccfe5f58cf5819e8173ee9df4d48c32),
never from a self-referential SHA in this versioned profile. The admitted HITO-303 recovery release
changes documentation/tooling only and is not a product deployment.

The secret-free [Supabase environment register](docs/process/hito-supabase-environment-register.md)
owns lifecycle details. The repository contains 59 ordered migration files at immutable HITO-302
source revision `28cddb8f90b094c66eacae3d9a903a0889336b2b`; the admitted HITO-303 recovery release changes no
migration or runtime source. Current local or hosted application of all 59 was not re-proved and
remains unavailable.

## Canonical Sidebar Role Bindings

Role identity is stable; a thread binding is replaceable project configuration and never capability
proof. Update this table atomically when PRODUCT replaces a canonical sidebar task.

| Role                      | Canonical thread ID                    | Boundary                                                                  |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| PRODUCT                   | `019fe744-be1c-7042-aed7-fc9f83c671af` | Intake, scope, decisions, exceptions and final acceptance                 |
| ARCHITECT                 | `019fe744-be1c-7042-aed7-fc83eae987b0` | Architecture, source-of-truth and recovery decisions                      |
| BACKEND                   | `01a01327-e4be-7031-9637-3abfdb8584d0` | Domain/server truth, persistence, environments and release implementation |
| FRONTEND                  | `019fe75f-c154-7490-9c09-561a92df34b8` | Product UI, Design System runtime and local DevTools UI                   |
| QA                        | `01a03f3c-9f62-7e62-a4d0-4bc31ed8ac94` | Independent acceptance and reproducible evidence                          |
| RUNNING COACH             | `01a03103-f3c7-76c2-a773-3cc3203d2372` | Bounded training-quality decisions                                        |
| DESIGNER                  | `019fe75f-bdfe-74a0-b70a-54dc99f24c10` | Bounded visual/product-design decisions                                   |
| MARKETING MANAGER         | `01a048e0-aec1-7b30-ac64-b48784daec4a` | Market, audience and positioning research                                 |
| DESIGN SYSTEM INTEGRATION | `019fd75a-9001-7430-b5f7-6e676807aa69` | Active Figma-only work; explicit target and scope required per mutation   |

## Domain Owner Routing

PRODUCT owns runner-visible policy and acceptance. ARCHITECT owns cross-domain boundaries. The
system owner below owns domain truth and commands; FRONTEND consumes public contracts and QA accepts
independently.

| Domain                        | System owner                                    | Public direction                                                                 |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Identity / Profile            | BACKEND                                         | Identity facts feed admitted Runner and Admin consumers                          |
| Source Authoring / Provenance | BACKEND                                         | Produces reviewed source candidates; never Calendar authority                    |
| Runner Calendar               | BACKEND                                         | Owns confirmed runner workouts and their lifecycle                               |
| Result / Evidence             | BACKEND                                         | Owns provider-neutral factual outcomes downstream of Calendar                    |
| Runner Activity / Progress    | BACKEND                                         | Derives factual activity/profile projections from evidence                       |
| Training Decision             | BACKEND                                         | Consumes immutable blueprint/profile/evidence facts and emits an authoring brief |
| Entitlement / Commercial      | BACKEND                                         | Owns durable grants and commercial facts; no inferred revenue                    |
| Admin                         | BACKEND                                         | Server-owned operational read models; FRONTEND owns presentation                 |
| Platform / delivery           | ARCHITECT for boundaries; BACKEND for execution | Environment, broker and release follow existing runbooks                         |

Accepted dependency detail lives in [current system](docs/current-system.md) and the
[functional ownership map](docs/current-functional-map.md).

## Canonical Documentation

| Need                                          | Owner                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Compact constitution and progressive load     | [`AGENTS.md`](AGENTS.md)                                                                                           |
| Project-local non-secret identity             | This file                                                                                                          |
| Documentation route map                       | [`docs/README.md`](docs/README.md)                                                                                 |
| Current product/business truth                | [`docs/current-product.md`](docs/current-product.md)                                                               |
| Current domain/system truth                   | [`docs/current-system.md`](docs/current-system.md)                                                                 |
| Released snapshot and unavailable boundaries  | [`docs/current-state.md`](docs/current-state.md)                                                                   |
| Role and functional ownership                 | [`docs/current-functional-map.md`](docs/current-functional-map.md)                                                 |
| Terms and product context                     | [`docs/glossary.md`](docs/glossary.md), [`docs/context.md`](docs/context.md)                                       |
| Task admission, lifecycle and broker protocol | [`docs/process/hito-task-and-role-routing.md`](docs/process/hito-task-and-role-routing.md)                         |
| Supabase identity and lifecycle               | [`docs/process/hito-supabase-environment-register.md`](docs/process/hito-supabase-environment-register.md)         |
| Release gate                                  | [`docs/process/hito-release-quality-sweep-runbook.md`](docs/process/hito-release-quality-sweep-runbook.md)         |
| Portable adoption model                       | [`docs/process/portable-project-agent-operating-model.md`](docs/process/portable-project-agent-operating-model.md) |

## Accepted Stack And Configuration

The direct manifest/config owner remains authoritative; this table makes the current policy
discoverable without replacing those files. Manifest ranges are update policy, while
`package-lock.json` lockfile v3 is the exact installed-resolution contract.

| Concern                           | Accepted owner                                                                                                                                                                                                     | Current version/config policy and verified boundary                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager and local runtime | [`.nvmrc`](.nvmrc), [`package.json`](package.json), [`package-lock.json`](package-lock.json)                                                                                                                       | `.nvmrc` pins Node `24.19.0`; the manifest and root lockfile metadata admit Node `24.x`; `packageManager` owns npm `10.9.4`.                                                                                               |
| Hosted runtime                    | [Vercel project config](.vercel/project.json)                                                                                                                                                                      | TanStack Start project on Node `24.x`. Vercel advances minor and patch versions within that major, so this does not prove hosted patch parity with local Node `24.19.0`.                                                   |
| Application framework             | [`package.json`](package.json), lockfile and [`vite.config.ts`](vite.config.ts)                                                                                                                                    | React/DOM `19.2.5`, TanStack Start `1.168.36`, Router `1.170.19`, Vite `7.3.6`, Nitro `3.0.260610-beta`, TypeScript `5.9.3`; Nitro is the sole Vercel adapter.                                                             |
| UI/CSS                            | manifest, lockfile, [`vite.config.ts`](vite.config.ts), [`components.json`](components.json)                                                                                                                       | Tailwind and Vite plugin `4.2.2`; shadcn configuration is Frontend tooling metadata, not a second Design System owner.                                                                                                     |
| Database/Auth/Storage             | [`supabase/config.toml`](supabase/config.toml), [`scripts/configure-local-supabase-env.mjs`](scripts/configure-local-supabase-env.mjs), [environment register](docs/process/hito-supabase-environment-register.md) | Supabase CLI `2.109.1`, Postgres `17`, `@supabase/supabase-js` `2.112.0`, `@supabase/ssr` `0.10.3`; environment admission and parity remain separate evidence.                                                             |
| Product AI/provider               | Domain source contracts, not the package/config layer                                                                                                                                                              | No product provider SDK is installed. Provider/model/prompt versions and paid dispatch remain server-domain and Task authority; Supabase Studio's optional `OPENAI_API_KEY` setting is not product-provider configuration. |
| Build                             | npm lifecycle and [`vite.config.ts`](vite.config.ts)                                                                                                                                                               | `npm run build` always invokes destructive generated-output cleanup and deployment-parity prebuild, Vite/Nitro build, then artifact finalization. It is not read-only.                                                     |
| Validation/test                   | [`scripts/validate-backend.mjs`](scripts/validate-backend.mjs) plus focused `validate-*` scripts                                                                                                                   | Custom deterministic validators through `tsx 4.23.5`; no generic `test` script, Vitest/Jest/Cypress/Playwright config or claimed unit-test framework.                                                                      |
| Format/lint                       | [`.prettierrc`](.prettierrc), [`.prettierignore`](.prettierignore), [`eslint.config.js`](eslint.config.js)                                                                                                         | Prettier `3.8.2`; ESLint `9.39.4`; `npm run format` writes the repository, while scoped Prettier/ESLint calls are validation.                                                                                              |
| Browser acceptance                | QA role and managed loopback runtime                                                                                                                                                                               | No repository browser-runner dependency/config is installed. Browser evidence uses the admitted external QA capability and is never inferred from build or source validators.                                              |
| Release                           | [`scripts/validate-backend.mjs`](scripts/validate-backend.mjs) and [release runbook](docs/process/hito-release-quality-sweep-runbook.md)                                                                           | The release suite composes source checks, production build, artifact integrity and linked Supabase parity. It omits local DB, runtime, browser, Global QA, commit, push and deployment unless separately admitted.         |
| CI                                | [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                                                                                                                                                             | PR/`main` CI uses `.nvmrc` Node and declared npm; runs `npm ci`, lint, `validate:backend`, build, `git diff --check`; no cache/secrets/services/deployment. Hosted proof waits for released commit's first Actions PASS.   |

## Current Command Surface

[`package.json`](package.json) owns the complete script inventory (62 scripts at this baseline).
The Task admits only the stages its changed contract needs; composition is ordered evidence, not an
always-run shell alias or a substitute for domain/QA/release acceptance.

| Stage                    | Canonical command                                                                                                     | Output and mandatory omission                                                                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reproducible install     | `npm ci`                                                                                                              | Exact lockfile install; no dependency update.                                                                                                                                                                      |
| GitHub validation        | [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                                                                | Pull requests and pushes to `main` use Node from `.nvmrc`, install/assert the declared npm, then run `npm ci`, lint, backend source validation, build and diff hygiene. No cache, secrets, services or deployment. |
| Focused format check     | `npx --no-install prettier --check <admitted-paths>`                                                                  | Read-only formatting result. `npm run format` is a separate whole-repository write and is never routine validation.                                                                                                |
| Focused source lint      | `npx --no-install eslint <admitted-source-paths>`                                                                     | Lint plus configured Prettier diagnostics for named source paths; documentation-only Tasks omit it.                                                                                                                |
| Repository lint          | `npm run lint`                                                                                                        | Full-tree configured ESLint; not a build, typecheck, browser or runtime claim.                                                                                                                                     |
| Backend source contract  | `npm run validate:backend`                                                                                            | Current 15-check source suite; local DB, runtime and release groups are explicitly skipped.                                                                                                                        |
| Build                    | `npm run build`                                                                                                       | Mutating generated-output build with pre/post hooks; no browser, hosted or release claim.                                                                                                                          |
| Diff hygiene             | `git diff --check`                                                                                                    | Tracked diff whitespace/conflict proof; untracked files need separate scoped checks.                                                                                                                               |
| Local database contract  | `npm run validate:backend:local-db`                                                                                   | Requires admitted local Supabase and `.env.local`; 21 checks replace two source entries with persistence variants and add eight DB entries, not hosted parity.                                                     |
| Managed runtime contract | `npm run validate:backend:runtime`                                                                                    | Requires an admitted current loopback artifact at `127.0.0.1:3000`; 17 checks replace one source entry with three runtime entries.                                                                                 |
| Managed QA lifecycle     | `npm run qa:server:{status,start,restart,stop}`                                                                       | Sole `qa_fixture` runtime lifecycle; start/restart may build and are not read-only.                                                                                                                                |
| Local Supabase lifecycle | `npm run supabase:local:{configure,status,start,stop}`                                                                | Docker Desktop/project guard applies; configure/start/stop mutate local state.                                                                                                                                     |
| Release-quality suite    | `npm run validate:backend:release`                                                                                    | 18 checks: 15 source plus build, artifact integrity and linked Supabase parity; release runbook still owns freeze, QA, Git and deployment.                                                                         |
| Command-plan inspection  | `npm run validate:backend -- --list` and the corresponding `:local-db`, `:runtime`, `:release` commands with `--list` | Prints exact checks without executing them; it proves composition only.                                                                                                                                            |

There is no canonical aggregate `validate:project`, standalone typecheck, generic unit-test command
or browser runner at this baseline. The sole CI workflow composes the existing commands above and
does not introduce a second validation surface. Specialized fixture/proof scripts remain
Task-specific and do not expand this common surface. The accepted evidence and legacy disposition
are retained in [HITO-300](docs/tasks/backlog/2026-08-30-hito-stack-and-command-surface.md).

## Safety And Change Control

- [Root safety rules](AGENTS.md#safety-and-acceptance) govern dirty work, external actions and
  acceptance claims.
- [Routing and broker rules](docs/process/hito-task-and-role-routing.md#ivan-operator-profile-and-capability-broker)
  govern owner continuity, exact manifests, capability probing and one-time re-home.
- [Supabase lifecycle](docs/process/hito-supabase-environment-register.md) and the
  [release runbook](docs/process/hito-release-quality-sweep-runbook.md) retain their separate gates.
- The local Notion credential is loaded process-locally from
  `/Users/ivan/.config/hito/notion.env`; this path is configuration, never a permission to inspect,
  print, copy or expose its value.
- Unknown identity, authority, parity, owner, capability or rollback facts remain unresolved and
  fail closed. This profile is not a capability registry, secret store or execution receipt.
