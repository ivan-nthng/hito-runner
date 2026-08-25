import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { acquireBuildOutputLock, releaseBuildOutputLock } from "./lib/build-output-lock.mjs";
import { generatedSiblingConflictPaths, resolveQaRuntimePaths } from "./lib/qa-runtime-paths.mjs";

const isVercelBuild = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";
const rootDir = process.cwd();
const qaRuntimePaths = resolveQaRuntimePaths({ rootDir });
const generatedBuildPaths = [
  ".output",
  "node_modules/.nitro",
  ".vercel/output",
  "logs/build-output-finalized",
  "logs/build-output-finalize-backup",
  "logs/build-output-finalized-previous",
  "logs/build-output-finalized-staging",
  "logs/build-output-public-snapshot",
  qaRuntimePaths.buildOutputRoot,
  qaRuntimePaths.runtimeRoot,
  qaRuntimePaths.finalizeBackupDir,
  qaRuntimePaths.finalizedPreviousDir,
  qaRuntimePaths.finalizedStagingDir,
  qaRuntimePaths.publicSnapshotDir,
];

console.warn(
  `[clean-build-output] Removing generated ${isVercelBuild ? "Vercel" : "local"} build output. Managed runtime slots keep their immutable published snapshots.`,
);

acquireBuildOutputLock({ rootDir });

try {
  for (const relativePath of generatedBuildPaths) {
    const generatedPath = resolve(rootDir, relativePath);
    removeGeneratedPath(generatedPath);
    removeGeneratedSiblingConflicts(generatedPath);
  }
} catch (error) {
  releaseBuildOutputLock({ rootDir });
  throw error;
}

function removeGeneratedPath(path) {
  rmSync(path, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 125,
  });
}

function removeGeneratedSiblingConflicts(path) {
  for (const conflictPath of generatedSiblingConflictPaths(path)) {
    removeGeneratedPath(conflictPath);
  }
}
