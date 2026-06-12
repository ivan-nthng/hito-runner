import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import {
  validateLocalBuildOutput,
  validateVercelBuildOutput,
} from "./validate-build-output-integrity.mjs";

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

if (shouldFinalizeVercelOutput()) {
  await finalizeVercelOutput();
} else {
  await finalizeLocalOutput();
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

  mkdirSync(destinationDir, { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true });
}

function snapshotLocalOutputForLateNitroCleanup() {
  rmSync(localFinalizeBackupDir, { recursive: true, force: true });
  rmSync(localFinalizedOutputDir, { recursive: true, force: true });

  copyDirectory(outputServerDir, localFinalizeServerBackupDir);
  copyDirectory(outputPublicDir, localFinalizePublicBackupDir);
}

async function restoreLocalOutputAfterLateNitroCleanup() {
  const settleWindowsMs = [250, 750, 1500];

  for (const settleMs of settleWindowsMs) {
    await new Promise((resolvePromise) => {
      setTimeout(resolvePromise, settleMs);
    });

    restoreLocalOutputSnapshot();
    restoreLocalPublicOutput();
    copyPlanPresetProgramArtifacts(localPlanPresetProgramOutputDir);
  }
}

function restoreLocalOutputSnapshot() {
  copyDirectory(localFinalizeServerBackupDir, localFinalizedServerDir);
  copyDirectory(localFinalizePublicBackupDir, localFinalizedPublicDir);
  linkLocalOutputDirectory(localFinalizedServerDir, outputServerDir);
  linkLocalOutputDirectory(localFinalizedPublicDir, outputPublicDir);
}

function restoreLocalPublicOutput() {
  copyDirectory(clientPublicSnapshotDir, localFinalizedPublicDir);
  copyDirectory(stagedPublicDir, localFinalizedPublicDir);
  copyDirectory(sourcePublicDir, localFinalizedPublicDir);
  linkLocalOutputDirectory(localFinalizedPublicDir, outputPublicDir);
}

function linkLocalOutputDirectory(sourceDir, outputPath) {
  if (!existsSync(sourceDir)) {
    return;
  }

  rmSync(outputPath, { recursive: true, force: true });
  mkdirSync(dirname(outputPath), { recursive: true });
  symlinkSync(relative(dirname(outputPath), sourceDir), outputPath, "dir");
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
