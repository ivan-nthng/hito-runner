---
name: hito-prompt-handoff
description: Use when writing Hito prompts for the next agent, decomposing tasks by role, preparing implementation or QA handoffs, or preserving context after a checkpoint.
---

# Hito Prompt Handoff

## Purpose

Create precise next-role prompts that preserve Hito decisions and avoid scope drift.

This skill is owned by Product for routine Hito routing. Product reads the prior-agent report,
explains the current state to the user, and writes the next-role prompt directly.

## Always-Visible Root-Cause Handoff Gate

Before writing any next-role prompt, ask:

`Is this prompt sending the next agent to fix the root cause, or only the visible symptom?`

If it is only symptom-level, rewrite the handoff before sending it. The prompt must name:

- the visible symptom
- the suspected underlying cause
- the canonical owner that should fix it
- the existing seam/pattern that should be reused first
- the stop condition if the true root cause belongs to another role

For BACKEND and FRONTEND prompts, this gate is mandatory in the `Root cause and architecture fit`
section. For QA prompts, this gate becomes explicit source-boundary proof and stop conditions.

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
6. Add subagent guidance when the next role can safely run independent read-only audits, tests,
   source scans, or non-mutating validation without user attention.
7. State constraints and what not to touch.
8. Specify validation requirements.
9. Rely on the standard report formats in `AGENTS.md` by default. Specify custom output only when
   the task needs stricter evidence, unusual ordering, or a non-standard report shape.
10. Do not include a long continuity footer by default. Use only the standard shell plus `Blockers`
   for routine Product prompt-routing.

## Product-Owned Direct Handoff

Use this mode when Product receives another agent's result and needs to decide what happens next.

Product writes the next-role prompt directly. Do not create an intermediate package for a separate
prompt-writing role.

The handoff must:

- be written in Russian around the exact prompt and English inside the exact prompt by default
- put the exact next-role prompt inside one fenced code block
- name the active plan/spec/doc with an absolute clickable file link in the surrounding Russian
  shell
- translate the prior agent's report into human product context: what the work solved globally, why
  it matters, what is now actually possible, and what remains future/blocked/out of scope
- include the prior agent's task, stage, changed files, validation evidence, blockers, and product
  acceptance status
- list the source-of-truth files the next role should use
- state the immediate next owner
- state constraints, non-goals, and known product decisions
- avoid optional second prompts or later-role prompts
- avoid implementation details beyond what the next role needs to execute safely
- end with `Blockers`; do not append a long continuity footer unless context would otherwise be lost

If this routing layer would add noise for a trivial follow-up, say that directly and recommend the
simpler one-step handoff.

Recommended response shape:

~~~text
Plan file:
<clickable absolute Markdown link, or none>

Task:
<current task>

Stage:
<current stage>

What we did:
<compact prior-agent result in human language: what changed globally and why it matters>

Where we are:
<accepted / rejected / blocked / ready for next role, explained in plain Russian product context>

What we do next:
<one immediate next action>

Exact prompt for that role:
~~~md
ROLE: <ROLE>

Task:
<execution-ready task>

Stage:
<stage>

Context:
<self-contained context>

Scope:
<exact scope>

Validation:
<required checks>
~~~

Blockers:
<none or concrete blockers>
~~~

## Hito Prompt Rules

- Start orchestration/review/handoff responses with: `Plan file`, `Task`, `Stage`, `What we did`, `Where we are`, `What we do next`.
- When reviewing another agent's work, do not make `What we did` and `Where we are` feel like copied
  tracker fields. Explain the story in Russian: what problem this slice solved, what capability is
  now real, what is still not real, and why the next role is the right owner.
- Write user-facing explanation/status in Russian by default.
- Write the exact next-role execution prompt in English by default.
- Do not mix Russian into execution prompts unless the user explicitly requests a Russian prompt.
- Render existing `Plan file` values as clickable markdown links with absolute workspace paths, not inline code or plain text.
- Render any referenced plan, task, backlog item, frontend spec, archive doc, QA report, or current-doc path as a clickable markdown link with an absolute workspace path.
- Always name `Task` and `Stage`.
- Do not assume the next agent remembers chat history.
- Do not ask an agent to implement outside its role.
- Do not split a bounded task across roles prematurely.
- Provide exactly one immediate next-role prompt per response.
- Do not include optional QA prompts, follow-up prompts, or "after that" prompts unless the user explicitly asks for that single prompt next.
- Include a clearly labelled `Exact prompt for that role` section for any handoff response.
- Do not output a naked prompt without the required shell.
- Do not append `HANDOFF BLOCK` or another long continuity footer to routine Product routing
  responses. The prompt plus `Blockers` is the default close.
- The exact prompt must be self-contained, but it must not duplicate routine report formats from
  `AGENTS.md`. Include report instructions only for custom evidence or stricter task-specific
  output requirements.
- Preserve canonical architecture rules from `AGENTS.md`.
- Keep prompts execution-ready, not inspirational.
- For BACKEND and FRONTEND implementation/debugging prompts, require root-cause investigation and
  architecture-fit checks before the agent patches code.
- Do not let BACKEND or FRONTEND prompts ask for symptom patches only. They must direct the agent to
  find the canonical owner, reuse existing Hito seams, and fix the underlying cause when the slice can
  safely cover it.
- For non-trivial prompts to agents that code, QA, audit, research, design, or route work, include
  subagent expectations when useful: the next agent should use or reuse subagents for safe
  independent read-only audits, tests, source scans, and non-mutating validation; close completed
  subagents; integrate findings themselves; and avoid routing every small subtask back to the user.
- For Hito Stack Simplification prompts to ARCHITECT or BACKEND, include subagent expectations by
  default. If you intentionally omit them, state why the task is single-file, inherently sequential,
  or blocked by unavailable subagent tooling.
- For global simplification cleanup, prefer an autonomous same-owner batch prompt over a micro-gate
  prompt when source proof shows several adjacent seams can be handled by one role with one
  validation story. The prompt must include stop conditions, progress estimate reporting, and
  subagent expectations so the user is not forced into a copy-paste operator loop.
- If subagent/thread tools are unavailable to the current Product router, say that briefly in the
  user-facing shell when relevant, but do not use it as an excuse to keep producing micro-prompts.
  Instead, write the next prompt so the execution role uses subagents where available or performs
  safe sequential audits locally, completes the bounded batch, and returns only on validation
  failure, owner-boundary crossing, mutation/browser-risk escalation, or product decision need.
- For Hito Stack Simplification routing, an ARCHITECT prompt should usually select an autonomous
  execution batch, not merely one tiny next gate, unless fresh evidence shows only one safe seam
  exists. If it must select only one seam, the prompt must explain the stop condition and why batching
  would be unsafe.

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
- start with `ROLE: <ROLE>`
- include `Task`
- include `Stage`
- include context and scope
- include `Root cause and architecture fit` for BACKEND or FRONTEND implementation/debugging prompts
- list exact files/surfaces to inspect when relevant
- list commands or browser policy when validation is required
- include subagent/read-only audit guidance when independent checks can run safely inside the next
  role's scope
- rely on `AGENTS.md` standard report formats by default; include custom output requirements only
  when the task needs them
- avoid optional second prompts or later-role prompts

For BACKEND and FRONTEND prompts, `Root cause and architecture fit` must tell the agent to:

- investigate source-of-truth, logs/state/data flow, and nearby ownership before changing code
- distinguish the visible symptom from the underlying cause
- reuse existing modules, contracts, validators, server actions, persistence seams, components, Hito
  DS/admin/product patterns, and helpers before adding anything new
- avoid parallel product systems, duplicate frontend/backend truth, one-off custom UI, broad
  abstractions, or compatibility layers without removal plans
- implement the smallest safe root-cause fix in the canonical owner, or explicitly report the
  systemic follow-up if the real fix is outside the current slice
- clean up dead code from failed or replaced attempts when safe

For QA handoffs, use a numbered prompt shape:

```md
ROLE: QA

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

Do not add a long continuity footer after `Blockers` unless the task is blocked, genuinely gated
with context not already captured in the prompt, too large for the standard shell to preserve
continuity, or the user explicitly requests it.
