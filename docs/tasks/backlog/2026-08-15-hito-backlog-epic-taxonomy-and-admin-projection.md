# Hito Backlog Epic Taxonomy And Admin Projection

Work Item ID: `2026-08-15-hito-backlog-epic-taxonomy-and-admin-projection`
Status: completed
Type: Tracked
Priority: high
Owner: QA
Epic: platform-and-operations
Scope: One canonical Epic field from backlog Markdown through the existing Admin repository mirror
and `/admin/capture` rendering, plus a controlled classification pass for every non-bug record.
Archive Intent: Retain through source migration, Admin projection, and focused acceptance; compact to
the taxonomy, migration result, and acceptance outcome on terminal closeout.
Evidence From: [Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Stage: Independent Admin Capture Epic projection acceptance completed
Next Recommended Role: PRODUCT

## Task

Make the current product sequence visible and enforceable in the canonical backlog and Admin
backlog. Every non-bug item receives exactly one registered Epic. Bugs remain `Type: Bug` and stay
visible as bugs or bug batches rather than being relabelled as product outcomes.

## Accepted Epic Taxonomy

| Slug                               | Label                             | Use                                                                                    |
| ---------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| `runner-core-readiness`            | Runner Core Readiness             | Reliable source-independent Calendar and runner flows; current product priority.       |
| `runner-evidence-and-progress`     | Runner Evidence & Progress        | Durable runner evidence and truthful personal Progress after Runner Core.              |
| `adaptive-blueprint-planning`      | Adaptive Blueprint Planning       | Product-decided blueprint and continuation work only after Runner Evidence & Progress. |
| `commercial-financial-foundation`  | Commercial & Financial Foundation | Paid access, payments, actual revenue/cost history, and data health.                   |
| `owner-analytics-and-scenario-lab` | Owner Analytics & Scenario Lab    | Financial/product decision analytics and configurable forecasts based on actuals.      |
| `platform-and-operations`          | Platform & Operations             | Design System, Admin tooling, reliability, release, and process work.                  |
| `marketing-and-growth`             | Marketing & Growth                | Public marketing, acquisition, and growth work.                                        |
| `legacy-history`                   | Historical / Legacy               | Terminal non-bug history without sufficient evidence for a factual current Epic.       |

## Confirmed Current Boundary

- `scripts/admin-backlog-import/markdown.ts` has a closed canonical-field list that does not include
  `Epic`; today Markdown cannot project an Epic.
- `scripts/import-repo-work-items-to-admin-backlog.ts` does not write an Epic into the existing JSON
  metadata mirror.
- `src/lib/admin-capture.ts`, `src/lib/admin-capture.server.ts`, and
  `src/routes/admin.capture.tsx` expose/read/render existing work-item metadata but no Epic.
- The existing importer mirror is read-only for repository-derived records; Markdown remains
  canonical. No parallel Admin Epic editor, database column, or second source of truth is allowed.

## Required Delivery Sequence

1. **ARCHITECT — controlled classification map.** Inspect every non-bug backlog document and assign
   a factual registered Epic. Use `legacy-history` only for terminal records whose durable outcome
   cannot be classified without invention. Keep `Type: Bug` records unepicked. Record counts and
   exceptions; do not infer from title alone or alter task status, receipt, or owner.
2. **BACKEND — canonical mirror contract.** Extend the existing Markdown parser, importer metadata,
   read model, and focused contract proof to carry only registered Epic slugs. The importer must
   fail closed for invalid active non-bug Epic values and must preserve source identity. Reuse the
   existing JSON metadata field; no schema migration, new table, or Admin-side persistence.
3. **FRONTEND Product — Admin projection.** Render a readable Epic tag and add an Epic filter in
   the existing `/admin/capture` Backlog surface. Bugs render as `Bug`, not an Epic. Keep repository
   entries read-only and preserve current status/type/priority/role filters and mobile containment.
4. **QA — independent acceptance.** Replay parser/importer/read-model/Admin UI for each Epic, a
   bug, an invalid Epic, a legacy-history terminal item, filtering, deep links, keyboard, mobile,
   and refresh convergence. No stale or ad-hoc runtime.

## Boundaries

- Do not create a new hierarchy, project-management service, database field, Admin editor, or free
  text Epic value.
- Do not mass-rewrite task prose, receipts, history, status, relationships, or source ownership.
  The controlled migration may add only the one factual `Epic:` metadata line to non-bug tasks.
- A non-bug Batch keeps its Batch identity and adds the Epic it advances.
- Runner Evidence and Progress follows `runner-core-readiness`. Adaptive planning requires a later
  explicit Product decision after that Epic; commercial and owner analytics remain downstream.

## Completion Criteria

- Every non-bug canonical backlog item has one registered `Epic:` line; every bug remains Epic-free.
- The existing Admin mirror transports and visibly filters the exact canonical Epic.
- Invalid/missing active non-bug Epic metadata becomes a source diagnostic, not a silently inferred
  value; terminal classification uses only the explicit `legacy-history` fallback.
- Importer identity, read-only protection, existing filters, local fixture behavior, and browser
  containment pass focused validation.

## Next Action

PRODUCT may review the completed FRONTEND Product receipt below and separately dispatch the
independent QA acceptance stage. The Product implementation is complete; FRONTEND did not dispatch
QA or claim Global QA.

## Handoff Prompt

```text
ROLE: PRODUCT

Task: Hito Backlog Epic Taxonomy And Admin Projection
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-backlog-epic-taxonomy-and-admin-projection.md
Stage: FRONTEND Product projection complete; independent QA dispatch pending

Review the completed FRONTEND Product implementation receipt and preserve the existing source bytes.
Keep this larger item in progress until independent QA replays the parser/importer/read model and
Admin UI contract. Dispatch QA separately only after confirming the shared managed runtime is
available; do not treat the Frontend browser proof as Global QA.
```

## FRONTEND Product Execution Preflight — 2026-08-17

- **Task / mode / lane:** Hito Backlog Epic Taxonomy And Admin Projection / Tracked /
  FRONTEND Product, limited to the existing authenticated `/admin/capture` Backlog presentation.
- **Accepted Backend discriminator:** `repoWorkItem.epic` is the exact registered slug or `null`;
  `repoWorkItem.workItemType === "bug"` is the only Bug discriminator. Missing and invalid source
  metadata remain explicit Backend diagnostics and must not produce an inferred classification.
- **Existing seams reused:** `src/routes/admin.capture.tsx`,
  `src/components/admin/admin-capture-view-model.ts`, the existing URL-search/filter composition,
  `AdminDataTableToolbar`, and `HitoMetadataTag`.
- **Smallest behavior change:** add one replayable `epic` URL filter over the Backend-returned view;
  render `Epic: <accepted label>` for a non-Bug exact slug and `Bug` for an explicit Bug in the
  existing read-only row/detail metadata groups. A null Epic with no Bug remains unlabelled while
  the existing missing/invalid diagnostics stay visible.
- **New runtime artifacts:** none. No file, component, store, persistence field, taxonomy, parser,
  importer, API, read-model change, shared primitive, CSS recipe, or compatibility path is
  proposed.
- **Superseded responsibility:** remove the current presentation omission where the transported
  Epic/Bug classification is ignored. Existing status/type/priority/role/source filters, search,
  status tabs, row expansion, deep links, prompt copy, notes/history, Quick Notes, and read-only
  guards remain authoritative and active.
- **Dirty boundary:** preserve the accepted Admin language/settings adoption already present in
  `admin.capture.tsx` and every Backend/classification/importer hunk byte-for-byte. Backend, shared
  Design System source, fixtures, auth, hosted state, and unrelated dirty paths are read-only.
- **Focused proof:** all eight Epic labels, explicit Bug, null Epic plus missing/invalid diagnostics,
  URL filter/reload/clear behavior, row/detail read-only presentation, existing filter coexistence,
  keyboard/Escape focus, desktop and exact 375px containment, console health, focused formatting,
  lint/type/Product/Admin checks, and diff hygiene. This is Implementation DoD only; QA remains a
  separate Product dispatch.

## ARCHITECT Classification Receipt — 2026-08-17

### Preflight and evidence rule

- **Assigned slice:** classify every top-level canonical backlog Markdown item against the accepted
  registered taxonomy. This receipt and one `Epic` metadata field per non-bug item are the only
  task-owned changes.
- **Evidence:** each decision used the item's available `Scope`, `Task`, accepted outcome/decision,
  relationships, and retained source context. Filename/title alone was never sufficient.
- **Preserved boundary:** status, owner, task prose, relationships, receipts, runtime source,
  importer, Admin UI, database, fixtures, hosted state, and Git lifecycle were not changed.
- **New artifacts / deletion:** none / none. The nested backlog asset evidence document is not a
  top-level work item and was not classified.

### Complete inventory

| Classification                                                | Count |
| ------------------------------------------------------------- | ----: |
| Top-level canonical backlog items                             |   305 |
| Explicit `Type: Bug` items, correctly Epic-free               |    28 |
| Non-bug items                                                 |   277 |
| Pre-existing registered Epic values retained                  |    35 |
| New Epic metadata fields added                                |   242 |
| Non-bug items missing or using an unknown Epic after the pass |     0 |
| Bug items carrying an Epic after the pass                     |     0 |

| Registered Epic                    | Final non-bug count |
| ---------------------------------- | ------------------: |
| `runner-core-readiness`            |                  44 |
| `runner-evidence-and-progress`     |                  32 |
| `adaptive-blueprint-planning`      |                  21 |
| `commercial-financial-foundation`  |                   2 |
| `owner-analytics-and-scenario-lab` |                   2 |
| `platform-and-operations`          |                 174 |
| `marketing-and-growth`             |                   2 |
| `legacy-history`                   |                   0 |
| **Total**                          |             **277** |

### Exact exceptions and decisions

- `2026-06-13-manual-authoring-bug-03-copy-paste-review-error.md`,
  `2026-06-13-manual-authoring-bug-04-non-rest-template-selection-no-op.md`, and
  `2026-06-13-manual-authoring-bug-05-protected-source-direct-edit-affordance-leak.md` contain
  `bug` only in their filenames/titles and have no `Type: Bug` metadata. They were therefore not
  inferred to be bugs; their accepted Calendar/manual-authoring outcomes factually map to
  `runner-core-readiness`.
- `2026-08-15-hito-history-compact-complete-ledger-reconciliation.md` has compact list metadata
  rather than the more common section form. Its accepted history/documentation outcome factually
  maps to `platform-and-operations`; only a matching list-form Epic line was added.
- `legacy-history` was not used. Every terminal non-bug record retained enough task, outcome,
  source, or relationship evidence for a factual registered product/operations Epic. No current
  product meaning was invented for an evidence-empty receipt.
- Existing registered Epic values were already valid and factually aligned with their retained
  contracts; none was silently remapped.

### Classification proof

The final discriminator is fail-closed and exact:

1. the top-level path inventory remains 305 items;
2. all 277 non-bugs resolve to exactly one of the eight registered slugs;
3. all 28 explicit bugs resolve to no Epic;
4. the complete category total is 277 and no unregistered value exists; and
5. after removing Epic metadata fields and excluding this task-owned receipt, the combined content
   hash is unchanged at
   `2d3896309e005ba047c1566bcedeb1ae157d6a599418f05f832c62685164c5cd`.

This proves that the classification pass changed no non-Epic byte in the other 304 top-level
documents.

### Exact Backend projection prerequisite

PRODUCT may now prepare, but has not dispatched, the existing BACKEND slice. Its boundary is:

```text
ROLE: BACKEND

Task: Hito Backlog Epic Taxonomy And Admin Projection
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-backlog-epic-taxonomy-and-admin-projection.md
Stage: Canonical Epic mirror contract

The controlled ARCHITECT classification is complete: all 277 non-bug top-level backlog items have
one registered Epic, all 28 explicit Type: Bug items are Epic-free, and no unknown value remains.

Extend only the existing Markdown parser, repository importer JSON metadata projection, Admin read
model, and focused contract proofs to carry the exact source Epic. Accept the existing canonical
metadata forms used by the classified corpus, fail closed for a missing or unknown Epic on an active
non-bug item, reject an Epic on Type: Bug, and never infer from title, owner, filename, or prose.
Preserve Work Item IDs, source identities, row UUIDs, notes/history, read-only mirror behavior, and
local/deployed snapshot parity. Reuse existing JSON metadata; add no table, column, migration, Admin
editor, taxonomy, generated index, or Frontend rendering. Keep the broader Work Items authority
cutover and Quick Note/history migration outside this slice.

Validate parser forms, every registered slug, Bug, missing/invalid values, idempotent import,
identity preservation, and filesystem/bundled-snapshot equivalence. Update only this canonical item
with the Backend receipt, then return the separate FRONTEND Product projection prerequisite to
PRODUCT. Do not dispatch Frontend yourself.
```

### Validation inventory

| Check                       | Scenario / environment                       | Result       | Evidence                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classification invariant    | All 305 top-level canonical items            | Passed       | 277 non-bugs have one registered Epic; 28 explicit bugs have none; no missing or unknown value.                                                                                              |
| Preservation discriminator  | All non-Epic content outside this receipt    | Passed       | The combined hash remains `2d3896309e005ba047c1566bcedeb1ae157d6a599418f05f832c62685164c5cd`.                                                                                                |
| Local Markdown links        | 796 local links across the 305-item corpus   | Coverage gap | 793 resolve. Three pre-existing references point to already-absent source/proof files; changing their task prose is outside this classification slice. No Epic edit added or changed a link. |
| Scoped Prettier             | This canonical receipt                       | Passed       | The task-owned receipt matches repository formatting. Seven other corpus documents retain pre-existing non-Epic formatting warnings and were not rewritten.                                  |
| Whitespace and diff hygiene | Classified corpus plus current worktree diff | Passed       | Direct whitespace scan and `git diff --check` report no task-introduced whitespace error.                                                                                                    |

The three preserved broken references are in
`2026-07-26-coach-club-program-publishing-architecture.md`,
`2026-08-11-onboarding-inspector-visual-batch.md`, and
`2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md`.
They reference `src/lib/active-plan-transition-actions.ts` or
`scripts/validate-active-plan-schedule-edit-preview.ts`, both absent from the current checkout. They
are not evidence that the Epic classification is incorrect, but their historical source-link
coverage remains unresolved for their canonical owners.

### Lifecycle and acceptance boundary

The ARCHITECT classification slice is complete. The larger item remains nonterminal until BACKEND,
FRONTEND Product, and independent QA complete their separately dispatched slices. The safe next
owner is PRODUCT for lifecycle reconciliation and optional dispatch of the exact BACKEND boundary
above. No runtime, importer, database, browser, hosted, release, or Global QA acceptance is claimed.

## BACKEND Tracked Implementation Receipt — 2026-08-17

### Task, stage, and preflight

- **Task / mode:** Hito Backlog Epic Taxonomy And Admin Projection / Tracked.
- **Completed stage:** canonical Epic mirror contract. The next unexecuted stage is the separate
  FRONTEND Product tag/filter projection.
- **Preflight:** `AGENTS.md`, `agents/backend.agent.md`,
  `skills/hito-backend-supabase-contract/SKILL.md`, `docs/current-system.md`, this complete item,
  the Architect classification receipt, the current source owners, the dirty boundary, and active
  role state were read before the first write. BACKEND was the only active execution role and the
  Git index was empty.
- **Reuse-first budget:** the existing Markdown parser, importer JSON metadata, Admin capture read
  model, contract proof, and deterministic Admin validator were extended in place. New runtime
  files, tables, columns, migrations, RPCs, taxonomy services, generated indexes, editors,
  compatibility paths, dependencies, and fixtures: **none**.

### Outcome and root-cause discriminator

The Backend slice is complete. The exact canonical Epic slug now travels from repository Markdown
to `metadata.work_item_epic` and returns as the typed `repoWorkItem.epic` field. An explicit Bug
returns `workItemType: "bug"` and `epic: null`. Invalid persisted mirror metadata also resolves to
`epic: null`; it is never surfaced as a supported value.

The pre-change red discriminator parsed this item's source `Epic: platform-and-operations` as both
`parsedEpic: null` and `rawEpic: null`. The first incorrect owner was the closed field list and lead
metadata reader in `scripts/admin-backlog-import/markdown.ts`; the importer and Admin read model then
had no Epic value to transport. No database/schema defect was involved.

The parser now accepts the three canonical forms present in the classified corpus: heading
sections, compact list metadata (plain or bold labels), and flat lead key/value metadata with
wrapped values and fenced prompts. An exact later `## Epic` section is also accepted for retained
legacy-form documents whose other lead metadata predates the current compact contract. Epic is
never derived from a title, filename, owner, or prose.

For top-level backlog documents, a missing Epic on a nonterminal non-Bug or an unknown value is an
Epic diagnostic and keeps the mirror fail-closed. Any Epic on an explicit Bug is rejected. Terminal
fallback remains source-explicit only: `legacy-history` is accepted solely when written in the
Markdown.

### Files changed

- `src/lib/admin-work-items.ts` — registered-slug type guard inside the existing Admin work-item
  contract.
- `scripts/admin-backlog-import/markdown.ts` — Epic parsing, corpus-form support, Bug recognition,
  and source diagnostics.
- `scripts/import-repo-work-items-to-admin-backlog.ts` — `work_item_epic` JSON projection,
  comparison, and report example readback.
- `src/lib/admin-capture.ts` and `src/lib/admin-capture.server.ts` — typed `repoWorkItem.epic`
  projection, supported-value validation, and removal of repo-only Epic metadata from manually
  created Admin rows.
- `scripts/admin-backlog-import/contract-proof.ts` and
  `scripts/validate-admin-capture-backlog.ts` — registered-value, Bug, missing/invalid, corpus,
  projection, idempotency/identity, read-only, and filesystem/bundled proof.
- This canonical item — Backend receipt and truthful Product/Frontend handoff state.

No Frontend route/component, schema/generated database type, source document classification, mirror
row, Quick Note, history, hosted state, or Git state was changed by this Backend slice. Existing
unrelated dirty hunks were preserved.

### Consumer contract

The later FRONTEND Product consumer receives:

```ts
repoWorkItem: {
  workItemType: AdminRepoWorkItemType | null;
  epic: AdminRepoWorkItemEpic | null;
  metadataState: "complete" | "legacy_debt" | "malformed";
  missingRequiredFields: string[];
  invalidRequiredFields: string[];
}
```

`AdminRepoWorkItemEpic` is the exact eight-slug union registered in the accepted item. Frontend must
render `workItemType === "bug"` as `Bug`, use `epic` only when non-null, and must not infer or persist
an Epic. Repository-derived rows remain read-only.

### Validation inventory

| Check                          | Scenario / environment                                                                            | Result       | Evidence                                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red discriminator              | Real canonical item before implementation                                                         | Passed       | Source Epic was present while parser `epic` and `raw.Epic` were both `null`.                                                                                                                                                                       |
| Parser forms                   | Heading, bold compact list, plain compact list, and flat wrapped lead metadata with fenced prompt | Passed       | Focused contract proof resolves the same explicit Epic without reading body prose.                                                                                                                                                                 |
| Registered values              | All eight accepted Epic slugs, including explicit `legacy-history`                                | Passed       | Each slug parses exactly and produces a complete focused fixture.                                                                                                                                                                                  |
| Fail-closed matrix             | Active non-Bug missing Epic; unknown Epic; valid/invalid Epic on Bug                              | Passed       | Missing/unknown values produce Epic diagnostics; Bug + Epic is malformed; verbose `Bug — ...` remains Bug.                                                                                                                                         |
| Classified corpus              | 305 top-level work items in the current snapshot                                                  | Passed       | Validator reports 277 non-Bugs with registered Epics and 28 explicit Bugs with no Epic; counts match the Architect receipt.                                                                                                                        |
| JSON projection/readback       | Deterministic importer and Admin capture view                                                     | Passed       | `work_item_epic` is compared and returned as typed `repoWorkItem.epic`; unsupported stored values cannot become a supported Epic.                                                                                                                  |
| Read-only protection           | Manual Admin create plus repo-derived mutation guards                                             | Passed       | Repo-only Epic metadata is stripped from manual rows; existing repo-derived update/note/delete rejections remain green.                                                                                                                            |
| Idempotency and identity       | Two identical importer runs against deterministic repository                                      | Passed       | Second run creates/updates zero rows, skips all source documents, and preserves complete rows, UUIDs, notes, metadata, and source identities byte-for-byte.                                                                                        |
| Filesystem/bundled parity      | Same checkout through filesystem and bundled snapshot inputs                                      | Passed       | Eligible counts, metadata diagnostics, and malformed counts are identical; the only intake difference is the intentionally filesystem-skipped `README.md`, which is absent from the bundle.                                                        |
| Focused Backend validator      | `npm run validate-admin-capture-backlog`                                                          | Passed       | Deterministic report includes `canonical_backlog_epic_corpus`, mirror/source-mode safety, read-only behavior, and all prior Admin checks.                                                                                                          |
| Formatting/lint/hygiene        | Seven task-owned source/proof files                                                               | Passed       | Targeted Prettier, targeted ESLint, and `git diff --check` passed.                                                                                                                                                                                 |
| Repository TypeScript          | `npx tsc --noEmit`                                                                                | Coverage gap | Repo-wide check remains red on existing unrelated diagnostics, including unchanged importer directory-entry/comparable-key lines and numerous concurrent Product/DS files. No diagnostic names the new Epic fields or their read-model projection. |
| Local Supabase importer replay | Existing CLI dry run against `127.0.0.1:54321`                                                    | Coverage gap | The sandbox refused loopback network access with `connect EPERM` before any row read/write. Deterministic importer/read-model proof passed; no local or hosted database mutation occurred.                                                         |

### Preserved boundaries, omissions, and lifecycle

- Database schema, generated Supabase types, RLS/ACL, hosted state, local mirror rows, Quick Notes,
  notes/history, Work Item IDs, source identities, row UUIDs, Frontend rendering, runtime/browser,
  dependencies, providers, staging, commit, push, release, and deployment remained unchanged.
- A production build and browser matrix were not run. Their consequence is limited to unproven
  Frontend presentation/filtering and end-to-end runtime acceptance; both belong to the later
  FRONTEND Product and QA stages.
- BACKEND Implementation DoD is passed. The larger item remains `in_progress`; FRONTEND Product and
  independent QA are still pending. No browser, Global QA, hosted, release, or deployment acceptance
  is claimed.
- **Next owner:** PRODUCT for optional dispatch of the exact FRONTEND Product handoff above.
- **Role / skill / subagents:** `agents/backend.agent.md`;
  `skills/hito-backend-supabase-contract/SKILL.md`; no subagent was used.

## FRONTEND Product Tracked Implementation Receipt — 2026-08-17

### Task, stage, and preflight

- **Task / mode / lane:** Hito Backlog Epic Taxonomy And Admin Projection / Tracked / FRONTEND
  Product.
- **Completed stage:** authenticated Admin Capture Epic tag and filter projection. The larger item
  remains `in_progress` for separately dispatched independent QA.
- **Preflight:** `AGENTS.md`, `agents/frontend.agent.md`,
  `skills/hito-frontend-design-system/SKILL.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, this complete canonical item, the completed Backend
  contract, the current route/view-model owners, active-role state, and the dirty boundary were
  inspected before the first task-owned write.
- **Reuse-first budget:** the existing `/admin/capture` URL search state, filter menu,
  `AdminDataTableToolbar`, read-only row/detail metadata groups, and `HitoMetadataTag` were extended
  in place. New runtime files, components, stores, endpoints, persistence fields, taxonomies,
  Design System recipes, compatibility paths, fixtures, and dependencies: **none**.

### Product outcome and source discriminator

The Product projection is complete. Repository work-item rows now render the exact Backend-shaped
classification: an explicit `repoWorkItem.workItemType === "bug"` renders `Bug`; a supported
non-Bug `repoWorkItem.epic` renders `Epic: <accepted readable label>`; and `null` renders no Epic or
Bug tag. Missing and invalid metadata diagnostics continue to render independently, so an
unclassified source is not silently repaired or inferred in the browser.

The existing filter menu now contains one replayable `epic` URL filter with the eight accepted
labels plus `Bug`. It filters only the already Backend-returned bounded list because the accepted
Backend list input has no Epic query field and this Frontend stage forbids a read-model change. The
UI therefore reports `Showing <filtered> of <loaded> loaded items` for a selected Epic rather than
claiming a repository-wide filtered count. `Clear all`, reload, and direct deep links preserve the
existing route-search contract.

The pre-change omission was in the existing Frontend consumer: the typed Backend classification
was available but `admin.capture.tsx` and its view model neither displayed nor filtered it. No
parser, importer, database, auth, or shared Design System defect was involved in this stage.

### Files changed

- `src/components/admin/admin-capture-view-model.ts` — accepted Epic labels, typed URL-filter
  values, Backend-only Bug/Epic classification readback, active-filter label, and loaded-item match
  predicate.
- `src/routes/admin.capture.tsx` — `epic` route-search parsing, existing toolbar filter section,
  honest filtered result count, and read-only row/detail Epic or Bug tag composition.
- This canonical item — Frontend preflight, lifecycle return to PRODUCT, and implementation
  receipt.

The existing Admin settings/language hunks in `admin.capture.tsx`, all Backend/parser/importer
changes, the classified Markdown corpus, shared Design System source, auth, Quick Notes,
notes/history, and unrelated dirty paths were preserved.

### Validation inventory

| Check                                | Scenario / environment                                                             | Result                          | Evidence                                                                                                                                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical classification validator   | Current 305-item repository corpus                                                 | Passed                          | `npm run validate-admin-capture-backlog` reports 277 non-Bugs across the eight registered values and 28 Epic-free Bugs; all deterministic Admin checks pass.                                                                     |
| Focused formatting and lint          | Two changed TypeScript/TSX owners plus this receipt                                | Passed                          | Prettier and focused ESLint completed without task-owned diagnostics.                                                                                                                                                            |
| Diff hygiene                         | Current shared working tree                                                        | Passed                          | `git diff --check` reports no whitespace errors.                                                                                                                                                                                 |
| Production build and managed runtime | Fresh loopback `qa_fixture`, `127.0.0.1:3000` / authenticated `localhost` redirect | Passed                          | Client, SSR, Nitro, postbuild, and managed server admission passed; PID 8944 was healthy, loopback-only, provider `qa_fixture`, and `receipt_matches` before browser proof.                                                      |
| All filter choices                   | `/admin/capture`, status/source/type/priority/role all                             | Passed                          | The menu exposes all eight accepted readable Epic labels and separate `Bug`; pointer selection writes the exact slug to `epic=...`.                                                                                              |
| Factual Epic rows                    | Current loaded Admin list                                                          | Passed                          | Seven currently represented Epics rendered only their matching tag: 9 Runner Core, 6 Runner Evidence, 6 Adaptive Blueprint, 1 Commercial, 2 Owner Analytics, 27 Platform, and 2 Marketing rows.                                  |
| Historical / Legacy                  | Current loaded Admin list                                                          | Passed with factual empty state | `epic=legacy-history` retained the exact URL filter and rendered 0 rows; the current classified corpus contains no factual `legacy-history` record, so no row was fabricated.                                                    |
| Explicit Bug                         | `epic=bug`, direct link and reload                                                 | Passed                          | 16 loaded explicit Bug rows rendered only `Bug`; reload retained the filter and row set.                                                                                                                                         |
| Null plus diagnostics                | Existing active-plan mirror row with null classification                           | Passed                          | The row rendered neither Epic nor Bug while preserving both `missing metadata` and `invalid metadata`; an expanded repository item preserved detailed diagnostic lists and Markdown-source read-only copy.                       |
| Filter interaction                   | Pointer select, `Clear all`, direct URL, reload, keyboard Enter/Escape             | Passed                          | Selection, clear, and reload retained route state; native Escape closed the filter and restored focus to `Work-item filters` at desktop and 375px. Existing search and filter controls remained reachable.                       |
| Responsive and themes                | 1470x801 and exact 375x812, Light and Dark                                         | Passed                          | Document/body widths equalled the viewport in every checked state; the mobile menu remained horizontally contained and scrollable, tags wrapped in the existing row composition, and no page-level horizontal overflow occurred. |
| Browser console                      | Same authenticated matrix                                                          | Passed                          | No warnings or errors were recorded.                                                                                                                                                                                             |
| Repository TypeScript                | `npx tsc --noEmit`                                                                 | Coverage gap                    | Checkout-wide TypeScript remains red on pre-existing unrelated diagnostics in `admin-capture.server.ts` and workout-result import readers. No diagnostic names either changed Frontend owner or the Epic projection.             |

### Preserved boundaries, omissions, and lifecycle

- Parser/importer/read-model behavior, repository metadata, database/schema/RLS, Admin auth,
  Quick Notes, notes/history, prompts, source deep links, status/type/priority/role/source filters,
  shared Design System contracts, fixtures, hosted state, providers, staging, commit, push,
  deployment, and material data were not changed.
- A natural browser row for `legacy-history` was unavailable because the current factual corpus has
  zero such records. The control, exact slug, empty result, and Backend validator were proven; QA
  may add independent fixture-level coverage only through its separately admitted acceptance
  contract.
- Frontend Implementation DoD is passed. Independent QA, Global QA, hosted, release, and deployment
  acceptance are not claimed.
- **Next owner:** PRODUCT for review and separate QA dispatch.
- **Role / skills / subagents:** `agents/frontend.agent.md`;
  `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`; no subagent was used and QA was not dispatched.

## Independent QA Acceptance Receipt — 2026-08-17

### Task, Stage, And Validation Layer

- **Task / mode:** Hito Backlog Epic Taxonomy And Admin Projection / Tracked.
- **Stage:** independent local Admin Capture Epic projection acceptance.
- **Validation layer:** focused local acceptance of the Markdown → `metadata.work_item_epic` →
  `repoWorkItem.epic` → `/admin/capture` contract. This is not Global QA, hosted, release,
  deployment, or production acceptance.
- **Execution preflight:** `main` and `origin/main` both resolved to
  `abd4fe8355e3c644095111a654c1560aa265d104`; the index was empty. The intentionally dirty checkout
  contained 349 modified, 2 deleted, and 90 untracked paths. Its complete porcelain fingerprint
  remained `23bf1985e04db7cdd29924fe3874172964a05b2e83e0cc48fb9d238fc7dd411a` before runtime
  admission, after the fresh build, and immediately before this receipt.
- **Browser path preflight:** the previous managed artifact was healthy but stale/`artifact_missing`
  and was not used. The first canonical restart inherited `providerMode: real`; QA rejected it
  before browser navigation or any provider action, then restarted the same managed lifecycle with
  explicit `--provider-mode qa_fixture`. The admitted artifact was PID `16082`, managed,
  compatible, healthy, loopback-bound, `build: present`, `providerMode: qa_fixture`,
  `artifactFreshness: fresh`, and `freshnessReason: receipt_matches`. The in-app browser executed
  the full visual/filter matrix; connected Chrome independently executed native keyboard and local
  Admin-login discriminators.

### Validation Inventory

| Check                                | Scenario / environment                                                                  | Result                            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical parser/importer/read model | `npm run validate-admin-capture-backlog`; deterministic current checkout                | Passed                            | The validator returned `ok: true`, including `canonical_backlog_epic_corpus`, `canonical_repo_projection_metadata`, `unsupported_persisted_epic_not_projected`, read-only mirror, identity/idempotency, notes, and auth checks. It observed 305 top-level items, 277 non-Bugs, 28 Bugs, and exact registered values.                                                                                                                                                                                                                                                                                      |
| Represented Epic projection          | Authenticated `/admin/capture`; direct URL filter for every represented registered Epic | Passed                            | Exact loaded results were 9 Runner Core, 6 Runner Evidence, 6 Adaptive Blueprint, 1 Commercial, 2 Owner Analytics, 27 Platform, and 2 Marketing. Every returned article contained exactly its selected `Epic: <label>` tag and no contradictory Epic/Bug classification. [Desktop Light evidence](/Users/ivan/Library/Caches/hito-running/qa-browser-evidence/2026-08-17-admin-epic-projection/platform-operations-light-1470x801.png)                                                                                                                                                                    |
| Historical / Legacy                  | `epic=legacy-history`; direct URL, keyboard selection, reload state                     | Passed with truthful empty result | The exact slug stayed in the URL and rendered `Showing 0 of 100 loaded items`. The canonical corpus validator also reports `legacy-history: 0`; no row was fabricated.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Explicit Bug projection              | `epic=bug`; direct URL and reload; desktop/mobile Dark                                  | Passed                            | Sixteen loaded explicit Bug rows each rendered one `Bug` classification and no Epic tag; reload preserved the URL and result set. [Desktop Dark evidence](/Users/ivan/Library/Caches/hito-running/qa-browser-evidence/2026-08-17-admin-epic-projection/bug-filter-dark-1470x801.png)                                                                                                                                                                                                                                                                                                                      |
| Null/malformed diagnostics           | Existing active-plan mirror row with null classification                                | Passed                            | The row rendered neither Epic nor Bug while preserving `missing metadata`, `invalid metadata`, exact diagnostic field lists, source path/URL, and `Markdown is the source of truth. This item is read-only in Work items.` Only `Copy prompt` remained actionable; no edit, note, or delete mutation was exposed. [Read-only diagnostic evidence](/Users/ivan/Library/Caches/hito-running/qa-browser-evidence/2026-08-17-admin-epic-projection/null-malformed-readonly-light-1470x801.png)                                                                                                                |
| Epic filter choices and URL contract | Pointer and native Enter; all eight labels plus Bug                                     | Passed                            | The menu exposed the exact registered labels and separate Bug. Pointer and keyboard selection wrote the exact `epic` slug. Direct links and reload retained every selected slug and factual row set.                                                                                                                                                                                                                                                                                                                                                                                                      |
| Clear all                            | One active Epic and a five-filter combined state                                        | Passed                            | `Clear all` restored `status=all&source=all_work&type=all&priority=all&role=all&epic=all&q=` and 100/100 loaded items without changing repository or Admin data.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Existing filter coexistence          | Platform Epic plus status, source, type, priority, role, and search                     | Passed                            | Done retained Platform and returned 26 matching loaded rows; Active returned 27. Sequential Backlog → Change request → High → Frontend retained the Epic and produced 27 → 8 → 6 → 1 matching rows. Search `light/dark` retained all five filters and returned the one factual row; a non-match returned zero.                                                                                                                                                                                                                                                                                            |
| Keyboard and focus                   | In-app browser and connected Chrome; Enter and Escape                                   | Passed                            | Native Enter opened the filter menu and selected Historical / Legacy. Escape closed the menu and returned visible focus to the `Work-item filters` trigger at desktop and exact 375 px. Filter selection intentionally performs a document navigation through the existing shared `window.location.href` path, so the new document starts at `BODY` identically for Epic and pre-existing Source filters; no Epic-specific focus regression was found.                                                                                                                                                    |
| Quick Notes and notes/history        | Existing Add quick note panel and repository-derived detail                             | Passed                            | The Quick Note form opened with its existing fields and was cancelled without Save or row-count change. Deterministic validator coverage preserved Quick Note delete restrictions, repo-derived update/note/delete rejection, UUIDs, notes, history, metadata, and source identity.                                                                                                                                                                                                                                                                                                                       |
| Authentication                       | Authenticated local Admin sessions plus cookie-free loopback request                    | Passed                            | Existing in-app auth reached Work items; Chrome's unauthenticated direct request reached `/admin/login?next=%2Fadmin%2Fcapture`, and the canonical local Admin identity returned to the requested route without exposing credentials. Cookie-free HTTP followed the same login boundary.                                                                                                                                                                                                                                                                                                                  |
| Read-only and source presentation    | Expanded repository-derived row                                                         | Passed                            | Source type/group/path, `hito://repo/...` URL, Markdown-source copy, diagnostics, generated prompt copy, and technical context remained visible. No repository-derived edit/delete/note control was available.                                                                                                                                                                                                                                                                                                                                                                                            |
| Desktop and mobile themes            | Exact 1470×801 and 375×812; Light and Dark                                              | Passed                            | Every page state had zero page-level horizontal overflow. Mobile articles remained within x=20..355. The filter menu remained within x=60..348 and y=418..811.5; its 1,392 px content used bounded internal vertical scrolling with no horizontal scroll. Tags wrapped within the existing row composition. [Mobile Light](/Users/ivan/Library/Caches/hito-running/qa-browser-evidence/2026-08-17-admin-epic-projection/marketing-growth-light-375x812.png) · [Mobile Dark menu](/Users/ivan/Library/Caches/hito-running/qa-browser-evidence/2026-08-17-admin-epic-projection/epic-menu-dark-375x812.png) |
| Console health                       | Full in-app matrix and independent Chrome keyboard/auth replay                          | Passed                            | Both warning/error inventories were empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Provider/runtime isolation           | Managed local server before and after browser evidence                                  | Passed                            | PID `16082` remained healthy, loopback-only, `qa_fixture`, fresh, and receipt-matching until this receipt. No provider dispatch, hosted access, fixture/database mutation, or duplicate server occurred.                                                                                                                                                                                                                                                                                                                                                                                                  |
| Evidence manifest                    | External local QA cache, captured before the canonical receipt                          | Passed                            | [Admin Epic projection evidence](/Users/ivan/Library/Caches/hito-running/qa-browser-evidence/2026-08-17-admin-epic-projection/admin-epic-projection-evidence.json) preserves direct-link counts, diagnostics, auth, responsive geometry, keyboard outcomes, and console inventories.                                                                                                                                                                                                                                                                                                                      |

### Issues, Coverage Gaps, And Lifecycle

- **Defects:** none demonstrated in the accepted Epic projection contract.
- `legacy-history` has no factual source row in the current corpus. Its exact registered filter,
  direct URL, reload/keyboard behavior, zero-result copy, and deterministic parser/read-model
  acceptance were verified; natural-row rendering remains inapplicable rather than fabricated.
- Full hosted database import, deployment, production authentication, release, and Global QA were
  not run and are not implied by this focused local acceptance.
- As expected, the receipt-only repository snapshot change made the private artifact stale after
  all browser proof was complete: post-receipt status retained managed, healthy, loopback PID
  `16082` and `providerMode: qa_fixture`, but reported `artifact_missing` against the new Admin
  digest. No post-receipt browser result is claimed, and the runtime was not rebuilt or restarted.
- This item is now `completed`. ARCHITECT classification, BACKEND mirror-contract Implementation
  DoD, FRONTEND Product projection Implementation DoD, and this independent local QA acceptance are
  separately recorded. PRODUCT is the next lifecycle reviewer; no implementation handoff is
  required by this passing receipt.

**Verdict: Passed**

Role file: `agents/qa.agent.md`. Project skill used:
`skills/hito-qa-browser-regression/SKILL.md`. Browser-control skills used:
`browser:control-in-app-browser` and `chrome:control-chrome`. No subagent was used.
