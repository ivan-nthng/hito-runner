# Hito Foundation Workflow And Calendar Checkpoint

Work Item ID: `2026-08-21-hito-foundation-workflow-and-calendar-checkpoint`
Status: in_progress
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

Release freeze — candidate inventory, staged hygiene, commit, and push

## Validation Expectations

Before commit: all repository writers idle; fresh `origin/main` baseline; empty initial index;
stable path/content manifest; exact staging; `git diff --cached --check`; and a final manifest
recheck immediately before commit and push. Do not repair source during the freeze. On unexplained
movement or a failed hygiene gate, restore an empty index without changing working-tree bytes and
return the first incorrect owner to PRODUCT.

## External Boundary

Ivan explicitly authorized commit and push. No deployment, Vercel, Supabase-hosted mutation,
provider call, browser run, release promotion, or production-readiness claim is included.
