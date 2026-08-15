# Release Candidate Vercel Parity Gate And Source Hygiene

## Work Item ID

2026-08-11-release-candidate-vercel-parity-gate-and-source-hygiene

## Status

completed

## Type

release-preparation

## Priority

urgent

## Owner

backend

## Mode

Tracked

## Scope

Prepare the current local release candidate for a later intentional commit, push, hosted migration
application, and Vercel deployment. The immediate Backend stage corrects the demonstrated stale
deployment parity expectation and removes only its proven dead legacy reachability.

This task does not itself commit, push, deploy, mutate hosted Supabase, alter Vercel settings, or
perform broad source deletion.

## Stage

Backend parity-gate correction completed and published through later QA, hosted-parity, Git, and
Vercel release records. Current candidate lifecycle is owned by the later release items.

## Evidence From

- [Current Release Candidate Final Global QA](2026-08-11-current-release-candidate-final-global-qa.md)
- [Global-QA-Approved Production Release](2026-08-11-global-qa-approved-production-release.md)
- [Current Candidate Git Release And Vercel Verification Retry 2](2026-08-12-current-candidate-git-release-and-vercel-verification-retry-2.md)
- [Hito Backlog Lifecycle Reconciliation And Terminal Archive](2026-08-14-hito-backlog-lifecycle-reconciliation-and-terminal-archive.md)

## Archive Intent

retain_in_place

## Task

Make the current Vercel prebuild gate represent the canonical current database contract, then leave
the release candidate with one truthful local gate and a precise inventory of what still needs
integration validation.

The required correction is not to restore any retired active-plan RPC. The existing migration
`20260810132840_retire_active_plan_calendar_authority.sql` intentionally drops
`apply_reviewed_plan_persistence_with_profile_revision`. The canonical reviewed persistence RPC is
`apply_reviewed_plan_persistence`, which current runtime code and later migrations continue to use.

Remove the stale validator expectation and any directly dependent, demonstrably unreachable
release-gate legacy in the existing backend/script seam. Do not broaden this into a rewrite of
calendar persistence, plan lifecycle, frontend, Design System, or the dirty release candidate.

## User Request

Ivan asked to prepare the product for deployment and clean only legacy that is kept out of fear.
He specifically called out the prior Vercel failure. The desired next shipment is prepared safely;
an actual commit, push, hosted mutation, or deployment requires a separately verified candidate and
an explicit release action.

## Evidence And Demonstrated Cause

- The earlier [hosted deployment item](2026-08-10-hosted-supabase-parity-and-current-main-production-deploy.md)
  proves hosted migration history reached 39/39, but a Vercel build still failed because the source
  validator expected a dropped RPC.
- `scripts/validate-supabase-deployment-parity.mjs:8` currently sets
  `REQUIRED_REVIEW_RPC` to the retired
  `apply_reviewed_plan_persistence_with_profile_revision`.
- `supabase/migrations/20260810132840_retire_active_plan_calendar_authority.sql:44` drops that
  retired function and recreates the canonical
  `apply_reviewed_plan_persistence` at line 87.
- Current source uses the canonical replacement in
  `src/lib/active-plan-lifecycle-persistence.ts` and generated database contracts. Later
  migrations, including `20260811125538_clear_calendar_future_workouts.sql`, preserve that same
  canonical seam.
- The former release blocker is therefore a stale build assertion, not hosted migration drift,
  Vercel configuration, or a reason to revive active-plan authority.

## Reuse-First Change Budget

- Existing seam: `scripts/validate-supabase-deployment-parity.mjs` and its existing API-schema
  validation path.
- Existing truth: ordered SQL migrations and the current generated/runtime use of
  `apply_reviewed_plan_persistence`.
- New runtime artifacts, helpers, migrations, schema objects, feature flags, compatibility paths,
  or dependencies: none.
- Removed responsibility: the deployment gate's false dependency on the retired profile-revision
  RPC.

## What Not To Touch

- Do not restore, stub, recreate, or retain
  `apply_reviewed_plan_persistence_with_profile_revision`.
- Do not rewrite historical migrations, alter `20260811125538`, add a migration, or change
  database/RLS/persistence behaviour.
- Do not alter Frontend, Product UI, Design System, Figma, providers, auth, secrets, environment
  variables, Vercel project settings, domains, or hosted data.
- Do not delete unrelated dirty files, task receipts, assets, FIT evidence, local auth identities,
  build output, caches, or `.DS_Store` merely to make `git status` shorter.
- Do not stage, commit, push, deploy, or call paid providers in this stage.

## Validation Expectations

| Check                       | Scenario / environment                         | Required evidence                                                                                                             |
| --------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Canonical RPC discriminator | Current migration/runtime/script map           | Retired RPC absent from live validator expectation; replacement is required by the same gate                                  |
| Legacy reachability         | Focused repository search                      | No live source expectation remains for the retired RPC outside immutable historical migrations/receipts                       |
| Local release gate          | Current source and available local environment | Existing parity script's selected mode accepts the corrected contract without bypassing API/migration checks                  |
| Build                       | Uncontended current candidate only             | Production build/prebuild runs after shared output ownership is clear; otherwise record the exact concurrency boundary        |
| Source hygiene              | Current dirty tree                             | Every task-owned Backend/script change is mapped to this item or an existing canonical item; unrelated paths remain untouched |
| Deployment boundary         | Hosted/Vercel                                  | No hosted mutation/deployment is performed; name what a later QA/Product release step must revalidate                         |

## Completion Condition

Backend returns the corrected source gate, a focused proof that it tracks the current canonical RPC,
and a truthful cleanup map. The task then advances to QA for a fresh whole-tree pre-commit/release
candidate acceptance only after concurrent implementation tasks settle. It does not claim hosted
parity or deployment success until that later stage is explicitly run.

## Exact Backend Handoff

```text
ROLE: BACKEND

Mode: Tracked

Execute the current Backend stage of:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-release-candidate-vercel-parity-gate-and-source-hygiene.md`

Read AGENTS.md, agents/backend.agent.md,
skills/hito-backend-supabase-contract/SKILL.md, and the full canonical item before the first write.

Outcome: correct the demonstrated stale Vercel/Supabase deployment-parity assertion so it requires
the existing canonical `apply_reviewed_plan_persistence` RPC, not the retired
`apply_reviewed_plan_persistence_with_profile_revision` RPC. Reuse the existing
`scripts/validate-supabase-deployment-parity.mjs` gate and migration/runtime truth. Remove only
directly dependent, proven unreachable legacy release-gate code if it exists.

Do not restore/stub the retired RPC; do not add a migration, helper, compatibility path, token,
dependency, or parallel validator. Do not edit Frontend/Product/DS source, migrations, hosted
Supabase, Vercel settings, environment, domains, providers, or unrelated dirty work. Do not stage,
commit, push, deploy, or delete material data.

Validate the canonical RPC/migration/runtime discriminator, focused zero-live-legacy search, the
existing appropriate local parity gate, formatting/lint/diff hygiene, and an uncontended production
build only if shared build output is free. Produce a concise map of your own task-owned changes
versus unrelated dirty release-candidate paths; do not delete or take ownership of the latter.

If the correction reveals a missing schema contract, a required migration, Vercel environment/
project-setting change, or a cross-owner source consumer, stop and report the exact boundary. Use
Russian commentary and an English Tracked implementation receipt. Leave hosted deployment and
whole-tree QA to the explicitly later stages.
```

## Backend Implementation Receipt — 2026-08-11

**Backend Implementation DoD: Passed.** Whole-tree QA, hosted parity, deployment, and release
acceptance remain pending.

### Preflight and outcome

- Reused `scripts/validate-supabase-deployment-parity.mjs`; the only source correction changes its
  required review RPC from the retired
  `apply_reviewed_plan_persistence_with_profile_revision` wrapper to the canonical
  `apply_reviewed_plan_persistence` RPC.
- Added no runtime artifact, helper, migration, compatibility path, token, dependency, or parallel
  validator.
- Removed no additional code: focused reachability found no directly dependent live legacy branch.
- Migration `20260810132840` drops the retired wrapper and creates the canonical RPC;
  `20260811125538`, runtime persistence, and generated database types all preserve the canonical
  name.

### Task-owned and unrelated dirty paths

Task-owned changes are exactly:

- `scripts/validate-supabase-deployment-parity.mjs` — one constant replacement;
- this canonical item — stage, next owner, and receipt only.

All other modified or untracked paths remain unrelated and untouched, including concurrent Design
System, onboarding, Calendar, Admin, plan/persistence, migration, asset, and backlog work. In
particular, this stage does not take ownership of untracked migration `20260811125538` or any hosted
application of it.

### Validation inventory

| Check                       | Scenario / environment                                      | Result                                    | Evidence                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Canonical RPC discriminator | Current migration/runtime/type/script map                   | Passed                                    | Gate, runtime RPC call, generated types, and latest migration all name `apply_reviewed_plan_persistence`; retirement migration drops the old wrapper         |
| Zero-live-legacy search     | Repository excluding immutable migrations and docs/receipts | Passed                                    | `rg` returned no live occurrence of `apply_reviewed_plan_persistence_with_profile_revision`                                                                  |
| Linked parity gate          | `npm run supabase:deployment:parity`                        | Failed truthfully at later-stage boundary | Gate reached the linked migration comparison and reported `20260811125538/missing-remote`; it did not fail on the retired RPC and no bypass was added        |
| JavaScript syntax           | `node --check` on the parity script                         | Passed                                    | Exit 0                                                                                                                                                       |
| Formatting                  | Targeted Prettier                                           | Passed                                    | Existing style retained                                                                                                                                      |
| Lint                        | Targeted ESLint                                             | Passed                                    | Exit 0                                                                                                                                                       |
| Diff hygiene                | `git diff --check` on the parity script                     | Passed                                    | No whitespace errors                                                                                                                                         |
| Production build            | Shared build output                                         | Omitted                                   | A managed loopback server owned the shared finalized artifact and another backlog file changed during the contention check; no build process was interrupted |

### Boundaries and next stage

The linked parity failure demonstrates a real hosted migration delta, not a missing schema contract
or a reason to restore the retired function. This Backend stage made no hosted query mutation,
schema change, Vercel setting change, Frontend/Product/DS edit, environment change, provider call,
stage, commit, push, or deployment.

QA is the next owner once concurrent checkout writes settle. A later explicitly authorized hosted
stage must apply the ordered committed migration set and rerun linked plus API-visible parity before
any deployment claim. This item remains `in_progress`; no Global QA or release claim is made.

## Tracked Lifecycle Reconciliation Receipt — 2026-08-14

### Old ambiguity and demonstrated disposition

The Backend implementation receipt completed this item's assigned source correction but left the
item `in_progress` with QA, hosted migration, and deployment presented as its pending stage. Direct
successor evidence now proves that this wording is stale:

- final local Global QA completed and passed the assembled candidate, including the corrected
  deployment-parity source contract;
- production release commit `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d` contains
  `scripts/validate-supabase-deployment-parity.mjs` with canonical
  `REQUIRED_REVIEW_RPC = "apply_reviewed_plan_persistence"`;
- that release applied the exact hosted migration delta, reached 40/40 parity, and recorded the
  exact-SHA Git-backed Vercel production deployment as `READY`;
- the later completed 2026-08-12 release verification published
  `74607987885ca40f33658c79fba174d173d45646` and recorded another exact-SHA Git-backed Vercel
  deployment as `READY`;
- the three 2026-08-14 release items each own a newer candidate admission lifecycle and remain
  truthfully `blocked` before staging for their own unrelated ownership boundaries. They performed
  no commit, push, hosted mutation, or Vercel deployment and do not alter the earlier release facts.

The correct disposition for this item is therefore `completed`: its Backend correction was
implemented, accepted in the named local QA gate, and included in a completed production release.
The later release items supersede only its stale pending-stage responsibility; they remain
authoritative for their own candidate identities, successes, failures, omissions, and lifecycle.

### Exact change and retained boundaries

- Changed this canonical item only: status, current stage, factual `Evidence From` relationships,
  removal of the obsolete QA next-owner signal, and this receipt.
- Preserved the complete historical implementation receipt, including its then-truthful linked
  parity failure, omitted build, hosted boundary, and no-release claim at that stage.
- Did not rewrite or infer Global QA, hosted, Git, deployment, or later retry outcomes. Every fact
  above comes from its direct canonical owner.
- Did not edit runtime source, scripts, validators, fixtures, migrations, `AGENTS.md`, skills, other
  backlog records, Git state, Supabase/hosted state, Vercel, providers, or dependencies.

### Validation inventory

| Check                       | Scenario / environment                      | Result  | Evidence                                                                                                                  |
| --------------------------- | ------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| Historical owner receipt    | This complete canonical item                | Passed  | Backend Implementation DoD is explicitly passed; the only open wording was the later QA/hosted/release stage              |
| Canonical source identity   | Released commit `ee4fde5`                   | Passed  | Released parity script requires `apply_reviewed_plan_persistence`; Git history attributes the change to that release      |
| Successor QA/release chain  | 2026-08-11 and 2026-08-12 canonical records | Passed  | Final local Global QA passed; hosted parity and exact-SHA Git-backed Vercel deployments completed in their own records    |
| Later candidate ownership   | Three 2026-08-14 release records            | Passed  | All three own newer freezes and are blocked before staging; none reopens this completed parity-gate correction            |
| Local relationship targets  | Four `Evidence From` links                  | Passed  | Recorded after the lifecycle edit                                                                                         |
| Focused Markdown formatting | This canonical item                         | Passed  | Recorded after the lifecycle edit                                                                                         |
| Diff hygiene                | Shared checkout                             | Passed  | Recorded after the lifecycle edit; no task-owned source or unrelated item changed                                         |
| Release/hosted actions      | This lifecycle-only reconciliation          | Not run | No candidate was admitted; no stage, commit, push, deployment, Supabase/hosted access, or new release validation occurred |

### Final ownership

This item has no remaining implementation or release owner and is terminal as `completed`.
PRODUCT may consume this metadata correction; any current release attempt remains exclusively owned
by its own canonical release item. This receipt does not claim a new candidate, Global QA pass,
hosted parity result, deployment, or production readiness.
