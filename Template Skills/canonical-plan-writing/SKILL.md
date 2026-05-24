---
name: canonical-plan-writing
description: Use when creating or updating an implementation-ready architecture or product plan that other agents must follow.
---

# Canonical Plan Writing

## Purpose

Create one plan that becomes the source of truth for a bounded track.

## Required Sections

Use these unless the user specifies a stricter format:

- Status
- Owner
- Last Updated
- Context
- Problem Definition
- Canonical Rule / Architecture Decision
- Scope
- Non-Goals
- Backend / Service Responsibilities
- Frontend / Client Responsibilities
- iOS Responsibilities, if applicable
- QA Expectations
- Risks
- Exit Criteria
- Next Recommended Role
- Suggested Next Step

## Plan Rules

- One concept, one canonical plan.
- Define source-of-truth ownership.
- Define validation and mutation boundaries.
- Define what must not regress.
- Split work into small role-based slices.
- Choose exactly one next recommended role.
- Do not turn the plan into speculative roadmap noise.

## Closeout Rules

When a track is complete:

- mark status complete/closed or paused
- record residual non-blocking follow-ups
- archive only when future phases are not still active in the plan
- do not reopen implementation without a concrete issue

## Output

1. Task
2. Stage
3. Root cause or current state
4. Files changed
5. What changed
6. Validation results
7. Blockers
