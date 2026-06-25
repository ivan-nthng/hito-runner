import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import {
  validateLocalBuildOutput,
  validateVercelBuildOutput,
} from "./validate-build-output-integrity.mjs";
import { releaseBuildOutputLock } from "./lib/build-output-lock.mjs";

const rootDir = process.cwd();

const stagedPublicDir = resolve(rootDir, "node_modules/.nitro/vite/public");
const sourcePublicDir = resolve(rootDir, "public");
const outputPublicDir = resolve(rootDir, ".output/public");
const outputServerDir = resolve(rootDir, ".output/server");
const outputNitroManifest = resolve(rootDir, ".output/nitro.json");
const localFinalizeBackupDir = resolve(rootDir, "logs/build-output-finalize-backup");
const localFinalizeServerBackupDir = resolve(localFinalizeBackupDir, "server");
const localFinalizePublicBackupDir = resolve(localFinalizeBackupDir, "public");
const localFinalizedOutputDir = resolve(rootDir, "logs/build-output-finalized");
const localFinalizedServerDir = resolve(localFinalizedOutputDir, "server");
const localFinalizedPublicDir = resolve(localFinalizedOutputDir, "public");
const localFinalizedNitroManifest = resolve(localFinalizedOutputDir, "nitro.json");
const clientPublicSnapshotDir = resolve(rootDir, "logs/build-output-public-snapshot");
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
const localPlanPresetProgramOutputDir = resolve(outputServerDir, "src/lib/plan-presets");
const localFinalizedPlanPresetProgramOutputDir = resolve(
  localFinalizedServerDir,
  "src/lib/plan-presets",
);
const vercelPlanPresetProgramOutputDir = resolve(vercelFunctionDir, "src/lib/plan-presets");

const localRequiredOutputs = [
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

  for (const outputPath of localRequiredOutputs) {
    if (!existsSync(outputPath)) {
      throw new Error(`Expected finalized Nitro build artifact is missing: ${outputPath}`);
    }
  }

  validatePlanPresetProgramArtifacts(localPlanPresetProgramOutputDir);

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
  const canonicalEntryName = entryName.replace(/ \d+$/, "");

  if (canonicalEntryName === entryName) {
    return true;
  }

  return !existsSync(resolve(dirname(sourcePath), canonicalEntryName));
}

function snapshotLocalOutputForLateNitroCleanup() {
  removeGeneratedPath(localFinalizeBackupDir);
  removeGeneratedSiblingConflicts(localFinalizeBackupDir);
  removeGeneratedPath(localFinalizedOutputDir);
  removeGeneratedSiblingConflicts(localFinalizedOutputDir);

  copyGeneratedDirectory(outputServerDir, localFinalizeServerBackupDir);
  copyGeneratedDirectory(outputPublicDir, localFinalizePublicBackupDir);
  copyGeneratedFile(outputNitroManifest, localFinalizedNitroManifest);
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
  copyGeneratedDirectory(localFinalizeServerBackupDir, localFinalizedServerDir);
  copyPlanPresetProgramArtifacts(localFinalizedPlanPresetProgramOutputDir);
  copyGeneratedDirectory(localFinalizePublicBackupDir, localFinalizedPublicDir);
  linkLocalOutputDirectory(localFinalizedServerDir, outputServerDir);
  linkLocalOutputDirectory(localFinalizedPublicDir, outputPublicDir);
}

function restoreLocalPublicOutput() {
  copyGeneratedDirectory(clientPublicSnapshotDir, localFinalizedPublicDir);
  copyGeneratedDirectory(stagedPublicDir, localFinalizedPublicDir);
  copyDirectory(sourcePublicDir, localFinalizedPublicDir);
  linkLocalOutputDirectory(localFinalizedPublicDir, outputPublicDir);
}

function linkLocalOutputDirectory(sourceDir, outputPath) {
  if (!existsSync(sourceDir)) {
    return;
  }

  const linkTarget = relative(dirname(outputPath), sourceDir);

  removeGeneratedPath(outputPath);
  removeGeneratedSiblingConflicts(outputPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  symlinkSync(linkTarget, outputPath, "dir");
  canonicalizeGeneratedSymlink({ outputPath, linkTarget });

  if (!existsSync(outputPath)) {
    throw new Error(`Expected finalized local build output link is missing: ${outputPath}`);
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

function canonicalizeGeneratedSymlink({ outputPath, linkTarget }) {
  if (existsSync(outputPath)) {
    return;
  }

  const conflictPath = generatedSiblingConflictPaths(outputPath).find((candidatePath) =>
    symlinkPointsTo(candidatePath, linkTarget),
  );

  if (conflictPath) {
    renameSync(conflictPath, outputPath);
  }
}

function generatedSiblingConflictPaths(path) {
  const parentDir = dirname(path);
  const entryName = basename(path);

  if (!existsSync(parentDir)) {
    return [];
  }

  const conflictPattern = new RegExp(`^${escapeRegExp(entryName)} \\d+$`);

  return readdirSync(parentDir)
    .filter((entry) => conflictPattern.test(entry))
    .map((entry) => resolve(parentDir, entry));
}

function symlinkPointsTo(path, linkTarget) {
  try {
    return lstatSync(path).isSymbolicLink() && readlinkSync(path) === linkTarget;
  } catch {
    return false;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
