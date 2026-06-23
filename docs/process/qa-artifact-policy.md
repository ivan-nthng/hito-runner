# QA Artifact Storage Policy

## Status

Active

## Owner

QA / ARCHITECT

## Last Updated

2026-06-22

## Purpose

Keep routine QA screenshots and visual-review artifacts out of normal product commits while preserving a clear promotion path for screenshots that are intentionally part of permanent release evidence.

## Default Local Artifact Root

Routine QA screenshots must be saved under:

```text
qa-artifacts/
```

This directory is intentionally gitignored.

## Screenshot Folder Convention

Use one task-scoped folder per QA pass:

```text
qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/
```

Examples:

```text
qa-artifacts/screenshots/2026-05-27/ai-first-plan-blueprint-visual-review/
qa-artifacts/screenshots/2026-05-27/hito-ds-colors-icons/
```

## Screenshot Naming Convention

Prefer short, semantic filenames that describe the screen or proof point:

```text
calendar-overview.png
workout-threshold-detail.png
workout-long-run-detail.png
mobile-foundations.png
clipboard-semantic-copy.png
```

## QA Report References

Routine QA reports should reference local screenshots textually, not as committed markdown image links:

```text
Local screenshots:
qa-artifacts/screenshots/2026-05-27/hito-ds-colors-icons/
```

Do not commit `qa-artifacts/` by default.

## Promoting Permanent Release Evidence

Only promote selected screenshots into the repo when the task explicitly needs permanent evidence, for example a release-readiness packet, Running Coach approval artifact, or high-risk visual regression proof.

Promotion destination:

```text
docs/process/screenshots/<task-slug>/
```

When promoting screenshots, the QA report must say why those files are permanent release evidence instead of routine local artifacts.

## Existing Evidence

Existing committed screenshots under `docs/process/screenshots/` are preserved. Moving or deleting existing evidence requires a separate Architect cleanup slice.

## Evidence Retention Inventory — E1 Accepted 2026-06-22

QA Slice E1 completed as a read-only evidence-retention inventory. No evidence was deleted,
compressed, moved, archived, renamed, rewritten, or created.

| Surface | Files | Bytes | Size | Notes |
| --- | ---: | ---: | ---: | --- |
| `qa-artifacts/` | `3071` | `984054807` | `938.47 MiB` | local protected QA evidence |
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

## Retention Classes

Future evidence cleanup must classify every candidate file or folder into exactly one class before
any apply-capable action is proposed:

- `keep-permanent`: durable release, doctrine, regression, or high-risk acceptance evidence.
- `keep-until-plan-archive`: temporary slice evidence that remains useful while the owning plan or
  QA gate is active.
- `promote-to-docs-digest`: representative evidence that should be preserved in tracked docs or a
  compact digest before local copies are considered disposable.
- `compress-after-policy`: evidence that may be compressed only after Product approves exact
  thresholds, formats, quality constraints, and rollback expectations.
- `delete-after-expiry`: evidence that may be deleted only after Product approves exact age/owner
  thresholds and the dry-run manifest is reviewed.
- `unknown/manual-review`: evidence that cannot be classified automatically and must not be mutated
  until a human review resolves ownership and retention.

## Pragmatic Local QA Artifact Retention — 2026-06-22

Product approved a pragmatic retention reset for local gitignored `qa-artifacts/`. This section
applies only to local evidence under `qa-artifacts/`; it does not apply to tracked evidence under
`docs/process/screenshots` or `docs/tasks/backlog/assets`.

The default posture for local `qa-artifacts/` is now disposable after a short retention window,
unless a folder is protected by references, active plan linkage, sensitivity, failure status,
unknown ownership, or an explicit keep marker. This approval does not authorize immediate deletion,
compression, movement, archive, rename, rewrite, regeneration, or any apply-capable evidence
cleanup. A folder-level manifest and reference scan are still required before any future apply
command exists or runs.

| Class | Local `qa-artifacts/` eligibility threshold |
| --- | --- |
| `delete-after-expiry` | Folders are eligible after `14` days when local-only, directly unreferenced across current docs, active plans, archived plans, task docs, QA reports, changelog, and product-history digest; not linked to an active/in-progress plan; not security/auth/admin-sensitive; not failed/blocked QA evidence; not unknown ownership; and not manually marked keep. |
| `compress-after-policy` | Folders are eligible after `7` days when deletion is not yet allowed but the folder is routine visual/debug evidence, local-only, and directly unreferenced. |
| `keep-until-plan-archive` | Required when local evidence is directly referenced by an active plan or current QA gate. |
| `keep-permanent` | Default for tracked `docs/process/screenshots` evidence; not a default for local gitignored `qa-artifacts/`. |
| `promote-to-docs-digest` | Use only for representative evidence referenced as durable product history or the only proof of an accepted high-risk decision. |
| `unknown/manual-review` | Required for security/auth/admin evidence, failed or blocked QA evidence, unknown ownership, ambiguous folder purpose, or any folder whose safety class cannot be proved automatically. |

Additional Product rules:

- Folder-level manifest classification is allowed for routine local-only evidence buckets; per-file
  manual review is not required for every routine screenshot when the folder-level owner and
  reference scan are clear.
- Tracked docs evidence remains permanent by default: `docs/process/screenshots` is
  `keep-permanent`, and unreferenced `docs/tasks/backlog/assets` may be deleted only after manual
  review.
- Representative local screenshots must be promoted to docs or digest before local pruning only
  when they are referenced as durable product history or are the only durable proof for an accepted
  high-risk QA/product decision.
- Local evidence linked to an active/in-progress plan remains `keep-until-plan-archive`.
- Security/auth/admin evidence, failed or blocked QA evidence, unknown ownership, and manually marked
  keep folders remain `unknown/manual-review` or explicitly protected.
- Routine compression may use WebP preserving dimensions at default quality `82` when a later
  apply-capable slice is explicitly approved.
- Pixel-sensitive or visual-sensitive Hito DS evidence should remain `keep-permanent`,
  `unknown/manual-review`, or use lossless compression only.
- Compression visual acceptability still requires readable text at `100%`, visible layout/overflow
  evidence, and sample review before any broad apply-capable slice.

## Apply-Proof Requirements

No deletion, compression, archive, move, rename, or rewrite is approved by E1 or the 2026-06-22
Product local-retention decision. Before any future apply-capable QA evidence cleanup, the
responsible slice must provide all of the following:

- A full path manifest for every candidate file or folder.
- File count and byte count before the proposed action.
- Reference scan across current docs, active plans, archived plans, task docs, QA reports, changelog,
  and product-history digest.
- Retention classification and reason per file or folder.
- List of screenshots or assets preserved, promoted, or intentionally excluded from mutation.
- Rollback/recovery note that distinguishes tracked recoverability from local-only evidence.
- Product approval for expiry, compression, deletion, format, and quality thresholds.
- Reviewed dry-run output before any apply-capable command exists or runs.

Until those requirements are satisfied, `qa-artifacts/` remains a policy-gated local evidence root,
and `docs/process/screenshots` plus `docs/tasks/backlog/assets` remain tracked evidence roots outside
this local TTL policy.

## Non-Goals

- Do not move routine screenshots into product source folders.
- Do not commit local browser cache, temporary screencapture files, or generated QA scratch files.
- Do not use screenshot storage as a substitute for written QA findings.
- Do not delete, compress, archive, move, rename, rewrite, or regenerate QA evidence without the
  apply-proof requirements above and explicit Product approval for thresholds.
