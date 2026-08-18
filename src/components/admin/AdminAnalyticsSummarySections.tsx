import {
  AnalyticsGroup,
  AnalyticsPanel,
  CapabilityUsageList,
  KeyCountList,
  MetricState,
  NumericFact,
  NumericFacts,
} from "@/components/admin/AdminAnalyticsPanels";
import type { AdminAnalyticsView } from "@/lib/admin-analytics";

export function OverviewSection({ view }: { view: AdminAnalyticsView }) {
  const authUsersTotal = view.authUsers.status === "available" ? view.authUsers.total : null;

  return (
    <AnalyticsPanel
      description="Direct authentication, runner profile, and workout-log readback from the current snapshot."
      generatedAt={view.generatedAt}
    >
      <AnalyticsGroup
        title="Product snapshot"
        description="Lifetime counts from their named sources; this is not a trend or source-freshness report."
      >
        <NumericFacts>
          {authUsersTotal !== null ? (
            <NumericFact label="Auth users" value={authUsersTotal} helper="Supabase auth" />
          ) : (
            <MetricState
              label="Auth users"
              status={
                view.authUsers.status === "available"
                  ? "unavailable"
                  : view.authUsers.status.replaceAll("_", " ")
              }
              description="The authentication-user source did not return a numeric count for this snapshot."
            />
          )}
          <NumericFact label="Runner profiles" value={view.accountsActivation.runnerProfiles} />
          <NumericFact label="Workout logs" value={view.workoutUsage.totalWorkoutLogs} />
        </NumericFacts>
      </AnalyticsGroup>
    </AnalyticsPanel>
  );
}

export function ActivitySection({ view }: { view: AdminAnalyticsView }) {
  return (
    <AnalyticsPanel
      description="Profile coverage and lifetime workout-log facts from the current snapshot."
      generatedAt={view.generatedAt}
    >
      <AnalyticsGroup
        title="Profiles and workout logging"
        description="Runner setup and lifetime workout-log counts represented by their current source rows."
      >
        <NumericFacts>
          <NumericFact
            label="Profiles with setup"
            value={view.accountsActivation.usersWithProfile}
          />
          {view.accountsActivation.usersWithoutProfile === null ? (
            <MetricState
              label="Users without a profile"
              status="unavailable"
              description="A numeric authentication-to-profile difference was not available for this snapshot."
            />
          ) : (
            <NumericFact
              label="Users without a profile"
              value={view.accountsActivation.usersWithoutProfile}
            />
          )}
          <NumericFact label="Workout logs" value={view.workoutUsage.totalWorkoutLogs} />
        </NumericFacts>
      </AnalyticsGroup>

      <AnalyticsGroup
        title="Recorded workout outcomes"
        description="Backend-provided workout-log outcomes shown as recorded counts."
      >
        <KeyCountList
          title="Outcome rows"
          items={view.workoutUsage.outcomeCounts}
          emptyDescription="The workout-log outcome source returned no rows for this snapshot."
        />
      </AnalyticsGroup>
    </AnalyticsPanel>
  );
}

export function WorkoutEvidenceSection({ view }: { view: AdminAnalyticsView }) {
  return (
    <AnalyticsPanel
      description="Observed evidence-processing and enrichment counts from the current backend-shaped snapshot."
      generatedAt={view.generatedAt}
    >
      <AnalyticsGroup
        title="Evidence processing"
        description="Uploaded result assets and their current parse outcomes."
      >
        <NumericFacts>
          <NumericFact label="Uploaded" value={view.garminFeedback.funnel.uploaded} />
          <NumericFact label="Parsed" value={view.garminFeedback.assetsParsed} />
          <NumericFact label="Failed" value={view.garminFeedback.assetsFailed} tone="warning" />
        </NumericFacts>
      </AnalyticsGroup>

      <AnalyticsGroup
        title="Enrichment"
        description="Persisted evidence rows with metrics, comparisons, or AI insight readback available."
      >
        <NumericFacts>
          <NumericFact label="Metrics ready" value={view.garminFeedback.funnel.metricsReady} />
          <NumericFact label="Compared" value={view.garminFeedback.funnel.compared} />
          <NumericFact label="AI ready" value={view.garminFeedback.funnel.aiReady} />
        </NumericFacts>
      </AnalyticsGroup>
    </AnalyticsPanel>
  );
}

export function AiEntitlementsSection({ view }: { view: AdminAnalyticsView }) {
  return (
    <AnalyticsPanel
      description="Entitlement records and aggregate capability usage without billing or credit inference."
      generatedAt={view.generatedAt}
    >
      <AnalyticsGroup
        title="Entitlement records"
        description="Backend-provided tier and status rows. Effective fallback truth remains distinct in Users."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <KeyCountList
            title="Tiers"
            items={view.aiEntitlements.entitlementRowsByTier}
            emptyDescription="The entitlement source returned no tier rows for this snapshot."
          />
          <KeyCountList
            title="Statuses"
            items={view.aiEntitlements.entitlementRowsByStatus}
            emptyDescription="The entitlement source returned no status rows for this snapshot."
          />
        </div>
      </AnalyticsGroup>

      <AnalyticsGroup
        title="Recorded capability usage"
        description="Aggregate usage totals and users with usage; these are not costs, credits, or grants."
      >
        <CapabilityUsageList items={view.aiEntitlements.capabilityUsage} />
      </AnalyticsGroup>
    </AnalyticsPanel>
  );
}
