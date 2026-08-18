# Hito Changelog Reader Content And Timeline Repair

Work Item ID: `2026-08-15-hito-changelog-reader-content-and-timeline-repair`
Status: backlog
Type: Lite — one Product route/read-model repair
Priority: high
Owner: FRONTEND
Epic: platform-and-operations
Frontend Lane: Product
Scope: Fix only the rendered `/changelog` reader so public highlights preserve their distinct source meaning, supported Markdown does not display literally, and valid Technical Log periods do not break timeline geometry.
Archive Intent: Retain until focused browser acceptance; compact on terminal closeout.
Evidence From: [History Compact Complete Ledger Reconciliation](./2026-08-15-hito-history-compact-complete-ledger-reconciliation.md)

## Task

Repair the three source-proven reader defects visible on `/changelog`:

1. Different Hito DS public entries are collapsed into the same generic title and body.
2. Technical Log `**emphasis**` appears as literal asterisks.
3. Valid month/range periods are rendered in the narrow day gutter and wrap into unreadable fragments.

The rendered page must be readable and specific without turning the public Changelog into a technical
ledger or requiring history authors to work around reader defects.

## User Report And Permanent Evidence

- Highlights duplicate `Improved / Hito DS Iteration` with identical text even though their source
  entries describe different accepted outcomes.
- Technical Log exposes raw Markdown and malformed date geometry.
- [Highlights duplicate capture](./assets/2026-08-15-hito-changelog-reader-content-and-timeline-repair/highlights-duplicate.png)
- [Technical Log capture](./assets/2026-08-15-hito-changelog-reader-content-and-timeline-repair/technical-log-raw-markdown-and-range.png)

## Source Investigation

- `src/lib/changelog-utils.ts` maps every `design_system` category to the same title and generic
  body; it discards the unique source entry when producing a highlight.
- `src/routes/changelog.tsx` `InlineMarkdown` supports only inline code and links. It renders any
  `**...**` segment as plain text.
- The same route renders every non-day `TechnicalLogPeriod.source` in a 3.75rem day-gutter column;
  `2026-05 to 2026-06` is valid parser output but cannot fit there.

## Expected Behavior

- Every public highlight uses concise, distinct, user-facing copy derived from its own source entry;
  a category may guide styling but must not replace meaning.
- The reader faithfully renders the documented supported inline grammar, including emphasis, code,
  and safe links, without introducing a new Markdown framework if existing local code can own it.
- Day, month, and range periods are all readable and semantically labelled at desktop and 375px;
  valid historical ranges must not be forced into the day gutter.

## Boundaries

- The active ARCHITECT history-compaction task owns the content inventory and documents. Do not edit
  `docs/history/*.md`, its canonical item, or the public/private content policy in this repair.
- Do not change the global parser contract, unrelated routes, Design System primitives, fixtures,
  hosted state, Git lifecycle, or release state.
- Reuse `changelog-utils.ts` and `changelog.tsx`; proposed new runtime artifacts: none.

## Focused Proof

- Source discriminators for distinct same-category highlights, emphasis/code/link rendering, and
  day/month/range period presentation.
- Fresh local browser replay of both tabs at 1470×801 and 375×812, Light/Dark: no literal Markdown,
  no duplicate generic summaries, readable date labels, no overflow, clean console, and working links.
- Focused formatting/lint and `git diff --check`.

## Promotion Condition

Promote to Tracked and return to PRODUCT if source inspection proves a parser/shared DS contract,
history-document policy, or a second production owner must change.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Changelog Reader Content And Timeline Repair
Mode: Lite
Frontend lane: Product
Canonical item: docs/tasks/backlog/2026-08-15-hito-changelog-reader-content-and-timeline-repair.md
Evidence: permanent screenshot captures in the task's assets directory.

Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md before
acting. Re-check the canonical item, active ARCHITECT history task, current source, and dirty
boundary before writing.

Fix only the source-proven `/changelog` reader defects:
1. `src/lib/changelog-utils.ts` currently collapses distinct Design System public entries into the
same generic title/body. Preserve each source entry's concise user-facing meaning; category may
style an entry but must not replace its meaning.
2. `src/routes/changelog.tsx` `InlineMarkdown` renders `**emphasis**` literally because it supports
only code and links. Reuse the existing route/read-model seam to render the supported inline grammar
safely; do not add a Markdown framework unless the current owner demonstrably cannot represent it.
3. Valid month/range Technical Log periods are forced into the narrow day gutter. Present day,
month, and range labels readably at desktop and narrow mobile without changing factual period truth.

The active ARCHITECT task owns `docs/history` content compaction. Do not edit those documents, its
canonical item, content policy, global parser contract, unrelated routes, DS primitives, fixtures,
hosted state, Git lifecycle, or release state. New runtime artifacts: none.

Prove the three existing discriminators in source and replay both tabs at 1470×801 and 375×812 in
Light/Dark: no duplicate generic summaries, no literal Markdown, readable dates, working safe links,
no overflow, and clean console. Run focused formatting/lint and git diff --check. Record a concise
English Lite receipt and return to PRODUCT. Promote and stop if a second production owner is needed.
```
