---
name: prompt-handoff-writing
description: Use when preparing exact prompts for the next role, decomposing work into agent handoffs, or turning plans/reports into implementation-ready tasks.
---

# Prompt Handoff Writing

## Purpose

Create precise one-role prompts that preserve context and avoid scope drift.

## Workflow

1. Read the canonical architecture plan and current active plan.
2. Read the last implementation, QA, or checkpoint report.
3. Decide the next role.
4. Write one bounded prompt with:
   - task
   - stage
   - context
   - required reading order
   - files/surfaces to inspect
   - exact requirements
   - constraints / what not to touch
   - validation
   - expected output format
5. Include a QA prompt only when verification should immediately follow.

## Rules

- Choose exactly one next role by default.
- Do not ask an agent to do work outside its role.
- Do not hide decisions in vague wording.
- Do not invent state that is not in docs or reports.
- Preserve blockers and residual risks.

## Output

1. Task
2. Stage
3. Current state
4. Next recommended role
5. Exact prompt for that role
6. Optional QA prompt
7. Blockers
