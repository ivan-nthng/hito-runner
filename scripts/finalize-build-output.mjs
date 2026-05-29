import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();

const stagedPublicDir = resolve(rootDir, "node_modules/.nitro/vite/public");
const stagedServerDir = resolve(rootDir, "node_modules/.nitro/vite/server-output");
const sourcePublicDir = resolve(rootDir, "public");
const outputPublicDir = resolve(rootDir, ".output/public");
const outputServerDir = resolve(rootDir, ".output/server");

const requiredSources = [stagedPublicDir, stagedServerDir];
const requiredOutputs = [
  resolve(outputPublicDir, "favicon.svg"),
  resolve(outputPublicDir, "templates/hito-training-plan-v2-template.json"),
  resolve(outputServerDir, "index.mjs"),
];

for (const sourceDir of requiredSources) {
  if (!existsSync(sourceDir)) {
    throw new Error(`Expected staged Nitro build output is missing: ${sourceDir}`);
  }
}

copyDirectory(stagedPublicDir, outputPublicDir);
copyDirectory(sourcePublicDir, outputPublicDir);
copyDirectory(stagedServerDir, outputServerDir);

for (const outputPath of requiredOutputs) {
  if (!existsSync(outputPath)) {
    throw new Error(`Expected finalized Nitro build artifact is missing: ${outputPath}`);
  }
}

function copyDirectory(sourceDir, destinationDir) {
  if (!existsSync(sourceDir)) {
    return;
  }

  mkdirSync(destinationDir, { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true });
}
