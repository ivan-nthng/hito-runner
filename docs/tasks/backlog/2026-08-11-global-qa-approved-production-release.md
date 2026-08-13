# Global-QA-Approved Production Release

## Work Item ID

2026-08-11-global-qa-approved-production-release

## Status

completed

## Type

production-release

## Priority

urgent

## Owner

backend

## Mode

Tracked

## Scope

Publish the exact locally Global-QA-approved Hito release candidate to the existing GitHub `main`,
the linked hosted Supabase project, and the existing Vercel production project.

The user explicitly authorized staging, committing, pushing, applying the required hosted migration,
and production deployment on 2026-08-11. This authorization is limited to the final QA-frozen Hito
candidate and the existing linked production services.

## Stage

Production release completed: exact approved candidate committed and pushed, hosted migration
parity reached, exact-SHA Git-backed Vercel deployment READY, and unauthenticated production smoke
passed.

## Next Recommended Role

product

## Archive Intent

retain_in_place

## Task

Release the frozen candidate accepted by:
[Final Local Global QA](2026-08-11-current-release-candidate-final-global-qa.md).

The final QA passed the assembled candidate with 59 tracked-modified and 34 untracked candidate
paths, all mapped to canonical work items, with an empty Git index and `HEAD == origin/main` at
`23d657b3003433a2a051b505fd48645fce6692ca` before release writes. Treat that accepted path set as
the starting release scope; prove it has not changed unexpectedly before staging.

This release supersedes the earlier blocked deployment only after it uses a new post-QA Git SHA and
the canonical deployment parity expectation. It must not restore the retired RPC or bypass the
parity gate.

## Required Release Sequence

1. **Preflight:** record `git status --short`, index state, diff/checksum summary, `origin/main`,
   local `HEAD`, linked Supabase project identity, and Vercel project identity. Confirm every
   staged candidate path is either in the final QA inventory or is this release receipt. Stop if
   runtime source changed after final QA without a new acceptance decision.
2. **Final local gate:** run `git diff --check`; reuse the final Global QA evidence. Re-run only
   a narrow check needed to prove a release-preflight discrepancy; do not start a new local refactor.
3. **Git:** create one intentional commit directly on `main` containing the complete approved
   candidate, with no blanket inclusion of foreign/unmapped files. Push that exact commit to
   `origin/main`. Do not create a branch or PR: this user-authorized release follows the existing
   production Git integration.
4. **Hosted database:** use normal linked Supabase migration history and `supabase db push --linked`
   only after discovering the exact current missing migration set. Apply only committed, ordered,
   missing migrations. The expected new delta includes `20260811125538`, but do not assume that;
   prove it. Never use raw SQL, reset, rollback, row shaping, or destructive data operations.
5. **Parity:** re-run the existing linked hosted parity command and the application parity gate.
   The Vercel server-visible check must expect the current canonical reviewed-plan RPC, not the
   retired `apply_reviewed_plan_persistence_with_profile_revision` wrapper.
6. **Vercel:** trigger/allow the existing Git integration to build the exact pushed SHA and inspect
   it to `READY`. Do not upload the dirty checkout or use an unrelated prebuilt artifact. Record
   the deployment ID, URL, target, Git SHA, and build outcome.
7. **Production smoke:** verify unauthenticated public HTTP reachability only and scan deployment
   errors using the least invasive available Vercel path. Do not log in as Ivan, create user data,
   invoke providers, or mutate production records.

## Current Evidence And Constraints

- Local Global QA is passed, including Backend 20/20, runtime 17/17, canonical fixture
  55/30/11/19, Product/DS contracts, build integrity, browser desktop/375px, and retained FIT
  preservation. Local acceptance does not prove hosted release.
- Hosted history previously reached 39/39 for the earlier committed tree. The current candidate
  contains `supabase/migrations/20260811125538_clear_calendar_future_workouts.sql`, which must be
  reconciled through the linked migration workflow before Vercel can build.
- `scripts/validate-supabase-deployment-parity.mjs` was corrected to require the canonical
  `apply_reviewed_plan_persistence` seam. Do not restore the retired wrapper as a deployment fix.
- Previous Vercel `READY` production artifact is old and must not be described as this release.

## What Not To Touch

- No source repair, migration rewrite, schema workaround, manual SQL, hosted reset/rollback, data
  deletion, profile/FIT/plan mutation, provider call, environment/domain/project-setting change,
  dependency change, or new build/deploy path.
- Do not alter the approved candidate while staging. If candidate validation fails, stop and return
  the first incorrect owner rather than amending code in the release task.
- Do not use a branch, PR, dirty-checkout upload, force push, or a stale Vercel deployment.
- Never expose credentials/tokens in output or artifacts.

## Definition Of Done

1. One exact commit on `main` contains the accepted candidate and is pushed to `origin/main`.
2. Hosted Supabase migration history is at repository parity for that exact SHA, with only the
   discovered ordered set applied through normal linked migrations.
3. Vercel records a `READY` production deployment built from that exact SHA; its parity/build gates
   pass.
4. Unauthenticated production reachability and deployment error scan are recorded.
5. The receipt clearly separates local QA, hosted migration parity, deployment proof, and omitted
   authenticated/paid-provider checks.

## Exact Backend Handoff

```text
ROLE: BACKEND

Mode: Tracked production release
Task: Publish the exact Global-QA-approved Hito candidate to the existing GitHub main, linked
Supabase project, and existing Vercel production project.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-global-qa-approved-production-release.md`

Read `AGENTS.md`, `agents/backend.agent.md`, the complete canonical item,
`skills/hito-backend-supabase-contract/SKILL.md`, the installed Supabase procedure, and the Vercel
deployment procedure before any external mutation. Read the final QA receipt and the prior parity
release records named in the item.

The user explicitly authorized this release: verify the final-QA candidate scope, stage and create
one intentional commit directly on `main`, push it to `origin/main`, apply only the exact linked
hosted migration delta, and produce a Git-backed Vercel production deployment for that pushed SHA.
No branch/PR, dirty-local upload, raw SQL, source repair, migration rewrite, hosted reset, rollback,
data shaping/deletion, provider call, configuration/domain/env change, or release workaround is
allowed.

Do not assume migration versions or deployment SHA. Discover and record them before each mutation.
Keep the future-only Calendar contract and the canonical reviewed-plan parity RPC intact; do not
restore legacy compatibility code to make a gate pass. Stop on any source drift from the accepted
candidate or failed gate and report the exact blocker without fixing forward.

After deploy, perform only unauthenticated production HTTP reachability and deployment-error scan.
Do not log in as the user or create production data. Use Russian in-progress commentary and append
an English production-release receipt with exact commit, migration delta, deployment ID/URL/status,
checks, omitted coverage, and honest readiness claims. Do not claim authenticated production or
provider acceptance without testing it.
```

## Execution Preflight — 2026-08-11

- **Mode / owner:** Tracked production release / Backend.
- **Accepted candidate:** Local `main`, `HEAD`, local `origin/main`, and remote `main` resolve to
  `23d657b3003433a2a051b505fd48645fce6692ca`; the Git index is empty. The 59 tracked paths exactly
  match the restarted Global QA inventory and retain its direct diff digest
  `541163cd31c01a62361936b5ba5209609e285609f2de6aab287df26e9b121e47`. The 33 untracked
  non-receipt files retain the QA digest
  `59ae8f2fa21f89229051cd90550138b199685deaf07a11a199950969d60a7967`. The QA receipt and this
  release item are the only additional candidate records.
- **Existing seams reused:** One intentional commit and push on the existing `main` branch;
  `supabase/migrations/` plus linked `supabase db push`; the existing
  `npm run supabase:deployment:parity` gate; and the existing Vercel Git integration.
- **Targets:** Linked Supabase project `dltfjwexyctmihclcjqj`; Vercel project `hito-runner`
  (`prj_2vQ43bjCsO7JEbH1Ggv93avrUcyL`). Hosted history currently has 39 matching versions and
  exactly repository migration `20260811125538` missing.
- **Change budget:** No new runtime artifact, helper, migration, RPC, compatibility path,
  dependency, configuration, domain, environment, or deployment mechanism. No approved source is
  repaired or simplified in the release stage.
- **Release sequence:** Stage only the accepted path set plus this receipt; create and verify one
  commit; push that exact SHA; rediscover and dry-run the linked migration delta; apply only the
  ordered missing migration; rerun linked/API-visible parity; require a Git-backed Vercel production
  deployment for the pushed SHA; then perform unauthenticated reachability and deployment-error
  inspection only.
- **Stop boundary:** Stop without fix-forward on candidate drift, a failed local gate, an unexpected
  hosted-only or missing migration, a linked-project mismatch, a Vercel Git SHA mismatch, or a
  failed parity/build/deployment gate.

## Production Release Receipt — 2026-08-11

### Task and result

- **Task:** Publish the exact Global-QA-approved Hito candidate through the existing GitHub `main`,
  linked Supabase project, and existing Vercel production project.
- **Result:** Completed.
- **Released commit:** `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d` with parent
  `23d657b3003433a2a051b505fd48645fce6692ca` and tree
  `6e678bc9af9bf2ccf7eb27fbd581dd9888ddeaa8`.
- **Git state:** Local `main`, local `origin/main`, and remote `refs/heads/main` all resolved to the
  released commit immediately after the push.
- **Hosted target:** Existing linked Supabase project `dltfjwexyctmihclcjqj`.
- **Production target:** Existing Vercel project `hito-runner`
  (`prj_2vQ43bjCsO7JEbH1Ggv93avrUcyL`).

### Candidate and mutation receipt

The staged release contained exactly 94 paths: the 59 tracked-modified and 34 untracked paths in
the restarted Global QA inventory, plus this release item. Before staging, the accepted tracked
diff digest remained
`541163cd31c01a62361936b5ba5209609e285609f2de6aab287df26e9b121e47`; the 33 untracked
non-receipt files retained digest
`59ae8f2fa21f89229051cd90550138b199685deaf07a11a199950969d60a7967`. The index was empty before
the explicit path-by-path staging step, and no foreign path remained unstaged or untracked when the
commit was created.

The pre-push hosted inventory had 39 matched migrations, exactly
`20260811125538_clear_calendar_future_workouts.sql` missing, and no hosted-only migration. A linked
dry-run proposed only that migration. The normal linked `supabase db push` applied only that file;
no seed, role file, raw SQL, reset, rollback, row shaping, data deletion, or function invocation was
used. Post-application history is 40/40 with no missing or unknown version.

The automatic Git deployment started before the required hosted migration step completed and
failed at prebuild with only `missingHosted=20260811125538`. Its ID was
`dpl_9sYK6Qp3chdDpRzNd37qqKM1TC1D`; logs proved it cloned `main@ee4fde5` and stopped before the
application build. After linked 40/40 parity passed, the same Git-backed deployment was rebuilt in
the existing production target without cache, source upload, configuration change, or alternate
deployment path.

The successful deployment is `dpl_Ak4V7GgdS2LNz7giARBkZv5c9RZX` at
`https://hito-runner-lig3dmyzf-ivans-projects-133d4a2e.vercel.app`. Vercel API metadata reports
`githubCommitSha=ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d`, `githubCommitRef=main`, target
`production`, and state `READY`. Its prebuild gate reported 40 migrations and canonical RPC
`apply_reviewed_plan_persistence`; client, SSR, Nitro, and postbuild completed before production
aliasing.

### Validation inventory

| Check                           | Scenario / environment                                   | Result                             | Evidence                                                                                                                         |
| ------------------------------- | -------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Candidate freeze                | Local dirty `main` versus restarted Global QA inventory  | Passed                             | Exact 59 tracked and 34 QA untracked paths; accepted tracked and non-receipt digests matched; only this release record was added |
| Local release gate              | Pre-staging checkout                                     | Passed                             | `git diff --check`; canonical RPC search; empty index; `HEAD == origin/main == remote main` at QA base                           |
| Intentional commit              | Local `main`                                             | Passed                             | One 94-path commit `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d`; expected parent and tree; no branch or PR                         |
| Git publication                 | GitHub `origin/main`                                     | Passed                             | Push advanced `23d657b` to `ee4fde5`; local, tracking, and remote refs matched the full SHA                                      |
| Hosted delta discovery          | Linked Supabase before mutation                          | Passed                             | 39 matched; missing only `20260811125538`; unknown hosted versions none; dry-run named only that committed migration             |
| Hosted migration                | Linked Supabase `dltfjwexyctmihclcjqj`                   | Passed                             | Normal linked push applied only `20260811125538`; no seeds, roles, raw SQL, reset, rollback, or data shaping                     |
| Hosted parity                   | Linked history and canonical parity gate                 | Passed                             | 40/40, no missing/unknown; `npm run supabase:deployment:parity` returned `ok: true`                                              |
| Early Git auto-deploy           | Vercel production before hosted push completed           | Failed as recorded sequencing race | `dpl_9sYK6Qp3chdDpRzNd37qqKM1TC1D` cloned exact SHA and failed only on missing `20260811125538` before build                     |
| Exact-SHA production deployment | Existing Vercel project/Git artifact after hosted parity | Passed                             | `dpl_Ak4V7GgdS2LNz7giARBkZv5c9RZX`, exact full Git SHA, `main`, `production`, `READY`                                            |
| Deployment parity/build         | Vercel build logs                                        | Passed                             | Server-visible gate reported canonical RPC and 40 migrations; client, SSR, Nitro, postbuild, and deployment completed            |
| Public reachability             | Unauthenticated GET                                      | Passed                             | `https://www.hitocajon.com/` and `https://hito-runner.vercel.app/` both returned HTTP 200 HTML without redirect                  |
| Deployment error scan           | Successful deployment, previous 30 minutes               | Passed                             | Deployment-scoped error-level and HTTP 5xx runtime queries returned no entries                                                   |

### Preserved boundaries and omitted coverage

- No source repair, migration rewrite, compatibility RPC, dependency, lockfile, provider,
  environment, domain, project-setting, hosted reset/rollback, user-row shaping, destructive data
  operation, branch, PR, dirty-local upload, force push, or release workaround was used.
- The future-only Calendar persistence contract and canonical reviewed-plan RPC remain intact. The
  migration installed the approved function/schema definition; the release did not invoke the
  destructive Calendar action.
- No authenticated production login, user workflow, provider/OpenAI call, production record
  creation, FIT upload, or paid-provider acceptance was executed. Those behaviors are not claimed
  by this release receipt.
- No post-deploy browser matrix or Global QA rerun was performed. This receipt combines the prior
  frozen local Global QA pass with hosted migration, deployment, public reachability, and
  deployment-error evidence only.
- Dependency advisories were not inspected or changed; dependency risk is outside this release.

### Lifecycle and ownership

- **Release state:** Completed.
- **Global QA:** The pre-release frozen local candidate passed Global QA; no new Global QA claim is
  inferred from deployment.
- **Next owner:** Product may perform an ordinary authenticated production review. That review was
  not performed by Backend.
- **Role file:** `agents/backend.agent.md`.
- **Skills used:** `skills/hito-backend-supabase-contract/SKILL.md`, the mandatory installed
  Supabase procedure, and the Vercel Deployments & CI/CD procedure.
- **Subagents used:** None.
- **Receipt publication boundary:** The exact deployment ID and final hosted/deployment outcome did
  not exist until after the single authorized release commit was pushed. This completed receipt is
  therefore the sole local post-release change; no prohibited second commit, amend, or force push
  was created.
