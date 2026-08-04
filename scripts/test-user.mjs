import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { tsImport } from "tsx/esm/api";
import {
  QA_TESTER_POOL,
  acquireQaPoolLease,
  assertQaCleanupManifestMatches,
  assertQaPoolAuthUser,
  buildQaCleanupManifest,
  buildQaTestUserInventory,
  classifyQaIdentity,
  ensureQaPoolAuthUser,
  findAuthUserByEmail as findQaAuthUserByEmail,
  getQaUserOwnedCounts,
  poolLocalAccount,
  readQaPoolLeases,
  releaseQaPoolLease,
  requireQaPoolRole,
  resetQaPoolUserData,
} from "./lib/qa-test-user-lifecycle.mjs";

const { createFirstPlanFromReviewedCanonicalPlanForUser } = await tsImport(
  "../src/lib/active-plan-persistence.ts",
  import.meta.url,
);
const { isLoopbackRuntimeUrl } = await tsImport("../src/lib/supabase/env.ts", import.meta.url);
const {
  RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE,
  RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_STORAGE_BUCKET,
  RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_VERSION,
  readRunnerActivityProgressReviewFixture,
  seedRunnerActivityProgressReviewFixture,
  verifyRunnerActivityProgressReviewFixtureRuntime,
} = await tsImport("./lib/runner-activity-progress-review-fixture.ts", import.meta.url);

const DEFAULT_ACCOUNTS_FILE = ".tanstack/hito-running-local-accounts.json";

const command = process.argv[2];
const options = parseArgs(process.argv.slice(3));

if (
  ![
    "create",
    "reset-plan",
    "reset",
    "delete",
    "inventory",
    "cleanup-manifest",
    "cleanup-apply",
    "pool-ensure",
    "pool-plan-readback",
    "pool-reset-plan",
    "pool-reset",
    "pool-delete",
    "activity-review-seed",
    "activity-review-status",
    "activity-review-reset",
  ].includes(command)
) {
  throw new Error(
    "Usage: npm run test-user -- <inventory|cleanup-manifest|cleanup-apply|pool-ensure|pool-plan-readback|pool-reset-plan|pool-reset|pool-delete|activity-review-seed|activity-review-status|activity-review-reset|create|reset-plan|reset|delete> [options]",
  );
}

const config = buildConfig();
const supabase = createClient(config.supabaseUrl, config.supabaseServerKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (command === "inventory") {
  await handleInventory();
} else if (command === "cleanup-manifest") {
  await handleCleanupManifest();
} else if (command === "cleanup-apply") {
  await handleCleanupApply();
} else if (command === "pool-ensure") {
  await handlePoolEnsure();
} else if (command === "pool-plan-readback") {
  await handlePoolPlanReadback();
} else if (command === "pool-reset-plan") {
  await handlePoolReset({ preserveProfile: true });
} else if (command === "pool-reset") {
  await handlePoolReset();
} else if (command === "pool-delete") {
  await handlePoolDelete();
} else if (command === "activity-review-seed") {
  await handleActivityReviewSeed();
} else if (command === "activity-review-status") {
  await handleActivityReviewStatus();
} else if (command === "activity-review-reset") {
  await handleActivityReviewReset();
} else if (command === "create") {
  await handleCreate();
} else if (command === "reset-plan") {
  await handleReset({ preserveProfile: true });
} else if (command === "reset") {
  await handleReset();
} else {
  await handleDelete();
}

async function handleInventory() {
  const inventory = await buildCurrentInventory();
  console.log(JSON.stringify({ ...inventory, leases: await readQaPoolLeases() }, null, 2));
}

async function handleCleanupManifest() {
  const manifest = buildQaCleanupManifest(await buildCurrentInventory());
  await writeOptionalEvidenceFile(options.output, manifest);
  console.log(JSON.stringify(manifest, null, 2));
}

async function handleCleanupApply() {
  const manifestPath = requireEvidencePath(options.manifest, "--manifest");
  const confirmation = requireOption(options["confirm-selection"], "--confirm-selection");
  const expected = JSON.parse(await readFile(manifestPath, "utf8"));

  if (confirmation !== expected.selectionHash) {
    throw new Error("--confirm-selection must exactly match the reviewed manifest selectionHash.");
  }

  const current = buildQaCleanupManifest(await buildCurrentInventory());
  assertQaCleanupManifestMatches(expected, current);
  const accounts = await loadLocalAccounts();

  for (const candidate of current.candidates) {
    const authUser = await supabase.auth.admin.getUserById(candidate.id);
    if (authUser.error || !authUser.data.user) {
      throw new Error(
        authUser.error?.message ?? `Cleanup candidate ${candidate.id} disappeared before apply.`,
      );
    }
    const classification = classifyQaIdentity(authUser.data.user);
    if (classification.kind !== "test_candidate") {
      throw new Error(`Cleanup candidate ${candidate.id} is no longer metadata-proven test data.`);
    }

    await resetQaPoolUserData({ supabase, userId: candidate.id });
    const deletion = await supabase.auth.admin.deleteUser(candidate.id, false);
    if (deletion.error) {
      throw new Error(deletion.error.message);
    }
  }

  const removedIds = new Set(current.candidates.map((candidate) => candidate.id));
  const removedEmails = new Set(current.candidates.map((candidate) => candidate.email));
  const staleIds = new Set(current.staleCredentials.map((credential) => credential.userId));
  const protectedAuthIdsByEmail = new Map(
    current.protectedIdentities.map((identity) => [identity.email, identity.id]),
  );
  const nextAccounts = accounts
    .filter(
      (account) =>
        account.role === "admin" ||
        (!removedIds.has(account.userId) &&
          !removedEmails.has(account.email) &&
          !staleIds.has(account.userId)),
    )
    .map((account) => ({
      ...account,
      userId:
        account.role === "admin"
          ? (protectedAuthIdsByEmail.get(account.email) ?? account.userId)
          : account.userId,
    }));
  await saveLocalAccounts(nextAccounts);

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "cleanup-apply",
        selectionHash: current.selectionHash,
        removedAuthUsers: current.candidates.length,
        removedStaleCredentials: current.staleCredentials.length,
        postInventory: await buildCurrentInventory(),
      },
      null,
      2,
    ),
  );
}

async function handlePoolEnsure() {
  const role = requireQaPoolRole(options.role);
  const accounts = await loadLocalAccounts();
  const existingLocalAccount =
    accounts.find((account) => account.email === QA_TESTER_POOL[role].email) ?? null;
  const password =
    options.password ?? existingLocalAccount?.password ?? randomBytes(24).toString("base64url");
  const authUser = await ensureQaPoolAuthUser({ supabase, role, password });
  const nextAccounts = upsertLocalAccount(accounts, poolLocalAccount(role, password, authUser.id));
  await saveLocalAccounts(nextAccounts);

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "pool-ensure",
        role,
        email: QA_TESTER_POOL[role].email,
        authUserId: authUser.id,
        ownedRows: await getUserDataCounts(authUser.id),
      },
      null,
      2,
    ),
  );
}

async function handlePoolPlanReadback() {
  const role = requireQaPoolRole(options.role);
  const definition = QA_TESTER_POOL[role];
  const authUser = await findAuthUserByEmail(definition.email);

  if (!authUser) {
    throw new Error(`QA pool user ${definition.email} was not found.`);
  }

  await assertQaPoolAuthUser({ supabase, role, userId: authUser.id });
  const persisted = await readImportedPlanForUser(authUser.id);
  if (!persisted.planCycle.id || persisted.workoutCount <= 0) {
    throw new Error("Persisted plan readback evidence requires one plan and non-empty workouts.");
  }

  const evidence = {
    artifactKind: "qa_pool_persisted_plan_readback_v1",
    environment: "local",
    role,
    userId: authUser.id,
    ...persisted,
  };
  await writeOptionalEvidenceFile(options.output, evidence);
  console.log(JSON.stringify(evidence, null, 2));
}

async function handlePoolReset({ preserveProfile = false } = {}) {
  const role = requireQaPoolRole(options.role);
  await assertPoolRoleIsNotLeased(role);
  const definition = QA_TESTER_POOL[role];
  const authUser = await findAuthUserByEmail(definition.email);

  if (!authUser) {
    throw new Error(`QA pool user ${definition.email} was not found.`);
  }

  await assertQaPoolAuthUser({ supabase, role, userId: authUser.id });
  const profileBefore = preserveProfile ? await readRunnerProfileForUser(authUser.id) : null;
  if (preserveProfile && !profileBefore) {
    throw new Error(`pool-reset-plan requires a saved profile for ${definition.email}.`);
  }
  const beforeCounts = await getUserDataCounts(authUser.id);
  const afterCounts = await resetQaPoolUserData({
    supabase,
    userId: authUser.id,
    preserveProfile,
  });
  const profileAfter = preserveProfile ? await readRunnerProfileForUser(authUser.id) : null;

  if (preserveProfile && JSON.stringify(profileAfter) !== JSON.stringify(profileBefore)) {
    throw new Error(`Runner profile changed while resetting ${definition.email}.`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: preserveProfile ? "pool-reset-plan" : "pool-reset",
        role,
        email: definition.email,
        beforeCounts,
        afterCounts,
      },
      null,
      2,
    ),
  );
}

async function handlePoolDelete() {
  const role = requireQaPoolRole(options.role);
  const confirmation = requireQaPoolRole(options["confirm-role"]);

  if (confirmation !== role) {
    throw new Error("--confirm-role must exactly match --role.");
  }

  await assertPoolRoleIsNotLeased(role);
  const definition = QA_TESTER_POOL[role];
  const authUser = await findAuthUserByEmail(definition.email);
  const accounts = await loadLocalAccounts();

  if (authUser) {
    await assertQaPoolAuthUser({ supabase, role, userId: authUser.id });
    await resetQaPoolUserData({ supabase, userId: authUser.id });
    const deletion = await supabase.auth.admin.deleteUser(authUser.id, false);
    if (deletion.error) {
      throw new Error(deletion.error.message);
    }
  }

  await saveLocalAccounts(
    accounts.filter(
      (account) => account.email !== definition.email && account.username !== definition.username,
    ),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "pool-delete",
        role,
        email: definition.email,
        removedAuthUser: Boolean(authUser),
      },
      null,
      2,
    ),
  );
}

async function handleActivityReviewSeed() {
  await withActivityReviewLease(async () => {
    const authUser = await ensureActivityReviewPoolUser();
    const beforeCounts = await getQaUserOwnedCounts(supabase, authUser.id);
    await resetQaPoolUserData({ supabase, userId: authUser.id });
    let fixture;
    try {
      fixture = await seedRunnerActivityProgressReviewFixture({
        supabase,
        userId: authUser.id,
      });
    } catch (error) {
      await resetQaPoolUserData({ supabase, userId: authUser.id });
      throw error;
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "activity-review-seed",
          localOnly: true,
          login: {
            username: QA_TESTER_POOL[RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE].username,
            path: "http://127.0.0.1:3000/login",
          },
          beforeCounts,
          fixture,
          afterCounts: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleActivityReviewStatus() {
  await withActivityReviewLease(async () => {
    const definition = QA_TESTER_POOL[RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Activity review QA identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE,
      userId: authUser.id,
    });
    const fixture = await readRunnerActivityProgressReviewFixture({
      supabase,
      userId: authUser.id,
    });
    const accounts = await loadLocalAccounts();
    const localAccount = accounts.find((account) => account.email === definition.email) ?? null;
    if (!localAccount) {
      throw new Error(`Local login account ${definition.email} was not found.`);
    }
    const runtime = options["runtime-url"]
      ? await verifyRunnerActivityProgressReviewFixtureRuntime({
          runtimeUrl: options["runtime-url"],
          username: localAccount.username,
          password: localAccount.password,
        })
      : null;
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "activity-review-status",
          localOnly: true,
          fixture,
          runtime,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleActivityReviewReset() {
  await withActivityReviewLease(async () => {
    const definition = QA_TESTER_POOL[RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Activity review QA identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE,
      userId: authUser.id,
    });
    const beforeCounts = await getQaUserOwnedCounts(supabase, authUser.id);
    const afterCounts = await resetQaPoolUserData({ supabase, userId: authUser.id });
    if (Object.values(afterCounts).some((count) => count !== 0)) {
      throw new Error("Activity review fixture reset left canonical QA-owned rows behind.");
    }
    const retainedStorage = await supabase.storage
      .from(RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_STORAGE_BUCKET)
      .list(`${authUser.id}/${RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_VERSION}`);
    if (retainedStorage.error) throw new Error(retainedStorage.error.message);
    if (retainedStorage.data.length !== 0) {
      throw new Error("Activity review fixture reset left raw storage objects behind.");
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "activity-review-reset",
          localOnly: true,
          authUserPreserved: true,
          authUserId: authUser.id,
          retainedStorageObjects: retainedStorage.data.length,
          beforeCounts,
          afterCounts,
        },
        null,
        2,
      ),
    );
  });
}

async function ensureActivityReviewPoolUser() {
  const role = RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE;
  const definition = QA_TESTER_POOL[role];
  const accounts = await loadLocalAccounts();
  const existingLocalAccount =
    accounts.find((account) => account.email === definition.email) ?? null;
  const password = existingLocalAccount?.password ?? randomBytes(24).toString("base64url");
  const authUser = await ensureQaPoolAuthUser({ supabase, role, password });
  await assertQaPoolAuthUser({ supabase, role, userId: authUser.id });
  await saveLocalAccounts(
    upsertLocalAccount(accounts, poolLocalAccount(role, password, authUser.id)),
  );
  return authUser;
}

async function withActivityReviewLease(action) {
  const lease = await acquireQaPoolLease({
    role: RUNNER_ACTIVITY_PROGRESS_REVIEW_FIXTURE_ROLE,
  });
  try {
    return await action();
  } finally {
    await releaseQaPoolLease(lease);
  }
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
    userId: authUser.id,
    role: "tester",
    displayName,
  });

  await saveLocalAccounts(nextAccounts);
  const beforeCounts = await getUserDataCounts(authUser.id);
  let importedPlan = null;

  if (options.plan) {
    await resetQaPoolUserData({ supabase, userId: authUser.id });
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

async function handleReset({ preserveProfile = false } = {}) {
  const email = requireEmail(options.email);
  const accounts = await loadLocalAccounts();
  const localAccount = accounts.find((account) => account.email === email) ?? null;

  if (preserveProfile) {
    if (options.plan) {
      throw new Error("reset-plan does not accept --plan; it must leave the tester with no plan.");
    }
    assertLocalTesterAccount(email, localAccount);
  } else {
    assertNotProtectedAccount(email, localAccount, "reset");
  }

  const authUser = await findAuthUserByEmail(email);

  if (!authUser) {
    throw new Error(`Supabase auth user not found for ${email}.`);
  }
  assertMetadataProvenTester(authUser, preserveProfile ? "reset-plan" : "reset");

  const profileBefore = preserveProfile ? await readRunnerProfileForUser(authUser.id) : null;

  if (preserveProfile && !profileBefore) {
    throw new Error(
      `reset-plan requires an existing saved runner baseline for ${email}; use reset for a full onboarding reset.`,
    );
  }

  const beforeCounts = await getUserDataCounts(authUser.id);
  await resetQaPoolUserData({
    supabase,
    userId: authUser.id,
    preserveProfile,
  });

  let importedPlan = null;

  if (!preserveProfile && options.plan) {
    importedPlan = await importPlanForUser(authUser.id, options.plan);
  }

  const profileAfter = preserveProfile ? await readRunnerProfileForUser(authUser.id) : null;
  const afterCounts = await getUserDataCounts(authUser.id);

  if (preserveProfile && JSON.stringify(profileAfter) !== JSON.stringify(profileBefore)) {
    throw new Error(`Runner profile changed while resetting plan data for ${email}.`);
  }
  if (
    preserveProfile &&
    (afterCounts.planCycles !== 0 ||
      afterCounts.plannedWorkouts !== 0 ||
      afterCounts.workoutLogs !== 0)
  ) {
    throw new Error(`Canonical plan rows still exist after resetting plan data for ${email}.`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: preserveProfile ? "reset-plan" : "reset",
        email,
        authUserId: authUser.id,
        ...(preserveProfile ? { profilePreserved: true } : { importedPlan }),
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
    assertMetadataProvenTester(authUser, "delete");
    await resetQaPoolUserData({ supabase, userId: authUser.id });
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
    assertMetadataProvenTester(existingUser, "reuse");
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
  return findQaAuthUserByEmail(supabase, email);
}

async function getUserDataCounts(userId) {
  const counts = await getQaUserOwnedCounts(supabase, userId);
  return {
    runnerProfiles: counts.runner_profiles,
    planCycles: counts.plan_cycles,
    plannedWorkouts: counts.planned_workouts,
    workoutLogs: counts.workout_logs,
    workoutResultAssets: counts.workout_result_assets,
    workoutActualMetrics: counts.workout_actual_metrics,
    workoutComparisons: counts.workout_comparisons,
    workoutAiInsights: counts.workout_ai_insights,
    runnerManualWorkoutTemplates: counts.runner_manual_workout_templates,
    runnerEntitlements: counts.runner_entitlements,
    runnerCapabilityUsage: counts.runner_capability_usage,
  };
}

async function readRunnerProfileForUser(userId) {
  const result = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
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
    .maybeSingle();

  if (planCycle.error) {
    throw new Error(planCycle.error.message);
  }
  if (!planCycle.data) {
    throw new Error("Persisted plan readback evidence requires one active plan.");
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

function assertLocalTesterAccount(email, localAccount) {
  if (localAccount?.role !== "tester") {
    throw new Error(`reset-plan is restricted to a local tester account: ${email}.`);
  }
}

function assertMetadataProvenTester(authUser, action) {
  const classification = classifyQaIdentity(authUser);

  if (classification.kind !== "test_candidate" && classification.kind !== "pool_member") {
    throw new Error(
      `Refusing to ${action} Auth identity ${authUser.email ?? authUser.id}; app metadata does not prove it is a tester.`,
    );
  }
}

async function buildCurrentInventory() {
  return buildQaTestUserInventory({
    supabase,
    environment: "local",
    target: {
      origin: new URL(config.supabaseUrl).origin,
      loopback: true,
    },
    localAccounts: await loadLocalAccounts(),
  });
}

async function assertPoolRoleIsNotLeased(role) {
  const lease = (await readQaPoolLeases()).find((candidate) => candidate.role === role);
  if (lease) {
    throw new Error(
      `QA pool role ${role} is leased by pid ${lease.pid ?? "unknown"} since ${
        lease.acquiredAt ?? "unknown"
      }.`,
    );
  }
}

async function writeOptionalEvidenceFile(value, payload) {
  if (!value) return;
  const outputPath = requireEvidencePath(value, "--output");
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, outputPath);
}

function requireEvidencePath(value, label) {
  const requested = path.resolve(process.cwd(), requireOption(value, label));
  const evidenceRoot = path.resolve(process.cwd(), ".tanstack");
  if (requested !== evidenceRoot && !requested.startsWith(`${evidenceRoot}${path.sep}`)) {
    throw new Error(`${label} must be inside the ignored .tanstack directory.`);
  }
  return requested;
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
