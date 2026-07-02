import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { acquireBuildOutputLock, releaseBuildOutputLock } from "./lib/build-output-lock.mjs";
import { resolveQaRuntimePaths } from "./lib/qa-runtime-paths.mjs";

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
  qaRuntimePaths.nitroBuildDir,
  qaRuntimePaths.nitroOutputDir,
  qaRuntimePaths.viteCacheDir,
  qaRuntimePaths.runtimeRoot,
  qaRuntimePaths.finalizeBackupDir,
  qaRuntimePaths.finalizedPreviousDir,
  qaRuntimePaths.finalizedStagingDir,
  qaRuntimePaths.publicSnapshotDir,
];

console.warn(
  `[clean-build-output] Removing generated ${isVercelBuild ? "Vercel" : "local"} build output. Restart any built-runtime server after rebuilding.`,
);

acquireBuildOutputLock({ rootDir });

try {
  if (!isVercelBuild) {
    stopManagedQaServerBeforeCleaning();
  }

  for (const relativePath of generatedBuildPaths) {
    const generatedPath = resolve(rootDir, relativePath);
    removeGeneratedPath(generatedPath);
    removeGeneratedSiblingConflicts(generatedPath);
  }
} catch (error) {
  releaseBuildOutputLock({ rootDir });
  throw error;
}

function stopManagedQaServerBeforeCleaning() {
  const result = spawnSync(process.execPath, ["./scripts/qa-local-server.mjs", "stop"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      HITO_QA_SERVER_STOP_FOR_BUILD: "1",
    },
  });

  if (result.status === 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();

    if (output) {
      console.warn(`[clean-build-output] ${output}`);
    }
    return;
  }

  const output = [result.stderr?.trim(), result.stdout?.trim()].filter(Boolean).join(" ");

  if (output.includes("Refusing to stop unmanaged process")) {
    console.warn(
      `[clean-build-output] QA server stop preflight found an unmanaged port 3000 process; continuing build clean without stopping it. ${output}`,
    );
    return;
  }

  throw new Error(
    `[clean-build-output] QA server stop preflight failed before build-output clean. ${output}`,
  );
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

function generatedSiblingConflictPaths(path) {
  const parentDir = dirname(path);
  const canonicalName = basename(path);

  if (!existsSync(parentDir)) {
    return [];
  }

  return readdirSync(parentDir)
    .filter(
      (entry) => entry !== canonicalName && canonicalGeneratedSiblingName(entry) === canonicalName,
    )
    .map((entry) => resolve(parentDir, entry));
}

function canonicalGeneratedSiblingName(entryName) {
  const extensionConflict = /^(.*) \d+(\.[^/.]+)$/.exec(entryName);
  if (extensionConflict) {
    return `${extensionConflict[1]}${extensionConflict[2]}`;
  }

  const bareConflict = /^(.*) \d+$/.exec(entryName);
  return bareConflict ? bareConflict[1] : entryName;
}
