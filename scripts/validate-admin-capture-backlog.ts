import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  appendAdminCaptureItemNoteForDependencies,
  createAdminCaptureItemForDependencies,
  createSupabaseAdminCaptureRepository,
  getAdminCaptureCopyPromptForDependencies,
  getAdminCaptureItemForDependencies,
  listAdminCaptureBacklogForDependencies,
  updateAdminCaptureItemNoteForDependencies,
  type AdminCaptureDependencies,
  type AdminCaptureRepository,
  type AdminCaptureRowWithAssets,
} from "../src/lib/admin-capture.server";
import { updateAdminCaptureItemTriageForDependencies } from "../src/lib/admin-capture.server";
import type { AdminCaptureResult } from "../src/lib/admin-capture";
import type { Database } from "../src/lib/supabase/database";

type ItemInsert = Database["public"]["Tables"]["admin_capture_items"]["Insert"];
type ItemUpdate = Database["public"]["Tables"]["admin_capture_items"]["Update"];
type LiveProbeStep = {
  name: string;
  ok: boolean;
  detail: string;
};

class MemoryAdminCaptureRepository implements AdminCaptureRepository {
  #items = new Map<string, AdminCaptureRowWithAssets>();

  async createItem(input: ItemInsert): Promise<AdminCaptureRowWithAssets> {
    const now = "2026-05-28T12:00:00.000Z";
    const row: AdminCaptureRowWithAssets = {
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
      admin_capture_assets: [],
    };

    this.#items.set(row.id, row);

    return row;
  }

  async listItems(input: {
    status: "new" | "in_review" | "ready_for_codex" | "done" | "archived" | "all";
    includeArchived: boolean;
    limit: number;
    search?: string | null;
    itemType?: string | null;
    priority?: string | null;
    targetRole?: string | null;
  }): Promise<AdminCaptureRowWithAssets[]> {
    const search = input.search?.toLowerCase() ?? null;

    return Array.from(this.#items.values())
      .filter((item) => input.status === "all" || item.status === input.status)
      .filter((item) => input.includeArchived || input.status === "archived" || !item.archived_at)
      .filter((item) => !input.itemType || item.item_type === input.itemType)
      .filter((item) => !input.priority || item.priority === input.priority)
      .filter((item) => !input.targetRole || item.target_role === input.targetRole)
      .filter((item) => {
        if (!search) {
          return true;
        }

        return [item.title, item.note, item.route, item.page_url, item.element_text]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search));
      })
      .slice(0, input.limit);
  }

  async getItem(id: string): Promise<AdminCaptureRowWithAssets | null> {
    return this.#items.get(id) ?? null;
  }

  async updateItem(id: string, patch: ItemUpdate): Promise<AdminCaptureRowWithAssets | null> {
    const existing = this.#items.get(id);

    if (!existing) {
      return null;
    }

    const updated: AdminCaptureRowWithAssets = {
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
}

const adminDependencies = (repository: AdminCaptureRepository): AdminCaptureDependencies => ({
  adminAccess: async () => ({
    ok: true,
    admin: {
      adminUserId: "hito-admin",
      adminLabel: "admin",
      provider: "admin",
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
    includeArchived: true,
    limit: 50,
  });
  assert.equal(nonAdminList.ok, false);
  if (!nonAdminList.ok) {
    assert.equal(nonAdminList.reason, "admin_required");
  }

  const listed = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "new",
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

  await mustOk(
    updateAdminCaptureItemTriageForDependencies(admin, {
      id: created.item.id,
      status: "archived",
    }),
  );

  const activeAfterArchive = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "all",
      includeArchived: false,
      limit: 50,
    }),
  );
  assert.equal(activeAfterArchive.view.items.length, 0);

  const archived = await mustOk(
    listAdminCaptureBacklogForDependencies(admin, {
      status: "archived",
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
      includeArchived: false,
      limit: 50,
      search: "Imported canonical markdown mirror",
    }),
  );
  assert.equal(repoList.view.items.length, 1);
  assert.equal(repoList.view.items[0]?.source, "repo_import");

  const repoDetail = await mustOk(
    getAdminCaptureItemForDependencies(admin, { id: repoDerivedRow.id }),
  );
  assert.equal(repoDetail.item.source, "repo_import");

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
    updateAdminCaptureItemNoteForDependencies(admin, {
      id: repoDerivedRow.id,
      note: "Should not replace.",
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

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "deterministic",
        checks: [
          "admin_create_list_read_update",
          "non_admin_rejected",
          "deterministic_prompt",
          "metadata_redaction",
          "archived_excluded_from_active_list",
          "repo_derived_list_detail_copy",
          "repo_derived_markdown_prompt_copy",
          "repo_derived_read_only",
        ],
        promptLength: prompt.prompt.prompt.length,
      },
      null,
      2,
    ),
  );
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
  await probeTableExists(serviceClient, "admin_capture_assets", steps);
  await probePrivateBucket(serviceClient, steps);

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
        repoDetail.item.source === "repo_import",
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
    const repoUpdateNoteBlocked = await updateAdminCaptureItemNoteForDependencies(admin, {
      id: repoDerivedItemId,
      note: "Should not replace.",
    });
    const repoAfterRejectedMutations = await repository.getItem(repoDerivedItemId);
    steps.push({
      name: "repo_derived_mutation_blocked",
      ok:
        isRepoReadOnlyRejection(repoTriageBlocked) &&
        isRepoReadOnlyRejection(repoAppendBlocked) &&
        isRepoReadOnlyRejection(repoUpdateNoteBlocked) &&
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
  table: "admin_capture_items" | "admin_capture_assets",
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

async function probePrivateBucket(
  client: ReturnType<typeof createClient<Database>>,
  steps: LiveProbeStep[],
) {
  const { data, error } = await client.storage.getBucket("admin-capture-assets");

  steps.push({
    name: "admin_capture_assets_bucket_exists_private",
    ok: !error && data?.public === false,
    detail: error
      ? classifySupabaseError(error)
      : `bucket exists with public=${String(data?.public)}`,
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
    return "bucket_missing: admin-capture-assets is not available";
  }

  if (/row-level security|permission denied|not authorized|jwt|rls/i.test(message)) {
    return `rls_or_auth_rejection: ${code}`;
  }

  return `${code}: ${message.slice(0, 160)}`;
}

function isRepoReadOnlyRejection(result: AdminCaptureResult<unknown>) {
  return !result.ok && result.reason === "repo_derived_read_only";
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
