# Hito Terminal Backlog Receipt Compaction

Work Item ID: `2026-08-18-hito-terminal-backlog-receipt-compaction`
Status: completed
Type: Tracked
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: [Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Hito Runner Core Release-Candidate Cleanup And Closure Audit](./2026-08-17-hito-runner-core-release-candidate-cleanup-and-closure-audit.md)
Scope: Compact eligible terminal canonical backlog records before release-candidate admission while
preserving identity, accepted decisions, ownership, proof, evidence links, and historical truth.
Archive Intent: Retain one concise receipt per terminal item; do not create a parallel archive,
tracker, generated index, or second source of truth.

## Task

The current backlog directory contains roughly 35,777 Markdown lines. Ivan requires it to be
reviewable before a commit/push candidate rather than an append-only dump of repeated prompts,
intermediate reports, and superseded instructions.

Audit every terminal backlog record and compact only the records that are demonstrably stable and
have no active owner, pending acceptance update, or unique unresolved decision. Keep the canonical
file in place, but reduce it to durable metadata, a human-readable outcome, essential decisions,
source/evidence links, validation, preserved boundaries, and the final lifecycle receipt. Remove
redundant historical handoff prompts, duplicated prose, intermediate commentary, repeated tables,
and superseded instructions from eligible terminal records.

Nonterminal work, blocked evidence gates, current roadmaps/plans, active dependencies, unique QA
catalogs, and documents with pending owner updates must remain intact. No runtime source, migration,
script, fixture, asset, generated index, separate archive, or Git lifecycle work is admitted.

## Source Facts

- The exact pre-compaction backlog directory is 35,777 lines / 3.6 MB; this is documentation, not
  product runtime code.
- The prior worktree audit proves terminal records can contain unique uncommitted owner and
  validation evidence. Compaction must retain those facts rather than delete records by age/status.
- Runner Core source cleanup found no further safe runtime deletion. Documentation compaction is a
  separate history/readability concern and must not disguise source deletion.

## What Not To Touch

- Do not modify any `backlog`, `ready`, `in_progress`, or `blocked` record; do not modify the
  Runner Core roadmap or its active plan.
- Do not remove Work Item IDs, terminal status, owner/Epic classification, final evidence, key
  decisions, source links, validation outcomes, or links still referenced by live items.
- Do not change runtime source, migrations, scripts, fixtures, assets, current/history truth,
  database, browser/runtime state, hosted data, providers, staging, commit, push, or deployment.
- Do not convert compaction into a new archive folder, generated database/index, or summary tracker.

## Validation Expectations

- Preflight inventory: identify every terminal candidate, inbound reference, source owner, and
  exclusion reason before the first compaction write.
- One canonical retained receipt per compacted item, preserving lifecycle/evidence links and human
  summary.
- Link validation over changed records, scope-appropriate Prettier, whitespace and diff hygiene.
- Before/after line/path accounting and a ledger of compacted vs retained records.
- Stop on cross-owner overlap, uncertain historical evidence, or an active inbound dependency;
  report retain rather than rewriting it.

## Stage

ARCHITECT terminal-record census and evidence-led same-file compaction complete.

## Next Recommended Role

PRODUCT

## Original Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Terminal Backlog Receipt Compaction
Stage: Terminal-record census and evidence-led same-file compaction
Canonical item: docs/tasks/backlog/2026-08-18-hito-terminal-backlog-receipt-compaction.md
Evidence: docs/tasks/backlog/2026-08-17-hito-runner-core-release-candidate-cleanup-and-closure-audit.md

Read AGENTS.md, agents/architect.agent.md, and skills/hito-architecture-audit/SKILL.md before
acting. This is a Tracked ARCHITECT documentation-only task. Preserve every runtime, migration,
script, fixture, asset, current/active backlog, plan, history, and unrelated dirty byte. Do not use
Git lifecycle commands or external/runtime/database/browser actions.

First inventory every terminal backlog candidate and prove its inbound references, source owner,
last lifecycle state, and whether an active owner may still write it. Retain any uncertain,
inbound-required, pending-acceptance, blocked, roadmap, or nonterminal record unchanged.

For each eligible stable terminal record, compact the existing file in place to metadata plus one
concise human-readable final receipt: outcome, accepted decisions, changed/removed paths when any,
validation, evidence/source links, preserved boundaries, and terminal status. Remove only redundant
historical handoff prompts, duplicated task prose, intermediate commentary, repeated validation
tables, and superseded instructions. Do not delete the canonical file, Work Item ID, final evidence,
or create a parallel archive/index/tracker.

Update this item with exact before/after line accounting, a compacted-versus-retained ledger,
excluded records/reasons, link/format/whitespace/diff evidence, and the next candidate-freeze
boundary. Return to PRODUCT. Stop rather than guessing if documentation ownership or historical
evidence is unclear.
```

## ARCHITECT Final Receipt — 2026-08-18

### Preflight And Census Boundary

- **Role / mode:** ARCHITECT / Tracked documentation-only compaction. The only write boundary was
  this item plus four eligible terminal backlog files. No subagent was used.
- **Snapshot:** before compaction, `docs/tasks/backlog/` contained 317 top-level Markdown files and
  35,966 lines. The lifecycle census found 246 terminal records / 20,210 lines: 222 `completed`, 24
  `closed`, and zero `archived`.
- **Existing compact set:** 184 terminal records were already at or below 20 lines and retained
  unchanged. They already used the established metadata plus concise closeout form.
- **Large-terminal discriminator:** 62 terminal records exceeded 20 lines. Twelve had direct
  filename references from nonterminal records and were excluded. Of the remaining 50, four were
  stable and compactable; 46 retained unique uncommitted or pending acceptance evidence.
- **Other lifecycle:** all 39 `backlog`, 16 `blocked`, eight `ready`, six pre-write `in_progress`
  records, the status-less history-ledger record, and `README.md` were excluded from ARCHITECT's
  write boundary. Status alone was never used as rewrite authority.
- **Dirty boundary:** `main`, `HEAD = origin/main =
abd4fe8355e3c644095111a654c1560aa265d104`, and an empty index. The external status-and-byte
  digest excluding the five task-owned files stabilized at
  `be006f503358e8d959f8b380797e76b4facda49573de632ed65cff19a1459e98` before the first write.
- **New artifacts / deletion:** none. Every canonical file path remains in place; no runtime,
  migration, script, fixture, asset, plan, history, current truth, generated output, Git lifecycle,
  runtime, database, browser, hosted, or provider action occurred.

### Compacted Ledger

| Terminal record                                                                                | Owner / final state               | Lines before -> after | Why stable; retained truth                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------- | --------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-16-hito-current-worktree-volume-and-legacy-remediation-audit.md`                      | ARCHITECT / completed             | 510 -> 21             | Superseded timestamped inventory with no nonterminal inbound. Retains the 158-path / 23,055-line reconciliation, two proof-deletion decisions, owner links, validation, and read-only boundary.                                                          |
| `2026-08-17-hito-current-worktree-volume-and-legacy-cleanup-follow-up.md`                      | ARCHITECT / completed             | 223 -> 22             | Superseded by the later release-candidate audit and had no nonterminal inbound. Retains the 453-path / 41,868-line reconciliation, realized/conditional cleanup ledger, live-proof/migration/artifact boundaries, links, and validation.                 |
| `2026-08-15-hito-proof-script-reachability-and-documentation-source-of-truth-consolidation.md` | ARCHITECT / completed             | 350 -> 23             | Its two candidates were later resolved by Backend cleanup and it had no nonterminal inbound. Retains the 88-script / 55-proof census, both conditional decisions, documentation hierarchy, owner sequence, source links, and static validation boundary. |
| `2026-08-17-hito-ds-overview-tabs-showcase-centering.md`                                       | DESIGN SYSTEM / closed            | 96 -> 16              | Explicitly superseded by a terminal DS implementation and had no nonterminal inbound. Retains the local-wrapper cause, zero standalone source change, superseding evidence link, and shared Tabs preservation boundary.                                  |
| **Compacted total**                                                                            | **Four canonical files retained** | **1,179 -> 82**       | **Net removal: 1,097 documentation lines; zero path deletion**                                                                                                                                                                                           |

Removed text was limited to historical handoff prompts, duplicated task/problem prose, intermediate
status narration, repeated manifests/tables, terminal transcripts, and superseded instructions.
No Work Item ID, final status, owner, accepted decision, changed/removed path fact, validation
boundary, evidence/source link, or residual boundary was intentionally removed.

### Direct-Inbound Exclusions — 12

These large terminal records were retained byte-for-byte because a nonterminal item names their
canonical filename:

| Terminal record                                                                              | Nonterminal inbound owner                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md`                                   | `2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md` |
| `2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md` | Calendar Move acceptance and the Runner Product roadmap           |
| `2026-08-17-hito-runner-core-release-candidate-cleanup-and-closure-audit.md`                 | Local schema parity gate and this compaction item                 |
| `2026-08-16-hito-runner-progress-metrics-and-visualization-doctrine-discovery.md`            | Factual line-chart usage discovery                                |
| `2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md`                             | Calendar Move acceptance                                          |
| `2026-08-17-hito-local-inspector-semantic-add-border-intent.md`                              | DS surface-system consolidation                                   |
| `2026-08-17-hito-running-coach-activity-sequence-progress-metrics-review.md`                 | Factual line-chart usage discovery                                |
| `2026-08-17-hito-runner-calendar-tail-rebase-backend-contract.md`                            | Local schema parity gate                                          |
| `2026-08-15-hito-workout-interaction-recovery.md`                                            | iPad Calendar recovery                                            |
| `2026-08-15-hito-technical-history-ledger-restoration-and-release-highlights.md`             | History ledger reconciliation                                     |

### Stable-Status But Retained Exclusions — 46

No direct filename inbound was found for these records, but compaction was not admitted because a
current successor/acceptance surface or unique uncommitted evidence remained. The complete exact
partition is:

- **Runner Core, local schema, final QA, and candidate evidence:**
  `2026-06-06-authenticated-saved-mode-workout-readback-browser-smoke-fixture.md`,
  `2026-08-15-hito-calendar-rest-projection-and-move-undo-regression-recovery.md`,
  `2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup.md`,
  `2026-08-15-hito-runner-core-standalone-calendar-write-foundation.md`,
  `2026-08-15-hito-standalone-calendar-materialization-origin-completion.md`,
  `2026-08-15-hito-unified-editable-workout-backend-contract-and-atomic-protection.md`,
  `2026-08-15-hito-unified-editable-workout-document-contract-discovery.md`,
  `2026-08-15-hito-unified-editable-workout-frontend-editor-adoption.md`,
  `2026-08-15-hito-workout-overview-sidebar-summary-deduplication.md`,
  `2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery.md`,
  `2026-08-16-hito-runner-calendar-standalone-frontend-consumer-adoption.md`,
  `2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md`,
  `2026-08-16-hito-runner-core-qa-fixture-file-flow-browser-bridge.md`,
  `2026-08-16-hito-runner-core-qa-fixture-fit-and-imported-workout-enablement.md`,
  `2026-08-16-hito-runner-legacy-plan-copy-removal.md`,
  `2026-08-16-hito-runner-occupied-move-replace-durable-undo.md`,
  `2026-08-16-hito-runner-occupied-move-replace-undo-frontend-adoption.md`,
  `2026-08-16-hito-runner-standalone-calendar-copy-completion.md`,
  `2026-08-17-hito-runner-calendar-fit-preserving-schedule-rebase-discovery.md`,
  `2026-08-17-hito-runner-core-baseline-and-risk-derived-regression-gate.md`,
  `2026-08-17-hito-runner-core-current-date-file-flow-fixture-alignment.md`, and
  `2026-08-17-hito-runner-core-scheduled-completion-authority-copy-closure.md`. Their detailed
  source/migration/fixture/QA receipts remain required until local schema parity, final cross-flow
  QA, and candidate admission are terminal.
- **Runner Evidence and Progress:**
  `2026-08-16-hito-ds-runner-progress-charts-and-records-discovery.md`,
  `2026-08-16-hito-runner-progress-fit-results-and-chart-payload-readiness.md`,
  `2026-08-17-hito-ds-factual-activity-sequence-display-unit-deduplication.md`,
  `2026-08-17-hito-runner-progress-chart-composition-and-period-controls-redesign.md`,
  `2026-08-17-hito-runner-progress-complete-fit-activity-sequence-readiness.md`,
  `2026-08-17-hito-runner-progress-factual-activity-sequence-frontend-adoption.md`, and
  `2026-08-17-hito-runner-progress-factual-chart-controls-adoption.md`. Factual line-chart usage and
  final Progress acceptance remain nonterminal, so their contracts and QA facts stay detailed.
- **Admin, locale, Inspector, Design System, and related successor work:**
  `2026-08-15-hito-backlog-epic-taxonomy-and-admin-projection.md`,
  `2026-08-15-hito-financial-and-commercial-source-of-truth-audit.md`,
  `2026-08-15-hito-local-inspector-computed-geometry-overlay.md`,
  `2026-08-16-hito-admin-persistent-runner-identity-and-elevated-access-alignment.md`,
  `2026-08-16-hito-language-dropdown-runner-and-admin-adoption.md`,
  `2026-08-17-hito-admin-work-items-authority-and-usability-consolidation.md`,
  `2026-08-17-hito-ipad-dynamic-viewport-sidebar-profile-discovery.md`. Active Admin/Inspector,
  blocked language/iPad, queued Navigation Card/surface, or missing Product-browser acceptance
  keeps these receipts outside this batch.
- **Immutable operational/release evidence — two:**
  `2026-08-15-terminal-backlog-compaction-git-commit-and-push.md` and
  `2026-08-17-hito-qa-fixture-runtime-admission-recovery.md`. Their exact Git/runtime recovery facts
  are unique and were not summarized before the next freeze/QA cycle.

### Accounting And Candidate-Freeze Boundary

- The four selected files fell from 1,179 to 82 lines, a 1,097-line reduction.
- The backlog directory fell from 35,966 lines before compaction to 35,018 after this receipt and
  formatting, for a net reduction of 948 lines while retaining all 317 canonical Markdown paths.
- Terminal records increased from 246 to 247 because this item reached `completed`; the Backend
  schema-parity item changed independently during the audit but remained nonterminal and was not
  edited here.
- This compaction does not admit a release candidate. A freeze may begin only after the active local
  schema parity and other repository writers are terminal or idle, the exact admitted paths map to
  terminal owners/shared dependencies, final QA is current, the index is empty, and PRODUCT/Ivan
  has supplied the required staging/commit/push authority.

### Validation And Acceptance Boundary

| Check                                         | Result                              | Evidence / consequence                                                                                                                                                                                            |
| --------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Terminal census and inbound map               | Passed for the pre-write snapshot   | 246 terminal records; 184 already compact, 62 long; 12 direct-inbound exclusions; 50 owner/evidence reviews                                                                                                       |
| Canonical path preservation                   | Passed                              | Four files compacted in place; zero Markdown file deleted, moved, archived, or replaced by an index                                                                                                               |
| Required fact retention                       | Passed by focused source comparison | Metadata, outcome, decisions, changed/removed paths, validation, evidence/source links, terminal state, and residual boundary retained in every selected closeout                                                 |
| Links, format, whitespace, and diff hygiene   | Passed                              | 21 local links resolved; scoped Prettier and direct tab/CR/trailing-space scan passed; `git diff --check` passed for tracked work, while all five task files remain untracked and were covered by the direct scan |
| Runtime/build/browser/database/hosted/release | Not run by design                   | Documentation-only task; no implementation, QA, Global QA, candidate, release, or deployment claim                                                                                                                |

PRODUCT is the next owner. It may use this receipt only as documentation hygiene evidence; it is not
staging authority and does not weaken any pending acceptance or release gate.
