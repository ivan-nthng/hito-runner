---
name: hito-plan-writing-and-closeout
description: Use when creating, updating, pausing, closing, or archiving an Hito plan.
---

# Hito Plan Writing And Closeout

## Purpose

Keep plans supporting and compact; the canonical backlog item remains the operational lifecycle.

## When To Use

Use only for a Tracked multi-step, risky, cross-surface, or durable plan decision. Do not create a
plan for routine Lite implementation, QA, cleanup, or an instruction-only edit.

## Plan Rules

- A plan under docs/plans/active/ supports one canonical backlog item; it never becomes a second
  active queue.
- Include only the detail another owner needs: status, owner, context, problem, boundaries,
  responsibilities, proof, risks, exit criteria, and next action.
- Keep receipts compact. Link validators, QA artifacts, and manifests rather than pasting terminal
  logs, subagent transcripts, or repeated prompts.
- Use completed for accepted outcomes, closed for cancelled/superseded work, blocked only for a
  named gate, and backlog for retained unready work.

## Closeout

- Keep the backlog item lifecycle truthful.
- Add technical-log evidence for accepted user-impacting, QA-acceptance, cleanup, local-tooling, or
  durable-process outcomes. Routine Lite receipts are exempt.
- Add public changelog entries only for shipped user-facing highlights.
- Archive a plan only after it no longer guides open work and inbound links are reconciled.

## Validation

For documentation-only changes, verify links/metadata and run git diff --check. Do not run a build
unless runtime code changed.
