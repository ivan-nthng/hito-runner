import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { buildImportedPlanSeed } from "./lib/imported-plan-seed.mjs";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
} from "./lib/structured-plan-authoring.mjs";

const options = parseArgs(process.argv.slice(2));
const inputPath = requireOption(options["input-file"], "--input-file");
const email = normalizeEmail(requireOption(options.email, "--email"));

const supabaseUrl = requireOption(readEnv("NEXT_PUBLIC_SUPABASE_URL"), "NEXT_PUBLIC_SUPABASE_URL");
const supabaseServerKey = requireOption(readEnv("SUPABASE_SECRET_KEY"), "SUPABASE_SECRET_KEY");

const supabase = createClient(supabaseUrl, supabaseServerKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const rawInput = JSON.parse(await readFile(inputPath, "utf8"));
const authoringInput = structuredPlanAuthoringInputSchema.parse(rawInput);
const generatedPlan = buildStructuredAuthoringPlan(authoringInput);
const importedSeed = buildImportedPlanSeed(generatedPlan);
const authUser = await findAuthUserByEmail(email);

if (!authUser) {
  throw new Error(`Supabase auth user not found for ${email}. Create the tester first.`);
}

const profileUpsert = await supabase
  .from("runner_profiles")
  .upsert({
    user_id: authUser.id,
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
  .eq("user_id", authUser.id)
  .eq("status", "active");

if (archived.error) {
  throw new Error(archived.error.message);
}

const planInsert = await supabase
  .from("plan_cycles")
  .insert({
    user_id: authUser.id,
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
  .select("id, title, start_date, end_date, source_template")
  .single();

if (planInsert.error) {
  throw new Error(planInsert.error.message);
}

const workouts = importedSeed.workouts.map((workout) => ({
  plan_cycle_id: planInsert.data.id,
  user_id: authUser.id,
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

const verifyWorkouts = await supabase
  .from("planned_workouts")
  .select("id, workout_date, title, workout_type", { count: "exact" })
  .eq("plan_cycle_id", planInsert.data.id)
  .order("workout_date", { ascending: true })
  .limit(3);

if (verifyWorkouts.error) {
  throw new Error(verifyWorkouts.error.message);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      inputPath,
      activePlanId: planInsert.data.id,
      title: planInsert.data.title,
      sourceTemplate: planInsert.data.source_template,
      schemaVersion: generatedPlan.schema_version,
      sourceKind: generatedPlan.source_kind,
      workoutCount: verifyWorkouts.count ?? 0,
      startDate: planInsert.data.start_date,
      endDate: planInsert.data.end_date,
      previewWorkouts: verifyWorkouts.data,
    },
    null,
    2,
  ),
);

async function findAuthUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const matched = data.users.find((user) => normalizeEmail(user.email) === targetEmail) ?? null;

    if (matched) {
      return matched;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

function parseArgs(args) {
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (!current.startsWith("--")) {
      continue;
    }

    parsed[current.slice(2)] = args[index + 1];
    index += 1;
  }

  return parsed;
}

function requireOption(value, label) {
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required option: ${label}.`);
  }

  return String(value).trim();
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value) {
  return value?.trim().toLowerCase() || null;
}
