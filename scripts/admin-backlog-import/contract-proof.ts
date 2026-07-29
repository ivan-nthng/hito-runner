import assert from "node:assert/strict";
import { findStaleActiveRepoMirrorRows } from "../import-repo-work-items-to-admin-backlog";
import {
  buildExistingRepoMirrorIndex,
  findDuplicateWorkItemIds,
  findExistingRepoMirrorRow,
} from "./identity";
import {
  mapMirroredWorkItemStatusToAdminStatus,
  mapWorkItemStatusToAdminStatus,
  parseCanonicalMarkdown,
  sourceKey,
  workItemIdentityKey,
  type WorkItemStatus,
} from "./markdown";
import { projectActivePlanMarkdown, renderDashboard } from "../hito-work-dashboard.mjs";
import type { Database } from "../../src/lib/supabase/database";

type ExistingRow = Pick<
  Database["public"]["Tables"]["admin_capture_items"]["Row"],
  | "id"
  | "item_type"
  | "status"
  | "priority"
  | "target_role"
  | "title"
  | "note"
  | "page_url"
  | "route"
  | "metadata"
  | "archived_at"
>;

export function assertCanonicalMarkdownWorkItemContract() {
  const ready = parseCanonicalMarkdown(canonicalWorkItemMarkdown());

  assert.deepEqual(
    {
      workItemId: ready.workItemId,
      status: ready.status,
      itemType: ready.itemType,
      priority: ready.priority,
      owner: ready.owner,
      scope: ready.scope,
      archiveIntent: ready.archiveIntent,
      batch: ready.batch,
      frontendLane: ready.frontendLane,
      nextRole: ready.nextRole,
      metadataState: ready.metadataState,
      missing: ready.missingRequiredFields,
      invalid: ready.invalidRequiredFields,
    },
    {
      workItemId: "admin-import-contract",
      status: "ready",
      itemType: "change_request",
      priority: "high",
      owner: "frontend",
      scope: "admin-capture",
      archiveIntent: "retain_in_place",
      batch: "admin-contract",
      frontendLane: "product",
      nextRole: "frontend",
      metadataState: "complete",
      missing: [],
      invalid: [],
    },
  );

  const blocked = parseCanonicalMarkdown(`# Blocked item

## Work Item ID
blocked-provider-access

## Status
blocked

## Type
bug

## Priority
urgent

## Owner
backend

## Scope
admin-capture

## Archive Intent
retain_in_place

## Task
Wait for one external credential.

## Stage
Blocked on verified provider access.
`);
  assert.equal(blocked.metadataState, "complete");
  assert.equal(blocked.nextRole, null);
  assert.equal(mapWorkItemStatusToAdminStatus("blocked"), "new");
  assert.equal(mapWorkItemStatusToAdminStatus("ready"), "ready_for_codex");

  const statusMapping: Record<WorkItemStatus, string> = {
    backlog: "new",
    ready: "ready_for_codex",
    in_progress: "ready_for_codex",
    blocked: "new",
    completed: "done",
    closed: "done",
    archived: "archived",
  };
  for (const [status, adminStatus] of Object.entries(statusMapping)) {
    assert.equal(mapWorkItemStatusToAdminStatus(status as WorkItemStatus), adminStatus);
  }

  const legacy = parseCanonicalMarkdown(`# Legacy item

## Status
in_progress

## Type
change_request

## Priority
medium

## Next Recommended Role
backend

## Task
Legacy source remains visible.

## Stage
BACKEND implementation

## Exact Handoff Prompt
\`\`\`text
ROLE: BACKEND

Keep the legacy source visible.
\`\`\`
`);
  assert.equal(legacy.metadataState, "legacy_debt");
  assert.equal(mapMirroredWorkItemStatusToAdminStatus("in_progress", legacy.metadataState), "new");
  assert.deepEqual(legacy.missingRequiredFields, [
    "Work Item ID",
    "Owner",
    "Scope",
    "Archive Intent",
  ]);

  const invalid = parseCanonicalMarkdown(
    canonicalWorkItemMarkdown().replace("## Status\nready", "## Status\nwaiting"),
  );
  assert.equal(invalid.metadataState, "malformed");
  assert.deepEqual(invalid.invalidRequiredFields, ["Status"]);

  const missingLane = parseCanonicalMarkdown(
    canonicalWorkItemMarkdown().replace("\n## Frontend Lane\nproduct\n", "\n"),
  );
  assert.equal(missingLane.metadataState, "malformed");
  assert.deepEqual(missingLane.missingRequiredFields, ["Frontend Lane"]);

  const invalidId = parseCanonicalMarkdown(
    canonicalWorkItemMarkdown().replace("admin-import-contract", "Admin-Import-Contract"),
  );
  assert.equal(invalidId.workItemId, null);
  assert.equal(invalidId.metadataState, "malformed");
  assert.deepEqual(invalidId.invalidRequiredFields, ["Work Item ID"]);

  const unfencedPrompt = parseCanonicalMarkdown(
    canonicalWorkItemMarkdown().replace(
      "```text\nROLE: FRONTEND\n\nImplement the canonical Admin projection.\n```",
      "ROLE: FRONTEND\n\nImplement the canonical Admin projection.",
    ),
  );
  assert.equal(unfencedPrompt.exactHandoffPrompt, null);
  assert.equal(unfencedPrompt.metadataState, "malformed");
  assert.deepEqual(unfencedPrompt.invalidRequiredFields, ["Exact Handoff Prompt"]);

  assert.deepEqual(
    findDuplicateWorkItemIds([
      { workItemId: "stable-work-item", sourcePath: "docs/tasks/backlog/first.md" },
      { workItemId: "stable-work-item", sourcePath: "docs/plans/active/second.md" },
      { workItemId: null, sourcePath: "docs/tasks/backlog/legacy.md" },
    ]),
    [
      {
        workItemId: "stable-work-item",
        sourcePaths: ["docs/plans/active/second.md", "docs/tasks/backlog/first.md"],
      },
    ],
  );

  const oldMirror = repoMirrorRow({
    workItemId: "stable-work-item",
    sourcePath: "docs/plans/active/stable-work-item.md",
    sourceType: "active_plan",
  });
  const movedSource = {
    workItemId: "stable-work-item",
    sourcePath: "docs/plans/archive/stable-work-item.md",
    sourceType: "archived_plan" as const,
  };
  assert.equal(
    findExistingRepoMirrorRow(buildExistingRepoMirrorIndex([oldMirror]), movedSource)?.id,
    oldMirror.id,
  );

  const movedKeys = new Set([
    sourceKey(movedSource.sourceType, movedSource.sourcePath),
    workItemIdentityKey(movedSource.workItemId, movedSource.sourceType, movedSource.sourcePath),
  ]);
  assert.deepEqual(findStaleActiveRepoMirrorRows([oldMirror], movedKeys), []);
  assert.deepEqual(findStaleActiveRepoMirrorRows([oldMirror], new Set()), [oldMirror]);

  const projectedPlan = projectActivePlanMarkdown({
    filename: "admin-import-contract.md",
    absolutePath: "/tmp/admin-import-contract.md",
    content: canonicalWorkItemMarkdown(),
  });
  assert.deepEqual(
    {
      workItemId: projectedPlan.workItemId,
      status: projectedPlan.status,
      owner: projectedPlan.owner,
      scope: projectedPlan.scope,
      batch: projectedPlan.batch,
      frontendLane: projectedPlan.frontendLane,
      archiveIntent: projectedPlan.archiveIntent,
      metadataState: projectedPlan.metadataState,
    },
    {
      workItemId: "admin-import-contract",
      status: "ready",
      owner: "frontend",
      scope: "admin-capture",
      batch: "admin-contract",
      frontendLane: "product",
      archiveIntent: "retain_in_place",
      metadataState: "canonical metadata",
    },
  );

  const dashboard = renderDashboard({
    generatedAt: "2026-07-24T12:00:00.000Z",
    mode: "dashboard-only",
    adminResults: [],
    activePlans: [projectedPlan],
  });
  assert.match(dashboard, /admin-import-contract/);
  assert.match(dashboard, /frontend \/ admin-capture/);
  assert.match(dashboard, /admin-contract \/ product/);
  assert.match(dashboard, /retain_in_place/);

  const malformedDashboardPlan = projectActivePlanMarkdown({
    filename: "admin-import-contract.md",
    absolutePath: "/tmp/admin-import-contract.md",
    content: canonicalWorkItemMarkdown().replace("\n## Frontend Lane\nproduct\n", "\n"),
  });
  assert.match(malformedDashboardPlan.metadataState, /^malformed metadata: Frontend Lane$/);
}

function canonicalWorkItemMarkdown() {
  return `# Canonical Admin import

## Work Item ID
admin-import-contract

## Status
ready

## Type
change_request

## Priority
high

## Owner
frontend

## Scope
admin-capture

## Archive Intent
retain_in_place

## Task
Adopt the canonical work-item contract.

## Batch
admin-contract

## Frontend Lane
product

## Next Recommended Role
frontend

## Stage
FRONTEND Product implementation

## Exact Handoff Prompt
\`\`\`text
ROLE: FRONTEND

Implement the canonical Admin projection.
\`\`\`
`;
}

function repoMirrorRow(input: {
  workItemId: string;
  sourcePath: string;
  sourceType: string;
}): ExistingRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    item_type: "context_capture",
    status: "ready_for_codex",
    priority: "high",
    target_role: "backend",
    title: "Stable work item",
    note: "Canonical mirror.",
    page_url: `hito://repo/${input.sourcePath}`,
    route: null,
    metadata: {
      imported_from_repo: true,
      work_item_id: input.workItemId,
      source_path: input.sourcePath,
      source_type: input.sourceType,
    },
    archived_at: null,
  };
}
