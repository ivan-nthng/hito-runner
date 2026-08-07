# Admin Work Items Deployed Repository Mirror Delivery

## Work Item ID

2026-08-06-admin-work-items-deployed-repository-mirror-delivery

## Status

blocked

## Type

bug

## Priority

high

## Owner

backend

## Scope

admin-work-items-deployed-repository-mirror

## Archive Intent

retain_in_place

## Task

Deliver the canonical Markdown repository mirror automatically through authenticated Admin Work
Items reads in local and deployed runtimes, without a user-run importer command.

## Stage

Backend main-only recovery passed local, persistence, security, production-build, and Vercel-artifact
validation. Legitimate authenticated hosted projection acceptance remains unrun and is the only
open gate for this child.

## Next Recommended Role

backend

## Exact Handoff Prompt

```text
ROLE: BACKEND

Resume only with a legitimate production Admin login or existing trusted Supabase-admin session,
run the real-login hosted acceptance, then close and redeploy this exact lifecycle state.
```

## Parent

[Admin Capture Bug Stack](2026-06-13-admin-capture-bug-stack.md)

## Depends On

[Admin Work Items Repository Mirror Synchronization](2026-08-06-admin-work-items-repository-mirror-synchronization.md)

## Execution Preflight

- Task and bounded outcome: release the existing Markdown-to-`admin_capture_items` projection so an
  authenticated Admin read refreshes canonical repository work items both locally and on Vercel.
- Evidence before code: the clean production build emits only the Nitro function and public static
  assets; canonical `docs/**` sources are absent from the deployed server artifact, while the
  interrupted read seam enables synchronization only when both request and Supabase URLs are
  loopback. Therefore deployed reads cannot reach or refresh their canonical source.
- Canonical owner: Backend importer/read orchestration plus the existing Vercel function packaging
  and build-integrity validator.
- Smallest root-cause outcome: package only approved Markdown roots inside the private server
  function, resolve that source safely at runtime, and reuse the existing authenticated idempotent
  importer with implicit stale archive disabled. Fence every row refresh by the private bundle's
  build generation so an older in-flight deployment cannot overwrite a newer projection. No second
  registry or hosted runner mutation is introduced.
- Required proof: scope isolation; missing-root, malformed-source, duplicate-ID, timeout and
  same-snapshot and rolling old/new concurrency discriminators; Quick Note preservation; local
  Supabase readback; production build artifact inspection; authenticated deployed read/projection
  readback; independent source, persistence, deployment, and QA review; exact commit, push, and
  deployment evidence.
- Stop condition: any schema or RLS change beyond the admitted repo-identity unique indexes,
  unrelated hosted-data mutation, source that cannot be packaged privately, or conflict with
  concurrent non-Backend work returns to the owning boundary instead of being absorbed here.

## Definition Of Done

- A new or changed valid canonical Markdown work item appears automatically in authenticated local
  and deployed Admin Work Items.
- Repository-derived rows remain read-only idempotent projections; Markdown remains their sole
  editable source and automatic reads never archive stale rows.
- Quick Notes remain separate Supabase-owned editable inbox records.
- Missing required roots fail before projection mutation, malformed documents remain visible
  diagnostics without hiding valid work, and duplicate IDs fail closed.
- The isolated release is committed, pushed, deployed, independently reviewed, and this work item is
  truthfully closed with exact validation receipts.

## Approval Policy

Routine local inspection, implementation, fixtures, validation, subagents, and the explicit `main`
commit/push proceed under the assignment's standing authorization. Manual deployment, alias changes,
credential extraction, and hosted projection or other production-data mutation remain unauthorized.

## Blocker And Closure Receipts

- The superseded attempt `107159193aa35156b97f1b96f919369f879caf94` was pushed on the temporary
  Backend branch and manually deployed as `dpl_4oceFmFBE6mL2ndAXgWcjNTDfWCs`. Its hosted projection
  evidence is invalid because its release-specific validator minted an Admin session cookie instead
  of proving the canonical login boundary.
- Hosted migration parity and both repository-identity unique indexes are present. The hosted
  baseline remains 172 repository rows, zero generated-snapshot rows, zero duplicate identities,
  and no deployment-child projection because no legitimate authenticated production Admin read has
  occurred.
- Unauthenticated production access redirects to `/admin/login` without changing the projection.
  Neither available browser exposed a protected credential handoff and neither had an authenticated
  Admin session; passwords were not requested through chat, read from browser storage, or bypassed.
- The main-only recovery deletes that entire hosted harness, every secret/cookie acceptance bypass,
  the release-specific credential bridge, duplicate in-memory generation-fence harness, and
  self-source assertions. Hosted acceptance may now occur only through the normal Admin login and
  authenticated product read, outside this credential-free release.
- Deterministic, local live-Supabase, RLS, Quick Note CRUD, missing/empty-root, malformed-source,
  two-axis duplicate-identity, insert-conflict, row-limit, real local PostgREST generation fencing,
  production and Vercel build-integrity, migration parity, and independent reviews passed. The
  required authenticated production read, 226-row projection readback, unchanged second read, and
  final `completed` lifecycle remain unrun; this item is `blocked`, not accepted or closed.
