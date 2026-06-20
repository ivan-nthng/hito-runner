import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { acquireBuildOutputLock } from "./lib/build-output-lock.mjs";

const isVercelBuild = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";
const generatedBuildPaths = [
  ".output",
  "node_modules/.nitro",
  ".vercel/output",
  "logs/build-output-finalized",
  "logs/build-output-finalize-backup",
  "logs/build-output-public-snapshot",
];

console.warn(
  `[clean-build-output] Removing generated ${isVercelBuild ? "Vercel" : "local"} build output. Restart any built-runtime server after rebuilding.`,
);

acquireBuildOutputLock({ rootDir: process.cwd() });

for (const relativePath of generatedBuildPaths) {
  rmSync(resolve(process.cwd(), relativePath), {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 125,
  });
}
