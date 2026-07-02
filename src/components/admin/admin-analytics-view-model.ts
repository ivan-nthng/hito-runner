import type {
  AdminDataTableActiveFilter,
  AdminSortDirection,
} from "@/components/admin/AdminOperationalComponents";
import type { AdminAnalyticsExcludedUserRow, AdminAnalyticsUserRow } from "@/lib/admin-analytics";
import type {
  AdminLocalTestAccountLinkStatus,
  AdminLocalTestAccountRole,
  AdminLocalTestAccountView,
} from "@/lib/admin-local-test-accounts";
import type { AdminUserClassification } from "@/lib/admin-user-classification";

export type SortDirection = AdminSortDirection;

export type UsersSortKey =
  | "user"
  | "profile"
  | "activePlan"
  | "plans"
  | "workoutLogs"
  | "lastActivity"
  | "feedback"
  | "entitlement";

export type UsersFilters = {
  query: string;
  profile: "all" | "present" | "missing";
  activePlan: "all" | "active" | "none";
  activity: "all" | "has_logs" | "no_logs";
  lastActivity: "all" | "recent" | "older" | "no_logs";
  entitlement: "all" | "basic" | "pro" | "missing";
};

export type UsersSortState = {
  key: UsersSortKey;
  direction: SortDirection;
};

export type TestAccountsSortKey =
  | "username"
  | "email"
  | "role"
  | "classification"
  | "linkedStatus"
  | "deletable";

export type TestAccountsFilters = {
  query: string;
  role: "all" | AdminLocalTestAccountRole;
  linkStatus: "all" | AdminLocalTestAccountLinkStatus;
  deletable: "all" | "deletable" | "protected";
  classification: "all" | AdminUserClassification;
};

export type TestAccountsSortState = {
  key: TestAccountsSortKey;
  direction: SortDirection;
};

export type TestAccountOpsRow = {
  key: string;
  username: string;
  email: string | null;
  password: string | null;
  role: AdminLocalTestAccountRole | "suspected";
  displayName: string;
  userId: string;
  linkedStatus: AdminLocalTestAccountLinkStatus;
  linkedUserId: string | null;
  protectedFromDeletion: boolean;
  deletable: boolean;
  classification: AdminUserClassification;
  classificationReason: string;
  classificationSource: string;
  localAccount: AdminLocalTestAccountView | null;
};

export function linkedIdentityLabel(status: AdminLocalTestAccountLinkStatus) {
  switch (status) {
    case "linked":
      return "Supabase linked";
    case "missing":
      return "Supabase missing";
    case "not_configured":
      return "Supabase not configured";
    case "lookup_failed":
      return "Lookup failed";
  }
}

export function linkedIdentityTone(status: AdminLocalTestAccountLinkStatus) {
  switch (status) {
    case "linked":
      return "success";
    case "missing":
    case "lookup_failed":
      return "warning";
    case "not_configured":
      return "neutral";
  }
}

export function buildUsersActiveFilters(
  filters: UsersFilters,
  setFilter: <Key extends keyof UsersFilters>(key: Key, value: UsersFilters[Key]) => void,
): AdminDataTableActiveFilter[] {
  const items: AdminDataTableActiveFilter[] = [];

  if (filters.query) {
    items.push({
      id: "query",
      label: "Search",
      value: filters.query,
      onRemove: () => setFilter("query", ""),
    });
  }

  if (filters.profile !== "all") {
    items.push({
      id: "profile",
      label: "Profile",
      value: usersFilterLabel("profile", filters.profile),
      onRemove: () => setFilter("profile", "all"),
    });
  }

  if (filters.activePlan !== "all") {
    items.push({
      id: "activePlan",
      label: "Active plan",
      value: usersFilterLabel("activePlan", filters.activePlan),
      onRemove: () => setFilter("activePlan", "all"),
    });
  }

  if (filters.activity !== "all") {
    items.push({
      id: "activity",
      label: "Workout logs",
      value: usersFilterLabel("activity", filters.activity),
      onRemove: () => setFilter("activity", "all"),
    });
  }

  if (filters.lastActivity !== "all") {
    items.push({
      id: "lastActivity",
      label: "Last activity",
      value: usersFilterLabel("lastActivity", filters.lastActivity),
      onRemove: () => setFilter("lastActivity", "all"),
    });
  }

  if (filters.entitlement !== "all") {
    items.push({
      id: "entitlement",
      label: "Entitlement",
      value: usersFilterLabel("entitlement", filters.entitlement),
      onRemove: () => setFilter("entitlement", "all"),
    });
  }

  return items;
}

export function matchesUsersFilters(row: AdminAnalyticsUserRow, filters: UsersFilters) {
  const query = filters.query.trim().toLowerCase();

  if (query) {
    const haystack = [
      row.email,
      row.userId,
      row.entitlement.tier,
      row.entitlement.status,
      row.entitlement.source,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (filters.profile === "present" && !row.profilePresent) {
    return false;
  }

  if (filters.profile === "missing" && row.profilePresent) {
    return false;
  }

  if (filters.activePlan === "active" && !row.activePlanPresent) {
    return false;
  }

  if (filters.activePlan === "none" && row.activePlanPresent) {
    return false;
  }

  if (filters.activity === "has_logs" && row.workoutLogCount === 0) {
    return false;
  }

  if (filters.activity === "no_logs" && row.workoutLogCount > 0) {
    return false;
  }

  if (filters.lastActivity === "recent" && !isRecentActivity(row.lastWorkoutLogDate)) {
    return false;
  }

  if (
    filters.lastActivity === "older" &&
    (!row.lastWorkoutLogDate || isRecentActivity(row.lastWorkoutLogDate))
  ) {
    return false;
  }

  if (filters.lastActivity === "no_logs" && row.lastWorkoutLogDate) {
    return false;
  }

  const normalizedTier = row.entitlement.tier.toLowerCase();

  if (filters.entitlement === "basic" && normalizedTier !== "basic") {
    return false;
  }

  if (filters.entitlement === "pro" && normalizedTier !== "pro") {
    return false;
  }

  if (filters.entitlement === "missing" && row.entitlement.source !== "missing_row_effective_pro") {
    return false;
  }

  return true;
}

export function compareUsersRows(
  a: AdminAnalyticsUserRow,
  b: AdminAnalyticsUserRow,
  sort: UsersSortState,
) {
  const direction = sort.direction === "asc" ? 1 : -1;

  switch (sort.key) {
    case "user":
      return direction * compareStrings(a.email ?? a.userId, b.email ?? b.userId);
    case "profile":
      return direction * compareBooleans(a.profilePresent, b.profilePresent);
    case "activePlan":
      return direction * compareBooleans(a.activePlanPresent, b.activePlanPresent);
    case "plans":
      return (
        direction *
        compareNumbers(
          a.activePlanCount + a.archivedPlanCount,
          b.activePlanCount + b.archivedPlanCount,
        )
      );
    case "workoutLogs":
      return direction * compareNumbers(a.workoutLogCount, b.workoutLogCount);
    case "feedback":
      return (
        direction *
        compareNumbers(
          a.garminEvidenceCount + a.aiInsightCount,
          b.garminEvidenceCount + b.aiInsightCount,
        )
      );
    case "entitlement":
      return (
        direction * compareNumbers(entitlementRank(a.entitlement), entitlementRank(b.entitlement))
      );
    case "lastActivity":
      return compareNullableDates(a.lastWorkoutLogDate, b.lastWorkoutLogDate, sort.direction);
  }
}

export function buildTestAccountRows(
  localAccounts: AdminLocalTestAccountView[],
  excludedUsers: AdminAnalyticsExcludedUserRow[],
) {
  const rows: TestAccountOpsRow[] = [];
  const seenKeys = new Set<string>();

  for (const account of localAccounts) {
    rows.push({
      key: `local:${account.email}`,
      username: account.username,
      email: account.email,
      password: account.password,
      role: account.role,
      displayName: account.displayName,
      userId: account.userId,
      linkedStatus: account.linkedSupabaseUser.status,
      linkedUserId: account.linkedSupabaseUser.userId,
      protectedFromDeletion: account.protectedFromDeletion,
      deletable: account.deletable,
      classification: account.classification,
      classificationReason: account.classificationReason,
      classificationSource: account.classificationSource,
      localAccount: account,
    });
    seenKeys.add(account.email.toLowerCase());
    seenKeys.add(account.userId);
    if (account.linkedSupabaseUser.userId) {
      seenKeys.add(account.linkedSupabaseUser.userId);
    }
  }

  for (const row of excludedUsers) {
    const localAccount = row.localAccount;
    const dedupeKeys = [
      row.email?.toLowerCase(),
      row.userId,
      localAccount?.email.toLowerCase(),
      localAccount?.userId,
      localAccount?.linkedSupabaseUserId ?? undefined,
    ].filter((value): value is string => Boolean(value));

    if (dedupeKeys.some((key) => seenKeys.has(key))) {
      continue;
    }

    const role = inferExcludedUserRole(row.classification, localAccount?.role ?? null);

    rows.push({
      key: `excluded:${row.userId}`,
      username: localAccount?.username ?? usernameFromEmail(row.email) ?? "Supabase user",
      email: row.email,
      password: null,
      role,
      displayName: localAccount?.displayName ?? row.email ?? row.userId,
      userId: row.userId,
      linkedStatus: "linked",
      linkedUserId: row.userId,
      protectedFromDeletion:
        row.classification === "local_admin" || row.classification === "supabase_admin",
      deletable: false,
      classification: row.classification,
      classificationReason: row.classificationReason,
      classificationSource: row.classificationSource,
      localAccount: null,
    });

    dedupeKeys.forEach((key) => seenKeys.add(key));
  }

  return rows;
}

export function buildTestAccountActiveFilters(
  filters: TestAccountsFilters,
  setFilter: <Key extends keyof TestAccountsFilters>(
    key: Key,
    value: TestAccountsFilters[Key],
  ) => void,
): AdminDataTableActiveFilter[] {
  const items: AdminDataTableActiveFilter[] = [];

  if (filters.query) {
    items.push({
      id: "query",
      label: "Search",
      value: filters.query,
      onRemove: () => setFilter("query", ""),
    });
  }

  if (filters.role !== "all") {
    items.push({
      id: "role",
      label: "Role",
      value: testAccountFilterLabel("role", filters.role),
      onRemove: () => setFilter("role", "all"),
    });
  }

  if (filters.linkStatus !== "all") {
    items.push({
      id: "linkStatus",
      label: "Linked status",
      value: testAccountFilterLabel("linkStatus", filters.linkStatus),
      onRemove: () => setFilter("linkStatus", "all"),
    });
  }

  if (filters.deletable !== "all") {
    items.push({
      id: "deletable",
      label: "Status",
      value: testAccountFilterLabel("deletable", filters.deletable),
      onRemove: () => setFilter("deletable", "all"),
    });
  }

  if (filters.classification !== "all") {
    items.push({
      id: "classification",
      label: "Classification",
      value: classificationLabel(filters.classification),
      onRemove: () => setFilter("classification", "all"),
    });
  }

  return items;
}

export function matchesTestAccountFilters(row: TestAccountOpsRow, filters: TestAccountsFilters) {
  const query = filters.query.trim().toLowerCase();

  if (query) {
    const haystack = [
      row.username,
      row.email,
      row.displayName,
      row.userId,
      row.linkedUserId,
      row.classification,
      row.classificationReason,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (filters.role !== "all" && row.role !== filters.role) {
    return false;
  }

  if (filters.linkStatus !== "all" && row.linkedStatus !== filters.linkStatus) {
    return false;
  }

  if (filters.deletable === "deletable" && !row.deletable) {
    return false;
  }

  if (filters.deletable === "protected" && !row.protectedFromDeletion) {
    return false;
  }

  if (filters.classification !== "all" && row.classification !== filters.classification) {
    return false;
  }

  return true;
}

export function compareTestAccountRows(
  a: TestAccountOpsRow,
  b: TestAccountOpsRow,
  sort: TestAccountsSortState,
) {
  const direction = sort.direction === "asc" ? 1 : -1;

  switch (sort.key) {
    case "username":
      return direction * compareStrings(a.username, b.username);
    case "email":
      return direction * compareStrings(a.email ?? "", b.email ?? "");
    case "role":
      return direction * compareStrings(a.role, b.role);
    case "classification":
      return direction * compareStrings(a.classification, b.classification);
    case "linkedStatus":
      return (
        direction *
        compareNumbers(linkedStatusRank(a.linkedStatus), linkedStatusRank(b.linkedStatus))
      );
    case "deletable":
      return direction * compareBooleans(a.deletable, b.deletable);
  }
}

function inferExcludedUserRole(
  classification: AdminUserClassification,
  localRole: AdminLocalTestAccountRole | null,
): TestAccountOpsRow["role"] {
  if (localRole) {
    return localRole;
  }

  if (classification === "local_admin" || classification === "supabase_admin") {
    return "admin";
  }

  if (classification === "suspected_test") {
    return "suspected";
  }

  return "tester";
}

function usernameFromEmail(email: string | null) {
  if (!email) {
    return null;
  }

  return email.split("@")[0] || email;
}

function usersFilterLabel(column: keyof UsersFilters, value: string) {
  if (column === "profile") {
    return value === "present" ? "Profile present" : "Missing";
  }

  if (column === "activePlan") {
    return value === "active" ? "Active" : "No active";
  }

  if (column === "activity") {
    return value === "has_logs" ? "Has logs" : "No logs";
  }

  if (column === "lastActivity") {
    switch (value) {
      case "recent":
        return "Recent";
      case "older":
        return "Older";
      case "no_logs":
        return "No logs";
    }
  }

  if (column === "entitlement") {
    switch (value) {
      case "basic":
        return "Basic";
      case "pro":
        return "Pro";
      case "missing":
        return "Missing/effective fallback";
    }
  }

  return value;
}

function testAccountFilterLabel(column: keyof TestAccountsFilters, value: string) {
  if (column === "role") {
    return value === "admin" ? "Admin" : "Tester";
  }

  if (column === "linkStatus") {
    return linkedIdentityLabel(value as AdminLocalTestAccountLinkStatus);
  }

  if (column === "deletable") {
    return value === "deletable" ? "Deletable" : "Protected";
  }

  return value;
}

function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

function compareNumbers(a: number, b: number) {
  return a - b;
}

function compareBooleans(a: boolean, b: boolean) {
  return Number(a) - Number(b);
}

function compareNullableDates(a: string | null, b: string | null, direction: SortDirection) {
  const aTime = dateTimeOrNull(a);
  const bTime = dateTimeOrNull(b);

  if (aTime === null && bTime === null) {
    return 0;
  }

  if (aTime === null) {
    return 1;
  }

  if (bTime === null) {
    return -1;
  }

  return direction === "asc" ? aTime - bTime : bTime - aTime;
}

function dateTimeOrNull(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isRecentActivity(value: string | null) {
  const timestamp = dateTimeOrNull(value);
  if (timestamp === null) {
    return false;
  }

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp <= thirtyDaysMs;
}

function entitlementRank(entitlement: AdminAnalyticsUserRow["entitlement"]) {
  const tier = entitlement.tier.toLowerCase();

  if (tier === "pro" && entitlement.source !== "missing_row_effective_pro") {
    return 3;
  }

  if (tier === "basic") {
    return 2;
  }

  if (entitlement.source === "missing_row_effective_pro") {
    return 1;
  }

  return 0;
}

function linkedStatusRank(status: AdminLocalTestAccountLinkStatus) {
  switch (status) {
    case "linked":
      return 3;
    case "missing":
      return 2;
    case "lookup_failed":
      return 1;
    case "not_configured":
      return 0;
  }
}

export function classificationLabel(classification: AdminUserClassification) {
  switch (classification) {
    case "real":
      return "Real user";
    case "local_test":
      return "Local tester";
    case "local_admin":
      return "Protected admin";
    case "supabase_test":
      return "Supabase test user";
    case "supabase_admin":
      return "Supabase admin";
    case "suspected_test":
      return "Suspected test";
  }
}

export function classificationTone(classification: AdminUserClassification) {
  switch (classification) {
    case "local_admin":
    case "supabase_admin":
      return "warning";
    case "local_test":
    case "supabase_test":
      return "signal";
    case "suspected_test":
      return "neutral";
    case "real":
      return "success";
  }
}
