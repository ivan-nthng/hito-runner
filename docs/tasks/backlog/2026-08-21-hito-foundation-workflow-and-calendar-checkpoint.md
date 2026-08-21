# Hito Foundation Workflow And Calendar Checkpoint

Work Item ID: `2026-08-21-hito-foundation-workflow-and-calendar-checkpoint`
Status: completed
Type: Release
Priority: highest
Owner: PRODUCT
Epic: platform-and-operations
Evidence From: [Hito Unified Workout Authoring Contract And Editor Consolidation](./2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md), [Hito Runner Calendar Mutation Owner Extraction](./2026-08-21-hito-runner-calendar-mutation-owner-extraction.md)

## Scope

Create one Git checkpoint for the admitted working-tree outcome: the Phase-0 agent/environment
operating model, the accepted unified WorkoutDocument authoring work, and the accepted Calendar
query/mutation domain boundary. The checkpoint includes their focused validators, task receipts, and
the exact Notion/operating-model documentation required to resume the next serial phase.

## Archive Intent

Retain as the truthful Git receipt for this checkpoint. It is not a production release, deployment,
hosted parity claim, or Global QA acceptance.

## Admitted Outcome

- HITO-224 unified authoring and focused browser acceptance are terminal.
- HITO-230 Calendar mutation ownership and independent persistence acceptance are terminal.
- Phase-0 operating documentation and local Supabase lifecycle work are included as their accepted
  repository outcome.
- The staged inventory may contain only current files attributable to those accepted slices and
  their direct shared integration/documentation dependencies. HITO-219 recovery, HITO-216 adaptive
  training, hosted data, providers, deployment configuration, and any new runtime output are not
  admitted by this checkpoint.

## Stage

Completed checkpoint publication

## Validation Expectations

Before commit: all repository writers idle; fresh `origin/main` baseline; empty initial index;
stable path/content manifest; exact staging; `git diff --cached --check`; and a final manifest
recheck immediately before commit and push. Do not repair source during the freeze. On unexplained
movement or a failed hygiene gate, restore an empty index without changing working-tree bytes and
return the first incorrect owner to PRODUCT.

## External Boundary

Ivan explicitly authorized commit and push. No deployment, Vercel, Supabase-hosted mutation,
provider call, browser run, release promotion, or production-readiness claim is included.

## Checkpoint Receipt — 2026-08-21

- Branch: `codex/hito-foundation-workflow-calendar-checkpoint`
- Base: `origin/main` and the pre-freeze `HEAD` were both
  `9143336bf55905f6009f4e4cd53dd64c456ce89f`.
- Candidate: 107 exact staged paths; staged path-manifest SHA-256
  `8d128ae7e60f8d6b387a0e27c9bba53abf0b00207e69dbfee9409b3bb8d0578d`; index tree
  `b1a79a1076739064b202c2f8fc52b16868a19d4a`.
- Hygiene: no unstaged paths before commit; `git diff --cached --check` passed.
- Commit: `c7367e229e653ba791f162874e7acd53daf60023`
  (`feat(runner): establish unified workout foundation`).
- Push: branch created at `origin/codex/hito-foundation-workflow-calendar-checkpoint`.

No deployment, hosted mutation, provider call, release promotion, or production-readiness claim was
made.
