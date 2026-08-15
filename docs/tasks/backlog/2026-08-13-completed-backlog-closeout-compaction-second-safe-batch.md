# Completed Backlog Closeout Compaction — Second Safe Batch

## Work Item ID

2026-08-13-completed-backlog-closeout-compaction-second-safe-batch

## Status

completed

## Type

Tracked — documentation and architecture hygiene

## Priority

high

## Owner

ARCHITECT

## Mode

Tracked

## Scope

Run a second evidence-safe in-place compaction batch over dirty terminal records in
`docs/tasks/backlog/`. Preserve identity, lifecycle, accepted decisions, canonical source/evidence,
actual validation level, and residual owner boundaries while removing repeated prompts,
intermediate narration, duplicate matrices, and terminal transcripts.

Runtime source, scripts, migrations, agents, skills, policy, state documents, Git lifecycle, and
unrelated dirty work are outside this item.

## Archive Intent

retain_in_place

## Execution Preflight

The admitted snapshot contained 38 modified or untracked backlog items and 9,843 lines: 28
`completed`, two `closed`, three `in_progress`, one `backlog`, and four `blocked`. Every dirty item
was classified by explicit status, line count, owner, relationship fields, nonterminal inbound
references, and current source/role ownership before the first write.

The repository has no admitted sole-writer release freeze: the dirty release-preparation item is at
“Backend source correction complete; QA integration acceptance follows”, not a named frozen
candidate stage. Active Product policy and Design System work remain read-only to this task.

Selected originals were fingerprinted before this receipt was created:

| Candidate                                                                                                                                     | Status / owner          | Before | Relationships and inbound nonterminal references                                    | Why safe                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -----: | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Shell Surface Ladder And Header Hierarchy Design Discovery](./2026-08-13-hito-shell-surface-ladder-and-header-hierarchy-design-discovery.md) | `completed` / DESIGNER  |    369 | `Evidence From` the completed Foundation decision; no nonterminal inbound reference | Its decision was consumed by separate completed DS and Product implementation records; source transcripts are no longer lifecycle authority.              |
| [UI Locale And Brazilian Portuguese Contract Discovery](./2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery.md)           | `completed` / ARCHITECT |    464 | No explicit relationship; no nonterminal inbound reference                          | Backend and shared-DS slices now own completed implementation evidence; the remaining Product/Marketing/DevTools/AI boundaries can be retained compactly. |
| [UI Locale Profile Preference And Server Resolution](./2026-08-13-hito-ui-locale-profile-preference-and-server-resolution.md)                 | `completed` / BACKEND   |    290 | `Evidence From` the locale discovery; no nonterminal inbound reference              | Exact migration, resolver/API contract, local proof, omissions, and consumer boundary fit a factual closeout; no Backend task is active on these sources. |

The three candidates total 1,123 lines. All are untracked current records, so their concise
closeouts must preserve every unique current fact needed after eventual commit; Git history is not
assumed to recover the pre-compaction drafts.

## Complete Exclusion Inventory

### Nonterminal — preserve byte-for-byte

| Item                                                                             | Status / lines / owner              | Relationships or inbound reference                            | Reason                                               |
| -------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `2026-08-12-hito-canonical-work-loop-autonomy-and-release-freeze-policy.md`      | `in_progress` / 851 / PRODUCT       | None                                                          | Active operating-policy pilot.                       |
| `2026-08-12-hito-ds-navigation-and-async-toast-demo-clarity.md`                  | `backlog` / 253 / DESIGN SYSTEM     | Named by two blocked release records                          | Nonterminal and dependency-visible.                  |
| `2026-08-13-hito-ds-data-table-section-hierarchy-and-cell-density-correction.md` | `in_progress` / 252 / DESIGN SYSTEM | `Evidence From` Data Table anatomy; `Supersedes` four-part IA | Explicitly protected active Data Table work.         |
| `2026-08-13-hito-ds-status-pill-borderless-canonical-chrome.md`                  | `in_progress` / 123 / DESIGN SYSTEM | None                                                          | Explicitly protected active status-pill work.        |
| `2026-08-13-hito-ds-foundations-compact-specimens-and-demo-signal-cleanup.md`    | `blocked` / 306 / DESIGN SYSTEM     | None                                                          | Blocked source/evidence remains live.                |
| `2026-08-13-hito-ds-foundations-icons-usage-signal-cleanup.md`                   | `blocked` / 94 / DESIGN SYSTEM      | None                                                          | Blocked source/evidence remains live.                |
| `2026-08-13-hito-ds-foundations-validator-count-and-runtime-admission.md`        | `blocked` / 189 / DESIGN SYSTEM     | None                                                          | Blocked validator/runtime evidence remains live.     |
| `2026-08-13-hub-mark-adoption-and-access-label-hierarchy.md`                     | `blocked` / 169 / DESIGN SYSTEM     | None                                                          | Blocked source and validation evidence remains live. |

### Release, policy, dependency, and prior-batch evidence

| Item                                                                          | Status / lines / owner        | Relationship / reason                                                                            |
| ----------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `2026-08-12-current-candidate-git-release-and-vercel-verification-retry-2.md` | `completed` / 323 / BACKEND   | Release/retry facts are immutable release evidence.                                              |
| `2026-08-12-hito-role-instruction-and-inter-role-handoff-alignment-audit.md`  | `completed` / 452 / ARCHITECT | Explicit `Parent` is the active canonical-work-loop policy item.                                 |
| `2026-08-13-completed-backlog-closeout-compaction.md`                         | `completed` / 127 / ARCHITECT | Canonical first-batch receipt; already compact and needed to explain its eight modified records. |

The eight first-batch closeouts below total 480 lines and remain unchanged because they are already
within the compact target and belong to the prior receipt:

- `2026-06-04-manual-workout-creation-edit-copy-recurrence.md` — `closed`, 42 lines, PRODUCT.
- `2026-07-13-hito-compiler-architecture-plan.md` — `completed`, 64 lines, ARCHITECT.
- `2026-07-22-heart-rate-zone-editor-ux-redesign.md` — `completed`, 54 lines, FRONTEND.
- `2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md` — `completed`, 61
  lines, FRONTEND/BACKEND.
- `2026-08-10-saved-plan-library-and-future-apply.md` — `completed`, 66 lines, BACKEND.
- `2026-08-10-saved-plan-library-ui-and-start.md` — `completed`, 62 lines, FRONTEND.
- `2026-08-10-saved-plan-start-schedule-alignment.md` — `completed`, 57 lines, BACKEND.
- `2026-08-11-calendar-overflow-future-workout-actions.md` — `completed`, 74 lines,
  BACKEND/FRONTEND.

### Current Design System / Frontend(ds) source ownership — preserve byte-for-byte

| Item                                                                     | Status / lines / owner               | Relationship or active-source reason                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-13-frontend-product-canonical-token-consumer-remediation.md`    | `completed` / 266 / FRONTEND Product | Source remains dirty and the record was executed in the current FRONTEND(ds) task surface.                                            |
| `2026-08-13-hito-ds-canonical-app-shell-surface-and-header-contract.md`  | `completed` / 298 / DESIGN SYSTEM    | `Depends On` selected shell discovery; current DS source ownership is protected.                                                      |
| `2026-08-13-hito-ds-compact-header-and-inline-search-composition.md`     | `completed` / 298 / FRONTEND(ds)     | `Depends On` shared locale and `Supersedes` Header Search; protected Frontend(ds) source record.                                      |
| `2026-08-13-hito-ds-components-header-signal-cleanup.md`                 | `completed` / 404 / DESIGN SYSTEM    | `Supersedes` Launch Surface; protected DS source record.                                                                              |
| `2026-08-13-hito-ds-data-table-anatomy-and-row-playgrounds.md`           | `completed` / 394 / DESIGN SYSTEM    | Named by the active Data Table item.                                                                                                  |
| `2026-08-13-hito-ds-data-table-four-part-reference-ia.md`                | `completed` / 288 / FRONTEND(ds)     | `Supersedes` anatomy and is named by the active Data Table item.                                                                      |
| `2026-08-13-hito-ds-foundations-validator-structure-reconciliation.md`   | `completed` / 190 / DESIGN SYSTEM    | Current blocked Foundation/validator chain still needs this unique evidence.                                                          |
| `2026-08-13-hito-ds-header-search-and-context-navigation.md`             | `completed` / 299 / DESIGN SYSTEM    | Superseded by the protected compact-header item; current source record remains with DS.                                               |
| `2026-08-13-hito-ds-launch-surface-chrome-canonicalization.md`           | `closed` / 147 / DESIGN SYSTEM       | `Evidence From` blocked Hub Mark and superseded by protected DS work.                                                                 |
| `2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract.md` | `completed` / 324 / DESIGN SYSTEM    | `Depends On` selected Backend locale item and `Evidence From` selected locale discovery; current DS source evidence remains detailed. |
| `2026-08-13-hito-favicon-surface-and-served-asset-reconciliation.md`     | `completed` / 329 / FRONTEND         | Current brand/source ownership is protected.                                                                                          |
| `2026-08-13-hito-logo-wordmark-symbol-and-favicon-update.md`             | `completed` / 316 / FRONTEND         | Current brand/source ownership is protected.                                                                                          |
| `2026-08-13-product-app-shell-surface-ladder-alignment.md`               | `completed` / 235 / FRONTEND Product | `Depends On` the protected DS App Shell contract; current Frontend source evidence remains detailed.                                  |

### Unique unimplemented research and decision maps — preserve byte-for-byte

| Item                                                                                    | Status / lines / owner       | Reason                                                                                          |
| --------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `2026-08-13-hito-ds-canonical-token-adherence-and-exception-census.md`                  | `completed` / 360 / DESIGNER | Sole detailed actionable/exception census; not all repair groups have successor records.        |
| `2026-08-13-hito-ds-card-size-contract-and-inspector-recognition-discovery.md`          | `completed` / 594 / DESIGNER | Sole future Showcase Card/Inspector state and payload contract; implementation is not recorded. |
| `2026-08-13-hito-ds-card-surface-copy-affordance-and-figma-reconciliation-discovery.md` | `completed` / 359 / DESIGNER | Sole code/Figma map; code slices are unimplemented and Figma target remains blocked.            |

These 35 exclusions and the three candidates account for all 38 dirty backlog items at preflight.
Status alone admitted none of them.

## Compaction Result

| Canonical item                                             |    Before |   After |         Reduced |
| ---------------------------------------------------------- | --------: | ------: | --------------: |
| Shell Surface Ladder And Header Hierarchy Design Discovery |       369 |      81 |             288 |
| UI Locale And Brazilian Portuguese Contract Discovery      |       464 |      94 |             370 |
| UI Locale Profile Preference And Server Resolution         |       290 |      79 |             211 |
| **Selected records**                                       | **1,123** | **254** | **869 (77.4%)** |

The new receipt contains 180 lines. Against the admitted 38-file / 9,843-line dirty backlog
baseline, the completed batch now contains 39 dirty backlog items and 9,154 lines: a net reduction
of 689 lines after accounting for this required receipt.

The closeouts retain:

- the exact Dark/Light shell ladder, sticky header material, source owners, Inspector alias
  discriminator, downstream implementation records, and owner-local rollback;
- the accepted locale values/precedence, SSR and hydration invariant, catalog/formatter approach,
  Changelog and immutable-content boundaries, AI authored-locale rule, successor evidence, and
  remaining Product/Marketing/DevTools/AI/QA owner slices; and
- migration `20260813124903`, exact resolver/readback contract and violation code, changed sources,
  loopback migration/data isolation proof, focused static evidence, omitted broad checks, and root
  consumer boundary.

Removed material was limited to repeated dispatch prompts, original implementation instructions,
intermediate preflight/status narration, duplicate evidence matrices, terminal transcripts, and
superseded unknowns already resolved by accepted successor records. Identity, status, owner, scope,
decision/outcome, acceptance strength, and remaining boundary did not change.

## Validation Inventory

| Check                               | Result  | Evidence / consequence                                                                                                                          |
| ----------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate fingerprint and admission | Passed  | All three preflight hashes matched immediately before rewrite; none had a nonterminal inbound reference.                                        |
| Exclusion preservation              | Passed  | Task-owned writes were limited to the three selected files and this receipt; all 35 inventoried exclusions remained outside the write boundary. |
| Local Markdown links                | Passed  | Eight local links across the four changed records resolved; zero were missing.                                                                  |
| Markdown format                     | Passed  | Scoped Prettier write/check passed for all four records.                                                                                        |
| Direct whitespace                   | Passed  | Direct trailing-whitespace scan and per-untracked-file `git diff --no-index --check` emitted no finding.                                        |
| Repository diff hygiene             | Passed  | `git diff --check` emitted no whitespace finding.                                                                                               |
| Runtime/build/browser/QA/release    | Not run | Documentation-only compaction changed no executable behavior and claims none of these acceptance layers.                                        |

## Stage

Completed — second evidence-safe in-place closeout batch.

## Residual Boundary

This batch is complete and needs no next owner. The 35 exclusions remain deliberately detailed
until their active ownership, dependency, release, policy, blocked state, or unique unimplemented
evidence boundary becomes terminal and independently safe. No subagent was used. No build, browser,
runtime, QA, hosted, staging, commit, push, release, deployment, or Global QA claim was made.
