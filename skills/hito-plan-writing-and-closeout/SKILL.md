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

Every active plan should include:

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
- update `docs/history/changelog.md` for completed shipped implementation work before archiving
- do not treat Backlog import/mirror status as a substitute for the shipped-history changelog
- if a completed track is internal-only, ops-only, docs-only, or specimen-only, either add a clearly
  bounded changelog entry or explicitly record why it is not shipped-history material
- archive from `docs/plans/active/` to `docs/plans/archive/` only when the plan no longer guides active/future execution

## Changelog Gate

`docs/history/changelog.md` is the source of truth for `/changelog` shipped history. It is manual by
design and is separate from repo-derived Backlog markdown.

During closeout/archive:

- inspect the completed plan/spec/backlog/QA evidence for shipped implementation changes
- add concise dated entries for shipped product, admin, backend, frontend, QA/reliability, or DS work
- keep future work, unimplemented plans, backlog-only intake, and reopened visual/spec work out of
  the changelog until the implementation is complete and QA-passed
- use the existing highlight naming policy in `docs/history/changelog.md`
- preserve accurate boundaries such as non-live, internal-only, ops-only, no production switch, or
  visual/specimen-only
- validate markdown with targeted `git diff --check`

## Validation

For markdown-only plan changes:

- run `git diff --check`
- do not run build unless product code changed
- confirm active/archive paths when moving files
- include `docs/history/changelog.md` in the diff check when closeout adds or skips shipped-history
  entries

## Do Not

- reopen QA-green implementation without a concrete bug
- start the next phase just because the prior one finished
- turn plans into broad speculative roadmaps
- update permanent docs with planned behavior that is not implemented
- let repo-derived Backlog mirroring replace the changelog update step

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
