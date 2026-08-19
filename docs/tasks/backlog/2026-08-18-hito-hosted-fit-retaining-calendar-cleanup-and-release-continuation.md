# Hito Hosted FIT-Retaining Calendar Cleanup And Release Continuation

Work Item ID: `2026-08-18-hito-hosted-fit-retaining-calendar-cleanup-and-release-continuation`
Status: blocked
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: platform-and-operations
Parent: [Hito Hosted Runner Core Migration Parity And Production Deploy](./2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md)
Evidence From: [Hito Hosted Calendar Duplicate Occupancy Reconciliation Discovery](./2026-08-18-hito-hosted-calendar-duplicate-occupancy-reconciliation-discovery.md)

## Scope

Clean hosted runner Calendar data so only workouts with durable raw FIT/ZIP evidence remain. Preserve
each retained workout's complete result, evidence, activity, metrics, comparison, and provenance
graph. Delete every other Calendar workout and only source records that become unreferenced after
that cleanup. Then resume the parent item's three exact remaining migrations and Vercel deployment
of committed `main`.

## Archive Intent

Retain the authorization, aggregate before/after counts, protected-row proof, migration parity, and
deployment result as the final hosted Runner Core release evidence.

## Task

Use the existing linked hosted Supabase procedure and one explicit transaction. First determine the
protected Calendar-workout set solely from durable raw FIT/ZIP evidence. Do not use completion,
metrics, or inferred activity as a substitute for a raw FIT/ZIP file. Delete only the non-protected
Calendar workouts and their exclusively dependent Calendar/result rows necessary for referential
integrity. Preserve all protected workout evidence/result/activity rows. Delete a source record only
when no retained workout references it; do not delete runner identities, settings, Admin data,
provider configuration, or unrelated activity history.

If any retained FIT/ZIP-backed workout belongs to `plan_preset_v1`,
`running_plan_engine_marathon_base_builder_v1`, or `structured_authoring_v1`, stop before mutation
and return only the aggregate count by kind: the current migration cannot honestly classify that
retained provenance without a separate Product decision. Otherwise prove the three legacy kinds
have no remaining workout references, resume `20260816004652`, `20260816020328`, and
`20260816171845` through the normal pinned migration flow, verify hosted parity, then redeploy the
already-pushed `main` commit and verify the build SHA and public HTTP reachability.

## User Authorization

Ivan explicitly authorized hosted deletion on 2026-08-18: retain only workouts with a FIT file and
delete everything else. This authorizes the bounded Calendar/source cleanup above, including
exclusively dependent non-FIT Calendar/result rows required for integrity. It does not authorize
deleting FIT/ZIP-backed workouts or their evidence graph, identities, settings, Admin data, source
code, migrations, secrets, configuration, provider data, Git history, domains, or Vercel settings.

## What Not To Touch

Do not classify a legacy source kind by guesswork, weaken migration guards, use ad-hoc SQL outside
the normal linked hosted procedure, reset the hosted project, expose private identifiers/payloads,
or modify repository source/migrations/configuration/Git state. Do not redeploy until parity passes.

## Validation Expectations

- Record only privacy-safe aggregates: protected FIT/ZIP workout count, deleted workout/source and
  dependent-row counts, and zero remaining legacy-source workout references.
- Prove retained FIT/ZIP workout identities and their evidence/result/activity graph are unchanged
  across the transaction without exposing raw identifiers or payloads.
- Verify the existing duplicate occupancy invariant remains zero before migration replay.
- Apply only the three recorded remaining migrations in order and run the repository parity validator.
- Redeploy only committed `main` SHA `14ccfbfe8742d5d894e9629169a946d144a4d06f`; record build SHA,
  prebuild-parity result, and public HTTP reachability. Browser Product QA and Global QA remain out
  of scope.

## Stage

Blocked after completed FIT-retaining cleanup and stopped first remaining migration

## Next Recommended Role

PRODUCT

## Blockers

The cleanup is complete, but `20260816004652` now stops at its immutable source-plan linkage guard.
The sole retained FIT/ZIP-backed workout uses accepted source kind `ai_authored_plan_first_v1`, but
its `saved_plan_record_id` is invalid and the referenced immutable saved-plan record is absent.
Repair would require a separately authorized provenance decision; the protected workout and its
evidence graph must not be deleted or rewritten by guesswork.

## Implementation Receipt — 2026-08-18

### Preflight And Cleanup

- Repository `main`, local `HEAD`, freshly fetched `origin/main`, and the deployment target all
  resolved to release SHA `14ccfbfe8742d5d894e9629169a946d144a4d06f`; the index was empty.
- The linked hosted target was Supabase project `dltfjwexyctmihclcjqj`; the repository-pinned
  offline CLI was `2.109.1`.
- The hard-stop discriminator found zero FIT/ZIP-protected workouts using `plan_preset_v1`,
  `running_plan_engine_marathon_base_builder_v1`, or `structured_authoring_v1`.
- Before mutation, privacy-safe aggregates were: `1` raw Garmin ZIP-protected workout, `380`
  non-protected workouts, `9` unreferenced source candidates, zero dependent rows on the deletion
  set, and zero duplicate occupancy groups.
- One explicit hosted transaction deleted exactly `380` non-protected workouts and `9` source
  records that were unreferenced after cleanup. It retained the protected workout and its complete
  direct graph: result assets `1`, actual metrics `1`, comparisons `1`, activity matches `1`, logs
  `0`, and AI insights `0`. Transaction assertions proved the protected graph signature unchanged.
- After commit: protected workouts `1`, non-protected workouts `0`, legacy-source workout
  references `0`, and duplicate occupancy groups `0`.

### Migration Continuation

| Check                 | Scenario / environment       | Result         | Evidence                                                                                                          |
| --------------------- | ---------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Hosted delta          | Pinned linked migration list | Passed         | Exactly `20260816004652`, `20260816020328`, `20260816171845`; no unknown hosted version                           |
| Dry-run               | Supabase CLI `2.109.1`       | Passed         | Proposed only the same three migrations in order                                                                  |
| First migration apply | Normal linked `db push`      | Blocked safely | SQLSTATE `P0001`: `immutable source-plan linkage is incomplete`                                                   |
| Failure discriminator | Privacy-safe aggregate       | Established    | One retained `ai_authored_plan_first_v1` workout; one invalid saved-record reference and one missing saved record |
| Post-failure history  | Pinned linked migration list | Passed         | No migration applied; the exact three-version delta remains                                                       |
| Hosted parity         | Repository validator         | Not run        | Migration application did not complete, so parity cannot pass                                                     |
| Vercel deploy / HTTP  | Existing Git-backed project  | Not run        | Hosted parity is still a required prebuild gate                                                                   |

### Preserved Boundaries And Return

No protected workout, raw file, result/activity graph, identity, profile, setting, Admin record,
provider/configuration data, source, migration, generated type, secret, domain, Git state, local
fixture, Supabase/Vercel setting, or unrelated hosted row was changed. No migration guard was
weakened or bypassed. Browser QA, Global QA, and production-product acceptance were omitted and
cannot be inferred.

Return to PRODUCT for the smallest explicit provenance decision for the one retained workout's
missing immutable saved-plan linkage. After that boundary is truthfully repaired, BACKEND can begin
a fresh retry of the same exact three-migration delta, parity gate, and current-main Vercel deploy.
