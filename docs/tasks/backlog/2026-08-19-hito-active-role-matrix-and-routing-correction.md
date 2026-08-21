# Hito Active Role Matrix And Routing Correction

Work Item ID: `2026-08-19-hito-active-role-matrix-and-routing-correction`
Status: completed
Type: maintenance
Priority: highest
Owner: ARCHITECT
Primary Area: Platform
Epic: platform-and-operations
Parent: `2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model`
Depends On: `2026-08-19-hito-progressive-context-agent-instructions-and-documentation-map`
Evidence From: `2026-08-19-hito-work-areas-outcome-epics-and-agent-operating-contract-discovery`

## Scope

Correct the active Hito role model after the progressive-context batch compressed it too far. Preserve
one Current owner per Task, while accurately representing the roles that may own distinct bounded
phases: core delivery, specialist decision/review, and constrained Figma work.

## Archive Intent

Retain one concise active-role matrix and routing contract. Do not retain conflicting declarations
that limit canonical ownership to five roles or invent a separate Design System engineer role.
Physical legacy role files remain until a later consumer-safe cleanup proves they are unused.

## Task

The active instructions currently state that only five roles receive new ownership and describe
Design System as a Frontend specialization. Ivan has clarified the intended model:

- Design System implementation is a Frontend responsibility, not a separate Design System engineer.
- Running Coach is a required specialist owner for bounded training-quality and criteria tasks.
- Designer is a required specialist owner for bounded design research/decision tasks.
- Design System Integration is a constrained Figma-only helper role, never repository runtime owner.

Architect must inspect existing role cards and contracts, define the smallest truthful active-role
matrix, and align the root map, routing contract and directly affected role cards. A Task still has
exactly one Current owner at a time; sequential handoffs use the same Task and append history.

## User Report

Ivan identified that the five-role declaration omitted real working roles such as Running Coach and
Designer, while incorrectly implying that Design System requires its own engineer.

## Evidence

- `AGENTS.md` currently declares that only five roles receive new ownership.
- `docs/process/hito-task-and-role-routing.md` has the corresponding five-role section.
- Existing cards include `agents/running-coach-agent.md`, `agents/designer.agent.md`,
  `agents/design-system-integration.agent.md`, `agents/design-system.agent.md` and
  `agents/frontend.agent.md`.

## Observed Behavior

The current wording would reject or misroute a new Running Coach or Designer task and leaves unclear
whether shared Design System work belongs to Frontend or an additional engineer role.

## Expected Behavior

The operating contract names all active routes honestly, makes Frontend responsible for Design
System repository implementation, retains Running Coach and Designer as specialist task owners, and
keeps Design System Integration Figma-only. It must also identify retained legacy role files without
making them accidental new-task owners.

## Required Discriminator

Source-backed role-card and routing review must distinguish an active ownership responsibility from
a retained historical file before any role is marked inactive or changed.

## Preflight

- Existing seams: `AGENTS.md`, `docs/process/hito-task-and-role-routing.md`, and the directly
  affected `agents/` role cards.
- New runtime artifacts: none.
- New documentation artifacts: none unless an existing canonical document cannot own the matrix.
- Simplification: one active role matrix replaces conflicting five-role and separate-DS-owner wording.

## What Not To Touch

- Runtime source, Supabase, fixtures, Notion, hosted services, dependencies, Git lifecycle and
  legacy physical-file deletion.
- One-Task/one-Current-owner, pull-based intake, same-Task QA return and Product decision authority.
- Frontend's existing Product, Marketing and DevTools boundaries except where a Design System
  implementation lane must be named to prevent ambiguity.

## Validation Expectations

- Every active role and instruction link resolves.
- The active-role matrix has no conflicting ownership declaration.
- No documented role receives overlapping runtime ownership.
- Scoped Prettier, duplication/reachability checks and `git diff --check` pass.

## Stage

ARCHITECT documentation-only role and routing correction completed.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

None. The correction is complete and returns to PRODUCT.

## Implementation Receipt

### Outcome

Corrected the compressed five-role declaration with one active matrix that preserves exactly one
Current owner per Task:

| Class         | Active roles                              | Sole admitted responsibility                                                                                                |
| ------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Core delivery | PRODUCT, ARCHITECT, FRONTEND, BACKEND, QA | Product authority, architecture, repository UI/DS implementation, server/data truth and independent acceptance respectively |
| Specialist    | RUNNING COACH, DESIGNER                   | Bounded training-quality/criteria work and bounded design research/decision work respectively                               |
| Figma-only    | DESIGN SYSTEM INTEGRATION                 | Approved Figma discovery, mutation, mapping and verification; repository runtime source remains read-only                   |

Design System repository implementation is now unambiguously the FRONTEND `Design System` lane.
`agents/design-system.agent.md` remains physically present as a marked legacy compatibility file but
cannot own new work. Other role files outside the active matrix remain retained legacy material and
are not activated by their presence.

Sequential specialist, implementation and QA phases retain one Task identity. Each meaningful owner
or phase transition updates that Task and appends its durable history; no handoff or QA retry creates
a duplicate Task.

### Files Changed

- `AGENTS.md`
- `docs/process/hito-task-and-role-routing.md`
- `agents/frontend.agent.md`
- `agents/running-coach-agent.md`
- `agents/designer.agent.md`
- `agents/design-system-integration.agent.md`
- `agents/design-system.agent.md`
- this canonical item

No runtime, Supabase, Notion, fixture, hosted, dependency, Git-lifecycle or physical legacy-file
change was made.

### Validation

| Check                       | Scenario / environment                                          | Result | Evidence                                                                                                            |
| --------------------------- | --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Active instruction links    | Root map, routing contract and directly affected role cards     | Passed | Every local Markdown target resolved                                                                                |
| Ownership exclusivity       | Active role matrix and role-card responsibilities               | Passed | FRONTEND is the only repository DS implementation owner; specialists and Figma work have non-overlapping boundaries |
| Lifecycle invariants        | Pull intake, one Current owner, same-Task handoff and QA return | Passed | Existing routing rules retained and matrix uses sequential transitions only                                         |
| Duplication/reachability    | Active versus retained legacy role declarations                 | Passed | One detailed active matrix; legacy DS card explicitly cannot receive new Tasks                                      |
| Formatting and diff hygiene | Eight changed Markdown files                                    | Passed | Scoped Prettier, whitespace scan and `git diff --check`                                                             |

Browser, build, runtime, database, hosted, Notion, release and Global QA checks were omitted because
this batch changes documentation only.

### Residual Boundary And Next Owner

Legacy role files were not deleted or moved. Their later cleanup requires direct consumer/reference
proof and separate Product admission. No unresolved active-role ambiguity remains inside this task.

Next owner: **PRODUCT** for acceptance and any separately authorized downstream routing. No successor
was dispatched.
