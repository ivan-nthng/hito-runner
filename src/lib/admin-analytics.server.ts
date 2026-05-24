import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  AdminAnalyticsExcludedUserRow,
  AdminAnalyticsFailureReason,
  AdminAnalyticsKeyCount,
  AdminAnalyticsResult,
  AdminAnalyticsUserRow,
  AdminAnalyticsView,
} from "@/lib/admin-analytics";
import {
  classifyAdminAnalyticsUser,
  type AdminUserClassificationInfo,
} from "@/lib/admin-user-classification";
import type { RequestAuthContext } from "@/lib/backend/auth";
import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseServerEnv, isLoopbackRuntimeUrl, serverEnv } from "@/lib/supabase/env";

const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";
const PAGE_SIZE = 1000;
const RECENT_LOG_WINDOW_DAYS = 30;

const localAuthAccountSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  email: z.string().trim().email().optional(),
  userId: z.string().uuid().optional(),
  role: z.enum(["admin", "tester"]).optional(),
  displayName: z.string().trim().min(1).optional(),
});

const localAuthAccountsFileSchema = z.union([
  z.array(localAuthAccountSchema),
  z.object({
    accounts: z.array(localAuthAccountSchema),
  }),
]);

type PlanCycleRow = Pick<
  Database["public"]["Tables"]["plan_cycles"]["Row"],
  "id" | "user_id" | "status" | "source_kind" | "schema_version"
>;
type PlannedWorkoutRow = Pick<
  Database["public"]["Tables"]["planned_workouts"]["Row"],
  "id" | "user_id" | "workout_type"
>;
type WorkoutLogRow = Pick<
  Database["public"]["Tables"]["workout_logs"]["Row"],
  "user_id" | "outcome" | "logged_at"
>;
type ResultAssetRow = Pick<
  Database["public"]["Tables"]["workout_result_assets"]["Row"],
  "user_id" | "parse_status"
>;
type ActualMetricsRow = Pick<
  Database["public"]["Tables"]["workout_actual_metrics"]["Row"],
  "user_id"
>;
type ComparisonRow = Pick<Database["public"]["Tables"]["workout_comparisons"]["Row"], "user_id">;
type AiInsightRow = Pick<Database["public"]["Tables"]["workout_ai_insights"]["Row"], "user_id">;
type EntitlementRow = Pick<
  Database["public"]["Tables"]["runner_entitlements"]["Row"],
  "user_id" | "tier" | "status"
>;
type CapabilityUsageRow = Pick<
  Database["public"]["Tables"]["runner_capability_usage"]["Row"],
  "user_id" | "capability_key" | "used_count"
>;

interface AuthUserSummary {
  id: string;
  email: string | null;
  appMetadata: Record<string, unknown>;
}

interface LocalAccountSummary {
  username: string;
  email: string;
  userId: string;
  role: "admin" | "tester";
  displayName: string;
}

interface ClassifiedUser {
  userId: string;
  authUser: AuthUserSummary | null;
  localAccount: LocalAccountSummary | null;
  classification: AdminUserClassificationInfo;
}

interface AdminAnalyticsDependencies {
  auth: RequestAuthContext;
  runtimeUrl: string | URL | null;
  localAuthBypassEnabled: boolean;
  accountsFilePath: string;
  supabase: SupabaseClient<Database> | null;
  now?: Date;
}

export async function getAdminAnalyticsForCurrentRequest(): Promise<AdminAnalyticsResult> {
  return getAdminAnalyticsForDependencies(await buildCurrentDependencies());
}

export async function getAdminAnalyticsForDependencies(
  dependencies: AdminAnalyticsDependencies,
): Promise<AdminAnalyticsResult> {
  if (!dependencies.supabase) {
    return failure(
      "supabase_admin_unavailable",
      "Supabase admin access is required before admin analytics can load.",
    );
  }

  try {
    const authUsers = await listAuthUsersSafe(dependencies.supabase);
    const adminAccess = await requireAdminAccess(dependencies, authUsers.users);

    if (!adminAccess.ok) {
      return adminAccess;
    }

    const view = await buildAdminAnalyticsView(dependencies, authUsers);

    return {
      ok: true,
      view,
    };
  } catch {
    return failure(
      "analytics_load_failed",
      "Admin analytics could not be loaded from existing backend truth.",
    );
  }
}

async function buildCurrentDependencies(): Promise<AdminAnalyticsDependencies> {
  const { getRequestAuthContext } = await import("@/lib/backend/auth");
  const auth = getRequestAuthContext();

  return {
    auth,
    runtimeUrl: auth.appBaseUrl,
    localAuthBypassEnabled: Boolean(
      serverEnv.localAuthBypassEnabled && serverEnv.localAuthBypassAccountsFile,
    ),
    accountsFilePath: path.resolve(
      process.cwd(),
      serverEnv.localAuthBypassAccountsFile ?? DEFAULT_ACCOUNTS_FILE,
    ),
    supabase: hasSupabaseServerEnv ? createAdminSupabaseClient() : null,
  };
}

async function buildAdminAnalyticsView(
  dependencies: AdminAnalyticsDependencies,
  authUsers: { status: AdminAnalyticsView["authUsers"]["status"]; users: AuthUserSummary[] },
): Promise<AdminAnalyticsView> {
  const supabase = dependencies.supabase!;
  const [
    profiles,
    planCycles,
    plannedWorkouts,
    workoutLogs,
    resultAssets,
    actualMetrics,
    comparisons,
    aiInsights,
    entitlements,
    capabilityUsage,
  ] = await Promise.all([
    selectAllRows(supabase, "runner_profiles", "user_id"),
    selectAllRows(supabase, "plan_cycles", "id, user_id, status, source_kind, schema_version"),
    selectAllRows(supabase, "planned_workouts", "id, user_id, workout_type"),
    selectAllRows(supabase, "workout_logs", "user_id, outcome, logged_at"),
    selectAllRows(supabase, "workout_result_assets", "user_id, parse_status"),
    selectAllRows(supabase, "workout_actual_metrics", "user_id"),
    selectAllRows(supabase, "workout_comparisons", "user_id"),
    selectAllRows(supabase, "workout_ai_insights", "user_id"),
    selectAllRows(supabase, "runner_entitlements", "user_id, tier, status"),
    selectAllRows(supabase, "runner_capability_usage", "user_id, capability_key, used_count"),
  ]);

  const localAccounts = await loadLocalAccounts(dependencies.accountsFilePath);
  const knownUserIds = buildKnownUserIds({
    authUsers: authUsers.users,
    profiles,
    planCycles: planCycles as PlanCycleRow[],
    plannedWorkouts: plannedWorkouts as PlannedWorkoutRow[],
    workoutLogs: workoutLogs as WorkoutLogRow[],
    resultAssets: resultAssets as ResultAssetRow[],
    aiInsights: aiInsights as AiInsightRow[],
    entitlements: entitlements as EntitlementRow[],
    capabilityUsage: capabilityUsage as CapabilityUsageRow[],
  });

  const classifiedUsers = buildClassifiedUsers({
    knownUserIds,
    authUsers: authUsers.users,
    localAccounts,
  });
  const realUserIds = new Set(
    classifiedUsers
      .filter((user) => user.classification.classification === "real")
      .map((user) => user.userId),
  );
  const realAuthUsers = authUsers.users.filter((user) => realUserIds.has(user.id));
  const realProfiles = profiles.filter((profile) => realUserIds.has(profile.user_id));
  const realPlanCycles = (planCycles as PlanCycleRow[]).filter((plan) =>
    realUserIds.has(plan.user_id),
  );
  const realPlannedWorkouts = (plannedWorkouts as PlannedWorkoutRow[]).filter((workout) =>
    realUserIds.has(workout.user_id),
  );
  const realWorkoutLogs = (workoutLogs as WorkoutLogRow[]).filter((log) =>
    realUserIds.has(log.user_id),
  );
  const realResultAssets = (resultAssets as ResultAssetRow[]).filter((asset) =>
    realUserIds.has(asset.user_id),
  );
  const realActualMetrics = (actualMetrics as ActualMetricsRow[]).filter((metrics) =>
    realUserIds.has(metrics.user_id),
  );
  const realComparisons = (comparisons as ComparisonRow[]).filter((comparison) =>
    realUserIds.has(comparison.user_id),
  );
  const realAiInsights = (aiInsights as AiInsightRow[]).filter((insight) =>
    realUserIds.has(insight.user_id),
  );
  const realEntitlements = (entitlements as EntitlementRow[]).filter((row) =>
    realUserIds.has(row.user_id),
  );
  const realCapabilityUsage = (capabilityUsage as CapabilityUsageRow[]).filter((row) =>
    realUserIds.has(row.user_id),
  );
  const profileUserIds = new Set(realProfiles.map((profile) => profile.user_id));
  const activePlanUserIds = new Set(
    realPlanCycles.filter((plan) => plan.status === "active").map((plan) => plan.user_id),
  );
  const activePlans = realPlanCycles.filter((plan) => plan.status === "active");
  const archivedPlans = realPlanCycles.filter((plan) => plan.status === "archived");
  const workoutLogsByOutcome = countBy(realWorkoutLogs.map((log) => log.outcome));
  const completedLogs = workoutLogsByOutcome.find((entry) => entry.key === "completed")?.count ?? 0;
  const plannedNonRestWorkouts = realPlannedWorkouts.filter(
    (workout) => workout.workout_type !== "rest",
  ).length;
  const usersWithAnyLogs = new Set(realWorkoutLogs.map((log) => log.user_id));
  const recentCutoff = getRecentCutoff(dependencies.now ?? new Date());
  const usersWithRecentLogs = new Set(
    realWorkoutLogs
      .filter((log) => new Date(log.logged_at).getTime() >= recentCutoff.getTime())
      .map((log) => log.user_id),
  );
  const assetsParsed = realResultAssets.filter((asset) => asset.parse_status === "parsed").length;
  const assetsFailed = realResultAssets.filter((asset) => asset.parse_status === "failed").length;
  const excludedUserRows = buildExcludedUserRows({
    users: classifiedUsers.filter((user) => user.classification.classification !== "real"),
    profileUserIds: new Set(profiles.map((profile) => profile.user_id)),
    activePlans: (planCycles as PlanCycleRow[]).filter((plan) => plan.status === "active"),
    archivedPlans: (planCycles as PlanCycleRow[]).filter((plan) => plan.status === "archived"),
    plannedWorkouts: plannedWorkouts as PlannedWorkoutRow[],
    workoutLogs: workoutLogs as WorkoutLogRow[],
    resultAssets: resultAssets as ResultAssetRow[],
    aiInsights: aiInsights as AiInsightRow[],
    entitlements: entitlements as EntitlementRow[],
  });

  return {
    generatedAt: (dependencies.now ?? new Date()).toISOString(),
    authUsers: {
      status: authUsers.status,
      total: authUsers.status === "available" ? realAuthUsers.length : null,
    },
    accountsActivation: {
      totalAuthUsers: authUsers.status === "available" ? realAuthUsers.length : null,
      runnerProfiles: realProfiles.length,
      usersWithProfile: profileUserIds.size,
      usersWithoutProfile:
        authUsers.status === "available"
          ? Math.max(realAuthUsers.length - profileUserIds.size, 0)
          : null,
      usersWithActivePlan: activePlanUserIds.size,
      usersWithoutActivePlan:
        authUsers.status === "available"
          ? Math.max(realAuthUsers.length - activePlanUserIds.size, 0)
          : Math.max(profileUserIds.size - activePlanUserIds.size, 0),
      setupToActivePlanRate: ratio(activePlanUserIds.size, profileUserIds.size),
    },
    plans: {
      total: realPlanCycles.length,
      active: activePlans.length,
      archived: archivedPlans.length,
      sourceKindCounts: countBy(realPlanCycles.map((plan) => plan.source_kind ?? "unknown")),
      schemaVersionCounts: countBy(realPlanCycles.map((plan) => plan.schema_version || "unknown")),
    },
    workoutUsage: {
      totalPlannedWorkouts: realPlannedWorkouts.length,
      plannedNonRestWorkouts,
      totalWorkoutLogs: realWorkoutLogs.length,
      outcomeCounts: workoutLogsByOutcome,
      roughCompletionRate: ratio(completedLogs, plannedNonRestWorkouts),
      activePlanUsersWithoutLogs: countMissing(activePlanUserIds, usersWithAnyLogs),
      activePlanUsersWithoutRecentLogs30d: countMissing(activePlanUserIds, usersWithRecentLogs),
    },
    garminFeedback: {
      resultAssets: realResultAssets.length,
      assetsParsed,
      assetsFailed,
      actualMetrics: realActualMetrics.length,
      comparisons: realComparisons.length,
      aiInsights: realAiInsights.length,
      funnel: {
        uploaded: realResultAssets.length,
        metricsReady: realActualMetrics.length,
        compared: realComparisons.length,
        aiReady: realAiInsights.length,
      },
    },
    aiEntitlements: {
      entitlementRowsByTier: countBy(realEntitlements.map((row) => row.tier)),
      entitlementRowsByStatus: countBy(realEntitlements.map((row) => row.status)),
      capabilityUsage: buildCapabilityUsageCounts(realCapabilityUsage),
      workoutAiInsights: realAiInsights.length,
    },
    excludedUsers: {
      total: excludedUserRows.length,
      classificationCounts: countBy(excludedUserRows.map((row) => row.classification)),
      rows: excludedUserRows,
    },
    perUserRows: buildPerUserRows({
      users: classifiedUsers.filter((user) => user.classification.classification === "real"),
      authUsers: authUsers.users,
      profileUserIds,
      activePlans,
      archivedPlans,
      plannedWorkouts: realPlannedWorkouts,
      workoutLogs: realWorkoutLogs,
      resultAssets: realResultAssets,
      aiInsights: realAiInsights,
      entitlements: realEntitlements,
    }),
  };
}

async function requireAdminAccess(
  dependencies: AdminAnalyticsDependencies,
  authUsers: AuthUserSummary[],
): Promise<{ ok: true } | Extract<AdminAnalyticsResult, { ok: false }>> {
  if (!dependencies.auth.userId) {
    return failure("authentication_required", "Sign in as an admin to view analytics.");
  }

  if (dependencies.auth.provider === "local") {
    return requireLocalAdminAccess(dependencies);
  }

  const authUser = authUsers.find((user) => user.id === dependencies.auth.userId) ?? null;

  if (!authUser) {
    return failure("admin_unavailable", "Admin access could not be verified for this session.");
  }

  if (isSupabaseAdminUser(authUser)) {
    return { ok: true };
  }

  return failure("admin_required", "Admin analytics are available only to admin sessions.");
}

async function requireLocalAdminAccess(
  dependencies: AdminAnalyticsDependencies,
): Promise<{ ok: true } | Extract<AdminAnalyticsResult, { ok: false }>> {
  if (
    !dependencies.localAuthBypassEnabled ||
    !dependencies.runtimeUrl ||
    !isLoopbackRuntimeUrl(dependencies.runtimeUrl)
  ) {
    return failure("admin_unavailable", "Local admin analytics are unavailable in this runtime.");
  }

  const accounts = await loadLocalAccounts(dependencies.accountsFilePath);
  const adminAccount =
    accounts.find((account) => account.userId === dependencies.auth.userId) ??
    accounts.find((account) => account.email === dependencies.auth.email);

  if (!adminAccount || adminAccount.role !== "admin") {
    return failure("admin_required", "Admin analytics are available only to local admin sessions.");
  }

  return { ok: true };
}

async function listAuthUsersSafe(supabase: SupabaseClient<Database>) {
  try {
    return {
      status: "available" as const,
      users: await listAuthUsers(supabase),
    };
  } catch {
    return {
      status: "lookup_failed" as const,
      users: [],
    };
  }
}

async function listAuthUsers(supabase: SupabaseClient<Database>): Promise<AuthUserSummary[]> {
  const users: AuthUserSummary[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw new Error(error.message);
    }

    users.push(
      ...data.users.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        appMetadata: toRecord(user.app_metadata),
      })),
    );

    if (data.users.length < PAGE_SIZE) {
      return users;
    }

    page += 1;
  }
}

async function selectAllRows<TTable extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: TTable,
  columns: string,
): Promise<Array<Database["public"]["Tables"][TTable]["Row"]>> {
  const rows: Array<Database["public"]["Tables"][TTable]["Row"]> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...((data ?? []) as Array<Database["public"]["Tables"][TTable]["Row"]>));

    if (!data || data.length < PAGE_SIZE) {
      return rows;
    }

    from += PAGE_SIZE;
  }
}

function buildKnownUserIds({
  authUsers,
  profiles,
  planCycles,
  plannedWorkouts,
  workoutLogs,
  resultAssets,
  aiInsights,
  entitlements,
  capabilityUsage,
}: {
  authUsers: AuthUserSummary[];
  profiles: Array<{ user_id: string }>;
  planCycles: PlanCycleRow[];
  plannedWorkouts: PlannedWorkoutRow[];
  workoutLogs: WorkoutLogRow[];
  resultAssets: ResultAssetRow[];
  aiInsights: AiInsightRow[];
  entitlements: EntitlementRow[];
  capabilityUsage: CapabilityUsageRow[];
}) {
  return Array.from(
    new Set([
      ...authUsers.map((user) => user.id),
      ...profiles.map((profile) => profile.user_id),
      ...planCycles.map((plan) => plan.user_id),
      ...plannedWorkouts.map((workout) => workout.user_id),
      ...workoutLogs.map((log) => log.user_id),
      ...resultAssets.map((asset) => asset.user_id),
      ...aiInsights.map((insight) => insight.user_id),
      ...entitlements.map((entitlement) => entitlement.user_id),
      ...capabilityUsage.map((usage) => usage.user_id),
    ]),
  ).sort();
}

function buildClassifiedUsers({
  knownUserIds,
  authUsers,
  localAccounts,
}: {
  knownUserIds: string[];
  authUsers: AuthUserSummary[];
  localAccounts: LocalAccountSummary[];
}): ClassifiedUser[] {
  const authByUserId = new Map(authUsers.map((user) => [user.id, user]));
  const authByEmail = new Map(
    authUsers.flatMap((user) => (user.email ? [[normalizeEmail(user.email), user]] : [])),
  );
  const localByUserId = new Map(localAccounts.map((account) => [account.userId, account]));
  const localByEmail = new Map(localAccounts.map((account) => [account.email, account]));
  const userIds = new Set(knownUserIds);

  for (const account of localAccounts) {
    userIds.add(authByEmail.get(account.email)?.id ?? account.userId);
  }

  return Array.from(userIds)
    .sort()
    .map((userId) => {
      const authUser = authByUserId.get(userId) ?? null;
      const localAccount =
        localByUserId.get(userId) ??
        (authUser?.email ? localByEmail.get(authUser.email) : null) ??
        null;
      const classification = classifyAdminAnalyticsUser({
        email: authUser?.email ?? localAccount?.email ?? null,
        appMetadata: authUser?.appMetadata,
        localAccountRole: localAccount?.role ?? null,
      });

      return {
        userId,
        authUser,
        localAccount,
        classification,
      };
    });
}

function buildPerUserRows({
  users,
  authUsers,
  profileUserIds,
  activePlans,
  archivedPlans,
  plannedWorkouts,
  workoutLogs,
  resultAssets,
  aiInsights,
  entitlements,
}: {
  users: ClassifiedUser[];
  authUsers: AuthUserSummary[];
  profileUserIds: Set<string>;
  activePlans: PlanCycleRow[];
  archivedPlans: PlanCycleRow[];
  plannedWorkouts: PlannedWorkoutRow[];
  workoutLogs: WorkoutLogRow[];
  resultAssets: ResultAssetRow[];
  aiInsights: AiInsightRow[];
  entitlements: EntitlementRow[];
}): AdminAnalyticsUserRow[] {
  const authByUserId = new Map(authUsers.map((user) => [user.id, user]));
  const entitlementByUserId = new Map(entitlements.map((row) => [row.user_id, row]));

  return users.map((user) => {
    const userId = user.userId;
    const userLogs = workoutLogs.filter((log) => log.user_id === userId);
    const entitlement = entitlementByUserId.get(userId) ?? null;

    return {
      userId,
      email: authByUserId.get(userId)?.email ?? null,
      profilePresent: profileUserIds.has(userId),
      activePlanPresent: activePlans.some((plan) => plan.user_id === userId),
      activePlanCount: activePlans.filter((plan) => plan.user_id === userId).length,
      archivedPlanCount: archivedPlans.filter((plan) => plan.user_id === userId).length,
      plannedWorkoutCount: plannedWorkouts.filter((workout) => workout.user_id === userId).length,
      workoutLogCount: userLogs.length,
      lastWorkoutLogDate: latestDate(userLogs.map((log) => log.logged_at)),
      garminEvidenceCount: resultAssets.filter((asset) => asset.user_id === userId).length,
      aiInsightCount: aiInsights.filter((insight) => insight.user_id === userId).length,
      entitlement: entitlement
        ? {
            tier: entitlement.tier,
            status: entitlement.status,
            source: "explicit",
          }
        : {
            tier: "pro",
            status: "effective",
            source: "missing_row_effective_pro",
          },
      classification: "real",
      classificationReason: user.classification.classificationReason,
      classificationSource: user.classification.classificationSource,
    };
  });
}

function buildExcludedUserRows({
  users,
  profileUserIds,
  activePlans,
  archivedPlans,
  plannedWorkouts,
  workoutLogs,
  resultAssets,
  aiInsights,
  entitlements,
}: {
  users: ClassifiedUser[];
  profileUserIds: Set<string>;
  activePlans: PlanCycleRow[];
  archivedPlans: PlanCycleRow[];
  plannedWorkouts: PlannedWorkoutRow[];
  workoutLogs: WorkoutLogRow[];
  resultAssets: ResultAssetRow[];
  aiInsights: AiInsightRow[];
  entitlements: EntitlementRow[];
}): AdminAnalyticsExcludedUserRow[] {
  const entitlementByUserId = new Map(entitlements.map((row) => [row.user_id, row]));

  return users.map((user) => {
    const userId = user.userId;
    const userLogs = workoutLogs.filter((log) => log.user_id === userId);
    const entitlement = entitlementByUserId.get(userId) ?? null;

    return {
      userId,
      email: user.authUser?.email ?? user.localAccount?.email ?? null,
      profilePresent: profileUserIds.has(userId),
      activePlanPresent: activePlans.some((plan) => plan.user_id === userId),
      activePlanCount: activePlans.filter((plan) => plan.user_id === userId).length,
      archivedPlanCount: archivedPlans.filter((plan) => plan.user_id === userId).length,
      plannedWorkoutCount: plannedWorkouts.filter((workout) => workout.user_id === userId).length,
      workoutLogCount: userLogs.length,
      lastWorkoutLogDate: latestDate(userLogs.map((log) => log.logged_at)),
      garminEvidenceCount: resultAssets.filter((asset) => asset.user_id === userId).length,
      aiInsightCount: aiInsights.filter((insight) => insight.user_id === userId).length,
      entitlement: entitlement
        ? {
            tier: entitlement.tier,
            status: entitlement.status,
            source: "explicit",
          }
        : {
            tier: "pro",
            status: "effective",
            source: "missing_row_effective_pro",
          },
      classification: user.classification
        .classification as AdminAnalyticsExcludedUserRow["classification"],
      classificationReason: user.classification.classificationReason,
      classificationSource: user.classification.classificationSource,
      localAccount: user.localAccount
        ? {
            username: user.localAccount.username,
            email: user.localAccount.email,
            role: user.localAccount.role,
            displayName: user.localAccount.displayName,
            userId: user.localAccount.userId,
            protectedFromDeletion: user.localAccount.role === "admin",
            deletable: user.localAccount.role !== "admin",
            linkedSupabaseUserId: user.authUser?.id ?? null,
          }
        : null,
    };
  });
}

function buildCapabilityUsageCounts(rows: CapabilityUsageRow[]) {
  const usageByCapability = new Map<string, { total: number; users: Set<string> }>();

  for (const row of rows) {
    const current = usageByCapability.get(row.capability_key) ?? {
      total: 0,
      users: new Set<string>(),
    };
    current.total += row.used_count;
    current.users.add(row.user_id);
    usageByCapability.set(row.capability_key, current);
  }

  return Array.from(usageByCapability.entries())
    .map(([capabilityKey, usage]) => ({
      key: capabilityKey,
      count: usage.total,
      usersWithUsage: usage.users.size,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

async function loadLocalAccounts(accountsFilePath: string): Promise<LocalAccountSummary[]> {
  try {
    const raw = await readFile(accountsFilePath, "utf8");
    const parsed = localAuthAccountsFileSchema.parse(JSON.parse(raw));
    const rawAccounts = Array.isArray(parsed) ? parsed : parsed.accounts;

    return rawAccounts.map((account) => {
      const username = account.username.trim().toLowerCase();
      const email = (account.email ?? `${username}@local.test`).trim().toLowerCase();
      const role = account.role ?? (username === "ivan" ? "admin" : "tester");

      return {
        username,
        email,
        userId: account.userId ?? deriveUserId(username),
        role,
        displayName: account.displayName?.trim() || humanizeUsername(username),
      };
    });
  } catch {
    return [];
  }
}

function deriveUserId(username: string) {
  const hash = createHash("sha256").update(username).digest("hex");

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function humanizeUsername(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function isSupabaseAdminUser(user: AuthUserSummary) {
  return (
    user.appMetadata.hito_admin === true ||
    user.appMetadata.hito_role === "admin" ||
    user.appMetadata.hito_local_role === "admin"
  );
}

function countBy(values: string[]): AdminAnalyticsKeyCount[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

function countMissing(source: Set<string>, present: Set<string>) {
  let missing = 0;

  for (const value of source) {
    if (!present.has(value)) {
      missing += 1;
    }
  }

  return missing;
}

function latestDate(values: string[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((latest, value) => (value > latest ? value : latest), values[0]);
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return null;
  }

  return Number((numerator / denominator).toFixed(4));
}

function getRecentCutoff(now: Date) {
  return new Date(now.getTime() - RECENT_LOG_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function failure<TReason extends AdminAnalyticsFailureReason>(
  reason: TReason,
  message: string,
): Extract<AdminAnalyticsResult, { ok: false }> {
  return {
    ok: false,
    reason,
    message,
  };
}
