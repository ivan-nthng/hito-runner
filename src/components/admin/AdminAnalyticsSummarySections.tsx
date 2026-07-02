import {
  AnalyticsPanel,
  CapabilityUsageList,
  KeyCountList,
  MetricCard,
  MetricGrid,
  PipelineStep,
} from "@/components/admin/AdminAnalyticsPanels";
import {
  formatCount,
  formatNullableCount,
  formatNullablePercent,
} from "@/components/admin/admin-analytics-format";
import type { AdminAnalyticsView } from "@/lib/admin-analytics";

export function OverviewSection({ view }: { view: AdminAnalyticsView }) {
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

export function FunnelUsageSection({ view }: { view: AdminAnalyticsView }) {
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

export function FeedbackSection({ view }: { view: AdminAnalyticsView }) {
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

export function AiEntitlementsSection({ view }: { view: AdminAnalyticsView }) {
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
