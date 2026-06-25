import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import {
  AdminDataTableColumnHeader,
  AdminDataTableStaticHeader,
  AdminDataTableToolbar,
  type AdminDataTableActiveFilter,
} from "@/components/admin/AdminOperationalComponents";
import {
  AdminWorkspacePageHeader,
  AdminWorkspaceSidebar,
} from "@/components/admin/AdminWorkspaceNav";
import {
  getAdminWorkspaceSection,
  parseAdminAnalyticsSection,
  type AdminAnalyticsSectionId,
} from "@/components/admin/admin-workspace-nav-model";
import { Icon } from "@/components/ui/icon";
import {
  getAdminAnalytics,
  type AdminAnalyticsExcludedUserRow,
  type AdminAnalyticsKeyCount,
  type AdminAnalyticsResult,
  type AdminAnalyticsUserRow,
  type AdminAnalyticsView,
} from "@/lib/admin-analytics";
import {
  deleteAdminLocalTestAccount,
  getAdminLocalTestAccounts,
  type AdminLocalTestAccountLinkStatus,
  type AdminLocalTestAccountRole,
  type AdminLocalTestAccountsResult,
  type AdminLocalTestAccountView,
} from "@/lib/admin-local-test-accounts";
import type { AdminUserClassification } from "@/lib/admin-user-classification";
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

type SortDirection = "asc" | "desc";

type UsersSortKey =
  | "user"
  | "profile"
  | "activePlan"
  | "plans"
  | "workoutLogs"
  | "lastActivity"
  | "feedback"
  | "entitlement";

type UsersFilters = {
  query: string;
  profile: "all" | "present" | "missing";
  activePlan: "all" | "active" | "none";
  activity: "all" | "has_logs" | "no_logs";
  lastActivity: "all" | "recent" | "older" | "no_logs";
  entitlement: "all" | "basic" | "pro" | "missing";
};

type UsersSortState = {
  key: UsersSortKey;
  direction: SortDirection;
};

type TestAccountsSortKey =
  | "username"
  | "email"
  | "role"
  | "classification"
  | "linkedStatus"
  | "deletable";

type TestAccountsFilters = {
  query: string;
  role: "all" | AdminLocalTestAccountRole;
  linkStatus: "all" | AdminLocalTestAccountLinkStatus;
  deletable: "all" | "deletable" | "protected";
  classification: "all" | AdminUserClassification;
};

type TestAccountsSortState = {
  key: TestAccountsSortKey;
  direction: SortDirection;
};

type TestAccountOpsRow = {
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

function OverviewSection({ view }: { view: AdminAnalyticsView }) {
  return (
    <AnalyticsPanel
      eyebrow="Overview"
      title="Existing product truth"
      description="Top-level counts from auth, profile, plan, workout, and feedback tables."
      generatedAt={view.generatedAt}
    >
      <MetricGrid>
        <MetricCard
          label="Auth users"
          value={formatNullableCount(view.authUsers.total)}
          helper={view.authUsers.status === "available" ? "Supabase auth" : view.authUsers.status}
          tone={view.authUsers.status === "available" ? "neutral" : "warning"}
        />
        <MetricCard label="Profiles" value={formatCount(view.accountsActivation.runnerProfiles)} />
        <MetricCard label="Active plans" value={formatCount(view.plans.active)} />
        <MetricCard label="Archived plans" value={formatCount(view.plans.archived)} />
        <MetricCard
          label="Planned workouts"
          value={formatCount(view.workoutUsage.totalPlannedWorkouts)}
        />
        <MetricCard label="Workout logs" value={formatCount(view.workoutUsage.totalWorkoutLogs)} />
      </MetricGrid>
    </AnalyticsPanel>
  );
}

function FunnelUsageSection({ view }: { view: AdminAnalyticsView }) {
  return (
    <AnalyticsPanel
      eyebrow="Funnel & Usage"
      title="Setup, plans, and workout logging"
      description="Activation and usage counts already represented by canonical Hito rows."
      generatedAt={view.generatedAt}
    >
      <MetricGrid>
        <MetricCard
          label="Profiles / setup"
          value={formatCount(view.accountsActivation.usersWithProfile)}
        />
        <MetricCard
          label="Users with active plan"
          value={formatCount(view.accountsActivation.usersWithActivePlan)}
        />
        <MetricCard
          label="Users without active plan"
          value={formatNullableCount(view.accountsActivation.usersWithoutActivePlan)}
        />
        <MetricCard
          label="Setup to active"
          value={formatNullablePercent(view.accountsActivation.setupToActivePlanRate)}
        />
        <MetricCard
          label="Completion rate"
          value={formatNullablePercent(view.workoutUsage.roughCompletionRate)}
          helper="completed logs / non-rest workouts"
        />
        <MetricCard
          label="Active users without logs"
          value={formatCount(view.workoutUsage.activePlanUsersWithoutLogs)}
        />
      </MetricGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <KeyCountList title="Workout outcomes" items={view.workoutUsage.outcomeCounts} />
        <KeyCountList title="Plan source mix" items={view.plans.sourceKindCounts} />
        <KeyCountList title="Plan schema versions" items={view.plans.schemaVersionCounts} />
        <MetricCard
          label="No logs in last 30 days"
          value={formatCount(view.workoutUsage.activePlanUsersWithoutRecentLogs30d)}
          helper="active-plan users"
        />
      </div>
    </AnalyticsPanel>
  );
}

function FeedbackSection({ view }: { view: AdminAnalyticsView }) {
  return (
    <AnalyticsPanel
      eyebrow="Integrations / Feedback"
      title="Garmin evidence and feedback readiness"
      description="Counts for the upload, parse, actual metrics, comparison, and AI insight pipeline."
      generatedAt={view.generatedAt}
    >
      <MetricGrid>
        <MetricCard label="Result assets" value={formatCount(view.garminFeedback.resultAssets)} />
        <MetricCard label="Actual metrics" value={formatCount(view.garminFeedback.actualMetrics)} />
        <MetricCard label="Comparisons" value={formatCount(view.garminFeedback.comparisons)} />
        <MetricCard label="AI insights" value={formatCount(view.garminFeedback.aiInsights)} />
        <MetricCard label="Parsed assets" value={formatCount(view.garminFeedback.assetsParsed)} />
        <MetricCard
          label="Failed parses"
          value={formatCount(view.garminFeedback.assetsFailed)}
          tone="warning"
        />
      </MetricGrid>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PipelineStep label="Uploaded" value={view.garminFeedback.funnel.uploaded} />
        <PipelineStep label="Metrics ready" value={view.garminFeedback.funnel.metricsReady} />
        <PipelineStep label="Compared" value={view.garminFeedback.funnel.compared} />
        <PipelineStep label="AI ready" value={view.garminFeedback.funnel.aiReady} />
      </div>
    </AnalyticsPanel>
  );
}

function AiEntitlementsSection({ view }: { view: AdminAnalyticsView }) {
  return (
    <AnalyticsPanel
      eyebrow="AI & Entitlements"
      title="Entitlement rows and capability usage"
      description="Backend-shaped counts for tiers, statuses, metered capabilities, and AI insight rows."
      generatedAt={view.generatedAt}
    >
      <MetricGrid>
        <MetricCard
          label="Workout AI insights"
          value={formatCount(view.aiEntitlements.workoutAiInsights)}
        />
        <MetricCard
          label="Capability keys used"
          value={formatCount(view.aiEntitlements.capabilityUsage.length)}
        />
      </MetricGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <KeyCountList title="Entitlement tiers" items={view.aiEntitlements.entitlementRowsByTier} />
        <KeyCountList
          title="Entitlement statuses"
          items={view.aiEntitlements.entitlementRowsByStatus}
        />
        <CapabilityUsageList items={view.aiEntitlements.capabilityUsage} />
      </div>
    </AnalyticsPanel>
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

function AnalyticsPanel({
  eyebrow,
  title,
  description,
  generatedAt,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  generatedAt?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="hito-label">{eyebrow}</p>
          <h2 className="hito-modal-title mt-2">{title}</h2>
          <p className="hito-body mt-3 max-w-3xl text-muted-foreground">{description}</p>
        </div>
        {generatedAt ? (
          <div className="grid gap-1 text-left sm:text-right">
            <span className="hito-label">Generated</span>
            <span className="hito-technical-mono text-xs text-muted-foreground">
              {formatDateTime(generatedAt)}
            </span>
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="hito-workbench-summary-grid">{children}</div>;
}

function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <div className="hito-analytics-stat">
      <div className="hito-analytics-stat-head">
        <span className="hito-label text-muted-foreground">{label}</span>
        {tone !== "neutral" ? (
          <Icon
            name={tone === "success" ? "check-circle" : "warning"}
            size="xs"
            className="hito-analytics-stat-icon"
            data-tone={tone === "warning" ? "warn" : undefined}
          />
        ) : null}
      </div>
      <div className="hito-analytics-stat-body">
        <span className="hito-analytics-value">{value}</span>
        {helper ? <span className="hito-analytics-unit">{helper}</span> : null}
      </div>
    </div>
  );
}

function KeyCountList({ title, items }: { title: string; items: AdminAnalyticsKeyCount[] }) {
  return (
    <div className="hito-surface-flat p-4">
      <h3 className="hito-label text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="hito-field-helper mt-3">No rows yet.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <div key={item.key} className="hito-analytics-list-item hito-analytics-list-item-split">
              <span className="text-sm text-muted-foreground">{formatKey(item.key)}</span>
              <span className="hito-technical-mono text-sm text-foreground">
                {formatCount(item.count)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CapabilityUsageList({
  items,
}: {
  items: Array<AdminAnalyticsKeyCount & { usersWithUsage: number }>;
}) {
  return (
    <div className="hito-surface-flat p-4">
      <h3 className="hito-label text-foreground">Capability usage</h3>
      {items.length === 0 ? (
        <p className="hito-field-helper mt-3">No metered capability usage yet.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <div key={item.key} className="hito-analytics-list-item">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{formatKey(item.key)}</span>
                <span className="hito-technical-mono text-sm text-foreground">
                  {formatCount(item.count)}
                </span>
              </div>
              <p className="hito-field-helper mt-1">
                {formatCount(item.usersWithUsage)} users with usage
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="hito-analytics-list-item hito-analytics-list-item-spacious">
      <span className="hito-label text-muted-foreground">{label}</span>
      <div className="hito-analytics-value mt-3 text-2xl">{formatCount(value)}</div>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="hito-surface-flat p-6" data-tone="signal">
      <div className="flex items-start gap-3">
        <Icon name="user" size="md" className="mt-0.5 text-muted-foreground" />
        <div>
          <h3 className="hito-body font-medium text-foreground">{title}</h3>
          <p className="hito-field-helper mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

function BooleanPill({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span className="hito-status-pill" data-tone={value ? "success" : "warning"}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function CompactCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="hito-technical-mono text-foreground">{formatCount(value)}</span>
    </div>
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

function linkedIdentityLabel(status: AdminLocalTestAccountLinkStatus) {
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

function linkedIdentityTone(status: AdminLocalTestAccountLinkStatus) {
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

function buildUsersActiveFilters(
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

function matchesUsersFilters(row: AdminAnalyticsUserRow, filters: UsersFilters) {
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

function compareUsersRows(
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

function buildTestAccountRows(
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

function buildTestAccountActiveFilters(
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

function matchesTestAccountFilters(row: TestAccountOpsRow, filters: TestAccountsFilters) {
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

function compareTestAccountRows(
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

function classificationLabel(classification: AdminUserClassification) {
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

function classificationTone(classification: AdminUserClassification) {
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

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatNullableCount(value: number | null) {
  return value === null ? "Unavailable" : formatCount(value);
}

function formatNullablePercent(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return `${Math.round(value * 100)}%`;
}

function formatKey(value: string) {
  return value.replaceAll("_", " ");
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "No logs";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function entitlementTone(tier: string) {
  const normalizedTier = tier.toLowerCase();

  if (normalizedTier === "pro") {
    return "signal";
  }

  if (normalizedTier === "basic") {
    return "success";
  }

  return "neutral";
}
