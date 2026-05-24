# Template Agents

Project-neutral agent templates for a product team that works from one canonical architecture plan.

These files are intentionally not tied to any one repository, product, framework, backend, or platform. Copy the needed files into a new project and adapt only the project-specific paths, commands, and source-of-truth documents.

## Required Operating Model

All agents must follow this sequence:

1. Architect audits the existing system.
2. Architect creates the canonical architecture plan.
3. Product, Designer, Backend, iOS Developer, Copy, QA, and Prompt Engineer work only inside that architecture unless the Architect updates it.
4. Implementation happens in small, reviewable slices.
5. QA verifies behavior and reports evidence before work is considered complete.

QA must use the correct platform path:

- web/browser surfaces use browser QA skills and the project browser policy
- native iOS surfaces use iPhone Simulator, real device, or Xcode tests when available
- Safari is not the default validation surface for native iOS app behavior

## Canonical Architecture Plan

Every non-trivial project must have one active architecture plan before implementation starts.

Recommended project-neutral location:

- `docs/plans/active/YYYY-MM-DD-canonical-architecture-plan.md`

The plan should define:

- product boundary
- system boundary
- canonical data / workflow pipeline
- source-of-truth ownership
- backend/client/platform responsibilities
- persistence and migration rules
- validation and mutation rules
- AI or automation boundaries, if any
- rollout slices
- QA expectations
- known risks and non-goals

## Shared Architecture Rules

- One canonical pipeline. Do not create parallel systems for the same truth.
- Source-of-truth ownership must be explicit.
- Backend/service layer owns validation, normalization, persistence, lifecycle rules, and mutation safety.
- Client/UI layers render, collect, and explain backend-shaped truth. They must not invent final business rules locally.
- Deterministic product truth comes before AI interpretation, recommendations, or automation.
- Risky mutations require explicit review/confirm boundaries.
- Prefer deletion over abstraction.
- Prefer simplification over flexibility.
- Prefer fewer states over configurable states.
- Prefer one path over multiple compatible paths.
- Do not introduce new layers unless removing a larger one.
- Temporary compatibility layers must have removal plans.

## Standard Output Format

For implementation or closeout work:

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers

For architecture, product, design, QA, or prompt planning:

1. Task
2. Stage
3. Current state
4. Findings or recommendation
5. Next recommended role
6. Suggested next step
7. Blockers

## Handoff Block

Use this footer when a task is blocked, handed to another role, or needs continuity:

```md
## Handoff Context

### Summary

<short summary of what was done>

### Key Decisions

- <decision 1>
- <decision 2>

### Current State

- <what is now true in the system>

### Constraints

- <important constraints for next agent>

### Risks / Open Questions

- <any uncertainties or risks>

### Next Recommended Role

<ARCHITECT / PRODUCT / DESIGNER / BACKEND / IOS / QA / COPY / PROMPT-ENGINEER>

### Suggested Next Step

<clear next action>
```
