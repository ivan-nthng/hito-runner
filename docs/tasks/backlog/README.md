# Hito Backlog

This folder is the single operational source of truth for Hito work. It holds the live queue as well as
retained future work. A status in any spec, brief, or plan is context or history; the matching backlog
item is the authoritative current status.

Use this folder for every retained non-trivial request:

- user-reported bugs
- UI issues with screenshots
- small product improvements
- copy/design cleanup tasks
- backend or QA follow-up items
- investigation notes that need a future owner
- implementation and QA acceptance slices that are currently running

Simple questions and transient discussion do not need an item. A request becomes a task when it needs
an owner, evidence, implementation, validation, or deliberate deferral.

## Operating Queue

Read each item's metadata for the authoritative status and owner. This README deliberately does not
repeat a manual status table: a second hand-maintained index becomes stale and would compete with the
individual canonical records. Admin may project the same metadata after an explicit mirror refresh.

Completed and archival plans remain linked from their historical documents until a link-safe archive
normalization pass moves them. They are not active work.

## File Convention

Backlog item:

`YYYY-MM-DD-<short-slug>.md`

Evidence folder:

`assets/YYYY-MM-DD-<short-slug>/`

## Backlog Item Rules

- Keep each item bounded.
- Follow the canonical work-item identity, lifecycle, scope, frontend-lane, and archival contract in
  `AGENTS.md` section 5.5. `Track Tags` are optional context, not mirrored scope or batch truth.
- Include the user report, evidence, observed behavior, expected behavior, source investigation,
  likely root cause, and the conditional handoff fields required by the canonical lifecycle.
- Separate confirmed source facts from hypotheses.
- Do not store secrets, passwords, tokens, sessions, private keys, or production credentials.
- Do not use backlog items as a substitute for implementation plans when the work becomes broad or risky.
- Link supporting specs, briefs, coach doctrine, and plan documents from the one item instead of
  assigning them a competing operational status.
- Before dispatch, record the exact prompt in the item and verify that the assigned role has no active
  task. A queued item is not sent to an active role.
- Update the same item when a report arrives; never create a replacement task merely because the report
  names a different next role.

## Small-Fix Batches

This batching rule applies when a report is explicitly captured as a bug or deferred backlog work.
Ideas and feature requests stay in normal Product discussion until there is a decision to retain
them. Keep one Markdown item per captured bug or small improvement. Use its optional `Batch`
metadata only when several confirmed items have the same owner, canonical surface, risk class, and
validation story. A descriptive slug such as `2026-07-27-design-system-reference-fixes` is better
than a catch-all daily document.

Three or four compatible items make a batch ready for Product discussion, not automatic execution.
Urgent, user-blocking, privacy/security, auth, persistence, destructive, and release-gating defects
are investigated and routed immediately.

## Screenshot Rule

Routine QA screenshots belong in gitignored `qa-artifacts/`.

Screenshots belong under `docs/tasks/backlog/assets/` only when they are part of a specific backlog
item and should travel with that item.
