# Hito Canonical Work Loop, Autonomy Envelope, And Release Freeze Policy

## Work Item ID

2026-08-12-hito-canonical-work-loop-autonomy-and-release-freeze-policy

## Status

completed

## Type

architecture-policy

## Priority

high

## Owner

product

## Mode

Tracked

## Stage

Adopted after one ordinary Tracked pilot and two fail-closed release pilots. The next release must
still exercise the mandatory staged-candidate identity and `git diff --cached --check` gates.

## Scope

Define the smallest standard Hito work loop that can support longer autonomous execution while
preserving one canonical backlog owner, demonstrated root-cause discipline, safe cross-role
boundaries, release-candidate immutability, and Ivan's control over new or changed dispatches.

This item is the sole retained record for the decision and adoption pilot. It uses the existing
Markdown backlog as the only work graph and lifecycle store. It authorizes only the bounded
operating-policy Markdown implementation recorded below; it does not authorize a runtime change,
release action, new tracker, service, dashboard, state model, validator, or parallel documentation
hierarchy.

## Archive Intent

retain_in_place

## Recommendation Status

`adopted_2026-08-14`

Ivan approved the complete policy slice after the release chain reached a successful terminal
state. ARCHITECT implemented it in `AGENTS.md` and aligned the one contradictory handoff-skill
sentence. `AGENTS.md` is the active authority. PRODUCT accepted the ordinary Tracked and
fail-closed release pilots on 2026-08-14, with the bounded staged-success waiver recorded below.

## Product Decision — 2026-08-12

Ivan approved full adoption of the proposed canonical work loop, backlog relationship vocabulary,
autonomy envelope, and repository-wide release-candidate freeze rule. The policy implementation
must preserve the established Product communication order: when a handoff is needed, PRODUCT first
explains the task, plan, completed work, current state, next action, and blocker in Russian; it
then provides one exact English prompt and waits for Ivan's explicit confirmation unless he directly
orders immediate dispatch. No new tracker, runtime mechanism, role, service, dashboard, or
parallel documentation system is authorized.

## Product Dispatch — 2026-08-12

```text
ROLE: ARCHITECT

Mode: Tracked
Stage: approved canonical work-loop and release-freeze policy implementation

Execute this canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-canonical-work-loop-autonomy-and-release-freeze-policy.md`

Ivan explicitly approved full adoption after the successful terminal release. Read `AGENTS.md`,
`agents/architect.agent.md`, `skills/hito-architecture-audit/SKILL.md`,
`skills/hito-plan-writing-and-closeout/SKILL.md`, the complete canonical item, and the current
`skills/hito-backlog-intake/SKILL.md` and `skills/hito-prompt-handoff/SKILL.md` before writing.

Implement the approved policy in the smallest canonical seams:

1. Amend `AGENTS.md` with one compact, non-duplicative section that makes explicit:
   - the canonical work loop from intake/classification through discriminator, one-owner dispatch,
     same-owner autonomous execution, proportional validation, return/closure, independent QA, and
     release;
   - the four optional Markdown-only backlog relationship fields: Parent, Depends On, Evidence From,
     Supersedes, including their one-direction/no-duplicate-authority rules;
   - the autonomy envelope and return-to-Product/Ivan conditions;
   - repository-wide candidate freeze admission, sole-writer interval, invalidation, failure
     recovery, and terminal end rule;
   - staged candidate diff hygiene before expensive release work where this is compatible with the
     existing release procedure.

2. Preserve and make no weaker the established Product communication contract. It must remain clear
   that Product tells Ivan in Russian: task/plan, what is complete, where work is now, next action,
   and blockers; for a new or materially changed handoff Product provides one exact English prompt
   and waits for Ivan's explicit confirmation, except when Ivan directly says to send/start/run it.
   Product remains the sole dispatcher.

3. Inspect the two named skills. Amend either only if a concrete contradictory sentence prevents the
   approved AGENTS policy. Do not copy the policy into skills, create a plan/tracker/dashboard,
   introduce runtime code, validations, state, new role, generated index, or documentation
   hierarchy.

4. Update this one canonical item with a truthful English Tracked implementation receipt and current
   lifecycle. Future ordinary Tracked work and the next release are the required pilots; do not
   invent synthetic work just to call the policy validated.

Preserve all runtime source, styles, tokens, scripts, fixtures, generated files, Git lifecycle,
hosted state, and unrelated dirty work. New runtime artifacts, helpers, validators, services,
dashboards, trackers, schemas, compatibility paths, and agent roles: none. You own these
architecture/policy Markdown seams yourself; do not delegate same-discipline writing. A bounded
read-only existing-role review is optional only if it exposes a material policy contradiction.

Definition of Done:
- the full approved policy is expressed in canonical operating policy without duplicating existing
  role/skill text;
- Product communication order is explicit and preserved;
- relationship fields remain optional Markdown vocabulary, not a second lifecycle system;
- all release freeze and failure rules are actionable and compatible with current release practice;
- conditional skill changes, if any, are justified by a cited contradiction;
- focused Markdown/format/diff hygiene passes, with any omitted proof stated truthfully.

Stop and return to PRODUCT if implementation requires any file beyond `AGENTS.md` plus one of the
two named skills for a demonstrated contradiction, changes role ownership, adds a mechanism beyond
Markdown policy, or discovers an unresolved Product choice.
```

## Task

Review, approve or reduce, and then introduce a canonical Hito workflow and autonomy envelope that
covers new features, defects, legacy cleanup, refactors, debugging, QA, and release without adding
a second orchestration system. The policy slice must make concurrent work and release freezes
unambiguous, preserve one writer and one canonical item per workstream, and state exactly when an
execution owner may continue autonomously versus return to PRODUCT or Ivan.

## User Report

Ivan asked for the full architecture context to be retained in a separate, highly detailed backlog
task so that it is not lost and other agents can reuse it. The preceding architecture request asked
for a minimal standard workflow that permits longer autonomous work while preserving canonical
ownership, root-cause discipline, candidate-freeze safety, and Ivan's dispatch control.

## Desired Outcome

After approved adoption:

1. Every retained workstream has one canonical backlog item and one active execution owner.
2. An owner can investigate, implement within its own domain, validate, and fix forward without a
   Product round trip for each routine step.
3. Owner, scope, evidence, dependencies, and handoff state are readable from the existing backlog.
4. Cross-owner implementation and material product choices return to PRODUCT rather than being
   hidden inside a subagent or local workaround.
5. A release candidate can be frozen with zero concurrent repository writers and cannot silently
   absorb planning, receipt, cleanup, or implementation changes.
6. Ivan retains explicit control over new or materially changed dispatches and over external or
   destructive actions already reserved by current policy.

## Evidence

### Demonstrated facts

1. [AGENTS.md](../../../AGENTS.md) already defines Lite and Tracked modes, one active execution
   owner, PRODUCT as the sole dispatcher, reuse-first implementation, root-cause evidence,
   role-owned implementation, bounded named-role subagents, and truthful acceptance boundaries.
   The proposal should consolidate and clarify those existing seams rather than replace them.
2. The completed
   [UI simplification source-of-truth audit](2026-08-12-hito-ui-simplification-source-of-truth-audit.md)
   successfully distinguished two demonstrated cleanup candidates from intentional reuse and
   non-findings. It shows that evidence-first ownership analysis can reduce scope instead of
   producing a blanket rewrite.
3. The first
   [current-candidate release attempt](2026-08-12-current-candidate-git-release-and-vercel-verification.md)
   stopped before commit when the Design System validator disagreed with current Brand source. The
   release owner correctly returned the source defect to its canonical owner instead of repairing
   it in the release lane.
4. The
   [release retry](2026-08-12-current-candidate-git-release-and-vercel-verification-retry.md)
   mapped 167 admitted paths across six ownership groups, passed source/build/parity gates, and
   then stopped because `git diff --cached --check` found trailing whitespace in a completed but
   previously untracked Design System receipt. The index was restored and no commit, push, Vercel
   verification, or hosted mutation occurred.
5. That retry proves a concrete release-hygiene gap: pre-stage `git diff --check` cannot inspect an
   untracked receipt, while the staged exact candidate can. A completed task artifact can therefore
   be behaviorally irrelevant yet still invalidate the frozen release candidate.
6. The remediation is owned separately by
   [Design System receipt hygiene](2026-08-12-hito-ds-reference-ui-typography-receipt-hygiene.md).
   Its current lifecycle state must be re-read before any release or policy dispatch; this
   architecture item does not supersede or close it.
7. The current backlog is already the canonical retained work queue. Adding another tracker,
   service, graph database, dashboard, or state model would create duplicate authority rather than
   solve the demonstrated ambiguity.

### Demonstrated workflow ambiguities or failures

1. **Candidate freeze is local to a release prompt, not a repository-wide operating state.** The
   current policy supports routine local edits and task lifecycle writes, but does not define a
   single explicit interval during which all non-release repository writers must stop.
2. **Completed does not necessarily mean release-clean.** The retry showed a completed untracked
   receipt whose whitespace was invisible to the ordinary tracked diff gate until exact staging.
3. **Admission and owner mapping are expensive and manual.** The retry classified 167 paths. It
   succeeded, but the amount of one-off reasoning grows with candidate size and increases the risk
   of an unexplained path being accidentally admitted.
4. **Backlog lifecycle and supporting documents can drift.** The UI audit demonstrated stale
   current-document statements even though the canonical task receipts and runtime source had
   moved on. Supporting summaries must not become a second lifecycle owner.
5. **Autonomy is described in pieces.** Existing policy authorizes routine local work and
   same-owner execution, but the exact boundary between autonomous fix-forward, cross-owner return,
   Product rerouting, and Ivan authorization is not expressed as one compact loop.

### Hypotheses requiring pilot evidence

The following are recommendations to test, not established facts:

1. A repository-wide candidate freeze should eliminate release collisions from concurrent
   planning, documentation, receipt, build, and implementation writes.
2. Four lightweight relationship fields in existing backlog Markdown should provide enough graph
   context without a new tracker.
3. A clearer autonomy envelope should reduce unnecessary PRODUCT round trips while preserving
   escalation quality.
4. A smaller admitted release inventory should make owner mapping faster and less error-prone.

The adoption pilot must measure these hypotheses. They must not be reported as improvements merely
because the policy text was written.

## Observed Behavior

- Work types use the same policy primitives but do not yet share one explicit end-to-end loop.
- Correct source ownership stops are working: BACKEND did not fix a Design System source or receipt
  defect inside a release task.
- Release safety depends on prompt-specific candidate snapshots and exact staging rather than a
  common freeze rule that every role can recognize.
- Large candidates require manual path-to-owner classification even when every included task is
  completed.
- Planning and task documentation remain repository writes and can change candidate content unless
  explicitly frozen with the rest of the checkout.

## Expected Behavior

- One canonical loop applies to all work types, with only the entry discriminator and validation
  inventory changing by risk.
- One canonical item owns lifecycle, graph relationships, evidence, and closure for a retained
  workstream.
- An owner continues routine same-domain work autonomously after dispatch, but cannot expand into a
  second owner, external authorization, or unresolved product decision.
- A frozen release has one repository writer and a recorded exact baseline. Any unexpected movement
  invalidates the freeze; it is never silently absorbed.
- Failure restores a clean index and leaves source unchanged by the release owner. Source repair is
  separately routed to the canonical owner, followed by a fresh release attempt and fresh digests.

## Source Investigation

The architecture review used only current policy and the three evidence families named above:

- the operating contract in `AGENTS.md` and `agents/architect.agent.md`;
- the recent UI source-of-truth audit as evidence for root-cause, ownership, and cleanup
  classification; and
- the blocked release record plus release retry as evidence for candidate admission, staged-only
  hygiene, index restoration, and cross-owner stop behavior.

No runtime source, CSS, generated manifest, validator, build output, provider state, Git index,
commit, branch, or deployment was changed by the architecture discovery. No architecture finding
reopens or rewrites the completed UI audit.

## Likely Root Cause Or Required Discriminator

### First incorrect canonical owner

No product runtime owner is incorrect. The demonstrated process ambiguity belongs to the shared
operating policy seam, which requires PRODUCT approval and an ARCHITECT implementation slice.

### Root cause

Current rules contain the necessary safety concepts but do not compose them into one explicit
repository-wide work loop and candidate-freeze state. Release prompts compensate with detailed
local instructions, causing repeat work and leaving non-release writers without a common freeze
contract.

### Discriminators required before adoption

1. PRODUCT must decide whether a repository-wide release freeze is desirable and whether it pauses
   every repository write, including backlog and receipt updates.
2. The active release chain must reach a terminal state before policy implementation begins, or
   Ivan must explicitly pause/supersede that chain.
3. The pilot must show that the proposed relationship fields and autonomy rules remove ambiguity
   without creating duplicate lifecycle state.

## Approved Canonical Work Loop

This design is implemented compactly in `AGENTS.md`, which remains the authoritative operating
wording. The detail below is decision and pilot context, not a second policy source.

### 1. Capture and classify

PRODUCT records or selects one canonical backlog item when retention is required, then classifies
the work as Lite or Tracked using the existing risk classifier. The item records the outcome,
accepted evidence or missing discriminator, canonical owner, seam, boundaries, proof, and promotion
condition.

### 2. Establish the entry discriminator

Before implementation, the assigned owner establishes the minimum evidence appropriate to the work
type:

| Work type      | Required entry discriminator                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| New feature    | Accepted product/design decision, user outcome, owner, and proof boundary                                           |
| Defect         | Visible symptom plus an external artifact that proves the cause, or the exact missing discriminator                 |
| Debugging      | Reproducible observation, competing hypotheses, and the next source/log/DOM/query/fixture discriminator             |
| Legacy cleanup | Reachability evidence, canonical replacement, consumer inventory, and expected net deletion                         |
| Refactor       | Preserved observable contract, demonstrated ownership problem, and a net-simplification boundary                    |
| QA             | Accepted contract, independent observation surface, risk-derived inventory, and truthful coverage limits            |
| Release        | Exact stable candidate, empty index, complete admission/owner map, remote baseline, and authorized external actions |

No defect cause becomes confirmed from a hypothesis. No cleanup removes a path because it merely
looks old. No refactor begins only because a file is large or aesthetically inconvenient.

### 3. Product dispatch

PRODUCT remains the sole dispatcher. A new or materially changed execution assignment requires
Ivan's explicit current-discussion confirmation unless Ivan directly says to send, start, run, or
dispatch it. The prompt names one canonical Hito role and one owned boundary.

### 4. Same-owner autonomous execution

After valid dispatch, the execution owner may autonomously:

1. inspect the assigned seam and establish the discriminator;
2. choose a bounded implementation sequence inside its canonical domain;
3. make the smallest source-backed change;
4. run proportional local validation;
5. fix forward inside the same owner, seam, risk class, and accepted outcome when validation fails;
6. update the same canonical item with evidence and lifecycle state; and
7. stop when a return condition below is reached.

The owner does not require a new Product dispatch for each routine same-owner iteration.

### 5. Validate

Validation derives from affected risk, not ceremony. Lite work uses the smallest focused proof.
Tracked work records a compact inventory with observable outcome, preserved boundaries, relevant
root-cause replay, results, evidence, and omitted-check consequences. Global QA and release
acceptance remain separate explicitly assigned gates.

### 6. Close or return

The owner updates the same canonical item. It may close only its assigned implementation slice. It
returns to PRODUCT for a cross-owner implementation, material scope or risk change, unresolved
product decision, successor assignment, Global QA, or release. Supporting plans and current-state
documents never become the lifecycle owner.

### 7. Independent acceptance and release

QA independently owns an explicitly assigned acceptance inventory. Release begins only from an
admitted stable candidate and follows the candidate-freeze contract below. A failed release is not
a source-repair lane.

## Compact Backlog Graph Vocabulary

Use only optional Markdown fields in existing backlog items. Do not introduce a graph service,
schema, generated index, validator, dashboard, or parallel state document.

| Field           | Meaning                                                                 | Rule                                                                      |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Parent`        | Larger retained outcome that contains this bounded item                 | Reference one canonical backlog item; omit when absent                    |
| `Depends On`    | Work whose accepted outcome is required before this item can proceed    | Store the forward edge only; read status from the referenced item         |
| `Evidence From` | Completed audit, decision, incident, or QA record used as factual input | Evidence does not transfer lifecycle or acceptance automatically          |
| `Supersedes`    | Earlier retained item whose active responsibility this item replaces    | The earlier item remains historical; record closure there when authorized |

Graph rules:

1. Omit empty fields. Do not write `none` edges.
2. Store each relation in one direction. Discover reverse relationships with repository search.
3. Never copy referenced status, owner, receipt, or acceptance into a second authoritative state.
4. A supporting plan may expand implementation detail but never owns status.
5. Release admission uses completed item evidence plus an exact path inventory; a relationship edge
   alone does not admit content.

## Owner And Lane Selection

Select the first canonical owner that can change the incorrect truth:

| Responsibility                                                               | Canonical owner                             |
| ---------------------------------------------------------------------------- | ------------------------------------------- |
| Product decision, prioritization, routing, and dispatch                      | PRODUCT                                     |
| Source-of-truth map, architectural boundary, risk classification             | ARCHITECT                                   |
| Server truth, persistence, normalization, auth, mutation, provider ingestion | BACKEND                                     |
| Authenticated runner routes and interactions                                 | FRONTEND — Product lane                     |
| Loopback-only Local Inspector and local design-suite UI                      | FRONTEND — DevTools lane                    |
| Public entry, landing, and marketing UI                                      | FRONTEND — Marketing lane                   |
| Shared primitives, tokens, canonical DS CSS, validators, and `/hitoDS`       | DESIGN SYSTEM                               |
| Approved Figma-file mutations only                                           | DESIGN SYSTEM INTEGRATION                   |
| Independent validation and acceptance                                        | QA                                          |
| Domain criteria without implementation                                       | Matching named specialist role in `agents/` |

If the first incorrect owner or Frontend lane is not demonstrated, return the missing discriminator
to PRODUCT. Do not select the owner by task title, current file location alone, or available chat.

## Handoff Contract

### Required input

1. canonical item, mode, stage, and current lifecycle state;
2. user outcome or accepted decision;
3. demonstrated evidence or exact missing discriminator;
4. first incorrect owner and existing seam;
5. scope, preservation boundaries, and non-goals;
6. dependencies and current release-freeze state;
7. risk-derived Definition of Done and proof inventory; and
8. exact external authorization already granted, if any.

### Required output

1. truthful lifecycle state and assigned slice result;
2. demonstrated root cause or explicit evidence limit;
3. files/seams inspected and changed;
4. validation results and omitted-check consequences;
5. obsolete path or responsibility removed, or factual reason it remains;
6. preserved unrelated work and external boundaries;
7. residual risk, blocker, or cross-owner boundary; and
8. recommended next owner without dispatching it unless PRODUCT is acting under current authority.

## Subagent Limits

Existing `AGENTS.md` rules remain authoritative. The proposed workflow relies on them as follows:

1. Use only existing named Hito roles from `agents/`; no invented task-specific role.
2. At most six active subagents per bounded workstream; no nested spawning.
3. The primary owner keeps all same-role and same-lane production implementation.
4. A different role may provide a bounded read-only discriminator or independent review.
5. Cross-owner production writing is a Product handoff, not a subtask.
6. Never delegate secrets, hosted mutation, destructive actions, fragile shared sessions, release
   mutation, or overlapping writes.
7. The canonical owner integrates every subagent finding and remains accountable.

## Concurrency And Interruption Rules

1. One active writer owns each canonical item.
2. Concurrent repository writers are permitted only when their files, canonical owners, persisted
   data, runtimes, generated outputs, and validation side effects are demonstrably disjoint.
3. Shared generated artifacts, lockfiles, global documentation, release inventory, build output,
   local runtime state, and migrations serialize to one writer.
4. A role checks the current state of the receiving role before Product dispatch.
5. An active role is never interrupted without Ivan's explicit instruction to stop or supersede
   that exact task.
6. An unexpected overlap stops the later writer before mutation and returns the boundary to PRODUCT.
7. During a candidate freeze, the release rule below overrides ordinary disjoint-write concurrency:
   all other repository work is read-only.

## Autonomy Envelope

### The assigned owner may decide and execute alone

- investigation order and safe read-only tooling;
- the smallest edit inside its named canonical seam;
- local loopback runtime control and disposable fixtures already allowed by current policy;
- focused tests and risk-proportional validation;
- same-owner fix-forward that does not change outcome, owner, risk class, external boundary, or
  accepted scope;
- removal of a superseded path already proven inside the authorized slice;
- compact lifecycle/evidence updates in the same canonical item; and
- a bounded read-only review by an existing named role when it materially improves evidence.

### The owner must return to PRODUCT

- the first incorrect owner or Frontend lane changes;
- a second production writer or cross-owner implementation becomes necessary;
- the task promotes from Lite to Tracked;
- scope expands to persisted state, auth/security, external action, release, or a broad user flow;
- a new runtime artifact, migration, framework, state layer, compatibility path, or broad validator
  becomes necessary but was not admitted;
- a material product/design choice remains unresolved;
- Global QA, release, deployment, or a successor workstream is required; or
- an active candidate freeze forbids the required write.

### PRODUCT must return to Ivan

- a new or materially changed dispatch lacks current-discussion consent;
- staging, commit, push, deployment, hosted mutation, paid-provider use, material deletion, or
  another reserved external action lacks exact authorization;
- the plan does not cover material new scope; or
- a product choice or irreversible tradeoff cannot be derived from accepted evidence.

## Approved Release Candidate Freeze Rule

This rule is implemented in `AGENTS.md`. The detail below preserves decision context and pilot
expectations; agents must execute the compact authoritative wording in `AGENTS.md`.

### Admission

1. A canonical release item is `in_progress` at a named candidate-freeze stage.
2. All implementation, QA-receipt, planning, documentation, cleanup, generator, build, and runtime
   writers affecting the checkout are idle before the freeze begins.
3. The release owner records branch, `HEAD`, remote baseline, empty index, admitted canonical items,
   exact admitted paths, explicit exclusions, and path/content digests.
4. Every admitted path maps to a completed owner, the release receipt itself, or an explicitly
   documented shared integration dependency.

### Frozen interval

1. The release owner is the sole repository writer.
2. Other roles may inspect and discuss read-only context, but must not write runtime source,
   backlog items, receipts, plans, history, generated output, fixtures, build output, or local
   runtime state in the frozen checkout.
3. The only permitted release-owned mutations are the release receipt and the exact Git/external
   actions already authorized by Ivan.
4. Recompute the inventory after every external command and immediately before staging and commit.
5. Any unexpected path, content, index, remote, role, runtime, or generated-output movement
   invalidates the freeze. Never absorb it into the candidate.

### Failure

1. Stop at the first failed gate or unexplained movement.
2. Restore the Git index without altering working-tree bytes.
3. Do not repair another owner's source, receipt, migration, configuration, or hosted state.
4. Record the exact first incorrect owner and evidence in the release item.
5. PRODUCT routes a separate bounded fix to that owner.
6. A later release attempt creates a new item or explicitly authorized retry stage and always
   records fresh inventory and digests.

### End of freeze

The freeze ends only when the release item reaches a truthful terminal state (`blocked`,
`completed`, `closed`, or `archived`) and its receipt confirms index/source state and all external
actions or omissions. A terminal blocked release does not imply the larger release chain is
complete; remediation and a fresh attempt remain separate Product decisions.

## Staged Adoption Plan

### Stage 0 — completed: finish the active release chain

- Re-read the receipt-hygiene item and release retry state.
- Do not implement policy while a release candidate is frozen or while a release-owned repository
  writer is active.
- If receipt hygiene completes, PRODUCT decides whether to route a fresh release attempt before
  process-policy adoption.

### Stage 1 — completed: Product decision

PRODUCT reviewed the proposal with Ivan. Ivan approved full adoption and directly authorized the
ARCHITECT dispatch recorded above.

### Stage 2 — completed: minimal policy amendment

ARCHITECT implemented the Tracked policy slice in `AGENTS.md`:

- add one compact canonical work-loop section;
- add the four optional backlog relation fields;
- add the autonomy return conditions; and
- add the candidate-freeze rule.

No role file, runtime source, build script, validator, tracker, state model, or new documentation
hierarchy is part of the default slice.

### Stage 3 — completed: conditional procedure alignment

ARCHITECT inspected:

- `skills/hito-backlog-intake/SKILL.md`; and
- `skills/hito-prompt-handoff/SKILL.md`.

`hito-backlog-intake` had no contradiction and remained unchanged. `hito-prompt-handoff` contained
one direct contradiction: it allowed autonomous Product dispatch for an approved canonical plan,
while `AGENTS.md` requires Ivan's explicit confirmation for every new or materially changed
handoff unless he directly says to send/start/run it. Only that sentence was aligned; the policy
was not copied into either skill.

### Stage 4 — completed: bounded pilots

The approved rule was piloted on:

1. [Admin Capture Repository Mirror Loader Recovery](2026-08-13-hito-admin-capture-repository-mirror-loader-recovery.md),
   a natural ordinary Tracked BACKEND task; and
2. two later release attempts with fresh candidates:
   [retry](2026-08-14-current-candidate-git-release-and-vercel-verification-retry.md) and
   [retry 2](2026-08-14-current-candidate-git-release-and-vercel-verification-retry-2.md).

The ordinary task demonstrated one-owner root-cause repair and same-owner fix-forward. Each release
attempt demonstrated fresh admission, sole-writer serialization, fail-closed ownership mapping,
empty-index recovery, and a fresh retry rather than candidate reuse. Measurements remain in their
existing canonical items; no process dashboard or parallel pilot report was created.

### Stage 5 — completed: Product acceptance with bounded waiver

PRODUCT compared the pilots to the measurable acceptance criteria below and adopted the policy.
The only unexercised proof is a successful post-policy staged candidate: it was circularly blocked
because the policy's own nonterminal files could not be admitted to a release. PRODUCT waives that
pilot-closure criterion only. It does not waive or weaken the release gate itself: the next release
must still stage the exact admitted inventory, verify staged path/content identity, and run
`git diff --cached --check` before commit. If the adopted rule later adds ambiguity, ceremony,
duplicate state, or blocks useful disjoint work without improving release safety, revert only the
policy/procedure hunks.

## Measurable Acceptance

The pilot passes only if all applicable criteria are demonstrated:

| Check               | Acceptance condition                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Canonical lifecycle | Exactly one backlog item owns each retained workstream's status and receipt                                     |
| Ownership           | Exactly one active execution owner; every production change maps to that owner                                  |
| Root cause          | Defect/debugging work records a demonstrated cause or exact missing discriminator before implementation         |
| Same-owner autonomy | At least one failed focused check is fixed forward inside the same admitted owner without redispatch            |
| Cross-owner safety  | A newly discovered second-owner implementation stops and returns to PRODUCT                                     |
| Dispatch control    | No new or materially changed dispatch occurs without Ivan's current authority                                   |
| Subagent discipline | No invented role, nested delegation, or same-role implementation delegation occurs                              |
| Backlog graph       | Only the four optional relation fields are used; no duplicate status or owner is copied                         |
| Release hygiene     | All admitted untracked task files pass staged diff hygiene before commit                                        |
| Freeze exclusivity  | Zero non-release repository writers and zero non-release writes occur during freeze                             |
| Candidate integrity | Every staged path maps to a completed owner or explicit release dependency                                      |
| Failure recovery    | A failed release leaves the index empty, source bytes unchanged by release, and no unauthorized external action |
| Process footprint   | No tracker, service, dashboard, state model, validator, generated index, or new docs hierarchy is added         |

## Rollback

1. Revert only the approved `AGENTS.md` and conditional skill wording introduced by the policy
   slice.
2. Do not rewrite or delete historical backlog items, receipts, pilot evidence, release records, or
   runtime changes.
3. Remove no relationship history solely because the policy is rolled back; treat existing fields
   as inert documentation unless PRODUCT explicitly chooses a cleanup.
4. Restore the prior policy wording byte-for-byte where practical and record why the pilot failed
   in this canonical item.
5. Rollback requires no new compatibility layer, migration, service, or validator.

## What Not To Touch

- runtime source, CSS, Design System primitives/tokens, generated manifests, validators, fixtures,
  migrations, dependencies, lockfiles, build output, or local runtime state;
- Git index, branch, commit history, remotes, push/deployment state, hosted data, providers, secrets,
  or authentication configuration;
- completed UI audit findings or their implementation receipts;
- the active release retry or receipt-hygiene lifecycle, except through their own owners;
- role proliferation, new orchestration frameworks, dashboards, trackers, graph databases, state
  models, compatibility layers, or parallel documentation systems.

## Validation Expectations

### Initial documentation capture — completed

- one new canonical backlog file only;
- all backlog-intake required fields present;
- evidence and hypotheses explicitly separated;
- initial proposal clearly labeled non-operative pending Product approval;
- no overlap with active Design System receipt hygiene;
- Markdown whitespace/diff hygiene passes for this file.

### Policy implementation and pilots

- focused policy diff demonstrates the approved loop, graph vocabulary, autonomy envelope, and
  freeze rule without restating entire role or skill contracts;
- repository search finds no second active workflow/state owner;
- conditional skill files change only on a demonstrated contradiction;
- one ordinary Tracked pilot and one release pilot meet the measurable acceptance inventory;
- omitted checks and their consequences are recorded truthfully.

## Definition Of Done

This backlog item is complete only after:

1. PRODUCT and Ivan record an explicit decision on the proposal;
2. any approved policy slice is implemented within the exact boundary above;
3. the ordinary-work and release pilots are completed or explicitly waived with consequences;
4. acceptance criteria are evaluated from evidence rather than policy presence; and
5. PRODUCT either adopts the result, reduces it, or rolls it back.

Creating this backlog item satisfies context retention only. It does not satisfy policy
Implementation DoD, Global QA Acceptance, release readiness, deployment, or production acceptance.

## Next Recommended Role

None for this policy lifecycle. A future release owner must use the adopted candidate-freeze rule,
including exact staged identity and `git diff --cached --check`; that release is a separate
canonical workstream, not a further policy pilot.

## Implemented Boundary

- **Owner:** ARCHITECT.
- **Policy write:** `AGENTS.md` only.
- **Conditional procedure write:** `skills/hito-prompt-handoff/SKILL.md`, limited to the one
  demonstrated dispatch-confirmation contradiction.
- **Inspected without change:** `skills/hito-backlog-intake/SKILL.md`.
- **Outcome:** one compact canonical work loop, four optional relationship fields, autonomy return
  conditions, Product communication order, and the repository-wide candidate-freeze rule.
- **Non-goals:** runtime code, CSS, agent proliferation, release execution, generic validators,
  scripts, services, dashboards, trackers, schemas, state models, migrations, or a blanket rewrite.
- **Additional files or mechanisms:** none.

## Blockers

None. The former circular staged-success pilot is explicitly waived only for policy closure; it
remains a mandatory gate on the next separately admitted release candidate.

## Policy Implementation Preflight — 2026-08-12

- **Outcome / mode:** implement the approved canonical work loop, optional relationship vocabulary,
  autonomy envelope, Product communication contract, and release freeze; Tracked architecture
  policy implementation.
- **Terminal release evidence:** release retry 2 is `completed`; it records exact local/remote SHA
  equality at `74607987885ca40f33658c79fba174d173d45646`, an empty index, and production Vercel
  `READY`. BACKEND was idle and no release freeze remained active before this write.
- **Canonical seams:** `AGENTS.md`; the current canonical item; and only a named skill containing a
  demonstrated contradiction.
- **Skill discriminator:** `hito-backlog-intake` is compatible and remains byte-unchanged.
  `hito-prompt-handoff` contradicted the current Product confirmation contract by allowing
  autonomous dispatch from an already approved plan; only that rule is corrected.
- **Concurrency:** PRODUCT was independently controlling the user-authorized `qa_fixture` loopback
  runtime. It did not write these policy files; ARCHITECT did not touch build/runtime output or run
  a build. No candidate freeze was active.
- **Reuse-first budget:** reuse the single operating policy, existing backlog, existing Product
  routing seam, and existing release procedure. New runtime artifacts, helpers, validators,
  services, trackers, dashboards, schemas, generated indexes, compatibility paths, plans, and roles:
  **none**.
- **Preservation boundary:** no runtime source, styles, tokens, scripts, fixtures, generated files,
  Git lifecycle, hosted state, release records, or unrelated dirty work.
- **Focused proof:** file-scoped Markdown formatting, whitespace/diff hygiene, structural contract
  searches, allowed-file inventory, and truthful pending-pilot lifecycle. Build, browser, runtime,
  hosted, and release replay are omitted because no runtime or release candidate changes.
- **Stop condition:** any additional file, new mechanism, ownership change, active release freeze,
  or unresolved Product choice returns the work to PRODUCT.

## Initial Architecture Capture Preflight — 2026-08-12

- **Outcome:** retain the complete architecture recommendation in one new canonical backlog item so
  later roles can recover the evidence, proposed workflow, boundaries, and adoption conditions.
- **Mode / ownership:** Tracked architecture documentation executed by ARCHITECT; the retained item
  is owned by PRODUCT because activation, routing, and dispatch decisions remain Product work.
- **Accepted evidence:** current `AGENTS.md`, `agents/architect.agent.md`, the completed UI
  source-of-truth audit, the blocked release record, and the blocked release retry.
- **Existing seam:** `docs/tasks/backlog/` is reused as the sole operational queue. No supporting
  plan, tracker, service, graph store, dashboard, generated index, validator, or parallel state
  document is created.
- **Reuse-first change budget:** one new Markdown backlog file is justified by Ivan's explicit
  request for durable separate retention. New runtime artifacts, helpers, scripts, migrations,
  dependencies, compatibility paths, and production files: **none**. No existing responsibility is
  removed by the capture; the future proposal is explicitly non-operative.
- **Concurrency check:** DESIGN SYSTEM was active on the separate receipt-hygiene item and its
  source receipt. This item uses a previously absent disjoint file. No active release candidate
  freeze was observed before the write.
- **Preservation boundary:** preserve every pre-existing tracked and untracked path byte-for-byte;
  do not alter the release retry, receipt-hygiene lifecycle, runtime source, Git index, external
  state, or another role's item.
- **Focused proof:** require all backlog-intake fields, explicit evidence/hypothesis separation,
  proposal-not-policy labeling, direct whitespace inspection, Prettier check, and file-only status.
- **Stop condition:** stop before writing if a duplicate canonical item, active candidate freeze,
  target-file collision, or overlapping writer is found.

## Architecture Capture Receipt — 2026-08-12

- **Task / mode:** detailed retention of the canonical work-loop, autonomy-envelope, backlog-graph,
  and release-freeze proposal; Tracked architecture documentation.
- **Outcome:** one proposed, non-operative canonical backlog item captures demonstrated evidence,
  hypotheses, owner routing, handoff contracts, concurrency, subagent limits, autonomy boundaries,
  freeze behavior, staged adoption, measurable acceptance, rollback, and the exact future write
  boundary.
- **Root cause:** current safety rules exist but are not composed into one repository-wide loop and
  freeze contract; release prompts currently carry the missing composition locally.
- **Files changed:** this file only.
- **Preserved boundaries:** no runtime, task lifecycle outside this item, Git lifecycle, release,
  hosted state, provider, build, fixture, or agent-dispatch mutation.
- **Next owner:** PRODUCT for a decision after the active release chain reaches a terminal state.
- **Acceptance boundary:** documentation capture only; policy is not active and no pilot, Global QA,
  release, deployment, or production acceptance is claimed.
- **Role / skills:** `agents/architect.agent.md`;
  `skills/hito-architecture-audit/SKILL.md`; `skills/hito-backlog-intake/SKILL.md`.
- **Subagents:** none.

## Tracked Policy Implementation Receipt — 2026-08-12

### Task, Stage, And Product Outcome

- **Task / mode:** implement the approved canonical work loop, optional backlog relationships,
  autonomy envelope, Product communication order, and repository-wide release freeze; Tracked.
- **Implementation stage:** completed. The canonical item remains `in_progress` only for the next
  naturally occurring ordinary Tracked-work pilot, the next-release pilot, and subsequent Product
  acceptance or rollback.
- **Product outcome:** Hito now has one explicit operating loop from intake through release while
  keeping the existing backlog as the sole lifecycle store, PRODUCT as the sole dispatcher, and
  Ivan's confirmation and external-action authority intact.

### Root Cause And Decision

The operating policy already contained the required safety rules, but they were distributed across
mode, routing, ownership, validation, and backlog sections. Release prompts had to reconstruct the
missing composition locally, and `hito-prompt-handoff` directly contradicted the Product
confirmation contract by allowing autonomous dispatch from an approved plan. The implementation
adds one compact composition section to the canonical policy and removes only that contradictory
skill permission.

### Files Inspected And Changed

- **Changed:** `AGENTS.md` — added the canonical work loop, four optional Markdown relationships,
  autonomy/return conditions, repository-wide release freeze, and early staged-candidate hygiene;
  made the existing Product communication order explicit; mechanically renumbered later sections.
- **Changed conditionally:** `skills/hito-prompt-handoff/SKILL.md` — replaced the contradictory
  approved-plan autonomous-dispatch sentence with the authoritative confirmation rule and direct
  send/dispatch/start/run exception.
- **Changed for lifecycle:** this canonical backlog item — recorded approval, exact dispatch,
  implementation boundary, preflight, current pending-pilot lifecycle, and this receipt.
- **Inspected without change:** `skills/hito-backlog-intake/SKILL.md` — no contradiction with the
  approved optional relationship vocabulary or single-item lifecycle.
- **Read as authority/evidence:** `agents/architect.agent.md`,
  `skills/hito-architecture-audit/SKILL.md`,
  `skills/hito-plan-writing-and-closeout/SKILL.md`, and completed release retry 2.

### Preserved Boundaries

- No runtime source, style, token, script, fixture, generated file, dependency, migration, role,
  build output, local runtime state, Git lifecycle, hosted state, provider, or release record was
  changed.
- No plan, tracker, dashboard, service, schema, state model, generated index, validator,
  compatibility path, documentation hierarchy, or runtime artifact was added.
- Product communication was made more explicit and not weakened: PRODUCT first reports the
  task/plan, completed work, current state, next action/role, and blockers in Russian; every new or
  materially changed handoff then requires one exact English prompt and Ivan's explicit
  confirmation unless Ivan directly orders immediate dispatch.
- The relationship fields are optional navigation only. Referenced items retain their own status,
  owner, receipt, and acceptance authority.
- No subagent was used; ARCHITECT owned all policy writing.

### Validation Inventory

| Check                        | Scenario / environment                                              | Result | Evidence                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical policy composition | `AGENTS.md` structural search                                       | Passed | Intake/discriminator, one-owner dispatch, same-owner execution, return/closure, independent QA, and release are present in one section |
| Backlog vocabulary           | `AGENTS.md` structural search                                       | Passed | `Parent`, `Depends On`, `Evidence From`, and `Supersedes` are optional, one-directional, non-authoritative navigation fields           |
| Autonomy boundary            | `AGENTS.md` source review                                           | Passed | Same-owner routine decisions and Product/Ivan return conditions are explicit                                                           |
| Product communication        | `AGENTS.md` plus handoff skill                                      | Passed | Russian status order, exact English prompt, explicit confirmation, and direct immediate-dispatch exception agree                       |
| Candidate freeze             | `AGENTS.md` source review                                           | Passed | Admission, early staged hygiene, sole-writer interval, invalidation, recovery, fresh retry, and terminal end are actionable            |
| Conditional skill inspection | Both named skills                                                   | Passed | Backlog intake unchanged; only the demonstrated handoff contradiction changed                                                          |
| Markdown formatting          | Prettier on the three changed Markdown files                        | Passed | All matched files use Prettier formatting                                                                                              |
| Whitespace/diff hygiene      | Tracked file diff check plus no-index check for this untracked item | Passed | No trailing whitespace or diff-hygiene error                                                                                           |
| Allowed-file boundary        | File-scoped Git status                                              | Passed | Only `AGENTS.md`, the handoff skill, and this canonical item are in the task-owned change set                                          |

### Omitted Proof And Consequences

- No build, browser, runtime, hosted, provider, Git release, or deployment replay was run because
  this slice changes Markdown operating policy only. It makes no runtime, Global QA, hosted parity,
  release-readiness, deployment, or production-acceptance claim.
- The approved behavior is implemented but not yet pilot-validated. The next naturally occurring
  ordinary Tracked task and next release must provide the evidence in the measurable acceptance
  table; synthetic work is prohibited.
- No technical-log entry was added because the authorized boundary was limited to `AGENTS.md`, a
  contradictory named skill when demonstrated, and this canonical item; durable adoption remains
  pending pilot acceptance.

### Next Owner And Blockers

- **Next owner:** PRODUCT, to let the next natural ordinary Tracked task and release act as pilots,
  then accept the policy or route a bounded rollback from their evidence.
- **Implementation blockers:** none.
- **Closure gate:** both natural pilots and Product acceptance remain pending; status stays
  `in_progress` without blocking ordinary work.
- **Role / skills:** `agents/architect.agent.md`;
  `skills/hito-architecture-audit/SKILL.md`;
  `skills/hito-plan-writing-and-closeout/SKILL.md`. The two named procedure skills were inspected
  for contradiction; `hito-prompt-handoff` required the conditional alignment above.
- **Subagents:** none.

## Product Pilot Acceptance And Closure — 2026-08-14

### Decision

PRODUCT adopts the Canonical Work Loop, autonomy envelope, optional Markdown relationship
vocabulary, and repository-wide release-candidate freeze as the operative Hito policy. This
terminalizes the policy item; it does not start a release, admit a candidate, or change any
external state.

### Evidence Evaluated

- The natural [Admin Capture Repository Mirror Loader Recovery](2026-08-13-hito-admin-capture-repository-mirror-loader-recovery.md)
  pilot demonstrated a single BACKEND owner, an observed parser discriminator, same-owner
  fix-forward, proportional validation, and a truthful cross-owner return to PRODUCT.
- The two fresh [release retry](2026-08-14-current-candidate-git-release-and-vercel-verification-retry.md)
  records demonstrated one release writer, stable candidate snapshots, fail-closed ownership
  admission, empty-index recovery, no release-side repair, and no commit, push, deployment, or
  hosted mutation after a failed gate.
- The completed [Backlog Lifecycle Reconciliation And Terminal Archive](2026-08-14-hito-backlog-lifecycle-reconciliation-and-terminal-archive.md)
  independently mapped those pilots to every measurable criterion and confirmed that no tracker,
  service, dashboard, state model, validator, generated index, or parallel lifecycle store was
  added.

### Explicit Bounded Waiver

The policy's successful _post-policy staged-path pilot_ is unexercised because its own
`in_progress` files made the release candidate inadmissible. PRODUCT waives only that historical
closure condition to break the circularity. This is not permission to skip release hygiene. The
next release must still, before commit, stage the exact admitted inventory, recheck staged
path/content identity, and pass `git diff --cached --check`. A failure at any later release gate
remains fail-closed and requires a new freeze.

### Closure Boundary

- **Changed for closure:** this canonical item and the durable decision index only.
- **Preserved:** `AGENTS.md`, `skills/hito-prompt-handoff/SKILL.md`, runtime source, styles,
  validators, fixtures, generated output, Git index/history, remotes, hosted state, providers, and
  all other dirty work.
- **Validation:** direct local-link inspection, Prettier, and `git diff --check` are required for
  this documentation-only closure. Build, browser, runtime, QA, staging, commit, push, hosted
  parity, deployment, and Global QA are outside this item and are not claimed.
- **Next owner:** PRODUCT only when Ivan requests a fresh release; BACKEND then owns a new release
  freeze from a newly admitted candidate.
