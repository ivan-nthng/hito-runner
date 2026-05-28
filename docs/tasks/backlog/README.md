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
- Include the user report, evidence, observed behavior, expected behavior, source investigation,
  likely root cause, next recommended role, and exact handoff prompt.
- Separate confirmed source facts from hypotheses.
- Do not store secrets, passwords, tokens, sessions, private keys, or production credentials.
- Do not use backlog items as a substitute for implementation plans when the work becomes broad or risky.

## Screenshot Rule

Routine QA screenshots belong in gitignored `qa-artifacts/`.

Screenshots belong under `docs/tasks/backlog/assets/` only when they are part of a specific backlog
item and should travel with that item.
