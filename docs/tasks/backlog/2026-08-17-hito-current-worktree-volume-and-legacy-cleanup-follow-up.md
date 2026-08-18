# Hito Current Worktree Volume And Legacy Cleanup Follow-Up

Work Item ID: `2026-08-17-hito-current-worktree-volume-and-legacy-cleanup-follow-up`
Status: completed
Type: Tracked — architecture audit and remediation map
Priority: high
Owner: ARCHITECT
Epic: platform-and-operations
Evidence From: [Hito Current Worktree Volume And Legacy Remediation Audit](./2026-08-16-hito-current-worktree-volume-and-legacy-remediation-audit.md)
Scope: Fresh read-only inventory and source-proven cleanup ledger for the changed checkout.
Archive Intent: Retain the final inventory, accepted cleanup, and explicit retained boundaries.
Stage: ARCHITECT current inventory and reachability audit complete
Next Recommended Role: PRODUCT

## Final Receipt

- **Outcome:** The stable snapshot contained 453 paths, `+13,887 / -8,501` tracked text, 27,981 untracked text lines, and 11 binary assets / 11,130,023 bytes. The apparent 41,868 added lines included 22,360 backlog lines, 2,745 migration lines, and 186 active-plan lines; size alone did not prove legacy.
- **Accepted cleanup:** Retain the completed deletions of `empty-plan-proof.ts` and `validate-active-plan-schedule-edit-preview.ts` with their Backend owner cluster. Admin plan-container KPI and obsolete outer launcher-card removals were already owner-realized. Route-local `NavCard` cleanup remained conditional on terminal shared-component adoption.
- **Retained truth:** The other 29 proof paths were live; five migrations had no squashed replacement; six new runtime files had consumers; `active-plan-*` modules had 16 importers and remained provenance/materialization seams only; terminal receipts and 11 PNGs remained unique evidence.
- **Sources:** [Backend runtime cleanup](./2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup.md), [Frontend adoption](./2026-08-16-hito-runner-calendar-standalone-frontend-consumer-adoption.md), [Runner Core baseline](./2026-08-17-hito-runner-core-baseline-and-risk-derived-regression-gate.md), and [Navigation Card adoption](./2026-08-15-hito-navigation-card-borderless-contract-and-workout-adoption.md).
- **Validation:** Category totals, lifecycle/owner mapping, proof/runtime reachability, local links, Prettier, whitespace, and `git diff --check` passed for the recorded snapshot. No build, browser, runtime, database, hosted, release, deployment, or Global QA claim was made.
- **Residual boundary:** The later Runner Core release-candidate cleanup audit supersedes this inventory. No new deletion is authorized from this historical snapshot.
