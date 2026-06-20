import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { tsImport } from "tsx/esm/api";

const { buildImportedPlanSeed } = await tsImport("../src/lib/imported-plan.ts", import.meta.url);
const { buildStructuredAuthoringPlan, structuredPlanAuthoringInputSchema } = await tsImport(
  "../src/lib/structured-plan-authoring.ts",
  import.meta.url,
);
const { applyImportedSeedAsActivePlanForOps } = await tsImport(
  "./lib/ops-plan-apply.ts",
  import.meta.url,
);

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

const appliedPlan = await applyImportedSeedAsActivePlanForOps({
  supabase,
  userId: authUser.id,
  importedSeed,
  planSelect: "id, title, start_date, end_date, source_template",
  workoutSelect: "id, workout_date, title, workout_type",
  workoutLimit: 3,
});

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      inputPath,
      activePlanId: appliedPlan.planCycle.id,
      title: appliedPlan.planCycle.title,
      sourceTemplate: appliedPlan.planCycle.source_template,
      schemaVersion: generatedPlan.schema_version,
      sourceKind: generatedPlan.source_kind,
      workoutCount: appliedPlan.workoutCount,
      startDate: appliedPlan.planCycle.start_date,
      endDate: appliedPlan.planCycle.end_date,
      previewWorkouts: appliedPlan.workouts,
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
