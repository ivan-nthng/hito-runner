# Pre-Commit Local Integration Acceptance

- **Work Item ID:** `pre-commit-local-integration-acceptance`
- **Status:** `completed`
- **Type:** `integration-qa`
- **Priority:** `high`
- **Owner:** `qa`
- **Scope:** `current uncommitted Hito integration set before one authorized main commit and push`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Pre-Commit Local Integration Acceptance: Passed`
- **Next Recommended Role:** `product`

## Task

Independently determine whether the current uncommitted Hito working tree is a coherent local
integration set that can be staged as one commit. This is a pre-commit gate, not a new feature
implementation, hosted acceptance, deployment, or release certification.

## User Report

The user asked to prepare the service for one commit and push, remove only proven legacy paths, and
avoid retaining obsolete code out of fear. They explicitly authorized the eventual commit and push,
but only after the current integration set is clean and truthfully validated.

## Evidence

- The current checkout and `origin/main` share the same pre-integration commit. Git object integrity
  and current diff whitespace checks pass.
- The current tree includes accepted Calendar/Plans independence, timezone, saved-plan library, FIT
  presentation, authenticated Product typography, slider, Inspector, and active-plan retirement
  work. Their owner receipts record local validation; this gate checks that their aggregate still
  integrates.
- [Cross-stack cleanup audit](2026-08-08-cross-stack-deletion-and-reuse-audit.md) now records the
  completed Rank 4 deletion of the legacy Calendar `Button/buttonVariants/buttonVariant` path.
- Earlier local Product-review receipts remain evidence for their unchanged browser flows. This task
  does not claim that all of those flows were rerun.

## Observed Behavior

The repository contains one large, intentional, uncommitted integration set. Individual owner
checks are green, but no final local integration verdict currently authorizes staging the complete
set together.

## Expected Behavior

One bounded QA receipt establishes either:

1. the current checkout has a coherent, locally validated integration set ready for Product to
   stage, commit, and push; or
2. the exact failed check and first incorrect owner are recorded before Git integration.

## Required Discriminator

The discriminator is a clean current-checkout replay, not file age or line count: validate the
assembled source, migration-aware local database contract, build artifact, and reachable imports
from the exact post-cleanup tree. A passing older owner receipt is not a substitute for this gate.

## What Not To Touch

- Do not implement or edit Product, Backend, Frontend, Design System, migrations, fixtures,
  dependencies, lockfiles, agent rules, or task scope.
- Do not delete historical migrations, task receipts, raw FIT evidence, or existing local acceptance
  identities. Do not run a reset that could remove retained FIT evidence.
- Do not access hosted data, call providers, deploy, stage, commit, push, or change branches.
- Do not create a temporary test framework, broad browser matrix, synthetic replacement feature, or
  extra cleanup candidate. The range-mode browser matrix is an explicit non-blocking coverage gap:
  no current Product specimen exercises it.

## Validation Expectations

Use the smallest integration inventory that can falsify a broken combined checkout:

1. Verify Git base/remote parity, intended tracked/untracked inventory, `git diff --check`, and Git
   object integrity. Flag an unexpected runtime artifact rather than deleting it.
2. Run the current canonical local database Backend suite, existing Product contract validator,
   Design System contract validator, and a fresh production build with output-integrity proof.
   Preserve existing retained FIT evidence; use only safe disposable test identities if a validator
   needs local rows.
3. Confirm current runtime import/reachability for the deleted active-plan and legacy Button API
   surfaces. A focused loopback runtime smoke is required only if the current build/validators do
   not already exercise the resulting artifact; do not manufacture a broad browser rerun.
4. Reconcile the passed result with the individual local QA receipts and state their inherited
   browser coverage versus what this gate actually reran.

If a required check fails, mark this item `blocked`, state the exact reproduction and first
incorrect owner, and do not repair it. If all required checks pass, mark it `completed` with
`Pre-Commit Local Integration Acceptance: Passed`, identify Product as next owner for the already
authorized Git integration, and make no hosted/release claim.

## Exact Handoff Prompt

```text
ROLE: QA

Mode: Tracked
Validation layer: Independent pre-commit local integration acceptance for the current uncommitted
Hito checkout. This is not hosted, deployment, release, or a new Global QA claim.

Read AGENTS.md, agents/qa.agent.md, this canonical item, and only the directly relevant current
validation skills before work:
/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-10-pre-commit-local-integration-acceptance.md

Task: Determine whether the complete current working tree is coherent and ready for Product to
stage as one already-authorized main commit and push. Do not implement or repair anything.

Use the smallest truthful gate:
1. Check current Git base/origin parity, intended tracked/untracked inventory, diff hygiene, and
   Git object integrity. Flag unexpected runtime artifacts; do not delete them.
2. Run the existing canonical local Backend database suite, Product-contract validator, Design
   System validator, and a fresh production build with output-integrity proof. Do not reset or
   mutate the retained FIT acceptance identity/raw asset; use safe disposable local data only when
   a canonical validator requires it.
3. Confirm reachable source/import retirement for the active-plan authority and
   Button/buttonVariants/buttonVariant compatibility paths. Use a focused loopback smoke only if
   the assembled build/validators leave an actual import/runtime ambiguity. Do not create a broad
   browser matrix or temporary harness.
4. Separate current checks from inherited local browser evidence in the accepted Calendar/Plans,
   authenticated typography/FIT, and DS receipts.

Boundaries: no source/schema/migration/fixture/dependency edits; no hosted data/provider calls;
no stage/commit/push/deploy; no deletion of historical migrations, receipts, or retained FIT
evidence; do not ask Ivan to approve a browser or local command. A platform permission dialog means
that path is abandoned, not escalated.

If every required check passes, update this item in English as `completed` with
`Pre-Commit Local Integration Acceptance: Passed` and Product as next owner. If one fails, leave it
`blocked` with the exact reproduction and first incorrect owner. Keep commentary in Russian and the
formal receipt/table in English. Do not claim Global QA, hosted, deployment, or release readiness.
```

## Pre-Commit Local Integration Acceptance Receipt — 2026-08-10

- **Role:** QA
- **Role file:** `agents/qa.agent.md`
- **Skills used:** `skills/hito-backend-supabase-contract/SKILL.md`,
  `skills/hito-architecture-audit/SKILL.md`, and the installed Supabase safety skill
- **Validation layer:** Independent pre-commit local integration acceptance for the complete
  current uncommitted checkout; not Global QA, hosted, deployment, release, or production
  acceptance
- **Subagents:** None. The required Git, validator, build, and reachability evidence formed one
  bounded QA workstream.
- **Files changed by QA:** This canonical lifecycle and receipt only. No Product, Backend, Design
  System, schema, migration, fixture, dependency, retained FIT, or Git lifecycle state was edited.

### Execution preflight

QA bounded this gate to the current `main` working tree, loopback Supabase, canonical disposable
validator identities, existing validators, the externalized production build owner, and read-only
reachability inspection. The retained `fit-product-acceptance@local.test` identity and raw source
were guarded before and after database validation. No runtime/browser smoke was admitted unless the
assembled build and source/import checks left a concrete ambiguity. No hosted state, provider,
stage, commit, push, deployment, cleanup, or dependency action was authorized or used.

### Validation inventory

| Check                            | Scenario / environment                                                         | Result           | Evidence                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Branch and remote parity         | Local `main`, local tracking ref, read-only remote ref                         | Passed           | `HEAD`, `origin/main`, and remote `refs/heads/main` all resolved to `5265cfb27476fa249c5d8df15eafa8d76b3c54ce`; ahead/behind was `0/0`.                                                                                                                                                                                                                      |
| Index boundary                   | Current checkout                                                               | Passed           | The index was empty. No file was staged, committed, pushed, or switched.                                                                                                                                                                                                                                                                                     |
| Working-tree inventory           | Exact porcelain and untracked expansion                                        | Passed           | 161 status entries: 116 modified, 16 deleted, and 29 collapsed untracked entries. `git ls-files --others --exclude-standard` expanded those to 31 files: 19 backlog receipts, 3 retained evidence assets, 5 source/validator additions, and 4 migrations. The inventory matches the accepted integration slices named by this item.                          |
| Diff and object hygiene          | Complete tracked diff and Git object database                                  | Passed           | `git diff --check` returned clean; `git fsck --full --no-dangling` returned clean; no cached diff exists. The tracked aggregate is 132 files, 5,917 insertions, and 16,155 deletions.                                                                                                                                                                        |
| Runtime-artifact inventory       | Ignored and stageable paths                                                    | Passed with note | No generated build/runtime file is stageable. `.tanstack`, `.vercel`, `node_modules`, `qa-artifacts`, and the preserved local artifact archive remain ignored. Two ignored `.DS_Store` files under `docs/plans` were flagged and deliberately not deleted; they cannot enter the authorized commit through normal staging.                                   |
| Retained FIT guard               | Local Supabase `http://127.0.0.1:54321`, before/after current validators       | Passed           | The retained source stayed `available`, revision 1, 80,050 bytes, with the same SHA-256 `bb2737da162532126808613d6ae7a69655b5175be0964a3311f60d89c2bc58d6`; the asset remained parsed and +25/-33 m, 5.11 km, and 45.16 min remained unchanged.                                                                                                              |
| Canonical Backend local DB suite | `npm run validate:backend:local-db`                                            | Passed           | Source plus local database suite passed 19/19, including Calendar authority retirement, auth, saved-plan persistence/RLS, manual mutations, runner activity, 3,000-activity scale, and calendar context. Disposable cleanup converged and the provider fixture reported `providerCalls: 0`. Runtime and release groups were explicitly outside this command. |
| Product contracts                | `npm run validate-product-contracts`                                           | Passed           | Heart-rate guidance editor proof and Workout comparison readback contract both passed.                                                                                                                                                                                                                                                                       |
| Design System contracts          | `npm run validate-hito-ds-components`                                          | Passed           | Contract validation passed across 320 scanned files, including Button retirement and slider/foundation/reference boundaries.                                                                                                                                                                                                                                 |
| Active-plan authority retirement | Canonical validator plus current source/import/file search                     | Passed           | The deleted lifecycle, transition, replacement, schedule-reflow, and exclusive Frontend modules remain absent. No retired import/export/call appears in `src`; the compiled artifact contains no deleted module chunk/path. The Backend suite reported `activeAuthorityCount: 0`.                                                                            |
| Remaining `active` vocabulary    | Current source and disposable validators                                       | Passed           | Remaining runtime `status === "active"` reads are Admin analytics of historical data, not Calendar authority. The generated database type retains the historical enum, while disposable validators create/read active rows only to prove migration to zero authority.                                                                                        |
| Button compatibility retirement  | Current source, DS validator, and compiled artifact                            | Passed           | `ui/button.tsx` exports only `HitoButton`; no runtime `Button`, `buttonVariants`, or `buttonVariant` definition/import/caller remains. Calendar uses `HitoButton` and `hitoButtonClasses`; the date-time input no longer forwards the compatibility prop.                                                                                                    |
| Production build                 | Closed current client, SSR, Nitro, and postbuild graph                         | Passed           | `npm run build` completed from the final documented tree. Existing chunk-size and dependency-directive warnings remained non-fatal.                                                                                                                                                                                                                          |
| Output integrity                 | `node scripts/validate-build-output-integrity.mjs` after the closed-tree build | Passed           | Local output contained 209 MJS files, 3,051 relative MJS imports, 247 repository documents, and a verified repository snapshot digest.                                                                                                                                                                                                                       |
| Focused runtime discriminator    | Build/import result review                                                     | Not required     | No unresolved source/import/runtime ambiguity remained after the 19/19 suite, DS validator, production build, and exact source/artifact searches; therefore no loopback server or browser smoke was added.                                                                                                                                                   |
| Final preservation               | Post-validator Git and retained-data checks                                    | Passed           | Stageable status counts were unchanged, the index stayed empty, diff hygiene stayed clean, and the retained FIT raw source remained byte-identical.                                                                                                                                                                                                          |

### Inherited local browser evidence

- `2026-08-10-runner-calendar-and-saved-plans-global-qa.md` remains the accepted bounded local
  Calendar/Plans Global QA receipt, including desktop/375px, Start/replace/decline, Copy/Paste,
  saved Rest, private download, timezone, and factual preview correction. None of those browser
  flows was rerun here.
- `2026-08-10-authenticated-product-typography-and-fit-local-qa.md` remains the accepted bounded
  local typography/FIT Global QA receipt. This gate reran the Product contract and retained-data
  guard, not its Calendar, Workout/Feedback, Progress, Settings, onboarding, modal, theme, or
  viewport browser matrix.
- Current Design System receipts remain inherited browser evidence for slider baseline restore,
  Calendar/date-picker hover and focus, Button compatibility retirement, theme, and 375px
  containment. This gate reran the aggregate DS validator and build only. The documented absence of
  a real rendered `mode="range"` specimen remains a coverage gap and is not upgraded by this pass.

### Issues and coverage gaps

- No integration defect was found in the required current-checkout gate.
- No broad browser matrix or loopback runtime smoke was run because the assembled graph left no
  concrete import/runtime ambiguity. Browser behavior is inherited only from the named accepted
  receipts above.
- Repo-wide `tsc --noEmit` was not run and is not claimed. Earlier DS evidence records unrelated
  dirty-tree TypeScript baseline failures; the current production compiler and required validators
  are the integration gate used here.
- Hosted Supabase, provider dispatch, deployment, release parity, staging, commit, push, and
  production checks were not run. This receipt authorizes only Product's already-approved local Git
  integration sequence.
- Two ignored `.DS_Store` files were observed under `docs/plans`. They are not part of the stageable
  inventory and were preserved per the no-deletion boundary.

### Verdict

**Verdict: Passed**

**Pre-Commit Local Integration Acceptance: Passed.** The complete current working tree is coherent
for Product to stage as the one already-authorized main commit and push. Product remains responsible
for reviewing the exact stage set and performing the authorized Git actions. No Global QA, hosted,
deployment, production, or release readiness is claimed.
