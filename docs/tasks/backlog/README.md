# Hito Backlog

This folder stores structured backlog items that are not ready to implement immediately, but should
not be lost.

Use this folder for:

- user-reported bugs
- UI issues with screenshots
- small product improvements
- copy/design cleanup tasks
- backend or QA follow-up items
- investigation notes that need a future owner

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
