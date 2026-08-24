import assert from "node:assert/strict";
import { chmod, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { tsImport } from "tsx/esm/api";
import {
  QA_TESTER_POOL,
  acquireQaPoolLease,
  adoptHostedQaPoolAuthUser,
  assertQaCleanupManifestMatches,
  assertQaPoolAuthUser,
  assertQaPoolLease,
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
  buildAdaptiveTrainingQualityFitFile,
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
const HOSTED_POOL_COMMANDS = new Set([
  "hosted-pool-adopt",
  "hosted-pool-status",
  "hosted-pool-auth-link",
  "hosted-pool-checkpoint",
  "hosted-pool-calendar-date",
  "hosted-pool-fit-artifact",
  "hosted-pool-profile-snapshot",
  "hosted-pool-continuation-preflight",
  "hosted-pool-attempt-ledger",
  "hosted-pool-latest-diagnostic",
  "hosted-pool-recompile-technical",
  "hosted-pool-candidate-artifact",
  "hosted-pool-record-coach-verdict",
  "hosted-pool-confirm-candidate",
  "hosted-pool-reset",
]);

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
    "hosted-pool-adopt",
    "hosted-pool-status",
    "hosted-pool-auth-link",
    "hosted-pool-checkpoint",
    "hosted-pool-calendar-date",
    "hosted-pool-fit-artifact",
    "hosted-pool-profile-snapshot",
    "hosted-pool-continuation-preflight",
    "hosted-pool-attempt-ledger",
    "hosted-pool-latest-diagnostic",
    "hosted-pool-recompile-technical",
    "hosted-pool-candidate-artifact",
    "hosted-pool-record-coach-verdict",
    "hosted-pool-confirm-candidate",
    "hosted-pool-reset",
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
    "Usage: npm run test-user -- <inventory|cleanup-manifest|cleanup-apply|pool-ensure|pool-reset-plan|pool-reset|pool-delete|hosted-pool-adopt|hosted-pool-status|hosted-pool-auth-link|hosted-pool-checkpoint|hosted-pool-calendar-date|hosted-pool-fit-artifact|hosted-pool-profile-snapshot|hosted-pool-continuation-preflight|hosted-pool-attempt-ledger|hosted-pool-latest-diagnostic|hosted-pool-recompile-technical|hosted-pool-candidate-artifact|hosted-pool-record-coach-verdict|hosted-pool-confirm-candidate|hosted-pool-reset|design-profile-seed|design-profile-status|design-profile-reset|adaptive-blueprint-seed|adaptive-blueprint-continuation-seed|adaptive-blueprint-status|adaptive-blueprint-continuation-prepare|adaptive-blueprint-continuation-proof|adaptive-blueprint-continuation-profile-proof|adaptive-blueprint-two-profile-replay|adaptive-blueprint-second-continuation-preflight|adaptive-blueprint-second-continuation-author|adaptive-blueprint-second-continuation-recompile|adaptive-blueprint-reset|runner-core-file-flow-seed|runner-core-file-flow-proof|create|reset-plan|reset|delete> [options]",
  );
}

const config = await buildConfig();
if (HOSTED_POOL_COMMANDS.has(command)) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = config.supabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = config.supabasePublishableKey;
  process.env.SUPABASE_SECRET_KEY = config.supabaseServerKey;
}
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
} else if (command === "hosted-pool-adopt") {
  await handleHostedPoolAdopt();
} else if (command === "hosted-pool-status") {
  await handleHostedPoolStatus();
} else if (command === "hosted-pool-auth-link") {
  await handleHostedPoolAuthLink();
} else if (command === "hosted-pool-checkpoint") {
  await handleHostedPoolCheckpoint();
} else if (command === "hosted-pool-calendar-date") {
  await handleHostedPoolCalendarDate();
} else if (command === "hosted-pool-fit-artifact") {
  await handleHostedPoolFitArtifact();
} else if (command === "hosted-pool-profile-snapshot") {
  await handleHostedPoolProfileSnapshot();
} else if (command === "hosted-pool-continuation-preflight") {
  await handleHostedPoolContinuationPreflight();
} else if (command === "hosted-pool-attempt-ledger") {
  await handleHostedPoolAttemptLedger();
} else if (command === "hosted-pool-latest-diagnostic") {
  await handleHostedPoolLatestDiagnostic();
} else if (command === "hosted-pool-recompile-technical") {
  await handleHostedPoolRecompileTechnical();
} else if (command === "hosted-pool-candidate-artifact") {
  await handleHostedPoolCandidateArtifact();
} else if (command === "hosted-pool-record-coach-verdict") {
  await handleHostedPoolRecordCoachVerdict();
} else if (command === "hosted-pool-confirm-candidate") {
  await handleHostedPoolConfirmCandidate();
} else if (command === "hosted-pool-reset") {
  await handleHostedPoolReset();
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

async function handleHostedPoolAdopt() {
  const role = requireHostedAdaptivePoolRole();
  const userId = requireOption(options["user-id"], "--user-id");
  const receiptPath = requireHostedReceiptPath();
  const authUser = await adoptHostedQaPoolAuthUser({
    supabase,
    role,
    userId,
  });
  const lease = await acquireQaPoolLease({ role });
  const receipt = {
    schemaVersion: 1,
    task: "HITO-271",
    environment: "hosted_preview",
    projectRef: config.hostedProjectRef,
    role,
    userId: authUser.id,
    leaseToken: lease.token,
    identityRetainedAcrossStages: true,
    authIdentityDeletionRequired: false,
    checkpoints: [
      hostedCheckpoint("identity_adopted", {
        emailSuffix: ".invalid",
        emailConfirmed: Boolean(authUser.email_confirmed_at),
        ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
      }),
    ],
  };
  await writeHostedReceipt(receiptPath, receipt, { create: true });
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-adopt",
      role,
      userId: authUser.id,
      receiptPath,
      receiptSha256: hashStableJson(receipt),
    }),
  );
}

async function handleHostedPoolStatus() {
  const { receiptPath, receipt, authUser } = await readCurrentHostedReceipt();
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("identity_status", {
      emailConfirmed: Boolean(authUser.email_confirmed_at),
      ownedRows: await getQaUserOwnedCounts(supabase, authUser.id),
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-status",
      role: receipt.role,
      userId: receipt.userId,
      receiptPath,
      receiptSha256: hashStableJson(next),
    }),
  );
}

async function handleHostedPoolAuthLink() {
  const { receiptPath, receipt, authUser } = await readCurrentHostedReceipt();
  const previewOrigin = requireHostedPreviewOrigin(options["preview-origin"]);
  const callbackArtifactPath = requireExternalPrivatePath(
    options["callback-artifact"],
    "--callback-artifact",
  );
  const generated = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.email,
    options: { redirectTo: new URL("/api/auth/confirm", previewOrigin).toString() },
  });
  const hashedToken = generated.data.properties?.hashed_token;
  if (generated.error || !hashedToken) {
    throw new Error(
      generated.error?.message ?? "Supabase did not return a hosted auth token hash.",
    );
  }
  await writeFile(
    callbackArtifactPath,
    `${JSON.stringify(
      {
        task: "HITO-271",
        projectRef: config.hostedProjectRef,
        userId: receipt.userId,
        previewOrigin,
        callbackPath: "/api/auth/confirm",
        hashedToken,
        type: "magiclink",
        next: "/",
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  await chmod(callbackArtifactPath, 0o600);
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("public_auth_callback_prepared", {
      previewOrigin,
      callbackPath: "/api/auth/confirm",
      callbackArtifactPath,
      secretValuesIncludedInReceipt: false,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-auth-link",
      userId: receipt.userId,
      callbackPrepared: true,
      callbackArtifactPath,
      receiptPath,
      receiptSha256: hashStableJson(next),
    }),
  );
}

async function handleHostedPoolCheckpoint() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const checkpoint = requireOption(options.checkpoint, "--checkpoint");
  if (!/^[a-z0-9_]{3,80}$/.test(checkpoint)) {
    throw new Error("--checkpoint must be a stable lower-case discriminator.");
  }
  const evidenceSha256 = requireOption(options["evidence-sha256"], "--evidence-sha256");
  if (!/^[a-f0-9]{64}$/.test(evidenceSha256)) {
    throw new Error("--evidence-sha256 must be one SHA-256 digest.");
  }
  const next = appendHostedCheckpoint(receipt, hostedCheckpoint(checkpoint, { evidenceSha256 }));
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-checkpoint",
      checkpoint,
      userId: receipt.userId,
      receiptPath,
      receiptSha256: hashStableJson(next),
    }),
  );
}

async function handleHostedPoolCalendarDate() {
  const { receiptPath, receipt, authUser } = await readCurrentHostedReceipt();
  const calendarDate = requireOption(options.date, "--date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
    throw new Error("--date must be one ISO Calendar date.");
  }
  const instant = new Date(`${calendarDate}T12:00:00.000Z`);
  if (Number.isNaN(instant.getTime()) || instant.toISOString().slice(0, 10) !== calendarDate) {
    throw new Error("--date must be a valid ISO Calendar date.");
  }
  const updated = await supabase.auth.admin.updateUserById(receipt.userId, {
    app_metadata: {
      ...(authUser.app_metadata ?? {}),
      hito_qa_calendar_date: calendarDate,
    },
  });
  if (updated.error || !updated.data.user) {
    throw new Error(updated.error?.message ?? "Unable to set the hosted QA Calendar date.");
  }
  if (updated.data.user.app_metadata?.hito_qa_calendar_date !== calendarDate) {
    throw new Error("Hosted QA Calendar date did not persist exactly.");
  }
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("runner_calendar_date", { calendarDate }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-calendar-date",
      calendarDate,
      userId: receipt.userId,
      receiptPath,
      receiptSha256: hashStableJson(next),
    }),
  );
}

async function handleHostedPoolFitArtifact() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const localDate = requireOption(options.date, "--date");
  const evidenceKind = requireOption(options.kind, "--kind");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    throw new Error("--date must be one ISO Calendar date.");
  }
  if (evidenceKind !== "compatible" && evidenceKind !== "incomplete") {
    throw new Error("--kind must be compatible or incomplete.");
  }
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  if (!outputPath.toLowerCase().endsWith(".fit")) {
    throw new Error("--output must name one external .fit file.");
  }
  const workoutRead = await supabase
    .from("planned_workouts")
    .select("id, workout_date, workout_type")
    .eq("user_id", receipt.userId)
    .eq("workout_date", localDate)
    .neq("workout_type", "rest")
    .maybeSingle();
  if (workoutRead.error || !workoutRead.data) {
    throw new Error(
      workoutRead.error?.message ?? "The hosted FIT artifact requires one owned workout date.",
    );
  }
  const fileBuffer = buildAdaptiveTrainingQualityFitFile({ localDate, evidenceKind });
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  await writeFile(outputPath, fileBuffer, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const fileSha256 = createHash("sha256").update(fileBuffer).digest("hex");
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("synthetic_fit_artifact", {
      localDate,
      evidenceKind,
      workoutId: workoutRead.data.id,
      fileSha256,
      databaseWritePerformed: false,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-fit-artifact",
      localDate,
      evidenceKind,
      workoutId: workoutRead.data.id,
      outputPath,
      fileSha256,
      databaseWritePerformed: false,
      receiptSha256: hashStableJson(next),
    }),
  );
}

async function handleHostedPoolProfileSnapshot() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const asOfDate = requireOption(options["as-of-date"], "--as-of-date");
  const cutoffDate = requireOption(options["cutoff-date"], "--cutoff-date");
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  for (const [label, value] of [
    ["--as-of-date", asOfDate],
    ["--cutoff-date", cutoffDate],
  ]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`${label} must be one ISO Calendar date.`);
    }
  }
  const facts = readHostedRunnerFitnessProfileSnapshotThroughCanonicalOwner({
    userId: receipt.userId,
    asOf: asOfDate,
    cutoffDate,
  });
  if (!facts) {
    throw new Error("The hosted Runner Fitness Profile source lineage is unavailable.");
  }
  const snapshot = facts.fitnessProfileSnapshot;
  const artifact = {
    artifactKind: "hito271_hosted_runner_fitness_profile_snapshot_v1",
    generatedAt: new Date().toISOString(),
    task: "HITO-271",
    asOfDate,
    snapshot: {
      version: snapshot.version,
      snapshotId: snapshot.snapshotId,
      runnerFactsRevision: snapshot.runnerFactsRevision,
      cutoffDate: snapshot.cutoffDate,
      timeZone: snapshot.timeZone,
      formulaVersions: snapshot.formulaVersions,
      provenance: snapshot.provenance,
      components: snapshot.components,
    },
    continuationProjection: facts.fitnessProfileProjection,
    factualPackets: {
      calendarOutcomeFingerprint: facts.calendar.calendarOutcomeFingerprint,
      evidenceRevisionFingerprint: facts.evidence.evidenceRevisionFingerprint,
      missingEvidenceStates: facts.evidence.workouts
        .filter((workout) => workout.evidenceState !== "fit_current")
        .map((workout) => ({ workoutDate: workout.workoutDate, state: workout.evidenceState })),
    },
    privacy: {
      runnerIdIncluded: false,
      rawProviderContentIncluded: false,
      credentialIncluded: false,
      personalIdentityIncluded: false,
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  const artifactBytes = Buffer.from(`${JSON.stringify(artifact, null, 2)}\n`);
  await writeFile(outputPath, artifactBytes, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const artifactSha256 = createHash("sha256").update(artifactBytes).digest("hex");
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("runner_fitness_profile_snapshot", {
      snapshotId: snapshot.snapshotId,
      runnerFactsRevision: snapshot.runnerFactsRevision,
      cutoffDate: snapshot.cutoffDate,
      artifactSha256,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-profile-snapshot",
      snapshotId: snapshot.snapshotId,
      runnerFactsRevision: snapshot.runnerFactsRevision,
      cutoffDate: snapshot.cutoffDate,
      componentStates: Object.fromEntries(
        Object.entries(snapshot.components).map(([key, component]) => [key, component.state]),
      ),
      evidenceRevisionFingerprint: facts.evidence.evidenceRevisionFingerprint,
      outputPath,
      artifactSha256,
      receiptSha256: hashStableJson(next),
    }),
  );
}

function readHostedRunnerFitnessProfileSnapshotThroughCanonicalOwner(input) {
  const script = String.raw`
    import { readFileSync } from "node:fs";
    import { getAdaptiveBlueprintContinuationFactsForUser } from "./src/lib/adaptive-blueprint-read-model.ts";
    const input = JSON.parse(readFileSync(0, "utf8"));
    const facts = await getAdaptiveBlueprintContinuationFactsForUser(input);
    console.log(JSON.stringify(facts));
  `;
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", script],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.supabasePublishableKey,
        SUPABASE_SECRET_KEY: config.supabaseServerKey,
      },
      input: JSON.stringify(input),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (child.status !== 0) {
    const safeMessage = String(child.stderr ?? "")
      .split("\n")
      .find((line) => line.trim().startsWith("Error:"))
      ?.trim()
      .slice(0, 240);
    throw new Error(
      `Canonical Runner Fitness Profile read failed with status ${child.status}${safeMessage ? ` (${safeMessage})` : ""}.`,
    );
  }
  return JSON.parse(child.stdout);
}

async function handleHostedPoolContinuationPreflight() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  const asOfDate = requireOption(options["as-of-date"], "--as-of-date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
    throw new Error("--as-of-date must be one ISO Calendar date.");
  }
  const beforeCounts = await getQaUserOwnedCounts(supabase, receipt.userId);
  const artifact = runHostedContinuationPreflightThroughCanonicalOwner({
    userId: receipt.userId,
    asOfDate,
  });
  const afterCounts = await getQaUserOwnedCounts(supabase, receipt.userId);
  assert.deepEqual(
    afterCounts,
    beforeCounts,
    "Hosted continuation preflight must not retain a provider response or candidate.",
  );
  if (
    artifact.decision?.status !== "authoring_ready" ||
    artifact.request?.externalProviderDispatchCount !== 0 ||
    beforeCounts.adaptive_training_block_confirmations !== 2 ||
    beforeCounts.planned_workouts !== 44
  ) {
    throw new Error("Hosted continuation preflight did not preserve the accepted 2/44/0 boundary.");
  }
  const hostedArtifact = {
    ...artifact,
    artifactVersion: "hito_271_hosted_second_continuation_preflight_v1",
    environment: {
      kind: "hosted_preview",
      projectRef: receipt.projectRef,
      providerDispatchPerformed: false,
    },
    invariants: {
      ...artifact.invariants,
      confirmationCount: beforeCounts.adaptive_training_block_confirmations,
      calendarWorkoutCount: beforeCounts.planned_workouts,
      futureProjectionCalendarRowCount: 0,
      persistenceDelta: 0,
      hostedAction: true,
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  const artifactBytes = Buffer.from(`${JSON.stringify(hostedArtifact, null, 2)}\n`);
  await writeFile(outputPath, artifactBytes, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const artifactSha256 = createHash("sha256").update(artifactBytes).digest("hex");
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("second_continuation_preflight", {
      snapshotId: artifact.facts.snapshotId,
      runnerFactsRevision: artifact.facts.runnerFactsRevision,
      decisionStatus: artifact.decision.status,
      authoringMode: artifact.decision.authoringMode,
      exactReuseApplied: artifact.request.exactReuseApplied,
      paidDispatchRequired: artifact.request.paidDispatchRequired,
      externalProviderDispatchCount: 0,
      artifactSha256,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-continuation-preflight",
      facts: artifact.facts,
      decision: artifact.decision,
      request: artifact.request,
      candidate: artifact.candidate,
      invariants: hostedArtifact.invariants,
      outputPath,
      artifactSha256,
      receiptSha256: hashStableJson(next),
    }),
  );
}

function runHostedContinuationPreflightThroughCanonicalOwner(input) {
  const script = String.raw`
    import { readFileSync } from "node:fs";
    import { prepareAdaptiveContinuationCandidateForUser } from "./src/lib/adaptive-blueprint-actions.server.ts";
    import { getAdaptiveBlueprintContinuationDecisionForUser } from "./src/lib/adaptive-blueprint-read-model.ts";
    import {
      ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      ADAPTIVE_CONTINUATION_COMPILER_VERSION,
      ADAPTIVE_CONTINUATION_PROMPT_VERSION,
      ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
      ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
    } from "./src/lib/adaptive-continuation-authoring.ts";
    import { digestSha256Hex, stableJsonStringify } from "./src/lib/review-token-signing.ts";
    const input = JSON.parse(readFileSync(0, "utf8"));
    const current = await getAdaptiveBlueprintContinuationDecisionForUser({
      userId: input.userId,
      asOfDate: input.asOfDate,
    });
    if (!current?.decision || current.decision.status !== "authoring_ready" || !current.facts) {
      throw new Error("Hosted production-current continuation decision is not authoring-ready.");
    }
    const providerModel = process.env.OPENAI_PLAN_MODEL?.trim() || "gpt-5.2";
    const sentinel = new Error("hito_271_hosted_paid_dispatch_required");
    let captured = null;
    let prepared = null;
    try {
      prepared = await prepareAdaptiveContinuationCandidateForUser(
        { userId: input.userId, asOfDate: input.asOfDate },
        {
          providerModel,
          requestStructuredResponse: async ({ prompt, brief }) => {
            captured = { prompt, brief };
            throw sentinel;
          },
        },
      );
    } catch (error) {
      if (error !== sentinel) throw error;
    }
    const exactReuseApplied = prepared?.ok === true && prepared.state.status === "candidate_ready";
    if (Boolean(captured) === exactReuseApplied) {
      throw new Error("Hosted exact-reuse/provider-dispatch preflight is inconsistent.");
    }
    const promptFingerprint = captured
      ? await digestSha256Hex(stableJsonStringify({
          systemPrompt: captured.prompt.systemPrompt,
          userPrompt: captured.prompt.userPrompt,
          responseSchema: captured.prompt.responseSchema,
        }))
      : null;
    const requestFingerprint = await digestSha256Hex(stableJsonStringify({
      ownerUserId: input.userId,
      providerModel,
      decision: current.decision,
      promptFingerprint,
      schemaVersion: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
      promptVersion: ADAPTIVE_CONTINUATION_PROMPT_VERSION,
      policyVersion: current.decision.policyVersion,
      compilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
      contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
    }));
    const snapshot = current.facts.fitnessProfileSnapshot;
    const artifact = {
      artifactVersion: "hito_271_hosted_second_continuation_preflight_v1",
      createdAt: new Date().toISOString(),
      facts: {
        dueOutcomeCount: current.facts.calendar.workouts.length,
        unresolvedOutcomeCount: current.facts.calendar.workouts.filter((workout) => workout.outcome === "unresolved").length,
        fitCurrentCount: current.facts.evidence.workouts.filter((workout) => workout.evidenceState === "fit_current").length,
        completedWithoutFitCount: current.facts.evidence.workouts.filter((workout) => workout.evidenceState === "completed_without_fit").length,
        snapshotId: snapshot.snapshotId,
        runnerFactsRevision: snapshot.runnerFactsRevision,
        cutoffDate: snapshot.cutoffDate,
        formulaVersions: snapshot.formulaVersions,
        profileState: current.decision.fitnessProfile.quality,
        missingReasons: current.decision.fitnessProfile.missingReasons,
        comparableContextKeys: current.decision.comparableContextKeys,
        calendarOutcomeFingerprint: current.facts.calendar.calendarOutcomeFingerprint,
        evidenceRevisionFingerprint: current.facts.evidence.evidenceRevisionFingerprint,
        targetIntervalOccupancyFingerprint: current.facts.targetIntervalOccupancy.calendarOccupancyFingerprint,
      },
      decision: {
        version: current.decision.version,
        policyVersion: current.decision.policyVersion,
        status: current.decision.status,
        authoringMode: current.decision.authoringMode,
        interval: current.decision.interval,
        projectionIds: current.decision.projectionIds,
      },
      request: {
        providerModel,
        requestFingerprint,
        promptFingerprint,
        schemaVersion: ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME,
        promptVersion: ADAPTIVE_CONTINUATION_PROMPT_VERSION,
        policyVersion: current.decision.policyVersion,
        compilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
        contractMode: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
        responseSchemaMode: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
        exactReuseApplied,
        paidDispatchRequired: !exactReuseApplied,
        externalProviderDispatchCount: 0,
      },
      candidate: exactReuseApplied ? {
        id: prepared.state.candidate.id,
        sha256: prepared.state.candidate.sha256,
        blockMode: prepared.state.candidate.blockMode,
        interval: prepared.state.candidate.interval,
      } : null,
      invariants: {
        rawResponseIncluded: false,
        rawPromptIncluded: false,
        personalIdentityUsed: false,
      },
    };
    console.log(JSON.stringify(artifact));
  `;
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", script],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.supabasePublishableKey,
        SUPABASE_SECRET_KEY: config.supabaseServerKey,
      },
      input: JSON.stringify(input),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (child.status !== 0) {
    const safeMessage = String(child.stderr ?? "")
      .split("\n")
      .find((line) => line.trim().startsWith("Error:") || line.includes("AssertionError"))
      ?.trim()
      .slice(0, 240);
    throw new Error(
      `Canonical continuation preflight failed with status ${child.status}${safeMessage ? ` (${safeMessage})` : ""}.`,
    );
  }
  return JSON.parse(child.stdout);
}

async function handleHostedPoolAttemptLedger() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  const attemptsRead = await supabase
    .from("ai_plan_generation_responses")
    .select(
      "id, generation_id, provider_response_id, response_sha256, schema_outcome, compiler_outcome, diagnostic_code, diagnostic_path, request_fingerprint_sha256, version_context, version_fingerprint_sha256, provider_model, provider_attempt, attempt_result, created_at",
    )
    .eq("user_id", receipt.userId)
    .order("created_at", { ascending: true });
  if (attemptsRead.error) {
    throw new Error(attemptsRead.error.message);
  }
  const attempts = (attemptsRead.data ?? []).map((row, index) => {
    const usage = row.provider_attempt?.usage ?? {};
    const inputTokens = Number(usage.inputTokens ?? 0);
    const outputTokens = Number(usage.outputTokens ?? 0);
    const derivedUsd = inputTokens * (1.75 / 1_000_000) + outputTokens * (14 / 1_000_000);
    return {
      ordinal: index + 1,
      scenario: String(row.version_context?.promptVersion ?? "").startsWith(
        "adaptive_continuation_",
      )
        ? "continuation"
        : "initial_plan",
      responseId: row.id,
      providerResponseId: row.provider_response_id,
      responseSha256: row.response_sha256,
      requestFingerprintSha256: row.request_fingerprint_sha256,
      versionFingerprintSha256: row.version_fingerprint_sha256,
      providerModel: row.provider_model,
      versionContext: row.version_context,
      usage,
      requestStartedAt: row.provider_attempt?.requestStartedAt ?? null,
      responseReceivedAt: row.provider_attempt?.responseReceivedAt ?? null,
      providerElapsedMs: row.provider_attempt?.providerElapsedMs ?? null,
      schemaOutcome: row.schema_outcome,
      compilerOutcome: row.compiler_outcome,
      diagnosticCode: row.diagnostic_code,
      diagnosticPath: row.diagnostic_path,
      attemptResult: row.attempt_result,
      cost: {
        classification: "derived_rate_card",
        currency: "USD",
        derivedAmount: derivedUsd.toFixed(8),
        actualSpend: false,
      },
    };
  });
  const ledger = {
    artifactKind: "hito271_hosted_provider_attempt_ledger_v2",
    generatedAt: new Date().toISOString(),
    task: "HITO-271",
    projectRef: receipt.projectRef,
    userId: receipt.userId,
    attempts,
    privacy: {
      rawProviderContentIncluded: false,
      rawPromptIncluded: false,
      credentialIncluded: false,
      runnerPiiIncluded: false,
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  await writeFile(outputPath, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const ledgerSha256 = hashStableJson(ledger);
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("provider_attempt_ledger", {
      attemptCount: attempts.length,
      ledgerSha256,
      rawProviderContentIncluded: false,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  const latest = attempts.at(-1) ?? null;
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-attempt-ledger",
      attemptCount: attempts.length,
      latest,
      outputPath,
      ledgerSha256,
      receiptSha256: hashStableJson(next),
    }),
  );
}

async function handleHostedPoolLatestDiagnostic() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  const responseRead = await supabase
    .from("ai_plan_generation_responses")
    .select(
      "id, response_sha256, response_body, diagnostic_code, diagnostic_path, compiler_outcome, created_at",
    )
    .eq("user_id", receipt.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (responseRead.error || !responseRead.data) {
    throw new Error(responseRead.error?.message ?? "Hosted provider attempt is unavailable.");
  }
  const diagnosticPath = responseRead.data.diagnostic_path;
  if (
    responseRead.data.compiler_outcome !== "rejected" ||
    typeof diagnosticPath !== "string" ||
    !diagnosticPath
  ) {
    throw new Error("Latest hosted provider attempt has no rejected compiler diagnostic.");
  }
  const diagnostic = summarizeHostedProviderDiagnostic(
    JSON.parse(responseRead.data.response_body),
    diagnosticPath,
  );
  const artifact = {
    artifactKind: "hito271_hosted_provider_diagnostic_v1",
    task: "HITO-271",
    responseId: responseRead.data.id,
    responseSha256: responseRead.data.response_sha256,
    diagnosticCode: responseRead.data.diagnostic_code,
    diagnosticPath,
    diagnostic,
    privacy: {
      rawProviderContentIncluded: false,
      rawPromptIncluded: false,
      credentialIncluded: false,
      runnerPiiIncluded: false,
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const artifactSha256 = hashStableJson(artifact);
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("provider_attempt_diagnostic", {
      responseId: responseRead.data.id,
      diagnosticCode: responseRead.data.diagnostic_code,
      diagnosticPath,
      artifactSha256,
      rawProviderContentIncluded: false,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-latest-diagnostic",
      responseId: responseRead.data.id,
      diagnosticCode: responseRead.data.diagnostic_code,
      diagnosticPath,
      diagnostic,
      outputPath,
      artifactSha256,
      receiptSha256: hashStableJson(next),
    }),
  );
}

function summarizeHostedProviderDiagnostic(responseBody, diagnosticPath) {
  const date = diagnosticPath.split(".")[0];
  const detailed = responseBody?.detailed_block;
  const workouts = [
    ...(Array.isArray(detailed?.workouts) ? detailed.workouts : []),
    ...(detailed?.final_workout ? [detailed.final_workout] : []),
  ];
  const workout = workouts.find((value) => value?.date === date);
  const sectionIndex = Number(diagnosticPath.match(/sections\.(\d+)/)?.[1]);
  const childIndex = Number(diagnosticPath.match(/children\.(\d+)/)?.[1]);
  const section = Number.isInteger(sectionIndex) ? workout?.sections?.[sectionIndex] : null;
  const child = Number.isInteger(childIndex) ? section?.children?.[childIndex] : null;
  if (!workout || !section || !child) {
    throw new Error("Latest provider diagnostic path does not resolve to one repeat child.");
  }
  return {
    date,
    workoutIdentity: workout.workout_identity ?? null,
    sectionKind: section.kind ?? null,
    rounds: section.rounds ?? null,
    childRole: child.role ?? null,
    prescription: child.prescription ?? null,
    target: child.target ?? null,
    authoredPurpose: child.cue ?? null,
  };
}

async function handleHostedPoolRecompileTechnical() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  const responseRecordId = requireOption(options["response-id"], "--response-id");
  const asOfDate = requireOption(options["as-of-date"], "--as-of-date");
  const expectedPromptVersion = requireOption(
    options["expected-prompt-version"],
    "--expected-prompt-version",
  );
  const expectedCompilerVersion = requireOption(
    options["expected-compiler-version"],
    "--expected-compiler-version",
  );
  const expectedDiagnosticCode = requireOption(
    options["expected-diagnostic-code"],
    "--expected-diagnostic-code",
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
    throw new Error("--as-of-date must be one ISO Calendar date.");
  }
  const responseRead = await supabase
    .from("ai_plan_generation_responses")
    .select(
      "id, provider_model, response_sha256, schema_outcome, compiler_outcome, diagnostic_code, attempt_result, version_context, provider_attempt",
    )
    .eq("id", responseRecordId)
    .eq("user_id", receipt.userId)
    .maybeSingle();
  if (responseRead.error || !responseRead.data) {
    throw new Error(responseRead.error?.message ?? "Technical response is unavailable.");
  }
  const beforeCounts = await getQaUserOwnedCounts(supabase, receipt.userId);
  const result = runHostedTechnicalRecompileThroughCanonicalOwner({
    userId: receipt.userId,
    asOfDate,
    providerModel: responseRead.data.provider_model,
    responseRecordId,
    expectedPromptVersion,
    expectedCompilerVersion,
    expectedDiagnosticCode,
  });
  const afterCounts = await getQaUserOwnedCounts(supabase, receipt.userId);
  assert.equal(result.ok, true);
  assert.equal(result.recompiledFromRetainedResponse, true);
  assert.equal(result.providerDispatchCount, 0);
  assert.equal(afterCounts.ai_plan_generation_responses, beforeCounts.ai_plan_generation_responses);
  assert.equal(
    afterCounts.adaptive_training_block_confirmations,
    beforeCounts.adaptive_training_block_confirmations,
  );
  assert.equal(afterCounts.planned_workouts, beforeCounts.planned_workouts);
  assert.ok(
    afterCounts.adaptive_training_detailed_candidates ===
      beforeCounts.adaptive_training_detailed_candidates + 1 ||
      afterCounts.adaptive_training_detailed_candidates ===
        beforeCounts.adaptive_training_detailed_candidates,
  );
  const responseAfter = await supabase
    .from("ai_plan_generation_responses")
    .select(
      "provider_model, response_sha256, compiler_outcome, diagnostic_code, attempt_result, version_context, provider_attempt",
    )
    .eq("id", responseRecordId)
    .eq("user_id", receipt.userId)
    .single();
  if (responseAfter.error) throw new Error(responseAfter.error.message);
  assert.equal(responseAfter.data.provider_model, responseRead.data.provider_model);
  assert.equal(responseAfter.data.response_sha256, responseRead.data.response_sha256);
  assert.deepEqual(responseAfter.data.attempt_result, responseRead.data.attempt_result);
  assert.deepEqual(responseAfter.data.version_context, responseRead.data.version_context);
  assert.deepEqual(responseAfter.data.provider_attempt, responseRead.data.provider_attempt);
  assert.equal(responseAfter.data.compiler_outcome, "rejected");
  assert.equal(responseAfter.data.diagnostic_code, expectedDiagnosticCode);
  const artifact = {
    artifactKind: "hito271_hosted_retained_technical_recompile_v1",
    task: "HITO-271",
    createdAt: new Date().toISOString(),
    response: {
      id: responseRecordId,
      sha256: responseRead.data.response_sha256,
      originalPromptVersion: expectedPromptVersion,
      originalCompilerVersion: expectedCompilerVersion,
      originalDiagnosticCode: expectedDiagnosticCode,
      originalOutcomePreservedImmutably: true,
      recompiledCandidateCompilerVersion: result.compilerVersion,
    },
    candidate: result.candidate,
    providerDispatchCount: 0,
    persistence: {
      responseCountDelta: 0,
      candidateCountDelta:
        afterCounts.adaptive_training_detailed_candidates -
        beforeCounts.adaptive_training_detailed_candidates,
      confirmationCountDelta: 0,
      calendarWorkoutCountDelta: 0,
    },
    privacy: {
      rawProviderContentIncluded: false,
      rawPromptIncluded: false,
      credentialIncluded: false,
      runnerPiiIncluded: false,
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  const artifactBytes = Buffer.from(`${JSON.stringify(artifact, null, 2)}\n`);
  await writeFile(outputPath, artifactBytes, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const artifactSha256 = createHash("sha256").update(artifactBytes).digest("hex");
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("retained_technical_recompile", {
      responseId: responseRecordId,
      candidateId: result.candidate.id,
      candidateSha256: result.candidate.sha256,
      originalCompilerVersion: expectedCompilerVersion,
      recompileCompilerVersion: result.compilerVersion,
      providerDispatchCount: 0,
      artifactSha256,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-recompile-technical",
      responseId: responseRecordId,
      candidate: result.candidate,
      originalOutcomePreservedImmutably: true,
      providerDispatchCount: 0,
      outputPath,
      artifactSha256,
      receiptSha256: hashStableJson(next),
    }),
  );
}

function runHostedTechnicalRecompileThroughCanonicalOwner(input) {
  const script = String.raw`
    import { readFileSync } from "node:fs";
    import { prepareAdaptiveContinuationCandidateForUser } from "./src/lib/adaptive-blueprint-actions.server.ts";
    import { ADAPTIVE_CONTINUATION_COMPILER_VERSION } from "./src/lib/adaptive-continuation-authoring.ts";
    const input = JSON.parse(readFileSync(0, "utf8"));
    const prepared = await prepareAdaptiveContinuationCandidateForUser(
      { userId: input.userId, asOfDate: input.asOfDate },
      {
        providerModel: input.providerModel,
        explicitTechnicallyRejectedRetainedResponseRecompile: {
          responseRecordId: input.responseRecordId,
          expectedPromptVersion: input.expectedPromptVersion,
          expectedCompilerVersion: input.expectedCompilerVersion,
          expectedDiagnosticCode: input.expectedDiagnosticCode,
        },
      },
    );
    if (!prepared.ok || prepared.state.status !== "candidate_ready") {
      throw new Error("The retained technical response did not produce a current candidate.");
    }
    console.log(JSON.stringify({
      ok: true,
      candidate: {
        id: prepared.state.candidate.id,
        sha256: prepared.state.candidate.sha256,
        version: prepared.state.candidate.version,
        interval: prepared.state.candidate.interval,
        blockMode: prepared.state.candidate.blockMode,
      },
      compilerVersion: ADAPTIVE_CONTINUATION_COMPILER_VERSION,
      recompiledFromRetainedResponse: prepared.recompiledFromRetainedResponse,
      providerDispatchCount: prepared.providerDispatchCount,
    }));
  `;
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", script],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.supabasePublishableKey,
        SUPABASE_SECRET_KEY: config.supabaseServerKey,
      },
      input: JSON.stringify(input),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (child.status !== 0) {
    const safeMessage = String(child.stderr ?? "")
      .split("\n")
      .find((line) => line.trim().startsWith("Error:"))
      ?.trim()
      .slice(0, 240);
    throw new Error(
      `Canonical retained-response recompile failed with status ${child.status}${safeMessage ? ` (${safeMessage})` : ""}.`,
    );
  }
  return JSON.parse(child.stdout);
}

async function handleHostedPoolCandidateArtifact() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  const deploymentSha = requireOption(options["deployment-sha"], "--deployment-sha");
  if (!/^[a-f0-9]{40}$/.test(deploymentSha)) {
    throw new Error("--deployment-sha must be one full Git commit SHA.");
  }
  const previewOrigin = requireHostedPreviewOrigin(options["preview-origin"]);
  const responseRead = await supabase
    .from("ai_plan_generation_responses")
    .select(
      "id, generation_id, provider_response_id, response_sha256, schema_outcome, compiler_outcome, diagnostic_code, diagnostic_path, request_fingerprint_sha256, version_context, version_fingerprint_sha256, provider_model, provider_attempt, attempt_result, created_at",
    )
    .eq("user_id", receipt.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (responseRead.error || !responseRead.data) {
    throw new Error(responseRead.error?.message ?? "Hosted provider response is unavailable.");
  }
  if (responseRead.data.schema_outcome !== "accepted") {
    throw new Error("Latest hosted provider response is not schema-accepted.");
  }
  const blueprintRead = await supabase
    .from("adaptive_training_blueprint_versions")
    .select(
      "id, version, content_sha256, blueprint_content, compiler_version, source_contract_version, source_response_id, created_at",
    )
    .eq("user_id", receipt.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (blueprintRead.error || !blueprintRead.data) {
    throw new Error(blueprintRead.error?.message ?? "Hosted Blueprint is unavailable.");
  }
  const candidateRead = await supabase
    .from("adaptive_training_detailed_candidates")
    .select(
      "id, version, candidate_sha256, candidate_content, blueprint_id, source_response_id, interval_start_date, interval_end_date, input_fingerprint_sha256, input_provenance, input_snapshot, fact_references, confirmation_lineage, created_at",
    )
    .eq("user_id", receipt.userId)
    .eq("blueprint_id", blueprintRead.data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (candidateRead.error || !candidateRead.data) {
    throw new Error(candidateRead.error?.message ?? "Hosted candidate is unavailable.");
  }
  const retainedResponseId =
    candidateRead.data.source_response_id ??
    candidateRead.data.input_provenance?.retainedResponseId ??
    null;
  const inputProvenance = candidateRead.data.input_provenance ?? {};
  const retainedTechnicalRecompile =
    inputProvenance.retainedResponseOriginalCompilerOutcome === "rejected" &&
    inputProvenance.recompiledFromCompilerVersion ===
      responseRead.data.version_context?.compilerVersion &&
    inputProvenance.recompiledDiagnosticCode === responseRead.data.diagnostic_code &&
    inputProvenance.compilerVersion !== inputProvenance.recompiledFromCompilerVersion &&
    responseRead.data.compiler_outcome === "rejected" &&
    responseRead.data.attempt_result?.outcome === "technical_rejection" &&
    responseRead.data.attempt_result?.candidateRecordId === null;
  if (
    candidateRead.data.blueprint_id !== blueprintRead.data.id ||
    retainedResponseId !== responseRead.data.id ||
    (responseRead.data.compiler_outcome !== "accepted" && !retainedTechnicalRecompile)
  ) {
    throw new Error("Hosted candidate lineage is not accepted and exact.");
  }
  const confirmationRead = await supabase
    .from("adaptive_training_block_confirmations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", receipt.userId)
    .eq("detailed_candidate_id", candidateRead.data.id);
  if (confirmationRead.error) {
    throw new Error(confirmationRead.error.message);
  }
  const counts = await getQaUserOwnedCounts(supabase, receipt.userId);
  const reviewPayload = {
    blueprint: redactHostedEvidence(blueprintRead.data.blueprint_content),
    candidate: {
      intervalStart: candidateRead.data.interval_start_date,
      intervalEnd: candidateRead.data.interval_end_date,
      content: redactHostedEvidence(candidateRead.data.candidate_content),
      inputSnapshot: redactHostedEvidence(candidateRead.data.input_snapshot),
      factReferences: redactHostedEvidence(candidateRead.data.fact_references),
      confirmationLineage: redactHostedEvidence(candidateRead.data.confirmation_lineage),
    },
  };
  const reviewPayloadSha256 = hashStableJson(reviewPayload);
  const artifact = {
    artifactKind: "hito271_hosted_continuation_candidate_review_v2",
    generatedAt: new Date().toISOString(),
    task: "HITO-271",
    runtimeBoundary: {
      deploymentSha,
      previewOrigin,
      hostedProjectRef: receipt.projectRef,
      providerMode: "openai_responses_api",
      providerModel: responseRead.data.provider_model,
      generationId: responseRead.data.generation_id,
      providerResponseId: responseRead.data.provider_response_id,
      externalProviderDispatchCount: 1,
      responseAttemptExternalProviderDispatchCount: 1,
      candidatePreparationExternalProviderDispatchCount: retainedTechnicalRecompile ? 0 : 1,
    },
    candidateIdentity: {
      responseId: responseRead.data.id,
      responseSha256: responseRead.data.response_sha256,
      requestFingerprintSha256: responseRead.data.request_fingerprint_sha256,
      versionFingerprintSha256: responseRead.data.version_fingerprint_sha256,
      blueprintId: blueprintRead.data.id,
      blueprintVersion: blueprintRead.data.version,
      blueprintSha256: blueprintRead.data.content_sha256,
      candidateId: candidateRead.data.id,
      candidateVersion: candidateRead.data.version,
      candidateSha256: candidateRead.data.candidate_sha256,
    },
    technicalOutcome: {
      schemaOutcome: responseRead.data.schema_outcome,
      compilerOutcome: responseRead.data.compiler_outcome,
      candidateCompilerVersion: inputProvenance.compilerVersion ?? null,
      retainedTechnicalRecompile,
      diagnosticCode: responseRead.data.diagnostic_code,
      diagnosticPath: responseRead.data.diagnostic_path,
      versionContext: responseRead.data.version_context,
      providerAttempt: responseRead.data.provider_attempt,
      attemptResult: responseRead.data.attempt_result,
    },
    reviewPayload,
    persistenceBoundary: {
      counts,
      candidateConfirmationCount: confirmationRead.count ?? 0,
      candidateConfirmed: (confirmationRead.count ?? 0) > 0,
      calendarRowsMaterialized: counts.planned_workouts,
    },
    privacyBoundary: {
      providerContentIncluded: false,
      rawPromptIncluded: false,
      reviewTokenIncluded: false,
      credentialIncluded: false,
      runnerPiiIncluded: false,
    },
    reviewPayloadSha256,
  };
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  const artifactBytes = Buffer.from(`${JSON.stringify(artifact, null, 2)}\n`);
  await writeFile(outputPath, artifactBytes, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const artifactSha256 = createHash("sha256").update(artifactBytes).digest("hex");
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("continuation_candidate_artifact", {
      responseId: responseRead.data.id,
      candidateId: candidateRead.data.id,
      candidateSha256: candidateRead.data.candidate_sha256,
      reviewPayloadSha256,
      artifactSha256,
      candidateConfirmed: false,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-candidate-artifact",
      artifactPath: outputPath,
      artifactSha256,
      reviewPayloadSha256,
      responseId: responseRead.data.id,
      blueprintId: blueprintRead.data.id,
      blueprintSha256: blueprintRead.data.content_sha256,
      candidateId: candidateRead.data.id,
      candidateSha256: candidateRead.data.candidate_sha256,
      counts,
      receiptSha256: hashStableJson(next),
    }),
  );
}

function redactHostedEvidence(value) {
  if (Array.isArray(value)) return value.map(redactHostedEvidence);
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (
      /(?:^|_)(?:user|owner)_?id$/i.test(key) ||
      /email|password|credential|token|raw|prompt|response_body/i.test(key)
    ) {
      continue;
    }
    output[key] = redactHostedEvidence(child);
  }
  return output;
}

async function handleHostedPoolRecordCoachVerdict() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const sourceArtifactPath = requireExternalPrivatePath(
    options["source-artifact"],
    "--source-artifact",
  );
  const verdictArtifactPath = requireExternalPrivatePath(
    options["verdict-artifact"],
    "--verdict-artifact",
  );
  const [sourceBytes, verdictBytes] = await Promise.all([
    readFile(sourceArtifactPath),
    readFile(verdictArtifactPath),
  ]);
  const sourceArtifact = JSON.parse(sourceBytes.toString("utf8"));
  const verdictArtifact = JSON.parse(verdictBytes.toString("utf8"));
  const sourceArtifactSha256 = createHash("sha256").update(sourceBytes).digest("hex");
  const verdictArtifactSha256 = createHash("sha256").update(verdictBytes).digest("hex");
  const candidateIdentity = sourceArtifact.candidateIdentity;
  const approved = verdictArtifact.verdict === "APPROVED";
  const rejected = verdictArtifact.verdict === "REJECTED";
  if (
    sourceArtifact.task !== "HITO-271" ||
    verdictArtifact.task !== "HITO-271" ||
    verdictArtifact.sourceArtifactSha256 !== sourceArtifactSha256 ||
    verdictArtifact.reviewPayloadSha256 !== sourceArtifact.reviewPayloadSha256 ||
    verdictArtifact.responseId !== candidateIdentity?.responseId ||
    verdictArtifact.candidateId !== candidateIdentity?.candidateId ||
    verdictArtifact.candidateSha256 !== candidateIdentity?.candidateSha256 ||
    verdictArtifact.blueprintId !== candidateIdentity?.blueprintId ||
    (!approved && !rejected) ||
    verdictArtifact.safeToConfirm !== approved ||
    typeof verdictArtifact.reviewedOn !== "string"
  ) {
    throw new Error("Running Coach verdict binding is not exact.");
  }
  const candidateRead = await supabase
    .from("adaptive_training_detailed_candidates")
    .select("id, candidate_sha256, blueprint_id, source_response_id")
    .eq("user_id", receipt.userId)
    .eq("id", candidateIdentity.candidateId)
    .eq("candidate_sha256", candidateIdentity.candidateSha256)
    .eq("blueprint_id", candidateIdentity.blueprintId)
    .eq("source_response_id", candidateIdentity.responseId)
    .maybeSingle();
  if (candidateRead.error || !candidateRead.data) {
    throw new Error(candidateRead.error?.message ?? "Coach-reviewed candidate is unavailable.");
  }
  const updated = recordHostedCoachVerdictThroughCanonicalOwner({
    userId: receipt.userId,
    responseRecordId: candidateIdentity.responseId,
    reviewer: "running_coach",
    verdict: {
      verdict: approved ? "approved" : "rejected",
      discriminator: approved ? null : verdictArtifact.discriminator,
      reviewedAt: verdictArtifact.reviewedOn,
    },
  });
  const recordedVerdict = updated.running_coach_verdict;
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("running_coach_verdict", {
      responseId: candidateIdentity.responseId,
      candidateId: candidateIdentity.candidateId,
      candidateSha256: candidateIdentity.candidateSha256,
      verdict: approved ? "approved" : "rejected",
      safeToConfirm: approved,
      sourceArtifactSha256,
      verdictArtifactSha256,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-record-coach-verdict",
      responseId: candidateIdentity.responseId,
      candidateId: candidateIdentity.candidateId,
      verdict: approved ? "approved" : "rejected",
      safeToConfirm: approved,
      recordedVerdict,
      sourceArtifactSha256,
      verdictArtifactSha256,
      receiptSha256: hashStableJson(next),
    }),
  );
}

function recordHostedCoachVerdictThroughCanonicalOwner(input) {
  const script = String.raw`
    import { readFileSync } from "node:fs";
    import { recordAiPlanGenerationReviewVerdictForUser } from "./src/lib/ai-plan-generation-response-persistence.ts";
    const input = JSON.parse(readFileSync(0, "utf8"));
    const updated = await recordAiPlanGenerationReviewVerdictForUser(input);
    console.log(JSON.stringify({ id: updated.id, running_coach_verdict: updated.running_coach_verdict }));
  `;
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", script],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.supabasePublishableKey,
        SUPABASE_SECRET_KEY: config.supabaseServerKey,
      },
      input: JSON.stringify(input),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (child.status !== 0) {
    const safeMessage = String(child.stderr ?? "")
      .split("\n")
      .find((line) => line.trim().startsWith("Error:"))
      ?.trim()
      .slice(0, 240);
    throw new Error(
      `Canonical Coach verdict persistence failed with status ${child.status}${safeMessage ? ` (${safeMessage})` : ""}.`,
    );
  }
  return JSON.parse(child.stdout);
}

async function handleHostedPoolConfirmCandidate() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const candidateId = requireOption(options["candidate-id"], "--candidate-id");
  const asOfDate = requireOption(options["as-of-date"], "--as-of-date");
  const outputPath = requireExternalPrivatePath(options.output, "--output");
  const verdictArtifactPath = requireExternalPrivatePath(
    options["verdict-artifact"],
    "--verdict-artifact",
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
    throw new Error("--as-of-date must be one ISO Calendar date.");
  }
  const verdictBytes = await readFile(verdictArtifactPath);
  const verdictArtifact = JSON.parse(verdictBytes.toString("utf8"));
  const verdictArtifactSha256 = createHash("sha256").update(verdictBytes).digest("hex");
  const candidateRead = await supabase
    .from("adaptive_training_detailed_candidates")
    .select(
      "id, candidate_sha256, candidate_content, blueprint_id, source_response_id, interval_start_date, interval_end_date",
    )
    .eq("user_id", receipt.userId)
    .eq("id", candidateId)
    .maybeSingle();
  if (candidateRead.error || !candidateRead.data) {
    throw new Error(candidateRead.error?.message ?? "Coach-approved candidate is unavailable.");
  }
  const responseRead = await supabase
    .from("ai_plan_generation_responses")
    .select("id, running_coach_verdict")
    .eq("user_id", receipt.userId)
    .eq("id", candidateRead.data.source_response_id)
    .maybeSingle();
  if (responseRead.error || !responseRead.data) {
    throw new Error(responseRead.error?.message ?? "Candidate response lineage is unavailable.");
  }
  if (
    verdictArtifact.verdict !== "APPROVED" ||
    verdictArtifact.safeToConfirm !== true ||
    verdictArtifact.responseId !== responseRead.data.id ||
    verdictArtifact.blueprintId !== candidateRead.data.blueprint_id ||
    verdictArtifact.candidateId !== candidateRead.data.id ||
    verdictArtifact.candidateSha256 !== candidateRead.data.candidate_sha256 ||
    responseRead.data.running_coach_verdict?.verdict !== "approved"
  ) {
    throw new Error("The candidate does not have one exact persisted Coach approval.");
  }
  const workoutDocuments = candidateRead.data.candidate_content?.workoutDocuments;
  if (!Array.isArray(workoutDocuments) || workoutDocuments.length === 0) {
    throw new Error("The Coach-approved candidate has no canonical WorkoutDocuments.");
  }
  const beforeCounts = await getQaUserOwnedCounts(supabase, receipt.userId);
  const existingConfirmation = await supabase
    .from("adaptive_training_block_confirmations")
    .select("id, candidate_sha256, calendar_workout_ids")
    .eq("user_id", receipt.userId)
    .eq("detailed_candidate_id", candidateId)
    .maybeSingle();
  if (existingConfirmation.error) throw new Error(existingConfirmation.error.message);
  const confirmationResult = existingConfirmation.data
    ? {
        resumed: true,
        reviewChecksum: null,
        reviewTokenSha256: null,
        outcome: "confirmed",
      }
    : runHostedCandidateConfirmationThroughCanonicalOwner({
        userId: receipt.userId,
        candidateId,
        asOfDate,
      });
  const confirmationRead = await supabase
    .from("adaptive_training_block_confirmations")
    .select(
      "id, blueprint_id, detailed_candidate_id, predecessor_confirmation_id, candidate_sha256, block_mode, interval_start_date, interval_end_date, calendar_workout_ids",
    )
    .eq("user_id", receipt.userId)
    .eq("detailed_candidate_id", candidateId)
    .single();
  if (confirmationRead.error) throw new Error(confirmationRead.error.message);
  const afterCounts = await getQaUserOwnedCounts(supabase, receipt.userId);
  assert.equal(confirmationRead.data.candidate_sha256, candidateRead.data.candidate_sha256);
  assert.equal(confirmationRead.data.blueprint_id, candidateRead.data.blueprint_id);
  assert.equal(confirmationRead.data.interval_start_date, candidateRead.data.interval_start_date);
  assert.equal(confirmationRead.data.interval_end_date, candidateRead.data.interval_end_date);
  assert.equal(confirmationRead.data.calendar_workout_ids.length, workoutDocuments.length);
  assert.equal(
    afterCounts.adaptive_training_block_confirmations,
    beforeCounts.adaptive_training_block_confirmations + (existingConfirmation.data ? 0 : 1),
  );
  assert.equal(
    afterCounts.planned_workouts,
    beforeCounts.planned_workouts + (existingConfirmation.data ? 0 : workoutDocuments.length),
  );
  const readback = await readAdaptiveBlueprintProjectionFixture({
    supabase,
    userId: receipt.userId,
    asOfDate,
  });
  assert.equal(readback.source.latestConfirmationId, confirmationRead.data.id);
  assert.equal(readback.source.confirmedCalendarWorkoutCount, afterCounts.planned_workouts);
  assert.equal(readback.projections.calendarRowCount, 0);
  const artifact = {
    artifactKind: "hito271_hosted_sealed_candidate_confirmation_v1",
    task: "HITO-271",
    createdAt: new Date().toISOString(),
    candidate: {
      id: candidateRead.data.id,
      sha256: candidateRead.data.candidate_sha256,
      intervalStartDate: candidateRead.data.interval_start_date,
      intervalEndDate: candidateRead.data.interval_end_date,
      workoutDocumentCount: workoutDocuments.length,
    },
    coachVerdict: {
      verdict: "approved",
      safeToConfirm: true,
      artifactSha256: verdictArtifactSha256,
    },
    sealedCommand: confirmationResult,
    confirmation: confirmationRead.data,
    persistence: {
      beforeCounts,
      afterCounts,
      futureProjectionCalendarRowCount: readback.projections.calendarRowCount,
      projectionExecutableFieldsExposed: readback.projections.executableFieldsExposed,
    },
    providerDispatchCount: 0,
    privacy: {
      reviewTokenIncluded: false,
      rawProviderContentIncluded: false,
      credentialIncluded: false,
      runnerPiiIncluded: false,
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  const artifactBytes = Buffer.from(`${JSON.stringify(artifact, null, 2)}\n`);
  await writeFile(outputPath, artifactBytes, { mode: 0o600 });
  await chmod(outputPath, 0o600);
  const artifactSha256 = createHash("sha256").update(artifactBytes).digest("hex");
  const next = appendHostedCheckpoint(
    receipt,
    hostedCheckpoint("sealed_candidate_confirmation", {
      candidateId,
      candidateSha256: candidateRead.data.candidate_sha256,
      confirmationId: confirmationRead.data.id,
      calendarWorkoutCount: afterCounts.planned_workouts,
      providerDispatchCount: 0,
      artifactSha256,
    }),
  );
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-confirm-candidate",
      candidateId,
      candidateSha256: candidateRead.data.candidate_sha256,
      confirmationId: confirmationRead.data.id,
      resumed: confirmationResult.resumed,
      calendarWorkoutCount: afterCounts.planned_workouts,
      futureProjectionCalendarRowCount: readback.projections.calendarRowCount,
      providerDispatchCount: 0,
      outputPath,
      artifactSha256,
      receiptSha256: hashStableJson(next),
    }),
  );
}

function runHostedCandidateConfirmationThroughCanonicalOwner(input) {
  const script = String.raw`
    import { createHash } from "node:crypto";
    import { readFileSync } from "node:fs";
    import { reviewWorkoutCommandForUser, confirmWorkoutCommandForUser } from "./src/lib/manual-workout-authoring/actions.ts";
    const input = JSON.parse(readFileSync(0, "utf8"));
    const review = await reviewWorkoutCommandForUser(
      input.userId,
      {
        operation: "materialize_source_candidate",
        source: { kind: "adaptive_continuation_candidate", candidateId: input.candidateId },
      },
      { adaptiveContinuationAsOfDate: input.asOfDate },
    );
    if (!review.ok) throw new Error(review.issues[0]?.message ?? "Candidate review failed.");
    const confirmed = await confirmWorkoutCommandForUser(
      input.userId,
      {
        command: review.candidate.command,
        candidateId: review.candidate.candidateId,
        reviewToken: review.candidate.reviewToken,
        reviewChecksum: review.candidate.reviewChecksum,
      },
      { adaptiveContinuationAsOfDate: input.asOfDate },
    );
    if (!confirmed.ok) throw new Error(confirmed.message ?? "Candidate confirmation failed.");
    console.log(JSON.stringify({
      resumed: false,
      reviewChecksum: review.candidate.reviewChecksum,
      reviewTokenSha256: createHash("sha256").update(review.candidate.reviewToken).digest("hex"),
      reviewedDocumentCount: review.candidate.command.documents.length,
      outcome: "confirmed",
    }));
  `;
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", script],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.supabasePublishableKey,
        SUPABASE_SECRET_KEY: config.supabaseServerKey,
      },
      input: JSON.stringify(input),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (child.status !== 0) {
    const safeMessage = String(child.stderr ?? "")
      .split("\n")
      .find((line) => line.trim().startsWith("Error:"))
      ?.trim()
      .slice(0, 240);
    throw new Error(
      `Canonical sealed candidate confirmation failed with status ${child.status}${safeMessage ? ` (${safeMessage})` : ""}.`,
    );
  }
  return JSON.parse(child.stdout);
}

async function handleHostedPoolReset() {
  const { receiptPath, receipt } = await readCurrentHostedReceipt();
  const beforeCounts = await getQaUserOwnedCounts(supabase, receipt.userId);
  const afterCounts = await resetQaPoolUserData({
    supabase,
    userId: receipt.userId,
    preserveProfile: options["preserve-profile"] === "true",
    preserveAiPlanGenerationResponseIds: [],
  });
  if (Object.values(afterCounts).some((count) => count !== 0)) {
    throw new Error("Hosted QA pool reset did not reach zero.");
  }
  await releaseQaPoolLease({ role: receipt.role, token: receipt.leaseToken });
  const next = {
    ...appendHostedCheckpoint(
      receipt,
      hostedCheckpoint("domain_state_reset", { beforeCounts, afterCounts }),
    ),
    leaseReleasedAt: new Date().toISOString(),
  };
  await writeHostedReceipt(receiptPath, next);
  console.log(
    JSON.stringify({
      ok: true,
      action: "hosted-pool-reset",
      userId: receipt.userId,
      authIdentityRetained: true,
      afterCounts,
      receiptPath,
      receiptSha256: hashStableJson(next),
    }),
  );
}

async function readCurrentHostedReceipt() {
  const role = requireHostedAdaptivePoolRole();
  const receiptPath = requireHostedReceiptPath();
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  if (
    receipt.task !== "HITO-271" ||
    receipt.projectRef !== config.hostedProjectRef ||
    receipt.role !== role ||
    typeof receipt.userId !== "string" ||
    typeof receipt.leaseToken !== "string"
  ) {
    throw new Error("Hosted QA pool receipt identity mismatch.");
  }
  const authUser = await assertQaPoolAuthUser({
    supabase,
    role,
    userId: receipt.userId,
  });
  await assertQaPoolLease({ role, token: receipt.leaseToken });
  if (
    !String(authUser.email ?? "")
      .toLowerCase()
      .endsWith(".invalid")
  ) {
    throw new Error("Hosted QA pool receipt no longer names a .invalid identity.");
  }
  return { receiptPath, receipt, authUser };
}

function requireHostedAdaptivePoolRole() {
  const role = requireQaPoolRole(options.role);
  if (role !== "adaptive-training-quality") {
    throw new Error("Hosted HITO-271 lifecycle is restricted to adaptive-training-quality.");
  }
  return role;
}

function requireHostedReceiptPath() {
  return requireExternalPrivatePath(options.receipt, "--receipt");
}

function requireExternalPrivatePath(value, label) {
  const resolved = path.resolve(requireOption(value, label));
  const relative = path.relative(process.cwd(), resolved);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error(`${label} must be outside the repository checkout.`);
  }
  return resolved;
}

function requireHostedPreviewOrigin(value) {
  const parsed = new URL(requireOption(value, "--preview-origin"));
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".vercel.app")) {
    throw new Error("--preview-origin must be an HTTPS Vercel Preview origin.");
  }
  return parsed.origin;
}

function hostedCheckpoint(name, evidence) {
  return { name, recordedAt: new Date().toISOString(), evidence };
}

function appendHostedCheckpoint(receipt, checkpoint) {
  return { ...receipt, checkpoints: [...receipt.checkpoints, checkpoint] };
}

async function writeHostedReceipt(receiptPath, receipt, { create = false } = {}) {
  await mkdir(path.dirname(receiptPath), { recursive: true, mode: 0o700 });
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    mode: 0o600,
    ...(create ? { flag: "wx" } : {}),
  });
  await chmod(receiptPath, 0o600);
  const receiptStat = await stat(receiptPath);
  if ((receiptStat.mode & 0o777) !== 0o600) {
    throw new Error("Hosted QA pool receipt mode must be 0600.");
  }
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

async function buildConfig() {
  const supabaseUrl = requireOption(
    readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const hostedProjectRef = options["trusted-hosted-project-ref"] ?? null;
  const hostedKeyInventory =
    HOSTED_POOL_COMMANDS.has(command) && options["api-key-inventory-stdin"] === "true"
      ? JSON.parse(await readStdin())
      : null;
  const suppliedServerKey = readEnv("SUPABASE_SECRET_KEY");
  const supabaseServerKey =
    suppliedServerKey ?? (hostedKeyInventory ? findCurrentSecretKey(hostedKeyInventory) : null);
  const supabasePublishableKey =
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    (hostedKeyInventory ? findCurrentPublishableKey(hostedKeyInventory) : null);
  requireOption(supabaseServerKey, "SUPABASE_SECRET_KEY");

  if (!isLoopbackRuntimeUrl(supabaseUrl)) {
    const parsed = new URL(supabaseUrl);
    if (
      !HOSTED_POOL_COMMANDS.has(command) ||
      typeof hostedProjectRef !== "string" ||
      !/^[a-z0-9]{20}$/.test(hostedProjectRef) ||
      parsed.protocol !== "https:" ||
      parsed.hostname !== `${hostedProjectRef}.supabase.co`
    ) {
      throw new Error(
        "Refusing hosted test-user access without an exact hosted pool command and matching --trusted-hosted-project-ref.",
      );
    }
    return {
      supabaseUrl: parsed.origin,
      supabaseServerKey,
      supabasePublishableKey: requireOption(
        supabasePublishableKey,
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ),
      hostedProjectRef,
      accountsFilePath: null,
    };
  }

  if (HOSTED_POOL_COMMANDS.has(command)) {
    throw new Error(
      "Hosted pool commands require a non-loopback Supabase target and exact project admission.",
    );
  }

  return {
    supabaseUrl,
    supabaseServerKey,
    supabasePublishableKey: null,
    hostedProjectRef: null,
    accountsFilePath: path.resolve(
      process.cwd(),
      readEnv("LOCAL_AUTH_BYPASS_ACCOUNTS_FILE") ?? DEFAULT_LOCAL_AUTH_ACCOUNTS_FILE,
    ),
  };
}

function findCurrentSecretKey(value) {
  const values = [];
  visitValues(value, values);
  const secret = values.find((candidate) => candidate.startsWith("sb_secret_"));
  if (!secret) {
    throw new Error("The current hosted Supabase secret-key class is unavailable.");
  }
  return secret;
}

function findCurrentPublishableKey(value) {
  const values = [];
  visitValues(value, values);
  const publishable = values.find((candidate) => candidate.startsWith("sb_publishable_"));
  if (!publishable) {
    throw new Error("The current hosted Supabase publishable-key class is unavailable.");
  }
  return publishable;
}

function visitValues(value, output) {
  if (typeof value === "string") {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) visitValues(item, output);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) visitValues(item, output);
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const value = Buffer.concat(chunks).toString("utf8").trim();
  if (!value) throw new Error("Hosted Supabase key inventory input is empty.");
  return value;
}

function hashStableJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
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
