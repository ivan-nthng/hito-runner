---
name: hito-backlog-intake
description: Use when capturing Hito bugs, UI screenshots, improvement ideas, product irritations, or unclear user feedback into structured backlog items without implementing code.
---

# Hito Backlog Intake

## Purpose

Convert messy user feedback into a clear, investigated, evidence-backed backlog item that another
role can execute later.

## When To Use

Use this skill when the user asks to:

- add something to the backlog
- capture a bug or improvement
- save a screenshot-backed issue
- investigate where a visible problem lives
- prepare a future task from rough product feedback
- triage UI, copy, backend, QA, design, or coaching backlog work

## Storage Contract

Backlog items live under:

`docs/tasks/backlog/`

Backlog item files use:

`docs/tasks/backlog/YYYY-MM-DD-<short-slug>.md`

Permanent backlog evidence lives under:

`docs/tasks/backlog/assets/YYYY-MM-DD-<short-slug>/`

Use `qa-artifacts/` only for routine QA screenshots. Use the backlog `assets/` folder when the
screenshot or attachment is part of the backlog item itself and should travel with the task.

## Admin Backlog Import Compatibility

Backlog items under `docs/tasks/backlog/` are mirrored into the admin Backlog, so every new or
materially updated backlog item must include one canonical import-ready metadata block in the
markdown itself before any extended human-facing sections.

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

Backlog-specific fields such as `Severity`, `Owner`, `Reported`, `Evidence`, `Observed Behavior`,
and `Validation Expectations` remain required for human triage, but they do not replace the
canonical import-ready block.

## Workflow

1. Read the user's report carefully and preserve the core complaint.
2. Check whether an existing backlog item already covers the same issue.
3. If a screenshot or attachment is provided, describe what is visible and store/reference it.
4. Inspect relevant code/docs/routes to identify likely ownership.
5. Separate confirmed facts from hypotheses.
6. Decide item type, severity, priority, status, and next owner.
7. Create or update the backlog markdown file.
8. Include a precise handoff prompt for the next role.
9. Run `git diff --check` for markdown-only changes.

## Clarification Rule

Ask a concise clarifying question before writing the backlog item when:

- the expected behavior is unclear
- the screenshot does not show the affected surface clearly
- multiple possible fixes have different product consequences
- the requested change could affect data, auth, payments, plan generation, or destructive actions
- the user report lacks enough context to avoid creating a bad task

Do not ask for clarification when a reasonable low-risk backlog assumption is enough; state the
assumption in the backlog item instead.

## Investigation Rules

- Prefer `rg` for code search.
- Read only the files needed to identify the likely owner and root-cause hypothesis.
- Do not run product implementation, migrations, destructive commands, or broad QA.
- Browser inspection is optional and only for understanding a visible surface; it is not a QA pass.
- If runtime proof is needed, hand off to QA.
- If data or SQL proof is needed, hand off to BACKEND.

## Backlog Item Required Sections

Every backlog item should include:

- `Status`
- `Type`
- `Task`
- `Stage`
- `Issue Category`
- `Severity`
- `Priority`
- `Human Priority`
- `Human Status`
- `Owner`
- `Reported`
- `User Report`
- `Evidence`
- `Observed Behavior`
- `Expected Behavior`
- `Source Investigation`
- `Likely Root Cause`
- `Recommended Fix Direction`
- `What Not To Touch`
- `Validation Expectations`
- `Next Recommended Role`
- `Exact Handoff Prompt`

## Human Triage Labels

These labels are for human backlog filtering only. They must not replace the canonical Admin importer
`Status`, `Type`, or `Priority` block.

Issue Category:

- `bug`
- `improvement`
- `design`
- `copy`
- `backend`
- `qa`
- `research`
- `question`

Severity:

- `blocker`
- `high`
- `medium`
- `low`

Human Priority:

- `now`
- `next`
- `later`
- `parking-lot`

Human Status:

- `new`
- `triaged`
- `ready`
- `blocked`
- `done`
- `archived`

## Guardrails

- Do not implement code.
- Do not mutate product data.
- Do not turn backlog intake into broad redesign.
- Do not create vague tickets without source context.
- Do not store secrets, passwords, tokens, sessions, private keys, or production credentials.
- Do not duplicate existing backlog items; link or update the existing item instead.
- Do not claim a root cause is confirmed unless source/runtime evidence supports it.

## Output

1. Task
2. Stage
3. Backlog item
4. Evidence captured
5. Source investigation
6. Triage
7. Validation results
8. Blockers / clarification needed
