import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  adminRepoWorkItemSourceTypes,
  getAdminRepoWorkItemMetadata,
  type AdminRepoWorkItemKind,
  type AdminRepoWorkItemLifecycle,
  type AdminRepoWorkItemSourceType,
} from "../src/lib/admin-work-items";
import {
  CANONICAL_MARKDOWN_FIELDS,
  buildRepoMirrorNote,
  extractSectionText,
  extractStatusText,
  extractTitle,
  firstMeaningfulLine,
  inferItemType,
  inferTargetRole,
  inferWorkItemStatus,
  jsonValuesEqual,
  mapMarkdownTypeToAdminItemType,
  mapMirroredWorkItemStatusToAdminStatus,
  normalizeMetadata,
  normalizeSourcePath,
  parseCanonicalMarkdown,
  sourceKey,
  stripMarkdown,
  titleFromFilename,
  truncate,
  workItemIdentityKey,
  type AdminItemType,
  type AdminPriority,
  type AdminStatus,
  type CanonicalMetadataState,
  type CanonicalMarkdownField,
  type TargetRole,
  type WorkItemStatus,
} from "./admin-backlog-import/markdown";
import {
  buildCurrentRepoMirrorKeys,
  buildExistingRepoMirrorIndex,
  countRepoMirrorIdentityDuplicates,
  findDuplicateWorkItemIds,
  findExistingRepoMirrorRow,
  type DuplicateWorkItemId,
} from "./admin-backlog-import/identity";
import sourceManifest from "./admin-backlog-import/sources.json";
import type { Database, Json } from "../src/lib/supabase/database";

const IMPORT_VERSION = "repo-work-items-v2";
const IMPORTER_USER_ID = "repo-work-item-importer";
const IMPORTER_LABEL = "Repo work item importer";
const MAX_TITLE_LENGTH = 160;
const MAX_EXISTING_ROWS = 10_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const MIN_TIMEOUT_MS = 1_000;
const IMPORT_METADATA_COMPARE_KEYS = [
  "work_item_id",
  "work_item_id_declared",
  "source_path",
  "source_type",
  "work_item_kind",
  "work_item_lifecycle",
  "source_group",
  "source_group_label",
  "source_label",
  "import_version",
  "work_item_status",
  "work_item_status_source",
  "work_item_owner",
  "work_item_scope",
  "archive_intent",
  "work_item_batch",
  "frontend_lane",
  "markdown_status",
  "markdown_type",
  "markdown_priority",
  "markdown_next_role",
  "markdown_task",
  "markdown_stage",
  "markdown_prompt_source",
  "markdown_exact_handoff_prompt_present",
  "markdown_metadata_complete",
  "markdown_metadata_state",
  "missing_required_fields",
  "invalid_required_fields",
  "fallback_work_item_status",
  "fallback_item_type",
  "fallback_priority",
  "fallback_target_role",
  "admin_capture_status",
  "admin_capture_priority",
  "admin_capture_target_role",
  "content_hash",
  "source_generation",
  "title_source",
  "source_status_text",
  "source_owner",
  "source_last_updated",
  "stale_repo_mirror",
  "stale_source_path",
  "stale_source_type",
  "stale_detected_at",
  "stale_cleanup_action",
  "stale_cleanup_version",
  "stale_cleanup_reason",
] as const;

type SourceType = AdminRepoWorkItemSourceType;
type ItemInsert = Database["public"]["Tables"]["admin_capture_items"]["Insert"];
type ItemUpdate = Database["public"]["Tables"]["admin_capture_items"]["Update"];

type SourceConfig = {
  type: SourceType;
  root: string;
};

type RepoWorkItem = {
  workItemId: string | null;
  workItemIdDeclared: boolean;
  sourcePath: string;
  sourceType: SourceType;
  itemType: AdminItemType;
  adminStatus: AdminStatus;
  workItemStatus: WorkItemStatus;
  priority: AdminPriority;
  targetRole: TargetRole;
  title: string;
  note: string;
  pageUrl: string;
  route: string | null;
  archivedAt: string | null;
  metadata: Record<string, Json | undefined>;
};

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

type ImportAction = "created" | "updated" | "skipped";

type ImportStats = {
  discoveredBySourceType: Record<SourceType, number>;
  eligibleBySourceType: Record<SourceType, number>;
  skippedByReason: Record<string, number>;
  missingRequiredFieldCounts: Record<CanonicalMarkdownField, number>;
  invalidRequiredFieldCounts: Record<CanonicalMarkdownField, number>;
  missingMetadataExamples: MissingMetadataExample[];
  created: number;
  updated: number;
  skipped: number;
  duplicateCount: number;
  duplicateWorkItemIdCount: number;
  duplicateWorkItemIdExamples: DuplicateWorkItemId[];
  malformedCanonicalItemCount: number;
  malformedCanonicalItemExamples: MissingMetadataExample[];
  repoDerivedInReviewCount: number;
  staleActiveRepoMirrorCount: number;
  staleActiveRepoMirrorCountAfterCleanup: number | null;
  staleRepoMirrorAction: "not_checked" | "reported" | "would_archive" | "archived";
  staleRepoMirrorArchivedCount: number;
  staleRepoMirrorExamples: StaleRepoMirrorExample[];
  eligibleBySourceGroup: Record<string, number>;
  duplicateConceptDiagnostics: {
    count: number;
    examples: DuplicateConceptExample[];
  };
  manualRowCountBefore: number | null;
  manualRowCountAfter: number | null;
  examples: Record<string, ExampleItem | null>;
};

export type AdminRepoMirrorImportReport = {
  mode: "dry_run" | "live_upsert";
  ok: boolean;
  stats: ImportStats;
  archiveStale: boolean;
  message: string;
};

export type AdminRepoMirrorImportOptions = {
  rootDir?: string;
  documents?: AdminRepoWorkItemDocument[];
  dryRun?: boolean;
  archiveStale?: boolean;
  debug?: boolean;
  sourceRevision?: string;
  sourceGeneration?: string;
  supabase?: SupabaseClient<Database>;
};

export type AdminRepoWorkItemDocument = {
  sourcePath: string;
  sourceType: SourceType;
  content: string;
};

type ImportPhase = {
  name: string;
  detail: string | null;
  startedAt: string;
};

type ImportRunContext = {
  args: ReturnType<typeof parseRepoWorkItemImporterCliArgs>;
  generatedAt: string;
  sourceRevision: string | null;
  sourceGeneration: string | null;
  currentPhase: ImportPhase;
};

type ExampleItem = {
  title: string;
  workItemId: string | null;
  sourcePath: string;
  sourceType: SourceType;
  workItemKind: AdminRepoWorkItemKind;
  workItemLifecycle: AdminRepoWorkItemLifecycle;
  sourceGroup: string;
  sourceLabel: string;
  status: WorkItemStatus;
  metadataState: CanonicalMetadataState;
  owner: string | null;
  scope: string | null;
  archiveIntent: string | null;
  batch: string | null;
  frontendLane: string | null;
  targetRole: TargetRole;
};

type MissingMetadataExample = {
  sourcePath: string;
  workItemId: string | null;
  metadataState: CanonicalMetadataState;
  missingRequiredFields: CanonicalMarkdownField[];
  invalidRequiredFields: CanonicalMarkdownField[];
};

type StaleRepoMirrorExample = {
  id: string;
  title: string | null;
  sourcePath: string;
  sourceType: string;
  status: AdminStatus;
  archivedAt: string | null;
};

type DuplicateConceptExample = {
  concept: string;
  count: number;
  items: Array<{
    title: string;
    sourcePath: string;
    sourceType: SourceType;
    sourceLabel: string;
  }>;
};

const SOURCE_CONFIGS = sourceManifest.sources as SourceConfig[];

export const ADMIN_REPO_WORK_ITEM_SOURCE_ROOTS = SOURCE_CONFIGS.map((source) => source.root);

export async function runRepoWorkItemImporterCli(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(buildRepoWorkItemImporterCliHelp());
    return { action: "help" as const, exitCode: 0 };
  }

  let cliArgs: ReturnType<typeof parseRepoWorkItemImporterCliArgs>;
  try {
    cliArgs = parseRepoWorkItemImporterCliArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${message}\n\n${buildRepoWorkItemImporterCliHelp()}`);
    return { action: "invalid" as const, exitCode: 2, message };
  }

  const context = createImportRunContext(cliArgs);
  const timeout = startImporterTimeout(cliArgs, context);

  try {
    const report = await synchronizeRepoWorkItemsWithContext(
      {
        rootDir: process.cwd(),
        ...cliArgs,
      },
      context,
    );
    printReport(report);

    return {
      action: "execute" as const,
      exitCode: report.ok ? 0 : 1,
      args: cliArgs,
      report,
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function synchronizeRepoWorkItems(
  options: AdminRepoMirrorImportOptions = {},
): Promise<AdminRepoMirrorImportReport> {
  return synchronizeRepoWorkItemsWithContext(options, createImportRunContext(options));
}

async function synchronizeRepoWorkItemsWithContext(
  options: AdminRepoMirrorImportOptions,
  context: ImportRunContext,
): Promise<AdminRepoMirrorImportReport> {
  const { args, generatedAt } = context;
  const rootDir = options.rootDir ?? process.cwd();
  setPhase(context, "scan_repo_work_items", options.documents ? "bundled snapshot" : rootDir);
  const scan = options.documents
    ? await scanRepoWorkItemDocuments(options.documents, context)
    : await scanRepoWorkItems(rootDir, context);
  setPhase(context, "prepare_import_report", `${scan.items.length} eligible repo items`);
  const items = scan.items;
  const duplicateWorkItemIds = findDuplicateWorkItemIds(items);
  const malformedCanonicalItems = findMalformedCanonicalItems(items);
  const stats: ImportStats = {
    discoveredBySourceType: scan.discoveredBySourceType,
    eligibleBySourceType: countBySourceType(items),
    skippedByReason: scan.skippedByReason,
    missingRequiredFieldCounts: countMissingRequiredFields(items),
    invalidRequiredFieldCounts: countInvalidRequiredFields(items),
    missingMetadataExamples: findMissingMetadataExamples(items),
    created: 0,
    updated: 0,
    skipped: args.dryRun ? items.length : 0,
    duplicateCount: 0,
    duplicateWorkItemIdCount: duplicateWorkItemIds.length,
    duplicateWorkItemIdExamples: duplicateWorkItemIds.slice(0, 12),
    malformedCanonicalItemCount: malformedCanonicalItems.length,
    malformedCanonicalItemExamples: malformedCanonicalItems.slice(0, 12),
    repoDerivedInReviewCount: countRepoDerivedInReviewItems(items),
    staleActiveRepoMirrorCount: 0,
    staleActiveRepoMirrorCountAfterCleanup: null,
    staleRepoMirrorAction: args.archiveStale ? "would_archive" : "not_checked",
    staleRepoMirrorArchivedCount: 0,
    staleRepoMirrorExamples: [],
    eligibleBySourceGroup: countBySourceGroup(items),
    duplicateConceptDiagnostics: {
      count: countDuplicateConcepts(items),
      examples: findDuplicateConceptExamples(items),
    },
    manualRowCountBefore: null,
    manualRowCountAfter: null,
    examples: {
      activePlan: findExample(items, "active_plan"),
      productBrief: findExample(items, "product_brief"),
      frontendSpec: findExample(items, "frontend_spec"),
    },
  };
  const currentMirrorKeys = buildCurrentRepoMirrorKeys(items);

  if (args.dryRun) {
    if (args.archiveStale) {
      setPhase(context, "create_supabase_client", "dry-run stale mirror check");
      const supabase = options.supabase ?? createServiceClient();
      setPhase(context, "load_existing_admin_capture_rows", "dry-run stale mirror check");
      const existingRows = await loadAdminCaptureRows(supabase);
      setPhase(context, "analyze_stale_repo_mirror_rows", "dry-run stale mirror check");
      const staleRows = findStaleActiveRepoMirrorRows(existingRows, currentMirrorKeys);

      stats.manualRowCountBefore = countManualRows(existingRows);
      stats.manualRowCountAfter = stats.manualRowCountBefore;
      stats.duplicateCount = countRepoMirrorIdentityDuplicates(existingRows);
      stats.repoDerivedInReviewCount = countRepoDerivedInReviewRows(existingRows);
      stats.staleActiveRepoMirrorCount = staleRows.length;
      stats.staleActiveRepoMirrorCountAfterCleanup = staleRows.length;
      stats.staleRepoMirrorExamples = summarizeStaleRepoMirrorRows(staleRows);
    }

    return {
      mode: "dry_run",
      ok: duplicateWorkItemIds.length === 0,
      stats,
      archiveStale: args.archiveStale,
      message:
        duplicateWorkItemIds.length > 0
          ? "Dry run refused duplicate Work Item IDs and did not write Supabase."
          : malformedCanonicalItems.length > 0
            ? "Dry run found malformed canonical work items; live sync will mirror them as read-only diagnostics."
            : "Dry run scanned repo markdown and did not write Supabase.",
    };
  }

  if (duplicateWorkItemIds.length > 0) {
    return {
      mode: "live_upsert",
      ok: false,
      stats,
      archiveStale: args.archiveStale,
      message: "Live import refused duplicate Work Item IDs before creating a Supabase client.",
    };
  }

  setPhase(context, "create_supabase_client", "live import");
  const supabase = options.supabase ?? createServiceClient();
  setPhase(context, "load_existing_admin_capture_rows", "before live import");
  const beforeRows = await loadAdminCaptureRows(supabase);
  stats.manualRowCountBefore = countManualRows(beforeRows);
  stats.duplicateCount = countRepoMirrorIdentityDuplicates(beforeRows);

  if (stats.duplicateCount > 0) {
    return {
      mode: "live_upsert",
      ok: false,
      stats,
      archiveStale: args.archiveStale,
      message: "Live import refused ambiguous existing repo mirrors before any write.",
    };
  }

  const existingRepoMirrors = buildExistingRepoMirrorIndex(beforeRows);

  for (const item of items) {
    const existing = findExistingRepoMirrorRow(existingRepoMirrors, item);
    setPhase(
      context,
      existing ? "refresh_existing_admin_capture_item" : "create_admin_capture_item",
      item.sourcePath,
    );
    const action = existing
      ? await refreshExistingItem(supabase, existing, item, generatedAt)
      : await createImportedItem(supabase, item, generatedAt);

    stats[action] += 1;
  }

  setPhase(context, "load_existing_admin_capture_rows", "after live upsert");
  const afterUpsertRows = await loadAdminCaptureRows(supabase);
  const staleRows = findStaleActiveRepoMirrorRows(afterUpsertRows, currentMirrorKeys);
  stats.staleActiveRepoMirrorCount = staleRows.length;
  stats.staleRepoMirrorExamples = summarizeStaleRepoMirrorRows(staleRows);
  stats.staleRepoMirrorAction = args.archiveStale ? "archived" : "reported";

  if (args.archiveStale) {
    for (const row of staleRows) {
      setPhase(context, "archive_stale_repo_mirror_row", row.title ?? row.id);
      await archiveStaleRepoMirrorRow(supabase, row, generatedAt);
      stats.staleRepoMirrorArchivedCount += 1;
    }
  }

  setPhase(context, "load_existing_admin_capture_rows", "after stale cleanup");
  const afterRows = await loadAdminCaptureRows(supabase);
  stats.manualRowCountAfter = countManualRows(afterRows);
  stats.duplicateCount = countRepoMirrorIdentityDuplicates(afterRows);
  stats.repoDerivedInReviewCount = countRepoDerivedInReviewRows(afterRows);
  stats.staleActiveRepoMirrorCountAfterCleanup = findStaleActiveRepoMirrorRows(
    afterRows,
    currentMirrorKeys,
  ).length;

  return {
    mode: "live_upsert",
    ok:
      stats.duplicateCount === 0 &&
      stats.repoDerivedInReviewCount === 0 &&
      (!args.archiveStale || stats.staleActiveRepoMirrorCountAfterCleanup === 0) &&
      (stats.manualRowCountBefore === null ||
        stats.manualRowCountBefore === stats.manualRowCountAfter),
    stats,
    archiveStale: args.archiveStale,
    message:
      malformedCanonicalItems.length > 0
        ? "Repo markdown work items, including read-only malformed-source diagnostics, were mirrored into admin_capture_items. Markdown remains canonical."
        : "Repo markdown work items were mirrored into admin_capture_items. Markdown remains canonical.",
  };
}

function createImportRunContext(
  options: Pick<
    AdminRepoMirrorImportOptions,
    "dryRun" | "archiveStale" | "debug" | "sourceRevision" | "sourceGeneration"
  >,
): ImportRunContext {
  const args = {
    dryRun: options.dryRun ?? false,
    archiveStale: options.archiveStale ?? false,
    debug: options.debug ?? false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
  const generatedAt = new Date().toISOString();

  return {
    args,
    generatedAt,
    sourceRevision: options.sourceRevision?.trim() || null,
    sourceGeneration: normalizeSourceGeneration(options.sourceGeneration),
    currentPhase: {
      name: "initializing",
      detail: null,
      startedAt: generatedAt,
    },
  };
}

async function scanRepoWorkItems(rootDir: string, context: ImportRunContext) {
  const discoveredBySourceType = emptySourceCounts();
  const skippedByReason: Record<string, number> = {};
  const items: RepoWorkItem[] = [];

  for (const source of SOURCE_CONFIGS) {
    setPhase(context, "collect_markdown_files", source.root);
    const files = await collectMarkdownFiles(path.join(rootDir, source.root), context);
    const eligibleFiles = files.filter((file) => {
      const relativePath = normalizeSourcePath(path.relative(rootDir, file));
      return getSkipReason(relativePath) === null;
    });

    if (eligibleFiles.length === 0) {
      throw new Error(`Required repository work-item source is empty: ${source.root}`);
    }

    discoveredBySourceType[source.type] = files.length;
    setPhase(context, "normalize_markdown_source", `${source.root} (${files.length} files)`);

    for (const file of files) {
      const relativePath = normalizeSourcePath(path.relative(rootDir, file));
      const skipReason = getSkipReason(relativePath);

      if (skipReason) {
        skippedByReason[skipReason] = (skippedByReason[skipReason] ?? 0) + 1;
        continue;
      }

      setPhase(context, "read_markdown_file", relativePath);
      const content = await readFile(file, "utf8");
      setPhase(context, "normalize_markdown_file", relativePath);
      const normalized = await normalizeMarkdownFile(relativePath, source.type, content, context);

      if (!normalized) {
        skippedByReason.unbounded_or_empty = (skippedByReason.unbounded_or_empty ?? 0) + 1;
        continue;
      }

      items.push(normalized);
    }
  }

  return {
    discoveredBySourceType,
    skippedByReason,
    items,
  };
}

async function scanRepoWorkItemDocuments(
  documents: AdminRepoWorkItemDocument[],
  context: ImportRunContext,
) {
  const discoveredBySourceType = emptySourceCounts();
  const skippedByReason: Record<string, number> = {};
  const items: RepoWorkItem[] = [];
  const seenPaths = new Set<string>();
  const normalizedDocuments = documents
    .map((document) => ({
      ...document,
      sourcePath: normalizeSourcePath(document.sourcePath),
    }))
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));

  for (const source of SOURCE_CONFIGS) {
    const sourceDocuments = normalizedDocuments.filter(
      (document) =>
        document.sourceType === source.type && document.sourcePath.startsWith(`${source.root}/`),
    );

    if (sourceDocuments.length === 0) {
      throw new Error(
        `Required bundled repository work-item source is unavailable: ${source.root}`,
      );
    }

    discoveredBySourceType[source.type] = sourceDocuments.length;
    setPhase(
      context,
      "normalize_bundled_markdown_source",
      `${source.root} (${sourceDocuments.length} files)`,
    );

    for (const document of sourceDocuments) {
      if (seenPaths.has(document.sourcePath)) {
        throw new Error(
          `Bundled repository work-item source path is duplicated: ${document.sourcePath}`,
        );
      }

      seenPaths.add(document.sourcePath);
      const skipReason = getSkipReason(document.sourcePath);

      if (skipReason) {
        skippedByReason[skipReason] = (skippedByReason[skipReason] ?? 0) + 1;
        continue;
      }

      setPhase(context, "normalize_bundled_markdown_file", document.sourcePath);
      const normalized = await normalizeMarkdownFile(
        document.sourcePath,
        document.sourceType,
        document.content,
        context,
      );

      if (!normalized) {
        skippedByReason.unbounded_or_empty = (skippedByReason.unbounded_or_empty ?? 0) + 1;
        continue;
      }

      items.push(normalized);
    }
  }

  if (seenPaths.size !== normalizedDocuments.length) {
    const unsupported = normalizedDocuments.find((document) => !seenPaths.has(document.sourcePath));
    throw new Error(
      `Bundled repository work-item source is outside the approved manifest: ${unsupported?.sourcePath ?? "unknown"}`,
    );
  }

  return { discoveredBySourceType, skippedByReason, items };
}

async function normalizeMarkdownFile(
  sourcePath: string,
  sourceType: SourceType,
  content: string,
  context: ImportRunContext,
): Promise<RepoWorkItem | null> {
  const stripped = stripMarkdown(content);
  const title = truncate(extractTitle(content) ?? titleFromFilename(sourcePath), MAX_TITLE_LENGTH);

  if (!title || !stripped) {
    return null;
  }

  const contentHash = createHash("sha256").update(content).digest("hex");
  const canonical = parseCanonicalMarkdown(content);
  const sourceStatusText = extractStatusText(content);
  const owner = extractSectionText(content, "Owner");
  const lastUpdated = extractSectionText(content, "Last Updated");
  const fallbackWorkItemStatus = inferWorkItemStatus(sourceType, sourceStatusText, content);
  const workItemStatus = canonical.status ?? fallbackWorkItemStatus;
  const adminStatus = mapMirroredWorkItemStatusToAdminStatus(
    workItemStatus,
    canonical.metadataState,
    sourceType,
  );
  const targetRole =
    canonical.nextRole ?? inferTargetRole(sourceType, sourcePath, `${title}\n${content}`);
  const itemType =
    mapMarkdownTypeToAdminItemType(canonical.itemType) ??
    inferItemType(sourceType, `${title}\n${content}`);
  const priority = canonical.priority ?? "medium";
  const taskTitle = canonical.task ? firstMeaningfulLine(canonical.task) : null;
  const sourceMetadata = getAdminRepoWorkItemMetadata(sourceType);
  const note = buildRepoMirrorNote({
    sourcePath,
    sourceType,
    workItemStatus,
    owner,
    lastUpdated,
    excerpt: stripped,
    canonical,
  });
  const titleSource = taskTitle ? "markdown_task" : extractTitle(content) ? "h1" : "filename";
  const metadata: RepoWorkItem["metadata"] = {
    work_item_id: canonical.workItemId ?? undefined,
    work_item_id_declared: Boolean(canonical.raw["Work Item ID"]),
    source_path: sourcePath,
    source_type: sourceType,
    work_item_kind: sourceMetadata.workItemKind,
    work_item_lifecycle: sourceMetadata.workItemLifecycle,
    source_group: sourceMetadata.sourceGroup,
    source_group_label: sourceMetadata.sourceGroupLabel,
    source_label: sourceMetadata.sourceLabel,
    imported_from_repo: true,
    import_version: IMPORT_VERSION,
    work_item_status: workItemStatus,
    work_item_status_source: canonical.status ? "markdown" : "fallback",
    work_item_owner: canonical.owner ?? undefined,
    work_item_scope: canonical.scope ?? undefined,
    archive_intent: canonical.archiveIntent ?? undefined,
    work_item_batch: canonical.batch ?? undefined,
    frontend_lane: canonical.frontendLane ?? undefined,
    markdown_status: canonical.status ?? undefined,
    markdown_type: canonical.itemType ?? undefined,
    markdown_priority: canonical.priority ?? undefined,
    markdown_next_role: canonical.nextRole ?? undefined,
    markdown_task: canonical.task ? truncate(canonical.task, 600) : undefined,
    markdown_stage: canonical.stage ? truncate(canonical.stage, 240) : undefined,
    markdown_prompt_source: canonical.exactHandoffPrompt
      ? "exact_handoff_prompt"
      : canonical.task || canonical.stage || canonical.nextRole
        ? "fallback_from_markdown_sections"
        : "fallback_from_excerpt",
    markdown_exact_handoff_prompt_present: Boolean(canonical.exactHandoffPrompt),
    markdown_metadata_complete:
      canonical.missingRequiredFields.length === 0 && canonical.invalidRequiredFields.length === 0,
    markdown_metadata_state: canonical.metadataState,
    missing_required_fields:
      canonical.missingRequiredFields.length > 0 ? canonical.missingRequiredFields : undefined,
    invalid_required_fields:
      canonical.invalidRequiredFields.length > 0 ? canonical.invalidRequiredFields : undefined,
    fallback_work_item_status: canonical.status ? undefined : fallbackWorkItemStatus,
    fallback_item_type: canonical.itemType ? undefined : itemType,
    fallback_priority: canonical.priority ? undefined : priority,
    fallback_target_role: canonical.nextRole ? undefined : targetRole,
    admin_capture_status: adminStatus,
    admin_capture_priority: priority,
    admin_capture_target_role: targetRole,
    work_type: sourceType,
    content_hash: contentHash,
    source_revision: context.sourceRevision ?? undefined,
    source_generation: context.sourceGeneration ?? undefined,
    title_source: titleSource,
    source_status_text: sourceStatusText ?? undefined,
    source_owner: owner ?? undefined,
    source_last_updated: lastUpdated ?? undefined,
  };

  return {
    workItemId: canonical.workItemId,
    workItemIdDeclared: Boolean(canonical.raw["Work Item ID"]),
    sourcePath,
    sourceType,
    itemType,
    adminStatus,
    workItemStatus,
    priority,
    targetRole,
    title: truncate(taskTitle ?? title, MAX_TITLE_LENGTH),
    note,
    pageUrl: `hito://repo/${sourcePath}`,
    route: null,
    archivedAt: adminStatus === "archived" ? context.generatedAt : null,
    metadata,
  };
}

async function collectMarkdownFiles(
  directory: string,
  context: ImportRunContext,
): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>>;

  try {
    setPhase(context, "readdir_markdown_directory", normalizeSourcePath(directory));
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Required repository work-item source is unavailable: ${normalizeSourcePath(directory)}`,
        { cause: error },
      );
    }

    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectMarkdownFiles(entryPath, context);
      }

      return entry.isFile() && entry.name.toLowerCase().endsWith(".md") ? [entryPath] : [];
    }),
  );

  return files.flat().sort();
}

function getSkipReason(sourcePath: string) {
  const basename = path.basename(sourcePath).toLowerCase();

  if (basename === "readme.md") {
    return "readme_policy_doc";
  }

  if (basename === ".gitkeep") {
    return "gitkeep";
  }

  return null;
}

async function createImportedItem(
  supabase: ReturnType<typeof createServiceClient>,
  item: RepoWorkItem,
  generatedAt: string,
): Promise<ImportAction> {
  const insert: ItemInsert = {
    item_type: item.itemType,
    status: item.adminStatus,
    priority: item.priority,
    target_role: item.targetRole,
    title: item.title,
    note: item.note,
    page_url: item.pageUrl,
    route: item.route,
    created_by_user_id: IMPORTER_USER_ID,
    created_by_label: IMPORTER_LABEL,
    metadata: {
      ...item.metadata,
      imported_at: generatedAt,
    } as Json,
    archived_at: item.archivedAt,
  };
  const { error } = await supabase.from("admin_capture_items").insert(insert);

  if (error) {
    if (error.code === "23505") {
      const rowsAfterConflict = await loadAdminCaptureRows(supabase);

      if (countRepoMirrorIdentityDuplicates(rowsAfterConflict) > 0) {
        throw new Error(
          `Could not reconcile concurrent import for ${item.sourcePath}: existing mirror identities are ambiguous.`,
        );
      }

      const concurrentExisting = findExistingRepoMirrorRow(
        buildExistingRepoMirrorIndex(rowsAfterConflict),
        item,
      );

      if (concurrentExisting) {
        return refreshExistingItem(supabase, concurrentExisting, item, generatedAt);
      }
    }

    throw new Error(`Could not import ${item.sourcePath}: ${error.message}`);
  }

  return "created";
}

async function refreshExistingItem(
  supabase: ReturnType<typeof createServiceClient>,
  existing: ExistingRow,
  item: RepoWorkItem,
  generatedAt: string,
): Promise<ImportAction> {
  const metadata = normalizeMetadata(existing.metadata);
  const existingWorkItemId =
    typeof metadata.work_item_id === "string" ? metadata.work_item_id : null;

  if (existingWorkItemId && existingWorkItemId !== item.workItemId) {
    throw new Error(
      `Could not refresh ${item.sourcePath}: Work Item ID ${existingWorkItemId} is immutable.`,
    );
  }

  const nextStatus = item.adminStatus;
  const nextPriority = item.priority;
  const nextTargetRole = item.targetRole;
  const nextArchivedAt =
    nextStatus === "archived"
      ? (existing.archived_at ?? generatedAt)
      : nextStatus === existing.status
        ? existing.archived_at
        : null;
  const nextMetadata = {
    ...metadata,
    ...item.metadata,
    imported_at: typeof metadata.imported_at === "string" ? metadata.imported_at : generatedAt,
    refreshed_at: generatedAt,
  } as Json;
  const patch: ItemUpdate = {
    item_type: item.itemType,
    status: nextStatus,
    priority: nextPriority,
    target_role: nextTargetRole,
    title: item.title,
    note: item.note,
    page_url: item.pageUrl,
    route: item.route,
    metadata: nextMetadata,
    archived_at: nextArchivedAt,
  };

  if (isUnchanged(existing, patch)) {
    return "skipped";
  }

  const incomingGeneration =
    typeof item.metadata.source_generation === "string" ? item.metadata.source_generation : null;
  if (incomingGeneration) {
    const { data, error } = await supabase
      .from("admin_capture_items")
      .update(patch)
      .eq("id", existing.id)
      .or(
        `metadata->>source_generation.is.null,metadata->>source_generation.lte.${incomingGeneration}`,
      )
      .select("id")
      .limit(1);

    if (error) {
      throw new Error(`Could not refresh ${item.sourcePath}: ${error.message}`);
    }

    return data?.length ? "updated" : "skipped";
  }

  const { error } = await supabase.from("admin_capture_items").update(patch).eq("id", existing.id);

  if (error) {
    throw new Error(`Could not refresh ${item.sourcePath}: ${error.message}`);
  }

  return "updated";
}

function normalizeSourceGeneration(value: string | undefined) {
  const generation = value?.trim() || null;

  if (generation && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generation)) {
    throw new Error("Repository mirror source generation must be an ISO UTC timestamp.");
  }

  return generation;
}

async function loadAdminCaptureRows(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ExistingRow[]> {
  const { data, error, count } = await supabase
    .from("admin_capture_items")
    .select(
      "id,item_type,status,priority,target_role,title,note,page_url,route,metadata,archived_at",
      { count: "exact" },
    )
    .limit(MAX_EXISTING_ROWS);

  if (error) {
    throw new Error(`Could not load existing admin backlog items: ${error.message}`);
  }

  if (
    (count !== null && count > MAX_EXISTING_ROWS) ||
    (count === null && data?.length === MAX_EXISTING_ROWS)
  ) {
    throw new Error(
      `Admin backlog contains more than the importer safety limit of ${MAX_EXISTING_ROWS} rows.`,
    );
  }

  return (data ?? []) as ExistingRow[];
}

function countRepoDerivedInReviewItems(items: RepoWorkItem[]) {
  return items.filter((item) => item.adminStatus === "in_review").length;
}

function countRepoDerivedInReviewRows(rows: ExistingRow[]) {
  return rows.filter(
    (row) =>
      normalizeMetadata(row.metadata).imported_from_repo === true && row.status === "in_review",
  ).length;
}

function countMissingRequiredFields(items: RepoWorkItem[]) {
  return countRequiredFields(items, "missing_required_fields");
}

function countInvalidRequiredFields(items: RepoWorkItem[]) {
  return countRequiredFields(items, "invalid_required_fields");
}

function countRequiredFields(
  items: RepoWorkItem[],
  metadataKey: "missing_required_fields" | "invalid_required_fields",
): Record<CanonicalMarkdownField, number> {
  const counts = emptyRequiredFieldCounts();

  for (const item of items) {
    for (const field of readRequiredFieldArray(item.metadata[metadataKey])) {
      counts[field] += 1;
    }
  }

  return counts;
}

function findMissingMetadataExamples(items: RepoWorkItem[]): MissingMetadataExample[] {
  return items
    .map((item) => ({
      sourcePath: item.sourcePath,
      workItemId:
        typeof item.metadata.work_item_id === "string" ? item.metadata.work_item_id : null,
      metadataState:
        typeof item.metadata.markdown_metadata_state === "string"
          ? (item.metadata.markdown_metadata_state as CanonicalMetadataState)
          : "legacy_debt",
      missingRequiredFields: readRequiredFieldArray(item.metadata.missing_required_fields),
      invalidRequiredFields: readRequiredFieldArray(item.metadata.invalid_required_fields),
    }))
    .filter(
      (example) =>
        example.missingRequiredFields.length > 0 || example.invalidRequiredFields.length > 0,
    )
    .slice(0, 8);
}

function findMalformedCanonicalItems(items: RepoWorkItem[]): MissingMetadataExample[] {
  return items
    .filter(
      (item) => item.workItemIdDeclared && item.metadata.markdown_metadata_state === "malformed",
    )
    .map((item) => ({
      sourcePath: item.sourcePath,
      workItemId:
        typeof item.metadata.work_item_id === "string" ? item.metadata.work_item_id : null,
      metadataState: "malformed",
      missingRequiredFields: readRequiredFieldArray(item.metadata.missing_required_fields),
      invalidRequiredFields: readRequiredFieldArray(item.metadata.invalid_required_fields),
    }));
}

function readRequiredFieldArray(input: Json | undefined): CanonicalMarkdownField[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((value): value is CanonicalMarkdownField =>
    CANONICAL_MARKDOWN_FIELDS.includes(value as CanonicalMarkdownField),
  );
}

function countManualRows(rows: ExistingRow[]) {
  return rows.filter((row) => normalizeMetadata(row.metadata).imported_from_repo !== true).length;
}

export function findStaleActiveRepoMirrorRows(
  rows: ExistingRow[],
  currentMirrorKeys: ReadonlySet<string>,
) {
  return rows.filter((row) => {
    const metadata = normalizeMetadata(row.metadata);
    const workItemId = typeof metadata.work_item_id === "string" ? metadata.work_item_id : null;
    const sourcePath = typeof metadata.source_path === "string" ? metadata.source_path : null;
    const sourceType = typeof metadata.source_type === "string" ? metadata.source_type : null;

    if (metadata.imported_from_repo !== true || !sourcePath || !sourceType) {
      return false;
    }

    if (!isApprovedMarkdownSourcePath(sourcePath) || !isSourceType(sourceType)) {
      return false;
    }

    if (row.status === "archived" || row.archived_at) {
      return false;
    }

    return !(
      currentMirrorKeys.has(sourceKey(sourceType, sourcePath)) ||
      (workItemId && currentMirrorKeys.has(workItemIdentityKey(workItemId, sourceType, sourcePath)))
    );
  });
}

async function archiveStaleRepoMirrorRow(
  supabase: ReturnType<typeof createServiceClient>,
  row: ExistingRow,
  generatedAt: string,
) {
  const metadata = normalizeMetadata(row.metadata);
  const sourcePath = typeof metadata.source_path === "string" ? metadata.source_path : null;
  const sourceType = typeof metadata.source_type === "string" ? metadata.source_type : null;
  const patch: ItemUpdate = {
    status: "archived",
    archived_at: row.archived_at ?? generatedAt,
    metadata: buildStaleRepoMirrorMetadata(metadata, sourcePath, sourceType, generatedAt),
  };
  const { error } = await supabase.from("admin_capture_items").update(patch).eq("id", row.id);

  if (error) {
    throw new Error(
      `Could not archive stale repo mirror ${sourcePath ?? row.id}: ${error.message}`,
    );
  }
}

export function buildStaleRepoMirrorMetadata(
  metadata: Record<string, Json | undefined>,
  sourcePath: string | null,
  sourceType: string | null,
  detectedAt = new Date().toISOString(),
): Json {
  return {
    ...metadata,
    stale_repo_mirror: true,
    stale_source_path: sourcePath ?? undefined,
    stale_source_type: sourceType ?? undefined,
    stale_detected_at: detectedAt,
    stale_cleanup_action: "archived",
    stale_cleanup_version: IMPORT_VERSION,
    stale_cleanup_reason: "metadata.source_path no longer exists in approved repo import sources",
    refreshed_at: typeof metadata.refreshed_at === "string" ? metadata.refreshed_at : detectedAt,
  } as Json;
}

function summarizeStaleRepoMirrorRows(rows: ExistingRow[]): StaleRepoMirrorExample[] {
  return rows.slice(0, 12).map((row) => {
    const metadata = normalizeMetadata(row.metadata);

    return {
      id: row.id,
      title: row.title,
      sourcePath: typeof metadata.source_path === "string" ? metadata.source_path : "unknown",
      sourceType: typeof metadata.source_type === "string" ? metadata.source_type : "unknown",
      status: row.status as AdminStatus,
      archivedAt: row.archived_at,
    };
  });
}

function isApprovedMarkdownSourcePath(sourcePath: string) {
  return (
    sourcePath.endsWith(".md") &&
    SOURCE_CONFIGS.some(
      (source) => sourcePath === source.root || sourcePath.startsWith(`${source.root}/`),
    )
  );
}

function isSourceType(value: string): value is SourceType {
  return adminRepoWorkItemSourceTypes.includes(value as SourceType);
}

function isUnchanged(existing: ExistingRow, patch: ItemUpdate) {
  const comparableKeys: Array<keyof ItemUpdate> = [
    "item_type",
    "status",
    "priority",
    "target_role",
    "title",
    "note",
    "page_url",
    "route",
    "archived_at",
  ];
  const baseUnchanged = comparableKeys.every((key) => existing[key] === patch[key]);
  const existingMetadata = normalizeMetadata(existing.metadata);
  const patchMetadata = normalizeMetadata(patch.metadata);
  const metadataUnchanged = IMPORT_METADATA_COMPARE_KEYS.every((key) =>
    jsonValuesEqual(existingMetadata[key], patchMetadata[key]),
  );

  return baseUnchanged && metadataUnchanged;
}

function emptySourceCounts(): Record<SourceType, number> {
  return {
    backlog_doc: 0,
    product_brief: 0,
    frontend_spec: 0,
    active_plan: 0,
    archived_plan: 0,
  };
}

function emptyRequiredFieldCounts(): Record<CanonicalMarkdownField, number> {
  return Object.fromEntries(CANONICAL_MARKDOWN_FIELDS.map((field) => [field, 0])) as Record<
    CanonicalMarkdownField,
    number
  >;
}

function countBySourceType(items: RepoWorkItem[]): Record<SourceType, number> {
  const counts = emptySourceCounts();

  for (const item of items) {
    counts[item.sourceType] += 1;
  }

  return counts;
}

function countBySourceGroup(items: RepoWorkItem[]): Record<string, number> {
  const counts: Record<string, number> = {
    backlog: 0,
    active_plans: 0,
    specs: 0,
    briefs: 0,
    archive: 0,
  };

  for (const item of items) {
    const sourceGroup = item.metadata.source_group;

    if (typeof sourceGroup === "string") {
      counts[sourceGroup] = (counts[sourceGroup] ?? 0) + 1;
    }
  }

  return counts;
}

function countDuplicateConcepts(items: RepoWorkItem[]) {
  return findDuplicateConceptGroups(items).length;
}

function findDuplicateConceptExamples(items: RepoWorkItem[]): DuplicateConceptExample[] {
  return findDuplicateConceptGroups(items)
    .map(([concept, conceptItems]) => ({
      concept,
      count: conceptItems.length,
      items: conceptItems.slice(0, 5).map((item) => ({
        title: item.title,
        sourcePath: item.sourcePath,
        sourceType: item.sourceType,
        sourceLabel: String(item.metadata.source_label ?? item.sourceType),
      })),
    }))
    .slice(0, 8);
}

function findDuplicateConceptGroups(items: RepoWorkItem[]) {
  const concepts = new Map<string, RepoWorkItem[]>();

  for (const item of items) {
    const concept = normalizeConceptKey(String(item.metadata.markdown_task ?? item.title));

    if (!concept) {
      continue;
    }

    const existing = concepts.get(concept) ?? [];
    existing.push(item);
    concepts.set(concept, existing);
  }

  return Array.from(concepts.entries()).filter(([, conceptItems]) => {
    const distinctPaths = new Set(conceptItems.map((item) => item.sourcePath));
    return distinctPaths.size > 1;
  });
}

function normalizeConceptKey(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/`[^`]+`/g, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return normalized.length >= 12 ? normalized.slice(0, 120) : null;
}

function findExample(items: RepoWorkItem[], sourceType: SourceType): ExampleItem | null {
  const item = items.find((candidate) => candidate.sourceType === sourceType);

  if (!item) {
    return null;
  }

  return {
    title: item.title,
    workItemId: typeof item.metadata.work_item_id === "string" ? item.metadata.work_item_id : null,
    sourcePath: item.sourcePath,
    sourceType: item.sourceType,
    workItemKind: String(item.metadata.work_item_kind ?? "backlog_item") as AdminRepoWorkItemKind,
    workItemLifecycle: String(
      item.metadata.work_item_lifecycle ?? "backlog",
    ) as AdminRepoWorkItemLifecycle,
    sourceGroup: String(item.metadata.source_group ?? "backlog"),
    sourceLabel: String(item.metadata.source_label ?? item.sourceType),
    status: item.workItemStatus,
    metadataState:
      typeof item.metadata.markdown_metadata_state === "string"
        ? (item.metadata.markdown_metadata_state as CanonicalMetadataState)
        : "legacy_debt",
    owner: typeof item.metadata.work_item_owner === "string" ? item.metadata.work_item_owner : null,
    scope: typeof item.metadata.work_item_scope === "string" ? item.metadata.work_item_scope : null,
    archiveIntent:
      typeof item.metadata.archive_intent === "string" ? item.metadata.archive_intent : null,
    batch: typeof item.metadata.work_item_batch === "string" ? item.metadata.work_item_batch : null,
    frontendLane:
      typeof item.metadata.frontend_lane === "string" ? item.metadata.frontend_lane : null,
    targetRole: item.targetRole,
  };
}

function parseRepoWorkItemImporterCliArgs(
  rawArgs: string[],
  environmentTimeout = process.env.ADMIN_BACKLOG_IMPORT_TIMEOUT_MS,
) {
  let dryRun = false;
  let live = false;
  let archiveStale = false;
  let debug = false;
  let timeoutValue: string | undefined;
  const seen = new Set<string>();

  for (let index = 0; index < rawArgs.length; index += 1) {
    const argument = rawArgs[index];

    if (["--dry-run", "--live", "--archive-stale", "--debug"].includes(argument)) {
      if (seen.has(argument)) {
        throw new Error(`Duplicate option: ${argument}.`);
      }
      seen.add(argument);
      dryRun ||= argument === "--dry-run";
      live ||= argument === "--live";
      archiveStale ||= argument === "--archive-stale";
      debug ||= argument === "--debug";
      continue;
    }

    if (argument === "--timeout-ms" || argument.startsWith("--timeout-ms=")) {
      if (timeoutValue !== undefined) {
        throw new Error("Duplicate option: --timeout-ms.");
      }
      const inline = argument.startsWith("--timeout-ms=");
      const value = inline ? argument.slice("--timeout-ms=".length) : rawArgs[++index];
      if (!value || (!inline && value.startsWith("-"))) {
        throw new Error("--timeout-ms requires an integer value.");
      }
      timeoutValue = value;
      continue;
    }

    throw new Error(`Unknown importer argument: ${argument}.`);
  }

  if (dryRun === live) {
    throw new Error("Choose exactly one import mode: --dry-run or --live.");
  }

  const timeoutSource = timeoutValue ?? environmentTimeout;
  const timeoutMs = timeoutSource === undefined ? DEFAULT_TIMEOUT_MS : Number(timeoutSource);
  if (
    timeoutSource !== undefined &&
    (!/^\d+$/.test(timeoutSource) || !Number.isSafeInteger(timeoutMs) || timeoutMs < MIN_TIMEOUT_MS)
  ) {
    throw new Error(`Importer timeout must be an integer of at least ${MIN_TIMEOUT_MS} ms.`);
  }

  return {
    dryRun,
    archiveStale,
    debug,
    timeoutMs,
  };
}

function buildRepoWorkItemImporterCliHelp() {
  return `Usage: npm run import-admin-backlog-work-items -- (--dry-run | --live) [options]

Modes:
  --dry-run             Scan canonical Markdown without writing Supabase.
  --live                Explicitly authorize the Admin mirror upsert.

Options:
  --archive-stale       Include explicit stale-row analysis/archive behavior for the chosen mode.
  --timeout-ms <ms>     Bound execution to an integer of at least ${MIN_TIMEOUT_MS} ms (default ${DEFAULT_TIMEOUT_MS}).
  --debug               Print importer phase diagnostics.
  -h, --help            Show this help without starting the importer.

No mode is selected by default. Unknown, conflicting, duplicate, or incomplete options fail before importer execution.`;
}

function startImporterTimeout(
  cliArgs: ReturnType<typeof parseRepoWorkItemImporterCliArgs>,
  context: ImportRunContext,
) {
  if (cliArgs.timeoutMs <= 0) {
    return null;
  }

  const startedAtMs = Date.now();

  return setTimeout(() => {
    const diagnostic = JSON.stringify(
      {
        ok: false,
        importVersion: IMPORT_VERSION,
        mode: cliArgs.dryRun ? "dry_run" : "live_upsert",
        message:
          "Admin backlog importer exceeded its bounded timeout. No success was reported; inspect the phase fields to identify the hanging dependency.",
        timeoutMs: cliArgs.timeoutMs,
        elapsedMs: Date.now() - startedAtMs,
        phase: context.currentPhase.name,
        phaseDetail: context.currentPhase.detail,
        phaseStartedAt: context.currentPhase.startedAt,
        archiveStale: cliArgs.archiveStale,
        mutationSafety:
          cliArgs.dryRun && !cliArgs.archiveStale
            ? "dry-run markdown scan only; no Supabase mutation attempted"
            : cliArgs.dryRun
              ? "dry-run stale mirror check only; no Supabase mutation attempted"
              : "live import may have started; inspect previous logs before retrying",
      },
      null,
      2,
    );
    process.stderr.write(`${diagnostic}\n`, forceExitAfterTimeout);
    setTimeout(forceExitAfterTimeout, 100).unref();
  }, cliArgs.timeoutMs);
}

function forceExitAfterTimeout() {
  process.exitCode = 1;

  try {
    process.kill(process.pid, "SIGTERM");
  } catch {
    process.exit(1);
  }

  setTimeout(() => {
    try {
      process.kill(process.pid, "SIGKILL");
    } catch {
      process.exit(1);
    }
  }, 500).unref();
}

function setPhase(context: ImportRunContext, name: string, detail: string | null = null) {
  context.currentPhase = {
    name,
    detail,
    startedAt: new Date().toISOString(),
  };

  if (context.args.debug) {
    console.error(
      `[admin-backlog-import] phase=${context.currentPhase.name} detail=${context.currentPhase.detail ?? ""}`,
    );
  }
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Import requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. Use --dry-run to scan without Supabase.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function printReport(report: AdminRepoMirrorImportReport) {
  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        mode: report.mode,
        importVersion: IMPORT_VERSION,
        archiveStale: report.archiveStale,
        message: report.message,
        scanned: report.stats.discoveredBySourceType,
        eligible: report.stats.eligibleBySourceType,
        skippedByReason: report.stats.skippedByReason,
        results: {
          created: report.stats.created,
          updated: report.stats.updated,
          skipped: report.stats.skipped,
          duplicateCount: report.stats.duplicateCount,
          duplicateWorkItemIdCount: report.stats.duplicateWorkItemIdCount,
          duplicateWorkItemIdExamples: report.stats.duplicateWorkItemIdExamples,
          malformedCanonicalItemCount: report.stats.malformedCanonicalItemCount,
          malformedCanonicalItemExamples: report.stats.malformedCanonicalItemExamples,
          repoDerivedInReviewCount: report.stats.repoDerivedInReviewCount,
          staleActiveRepoMirrorCount: report.stats.staleActiveRepoMirrorCount,
          staleActiveRepoMirrorCountAfterCleanup:
            report.stats.staleActiveRepoMirrorCountAfterCleanup,
          staleRepoMirrorAction: report.stats.staleRepoMirrorAction,
          staleRepoMirrorArchivedCount: report.stats.staleRepoMirrorArchivedCount,
          staleRepoMirrorExamples: report.stats.staleRepoMirrorExamples,
          manualRowCountBefore: report.stats.manualRowCountBefore,
          manualRowCountAfter: report.stats.manualRowCountAfter,
        },
        metadataQuality: {
          missingRequiredFieldCounts: report.stats.missingRequiredFieldCounts,
          invalidRequiredFieldCounts: report.stats.invalidRequiredFieldCounts,
          examples: report.stats.missingMetadataExamples,
          repoDerivedRowsNeverUseInReview: report.stats.repoDerivedInReviewCount === 0,
        },
        workItemMetadata: {
          eligibleBySourceGroup: report.stats.eligibleBySourceGroup,
          duplicateConceptDiagnostics: report.stats.duplicateConceptDiagnostics,
        },
        examples: report.stats.examples,
        idempotency: {
          upsertKey:
            "metadata.work_item_id, with metadata.source_type + metadata.source_path for legacy rows",
          duplicatesAfterRun: report.stats.duplicateCount,
          manualAdminRowsUntouched:
            report.stats.manualRowCountBefore === null
              ? "not_checked_in_dry_run"
              : report.stats.manualRowCountBefore === report.stats.manualRowCountAfter,
        },
      },
      null,
      2,
    ),
  );
}
