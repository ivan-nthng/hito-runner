#!/usr/bin/env node
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveQaRuntimePaths } from "./lib/qa-runtime-paths.mjs";

const { serverEntry } = resolveQaRuntimePaths({ rootDir: process.cwd() });
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

if (!existsSync(serverEntry)) {
  throw new Error(
    `Local QA runtime is missing: ${serverEntry}. Run npm run build before npm run serve:local.`,
  );
}

const runtimeArgs = withDefaultHostAndPort(process.argv.slice(2));
const host = readOption(runtimeArgs, "--host");
const port = readOption(runtimeArgs, "--port");
const providerMode = resolveProviderMode(process.env.HITO_AI_GENERATED_PLAN_PROVIDER_MODE);

if (!host || !LOOPBACK_HOSTNAMES.has(host.toLowerCase())) {
  throw new Error(`Local QA runtime host must be loopback; received ${host ?? "none"}.`);
}

if (!port || !/^\d+$/.test(port)) {
  throw new Error(`Local QA runtime port must be numeric; received ${port ?? "none"}.`);
}

if (!isLoopbackUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
  throw new Error(
    "Local QA runtime requires loopback NEXT_PUBLIC_SUPABASE_URL. Run npm run supabase:local:configure.",
  );
}

process.env.NITRO_HOST = host;
process.env.HOST = host;
process.env.NITRO_PORT = port;
process.env.PORT = port;
process.env.HITO_LOCAL_RUNTIME_URL = `http://${formatUrlHost(host)}:${port}`;
process.env.HITO_LOCAL_RUNTIME_OBSERVABILITY = "1";
process.env.HITO_LOCAL_RUNTIME_OBSERVABILITY_ROOT = resolve(
  homedir(),
  "Library/Caches/hito-running/local-runtime-observability",
);
process.env.HITO_AI_GENERATED_PLAN_PROVIDER_MODE = providerMode;
process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE = providerMode === "qa_fixture" ? "true" : "false";
if (providerMode === "real") {
  delete process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE_DELAY_MS;
  delete process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE_SCENARIO;
}
process.argv = [process.execPath, serverEntry, ...runtimeArgs];

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

function readOption(args, name) {
  const equalsEntry = args.find((entry) => entry.startsWith(`${name}=`));
  if (equalsEntry) return equalsEntry.slice(name.length + 1);

  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? null) : null;
}

function isLoopbackUrl(value) {
  if (!value) return false;

  try {
    return LOOPBACK_HOSTNAMES.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function formatUrlHost(host) {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

function resolveProviderMode(value) {
  if (!value || value === "real") {
    return "real";
  }
  if (value === "qa_fixture") {
    return "qa_fixture";
  }

  throw new Error("HITO_AI_GENERATED_PLAN_PROVIDER_MODE must be real or qa_fixture.");
}
