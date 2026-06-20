# Hito Stack Simplification Strike

## Status

in_progress / G20 accepted; source-proof holding

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Resume Hito Stack Simplification only when a concrete cleanup candidate is source-proved.

## Stage

ARCHITECT source-proof holding / no safe next implementation gate selected.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Resume Hito Stack Simplification only when a concrete cleanup candidate is source-proved.

Stage:
ARCHITECT source-proof holding / no safe next implementation gate selected.

Context:
G20 is accepted. The untracked duplicate-space manual-workout backlog markdown copy was removed
after source/admin-root proof confirmed it was not tracked, differed from the canonical backlog
item, and should not become parallel repo-derived Admin Backlog truth.

Current burndown:
- `cleanup-burndown-v1`: `37/40` complete, `3` remaining, `92.5%`.
- Expected delta is `0` until a new source-proved cleanup candidate appears.

Root cause and architecture fit:
- Visible symptom: after G20, no current source-proved cleanup batch is selected.
- Underlying cause: remaining candidates mix live runtime facades, browser-sensitive UI, required
  validators, local tooling, and protected evidence; routing by momentum could break accepted
  behavior.
- Canonical owner: Architecture source-proof holding before any next BACKEND, FRONTEND, DEVTOOLS,
  QA, or docs implementation gate.

Scope:
1. Do not route cleanup implementation by momentum, file size, or suspicion.
2. Watch for a new implementation report, QA report, source/import-map change, docs drift, product
   decision, or newly discovered duplicate owner that creates a concrete cleanup candidate.
3. Before selecting any future gate, use read-only subagents for backend/import-map,
   frontend/browser-risk, and docs/devtools drift when the candidate is non-trivial.
4. Select exactly one next gate only when it has one owner, one risk class, one validation story,
   and clear stop conditions.
5. If no such candidate exists, keep the simplification strike in source-proof holding.

What must not be touched:
- Do not change product runtime, frontend UI, backend code, Supabase, migrations, OpenAI behavior,
  browser QA, logs, `qa-artifacts`, validation coverage, manual calendar behavior, selected-plan
  creation, Plan Preset card discovery, Admin expansion, Hito DS implementation, or
  `/test-calendar` work.

Validation:
- Before any future implementation gate is selected, run source/import/docs proof for the candidate.
- If docs are updated, run scoped `git diff --check`.
- If admin-mirrored markdown moves or is deleted from repo-derived roots, run the admin importer
  dry-run and backlog validator.

Stop conditions:
- Stop if a proposed cleanup candidate crosses owner boundaries, becomes browser-visible, touches
  mutation safety, requires Supabase/OpenAI/production access, weakens validation coverage, or needs
  a product decision.
```

## G20 Closeout — 2026-06-20

Status: complete / G20 accepted; source-proof holding.

Root-cause decision:

- Visible symptom: a duplicate-space backlog markdown copy remained under a repo-derived
  admin-imported docs root.
- Underlying cause: local/docs residue can create duplicate admin mirror truth or confuse cleanup
  agents if it remains beside the canonical backlog item.
- Canonical owner applied: Architecture docs/source-of-truth cleanup with admin importer proof.

G20 acceptance:

- Accepted as docs/source-of-truth cleanup.
- Deleted only
  `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence 2.md`.
- Preserved the canonical tracked backlog item:
  `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`.
- Source proof showed the duplicate-space file was untracked while the canonical file is tracked.
- Diff proof showed the duplicate was an older backlog-stage artifact that differed materially from
  the canonical item and should not become a parallel admin Backlog source.
- Admin importer dry-run and backlog validation passed after deletion.

Burndown:

- `cleanup-burndown-v1`: `37/40` complete, `3` remaining, `92.5%`.
- G20 delta: `+1` gate.
- Expected future delta: `0` until a new source-proved cleanup candidate appears.

Next state:

Source-proof holding. Do not select backend/runtime, frontend/browser-sensitive, docs/devtools, or
artifact cleanup by momentum alone.

## G19 Closeout And Post-G19 Reassessment — 2026-06-20

Status: complete / G19 accepted; ARCHITECT G20 selected.

Root-cause decision:

- Visible symptom: the cleanup track needed a post-G19 next gate after deleting a source-proved
  onboarding voice UI orphan.
- Underlying cause: remaining candidates mix live runtime facades, browser-sensitive UI, required
  validators, source-of-truth drift, and protected artifacts; selecting by size or momentum would
  risk accepted behavior.
- Canonical owner applied: Architecture source/import/docs reassessment with read-only subagents.

G19 acceptance:

- Accepted as QA-passed deletion-only frontend cleanup.
- `src/components/onboarding/DictateToPlanPanel.tsx` is deleted.
- `rg -n "DictateToPlanPanel" src package.json scripts` returns no refs.
- Backend voice-to-plan truth remains present in `src/lib/first-plan-actions.ts`,
  `src/lib/voice-to-plan-authoring.ts`, entitlement files, onboarding form-model types,
  plan-authoring snapshot mapping, and doctrine validation.
- Targeted ESLint, `npm run build`, and scoped `git diff --check` passed in the implementation/QA
  report.
- Browser smoke was not required because this was deletion-only source hygiene and the source graph,
  lint, and full build proved no live dependency.

Subagent findings integrated:

- Backend/import-map audit found no safe deletion/facade cleanup after G19. `training-api.ts`,
  schedule-edit preview, validators, and live ops entrypoints remain required runtime or validation
  owners. A future ops mutation-safety hardening batch exists but is not deletion/demotion-ready.
- Frontend/browser-sensitive audit found no additional no-browser-safe frontend deletion candidate.
  Manual calendar, selected-plan preview, Hito DS, and admin UI cleanup remain browser-sensitive or
  separately owned.
- Docs/devtools audit confirmed G19 source-of-truth drift and identified the untracked duplicate
  manual-workout backlog markdown copy as the next clean deletion/demotion-ready docs/admin-mirror
  candidate.
- All three subagents were closed after their reports were integrated.

Selected next batch:

`ARCHITECT Slice G20: remove duplicate manual-workout backlog markdown copy after admin-mirror proof`.

Source proof:

- The canonical tracked backlog item is
  `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`.
- The duplicate-space file
  `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence 2.md` is untracked.
- The duplicate differs materially from the canonical file and should not become a parallel
  repo-derived admin Backlog source of truth.
- The gate is docs/source-of-truth cleanup only; it must preserve runtime/source files, QA
  artifacts, and the canonical backlog item.

Rejected alternatives:

- Backend ops mutation-safety hardening: useful future candidate, but not deletion/demotion-ready and
  touches command safety semantics, so it is deferred behind the cleaner docs/admin-mirror hygiene
  gate.
- Broad `training-api.ts` cleanup: blocked by live route/component imports and runtime wrappers.
- Manual calendar/Admin/Hito DS runtime cleanup: browser-sensitive or separately owned.
- Further validator extraction: rejected by momentum; validators remain required proof owners.
- Artifact/log deletion: blocked by retention policy; `qa-artifacts/` remains protected evidence.

Burndown:

- `cleanup-burndown-v1`: `36/40` complete, `4` remaining, `90%`.
- G19 delta: `+1` gate.
- If G20 is accepted, `cleanup-burndown-v1` moves to `37/40` complete, `3` remaining, `92.5%`.

## G18 Closeout And Post-G18 Reassessment — 2026-06-20

Status: complete / G18 accepted; FRONTEND G19 selected.

Root-cause decision:

- Visible symptom: the cleanup track needed a post-G18 next gate after deleting a source-proved
  onboarding import orphan.
- Underlying cause: remaining candidates mix live backend/runtime facades, browser-sensitive
  surfaces, protected evidence, docs/admin mirror hygiene, and future-adjacent UI residue.
- Canonical owner applied: Architecture source/import/docs reassessment with read-only subagents.

G18 acceptance:

- Accepted as complete.
- `src/components/onboarding/JsonImportPanel.tsx` is deleted.
- `rg -n "JsonImportPanel" src package.json scripts` returns no refs.
- Current JSON import ownership remains with `PlanImportPanel`, `PlanManagementDialog`, and
  `UploadJsonDialog`.
- Targeted ESLint, `npm run build`, and scoped `git diff --check` passed in the implementation/QA
  report.
- Browser smoke was not required because this was deletion-only source hygiene and the source graph,
  lint, and full build proved no live dependency.

Subagent findings integrated:

- Backend/import-map audit found no safe backend/ops gate after G18. `training-api.ts`, Plan Preset
  card discovery, selected-plan creation, active-plan import/export/lifecycle/manual seams, and ops
  validators remain required runtime or validation owners.
- Frontend/browser-sensitive audit confirmed G18 source state and identified tracked
  `DictateToPlanPanel.tsx` as the strongest next source-proved frontend orphan candidate with no
  live import.
- Docs/devtools audit confirmed post-G18 source-of-truth/dashboard drift and classified the
  duplicate manual-workout backlog copy as real but lower-priority docs/admin-mirror hygiene because
  it differs from the canonical file.

Selected next batch:

`FRONTEND Slice G19: delete orphan DictateToPlanPanel UI residue while preserving backend voice-to-plan truth`.

Source proof:

- `git ls-files --error-unmatch src/components/onboarding/DictateToPlanPanel.tsx` confirms the file
  is tracked.
- `rg -n "DictateToPlanPanel" src package.json scripts --glob '!src/components/onboarding/DictateToPlanPanel.tsx'`
  returns no live source/package/script caller.
- Current docs classify Dictate-to-Plan / voice transcript assist as not visible in onboarding until
  a future frontend and QA gate accepts it.
- Backend voice-to-plan remains a non-default backend seam and is not selected for deletion.

Rejected alternatives:

- Backend/ops cleanup: no source-proved safe gate after G18.
- Broad `training-api.ts` cleanup: blocked by live route/component imports and runtime wrappers.
- Docs/admin-mirror duplicate backlog cleanup: real candidate, but needs a separate docs/admin-mirror
  hygiene gate because the duplicate file differs from the canonical backlog item.
- Manual calendar/Admin/Hito DS runtime cleanup: browser-sensitive or separately owned.
- Artifact/log deletion: blocked by retention policy; `qa-artifacts/` remains protected evidence.

Burndown:

- `cleanup-burndown-v1`: `35/40` complete, `5` remaining, `87.5%`.
- G18 delta: `+1` gate.
- If G19 is accepted, `cleanup-burndown-v1` moves to `36/40` complete, `4` remaining, `90%`.

## Post-G17 Reassessment And G18 Selection — 2026-06-20

Status: complete / G17 accepted; FRONTEND G18 selected.

Root-cause decision:

- Visible symptom after G17: the Plan Preset source hygiene gate is complete, but the cleanup track
  needs one next bounded gate from fresh source proof.
- Underlying cause: remaining candidates mix live runtime facades, browser-sensitive UI, docs
  hygiene, local residue, and protected evidence. The next gate must be selected from a concrete
  source mismatch, not from file size.
- Canonical owner applied: Architecture source/import/docs reassessment with read-only subagents.

G17 acceptance:

- Accepted as complete.
- Source proof shows no remaining untracked legacy Plan Preset builder/review residue under
  `src/lib/plan-presets/` or `scripts/plan-presets/`.
- `git ls-files -- src/lib/plan-presets scripts/plan-presets` shows only tracked current Plan
  Preset card-discovery owners.
- Old builder/review names now appear only in docs/history and the validator absence list.
- The canonical direct validator command was used because `npm run validate-plan-preset-eligibility`
  is not defined in `package.json`; package command semantics were intentionally preserved.

Subagent findings integrated:

- Backend/import-map audit kept broad `training-api.ts` cleanup blocked and found no stronger
  backend/ops deletion gate after G17.
- Frontend/UI audit identified tracked `JsonImportPanel.tsx` as a source-proved orphan because docs
  already mark it removed, current import UI is owned elsewhere, and no live import remains.
- Docs/devtools audit found the remaining duplicate backlog markdown copy and generated/local
  artifacts as real but lower-priority docs/devtools hygiene. Logs and `qa-artifacts/` remain
  protected from deletion.

Selected next batch:

`FRONTEND Slice G18: delete resurrected orphan onboarding JsonImportPanel residue`.

Source proof:

- `git ls-files --error-unmatch src/components/onboarding/JsonImportPanel.tsx` confirms the orphan
  file is tracked.
- `rg -n "JsonImportPanel" src package.json scripts --glob '!src/components/onboarding/JsonImportPanel.tsx'`
  returns no live source/package/script caller.
- Current import UI references point to `PlanImportPanel`, `PlanManagementDialog`, and
  `UploadJsonDialog`, not the old onboarding panel.

Rejected alternatives:

- Broad `training-api.ts` cleanup: blocked by live route/component imports and runtime wrappers.
- Docs/backlog duplicate markdown cleanup: valid docs hygiene, but lower leverage than deleting a
  tracked source orphan that current docs already say is gone.
- Manual calendar/Admin/Hito DS runtime cleanup: browser-sensitive or separately owned.
- Artifact/log deletion: blocked by retention policy; `qa-artifacts/` remains protected evidence.

Expected next burndown:

- Current stable burndown is `34/40` complete, `6` remaining, `85%`.
- If G18 is accepted, `cleanup-burndown-v1` moves to `35/40` complete, `5` remaining, `87.5%`.

## G17 Closeout — 2026-06-20

Status: complete / untracked legacy Plan Preset builder/review residue deleted.

Root-cause decision:

- Visible symptom: untracked legacy Plan Preset builder/review files under `src/lib/plan-presets/`
  and dependent `scripts/plan-presets/*` helpers could make old Plan Preset creation look live.
- Underlying cause: local residue from the removed Plan Preset review/confirm creation seam survived
  after product truth moved to card discovery plus selected running-plan preview/create.
- Canonical owner applied: BACKEND/OPS source hygiene and Plan Preset card-discovery boundary.

Deleted residue:

- `src/lib/plan-presets/algorithmic-builder.ts`
- `src/lib/plan-presets/composition.ts`
- `src/lib/plan-presets/expand.ts`
- `src/lib/plan-presets/persistence-metadata.ts`
- `src/lib/plan-presets/review-token.ts`
- Legacy Plan Preset builder CSV/source artifacts:
  `preset-builder-io-contract.csv`, `preset-identity-placement-rules.csv`,
  `preset-phase-template-table.csv`, `preset-program-source-of-truth.md`,
  `preset-progression-math-rules.csv`, `preset-quality-gates.csv`,
  `preset-segment-anatomy-table.csv`, `preset-weekly-archetype-table.csv`, and
  `preset-workout-identity-library.csv`.
- Dependent untracked proof helpers under `scripts/plan-presets/`.

Preserved:

- Current Plan Preset card discovery through `src/lib/plan-preset-actions.ts`.
- Tracked current Plan Preset resolver/recipe/progressive/schema modules and current program CSVs.
- Selected running-plan preview/create ownership.
- `training-api.ts`, package command semantics, validators, Supabase/OpenAI boundaries, and
  browser-visible UI.

Validation evidence:

- Final source proof showed the deleted files were untracked and had no package/current owner.
- `scripts/validate-plan-preset-eligibility.ts` already asserts the legacy builder/review artifacts
  must not exist.
- Post-delete validation kept Plan Preset card discovery behavior covered by the existing eligibility
  harness.

Burndown:

- `cleanup-burndown-v1`: `34/40` complete, `6` remaining, `85%`.
- G17 delta: `+1` gate.

## Post-G16 Reassessment And G17 Selection — 2026-06-20

Status: complete / G16 accepted; BACKEND/OPS G17 selected.

Root-cause decision:

- Visible symptom after G16: the local duplicate-space residue gate is complete, and the cleanup
  track needs one next bounded gate from fresh source proof.
- Underlying cause: remaining candidates mix current runtime facades, browser-sensitive UI,
  docs/devtools drift, and local untracked source residue. Selecting by line count or momentum would
  risk reopening accepted behavior.
- Canonical owner applied: Architecture source/import/docs reassessment with read-only subagents.

G16 acceptance:

- Accepted as complete.
- Confirmed deleted targets are absent:
  `src/lib/plan-creation-engine/source-model 2.ts`,
  `src/components/onboarding/PlanPresetPanel 2.tsx`, and
  `src/components/ui/calendar 2.tsx`.
- `git ls-files` has no tracked entries for those duplicate-space paths.
- Source refs for those names appear only in docs closeout/history.
- Canonical `source-model.ts` imports remain intact.

Subagent findings integrated:

- Backend/import-map audit kept broad `training-api.ts` cleanup blocked and identified untracked
  legacy Plan Preset builder/review residue as the strongest backend/ops candidate. Current Plan
  Preset truth is card discovery only, and `scripts/validate-plan-preset-eligibility.ts` already
  asserts many legacy builder artifacts must be absent.
- Frontend/UI audit found a tracked orphan `JsonImportPanel.tsx` candidate, but that is frontend
  source cleanup with build/browser-risk boundaries and is lower priority than residue that can
  break current validator doctrine.
- Docs/devtools audit found stale `docs/work-dashboard.md` wording and one untracked duplicate
  backlog markdown copy. Dashboard refresh is part of this closeout; backlog duplicate cleanup is
  deferred behind a docs/admin-mirror hygiene gate.

Selected next batch:

`BACKEND/OPS Slice G17: remove untracked legacy Plan Preset builder/review residue`.

Source proof:

- `git status --short -- src/lib/plan-presets scripts/plan-presets` shows the legacy
  builder/review module cluster and dependent `scripts/plan-presets/*` helpers are untracked.
- `git ls-files -- src/lib/plan-presets scripts/plan-presets` shows only the current tracked card
  discovery owners and active program CSVs; the legacy builder/review files are not tracked current
  source.
- `scripts/validate-plan-preset-eligibility.ts` lists the legacy builder/review files in
  `removedLegacyBuilderFiles` and asserts they must not exist.
- Current `plan-preset-actions.ts` and resolver/recipe/progressive modules remain the current
  tracked Plan Preset card-discovery owner.

Rejected alternatives:

- Frontend `JsonImportPanel.tsx` deletion: real candidate, but frontend/build-sensitive and already
  historical G5B cleanup; defer until the stronger validator-breaking residue is removed.
- Duplicate backlog markdown `...recurrence 2.md`: docs-only hygiene, lower risk and lower leverage;
  defer behind a docs/admin-mirror cleanup gate.
- Broad `training-api.ts` cleanup: blocked by live route/component imports and runtime wrappers.
- Manual calendar/Admin/Hito DS runtime cleanup: browser-sensitive or separately owned.
- Artifact/log deletion: blocked by retention policy; `qa-artifacts/` remains protected evidence.

Expected next burndown:

- Current stable burndown remains `33/40` complete, `7` remaining, `82.5%`.
- If G17 is accepted, `cleanup-burndown-v1` moves to `34/40` complete, `6` remaining, `85%`.

## G16 Closeout — 2026-06-20

Status: complete / local duplicate-space residue deleted.

Root-cause decision:

- Visible symptom: duplicate-space files remained in the working tree after backend/ops cleanup.
- Underlying cause: local filesystem residue can look like live backend/frontend business truth even
  when canonical owners already exist.
- Canonical owner applied: BACKEND/OPS local source hygiene; canonical runtime owners remain
  untouched.

G16 result:

- Deleted `src/lib/plan-creation-engine/source-model 2.ts`.
- Deleted `src/components/onboarding/PlanPresetPanel 2.tsx`.
- Deleted `src/components/ui/calendar 2.tsx`.
- Preserved canonical owners:
  `src/lib/plan-creation-engine/source-model.ts`,
  `src/components/onboarding/PlanPresetPanel.tsx`, and `src/components/ui/calendar.tsx`.
- Confirmed source imports still target canonical `source-model.ts`.

Cleanup burndown:

- `cleanup-burndown-v1`: `33/40` gates complete, `7` remaining, `82.5%`.
- Delta from G16: `+1` completed gate.

## G15 Closeout — 2026-06-20

Status: complete / orphan legacy MJS ops helper residue deleted.

Root-cause decision:

- Visible symptom: tracked legacy MJS helper files still made old ops/source ownership look live.
- Underlying cause: stale local ops helpers survived prior text-authoring and ops cleanup while
  canonical TS and ops-local owners became active.
- Canonical owner applied: backend/ops cleanup; current command ownership remains in
  `scripts/author-plan-from-text.ts`, `src/lib/openai-plan-authoring.ts`,
  `src/lib/structured-plan-authoring.ts`, `src/lib/imported-plan.ts`, and
  `scripts/lib/ops-plan-apply.ts`.

G15 result:

- Deleted `scripts/lib/openai-plan-authoring.mjs`.
- Deleted `scripts/lib/structured-plan-authoring.mjs`.
- Deleted `scripts/lib/imported-plan-seed.mjs`.
- Preserved public command names and command behavior for `author-plan-from-text`,
  `author-structured-plan`, and `import:current-plan`.
- Preserved G4F local mutation safety: default/help and dry-run paths remain non-mutating, and
  `--apply` remains local-loopback guarded.
- Confirmed `scripts/author-plan-from-text.mjs` remains intentionally deleted and was not revived.

Cleanup burndown:

- `cleanup-burndown-v1`: `32/40` gates complete, `8` remaining, `80%`.
- Delta from G15: `+1` completed gate.

## Post-G15 Reassessment And G16 Selection — 2026-06-20

Status: complete / G15 accepted; DEVTOOLS/OPS G16 selected.

Root-cause decision:

- Visible symptom after G15: the selected backend/ops residue deletion is complete, but the cleanup
  track needs the next gate from fresh source proof rather than cleanup momentum.
- Underlying cause: remaining candidates mix live runtime facades, browser-sensitive UI,
  validation/proof infrastructure, generated/local artifacts, and local filesystem residue.
- Canonical owner applied: Architecture source/import/docs reassessment with read-only subagents.

G15 acceptance:

- Accepted as complete.
- The deleted MJS helper residue no longer exists on disk:
  - `scripts/lib/openai-plan-authoring.mjs`
  - `scripts/lib/structured-plan-authoring.mjs`
  - `scripts/lib/imported-plan-seed.mjs`
- Source/import proof found no live refs in `package.json`, `scripts`, or `src`.
- Current command owners and package command behavior remain preserved.

Subagent findings integrated:

- Backend/import-map and ops audit kept broad `training-api.ts` cleanup blocked, preserved package
  scripts and validators, and classified remaining duplicate-space files as DEVTOOLS/local hygiene
  rather than backend runtime cleanup.
- Frontend/browser-sensitive audit found no safe browser-visible frontend cleanup batch. Manual
  calendar, selected-plan preview, Admin, Hito DS, and `/test-calendar` remain deferred or separately
  owned.
- Docs/devtools/artifact audit found the generated dashboard needed refresh after G15 and confirmed
  artifact/log deletion remains blocked behind explicit retention policy.

Selected next batch:

`DEVTOOLS/OPS Slice G16: local duplicate-space residue cleanup`.

Source proof:

- `git status --short -- "src/lib/plan-creation-engine/source-model 2.ts" "src/components/onboarding/PlanPresetPanel 2.tsx" "src/components/ui/calendar 2.tsx"`
  shows all three files are untracked.
- `git ls-files -- <target files>` returns no tracked paths.
- Source search found no imports or live references to the duplicate-space filenames.
- Current imports reference the canonical `source-model.ts`, not `source-model 2.ts`.

G16 scope:

- Delete only:
  - `src/lib/plan-creation-engine/source-model 2.ts`
  - `src/components/onboarding/PlanPresetPanel 2.tsx`
  - `src/components/ui/calendar 2.tsx`
- Do not delete tracked source, logs, `qa-artifacts`, generated test artifacts, validation coverage,
  or canonical runtime owners.

Rejected alternatives:

- Broad `training-api.ts` cleanup: blocked by live route/component imports.
- Backend ops helper deletion beyond G15: blocked; surviving helpers are required by current scripts.
- Frontend/manual calendar/admin/Hito DS cleanup: browser-sensitive or separately owned.
- Docs/dashboard refresh alone: required as source-of-truth sync, but not a cleanup gate by itself.
- Artifact/log deletion: blocked; `artifact:hygiene` remains dry-run and `qa-artifacts` remains
  protected proof evidence.

Expected next burndown:

- If G16 is accepted, `cleanup-burndown-v1` moves to `33/40` complete, `7` remaining, `82.5%`.

## UI-C1 Closeout And Post-UI-C1 Gate Selection — 2026-06-20

Status: complete / UI-C1 QA-passed and accepted; BACKEND/OPS G15 selected.

Root-cause decision:

- Visible symptom before UI-C1: the selected running-plan preview calendar still carried a
  route-local calendar cell owner after the shared Hito calendar-day primitive had become the
  accepted product/DS seam.
- Underlying cause: DS/specimen rollout and runtime selected-plan preview consumer migration were
  separate tracks, so selected-plan preview kept duplicate presentation ownership.
- Canonical owner applied: `HitoCalendarDayCell` in the selected-plan preview consumer, while
  backend selected-plan generation, endpoint proof, metric truth, and persistence remained
  unchanged.

UI-C1 acceptance evidence:

- Source proof: `rg -n "PreviewCalendarCell|hito-selected-plan-calendar-cell" src` returns no refs.
- `SelectedTenKPlanPreviewDialog.tsx` renders `HitoCalendarDayCell`.
- Browser QA with a disposable no-active-plan user and known-good Quick setup rendered the selected
  running-plan preview calendar.
- No-benchmark 10K preview rendered `84` shared calendar rows and `12` week groups.
- Workout, rest, and final endpoint states rendered.
- Final endpoint row showed `Final 10K Day` and `10000m endpoint`.
- Benchmark retry with Recent 5K time `25:00` rendered and showed
  `Recent 5K benchmark pace 5:00/km · personal HR targets blocked`.
- Desktop and `375px` mobile had no horizontal overflow.
- Disposable auth/local user cleanup returned scoped data to zero/absent.

Subagent preflight for post-UI-C1 selection:

- Backend/import-map subagent found one source-proved same-owner cleanup candidate: tracked orphan
  legacy MJS ops helper residue under `scripts/lib/`.
- Frontend/browser-risk subagent found no new safe frontend implementation batch with one owner,
  risk class, and validation story. Manual calendar, Admin, Hito DS, and `/test-calendar` remain
  browser-sensitive or separately owned.
- Docs/devtools subagent found the expected stale UI-C1 plan/map/dashboard wording and no stronger
  devtools script fix.

Post-UI-C1 decision:

- Accept UI-C1 as behavior-preserving frontend cleanup.
- Update `cleanup-burndown-v1` to `31/40` complete, `9` remaining, `77.5%`.
- Select `BACKEND/OPS Slice G15: orphan legacy MJS ops helper residue deletion`.

G15 source proof:

- `git ls-files --error-unmatch scripts/lib/openai-plan-authoring.mjs scripts/lib/structured-plan-authoring.mjs scripts/lib/imported-plan-seed.mjs`
  shows all three files are tracked.
- Source search found no live callers/imports for those MJS helper modules outside their own stale
  helper pair.
- `package.json` points current commands to canonical owners:
  `author-plan-from-text`, `author-structured-plan`, and `import:current-plan`.
- `node --check` passes for the three stale MJS files, so the issue is duplicate ownership/residue,
  not a syntax break.
- Broad `training-api.ts` cleanup remains blocked because route/component/server-function callers
  are still live.

Rejected alternatives:

- Broad `training-api.ts` cleanup: blocked by live route/component imports.
- Frontend/manual calendar cleanup: browser-sensitive live mutation surface.
- Admin table/capture cleanup: authenticated browser-sensitive runtime with route/search/filter and
  mutation controls.
- Hito DS and `/test-calendar`: separate owners; not the next global simplification gate.
- Untracked duplicate-space UI residue such as `PlanPresetPanel 2.tsx`: not a backend/ops gate and
  should not be bundled with G15.

Expected next burndown:

- If G15 is accepted, `cleanup-burndown-v1` moves to `32/40` complete, `8` remaining, `80%`.

## Designer Audit Checkpoint — 2026-06-18

Status: complete / UI-C1 accepted unchanged after Designer audit.

Root-cause decision:

- Visible symptom: `/hitoDS` is accepted, but some runtime consumers still own local UI grammar.
- Underlying cause: DS/specimen rollout and product-consumer migration happened as separate tracks,
  leaving a few product surfaces outside shared primitives.
- Canonical owner applied: Architecture sequencing over the Designer audit findings. Select one
  bounded runtime DS-adoption batch instead of reopening broad visual audit or routing a vague
  frontend cleanup pass.

Designer audit findings accepted:

- No broad redesign is justified.
- `/hitoDS` remains the accepted DS/specimen owner.
- Runtime drift is concentrated in consumer seams, not everywhere.
- The selected running-plan preview calendar still owns a mini calendar system instead of consuming
  the shared calendar-day primitive.
- Admin table/capture drift, repeated dialog shells, manual workout readbacks, and feedback
  micro-surfaces remain real future candidates, but they are broader or more browser-sensitive than
  the selected preview-calendar seam.

Subagent preflight:

- Preview-calendar parity subagent confirmed `SelectedTenKPlanPreviewDialog` still renders local
  `hito-selected-plan-calendar-*` wrappers and `PreviewCalendarCell`, while product calendar and
  `/test-calendar` already consume `HitoCalendarDayCell` / `HitoWorkoutDayRow`.
- Admin-risk subagent confirmed admin table/capture cleanup is wider and higher risk because it
  touches authenticated admin analytics, test accounts, Work Items, filters/search, popovers, and
  admin shell behavior.
- Source/reference subagent confirmed current docs agree that G14 is complete, UI-C1 is the
  immediate gate, and the candidate has one owner, one risk class, and one validation story.

Decision:

- Accept the Designer recommendation.
- Keep `FRONTEND UI-C1: adopt the shared Hito calendar-day primitive in selected running-plan
  preview calendar` as the first product-wide DS-adoption cleanup batch.
- Do not change the cleanup burndown for this checkpoint. The ledger remains `30/40` complete,
  `10` remaining, `75%`; if UI-C1 is implemented and QA-accepted, expected next delta is `+1` to
  `31/40`, `9` remaining, `77.5%`.

Why UI-C1 beats alternatives:

- It has one runtime consumer: selected-plan preview calendar.
- It has one canonical shared owner: `HitoCalendarDayCell` / `HitoWorkoutDayRow`.
- It removes a duplicate presentation system without changing backend selected-plan truth.
- Admin table/capture cleanup is broader, authenticated, and needs a larger browser-proof matrix.
- Dialog-shell, manual workout, and feedback micro-surface cleanup candidates are real but less
  isolated than the preview-calendar candidate.

Stop conditions for UI-C1:

- Stop if the selected-plan preview state cannot be represented without a broad shared primitive
  redesign.
- Stop if implementation needs changes to running-plan engine preview/review/confirm, persistence,
  metric truth, fake pace/HR guardrails, or Marathon Base/Completion semantics.
- Stop if the slice starts touching manual calendar mutation behavior, Admin tables, `/hitoDS`
  rollout implementation, `/test-calendar`, Supabase, migrations, OpenAI, logs, or `qa-artifacts`.
- Stop if desktop or `375px` browser proof cannot preserve week grouping, workout/rest/final states,
  tooltip/detail readback, confirm/create flow, and no horizontal overflow.

## Slice G14 Business-Flow Legacy Teardown Matrix — 2026-06-18

Status: complete / global business-flow teardown map accepted; first execution batch selected.

Root-cause decision:

- Visible symptom: the cleanup track entered source-proof holding even though the codebase is still
  large and contains historical compatibility, route-local UI, validation, and devtools residue.
- Underlying cause: opportunistic cleanup removed many known seams, but the remaining work had not
  been rebuilt from a full business-flow ownership map, so agents could not safely distinguish live
  execution paths from legacy duplicates.
- Canonical owner applied: Architecture source-of-truth cleanup. The matrix below maps business
  flows to one canonical owner before selecting implementation.

Subagent preflight:

- Backend/import-map subagent checked `src/lib/*`, route/server-function owners, `training-api.ts`,
  plan creation, import/export/lifecycle/manual seams, ops scripts, and validators. It found no new
  no-caller `training-api.ts` export and kept broad runtime facade cleanup blocked.
- Frontend/UI subagent checked onboarding, selected-plan preview, calendar/manual actions, plan
  management, admin, Hito DS, and `/test-calendar`. It confirmed the strongest duplicate runtime UI
  path is the selected-plan preview calendar, which has a route-local cell system next to the shared
  Hito calendar-day primitive.
- Docs/devtools/artifacts subagent checked active/current docs, package scripts, generated
  dashboard, logs, `test-results`, and `qa-artifacts` policy. It found no stronger docs/devtools
  implementation batch; local residue remains a future DEVTOOLS retention-policy candidate.

Business-flow teardown matrix:

| Business flow | Canonical supported path | Duplicate / legacy / suspect path | Classification | Decision |
| --- | --- | --- | --- | --- |
| Auth and login/session | `src/lib/auth-actions.ts`, live auth route wrappers in `training-api.ts`, login/admin auth surfaces | G4C already removed the auth callback exchange facade re-export | required runtime | Keep. Do not change Magic Link, redirect sanitization, Supabase env handling, local auth, or admin auth in cleanup. |
| Onboarding and first active-plan creation | `OnboardingGate`, `first-plan-actions`, structured first-plan review/confirm, selected/manual creation seams | Voice/Dictate-to-Plan UI is non-visible/future-adjacent; first-plan voice backend remains non-default | required runtime plus future/non-default | Keep. Do not delete voice or first-plan helpers without Product/Architect decision and fresh proof. |
| Selected/structured plan preview and confirm | Running-plan engine preview/review/confirm plus `SelectedTenKPlanPreviewDialog` | Local selected-plan preview calendar cell/CSS duplicates shared calendar-day presentation | deletion/demotion-ready frontend presentation duplicate | Select UI-C1 as first execution batch. Backend plan truth remains unchanged. |
| Manual user-built plan creation and authoring | Manual workout authoring actions, persistence, review exactness, saved templates, constructor controls | Large live controls/calendar files | required runtime / decompose-only | Keep. Any cleanup needs browser-visible manual-plan QA scope. |
| Active-plan lifecycle and refresh | `active-plan-lifecycle-actions`, `active-plan-refresh-actions`, schedule edit preview/apply owners | Broad lifecycle helper/facade cleanup already narrowed; schedule edit remains live | required runtime | Keep. No broad lifecycle or refresh cleanup by line count. |
| Plan import, replacement, export, share/QR | `PlanManagementDialog`, `PlanImportPanel`, `UploadJsonDialog`, `active-plan-export-actions`, `plan-export` | QR/share/import-from-share are future-only; old Plan Preset create/import paths removed | required runtime plus future-only | Keep current import/export. Do not select QR/share/import future work in cleanup. |
| AI/text/voice plan authoring and ops | TS-backed `author-plan-from-text`, `openai-plan-authoring`, first-plan AI owners | MJS fallback and duplicate ops residue already removed; voice remains non-default | required ops/runtime | Keep. No live OpenAI calls or voice deletion in cleanup. |
| Plan presets/card discovery | `plan-preset-actions` card discovery and selected-plan create handoff | Legacy Plan Preset review/confirm create seam removed | current runtime | Keep card discovery only; do not revive old create/confirm. |
| Workout logs/provider evidence/actual metrics | Workout log actions, provider/evidence readback, workout detail/completion surfaces | Protected-state rules can make calendar actions blocked | required runtime | Keep. Do not weaken evidence/protected-history truth for cleanup. |
| Admin/backlog/capture/analytics | Admin capture, analytics, backlog importer, account/auth surfaces | Admin route files are large; G9 removed future placeholders | required runtime / decompose-only | Defer. Admin cleanup needs dedicated browser/auth proof. |
| Hito DS, Figma export, `/test-calendar` sandbox | Hito DS IA/Figma bridge active plan; dedicated `/hitoDS/export/figma`; archived static `/test-calendar` plan | Parent `/hitoDS` fallback removed; `/test-calendar` code remains fake/static | required internal tooling plus archived sandbox | Keep. Do not move sandbox ownership back into `/hitoDS`; no DS feature work in simplification. |
| Local devtools/scripts/artifacts/dashboard | `work:dashboard`, `artifact:hygiene`, import/admin scripts, validators | `.DS_Store`, `logs/qa-local-server-state 2.json`, `test-results/.last-run.json` residue candidates | generated/local hygiene | Defer to DEVTOOLS retention-policy batch. Do not delete logs or `qa-artifacts` in G14. |

Top deletion-ready candidates:

- No product-runtime deletion candidate is source-proved by G14.
- Local generated residue is possible DEVTOOLS work, but not selected because it is not the first
  business-flow duplicate and must obey the log/artifact retention policy.

Top decomposition-only candidates:

- Admin table/header utility primitive cleanup across live admin routes.
- Manual authoring controls/calendar decomposition.
- Plan management/schedule edit presentation cleanup.
- Voice-to-plan and active-plan schedule edit backend decomposition only with owner-specific proof.

Blocked / browser-sensitive candidates:

- Broad `training-api.ts` cleanup remains blocked unless a new tiny no-caller compatibility seam is
  source-proved.
- Manual calendar mutation UI, admin runtime UI, Hito DS route work, and plan-management UI require
  dedicated browser validation and must not be bundled with backend/devtools cleanup.
- Logs, `qa-artifacts`, validation coverage, Supabase mutation, migrations, and live OpenAI calls
  remain out of scope.

G14 burndown:

- `cleanup-burndown-v1`: `30/40` gates complete, `10` remaining, `75%`.
- Delta from G14: `+1` completed architecture/source-of-truth gate.
- Expected next delta if UI-C1 is implemented and QA-accepted: `+1` to `31/40`, `9` remaining,
  `77.5%`.

Selected first execution batch after G14:

`FRONTEND UI-C1: adopt the shared Hito calendar-day primitive in selected running-plan preview calendar`.

This is selected because it has one canonical owner, one duplicate path, one risk class, and one
validation story. It should run autonomously through implementation and QA handoff only within the
selected preview-calendar scope.

## Slice G13 Closeout — 2026-06-18

Status: complete / accepted.

Root-cause decision:

- Visible symptom: the side-pane work dashboard could keep showing a completed cleanup gate as the
  next active task if it was not regenerated after plan closeout.
- Underlying cause: dashboard refresh still lived as a direct `node` helper workflow instead of a
  first-class package-script/devtools workflow with obvious safe/default commands.
- Canonical owner applied: local devtools / docs source-of-truth hygiene through the existing
  `scripts/hito-work-dashboard.mjs` owner.

G13 result:

- Added first-class package scripts:
  - `npm run work:dashboard`
  - `npm run work:dashboard:no-admin`
  - `npm run work:dashboard:apply`
- Updated dashboard help and generated command block to recommend package scripts first.
- Kept direct `node scripts/hito-work-dashboard.mjs` as fallback.
- Regenerated `docs/work-dashboard.md` from current active-plan truth.
- Did not run the live Admin apply path.

Burndown update:

- `cleanup-burndown-v1`: `29/40` gates complete, `11` remaining, `72.5%`.
- Delta from G13: `+1` completed gate.

## Post-G13 Reassessment — 2026-06-18

Status: complete / G13 accepted; no safe next implementation batch selected.

Root-cause decision:

- Visible symptom after G13: the work-dashboard devtools cleanup is complete and the cleanup track
  wants another autonomous batch.
- Underlying cause: remaining candidates currently mix live route/component facades,
  browser-sensitive UI, validation infrastructure, protected QA evidence, and separate-owner product
  tracks.
- Canonical owner applied: Architecture source-proof holding rather than forced implementation.

G13 acceptance:

- Accepted as complete.
- `package.json` exposes:
  - `npm run work:dashboard`
  - `npm run work:dashboard:no-admin`
  - `npm run work:dashboard:apply`
- `scripts/hito-work-dashboard.mjs` remains the dashboard helper owner and preserves non-mutating
  defaults unless the explicitly live `--apply` path is selected.
- `docs/work-dashboard.md` now shows package-script commands first and reflects current active-plan
  truth.

Post-G13 audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Remaining `training-api.ts` exports | required runtime facade / current compatibility | Keep blocked. Fresh proof found no no-caller export strong enough for another bounded facade cleanup. |
| Backend ops/scripts and validators | required local ops, required validation, or future/non-default diagnostics | Keep. Do not delete or thin validation coverage by line count. |
| Manual calendar / source actions | browser-sensitive required runtime | Defer until a dedicated frontend cleanup gate defines exact desktop/mobile browser QA coverage. |
| Hito DS / admin UI / `/test-calendar` | separate active owner, current runtime, or paused static sandbox | Defer. No deletion-ready same-owner frontend batch was found. |
| Docs/devtools/artifacts | G13 resolved current dashboard drift; artifacts are generated/protected | Keep holding. Do not delete logs or `qa-artifacts`; `artifact:hygiene` remains dry-run unless a future retention policy selects otherwise. |

Decision:

- Do not select another implementation batch now.
- Place the simplification strike in source-proof holding.
- Expected burndown delta from this holding decision: `0`; ledger remains `29/40` complete, `11`
  remaining, `72.5%`.
- Resume implementation cleanup only when fresh source/import/docs evidence identifies one concrete
  owner, one risk class, one validation story, and clear stop conditions.

Subagent preflight:

- Backend/import-map subagent accepted G13 and found no next backend cleanup candidate.
- Frontend/browser-risk subagent found no safe next frontend batch without browser-specific scope.
- Docs/devtools/artifact subagent accepted G13, found current burndown aligned, and found no stronger
  docs/devtools batch.

## Service-Wide UI Consistency Audit — 2026-06-18

Status: complete / first DS adoption cleanup batch selected.

Root-cause decision:

- Visible symptom: `/hitoDS` is largely accepted, but runtime product consumers can still drift
  through route-local typography, spacing, wrappers, calendar cells, table headers, and modal/menu
  anatomy.
- Underlying cause: DS/specimen rollout and runtime consumer adoption were separate tracks.
- Canonical owner: Architecture audit first, then one bounded FRONTEND/DS cleanup batch where the
  source proof shows one owner, one risk class, and one validation story.

Read-only audit streams:

- DS primitive inventory confirmed canonical owners for text roles, surfaces, wrappers, metadata
  tags, workbench shell, Figma export, and shared calendar-day presentation.
- Runtime route-consumer scan found multiple drift candidates:
  selected running-plan preview calendar, admin data-table headers/utility rows, admin page header
  typography, structured-onboarding duplicate labels, and manual constructor local card/surface
  wrappers.
- Spacing/typography scan found broad route-local Tailwind recipes, but those are too wide for the
  first cleanup batch.
- Browser-risk shortlist found a tiny manual-calendar move-target label issue, but that is an
  accessibility/view-model cleanup, not the best first DS-adoption root-cause batch.

Selected first DS adoption batch:

`FRONTEND UI-C1: adopt the shared Hito calendar-day primitive in selected running-plan preview calendar`.

Why this is the safest first move:

- It directly addresses DS adoption, not only copy/accessibility polish.
- It has one runtime consumer: `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`.
- It has one existing shared owner: `src/components/ui/hito-calendar-day.tsx`.
- It has one route-local drift family: `hito-selected-plan-calendar-*` CSS plus local
  `PreviewCalendarCell`.
- It has one validation story: selected-plan preview browser proof at desktop and `375px`, plus
  targeted ESLint/build/diff checks.
- It avoids higher-risk mixed-owner batches such as admin data-table primitive extraction,
  typography-wide migration, manual workout constructor polish, and route-wide spacing cleanup.

Deferred candidates:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Admin data-table header / utility row primitive | strong DS adoption candidate, but touches Admin runtime plus DS specimen | Defer until UI-C1 passes; next likely DS adoption batch if browser/admin proof is scoped. |
| Route-wide typography migration | too broad / high visual regression risk | Defer; should be broken into route-family batches. |
| Manual calendar move-target accessible label | small frontend accessibility cleanup | Keep as separate targeted cleanup; not selected as first service-wide DS adoption batch. |
| Manual workout constructor local surfaces | browser-sensitive manual authoring runtime | Defer to a dedicated manual-authoring DS cleanup gate. |
| Schedule edit local CSS wrapper | plan-management route consumer drift | Defer; needs Open plan browser proof. |

Burndown:

- Current ledger remains `29/40` complete, `11` remaining, `72.5%`.
- UI-C1 is the selected next gate. If accepted after implementation and QA, it should move the
  ledger to `30/40`.

## Slice G12 Closeout — 2026-06-18

Status: complete / accepted.

Root-cause decision:

- Visible symptom: `training-api.ts` still suggested ownership of first-plan/voice compatibility
  names that current runtime did not import.
- Underlying cause: old compatibility re-exports survived after visible onboarding moved to
  structured review plus selected/manual creation paths.
- Canonical owner applied: backend import-map / route-facing facade cleanup while preserving
  `src/lib/first-plan-actions.ts` as the action owner.

G12 result:

- Removed no-caller compatibility re-exports from `src/lib/training-api.ts`:
  - `completeStructuredFirstPlanOnboarding`
  - `completeStructuredFirstPlanOnboardingForUser`
  - `generateVoiceToPlanDraft`
  - `confirmVoiceToPlanDraft`
- Preserved canonical first-plan/voice actions in `src/lib/first-plan-actions.ts`.
- Preserved live `training-api.ts` route/component exports.

Burndown update:

- `cleanup-burndown-v1`: `28/40` gates complete, `12` remaining, `70%`.
- Delta from G12: `+1` completed gate.

## Post-G12 Reassessment And G13 Selection — 2026-06-18

Status: complete / G12 accepted; next BACKEND/OPS devtools hygiene batch selected.

Root-cause decision:

- Visible symptom after G12: the selected facade-pruning gate was complete, but the cleanup track
  needed a next safe autonomous batch without drifting into line-count cleanup.
- Underlying cause: remaining candidates mix live route/component facades, browser-sensitive UI,
  validation infrastructure, generated artifact hygiene, and docs/source-of-truth drift.
- Canonical owner applied: Architecture source/import/docs reassessment with read-only subagents,
  then local devtools/dashboard hygiene for the selected next batch.

G12 acceptance:

- Accepted as complete.
- `src/lib/training-api.ts` no longer re-exports:
  - `completeStructuredFirstPlanOnboarding`
  - `completeStructuredFirstPlanOnboardingForUser`
  - `generateVoiceToPlanDraft`
  - `confirmVoiceToPlanDraft`
- Canonical ownership remains in `src/lib/first-plan-actions.ts`.
- Live route/component `training-api.ts` wrappers remain intact.

Post-G12 audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Remaining `training-api.ts` exports | required runtime facade / current compatibility | Keep blocked. Source proof and backend subagent found no remaining no-caller compatibility re-export strong enough for another bounded facade cleanup. |
| Backend ops/scripts | required local ops, required validation, or dirty/in-flight local work | Do not select by file size or historical cleanup momentum. |
| Manual calendar / source actions | browser-sensitive required runtime | Defer until a dedicated frontend cleanup gate defines exact browser QA coverage. |
| Hito DS / admin UI / `/test-calendar` | separate active owner, current runtime, or paused static sandbox | Defer; no deletion-ready same-owner frontend batch found. |
| Logs / generated artifacts / `qa-artifacts/` | generated/local or protected proof output | Keep dry-run only; no deletion without a separate retention policy. |
| `docs/work-dashboard.md` / dashboard refresh path | docs/devtools source-of-truth drift | Select BACKEND/OPS Slice G13. The dashboard can lag after plan closeout, and `package.json` lacks first-class refresh aliases for the existing dashboard helper. |

Selected next gate:

- BACKEND/OPS Slice G13: make the work dashboard refresh path first-class and stale-resistant.
- Expected burndown if accepted: `cleanup-burndown-v1` moves from `28/40` to `29/40`, `11`
  remaining, `72.5%`.
- This is not product work and not Admin live sync by default; it is local devtools/source-of-truth
  hygiene around `scripts/hito-work-dashboard.mjs`, `package.json`, and `docs/work-dashboard.md`.

Subagent preflight:

- Backend/import-map subagent accepted G12 and found no stronger backend/import-map deletion gate.
- Frontend/browser-risk subagent found no safe immediate frontend batch; remaining candidates need
  browser-specific gates or separate Hito DS/Admin ownership.
- Docs/devtools/artifact subagent found the real post-G12 drift: `docs/work-dashboard.md` still
  showed G12 as selected until regenerated, while artifact/log policy stayed aligned.

## Post-G11 Reassessment And G12 Selection — 2026-06-18

Status: complete / G11 accepted; next BACKEND facade-narrowing batch selected.

Root-cause decision:

- Visible symptom after G11: the duplicate-space local ops residue cleanup is complete, and the
  active cleanup track needs a fresh next gate without returning to line-count or cleanup momentum.
- Underlying cause: remaining candidates mix live runtime facade exports, browser-sensitive UI,
  validation infrastructure, generated artifact hygiene, and docs/source-of-truth drift.
- Canonical owner applied: Architecture read-only source/import/docs audit with subagent preflight,
  then backend import-map facade cleanup for the selected next batch.

G11 acceptance:

- Accepted as complete.
- `scripts/import-current-plan 2.mjs` and `scripts/validate-plan-preset-eligibility 2.ts` are gone.
- Canonical owners remain:
  - `scripts/import-current-plan.mjs`
  - `scripts/validate-plan-preset-eligibility.ts`
  - `scripts/author-plan-from-text.ts`
  - `src/lib/openai-plan-authoring.ts`
- Changelog remains unchanged because G11 was internal local ops cleanup, not shipped
  runner-facing behavior.

Post-G11 audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Duplicate-space ops residue | completed deletion | Keep gone; no further action. |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep blocked. Live route/component callers still use route data, auth, settings, workout logging, plan management, selected-plan, manual runtime wrappers, and active-plan lifecycle/refresh wrappers. |
| First-plan/voice compatibility re-exports in `training-api.ts` | completed compatibility-only sub-seam | Complete in G12. Removed only `completeStructuredFirstPlanOnboarding`, `completeStructuredFirstPlanOnboardingForUser`, `generateVoiceToPlanDraft`, and `confirmVoiceToPlanDraft` re-exports after source proof remained clean. |
| Frontend/manual calendar/admin/Hito DS cleanup | browser-sensitive or separate owner | Defer. No frontend cleanup batch is safer without dedicated browser QA scope. |
| Artifact/log deletion | generated/local hygiene | Defer. `artifact:hygiene` remains non-mutating and `qa-artifacts/` stays protected evidence. |
| `docs/current-state.md` date / broad cleanup pointer | weak docs drift | Defer. Not stronger than the source-proved backend facade seam. |

Subagent findings integrated:

- Backend/import-map subagent confirmed G11 files are absent and found exactly four no-caller
  first-plan/voice compatibility exports in `training-api.ts`.
- Frontend/UI subagent confirmed manual calendar, Hito DS, admin, and `/test-calendar` cleanup
  candidates remain browser-sensitive or separate product/design tracks.
- Docs/devtools subagent confirmed active plan, functional map, and work dashboard were aligned to
  G11 / `27/40` at selection time; G12 closeout now updates the active cleanup ledger to `28/40`.
- All three subagents were closed after their reports were integrated.

Burndown:

- Current ledger after G12 closeout is `cleanup-burndown-v1`: `28/40` gates complete,
  `12` remaining, `70%`.
- G12 delta: `+1` gate.

## Slice G11 Closeout — 2026-06-18

Status: complete / accepted pending next ARCHITECT cleanup reassessment.

Root-cause decision:

- Visible symptom: duplicate-space local ops residue files remained in the working tree and could
  confuse future cleanup/source audits.
- Underlying cause: local copied scripts outlived their canonical package/current-doc owners.
- Canonical owner applied: backend/devtools ops script hygiene.

G11 result:

- Deleted untracked duplicate-space local residue:
  - `scripts/import-current-plan 2.mjs`
  - `scripts/validate-plan-preset-eligibility 2.ts`
- Preserved canonical owners:
  - `scripts/import-current-plan.mjs`
  - `scripts/validate-plan-preset-eligibility.ts`
  - `scripts/author-plan-from-text.ts`
- Validation passed: duplicate-space source proof, `npm run import:current-plan`, Plan Preset
  eligibility validator, and scoped `git diff --check`.

Burndown update:

- `cleanup-burndown-v1`: `27/40` gates complete, `13` remaining, `67.5%`.
- Delta from G11: `+1` completed gate.

## Slice G10 Closeout And Post-G10 Reassessment — 2026-06-18

Status: complete / accepted; next BACKEND/OPS cleanup batch selected.

Root-cause decision:

- Visible symptom after G10: the selected text-authoring legacy entrypoint cleanup was complete, but
  the active plan and functional map still needed the next source-proofed gate.
- Underlying cause: local/legacy ops residue can survive after canonical package scripts and current
  docs move to safer owners.
- Canonical owner applied: Architecture acceptance closeout and read-only source/import audit, then
  BACKEND/OPS local script hygiene for the next batch.

G10 acceptance:

- Accepted as behavior-preserving cleanup.
- The stale tracked `scripts/author-plan-from-text.mjs` entrypoint was deleted.
- The supported text-authoring path remains `npm run author-plan-from-text` ->
  `scripts/author-plan-from-text.ts` -> `src/lib/openai-plan-authoring.ts`.
- Validation passed: source/reference proof, `npm run author-plan-from-text -- --help`, targeted
  ESLint for `scripts/author-plan-from-text.ts` and `src/lib/openai-plan-authoring.ts`, and scoped
  `git diff --check`.
- Changelog remains unchanged because G10 was internal ops/source cleanup, not a shipped
  runner-facing capability.

Post-G10 read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| `scripts/author-plan-from-text.mjs` | completed deletion | Keep deleted. TS-backed text authoring remains canonical. |
| `scripts/import-current-plan.mjs` | required local ops helper / hardened | Keep. Package command and current docs define it as non-mutating by default and loopback-guarded for apply. |
| `scripts/import-current-plan 2.mjs` | deletion-ready local residue | Select in Slice G11. It is untracked, has no current owner, imports deleted MJS helpers, defaults to a hardcoded Downloads path, and lacks current dry-run / loopback apply guards. |
| `scripts/validate-plan-preset-eligibility.ts` | required validation | Keep. It validates current Plan Preset card discovery and absence of old legacy builder artifacts. |
| `scripts/validate-plan-preset-eligibility 2.ts` | deletion-ready local residue | Select in Slice G11 after repeated source proof. It is an untracked duplicate-space validator copy and should not compete with the canonical validator. |
| Frontend/admin/Hito DS/manual calendar cleanup | browser-sensitive or required runtime | Defer. No frontend-visible cleanup batch is source-proved safe without dedicated browser QA. |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep blocked until fresh import proof identifies another tiny compatibility-only seam. |

Subagent findings integrated:

- Backend/import-map subagent confirmed G10 is complete, the TS text-authoring path remains
  required, and duplicate-space local ops residue is the only source-proved next implementation
  batch.
- Frontend/UI subagent confirmed no frontend/admin/Hito DS/manual-calendar cleanup is safe without
  browser-visible scope.
- Docs/devtools subagent confirmed burndown/dashboard drift and artifact/log policy stability.
- All three subagents were closed after their reports were integrated.

## Slice G9 Closeout And Stable Burndown Adoption — 2026-06-17

Status: complete / QA-passed; stable cleanup burndown adopted; next BACKEND/OPS cleanup batch
selected.

Root-cause decision:

- Visible symptom after G9: docs and the side dashboard still presented G9 as selected rather than
  accepted.
- Underlying cause: G9 crossed from implementation/QA into accepted cleanup, but the active
  simplification plan, functional map, and generated work dashboard had not yet been synced.
- Canonical owner applied: Architecture acceptance closeout and source-of-truth cleanup, not another
  frontend/admin runtime change.

G9 acceptance:

- Accepted as QA-passed behavior-preserving cleanup.
- `src/routes/admin.analytics.tsx` no longer exposes the future-only disabled `Add user` affordance
  in the Users header.
- `src/components/admin/AdminWorkspaceNav.tsx` no longer exposes the future-only disabled
  `Account settings / Soon` account-menu row.
- QA proved the managed server was current/healthy, source refs were gone, targeted ESLint passed,
  authenticated `/admin/analytics?section=users` and `/admin/capture` loaded, the admin account menu
  showed only current actions, desktop and `375px` mobile overflow checks passed, and artifacts were
  captured under `qa-artifacts/screenshots/2026-06-17/admin-placeholder-demotion-qa-rerun`.
- Changelog remains unchanged because G9 was internal cleanup/demotion of future-only admin
  placeholders, not a new shipped user-facing capability.

Post-G9 read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Admin UI placeholders (`Add user`, `Account settings / Soon`) | completed FRONTEND/ADMIN cleanup | Keep closed. Source proof found no removed placeholder refs in admin runtime files; the remaining `Account settings` match is an intentional Hito DS specimen. |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep blocked. Live callers still use route data, auth/login, settings, workout logging, plan management, selected-plan, and manual runtime wrappers. |
| Manual calendar / Hito DS / admin runtime cleanup | required runtime or browser-sensitive | Defer until a dedicated browser-safe cleanup gate selects one owner and validation story. |
| Artifact/log deletion | generated/local hygiene | Defer. `artifact:hygiene` remains non-mutating; `qa-artifacts/` stays protected proof evidence. |
| Legacy `scripts/author-plan-from-text.mjs` entrypoint | stale ops/source-of-truth mismatch | Select as Slice G10. Current docs and package ownership point to the TS-backed path, but the tracked MJS entrypoint still exists and imports stale helper paths. |

Subagent findings integrated:

- Backend/import-map subagent confirmed G9 does not affect backend runtime and identified the stale
  `scripts/author-plan-from-text.mjs` entrypoint as the safest next source-proved cleanup candidate.
- Frontend/UI subagent confirmed G9 source is clean and found no stronger frontend cleanup candidate
  that is safe without browser-visible scope.
- Docs/devtools subagent confirmed G9 wording and dashboard state were stale, and recommended
  source-of-truth closeout plus dashboard regeneration rather than runtime changes.
- All three subagents were closed after their reports were integrated.

Stable cleanup burndown ledger:

| Field | Value |
| --- | --- |
| Ledger version | `cleanup-burndown-v1` |
| Adopted | 2026-06-17, after G9 QA acceptance |
| Fixed denominator | 40 bounded cleanup gates |
| Completed through G20 | 37 gates |
| Remaining after G20 | 3 gates |
| Current gate-burndown completion | 92.5% |
| Current delta | `+1` completed gate from G20 |

Ledger rule:

- Use this fixed denominator for future cleanup reports instead of recalculating rough percentages
  from line-count impressions.
- Future closeouts should update completed/remaining gate counts by delta.
- Reset the denominator only through an explicit ARCHITECT source-of-truth decision.
- The burndown percentage is a sequencing/progress metric, not a product-code line-reduction claim.

## Slice G8 Closeout And Post-G8 Reassessment — 2026-06-17

Status: complete / QA-passed; next autonomous same-owner cleanup batch selected.

Root-cause decision:

- Visible symptom after G8: source-of-truth docs still pointed at a now-completed Hito DS cleanup
  slice.
- Underlying cause: G8 crossed from selected implementation gate to QA-passed cleanup, but the active
  simplification plan and functional map still needed closeout sync.
- Canonical owner applied: Architecture acceptance closeout, followed by read-only source/import
  reassessment before selecting one next cleanup batch.

G8 acceptance:

- Accepted as QA-passed behavior-preserving cleanup.
- `src/routes/hitoDS.tsx` no longer owns the duplicate inline `/hitoDS/export/figma` fallback.
- `src/routes/hitoDS_.export.figma.tsx` and `src/components/hito-ds/figma-export-board.tsx` remain
  the canonical route/component owners for the Figma export surface.
- QA proved `/hitoDS`, `/hitoDS#figma-bridge`, and `/hitoDS/export/figma` on desktop and `375px`
  mobile with zero console warn/error count.
- Changelog remains unchanged because G8 was internal cleanup, not a new shipped user-facing
  capability.

Post-G8 read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep. Remaining imports still include route data, auth/login, settings, workout logging, plan management, selected-plan, and manual runtime wrappers. |
| Hito DS Figma export fallback | completed cleanup | Keep closed. Source proof shows the export board is owned by the dedicated route/component, not the parent `/hitoDS` route. |
| Admin UI placeholders (`Add user`, `Account settings / Soon`) | browser-visible internal admin cleanup with one owner | Select as Slice G9. These are future-only affordances in frontend/admin rendering, with no backend mutation requirement. |
| Manual calendar source actions | required product runtime / browser-sensitive | Defer. Copy/Move/Clear/Edit behavior is accepted product runtime and needs a dedicated product-browser cleanup gate if touched. |
| Devtools/log retention | generated/local hygiene | Defer. `artifact:hygiene` remains non-mutating; no apply/delete mode is authorized and `qa-artifacts/` stays protected. |
| Docs/source-of-truth drift | docs-only | Fold into this closeout by replacing stale G8 next-gate wording with G9. |

Subagent findings integrated:

- Backend/import-map subagent confirmed no safe BACKEND runtime batch after G8 and classified broad
  `training-api.ts` cleanup as unsafe.
- Frontend/UI subagent identified the disabled admin placeholders as the strongest bounded
  browser-visible cleanup candidate with one owner and one validation story.
- Docs/devtools subagent confirmed G8 was still stale in current docs and found no stronger
  devtools/artifact cleanup gate.

Next selected gate:

FRONTEND/ADMIN Slice G9: demote future-only admin UI placeholders.

## Post-G7C Source-Proof Reassessment — 2026-06-17

Status: complete / one autonomous same-owner cleanup batch selected.

Root-cause decision:

- Visible symptom after G7C: cleanup routing could either drift into broad `training-api.ts`
  narrowing or stay stuck in tiny docs-only micro-gates.
- Underlying cause: the remaining candidates mix live route/component facades, browser-sensitive UI,
  proof infrastructure, docs drift, and generated/local hygiene; only source proof can separate them.
- Canonical owner applied: Architecture source-proof selection with read-only subagents, then one
  bounded owner handoff.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep. Current imports still use route data, login/auth, workout logging, plan management lifecycle/refresh/schedule wrappers, selected/first-plan actions, and manual runtime actions. |
| G7C manual review/confirm facade names | removed compatibility seam | Keep closed. The removed names no longer appear in `training-api.ts`; remaining matches are canonical manual authoring modules, proof scripts, or historical docs. |
| `ViewerSummary` in `training-api.ts` | type-only but no selected destination | Defer. Do not create a new type owner solely to reduce facade surface. |
| Manual calendar / manual-workout UI cleanup | required product runtime / browser-sensitive | Defer. Accepted manual Add/Copy/Move/Clear/Edit surfaces need their own product-browser cleanup gate if touched. |
| Docs/devtools drift | docs-only / very small | Fold into this closeout. `docs/current-functional-map.md` had one stale "post-G7A" hotspot label; artifact hygiene remains dry-run only and needs no implementation. |
| `/hitoDS/export/figma` duplicate route ownership | browser-sensitive internal DS cleanup with one owner | Select as Slice G8. The dedicated file route owns `/hitoDS/export/figma`; `src/routes/hitoDS.tsx` still has an old inline fallback that can be removed with targeted DS browser proof. |

Subagent findings integrated:

- Backend/import-map subagent confirmed no safe BACKEND implementation batch after G7C and classified
  broad `training-api.ts` cleanup as unsafe.
- Frontend/UI subagent confirmed the Hito DS Figma export fallback is the strongest bounded
  same-owner cleanup candidate, with medium but contained browser risk.
- Docs/devtools subagent confirmed source-proof holding was otherwise current, found one stale
  `post-G7A` label in the functional map, and confirmed `artifact:hygiene` remains non-mutating.
- All three subagents were closed after their reports were integrated.

Decision:

- Select `FRONTEND/DS Slice G8: remove duplicate /hitoDS/export/figma route ownership`.
- Keep broad `training-api.ts`, manual runtime UI, admin, validation thinning, local ops deletion,
  logs deletion, and `qa-artifacts/` cleanup deferred.
- Do not update changelog because this is internal DS/source cleanup, not a new shipped runner-facing
  product capability.

Cleanup progress estimate:

- Global simplification is still roughly `35-40%` complete, with about `60-65%` remaining.
- Rough remaining bounded gate count is now about `12-20`, depending on safe same-owner batching.

## Slice G7C Closeout — 2026-06-17

Status: complete / targeted manual-authoring review-confirm facade export narrowing accepted by
source validation.

Root-cause decision:

- Visible symptom before G7C: `training-api.ts` still looked like the owner for manual Copy/Paste
  and Move review/confirm server functions.
- Underlying cause: old compatibility re-exports survived after product behavior moved to direct
  manual mutation wrappers and canonical manual authoring owner modules.
- Canonical owner applied: `src/lib/manual-workout-authoring` and its `copy-paste.ts` /
  `move-workout.ts` submodules for review/confirm functions and `ForUser` proof helpers.

What changed:

- Removed `reviewManualWorkoutCopyPasteDraft(...)` and
  `confirmManualWorkoutCopyPasteDraft(...)` compatibility re-exports from `training-api.ts`.
- Removed `reviewManualWorkoutMove(...)` and `confirmManualWorkoutMove(...)` compatibility
  re-exports from `training-api.ts`.
- Preserved direct manual runtime wrappers in `training-api.ts`:
  `copyManualWorkoutWithinActivePlan`, `moveManualWorkoutWithinActivePlan`,
  `confirmManualWorkoutDeleteClear`, `reviewManualWorkoutDeleteClear`, Add/Create/Templates, and
  persisted-edit actions.
- Preserved canonical manual authoring exports and proof modules.

Validation evidence:

- `rg -n "reviewManualWorkoutCopyPasteDraft|confirmManualWorkoutCopyPasteDraft|reviewManualWorkoutMove|confirmManualWorkoutMove" src scripts package.json docs/current-functional-map.md docs/plans/active/2026-06-07-hito-stack-simplification-strike.md`
- `rg -n "from \"@/lib/training-api\"|from '@/lib/training-api'" src/components src/routes src/lib scripts --glob '!src/routeTree.gen.ts'`
- targeted ESLint for `src/lib/training-api.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `npm run build`
- scoped `git diff --check`

Next:

- Run an ARCHITECT reassessment before selecting any further cleanup. Do not continue narrowing
  `training-api.ts` by momentum; select only a source-proved bounded owner.

## Slice G7B Closeout — 2026-06-17

Status: complete / targeted runtime facade helper export narrowing accepted by source validation.

Root-cause decision:

- Visible symptom before G7B: `training-api.ts` still exposed user-scoped helper names that made the
  facade look like the owner for lifecycle/refresh helper behavior.
- Underlying cause: helper compatibility names survived after canonical lifecycle/refresh owner
  modules became stable and current UI callers used only top-level server-function wrappers.
- Canonical owners applied: `src/lib/active-plan-lifecycle-actions.ts` for active-plan lifecycle
  helpers and `src/lib/active-plan-refresh-actions.ts` for user-scoped refresh apply.

What changed:

- Removed `archiveActivePlanForUser(...)` and `clearUpcomingScheduleForUser(...)` compatibility
  exports from `training-api.ts`.
- Removed `applyActivePlanRefreshProposalForUser(...)` compatibility export from `training-api.ts`.
- Removed the now-dead local `applyActivePlanRefreshProposalForUserServer` bridge from
  `training-api.ts`.
- Preserved live top-level wrappers: `deleteActivePlan`, `clearUpcomingSchedule`,
  `proposeActivePlanRefresh`, and `applyActivePlanRefreshProposal`.
- Updated current docs where they previously described those no-caller helper names as public
  `training-api.ts` compatibility exports.

Validation evidence:

- `rg -n "archiveActivePlanForUser|clearUpcomingScheduleForUser|applyActivePlanRefreshProposalForUser" src scripts package.json docs/current-system.md docs/current-state.md docs/current-functional-map.md docs/plans/active/2026-06-07-hito-stack-simplification-strike.md`
- `rg -n "from \"@/lib/training-api\"|from '@/lib/training-api'" src/components src/routes src/lib scripts --glob '!src/routeTree.gen.ts'`
- targeted ESLint for touched source files
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `npm run build`
- scoped `git diff --check`

Next:

- Run an ARCHITECT reassessment before selecting any further cleanup. Do not continue narrowing
  `training-api.ts` by momentum; select only a source-proved bounded owner.

## Post-G7B Cleanup Reassessment — 2026-06-17

Status: complete / no BACKEND implementation batch selected after read-only audits.

Root-cause decision:

- Visible symptom after G7B: cleanup could drift either back into broad `training-api.ts` narrowing
  or sideways into browser-sensitive Hito DS cleanup.
- Underlying cause: the remaining candidates mix live runtime wrappers, type-only ownership without
  a selected destination, browser-sensitive internal routes, validation-only proof seams, local ops
  safety tooling, and docs/devtools hygiene.
- Canonical owner applied: architecture cleanup selection from fresh source/import/reference
  evidence. The next owner remains ARCHITECT source-proof reassessment; no BACKEND implementation
  starts until a new source-proved seam appears.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep. Current source imports still use route data, login, workout-log, plan-management, selected/first-plan, and manual runtime wrappers. G7B removed only no-caller helper compatibility names. |
| `ViewerSummary` in `training-api.ts` | type-only but no selected canonical destination | Defer. Do not create a new type owner solely to shrink the facade. |
| Manual Copy/Paste and Move review/confirm compatibility re-exports in `training-api.ts` | candidate backend facade seam but no selected safe implementation batch after latest audits | Historical hold after post-G7B reassessment. Superseded by Slice G7C after fresh source proof selected and completed this bounded backend facade seam. |
| Manual calendar and manual authoring hotspots | required runtime / browser-sensitive product UI | Defer. `Calendar.tsx`, manual authoring controls, source-action menu, and move controls own accepted Add/Copy/Move/Clear behavior and need a dedicated product-browser cleanup slice if touched. |
| Plan/manual/running validators and local ops scripts | live proof/safety tooling | Defer. Do not thin validation coverage or delete ops helpers for cleanup optics; select only with a dedicated proof-preserving owner. |
| Admin analytics/capture hotspots | current admin runtime | Defer. Admin cleanup needs its own admin route/source proof and validation boundary. |
| Generated logs, `test-results`, and `qa-artifacts` | generated/proof hygiene | Defer. `npm run artifact:hygiene` is dry-run only; `qa-artifacts/` remains protected until a separate QA evidence policy exists. |
| `/test-calendar` sandbox | paused static fake-only product-design sandbox | Keep paused. TC1/TC2 are accepted, no TC3 is selected, and reopening requires a concrete Product/Design question plus Architecture checkpoint. |
| `/hitoDS` Figma export double wiring | possible DS route ownership cleanup, but browser-sensitive | Defer. It needs a dedicated FRONTEND/DS gate with `/hitoDS`, `#figma-bridge`, `/hitoDS/export/figma`, and mobile proof; do not select it as a backend cleanup substitute. |

Decision:

- Accept the post-G7B reassessment correction.
- Select no immediate BACKEND implementation gate from the latest read-only audits.
- Put the simplification strike in ARCHITECT source-proof holding mode: reassess current
  source/import/reference evidence and select an autonomous batch only when one safe same-owner seam
  is proved.
- This post-G7B hold is historical after Slice G7C: G7C later removed the no-caller manual
  Copy/Paste and Move review/confirm compatibility re-exports after fresh source proof.
- Do not update changelog because this is internal facade/source cleanup, not a new runner-facing
  shipped capability.

Cleanup progress estimate:

- Global simplification remains roughly `35-40%` complete, with about `60-65%` remaining.
- Rough remaining bounded gate count remains about `13-21`; no implementation batch was selected,
  so the overall estimate remains unchanged.

## Slice G7A Reassessment Closeout — 2026-06-17

Status: complete / post-G7A architecture cleanup reassessment accepted.

Root-cause decision:

- Visible symptom after G7A: the cleanup track still needed a next gate, while current docs and
  source evidence could pull agents back toward broad `training-api.ts` cleanup.
- Underlying cause: `training-api.ts` remains a mixed route-facing facade with many live wrappers,
  but a few helper compatibility names and docs/source-truth lines lag behind current ownership.
- Canonical owner applied: architecture source/import reassessment. The next gate is selected only
  from fresh source proof, not file size or cleanup momentum.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep. Route data, auth/login, active-plan lifecycle/refresh/schedule-edit, selected/first-plan, workout-log, plan-replacement, and manual authoring wrappers remain live. |
| G7A seams: `persistImportedPlanForCurrentRequest`, `saveUserSettings` | complete compatibility cleanup | Accepted. Fresh source proof shows these names are gone from `training-api.ts`; canonical owners remain `plan-replacement-actions.ts` and `user-settings-actions.ts`. |
| `archiveActivePlanForUser`, `clearUpcomingScheduleForUser`, `applyActivePlanRefreshProposalForUser` in `training-api.ts` | no-caller helper compatibility names with canonical owners | Select as G7B. Fresh source proof found no current source caller importing these names from `training-api.ts`; canonical functions already exist in lifecycle/refresh owner modules. |
| `ViewerSummary` in `training-api.ts` | type-only but no selected canonical destination | Defer. Do not create a new type owner solely to reduce facade surface. |
| Manual calendar/source-action frontend | required runtime / browser-sensitive | Defer. Accepted Copy/Move/Clear/Add behavior needs a dedicated browser-safe frontend cleanup gate if touched. |
| Hito DS Figma export double wiring | possible frontend/DS cleanup | Defer. It requires a dedicated DS/browser proof gate and is lower priority than the source-proved backend helper batch. |
| Docs/devtools drift | docs-only source-of-truth sync | Partially fixed in this closeout for G7A truth. Local artifact cleanup remains dry-run only; do not delete logs or `qa-artifacts`. |

Subagent findings integrated:

- Backend/import-map explorer confirmed broad `training-api.ts` cleanup is unsafe, G7A is
  source-confirmed complete, and the three user-scoped helper exports are the only plausible later
  backend facade seam.
- Frontend/UI explorer confirmed manual calendar/source-action cleanup is browser-sensitive and
  should not be selected casually; Hito DS export double wiring is a later bounded DS candidate.
- Docs/devtools explorer confirmed `/test-calendar` ownership is consistent after G6, artifact
  hygiene remains non-mutating, and current source-of-truth docs needed G7A alignment.

Decision:

- Accept the post-G7A reassessment.
- Historical decision at that checkpoint: select Slice G7B for the no-caller user-scoped
  `training-api.ts` helper compatibility exports. Slice G7B is now complete and is not current next
  work.
- Do not update changelog because this is internal cleanup/source-of-truth alignment, not a shipped
  runner-facing capability.

Cleanup progress estimate:

- Global simplification remains roughly `35-40%` complete, with about `60-65%` remaining.
- Rough remaining bounded gate count remains about `13-21`; G7B is intentionally small and does not
  materially change the overall estimate.

## Slice G7A Closeout — 2026-06-17

Status: complete / targeted runtime facade import-map narrowing accepted by source validation.

Root-cause decision:

- Visible symptom before G7A: `training-api.ts` still looked like the owner for imported-plan
  persistence and user-settings save contracts.
- Underlying cause: compatibility re-exports survived after canonical owner modules became stable.
- Canonical owners applied: `src/lib/plan-replacement-actions.ts` for
  `persistImportedPlanForCurrentRequest`, and `src/lib/user-settings-actions.ts` for
  `saveUserSettings`.

What changed:

- Removed the unused `persistImportedPlanForCurrentRequest` re-export from `training-api.ts`.
- Moved `src/routes/settings.tsx` to import `saveUserSettings` directly from
  `src/lib/user-settings-actions.ts`.
- Removed the `saveUserSettings` re-export from `training-api.ts`.
- Preserved `getSettingsRouteData` and all other live route/component server-function wrappers in
  `training-api.ts`.

Validation evidence:

- `rg -n "persistImportedPlanForCurrentRequest|saveUserSettings" src scripts package.json`
- `rg -n "@/lib/training-api" src/components src/routes src/lib scripts`
- `npm exec eslint -- src/lib/training-api.ts src/routes/settings.tsx src/lib/user-settings-actions.ts`
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `npm run build`
- scoped `git diff --check`

Next:

- Run an ARCHITECT reassessment before selecting any further cleanup. Do not continue narrowing
  `training-api.ts` without a fresh source/import proof and a selected bounded gate.

## Slice G7 Closeout — 2026-06-17

Status: complete / post-G6 cleanup reassessment accepted.

Root-cause decision:

- Visible symptom before G7: after G6, the active-plan root was cleaner, but cleanup could still
  drift back toward line-count or momentum-based implementation slices.
- Underlying cause: remaining candidates mix live runtime facades, browser-sensitive UI, validation
  coverage, source-of-truth drift, and generated/local artifact hygiene.
- Canonical owner applied: Architecture cleanup selection from current source/import/reference
  evidence before choosing the next BACKEND, FRONTEND, DEVTOOLS, QA, or docs gate.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep. Current route/component imports still use route data wrappers, auth/login wrappers, settings loader, active-plan lifecycle/refresh/schedule-edit wrappers, selected/first-plan actions, workout logging, and manual runtime actions. |
| `persistImportedPlanForCurrentRequest` re-export | compatibility-only / deletion-ready facade sub-seam | Select as part of G7A. Fresh `rg` showed no external source caller imports this through `training-api.ts`; canonical ownership is `src/lib/plan-replacement-actions.ts`. |
| `saveUserSettings` re-export | small runtime action facade sub-seam with direct canonical owner | Select conditionally as part of G7A. Fresh `rg` showed one facade caller in `src/routes/settings.tsx`, while the server function is already defined by `src/lib/user-settings-actions.ts`. |
| Manual calendar/source-action UI | required runtime / browser-sensitive | Defer. `Calendar.tsx`, `ManualWorkoutSourceActionMenu.tsx`, move controls, and authoring controls own accepted manual calendar behavior and require a dedicated browser-safe frontend cleanup gate. |
| Hito DS route/export fallback branch | compatibility-only candidate but browser-visible DS route | Defer. Source proof suggests the dedicated `/hitoDS/export/figma` route owns export, but this is a separate FRONTEND/DS gate with browser proof, lower priority than the safer backend import-map batch. |
| Admin UI placeholders | future-only / demotion candidate | Defer. Potentially safe, but admin UI cleanup needs its own admin/browser validation boundary. |
| `docs/current-state.md` archived baseline reference | docs-only drift | Fixed in this checkpoint by pointing the canonical reference to the archived baseline plan. |
| Artifact/log cleanup | generated/local hygiene | Defer. `npm run artifact:hygiene` remains dry-run only; do not delete logs or `qa-artifacts` in this track. |

Subagent findings integrated:

- Backend/import-map explorer confirmed broad `training-api.ts` cleanup is still unsafe but identified
  the two G7A sub-seams above as source-proved candidates.
- Frontend/UI explorer confirmed manual calendar/source-action surfaces are live and browser-risky,
  and identified the Hito DS export fallback branch as a later bounded frontend/DS candidate.
- Docs/devtools explorer confirmed no safe artifact deletion gate and found the stale
  `docs/current-state.md` active-path reference repaired by this G7 checkpoint.

Decision:

- Accept Slice G7 as complete.
- Select one immediate next cleanup gate:
  `BACKEND Slice G7A: targeted training-api import-map cleanup batch`.
- Do not update changelog because G7 is architecture/source-of-truth cleanup and G7A is internal
  import-map cleanup, not shipped runner-facing behavior.

Cleanup progress estimate:

- After G7 acceptance, global simplification remains roughly `35-40%` complete, with about `60-65%`
  remaining.
- Rough remaining bounded gate count is about `13-21`, depending on how many future same-owner
  cleanup seams can be batched safely after read-only proof.

## Slice G6 Closeout — 2026-06-16

Status: complete / docs-source-of-truth demotion accepted.

Root-cause decision:

- Visible symptom before G6: `docs/plans/active/` still contained a paused `/test-calendar` sandbox
  plan even though no TC3 or immediate sandbox execution owner was selected.
- Underlying cause: historical sandbox execution docs remained in the active-plan root after Hito DS
  IA/specimen/Figma bridge work became the active DS owner.
- Canonical owner fixed: documentation/source-of-truth. The paused sandbox plan now lives in
  `docs/plans/archive/` as historical evidence, while the Hito DS IA plan remains active.

What changed:

- Moved `docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md` to
  `docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md`.
- Preserved import-ready metadata and changed status to `archived`.
- Updated source-of-truth references so the active-plan root no longer treats paused
  `/test-calendar` work as current execution.
- Kept `/test-calendar` runtime/source, Hito DS implementation, and QA artifacts untouched.

Validation:

- Source/reference proof checked `test-calendar`, `/test-calendar`, `Hito DS`, `specimen`, and
  `Figma bridge` references across plans, current docs, tasks, and changelog.
- Scoped `git diff --check` passed for touched markdown.
- The requested `npm run ...` wrappers could not run in this desktop shell because `npm` was not on
  `PATH`; the equivalent scripts passed through the bundled Codex Node runtime:
  `node --env-file=.env.local --import tsx ./scripts/import-repo-work-items-to-admin-backlog.ts --dry-run --timeout-ms 30000`
  and `node --import tsx ./scripts/validate-admin-capture-backlog.ts`.

Decision:

- Accept Slice G6 as complete.
- Do not update changelog because this is docs/source-of-truth hygiene, not a shipped
  runner-facing behavior change.
- Next recommended role: Architect should run Slice G7 as a post-G6 cleanup reassessment from the
  compact active-plan root.

## Slice G5F Closeout — 2026-06-16

Status: complete / behavior-preserving backend ops persistence cleanup.

Root-cause decision:

- Visible symptom before G5F: after G5E, local ops scripts no longer duplicated plan builders but
  still duplicated profile / plan cycle / planned workout apply and readback orchestration.
- Underlying cause: historical local ops scripts predated the current runtime active-plan persistence
  seams and evolved as separate apply paths.
- Direct runtime persistence reuse was not selected because the runtime seam creates its own admin
  Supabase client from environment configuration. That would be the wrong owner for local ops
  mutation safety, where entrypoints must retain explicit dry-run and local-loopback guards.
- Canonical owner fixed: a narrow ops-local helper now owns only shared local apply/readback logic
  and receives the already-created, caller-guarded Supabase client.

What changed:

- Added `scripts/lib/ops-plan-apply.ts` for shared local ops profile upsert, active-plan archive,
  plan cycle insertion, planned workout insertion, and readback.
- `scripts/import-current-plan.mjs`, `scripts/author-structured-plan.mjs`, and
  `scripts/test-user.mjs` now call that helper for plan apply/readback instead of carrying local
  duplicate blocks.
- The helper reuses canonical `buildPersistedWorkoutInsertRows(...)` from runtime persistence
  support, but does not create a Supabase client or own mutation-safety decisions.

Validation:

- Source/import proof showed the duplicated plan-apply row creation/readback code now lives in one
  ops helper.
- `node --check` passed for touched `.mjs` entrypoints.
- Targeted ESLint passed for touched ops scripts and helper.
- `npm run import:current-plan` printed non-mutating help.
- `node --env-file=.env.local ./scripts/import-current-plan.mjs --dry-run --plan-file scripts/fixtures/rich-workout-saved-mode-fixture.json` stayed non-mutating.
- `node --env-file=.env.local ./scripts/import-current-plan.mjs --apply --plan-file scripts/fixtures/rich-workout-saved-mode-fixture.json` remained blocked without the local-loopback mutation flag.
- `author-structured-plan` and `test-user` no-argument checks failed before mutation with usage/missing-input errors.
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `npm run build`
- scoped `git diff --check`

Decision:

- Accept Slice G5F as complete.
- Do not update changelog because G5F is internal ops/import cleanup, not a runner-facing shipped
  capability.
- Next recommended role: Architect should run Slice G6 as docs/source-of-truth demotion for the
  paused `/test-calendar` sandbox plan.

## Post-G5F Cleanup Batch Selection — 2026-06-16

Status: complete / next owner selected.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Backend ops/import-map after G5F | docs/devtools + live runtime + proof-infrastructure | Defer implementation. G5F source evidence matches the report, and remaining backend candidates are live, required proof entrypoints, or docs/devtools helpers. |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Defer. Current route/component imports still rely on it; do not narrow by line count or momentum. |
| Frontend manual calendar / source-action cleanup | live browser-sensitive runtime | Defer. A small `ManualWorkoutSourceActionMenu` import cleanup may exist, but it touches accepted menu behavior and requires browser QA, so it is not the safest immediate post-G5F gate. |
| Hito DS / `/test-calendar` implementation cleanup | browser-reachable DS/devtools surfaces | Defer implementation. Keep runtime routes and sandbox code intact. |
| Local artifact/log retention apply mode | generated/local hygiene | Defer. `npm run artifact:hygiene` remains dry-run only, and `qa-artifacts/` remain protected evidence until a separate QA evidence policy exists. |
| Paused `/test-calendar` active plan | docs/source-of-truth drift | Select. The sandbox is paused with no TC3 selected, while the Hito DS IA/specimen contract plan owns the active DS/specimen/Figma bridge rollout. |

Selected next cleanup gate:

`ARCHITECT Slice G6: demote/archive the paused /test-calendar sandbox plan from active execution`.

Batching decision:

- This is a docs/source-of-truth batch, not runtime cleanup.
- Batching is intentionally narrow: classify and demote/archive the paused `/test-calendar` active
  plan only if source evidence confirms it no longer owns active execution.
- Keep `/test-calendar` route/source and QA artifacts untouched.
- Keep the Hito DS IA/specimen contract plan as the active owner for DS/specimen/Figma bridge
  rollout.

Cleanup progress estimate:

- After G5F acceptance, global simplification is roughly `35-40%` complete, with about `60-65%`
  remaining.
- Rough remaining bounded gate count is about `14-22`, depending on how many future same-owner
  cleanup seams can be batched safely.

## Slice G5E Closeout — 2026-06-16

Status: complete / behavior-preserving backend ops import cleanup.

Root-cause decision:

- Visible symptom before G5E: local ops scripts still carried historical `.mjs` plan-seed /
  structured-authoring helper ownership beside current TypeScript owners.
- Underlying cause: the ops scripts predated the canonical `src/lib/imported-plan.ts` and
  `src/lib/structured-plan-authoring.ts` seams.
- Canonical owner fixed: local ops entrypoints now call the TypeScript imported-plan and structured
  authoring owners directly through `tsx/esm/api` scoped imports, without introducing a third bridge
  layer.

What changed:

- `scripts/import-current-plan.mjs`, `scripts/author-structured-plan.mjs`, and
  `scripts/test-user.mjs` now load canonical TypeScript owners instead of local duplicate helper
  files.
- Deleted duplicate local helper modules:
  `scripts/lib/imported-plan-seed.mjs` and `scripts/lib/structured-plan-authoring.mjs`.
- Preserved public package command names and the G4F `import:current-plan` safety contract:
  default/help remains non-mutating, dry-run remains non-mutating, and apply remains blocked without
  the explicit local-loopback mutation flag.

Validation:

- Source/import proof showed no remaining imports of `scripts/lib/imported-plan-seed.mjs` or
  `scripts/lib/structured-plan-authoring.mjs`.
- `node --check` passed for touched `.mjs` entrypoints.
- Targeted ESLint passed for touched ops scripts.
- `npm run import:current-plan` printed non-mutating help.
- `node --env-file=.env.local ./scripts/import-current-plan.mjs --dry-run --plan-file scripts/fixtures/rich-workout-saved-mode-fixture.json` stayed non-mutating.
- `node --env-file=.env.local ./scripts/import-current-plan.mjs --apply --plan-file scripts/fixtures/rich-workout-saved-mode-fixture.json` remained blocked without the local-loopback mutation flag.
- `author-structured-plan` and `test-user` no-argument checks failed before mutation with usage/missing-input errors.
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `npm run build`
- scoped `git diff --check`

Decision:

- Accept Slice G5E as complete.
- Do not update changelog because G5E is internal ops/import cleanup, not a runner-facing shipped
  capability.
- Next recommended role: Backend should run Slice G5F as the next same-owner ops cleanup batch.

## Post-G5E Cleanup Batch Selection — 2026-06-16

Status: complete / next owner selected.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Defer. Remaining imports are still route/component server-function wrappers or live contract consumers; do not continue facade cleanup by file size. |
| Product frontend/manual calendar cleanup | live browser-sensitive runtime | Defer. Manual calendar controls still own accepted Copy/Move/Clear, drag/drop, dialogs, mobile behavior, and backend-shaped capability rendering. |
| Hito DS Figma export defensive route branch | small frontend/DS cleanup candidate | Defer. There is source evidence for a narrow cleanup, but it requires browser proof and is lower leverage than the ops seam directly exposed by G5E. |
| Docs/devtools source-of-truth compression | docs-only candidate | Defer. G5E is already recorded as complete; historical sections are noisy but not currently blocking the next implementation gate. |
| Local artifact/log retention apply mode | generated/local hygiene | Defer. L1 is dry-run only, and `qa-artifacts/` remain protected evidence until a separate QA evidence retention policy exists. |
| Ops plan-apply persistence blocks | backend ops/script cleanup candidate | Select. `import-current-plan`, `author-structured-plan`, and `test-user --plan` now use canonical TS plan builders, but still duplicate similar Supabase profile/plan/workout apply/readback logic. |

Selected next cleanup gate:

`BACKEND Slice G5F: ops plan-apply persistence consolidation audit and cleanup`.

Batching decision:

- This remains a same-owner backend ops/script batch, directly following the root cause exposed by
  G5E.
- Batching is safe only within the three local ops entrypoints and any narrow helper they can share.
- The slice must first prove whether existing canonical active-plan/imported-plan persistence seams
  can be reused without weakening local-loopback mutation guards.
- If canonical runtime persistence cannot be reused safely, Backend may extract only a narrow
  ops-local helper for duplicated row-apply/readback code, or stop and report the blocker.

Cleanup progress estimate:

- After G5E acceptance, global simplification is roughly `33-38%` complete, with about `62-67%`
  remaining.
- Rough remaining bounded gate count is about `15-23`, depending on how many future same-owner
  cleanup seams can be batched safely.

## Slice G5D Closeout — 2026-06-16

Status: complete / behavior-preserving backend import-contract cleanup.

Root-cause decision:

- Visible symptom before G5D: `training-api.ts` still looked like the owner for many manual-authoring
  contracts.
- Underlying cause: manual-authoring runtime server actions and pure type contracts still shared the
  same compatibility facade.
- Canonical owner fixed: backend import/export contract ownership for pure manual-authoring types.

What changed:

- Pure `ManualWorkout*` and `ManualEmpty*` type imports in manual/onboarding components now import
  from `src/lib/manual-workout-authoring` or `src/lib/manual-workout-authoring/schema`.
- Runtime manual server-function/action imports remain in `training-api.ts`.
- Proved-unused manual type re-exports were removed from `training-api.ts`.

Validation:

- Source/import proof before and after with
  `rg -n "@/lib/training-api" src/components src/routes src/lib scripts`.
- `npm exec eslint -- src/lib/training-api.ts src/components/OnboardingGate.tsx src/components/onboarding/ManualUserBuiltPlanPanel.tsx src/components/manual-workout/ManualWorkoutAuthoringControls.tsx src/components/manual-workout/ManualWorkoutConstructorEditor.tsx src/components/manual-workout/ManualWorkoutMoveControls.tsx src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx src/components/manual-workout/manual-workout-authoring-utils.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
- `npm run build`
- scoped `git diff --check`

Decision:

- Accept Slice G5D as complete.
- Keep runtime manual server-function/action imports in `training-api.ts`; broad facade cleanup is
  still unsafe without a newly proved non-runtime seam.
- Do not update changelog because G5D is internal import-contract cleanup, not a new runner-facing
  shipped capability.

## Post-G5D Cleanup Batch Selection — 2026-06-16

Status: complete / next owner selected.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Broad `training-api.ts` cleanup | unsafe current-runtime facade | Keep. Route data, auth, settings, lifecycle, selected-plan, workout-log, and manual action wrappers remain live. |
| `ViewerSummary` type in `training-api.ts` | suspect type-only seam without selected canonical owner | Defer. Do not create a new type owner just to reduce facade surface. |
| Product frontend/manual calendar cleanup | live browser-sensitive runtime | Pause. `Calendar.tsx`, manual authoring controls, source action menu, and move controls own accepted desktop/mobile menu, drag/drop, toast, dialog, and refresh behavior. |
| Docs/devtools source-of-truth drift | docs-only | Resolve in this closeout by replacing stale G5D-next text with the new selected G5E gate. |
| Local artifact/log retention after L1 | generated/local hygiene | Defer. L1 is dry-run only; deletion/apply mode still needs explicit retention approval and must not touch `qa-artifacts/`. |
| Ops plan-seed `.mjs` helper seam | backend ops/script cleanup candidate | Select. `import-current-plan`, `author-structured-plan`, and `test-user` still use `.mjs` seed/structured helper modules while canonical TS owners exist. |

Selected next cleanup gate:

`BACKEND Slice G5E: ops plan-seed canonicalization audit and cleanup`.

Batching decision:

- This is a same-owner backend ops/import cleanup batch.
- Batching is safe only because the selected files are local ops scripts and helper modules, not
  product runtime or browser UI.
- The batch is still safety-sensitive because some scripts can mutate Supabase; validation must keep
  default/dry-run behavior non-mutating and preserve local-loopback-only apply guards.

Cleanup progress estimate:

- After G5D acceptance, global simplification is roughly `31-36%` complete, with about `64-69%`
  remaining.
- Rough remaining bounded gate count is about `16-24`, depending on how many future gates can batch
  same-owner proof-backed seams.

## Slice G5C Closeout — 2026-06-16

Status: complete / QA-passed behavior-preserving frontend cleanup.

Root-cause decision:

- Visible symptom before G5C: manual calendar source-action source still looked copy-only after the
  accepted menu became Copy / Move / Clear.
- Underlying cause: the stale `ManualWorkoutCopyMenu` compatibility alias remained after the
  `ManualWorkoutSourceActionMenu` extraction.
- Canonical owner fixed: frontend source-action naming/import ownership. Backend mutation truth,
  persistence, date truth, metadata, and metric truth were preserved.

QA acceptance evidence:

- `rg -n "ManualWorkoutCopyMenu" src` returned zero refs.
- `Calendar.tsx` imports/renders `ManualWorkoutSourceActionMenu` directly.
- Saved manual calendar source-action menu still exposes Copy, Move, and Clear.
- Copy/Paste persisted through the accepted backend seam.
- Move preserved the same planned workout row id while moving dates.
- Clear rendered the backend-shaped review dialog with Restore / Put back / Redo copy.
- Mobile `375px` had no horizontal overflow.
- Disposable auth/local/DB fixture cleanup returned to zero.
- No fake pace or fake personal HR was found.

Decision:

- Accept Slice G5C as QA-passed.
- Record it as cleanup validation, not a new shipped feature. Changelog is not updated because the
  runner-facing Copy/Move/Clear capability already existed; this slice removed stale naming and
  compatibility surface without adding behavior.
- Pause further product frontend/manual-calendar cleanup until a fresh browser-safe seam is selected.

## Post-G5C Cleanup Batch Selection — 2026-06-16

Status: complete / next owner selected.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| Product frontend/manual calendar cleanup | live browser-sensitive runtime | Pause. G5C is accepted, but `Calendar.tsx` and manual authoring controls own live desktop/mobile/drag/drop/menu/dialog behavior. Do not continue by file size. |
| Hito DS/admin UI cleanup | separate runtime/IA tracks | Defer. Hito DS belongs to the DS IA rollout; Admin needs a dedicated source/import proof gate. |
| Docs/devtools source-of-truth drift | docs-only | Resolved in this closeout by marking G5C QA-passed and selecting the next immediate gate. L1 retention policy still forbids deletion/apply mode. |
| `training-api.ts` broad cleanup | unsafe current-runtime facade | Keep. Route-facing wrappers and runtime manual actions remain live. |
| Manual-authoring type-only facade narrowing | bounded backend import-contract cleanup | Select. Pure `ManualWorkout*` / `ManualEmpty*` type imports can move to canonical manual-authoring owners if source proof shows they do not require the facade. |

Historical selected next cleanup gate at the G5C checkpoint:

`BACKEND Slice G5D: manual-authoring type-only facade narrowing`.

Batching decision:

- This is a same-owner backend/import-contract cleanup batch.
- Batching is safe only for pure type imports and proved-unused type re-exports.
- It is not safe to include runtime manual server-function exports/actions, browser behavior,
  Supabase, migrations, OpenAI, artifact hygiene, Hito DS, Admin, or broad `training-api.ts`
  narrowing.

Cleanup progress estimate:

- After G5C acceptance, global simplification remains roughly `30-35%` complete, with about
  `65-70%` remaining. G5C was valuable but intentionally small.
- Rough remaining bounded gate count is now about `17-25`, depending on how many future gates can
  safely batch same-owner seams after read-only proof.

## Slice L1 Closeout — 2026-06-16

Status: complete / local artifact hygiene dry-run tooling implemented.

What changed:

- Added `npm run artifact:hygiene` as a non-mutating local artifact inventory command.
- Added `scripts/report-local-artifact-hygiene.mjs` as the dry-run reporter for `logs/`,
  build-output residues, and `test-results/`.
- Added `test-results/` to `.gitignore` after source proof showed `test-results/.last-run.json` was
  generated, untracked, and not intentionally ignored.
- Kept `qa-artifacts/` protected: excluded by default, counted only with
  `--include-qa-artifacts`, and always reported as non-disposable.
- Updated current docs to keep generated/proof artifact boundaries explicit.

Validation:

- `node --check scripts/report-local-artifact-hygiene.mjs`
- `npm run artifact:hygiene`
- `node ./scripts/report-local-artifact-hygiene.mjs --root <temporary-fixture>`
- `node ./scripts/report-local-artifact-hygiene.mjs --include-qa-artifacts`
- `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs`
- scoped `git diff --check`

Observed current repo inventory:

- `logs/`: recent raw local diagnostic/build output, about `19.9 MB`.
- `test-results/`: generated test-runner residue, `45 B`.
- `qa-artifacts/`: protected QA evidence, about `696.2 MB`, counted only with explicit opt-in.

## Post-L1 Cleanup Batch Selection — 2026-06-16

Status: complete / next owner selected.

Root-cause finding:

- Visible symptom: cleanup routing is still too granular when every small compatibility seam becomes
  a separate prompt.
- Underlying cause: remaining candidates mix live runtime ownership, protected local artifacts, and
  browser-sensitive frontend compatibility naming. L1 closed the artifact dry-run gap, so the next
  safe implementation batch should be selected from current import/source proof rather than cleanup
  momentum.
- Canonical owner selected: FRONTEND, because the strongest proved seam is a stale manual
  source-action alias in rendering/import naming, not backend mutation truth.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| `training-api.ts` remaining exports | current-runtime facade / unsafe broad cleanup | Keep. Current route/component wrappers and manual authoring imports are still live; do not narrow by line count. |
| Manual authoring type cluster import map | broad current-runtime audit candidate | Defer. It needs a dedicated backend import-map audit before implementation. |
| `ManualWorkoutCopyMenu` alias | live frontend compatibility alias / safe bounded cleanup with QA | Select. It is stale naming around the accepted `ManualWorkoutSourceActionMenu` owner and can be cleaned as one frontend batch. |
| Devtools/log hygiene after L1 | generated/local hygiene | Defer. L1 added dry-run reporting; deletion/apply mode needs a separate retention policy and must not touch QA evidence. |
| Docs/source-of-truth drift | docs-only | Sync in this checkpoint by pointing the active plan and functional map at G5C and aligning retention wording to the L1 reporter. |

Selected next cleanup gate:

`FRONTEND Slice G5C: manual source-action naming and alias cleanup`.

Batching decision:

- This was a bundled same-owner frontend cleanup batch, not a cross-track implementation.
- Batching was safe because all included edits were one source-action rendering/import seam:
  `Calendar.tsx`, `ManualWorkoutSourceActionMenu.tsx`, and
  `ManualWorkoutAuthoringControls.tsx`.
- It is not safe to include backend manual authoring type cleanup, `training-api.ts` runtime wrapper
  narrowing, devtools deletion/apply mode, Hito DS cleanup, or QA artifact policy in the same gate.
- Frontend implementation preserved accepted source-action behavior by only renaming the import/local
  helper and removing the stale alias. QA later accepted the slice; see `Slice G5C Closeout`.

Cleanup progress estimate:

- After G4F, G5A, G5B, G4D/G4E, and L1, global simplification is now roughly `30-35%` complete,
  with about `65-70%` remaining.
- Rough remaining bounded gate count is about `18-26`, depending on how many future cleanup batches
  can safely combine same-owner seams after read-only proof.

## Slice G4F Closeout — 2026-06-16

Status: complete / `import:current-plan` hardened as local-only ops helper with non-mutating
defaults.

Decision:

- Path A, harden, was selected. The script remains available as a local ops helper, but the easy
  package path no longer performs a mutation.

What changed:

- `package.json` no longer passes a hardcoded `/Users/ivan/Downloads/...` plan file to
  `scripts/import-current-plan.mjs`.
- No-argument `npm run import:current-plan` now prints usage/help and exits without mutation.
- `--dry-run --plan-file <path>` parses the provided `training-plan-v2` JSON, builds the imported
  plan seed, reads the local-bypass account, and reports the configured Supabase target without
  creating a Supabase client.
- `--apply` requires both `--allow-local-supabase-mutation` and a loopback
  `NEXT_PUBLIC_SUPABASE_URL`; remote Supabase targets are blocked.
- The current `.env.local` remote Supabase project `dltfjwexyctmihclcjqj` was observed only through
  non-mutating dry-run/preflight output and was not mutated.

Validation:

- `node --check scripts/import-current-plan.mjs`
- `npm run import:current-plan`
- `node --env-file=.env.local ./scripts/import-current-plan.mjs --dry-run --plan-file scripts/fixtures/rich-workout-saved-mode-fixture.json`
- `node --env-file=.env.local ./scripts/import-current-plan.mjs --apply --plan-file scripts/fixtures/rich-workout-saved-mode-fixture.json`
- `node --env-file=.env.local ./scripts/import-current-plan.mjs --apply --plan-file scripts/fixtures/rich-workout-saved-mode-fixture.json --allow-local-supabase-mutation`

Next cleanup candidates:

1. Frontend `ManualWorkoutCopyMenu` compatibility alias removal with browser/source proof.
2. Backend manual-authoring type cluster import-map audit before any runtime narrowing.
3. Devtools local log/artifact retention hygiene with explicit QA evidence retention boundaries.

## Post-G4F Cleanup Batch Selection — 2026-06-16

Status: complete / next owner selected.

Root-cause finding:

- Visible symptom: cleanup is slowing down when every small seam becomes a separate prompt, while
  generated/local roots continue to make the repo look noisy.
- Underlying cause: post-G4F runtime cleanup candidates are either still live (`training-api.ts`
  wrappers and manual authoring type imports) or browser-sensitive (`ManualWorkoutCopyMenu` alias),
  while local artifact hygiene is already policy-defined but lacks a safe dry-run tool.
- Canonical owner: tooling/devtools cleanup executed by BACKEND, because this repo has no separate
  `DEVTOOLS` role file and the slice touches scripts/config/docs rather than product runtime.

Read-only audit findings:

| Candidate | Classification | Decision |
| --- | --- | --- |
| `training-api.ts` remaining exports | current-runtime facade / unsafe broad cleanup | Keep. Route/component server-function wrappers and manual authoring imports are still live. Do not narrow by line count. |
| `ManualWorkoutCopyMenu` alias | completed later in Slice G5C | Historical at this checkpoint. Slice G5C later removed the alias and QA proved Copy/Move/Clear behavior was preserved. |
| Manual authoring type cluster import map | broad current-runtime audit candidate | Defer. It needs a dedicated import-map audit before any implementation. |
| `logs/` / build-server logs / `test-results/` | generated local hygiene | Select. Existing policy already separates these from product source and forbids QA evidence deletion. |
| `qa-artifacts/` | protected QA evidence | Keep protected. Count/report only if explicitly scoped; no deletion in this batch. |

Selected next cleanup gate:

`BACKEND / DEVTOOLS Slice L1: local artifact hygiene dry-run tooling batch`.

Batching decision:

- This is a bundled same-owner cleanup batch, not a cross-product refactor.
- Batching is safe because all included work is local generated-artifact inventory/reporting and
  optional ignore/dry-run guidance. It does not touch product runtime, frontend interaction, backend
  persistence, Supabase, OpenAI, or QA evidence deletion.
- Do not bundle `ManualWorkoutCopyMenu`, manual authoring type imports, or additional
  `training-api.ts` narrowing into L1.

Cleanup progress estimate:

- Keep global simplification at about `25-30%` complete, with about `70-75%` remaining.
- Rough remaining gate count after G4F remains about `20-29` bounded gates. L1 is expected to
  reduce local audit noise but should not be counted as product/runtime simplification.

## Slice G4E Bundled Type-Only Facade Closeout — 2026-06-16

Status: G4E complete / same-class type-only facade cleanup bundled and closed.

What changed:

- Settings, structured first-plan, and selected running-plan UI surfaces now import the selected G4E
  types directly from their canonical owner modules:
  `src/lib/user-settings-actions.ts`, `src/lib/first-plan-actions.ts`, and
  `src/lib/running-plan-engine-actions.ts`.
- `training-api.ts` no longer re-exports:
  `UserSettingsSummary`, `StructuredFirstPlanDraftResult`,
  `RunningPlanConfirmActionResult`, `RunningPlanPreviewActionInput`, or
  `RunningPlanPreviewActionResult`.
- Read-only audit also proved five same-class type-only compatibility re-exports had no current
  callers through `training-api.ts`, so the bundle removed:
  `ConfirmStructuredFirstPlanDraftResult`, `ConfirmVoiceToPlanDraftResult`,
  `RunningPlanConfirmActionInput`, `ClearUpcomingScheduleResult`, and
  `DeleteActivePlanResult`.

Preserved:

- Runtime TanStack server-function wrappers remain in `training-api.ts`.
- `ViewerSummary` remains in `training-api.ts` because no canonical destination is selected.
- Manual authoring exports remain untouched because that cluster is broad and needs a dedicated
  manual-authoring import cleanup gate.
- Selected-plan, first-plan, settings, active-plan lifecycle, Plan Preset, Supabase, OpenAI, admin,
  Hito DS, and manual runtime behavior were not intentionally changed.

Audit result:

- Two read-only subagent audits completed and were used for type/export classification and docs
  drift.
- Two planned read-only subagent audits failed on model capacity, so their scope was covered by
  local `rg` audits instead of being counted as subagent proof.

Historical next cleanup gate at the time:

`BACKEND Slice G4F: audit and harden or demote import:current-plan mutating ops script`.

Resolved by:

- Slice G4F completed this gate and hardened `import:current-plan` with non-mutating defaults,
  dry-run/preflight, and local-loopback-only apply mode.

Why this was next:

- No remaining `training-api.ts` type-only candidate meets the same low-risk bundled criteria.
- At that time, `import:current-plan` was still a current hardcoded mutating package script and
  needed to be made explicitly safe, demoted, or removed through a dedicated backend ops-safety
  slice.

## Slice G4D Closeout And Post-G4D Audit — 2026-06-16

Status: G4D complete / next type-only facade cleanup gate selected.

G4D acceptance decision:

- Accept Slice G4D as cleanup-complete.
- `PlanManagementDialog`, `PlanRefreshPanel`, and `PlanScheduleEditPanel` now import Open plan
  refresh/schedule-edit contract types from canonical owner modules.
- `training-api.ts` no longer re-exports the Open plan refresh/schedule-edit type-only
  compatibility names.
- Runtime Open plan server-function wrappers remain in `training-api.ts`.

Fresh source/import proof after G4D:

- Open plan runtime imports from `training-api.ts` still exist and should stay because they are
  TanStack server-function wrappers.
- G4D selected contract types are no longer imported from `training-api.ts`.
- Read-only training-api audit found a few next small type-only candidates:
  `UserSettingsSummary`, `StructuredFirstPlanDraftResult`, `RunningPlanConfirmActionResult`,
  `RunningPlanPreviewActionInput`, and `RunningPlanPreviewActionResult`.
- Read-only ops audits found no delete-ready package script references to deleted G5A/G5B files.
- At the time of G4D, `import:current-plan` / `scripts/import-current-plan.mjs` still looked like a
  current unsafe mutating ops seam and needed a separate hardening/demotion gate rather than blind
  deletion.

Candidate classification after G4D:

| Candidate | Classification | Decision |
| --- | --- | --- |
| G4E settings/first-plan/running-plan type re-exports | compatibility-only type sub-seam | Select next. It is bounded to component type imports and public type re-export removal; runtime wrappers stay in `training-api.ts`. |
| `ManualWorkoutCopyMenu` alias | completed later in Slice G5C | Historical at this checkpoint. Slice G5C later removed the alias and QA proved Copy/Move/Clear behavior was preserved. |
| `import:current-plan` / `scripts/import-current-plan.mjs` | hardened in G4F | Complete. Default/help and dry-run are non-mutating; apply mode is local-loopback guarded. |
| Further broad `training-api.ts` cleanup | unsafe by line-count alone | Do not select. Most remaining exports are live route/component server-function wrappers or sensitive compatibility imports. |

Selected next cleanup gate:

`BACKEND Slice G4E: remove the next small type-only compatibility re-exports from training-api.ts`.

Boundary for Slice G4E:

- Move only selected type imports for settings, structured first-plan, and selected running-plan
  action result/input contracts from `training-api.ts` to their canonical owner modules.
- Preserve runtime server-function wrappers, Supabase/auth semantics, JSON import, active-plan
  export, manual authoring, selected-plan creation, admin, and Hito DS.
- Do not broaden into other `training-api.ts` exports.

## Slice G5B Closeout — 2026-06-16

Status: complete / orphaned onboarding JSON import panel deleted.

What changed:

- Final source/import proof found no live source import for `JsonImportPanel`.
- Deleted `src/components/onboarding/JsonImportPanel.tsx`.
- Preserved the current advanced JSON import owner:
  `src/components/plan-management/PlanImportPanel.tsx` inside
  `src/components/PlanManagementDialog.tsx`.
- Preserved `src/lib/imported-plan.ts` and `src/lib/plan-replacement-actions.ts`.
- No JSON import behavior, plan-management UI behavior, backend action, Supabase mutation, OpenAI
  call, migration, validator, admin surface, manual authoring surface, selected-plan surface, Hito
  DS surface, or QA artifact changed in this slice.

Validation evidence:

- `rg -n "JsonImportPanel" src docs package.json scripts` now returns only docs/history/spec
  references, not live source.
- Targeted ESLint, production build, and scoped `git diff --check` passed in the implementation run.

Next cleanup direction:

- Post-G5B architecture reassessment selected G4D from fresh import proof.
- The next implementation gate is the small type-only Open plan refresh/schedule-edit contract
  facade cleanup. It must not broaden into runtime server-function or behavior changes.

## Slice G5A Closeout — 2026-06-16

Status: complete / stale MJS text-authoring ops fallback removed.

What changed:

- Fresh source audit found no live command/runtime/current-doc dependency on the legacy MJS pair.
- Deleted `scripts/author-plan-from-text.mjs`.
- Deleted `scripts/lib/openai-plan-authoring.mjs`.
- Preserved `npm run author-plan-from-text` as the TS-backed command through
  `scripts/author-plan-from-text.ts`.
- Preserved `src/lib/openai-plan-authoring.ts` as the canonical OpenAI text-authoring source owner.
- No live OpenAI call, Supabase mutation, migration, product runtime change, or validator coverage
  removal was part of this slice.

Next cleanup direction:

- Post-G5A reassessment selected `FRONTEND Slice G5B: delete orphaned onboarding JsonImportPanel`.
- G4D was a small type-only facade narrowing candidate and was later completed.
- `ManualWorkoutCopyMenu` alias removal and ops/import hardening were later selected and closed as
  G5C and G4F respectively; this checkpoint is historical.

## Post-G5A Cleanup Reassessment — 2026-06-16

Status: architecture checkpoint complete / next deletion-first cleanup gate selected.

G5A acceptance decision:

- Accept Slice G5A as cleanup-complete.
- The legacy MJS text-authoring ops fallback is removed and must stay removed unless a future
  explicit recovery plan proves a live owner.
- The current text-authoring command remains `npm run author-plan-from-text` through
  `scripts/author-plan-from-text.ts` and `src/lib/openai-plan-authoring.ts`.

Candidate classification after G5A:

| Candidate | Classification | Decision |
| --- | --- | --- |
| G4D Open plan refresh/schedule-edit contract type re-exports | compatibility-only type sub-seam | Keep queued. Safe, but lower leverage than a deletion-only orphan cleanup and should not drive cleanup by `training-api.ts` momentum. |
| Orphaned onboarding `JsonImportPanel` | removed in Slice G5B | Final source/import proof found no live source import; current JSON import UI remains `PlanImportPanel` inside `PlanManagementDialog`. |
| `ManualWorkoutCopyMenu` alias | completed later in Slice G5C | Historical at this checkpoint. Slice G5C later removed the alias and QA proved Copy/Move/Clear behavior was preserved. |
| `import:current-plan` / `scripts/import-current-plan.mjs` | hardened in G4F | Complete. Default/help and dry-run are non-mutating; apply mode is local-loopback guarded. |

Root-cause finding:

- The next best simplification is deleting a dead source owner, not continuing runtime facade
  narrowing by inertia.
- `JsonImportPanel` is an old onboarding import panel that no longer owns the shipped JSON import
  flow.
- The current advanced JSON import flow is still required and must remain under
  `PlanImportPanel` / `PlanManagementDialog`.

Selected next cleanup gate:

`FRONTEND Slice G5B: delete orphaned onboarding JsonImportPanel`.

Boundary for Slice G5B:

- Delete only `src/components/onboarding/JsonImportPanel.tsx` if final `rg` proof still shows no
  live source imports.
- Do not alter `PlanImportPanel`, `PlanManagementDialog`, `imported-plan`, or plan replacement
  behavior.
- Do not turn this into JSON import redesign, onboarding IA work, manual authoring cleanup, Hito DS
  cleanup, or `training-api.ts` narrowing.

Expected validation:

- `rg -n "JsonImportPanel" src docs package.json scripts` proves no live source owner remains after
  deletion, with only historical docs allowed.
- Targeted ESLint for plan-management and onboarding surfaces.
- `npm run build`.
- Scoped `git diff --check`.

## Slice G5 Global Teardown Matrix — 2026-06-16

Status: architecture checkpoint complete / global cleanup control board created.

Root-cause finding:

- Visible symptom: cleanup feels endless because each slice selects a local seam and then asks what
  to do next.
- Underlying cause: cleanup lacked one compact matrix that ranks duplicate flows, source-of-truth
  conflicts, stale compatibility seams, generated artifacts, validation gaps, and QA blockers
  together.
- Canonical owner: architecture/source-of-truth first. BACKEND, FRONTEND, QA, and DEVTOOLS slices
  should now execute from this teardown matrix instead of redoing broad discovery every time.

Read-only fan-out used:

- Backend/import-map explorer confirmed G4D is safe and type-only, but broad `training-api.ts`
  cleanup remains unsafe.
- Frontend/UI/DS explorer confirmed `ManualWorkoutCopyMenu` and `JsonImportPanel` are the clearest
  frontend cleanup candidates, while Calendar and manual orchestration decomposition need broader
  QA-safe scopes.
- Docs/scripts/artifacts explorer confirmed the legacy MJS text-authoring pair is the strongest
  stale duplicate script candidate, while `qa-artifacts` deletion remains blocked by evidence
  policy.

Current teardown matrix:

| Candidate | Classification | Visible symptom / likely cause | Canonical owner | Evidence path | Recommended action | Validation needed | Sub-agent fit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G4D Open plan refresh/schedule-edit contract type re-exports from [training API facade](../../../src/lib/training-api.ts) | needs proof / safe tiny cleanup | `training-api.ts` still looks like a type owner for Open plan contracts, but canonical type owners already exist. | BACKEND / import contract ownership | [active-plan refresh contract](../../../src/lib/active-plan-refresh-contract.ts), [schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts), [PlanManagementDialog](../../../src/components/PlanManagementDialog.tsx) | Keep queued as near-term low-risk cleanup, but demote behind higher-leverage G5A. | targeted ESLint, build, import-source audit, scoped diff check | yes, read-only import-map proof |
| Legacy MJS text-authoring pair | removed in G5A | Old MJS path duplicated the canonical TS-backed text-authoring ops path and could still call OpenAI/Supabase through stale script shape. | BACKEND / text-authoring ops seam | [package script](../../../package.json), [TS author script](../../../scripts/author-plan-from-text.ts), [TS OpenAI owner](../../../src/lib/openai-plan-authoring.ts), [current state](../../current-state.md) | Complete. Keep deleted unless a future explicit recovery plan proves a real need. | `rg` proof, dry-run mock text-authoring command, doctrine validator, build, scoped diff check | no further implementation |
| `ManualWorkoutCopyMenu` alias in [ManualWorkoutSourceActionMenu](../../../src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx) | merge/consolidate | Live calendar still imports a Copy-named alias even though the component now owns Copy/Move/Clear. | FRONTEND / shared manual source-action rendering | [Calendar](../../../src/components/Calendar.tsx), [ManualWorkoutSourceActionMenu](../../../src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx), current functional map | Next frontend cleanup candidate after higher-priority script/runtime gates. Rename call sites and remove alias only with browser proof. | `rg`, targeted ESLint, build, Copy/Move/Clear browser proof | yes, read-only import map; implementation single-owner |
| Repeated Calendar Add/Move/Copy/Clear rendering in [Calendar](../../../src/components/Calendar.tsx) | extract/decompose | Month, week, and mobile render branches repeat action/menu wiring. | FRONTEND / Calendar rendering view model | [Calendar](../../../src/components/Calendar.tsx), backend capability map | Defer. Needs a focused frontend extraction plan and browser QA matrix; not deletion-ready. | desktop/month/week/mobile browser proof for Add, Paste, Move, Clear | yes for QA matrix only |
| Duplicated manual first-create vs saved-calendar Add orchestration | extract/decompose | First-create and Add share constructor/template/review UI ideas but confirm through different backend mutations. | FRONTEND orchestration; BACKEND mutations remain separate | [ManualUserBuiltPlanPanel](../../../src/components/onboarding/ManualUserBuiltPlanPanel.tsx), [ManualWorkoutAuthoringControls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx) | Defer. Do not collapse confirm paths without a dedicated architecture spec. | full manual first-create/Add/template browser + DB proof | yes for read-only duplication map |
| Orphaned onboarding `JsonImportPanel` | removed in G5B | Component was source-orphaned; current import UI moved to plan-management import surfaces. | FRONTEND / onboarding dead-code cleanup | `rg JsonImportPanel src`, current import flow map | Complete. Keep current import UI under `PlanImportPanel` / `PlanManagementDialog`. | post-delete `rg`, targeted ESLint/build, scoped diff check | no |
| `/hitoDS` Figma export double wiring | needs proof | Export board is reachable through a dedicated file route and defensive branch in main DS route. | FRONTEND / Hito DS IA route ownership | [hitoDS route](../../../src/routes/hitoDS.tsx), [Figma export route](../../../src/routes/hitoDS_.export.figma.tsx), [Figma export board](../../../src/components/hito-ds/figma-export-board.tsx) | Defer until DS Slice 6 QA is accepted; then remove only proved duplicate route wiring. | `/hitoDS`, `#figma-bridge`, `/hitoDS/export/figma`, build, mobile proof | yes, route proof only |
| Paused `/test-calendar` plan | archived in G6 | Product-design sandbox is accepted through TC2, no TC3 is selected, and the historical plan no longer belongs in the active root. | ARCHITECT / docs source-of-truth | [archived workout-library/test-calendar plan](../archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md), [Hito DS IA plan](2026-06-15-hito-ds-information-architecture-and-specimen-contract.md) | Complete. Keep runtime/source and QA artifacts untouched; reopen only from a concrete Product/Design question and a new Architecture checkpoint. | docs diff check; admin importer dry-run and backlog validator passed after move | no |
| `import:current-plan` / [import-current-plan.mjs](../../../scripts/import-current-plan.mjs) | complete / hardened in G4F | Historical command was hardcoded and mutating; G4F removed the hardcoded file path, made default/help and dry-run non-mutating, and blocked apply mode unless the target is local loopback Supabase. | BACKEND / ops import safety | [package script](../../../package.json), [current system](../../current-system.md), [import script](../../../scripts/import-current-plan.mjs) | Complete. Keep as local-only ops helper; do not use as remote or production import path. | help, dry-run, remote apply-block proof; no live mutation | no |
| `logs/` retention | generated/local hygiene | Local logs are large enough to distract cleanup but are not product code. | DEVTOOLS / local artifact hygiene | `logs/` inventory, generated artifact policy | Later DEVTOOLS dry-run retention tooling only; no deletion in G5. | dry-run against fixture temp dir; preserve QA server state | yes |
| [test-results/.last-run.json](../../../test-results/.last-run.json) | local hygiene / delete-ready only after ignore proof | Tiny untracked Playwright residue can keep showing up as cleanup noise. | DEVTOOLS / generated artifact hygiene | `rg last-run.json`, `git status` | Later local hygiene: ignore/remove residue after confirming no active QA report depends on it. | `rg`, status proof | yes |
| `qa-artifacts/` | blocked by QA policy | Huge proof root is local/generated, but it contains acceptance evidence. | QA / evidence retention policy | QA artifact policy, screenshot/report references | Do not delete. Create a QA evidence retention/index policy before any archive/compression. | cross-reference QA reports before action | yes, QA/ARCHITECT inventory only |

How much is left:

- Global simplification remains about `25-30%` complete.
- About `70-75%` remains.
- Rough remaining gate count:
  - Backend/runtime facade and ops cleanup: `5-8` gates.
  - Frontend/manual calendar decomposition and orphan cleanup: `5-7` gates.
  - Hito DS route/IA/export cleanup: `3-5` gates, separate from product runtime.
  - Docs/source-of-truth demotion/archive: `3-4` gates.
  - Devtools/generated artifact hygiene: `3-4` gates.
  - QA retention/browser-proof policy work: `2-3` gates.
- Safe parallelism:
  - Read-only import/source audits can run in parallel.
  - Docs/archive/source-of-truth work can run beside backend/frontend implementation if it does not
    move active owners.
  - DEVTOOLS dry-run retention work can run separately from product cleanup.
- Not parallel-safe:
  - Multiple edits to [Calendar](../../../src/components/Calendar.tsx) or manual authoring controls.
  - Broad `training-api.ts` narrowing.
  - Any cleanup that touches auth, Supabase mutation, QA artifacts, or active-plan lifecycle
    behavior.

Selected next gate after G5A:

`FRONTEND Slice G5B: delete orphaned onboarding JsonImportPanel`.

G4D was later completed as a safe type-only cleanup, but G5B was the immediate deletion-first slice
because current import proof shows `JsonImportPanel` has no live source owner while the current JSON
import UI is owned by `PlanImportPanel` inside `PlanManagementDialog`.

## Slice G4C Closeout — 2026-06-16

Status: complete / auth callback compatibility facade narrowed.

What changed:

- Updated [auth confirm route](../../../src/routes/api.auth.confirm.tsx) to import
  `exchangeCodeForSession(...)` directly from [auth actions](../../../src/lib/auth-actions.ts).
- Removed the `exchangeCodeForSession(...)` re-export from
  [training API facade](../../../src/lib/training-api.ts).
- Preserved `getLoginRouteData(...)` and `requestMagicLink(...)` in
  [training API facade](../../../src/lib/training-api.ts) because they remain route-facing TanStack
  server-function wrappers for current callers.
- Updated current docs so auth callback exchange is described as direct route-to-auth-owner wiring,
  not a `training-api.ts` compatibility export.

Validation evidence:

- `npm exec eslint -- src/routes/api.auth.confirm.tsx src/lib/training-api.ts src/lib/auth-actions.ts`
  passed.
- `rg -n "exchangeCodeForSession" src/lib/training-api.ts src/routes/api.auth.confirm.tsx src/lib/auth-actions.ts`
  shows `exchangeCodeForSession(...)` only in [auth actions](../../../src/lib/auth-actions.ts) and
  [auth confirm route](../../../src/routes/api.auth.confirm.tsx), not in
  [training API facade](../../../src/lib/training-api.ts).
- `npm run build`
  passed.
- scoped `git diff --check`
  passed.

Next cleanup gate:

Historical at G4C closeout: BACKEND Slice G4D was selected for type-only Open plan contract facade
narrowing, then superseded for immediate execution by the Slice G5 matrix, and later completed.

## Post-G4C Cleanup Reassessment — 2026-06-16

Status: architecture checkpoint complete / next smallest safe cleanup gate selected.

G4C acceptance decision:

- Accept Slice G4C as cleanup-complete.
- Source evidence matches the backend report:
  [auth confirm route](../../../src/routes/api.auth.confirm.tsx) imports
  `exchangeCodeForSession(...)` directly from [auth actions](../../../src/lib/auth-actions.ts).
- [training API facade](../../../src/lib/training-api.ts) no longer re-exports
  `exchangeCodeForSession(...)`.
- `getLoginRouteData(...)` and `requestMagicLink(...)` remain in
  [training API facade](../../../src/lib/training-api.ts) because they are live route-facing
  TanStack server-function wrappers.

Candidate classification after G4C:

| Candidate | Classification | Decision |
| --- | --- | --- |
| [training API facade](../../../src/lib/training-api.ts) | current-runtime compatibility facade after G4A/G4B/G4C narrowing | Do not broadly narrow. Most exports are still live route/component server-function wrappers or current compatibility. |
| Route data wrappers in [training API facade](../../../src/lib/training-api.ts) | required runtime | Keep. Home, shell, login, workout, progress, and settings still import these wrappers. |
| `requestMagicLink(...)` in [training API facade](../../../src/lib/training-api.ts) | required runtime wrapper | Keep. [Auth entry screen](../../../src/components/AuthEntryScreen.tsx) still calls it through `useServerFn`. |
| Active-plan lifecycle, refresh, and schedule-edit runtime wrappers in [training API facade](../../../src/lib/training-api.ts) | required runtime wrappers | Keep. [Plan management dialog](../../../src/components/PlanManagementDialog.tsx) still uses these server functions. |
| Active-plan refresh/schedule-edit contract type re-exports in [training API facade](../../../src/lib/training-api.ts) | removed compatibility-only type sub-seam | Completed in Slice G4D. Component type imports now use [active-plan refresh contract](../../../src/lib/active-plan-refresh-contract.ts) and [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts). |
| G4E selected settings/first-plan/running-plan type re-exports in [training API facade](../../../src/lib/training-api.ts) | removed compatibility-only type sub-seam | Complete in Slice G4E. UI type imports now use canonical owners in `user-settings-actions.ts`, `first-plan-actions.ts`, and `running-plan-engine-actions.ts`. |
| Extra same-class type-only re-exports in [training API facade](../../../src/lib/training-api.ts) | removed compatibility-only type sub-seam | Complete in bundled G4E closeout. No current caller imports those confirm/input/lifecycle result types through `training-api.ts`. |
| `ViewerSummary` in [training API facade](../../../src/lib/training-api.ts) | suspect type owner, but canonical destination is not selected yet | Defer. Do not create a new type owner just to reduce facade surface. |
| Manual authoring exports in [training API facade](../../../src/lib/training-api.ts) | current runtime and current component imports | Keep. Too broad for this slice. |
| Selected running-plan and first-plan runtime exports in [training API facade](../../../src/lib/training-api.ts) | current runtime and product-sensitive creation paths | Keep. Runtime wrappers/actions stay unless a dedicated import/QA story proves a safe seam. |
| `archiveActivePlanForUser(...)`, `clearUpcomingScheduleForUser(...)`, and `applyActivePlanRefreshProposalForUser(...)` compatibility names | removed no-caller helper compatibility names | Complete in Slice G7B. Canonical helper ownership remains in lifecycle/refresh action modules, while `training-api.ts` keeps only live top-level wrappers. |
| Admin, Hito DS, manual authoring runtime UI hotspots, and proof-infrastructure files | separate active owners or required validation | Do not mix into this facade cleanup slice. |

Root-cause finding:

- The next safe simplification is not another behavior deletion; it is narrowing type ownership.
- Open plan components should read refresh/schedule-edit contract types from their canonical
  contract modules, while `training-api.ts` continues to expose the runtime server functions that
  current callers still need.
- This reduces facade authority without touching mutations, auth, Supabase, OpenAI, plan creation,
  manual authoring, or user-visible UI behavior.

Historical selected cleanup gate:

`BACKEND Slice G4D: remove Open plan refresh/schedule-edit contract type re-exports from training-api.ts`.

Status: later completed.

Boundary for Slice G4D:

- Move only type-only imports for `ProposeActivePlanRefreshResult`,
  `ActivePlanScheduleEditInput`, and `ActivePlanScheduleEditPreview` from `training-api.ts` to
  canonical owner modules.
- Remove only the selected public type re-export blocks from `training-api.ts`.
- Preserve runtime server-function wrappers and current behavior.

Cleanup progress estimate:

- Global simplification remains about `25-30%` complete.
- G4D is intentionally tiny; do not inflate the global estimate until a larger runtime owner is
  deleted, demoted, or decomposed.

## Slice G4B Closeout — 2026-06-16

Status: complete / Plan Preset card compatibility facade narrowed.

What changed:

- Updated [onboarding gate](../../../src/components/OnboardingGate.tsx) to import
  `getPlanPresetCards(...)` and `PlanPresetCardsActionResult` directly from
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts).
- Updated [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx) to import its
  card result type directly from [Plan Preset actions](../../../src/lib/plan-preset-actions.ts).
- Removed Plan Preset card discovery re-exports from
  [training API facade](../../../src/lib/training-api.ts).
- Updated [selected running-plan confirm validator](../../../scripts/validate-running-plan-engine-confirm.ts)
  so the negative proof now asserts:
  `plan-preset-actions.ts` still exports card discovery, old Plan Preset review/confirm actions stay
  absent, `training-api.ts` does not re-export Plan Preset card discovery, and selected running-plan
  confirm remains the creation seam.
- Updated current docs so Plan Preset card discovery is described as a direct canonical action owner,
  not a `training-api.ts` compatibility export.

Validation evidence:

- `npm exec eslint -- src/lib/training-api.ts src/lib/plan-preset-actions.ts src/components/OnboardingGate.tsx src/components/onboarding/PlanPresetPanel.tsx scripts/validate-running-plan-engine-confirm.ts scripts/validate-plan-preset-eligibility.ts`
  passed.
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
  passed in non-mutating mode.
- `node --import tsx ./scripts/validate-plan-preset-eligibility.ts`
  passed.
- `npm run build`
  passed.
- scoped `git diff --check`
  passed.

Next cleanup gate:

Run an ARCHITECT reassessment before selecting any further `training-api.ts` cleanup.

## Post-G4B Cleanup Reassessment — 2026-06-16

Status: architecture checkpoint complete / next bounded runtime facade gate selected.

Superseded by Slice G4C closeout above; retained as decision history.

G4B acceptance decision:

- Accept Slice G4B as cleanup-complete.
- Source evidence matches the backend report:
  [Onboarding Gate](../../../src/components/OnboardingGate.tsx) imports `getPlanPresetCards(...)`
  and `PlanPresetCardsActionResult` directly from
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts).
- [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx) imports its card result
  type directly from [Plan Preset actions](../../../src/lib/plan-preset-actions.ts).
- [training API facade](../../../src/lib/training-api.ts) no longer re-exports Plan Preset card
  discovery.
- No old `reviewPlanPresetDraft(...)` / `confirmPlanPresetDraft(...)` runtime seam remains in
  `src`, `scripts`, or `package.json`.

Candidate classification after G4B:

| Candidate | Classification | Decision |
| --- | --- | --- |
| [training API facade](../../../src/lib/training-api.ts) | current-runtime compatibility facade with one more proved sub-seam | Do not broadly narrow. Select only auth callback exchange re-export removal. |
| `exchangeCodeForSession(...)` re-export in [training API facade](../../../src/lib/training-api.ts) | compatibility-only facade sub-seam | Select Backend Slice G4C. Canonical owner already exists in [auth actions](../../../src/lib/auth-actions.ts), and the only runtime caller is [auth confirm route](../../../src/routes/api.auth.confirm.tsx). |
| [auth actions](../../../src/lib/auth-actions.ts) | required auth owner for login route data, Magic Link request, and callback exchange | Keep. Only route import ownership changes in G4C. |
| `getLoginRouteData(...)` and `requestMagicLink(...)` in [training API facade](../../../src/lib/training-api.ts) | required route-facing TanStack server-function wrappers | Keep. They are not the selected seam. |
| Route-data wrappers in [training API facade](../../../src/lib/training-api.ts) | current runtime | Keep. Home, shell, workout detail, progress, login, and settings still import route data wrappers. |
| Active-plan lifecycle, refresh, schedule edit, workout log, selected running-plan, structured/voice, manual authoring, and plan-replacement exports | current runtime or current compatibility imports | Keep. These require separate import-map audits and validation stories. |
| [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) | required direct card discovery owner after G4B | Keep. No second deletion target remains here. |
| [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts) and validator | current runtime + required validation | Keep. Less deletion-first than G4C. |
| Admin, Hito DS, manual authoring runtime UI hotspots, and proof-infrastructure files | separate active owners or required validation | Do not mix into this runtime facade cleanup slice. |

Root-cause finding:

- The next clean runtime deletion is another compatibility import edge, not a behavior removal.
- The auth callback exchange behavior already belongs to `src/lib/auth-actions.ts`; keeping a
  `training-api.ts` re-export only makes the facade look more authoritative than it should.
- The route can import the canonical auth action directly, while `training-api.ts` continues to own
  only the route-facing TanStack server-function wrappers that still have live callers.

Selected next cleanup gate:

`BACKEND Slice G4C: remove auth callback exchange compatibility re-export from training-api.ts`.

Boundary for Slice G4C:

- Move `/api/auth/confirm` to import `exchangeCodeForSession(...)` directly from
  `src/lib/auth-actions.ts`.
- Remove only the `exchangeCodeForSession(...)` re-export from `training-api.ts`.
- Preserve `getLoginRouteData(...)`, `requestMagicLink(...)`, Supabase code/token-hash exchange,
  redirect handling, local-auth behavior, admin auth separation, and all unrelated server actions.

Cleanup progress estimate:

- Global simplification remains about `25-30%` complete.
- G4C is intentionally small; do not inflate the global estimate until larger runtime ownership seams
  are removed or demoted.

## Slice G4A Closeout — 2026-06-16

Status: complete / runtime compatibility facade narrowed.

What changed:

- Updated [plan export API route](../../../src/routes/api.plan.export.tsx) to import
  `exportActivePlanForUser(...)` directly from
  [active-plan export actions](../../../src/lib/active-plan-export-actions.ts).
- Removed `exportActivePlan(...)`, `exportActivePlanForUser(...)`, and
  `ExportActivePlanResult` re-exports from [training API facade](../../../src/lib/training-api.ts).
- Preserved [active-plan export actions](../../../src/lib/active-plan-export-actions.ts) and
  [plan export shaping](../../../src/lib/plan-export.ts) as the canonical export owners.
- Updated current docs so active-plan export no longer appears as a `training-api.ts`
  compatibility export.

Validation evidence:

- `rg -n "exportActivePlan|exportActivePlanForUser" src scripts docs/current-*.md docs/plans/active/2026-06-07-hito-stack-simplification-strike.md`
  now shows runtime usage only in [active-plan export actions](../../../src/lib/active-plan-export-actions.ts)
  and [plan export API route](../../../src/routes/api.plan.export.tsx); remaining docs references are
  historical or this closeout.
- Targeted ESLint passed for the touched route/action/facade files.
- Manual workout authoring validator passed, preserving the manual export proof island.
- Plan authoring doctrine validator passed, preserving import/export proof.
- `npm run build` passed.
- Scoped `git diff --check` passed.

## Post-G4A Cleanup Reassessment — 2026-06-16

Status: architecture checkpoint complete / next bounded runtime facade gate selected.

Superseded by Slice G4B closeout above; retained as decision history.

G4A acceptance decision:

- Accept Slice G4A as cleanup-complete.
- Source evidence matches the backend report:
  [plan export API route](../../../src/routes/api.plan.export.tsx) imports
  `exportActivePlanForUser(...)` directly from
  [active-plan export actions](../../../src/lib/active-plan-export-actions.ts).
- [training API facade](../../../src/lib/training-api.ts) no longer re-exports active-plan export
  actions or `ExportActivePlanResult`.
- Active-plan export behavior remains owned by
  [active-plan export actions](../../../src/lib/active-plan-export-actions.ts) and
  [plan export shaping](../../../src/lib/plan-export.ts).

Candidate classification after G4A:

| Candidate | Classification | Decision |
| --- | --- | --- |
| [training API facade](../../../src/lib/training-api.ts) | current-runtime compatibility facade with another proved sub-seam | Do not broadly narrow. Select only Plan Preset card discovery re-export removal. |
| Plan Preset card discovery re-export in [training API facade](../../../src/lib/training-api.ts) | compatibility-only facade sub-seam | Select Backend Slice G4B. Canonical owner already exists in [Plan Preset actions](../../../src/lib/plan-preset-actions.ts). |
| [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) | required runtime owner for card discovery | Keep `getPlanPresetCards(...)`, `PlanPresetCardsActionResult`, and active-plan-exists blocking. |
| [selected running-plan confirm validator](../../../scripts/validate-running-plan-engine-confirm.ts) | required validation with stale compatibility assertion | Update the negative proof so it asserts `training-api.ts` no longer re-exports Plan Preset card discovery. |
| [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts) | current runtime + required validation | Keep. A future extraction would need a new action owner; it is less deletion-first than G4B. |
| [schedule edit preview validator](../../../scripts/validate-active-plan-schedule-edit-preview.ts) | required validation | Keep with the schedule-edit seam. |
| AI structured/text/voice authoring seams | required runtime/proof or Product-deletion-only | Keep; do not select by line count or cleanup momentum. |
| Manual authoring runtime/UI hotspots | current runtime | Keep until a dedicated browser-safe cleanup slice is selected. |
| Admin and Hito DS hotspots | separate active-plan owners | Do not mix into runtime facade cleanup. |

Root-cause finding:

- The next clean runtime deletion is not another Plan Preset behavior removal.
- The remaining issue is a compatibility import path: Plan Preset card discovery is live, but it does
  not need to be re-exported by `training-api.ts` when its canonical server-action owner is already
  `plan-preset-actions.ts`.
- This is safer than decomposing schedule edit preview because it removes an existing facade edge
  without creating a new module.

Selected next cleanup gate:

`BACKEND Slice G4B: remove Plan Preset card discovery compatibility re-export from training-api.ts`.

Boundary for Slice G4B:

- Move onboarding Plan Preset UI imports to `src/lib/plan-preset-actions.ts`.
- Remove only the Plan Preset card discovery re-export from `training-api.ts`.
- Update validator source proof so the absence of the `training-api.ts` Plan Preset re-export is
  intentional.
- Preserve Plan Preset card discovery, selected running-plan create, and all unrelated server
  functions.

Cleanup progress estimate:

- Keep global simplification at about `25-30%` complete, with about `70-75%` remaining.
- G4B is intentionally small; it should not inflate the global teardown estimate.

## Slice G2A Closeout — 2026-06-15

Status: complete / runtime compatibility seam deleted.

What changed:

- Removed stale Plan Preset review/confirm blocked actions from
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts).
- Removed related stale result types and the `preview_only` helper.
- Preserved `getPlanPresetCards(...)`, `PlanPresetCardsActionResult`, active-plan conflict blocking,
  and Plan Preset card discovery.
- Updated [selected running-plan confirm validator](../../../scripts/validate-running-plan-engine-confirm.ts)
  so the negative proof now asserts the old Plan Preset create seam is absent instead of requiring a
  blocked runtime action to remain.
- Updated current source-of-truth docs to state that Plan Presets are discovery cards and selected
  running-plan preview/confirm owns creation.

Validation:

- `npm exec eslint -- src/lib/plan-preset-actions.ts scripts/validate-running-plan-engine-confirm.ts`
  passed.
- `rg -n "reviewPlanPresetDraft|confirmPlanPresetDraft|PlanPresetReviewDraftActionResult|PlanPresetConfirmActionResult|preview_only" src scripts package.json`
  returned no matches.
- `rg -n "getPlanPresetCards|previewRunningPlanDraft|confirmRunningPlanDraft" src/components src/lib`
  confirmed card discovery plus selected running-plan preview/confirm remain wired.
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts` passed in non-mutating mode.
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts` passed.
- `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts` passed.
- `npm run build` passed.
- Scoped `git diff --check` passed.

Next cleanup gate:

`ARCHITECT Slice G3: simplification strike source-of-truth compression and historical section demotion`.

## Post-G2A Cleanup Reassessment — 2026-06-15

Status: architecture checkpoint complete / next gate selected.

G2A acceptance decision:

- Accept Slice G2A as cleanup-complete.
- Source evidence matches the backend report:
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) now owns only
  `getPlanPresetCards(...)` plus active-plan-exists blocking, while selected running-plan
  preview/confirm remains the current create/persist seam.
- `plan_preset_v1` remains valid only as Plan Preset card/source metadata, active-plan source-kind
  readback, and manual editability proof fixture data.
- The old Plan Preset review/confirm blocked actions, result types, and `preview_only` runtime helper
  are absent from runtime source and scripts.

Candidate classification after G2A:

| Candidate | Classification | Decision |
| --- | --- | --- |
| [training API facade](../../../src/lib/training-api.ts) | current-runtime compatibility facade | Keep; many route/component imports still rely on it. Do not select broad facade cleanup without a fresh import map. |
| [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts) | current-runtime + validation owner | Keep; current product/system docs and `Open plan` UI use it for reviewed schedule reflow. |
| [schedule edit preview validator](../../../scripts/validate-active-plan-schedule-edit-preview.ts) | required validation | Keep with the schedule-edit seam. |
| [Plan Preset eligibility validator](../../../scripts/validate-plan-preset-eligibility.ts) | required validation for card discovery | Keep; it now validates card discovery, program summaries, metric truth, and absence of removed legacy builder artifacts. |
| Plan Preset legacy algorithmic/review source files | already absent from runtime | No implementation deletion gate remains; remaining references are historical docs/source-of-truth noise. |
| AI blueprint/envelope/ops proof files | required validation/proof infrastructure | Keep; do not continue extraction by inertia. |
| Manual authoring/runtime UI hotspots | current runtime | Keep until a dedicated QA-safe frontend/runtime cleanup slice is selected. |
| This active simplification strike plan | docs/source-of-truth hotspot | Select Slice G3. |

Root-cause finding:

- The next cleanup risk is no longer another obvious runtime compatibility seam.
- The active simplification strike itself has become a source-of-truth hotspot: it still contains
  long historical slices, superseded Plan Preset prompts, and old guidance that can look live in
  search results.
- That is a real cleanup blocker because future agents use this file to choose gates.

Selected next cleanup gate:

`ARCHITECT Slice G3: simplification strike source-of-truth compression and historical section demotion`.

Boundary for Slice G3:

- Compress or demote stale historical sections from this active plan.
- Preserve current G1/G2/G2A closeouts, the global teardown baseline, current candidate
  classifications, selected next gate, risks, and exit criteria.
- Keep useful history in archive/history form where needed.
- Do not touch product runtime, frontend UI, backend runtime, validators, Supabase, migrations, or
  QA artifacts.

Cleanup progress estimate:

- Keep global simplification at about `25-30%` complete, with about `70-75%` remaining.
- G2A was intentionally small; it removed one stale runtime seam but does not materially change the
  global teardown estimate.

## Generated Artifact And Log Retention Policy — 2026-06-16

Status: policy recorded / no deletion approved.

Root-cause finding:

- Visible symptom: `logs/`, `qa-artifacts/`, `test-results/`, and build/server output make the repo
  look much larger and can distract cleanup agents into scanning generated proof output.
- Underlying cause: prior cleanup baselines quarantined generated roots from service-size claims but
  did not define a retention/deletion boundary.
- Canonical owner: documentation/source-of-truth now, then a later DEVTOOLS local hygiene slice if
  deletion or rotation is approved.

Classification:

| Root / surface | Classification | Current cleanup treatment |
| --- | --- | --- |
| `logs/` | generated local/dev/build/server logs | Excluded from product-code counts; future DEVTOOLS cleanup may rotate/compress/delete by age. |
| Build/server logs outside `logs/` | generated operational output | Excluded from source-size claims; should be moved under the log-retention rule before deletion. |
| `qa-artifacts/` | local QA proof output / acceptance evidence | Excluded from product-code counts; do not delete until a separate QA evidence retention policy exists. |
| `test-results/` | generated test-runner residue | Excluded from product-code counts; disposable in a later local hygiene task if unreferenced. |
| `node_modules/` and build/cache roots | vendor/generated build output | Excluded from cleanup hotspot rankings and service-size claims. |

Retention rule proposal:

- Keep recent raw logs for `7` days.
- Classify logs older than `30` days as old retention candidates for a future DEVTOOLS policy pass.
- Do not delete old logs unless a later explicit retention/apply-mode slice approves deletion and
  proves they are not referenced by an active bug, QA blocker, incident, or
  release proof.
- Preserve active QA-server status, PID, and current-run evidence until the managed QA server is
  intentionally restarted or stopped.
- Do not delete `qa-artifacts/` in generic cleanup. Permanent QA evidence should be promoted through
  a dedicated tracked evidence task; otherwise it remains local/gitignored proof output.

Agent audit guidance:

- Source/cleanup audits should exclude `logs/**`, `qa-artifacts/**`, `test-results/**`,
  `node_modules/**`, `.next/**`, `.turbo/**`, `dist/**`, `build/**`, and coverage roots unless
  explicitly scoped.
- Service-size reports must separate product/runtime/docs/scripts from generated/proof/vendor roots.
- Local artifact cleanup is disk hygiene, not product-code simplification.

Gate decision:

- This policy originally did not replace the G3 source-of-truth cleanup gate.
- After G4F, Architecture selected
  `BACKEND / DEVTOOLS Slice L1: local artifact hygiene dry-run tooling batch`.
- L1 is non-mutating inventory/reporting only. Any actual deletion, archive, compression, or
  `qa-artifacts/` evidence-retention policy remains a separate future gate.

## Slice G1 Closeout — 2026-06-15

Status: complete / docs-source-of-truth demotion accepted.

What changed:

- Removed duplicate active-plan copies for
  [heart-rate zones](../../tasks/backlog/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md)
  and
  [voice-to-plan authoring](../../tasks/backlog/2026-05-18-voice-to-plan-authoring-plan.md)
  because current backlog copies already own those future work items.
- Demoted
  [Polar auto-sync integration](../../tasks/backlog/2026-05-21-polar-auto-sync-integration-plan.md)
  to backlog because provider sync expansion is future/integration work, not an active execution
  owner.
- Demoted
  [advanced performance cadence doctrine](../../tasks/backlog/2026-06-01-advanced-performance-cadence-doctrine-and-implementation.md)
  to backlog because it is future coaching/performance doctrine, not current runtime execution.
- Archived
  [Hito optimization strike history](../archive/2026-05-29-hito-optimization-strike-plan.md)
  because its cleanup work is completed and superseded by this simplification strike.
- Kept the current active execution root focused on Admin Work Items, this simplification strike,
  running-plan creation engine, Hito DS workout playground history, manual workout authoring, and
  the Hito DS IA/specimen contract.
- Confirmed that `logs`, `qa-artifacts`, `test-results`, and `node_modules` are generated,
  proof-output, or vendor surfaces and must stay outside product-code size claims.

Line-count impact:

- `docs/plans/active`: `11` files / `18510` lines before G1.
- `docs/plans/active`: `6` files / `15320` lines after G1.
- Main counted text surface after G1: about `585` files / `259409` lines, excluding generated,
  cache, vendor, build, log, and QA artifact roots.

Validation:

- `git diff --check` passed for the touched docs.
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000` passed.
- `npm run validate-admin-capture-backlog` passed.

Next cleanup gate:

`ARCHITECT Slice G2: runtime capability ownership audit for compatibility/facade narrowing after
stale active-plan demotion`.

## Slice G2 Closeout — 2026-06-15

Status: complete / runtime capability ownership audit accepted.

Root-cause framing:

- Visible symptom: runtime/source files still look bloated after stale active-plan demotion.
- Underlying cause: some old compatibility seams still live beside real product owners, but broad
  runtime deletion would be unsafe without import/reference proof.
- Canonical owner: architecture audit first, then one backend cleanup implementation gate.

Runtime ownership findings:

| Seam | Evidence | Classification | Decision |
| --- | --- | --- | --- |
| [training API facade](../../../src/lib/training-api.ts) | Route/component imports still rely on its server-function wrappers and compatibility exports. | required runtime compatibility facade | Keep; no broad facade narrowing in G2. |
| [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts) | Imported by product UI and validated by [schedule edit preview validator](../../../scripts/validate-active-plan-schedule-edit-preview.ts). | required runtime + validation | Keep; do not delete as a manual Move duplicate. |
| [schedule edit preview validator](../../../scripts/validate-active-plan-schedule-edit-preview.ts) | Directly validates the active-plan schedule edit preview contract. | required validation | Keep. |
| [voice-to-plan authoring](../../../src/lib/voice-to-plan-authoring.ts) | Dynamically imported by first-plan actions and typed by onboarding form code, but not called by current `OnboardingGate` UI. | required non-default backend runtime | Keep; future Product deletion/replacement or frontend/QA wiring only. |
| [imported plan contract](../../../src/lib/imported-plan.ts) | Used by import, replacement, persistence, running-plan review, manual authoring, and validators. | canonical runtime contract | Keep. |
| [AI strict draft authoring module](../../../src/lib/ai-first-plan-draft-authoring.ts) | File no longer exists; current docs were stale. | deleted historical seam | Current docs corrected; no runtime gate needed. |
| [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) | `getPlanPresetCards(...)` is live; old `reviewPlanPresetDraft(...)` / `confirmPlanPresetDraft(...)` blocked actions have no current caller outside a validator source-regex proof. | mixed required discovery + compatibility-only blocked actions | Select Backend Slice G2A. |

Plan Preset current-state decision:

- Plan Preset cards remain backend-owned discovery for `10K Foundation`, `Half Marathon Balanced`,
  and `Marathon Base`.
- Selected running-plan preview/create owns current review/confirm/persist behavior.
- The old Plan Preset review/confirm blocked actions are not current product owners and can be
  removed with validator proof updated to assert absence of the stale seam.

Docs/source-of-truth sync:

- [current product](../../current-product.md), [current system](../../current-system.md),
  [current state](../../current-state.md), and [current functional map](../../current-functional-map.md)
  now describe Plan Presets as discovery/card ownership rather than the current create seam.
- Current docs now state that `src/lib/ai-first-plan-draft-authoring.ts` has been removed and that
  strict-draft references are bounded unsupported/negative-proof handling only.

Selected next cleanup gate:

`BACKEND Slice G2A: remove stale Plan Preset review/confirm blocked actions and update selected-plan
confirm negative proof`.

Validation expected from Backend Slice G2A:

- Preserve `getPlanPresetCards(...)`.
- Remove old `reviewPlanPresetDraft(...)`, `confirmPlanPresetDraft(...)`, related result types, and
  `preview_only` runtime helper if source proof remains clean.
- Update [selected running-plan confirm validator](../../../scripts/validate-running-plan-engine-confirm.ts)
  so it no longer requires the stale `preview_only` blocked action to exist.
- Run targeted ESLint, selected running-plan validators, `npm run build`, and scoped diff checks.

Cleanup progress estimate:

- Global simplification remains about `25-30%` complete, with about `70-75%` remaining.
- G2 was an ownership-selection gate, not a large line-count deletion.

## Slice G3 Closeout — 2026-06-16

Status: complete / active-plan source-of-truth compressed.

Root-cause finding:

- Visible symptom: the active simplification strike had grown into a multi-thousand-line mixed
  history of current decisions, old handoff prompts, old Plan Preset cleanup paths, proof-script
  extraction closeouts, Admin/Hito DS slices, and stale service-size audits.
- Underlying cause: completed cleanup history remained in the active execution path instead of being
  summarized behind current source-of-truth decisions.
- Canonical owner: documentation/source-of-truth. Runtime cleanup should start from the current
  functional map and live import/capability evidence, not from old historical prompts.

What changed:

- Preserved the import-ready metadata block at the top of this active plan.
- Preserved current closeouts and policy sections that still guide execution:
  Slice G1, Slice G2, Slice G2A, post-G2A reassessment, generated artifact/log retention policy, and
  this Slice G3 closeout.
- Compressed stale historical sections into the historical summary below.
- Removed stale-looking live guidance around old Plan Preset review/confirm actions, old Plan Preset
  algorithmic expansion, prior proof-infrastructure sequencing, old Admin/Hito DS cleanup prompts,
  and superseded service-size audits from the current execution path.
- Kept the current source hierarchy pointed at [current functional map](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-functional-map.md),
  [current product](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md),
  [current system](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md), and
  [current state](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-state.md).

What was not changed:

- No product runtime behavior.
- No frontend UI.
- No backend source.
- No validators or proof coverage.
- No Supabase, migrations, OpenAI calls, browser QA, logs, or QA artifacts.
- No future/backlog work moved back into active execution.

Line-count impact:

- Before Slice G3, this active plan was `6449` lines.
- After Slice G3, this active plan is `550` lines and intentionally compressed to the current
  execution path plus a compact history summary.
- The repo-wide baseline in the functional map is not recomputed by this docs-only pass; future
  size reports should use the generated-root exclusions recorded there.

Validation:

- `git diff --check -- docs/plans/active/2026-06-07-hito-stack-simplification-strike.md docs/current-functional-map.md` passed.
- Admin backlog importer dry-run was not required because no markdown files moved between
  repo-derived admin roots.
- Admin backlog validator was not required because no backlog/admin mirror metadata changed.

## Slice G4 Closeout — 2026-06-16

Status: complete / runtime import-map reassessment accepted.

Root-cause finding:

- Visible symptom: codebase/service-size pressure remains after many accepted product and proof
  slices, and `training-api.ts` still looks like the obvious large runtime facade.
- Underlying cause: the facade is still a real route/component boundary for many server functions,
  but a few focused owners now exist behind old compatibility exports.
- Canonical owner: architecture import-map audit first, then one bounded backend facade-narrowing
  implementation gate.

Import-map findings:

| Candidate | Evidence | Classification | Decision |
| --- | --- | --- | --- |
| [training API facade](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts) | Route/component imports still use it for home/shell/workout/progress/settings/login, active-plan lifecycle, refresh, schedule edit, selected plans, manual authoring, and route-facing types. | required runtime compatibility facade | Do not broadly narrow. Select only the proved export sub-seam below. |
| Active-plan export re-export in [training API facade](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts) | Export truth already lives in [active-plan export actions](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-export-actions.ts) and [plan export](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-export.ts); current runtime caller is [plan export API route](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/api.plan.export.tsx). | compatibility-only facade sub-seam | Select Backend Slice G4A. |
| [active-plan schedule edit preview](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts) | Product docs and [schedule edit preview validator](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/validate-active-plan-schedule-edit-preview.ts) still map it to Open plan schedule reflow. | current runtime + required validation | Keep. Do not confuse with manual Move. |
| [Plan Preset actions](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-preset-actions.ts) | After G2A it only owns `getPlanPresetCards(...)` plus active-plan-exists blocking. | required card discovery | Keep; no second deletion target remains here. |
| [Plan Preset eligibility validator](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/validate-plan-preset-eligibility.ts) | Validates card discovery, program summaries, metric truth, and absence of removed legacy builder artifacts. | required validation | Keep. |
| AI structured/text/voice authoring seams | Current docs and imports still map blueprint/envelope/text/voice paths to shipped or non-default authoring/proof flows. | required runtime/proof or Product-deletion-only | Keep until Product selects a replacement/deletion gate. |
| Manual authoring runtime hotspots | Large files remain live UI/runtime owners with many accepted browser-proved flows. | current runtime / future frontend cleanup | Keep unless a dedicated browser-safe frontend cleanup slice is selected. |
| Admin and Hito DS hotspots | Current admin runtime and separate Hito DS IA rollout remain active tracks. | separate active-plan owners | Do not mix into G4 runtime facade cleanup. |

Selected next cleanup gate:

`BACKEND Slice G4A: active-plan export facade narrowing from training-api.ts`.

Boundary for Slice G4A:

- Move the plan export API route to the canonical export action owner if the import map remains clean.
- Remove only the now-unused active-plan export compatibility re-export from `training-api.ts`.
- Preserve active-plan export behavior, payloads, filenames, content types, and download orchestration.
- Preserve all unrelated dirty/in-flight source changes in `training-api.ts`.
- Do not broaden into general facade cleanup.

Cleanup progress estimate:

- Keep global simplification at about `25-30%` complete, with about `70-75%` remaining.
- G4 is an ownership-selection gate. G4A should be small; do not inflate the global estimate after it
  unless it removes a broader compatibility class.

## Current Source Hierarchy For Cleanup

1. [Current functional map](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-functional-map.md)
   is the primary cleanup source of truth for shipped/accepted flows, protected runtime seams,
   proof infrastructure, future-only boundaries, generated-root exclusions, and immediate cleanup
   sequencing.
2. This active simplification strike owns cleanup execution history, current closeouts, current risk
   boundaries, and exact next-gate handoffs.
3. [Current product](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md),
   [current system](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md), and
   [current state](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-state.md)
   describe implemented behavior only and win over historical plan text.
4. Archived plans and changelog entries are history, not active execution instructions.
5. `logs/`, `qa-artifacts/`, `test-results/`, `node_modules/`, and build/cache roots are excluded
   from product-code size claims unless a task explicitly scopes local artifact hygiene.

## Current Global Cleanup Baseline

Status: global simplification remains active / implementation cleanup is conservative.

Stable cleanup burndown:

- Ledger: `cleanup-burndown-v1`.
- Fixed denominator: `40` bounded cleanup gates.
- Completed through G20: `37` gates.
- Remaining after G20: `3` gates.
- Current gate-burndown completion: `92.5%`.
- Earlier rough estimates, including `35-40%` and the old proof-infrastructure-only `48%`, are
  retired for progress reporting. The burndown is a sequencing metric, not a source-line reduction
  claim.

Current protected runtime families:

| Capability family | Current decision |
| --- | --- |
| Selected running plans | Keep running-plan engine preview/review/confirm/persist owners; Marathon Base must stay base-only, and Marathon Completion exposure remains separate unless accepted by product/UI gates. |
| Plan Presets | Keep card discovery through `getPlanPresetCards(...)`; old Plan Preset review/confirm runtime actions are removed by G2A and must not be revived. |
| Manual user-built plans and active-plan edits | Keep shipped manual create/Add/templates/Copy/Paste/Clear/Move/export seams and backend-owned editability policy. Do not refactor runtime UI without browser-safe scope. |
| Active-plan export/import/refresh/schedule edit | Keep current backend seams and proof owners; schedule edit preview is current runtime, not a stale duplicate. |
| AI / structured / voice first-plan authoring | Keep current structured blueprint/envelope/text seams, and keep the backend voice seam as non-visible/non-default until Product selects deletion or replacement; strict nested draft runtime is historical and absent. |
| Hito DS | Keep under the separate Hito DS IA/specimen rollout plan; do not mix DS rollout with runtime cleanup. |
| Admin / Backlog | Keep admin capture, analytics, repo importer, and admin shell seams until a dedicated admin cleanup gate selects one owner. |
| Generated/proof artifacts | Exclude from source-size claims. Do not delete QA artifacts; log rotation is later DEVTOOLS hygiene only. |

## Current Cleanup Candidate Classification

| Candidate | Classification | Current decision |
| --- | --- | --- |
| [training API facade](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts) | current-runtime compatibility facade after G4A/G4B/G4C narrowing | Keep for now; do not broadly delete exports without a fresh route/component import map and a new selected gate. |
| `exchangeCodeForSession(...)` re-export in [training API facade](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts) | removed compatibility-only facade sub-seam | Complete in Slice G4C; [auth confirm route](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/api.auth.confirm.tsx) imports [auth actions](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/auth-actions.ts) directly. |
| Open plan refresh/schedule-edit contract type re-exports in [training API facade](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts) | removed compatibility-only type sub-seam | Complete in Slice G4D. Runtime wrappers stay in `training-api.ts`; component type imports now use [active-plan refresh contract](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-refresh-contract.ts) and [active-plan schedule edit preview](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts). |
| Legacy MJS text-authoring pair | stale ops/source-of-truth mismatch after G5A | Complete in Slice G10. Current command and docs use the TS-backed [author-plan-from-text.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/author-plan-from-text.ts) and [openai-plan-authoring.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/openai-plan-authoring.ts), and the remaining tracked `scripts/author-plan-from-text.mjs` entrypoint was deleted. |
| Duplicate-space local ops residue | untracked local ops copies after canonical owners were preserved | Complete in Slice G11. `scripts/import-current-plan 2.mjs` and `scripts/validate-plan-preset-eligibility 2.ts` were deleted after source proof confirmed no package/current-doc owner. |
| First-plan/voice compatibility re-exports in [training API facade](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts) | removed no-caller compatibility sub-seam | Complete in Slice G12. Removed only `completeStructuredFirstPlanOnboarding`, `completeStructuredFirstPlanOnboardingForUser`, `generateVoiceToPlanDraft`, and `confirmVoiceToPlanDraft` re-exports after source proof stayed clean. |
| [auth actions](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/auth-actions.ts) | required auth owner | Keep login route data, Magic Link request, callback exchange, and local-vs-public auth helpers here. |
| [active-plan export actions](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-export-actions.ts) and [plan export](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-export.ts) | required runtime export owner | Keep as canonical owner; route callers already import here instead of through `training-api.ts` where proved safe. |
| [active-plan schedule edit preview](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts) | current runtime + validation owner | Keep; used by Open plan Edit schedule and validator. |
| [schedule edit preview validator](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/validate-active-plan-schedule-edit-preview.ts) | required validation | Keep with the schedule-edit seam. |
| [Plan Preset actions](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-preset-actions.ts) | required direct card discovery owner after G4B | Keep `getPlanPresetCards(...)`; old review/confirm actions are already removed. |
| [Plan Preset eligibility validator](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/validate-plan-preset-eligibility.ts) | required validation | Keep; validates card discovery and absence of old legacy builder artifacts. |
| Legacy Plan Preset builder/review residue under `src/lib/plan-presets/` and `scripts/plan-presets/` | completed BACKEND/OPS source hygiene | Complete in Slice G17. Untracked old builder/review modules, legacy CSV/source artifacts, and dependent proof helpers were deleted while tracked card-discovery owners remain intact. |
| Manual Copy/Paste and Move review/confirm compatibility re-exports in [training API facade](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training-api.ts) | removed no-caller manual-authoring facade sub-seam | Complete in Slice G7C. Canonical review/confirm ownership remains in [manual workout authoring](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/index.ts), while direct Copy/Paste and Move runtime wrappers remain in `training-api.ts`. |
| `/hitoDS` Figma export double wiring | completed FRONTEND/DS route cleanup | Complete in Slice G8. The accepted dedicated `/hitoDS/export/figma` file route and export-board component own the export surface; the parent `/hitoDS` route no longer owns the old inline fallback. |
| Admin UI placeholders (`Add user`, `Account settings / Soon`) | completed FRONTEND/ADMIN browser-visible cleanup | Complete in Slice G9. QA passed after the build/server lifecycle fix; admin Users and account menu now expose only current actions, with desktop and `375px` browser proof. |
| Manual authoring runtime UI hotspots | current runtime | Keep until a dedicated frontend cleanup slice has exact browser QA coverage. |
| Admin routes and importer | current admin runtime/tooling | Audit later; not selected by G3. |
| Hito DS route/styles | current internal DS runtime | Route through Hito DS IA rollout, not this simplification strike. |
| Logs/test results | generated local output | Later DEVTOOLS hygiene only. |
| `qa-artifacts/` | QA proof output | No deletion until separate QA evidence retention policy exists. |
| Work dashboard refresh path | completed local devtools/source-of-truth hygiene | Complete in Slice G13. First-class safe package-script aliases now wrap the existing dashboard helper, the generated dashboard command block recommends those aliases first, and non-mutating defaults are preserved. |
| Selected running-plan preview calendar DS adoption | selected FRONTEND/DS cleanup batch after G14 | Select UI-C1. Replace route-local selected-plan preview calendar cell ownership with the shared Hito calendar-day primitive while preserving preview semantics. |

## Historical Sections Demoted By Slice G3

These topics remain useful history, but they no longer guide active execution from this plan:

| Historical topic | Current summary |
| --- | --- |
| Slices 12A-12H plan-authoring proof extraction | Completed internal proof-infrastructure cleanup. Stable public command remains `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`; focused proof owners live under `scripts/plan-authoring-doctrine/`. Do not continue extraction by momentum alone. |
| Slices 13A-13I manual authoring proof extraction | Completed internal proof-infrastructure cleanup. Stable public command remains `node --import tsx ./scripts/validate-manual-workout-authoring.ts`; focused proof owners live under `scripts/manual-workout-authoring/`. Manual validator is no longer the obvious hotspot. |
| Slice 17A manual source-action menu extraction | QA-passed behavior-preserving frontend cleanup. `ManualWorkoutSourceActionMenu` is rendering/interaction only; backend remains owner of schedule mutation, persistence, metadata, date truth, and metric truth. |
| Old Plan Preset review/confirm cleanup | Superseded by G2A. Old `reviewPlanPresetDraft(...)` and `confirmPlanPresetDraft(...)` runtime actions are removed; only card discovery remains live. |
| Old Plan Preset algorithmic expansion prompts | Historical. Do not use old Slice 10-era prompts as current guidance; selected running-plan engine owns creation. |
| Prior code-freeze inventory and parallel R8 audits | Historical evidence. Current decisions are summarized in the functional map and G1/G2/G2A closeouts. |
| Admin shell / Backlog / capture cleanup slices | Historical or separate admin-track evidence. Select new admin cleanup only through fresh source/import proof. |
| Hito DS historical playground normalization slices | Historical or owned by the active Hito DS IA/specimen rollout plan. Do not mix with runtime cleanup. |
| Old service-size/root-cause audit sections | Superseded by the current global cleanup baseline and generated artifact policy. |

Detailed prior wording remains recoverable through git history and archived/current task documents.
Future agents should not treat deleted historical prompts from this plan as live instructions.

## Current Cleanup Sequence

1. BACKEND Slice G4E is complete: the selected settings, structured first-plan, and selected
   running-plan type imports now use canonical owner modules, and `training-api.ts` no longer
   re-exports those compatibility types.
2. The bundled G4E cleanup also removed same-class unused confirm/input/lifecycle result type
   re-exports from `training-api.ts` after source proof found no current facade callers.
3. Keep runtime server-function wrappers in `training-api.ts`; G4A-G4E were bounded facade
   narrowing slices and must not become broad runtime cleanup by momentum.
4. G4F is complete: `import:current-plan` no longer exposes a hardcoded mutating easy path and now
   requires explicit local-loopback apply mode for mutation.
5. L1 is complete: `npm run artifact:hygiene` reports local generated roots without deletion, and
   `test-results/` is ignored as generated test-runner residue.
6. G5C is QA-passed: the stale `ManualWorkoutCopyMenu` alias is removed, manual source-action
   call-site naming is aligned around `ManualWorkoutSourceActionMenu`, and browser QA proved
   Copy/Move/Clear still work through accepted backend seams.
7. G5D is complete: pure manual-authoring type imports were narrowed away from `training-api.ts`,
   while runtime manual server-function exports/actions stay in the facade.
8. G5E is complete: local ops plan-seed / structured-authoring `.mjs` helper ownership was removed
   in favor of the TypeScript owners in `src/lib/imported-plan.ts` and
   `src/lib/structured-plan-authoring.ts`.
9. G5F is complete: duplicated local ops plan-apply persistence blocks were consolidated into a
   narrow ops-local helper while entrypoints retained their own mutation-safety gates.
10. G6 is complete: the paused `/test-calendar` sandbox plan moved to archive as historical
    evidence; active DS/specimen/Figma bridge work remains owned by the Hito DS IA plan.
11. G7 is complete: the compact active-plan root was reassessed from current source/import evidence,
    the stale `current-state` archived-baseline reference was repaired, and G7A was selected as a
    narrow backend import-map batch rather than broad runtime or browser-sensitive cleanup.
12. G7A is complete: `training-api.ts` no longer re-exports
    `persistImportedPlanForCurrentRequest` or `saveUserSettings`; current docs now describe those
    canonical owners directly.
13. G7A reassessment is complete: broad `training-api.ts` cleanup remains unsafe, and G7B was
    selected for only the three no-caller user-scoped helper compatibility exports.
14. G7B is complete: no-caller user-scoped lifecycle/refresh helper compatibility exports were
    removed from `training-api.ts`; live top-level lifecycle/refresh server-function wrappers remain
    in the facade.
15. G7C is complete: no-caller manual Copy/Paste and Move review/confirm compatibility re-exports
    were removed from `training-api.ts`; direct manual Copy/Paste and Move runtime wrappers plus
    Delete/Clear, Add/Create/Templates, and persisted-edit actions remain in the facade.
16. Post-G7C source-proof reassessment is complete: broad `training-api.ts` cleanup remains unsafe,
    validators/local ops remain live proof/safety tooling, `qa-artifacts/` deletion remains blocked,
    and Slice G8 was selected as a bounded FRONTEND/DS route-ownership cleanup.
17. G8 is QA-passed: the duplicate inline `/hitoDS/export/figma` fallback was removed from the
    parent `/hitoDS` route, while the dedicated file route and export-board component remain the
    canonical export surface.
18. Post-G8 reassessment selected G9 as a same-owner FRONTEND/ADMIN cleanup batch for future-only
    disabled admin placeholders.
19. G9 is QA-passed: future-only admin placeholders were removed from admin Users/account menu
    surfaces while shipped admin analytics, capture, auth/logout, desktop layout, and `375px` mobile
    layout stayed intact.
20. Stable cleanup burndown v1 is adopted and updated after G20: `40` total gates, `37` complete,
    `3` remaining, `92.5%` gate-burndown complete.
21. G10 is complete: the remaining stale `scripts/author-plan-from-text.mjs` entrypoint was deleted
    after source proof confirmed no live owner and preserved the TS-backed text-authoring command.
22. Post-G10 source proof selected BACKEND/OPS Slice G11 for duplicate-space local ops residue:
    `scripts/import-current-plan 2.mjs` and `scripts/validate-plan-preset-eligibility 2.ts`.
23. G11 is complete: both duplicate-space local ops residue files were deleted after source proof
    confirmed they were untracked and ownerless.
24. Post-G11 source proof selected BACKEND Slice G12 for the no-caller first-plan/voice
    compatibility re-exports in `training-api.ts`; this is not broad facade cleanup.
25. G12 is complete: those four no-caller first-plan/voice compatibility re-exports were removed
    from `training-api.ts`.
26. Post-G12 reassessment accepted G12, found no safe next backend/runtime or frontend deletion
    batch, and selected BACKEND/OPS Slice G13 for local work-dashboard devtools hygiene.
27. G13 is complete: dashboard refresh now has first-class safe package scripts over the existing
    `scripts/hito-work-dashboard.mjs` helper, and `docs/work-dashboard.md` is regenerated from active
    plan truth.
28. Post-G13 reassessment is complete: the cleanup track entered source-proof holding until the
    service-wide UI consistency audit found a concrete shared-owner DS adoption candidate.
29. Service-wide UI consistency audit identified FRONTEND UI-C1 as a concrete shared-owner DS
    adoption candidate.
30. G14 is complete: the global business-flow teardown matrix is accepted, no product-runtime
    deletion candidate is source-proved, and FRONTEND UI-C1 was selected as the first execution
    batch after the matrix because it removed a duplicate selected-plan preview calendar
    presentation path.
31. UI-C1 is QA-passed and accepted: selected-plan preview now uses the shared Hito calendar-day
    primitive with desktop and `375px` proof, no-benchmark and benchmark preview proof, final
    endpoint readback, no fake personal HR, and disposable cleanup.
32. Post-UI-C1 source/import audit selected BACKEND/OPS G15 for deletion-only orphan legacy MJS ops
    helper residue under `scripts/lib/`.
33. G15 is complete: `scripts/lib/openai-plan-authoring.mjs`,
    `scripts/lib/structured-plan-authoring.mjs`, and `scripts/lib/imported-plan-seed.mjs` were
    deleted after source proof confirmed current command ownership is TS-backed or ops-local.
34. Post-G15 source/import/docs reassessment selected DEVTOOLS/OPS G16 for local duplicate-space
    residue cleanup. The selected files are untracked and unimported, and the slice must not touch
    canonical runtime owners.
35. G16 is complete: `src/lib/plan-creation-engine/source-model 2.ts`,
    `src/components/onboarding/PlanPresetPanel 2.tsx`, and `src/components/ui/calendar 2.tsx` were
    deleted while canonical owners remain untouched.
36. Post-G16 reassessment selected BACKEND/OPS G17 for untracked legacy Plan Preset builder/review
    residue. The selected batch preserved current Plan Preset card discovery and selected-plan
    preview/create, and stopped short of tracked/current owners.
37. G17 is complete: the untracked legacy Plan Preset builder/review module cluster, legacy CSV/source
    artifacts, and dependent `scripts/plan-presets/*` helpers were deleted while tracked current
    card-discovery owners remain untouched.
38. Post-G17 reassessment selected FRONTEND G18 for the tracked orphan onboarding
    `JsonImportPanel.tsx`. This is deletion-only source repair; current JSON import behavior remains
    owned by `PlanImportPanel`, `PlanManagementDialog`, and `UploadJsonDialog`.
39. G18 is complete: the tracked orphan onboarding `JsonImportPanel.tsx` residue was deleted while
    current JSON import behavior remains owned by `PlanImportPanel`, `PlanManagementDialog`, and
    `UploadJsonDialog`.
40. Post-G18 reassessment selected FRONTEND G19 for tracked orphan `DictateToPlanPanel.tsx` UI
    residue. This is deletion-only source cleanup; backend `voice-to-plan` truth remains a
    non-default backend seam and must not be deleted or changed.
41. G19 is complete: tracked orphan `DictateToPlanPanel.tsx` residue was deleted while backend
    voice-to-plan truth remains owned by `first-plan-actions`, `voice-to-plan-authoring`,
    entitlements, onboarding form-model types, plan-authoring snapshot mapping, and doctrine proof.
42. Post-G19 reassessment selected ARCHITECT G20 for the untracked duplicate-space manual-workout
    backlog markdown copy. This is docs/admin-mirror source-of-truth hygiene only.
43. G20 is complete: the untracked duplicate-space manual-workout backlog markdown copy was deleted
    after admin-root proof, preserving the canonical tracked backlog item and importer contract.
44. The simplification strike is back in source-proof holding. Select a next gate only after fresh
    source/import/docs evidence proves one owner, one risk class, and one validation story.
45. Keep runtime/frontend cleanup conservative. Shipped manual builder, active-plan calendar,
   selected-plan create, export/import, admin, and Hito DS behavior must not be refactored by vibe or
   line count.
46. Do not delete `qa-artifacts/` before a separate QA evidence retention policy exists.
47. Keep QR/share/import, recurrence, Restore UI, universal Copy/Paste, generated-plan mutation
   expansion, persisted `Edit training` UI, and modal polish out of this cleanup track unless Product
   explicitly opens a dedicated gate.

## Immediate Next Gate

None selected / source-proof holding.

G20 is complete and accepted. The cleanup burndown is now `37/40` complete, `3` remaining, and
`92.5%` complete. No next implementation batch is selected in this closeout. Broader runtime,
backend ops hardening, docs/devtools cleanup, or browser-sensitive cleanup remains deferred unless
fresh import/reference/docs proof selects another bounded seam with one owner, one risk class, and
one validation story.

## QA Expectations

For docs/source-of-truth cleanup:

- Run scoped `git diff --check` on changed markdown files.
- If markdown files move between repo-derived admin roots, run
  `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`.
- If backlog/admin mirror metadata changes, run `npm run validate-admin-capture-backlog`.
- No build, browser QA, Supabase mutation, OpenAI call, or migration is required unless runtime or
  backlog-imported files are unexpectedly changed.

For future implementation cleanup selected after G5:

- Backend/runtime cleanup must include import/reference proof, targeted ESLint, relevant validators,
  and `npm run build` when public exports/imports change.
- Frontend cleanup must include Hito DS preflight, targeted ESLint, build, and browser proof for any
  behavior-visible route or responsive surface.
- Validation coverage must be preserved; do not delete checks just to reduce line count.

## Risks

- Reintroducing old Plan Preset review/confirm language would recreate a removed creation seam.
- Broadly narrowing `training-api.ts` beyond fresh import-map evidence could break route-facing
  server functions.
- Auth callback behavior is login-critical; future cleanup must preserve code and token-hash
  exchange, redirects, Supabase session cookies, local-auth availability, and admin-auth separation.
- Treating schedule edit preview as stale would remove a current Open plan capability.
- Reintroducing the removed G4B validator assertion would again require the stale `training-api.ts`
  Plan Preset card re-export.
- Touching manual calendar/runtime UI without browser-safe scope could regress shipped manual editing.
- Treating `qa-artifacts/` as disposable logs could destroy acceptance evidence.
- Selecting runtime cleanup by file size alone could move business truth into the wrong layer.
- Removing admin placeholders without browser proof could accidentally disturb shipped admin
  analytics, capture/backlog, auth/logout, or responsive shell behavior.
- Merging Hito DS rollout, admin cleanup, manual authoring, running-plan engine, and global cleanup
  into one slice would recreate the drift this plan is trying to prevent.

## Exit Criteria

This simplification strike can close only when:

- Active cleanup source-of-truth stays compact and current.
- `docs/plans/active/` contains only real active execution plans.
- Generated/cache/vendor/build/log/artifact roots stay outside product-code size claims.
- At least one stale runtime or source-of-truth seam has been deleted or demoted with validation.
- The next runtime/frontend cleanup gate is selected from current import/capability proof, not old
  historical prompts.
- Accepted manual builder, selected-plan creation, active-plan editability, export/import, admin,
  and Hito DS behavior remain intact.
- No fake metric truth, AI fallback leak, frontend-owned plan truth, or revived Plan Preset
  create/confirm path is introduced.

## Blockers

- No blocker from G13 closeout.
- No blocker for the selected UI-C1 handoff.
- Broader UI/DS adoption candidates remain deferred until UI-C1 proves the runtime-consumer cleanup
  validation path.
- QA artifact deletion is blocked until a separate QA evidence retention policy exists.
