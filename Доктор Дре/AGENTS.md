# General Agent Operating Rules

This is a project-neutral operating policy. The target repository's own architecture, product
requirements, safety rules, and tool limits take precedence when they are more specific.

## Root-Cause Rule

Before proposing or executing non-trivial work, answer:

`Are we fixing the root cause or only the visible symptom?`

Name the symptom, likely underlying cause, canonical owner, and existing seam to reuse. Do not call a
symptom patch complete when the source-of-truth failure remains elsewhere.

## Roles And Authority

- `PRODUCT` defines work, explains status, and routes one next owner. It does not implement another
  role's code or QA.
- Execution roles inspect, implement, validate, and fix-forward within their assigned boundary.
- `QA` verifies; it does not implement product fixes.
- `ARCHITECT` owns system boundaries and plans; it does not silently become the implementation owner.
- If a task name and its `ROLE:` header disagree, stop and report the mismatch.

Each role reads its matching file under `agents/` and its matching workflow under `skills/` before
substantial work.

## Canonical Architecture

Prefer one explicit pipeline:

`input -> validation -> normalization -> canonical persisted truth -> deterministic product truth -> optional AI or automation -> review/confirm for risky mutation -> UI/readback`

- Server or service layers own validation, authorization, persistence, lifecycle, and mutation safety.
- Clients own interaction and presentation. They do not invent final business, entitlement, or
  persistence rules.
- AI and automation may draft or explain from bounded truth; they do not silently mutate canonical
  truth.
- Profile/default settings must not silently rewrite already-confirmed records.
- Reuse canonical entities, contracts, and primitives before creating a parallel path.

## Simplification Rules

- Prefer deletion over abstraction.
- Prefer one path over compatibility branches.
- Prefer fewer states over configurable state machines.
- Add a layer only when it removes a larger source of complexity.
- Before adding code, search for the existing owner.
- After adding code, remove proven-obsolete paths or report the exact reason they remain.
- Do not grow a large mixed-responsibility file without a real ownership reason.

## Definition Of Done And QA

For implementation, debugging, or behavior-changing work, define:

1. observable outcome;
2. preserved boundaries;
3. risk-based required checks; and
4. the condition that keeps the task open.

Derive a compact test inventory from that definition. For bug fixes, include evidence that
distinguishes the traced root cause from the visible symptom when safe to obtain.

The final report includes:

| Check | Scenario / environment | Result | Evidence |
|---|---|---|---|

Every required check must pass before reporting `Implementation DoD: Passed`. List skipped checks with
their reason and coverage consequence. Broader release or cross-flow QA is a separate explicit gate;
do not call a bounded owner check full release acceptance.

Pure questions, routing, and documentation-only work do not need test theatre. Use only the source
checks needed to establish truth.

## Reuse And UX Discipline

- Inspect existing components, tokens, styles, server actions, validators, and workflows before
  adding new ones.
- UI work reuses the existing design system first. Backend work reuses existing service and
  persistence seams first.
- Do not add client-side persistence, business rules, or fake capabilities for presentation
  convenience.
- Keep responsive behavior, keyboard use, focus, errors, loading, empty states, and accessibility in
  the acceptance scope when a UI behavior changes.

## Subagents

Use a small number of bounded subagents for independent evidence, not for ceremony. The primary owner
integrates their findings and remains responsible for the final result. Do not make the user relay
routine implementation-to-QA loops.

## Product Handoffs

For non-trivial routing, Product writes one exact next-role prompt. It states the task, stage, root
cause, required outcome, constraints, Definition of Done, validation boundary, and stop conditions.
The receiving role chooses the technical implementation.

## Reporting

For implementation reports, state: task, stage, root cause, changed owners, reused seams,
validation inventory, evidence, remaining risks, and verdict. For routing reports, explain in plain
language what is now real, what is not, and why the next owner is correct.

Never conceal unrelated dirty worktree changes, skipped tests, unsafe mutations, or uncertainty.
