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

Restore a truthful, compact `/changelog` experience from the existing history documents:

- Highlights must show all current dated public release entries that the public changelog supplies.
- Technical log must render the compact durable-decision history that `docs/history/technical-log.md`
  now intentionally contains; it must never claim zero accepted slices when that document has
  accepted content.
- Reconstruct a truthful, scannable dated corpus for the completed, shipped Hito work between
  2026-07-21 and the confirmed 2026-08-11 release. The current two-date jump and repeated generic
  cards are not an acceptable history representation.
- History documents must remain short, useful to a new developer, and evidence-linked without
  returning to the deleted multi-thousand-line historical mirror.

This task owns the public history route/read-model, its source documents, and its parser/validator
contract as one factual system. It does not alter runtime product behavior, Design System, backend,
release state, canonical backlog receipts, or Git history.

## Archive Intent

retain_in_place

## Task

Reconcile the current compact history format with the frontend parser/rendering contract so the
visible `/changelog` tabs represent their actual sources faithfully. Keep public highlights curated
and dated; keep the technical log a compact internal decision index. Do not make either tab pretend
to be a complete terminal transcript.

The task completes only when the route, parser, validator, and documents agree in rendered
desktop/mobile states and no longer show the false empty Technical log seen in the report.

## User Report

On `/changelog`, the Technical log tab says `0 accepted slices`, `No updates yet`, and `No shipped
changes yet` even though history has been recorded. Ivan also sees an implausibly sparse Highlights
timeline around 2026-07-21 through 2026-08-11 and needs the current shipped history to be visible,
concise, and understandable.

User screenshot:

- `/var/folders/3y/5cpksv511mdbm91rqfggw76h0000gn/T/TemporaryItems/NSIRD_screencaptureui_xUJ1uE/Screenshot 2026-08-11 at 17.55.12.png`

## Observed Behavior

- `docs/history/technical-log.md` is now a compact durable decision index with headings such as
  `## 2026-08-11 — Released Runner Calendar And Foundations Bundle`, `## 2026-08`, and date ranges.
  It contains accepted release/architecture decisions and evidence links.
- `src/lib/changelog-utils.ts:parseChangelog()` accepts only headings matching exactly
  `^## YYYY-MM-DD$`.
- `src/routes/changelog.tsx` applies that public-changelog parser to both raw Markdown sources:
  `parseChangelog(technicalLogMarkdown)` supplies the Technical log tab, its entry count, date,
  and empty-state decision.
- Therefore no current technical-log heading matches the parser's strict grammar, so
  `technicalLogDays` is empty and the rendered screen truthfully follows the wrong parsed input:
  `0 accepted slices`, `No updates yet`, and the empty state.
- `scripts/validate-changelog-history-sync.ts` still requires the retired full historical-mirror
  shape, including every public date and the literal `HISTORICAL / migrated public changelog mirror`.
  It contradicts the approved compact-log direction and cannot validate the current source model.
- `docs/history/changelog.md` still contains dated public entries. Its rendered Highlights inventory
  must be measured after parser/read-model repair; source presence alone is not accepted as visual
  proof.

## Demonstrated Root Cause

The history-and-release consolidation changed the Technical log's intended information architecture
from a date-by-date public-changelog mirror to compact decision sections. The public route and
validator retained the old strict date-only parser and mirror invariants. This is a single stale
read-model/validation contract, not missing history and not a styling-only defect.

## Accepted Product Direction

### Public Highlights

- Source: `docs/history/changelog.md` only.
- Show concise, dated, user-facing highlights actually present in that document.
- Keep the established category/highlight filtering only when it represents the source correctly;
  do not silently collapse valid dated entries into an arbitrary three-item experience.
- Do not turn internal technical decisions, QA mechanics, agents, or local tooling into public
  release claims.

### Technical Log

- Source: `docs/history/technical-log.md` only.
- Render the compact durable-decision sections in their source chronology without fabricating a
  day for a month/range heading.
- Each rendered unit shows its factual source period/date, title when present, and linked concise
  decisions. It may have a distinct internal-history presentation from Highlights; it must not use
  a fake public-release date to reuse a parser.
- The route copy/count/last-updated language must match this compact decision index. Do not call it
  a complete per-slice ledger when the accepted document intentionally is not one.

### Documents

- Keep `technical-log.md` as one compact durable-decision index: released products, accepted
  cross-owner contracts, lasting architecture decisions, meaningful reliability/QA gates, and real
  source-cleanup outcomes only.
- Preserve the confirmed 2026-08-11 production release evidence and durable runner-calendar/FIT/DS
  decisions.
- Keep `changelog.md` as a concise dated public source; do not delete valid historical public
  dates just because the Technical log is compact.
- Keep `product-history-digest.md` as orientation, not a third duplicate log.
- Preserve canonical backlog items and Git as detailed evidence. Do not reconstruct the deleted
  3,000-line historical mirror or duplicate receipts into any history document.

## Existing Seams To Reuse

- `docs/history/changelog.md` — dated public Highlights source.
- `docs/history/technical-log.md` — compact technical decision source.
- `docs/history/product-history-digest.md` — architecture orientation source.
- `src/lib/changelog-utils.ts` — existing Markdown parsing, grouping, count, date, and entry
  presentation utilities. Evolve or split this owner narrowly; do not add a second route-local
  parser.
- `src/routes/changelog.tsx` — existing two-tab public route and empty-state rendering.
- `src/routes/change-log.tsx` — existing compatibility redirect; retain it.
- `scripts/validate-changelog-history-sync.ts` — existing source/route contract check. Replace
  retired mirror assumptions with factual compact-log invariants.
- `docs/tasks/backlog/2026-08-11-history-and-release-highlights-consolidation.md` — approved
  current history intent and release evidence boundary.

## Reuse-First Change Budget

- Reuse the current route, tabs, timeline components, Markdown import mechanism, parser/grouping
  owner, formatting utilities, history files, and validation script.
- New production artifacts: **none** by default. A separately typed technical-log parse result is
  allowed only when it lives in the existing changelog utility owner and removes the invalid
  date-only assumption rather than preserving a parallel route parser.
- Delete the obsolete full-mirror validator requirements and any route copy/empty-state assumption
  that describes the retired full-slice model.

## What Not To Touch

- Do not invent or restore undocumented history, version numbers, release dates, public claims, or
  migration/release assertions.
- Do not alter runtime runner behavior, Product routes besides `/changelog`/its redirect,
  persistence, auth, backend, schemas, Design System primitives/tokens, Figma, providers, hosted
  state, deployment settings, Git history, or canonical task receipts.
- Do not remove unrelated dirty work. Treat the current modified history files as candidate source
  under review, not as permission to discard or overwrite concurrent changes.
- Do not introduce a CMS, database, JSON sidecar, duplicate archival system, client-only fake
  records, or a generic Markdown framework.

## Definition Of Done

1. The Technical log tab renders the compact source's real entries/periods, has a nonzero factual
   count and last-updated state, and no false empty state.
2. Highlights renders the current valid dated public source across the preserved public history;
   visible count/dates are source-derived and not an unexplained three-item subset.
3. Public and internal source roles are distinct and concise: no revived full mirror, no
   duplicated receipt archive, and no technical material represented as a user-facing release.
4. Parser, route, validator, and all three history documents agree on the compact information
   architecture.
5. Existing tab keyboard behavior, `/change-log` redirect, desktop/mobile containment, themes,
   and browser console health remain intact.

## Validation Expectations

| Check                | Scenario / environment                             | Required evidence                                                                                                               |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Parser discriminator | Current `technical-log.md` headings                | The old strict parser's zero result is reproduced, then compact dated/month/range sections parse truthfully without fake dates. |
| Documents/read-model | Changelog, technical log, digest, route, validator | Source ownership, counts, dates/periods, last-updated text, and retained release evidence agree.                                |
| Highlights           | `/changelog`, existing public Markdown             | Every rendered date/count is traceable to valid public source; no unshipped/internal claims.                                    |
| Technical tab        | `/changelog`                                       | Nonempty compact decision history, source title/period, links, and no `No shipped changes yet` false state.                     |
| Browser              | Desktop and exact `375×812`, available themes      | Tabs, keyboard focus, redirect, links, overflow, and console health.                                                            |
| Static               | Task-owned docs/source/scripts                     | Relevant history validator, focused format/lint, `git diff --check`.                                                            |
| Build                | Fresh only if uncontended                          | Production build result, or a factual shared-build boundary.                                                                    |
| Fixture runtime      | QA server                                          | If stopped for proof, restart the managed `qa_fixture` server before final receipt.                                             |

## Stage

Frontend Marketing final acceptance completed on 2026-08-11.

## Next Recommended Role

product

## Exact Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Marketing
Mode: Tracked
Task: Reconcile the compact technical-log source with the `/changelog` read-model so the public
history page truthfully renders Highlights and Technical log instead of showing a false zero-entry
state.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-changelog-and-technical-log-read-model-reconciliation.md`

Read before the first write:
- `AGENTS.md`
- `agents/frontend.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item
- `docs/history/changelog.md`
- `docs/history/technical-log.md`
- `docs/history/product-history-digest.md`
- `docs/tasks/backlog/2026-08-11-history-and-release-highlights-consolidation.md`
- `src/lib/changelog-utils.ts`
- `src/routes/changelog.tsx`
- `src/routes/change-log.tsx`
- `scripts/validate-changelog-history-sync.ts`

Preflight and root cause: preserve unrelated dirty work. Reproduce the current failure first:
`parseChangelog()` accepts only exact `## YYYY-MM-DD` headings while the approved compact
technical log now uses titled dates, months, and ranges, so the route parses zero records. Fix the
read-model/validator contract at its existing owners; do not recreate the deleted full historical
mirror or patch the screen with placeholder data.

Reuse the existing Markdown sources, route, tabs, parser/grouping utilities, timeline composition,
redirect, and validator. Keep public dated Highlights and compact internal Technical log as distinct
truthful views. If different period precision needs a distinct parse result, keep it in the existing
`src/lib/changelog-utils.ts` owner rather than adding route-local or hand-maintained data.

Use one bounded read-only QA/browser subagent after your own source proof. If useful, use one
bounded read-only documentation/copy review before editing the history documents; do not delegate
implementation. Complete the task before returning: the route, history documents, and validator
must agree; the Technical tab must not show zero/empty falsely; public Highlights must show all
valid source-derived dated entries without presenting internal work as shipped features.

Validate the source discriminator, relevant history validator, docs links, static hygiene, desktop
and exact `375×812` browser behavior in available themes, keyboard tabs, `/change-log` redirect,
rendered counts/periods, overflow, and console health. Run a production build only if uncontended.
If your work stops the fixture QA server, restart it before your receipt.

Do not stage, commit, push, deploy, alter hosted state, call providers, delete material data, touch
backend/Product/DS code outside the stated history seams, or change canonical backlog receipts.
Use Russian for visible in-progress commentary. Record the final formal receipt in English in the
canonical item with source-model decision, changed files, validation, and any remaining boundary.
```

## Blockers

None. The historical private Admin snapshot artifact gate below was resolved before final
acceptance: the managed `qa_fixture` reported `healthy`, `compatible`, `receipt_matches`, and a fresh
artifact at `http://127.0.0.1:3000/`.

## Frontend Implementation Receipt — 2026-08-11

### Task and stage

Marketing Frontend, Tracked. The source-model implementation is complete; the item remains
`in_progress` only for the fresh managed browser replay described above. This is not Global QA
Acceptance or release readiness.

### Preflight and root cause

- **Visible symptom:** the Technical log tab rendered `0 accepted slices`, `No updates yet`, and the
  false empty state despite accepted technical history.
- **Demonstrated cause:** `parseChangelog()` intentionally accepts only exact `## YYYY-MM-DD`
  headings. The compact technical source uses a titled day, months, and a month range, so that
  parser returned zero sections.
- **First incorrect owner:** the public-history read model and its validator contract, not missing
  history, backend data, or route styling.
- **Reused seam:** `src/lib/changelog-utils.ts`, the existing route/tabs/timeline, raw Markdown
  imports, the `/change-log` redirect, and the existing validator. New runtime artifacts: none.

### Source-model decision

- `docs/history/changelog.md` stays the dated public source. Its complete current source inventory
  now renders as 49 dated days and 359 source-derived Highlights; no category deduplication or
  arbitrary per-day cap silently hides valid public entries.
- `docs/history/technical-log.md` stays the compact durable-decision index. Its four actual source
  periods (`2026-08-11`, `2026-08`, `2026-07`, and `2026-05 to 2026-06`) parse as typed day, month,
  and range sections without manufacturing a day. The route renders their source period, title,
  linked evidence, and 14 durable decisions.
- `docs/history/product-history-digest.md` remains orientation. The validator now guards all three
  documents' distinct public/technical/orientation roles and their local links; no retired mirror
  or receipt archive was restored.

### Files changed

- `src/lib/changelog-utils.ts` — compact technical-period parser/grouping/count/readback metadata;
  public Highlight projection now retains every public source entry.
- `src/routes/changelog.tsx` — distinct Technical-log timeline/copy/count/last-updated view and
  Markdown evidence links, while preserving the existing tabs, timeline composition, and redirect.
- `scripts/validate-changelog-history-sync.ts` — compact-index invariants, all-history role checks,
  local Markdown links, and retained redirect/source checks.
- `docs/history/changelog.md` — corrected the public cross-link wording from a complete ledger to a
  compact internal decision index. The pre-existing compact technical log and digest were reviewed,
  not expanded or reconstructed.

### Preserved boundaries

No backend, auth, persistence, schema, Design System primitive/token, Figma, provider, hosted,
deployment, Git, or canonical historical receipt was changed. Unrelated dirty work remains
untouched.

### Validation inventory

| Check                      | Scenario / environment                             | Result                     | Evidence                                                                                                                                                      |
| -------------------------- | -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-cause discriminator   | Current technical source before/after parser split | Passed                     | Retired exact-day parser returned `0`; `parseTechnicalLog()` returns 4 factual sections / 14 decisions                                                        |
| Public Highlights          | Current public Markdown                            | Passed                     | 49 dated days / 359 entries and 359 rendered source-derived Highlights; latest `2026-08-11`                                                                   |
| Route/docs/validator       | Current sources and redirect                       | Passed                     | `npm run validate-changelog-history` passed; validates source roles, periods, local links, shared parser, Technical timeline, and `/change-log -> /changelog` |
| Static hygiene             | Task-owned source/docs                             | Passed                     | Targeted Prettier, ESLint, and `git diff --check` passed                                                                                                      |
| Production compilation     | Uncontended local build                            | Partial                    | Client and SSR compilation completed; postbuild managed artifact remained invalid because the unrelated private Admin snapshot marker was absent              |
| Managed fixture restart    | `qa_fixture` after build cleanup                   | Blocked                    | `npm run qa:server:start` rebuilt but left `qa:server:status` stopped/stale (`artifact_missing`)                                                              |
| Independent QA             | Read-only QA subagent                              | Passed for source contract | Independent parser/validator/static review passed; no files changed                                                                                           |
| Browser visual/interaction | Desktop, exact 375×812, available themes           | Not run                    | No fresh healthy managed runtime; tabs, redirect navigation, links, overflow, and console require replay                                                      |

### Remaining boundary

After the shared private Admin snapshot artifact gate is repaired, run the existing managed
`qa_fixture` and replay `/changelog` and `/change-log` on desktop and exact `375×812` in available
themes. Verify Highlights and Technical rendered counts/periods, keyboard tabs, evidence links,
overflow, and console health. The current local source proof does not claim that browser result.

## Frontend Marketing Final Acceptance Receipt — 2026-08-11

### Task and stage

Marketing Frontend, Tracked, final acceptance and closure. The implemented public-history read
model now has fresh managed browser evidence and this item is `completed`. This receipt covers the
assigned implementation acceptance only; it does not claim Global QA Acceptance, release
readiness, deployment, or hosted verification.

### Acceptance result

- The current public source renders 49 dated days and 359 Highlights, with `August 11, 2026` as the
  visible last-updated state.
- The compact technical source renders 14 decisions across its four factual periods:
  `2026-08-11`, `2026-08`, `2026-07`, and `2026-05 to 2026-06`.
- Highlights and Technical log remain nonempty in the managed runtime. The false `No shipped
changes yet` state does not render.
- The existing Hito tabs retain keyboard focus/selection behavior. The internal Hito link navigates
  to `/`, `/change-log` redirects to `/changelog`, and technical evidence links retain their source
  GitHub `href` values with `target="_blank"`.

### Validation inventory

| Check                   | Scenario / environment                                                         | Result | Evidence                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed fixture         | Local `qa_fixture` at `127.0.0.1:3000`                                         | Passed | `healthy`, `compatible`, loopback-bound, fresh `receipt_matches` artifact                                                                                  |
| Highlights read model   | `/changelog`, 1280×720 and exact 375×812                                       | Passed | 359 rendered `[data-highlight-kind]` entries; 49 source dates; latest and visible last-updated date `2026-08-11` / `August 11, 2026`; no false empty state |
| Technical read model    | Technical log tab, 1280×720 and exact 375×812                                  | Passed | 14 rendered timeline articles; all four source periods visible; 12 rendered GitHub evidence links; no false empty state                                    |
| Themes and containment  | Light, Dark, and available System mode at desktop and exact 375×812            | Passed | Correct computed color scheme; document `scrollWidth` equals `clientWidth` at 375 px and no horizontal overflow at desktop                                 |
| Keyboard tabs and focus | Highlights tab focused, `ArrowRight`                                           | Passed | Focus moved to Technical log, `aria-selected` changed from Highlights to Technical log, and the 14-record panel rendered                                   |
| Navigation              | Header link and legacy alias                                                   | Passed | Hito link navigated to `/`; `/change-log` resolved to `/changelog` with the 359-entry Highlights view                                                      |
| Console health          | Complete focused browser replay                                                | Passed | Managed browser log inventory remained empty                                                                                                               |
| History validator       | Current parser, sources, route, and alias                                      | Passed | `npm run validate-changelog-history`: 49 dates / 359 public entries, 4 periods / 14 technical decisions, valid alias and route source bindings             |
| Static hygiene          | Changed parser, routes, validator, three history documents, and canonical item | Passed | Focused Prettier check, ESLint, and `git diff --check` exited 0                                                                                            |

### Preserved boundaries and omitted checks

No parser, route, validator, history source, shared Design System, Backend, fixture data, hosted
state, provider, Figma, Git staging/commit/push, deployment, or release state was changed during
this acceptance pass. The fixture theme was restored to Dark after the matrix. No required focused
check was omitted; a broad cross-product Global QA matrix and hosted/release verification were
outside this task and remain unclaimed.

### Verdict

Passed. The Marketing Frontend implementation acceptance criteria are satisfied and the canonical
item is complete.

## Product Supersession — Historical Corpus And Presentation Recovery — 2026-08-11

### User report

The Highlights tab currently jumps from August 11 straight to July 21 and repeats visually
identical entries on August 11. Ivan requires the meaningful completed history since July 21 to be
represented with correct dates, unique summaries, and factual technical decisions. The Technical
log must use the same coherent chronology while remaining a compact decision index.

User evidence:

- `/var/folders/3y/5cpksv511mdbm91rqfggw76h0000gn/T/TemporaryItems/NSIRD_screencaptureui_OkaCFb/Screenshot 2026-08-11 at 20.02.54.png`

### Confirmed source facts and root causes

1. The current uncommitted `docs/history/changelog.md` has a release aggregate at `2026-08-11` and
   then jumps to `2026-07-21`; it omits the real completed work periods represented by repository
   history and canonical tasks from July 22 through August 10.
2. `src/lib/changelog-utils.ts:getHighlightTitle()` and `getHighlightBody()` replace every entry in
   the same category with the same generic title and boilerplate body. Distinct Calendar entries
   consequently render as visually indistinguishable `Calendar & Workout Identity` cards. This
   is the first incorrect runtime owner for the duplicate-card symptom; browser layout and the DS
   only render that already-lost source meaning.
3. `src/routes/changelog.tsx:formatTechnicalLogPeriod()` returns the full day source string after
   parent Year and Month timeline levels already render it. The narrow `2026 | August | 11`
   correction recorded below remains required, but is now part of this complete recovery.
4. The prior history consolidation intentionally reduced `technical-log.md` from a 3,055-line
   historical mirror to a 90-line durable index. That deletion was correct; the error is that the
   new public/technical source corpus and the presentation did not retain a usable chronological
   bridge to the supported completed history.

### Product decision

Use a single factual event corpus derived from existing canonical evidence, not route-local generic
copy or a revived terminal archive.

- **Highlights** are concise product-history events. Their date is the verified completed or
  committed implementation date, not a claim that every date was an independent production deploy.
  Route language must not call these per-date entries separate “shipped” releases.
- **Technical log** is the compact, evidence-linked index of durable product, architecture,
  reliability, and release decisions. It is not a duplicate public changelog and must not restore
  receipt boilerplate or every Lite visual patch.
- A public or technical source event must trace to a canonical completed item and/or a committed
  repository change. Git commit dates locate candidates; they do not authorize inventing feature
  claims. Any uncommitted or later local-only work remains excluded from the public history.
- Every distinct candidate appears at most once within its source document. The category remains a
  compact classification/badge; the card title and body must carry the specific source event rather
  than category boilerplate.

### Required execution sequence

1. **Product corpus audit:** inspect the canonical completed tasks and repository history from
   2026-07-21 through `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d`. Record the selected events,
   their factual dates, canonical evidence, and exclusion reasons in the supporting plan
   [public-history timeline recovery plan](../../plans/active/2026-08-11-public-history-timeline-recovery.md).
2. **Product source curation:** update only the existing `changelog.md` and `technical-log.md`
   with that approved corpus. Keep the former concise and the latter durable; do not recreate the
   3,055-line mirror or an intermediate JSON/registry/archive.
3. **Frontend Marketing projection:** at existing parser/route/validator seams, render specific
   source titles/bodies with category classification, remove the stale generic-copy projection,
   retain factual non-day Technical periods, and render a day precision as `11` below its existing
   parent `2026` and `August` labels.
4. **Independent QA:** prove source-to-screen uniqueness, chronology, technical coverage, desktop
   and exact 375px containment, themes, keyboard tabs, links, and console health.

### Boundaries

- Do not rewrite runtime history storage, add a CMS, a JSON sidecar, a registry, a second parser,
  a generic Markdown framework, or a hidden archive.
- Do not use Design System work as a workaround; shared DS primitives/tokens are not the cause.
- Do not backdate or represent local/uncommitted inspector, DS, or visual work as released history.
- Do not alter Backend, persistence, release/hosted state, Figma, Git history, or unrelated dirty
  work.

### Validation expectations

| Check                | Scenario / environment                   | Required evidence                                                                                                                    |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Corpus audit         | 2026-07-21 through released SHA          | Each selected event has a factual date, canonical evidence, source placement, and no duplicate identity; exclusions are recorded.    |
| Source projection    | `changelog.md` and `technical-log.md`    | Unique source event text survives into cards; category boilerplate cannot replace distinct meaning.                                  |
| Date hierarchy       | Highlights and Technical at `/changelog` | Real dated periods appear in descending chronology; a day displays only below its existing year/month parent (`2026 → August → 11`). |
| Public-release truth | Release and local-only candidates        | No uncommitted local work or false per-day deployment claim appears.                                                                 |
| Route contract       | Existing parser, route, validator        | Counts, source period precision, links, and empty state agree without a new data layer.                                              |
| Browser              | Desktop, exact 375×812, available themes | No duplicate visible cards for the same selected event, tabs/links work, no horizontal overflow or console errors.                   |

### Stage and next role

Product corpus audit is active. The earlier Lite day-label correction is superseded as a standalone
handoff and will be delivered with this coherent source recovery. Frontend Marketing must not be
interrupted from its active DevTools task; it receives the execution handoff only after Product
curation closes and that role is idle.

### Product source-curation result

The corpus audit is complete. The existing public source now contains the selected factual product
events at `2026-07-21`, `2026-07-23`, `2026-07-31`, `2026-08-03`, `2026-08-05`, `2026-08-10`, and
the one deployment assertion at `2026-08-11`. The compact technical source now indexes the
corresponding durable decisions at `2026-07-21`, `2026-07-23`, `2026-08-03`, `2026-08-05`,
`2026-08-06`, `2026-08-10`, and `2026-08-11`, while retaining the older July and May–June
architecture periods.

The candidate and exclusion evidence is retained in the supporting
[public-history timeline recovery plan](../../plans/active/2026-08-11-public-history-timeline-recovery.md).
No local-only post-release work was included.

`npm run validate-changelog-history` now fails only because its stale contract requires a synthetic
month-only `2026-08` Technical period. The curated source uses factual dated sections instead. Do
not reintroduce a fake month heading to satisfy that stale validator; correct the existing validator
in the same Frontend Marketing slice.

### Stage

Product curation complete; Frontend Marketing execution ready. Do not interrupt the active
Frontend DevTools task. This supersedes the earlier narrow day-label handoff.

### Next Recommended Role

FRONTEND — Marketing

### Exact Frontend Handoff — Historical Timeline Recovery

```text
ROLE: FRONTEND

Frontend Lane: Marketing
Mode: Tracked

Task: Complete the factual public-history timeline recovery for `/changelog`.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-changelog-and-technical-log-read-model-reconciliation.md`

Supporting Product audit:
`/Users/ivan/Developer/hito-running/docs/plans/active/2026-08-11-public-history-timeline-recovery.md`

Read before the first write:
- `AGENTS.md`
- `agents/frontend.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item and supporting plan
- `docs/history/changelog.md`
- `docs/history/technical-log.md`
- `src/lib/changelog-utils.ts`
- `src/routes/changelog.tsx`
- `scripts/validate-changelog-history-sync.ts`

Preflight and root cause:
- Product has already curated the only allowed source events. Preserve those documents exactly
  unless a factual link/format correction is required; do not add local-only or unverified work.
- `getHighlightTitle()` and `getHighlightBody()` in `src/lib/changelog-utils.ts` collapse distinct
  source entries into identical category boilerplate. This is the demonstrated cause of repeated
  August 11 cards. Category remains a compact classification/badge, but every rendered card must
  preserve its source-specific title and summary.
- `formatTechnicalLogPeriod()` in `src/routes/changelog.tsx` currently prints full `2026-08-11`
  beneath already-rendered parent `2026` and `August`. A day period must show only `11` using the
  existing `formatDayLabel(period.start)` utility. Do not invent a day for month/range periods.
- The current history validator falsely requires a month-only `2026-08` Technical section. Replace
  that stale assertion with the factual dated-period contract in the curated document; do not add
  a synthetic heading just to make the check pass.

Required outcome:
1. Reuse the existing parser, grouping utilities, route, tabs, timeline, Markdown imports, and
   validator. New runtime artifacts, data stores, parsers, registries, CMS records, or generic
   Markdown frameworks: none.
2. Render one card per selected source event with its distinct source meaning. Do not hide real
   duplicates through a display-only dedupe set; source curation already removes duplicate event
   records. Do not use static category copy as the card body.
3. Keep the existing small category/badge vocabulary where useful, but it cannot replace the
   event-specific title/body. Avoid language that calls every historical implementation date an
   independent deployment; only August 11 is the recorded production-release claim.
4. Render the Technical hierarchy as year → month → day for day-precision sections, e.g.
   `2026 | August | 11`. Preserve exact month/range precision without fabricated dates.
5. Keep evidence links, keyboard tab behavior, `/change-log` redirect, all theme behavior, and
   responsive containment. Do not change shared Design System source, Product/Backend, the
   Inspector, Figma, hosted state, or unrelated dirty work.

Validation:
- Source discriminator: the selected public and technical events remain unique and traceable to
  the curated Markdown; generic Calendar boilerplate cannot render as the summary of more than one
  distinct selected event.
- Validator: update the existing validator to accept the curated dated Technical periods rather
  than requiring `2026-08`; it must reject a false empty source and preserve source/route bindings.
- Browser: `/changelog` Highlights and Technical at desktop and exact 375×812 in available themes;
  chronology shows the selected July 21–August 11 events, August 11 release card is distinct,
  Technical daily rail is `11` rather than `2026-08-11`, tabs/links/redirect work, no horizontal
  overflow or console errors.
- Run focused Prettier, ESLint, history validator, and `git diff --check`; build only if
  uncontended. Leave `qa_fixture` running after proof.

Use one bounded read-only QA/browser subagent after your own focused proof. Do not stage, commit,
push, deploy, call providers, alter hosted state, or mutate fixture data. Use Russian for
in-progress commentary; append an English tracked implementation receipt to the canonical item.
```

## Product Correction — Technical Timeline Day Label — 2026-08-11

### New user report

On the Technical log tab, the nested time rail repeats the full source value `2026-08-11` beside
the already-rendered year `2026` and month `August`. The intended hierarchy is:

```text
2026 | August | 11 | Released Runner Calendar And Foundations Bundle
```

User evidence:

- `/var/folders/3y/5cpksv511mdbm91rqfggw76h0000gn/T/TemporaryItems/NSIRD_screencaptureui_2vChaS/Screenshot 2026-08-11 at 20.01.52.png`

### Source investigation and confirmed cause

- `src/routes/changelog.tsx:260-267` renders the third timeline rail through the route-local
  `formatTechnicalLogPeriod(section.period)`.
- `src/routes/changelog.tsx:434-436` currently returns `period.source` unchanged. For a day
  section, that is the full ISO source string `2026-08-11`.
- `YearSection` and `MonthSection` already render `2026` and `August` in the preceding hierarchy
  columns. The duplication is therefore route-local read-model formatting, not a shared Design
  System primitive, token, or typography defect.

### Required correction

- Keep the Technical log parser and factual period model unchanged.
- For `period.kind === "day"`, render only the day-of-month using the existing
  `formatDayLabel(period.start)` utility. Preserve a full-date accessible label/dateTime if the
  existing semantic element permits it.
- Keep month-precision and range-precision sections factual. Do not fabricate a day, rewrite their
  source periods, or change chronology as part of this narrow correction.
- Preserve the existing Year → Month → day timeline composition, all titles, evidence links,
  keyboard tabs, themes, and responsive layout.

### Scope and boundary

This is a small Frontend **Marketing** correction at the existing `/changelog` route owner. It is
not Design System work: do not edit shared DS source, CSS, tokens, typography roles, Foundations,
Product routes, Backend, history Markdown, parser utilities, validators, or the prior accepted
read-model contract. New runtime artifacts: none. No obsolete path is added or retained.

### Stage

Frontend Marketing corrective implementation is ready. The Frontend role is currently completing
an unrelated active DevTools task and must not be interrupted; dispatch this correction when that
task has returned idle.

### Next Recommended Role

FRONTEND — Marketing

### Exact Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Marketing
Mode: Lite

Task: Correct the duplicate technical-log date in the existing `/changelog` timeline.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-changelog-and-technical-log-read-model-reconciliation.md`

Read before the first write:
- `AGENTS.md`
- `agents/frontend.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- the complete canonical item, especially “Product Correction — Technical Timeline Day Label”
- `src/routes/changelog.tsx`
- `src/lib/changelog-utils.ts`
- `docs/history/technical-log.md`

Confirmed root cause and canonical seam:
- `TechnicalLogSectionView` at `src/routes/changelog.tsx:260-267` renders the nested time rail.
- Its local `formatTechnicalLogPeriod()` at `src/routes/changelog.tsx:434-436` returns the full
  `period.source`. For the daily release it outputs `2026-08-11` after the parent timeline already
  outputs `2026` and `August`.

Implement the smallest route-local correction. For a `day` period, render only the day number with
the existing `formatDayLabel(period.start)` utility, yielding `2026 | August | 11`. Keep the typed
period model and parser unchanged. Preserve exact factual source handling for month and range
periods; do not invent a day or alter their labels. Do not change history Markdown, validators,
shared Design System source/CSS/tokens, Product/Backend, or any unrelated dirty work. New runtime
artifacts: none.

Validate the reported daily section at desktop and exact 375×812 in the available themes: the
visible hierarchy is year → month → day only; there is no `2026-08-11` duplicate in the nested
rail; title, evidence links, keyboard tabs, responsive containment, and console health are
preserved. Run focused formatting/lint/diff checks. Use an uncontended build only if needed. Leave
the managed `qa_fixture` server running after proof.

Do not stage, commit, push, deploy, call providers, alter hosted state, or mutate fixture data.
Use Russian for visible in-progress commentary and record an English Lite receipt in this item.
```

## Frontend Marketing Lite Correction Receipt — 2026-08-12

### Task and mode

Frontend Marketing, Lite. The route-local implementation is complete. The item remains
`in_progress` only because the required rendered browser replay could not be completed through the
available safe browser path; this is not Global QA Acceptance or release readiness.

### Outcome and evidence

- **Visible symptom:** the Technical log day gutter repeated `2026-08-11` below the existing `2026`
  and `August` hierarchy.
- **Demonstrated cause:** the existing route-local `formatTechnicalLogPeriod()` returned
  `period.source` for every precision, including a typed `day` period.
- **Correction:** `day` periods now reuse `formatDayLabel(period.start)`. Month and range periods
  continue to return their exact `period.source`; no day is fabricated.
- **Owner and seam:** Frontend Marketing presentation in `src/routes/changelog.tsx`. The parser,
  grouping model, history Markdown, validator, shared Design System, and Highlights remain
  unchanged. New runtime artifacts: none.

### Files changed

- `src/routes/changelog.tsx` — one route-local formatter branch.
- This canonical item — lifecycle and compact Lite receipt only.

### Focused proof

| Check                | Scenario / environment                                    | Result               | Evidence                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator | Current `technical-log.md` typed periods                  | Passed               | Seven day periods project to `11`, `10`, `06`, `05`, `03`, `23`, and `21`; month `2026-07` and range `2026-05 to 2026-06` retain their exact source strings.                                                                                                                                                                                    |
| Formatting and lint  | `src/routes/changelog.tsx`                                | Passed               | Focused Prettier check and ESLint exited 0.                                                                                                                                                                                                                                                                                                     |
| Diff hygiene         | Shared dirty checkout                                     | Passed               | `git diff --check` exited 0; unrelated accepted route/read-model hunks remain preserved.                                                                                                                                                                                                                                                        |
| History validator    | Current compact history corpus                            | Pre-existing failure | `npm run validate-changelog-history` still requires synthetic period `2026-08`; the canonical Product record already identifies that assertion as stale. The validator is explicitly outside this correction and was not changed.                                                                                                               |
| Browser              | `/changelog`, desktop and exact 375×812, available themes | Not completed        | Concurrent runtime ownership changed during the first navigation. The resulting internal browser error page then triggered a URL-policy prohibition on further loopback navigation or alternate browser surfaces. No policy bypass was attempted. Rendered gutter, tabs, overflow, and console therefore remain unverified for this correction. |

### Remaining boundary

The one-line implementation remains inside the accepted Lite seam. Closure requires one fresh,
safe local `/changelog` replay at desktop and exact `375×812`, covering the Technical day gutter,
both tabs, available themes, keyboard focus, containment, and console health. No backend, Product,
Design System, parser, history-source, hosted, provider, Figma, Git staging/commit/push, deployment,
or fixture-data mutation occurred.

## Product Supersession — Shared Changelog Day-Gutter Ownership — 2026-08-12

### Stage

Frontend Marketing corrective implementation is in progress. This supersedes the narrow formatter
branch as the complete resolution. The current task status remains `in_progress` until the shared
presentation owner, validator, and fresh browser replay all agree.

### User outcome

The year, month, and day hierarchy must work identically wherever Changelog renders a day. A
daily Technical-log entry must read as `2026 | August | 11`, exactly as Highlights does. The route
must not be able to regress into a separate ISO-date rail simply because its data source is the
Technical log.

### Confirmed root cause

- `YearSection`, `MonthSection`, and the Hito DS `hito-timeline-day` typography class are already
  shared between the two tabs.
- The remaining divergence is duplicate route-local day-gutter ownership in
  `src/routes/changelog.tsx`: `HighlightDaySection` emits a semantic `<time>` with the formatted
  day label and accessible full date, while `TechnicalLogSectionView` emits a separate `<p>` with
  its own period formatting branch.
- The earlier `formatTechnicalLogPeriod()` day branch corrects one visible string, but it retains
  two independently evolving renderers. That is why the defect can recur.
- The first incorrect canonical owner is therefore the duplicate Changelog route presentation,
  not a Design System token, typography role, CSS selector, or history document.

### Product decision and scope

- Reuse the existing Changelog route timeline composition and the existing DS
  `hito-timeline-day` class. Do **not** create a new Design System primitive: a shared DS component
  would need to know route-specific Technical-log period precision and would duplicate the current
  route responsibility.
- Establish one route-local day-gutter composition for both Highlights and day-kind Technical-log
  sections. It must preserve the semantic `<time>`, `dateTime`, full-date accessible label,
  responsive placement, sticky behavior, and visual day label.
- Preserve the typed Technical period model. Month and range periods remain factual and must not
  be coerced into an invented day solely to use the shared day composition.
- Bring the existing history validator into agreement with the factual current Technical-log
  period corpus; do not retain a stale synthetic-period failure as an accepted exception.

### Boundaries

- No new runtime file, Design System primitive, token, CSS recipe, parser, history data source,
  compatibility path, CMS, registry, or mock data.
- Do not change History content except for a factual correction required by an existing validator.
- Preserve `/change-log` redirect, tabs, evidence links, source chronology, themes, and unrelated
  dirty work.
- Do not stage, commit, push, deploy, alter hosted state, call providers, or mutate fixture data.

### Definition of Done

1. Highlights and every day-kind Technical-log entry use one Changelog date-gutter owner and
   render the same `year → month → day` visual hierarchy.
2. Month/range Technical periods remain exact and truthful.
3. The stale validator expectation is corrected at its existing validator seam and passes against
   the current factual corpus.
4. A fresh `/changelog` browser replay proves desktop and exact `375×812`, Light/Dark, keyboard
   tabs, links/redirect, containment, and console health.

### Exact Frontend Handoff — Shared Changelog Day Gutter

```text
ROLE: FRONTEND

Frontend Lane: Marketing
Mode: Tracked

Continue and complete this canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-changelog-and-technical-log-read-model-reconciliation.md`

Read `AGENTS.md`, `agents/frontend.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, and
`skills/hito-qa-browser-regression/SKILL.md` before the first write. Read the complete canonical
item, `src/routes/changelog.tsx`, `src/lib/changelog-utils.ts`, and
`scripts/validate-changelog-history-sync.ts` before choosing an implementation seam.

Product has superseded the one-line Technical formatter correction with a root-cause requirement.
The year/month sections and `hito-timeline-day` Design System class are already shared. The defect
is the duplicated route-local day gutter: Highlights emits a semantic `<time>` with a formatted day
and full-date accessibility metadata, while Technical log owns separate `<p>` markup and period
formatting. The prior day-label branch is not sufficient because two renderers can drift again.

Required outcome:
- Establish one existing-route-owned day-gutter composition used by Highlights and every day-kind
  Technical-log section. A daily Technical entry must render only `11` beneath the existing
  `2026` and `August` parents, with the same semantic time/date/accessibility and responsive
  behavior as Highlights.
- Preserve exact Technical month/range precision. Do not invent a day merely to force a shared
  presentation.
- Reuse the current route timeline and existing Hito DS class. Do not create a new DS primitive,
  token, CSS recipe, route, parser, registry, data source, compatibility path, or runtime file.
- Resolve the stale existing history-validator synthetic-period expectation so it agrees with the
  factual current Technical corpus. Do not leave a known task-owned validator failure.

Preserve History source content, tabs, evidence links, `/change-log` redirect, themes, route
behavior, and unrelated dirty work. Do not stage, commit, push, deploy, access hosted state, call
providers, or mutate fixtures. Use an existing named Hito QA role only for a bounded read-only
review if independent evidence is genuinely useful; do not create generic subagents.

Validate source-to-renderer ownership; the history validator; focused Prettier, ESLint and
`git diff --check`; then a fresh local `/changelog` replay at desktop and exact 375×812 in Light
and Dark. Prove shared daily hierarchy, factual non-day periods, keyboard tabs, evidence links,
`/change-log` redirect, no horizontal overflow, and no console errors. Run a build only if
uncontended and leave the managed fixture server running after proof.

Use Russian for in-progress commentary. Append an English tracked implementation receipt to the
canonical item. Do not claim Global QA, release readiness, or deployment.
```

## Frontend Marketing Tracked Implementation Receipt — Shared Day Gutter — 2026-08-12

### Task, stage, and preflight

- **Task:** complete the Changelog/Technical-log read-model reconciliation after Product superseded
  the one-line formatter branch.
- **Stage:** Frontend Marketing implementation and focused browser-evidence closure.
- **Existing seam reused:** the route-owned timeline composition in `src/routes/changelog.tsx`, the
  existing `hito-timeline-day` class, and the existing `formatDayLabel()` / `formatFullDate()`
  utilities.
- **Smallest change:** one route-local `TimelineDayGutter` now owns every daily gutter in Highlights
  and day-kind Technical sections; Technical month/range periods retain their factual source label.
- **New production runtime artifacts:** none.
- **Superseded responsibility removed:** the separate Technical daily formatter and `<p>` renderer
  are gone for day-kind sections. The existing `<p>` composition remains only for factual non-day
  periods.
- **Validator correction:** the existing history validator now requires the exact current Technical
  period corpus and asserts the single route-owned daily-gutter composition.

### Product outcome and root cause

The visible Technical hierarchy is now `2026 → August → 11`, matching Highlights. Both daily
surfaces render the same semantic `<time datetime="2026-08-11" aria-label="August 11, 2026">11</time>`
composition. `2026-07` and `2026-05 to 2026-06` remain exact non-day labels; no day is fabricated.

The demonstrated cause was duplicate route-local presentation ownership: Highlights used a semantic
formatted `<time>`, while Technical used independent `<p>` markup and period formatting. The first
incorrect owner was `src/routes/changelog.tsx`, not the shared Design System class, parser, or
history documents.

### Files changed by this correction

- `src/routes/changelog.tsx` — shared route-local day-gutter composition and preserved non-day branch.
- `scripts/validate-changelog-history-sync.ts` — factual Technical period inventory and renderer-owner
  invariant.
- `qa-artifacts/screenshots/2026-08-12/changelog-shared-day-gutter/` — four focused desktop/mobile,
  Light/Dark screenshots.
- This canonical item — lifecycle and receipt only.

The existing history Markdown, parser/read-model contract, alias route, shared Design System source,
Product/Backend surfaces, and unrelated dirty work were not changed by this correction.

### Validation inventory

| Check                    | Scenario / environment                        | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source ownership         | Highlights and day-kind Technical renderers   | Passed | Both call the single route-owned `TimelineDayGutter`; the validator requires two call sites, the Technical `day` discriminator, and absence of `formatTechnicalLogPeriod`.                                                                                                                                                                                                                                         |
| History source/validator | Current compact history corpus                | Passed | `npm run validate-changelog-history`: 54 public dates / 362 entries, latest `2026-08-11`; 9 Technical sections / 15 entries, last updated `2026-08-11`; exact day/month/range period list accepted.                                                                                                                                                                                                                |
| Daily semantics          | `/changelog`, Highlights and Technical        | Passed | Both first gutters read `TIME`, text `11`, `dateTime=2026-08-11`, `aria-label=August 11, 2026`. Technical daily labels continue as `10`, `06`, `05`, `03`, `23`, `21`.                                                                                                                                                                                                                                             |
| Non-day precision        | Technical month and range sections            | Passed | Rendered non-day gutters remain `2026-07` and `2026-05 to 2026-06` as `<p>` labels with no invented date.                                                                                                                                                                                                                                                                                                          |
| Desktop visual           | 1280×720, Light and Dark                      | Passed | One shared year/month/day hierarchy, no duplicate ISO day gutter, zero horizontal overflow. Screenshots: `desktop-light.jpg`, `desktop-dark.jpg`.                                                                                                                                                                                                                                                                  |
| Mobile visual            | Exact 375×812, Light and Dark                 | Passed | Shared daily hierarchy remains readable and contained; `innerWidth=375`, `innerHeight=812`, `scrollWidth - clientWidth = 0`. Screenshots: `mobile-375x812-light.jpg`, `mobile-375x812-dark.jpg`.                                                                                                                                                                                                                   |
| Tabs and focus           | Desktop and exact mobile                      | Passed | ArrowLeft moved focus/selection Technical → Highlights; ArrowRight moved focus/selection Highlights → Technical.                                                                                                                                                                                                                                                                                                   |
| Evidence links           | Technical rendered panel                      | Passed | 13 factual anchors retain nonempty GitHub evidence `href`s with `_blank` and `noreferrer`; external destinations were not opened under the hosted-access boundary.                                                                                                                                                                                                                                                 |
| Alias route              | Exact 375×812                                 | Passed | Navigating local `/change-log` resolved to `/changelog` with the expected title and zero overflow.                                                                                                                                                                                                                                                                                                                 |
| Console health           | Desktop and mobile replay                     | Passed | Browser error/warning logs were empty before and after tab interaction and alias redirect.                                                                                                                                                                                                                                                                                                                         |
| Formatting/lint/diff     | Changed route, validator, and shared checkout | Passed | Focused Prettier check, focused ESLint, and `git diff --check` exited 0.                                                                                                                                                                                                                                                                                                                                           |
| Build/runtime            | Managed `qa_fixture`                          | Passed | A fresh client/SSR/Nitro production build completed through the fixture manager and the focused replay ran while status was `current`, `healthy`, and `receipt_matches`. A transient overlapping postbuild failure was excluded. After proof, unrelated concurrent DS/Admin source changes made the checkout-wide artifact stale; the managed fixture remains healthy/running and was not rebuilt over that owner. |

### Coverage and boundary

- This is focused Tracked Implementation DoD only. Global QA Acceptance, release readiness,
  deployment, and hosted parity are not claimed.
- Evidence-link destinations were intentionally not opened because the task prohibited hosted-state
  access; rendered navigation metadata and local interaction were verified.
- No subagent was used; the bounded same-owner replay was sufficient.
- No fixture data, provider, hosted state, Git staging/commit/push, or deployment was touched.
- The managed `qa_fixture` was left running and healthy. Its final checkout-wide freshness is stale
  because concurrent unrelated source now expects a different private Admin snapshot digest; this
  does not change the already-built Changelog artifact used for the focused replay, but no claim is
  made that the runtime includes those later unrelated edits.
- **Next owner:** Product may archive or sequence any independent release/QA work; no implementation
  blocker remains in this item.
