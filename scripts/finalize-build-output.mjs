import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
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

  for (const outputPath of localRequiredOutputs) {
    if (!existsSync(outputPath)) {
      throw new Error(`Expected finalized Nitro build artifact is missing: ${outputPath}`);
    }
  }

  validateLocalBuildOutput({ rootDir });
}

function finalizeVercelOutput() {
  copyDirectory(sourcePublicDir, vercelStaticDir);

  for (const outputPath of vercelRequiredOutputs) {
    if (!existsSync(outputPath)) {
      throw new Error(`Expected finalized Vercel build artifact is missing: ${outputPath}`);
    }
  }

  validateVercelBuildOutput({ rootDir });
}

function copyDirectory(sourceDir, destinationDir) {
  if (!existsSync(sourceDir)) {
    return;
  }

  mkdirSync(destinationDir, { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true });
}
