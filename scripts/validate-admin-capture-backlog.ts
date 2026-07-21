import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import {
  buildStaleRepoMirrorMetadata,
  findStaleActiveRepoMirrorRows,
} from "./import-repo-work-items-to-admin-backlog";
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
import { getAdminRepoWorkItemMetadata } from "../src/lib/admin-work-items";
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
    throw new Error("Forced backlog read failure.");
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
  await assertCanonicalBacklogReadContract();
  await assertSingleRouteBacklogRead();

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
        sessionToken: "super-secret-session-token",
        api_key: "super-secret-api-key",
        authHeader: "Bearer abc.def.ghi",
      },
    }),
  );

  assert.equal(created.item.status, "new");
  assert.equal(created.item.promptReady, true);

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

  const failedList = await listAdminCaptureBacklogForDependencies(
    adminDependencies(new FailingAdminCaptureReadRepository()),
    {
      status: "all",
      sourceGroup: "all_work",
      includeArchived: false,
      limit: 50,
    },
  );
  assert.equal(failedList.ok, false);
  if (!failedList.ok) {
    assert.equal(failedList.reason, "capture_load_failed");
  }

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
    status: "ready_for_codex",
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
      source_path: "docs/plans/active/example.md",
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
  assert.equal(repoAfterRejectedMutations?.status, "ready_for_codex");
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
          "stale_repo_mirror_cleanup_policy",
        ],
        promptLength: prompt.prompt.prompt.length,
      },
      null,
      2,
    ),
  );
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
      status: "ready_for_codex",
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
        repoAfterRejectedMutations?.status === "ready_for_codex" &&
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
