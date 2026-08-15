# Hito Technical Log Last-Updated Validator Derived Invariant — 2026-08-15

## Work Item ID

2026-08-15-hito-technical-log-last-updated-validator-derived-invariant

## Status

completed

## Type

history-validator correctness

## Priority

high

## Owner

FRONTEND

## Frontend Lane

Marketing

## Mode

Tracked

## Parent

[Current Candidate Git Release And Vercel Verification — Retry 5](./2026-08-14-current-candidate-git-release-and-vercel-verification-retry-5.md)

## Scope

Correct the existing history validator so the Technical Log `Last Updated` header is verified
against the actual latest dated Technical Log section instead of a manually maintained date literal.
Preserve all established period, source-boundary, parser, route, and link contracts.

## Archive Intent

retain_in_place

## Task

Remove the stale hard-coded technical-log update date from the existing validator. Reuse the parsed,
already-sorted Technical Log sections to establish the latest exact daily period and assert that the
Markdown header matches it. This preserves a real coherence check while preventing every legitimate
new daily durable decision from blocking a later release merely because a second date literal was
not edited.

## User Report

Release retry 5 reached the History contract only after complete ownership admission and exact
staging. Ivan requires a root repair now, not another one-date substitution that will fail at the
next Technical Log update.

## Evidence

- [Retry 5](./2026-08-14-current-candidate-git-release-and-vercel-verification-retry-5.md) failed
  only because `scripts/validate-changelog-history-sync.ts` required `2026-08-11` while the
  Technical Log header and latest day section correctly state `2026-08-14`.
- `parseTechnicalLog()` already returns entries sorted by exact `period.sortKey`, preserves
  day/month/range distinctions, and exposes `period.kind` and `period.start`.
- [Changelog And Technical Log Read-Model Reconciliation](./2026-08-11-changelog-and-technical-log-read-model-reconciliation.md)
  assigns this validator and history read model to FRONTEND, Marketing lane.

## Observed Behavior

The validator contains `TECHNICAL_LOG_LAST_UPDATED = "2026-08-11"` and compares the live Markdown
header to that static literal. The Technical Log correctly contains a new `2026-08-14` durable
decision, so release admission fails even though the header and rendered chronology agree.

## Expected Behavior

The header remains mandatory and must equal the latest dated (day-kind) Technical Log decision.
Month and range entries remain factual historical periods and do not overwrite the header's exact
date contract. Existing required historical periods remain guarded.

## Source Investigation

- `scripts/validate-changelog-history-sync.ts:23-35,71-90` owns the stale literal and assertion.
- `src/lib/changelog-utils.ts:140-213` already provides the parser and header reader; no new
  parser, registry, document, or persistence owner is required.
- `docs/history/technical-log.md:4,25` supplies the observed header and current daily section.

## Demonstrated Root Cause

The first incorrect owner is the Marketing history validator: a static snapshot value was used for
a relationship that the current parsed Technical Log can determine directly. Updating only the
literal would preserve the root defect.

## What Not To Touch

- Do not alter the Technical Log content, changelog content, product-history digest, route UI,
  parser behavior, required historical period list, generated artifacts, Design System, backend,
  fixtures, or release implementation.
- Do not add a helper, config, registry, migration, compatibility path, dependency, browser test,
  or new date source.
- Do not stage, commit, push, deploy, mutate hosted state, or claim release acceptance.

## Validation Expectations

- Demonstrate the pre-change stale-literal failure and the derived invariant after the correction.
- `npm run validate-changelog-history`, focused Prettier, focused ESLint if applicable, and
  `git diff --check`.
- Browser/build/hosted checks are intentionally omitted because no rendered route or runtime asset
  changes. Return the release handoff only after the validator proof passes.

## Stage

FRONTEND Marketing root repair and focused source validation complete; return to PRODUCT for a
fresh release freeze.

## Next Recommended Role

PRODUCT

## Product Dispatch — 2026-08-15

```text
ROLE: FRONTEND

Frontend lane: Marketing
Mode: Tracked root repair
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-15-hito-technical-log-last-updated-validator-derived-invariant.md
Release evidence: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-14-current-candidate-git-release-and-vercel-verification-retry-5.md

Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, the complete canonical item, the complete Retry 5 receipt, and the completed Changelog And Technical Log Read-Model Reconciliation item before writing.

Repair the confirmed root cause in the existing Marketing history validator. The Technical Log Last Updated header must be checked against the latest parsed day-kind Technical Log section, not against a manually maintained static date. Reuse the existing parseTechnicalLog() result and getTechnicalLogLastUpdated() reader; do not add a helper, registry, config, or new source of truth. Preserve required historical period assertions and the factual month/range treatment.

First reproduce the current stale-literal failure. Then change only the proven validator seam and demonstrate: current Technical Log passes; a locally constructed or safely in-memory mismatched header/date relationship fails; and historical required periods remain enforced. Do not modify history documents, routes, parser behavior, generated artifacts, Design System, backend, fixtures, or foreign dirty hunks.

Run npm run validate-changelog-history, focused formatting/lint appropriate to the changed script, and git diff --check. Browser/build/hosted checks are out of scope because no runtime route or asset changes. Update only this canonical item with a truthful English receipt, then return a fresh-release handoff to PRODUCT. Do not stage, commit, push, deploy, or claim release acceptance. No subagent is required.
```

## Blockers

None known for this bounded source correction. A later release remains a separate fresh freeze.

## Frontend Execution Preflight — 2026-08-15

- **Observed failure:** `npm run validate-changelog-history` exits 1 with
  `Technical log Last Updated must be 2026-08-11.` while the protected Technical Log header and
  latest parsed day section both state `2026-08-14`.
- **First incorrect owner:** `scripts/validate-changelog-history-sync.ts` stores the relationship as
  the static `TECHNICAL_LOG_LAST_UPDATED` literal. The parser, route, and history documents are not
  incorrect owners.
- **Existing seam reused:** the validator already owns `technicalSections =
parseTechnicalLog(technicalMarkdown)` and `getTechnicalLogLastUpdated(technicalMarkdown)`. The
  smallest change derives the expected date from the first day-kind section in the existing sorted
  parse result and compares the existing header reader against it.
- **New production/runtime artifacts:** none. No helper, registry, config, parser branch, document,
  fixture, generated output, or second date source is proposed.
- **Net deletion:** remove only the stale `TECHNICAL_LOG_LAST_UPDATED` constant and its static
  comparison. Required historical period assertions and day/month/range parsing remain active.
- **Dirty boundary:** the validator has no pre-existing diff and the Git index is empty. History
  documents, route/parser source, release receipts, and all other dirty/untracked paths are foreign
  and remain byte-preserved.
- **Focused proof:** preserve the initial failing command; then prove the current corpus passes, an
  in-memory header/day mismatch fails through the same invariant, every required historical period
  remains enforced, focused formatting/lint passes, and `git diff --check` is clean.
- **Stop boundary:** return to PRODUCT if the correct result requires document, parser, route,
  Design System, Backend, fixture, generated-artifact, or release-lane changes.

## Frontend Tracked Implementation Receipt — 2026-08-15

### Stage, Outcome, And Root Cause

FRONTEND Marketing completed the bounded history-validator root repair. The initial source gate was
reproduced before implementation: `npm run validate-changelog-history` exited 1 with
`Technical log Last Updated must be 2026-08-11.` even though the protected Technical Log header and
latest parsed day section both state `2026-08-14`.

The first incorrect owner was the manually maintained `TECHNICAL_LOG_LAST_UPDATED` literal in
`scripts/validate-changelog-history-sync.ts`. The validator now derives the expected value from the
first day-kind section in its existing, sorted `parseTechnicalLog()` result and compares it with the
existing `getTechnicalLogLastUpdated()` header reader. Month and range sections remain factual
non-day periods and cannot become the exact Last Updated date. The existing required historical
period assertions remain unchanged and active.

### Files Changed And Reuse Budget

- `scripts/validate-changelog-history-sync.ts` — deleted the stale date constant and replaced only
  its assertion with the derived latest-day relationship.
- `docs/tasks/backlog/2026-08-15-hito-technical-log-last-updated-validator-derived-invariant.md` —
  recorded preflight, lifecycle, proof, and the Product handoff.

New production/runtime artifacts: none. No helper, registry, config, parser branch, date source,
fixture, generated output, route, Design System, Backend, document, or compatibility path was added.
History documents, parser/route behavior, release receipts, and all foreign dirty hunks were
preserved.

### Validation

| Check                         | Scenario / environment                                                                    | Result                | Evidence                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-change discriminator      | Current checkout before source write                                                      | Reproduced            | `npm run validate-changelog-history` exited 1 on the stale static `2026-08-11` requirement.                                                                                           |
| Current corpus                | Current protected history documents after repair                                          | Passed                | `npm run validate-changelog-history` reported 54 public dates / 362 entries and 10 Technical sections / 16 decisions; `lastUpdated` and the latest day period were both `2026-08-14`. |
| Header mismatch fail-closed   | In-memory Technical Log with header changed to `2026-08-13`; repository bytes unchanged   | Passed                | The same validator rejected it with `Technical log Last Updated must match the latest daily period 2026-08-14.`                                                                       |
| Historical-period fail-closed | In-memory Technical Log with the `2026-08-11` heading demoted; repository bytes unchanged | Passed                | The existing validator rejected it with `Technical log is missing required period 2026-08-11.`                                                                                        |
| Static literal deletion       | Changed validator source                                                                  | Passed                | `TECHNICAL_LOG_LAST_UPDATED` and the stale literal assertion have zero reachability; `latestTechnicalDay`, the existing header reader, and `REQUIRED_TECHNICAL_PERIODS` remain live.  |
| Formatting and lint           | Changed script and canonical item                                                         | Passed                | Focused Prettier and ESLint completed without findings.                                                                                                                               |
| Diff hygiene                  | Current checkout                                                                          | Passed                | `git diff --check` exited 0.                                                                                                                                                          |
| Browser/build/hosted          | Not applicable to this source-only validator repair                                       | Intentionally omitted | No runtime route, rendered asset, parser output, history document, fixture, or hosted contract changed; no browser, build, or hosted claim is made.                                   |

### Preserved Boundaries, Handoff, And Acceptance

No history document, route, parser, generated artifact, Design System source, Backend source,
fixture, dependency, Git index, remote, hosted state, or release implementation was changed. No
subagent was used.

The validator owner is terminal. PRODUCT is the next owner and may create and dispatch a completely
fresh release freeze from current bytes. Retry 5 remains a truthful historical blocked release
receipt; it must not be resumed as if its earlier admission, staging, or snapshots were current.
This receipt does not claim Global QA, release readiness, hosted parity, commit, push, deployment,
or production acceptance.
