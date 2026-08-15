# Hito Hosted UI Locale Migration Parity Reconciliation — 2026-08-15

## Work Item ID

2026-08-15-hito-hosted-ui-locale-migration-parity-reconciliation

## Status

completed

## Type

hosted Supabase migration parity

## Priority

high

## Owner

BACKEND

## Mode

Tracked

## Parent

[Current Candidate Git Release And Vercel Verification — Retry 6](./2026-08-15-current-candidate-git-release-and-vercel-verification-retry-6.md)

## Scope

Apply exactly the committed, additive `20260813124903_runner_ui_locale_preference.sql` migration
to the linked hosted Supabase project `dltfjwexyctmihclcjqj`, prove remote migration parity, and
record the truthful hosted result. A later fresh release freeze remains separate.

## Archive Intent

retain_in_place

## Task

Release retry 6 passed every local source, staging, build, and integrity gate before hosted parity
proved the linked database is one migration behind the committed schema. Reconcile that exact hosted
schema gap through the repository's existing Supabase migration path; do not alter the migration or
work around the parity gate.

## User Report

Ivan explicitly directs BACKEND to complete the demonstrated blocker rather than wait for manual
Git actions. This authorizes applying the exact named committed migration to the named linked
Supabase project only; no other hosted mutation is in scope.

## Evidence

- [Retry 6](./2026-08-15-current-candidate-git-release-and-vercel-verification-retry-6.md)
  observed `20260813124903/missing-remote` for linked project `dltfjwexyctmihclcjqj` after every
  preceding release gate passed.
- `supabase/migrations/20260813124903_runner_ui_locale_preference.sql` is a committed additive
  migration: it adds non-null `runner_profiles.ui_locale_preference`, its constrained three-value
  domain, and a column comment.
- [UI Locale Profile Preference And Server Resolution](./2026-08-13-hito-ui-locale-profile-preference-and-server-resolution.md)
  records local migration, constraint/RLS, generated-type, resolver, and settings-round-trip proof.

## Observed Behavior

The local candidate expects the locale-preference column and generated types, while hosted parity
reports the migration version as absent. Releasing code before schema parity would risk a runtime
contract mismatch.

## Expected Behavior

The linked project's migration history includes exactly `20260813124903`, and the remote schema
matches the committed migration chain. No other migration, data, RLS, configuration, or hosted
object changes.

## Required Discriminator

Before mutation, prove the linked project identity and the exact pending migration list. Stop if
any migration other than `20260813124903` is pending, the project identity differs, the migration
is already recorded, or the repository migration bytes differ from the admitted chain.

## What Not To Touch

- Do not edit migration files, local source, generated types, validators, RLS policies, auth,
  application data, hosted configuration, storage, providers, or any migration other than the exact
  pending one.
- Do not use direct SQL outside the repository migration procedure, mark a migration as applied
  without applying it, reset/repair history, seed data, or alter the linked project.
- Do not stage, commit, push, deploy, run Vercel, or claim release readiness. A new release freeze
  is a separate Product-dispatched step.

## Validation Expectations

- Pre-mutation linked-project and pending-migration identity proof.
- Apply only the exact migration through the existing Supabase procedure.
- Fresh remote migration-list or parity proof showing the version applied and no unexpected
  migration movement.
- Relevant focused locale validator/schema/type parity where the existing procedure supports it,
  plus Prettier and `git diff --check` for the canonical receipt.

## Stage

Completed — the exact authorized migration is applied and linked hosted parity is green.

## Next Recommended Role

PRODUCT

## Product Dispatch — 2026-08-15

```text
ROLE: BACKEND

Mode: Tracked hosted Supabase migration parity reconciliation
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-15-hito-hosted-ui-locale-migration-parity-reconciliation.md
Release evidence: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-15-current-candidate-git-release-and-vercel-verification-retry-6.md

Ivan explicitly authorizes applying exactly the committed migration 20260813124903_runner_ui_locale_preference.sql to linked Supabase project dltfjwexyctmihclcjqj, solely to resolve the demonstrated hosted-parity blocker. No other hosted mutation is authorized.

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, the complete canonical item, Retry 6, and the completed UI Locale Profile Preference receipt before any hosted action.

First prove the linked project identity and inspect the pending migration set. Continue only if 20260813124903 is the exact missing migration and no other migration is pending or divergent. Apply it only through the repository's existing Supabase migration procedure; do not use direct SQL or repair migration history. Then obtain fresh hosted migration parity evidence proving the exact version is applied and no unexpected migration moved.

Validate proportionally using existing locale/schema/type checks where applicable. Preserve all local source and dirty hunks. Update only this canonical item with an English tracked receipt, including project identity, pre/post migration state, exact external mutation, parity result, omitted checks, and the fresh-release handoff. Do not stage, commit, push, deploy, alter any other hosted object/data/configuration, or claim release readiness. No subagent is required.
```

## Blockers

None. Hosted migration parity is restored. A completely fresh release freeze remains a separate
PRODUCT-dispatched task.

## BACKEND Execution Preflight — 2026-08-15

- **Mode / owner / serialization:** Tracked hosted Supabase parity reconciliation owned by
  BACKEND. BACKEND is the only active Hito execution role, the local subagent tree contains no
  reviewer, and no subagent is required.
- **Demonstrated cause:** Retry 6's canonical linked parity gate reported exactly
  `20260813124903/missing-remote` for project `dltfjwexyctmihclcjqj`. This task must independently
  reproduce that exact one-version delta before mutation.
- **Existing seams reused:** pinned Supabase CLI `2.109.1`, the repository's linked project file,
  canonical `migration list --linked`, normal `db push --linked`, and the existing
  `supabase:deployment:parity` validator.
- **New artifacts:** none. The committed migration is reused byte-for-byte. No source, migration,
  generated type, helper, direct SQL, history repair, compatibility path, configuration, or local
  fixture is proposed.
- **Authorized mutation:** apply only committed migration
  `20260813124903_runner_ui_locale_preference.sql` to linked project
  `dltfjwexyctmihclcjqj`, and only when a fresh migration-list discriminator proves it is the sole
  pending version with no divergence.
- **Preservation baseline:** the checkout index is empty. The preflight working tree contains 140
  dirty/untracked paths with path digest
  `e5b157a94fe316a541bed9313addbdf45d0274b7f3c0771154fc72d5c19ac00f` and path/content digest
  `53f30187ac74cc84d130b9347a03b3ef8bda8881f3bd7100e064946790b9aeb6` before this receipt write.
- **Focused proof:** linked identity, migration bytes, pre-mutation migration list, current CLI
  plan/dry-run when supported, exact linked push, post-mutation migration list, canonical linked
  parity, focused locale/schema/type validation, and receipt formatting/diff hygiene.
- **Stop boundary:** a different project, zero or multiple pending versions, divergence, an
  unexpected CLI plan, or unrelated checkout movement stops before hosted mutation. No staging,
  commit, push, deployment, Vercel action, provider call, or other hosted mutation is authorized.

## BACKEND Tracked Hosted-Parity Receipt — 2026-08-15

### Outcome And Exact External Mutation

The linked hosted Supabase project `dltfjwexyctmihclcjqj` now has repository migration parity.
BACKEND applied exactly one migration through the repository's normal pinned CLI procedure:

`npx --yes supabase@2.109.1 db push --linked --yes`

The CLI plan and execution both named only
`20260813124903_runner_ui_locale_preference.sql`. No direct SQL, migration-history repair, seed,
role import, reset, rollback, or second hosted mutation was used.

The migration file remains untracked relative to the old Git `HEAD`, but its SHA-256
`65c1844f64d085c13fc91100a71be83d6d54522e3fd223f2956b1bcc9e2495df` exactly matches the frozen,
fully admitted and staged Retry 6 candidate. No migration or source byte was changed here.

### Pre/Post Migration State

| State           | Linked project         | Migration history                                                                                                |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Before mutation | `dltfjwexyctmihclcjqj` | 40 local/remote matches plus exactly one local-only row: `20260813124903`; no other pending or divergent version |
| Dry run         | `dltfjwexyctmihclcjqj` | `Would push` listed only `20260813124903_runner_ui_locale_preference.sql`                                        |
| Applied         | `dltfjwexyctmihclcjqj` | CLI reported `Applying migration 20260813124903_runner_ui_locale_preference.sql` and completed successfully      |
| After mutation  | `dltfjwexyctmihclcjqj` | 41 local/remote matches; `20260813124903` present on both sides; zero pending or divergent versions              |

### Validation Inventory

| Check                                | Scenario / environment                                                                                                                             | Result | Evidence / consequence                                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Required reads and Tracked preflight | Hito policy, BACKEND role, project Backend/Supabase skill, installed Supabase skill/procedure, this item, Retry 6, and completed UI Locale receipt | Passed | Completed before the hosted mutation. No subagent was used.                                                                                                                                            |
| Checkout preservation baseline       | Dirty shared checkout before task write                                                                                                            | Passed | Empty index; 140 paths frozen at path digest `e5b157a94fe316a541bed9313addbdf45d0274b7f3c0771154fc72d5c19ac00f` and content digest `53f30187ac74cc84d130b9347a03b3ef8bda8881f3bd7100e064946790b9aeb6`. |
| CLI procedure discovery              | Pinned Supabase CLI `2.109.1` help                                                                                                                 | Passed | `migration list --linked`, `db push --linked --dry-run`, and `db push --linked` are supported canonical commands.                                                                                      |
| Linked identity                      | `supabase/.temp/project-ref` and canonical parity owner                                                                                            | Passed | Both resolve to `dltfjwexyctmihclcjqj`.                                                                                                                                                                |
| Migration identity                   | Exact candidate SQL path and bytes                                                                                                                 | Passed | SHA-256 matches Retry 6's admitted migration; SQL is the additive locale column/default/check/comment contract.                                                                                        |
| Pre-mutation migration list          | Machine-readable linked list                                                                                                                       | Passed | 40 matched versions plus only `20260813124903/missing-remote`; no other pending/divergent migration.                                                                                                   |
| Mutation dry run                     | Pinned `db push --linked --dry-run`                                                                                                                | Passed | Planned exactly one file: `20260813124903_runner_ui_locale_preference.sql`.                                                                                                                            |
| Exact hosted mutation                | Pinned `db push --linked --yes`                                                                                                                    | Passed | Applied exactly migration `20260813124903`; no seed or roles flags were used.                                                                                                                          |
| Post-mutation migration list         | Fresh machine-readable linked list                                                                                                                 | Passed | 41/41 local/remote equality; no unexpected migration movement.                                                                                                                                         |
| Canonical hosted parity              | `npm run supabase:deployment:parity`                                                                                                               | Passed | `{ ok: true, projectRef: "dltfjwexyctmihclcjqj", migrations: { count: 41 } }`.                                                                                                                         |
| Hosted generated contract            | Read-only `supabase gen types --linked --schema public` streamed to source search                                                                  | Passed | `runner_profiles.ui_locale_preference` is present in Row, Insert, and Update output; no generated file was written.                                                                                    |
| Focused locale contract              | `node --import tsx ./scripts/validate-ui-locale-profile.ts`                                                                                        | Passed | Existing locale resolver, migration, source ownership, and generated-type assertions passed.                                                                                                           |
| Local source/index preservation      | Full pre/post checkout comparison excluding this receipt                                                                                           | Passed | All 139 unrelated records remained byte-identical; this receipt is the only changed path and the index remains empty.                                                                                  |
| Receipt formatting/diff hygiene      | Focused Prettier, local links, and `git diff --check`                                                                                              | Passed | Canonical item formatting, both local evidence links, and checkout whitespace hygiene passed after the terminal receipt update.                                                                        |

### Preserved Boundaries And Omitted Coverage

- No local source, migration, generated type, fixture, dependency, lockfile, Git index, hosted
  configuration, auth policy, storage object, provider, Vercel project, or deployment was changed.
- No manual hosted row shaping or authenticated Product request was performed. The exact migration
  necessarily adds the declared non-null defaulted column to existing profile rows; there was no
  separate data operation.
- Full Backend, build, browser, Global QA, Vercel, commit, push, and release checks were not rerun.
  Their omission is intentional: this item proves only the exact hosted migration/parity slice and
  does not create release readiness.
- The CLI reported an existing deprecated `[inbucket]` configuration warning and availability of a
  newer CLI version. Both are out of scope; no configuration or dependency state was changed.

### Fresh-Release Handoff

Hosted migration parity is complete. PRODUCT is the next owner to dispatch a new release freeze
from current bytes. Retry 6 remains historical blocked evidence and must not be resumed with its old
snapshots or admission map. This receipt does not claim Global QA, deployment, release readiness,
or production acceptance.
