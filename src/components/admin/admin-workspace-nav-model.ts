import type { HitoIconName } from "@/components/ui/icon";

export type AdminAnalyticsSectionId =
  | "overview"
  | "funnel"
  | "feedback"
  | "ai"
  | "users"
  | "test-accounts";

export type AdminWorkspaceSectionId = AdminAnalyticsSectionId | "work-items";

export type AdminWorkspaceNavItem = {
  id: AdminWorkspaceSectionId;
  label: string;
  icon: HitoIconName;
  href: string;
};

export const ADMIN_ANALYTICS_SECTION_IDS: AdminAnalyticsSectionId[] = [
  "overview",
  "funnel",
  "feedback",
  "ai",
  "users",
  "test-accounts",
];

export const ADMIN_WORKSPACE_NAV_ITEMS: AdminWorkspaceNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "activity",
    href: "/admin/analytics?section=overview",
  },
  {
    id: "funnel",
    label: "Funnel & Usage",
    icon: "progress",
    href: "/admin/analytics?section=funnel",
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: "watch",
    href: "/admin/analytics?section=feedback",
  },
  {
    id: "ai",
    label: "AI & Entitlements",
    icon: "sparkles",
    href: "/admin/analytics?section=ai",
  },
  {
    id: "users",
    label: "Users",
    icon: "user",
    href: "/admin/analytics?section=users",
  },
  {
    id: "test-accounts",
    label: "Test accounts",
    icon: "shield-alert",
    href: "/admin/analytics?section=test-accounts",
  },
  {
    id: "work-items",
    label: "Work items",
    icon: "plan-note",
    href: "/admin/capture",
  },
];

export function parseAdminAnalyticsSection(value: unknown): AdminAnalyticsSectionId {
  return isAdminAnalyticsSectionId(value) ? value : "overview";
}

export function isAdminAnalyticsSectionId(value: unknown): value is AdminAnalyticsSectionId {
  return (
    typeof value === "string" &&
    ADMIN_ANALYTICS_SECTION_IDS.includes(value as AdminAnalyticsSectionId)
  );
}

export function getAdminWorkspaceSection(sectionId: AdminWorkspaceSectionId) {
  return (
    ADMIN_WORKSPACE_NAV_ITEMS.find((item) => item.id === sectionId) ?? ADMIN_WORKSPACE_NAV_ITEMS[0]
  );
}
