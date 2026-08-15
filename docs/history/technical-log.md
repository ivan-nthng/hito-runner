# Hito Technical Log

Status: active durable decision index
Last Updated: 2026-08-14
Owner: PRODUCT

## Purpose And Source Boundary

This is the short internal index of accepted architectural, reliability, and user-impacting
outcomes. Detailed implementation receipts remain in their canonical backlog items; Git preserves
the full change history.

Include a log entry only for a shipped release, an accepted cross-owner contract, a lasting
architecture decision, a meaningful reliability/QA gate, or a source-cleanup outcome that removes
real responsibility. Routine Lite visual fixes belong in their task receipt, not here.

Use:

- [changelog](./changelog.md) for public shipped highlights;
- [product history digest](./product-history-digest.md) for architecture orientation;
- [current product](../current-product.md) and [current system](../current-system.md) for current
  implemented truth;
- canonical backlog items for evidence and full receipts.

## 2026-08-14 — Canonical Work Loop Adopted

- **Operating policy:** Hito adopted one canonical work loop, bounded autonomy, optional Markdown
  relationships, and a repository-wide fail-closed release freeze. A natural BACKEND repair and
  two fresh failed admission attempts demonstrated one-owner execution, failure recovery, and
  release isolation. The successful staged-pilot closure condition was waived only because the
  policy's own nonterminal files created a circular admission block; exact staged identity and
  `git diff --cached --check` remain mandatory for every future release. Evidence:
  [policy acceptance](../tasks/backlog/2026-08-12-hito-canonical-work-loop-autonomy-and-release-freeze-policy.md),
  [lifecycle audit](../tasks/backlog/2026-08-14-hito-backlog-lifecycle-reconciliation-and-terminal-archive.md).

## 2026-08-11 — Released Runner Calendar Bundle

- **Production release:** published `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d` on GitHub `main`.
  Linked Supabase reached `40/40` migration parity and the exact Git-backed Vercel production
  deployment reached `READY`. Evidence:
  [production release receipt](../tasks/backlog/2026-08-11-global-qa-approved-production-release.md).

- **Release acceptance:** the frozen local candidate passed the final Global QA inventory before
  release: Backend `20/20`, managed runtime `17/17`, canonical fixture convergence, Product/DS
  contracts, browser desktop/375px, and retained FIT protection. Evidence:
  [final local Global QA](../tasks/backlog/2026-08-11-current-release-candidate-final-global-qa.md).

## 2026-08-10 — Runner Calendar Truth And Saved Plans

- **Runner-local calendar truth:** a persisted IANA time zone determines server calendar dates for
  each runner. This removes dependence on process/UTC timezone while preserving date-only facts and
  protected history. Evidence:
  [timezone contract](../tasks/backlog/2026-08-09-personal-runner-timezone-calendar-truth.md).

- **Independent Calendar workouts and saved plans:** materialized workouts are runner-owned
  Calendar truth; saved plans are immutable library/provenance records. Copy/Paste preserves only a
  prescription, and Start materializes only eligible future work without changing protected
  history. Evidence:
  [calendar independence](../tasks/backlog/2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md),
  [saved-plan library](../tasks/backlog/2026-08-10-saved-plan-library-ui-and-start.md).

## 2026-08-06 — Shared Hito UI Foundation

- **Hito Design System:** neutral chrome, text hierarchy, shared controls, sliders, and theme
  contrast resolve through smaller semantic token roles instead of duplicate local recipes.
  Evidence:
  [neutral-chrome migration](../tasks/backlog/2026-08-11-hito-ds-tokenized-neutral-chrome-migration.md).

## 2026-08-05 — FIT Evidence Readback

- **FIT feedback readback:** a completed FIT-backed run exposes all available observed metrics,
  including elevation, while raw local evidence remains available for reprocessing. Evidence:
  [FIT presentation](../tasks/backlog/2026-08-05-fit-backed-planned-workout-product-presentation.md).

## 2026-08-03 — Canonical Activity History And Progress

- **Activity truth:** Activity History and Progress use canonical persisted activities and factual
  snapshots. Planned and unplanned activity remains separate, and unavailable evidence is explicit
  instead of locally inferred. Evidence:
  [activity foundation](../tasks/backlog/2026-07-30-runner-activity-intelligence-foundation-architecture.md),
  [Progress experience](../tasks/backlog/2026-08-02-runner-activity-history-and-explainable-progress-experience.md).

## 2026-07-23 — Explicit Generated And Manual Plan Creation

- **Plan creation:** generated plan creation requires a selected goal and distance. Building a plan
  yourself is a separate explicit route to an empty manual calendar; Advanced settings never choose
  the mode implicitly. Evidence:
  [plan creation contract](../tasks/backlog/2026-07-23-plan-creation-and-empty-manual-calendar-experience.md).

## 2026-07-21 — Runner Baseline And Heart-Rate Setup

- **Baseline editing:** first-time and returning runners can visibly set, validate, clear, and
  commit baseline Age, Height, and Weight inputs before plan creation. Evidence:
  [baseline contract](../tasks/backlog/2026-07-21-onboarding-editable-baseline-chip-commit-and-contrast.md).

## 2026-07 — Shared Workout Documents And Design-System Ownership

- Manual authoring, persisted editing, and readback converged on one backend-reviewed
  workout-document grammar rather than separate route-local formats. Evidence:
  [changelog — 2026-07-12](./changelog.md#2026-07-12).

- `/hitoDS` is the code-owned shared primitive and specimen surface. Product routes reuse its
  primitives but remain owners of persisted user behavior. Evidence:
  [product history digest](./product-history-digest.md#hito-ds-and-figma-bridge).

## 2026-05 To 2026-06 — Lasting Architecture Boundaries

- Backend validates, normalizes, persists, and protects runner truth; Frontend renders
  backend-shaped capabilities and never becomes schedule or evidence authority.
- AI can draft or explain only within backend validation and explicit review/confirm boundaries.
- Imported/provider evidence normalizes into canonical actual metrics before deterministic
  comparison or optional AI interpretation.
- Hito DS is the shared UI contract; local visual recipes are a migration/deletion target, not a
  second component system.

Current details and evidence are intentionally maintained in the documents linked above rather than
duplicated here.
