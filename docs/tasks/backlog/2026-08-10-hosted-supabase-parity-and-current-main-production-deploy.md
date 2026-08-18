# Hosted Supabase Parity and Current Main Production Deploy

- **Work Item ID:** `hosted-supabase-parity-and-current-main-production-deploy`
- **Status:** `blocked`
- **Type:** `hosted-release-repair`
- **Priority:** `urgent`
- **Owner:** `backend`
- **Epic:** platform-and-operations
- **Scope:** `the existing Hito hosted Supabase project and existing Vercel project, using the current GitHub origin/main commit only`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Hosted migration parity complete; next combined release awaits current UI batches and the stale schema-gate correction`
- **Next Recommended Role:** `product`

## Task

Repair the blocked production deployment without changing Product or Frontend behavior: reconcile
the existing hosted Supabase schema with the migration history in the current repository `origin/main`,
then deploy exactly that current Git revision through the existing Vercel project and prove the
deployment gate passed.

## User Authorization

Ivan explicitly authorized the required hosted Supabase migration application and the production
Vercel deployment on 2026-08-10. This authorization is limited to the existing Hito Supabase
project and Vercel project. It does not authorize source changes, migration rewrites, data deletion,
credential disclosure, domain changes, provider calls, or changes to unrelated Vercel settings.

## User Report

Ivan wants to try the current product in production. A Vercel deployment stopped before the app
compiled with:

```text
Hosted migration history is not at repository parity:
missingHosted=20260802190244,20260802223149,20260803134149, unknownHosted=none.
```

## Evidence

- The failed Vercel build cloned `github.com/ivan-nthng/hito-runner`, Branch `main`, at
  `329f45c27ff25928c4daad963f24f967e197200c` and failed in the intentional prebuild parity gate.
- At task creation, local `main` and `origin/main` both resolve to
  `23d657b` (`Prepare runner calendar for product review`). `329f45c` is an older ancestor, not the
  current production candidate.
- The current checkout contains the three named migrations and four later committed migrations:
  `20260804204819`, `20260804211346`, `20260805174650`, `20260806120000`, `20260810022136`,
  `20260810034530`, `20260810114649`, and `20260810132840`.
- [The canonical parity gate](/Users/ivan/Developer/hito-running/scripts/validate-supabase-deployment-parity.mjs)
  compares repository migration versions with the hosted migration-history RPC and verifies the
  server-visible schema in a real Vercel deployment. The locally linked existing project ref is
  `dltfjwexyctmihclcjqj`.
- The Vercel Node-version warning is advisory; it did not cause the failure.

## Observed Behavior

The intentionally safe build gate rejected a deployment whose hosted database did not contain the
activity-foundation migrations. The attempted deployment also used a stale Git commit, so applying
only the three migrations reported by that old build would not truthfully prepare the current
`origin/main` product for deployment.

## Expected Behavior

1. The existing hosted Supabase project has exactly the migration history required by the exact
   current `origin/main` revision selected for production.
2. The existing Vercel project builds and deploys that verified Git revision, not a dirty local
   checkout and not the historical `329f45c` deployment.
3. The deployed build's own parity gate and server-visible schema check pass. The result exposes a
   usable production URL for Ivan's manual Product review.

## Demonstrated Cause

The immediate build failure is demonstrated hosted schema drift: the deployment's parity gate
received no unknown hosted versions but found three repository migration versions absent from hosted
history. A separate demonstrated release-selection discrepancy exists: Vercel built the historical
`329f45c` while GitHub `origin/main` was `23d657b` at routing time. The execution owner must
enumerate hosted history against the exact target SHA before applying anything; the report does not
claim the initial three-version list is the complete current-main delta.

## Existing Seams To Reuse

- `supabase/migrations/` as the sole ordered schema history;
- `npm run supabase:deployment:parity` and
  `scripts/validate-supabase-deployment-parity.mjs` for the linked/history and API-visible checks;
- the existing linked Supabase project and existing Vercel project/Git integration.

## Execution Preflight

- **Target Git revision:** `23d657b3003433a2a051b505fd48645fce6692ca`. Remote
  `refs/heads/main`, local `origin/main`, and local `HEAD` resolve to the same commit.
- **Hosted target:** The linked project ref is `dltfjwexyctmihclcjqj`, matching the canonical
  parity gate and the authorized Hito project.
- **Machine-readable before state:** Hosted history already contains the three versions named by
  the stale `329f45c` build. Against the exact target revision, the ordered missing set is
  `20260810022136`, `20260810034530`, `20260810114649`, and `20260810132840`; no hosted-only
  version was reported.
- **Reuse-first budget:** Reuse `supabase/migrations/`, linked `supabase db push`,
  `npm run supabase:deployment:parity`, and the existing Vercel project/Git integration. New
  production runtime artifacts: **none**. No source, migration, dependency, environment, domain,
  or project-setting edit is proposed.
- **Bounded mutations:** Dry-run and then apply only the four ordered committed migrations through
  the normal linked migration workflow. Create a production deployment only from the existing Git
  integration for the exact target SHA; never upload the dirty checkout or bypass the parity gate.
- **Focused proof:** Record before/after hosted migration history, linked and deployment API-visible
  parity, exact deployment Git SHA and build status, and unauthenticated public HTTP reachability.
  Browser user-flow and Global QA acceptance remain outside this receipt.

## What Not To Touch

- Do not alter application source, Frontend, Design System, backend business logic, migration files,
  generated types, dependencies, lockfile, CI/build scripts, domains, environment variables, or
  provider settings merely to make the gate pass.
- Do not deploy the current dirty local checkout, upload a source snapshot, or bypass/relax the
  parity gate. Production must map to a Git revision resolved from `origin/main` at execution time.
- Do not run `db reset`, delete/rewrite hosted rows, rollback a migration, run arbitrary SQL, expose
  tokens/keys, call paid providers, or mutate a user profile/FIT/plan as deployment proof.
- Do not interrupt the active Frontend onboarding task or modify its dirty files.

## Validation Expectations

1. Record the exact current `origin/main` SHA and prove that the linked Supabase and Vercel projects
   are the existing Hito targets. Inspect the production-branch/Git-deployment selection that led to
   `329f45c`; if the existing project is configured to build an older revision, correct only that
   selection or deploy mechanism within the existing project.
2. Before mutation, obtain a machine-readable hosted migration inventory and compare it with the
   repository inventory for the exact target SHA. Apply only the resulting ordered, committed,
   missing migration set through the normal hosted Supabase migration workflow. No manual SQL.
3. Re-run linked migration parity after application. Verify the exact server-visible API schema
   contract using the existing checker; never report a local-only check as hosted proof.
4. Trigger or promote a production deployment that Vercel records against the verified current
   `origin/main` SHA. Do not reuse the stale deployment. Require its own prebuild parity check and
   build to pass. Record deployment URL and non-authenticated production HTTP reachability only;
   do not use or alter Ivan's account as a smoke test.
5. Preserve evidence in this item, including the before/after migration-version delta, target SHA,
   Vercel deployment SHA/URL, checks run, and every skipped check. If the target selection cannot
   be aligned without a Vercel setting outside the stated boundary, stop and name the exact Product
   decision required rather than deploying a different revision.

## Blocked Deployment Receipt

- **Recorded:** 2026-08-10
- **Implementation DoD:** Blocked after the authorized hosted migration application and exact-SHA
  production deployment attempt.
- **Exact target revision:** `23d657b3003433a2a051b505fd48645fce6692ca`. Remote `main`, local
  `origin/main`, and `HEAD` were identical immediately before deployment. The committed migration
  tree was unchanged in the dirty checkout.
- **Hosted target:** Linked project `dltfjwexyctmihclcjqj` matched the authorized canonical target.
- **Before migration delta:** Hosted already contained the three migrations named by the old
  `329f45c` build. Against the exact target, the missing set was `20260810022136`,
  `20260810034530`, `20260810114649`, and `20260810132840`, with no hosted-only versions.
- **Hosted mutation:** A normal linked `supabase db push` applied only those four ordered committed
  migrations. No ad-hoc SQL, seed, reset, rollback, row shaping, or data deletion was performed.
- **After migration state:** Linked machine-readable history and
  `npm run supabase:deployment:parity` passed at 39/39 versions.
- **Historical SHA discriminator:** The `329f45c` production artifact was an explicit Vercel
  `action=redeploy` of an older deployment. The project Git integration itself correctly selected
  `main` and the exact current `23d657b` commit.
- **Exact-SHA deployment:** Vercel deployment `dpl_961aydmauVu7kMiQGvfQHx29WmN5` cloned
  `github.com/ivan-nthng/hito-runner`, branch `main`, commit `23d657b`, from the Git integration. It
  failed before application compilation at the server-visible schema gate.
- **Blocking invariant:** The exact target migration `20260810132840` intentionally drops
  `apply_reviewed_plan_persistence_with_profile_revision` and replaces the reviewed materialization
  seam with `apply_reviewed_plan_persistence`. The same exact target's
  `scripts/validate-supabase-deployment-parity.mjs` still requires the dropped legacy RPC. Hosted
  OpenAPI therefore truthfully reported `columns=ok`, `migrationHistoryRpc=ok`, and `rpc=missing`.
  Passing the gate now requires a new committed source revision that reconciles the validator with
  the canonical current RPC, or a new product decision to retain the legacy RPC. Source/script
  changes, ad-hoc SQL, and gate bypass were outside this authorized deployment-only task.
- **Production reachability:** The previously READY production artifact remains publicly reachable
  with HTTP 200 through `https://www.hitocajon.com/` and `https://hito-runner.vercel.app/`. It is
  commit `5265cfb27476fa249c5d8df15eafa8d76b3c54ce`, not the target revision. Generated/team aliases
  redirect unauthenticated requests to Vercel SSO and are not public reachability evidence.
- **Preserved boundaries:** No application, migration, script, Frontend, dependency, lockfile,
  domain, environment, credential, provider, or project-setting change was made. The active
  Frontend task and unrelated dirty work were not touched.
- **Next action:** PRODUCT must route a bounded Backend source fix that removes the retired RPC from
  the deployment parity expectation (or explicitly decides to restore it), commit that correction,
  and then resume hosted deployment from the new exact `origin/main` revision.
- **Global QA:** Not run or claimed.

## Product Release Sequencing Decision — 2026-08-10

Ivan chose to wait for the current UI batches and ship the validator correction in one next release,
rather than create a standalone production hotfix. The hosted migration state remains at 39/39 parity;
no additional hosted mutation or deployment is pending until the combined source set is ready for
one intentional Git integration and production deployment. The retired RPC remains retired. The
required source correction is to make the parity validator expect the canonical replacement RPC,
not to restore legacy database behavior.
