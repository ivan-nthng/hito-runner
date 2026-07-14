---
name: hito-plan-writing-and-closeout
description: Use when creating, updating, pausing, closing, or archiving Hito plans in docs/plans/active or docs/plans/archive.
---

# Hito Plan Writing And Closeout

## Purpose

Keep Hito planning artifacts canonical, current, and easy for the next role to execute.

## Active Plan Rules

Use `docs/plans/active/` for live work that still guides execution.

When reporting, handing off, or summarizing plan work, render every referenced plan, task, backlog
item, frontend spec, archive doc, QA report, or current-doc path as a clickable Markdown link with an
absolute workspace path. Do not leave project document paths as plain relative text or inline-code
only references.

Every new or substantially reworked active plan should include:

- Status
- Owner
- Last Updated
- Context
- Problem Definition
- Responsibilities
- QA Expectations
- Risks
- Exit Criteria
- Next Recommended Role
- Suggested Next Step

Routine ledger updates, cleanup closeouts, dashboard syncs, and metadata-only maintenance do not need
to restate every section. Keep them to the compact facts needed by the next role.

## Repo-Derived Admin Backlog Mirror Compatibility

Plans under `docs/plans/active/` and `docs/plans/archive/` are mirrored into the admin Backlog.
Every new or materially updated plan should keep one canonical import-ready metadata block in the
markdown itself so the importer and copied handoff prompt stay deterministic.

Required canonical sections:

- `Status`
- `Type`
- `Priority`
- `Next Recommended Role`
- `Task`
- `Stage`
- `Exact Handoff Prompt`

Allowed canonical values:

- `Status`: `backlog`, `in_progress`, `completed`, `closed`, `archived`
- `Type`: `bug`, `change_request`, `context_capture`, `plan`, `frontend_spec`, `product_brief`
- `Priority`: `low`, `medium`, `high`, `urgent`
- `Next Recommended Role`: `architect`, `backend`, `frontend`, `designer`, `copy`, `qa`,
  `product`, `running_coach`

Plan-specific sections such as `Context`, `Problem Definition`, `Responsibilities`, `QA
Expectations`, `Risks`, `Exit Criteria`, or `Suggested Next Step` remain valid and often required,
but they do not replace the canonical import-ready block.

## Closeout Rules

When a track is complete:

- mark the plan `Complete / Closed` if no future phases remain
- mark it `Paused after <phase>` if future phases remain but work should stop now
- record residual QA hygiene as non-blocking if it does not justify reopening implementation
- update `docs/history/technical-log.md` for every accepted implementation, QA acceptance,
  source-cleanup, local-tooling, or durable process slice before closeout, or explicitly record why
  the slice is not technical-log material
- update `docs/history/changelog.md` only for curated public highlights from completed shipped
  implementation work before archiving
- do not treat Backlog import/mirror status as a substitute for the technical log or public
  changelog
- if a completed track is internal-only, ops-only, docs-only, or specimen-only, either add a clearly
  bounded changelog entry or explicitly record why it is not shipped-history material
- archive from `docs/plans/active/` to `docs/plans/archive/` only when the plan no longer guides active/future execution

## Compact Cleanup Ledger Rules

For cleanup, docs compression, artifact retention, QA evidence cleanup, local tooling, and apply
slices, active plans should stay compact.

Record only durable source-of-truth facts:

- date and slice/command
- root cause and owner boundary in one or two lines
- affected root or file set
- before/after counts and bytes when relevant
- manifest, dry-run, QA report, or apply-result paths
- validation commands passed
- next gate, hold decision, or blocker

Do not paste full terminal output, per-file manifests, subagent transcripts, repeated handoff
prompts, long execution logs, or large inventories into active plans. Those details belong in
machine-readable manifests, QA reports, apply-result files, or the role's final report.

If a cleanup slice removes files/bytes but the closeout adds a large Markdown block, compact the
closeout before returning. A plan update should not materially undo the readability win of the
cleanup it records.

## Minimal Documentation Gate

Before creating or expanding Markdown, ask whether source code, a validator, a manifest, a QA
artifact, or a short final report would be the better source of truth.

- Do not create new plan/spec/task docs for routine implementation, cleanup, validation, or
  regression-fix slices.
- Prefer appending one compact ledger entry to an existing active plan when durable tracking is
  needed.
- Do not duplicate evidence already stored in validators, manifests, QA reports, build output, or
  source comments.
- Keep active plans useful for next execution, not as transcripts of agent work.
- If a docs update is larger than the durable decision it records, rewrite it smaller before
  closeout.

## History Gate

`docs/history/changelog.md` is the curated public source of truth for `/changelog` Highlights.
`docs/history/technical-log.md` is the complete internal accepted-slice ledger for Technical log.
Both are manual by design and are separate from repo-derived Backlog markdown.

During closeout/archive:

- inspect the completed plan/spec/backlog/QA evidence for shipped implementation changes
- add dated `docs/history/technical-log.md` entries for all accepted product, admin, backend,
  frontend, QA/reliability, DS, local-tooling, source-cleanup, and durable process work
- use actual evidence/completion dates when available instead of dumping multi-day work into one
  catch-up date
- add concise dated `docs/history/changelog.md` entries only for durable public highlights
- never orphan older history when changing the log model: if a source is split or migrated, mirror
  prior dated entries into the new owner before treating the new model as complete
- keep future work, unimplemented plans, backlog-only intake, and reopened visual/spec work out of
  public changelog highlights until the implementation is complete and QA-passed; technical-log
  entries may mention planning/spec work when it is the accepted durable outcome
- use the existing highlight naming policy in `docs/history/changelog.md`
- preserve accurate boundaries such as non-live, internal-only, ops-only, no production switch, or
  visual/specimen-only
- validate markdown with targeted `git diff --check`

## Validation

For markdown-only plan changes:

- run `git diff --check`
- do not run build unless product code changed
- confirm active/archive paths when moving files
- include `docs/history/technical-log.md` in the diff check for every accepted closeout, and include
  `docs/history/changelog.md` when public highlights are added or intentionally skipped

## Do Not

- reopen QA-green implementation without a concrete bug
- start the next phase just because the prior one finished
- turn plans into broad speculative roadmaps
- update permanent docs with planned behavior that is not implemented
- let repo-derived Backlog mirroring replace the technical-log or changelog update step

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
