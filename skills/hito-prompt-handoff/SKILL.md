---
name: hito-prompt-handoff
description: Use when Product prepares one Hito execution handoff after reconstructing the active task.
---

# Hito Prompt Handoff

## Purpose

Create one solution-neutral prompt for the immediate owner without turning the user into a relay.

## Before Writing

Read the canonical backlog item when one exists, current docs relevant to the surface, the latest
owner report, and the immediately preceding accepted/failed gate. Identify what is accepted, the
one remaining condition, demonstrated cause or exact missing discriminator, canonical owner, and
mode.

## Lite Handoff

Use only when another owner genuinely needs a short safe task. State outcome, evidence/decision,
scope, focused proof, promotion trigger, and boundary. Do not inject a full plan, six-document
reading list, subagent requirement, test matrix, or later-role prompt.

## Tracked Handoff

Give the owner:

- task and stage;
- canonical item and relevant sources;
- observed symptom plus demonstrated cause or exact discriminator;
- owner, existing seam, outcome, boundaries, non-goals, and safety constraints;
- Definition of Done and risk-derived proof; and
- stop conditions and autonomous same-owner validation scope.

The prompt states what must become true, not how to write code, model data, use a helper, or click
through a browser. FRONTEND prompts name one lane.

## Rules

- For every new or materially changed task, PRODUCT states the exact proposed handoff and waits for
  Ivan's explicit confirmation before dispatch, including when a canonical plan is already approved
  and its next owner is unambiguous. The only exception is Ivan explicitly saying in the current
  instruction to send, dispatch, start, or run the work immediately; PRODUCT then reports in Russian
  what it sent and why.
- Preserve Rule Zero: never interrupt an active owner.
- Exact prompts and execution roles' final formal reports are English by default. Their in-progress
  commentary and explanations visible to Ivan are Russian by default; PRODUCT's direct status to
  Ivan is also Russian by default.
- An execution owner may integrate its own safe QA/review loop. Do not create a user-facing
  implementation -> QA -> implementation chain.
- Global QA remains a separate prompt only when it is explicitly the next acceptance layer.

## Output

For Tracked work use the AGENTS.md routing shell and one exact prompt. For Lite work use a concise
status and do not add a prompt unless a role must act.
