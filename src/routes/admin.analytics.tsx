import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import {
  getAdminAnalytics,
  type AdminAnalyticsKeyCount,
  type AdminAnalyticsResult,
  type AdminAnalyticsUserRow,
  type AdminAnalyticsView,
} from "@/lib/admin-analytics";
import {
  deleteAdminLocalTestAccount,
  getAdminLocalTestAccounts,
  type AdminLocalTestAccountLinkStatus,
  type AdminLocalTestAccountsResult,
  type AdminLocalTestAccountView,
} from "@/lib/admin-local-test-accounts";
import { APP_NAME } from "@/lib/app-config";

export const Route = createFileRoute("/admin/analytics")({
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

type AdminTab = "overview" | "funnel" | "feedback" | "ai" | "users" | "test-accounts";

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
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="hito-route-stack mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        <header className="hito-page-header">
          <p className="hito-label">Hito admin</p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="hito-page-title">Admin analytics</h1>
              <p className="hito-page-copy">
                Internal operations summary from existing Hito truth. This surface avoids raw
                sensitive payloads, production secrets, and broad user management.
              </p>
            </div>
            <Link to="/" className="hito-button hito-button-secondary hito-button-md self-start">
              Back to Hito
            </Link>
          </div>
        </header>

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "test-accounts" ? (
          <TestAccountsCard result={testAccountsResult} />
        ) : (
          <AnalyticsContent activeTab={activeTab} result={analyticsResult} />
        )}
      </div>
    </main>
  );
}

async function loadAdminAnalyticsRouteData() {
  const [analyticsResult, testAccountsResult] = await Promise.all([
    getAdminAnalytics(),
    getAdminLocalTestAccounts(),
  ]);

  return { analyticsResult, testAccountsResult };
}

function AdminTabs({
  activeTab,
  onChange,
}: {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
}) {
  const tabs: Array<{ key: AdminTab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "funnel", label: "Funnel & Usage" },
    { key: "feedback", label: "Feedback" },
    { key: "ai", label: "AI & Entitlements" },
    { key: "users", label: "Users" },
    { key: "test-accounts", label: "Test accounts" },
  ];

  return (
    <div
      className="hito-tabs hito-tabs-simple overflow-x-auto"
      role="tablist"
      aria-label="Admin analytics sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          className="hito-tab whitespace-nowrap"
          data-active={activeTab === tab.key}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
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
            <Link to="/login" className="hito-button hito-button-primary hito-button-md">
              Sign in
            </Link>
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
  return (
    <AnalyticsPanel
      eyebrow="Users"
      title="Per-user activity summary"
      description="One row per known user from backend-shaped admin truth. No raw sensitive payloads are rendered."
    >
      {rows.length === 0 ? (
        <EmptyPanel
          title="No users found."
          description="The backend returned no known auth/profile/activity rows."
        />
      ) : (
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[1120px] border-separate border-spacing-y-2 text-left">
            <caption className="sr-only">Admin per-user activity summary.</caption>
            <thead>
              <tr className="hito-label text-muted-foreground">
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Profile</th>
                <th className="px-4 py-2 font-medium">Active plan</th>
                <th className="px-4 py-2 font-medium">Plans</th>
                <th className="px-4 py-2 font-medium">Workouts</th>
                <th className="px-4 py-2 font-medium">Last log</th>
                <th className="px-4 py-2 font-medium">Feedback</th>
                <th className="px-4 py-2 font-medium">Entitlement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="align-top">
                  <td className="rounded-l-2xl bg-foreground/[0.035] px-4 py-4">
                    <div className="grid gap-1">
                      <span className="font-medium text-foreground">{row.email ?? "No email"}</span>
                      <code className="max-w-[18rem] overflow-hidden text-ellipsis text-xs text-muted-foreground">
                        {row.userId}
                      </code>
                    </div>
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <BooleanPill
                      value={row.profilePresent}
                      trueLabel="Profile"
                      falseLabel="Missing"
                    />
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <BooleanPill
                      value={row.activePlanPresent}
                      trueLabel="Active"
                      falseLabel="No active plan"
                    />
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <CompactCount label="active" value={row.activePlanCount} />
                    <CompactCount label="archived" value={row.archivedPlanCount} />
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <CompactCount label="planned" value={row.plannedWorkoutCount} />
                    <CompactCount label="logs" value={row.workoutLogCount} />
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <span className="text-sm text-foreground">
                      {formatShortDate(row.lastWorkoutLogDate)}
                    </span>
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <CompactCount label="Garmin" value={row.garminEvidenceCount} />
                    <CompactCount label="AI" value={row.aiInsightCount} />
                  </td>
                  <td className="rounded-r-2xl bg-foreground/[0.035] px-4 py-4">
                    <div className="grid gap-2">
                      <span
                        className="hito-status-pill"
                        data-tone={entitlementTone(row.entitlement.tier)}
                      >
                        {row.entitlement.tier}
                      </span>
                      <span className="hito-field-helper">
                        {row.entitlement.status} · {formatKey(row.entitlement.source)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalyticsPanel>
  );
}

function TestAccountsCard({ result }: { result: AdminLocalTestAccountsResult }) {
  return (
    <section className="hito-surface-flat p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="hito-label">Test accounts</p>
          <h2 className="hito-modal-title mt-2">Local bypass testers</h2>
          <p className="hito-body mt-3 max-w-3xl text-muted-foreground">
            View local bypass account fixtures, including plaintext local test passwords from the
            local accounts file. Deletion is limited to tester rows and must be confirmed with the
            exact email address.
          </p>
        </div>
        <span className="hito-status-pill self-start" data-tone="warning">
          Local only
        </span>
      </div>

      <div className="pt-6">
        <TestAccountsSection result={result} />
      </div>
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
    <section className="hito-surface-flat grid gap-6 p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-start sm:justify-between">
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
  return <div className="hito-analytics-grid">{children}</div>;
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
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-2xl bg-foreground/[0.035] px-3 py-2"
            >
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
            <div key={item.key} className="rounded-2xl bg-foreground/[0.035] px-3 py-2">
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
    <div className="rounded-2xl bg-foreground/[0.035] px-4 py-3">
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

function TestAccountsSection({ result }: { result: AdminLocalTestAccountsResult }) {
  if (!result.ok) {
    return <UnavailableState result={result} />;
  }

  if (result.accounts.length === 0) {
    return (
      <div className="hito-surface-flat p-6" data-tone="signal">
        <div className="flex items-start gap-3">
          <Icon name="user" size="md" className="mt-0.5 text-muted-foreground" />
          <div>
            <h3 className="hito-body font-medium text-foreground">No local accounts configured.</h3>
            <p className="hito-field-helper mt-2">
              Create local testers with the existing tester script, then refresh this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <TestAccountsTable accounts={result.accounts} />;
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
            <Link to="/login" className="hito-button hito-button-primary hito-button-md">
              Sign in
            </Link>
            <Link to="/" className="hito-button hito-button-secondary hito-button-md">
              Back to Hito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestAccountsTable({ accounts }: { accounts: AdminLocalTestAccountView[] }) {
  const deleteAccountFn = useServerFn(deleteAdminLocalTestAccount);
  const router = useRouter();
  const [deleteState, setDeleteState] = useState<DeleteState>(initialDeleteState);

  const beginDelete = (account: AdminLocalTestAccountView) => {
    setDeleteState({
      targetEmail: account.email,
      confirmEmail: "",
      pendingEmail: null,
      error: null,
      success: null,
    });
  };

  const cancelDelete = () => {
    setDeleteState(initialDeleteState);
  };

  const submitDelete = async (account: AdminLocalTestAccountView) => {
    if (deleteState.confirmEmail.trim() !== account.email || !account.deletable) {
      return;
    }

    setDeleteState((current) => ({
      ...current,
      pendingEmail: account.email,
      error: null,
      success: null,
    }));

    try {
      const deleteResult = await deleteAccountFn({
        data: {
          email: account.email,
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

      <div className="overflow-x-auto pb-2">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left">
          <caption className="sr-only">
            Local bypass test accounts visible to the local admin runtime.
          </caption>
          <thead>
            <tr className="hito-label text-muted-foreground">
              <th className="px-4 py-2 font-medium">Account</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Password</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">User identity</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Delete</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const isConfirming = deleteState.targetEmail === account.email;
              const isPending = deleteState.pendingEmail === account.email;
              const confirmationMatches = deleteState.confirmEmail.trim() === account.email;

              return (
                <tr key={account.email} className="align-top">
                  <td className="rounded-l-2xl bg-foreground/[0.035] px-4 py-4">
                    <div className="grid gap-1">
                      <span className="font-medium text-foreground">{account.username}</span>
                      <span className="hito-field-helper">{account.displayName}</span>
                    </div>
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <code className="rounded-lg bg-background/60 px-2 py-1 text-xs text-foreground">
                      {account.email}
                    </code>
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <code className="rounded-lg bg-background/60 px-2 py-1 text-xs text-foreground">
                      {account.password}
                    </code>
                    <p className="hito-field-helper mt-2">Local bypass password only.</p>
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <span
                      className="hito-status-pill"
                      data-tone={account.role === "admin" ? "signal" : "neutral"}
                    >
                      {account.role}
                    </span>
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    <div className="grid gap-2">
                      <code className="max-w-[16rem] overflow-hidden text-ellipsis rounded-lg bg-background/60 px-2 py-1 text-xs text-foreground">
                        {account.userId}
                      </code>
                      <span className="hito-field-helper">{account.userIdSource} user id</span>
                      <LinkedIdentityStatus
                        status={account.linkedSupabaseUser.status}
                        userId={account.linkedSupabaseUser.userId}
                      />
                    </div>
                  </td>
                  <td className="bg-foreground/[0.035] px-4 py-4">
                    {account.protectedFromDeletion ? (
                      <span className="hito-status-pill" data-tone="warning">
                        Protected
                      </span>
                    ) : account.deletable ? (
                      <span className="hito-status-pill" data-tone="success">
                        Deletable tester
                      </span>
                    ) : (
                      <span className="hito-status-pill">Not deletable</span>
                    )}
                  </td>
                  <td className="rounded-r-2xl bg-foreground/[0.035] px-4 py-4">
                    {account.deletable ? (
                      <div className="grid max-w-[18rem] gap-2">
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
                                placeholder={account.email}
                                value={deleteState.confirmEmail}
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="hito-button hito-button-primary hito-button-sm"
                                data-tone="error"
                                disabled={!confirmationMatches || isPending}
                                onClick={() => void submitDelete(account)}
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
                            onClick={() => beginDelete(account)}
                          >
                            <Icon name="trash" size="xs" />
                            Delete
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="hito-field-helper max-w-[16rem]">
                        Protected admin accounts cannot be deleted from this local UI.
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
        <code className="max-w-[14rem] overflow-hidden text-ellipsis rounded-lg bg-background/60 px-2 py-1 text-xs text-foreground">
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
