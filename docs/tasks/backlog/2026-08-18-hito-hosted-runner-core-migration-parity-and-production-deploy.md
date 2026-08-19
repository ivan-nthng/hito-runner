# Hito Hosted Runner Core Migration Parity And Production Deploy

Work Item ID: `2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy`
Status: completed
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: platform-and-operations
Parent: [Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Runner Core Release Freeze And Candidate Admission](./2026-08-18-hito-runner-core-release-freeze-and-candidate-admission.md)

## Scope

Apply only the exact missing, committed Runner Core migrations to the existing linked hosted
Supabase project, verify deployed schema parity, then redeploy the already-pushed `main` commit
`14ccfbfe8742d5d894e9629169a946d144a4d06f` through the existing Vercel project.

## Archive Intent

Retain the exact hosted migration/deployment evidence as the production release record for this
checkpoint.

## Task

Repair the production deployment gate without source changes. The Vercel build for `14ccfbf` was
rejected before application compilation because hosted migration history is missing the exact
Runner Core delta. Reuse the repository-linked Supabase/Vercel procedures; do not use ad-hoc SQL or
an alternate database path.

## User Authorization

Ivan explicitly authorized, on 2026-08-18, applying only the required hosted Supabase migrations
and redeploying the current `main` checkpoint. This does not authorize source/migration rewrites,
data deletion, provider calls, credentials exposure, domain/configuration changes, force Git
operations, or unrelated hosted mutation.

## Evidence

The hosted Vercel build cloned `main` at `14ccfbf` and failed in the intentional prebuild parity
gate with:

```text
missingHosted=20260815195439,20260815212107,20260816004652,20260816020328,20260816171845
unknownHosted=none
```

The failing build did not reach application compilation. The Node-version warning is advisory and
not the cause.

## Observed Behavior

Production continues serving the previous application, including the removed `Execution` sidebar
and obsolete `Plan note`, because Vercel rejected the newer commit before deploy.

## Expected Behavior

Hosted Supabase has the exact migration history required by `14ccfbf`; a redeployed Vercel build
passes its own parity gate and makes that existing commit the production build.

## Demonstrated Cause

Hosted schema drift is confirmed by the parity gate. The required discriminator before mutation is
that the linked project, target SHA, and live history still resolve to exactly the five listed
migrations with no hosted-only version or additional delta.

## What Not To Touch

Do not edit source, migration files, generated types, configuration, Vercel settings, secrets,
domains, fixtures, local databases, user data, providers, Git history, or unrelated hosted state.
Do not apply a migration if the live delta differs from the five recorded versions.

## Validation Expectations

- Record linked hosted-project and exact `main` target verification before mutation.
- Use the normal repository-pinned hosted migration procedure to dry-run and apply only the exact
  ordered delta.
- Verify hosted migration history and `npm run supabase:deployment:parity` after application.
- Redeploy only the existing `main` commit and record Vercel build/deployment outcome plus public
  HTTP reachability. Browser product QA and Global QA remain outside this task.

## Stage

Completed hosted migration parity and exact-SHA production deployment

## Next Recommended Role

PRODUCT

## Product Routing Update — 2026-08-18

Ivan superseded the provenance-mapping decision with a clean hosted Calendar boundary: retain only
workouts with durable FIT/ZIP evidence and their complete evidence/result graph; delete all other
Calendar workouts and source records that become unreferenced. The bounded cleanup is owned by
[Hito Hosted FIT-Retaining Calendar Cleanup And Release Continuation](./2026-08-18-hito-hosted-fit-retaining-calendar-cleanup-and-release-continuation.md).
It must stop before mutation if any retained FIT/ZIP-backed workout still belongs to an unclassified
legacy source kind, because that would require an explicit provenance decision rather than a hidden
rewrite.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Hosted Runner Core Migration Parity And Production Deploy
Stage: Hosted five-migration parity repair and current-main redeploy
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md
Release commit: 14ccfbfe8742d5d894e9629169a946d144a4d06f on origin/main

Ivan explicitly authorized this bounded hosted mutation and redeploy. Read AGENTS.md,
agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, the canonical item, and
the existing repository hosted-parity procedure. Do not reread product source or historical
receipts beyond those exact materials.

Preflight against the existing linked Hito Supabase and Vercel projects: confirm `origin/main` is
the exact release SHA and live migration history has no unknown versions and exactly this ordered
missing delta: 20260815195439, 20260815212107, 20260816004652, 20260816020328, 20260816171845. If
the target or delta differs, stop before mutation and report it.

Use only the repository-pinned normal hosted migration workflow. Dry-run and apply the five
committed migrations in order; do not use ad-hoc SQL, a database URL bypass, a migration rewrite,
or a broad reset. Verify hosted parity through the existing validator. Then redeploy only current
`main` through the existing Vercel project/Git integration, verify the deployment built that SHA
and passed the prebuild parity gate, and perform public HTTP reachability only.

Do not change source, migrations, generated types, config, secrets, domains, Vercel/Supabase
settings, user data, providers, local fixtures, Git history, or any unrelated hosted state. Update
only the canonical item with the exact before/after history, migration/deploy evidence, omitted
checks, and truthful terminal status. Return to PRODUCT; do not claim browser, Global QA, or
production-product acceptance.
```

## Blockers

None. Ivan's authorized full hosted runner training-data reset removed the final data blocker; the
remaining migrations, parity gate, and exact-SHA Vercel deployment completed successfully.

## Implementation Receipt — 2026-08-18

### Preflight

- **Repository identity:** branch `main`; local `HEAD` and freshly fetched `origin/main` both
  resolved to `14ccfbfe8742d5d894e9629169a946d144a4d06f`; the index was empty and no Git lock was
  present.
- **Writer/runtime boundary:** the concurrent ARCHITECT documentation-only task reached terminal
  idle before hosted mutation; all remaining Hito roles were idle, and port `3000` had no
  listener.
- **Supabase target:** the repository link and parity owner both resolved to production project
  `dltfjwexyctmihclcjqj`. The repository-pinned offline CLI invocation returned `2.109.1`.
- **Vercel target:** linked project `hito-runner`
  (`prj_2vQ43bjCsO7JEbH1Ggv93avrUcyL`) under the existing team matched the repository link. Its
  failed production deployment `dpl_GegiLePUAQbt9pqHKHgNwUD3Ncqw` was Git-backed from
  `ivan-nthng/hito-runner`, ref `main`, exact SHA
  `14ccfbfe8742d5d894e9629169a946d144a4d06f`.

### Exact Hosted Migration History

The ordered repository-known hosted prefix before mutation contained these 41 versions:

```text
20260506025058, 20260508104250, 20260511174500, 20260511193000,
20260512030043, 20260515093000, 20260518183000, 20260522153725,
20260525152557, 20260525222734, 20260526015820, 20260526020256,
20260528190000, 20260601110000, 20260611120000, 20260613161211,
20260716001500, 20260718030000, 20260718131305, 20260718142639,
20260719120000, 20260719144111, 20260720120000, 20260721130000,
20260723021338, 20260726121847, 20260727134559, 20260730170000,
20260802190244, 20260802223149, 20260803134149, 20260804204819,
20260804211346, 20260805174650, 20260806120000, 20260810022136,
20260810034530, 20260810114649, 20260810132840, 20260811125538,
20260813124903
```

- **Before:** exactly the 41-version prefix above. Missing, in order:
  `20260815195439`, `20260815212107`, `20260816004652`, `20260816020328`,
  `20260816171845`. Hosted-only/unknown versions: none.
- **After the stopped push:** exactly the same 41-version prefix followed by
  `20260815195439`, `20260815212107`. Missing, in order: `20260816004652`,
  `20260816020328`, `20260816171845`. Hosted-only/unknown versions: none.

### Execution And Validation

| Check                       | Scenario / environment                                                 | Result               | Evidence                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Release identity            | Fresh `origin/main`, local `main`, empty index                         | Passed               | All refs resolved to exact release SHA `14ccfbfe8742d5d894e9629169a946d144a4d06f`                           |
| Linked target identity      | Repository Supabase and Vercel links                                   | Passed               | Expected production Supabase ref and existing `hito-runner` Git-backed Vercel project                       |
| Pre-mutation hosted delta   | Pinned CLI migration history plus `npm run supabase:deployment:parity` | Passed discriminator | Exactly five missing versions in the authorized order; no unknown hosted version                            |
| Hosted dry-run              | Pinned Supabase CLI `2.109.1`, normal linked `db push --dry-run`       | Passed               | Proposed exactly the five committed migration files and nothing else                                        |
| Hosted apply                | Pinned Supabase CLI `2.109.1`, normal linked `db push`                 | Blocked safely       | First two versions applied; third stopped with SQLSTATE `P0001` because runner/date occupancy is not unique |
| Post-failure history        | Pinned linked migration list                                           | Passed observation   | 43 hosted versions; remaining exact three-version delta; no unknown hosted version                          |
| Repository parity validator | `npm run supabase:deployment:parity`                                   | Failed as expected   | Reports only `20260816004652`, `20260816020328`, and `20260816171845` as missing remote                     |
| Vercel redeploy             | Existing Git integration                                               | Not run              | Hosted parity is a required prebuild gate and remains red; no deployment mutation was attempted             |
| Public HTTP reachability    | New exact-SHA production deployment                                    | Not run              | No new deployment exists to probe; the prior production application is not evidence for this candidate      |

### Preserved Boundaries And Omitted Checks

No source, migration, generated type, script, fixture, dependency, configuration, secret, domain,
Vercel/Supabase setting, local database, provider, Git history, or user-data rewrite was performed.
No ad-hoc SQL, database-URL bypass, reset, retry loop, migration rewrite, rollback, or deployment was
attempted. The only repository write was this canonical receipt. The authorized hosted mutation is
limited to the two successfully applied committed migrations above.

Browser QA, Global QA, authenticated product flows, and production-product acceptance were not run
and cannot be inferred. Build/prebuild verification, exact-SHA deployment identity, and public HTTP
reachability remain unavailable until hosted migration parity is restored.

### Return

Return to PRODUCT. The smallest next step is a separately scoped and explicitly authorized decision
for reconciling the demonstrated duplicate hosted runner/date occupancy without weakening or
bypassing the migration invariant. A later deployment retry must begin with a fresh exact history
preflight, apply only the then-proven remaining delta, pass repository parity, and only then trigger
the existing Git-backed Vercel production deployment.

## Retry Receipt — Duplicate Repair Follow-On — 2026-08-18

- Ivan authorized deletion of only duplicate extra Calendar rows and immediate continuation of this
  release chain.
- The linked transaction deleted exactly `1,561` extra `planned_workouts` rows from `341` groups,
  retained one deterministic row per group, encountered no protected dependency, and proved zero
  duplicate groups after commit. Detailed privacy-safe evidence is retained in the child discovery
  item.
- A fresh pinned history read showed exactly three missing versions and no unknown hosted version.
  The pinned `2.109.1` dry-run proposed only `20260816004652`, `20260816020328`, and
  `20260816171845`.
- The normal linked push stopped before applying `20260816004652` because a remaining workout origin
  cannot be classified. Hosted history remains at 43 repository-known versions; the exact same
  three versions remain missing and `npm run supabase:deployment:parity` remains red.
- No additional migration applied. No Vercel deployment, build, prebuild parity result, exact-SHA
  deployment, or public HTTP reachability check exists for this retry.
- No source, migration, configuration, Git, provider, domain, setting, fixture, or local database
  change was made. No hosted rows outside the authorized duplicate Calendar extras were directly
  deleted or rewritten.

Return to PRODUCT for the exact provenance mapping decision covering the three source kinds recorded
above. Do not retry the migration or deploy until that separately authorized boundary is resolved.

## FIT-Retaining Cleanup Continuation Receipt — 2026-08-18

- The child cleanup transaction retained `1` raw Garmin ZIP-backed workout and its complete
  evidence/result/activity graph, deleted `380` non-protected workouts and `9` source records that
  became unreferenced, and left zero non-protected workouts, legacy-source references, or duplicate
  occupancy groups.
- Pinned Supabase CLI `2.109.1` re-established an exact missing delta of
  `20260816004652`, `20260816020328`, and `20260816171845`, with no hosted-only version. Its dry-run
  proposed only those three migrations in order.
- The normal linked push stopped before applying `20260816004652` with SQLSTATE `P0001`:
  `Standalone Calendar migration stopped: immutable source-plan linkage is incomplete.` The
  privacy-safe discriminator is one retained `ai_authored_plan_first_v1` workout with one invalid
  saved-record reference and one absent saved record.
- Post-failure hosted history is unchanged at `43` repository-known versions; the exact same three
  versions remain missing. Parity, Vercel deployment, prebuild evidence, and public HTTP
  reachability were not run because migration application did not complete.
- No protected data, source/migration/configuration/Git state, hosted setting, provider data, or
  unrelated hosted row was changed. Browser QA, Global QA, and production-product acceptance remain
  explicitly omitted.

Return to PRODUCT for one bounded provenance decision covering the retained workout's missing
immutable saved-plan linkage. Do not retry the migrations or deploy until that decision is
authorized and implemented without deleting or fabricating the protected evidence graph.

## Terminal Full-Reset And Deployment Receipt — 2026-08-18

- The superseding child reset deleted the final raw storage object and all remaining hosted runner
  training data: Calendar workouts `1`, source plans `13`, workout lifecycle/result rows `3`, and
  runner activity graph rows `14`. Every targeted family finished at zero. Auth identities,
  profiles/settings, and Admin aggregates were unchanged.
- Repository-pinned Supabase CLI `2.109.1` dry-ran and applied only `20260816004652`,
  `20260816020328`, and `20260816171845` in order. Hosted history now matches the repository at
  `46/46`; `npm run supabase:deployment:parity` returned `ok: true`. A final post-migration catalog
  check found zero rows across all `18` training-related public tables.
- Git-backed redeploy `dpl_GYLefTLQKdabEbYZ4F8PvuBeeMJ3` cloned `main` at exact SHA
  `14ccfbfe8742d5d894e9629169a946d144a4d06f`, passed its prebuild Supabase parity gate with `46`
  migrations, completed the build, reached `READY`, and received the production aliases.
- Public `https://www.hitocajon.com/` returned HTTP `200`. The immutable Vercel URL remains protected
  by Vercel authentication and was not treated as the public reachability surface.
- No migration/source/configuration/Git change or additional commit was retained. Browser Product
  QA, authenticated flows, Global QA, and production-product acceptance remain separate and were
  not claimed.

Return to PRODUCT for independent post-deploy acceptance and final release-chain reconciliation.
