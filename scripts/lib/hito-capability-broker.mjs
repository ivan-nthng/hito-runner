import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export const HITO_EXECUTION_INTENT_VERSION = "hito_execution_intent_v1";
export const HITO_DESTINATION_ACKNOWLEDGEMENT_VERSION = "hito_destination_acknowledgement_v1";
export const HITO_CAPABILITY_ADMISSION_RECEIPT_VERSION = "hito_capability_admission_receipt_v1";
export const HITO_EXECUTION_ARTIFACT_MANIFEST_VERSION = "hito_execution_artifact_manifest_v3";

export const HITO_BROKER_CAPABILITIES = Object.freeze([
  "notion_lifecycle",
  "role_delivery",
  "git_release_deploy",
  "docker_supabase_runtime",
  "build_cache_artifact",
  "browser",
  "provider_hosted_destructive",
]);

const CAPABILITY_SET = new Set(HITO_BROKER_CAPABILITIES);

export class HitoCapabilityBrokerError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "HitoCapabilityBrokerError";
    this.code = code;
  }
}

export async function createExecutionIntentV1(input) {
  const task = requireObject(input?.task, "task_missing");
  const source = requireObject(input?.source, "source_missing");
  const operation = requireObject(input?.operation, "operation_missing");
  const destination = requireObject(input?.destination, "destination_missing");
  const capability = requireString(operation.requestedCapability, "capability_missing");
  if (!CAPABILITY_SET.has(capability)) {
    fail("capability_unknown", `Unknown broker capability: ${capability}.`);
  }

  const repositoryRealPath = await resolveExistingDirectory(
    source.repositoryRoot,
    "repository_missing",
  );
  const worktreeRealPath = await resolveExistingDirectory(source.worktreeRoot, "worktree_missing");
  const cwdRealPath = await resolveExistingDirectory(source.cwd, "cwd_missing");
  if (!pathIsWithin(worktreeRealPath, cwdRealPath)) {
    fail("cwd_mismatch", "The resolved cwd is outside the admitted worktree.");
  }

  const pathManifest = await snapshotAdmittedPaths(
    worktreeRealPath,
    requireArray(source.admittedPaths, "source_paths_missing"),
  );
  const intent = deepFreeze({
    version: HITO_EXECUTION_INTENT_VERSION,
    intentId: requireString(input.intentId, "intent_id_missing"),
    createdAt: requireTimestamp(input.createdAt, "intent_timestamp_missing"),
    task: {
      taskId: requireString(task.taskId, "task_id_missing"),
      pageId: requireString(task.pageId, "task_page_missing"),
      expectedRevision: requireString(task.expectedRevision, "task_revision_missing"),
      currentOwner: requireString(task.currentOwner, "task_owner_missing"),
      sourceOwner: requireString(task.sourceOwner, "source_owner_missing"),
      scope: requireString(task.scope, "scope_missing"),
      acceptanceAuthority: requireString(task.acceptanceAuthority, "acceptance_authority_missing"),
    },
    source: {
      repositoryIdentity: requireString(source.repositoryIdentity, "repository_identity_missing"),
      repositoryRealPath,
      worktreeRealPath,
      cwdRealPath,
      baseRevision: requireString(source.baseRevision, "base_revision_missing"),
      branch: requireString(source.branch, "branch_missing"),
      indexState: requireExactValue(source.indexState, "empty", "index_state_invalid"),
      admittedPaths: pathManifest,
      unrelatedDirtyFingerprint: requireSha256(
        source.unrelatedDirtyFingerprint,
        "dirty_fingerprint_missing",
      ),
    },
    operation: {
      kind: requireString(operation.kind, "operation_kind_missing"),
      requestedCapability: capability,
      environmentIdentity: requireString(
        operation.environmentIdentity,
        "environment_identity_missing",
      ),
      externalActionAuthority: requireString(
        operation.externalActionAuthority,
        "external_authority_missing",
      ),
      rollback: normalizeObligation(operation.rollback, "rollback_missing"),
      cleanup: normalizeObligation(operation.cleanup, "cleanup_missing"),
      requiredProof: requireString(operation.requiredProof, "required_proof_missing"),
    },
    destination: {
      owner: requireString(destination.owner, "destination_owner_missing"),
      threadId: requireString(destination.threadId, "destination_thread_missing"),
    },
  });

  return sealIntent(intent);
}

export async function admitExecutionIntentV1(input) {
  return admit({ ...input, rehomeCount: 0, unavailableStatus: "rehome_required" });
}

export async function rehomeExecutionIntentV1(input) {
  const prior = requireSealedReceipt(input.priorAdmission);
  if (prior.receipt.status !== "rehome_required" || prior.receipt.rehomeCount !== 0) {
    fail("rehome_exhausted", "The unchanged operation has no remaining re-home attempt.");
  }
  if (prior.receipt.intentSha256 !== input.sealedIntent?.intentSha256) {
    fail("intent_changed", "Re-home cannot change the acknowledged execution intent.");
  }
  return admit({ ...input, rehomeCount: 1, unavailableStatus: "blocked" });
}

export async function releaseExecutionLeaseV1({
  admission,
  leaseHandle,
  releasedAt = new Date().toISOString(),
}) {
  const sealed = requireSealedReceipt(admission);
  if (sealed.receipt.status !== "admitted" || !sealed.receipt.lease) {
    fail("lease_missing", "Only an admitted operation owns a releasable lease.");
  }
  const handle = requireObject(leaseHandle, "lease_handle_missing");
  const leaseFile = resolve(sealed.receipt.lease.path, "lease.json");
  const persisted = JSON.parse(await readFile(leaseFile, "utf8"));
  if (
    persisted.leaseId !== sealed.receipt.lease.leaseId ||
    persisted.intentSha256 !== sealed.receipt.intentSha256 ||
    persisted.token !== handle.token
  ) {
    fail("lease_identity_mismatch", "The broker lease identity or token does not match.");
  }
  await rm(sealed.receipt.lease.path, { recursive: true });
  return deepFreeze({
    version: "hito_execution_lease_release_v1",
    leaseId: sealed.receipt.lease.leaseId,
    releasedAt: requireTimestamp(releasedAt, "release_timestamp_missing"),
    released: true,
  });
}

export async function buildExecutionArtifactManifestV1(input) {
  const sealedIntent = requireSealedIntent(input.sealedIntent);
  const admission = requireSealedReceipt(input.admission);
  const acknowledgement = validateDestinationAcknowledgementV1(input.acknowledgement, sealedIntent);
  const admittedAcknowledgement = validateDestinationAcknowledgementV1(
    admission.receipt.acknowledgement,
    sealedIntent,
  );
  if (admission.receipt.status !== "admitted" || !admission.receipt.lease) {
    fail("operation_not_admitted", "An admitted operation is required before manifest creation.");
  }
  if (
    admission.receipt.intentSha256 !== sealedIntent.intentSha256 ||
    admission.receipt.acknowledgementSha256 !== hashCanonical(admittedAcknowledgement) ||
    hashCanonical(acknowledgement) !== hashCanonical(admittedAcknowledgement)
  ) {
    fail("admission_binding_mismatch", "Admission does not match the intent acknowledgement.");
  }
  const execution = requireObject(input.execution, "execution_missing");
  const runtime = requireObject(input.runtime, "runtime_missing");
  const result = requireObject(input.result, "result_missing");
  const isGitRelease = sealedIntent.intent.operation.requestedCapability === "git_release_deploy";
  const actualSource = isGitRelease
    ? await readLiveSourceState(input.readSourceState, sealedIntent)
    : await verifyLiveSourceState(input.readSourceState, sealedIntent);
  const gitRelease = isGitRelease
    ? validateGitReleaseResult({
        sealedIntent,
        actualSource,
        execution: execution.gitRelease,
        result: result.gitRelease,
      })
    : rejectUnexpectedGitRelease(execution.gitRelease, result.gitRelease);
  if (gitRelease?.result.leaseRelease) {
    validateLeaseRelease(gitRelease.result.leaseRelease, admission);
  }
  const postOperationRepositoryState = snapshotPostOperationRepositoryState(
    actualSource,
    gitRelease,
  );
  const postOperationAdmittedPaths = await snapshotAdmittedPaths(
    sealedIntent.intent.source.worktreeRealPath,
    sealedIntent.intent.source.admittedPaths.map((entry) => entry.path),
  );
  const executionCwd = await resolveExistingDirectory(execution.cwd, "execution_cwd_missing");
  if (executionCwd !== sealedIntent.intent.source.cwdRealPath) {
    fail("execution_cwd_mismatch", "Execution cwd differs from the admitted intent cwd.");
  }
  if (runtime.leaseId !== admission.receipt.lease.leaseId) {
    fail("runtime_lease_mismatch", "Runtime receipt does not bind the active broker lease.");
  }
  const executorHost = requireBoundValue(
    execution.executorHost,
    admission.receipt.executor.hostId,
    "manifest_executor_mismatch",
    "Manifest executor host differs from the admitted executor.",
  );
  const executorSessionId = requireBoundValue(
    execution.executorSessionId,
    admission.receipt.executor.sessionId,
    "manifest_executor_mismatch",
    "Manifest executor session differs from the admitted executor.",
  );
  const environmentIdentity = requireBoundValue(
    runtime.environmentIdentity,
    sealedIntent.intent.operation.environmentIdentity,
    "manifest_environment_mismatch",
    "Manifest environment differs from the immutable intent.",
  );
  if (environmentIdentity !== admission.receipt.environmentIdentity) {
    fail(
      "manifest_environment_mismatch",
      "Manifest environment differs from the live capability admission.",
    );
  }
  const admittedProofLayer = requireBoundValue(
    result.admittedProofLayer,
    sealedIntent.intent.operation.requiredProof,
    "manifest_proof_layer_mismatch",
    "Manifest proof layer differs from the immutable required proof.",
  );
  if (admittedProofLayer !== admittedAcknowledgement.admittedBoundary) {
    fail(
      "manifest_proof_layer_mismatch",
      "Manifest proof layer differs from the acknowledged boundary.",
    );
  }

  const artifact = await snapshotArtifact(input.artifact);
  const manifest = deepFreeze({
    version: HITO_EXECUTION_ARTIFACT_MANIFEST_VERSION,
    task: {
      ...sealedIntent.intent.task,
      intentId: sealedIntent.intent.intentId,
      admittedProofLayer,
    },
    source: {
      ...sealedIntent.intent.source,
      intentSha256: sealedIntent.intentSha256,
      sourceManifestSha256: sealedIntent.sourceManifestSha256,
      postOperationRepositoryState,
      postOperationAdmittedPaths,
    },
    acknowledgement: {
      sha256: hashCanonical(admittedAcknowledgement),
      destinationOwner: admittedAcknowledgement.destinationOwner,
      destinationSessionId: admittedAcknowledgement.destinationSessionId,
    },
    execution: {
      commandIdentity: requireString(execution.commandIdentity, "command_identity_missing"),
      toolIdentity: requireString(execution.toolIdentity, "tool_identity_missing"),
      cwdRealPath: executionCwd,
      approvedEnvironmentKeyNames: normalizeStringArray(
        execution.approvedEnvironmentKeyNames,
        "environment_key_names_missing",
      ),
      toolchainVersions: normalizeStringMap(
        execution.toolchainVersions,
        "toolchain_versions_missing",
      ),
      executorHost,
      executorSessionId,
      startedAt: requireTimestamp(execution.startedAt, "execution_start_missing"),
      finishedAt: requireTimestamp(execution.finishedAt, "execution_finish_missing"),
      gitRelease: gitRelease?.execution ?? null,
    },
    runtime: {
      environmentIdentity,
      dockerContext: requireString(runtime.dockerContext, "runtime_docker_context_missing"),
      supabaseProject: requireString(runtime.supabaseProject, "runtime_supabase_project_missing"),
      ports: normalizeIntegerArray(runtime.ports, "runtime_ports_missing"),
      fixtureDataClass: requireString(runtime.fixtureDataClass, "fixture_data_class_missing"),
      providerMode: requireString(runtime.providerMode, "provider_mode_missing"),
      leaseId: runtime.leaseId,
      cleanupRequirement: requireString(runtime.cleanupRequirement, "cleanup_requirement_missing"),
    },
    artifact,
    result: {
      status: requireString(result.status, "result_status_missing"),
      exitCode: requireInteger(result.exitCode, "result_exit_code_missing"),
      redactedEvidencePaths: normalizeStringArray(
        result.redactedEvidencePaths,
        "evidence_paths_missing",
        true,
      ),
      omissions: normalizeStringArray(result.omissions, "omissions_missing", true),
      rollbackResult: requireString(result.rollbackResult, "rollback_result_missing"),
      cleanupResult: requireString(result.cleanupResult, "cleanup_result_missing"),
      nextBoundary: requireString(result.nextBoundary, "next_boundary_missing"),
      admittedProofLayer,
      gitRelease: gitRelease?.result ?? null,
    },
  });
  return deepFreeze({
    manifest,
    manifestSha256: hashCanonical(manifest),
  });
}

export async function verifyExecutionArtifactManifestV1({
  sealedManifest,
  sealedIntent,
  admission,
  readSourceState,
  execution,
  result,
}) {
  const intent = requireSealedIntent(sealedIntent);
  const receipt = requireSealedReceipt(admission);
  const admittedAcknowledgement = validateDestinationAcknowledgementV1(
    receipt.receipt.acknowledgement,
    intent,
  );
  const manifest = requireObject(sealedManifest?.manifest, "manifest_missing");
  if (
    sealedManifest.manifestSha256 !== hashCanonical(manifest) ||
    manifest.version !== HITO_EXECUTION_ARTIFACT_MANIFEST_VERSION
  ) {
    fail("manifest_hash_mismatch", "Execution artifact manifest is not immutable.");
  }
  if (
    manifest.source.intentSha256 !== intent.intentSha256 ||
    manifest.source.sourceManifestSha256 !== intent.sourceManifestSha256 ||
    manifest.runtime.leaseId !== receipt.receipt.lease?.leaseId ||
    receipt.receipt.acknowledgementSha256 !== hashCanonical(admittedAcknowledgement) ||
    manifest.acknowledgement.sha256 !== hashCanonical(admittedAcknowledgement) ||
    manifest.acknowledgement.destinationOwner !== admittedAcknowledgement.destinationOwner ||
    manifest.acknowledgement.destinationSessionId !==
      admittedAcknowledgement.destinationSessionId ||
    manifest.execution.executorHost !== receipt.receipt.executor.hostId ||
    manifest.execution.executorSessionId !== receipt.receipt.executor.sessionId ||
    manifest.runtime.environmentIdentity !== intent.intent.operation.environmentIdentity ||
    manifest.runtime.environmentIdentity !== receipt.receipt.environmentIdentity ||
    manifest.task.admittedProofLayer !== intent.intent.operation.requiredProof ||
    manifest.result.admittedProofLayer !== intent.intent.operation.requiredProof
  ) {
    fail("manifest_binding_mismatch", "Manifest identity does not match intent and admission.");
  }
  const postOperationAdmittedPaths = manifest.source.postOperationAdmittedPaths;
  const postOperationRepositoryState = manifest.source.postOperationRepositoryState;
  const manifestPreOperationSource = { ...manifest.source };
  delete manifestPreOperationSource.intentSha256;
  delete manifestPreOperationSource.sourceManifestSha256;
  delete manifestPreOperationSource.postOperationAdmittedPaths;
  delete manifestPreOperationSource.postOperationRepositoryState;
  if (hashCanonical(manifestPreOperationSource) !== hashCanonical(intent.intent.source)) {
    fail(
      "manifest_binding_mismatch",
      "Manifest pre-operation source identity differs from the immutable intent.",
    );
  }
  const isGitRelease = intent.intent.operation.requestedCapability === "git_release_deploy";
  const actualSource = isGitRelease
    ? await readLiveSourceState(readSourceState, intent)
    : await verifyLiveSourceState(readSourceState, intent);
  const gitRelease = isGitRelease
    ? validateGitReleaseResult({
        sealedIntent: intent,
        actualSource,
        execution: execution?.gitRelease,
        result: result?.gitRelease,
      })
    : rejectUnexpectedGitRelease(manifest.execution.gitRelease, manifest.result.gitRelease);
  if (
    gitRelease &&
    (hashCanonical(gitRelease.execution) !== hashCanonical(manifest.execution.gitRelease) ||
      hashCanonical(gitRelease.result) !== hashCanonical(manifest.result.gitRelease))
  ) {
    fail(
      "manifest_binding_mismatch",
      "Manifest Git release proof differs from the explicit execution result.",
    );
  }
  if (
    hashCanonical(snapshotPostOperationRepositoryState(actualSource, gitRelease)) !==
    hashCanonical(postOperationRepositoryState)
  ) {
    fail(
      "post_operation_repository_changed",
      "The repository state differs from the sealed post-operation snapshot.",
    );
  }
  const currentPostOperationAdmittedPaths = await snapshotAdmittedPaths(
    intent.intent.source.worktreeRealPath,
    intent.intent.source.admittedPaths.map((entry) => entry.path),
  );
  if (
    !Array.isArray(postOperationAdmittedPaths) ||
    hashCanonical(currentPostOperationAdmittedPaths) !== hashCanonical(postOperationAdmittedPaths)
  ) {
    fail(
      "post_operation_source_changed",
      "The admitted source paths differ from the sealed post-operation snapshot.",
    );
  }
  const currentArtifact = await snapshotArtifact({
    path: manifest.artifact.path,
    identity: manifest.artifact.identity,
  });
  if (hashCanonical(currentArtifact) !== hashCanonical(manifest.artifact)) {
    fail("artifact_changed", "The bound execution artifact moved after manifest creation.");
  }
  if (gitRelease?.result.leaseRelease) {
    validateLeaseRelease(gitRelease.result.leaseRelease, receipt);
  } else {
    await stat(resolve(receipt.receipt.lease.path, "lease.json"));
  }
  return true;
}

export async function verifyIntentSourceV1(sealedIntent) {
  const sealed = requireSealedIntent(sealedIntent);
  const intent = sealed.intent;
  const [repositoryRealPath, worktreeRealPath, cwdRealPath] = await Promise.all([
    resolveExistingDirectory(intent.source.repositoryRealPath, "repository_missing"),
    resolveExistingDirectory(intent.source.worktreeRealPath, "worktree_missing"),
    resolveExistingDirectory(intent.source.cwdRealPath, "cwd_missing"),
  ]);
  if (
    repositoryRealPath !== intent.source.repositoryRealPath ||
    worktreeRealPath !== intent.source.worktreeRealPath ||
    cwdRealPath !== intent.source.cwdRealPath ||
    !pathIsWithin(worktreeRealPath, cwdRealPath)
  ) {
    fail("source_identity_changed", "Repository, worktree or cwd identity changed.");
  }
  const currentPaths = await snapshotAdmittedPaths(
    worktreeRealPath,
    intent.source.admittedPaths.map((entry) => entry.path),
  );
  if (hashCanonical(currentPaths) !== hashCanonical(intent.source.admittedPaths)) {
    fail("source_changed", "An admitted source path hash or mode changed.");
  }
  return true;
}

export function hashCanonical(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

async function admit(input) {
  const sealedIntent = requireSealedIntent(input.sealedIntent);
  const acknowledgement = validateDestinationAcknowledgementV1(input.acknowledgement, sealedIntent);
  if (typeof input.readTaskState !== "function") {
    fail("task_readback_missing", "Live Task readback capability is required.");
  }
  if (typeof input.readSourceState !== "function") {
    fail("source_readback_missing", "Live repository source readback is required.");
  }
  if (typeof input.probeRequestedCapability !== "function") {
    fail("capability_probe_missing", "A requested-capability probe is required.");
  }
  await verifyIntentSourceV1(sealedIntent);
  await verifyLiveSourceState(input.readSourceState, sealedIntent);
  const liveTask = await input.readTaskState({
    taskId: sealedIntent.intent.task.taskId,
    pageId: sealedIntent.intent.task.pageId,
  });
  assertLiveTaskMatchesIntent(sealedIntent.intent.task, sealedIntent.intent.operation, liveTask);

  const requestedCapability = sealedIntent.intent.operation.requestedCapability;
  const probe = await input.probeRequestedCapability(
    deepFreeze({
      requestedCapability,
      environmentIdentity: sealedIntent.intent.operation.environmentIdentity,
      intentSha256: sealedIntent.intentSha256,
    }),
  );
  const normalizedProbe = normalizeProbe(probe, requestedCapability);
  const executor = normalizeExecutor(input.executor);
  const checkedAt = requireTimestamp(input.checkedAt, "probe_timestamp_missing");
  const acknowledgementSha256 = hashCanonical(acknowledgement);

  if (!normalizedProbe.available) {
    return sealReceipt({
      version: HITO_CAPABILITY_ADMISSION_RECEIPT_VERSION,
      status: input.unavailableStatus,
      intentSha256: sealedIntent.intentSha256,
      sourceManifestSha256: sealedIntent.sourceManifestSha256,
      acknowledgementSha256,
      acknowledgement,
      requestedCapability,
      environmentIdentity: sealedIntent.intent.operation.environmentIdentity,
      executor,
      probe: { ...normalizedProbe, checkedAt },
      rehomeCount: input.rehomeCount,
      lease: null,
      rollback: sealedIntent.intent.operation.rollback,
      cleanup: sealedIntent.intent.operation.cleanup,
    });
  }

  const lease = await acquireExecutionLease({
    leaseRoot: input.leaseRoot,
    sealedIntent,
    capability: requestedCapability,
    executor,
    acquiredAt: checkedAt,
  });
  const sealedReceipt = sealReceipt({
    version: HITO_CAPABILITY_ADMISSION_RECEIPT_VERSION,
    status: "admitted",
    intentSha256: sealedIntent.intentSha256,
    sourceManifestSha256: sealedIntent.sourceManifestSha256,
    acknowledgementSha256,
    acknowledgement,
    requestedCapability,
    environmentIdentity: sealedIntent.intent.operation.environmentIdentity,
    executor,
    probe: { ...normalizedProbe, checkedAt },
    rehomeCount: input.rehomeCount,
    lease: lease.receipt,
    rollback: sealedIntent.intent.operation.rollback,
    cleanup: sealedIntent.intent.operation.cleanup,
  });
  return deepFreeze({ ...sealedReceipt, leaseHandle: lease.handle });
}

function validateDestinationAcknowledgementV1(value, sealedIntent) {
  const acknowledgement = requireObject(value, "acknowledgement_missing");
  const expected = sealedIntent.intent;
  if (acknowledgement.version !== HITO_DESTINATION_ACKNOWLEDGEMENT_VERSION) {
    fail("acknowledgement_version_invalid", "Destination acknowledgement version is invalid.");
  }
  const comparisons = [
    ["taskId", expected.task.taskId],
    ["pageId", expected.task.pageId],
    ["intentSha256", sealedIntent.intentSha256],
    ["sourceManifestSha256", sealedIntent.sourceManifestSha256],
    ["destinationOwner", expected.destination.owner],
    ["admittedBoundary", expected.operation.requiredProof],
  ];
  for (const [field, expectedValue] of comparisons) {
    if (acknowledgement[field] !== expectedValue) {
      fail("acknowledgement_mismatch", `Destination acknowledgement ${field} does not match.`);
    }
  }
  requireString(acknowledgement.destinationSessionId, "acknowledgement_session_missing");
  requireTimestamp(acknowledgement.acknowledgedAt, "acknowledgement_timestamp_missing");
  return deepFreeze(structuredClone(acknowledgement));
}

function assertLiveTaskMatchesIntent(expected, operation, actualValue) {
  const actual = requireObject(actualValue, "task_readback_invalid");
  for (const [field, code] of [
    ["taskId", "task_identity_changed"],
    ["pageId", "task_identity_changed"],
    ["expectedRevision", "task_revision_changed"],
    ["currentOwner", "task_owner_changed"],
    ["sourceOwner", "source_owner_changed"],
    ["scope", "task_scope_changed"],
    ["acceptanceAuthority", "acceptance_authority_changed"],
  ]) {
    if (actual[field] !== expected[field]) {
      fail(code, `Live Task ${field} differs from the immutable intent.`);
    }
  }
  if (actual.externalActionAuthority !== operation.externalActionAuthority) {
    fail(
      "external_authority_changed",
      "Live Task external-action authority differs from the immutable intent.",
    );
  }
}

async function verifyLiveSourceState(readSourceState, sealedIntent) {
  const actual = await readLiveSourceState(readSourceState, sealedIntent);
  for (const [field, code] of [
    ["repositoryIdentity", "repository_identity_changed"],
    ["repositoryRealPath", "repository_identity_changed"],
    ["worktreeRealPath", "worktree_identity_changed"],
    ["cwdRealPath", "cwd_mismatch"],
    ["baseRevision", "base_revision_changed"],
    ["branch", "branch_changed"],
    ["indexState", "index_state_changed"],
    ["unrelatedDirtyFingerprint", "dirty_boundary_changed"],
  ]) {
    if (actual[field] !== sealedIntent.intent.source[field]) {
      fail(code, `Live source ${field} differs from the immutable intent.`);
    }
  }
  return actual;
}

async function readLiveSourceState(readSourceState, sealedIntent) {
  if (typeof readSourceState !== "function") {
    fail("source_readback_missing", "Live repository source readback is required.");
  }
  const actual = requireObject(
    await readSourceState({
      repositoryRealPath: sealedIntent.intent.source.repositoryRealPath,
      worktreeRealPath: sealedIntent.intent.source.worktreeRealPath,
      cwdRealPath: sealedIntent.intent.source.cwdRealPath,
    }),
    "source_readback_invalid",
  );
  for (const [field, code] of [
    ["repositoryIdentity", "repository_identity_changed"],
    ["repositoryRealPath", "repository_identity_changed"],
    ["worktreeRealPath", "worktree_identity_changed"],
    ["cwdRealPath", "cwd_mismatch"],
  ]) {
    if (actual[field] !== sealedIntent.intent.source[field]) {
      fail(code, `Live source ${field} differs from the immutable intent.`);
    }
  }
  return {
    repositoryIdentity: actual.repositoryIdentity,
    repositoryRealPath: actual.repositoryRealPath,
    worktreeRealPath: actual.worktreeRealPath,
    cwdRealPath: actual.cwdRealPath,
    baseRevision: requireString(actual.baseRevision, "base_revision_missing"),
    parentRevision:
      actual.parentRevision == null
        ? null
        : requireString(actual.parentRevision, "parent_revision_missing"),
    remoteRevision:
      actual.remoteRevision == null
        ? null
        : requireString(actual.remoteRevision, "remote_revision_missing"),
    branch: requireString(actual.branch, "branch_missing"),
    indexState: requireString(actual.indexState, "index_state_invalid"),
    unrelatedDirtyFingerprint: requireSha256(
      actual.unrelatedDirtyFingerprint,
      "dirty_fingerprint_missing",
    ),
  };
}

function validateGitReleaseResult({ sealedIntent, actualSource, execution, result }) {
  const expected = requireObject(execution, "git_release_execution_missing");
  const proof = requireObject(result, "git_release_result_missing");
  const admittedPaths = sealedIntent.intent.source.admittedPaths.map((entry) => entry.path).sort();
  const expectedPostRevision = requireGitRevision(
    expected.expectedPostRevision,
    "git_release_post_revision_missing",
  );
  const expectedParentRevision = requireGitRevision(
    expected.expectedParentRevision,
    "git_release_parent_revision_missing",
  );
  const executionChangedPaths = normalizeExactPathSet(
    expected.expectedChangedPaths,
    admittedPaths,
    "git_release_changed_paths_mismatch",
  );
  const commitRevision = requireGitRevision(
    proof.commitRevision,
    "git_release_commit_revision_missing",
  );
  const parentRevision = requireGitRevision(
    proof.parentRevision,
    "git_release_parent_revision_missing",
  );
  const remoteRevision = requireGitRevision(
    proof.remoteRevision,
    "git_release_remote_revision_missing",
  );
  const resultChangedPaths = normalizeExactPathSet(
    proof.changedPaths,
    admittedPaths,
    "git_release_changed_paths_mismatch",
  );
  if (
    expectedParentRevision !== sealedIntent.intent.source.baseRevision ||
    parentRevision !== sealedIntent.intent.source.baseRevision
  ) {
    fail("git_release_parent_mismatch", "Git release parent differs from the admitted revision.");
  }
  if (expectedPostRevision !== commitRevision || remoteRevision !== commitRevision) {
    fail("git_release_revision_mismatch", "Git release revisions do not identify one result.");
  }
  if (actualSource.baseRevision !== commitRevision) {
    fail(
      "post_operation_repository_changed",
      "Live revision differs from the admitted Git result.",
    );
  }
  if (actualSource.parentRevision !== parentRevision) {
    fail("git_release_parent_mismatch", "Live Git parent differs from the admitted release proof.");
  }
  if (actualSource.remoteRevision !== remoteRevision) {
    fail("git_release_remote_mismatch", "Live remote revision differs from the release proof.");
  }
  for (const [field, code] of [
    ["branch", "branch_changed"],
    ["indexState", "index_state_changed"],
    ["unrelatedDirtyFingerprint", "dirty_boundary_changed"],
  ]) {
    if (actualSource[field] !== sealedIntent.intent.source[field]) {
      fail(code, `Post-release source ${field} differs from the immutable intent.`);
    }
  }
  const leaseRelease =
    proof.leaseRelease == null ? null : normalizeLeaseRelease(proof.leaseRelease);
  return {
    execution: {
      expectedPostRevision,
      expectedParentRevision,
      expectedChangedPaths: executionChangedPaths,
    },
    result: {
      commitRevision,
      parentRevision,
      remoteRevision,
      changedPaths: resultChangedPaths,
      leaseRelease,
    },
  };
}

function rejectUnexpectedGitRelease(execution, result) {
  if (execution != null || result != null) {
    fail("git_release_proof_unexpected", "Non-Git operations cannot carry Git release proof.");
  }
  return null;
}

function snapshotPostOperationRepositoryState(actualSource, gitRelease) {
  return {
    repositoryIdentity: actualSource.repositoryIdentity,
    repositoryRealPath: actualSource.repositoryRealPath,
    worktreeRealPath: actualSource.worktreeRealPath,
    cwdRealPath: actualSource.cwdRealPath,
    baseRevision: actualSource.baseRevision,
    parentRevision: gitRelease ? actualSource.parentRevision : null,
    remoteRevision: gitRelease ? actualSource.remoteRevision : null,
    branch: actualSource.branch,
    indexState: actualSource.indexState,
    unrelatedDirtyFingerprint: actualSource.unrelatedDirtyFingerprint,
  };
}

function normalizeExactPathSet(value, expected, code) {
  const paths = normalizeStringArray(value, code).sort();
  if (new Set(paths).size !== paths.length || hashCanonical(paths) !== hashCanonical(expected)) {
    fail(code, "Git release changed paths differ from the admitted path set.");
  }
  return paths;
}

function requireGitRevision(value, code) {
  const revision = requireString(value, code);
  if (!/^[a-f0-9]{40}$/.test(revision)) fail(code, "A canonical Git revision is required.");
  return revision;
}

function normalizeLeaseRelease(value) {
  const release = requireObject(value, "lease_release_missing");
  return {
    version: requireExactValue(
      release.version,
      "hito_execution_lease_release_v1",
      "lease_release_version_invalid",
    ),
    leaseId: requireString(release.leaseId, "lease_release_id_missing"),
    releasedAt: requireTimestamp(release.releasedAt, "lease_release_timestamp_missing"),
    released: requireExactValue(release.released, true, "lease_release_invalid"),
  };
}

function validateLeaseRelease(value, admission) {
  const release = normalizeLeaseRelease(value);
  if (release.leaseId !== admission.receipt.lease?.leaseId) {
    fail("lease_identity_mismatch", "Released lease does not match the capability admission.");
  }
  return release;
}

async function acquireExecutionLease({
  leaseRoot,
  sealedIntent,
  capability,
  executor,
  acquiredAt,
}) {
  const root = resolve(requireString(leaseRoot, "lease_root_missing"));
  await mkdir(root, { recursive: true, mode: 0o700 });
  const leaseName = `${safeSegment(sealedIntent.intent.task.taskId)}-${safeSegment(capability)}.lock`;
  const leasePath = resolve(root, leaseName);
  try {
    await mkdir(leasePath, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") {
      fail("lease_contended", "The requested Task capability already has an active lease.");
    }
    throw error;
  }
  const token = randomUUID();
  const leaseId = hashCanonical({
    intentSha256: sealedIntent.intentSha256,
    capability,
    executor,
    acquiredAt,
    token,
  });
  try {
    await writeFile(
      resolve(leasePath, "lease.json"),
      `${JSON.stringify(
        {
          version: "hito_execution_lease_v1",
          leaseId,
          intentSha256: sealedIntent.intentSha256,
          capability,
          executor,
          acquiredAt,
          token,
        },
        null,
        2,
      )}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  } catch (error) {
    await rm(leasePath, { recursive: true, force: true });
    throw error;
  }
  return {
    receipt: deepFreeze({
      leaseId,
      path: leasePath,
      acquiredAt,
      cleanupRequired: true,
    }),
    handle: deepFreeze({ token }),
  };
}

async function snapshotAdmittedPaths(worktreeRealPath, admittedPaths) {
  if (admittedPaths.length === 0) {
    fail("source_paths_missing", "At least one admitted source path is required.");
  }
  const unique = new Set();
  const result = [];
  for (const rawPath of admittedPaths) {
    const path = requireString(rawPath, "source_path_invalid");
    if (isAbsolute(path) || path.split(/[\\/]/).includes("..") || unique.has(path)) {
      fail("source_path_invalid", `Invalid or duplicate admitted source path: ${path}.`);
    }
    unique.add(path);
    const absolutePath = resolve(worktreeRealPath, path);
    if (!pathIsWithin(worktreeRealPath, absolutePath)) {
      fail("source_path_invalid", `Admitted source path escapes the worktree: ${path}.`);
    }
    const metadata = await stat(absolutePath);
    if (!metadata.isFile()) {
      fail("source_path_invalid", `Admitted source path is not a regular file: ${path}.`);
    }
    result.push({
      path,
      mode: formatMode(metadata.mode),
      sha256: createHash("sha256")
        .update(await readFile(absolutePath))
        .digest("hex"),
    });
  }
  return result.sort((left, right) => left.path.localeCompare(right.path));
}

async function snapshotArtifact(value) {
  const artifact = requireObject(value, "artifact_missing");
  const absolutePath = await realpath(requireString(artifact.path, "artifact_path_missing"));
  const metadata = await stat(absolutePath);
  if (!metadata.isFile()) {
    fail("artifact_invalid", "The execution artifact must be a regular file.");
  }
  return deepFreeze({
    path: absolutePath,
    mode: formatMode(metadata.mode),
    size: metadata.size,
    sha256: createHash("sha256")
      .update(await readFile(absolutePath))
      .digest("hex"),
    identity: requireString(artifact.identity ?? "artifact", "artifact_identity_missing"),
  });
}

function sealIntent(intent) {
  return deepFreeze({
    intent,
    intentSha256: hashCanonical(intent),
    sourceManifestSha256: hashCanonical(intent.source),
  });
}

function sealReceipt(receipt) {
  const frozen = deepFreeze(receipt);
  return deepFreeze({ receipt: frozen, receiptSha256: hashCanonical(frozen) });
}

function requireSealedIntent(value) {
  const sealed = requireObject(value, "intent_missing");
  if (
    sealed.intent?.version !== HITO_EXECUTION_INTENT_VERSION ||
    sealed.intentSha256 !== hashCanonical(sealed.intent) ||
    sealed.sourceManifestSha256 !== hashCanonical(sealed.intent.source)
  ) {
    fail("intent_hash_mismatch", "Execution intent is not immutable.");
  }
  return sealed;
}

function requireSealedReceipt(value) {
  const sealed = requireObject(value, "admission_receipt_missing");
  if (
    sealed.receipt?.version !== HITO_CAPABILITY_ADMISSION_RECEIPT_VERSION ||
    sealed.receiptSha256 !== hashCanonical(sealed.receipt)
  ) {
    fail("receipt_hash_mismatch", "Capability admission receipt is not immutable.");
  }
  return sealed;
}

function normalizeProbe(value, requestedCapability) {
  const probe = requireObject(value, "capability_probe_invalid");
  if (probe.requestedCapability !== requestedCapability || typeof probe.available !== "boolean") {
    fail("capability_probe_invalid", "Capability probe did not return the requested capability.");
  }
  return deepFreeze({
    requestedCapability,
    available: probe.available,
    identity: requireString(probe.identity, "capability_identity_missing"),
    toolVersion: requireString(probe.toolVersion, "capability_tool_version_missing"),
    reason: probe.available ? null : requireString(probe.reason, "capability_reason_missing"),
  });
}

function normalizeExecutor(value) {
  const executor = requireObject(value, "executor_missing");
  return deepFreeze({
    hostId: requireString(executor.hostId, "executor_host_missing"),
    sessionId: requireString(executor.sessionId, "executor_session_missing"),
  });
}

function normalizeObligation(value, code) {
  const obligation = requireObject(value, code);
  return {
    owner: requireString(obligation.owner, code),
    action: requireString(obligation.action, code),
    required: requireExactValue(obligation.required, true, code),
  };
}

function normalizeStringArray(value, code, allowEmpty = false) {
  const values = requireArray(value, code).map((entry) => requireString(entry, code));
  if (!allowEmpty && values.length === 0) fail(code, "A non-empty string list is required.");
  return [...values];
}

function normalizeIntegerArray(value, code) {
  return requireArray(value, code).map((entry) => requireInteger(entry, code));
}

function normalizeStringMap(value, code) {
  const map = requireObject(value, code);
  const entries = Object.entries(map);
  if (entries.length === 0) fail(code, "A non-empty string map is required.");
  return Object.fromEntries(entries.map(([key, entry]) => [key, requireString(entry, code)]));
}

function requireObject(value, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(code, `A required broker object is missing or invalid: ${code}.`);
  }
  return value;
}

function requireArray(value, code) {
  if (!Array.isArray(value)) fail(code, `A required broker array is missing: ${code}.`);
  return value;
}

function requireString(value, code) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(code, `A required broker string is missing: ${code}.`);
  }
  return value;
}

function requireSha256(value, code) {
  const hash = requireString(value, code);
  if (!/^[a-f0-9]{64}$/.test(hash)) fail(code, "A canonical SHA-256 value is required.");
  return hash;
}

function requireTimestamp(value, code) {
  const timestamp = requireString(value, code);
  if (Number.isNaN(Date.parse(timestamp))) fail(code, "A valid timestamp is required.");
  return timestamp;
}

function requireInteger(value, code) {
  if (!Number.isInteger(value)) fail(code, `A required integer is missing: ${code}.`);
  return value;
}

function requireExactValue(value, expected, code) {
  if (value !== expected) fail(code, `Expected ${JSON.stringify(expected)} for ${code}.`);
  return value;
}

function requireBoundValue(value, expected, code, message) {
  const actual = requireString(value, code);
  if (actual !== expected) fail(code, message);
  return expected;
}

async function resolveExistingDirectory(value, code) {
  const path = requireString(value, code);
  try {
    const resolved = await realpath(path);
    const metadata = await stat(resolved);
    if (!metadata.isDirectory()) fail(code, "Expected an existing directory.");
    return resolved;
  } catch (error) {
    if (error instanceof HitoCapabilityBrokerError) throw error;
    fail(code, `The required directory is unavailable: ${code}.`);
  }
}

function pathIsWithin(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

function formatMode(mode) {
  return (mode & 0o777).toString(8).padStart(4, "0");
}

function safeSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function fail(code, message) {
  throw new HitoCapabilityBrokerError(code, message);
}
