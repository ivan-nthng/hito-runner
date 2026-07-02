import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import {
  validateLocalBuildOutput,
  validateVercelBuildOutput,
} from "./validate-build-output-integrity.mjs";
import { releaseBuildOutputLock } from "./lib/build-output-lock.mjs";
import { resolveQaRuntimePaths } from "./lib/qa-runtime-paths.mjs";

const rootDir = process.cwd();
const qaRuntimePaths = resolveQaRuntimePaths({ rootDir });

const stagedNitroDir = qaRuntimePaths.nitroBuildDir;
const stagedPublicDir = qaRuntimePaths.nitroStagedPublicDir;
const sourcePublicDir = resolve(rootDir, "public");
const outputPublicDir = qaRuntimePaths.nitroPublicDir;
const outputServerDir = qaRuntimePaths.nitroServerDir;
const outputNitroManifest = qaRuntimePaths.nitroOutputManifest;
const localFinalizeBackupDir = qaRuntimePaths.finalizeBackupDir;
const localFinalizeServerBackupDir = resolve(localFinalizeBackupDir, "server");
const localFinalizePublicBackupDir = resolve(localFinalizeBackupDir, "public");
const localFinalizeNitroManifestBackup = resolve(localFinalizeBackupDir, "nitro.json");
const localFinalizedOutputDir = qaRuntimePaths.runtimeRoot;
const localFinalizedServerDir = resolve(localFinalizedOutputDir, "server");
const localFinalizedPublicDir = resolve(localFinalizedOutputDir, "public");
const localFinalizedNitroManifest = resolve(localFinalizedOutputDir, "nitro.json");
const localFinalizedPreviousDir = qaRuntimePaths.finalizedPreviousDir;
const localFinalizedStagingDir = qaRuntimePaths.finalizedStagingDir;
const localFinalizedStagingServerDir = resolve(localFinalizedStagingDir, "server");
const localFinalizedStagingPublicDir = resolve(localFinalizedStagingDir, "public");
const localFinalizedStagingNitroManifest = resolve(localFinalizedStagingDir, "nitro.json");
const clientPublicSnapshotDir = qaRuntimePaths.publicSnapshotDir;
const vercelOutputDir = resolve(rootDir, ".vercel/output");
const vercelStaticDir = resolve(vercelOutputDir, "static");
const vercelFunctionDir = resolve(vercelOutputDir, "functions/__server.func");
const vercelNitroManifest = resolve(vercelOutputDir, "nitro.json");
const vercelConfig = resolve(vercelOutputDir, "config.json");
const planPresetProgramSourceDir = resolve(rootDir, "src/lib/plan-presets");
const planPresetProgramFiles = [
  "preset-program-scenario-matrix.csv",
  "preset-program-load-adjustments.csv",
  "preset-goal-contract-matrix.csv",
];
const localFinalizedPlanPresetProgramOutputDir = resolve(
  localFinalizedServerDir,
  "src/lib/plan-presets",
);
const localFinalizedStagingPlanPresetProgramOutputDir = resolve(
  localFinalizedStagingServerDir,
  "src/lib/plan-presets",
);
const vercelPlanPresetProgramOutputDir = resolve(vercelFunctionDir, "src/lib/plan-presets");

const localRequiredOutputs = [
  outputNitroManifest,
  resolve(outputPublicDir, "favicon.svg"),
  resolve(outputPublicDir, "templates/hito-training-plan-v2-template.json"),
  resolve(outputServerDir, "index.mjs"),
];

const vercelRequiredOutputs = [
  vercelStaticDir,
  resolve(vercelStaticDir, "favicon.svg"),
  resolve(vercelStaticDir, "templates/hito-training-plan-v2-template.json"),
  resolve(vercelFunctionDir, "index.mjs"),
  vercelConfig,
  vercelNitroManifest,
];

try {
  if (shouldFinalizeVercelOutput()) {
    await finalizeVercelOutput();
  } else {
    await finalizeLocalOutput();
  }
} finally {
  releaseBuildOutputLock({ rootDir });
}

function shouldFinalizeVercelOutput() {
  const hasVercelOutput = existsSync(vercelOutputDir);
  const isVercelBuild = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";

  return isVercelBuild && hasVercelOutput;
}

async function finalizeLocalOutput() {
  snapshotLocalOutputForLateNitroCleanup();
  await restoreLocalOutputAfterLateNitroCleanup();
  publishLocalFinalizedOutput();
  await cleanupGeneratedConflictResidueAfterLocalPublish();

  for (const outputPath of localRequiredOutputs) {
    if (!existsSync(outputPath)) {
      throw new Error(`Expected finalized Nitro build artifact is missing: ${outputPath}`);
    }
  }

  validatePlanPresetProgramArtifacts(localFinalizedPlanPresetProgramOutputDir);

  cleanupLocalFinalizeScratch();

  validateLocalBuildOutput({ rootDir });
}

async function finalizeVercelOutput() {
  copyDirectory(sourcePublicDir, vercelStaticDir);
  copyPlanPresetProgramArtifacts(vercelPlanPresetProgramOutputDir);

  for (const outputPath of vercelRequiredOutputs) {
    if (!existsSync(outputPath)) {
      throw new Error(`Expected finalized Vercel build artifact is missing: ${outputPath}`);
    }
  }

  validatePlanPresetProgramArtifacts(vercelPlanPresetProgramOutputDir);

  validateVercelBuildOutput({ rootDir });
}

function copyDirectory(sourceDir, destinationDir) {
  if (!existsSync(sourceDir)) {
    return;
  }

  removeGeneratedSiblingConflicts(destinationDir);
  mkdirSync(destinationDir, { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true });
}

function copyGeneratedDirectory(sourceDir, destinationDir) {
  if (!existsSync(sourceDir)) {
    return;
  }

  removeGeneratedSiblingConflicts(destinationDir);
  mkdirSync(destinationDir, { recursive: true });
  cpSync(sourceDir, destinationDir, {
    recursive: true,
    filter: shouldCopyGeneratedBuildPath,
  });
}

function copyGeneratedFile(sourcePath, destinationPath) {
  if (!existsSync(sourcePath)) {
    return;
  }

  removeGeneratedSiblingConflicts(destinationPath);
  mkdirSync(dirname(destinationPath), { recursive: true });
  cpSync(sourcePath, destinationPath);
}

function shouldCopyGeneratedBuildPath(sourcePath) {
  const entryName = basename(sourcePath);
  // Local sync can resurrect duplicate generated dirs such as "assets 2";
  // keep the canonical sibling as the only finalized build artifact.
  return canonicalGeneratedSiblingName(entryName) === entryName;
}

function snapshotLocalOutputForLateNitroCleanup() {
  removeGeneratedPath(localFinalizeBackupDir);
  removeGeneratedSiblingConflicts(localFinalizeBackupDir);
  removeGeneratedPath(localFinalizedStagingDir);
  removeGeneratedSiblingConflicts(localFinalizedStagingDir);

  copyGeneratedDirectory(outputServerDir, localFinalizeServerBackupDir);
  copyGeneratedDirectory(outputPublicDir, localFinalizePublicBackupDir);
  copyGeneratedFile(outputNitroManifest, localFinalizeNitroManifestBackup);
}

async function restoreLocalOutputAfterLateNitroCleanup() {
  const settleWindowsMs = [250, 750, 1500];

  for (const settleMs of settleWindowsMs) {
    await new Promise((resolvePromise) => {
      setTimeout(resolvePromise, settleMs);
    });

    restoreLocalOutputSnapshot();
    restoreLocalPublicOutput();
  }
}

function restoreLocalOutputSnapshot() {
  copyGeneratedDirectory(localFinalizeServerBackupDir, localFinalizedStagingServerDir);
  copyPlanPresetProgramArtifacts(localFinalizedStagingPlanPresetProgramOutputDir);
  copyGeneratedDirectory(localFinalizePublicBackupDir, localFinalizedStagingPublicDir);
  copyGeneratedFile(localFinalizeNitroManifestBackup, localFinalizedStagingNitroManifest);
}

function restoreLocalPublicOutput() {
  copyGeneratedDirectory(clientPublicSnapshotDir, localFinalizedStagingPublicDir);
  copyGeneratedDirectory(stagedPublicDir, localFinalizedStagingPublicDir);
  copyDirectory(sourcePublicDir, localFinalizedStagingPublicDir);
}

function publishLocalFinalizedOutput() {
  const stagedRequiredOutputs = [
    localFinalizedStagingNitroManifest,
    resolve(localFinalizedStagingPublicDir, "favicon.svg"),
    resolve(localFinalizedStagingPublicDir, "templates/hito-training-plan-v2-template.json"),
    resolve(localFinalizedStagingServerDir, "index.mjs"),
  ];

  for (const outputPath of stagedRequiredOutputs) {
    if (!existsSync(outputPath)) {
      throw new Error(`Expected staged finalized Nitro build artifact is missing: ${outputPath}`);
    }
  }

  replaceGeneratedDirectory({
    destinationDir: localFinalizedOutputDir,
    previousDir: localFinalizedPreviousDir,
    stagedDir: localFinalizedStagingDir,
  });
}

function cleanupLocalFinalizeScratch() {
  const scratchDirs = [
    localFinalizeBackupDir,
    localFinalizedPreviousDir,
    localFinalizedStagingDir,
    clientPublicSnapshotDir,
  ];

  for (const scratchDir of scratchDirs) {
    removeGeneratedPath(scratchDir);
    removeGeneratedSiblingConflicts(scratchDir);
  }
}

async function cleanupGeneratedConflictResidueAfterLocalPublish() {
  const settleWindowsMs = [0, 250, 750, 1500];
  const generatedRoots = [
    resolve(rootDir, ".output"),
    stagedNitroDir,
    qaRuntimePaths.nitroOutputDir,
    qaRuntimePaths.buildOutputRoot,
    qaRuntimePaths.viteCacheDir,
    localFinalizedOutputDir,
    localFinalizeBackupDir,
    localFinalizedPreviousDir,
    localFinalizedStagingDir,
    clientPublicSnapshotDir,
  ];

  for (const settleMs of settleWindowsMs) {
    if (settleMs > 0) {
      await new Promise((resolvePromise) => {
        setTimeout(resolvePromise, settleMs);
      });
    }

    for (const generatedRoot of generatedRoots) {
      removeGeneratedSiblingConflictsRecursively(generatedRoot);
    }
  }
}

function copyPlanPresetProgramArtifacts(destinationDir) {
  for (const fileName of planPresetProgramFiles) {
    const sourcePath = resolve(planPresetProgramSourceDir, fileName);
    const destinationPath = resolve(destinationDir, fileName);

    mkdirSync(dirname(destinationPath), { recursive: true });
    cpSync(sourcePath, destinationPath);
  }
}

function validatePlanPresetProgramArtifacts(destinationDir) {
  for (const fileName of planPresetProgramFiles) {
    const outputPath = resolve(destinationDir, fileName);

    if (!existsSync(outputPath)) {
      throw new Error(`Expected finalized Plan Preset program artifact is missing: ${outputPath}`);
    }
  }
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

function removeGeneratedSiblingConflictsRecursively(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const entry of readdirSync(path)) {
    const entryPath = resolve(path, entry);

    if (isGeneratedSiblingConflictName(entry)) {
      removeGeneratedPath(entryPath);
      continue;
    }

    const stats = lstatSync(entryPath);
    if (stats.isDirectory() && !stats.isSymbolicLink()) {
      removeGeneratedSiblingConflictsRecursively(entryPath);
    }
  }
}

function replaceGeneratedDirectory({ destinationDir, previousDir, stagedDir }) {
  removeGeneratedPath(previousDir);
  removeGeneratedSiblingConflicts(previousDir);
  removeGeneratedSiblingConflicts(destinationDir);

  const hadDestination = existsSync(destinationDir);

  try {
    if (hadDestination) {
      renameSync(destinationDir, previousDir);
    }

    renameSync(stagedDir, destinationDir);
    removeGeneratedPath(previousDir);
    removeGeneratedSiblingConflicts(destinationDir);
  } catch (error) {
    if (!existsSync(destinationDir) && existsSync(previousDir)) {
      renameSync(previousDir, destinationDir);
    }

    throw error;
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

function isGeneratedSiblingConflictName(entryName) {
  return canonicalGeneratedSiblingName(entryName) !== entryName;
}
