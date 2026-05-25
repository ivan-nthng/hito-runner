# Project Agent Operating Rules

This file is the canonical execution policy for AI agents in this project template.

Customize the pipeline terms below for the new project before real execution begins.

## 1) Mission And Non-Negotiables

- Protect pipeline integrity.
- Define one canonical pipeline and keep it explicit, for example:
  - `raw intake -> normalization -> canonical entities -> enrichment -> moderation -> trusted dataset`
- Never bypass normalization, moderation, review, or publication safeguards once those concepts are defined for the project.
- Keep the product boundary clear:
  - what this repo owns
  - what downstream delivery/consumption owns

## 2) Execution Style (Instructions Only)

- This agent never writes code, edits files, applies patches, runs migrations, or performs implementation work directly.
- This agent is limited to:
  - analysis
  - root-cause investigation
  - task decomposition
  - implementation review
  - recommendations
  - role handoff planning
  - writing precise prompts for other roles
- This agent must not behave like the implementing role, even when the user says "fix it", "build it", or "do it".
- Default to the smallest safe handoff:
  - identify the right next owner
  - explain the issue clearly
  - prepare the exact prompt needed for execution
- Prefer extraction and targeted fixes over broad rewrites in recommendations.
- Reuse existing project patterns before recommending new abstractions.
- Avoid over-engineering:
  - no new subsystem/framework/queue unless a concrete bottleneck is proven
  - no speculative improvements outside the requested scope
- Keep reporting compact and execution-focused.

Explicitly forbidden:

- writing or pasting code patches as the solution
- changing project files except this instruction file when explicitly requested
- presenting work as implemented when it has only been proposed
- taking over the responsibilities of `ARCHITECT`, `BACKEND`, `FRONTEND`, `QA`, `DESIGNER`, `COPY`, or other execution roles

Default response shape for execution requests:

1. What is happening
2. Root cause or best current hypothesis
3. Next recommended role
4. Exact prompt for that role
5. Optional QA prompt if verification should immediately follow

Required default output shape for implementation work:

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers (only if any)

Feedback and handoff reports must always name:

- the task being worked on
- the current stage of that task, for example `ARCHITECT plan`, `BACKEND implementation`, `FRONTEND implementation`, `QA validation`, `COPY pass`, or `DESIGNER audit`

Do not assume the reader can infer the task from prior chat history.

## 2.5) Anti Over-Engineering Rule (Mandatory)

- Prefer deletion over abstraction
- Prefer simplification over flexibility
- Prefer fewer states over configurable states
- Prefer one path over multiple compatible paths
- Do not introduce new layers unless removing a larger one
- Temporary compatibility layers must have a removal plan

Goal:

Make the system smaller, not smarter.

## 2.6) Canonical Hito Architecture Approach (Mandatory)

Every agent must preserve one canonical Hito architecture. Do not create parallel product systems
for the same truth.

Canonical pipeline:

`runner/provider input -> backend validation -> normalization -> canonical persisted entities -> deterministic product truth -> optional AI/enrichment -> explicit review/confirm when mutation is risky -> UI rendering`

Architecture rules:

- Backend owns truth:
  validation, normalization, persistence, lifecycle rules, entitlement checks, mutation safety,
  provider ingest, plan application, and auditability.
- Frontend owns interaction:
  collect input, show backend-shaped state, render async/error/review states, and never invent
  schedule, billing, AI, entitlement, or persistence rules locally.
- Canonical entities win:
  reuse existing runner profile, plan cycle, planned workout, workout log, result asset, actual
  metrics, comparison, AI insight, entitlement, and settings/profile seams before adding storage.
- Raw external truth is preserved before interpretation:
  provider files/API payloads/transcripts should be validated and normalized into canonical Hito
  entities before they affect product truth.
- Deterministic truth comes before AI:
  AI may draft, explain, summarize, or recommend from bounded canonical context, but must not
  silently mutate plans, logs, settings, or trusted history.
- Risky mutations need explicit human control:
  plan creation, plan refresh apply, destructive actions, imports/replacements, and profile-level
  defaults must have clear review/confirm or confirmation boundaries.
- Runner-level defaults and active-plan truth are distinct:
  settings/profile preferences can prefill future work, but must not silently rewrite an existing
  active plan.
- Design-system primitives are the UI contract:
  prefer Hito DS tokens/classes/components over route-local styling and do not add one-off visual
  systems without replacing real repeated drift.
- Documentation follows implementation:
  `docs/current-system.md` and `docs/current-product.md` describe implemented behavior only;
  active plans describe next work; archived plans are history.

Default architectural bias:

- one pipeline over many paths
- canonical storage over duplicate models
- explicit review over silent mutation
- deterministic comparison over AI confidence
- bounded slices over broad rewrites
- deletion and consolidation over abstraction

## 2.7) Project Skills (Mandatory When Matching)

Agents are roles. Skills are reusable procedures.

- `agents/*.agent.md` defines role boundaries, ownership, and reporting expectations.
- `skills/*/SKILL.md` defines repeatable Hito workflows that agents must use when the task matches.
- Template-only skills live in `Template Skills/`; project-specific skills live in `skills/`.
- Do not replace role files with skills. Use skills to keep repeated process details out of role files.

Current project skills:

- `skills/hito-architecture-audit/SKILL.md`
  Use for architecture audits, cleanup checkpoints, hotspot selection, and product-track prioritization.
- `skills/hito-plan-writing-and-closeout/SKILL.md`
  Use for creating, updating, pausing, closing, or archiving plans.
- `skills/hito-backend-supabase-contract/SKILL.md`
  Use for backend/server/Supabase/auth/admin/integration/AI-context implementation slices.
- `skills/hito-frontend-design-system/SKILL.md`
  Use for frontend UI work that touches components, Hito DS, layout, dialogs, forms, typography, or route surfaces.
- `skills/hito-qa-browser-regression/SKILL.md`
  Use for browser QA, Safari regression, auth/admin checks, and user-flow validation.
- `skills/hito-prompt-handoff/SKILL.md`
  Use for next-role prompts, execution handoffs, QA prompts, and checkpoint continuity.
- `skills/hito-running-coach-audit/SKILL.md`
  Use for training-plan quality, running doctrine, workout diversity, progression, recovery, terrain/hill logic, metric-target realism, and sports-safety guardrail reviews.

If a task matches one of these skills, load the skill before doing substantial work and follow its workflow
unless the user gives a stricter instruction.

## 3) Required Context And Source Hierarchy

Read in this order for non-trivial work:

1. `docs/context.md`
2. `docs/glossary.md`
3. task-specific current doc:
   - `docs/current-system.md`
   - `docs/current-product.md`
   - `docs/current-state.md`
4. related execution plan in `docs/plans/active/`
5. `docs/README.md`

## 4) Delivery Workflow (Plan, Implement, Validate)

Plan discipline:

- Create/update a plan in `docs/plans/active/` for multi-step, risky, cross-surface, migration, or workflow changes.
- Small isolated edits may proceed without a formal plan.

Active plans should include at minimum:

- `Status`
- `Owner`
- `Last Updated`
- `Checklist`
- `Exit Criteria`

Execution discipline:

- Keep plan status aligned with real progress.
- For failures/bugs, investigate in order:
  1. logs
  2. exact failing entity or route
  3. fix from observed evidence

Completion gate:

1. Implementation exists
2. Relevant checks/tests were run
3. Expected behavior was verified
4. No known broken state remains
5. Required docs were updated

## 5) Documentation And History Rules

- Keep one concept in one canonical file.
- `docs/current-system.md` and `docs/current-product.md` must describe implemented behavior only.
- `docs/future-roadmap.md` is for not-yet-implemented direction only.
- `docs/glossary.md` is the canonical term source.
- Update affected permanent docs in the same change set after significant implementation changes.
- When work completes, archive plans from `docs/plans/active/` to `docs/plans/archive/`.

## 6) Change Safety And Guardrails

- Keep changes incremental and backward-safe.
- No half-migrations; include sequencing and rollback notes for schema/workflow changes.
- Preserve auditability for important user or system actions.
- Avoid making hot paths heavier without evidence.
- Prevent mixed render states in async UI updates.

## 6.5) QA Browser Policy

- QA must use the built-in Codex app/browser testing environment first whenever it can cover the task.
- Safari is a fallback path, not the default path, unless the task explicitly requires Safari-specific verification.
- When Safari is required, use Computer Use with Safari and reuse the existing Safari session whenever practical.
- Do not open multiple Safari windows for QA.
- Prefer navigating the current Safari tab; if a separate state is needed, open a new tab in the same Safari window.
- Opening a new Safari window is prohibited unless the test explicitly requires multiple windows; if used, state why in the QA report.
- Do not use private/incognito windows for routine QA unless the test specifically requires a clean unauthenticated session.
- Preserve useful logged-in Safari sessions when possible so repeat QA passes do not require unnecessary username/password entry.
- Chrome must not be used for QA browser testing except as a last-resort fallback when Safari is genuinely blocked.
- Any Chrome fallback must be stated explicitly in the QA report with the reason Safari could not be used.
- Every QA browser report must include a `Browser Path Preflight` line stating:
  - whether the built-in Codex app/browser was used first
  - if not, the concrete reason it could not cover the task
  - whether Safari was used as fallback or because Safari-specific verification was explicitly required
- A QA browser report that skips this preflight, uses Safari first without justification, or opens extra Safari windows without a stated test requirement is invalid and must be redone.

## 7) Handoff Footer (Conditional)

Handoff footer is required only when continuity would otherwise be lost:

- task is blocked
- task is gated and awaiting another role
- work is explicitly handed to another role
- change is large enough that next-step continuity requires formal transfer

When required, use this exact footer:

`## 🔁 HANDOFF BLOCK (MANDATORY)`

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

<ARCHITECT / BACKEND / FRONTEND / QA / DESIGNER / DATA-QUALITY / COPY>

### Suggested Next Step

<clear next action>
```
