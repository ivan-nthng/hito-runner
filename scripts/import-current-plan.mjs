import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { buildImportedPlanSeed } from "./lib/imported-plan-seed.mjs";

const PLAN_PATH =
  process.argv[2] ?? "/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json";

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServerKey = readEnv("SUPABASE_SECRET_KEY") ?? readEnv("SUPABASE_SERVICE_ROLE_KEY");
const localUserId = readEnv("LOCAL_AUTH_BYPASS_USER_ID") ?? "11111111-1111-4111-8111-111111111111";
const localUsername = readEnv("LOCAL_AUTH_BYPASS_IDENTIFIER") ?? "ivan";
const localEmail = readEnv("LOCAL_AUTH_BYPASS_EMAIL") ?? "ivan@local.test";

if (!supabaseUrl || !supabaseServerKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY for the plan import.",
  );
}

const supabase = createClient(supabaseUrl, supabaseServerKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const plan = JSON.parse(await readFile(PLAN_PATH, "utf8"));
const importedSeed = buildImportedPlanSeed(plan);
const supabaseUserId = await ensureLocalBypassSupabaseUser({
  email: localEmail,
  displayName: humanizeUsername(localUsername),
  role: localUsername === "ivan" ? "admin" : "tester",
  userId: localUserId,
  username: localUsername,
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
    start_date: importedSeed.startDate,
    end_date: importedSeed.endDate,
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
  title: workout.title,
  notes: workout.notes,
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
      localUserId,
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

function humanizeUsername(username) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}
