# Hito Source-Size Governance And Cleanup Plan

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Run a domain-based deletion-first cleanup audit and select one implementation batch.

## Stage

ARCHITECT audit / service-domain cleanup ranking.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Run a domain-based deletion-first cleanup audit and select one implementation batch.

Stage:
ARCHITECT audit / service-domain cleanup ranking.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md

Context:
Hito has one canonical service-domain ownership map in:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-functional-map.md

Product wants one larger cleanup pass, but not another chain of isolated microfixes. The next cleanup
must start from service domains, not recent files or raw hotspots.

Root cause:
Visible symptom: cleanup keeps following recent hotspots or single-file pressure.
Likely underlying cause: agents need an explicit domain-to-owner map before ranking deletion/reuse
candidates.
Canonical owner: ARCHITECT source-of-truth and cleanup selection first; implementation begins only
after one owner/risk/validation batch is selected.

Scope:
1. Read AGENTS.md, agents/architect.agent.md, hito-architecture-audit, hito-plan-writing-and-closeout,
   this plan, docs/current-product.md, docs/current-functional-map.md, docs/current-system.md, and
   docs/current-state.md.
2. Use read-only subagents for independent domain scans:
   - BACKEND/source ownership and duplicate/seam audit;
   - FRONTEND/Hito DS route/component/local-devtool ownership audit;
   - QA/DEVTOOLS validators/scripts/artifact hygiene audit;
   - PRODUCT/docs source-of-truth drift audit.
3. Rank service domains from the current-functional-map table by deletion/reuse/consolidation
   opportunity, source-size impact, product risk, owner clarity, and validation story.
4. Select exactly one cleanup implementation batch, or hold if no domain has a safe net-reduction
   batch.
5. The selected batch must name owner, files/roots, expected net LOC or source-truth reduction,
   validation, and stop conditions.
6. Do not implement cleanup code in this ARCHITECT audit.

Validation:
- Use read-only source/import/docs scans.
- Run `git status --short`.
- Do not run browser QA.
- Do not run `npm run metrics:lines` unless the audit explicitly needs a new ledger snapshot; if run,
  report that it mutates the ledger.
- If docs are edited, run scoped `git diff --check`.

Stop conditions:
- Stop if a candidate requires product behavior decisions, Supabase/schema/data mutation, live
  OpenAI/provider calls, destructive QA artifact cleanup, or broad cross-domain rewrite.
- Stop if cleanup would weaken accepted local inspector boundaries: local-only, no live UI mutation,
  no backend/Admin/Supabase/Work Items persistence.
- Stop if the best available change is only cosmetic file splitting without deletion/reuse/
  consolidation value.
```

## Domain-Based Cleanup Anchor - 2026-07-09

Current cleanup track: service-domain deletion-first cleanup.

The next pass must use the service-domain ownership map in `docs/current-functional-map.md`, rank
candidate domains with read-only subagents, and select one cleanup implementation batch at a time.
Implementation must not begin until ARCHITECT picks a domain, owner, risk class, validation story,
and expected net reduction or source-truth simplification.

This anchor intentionally prevents microfix drift: do not select work solely because a file is recent
or large. Prefer deletion, reuse, consolidation, or docs compression with real net reduction.
Preserve the accepted local inspector boundary: local-only prompt generation, no live UI mutation,
no backend/Admin/Supabase/Work Items persistence.

## Inline Editable Pattern Closeout - 2026-07-07

The generated-plan workout-document readback polish and shared Hito inline editable text pattern are
QA-accepted under the running-plan plan. The design/front-end pattern gate is complete: manual
constructor titles use shared inline editing, generated workout readback remains read-only, and
local inspector task targeting stays local-only with no fake Admin Capture persistence. The current
cleanup entrypoint is now the domain-based cleanup anchor above; the prior backend
content-editability concern remains a product/design blocker only if selected by the domain audit or
by a separate product gate.

## Backend Implementation - 2026-07-02 - Generated-Plan Legacy Purge

Status: accepted after backend/source validation, browser/readback QA, and post-acceptance cleanup.

Backend removed the pre-customer legacy generated-plan/preset stack instead of preserving obsolete
compatibility for hypothetical future users. The accepted product truth is now one distance-goal
AI-authored dated preview/review/confirm path. Preset cards are UI shortcuts into
`planGoalIntent.distanceMeters`, not backend Plan Preset programs or deterministic product builders.

Removed current runtime/proof owners include:

- deterministic generated-plan product builders under `src/lib/plan-creation-engine/*-builder.ts`;
- backend `Marathon Base` / `base_endpoint_marker` generated-plan identity/readback residue;
- backend Plan Preset discovery/actions and `src/lib/plan-presets/*`;
- old Plan Preset validator/proof helpers and generated-plan scenario builders;
- obsolete `plan_preset_v1` / deterministic builder editability fixtures;
- finalized-runtime copy support for deleted Plan Preset CSVs.

Fresh source-size checkpoint after backend purge:

- maintained size: `202,501` lines / `649` files;
- product source: `120,312` lines / `325` files;
- scripts: `37,516` lines / `69` files;
- product active-decomposition candidates: `1`;
- script active-decomposition candidates: `0`;
- active markdown compression candidates: `0`;
- dirty worktree: `99` total, `69` tracked modified, `30` tracked deleted, `0` untracked.

Source-size effect versus the pre-purge baseline:

- maintained lines: net about `-14,324`;
- product source: net about `-6,011`;
- scripts: net about `-8,370`;
- maintained files: net `-27`.

Validation passed in the backend slice:

- `node --import tsx ./scripts/validate-plan-goal-intent-contract.ts`;
- `node --import tsx ./scripts/validate-ai-generated-running-plan-creation.ts`;
- `node --import tsx ./scripts/validate-planned-workout-language.ts`;
- `npm run validate-manual-workout-authoring`;
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`;
- targeted ESLint for touched source/script files;
- `npm run build`;
- `npm run metrics:lines`.

Source scan after cleanup found no current `src/` or `scripts/` references for `Marathon Base`,
`marathon_base`, `base_endpoint_marker`, `plan_preset`, `running_plan_engine_*_builder`,
`VoiceToPlan`, or `voice_to_plan`.

QA accepted generated-plan creation/readback for 10K, 21.1K, 42.195K, and Custom 15K, including
manual authoring smoke and legacy-truth absence.

## Source-Size Checkpoint - 2026-07-07 - Generated-Plan Validator Cleanup

Status: accepted; next gate is product/design, not another backend cleanup.

Post-acceptance cleanup reduced `scripts/validate-ai-generated-running-plan-creation.ts` from
`2651` to `1370` lines and extracted repeated proof helpers into tracked
`scripts/ai-generated-running-plan-proof-helpers.ts` (`1330` lines). The extracted helper is
intentional indexed source, not an untracked residue blocker.

Fresh source-size snapshot:

- maintained size: `207,579` lines / `653` files;
- product source: `123,143` lines / `328` files;
- scripts: `39,762` lines / `70` files;
- product active-decomposition candidates: `1`;
- script active-decomposition candidates: `0`;
- active markdown compression candidates: `0`;
- dirty worktree: `44` total, `39` tracked modified, `5` tracked added, `1` tracked deleted,
  `0` untracked.

Accepted behavior preserved: W1-W4 conservative adaptation, selected-distance endpoint exactness,
child-first repeats, no fake executable pace/HR, no parent repeat targets, no `repeat_unit` /
`recovery_unit`, impossible/aggressive typed outcomes, review/confirm exactness, and manual
authoring smoke.

Accepted QA artifact:

`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-07-06/generated-plan-early-phase-dosing-qa/`

## Context

Hito has grown past the point where source-size cleanup can stay ad hoc. The current rough snapshot,
excluding `node_modules`, `qa-artifacts`, `logs`, build/cache output, `.local-artifact-archive`,
lockfiles, and generated `routeTree` output:

| Group | Rough size |
| --- | ---: |
| Maintained lines | about `234,669` |
| Product source | about `131,660` |
| Scripts | about `44,726` |
| Current docs/tasks/plans | about `43,164` |
| Archive docs | about `6,247` |
| Product files over `1500` lines | `13` |
| Product files over `1000` lines | `28` |
| Product files over `700` lines | `58` |

This baseline is intentionally labelled rough. Slice 1 must create the canonical reporter and first
ledger snapshot before any decomposition batch is selected.

## Problem Definition

Visible symptom: many oversized files and growing Markdown/script/product LOC make review, routing,
and real-user readiness slower.

Underlying cause: Hito has no recurring line-count ledger, active plans have accumulated historical
execution logs, validators/scripts have grown without extraction, and decomposition thresholds are not
fed back into batch selection.

Canonical owner: Architecture owns sequencing and source-of-truth. Backend/Devtools owns line-count
and reporting tooling. Frontend owns UI/DS/component decomposition. QA validates behavior when UI or
runtime behavior changes.

## Governance Loop

Every source-size cleanup checkpoint should produce:

- a source-size snapshot with the same exclusions;
- per-group line totals;
- oversized-file counts for `700+`, `1000+`, and `1500+` lines;
- active Markdown over `2000` lines;
- dirty-worktree counts separated from source-size findings;
- delta from the previous snapshot;
- one selected next batch or an explicit hold.

Threshold policy:

| Threshold | Meaning | Default action |
| --- | --- | --- |
| `700+` lines | watch | avoid adding unrelated responsibility; consider extraction if touched |
| `1000+` lines | refactor candidate | require owner justification before substantial growth |
| `1500+` lines | active decomposition candidate | select a decomposition batch unless generated/data fixture or explicitly consolidated |
| active `.md` over `2000` lines | docs compression candidate | compress or split history from current truth when safe |

Net source-size reduction rule:

- Prefer deletion, reuse, consolidation, or in-place docs compression with expected net LOC reduction.
- Do not select a batch whose only success condition is "file below `1500`."
- Behavior-preserving decomposition remains allowed when reviewability is the root cause, but after
  the manual workout authoring UI decomposition it should not be the default next cleanup train.
- If a code cleanup cannot safely promise net reduction, prefer a docs/source-of-truth compression
  batch or hold rather than selecting another cosmetic split.

## Cleanup Lanes

| Lane | Owner | Scope | First signal |
| --- | --- | --- | --- |
| A. Line-count tooling and ledger | BACKEND/DEVTOOLS | non-mutating reporter, snapshot ledger, dirty-tree counts | no canonical source-size baseline |
| B. Active docs/plans compression | ARCHITECT | compact active plans, preserve current truth and handoff metadata | active Markdown over `2000` lines |
| C. CSS / Hito DS decomposition | FRONTEND / Hito DS | split `src/styles.css` by real DS ownership seams | style file remains an oversized mixed owner |
| D. Hito DS route/specimen decomposition | FRONTEND / Hito DS | split `src/routes/hitoDS.tsx` into specimen/component owners | route has become a spec/workbench hotspot |
| E. Manual constructor/calendar UI decomposition | FRONTEND | extract focused rendering/hooks/components from oversized UI surfaces | manual/calendar files cross `1000/1500` thresholds |
| F. Generated-plan/backend AI/review decomposition | BACKEND | split backend plan generation/review/AI modules by contract ownership | backend modules accumulate generation, review, proof, and compatibility logic |
| G. Validators/scripts extraction | BACKEND/DEVTOOLS | dedupe proof helpers and split validator clusters | scripts grow as shadow implementation |
| H. Obsolete fixtures, local artifact residue, stale legacy paths | BACKEND/DEVTOOLS or ARCHITECT | delete/archive only with manifest and owner proof | stale generated/vendor/fixture residue is source-size noise |

## Autonomous Execution Protocol

The user must not become a copy-paste operator between roles.

1. ARCHITECT selects one coherent cleanup batch with one owner, one risk class, and one validation story.
2. The assigned owner executes the batch and uses/reuses subagents for read-only source audit,
   architecture review, QA proof, and validator checks when useful.
3. The parent owner integrates subagent findings, fixes validation failures inside scope, and returns
   one coherent result.
4. Routine Backend -> QA -> Backend or Frontend -> QA loops should be delegated by the parent role
   when tools are available; the user should only see integrated pass/fail/blocker or a Product
   decision request.
5. ARCHITECT closes source-of-truth after accepted batches and selects the next batch from the latest
   ledger, not from momentum.

## Batch Rules

Every cleanup batch must have:

- one owner;
- one risk class;
- one validation story;
- no broad rewrite;
- behavior-preserving decomposition unless the active scope explicitly allows behavior change;
- deletion/extraction before new abstraction;
- explicit stop conditions;
- a source-size snapshot before and after when the reporter exists.

Do not select a batch that crosses unrelated backend/frontend/docs/artifact/runtime owners just
because several files are large.

## Validation Protocol

After every batch, run the narrowest validation that proves the affected owner:

- source-size report and ledger update;
- scoped `git diff --check`;
- targeted lint/type/build where relevant;
- existing domain validators for backend/generated-plan/manual/DS/script changes;
- browser QA only when UI behavior changes;
- no browser QA for docs-only or non-runtime tooling-only changes unless a doc contradicts current
  behavior;
- final report with LOC delta by group and oversized-file count delta.

## Risks And Stop Conditions

Stop before:

- schema migration or production data mutation;
- destructive file deletion outside generated/obsolete artifacts without manifest proof;
- paid provider calls or live OpenAI calls;
- behavior changes not covered by validation;
- changes that weaken review/confirm, auth, persistence, metric truth, provider evidence, or QA
  cleanup boundaries;
- cleanup that crosses unrelated owners or becomes a broad rewrite.

## First Execution Batch

Select Lane A first: BACKEND/DEVTOOLS source-size line-count tooling and ledger.

Rationale:

- it creates the measurement loop needed for every later batch;
- it is non-runtime and behavior-preserving;
- it separates dirty-worktree residue from source-size facts;
- it lets later ARCHITECT checkpoints choose bolder decomposition batches from evidence.

Acceptance criteria:

- command exists and runs locally without mutating source/artifacts;
- exclusions are explicit and stable;
- grouped LOC totals and oversized thresholds are reported;
- dirty-worktree counts are reported separately;
- first ledger entry exists;
- dashboard points to the next role;
- no product runtime behavior changes.

## Architecture Checkpoint - 2026-06-30

Lane A is accepted. `npm run metrics:lines` produced a stable canonical report and appended the
line-count ledger under `docs/metrics/line-count-ledger.jsonl`.

Accepted baseline from the latest validation snapshot:

- maintained size: `233,083` lines / `637` files;
- product source: `131,348` lines / `316` files;
- scripts: `45,310` lines / `66` files;
- current docs/tasks/plans markdown: `43,256` lines / `132` files;
- product oversized counts: `57` files over `700`, `28` over `1000`, `13` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `5` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts are reported separately from maintained source-size facts.

First cleanup execution batch selected: Lane D, FRONTEND / Hito DS route decomposition for
`src/routes/hitoDS.tsx`.

Why this batch is first:

- `src/routes/hitoDS.tsx` is `4,944` lines and the largest non-global product source hotspot after
  `src/styles.css`;
- it is an internal Hito DS reference route with one clear FRONTEND/Hito DS owner;
- it already has extracted neighbors in `src/components/hito-ds/*`, so the first fix can reuse
  existing seams instead of creating a new framework;
- it reduces review complexity without touching active backend plan-generation, manual constructor,
  calendar lifecycle, Supabase, OpenAI, or global CSS behavior;
- validation has one coherent story: the `/hitoDS` reference pages still render and the route source
  drops below the active-decomposition threshold, or the executor reports the precise remaining seam.

Not selected yet:

- `src/styles.css`: larger, but global visual risk is higher; split after a safer DS route
  decomposition proves the workflow.
- manual constructor/calendar UI files: active product flows, higher regression risk while real-user
  readiness work is still moving.
- backend generated-plan/review modules: active product-truth modules; select after current
  plan-generation gates settle.
- active plan markdown compression: valid, but it should not be the first post-tooling execution
  batch because code review complexity is the sharper blocker now.
- oversized validators/scripts: useful later, but lower immediate product-review leverage than the
  Hito DS route split.

## Architecture Checkpoint - 2026-07-01

Lane D is accepted. FRONTEND decomposed `src/routes/hitoDS.tsx` from about `4,944` lines to `24`
lines while preserving the public route facade, sibling route imports, Hito DS route IA, visual
language, tokens, backend/product behavior, artifacts, and generated output. Reported browser proof
passed for `/hitoDS`, `/hitoDS/foundations`, `/hitoDS/components`, and `/hitoDS/patterns` at
desktop `1280` and exact `375px`.

Fresh post-closeout `npm run metrics:lines` snapshot:

- maintained size: `233,121` lines / `647` files;
- product source: `131,272` lines / `326` files;
- scripts: `45,310` lines / `66` files;
- current docs/tasks/plans markdown: `43,370` lines / `132` files;
- product oversized counts: `58` files over `700`, `29` over `1000`, `12` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `170` total, `130` tracked modified, `3` tracked deleted,
  `37` untracked.

Lane D source-size effect:

- `src/routes/hitoDS.tsx`: about `4,944` lines -> `24` lines;
- `productActiveDecomposition1500`: `13` -> `12`;
- maintained files increased because the route was split into focused Hito DS owners;
- maintained product lines decreased; this closeout adds compact docs lines, so Lane D should be
  counted as a reviewability win rather than a raw LOC compression batch.

Next cleanup execution batch selected: Lane C, FRONTEND / Hito DS CSS ownership decomposition for
`src/styles.css`.

Why this batch is next:

- `src/styles.css` is now the largest product source hotspot at `6,286` lines;
- the file mixes theme/base tokens, workout/section color roles, controls/forms/tabs/menus,
  shell/admin/data-table surfaces, and chart/status/calendar/navigation recipes in one global facade;
- it has one owner and risk class: behavior-preserving FRONTEND/Hito DS stylesheet decomposition;
- it has one validation story: preserve CSS import order and visual behavior, then prove Hito DS and
  representative product/admin surfaces still render cleanly.

Not selected now:

- extracted Hito DS reference files: `reference-foundations-page.tsx` (`1,478`) and
  `reference-components-controls.tsx` (`1,431`) are near the threshold but still below active
  decomposition; splitting them next would be lower-leverage micro-work.
- active plan markdown compression: material, but it is a different owner/risk class and should not
  be bundled with code decomposition.
- manual constructor/calendar/admin/backend hotspots: valid future candidates, but they touch active
  product flows or backend generation paths and are higher-risk than CSS ownership extraction.
- scripts/validators: useful later, but less urgent than the top product source hotspot.

## Architecture Checkpoint - 2026-07-01 - Post-CSS

Lane C is accepted. FRONTEND reduced `src/styles.css` from `6,286` lines to `11` lines while keeping
it as the public stylesheet facade/import point. Previous CSS content now lives under focused
`src/styles/*` owners; the largest extracted owner is `src/styles/foundations.css` at `1,182` lines,
below the `1500` active-decomposition threshold. Reported browser proof passed for `/hitoDS`,
`/hitoDS/foundations`, `/hitoDS/components`, `/hitoDS/patterns`, `/`, `/settings`,
`/admin/analytics?section=users`, and `/admin/capture` at desktop and exact `375px`; admin routes
were auth-gated, so the verified surface there was the admin login shell.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `233,191` lines / `655` files;
- product source: `131,285` lines / `334` files;
- scripts: `45,310` lines / `66` files;
- current docs/tasks/plans markdown: `43,427` lines / `132` files;
- product oversized counts: `62` files over `700`, `29` over `1000`, `11` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `178` total, `130` tracked modified, `3` tracked deleted,
  `45` untracked.

Lane C source-size effect:

- `src/styles.css`: `6,286` lines -> `11` lines;
- `productActiveDecomposition1500`: `12` -> `11`;
- maintained files increased by `8` and maintained lines increased by `13` because of facade/import
  wrappers; count Lane C as a reviewability/ownership win, not a raw LOC compression win.

Next cleanup execution batch selected: FRONTEND / admin route decomposition for
`src/routes/admin.analytics.tsx` and `src/routes/admin.capture.tsx`.

Why this batch is next:

- after CSS, the largest product source hotspot is `src/data/training-plan.json` (`2,501`), but it
  is the active signed-out preview data fixture and not a mixed-responsibility route module;
- `src/routes/admin.analytics.tsx` (`2,113`) and `src/routes/admin.capture.tsx` (`1,936`) are the
  next largest code hotspots and share one owner: FRONTEND admin UI;
- both files mix route orchestration with presentational sections, table/detail anatomy, filters,
  mutation handlers, and helper/view-model logic that can move into existing `src/components/admin/*`
  seams without backend or product behavior changes;
- validation has one coherent story: admin analytics/capture routes still render or auth-gate
  correctly at desktop and exact `375px`, and the route files drop below the active-decomposition
  threshold or report the precise remaining seam.

Not selected now:

- `src/data/training-plan.json`: current signed-out preview data fixture; cleanup needs a separate
  preview-data/import policy before deletion, minification, or replacement.
- manual constructor/calendar UI decomposition: valid but runner-facing and higher regression risk
  while admin route extraction is a cleaner internal route cleanup.
- backend generated-plan/review module decomposition: valid later, but it touches plan-generation
  product truth and should not be mixed with frontend route decomposition.
- scripts/validator extraction: useful later, but lower immediate product-source review leverage than
  two oversized admin route modules.
- active docs/plans compression: material but a different ARCHITECT/docs risk class; do not bundle
  with runtime source decomposition.

## Architecture Checkpoint - 2026-07-01 - Post-Admin Routes

Admin route decomposition is accepted. FRONTEND reduced `src/routes/admin.analytics.tsx` from
`2,113` lines to `1,104` lines and `src/routes/admin.capture.tsx` from `1,936` lines to `1,412`
lines. Both route files are now below the `1500` active-decomposition threshold. New focused admin
owners live under `src/components/admin/*`, including analytics panels, summary sections, formatting,
and view-model helpers. Reported validation passed targeted ESLint, `npm run build`,
`npm run validate-admin-capture-backlog`, `git diff --check`, managed QA server restart/status, and
browser proof for `/admin/analytics?section=users`, `/admin/analytics?section=test-accounts`, and
`/admin/capture` at desktop `1280` and exact `375px`; admin routes correctly auth-gated to
`/admin/login` without horizontal overflow or console warnings/errors.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `233,391` lines / `660` files;
- product source: `131,419` lines / `339` files;
- scripts: `45,310` lines / `66` files;
- current docs/tasks/plans markdown: `43,493` lines / `132` files;
- product oversized counts: `62` files over `700`, `29` over `1000`, `9` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `185` total, `132` tracked modified, `3` tracked deleted,
  `50` untracked.

Admin route source-size effect:

- `src/routes/admin.analytics.tsx`: `2,113` -> `1,104`;
- `src/routes/admin.capture.tsx`: `1,936` -> `1,412`;
- `productActiveDecomposition1500`: `11` -> `9`;
- maintained files increased by `5` and maintained lines increased by `134`, so this is a
  reviewability/ownership win rather than a raw LOC compression win.

Next cleanup execution batch selected: BACKEND/DEVTOOLS decomposition of
`scripts/report-local-artifact-hygiene.mjs`.

Why this batch is next:

- `src/data/training-plan.json` remains the largest product source file at `2,501` lines, but it is
  the active signed-out preview data fixture and needs a separate preview-data/import policy before
  deletion, minification, or replacement.
- manual constructor/calendar UI is the next strong product-source candidate, and the read-only
  explorer recommended it, but it is runner-facing medium/high risk and should not be mixed into a
  source-size checkpoint immediately after admin route work while manual/product readiness remains
  active.
- `scripts/report-local-artifact-hygiene.mjs` is the largest script hotspot at `2,705` lines, has
  one BACKEND/DEVTOOLS owner, one risk class, and one non-mutating validation story.
- the artifact reporter has clear internal seams: option parsing, target scanning, manifests,
  QA-folder classification, archive/quarantine support, compression estimate/apply-safety helpers,
  rollback manifests, and report formatting.

Not selected now:

- `src/data/training-plan.json`: policy-first fixture/data decision required.
- manual constructor/calendar UI decomposition: valid next product-source candidate, but defer until
  runner-facing active work can absorb broader browser/manual-authoring QA.
- backend generated-plan/review modules: valid later, but they touch plan-generation product truth
  and have active dirty diffs.
- active docs/plans compression: separate ARCHITECT/docs lane; do not bundle with code/tooling
  decomposition.

## Architecture Checkpoint - 2026-07-01 - Post-Artifact Reporter

Artifact hygiene reporter decomposition is accepted. BACKEND/DEVTOOLS reduced
`scripts/report-local-artifact-hygiene.mjs` from `2,705` lines to `163` lines while preserving it as
the canonical `npm run artifact:hygiene` CLI entrypoint. Focused helpers now live under
`scripts/artifact-hygiene/*`; the largest helper is `scripts/artifact-hygiene/qa-image-compression.mjs`
at `1,252` lines, below the `1500` active-decomposition threshold. Reported validation covered
metrics before/after, `node --check`, targeted ESLint, all required non-mutating
`artifact:hygiene` modes, an extra no-apply E4 estimate, scoped `git diff --check`, and new-file
whitespace checks.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `233,535` lines / `667` files;
- product source: `131,419` lines / `339` files;
- scripts: `45,403` lines / `73` files;
- current docs/tasks/plans markdown: `43,544` lines / `132` files;
- product oversized counts: `62` files over `700`, `29` over `1000`, `9` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `4` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `193` total, `133` tracked modified, `3` tracked deleted,
  `57` untracked.

Artifact reporter source-size effect:

- `scripts/report-local-artifact-hygiene.mjs`: `2,705` -> `163`;
- `scriptActiveDecomposition1500`: `5` -> `4`;
- maintained files increased by `7` and maintained lines increased by `93`, so this is a
  reviewability/ownership win rather than a raw LOC compression win.

Next cleanup execution batch selected: BACKEND/DEVTOOLS decomposition of
`scripts/manual-workout-authoring/move-proof.ts`.

Why this batch is next:

- `scripts/manual-workout-authoring/move-proof.ts` is now the largest script hotspot at `2,223`
  lines;
- it shares the same non-runtime tooling risk class as the accepted reporter split: proof-script
  ownership, not product behavior;
- it has one clear validation story through `npm run validate-manual-workout-authoring`;
- it avoids changing runner-facing manual constructor/calendar UI while those product surfaces remain
  active and higher regression risk;
- it avoids plan-generation truth modules and Admin importer semantics, which are valid future
  candidates but higher-risk than proof-tooling decomposition.

Not selected now:

- `src/data/training-plan.json`: active signed-out preview fixture; needs fixture/import policy before
  source-size cleanup.
- manual constructor/calendar UI decomposition: material but runner-facing and should be selected
  with browser/manual-authoring QA scope, not bundled into this devtools cleanup checkpoint.
- `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts` and
  `scripts/validate-running-plan-engine-confirm.ts`: plan-generation truth/proof scripts; defer until
  the next running-plan source-size lane is explicitly selected.
- `scripts/import-repo-work-items-to-admin-backlog.ts`: Admin importer semantics and metadata safety
  make it a separate Admin/devtools lane.
- active docs/plans compression: material but a separate ARCHITECT/docs risk class.

## Architecture Checkpoint - 2026-07-01 - Post-Move Proof

Manual-workout move proof decomposition is accepted. BACKEND/DEVTOOLS reduced
`scripts/manual-workout-authoring/move-proof.ts` from `2,223` lines to `1,367` lines while
preserving the public `validateManualMoveWorkoutContract()` proof entrypoint. New focused helpers
are `scripts/manual-workout-authoring/move-proof-assertions.ts`,
`scripts/manual-workout-authoring/move-proof-fixtures.ts`, and
`scripts/manual-workout-authoring/move-proof-missed-scenarios.ts`. Reported validation passed
targeted ESLint, import smoke, direct move-contract proof, `npm run validate-manual-workout-authoring`,
`npm run metrics:lines` before/after, scoped `git diff --check`, and new-file whitespace checks.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `233,700` lines / `670` files;
- product source: `131,419` lines / `339` files;
- scripts: `45,511` lines / `76` files;
- current docs/tasks/plans markdown: `43,601` lines / `132` files;
- product oversized counts: `62` files over `700`, `29` over `1000`, `9` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `3` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `196` total, `133` tracked modified, `3` tracked deleted,
  `60` untracked.

Move proof source-size effect:

- `scripts/manual-workout-authoring/move-proof.ts`: `2,223` -> `1,367`;
- `scriptActiveDecomposition1500`: `4` -> `3`;
- maintained files increased by `3` and maintained lines increased by `108`, so this is a
  reviewability/ownership win rather than a raw LOC compression win.

Next cleanup execution batch selected: BACKEND/DEVTOOLS decomposition of
`scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts`.

Why this batch is next:

- `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts` is now the largest script
  hotspot at `1,804` lines;
- it is proof/doctrine tooling, not live runtime behavior, and can be validated through the existing
  plan-authoring doctrine validator;
- it is safer than `scripts/import-repo-work-items-to-admin-backlog.ts`, whose metadata/importer
  semantics are a separate Admin/devtools lane;
- it is safer than `scripts/validate-running-plan-engine-confirm.ts`, which includes disposable
  persistence and remote-mutation safety boundaries;
- it keeps the cleanup track reducing oversized proof/tooling files while deferring runner-facing
  product UI and fixture-policy decisions.

Not selected now:

- `scripts/import-repo-work-items-to-admin-backlog.ts`: still `1,798` lines, but importer metadata
  safety makes it a separate Admin/devtools batch.
- `scripts/validate-running-plan-engine-confirm.ts`: still `1,792` lines, but it owns confirm,
  disposable cleanup, and remote mutation guardrails; select only with explicit persistence-safety
  validation.
- product-source hotspots: material, but `src/data/training-plan.json` needs fixture policy and
  manual/calendar UI needs a dedicated browser QA scope.
- active docs/plans compression: material but a separate ARCHITECT/docs risk class.

## Architecture Checkpoint - 2026-07-01 - Post-AI Blueprint Proof

AI-first plan blueprint proof decomposition is accepted. BACKEND/DEVTOOLS reduced
`scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts` from `1,804` lines to `1,269`
lines while preserving plan-authoring doctrine validation meaning. The new focused helper is
`scripts/plan-authoring-doctrine/ai-first-plan-blueprint-fixtures.ts` at `550` lines. Reported
validation passed targeted ESLint, `node --check`, import smoke,
`node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`, `npm run metrics:lines`
before/after, `git diff --check`, and new-file whitespace checks. BACKEND/DEVTOOLS used and closed
Boyle and Volta for proof-seam inventory and validation-risk review.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `233,768` lines / `671` files;
- product source: `131,419` lines / `339` files;
- scripts: `45,526` lines / `77` files;
- current docs/tasks/plans markdown: `43,654` lines / `132` files;
- product oversized counts: `62` files over `700`, `29` over `1000`, `9` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `2` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `197` total, `133` tracked modified, `3` tracked deleted,
  `61` untracked.

AI blueprint proof source-size effect:

- `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts`: `1,804` -> `1,269`;
- `scriptActiveDecomposition1500`: `3` -> `2`;
- maintained files increased by `1` and maintained lines increased by `15`, so this is a
  reviewability/ownership win rather than a raw LOC compression win.

Next cleanup execution batch selected: BACKEND/DEVTOOLS decomposition of
`scripts/import-repo-work-items-to-admin-backlog.ts`.

Why this batch is next:

- `scripts/import-repo-work-items-to-admin-backlog.ts` is now the largest script hotspot at `1,798`
  lines;
- it has one owner and risk class: Admin repo-derived work-item importer tooling;
- it has one non-mutating validation story through importer dry-run plus Admin backlog validator;
- it is safer than `scripts/validate-running-plan-engine-confirm.ts`, which includes confirm,
  disposable cleanup, and remote mutation guardrails;
- it keeps product runtime, schemas, logs, QA artifacts, and frontend UI out of scope.

Not selected now:

- `scripts/validate-running-plan-engine-confirm.ts`: still `1,792` lines, but it should wait for a
  persistence-safety-focused source-size gate.
- product-source hotspots: material, but `src/data/training-plan.json` needs fixture policy and
  manual/calendar UI needs browser/manual-authoring QA scope.
- active docs/plans compression: material but a separate ARCHITECT/docs risk class.

## Architecture Checkpoint - 2026-07-01 - Post-Admin Importer

Repo work-item Admin importer decomposition is accepted. BACKEND/DEVTOOLS reduced
`scripts/import-repo-work-items-to-admin-backlog.ts` from `1,798` lines to `1,182` lines while
preserving importer dry-run behavior, metadata rules, source roots, stale mirror reporting, and
repo-derived read-only semantics. The new focused helper is
`scripts/admin-backlog-import/markdown.ts` at `654` lines. Reported validation passed importer
dry-run with `158` eligible, `created/updated=0`, `duplicateCount=0`, `repoDerivedInReviewCount=0`,
no Supabase mutation, `npm run validate-admin-capture-backlog`, targeted lint, syntax/import smoke,
`npm run metrics:lines`, scoped `git diff --check`, and new-file whitespace checks. BACKEND/DEVTOOLS
used and closed Descartes and Euler for importer seam inventory and validation-risk review.

Fresh `npm run metrics:lines` snapshot after dashboard sync:

- maintained size: `233,854` lines / `672` files;
- product source: `131,419` lines / `339` files;
- scripts: `45,564` lines / `78` files;
- current docs/tasks/plans markdown: `43,702` lines / `132` files;
- product oversized counts: `62` files over `700`, `29` over `1000`, `9` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `1` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `199` total, `134` tracked modified, `3` tracked deleted,
  `62` untracked.

Admin importer source-size effect:

- `scripts/import-repo-work-items-to-admin-backlog.ts`: `1,798` -> `1,182`;
- `scriptActiveDecomposition1500`: `2` -> `1`;
- maintained files increased by `1` and maintained lines increased by `38`, so this is a
  reviewability/ownership win rather than a raw LOC compression win.

Next cleanup execution batch selected: BACKEND/DEVTOOLS decomposition of
`scripts/validate-running-plan-engine-confirm.ts`.

Why this batch is next:

- `scripts/validate-running-plan-engine-confirm.ts` is now the only remaining script
  active-decomposition hotspot at `1,792` lines;
- it has one owner and risk class: running-plan confirm validation tooling;
- it can stay behavior-preserving and validate through the default validator path without remote
  Supabase mutation flags;
- strict stop conditions keep product behavior, persistence safety, schemas, live OpenAI/provider
  calls, browser QA, and remote mutation outside the source-size cleanup slice.

Not selected now:

- product-source hotspots: material, but `src/data/training-plan.json` needs fixture policy and
  runner-facing manual/calendar UI needs browser/manual-authoring QA scope.
- active docs/plans compression: material but a separate ARCHITECT/docs risk class.

## Architecture Checkpoint - 2026-07-01 - Post-Review-Token Stable JSON

Running-plan review-token/stable JSON consolidation is accepted. BACKEND added
`src/lib/review-token-signing.ts` as the shared owner for stable JSON serialization, SHA256 digest,
HMAC signing, safe token comparison, and base64url UTF-8 envelope encoding. `src/lib/first-plan-actions.ts`
and `src/lib/running-plan-engine-review.ts` now reuse that helper while preserving domain wrappers,
token payloads, token prefixes, checksum shape, and separate secret policies. Reported validation
passed targeted ESLint, `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`,
`node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`,
`npm run validate-ai-generated-running-plan-creation`, `npm run build`, and scoped
`git diff --check`.

Fresh `npm run metrics:lines` snapshot after dashboard sync:

- maintained size: `233,921` lines / `676` files;
- product source: `131,378` lines / `340` files;
- scripts: `45,616` lines / `81` files;
- current docs/tasks/plans markdown: `43,758` lines / `132` files;
- product oversized counts: `62` files over `700`, `29` over `1000`, `7` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `203` total, `134` tracked modified, `3` tracked deleted,
  `66` untracked.

Review-token/stable JSON source-size effect:

- `src/lib/first-plan-actions.ts`: `1,540` -> `1,482`;
- `src/lib/running-plan-engine-review.ts`: `1,575` -> `1,483`;
- new shared helper `src/lib/review-token-signing.ts`: `109`;
- `productActiveDecomposition1500`: `9` -> `7`;
- maintained lines decreased by `41`, so this is both an ownership consolidation and a net LOC win.

Next cleanup execution batch selected: BACKEND/DEVTOOLS signed-out preview fixture cleanup for
`src/data/training-plan.json`.

Why this batch is next:

- script active-decomposition is now at `0`, so the next material source-size win is in product
  source, not script tooling;
- `src/data/training-plan.json` is the largest remaining product-source hotspot at `2,501` lines;
- current docs describe it as signed-out preview only, and source search shows a single import through
  `src/lib/training.ts`;
- this is a better root-cause cleanup than continuing to shave sub-1500 review-token files, because
  it can remove or shrink a stale checked-in data blob rather than split code cosmetically.

Not selected now:

- active-plan transition/refresh signing consolidation: adjacent conceptually, but no current source
  proof shows one shared owner and one validation story after the accepted review-token helper.
- manual constructor/calendar UI decomposition: still material, but requires frontend/browser QA and
  should not be mixed with backend fixture cleanup.
- active docs/plans compression: material but a separate ARCHITECT/docs risk class.

## Implementation Checkpoint - 2026-07-01 - Signed-Out Preview Fixture

Signed-out preview fixture cleanup is implemented. BACKEND/DEVTOOLS deleted the old
`src/data/training-plan.json` static 84-day preview blob and replaced it with compact
`src/data/signed-out-preview-plan.ts` seed data. `src/lib/training.ts` still owns
`getPreviewSnapshot()` and still returns the same backend-shaped `TrainingSnapshot` fallback for
unauthenticated preview contexts, but it now resolves one compact current-week preview from the
seed instead of importing a large stale plan fixture.

Source proof:

- `src/data/training-plan.json` had a single live source import through `src/lib/training.ts`;
- `getPreviewSnapshot()` is still reached only through unauthenticated preview fallback in
  `src/lib/training-api.ts` and shell fallback handling;
- authenticated saved mode, generated-plan creation, manual authoring, import/export, provider
  comparison, and active-plan lifecycle do not depend on the removed JSON fixture.

Source-size effect:

- removed `src/data/training-plan.json`: `2,501` lines;
- added `src/data/signed-out-preview-plan.ts`: compact seed below active-decomposition threshold;
- `src/lib/training.ts` remains the normalized preview/persisted snapshot seam.

Next step: ARCHITECT should run a fresh `npm run metrics:lines` checkpoint and select exactly one
next cleanup batch from the remaining product-source hotspots.

## Architecture Checkpoint - 2026-07-01 - Post-Signed-Out Preview Fixture QA

Signed-out preview fixture cleanup is accepted. BACKEND/DEVTOOLS removed the oversized
`src/data/training-plan.json` preview blob and replaced it with compact
`src/data/signed-out-preview-plan.ts` seed data. QA accepted the runner-facing signed-out preview on
`/progress` and `/workout/2026-07-01` at desktop and exact `375px`: no forbidden fixture/internal
strings appeared, no horizontal overflow was found, console warning/error count was `0`, and no
disposable user cleanup was needed. QA evidence:
`qa-artifacts/screenshots/2026-07-01/signed-out-preview-fixture-cleanup-qa/`.

Fresh `npm run metrics:lines` snapshot after dashboard sync:

- maintained size: `231,690` lines / `676` files;
- product source: `129,072` lines / `340` files;
- scripts: `45,616` lines / `81` files;
- current docs/tasks/plans markdown: `43,833` lines / `132` files;
- product oversized counts: `61` files over `700`, `28` over `1000`, `6` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- dirty-worktree counts remain separate: `204` total, `133` tracked modified, `4` tracked deleted,
  `67` untracked.

Signed-out preview source-size effect:

- removed `src/data/training-plan.json`: `2,501` lines;
- added `src/data/signed-out-preview-plan.ts`: `167` lines;
- maintained lines decreased from the prior checkpoint by about `2,288`;
- product source decreased from `131,378` to `129,072`;
- `productActiveDecomposition1500`: `7` -> `6`.

Next cleanup execution batch selected: BACKEND cleanup of the non-visible voice-to-plan backend seam.

Why this batch is next:

- script active-decomposition is already `0`, so product-source cleanup remains the pressure point;
- `src/lib/voice-to-plan-authoring.ts` is `1,685` lines and still an active-decomposition hotspot;
- current product/system/functional-map docs say Dictate-to-Plan / voice-to-plan is not a visible
  onboarding UI flow and has no current `OnboardingGate` caller;
- unlike frontend calendar/manual UI decomposition, this candidate can potentially delete or collapse
  a future-only backend path instead of only moving UI code into smaller files.

Not selected now:

- manual constructor/calendar UI decomposition: still material but frontend/browser-QA heavy and not
  as deletion-oriented as the voice-to-plan source proof.
- active docs/plans compression: material but a separate ARCHITECT/docs risk class.
- `src/lib/training.ts`: still large after preview fixture cleanup, but it is the current normalized
  preview/persisted readback seam and should not be split before removing clearer non-visible paths.

## Backend Checkpoint - 2026-07-01 - Voice-To-Plan Seam Retirement

Backend retired the non-visible voice-to-plan seam instead of splitting it cosmetically. Removed
current runtime/source owners include `src/lib/voice-to-plan-authoring.ts`,
`generateVoiceToPlanDraft`, `confirmVoiceToPlanDraft`, the `voice_to_plan` entitlement capability,
validator-only voice proof code, and stale onboarding form-model voice helpers. Current
source-of-truth now describes Dictate-to-Plan as retired current truth; historical changelog
classification can still render old voice/dictate release labels.

Source proof:

- no current `src/` or `scripts/` references remain for `VoiceToPlan`, `voice_to_plan`,
  `generateVoiceToPlanDraft`, `confirmVoiceToPlanDraft`, `voiceResultMessage`, or
  `buildVoiceSupplement`;
- remaining `Dictate-to-Plan` source hits are historical changelog classification only;
- Quick setup, selected-plan creation, saved-mode text replacement, import/export, manual
  authoring, and generated-plan validation continue to use the accepted structured/OpenAI-authored
  plan-authoring seams.

Validation:

- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` passed;
- `node --import tsx ./scripts/validate-ai-generated-running-plan-creation.ts` passed;
- targeted `npx eslint` for touched runtime/script files passed;
- `npm run build` passed;
- `npm run metrics:lines` passed.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `229,755` lines / `675` files;
- product source: `127,138` lines / `339` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `43,876` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `5` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- source-size effect from the pre-slice `2026-07-01T17:15:18.589Z` baseline: maintained lines
  `-1,935` after the checkpoint/dashboard note, product source `-1,934` lines / `-1` file, scripts
  `-44` lines.

## Architect Closeout - 2026-07-01 - Voice-To-Plan Accepted And Next Batch Selected

Accepted verdict: passed. The non-visible voice-to-plan backend seam is retired from current
product/source truth. Current `src/` and `scripts/` scans still show no live references to
`VoiceToPlan`, `voice_to_plan`, `generateVoiceToPlanDraft`, `confirmVoiceToPlanDraft`,
`voiceResultMessage`, or `buildVoiceSupplement`. `docs/current-state.md` was also synced so it no
longer describes the deleted backend draft/confirm seam or entitlement capability as current state.

Fresh `npm run metrics:lines` snapshot after closeout:

- maintained size: `229,755` lines / `675` files;
- product source: `127,138` lines / `339` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `43,876` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `5` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- dirty worktree: `208` total, `136` tracked modified, `5` tracked deleted, `67` untracked.

Next cleanup execution batch selected: BACKEND reduction of
`src/lib/active-plan-schedule-edit-preview.ts`.

Why this batch is next:

- script active-decomposition is now `0`, so the pressure moved back to product source;
- `src/lib/active-plan-schedule-edit-preview.ts` is `1,591` lines and remains one of the five
  product active-decomposition hotspots;
- source proof shows it is one backend-owned active-plan schedule/review/apply seam with an existing
  dedicated validator (`scripts/validate-active-plan-schedule-edit-preview.ts`);
- it has a clear non-browser validation story: behavior-preserving backend cleanup plus schedule
  preview/apply proof, build, lint, and fresh source-size metrics;
- the prompt explicitly stops if only cosmetic line movement is possible, so the batch stays aligned
  with deletion/reuse/consolidation instead of papering over size.

Not selected now:

- manual constructor/calendar/authoring-control decomposition: material but runner-facing frontend
  work with browser QA and a broader UI risk story;
- `src/lib/training.ts`: still large, but it is the canonical normalized readback seam with broad
  fanout and should not be split without a sharper duplicate-truth target;
- active Markdown compression: Dewey's read-only audit recommended it as the safest batch, and it
  remains valid, but Product pressure is currently on product-source reduction rather than another
  docs-only compression slice.

## Backend Closeout - 2026-07-01 - Active-Plan Schedule Edit Contract Extracted

Backend reduced the active-plan schedule edit runtime owner by extracting the public schedule-edit
input/result/readback contracts into `src/lib/active-plan-schedule-edit-contract.ts`. The stable
runtime facade remains `src/lib/active-plan-schedule-edit-preview.ts`; current type consumers may
keep importing from that facade, while preview/apply logic still lives in one backend owner.

Source-size effect from the pre-slice snapshot:

- `src/lib/active-plan-schedule-edit-preview.ts`: `1,591` -> `1,401` lines;
- new `src/lib/active-plan-schedule-edit-contract.ts`: `219` lines;
- maintained source after closeout/dashboard sync: `228,953` -> `229,008` lines / `672` -> `673` files;
- product source: `126,176` -> `126,205` lines / `336` -> `337` files;
- `productActiveDecomposition1500`: `5` -> `4`;
- `scriptActiveDecomposition1500`: stays `0`.

Validation:

- targeted ESLint for the schedule-edit preview/contract, training-api wrapper, and schedule-edit
  validator passed;
- `node --import tsx ./scripts/validate-active-plan-schedule-edit-preview.ts` passed;
- `npm run build` passed;
- source scan showed no duplicate schedule-edit preview/apply owner or route-local lifecycle rule was
  introduced.

Next step: ARCHITECT should run a fresh source-size checkpoint and select exactly one next cleanup
batch from the remaining current product-source hotspots.

## Architect Closeout - 2026-07-01 - Schedule Edit Contract Extraction Accepted

Accepted verdict: passed. The active-plan schedule edit extraction reduced the runtime preview/apply
module below the active-decomposition threshold while preserving the stable facade and current
behavior. `src/lib/active-plan-schedule-edit-contract.ts` now owns public input/result/readback type
contracts; `src/lib/active-plan-schedule-edit-preview.ts` remains the backend runtime owner for
preview/apply planning and re-exports the contract types for existing consumers.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `229,008` lines / `673` files;
- product source: `126,205` lines / `337` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `44,062` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `4` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- dirty worktree: `214` total, `138` tracked modified, `8` tracked deleted, `68` untracked.

Accepted source-size effect:

- `src/lib/active-plan-schedule-edit-preview.ts`: `1,591` -> `1,401` lines;
- new `src/lib/active-plan-schedule-edit-contract.ts`: `219` lines;
- product source net `+29` lines / `+1` file because this was a contract extraction, not deletion;
- `productActiveDecomposition1500`: `5` -> `4`.

Next cleanup execution batch selected: FRONTEND manual workout authoring UI decomposition.

Why this batch is next:

- script active-decomposition is still `0`, and schedule edit is now below the active threshold;
- no fresh source proof shows another dead runtime island comparable to `/test-calendar`;
- the two largest remaining product-source files share one runner-facing owner and validation story:
  `ManualWorkoutConstructorEditor.tsx` (`1,919` lines) and
  `ManualWorkoutAuthoringControls.tsx` (`1,735` lines);
- source proof shows both files serve the same manual Add/constructor/review/save-template flow, so
  a single behavior-preserving frontend extraction batch is more honest than two micro-gates.

Not selected now:

- continue splitting `active-plan-schedule-edit-preview.ts`: no longer above `1500`, and further
  extraction would need fresh same-owner proof;
- `src/lib/training.ts`: broad canonical readback seam, too much fanout without a sharper
  duplicate-truth target;
- `Calendar.tsx`: core saved-calendar owner; valid later, but higher blast radius than the manual
  authoring UI pair;
- active Markdown compression: valid but separate docs-only lane.

## Architect Checkpoint - 2026-07-02 - Deletion-First Cleanup Rule

Manual workout authoring UI decomposition is accepted as a functional reviewability win, not a net
source-size win. It reduced `productActiveDecomposition1500` from `4` to `2`, while product source
increased by about `77` lines because the slice extracted focused frontend owners rather than
deleted duplicate truth.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `229,139` lines / `676` files;
- product source: `126,282` lines / `340` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `44,116` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `2` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- dirty worktree: `217` total, `138` tracked modified, `8` tracked deleted, `71` untracked.

New cleanup selection rule: prefer deletion, reuse, consolidation, or docs compression with expected
net LOC reduction. Do not select a batch whose only success condition is moving code below the
`1500` threshold.

Candidate comparison:

- FRONTEND/Hito DS `empty` calendar-state collapse is source-proved and safe to route later, but it
  is mostly product-language/DS cleanup with modest or uncertain LOC reduction;
- `Calendar.tsx` and `src/lib/training.ts` remain the only product files above `1500`, but both map
  to current saved-calendar/readback truth and are not deletion-safe without a sharper duplicate
  owner;
- private selected-plan `prescription.work` / `prescription.recovery` grammar remains bounded
  pre-normalization/source-doctrine territory and is not a stronger immediate deletion gate;
- the three active Markdown plans over `2000` lines total `11,745` lines and can be compressed in
  place without runtime/browser/product behavior risk.

Next cleanup execution batch selected: ARCHITECT active-plan docs compression.

Included docs:

- `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`: `4,460` lines;
- `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`: `3,712` lines;
- `docs/plans/active/2026-06-20-hito-docs-and-artifact-compression.md`: `3,573` lines.

Expected result: all three docs under `2000` lines, `activeMarkdownCompression2000` from `3` to
`0`, and at least `4,000` net maintained-line reduction while preserving current metadata, exact
handoff prompts, accepted current truth, safety boundaries, and active next gates.

Subagents used and closed:

- FRONTEND read-only explorer: confirmed visible calendar `empty` state is a safe later
  FRONTEND/Hito DS collapse candidate, but not a large source-size win;
- ARCHITECT read-only docs explorer: confirmed the three active plans over `2000` lines are a safe,
  material net-reduction batch if compressed in place without moving text into new Markdown files.

## Architect Closeout - 2026-07-02 - Active Plan Docs Compression Accepted

Accepted verdict: passed. ARCHITECT compressed the three oversized active plans in place, preserving
their canonical metadata, current exact handoff prompts, active hold/next-gate decisions, accepted
source-of-truth, and safety boundaries while deleting historical prompts, copied reports, stale
closeout chains, and transcript-like validation detail.

Fresh `npm run metrics:lines` after compression and closeout note:

- maintained size: `218,142` lines / `676` files;
- product source: `126,282` lines / `340` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `33,119` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `2` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `0`;
- dirty worktree: `218` total, `139` tracked modified, `8` tracked deleted, `71` untracked.

Source-size effect:

- maintained lines: `229,208` -> `218,142` (`-11,066`);
- current docs/tasks/plans markdown: `44,185` -> `33,119` (`-11,066`);
- `activeMarkdownCompression2000`: `3` -> `0`;
- `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`: `4,460` -> `264` lines;
- `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`: `3,712` -> `164` lines;
- `docs/plans/active/2026-06-20-hito-docs-and-artifact-compression.md`: `3,573` -> `180` lines.

The three target plans themselves removed `11,137` lines; the source-size plan closeout/dashboard
ledger added `71` durable bookkeeping lines back, leaving the accepted net maintained-line reduction
at `11,066`.

Preserved source-of-truth:

- manual authoring still routes to BACKEND manual template contract correction;
- running-plan rebuild remains on ARCHITECT hold after OpenAI-authored dated generated-plan
  acceptance;
- docs/artifact compression remains on ARCHITECT hold after E13/E14 manual-workout image compression
  acceptance;
- no runtime code, product behavior, scripts, schemas, Supabase data, QA artifacts, logs, generated
  output, or archive history changed.

Next cleanup execution batch selected: FRONTEND/Hito DS calendar `empty` vocabulary collapse.

Why this batch is next:

- active Markdown compression is now complete;
- script active-decomposition remains `0`;
- the only remaining product active-decomposition hotspots are current product-source files, so the
  next batch must be deletion/reuse/consolidation, not threshold splitting;
- `docs/current-functional-map.md` already identifies visible calendar `empty` wording as a product
  truth leak;
- the batch has one owner and validation story: FRONTEND/Hito DS presentation cleanup with browser
  proof for product calendar and `/hitoDS` calendar specimens.

## Architect Closeout - 2026-07-02 - Calendar Empty Vocabulary Cleanup Accepted

Accepted verdict: passed. FRONTEND cleaned the visible calendar `Empty` vocabulary at the correct
owner: frontend presentation and Hito DS calendar primitives. Internal `empty` may remain only as a
technical state key; runner-facing calendar language now uses `Rest`, `No workout`, and
`Rest or no-workout day`.

Accepted touched runtime files:

- `src/components/ui/hito-calendar-day.tsx`;
- `src/components/hito-ds/calendar-workout-playground-data.ts`;
- `src/components/hito-ds/calendar-workout-playground.tsx`;
- `src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx`.

Fresh `npm run metrics:lines` snapshot after this docs closeout:

- maintained size: `218,215` lines / `676` files;
- product source: `126,282` lines / `340` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `33,192` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `2` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `0`;
- dirty worktree: `220` total, `141` tracked modified, `8` tracked deleted, `71` untracked.

Accepted validation evidence:

- source scan no longer finds calendar-scope visible `Empty day`, `empty future day`,
  `label: "Empty"`, or dense `Empty` fallback in the touched calendar/Hito DS scope;
- targeted ESLint, `npm run build`, `npm run metrics:lines`, and scoped `git diff --check` passed in
  the implementation slice;
- saved calendar desktop and exact `375px` browser proof passed with no `Empty`, Rest visible, no
  overflow, and console warning/error count `0`;
- `/hitoDS/components#calendar-workout-playground` desktop and exact `375px` browser proof passed
  with `No workout` visible, no `Empty`, no overflow, and console warning/error count `0`;
- disposable tester cleanup completed.

QA artifact folder:

`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-07-02/calendar-empty-vocab-cleanup/`

Source-size result:

- maintained/product LOC were unchanged. This was accepted as a product-truth and Hito DS consistency
  cleanup, not a source-size reduction win.

Next cleanup execution batch selected: FRONTEND Calendar day-renderer consolidation.

Why this batch is next:

- the prior slice was quality/consistency, so the next source-size batch must return to
  deletion/reuse/consolidation;
- `Calendar.tsx` remains the largest product active-decomposition hotspot at `1,776` lines;
- source inspection shows repeated day-action rendering across `MobileMonthList`, `DayCell`, and
  `WeekStrip`;
- the work has one owner, one risk class, and one validation story: FRONTEND calendar rendering with
  browser proof for saved calendar behavior.

## Architect Reachability Audit - 2026-07-01 - Business Flow Cleanup Map

Fresh baseline:

- maintained size: `229,798` lines / `675` files;
- product source: `127,138` lines / `339` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `43,919` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `5` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- dirty worktree: `208` total, `136` tracked modified, `5` tracked deleted, `67` untracked.

Compact flow reachability map:

| Business flow | Current source owners | Classification |
| --- | --- | --- |
| Signed-out preview | `src/routes/index.tsx`, `src/routes/progress.tsx`, `src/routes/workout.$date.tsx`, `src/lib/training.ts`, `src/data/signed-out-preview-plan.ts` | Keep: current preview truth. |
| Onboarding / Quick setup / manual setup | `src/components/OnboardingGate.tsx`, onboarding components, `src/lib/first-plan-actions.ts`, `src/lib/structured-first-plan-onboarding.ts`, `src/lib/running-plan-engine-actions.ts`, `src/lib/manual-workout-authoring/*` | Keep: current first-plan creation truth. |
| Saved calendar and workout detail | `src/components/Calendar.tsx`, `src/components/TodayHero.tsx`, `src/routes/workout.$date.tsx`, `src/lib/route-data-actions.ts`, `src/lib/training-api.ts`, `src/lib/workout-log-actions.ts` | Keep: current saved-mode readback/logging truth. |
| Manual add / constructor / review | `src/components/manual-workout/*`, `src/lib/manual-workout-authoring/*`, `scripts/validate-manual-workout-authoring.ts` | Keep: current runner-facing manual authoring truth; decomposition only with browser QA. |
| Active-plan lifecycle / import / export | `src/components/AppShell.tsx`, `src/components/PlanManagementDialog.tsx`, `src/components/plan-management/*`, `src/components/UploadJsonDialog.tsx`, `src/lib/active-plan-*`, `src/lib/imported-plan.ts`, `src/lib/plan-export.ts` | Keep: current review/confirm, import/export, schedule edit, and clear-upcoming truth. |
| Provider comparison / evidence | workout-result API routes, `src/lib/workout-result-import/*`, `src/components/workout-completion/*` | Keep: current result asset / actual metrics / comparison readback truth. |
| Admin capture/backlog/analytics | `src/routes/admin.*.tsx`, `src/components/admin/*`, `src/lib/admin-*`, repo work-item importer | Keep: current internal admin workflow truth. |
| Hito DS/reference | `/hitoDS*` routes and `src/components/hito-ds/*` | Keep: current internal DS/reference/Figma bridge truth. |
| `/test-calendar` sandbox | `src/routes/test-calendar.tsx`, `src/components/test-calendar/*` | Retire/demote: static product-design sandbox, no current runner/admin/backend business process. |

Ranked cleanup candidates:

1. FRONTEND retire `/test-calendar` runtime sandbox (`~962` source lines): deletion-oriented,
   business-flow unreachable, one owner, route/build/browser validation story.
2. ARCHITECT compress `docs/current-functional-map.md`: the map contains stale hotspot/gate history
   and must not drive source-size batch selection until compressed.
3. BACKEND reduce `src/lib/active-plan-schedule-edit-preview.ts`: current truth, not deletion-safe;
   useful later as behavior-preserving backend consolidation.
4. FRONTEND/Hito DS collapse remaining `empty` calendar vocabulary: likely product-language cleanup,
   but shared primitive/browser risk is higher than retiring the sandbox.

Protected boundaries:

- do not delete or demote signed-out preview, Quick setup/generated plan creation, manual authoring,
  saved calendar, workout detail/logging, active-plan lifecycle, import/export, provider comparison,
  admin workflows, `/hitoDS` reference routes, entitlement behavior, validators, or compact preview
  seed files as part of the `/test-calendar` batch;
- do not treat `src/lib/training.ts`, `active-plan-schedule-edit-preview.ts`, manual constructor,
  calendar, or admin modules as stale just because they are large.

Subagents used and closed:

- FRONTEND read-only reachability audit: mapped live routes/components and selected `/test-calendar`
  as the clearest stale/future-only runtime candidate;
- BACKEND read-only reachability audit: protected current backend action/entity owners and classified
  `active-plan-schedule-edit-preview.ts` as current truth, decomposition-only;
- ARCHITECT docs drift audit: found stale hotspot/gate history in `docs/current-functional-map.md`
  and recommended docs compression as a later same-owner cleanup lane.

## Architect Closeout - 2026-07-01 - `/test-calendar` Runtime Sandbox Retired

Accepted verdict: passed. FRONTEND retired the `/test-calendar` runtime sandbox after proving it was
not a thin wrapper around the real product calendar. The retired source owned fake month/scenario
and detail view models; accepted fake-data design preview ownership now lives under
`/hitoDS/components#calendar-workout-playground` through the shared `HitoCalendarDayCell` /
`HitoWorkoutDayRow` seam.

Source-size effect:

- deleted `src/routes/test-calendar.tsx`;
- deleted `src/components/test-calendar/test-calendar-sandbox.tsx`;
- deleted `src/components/test-calendar/test-calendar-sandbox-data.ts`;
- regenerated `src/routeTree.gen.ts` without `/test-calendar`;
- product source changed by `-3` files / `-962` lines.

Fresh `npm run metrics:lines` snapshot:

- maintained size: `228,890` lines / `672` files;
- product source: `126,176` lines / `336` files;
- scripts: `45,572` lines / `81` files;
- current docs/tasks/plans markdown: `43,973` lines / `132` files;
- product oversized counts: `59` files over `700`, `27` over `1000`, `5` over `1500`;
- scripts oversized counts: `24` files over `700`, `13` over `1000`, `0` over `1500`;
- active markdown compression candidates: `3`;
- dirty worktree: `212` total, `137` tracked modified, `8` tracked deleted, `67` untracked.

Validation evidence:

- targeted calendar/DS ESLint passed in the implementation slice;
- `npm run build` passed in the implementation slice;
- source scan found no remaining runtime `src/` references to `/test-calendar` outside generated
  route output before regeneration;
- browser proof passed for `/hitoDS/components#calendar-workout-playground` and `/` at desktop and
  exact `375px`;
- QA artifact folder:
  `qa-artifacts/screenshots/2026-07-01/test-calendar-ownership-proof/`.

Next cleanup execution batch selected: BACKEND reduction of
`src/lib/active-plan-schedule-edit-preview.ts`.

Why this batch is next:

- after the sandbox deletion, no comparably clear dead runtime product-source island remains;
- the remaining five product active-decomposition hotspots map to current product truth;
- `active-plan-schedule-edit-preview.ts` is still `1,591` lines, has one backend owner, and has a
  dedicated non-browser validator (`scripts/validate-active-plan-schedule-edit-preview.ts`);
- this is consolidation/reuse work, not deletion of current behavior: preview/apply semantics,
  stale-token protection, protected-history safeguards, and schedule edit review boundaries must
  remain unchanged.

Not selected now:

- manual constructor/calendar UI decomposition: still important, but browser-visible and broader
  frontend risk;
- `src/lib/training.ts`: broad canonical readback fanout, unsafe without a sharper duplicate-truth
  target;
- active docs compression: valid but separate ARCHITECT/docs risk class and lower product-source
  leverage for this checkpoint.
