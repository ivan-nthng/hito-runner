import assert from "node:assert/strict";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
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

const { retainImportedPlanCandidateForUser } = await tsImport(
  "../src/lib/active-plan-persistence.ts",
  import.meta.url,
);
const { buildImportedPlanSeed, importedPlanSchema } = await tsImport(
  "../src/lib/imported-plan.ts",
  import.meta.url,
);
const { confirmWorkoutCommandForUser, reviewWorkoutCommandForUser } = await tsImport(
  "../src/lib/manual-workout-authoring/actions.ts",
  import.meta.url,
);
const { digestSha256Hex, stableJsonStringify } = await tsImport(
  "../src/lib/review-token-signing.ts",
  import.meta.url,
);
const { isLoopbackRuntimeUrl } = await tsImport("../src/lib/supabase/env.ts", import.meta.url);
const { getLatestWorkoutResultFeedback } = await tsImport(
  "../src/lib/workout-result-import/read-workout-result-feedback.ts",
  import.meta.url,
);
const { ingestLocalQaFixtureWorkoutResult, removeWorkoutResultEvidence } = await tsImport(
  "../src/lib/workout-result-import/ingest-garmin-result.ts",
  import.meta.url,
);
const {
  ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
  ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
  RUNNER_CORE_FILE_FLOW_FIXTURE_ROLE,
  RUNNER_CORE_FILE_FLOW_FIXTURE_TEMPLATE,
  RUNNER_DESIGN_PROFILE_FIXTURE_ROLE,
  RUNNER_DESIGN_PROFILE_FIXTURE_STORAGE_BUCKET,
  RUNNER_DESIGN_PROFILE_FIXTURE_VERSION,
  confirmAdaptiveBlueprintContinuationFixture,
  confirmAdaptiveBlueprintContinuationProfileFixture,
  preflightAdaptiveBlueprintSecondContinuationFixture,
  authorAdaptiveBlueprintSecondContinuationFixture,
  recompileAdaptiveBlueprintSecondContinuationFixture,
  prepareAdaptiveBlueprintContinuationCandidateFixture,
  readAdaptiveBlueprintProjectionFixture,
  readRunnerCoreFileFlowFixture,
  readRunnerDesignProfileFixture,
  seedAdaptiveBlueprintProjectionFixture,
  seedRunnerCoreFileFlowFixture,
  seedRunnerDesignProfileFixture,
  verifyRunnerDesignProfileFixtureRuntime,
  withLocalDesignFixtureEnv,
} = await tsImport("./lib/runner-design-profile-fixture.ts", import.meta.url);

const {
  DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
  normalizeLocalAuthAccount,
  readLocalAuthAccountRegistry,
  writeLocalAuthAccountRegistry,
} = await tsImport("../src/lib/local-auth-account-registry.server.ts", import.meta.url);

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
    "pool-reset-plan",
    "pool-reset",
    "pool-delete",
    "design-profile-seed",
    "design-profile-status",
    "design-profile-reset",
    "adaptive-blueprint-seed",
    "adaptive-blueprint-continuation-seed",
    "adaptive-blueprint-status",
    "adaptive-blueprint-continuation-proof",
    "adaptive-blueprint-continuation-profile-proof",
    "adaptive-blueprint-continuation-prepare",
    "adaptive-blueprint-two-profile-replay",
    "adaptive-blueprint-second-continuation-preflight",
    "adaptive-blueprint-second-continuation-author",
    "adaptive-blueprint-second-continuation-recompile",
    "adaptive-blueprint-reset",
    "runner-core-file-flow-seed",
    "runner-core-file-flow-proof",
  ].includes(command)
) {
  throw new Error(
    "Usage: npm run test-user -- <inventory|cleanup-manifest|cleanup-apply|pool-ensure|pool-reset-plan|pool-reset|pool-delete|design-profile-seed|design-profile-status|design-profile-reset|adaptive-blueprint-seed|adaptive-blueprint-continuation-seed|adaptive-blueprint-status|adaptive-blueprint-continuation-prepare|adaptive-blueprint-continuation-proof|adaptive-blueprint-continuation-profile-proof|adaptive-blueprint-two-profile-replay|adaptive-blueprint-second-continuation-preflight|adaptive-blueprint-second-continuation-author|adaptive-blueprint-second-continuation-recompile|adaptive-blueprint-reset|runner-core-file-flow-seed|runner-core-file-flow-proof|create|reset-plan|reset|delete> [options]",
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
} else if (command === "pool-reset-plan") {
  await handlePoolReset({ preserveProfile: true });
} else if (command === "pool-reset") {
  await handlePoolReset();
} else if (command === "pool-delete") {
  await handlePoolDelete();
} else if (command === "design-profile-seed") {
  await handleDesignProfileSeed();
} else if (command === "design-profile-status") {
  await handleDesignProfileStatus();
} else if (command === "design-profile-reset") {
  await handleDesignProfileReset();
} else if (command === "adaptive-blueprint-seed") {
  await handleAdaptiveBlueprintSeed();
} else if (command === "adaptive-blueprint-continuation-seed") {
  await handleAdaptiveBlueprintSeed({ continuationProof: true });
} else if (command === "adaptive-blueprint-status") {
  await handleAdaptiveBlueprintStatus();
} else if (command === "adaptive-blueprint-continuation-proof") {
  await handleAdaptiveBlueprintContinuationProof();
} else if (command === "adaptive-blueprint-continuation-profile-proof") {
  await handleAdaptiveBlueprintContinuationProfileProof();
} else if (command === "adaptive-blueprint-continuation-prepare") {
  await handleAdaptiveBlueprintContinuationPrepare();
} else if (command === "adaptive-blueprint-two-profile-replay") {
  await handleAdaptiveBlueprintTwoProfileReplay();
} else if (command === "adaptive-blueprint-second-continuation-preflight") {
  await handleAdaptiveBlueprintSecondContinuationPreflight();
} else if (command === "adaptive-blueprint-second-continuation-author") {
  await handleAdaptiveBlueprintSecondContinuationAuthor();
} else if (command === "adaptive-blueprint-second-continuation-recompile") {
  await handleAdaptiveBlueprintSecondContinuationRecompile();
} else if (command === "adaptive-blueprint-reset") {
  await handleFixtureReset({
    action: "adaptive-blueprint-reset",
    role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
    storageVersion: ADAPTIVE_BLUEPRINT_PROJECTION_FIXTURE_VERSION,
  });
} else if (command === "runner-core-file-flow-seed") {
  await handleRunnerCoreFileFlowSeed();
} else if (command === "runner-core-file-flow-proof") {
  await handleRunnerCoreFileFlowProof();
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

async function handleDesignProfileSeed() {
  await withDesignProfileLease(async () => {
    const authUser = await ensureDesignProfilePoolUser();
    const beforeCounts = await getQaUserOwnedCounts(supabase, authUser.id);
    await resetQaPoolUserData({ supabase, userId: authUser.id });
    let fixture;
    try {
      fixture = await seedRunnerDesignProfileFixture({
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
          action: "design-profile-seed",
          localOnly: true,
          login: {
            username: QA_TESTER_POOL[RUNNER_DESIGN_PROFILE_FIXTURE_ROLE].username,
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

async function handleAdaptiveBlueprintSeed({ continuationProof = false } = {}) {
  await withAdaptiveTrainingQualityLease(async () => {
    const authUser = await ensureQaPoolUserWithLocalAccount(ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE);
    const beforeCounts = await getQaUserOwnedCounts(supabase, authUser.id);
    await resetQaPoolUserData({ supabase, userId: authUser.id });
    let fixture;
    try {
      fixture = await seedAdaptiveBlueprintProjectionFixture({
        supabase,
        userId: authUser.id,
        asOfDate: options["as-of-date"],
        continuationProof,
      });
    } catch (error) {
      await resetQaPoolUserData({ supabase, userId: authUser.id });
      throw error;
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: continuationProof
            ? "adaptive-blueprint-continuation-seed"
            : "adaptive-blueprint-seed",
          localOnly: true,
          login: {
            username: QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE].username,
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

async function handleAdaptiveBlueprintStatus() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    const fixture = await readAdaptiveBlueprintProjectionFixture({
      supabase,
      userId: authUser.id,
      asOfDate: options["as-of-date"],
    });
    const accounts = await loadLocalAccounts();
    const localAccount = accounts.find((account) => account.email === definition.email) ?? null;
    if (!localAccount) {
      throw new Error(`Local login account ${definition.email} was not found.`);
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-status",
          localOnly: true,
          login: {
            username: localAccount.username,
            path: "http://127.0.0.1:3000/login",
          },
          fixture,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleAdaptiveBlueprintContinuationProof() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    const fixture = await confirmAdaptiveBlueprintContinuationFixture({
      supabase,
      userId: authUser.id,
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-continuation-proof",
          localOnly: true,
          fixture,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleAdaptiveBlueprintContinuationProfileProof() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    if (!options["candidate-id"] || !options["coach-artifact"] || !options.output) {
      throw new Error(
        "Adaptive continuation profile proof requires --candidate-id, --coach-artifact and --output inside .tanstack.",
      );
    }
    const coachArtifactPath = requireEvidencePath(options["coach-artifact"], "--coach-artifact");
    const coachArtifact = JSON.parse(await readFile(coachArtifactPath, "utf8"));
    const coachCandidateId = coachArtifact.candidate?.id ?? coachArtifact.candidateId;
    const coachCandidateSha256 = coachArtifact.candidate?.sha256 ?? coachArtifact.candidateSha256;
    const coachReviewChecksum =
      coachArtifact.review?.reviewChecksum ?? coachArtifact.reviewChecksum;
    const coachReviewedOn = coachArtifact.coachVerdict?.reviewedOn ?? coachArtifact.reviewedOn;
    const coachVerdict = coachArtifact.coachVerdict?.verdict ?? coachArtifact.verdict;
    assert.equal(coachCandidateId, options["candidate-id"]);
    assert.equal(coachArtifact.review?.sealed ?? true, true);
    assert.equal(coachVerdict, "APPROVED");
    assert.equal(
      coachArtifact.coachVerdict?.candidateId ?? coachCandidateId,
      options["candidate-id"],
    );
    assert.equal(
      coachArtifact.coachVerdict?.candidateSha256 ?? coachCandidateSha256,
      coachCandidateSha256,
    );
    assert.equal(
      coachArtifact.coachVerdict?.reviewChecksum ?? coachReviewChecksum,
      coachReviewChecksum,
    );
    const artifact = await confirmAdaptiveBlueprintContinuationProfileFixture({
      supabase,
      userId: authUser.id,
      expectedCandidateId: options["candidate-id"],
    });
    assert.equal(artifact.candidate.sha256, coachCandidateSha256);
    const completedArtifact = {
      ...artifact,
      candidate: {
        ...artifact.candidate,
        coachReview: {
          verdict: coachVerdict,
          reviewedOn: coachReviewedOn,
          reviewChecksum: coachReviewChecksum,
          reviewTokenSha256: coachArtifact.review?.reviewTokenSha256 ?? null,
          sealed: coachArtifact.review?.sealed ?? true,
        },
      },
    };
    await writeOptionalEvidenceFile(options.output, completedArtifact);
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-continuation-profile-proof",
          localOnly: true,
          output: requireEvidencePath(options.output, "--output"),
          candidate: completedArtifact.candidate,
          confirmation: artifact.confirmation,
          evidence: artifact.evidence,
          snapshots: artifact.snapshots,
          omissions: artifact.omissions,
          cleanup: artifact.cleanup,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleAdaptiveBlueprintContinuationPrepare() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    if (!options.output) {
      throw new Error("Adaptive continuation preparation requires --output inside .tanstack.");
    }
    const artifact = await prepareAdaptiveBlueprintContinuationCandidateFixture({
      supabase,
      userId: authUser.id,
    });
    await writeOptionalEvidenceFile(options.output, artifact);
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-continuation-prepare",
          localOnly: true,
          output: requireEvidencePath(options.output, "--output"),
          candidate: {
            id: artifact.candidate.id,
            sha256: artifact.candidate.sha256,
            sourceResponseId: artifact.source.response.recordId,
            reviewChecksum: artifact.review.reviewChecksum,
          },
          invariants: artifact.invariants,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleAdaptiveBlueprintTwoProfileReplay() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    if (!options["candidate-artifact"] || !options["accepted-coach-artifact"] || !options.output) {
      throw new Error(
        "Adaptive two-profile replay requires --candidate-artifact, --accepted-coach-artifact and --output inside .tanstack.",
      );
    }
    const candidateArtifactPath = requireEvidencePath(
      options["candidate-artifact"],
      "--candidate-artifact",
    );
    const acceptedCoachArtifactPath = requireEvidencePath(
      options["accepted-coach-artifact"],
      "--accepted-coach-artifact",
    );
    const candidateArtifactRaw = await readFile(candidateArtifactPath, "utf8");
    const acceptedCoachArtifactRaw = await readFile(acceptedCoachArtifactPath, "utf8");
    const candidateArtifact = JSON.parse(candidateArtifactRaw);
    const acceptedCoachArtifact = JSON.parse(acceptedCoachArtifactRaw);

    assert.equal(acceptedCoachArtifact.coachVerdict?.verdict, "APPROVED");
    assert.equal(
      acceptedCoachArtifact.coachVerdict?.candidateId,
      acceptedCoachArtifact.candidate?.id,
    );
    assert.equal(
      acceptedCoachArtifact.coachVerdict?.candidateSha256,
      acceptedCoachArtifact.candidate?.sha256,
    );
    assert.equal(
      acceptedCoachArtifact.coachVerdict?.reviewChecksum,
      acceptedCoachArtifact.review?.reviewChecksum,
    );
    assert.equal(candidateArtifact.review?.sealed, true);
    assert.equal(candidateArtifact.candidate?.blockMode, "normal_four_week");
    assert.deepEqual(
      canonicalCoachPrescription(candidateArtifact.candidate),
      canonicalCoachPrescription(acceptedCoachArtifact.candidate),
      "The replayed first continuation must preserve the terminal HITO-266 Coach-reviewed prescription exactly.",
    );

    const artifact = await confirmAdaptiveBlueprintContinuationProfileFixture({
      supabase,
      userId: authUser.id,
      expectedCandidateId: candidateArtifact.candidate.id,
    });
    const completedArtifact = {
      ...artifact,
      qualityEvidence: {
        mode: "terminal_hito_266_semantic_replay",
        acceptedArtifactSha256: await digestSha256Hex(acceptedCoachArtifactRaw),
        replayCandidateArtifactSha256: await digestSha256Hex(candidateArtifactRaw),
        acceptedCandidate: {
          id: acceptedCoachArtifact.candidate.id,
          sha256: acceptedCoachArtifact.candidate.sha256,
          reviewChecksum: acceptedCoachArtifact.review.reviewChecksum,
        },
        replayedCandidate: {
          id: candidateArtifact.candidate.id,
          sha256: candidateArtifact.candidate.sha256,
          reviewChecksum: candidateArtifact.review.reviewChecksum,
        },
        semanticPrescriptionEqual: true,
        acceptedCoachVerdict: "APPROVED",
        newCoachVerdictClaimed: false,
      },
    };
    await writeOptionalEvidenceFile(options.output, completedArtifact);
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-two-profile-replay",
          localOnly: true,
          output: requireEvidencePath(options.output, "--output"),
          qualityEvidence: completedArtifact.qualityEvidence,
          confirmation: completedArtifact.confirmation,
          snapshots: completedArtifact.snapshots,
          cleanup: completedArtifact.cleanup,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

function canonicalCoachPrescription(candidate) {
  return {
    blockMode: candidate.blockMode,
    interval: candidate.interval,
    performanceAdaptation: candidate.performanceAdaptation,
    workoutDocuments: candidate.workoutDocuments.map((document) => ({
      ...stripGeneratedIdentity(document),
      steps: document.steps.map(stripGeneratedIdentity),
    })),
  };
}

function stripGeneratedIdentity(value) {
  if (Array.isArray(value)) return value.map(stripGeneratedIdentity);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          !["segment_id", "calendarWorkoutId", "plannedWorkoutId", "sourceWorkoutId"].includes(key),
      )
      .map(([key, child]) => [key, stripGeneratedIdentity(child)]),
  );
}

async function handleAdaptiveBlueprintSecondContinuationPreflight() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    if (!options.output) {
      throw new Error("Adaptive second-continuation preflight requires --output inside .tanstack.");
    }
    const artifact = await preflightAdaptiveBlueprintSecondContinuationFixture({
      supabase,
      userId: authUser.id,
    });
    await writeOptionalEvidenceFile(options.output, artifact);
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-second-continuation-preflight",
          localOnly: true,
          output: requireEvidencePath(options.output, "--output"),
          facts: artifact.facts,
          decision: artifact.decision,
          request: artifact.request,
          candidate: artifact.candidate,
          invariants: artifact.invariants,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleAdaptiveBlueprintSecondContinuationAuthor() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    if (!options.preflight || !options.output) {
      throw new Error(
        "Adaptive second-continuation authoring requires --preflight and --output inside .tanstack.",
      );
    }
    const preflightPath = requireEvidencePath(options.preflight, "--preflight");
    const preflight = JSON.parse(await readFile(preflightPath, "utf8"));
    assert.equal(preflight.request?.externalProviderDispatchCount, 0);
    assert.equal(preflight.request?.exactReuseApplied, false);
    assert.equal(preflight.request?.paidDispatchRequired, true);
    assert.equal(preflight.decision?.status, "authoring_ready");
    const artifact = await authorAdaptiveBlueprintSecondContinuationFixture({
      supabase,
      userId: authUser.id,
    });
    assert.equal(artifact.source.response.providerModel, preflight.request.providerModel);
    assert.equal(artifact.source.response.promptVersion, preflight.request.promptVersion);
    assert.equal(artifact.source.response.policyVersion, preflight.request.policyVersion);
    assert.equal(artifact.source.response.compilerVersion, preflight.request.compilerVersion);
    assert.equal(artifact.candidate.blockMode, preflight.decision.interval.blockMode);
    assert.deepEqual(artifact.candidate.interval, {
      startDate: preflight.decision.interval.startDate,
      endDate: preflight.decision.interval.endDate,
    });
    await writeOptionalEvidenceFile(options.output, artifact);
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-second-continuation-author",
          localOnly: true,
          output: requireEvidencePath(options.output, "--output"),
          source: artifact.source,
          attempt: artifact.attempt,
          candidate: {
            id: artifact.candidate.id,
            sha256: artifact.candidate.sha256,
            blockMode: artifact.candidate.blockMode,
            interval: artifact.candidate.interval,
          },
          review: artifact.review,
          invariants: artifact.invariants,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleAdaptiveBlueprintSecondContinuationRecompile() {
  await withAdaptiveTrainingQualityLease(async () => {
    const definition = QA_TESTER_POOL[ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Adaptive Blueprint fixture identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
      userId: authUser.id,
    });
    if (!options.candidate || !options.coach || !options.output) {
      throw new Error(
        "Adaptive second-continuation recompile requires --candidate, --coach and --output inside .tanstack.",
      );
    }
    const candidateArtifact = JSON.parse(
      await readFile(requireEvidencePath(options.candidate, "--candidate"), "utf8"),
    );
    const coachArtifact = JSON.parse(
      await readFile(requireEvidencePath(options.coach, "--coach"), "utf8"),
    );
    assert.ok(
      [
        "hito_264_second_continuation_candidate_v1",
        "hito_264_second_continuation_candidate_v2",
      ].includes(candidateArtifact.artifactVersion),
    );
    assert.ok(
      [
        "hito_264_second_continuation_coach_review_v1",
        "hito_264_second_continuation_coach_review_v2",
      ].includes(coachArtifact.artifactVersion),
    );
    assert.equal(coachArtifact.verdict, "REJECTED");
    assert.equal(coachArtifact.candidateId, candidateArtifact.candidate.id);
    assert.equal(coachArtifact.candidateSha256, candidateArtifact.candidate.sha256);
    assert.equal(coachArtifact.reviewChecksum, candidateArtifact.review.reviewChecksum);
    assert.equal(
      candidateArtifact.artifactVersion === "hito_264_second_continuation_candidate_v1"
        ? candidateArtifact.invariants.paidProviderDispatchCount
        : candidateArtifact.invariants.providerDispatchCount,
      candidateArtifact.artifactVersion === "hito_264_second_continuation_candidate_v1" ? 1 : 0,
    );
    assert.equal(candidateArtifact.invariants.confirmationCount, 2);
    assert.equal(candidateArtifact.invariants.calendarWorkoutCount, 44);
    assert.equal(candidateArtifact.invariants.futureProjectionCalendarRowCount, 0);

    const artifact = await recompileAdaptiveBlueprintSecondContinuationFixture({
      supabase,
      userId: authUser.id,
      responseRecordId:
        candidateArtifact.source?.response?.recordId ??
        candidateArtifact.retainedLineage.responseRecordId,
      rejectedCandidateId: candidateArtifact.candidate.id,
      rejectedCandidateSha256: candidateArtifact.candidate.sha256,
      rejectedReviewChecksum: candidateArtifact.review.reviewChecksum,
      rejectedCandidateCompilerVersion:
        candidateArtifact.source?.response?.compilerVersion ??
        candidateArtifact.retainedLineage.recompileCompilerVersion,
      coachReviewedAt: coachArtifact.reviewedOn,
      coachDiscriminator: coachArtifact.discriminator,
    });
    await writeOptionalEvidenceFile(options.output, artifact);
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "adaptive-blueprint-second-continuation-recompile",
          localOnly: true,
          output: requireEvidencePath(options.output, "--output"),
          retainedLineage: artifact.retainedLineage,
          candidate: {
            id: artifact.candidate.id,
            sha256: artifact.candidate.sha256,
            blockMode: artifact.candidate.blockMode,
            interval: artifact.candidate.interval,
            endpoint: artifact.candidate.endpoint,
          },
          review: artifact.review,
          invariants: artifact.invariants,
          ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
        },
        null,
        2,
      ),
    );
  });
}

async function handleDesignProfileStatus() {
  await withDesignProfileLease(async () => {
    const definition = QA_TESTER_POOL[RUNNER_DESIGN_PROFILE_FIXTURE_ROLE];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      throw new Error(`Runner design profile identity ${definition.email} was not found.`);
    }
    await assertQaPoolAuthUser({
      supabase,
      role: RUNNER_DESIGN_PROFILE_FIXTURE_ROLE,
      userId: authUser.id,
    });
    const fixture = await readRunnerDesignProfileFixture({
      supabase,
      userId: authUser.id,
    });
    const accounts = await loadLocalAccounts();
    const localAccount = accounts.find((account) => account.email === definition.email) ?? null;
    if (!localAccount) {
      throw new Error(`Local login account ${definition.email} was not found.`);
    }
    const runtime = options["runtime-url"]
      ? await verifyRunnerDesignProfileFixtureRuntime({
          runtimeUrl: options["runtime-url"],
          username: localAccount.username,
          password: localAccount.password,
        })
      : null;
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "design-profile-status",
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

async function handleDesignProfileReset(action = "design-profile-reset") {
  await handleFixtureReset({
    action,
    role: RUNNER_DESIGN_PROFILE_FIXTURE_ROLE,
    storageVersion: RUNNER_DESIGN_PROFILE_FIXTURE_VERSION,
  });
}

async function handleFixtureReset({ action, role, storageVersion }) {
  const withLease =
    role === ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE
      ? withAdaptiveTrainingQualityLease
      : withDesignProfileLease;
  await withLease(async () => {
    const definition = QA_TESTER_POOL[role];
    const authUser = await findAuthUserByEmail(definition.email);
    if (!authUser) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            action,
            localOnly: true,
            authUserPreserved: false,
            authUserId: null,
            identityAbsent: true,
            retainedStorageObjects: 0,
            beforeCounts: null,
            afterCounts: null,
          },
          null,
          2,
        ),
      );
      return;
    }
    await assertQaPoolAuthUser({
      supabase,
      role,
      userId: authUser.id,
    });
    const beforeCounts = await getQaUserOwnedCounts(supabase, authUser.id);
    const afterCounts = await resetQaPoolUserData({ supabase, userId: authUser.id });
    if (Object.values(afterCounts).some((count) => count !== 0)) {
      throw new Error("Runner design profile reset left canonical QA-owned rows behind.");
    }
    const retainedStorage = await supabase.storage
      .from(RUNNER_DESIGN_PROFILE_FIXTURE_STORAGE_BUCKET)
      .list(`${authUser.id}/${storageVersion}`);
    if (retainedStorage.error) throw new Error(retainedStorage.error.message);
    if (retainedStorage.data.length !== 0) {
      throw new Error("Runner design profile reset left raw storage objects behind.");
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          action,
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

async function handleRunnerCoreFileFlowSeed() {
  await withRunnerCoreFileFlowLease(async () => {
    const authUser = await ensureQaPoolUserWithLocalAccount(RUNNER_CORE_FILE_FLOW_FIXTURE_ROLE);
    const beforeCounts = await getQaUserOwnedCounts(supabase, authUser.id);
    await resetQaPoolUserData({ supabase, userId: authUser.id });
    let fixture;
    try {
      fixture = await seedRunnerCoreFileFlowFixtureForUser(authUser.id);
    } catch (error) {
      await resetQaPoolUserData({ supabase, userId: authUser.id });
      throw error;
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "runner-core-file-flow-seed",
          localOnly: true,
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

async function handleRunnerCoreFileFlowProof() {
  await withRunnerCoreFileFlowProofLeases(async () => {
    const fixtureUser = await ensureQaPoolUserWithLocalAccount(RUNNER_CORE_FILE_FLOW_FIXTURE_ROLE);
    const isolatedUser = await ensureQaPoolUserWithLocalAccount("isolation-b");
    await resetQaPoolUserData({ supabase, userId: fixtureUser.id });
    await resetQaPoolUserData({ supabase, userId: isolatedUser.id });
    const receipts = {};

    try {
      const firstSeed = await seedRunnerCoreFileFlowFixtureForUser(fixtureUser.id);
      receipts.firstSeed = firstSeed;
      assert.equal(firstSeed.evidence.assetCount, 0);
      const firstReset = await resetQaPoolUserData({ supabase, userId: fixtureUser.id });
      assertAllOwnedCountsZero(firstReset, "Runner Core file-flow first reset");
      await assertUserStorageEmpty(fixtureUser.id);

      const secondSeed = await seedRunnerCoreFileFlowFixtureForUser(fixtureUser.id);
      receipts.secondSeed = secondSeed;
      assert.equal(secondSeed.workout.date, firstSeed.workout.date);
      assert.equal(secondSeed.workout.originKind, "file_import");
      assert.equal(secondSeed.workout.sourceWorkoutId, firstSeed.workout.sourceWorkoutId);

      await assertLocalFixtureUploadRejected({
        userId: fixtureUser.id,
        plannedWorkoutId: secondSeed.workout.id,
        requestedFixture: "../sample-fit-from-zip.fit",
        authProvider: "local",
        appBaseUrl: "http://127.0.0.1:3000",
      });
      await assertLocalFixtureUploadRejected({
        userId: fixtureUser.id,
        plannedWorkoutId: secondSeed.workout.id,
        requestedFixture: "sample-fit-from-zip.fit",
        authProvider: "supabase",
        appBaseUrl: "http://127.0.0.1:3000",
      });
      await assertLocalFixtureUploadRejected({
        userId: fixtureUser.id,
        plannedWorkoutId: secondSeed.workout.id,
        requestedFixture: "sample-fit-from-zip.fit",
        authProvider: "local",
        appBaseUrl: "https://example.com",
      });
      await assertLocalFixtureUploadRejected(
        {
          userId: isolatedUser.id,
          plannedWorkoutId: secondSeed.workout.id,
          requestedFixture: "sample-fit-from-zip.fit",
          authProvider: "local",
          appBaseUrl: "http://127.0.0.1:3000",
        },
        "planned_workout_not_found",
      );
      assert.equal(
        (
          await readRunnerCoreFileFlowFixture({
            supabase,
            userId: fixtureUser.id,
            asOfDate: options["as-of-date"],
          })
        ).evidence.assetCount,
        0,
      );
      assertAllOwnedCountsZero(
        await getQaUserOwnedCounts(supabase, isolatedUser.id),
        "Runner Core file-flow isolated user",
      );

      const uploaded = await withLocalDesignFixtureEnv(() =>
        ingestLocalQaFixtureWorkoutResult({
          userId: fixtureUser.id,
          plannedWorkoutId: secondSeed.workout.id,
          requestedFixture: "sample-fit-from-zip.fit",
          authProvider: "local",
          appBaseUrl: "http://127.0.0.1:3000",
        }),
      );
      assert.ok(uploaded.latestAsset?.id);
      assert.ok(uploaded.latestActualMetrics?.id);
      assert.ok(uploaded.latestComparison?.id);
      const durable = await readRunnerCoreFileFlowFixture({
        supabase,
        userId: fixtureUser.id,
        asOfDate: options["as-of-date"],
        expectedEditingState: "evidence_backed",
      });
      assert.deepEqual(durable.evidence, {
        assetCount: 1,
        parsedAssetCount: 1,
        metricsCount: 1,
        comparisonCount: 1,
        matchCount: 1,
      });
      const feedbackBeforeRemoval = await getLatestWorkoutResultFeedback({
        userId: fixtureUser.id,
        plannedWorkoutId: secondSeed.workout.id,
      });
      assert.equal(feedbackBeforeRemoval?.latestAsset?.rawFileAvailable, true);

      const feedbackAfterRemoval = await removeWorkoutResultEvidence({
        userId: fixtureUser.id,
        plannedWorkoutId: secondSeed.workout.id,
      });
      assert.equal(feedbackAfterRemoval?.latestAsset?.rawFileAvailable, false);
      assert.equal(
        feedbackAfterRemoval?.latestActualMetrics?.id,
        feedbackBeforeRemoval?.latestActualMetrics?.id,
      );
      assert.equal(
        feedbackAfterRemoval?.latestComparison?.id,
        feedbackBeforeRemoval?.latestComparison?.id,
      );
      receipts.durableLifecycle = {
        assetId: uploaded.latestAsset.id,
        metricsId: uploaded.latestActualMetrics.id,
        comparisonId: uploaded.latestComparison.id,
        rawFileAvailableBeforeRemoval: true,
        rawFileAvailableAfterRemoval: false,
      };
    } finally {
      const fixtureCleanup = await resetQaPoolUserData({ supabase, userId: fixtureUser.id });
      const isolatedCleanup = await resetQaPoolUserData({ supabase, userId: isolatedUser.id });
      assertAllOwnedCountsZero(fixtureCleanup, "Runner Core file-flow fixture cleanup");
      assertAllOwnedCountsZero(isolatedCleanup, "Runner Core file-flow isolation cleanup");
      await assertUserStorageEmpty(fixtureUser.id);
      await assertUserStorageEmpty(isolatedUser.id);
      receipts.cleanup = { fixtureCleanup, isolatedCleanup };
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "runner-core-file-flow-proof",
          localOnly: true,
          receipts,
        },
        null,
        2,
      ),
    );
  });
}

async function seedRunnerCoreFileFlowFixtureForUser(userId) {
  const rawPlan = await readFile(
    path.resolve(process.cwd(), RUNNER_CORE_FILE_FLOW_FIXTURE_TEMPLATE),
    "utf8",
  );
  return seedRunnerCoreFileFlowFixture({
    supabase,
    userId,
    templatePlan: importedPlanSchema.parse(JSON.parse(rawPlan)),
    asOfDate: options["as-of-date"],
  });
}

async function assertLocalFixtureUploadRejected(input, expectedCode = "invalid_upload") {
  await assert.rejects(
    withLocalDesignFixtureEnv(() => ingestLocalQaFixtureWorkoutResult(input)),
    (error) => error && error.code === expectedCode,
  );
}

async function assertUserStorageEmpty(userId) {
  const storage = await supabase.storage
    .from(RUNNER_DESIGN_PROFILE_FIXTURE_STORAGE_BUCKET)
    .list(userId, { limit: 100 });
  if (storage.error) throw new Error(storage.error.message);
  assert.deepEqual(storage.data, []);
}

function assertAllOwnedCountsZero(counts, label) {
  const retained = Object.entries(counts).filter(([, count]) => count !== 0);
  assert.deepEqual(retained, [], `${label} retained canonical rows.`);
}

async function ensureQaPoolUserWithLocalAccount(role) {
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

async function withRunnerCoreFileFlowLease(action) {
  const lease = await acquireQaPoolLease({ role: RUNNER_CORE_FILE_FLOW_FIXTURE_ROLE });
  try {
    return await action();
  } finally {
    await releaseQaPoolLease(lease);
  }
}

async function withRunnerCoreFileFlowProofLeases(action) {
  const fixtureLease = await acquireQaPoolLease({ role: RUNNER_CORE_FILE_FLOW_FIXTURE_ROLE });
  let isolatedLease;
  try {
    isolatedLease = await acquireQaPoolLease({ role: "isolation-b" });
    return await action();
  } finally {
    if (isolatedLease) await releaseQaPoolLease(isolatedLease);
    await releaseQaPoolLease(fixtureLease);
  }
}

async function ensureDesignProfilePoolUser() {
  const role = RUNNER_DESIGN_PROFILE_FIXTURE_ROLE;
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

async function withDesignProfileLease(action) {
  const lease = await acquireQaPoolLease({
    role: RUNNER_DESIGN_PROFILE_FIXTURE_ROLE,
  });
  try {
    return await action();
  } finally {
    await releaseQaPoolLease(lease);
  }
}

async function withAdaptiveTrainingQualityLease(action) {
  const lease = await acquireQaPoolLease({
    role: ADAPTIVE_TRAINING_QUALITY_FIXTURE_ROLE,
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
      readEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE") ?? DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
    ),
  };
}

async function loadLocalAccounts() {
  return readLocalAuthAccountRegistry(config.accountsFilePath, { allowMissing: true });
}

async function saveLocalAccounts(accounts) {
  await writeLocalAuthAccountRegistry(config.accountsFilePath, accounts);
}

function upsertLocalAccount(accounts, nextAccount) {
  const normalized = normalizeLocalAuthAccount(nextAccount);
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
  const plan = importedPlanSchema.parse(JSON.parse(rawPlan));
  const fixtureMaterializationInstant = new Date(`${plan.start_date}T12:00:00.000Z`);
  const sourcePlan = await retainImportedPlanCandidateForUser({
    userId,
    canonicalPlan: plan,
    reviewChecksum: await digestSha256Hex(stableJsonStringify(plan)),
  });

  const documents = buildImportedPlanSeed(plan).workouts;
  const review = await reviewWorkoutCommandForUser(userId, {
    operation: "materialize",
    documents,
    provenanceReferences: documents.map((document) => ({
      sourcePlanId: sourcePlan.id,
      sourceKind: plan.source_kind,
      sourceWorkoutId: document.sourceWorkoutId,
    })),
  });
  assert.equal(review.ok, true);
  if (!review.ok) throw new Error("Imported fixture Workout batch review failed.");
  const confirmed = await confirmWorkoutCommandForUser(
    userId,
    {
      command: review.candidate.command,
      candidateId: review.candidate.candidateId,
      reviewToken: review.candidate.reviewToken,
      reviewChecksum: review.candidate.reviewChecksum,
    },
    { sourceBatchCalendarInstant: fixtureMaterializationInstant },
  );
  assert.equal(confirmed.ok, true, confirmed.ok ? "" : confirmed.message);
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
    materializedPlanId: appliedPlan.planCycle.id,
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
  const sourcePlan = await supabase
    .from("plan_cycles")
    .select("id, title, start_date, end_date")
    .eq("user_id", userId)
    .eq("status", "archived")
    .not("saved_plan_payload", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sourcePlan.error) {
    throw new Error(sourcePlan.error.message);
  }
  if (!sourcePlan.data) {
    throw new Error("Persisted plan readback evidence requires immutable source provenance.");
  }

  const workouts = await supabase
    .from("planned_workouts")
    .select(
      "id, workout_date, title, source_workout_type, workout_family, workout_identity, calendar_icon_key, goal_context, metric_mode",
    )
    .eq("plan_cycle_id", sourcePlan.data.id)
    .order("workout_date", { ascending: true });

  if (workouts.error) {
    throw new Error(workouts.error.message);
  }

  return {
    planCycle: sourcePlan.data,
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
