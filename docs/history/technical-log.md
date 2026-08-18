# Hito Technical Log

Status: active durable decision index
Last Updated: 2026-08-15
Owner: PRODUCT

## Coverage Rule

This is Hito's compact internal ledger. Each dated entry describes one durable outcome or one
coherent feature or release family in plain language. Links open the canonical evidence; Git keeps
the detailed chronology.

Routine receipts, superseded paths, no-op work, validation transcripts, and nonterminal tasks do
not become separate history entries. The [Product History Digest](./product-history-digest.md)
groups the foundational chronology, while the [Public Changelog](./changelog.md) contains only
shipped runner-facing highlights.

## 2026-08-15

- The 137-file integrated candidate shipped as
  `1ea13835ba8b9685c29091ff50d1cf7fedbd5438`, reached `41/41` migration parity, and produced a
  `READY` Git-backed Vercel deployment. Authenticated production behavior, providers, post-deploy
  QA, and Global QA were not claimed. See
  [Retry 7](../tasks/backlog/2026-08-15-current-candidate-git-release-and-vercel-verification-retry-7.md).

- Later accepted local work established `en` and `pt-BR` locale ownership, responsive and
  borderless State Surfaces, a shared Navigation Card, simpler Workout detail hierarchy, durable
  Rest persistence, and a deterministic disposable FIT prerequisite. These slices are grouped here
  without implying a later release. See
  [locale resolution](../tasks/backlog/2026-08-13-hito-ui-locale-profile-preference-and-server-resolution.md),
  [State Surface and Navigation Card](../tasks/backlog/2026-08-15-hito-ds-mobile-responsive-component-preview-batch.md),
  [Workout summary](../tasks/backlog/2026-08-15-hito-workout-overview-sidebar-summary-deduplication.md),
  and [Rest and FIT recovery](../tasks/backlog/2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery.md).

- Hito's terminal backlog and history were reduced to factual closeouts and grouped evidence
  instead of implementation diaries. The backlog compaction shipped as documentation-only commit
  `abd4fe8355e3c644095111a654c1560aa265d104`. See
  [terminal compaction](../tasks/backlog/2026-08-15-hito-terminal-backlog-maximal-closeout-compaction.md)
  and [history reconciliation](../tasks/backlog/2026-08-15-hito-history-compact-complete-ledger-reconciliation.md).

## 2026-08-14

- Hito adopted one backlog lifecycle, one execution owner, bounded same-owner autonomy, optional
  Markdown relationships, and a fail-closed release freeze. A complete 135-path audit then made
  whole-file ownership the release admission rule. See the
  [work-loop policy](../tasks/backlog/2026-08-12-hito-canonical-work-loop-autonomy-and-release-freeze-policy.md)
  and [owner map](../tasks/backlog/2026-08-14-release-candidate-exhaustive-owner-map-and-remediation-audit.md).

## 2026-08-13

- Hito's shared mark, favicon, shell material, surface ladder, and authenticated Product shell
  converged on canonical Design System ownership. See the
  [brand source](../tasks/backlog/2026-08-13-hito-logo-wordmark-symbol-and-favicon-update.md),
  [shell contract](../tasks/backlog/2026-08-13-hito-ds-canonical-app-shell-surface-and-header-contract.md),
  and [Product adoption](../tasks/backlog/2026-08-13-product-app-shell-surface-ladder-alignment.md).

- The reference library grouped Metadata Tag, Reference Link, State Surface, Data Table, mobile
  density, search, and navigation into shared contracts. The same architecture work fixed locale
  resolution at `en` and `pt-BR` while keeping authored content immutable. See the
  [reference batch](../tasks/backlog/2026-08-13-hito-ds-reference-contract-and-table-density-batch.md)
  and [locale decision](../tasks/backlog/2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery.md).

## 2026-08-12

- Brand references, marks, playground stages, specimen sizing, shared CSS ownership, validators,
  role boundaries, and source-of-truth policy converged on existing owners. The resulting 169-path
  candidate passed exact staging, source, build, hosted-parity, commit, push, and Git-backed Vercel
  gates. See [Design System CSS ownership](../tasks/backlog/2026-08-12-hito-ds-css-ownership-and-recipe-consolidation.md),
  [role alignment](../tasks/backlog/2026-08-12-hito-role-instruction-and-inter-role-handoff-alignment-audit.md),
  and [release Retry 2](../tasks/backlog/2026-08-12-current-candidate-git-release-and-vercel-verification-retry-2.md).

## 2026-08-11

- The runner Calendar release shipped as
  `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d` after assigned Global QA covered Backend, managed
  runtime, fixtures, Product and Design System contracts, desktop and 375px browser paths, and FIT
  protection. Supabase reached `40/40` parity and the Git-backed deployment reached `READY`; the
  deployment did not create a new Global QA claim. See
  [final Global QA](../tasks/backlog/2026-08-11-current-release-candidate-final-global-qa.md)
  and [production release](../tasks/backlog/2026-08-11-global-qa-approved-production-release.md).

## 2026-08-10

- Plans became immutable library and provenance records, while started workouts became independent
  runner-owned Calendar rows. The private Plans library can materialize eligible future work with
  explicit replacement and preserved history. See
  [Calendar independence](../tasks/backlog/2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md)
  and [Saved Plans](../tasks/backlog/2026-08-10-saved-plan-library-ui-and-start.md).

## 2026-08-09

- The primary Hito Button lost decorative perimeter chrome without weakening native interaction,
  and Local Inspector gained composite-link deep selection while keeping its sidebar
  non-interfering. See [Button chrome](../tasks/backlog/2026-08-09-hito-ds-primary-button-perimeter-chrome.md)
  and [deep selection](../tasks/backlog/2026-08-09-local-inspector-composite-link-deep-selection.md).

## 2026-08-07

- The repo-derived Admin work-item mirror and current-document references were reconciled without
  making Admin a second lifecycle authority. See
  [document reconciliation](../tasks/backlog/2026-08-07-admin-work-items-mirror-current-document-reconciliation.md).

## 2026-08-06

- Managed local QA gained source and build freshness evidence, stale artifacts began failing
  closed, shared typography and quiet surfaces moved to canonical Design System roles, and the
  Admin work-item mirror remained a read-only backlog projection. See
  [QA freshness](../tasks/backlog/2026-08-06-managed-qa-source-freshness-and-phase-timings.md),
  [shared foundation](../tasks/backlog/2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md),
  and [mirror synchronization](../tasks/backlog/2026-08-06-admin-work-items-repository-mirror-synchronization.md).

## 2026-08-05

- FIT-backed workouts began retaining raw evidence while exposing normalized observed facts,
  including elevation, separately from prescribed truth. Backend and Product seams, shared
  workbench controls, Admin lifecycle, and source-size governance were then reduced around their
  canonical owners. See [FIT completion](../tasks/backlog/2026-08-05-planned-workout-fit-completion-lifecycle.md),
  [Backend reduction](../tasks/backlog/2026-08-05-backend-codebase-reduction-cycle.md),
  and [Design System convergence](../tasks/backlog/2026-08-05-hito-ds-workbench-controls-and-validation-convergence.md).

## 2026-08-04

- Backend validation was separated into source, local database, built runtime, and release groups.
  The managed fixture gained a deterministic runner profile, Local Inspector stayed loopback-only,
  and Design System adoption proceeded in bounded families rather than duplicate UI systems. See
  [Backend proof simplification](../tasks/backlog/2026-08-04-backend-runtime-contract-and-proof-simplification.md),
  [runner fixture](../tasks/backlog/2026-08-04-canonical-local-runner-design-profile-fixture.md),
  and [Product control adoption](../tasks/backlog/2026-08-04-hito-ds-product-control-adoption.md).

## 2026-08-03

- Canonical activities, normalized metrics, provenance, comparisons, and scalable read models
  replaced duplicate aggregation and historical-backfill paths. See
  [Runner Activity Backend](../tasks/backlog/2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md).

## 2026-08-02

- Activity History and Progress began consuming canonical activities and factual snapshots, with
  planned and actual truth kept separate and missing evidence shown explicitly. A reusable local
  fixture established the later browser acceptance boundary. See
  [Product experience](../tasks/backlog/2026-08-02-runner-activity-history-and-explainable-progress-experience.md)
  and [review fixture](../tasks/backlog/2026-08-02-runner-activity-progress-review-fixture.md).

## 2026-08-01

- A mixed worktree was partitioned into four dependency-complete commits and fast-forwarded to
  `origin/main` while excluded local evidence remained untouched. See
  [release reconciliation](../tasks/backlog/2026-08-01-release-reconciliation-commit-push.md).

## 2026-07-31

- Activity File Dialog, mobile containment, status truth, and Plan, Run, and Difference readback
  passed their local acceptance layer. The same closeout established `docs/tasks/backlog/` as the
  only operational lifecycle authority. See
  [activity acceptance](../tasks/backlog/2026-07-31-activity-file-plan-vs-run-local-acceptance.md)
  and [work-item architecture](../tasks/backlog/2026-07-31-repository-work-item-architecture-audit.md).

## 2026-07-23

- Generated plan creation required an explicit goal and distance, while manual creation opened a
  separate empty Calendar. Weekly capacity and fixed rest days remained independently clearable,
  long-run strategies stayed aligned with the accepted provider contract, and loopback fixture and
  Inspector ownership became the local design evidence path. See
  [plan creation](../tasks/backlog/2026-07-23-plan-creation-and-empty-manual-calendar-experience.md),
  [runner preferences](../tasks/backlog/2026-07-23-optional-weekly-running-capacity-and-fixed-rest-days.md),
  and [design-suite continuity](../tasks/backlog/2026-07-23-local-design-suite-and-inspector-continuity.md).

## 2026-07-21

- Runner baseline and ordered heart-rate guidance became editable, clearable, and backend-owned
  before plan creation. Local Inspector remained a local evidence and prompt tool rather than an
  Admin writer or acceptance authority. See
  [baseline editing](../tasks/backlog/2026-07-21-onboarding-editable-baseline-chip-commit-and-contrast.md),
  [heart-rate guidance](../tasks/backlog/2026-07-22-heart-rate-zone-editor-ux-redesign.md),
  and [Inspector evidence](../tasks/backlog/2026-07-21-local-inspector-ds-evidence-and-batch-drafts.md).

## 2026-07

- Manual creation, persisted editing, preview, readback, and ordered repeat groups converged on one
  backend-reviewed workout-document grammar. Direct Calendar Move gained immediate projection and
  bounded Undo, shared action orchestration replaced duplicate flows, and Product accepted a
  deterministic training-process compiler boundary ahead of AI or local detail authoring. See the
  [July evolution](./product-history-digest.md#2026-07-07-to-2026-07-13-shared-workout-documents-calendar-move-ux-and-compiler-gate)
  and [compiler plan](../tasks/backlog/2026-07-13-hito-compiler-architecture-plan.md).

## 2026-06

- Manual plan creation, Add, templates, Copy and Paste, Clear and Delete review, Move, constructor
  UI, and JSON or Markdown export converged on backend-shaped mutation eligibility. Plan Presets
  became discovery cards rather than a second creation engine, while `/hitoDS` became the canonical
  specimen and Figma bridge. See the
  [manual authoring family](./product-history-digest.md#2026-06-09-to-2026-06-13-manual-builder-active-plan-editing-export-and-running-plan-quality),
  [preset family](./product-history-digest.md#2026-06-06-to-2026-06-07-plan-presets-and-no-active-plan-shortcuts),
  and [Design System cleanup](./product-history-digest.md#2026-06-15-to-2026-06-20-hito-ds-test-calendar-and-core-stack-simplification).

## 2026-05

- Hito moved from an imported preview baseline to Supabase-backed runner profiles, plans, workouts,
  logs, and evidence, with `training-plan-v2` as the canonical plan artifact. Login-first saved
  mode, FIT comparison, bounded AI interpretation, protected plan management, reviewed first-plan
  creation, and compact AI blueprint intent all converged on backend-owned persisted truth. See the
  [saved-mode foundation](./product-history-digest.md#2026-05-05-to-2026-05-12-baseline-import-and-saved-mode-foundation),
  [auth and feedback family](./product-history-digest.md#2026-05-13-to-2026-05-22-product-simplification-auth-feedback-and-entitlement-foundations),
  and [first-plan family](./product-history-digest.md#2026-05-23-to-2026-06-01-structured-first-plan-and-ai-blueprint-wave).
