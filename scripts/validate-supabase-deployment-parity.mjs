import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_CLI_VERSION = "2.109.1";
const PRODUCTION_SUPABASE_PROJECT_REF = "dltfjwexyctmihclcjqj";
const REQUIRED_PROFILE_COLUMNS = ["baseline_revision", "fitness_level", "heart_rate_profile"];
const REQUIRED_REVIEW_RPC = "apply_reviewed_plan_persistence";
const REQUIRED_MIGRATION_HISTORY_RPC = "list_hito_applied_migration_versions";
const args = new Set(process.argv.slice(2));
const vercelBuild = args.has("--vercel-build");
const checkLinkedMigrations = args.has("--linked");
const vercelBuildRuntime = vercelBuild && process.env.VERCEL === "1";
const localVercelCliBuild =
  vercelBuildRuntime &&
  !process.env.VERCEL_DEPLOYMENT_ID &&
  !process.env.VERCEL_URL &&
  !process.env.VERCEL_GIT_COMMIT_SHA &&
  process.env.CI !== "1";
const remoteVercelDeployment =
  vercelBuildRuntime && /^dpl_[A-Za-z0-9]+$/.test(process.env.VERCEL_DEPLOYMENT_ID?.trim() ?? "");
const checkApiSchema = args.has("--api") || remoteVercelDeployment;

if (vercelBuildRuntime && !localVercelCliBuild && !remoteVercelDeployment) {
  throw new Error(
    "Vercel build context is ambiguous; refusing to downgrade the server schema check.",
  );
}

if (vercelBuild && process.env.VERCEL !== "1") {
  console.warn("[supabase-deployment-parity] Skipped outside Vercel build runtime.");
  process.exit(0);
}

if (!checkLinkedMigrations && !checkApiSchema && !localVercelCliBuild) {
  throw new Error("Pass --linked, --api, or --vercel-build to select a parity check.");
}

const configuredUrl = optionalSupabaseUrl();
const configuredProjectRef = configuredUrl ? projectRefFromUrl(configuredUrl) : null;
const expectedProjectRef =
  process.env.SUPABASE_PROJECT_ID?.trim() || PRODUCTION_SUPABASE_PROJECT_REF;
if (configuredProjectRef && configuredProjectRef !== expectedProjectRef) {
  throw new Error(
    `Configured Supabase project ${configuredProjectRef} does not match intended project ${expectedProjectRef}.`,
  );
}
const result = {};

if (checkLinkedMigrations) {
  result.migrations = validateLinkedMigrations(expectedProjectRef);
}

if (checkApiSchema) {
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for the API-visible schema check.");
  }

  assertHostedUrl(configuredUrl);
  result.api = await validateApiSchema(configuredUrl, {
    requireServerKey: remoteVercelDeployment,
  });
} else if (localVercelCliBuild) {
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for the local Vercel build check.");
  }
  assertHostedUrl(configuredUrl);
  result.api = {
    access: "remote-server-check-required",
    endpoint: "validated",
  };
}

console.log(JSON.stringify({ ok: true, projectRef: expectedProjectRef, ...result }, null, 2));

function validateLinkedMigrations(expectedRef) {
  const linkedRefPath = resolve("supabase/.temp/project-ref");
  if (!existsSync(linkedRefPath)) {
    throw new Error("Supabase CLI project is not linked. Refusing an ambiguous hosted check.");
  }

  const linkedRef = readFileSync(linkedRefPath, "utf8").trim();
  if (!linkedRef) {
    throw new Error("Supabase CLI linked project reference is empty.");
  }
  if (expectedRef && linkedRef !== expectedRef) {
    throw new Error(
      `Linked Supabase project ${linkedRef} does not match configured project ${expectedRef}.`,
    );
  }

  const command = spawnSync(
    "npx",
    [
      "--yes",
      `supabase@${SUPABASE_CLI_VERSION}`,
      "migration",
      "list",
      "--linked",
      "--output-format",
      "json",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: "1" },
    },
  );
  const payload = parseMigrationList(command.stdout);
  const mismatches = payload.migrations.filter(
    (migration) => !migration.local || !migration.remote || migration.local !== migration.remote,
  );

  if (command.error) {
    throw command.error;
  }
  if (!payload.migrations.length) {
    throw new Error("Supabase CLI returned no migration history.");
  }
  if (mismatches.length > 0) {
    throw new Error(
      `Hosted migration history is not at repository parity: ${mismatches
        .map(
          (migration) =>
            `${migration.local || "missing-local"}/${migration.remote || "missing-remote"}`,
        )
        .join(", ")}.`,
    );
  }
  if (command.status !== 0) {
    throw new Error("Supabase CLI migration history check failed.");
  }

  return { projectRef: linkedRef, count: payload.migrations.length };
}

async function validateApiSchema(url, options) {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  // The CLI cannot materialize sensitive values locally. Only a real Vercel
  // deployment may exercise the server-visible OpenAPI and migration checks.
  const serverKey = options.requireServerKey ? process.env.SUPABASE_SECRET_KEY?.trim() : null;
  const bearerToken = options.requireServerKey
    ? process.env.HITO_SUPABASE_SCHEMA_BEARER_TOKEN?.trim() || serverKey
    : null;
  const apiKey = serverKey || publishableKey;
  if (!apiKey) {
    throw new Error("The API-visible schema check requires a Supabase API key.");
  }
  if (options.requireServerKey && !serverKey) {
    throw new Error("Vercel deployment parity requires the server-only Supabase key.");
  }

  const headers = {
    apikey: apiKey,
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
  };
  const columnsUrl = new URL("rest/v1/runner_profiles", withTrailingSlash(url));
  columnsUrl.searchParams.set("select", REQUIRED_PROFILE_COLUMNS.join(","));
  columnsUrl.searchParams.set("limit", "0");
  const columnsResponse = await fetch(columnsUrl, { headers });
  const columnsFailureCode = columnsResponse.ok ? null : await safePostgrestCode(columnsResponse);
  const protectedColumns = columnsResponse.status === 401 && columnsFailureCode === "42501";
  if (!columnsResponse.ok && !protectedColumns) {
    throw new Error(
      `Supabase API schema does not expose the runner baseline contract (${columnsResponse.status}/${columnsFailureCode}).`,
    );
  }

  if (!bearerToken) {
    return {
      access: "protected",
      columns: REQUIRED_PROFILE_COLUMNS,
      rpc: "requires-server-check",
    };
  }

  const openApiResponse = await fetch(new URL("rest/v1/", withTrailingSlash(url)), {
    headers: { ...headers, Accept: "application/openapi+json" },
  });
  if (!openApiResponse.ok) {
    throw new Error(`Supabase OpenAPI schema request failed (${openApiResponse.status}).`);
  }

  const openApi = await openApiResponse.json();
  const profileProperties = openApi.definitions?.runner_profiles?.properties ?? {};
  const missingColumns = REQUIRED_PROFILE_COLUMNS.filter(
    (column) => !Object.prototype.hasOwnProperty.call(profileProperties, column),
  );
  const rpcPath = `/rpc/${REQUIRED_REVIEW_RPC}`;
  const migrationHistoryRpcPath = `/rpc/${REQUIRED_MIGRATION_HISTORY_RPC}`;
  if (
    missingColumns.length > 0 ||
    !openApi.paths?.[rpcPath] ||
    !openApi.paths?.[migrationHistoryRpcPath]
  ) {
    throw new Error(
      `Supabase OpenAPI contract is incomplete: columns=${missingColumns.join(",") || "ok"}, rpc=${
        openApi.paths?.[rpcPath] ? "ok" : "missing"
      }, migrationHistoryRpc=${openApi.paths?.[migrationHistoryRpcPath] ? "ok" : "missing"}.`,
    );
  }

  const migrationHistoryResponse = await fetch(
    new URL(`rest/v1/rpc/${REQUIRED_MIGRATION_HISTORY_RPC}`, withTrailingSlash(url)),
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: "{}",
    },
  );
  if (!migrationHistoryResponse.ok) {
    throw new Error(
      `Supabase migration-history contract request failed (${migrationHistoryResponse.status}).`,
    );
  }

  const appliedMigrationRows = await migrationHistoryResponse.json();
  const appliedMigrations = Array.isArray(appliedMigrationRows)
    ? appliedMigrationRows
        .map((row) => row?.version)
        .filter((version) => typeof version === "string")
    : [];
  const repositoryMigrations = listRepositoryMigrationVersions();
  const missingHostedMigrations = repositoryMigrations.filter(
    (version) => !appliedMigrations.includes(version),
  );
  const unknownHostedMigrations = appliedMigrations.filter(
    (version) => !repositoryMigrations.includes(version),
  );
  if (
    appliedMigrations.length === 0 ||
    missingHostedMigrations.length > 0 ||
    unknownHostedMigrations.length > 0
  ) {
    throw new Error(
      `Hosted migration history is not at repository parity: missingHosted=${
        missingHostedMigrations.join(",") || "none"
      }, unknownHosted=${unknownHostedMigrations.join(",") || "none"}.`,
    );
  }

  return {
    access: "server",
    columns: REQUIRED_PROFILE_COLUMNS,
    rpc: REQUIRED_REVIEW_RPC,
    migrations: appliedMigrations.length,
  };
}

function listRepositoryMigrationVersions() {
  const versions = readdirSync(resolve("supabase/migrations"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{14}_.+\.sql$/.test(entry.name))
    .map((entry) => entry.name.slice(0, 14))
    .sort();
  if (versions.length === 0 || new Set(versions).size !== versions.length) {
    throw new Error("Repository migration history is empty or contains duplicate versions.");
  }
  return versions;
}

function parseMigrationList(stdout) {
  const jsonLine = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('{"migrations"'));
  if (!jsonLine) {
    throw new Error("Supabase CLI did not return machine-readable migration history.");
  }
  return JSON.parse(jsonLine);
}

async function safePostgrestCode(response) {
  try {
    const body = await response.json();
    return typeof body?.code === "string" ? body.code : "unknown";
  } catch {
    return "unknown";
  }
}

function optionalSupabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    return null;
  }

  try {
    return new URL(raw);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL.");
  }
}

function projectRefFromUrl(url) {
  return /^([a-z0-9]+)\.supabase\.co$/.exec(url.hostname)?.[1] ?? null;
}

function assertHostedUrl(url) {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    throw new Error("Hosted deployment parity cannot be proved against a loopback Supabase URL.");
  }
  if (!projectRefFromUrl(url)) {
    throw new Error("Hosted deployment parity requires a canonical Supabase project URL.");
  }
}

function withTrailingSlash(url) {
  return url.href.endsWith("/") ? url : new URL(`${url.href}/`);
}
