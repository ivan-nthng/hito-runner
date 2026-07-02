import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  AdminDataTableColumnHeader,
  AdminDataTableStaticHeader,
  AdminDataTableToolbar,
} from "@/components/admin/AdminOperationalComponents";
import {
  AnalyticsPanel,
  BooleanPill,
  CompactCount,
  EmptyPanel,
} from "@/components/admin/AdminAnalyticsPanels";
import {
  entitlementTone,
  formatCount,
  formatKey,
  formatShortDate,
} from "@/components/admin/admin-analytics-format";
import {
  AiEntitlementsSection,
  FeedbackSection,
  FunnelUsageSection,
  OverviewSection,
} from "@/components/admin/AdminAnalyticsSummarySections";
import {
  AdminWorkspacePageHeader,
  AdminWorkspaceSidebar,
} from "@/components/admin/AdminWorkspaceNav";
import {
  buildTestAccountActiveFilters,
  buildTestAccountRows,
  buildUsersActiveFilters,
  classificationLabel,
  classificationTone,
  compareTestAccountRows,
  compareUsersRows,
  linkedIdentityLabel,
  linkedIdentityTone,
  matchesTestAccountFilters,
  matchesUsersFilters,
  type SortDirection,
  type TestAccountOpsRow,
  type TestAccountsFilters,
  type TestAccountsSortKey,
  type TestAccountsSortState,
  type UsersFilters,
  type UsersSortKey,
  type UsersSortState,
} from "@/components/admin/admin-analytics-view-model";
import {
  getAdminWorkspaceSection,
  parseAdminAnalyticsSection,
  type AdminAnalyticsSectionId,
} from "@/components/admin/admin-workspace-nav-model";
import { Icon } from "@/components/ui/icon";
import {
  getAdminAnalytics,
  type AdminAnalyticsExcludedUserRow,
  type AdminAnalyticsResult,
  type AdminAnalyticsUserRow,
} from "@/lib/admin-analytics";
import {
  deleteAdminLocalTestAccount,
  getAdminLocalTestAccounts,
  type AdminLocalTestAccountLinkStatus,
  type AdminLocalTestAccountsResult,
} from "@/lib/admin-local-test-accounts";
import { APP_NAME } from "@/lib/app-config";

export const Route = createFileRoute("/admin/analytics")({
  validateSearch: (search: Record<string, unknown>): AdminAnalyticsSearch => ({
    section: parseAdminAnalyticsSection(search.section ?? search.tab),
  }),
  head: () => ({
    meta: [
      { title: `Admin analytics — ${APP_NAME}` },
      {
        name: "description",
        content: "Internal Hito admin operations summary from existing product truth.",
      },
    ],
  }),
  loader: loadAdminAnalyticsRouteData,
  component: AdminAnalyticsPage,
});

type AdminTab = AdminAnalyticsSectionId;

type AdminAnalyticsSearch = {
  section: AdminAnalyticsSectionId;
};

const ADMIN_SECTION_DESCRIPTIONS: Record<AdminTab, string> = {
  overview: "Top-level admin readback from existing Hito product truth.",
  funnel: "Activation, plan, and workout usage counts from canonical rows.",
  feedback: "Garmin evidence and feedback pipeline readiness from backend-shaped truth.",
  ai: "Entitlement rows, capability usage, and AI readback without exposing raw payloads.",
  users: "Backend-classified real users, scoped to internal operational readback.",
  "test-accounts": "Local and excluded QA accounts kept separate from real-user analytics.",
};

type DeleteState = {
  targetEmail: string | null;
  confirmEmail: string;
  pendingEmail: string | null;
  error: string | null;
  success: string | null;
};

const initialDeleteState: DeleteState = {
  targetEmail: null,
  confirmEmail: "",
  pendingEmail: null,
  error: null,
  success: null,
};

function AdminAnalyticsPage() {
  const { analyticsResult, testAccountsResult } = Route.useLoaderData();
  const search = Route.useSearch();
  const activeTab = search.section;
  const activeSection = getAdminWorkspaceSection(activeTab);

  return (
    <main className="min-h-screen bg-background text-foreground hito-canvas-atmosphere">
      <div className="hito-workbench-shell hito-workbench-shell-compact-sidebar">
        <AdminWorkspaceSidebar activeSection={activeTab} />

        <section className="hito-workbench-main">
          <AdminWorkspacePageHeader
            activeSection={activeTab}
            title={activeSection.label}
            description={ADMIN_SECTION_DESCRIPTIONS[activeTab]}
          />

          <div className="hito-route-stack mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
            <div>
              {activeTab === "test-accounts" ? (
                <TestAccountsCard
                  result={testAccountsResult}
                  excludedUsers={analyticsResult.ok ? analyticsResult.view.excludedUsers.rows : []}
                />
              ) : (
                <AnalyticsContent activeTab={activeTab} result={analyticsResult} />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

async function loadAdminAnalyticsRouteData() {
  const [analyticsResult, testAccountsResult] = await Promise.all([
    getAdminAnalytics(),
    getAdminLocalTestAccounts(),
  ]);

  if (
    !analyticsResult.ok &&
    (analyticsResult.reason === "authentication_required" ||
      analyticsResult.reason === "admin_required")
  ) {
    throw redirect({
      to: "/admin/login",
      search: {
        next: "/admin/analytics",
      },
    });
  }

  return { analyticsResult, testAccountsResult };
}

function AnalyticsContent({
  activeTab,
  result,
}: {
  activeTab: Exclude<AdminTab, "test-accounts">;
  result: AdminAnalyticsResult;
}) {
  if (!result.ok) {
    return <AnalyticsUnavailableState result={result} />;
  }

  switch (activeTab) {
    case "overview":
      return <OverviewSection view={result.view} />;
    case "funnel":
      return <FunnelUsageSection view={result.view} />;
    case "feedback":
      return <FeedbackSection view={result.view} />;
    case "ai":
      return <AiEntitlementsSection view={result.view} />;
    case "users":
      return <UsersSection rows={result.view.perUserRows} />;
  }
}

function AnalyticsUnavailableState({
  result,
}: {
  result: Extract<AdminAnalyticsResult, { ok: false }>;
}) {
  const tone = result.reason === "admin_required" ? "warning" : "destructive";
  const title =
    result.reason === "authentication_required"
      ? "Sign in as an admin."
      : result.reason === "admin_required"
        ? "Admin access is required."
        : "Admin analytics are unavailable.";

  return (
    <section className="hito-surface-flat p-6" data-tone={tone}>
      <div className="flex items-start gap-3">
        <Icon
          name={tone === "warning" ? "warning" : "shield-alert"}
          size="md"
          className="mt-0.5 text-muted-foreground"
        />
        <div>
          <span className="hito-status-pill" data-tone={tone}>
            {result.reason.replaceAll("_", " ")}
          </span>
          <h2 className="hito-modal-title mt-4">{title}</h2>
          <p className="hito-body mt-3 max-w-2xl text-muted-foreground">{result.message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/admin/login?next=%2Fadmin%2Fanalytics"
              className="hito-button hito-button-primary hito-button-md"
            >
              Sign in
            </a>
            <Link to="/" className="hito-button hito-button-secondary hito-button-md">
              Back to Hito
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function UsersSection({ rows }: { rows: AdminAnalyticsUserRow[] }) {
  const [filters, setFilters] = useState<UsersFilters>({
    query: "",
    profile: "all",
    activePlan: "all",
    activity: "all",
    lastActivity: "all",
    entitlement: "all",
  });
  const [sort, setSort] = useState<UsersSortState>({
    key: "lastActivity",
    direction: "desc",
  });

  const visibleRows = useMemo(() => {
    return rows
      .filter((row) => matchesUsersFilters(row, filters))
      .sort((a, b) => compareUsersRows(a, b, sort));
  }, [filters, rows, sort]);

  const setFilter = <Key extends keyof UsersFilters>(key: Key, value: UsersFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const setSortOption = (key: UsersSortKey, direction: SortDirection) => {
    setSort({ key, direction });
  };

  const activeFilters = buildUsersActiveFilters(filters, setFilter);
  const clearAllFilters = () => {
    setFilters({
      query: "",
      profile: "all",
      activePlan: "all",
      activity: "all",
      lastActivity: "all",
      entitlement: "all",
    });
  };

  return (
    <AnalyticsPanel
      eyebrow="Users"
      title="Real product users"
      description="Backend-classified real Hito users only. Local, QA, Codex, apply, admin, and suspected test accounts are excluded from this table."
    >
      {rows.length === 0 ? (
        <EmptyPanel
          title="No real users yet."
          description="Only test/local accounts exist in this environment. Use Test accounts for QA fixtures."
        />
      ) : (
        <div className="grid gap-4">
          <AdminDataTableToolbar
            activeFilters={activeFilters}
            clearAllFilters={clearAllFilters}
            onQueryChange={(value) => setFilter("query", value)}
            query={filters.query}
            rowCountLabel={`Showing ${formatCount(visibleRows.length)} of ${formatCount(
              rows.length,
            )} real users.`}
            searchLabel="Search users"
            searchPlaceholder="Email, user id, entitlement..."
          />

          {visibleRows.length === 0 ? (
            <EmptyPanel
              title="No real users match these filters."
              description="Adjust search or filters to return the backend-provided real user rows."
            />
          ) : null}

          <div className="hito-data-table-scroll">
            <table className="hito-data-table hito-data-table-min-xl">
              <caption className="sr-only">
                Admin real-user activity summary with search, filters, and sorting.
              </caption>
              <thead>
                <tr>
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="user"
                    filterActive={false}
                    label="User / email"
                    menuLabel="Sort and filter User / email"
                    onSort={setSortOption}
                    sortOptions={[
                      { label: "A to Z", key: "user", direction: "asc" },
                      { label: "Z to A", key: "user", direction: "desc" },
                    ]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="profile"
                    filterActive={filters.profile !== "all"}
                    filterOptions={[
                      { label: "All", value: "all" },
                      { label: "Profile present", value: "present" },
                      { label: "Missing", value: "missing" },
                    ]}
                    label="Profile"
                    menuLabel="Sort and filter Profile"
                    onFilterChange={(value) =>
                      setFilter("profile", value as UsersFilters["profile"])
                    }
                    onSort={setSortOption}
                    selectedFilter={filters.profile}
                    sortOptions={[
                      { label: "Profile present first", key: "profile", direction: "desc" },
                      { label: "Missing first", key: "profile", direction: "asc" },
                    ]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="activePlan"
                    filterActive={filters.activePlan !== "all"}
                    filterOptions={[
                      { label: "All", value: "all" },
                      { label: "Active", value: "active" },
                      { label: "No active", value: "none" },
                    ]}
                    label="Active plan"
                    menuLabel="Sort and filter Active plan"
                    onFilterChange={(value) =>
                      setFilter("activePlan", value as UsersFilters["activePlan"])
                    }
                    onSort={setSortOption}
                    selectedFilter={filters.activePlan}
                    sortOptions={[
                      { label: "Active first", key: "activePlan", direction: "desc" },
                      { label: "No active first", key: "activePlan", direction: "asc" },
                    ]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="plans"
                    filterActive={false}
                    label="Plans"
                    menuLabel="Sort and filter Plans"
                    onSort={setSortOption}
                    sortOptions={[
                      { label: "Highest first", key: "plans", direction: "desc" },
                      { label: "Lowest first", key: "plans", direction: "asc" },
                    ]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="workoutLogs"
                    filterActive={filters.activity !== "all"}
                    filterOptions={[
                      { label: "All", value: "all" },
                      { label: "Has logs", value: "has_logs" },
                      { label: "No logs", value: "no_logs" },
                    ]}
                    label="Workout logs"
                    menuLabel="Sort and filter Workout logs"
                    onFilterChange={(value) =>
                      setFilter("activity", value as UsersFilters["activity"])
                    }
                    onSort={setSortOption}
                    selectedFilter={filters.activity}
                    sortOptions={[
                      { label: "Highest first", key: "workoutLogs", direction: "desc" },
                      { label: "Lowest first", key: "workoutLogs", direction: "asc" },
                    ]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="lastActivity"
                    filterActive={filters.lastActivity !== "all"}
                    filterOptions={[
                      { label: "All", value: "all" },
                      { label: "Recent", value: "recent" },
                      { label: "Older", value: "older" },
                      { label: "No logs", value: "no_logs" },
                    ]}
                    label="Last activity"
                    menuLabel="Sort and filter Last activity"
                    onFilterChange={(value) =>
                      setFilter("lastActivity", value as UsersFilters["lastActivity"])
                    }
                    onSort={setSortOption}
                    selectedFilter={filters.lastActivity}
                    sortOptions={[
                      { label: "Newest first", key: "lastActivity", direction: "desc" },
                      { label: "Oldest first", key: "lastActivity", direction: "asc" },
                    ]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="feedback"
                    filterActive={false}
                    label="Feedback"
                    menuLabel="Sort and filter Feedback"
                    onSort={setSortOption}
                    sortOptions={[
                      { label: "Highest first", key: "feedback", direction: "desc" },
                      { label: "Lowest first", key: "feedback", direction: "asc" },
                    ]}
                  />
                  <AdminDataTableColumnHeader
                    activeSort={sort}
                    column="entitlement"
                    filterActive={filters.entitlement !== "all"}
                    filterOptions={[
                      { label: "All", value: "all" },
                      { label: "Basic", value: "basic" },
                      { label: "Pro", value: "pro" },
                      { label: "Missing/effective fallback", value: "missing" },
                    ]}
                    label="Entitlement"
                    menuLabel="Sort and filter Entitlement"
                    onFilterChange={(value) =>
                      setFilter("entitlement", value as UsersFilters["entitlement"])
                    }
                    onSort={setSortOption}
                    selectedFilter={filters.entitlement}
                    sortOptions={[
                      { label: "Pro first", key: "entitlement", direction: "desc" },
                      { label: "Basic first", key: "entitlement", direction: "asc" },
                    ]}
                  />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.userId} className="align-top">
                    <td className="hito-data-table-cell hito-data-table-cell-start">
                      <div className="grid gap-1">
                        <span className="font-medium text-foreground">
                          {row.email ?? "No email"}
                        </span>
                        <code className="hito-technical-mono hito-data-table-code hito-data-table-code-width-lg">
                          {row.userId}
                        </code>
                      </div>
                    </td>
                    <td className="hito-data-table-cell">
                      <BooleanPill
                        value={row.profilePresent}
                        trueLabel="Profile"
                        falseLabel="Missing"
                      />
                    </td>
                    <td className="hito-data-table-cell">
                      <BooleanPill
                        value={row.activePlanPresent}
                        trueLabel="Active"
                        falseLabel="No active plan"
                      />
                    </td>
                    <td className="hito-data-table-cell">
                      <CompactCount label="active" value={row.activePlanCount} />
                      <CompactCount label="archived" value={row.archivedPlanCount} />
                    </td>
                    <td className="hito-data-table-cell">
                      <CompactCount label="planned" value={row.plannedWorkoutCount} />
                      <CompactCount label="logs" value={row.workoutLogCount} />
                    </td>
                    <td className="hito-data-table-cell">
                      <span className="whitespace-nowrap text-sm text-foreground">
                        {formatShortDate(row.lastWorkoutLogDate)}
                      </span>
                    </td>
                    <td className="hito-data-table-cell">
                      <CompactCount label="Garmin" value={row.garminEvidenceCount} />
                      <CompactCount label="AI" value={row.aiInsightCount} />
                    </td>
                    <td className="hito-data-table-cell hito-data-table-cell-end">
                      <div className="grid gap-2">
                        <span
                          className="hito-status-pill"
                          data-tone={entitlementTone(row.entitlement.tier)}
                        >
                          {row.entitlement.tier}
                        </span>
                        <span className="hito-field-helper whitespace-nowrap">
                          {row.entitlement.status} · {formatKey(row.entitlement.source)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AnalyticsPanel>
  );
}

function TestAccountsCard({
  result,
  excludedUsers,
}: {
  result: AdminLocalTestAccountsResult;
  excludedUsers: AdminAnalyticsExcludedUserRow[];
}) {
  return (
    <section className="grid gap-6 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="hito-label">Test accounts</p>
          <h2 className="hito-modal-title mt-2">Test and excluded accounts</h2>
          <p className="hito-body mt-3 max-w-3xl text-muted-foreground">
            Local bypass testers plus backend-classified Supabase admin, test, and suspected test
            users. Local passwords are shown only when they come from the local bypass accounts
            file.
          </p>
        </div>
        <span className="hito-status-pill self-start" data-tone="warning">
          Local / QA only
        </span>
      </div>

      <TestAccountsSection result={result} excludedUsers={excludedUsers} />
    </section>
  );
}

function TestAccountsSection({
  result,
  excludedUsers,
}: {
  result: AdminLocalTestAccountsResult;
  excludedUsers: AdminAnalyticsExcludedUserRow[];
}) {
  if (!result.ok) {
    return <UnavailableState result={result} />;
  }

  const rows = buildTestAccountRows(result.accounts, excludedUsers);

  if (rows.length === 0) {
    return (
      <div className="hito-surface-flat p-6" data-tone="signal">
        <div className="flex items-start gap-3">
          <Icon name="user" size="md" className="mt-0.5 text-muted-foreground" />
          <div>
            <h3 className="hito-body font-medium text-foreground">No test accounts found.</h3>
            <p className="hito-field-helper mt-2">
              No local accounts or backend-classified excluded users were returned.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <TestAccountsTable rows={rows} />;
}

function UnavailableState({
  result,
}: {
  result: Extract<AdminLocalTestAccountsResult, { ok: false }>;
}) {
  const tone = result.reason === "admin_required" ? "warning" : "destructive";
  const title =
    result.reason === "authentication_required"
      ? "Sign in as the local admin."
      : result.reason === "admin_required"
        ? "Admin access is required."
        : result.reason === "local_test_accounts_unavailable"
          ? "Local test accounts are unavailable here."
          : "Test accounts could not be loaded.";

  return (
    <div className="hito-surface-flat p-6" data-tone={tone}>
      <div className="flex items-start gap-3">
        <Icon
          name={tone === "warning" ? "warning" : "shield-alert"}
          size="md"
          className="mt-0.5 text-muted-foreground"
        />
        <div>
          <span className="hito-status-pill" data-tone={tone}>
            {result.reason.replaceAll("_", " ")}
          </span>
          <h3 className="hito-modal-title mt-4">{title}</h3>
          <p className="hito-body mt-3 max-w-2xl text-muted-foreground">{result.message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/admin/login?next=%2Fadmin%2Fanalytics"
              className="hito-button hito-button-primary hito-button-md"
            >
              Sign in
            </a>
            <Link to="/" className="hito-button hito-button-secondary hito-button-md">
              Back to Hito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestAccountsTable({ rows }: { rows: TestAccountOpsRow[] }) {
  const deleteAccountFn = useServerFn(deleteAdminLocalTestAccount);
  const router = useRouter();
  const [deleteState, setDeleteState] = useState<DeleteState>(initialDeleteState);
  const [filters, setFilters] = useState<TestAccountsFilters>({
    query: "",
    role: "all",
    linkStatus: "all",
    deletable: "all",
    classification: "all",
  });
  const [sort, setSort] = useState<TestAccountsSortState>({
    key: "username",
    direction: "asc",
  });

  const visibleRows = useMemo(() => {
    return rows
      .filter((row) => matchesTestAccountFilters(row, filters))
      .sort((a, b) => compareTestAccountRows(a, b, sort));
  }, [filters, rows, sort]);

  const setFilter = <Key extends keyof TestAccountsFilters>(
    key: Key,
    value: TestAccountsFilters[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const setSortOption = (key: TestAccountsSortKey, direction: SortDirection) => {
    setSort({ key, direction });
  };

  const activeFilters = buildTestAccountActiveFilters(filters, setFilter);
  const clearAllFilters = () => {
    setFilters({
      query: "",
      role: "all",
      linkStatus: "all",
      deletable: "all",
      classification: "all",
    });
  };

  const beginDelete = (row: TestAccountOpsRow) => {
    if (!row.email) {
      return;
    }

    setDeleteState({
      targetEmail: row.email,
      confirmEmail: "",
      pendingEmail: null,
      error: null,
      success: null,
    });
  };

  const cancelDelete = () => {
    setDeleteState(initialDeleteState);
  };

  const submitDelete = async (row: TestAccountOpsRow) => {
    if (
      !row.email ||
      deleteState.confirmEmail.trim() !== row.email ||
      !row.localAccount?.deletable
    ) {
      return;
    }

    setDeleteState((current) => ({
      ...current,
      pendingEmail: row.email,
      error: null,
      success: null,
    }));

    try {
      const deleteResult = await deleteAccountFn({
        data: {
          email: row.email,
          confirmEmail: deleteState.confirmEmail,
        },
      });

      if (!deleteResult.ok) {
        setDeleteState((current) => ({
          ...current,
          pendingEmail: null,
          error: deleteResult.message,
          success: null,
        }));
        return;
      }

      setDeleteState({
        targetEmail: null,
        confirmEmail: "",
        pendingEmail: null,
        error: null,
        success: `${deleteResult.deleted.email} was removed from local test accounts.`,
      });
      await router.invalidate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "The local test account could not be deleted.";

      setDeleteState((current) => ({
        ...current,
        pendingEmail: null,
        error: errorMessage,
        success: null,
      }));
    }
  };

  return (
    <div className="grid gap-4">
      {deleteState.error ? (
        <p className="hito-field-error flex items-center gap-2">
          <Icon name="warning" size="xs" />
          {deleteState.error}
        </p>
      ) : null}
      {deleteState.success ? (
        <p className="hito-field-success flex items-center gap-2">
          <Icon name="check-circle" size="xs" />
          {deleteState.success}
        </p>
      ) : null}

      <AdminDataTableToolbar
        activeFilters={activeFilters}
        clearAllFilters={clearAllFilters}
        onQueryChange={(value) => setFilter("query", value)}
        query={filters.query}
        rowCountLabel={`Showing ${formatCount(visibleRows.length)} of ${formatCount(
          rows.length,
        )} test/excluded accounts.`}
        searchLabel="Search test accounts"
        searchPlaceholder="Username, email, display name, user id..."
      />

      {visibleRows.length === 0 ? (
        <EmptyPanel
          title="No test accounts match these filters."
          description="Adjust search or filters to return local or backend-classified excluded rows."
        />
      ) : null}

      <div className="hito-data-table-scroll">
        <table className="hito-data-table hito-data-table-min-lg">
          <caption className="sr-only">
            Test and excluded accounts visible to the admin runtime.
          </caption>
          <thead>
            <tr>
              <AdminDataTableColumnHeader
                activeSort={sort}
                column="username"
                filterActive={false}
                label="Account"
                menuLabel="Sort and filter Account"
                onSort={setSortOption}
                sortOptions={[
                  { label: "A to Z", key: "username", direction: "asc" },
                  { label: "Z to A", key: "username", direction: "desc" },
                ]}
              />
              <AdminDataTableColumnHeader
                activeSort={sort}
                column="email"
                filterActive={false}
                label="Email"
                menuLabel="Sort and filter Email"
                onSort={setSortOption}
                sortOptions={[
                  { label: "A to Z", key: "email", direction: "asc" },
                  { label: "Z to A", key: "email", direction: "desc" },
                ]}
              />
              <AdminDataTableStaticHeader label="Password" />
              <AdminDataTableColumnHeader
                activeSort={sort}
                column="role"
                filterActive={filters.role !== "all"}
                filterOptions={[
                  { label: "All", value: "all" },
                  { label: "Tester", value: "tester" },
                  { label: "Admin", value: "admin" },
                ]}
                label="Role"
                menuLabel="Sort and filter Role"
                onFilterChange={(value) => setFilter("role", value as TestAccountsFilters["role"])}
                onSort={setSortOption}
                selectedFilter={filters.role}
                sortOptions={[
                  { label: "Admin first", key: "role", direction: "asc" },
                  { label: "Tester first", key: "role", direction: "desc" },
                ]}
              />
              <AdminDataTableColumnHeader
                activeSort={sort}
                column="classification"
                filterActive={filters.classification !== "all"}
                filterOptions={[
                  { label: "All", value: "all" },
                  { label: "Local test", value: "local_test" },
                  { label: "Local admin", value: "local_admin" },
                  { label: "Supabase test", value: "supabase_test" },
                  { label: "Supabase admin", value: "supabase_admin" },
                  { label: "Suspected test", value: "suspected_test" },
                ]}
                label="Classification"
                menuLabel="Sort and filter Classification"
                onFilterChange={(value) =>
                  setFilter("classification", value as TestAccountsFilters["classification"])
                }
                onSort={setSortOption}
                selectedFilter={filters.classification}
                sortOptions={[
                  { label: "A to Z", key: "classification", direction: "asc" },
                  { label: "Z to A", key: "classification", direction: "desc" },
                ]}
              />
              <AdminDataTableColumnHeader
                activeSort={sort}
                column="linkedStatus"
                filterActive={filters.linkStatus !== "all"}
                filterOptions={[
                  { label: "All", value: "all" },
                  { label: "Linked", value: "linked" },
                  { label: "Missing", value: "missing" },
                  { label: "Lookup failed", value: "lookup_failed" },
                  { label: "Not configured", value: "not_configured" },
                ]}
                label="Linked status"
                menuLabel="Sort and filter Linked status"
                onFilterChange={(value) =>
                  setFilter("linkStatus", value as TestAccountsFilters["linkStatus"])
                }
                onSort={setSortOption}
                selectedFilter={filters.linkStatus}
                sortOptions={[
                  { label: "Linked first", key: "linkedStatus", direction: "asc" },
                  { label: "Missing first", key: "linkedStatus", direction: "desc" },
                ]}
              />
              <AdminDataTableColumnHeader
                activeSort={sort}
                column="deletable"
                filterActive={filters.deletable !== "all"}
                filterOptions={[
                  { label: "All", value: "all" },
                  { label: "Deletable", value: "deletable" },
                  { label: "Protected", value: "protected" },
                ]}
                label="Status"
                menuLabel="Sort and filter Status"
                onFilterChange={(value) =>
                  setFilter("deletable", value as TestAccountsFilters["deletable"])
                }
                onSort={setSortOption}
                selectedFilter={filters.deletable}
                sortOptions={[
                  { label: "Deletable first", key: "deletable", direction: "desc" },
                  { label: "Protected first", key: "deletable", direction: "asc" },
                ]}
              />
              <AdminDataTableStaticHeader label="Delete" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isConfirming = deleteState.targetEmail === row.email;
              const isPending = deleteState.pendingEmail === row.email;
              const confirmationMatches =
                !!row.email && deleteState.confirmEmail.trim() === row.email;
              const canDelete = Boolean(row.localAccount?.deletable && row.email);

              return (
                <tr key={row.key} className="align-top">
                  <td className="hito-data-table-cell hito-data-table-cell-start">
                    <div className="grid gap-1">
                      <span className="whitespace-nowrap font-medium text-foreground">
                        {row.username}
                      </span>
                      <span className="hito-field-helper whitespace-nowrap">{row.displayName}</span>
                    </div>
                  </td>
                  <td className="hito-data-table-cell">
                    {row.email ? (
                      <code className="hito-technical-mono hito-data-table-code">{row.email}</code>
                    ) : (
                      <span className="hito-field-helper">No email</span>
                    )}
                  </td>
                  <td className="hito-data-table-cell">
                    {row.password ? (
                      <>
                        <code className="hito-technical-mono hito-data-table-code">
                          {row.password}
                        </code>
                        <p className="hito-field-helper mt-2">Local bypass password only.</p>
                      </>
                    ) : (
                      <span className="hito-field-helper whitespace-nowrap">No local password</span>
                    )}
                  </td>
                  <td className="hito-data-table-cell">
                    <span
                      className="hito-status-pill"
                      data-tone={row.role === "admin" ? "signal" : "neutral"}
                    >
                      {row.role}
                    </span>
                  </td>
                  <td className="hito-data-table-cell">
                    <div className="grid gap-2">
                      <span
                        className="hito-status-pill whitespace-nowrap"
                        data-tone={classificationTone(row.classification)}
                      >
                        {classificationLabel(row.classification)}
                      </span>
                      <span className="hito-field-helper whitespace-nowrap">
                        {formatKey(row.classificationSource)} ·{" "}
                        {formatKey(row.classificationReason)}
                      </span>
                    </div>
                  </td>
                  <td className="hito-data-table-cell">
                    <div className="grid gap-2">
                      <LinkedIdentityStatus status={row.linkedStatus} userId={row.linkedUserId} />
                      <code className="hito-technical-mono hito-data-table-code hito-data-table-code-width-md">
                        {row.userId}
                      </code>
                    </div>
                  </td>
                  <td className="hito-data-table-cell">
                    {row.protectedFromDeletion ? (
                      <span className="hito-status-pill" data-tone="warning">
                        Protected
                      </span>
                    ) : row.deletable ? (
                      <span className="hito-status-pill" data-tone="success">
                        Deletable tester
                      </span>
                    ) : (
                      <span className="hito-status-pill">Not deletable</span>
                    )}
                  </td>
                  <td className="hito-data-table-cell hito-data-table-cell-end">
                    {canDelete ? (
                      <div className="hito-data-table-action-stack">
                        {isConfirming ? (
                          <>
                            <label className="grid gap-2">
                              <span className="hito-field-helper">
                                Type the exact email to delete this local tester.
                              </span>
                              <input
                                className="hito-field hito-field-sm"
                                disabled={isPending}
                                onChange={(event) =>
                                  setDeleteState((current) => ({
                                    ...current,
                                    confirmEmail: event.target.value,
                                    error: null,
                                    success: null,
                                  }))
                                }
                                placeholder={row.email ?? ""}
                                value={deleteState.confirmEmail}
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="hito-button hito-button-primary hito-button-sm"
                                data-tone="error"
                                disabled={!confirmationMatches || isPending}
                                onClick={() => void submitDelete(row)}
                              >
                                {isPending ? (
                                  <>
                                    <Icon name="loader" size="xs" className="animate-spin" />
                                    Deleting
                                  </>
                                ) : (
                                  <>
                                    <Icon name="trash" size="xs" />
                                    Delete tester
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="hito-button hito-button-ghost hito-button-sm"
                                disabled={isPending}
                                onClick={cancelDelete}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="hito-button hito-button-secondary hito-button-sm justify-self-start"
                            onClick={() => beginDelete(row)}
                          >
                            <Icon name="trash" size="xs" />
                            Delete
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="hito-field-helper hito-data-table-note">
                        {row.protectedFromDeletion
                          ? "Protected admin accounts cannot be deleted from this local UI."
                          : "Supabase-only or suspected rows cannot be deleted from this local UI."}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinkedIdentityStatus({
  status,
  userId,
}: {
  status: AdminLocalTestAccountLinkStatus;
  userId: string | null;
}) {
  const label = linkedIdentityLabel(status);
  const tone = linkedIdentityTone(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hito-status-pill" data-tone={tone}>
        {label}
      </span>
      {userId ? (
        <code className="hito-technical-mono hito-data-table-code hito-data-table-code-width-sm">
          {userId}
        </code>
      ) : null}
    </div>
  );
}
