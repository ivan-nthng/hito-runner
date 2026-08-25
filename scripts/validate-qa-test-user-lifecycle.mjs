import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { tsImport } from "tsx/esm/api";
import {
  QA_TEST_USER_OWNED_TABLES,
  QA_TESTER_POOL,
  QA_TESTER_POOL_VERSION,
  acquireQaPoolLease,
  adoptHostedQaPoolAuthUser,
  assertQaCleanupManifestMatches,
  buildQaCleanupManifest,
  classifyQaIdentity,
  releaseQaPoolLease,
} from "./lib/qa-test-user-lifecycle.mjs";

const { deleteAdminLocalTestAccountForDependencies, getAdminLocalTestAccountsForDependencies } =
  await tsImport("../src/lib/admin-local-test-accounts.server.ts", import.meta.url);
const { readLocalAuthAccountsFile } = await tsImport("../src/lib/local-auth.ts", import.meta.url);
const { readLocalAuthAccountRegistry, writeLocalAuthAccountRegistry } = await tsImport(
  "../src/lib/local-auth-account-registry.server.ts",
  import.meta.url,
);

const target = { origin: "http://127.0.0.1:54321", loopback: true };
const zeroRows = Object.fromEntries(QA_TEST_USER_OWNED_TABLES.map((table) => [table, 0]));

const maskedHostedInventory = spawnSync(
  process.execPath,
  [
    "scripts/test-user.mjs",
    "adaptive-ui-replay-status",
    "--trusted-hosted-project-ref",
    "abcdefghijklmnopqrst",
    "--user-id",
    "00000000-0000-4000-8000-000000000001",
    "--api-key-inventory-stdin",
    "true",
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
    },
    encoding: "utf8",
    input: JSON.stringify([
      { type: "secret", api_key: "sb_secret_REDACTED-VALUE", prefix: "sb_secret_fake" },
      {
        type: "publishable",
        api_key: "sb_publishable_REDACTED-VALUE",
        prefix: "sb_publishable_fake",
      },
    ]),
  },
);
assert.notEqual(maskedHostedInventory.status, 0);
assert.match(maskedHostedInventory.stderr, /secret-key class is unavailable/);
assert.doesNotMatch(maskedHostedInventory.stderr, /REDACTED-VALUE/);

assert.equal(
  classifyQaIdentity(user("admin", { hito_local_role: "admin", hito_test_user: true })).kind,
  "protected_admin",
);
assert.equal(classifyQaIdentity(user("tester", { hito_test_user: true })).kind, "test_candidate");
assert.equal(classifyQaIdentity(user("legacy", { hito_disposable: true })).kind, "test_candidate");
assert.equal(classifyQaIdentity(user("email-only", {})).kind, "manual_review");
assert.deepEqual(
  classifyQaIdentity(
    user("pool", {
      hito_test_user: true,
      hito_qa_pool_version: QA_TESTER_POOL_VERSION,
      hito_qa_pool_role: "provider-engine",
    }),
  ),
  {
    kind: "pool_member",
    poolRole: "provider-engine",
    metadataBasis: [
      `app_metadata:hito_qa_pool_version=${QA_TESTER_POOL_VERSION}`,
      "app_metadata:hito_qa_pool_role=provider-engine",
    ],
  },
);

let adoptedHostedMetadata = null;
const adoptedHosted = await adoptHostedQaPoolAuthUser({
  supabase: {
    auth: {
      admin: {
        async getUserById() {
          return {
            error: null,
            data: {
              user: user(
                "hosted-adaptive",
                {
                  hito_test_user: true,
                  hito_qa_pool_role: "adaptive-training-quality",
                },
                "qa-hito271@hito.invalid",
              ),
            },
          };
        },
        async updateUserById(_id, update) {
          adoptedHostedMetadata = update.app_metadata;
          return {
            error: null,
            data: {
              user: user("hosted-adaptive", update.app_metadata, "qa-hito271@hito.invalid"),
            },
          };
        },
      },
    },
  },
  role: "adaptive-training-quality",
  userId: "hosted-adaptive",
});
assert.equal(adoptedHosted.email, "qa-hito271@hito.invalid");
assert.equal(adoptedHostedMetadata.hito_qa_pool_version, QA_TESTER_POOL_VERSION);
assert.equal(adoptedHostedMetadata.hito_qa_pool_role, "adaptive-training-quality");
assert.equal(adoptedHostedMetadata.hito_local_bypass, undefined);
await assert.rejects(
  adoptHostedQaPoolAuthUser({
    supabase: {
      auth: {
        admin: {
          async getUserById() {
            return {
              error: null,
              data: { user: user("wrong-domain", { hito_test_user: true }) },
            };
          },
        },
      },
    },
    role: "adaptive-training-quality",
    userId: "wrong-domain",
  }),
  /requires a \.invalid identity/,
);
assert.deepEqual(
  classifyQaIdentity(
    user("adaptive-quality", {
      hito_test_user: true,
      hito_qa_pool_version: QA_TESTER_POOL_VERSION,
      hito_qa_pool_role: "adaptive-training-quality",
    }),
  ),
  {
    kind: "pool_member",
    poolRole: "adaptive-training-quality",
    metadataBasis: [
      `app_metadata:hito_qa_pool_version=${QA_TESTER_POOL_VERSION}`,
      "app_metadata:hito_qa_pool_role=adaptive-training-quality",
    ],
  },
);

const inventory = {
  schemaVersion: 1,
  environment: "local",
  target,
  users: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      email: "candidate@local.test",
      classification: "test_candidate",
      metadataBasis: ["app_metadata:hito_test_user=true"],
      poolRole: null,
      ownedRows: zeroRows,
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      email: "admin@local.test",
      classification: "protected_admin",
      metadataBasis: ["app_metadata:supabase_local_admin"],
      poolRole: null,
      ownedRows: zeroRows,
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      email: "unknown@example.com",
      classification: "manual_review",
      metadataBasis: ["none:no_test_signal"],
      poolRole: null,
      ownedRows: zeroRows,
    },
  ],
  staleCredentials: [],
  credentialDrift: [],
};
const manifest = buildQaCleanupManifest(inventory);
assert.equal(manifest.candidates.length, 1);
assert.equal(manifest.protectedIdentities.length, 2);
assertQaCleanupManifestMatches(manifest, buildQaCleanupManifest(inventory));

const drifted = buildQaCleanupManifest({
  ...inventory,
  users: inventory.users.filter((candidate) => candidate.classification !== "test_candidate"),
});
assert.throws(
  () => assertQaCleanupManifestMatches(manifest, drifted),
  /Cleanup candidates drifted/,
);

const leaseCwd = await mkdtemp(path.join(os.tmpdir(), "hito-qa-pool-"));
try {
  const lease = await acquireQaPoolLease({ role: "provider-engine", cwd: leaseCwd });
  await assert.rejects(
    acquireQaPoolLease({ role: "provider-engine", cwd: leaseCwd }),
    /already leased/,
  );
  await assert.rejects(
    releaseQaPoolLease({
      role: "provider-engine",
      token: "wrong-token",
      cwd: leaseCwd,
    }),
    /token mismatch/,
  );
  await releaseQaPoolLease({
    role: "provider-engine",
    token: lease.token,
    cwd: leaseCwd,
  });
} finally {
  await rm(leaseCwd, { recursive: true, force: true });
}

const registryCwd = await mkdtemp(path.join(os.tmpdir(), "hito-local-auth-registry-"));
try {
  const legacyFile = path.join(registryCwd, "legacy.json");
  await writeAccountsFile(legacyFile, [
    { username: " IVAN ", password: "local-only" },
    { username: "runner", password: "local-only" },
  ]);
  const canonical = await readLocalAuthAccountRegistry(legacyFile);
  const runtime = await readLocalAuthAccountsFile(legacyFile);
  assert.deepEqual(runtime, canonical);
  assert.equal(canonical[0].role, "admin");
  assert.equal(canonical[0].userIdSource, "derived");
  assert.equal(canonical[1].role, "tester");

  const writtenFile = path.join(registryCwd, "written.json");
  await writeLocalAuthAccountRegistry(writtenFile, canonical);
  const persisted = JSON.parse(await readFile(writtenFile, "utf8"));
  assert.equal("userIdSource" in persisted.accounts[0], false);

  const invalidFile = path.join(registryCwd, "invalid.json");
  await writeFile(invalidFile, JSON.stringify({ accounts: [{ username: "missing-password" }] }));
  await assert.rejects(readLocalAuthAccountRegistry(invalidFile));
} finally {
  await rm(registryCwd, { recursive: true, force: true });
}

const adminFacadeCwd = await mkdtemp(path.join(os.tmpdir(), "hito-qa-admin-facade-"));
try {
  const poolFile = path.join(adminFacadeCwd, "pool.json");
  await writeAccountsFile(poolFile, [
    localAccount("pool", "pool@local.test", "00000000-0000-4000-8000-000000000011"),
  ]);
  const poolDeletes = [];
  const poolDependencies = adminDependencies(
    poolFile,
    {
      id: "00000000-0000-4000-8000-000000000011",
      email: "pool@local.test",
      appMetadata: {
        hito_test_user: true,
        hito_qa_pool_version: QA_TESTER_POOL_VERSION,
        hito_qa_pool_role: "provider-engine",
      },
    },
    poolDeletes,
  );
  const poolList = await getAdminLocalTestAccountsForDependencies(poolDependencies);
  assert.equal(poolList.ok, true);
  assert.equal(poolList.accounts[0].deletable, false);
  const poolDelete = await deleteAdminLocalTestAccountForDependencies(
    { email: "pool@local.test", confirmEmail: "pool@local.test" },
    poolDependencies,
  );
  assert.deepEqual(poolDelete, {
    ok: false,
    reason: "protected_account",
    message: "Protected admin and reusable QA pool accounts cannot be deleted here.",
  });
  assert.deepEqual(poolDeletes, []);

  const adminFile = path.join(adminFacadeCwd, "metadata-admin.json");
  await writeAccountsFile(adminFile, [
    localAccount(
      "metadata-admin",
      "metadata-admin@local.test",
      "00000000-0000-4000-8000-000000000012",
    ),
  ]);
  const adminDeletes = [];
  const metadataAdminDelete = await deleteAdminLocalTestAccountForDependencies(
    {
      email: "metadata-admin@local.test",
      confirmEmail: "metadata-admin@local.test",
    },
    adminDependencies(
      adminFile,
      {
        id: "00000000-0000-4000-8000-000000000012",
        email: "metadata-admin@local.test",
        appMetadata: { hito_admin: true, hito_test_user: true },
      },
      adminDeletes,
    ),
  );
  assert.equal(metadataAdminDelete.ok, false);
  assert.equal(metadataAdminDelete.reason, "protected_account");
  assert.deepEqual(adminDeletes, []);

  const testerFile = path.join(adminFacadeCwd, "tester.json");
  await writeAccountsFile(testerFile, [
    localAccount("tester", "tester@local.test", "00000000-0000-4000-8000-000000000013"),
  ]);
  const testerDeletes = [];
  const testerDelete = await deleteAdminLocalTestAccountForDependencies(
    { email: "tester@local.test", confirmEmail: "tester@local.test" },
    adminDependencies(
      testerFile,
      {
        id: "00000000-0000-4000-8000-000000000013",
        email: "tester@local.test",
        appMetadata: { hito_test_user: true },
      },
      testerDeletes,
    ),
  );
  assert.equal(testerDelete.ok, true);
  assert.deepEqual(testerDeletes, ["00000000-0000-4000-8000-000000000013"]);
  assert.deepEqual(JSON.parse(await readFile(testerFile, "utf8")).accounts, []);
} finally {
  await rm(adminFacadeCwd, { recursive: true, force: true });
}

const randomLifecycleSource = await readFile(
  path.resolve("scripts/lib/qa-pool-persistence-proof.ts"),
  "utf8",
);
assert.doesNotMatch(
  randomLifecycleSource,
  /Date\.now\(|Math\.random\(|createDisposableSupabaseUser/,
);
assert.deepEqual(Object.keys(QA_TESTER_POOL), [
  "camelot",
  "baseline-no-plan",
  "saved-plan-readback",
  "provider-engine",
  "adaptive-training-quality",
  "isolation-a",
  "isolation-b",
]);

const [
  testUserSource,
  adaptiveFixtureSource,
  packageSource,
  lifecycleContract,
  runningPlanEngineSource,
  activePlanActionsSource,
] = await Promise.all([
  readFile(path.resolve("scripts/test-user.mjs"), "utf8"),
  readFile(path.resolve("scripts/lib/runner-design-profile-fixture.ts"), "utf8"),
  readFile(path.resolve("package.json"), "utf8"),
  readFile(path.resolve("docs/process/test-user-lifecycle.md"), "utf8"),
  readFile(path.resolve("src/lib/running-plan-engine-actions.ts"), "utf8"),
  readFile(path.resolve("src/lib/active-plan-persistence.ts"), "utf8"),
]);
for (const command of [
  "adaptive-ui-replay-seed",
  "adaptive-ui-replay-status",
  "adaptive-ui-replay-reset",
]) {
  assert.match(testUserSource, new RegExp(`command === "${command}"`));
  assert.match(packageSource, new RegExp(command));
}
assert.doesNotMatch(testUserSource, /hosted-pool-/);
assert.doesNotMatch(testUserSource, /generateLink\(|hashed_token|magiclink/);
assert.match(adaptiveFixtureSource, /adaptive_engine_ui_replay_v1/);
for (const checkpoint of ["initial_plan_review", "continuation_actions", "complete_surface"]) {
  assert.match(adaptiveFixtureSource, new RegExp(`"${checkpoint}"`));
}
assert.match(testUserSource, /--checkpoint must be one of/);
assert.match(testUserSource, /synthetic_fit_upload_input/);
assert.match(testUserSource, /interactionArtifactRemoved: true/);
assert.match(adaptiveFixtureSource, /externalProviderDispatchCount:\s*0/);
assert.match(adaptiveFixtureSource, /hito271SealedLineageRestored:\s*false/);
assert.match(adaptiveFixtureSource, /initialCandidateOwner:\s*"saved_plan_generated_review"/);
assert.match(adaptiveFixtureSource, /listSavedPlanReviewsForUser/);
assert.match(adaptiveFixtureSource, /restoreSavedPlanReviewForUser/);
assert.match(testUserSource, /initialCandidatePreseeded:\s*Boolean\(savedPlanReview\)/);
assert.match(runningPlanEngineSource, /export const listSavedPlanReviews/);
assert.match(runningPlanEngineSource, /export const restoreSavedPlanReview/);
assert.match(
  runningPlanEngineSource,
  /normalizeRunningPlanReviewDraftForConfirmation\(state\.draft\)/,
);
assert.match(runningPlanEngineSource, /addRunningPlanReviewProof\(confirmableDraft\)/);
assert.match(
  runningPlanEngineSource,
  /previewInput:\s*runningPlanReviewedPreviewInputSchema\.parse\(draft\.previewInput\)/,
);
assert.match(activePlanActionsSource, /\.from\("plan_cycles"\)/);
assert.doesNotMatch(activePlanActionsSource, /adaptive_training_detailed_candidates/);
assert.match(lifecycleContract, /single deterministic, provider-free source/);
assert.match(
  lifecycleContract,
  /Local `adaptive-blueprint-\*` commands remain focused Backend proofs/,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      poolRoles: Object.keys(QA_TESTER_POOL),
      metadataAuthority: "app_metadata",
      adminWinsConflicts: true,
      emailOnlyRemainsManualReview: true,
      manifestDriftRefused: true,
      leaseCollisionRefused: true,
      canonicalLocalAuthRegistry: true,
      adminFacadePoolDeletionRefused: true,
      adminMetadataWinsLocalTesterConflict: true,
      randomIdentityLifecycleRemoved: true,
      adaptiveUiReplayFixtureVersion: "adaptive_engine_ui_replay_v1",
      adaptiveUiReplayCheckpointSelector: 1,
      adaptiveUiReplayCheckpoints: 3,
      adaptiveUiReplayHostedCommandFamily: 1,
      supersededHostedPoolCommands: 0,
      alternateHostedAuthBootstrapPaths: 0,
    },
    null,
    2,
  ),
);

function user(id, appMetadata, email = `${id}@local.test`) {
  return {
    id,
    email,
    app_metadata: appMetadata,
  };
}

function adminDependencies(accountsFilePath, authUser, deletions) {
  return {
    auth: {
      userId: "00000000-0000-4000-8000-000000000099",
      email: "admin@local.test",
      appBaseUrl: "http://127.0.0.1:3000",
      provider: "admin",
      adminSession: {
        label: "Local admin",
        source: "local_fixture",
        runtimeClass: "loopback",
      },
    },
    runtimeUrl: "http://127.0.0.1:3000",
    localAuthBypassEnabled: true,
    accountsFilePath,
    supabaseAdmin: {
      async findAuthUserByEmail(email) {
        return email === authUser.email ? authUser : null;
      },
      async deleteAuthUser(userId) {
        deletions.push(userId);
      },
    },
  };
}

function localAccount(username, email, userId) {
  return {
    username,
    password: "local-only",
    email,
    userId,
    role: "tester",
    displayName: username,
  };
}

async function writeAccountsFile(filePath, accounts) {
  await writeFile(filePath, `${JSON.stringify({ accounts }, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}
