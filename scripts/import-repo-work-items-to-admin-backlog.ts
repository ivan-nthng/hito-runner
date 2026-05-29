import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../src/lib/supabase/database";

const IMPORT_VERSION = "repo-work-items-v1";
const IMPORTER_USER_ID = "repo-work-item-importer";
const IMPORTER_LABEL = "Repo work item importer";
const MAX_NOTE_LENGTH = 3900;
const MAX_TITLE_LENGTH = 160;
const MAX_EXISTING_ROWS = 10_000;
const CANONICAL_MARKDOWN_FIELDS = [
  "Status",
  "Type",
  "Priority",
  "Next Recommended Role",
  "Task",
  "Stage",
  "Exact Handoff Prompt",
] as const;
const IMPORT_METADATA_COMPARE_KEYS = [
  "source_path",
  "source_type",
  "import_version",
  "work_item_status",
  "work_item_status_source",
  "markdown_status",
  "markdown_type",
  "markdown_priority",
  "markdown_next_role",
  "markdown_task",
  "markdown_stage",
  "markdown_prompt_source",
  "markdown_exact_handoff_prompt_present",
  "markdown_metadata_complete",
  "missing_required_fields",
  "invalid_required_fields",
  "fallback_work_item_status",
  "fallback_item_type",
  "fallback_priority",
  "fallback_target_role",
  "admin_capture_status",
  "admin_capture_priority",
  "admin_capture_target_role",
  "source_mtime",
  "content_hash",
  "title_source",
  "source_status_text",
  "source_owner",
  "source_last_updated",
] as const;

type SourceType =
  | "backlog_doc"
  | "product_brief"
  | "frontend_spec"
  | "active_plan"
  | "archived_plan";
type AdminItemType = "bug" | "change_request" | "context_capture";
type AdminStatus = "new" | "in_review" | "ready_for_codex" | "done" | "archived";
type AdminPriority = "low" | "medium" | "high" | "urgent";
type MarkdownItemType = AdminItemType | "plan" | "frontend_spec" | "product_brief";
type TargetRole =
  | "architect"
  | "backend"
  | "frontend"
  | "designer"
  | "copy"
  | "qa"
  | "prompt_engineer"
  | "running_coach";
type WorkItemStatus = "backlog" | "in_progress" | "completed" | "closed" | "archived";
type CanonicalMarkdownField = (typeof CANONICAL_MARKDOWN_FIELDS)[number];
type ItemInsert = Database["public"]["Tables"]["admin_capture_items"]["Insert"];
type ItemUpdate = Database["public"]["Tables"]["admin_capture_items"]["Update"];

type SourceConfig = {
  type: SourceType;
  root: string;
};

type RepoWorkItem = {
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
  repoDerivedInReviewCount: number;
  manualRowCountBefore: number | null;
  manualRowCountAfter: number | null;
  examples: Record<string, ExampleItem | null>;
};

type ExampleItem = {
  title: string;
  sourcePath: string;
  sourceType: SourceType;
  status: WorkItemStatus;
  targetRole: TargetRole;
};

type MissingMetadataExample = {
  sourcePath: string;
  missingRequiredFields: CanonicalMarkdownField[];
  invalidRequiredFields: CanonicalMarkdownField[];
};

type ParsedCanonicalMarkdown = {
  status: WorkItemStatus | null;
  itemType: MarkdownItemType | null;
  priority: AdminPriority | null;
  nextRole: TargetRole | null;
  task: string | null;
  stage: string | null;
  exactHandoffPrompt: string | null;
  missingRequiredFields: CanonicalMarkdownField[];
  invalidRequiredFields: CanonicalMarkdownField[];
  raw: Partial<Record<CanonicalMarkdownField, string>>;
};

const SOURCE_CONFIGS: SourceConfig[] = [
  { type: "backlog_doc", root: "docs/tasks/backlog" },
  { type: "product_brief", root: "docs/tasks/product-briefs" },
  { type: "frontend_spec", root: "docs/tasks/frontend-specs" },
  { type: "active_plan", root: "docs/plans/active" },
  { type: "archived_plan", root: "docs/plans/archive" },
];

const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();

await main();

async function main() {
  const scan = await scanRepoWorkItems(process.cwd());
  const items = scan.items;
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
    repoDerivedInReviewCount: countRepoDerivedInReviewItems(items),
    manualRowCountBefore: null,
    manualRowCountAfter: null,
    examples: {
      activePlan: findExample(items, "active_plan"),
      productBrief: findExample(items, "product_brief"),
      frontendSpec: findExample(items, "frontend_spec"),
    },
  };

  if (args.dryRun) {
    printReport({
      mode: "dry_run",
      ok: true,
      stats,
      refreshTriage: args.refreshTriage,
      message: "Dry run scanned repo markdown and did not write Supabase.",
    });
    return;
  }

  const supabase = createServiceClient();
  const beforeRows = await loadAdminCaptureRows(supabase);
  stats.manualRowCountBefore = countManualRows(beforeRows);
  const existingBySource = mapExistingImportedRows(beforeRows);

  for (const item of items) {
    const existing = existingBySource.get(sourceKey(item.sourceType, item.sourcePath));
    const action = existing
      ? await refreshExistingItem(supabase, existing, item)
      : await createImportedItem(supabase, item);

    stats[action] += 1;
  }

  const afterRows = await loadAdminCaptureRows(supabase);
  stats.manualRowCountAfter = countManualRows(afterRows);
  stats.duplicateCount = countImportedDuplicates(afterRows);
  stats.repoDerivedInReviewCount = countRepoDerivedInReviewRows(afterRows);

  printReport({
    mode: "live_upsert",
    ok:
      stats.duplicateCount === 0 &&
      stats.repoDerivedInReviewCount === 0 &&
      (stats.manualRowCountBefore === null ||
        stats.manualRowCountBefore === stats.manualRowCountAfter),
    stats,
    refreshTriage: args.refreshTriage,
    message:
      "Repo markdown work items were mirrored into admin_capture_items. Markdown remains canonical.",
  });

  if (
    stats.duplicateCount > 0 ||
    stats.repoDerivedInReviewCount > 0 ||
    (stats.manualRowCountBefore !== null &&
      stats.manualRowCountBefore !== stats.manualRowCountAfter)
  ) {
    process.exitCode = 1;
  }
}

async function scanRepoWorkItems(rootDir: string) {
  const discoveredBySourceType = emptySourceCounts();
  const skippedByReason: Record<string, number> = {};
  const items: RepoWorkItem[] = [];

  for (const source of SOURCE_CONFIGS) {
    const files = await collectMarkdownFiles(path.join(rootDir, source.root));
    discoveredBySourceType[source.type] = files.length;

    for (const file of files) {
      const relativePath = normalizeSourcePath(path.relative(rootDir, file));
      const skipReason = getSkipReason(relativePath);

      if (skipReason) {
        skippedByReason[skipReason] = (skippedByReason[skipReason] ?? 0) + 1;
        continue;
      }

      const content = await readFile(file, "utf8");
      const normalized = await normalizeMarkdownFile(file, relativePath, source.type, content);

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

async function normalizeMarkdownFile(
  file: string,
  sourcePath: string,
  sourceType: SourceType,
  content: string,
): Promise<RepoWorkItem | null> {
  const stripped = stripMarkdown(content);
  const title = truncate(extractTitle(content) ?? titleFromFilename(sourcePath), MAX_TITLE_LENGTH);

  if (!title || !stripped) {
    return null;
  }

  const fileStat = await stat(file);
  const contentHash = createHash("sha256").update(content).digest("hex");
  const canonical = parseCanonicalMarkdown(content);
  const sourceStatusText = extractStatusText(content);
  const owner = extractSectionText(content, "Owner");
  const lastUpdated = extractSectionText(content, "Last Updated");
  const fallbackWorkItemStatus = inferWorkItemStatus(sourceType, sourceStatusText, content);
  const workItemStatus = canonical.status ?? fallbackWorkItemStatus;
  const adminStatus = mapWorkItemStatusToAdminStatus(workItemStatus);
  const targetRole =
    canonical.nextRole ?? inferTargetRole(sourceType, sourcePath, `${title}\n${content}`);
  const itemType =
    mapMarkdownTypeToAdminItemType(canonical.itemType) ??
    inferItemType(sourceType, `${title}\n${content}`);
  const priority = canonical.priority ?? "medium";
  const taskTitle = canonical.task ? firstMeaningfulLine(canonical.task) : null;
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
    source_path: sourcePath,
    source_type: sourceType,
    imported_from_repo: true,
    import_version: IMPORT_VERSION,
    work_item_status: workItemStatus,
    work_item_status_source: canonical.status ? "markdown" : "fallback",
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
    source_mtime: fileStat.mtime.toISOString(),
    content_hash: contentHash,
    title_source: titleSource,
    source_status_text: sourceStatusText ?? undefined,
    source_owner: owner ?? undefined,
    source_last_updated: lastUpdated ?? undefined,
  };

  return {
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
    archivedAt: adminStatus === "archived" ? generatedAt : null,
    metadata,
  };
}

async function collectMarkdownFiles(directory: string): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>>;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectMarkdownFiles(entryPath);
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
    throw new Error(`Could not import ${item.sourcePath}: ${error.message}`);
  }

  return "created";
}

async function refreshExistingItem(
  supabase: ReturnType<typeof createServiceClient>,
  existing: ExistingRow,
  item: RepoWorkItem,
): Promise<ImportAction> {
  const metadata = normalizeMetadata(existing.metadata);
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

  const { error } = await supabase.from("admin_capture_items").update(patch).eq("id", existing.id);

  if (error) {
    throw new Error(`Could not refresh ${item.sourcePath}: ${error.message}`);
  }

  return "updated";
}

async function loadAdminCaptureRows(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ExistingRow[]> {
  const { data, error } = await supabase
    .from("admin_capture_items")
    .select(
      "id,item_type,status,priority,target_role,title,note,page_url,route,metadata,archived_at",
    )
    .limit(MAX_EXISTING_ROWS);

  if (error) {
    throw new Error(`Could not load existing admin backlog items: ${error.message}`);
  }

  return (data ?? []) as ExistingRow[];
}

function mapExistingImportedRows(rows: ExistingRow[]) {
  const map = new Map<string, ExistingRow>();

  for (const row of rows) {
    const metadata = normalizeMetadata(row.metadata);
    const sourcePath = typeof metadata.source_path === "string" ? metadata.source_path : null;
    const sourceType = typeof metadata.source_type === "string" ? metadata.source_type : null;

    if (metadata.imported_from_repo === true && sourcePath && sourceType) {
      map.set(sourceKey(sourceType, sourcePath), row);
    }
  }

  return map;
}

function countImportedDuplicates(rows: ExistingRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const metadata = normalizeMetadata(row.metadata);

    if (metadata.imported_from_repo !== true) {
      continue;
    }

    const sourcePath = typeof metadata.source_path === "string" ? metadata.source_path : null;
    const sourceType = typeof metadata.source_type === "string" ? metadata.source_type : null;

    if (!sourcePath || !sourceType) {
      continue;
    }

    const key = sourceKey(sourceType, sourcePath);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.values()).filter((count) => count > 1).length;
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
      missingRequiredFields: readRequiredFieldArray(item.metadata.missing_required_fields),
      invalidRequiredFields: readRequiredFieldArray(item.metadata.invalid_required_fields),
    }))
    .filter(
      (example) =>
        example.missingRequiredFields.length > 0 || example.invalidRequiredFields.length > 0,
    )
    .slice(0, 8);
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

function extractTitle(markdown: string) {
  const heading = extractFirstHeading(markdown, 1);
  return heading ? stripInlineMarkdown(heading) : null;
}

function extractStatusText(markdown: string) {
  const status =
    firstMeaningfulLine(extractMarkdownSection(markdown, "Status")) ??
    extractKeyValue(markdown, "Status") ??
    extractKeyValue(markdown, "Verdict") ??
    extractKeyValue(markdown, "Classification");

  return status ? truncate(stripInlineMarkdown(status), 240) : null;
}

function extractSectionText(markdown: string, heading: string) {
  const section = extractMarkdownSection(markdown, heading);
  const firstLine = firstMeaningfulLine(section);

  return firstLine ? truncate(stripInlineMarkdown(firstLine), 240) : null;
}

function extractKeyValue(markdown: string, key: string) {
  const match = markdown.match(new RegExp(`^${escapeRegExp(key)}:\\s*(.+?)\\s*$`, "im"));
  return match ? match[1] : null;
}

function inferWorkItemStatus(
  sourceType: SourceType,
  sourceStatusText: string | null,
  markdown: string,
): WorkItemStatus {
  const signal = `${sourceStatusText ?? ""}\n${markdown.slice(0, 1800)}`.toLowerCase();

  if (/\b(won'?t do|not needed|cancelled|canceled|superseded|closed)\b/.test(signal)) {
    return "closed";
  }

  if (sourceType === "archived_plan") {
    if (/\b(complete|completed|passed|done|qa-passed|qa passed)\b/.test(signal)) {
      return "completed";
    }

    return "archived";
  }

  if (sourceType === "active_plan") {
    if (/\b(paused|backlog|blocked|waiting)\b/.test(signal)) {
      return "backlog";
    }

    if (/\b(active|in progress|implemented|needs|ready|qa-passed|qa passed)\b/.test(signal)) {
      return "in_progress";
    }

    if (/\b(complete|completed|passed|done)\b/.test(signal)) {
      return "completed";
    }

    return "in_progress";
  }

  if (/\b(complete|completed|passed|done|qa-passed|qa passed)\b/.test(signal)) {
    return "completed";
  }

  return "backlog";
}

function inferTargetRole(
  sourceType: SourceType,
  sourcePath: string,
  searchText: string,
): TargetRole {
  const normalized = searchText.toLowerCase();
  const explicit = normalized.match(/\brole:\s*(backend|frontend|qa|copy|designer|architect)\b/);

  if (explicit) {
    return normalizeRole(explicit[1]) ?? "architect";
  }

  if (sourceType === "frontend_spec") {
    return "frontend";
  }

  if (sourceType === "product_brief") {
    return "architect";
  }

  const combined = `${sourcePath}\n${normalized}`;

  if (/\brunning coach\b|\bcoach\b/.test(combined)) {
    return "running_coach";
  }

  if (/\bqa\b|\btest\b|\bregression\b|\bsmoke\b|\bverdict\b/.test(combined)) {
    return "qa";
  }

  if (/\bcopy\b|\bcontent\b|\bmicrocopy\b/.test(combined)) {
    return "copy";
  }

  if (/\bdesign\b|\bdesigner\b|\bfigma\b|\bvisual\b/.test(combined)) {
    return "designer";
  }

  if (/\bprompt\b/.test(combined)) {
    return "prompt_engineer";
  }

  if (
    /\bbackend\b|\bsupabase\b|\bdatabase\b|\bmigration\b|\bserver\b|\bauth\b|\bapi\b|\brpc\b|\badmin\b/.test(
      combined,
    )
  ) {
    return "backend";
  }

  if (/\bfrontend\b|\bui\b|\bcomponent\b|\broute\b|\btsx\b|\browser\b|\bds\b/.test(combined)) {
    return "frontend";
  }

  return "architect";
}

function inferItemType(sourceType: SourceType, searchText: string): AdminItemType {
  const normalized = searchText.toLowerCase();

  if (/\bbug\b|\bfix\b|\bfail\b|\bfailed\b|\bregression\b|\bblocker\b/.test(normalized)) {
    return "bug";
  }

  if (sourceType === "active_plan" || sourceType === "archived_plan") {
    return "context_capture";
  }

  return "change_request";
}

function mapWorkItemStatusToAdminStatus(status: WorkItemStatus): AdminStatus {
  switch (status) {
    case "backlog":
      return "new";
    case "in_progress":
      return "ready_for_codex";
    case "completed":
      return "done";
    case "closed":
      return "done";
    case "archived":
      return "archived";
  }
}

function buildRepoMirrorNote(input: {
  sourcePath: string;
  sourceType: SourceType;
  workItemStatus: WorkItemStatus;
  owner: string | null;
  lastUpdated: string | null;
  excerpt: string;
  canonical: ParsedCanonicalMarkdown;
}) {
  if (input.canonical.exactHandoffPrompt) {
    return truncate(input.canonical.exactHandoffPrompt, MAX_NOTE_LENGTH);
  }

  if (input.canonical.task || input.canonical.stage || input.canonical.nextRole) {
    const role = input.canonical.nextRole
      ? formatMarkdownRole(input.canonical.nextRole).toUpperCase()
      : "ARCHITECT";
    const prompt = [
      `ROLE: ${role}`,
      "",
      "TASK:",
      input.canonical.task ?? titleFromFilename(input.sourcePath),
      "",
      "STAGE:",
      input.canonical.stage ?? `${role} handoff`,
      "",
      "CONTEXT:",
      `Source path: ${input.sourcePath}`,
      `Source type: ${input.sourceType}`,
      `Work item status: ${input.workItemStatus}`,
      input.owner ? `Owner: ${input.owner}` : null,
      input.lastUpdated ? `Last updated: ${input.lastUpdated}` : null,
      "",
      input.excerpt,
    ]
      .filter(Boolean)
      .join("\n");

    return truncate(prompt, MAX_NOTE_LENGTH);
  }

  const note = [
    "Repo work item mirror. Markdown remains canonical; Supabase stores only a bounded admin Backlog index.",
    `Source path: ${input.sourcePath}`,
    `Source type: ${input.sourceType}`,
    `Work item status: ${input.workItemStatus}`,
    input.owner ? `Owner: ${input.owner}` : null,
    input.lastUpdated ? `Last updated: ${input.lastUpdated}` : null,
    "",
    "Role-ready excerpt:",
    input.excerpt,
  ]
    .filter(Boolean)
    .join("\n");

  return truncate(note, MAX_NOTE_LENGTH);
}

function parseCanonicalMarkdown(markdown: string): ParsedCanonicalMarkdown {
  const raw: Partial<Record<CanonicalMarkdownField, string>> = {};
  const missingRequiredFields: CanonicalMarkdownField[] = [];
  const invalidRequiredFields: CanonicalMarkdownField[] = [];
  const sections = parseLeadMarkdownMetadataSections(markdown);

  for (const field of CANONICAL_MARKDOWN_FIELDS) {
    const value = sections.get(field);

    if (!value) {
      missingRequiredFields.push(field);
    } else {
      raw[field] = value;
    }
  }

  const status = normalizeMarkdownStatus(firstMeaningfulLine(raw.Status ?? null));
  const itemType = normalizeMarkdownItemType(firstMeaningfulLine(raw.Type ?? null));
  const priority = normalizeMarkdownPriority(firstMeaningfulLine(raw.Priority ?? null));
  const nextRole = normalizeCanonicalMarkdownRole(
    firstMeaningfulLine(raw["Next Recommended Role"] ?? null),
  );

  if (raw.Status && !status) {
    invalidRequiredFields.push("Status");
  }

  if (raw.Type && !itemType) {
    invalidRequiredFields.push("Type");
  }

  if (raw.Priority && !priority) {
    invalidRequiredFields.push("Priority");
  }

  if (raw["Next Recommended Role"] && !nextRole) {
    invalidRequiredFields.push("Next Recommended Role");
  }

  const task = raw.Task ? truncate(stripInlineMarkdown(raw.Task), 1200) : null;
  const stage = raw.Stage ? truncate(stripInlineMarkdown(raw.Stage), 240) : null;
  const exactHandoffPrompt = raw["Exact Handoff Prompt"]
    ? truncate(stripOuterCodeFence(raw["Exact Handoff Prompt"]), MAX_NOTE_LENGTH)
    : null;

  return {
    status,
    itemType,
    priority,
    nextRole,
    task,
    stage,
    exactHandoffPrompt,
    missingRequiredFields,
    invalidRequiredFields,
    raw,
  };
}

function parseLeadMarkdownMetadataSections(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker: string | null = null;
  let currentHeading: CanonicalMarkdownField | null = null;
  let currentBody: string[] = [];
  let startedLeadBlock = false;
  const sections = new Map<CanonicalMarkdownField, string>();

  const commitCurrent = () => {
    if (!currentHeading) {
      return;
    }

    const value = currentBody.join("\n").trim();

    if (value && !sections.has(currentHeading)) {
      sections.set(currentHeading, value);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (fenceMarker && trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = null;
      }

      if (currentHeading) {
        currentBody.push(line);
      }

      continue;
    }

    if (!inFence) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);

      if (headingMatch && headingMatch[1].length === 2) {
        const label = stripInlineMarkdown(headingMatch[2]);
        const canonicalField = findCanonicalMarkdownField(label);
        const allowedLeadHeading = canonicalField || ["Owner", "Last Updated"].includes(label);

        if (startedLeadBlock && !allowedLeadHeading) {
          commitCurrent();
          return sections;
        }

        if (!startedLeadBlock && !allowedLeadHeading && label !== "Status") {
          continue;
        }

        startedLeadBlock = true;
        commitCurrent();
        currentHeading = canonicalField;
        currentBody = [];
        continue;
      }

      if (line.match(/^#\s+.+?$/)) {
        continue;
      }
    }

    if (currentHeading) {
      currentBody.push(line);
    }
  }

  commitCurrent();
  return sections;
}

function findCanonicalMarkdownField(input: string): CanonicalMarkdownField | null {
  return (
    CANONICAL_MARKDOWN_FIELDS.find((field) => field.toLowerCase() === input.trim().toLowerCase()) ??
    null
  );
}

function extractMarkdownSection(markdown: string, heading: string) {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker: string | null = null;
  let collecting = false;
  let sectionLevel = 0;
  const body: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (fenceMarker && trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = null;
      }

      if (collecting) {
        body.push(line);
      }

      continue;
    }

    if (!inFence) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const label = stripInlineMarkdown(headingMatch[2]).toLowerCase();

        if (collecting && level <= sectionLevel) {
          break;
        }

        if (!collecting && label === heading.toLowerCase()) {
          collecting = true;
          sectionLevel = level;
          continue;
        }
      }
    }

    if (collecting) {
      body.push(line);
    }
  }

  const section = body.join("\n").trim();
  return section || null;
}

function extractFirstHeading(markdown: string, expectedLevel: number) {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (fenceMarker && trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = null;
      }

      continue;
    }

    if (inFence) {
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);

    if (headingMatch && headingMatch[1].length === expectedLevel) {
      return headingMatch[2];
    }
  }

  return null;
}

function firstMeaningfulLine(input: string | null | undefined) {
  return (
    input
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => !line.startsWith("-")) ?? null
  );
}

function normalizeMarkdownStatus(input: string | null): WorkItemStatus | null {
  const normalized = normalizeScalarToken(input);

  if (["backlog", "in_progress", "completed", "closed", "archived"].includes(normalized)) {
    return normalized as WorkItemStatus;
  }

  return null;
}

function normalizeMarkdownItemType(input: string | null): MarkdownItemType | null {
  const normalized = normalizeScalarToken(input);

  if (
    ["bug", "change_request", "context_capture", "plan", "frontend_spec", "product_brief"].includes(
      normalized,
    )
  ) {
    return normalized as MarkdownItemType;
  }

  return null;
}

function mapMarkdownTypeToAdminItemType(input: MarkdownItemType | null): AdminItemType | null {
  switch (input) {
    case "bug":
    case "change_request":
    case "context_capture":
      return input;
    case "plan":
    case "frontend_spec":
    case "product_brief":
      return "context_capture";
    case null:
      return null;
  }
}

function normalizeMarkdownPriority(input: string | null): AdminPriority | null {
  const normalized = normalizeScalarToken(input);

  if (["low", "medium", "high", "urgent"].includes(normalized)) {
    return normalized as AdminPriority;
  }

  return null;
}

function normalizeCanonicalMarkdownRole(input: string | null): TargetRole | null {
  const normalized = normalizeScalarToken(input);

  if (
    ["architect", "backend", "frontend", "designer", "copy", "qa", "running_coach"].includes(
      normalized,
    )
  ) {
    return normalized as TargetRole;
  }

  return null;
}

function normalizeScalarToken(input: string | null) {
  return (input ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s-]+/g, "_");
}

function stripOuterCodeFence(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/^(`{3,}|~{3,})[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n\1$/);
  return (match ? match[2] : trimmed).trim();
}

function formatMarkdownRole(role: TargetRole) {
  return role.replace(/_/g, " ");
}

function jsonValuesEqual(left: Json | undefined, right: Json | undefined) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[\s*-]*\[[ xX-]]\s+/gm, "")
    .replace(/^[\s*-]+\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2600);
}

function stripInlineMarkdown(input: string) {
  return input
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

function titleFromFilename(sourcePath: string) {
  return path
    .basename(sourcePath, ".md")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeSourcePath(input: string) {
  return input.split(path.sep).join("/");
}

function normalizeRole(input: string): TargetRole | null {
  const normalized = input.toLowerCase().replace(/[\s-]+/g, "_");

  if (
    [
      "architect",
      "backend",
      "frontend",
      "designer",
      "copy",
      "qa",
      "prompt_engineer",
      "running_coach",
    ].includes(normalized)
  ) {
    return normalized as TargetRole;
  }

  return null;
}

function normalizeMetadata(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

function sourceKey(sourceType: string, sourcePath: string) {
  return `${sourceType}:${sourcePath}`;
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
  return {
    Status: 0,
    Type: 0,
    Priority: 0,
    "Next Recommended Role": 0,
    Task: 0,
    Stage: 0,
    "Exact Handoff Prompt": 0,
  };
}

function countBySourceType(items: RepoWorkItem[]): Record<SourceType, number> {
  const counts = emptySourceCounts();

  for (const item of items) {
    counts[item.sourceType] += 1;
  }

  return counts;
}

function findExample(items: RepoWorkItem[], sourceType: SourceType): ExampleItem | null {
  const item = items.find((candidate) => candidate.sourceType === sourceType);

  if (!item) {
    return null;
  }

  return {
    title: item.title,
    sourcePath: item.sourcePath,
    sourceType: item.sourceType,
    status: item.workItemStatus,
    targetRole: item.targetRole,
  };
}

function truncate(input: string, maxLength: number) {
  return input.length > maxLength ? `${input.slice(0, maxLength - 3)}...` : input;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseArgs(rawArgs: string[]) {
  return {
    dryRun: rawArgs.includes("--dry-run"),
    refreshTriage: rawArgs.includes("--refresh-triage"),
  };
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

function printReport(report: {
  mode: "dry_run" | "live_upsert";
  ok: boolean;
  stats: ImportStats;
  refreshTriage: boolean;
  message: string;
}) {
  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        mode: report.mode,
        importVersion: IMPORT_VERSION,
        refreshTriage: report.refreshTriage,
        message: report.message,
        scanned: report.stats.discoveredBySourceType,
        eligible: report.stats.eligibleBySourceType,
        skippedByReason: report.stats.skippedByReason,
        results: {
          created: report.stats.created,
          updated: report.stats.updated,
          skipped: report.stats.skipped,
          duplicateCount: report.stats.duplicateCount,
          repoDerivedInReviewCount: report.stats.repoDerivedInReviewCount,
          manualRowCountBefore: report.stats.manualRowCountBefore,
          manualRowCountAfter: report.stats.manualRowCountAfter,
        },
        metadataQuality: {
          missingRequiredFieldCounts: report.stats.missingRequiredFieldCounts,
          invalidRequiredFieldCounts: report.stats.invalidRequiredFieldCounts,
          examples: report.stats.missingMetadataExamples,
          repoDerivedRowsNeverUseInReview: report.stats.repoDerivedInReviewCount === 0,
        },
        examples: report.stats.examples,
        idempotency: {
          upsertKey: "metadata.source_type + metadata.source_path",
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
