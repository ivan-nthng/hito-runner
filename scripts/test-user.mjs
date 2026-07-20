import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { tsImport } from "tsx/esm/api";

const { createFirstPlanFromReviewedCanonicalPlanForUser } = await tsImport(
  "../src/lib/active-plan-persistence.ts",
  import.meta.url,
);
const { isLoopbackRuntimeUrl } = await tsImport("../src/lib/supabase/env.ts", import.meta.url);

const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";

const command = process.argv[2];
const options = parseArgs(process.argv.slice(3));

if (!["create", "reset", "delete"].includes(command)) {
  throw new Error(
    "Usage: npm run test-user -- <create|reset|delete> --email <email> [--username <name>] [--password <password>] [--plan <absolute-json-path>] [--confirm-email <email>]",
  );
}

const config = buildConfig();
const supabase = createClient(config.supabaseUrl, config.supabaseServerKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (command === "create") {
  await handleCreate();
} else if (command === "reset") {
  await handleReset();
} else {
  await handleDelete();
}

async function handleCreate() {
  const email = requireEmail(options.email);
  const username = requireUsername(options.username);
  const password = requireOption(options.password, "--password");
  const displayName = options["display-name"]?.trim() || humanizeUsername(username);
  const accounts = await loadLocalAccounts();
  const existingAccountByEmail = accounts.find((account) => account.email === email);
  const existingAccountByUsername = accounts.find((account) => account.username === username);

  if (existingAccountByEmail?.role === "admin" || existingAccountByUsername?.role === "admin") {
    throw new Error("Refusing to replace a protected local admin account with a tester account.");
  }

  if (
    existingAccountByEmail &&
    existingAccountByEmail.username !== username &&
    existingAccountByEmail.role !== "admin"
  ) {
    throw new Error(
      `Local account email ${email} is already attached to ${existingAccountByEmail.username}.`,
    );
  }

  if (existingAccountByUsername && existingAccountByUsername.email !== email) {
    throw new Error(
      `Local account username ${username} is already attached to ${existingAccountByUsername.email}.`,
    );
  }

  const authUser = await ensureAuthUser({
    email,
    displayName,
    role: "tester",
    username,
  });
  const nextAccounts = upsertLocalAccount(accounts, {
    username,
    password,
    email,
    role: "tester",
    qaFixtureAccess: true,
    displayName,
  });

  await saveLocalAccounts(nextAccounts);
  const beforeCounts = await getUserDataCounts(authUser.id);
  let importedPlan = null;

  if (options.plan) {
    await resetPersistedUserData(authUser.id);
    importedPlan = await importPlanForUser(authUser.id, options.plan);
  }

  const afterCounts = await getUserDataCounts(authUser.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "create",
        email,
        username,
        authUserId: authUser.id,
        localAccountsFile: path.relative(process.cwd(), config.accountsFilePath),
        importedPlan,
        beforeCounts,
        afterCounts,
      },
      null,
      2,
    ),
  );
}

async function handleReset() {
  const email = requireEmail(options.email);
  const accounts = await loadLocalAccounts();
  const localAccount = accounts.find((account) => account.email === email) ?? null;
  assertNotProtectedAccount(email, localAccount, "reset");
  const authUser = await findAuthUserByEmail(email);

  if (!authUser) {
    throw new Error(`Supabase auth user not found for ${email}.`);
  }

  const beforeCounts = await getUserDataCounts(authUser.id);
  await resetPersistedUserData(authUser.id);

  let importedPlan = null;

  if (options.plan) {
    importedPlan = await importPlanForUser(authUser.id, options.plan);
  }

  const afterCounts = await getUserDataCounts(authUser.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "reset",
        email,
        authUserId: authUser.id,
        importedPlan,
        beforeCounts,
        afterCounts,
      },
      null,
      2,
    ),
  );
}

async function handleDelete() {
  const email = requireEmail(options.email);
  const confirmation = requireEmail(options["confirm-email"], "--confirm-email");

  if (email !== confirmation) {
    throw new Error("--confirm-email must exactly match --email.");
  }

  const accounts = await loadLocalAccounts();
  const localAccount = accounts.find((account) => account.email === email) ?? null;
  assertNotProtectedAccount(email, localAccount, "delete");
  const authUser = await findAuthUserByEmail(email);

  if (!authUser && !localAccount) {
    throw new Error(`No local or Supabase user found for ${email}.`);
  }

  const beforeCounts = authUser ? await getUserDataCounts(authUser.id) : null;

  if (authUser) {
    const deletion = await supabase.auth.admin.deleteUser(authUser.id, false);

    if (deletion.error) {
      throw new Error(deletion.error.message);
    }
  }

  const remainingAuthUser = await findAuthUserByEmail(email);
  const afterCounts = authUser ? await getUserDataCounts(authUser.id) : null;

  if (remainingAuthUser) {
    throw new Error(`Supabase auth user still exists after deleting ${email}.`);
  }

  if (afterCounts && Object.values(afterCounts).some((count) => count !== 0)) {
    throw new Error(`Canonical rows still exist after deleting ${email}.`);
  }

  const nextAccounts = accounts.filter((account) => account.email !== email);
  await saveLocalAccounts(nextAccounts);

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "delete",
        email,
        removedAuthUser: Boolean(authUser),
        removedLocalAccount: Boolean(localAccount),
        authUserRemaining: Boolean(remainingAuthUser),
        beforeCounts,
        afterCounts,
        localAccountsFile: path.relative(process.cwd(), config.accountsFilePath),
      },
      null,
      2,
    ),
  );
}

function buildConfig() {
  const supabaseUrl = requireOption(
    readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const supabaseServerKey = requireOption(readEnv("SUPABASE_SECRET_KEY"), "SUPABASE_SECRET_KEY");

  if (!isLoopbackRuntimeUrl(supabaseUrl)) {
    throw new Error(
      "Refusing to run test-user against non-loopback Supabase. Start local Supabase and run npm run supabase:local:configure.",
    );
  }

  return {
    supabaseUrl,
    supabaseServerKey,
    accountsFilePath: path.resolve(
      process.cwd(),
      readEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE") ?? DEFAULT_ACCOUNTS_FILE,
    ),
  };
}

async function loadLocalAccounts() {
  try {
    const raw = await readFile(config.accountsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const rawAccounts = Array.isArray(parsed) ? parsed : (parsed.accounts ?? []);
    return rawAccounts.map(normalizeAccount);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
      throw error;
    }

    return [];
  }
}

async function saveLocalAccounts(accounts) {
  await mkdir(path.dirname(config.accountsFilePath), { recursive: true });
  await writeFile(config.accountsFilePath, `${JSON.stringify({ accounts }, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(config.accountsFilePath, 0o600);
}

function normalizeAccount(account) {
  const username = normalizeUsername(account.username);
  const email = normalizeEmail(account.email ?? `${username}@local.test`);

  return {
    username,
    password: String(account.password),
    email,
    userId: account.userId ?? deriveUserId(username),
    role: account.role === "admin" ? "admin" : "tester",
    qaFixtureAccess: account.qaFixtureAccess === true,
    displayName: account.displayName?.trim() || humanizeUsername(username),
  };
}

function upsertLocalAccount(accounts, nextAccount) {
  const normalized = normalizeAccount(nextAccount);
  const nextAccounts = accounts.filter(
    (account) => account.email !== normalized.email && account.username !== normalized.username,
  );
  nextAccounts.push(normalized);
  return nextAccounts.sort((left, right) => left.username.localeCompare(right.username));
}

async function ensureAuthUser({ email, displayName, role, username }) {
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      local_username: username,
    },
    app_metadata: {
      hito_local_bypass: true,
      hito_local_role: role,
      hito_test_user: role === "tester",
    },
  });

  if (created.error) {
    throw new Error(created.error.message);
  }

  if (!created.data.user) {
    throw new Error(`Supabase did not return a user for ${email}.`);
  }

  return created.data.user;
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
      data.users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;

    if (matchedUser) {
      return matchedUser;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function getUserDataCounts(userId) {
  const [profile, plans, workouts, logs] = await Promise.all([
    supabase
      .from("runner_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("plan_cycles").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("planned_workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  for (const result of [profile, plans, workouts, logs]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    runnerProfiles: profile.count ?? 0,
    planCycles: plans.count ?? 0,
    plannedWorkouts: workouts.count ?? 0,
    workoutLogs: logs.count ?? 0,
  };
}

async function resetPersistedUserData(userId) {
  const planDelete = await supabase.from("plan_cycles").delete().eq("user_id", userId);

  if (planDelete.error) {
    throw new Error(planDelete.error.message);
  }

  const profileDelete = await supabase.from("runner_profiles").delete().eq("user_id", userId);

  if (profileDelete.error) {
    throw new Error(profileDelete.error.message);
  }
}

async function importPlanForUser(userId, planPath) {
  const rawPlan = await readFile(path.resolve(process.cwd(), planPath), "utf8");
  const plan = JSON.parse(rawPlan);

  await createFirstPlanFromReviewedCanonicalPlanForUser(userId, plan);
  const appliedPlan = await readImportedPlanForUser(userId);

  const richWorkoutCount = appliedPlan.workouts.filter(
    (workout) =>
      workout.workout_family &&
      workout.workout_identity &&
      workout.calendar_icon_key &&
      workout.goal_context &&
      workout.metric_mode,
  ).length;
  const compactFallbackCount = appliedPlan.workouts.filter(
    (workout) =>
      !workout.source_workout_type &&
      !workout.workout_family &&
      !workout.workout_identity &&
      !workout.calendar_icon_key,
  ).length;

  return {
    planPath: path.resolve(process.cwd(), planPath),
    activePlanId: appliedPlan.planCycle.id,
    title: appliedPlan.planCycle.title,
    startDate: appliedPlan.planCycle.start_date,
    endDate: appliedPlan.planCycle.end_date,
    workoutCount: appliedPlan.workoutCount,
    richWorkoutCount,
    compactFallbackCount,
    previewWorkouts: appliedPlan.workouts.map((workout) => ({
      date: workout.workout_date,
      title: workout.title,
      sourceWorkoutType: workout.source_workout_type,
      workoutFamily: workout.workout_family,
      workoutIdentity: workout.workout_identity,
      calendarIconKey: workout.calendar_icon_key,
      hasGoalContext: Boolean(workout.goal_context),
      hasMetricMode: Boolean(workout.metric_mode),
    })),
  };
}

async function readImportedPlanForUser(userId) {
  const planCycle = await supabase
    .from("plan_cycles")
    .select("id, title, start_date, end_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (planCycle.error) {
    throw new Error(planCycle.error.message);
  }

  const workouts = await supabase
    .from("planned_workouts")
    .select(
      "id, workout_date, title, source_workout_type, workout_family, workout_identity, calendar_icon_key, goal_context, metric_mode",
    )
    .eq("plan_cycle_id", planCycle.data.id)
    .order("workout_date", { ascending: true });

  if (workouts.error) {
    throw new Error(workouts.error.message);
  }

  return {
    planCycle: planCycle.data,
    workoutCount: workouts.data.length,
    workouts: workouts.data,
  };
}

function assertNotProtectedAccount(email, localAccount, action) {
  if (localAccount?.role === "admin") {
    throw new Error(`Refusing to ${action} admin account ${localAccount.email}.`);
  }
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];

    if (!entry.startsWith("--")) {
      throw new Error(`Unexpected argument: ${entry}`);
    }

    const key = entry.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

function requireEmail(value, label = "--email") {
  const email = requireOption(value, label);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`${label} must be a valid email address.`);
  }

  return normalizeEmail(email);
}

function requireUsername(value) {
  const username = requireOption(value, "--username");
  return normalizeUsername(username);
}

function requireOption(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required ${label}.`);
  }

  return value.trim();
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function humanizeUsername(username) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function slugify(value) {
  return value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "user";
}

function deriveUserId(username) {
  const hash = createHash("sha256").update(username).digest("hex");

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}
