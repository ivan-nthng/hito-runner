import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { buildImportedPlanSeed } from "./lib/imported-plan-seed.mjs";

const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";
const DEFAULT_LEGACY_EMAIL = "ivan@local.test";
const DEFAULT_LEGACY_USER_ID = "11111111-1111-4111-8111-111111111111";
const DEFAULT_LEGACY_STATE_PATH = ".tanstack/hito-running-local-auth.json";

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
    displayName,
    statePath: `.tanstack/hito-running-local-auth-${slugify(username)}.json`,
  });

  await saveLocalAccounts(nextAccounts);
  const beforeCounts = await getUserDataCounts(authUser.id);
  let importedPlan = null;

  if (options.plan) {
    await resetPersistedUserData(authUser.id);
    importedPlan = await importPlanForUser(authUser.id, email, options.plan);
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

  if (localAccount) {
    await removeLocalStateFile(localAccount.statePath);
  }

  let importedPlan = null;

  if (options.plan) {
    importedPlan = await importPlanForUser(authUser.id, email, options.plan);
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

  if (localAccount) {
    await removeLocalStateFile(localAccount.statePath);
  }

  const nextAccounts = accounts.filter((account) => account.email !== email);
  await saveLocalAccounts(nextAccounts);

  if (authUser) {
    const deletion = await supabase.auth.admin.deleteUser(authUser.id, false);

    if (deletion.error) {
      throw new Error(deletion.error.message);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "delete",
        email,
        removedAuthUser: Boolean(authUser),
        removedLocalAccount: Boolean(localAccount),
        localAccountsFile: path.relative(process.cwd(), config.accountsFilePath),
      },
      null,
      2,
    ),
  );
}

function buildConfig() {
  const supabaseUrl = requireOption(
    readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL"),
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const supabaseServerKey = requireOption(
    readEnv("SUPABASE_SECRET_KEY") ?? readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
  );

  return {
    supabaseUrl,
    supabaseServerKey,
    accountsFilePath: path.resolve(
      process.cwd(),
      readEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE") ?? DEFAULT_ACCOUNTS_FILE,
    ),
    protectedPrimaryEmail: normalizeEmail(
      readEnv("LOCAL_AUTH_BYPASS_EMAIL") ?? DEFAULT_LEGACY_EMAIL,
    ),
    protectedPrimaryUsername: normalizeUsername(readEnv("LOCAL_AUTH_BYPASS_IDENTIFIER") ?? "ivan"),
  };
}

async function loadLocalAccounts() {
  const fallbackAccounts = [];
  const legacyAdmin = readLegacyAdminAccount();

  if (legacyAdmin) {
    fallbackAccounts.push(legacyAdmin);
  }

  try {
    const raw = await readFile(config.accountsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const rawAccounts = Array.isArray(parsed) ? parsed : (parsed.accounts ?? []);
    return dedupeAccounts(rawAccounts.map(normalizeAccount), fallbackAccounts);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
      throw error;
    }

    if (fallbackAccounts.length > 0) {
      await saveLocalAccounts(fallbackAccounts);
    }

    return fallbackAccounts;
  }
}

async function saveLocalAccounts(accounts) {
  await mkdir(path.dirname(config.accountsFilePath), { recursive: true });
  await writeFile(config.accountsFilePath, `${JSON.stringify({ accounts }, null, 2)}\n`, "utf8");
}

function readLegacyAdminAccount() {
  const username = readEnv("LOCAL_AUTH_BYPASS_IDENTIFIER");
  const password = readEnv("LOCAL_AUTH_BYPASS_PASSWORD");

  if (!username || !password) {
    return null;
  }

  return normalizeAccount({
    username,
    password,
    email: readEnv("LOCAL_AUTH_BYPASS_EMAIL") ?? DEFAULT_LEGACY_EMAIL,
    userId: readEnv("LOCAL_AUTH_BYPASS_USER_ID") ?? DEFAULT_LEGACY_USER_ID,
    role: "admin",
    displayName: humanizeUsername(normalizeUsername(username)),
    statePath: readEnv("LOCAL_AUTH_BYPASS_STATE_PATH") ?? DEFAULT_LEGACY_STATE_PATH,
  });
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
    displayName: account.displayName?.trim() || humanizeUsername(username),
    statePath:
      account.statePath?.trim() || `.tanstack/hito-running-local-auth-${slugify(username)}.json`,
  };
}

function dedupeAccounts(accounts, fallbackAccounts) {
  const merged = [...fallbackAccounts, ...accounts];
  const byEmail = new Map();

  for (const account of merged) {
    byEmail.set(account.email, account);
  }

  return Array.from(byEmail.values()).sort((left, right) =>
    left.username.localeCompare(right.username),
  );
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

async function importPlanForUser(userId, email, planPath) {
  const rawPlan = await readFile(path.resolve(process.cwd(), planPath), "utf8");
  const plan = JSON.parse(rawPlan);
  const importedSeed = buildImportedPlanSeed(plan);

  const profileUpsert = await supabase
    .from("runner_profiles")
    .upsert({
      user_id: userId,
      goal_type: importedSeed.profile.goalType,
      goal_label: importedSeed.profile.goalLabel,
      baseline_sessions_per_week: importedSeed.profile.baselineSessionsPerWeek,
      baseline_long_run_km: importedSeed.profile.baselineLongRunKm,
      baseline_notes: importedSeed.profile.baselineNotes ?? `Imported from JSON for ${email}.`,
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
    .eq("user_id", userId)
    .eq("status", "active");

  if (archived.error) {
    throw new Error(archived.error.message);
  }

  const planInsert = await supabase
    .from("plan_cycles")
    .insert({
      user_id: userId,
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
    user_id: userId,
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

  return {
    planPath: path.resolve(process.cwd(), planPath),
    activePlanId: planInsert.data.id,
    title: planInsert.data.title,
    startDate: planInsert.data.start_date,
    endDate: planInsert.data.end_date,
    workoutCount: verifyPlan.count ?? 0,
  };
}

function assertNotProtectedAccount(email, localAccount, action) {
  if (email === config.protectedPrimaryEmail) {
    throw new Error(`Refusing to ${action} the protected primary account ${email}.`);
  }

  if (
    localAccount?.role === "admin" ||
    localAccount?.username === config.protectedPrimaryUsername
  ) {
    throw new Error(`Refusing to ${action} admin account ${localAccount.email}.`);
  }
}

async function removeLocalStateFile(statePath) {
  if (!statePath) {
    return;
  }

  await rm(path.resolve(process.cwd(), statePath), { force: true });
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
