import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tsImport } from "tsx/esm/api";

const { classifyActor } = await tsImport("../../src/lib/actor-classification.ts", import.meta.url);

export const QA_TESTER_POOL_VERSION = "hito_qa_tester_pool_v1";
export const QA_TESTER_POOL = Object.freeze({
  camelot: Object.freeze({
    username: "camelot",
    email: "camelot@local.test",
    displayName: "Camelot",
  }),
  "baseline-no-plan": Object.freeze({
    username: "qa-baseline",
    email: "qa-baseline@local.test",
    displayName: "QA Baseline",
  }),
  "saved-plan-readback": Object.freeze({
    username: "qa-saved-plan",
    email: "qa-saved-plan@local.test",
    displayName: "QA Saved Plan",
  }),
  "provider-engine": Object.freeze({
    username: "qa-provider-engine",
    email: "qa-provider-engine@local.test",
    displayName: "QA Provider Engine",
  }),
  "adaptive-training-quality": Object.freeze({
    username: "qa-adaptive-quality",
    email: "qa-adaptive-quality@local.test",
    displayName: "QA Adaptive Training Quality",
  }),
  "isolation-a": Object.freeze({
    username: "qa-isolation-a",
    email: "qa-isolation-a@local.test",
    displayName: "QA Isolation A",
  }),
  "isolation-b": Object.freeze({
    username: "qa-isolation-b",
    email: "qa-isolation-b@local.test",
    displayName: "QA Isolation B",
  }),
});

export const QA_TEST_USER_OWNED_TABLES = Object.freeze([
  "runner_profiles",
  "ai_plan_generation_responses",
  "adaptive_training_blueprint_versions",
  "adaptive_training_detailed_candidates",
  "adaptive_training_block_confirmations",
  "adaptive_training_continuation_input_revisions",
  "plan_cycles",
  "planned_workouts",
  "calendar_workout_mutation_events",
  "workout_logs",
  "workout_result_assets",
  "workout_actual_metrics",
  "workout_comparisons",
  "workout_ai_insights",
  "runner_activity_fact_snapshots",
  "runner_activity_metric_snapshots",
  "runner_activity_metric_observations",
  "runner_activity_evidence_revisions",
  "runner_activity_planned_workout_matches",
  "runner_activity_revisions",
  "runner_activity_source_revisions",
  "runner_activity_sources",
  "runner_activities",
  "runner_manual_workout_templates",
  "runner_entitlements",
  "runner_capability_usage",
]);

const LEASE_ROOT = ".tanstack/hito-running-qa-pool-leases";

export function requireQaPoolRole(value) {
  const role = String(value ?? "").trim();

  if (!Object.hasOwn(QA_TESTER_POOL, role)) {
    throw new Error(
      `Unknown QA pool role ${JSON.stringify(role)}. Expected one of: ${Object.keys(
        QA_TESTER_POOL,
      ).join(", ")}.`,
    );
  }

  return role;
}

export async function listAllAuthUsers(supabase) {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const result = await supabase.auth.admin.listUsers({ page, perPage });

    if (result.error) {
      throw new Error(result.error.message);
    }

    users.push(...result.data.users);

    if (result.data.users.length < perPage) {
      return users;
    }

    page += 1;
  }
}

export async function findAuthUserByEmail(supabase, email) {
  const normalizedEmail = normalizeEmail(email);
  const users = await listAllAuthUsers(supabase);
  return users.find((user) => normalizeEmail(user.email ?? "") === normalizedEmail) ?? null;
}

export async function getQaUserOwnedCounts(supabase, userId) {
  const entries = await Promise.all(
    QA_TEST_USER_OWNED_TABLES.map(async (table) => {
      const result = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (result.error) {
        throw new Error(`Unable to count ${table}: ${result.error.message}`);
      }

      return [table, result.count ?? 0];
    }),
  );

  return Object.fromEntries(entries);
}

export async function buildQaTestUserInventory({
  supabase,
  environment,
  target,
  localAccounts = [],
}) {
  const authUsers = await listAllAuthUsers(supabase);
  const users = [];

  for (const user of authUsers) {
    const classification = classifyQaIdentity(user);
    users.push({
      id: user.id,
      email: normalizeEmail(user.email ?? ""),
      classification: classification.kind,
      metadataBasis: classification.metadataBasis,
      poolRole: classification.poolRole,
      ownedRows: await getQaUserOwnedCounts(supabase, user.id),
    });
  }

  users.sort(compareIdentities);
  const authIds = new Set(users.map((user) => user.id));
  const authEmails = new Set(users.map((user) => user.email));
  const authByEmail = new Map(users.map((user) => [user.email, user]));
  const staleCredentials = localAccounts
    .filter(
      (account) =>
        account.role === "tester" &&
        !authIds.has(account.userId) &&
        !authEmails.has(normalizeEmail(account.email)),
    )
    .map((account) => ({
      username: account.username,
      email: normalizeEmail(account.email),
      userId: account.userId,
      metadataBasis: ["local_accounts_file:tester"],
    }))
    .sort(compareIdentities);
  const credentialDrift = localAccounts
    .map((account) => {
      const authUser = authByEmail.get(normalizeEmail(account.email));
      if (!authUser || authUser.id === account.userId) return null;
      return {
        username: account.username,
        email: normalizeEmail(account.email),
        registryUserId: account.userId,
        authUserId: authUser.id,
        registryRole: account.role,
        authClassification: authUser.classification,
      };
    })
    .filter(Boolean)
    .sort(compareIdentities);

  return {
    schemaVersion: 1,
    environment,
    target,
    totals: {
      authUsers: users.length,
      poolMembers: users.filter((user) => user.classification === "pool_member").length,
      cleanupCandidates: users.filter((user) => user.classification === "test_candidate").length,
      protectedAdmins: users.filter((user) => user.classification === "protected_admin").length,
      manualReview: users.filter((user) => user.classification === "manual_review").length,
      staleCredentials: staleCredentials.length,
      credentialDrift: credentialDrift.length,
    },
    users,
    staleCredentials,
    credentialDrift,
  };
}

export function buildQaCleanupManifest(inventory) {
  const candidates = inventory.users
    .filter((user) => user.classification === "test_candidate")
    .map((user) => ({
      id: user.id,
      email: user.email,
      metadataBasis: user.metadataBasis,
      ownedRows: user.ownedRows,
    }));
  const protectedIdentities = inventory.users
    .filter(
      (user) =>
        user.classification === "protected_admin" ||
        user.classification === "manual_review" ||
        user.classification === "pool_member",
    )
    .map((user) => ({
      id: user.id,
      email: user.email,
      classification: user.classification,
      metadataBasis: user.metadataBasis,
      poolRole: user.poolRole,
    }));
  const selection = {
    environment: inventory.environment,
    target: inventory.target,
    candidates,
    staleCredentials: inventory.staleCredentials,
    credentialDrift: inventory.credentialDrift,
  };

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    environment: inventory.environment,
    target: inventory.target,
    selectionHash: hashStableJson(selection),
    candidates,
    staleCredentials: inventory.staleCredentials,
    credentialDrift: inventory.credentialDrift,
    protectedIdentities,
    summary: {
      candidateAuthUsers: candidates.length,
      candidateOwnedRows: sumOwnedRows(candidates),
      staleCredentials: inventory.staleCredentials.length,
      credentialDrift: inventory.credentialDrift.length,
      protectedIdentities: protectedIdentities.length,
    },
  };
}

export function assertQaCleanupManifestMatches(expected, actual) {
  if (expected.environment !== actual.environment) {
    throw new Error("Cleanup manifest environment drifted.");
  }
  if (stableJson(expected.target) !== stableJson(actual.target)) {
    throw new Error("Cleanup manifest target drifted.");
  }
  if (expected.selectionHash !== actual.selectionHash) {
    throw new Error(
      "Cleanup candidates drifted after dry-run; generate and review a new manifest.",
    );
  }
}

export async function ensureQaPoolAuthUser({ supabase, role, password }) {
  const poolRole = requireQaPoolRole(role);
  const definition = QA_TESTER_POOL[poolRole];
  const existing = await findAuthUserByEmail(supabase, definition.email);

  if (existing) {
    const classification = classifyQaIdentity(existing);

    if (classification.kind === "protected_admin" || classification.kind === "manual_review") {
      throw new Error(`Refusing to adopt non-test identity ${definition.email} into the QA pool.`);
    }
    if (classification.poolRole && classification.poolRole !== poolRole) {
      throw new Error(
        `QA pool identity ${definition.email} is already assigned to ${classification.poolRole}.`,
      );
    }

    const nextMetadata = buildPoolAppMetadata(existing.app_metadata, poolRole);
    const update = await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: nextMetadata,
      ...(password ? { password } : {}),
    });

    if (update.error || !update.data.user) {
      throw new Error(update.error?.message ?? `Unable to update ${definition.email}.`);
    }

    return update.data.user;
  }

  const created = await supabase.auth.admin.createUser({
    email: definition.email,
    email_confirm: true,
    ...(password ? { password } : {}),
    app_metadata: buildPoolAppMetadata({}, poolRole),
    user_metadata: {
      display_name: definition.displayName,
      local_username: definition.username,
    },
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? `Unable to create ${definition.email}.`);
  }

  return created.data.user;
}

export async function adoptHostedQaPoolAuthUser({
  supabase,
  role,
  userId,
  requiredEmailSuffix = ".invalid",
}) {
  const poolRole = requireQaPoolRole(role);
  const result = await supabase.auth.admin.getUserById(userId);
  if (result.error || !result.data.user) {
    throw new Error(result.error?.message ?? `QA pool user ${userId} was not found.`);
  }
  const user = result.data.user;
  const email = normalizeEmail(user.email ?? "");
  if (!email.endsWith(requiredEmailSuffix)) {
    throw new Error(`Hosted QA pool adoption requires a ${requiredEmailSuffix} identity.`);
  }
  const classification = classifyQaIdentity(user);
  if (classification.kind === "protected_admin" || classification.kind === "manual_review") {
    throw new Error("Refusing to adopt a non-test hosted identity into the QA pool.");
  }
  if (classification.poolRole && classification.poolRole !== poolRole) {
    throw new Error(`Hosted QA identity is already assigned to ${classification.poolRole}.`);
  }

  const update = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata ?? {}),
      hito_test_user: true,
      hito_qa_pool_version: QA_TESTER_POOL_VERSION,
      hito_qa_pool_role: poolRole,
    },
  });
  if (update.error || !update.data.user) {
    throw new Error(update.error?.message ?? "Unable to adopt the hosted QA pool identity.");
  }
  return update.data.user;
}

export async function assertQaPoolAuthUser({ supabase, role, userId }) {
  const poolRole = requireQaPoolRole(role);
  const result = await supabase.auth.admin.getUserById(userId);

  if (result.error || !result.data.user) {
    throw new Error(result.error?.message ?? `QA pool user ${userId} was not found.`);
  }

  const classification = classifyQaIdentity(result.data.user);

  if (classification.kind !== "pool_member" || classification.poolRole !== poolRole) {
    throw new Error(`Auth user ${userId} is not the ${poolRole} QA pool identity.`);
  }

  return result.data.user;
}

export async function resetQaPoolUserData({
  supabase,
  userId,
  preserveProfile = false,
  preserveAiPlanGenerationResponseIds = [],
}) {
  const [assets, activitySourceRevisions] = await Promise.all([
    listQaOwnedRows(supabase, "workout_result_assets", "storage_bucket, storage_path", userId),
    listQaOwnedRows(
      supabase,
      "runner_activity_source_revisions",
      "raw_storage_bucket, raw_storage_path",
      userId,
    ),
  ]);

  const assetsByBucket = new Map();
  for (const asset of assets) {
    if (!asset.storage_bucket || !asset.storage_path) {
      continue;
    }
    const paths = assetsByBucket.get(asset.storage_bucket) ?? [];
    paths.push(asset.storage_path);
    assetsByBucket.set(asset.storage_bucket, paths);
  }
  for (const revision of activitySourceRevisions) {
    if (!revision.raw_storage_bucket || !revision.raw_storage_path) {
      continue;
    }
    const paths = assetsByBucket.get(revision.raw_storage_bucket) ?? [];
    paths.push(revision.raw_storage_path);
    assetsByBucket.set(revision.raw_storage_bucket, paths);
  }
  for (const [bucket, paths] of assetsByBucket) {
    for (const pathBatch of chunks(Array.from(new Set(paths)), 1000)) {
      const removed = await supabase.storage.from(bucket).remove(pathBatch);
      if (removed.error) {
        throw new Error(`Unable to remove QA storage assets: ${removed.error.message}`);
      }
    }
  }

  for (const table of [
    // Unplanned Garmin intake is not deleted by a plan-cycle cascade.
    "workout_result_assets",
    "ai_plan_generation_responses",
    "runner_activity_metric_snapshots",
    "runner_activity_metric_observations",
    "runner_activity_evidence_revisions",
    "runner_activity_fact_snapshots",
    "runner_activities",
    "planned_workouts",
    "calendar_workout_mutation_events",
    "plan_cycles",
    "runner_manual_workout_templates",
    "runner_capability_usage",
    "runner_entitlements",
  ]) {
    let deletion;
    if (table === "ai_plan_generation_responses" && preserveAiPlanGenerationResponseIds.length) {
      const existing = await supabase.from(table).select("id").eq("user_id", userId);
      if (existing.error) {
        throw new Error(`Unable to inspect ${table}: ${existing.error.message}`);
      }
      const preserve = new Set(preserveAiPlanGenerationResponseIds);
      const removableIds = (existing.data ?? [])
        .map((row) => row.id)
        .filter((id) => !preserve.has(id));
      deletion = removableIds.length
        ? await supabase.from(table).delete().eq("user_id", userId).in("id", removableIds)
        : { error: null };
    } else {
      deletion = await supabase.from(table).delete().eq("user_id", userId);
    }
    if (deletion.error) {
      throw new Error(`Unable to reset ${table}: ${deletion.error.message}`);
    }
  }

  if (!preserveProfile) {
    const profileDelete = await supabase.from("runner_profiles").delete().eq("user_id", userId);
    if (profileDelete.error) {
      throw new Error(`Unable to reset runner_profiles: ${profileDelete.error.message}`);
    }
  }

  return getQaUserOwnedCounts(supabase, userId);
}

async function listQaOwnedRows(supabase, table, columns, userId) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const page = await supabase
      .from(table)
      .select(`id, ${columns}`)
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (page.error) throw new Error(page.error.message);
    rows.push(...(page.data ?? []));
    if ((page.data?.length ?? 0) < pageSize) return rows;
  }
}

function chunks(values, size) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );
}

export async function acquireQaPoolLease({ role, cwd = process.cwd() }) {
  const poolRole = requireQaPoolRole(role);
  const leaseRoot = path.resolve(cwd, LEASE_ROOT);
  const leasePath = path.join(leaseRoot, `${poolRole}.lock`);
  const token = randomUUID();

  await mkdir(leaseRoot, { recursive: true, mode: 0o700 });

  try {
    await mkdir(leasePath, { mode: 0o700 });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "EEXIST") {
      throw new Error(
        `QA pool role ${poolRole} is already leased. Run inventory before clearing a stale lease.`,
      );
    }
    throw error;
  }

  try {
    await writeFile(
      path.join(leasePath, "lease.json"),
      `${JSON.stringify(
        {
          role: poolRole,
          token,
          pid: process.pid,
          acquiredAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  } catch (error) {
    // Never leave an ownerless directory that blocks the reusable QA pool.
    await rm(leasePath, { recursive: true, force: true });
    throw error;
  }

  return { role: poolRole, token, leasePath };
}

export async function releaseQaPoolLease({ role, token, cwd = process.cwd() }) {
  const poolRole = requireQaPoolRole(role);
  const leasePath = path.resolve(cwd, LEASE_ROOT, `${poolRole}.lock`);
  const lease = JSON.parse(await readFile(path.join(leasePath, "lease.json"), "utf8"));

  if (lease.role !== poolRole || lease.token !== token) {
    throw new Error(`QA pool lease token mismatch for ${poolRole}.`);
  }

  await rm(leasePath, { recursive: true });
}

export async function assertQaPoolLease({ role, token, cwd = process.cwd() }) {
  const poolRole = requireQaPoolRole(role);
  const leasePath = path.resolve(cwd, LEASE_ROOT, `${poolRole}.lock`);
  const lease = JSON.parse(await readFile(path.join(leasePath, "lease.json"), "utf8"));
  if (lease.role !== poolRole || lease.token !== token) {
    throw new Error(`QA pool lease token mismatch for ${poolRole}.`);
  }
  return { role: poolRole, token, leasePath };
}

export async function readQaPoolLeases({ cwd = process.cwd() } = {}) {
  const leases = [];

  for (const role of Object.keys(QA_TESTER_POOL)) {
    const leasePath = path.resolve(cwd, LEASE_ROOT, `${role}.lock`, "lease.json");
    try {
      const lease = JSON.parse(await readFile(leasePath, "utf8"));
      leases.push({
        role,
        pid: lease.pid ?? null,
        acquiredAt: lease.acquiredAt ?? null,
      });
    } catch (error) {
      if (!error || typeof error !== "object" || error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return leases;
}

export function poolLocalAccount(role, password, userId) {
  const poolRole = requireQaPoolRole(role);
  const definition = QA_TESTER_POOL[poolRole];

  return {
    username: definition.username,
    password,
    email: definition.email,
    userId,
    role: "tester",
    displayName: definition.displayName,
  };
}

export function classifyQaIdentity(user) {
  const appMetadata = user.app_metadata ?? {};
  const actorClassification = classifyActor({
    email: user.email ?? null,
    appMetadata,
  });
  const poolRole =
    appMetadata.hito_qa_pool_version === QA_TESTER_POOL_VERSION &&
    typeof appMetadata.hito_qa_pool_role === "string" &&
    Object.hasOwn(QA_TESTER_POOL, appMetadata.hito_qa_pool_role)
      ? appMetadata.hito_qa_pool_role
      : null;

  if (
    actorClassification.classification === "local_admin" ||
    actorClassification.classification === "supabase_admin"
  ) {
    return {
      kind: "protected_admin",
      poolRole: null,
      metadataBasis: [`app_metadata:${actorClassification.classificationReason}`],
    };
  }

  if (poolRole) {
    return {
      kind: "pool_member",
      poolRole,
      metadataBasis: [
        `app_metadata:hito_qa_pool_version=${QA_TESTER_POOL_VERSION}`,
        `app_metadata:hito_qa_pool_role=${poolRole}`,
      ],
    };
  }

  const testMetadata = [];
  if (appMetadata.hito_test_user === true) {
    testMetadata.push("app_metadata:hito_test_user=true");
  }
  if (normalizeMetadataString(appMetadata.hito_local_role) === "tester") {
    testMetadata.push("app_metadata:hito_local_role=tester");
  }
  if (appMetadata.hito_disposable === true) {
    testMetadata.push("app_metadata:hito_disposable=true");
  }

  if (testMetadata.length > 0) {
    return {
      kind: "test_candidate",
      poolRole: null,
      metadataBasis: testMetadata,
    };
  }

  return {
    kind: "manual_review",
    poolRole: null,
    metadataBasis: [
      `${actorClassification.classificationSource}:${actorClassification.classificationReason}`,
    ],
  };
}

function buildPoolAppMetadata(currentMetadata, role) {
  return {
    ...(currentMetadata ?? {}),
    hito_local_bypass: true,
    hito_local_role: "tester",
    hito_test_user: true,
    hito_qa_pool_version: QA_TESTER_POOL_VERSION,
    hito_qa_pool_role: role,
  };
}

function sumOwnedRows(candidates) {
  return candidates.reduce(
    (total, candidate) =>
      total + Object.values(candidate.ownedRows).reduce((subtotal, count) => subtotal + count, 0),
    0,
  );
}

function hashStableJson(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareIdentities(left, right) {
  return String(left.email ?? left.username ?? left.id).localeCompare(
    String(right.email ?? right.username ?? right.id),
  );
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeMetadataString(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}
