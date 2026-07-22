# Doctor Dre Agent Kit

Portable operating guidance for a multi-agent software team. This folder contains no product code,
project plans, schemas, credentials, or domain rules. It is intended to be copied into another
repository and adapted there.

## Start Here

1. Read [AGENTS.md](AGENTS.md).
2. Read [PROCESS.md](PROCESS.md) to understand how the roles work together.
3. Read the role file for the active task in [agents](agents).
4. Load the matching workflow from [skills](skills).
5. Read the target repository's own architecture, product, and task documents before acting.

## Relationship Map

| Need | Primary owner | Supporting skill |
|---|---|---|
| System boundary, duplication, cleanup priorities | Architect | `architecture-audit` |
| Task definition and one-role routing | Product | `prompt-handoff` |
| UX, interaction, visual hierarchy | Designer | `frontend-design-system` |
| Shared tokens, primitives, visual catalog | Design System | `frontend-design-system` |
| Client UI and interaction implementation | Frontend | `frontend-design-system` |
| API, persistence, integration, server rules | Backend | `backend-contract` |
| Bounded cross-client/server delivery | Fullstack | `backend-contract` and `frontend-design-system` |
| Browser and end-to-end proof | QA | `qa-browser-regression` |
| Backlog intake and triage | Backlog Manager | `backlog-intake` |
| Plans, checkpoints, and closeout | Architect or Product | `plan-writing-closeout` |
| Domain quality, safety, and doctrine | Domain Expert | `domain-doctrine-audit` |
| User-facing language | Copy | shared policy and active task |
| Data integrity and quality rules | Data Quality | `architecture-audit` when ownership is unclear |
| Responsive geometry and reachability | Layout | `frontend-design-system` and `qa-browser-regression` |
| Read-only technical diagnosis | System Advisor | `architecture-audit` |

## Core Model

`input -> validation -> normalization -> canonical truth -> review/confirm when risky -> UI/readback`

One role owns each task. Product routes work; execution roles implement and validate their own
bounded slice. QA independently verifies broader acceptance when the project requires it.

## What To Adapt In A New Repository

- repository paths and commands;
- architecture and product source-of-truth documents;
- runtime, deployment, privacy, and test-data boundaries;
- available browser, database, and subagent tools;
- domain-expert role and domain-doctrine skill, if the project needs one.

Do not copy project-specific plans, data models, integrations, screenshots, credentials, or customer
copy into this kit.
