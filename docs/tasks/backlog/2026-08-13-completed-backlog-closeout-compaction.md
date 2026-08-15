# Completed Backlog Closeout Compaction

- **Work Item ID:** `2026-08-13-completed-backlog-closeout-compaction`
- **Status:** `completed`
- **Type:** `Tracked — documentation and architecture hygiene`
- **Priority:** `P1`
- **Owner:** `ARCHITECT`
- **Scope:** `first evidence-safe batch of completed and closed canonical backlog items`
- **Archive Intent:** `retain one concise factual closeout in each existing canonical item`

## Outcome

Eight clean terminal backlog items were reduced to self-contained closeouts. Each now answers what
was requested, what changed or was decided, where the task-owned truth lives, what proved it, and
what remains outside the accepted boundary. Historical prompts, intermediate blocker/status
narration, repeated validation tables, and generic workflow boilerplate were removed. Git remains
the historical source for the deleted narration.

This batch did not create an archive, index, compatibility document, tracker, runtime artifact, or
second lifecycle owner.

## Preflight And Candidate Inventory

The preflight inspected 184 top-level Markdown files in `docs/tasks/backlog/` and their explicit
relationship/reference surface before the first task-owned write.

| Explicit status     | Count | Disposition                                 |
| ------------------- | ----: | ------------------------------------------- |
| `completed`         |   120 | Terminal candidates                         |
| `closed`            |    14 | Terminal candidates                         |
| `backlog`           |    33 | Preserved byte-for-byte                     |
| `in_progress`       |     6 | Preserved byte-for-byte                     |
| `ready`             |     3 | Preserved byte-for-byte                     |
| `blocked`           |     6 | Preserved byte-for-byte                     |
| No work-item status |     1 | Repository helper document, not a candidate |

The explicit optional relationship inventory contained one `Parent` field and no `Depends On`,
`Evidence From`, or `Supersedes` fields. Repository search additionally found eight terminal
items named by active, ready, or blocked records. No selected document was named by those records.
All eight selected files were clean tracked files before compaction, and no concurrent writer owned
them.

## Documents Compacted

| Canonical item                                                                                                                                   |    Before |   After |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------: | ------: |
| [Manual Workout Creation, Editing, Copy, Templates, And Recurrence](./2026-06-04-manual-workout-creation-edit-copy-recurrence.md)                |       576 |      42 |
| [Hito Compiler Architecture Rebuild Plan](./2026-07-13-hito-compiler-architecture-plan.md)                                                       |       809 |      64 |
| [Heart-Rate Guidance Band Editor UX Redesign](./2026-07-22-heart-rate-zone-editor-ux-redesign.md)                                                |       250 |      54 |
| [Calendar Workouts Independent From Plans And Simple Copy/Paste](./2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md) |       486 |      61 |
| [Saved Plan Library And Future Schedule Apply](./2026-08-10-saved-plan-library-and-future-apply.md)                                              |       321 |      66 |
| [Saved Plan Library UI And Start](./2026-08-10-saved-plan-library-ui-and-start.md)                                                               |       298 |      62 |
| [Saved Plan Start With Schedule Alignment](./2026-08-10-saved-plan-start-schedule-alignment.md)                                                  |       175 |      57 |
| [Calendar Overflow Actions For Future Workouts And Plans](./2026-08-11-calendar-overflow-future-workout-actions.md)                              |       413 |      74 |
| **Total**                                                                                                                                        | **3,328** | **480** |

Net closeout reduction: 2,848 lines (85.6%) across the selected documents.

## Unique Evidence Retained

- The manual-workout item remains explicitly a superseded request with no invented implementation
  receipt, and retains its accepted authoring plan and Running Coach taxonomy.
- The compiler closeout retains the exact direct provider/WorkoutDocument contract, both
  `final-proof.json` records, the accepted 2026-07-27 full-wire Global QA fact, and its future
  load/progression-policy boundary.
- The heart-rate closeout retains nonexclusive guidance-band semantics, 60–200 changed-value rules,
  provider containment rules, shared source owners, focused browser evidence, and the absent Global
  QA claim.
- Calendar independence retains runner-owned workout truth, prescription-only Copy, empty-versus-
  Rest Paste, the reconciled migration, 19-check Backend proof, browser proof, and omitted mobile/
  hosted/Global QA boundaries.
- The three saved-plan closeouts retain immutable provenance, exact migration ownership, explicit
  apply intents, deterministic weekday alignment, the focused browser artifact directory, the
  original 19-check success where it occurred, and the separate non-green broad-suite/typecheck
  facts where they occurred.
- Calendar overflow retains the atomic-clear migration, exact 54-row export/clear/restoration facts,
  protected-data and concurrency proof, desktop/375 theme coverage, the independent-review gap and
  owner follow-up, the `55 !== 56` broad-suite stop, and later artifact-staleness boundary.

## Documents Deliberately Excluded

Eight terminal records were preserved because active, ready, or blocked work names them as evidence:

- [Hito Stack Complexity Reduction Program](./2026-08-04-hito-stack-complexity-reduction-program.md)
- [Admin Work Items Repository Mirror Synchronization](./2026-08-06-admin-work-items-repository-mirror-synchronization.md)
- [Hito DS Reference UI Typography Adoption](./2026-08-11-hito-ds-reference-ui-typography-adoption.md)
- [Hito DS Typography Scale Consolidation And Adoption](./2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md)
- [Hito DS Brand Favicon Canonical Asset Reuse](./2026-08-12-hito-ds-brand-favicon-canonical-asset-reuse.md)
- [Hito DS Brand Favicon Tone Validator Alignment](./2026-08-12-hito-ds-brand-favicon-tone-validator-alignment.md)
- [Hito DS Reference UI Typography Receipt Hygiene](./2026-08-12-hito-ds-reference-ui-typography-receipt-hygiene.md)
- [Hito UI Simplification Source-Of-Truth Audit](./2026-08-12-hito-ui-simplification-source-of-truth-audit.md)

[Authenticated Product UI Title Adoption](./2026-08-10-authenticated-product-ui-title-adoption.md)
was also excluded because its explicit `Parent` is the active cross-stack audit.

Six terminal records had uncommitted content and were preserved in full because Git history cannot
recover their unique current facts:

- [Current Candidate Git Release And Vercel Verification Retry 2](./2026-08-12-current-candidate-git-release-and-vercel-verification-retry-2.md)
- [Role Instruction And Inter-Role Handoff Alignment Audit](./2026-08-12-hito-role-instruction-and-inter-role-handoff-alignment-audit.md)
- [Frontend Product Canonical Token Consumer Remediation](./2026-08-13-frontend-product-canonical-token-consumer-remediation.md)
- [Hito DS Canonical Token Adherence And Exception Census](./2026-08-13-hito-ds-canonical-token-adherence-and-exception-census.md)
- [Hito DS Foundations Validator Structure Reconciliation](./2026-08-13-hito-ds-foundations-validator-structure-reconciliation.md)
- [Hito Logo Wordmark Symbol And Favicon Update](./2026-08-13-hito-logo-wordmark-symbol-and-favicon-update.md)

The other 111 terminal records were left byte-for-byte unchanged because this bounded first pass did
not establish their per-item dependency and unique-evidence retention boundary. This includes
release, Global QA, policy/architecture evidence, and already smaller closeouts. Terminal status
alone was not treated as permission to discard their detail.

## Validation Inventory

| Check                            | Scenario / environment                            | Result  | Evidence                                                                               |
| -------------------------------- | ------------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| Status and dependency inventory  | All top-level backlog Markdown                    | Passed  | Counts and exclusions recorded above                                                   |
| Selected-file ownership          | Git status plus current named-role state          | Passed  | Eight selected files were clean; PRODUCT was idle and other roles were idle/not loaded |
| Local Markdown links             | All links in the eight closeouts and this receipt | Passed  | 75 local links resolved; 0 missing                                                     |
| Markdown format                  | Nine task-owned documents                         | Passed  | `npx prettier --check` after mechanical formatting                                     |
| Diff hygiene                     | Repository tracked diff plus untracked receipt    | Passed  | `git diff --check`; no-index check emitted no whitespace finding for this receipt      |
| Runtime/build/browser/QA/release | Outside documentation-only scope                  | Not run | No runtime, fixture, browser, build, hosted, Git lifecycle, or release claim           |

## Residual Boundary

This exact eight-document compaction batch is complete. The remaining 111 unaudited terminal items
require a later bounded selection pass before any text is removed; this item does not authorize
bulk rewriting from status alone. Active, ready, blocked, release, policy, uncommitted, runtime,
public-history, agent, and skill surfaces remain unchanged. No subagent was used.
