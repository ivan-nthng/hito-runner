import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import type {
  AdminUserClassification,
  AdminUserClassificationSource,
} from "@/lib/admin-user-classification";

export type AdminAnalyticsFailureReason =
  | "authentication_required"
  | "admin_required"
  | "admin_unavailable"
  | "supabase_admin_unavailable"
  | "analytics_load_failed";

export interface AdminAnalyticsKeyCount {
  key: string;
  count: number;
}

export interface AdminAnalyticsView {
  generatedAt: string;
  authUsers: {
    status: "available" | "unavailable" | "lookup_failed";
    total: number | null;
  };
  accountsActivation: {
    totalAuthUsers: number | null;
    runnerProfiles: number;
    usersWithProfile: number;
    usersWithoutProfile: number | null;
    usersWithActivePlan: number;
    usersWithoutActivePlan: number | null;
    setupToActivePlanRate: number | null;
  };
  plans: {
    total: number;
    active: number;
    archived: number;
    sourceKindCounts: AdminAnalyticsKeyCount[];
    schemaVersionCounts: AdminAnalyticsKeyCount[];
  };
  workoutUsage: {
    totalPlannedWorkouts: number;
    plannedNonRestWorkouts: number;
    totalWorkoutLogs: number;
    outcomeCounts: AdminAnalyticsKeyCount[];
    roughCompletionRate: number | null;
    activePlanUsersWithoutLogs: number;
    activePlanUsersWithoutRecentLogs30d: number;
  };
  garminFeedback: {
    resultAssets: number;
    assetsParsed: number;
    assetsFailed: number;
    actualMetrics: number;
    comparisons: number;
    aiInsights: number;
    funnel: {
      uploaded: number;
      metricsReady: number;
      compared: number;
      aiReady: number;
    };
  };
  aiEntitlements: {
    entitlementRowsByTier: AdminAnalyticsKeyCount[];
    entitlementRowsByStatus: AdminAnalyticsKeyCount[];
    capabilityUsage: Array<AdminAnalyticsKeyCount & { usersWithUsage: number }>;
    workoutAiInsights: number;
  };
  excludedUsers: {
    total: number;
    classificationCounts: AdminAnalyticsKeyCount[];
    rows: AdminAnalyticsExcludedUserRow[];
  };
  perUserRows: AdminAnalyticsUserRow[];
}

export interface AdminAnalyticsUserRow {
  userId: string;
  email: string | null;
  profilePresent: boolean;
  activePlanPresent: boolean;
  activePlanCount: number;
  archivedPlanCount: number;
  plannedWorkoutCount: number;
  workoutLogCount: number;
  lastWorkoutLogDate: string | null;
  garminEvidenceCount: number;
  aiInsightCount: number;
  entitlement: {
    tier: string;
    status: string;
    source: "explicit" | "missing_row_effective_pro";
  };
  classification: "real";
  classificationReason: string;
  classificationSource: AdminUserClassificationSource;
}

export interface AdminAnalyticsExcludedUserRow extends Omit<
  AdminAnalyticsUserRow,
  "classification"
> {
  classification: Exclude<AdminUserClassification, "real">;
  localAccount: {
    username: string;
    email: string;
    role: "admin" | "tester";
    displayName: string;
    userId: string;
    protectedFromDeletion: boolean;
    deletable: boolean;
    linkedSupabaseUserId: string | null;
  } | null;
}

export type AdminAnalyticsResult =
  | {
      ok: true;
      view: AdminAnalyticsView;
    }
  | {
      ok: false;
      reason: AdminAnalyticsFailureReason;
      message: string;
    };

export const getAdminAnalytics = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAnalyticsResult> => {
    return getAdminAnalyticsServer();
  },
);

const getAdminAnalyticsServer = createServerOnlyFn(async (): Promise<AdminAnalyticsResult> => {
  const { getAdminAnalyticsForCurrentRequest } = await import("@/lib/admin-analytics.server");

  return getAdminAnalyticsForCurrentRequest();
});
