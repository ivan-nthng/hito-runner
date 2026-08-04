# Hito Work Dashboard

Status: deprecated link-continuity tombstone

The only operational queue and lifecycle authority is
[`docs/tasks/backlog/`](tasks/backlog/). Read each canonical item's metadata for current `backlog`,
`ready`, `in_progress`, `blocked`, or terminal truth.

This path is retained only for inbound-link continuity. It does not list work, infer status from
`docs/plans/active/`, mirror Admin capture state, or authorize dispatch. Do not run
`work:dashboard`, `work:dashboard:no-admin`, or `work:dashboard:apply` to establish operational
truth: the current generator still projects active plans and is separate Backend/Admin tooling debt.

Use the non-writing canonical metadata check directly:

```bash
npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000
```
