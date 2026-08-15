# Hito Role Instruction And Inter-Role Handoff Alignment Audit

## Work Item ID

2026-08-12-hito-role-instruction-and-inter-role-handoff-alignment-audit

## Status

completed

## Type

architecture-audit

## Priority

high

## Owner

architect

## Mode

Tracked

## Stage

Completed read-only instruction and collaboration audit; separate Product amendment decision pending.

## Parent

[Hito Canonical Work Loop, Autonomy Envelope, And Release Freeze Policy](2026-08-12-hito-canonical-work-loop-autonomy-and-release-freeze-policy.md)

## Scope

Establish whether the personal instructions in every canonical `agents/*.agent.md` file faithfully operationalize the approved workflow in `AGENTS.md`, and document the smallest proven role-to-role collaboration contract needed for routine Hito work.

This is an evidence-gathering architecture task. It does not authorize changing any role file, `AGENTS.md`, skill, runtime source, validator, fixture, generated output, Git state, or hosted service. Any implementation recommendation returns to PRODUCT as a separate, bounded amendment task.

## Archive Intent

retain_in_place

## Task

Audit the active role instructions against the current canonical policy. Determine, from source evidence rather than preference, whether each role file needs a minimal amendment for the policy to work reliably in practice.

Produce one concise collaboration contract that explains how PRODUCT, FRONTEND, BACKEND, DESIGN SYSTEM, QA, and the supporting named roles hand work off without duplicate writers, invented subagents, same-role delegation, or source-of-truth drift.

## User Report

Ivan asked whether each agent needs clearer personal instructions for the new workflow to work, and asked for an explanation of how FRONTEND, BACKEND, and the other roles must collaborate under that workflow.

## Evidence

- `AGENTS.md` is now the approved canonical authority for the work loop, autonomy envelope, one-owner dispatch, named-role subagent limits, Frontend lanes, and release freeze.
- The policy implementation intentionally changed `AGENTS.md` and one contradictory handoff-skill sentence, but did not audit or modify the individual canonical role files in `agents/`.
- Every role file is subordinate to `AGENTS.md`; it must clarify domain ownership and practical boundaries without restating, weakening, or contradicting the common policy.

## Observed Behavior

The global workflow exists, but it is not yet demonstrated that the individual role instructions consistently point agents to the same intake, ownership, subagent, escalation, validation, and handoff rules. The risk is not a confirmed runtime defect; it is operational ambiguity that can produce duplicate execution or inappropriate routing.

## Expected Behavior

An agent can read its own role file together with `AGENTS.md` and immediately know:

- which production responsibility it owns and which adjacent role owns the next boundary;
- when it implements itself versus returns to PRODUCT for a cross-owner handoff;
- what bounded, named-role read-only assistance is appropriate;
- what it must include in a handoff or receipt; and
- that no personal instruction creates a parallel lifecycle, dispatcher, validation authority, or same-role implementation delegation.

## Required Discriminator

This audit must distinguish a real contradiction, material omission, or duplicated/obsolete rule from intentional concise role guidance. Do not assume every role file requires editing merely because the global policy became more detailed.

## Source Investigation

Read:

- `AGENTS.md`;
- every canonical `agents/*.agent.md` file;
- `skills/hito-architecture-audit/SKILL.md`;
- the parent policy item; and
- only the existing role/skill text necessary to resolve a demonstrated conflict.

Inspect current role/thread state before any proposed follow-up. This item has one writer: ARCHITECT. No subagent is required; use a bounded existing named-role read-only review only if it materially resolves an ambiguity that cannot be determined from the role files.

## Required Outcome

Record in this item, in English:

1. A role-file inventory with one of: `aligned`, `minimal amendment required`, or `evidence insufficient` for every canonical role.
2. Every demonstrated contradiction, material omission, duplication, or obsolete instruction, including the controlling `AGENTS.md` rule and the smallest affected role-file section.
3. A compact interaction matrix covering at least PRODUCT, FRONTEND (and its lanes), BACKEND, DESIGN SYSTEM, QA, ARCHITECT, DESIGNER, and DESIGN SYSTEM INTEGRATION. For each, name: authoritative input, self-owned work, return-to-PRODUCT trigger, permitted bounded assistance, and recipient at the first cross-owner boundary.
4. A minimal amendment map: exact files and sections that should change, the obsolete wording/responsibility to remove or reduce, and a no-change conclusion for all other role files.
5. A plain-language explanation for PRODUCT/Ivan of how a normal defect, Frontend↔Backend change, shared Design System change, and independent QA move through the canonical loop.
6. The recommended next owner and a single exact handoff prompt only if source evidence proves a specific amendment task is needed.

## What Not To Touch

- `AGENTS.md`, all `agents/*.agent.md` files, and every skill file;
- runtime source, styles, tokens, Design System manifests/validators, tests, fixtures, build output, and documentation outside this canonical item;
- local QA runtime, Git index/history, commits, pushes, deployments, provider or hosted state; and
- unrelated dirty work.

## Validation Expectations

This is source-backed planning only. Verify the inventory covers every canonical role, every claim links to an existing instruction, recommendations are minimal and non-duplicative, and the canonical item has clean Markdown and diff hygiene. No browser, build, database, runtime, hosted, or release check is required.

## Definition Of Done

- a factual yes/no answer exists for whether role-file amendments are needed;
- the interaction contract is explicit enough to prevent the previously observed routing ambiguity;
- no unproven policy or runtime problem is presented as fact;
- proposed follow-up is limited to the proven files and does not create roles, trackers, or another policy system; and
- this item remains truthful about its read-only boundary and any remaining PRODUCT decision.

## Product Dispatch

```text
ROLE: ARCHITECT

Mode: Tracked
Stage: read-only role-instruction and inter-role handoff alignment audit

Execute this canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-role-instruction-and-inter-role-handoff-alignment-audit.md`

Read `AGENTS.md`, `agents/architect.agent.md`, `skills/hito-architecture-audit/SKILL.md`, the complete canonical item, its parent policy item, and every canonical `agents/*.agent.md` file before making any task-owned write.

Ivan needs a source-backed answer to two questions: whether each personal role instruction needs amendment for the approved workflow to work, and how the named roles must interact without duplicate ownership or invented subagents.

Perform this as a read-only architecture audit. Do not edit `AGENTS.md`, role files, skills, runtime source, documentation outside this item, validators, fixtures, generated output, local runtime, Git state, or hosted services. Do not dispatch implementation. Do not assume that every role file needs a rewrite.

Use the global policy as controlling authority. For every canonical role file, classify it as aligned, minimal amendment required, or evidence insufficient. Prove each exception with the conflicting or missing instruction and name the smallest role-file section affected.

In the canonical item, record a compact interaction matrix for PRODUCT, FRONTEND and its lanes, BACKEND, DESIGN SYSTEM, QA, ARCHITECT, DESIGNER, and DESIGN SYSTEM INTEGRATION. For each role state: authoritative input, self-owned work, return-to-PRODUCT trigger, permitted bounded assistance, and first cross-owner recipient. Include a plain-language walkthrough for an ordinary defect, a Frontend/Backend boundary, a shared Design System change, and independent QA.

If amendments are proven necessary, propose one minimal follow-up map with exact files/sections, deleted or reduced duplicate responsibility, validation, and one recommended owner. Do not implement it. If no amendment is needed, state that conclusion and why the current global policy plus role file is sufficient.

Preserve unrelated dirty work byte-for-byte. New runtime artifacts, helpers, validators, skills, roles, trackers, dashboards, compatibility paths, and process layers: none. Subagents are unnecessary; use a bounded existing named-role read-only review only if it materially resolves an ambiguity that source inspection cannot.

Definition of Done:
- every canonical role file has an evidence-backed classification;
- proven conflicts and omissions are separated from stylistic preferences;
- the interaction matrix makes owner boundaries and escalation unambiguous;
- any follow-up is a minimal, separately routed proposal; and
- focused Markdown and diff hygiene for this canonical item pass, with no browser/build/runtime/release claim.
```

## Execution Preflight — 2026-08-12

- **Mode / owner / stage:** Tracked read-only architecture audit owned by ARCHITECT; role-instruction
  and inter-role handoff alignment.
- **Canonical source:** `AGENTS.md` controls. Role files may clarify ownership but must not restate,
  weaken, or override the canonical loop, Product dispatch contract, one-owner rule, subagent
  limits, acceptance separation, or release freeze.
- **Read inventory:** `AGENTS.md`, `agents/architect.agent.md`,
  `skills/hito-architecture-audit/SKILL.md`, this complete item, its complete parent policy item,
  and all 14 files matching `agents/*.agent.md`.
- **Current execution state:** PRODUCT, BACKEND, DESIGN SYSTEM, and the other named execution tasks
  were idle or not loaded; only this ARCHITECT task was active. No release candidate freeze was
  active.
- **Reuse-first budget:** reuse this canonical item as the sole audit and lifecycle record. New role
  files, skills, helpers, validators, trackers, dashboards, compatibility paths, process layers,
  runtime artifacts, and supporting plans: **none**.
- **Writable boundary:** this item only. `AGENTS.md`, every role/skill file, runtime source, local
  runtime, build/generated output, Git state, and hosted services remain read-only.
- **Focused proof:** exhaustive role-file classification, controlling-rule citations, ownership and
  handoff matrices, file-only Prettier, trailing-whitespace inspection, and no-index diff hygiene.
- **Stop condition:** any implementation, unresolved source ambiguity requiring a new policy choice,
  active freeze, or write outside this item returns the work to PRODUCT.

## Audit Verdict

**Role-file amendments are needed, but not for every role.** Eight of the fourteen canonical role
files are aligned and need no change. Six contain a demonstrated conflict, obsolete requirement, or
duplicate production-owner statement that the global policy cannot safely leave as practical role
guidance. No existing role file is classified `evidence insufficient`.

The approved workflow itself is sufficient and should not be copied into all roles. The smallest
follow-up is a Product-owned edit to six existing role files. A separate coverage gap exists for
RUNNING COACH: `AGENTS.md` names it, but `agents/running-coach.agent.md` does not exist. This audit
cannot infer whether Product intends to retain that sidebar role; it records the missing decision
without creating a file or role.

## Canonical Role-File Inventory

| Canonical role file                         | Classification               | Source-backed decision                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agents/architect.agent.md`                 | `aligned`                    | `Boundaries` already preserves PRODUCT as sole dispatcher, requires a demonstrated owner/discriminator, prohibits Backend/Frontend implementation and substitute QA, and keeps Tracked architecture in one canonical item. The global loop supplies routine autonomy; repeating it is unnecessary.                                                                                                                                                                             |
| `agents/backend.agent.md`                   | `aligned`                    | `Role` matches `AGENTS.md` server truth, persistence, auth, mutation, and provider-ingestion ownership. `Boundaries` makes Frontend/DS/copy read-only context and reports consumer impact rather than implementing it. No amendment is needed.                                                                                                                                                                                                                                 |
| `agents/backlog-manager.agent.md`           | `minimal amendment required` | `Boundaries`, lines 18–19, require every Lite item to carry `importer metadata`, a symptom, and a next discriminator. `AGENTS.md` permits feature/design/copy decisions and says accepted decisions must not be turned into fake defect replays. Replace only this obsolete bug/import-specific shape with the general Lite/Tracked record contract.                                                                                                                           |
| `agents/copy.agent.md`                      | `minimal amendment required` | `Use`, line 10, tells COPY to load `hito-prompt-handoff` for an actual handoff. That skill and `AGENTS.md` reserve handoff preparation/dispatch to PRODUCT. COPY should return final strings and the non-copy owner boundary to PRODUCT, not construct an execution handoff.                                                                                                                                                                                                   |
| `agents/data-quality.agent.md`              | `aligned`                    | It owns diagnosis and proof, not fixes; requires row/source/query/replay evidence, protects private payloads, and routes code/schema/UI changes out. This is intentionally distinct from QA acceptance and Backend implementation.                                                                                                                                                                                                                                             |
| `agents/design-system-integration.agent.md` | `aligned`                    | It owns only approved Figma-side mapping/mutation and verification, keeps repository runtime read-only, and names DESIGN SYSTEM, DESIGNER, and PRODUCT boundaries explicitly. This matches the global Figma/code hierarchy.                                                                                                                                                                                                                                                    |
| `agents/design-system.agent.md`             | `aligned`                    | It owns shared primitives, tokens, canonical CSS, validators, manifests, and `/hitoDS`; it excludes Product behavior, Backend truth, and Figma mutation. The role already reports affected consumers and cross-owner stops.                                                                                                                                                                                                                                                    |
| `agents/designer.agent.md`                  | `aligned`                    | It owns design judgment/specification, reuses Hito DS, does not implement product code or invent Backend capability, and recommends the next owner for PRODUCT to dispatch. No common-loop restatement is required.                                                                                                                                                                                                                                                            |
| `agents/frontend.agent.md`                  | `aligned`                    | It names exactly the three canonical lanes, keeps shared DS ownership outside Frontend, forbids browser-invented Backend/Product truth, promotes cross-lane/shared/persisted work, and reports the cross-owner boundary. `AGENTS.md` supplies the return through PRODUCT.                                                                                                                                                                                                      |
| `agents/integration-manager.agent.md`       | `minimal amendment required` | `Role`, lines 5–6, claims OAuth/OIDC, callbacks, webhooks, and provider connections while `AGENTS.md` and BACKEND assign auth and provider ingestion to BACKEND. `Boundaries` routes only schema/RLS/account/persistence to BACKEND, leaving duplicate server ownership. Narrow this role to provider-side contract/configuration coordination, secrets and rollback evidence; route all repository auth/callback/webhook/ingestion implementation through PRODUCT to BACKEND. |
| `agents/layout.agent.md`                    | `minimal amendment required` | `Role`, line 5, claims implementation of markup and styling, and `Boundaries`, line 18, authorizes presentation edits. FRONTEND already owns route presentation/components in one named lane; DESIGN SYSTEM owns shared primitives and canonical CSS. LAYOUT therefore creates a second production writer. Reduce it to bounded read-only layout diagnosis/specification and route implementation through PRODUCT to the exact Frontend lane or DESIGN SYSTEM.                 |
| `agents/product.agent.md`                   | `minimal amendment required` | `Boundaries`, lines 25–28, permits autonomous dispatch of an approved plan. `AGENTS.md` explicitly requires Ivan's confirmation for every new or materially changed handoff, even when an approved canonical item has an unambiguous next owner, unless Ivan directly says send/dispatch/start/run. Replace only this contradictory dispatch sentence and make the Russian status order explicit.                                                                              |
| `agents/qa.agent.md`                        | `aligned`                    | It owns independent verification, does not fix product code, validates data outcome as well as appearance, uses browser preflight only for browser work, fails required checks truthfully, and reports focused DoD versus Global QA explicitly.                                                                                                                                                                                                                                |
| `agents/system-advisor.agent.md`            | `minimal amendment required` | `Use`, line 14, tells a non-Product advisory role to load `hito-prompt-handoff` for an actual Product handoff, while `Boundaries` correctly says PRODUCT alone dispatches. Remove that skill instruction; keep the owner recommendation in `Report`. Its advisory scope remains intentionally distinct from ARCHITECT's owned architecture artifacts.                                                                                                                          |

### Classification Summary

- `aligned`: 8 — ARCHITECT, BACKEND, DATA QUALITY, DESIGN SYSTEM INTEGRATION, DESIGN SYSTEM,
  DESIGNER, FRONTEND, QA.
- `minimal amendment required`: 6 — BACKLOG MANAGER, COPY, INTEGRATION MANAGER, LAYOUT, PRODUCT,
  SYSTEM ADVISOR.
- `evidence insufficient`: 0 among existing canonical role files.

### Missing-File Coverage Gap

`AGENTS.md` describes RUNNING COACH as a nontechnical specialist review role, but the canonical
`agents/` directory has no `running-coach.agent.md`. The same policy says an owner is valid only
when it maps to a canonical role file. Therefore RUNNING COACH cannot currently be dispatched as a
valid canonical owner under the written rule.

The exact missing discriminator is a Product decision: retain the existing named role and authorize
a minimal canonical role file, or stop presenting it as dispatchable. This is not evidence that a
new role should be invented, and it is outside the six-file amendment slice below.

## Demonstrated Exceptions Versus Preferences

### Demonstrated and actionable

1. PRODUCT has a lower-precedence dispatch rule that directly contradicts `AGENTS.md`.
2. COPY and SYSTEM ADVISOR load a skill whose purpose and authority belong to PRODUCT.
3. BACKLOG MANAGER imposes importer/bug fields on all Lite intake, contradicting accepted-decision
   work and the common record contract.
4. INTEGRATION MANAGER claims auth/provider server responsibilities already owned by BACKEND.
5. LAYOUT claims markup/style production implementation already owned by an exact FRONTEND lane or
   DESIGN SYSTEM.
6. RUNNING COACH is named globally but lacks the role file required for dispatch eligibility; the
   desired resolution is not demonstrated.

### Not defects and not amendment reasons

- A concise role file does not need to repeat the canonical work loop, autonomy envelope, release
  freeze, Product confirmation order, subagent limits, or Tracked receipt template.
- DATA QUALITY diagnosis and QA acceptance are different responsibilities; their coexistence does
  not create duplicate implementation ownership.
- SYSTEM ADVISOR may provide broad recommendation while ARCHITECT owns formal architecture/source
  boundaries and artifacts; both are non-runtime roles and PRODUCT selects only one active owner.
- DESIGNER visual judgment, DESIGN SYSTEM code authority, and DESIGN SYSTEM INTEGRATION Figma
  mutation are intentionally separate stages.
- BACKLOG MANAGER capture is a Product-dispatched intake role; PRODUCT still owns batching,
  prioritization, and dispatch.
- Phrases such as “route to the owner” in aligned files inherit the controlling rule: the execution
  owner reports the boundary to PRODUCT; it does not directly dispatch the recipient.

## Canonical Interaction Matrix

Every cross-owner production boundary returns first to PRODUCT. A role may request bounded
read-only evidence from another existing named role, but that reviewer cannot become a second
writer or dispatch the next implementation owner.

| Role                      | Authoritative input                                                                                   | Self-owned work                                                                                                                                             | Return-to-PRODUCT trigger                                                                                                                        | Permitted bounded assistance                                                                                                                              | First cross-owner recipient                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| PRODUCT                   | Ivan's decision; canonical backlog item; accepted/failed gate; current owner state                    | Product outcome, scope, priority, lifecycle, routing, one exact handoff                                                                                     | Missing Ivan consent; uncovered scope; unresolved product choice; reserved external/destructive action                                           | Read-only evidence or recommendation from ARCHITECT, DESIGNER, QA, DATA QUALITY, or another named specialist                                              | Ivan for required authority, then the one selected named role                        |
| FRONTEND — DevTools       | Canonical item; loopback-only Local Inspector contract; implemented DS source                         | `src/components/devtools/` and local design-suite interaction in the DevTools lane                                                                          | Product/Marketing lane, Backend/persistence truth, shared DS contract, Figma mutation, or broad flow risk                                        | QA browser discriminator; DESIGNER visual decision; BACKEND contract fact; ARCHITECT ownership map                                                        | PRODUCT, which routes the demonstrated owner                                         |
| FRONTEND — Product        | Canonical item; Backend-shaped contract; accepted Product/design decision; Hito DS                    | Authenticated runner routes, forms, rendering state, and client interaction                                                                                 | Backend truth/mutation, shared primitive/CSS, another Frontend lane, product policy, or Figma work                                               | Same bounded read-only assistance as the DevTools lane                                                                                                    | PRODUCT, which routes BACKEND, DESIGN SYSTEM, DESIGNER/COPY, or another exact lane   |
| FRONTEND — Marketing      | Canonical item; accepted public-entry/marketing decision; Hito DS                                     | Public entry, landing, marketing components/assets, and interaction                                                                                         | Authenticated Product lane, Backend truth, shared DS, unresolved copy/design/product choice                                                      | COPY strings, DESIGNER decision, QA browser evidence, DS contract fact — read-only to the implementation slice                                            | PRODUCT, which routes the demonstrated owner                                         |
| BACKEND                   | Canonical item; demonstrated server/persistence/auth/provider discriminator; exact external authority | Validation, normalization, canonical persistence, auth/entitlement, mutations, imports/exports, provider ingestion, server actions, and migrations in scope | Frontend consumer change, Product policy, DS/UI work, another provider-side coordination owner, Global QA/release, or missing external authority | DATA QUALITY trace; QA safe replay; INTEGRATION MANAGER provider-contract fact; ARCHITECT ownership map                                                   | PRODUCT, which routes the consumer/specialist or returns to Ivan for authority       |
| DESIGN SYSTEM             | Canonical item; demonstrated repeated shared need; current primitive/token/CSS/validator source       | Shared primitives, tokens, canonical DS CSS, manifests, validators, and `/hitoDS`                                                                           | Product behavior, route-local consumer implementation, Backend truth, accepted visual decision, or Figma mutation                                | DESIGNER judgment; QA accessibility/browser evidence; FRONTEND consumer inventory; ARCHITECT ownership map                                                | PRODUCT, which routes the exact consumer role or DESIGN SYSTEM INTEGRATION           |
| QA                        | Accepted contract and implementation receipt; explicit validation layer and inventory                 | Independent focused DoD or Global QA evidence, fixtures within scope, verdict and coverage gaps                                                             | Failed check needing implementation; missing discriminator; unsafe/unavailable proof; newly affected owner                                       | DATA QUALITY trace, BACKEND contract fact, DESIGNER visual criterion, RUNNING COACH domain criterion only when that role becomes canonically dispatchable | PRODUCT with reproducible evidence and the demonstrated owner                        |
| ARCHITECT                 | Canonical item; source/policy evidence; current system owner map                                      | Architecture boundaries, source-of-truth analysis, risk classification, bounded architecture/docs artifacts                                                 | Runtime implementation, product choice, another owner, Global QA/release, or new mechanism                                                       | Bounded read-only facts from BACKEND, FRONTEND, DS, QA, DATA QUALITY, or DESIGNER                                                                         | PRODUCT, with a recommended owner but no dispatch                                    |
| DESIGNER                  | Accepted user problem/product decision; current states; Hito DS contracts                             | UX direction, information hierarchy, interaction/visual decisions, and justified specifications                                                             | Runtime implementation, shared primitive gap, Backend capability, product policy, or Figma mutation                                              | FRONTEND/DS feasibility fact; QA observed state; BACKEND capability fact                                                                                  | PRODUCT, which routes FRONTEND, DESIGN SYSTEM, BACKEND, or DESIGN SYSTEM INTEGRATION |
| DESIGN SYSTEM INTEGRATION | Product-approved Figma file/families; implemented Hito source; accepted design decision               | Figma discovery, code mapping, approved Figma mutation/library hygiene, and Figma-side proof                                                                | Code/Figma conflict, code-side primitive/token gap, unapproved target/publication/destructive action, or source ambiguity                        | DESIGN SYSTEM code fact; DESIGNER judgment; QA/read-only visual evidence                                                                                  | PRODUCT; code-side conflict is then routed to DESIGN SYSTEM                          |

## Supporting-Role Interaction Boundaries

| Supporting role     | Safe self-owned result                                                                                          | Return path                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| BACKLOG MANAGER     | One factual retained item, duplicate check, evidence organization, owner/discriminator                          | PRODUCT decides batching, priority, readiness, and dispatch                                                         |
| COPY                | Final strings and terminology notes without code or behavior changes                                            | PRODUCT routes implementation or the actual non-copy owner                                                          |
| DATA QUALITY        | Quantified anomaly, canonical pipeline trace, and owner evidence without a fix                                  | PRODUCT routes BACKEND, FRONTEND, or QA as demonstrated                                                             |
| INTEGRATION MANAGER | After amendment: provider-side contract/configuration coordination, secrets boundary, rollback/disable evidence | PRODUCT routes repository server work to BACKEND and UI work to FRONTEND; Ivan authorizes reserved provider actions |
| LAYOUT              | After amendment: read-only geometry/responsive diagnosis and a bounded implementation specification             | PRODUCT routes code to one exact FRONTEND lane or DESIGN SYSTEM                                                     |
| SYSTEM ADVISOR      | Source-backed decision options, trade-offs, priority, and owner recommendation                                  | PRODUCT alone decides and dispatches the next execution owner                                                       |

## Plain-Language Walkthroughs

### 1. Ordinary defect

1. PRODUCT captures or selects one item and dispatches the role that owns the first incorrect truth.
2. That owner proves the cause or records the exact discriminator, implements the smallest change in
   its own seam, runs focused proof, and fixes forward within the same boundary without redispatch.
3. If the cause moves to another owner, the first owner stops and reports evidence to PRODUCT; it
   does not ask a same-role clone or directly send work to the next role.
4. PRODUCT obtains Ivan's confirmation for the new or materially changed handoff unless Ivan already
   said to send/start/run it, then dispatches the demonstrated owner.
5. QA is separate only when independent acceptance is required. It validates and returns a verdict;
   it never patches the defect.

### 2. Frontend and Backend boundary

A visible UI symptom does not automatically belong to FRONTEND. FRONTEND may inspect the
Backend-shaped contract read-only. If the server response, persistence, auth, mutation, or provider
truth is first incorrect, FRONTEND records the discriminator and returns to PRODUCT. PRODUCT sends
BACKEND a separate owned slice. BACKEND fixes and validates server truth, then reports exact consumer
impact. If a UI consumer must change, PRODUCT separately dispatches one exact FRONTEND lane. At no
point do FRONTEND and BACKEND write the same task concurrently or hide the boundary in a subagent.

### 3. Shared Design System change

A route owner first proves that the need is shared rather than solving it with local CSS or a new
wrapper. It returns the demonstrated shared gap to PRODUCT. DESIGN SYSTEM then owns the primitive,
token, canonical CSS, manifest, validator, and `/hitoDS` change as one slice. Product-route adoption
returns through PRODUCT to one exact FRONTEND lane. DESIGNER supplies judgment when needed;
DESIGN SYSTEM INTEGRATION touches Figma only after Product approves the target and implemented code
is canonical.

### 4. Independent QA

The implementation owner closes only its implementation slice with proportional proof. PRODUCT
dispatches QA when independent focused acceptance or Global QA is actually the next gate. QA reads
the accepted contract, runs the assigned inventory, and reports Passed or Failed plus coverage
gaps. On failure, QA names the demonstrated owner and reproducible evidence and returns to PRODUCT;
it does not fix code, dispatch the owner, or turn itself into a second implementation writer.

## Minimal Follow-Up Amendment Map

One Product-owned follow-up can align the six existing role files without changing `AGENTS.md`, any
skill, runtime source, or the workflow model.

| File / smallest section                                         | Minimal amendment                                                                                                                                                                                                                                               | Duplicate or obsolete responsibility reduced                                                     | Focused validation                                                                                           |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `agents/product.agent.md` — `Boundaries`                        | Replace lines 25–28 with the exact `AGENTS.md` confirmation rule and Russian status-before-prompt order                                                                                                                                                         | Removes autonomous approved-plan dispatch and preserves Ivan's current-discussion control        | Search finds no autonomous-plan exception; wording matches Product routing policy                            |
| `agents/backlog-manager.agent.md` — `Boundaries`                | Replace lines 18–19 with the general Lite/Tracked retained-item contract, applying symptom/discriminator only to actual defects                                                                                                                                 | Removes unexplained `importer metadata` and fake-defect pressure on decisions/copy/design intake | No `importer metadata`; Lite/Tracked wording remains subordinate to `AGENTS.md` and backlog-intake skill     |
| `agents/copy.agent.md` — `Use` and `Report`                     | Remove the Product-only handoff skill instruction; state that COPY returns strings and owner boundary to PRODUCT                                                                                                                                                | Removes non-Product handoff preparation                                                          | COPY no longer loads `hito-prompt-handoff`; no code/behavior authority added                                 |
| `agents/system-advisor.agent.md` — `Use`                        | Remove the Product-only handoff skill instruction; retain owner recommendation in `Report`                                                                                                                                                                      | Removes non-Product actual-handoff responsibility                                                | SYSTEM ADVISOR loads only architecture audit for its source-backed advice                                    |
| `agents/integration-manager.agent.md` — `Role` and `Boundaries` | Narrow ownership to provider-side contract/configuration coordination, secrets safety, external authorization, and rollback/disable evidence; explicitly return repository auth, callbacks, webhooks, ingestion, schema, and persistence to PRODUCT for BACKEND | Removes duplicate BACKEND server/auth/provider-ingestion ownership                               | Role search shows one server-truth owner; provider-side external boundary and rollback remain explicit       |
| `agents/layout.agent.md` — `Role`, `Boundaries`, and `Report`   | Make LAYOUT a bounded read-only geometry/responsive diagnosis and implementation-spec role; route code through PRODUCT to one exact FRONTEND lane or DESIGN SYSTEM                                                                                              | Removes duplicate markup/style/CSS production ownership without inventing a fourth Frontend lane | No repository edit authority remains; exact implementation recipient is always Product-routed FRONTEND or DS |

### Running Coach Decision Hold

Do not create `agents/running-coach.agent.md` inside the six-file amendment. PRODUCT first records
whether the already named sidebar role remains part of Hito. If retained, create a separate bounded
item for a minimal nontechnical review instruction file; if not retained, separately reconcile the
global policy reference. No conclusion is authorized by this audit alone.

### Recommended Owner

PRODUCT. `agents/product.agent.md` explicitly permits Product to edit authorized role Markdown;
PRODUCT also owns the Running Coach product/role decision and must obtain Ivan's confirmation before
starting the new amendment task. No implementation was dispatched from this audit.

## Proposed Follow-Up Handoff — Not Dispatched

```text
ROLE: PRODUCT

Mode: Tracked
Stage: minimal canonical role-instruction alignment

Create and execute one separate canonical amendment item using this completed audit as evidence:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-role-instruction-and-inter-role-handoff-alignment-audit.md`

Ivan has not authorized this follow-up merely by authorizing the audit. Preserve the current Product
communication order and obtain his explicit current-discussion confirmation before starting unless
he directly says to send/start/run it.

After authorization, update only these existing role-file seams:
- `agents/product.agent.md` — replace the autonomous approved-plan dispatch sentence with the exact
  `AGENTS.md` confirmation rule and Russian status-before-prompt order;
- `agents/backlog-manager.agent.md` — remove `importer metadata` and the universal bug-only Lite
  shape; defer to the common Lite/Tracked retained-item contract;
- `agents/copy.agent.md` and `agents/system-advisor.agent.md` — remove their Product-only
  `hito-prompt-handoff` instructions and return owner recommendations to PRODUCT;
- `agents/integration-manager.agent.md` — retain provider-side contract/configuration, secrets,
  external authorization, and rollback coordination, but route all repository auth, callback,
  webhook, ingestion, schema, and persistence implementation through PRODUCT to BACKEND;
- `agents/layout.agent.md` — make the role read-only for geometry/responsive diagnosis and
  implementation specification; route production markup/style work through PRODUCT to one exact
  FRONTEND lane or DESIGN SYSTEM.

Do not edit `AGENTS.md`, skills, runtime source, validators, fixtures, generated output, Git state,
or hosted services. Do not create a role, tracker, dashboard, compatibility path, or process layer.
Do not create a Running Coach role file in this slice; record a separate Product decision first.

Validate exact six-file scope, Prettier, `git diff --check`, removal of the three dispatch/intake
contradictions, and elimination of Layout/Integration duplicate production ownership. Update the
new canonical amendment item with an English Tracked receipt. Do not claim runtime, QA, release, or
production acceptance.
```

## Validation Inventory

| Check                 | Scenario / environment                                      | Result | Evidence                                                                                                        |
| --------------------- | ----------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Canonical policy read | Complete `AGENTS.md`                                        | Passed | Controlling loop, role boundaries, Product dispatch, subagents, validation, backlog, and reporting read in full |
| Parent decision read  | Complete parent policy item                                 | Passed | Approved ownership, autonomy, handoff, freeze, pilot, and implementation context read in full                   |
| Role-file coverage    | All `agents/*.agent.md` files                               | Passed | 14 of 14 files classified; counts reconcile to 8 aligned + 6 minimal amendments + 0 insufficient                |
| Exception evidence    | Conflicting/obsolete source lines versus controlling policy | Passed | Six existing role-file amendments are tied to exact sections; preferences are separated explicitly              |
| Interaction contract  | Required roles and three Frontend lanes                     | Passed | Authoritative input, self-owned work, Product return, bounded assistance, and first recipient recorded          |
| Walkthrough coverage  | Defect, Frontend/Backend, shared DS, independent QA         | Passed | Four plain-language sequences preserve one writer and Product dispatch                                          |
| Follow-up scope       | Amendment map and proposed prompt                           | Passed | Six existing files only; Running Coach held for separate decision; no implementation dispatched                 |
| Markdown formatting   | Canonical item only                                         | Passed | Prettier check passed                                                                                           |
| Diff hygiene          | Direct trailing-whitespace scan and no-index diff check     | Passed | No whitespace or diff-hygiene error                                                                             |
| Read-only boundary    | Role directory and file-scoped status                       | Passed | No `agents/*.agent.md` diff; this canonical item is the only task-owned write                                   |

## Omitted Checks And Consequences

- Browser, build, database, local runtime, hosted, provider, Git release, and deployment checks were
  not run because this is a role-instruction source audit. No runtime, visual, Global QA, release,
  hosted-parity, deployment, or production claim is made.
- No subagent review was used because the complete controlling policy and role files supplied the
  discriminator directly; adding a reviewer would not resolve the Product decision for Running
  Coach.
- No role amendment was implemented. Until a separate authorized follow-up completes, `AGENTS.md`
  controls every conflict by precedence; Product must not rely on the six lower-precedence lines.

## Next Recommended Role

PRODUCT — explain the six-file amendment map and the separate Running Coach decision to Ivan, then
wait for explicit current-discussion authorization before starting the proposed follow-up.

## Blockers

None for audit closure. Role-file implementation is intentionally not authorized in this task.
RUNNING COACH dispatch eligibility remains blocked by the missing Product decision and missing
canonical role file.

## Tracked Architecture Audit Receipt — 2026-08-12

- **Task / stage:** role-instruction and inter-role handoff alignment; completed read-only Tracked
  architecture audit.
- **Product answer:** not every personal instruction needs amendment. Eight canonical files are
  sufficient with the global policy; six require small source-backed corrections. Roles collaborate
  through one Product-dispatched owner at a time, with bounded read-only named-role assistance and
  every production boundary returning first to PRODUCT.
- **Root cause:** six lower-precedence role instructions retained obsolete dispatch/intake or
  overlapping production-owner language after the global workflow became authoritative.
- **Files changed:** this canonical item only.
- **Preserved boundaries:** all policy, role, skill, runtime, generated, fixture, local-runtime, Git,
  provider, and hosted surfaces remained read-only.
- **Implementation:** not performed and not dispatched. The proposed follow-up remains subject to
  Ivan's explicit confirmation.
- **Focused proof:** 14/14 inventory reconciliation, Prettier, direct trailing-whitespace scan, and
  no-index diff hygiene passed.
- **Next owner:** PRODUCT.
- **Acceptance boundary:** source-audit DoD only; no implementation, browser, build, runtime, Global
  QA, release, hosted, deployment, or production acceptance.
- **Role / skill:** `agents/architect.agent.md`;
  `skills/hito-architecture-audit/SKILL.md`.
- **Subagents:** none.
