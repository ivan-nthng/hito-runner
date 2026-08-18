import { createHash, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  buildStaleRepoMirrorMetadata,
  findStaleActiveRepoMirrorRows,
  synchronizeRepoWorkItems,
  ADMIN_REPO_WORK_ITEM_SOURCE_ROOTS,
  type AdminRepoWorkItemDocument,
} from "./import-repo-work-items-to-admin-backlog";
import { countRepoMirrorIdentityDuplicates } from "./admin-backlog-import/identity";
import { collectAdminRepoWorkItemSnapshot } from "./lib/admin-repo-work-item-snapshot.mjs";
import { assertCanonicalMarkdownWorkItemContract } from "./admin-backlog-import/contract-proof";
import { parseCanonicalMarkdown } from "./admin-backlog-import/markdown";
import {
  appendAdminCaptureItemNoteForDependencies,
  createAdminCaptureItemForDependencies,
  createSupabaseAdminCaptureRepository,
  deleteAdminCaptureQuickNoteForDependencies,
  getAdminCaptureCopyPromptForDependencies,
  getAdminCaptureItemForDependencies,
  listAdminCaptureBacklogForDependencies,
  type AdminCaptureDependencies,
  type AdminCaptureBacklogRead,
  type AdminCaptureRepository,
  type AdminCaptureRow,
} from "../src/lib/admin-capture.server";
import { updateAdminCaptureItemTriageForDependencies } from "../src/lib/admin-capture.server";
import {
  adminRepoWorkItemEpicSlugs,
  getAdminRepoWorkItemMetadata,
} from "../src/lib/admin-work-items";
import { resolveAdminRepoMirrorSourceMode } from "../src/lib/admin-repo-mirror.server";
import {
  adminCaptureActiveStatuses,
  adminCaptureStatuses,
  type AdminCaptureListInput,
  type AdminCaptureResult,
} from "../src/lib/admin-capture";
import type { Database, Json } from "../src/lib/supabase/database";

type ItemInsert = Database["public"]["Tables"]["admin_capture_items"]["Insert"];
type ItemUpdate = Database["public"]["Tables"]["admin_capture_items"]["Update"];
type AdminCaptureItemRow = Database["public"]["Tables"]["admin_capture_items"]["Row"];
type LiveProbeStep = {
  name: string;
  ok: boolean;
  detail: string;
};

class MemoryAdminCaptureRepository implements AdminCaptureRepository {
  #items = new Map<string, AdminCaptureRow>();
  listBacklogCalls = 0;

  async createItem(input: ItemInsert): Promise<AdminCaptureRow> {
    const now = "2026-05-28T12:00:00.000Z";
    const row: AdminCaptureRow = {
      id: input.id ?? randomUUID(),
      item_type: input.item_type,
      status: input.status ?? "new",
      priority: input.priority ?? null,
      target_role: input.target_role ?? null,
      title: input.title ?? null,
      note: input.note,
      page_url: input.page_url,
      route: input.route ?? null,
      created_by_user_id: input.created_by_user_id,
      created_by_label: input.created_by_label ?? null,
      viewport_width: input.viewport_width ?? null,
      viewport_height: input.viewport_height ?? null,
      element_text: input.element_text ?? null,
      selector: input.selector ?? null,
      dom_path: input.dom_path ?? null,
      nearby_heading: input.nearby_heading ?? null,
      bounding_rect: input.bounding_rect ?? null,
      metadata: input.metadata ?? {},
      created_at: input.created_at ?? now,
      updated_at: input.updated_at ?? now,
      archived_at: input.archived_at ?? null,
    };

    this.#items.set(row.id, row);

    return row;
  }

  async listBacklog(input: AdminCaptureListInput): Promise<AdminCaptureBacklogRead> {
    this.listBacklogCalls += 1;
    const search = input.search?.toLowerCase() ?? null;
    const matchingRows = Array.from(this.#items.values())
      .filter((item) => !input.itemType || item.item_type === input.itemType)
      .filter((item) => !input.priority || item.priority === input.priority)
      .filter((item) => !input.targetRole || item.target_role === input.targetRole)
      .filter((item) => {
        if (!input.sourceGroup || input.sourceGroup === "all_work") {
          return true;
        }

        return (
          typeof item.metadata === "object" &&
          item.metadata !== null &&
          !Array.isArray(item.metadata) &&
          item.metadata.source_group === input.sourceGroup
        );
      })
      .filter((item) => {
        if (!search) {
          return true;
        }

        return [item.title, item.note, item.route, item.page_url, item.element_text]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search));
      });
    const statusCounts = Object.fromEntries(
      adminCaptureStatuses.map((status) => [
        status,
        matchingRows.filter((item) => item.status === status).length,
      ]),
    ) as AdminCaptureBacklogRead["statusCounts"];
    const rows = matchingRows
      .filter((item) =>
        input.status === "all"
          ? adminCaptureActiveStatuses.some((status) => status === item.status)
          : item.status === input.status,
      )
      .filter((item) => input.includeArchived || input.status === "archived" || !item.archived_at)
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
      .slice(0, input.limit);

    return { rows, statusCounts };
  }

  async getItem(id: string): Promise<AdminCaptureRow | null> {
    return this.#items.get(id) ?? null;
  }

  async updateItem(id: string, patch: ItemUpdate): Promise<AdminCaptureRow | null> {
    const existing = this.#items.get(id);

    if (!existing) {
      return null;
    }

    const updated: AdminCaptureRow = {
      ...existing,
      archived_at: patch.archived_at === undefined ? existing.archived_at : patch.archived_at,
      item_type: patch.item_type ?? existing.item_type,
      metadata: patch.metadata ?? existing.metadata,
      note: patch.note ?? existing.note,
      priority: patch.priority === undefined ? existing.priority : patch.priority,
      status: patch.status ?? existing.status,
      target_role: patch.target_role === undefined ? existing.target_role : patch.target_role,
      title: patch.title === undefined ? existing.title : patch.title,
      updated_at: "2026-05-28T12:05:00.000Z",
    };

    this.#items.set(id, updated);

    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.#items.delete(id);
  }
}

class FailingAdminCaptureReadRepository extends MemoryAdminCaptureRepository {
  override async listBacklog(_input: AdminCaptureListInput): Promise<AdminCaptureBacklogRead> {
    throw Object.assign(new Error("Forced backlog read failure."), { code: "PGRST_TEST_LIST" });
  }
}

const adminDependencies = (repository: AdminCaptureRepository): AdminCaptureDependencies => ({
  adminAccess: async () => ({
    ok: true,
    admin: {
      adminUserId: "hito-admin",
      adminLabel: "admin",
      provider: "admin",
      sessionSource: "deployed_password",
      runtimeClass: "deployed",
      capabilities: {
        adminAnalytics: true,
        adminCapture: true,
        localTestAccounts: false,
      },
    },
  }),
  repository,
  now: () => new Date("2026-05-28T12:00:00.000Z"),
});

const nonAdminDependencies = (repository: AdminCaptureRepository): AdminCaptureDependencies => ({
  adminAccess: async () => ({
    ok: false,
    reason: "admin_required",
    message: "This admin tool is available only to admin sessions.",
  }),
  repository,
  now: () => new Date("2026-05-28T12:00:00.000Z"),
});

const args = new Set(process.argv.slice(2));

if (args.has("--live-supabase")) {
  await runLiveSupabaseProbe();
} else {
  await runDeterministicHarness();
}

async function runDeterministicHarness() {
  assertCanonicalMarkdownWorkItemContract();
  const epicCorpus = assertCanonicalBacklogEpicCorpus();
  await assertCanonicalBacklogReadContract();
  await assertSingleRouteBacklogRead();
  assertRepoMirrorSourceModeBoundary();
  await assertBundledRepoMirrorSourceContract();
  await assertRepoMirrorSynchronizationBoundary();
  await assertRepoMirrorSynchronizationSafety();

  const repository = new MemoryAdminCaptureRepository();
  const admin = adminDependencies(repository);
  const nonAdmin = nonAdminDependencies(repository);

  const created = await mustOk(
    createAdminCaptureItemForDependencies(admin, {
      itemType: "bug",
      title: "Workout detail button wraps badly",
      note: "The save button wraps awkwardly on narrow screens.",
      pageUrl: "http://localhost:3000/workout/2026-05-28",
      route: "/workout/2026-05-28",
      viewportWidth: 390,
      viewportHeight: 844,
      elementText: "Save workout",
      selector: "[data-testid='save-workout']",
      domPath: "main > section > button",
      nearbyHeading: "Log result",
      boundingRect: { x: 12, y: 640, width: 180, height: 44 },
      targetRole: "frontend",
      priority: "high",
      metadata: {
        source: "validation_script",
        safeLabel: "calendar-save-button",
        work_item_epic: "marketing-and-growth",
        sessionToken: "super-secret-session-token",
        api_key: "super-secret-api-key",
        authHeader: "Bearer abc.def.ghi",
      },
    }),
  );

  assert.equal(created.item.status, "new");
  assert.equal(created.item.promptReady, true);
  assert.equal((created.item.metadata as Record<string, unknown>).work_item_epic, undefined);

  const nonAdminList = await listAdminCaptureBacklogForDependencies(nonAdmin, {
    status: "all",
    sourceGroup: "all_work",
    includeArchived: true,
    limit: 50,
  });
  assert.equal(nonAdminList.ok, false);
  if (!nonAdminList.ok) {
    assert.equal(nonAdminList.reason, "admin_required");
  }

  const unavailableList = await listAdminCaptureBacklogForDependencies(
    { ...admin, repository: null },
    {
      status: "all",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 50,
    },
  );
  assert.equal(unavailableList.ok, false);
  if (!unavailableList.ok) {
    assert.equal(unavailableList.reason, "supabase_admin_unavailable");
  }

  const failedRead = await captureConsoleErrors(() =>
    listAdminCaptureBacklogForDependencies(
      adminDependencies(new FailingAdminCaptureReadRepository()),
      {
        status: "all",
        sourceGroup: "all_work",
        includeArchived: false,
        limit: 50,
      },
    ),
  );
  const failedList = failedRead.result;
  assert.equal(failedList.ok, false);
  if (!failedList.ok) {
    assert.equal(failedList.reason, "capture_load_failed");
  }
  assert.deepEqual(failedRead.messages, [
    '[admin-capture] capture_load_failed {"stage":"repository_list","code":"PGRST_TEST_LIST"}',
  ]);

  const nonAdminDelete = await deleteAdminCaptureQuickNoteForDependencies(nonAdmin, {
    id: created.item.id,
  });
  assert.equal(nonAdminDelete.ok, false);
  if (!nonAdminDelete.ok) {
    assert.equal(nonAdminDelete.reason, "admin_required");
  }

  const listed = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "new",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 50,
    }),
  );
  assert.equal(listed.view.items.length, 1);

  const loaded = await mustOk(getAdminCaptureItemForDependencies(admin, { id: created.item.id }));
  assert.equal(loaded.item.id, created.item.id);

  const triaged = await mustOk(
    updateAdminCaptureItemTriageForDependencies(admin, {
      id: created.item.id,
      status: "ready_for_codex",
      targetRole: "frontend",
      priority: "urgent",
    }),
  );
  assert.equal(triaged.item.status, "ready_for_codex");
  assert.equal(triaged.item.priority, "urgent");

  const appended = await mustOk(
    appendAdminCaptureItemNoteForDependencies(admin, {
      id: created.item.id,
      note: "Please keep this within existing Hito DS button/layout patterns.",
    }),
  );
  assert.match(appended.item.note, /Hito DS/);

  const prompt = await mustOk(
    getAdminCaptureCopyPromptForDependencies(admin, { id: created.item.id }),
  );
  assert.match(prompt.prompt.prompt, /ROLE: FRONTEND/);
  assert.match(prompt.prompt.prompt, /reuse Hito DS primitives/);
  assert.match(prompt.prompt.prompt, /built-in Codex browser first/);
  assert.match(prompt.prompt.prompt, /safeLabel: calendar-save-button/);
  assert.match(prompt.prompt.prompt, /sessionToken: \[redacted\]/);
  assert.match(prompt.prompt.prompt, /api_key: \[redacted\]/);
  assert.match(prompt.prompt.prompt, /authHeader: \[redacted\]/);
  assert.doesNotMatch(prompt.prompt.prompt, /super-secret|Bearer abc/i);

  const capturedDeleteRejected = await deleteAdminCaptureQuickNoteForDependencies(admin, {
    id: created.item.id,
  });
  assert.equal(capturedDeleteRejected.ok, false);
  if (!capturedDeleteRejected.ok) {
    assert.equal(capturedDeleteRejected.reason, "quick_note_delete_only");
  }

  const disposableQuickNote = await mustOk(
    createAdminCaptureItemForDependencies(admin, {
      itemType: "context_capture",
      title: "Disposable quick note delete proof",
      note: "Delete me after deterministic quick-note proof.",
      pageUrl: "hito://admin/quick-note-delete-proof",
      route: "/admin/capture",
      targetRole: "backend",
      priority: "medium",
      metadata: {
        source: "deterministic_quick_note_delete_proof",
      },
    }),
  );
  assert.equal(disposableQuickNote.item.source, "quick_note");

  const deletedQuickNote = await mustOk(
    deleteAdminCaptureQuickNoteForDependencies(admin, { id: disposableQuickNote.item.id }),
  );
  assert.equal(deletedQuickNote.deletedId, disposableQuickNote.item.id);
  assert.equal(await repository.getItem(disposableQuickNote.item.id), null);

  await mustOk(
    updateAdminCaptureItemTriageForDependencies(admin, {
      id: created.item.id,
      status: "archived",
    }),
  );

  const activeAfterArchive = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "all",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 50,
    }),
  );
  assert.equal(activeAfterArchive.view.items.length, 0);

  const archived = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "archived",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 50,
    }),
  );
  assert.equal(archived.view.items.length, 1);

  const repoDerivedRow = await repository.createItem({
    item_type: "context_capture",
    status: "new",
    priority: "high",
    target_role: "backend",
    title: "Imported canonical markdown mirror",
    note: "ROLE: BACKEND\n\nTASK:\nVerify imported markdown metadata.\n\nSTAGE:\nBACKEND validation",
    page_url: "hito://repo/docs/plans/active/example.md",
    route: null,
    created_by_user_id: "repo-work-item-importer",
    created_by_label: "Repo work item importer",
    metadata: {
      imported_from_repo: true,
      work_item_id: "admin-canonical-markdown-mirror",
      source_path: "docs/plans/active/example.md",
      source_type: "active_plan",
      ...repoMetadataForSourceType("active_plan"),
      work_item_status: "in_progress",
      work_item_owner: "backend",
      work_item_epic: "platform-and-operations",
      work_item_scope: "admin-capture",
      archive_intent: "retain_in_place",
      work_item_batch: "admin-contract",
      frontend_lane: "product",
      markdown_status: "in_progress",
      markdown_type: "context_capture",
      markdown_priority: "high",
      markdown_next_role: "backend",
      markdown_prompt_source: "exact_handoff_prompt",
      markdown_metadata_state: "complete",
    },
  });
  const repoList = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "all",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 50,
      search: "Imported canonical markdown mirror",
    }),
  );
  assert.equal(repoList.view.items.length, 1);
  assert.equal(repoList.view.items[0]?.source, "repo_import");
  assert.equal(repoList.view.items[0]?.repoWorkItem?.sourceLabel, "Active plan");
  assert.equal(repoList.view.items[0]?.repoWorkItem?.sourceGroup, "active_plans");
  assert.deepEqual(repoList.view.items[0]?.repoWorkItem, {
    workItemId: "admin-canonical-markdown-mirror",
    sourcePath: "docs/plans/active/example.md",
    sourceType: "active_plan",
    workItemKind: "plan",
    workItemLifecycle: "active",
    sourceGroup: "active_plans",
    sourceGroupLabel: "Active plans",
    sourceLabel: "Active plan",
    workItemStatus: "in_progress",
    workItemType: "context_capture",
    workItemPriority: "high",
    owner: "backend",
    epic: "platform-and-operations",
    scope: "admin-capture",
    archiveIntent: "retain_in_place",
    batch: "admin-contract",
    frontendLane: "product",
    metadataState: "complete",
    missingRequiredFields: [],
    invalidRequiredFields: [],
  });

  const activePlanList = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "all",
      sourceGroup: "active_plans",
      includeArchived: false,
      limit: 50,
      search: "Imported canonical markdown mirror",
    }),
  );
  assert.equal(activePlanList.view.items.length, 1);
  assert.equal(activePlanList.view.items[0]?.repoWorkItem?.sourceLabel, "Active plan");

  const backlogSourceList = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "all",
      sourceGroup: "backlog",
      includeArchived: false,
      limit: 50,
      search: "Imported canonical markdown mirror",
    }),
  );
  assert.equal(backlogSourceList.view.items.length, 0);

  const repoDetail = await mustOk(
    getAdminCaptureItemForDependencies(admin, { id: repoDerivedRow.id }),
  );
  assert.equal(repoDetail.item.source, "repo_import");
  assert.equal(repoDetail.item.repoWorkItem?.sourceLabel, "Active plan");
  assert.equal(repoDetail.item.repoWorkItem?.workItemLifecycle, "active");

  const validRepoMetadata = repoDerivedRow.metadata as Record<string, Json | undefined>;
  await repository.updateItem(repoDerivedRow.id, {
    metadata: { ...validRepoMetadata, work_item_epic: "unknown-epic" },
  });
  const invalidEpicDetail = await mustOk(
    getAdminCaptureItemForDependencies(admin, { id: repoDerivedRow.id }),
  );
  assert.equal(invalidEpicDetail.item.repoWorkItem?.epic, null);
  await repository.updateItem(repoDerivedRow.id, { metadata: validRepoMetadata });

  const repoPrompt = await mustOk(
    getAdminCaptureCopyPromptForDependencies(admin, { id: repoDerivedRow.id }),
  );
  assert.equal(repoPrompt.prompt.targetRole, "backend");
  assert.match(repoPrompt.prompt.prompt, /Verify imported markdown metadata/);
  assert.match(repoPrompt.prompt.prompt, /Source path: docs\/plans\/active\/example\.md/);
  assert.match(repoPrompt.prompt.prompt, /Source type: active_plan/);
  assert.match(repoPrompt.prompt.prompt, /Work item status: in_progress/);

  await mustRejectRepoDerivedMutation(
    updateAdminCaptureItemTriageForDependencies(admin, {
      id: repoDerivedRow.id,
      itemType: "bug",
      status: "done",
      priority: "urgent",
      targetRole: "frontend",
      title: "Should not persist",
    }),
  );
  await mustRejectRepoDerivedMutation(
    appendAdminCaptureItemNoteForDependencies(admin, {
      id: repoDerivedRow.id,
      note: "Should not append.",
    }),
  );
  await mustRejectRepoDerivedMutation(
    deleteAdminCaptureQuickNoteForDependencies(admin, {
      id: repoDerivedRow.id,
    }),
  );
  const repoAfterRejectedMutations = await repository.getItem(repoDerivedRow.id);
  assert.equal(repoAfterRejectedMutations?.status, "new");
  assert.equal(repoAfterRejectedMutations?.item_type, "context_capture");
  assert.equal(repoAfterRejectedMutations?.priority, "high");
  assert.equal(repoAfterRejectedMutations?.target_role, "backend");
  assert.equal(repoAfterRejectedMutations?.title, "Imported canonical markdown mirror");
  assert.equal(
    repoAfterRejectedMutations?.note,
    "ROLE: BACKEND\n\nTASK:\nVerify imported markdown metadata.\n\nSTAGE:\nBACKEND validation",
  );

  assertStaleRepoMirrorCleanupPolicy();

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "deterministic",
        checks: [
          "canonical_page_and_complete_status_counts",
          "page_limit_root_cause_discriminator",
          "status_archive_and_combined_filter_counts",
          "single_route_backlog_read",
          "repo_mirror_source_mode_boundary",
          "bundled_repo_mirror_source_contract",
          "local_hosted_source_mode_matrix",
          "authenticated_repo_mirror_sync_before_read",
          "unauthenticated_repo_mirror_sync_blocked",
          "repo_mirror_sync_failure_shape",
          "repo_mirror_sync_timeout_shape",
          "repo_mirror_failure_stage_and_code_diagnostic",
          "repo_mirror_run_context_isolation",
          "missing_repo_root_refuses_archive",
          "empty_repo_root_refuses_projection",
          "repo_mirror_identity_axes_fail_closed",
          "repo_mirror_concurrent_insert_reconciliation",
          "repo_mirror_row_limit_fails_closed",
          "backend_unavailable_shape",
          "read_failure_shape",
          "admin_create_list_read_update",
          "non_admin_rejected",
          "deterministic_prompt",
          "metadata_redaction",
          "quick_note_delete",
          "non_quick_note_delete_rejected",
          "archived_excluded_from_active_list",
          "repo_derived_list_detail_copy",
          "repo_derived_markdown_prompt_copy",
          "repo_derived_read_only",
          "canonical_markdown_work_item_contract",
          "canonical_backlog_epic_corpus",
          "compact_terminal_markdown_identity_contract",
          "canonical_repo_projection_metadata",
          "unsupported_persisted_epic_not_projected",
          "stale_repo_mirror_cleanup_policy",
        ],
        epicCorpus,
        promptLength: prompt.prompt.prompt.length,
      },
      null,
      2,
    ),
  );
}

async function assertRepoMirrorSynchronizationBoundary() {
  const repository = new MemoryAdminCaptureRepository();
  let syncCalls = 0;
  const admin = {
    ...adminDependencies(repository),
    synchronizeRepoMirror: async () => {
      syncCalls += 1;
    },
  } satisfies AdminCaptureDependencies;

  const result = await listAdminCaptureBacklogForDependencies(admin, {
    status: "all",
    sourceGroup: "all_work",
    includeArchived: false,
    limit: 50,
  });
  assert.equal(result.ok, true);
  assert.equal(syncCalls, 1);
  assert.equal(repository.listBacklogCalls, 1);

  let rejectedSyncCalls = 0;
  const rejected = await listAdminCaptureBacklogForDependencies(
    {
      ...nonAdminDependencies(repository),
      synchronizeRepoMirror: async () => {
        rejectedSyncCalls += 1;
      },
    },
    {
      status: "all",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 50,
    },
  );
  assert.equal(rejected.ok, false);
  assert.equal(rejectedSyncCalls, 0);

  const unreadRepository = new MemoryAdminCaptureRepository();
  const failedSync = await captureConsoleErrors(() =>
    listAdminCaptureBacklogForDependencies(
      {
        ...adminDependencies(unreadRepository),
        synchronizeRepoMirror: async () => {
          throw new Error("Forced repository mirror synchronization failure.", {
            cause: { code: "PGRST_TEST_SYNC" },
          });
        },
      },
      {
        status: "all",
        sourceGroup: "all_work",
        includeArchived: false,
        limit: 50,
      },
    ),
  );
  const failed = failedSync.result;
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal(failed.reason, "capture_load_failed");
  }
  assert.deepEqual(failedSync.messages, [
    '[admin-capture] capture_load_failed {"stage":"repository_mirror_sync","code":"PGRST_TEST_SYNC"}',
  ]);
  assert.equal(unreadRepository.listBacklogCalls, 0);

  const timeoutRepository = new MemoryAdminCaptureRepository();
  const timedOutSync = await captureConsoleErrors(() =>
    listAdminCaptureBacklogForDependencies(
      {
        ...adminDependencies(timeoutRepository),
        synchronizeRepoMirror: () => new Promise<void>(() => {}),
        repoMirrorSyncTimeoutMs: 5,
      },
      {
        status: "all",
        sourceGroup: "all_work",
        includeArchived: false,
        limit: 50,
      },
    ),
  );
  const timedOut = timedOutSync.result;
  assert.equal(timedOut.ok, false);
  if (!timedOut.ok) {
    assert.equal(timedOut.reason, "capture_load_failed");
  }
  assert.deepEqual(timedOutSync.messages, [
    '[admin-capture] capture_load_failed {"stage":"repository_mirror_sync","code":"unclassified"}',
  ]);
  assert.equal(timeoutRepository.listBacklogCalls, 0);
}

async function captureConsoleErrors<T>(action: () => Promise<T>) {
  const original = console.error;
  const messages: string[] = [];

  console.error = (...values: unknown[]) => {
    messages.push(values.map(String).join(" "));
  };

  try {
    return {
      result: await action(),
      messages,
    };
  } finally {
    console.error = original;
  }
}

async function assertRepoMirrorSynchronizationSafety() {
  const failures: string[] = [];

  for (const [name, check] of [
    ["repo_mirror_run_context_isolation", assertRepoMirrorRunContextIsolation],
    ["missing_repo_root_refuses_archive", assertMissingRepoRootRefusesArchive],
    ["empty_repo_root_refuses_projection", assertEmptyRepoRootRefusesProjection],
    ["repo_mirror_identity_axes_fail_closed", assertRepoMirrorIdentityAxes],
    [
      "repo_mirror_concurrent_insert_reconciliation",
      assertConcurrentRepoMirrorInsertReconciliation,
    ],
    ["repo_mirror_row_limit_fails_closed", assertRepoMirrorRowLimitFailsClosed],
  ] as const) {
    try {
      await check();
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  assert.deepEqual(failures, []);
}

async function assertRepoMirrorRunContextIsolation() {
  let releaseSecondRead = () => {};
  let signalSecondRead = () => {};
  const secondReadReached = new Promise<void>((resolve) => {
    signalSecondRead = resolve;
  });
  const secondReadRelease = new Promise<void>((resolve) => {
    releaseSecondRead = resolve;
  });
  const fake = createRepoMirrorSynchronizationSupabase({
    beforeRead: async (readCount) => {
      if (readCount === 2) {
        signalSecondRead();
        await secondReadRelease;
      }
    },
  });
  const liveRun = synchronizeRepoWorkItems({
    rootDir: process.cwd(),
    archiveStale: true,
    supabase: fake.client,
  });

  await secondReadReached;
  const overlappingDryRun = await synchronizeRepoWorkItems({
    rootDir: process.cwd(),
    dryRun: true,
  });
  releaseSecondRead();
  const liveReport = await liveRun;

  assert.equal(overlappingDryRun.archiveStale, false);
  assert.equal(liveReport.archiveStale, true);
  assert.equal(liveReport.stats.staleRepoMirrorAction, "archived");
  assert.equal(fake.row.status, "archived");
  assert.equal(fake.updateCount(), 1);
}

async function assertMissingRepoRootRefusesArchive() {
  const fake = createRepoMirrorSynchronizationSupabase();

  await assert.rejects(
    synchronizeRepoWorkItems({
      rootDir: `${process.cwd()}/.missing-admin-repo-mirror-source-root`,
      archiveStale: true,
      supabase: fake.client,
    }),
    /required repository work-item source/i,
  );
  assert.equal(fake.row.status, "ready_for_codex");
  assert.equal(fake.readCount(), 0);
  assert.equal(fake.updateCount(), 0);
}

async function assertEmptyRepoRootRefusesProjection() {
  const rootDir = await mkdtemp(path.join(tmpdir(), "hito-admin-repo-root-"));
  const emptyRoot = ADMIN_REPO_WORK_ITEM_SOURCE_ROOTS[0]!;
  const fake = createRepoMirrorSynchronizationSupabase();

  try {
    for (const sourceRoot of ADMIN_REPO_WORK_ITEM_SOURCE_ROOTS) {
      const directory = path.join(rootDir, sourceRoot);
      await mkdir(directory, { recursive: true });

      if (sourceRoot !== emptyRoot) {
        await writeFile(path.join(directory, "fixture.md"), "# Repository mirror fixture\n");
      }
    }

    await assert.rejects(
      synchronizeRepoWorkItems({ rootDir, supabase: fake.client }),
      /required repository work-item source is empty/i,
    );
    await writeFile(path.join(rootDir, emptyRoot, "README.md"), "# Policy only\n");
    await assert.rejects(
      synchronizeRepoWorkItems({ rootDir, supabase: fake.client }),
      /required repository work-item source is empty/i,
    );
    assert.equal(fake.readCount(), 0);
    assert.equal(fake.updateCount(), 0);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

function assertRepoMirrorIdentityAxes() {
  const sharedSource = "docs/plans/active/shared-source.md";
  const rows = [
    repoMirrorRow({
      id: "77777777-7777-4777-8777-777777777777",
      title: "First source identity",
      sourcePath: sharedSource,
      sourceType: "active_plan",
      workItemId: "first-work-item",
    }),
    repoMirrorRow({
      id: "88888888-8888-4888-8888-888888888888",
      title: "Second source identity",
      sourcePath: sharedSource,
      sourceType: "active_plan",
      workItemId: "second-work-item",
    }),
  ];

  assert.equal(countRepoMirrorIdentityDuplicates(rows), 1);
  (rows[1]!.metadata as Record<string, Json>).source_path = "docs/plans/active/other.md";
  (rows[1]!.metadata as Record<string, Json>).work_item_id = "first-work-item";
  assert.equal(countRepoMirrorIdentityDuplicates(rows), 1);
}

async function assertConcurrentRepoMirrorInsertReconciliation() {
  const documents = buildMinimalBundledRepoDocuments();
  const rows: AdminCaptureItemRow[] = [];
  let insertCalls = 0;
  let conflictCount = 0;
  const client = {
    from(table: string) {
      assert.equal(table, "admin_capture_items");

      return {
        select() {
          return {
            async limit() {
              return { data: rows.map((row) => ({ ...row })), error: null, count: rows.length };
            },
          };
        },
        async insert(input: ItemInsert) {
          insertCalls += 1;
          const row = adminCaptureRowFromInsert(input, randomUUID());

          if (conflictCount === 0) {
            conflictCount += 1;
            rows.push(row);
            return {
              error: {
                code: "23505",
                message: "duplicate key value violates unique constraint",
              },
            };
          }

          rows.push(row);
          return { error: null };
        },
        update(patch: ItemUpdate) {
          return {
            async eq(column: string, id: string) {
              assert.equal(column, "id");
              const row = rows.find((candidate) => candidate.id === id);
              assert.ok(row);
              Object.assign(row, patch);
              return { error: null };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient<Database>;

  const report = await synchronizeRepoWorkItems({
    documents,
    sourceRevision: "concurrent-proof",
    archiveStale: false,
    supabase: client,
  });
  const rowIds = rows.map((row) => row.id);
  const firstRunRows = structuredClone(rows);
  const secondReport = await synchronizeRepoWorkItems({
    documents,
    sourceRevision: "concurrent-proof",
    archiveStale: false,
    supabase: client,
  });

  assert.equal(report.ok, true);
  assert.equal(secondReport.ok, true);
  assert.equal(secondReport.stats.created, 0);
  assert.equal(secondReport.stats.updated, 0);
  assert.equal(secondReport.stats.skipped, documents.length);
  assert.equal(conflictCount, 1);
  assert.equal(insertCalls, documents.length);
  assert.equal(rows.length, documents.length);
  assert.deepEqual(
    rows.map((row) => row.id),
    rowIds,
  );
  assert.deepEqual(rows, firstRunRows);
  assert.equal(new Set(rows.map((row) => repoMirrorIdentity(row))).size, documents.length);
  assert.equal(
    (
      rows.find((row) =>
        String((row.metadata as Record<string, unknown>).source_path).startsWith(
          "docs/tasks/backlog/",
        ),
      )?.metadata as Record<string, unknown>
    ).work_item_epic,
    "platform-and-operations",
  );
}

async function assertRepoMirrorRowLimitFailsClosed() {
  let insertCalls = 0;
  const client = {
    from(table: string) {
      assert.equal(table, "admin_capture_items");

      return {
        select() {
          return {
            async limit() {
              return { data: [], error: null, count: 10_001 };
            },
          };
        },
        async insert() {
          insertCalls += 1;
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient<Database>;

  await assert.rejects(
    synchronizeRepoWorkItems({
      documents: buildMinimalBundledRepoDocuments(),
      archiveStale: false,
      supabase: client,
    }),
    /safety limit of 10000 rows/i,
  );
  assert.equal(insertCalls, 0);
}

function buildMinimalBundledRepoDocuments(
  titlePrefix = "Concurrent projection proof",
): AdminRepoWorkItemDocument[] {
  const sources = [
    ["backlog_doc", "docs/tasks/backlog/concurrent-proof.md"],
    ["product_brief", "docs/tasks/product-briefs/concurrent-proof.md"],
    ["frontend_spec", "docs/tasks/frontend-specs/concurrent-proof.md"],
    ["active_plan", "docs/plans/active/concurrent-proof.md"],
    ["archived_plan", "docs/plans/archive/concurrent-proof.md"],
  ] as const;

  return sources.map(([sourceType, sourcePath], index) => ({
    sourceType,
    sourcePath,
    content: `# ${titlePrefix} ${index}

## Work Item ID

qa-concurrent-repo-mirror-${index}

## Status

backlog

## Type

${sourceType === "backlog_doc" ? "change_request" : "bug"}

${sourceType === "backlog_doc" ? "## Epic\n\nplatform-and-operations\n" : ""}

## Priority

low

## Owner

backend

## Scope

admin-repo-mirror-concurrency-proof

## Archive Intent

retain_in_place

## Task

${titlePrefix} for source ${index}.

## Stage

Deterministic validator.

## Next Recommended Role

backend
`,
  }));
}

function adminCaptureRowFromInsert(input: ItemInsert, id: string): AdminCaptureItemRow {
  const now = "2026-08-06T12:00:00.000Z";

  return {
    id,
    item_type: input.item_type,
    status: input.status ?? "new",
    priority: input.priority ?? null,
    target_role: input.target_role ?? null,
    title: input.title ?? null,
    note: input.note,
    page_url: input.page_url,
    route: input.route ?? null,
    created_by_user_id: input.created_by_user_id,
    created_by_label: input.created_by_label ?? null,
    viewport_width: input.viewport_width ?? null,
    viewport_height: input.viewport_height ?? null,
    element_text: input.element_text ?? null,
    selector: input.selector ?? null,
    dom_path: input.dom_path ?? null,
    nearby_heading: input.nearby_heading ?? null,
    bounding_rect: input.bounding_rect ?? null,
    metadata: input.metadata ?? {},
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    archived_at: input.archived_at ?? null,
  };
}

function repoMirrorIdentity(row: AdminCaptureItemRow) {
  const metadata = row.metadata as Record<string, unknown>;
  return `${metadata.work_item_id ?? ""}:${metadata.source_type ?? ""}:${metadata.source_path ?? ""}`;
}

function createRepoMirrorSynchronizationSupabase(options?: {
  beforeRead?: (readCount: number) => Promise<void>;
}) {
  const row = repoMirrorRow({
    id: "66666666-6666-4666-8666-666666666666",
    title: "Stale mirror safety discriminator",
    sourcePath: "docs/plans/active/__qa_missing_source__.md",
    sourceType: "active_plan",
  });
  let reads = 0;
  let updates = 0;
  const client = {
    from(table: string) {
      assert.equal(table, "admin_capture_items");

      return {
        select() {
          return {
            async limit() {
              reads += 1;
              await options?.beforeRead?.(reads);
              return { data: [{ ...row }], error: null, count: 1 };
            },
          };
        },
        async insert() {
          return { error: null };
        },
        update(patch: Partial<AdminCaptureItemRow>) {
          return {
            async eq(column: string, id: string) {
              assert.equal(column, "id");
              assert.equal(id, row.id);
              updates += 1;
              Object.assign(row, patch);
              return { error: null };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient<Database>;

  return {
    client,
    row,
    readCount: () => reads,
    updateCount: () => updates,
  };
}

async function assertCanonicalBacklogReadContract() {
  const discriminatorRepository = new MemoryAdminCaptureRepository();
  const discriminatorAdmin = adminDependencies(discriminatorRepository);
  const olderBase = Date.parse("2026-05-01T00:00:00.000Z");
  const newerBase = Date.parse("2026-06-01T00:00:00.000Z");

  for (let index = 0; index < 100; index += 1) {
    await seedMemoryBacklogItem(discriminatorRepository, {
      status: "done",
      title: `Older Done ${index}`,
      created_at: new Date(olderBase + index * 1000).toISOString(),
    });
    await seedMemoryBacklogItem(discriminatorRepository, {
      status: "new",
      title: `Newer Active ${index}`,
      created_at: new Date(newerBase + index * 1000).toISOString(),
    });
  }

  const donePage = await mustOk(
    listAdminCaptureBacklogForDependencies(discriminatorAdmin, {
      status: "done",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 100,
    }),
  );
  assert.equal(discriminatorRepository.listBacklogCalls, 1);
  assert.equal(donePage.view.shown, 100);
  assert.equal(donePage.view.total, 100);
  assert.equal(
    donePage.view.items.every((item) => item.status === "done"),
    true,
  );
  assert.equal(donePage.view.statusCounts.new, 100);
  assert.equal(donePage.view.statusCounts.done, 100);

  const activePage = await mustOk(
    listAdminCaptureBacklogForDependencies(discriminatorAdmin, {
      status: "all",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 25,
    }),
  );
  assert.equal(discriminatorRepository.listBacklogCalls, 2);
  assert.equal(activePage.view.shown, 25);
  assert.equal(activePage.view.total, 100);
  assert.equal(
    activePage.view.items.every((item) => item.status === "new"),
    true,
  );

  const filteredRepository = new MemoryAdminCaptureRepository();
  const filteredAdmin = adminDependencies(filteredRepository);
  const matchingStatuses = ["new", "in_review", "ready_for_codex", "done", "archived"] as const;

  for (const status of matchingStatuses) {
    await seedMemoryBacklogItem(filteredRepository, {
      status,
      title: `Canonical filter contract ${status}`,
      item_type: "bug",
      priority: "high",
      target_role: "backend",
      archived_at: status === "archived" ? "2026-06-10T00:00:00.000Z" : null,
      metadata: { source_group: "active_plans" },
    });
  }

  await seedMemoryBacklogItem(filteredRepository, {
    status: "done",
    title: "Canonical filter contract wrong source",
    item_type: "bug",
    priority: "high",
    target_role: "backend",
    metadata: { source_group: "backlog" },
  });
  await seedMemoryBacklogItem(filteredRepository, {
    status: "done",
    title: "Canonical filter contract wrong type",
    item_type: "change_request",
    priority: "high",
    target_role: "backend",
    metadata: { source_group: "active_plans" },
  });
  await seedMemoryBacklogItem(filteredRepository, {
    status: "done",
    title: "Canonical filter contract wrong priority",
    item_type: "bug",
    priority: "low",
    target_role: "backend",
    metadata: { source_group: "active_plans" },
  });
  await seedMemoryBacklogItem(filteredRepository, {
    status: "done",
    title: "Canonical filter contract wrong role",
    item_type: "bug",
    priority: "high",
    target_role: "frontend",
    metadata: { source_group: "active_plans" },
  });
  await seedMemoryBacklogItem(filteredRepository, {
    status: "done",
    title: "Unrelated search text",
    note: "No matching query here.",
    item_type: "bug",
    priority: "high",
    target_role: "backend",
    metadata: { source_group: "active_plans" },
  });

  const commonFilters = {
    sourceGroup: "active_plans" as const,
    itemType: "bug" as const,
    priority: "high" as const,
    targetRole: "backend" as const,
    search: "Canonical filter contract",
    limit: 100,
  };
  const filteredDone = await mustOk(
    listAdminCaptureBacklogForDependencies(filteredAdmin, {
      ...commonFilters,
      status: "done",
      includeArchived: false,
    }),
  );
  assert.equal(filteredDone.view.items.length, 1);
  assert.equal(filteredDone.view.total, 1);
  assert.deepEqual(filteredDone.view.statusCounts, {
    new: 1,
    in_review: 1,
    ready_for_codex: 1,
    done: 1,
    archived: 1,
  });

  const filteredActive = await mustOk(
    listAdminCaptureBacklogForDependencies(filteredAdmin, {
      ...commonFilters,
      status: "all",
      includeArchived: false,
    }),
  );
  assert.equal(filteredActive.view.items.length, 3);
  assert.equal(filteredActive.view.total, 3);
  assert.equal(
    filteredActive.view.items.every((item) =>
      adminCaptureActiveStatuses.some((status) => status === item.status),
    ),
    true,
  );

  const filteredArchived = await mustOk(
    listAdminCaptureBacklogForDependencies(filteredAdmin, {
      ...commonFilters,
      status: "archived",
      includeArchived: true,
    }),
  );
  assert.equal(filteredArchived.view.items.length, 1);
  assert.equal(filteredArchived.view.total, 1);
}

async function seedMemoryBacklogItem(
  repository: MemoryAdminCaptureRepository,
  input: Partial<ItemInsert> & Pick<ItemInsert, "status" | "title">,
) {
  return repository.createItem({
    id: input.id ?? randomUUID(),
    item_type: input.item_type ?? "context_capture",
    status: input.status,
    priority: input.priority ?? null,
    target_role: input.target_role ?? null,
    title: input.title,
    note: input.note ?? input.title,
    page_url: input.page_url ?? "hito://admin/read-contract-proof",
    route: input.route ?? "/admin/capture",
    created_by_user_id: input.created_by_user_id ?? "admin-read-contract-proof",
    created_by_label: input.created_by_label ?? "Admin read contract proof",
    metadata: input.metadata ?? {},
    created_at: input.created_at ?? "2026-06-10T00:00:00.000Z",
    updated_at: input.updated_at ?? input.created_at ?? "2026-06-10T00:00:00.000Z",
    archived_at: input.archived_at ?? null,
  });
}

async function assertSingleRouteBacklogRead() {
  const routeSource = await readFile(
    new URL("../src/routes/admin.capture.tsx", import.meta.url),
    "utf8",
  );
  const listCalls = routeSource.match(/listAdminCaptureBacklog\s*\(\{/g) ?? [];

  assert.equal(listCalls.length, 1);
  assert.match(routeSource, /loaderDeps:\s*\(\{ search \}\) => search/);
  assert.match(routeSource, /loader:\s*async \(\{ deps: search \}\)/);
  assert.doesNotMatch(routeSource, /location\.search/);
  assert.doesNotMatch(routeSource, /countsResult|filterBacklogViewForStatus/);
}

function assertRepoMirrorSourceModeBoundary() {
  assert.equal(
    resolveAdminRepoMirrorSourceMode(
      "http://127.0.0.1:3000/admin/capture",
      "http://127.0.0.1:54321",
    ),
    "filesystem",
  );
  assert.equal(
    resolveAdminRepoMirrorSourceMode(
      "https://hito-runner.vercel.app/admin/capture",
      "https://example.supabase.co",
    ),
    "bundle",
  );
  assert.equal(
    resolveAdminRepoMirrorSourceMode(
      "http://127.0.0.1:3000/admin/capture",
      "https://example.supabase.co",
    ),
    null,
  );
  assert.equal(
    resolveAdminRepoMirrorSourceMode(
      "https://hito-runner.vercel.app/admin/capture",
      "http://127.0.0.1:54321",
    ),
    null,
  );
}

async function assertBundledRepoMirrorSourceContract() {
  const snapshot = collectAdminRepoWorkItemSnapshot(process.cwd());
  const filesystemReport = await synchronizeRepoWorkItems({
    rootDir: process.cwd(),
    dryRun: true,
    sourceRevision: "snapshot-contract-proof",
  });
  const report = await synchronizeRepoWorkItems({
    documents: snapshot.documents,
    dryRun: true,
    sourceRevision: "snapshot-contract-proof",
  });

  assert.equal(snapshot.marker, "HITO_ADMIN_REPO_SNAPSHOT_V1");
  assert.equal(snapshot.documents.length > 0, true);
  assert.equal(report.ok, true);
  assert.deepEqual(report.stats.eligibleBySourceType, filesystemReport.stats.eligibleBySourceType);
  assert.equal(filesystemReport.stats.skippedByReason.readme_policy_doc, 1);
  assert.equal(report.stats.skippedByReason.readme_policy_doc, undefined);
  assert.deepEqual(
    report.stats.missingRequiredFieldCounts,
    filesystemReport.stats.missingRequiredFieldCounts,
  );
  assert.deepEqual(
    report.stats.invalidRequiredFieldCounts,
    filesystemReport.stats.invalidRequiredFieldCounts,
  );
  assert.equal(
    report.stats.malformedCanonicalItemCount,
    filesystemReport.stats.malformedCanonicalItemCount,
  );
  assert.equal(
    Object.values(snapshot.countsByRoot).every((count) => count > 0),
    true,
  );

  const withoutArchivedPlans = snapshot.documents.filter(
    (document) => !document.sourcePath.startsWith("docs/plans/archive/"),
  );
  await assert.rejects(
    synchronizeRepoWorkItems({ documents: withoutArchivedPlans, dryRun: true }),
    /required bundled repository work-item source.*docs\/plans\/archive/i,
  );
}

function assertCanonicalBacklogEpicCorpus() {
  const snapshot = collectAdminRepoWorkItemSnapshot(process.cwd());
  const topLevelBacklog = snapshot.documents.filter(
    (document) =>
      document.sourceType === "backlog_doc" &&
      path.posix.dirname(document.sourcePath) === "docs/tasks/backlog",
  );
  const seenEpics = new Set<string>();
  const epicCounts = Object.fromEntries(
    adminRepoWorkItemEpicSlugs.map((epic) => [epic, 0]),
  ) as Record<(typeof adminRepoWorkItemEpicSlugs)[number], number>;
  let bugCount = 0;
  let nonBugCount = 0;

  for (const document of topLevelBacklog) {
    const parsed = parseCanonicalMarkdown(document.content, {
      requireEpicForActiveNonBug: true,
    });

    if (parsed.itemType === "bug") {
      bugCount += 1;
      assert.equal(parsed.epic, null, `${document.sourcePath} must remain Epic-free.`);
      assert.equal(parsed.raw.Epic, undefined, `${document.sourcePath} declares a Bug Epic.`);
      continue;
    }

    nonBugCount += 1;
    assert.ok(parsed.epic, `${document.sourcePath} is missing a registered Epic.`);
    assert.equal(
      parsed.invalidRequiredFields.includes("Epic"),
      false,
      `${document.sourcePath} has an invalid Epic.`,
    );
    seenEpics.add(parsed.epic);
    epicCounts[parsed.epic] += 1;
  }

  assert.equal(bugCount + nonBugCount, topLevelBacklog.length);

  return {
    topLevelCount: topLevelBacklog.length,
    bugCount,
    nonBugCount,
    registeredEpicsObserved: Array.from(seenEpics).sort(),
    epicCounts,
  };
}

function assertStaleRepoMirrorCleanupPolicy() {
  const currentRepoRow = repoMirrorRow({
    id: "11111111-1111-4111-8111-111111111111",
    title: "Current repo mirror",
    sourcePath: "docs/plans/active/current.md",
    sourceType: "active_plan",
  });
  const staleRepoRow = repoMirrorRow({
    id: "22222222-2222-4222-8222-222222222222",
    title: "Stale repo mirror",
    sourcePath: "docs/plans/active/stale.md",
    sourceType: "active_plan",
  });
  const archivedStaleRepoRow = repoMirrorRow({
    id: "33333333-3333-4333-8333-333333333333",
    title: "Archived stale repo mirror",
    sourcePath: "docs/plans/active/already-archived.md",
    sourceType: "active_plan",
    status: "archived",
    archivedAt: "2026-06-02T12:00:00.000Z",
  });
  const quickNoteRow = repoMirrorRow({
    id: "44444444-4444-4444-8444-444444444444",
    title: "Manual quick note",
    sourcePath: "docs/plans/active/stale.md",
    sourceType: "active_plan",
    importedFromRepo: false,
  });
  const capturedUiRow = {
    ...quickNoteRow,
    id: "55555555-5555-4555-8555-555555555555",
    selector: "[data-testid='capture-proof']",
    element_text: "Capture proof",
  };
  const currentSourceKeys = new Set(["active_plan:docs/plans/active/current.md"]);
  const staleRows = findStaleActiveRepoMirrorRows(
    [currentRepoRow, staleRepoRow, archivedStaleRepoRow, quickNoteRow, capturedUiRow],
    currentSourceKeys,
  );
  const staleMetadata = buildStaleRepoMirrorMetadata(
    staleRepoRow.metadata as Record<string, Json | undefined>,
    "docs/plans/active/stale.md",
    "active_plan",
  ) as Record<string, unknown>;

  assert.deepEqual(
    staleRows.map((row) => row.id),
    [staleRepoRow.id],
  );
  assert.equal(staleMetadata.stale_repo_mirror, true);
  assert.equal(staleMetadata.stale_source_path, "docs/plans/active/stale.md");
  assert.equal(staleMetadata.stale_source_type, "active_plan");
  assert.equal(staleMetadata.stale_cleanup_action, "archived");
}

function repoMirrorRow(input: {
  id: string;
  title: string;
  sourcePath: string;
  sourceType: string;
  workItemId?: string;
  importedFromRepo?: boolean;
  status?: AdminCaptureItemRow["status"];
  archivedAt?: string | null;
}): AdminCaptureItemRow {
  return {
    id: input.id,
    item_type: "context_capture",
    status: input.status ?? "ready_for_codex",
    priority: "medium",
    target_role: "backend",
    title: input.title,
    note: "Repo mirror validation row.",
    page_url: `hito://repo/${input.sourcePath}`,
    route: null,
    created_by_user_id: "repo-work-item-importer",
    created_by_label: "Repo work item importer",
    viewport_width: null,
    viewport_height: null,
    element_text: null,
    selector: null,
    dom_path: null,
    nearby_heading: null,
    bounding_rect: null,
    metadata: {
      imported_from_repo: input.importedFromRepo ?? true,
      source_path: input.sourcePath,
      source_type: input.sourceType,
      work_item_id: input.workItemId,
    },
    created_at: "2026-06-03T12:00:00.000Z",
    updated_at: "2026-06-03T12:00:00.000Z",
    archived_at: input.archivedAt ?? null,
  };
}

async function runLiveSupabaseProbe() {
  const env = readLiveSupabaseEnv();
  const serviceClient = createClient<Database>(env.url, env.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const publishableClient = createClient<Database>(env.url, env.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const steps: LiveProbeStep[] = [];

  await probeTableExists(serviceClient, "admin_capture_items", steps);
  await probeLegacyTableAbsent(serviceClient, "admin_capture_assets", steps);
  await probeLegacyBucketAbsent(serviceClient, steps);

  const schemaReady = steps.every((step) => step.ok);
  let createdItemId: string | null = null;
  let repoDerivedItemId: string | null = null;

  if (schemaReady) {
    const mirrorReport = await synchronizeRepoWorkItems({
      rootDir: process.cwd(),
      archiveStale: false,
      supabase: serviceClient,
    });
    steps.push({
      name: "canonical_repo_mirror_synchronization",
      ok:
        mirrorReport.ok &&
        mirrorReport.stats.duplicateWorkItemIdCount === 0 &&
        mirrorReport.stats.staleRepoMirrorAction === "reported" &&
        mirrorReport.stats.staleRepoMirrorArchivedCount === 0 &&
        mirrorReport.stats.manualRowCountBefore === mirrorReport.stats.manualRowCountAfter,
      detail: `${mirrorReport.stats.created} created, ${mirrorReport.stats.updated} updated, ${mirrorReport.stats.skipped} unchanged, ${mirrorReport.stats.malformedCanonicalItemCount} malformed diagnostics`,
    });

    const fencedSnapshot = collectAdminRepoWorkItemSnapshot(process.cwd());
    const fencedDocument = fencedSnapshot.documents[0];
    assert.ok(fencedDocument);
    const fencedSourcePath = fencedDocument.sourcePath;
    const newerGeneration = new Date().toISOString();
    const olderGeneration = new Date(Date.parse(newerGeneration) - 60_000).toISOString();
    const newerRevision = `local-generation-fence-${randomUUID()}`;
    const newerFenceReport = await synchronizeRepoWorkItems({
      documents: fencedSnapshot.documents,
      sourceGeneration: newerGeneration,
      sourceRevision: newerRevision,
      archiveStale: false,
      supabase: serviceClient,
    });
    const olderDocuments = fencedSnapshot.documents.map((document: AdminRepoWorkItemDocument) =>
      document.sourcePath === fencedSourcePath
        ? { ...document, content: `${document.content}\nObsolete deployment replay.\n` }
        : document,
    );
    const olderFenceReport = await synchronizeRepoWorkItems({
      documents: olderDocuments,
      sourceGeneration: olderGeneration,
      sourceRevision: "obsolete-local-generation-fence",
      archiveStale: false,
      supabase: serviceClient,
    });
    const { data: fencedRows, error: fencedReadError } = await serviceClient
      .from("admin_capture_items")
      .select("metadata")
      .eq("metadata->>source_path", fencedSourcePath);
    const fencedMetadata = (fencedRows?.[0]?.metadata ?? {}) as Record<string, unknown>;
    steps.push({
      name: "cross_deployment_generation_fence",
      ok:
        newerFenceReport.ok &&
        olderFenceReport.ok &&
        !fencedReadError &&
        fencedRows?.length === 1 &&
        fencedMetadata.source_generation === newerGeneration &&
        fencedMetadata.source_revision === newerRevision &&
        fencedMetadata.content_hash ===
          createHash("sha256").update(fencedDocument.content).digest("hex"),
      detail: "an obsolete deployed generation could not overwrite the newer projection",
    });

    const repository = createSupabaseAdminCaptureRepository(serviceClient);
    const admin = adminDependencies(repository);
    const created = await mustOk(
      createAdminCaptureItemForDependencies(admin, {
        itemType: "context_capture",
        title: "Live Supabase capture proof",
        note: "Disposable live storage proof for admin capture backlog.",
        pageUrl: "hito://admin/live-proof",
        route: "/admin/capture",
        targetRole: "backend",
        priority: "medium",
        metadata: {
          source: "live_supabase_probe",
          sessionToken: "live-secret-token-should-redact",
          safeLabel: "admin-capture-live-proof",
        },
      }),
    );

    createdItemId = created.item.id;
    steps.push({
      name: "service_create_item",
      ok: true,
      detail: "service-role backend path created a disposable backlog item",
    });

    const listed = await mustOk(
      listAdminCaptureBacklogForDependencies(admin, {
        status: "new",
        sourceGroup: "all_work",
        includeArchived: false,
        limit: 20,
        search: "Live Supabase capture proof",
      }),
    );
    steps.push({
      name: "service_list_item",
      ok: listed.view.items.some((item) => item.id === createdItemId),
      detail: `active list returned ${listed.view.items.length} matching item(s)`,
    });

    const loaded = await mustOk(getAdminCaptureItemForDependencies(admin, { id: createdItemId }));
    steps.push({
      name: "service_read_item",
      ok: loaded.item.id === createdItemId,
      detail: "service-role backend path read the disposable item",
    });

    const updated = await mustOk(
      updateAdminCaptureItemTriageForDependencies(admin, {
        id: createdItemId,
        status: "ready_for_codex",
        targetRole: "backend",
        priority: "high",
      }),
    );
    steps.push({
      name: "service_update_item",
      ok: updated.item.status === "ready_for_codex" && updated.item.priority === "high",
      detail: "service-role backend path updated triage fields",
    });

    const prompt = await mustOk(
      getAdminCaptureCopyPromptForDependencies(admin, { id: createdItemId }),
    );
    steps.push({
      name: "copy_prompt_redaction",
      ok:
        prompt.prompt.prompt.includes("sessionToken: [redacted]") &&
        !prompt.prompt.prompt.includes("live-secret-token-should-redact"),
      detail: `prompt length ${prompt.prompt.prompt.length}`,
    });

    const appended = await mustOk(
      appendAdminCaptureItemNoteForDependencies(admin, {
        id: createdItemId,
        note: "Manual live probe note append should remain editable.",
      }),
    );
    steps.push({
      name: "manual_item_note_append",
      ok: appended.item.note.includes("Manual live probe note append"),
      detail: "manual quick-note/capture row note append still works",
    });

    const deleteProof = await mustOk(
      createAdminCaptureItemForDependencies(admin, {
        itemType: "context_capture",
        title: "Live quick note delete proof",
        note: "Disposable live quick note delete proof.",
        pageUrl: "hito://admin/live-delete-proof",
        route: "/admin/capture",
        targetRole: "backend",
        priority: "medium",
        metadata: {
          source: "live_supabase_delete_probe",
        },
      }),
    );
    const deletedQuickNote = await mustOk(
      deleteAdminCaptureQuickNoteForDependencies(admin, { id: deleteProof.item.id }),
    );
    const deletedReadback = await repository.getItem(deleteProof.item.id);
    steps.push({
      name: "service_delete_quick_note",
      ok:
        deleteProof.item.source === "quick_note" &&
        deletedQuickNote.deletedId === deleteProof.item.id &&
        deletedReadback === null,
      detail: "service-role backend path deleted a disposable manual quick note",
    });

    const repoDerivedRow = await repository.createItem({
      item_type: "context_capture",
      status: "new",
      priority: "high",
      target_role: "backend",
      title: "Live repo-derived read-only proof",
      note: "ROLE: BACKEND\n\nTASK:\nVerify live repo-derived metadata mirror.\n\nSTAGE:\nBACKEND validation",
      page_url: "hito://repo/docs/plans/active/live-proof.md",
      route: null,
      created_by_user_id: "repo-work-item-importer",
      created_by_label: "Repo work item importer",
      metadata: {
        imported_from_repo: true,
        source_path: "docs/plans/active/live-proof.md",
        source_type: "active_plan",
        ...repoMetadataForSourceType("active_plan"),
        work_item_status: "in_progress",
        markdown_status: "in_progress",
        markdown_type: "context_capture",
        markdown_priority: "high",
        markdown_next_role: "backend",
        markdown_prompt_source: "exact_handoff_prompt",
      },
    });
    repoDerivedItemId = repoDerivedRow.id;
    const repoList = await mustOk(
      listAdminCaptureBacklogForDependencies(admin, {
        status: "all",
        sourceGroup: "all_work",
        includeArchived: false,
        limit: 20,
        search: "Live repo-derived read-only proof",
      }),
    );
    const repoDetail = await mustOk(
      getAdminCaptureItemForDependencies(admin, { id: repoDerivedItemId }),
    );
    steps.push({
      name: "repo_derived_list_detail_search",
      ok:
        repoList.view.items.some((item) => item.id === repoDerivedItemId) &&
        repoDetail.item.source === "repo_import" &&
        repoDetail.item.repoWorkItem?.sourceLabel === "Active plan",
      detail: "repo-derived item remains listable, searchable, and readable",
    });

    const repoPrompt = await mustOk(
      getAdminCaptureCopyPromptForDependencies(admin, { id: repoDerivedItemId }),
    );
    steps.push({
      name: "repo_derived_copy_prompt",
      ok:
        repoPrompt.prompt.prompt.includes("Source path: docs/plans/active/live-proof.md") &&
        repoPrompt.prompt.prompt.includes("Source type: active_plan") &&
        repoPrompt.prompt.prompt.includes("Verify live repo-derived metadata mirror"),
      detail: `repo-derived prompt length ${repoPrompt.prompt.prompt.length}`,
    });

    const repoTriageBlocked = await updateAdminCaptureItemTriageForDependencies(admin, {
      id: repoDerivedItemId,
      itemType: "bug",
      status: "done",
      priority: "urgent",
      targetRole: "frontend",
      title: "Should not persist",
    });
    const repoAppendBlocked = await appendAdminCaptureItemNoteForDependencies(admin, {
      id: repoDerivedItemId,
      note: "Should not append.",
    });
    const repoDeleteBlocked = await deleteAdminCaptureQuickNoteForDependencies(admin, {
      id: repoDerivedItemId,
    });
    const repoAfterRejectedMutations = await repository.getItem(repoDerivedItemId);
    steps.push({
      name: "repo_derived_mutation_blocked",
      ok:
        isRepoReadOnlyRejection(repoTriageBlocked) &&
        isRepoReadOnlyRejection(repoAppendBlocked) &&
        isRepoReadOnlyRejection(repoDeleteBlocked) &&
        repoAfterRejectedMutations?.status === "new" &&
        repoAfterRejectedMutations?.target_role === "backend" &&
        repoAfterRejectedMutations?.note ===
          "ROLE: BACKEND\n\nTASK:\nVerify live repo-derived metadata mirror.\n\nSTAGE:\nBACKEND validation",
      detail: "status/type/priority/target-role/title/note mutations were rejected",
    });

    await mustOk(
      updateAdminCaptureItemTriageForDependencies(admin, {
        id: createdItemId,
        status: "archived",
      }),
    );
    const activeAfterArchive = await mustOk(
      listAdminCaptureBacklogForDependencies(admin, {
        status: "all",
        sourceGroup: "all_work",
        includeArchived: false,
        limit: 20,
        search: "Live Supabase capture proof",
      }),
    );
    steps.push({
      name: "archived_excluded_from_active_list",
      ok: !activeAfterArchive.view.items.some((item) => item.id === createdItemId),
      detail: "archived disposable item is excluded from active all-list",
    });

    await probePublishableAccessBlocked(publishableClient, createdItemId, steps);
  }

  if (repoDerivedItemId) {
    await serviceClient.from("admin_capture_items").delete().eq("id", repoDerivedItemId);
    steps.push({
      name: "repo_derived_cleanup",
      ok: true,
      detail: "deleted disposable repo-derived proof item",
    });
  }

  if (createdItemId) {
    await serviceClient.from("admin_capture_items").delete().eq("id", createdItemId);
    steps.push({
      name: "cleanup",
      ok: true,
      detail: "deleted disposable live probe item",
    });
  }

  const ok = steps.every((step) => step.ok);
  console.log(
    JSON.stringify(
      {
        ok,
        mode: "live_supabase",
        projectUrlHost: new URL(env.url).host,
        steps,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

async function probeTableExists(
  client: ReturnType<typeof createClient<Database>>,
  table: "admin_capture_items",
  steps: LiveProbeStep[],
) {
  const error = await retryPostgrestSchemaProbe(async () => {
    const result = await client.from(table).select("id", { head: true, count: "exact" }).limit(1);
    return result.error;
  });

  steps.push({
    name: `${table}_exists`,
    ok: !error,
    detail: error ? classifySupabaseError(error) : "table is visible to service-role PostgREST",
  });
}

async function probeLegacyTableAbsent(
  client: ReturnType<typeof createClient<Database>>,
  table: string,
  steps: LiveProbeStep[],
) {
  const untypedClient = client as unknown as ReturnType<typeof createClient>;
  const error = await retryPostgrestSchemaProbe(async () => {
    const result = await untypedClient.from(table).select("id").limit(1);
    return result.error;
  });

  steps.push({
    name: `${table}_legacy_absent`,
    ok: error?.code === "PGRST205",
    detail:
      error?.code === "PGRST205"
        ? "legacy asset table is absent from service-role PostgREST"
        : error
          ? classifySupabaseError(error)
          : "legacy asset table still exists",
  });
}

async function probeLegacyBucketAbsent(
  client: ReturnType<typeof createClient<Database>>,
  steps: LiveProbeStep[],
) {
  const { data, error } = await client.storage.getBucket("admin-capture-assets");

  steps.push({
    name: "admin_capture_assets_bucket_legacy_absent",
    ok: Boolean(error) && /not found/i.test(error.message),
    detail:
      error && /not found/i.test(error.message)
        ? "legacy admin-capture-assets bucket is absent"
        : error
          ? classifySupabaseError(error)
          : `legacy bucket still exists with public=${String(data?.public)}`,
  });
}

async function probePublishableAccessBlocked(
  client: ReturnType<typeof createClient<Database>>,
  serviceCreatedItemId: string,
  steps: LiveProbeStep[],
) {
  const selectResult = await client
    .from("admin_capture_items")
    .select("id")
    .eq("id", serviceCreatedItemId)
    .maybeSingle();

  steps.push({
    name: "publishable_read_blocked",
    ok: !selectResult.data,
    detail: selectResult.error
      ? classifySupabaseError(selectResult.error)
      : "publishable client could not read service-created item",
  });

  const insertResult = await client
    .from("admin_capture_items")
    .insert({
      item_type: "bug",
      note: "Publishable write should be blocked.",
      page_url: "hito://admin/publishable-blocked",
      created_by_user_id: "publishable-client",
    })
    .select("id")
    .maybeSingle();

  if (insertResult.data?.id) {
    steps.push({
      name: "publishable_write_blocked",
      ok: false,
      detail: "publishable client inserted an admin capture item; RLS/policy is unsafe",
    });
    return;
  }

  steps.push({
    name: "publishable_write_blocked",
    ok: true,
    detail: insertResult.error
      ? classifySupabaseError(insertResult.error)
      : "publishable client insert returned no row",
  });

  const deleteResult = await client
    .from("admin_capture_items")
    .delete()
    .eq("id", serviceCreatedItemId)
    .select("id")
    .maybeSingle();

  steps.push({
    name: "publishable_delete_blocked",
    ok: !deleteResult.data,
    detail: deleteResult.error
      ? classifySupabaseError(deleteResult.error)
      : "publishable client could not delete service-created item",
  });
}

async function retryPostgrestSchemaProbe(
  probe: () => Promise<{ code?: string; message?: string } | null>,
) {
  let lastError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    lastError = await probe();

    if (!lastError || lastError.code !== "PGRST205") {
      return lastError;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return lastError;
}

function readLiveSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !publishableKey || !serviceKey) {
    throw new Error(
      "Live Supabase probe requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY.",
    );
  }

  return {
    url,
    publishableKey,
    serviceKey,
  };
}

function classifySupabaseError(error: { code?: string; message?: string; statusCode?: string }) {
  const code = error.code ?? error.statusCode ?? "unknown";
  const message = error.message ?? "Unknown Supabase error.";

  if (code === "PGRST205") {
    return "migration_not_applied_or_schema_cache: PostgREST cannot find the table";
  }

  if (/bucket not found/i.test(message) || code === "404") {
    return "bucket_missing";
  }

  if (/row-level security|permission denied|not authorized|jwt|rls/i.test(message)) {
    return `rls_or_auth_rejection: ${code}`;
  }

  return `${code}: ${message.slice(0, 160)}`;
}

function isRepoReadOnlyRejection(result: AdminCaptureResult<unknown>) {
  return !result.ok && result.reason === "repo_derived_read_only";
}

function repoMetadataForSourceType(sourceType: "active_plan") {
  const metadata = getAdminRepoWorkItemMetadata(sourceType);

  return {
    work_item_kind: metadata.workItemKind,
    work_item_lifecycle: metadata.workItemLifecycle,
    source_group: metadata.sourceGroup,
    source_group_label: metadata.sourceGroupLabel,
    source_label: metadata.sourceLabel,
  };
}

async function mustRejectRepoDerivedMutation(result: Promise<AdminCaptureResult<unknown>>) {
  const resolved = await result;

  assert.equal(resolved.ok, false);
  if (!resolved.ok) {
    assert.equal(resolved.reason, "repo_derived_read_only");
    assert.match(resolved.message, /Repo-derived backlog items are read-only/);
  }
}

async function mustOk<T>(
  result: Promise<AdminCaptureResult<T>>,
): Promise<Extract<AdminCaptureResult<T>, { ok: true }>> {
  const resolved = await result;

  if (!resolved.ok) {
    throw new Error(`${resolved.reason}: ${resolved.message}`);
  }

  return resolved;
}
