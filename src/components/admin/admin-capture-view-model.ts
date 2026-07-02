import type { HitoIconName } from "@/components/ui/icon";
import {
  adminCaptureItemTypes,
  adminCapturePriorities,
  adminCaptureStatuses,
  adminCaptureTargetRoles,
  type AdminCaptureBacklogView,
  type AdminCaptureItemType,
  type AdminCaptureItemView,
  type AdminCapturePriority,
  type AdminCaptureResult,
  type AdminCaptureSourceGroupFilter,
  type AdminCaptureStatus,
  type AdminCaptureTargetRole,
} from "@/lib/admin-capture";
import {
  getAdminWorkItemSourceGroupLabel,
  isAdminWorkItemSourceGroup,
} from "@/lib/admin-work-items";

export type CaptureStatusFilter = AdminCaptureStatus | "all";
export type NullableFilter<T extends string> = T | "all";

export type CaptureSearch = {
  status: CaptureStatusFilter;
  source: AdminCaptureSourceGroupFilter;
  type: NullableFilter<AdminCaptureItemType>;
  priority: NullableFilter<AdminCapturePriority>;
  role: NullableFilter<AdminCaptureTargetRole>;
  q: string | number;
};

export type QuickNoteState = {
  open: boolean;
  itemType: AdminCaptureItemType;
  priority: AdminCapturePriority | "";
  targetRole: AdminCaptureTargetRole | "";
  title: string;
  note: string;
  route: string;
  pending: boolean;
  error: string | null;
  success: string | null;
};

export type MutationState = {
  itemId: string | null;
  field: "triage" | "note" | "prompt" | "delete" | null;
  message: string | null;
  tone: "success" | "error" | null;
};

export type RepoDerivedInfo = {
  readOnly: boolean;
  sourcePath: string | null;
  sourceType: string | null;
  workItemStatus: string | null;
  markdownStatus: string | null;
  markdownType: string | null;
  markdownPriority: string | null;
  markdownNextRole: string | null;
  workItemKind: string | null;
  workItemLifecycle: string | null;
  sourceGroup: string | null;
  sourceGroupLabel: string | null;
  sourceLabel: string | null;
  missingRequiredFields: string[];
  invalidRequiredFields: string[];
};

export const STATUS_FILTERS: Array<{ value: CaptureStatusFilter; label: string }> = [
  { value: "all", label: "Active" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
];

export const ACTIVE_CAPTURE_STATUSES: AdminCaptureStatus[] = [
  "new",
  "in_review",
  "ready_for_codex",
];

export const EDITABLE_CAPTURE_STATUS_OPTIONS: Array<{
  value: AdminCaptureStatus;
  label: string;
}> = [
  { value: "new", label: "new" },
  { value: "done", label: "done" },
  { value: "archived", label: "archived" },
];

export const initialQuickNoteState: QuickNoteState = {
  open: false,
  itemType: "context_capture",
  priority: "",
  targetRole: "",
  title: "",
  note: "",
  route: "",
  pending: false,
  error: null,
  success: null,
};

const ADMIN_CAPTURE_UTC_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function buildCaptureHref(search: CaptureSearch, patch: Partial<CaptureSearch>) {
  const next = { ...search, ...patch };
  const params = new URLSearchParams();
  params.set("status", next.status);
  params.set("source", next.source);
  params.set("type", next.type);
  params.set("priority", next.priority);
  params.set("role", next.role);
  params.set("q", captureQueryText(next.q));
  return `/admin/capture?${params.toString()}`;
}

export function filterBacklogViewForStatus(
  view: AdminCaptureBacklogView,
  status: CaptureStatusFilter,
): AdminCaptureBacklogView {
  if (status !== "all") {
    return view;
  }

  const items = view.items.filter((item) => ACTIVE_CAPTURE_STATUSES.includes(item.status));

  return {
    ...view,
    total: items.length,
    shown: items.length,
    items,
  };
}

export function countForStatusFilter(
  status: CaptureStatusFilter,
  counts: Record<AdminCaptureStatus, number>,
) {
  if (status === "all") {
    return ACTIVE_CAPTURE_STATUSES.reduce((total, activeStatus) => total + counts[activeStatus], 0);
  }

  return counts[status];
}

export function getActiveCaptureFilters(search: CaptureSearch) {
  const query = captureQueryText(search.q);
  const filters: Array<{
    id: string;
    label: string;
    removePatch: Partial<CaptureSearch>;
    value: string;
  }> = [];

  if (query) {
    filters.push({
      id: "q",
      label: "Search",
      value: query,
      removePatch: { q: "" },
    });
  }

  if (search.source !== "all_work") {
    filters.push({
      id: "source",
      label: "Source",
      value: getAdminWorkItemSourceGroupLabel(search.source),
      removePatch: { source: "all_work" },
    });
  }

  if (search.type !== "all") {
    filters.push({
      id: "type",
      label: "Type",
      value: formatItemType(search.type),
      removePatch: { type: "all" },
    });
  }

  if (search.priority !== "all") {
    filters.push({
      id: "priority",
      label: "Priority",
      value: formatPriority(search.priority),
      removePatch: { priority: "all" },
    });
  }

  if (search.role !== "all") {
    filters.push({
      id: "role",
      label: "Target role",
      value: formatTargetRole(search.role),
      removePatch: { role: "all" },
    });
  }

  return filters;
}

export function statusTone(status: AdminCaptureStatus) {
  switch (status) {
    case "new":
    case "in_review":
    case "ready_for_codex":
      return "rollout";
    case "done":
      return "success";
    case "archived":
      return "muted";
  }
}

export function statusIcon(status: AdminCaptureStatus): HitoIconName {
  switch (status) {
    case "new":
    case "in_review":
    case "ready_for_codex":
      return "plus";
    case "done":
      return "check";
    case "archived":
      return "file-text";
  }
}

export function priorityTone(priority: AdminCapturePriority) {
  return priority === "urgent" || priority === "high" ? "warning" : undefined;
}

export function formatCaptureMutationError(
  result: Extract<AdminCaptureResult<unknown>, { ok: false }>,
) {
  return result.reason === "repo_derived_read_only"
    ? "Repo-derived items are read-only. Edit the source markdown instead."
    : result.message;
}

export function formatItemSource(item: AdminCaptureItemView) {
  const repoSource = getRepoDerivedInfo(item);

  if (repoSource.readOnly) {
    return repoSource.sourceLabel ?? "Repo import";
  }

  return item.source === "captured_ui" ? "Captured UI" : "Quick note";
}

export function getRepoDerivedInfo(item: AdminCaptureItemView): RepoDerivedInfo {
  const metadata = isJsonObject(item.metadata) ? item.metadata : {};
  const repoWorkItem = item.repoWorkItem;
  const sourcePath = repoWorkItem?.sourcePath ?? getMetadataString(metadata.source_path);
  const importedFromRepo =
    metadata.imported_from_repo === true || item.source === "repo_import" || Boolean(sourcePath);

  return {
    readOnly: importedFromRepo,
    sourcePath,
    sourceType: repoWorkItem?.sourceType ?? getMetadataString(metadata.source_type),
    workItemStatus: repoWorkItem?.workItemStatus ?? getMetadataString(metadata.work_item_status),
    markdownStatus: getMetadataString(metadata.markdown_status),
    markdownType: getMetadataString(metadata.markdown_type),
    markdownPriority: getMetadataString(metadata.markdown_priority),
    markdownNextRole: getMetadataString(metadata.markdown_next_role),
    workItemKind: repoWorkItem?.workItemKind ?? getMetadataString(metadata.work_item_kind),
    workItemLifecycle:
      repoWorkItem?.workItemLifecycle ?? getMetadataString(metadata.work_item_lifecycle),
    sourceGroup: repoWorkItem?.sourceGroup ?? getMetadataString(metadata.source_group),
    sourceGroupLabel:
      repoWorkItem?.sourceGroupLabel ?? getMetadataString(metadata.source_group_label),
    sourceLabel: repoWorkItem?.sourceLabel ?? getMetadataString(metadata.source_label),
    missingRequiredFields: getMetadataStringList(metadata.missing_required_fields),
    invalidRequiredFields: getMetadataStringList(metadata.invalid_required_fields),
  };
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMetadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}

function getMetadataStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => getMetadataString(item))
    .filter((item): item is string => Boolean(item));
}

export function readOnlyMetadataTooltip(kind: "status" | "type" | "priority" | "role" | undefined) {
  switch (kind) {
    case "status":
      return "Status from source markdown. Change it in the source work item, then refresh the import.";
    case "type":
      return "Type from source markdown. Change it in the source work item, then refresh the import.";
    case "priority":
      return "Priority from source markdown. Change it in the source work item, then refresh the import.";
    case "role":
      return "Owner role from source markdown. Change it in the source work item, then refresh the import.";
    default:
      return null;
  }
}

export function formatRepoMarkdownStatus(repoSource: RepoDerivedInfo, item: AdminCaptureItemView) {
  const markdownStatus = repoSource.markdownStatus ?? repoSource.workItemStatus;

  if (markdownStatus) {
    return `status: ${formatMetadataTagValue(markdownStatus)}`;
  }

  return `status: ${formatStatusTagValue(item.status)}`;
}

export function repoMarkdownStatusTone(repoSource: RepoDerivedInfo) {
  const status = normalizeMarkdownValue(repoSource.markdownStatus ?? repoSource.workItemStatus);

  return status === "completed"
    ? "success"
    : status === "closed" || status === "archived"
      ? undefined
      : status === "in_progress"
        ? "signal"
        : "rollout";
}

export function markdownPriorityTone(repoSource: RepoDerivedInfo) {
  const priority = normalizeMarkdownValue(repoSource.markdownPriority);
  return priority === "urgent" || priority === "high" ? "warning" : undefined;
}

export function formatMarkdownMetadataValue(
  label: string,
  value: string | null | undefined,
  fallback?: string | null,
) {
  return `${label}: ${formatMetadataTagValue(value ?? fallback ?? "unset")}`;
}

export function formatMetadataFieldName(value: string) {
  return formatMetadataTagValue(value.replace(/^markdown_/, ""));
}

export function formatMetadataLabel(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatMetadataTagValue(value: string) {
  return value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function normalizeMarkdownValue(value: string | null | undefined) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_") ?? ""
  );
}

export function parseCaptureStatus(value: unknown): CaptureStatusFilter {
  if (value === "done" || value === "archived" || value === "all") {
    return value;
  }

  if (adminCaptureStatuses.includes(value as AdminCaptureStatus)) {
    return "all";
  }

  return "all";
}

export function parseCaptureSourceGroup(value: unknown): AdminCaptureSourceGroupFilter {
  return typeof value === "string" && isAdminWorkItemSourceGroup(value) ? value : "all_work";
}

export function parseNullableFilter<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): NullableFilter<T> {
  return value === "all" || allowedValues.includes(value as T)
    ? (value as NullableFilter<T>)
    : "all";
}

export function parseSearchQuery(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    return stripSerializedSearchQuotes(value).trim().slice(0, 120);
  }

  return "";
}

export function captureQueryText(value: string | number) {
  return String(value).trim().slice(0, 120);
}

function stripSerializedSearchQuotes(value: string) {
  const trimmed = value.trim();

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function parseCaptureItemType(
  value: FormDataEntryValue | null,
): AdminCaptureItemType | null {
  return adminCaptureItemTypes.includes(value as AdminCaptureItemType)
    ? (value as AdminCaptureItemType)
    : null;
}

export function parseOptionalCapturePriority(
  value: FormDataEntryValue | null,
): AdminCapturePriority | null {
  return adminCapturePriorities.includes(value as AdminCapturePriority)
    ? (value as AdminCapturePriority)
    : null;
}

export function parseOptionalCaptureTargetRole(
  value: FormDataEntryValue | null,
): AdminCaptureTargetRole | null {
  return adminCaptureTargetRoles.includes(value as AdminCaptureTargetRole)
    ? (value as AdminCaptureTargetRole)
    : null;
}

export function getFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function copyTextToClipboard(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Safari/local contexts can reject async clipboard after the server round trip.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hour24 = date.getUTCHours();
  const hour12 = hour24 % 12 || 12;
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";

  return `${
    ADMIN_CAPTURE_UTC_MONTHS[date.getUTCMonth()]
  } ${date.getUTCDate()}, ${date.getUTCFullYear()}, ${hour12}:${minutes} ${period} UTC`;
}

export function formatStatusLabel(value: CaptureStatusFilter) {
  switch (value) {
    case "all":
      return "Active";
    case "new":
      return "New";
    case "in_review":
    case "ready_for_codex":
      return "Active";
    case "done":
      return "Done";
    case "archived":
      return "Archived";
  }
}

export function formatStatusTagValue(value: AdminCaptureStatus) {
  switch (value) {
    case "new":
      return "new";
    case "in_review":
    case "ready_for_codex":
      return "active";
    case "done":
      return "done";
    case "archived":
      return "archived";
  }
}

export function formatItemType(value: AdminCaptureItemType) {
  switch (value) {
    case "bug":
      return "Bug";
    case "change_request":
      return "Change request";
    case "context_capture":
      return "Context capture";
  }
}

export function formatItemTypeTagValue(value: AdminCaptureItemType) {
  return formatMetadataTagValue(formatItemType(value));
}

export function formatPriority(value: AdminCapturePriority) {
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

export function formatPriorityTagValue(value: AdminCapturePriority) {
  return formatMetadataTagValue(formatPriority(value));
}

export function formatTargetRole(value: AdminCaptureTargetRole) {
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
    case "product":
      return "Product";
    case "running_coach":
      return "Running Coach";
  }
}

export function formatTargetRoleTagValue(value: AdminCaptureTargetRole) {
  return formatMetadataTagValue(formatTargetRole(value));
}
