# Retained Task Evidence

`docs/tasks/backlog/` stores linked technical contracts, decisions and compact receipts. It is not
the current queue. The `Hito Running` Notion Tasks database alone owns Status, Phase, Priority,
Current owner, Latest update, Next action and dispatch.

## Use

- A live Notion Task may link one document here when durable technical context is required.
- Terminal documents retain only the accepted outcome, unique evidence, residual boundary and
  stable links needed for traceability.
- Metadata, handoff prompts and next-step text in these files are frozen artifact context. They do
  not resume, block, assign or dispatch work.
- Product briefs, frontend specs, plans, history and Admin capture rows are supporting evidence, not
  competing Tasks.

## File Convention

- Task evidence: `YYYY-MM-DD-<short-slug>.md`
- Durable task assets: `assets/YYYY-MM-DD-<short-slug>/`
- Routine screenshots: gitignored `qa-artifacts/`

Keep evidence bounded, secret-free and source-backed. Link to the current owner instead of copying
its contract. Create or change operational work only in Notion under the
[routing contract](../../process/hito-task-and-role-routing.md).
