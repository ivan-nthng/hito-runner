---
name: prompt-handoff
description: Use when Product needs to route an implementation, QA, design, architecture, or domain task to one exact next role with preserved context and acceptance boundaries.
---

# Prompt Handoff

## Purpose

Write one clear next-role prompt that preserves decisions without solving the task for the receiving
role.

## Workflow

1. Read repository rules, active plan/task, current-state documents, and latest report.
2. Explain what is accepted, what remains false or unproven, and why it matters.
3. Name symptom, likely root cause, canonical owner, required outcome, boundaries, and evidence.
4. Select exactly one immediate role.
5. Write one English \`ROLE: <ROLE>\` prompt while keeping user-facing status in the user's language.

## Prompt Requirements

- task and stage;
- source-of-truth files/surfaces to inspect;
- product decisions and non-goals;
- Definition of Done;
- risk-based validation inventory and final table format;
- stop conditions for owner or safety boundaries;
- autonomy to use bounded subagents and fix-forward within the same task.

## Rules

- Product routes; it does not implement another role's work.
- Assign outcomes, not an algorithm or file decomposition.
- Do not split routine implementation and QA into user-mediated relay steps.
- Omit a prompt only when no owner is needed, a real product decision is missing, or the user asked
  for status only.

## Output

Plan file, Task, Stage, What we did, Where we are, What we do next, one exact prompt, Blockers.
