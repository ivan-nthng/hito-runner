import "@tanstack/react-start/server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type AdminCaptureBacklogView,
  type AdminCaptureCopyPromptView,
  type AdminCaptureCreateInput,
  type AdminCaptureFailureReason,
  type AdminCaptureItemIdInput,
  type AdminCaptureItemType,
  type AdminCaptureItemView,
  type AdminCaptureListInput,
  type AdminCaptureNoteAppendInput,
  type AdminCaptureNoteUpdateInput,
  type AdminCapturePriority,
  type AdminCaptureResult,
  type AdminCaptureStatus,
  type AdminCaptureTargetRole,
  type AdminCaptureTriageUpdateInput,
  type AdminDebugCaptureCapabilityView,
} from "@/lib/admin-capture";
import type { AdminAccessContext, AdminAccessResult } from "@/lib/admin-access.server";
import { requireAdminAccessForCurrentRequest } from "@/lib/admin-access.server";
import {
  getAdminRepoWorkItemMetadata,
  isAdminRepoWorkItemSourceType,
  isAdminWorkItemSourceGroup,
} from "@/lib/admin-work-items";
import type { Database, Json } from "@/lib/supabase/database";
import { hasSupabaseServerEnv } from "@/lib/supabase/env";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const QUICK_NOTE_PAGE_URL = "hito://admin/quick-note";
const NOTE_HISTORY_LIMIT = 20;
const REDACTED_METADATA_VALUE = "[redacted]";
const SECRET_METADATA_KEY_PATTERNS = [
  "token",
  "secret",
  "password",
  "cookie",
  "session",
  "authorization",
  "api_key",
  "apikey",
  "bearer",
  "supabase",
  "jwt",
];
const SECRET_METADATA_VALUE_PATTERN =
  /\b(bearer\s+[a-z0-9._-]+|authorization:|password=|token=|secret=|cookie=|session=|jwt=|api[_-]?key=|eyJ[a-z0-9_-]{8,}\.[a-z0-9_-]{8,})/i;

type AdminCaptureItemRow = Database["public"]["Tables"]["admin_capture_items"]["Row"];
type AdminCaptureItemInsert = Database["public"]["Tables"]["admin_capture_items"]["Insert"];
type AdminCaptureItemUpdate = Database["public"]["Tables"]["admin_capture_items"]["Update"];
type RepoWorkItemView = NonNullable<AdminCaptureItemView["repoWorkItem"]>;

export type AdminCaptureRow = AdminCaptureItemRow;

export interface AdminCaptureRepository {
  createItem(input: AdminCaptureItemInsert): Promise<AdminCaptureRow>;
  listItems(input: AdminCaptureListInput): Promise<AdminCaptureRow[]>;
  getItem(id: string): Promise<AdminCaptureRow | null>;
  updateItem(id: string, patch: AdminCaptureItemUpdate): Promise<AdminCaptureRow | null>;
  deleteItem(id: string): Promise<boolean>;
}

export interface AdminCaptureDependencies {
  adminAccess: () => Promise<AdminAccessResult>;
  repository: AdminCaptureRepository | null;
  now?: () => Date;
}

export async function getAdminCaptureAvailabilityForCurrentRequest(): Promise<
  AdminCaptureResult<{ enabled: true }>
> {
  const dependencies = await buildCurrentDependencies();
  const adminAccess = await dependencies.adminAccess();

  if (!adminAccess.ok) {
    return failure(adminAccess.reason, adminAccess.message);
  }

  if (!dependencies.repository) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before capture backlog can load.",
    );
  }

  return {
    ok: true,
    enabled: true,
  };
}

export async function getAdminDebugCaptureCapabilityForCurrentRequest(): Promise<
  AdminCaptureResult<{ probe: AdminDebugCaptureCapabilityView }>
> {
  return getAdminDebugCaptureCapabilityForDependencies(await buildCurrentDependencies());
}

export async function listAdminCaptureBacklogForCurrentRequest(
  input: AdminCaptureListInput,
): Promise<AdminCaptureResult<{ view: AdminCaptureBacklogView }>> {
  return listAdminCaptureBacklogForDependencies(await buildCurrentDependencies(), input);
}

export async function getAdminCaptureItemForCurrentRequest(
  input: AdminCaptureItemIdInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  return getAdminCaptureItemForDependencies(await buildCurrentDependencies(), input);
}

export async function createAdminCaptureItemForCurrentRequest(
  input: AdminCaptureCreateInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  return createAdminCaptureItemForDependencies(await buildCurrentDependencies(), input);
}

export async function updateAdminCaptureItemTriageForCurrentRequest(
  input: AdminCaptureTriageUpdateInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  return updateAdminCaptureItemTriageForDependencies(await buildCurrentDependencies(), input);
}

export async function updateAdminCaptureItemNoteForCurrentRequest(
  input: AdminCaptureNoteUpdateInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  return updateAdminCaptureItemNoteForDependencies(await buildCurrentDependencies(), input);
}

export async function appendAdminCaptureItemNoteForCurrentRequest(
  input: AdminCaptureNoteAppendInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  return appendAdminCaptureItemNoteForDependencies(await buildCurrentDependencies(), input);
}

export async function deleteAdminCaptureQuickNoteForCurrentRequest(
  input: AdminCaptureItemIdInput,
): Promise<AdminCaptureResult<{ deletedId: string }>> {
  return deleteAdminCaptureQuickNoteForDependencies(await buildCurrentDependencies(), input);
}

export async function getAdminCaptureCopyPromptForCurrentRequest(
  input: AdminCaptureItemIdInput,
): Promise<AdminCaptureResult<{ prompt: AdminCaptureCopyPromptView }>> {
  return getAdminCaptureCopyPromptForDependencies(await buildCurrentDependencies(), input);
}

export async function getAdminDebugCaptureCapabilityForDependencies(
  dependencies: AdminCaptureDependencies,
): Promise<AdminCaptureResult<{ probe: AdminDebugCaptureCapabilityView }>> {
  const accessResult = await requireCaptureAdmin(dependencies);

  if (!accessResult.ok) {
    return accessResult;
  }

  return {
    ok: true,
    probe: {
      generatedAt: dependencies.now?.().toISOString() ?? new Date().toISOString(),
      capability: "admin_debug_capture",
      enabled: true,
      capabilities: {
        adminCapture: accessResult.admin.capabilities.adminCapture,
        adminDebugCapture: accessResult.admin.capabilities.adminDebugCapture,
      },
      authority: {
        owner: "admin",
        provider: accessResult.admin.provider,
        sessionSource: accessResult.admin.sessionSource,
        runtimeClass: accessResult.admin.runtimeClass,
      },
      identityBoundary: {
        runnerAuthIgnored: true,
        testerAuthIgnored: true,
        productEntitlementsIgnored: true,
        productRouteStateIgnored: true,
      },
    },
  };
}

export async function listAdminCaptureBacklogForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureListInput,
): Promise<AdminCaptureResult<{ view: AdminCaptureBacklogView }>> {
  const accessResult = await requireCaptureAdmin(dependencies);

  if (!accessResult.ok) {
    return accessResult;
  }

  if (!dependencies.repository) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before capture backlog can load.",
    );
  }

  try {
    const rows = await dependencies.repository.listItems(input);
    const items = rows.map(mapItemView);
    const statusCounts = buildStatusCounts(items);

    return {
      ok: true,
      view: {
        generatedAt: dependencies.now?.().toISOString() ?? new Date().toISOString(),
        total: rows.length,
        shown: items.length,
        items,
        statusCounts,
      },
    };
  } catch {
    return failure("capture_load_failed", "Capture backlog could not be loaded.");
  }
}

export async function getAdminCaptureItemForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureItemIdInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  const accessResult = await requireCaptureAdmin(dependencies);

  if (!accessResult.ok) {
    return accessResult;
  }

  if (!dependencies.repository) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before capture backlog can load.",
    );
  }

  try {
    const row = await dependencies.repository.getItem(input.id);

    if (!row) {
      return failure("capture_not_found", "Capture item was not found.");
    }

    return {
      ok: true,
      item: mapItemView(row),
    };
  } catch {
    return failure("capture_load_failed", "Capture item could not be loaded.");
  }
}

export async function createAdminCaptureItemForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureCreateInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  const accessResult = await requireCaptureAdmin(dependencies);

  if (!accessResult.ok) {
    return accessResult;
  }

  if (!dependencies.repository) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before capture backlog can save.",
    );
  }

  const now = dependencies.now?.() ?? new Date();
  const metadata = buildMetadataWithNoteHistory(stripRepoImportMetadata(input.metadata), {
    action: "create",
    admin: accessResult.admin,
    at: now,
    note: input.note,
  });
  const insert: AdminCaptureItemInsert = {
    item_type: input.itemType,
    status: "new",
    priority: input.priority ?? null,
    target_role: input.targetRole ?? null,
    title: normalizeTitle(input.title ?? deriveTitle(input)),
    note: input.note,
    page_url: input.pageUrl?.trim() || QUICK_NOTE_PAGE_URL,
    route: input.route ?? null,
    created_by_user_id: accessResult.admin.adminUserId,
    created_by_label: accessResult.admin.adminLabel,
    viewport_width: input.viewportWidth ?? null,
    viewport_height: input.viewportHeight ?? null,
    element_text: input.elementText ?? null,
    selector: input.selector ?? null,
    dom_path: input.domPath ?? null,
    nearby_heading: input.nearbyHeading ?? null,
    bounding_rect: toJsonOrNull(input.boundingRect ?? null),
    metadata,
  };

  try {
    const row = await dependencies.repository.createItem(insert);

    return {
      ok: true,
      item: mapItemView(row),
    };
  } catch {
    return failure("capture_create_failed", "Capture item could not be saved.");
  }
}

export async function updateAdminCaptureItemTriageForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureTriageUpdateInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  const accessResult = await requireCaptureAdmin(dependencies);

  if (!accessResult.ok) {
    return accessResult;
  }

  if (!dependencies.repository) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before capture backlog can update.",
    );
  }

  const now = dependencies.now?.() ?? new Date();

  try {
    const existing = await dependencies.repository.getItem(input.id);

    if (!existing) {
      return failure("capture_not_found", "Capture item was not found.");
    }

    if (isRepoDerivedRow(existing)) {
      return repoDerivedReadOnlyFailure();
    }
  } catch {
    return failure("capture_load_failed", "Capture item could not be loaded.");
  }

  const patch: AdminCaptureItemUpdate = {};

  if (input.itemType !== undefined) {
    patch.item_type = input.itemType;
  }

  if (input.status !== undefined) {
    patch.status = input.status;
    patch.archived_at = input.status === "archived" ? now.toISOString() : null;
  }

  if ("priority" in input) {
    patch.priority = input.priority ?? null;
  }

  if ("targetRole" in input) {
    patch.target_role = input.targetRole ?? null;
  }

  if ("title" in input) {
    patch.title = normalizeTitle(input.title);
  }

  try {
    const row = await dependencies.repository.updateItem(input.id, patch);

    if (!row) {
      return failure("capture_not_found", "Capture item was not found.");
    }

    return {
      ok: true,
      item: mapItemView(row),
    };
  } catch {
    return failure("capture_update_failed", "Capture item could not be updated.");
  }
}

export async function updateAdminCaptureItemNoteForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureNoteUpdateInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  return mutateAdminCaptureNote(dependencies, {
    id: input.id,
    note: input.note,
    mode: "update",
  });
}

export async function appendAdminCaptureItemNoteForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureNoteAppendInput,
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  return mutateAdminCaptureNote(dependencies, {
    id: input.id,
    note: input.note,
    mode: "append",
  });
}

export async function getAdminCaptureCopyPromptForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureItemIdInput,
): Promise<AdminCaptureResult<{ prompt: AdminCaptureCopyPromptView }>> {
  const itemResult = await getAdminCaptureItemForDependencies(dependencies, input);

  if (!itemResult.ok) {
    return itemResult;
  }

  if (!itemResult.item.targetRole) {
    return failure("prompt_not_ready", "Set a target role before copying a role-ready prompt.");
  }

  try {
    return {
      ok: true,
      prompt: buildAdminCaptureCopyPrompt(itemResult.item),
    };
  } catch {
    return failure("prompt_generation_failed", "Capture prompt could not be generated.");
  }
}

export async function deleteAdminCaptureQuickNoteForDependencies(
  dependencies: AdminCaptureDependencies,
  input: AdminCaptureItemIdInput,
): Promise<AdminCaptureResult<{ deletedId: string }>> {
  const accessResult = await requireCaptureAdmin(dependencies);

  if (!accessResult.ok) {
    return accessResult;
  }

  if (!dependencies.repository) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before capture backlog can delete quick notes.",
    );
  }

  try {
    const existing = await dependencies.repository.getItem(input.id);

    if (!existing) {
      return failure("capture_not_found", "Capture item was not found.");
    }

    const source = getAdminCaptureRowSource(existing);

    if (source === "repo_import") {
      return repoDerivedReadOnlyFailure();
    }

    if (source !== "quick_note") {
      return failure(
        "quick_note_delete_only",
        "Only manual quick notes can be deleted from Backlog.",
      );
    }

    const deleted = await dependencies.repository.deleteItem(input.id);

    if (!deleted) {
      return failure("capture_not_found", "Capture item was not found.");
    }

    return {
      ok: true,
      deletedId: input.id,
    };
  } catch {
    return failure("capture_delete_failed", "Quick note could not be deleted.");
  }
}

export function buildAdminCaptureCopyPrompt(
  item: AdminCaptureItemView,
): AdminCaptureCopyPromptView {
  if (!item.targetRole) {
    throw new Error("Target role is required for role-ready prompt generation.");
  }

  const targetRole = item.targetRole;
  const roleLabel = formatTargetRole(targetRole).toUpperCase();
  const selectedElement =
    item.selectedElement.text || item.selectedElement.nearbyHeading || "No selected element";
  const selector = item.selectedElement.selector ?? item.selectedElement.domPath ?? "Not captured";
  const metadataSummary = summarizeMetadata(item.metadata);
  const repoSource = getRepoImportSource(item.metadata);
  const contextSummary = [
    `Type: ${formatItemType(item.itemType)}`,
    `Status: ${formatStatus(item.status)}`,
    `Priority: ${item.priority ? formatPriority(item.priority) : "Unset"}`,
    `Target role: ${formatTargetRole(targetRole)}`,
    `Route: ${item.route ?? "Not captured"}`,
    `URL: ${item.pageUrl}`,
    ...(repoSource
      ? [`Source path: ${repoSource.sourcePath}`, `Source type: ${repoSource.sourceType}`]
      : []),
  ].join("\n");

  const prompt = [
    `ROLE: ${roleLabel}`,
    "",
    "TASK:",
    item.title,
    "",
    "STAGE:",
    `${roleLabel} implementation / admin backlog handoff`,
    "",
    "CONTEXT:",
    `- Type: ${formatItemType(item.itemType)}`,
    `- Status/Priority: ${formatStatus(item.status)} / ${
      item.priority ? formatPriority(item.priority) : "Unset"
    }`,
    `- Target role: ${formatTargetRole(targetRole)}`,
    `- Route: ${item.route ?? "Not captured"}`,
    `- URL: ${item.pageUrl}`,
    ...(repoSource
      ? [
          `- Source path: ${repoSource.sourcePath}`,
          `- Source type: ${repoSource.sourceType}`,
          `- Work item status: ${repoSource.workItemStatus ?? "Not captured"}`,
        ]
      : []),
    `- Selected element: ${selectedElement}`,
    `- Nearby heading: ${item.selectedElement.nearbyHeading ?? "Not captured"}`,
    `- Selector/DOM path: ${selector}`,
    `- Admin note: ${item.note}`,
    "- Screenshot assets: Not supported in the current backend contract.",
    `- Metadata: ${metadataSummary}`,
    "",
    "CONSTRAINTS:",
    "- Inspect current code before changing.",
    "- Preserve canonical Hito architecture and backend-owned truth boundaries.",
    "- Do not auto-send, auto-dispatch, or mutate unrelated work.",
    "- Do not broaden the scope beyond this captured backlog item.",
    "- If UI work is needed, reuse Hito DS primitives/classes; do not create a separate backlog UI kit.",
    "- If browser QA is needed, use the built-in Codex browser first and report the browser path.",
    "",
    "OUTPUT:",
    "Use the project role output format.",
  ].join("\n");

  return {
    itemId: item.id,
    targetRole,
    generatedAt: new Date().toISOString(),
    prompt,
    contextSummary,
  };
}

async function mutateAdminCaptureNote(
  dependencies: AdminCaptureDependencies,
  input: {
    id: string;
    note: string;
    mode: "append" | "update";
  },
): Promise<AdminCaptureResult<{ item: AdminCaptureItemView }>> {
  const accessResult = await requireCaptureAdmin(dependencies);

  if (!accessResult.ok) {
    return accessResult;
  }

  if (!dependencies.repository) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before capture backlog can update.",
    );
  }

  try {
    const existing = await dependencies.repository.getItem(input.id);

    if (!existing) {
      return failure("capture_not_found", "Capture item was not found.");
    }

    if (isRepoDerivedRow(existing)) {
      return repoDerivedReadOnlyFailure();
    }

    const now = dependencies.now?.() ?? new Date();
    const note =
      input.mode === "append"
        ? `${existing.note}\n\n${input.note}`.trim().slice(0, 4000)
        : input.note;
    const metadata = buildMetadataWithNoteHistory(existing.metadata, {
      action: input.mode === "append" ? "append_note" : "update_note",
      admin: accessResult.admin,
      at: now,
      note: input.note,
    });
    const row = await dependencies.repository.updateItem(input.id, {
      note,
      metadata,
    });

    if (!row) {
      return failure("capture_not_found", "Capture item was not found.");
    }

    return {
      ok: true,
      item: mapItemView(row),
    };
  } catch {
    return failure("capture_update_failed", "Capture item note could not be updated.");
  }
}

async function buildCurrentDependencies(): Promise<AdminCaptureDependencies> {
  const supabase = hasSupabaseServerEnv ? createAdminSupabaseClient() : null;

  return {
    adminAccess: () => requireAdminAccessForCurrentRequest(supabase),
    repository: supabase ? createSupabaseAdminCaptureRepository(supabase) : null,
  };
}

export function createSupabaseAdminCaptureRepository(
  supabase: SupabaseClient<Database>,
): AdminCaptureRepository {
  return {
    async createItem(input) {
      const { data, error } = await supabase
        .from("admin_capture_items")
        .insert(input)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Capture item insert failed.");
      }

      return data as AdminCaptureRow;
    },
    async listItems(input) {
      let query = supabase
        .from("admin_capture_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (input.status !== "all") {
        query = query.eq("status", input.status);
      }

      if (!input.includeArchived && input.status !== "archived") {
        query = query.is("archived_at", null);
      }

      if (input.itemType) {
        query = query.eq("item_type", input.itemType);
      }

      if (input.priority) {
        query = query.eq("priority", input.priority);
      }

      if (input.targetRole) {
        query = query.eq("target_role", input.targetRole);
      }

      if (input.sourceGroup !== "all_work") {
        query = query.eq("metadata->>source_group", input.sourceGroup);
      }

      if (input.search) {
        const term = `%${sanitizeSearchTerm(input.search)}%`;
        query = query.or(
          [
            `title.ilike.${term}`,
            `note.ilike.${term}`,
            `route.ilike.${term}`,
            `page_url.ilike.${term}`,
            `element_text.ilike.${term}`,
            `nearby_heading.ilike.${term}`,
            `target_role.ilike.${term}`,
          ].join(","),
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as AdminCaptureRow[];
    },
    async getItem(id) {
      const { data, error } = await supabase
        .from("admin_capture_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return (data as AdminCaptureRow | null) ?? null;
    },
    async updateItem(id, patch) {
      const { data, error } = await supabase
        .from("admin_capture_items")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return (data as AdminCaptureRow | null) ?? null;
    },
    async deleteItem(id) {
      const { data, error } = await supabase
        .from("admin_capture_items")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return Boolean(data);
    },
  };
}

async function requireCaptureAdmin(dependencies: AdminCaptureDependencies): Promise<
  | {
      ok: true;
      admin: AdminAccessContext;
    }
  | Extract<AdminCaptureResult<never>, { ok: false }>
> {
  const access = await dependencies.adminAccess();

  if (!access.ok) {
    return failure(access.reason, access.message);
  }

  return access;
}

function mapItemView(row: AdminCaptureRow): AdminCaptureItemView {
  const source = getAdminCaptureRowSource(row);
  const repoWorkItem = mapRepoWorkItemView(row.metadata);

  return {
    id: row.id,
    itemType: row.item_type as AdminCaptureItemType,
    status: row.status as AdminCaptureStatus,
    priority: row.priority as AdminCapturePriority | null,
    targetRole: row.target_role as AdminCaptureTargetRole | null,
    title: row.title ?? deriveTitleFromRow(row),
    note: row.note,
    pageUrl: row.page_url,
    route: row.route,
    createdByUserId: row.created_by_user_id,
    createdByLabel: row.created_by_label,
    viewport: {
      width: row.viewport_width,
      height: row.viewport_height,
    },
    selectedElement: {
      text: row.element_text,
      selector: row.selector,
      domPath: row.dom_path,
      nearbyHeading: row.nearby_heading,
      boundingRect: row.bounding_rect,
    },
    metadata: row.metadata,
    source,
    repoWorkItem,
    promptReady: Boolean(row.target_role && row.note),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function getAdminCaptureRowSource(row: AdminCaptureItemRow): AdminCaptureItemView["source"] {
  if (isRepoImportMetadata(row.metadata)) {
    return "repo_import";
  }

  if (hasCapturedElementContext(row)) {
    return "captured_ui";
  }

  return "quick_note";
}

function buildStatusCounts(items: AdminCaptureItemView[]): Record<AdminCaptureStatus, number> {
  return {
    new: countStatus(items, "new"),
    in_review: countStatus(items, "in_review"),
    ready_for_codex: countStatus(items, "ready_for_codex"),
    done: countStatus(items, "done"),
    archived: countStatus(items, "archived"),
  };
}

function countStatus(items: AdminCaptureItemView[], status: AdminCaptureStatus) {
  return items.filter((item) => item.status === status).length;
}

function buildMetadataWithNoteHistory(
  input: unknown,
  event: {
    action: string;
    admin: AdminAccessContext;
    at: Date;
    note: string;
  },
): Json {
  const metadata = normalizeJsonObject(input);
  const existingHistory = Array.isArray(metadata.note_history) ? metadata.note_history : [];
  const safeHistory = existingHistory
    .filter(isJsonObject)
    .slice(-NOTE_HISTORY_LIMIT + 1)
    .map((entry) => ({ ...entry }));

  safeHistory.push({
    action: event.action,
    at: event.at.toISOString(),
    by: event.admin.adminLabel,
    note_excerpt: event.note.slice(0, 500),
  });

  return {
    ...metadata,
    note_history: safeHistory,
  } as Json;
}

function deriveTitle(input: AdminCaptureCreateInput) {
  return (
    input.title ||
    input.elementText ||
    input.nearbyHeading ||
    input.note.split(/\n|\./)[0] ||
    "Captured backlog item"
  );
}

function deriveTitleFromRow(row: AdminCaptureItemRow) {
  return (
    normalizeTitle(row.element_text ?? row.nearby_heading ?? row.note) ?? "Captured backlog item"
  );
}

function normalizeTitle(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
}

function hasCapturedElementContext(row: AdminCaptureItemRow) {
  return Boolean(row.element_text || row.selector || row.dom_path || row.nearby_heading);
}

function isRepoImportMetadata(metadata: Json) {
  return isJsonObject(metadata) && metadata.imported_from_repo === true;
}

function isRepoDerivedRow(row: AdminCaptureItemRow) {
  return isRepoImportMetadata(row.metadata);
}

function stripRepoImportMetadata(input: unknown): Json {
  const metadata = normalizeJsonObject(input);

  delete metadata.imported_from_repo;
  delete metadata.source_path;
  delete metadata.source_type;
  delete metadata.work_item_kind;
  delete metadata.work_item_lifecycle;
  delete metadata.source_group;
  delete metadata.source_group_label;
  delete metadata.source_label;
  delete metadata.work_item_status;
  delete metadata.import_version;
  delete metadata.admin_capture_status;
  delete metadata.admin_capture_priority;
  delete metadata.admin_capture_target_role;

  return metadata as Json;
}

function sanitizeSearchTerm(input: string) {
  return input.replace(/[%(),]/g, " ").trim();
}

function summarizeMetadata(metadata: Json) {
  if (!isJsonObject(metadata)) {
    return "None";
  }

  const entries = Object.entries(metadata).filter(([key]) => key !== "note_history");

  if (entries.length === 0) {
    return "None";
  }

  return entries
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${formatMetadataValue(key, value)}`)
    .join("; ");
}

function getRepoImportSource(metadata: Json) {
  if (!isJsonObject(metadata) || metadata.imported_from_repo !== true) {
    return null;
  }

  const sourcePath = typeof metadata.source_path === "string" ? metadata.source_path : null;
  const sourceType = typeof metadata.source_type === "string" ? metadata.source_type : null;

  if (!sourcePath || !sourceType) {
    return null;
  }

  return {
    sourcePath: sourcePath.slice(0, 300),
    sourceType: sourceType.slice(0, 80),
    workItemStatus:
      typeof metadata.work_item_status === "string" ? metadata.work_item_status.slice(0, 80) : null,
  };
}

function mapRepoWorkItemView(metadata: Json): AdminCaptureItemView["repoWorkItem"] {
  if (!isJsonObject(metadata) || metadata.imported_from_repo !== true) {
    return null;
  }

  const sourcePath = typeof metadata.source_path === "string" ? metadata.source_path : null;
  const sourceType = typeof metadata.source_type === "string" ? metadata.source_type : null;

  if (!sourcePath || !sourceType || !isAdminRepoWorkItemSourceType(sourceType)) {
    return null;
  }

  const fallback = getAdminRepoWorkItemMetadata(sourceType);
  const sourceGroup =
    typeof metadata.source_group === "string" &&
    metadata.source_group !== "all_work" &&
    isAdminWorkItemSourceGroup(metadata.source_group)
      ? metadata.source_group
      : fallback.sourceGroup;

  return {
    sourcePath: sourcePath.slice(0, 300),
    sourceType,
    workItemKind:
      typeof metadata.work_item_kind === "string"
        ? (metadata.work_item_kind as RepoWorkItemView["workItemKind"])
        : fallback.workItemKind,
    workItemLifecycle:
      typeof metadata.work_item_lifecycle === "string"
        ? (metadata.work_item_lifecycle as RepoWorkItemView["workItemLifecycle"])
        : fallback.workItemLifecycle,
    sourceGroup,
    sourceGroupLabel:
      typeof metadata.source_group_label === "string"
        ? metadata.source_group_label.slice(0, 80)
        : fallback.sourceGroupLabel,
    sourceLabel:
      typeof metadata.source_label === "string"
        ? metadata.source_label.slice(0, 80)
        : fallback.sourceLabel,
    workItemStatus:
      typeof metadata.work_item_status === "string" ? metadata.work_item_status.slice(0, 80) : null,
  };
}

function formatMetadataValue(key: string, value: Json | undefined): string {
  if (isSensitiveMetadataKey(key)) {
    return REDACTED_METADATA_VALUE;
  }

  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    if (isSensitiveMetadataValue(value)) {
      return REDACTED_METADATA_VALUE;
    }

    return value.slice(0, 120);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.length} item(s)]`;
  }

  return "{object}";
}

function isSensitiveMetadataKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const segments = normalized.split("_").filter(Boolean);

  if (segments.includes("key") || segments.includes("auth")) {
    return true;
  }

  return SECRET_METADATA_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function isSensitiveMetadataValue(value: string) {
  return SECRET_METADATA_VALUE_PATTERN.test(value);
}

function isJsonObject(value: unknown): value is { [key: string]: Json | undefined } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeJsonObject(value: unknown): { [key: string]: Json | undefined } {
  try {
    const parsed = JSON.parse(JSON.stringify(value ?? {}));

    return isJsonObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function toJsonOrNull(value: unknown): Json | null {
  return value === null || value === undefined ? null : (value as Json);
}

function formatItemType(value: AdminCaptureItemType) {
  switch (value) {
    case "bug":
      return "Bug";
    case "change_request":
      return "Change request";
    case "context_capture":
      return "Context capture";
  }
}

function formatStatus(value: AdminCaptureStatus) {
  switch (value) {
    case "new":
      return "New";
    case "in_review":
      return "In review";
    case "ready_for_codex":
      return "Ready for Codex";
    case "done":
      return "Done";
    case "archived":
      return "Archived";
  }
}

function formatPriority(value: AdminCapturePriority) {
  switch (value) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
  }
}

function formatTargetRole(value: AdminCaptureTargetRole) {
  switch (value) {
    case "architect":
      return "Architect";
    case "backend":
      return "Backend";
    case "frontend":
      return "Frontend";
    case "designer":
      return "Designer";
    case "copy":
      return "Copy";
    case "qa":
      return "QA";
    case "prompt_engineer":
      return "Prompt Engineer";
    case "running_coach":
      return "Running Coach";
  }
}

function failure<T = never>(
  reason: AdminCaptureFailureReason,
  message: string,
  issues?: string[],
): AdminCaptureResult<T> {
  return {
    ok: false,
    reason,
    message,
    ...(issues ? { issues } : {}),
  };
}

function repoDerivedReadOnlyFailure<T = never>(): AdminCaptureResult<T> {
  return failure(
    "repo_derived_read_only",
    "Repo-derived backlog items are read-only. Edit the markdown source file and refresh the mirror.",
  );
}
