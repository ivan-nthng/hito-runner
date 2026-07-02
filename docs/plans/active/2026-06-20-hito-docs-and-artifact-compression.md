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

## Current Source Of Truth

This plan governs documentation and local QA artifact retention/compression work. It does not grant
standing permission to mutate evidence. Every future apply-capable artifact cleanup needs fresh
manifest proof, reference-scan proof, rollback/quarantine semantics, and one owner/risk/validation
story.

Current policy boundary:

- Local gitignored `qa-artifacts/` is disposable by default only through the approved pragmatic TTL
  policy and canonical tooling.
- Tracked evidence under `docs/process/screenshots` and `docs/tasks/backlog/assets` remains permanent
  by default.
- Promote evidence to docs/digest only when representative evidence is durable product history or
  the only proof of an accepted high-risk decision.
- Folder-level manifests are allowed for routine local-only buckets.
- Generated/vendor residue is not image evidence and must not be bundled with image compression.

Canonical tooling:

- `npm run artifact:hygiene` is the dry-run local artifact reporter.
- `npm run artifact:hygiene -- --qa-folder-manifest` reports folder-level TTL/reference/sensitivity
  classification without mutation.
- Apply-capable archive/quarantine support exists only for manifest-safe cleanup classes and must
  preserve restore manifests.
- QA image compression apply is rollback-protected under `.local-artifact-archive/qa-image-compression/`.

## Accepted E13/E14 Manual-Workout Image Compression

Status: passed. E13 rollback-protected image apply and E14 QA validation are accepted.

Accepted proof:

| Field | Value |
| --- | ---: |
| Active `qa-artifacts/` before E13 apply | `2763` files / `952772 KiB` |
| Active `qa-artifacts/` after E13/E14 | `2763` files / `938900 KiB` |
| Selected PNG originals | `58` |
| Active originals absent after apply | `58/58` |
| Rollback PNG copies outside active `qa-artifacts/` | `58/58` |
| WebP q82 outputs verified | `58/58` |
| Original image bytes | `18,209,211` |
| WebP q82 bytes | `3,978,786` |
| Saved bytes | `14,230,425` / `78.15%` |
| Post-apply manual image candidates | `0` |
| Generated/vendor selected paths | `0` |

Rollback/apply manifests:

- `.local-artifact-archive/qa-image-compression/manual_workout_authoring-webp-q82-2026-06-23T00-09-35-289Z/manifest.json`
- `.local-artifact-archive/qa-image-compression/manual_workout_authoring-webp-q82-2026-06-23T00-09-35-289Z/apply-result.json`

Validation accepted:

- `npm run artifact:hygiene`
- `npm run artifact:hygiene -- --qa-folder-manifest`
- `npm run artifact:hygiene -- --qa-compression-estimate --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring`
- E14 targeted manifest/hash checks for rollback copies, WebP outputs, generated/vendor non-mutation,
  and manifest/result agreement.

## Current Lane Decisions

| Lane | Current proof | Decision |
| --- | --- | --- |
| `manual_workout_authoring` image compression | `0` remaining image candidates | closed; do not repeat image compression |
| `delete-after-expiry` | small value in latest review | hold; too small for a standalone apply gate |
| `compress-after-policy` | multiple owners/classes remain | hold until owner-specific estimate/sample proof exists |
| `devtools` compression candidate | targeted estimate previously hit oversized-image limits | hold until tooling handles or skips oversized images safely |
| `keep-until-plan-archive` | active-plan/direct-reference linked | blocked until owning plans/gates archive |
| `promote-to-docs-digest` | referenced durable evidence candidates | blocked until digest/promotion decision |
| `unknown/manual-review` | admin-sensitive/recent/manual-review evidence remains | blocked on manual review |
| generated/vendor residue | material non-image residue such as nested `pw/node_modules` exists | separate policy/tooling proof required before selection |

## Current Hold

No next docs/artifact cleanup gate is selected.

Resume only when a fresh read-only manifest plus targeted dry-run proves one material same-owner
candidate with one risk class and one validation story. Generated/vendor residue must first have its
own policy/tooling proof. Oversized-image estimate failures must be fixed or explicitly skipped by
the dry-run tooling before any image-compression sample/apply gate is selected.

## Boundaries

Do not mutate in an ARCHITECT holding review:

- evidence;
- runtime code;
- frontend UI;
- backend product behavior;
- Supabase data/schema;
- OpenAI behavior;
- logs;
- `test-results`;
- tracked docs evidence;
- generated output;
- unrelated `qa-artifacts`.

Future apply-capable prompts must require exact manifest paths, before/after counts, hashes or
checksums where available, rollback or restore manifest path, dry-run/apply exactness proof, and
post-apply verification.

## Compression Note

This active plan was compressed on 2026-07-02 under the source-size deletion-first rule. Removed
content was historical D/E slice transcripts, repeated command logs, stale baselines, and superseded
handoff prompts. The accepted E13/E14 proof, current hold trigger, policy boundary, and rollback
manifest paths remain. No evidence, runtime behavior, product code, QA artifacts, scripts, schemas,
Supabase data, logs, or generated output changed.
