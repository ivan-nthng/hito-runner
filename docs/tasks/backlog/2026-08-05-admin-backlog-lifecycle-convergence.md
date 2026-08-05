# Admin Backlog Lifecycle Convergence

## Work Item ID

2026-08-05-admin-backlog-lifecycle-convergence

## Status

completed

## Type

change_request

## Priority

high

## Owner

backend

## Scope

admin-tooling

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Retire the deprecated work-dashboard projection and make the canonical Markdown backlog the only
repository source that can produce executable Admin lifecycle.

## Stage

Completed Backend/Admin tooling cleanup and release, Slice 8A.

## Next Recommended Role

backend

## Exact Handoff Prompt

```text
ROLE: BACKEND

Retire the deprecated Admin dashboard execution path while preserving the canonical backlog importer,
read-only supporting-document mirrors, and Admin authorization/privacy contracts.
```

## Execution Preflight

- Evidence: `package.json` exposes three deprecated dashboard commands, their generator projects
  active plans, and its only code consumer is the Admin importer contract proof.
- Canonical owner: the existing repo-to-Admin importer and its contract proof.
- Outcome: remove the dashboard tooling and make non-backlog mirrors non-dispatching while retaining
  their read-only historical metadata.
- Proof: reachability, importer dry run, duplicate identity and metadata validation, Admin read-only
  contract, build/runtime, and independent review.
- Stop: retain the path if a current Admin consumer or automation requires dashboard projection.

## Parent

[Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)

## Completion Receipt

- Root cause: supporting documents could map nonterminal metadata into dispatchable Admin work even
  though the canonical dashboard projection was deprecated.
- Outcome: `backlog_doc` is now the sole nonterminal executable lifecycle source; supporting
  documents remain read-only historical metadata and map to `new` until terminal.
- Deleted: the dashboard generator and all three `work:dashboard*` aliases.
- Proof: importer contract and Admin authorization/privacy validators, local database suite,
  production build/output integrity, linked Supabase parity, source reachability scan, and
  independent QA passed. The local legacy storage-bucket drift is outside this slice's changed
  Admin backlog contract and remains a separate environment-cleanup boundary.
