# Hito Hosted Runner Training Data Full Reset And Release Unblock

Work Item ID: `2026-08-18-hito-hosted-runner-training-data-full-reset-and-release-unblock`
Status: completed
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: platform-and-operations
Parent: [Hito Hosted Runner Core Migration Parity And Production Deploy](./2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md)
Supersedes: [Hito FIT-Backed Optional Calendar Provenance Migration Repair](./2026-08-18-hito-fit-backed-optional-calendar-provenance-migration-repair.md)
Evidence From: [Hito Hosted FIT-Retaining Calendar Cleanup And Release Continuation](./2026-08-18-hito-hosted-fit-retaining-calendar-cleanup-and-release-continuation.md)

## Scope

Reset only hosted runner training data. Delete all Calendar workouts, their lifecycle/result/evidence
rows, raw FIT/ZIP storage objects, runner activities and derived activity records, and all historical
source-plan records. Retain Auth identities, runner profiles/settings, Admin configuration, domains,
secrets, provider configuration, source code, migrations, and Git history. Then apply the exact three
remaining Runner Core migrations and deploy already-pushed `main`.

## User Authorization

Ivan explicitly authorized this destructive hosted operation on 2026-08-18: delete all workouts and
all remaining runner training data. No FIT/evidence/result/activity data is retained. This replaces
the prior FIT-retention and provenance-repair scopes.

## Task

Use the repository-linked hosted Supabase procedure and the smallest ordered transaction/storage
cleanup necessary for referential integrity. Record only aggregate counts. Confirm all runner
training tables and relevant raw objects are empty afterwards, then apply only
`20260816004652`, `20260816020328`, and `20260816171845` through the pinned normal migration
flow. Verify parity and redeploy the existing pushed commit
`14ccfbfe8742d5d894e9629169a946d144a4d06f` through the existing Vercel project.

## What Not To Touch

Do not create or edit runtime source, migrations, scripts, helpers, configuration, secrets, domains,
Vercel/Supabase settings, identities, profiles/settings, Admin data, providers, or Git history. Do
not create a new source plan, reconstruct provenance, preserve FIT data, or run a hosted project
reset.

## Validation Expectations

- Record aggregate before/after counts for each deleted training-data family and raw storage.
- Prove Calendar workouts, source-plan records, result/evidence rows, activities, and raw FIT/ZIP
  objects are zero afterwards; profile/settings identities remain outside the deletion target.
- Apply only the exact three-recorded hosted migration delta, prove parity, then verify Vercel build
  SHA, prebuild parity, and public HTTP reachability.
- Return a compact English receipt with no private identifiers or payloads.

## Stage

Completed hosted runner training-data reset, migration parity, and current-main deployment

## Next Recommended Role

PRODUCT

## Blockers

None.

## Implementation Receipt — 2026-08-18

- **Target:** linked Supabase project `dltfjwexyctmihclcjqj`; repository `main` and the redeployed
  Git source both resolved to `14ccfbfe8742d5d894e9629169a946d144a4d06f`. The migration source
  remained byte-identical to `HEAD`, and the index remained empty.
- **Storage:** the Storage API deleted `1` raw FIT/ZIP object; no path or private identifier was
  exposed in the receipt.
- **Hosted transaction:** Calendar workouts `1 → 0`; source plans `13 → 0`; workout
  lifecycle/result rows `3 → 0`; runner activity and derived graph rows `14 → 0`; manual workout
  templates `0 → 0`. Protected aggregates were unchanged: Auth identities `4`, runner profiles
  `3`, and Admin capture rows `389`.
- **Migrations:** pinned Supabase CLI `2.109.1` dry-run proposed only `20260816004652`,
  `20260816020328`, and `20260816171845`; the linked push applied them in that order. The final
  linked history is `46/46`, and `npm run supabase:deployment:parity` returned `ok: true`.
  A post-migration catalog check covered `18` training-related public tables and found zero rows in
  every table.
- **Deployment:** Vercel deployment `dpl_GYLefTLQKdabEbYZ4F8PvuBeeMJ3` rebuilt the stored Git source
  from `main` at exact SHA `14ccfbfe8742d5d894e9629169a946d144a4d06f` and reached `READY`.
  Its prebuild parity gate returned `ok: true` with `46` migrations; the build and deployment
  completed successfully. Public `https://www.hitocajon.com/` returned HTTP `200`.
- **Boundaries:** no source, migration, script, helper, configuration, secret, domain, provider,
  profile/settings, Admin data, Git history, local fixture, or hosted project setting was changed.
  The superseded migration-repair hunk was fully removed before hosted work; no commit or push was
  required. Browser Product QA, authenticated flows, Global QA, and production-product acceptance
  were not run and cannot be inferred.

Return to PRODUCT for independent post-deploy acceptance and release-chain reconciliation.
