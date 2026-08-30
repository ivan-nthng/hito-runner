import assert from "node:assert/strict";
import { access, chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  HITO_DESTINATION_ACKNOWLEDGEMENT_VERSION,
  HitoCapabilityBrokerError,
  admitExecutionIntentV1,
  buildExecutionArtifactManifestV1,
  createExecutionIntentV1,
  hashCanonical,
  rehomeExecutionIntentV1,
  releaseExecutionLeaseV1,
  verifyExecutionArtifactManifestV1,
} from "./lib/hito-capability-broker.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "hito-capability-broker-"));

try {
  await testAdmittedSuccess();
  await testMissingCapabilityAndAcknowledgement();
  await testWrongCwdAndRepositoryIdentity();
  await testSourceAndArtifactMotion();
  await testPostOperationSourceIdentity();
  await testGitReleasePostRepositoryIdentity();
  await testUnauthorizedScopeAndAuthority();
  await testManifestIdentityBinding();
  await testOneTimeRehome();
  await testLeaseContentionReleaseAndCleanup();
  console.log("Hito capability broker admission core validated.");
} finally {
  await rm(root, { recursive: true, force: true });
}

async function testAdmittedSuccess() {
  const fixture = await createFixture("success");
  const sealedIntent = await createIntent(fixture);
  const acknowledgement = acknowledge(sealedIntent, "destination-success");
  const calls = [];
  const admission = await admitExecutionIntentV1({
    sealedIntent,
    acknowledgement,
    readTaskState: liveTask,
    readSourceState: () => liveSource(sealedIntent),
    probeRequestedCapability: availableProbe(calls),
    leaseRoot: fixture.leaseRoot,
    executor: executor("source-host"),
    checkedAt: "2026-08-30T18:00:00.000Z",
  });
  assert.equal(admission.receipt.status, "admitted");
  assert.equal(admission.receipt.rehomeCount, 0);
  assert.deepEqual(calls, ["docker_supabase_runtime"]);
  assert.equal(Object.isFrozen(sealedIntent.intent), true);
  assert.equal(Object.isFrozen(admission.receipt), true);
  assert.equal(
    (await stat(path.join(admission.receipt.lease.path, "lease.json"))).mode & 0o777,
    0o600,
  );

  const sealedManifest = await buildExecutionArtifactManifestV1({
    sealedIntent,
    admission,
    acknowledgement,
    execution: execution(fixture, admission),
    runtime: runtime(admission),
    artifact: { path: fixture.artifactPath, identity: "test-runtime-receipt" },
    result: result(sealedIntent),
    readSourceState: () => liveSource(sealedIntent),
  });
  assert.equal(sealedManifest.manifestSha256, hashCanonical(sealedManifest.manifest));
  assert.equal(
    await verifyExecutionArtifactManifestV1({
      sealedManifest,
      sealedIntent,
      admission,
      readSourceState: () => liveSource(sealedIntent),
    }),
    true,
  );
  const released = await releaseExecutionLeaseV1({
    admission,
    leaseHandle: admission.leaseHandle,
    releasedAt: "2026-08-30T18:02:00.000Z",
  });
  assert.equal(released.released, true);
  await assert.rejects(access(admission.receipt.lease.path));
}

async function testMissingCapabilityAndAcknowledgement() {
  const fixture = await createFixture("missing");
  const sealedIntent = await createIntent(fixture);
  let probes = 0;
  await expectBrokerError(
    () =>
      admitExecutionIntentV1({
        sealedIntent,
        acknowledgement: null,
        readTaskState: liveTask,
        readSourceState: () => liveSource(sealedIntent),
        probeRequestedCapability: async () => {
          probes += 1;
          return unavailableProbeResult();
        },
        leaseRoot: fixture.leaseRoot,
        executor: executor("source-host"),
        checkedAt: "2026-08-30T18:00:00.000Z",
      }),
    "acknowledgement_missing",
  );
  assert.equal(probes, 0);

  const missing = await admitExecutionIntentV1({
    sealedIntent,
    acknowledgement: acknowledge(sealedIntent, "missing-capability"),
    readTaskState: liveTask,
    readSourceState: () => liveSource(sealedIntent),
    probeRequestedCapability: async () => unavailableProbeResult(),
    leaseRoot: fixture.leaseRoot,
    executor: executor("source-host"),
    checkedAt: "2026-08-30T18:00:00.000Z",
  });
  assert.equal(missing.receipt.status, "rehome_required");
  assert.equal(missing.receipt.lease, null);

  await expectBrokerError(
    () => createIntent(fixture, { requestedCapability: "unknown_capability" }),
    "capability_unknown",
  );
  await expectBrokerError(
    () => createIntent(fixture, { externalActionAuthority: "" }),
    "external_authority_missing",
  );
  await expectBrokerError(() => createIntent(fixture, { rollback: null }), "rollback_missing");
}

async function testWrongCwdAndRepositoryIdentity() {
  const fixture = await createFixture("cwd");
  const outside = path.join(root, "outside-cwd");
  await mkdir(outside, { recursive: true });
  await expectBrokerError(() => createIntent(fixture, { cwd: outside }), "cwd_mismatch");
  await expectBrokerError(
    () => createIntent(fixture, { repositoryRoot: path.join(root, "missing-repository") }),
    "repository_missing",
  );

  const sealedIntent = await createIntent(fixture);
  await expectBrokerError(
    () =>
      admitExecutionIntentV1({
        sealedIntent,
        acknowledgement: acknowledge(sealedIntent, "wrong-repository"),
        readTaskState: liveTask,
        readSourceState: async () => ({
          ...liveSource(sealedIntent),
          repositoryIdentity: "different/repository",
        }),
        probeRequestedCapability: availableProbe([]),
        leaseRoot: fixture.leaseRoot,
        executor: executor("source-host"),
        checkedAt: "2026-08-30T18:00:00.000Z",
      }),
    "repository_identity_changed",
  );
}

async function testSourceAndArtifactMotion() {
  const sourceFixture = await createFixture("source-motion");
  const sourceIntent = await createIntent(sourceFixture);
  await writeFile(sourceFixture.sourcePath, "changed\n");
  let probes = 0;
  await expectBrokerError(
    () =>
      admitExecutionIntentV1({
        sealedIntent: sourceIntent,
        acknowledgement: acknowledge(sourceIntent, "source-motion"),
        readTaskState: liveTask,
        readSourceState: () => liveSource(sourceIntent),
        probeRequestedCapability: async () => {
          probes += 1;
          return availableProbeResult();
        },
        leaseRoot: sourceFixture.leaseRoot,
        executor: executor("source-host"),
        checkedAt: "2026-08-30T18:00:00.000Z",
      }),
    "source_changed",
  );
  assert.equal(probes, 0);

  const artifactFixture = await createFixture("artifact-motion");
  const artifactIntent = await createIntent(artifactFixture);
  const acknowledgement = acknowledge(artifactIntent, "artifact-motion");
  const admission = await admitted(artifactFixture, artifactIntent, acknowledgement);
  const sealedManifest = await buildExecutionArtifactManifestV1({
    sealedIntent: artifactIntent,
    admission,
    acknowledgement,
    execution: execution(artifactFixture, admission),
    runtime: runtime(admission),
    artifact: { path: artifactFixture.artifactPath, identity: "artifact-motion" },
    result: result(artifactIntent),
    readSourceState: () => liveSource(artifactIntent),
  });
  await writeFile(artifactFixture.artifactPath, "moved\n");
  await expectBrokerError(
    () =>
      verifyExecutionArtifactManifestV1({
        sealedManifest,
        sealedIntent: artifactIntent,
        admission,
        readSourceState: () => liveSource(artifactIntent),
      }),
    "artifact_changed",
  );
  await release(admission);

  const modeFixture = await createFixture("mode-motion");
  const modeIntent = await createIntent(modeFixture);
  await chmod(modeFixture.sourcePath, 0o600);
  await expectBrokerError(
    () =>
      admitExecutionIntentV1({
        sealedIntent: modeIntent,
        acknowledgement: acknowledge(modeIntent, "mode-motion"),
        readTaskState: liveTask,
        readSourceState: () => liveSource(modeIntent),
        probeRequestedCapability: availableProbe([]),
        leaseRoot: modeFixture.leaseRoot,
        executor: executor("source-host"),
        checkedAt: "2026-08-30T18:00:00.000Z",
      }),
    "source_changed",
  );
}

async function testPostOperationSourceIdentity() {
  const fixture = await createFixture("post-operation-source");
  const sealedIntent = await createIntent(fixture);
  const acknowledgement = acknowledge(sealedIntent, "post-operation-source");
  const admission = await admitted(fixture, sealedIntent, acknowledgement);

  await writeFile(fixture.sourcePath, "accepted post-operation change\n");
  const sealedManifest = await buildExecutionArtifactManifestV1({
    sealedIntent,
    admission,
    acknowledgement,
    execution: execution(fixture, admission),
    runtime: runtime(admission),
    artifact: { path: fixture.artifactPath, identity: "post-operation-source" },
    result: result(sealedIntent),
    readSourceState: () => liveSource(sealedIntent),
  });
  assert.notDeepEqual(
    sealedManifest.manifest.source.admittedPaths,
    sealedManifest.manifest.source.postOperationAdmittedPaths,
  );
  assert.equal(
    await verifyExecutionArtifactManifestV1({
      sealedManifest,
      sealedIntent,
      admission,
      readSourceState: () => liveSource(sealedIntent),
    }),
    true,
  );

  await writeFile(fixture.sourcePath, "stale post-operation change\n");
  await expectBrokerError(
    () =>
      verifyExecutionArtifactManifestV1({
        sealedManifest,
        sealedIntent,
        admission,
        readSourceState: () => liveSource(sealedIntent),
      }),
    "post_operation_source_changed",
  );

  await writeFile(fixture.sourcePath, "accepted post-operation change\n");
  const manifest = structuredClone(sealedManifest.manifest);
  manifest.source.postOperationAdmittedPaths[0].sha256 = "c".repeat(64);
  await expectBrokerError(
    () =>
      verifyExecutionArtifactManifestV1({
        sealedManifest: { manifest, manifestSha256: hashCanonical(manifest) },
        sealedIntent,
        admission,
        readSourceState: () => liveSource(sealedIntent),
      }),
    "post_operation_source_changed",
  );
  await release(admission);
}

async function testGitReleasePostRepositoryIdentity() {
  const fixture = await createFixture("git-release-post-operation");
  const sealedIntent = await createIntent(fixture, {
    operationKind: "git_release",
    requestedCapability: "git_release_deploy",
    requiredProof: "one admitted Git commit and non-force push",
  });
  const acknowledgement = acknowledge(sealedIntent, "git-release-session");
  const admission = await admitted(fixture, sealedIntent, acknowledgement);
  const parentRevision = sealedIntent.intent.source.baseRevision;
  const commitRevision = "1".repeat(40);
  const releaseExecution = execution(fixture, admission, {
    gitRelease: {
      expectedPostRevision: commitRevision,
      expectedParentRevision: parentRevision,
      expectedChangedPaths: ["src/accepted.txt"],
    },
  });
  const releaseResult = result(sealedIntent, {
    gitRelease: {
      commitRevision,
      parentRevision,
      remoteRevision: commitRevision,
      changedPaths: ["src/accepted.txt"],
    },
  });
  const postReleaseSource = (override = {}) =>
    liveSource(sealedIntent, {
      baseRevision: commitRevision,
      parentRevision,
      remoteRevision: commitRevision,
      ...override,
    });

  const sealedManifest = await buildExecutionArtifactManifestV1({
    sealedIntent,
    admission,
    acknowledgement,
    execution: releaseExecution,
    runtime: runtime(admission),
    artifact: { path: fixture.artifactPath, identity: "git-release-post-operation" },
    result: releaseResult,
    readSourceState: postReleaseSource,
  });
  assert.equal(
    sealedManifest.manifest.source.postOperationRepositoryState.baseRevision,
    commitRevision,
  );
  assert.equal(
    await verifyExecutionArtifactManifestV1({
      sealedManifest,
      sealedIntent,
      admission,
      readSourceState: postReleaseSource,
      execution: releaseExecution,
      result: releaseResult,
    }),
    true,
  );

  await expectBrokerError(
    () =>
      buildExecutionArtifactManifestV1({
        sealedIntent,
        admission,
        acknowledgement,
        execution: {
          ...releaseExecution,
          gitRelease: {
            ...releaseExecution.gitRelease,
            expectedParentRevision: "2".repeat(40),
          },
        },
        runtime: runtime(admission),
        artifact: { path: fixture.artifactPath, identity: "git-release-wrong-parent" },
        result: releaseResult,
        readSourceState: postReleaseSource,
      }),
    "git_release_parent_mismatch",
  );
  await expectBrokerError(
    () =>
      buildExecutionArtifactManifestV1({
        sealedIntent,
        admission,
        acknowledgement,
        execution: {
          ...releaseExecution,
          gitRelease: {
            ...releaseExecution.gitRelease,
            expectedChangedPaths: ["src/other.txt"],
          },
        },
        runtime: runtime(admission),
        artifact: { path: fixture.artifactPath, identity: "git-release-wrong-path" },
        result: releaseResult,
        readSourceState: postReleaseSource,
      }),
    "git_release_changed_paths_mismatch",
  );
  for (const [sourceOverride, expectedCode] of [
    [{ branch: "other" }, "branch_changed"],
    [{ indexState: "dirty" }, "index_state_changed"],
    [{ unrelatedDirtyFingerprint: "b".repeat(64) }, "dirty_boundary_changed"],
  ]) {
    await expectBrokerError(
      () =>
        buildExecutionArtifactManifestV1({
          sealedIntent,
          admission,
          acknowledgement,
          execution: releaseExecution,
          runtime: runtime(admission),
          artifact: { path: fixture.artifactPath, identity: "git-release-drift" },
          result: releaseResult,
          readSourceState: () => postReleaseSource(sourceOverride),
        }),
      expectedCode,
    );
  }
  await expectBrokerError(
    () =>
      verifyExecutionArtifactManifestV1({
        sealedManifest,
        sealedIntent,
        admission,
        readSourceState: () =>
          postReleaseSource({
            baseRevision: "3".repeat(40),
            parentRevision: commitRevision,
            remoteRevision: "3".repeat(40),
          }),
        execution: releaseExecution,
        result: releaseResult,
      }),
    "post_operation_repository_changed",
  );
  const forgedRevisionManifest = structuredClone(sealedManifest.manifest);
  forgedRevisionManifest.source.postOperationRepositoryState.baseRevision = "4".repeat(40);
  forgedRevisionManifest.source.postOperationRepositoryState.remoteRevision = "4".repeat(40);
  forgedRevisionManifest.execution.gitRelease.expectedPostRevision = "4".repeat(40);
  forgedRevisionManifest.result.gitRelease.commitRevision = "4".repeat(40);
  forgedRevisionManifest.result.gitRelease.remoteRevision = "4".repeat(40);
  await expectBrokerError(
    () =>
      verifyExecutionArtifactManifestV1({
        sealedManifest: {
          manifest: forgedRevisionManifest,
          manifestSha256: hashCanonical(forgedRevisionManifest),
        },
        sealedIntent,
        admission,
        readSourceState: postReleaseSource,
        execution: releaseExecution,
        result: releaseResult,
      }),
    "manifest_binding_mismatch",
  );
  const resealedManifest = structuredClone(sealedManifest.manifest);
  resealedManifest.source.postOperationRepositoryState.baseRevision = "4".repeat(40);
  await expectBrokerError(
    () =>
      verifyExecutionArtifactManifestV1({
        sealedManifest: {
          manifest: resealedManifest,
          manifestSha256: hashCanonical(resealedManifest),
        },
        sealedIntent,
        admission,
        readSourceState: postReleaseSource,
        execution: releaseExecution,
        result: releaseResult,
      }),
    "post_operation_repository_changed",
  );

  const ordinaryFixture = await createFixture("non-git-revision-transition");
  const ordinaryIntent = await createIntent(ordinaryFixture);
  const ordinaryAcknowledgement = acknowledge(ordinaryIntent, "non-git-session");
  const ordinaryAdmission = await admitted(
    ordinaryFixture,
    ordinaryIntent,
    ordinaryAcknowledgement,
  );
  await expectBrokerError(
    () =>
      buildExecutionArtifactManifestV1({
        sealedIntent: ordinaryIntent,
        admission: ordinaryAdmission,
        acknowledgement: ordinaryAcknowledgement,
        execution: execution(ordinaryFixture, ordinaryAdmission),
        runtime: runtime(ordinaryAdmission),
        artifact: { path: ordinaryFixture.artifactPath, identity: "non-git-transition" },
        result: result(ordinaryIntent),
        readSourceState: () => liveSource(ordinaryIntent, { baseRevision: "5".repeat(40) }),
      }),
    "base_revision_changed",
  );
  await release(ordinaryAdmission);
  const leaseRelease = await release(admission);
  const releasedLeaseResult = result(sealedIntent, {
    gitRelease: {
      ...releaseResult.gitRelease,
      leaseRelease,
    },
  });
  const postReleaseManifest = await buildExecutionArtifactManifestV1({
    sealedIntent,
    admission,
    acknowledgement,
    execution: releaseExecution,
    runtime: runtime(admission),
    artifact: { path: fixture.artifactPath, identity: "git-release-released-lease" },
    result: releasedLeaseResult,
    readSourceState: postReleaseSource,
  });
  assert.equal(
    await verifyExecutionArtifactManifestV1({
      sealedManifest: postReleaseManifest,
      sealedIntent,
      admission,
      readSourceState: postReleaseSource,
      execution: releaseExecution,
      result: releasedLeaseResult,
    }),
    true,
  );
}

async function testUnauthorizedScopeAndAuthority() {
  const fixture = await createFixture("scope");
  const sealedIntent = await createIntent(fixture);
  let probes = 0;
  await expectBrokerError(
    () =>
      admitExecutionIntentV1({
        sealedIntent,
        acknowledgement: acknowledge(sealedIntent, "scope"),
        readTaskState: async () => ({ ...liveTask(), scope: "expanded" }),
        readSourceState: () => liveSource(sealedIntent),
        probeRequestedCapability: async () => {
          probes += 1;
          return availableProbeResult();
        },
        leaseRoot: fixture.leaseRoot,
        executor: executor("source-host"),
        checkedAt: "2026-08-30T18:00:00.000Z",
      }),
    "task_scope_changed",
  );
  assert.equal(probes, 0);

  await expectBrokerError(
    () =>
      admitExecutionIntentV1({
        sealedIntent,
        acknowledgement: acknowledge(sealedIntent, "authority"),
        readTaskState: async () => ({
          ...liveTask(),
          externalActionAuthority: "different_task_authority",
        }),
        readSourceState: () => liveSource(sealedIntent),
        probeRequestedCapability: availableProbe([]),
        leaseRoot: fixture.leaseRoot,
        executor: executor("source-host"),
        checkedAt: "2026-08-30T18:00:00.000Z",
      }),
    "external_authority_changed",
  );

  const wrongAcknowledgement = {
    ...acknowledge(sealedIntent, "wrong-authority"),
    admittedBoundary: "broader acceptance",
  };
  await expectBrokerError(
    () =>
      admitExecutionIntentV1({
        sealedIntent,
        acknowledgement: wrongAcknowledgement,
        readTaskState: liveTask,
        readSourceState: () => liveSource(sealedIntent),
        probeRequestedCapability: availableProbe([]),
        leaseRoot: fixture.leaseRoot,
        executor: executor("source-host"),
        checkedAt: "2026-08-30T18:00:00.000Z",
      }),
    "acknowledgement_mismatch",
  );
}

async function testManifestIdentityBinding() {
  const fixture = await createFixture("manifest-binding");
  const sealedIntent = await createIntent(fixture);
  const acknowledgement = acknowledge(sealedIntent, "acknowledged-session");
  const admission = await admitExecutionIntentV1({
    sealedIntent,
    acknowledgement,
    readTaskState: liveTask,
    readSourceState: () => liveSource(sealedIntent),
    probeRequestedCapability: availableProbe([]),
    leaseRoot: fixture.leaseRoot,
    executor: { hostId: "admitted-host", sessionId: "admitted-session" },
    checkedAt: "2026-08-30T18:00:00.000Z",
  });
  const validInput = {
    sealedIntent,
    admission,
    acknowledgement,
    execution: execution(fixture, admission),
    runtime: runtime(admission),
    artifact: { path: fixture.artifactPath, identity: "manifest-binding" },
    result: result(sealedIntent),
    readSourceState: () => liveSource(sealedIntent),
  };

  for (const [override, expectedCode] of [
    [
      { execution: { ...validInput.execution, executorHost: "forged-other-host" } },
      "manifest_executor_mismatch",
    ],
    [
      { execution: { ...validInput.execution, executorSessionId: "forged-other-session" } },
      "manifest_executor_mismatch",
    ],
    [
      { runtime: { ...validInput.runtime, environmentIdentity: "forged-other-environment" } },
      "manifest_environment_mismatch",
    ],
    [
      { result: { ...validInput.result, admittedProofLayer: "forged-other-proof-layer" } },
      "manifest_proof_layer_mismatch",
    ],
  ]) {
    await expectBrokerError(
      () => buildExecutionArtifactManifestV1({ ...validInput, ...override }),
      expectedCode,
    );
  }

  await expectBrokerError(
    () =>
      buildExecutionArtifactManifestV1({
        ...validInput,
        acknowledgement: acknowledge(sealedIntent, "different-acknowledged-session"),
      }),
    "admission_binding_mismatch",
  );

  const sealedManifest = await buildExecutionArtifactManifestV1(validInput);
  assert.equal(sealedManifest.manifest.execution.executorHost, "admitted-host");
  assert.equal(sealedManifest.manifest.execution.executorSessionId, "admitted-session");
  assert.deepEqual(admission.receipt.acknowledgement, acknowledgement);
  assert.equal(
    sealedManifest.manifest.acknowledgement.destinationSessionId,
    "acknowledged-session",
  );
  assert.equal(
    sealedManifest.manifest.runtime.environmentIdentity,
    sealedIntent.intent.operation.environmentIdentity,
  );
  assert.equal(
    sealedManifest.manifest.result.admittedProofLayer,
    sealedIntent.intent.operation.requiredProof,
  );
  for (const manifestOverride of [
    {
      execution: {
        ...sealedManifest.manifest.execution,
        executorHost: "forged-other-host",
      },
    },
    {
      runtime: {
        ...sealedManifest.manifest.runtime,
        environmentIdentity: "forged-other-environment",
      },
    },
    {
      result: {
        ...sealedManifest.manifest.result,
        admittedProofLayer: "forged-other-proof-layer",
      },
    },
    {
      acknowledgement: {
        ...sealedManifest.manifest.acknowledgement,
        destinationSessionId: "forged-other-acknowledged-session",
      },
    },
    {
      acknowledgement: {
        ...sealedManifest.manifest.acknowledgement,
        destinationOwner: "forged-other-destination-owner",
      },
    },
    {
      acknowledgement: {
        ...sealedManifest.manifest.acknowledgement,
        sha256: "b".repeat(64),
      },
    },
    {
      source: {
        ...sealedManifest.manifest.source,
        branch: "forged-other-branch",
      },
    },
  ]) {
    const manifest = { ...structuredClone(sealedManifest.manifest), ...manifestOverride };
    await expectBrokerError(
      () =>
        verifyExecutionArtifactManifestV1({
          sealedManifest: { manifest, manifestSha256: hashCanonical(manifest) },
          sealedIntent,
          admission,
          readSourceState: () => liveSource(sealedIntent),
        }),
      "manifest_binding_mismatch",
    );
  }
  await release(admission);
}

async function testOneTimeRehome() {
  const fixture = await createFixture("rehome");
  const sealedIntent = await createIntent(fixture);
  const first = await admitExecutionIntentV1({
    sealedIntent,
    acknowledgement: acknowledge(sealedIntent, "source-host"),
    readTaskState: liveTask,
    readSourceState: () => liveSource(sealedIntent),
    probeRequestedCapability: async () => unavailableProbeResult(),
    leaseRoot: fixture.leaseRoot,
    executor: executor("source-host"),
    checkedAt: "2026-08-30T18:00:00.000Z",
  });
  const blocked = await rehomeExecutionIntentV1({
    priorAdmission: first,
    sealedIntent,
    acknowledgement: acknowledge(sealedIntent, "rehome-host"),
    readTaskState: liveTask,
    readSourceState: () => liveSource(sealedIntent),
    probeRequestedCapability: async () => unavailableProbeResult(),
    leaseRoot: fixture.leaseRoot,
    executor: executor("rehome-host"),
    checkedAt: "2026-08-30T18:01:00.000Z",
  });
  assert.equal(blocked.receipt.status, "blocked");
  assert.equal(blocked.receipt.rehomeCount, 1);
  await expectBrokerError(
    () =>
      rehomeExecutionIntentV1({
        priorAdmission: blocked,
        sealedIntent,
        acknowledgement: acknowledge(sealedIntent, "third-host"),
        readTaskState: liveTask,
        readSourceState: () => liveSource(sealedIntent),
        probeRequestedCapability: availableProbe([]),
        leaseRoot: fixture.leaseRoot,
        executor: executor("third-host"),
        checkedAt: "2026-08-30T18:02:00.000Z",
      }),
    "rehome_exhausted",
  );

  const successFixture = await createFixture("rehome-success");
  const successIntent = await createIntent(successFixture);
  const unavailable = await admitExecutionIntentV1({
    sealedIntent: successIntent,
    acknowledgement: acknowledge(successIntent, "source-host"),
    readTaskState: liveTask,
    readSourceState: () => liveSource(successIntent),
    probeRequestedCapability: async () => unavailableProbeResult(),
    leaseRoot: successFixture.leaseRoot,
    executor: executor("source-host"),
    checkedAt: "2026-08-30T18:00:00.000Z",
  });
  const rehomed = await rehomeExecutionIntentV1({
    priorAdmission: unavailable,
    sealedIntent: successIntent,
    acknowledgement: acknowledge(successIntent, "capable-host"),
    readTaskState: liveTask,
    readSourceState: () => liveSource(successIntent),
    probeRequestedCapability: availableProbe([]),
    leaseRoot: successFixture.leaseRoot,
    executor: executor("capable-host"),
    checkedAt: "2026-08-30T18:01:00.000Z",
  });
  assert.equal(rehomed.receipt.status, "admitted");
  assert.equal(rehomed.receipt.rehomeCount, 1);
  assert.equal(rehomed.receipt.intentSha256, unavailable.receipt.intentSha256);
  await release(rehomed);
}

async function testLeaseContentionReleaseAndCleanup() {
  const fixture = await createFixture("lease");
  const firstIntent = await createIntent(fixture, { intentId: "intent-lease-a" });
  const secondIntent = await createIntent(fixture, { intentId: "intent-lease-b" });
  const first = await admitted(fixture, firstIntent, acknowledge(firstIntent, "lease-a"));
  await expectBrokerError(
    () => admitted(fixture, secondIntent, acknowledge(secondIntent, "lease-b")),
    "lease_contended",
  );
  await release(first);
  const second = await admitted(fixture, secondIntent, acknowledge(secondIntent, "lease-b"));
  const leaseJson = JSON.parse(
    await readFile(path.join(second.receipt.lease.path, "lease.json"), "utf8"),
  );
  assert.equal(leaseJson.intentSha256, secondIntent.intentSha256);
  await release(second);
  await assert.rejects(access(second.receipt.lease.path));
}

async function createFixture(name) {
  const worktree = path.join(root, name, "repository");
  const sourcePath = path.join(worktree, "src", "accepted.txt");
  const artifactPath = path.join(root, name, "artifact.json");
  const leaseRoot = path.join(root, name, "leases");
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, "accepted\n", { mode: 0o644 });
  await writeFile(artifactPath, '{"ok":true}\n', { mode: 0o600 });
  return { worktree, sourcePath, artifactPath, leaseRoot };
}

async function createIntent(fixture, override = {}) {
  return createExecutionIntentV1({
    intentId: override.intentId ?? `intent-${path.basename(path.dirname(fixture.worktree))}`,
    createdAt: "2026-08-30T17:59:00.000Z",
    task: {
      taskId: "HITO-301",
      pageId: "3ccfe5f58cf581d4a89be51d2f22664b",
      expectedRevision: "2026-08-30T17:07:00.000Z",
      currentOwner: "BACKEND",
      sourceOwner: "BACKEND",
      scope: "capability_broker_admission_core",
      acceptanceAuthority: "PRODUCT",
    },
    source: {
      repositoryIdentity: "ivan-nthng/hito-runner",
      repositoryRoot: override.repositoryRoot ?? fixture.worktree,
      worktreeRoot: fixture.worktree,
      cwd: override.cwd ?? fixture.worktree,
      baseRevision: "fca161507e9dd344a141712d48d799b4204091d8",
      branch: "main",
      indexState: "empty",
      admittedPaths: ["src/accepted.txt"],
      unrelatedDirtyFingerprint: "a".repeat(64),
    },
    operation: {
      kind: override.operationKind ?? "rehome_same_runtime_status",
      requestedCapability: override.requestedCapability ?? "docker_supabase_runtime",
      environmentIdentity: "local:hito-running",
      externalActionAuthority: override.externalActionAuthority ?? "task_explicit_local_only",
      rollback:
        "rollback" in override
          ? override.rollback
          : {
              owner: "BACKEND",
              action: "release exact operation lease",
              required: true,
            },
      cleanup: {
        owner: "BACKEND",
        action: "remove disposable lease and artifact",
        required: true,
      },
      requiredProof: override.requiredProof ?? "runtime admission only",
    },
    destination: {
      owner: "QA",
      threadId: "qa-thread",
    },
  });
}

function acknowledge(sealedIntent, destinationSessionId) {
  return {
    version: HITO_DESTINATION_ACKNOWLEDGEMENT_VERSION,
    taskId: sealedIntent.intent.task.taskId,
    pageId: sealedIntent.intent.task.pageId,
    intentSha256: sealedIntent.intentSha256,
    sourceManifestSha256: sealedIntent.sourceManifestSha256,
    destinationOwner: sealedIntent.intent.destination.owner,
    destinationSessionId,
    admittedBoundary: sealedIntent.intent.operation.requiredProof,
    acknowledgedAt: "2026-08-30T18:00:00.000Z",
  };
}

function liveTask() {
  return {
    taskId: "HITO-301",
    pageId: "3ccfe5f58cf581d4a89be51d2f22664b",
    expectedRevision: "2026-08-30T17:07:00.000Z",
    currentOwner: "BACKEND",
    sourceOwner: "BACKEND",
    scope: "capability_broker_admission_core",
    acceptanceAuthority: "PRODUCT",
    externalActionAuthority: "task_explicit_local_only",
  };
}

function liveSource(sealedIntent, override = {}) {
  const source = sealedIntent.intent.source;
  return {
    repositoryIdentity: source.repositoryIdentity,
    repositoryRealPath: source.repositoryRealPath,
    worktreeRealPath: source.worktreeRealPath,
    cwdRealPath: source.cwdRealPath,
    baseRevision: override.baseRevision ?? source.baseRevision,
    parentRevision: override.parentRevision ?? null,
    remoteRevision: override.remoteRevision ?? null,
    branch: override.branch ?? source.branch,
    indexState: override.indexState ?? source.indexState,
    unrelatedDirtyFingerprint:
      override.unrelatedDirtyFingerprint ?? source.unrelatedDirtyFingerprint,
  };
}

function availableProbe(calls) {
  return async ({ requestedCapability }) => {
    calls.push(requestedCapability);
    return availableProbeResult(requestedCapability);
  };
}

function availableProbeResult(requestedCapability = "docker_supabase_runtime") {
  return {
    requestedCapability,
    available: true,
    identity: "disposable-test-capability",
    toolVersion: "test-v1",
  };
}

function unavailableProbeResult() {
  return {
    requestedCapability: "docker_supabase_runtime",
    available: false,
    identity: "disposable-test-capability",
    toolVersion: "test-v1",
    reason: "capability unavailable in test host",
  };
}

function executor(sessionId) {
  return { hostId: "local-test-host", sessionId };
}

async function admitted(fixture, sealedIntent, acknowledgement) {
  return admitExecutionIntentV1({
    sealedIntent,
    acknowledgement,
    readTaskState: liveTask,
    readSourceState: () => liveSource(sealedIntent),
    probeRequestedCapability: availableProbe([]),
    leaseRoot: fixture.leaseRoot,
    executor: executor("admitted-host"),
    checkedAt: "2026-08-30T18:00:00.000Z",
  });
}

function execution(fixture, admission, override = {}) {
  return {
    commandIdentity: "test command",
    toolIdentity: "node:test-double",
    cwd: fixture.worktree,
    approvedEnvironmentKeyNames: ["TEST_ONLY"],
    toolchainVersions: { node: process.versions.node },
    executorHost: admission.receipt.executor.hostId,
    executorSessionId: admission.receipt.executor.sessionId,
    startedAt: "2026-08-30T18:00:00.000Z",
    finishedAt: "2026-08-30T18:01:00.000Z",
    ...override,
  };
}

function runtime(admission) {
  return {
    environmentIdentity: admission.receipt.environmentIdentity,
    dockerContext: "none",
    supabaseProject: "none",
    ports: [],
    fixtureDataClass: "disposable_test_only",
    providerMode: "none",
    leaseId: admission.receipt.lease.leaseId,
    cleanupRequirement: "release disposable lease",
  };
}

function result(sealedIntent, override = {}) {
  return {
    status: "completed",
    exitCode: 0,
    redactedEvidencePaths: [],
    omissions: ["no privileged operation"],
    rollbackResult: "not required",
    cleanupResult: "pending lease release",
    nextBoundary: "independent QA",
    admittedProofLayer: sealedIntent.intent.operation.requiredProof,
    ...override,
  };
}

async function release(admission) {
  return releaseExecutionLeaseV1({
    admission,
    leaseHandle: admission.leaseHandle,
    releasedAt: "2026-08-30T18:02:00.000Z",
  });
}

async function expectBrokerError(action, expectedCode) {
  await assert.rejects(action, (error) => {
    assert.ok(error instanceof HitoCapabilityBrokerError);
    assert.equal(error.code, expectedCode);
    return true;
  });
}
