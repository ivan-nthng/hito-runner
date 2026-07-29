# Hito Source-Size Governance And Cleanup Plan

## Work Item ID

2026-06-30-hito-source-size-governance-and-cleanup-plan

## Status

backlog

## Type

plan

## Priority

high

## Owner

architect

## Scope

docs-source-of-truth

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Next Recommended Role

architect

## Task

Hold further source cleanup until one current owner-scoped batch has exact reachability evidence.

## Stage

Ranks 1-4 are complete. Further cleanup remains evidence-gated until a new owner-scoped candidate
has exact reachability evidence and independent review.

## Exact Handoff Prompt

None while evidence-gated hold remains active.

## Initial Audit Baseline - 2026-07-25

### Root Cause

The repository is large for several different reasons. Most large runtime modules still own live
product contracts. Rank 1 removed the demonstrated stale deterministic doctrine tail. The initial
artifact candidate was held because the old retention tool did not preserve one evidence package
and one truthful owner from dry-run through a future archive apply. Rank 2 has since corrected that
boundary; the current exact selection decision appears below. Small zero-consumer exports remain
lower-value candidates.

Line count remains a signal only. Cleanup requires consumer evidence, one canonical owner, one risk
class, and a focused validation story.

### Read-Only Source Ledger

The audit did not run `npm run metrics:lines`, so it did not append the canonical line-count ledger.
These counts come from current files and Git objects with maintained text extensions:

| Area | `HEAD` | Current tracked | Untracked maintained work | Classification |
| --- | ---: | ---: | ---: | --- |
| `src` | 294 files / 103,271 lines | 296 / 104,951 | 6 / 181 | Live product plus active preview/DevTools work |
| `scripts` | 65 / 32,519 | 67 / 34,304 | 2 / 469 | Validators, provider proof, Admin parser proof |
| `docs` | 223 / 46,522 | 224 / 46,981 | 9 / 2,330 | Current truth plus normalized intended work items |
| `agents` + `skills` | 21 / 4,221 | 21 / 4,223 | 0 | Canonical execution policy |
| `supabase` | 25 / 3,399 | 25 / 3,399 | 0 | Accepted migration history |

Git state at audit time:

- 137 tracked changed paths;
- 5 staged paths, all in the active long-run policy/proof slice;
- 17 untracked files: 6 frontend source files, 2 Admin parser/proof files, and 9 intended Markdown
  work items;
- unstaged diff: `+4,386 / -2,720`; staged diff: `+1,300 / -0`.

These mixed changes belong to accepted or active owner slices and are not cleanup-safe merely
because they are dirty or additive.

### Canonical Owners Retained

- `training.ts` remains a central readback/formatting contract with 79 static consumers.
- Generated-plan provider, compiler, review, confirm, persistence, frozen fixture, and long-run
  proof seams remain live or active pending work.
- `training-api.ts` remains the route-facing TanStack server-function facade with live route and
  component consumers.
- Import/export, active-plan lifecycle, manual authoring, workout evidence, Admin capture, Hito DS,
  and Local Inspector owners remain reachable.
- Manual Add/Clear/Move/Edit persistence shapes are similar but enforce different lifecycle safety;
  they are not a merge candidate without new behavioral evidence.
- The generated preview controller, dialog, loading state, transition helper, and preference
  readback have current onboarding and replacement consumers.
- Large Hito DS reference and Figma files are current internal reference surfaces, not dead product
  runtime.

## Rank 1 And Rank 2 Closeout / Rank 3 Selection - 2026-07-25

### Accepted Rank 1

Running Coach reconciled the bounded deterministic doctrine cluster into compact historical records
and refreshed the current digest. The 12 touched Running Coach files changed by `+709 / -3,496`,
for a net reduction of 2,787 tracked Markdown lines. The compressed records preserve stable paths
and historical decisions while current AI-authored plan-first truth remains in the digest and
current product/system docs.

The concurrently edited watch-execution/long-run doctrine remains separate current work and was not
rewritten by this closeout. Its source-truth wording must be judged with that owner slice rather than
silently folded into the completed historical compression.

### Accepted Rank 2

Artifact-hygiene tooling now treats whole QA evidence packages as the retention unit, derives owner
signals from evidence-relative identity, excludes generated/vendor and every unsafe or uncertain
class, emits a stable owner-filtered selection identity, and requires that exact identity at a
future apply boundary. Deterministic nested-package, false-owner, reference, and drift-refusal
proofs passed without moving evidence.

The former deepest-leaf and broad shared-path-token selection is obsolete and is not authorized for
any archive operation.

### Current Artifact Evidence

Two consecutive non-mutating commands on the current workspace produced the same exact DevTools
selection:

`npm run artifact:hygiene -- --qa-folder-manifest --qa-owner devtools`

The all-owner manifest scanned 629 source/docs files for references:

| Retention class | Folders | Files | Size | Decision |
| --- | ---: | ---: | ---: | --- |
| `delete-after-expiry` | 83 | 778 | 247.9 MB | Owner-scoped selection only |
| `compress-after-policy` | 8 | 60 | 2.07 MB | Retain; no archive authorization |
| `keep-until-plan-archive` | 14 | 267 | 120.1 MB | Retain |
| `promote-to-docs-digest` | 80 | 1,683 | 521.3 MB | Retain |
| `unknown/manual-review` | 317 | 8,895 | 1.86 GB | Retain |
| **Total** | **502** | **11,683** | **2.73 GB** | No mutation in this decision |

### Exact Rank 3 Selection

- Owner: `devtools`.
- Selection ID:
  `6085700a84d3bde4c88b4284782a5e52ebf162a39a2b1571d1ce481dd3d1938b`.
- Retention class: `delete-after-expiry`.
- Retention unit: `whole_evidence_package`.
- Restore boundary: whole package to the exact original `qa-artifacts/` path; partial restore is
  prohibited.
- Selected: 13 packages, 104 files, 76,108,680 bytes (72.6 MB).
- Every selected package has zero direct references, zero symlinks, one `devtools` owner signal,
  unique path/content identity, and no active-plan, sensitive, failed/blocked, unknown, ambiguous,
  generated/vendor, unscoped, or manual-keep flag.

Exact selected path components use the fixed local evidence root `qa-artifacts/screenshots` plus the
following date and package identity. They are deliberately stored as components: a literal active
plan reference to a full evidence path would correctly protect that package and invalidate this
selection.

| Date | Package identity |
| --- | --- |
| `2026-07-07` | `local-devtool-menu-toggle` |
| `2026-07-07` | `local-inspector-spacing-controls` |
| `2026-07-09` | `local-inspector-card-chrome-controls` |
| `2026-07-09` | `local-inspector-copy-fallback-rerun-qa` |
| `2026-07-09` | `local-inspector-ds-audit-tool` |
| `2026-07-09` | `local-inspector-header-bug-panel` |
| `2026-07-09` | `local-inspector-property-row-cleanup` |
| `2026-07-09` | `local-inspector-property-row-cleanup-qa` |
| `2026-07-09` | `local-inspector-read-current-first` |
| `2026-07-09` | `local-inspector-read-current-first-qa` |
| `2026-07-09` | `local-inspector-sidebar-selection` |
| `2026-07-09` | `local-inspector-typography-action-row` |
| `2026-07-09` | `local-inspector-value-tag-trigger-polish` |

The owner-filtered review retained 41 other DevTools packages: 19 sensitive, 13 directly
referenced, four too recent, three active-plan-linked, and two failed/blocked. Those exclusions are
not part of this authorization. Tracked evidence roots and all other owners remain untouched.

The previous independent QA review covered the same owner, package count, bytes, selection ID,
package-atomic boundary, reference protection, and drift refusal. A fresh reviewer process was not
available in this Architect runtime; the unchanged selection identity plus the repeated current
dry-run and deterministic source checks are the explicit evidence limitation. Backend must still
run the required independent pre/post-apply QA subagent before claiming its implementation DoD.

### Rank 3 Execution Closeout - 2026-07-26

Backend recomputed the approved selection immediately before apply and matched owner `devtools`,
selection ID `6085700a84d3bde4c88b4284782a5e52ebf162a39a2b1571d1ce481dd3d1938b`,
13 packages, 104 files, and 76,108,680 bytes. Fresh independent QA had confirmed the same safe
pre-apply boundary without mutation.

The canonical archive-only command moved the complete selection to the local archive root identified
by timestamp `20260726031038`. The archive manifest and apply result preserve exact original paths,
content identities, counts, bytes, `permanentDeletion: false`, and the whole-package-only restore
contract. All 13 archived package identities matched after apply; all original package paths were
absent; a fresh owner manifest retained the other 41 DevTools packages and selected zero additional
packages.

A complete package was restored to its exact original path, verified against its recorded content
identity, and returned intact to the same archive root. The final intended archive state was
preserved. Tracked evidence roots, product/runtime source, other owners, Supabase, provider behavior,
build output, staging, and commits were untouched.

## Prioritized Cleanup Roadmap

| Rank | Batch | Owner | Evidence and expected value | Risk / validation |
| ---: | --- | --- | --- | --- |
| 1 | Running-coach doctrine reconciliation and compression | Running Coach | **Completed:** 12 files, `+709 / -3,496`, net `-2,787` lines; compact historical records and current digest retained. | Accepted documentation-only evidence. |
| 2 | QA artifact manifest ownership and evidence-unit safety | Backend/DevTools | **Completed:** package-atomic selection, evidence-relative ownership, unsafe-class exclusion, exact selection identity, and drift refusal accepted. | Deterministic false-owner/nested-root proof, real non-mutating manifest, and independent QA passed. |
| 3 | Owner-scoped QA artifact quarantine | Backend | **Completed:** exact `devtools` selection `6085700a...d1938b`; 13 packages / 104 files / 72.6 MB archived without deletion. | Fresh selection, manifest/content readback, retained boundary, independent QA, and whole-package restore roundtrip passed. |
| 4 | Backend zero-consumer export-surface pruning | Backend | **Completed bounded slice:** removed the unconsumed `capabilityLockedResponse` adapter, its dedicated response type, and type import; 25 source lines deleted with no replacement. | Two independent pre-change reviews, TypeScript reachability, targeted lint/validator, production build/integrity, and generated-runtime proof passed. |
| 5 | Frontend zero-consumer residue and selector cleanup | Frontend Product / Design System as separate lanes | `IntervalsViz.tsx` and `use-mobile.tsx` have zero source consumers; a few DS specimen exports and duplicate CSS selectors are also unconsumed or repeated. | Keep lanes separate; targeted lint/build and browser smoke only for touched visible owners. |
| 6 | DevTools helper consolidation | Frontend DevTools | Inspector target/evidence helpers repeat normalization and DOM-inspection utilities, but the same area has active accepted work. | Defer until the current Inspector slice is reconciled; local-only source proof and focused browser non-interference. |
| 7 | Generated-plan validator/proof consolidation | Backend/DevTools | Validator files are large, but current long-run/provider changes are staged or dirty and remain acceptance proof. | Re-audit after that slice lands; do not remove proof while contract work is concurrent. |

No later rank is implementation-ready automatically. Architect must re-check reachability and
concurrent source state before selecting the next bounded cleanup batch.

## Rank 4 Execution Closeout - 2026-07-26

Two independent read-only reviews identified one clean entitlement candidate: the historical
`capabilityLockedResponse` response adapter, its dedicated `CapabilityLockedResponse` type, and the
type-only import. TypeScript and repository reachability found no consumer, serialization boundary,
barrel export, or public package entrypoint.

Backend deleted only those three reviewed elements, reducing the entitlement source by 25 lines
without adding a replacement. `CapabilityCheckResult`, `checkRunnerCapability`, locked-capability
behavior, and the dynamic Garmin consumer remain unchanged. Targeted lint, the workout-evidence
validator, production build, build integrity, TypeScript reachability, generated-runtime scans, and
scoped diff hygiene passed.

No other Backend candidate was accepted by this slice. Further source cleanup returns to an
evidence-gated hold and requires a fresh exact owner-scoped candidate plus independent review.

## Rejected False Positives

- File size alone for `ManualWorkoutConstructorEditor.tsx`, `training.ts`, generated-plan modules,
  Admin routes, DS references, and workout evidence modules.
- `delete-clear.ts`, `move-workout.ts`, and `edit-workout.ts` exact-shape overlap: previous source
  audit proved operation-specific lifecycle safety.
- `AuthEntryScreen` and admin login presentation similarity: Product and Admin use different auth
  owners and session semantics.
- `qa-artifacts/` as disposable wholesale: it is protected evidence. Only manifest-classified,
  owner-scoped folders may enter a later archive/quarantine batch.
- Untracked source as deletion evidence: current untracked source is imported by active frontend or
  Admin parser work and must be reconciled by its owner, not removed by cleanup.

## Completed Durable Reductions

Prior accepted cleanup removed or consolidated:

- the unreachable 27-file `Доктор Дре/` portable agent kit;
- voice-to-plan and deterministic generated-plan product builders;
- the signed-out `training-plan.json` preview fixture;
- `/test-calendar`;
- obsolete selected-plan discovery state and Delete active plan capability;
- generated-plan validator and proof hotspots;
- repeated manual-workout proof/runtime helpers;
- oversized active-plan and source-of-truth Markdown;
- stale Quick setup goal-intent handoff.

Detailed execution transcripts remain available in Git history rather than this active plan.

## Governance And Stop Conditions

- Prefer deletion, reuse, and source-truth consolidation over extraction.
- Do not select a batch whose only result is a file below a threshold.
- One implementation batch has one primary owner, one root cause, one risk class, and one validation
  story.
- Active dirty work is retained unless reachability proves it obsolete.
- Runtime deletion requires no live consumer plus validator/build proof.
- QA evidence cleanup requires policy classification, owner scope, archive/restore safety, and no
  tracked-evidence mutation.
- Stop for Product when cleanup changes runner-visible behavior, coaching policy, data/history
  retention, schema/migration policy, provider semantics, or paid-provider policy.
