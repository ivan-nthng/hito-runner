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
- Write user-facing explanation/status in Russian by default.
- Write the exact next-role execution prompt in English by default.
- Do not mix Russian into execution prompts unless the user explicitly requests a Russian prompt.
- Render existing `Plan file` values as clickable markdown links with absolute workspace paths, not inline code or plain text.
- Always name `Task` and `Stage`.
- Do not assume the next agent remembers chat history.
- Do not ask an agent to implement outside its role.
- Do not split a bounded task across roles prematurely.
- Provide exactly one immediate next-role prompt per response.
- Do not include optional QA prompts, follow-up prompts, or "after that" prompts unless the user explicitly asks for that single prompt next.
- Include a clearly labelled `Exact prompt for that role` section for any handoff response.
- Do not output a naked prompt without the required shell.
- The exact prompt must be self-contained and include its own expected output/report format.
- Preserve canonical architecture rules from `AGENTS.md`.
- Keep prompts execution-ready, not inspirational.

## Required Handoff Shell

Use this exact shell for orchestration, prior-agent review, checkpoint, and handoff responses:

1. `Plan file`
2. `Task`
3. `Stage`
4. `What we did`
5. `Where we are`
6. `What we do next`
7. `Exact prompt for that role`
8. `Blockers`

The shell is for the user-facing response. The exact prompt inside section 7 is for the next role.

## Exact Prompt Requirements

The prompt inside `Exact prompt for that role` must:

- be in English by default
- target one role only
- start with `Task`
- include `Stage`
- include context and scope
- list exact files/surfaces to inspect when relevant
- list commands or browser policy when validation is required
- include a precise output/report format
- avoid optional second prompts or later-role prompts

For QA handoffs, use a numbered prompt shape:

```md
1. Task

<exact validation task>

2. Stage

QA validation / <specific checkpoint>

3. Context

<what changed and why this validation is needed>

4. Browser Path Preflight

<browser requirement or backend-only reason browser is not used>

5. QA Execution Authority

QA must execute this validation directly. Run the required CLI/build/script/browser/dev-server/local
fixture checks needed to prove the scope. Do not return another handoff prompt merely because the
validation uses commands, browser tooling, screenshots, local artifacts, or disposable local/test
fixtures. Do not edit product code or implement fixes; report failures with evidence.

6. Validation coverage

Read/inspect:
- <file>

Run:
- <command>

7. Required behavior proof

<exact invariants, counts, statuses, and boundaries to verify>

8. Report format

Return:
1. Task
2. Stage
3. Browser Path Preflight
4. QA Execution Authority
5. Validation coverage
6. Issues found
7. Coverage gaps
8. Verdict: Passed or Failed
```

QA handoff wording rule:

- Do not write that the current role cannot perform QA inside the user-facing handoff shell or
  inside the QA prompt.
- Do not write variants such as "this orchestration role cannot run browser/CLI QA", "I cannot run
  QA here", or "the correct step is QA because this role is forbidden to validate".
- In `Where we are`, write the positive state instead: `Ready for direct QA validation.`
- In `What we do next`, write the positive action instead: `Hand this to QA to execute the
  validation directly using the required safe testing tools.`
- Do not imply QA should pass validation to another agent because commands, scripts, browser checks,
  dev servers, screenshots, or local/test fixtures are needed.
- The exact QA prompt should explicitly say that QA may do anything necessary for testing within
  safe local/dev/test validation boundaries, while not implementing product fixes.

## Output

1. Plan file
2. Task
3. Stage
4. What we did
5. Where we are
6. What we do next
7. Exact prompt for that role
8. Blockers
