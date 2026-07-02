#!/usr/bin/env node
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolveQaRuntimePaths } from "./lib/qa-runtime-paths.mjs";

const { serverEntry } = resolveQaRuntimePaths({ rootDir: process.cwd() });

if (!existsSync(serverEntry)) {
  throw new Error(
    `Local QA runtime is missing: ${serverEntry}. Run npm run build before npm run serve:local.`,
  );
}

process.argv = [process.execPath, serverEntry, ...withDefaultHostAndPort(process.argv.slice(2))];

await import(pathToFileURL(serverEntry).href);

function withDefaultHostAndPort(args) {
  const nextArgs = [...args];

  if (!nextArgs.includes("--host")) {
    nextArgs.push("--host", "127.0.0.1");
  }

  if (!nextArgs.includes("--port")) {
    nextArgs.push("--port", "3000");
  }

  return nextArgs;
}
