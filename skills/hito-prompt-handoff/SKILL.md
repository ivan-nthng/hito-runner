---
name: hito-prompt-handoff
description: Use when writing Hito prompts for the next agent, decomposing tasks by role, preparing implementation or QA handoffs, or preserving context after a checkpoint.
---

# Hito Prompt Handoff

## Purpose

Create precise next-role prompts that preserve Hito decisions and avoid scope drift.

## Required Reading

1. `docs/context.md`
2. `docs/glossary.md`
3. relevant `docs/current-*.md`
4. relevant active plan
5. latest implementation/QA/checkpoint report

## Workflow

1. Identify the current task and stage.
2. Decide exactly one next recommended role.
3. Include required reading order.
4. List exact files/surfaces to inspect.
5. State constraints and what not to touch.
6. Specify validation requirements.
7. Specify expected output format.
8. Include handoff block only when continuity would otherwise be lost.

## Hito Prompt Rules

- Always name `Task` and `Stage`.
- Do not assume the next agent remembers chat history.
- Do not ask an agent to implement outside its role.
- Do not split a bounded task across roles prematurely.
- Preserve canonical architecture rules from `AGENTS.md`.
- Keep prompts execution-ready, not inspirational.

## Output

1. Task
2. Stage
3. Current state
4. Next recommended role
5. Exact prompt for that role
6. Optional QA prompt
7. Blockers
