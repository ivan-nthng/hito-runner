import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { buildImportedPlanSeed } from "./lib/imported-plan-seed.mjs";

const PLAN_PATH = process.argv[2] ?? "/Users/ivan/Downloads/ivan_complete_half_marathon_plan.json";
const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServerKey = readEnv("SUPABASE_SECRET_KEY");

if (!supabaseUrl || !supabaseServerKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY for the plan import.");
}

const supabase = createClient(supabaseUrl, supabaseServerKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const plan = JSON.parse(await readFile(PLAN_PATH, "utf8"));
const importedSeed = buildImportedPlanSeed(plan);
const localAccount = await loadCanonicalLocalBypassAccount();
const supabaseUserId = await ensureLocalBypassSupabaseUser({
  email: localAccount.email,
  displayName: localAccount.displayName,
  role: localAccount.role,
  userId: localAccount.userId,
  username: localAccount.username,
});

const profileUpsert = await supabase
  .from("runner_profiles")
  .upsert({
    user_id: supabaseUserId,
    goal_type: importedSeed.profile.goalType,
    goal_label: importedSeed.profile.goalLabel,
    baseline_sessions_per_week: importedSeed.profile.baselineSessionsPerWeek,
    baseline_long_run_km: importedSeed.profile.baselineLongRunKm,
    baseline_notes: importedSeed.profile.baselineNotes ?? null,
    setup_state: "completed",
  })
  .select("user_id")
  .single();

if (profileUpsert.error) {
  throw new Error(profileUpsert.error.message);
}

const archived = await supabase
  .from("plan_cycles")
  .update({ status: "archived" })
  .eq("user_id", supabaseUserId)
  .eq("status", "active");

if (archived.error) {
  throw new Error(archived.error.message);
}

const planInsert = await supabase
  .from("plan_cycles")
  .insert({
    user_id: supabaseUserId,
    status: "active",
    title: importedSeed.title,
    goal_summary: importedSeed.goalSummary,
    source_template: importedSeed.sourceTemplate,
    schema_version: importedSeed.schemaVersion,
    source_kind: importedSeed.sourceKind,
    start_date: importedSeed.startDate,
    end_date: importedSeed.endDate,
    target_date: importedSeed.targetDate,
    goal_metadata: importedSeed.goalMetadata,
    plan_preferences: importedSeed.planPreferences,
  })
  .select("id, title, start_date, end_date")
  .single();

if (planInsert.error) {
  throw new Error(planInsert.error.message);
}

const workouts = importedSeed.workouts.map((workout) => ({
  plan_cycle_id: planInsert.data.id,
  user_id: supabaseUserId,
  workout_date: workout.workoutDate,
  weekday: workout.weekday,
  week_number: workout.weekNumber,
  phase: workout.phase,
  workout_type: workout.workoutType,
  source_workout_id: workout.sourceWorkoutId,
  source_workout_type: workout.sourceWorkoutType ?? null,
  workout_family: workout.workoutFamily ?? null,
  workout_identity: workout.workoutIdentity ?? null,
  calendar_icon_key: workout.calendarIconKey ?? null,
  goal_context: workout.goalContext ?? null,
  metric_mode: workout.metricMode ?? null,
  title: workout.title,
  notes: workout.notes,
  planned_rpe: workout.plannedRpe,
  estimated_fatigue: workout.estimatedFatigue,
  recovery_priority: workout.recoveryPriority,
  steps: workout.steps,
  display_order: workout.displayOrder,
}));

const workoutInsert = await supabase.from("planned_workouts").insert(workouts);

if (workoutInsert.error) {
  throw new Error(workoutInsert.error.message);
}

const verifyPlan = await supabase
  .from("planned_workouts")
  .select("id", { count: "exact", head: true })
  .eq("plan_cycle_id", planInsert.data.id);

if (verifyPlan.error) {
  throw new Error(verifyPlan.error.message);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      planPath: PLAN_PATH,
      localUserId: localAccount.userId,
      supabaseUserId,
      activePlanId: planInsert.data.id,
      workoutCount: verifyPlan.count ?? 0,
      title: planInsert.data.title,
      startDate: planInsert.data.start_date,
      endDate: planInsert.data.end_date,
    },
    null,
    2,
  ),
);

async function loadCanonicalLocalBypassAccount() {
  const accountsFilePath = readEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE") ?? DEFAULT_ACCOUNTS_FILE;
  const fileContents = await readFile(accountsFilePath, "utf8");
  const parsed = JSON.parse(fileContents);
  const rawAccounts = Array.isArray(parsed) ? parsed : (parsed.accounts ?? []);

  if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) {
    throw new Error(
      `No local bypass accounts found in ${accountsFilePath}. Create one with npm run test-user or update LOCAL_AUTH_BYPASS_ACCOUNTS_FILE.`,
    );
  }

  const normalizedAccounts = rawAccounts.map(normalizeLocalAccount);
  return normalizedAccounts.find((account) => account.role === "admin") ?? normalizedAccounts[0];
}

async function ensureLocalBypassSupabaseUser(config) {
  const existingUser = await findAuthUserByEmail(config.email);
  const authUser =
    existingUser ??
    (await supabase.auth.admin
      .createUser({
        email: config.email,
        email_confirm: true,
        user_metadata: {
          display_name: config.displayName,
          local_username: config.username,
        },
        app_metadata: {
          hito_local_bypass: true,
          hito_local_role: config.role,
        },
      })
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        if (!data.user) {
          throw new Error("Supabase did not return a user for the local bypass account.");
        }

        return data.user;
      }));

  return authUser.id;
}

async function findAuthUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const matchedUser =
      data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;

    if (matchedUser) {
      return matchedUser;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeLocalAccount(account) {
  const username = String(account.username ?? "")
    .trim()
    .toLowerCase();

  if (!username) {
    throw new Error("Local bypass accounts file must include username for each account.");
  }

  return {
    username,
    email: String(account.email ?? `${username}@local.test`)
      .trim()
      .toLowerCase(),
    userId: String(account.userId ?? deriveUserId(username)).trim(),
    role: account.role === "admin" ? "admin" : "tester",
    displayName: String(account.displayName ?? humanizeUsername(username)).trim(),
  };
}

function deriveUserId(username) {
  const hash = createHash("sha256").update(username).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}

function humanizeUsername(username) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}
