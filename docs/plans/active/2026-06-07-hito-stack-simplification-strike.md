# Hito Stack Simplification Strike

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Classify remaining dirty/untracked work after Admin Work Items and Admin shell implementation, then
prepare safe commit groups before the next simplification slice.

## Stage

ARCHITECT maintenance / worktree commit hygiene and scope triage

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Execute Hito Stack Simplification Strike Slice 3B: worktree commit hygiene and remaining dirty-work
triage.

Stage:
ARCHITECT maintenance / worktree commit hygiene and scope triage.

PLAN:
docs/plans/active/2026-06-07-hito-stack-simplification-strike.md

Context:
- The goal is to reduce real Hito complexity without a broad rewrite.
- Slice 3 made `/admin/capture` a Work items surface with repo work-item source filters and passed QA.
- Slice 3A unified Admin shell/navigation across Overview, Funnel & Usage, Feedback,
  AI & Entitlements, Users, Test accounts, and Work items and passed QA.
- Plan Preset shipped work was already committed and pushed.
- Remaining dirty/untracked work now includes instruction/skill updates, Admin Work Items/importer
  implementation changes, Admin shell implementation changes, this active simplification plan, older
  untracked active plans, and possibly local QA artifacts.
- Before package-manager cleanup or product-code narrowing, commit scope must be classified so the
  next slice does not inherit mixed worktree state.

Required work:
1. Inspect current `git status --short`.
2. Inspect staged/unstaged/untracked files with `git diff --stat`, `git diff --name-status`,
   `git ls-files --others --exclude-standard`, and targeted diffs as needed.
3. Group changes into coherent commit candidates:
   - Admin Work Items metadata/importer/Admin UI implementation
   - Admin shell/navigation implementation
   - Hito Stack Simplification Strike plan/docs
   - agent/skill instruction updates
   - older untracked active plan docs that need separate confirmation
   - QA artifacts that should remain untracked unless explicitly promoted
4. Do not stage or commit broad mixed work unless the scope is clear and intentional.
5. If scope is clear, recommend exact staging commands and commit messages.
6. If user explicitly approves committing in this pass, create only the approved scoped commit.
7. Do not push unless the commit scope, branch, and remote are explicitly approved.

Constraints:
- No product behavior changes.
- No `git reset --hard`.
- No `git checkout --`.
- No deleting source files.
- No broad staging.
- No live Backlog import.
- No `--archive-stale`.
- No push unless explicitly approved after commit scope review.
- Any file references in the report must be clickable Markdown links with absolute workspace paths.

Validation:
- `git diff --check`
- `git status --short --branch`
- `git diff --cached --name-status` if anything is staged
- `git diff --name-status`
- no product build unless new source changes are made

Report:
1. Task
2. Stage
3. Current git status
4. Dirty/untracked groups
5. Recommended commit groups
6. Recommended staging commands
7. Validation results
8. Blockers
```

## Owner

ARCHITECT / BACKEND / FRONTEND / QA

## Last Updated

2026-06-08

## Reference Links

- [Project operating rules](../../../AGENTS.md)
- [Project context](../../context.md)
- [Glossary](../../glossary.md)
- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Optimization strike plan](2026-05-29-hito-optimization-strike-plan.md)
- [Archived Plan Preset plan](../archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)
- [Training API facade](../../../src/lib/training-api.ts)
- [Active plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [First plan actions](../../../src/lib/first-plan-actions.ts)
- [Plan replacement actions](../../../src/lib/plan-replacement-actions.ts)

## Context

Hito has accumulated a lot of successful work quickly:

- saved-mode Supabase truth
- structured onboarding
- AI blueprint first-plan generation
- internal envelope proof
- Plan Presets
- voice/text authoring
- active-plan refresh/apply
- schedule edit
- Garmin feedback
- admin analytics/capture/backlog
- Hito DS rollout
- many dedicated QA harnesses

The product is safer than before, but the system is now at risk of becoming hard to reason about
because multiple seams can appear to own the same product truth.

The simplification strike is not a rewrite. It is a sequence of deletion and narrowing slices that
make the existing architecture smaller and more legible.

## Root Cause

The complexity is not mainly caused by one dependency or one large component.

The root cause is overlapping ownership:

- several plan creation paths can lead to canonical `training-plan-v2`
- several server action wrappers expose plan creation or mutation seams
- `training-api.ts` still acts as a broad compatibility facade after many modules were extracted
- old active plan files can remain visible even after archive copies exist
- validation scripts have grown into multi-domain safety nets that are expensive to review
- tooling signals are mixed, especially if multiple lockfiles imply multiple package managers

If we only patch visible symptoms, the project will keep adding helpers, wrappers, plans, and QA
scripts. The correct fix is to reduce sources of truth.

## Non-Goals

- Do not rewrite the app.
- Do not replace TanStack Start, Supabase, Hito DS, Nitro, Vercel, or OpenAI in this strike.
- Do not delete working product features.
- Do not weaken review/confirm mutation boundaries.
- Do not make frontend own backend truth.
- Do not make Plan Presets a frontend template system.
- Do not promote envelope to production default.
- Do not remove local/admin compatibility before a separate auth lifecycle audit approves it.
- Do not bundle risky code cleanup with docs cleanup.
- Do not touch the active Plan Preset implementation while it is still in flight.

## Core Architecture Rule

Every simplification must move Hito closer to one canonical pipeline:

`runner/provider input -> backend validation -> normalization -> canonical persisted entities -> deterministic product truth -> optional AI/enrichment -> explicit review/confirm when mutation is risky -> UI rendering`

Simplification means fewer owners for the same truth, not new abstractions with nicer names.

## Start Gate

Plan Presets are complete and archived, so the simplification strike may begin.

Code cleanup is still gated by worktree safety. The shipped Plan Preset implementation has been
preserved in git, so Plan Preset source files are no longer a dirty-worktree blocker. Do not start
product-code cleanup until the remaining unrelated instruction/tooling changes are either committed,
discarded by explicit user request, or intentionally separated.

Treat these shipped Plan Preset files as product behavior, not simplification targets:

- [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx)
- [Onboarding gate](../../../src/components/OnboardingGate.tsx)
- [Structured plan constructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [Plan Presets library](../../../src/lib/plan-presets/)
- [Training API facade](../../../src/lib/training-api.ts)
- [Active plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Plan Preset backlog item](../../tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)

Docs/source-of-truth cleanup may start now because it does not touch product source behavior.

## Post-Plan-Presets Audit Findings

Date: 2026-06-07.

Shipped Plan Preset scope now intentionally includes:

- [Plan Preset library](../../../src/lib/plan-presets/) for recipe/schema/resolver/expansion,
  review-token, persistence metadata, and composition ownership.
- [Plan Preset server actions](../../../src/lib/plan-preset-actions.ts) for backend-owned card,
  review, token/checksum, no-active-plan guard, and confirm/persistence boundaries.
- [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx) and
  [Onboarding gate](../../../src/components/OnboardingGate.tsx) for frontend card/review/confirm
  rendering and server-action orchestration.
- [Plan Preset validation harness](../../../scripts/validate-plan-preset-eligibility.ts) plus
  [Plan Preset script fixtures](../../../scripts/plan-presets/) for card, draft, metric, and confirm
  contract preservation.
- Current docs and changelog entries describing shipped no-active-plan Plan Presets.

Current dirty/untracked state:

- The Plan Preset shipped implementation was committed and pushed as
  `9ad43db Ship Plan Presets no-active-plan creation`.
- Remaining modified files are unrelated to Plan Presets:
  [architect agent instructions](../../../agents/architect.agent.md),
  [admin Backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts),
  [plan-writing skill](../../../skills/hito-plan-writing-and-closeout/SKILL.md), and
  [prompt-handoff skill](../../../skills/hito-prompt-handoff/SKILL.md).
- Remaining untracked docs include this simplification plan and older active plan files that appear
  to predate this closeout.

Hotspots worth simplifying now:

- Active/archive plan duplicates are the safest immediate target because they create false active
  work and confuse the Backlog importer.
- [training-api](../../../src/lib/training-api.ts) still has broad compatibility imports/re-exports;
  it is a good later narrowing target after docs/source-of-truth cleanup.
- [OnboardingGate](../../../src/components/OnboardingGate.tsx) is now about `916` lines and mixes
  structured setup, voice setup, advanced JSON, and Plan Presets orchestration. It is a later
  frontend decomposition candidate, not Slice 1.
- [StructuredPlanConstructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx) is
  about `806` lines and should not receive more responsibilities before a focused frontend slice.
- [Plan Preset resolver](../../../src/lib/plan-presets/resolver.ts) is about `453` lines and
  [recipe shared helpers](../../../src/lib/plan-presets/recipe-expanders/shared.ts) are about `368`
  lines; both are acceptable now after Slice 2F extraction, but should be watched before adding new
  families.
- [admin Backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts) is a tooling
  hotspot and currently hangs in dry-run during closeout validation. Treat the hang as a separate
  tooling follow-up unless Slice 1 needs importer responsiveness to complete mirror cleanup.

Safe no-behavior-change cleanup candidates:

- reconcile or remove duplicate active/archive plan files after comparing evidence
- update current-state active inventory if it lists completed work as active
- narrow `training-api.ts` imports one action group at a time after source-of-truth docs are clean
- decompose one large onboarding owner only after Plan Preset source files are intentionally
  preserved
- isolate or fix backlog importer hang as a tooling slice, not as product behavior

Risky or deferred cleanup:

- deleting Plan Preset runtime files, recipe helpers, or validation harnesses
- changing Plan Preset composition behavior or adding preset families
- changing confirm/persistence, DB schema, Supabase, or active-plan lifecycle
- deleting AI blueprint/envelope/text/voice authoring paths without a separate classification gate
- redesigning onboarding or Hito DS surfaces during simplification

## Workstream 0: In-Flight Worktree Safety

Purpose:

Protect current Plan Preset creation/confirm work from accidental cleanup edits.

Steps:

1. Run `git status --short`.
2. List modified/untracked files.
3. Classify each changed file as:
   - shipped Plan Preset work, do not touch in simplification cleanup
   - unrelated user change
   - safe simplification target
   - unknown, do not touch
4. If unrelated dirty/untracked files remain, block product-code cleanup until their commit or
   exclusion scope is explicit.
5. Proceed to Workstream 1 for docs/source-of-truth cleanup only.

Validation:

- No file changes required unless the plan start gate needs updating.
- If this plan changes, run targeted `git diff --check`.

Exit criteria:

- The strike has a clear yes/no start gate.
- No shipped Plan Preset implementation work is accidentally touched.
- Product-code cleanup remains blocked until unrelated dirty/untracked files are handled or
  explicitly excluded from the cleanup slice.

## Workstream 1: Active/Archive Source-Of-Truth Cleanup

Purpose:

Remove false active work before touching code.

Observed issue:

Some plan files exist in both `docs/plans/active/` and `docs/plans/archive/`. That makes agents,
Backlog importer output, and humans see completed work as active.

Known duplicate candidates to verify:

- [Admin analytics active plan](2026-05-17-admin-analytics-page-plan.md) and
  [Admin analytics archive plan](../archive/2026-05-17-admin-analytics-page-plan.md)
- [Active plan schedule edit active plan](2026-05-25-active-plan-schedule-edit-plan.md) and
  [Active plan schedule edit archive plan](../archive/2026-05-25-active-plan-schedule-edit-plan.md)
- [AI-authored first plan active plan](2026-05-26-ai-authored-first-plan-pipeline.md) and
  [AI-authored first plan archive plan](../archive/2026-05-26-ai-authored-first-plan-pipeline.md)
- [Plan authoring decomposition active plan](2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md) and
  [Plan authoring decomposition archive plan](../archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md)
- [Envelope adoption active plan](2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md) and
  [Envelope adoption archive plan](../archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md)
- [Calendar pre-start active plan](2026-06-01-first-plan-calendar-pre-start-rendering-polish.md) and
  [Calendar pre-start archive plan](../archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md)

Steps:

1. Compare each active/archive duplicate.
2. If the archive copy is canonical and complete, remove the active duplicate.
3. If the active copy has newer evidence that archive lacks, merge only final closeout evidence into
   archive first.
4. Do not archive or remove genuinely active work.
5. Update [current state](../../current-state.md) only if it lists a duplicate as active.
6. Do not update [current product](../../current-product.md) or [current system](../../current-system.md)
   for planned cleanup unless implemented behavior changes.

Validation:

- `git diff --check -- docs/plans/active docs/plans/archive docs/current-state.md`
- `npm run import-admin-backlog-work-items -- --dry-run`
- If dry-run shows required mirror updates, run the live importer only after confirming it is safe.
- `npm run validate-admin-capture-backlog`

Exit criteria:

- `docs/plans/active/` contains only work that truly guides active execution.
- Duplicate active/archive plan files are gone or explicitly justified.
- Backlog mirror no longer treats completed duplicate plans as active work.

### Slice 1 Result

Status: complete on 2026-06-07.

Duplicate candidates inspected:

- `2026-05-17-admin-analytics-page-plan.md`
- `2026-05-25-active-plan-schedule-edit-plan.md`
- `2026-05-26-ai-authored-first-plan-pipeline.md`
- `2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md`
- `2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`
- `2026-06-01-first-plan-calendar-pre-start-rendering-polish.md`

Canonical decisions:

- [Admin analytics archive plan](../archive/2026-05-17-admin-analytics-page-plan.md) is canonical:
  it is readable, marked `Complete / Closed / archived`, and includes final Phase 1 / Phase 1A
  exit criteria plus no-next-step guidance. The active duplicate was stale and was removed.
- [Active-plan schedule edit archive plan](../archive/2026-05-25-active-plan-schedule-edit-plan.md)
  is canonical: it is marked `closed`, includes final QA closeout, moved residual follow-ups to
  backlog, and says no active next step remains. The active duplicate was stale and was removed.
- [AI-authored first-plan archive plan](../archive/2026-05-26-ai-authored-first-plan-pipeline.md)
  is canonical: it is marked `Complete / Closed / archived after production blueprint wave`, and
  points future work to split tracks. The active duplicate was stale and was removed.
- [Plan authoring decomposition archive plan](../archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md)
  is canonical: it is marked complete/archived and explicitly redirects follow-through cleanup to
  the active optimization strike plan. The active duplicate was stale and was removed.
- [Envelope adoption archive plan](../archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md)
  is canonical: it is marked completed, records internal non-default envelope exactness, and says
  future rollout/default-switch work needs a separate plan. The active duplicate was stale and was
  removed.
- [Calendar pre-start archive plan](../archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md)
  is canonical: it is archived, QA-passed, and keeps generic Hito DS calendar/workout playground
  work separate. The active duplicate was stale and was removed.

Evidence merged:

- None. The archive files were newer/canonical and already contained closeout evidence; no active
  duplicate had evidence that needed to be merged.

Ambiguous candidates:

- None among the six inspected duplicate filenames.

Validation note:

- Markdown whitespace validation passed.
- Admin Backlog deterministic validator passed.
- Initial importer dry-run hung before Slice 2. After Slice 2 and the stale PDF active-file cleanup,
  `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000` completes cleanly.
- Live mirror refresh was not run because the clean dry-run reported `created: 0` and `updated: 0`.

Next recommended slice:

BACKEND / FRONTEND unified Admin Backlog repo work-item model.

Reason:

The source-of-truth duplicate cleanup is complete and the repo-derived admin Backlog importer now
has bounded diagnostics plus a clean dry-run. The next root-cause simplification is to make Admin
Backlog treat backlog markdown and active plans as one explicit work-item domain instead of relying
on duplicate wrapper files or raw `source_type` labels.

## Workstream 2: Unified Admin Backlog Repo Work-Item Model

Purpose:

Make Admin Backlog show both future work and current work without duplicate wrapper markdown files.

Root-cause diagnosis:

- Hito currently stores repo-authored work in several valid folders:
  [backlog tasks](../../tasks/backlog/), [active plans](./), [archived plans](../archive/),
  [frontend specs](../../tasks/frontend-specs/), and [product briefs](../../tasks/product-briefs/).
- The importer already scans those folders, but the domain model still reads like an admin capture
  backlog mirror instead of a unified repo work-item model.
- Current importer identity is `metadata.source_type + metadata.source_path`, which is good for
  idempotent row refresh but does not tell the UI whether a repo row is a backlog idea, active plan,
  archived plan, frontend spec, or product brief in a user-friendly way.
- Active plans can become invisible or confusing in Admin because the route is named `Backlog`, the
  default tabs are only `Active / Done / Archived`, source labels are raw values such as
  `active_plan`, and wrapper backlog files can be created to make active/future work discoverable.
- Duplicate wrappers are the symptom. Examples currently exist where the same concept appears in
  both backlog and active-plan roots, such as HR-zone and voice-to-plan docs. That creates two
  Supabase mirror rows for one real product idea instead of one clear source of truth.

Architecture decision:

Choose Option A.

Keep the current folders and expand the importer/Admin model so all approved repo markdown sources
are mirrored into one Admin work-item surface with explicit kind/lifecycle metadata. Do not introduce
a new `docs/work-items/` root yet. A new root would be a larger migration, would force broad path
updates across docs/history/importer/backlog mirrors, and would not solve the immediate visibility
problem faster than a model correction.

Canonical work-item domain:

- A repo work item is any approved markdown document that represents future, current, review, or
  completed work and can be mirrored into Admin for discovery and prompt copy.
- Markdown remains canonical for repo-authored work.
- Supabase `admin_capture_items` remains the read-only mirror for repo-derived rows and the
  canonical storage only for admin-created quick notes/captured UI rows.
- Source identity remains `metadata.source_path + metadata.source_type` for compatibility and
  idempotency.
- Add explicit display metadata rather than changing identity:
  `work_item_kind`, `work_item_lifecycle`, `source_group`, and a display label for source type.

Source hierarchy:

- `docs/tasks/backlog/`
  future backlog ideas, paused work, and follow-ups that are not active execution plans.
- `docs/plans/active/`
  currently active execution plans, cleanup strikes, architecture tracks, implementation tracks, and
  current QA/review gates.
- `docs/plans/archive/`
  completed, closed, superseded, or historical plans that should remain searchable but not appear as
  active work.
- `docs/tasks/frontend-specs/` and `docs/tasks/product-briefs/`
  specialized repo work items that should stay discoverable without becoming active plans.

Metadata and status mapping:

| Source type | Work item kind | Lifecycle | Admin status default | Admin label |
| --- | --- | --- | --- | --- |
| `backlog_doc` | `backlog_item` | `backlog` | `new` | `Backlog item` |
| `active_plan` | `plan` | `active` | `ready_for_codex` unless markdown says `backlog`/`blocked` | `Active plan` |
| `archived_plan` | `plan` | `archived` | `done` or `archived` | `Archived plan` |
| `frontend_spec` | `frontend_spec` | `backlog` / `in_progress` from metadata | existing status mapping | `Frontend spec` |
| `product_brief` | `product_brief` | `backlog` / `in_progress` from metadata | existing status mapping | `Product brief` |

Required canonical metadata sections for new/updated repo work items should remain:

- `Status`
- `Type`
- `Priority`
- `Next Recommended Role`
- `Task`
- `Stage`
- `Exact Handoff Prompt`

For active plans, `Status` should use importer-normalizable values such as `in_progress`,
`backlog`, `completed`, `closed`, or `archived`, not free-form prose. Richer status wording belongs
inside the body.

Importer implications:

- Keep scanning the existing approved roots.
- Keep upsert identity stable by `source_type + source_path`.
- Add explicit `metadata.work_item_kind`, `metadata.work_item_lifecycle`,
  `metadata.source_group`, `metadata.source_group_label`, and `metadata.source_label`.
- Add dry-run diagnostics for duplicate concepts across approved roots. The first version can report
  likely duplicates by same date+slug or same normalized task title. It should not silently suppress,
  merge, or archive rows.
- Preserve stale mirror detection: if an approved source path disappears, report it and archive only
  behind explicit `--archive-stale`.
- Preserve read-only repo-derived rows in Admin mutation actions.

Admin UI implications:

- The `/admin/capture` route may keep its URL for now, but visible copy should treat the surface as
  `Work items` or `Backlog & plans`, not only `Backlog`.
- Add a source-kind filter or group display:
  `All work`, `Backlog`, `Active plans`, `Specs`, `Briefs`, `Archive`.
- Row metadata should show human labels such as `Active plan` instead of raw `active_plan`.
- Detail readback should show:
  source path, source type label, work item kind, lifecycle/status, markdown metadata health, and
  read-only source-of-truth note.
- Active plans should appear in the default active view when their lifecycle is active/in-progress.
- Archived/completed plans should remain searchable through `Done`/`Archived` or source filters but
  not clutter active execution.

Migration strategy:

- No folder migration in v1.
- Do not create duplicate backlog wrapper items for active plans.
- Existing duplicate wrapper pairs should be resolved as a later docs cleanup after importer reports
  likely duplicates with evidence.
- Keep existing `docs/tasks/backlog` and `docs/plans/active` paths stable so current markdown links,
  archive history, and handoff prompts do not break.
- Only consider a future `docs/work-items/` root if the current-folder model still causes repeated
  confusion after importer/UI labels are fixed.

First implementation slice:

BACKEND / FRONTEND Slice 3:

1. Add the explicit repo work-item metadata fields in
   [admin Backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts).
2. Add dry-run duplicate-concept diagnostics without changing import behavior.
3. Update `/admin/capture` readback/filter labels to show repo source kind clearly.
4. Preserve all existing read-only mirror behavior and stale cleanup behavior.
5. Do not run live import until dry-run proves whether mirror updates are required.

Validation gates:

- targeted ESLint for changed importer/Admin files
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run import-admin-backlog-work-items -- --dry-run --archive-stale --timeout-ms 30000` if
  stale/duplicate diagnostics are touched
- `npm run validate-admin-capture-backlog`
- browser QA for `/admin/capture` only if UI labels/filters change
- `git diff --check`

Expected user-visible behavior:

- Admin sees backlog tasks and active plans in one work-item surface.
- Active plans are discoverable without duplicate backlog wrapper files.
- Rows clearly say whether they are backlog items, active plans, specs, briefs, or archived plans.
- Repo-derived rows remain read-only in Admin, with markdown as source of truth.

What not to touch:

- Do not move markdown folders in this slice.
- Do not mutate Supabase in architecture/planning mode.
- Do not create backlog wrappers for active plans.
- Do not make Admin UI editable for repo-derived rows.
- Do not change product Plan Presets, plan generation, persistence, or manual workout work.

## Workstream 3: Package-Manager And Tooling Signal Simplification

Purpose:

Avoid agents and local tooling choosing different install/build assumptions.

Observed issue:

Both [package-lock.json](../../../package-lock.json) and [bun.lockb](../../../bun.lockb) are tracked,
while [package.json](../../../package.json) does not declare `packageManager`.

Recommended default:

Use npm as the canonical package manager unless source audit proves Bun is intentionally required.

Steps:

1. Inspect [package.json](../../../package.json), [README](../../../README.md), CI/deploy docs, and
   scripts for Bun usage.
2. If npm is canonical:
   - add `packageManager` to [package.json](../../../package.json)
   - keep [package-lock.json](../../../package-lock.json)
   - remove [bun.lockb](../../../bun.lockb)
3. If Bun is canonical:
   - document why
   - remove npm lock only if CI/deploy agrees
4. Do not change dependency versions in this slice unless lockfile normalization requires it.

Validation:

- `npm install --package-lock-only` only if package metadata changes require lockfile sync.
- `git diff --check -- package.json package-lock.json bun.lockb README.md`
- `npm run build` only if package metadata or lockfiles changed.

Exit criteria:

- One package-manager signal is canonical.
- The repo no longer sends mixed npm/Bun instructions by default.

## Workstream 4: `training-api.ts` Facade Narrowing

Purpose:

Stop [training-api.ts](../../../src/lib/training-api.ts) from being a hidden second API for the
whole product.

Current state:

`training-api.ts` still imports/re-exports many extracted action owners. This was useful during
decomposition, but it should not remain the default path forever.

Keep in `training-api.ts` for now:

- route-data wrappers that need request snapshot/viewer injection
- persisted snapshot loading
- preview/persisted snapshot compatibility
- public wrappers that cannot move safely without changing route contracts

Move direct imports away from `training-api.ts` when safe:

- [auth actions](../../../src/lib/auth-actions.ts)
- [first-plan actions](../../../src/lib/first-plan-actions.ts)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [plan replacement actions](../../../src/lib/plan-replacement-actions.ts)
- [active-plan export actions](../../../src/lib/active-plan-export-actions.ts)
- [user settings actions](../../../src/lib/user-settings-actions.ts)
- [workout log actions](../../../src/lib/workout-log-actions.ts)

Steps:

1. Generate a usage map of imports from `@/lib/training-api`.
2. Classify each import:
   - route-data/snapshot wrapper, keep
   - action owner exists, candidate for direct import
   - type-only import, candidate for moving type export
   - compatibility required, keep with reason
3. Change one narrow group per slice.
4. Remove dead re-exports only after no imports use them.
5. Do not change behavior or action names in the same slice.

Validation:

- targeted ESLint for changed files
- `git diff --check`
- `npm run build`

Exit criteria:

- `training-api.ts` has fewer responsibilities.
- Each remaining export has an explicit reason.
- No route loses request-auth/snapshot behavior.

## Workstream 5: Plan-Creation Path Classification And Deletion Gates

Purpose:

Make plan creation understandable before deleting or adding more paths.

Paths to classify:

- [AI first-plan blueprint modules](../../../src/lib/ai-first-plan-blueprint-authoring.ts)
- [AI first-plan envelope modules](../../../src/lib/ai-first-plan-envelope-expand.ts)
- [AI draft service](../../../src/lib/ai-first-plan-draft-service.ts)
- [structured plan authoring](../../../src/lib/structured-plan-authoring.ts)
- [first plan actions](../../../src/lib/first-plan-actions.ts)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [Plan Presets library](../../../src/lib/plan-presets/)
- [voice-to-plan authoring](../../../src/lib/voice-to-plan-authoring.ts)
- [OpenAI text plan authoring](../../../src/lib/openai-plan-authoring.ts)
- [rich workout draft authoring](../../../src/lib/rich-workout-draft-authoring.ts)
- [plan replacement actions](../../../src/lib/plan-replacement-actions.ts)
- [imported plan parser](../../../src/lib/imported-plan.ts)
- [active-plan refresh actions](../../../src/lib/active-plan-refresh-actions.ts)
- [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts)

Classification buckets:

- production default
- production non-default explicit path
- internal/non-default supported path
- ops/diagnostic path
- QA/doctrine-only fixture path
- legacy compatibility/readback path
- delete/demote candidate
- keep for now with explicit reason

Required decisions:

1. Which paths can create a new active plan?
2. Which paths can replace or refresh an active plan?
3. Which paths are non-mutating review only?
4. Which paths call OpenAI?
5. Which paths must never call OpenAI?
6. Which paths persist through [active-plan persistence](../../../src/lib/active-plan-persistence.ts)?
7. Which path is the first safe deletion/demotion candidate?
8. What validation must pass before deletion?

Validation:

- source inspection only
- no product code changes in the classification pass
- `git diff --check` only if this plan or a related architecture note changes

Exit criteria:

- No future agent has to guess whether a path is production, internal, ops-only, or legacy.
- First deletion/demotion candidate is selected with an explicit gate.

## Workstream 6: Plan Persistence Owner Consolidation

Purpose:

Ensure there is one canonical persistence owner for plan creation/replacement.

Current canonical owner:

- [active-plan persistence](../../../src/lib/active-plan-persistence.ts)

Known lower-level entrypoints:

- `applyImportedPlanForUser(...)`
- `createFirstPlanFromReviewedCanonicalPlanForUser(...)`

Steps:

1. Map all callers into this seam.
2. Verify each caller performs only path-specific validation/review/token logic before persistence.
3. Identify duplicate active-plan checks or rollback logic outside the persistence owner.
4. Keep path-specific server actions, but prevent them from owning row insertion rules.
5. Do not add a second persistence system for Plan Presets, voice, text, import, or refresh.

Validation:

- targeted source inspection
- behavior-preservation harnesses for any touched path
- no DB/schema change unless a concrete missing field is proven

Exit criteria:

- Persistence ownership is clear.
- No plan creation path can silently bypass lifecycle guards or rollback policy.

## Workstream 7: Script And Validator Decomposition

Purpose:

Keep safety harnesses strong but reviewable.

Current hotspots:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
- [AI first plan draft script](../../../scripts/author-ai-first-plan-draft.ts)
- [admin backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts)
- [admin capture validator](../../../scripts/validate-admin-capture-backlog.ts)
- [first-plan release gates](../../../scripts/plan-authoring-doctrine/first-plan-release-gates.ts)

Rules:

- Keep top-level commands stable.
- Extract by ownership, not arbitrary line count.
- Do not weaken assertions.
- Do not combine behavior change with broad extraction.
- Prefer deleting duplicate helpers over adding helper layers.

Steps:

1. Pick one script hotspot.
2. Identify assertion/fixture/CLI parsing boundaries.
3. Extract one stable responsibility.
4. Preserve command output shape where QA depends on it.
5. Add exact preservation assertions if behavior might drift.

Validation:

- existing command for the extracted script
- `git diff --check`
- `npm run build` only if runtime source changed

Exit criteria:

- Validators remain trustworthy.
- Future deletion gates are easier to prove.

## Workstream 8: Hito DS Wrapper And Dependency Usage Audit

Purpose:

Delete truly unused UI wrappers/dependencies without dismantling Hito DS reuse.

Important boundary:

Hito DS wrappers are not automatically bad. Many Radix/shadcn wrappers are the intended shared UI
contract. Removing them blindly would increase route-local UI.

Steps:

1. Audit [components.json](../../../components.json), [UI primitives](../../../src/components/ui/),
   and dependency imports.
2. Classify wrappers:
   - used Hito DS primitive, keep
   - unused but likely future DS primitive, consider backlog only
   - unused imported shadcn artifact, delete candidate
   - product visualization dependency, keep if used
3. Remove only unused wrappers/dependencies with source proof.
4. Do not redesign UI in this slice.

Validation:

- targeted ESLint
- `git diff --check`
- `npm run build`

Exit criteria:

- UI dependency surface is smaller where safely possible.
- Hito DS remains the canonical UI reuse layer.

## Workstream 9: Auth/Admin Compatibility Follow-Up

Purpose:

Avoid re-opening admin auth unless simplification work uncovers active duplication risk.

Known compatibility paths:

- signed admin session cookie
- local auth bypass cookie
- Supabase app metadata admin compatibility
- local tester accounts
- admin route/serverFn allowlist

Rule:

Do not simplify auth opportunistically. Only start this work after a dedicated root-cause audit or
recurring failure signal.

Exit criteria:

- Auth/admin remains out of the simplification strike unless selected as a concrete follow-up.

## Workstream 10: Changelog And Backlog Policy Cleanup

Purpose:

Keep shipped history, repo backlog, and admin backlog mirror from becoming three conflicting truths.

Rules:

- [changelog](../../history/changelog.md) is shipped history.
- [backlog docs](../../tasks/backlog/) are future or active task intake.
- admin Backlog mirror is an operational mirror, not canonical shipped history.
- Completed implementation closeout must either add changelog entry or explicitly say why not.

Steps:

1. During active/archive cleanup, identify completed implementation plans missing changelog entries.
2. Do not add changelog for unimplemented plans or pure future backlog.
3. Keep repo-derived admin Backlog read-only.
4. Run importer dry-run after markdown task status changes.

Validation:

- targeted `git diff --check`
- admin backlog importer dry-run when markdown source state changes
- `npm run validate-admin-capture-backlog`

Exit criteria:

- No completed shipped work relies on Backlog mirror as its changelog substitute.

## Suggested Slice Order

### Slice 0: Start Gate And Dirty Worktree Safety

Owner:

ARCHITECT

Scope:

- inspect dirty worktree
- confirm Plan Preset track is archived
- classify shipped Plan Preset dirty/untracked files as do-not-touch for cleanup
- approve docs/source-of-truth cleanup only

No product code changes.

Status:

Complete for planning. The strike can start with docs/source-of-truth cleanup. Product-code cleanup
waits until shipped Plan Preset source files are intentionally preserved.

### Slice 1: Active/Archive Cleanup

Owner:

ARCHITECT

Scope:

- remove or reconcile active/archive duplicate plans
- update current state only if needed
- run Backlog importer dry-run and admin backlog validator

Exact first slice:

- compare the six known active/archive duplicate plan filenames:
  `2026-05-17-admin-analytics-page-plan.md`,
  `2026-05-25-active-plan-schedule-edit-plan.md`,
  `2026-05-26-ai-authored-first-plan-pipeline.md`,
  `2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md`,
  `2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`, and
  `2026-06-01-first-plan-calendar-pre-start-rendering-polish.md`
- if the archive copy is canonical and complete, remove the false active duplicate
- if the active copy has newer closeout evidence, merge that evidence into archive first
- do not touch genuinely active work, product source, runtime code, lockfiles, Supabase, or Plan
  Preset shipped files
- treat the backlog importer hang as a tooling gap; use bounded timeout and do not run live import if
  dry-run does not complete

Status:

Complete on 2026-06-07. Six false active/archive duplicate plan files were removed. Admin Backlog
mirror refresh was later unblocked by Slice 2 plus stale PDF active-file cleanup; live import was not
run because the clean dry-run reported no required mirror changes.

### Slice 2: Admin Backlog Importer Dry-Run Responsiveness

Owner:

BACKEND / QA

Scope:

- reproduce the `npm run import-admin-backlog-work-items -- --dry-run` hang with a bounded timeout
- identify whether the hang is markdown scanning, filesystem/iCloud access, stale mirror lookup,
  Supabase/env setup despite dry-run, or output/reporting
- fix the root cause without changing product behavior
- keep dry-run safe and keep `--archive-stale` explicit
- do not run live import until dry-run completes and reports whether mirror updates are required

Status:

Implemented on 2026-06-07. The importer now has bounded timeout, phase diagnostics, and debug
logging. Plain dry-run does not reach Supabase; the observed hang is during markdown scanning at
`read_markdown_file` for `docs/plans/active/2026-05-15-plan-export-pdf.md`. The command now exits
with a bounded diagnostic instead of hanging indefinitely.

Follow-up cleanup on 2026-06-07 resolved the remaining file-access blocker. The active PDF export
file was untracked, unreadable through bounded reads, and stale relative to the canonical backlog
item [Active Plan PDF Export Plan](../../tasks/backlog/2026-05-15-plan-export-pdf.md) plus the
archived [Plan Export From Open Plan](../archive/2026-05-15-plan-export-from-open-plan.md) history.
Only the false active copy was removed. PDF export remains preserved as a useful future backlog
slice, not an active implementation plan.

After removal, `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000` completed
successfully with `ok: true`, `created: 0`, `updated: 0`, `duplicateCount: 0`,
`repoDerivedInReviewCount: 0`, and `staleActiveRepoMirrorCount: 0`. Live import was not run because
the dry-run reported no required mirror changes.

### Slice 3: Unified Admin Backlog Repo Work-Item Model

Owner:

BACKEND / FRONTEND

Scope:

- keep existing markdown folders
- add explicit repo work-item kind/lifecycle/source-group metadata in the importer
- add duplicate-concept dry-run diagnostics for wrapper duplicates
- update Admin row/detail labels and filters so backlog items and active plans are both visible
- preserve repo-derived read-only behavior and stale cleanup
- do not run live import before dry-run proves the source scan and metadata shape

Status:

Implemented and QA-passed on 2026-06-07.

Implemented behavior:

- The importer emits explicit repo work-item kind/lifecycle/source-group metadata, human source
  labels, source-group counts, and duplicate-concept diagnostics without changing
  `metadata.source_type + metadata.source_path` identity.
- Admin readback exposes typed repo work-item metadata.
- `/admin/capture` shows a `Work items` surface with source filters for `All work`, `Backlog`,
  `Active plans`, `Specs`, `Briefs`, and `Archive`.
- Repo-derived rows remain read-only and markdown remains canonical.

QA evidence:

- Built-in Codex browser was used first.
- Actual dev server was discovered on `localhost:8082`.
- `/admin/capture` loaded without `ERR_BLOCKED_BY_CLIENT`.
- Targeted ESLint passed.
- Importer dry-run passed without writes.
- `npm run validate-admin-capture-backlog` passed.
- Read-only Supabase source-group proof passed.
- `git diff --check` passed.
- `npm run build` passed.
- Dry-run source groups were:
  `backlog: 19`, `active_plans: 7`, `specs: 16`, `briefs: 8`, `archive: 70`.
- Read-only Supabase current source groups included:
  `backlog: 19`, `active_plans: 7`, `specs: 16`, `briefs: 8`, `archive: 67`.
- Duplicate concept diagnostics were present with count `2`.
- `All work` includes active plans and backlog items.
- `Active plans` shows Hito Stack Simplification Strike and excludes backlog labels.
- `Backlog` shows backlog rows and excludes active-plan labels.
- Specs, briefs, and archive labels work.
- Active-plan detail is read-only and shows source path, source group, kind, and lifecycle.
- Screenshots/artifacts were saved under
  `qa-artifacts/screenshots/2026-06-07/admin-work-items-metadata-filters-qa/`.
- PNG screenshots were partially blocked by `Page.captureScreenshot` timeout, but JSON/text fallback
  artifacts were saved.
- QA did not run live import, `--archive-stale`, migrations, or data mutation.

### Slice 3A: Unified Admin Shell And Navigation Contract

Owner:

DESIGNER / FRONTEND

Status:

Implemented and QA-passed on 2026-06-08.

QA evidence:

- Built-in Codex browser was used first against `localhost:8082`.
- Safari fallback was not used.
- Targeted ESLint passed.
- `npm run validate-admin-capture-backlog` passed.
- `git diff --check` passed.
- `npm run build` passed.
- Overview, Users, Test accounts, and Work items all render the shared Admin nav.
- Desktop sidebar labels are identical across sections.
- Shared helper copy appears:
  `One internal workspace for product truth, users, test accounts, and work items.`
- Route-local `Manual handoff` and `Admin surface` helper identities are gone.
- Exactly one visible desktop sidebar item is active per section.
- Users and Test accounts map to the correct headings/content and active nav items.
- Analytics deep links preserve active sidebar state.
- Work Items list/status/source filter/search/source labels still work.
- `q=screenshot` updates the list count to `Showing 6 of 6 items`.
- Desktop and mobile have no horizontal overflow.
- Artifacts were saved under `qa-artifacts/screenshots/2026-06-08/admin-shell-unification-qa/`.
- PNG capture mostly timed out, but DOM/JSON fallback artifacts cover state.

Diagnosis:

The unified repo work-item model is implemented, but the visible Admin shell still communicates two
different mental models:

- `/admin/analytics` presents a stable Admin surface with a bottom helper titled `Admin surface`.
- `/admin/capture` presents Work items with a bottom helper titled `Manual handoff`.
- Both routes render similar sidebars, but each route owns its own nav list, active state, helper
  copy, and mobile rail.
- This makes Work items feel like a separate mini-app even though it is now part of the same Admin
  workspace as Overview, Users, and Test accounts.

Selected Admin shell model:

- Admin is one workspace.
- There is one persistent Admin sidebar on desktop.
- There is one selected sidebar item at a time.
- The right-side content changes based on the selected item.
- No Admin section should override the shell identity unless it intentionally becomes a separate
  admin app, which Work items is not.
- The existing routes may remain:
  - `/admin/analytics` for analytics/users/test-account sections
  - `/admin/capture` for Work items
- Route boundaries are implementation details. The visible shell should feel shared.

Canonical Admin nav items:

| Item | Visible label | Route / state | Notes |
| --- | --- | --- | --- |
| Overview | `Overview` | `/admin/analytics` + overview state | Default analytics overview. |
| Funnel & Usage | `Funnel & Usage` | `/admin/analytics` + funnel state | Keep current section state. |
| Feedback | `Feedback` | `/admin/analytics` + feedback state | Keep current section state. |
| AI & Entitlements | `AI & Entitlements` | `/admin/analytics` + ai state | Keep current section state. |
| Users | `Users` | `/admin/analytics` + users state | Real users only. |
| Test accounts | `Test accounts` | `/admin/analytics` + test-account state | QA/local/test users. |
| Work items | `Work items` | `/admin/capture` | Replaces visible `Backlog` shell label. |

Naming decision:

- Use `Work items` as the visible admin nav label.
- Do not use `Backlog` as the primary shell label now that the surface includes backlog tasks,
  active plans, specs, briefs, archived plans, and quick admin notes.
- `Backlog` can remain a content filter inside Work items, not a shell identity.

Sidebar helper/card decision:

Use one consistent helper pattern across all Admin sections.

Recommended v1:

- Title: `Admin workspace`
- Body: `Internal tools for analytics, test accounts, and repo-synced work.`

Rules:

- The helper title must not change per section.
- Section-specific operational details belong in the right-side page header or content area.
- Do not use `Manual handoff` as the sidebar identity.
- Do not use `Admin surface` only on analytics sections.
- If the helper continues to feel redundant after implementation, it may be removed entirely from
  all Admin sections, but it must not vary by selected item.

Desktop behavior:

- Sidebar width, logo/admin header, nav row spacing, icon size, active marker, hover backdrop, and
  bottom helper spacing stay identical across Admin sections.
- Selected item uses the existing Hito shell nav active row:
  muted surface wash, foreground label, icon in foreground, and one signal dot/marker.
- Hover uses the same low-chrome row backdrop for all items.
- Focus-visible uses the existing Hito focus ring and must not be visually confused with selected.
- Disabled nav items are not expected in v1. If needed later, they should stay visible, muted, and
  non-interactive with a reason in content, not in the shell helper.
- Only one nav row may carry active styling at a time.
- Work-item status/source filters stay inside the Work items content area.

Route and deep-link behavior:

- `/admin/capture` deep-links directly to Work items with Work items selected.
- `/admin/analytics` defaults to Overview selected.
- Analytics sub-sections may remain internal state, query state, or hash state, but deep links should
  restore the matching selected nav item when the implementation supports them.
- If Frontend keeps analytics section state internal for this slice, the visible requirement is that
  clicking a sidebar item updates one selected row and right-side content without duplicate active
  markers.
- `Back to Hito` and `Sign out` behavior remain unchanged.

Mobile behavior:

- Use one mobile Admin nav pattern across analytics and Work items.
- The mobile topbar should read `Admin / <selected item>`.
- The quick-link rail or drawer must include the same canonical items as desktop.
- Work items should not get a separate mobile nav model.
- If horizontal quick links overflow, switch to a Hito DS drawer/jump menu rather than wrapping into
  multiple noisy rows.
- Work-item filters remain in the Work items content, below the page header.

Accessibility notes:

- Sidebar nav uses `nav` with `aria-label="Admin workspace"`.
- Current route/section link uses `aria-current="page"` for route-level links or
  `aria-current="location"` for internal section links.
- Nav rows are links when they change URL and buttons only when they change internal section state.
- Keyboard focus order should be stable: logo/home, nav items, helper if interactive, content.
- Icons are decorative when labels are visible.
- Active state cannot rely on color only; keep the marker/backdrop/text-weight combination.

Frontend implementation notes:

- Prefer a shared admin nav model over separate route-local nav arrays.
- Candidate shared owner can be a small component or helper near existing admin routes; do not
  introduce a broad admin framework.
- `src/routes/admin.analytics.tsx` and `src/routes/admin.capture.tsx` should consume the same nav
  item definitions and helper copy.
- If analytics sections remain internal tabs, the nav model can expose an item action/href shape
  that supports both route links and section setters.
- Keep Hito DS classes:
  `hito-workbench-shell`, `hito-workbench-sidebar`, `hito-shell-nav`, `hito-shell-nav-row`,
  `hito-shell-nav-icon`, `hito-shell-nav-dot`, `hito-row-group`, `hito-list-row`, and existing
  mobile rail classes.
- Do not add a new Admin-specific visual kit.
- Do not change backend loaders, admin auth, user classification, Work items importer, or Supabase
  mirror behavior.

What not to touch:

- Do not redesign every admin page.
- Do not change admin analytics data, user/test-account classification, or Work items data model.
- Do not move markdown work-item files.
- Do not decide new importer metadata.
- Do not turn Work items source/status filters into shell navigation.
- Do not create duplicate Admin shell components if a small shared helper can cover both routes.

Acceptance criteria:

- Overview, Funnel & Usage, Feedback, AI & Entitlements, Users, Test accounts, and Work items appear
  as one stable Admin nav list.
- Selecting Work items does not change the shell identity to `Manual handoff`.
- Selecting Overview/Test accounts does not show a different helper identity than Work items.
- There is only one active-looking nav item at a time.
- The bottom helper/card is either identical across sections or removed across all sections.
- Work items remains visibly part of Admin, not a separate capture mini-app.
- Work-item filters remain inside the Work items content.
- Desktop and mobile share the same nav item taxonomy.
- Existing routes, auth, data loading, and admin actions continue to work.

### Slice 3B: Worktree Commit Hygiene And Dirty-Work Triage

Owner:

ARCHITECT

Status:

Selected as the next simplification slice on 2026-06-08.

Reason:

Admin Work Items metadata/filters and Admin shell/navigation unification are implemented and
QA-passed, but the worktree now contains mixed remaining work. Starting package-manager cleanup,
`training-api.ts` narrowing, or any other product-code simplification before classifying and
committing this work would increase risk and make rollback/review harder.

Scope:

- classify all modified/untracked files by source task
- split ready work into clean commit groups
- preserve unrelated instruction/skill updates as their own scope
- keep older untracked active plans separate until the user confirms whether they should remain
  active, move to backlog, or be removed as stale duplicates
- keep QA artifacts untracked unless explicitly promoted
- do not push until the branch/remote/commit scope is explicitly approved

Recommended commit groups:

1. Admin Work Items metadata/importer/Admin UI implementation.
2. Admin shell/navigation unification implementation.
3. Hito Stack Simplification Strike plan/docs.
4. Agent/skill instruction updates, if still intentional.
5. Older active-plan docs only after separate source-of-truth confirmation.

Validation:

- `git status --short --branch`
- `git diff --stat`
- `git diff --name-status`
- `git diff --cached --name-status` if anything is staged
- `git ls-files --others --exclude-standard`
- targeted `git diff --check` for the files in each proposed commit group

Exit criteria:

- no mixed staged index
- each ready commit group has an exact file list and message
- unrelated/unconfirmed files remain unstaged
- next simplification slice can start from a known worktree state

### Slice 4: Package Manager Signal Cleanup

Owner:

BACKEND

Scope:

- decide npm vs Bun
- remove mixed lockfile signal if safe
- validate build if package metadata changes

### Slice 5: `training-api.ts` Import Map And First Narrowing

Owner:

BACKEND

Scope:

- classify all `@/lib/training-api` imports
- move one safe action group to direct owner imports
- remove dead re-export only when no imports remain

### Slice 6: Plan-Creation Path Classification

Owner:

ARCHITECT / BACKEND

Scope:

- classify all plan creation/mutation/review paths
- select one deletion/demotion candidate
- define exact validation gate

### Slice 7: First Code Deletion/Demotion

Owner:

BACKEND

Scope:

- delete or demote exactly one approved stale/legacy seam
- preserve blueprint, Plan Preset, review/confirm, persistence, and metric-truth behavior

### Slice 8: Script/Validator Decomposition

Owner:

BACKEND / QA

Scope:

- extract one script hotspot responsibility
- keep command stable
- preserve assertions

### Slice 9: Hito DS Wrapper Usage Audit

Owner:

FRONTEND

Scope:

- classify UI wrappers/dependencies
- delete unused wrappers only with source proof
- no UI redesign

### Slice 10: Closeout

Owner:

ARCHITECT / QA

Scope:

- record reductions
- update changelog only for shipped/product-visible or meaningful internal reliability changes
- archive the plan if no active simplification slices remain

## QA Expectations

Docs-only slices:

- targeted `git diff --check`
- admin backlog importer dry-run if markdown source state changes
- admin backlog validator if mirror-relevant docs changed

Code behavior-preservation slices:

- targeted ESLint for touched files
- relevant harness command
- `git diff --check`
- `npm run build`

Browser QA:

- only required if UI behavior changes
- use built-in Codex browser first
- Safari fallback only when needed by QA policy
- for Slice 3A, check both `/admin/analytics` and `/admin/capture` so the shared shell does not
  regress on either side

## Risks

- Touching in-flight Plan Preset files could break current plan creation work.
- Removing compatibility exports too early could break TanStack serverFn eligibility or route imports.
- Deleting diagnostic authoring paths without doctrine coverage could weaken safety.
- Removing Hito DS wrappers blindly could increase route-local UI rather than reduce complexity.
- Lockfile cleanup without checking CI/deploy assumptions could create install drift.
- Active/archive cleanup could accidentally discard newer closeout evidence if duplicates are not
  compared first.
- Treating active plans as backlog wrapper tasks would keep duplicating markdown truth instead of
  fixing Admin Backlog visibility.
- Leaving Admin shell/helper copy route-local would keep Work items feeling like a separate app even
  after the unified work-item model is implemented.

## Exit Criteria

- The Plan Preset track is either complete or explicitly paused before code cleanup begins.
- `docs/plans/active/` contains only real active execution plans.
- Admin Backlog has one repo work-item model where backlog items, active plans, specs, briefs, and
  archived plans are distinguishable without duplicate wrapper markdown.
- Admin analytics, users/test accounts, and Work items share one stable Admin shell/navigation
  contract with one selected item and one consistent helper pattern.
- Package-manager signal is singular and documented.
- `training-api.ts` has fewer compatibility responsibilities or an explicit remaining-export map.
- Plan creation paths are classified by production/internal/ops/QA/legacy/delete status.
- At least one stale or duplicate seam is deleted or demoted after validation.
- Script/validator ownership is clearer without weakening checks.
- No product behavior changes accidentally.
- No fake metric truth, AI fallback leak, or frontend-owned plan truth is introduced.

## Blockers

- No blocker for Slice 1 docs/source-of-truth cleanup.
- Product-code cleanup is blocked until Slice 3B classifies and stages/commits or explicitly
  excludes remaining dirty/untracked work.
- Admin Backlog importer dry-run now completes cleanly after the stale PDF active file was removed.
  Live import was not run because the dry-run reported no required mirror changes.
- Admin shell/navigation unification is implemented and QA-passed.
