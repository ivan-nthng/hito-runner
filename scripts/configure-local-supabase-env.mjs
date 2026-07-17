#!/usr/bin/env node
import { chmod, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SUPABASE_CLI_VERSION = "2.109.1";
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const MANAGED_ENV_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "LOCAL_AUTH_BYPASS_ENABLED",
  "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]);
const rootDir = process.cwd();
const envPath = path.resolve(rootDir, ".env.local");
const checkOnly = process.argv.includes("--check");

const localStatus = readLocalSupabaseStatus();
const apiUrl = requireStatusValue(localStatus, "API_URL");
const publishableKey = localStatus.PUBLISHABLE_KEY ?? requireStatusValue(localStatus, "ANON_KEY");
const secretKey = localStatus.SECRET_KEY ?? requireStatusValue(localStatus, "SERVICE_ROLE_KEY");
const target = parseLoopbackTarget(apiUrl);

if (!target) {
  throw new Error(
    "Local Supabase status returned a non-loopback API URL; refusing to configure Hito.",
  );
}

if (!checkOnly) {
  const existing = await readOptionalFile(envPath);
  const managedValues = {
    NEXT_PUBLIC_SUPABASE_URL: target.origin,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET_KEY: secretKey,
    LOCAL_AUTH_BYPASS_ENABLED: "true",
    LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: ".tanstack/hito-running-local-accounts.json",
  };
  const nextEnv = renderLocalEnv(existing, managedValues);

  await writeFile(envPath, nextEnv, { encoding: "utf8", mode: 0o600 });
  await chmod(envPath, 0o600);

  const accountsPath = path.resolve(rootDir, managedValues.LOCAL_AUTH_BYPASS_ACCOUNTS_FILE);
  try {
    await chmod(accountsPath, 0o600);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: checkOnly ? "check" : "configure",
      supabaseOrigin: target.origin,
      loopback: true,
      envFile: checkOnly ? null : path.relative(rootDir, envPath),
      serviceCredentialPrinted: false,
    },
    null,
    2,
  ),
);

function readLocalSupabaseStatus() {
  const result = spawnSync(
    "npx",
    ["--yes", `supabase@${SUPABASE_CLI_VERSION}`, "status", "-o", "env"],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: process.env,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      "Local Supabase is unavailable. Start Docker Desktop and run npx --yes supabase@2.109.1 start.",
    );
  }

  return parseEnvOutput(result.stdout);
}

function parseEnvOutput(output) {
  const parsed = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    parsed[match[1]] = unquote(match[2].trim());
  }

  return parsed;
}

function requireStatusValue(status, key) {
  const value = status[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Local Supabase status did not provide ${key}.`);
  }

  return value.trim();
}

function parseLoopbackTarget(value) {
  try {
    const parsed = new URL(value);
    return LOOPBACK_HOSTNAMES.has(parsed.hostname.toLowerCase()) ? { origin: parsed.origin } : null;
  } catch {
    return null;
  }
}

function renderLocalEnv(existing, managedValues) {
  const retainedLines = existing.split(/\r?\n/).filter((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    return !match || !MANAGED_ENV_KEYS.has(match[1]);
  });

  while (retainedLines.at(-1) === "") {
    retainedLines.pop();
  }

  return [
    ...retainedLines,
    "",
    "# Managed by npm run supabase:local:configure. Local development and QA are loopback-only.",
    ...Object.entries(managedValues).map(([key, value]) => `${key}=${JSON.stringify(value)}`),
    "",
  ].join("\n");
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) return "";
    throw error;
  }
}

function isMissingFileError(error) {
  return error && typeof error === "object" && "code" in error && error.code === "ENOENT";
}

function unquote(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
