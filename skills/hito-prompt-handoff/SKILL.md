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

1. Identify the owning plan/spec/doc file. If it exists, render it as a clickable markdown link with an absolute workspace path. If none exists, say `Plan file: none`.
2. Identify the current task and stage.
3. Decide exactly one next recommended role.
4. Include required reading order.
5. List exact files/surfaces to inspect.
6. State constraints and what not to touch.
7. Specify validation requirements.
8. Specify expected output format.
9. Include handoff block only when continuity would otherwise be lost.

## Hito Prompt Rules

- Start orchestration/review/handoff responses with: `Plan file`, `Task`, `Stage`, `What we did`, `Where we are`, `What we do next`.
- Render existing `Plan file` values as clickable markdown links with absolute workspace paths, not inline code or plain text.
- Always name `Task` and `Stage`.
- Do not assume the next agent remembers chat history.
- Do not ask an agent to implement outside its role.
- Do not split a bounded task across roles prematurely.
- Preserve canonical architecture rules from `AGENTS.md`.
- Keep prompts execution-ready, not inspirational.

## Output

1. Plan file
2. Task
3. Stage
4. What we did
5. Where we are
6. What we do next
7. Exact prompt for that role
8. Optional QA prompt
9. Blockers
