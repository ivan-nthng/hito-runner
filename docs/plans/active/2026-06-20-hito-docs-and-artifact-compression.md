# Hito Docs And Artifact Compression

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Hold docs/artifact cleanup after QA-passed E13/E14 manual-workout QA image compression apply.

## Stage

ARCHITECT holding / post-apply closeout and next-gate safety review.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Resume the Hito docs/artifact compression track only after the holding trigger is met.

Stage:
ARCHITECT holding trigger review / no evidence mutation.

Context:
E13/E14 manual-workout QA image compression is closed as QA-passed. The active hold exists because
the remaining artifact surface is split across different owners and risk classes: manual-workout
image candidates are exhausted, generated/vendor residue is a separate non-image/vendor cleanup
story, current `delete-after-expiry` value is small, and larger remaining surfaces are
`keep-until-plan-archive`, `promote-to-docs-digest`, or `unknown/manual-review`.

Scope:
1. Read `AGENTS.md`, `agents/architect.agent.md`, `docs/process/qa-artifact-policy.md`, this active
   plan, and fresh dry-run artifact output.
2. Do not mutate evidence, runtime code, product code, Supabase, OpenAI, logs, or generated output.
3. Resume only if a fresh read-only manifest plus targeted dry-run proves one material candidate
   with one owner, one risk class, and one validation story.
4. For generated/vendor residue, require a separate policy/tooling proof before selecting any
   cleanup: full manifest, exclusion from image compression, rollback/quarantine semantics outside
   active `qa-artifacts/`, hash/count preflight, and generated/vendor-only validation.
5. For image compression, require a successful targeted estimate/sample path first; do not select
   an apply gate when estimate tooling fails, image candidates are zero, or visual acceptability is
   not proved.
6. If no safe material candidate exists, keep the plan in holding and update only the compact ledger.

Validation:
- `npm run artifact:hygiene`
- `npm run artifact:hygiene -- --qa-folder-manifest`
- targeted dry-run/estimate command for the candidate owner, if one is under consideration
- `git diff --check -- docs/plans/active/2026-06-20-hito-docs-and-artifact-compression.md docs/work-dashboard.md`

Stop conditions:
- Stop if the next candidate crosses owner/risk boundaries or would select cleanup by momentum.
- Stop if generated/vendor cleanup lacks separate policy/tooling proof.
- Stop if any validation requires deletion, compression, archive, rename, move, rewrite, browser
  state, production data, Supabase, OpenAI, migrations, or runtime/product-code mutation.
```

## E14 Closeout — Manual-Workout QA Image Compression Apply Validation

Status: passed / E13 rollback-protected image apply accepted by QA; cleanup track holding.

Root cause:

- Visible symptom: the plan still pointed at QA validation after E14 passed.
- Underlying cause: source-of-truth metadata and the compact artifact-retention ledger had not yet
  been updated after QA accepted the apply proof.
- Canonical owner: documentation/source-of-truth in this active compression plan.

QA proof accepted:

| Field | Value |
| --- | ---: |
| Active `qa-artifacts/` before E13 apply | `2763` files / `952772 KiB` |
| Active `qa-artifacts/` after E13/E14 | `2763` files / `938900 KiB` |
| Selected image originals | `58/58` active PNG originals absent after apply |
| Rollback copies | `58/58` PNG rollback copies outside active `qa-artifacts/` |
| WebP outputs | `58/58` WebP siblings verified with matching hashes/sizes/dimensions |
| Original image bytes | `18,209,211` |
| WebP q82 bytes | `3,978,786` |
| Saved bytes | `14,230,425` / `78.15%` |
| Post-apply manual image candidates | `0` |
| Generated/vendor boundary | `0` selected/generated output paths; `pw/node_modules` unchanged |

Rollback/apply manifests:

- `.local-artifact-archive/qa-image-compression/manual_workout_authoring-webp-q82-2026-06-23T00-09-35-289Z/manifest.json`
- `.local-artifact-archive/qa-image-compression/manual_workout_authoring-webp-q82-2026-06-23T00-09-35-289Z/apply-result.json`

Validation evidence:

- `npm run artifact:hygiene`: passed; dry-run, `mutation:false`, `evidenceMutation:false`,
  `applyModeAvailable:false`.
- `npm run artifact:hygiene -- --qa-folder-manifest`: passed; dry-run classification only.
- `npm run artifact:hygiene -- --qa-compression-estimate --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring`: passed with `imageFiles:0`.
- E14 targeted manifest/hash checks accepted `58` image entries, rollback copies, WebP outputs,
  generated/vendor non-mutation, and manifest/result agreement.

Fresh next-gate review:

| Lane | Current proof | Decision |
| --- | --- | --- |
| `manual_workout_authoring` image compression | `0` remaining image candidates; remaining selected bytes are non-image/generated residue | closed; do not repeat image compression |
| `delete-after-expiry` | `2` folders / `16` files / `7.48 MB`, `plan_creation` owner | hold; too small for a new apply gate |
| `compress-after-policy` | `68` folders / `701` files / `63.9 MB` across multiple owners | hold; requires owner-specific estimate/sample proof |
| `devtools` compression candidate | `16` folders / `39.2 MB`, but targeted estimate currently fails on WebP size limits | hold until tooling handles/flags oversized images safely |
| `keep-until-plan-archive` | `21` folders / `359.4 MB`, active-plan/direct-reference linked | blocked until owning plans/gates archive |
| `promote-to-docs-digest` | `7` folders / `28.5 MB`, directly referenced outside active plan | blocked until digest/promotion decision |
| `unknown/manual-review` | `88` folders / `443.1 MB`, includes admin-sensitive/recent/manual-review evidence | blocked on manual review |
| Generated/vendor residue | material `pw/node_modules` residue remains separate from images | blocked until separate generated/vendor policy/tooling proof |

Selected next gate:

Holding / no next docs-artifact cleanup gate selected.

Future trigger:

Resume only when a fresh read-only manifest plus targeted dry-run proves one material same-owner
candidate with one risk class and one validation story. Generated/vendor residue must first have a
separate policy/tooling proof; oversized-image estimate failures must be fixed or explicitly skipped
by the dry-run tooling before any image-compression sample/apply gate is selected.

Boundary:

- No evidence, runtime code, product code, Supabase, OpenAI, migrations, logs, `test-results`, or
  browser state were mutated by this closeout.
- Generated/vendor residue must not be mixed into image compression.
- Larger `unknown/manual-review`, `promote-to-docs-digest`, and `keep-until-plan-archive` classes are
  intentionally not selected by size alone.

## E13 Closeout — Manual-Workout QA Image WebP Apply

Status: complete / rollback-protected apply succeeded; QA accepted in E14.

Root cause:

- Visible symptom: local manual-workout QA image evidence remained large after visual acceptance and
  apply-safety proof.
- Underlying cause: the canonical reporter still lacked a guarded image-only apply mode.
- Canonical owner: BACKEND/OPS local artifact tooling in `scripts/report-local-artifact-hygiene.mjs`.

Apply proof:

| Field | Value |
| --- | ---: |
| Command | `npm run artifact:hygiene -- --apply-qa-image-compression` |
| Active `qa-artifacts/` before/after | `2763` files / `952772 KiB` -> `2763` files / `938900 KiB` |
| Selected images | `58` `.png` files across `19` folders |
| Active originals removed | `58/58` |
| Rollback copies verified before mutation | `58/58` |
| WebP outputs verified | `58/58` |
| Original image bytes | `18,209,211` |
| WebP q82 bytes | `3,978,786` |
| Saved bytes | `14,230,425` / `78.15%` |
| Post-apply active image candidates | `0` |
| Generated/vendor all-node_modules hash comparison | `180` files / `17,412,113` bytes unchanged |

Rollback/apply manifests:

- `.local-artifact-archive/qa-image-compression/manual_workout_authoring-webp-q82-2026-06-23T00-09-35-289Z/manifest.json`
- `.local-artifact-archive/qa-image-compression/manual_workout_authoring-webp-q82-2026-06-23T00-09-35-289Z/apply-result.json`

Validation evidence:

- `node --check scripts/report-local-artifact-hygiene.mjs`: passed.
- `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs`: passed.
- Pre-apply `npm run artifact:hygiene -- --qa-compression-apply-safety-dry-run`: passed with `58`
  selected PNGs, `0` selected generated/vendor paths, rollback root inside `.local-artifact-archive/`,
  and matching E12 totals.
- Post-apply `npm run artifact:hygiene`: passed, dry-run and non-mutating.
- Post-apply `npm run artifact:hygiene -- --qa-folder-manifest`: passed, dry-run and non-mutating.
- Post-apply compression estimate for `manual_workout_authoring` + `compress-after-policy`: passed
  with `imageFiles:0`.

Boundary:

- Generated/vendor residue was not cleaned up and remains a separate future lane.
- Tracked docs evidence, backlog assets, logs, `test-results`, runtime code, frontend UI, Supabase,
  OpenAI, migrations, and browser state were not touched.

Selected next gate completed:

`QA Slice E14: validate E13 manual-workout QA image compression apply proof.`

## E12 Closeout — Image-Only Apply-Safety Dry-Run

Status: passed / corrected dry-run accepted.

Root cause:

- Visible symptom: E12 initially selected two Playwright PNGs under `pw/node_modules` as image
  candidates.
- Underlying cause: generated/vendor image paths were not excluded before image selection.
- Canonical owner: BACKEND/OPS reporter selection in `scripts/report-local-artifact-hygiene.mjs`.

Corrected QA proof:

| Field | Value |
| --- | ---: |
| Command | `npm run artifact:hygiene -- --qa-compression-apply-safety-dry-run` |
| Active `qa-artifacts/` before/after | `2763` files / `952772 KiB` -> `2763` files / `952772 KiB` |
| Mutation flags | `mutation:false`, `evidenceMutation:false`, `applyModeAvailable:false` |
| Selected images | `58` `.png` files across `19` folders |
| Selected generated/vendor paths | `0` |
| Generated/vendor image residue reported separately | `2` files / `35,510` bytes |
| Non-image/generated residue excluded | `306` files / `10,739,653` bytes |
| Total excluded residue | `308` files / `10,775,163` bytes |
| Original image bytes | `18,209,211` |
| Estimated WebP q82 bytes | `3,978,786` |
| Estimated savings | `14,230,425` / `78.15%` |
| Dimensions preserved | `58/58` |
| Originals unchanged | `58/58` |
| Rollback destinations outside `qa-artifacts` | `58/58` |

Validation evidence:

- `node --check scripts/report-local-artifact-hygiene.mjs`: passed.
- `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs`: passed.
- Required per-image dry-run fields passed for all `58/58`.

Selected next gate:

`BACKEND/OPS Slice E13: apply manual-workout QA image WebP compression with rollback manifest.`

Why E13 is policy-safe:

- It has one owner: BACKEND/OPS local artifact tooling.
- It has one risk class: apply-capable WebP q82 compression for corrected image-only local QA
  evidence.
- It has one validation story: exact pre-apply dry-run, original hash verification, rollback copies
  outside `qa-artifacts/`, apply-result manifest, post-apply count/bytes proof, and explicit
  generated/vendor non-mutation.
- It does not include generated/vendor residue cleanup; that remains a separate future lane.

## E11 Closeout — Manual-Workout WebP q82 Visual Acceptance

Status: passed / QA visual review accepted.

QA evidence:

- Disposable samples regenerated at `/tmp/hito-manual-workout-qa-compression-samples-e11`.
- Review sheets generated at `/tmp/hito-manual-workout-qa-compression-review-e11`.
- Reviewed `60/60` WebP q82 samples against originals.
- Dimensions preserved for `60/60` pairs.
- Text, dialogs, mobile `375px` states, calendar labels, action menus, move-target/blocked states,
  and layout/overflow proof remained readable and recognizable.
- `qa-artifacts/` remained unchanged before/after: `2763` files / `952772 KiB`.

Decision:

- Visual acceptance is sufficient to proceed to a bounded BACKEND/OPS image-only apply-safety
  contract.
- Do not apply compression yet. The next gate must prove exact manifest, checksums, rollback copy
  destination, restore instructions, and dry-run/apply boundaries first.
- Keep generated/non-image residue separate. The Playwright `pw/node_modules` residue and other
  non-image files remain out of the image compression gate.

## E10 Closeout — Manual-Workout Compression Estimate Decision

Status: accepted as read-only ARCHITECT decision.

Evidence reviewed:

- `npm run artifact:hygiene -- --qa-compression-estimate --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring`
- `npm run artifact:hygiene -- --write-qa-compression-samples --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring --sample-output-dir /tmp/hito-manual-workout-qa-compression-samples-architect-check-*`

Decision:

- Select `QA Slice E11` for one whole-batch WebP q82 visual acceptability review before any
  apply-capable compression.
- Do not send BACKEND/OPS to apply compression yet. Current compression tooling is estimate/sample
  only and policy still requires visual sample acceptance before format-changing evidence cleanup.
- Keep non-image/generated residue separate from image compression. The nested Playwright
  `pw/node_modules` residue is material, but it needs a later generated-residue manifest/quarantine
  gate rather than being mixed with image compression.

Compact ledger:

| Item | Value |
| --- | ---: |
| Selected folders | `51` |
| Selected files | `364` |
| Selected bytes | `28,984,374` |
| Direct references | `0` |
| Image files | `60` |
| Image original bytes | `18,244,721` |
| Estimated WebP q82 bytes | `3,996,918` |
| Estimated image savings | `14,247,803` / `78.09%` |
| Non-image/generated residue | `306` files / `10,739,653` bytes |

Subagents:

- `Feynman`: confirmed QA visual sample review is required before BACKEND/OPS apply.
- `Hegel`: classified nested Playwright/non-image residue as a separate generated-residue cleanup
  lane.
- `Linnaeus`: confirmed current tooling lacks compression apply/checksum/rollback exactness and
  apply must wait for visual acceptance plus a later bounded apply-safety gate.

## Purpose

The core Hito Stack Simplification cleanup track is complete. The next source-of-truth risk is not
runtime dead code by default; it is documentation and local evidence noise:

- docs started around `89k` markdown lines and are about `48.4k` lines after D23;
- archived plans and historical task specs contain long execution logs that are useful history but
  too bulky as the first thing agents read;
- current docs must stay concise implemented truth, not history dumps;
- local logs and generated test results need retention tooling before deletion;
- `qa-artifacts/` is large, but it is protected acceptance evidence until a dedicated QA retention
  policy decides what can be promoted, compressed, or deleted.

This plan owns the strategy and bounded execution gates for docs compression, product-history
digesting, and local artifact-retention policy. It must not reopen product/runtime cleanup.

## Core Cleanup Closeout

- G23 is accepted as behavior-preserving backend cleanup.
- [Hito Stack Simplification Strike](../archive/2026-06-07-hito-stack-simplification-strike.md) is
  archived as completed cleanup history.
- `cleanup-burndown-v1` is final at `40/40` complete, `0` remaining, `100%`.
- No follow-up BACKEND implementation is needed for the G23 scope.
- Changelog remains unchanged because the G23 closeout and this new plan are internal
  source-of-truth cleanup, not new runner-facing shipped behavior.

## Baseline — 2026-06-20

Line-count commands used:

```bash
find docs -type f -name '*.md' -not -path '*/node_modules/*' -print0 | xargs -0 wc -l
find docs/plans/active -type f -name '*.md' -print0 | xargs -0 wc -l
find docs/plans/archive -type f -name '*.md' -print0 | xargs -0 wc -l
find docs/tasks/backlog -type f -name '*.md' -print0 | xargs -0 wc -l
find docs/tasks/product-briefs -type f -name '*.md' -print0 | xargs -0 wc -l
find docs/tasks/frontend-specs -type f -name '*.md' -print0 | xargs -0 wc -l
find docs/tasks/running-coach -type f -name '*.md' -print0 | xargs -0 wc -l
```

Artifact-size commands used:

```bash
for p in docs logs qa-artifacts test-results; do find "$p" -type f | wc -l; du -sh "$p"; done
npm run artifact:hygiene
```

Docs baseline:

| Root | Markdown lines | Notes |
| --- | ---: | --- |
| `docs/` | `89204` | Total markdown docs surface after core simplification closeout |
| `docs/plans/active` | `9245` | Active execution plans only; should stay compact and current |
| `docs/plans/archive` | `42188` | Largest compression target; preserve metadata and final evidence |
| `docs/tasks/backlog` | `8855` | Admin-imported backlog truth; do not move/delete casually |
| `docs/tasks/product-briefs` | `3450` | Product-contract references; summarize only with metadata preserved |
| `docs/tasks/frontend-specs` | `13584` | Many historical UI specs; summarize only after owner proof |
| `docs/tasks/running-coach` | `6361` | Coaching doctrine/evidence; compress only with Running Coach boundary |
| `docs/history/changelog.md` | `663` | Canonical shipped-history source; do not replace with digest |
| Root current docs | `2282` | `current-*`, context, glossary, README; keep concise implemented truth |

Local/proof roots:

| Root | Files | Size | Classification |
| --- | ---: | ---: | --- |
| `logs/` | `512` | about `22MB` | generated local/dev/build/server logs; dry-run retention only |
| `qa-artifacts/` | `2895` | about `746MB` | protected local QA proof output / acceptance evidence |
| `test-results/` | `1` | about `4KB` | generated test-runner residue |

`npm run artifact:hygiene` currently reports `logs/` plus `test-results/` as a non-mutating
`20.8MB` / `513` file hygiene surface, with recent/old log classification but no apply/delete
approval. `qa-artifacts/` remains excluded by default and protected unless explicitly counted as
non-disposable evidence.

## Documentation Classification

| Class | Owner / examples | Compression rule |
| --- | --- | --- |
| Current source-of-truth docs | `docs/current-product.md`, `docs/current-system.md`, `docs/current-state.md`, `docs/current-functional-map.md`, `docs/context.md`, `docs/glossary.md` | Keep concise and current. Do not turn these into history dumps. |
| Active plans | `docs/plans/active/*` | Keep only real active execution. Compress stale history inside active plans or archive completed plans. |
| Archived plans | `docs/plans/archive/*` | Primary digest/compression target. Preserve metadata, final outcome, key decisions, validation, and links. |
| Admin-imported backlog/tasks/specs | `docs/tasks/backlog`, `docs/tasks/product-briefs`, `docs/tasks/frontend-specs`, `docs/plans/*` | Preserve canonical metadata blocks and importer compatibility. Run importer dry-run when materially editing or moving. |
| Changelog/history | `docs/history/changelog.md` and future digest | Changelog remains shipped-history source. Digest summarizes evolution and cleanup decisions; it must not replace changelog. |
| QA reports/evidence references | QA reports, artifact path mentions, `docs/process/*` | Preserve proof references. Do not delete artifacts from docs compression. |
| Deletion candidates | Duplicate local residue, `.DS_Store`, untracked copies only after proof | Delete only through dedicated source/admin proof. Do not treat markdown age as deletion proof. |
| Summarize-into-digest candidates | Large archived implementation plans and historical task clusters | Summarize repetitive execution logs into digest while preserving canonical metadata and final closeout evidence. |

## Product History Digest Policy

Proposed digest path:

- [docs/history/product-history-digest.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/product-history-digest.md)

Digest purpose:

- summarize product evolution by major capability track;
- preserve major architecture decisions and cleanup decisions in one compact narrative;
- link to archived plans and changelog instead of copying their full execution logs;
- help future agents understand why seams exist without reading every historical prompt.

Digest non-goals:

- not a replacement for `docs/history/changelog.md`;
- not the source for current implemented behavior;
- not a backlog, active plan, QA report, or product roadmap;
- not a place to hide unresolved future work as if it shipped.

## Artifact And QA Evidence Boundary

- `qa-artifacts/` is protected acceptance evidence. Do not delete or compress it until a dedicated
  QA artifact retention policy classifies what is permanent, what can be promoted to tracked docs,
  and what can be safely pruned.
- `logs/` and `test-results/` may receive DEVTOOLS retention tooling, but only through dry-run first
  and explicit apply later. No deletion is approved by this architecture plan.
- `npm run artifact:hygiene` remains the current non-mutating inventory owner for local generated
  logs and test-result residue.
- Evidence referenced by active QA blockers, accepted slices, release-readiness notes, or current
  product decisions must be preserved.

## First Selected Execution Batch

Selected first batch:

`ARCHITECT Slice D1: product history digest and archived-plan compression pilot.`

Why this batch first:

- It attacks the biggest current root cause: historical docs are still too large and hard to scan.
- It is docs-only and non-destructive.
- It does not touch product runtime, frontend UI, backend behavior, package scripts, Supabase,
  OpenAI, QA artifacts, or logs.
- It preserves admin-imported metadata and validates importer compatibility.
- It creates the digest structure needed before broader compression decisions.

Pilot targets:

| Target | Current line count | Reason |
| --- | ---: | --- |
| [Hito Stack Simplification Strike](../archive/2026-06-07-hito-stack-simplification-strike.md) | `3451` | Completed `40/40` cleanup ledger; keep final ledger and digest repetitive history |
| [First Plan Preset Library And Custom Authoring Escape Hatch](../archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md) | `2340` | Large archived plan with historical Plan Preset context; no longer active execution owner |
| [AI Authored First Plan Pipeline](../archive/2026-05-26-ai-authored-first-plan-pipeline.md) | `2238` | Large archived AI first-plan history; current truth lives in current docs and active running-plan docs |

## Slice D1 Closeout — 2026-06-20

Status: complete / first non-destructive compression pilot accepted.

What changed:

- Created [product history digest](../../history/product-history-digest.md) as the compact narrative
  layer for major product evolution and cleanup decisions.
- Compressed the first three archived pilot plans in place without moving files:
  - [Hito Stack Simplification Strike](../archive/2026-06-07-hito-stack-simplification-strike.md)
  - [First Plan Preset Library And Custom Authoring Escape Hatch](../archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)
  - [AI Authored First Plan Pipeline](../archive/2026-05-26-ai-authored-first-plan-pipeline.md)
- Preserved canonical metadata, final outcome, key decisions, validation evidence, source links, and
  stop conditions in each pilot archive.
- Preserved changelog semantics, current docs, runtime/source files, package scripts, logs, and
  `qa-artifacts/`.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md` | `3451` | `228` | `-3223` |
| `docs/plans/archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md` | `2340` | `240` | `-2100` |
| `docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md` | `2238` | `308` | `-1930` |
| `docs/history/product-history-digest.md` | `0` | `228` | `+228` |
| D1 net touched-doc delta | `8029` | `1004` | `-7025` |

Subagents:

- Digest/history structure subagent recommended a phase-level digest rather than a changelog copy.
- Archived-plan compression safety subagent identified the unique boundaries to preserve for stack
  cleanup, Plan Presets, and AI blueprint/envelope history.
- Admin-import metadata subagent confirmed the lead metadata blocks must remain before any
  non-metadata section and identified importer validation stop conditions.
- All three subagents were closed after their findings were integrated.

## Slice D2 Closeout — 2026-06-20

Status: complete / second archive-only compression wave accepted.

What changed:

- Compressed the second archive-only batch in place without moving files:
  - [Rich AI Draft Plan Authoring Pipeline](../archive/2026-05-25-rich-ai-draft-plan-authoring-pipeline.md)
  - [Plan Authoring Engine Decomposition And Legacy Cleanup](../archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md)
  - [Admin Analytics Page Plan](../archive/2026-05-17-admin-analytics-page-plan.md)
  - [Hito Component System Spec](../archive/2026-05-10-hito-component-system-spec.md)
  - [Typography System Audit And Canonicalization](../archive/2026-05-17-typography-system-audit-and-canonicalization.md)
- Preserved import-ready metadata, final outcomes, key decisions, validation evidence, current owner
  references, and stop-condition boundaries in each archive.
- Removed repetitive execution logs, stale handoff prompts, route-by-route inventories, superseded
  implementation details, and long historical local evidence blocks.
- Left `docs/history/product-history-digest.md` unchanged because the D2 context was already covered
  by the AI/plan-authoring, Admin/Ops, and Hito DS history sections.
- Preserved current docs, changelog semantics, runtime/source files, package scripts, logs,
  `test-results/`, and `qa-artifacts/`.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-25-rich-ai-draft-plan-authoring-pipeline.md` | `1050` | `142` | `-908` |
| `docs/plans/archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md` | `930` | `129` | `-801` |
| `docs/plans/archive/2026-05-17-admin-analytics-page-plan.md` | `886` | `133` | `-753` |
| `docs/plans/archive/2026-05-10-hito-component-system-spec.md` | `875` | `123` | `-752` |
| `docs/plans/archive/2026-05-17-typography-system-audit-and-canonicalization.md` | `855` | `128` | `-727` |
| D2 net touched-doc delta | `4596` | `655` | `-3941` |

Subagents:

- None. This D2 pass was a sequential archive-only rewrite across five known files with one
  validation story; the current prompt did not explicitly require delegation, and source risk was
  lower than the overhead of parallel subagent coordination.

## Slice D3 Closeout — 2026-06-20

Status: complete / third archive-only compression wave accepted.

What changed:

- Compressed the third archive-only batch in place without moving files:
  - [Architecture Legacy And Refactor Plan](../archive/2026-05-08-architecture-legacy-and-refactor-plan.md)
  - [Garmin FIT Upload Comparison And Recommendation Plan](../archive/2026-05-11-garmin-fit-upload-comparison-and-recommendation-plan.md)
  - [Training Plan Template Contract Spec](../archive/2026-05-07-training-plan-template-contract-spec.md)
  - [Workout Screenshot OpenAI Verdict Plan](../archive/2026-05-06-workout-screenshot-openai-verdict-plan.md)
  - [Architecture Cleanup Plan](../archive/2026-05-19-architecture-cleanup-plan.md)
- Preserved import-ready metadata, final outcomes, key decisions, validation evidence, current owner
  references, and stop-condition boundaries in each archive.
- Removed stale handoff blocks, repeated execution logs, long inventories, superseded
  implementation detail, and old evidence blocks already summarized by current docs, changelog, or
  the digest.
- Updated `docs/history/product-history-digest.md` with compact early-architecture and evidence
  pipeline context surfaced by the D3 history audit.
- Preserved current docs, changelog semantics, runtime/source files, package scripts, logs,
  `test-results/`, and `qa-artifacts/`.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-08-architecture-legacy-and-refactor-plan.md` | `818` | `125` | `-693` |
| `docs/plans/archive/2026-05-11-garmin-fit-upload-comparison-and-recommendation-plan.md` | `815` | `121` | `-694` |
| `docs/plans/archive/2026-05-07-training-plan-template-contract-spec.md` | `789` | `124` | `-665` |
| `docs/plans/archive/2026-05-06-workout-screenshot-openai-verdict-plan.md` | `774` | `127` | `-647` |
| `docs/plans/archive/2026-05-19-architecture-cleanup-plan.md` | `771` | `129` | `-642` |
| D3 archive file delta | `3967` | `626` | `-3341` |

Subagents:

- Compression safety subagent confirmed all five D3 files were archive-only compression candidates
  if final outcomes, decisions, validation, and no-resume boundaries were preserved.
- Admin metadata safety subagent confirmed the old D3 files lacked safe lead canonical metadata and
  that compression should add one valid import-ready block per file.
- Digest/history drift subagent identified three compact history additions for the digest and found
  no blocking current-doc sync requirement.
- All three read-only subagents were closed after their findings were integrated.

Next selected batch:

`ARCHITECT Slice D4: first admin-imported specs/backlog compression pilot.`

Recommended D4 targets are the largest task/spec files in admin-imported roots, selected as a
cautious in-place pilot rather than broad task-root compression:

| Target | Current line count before D4 | Reason |
| --- | ---: | --- |
| [Manual User Built Plan Flow Spec](../../tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md) | `1303` | large accepted manual-authoring spec; preserve current/future boundaries and QA proof references |
| [Voice To Plan Authoring Plan](../../tasks/backlog/2026-05-18-voice-to-plan-authoring-plan.md) | `1169` | backlog/future voice context; preserve backend voice truth and avoid making it active execution |
| [Hito DS Foundations Cleanup And Rollout Spec](../../tasks/frontend-specs/2026-05-20-hito-ds-foundations-cleanup-and-rollout-spec.md) | `933` | historical DS rollout detail; current DS/Figma truth lives in active IA plan and current docs |
| [Hito DS Reference Simplification Spec](../../tasks/frontend-specs/2026-05-24-hito-ds-reference-simplification-spec.md) | `904` | older DS reference cleanup detail; compress while preserving accepted source-of-truth lessons |
| [Hito DS Spec](../../tasks/frontend-specs/2026-05-06-hito-ds-spec.md) | `851` | early DS spec history; preserve reusable decisions without treating old details as current implementation |

## Slice D4 Closeout — 2026-06-20

Status: complete / first admin-imported specs/backlog compression pilot accepted.

What changed:

- Compressed four admin-imported task/spec files in place:
  - [Voice-To-Plan Authoring Plan](../../tasks/backlog/2026-05-18-voice-to-plan-authoring-plan.md)
  - [Hito DS Foundations Cleanup And Rollout Spec](../../tasks/frontend-specs/2026-05-20-hito-ds-foundations-cleanup-and-rollout-spec.md)
  - [Hito DS Reference Simplification Spec](../../tasks/frontend-specs/2026-05-24-hito-ds-reference-simplification-spec.md)
  - [Hito Full DS Coverage Audit And Rollout Spec](../../tasks/frontend-specs/2026-05-24-full-ds-coverage-audit-and-rollout-spec.md)
- Preserved lead canonical metadata blocks, current owner references, final/current status, accepted
  decisions, validation boundaries, and stop conditions.
- Added compact digest context for early Hito DS evolution and voice-to-plan's split between
  backend transcript truth and future raw-audio transport.
- Explicitly demoted stale voice UI/transcript-panel wording as historical rather than current
  accepted product truth.
- Skipped the larger manual user-built plan flow spec because it remains current contract material
  linked from active manual-authoring work.
- Skipped workout-detail IA because it remains in-progress/current and not safe for broad
  compression.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/backlog/2026-05-18-voice-to-plan-authoring-plan.md` | `1169` | `168` | `-1001` |
| `docs/tasks/frontend-specs/2026-05-20-hito-ds-foundations-cleanup-and-rollout-spec.md` | `933` | `147` | `-786` |
| `docs/tasks/frontend-specs/2026-05-24-hito-ds-reference-simplification-spec.md` | `904` | `134` | `-770` |
| `docs/tasks/frontend-specs/2026-05-24-full-ds-coverage-audit-and-rollout-spec.md` | `776` | `132` | `-644` |
| D4 task/spec file delta | `3782` | `581` | `-3201` |

Importer warnings:

- Admin importer dry-run still reports pre-existing metadata-quality warnings in unrelated
  backlog/spec/brief files.
- D4 did not introduce duplicate repo-derived concepts or Supabase writes.
- The warnings should be handled by a metadata-quality pilot, not treated as a D4 regression.

Subagents:

- Admin metadata safety subagent confirmed D4 must preserve lead canonical metadata and identified
  safe metadata normalization targets.
- Compression target selection subagent recommended voice-to-plan and DS completed/history specs,
  and rejected the manual flow and workout-detail specs for this pilot.
- Current-truth/digest drift subagent recommended compact digest additions and flagged stale voice
  UI wording as historical.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D5: first admin-imported metadata-quality normalization pilot.`

Recommended D5 targets focus on importer quality without compressing current truth:

| Target | Reason |
| --- | --- |
| [Manual User Built Plan Flow Spec](../../tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md) | metadata-only normalization; body remains current manual-authoring contract |
| [Provider Activity Ingestion And Comparison Contract](../../tasks/product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md) | metadata-only normalization before any future provider-doc compression |
| [Hito DS Spec](../../tasks/frontend-specs/2026-05-06-hito-ds-spec.md) | classify as historical/backlog DS context and normalize metadata before deciding whether to compress |

## Slice D5 Closeout — 2026-06-20

Status: complete / first admin-imported metadata-quality normalization pilot accepted.

What changed:

- Normalized lead Admin importer metadata in eight backlog items shown by the D5 dry-run examples:
  - [Plan Preset Library And Custom Authoring Escape Hatch](../../tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)
  - [Additional Plan Preset Families](../../tasks/backlog/2026-06-07-additional-plan-preset-families.md)
  - [Plan Preset Active-Plan Replacement And Refresh](../../tasks/backlog/2026-06-07-plan-preset-active-plan-replacement-refresh.md)
  - [QA Screenshot Artifact Reliability](../../tasks/backlog/2026-06-07-qa-screenshot-artifact-reliability.md)
  - [Workout Target Display And Metric-Prescription Grammar Cleanup](../../tasks/backlog/2026-06-11-workout-target-display-and-metric-prescription-grammar.md)
  - [Admin Capture Bug 01](../../tasks/backlog/2026-06-13-admin-capture-bug-01-add-quick-note-dialog-dismissal-and-shell-reuse.md)
  - [Manual Authoring Bug 01](../../tasks/backlog/2026-06-13-manual-authoring-bug-01-template-flow-and-constructor-grammar.md)
  - [Manual Authoring Bug 02](../../tasks/backlog/2026-06-13-manual-authoring-bug-02-calendar-move-drag-ux-and-review-error.md)
- Preserved current product truth, backlog bodies, evidence links, owner boundaries, and validation
  context.
- Did not compress current-contract docs.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  or `qa-artifacts/`.

Metadata-quality result:

| Metric | Before D5 | After D5 | Delta |
| --- | ---: | ---: | ---: |
| Missing `Status` | `26` | `26` | `0` |
| Missing `Type` | `57` | `57` | `0` |
| Missing `Priority` | `63` | `60` | `-3` |
| Missing `Next Recommended Role` | `60` | `57` | `-3` |
| Missing `Task` | `63` | `60` | `-3` |
| Missing `Stage` | `63` | `60` | `-3` |
| Missing `Exact Handoff Prompt` | `68` | `65` | `-3` |
| Invalid `Status` | `47` | `44` | `-3` |
| Invalid `Type` | `4` | `0` | `-4` |
| Invalid `Next Recommended Role` | `10` | `7` | `-3` |

Line-count result:

| File group | Before | After | Delta |
| --- | ---: | ---: | ---: |
| D5 touched backlog metadata pilot | `1354` | `1443` | `+89` |

The small line-count increase is expected because D5 added missing canonical metadata and exact
handoff prompts instead of compressing current-contract content.

Importer warnings:

- Admin importer dry-run remains `ok: true`, non-mutating, and `duplicateCount: 0`.
- Remaining metadata-quality warnings are pre-existing and now appear in the next dry-run examples.
- No D5-caused metadata-quality regression was observed.

Subagents:

- None. This D5 pass was a dry-run-driven sequential metadata normalization pilot over the visible
  importer examples; no independent subagent research was needed and the current tool policy did not
  require spawning additional agents.

Next selected batch:

`ARCHITECT Slice D6: second admin-imported metadata-quality normalization pilot.`

Recommended D6 targets should come from the post-D5 importer examples:

| Target | Boundary |
| --- | --- |
| `docs/tasks/backlog/2026-06-13-manual-authoring-bug-03-copy-paste-review-error.md` | metadata-only; preserve bug evidence/body |
| `docs/tasks/backlog/2026-06-13-manual-authoring-bug-04-non-rest-template-selection-no-op.md` | metadata-only; preserve bug evidence/body |
| `docs/tasks/backlog/2026-06-13-manual-authoring-bug-stack.md` | metadata-only; preserve stack relationships |
| `docs/tasks/backlog/2026-06-15-workout-metric-enrichment-truth-audit.md` | metadata-only; preserve accepted metric-truth boundary |
| `docs/tasks/product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md` | metadata-only before any future compression |
| `docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md` | metadata-only before any future compression |
| `docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md` | metadata-only; do not compress current manual contract |
| `docs/tasks/frontend-specs/2026-06-13-calendar-rest-day-add-affordance-correction-spec.md` | metadata-only; preserve spec body |

## Slice D6 Closeout — 2026-06-20

Status: complete / second admin-imported metadata-quality normalization pilot accepted.

What changed:

- Normalized lead Admin importer metadata in eight docs shown by the post-D5 dry-run examples:
  - [Manual Authoring Bug 03](../../tasks/backlog/2026-06-13-manual-authoring-bug-03-copy-paste-review-error.md)
  - [Manual Authoring Bug 04](../../tasks/backlog/2026-06-13-manual-authoring-bug-04-non-rest-template-selection-no-op.md)
  - [Manual Authoring Bug Stack](../../tasks/backlog/2026-06-13-manual-authoring-bug-stack.md)
  - [Workout Metric Enrichment Truth Audit](../../tasks/backlog/2026-06-15-workout-metric-enrichment-truth-audit.md)
  - [Provider Activity Ingestion And Comparison Contract](../../tasks/product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md)
  - [Universal Selected-Distance No-Dead-End UX Taxonomy](../../tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md)
  - [Manual User-Built Plan Flow Spec](../../tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md)
  - [Calendar Rest-Day Add Affordance Correction Spec](../../tasks/frontend-specs/2026-06-13-calendar-rest-day-add-affordance-correction-spec.md)
- Preserved body content, current-contract details, product decisions, validation evidence, owner
  boundaries, current/future distinction, logs, `test-results/`, and `qa-artifacts/`.
- Did not compress or rewrite current contract/spec bodies.
- Fixed a metadata-block ordering issue in three manual-authoring bug docs by keeping optional
  `Severity` below the canonical lead metadata block.

Metadata-quality result:

| Metric | Before D6 | After D6 | Delta |
| --- | ---: | ---: | ---: |
| Missing `Status` | `26` | `24` | `-2` |
| Missing `Type` | `57` | `54` | `-3` |
| Missing `Priority` | `60` | `54` | `-6` |
| Missing `Next Recommended Role` | `57` | `51` | `-6` |
| Missing `Task` | `60` | `54` | `-6` |
| Missing `Stage` | `60` | `54` | `-6` |
| Missing `Exact Handoff Prompt` | `65` | `58` | `-7` |
| Invalid `Status` | `43` | `39` | `-4` |
| Invalid `Type` | `0` | `0` | `0` |
| Invalid `Next Recommended Role` | `7` | `7` | `0` |

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/backlog/2026-06-13-manual-authoring-bug-03-copy-paste-review-error.md` | `105` | `114` | `+9` |
| `docs/tasks/backlog/2026-06-13-manual-authoring-bug-04-non-rest-template-selection-no-op.md` | `120` | `129` | `+9` |
| `docs/tasks/backlog/2026-06-13-manual-authoring-bug-stack.md` | `113` | `122` | `+9` |
| `docs/tasks/backlog/2026-06-15-workout-metric-enrichment-truth-audit.md` | `274` | `274` | `0` |
| `docs/tasks/product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md` | `681` | `727` | `+46` |
| `docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md` | `252` | `298` | `+46` |
| `docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md` | `1303` | `1345` | `+42` |
| `docs/tasks/frontend-specs/2026-06-13-calendar-rest-day-add-affordance-correction-spec.md` | `280` | `298` | `+18` |
| D6 touched-doc metadata pilot | `3128` | `3307` | `+179` |

The line-count increase is expected because D6 added canonical metadata and exact prompts rather
than compressing bodies.

Importer warnings:

- Admin importer dry-run remains `ok: true`, non-mutating, and `duplicateCount: 0`.
- The eight selected D6 files disappeared from the post-D6 warning examples.
- Remaining metadata-quality warnings are pre-existing and now appear in the next dry-run examples.
- No D6-caused metadata-quality regression was observed.

Subagents:

- None. This D6 pass was a focused sequential metadata normalization pilot over eight dry-run
  examples. The task was safer to complete directly because no body compression, source movement, or
  cross-owner judgment was needed.

Next selected batch:

`ARCHITECT Slice D7: third admin-imported metadata-quality normalization pilot.`

Recommended D7 targets should come from the post-D6 importer examples and stay metadata-only:

| Target | Boundary |
| --- | --- |
| `docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md` | metadata-only; preserve dropdown/calendar spec body |
| `docs/tasks/frontend-specs/2026-06-13-modal-and-sheet-consistency-spec.md` | metadata-only; preserve modal/sheet spec body |
| `docs/tasks/frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md` | metadata-only; preserve Figma bridge spec body |
| `docs/tasks/frontend-specs/2026-06-15-workout-detail-lifecycle-ia-spec.md` | metadata-only; preserve workout-detail current-contract body |
| `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md` | metadata-only; preserve active manual-authoring plan body |

## Slice D7 Closeout — 2026-06-20

Status: complete / third admin-imported metadata-quality normalization pilot accepted.

What changed:

- Normalized lead Admin importer metadata in five current spec/active-plan docs shown by the
  post-D6 dry-run examples:
  - [Dropdown Family And Calendar DS Normalization Spec](../../tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md)
  - [Modal And Sheet Consistency Spec](../../tasks/frontend-specs/2026-06-13-modal-and-sheet-consistency-spec.md)
  - [Hito DS Figma Export Surface Spec](../../tasks/frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md)
  - [Workout Detail Lifecycle IA Spec](../../tasks/frontend-specs/2026-06-15-workout-detail-lifecycle-ia-spec.md)
  - [Manual Workout Authoring And User-Built Plans](2026-06-09-manual-workout-authoring-and-user-built-plans.md)
- Preserved all body content, current contracts, validation evidence, owner boundaries, and active
  manual-authoring execution truth.
- Moved long narrative status text out of lead `Status` fields and into body status sections where
  needed.
- Kept optional fields such as `Owner`, `Last Updated`, and `Suggested Next Step` below the
  canonical lead metadata block where needed so the importer can see `Exact Handoff Prompt`.
- Did not compress or rewrite any spec/plan bodies.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  or `qa-artifacts/`.

Metadata-quality result:

| Metric | Before D7 | After D7 | Delta |
| --- | ---: | ---: | ---: |
| Missing `Status` | `24` | `24` | `0` |
| Missing `Type` | `54` | `54` | `0` |
| Missing `Priority` | `54` | `54` | `0` |
| Missing `Next Recommended Role` | `51` | `51` | `0` |
| Missing `Task` | `54` | `54` | `0` |
| Missing `Stage` | `54` | `54` | `0` |
| Missing `Exact Handoff Prompt` | `58` | `54` | `-4` |
| Invalid `Status` | `39` | `35` | `-4` |
| Invalid `Type` | `0` | `0` | `0` |
| Invalid `Next Recommended Role` | `7` | `7` | `0` |

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md` | `428` | `451` | `+23` |
| `docs/tasks/frontend-specs/2026-06-13-modal-and-sheet-consistency-spec.md` | `539` | `561` | `+22` |
| `docs/tasks/frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md` | `530` | `548` | `+18` |
| `docs/tasks/frontend-specs/2026-06-15-workout-detail-lifecycle-ia-spec.md` | `782` | `786` | `+4` |
| `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md` | `3670` | `3672` | `+2` |
| D7 touched-doc metadata pilot | `5949` | `6018` | `+69` |

The line-count increase is expected because D7 added or exposed canonical metadata and exact
handoff prompts instead of compressing current-contract content.

Importer warnings:

- Admin importer dry-run remains `ok: true`, non-mutating, and `duplicateCount: 0`.
- The five selected D7 files disappeared from the post-D7 warning examples.
- Remaining metadata-quality warnings are pre-existing and now appear primarily in archive-plan
  examples.
- No D7-caused metadata-quality regression was observed.

Subagents:

- Admin metadata safety subagent confirmed lead metadata block parsing rules and identified the
  contiguous-block issues that hid `Exact Handoff Prompt` in several D7 files.
- Current-contract/body preservation subagent confirmed the four frontend specs were safe for
  metadata-only edits and listed body sections that must remain unchanged.
- Active-plan truth drift subagent confirmed the manual authoring plan was safe for metadata-only
  `Status` normalization if the narrative status and current FRONTEND next gate were preserved.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D8: fourth admin-imported metadata-quality normalization pilot.`

Recommended D8 targets should come from the post-D7 importer examples and stay metadata-only:

| Target | Boundary |
| --- | --- |
| `docs/plans/archive/2026-05-05-full-baseline-import-and-stabilization-plan.md` | metadata-only; preserve archived baseline/import history |
| `docs/plans/archive/2026-05-06-supabase-program-storage-readiness-plan.md` | metadata-only; preserve archived Supabase readiness history |
| `docs/plans/archive/2026-05-06-supabase-training-data-structure-plan.md` | metadata-only; preserve archived training-data structure history |
| `docs/plans/archive/2026-05-07-openai-text-to-plan-authoring-plan.md` | metadata-only; preserve archived OpenAI text-to-plan history |
| `docs/plans/archive/2026-05-07-plan-authoring-flow-redesign.md` | metadata-only; preserve archived plan-authoring flow history |
| `docs/plans/archive/2026-05-07-training-plan-v2-integration-plan.md` | metadata-only; preserve archived V2 integration history |
| `docs/plans/archive/2026-05-07-workout-page-and-detailed-json-contract-plan.md` | metadata-only; preserve archived workout-page contract history |
| `docs/plans/archive/2026-05-09-full-product-capability-and-qa-spec.md` | metadata-only; preserve archived product capability and QA history |

## Slice D8 Closeout — 2026-06-20

Status: complete / fourth admin-imported metadata-quality normalization pilot accepted.

What changed:

- Added valid lead Admin importer metadata blocks to eight archived plans shown by the post-D7
  dry-run examples:
  - [Full Baseline Import And Stabilization Plan](../archive/2026-05-05-full-baseline-import-and-stabilization-plan.md)
  - [Supabase Program Storage Readiness Plan](../archive/2026-05-06-supabase-program-storage-readiness-plan.md)
  - [Supabase Training Data Structure Plan](../archive/2026-05-06-supabase-training-data-structure-plan.md)
  - [OpenAI Text-To-Plan Authoring Plan](../archive/2026-05-07-openai-text-to-plan-authoring-plan.md)
  - [Plan Authoring Flow Redesign](../archive/2026-05-07-plan-authoring-flow-redesign.md)
  - [Training Plan V2 Integration Plan](../archive/2026-05-07-training-plan-v2-integration-plan.md)
  - [Workout Page And Detailed JSON Contract Plan](../archive/2026-05-07-workout-page-and-detailed-json-contract-plan.md)
  - [Full Product Capability And QA Spec](../archive/2026-05-09-full-product-capability-and-qa-spec.md)
- Preserved archived body content, Archive Notes, final/current-progress sections, decisions,
  validation evidence, boundary notes, current-owner references, and historical handoff blocks.
- Did not compress archive bodies or update current docs/product history because no current-doc or
  digest drift was found.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  or `qa-artifacts/`.

Metadata-quality result:

| Metric | Before D8 | After D8 | Delta |
| --- | ---: | ---: | ---: |
| Missing `Status` | `24` | `24` | `0` |
| Missing `Type` | `54` | `46` | `-8` |
| Missing `Priority` | `54` | `46` | `-8` |
| Missing `Next Recommended Role` | `51` | `43` | `-8` |
| Missing `Task` | `54` | `46` | `-8` |
| Missing `Stage` | `54` | `46` | `-8` |
| Missing `Exact Handoff Prompt` | `54` | `46` | `-8` |
| Invalid `Status` | `35` | `28` | `-7` |
| Invalid `Type` | `0` | `0` | `0` |
| Invalid `Next Recommended Role` | `7` | `7` | `0` |

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-05-full-baseline-import-and-stabilization-plan.md` | `723` | `762` | `+39` |
| `docs/plans/archive/2026-05-06-supabase-program-storage-readiness-plan.md` | `577` | `616` | `+39` |
| `docs/plans/archive/2026-05-06-supabase-training-data-structure-plan.md` | `550` | `589` | `+39` |
| `docs/plans/archive/2026-05-07-openai-text-to-plan-authoring-plan.md` | `522` | `561` | `+39` |
| `docs/plans/archive/2026-05-07-plan-authoring-flow-redesign.md` | `566` | `605` | `+39` |
| `docs/plans/archive/2026-05-07-training-plan-v2-integration-plan.md` | `738` | `777` | `+39` |
| `docs/plans/archive/2026-05-07-workout-page-and-detailed-json-contract-plan.md` | `550` | `589` | `+39` |
| `docs/plans/archive/2026-05-09-full-product-capability-and-qa-spec.md` | `454` | `493` | `+39` |
| D8 touched-doc metadata pilot | `4680` | `4992` | `+312` |

The line-count increase is expected because D8 added canonical metadata to archived plans instead
of compressing historical bodies.

Importer warnings:

- Admin importer dry-run remains `ok: true`, non-mutating, and `duplicateCount: 0`.
- The eight selected D8 files disappeared from the post-D8 warning examples.
- Remaining metadata-quality warnings are pre-existing and now appear in the next archive-plan
  examples.
- No D8-caused metadata-quality regression was observed.

Subagents:

- Admin metadata safety subagent confirmed each D8 file's missing/invalid lead metadata and the
  stop condition not to re-promote archived work as active.
- Archive/history preservation subagent confirmed metadata-only normalization was safe and that
  Archive Notes, progress/status history, decisions, validation evidence, and historical handoff
  blocks should remain untouched.
- Current-doc/product-history drift subagent found no current-doc drift and recommended no digest
  update for D8.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D9: fifth admin-imported metadata-quality normalization pilot.`

Recommended D9 targets should come from the post-D8 importer examples and stay metadata-only:

| Target | Boundary |
| --- | --- |
| `docs/plans/archive/2026-05-09-phase-5-final-legacy-removal-plan.md` | metadata-only; preserve archived phase-5 cleanup history |
| `docs/plans/archive/2026-05-10-design-system-slice-1-review.md` | metadata-only; preserve archived DS review history |
| `docs/plans/archive/2026-05-10-hito-component-system-spec.md` | metadata-only; preserve compressed component-system history |
| `docs/plans/archive/2026-05-10-hito-design-system-spec-and-rollout-plan.md` | metadata-only; preserve archived DS rollout history |
| `docs/plans/archive/2026-05-11-full-design-system-normalization-plan.md` | metadata-only; preserve archived DS normalization history |
| `docs/plans/archive/2026-05-11-next-garmin-phase-plan.md` | metadata-only; preserve archived Garmin planning history |
| `docs/plans/archive/2026-05-11-post-feedback-garmin-phase-plan.md` | metadata-only; preserve archived Garmin feedback history |
| `docs/plans/archive/2026-05-12-feedback-loaded-state-design-pass.md` | metadata-only; preserve archived loaded-state design history |

## Slice D9 Closeout — 2026-06-20

Status: complete / fifth admin-imported metadata-quality normalization pilot accepted.

What changed:

- Added or normalized valid lead Admin importer metadata in eight archived plans shown by the
  post-D8 dry-run examples:
  - [Phase 5 Final Legacy Removal Plan](../archive/2026-05-09-phase-5-final-legacy-removal-plan.md)
  - [Design System Slice 1 Review](../archive/2026-05-10-design-system-slice-1-review.md)
  - [Hito Component System Spec](../archive/2026-05-10-hito-component-system-spec.md)
  - [Hito Design System Spec And Rollout Plan](../archive/2026-05-10-hito-design-system-spec-and-rollout-plan.md)
  - [Full Design System Normalization Plan](../archive/2026-05-11-full-design-system-normalization-plan.md)
  - [Next Garmin Phase Plan](../archive/2026-05-11-next-garmin-phase-plan.md)
  - [Post-Feedback Garmin Phase Plan](../archive/2026-05-11-post-feedback-garmin-phase-plan.md)
  - [Feedback Loaded-State Design Pass](../archive/2026-05-12-feedback-loaded-state-design-pass.md)
- Preserved archived body content, Archive Notes, final outcomes, key decisions, validation
  evidence, boundary notes, current-owner references, and historical handoff/context sections.
- Did not compress archive bodies or update current docs/product history because no current-doc or
  digest drift was found.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  or `qa-artifacts/`.

Metadata-quality result:

| Metric | Before D9 | After D9 | Delta |
| --- | ---: | ---: | ---: |
| Missing `Status` | `24` | `20` | `-4` |
| Missing `Type` | `46` | `39` | `-7` |
| Missing `Priority` | `46` | `39` | `-7` |
| Missing `Next Recommended Role` | `43` | `39` | `-4` |
| Missing `Task` | `46` | `39` | `-7` |
| Missing `Stage` | `46` | `39` | `-7` |
| Missing `Exact Handoff Prompt` | `46` | `39` | `-7` |
| Invalid `Status` | `28` | `25` | `-3` |
| Invalid `Type` | `0` | `0` | `0` |
| Invalid `Next Recommended Role` | `7` | `6` | `-1` |

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-09-phase-5-final-legacy-removal-plan.md` | `521` | `560` | `+39` |
| `docs/plans/archive/2026-05-10-design-system-slice-1-review.md` | `227` | `266` | `+39` |
| `docs/plans/archive/2026-05-10-hito-component-system-spec.md` | `123` | `123` | `0` |
| `docs/plans/archive/2026-05-10-hito-design-system-spec-and-rollout-plan.md` | `745` | `784` | `+39` |
| `docs/plans/archive/2026-05-11-full-design-system-normalization-plan.md` | `583` | `622` | `+39` |
| `docs/plans/archive/2026-05-11-next-garmin-phase-plan.md` | `375` | `414` | `+39` |
| `docs/plans/archive/2026-05-11-post-feedback-garmin-phase-plan.md` | `396` | `435` | `+39` |
| `docs/plans/archive/2026-05-12-feedback-loaded-state-design-pass.md` | `332` | `371` | `+39` |
| D9 touched-doc metadata pilot | `3302` | `3575` | `+273` |

The line-count increase is expected because D9 added canonical metadata to seven archived plans and
only corrected canonical values in the already-normalized Hito component-system archive.

Importer warnings:

- Admin importer dry-run remains `ok: true`, non-mutating, and `duplicateCount: 0`.
- The eight selected D9 files disappeared from the post-D9 warning examples.
- Remaining metadata-quality warnings are pre-existing and now appear in the next archive-plan
  examples.
- No D9-caused metadata-quality regression was observed.

Subagents:

- Admin metadata safety subagent confirmed each D9 file's missing/invalid lead metadata and stop
  conditions for preserving archived body evidence.
- Archive/history preservation subagent confirmed metadata-only normalization was safe and that
  Garmin truth-boundary sections, DS final outcomes, archive notes, and historical handoff/context
  blocks should remain untouched.
- Current-doc/product-history drift subagent found no current-doc drift and recommended no digest
  update for D9.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D10: sixth admin-imported metadata-quality normalization pilot.`

Recommended D10 targets should come from the post-D9 importer examples and stay metadata-only:

| Target | Boundary |
| --- | --- |
| `docs/plans/archive/2026-05-12-feedback-ux-restructure-plan.md` | metadata-only; preserve archived feedback UX history |
| `docs/plans/archive/2026-05-12-intelligence-feedback-logresult-restructure-plan.md` | metadata-only; preserve archived intelligence/log-result restructuring history |
| `docs/plans/archive/2026-05-12-post-ai-garmin-phase-plan.md` | metadata-only; preserve archived post-AI Garmin planning history |
| `docs/plans/archive/2026-05-12-post-cleanup-next-slice-plan.md` | metadata-only; preserve archived post-cleanup planning history |
| `docs/plans/archive/2026-05-12-post-logresult-invite-next-slice-plan.md` | metadata-only; preserve archived log-result/invite planning history |
| `docs/plans/archive/2026-05-12-post-payoff-next-slice-plan.md` | metadata-only; preserve archived payoff planning history |
| `docs/plans/archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md` | metadata-only; preserve archived text-first/start-date policy history |
| `docs/plans/archive/2026-05-13-app-wide-simplification-track-plan.md` | metadata-only; preserve archived app-wide simplification history |

## Slice D10 Closeout — 2026-06-20

Status: complete / sixth admin-imported metadata-quality normalization pilot accepted.

What changed:

- Added valid lead Admin importer metadata blocks to eight archived plans shown by the post-D9
  dry-run examples:
  - [Feedback UX Restructure Plan](../archive/2026-05-12-feedback-ux-restructure-plan.md)
  - [Intelligence Feedback Log Result Restructure Plan](../archive/2026-05-12-intelligence-feedback-logresult-restructure-plan.md)
  - [Post-AI Garmin Phase Plan](../archive/2026-05-12-post-ai-garmin-phase-plan.md)
  - [Post-Cleanup Next Slice Plan](../archive/2026-05-12-post-cleanup-next-slice-plan.md)
  - [Post-Log Result Invite Next Slice Plan](../archive/2026-05-12-post-logresult-invite-next-slice-plan.md)
  - [Post-Payoff Next Slice Plan](../archive/2026-05-12-post-payoff-next-slice-plan.md)
  - [Text-First Plan Creation And Start-Date Policy Plan](../archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md)
  - [App-Wide Simplification Track Plan](../archive/2026-05-13-app-wide-simplification-track-plan.md)
- Preserved archived body content, Archive Notes, current slice notes, implementation status
  updates, product truth constraints, non-negotiable truth rules, guardrails, exit criteria,
  historical handoff/context blocks, and current-owner references.
- Did not compress archive bodies or update current docs/product history because no current-doc or
  digest drift was found.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  or `qa-artifacts/`.

Metadata-quality result:

| Metric | Before D10 | After D10 | Delta |
| --- | ---: | ---: | ---: |
| Missing `Status` | `20` | `19` | `-1` |
| Missing `Type` | `39` | `31` | `-8` |
| Missing `Priority` | `39` | `31` | `-8` |
| Missing `Next Recommended Role` | `39` | `31` | `-8` |
| Missing `Task` | `39` | `31` | `-8` |
| Missing `Stage` | `39` | `31` | `-8` |
| Missing `Exact Handoff Prompt` | `39` | `31` | `-8` |
| Invalid `Status` | `25` | `19` | `-6` |
| Invalid `Type` | `0` | `0` | `0` |
| Invalid `Next Recommended Role` | `6` | `6` | `0` |

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-12-feedback-ux-restructure-plan.md` | `608` | `647` | `+39` |
| `docs/plans/archive/2026-05-12-intelligence-feedback-logresult-restructure-plan.md` | `606` | `645` | `+39` |
| `docs/plans/archive/2026-05-12-post-ai-garmin-phase-plan.md` | `416` | `455` | `+39` |
| `docs/plans/archive/2026-05-12-post-cleanup-next-slice-plan.md` | `315` | `354` | `+39` |
| `docs/plans/archive/2026-05-12-post-logresult-invite-next-slice-plan.md` | `313` | `352` | `+39` |
| `docs/plans/archive/2026-05-12-post-payoff-next-slice-plan.md` | `322` | `361` | `+39` |
| `docs/plans/archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md` | `499` | `538` | `+39` |
| `docs/plans/archive/2026-05-13-app-wide-simplification-track-plan.md` | `445` | `484` | `+39` |
| D10 touched-doc metadata pilot | `3524` | `3836` | `+312` |

The line-count increase is expected because D10 added canonical metadata to archived plans instead
of compressing historical bodies.

Importer warnings:

- Admin importer dry-run remains `ok: true`, non-mutating, and `duplicateCount: 0`.
- The eight selected D10 files disappeared from the post-D10 warning examples.
- Remaining metadata-quality warnings are pre-existing and now appear in the next archive-plan
  examples.
- No D10-caused metadata-quality regression was observed.

Subagents:

- Admin metadata safety subagent confirmed each D10 file's missing/invalid lead metadata and stop
  conditions for preserving archived body evidence.
- Archive/history preservation subagent confirmed metadata-only normalization was safe and that
  final-outcome/history sections, product truth constraints, guardrails, and historical handoff
  blocks should remain untouched.
- Current-doc/product-history drift subagent found no current-doc drift and recommended no digest
  update for D10.
- All three read-only subagents were closed after findings were integrated.

Next selected batch before D11 rebaseline:

`ARCHITECT Slice D11: seventh admin-imported metadata-quality normalization pilot.`

This recommendation was superseded by the D11 strategy correction below because it would have
continued line-positive metadata-only work while the active product priority is docs-size reduction.

## Slice D11 Rebaseline Closeout — 2026-06-20

Status: complete / docs compression strategy corrected.

Root-cause decision:

- Visible symptom: the docs/artifact compression track appeared to increase line count after D8-D10.
- Underlying cause: the track mixed two different work types: net-negative docs compression and
  Admin importer metadata-quality normalization.
- Canonical owner: docs/source-of-truth strategy in this active compression plan.

Lane separation:

| Lane | Purpose | Counting rule |
| --- | --- | --- |
| `docs-size-reduction` | Compress, summarize, demote, or delete safe historical docs so repository docs become smaller and easier to scan. | Must be net-negative for markdown lines and is the primary compression lane. |
| `admin-metadata-quality` | Preserve Admin importer/dashboard compatibility by fixing canonical lead metadata. | Valid hygiene, but may be line-positive and must not be counted as compression progress. |
| `artifact-log-retention` | Inventory, rotate, archive, or eventually prune local generated roots such as `logs/` and `test-results/`. | Dry-run/policy first. `qa-artifacts/` remains protected evidence until a QA retention policy exists. |

Policy correction:

- Do not continue metadata-only pilots unless Admin importer warnings block dashboard/importer
  usability.
- If a net-negative compression target needs small metadata normalization to preserve importer
  safety, it may be included inside that compression batch only when the batch remains materially
  net-negative overall.
- D8, D9, and D10 are accepted as metadata-quality improvements, not compression wins.

Fresh docs baseline:

| Root | Markdown lines after D10 | Notes |
| --- | ---: | --- |
| `docs/` | `75564` | Total markdown docs surface after D1-D10 and current untracked active plan state |
| `docs/plans/active` | `10425` | Includes this active compression plan and current active execution plans |
| `docs/plans/archive` | `28550` | Still the safest large net-negative compression target |
| `docs/tasks/backlog` | `8540` | Admin-imported backlog truth; compress only with metadata and current-truth proof |
| `docs/tasks/product-briefs` | `3542` | Product-contract references; several future/current contracts are unsafe for generic compression |
| `docs/tasks/frontend-specs` | `12306` | Contains both historical DS specs and current manual/lifecycle contracts |
| `docs/tasks/running-coach` | `6361` | Coaching doctrine; do not compress generically without Running Coach boundary |
| `docs/history/changelog.md` | `672` | Canonical shipped-history source |
| `docs/history/product-history-digest.md` | `250` | Compact history digest created by D1 |
| Root current docs set | `3241` | `current-*`, context, glossary, README, changelog, and digest inventory command total |

D-track ledger:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Archive/task/spec compression | D1-D4 | `-17508` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Metadata-only archive pilots | D8-D10 | `+897` | Valid metadata-quality work, but line-positive |
| Overall D-track net | D1-D10 | `-16274` | Still net-negative overall, but future work must return to size reduction |

Source-proof candidate findings:

- Archive-plan audit identified large archived plans from `622` to `784` lines whose current truth is
  represented in current docs, changelog, or the product-history digest. These are safer
  compression targets than current-contract specs.
- Task/spec audit identified several historical specs that are likely compressible, but also flagged
  current manual authoring, active-plan lifecycle, workout detail lifecycle, provider-ingestion, and
  running-coach doctrine specs as unsafe for generic compression.
- Docs/devtools audit recommended updating only this active plan and regenerating
  `docs/work-dashboard.md`; no artifact deletion or metadata-only continuation is selected.

Selected next batch:

`ARCHITECT Slice D12: archive-only net-negative compression batch.`

Selected D12 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-10-hito-design-system-spec-and-rollout-plan.md` | `784` | Preserve DS rollout decisions and current `/hitoDS` owner links |
| `docs/plans/archive/2026-05-07-training-plan-v2-integration-plan.md` | `777` | Preserve training-plan v2 outcome and current system/product owner links |
| `docs/plans/archive/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md` | `763` | Preserve metric-truth contract and no-fake-pace/personal-HR boundaries |
| `docs/plans/archive/2026-05-05-full-baseline-import-and-stabilization-plan.md` | `762` | Preserve baseline import/stabilization outcome and validation evidence |
| `docs/plans/archive/2026-05-15-longitudinal-ai-coach-context-plan.md` | `739` | Preserve AI-coach context boundaries and deterministic-truth-first rule |
| `docs/plans/archive/2026-05-17-modal-anatomy-header-footer-system.md` | `694` | Preserve modal anatomy decision and current DS/current-doc links |
| `docs/plans/archive/2026-05-12-feedback-ux-restructure-plan.md` | `647` | Preserve feedback/log-result restructuring history and final boundaries |
| `docs/plans/archive/2026-05-12-intelligence-feedback-logresult-restructure-plan.md` | `645` | Preserve intelligence/feedback restructuring history and validation evidence |

Expected D12 result:

- The selected files total `5811` lines before compression.
- D12 should materially reduce archive line count while preserving metadata, final outcomes, key
  decisions, validation evidence, and current-owner links.
- D12 remains archive-only. It must not touch current-contract specs, runtime code, logs, or
  `qa-artifacts/`.

Subagents:

- Archive compression subagent identified the safest large archive-only batch and preserve/stop
  conditions.
- Task/spec subagent identified possible later task/spec candidates and flagged current-contract
  files that should not be compressed now.
- Docs/devtools subagent confirmed the lane separation and metadata-only pause rule.
- All three read-only subagents were closed after findings were integrated.

## Slice D12 Closeout — 2026-06-20

Status: complete / archive-only net-negative compression accepted.

What changed:

- Compressed eight archived plans in place without moving files.
- Preserved canonical Admin importer metadata, archived status, final outcome, key decisions,
  validation/evidence references, boundary notes, current-owner links, and links to current docs or
  the product-history digest where useful.
- Removed repeated historical handoff blocks, stale execution logs, duplicated inventories,
  superseded phase reports, and long evidence blocks already summarized elsewhere.
- Did not touch runtime code, frontend UI, backend behavior, package scripts, Supabase, migrations,
  OpenAI behavior, logs, `qa-artifacts/`, `test-results/`, changelog semantics, current product
  truth docs, or current-contract task/spec bodies.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-10-hito-design-system-spec-and-rollout-plan.md` | `784` | `88` | `-696` |
| `docs/plans/archive/2026-05-07-training-plan-v2-integration-plan.md` | `777` | `88` | `-689` |
| `docs/plans/archive/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md` | `763` | `109` | `-654` |
| `docs/plans/archive/2026-05-05-full-baseline-import-and-stabilization-plan.md` | `762` | `87` | `-675` |
| `docs/plans/archive/2026-05-15-longitudinal-ai-coach-context-plan.md` | `739` | `85` | `-654` |
| `docs/plans/archive/2026-05-17-modal-anatomy-header-footer-system.md` | `694` | `84` | `-610` |
| `docs/plans/archive/2026-05-12-feedback-ux-restructure-plan.md` | `647` | `88` | `-559` |
| `docs/plans/archive/2026-05-12-intelligence-feedback-logresult-restructure-plan.md` | `645` | `89` | `-556` |
| D12 touched archive batch | `5811` | `718` | `-5093` |

Fresh docs baseline after D12:

| Root | Markdown lines after D12 | Delta from D11 baseline |
| --- | ---: | ---: |
| `docs/` | `70654` | `-4910` |
| `docs/plans/archive` | `23457` | `-5093` |
| `docs/plans/active` | `10603` | `+178` |
| `docs/tasks/frontend-specs` | `12308` | `+2` |
| `docs/tasks/backlog` | `8540` | `0` |
| `docs/tasks/product-briefs` | `3542` | `0` |
| `docs/tasks/running-coach` | `6361` | `0` |

D-track ledger after D12:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12 | `-22601` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Dashboard/digest/plan tracking overhead | D12 | `+93` | Source-of-truth overhead |
| Overall D-track net | D1-D12 | `-21274` | Net-negative overall |

Subagents:

- Archive compression safety subagent confirmed all D12 files were unsafe for blind compression but
  safe for compression with preserved contracts, outcomes, and evidence.
- Admin importer metadata subagent identified three legacy-format metadata risks; D12 normalized or
  preserved canonical lead metadata while keeping the batch materially net-negative.
- Current-doc/product-history drift subagent confirmed no D12 archive file remained the only source
  of current product truth.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D13: next archive-only net-negative compression batch.`

Selected D13 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-29-hito-optimization-strike-plan.md` | `626` | Preserve completed optimization outcome and cleanup-history boundary |
| `docs/plans/archive/2026-05-11-full-design-system-normalization-plan.md` | `622` | Preserve DS normalization outcome and current `/hitoDS` owner links |
| `docs/plans/archive/2026-05-06-supabase-program-storage-readiness-plan.md` | `616` | Preserve Supabase storage readiness decisions and current backend owner links |
| `docs/plans/archive/2026-05-18-structured-first-plan-onboarding.md` | `612` | Preserve structured onboarding outcome and current first-plan action boundaries |
| `docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md` | `611` | Preserve blueprint/envelope decision and production/default boundary |
| `docs/plans/archive/2026-05-07-plan-authoring-flow-redesign.md` | `605` | Preserve authoring-flow decisions and current plan-authoring owner links |
| `docs/plans/archive/2026-05-22-runner-profile-training-preferences-settings.md` | `590` | Preserve runner-profile/training-preference decisions and current settings owner links |
| `docs/plans/archive/2026-05-07-workout-page-and-detailed-json-contract-plan.md` | `589` | Preserve workout-page/import contract decisions and current workout-detail owner links |

Expected D13 result:

- The selected files total `4871` lines before compression.
- D13 should remain archive-only and materially net-negative.
- D13 must stop if any archive contains unique current truth not represented in current docs,
  changelog, product-history digest, or current source owners.

## Slice D13 Closeout — 2026-06-20

Status: complete / archive-only net-negative compression accepted.

What changed:

- Compressed eight archived plans in place without moving files.
- Preserved or added canonical Admin importer metadata, archived status, final outcomes, key
  decisions, validation/evidence references, boundary notes, current-owner links, and digest/current
  doc references.
- Added compact digest anchors for early Supabase provenance, runner defaults vs active-plan truth,
  and early no-unowned-custom-UI DS normalization.
- Removed repeated handoff prompts, stale execution logs, duplicated inventories, superseded slice
  reports, and long historical evidence blocks already summarized elsewhere.
- Did not touch runtime code, frontend UI, backend behavior, package scripts, Supabase, migrations,
  OpenAI behavior, logs, `qa-artifacts/`, `test-results/`, changelog semantics, current product
  truth docs, or current-contract task/spec bodies.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-29-hito-optimization-strike-plan.md` | `626` | `85` | `-541` |
| `docs/plans/archive/2026-05-11-full-design-system-normalization-plan.md` | `622` | `78` | `-544` |
| `docs/plans/archive/2026-05-06-supabase-program-storage-readiness-plan.md` | `616` | `76` | `-540` |
| `docs/plans/archive/2026-05-18-structured-first-plan-onboarding.md` | `612` | `85` | `-527` |
| `docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md` | `611` | `79` | `-532` |
| `docs/plans/archive/2026-05-07-plan-authoring-flow-redesign.md` | `605` | `75` | `-530` |
| `docs/plans/archive/2026-05-22-runner-profile-training-preferences-settings.md` | `590` | `83` | `-507` |
| `docs/plans/archive/2026-05-07-workout-page-and-detailed-json-contract-plan.md` | `589` | `69` | `-520` |
| D13 touched archive batch | `4871` | `630` | `-4241` |

Fresh docs baseline after D13:

| Root | Markdown lines after D13 | Delta from D12 baseline |
| --- | ---: | ---: |
| `docs/` | `66515` | `-4139` |
| `docs/plans/archive` | `19216` | `-4241` |
| `docs/plans/active` | `10693` | `+90` |
| `docs/tasks/frontend-specs` | `12308` | `0` |
| `docs/tasks/backlog` | `8540` | `0` |
| `docs/tasks/product-briefs` | `3542` | `0` |
| `docs/tasks/running-coach` | `6361` | `0` |
| `docs/history` | `934` | `+9` |

D-track ledger after D13:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12, D13 | `-26842` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Dashboard/digest/plan tracking overhead | D12-D13 | `+195` | Source-of-truth overhead |
| Overall D-track net | D1-D13 | `-25413` | Net-negative overall |

Subagents:

- Archive compression safety subagent confirmed all D13 files were compressible with preserved
  final outcomes, key decisions, validation evidence, and current-owner links.
- Admin importer metadata subagent found two legacy-format targets; D13 added canonical lead
  metadata while keeping the batch materially net-negative.
- Current-doc/product-history drift subagent found no current-doc blocker and requested three small
  digest anchors, which D13 added.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D14: next archive-only net-negative compression batch.`

Selected D14 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-06-supabase-training-data-structure-plan.md` | `589` | Preserve training-data storage decisions and current Supabase owner links |
| `docs/plans/archive/2026-05-18-basic-pro-entitlement-backend-foundation-slice.md` | `579` | Preserve entitlement backend foundation and current capability truth links |
| `docs/plans/archive/2026-05-25-active-plan-schedule-edit-plan.md` | `570` | Preserve schedule-edit lifecycle decisions and current active-plan owner links |
| `docs/plans/archive/2026-05-07-openai-text-to-plan-authoring-plan.md` | `561` | Preserve text-to-plan authoring boundaries and current AI owner links |
| `docs/plans/archive/2026-05-09-phase-5-final-legacy-removal-plan.md` | `560` | Preserve final legacy-removal outcome and no-revival boundaries |
| `docs/plans/archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md` | `538` | Preserve text-first/start-date policy history and current first-plan owner links |
| `docs/plans/archive/2026-05-15-modal-architecture-and-design-system-audit.md` | `512` | Preserve modal/DS architecture decisions and current DS owner links |
| `docs/plans/archive/2026-05-09-full-product-capability-and-qa-spec.md` | `493` | Preserve early capability/QA map as historical context only |

Expected D14 result:

- The selected files total `4402` lines before compression.
- D14 should remain archive-only and materially net-negative.
- D14 must stop if any archive contains unique current truth not represented in current docs,
  changelog, product-history digest, or current source owners.

## Slice D14 Closeout — 2026-06-20

Status: complete / archive-only net-negative compression batch accepted.

What changed:

- Compressed the D14 archive-only batch in place:
  - [Supabase Training Data Structure Plan](../archive/2026-05-06-supabase-training-data-structure-plan.md)
  - [Basic/Pro Entitlement Backend Foundation Slice](../archive/2026-05-18-basic-pro-entitlement-backend-foundation-slice.md)
  - [Active Plan Schedule Edit Plan](../archive/2026-05-25-active-plan-schedule-edit-plan.md)
  - [OpenAI Text-To-Plan Authoring Plan](../archive/2026-05-07-openai-text-to-plan-authoring-plan.md)
  - [Phase 5 Final Legacy Removal Plan](../archive/2026-05-09-phase-5-final-legacy-removal-plan.md)
  - [Text-First Plan Creation And Start-Date Policy Plan](../archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md)
  - [Modal Architecture And Design System Audit](../archive/2026-05-15-modal-architecture-and-design-system-audit.md)
  - [Full Product Capability And QA Spec](../archive/2026-05-09-full-product-capability-and-qa-spec.md)
- Preserved Admin importer metadata, archived status, final outcomes, key decisions, validation
  evidence, QA/evidence references, owner boundaries, and links to current docs or the digest.
- Added compact digest anchors for Supabase provenance boundaries, active-plan schedule edit,
  text/start-date authoring safety, modal architecture, and historical QA baseline status.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  current-contract specs, active implementation plans, or `qa-artifacts/`.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-06-supabase-training-data-structure-plan.md` | `589` | `77` | `-512` |
| `docs/plans/archive/2026-05-18-basic-pro-entitlement-backend-foundation-slice.md` | `579` | `81` | `-498` |
| `docs/plans/archive/2026-05-25-active-plan-schedule-edit-plan.md` | `570` | `100` | `-470` |
| `docs/plans/archive/2026-05-07-openai-text-to-plan-authoring-plan.md` | `561` | `68` | `-493` |
| `docs/plans/archive/2026-05-09-phase-5-final-legacy-removal-plan.md` | `560` | `83` | `-477` |
| `docs/plans/archive/2026-05-12-text-first-plan-creation-and-start-date-policy-plan.md` | `538` | `84` | `-454` |
| `docs/plans/archive/2026-05-15-modal-architecture-and-design-system-audit.md` | `512` | `82` | `-430` |
| `docs/plans/archive/2026-05-09-full-product-capability-and-qa-spec.md` | `493` | `83` | `-410` |
| D14 touched archive batch | `4402` | `658` | `-3744` |

Fresh docs baseline after D14:

| Root | Markdown lines after D14 | Delta from D13 baseline |
| --- | ---: | ---: |
| `docs/` | `62843` | `-3672` |
| `docs/plans/archive` | `15472` | `-3744` |
| `docs/plans/active` | `10755` | `+62` |
| `docs/tasks/frontend-specs` | `12308` | `0` |
| `docs/history` | `944` | `+10` |

D-track ledger after D14:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12-D14 | `-30586` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Dashboard/digest/plan tracking overhead | D12-D14 | source-of-truth overhead only | Track by final docs baseline |
| Overall D-track net | D1-D14 | about `-26361` | Net-negative overall |

Subagents:

- Archive compression safety subagent confirmed all D14 targets were compressible if final outcomes,
  decisions, validation evidence, and current-owner links were preserved.
- Admin importer metadata subagent confirmed required metadata fixes and normalization boundaries,
  including lowercase `architect` for schedule-edit next-role metadata.
- Current-doc/product-history drift subagent found no current-doc blocker and recommended compact
  digest anchors, which D14 added.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D15: continue archive-only net-negative compression.`

Selected D15 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-13-app-wide-simplification-track-plan.md` | `484` | Preserve early app-wide simplification decisions without reviving stale execution |
| `docs/plans/archive/2026-05-15-ai-assisted-plan-refresh-from-history.md` | `483` | Preserve AI-assisted refresh history and current backend review/apply boundaries |
| `docs/plans/archive/2026-05-18-basic-pro-entitlement-architecture-plan.md` | `481` | Preserve entitlement architecture history and current capability truth links |
| `docs/plans/archive/2026-05-18-first-plan-constructor-architecture-audit.md` | `469` | Preserve constructor architecture decisions without changing current onboarding truth |
| `docs/plans/archive/2026-05-12-post-ai-garmin-phase-plan.md` | `455` | Preserve Garmin/AI phase context as historical evidence |
| `docs/plans/archive/2026-05-11-post-feedback-garmin-phase-plan.md` | `435` | Preserve Garmin feedback phase context as historical evidence |
| `docs/plans/archive/2026-05-17-hito-ds-card-reduction.md` | `420` | Preserve DS card-reduction decisions and current DS owner links |
| `docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md` | `419` | Preserve accepted `/test-calendar` pause and Hito DS ownership boundaries |

## Slice D15 Closeout — 2026-06-20

Status: complete / archive-only net-negative compression batch accepted.

What changed:

- Compressed the D15 archive-only batch in place:
  - [App-Wide Simplification Track Plan](../archive/2026-05-13-app-wide-simplification-track-plan.md)
  - [AI-Assisted Plan Refresh From History](../archive/2026-05-15-ai-assisted-plan-refresh-from-history.md)
  - [Basic/Pro Entitlement Architecture Plan](../archive/2026-05-18-basic-pro-entitlement-architecture-plan.md)
  - [First Plan Constructor Architecture Audit](../archive/2026-05-18-first-plan-constructor-architecture-audit.md)
  - [Post-AI Garmin Phase Plan](../archive/2026-05-12-post-ai-garmin-phase-plan.md)
  - [Post-Feedback Garmin Phase Plan](../archive/2026-05-11-post-feedback-garmin-phase-plan.md)
  - [Hito DS Card Reduction](../archive/2026-05-17-hito-ds-card-reduction.md)
  - [Hito DS Day-State Specimen And Test Calendar Sandbox](../archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md)
- Preserved Admin importer metadata, archived status, final outcomes, key decisions, validation
  evidence, QA/evidence references, owner boundaries, and links to current docs or the digest.
- Normalized importer-safe lead metadata for older archive formats while keeping the batch strongly
  net-negative.
- Added compact digest anchors for AI-assisted active-plan refresh and Garmin deterministic-first
  feedback/marker boundaries.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  current-contract specs, active implementation plans, or `qa-artifacts/`.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-13-app-wide-simplification-track-plan.md` | `484` | `83` | `-401` |
| `docs/plans/archive/2026-05-15-ai-assisted-plan-refresh-from-history.md` | `483` | `82` | `-401` |
| `docs/plans/archive/2026-05-18-basic-pro-entitlement-architecture-plan.md` | `481` | `82` | `-399` |
| `docs/plans/archive/2026-05-18-first-plan-constructor-architecture-audit.md` | `469` | `81` | `-388` |
| `docs/plans/archive/2026-05-12-post-ai-garmin-phase-plan.md` | `455` | `78` | `-377` |
| `docs/plans/archive/2026-05-11-post-feedback-garmin-phase-plan.md` | `435` | `79` | `-356` |
| `docs/plans/archive/2026-05-17-hito-ds-card-reduction.md` | `420` | `80` | `-340` |
| `docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md` | `419` | `87` | `-332` |
| D15 touched archive batch | `3646` | `652` | `-2994` |

Fresh docs baseline after D15:

| Root | Markdown lines after D15 | Delta from D14 baseline |
| --- | ---: | ---: |
| `docs/` | `59938` | `-2905` |
| `docs/plans/archive` | `12478` | `-2994` |
| `docs/plans/active` | `10838` | `+83` |
| `docs/history` | `950` | `+6` |

D-track ledger after D15:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12-D15 | `-33580` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Overall D-track net | D1-D15 | about `-29266` | Net-negative overall |

Subagents:

- Archive compression safety subagent confirmed all D15 targets were compressible if still-current
  invariants were preserved, especially refresh safety, entitlement ownership, Garmin truth, and
  `/test-calendar` boundaries.
- Admin importer metadata subagent identified four high-risk old-format archives and one medium-risk
  `/test-calendar` status field; D15 normalized those while compressing.
- Current-doc/product-history drift subagent found no current-doc blocker and recommended a compact
  active-plan refresh digest anchor, which D15 added.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D16: continue archive-only net-negative compression.`

Selected D16 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-11-next-garmin-phase-plan.md` | `414` | Preserve Garmin phase sequencing and deterministic evidence boundaries |
| `docs/plans/archive/2026-05-22-plan-authoring-quality-refinement.md` | `411` | Preserve plan-authoring quality decisions without reopening current doctrine |
| `docs/plans/archive/2026-05-14-saved-mode-plan-management-modal.md` | `400` | Preserve saved-mode modal ownership and current plan-management links |
| `docs/plans/archive/2026-05-25-running-plan-coaching-richness-second-pass.md` | `397` | Preserve running-plan richness decisions and current running-plan owner links |
| `docs/plans/archive/2026-05-15-plan-export-from-open-plan.md` | `382` | Preserve export ownership and current export behavior boundaries |
| `docs/plans/archive/2026-05-16-explicit-plan-refresh-confirm-and-apply.md` | `379` | Preserve refresh confirm/apply safety and current lifecycle links |
| `docs/plans/archive/2026-05-12-feedback-loaded-state-design-pass.md` | `371` | Preserve feedback loaded-state design decisions as historical UI context |
| `docs/plans/archive/2026-05-12-post-payoff-next-slice-plan.md` | `361` | Preserve early post-payoff prioritization context without reviving stale execution |

## Slice D16 Closeout — 2026-06-20

Status: complete / archive-only net-negative compression batch accepted.

What changed:

- Compressed the D16 archive-only batch in place:
  - [Next Garmin Phase Plan](../archive/2026-05-11-next-garmin-phase-plan.md)
  - [Plan Authoring Quality Refinement](../archive/2026-05-22-plan-authoring-quality-refinement.md)
  - [Saved Mode Plan Management Modal](../archive/2026-05-14-saved-mode-plan-management-modal.md)
  - [Running Plan Coaching Richness Second Pass](../archive/2026-05-25-running-plan-coaching-richness-second-pass.md)
  - [Plan Export From Open Plan](../archive/2026-05-15-plan-export-from-open-plan.md)
  - [Explicit Plan Refresh Confirm And Apply](../archive/2026-05-16-explicit-plan-refresh-confirm-and-apply.md)
  - [Feedback Loaded-State Design Pass](../archive/2026-05-12-feedback-loaded-state-design-pass.md)
  - [Post-Payoff Next Slice Plan](../archive/2026-05-12-post-payoff-next-slice-plan.md)
- Preserved Admin importer metadata, archived status, final outcomes, key decisions, validation
  evidence, owner boundaries, QA/evidence references, and current-doc/product-history links.
- Synced stale current-doc references that still described D6 as the immediate docs/artifact gate.
- Added a compact product-history digest anchor for `Open plan` as the saved-mode lifecycle hub.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  current-contract specs, active implementation plans outside compression-track sync, or
  `qa-artifacts/`.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-11-next-garmin-phase-plan.md` | `414` | `81` | `-333` |
| `docs/plans/archive/2026-05-22-plan-authoring-quality-refinement.md` | `411` | `82` | `-329` |
| `docs/plans/archive/2026-05-14-saved-mode-plan-management-modal.md` | `400` | `81` | `-319` |
| `docs/plans/archive/2026-05-25-running-plan-coaching-richness-second-pass.md` | `397` | `88` | `-309` |
| `docs/plans/archive/2026-05-15-plan-export-from-open-plan.md` | `382` | `75` | `-307` |
| `docs/plans/archive/2026-05-16-explicit-plan-refresh-confirm-and-apply.md` | `379` | `83` | `-296` |
| `docs/plans/archive/2026-05-12-feedback-loaded-state-design-pass.md` | `371` | `80` | `-291` |
| `docs/plans/archive/2026-05-12-post-payoff-next-slice-plan.md` | `361` | `77` | `-284` |
| D16 touched archive batch | `3115` | `647` | `-2468` |

Fresh docs baseline after D16:

| Root | Markdown lines after D16 | Delta from D15 baseline |
| --- | ---: | ---: |
| `docs/` | `57551` | `-2387` |
| `docs/plans/archive` | `10010` | `-2468` |
| `docs/plans/active` | `10920` | `+82` closeout sync only |
| `docs/history` | `952` | `+2` compact digest sync only |

D-track ledger after D16:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12-D16 | `-36048` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Overall D-track net | D1-D16 | about `-31734` | Net-negative overall |

Subagents:

- Archive compression safety subagent confirmed all D16 targets were compressible if still-current
  boundaries were preserved, especially Garmin evidence ownership, plan-authoring quality doctrine,
  saved-mode lifecycle, export payload truth, and refresh proposal/apply safety.
- Admin importer metadata subagent identified five older-format archives that needed canonical
  lead metadata while compressing; D16 preserved importer-safe metadata for every touched archive.
- Current-doc/product-history drift subagent found stale D6 immediate-gate wording in current docs
  and recommended the saved-mode `Open plan` digest anchor.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D17: continue archive-only net-negative compression.`

Selected D17 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-12-post-cleanup-next-slice-plan.md` | `354` | Preserve early cleanup prioritization context without reviving stale execution |
| `docs/plans/archive/2026-05-12-post-logresult-invite-next-slice-plan.md` | `352` | Preserve early `Log result` / invite context as historical prioritization only |
| `docs/plans/archive/2026-05-26-plan-creation-visual-variety-regression-qa.md` | `349` | Preserve QA evidence for plan-creation visual variety boundaries |
| `docs/plans/archive/2026-05-14-user-chosen-plan-start-date.md` | `334` | Preserve start-date ownership and current selected-plan/manual boundaries |
| `docs/plans/archive/2026-05-17-async-action-toast-pattern.md` | `306` | Preserve async-action/toast pattern decisions and current UI owner links |
| `docs/plans/archive/2026-05-16-weekday-rest-day-invariants.md` | `304` | Preserve rest-day invariant decisions without changing current plan-generation truth |
| `docs/plans/archive/2026-05-15-workout-body-note-modal-and-ai-context.md` | `301` | Preserve workout body/note modal and AI-context boundaries |
| `docs/plans/archive/2026-05-13-hierarchy-cleanup-after-copy-pass.md` | `262` | Preserve early hierarchy/copy cleanup decisions as historical UI context |

## Slice D17 Closeout — 2026-06-21

Status: complete / archive-only net-negative compression batch accepted.

What changed:

- Compressed the D17 archive-only batch in place:
  - [Post-Cleanup Next Slice Plan](../archive/2026-05-12-post-cleanup-next-slice-plan.md)
  - [Post-Log Result Invite Next Slice Plan](../archive/2026-05-12-post-logresult-invite-next-slice-plan.md)
  - [Plan Creation Visual Variety Regression QA](../archive/2026-05-26-plan-creation-visual-variety-regression-qa.md)
  - [User-Chosen Plan Start Date](../archive/2026-05-14-user-chosen-plan-start-date.md)
  - [Async Action Toast Pattern](../archive/2026-05-17-async-action-toast-pattern.md)
  - [Weekday Rest-Day Invariants](../archive/2026-05-16-weekday-rest-day-invariants.md)
  - [Workout Body Note Modal And AI Context](../archive/2026-05-15-workout-body-note-modal-and-ai-context.md)
  - [Hierarchy Cleanup After Copy Pass](../archive/2026-05-13-hierarchy-cleanup-after-copy-pass.md)
- Preserved or normalized Admin importer metadata for every D17 archive.
- Preserved archived status, final outcomes, key decisions, validation evidence, QA/report/screenshot
  references, current-owner links, and product-history boundaries.
- Did not update the product-history digest because current docs and digest already cover the D17
  history anchors at the right level.
- Did not touch runtime/source files, package scripts, changelog semantics, logs, `test-results/`,
  current-contract specs, active implementation plans outside compression-track sync, or
  `qa-artifacts/`.

Line-count result:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/plans/archive/2026-05-12-post-cleanup-next-slice-plan.md` | `354` | `82` | `-272` |
| `docs/plans/archive/2026-05-12-post-logresult-invite-next-slice-plan.md` | `352` | `82` | `-270` |
| `docs/plans/archive/2026-05-26-plan-creation-visual-variety-regression-qa.md` | `349` | `84` | `-265` |
| `docs/plans/archive/2026-05-14-user-chosen-plan-start-date.md` | `334` | `83` | `-251` |
| `docs/plans/archive/2026-05-17-async-action-toast-pattern.md` | `306` | `85` | `-221` |
| `docs/plans/archive/2026-05-16-weekday-rest-day-invariants.md` | `304` | `92` | `-212` |
| `docs/plans/archive/2026-05-15-workout-body-note-modal-and-ai-context.md` | `301` | `87` | `-214` |
| `docs/plans/archive/2026-05-13-hierarchy-cleanup-after-copy-pass.md` | `262` | `82` | `-180` |
| D17 touched archive batch | `2562` | `677` | `-1885` |

Fresh docs baseline after D17:

| Root | Markdown lines after D17 | Delta from D16 baseline |
| --- | ---: | ---: |
| `docs/` | `55749` | `-1802` |
| `docs/plans/archive` | `8125` | `-1885` |
| `docs/plans/active` | `11003` | `+83` active plan sync only |
| `docs/history` | `952` | no digest sync needed |

D-track ledger after D17:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12-D17 | `-37933` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Overall D-track net | D1-D17 | about `-33619` | Net-negative overall |

Subagents:

- Archive compression safety subagent found no hard stop and identified per-file boundaries to
  preserve, especially `Log result` / `Feedback` ownership, QA evidence links, chosen-start apply
  authority, rest-day invariants, toast policy, body-note caution context, and hierarchy decisions.
- Admin importer metadata subagent identified six missing or invalid lead metadata blocks plus two
  prompt-boundary risks; D17 normalized all eight archive headers.
- Current-doc/product-history drift subagent confirmed current docs, dashboard, and digest already
  covered D17 history and pointed to D17 rather than stale D16/D6.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D18: continue archive-only net-negative compression.`

Selected D18 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-10-design-system-slice-1-review.md` | `266` | Preserve early DS review decisions without reviving stale rollout instructions |
| `docs/plans/archive/2026-05-15-calendar-cell-semantics-correction.md` | `261` | Preserve calendar-cell semantic correction history and current calendar owner links |
| `docs/plans/archive/2026-05-14-next-product-track-refresh.md` | `224` | Preserve early product-track prioritization as history only |
| `docs/plans/archive/2026-05-15-next-product-track-refresh-2.md` | `211` | Preserve early product-track refresh history without reactivating stale next steps |
| `docs/plans/archive/2026-05-13-next-product-track-prioritization.md` | `207` | Preserve early prioritization decisions as historical context |
| `docs/plans/archive/2026-05-17-next-product-step-after-update-plan-apply.md` | `192` | Preserve refresh/apply next-step context as archived history |
| `docs/plans/archive/2026-05-16-next-product-step-after-proposal-only-refresh.md` | `191` | Preserve proposal-only refresh next-step context as archived history |
| `docs/plans/archive/2026-05-15-workout-body-notes-and-user-settings-plan.md` | `184` | Preserve body-note/settings history and current owner links |

## Slice D18 Closeout — 2026-06-21

Status: complete / archive-only net-negative compression batch accepted.

What changed:

- Compressed the D18 archive-only batch in place:
  - `docs/plans/archive/2026-05-10-design-system-slice-1-review.md`
  - `docs/plans/archive/2026-05-15-calendar-cell-semantics-correction.md`
  - `docs/plans/archive/2026-05-14-next-product-track-refresh.md`
  - `docs/plans/archive/2026-05-15-next-product-track-refresh-2.md`
  - `docs/plans/archive/2026-05-13-next-product-track-prioritization.md`
  - `docs/plans/archive/2026-05-17-next-product-step-after-update-plan-apply.md`
  - `docs/plans/archive/2026-05-16-next-product-step-after-proposal-only-refresh.md`
  - `docs/plans/archive/2026-05-15-workout-body-notes-and-user-settings-plan.md`
- Preserved Admin importer metadata, archived status, final outcomes, key decisions, validation
  evidence, owner boundaries, and current-owner links in each archive.
- Removed stale handoff prompts, repeated execution logs, superseded slice details, and bulky
  historical evidence blocks already represented in current docs, changelog, or product-history
  digest.
- Synced current docs so the immediate docs/artifact gate now points to D19, not stale D17/D16
  wording.
- Did not update the product-history digest because D18 subagent preflight found no missing
  historical anchor.

Line-count delta:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `2026-05-10-design-system-slice-1-review.md` | `266` | `79` | `-187` |
| `2026-05-15-calendar-cell-semantics-correction.md` | `261` | `84` | `-177` |
| `2026-05-14-next-product-track-refresh.md` | `224` | `79` | `-145` |
| `2026-05-15-next-product-track-refresh-2.md` | `211` | `69` | `-142` |
| `2026-05-13-next-product-track-prioritization.md` | `207` | `69` | `-138` |
| `2026-05-17-next-product-step-after-update-plan-apply.md` | `192` | `78` | `-114` |
| `2026-05-16-next-product-step-after-proposal-only-refresh.md` | `191` | `72` | `-119` |
| `2026-05-15-workout-body-notes-and-user-settings-plan.md` | `184` | `81` | `-103` |
| D18 touched archive batch | `1736` | `611` | `-1125` |

Fresh docs baseline after D18:

| Root | Markdown lines after D18 | Delta from D17 baseline |
| --- | ---: | ---: |
| `docs/` | `54717` | `-1032` after plan/dashboard sync |
| `docs/plans/archive` | `7000` | `-1125` |
| `docs/plans/active` | `11096` | `+93` active plan sync only |
| `docs/history` | `952` | no digest sync needed |

D-track ledger after D18:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12-D18 | `-39058` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Overall D-track net | D1-D18 | about `-34651` | Net-negative overall |

Subagents:

- Archive compression safety subagent found no hard stop and identified per-file preservation
  boundaries for DS review, calendar-cell semantics, product-track refresh decisions, refresh/apply
  lifecycle history, and body-note/settings ownership.
- Admin importer metadata subagent confirmed the canonical lead metadata expectations and identified
  the seven D18 archives that needed importer-safe archived metadata normalization while preserving
  body meaning.
- Current-doc/product-history drift subagent found no digest gap, but did find stale D17/D16
  current-doc gate wording; D18 synced those current docs.
- All three read-only subagents were closed after findings were integrated.

Validation:

- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run validate-admin-capture-backlog`
- `npm run work:dashboard:no-admin`
- Scoped `git diff --check` for touched tracked markdown files.
- Extra whitespace check for touched untracked markdown files.

Next selected batch:

`ARCHITECT Slice D19: continue archive-only net-negative compression.`

Selected D19 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md` | `308` | Preserve final AI first-plan pipeline truth and current authoring owner links |
| `docs/plans/archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md` | `240` | Preserve Plan Preset card-discovery history and custom authoring boundary |
| `docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md` | `228` | Preserve final 40/40 cleanup ledger and completed-track history |
| `docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md` | `168` | Preserve pre-start calendar rendering decisions without reviving UI work |
| `docs/plans/archive/2026-05-25-rich-ai-draft-plan-authoring-pipeline.md` | `142` | Preserve rich draft proof history and current AI authoring boundary |
| `docs/plans/archive/2026-05-17-admin-analytics-page-plan.md` | `133` | Preserve shipped admin analytics scope and non-current placeholder decisions |
| `docs/plans/archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md` | `129` | Preserve plan-authoring decomposition outcomes and validator boundaries |
| `docs/plans/archive/2026-05-19-architecture-cleanup-plan.md` | `129` | Preserve architecture cleanup history without reactivating stale gates |

## Slice D19 Closeout — 2026-06-22

Status: complete / archive-only net-negative compression tail batch accepted.

What changed:

- Compressed the D19 archive-only batch in place:
  - `docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md`
  - `docs/plans/archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md`
  - `docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md`
  - `docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md`
  - `docs/plans/archive/2026-05-25-rich-ai-draft-plan-authoring-pipeline.md`
  - `docs/plans/archive/2026-05-17-admin-analytics-page-plan.md`
  - `docs/plans/archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md`
  - `docs/plans/archive/2026-05-19-architecture-cleanup-plan.md`
- Preserved Admin importer metadata, archived status, final outcomes, key decisions, validation
  evidence, owner boundaries, and current-owner links in each archive.
- Normalized D19 archive metadata values that still produced pre-existing Admin importer warnings.
- Removed remaining stale prompt/detail blocks from the D19 archive tail without changing current
  product truth, changelog semantics, runtime code, logs, or QA artifacts.
- Did not update the product-history digest because D19 subagent preflight found no missing
  historical anchor.

Line-count delta:

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `2026-05-26-ai-authored-first-plan-pipeline.md` | `308` | `84` | `-224` |
| `2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md` | `240` | `83` | `-157` |
| `2026-06-07-hito-stack-simplification-strike.md` | `228` | `90` | `-138` |
| `2026-06-01-first-plan-calendar-pre-start-rendering-polish.md` | `168` | `81` | `-87` |
| `2026-05-25-rich-ai-draft-plan-authoring-pipeline.md` | `142` | `80` | `-62` |
| `2026-05-17-admin-analytics-page-plan.md` | `133` | `79` | `-54` |
| `2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md` | `129` | `79` | `-50` |
| `2026-05-19-architecture-cleanup-plan.md` | `129` | `75` | `-54` |
| D19 touched archive batch | `1477` | `651` | `-826` |

Fresh docs baseline after D19:

| Root | Markdown lines after D19 | Delta from D18 baseline |
| --- | ---: | ---: |
| `docs/` | `53981` | `-736` after plan/dashboard sync |
| `docs/plans/archive` | `6174` | `-826` |
| `docs/plans/active` | `11186` | `+90` active plan sync only |
| `docs/history` | `952` | no digest sync needed |

D-track ledger after D19:

| Work type | Slices | Net line delta | Classification |
| --- | --- | ---: | --- |
| Compression batches | D1-D4, D12-D19 | `-39884` | Compression wins |
| Metadata-only normalization | D5-D10 | `+1234` | Importer hygiene, not compression |
| Overall D-track net | D1-D19 | about `-35387` | Net-negative overall |

Subagents:

- Archive compression safety subagent confirmed D19 was safe as a smaller archive-tail cleanup, with
  the pre-start calendar polish file as the strongest remaining target and the other files already
  mostly compact.
- Admin importer metadata subagent confirmed all eight targets had required lead sections and named
  the archive-safe metadata normalizations needed for seven targets.
- Current-doc/product-history drift subagent found no current-truth blocker and no digest update
  requirement; current docs and dashboard were already aligned to D19 before execution.
- All three read-only subagents were closed after findings were integrated.

Validation:

- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run validate-admin-capture-backlog`
- `npm run work:dashboard:no-admin`
- Scoped `git diff --check` for touched tracked markdown files.
- Extra whitespace check for touched untracked markdown files.

Next selected batch:

`ARCHITECT Slice D20: continue archive-only net-negative compression.`

Selected D20 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/plans/archive/2026-05-17-typography-system-audit-and-canonicalization.md` | `128` | Preserve typography canonicalization decisions and current DS owner links |
| `docs/plans/archive/2026-05-06-workout-screenshot-openai-verdict-plan.md` | `127` | Preserve evidence/AI verdict boundaries without reviving old screenshot workflow |
| `docs/plans/archive/2026-05-08-architecture-legacy-and-refactor-plan.md` | `125` | Preserve legacy/refactor lessons without reactivating stale cleanup gates |
| `docs/plans/archive/2026-05-07-training-plan-template-contract-spec.md` | `124` | Preserve template contract decisions and import boundaries |
| `docs/plans/archive/2026-05-10-hito-component-system-spec.md` | `123` | Preserve early component-system decisions and current Hito DS ownership links |
| `docs/plans/archive/2026-05-11-garmin-fit-upload-comparison-and-recommendation-plan.md` | `121` | Preserve Garmin comparison decision history without reviving provider work |
| `docs/plans/archive/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md` | `109` | Preserve watch-executable metric truth and no-fake-metrics boundaries |
| `docs/plans/archive/2026-05-25-active-plan-schedule-edit-plan.md` | `100` | Preserve schedule edit lifecycle boundaries and validation evidence |

## Slice D20 Preflight Stop — 2026-06-22

Status: stopped before file edits / archive tail already compressed enough.

Decision:

- D20 did not compress the selected archive targets.
- The selected D20 files totaled only `957` lines, with individual files between `100` and `128`
  lines.
- Read-only subagent preflight found the target set was already compact, with seven files explicitly
  carrying prior D2/D3/D12 compression history.
- The user-defined stop condition applied: do not continue if targets are already compressed enough
  or if the work would become metadata-only cleanup rather than net-negative compression.
- Admin importer preflight found only one D20 metadata warning (`typography-system-audit`) and one
  optional archive-consistency normalization (`active-plan-schedule-edit`). Those fixes alone would
  be metadata-only and are not enough to justify D20 as a compression batch.
- Current-doc/product-history drift preflight found no current-truth blocker and no digest update
  requirement.

D20 target line counts:

| Target | Lines | Preflight decision |
| --- | ---: | --- |
| `2026-05-17-typography-system-audit-and-canonicalization.md` | `128` | Already compressed enough; metadata warning can wait for a future metadata batch |
| `2026-05-06-workout-screenshot-openai-verdict-plan.md` | `127` | Already compressed enough |
| `2026-05-08-architecture-legacy-and-refactor-plan.md` | `125` | Already compressed enough |
| `2026-05-07-training-plan-template-contract-spec.md` | `124` | Already compressed enough |
| `2026-05-10-hito-component-system-spec.md` | `123` | Already compressed enough |
| `2026-05-11-garmin-fit-upload-comparison-and-recommendation-plan.md` | `121` | Already compressed enough |
| `2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md` | `109` | Already compressed enough |
| `2026-05-25-active-plan-schedule-edit-plan.md` | `100` | Already compressed enough |
| D20 selected archive tail | `957` | Stop / no net-negative execution |

Subagents:

- Archive compression safety subagent recommended not executing D20 against the selected archive
  tail because the files were already compact summaries.
- Admin importer metadata subagent found the selected targets had required sections and only one
  relevant warning example, which is metadata hygiene rather than compression.
- Current-doc/product-history drift subagent confirmed current docs, dashboard, and digest already
  covered the selected target history and pointed to D20 before preflight.
- All three read-only subagents were closed after findings were integrated.

## Slice D21 Closeout — 2026-06-22

Status: complete.

D21 compressed the first post-archive admin-imported frontend spec pilot in place. The batch stayed
net-negative and preserved Admin importer metadata, current/future boundaries, accepted outcomes,
validation evidence, current-owner links, and the product-history/current-doc handoff boundary.

Line-count delta:

| Target | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/frontend-specs/2026-05-06-hito-ds-spec.md` | `851` | `87` | `-764` |
| `docs/tasks/frontend-specs/2026-05-05-hito-running-first-flow-spec.md` | `631` | `85` | `-546` |
| `docs/tasks/frontend-specs/2026-05-20-changelog-ds-extraction-spec.md` | `616` | `86` | `-530` |
| `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-ds-reuse-correction-spec.md` | `598` | `85` | `-513` |
| `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-design.md` | `544` | `83` | `-461` |
| `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-revision.md` | `440` | `83` | `-357` |
| `docs/tasks/frontend-specs/2026-05-07-calendar-page-refinement-spec.md` | `438` | `85` | `-353` |
| `docs/tasks/frontend-specs/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md` | `424` | `99` | `-325` |
| D21 selected frontend specs | `4542` | `693` | `-3849` |

Admin importer impact:

- Preflight dry-run had `duplicateCount: 0`.
- Pre-existing metadata-quality warnings were unrelated to the D21 target files.
- D21 preserved required lead metadata sections and did not intentionally change Admin importer
  semantics.

Subagents:

- Admin importer metadata safety subagent checked D21 metadata sections and found no D21-specific
  missing/invalid metadata blocker.
- Frontend spec current-contract safety subagent classified the targets as safe or guarded-safe for
  compression as long as current contracts, accepted outcomes, and owner boundaries were preserved.
- Current-doc/product-history drift subagent found no D21-only current truth requiring digest or
  current-doc expansion.
- All read-only subagents were closed after findings were integrated.

Post-D21 measured docs baseline before dashboard regeneration:

| Root | Markdown lines |
| --- | ---: |
| `docs/` | `50194` |
| `docs/plans/archive` | `6174` |
| `docs/tasks/frontend-specs` | `8459` |

Next selected batch:

`ARCHITECT Slice D22: second admin-imported frontend spec net-negative compression pilot.`

Selected D22 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/tasks/frontend-specs/2026-05-25-hito-internal-workbench-responsive-contract-spec.md` | `705` | Preserve internal workbench responsive contract intent and current admin/Hito DS owner links |
| `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md` | `597` | Preserve accepted shared calendar/workout primitive boundaries and QA-passed outcome |
| `docs/tasks/frontend-specs/2026-05-30-hito-ds-date-picker-correction.md` | `486` | Preserve completed date picker correction evidence and current source references |
| `docs/tasks/frontend-specs/2026-05-06-ui-improvements-spec.md` | `467` | Preserve early UI refinement intent without treating old detail as current implementation truth |

## Slice D22 Closeout — 2026-06-22

Status: complete.

D22 compressed the second admin-imported frontend spec pilot in place. The batch stayed net-negative
and preserved Admin importer metadata, accepted outcomes, validation/QA references, guarded
current-contract boundaries, current-owner links, and one compact product-history digest anchor.

Line-count delta:

| Target | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/frontend-specs/2026-05-25-hito-internal-workbench-responsive-contract-spec.md` | `705` | `96` | `-609` |
| `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md` | `597` | `110` | `-487` |
| `docs/tasks/frontend-specs/2026-05-30-hito-ds-date-picker-correction.md` | `486` | `102` | `-384` |
| `docs/tasks/frontend-specs/2026-05-06-ui-improvements-spec.md` | `467` | `99` | `-368` |
| D22 selected frontend specs | `2255` | `407` | `-1848` |

Admin importer impact:

- Preflight dry-run had `duplicateCount: 0`.
- Pre-existing metadata-quality warnings were unrelated to the D22 target files.
- D22 preserved required lead metadata sections and did not introduce a D22 metadata regression.
- The internal workbench spec metadata was normalized from old backlog/FRONTEND implementation
  wording to completed ARCHITECT reference wording because current docs and changelog already record
  the workbench responsive shell as implemented.

Subagents:

- Admin importer metadata safety subagent confirmed all four D22 targets had parseable required
  metadata sections and closed prompt fences.
- Frontend spec current-contract safety subagent classified the workbench and calendar specs as
  guarded-current, the date picker as historical but high-caution, and the UI improvements spec as
  superseded.
- Current-doc/product-history drift subagent found no full compression blocker and recommended one
  compact digest anchor for the DS/workbench/date-picker history.
- All three read-only subagents were closed after findings were integrated.

Post-D22 measured docs baseline before dashboard regeneration:

| Root | Markdown lines |
| --- | ---: |
| `docs/` | `49305` |
| `docs/plans/archive` | `6174` |
| `docs/tasks/frontend-specs` | `7520` |
| `docs/history` | `957` |

Next selected batch:

`ARCHITECT Slice D23: completed and closed frontend spec tail net-negative compression pilot.`

Selected D23 targets:

| Target | Current lines | Boundary |
| --- | ---: | --- |
| `docs/tasks/frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md` | `548` | Preserve completed `/hitoDS/export/figma` bridge boundary and QA-passed status |
| `docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md` | `451` | Preserve closed subordinate dropdown/calendar DS history under canonical Hito DS IA ownership |
| `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-copy.md` | `312` | Compress only if source proof confirms copy guidance no longer owns an active copy pass; otherwise stop on this target |

## Slice D23 Closeout — 2026-06-22

Status: complete.

D23 compressed the completed/closed frontend spec tail in place. It stayed net-negative, preserved
Admin importer metadata, retained DS/Figma/dropdown/calendar accepted outcomes, and normalized the
stale admin Backlog copy spec only after source proof showed `/admin/capture` Backlog v1 is already
QA-passed and future overlay work is DESIGNER-owned.

Line-count delta:

| Target | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md` | `548` | `98` | `-450` |
| `docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md` | `451` | `100` | `-351` |
| `docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-copy.md` | `312` | `103` | `-209` |
| D23 selected frontend specs | `1311` | `301` | `-1010` |

Admin importer impact:

- Preflight dry-run had `duplicateCount: 0`.
- D23 preserved required lead metadata sections for the two closed DS specs.
- The admin Backlog copy spec metadata changed from stale `backlog` / `COPY pass` wording to closed
  historical PRODUCT guard wording after source proof showed it no longer owns active COPY execution.
- Remaining Admin metadata-quality warnings are pre-existing and unrelated to the D23 target files.

Product-history digest sync:

- Added compact anchors for dropdown/list-item family absorption into canonical `/hitoDS` IA and
  admin Backlog manual-handoff copy boundaries.

Subagents:

- Admin importer metadata safety subagent confirmed D23 target lead sections were present and warned
  not to treat stale admin copy metadata as completed without source proof.
- Frontend spec current-contract safety subagent classified the DS/Figma and dropdown/calendar
  specs as historical/compressible, and classified admin copy as compressible only after stale
  metadata/source-proof normalization.
- Current-doc/product-history drift subagent recommended preserving the Figma bridge, dropdown/menu
  family, calendar ownership, and admin Backlog manual-handoff copy anchors.
- All three read-only subagents were closed after findings were integrated.

Post-D23 measured docs baseline before dashboard regeneration:

| Root | Markdown lines |
| --- | ---: |
| `docs/` | `48365` |
| `docs/plans/archive` | `6174` |
| `docs/plans/active` | `11346` |
| `docs/tasks/frontend-specs` | `6510` |
| `docs/tasks/backlog` | `8540` |
| `docs/tasks/product-briefs` | `3542` |
| `docs/tasks/running-coach` | `6361` |
| `docs/history` | `964` |

Next selected batch:

`ARCHITECT Slice D24: admin-imported task/brief/coach docs net-negative compression pilot.`

Candidate roots:

| Root | Current lines | Boundary |
| --- | ---: | --- |
| `docs/tasks/backlog` | `8540` | Compress only future-only, completed, superseded, or duplicated backlog docs; preserve active product truth |
| `docs/tasks/product-briefs` | `3542` | Compress only historical briefs already represented in current docs/digest |
| `docs/tasks/running-coach` | `6361` | Preserve safety/coaching doctrine; compress only repeated audit logs or superseded matrices |

## Slice D24 Closeout — 2026-06-22

Status: complete.

D24 compressed a guarded admin-imported task/brief pilot across clean tracked backlog and product
brief docs. The batch stayed on the docs-size-reduction lane, preserved Admin importer metadata,
kept future provider/physiology/export/theme/entitlement boundaries, and deliberately skipped
running-coach docs because the current coach docs still contain active doctrine/safety truth and are
not currently part of the Admin importer scan.

Selected files:

| Target | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/backlog/2026-05-21-polar-auto-sync-integration-plan.md` | `789` | `127` | `-662` |
| `docs/tasks/backlog/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md` | `675` | `116` | `-559` |
| `docs/tasks/backlog/2026-06-08-light-dark-mode-and-color-palette-expansion.md` | `405` | `94` | `-311` |
| `docs/tasks/backlog/2026-05-15-plan-export-pdf.md` | `318` | `89` | `-229` |
| `docs/tasks/product-briefs/2026-05-25-admin-ui-capture-and-backlog-brief.md` | `363` | `95` | `-268` |
| `docs/tasks/product-briefs/2026-05-18-basic-vs-pro-capability-gating-brief.md` | `320` | `95` | `-225` |
| D24 selected docs | `2870` | `616` | `-2254` |

Admin importer impact:

- Preflight dry-run had `duplicateCount: 0`.
- D24 preserved required lead metadata sections for every selected target.
- Remaining metadata-quality warnings are pre-existing archive-plan warnings and are unrelated to
  the D24 target files.

Product-history digest sync:

- Added a compact provider/physiology boundary anchor so future agents can preserve Polar,
  HR-zone/AeT, PDF export, light/dark, and Basic/Pro future-state decisions without rereading the
  long backlog docs.

Subagent preflight:

- Admin importer metadata safety subagent recommended a smaller clean-backlog subset and warned
  that running-coach docs are not currently Admin-imported targets.
- Current-contract safety subagent recommended avoiding active lifecycle/manual/running-coach docs
  and treating product briefs as guarded only when represented in current docs.
- Current-doc/product-history drift subagent recommended preserving provider/Polar and HR/AeT
  boundaries through a compact digest anchor.
- All three read-only subagents were closed after findings were integrated.

Post-D24 measured docs baseline before dashboard regeneration:

| Root | Markdown lines |
| --- | ---: |
| `docs/` | `46177` |
| `docs/tasks/backlog` | `6779` |
| `docs/tasks/product-briefs` | `3049` |
| `docs/tasks/running-coach` | `6361` |

Next selected batch:

`ARCHITECT Slice D25: running-coach doctrine digest and safe compression strategy.`

Boundary:

- Do not compress `docs/tasks/running-coach` by line count alone.
- First identify whether current coaching doctrine has one compact canonical digest/source and which
  files are historical audit logs versus active safety doctrine.
- If no running-coach docs are safely net-negative, select the next backlog/product-brief batch
  instead of weakening training-quality truth.

## Slice D25 Closeout — 2026-06-22

Status: complete.

D25 was a docs-only source-of-truth audit and digest-creation slice, not a compression win. It
confirmed that `docs/tasks/running-coach` mixes active coaching doctrine, historical acceptance
evidence, DS/manual-builder adjacent source docs, and superseded audit reports. Broad compression is
unsafe until active doctrine is represented in a compact owner map.

Doctrine ownership decision:

- Created `docs/tasks/running-coach/running-coach-doctrine-digest.md` as the compact orientation
  layer for active running-plan coaching doctrine.
- Current implemented truth remains in `docs/current-product.md`, `docs/current-system.md`, and
  source.
- The active running-plan rebuild plan remains the execution-history owner.
- Dated running-coach artifacts remain detailed historical/source evidence until compressed by a
  bounded follow-up.

Inventory:

| Root | Files | Markdown lines before digest | Classification |
| --- | ---: | ---: | --- |
| `docs/tasks/running-coach` | `19` | `6361` | mixed active doctrine, historical audit evidence, DS/manual-builder adjacent source docs, and superseded reports |

Largest files and classification:

| Lines | File | Classification |
| ---: | --- | --- |
| `714` | `2026-06-11-marathon-completion-selected-plan-family-contract.md` | active Marathon Completion doctrine; unsafe for D26 |
| `553` | `2026-06-09-running-plan-rich-composition-matrix.md` | gold-standard composition doctrine; unsafe before later digest-backed compression |
| `538` | `2026-06-12-running-plan-universal-richness-bar-audit.md` | active richness bar doctrine / stop condition |
| `449` | `2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md` | manual-builder adjacent doctrine; unsafe in running-plan compression batch |
| `441` | `2026-06-10-running-plan-universal-no-dead-end-doctrine.md` | accepted no-dead-end doctrine; unsafe |
| `428` | `2026-06-09-running-plan-engine-r6-half-marathon-marathon-base-doctrine.md` | active doctrine with some superseded eligibility wording; digest-backed later only |
| `395` | `2026-06-09-running-plan-engine-pattern-library-and-composition-grammar.md` | active composition contract; unsafe |
| `367` | `2026-06-09-running-plan-dynamic-scenario-matrix-coach-audit.md` | historical audit; D26 candidate |
| `332` | `2026-06-10-beginner-half-marathon-bridge-plan-contract.md` | active bridge doctrine; unsafe |
| `309` | `2026-06-08-running-plan-engine-coach-doctrine.md` | foundational doctrine; unsafe before later digest-backed compression |

D25 line impact:

- `docs/tasks/running-coach` was `6361` lines before digest creation.
- D25 added a compact doctrine digest; this is line-positive and must not be counted as docs-size
  reduction.
- D25 enables later net-negative compression by protecting active doctrine first.

Subagent preflight:

- Doctrine preservation subagent classified most files as active doctrine or acceptance evidence and
  listed non-negotiable stop conditions.
- Source-of-truth ownership subagent confirmed no single compact doctrine owner existed and
  recommended creating `docs/tasks/running-coach/running-coach-doctrine-digest.md`.
- Compression safety subagent found no stale `ROLE:` prompt blocks and recommended a small D26
  historical audit/acceptance batch only after digest creation.
- All three read-only subagents were closed after findings were integrated.

Next selected batch:

`ARCHITECT Slice D26: guarded historical running-coach audit compression batch.`

Selected D26 candidates:

| File | Current lines | Boundary |
| --- | ---: | --- |
| `docs/tasks/running-coach/2026-06-09-running-plan-dynamic-scenario-matrix-coach-audit.md` | `367` | preserve verdicts, weak conservative-load findings, and supersession notes |
| `docs/tasks/running-coach/2026-06-09-running-plan-engine-scenario-pack-coach-audit.md` | `224` | preserve accepted scenario-pack verdict and unavailable-state notes |
| `docs/tasks/running-coach/2026-06-09-running-plan-rich-composition-implementation-coach-acceptance.md` | `224` | preserve acceptance verdict and what-not-to-change boundaries |
| `docs/tasks/running-coach/2026-06-10-running-plan-no-dead-end-long-horizon-coach-audit.md` | `178` | preserve long-horizon failure/repair evidence |
| `docs/tasks/running-coach/2026-06-11-running-plan-anti-flatness-repair-coach-acceptance.md` | `154` | preserve anti-flatness repair acceptance proof |
| D26 candidate batch | `1147` | historical audit/acceptance compression only |

## Slice D26 Closeout — 2026-06-22

Status: complete.

D26 compressed only guarded historical running-coach audit and acceptance evidence after the D25
doctrine digest protected active coaching rules. It preserved the historical failure-to-repair chain:
scenario-pack and dynamic-matrix gaps, rich-composition acceptance, no-dead-end long-horizon blocker,
and anti-flatness repair acceptance.

Selected files:

| Target | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/running-coach/2026-06-09-running-plan-dynamic-scenario-matrix-coach-audit.md` | `367` | `76` | `-291` |
| `docs/tasks/running-coach/2026-06-09-running-plan-engine-scenario-pack-coach-audit.md` | `224` | `61` | `-163` |
| `docs/tasks/running-coach/2026-06-09-running-plan-rich-composition-implementation-coach-acceptance.md` | `224` | `74` | `-150` |
| `docs/tasks/running-coach/2026-06-10-running-plan-no-dead-end-long-horizon-coach-audit.md` | `178` | `78` | `-100` |
| `docs/tasks/running-coach/2026-06-11-running-plan-anti-flatness-repair-coach-acceptance.md` | `154` | `71` | `-83` |
| D26 selected docs | `1147` | `360` | `-787` |

Doctrine safety notes:

- No target file contained unique active coaching doctrine that blocked compression.
- The closest doctrine-sensitive material was the 2026-06-10 / 2026-06-11 long-horizon
  anti-flatness pair; D26 preserved the exact scenario anchors, accepted repair pattern, and future
  guardrails.
- Final verdicts, supersession status, metric-truth guardrails, endpoint/family boundaries,
  weak-case findings, and QA artifact references were preserved.
- Active doctrine files such as Marathon Completion, universal richness bar, no-dead-end doctrine,
  manual-builder taxonomy, and Hito DS specimen matrix were not compressed.

Subagent preflight:

- One read-only explorer checked active coaching doctrine preservation, historical evidence
  compression safety, and current-doc/product-history drift across the D26 file set.
- The explorer confirmed the batch was safe as guarded historical compression and identified the
  exact verdicts, scenario anchors, metric-truth boundaries, and supersession chain to preserve.
- The explorer was closed after findings were integrated.

Post-D26 measured running-coach baseline:

| Root | Markdown lines |
| --- | ---: |
| `docs/tasks/running-coach` | `5738` |

Next recommended batch:

`ARCHITECT Slice D27: select the next net-negative docs compression batch after guarded running-coach compression.`

Boundary:

- Do not continue compressing running-coach docs by size alone; the largest remaining files are
  mostly active doctrine or adjacent current contracts.
- Prefer a source-proved completed/closed or superseded task/spec/backlog batch unless another
  running-coach file is proven historical and already represented in the doctrine digest/current
  docs.

## Slice D27 Closeout — 2026-06-22

Status: complete / next-lane selection checkpoint.

D27 rebaselined the docs compression track after guarded running-coach compression and selected the
next net-negative lane. It did not compress product/runtime docs directly.

Fresh docs baseline:

| Root | Markdown lines |
| --- | ---: |
| `docs/` | `45752` |
| `docs/plans/active` | `11595` |
| `docs/plans/archive` | `6174` |
| `docs/tasks/backlog` | `6779` |
| `docs/tasks/product-briefs` | `3049` |
| `docs/tasks/frontend-specs` | `6510` |
| `docs/tasks/running-coach` | `5738` |
| `docs/history` | `979` |

Candidate classification:

| Candidate lane | Decision | Reason |
| --- | --- | --- |
| Further running-coach compression | Deferred | largest remaining files are active doctrine/current contracts after D25/D26 |
| Active-plan compression | Deferred | largest files still guide live execution; compression would risk active owner drift |
| Current frontend specs | Deferred | top specs are active/current-contract: manual authoring, primitive-token rollout, active-plan lifecycle, workout detail lifecycle |
| Admin-imported closed/completed backlog and briefs | Selected | contains closed/completed historical docs and one untracked duplicate residue; one owner, one importer validation story |
| Logs / qa-artifacts | Deferred | artifact retention policy remains separate; no deletion/apply in docs compression lane |

Selected D28 batch:

| Target | Current lines | D28 action |
| --- | ---: | --- |
| `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence 2.md` | `298` | Delete only if final proof confirms untracked duplicate-space residue and no unique current truth |
| `docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md` | `397` | Compress completed historical backlog item; current truth lives in archive/digest/current docs |
| `docs/tasks/backlog/2026-06-11-workout-target-display-and-metric-prescription-grammar.md` | `374` | Compress completed QA-passed display cleanup history; preserve evidence links and metric-truth boundaries |
| `docs/tasks/backlog/2026-06-15-workout-metric-enrichment-truth-audit.md` | `274` | Compress closed benchmark-backed pace truth closeout; preserve provider/HR future boundaries |
| `docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md` | `298` | Compress closed accepted taxonomy only if durable product law remains explicit |
| D28 selected batch | `1641` | Expected materially net-negative with Admin importer proof |

Source-proof notes:

- The duplicate-space manual-workout backlog file is currently untracked, while the canonical
  tracked backlog item remains `in_progress` and linked to the active manual authoring plan.
- Completed Plan Preset backlog truth is already represented by the archived Plan Preset plan and
  product-history digest anchors.
- Workout target display and metric enrichment items are closed/accepted; current metric truth lives
  in current docs, source, and accepted QA references.
- The selected-distance taxonomy is closed accepted product law; compression must preserve its
  product law, valid/invalid unavailable states, family taxonomy, and what-not-to-change boundaries.

Subagents:

- None. D27 was a local sequential source-of-truth selection checkpoint, and the user asked to avoid
  unnecessary subagents. No implementation or broad parallel audit was needed.

Next recommended batch:

`ARCHITECT Slice D28: admin-imported closed/completed backlog and brief compression batch.`

## Slice D28 Closeout — 2026-06-22

Status: complete.

D28 compressed only closed/completed admin-imported backlog/product-brief history and deleted one
untracked duplicate-space backlog residue after source/admin proof. Runtime code, frontend UI,
current contracts, active plans, logs, and QA artifacts were not touched.

Selected files:

| Target | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence 2.md` | `298` | deleted | `-298` |
| `docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md` | `397` | `89` | `-308` |
| `docs/tasks/backlog/2026-06-11-workout-target-display-and-metric-prescription-grammar.md` | `374` | `86` | `-288` |
| `docs/tasks/backlog/2026-06-15-workout-metric-enrichment-truth-audit.md` | `274` | `86` | `-188` |
| `docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md` | `298` | `104` | `-194` |
| D28 selected docs | `1641` | `365` plus deleted duplicate | `-1276` |

Post-D28 measured baselines:

| Root | Markdown lines |
| --- | ---: |
| `docs/` | `44591` |
| `docs/tasks/backlog` | `5697` |
| `docs/tasks/product-briefs` | `2855` |

Deletion proof:

- The duplicate-space manual-workout backlog file was untracked before deletion.
- `git ls-files` listed the canonical tracked manual-workout backlog item and did not list the
  duplicate-space file.
- Source references showed the duplicate only referenced itself and this compression plan, while the
  canonical backlog item remains the current admin-imported owner.
- Read-only preflight found no unique current truth in the duplicate-space residue.

Admin/importer safety:

- Lead Admin importer metadata was preserved in every compressed tracked work item.
- Current manual authoring truth, selected-distance taxonomy boundaries, metric-truth guardrails,
  protected QA evidence references, and no-fake-pace / no-fake-personal-HR rules were preserved.
- Pre-existing Admin metadata warnings remained outside the D28 target set; D28 caused no new
  duplicate-count or import-breaking metadata drift.

Subagent preflight:

- One reused read-only explorer checked Admin metadata safety, duplicate-space proof,
  manual/metric/selected-distance boundary safety, and current-doc/product-history drift.
- The explorer confirmed the duplicate was subordinate and the tracked D28 files were safe for
  historical compression with guardrails preserved.
- The explorer was closed after findings were integrated.

Next recommended batch:

`ARCHITECT Slice D29: post-D28 docs compression rebaseline and next net-negative lane selection.`

Boundary:

- Do not continue backlog/product-brief compression by momentum.
- Do not compress running-coach active doctrine, active plans, current-contract specs, logs, or
  qa-artifacts.
- Select the next net-negative lane only after fresh source/admin-importer proof.

## Slice D29 Closeout — 2026-06-22

Status: complete / docs-artifact next-lane checkpoint.

D29 reassessed the post-D28 docs surface and did not force another markdown compression batch by
momentum. It selected a separate read-only artifact/log retention preflight as the next lane.

Fresh docs root inventory:

| Root | Markdown files | Markdown lines |
| --- | ---: | ---: |
| `docs/plans/active` | `5` | `11710` |
| `docs/plans/archive` | `73` | `6174` |
| `docs/tasks/frontend-specs` | `24` | `6510` |
| `docs/tasks/backlog` | `42` | `5697` |
| `docs/tasks/product-briefs` | `11` | `2855` |
| `docs/tasks/running-coach` | `20` | `5738` |
| `docs/history` | `2` | `979` |

Admin importer status:

- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000` passed.
- `duplicateCount` remained `0`.
- Remaining metadata warnings are pre-existing archive metadata issues and are not blocking importer
  usability.
- Metadata-only cleanup is not selected because it would not reduce docs noise and the importer is
  still usable.

Candidate lane classification:

| Candidate lane | Decision | Reason |
| --- | --- | --- |
| Active-plan compression | Deferred | largest active plans still own live execution or holding truth |
| Frontend spec tail compression | Deferred | large specs are active/current-contract; completed tail is already small |
| Further backlog/product-brief compression | Deferred | D28 completed the safe closed/completed batch; remaining large docs carry current or future truth |
| Further running-coach compression | Deferred | D25/D26 established the remaining large files as active doctrine/current contracts |
| Archive metadata warning cleanup | Deferred | metadata-only and not blocking importer usability |
| Logs/test-results retention | Selected | one owner, one dry-run validation story, material generated-artifact surface, no `qa-artifacts/` deletion |

Artifact/log proof:

- `npm run artifact:hygiene` passed in dry-run mode.
- It reports `logs/` and `test-results/` only, with `523` files and about `21.0MB`.
- `qa-artifacts/` remains excluded by default as protected evidence.
- The tool currently has no apply mode, and deletion/compression remains out of scope.

Subagent preflight:

- Reused one already-open read-only explorer for a combined docs-size, current-contract, and
  artifact/log readiness audit instead of spawning three more agents.
- The explorer confirmed that markdown compression should pause until a fresh historical batch
  appears, and that logs/test-results are the next separate preflight lane.
- The explorer was closed after its findings were integrated.

Selected next lane:

`BACKEND/OPS Slice L2: log/test-results retention policy and tooling preflight.`

Boundary:

- D29 is a checkpoint, not a compression win.
- L2 must stay read-only and must not delete logs, `test-results/`, or `qa-artifacts/`.
- `qa-artifacts/` remains blocked on a dedicated QA evidence-retention policy.

## Slice L2 Closeout — 2026-06-22

Status: complete / read-only artifact-log retention preflight accepted.

L2 did not mutate files, logs, `test-results/`, `qa-artifacts/`, source, docs, runtime, or generated
artifacts. It confirmed that `npm run artifact:hygiene` is the current non-mutating inventory owner.

L2 findings:

| Surface | Files | Size | Classification | Decision |
| --- | ---: | ---: | --- | --- |
| `logs/` + `test-results/` | `523` | about `21.0MB` | generated local artifacts | keep dry-run only |
| `logs/` | `522` | about `21.0MB` | `recent_raw_logs` | no apply/delete; newest age `0` days, oldest about `10.49` days |
| `test-results/` | `1` | `45B` | `generated_test_runner_residue` | future explicit cleanup only |
| `qa-artifacts/` | `3062` | about `934.8MB` | `protected_qa_evidence` | excluded/protected; no deletion/compression |

Current tool boundary:

- `mutation:false`
- `applyModeAvailable:false`
- `deletion:"out_of_scope"`
- `qa-artifacts/` can be counted only as protected evidence, not disposable output.
- Apply/delete is not recommended now because logs are recent and there is no per-file manifest
  suitable for audited apply decisions.

Selected next gate:

`BACKEND/OPS Slice L3: artifact hygiene per-file manifest dry-run enhancement.`

Why L3:

- It is the smallest safe tooling improvement before any future apply-capable cleanup.
- It keeps the existing artifact hygiene reporter as the canonical owner.
- It adds evidence, not deletion: per-file/per-category manifest support for `logs/` and
  `test-results/`.
- It preserves `qa-artifacts/` as protected evidence and keeps apply/delete out of scope.

Blocked after L2:

- Logs/test-results apply cleanup remains blocked until L3 manifest support exists and a later
  explicit apply-capable slice is selected.
- `qa-artifacts/` deletion/compression remains blocked until a separate QA evidence retention policy
  exists.

## Slice L3 Closeout — 2026-06-22

Status: complete / non-mutating manifest mode accepted for artifact hygiene.

L3 reused the existing artifact hygiene reporter as the canonical owner and added only an additive
dry-run manifest mode. It did not add apply/delete/compress/archive behavior and did not mutate
`logs/`, `test-results/`, `qa-artifacts/`, runtime source, product docs, Supabase, or generated
artifacts.

What changed:

- `npm run artifact:hygiene` remains the default summary-only dry run.
- `npm run artifact:hygiene -- --manifest` now emits top-level per-file manifest entries for
  `logs/` and `test-results/`.
- Manifest entries include path, artifact kind, file/symlink kind, age, size, retention category,
  suggested action, and explicit deletion/compression allow flags.
- `npm run artifact:hygiene -- --manifest --include-qa-artifacts` can count `qa-artifacts/` as
  protected evidence only; every QA artifact manifest entry remains non-disposable.

Validation evidence:

| Command | Result |
| --- | --- |
| `node --check scripts/report-local-artifact-hygiene.mjs` | passed |
| `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs` | passed |
| `npm run artifact:hygiene` | passed; dry run, `mutation:false`, no manifest by default |
| `npm run artifact:hygiene -- --manifest` | passed; `523` manifest entries, deletion/compression false |
| `npm run artifact:hygiene -- --manifest --include-qa-artifacts` | passed; `qa-artifacts/` classified as `protected_qa_evidence`, deletion/compression false |

Current L3 manifest snapshot:

| Category | Files | Size | Allow flags |
| --- | ---: | ---: | --- |
| `recent_raw_logs` | `521` | about `21.0MB` | deletion false / compression false |
| `old_logs_archive_candidate` | `1` | `367B` | deletion false / compression false |
| `generated_test_runner_residue` | `1` | `45B` | deletion false / compression false |
| `protected_qa_evidence` with explicit `--include-qa-artifacts` | `3064` | about `934.8MB` | deletion false / compression false |

Blocked after L3:

- Logs/test-results apply cleanup remains blocked until a later explicit apply-capable DEVTOOLS
  slice defines manifest-to-apply exactness, current QA-server preservation rules, and stop
  conditions.
- `qa-artifacts/` deletion/compression remains blocked until a separate QA evidence retention policy
  exists.

## Post-L3 Apply-Safety Selection — 2026-06-22

Status: holding / no apply-capable cleanup gate selected.

Architecture accepted L3 and inspected the manifest state. The current artifact surface does not
justify a deletion, compression, archive, or apply-safety implementation slice.

Current manifest decision:

| Category | Manifest proof | Decision |
| --- | --- | --- |
| `recent_raw_logs` | `521` files, about `21.0MB` | hold; recent diagnostics should stay available |
| `old_logs_archive_candidate` | `1` file, `367B` | hold; too small to justify apply/archive tooling |
| `generated_test_runner_residue` | `1` file, `45B` | hold; too small for a dedicated cleanup gate |
| `protected_qa_evidence` | counted only with `--include-qa-artifacts`, about `934.8MB` | blocked; requires separate QA evidence-retention policy |

Selected next gate:

`ARCHITECT artifact/log retention holding — resume only when the L3 manifest proves a material safe cleanup candidate.`

L4 classification:

- Not apply-capable cleanup.
- Not apply-safety tooling.
- Current state is hold/no-op.

Rationale:

- All L3 manifest deletion/compression allow flags remain false.
- The only non-recent or generated residues are tiny (`367B` and `45B`).
- Selecting apply/delete now would violate the manifest-to-apply proof requirement.
- `qa-artifacts/` remains a separate protected-evidence policy problem, not an artifact hygiene
  cleanup target.

## Post-Log-Retention Next-Lane Selection — 2026-06-22

Status: holding / no next docs-artifact cleanup gate selected.

Architecture reassessed the available lanes after artifact/log retention entered holding. No
candidate currently meets the bar of one owner, one risk class, one validation story, and material
cleanup value.

Current docs/artifact inventory:

| Root | Markdown files | Markdown lines | Decision |
| --- | ---: | ---: | --- |
| `docs/plans/active` | `5` | `11886` | hold; active execution/holding truth |
| `docs/plans/archive` | `73` | `6174` | hold; archive tail is already compact |
| `docs/tasks/frontend-specs` | `24` | `6510` | hold; largest files are active/current-contract specs |
| `docs/tasks/backlog` | `42` | `5697` | hold; remaining large docs carry current/future truth |
| `docs/tasks/product-briefs` | `11` | `2855` | hold; largest briefs are current/future contracts |
| `docs/tasks/running-coach` | `20` | `5738` | hold; remaining large files are active doctrine/current contracts |
| `docs/history` | `2` | `979` | hold; compact digest/changelog roots |

Lane classification:

| Lane | Decision | Reason |
| --- | --- | --- |
| More markdown compression | Holding | top candidates are active plans, current-contract specs, or active doctrine |
| Active-plan closeout/archive | Holding | all active plans still show `in_progress`; no completed plan is ready to archive from this checkpoint |
| Current-doc/source-of-truth deduplication | Holding | no concrete duplicate owner was proved in this checkpoint |
| Artifact/log retention | Holding | L3 manifest remains recent/tiny with deletion/compression false |
| QA evidence-retention policy | Deferred | separate policy decision required before touching `qa-artifacts/` |

Resume conditions:

- A current active plan closes and becomes safe to archive/compress.
- A historical/superseded docs batch is source-proved and materially net-negative.
- A source-of-truth duplicate owner is discovered with importer-safe demotion/deletion proof.
- `npm run artifact:hygiene -- --manifest` shows material non-recent/disposable log/test residue.
- Product explicitly selects a QA evidence-retention policy track for `qa-artifacts/`.

## Full Repository Size And Deletion-Readiness Audit — 2026-06-22

Status: complete / next gate selected.

Architecture ran a repository-wide read-only inventory across tracked source, docs, static assets,
local QA evidence, logs, test results, generated output, and untracked residue. No files were
deleted, moved, compressed, archived, or mutated.

Commands used included:

```bash
git ls-files
git status --short
git ls-files --others --exclude-standard
du -sh . src scripts docs public qa-artifacts logs test-results .output node_modules
find qa-artifacts -type f
find docs -type f -name '*.md'
find docs -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.gif' \)
node ./scripts/report-local-artifact-hygiene.mjs --manifest
node ./scripts/report-local-artifact-hygiene.mjs --manifest --include-qa-artifacts
```

Tracked source/code inventory:

| Category | Tracked files | Lines | Size | Classification |
| --- | ---: | ---: | ---: | --- |
| `src/` | about `296-300` | about `119k-122k` | `5.3MB` | active source; decomposition candidates only |
| `scripts/` | `51` tracked | `34712` | `1.3MB` | validators/proof/tooling; cleanup only with owner proof |
| root config/package, excluding lockfile | `6` | `333` | small | keep |
| `package-lock.json` | `1` | `10599` | lockfile | generated dependency lock; do not treat as decomposition target |
| `supabase/` | `18-26` | about `1.7k` | small | migrations/config; do not touch in cleanup audit |

Largest tracked source/script hotspots:

| File | Lines | Classification |
| --- | ---: | --- |
| `src/styles.css` | `5175` | decomposition/design-token candidate, not deletion |
| `src/routes/hitoDS.tsx` | `4571` | DS route decomposition candidate, not deletion |
| `src/routes/admin.analytics.tsx` | `2378` | frontend/admin decomposition candidate |
| `src/routes/admin.capture.tsx` | `2128` | frontend/admin decomposition candidate |
| `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx` | `1659` | frontend/manual decomposition candidate |
| `scripts/import-repo-work-items-to-admin-backlog.ts` | `1798` | importer/tooling owner; do not rewrite casually |
| `scripts/plan-authoring-doctrine/*` and `scripts/manual-workout-authoring/*` | `1000+` each | proof/validator cluster; candidate for future tooling decomposition only |

Docs and tracked evidence inventory:

| Surface | Files | Lines/size | Classification |
| --- | ---: | ---: | --- |
| `docs/` markdown | about `201` markdown files | about `44807` lines | active/current-contract mostly; no broad compression gate |
| `docs/plans/archive` | `73` markdown files | `6174` lines | archive tail compact |
| `docs/plans/active` | `5` markdown files | about `11926` lines | active execution/holding truth |
| `docs/tasks/frontend-specs` | `24` markdown files | `6510` lines | top files are current-contract specs |
| `docs/tasks/running-coach` | `20` markdown files | `5738` lines | active doctrine/current contracts |
| `docs/process/screenshots` | `53` files | `21MB` | tracked evidence; needs retention policy before compression/removal |
| `docs/tasks/backlog/assets` | `12` files | `4.6MB` | tracked evidence/assets; needs retention policy before compression/removal |
| tracked docs images/assets total | `64-65` files | about `25-26MB` | policy candidate, not immediate deletion |

Local/generated/protected inventory:

| Surface | Files | Size | Classification |
| --- | ---: | ---: | --- |
| repo root total | n/a | about `2.1GB` | dominated by `node_modules` and QA evidence |
| `node_modules/` | n/a | about `959MB` | dependency cache; not project cleanup |
| `qa-artifacts/` | about `3069-3071` files | about `938-945MB` | protected QA evidence |
| `qa-artifacts/screenshots` | about `2307` files | about `864MB` | largest cleanup opportunity, policy-first |
| `logs/` | `522` files | about `21-22MB` | generated logs; L3 manifest says recent/tiny/no allow flags |
| `test-results/` | `1` file | `4KB` / manifest `45B` | tiny generated residue |
| `.output/` | tiny symlink/metadata surface | `4KB` | ignored generated output, no material gate |
| `.tanstack/`, `.vercel/` | small | about `12KB` each | local state/metadata; do not clean casually |

Deletion-readiness classification:

| Candidate surface | Classification | Decision |
| --- | --- | --- |
| `qa-artifacts/` and screenshots | needs QA evidence-retention policy | selected next gate; no deletion now |
| tracked docs screenshots/assets | needs QA/evidence-retention policy | include in selected policy inventory |
| logs/test-results | tooling-owned generated output | holding; current manifest low-value and deletion/compression false |
| untracked `scripts/lib/*.mjs` residue | possible source cleanup candidate | defer; current dirty tree has active work and needs source owner proof |
| `.DS_Store` and tiny local residue | too small to justify slice | defer |
| active plans/current specs/running-coach doctrine | active/current-contract, do not touch | defer |
| large source files | decomposition candidates | defer to dedicated source architecture, not deletion |

Selected next gate:

`QA Slice E1: QA evidence retention policy and screenshot inventory.`

Why this gate:

- It targets the largest cleanup opportunity without deleting evidence.
- It has one owner: QA evidence policy.
- It has one risk class: protected acceptance evidence classification.
- It has one validation story: file/byte inventory plus reference scans.
- It is required before any safe compression/deletion of screenshots or QA artifacts can be
  considered.

Subagent preflight:

- Source/code/scripts explorer audited tracked source, scripts, configs, hotspots, and untracked
  source residue.
- Docs/source-of-truth explorer audited docs line counts, current-contract boundaries, archive tail,
  Admin importer status, and tracked docs evidence assets.
- Artifact/assets explorer audited `qa-artifacts`, screenshots, logs, `test-results`, `.output`,
  `.tanstack`, `.vercel`, and static/public assets.
- All three read-only subagents were closed after findings were integrated.

## Later Candidate Batches

| Candidate | Owner | Boundary |
| --- | --- | --- |
| QA Slice E1: QA evidence retention policy and screenshot inventory | QA | Selected next; policy/inventory only, no deletion/compression/move |
| Future logs/test-results apply cleanup | BACKEND / OPS | Holding until the L3 manifest shows material non-recent candidates and a later explicit apply-capable slice is selected |
| Active plan compression | ARCHITECT | Only after active execution owners are stable; preserve current stage and exact next role |
| Admin/backlog spec compression | ARCHITECT / BACKLOG MANAGER | Must preserve repo-derived admin metadata and pass importer dry-run |
| Running Coach doctrine digest | RUNNING COACH / ARCHITECT | Preserve safety/coaching doctrine; do not flatten into generic changelog prose |

## Slice E1 Closeout — 2026-06-22

Status: accepted / policy inventory only.

QA Slice E1 passed as a read-only QA evidence-retention inventory. No evidence was deleted,
compressed, moved, archived, renamed, rewritten, or created. The accepted policy owner is
[QA Artifact Storage Policy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/process/qa-artifact-policy.md).

E1 inventory:

| Surface | Files | Bytes | Size | Notes |
| --- | ---: | ---: | ---: | --- |
| `qa-artifacts/` | `3071` | `984054807` | `938.47 MiB` | protected local QA evidence |
| `qa-artifacts/screenshots/` | `2309` | `900779682` | `859.05 MiB` | largest protected evidence surface |
| `docs/process/screenshots` | `53` | `22044186` | `21.02 MiB` | tracked evidence; `53/53` referenced |
| `docs/tasks/backlog/assets` | `12` | `4806501` | `4.58 MiB` | tracked backlog assets; `9/12` referenced, `3/12` manual-review |

Likely local screenshot owners by folder slug:

| Owner bucket | Size |
| --- | ---: |
| Hito DS / visual primitives | `285.74 MiB` |
| Manual workout authoring/calendar | `238.54 MiB` |
| Plan creation/onboarding | `133.09 MiB` |
| Admin/backlog | `130.60 MiB` |
| Unknown/manual-review | `59.51 MiB` |

Accepted retention classes:

- `keep-permanent`
- `keep-until-plan-archive`
- `promote-to-docs-digest`
- `compress-after-policy`
- `delete-after-expiry`
- `unknown/manual-review`

Required before any future apply-capable evidence cleanup:

- full path manifest;
- file count and byte count before action;
- reference scan across current docs, active/archive plans, tasks, QA reports, changelog, and digest;
- classification and reason per file/folder;
- list of preserved/promoted screenshots;
- rollback/recovery note, including tracked vs local-only recoverability;
- Product approval for expiry, compression, deletion, format, and quality thresholds;
- dry-run reviewed before apply.

Selected next gate:

`ARCHITECT Slice E2: select the first QA evidence cleanup candidate from the accepted retention policy, or hold.`

Why E2 is policy-safe:

- It does not authorize deletion, compression, movement, archive, rename, rewrite, or screenshot
  creation.
- It separates evidence classification from apply mechanics.
- It can stop cleanly if Product threshold decisions are required before a safe candidate exists.
- `qa-artifacts/`, `docs/process/screenshots`, and `docs/tasks/backlog/assets` remain protected
  evidence until E2 or a later gate proves an exact safe class and boundary.

## Slice E2 Closeout — 2026-06-22

Status: holding / no apply-capable evidence cleanup selected.

Architecture ran a read-only policy-safe candidate selection after E1. The root cause is not simply
that local screenshots are large; the root cause is that the evidence-retention policy intentionally
blocks deletion/compression until each candidate has a reviewed manifest, reference scan,
classification, rollback note, and Product-approved thresholds.

Read-only evidence checked:

| Surface | Finding | E2 decision |
| --- | --- | --- |
| `qa-artifacts/` | only material size target, about `938-945MB`; protected local QA evidence | no apply cleanup without Product thresholds |
| `qa-artifacts/screenshots` | largest evidence surface, about `859-864MB`; contains recent and active-plan-linked QA proof | no delete/compress candidate selected |
| `docs/process/screenshots` | about `21MB`; `53/53` referenced by process docs | likely `keep-permanent`; no cleanup gate |
| `docs/tasks/backlog/assets` | about `4.58MB`; most referenced, `3` filename-level manual-review examples remain | too small and `unknown/manual-review`; no deletion gate |

Largest local screenshot folders observed in E2 read-only scan:

| Folder | Files | Bytes | Decision |
| --- | ---: | ---: | --- |
| `qa-artifacts/screenshots/2026-06-11/manual-saved-template-browser-acceptance-qa` | `37` | `80377507` | likely `keep-until-plan-archive` / threshold-dependent |
| `qa-artifacts/screenshots/2026-06-22/primitive-token-data-table-pt2-qa` | `24` | `61416975` | recent accepted QA evidence; threshold-dependent |
| `qa-artifacts/screenshots/2026-06-16/test-calendar-sandbox-tc2-qa` | `29` | `53285433` | accepted sandbox parity proof; threshold-dependent |
| `qa-artifacts/screenshots/2026-05-28/admin-capture-backlog-interactivity-qa` | `9` | `28520439` | admin/backlog proof; threshold-dependent |

Candidate classification:

| Class | E2 result |
| --- | --- |
| `keep-permanent` | tracked `docs/process/screenshots` appear referenced and should stay preserved by default |
| `keep-until-plan-archive` | active-plan-linked local QA folders likely belong here, but need manifest classification |
| `promote-to-docs-digest` | possible later path for representative screenshots, but Product must define what merits promotion |
| `compress-after-policy` | blocked until Product approves age, format, quality, and review thresholds |
| `delete-after-expiry` | blocked until Product approves expiry threshold and manual-review rules |
| `unknown/manual-review` | tracked backlog assets with no direct filename reference are too small for an apply gate and need manual classification first |

Selected next gate:

`PRODUCT Slice E3: approve QA evidence retention thresholds before any apply-capable cleanup.`

Product decisions required:

- Minimum age before local-only QA evidence can enter `delete-after-expiry`.
- Minimum age before local-only QA evidence can enter `compress-after-policy`.
- Compression format, quality target, and visual acceptability rule.
- Whether evidence linked from active plans remains `keep-until-plan-archive`.
- Whether tracked `docs/process/screenshots` are `keep-permanent` by default.
- Whether unreferenced `docs/tasks/backlog/assets` can be deleted only after manual review.
- Whether representative local screenshots must be promoted to docs/digest before local pruning.

Subagent preflight:

- One read-only explorer was used for evidence bucket/reference classification and then closed.
- The explorer independently recommended holding evidence cleanup until Product thresholds exist.

## Slice E3 Closeout — 2026-06-22

Status: accepted / Product thresholds recorded, no evidence mutation approved.

Product approved the QA evidence-retention thresholds required before future apply-capable cleanup
can be considered. The thresholds are now recorded in
[QA Artifact Storage Policy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/process/qa-artifact-policy.md).

Approved thresholds and guardrails:

- `delete-after-expiry` eligibility requires at least `45` days after the related plan or QA gate
  closeout/archive, local-only evidence, zero active/current references, and reviewed manifest
  proof.
- `compress-after-policy` eligibility requires at least `21` days after the related plan or QA gate
  closeout/archive, local-only routine screenshots, zero active/current references, and reviewed
  manifest proof.
- Active-plan-linked evidence is `keep-until-plan-archive`.
- Tracked `docs/process/screenshots` are `keep-permanent` by default.
- Unreferenced `docs/tasks/backlog/assets` may be deleted only after manual review.
- Representative local screenshots must be promoted to docs/digest before pruning when they are the
  only durable proof for accepted QA/product behavior.
- Routine compression, if later approved by a reviewed apply slice, must use WebP with dimensions
  preserved and default quality `82`.
- Pixel-sensitive or visual-sensitive Hito DS evidence must remain `keep-permanent`,
  `unknown/manual-review`, or use lossless compression only.
- Visual acceptability requires readable text at `100%`, visible layout/overflow evidence, and
  sample review before apply.
- Security/auth/admin evidence, failed/blocked QA evidence, and unknown ownership remain
  `unknown/manual-review`.

This E3 decision does not approve deleting, compressing, moving, archiving, renaming, rewriting,
regenerating, or creating any evidence. It only removes the threshold-policy blocker that prevented
manifest-backed classification.

Selected next gate:

`QA Slice E4: build the first QA evidence path manifest and retention classification dry-run.`

Why E4 is the next safe gate:

- It has one owner: QA evidence classification.
- It has one risk class: read-only protected-evidence manifest and reference proof.
- It has one validation story: full path manifest, byte/file counts, reference scan,
  class/reason per file or folder, preserved/promoted screenshot list, and rollback note.
- It keeps BACKEND/OPS apply tooling out of scope until a reviewed manifest proves material value and
  exact candidate boundaries.

## Slice E4 Closeout — 2026-06-22

Status: accepted / first manifest-backed compression candidate classified, no evidence mutation.

QA E4 completed a no-apply manifest/classification pass for exactly one local-only screenshot bucket:

`qa-artifacts/screenshots/2026-05-30/long-horizon-review-copy-fix-qa/`

Manifest summary:

| Field | Value |
| --- | ---: |
| File count | `3` |
| Byte count | `15066079` |
| Disk usage | `14720 KiB` |
| Age as of 2026-06-22 | `23 days` |
| Direct references outside bucket | `0` |

Files classified:

| File | Bytes | Class | Representative decision |
| --- | ---: | --- | --- |
| `loading-state-reviewing-plan.png` | `5534178` | `compress-after-policy` | no promotion required |
| `plan-ready-modal-copy-fix-check.png` | `4564710` | `compress-after-policy` | representative proof reviewed; no promotion required before compression |
| `pre-submit-retained-values.png` | `4967191` | `compress-after-policy` | no promotion required |

Architecture decision:

- The bucket is not eligible for `delete-after-expiry` because Product policy requires at least
  `45` days.
- The bucket can proceed toward compression proof because Product policy allows
  `compress-after-policy` after at least `21` days when evidence is local-only, routine, and has
  zero active/current references.
- `plan-ready-modal-copy-fix-check.png` does not need promotion to tracked docs/digest before a
  future compression gate. It demonstrates review modal copy, but it is not the only durable proof:
  the related QA report records the review boundary and copy follow-up context, and current history
  preserves long-horizon first-plan behavior. The screenshot also includes desktop/background noise,
  so it is not a curated permanent release-evidence asset.
- This decision is limited to this bucket only and does not generalize to all QA artifacts.

Selected next gate:

`BACKEND/OPS Slice E5: add a no-apply QA evidence compression dry-run/sample gate for the E4 bucket.`

Why E5 is the next safe gate:

- It has one owner: BACKEND/OPS local tooling.
- It has one risk class: no-apply compression estimation/sample generation.
- It has one validation story: prove original evidence remains unchanged, estimate/sample WebP
  savings at quality `82`, preserve dimensions, and leave visual acceptability for later QA review.
- It does not approve compression-in-place, deletion, movement, archive, rename, rewrite, or
  regeneration of evidence.

## Slice E5 Closeout — 2026-06-22

Status: complete / no-apply compression estimator and sample gate accepted for the E4 bucket.

E5 reused the existing `npm run artifact:hygiene` reporter as the canonical local artifact tooling
owner. It did not add a parallel cleanup script and did not add apply/delete/compress-in-place
behavior.

What changed:

- `npm run artifact:hygiene -- --e4-compression-estimate` now runs an in-memory WebP quality `82`
  estimate for exactly this bucket:
  `qa-artifacts/screenshots/2026-05-30/long-horizon-review-copy-fix-qa/`.
- `npm run artifact:hygiene -- --write-e4-compression-samples --sample-output-dir <path>` can write
  sample WebP files only to an explicit output directory outside the E4 evidence bucket.
- Sample output is reported as disposable/non-evidence and does not replace, rename, rewrite, move,
  delete, or mutate the original PNG evidence.
- The tool blocks sample output when `--sample-output-dir` is missing or points inside the evidence
  bucket.

No-apply estimate result:

| File | Original bytes | WebP q82 bytes | Savings | Dimensions preserved | QA visual review |
| --- | ---: | ---: | ---: | --- | --- |
| `loading-state-reviewing-plan.png` | `5534178` | `367644` | `93.36%` | yes, `2940x1912` | required before any future apply |
| `plan-ready-modal-copy-fix-check.png` | `4564710` | `373066` | `91.83%` | yes, `2940x1912` | required before any future apply |
| `pre-submit-retained-values.png` | `4967191` | `346206` | `93.03%` | yes, `2940x1912` | required before any future apply |
| Total | `15066079` | `1086916` | `92.79%` | yes | required before any future apply |

Sample proof:

- Explicit sample command wrote three `.webp` files to `/tmp/hito-e4-compression-samples`.
- Original PNG size/mtime stats were compared before and after default, estimate, and sample runs;
  originals remained unchanged.
- The sample gate still reports `applyModeAvailable:false`, `evidenceMutation:false`,
  `deletionAllowedByThisTool:false`, and `compressionApplyAllowedByThisTool:false`.

Validation evidence:

| Command | Result |
| --- | --- |
| `node --check scripts/report-local-artifact-hygiene.mjs` | passed |
| `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs` | passed |
| `npm run artifact:hygiene` | passed; no compression report by default and originals unchanged |
| `npm run artifact:hygiene -- --e4-compression-estimate` | passed; in-memory estimate only, originals unchanged |
| `npm run artifact:hygiene -- --write-e4-compression-samples --sample-output-dir /tmp/hito-e4-compression-samples` | passed; samples written outside evidence bucket, originals unchanged |
| missing `--sample-output-dir` with sample flag | bounded failure |
| sample output inside E4 evidence bucket | bounded failure |

Blocked after E5:

- No compression apply is approved. A future apply-capable slice still needs reviewed dry-run output,
  QA visual acceptability review of the WebP samples, rollback/recovery notes, and explicit Product
  approval for replacing or pruning local evidence.
- This E5 gate applies only to the E4 bucket and does not generalize to all `qa-artifacts/`.

## Pragmatic Local QA Artifact Policy Reset — 2026-06-22

Status: accepted / Product policy update recorded, no evidence mutation approved.

Product approved a pragmatic retention reset for local gitignored `qa-artifacts/`. The prior
threshold model was intentionally conservative, but it treated fast-changing local screenshots too
much like permanent release evidence. The new source-of-truth policy is recorded in
[QA Artifact Storage Policy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/process/qa-artifact-policy.md).

Policy boundary:

- Applies only to local gitignored `qa-artifacts/`.
- Does not apply to tracked `docs/process/screenshots`.
- Does not apply to tracked `docs/tasks/backlog/assets`.
- Does not approve immediate deletion, compression, movement, archive, rename, rewrite,
  regeneration, or creation of evidence.

Approved local `qa-artifacts/` thresholds:

- `delete-after-expiry`: local-only folders after `14` days when directly unreferenced, not linked
  to an active/in-progress plan, not security/auth/admin-sensitive, not failed/blocked evidence, not
  unknown ownership, and not manually marked keep.
- `compress-after-policy`: local-only folders after `7` days when deletion is not yet allowed but
  the folder is routine visual/debug evidence and directly unreferenced.
- `keep-until-plan-archive`: directly referenced evidence for active plans or current QA gates.
- `promote-to-docs-digest`: only representative evidence referenced as durable product history or
  the only proof of an accepted high-risk decision.
- `unknown/manual-review`: security/auth/admin evidence, failed/blocked QA evidence, unknown
  ownership, ambiguous folder purpose, or manually marked keep.

Architecture decision:

- The old selected E5 sample-compression path is superseded before implementation. It was safe but
  too narrow for the new Product policy because the real missing seam is folder-level TTL/reference
  classification across local `qa-artifacts/`.
- Existing `artifact:hygiene --manifest --include-qa-artifacts` support is not enough for the new
  policy because it reports QA artifacts as protected evidence and does not classify task-scoped
  folders by TTL, direct references, active-plan linkage, sensitivity, failure status, or unknown
  ownership.

Selected next gate:

`BACKEND/OPS Slice E5: add folder-level local QA artifact retention manifest support.`

Why this is the next safe gate:

- It has one owner: BACKEND/OPS local artifact tooling.
- It has one risk class: dry-run folder manifest/classification only.
- It has one validation story: prove default dry-run behavior remains non-mutating, run the new
  folder-level manifest mode, and keep all apply/delete/compress flags false.
- It gives ARCHITECT enough evidence to select a future folder-level apply candidate without
  hand-classifying every screenshot.

## Slice E5 Folder Manifest Closeout — 2026-06-22

Status: complete / folder-level QA artifact manifest support added, no evidence mutation.

Backend extended the existing `npm run artifact:hygiene` reporter instead of adding a parallel
cleanup tool. The new explicit `--qa-folder-manifest` mode classifies local gitignored
`qa-artifacts/` leaf evidence folders by folder path, file count, byte count, newest/oldest content
age, direct reference scan, inferred ownership/sensitivity flags, retention class, and reason.

Implementation boundary:

- Default `npm run artifact:hygiene` remains unchanged: dry-run only, `qa-artifacts/` excluded as
  protected evidence unless explicitly requested.
- `--qa-folder-manifest` scans only local `qa-artifacts/`; tracked evidence roots
  `docs/process/screenshots` and `docs/tasks/backlog/assets` are not classified as disposable.
- All folder-level apply flags remain false: no deletion, compression, move, archive, rename,
  rewrite, regeneration, or sample creation.
- Reference scanning covers docs/source/script/package/agent text roots and reports direct hits so
  ARCHITECT can choose a future candidate from reviewed evidence rather than raw folder size.

Validation evidence:

- `node --check scripts/report-local-artifact-hygiene.mjs`: pass.
- `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs`: pass.
- `npm run artifact:hygiene`: pass; output remained dry-run, `mutation: false`,
  `evidenceMutation: false`, `applyModeAvailable: false`, and no `qaFolderManifest` by default.
- `npm run artifact:hygiene -- --qa-folder-manifest`: pass; output remained dry-run,
  `mutation: false`, `evidenceMutation: false`, `applyModeAvailable: false`, folder
  `deletionAllowedByThisTool: false`, and folder `compressionAllowedByThisTool: false`.

Current folder-manifest snapshot:

| Class | Folders | Files | Size |
| --- | ---: | ---: | ---: |
| `compress-after-policy` | `89` | `858` | `127.7 MB` |
| `delete-after-expiry` | `60` | `389` | `125.3 MB` |
| `keep-until-plan-archive` | `16` | `826` | `317.9 MB` |
| `promote-to-docs-digest` | `7` | `102` | `28.5 MB` |
| `unknown/manual-review` | `71` | `830` | `380.4 MB` |

Reference scan snapshot:

- Scanned text files: `586`.
- Scan roots: `docs`, `src`, `scripts`, `package.json`, `AGENTS.md`, `agents`, `skills`.
- Skipped roots: none.

Evidence mutation proof:

- `qa-artifacts/` file count before/after default dry-run: `3127` -> `3127`.
- `qa-artifacts/` file count before/after folder manifest dry-run: `3127` -> `3127`.
- `qa-artifacts/` size before/after folder manifest dry-run: `1032032 KiB` -> `1032032 KiB`.

Next recommended gate:

- ARCHITECT should review the folder manifest and select one exact future candidate folder or
  candidate class for an apply-capable proposal. No apply/delete/compress behavior exists yet.

## Slice E6 Closeout And E7 Selection — 2026-06-22

Status: E6 accepted / first apply-capable compression gate selected, no evidence mutated by
ARCHITECT.

QA E6 completed visual acceptability review for the E4 WebP q82 samples. The reviewed bucket remains:

`qa-artifacts/screenshots/2026-05-30/long-horizon-review-copy-fix-qa/`

Accepted E4/E5/E6 proof:

| Field | Value |
| --- | ---: |
| Original PNG files | `3` |
| Original total | `15066079` bytes |
| WebP q82 sample total | `1086916` bytes |
| Estimated savings | about `92.79%` |
| Dimensions preserved | `2940x1912` for all files |
| Direct references outside bucket | `0` |
| Deletion eligibility | no |
| Compression eligibility | yes, `compress-after-policy` |

Apply-shape decision:

- Do not keep PNGs and add WebP copies in the evidence bucket; that would improve portability but
  would not reduce local evidence size.
- Do not delete the bucket or the originals outright; `delete-after-expiry` is not eligible and
  deletion is outside the accepted E4/E5/E6 proof.
- Do not move originals into another `qa-artifacts/` folder as the retained state; that would make
  the evidence root harder to reason about and would not produce a clear bucket-level compression
  result.
- Select a controlled one-bucket replacement: generate WebP q82 files, verify dimensions and
  checksums, copy original PNGs to an explicit rollback directory outside `qa-artifacts/`, then
  remove the original PNGs from the E4 bucket only after validation passes.
- Keep the rollback directory after apply and report restore instructions. A later cleanup can
  decide whether rollback copies are disposable; E7 must not delete them.

Selected next gate:

`BACKEND/OPS Slice E7: apply E4 bucket WebP compression with rollback manifest.`

Why E7 is policy-safe:

- It has one owner: BACKEND/OPS local artifact tooling.
- It has one risk class: apply-capable compression for one reviewed local-only screenshot bucket.
- It has one validation story: exact manifest, checksums, rollback copy outside `qa-artifacts`,
  post-apply byte/file/dimension proof, and unchanged default dry-run behavior.
- It does not generalize to all QA artifacts and does not touch tracked docs evidence, logs,
  `test-results`, runtime, frontend UI, Supabase, OpenAI, or product behavior.

## Delete-After-Expiry Archive Quarantine Closeout — 2026-06-22

Status: complete / manifest-safe local QA artifact folders moved to archive quarantine.

Product approved class-wide cleanup for folders whose fresh folder manifest class is exactly
`delete-after-expiry`. Backend reused `npm run artifact:hygiene` and added only an explicit
`--apply-delete-after-expiry-archive` flag. The default command remains dry-run and non-mutating.

Fresh pre-apply manifest:

- `delete-after-expiry`: `60` folders / `389` files / `131,374,322` bytes.
- Unsafe selected folders: `0`.
- Reference scan: `completed`.
- Direct references: `0` for selected folders.
- Active-plan linkage: `false` for selected folders.
- Security/auth/admin sensitivity: `false` for selected folders.
- Failed/blocked status: `false` for selected folders.
- Unknown ownership: `false` for selected folders.
- Manual keep marker: `false` for selected folders.

Apply proof:

| Pass | Archive root | Folders | Files | Bytes | Size |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | `.local-artifact-archive/qa-artifacts-delete-after-expiry-20260622212530/` | `60` | `389` | `131,374,322` | `125.3 MB` |
| 2 | `.local-artifact-archive/qa-artifacts-delete-after-expiry-20260622212623/` | `1` | `3` | `13,567,454` | `12.9 MB` |
| Total | local archive quarantine | `61` | `392` | `144,941,776` | `138.2 MB` |

Why there were two passes:

- Pass 1 moved the original fresh manifest-safe `delete-after-expiry` class.
- After pass 1, one parent/leaf folder became newly visible to the folder-level manifest:
  `qa-artifacts/screenshots/2026-05-27/goal-family-cadence-policy`.
- That folder was also manifest-safe (`0` direct references, no active-plan linkage, no
  security/auth/admin sensitivity, no failed/blocked status, known owner, no keep marker), so pass 2
  archived it under the same approved class-wide cleanup policy.

Post-apply proof:

- Selected folders still under active `qa-artifacts/`: `0`.
- Archived/quarantined folders missing from archive: `0`.
- Archive manifests present: `manifest.json` and `apply-result.json` in both archive roots.
- Final folder manifest has no remaining `delete-after-expiry` class.
- Active `qa-artifacts/` before cleanup: `3134` files / `1034404 KiB`.
- Active `qa-artifacts/` after cleanup: `2742` files / `892000 KiB`.
- Active `qa-artifacts/` file reduction: `392` files.
- Active `qa-artifacts/` disk-size reduction: `142404 KiB`.

Remaining local QA artifact classes after cleanup:

| Class | Folders | Files | Size |
| --- | ---: | ---: | ---: |
| `compress-after-policy` | `90` | `865` | `127.8 MB` |
| `keep-until-plan-archive` | `16` | `826` | `317.9 MB` |
| `promote-to-docs-digest` | `7` | `102` | `28.5 MB` |
| `unknown/manual-review` | `71` | `830` | `382.5 MB` |

Validation evidence:

- `node --check scripts/report-local-artifact-hygiene.mjs`: pass.
- `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs`: pass.
- `npm run artifact:hygiene -- --qa-folder-manifest` before apply: pass.
- `npm run artifact:hygiene -- --qa-folder-manifest --apply-delete-after-expiry-archive`: pass
  twice; both runs used archive quarantine, not permanent deletion.
- `npm run artifact:hygiene -- --qa-folder-manifest` after apply: pass; no
  `delete-after-expiry` class remains.

Boundary:

- No tracked docs evidence was touched.
- No logs or `test-results` were touched.
- No runtime code, frontend UI, Supabase, OpenAI, migrations, browser QA, or live Admin apply was
  touched.
- `.local-artifact-archive/` is gitignored and contains restore manifests for the moved local
  evidence.

Next recommended gate:

- ARCHITECT should review the remaining manifest classes and select one exact next candidate or
  hold. Compression candidates and manual-review candidates need separate owner decisions.

## Artifact Retention Sequencing Reconciliation — 2026-06-22

Status: accepted current advanced state / no revert selected / no evidence mutation during this
checkpoint.

ARCHITECT reconciled a stale no-apply manifest prompt against the current workspace. The no-apply
folder manifest slice already exists, and the workspace also contains the later archive/quarantine
apply support plus prior manifest-safe `delete-after-expiry` quarantine results.

Current tooling state:

- `npm run artifact:hygiene`: dry-run, `mutation:false`, `evidenceMutation:false`,
  `applyModeAvailable:false`; no folder manifest or apply behavior by default.
- `npm run artifact:hygiene -- --qa-folder-manifest`: dry-run, `mutation:false`,
  `evidenceMutation:false`, `applyModeAvailable:false`; reference scan completed across `586`
  text files.
- `scripts/report-local-artifact-hygiene.mjs` contains explicit
  `--apply-delete-after-expiry-archive` support scoped to manifest-safe local `qa-artifacts/`
  folders whose class is exactly `delete-after-expiry`.

Evidence stability during this checkpoint:

| Command | Files before/after | KiB before/after |
| --- | ---: | ---: |
| `npm run artifact:hygiene` | `2750` / `2750` | `915368` / `915368` |
| `npm run artifact:hygiene -- --qa-folder-manifest` | `2750` / `2750` | `915368` / `915368` |

Current folder-manifest classes:

| Class | Folders | Files | Bytes | Size |
| --- | ---: | ---: | ---: | ---: |
| `compress-after-policy` | `90` | `865` | `134049659` | `127.8 MB` |
| `keep-until-plan-archive` | `16` | `826` | `333363138` | `317.9 MB` |
| `promote-to-docs-digest` | `7` | `102` | `29898357` | `28.5 MB` |
| `unknown/manual-review` | `72` | `838` | `424979986` | `405.3 MB` |

Archive/quarantine proof:

- `.local-artifact-archive/qa-artifacts-delete-after-expiry-20260622212530/manifest.json`
- `.local-artifact-archive/qa-artifacts-delete-after-expiry-20260622212530/apply-result.json`
- `.local-artifact-archive/qa-artifacts-delete-after-expiry-20260622212623/manifest.json`
- `.local-artifact-archive/qa-artifacts-delete-after-expiry-20260622212623/apply-result.json`

Decision:

- Accept the current advanced state; do not revert or back out.
- Close the stale no-apply manifest prompt as already satisfied by existing tooling.
- Keep the next gate as
  `ARCHITECT Slice E8: review post-archive QA artifact manifest and select the next evidence-retention gate`.
- E8 is read-only/holding unless it selects one exact future candidate with one owner, one retention
  class, one rollback story, and one validation story.
- No BACKEND/OPS implementation is selected by this reconciliation.

Note: active `qa-artifacts/` counts drifted upward from the immediate post-quarantine closeout
because fresh PT7 QA evidence was created in the local artifact root before this reconciliation
stabilized its before/after checks. The two validation commands above did not change the counts.

## Slice E8 Closeout And E9 Selection — 2026-06-22

Status: complete / post-quarantine manifest reviewed / next gate selected as non-mutating
compression tooling.

Root cause:

- Visible symptom: local `qa-artifacts/` remains large after the manifest-safe `delete-after-expiry`
  class was archived to quarantine.
- Underlying cause: remaining artifact classes are not deletion-ready; the largest actionable class
  is `compress-after-policy`, but current tooling has only E4-specific compression estimate/sample
  support.
- Canonical owner: BACKEND/OPS owns the existing `scripts/report-local-artifact-hygiene.mjs`
  reporter and should extend that reporter rather than adding a parallel artifact tool.

Fresh E8 manifest proof:

- `npm run artifact:hygiene -- --qa-folder-manifest`: passed as dry-run only.
- Mutation flags: `mutation:false`, `evidenceMutation:false`, `applyModeAvailable:false`.
- Reference scan: completed across `586` text files.
- Active `qa-artifacts/` stability during the E8 command: `2751` files / `915500 KiB` before and
  after.
- No `delete-after-expiry` class remains.

Current class summary:

| Class | Folders | Files | Bytes | Size | E8 decision |
| --- | ---: | ---: | ---: | ---: | --- |
| `compress-after-policy` | `92` | `895` | `134986191` | `128.7 MB` | selected next lane, but only through no-apply estimate/sample tooling first |
| `keep-until-plan-archive` | `16` | `826` | `333363138` | `317.9 MB` | blocked until owning active plans/gates archive |
| `promote-to-docs-digest` | `7` | `102` | `29898357` | `28.5 MB` | requires docs/digest promotion decision before local pruning |
| `unknown/manual-review` | `70` | `809` | `424078558` | `404.4 MB` | blocked on manual review; includes recent and sensitive buckets |

Selected candidate:

| Owner | Class | Folders | Files | Bytes | Why selected |
| --- | --- | ---: | ---: | ---: | --- |
| `manual_workout_authoring` | `compress-after-policy` | `56` | `409` | `72475278` | largest single-owner compression-eligible batch with zero direct references |

Representative selected paths:

- `qa-artifacts/screenshots/2026-06-12/manual-setup-direct-create-flow-rerun-qa`
- `qa-artifacts/screenshots/2026-06-11/manual-saved-template-existing-plan-add-qa`
- `qa-artifacts/screenshots/2026-06-15/manual-constructor-selectgroup-rerun-qa`
- `qa-artifacts/screenshots/2026-06-11/manual-copy-paste-ui-slice4-rerun`
- `qa-artifacts/screenshots/2026-06-12/manual-move-workout-ui-qa`

Boundary notes:

- E8 did not select apply compression because the reporter currently returns
  `compressionAllowedByThisTool:false`.
- E8 did not select `keep-until-plan-archive` because those folders are directly referenced from
  active plans or current QA gates.
- E8 did not select `promote-to-docs-digest` because it needs a docs/digest promotion decision, not
  immediate artifact mutation.
- E8 did not select `unknown/manual-review` because it includes recent, sensitive, or ambiguous
  evidence.
- Some selected-owner manifest entries include nested generated residue such as `pw/node_modules`;
  E9 may report those as a separate residue class but must not mutate them.

Selected next gate:

`BACKEND/OPS Slice E9: add non-mutating compression estimate/sample support for the manual-workout QA artifact batch.`

E9 must reuse `scripts/report-local-artifact-hygiene.mjs`, preserve default dry-run behavior, and
write disposable review samples only outside `qa-artifacts/` when explicitly requested. No evidence
apply/compression/deletion is selected yet.

## Slice E9 Closeout And E10 Selection — 2026-06-22

Status: complete / manifest-selected compression estimate and sample support added, no evidence
mutation.

Backend extended the existing `npm run artifact:hygiene` reporter instead of adding a parallel
compression tool. The new generic no-apply path selects current folder-manifest entries by retention
class and inferred owner, then estimates WebP q82 savings for image files. Disposable review samples
are written only when an explicit output directory outside evidence roots is supplied.

Commands added:

- `npm run artifact:hygiene -- --qa-compression-estimate --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring`
- `npm run artifact:hygiene -- --write-qa-compression-samples --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring --sample-output-dir <external-temp-dir>`

Fresh E9 manifest baseline:

- `manual_workout_authoring` + `compress-after-policy`: `51` folders / `364` files /
  `28,984,374` bytes.
- Direct references: `0`.
- Active `qa-artifacts/` remained stable during the final manifest baseline:
  `2763` files / `952772 KiB` before and after.
- Earlier in the E9 run, a parallel local QA process wrote a new
  `primitive-token-admin-capture-pt7-rerun-qa` artifact bucket. Backend stopped, identified the
  external write, waited for the root to stabilize, and then resumed validation from a fresh
  manifest baseline.

Estimate result:

- Selected folders: `51`.
- Unsafe selected folders excluded: `0`.
- Selected bytes: `28,984,374` (`27.6 MB`).
- Image files: `60`.
- Image original bytes: `18,244,721`.
- Estimated WebP q82 bytes: `3,996,918`.
- Estimated saved bytes: `14,247,803`.
- Estimated savings: `78.09%`.
- Dimensions preserved: true.
- Originals unchanged: true.
- Sample output created in estimate-only command: false.

Non-image/generated residue:

- Non-image files: `306`.
- Non-image bytes: `10,739,653`.
- The reporter now classifies and reports non-image residue by extension without mutating it.
- The selected batch includes nested generated residue such as Playwright `pw/node_modules`; this
  should be considered separately from image compression before any apply-capable gate.

Sample-output result:

- Sample output directory:
  `/tmp/hito-manual-workout-qa-compression-samples-20260622194610`.
- Sample files written: `60`.
- Sample output is disposable/non-evidence and outside `qa-artifacts/` and
  `.local-artifact-archive/`.
- Active `qa-artifacts/` remained unchanged during sample output:
  `2763` files / `952772 KiB` before and after.

Validation evidence:

- `node --check scripts/report-local-artifact-hygiene.mjs`: pass.
- `npm exec eslint -- scripts/report-local-artifact-hygiene.mjs`: pass.
- `npm run artifact:hygiene`: pass; default remained dry-run with no folder manifest or compression
  report.
- `npm run artifact:hygiene -- --qa-folder-manifest`: pass after stabilization; no mutation.
- New no-apply estimate command: pass; `mutation:false`, `evidenceMutation:false`,
  `applyModeAvailable:false`.
- New sample-output command: pass; `mutation:"sample_output_only"`, `evidenceMutation:false`, and
  active evidence unchanged.

Boundary:

- No apply compression was added.
- No files under `qa-artifacts/` or `.local-artifact-archive/` were deleted, moved, renamed,
  rewritten, or compressed.
- No tracked docs evidence, logs, `test-results`, runtime code, frontend UI, Supabase, OpenAI,
  migrations, browser QA, or live Admin apply was touched.
- Existing E4-specific estimate/sample and delete-after-expiry archive quarantine modes remain
  available and unchanged.

Selected next gate:

`ARCHITECT Slice E10: review manual-workout QA compression estimate and select the next evidence-retention gate.`

ARCHITECT should decide whether to request QA sample review, select a bounded image-compression
apply gate with rollback, split generated/non-image residue into a separate cleanup lane, or hold.

## Exit Criteria

This track can close when:

- product evolution and major cleanup decisions are captured in a compact digest;
- current docs stay concise and implemented-truth only;
- active plans contain only active execution and current next gates;
- archived plans are compressed enough to be useful history rather than prompt logs;
- admin-imported markdown remains importer-compatible;
- logs/test-results have an accepted dry-run/apply retention policy;
- QA artifacts have an accepted evidence-retention policy, plus reviewed manifest and Product
  thresholds before any deletion/compression/apply gate;
- `docs/work-dashboard.md` remains a reliable side-pane work summary.

## Blockers

- Broad QA artifact deletion/compression remains blocked. Only the selected E13 image-only WebP q82
  apply gate is open, and it must pass fresh pre-apply dry-run, rollback, original-hash, apply-result,
  post-apply count/bytes, and generated/vendor non-mutation proof before reporting success.
- Generated/vendor residue cleanup is not part of E13 and remains a separate future lane.
- Log deletion/apply mode is blocked until a DEVTOOLS retention slice explicitly scopes it.
- Moving admin-imported markdown is blocked unless importer dry-run and backlog validation pass.
- Runtime/frontend/source cleanup is out of scope for this docs/artifact compression track.
