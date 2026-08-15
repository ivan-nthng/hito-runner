# Changelog And Technical Log Read-Model Reconciliation

## Work Item ID

2026-08-11-changelog-and-technical-log-read-model-reconciliation

## Status

completed

## Type

public-history-read-model

## Priority

high

## Owner

frontend

## Lane

Marketing

## Mode

Tracked

## Scope

Restore one truthful `/changelog` experience from the existing history documents. Public
Highlights remain curated dated product history; Technical log remains a compact, evidence-linked
durable-decision index. Canonical backlog records and Git retain detailed history rather than a
second public or internal transcript archive.

## Archive Intent

retain_in_place

## Demonstrated Cause And Decision

The compact Technical log adopted titled days, months, and ranges, while the route reused a parser
that accepted only exact `## YYYY-MM-DD` headings. It therefore rendered zero accepted entries.
Later, category-level projection replaced distinct Highlight meaning with repeated boilerplate, and
Highlights and Technical log owned separate day-gutter renderers. These were stale read-model and
route-presentation contracts, not missing Backend data, Design System defects, or a reason to
restore the deleted multi-thousand-line mirror.

The accepted model is:

- [public changelog](../../history/changelog.md) — dated, user-facing product events;
- [technical log](../../history/technical-log.md) — compact technical periods and durable
  decisions without fabricated dates;
- [product history digest](../../history/product-history-digest.md) — orientation, not a third log;
- [timeline recovery audit](../../plans/active/2026-08-11-public-history-timeline-recovery.md) —
  source selection and exclusion evidence.

## Completed Outcome

- `src/lib/changelog-utils.ts` owns distinct public and technical parsing/projection. It preserves
  source-specific Highlight titles and summaries and accepts factual day/month/range Technical
  periods without inventing precision.
- `src/routes/changelog.tsx` preserves the two tabs and uses one route-owned `TimelineDayGutter`
  for every daily Highlight and Technical section. Day entries render semantic `<time>` content;
  month/range entries retain exact non-day labels.
- `scripts/validate-changelog-history-sync.ts` guards the three distinct document roles, local
  links, exact current period inventory, the shared day renderer, and `/change-log` redirect.
- The final factual corpus contained 54 public dates / 362 entries and 9 Technical sections / 15
  decisions. Daily Technical hierarchy rendered `2026 → August → 11`; `2026-07` and
  `2026-05 to 2026-06` remained exact.
- No CMS, JSON sidecar, registry, second parser, generic Markdown framework, Design System
  primitive, token, CSS recipe, compatibility data path, Backend change, or hosted mutation was
  introduced.

## Validation Evidence

| Check                | Accepted evidence                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source and validator | `npm run validate-changelog-history` passed with 54 public dates / 362 entries and 9 Technical sections / 15 decisions.                                   |
| Daily semantics      | Highlights and daily Technical entries used the same `<time>`, `dateTime`, full-date accessible label, and visible day. Non-day periods remained factual. |
| Desktop/mobile       | Managed `qa_fixture` passed at 1280×720 and exact 375×812 in Light and Dark with no horizontal overflow.                                                  |
| Interaction          | Keyboard tab focus/selection, evidence-link metadata, Hito navigation, and `/change-log → /changelog` passed.                                             |
| Console/runtime      | Browser warnings/errors were empty; the fresh client/SSR/Nitro fixture build was healthy and `receipt_matches` during focused proof.                      |
| Static               | Focused Prettier, ESLint, and `git diff --check` passed.                                                                                                  |

Focused Marketing Frontend Implementation DoD passed. This receipt does not claim Global QA,
release readiness, hosted parity, deployment, or production acceptance.

## Residual Boundary

Evidence-link destinations were not opened because hosted access was outside the task; rendered
metadata and local interaction were verified. Later unrelated DS/Admin writes made the shared
checkout artifact stale after the accepted replay, without invalidating that captured focused
artifact. Future history curation must keep events source-backed and must not represent local-only
work or implementation dates as independent deployments.
