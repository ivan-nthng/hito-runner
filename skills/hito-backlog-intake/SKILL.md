---
name: hito-backlog-intake
description: Use when retaining a Hito bug, screenshot, improvement, or unclear request as canonical backlog work.
---

# Hito Backlog Intake

## Purpose

Turn retained feedback into one factual, executable backlog item without implementing the fix.

## Workflow

1. Preserve the user report, attachment, time, and visible behavior.
2. Check docs/tasks/backlog/ for an existing item before creating another.
3. Inspect only enough source to identify an owner, source facts, and a confirmed cause or exact
   discriminator still needed.
4. Classify Lite or Tracked under AGENTS.md.
5. Create/update one canonical item only when the user asks retention, the task is deferred, it
   survives the turn, or a handoff is required.
6. Keep user-supplied permanent evidence under docs/tasks/backlog/assets/<slug>/; keep routine QA
   screenshots under qa-artifacts/.

## Required Item Facts

Every retained item has Work Item ID, Status, Type, Priority, Owner, Scope, Archive Intent, Task,
User Report, Evidence, Observed Behavior, Expected Behavior, Source Investigation, Likely Root Cause
or Required Discriminator, What Not To Touch, and Validation Expectations.

Tracked ready/in-progress work also has Stage, Next Recommended Role, and one exact handoff prompt.
Do not manufacture a future prompt for terminal history.

## Rules

- A screenshot proves a visible symptom, not a backend or persistence cause.
- Keep bugs individual unless PRODUCT explicitly groups compatible evidence, owner, risk, and proof.
- Do not run implementation, migrations, destructive commands, or broad QA.
- Do not store credentials, tokens, sessions, secrets, or private payloads.

## Output

Link the item, evidence, confirmed facts, remaining hypothesis/discriminator, owner, and the next
condition for execution.
