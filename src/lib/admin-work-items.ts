export const adminRepoWorkItemSourceTypes = [
  "backlog_doc",
  "product_brief",
  "frontend_spec",
  "active_plan",
  "archived_plan",
] as const;

export const adminWorkItemSourceGroups = [
  "all_work",
  "backlog",
  "active_plans",
  "specs",
  "briefs",
  "archive",
] as const;

export const adminRepoWorkItemStatuses = [
  "backlog",
  "ready",
  "in_progress",
  "blocked",
  "completed",
  "closed",
  "archived",
] as const;

export const adminRepoWorkItemTypes = [
  "bug",
  "change_request",
  "context_capture",
  "plan",
  "frontend_spec",
  "product_brief",
] as const;

export const adminRepoWorkItemPriorities = ["low", "medium", "high", "urgent"] as const;

export const adminRepoWorkItemOwners = [
  "architect",
  "backend",
  "frontend",
  "design_system",
  "designer",
  "copy",
  "qa",
  "product",
  "running_coach",
] as const;

export const adminRepoWorkItemArchiveIntents = ["retain_in_place", "archive_when_closed"] as const;

export const adminRepoWorkItemFrontendLanes = ["product", "devtools", "marketing"] as const;

export const adminRepoWorkItemEpicSlugs = [
  "runner-core-readiness",
  "runner-evidence-and-progress",
  "adaptive-blueprint-planning",
  "commercial-financial-foundation",
  "owner-analytics-and-scenario-lab",
  "platform-and-operations",
  "marketing-and-growth",
  "legacy-history",
] as const;

export type AdminRepoWorkItemSourceType = (typeof adminRepoWorkItemSourceTypes)[number];
export type AdminWorkItemSourceGroup = (typeof adminWorkItemSourceGroups)[number];
export type AdminRepoWorkItemStatus = (typeof adminRepoWorkItemStatuses)[number];
export type AdminRepoWorkItemType = (typeof adminRepoWorkItemTypes)[number];
export type AdminRepoWorkItemPriority = (typeof adminRepoWorkItemPriorities)[number];
export type AdminRepoWorkItemOwner = (typeof adminRepoWorkItemOwners)[number];
export type AdminRepoWorkItemArchiveIntent = (typeof adminRepoWorkItemArchiveIntents)[number];
export type AdminRepoWorkItemFrontendLane = (typeof adminRepoWorkItemFrontendLanes)[number];
export type AdminRepoWorkItemEpic = (typeof adminRepoWorkItemEpicSlugs)[number];
export type AdminRepoWorkItemMetadataState = "complete" | "legacy_debt" | "malformed";
export type AdminRepoWorkItemKind = "backlog_item" | "plan" | "frontend_spec" | "brief";
export type AdminRepoWorkItemLifecycle = "backlog" | "active" | "archived" | "spec" | "brief";

export type AdminRepoWorkItemMetadata = {
  workItemKind: AdminRepoWorkItemKind;
  workItemLifecycle: AdminRepoWorkItemLifecycle;
  sourceGroup: Exclude<AdminWorkItemSourceGroup, "all_work">;
  sourceGroupLabel: string;
  sourceLabel: string;
};

export const adminWorkItemSourceGroupOptions: Array<{
  value: AdminWorkItemSourceGroup;
  label: string;
}> = [
  { value: "all_work", label: "All work" },
  { value: "backlog", label: "Backlog" },
  { value: "active_plans", label: "Active plans" },
  { value: "specs", label: "Specs" },
  { value: "briefs", label: "Briefs" },
  { value: "archive", label: "Archive" },
];

const repoWorkItemMetadataBySourceType: Record<
  AdminRepoWorkItemSourceType,
  AdminRepoWorkItemMetadata
> = {
  backlog_doc: {
    workItemKind: "backlog_item",
    workItemLifecycle: "backlog",
    sourceGroup: "backlog",
    sourceGroupLabel: "Backlog",
    sourceLabel: "Backlog item",
  },
  product_brief: {
    workItemKind: "brief",
    workItemLifecycle: "brief",
    sourceGroup: "briefs",
    sourceGroupLabel: "Briefs",
    sourceLabel: "Brief",
  },
  frontend_spec: {
    workItemKind: "frontend_spec",
    workItemLifecycle: "spec",
    sourceGroup: "specs",
    sourceGroupLabel: "Specs",
    sourceLabel: "Frontend spec",
  },
  active_plan: {
    workItemKind: "plan",
    workItemLifecycle: "active",
    sourceGroup: "active_plans",
    sourceGroupLabel: "Active plans",
    sourceLabel: "Active plan",
  },
  archived_plan: {
    workItemKind: "plan",
    workItemLifecycle: "archived",
    sourceGroup: "archive",
    sourceGroupLabel: "Archive",
    sourceLabel: "Archived plan",
  },
};

export function isAdminRepoWorkItemSourceType(value: string): value is AdminRepoWorkItemSourceType {
  return adminRepoWorkItemSourceTypes.includes(value as AdminRepoWorkItemSourceType);
}

export function isAdminWorkItemSourceGroup(value: string): value is AdminWorkItemSourceGroup {
  return adminWorkItemSourceGroups.includes(value as AdminWorkItemSourceGroup);
}

export function isAdminRepoWorkItemStatus(value: string): value is AdminRepoWorkItemStatus {
  return adminRepoWorkItemStatuses.includes(value as AdminRepoWorkItemStatus);
}

export function isAdminRepoWorkItemType(value: string): value is AdminRepoWorkItemType {
  return adminRepoWorkItemTypes.includes(value as AdminRepoWorkItemType);
}

export function isAdminRepoWorkItemPriority(value: string): value is AdminRepoWorkItemPriority {
  return adminRepoWorkItemPriorities.includes(value as AdminRepoWorkItemPriority);
}

export function isAdminRepoWorkItemOwner(value: string): value is AdminRepoWorkItemOwner {
  return adminRepoWorkItemOwners.includes(value as AdminRepoWorkItemOwner);
}

export function isAdminRepoWorkItemArchiveIntent(
  value: string,
): value is AdminRepoWorkItemArchiveIntent {
  return adminRepoWorkItemArchiveIntents.includes(value as AdminRepoWorkItemArchiveIntent);
}

export function isAdminRepoWorkItemFrontendLane(
  value: string,
): value is AdminRepoWorkItemFrontendLane {
  return adminRepoWorkItemFrontendLanes.includes(value as AdminRepoWorkItemFrontendLane);
}

export function isAdminRepoWorkItemEpic(value: string): value is AdminRepoWorkItemEpic {
  return adminRepoWorkItemEpicSlugs.includes(value as AdminRepoWorkItemEpic);
}

export function getAdminRepoWorkItemMetadata(
  sourceType: AdminRepoWorkItemSourceType,
): AdminRepoWorkItemMetadata {
  return repoWorkItemMetadataBySourceType[sourceType];
}

export function getAdminWorkItemSourceGroupLabel(sourceGroup: AdminWorkItemSourceGroup) {
  return (
    adminWorkItemSourceGroupOptions.find((option) => option.value === sourceGroup)?.label ??
    "All work"
  );
}
