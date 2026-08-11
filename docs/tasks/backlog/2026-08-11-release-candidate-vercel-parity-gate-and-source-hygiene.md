# Release Candidate Vercel Parity Gate And Source Hygiene

## Work Item ID

2026-08-11-release-candidate-vercel-parity-gate-and-source-hygiene

## Status

in_progress

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

Backend source correction complete. QA integration acceptance follows after the shared checkout
settles and the separately authorized hosted migration stage resolves the current parity delta.

## Next Recommended Role

QA

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
