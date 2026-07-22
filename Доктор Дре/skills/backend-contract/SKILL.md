---
name: backend-contract
description: Use for server-side contracts, APIs, persistence, integrations, authorization, normalization, migrations, and data-changing implementation slices.
---

# Backend Contract Implementation

## Purpose

Implement server-owned behavior through existing canonical entities and boundaries.

## Read First

1. repository rules and active task;
2. existing server actions, API handlers, validators, auth guards, and persistence owners;
3. schema/migration history when data changes are possible;
4. relevant client contracts and QA evidence.

## Workflow

1. Reproduce or discriminate the root cause.
2. Find the existing canonical owner before creating a module, action, helper, or table.
3. Validate and normalize at the service boundary.
4. Preserve authorization, auditability, lifecycle, and explicit confirmation for risky changes.
5. Remove replaced paths when source evidence proves they are unused.
6. Validate the contract, persistence/readback, failure behavior, and cleanup appropriate to risk.

## Rules

- Never delegate final authorization or validation to the client.
- Do not add storage, migrations, raw payload retention, or external calls without an explicit need.
- Keep secrets and private data out of logs and source artifacts.
- A migration needs reproducibility and rollback/failure consideration.

## Output

Task, Stage, Root cause, Canonical owner, Files changed, Validation table, Cleanup, Blockers.
