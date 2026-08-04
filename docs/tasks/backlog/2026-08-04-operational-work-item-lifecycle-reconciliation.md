# Operational Work-Item Lifecycle Reconciliation

## Work Item ID

2026-08-04-operational-work-item-lifecycle-reconciliation

## Status

completed

## Type

plan

## Priority

urgent

## Owner

architect

## Scope

docs-source-of-truth

## Archive Intent

retain_in_place

## Task

Reconcile the repository work-item lifecycle so `docs/tasks/backlog/` remains the only operational
queue, current statuses match accepted evidence, and every external work document is classified as
supporting detail, retained history, or explicit migration debt.

## Stage

Completed / ARCHITECT documentation-governance reconciliation with named owner debt preserved.

## Root Cause And Evidence

The prior governance audit established the correct policy, but it did not make future metadata
self-reconciling. The current audit found three concrete drift classes:

1. The Runner Activity Intelligence Foundation still said `ready` and release integration pending
   after its exact 50-file bundle shipped in
   `550f602f11c207b56be0a0c71779be26ced0e003` and the separate planned-workout projection
   reconciliation shipped in `329f45c27ff25928c4daad963f24f967e197200c`.
2. One supporting Frontend spec carried a complete `ready` execution prompt without any canonical
   backlog item.
3. Admin capture rows, supporting-source importer projection, and the active-plan dashboard
   generator could be read as parallel lifecycle owners even though repository policy names the
   Markdown backlog as the only operational queue.

This reconciliation changes documentation ownership only. It does not infer implementation from a
plan or source tree, alter an active role, refresh Admin, or change runtime behavior.

## Canonical Queue Inventory

After this reconciliation, the queue contains `69` items:

| Status | Low | Medium | High | Urgent | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `backlog` | 6 | 11 | 12 | 2 | 31 |
| `ready` | 0 | 0 | 2 | 0 | 2 |
| `in_progress` | 0 | 1 | 0 | 0 | 1 |
| `blocked` | 0 | 0 | 0 | 0 | 0 |
| `completed` | 1 | 2 | 20 | 5 | 28 |
| `closed` | 0 | 3 | 4 | 0 | 7 |
| **Total** | **7** | **17** | **38** | **7** | **69** |

Only these nonterminal execution signals remain:

| Canonical item | Status | Priority / owner | Verified meaning |
| --- | --- | --- | --- |
| [Coach, Club, And Program Publishing Architecture](2026-07-26-coach-club-program-publishing-architecture.md) | `ready` | high / backend | Complete canonical metadata and accepted Product decision; no implementation receipt exists, so it remains ready and must still pass the idle-owner dispatch gate. |
| [Canonical Loopback Local Inspector Availability](2026-08-04-canonical-loopback-local-inspector-availability.md) | `in_progress` | medium / frontend DevTools | Concurrent source and item state make active ownership plausible. Its owner must add the missing Stage, next role, and exact prompt or close it from accepted evidence; Architect does not alter the active role. |
| [Hito DS Code-To-Figma Foundation Cleanup](2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md) | `ready` | high / design_system | The proposal exists, but mandatory next-role and exact-handoff metadata is missing. It is not dispatchable until Product verifies an idle owner and completes the item or moves it back to backlog. |

The [Runner Activity Intelligence Foundation](2026-07-30-runner-activity-intelligence-foundation-architecture.md)
is now `completed`; Gate 5 and provider sync remain future work and were not promoted into a hidden
successor task.

## External Work-Document Classification

The live inventory contains `161` Markdown records under non-backlog work roots: `77` under task
roots and `84` plans. Their complete primary classification is:

| Classification | Count | Scope |
| --- | ---: | --- |
| Retained history | 127 | 76 archive plans, four completed link-retained active plans, terminal specs/briefs, historical doctrine, and the QA receipt. |
| Linked supporting detail | 12 | Current nonterminal-looking detail with one defensible topical backlog owner. |
| Orphaned or competing operational signal | 22 | Legacy `backlog`, proposed-source, or prompt-bearing documents with no verified single operational owner. They are migration debt and cannot dispatch. |

Root rules classify every retained document:

- `docs/plans/archive/*.md` is retained history. Historical prompts do not reopen work.
- Completed records under `docs/plans/active/` are link-retained history, not active tasks.
- Nonterminal-looking active plans, specs, briefs, and doctrine are supporting detail only when the
  mapping below is exact; otherwise they are orphaned migration debt.
- `docs/process/` contains reusable rules or dated evidence, `docs/history/` contains history, and
  current docs describe implemented truth. None owns task lifecycle.
- `docs/work-dashboard.md` is a deprecated snapshot. It must not be regenerated to decide status.
- Admin-created captures and quick notes are capture-inbox/triage records. Retained work must resolve
  to one Markdown backlog item before dispatch.

### Defensible supporting links

| Supporting document | One canonical backlog owner |
| --- | --- |
| [Runner Activity History frontend spec](../frontend-specs/2026-08-02-runner-activity-history-and-explainable-progress-experience.md) | [Runner Activity History And Explainable Progress Experience](2026-08-02-runner-activity-history-and-explainable-progress-experience.md) |
| [Runner Activity formula policy](../running-coach/2026-08-02-runner-activity-intelligence-formula-policy-amendment.md) | [Runner Activity Intelligence Foundation](2026-07-30-runner-activity-intelligence-foundation-architecture.md) |
| [Runner profile constitution](../running-coach/2026-07-30-hito-runner-profile-constitution.md) | [Runner Activity Intelligence Foundation](2026-07-30-runner-activity-intelligence-foundation-architecture.md) |
| [Provider activity ingestion brief](../product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md) | [Runner Activity Intelligence Foundation](2026-07-30-runner-activity-intelligence-foundation-architecture.md) |
| [Watch execution doctrine](../running-coach/2026-07-20-watch-execution-primary-target-doctrine.md) | [Watch-Executable Long-Run Strategies](2026-07-23-watch-executable-long-run-strategies.md) |
| [Manual constructor taxonomy](../running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md) | [Manual Workout Creation, Edit, Copy, And Recurrence](2026-06-04-manual-workout-creation-edit-copy-recurrence.md) |
| [Calendar rest-day add-affordance correction](../frontend-specs/2026-06-13-calendar-rest-day-add-affordance-correction-spec.md) | [Manual Workout Creation, Edit, Copy, And Recurrence](2026-06-04-manual-workout-creation-edit-copy-recurrence.md) |
| [Manual user-built-plan flow](../frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md) | [Manual Workout Creation, Edit, Copy, And Recurrence](2026-06-04-manual-workout-creation-edit-copy-recurrence.md) |
| [Narrow-screen readability contract](../frontend-specs/2026-07-31-hito-ds-narrow-screen-readability-contract.md) | [Hito DS Responsive Composition Reference](2026-07-31-hito-ds-responsive-composition-reference.md) |
| [Plan-vs-Run comparison spec](../frontend-specs/2026-07-31-post-upload-plan-vs-run-comparison-experience.md) | [Hito DS Responsive Composition Reference](2026-07-31-hito-ds-responsive-composition-reference.md) |
| [Source-size governance plan](../../plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md) | [Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md) |
| [Docs/artifact compression plan](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md) | [Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md) |
| [Hito DS Figma export history](../frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md) | [Hito DS Code-To-Figma Foundation Cleanup](2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md) |
| [Typography provenance spec](../frontend-specs/2026-07-23-hito-typography-provenance-and-inspector-preview-contract.md) | [Hito DS Code-To-Figma Foundation Cleanup](2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md) |
| [Local Inspector audit-tool contract](../frontend-specs/2026-07-09-local-inspector-ds-audit-tool-contract.md) | [Local Inspector DS Evidence And Batch Drafts](2026-07-21-local-inspector-ds-evidence-and-batch-drafts.md) |

The manual user-built-plan flow, Figma export, and typography-provenance specs are primarily retained
history; their mappings record provenance and do not add to the `12` linked-supporting-detail count
or reopen them.

### Explicit orphaned or competing signals

The following current-looking external records have no verified single canonical owner. Their old
status or prompt is inert until Product creates or selects one backlog item:

- active plans: `2026-05-25-admin-ui-capture-and-backlog-plan.md` and
  `2026-06-29-hito-ds-external-reuse-and-theme-contract.md`;
- frontend specs: `2026-05-05-hito-running-first-flow-spec.md`, `2026-05-06-hito-ds-spec.md`,
  `2026-05-07-calendar-page-refinement-spec.md`, `2026-05-20-changelog-ds-extraction-spec.md`, the
  three `2026-05-28-admin-capture-*` specs, `2026-06-13-modal-and-sheet-consistency-spec.md`, and
  `2026-07-24-public-auth-entry-landing-experience.md`;
- product briefs: the MVP, UI absorption, Design System priority, heart-rate-zone, Basic/Pro,
  Admin capture, cookie-consent, and first-plan-start-date briefs;
- Running Coach records: the old engine scenario matrix, old watch-executable workout library, and
  Hito DS workout-library specimen matrix.

`2026-05-06-ui-improvements-spec.md` is retained stale history because its own task says the broad
scope is superseded. It is not new work. The Public Auth spec now carries an explicit supporting-only
orphan banner and no longer projects `ready` or an executable handoff.

## Governance Decisions

- Only `docs/tasks/backlog/` item metadata owns operational lifecycle.
- Any lifecycle, next-role, next-step, or prompt text outside the backlog is artifact maturity or
  history and cannot dispatch independently.
- The Admin surface is a capture inbox and read-only repository mirror, not a second editable task
  system. Promoting retained intake to work is a Markdown backlog action.
- The current importer may continue to expose supporting/history source groups for audit, but a
  future Backend/Admin tooling correction must prevent those sources from becoming operational
  `ready_for_codex` rows.
- The active-plan dashboard generator remains a Backend/Admin tooling contradiction. Do not run a
  dashboard command to establish status; retire it or make it backlog-only in a separately accepted
  tooling slice.
- No active or archived plan was moved or deleted: all eight active plans have inbound links, and
  historical value remains even for archive plans without inbound references.

## Named Remaining Metadata Debt

| Debt | Owner | Consequence |
| --- | --- | --- |
| Active Local Inspector item lacks required conditional metadata | Frontend DevTools, then Product lifecycle closeout | Importer dry-run remains fail-closed; the plausible `in_progress` status is preserved without Architect altering the active task. |
| Code-To-Figma item lacks next role and exact handoff | Product with Design System owner | It remains visible as `ready` but cannot be dispatched. |
| 39 older backlog records use legacy path identity; 11 also contain tolerated invalid legacy fields | Architect migration debt, only when evidence/inbound need justifies normalization | They remain visible but are not upgraded into new work. |
| Runner Activity progress-fixture Stage still says release integration pending | Backend/Architect after its concurrent fixture-supersession edit closes | Status remains correctly `completed`; stale Stage must not reopen the task. |
| `docs/current-state.md` still mixes Admin storage truth with operational wording and ends in active-plan routing | Architect current-state owner after the concurrent change closes | The backlog rule remains canonical; current-state cannot dispatch, but wording should be shortened safely later. |
| `AGENTS.md` still describes dashboard adoption as a lifecycle projection over active-plan rows | Project instruction owner / Architect after its concurrent edit closes | The earlier single-operational-source rule remains controlling, but the lower dashboard paragraph must be made backlog-only before dashboard tooling work resumes. |
| Supporting-source importer readiness and active-plan dashboard generation remain reachable | Backend/Admin tooling | Current docs neutralize dispatch; structural prevention is not implemented in this documentation slice. |

## Validation Receipt

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Canonical metadata/importer dry-run | Local repository, no archive flag and no writes | Completed with a fail-closed metadata result | Zero duplicate IDs and exactly two current malformed canonical items, both named above. |
| Duplicate identity | Same dry-run | Passed | `duplicateWorkItemIdCount: 0`. |
| External classification | 77 task-root records plus 84 plans | Passed | 127 retained history, 12 linked supporting detail, 22 orphaned/competing signals. |
| Markdown links | `AGENTS.md` plus `docs/**/*.md`, local repository | Passed | `260` files and `604` local links checked; zero unresolved local-file links after correcting one moved-plan reference and replacing two deleted-component links with plain historical evidence. |
| Source-of-truth claims | Backlog, current docs, dashboard, external statuses/prompts | Passed for current dispatch authority with named tooling debt | Backlog-only and capture-inbox rules are explicit; the Public Auth competing `ready` signal is neutralized. |
| Scoped diff hygiene | Documentation-only reconciliation | Passed | No application source, runtime configuration, fixture, schema, migration, product data, or Git-history mutation belongs to this item. |

## History Decision

This is a documentation-governance repair, not a shipped product capability, so no public changelog
entry is appropriate. `docs/history/technical-log.md` is concurrently dirty for a separate accepted
Backend slice; this canonical item is the durable receipt rather than overlapping that file.
