# HITO-297 — Release HITO-290 Documentation Reconciliation Safely

- **Work Item ID:** HITO-297
- **Status:** Tracked — In progress
- **Type:** Bug
- **Priority:** Highest
- **Owner:** BACKEND
- **Scope:** Platform release tooling and the exact accepted documentation candidate
- **Primary Area:** Platform
- **Stage:** Implementation
- **Next Recommended Role:** BACKEND
- **Archive Intent:** retain as the compact root-cause, release allowlist and terminal evidence record
- **Canonical Task:** [HITO-297 in Notion](https://app.notion.com/p/3ccfe5f58cf581e4a4c3c0811b3c02aa)

## Task

Release the already accepted HITO-290 documentation reconciliation without restoring obsolete
active-plan files or adding a placeholder. The Admin repository snapshot must represent the
truthful state where `docs/plans/active/` can contain zero current plans.

## User Report

Ivan asked to finish HITO-290 and move directly through commit, push and deployment. HITO-290 is
already terminally accepted as documentation work; its repository bytes remain unreleased because
the application build rejects the empty active-plan directory created by that accepted cleanup.

## Evidence And Observed Behavior

- HITO-290 archived both terminal, unowned files from `docs/plans/active/` into the existing archive
  convention and repaired their inbounds.
- `scripts/admin-backlog-import/sources.json` lists `docs/plans/active` alongside four enduring
  repository source roots but has no empty-allowed semantic.
- Filesystem import, build-time snapshot collection and deployed bundle validation each reject every
  configured source root when its eligible count is zero.
- Therefore the accepted zero-active-plan state fails before application build completion.

## Expected Behavior

One manifest-owned rule marks only `docs/plans/active` as allowed to be empty. The directory must
still exist. Every other configured source root remains required and non-empty. Filesystem import,
bundled snapshot collection and deployed validation consume that same rule; no second source list or
compatibility path is introduced.

## Source Investigation And Root Cause

The cleanup is not the defect. The stale invariant is: "every configured source group always has at
least one current document." An active-plan group is legitimately empty when no planning document is
current. That invariant is duplicated in:

- `scripts/import-repo-work-items-to-admin-backlog.ts`;
- `scripts/lib/admin-repo-work-item-snapshot.mjs`;
- `src/lib/admin-repo-mirror.server.ts`; and
- focused assertions in `scripts/validate-admin-capture-backlog.ts`.

The existing manifest is the one seam that can own required-versus-empty-allowed semantics.

## Delivery Boundary

1. Extend the existing source manifest with one explicit empty-allowed field for `active_plan` only.
2. Make filesystem import, bundled snapshot collection and deployed validation consume it.
3. Prove empty-active succeeds while a missing directory and every required empty root fail closed.
4. Construct one exact candidate from accepted HITO-290 documentation bytes, the already accepted
   HITO-296 constitution slice, its already accepted `agents/marketing-manager.agent.md` direct
   role-card dependency, HITO-297 and this minimal implementation/proof.
5. Obtain independent QA, exact-stage, commit, push and verify Git-backed Vercel readiness plus
   canonical HTTP health and `main == origin/main`.

## What Not To Touch

No product behavior, Calendar, AI plan generation, Supabase schema/data, providers, auth,
migrations, new registry, second snapshot path, fake active plan or restoration of retired evidence.
Do not include unrelated HITO-287/HITO-288/HITO-289 or other untracked records. The accepted
`agents/marketing-manager.agent.md` file is admitted only because the accepted HITO-296 `AGENTS.md`
links it and HITO-290 maps that existing role. Preserve unrelated dirty bytes and keep the Git index
empty until the exact release sweep.

## Validation Expectations

- empty optional active-plan root succeeds in filesystem and bundled modes;
- missing root and every required empty root still fail closed;
- snapshot digest, source paths and stale-row safety remain valid;
- the exact clean overlay builds;
- QA verifies the candidate allowlist and unrelated-byte preservation; and
- release follows the canonical quality-sweep runbook.

## Backend Implementation Receipt — 2026-08-30

The existing source manifest now marks only `docs/plans/active` with `allowEmpty: true`. Filesystem
import, build-time snapshot collection, bundled import and deployed snapshot validation consume that
same manifest value. The directory remains required; every other configured root remains required
and non-empty.

`node --import tsx scripts/validate-admin-capture-backlog.ts` passed the focused contract. It proves
an empty active-plan root in filesystem and bundled modes, rejection of a missing active-plan
directory, rejection of each empty required root in both modes, unchanged snapshot digest/source
path checks and unchanged stale-row safety. No Supabase, provider, browser, Git or deployment action
was performed.

Proposed release candidate allowlist:

- `scripts/admin-backlog-import/sources.json`
- `scripts/import-repo-work-items-to-admin-backlog.ts`
- `scripts/lib/admin-repo-work-item-snapshot.mjs`
- `src/lib/admin-repo-mirror.server.ts`
- `scripts/validate-admin-capture-backlog.ts`
- `docs/tasks/backlog/2026-08-30-hito-release-documentation-reconciliation-safely.md`

## Independent QA Receipt — 2026-08-30

QA passed the full clean overlay at base
`5e06339f5809448f9e8f0a350992ea74717e341b`. The exact 140-path candidate is the union of:

- 130 HITO-290 paths: all 127 `PRECHANGE-SNAPSHOT.json` original paths, both accepted archive
  destinations and the HITO-290 repository record;
- the three accepted HITO-296 constitution paths;
- `agents/marketing-manager.agent.md` as the one direct accepted role-card dependency; and
- the six HITO-297 implementation/evidence paths above.

Candidate digest: `1bd81968ab405d6bbf86668ca308af2b813e82c248e5a4382092a8d5f4edd2bb`.
The clean overlay passed the production client/SSR build, Admin repository snapshot contract,
127/127 recovery hash/mode parity, 39 affected local-link checks with zero broken targets, integrity
over 226 MJS files / 3,703 relative imports / 438 repository documents, and `git diff --check`.
The snapshot truthfully contained zero active plans and nonzero counts for every required root.

Exactly five current dirty paths remain excluded: HITO-287, HITO-288, HITO-289, the HITO-280 record
and the marketing kinetic-icon record. Their hashes did not move during QA. Repository-wide `tsc`,
browser, Supabase, hosted data and release actions were intentionally omitted.

## Rollback

Revert the release commit. Restore HITO-290 material only from its existing external recovery
manifest and only if Product explicitly rejects the accepted cleanup. Never synthesize active-plan
content.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: HITO-297 — Release HITO-290 Documentation Reconciliation Safely
Notion: https://app.notion.com/p/3ccfe5f58cf581e4a4c3c0811b3c02aa

Keep HITO-290 terminal. Implement one manifest-owned optionality rule so docs/plans/active may
truthfully be empty while every other configured root remains required and non-empty. Update
filesystem import, bundled snapshot collection, deployed validation and focused contract tests; do
not create a placeholder, second manifest, compatibility path or unrelated product change.

Preserve all unrelated dirty bytes and the empty Git index. Return an exact changed-path receipt,
focused proof and candidate allowlist before any staging, commit, push or deployment.
```
