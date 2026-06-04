import { rmSync } from "node:fs";
import { resolve } from "node:path";

const isVercelBuild = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";
const generatedBuildPaths = [
  ".output",
  "node_modules/.nitro",
  ...(isVercelBuild ? [".vercel/output"] : []),
];

console.warn(
  `[clean-build-output] Removing generated ${isVercelBuild ? "Vercel" : "local"} build output. Restart any built-runtime server after rebuilding.`,
);

for (const relativePath of generatedBuildPaths) {
  rmSync(resolve(process.cwd(), relativePath), { recursive: true, force: true });
}
