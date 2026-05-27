# QA Artifact Storage Policy

## Status

Active

## Owner

QA / ARCHITECT

## Last Updated

2026-05-27

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

## Non-Goals

- Do not move routine screenshots into product source folders.
- Do not commit local browser cache, temporary screencapture files, or generated QA scratch files.
- Do not use screenshot storage as a substitute for written QA findings.
