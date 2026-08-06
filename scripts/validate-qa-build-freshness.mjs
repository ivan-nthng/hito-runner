import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  evaluateQaBuildFreshness,
  fingerprintQaBuildArtifact,
  fingerprintQaExecutableInputs,
  qaBuildFreshnessSchemaVersion,
  writeQaBuildFreshnessReceipt,
} from "./lib/qa-build-freshness.mjs";
import { resolveQaRuntimePaths } from "./lib/qa-runtime-paths.mjs";

const rootDir = process.cwd();
const qaRuntimePaths = resolveQaRuntimePaths({ rootDir });
const fixtureRoot = resolve(qaRuntimePaths.stateDir, "qa-build-freshness-validator");
const runtimeRoot = resolve(fixtureRoot, "runtime");
const freshnessPath = resolve(runtimeRoot, ".hito-build-freshness.json");

try {
  resetFixture();

  const sourceFingerprint = fingerprintQaExecutableInputs({ rootDir });
  const artifactFingerprint = fingerprintQaBuildArtifact({ freshnessPath, runtimeRoot });
  assert.ok(artifactFingerprint);

  writeQaBuildFreshnessReceipt({
    artifactFingerprint,
    freshnessPath,
    sourceFingerprint,
  });
  assert.deepEqual(readStatus(), {
    status: "fresh",
    reason: "receipt_matches",
  });

  writeQaBuildFreshnessReceipt({
    artifactFingerprint,
    freshnessPath,
    sourceFingerprint: {
      ...sourceFingerprint,
      digest: differentDigest(sourceFingerprint.digest),
    },
  });
  assert.deepEqual(readStatus(), {
    status: "stale",
    reason: "executable_inputs_changed",
  });

  writeQaBuildFreshnessReceipt({
    artifactFingerprint: {
      ...artifactFingerprint,
      digest: differentDigest(artifactFingerprint.digest),
    },
    freshnessPath,
    sourceFingerprint,
  });
  assert.deepEqual(readStatus(), {
    status: "stale",
    reason: "artifact_changed",
  });

  writeFileSync(
    freshnessPath,
    `${JSON.stringify({
      schemaVersion: qaBuildFreshnessSchemaVersion + 1,
      source: sourceFingerprint,
      artifact: artifactFingerprint,
    })}\n`,
  );
  assert.deepEqual(readStatus(), {
    status: "stale",
    reason: "receipt_schema_mismatch",
  });

  console.log("[validate-qa-build-freshness] passed");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

function resetFixture() {
  rmSync(fixtureRoot, { recursive: true, force: true });
  mkdirSync(resolve(runtimeRoot, "server"), { recursive: true });
  writeFileSync(resolve(runtimeRoot, "server/index.mjs"), "export const fixture = true;\n");
}

function readStatus() {
  const result = evaluateQaBuildFreshness({
    artifactFingerprint: fingerprintQaBuildArtifact({ freshnessPath, runtimeRoot }),
    freshnessPath,
    rootDir,
  });
  return {
    status: result.status,
    reason: result.reason,
  };
}

function differentDigest(digest) {
  return digest.startsWith("0") ? `1${digest.slice(1)}` : `0${digest.slice(1)}`;
}
