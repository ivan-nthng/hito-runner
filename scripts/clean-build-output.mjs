import { rmSync } from "node:fs";
import { resolve } from "node:path";

const generatedBuildPaths = [".output", "node_modules/.nitro"];

for (const relativePath of generatedBuildPaths) {
  rmSync(resolve(process.cwd(), relativePath), { recursive: true, force: true });
}
