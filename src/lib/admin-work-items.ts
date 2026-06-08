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

export type AdminRepoWorkItemSourceType = (typeof adminRepoWorkItemSourceTypes)[number];
export type AdminWorkItemSourceGroup = (typeof adminWorkItemSourceGroups)[number];
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
