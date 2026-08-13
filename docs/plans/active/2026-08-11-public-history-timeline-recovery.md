# Public History Timeline Recovery

## Status

active

## Canonical Work Item

[Changelog And Technical Log Read-Model Reconciliation](../../tasks/backlog/2026-08-11-changelog-and-technical-log-read-model-reconciliation.md)

## Owner

PRODUCT

## Problem

The compact-history migration preserved the correct principle—do not expose a multi-thousand-line
receipt mirror—but left two unusable read models:

- Highlights has only an August 11 release aggregate and a July 21 entry, omitting meaningful
  completed work periods in between.
- The route converts different source entries into the same category title/body, so distinct events
  appear as duplicate cards.
- Technical log has only four source periods after compaction; it needs a coherent durable-decision
  chronology, not a restored archive or generic timeline labels.

## Evidence Sources

1. `docs/tasks/backlog/` completed work items dated 2026-07-21 through 2026-08-11.
2. `git log` from `0ba6145` (July 21 core-release bundle) through confirmed production release
   `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d` (August 11).
3. Current `docs/history/changelog.md`, `docs/history/technical-log.md`, and
   `docs/history/product-history-digest.md`.
4. The exact deployed-release receipt:
   [Global QA Approved Production Release](../../tasks/backlog/2026-08-11-global-qa-approved-production-release.md).

## Corpus Rules

- Select only a meaningful completed product, Design System, reliability, or architecture event.
  Routine Lite paint changes, internal agent mechanics, fixture actions, and repeated proof runs are
  excluded.
- Event dates must be evidenced by a canonical completion/receipt or committed source change.
  Git only locates and dates candidates; it is not copy evidence by itself.
- A public Highlight uses source-specific title/body. Its category is classification only and must
  never replace the source event with a generic sentence.
- Highlights may record completed product history but must not imply every implementation date was
  a separate production deploy. The exact August 11 deployment remains the lone release claim.
- Technical log keeps only durable decisions, one concise entry per decision, with canonical links.
  It must not become the deleted 3,055-line mirror.
- Current local-only/uncommitted post-release work is excluded until a later factual release
  decision proves inclusion.

## Work Sequence

1. Build a candidate matrix in this plan: date, candidate, source evidence, public/technical/both,
   and inclusion or exclusion decision.
2. Product curates the two existing history documents from the accepted matrix.
3. Frontend Marketing replaces the category-boilerplate projection with source-specific card
   content, retains category affordance, and fixes the nested Technical day label.
4. QA compares source corpus to UI across desktop/mobile and themes.

## Candidate Matrix — Product Audit In Progress

| Factual date | Selected event | Evidence | Target source | Decision |
| --- | --- | --- | --- | --- |
| 2026-07-21 | Runner baseline and BPM setup | [baseline task](../../tasks/backlog/2026-07-21-onboarding-editable-baseline-chip-commit-and-contrast.md) and `0ba6145` core-release bundle | Highlight + Technical | Include: clear runner-facing onboarding improvement. |
| 2026-07-23 | Explicit generated-plan versus empty-manual-calendar choice | [plan creation task](../../tasks/backlog/2026-07-23-plan-creation-and-empty-manual-calendar-experience.md) and `3d61138` | Highlight + Technical | Include: fixes a material plan-creation branch. |
| 2026-07-30 / 2026-08-03 | Canonical activity History and factual Progress | [activity foundation](../../tasks/backlog/2026-07-30-runner-activity-intelligence-foundation-architecture.md), [Progress experience](../../tasks/backlog/2026-08-02-runner-activity-history-and-explainable-progress-experience.md), and released `550f602` | Highlight + Technical | Include once under its verified 2026-08-03 released bundle; do not duplicate the architecture/planning date. |
| 2026-07-31 | FIT file Plan-versus-Run readback | [activity-file acceptance](../../tasks/backlog/2026-07-31-activity-file-plan-vs-run-local-acceptance.md) | Highlight | Include: concrete evidence/readback surface. |
| 2026-08-05 | Completed FIT-backed workout feedback with elevation and retained raw evidence | [FIT presentation](../../tasks/backlog/2026-08-05-fit-backed-planned-workout-product-presentation.md) and `e5939bd` | Highlight + Technical | Include: user-visible completion/readback value. |
| 2026-08-06 | Shared DS typography and quiet-surface foundation | [DS foundation](../../tasks/backlog/2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md) | Technical | Include only as a durable UI-system decision; do not market it as a separate product release. |
| 2026-08-10 | Persisted runner-local timezone calendar truth | [timezone contract](../../tasks/backlog/2026-08-09-personal-runner-timezone-calendar-truth.md) and `23d657b` | Highlight + Technical | Include: completion receipt records implementation on August 10. |
| 2026-08-10 | Independent Calendar workouts and safe Copy/Paste | [calendar independence](../../tasks/backlog/2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md) | Highlight + Technical | Include: removes active-plan Calendar authority. |
| 2026-08-10 | Saved Plan library and Start | [saved-plan library](../../tasks/backlog/2026-08-10-saved-plan-library-ui-and-start.md) | Highlight + Technical | Include: runner can manage retained plan records without making them active authority. |
| 2026-08-11 | Exact released production bundle | [production release](../../tasks/backlog/2026-08-11-global-qa-approved-production-release.md), `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d` | Highlight + Technical | Include as the sole production-release assertion. |

### Current exclusions

- July 22 Inspector work, July 24 provider fixture work, July 29 operational/admin/agent work,
  August 1 release reconciliation, August 4–8 cleanup/proof/admin-mirror work, and post-release
  August 11 local-only visual/DevTools work are not candidate public events. They are either
  internal, not completed, already represented by a selected product outcome, or not proven inside
  the released SHA.
- Ready/blocked work is never promoted solely because its file date falls inside this period.
- The matrix remains an audit record, not a new runtime data source or a replacement archive.

## Exit Criteria

- The Highlights timeline has no unexplained July 21 → August 11 gap and no duplicate generic cards.
- Every displayed event traces to a verified source and factual date.
- Technical history is useful as an index of actual durable decisions without duplicating the public
  timeline or historical receipt archive.
- Existing route/tabs/links work without a new data source, parser family, registry, or CMS.
