import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
const vercelOutputDir = resolve(rootDir, ".vercel/output");
const vercelStaticDir = resolve(vercelOutputDir, "static");
const vercelFunctionDir = resolve(vercelOutputDir, "functions/__server.func");
const vercelNitroManifest = resolve(vercelOutputDir, "nitro.json");
const vercelConfig = resolve(vercelOutputDir, "config.json");
const planPresetProgramSourceDir = resolve(rootDir, "src/lib/plan-presets");
const planPresetProgramFiles = [
  "preset-program-scenario-matrix.csv",
  "preset-program-load-adjustments.csv",
  "preset-workout-identity-library.csv",
  "preset-goal-contract-matrix.csv",
  "preset-phase-template-table.csv",
  "preset-weekly-archetype-table.csv",
  "preset-identity-placement-rules.csv",
  "preset-segment-anatomy-table.csv",
  "preset-progression-math-rules.csv",
  "preset-quality-gates.csv",
  "preset-builder-io-contract.csv",
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
  finalizeVercelOutput();
} else {
  finalizeLocalOutput();
}

function shouldFinalizeVercelOutput() {
  const hasVercelOutput = existsSync(vercelOutputDir);
  const hasLocalOutput = existsSync(outputNitroManifest) || existsSync(outputServerDir);
  const isVercelBuild = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";

  return hasVercelOutput && (isVercelBuild || !hasLocalOutput);
}

function finalizeLocalOutput() {
  copyDirectory(stagedPublicDir, outputPublicDir);
  copyDirectory(sourcePublicDir, outputPublicDir);
  copyPlanPresetProgramArtifacts(localPlanPresetProgramOutputDir);

  for (const outputPath of localRequiredOutputs) {
    if (!existsSync(outputPath)) {
      throw new Error(`Expected finalized Nitro build artifact is missing: ${outputPath}`);
    }
  }

  validatePlanPresetProgramArtifacts(localPlanPresetProgramOutputDir);

  validateLocalBuildOutput({ rootDir });
}

function finalizeVercelOutput() {
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
