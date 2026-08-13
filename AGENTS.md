# Hito Agent Operating Rules

This is the one operational policy for the Hito checkout.

Precedence is: direct user instruction, this file, the active role file, then a matching project
skill. Role files define ownership; skills define reusable procedures. They must not restate or
override this policy.

Active Hito instructions live only in:

- AGENTS.md
- agents/
- skills/

Template Agents/ and Template Skills/ are dormant bootstrap material. Do not load or modify them
for Hito execution unless the task explicitly concerns those templates.

## 1. Core Rules That Always Apply

- Work from the canonical owner and existing seam; do not patch a downstream symptom as a complete
  fix.
- For a reported defect, establish an external artifact that proves the cause, or state the exact
  discriminator still required. A hypothesis is never reported as a confirmed cause.
- Preserve unrelated dirty work byte-for-byte. Do not stage, commit, push, deploy, alter hosted
  data, call paid providers, or delete material data unless the user explicitly authorizes that
  exact action.
- One active execution role owns a task. Do not silently implement another role's work.
- Reuse existing code, validation, data, and Design System owners before adding helpers, files,
  workflows, storage, abstractions, or compatibility paths.
- Report what was verified and what was not verified. Never manufacture evidence, a passing state,
  or release readiness.

Routine local source inspection, local edits, loopback runtime control, disposable local fixtures,
local validation, and safe read-only subagent work are standing-authorized. This includes choosing
and using any supported local browser or browser-control surface. Do not ask the user to approve a
browser, choose a browser, approve loopback browser QA, or relay a local command. Exhaust safe
local alternatives before reporting an environment limitation.

If a raw browser bridge, WebDriver command, `curl`, or another tool would trigger a platform
permission dialog, do not surface that dialog as a user decision. Abandon that invocation and use a
different supported local browser/control surface. A platform-enforced dialog is a tool-path
limitation, not a task blocker or approval gate. Hosted/production mutation, paid-provider calls,
staging, commits, pushes, deployments, and material deletion retain their explicit boundaries.

## 2. Task Mode: Lite Or Tracked

Classify work before the first write. This is a risk classifier, not a second task system.

### Lite

Lite work has one known owner and one known seam or accepted product/design/copy decision. It is
bounded to one surface or contract and has a focused local proof.

Lite work must not touch or depend on:

- schema, migrations, RLS, authentication, entitlement, persistence, import/export, provider
  lifecycle, secrets, paid or hosted services;
- a release, deployment, rollback, destructive operation, or cross-owner contract; or
- an unproven root cause, a broad user-flow regression, or a second implementation owner.

Before a Lite write, record briefly: outcome, evidence or accepted decision, owner/boundary, focused
proof, and the condition that promotes the work. A retained backlog item does not itself promote
Lite work to Tracked. A formal plan, subagent, browser matrix, long report, technical-log entry,
and Global QA are not required by default.

Create a Lite backlog item only when the user asks to retain it, it is deferred, it will survive the
current turn, or it needs a later handoff. A Lite result must not claim Global QA Acceptance or
release readiness.

### Tracked

Tracked is the default when any Lite condition is not clearly true. It covers unknown causes,
multi-surface or cross-owner work, stateful data, auth/security, migration/persistence/provider
work, release/rollback work, and explicitly assigned Global QA.

Tracked work requires:

1. one canonical item in docs/tasks/backlog/ before dispatch or active execution;
2. an execution preflight before the first task-owned write or fixture mutation;
3. evidence/replay appropriate to the changed contract;
4. a risk-derived validation inventory and truthful closure receipt; and
5. a compact lifecycle update in the same canonical item.

Create a supporting plan only when the work is multi-step, risky, cross-surface, or needs durable
detail beyond the canonical backlog item.

### Promotion

The owner immediately promotes Lite to Tracked when investigation finds an unknown cause, another
owner or surface, persisted state, auth/security, external action, release risk, or a failed focused
proof. Do not demote after behavior-changing work begins.

Patch Pack is an optional Lite UI batch profile, not a third process: it may group one owner, one
Frontend lane, one surface, and one proof story inside an existing item.

## 3. Root Cause, Reuse, And Scope

For a reported defect, name:

- the visible symptom;
- the demonstrated cause, or the exact source/log/DOM/query/fixture discriminator still needed;
- the first incorrect canonical owner; and
- the existing seam to inspect before adding anything.

For copy, documentation, and accepted design decisions, name the decision or source evidence instead
of inventing a defect replay.

Fix the first incorrect owner when it is inside the task. If it is outside the task, report the
boundary and route the owner; do not hide it with a local workaround.

Before adding code or documentation, search for an existing canonical owner. Remove a superseded
path when safe, or state exactly why it remains. Do not create a framework, queue, tracker,
knowledge system, duplicate model, local truth path, or new Design System recipe merely to finish
one task.

### Reuse-First Change Budget

The default implementation is a focused edit to an existing canonical seam. Adding a production
file, helper, migration, validator, fixture path, storage record, state layer, compatibility path,
or abstraction is an exception — never the default way to make a task feel complete.

Before the first implementation write, every execution owner must state in its preflight or Lite
receipt:

- the existing seam it will reuse and the smallest behavior change there;
- every proposed new runtime artifact, or explicitly `none`;
- why an existing artifact cannot own it, when one is proposed; and
- what obsolete code, branch, artifact, or responsibility will be removed or simplified, or why it
  must temporarily remain.

Do not add generic helpers, broad validators, new fixtures, mappings, layers, wrappers, migrations,
or compatibility machinery merely to protect a small edit. First make the smallest source-backed
change and add only the proof directly required for its contract. A new persistence shape or
migration needs a demonstrated invariant that the existing shape cannot represent; a new file needs
a distinct responsibility that an existing owner cannot carry. If investigation grows a task beyond
its stated seam, stop expanding it, report the growth, and reduce the task or route the real
cross-owner decision.

For a small defect, preference, or localized contract change, a large diff is a warning signal, not
evidence of thoroughness. The owner must explain any material growth in production code, validation
surface, or task artifacts, and must not claim simplification while leaving the old path active
without a factual reason.

Large-file review is required only when a change adds a new responsibility. Around 700 lines,
justify the owner or extract a real seam; around 1000 lines, require an architecture reason; around
1500 lines, treat the file as a decomposition candidate unless it is generated, fixture-only, or
intentionally consolidated documentation.

## 4. Role Activation And Boundaries

A task with a matching first line of ROLE: <ROLE> is an execution assignment for that role.
The assigned role reads this file, its role file, the matching skill, and the named task context.
If task identity and ROLE disagree, stop and report the mismatch.

PRODUCT is the sole orchestration role. Product defines work, selects/dispatches the next owner, and
writes handoffs; it does not implement another role's code or QA. Other roles may prepare a bounded
handoff recommendation, but only Product selects, queues, or dispatches an execution owner.

Product dispatches implementation, design, Backend, and QA work only to an existing named sidebar
role whose canonical role file is present in `agents/`. It does not spawn custom implementation or
review subagents, write runtime code, run implementation validation, or substitute itself for the
selected owner. Product's work is limited to canonical task artifacts, decisions, status, and
handoffs. If a primary execution owner needs assistance, that owner may use only an existing named
Hito role from `agents/` for a bounded subtask; invented role names and generic task-specific
subagents are prohibited.

The assigned execution owner implements the production-source work inside its own canonical domain.
It must not delegate a same-role or same-lane implementation slice merely to divide files, speed up
writing, or avoid ownership. For example, FRONTEND implements its own DevTools, Product, or
Marketing diff; DESIGN SYSTEM implements its own primitives, tokens, canonical CSS, validators, and
`/hitoDS` diff. A cross-owner production change is a separate Product handoff, not an implementation
subagent. A task/thread title is not a role: an owner is valid only when it maps to one canonical
role file in `agents/`.

QA validates; it does not implement product fixes. BACKEND owns server truth, persistence,
normalization, auth, mutations, and provider ingestion. FRONTEND renders backend-shaped truth and
owns route/component interaction. DESIGN SYSTEM owns shared primitives, tokens, canonical DS CSS,
validators, and /hitoDS. DESIGN SYSTEM INTEGRATION owns approved Figma-file work only; repository
runtime source is read-only for that role.

RUNNING COACH is a nontechnical specialist review role. It may assess training quality and prepare
coaching criteria or artifacts; PRODUCT remains the only role that dispatches implementation work.

### Frontend Lanes

Every FRONTEND task names exactly one lane:

- DevTools — loopback-only Local Inspector and local design-suite code under src/components/devtools/.
- Product — authenticated runner routes, plans, calendar, workouts, settings, and active-plan work.
- Marketing — public entry, landing, and marketing assets/copy.

Shared primitives and canonical DS CSS belong to DESIGN SYSTEM, not a Frontend lane. A mixed-lane
task is split before implementation.

### Design System Integration

DESIGN SYSTEM INTEGRATION may mutate only an explicitly approved Figma target. It may update the
task-owned backlog lifecycle and compact mapping evidence, but it must not edit Hito runtime source,
generated manifests, validators, migrations, scripts, or product code. Figma remains downstream of
implemented Hito source; a code/Figma conflict returns to DESIGN SYSTEM or Product.

## 5. Product Routing And Dispatch

Before Product contacts another role, inspect that role's current state. Never interrupt an active
role without the user's explicit command to stop or supersede that exact task.

Writing a prompt and dispatching it are separate for a new or changed task. In that case, Product
first reports, in Russian: the task, what was completed, the current state, and the proposed next
action and receiving sidebar role. It then provides one exact English prompt or asks one concrete
question about whether or where to send it, and waits for Ivan's explicit confirmation.

This confirmation rule applies even when an approved canonical item has an otherwise unambiguous
next owner. Product may dispatch without that interim confirmation only when Ivan explicitly says
in the current instruction to send, dispatch, start, or run the work immediately. Product says in
Russian what it sent and why; it does not make Ivan relay routine owner-to-owner work. Stop and ask
one concrete Product question before dispatch when the plan does not cover the new scope, a material
product choice remains, or the next owner/boundary is not demonstrated.

For a Tracked handoff, Product's user-facing shell contains:

1. Plan file
2. Task
3. Stage
4. What we did
5. Where we are
6. What we do next
7. One exact prompt only when a handoff is needed
8. Blockers

For Product Lite work, use a concise Russian status and one bounded action. Do not create a formal
handoff shell unless another role must actually receive the task.

Handoffs describe outcome, evidence, owner, preserved boundaries, non-goals, and proof. The receiving
role chooses implementation details. An autonomous same-owner prompt may include its own focused
validation and safe independent review; do not turn ordinary implementation-to-QA loops into user
copy-paste.

## 6. Skills

Load only the project skill that directly matches the current task. A simple status, explanation, or
instruction-only Lite edit normally needs no skill beyond this file and the active role file.

| Work                                              | Matching skill                                 |
| ------------------------------------------------- | ---------------------------------------------- |
| architecture, cleanup, source-of-truth audit      | skills/hito-architecture-audit/SKILL.md        |
| backend, Supabase, auth, integration, persistence | skills/hito-backend-supabase-contract/SKILL.md |
| UI, DS, layout, Figma bridge planning             | skills/hito-frontend-design-system/SKILL.md    |
| browser or visual QA                              | skills/hito-qa-browser-regression/SKILL.md     |
| backlog capture                                   | skills/hito-backlog-intake/SKILL.md            |
| active-plan lifecycle or closeout                 | skills/hito-plan-writing-and-closeout/SKILL.md |
| Product handoff                                   | skills/hito-prompt-handoff/SKILL.md            |
| training-quality review                           | skills/hito-running-coach-audit/SKILL.md       |

Use more than one only when the task genuinely crosses those procedures. Each final report names
the role file, skills used or none, task artifact or none, and any subagent used or not used.

## 7. Subagents

Subagents are optional evidence aids, never a ceremony requirement.

- Lite work uses one only when independent evidence materially increases confidence or saves real
  rediscovery. A focused self-check is sufficient otherwise.
- Tracked work uses subagents when independent, bounded work can reduce risk or elapsed time.
- The primary owner remains accountable for the result and integrates every finding.
- A subagent must be an existing named Hito role from `agents/`, not a generic job title such as
  `review`, `audit`, `reachability`, or a copy of the primary implementation role. A purpose label
  may supplement the role but may not replace it.
- Before any subtask action, its prompt must name `ROLE: <canonical role>`, state whether the work
  is read-only or has a disjoint write boundary, and require the subagent to read `AGENTS.md`, that
  role's file, and only the directly matching project skill. If the prompt and role disagree, the
  subagent stops and reports the mismatch.
- An implementation owner keeps all production-source edits in its own domain. It may ask a
  different role for a bounded read-only discriminator or review — for example QA for browser proof,
  DESIGNER for a visual decision, BACKEND for a persistence-contract fact, or ARCHITECT for a
  source-ownership map. That reviewer does not implement the primary owner's code.
- A same-discipline reviewer is exceptional and must be read-only, independent, and explicitly
  justified by a material evidence gap. It must never become a second writer for the task.
- A required cross-owner implementation is not a subtask. The owner records the exact boundary and
  returns it to PRODUCT for a separate canonical handoff to the owning sidebar role.
- Every subtask prompt names the narrow question/outcome, permitted files or evidence, non-goals,
  return condition, and preservation boundary. It must not contain open-ended instructions such as
  “finish the feature” or “fix the UI”.
- Use at most six active subagents per bounded workstream. They do not spawn more agents.
- Give each a named purpose and a read-only or disjoint-write boundary. Do not delegate secrets,
  hosted/production mutation, destructive actions, fragile shared sessions, or overlapping edits.
- Close or reuse a completed subagent; do not create one per file, command, viewport, or minor
  question.

Global QA and cross-owner/release acceptance remain independent QA work. A same-owner implementation
may obtain an independent QA or specialist review internally when it is genuinely needed.

## 8. Validation And Acceptance

Lite validation is proportional: run the smallest focused check or inspect the source/decision that
proves the changed outcome. State any omitted proof only when it matters to the claim.

Tracked work defines:

- observable outcome and preserved boundaries;
- root-cause discriminator for a defect when safely obtainable;
- risk-derived checks, including browser, persistence, auth, or build proof only when affected; and
- the exact condition that keeps the task open.

Use a compact Check | Scenario / environment | Result | Evidence table for Tracked implementation or
QA results. Report required checks not run and their coverage consequence.

Implementation DoD proves the assigned slice. Global QA Acceptance is a separate gate and may be
claimed only for an explicitly assigned cross-flow or release acceptance inventory. No local or
hosted/release claim may be inferred from the other.

For browser/visual QA, the owner may choose any supported local browser or browser-control surface
(including the built-in browser, Safari, Chrome, and a non-prompting WebDriver path) without user
approval. Prefer an existing usable session and the least disruptive path that can prove the
contract; do not wait for a preferred browser when another supported local path works. Never ask the
user to choose or approve a browser or loopback command. If a platform dialog appears, abandon that
tool path and continue with another supported local path. Browser Path Preflight is required only
for browser QA, not source-only or backend-only validation.

## 9. Backlog, Plans, And History

docs/tasks/backlog/ is the operational queue for retained work in either mode. A Lite item records
only the durable decision needed to resume it; a Tracked item records Work Item ID, Status, Type,
Priority, Owner, Scope, Archive Intent, Task, and, when ready or in progress, Stage, Next Recommended
Role, and one exact handoff prompt. Retention never by itself changes the task mode.

Status values are backlog, ready, in_progress, blocked, completed, closed, and archived. The active
owner keeps the item truthful before final reporting. Supporting specs and plans never create a
second active task.

Use docs/plans/active/ only for multi-step or cross-surface detail. Use technical-log entries for
accepted user-impacting, QA-acceptance, source-cleanup, local-tooling, or durable-process outcomes;
routine Lite receipts do not need a history entry. Update the public changelog only for shipped
user-facing highlights.

## 10. Reporting

Language is role-specific:

- PRODUCT speaks directly with Ivan in Russian: status, explanation, blockers, and the Product
  routing shell are Russian by default. Its exact execution prompt remains English.
- Execution roles use Russian for their in-progress commentary and explanations when those messages
  are visible to Ivan. Their final formal report, receipt, validation inventory/table, and canonical
  backlog/plan update are in English, so the durable project record is readable by collaborators.
  Use another language only when Ivan explicitly requests it for that assignment.
- Canonical repository artifacts remain English unless a task explicitly requires product copy in
  another language.

The forms below are the canonical execution feedback format. Role files may add their domain facts
but must not replace or translate this format.

Lite final receipt:

- task and mode;
- outcome and evidence/decision;
- files changed;
- focused proof;
- promotion or remaining boundary.

Tracked implementation receipt:

- task, stage, preflight, product outcome, root cause, files inspected/changed, preserved
  boundaries, validation inventory, omitted-check consequences, next owner, blockers.

Tracked QA receipt:

- task, stage, validation layer, browser preflight only if browser work occurred, inventory,
  issues, coverage gaps, and Verdict: Passed or Verdict: Failed.

Do not append a long continuity footer unless the task is blocked, large enough that the standard
receipt loses essential context, or the user asks for it.
