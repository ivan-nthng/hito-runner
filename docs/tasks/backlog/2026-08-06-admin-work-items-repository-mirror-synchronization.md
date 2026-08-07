# Admin Work Items Repository Mirror Synchronization

## Work Item ID

2026-08-06-admin-work-items-repository-mirror-synchronization

## Status

completed

## Type

bug

## Priority

high

## Owner

backend

## Scope

admin-work-items-repository-mirror

## Archive Intent

retain_in_place

## Task

Restore automatic local Admin Work Items synchronization from canonical repository Markdown while
keeping Quick notes as separate Supabase-owned records.

## Stage

Backend local synchronization completed on `main` after deletion-first recovery and full local
revalidation; deployed acceptance remains tracked only by the blocked deployment child.

## Next Recommended Role

backend

## Exact Handoff Prompt

```text
ROLE: BACKEND

Resume the deployed repository-mirror child only when legitimate production Admin authentication is
available; do not reopen this accepted local synchronization slice.
```

## Parent

[Admin Capture Bug Stack](2026-06-13-admin-capture-bug-stack.md)

## Execution Preflight

- Evidence: the interrupted implementation made authenticated reads invoke the importer, but a
  deterministic fake-client replay proved that an unavailable required repository root was treated
  as an empty scan and could archive every existing mirror; an overlapping dry-run also changed the
  in-flight live run's archive behavior through module-global state.
- Canonical owner: the existing repository importer and authenticated Admin capture read boundary.
- Outcome: authenticated Admin reads synchronize the existing mirror with invocation-local state,
  bounded waiting, and no implicit stale archive; malformed sources remain visible as read-only
  diagnostic rows; duplicate identities and missing required roots fail closed; Quick notes remain
  untouched.
- Proof: importer discriminator, automatic create/update readback, malformed-source visibility,
  Quick note persistence/delete, auth isolation, local persistence, build/runtime, and independent
  QA.

## Current Boundary

The local slice passed deterministic and live-Supabase proof from a clean-main worktree: an
authenticated Admin read synchronizes 226 valid Markdown sources, three malformed documents remain
visible, missing, empty, and README-only roots fail before projection access, and both Work Item ID
and source-path identity collisions fail closed. Automatic stale archive stays disabled, repository
rows remain read-only, publishable RLS is denied, and Quick Note create/read/update/delete remains
separate. The production and Vercel-shaped builds contain the private snapshot and do not expose it
in public assets. The deployed artifact and hosted projection remain owned only by the linked
deployment child and do not reopen this completed local slice.

## Recovery Closure Receipts

- The reusable validator no longer contains a hosted login probe, Admin cookie minting, session
  secret access, release-specific credential bridge, or self-source acceptance assertions. Admin
  authentication remains owned only by the canonical login/session implementation and validator.
- Deterministic source-mode, auth-before-sync, timeout, missing/empty-root, bundled-root,
  duplicate-identity, insert-conflict, row-limit, malformed-diagnostic, and explicit stale-policy
  checks passed.
- Live local Supabase synchronization, generation fencing, repository read-only behavior, Quick Note
  CRUD, publishable RLS denial, disposable cleanup, Backend local-db/release matrices, production
  build, Vercel build, private build-integrity, and linked migration parity passed.
- Independent architecture, persistence, and security reviews found no remaining source defect after
  the release-specific hosted harness and other duplicate proof paths were deleted.
