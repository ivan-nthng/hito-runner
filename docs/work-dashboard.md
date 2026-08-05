# Hito Work Dashboard

Status: deprecated link-continuity tombstone

The only operational queue and lifecycle authority is
[`docs/tasks/backlog/`](tasks/backlog/). Read each canonical item's metadata for current `backlog`,
`ready`, `in_progress`, `blocked`, or terminal truth.

This path is retained only for inbound-link continuity. It does not list work, infer status from
supporting documents, mirror Admin capture state, or authorize dispatch.

Use the non-writing canonical importer check directly:

```bash
npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000
```
