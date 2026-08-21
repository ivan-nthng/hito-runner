#!/usr/bin/env node
import { chmod, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SUPABASE_CLI_VERSION = "2.109.1";
const SUPABASE_PROJECT_ID = "hito-running";
const SUPABASE_NETWORK_NAME = `supabase_network_${SUPABASE_PROJECT_ID}`;
const SUPABASE_PROJECT_LABEL = "com.supabase.cli.project";
const COMPOSE_PROJECT_LABEL = "com.docker.compose.project";
const DOCKER_CONTEXT = "desktop-linux";
const DOCKER_ENGINE_VERSION = "29.6.2";
const DOCKER_DESKTOP_PLATFORM = "Docker Desktop 4.83.0 (234302)";
const TRUSTED_PRIVATE_FLAG = "--trusted-private-network";
const EXPECTED_CONTAINERS = new Set(
  [
    "analytics",
    "auth",
    "db",
    "edge_runtime",
    "inbucket",
    "kong",
    "pg_meta",
    "realtime",
    "rest",
    "storage",
    "studio",
    "vector",
  ].map((service) => `supabase_${service}_${SUPABASE_PROJECT_ID}`),
);
const EXPECTED_VOLUMES = new Set([
  `supabase_db_${SUPABASE_PROJECT_ID}`,
  `supabase_storage_${SUPABASE_PROJECT_ID}`,
]);
const EXPECTED_PUBLICATIONS = new Map([
  ["54321", `supabase_kong_${SUPABASE_PROJECT_ID}`],
  ["54322", `supabase_db_${SUPABASE_PROJECT_ID}`],
  ["54323", `supabase_studio_${SUPABASE_PROJECT_ID}`],
  ["54324", `supabase_inbucket_${SUPABASE_PROJECT_ID}`],
  ["54327", `supabase_analytics_${SUPABASE_PROJECT_ID}`],
]);
const EXPECTED_WILDCARD_HOST_IPS = new Set(["0.0.0.0", "::"]);
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const MANAGED_ENV_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "LOCAL_AUTH_BYPASS_ENABLED",
  "LOCAL_AUTH_BYPASS_ACCOUNTS_FILE",
  // Keep retired aliases here only so configure removes them from .env.local.
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]);
const rootDir = process.cwd();
const envPath = path.resolve(rootDir, ".env.local");
const mode = resolveMode(process.argv.slice(2));

validateDockerDesktopIdentity();

if (mode === "stop") {
  stopHitoStack();
  printSafeStatus({ mode, runtime: "stopped", envFile: null });
  process.exit(0);
}

const networkAdmission = validateTrustedPrivateNetwork(process.argv.slice(2));

if (mode === "start") {
  validateStoppedHitoState();

  try {
    const startResult = runPinnedSupabase(["start"], "local Supabase start");
    if (startResult.status !== 0) {
      throw new Error("Pinned local Supabase start failed.");
    }

    const exposure = validateRunningHitoExposure();
    const localStatus = readLocalSupabaseStatus();
    const apiUrl = requireStatusValue(localStatus, "API_URL");
    const target = parseLocalApiTarget(apiUrl);
    if (!target) {
      throw new Error("Local Supabase status returned an unexpected API origin.");
    }

    printSafeStatus({
      mode,
      runtime: "running",
      supabaseOrigin: target.origin,
      exposure,
      networkAdmission,
      envFile: null,
    });
  } catch (error) {
    try {
      stopHitoStack();
    } catch {
      throw new Error(
        "Local Hito admission failed and the project-qualified cleanup did not reach zero listeners.",
      );
    }
    throw error;
  }

  process.exit(0);
}

const exposure = validateRunningHitoExposure();
const localStatus = readLocalSupabaseStatus();
const apiUrl = requireStatusValue(localStatus, "API_URL");
const publishableKey = localStatus.PUBLISHABLE_KEY ?? requireStatusValue(localStatus, "ANON_KEY");
const secretKey = localStatus.SECRET_KEY ?? requireStatusValue(localStatus, "SERVICE_ROLE_KEY");
const target = parseLocalApiTarget(apiUrl);

if (!target) {
  throw new Error("Local Supabase status returned an unexpected API origin.");
}

if (mode === "configure") {
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

printSafeStatus({
  mode,
  runtime: "running",
  supabaseOrigin: target.origin,
  exposure,
  networkAdmission,
  envFile: mode === "configure" ? path.relative(rootDir, envPath) : null,
});

function resolveMode(arguments_) {
  const supportedFlags = new Set(["--check", "--start", "--stop", TRUSTED_PRIVATE_FLAG]);
  const unknownFlags = arguments_.filter((argument) => !supportedFlags.has(argument));
  if (unknownFlags.length > 0) {
    throw new Error("Unsupported local Supabase lifecycle argument.");
  }

  const modes = ["check", "start", "stop"].filter((candidate) =>
    arguments_.includes(`--${candidate}`),
  );
  if (modes.length > 1) {
    throw new Error("Select exactly one local Supabase lifecycle mode.");
  }

  return modes[0] ?? "configure";
}

function validateDockerDesktopIdentity() {
  if (process.env.DOCKER_HOST || process.env.DOCKER_CONTEXT) {
    throw new Error("Docker daemon overrides are forbidden for the Hito local lifecycle.");
  }

  const contextResult = runCommand("docker", ["context", "show"], "Docker context");
  if (contextResult.status !== 0 || contextResult.stdout.trim() !== DOCKER_CONTEXT) {
    throw new Error(`Docker context must be exactly ${DOCKER_CONTEXT}.`);
  }

  const versionResult = runCommand(
    "docker",
    ["version", "--format", "{{json .Server}}"],
    "Docker server identity",
  );
  if (versionResult.status !== 0) {
    throw new Error("Docker Desktop server identity is unavailable.");
  }

  const server = parseDockerJson(versionResult.stdout, "Docker server identity");
  if (
    server.Version !== DOCKER_ENGINE_VERSION ||
    server.Platform?.Name !== DOCKER_DESKTOP_PLATFORM
  ) {
    throw new Error("Docker Desktop server identity differs from the admitted environment.");
  }
}

function validateTrustedPrivateNetwork(arguments_) {
  if (!arguments_.includes(TRUSTED_PRIVATE_FLAG)) {
    throw new Error(
      `Local Hito Supabase requires the explicit ${TRUSTED_PRIVATE_FLAG} run admission.`,
    );
  }

  const routeResult = runCommand("route", ["-n", "get", "default"], "default network route");
  if (routeResult.status !== 0) {
    throw new Error("The active network route cannot be classified as private.");
  }

  const networkInterface = routeResult.stdout.match(/^\s*interface:\s*(\S+)\s*$/m)?.[1];
  const gateway = routeResult.stdout.match(/^\s*gateway:\s*(\S+)\s*$/m)?.[1];
  if (!networkInterface || !/^en\d+$/.test(networkInterface) || !isPrivateIpv4(gateway)) {
    throw new Error("The active default route is not an admitted private host network.");
  }

  const addressResult = runCommand(
    "ipconfig",
    ["getifaddr", networkInterface],
    "default network address",
  );
  if (addressResult.status !== 0 || !isPrivateIpv4(addressResult.stdout.trim())) {
    throw new Error("The active interface does not have an admitted private IPv4 address.");
  }

  return {
    classification: "explicit-trusted-private-run",
    routeClass: "private-ipv4",
  };
}

function isPrivateIpv4(value) {
  const parts = String(value ?? "")
    .split(".")
    .map((part) => Number.parseInt(part, 10));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function validateStoppedHitoState() {
  const containers = inspectHitoContainers();
  const networks = inspectHitoNetworks();
  if (containers.length !== 0 || networks.length !== 0) {
    throw new Error("Hito containers or networks already exist outside the admitted lifecycle.");
  }

  validateExpectedHitoVolumes();
  validateHostListeners(false);
}

function validateRunningHitoExposure() {
  const containers = inspectHitoContainers();
  const names = new Set(containers.map((container) => normalizedContainerName(container)));
  if (!setsEqual(names, EXPECTED_CONTAINERS)) {
    throw new Error("The Hito container inventory differs from the pinned project contract.");
  }

  const networks = inspectHitoNetworks();
  if (networks.length !== 1 || networks[0].Name !== SUPABASE_NETWORK_NAME) {
    throw new Error("The Hito Docker network inventory differs from the pinned project contract.");
  }

  const network = networks[0];
  const foreignAttachments = Object.values(network.Containers ?? {}).filter(
    (container) => !EXPECTED_CONTAINERS.has(container.Name),
  );
  if (
    network.Driver !== "bridge" ||
    network.Labels?.[SUPABASE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID ||
    network.Labels?.[COMPOSE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID ||
    foreignAttachments.length > 0
  ) {
    throw new Error("The Hito Docker network identity or attachment scope is unexpected.");
  }

  const publications = new Map();
  for (const container of containers) {
    const containerName = normalizedContainerName(container);
    const attachedNetworks = Object.keys(container.NetworkSettings?.Networks ?? {});
    if (
      container.Config?.Labels?.[SUPABASE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID ||
      container.Config?.Labels?.[COMPOSE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID ||
      container.State?.Running !== true ||
      attachedNetworks.length !== 1 ||
      attachedNetworks[0] !== SUPABASE_NETWORK_NAME
    ) {
      throw new Error(`Hito container ${containerName} is outside the admitted project boundary.`);
    }

    for (const bindings of Object.values(container.NetworkSettings?.Ports ?? {})) {
      for (const binding of bindings ?? []) {
        const hostPort = String(binding.HostPort ?? "");
        const publication = publications.get(hostPort) ?? {
          containerNames: new Set(),
          hostIps: new Set(),
        };
        publication.containerNames.add(containerName);
        publication.hostIps.add(String(binding.HostIp ?? ""));
        publications.set(hostPort, publication);
      }
    }
  }

  if (!setsEqual(new Set(publications.keys()), new Set(EXPECTED_PUBLICATIONS.keys()))) {
    throw new Error("The Hito published host-port inventory is unexpected.");
  }

  for (const [hostPort, expectedContainer] of EXPECTED_PUBLICATIONS) {
    const publication = publications.get(hostPort);
    if (
      !publication ||
      !setsEqual(publication.containerNames, new Set([expectedContainer])) ||
      !setsEqual(publication.hostIps, EXPECTED_WILDCARD_HOST_IPS)
    ) {
      throw new Error(`Hito service port ${hostPort} has an unexpected publication mapping.`);
    }
  }

  validateExpectedHitoVolumes();
  validateHostListeners(true);

  return {
    mode: "docker-desktop-wildcard",
    ipv4: "0.0.0.0",
    ipv6: "::",
    publishedPorts: {
      api: 54321,
      database: 54322,
      studio: 54323,
      mail: 54324,
      analytics: 54327,
    },
  };
}

function inspectHitoContainers() {
  const inventoryResult = runCommand(
    "docker",
    ["ps", "-a", "--format", "{{json .}}"],
    "Docker container inventory",
  );
  if (inventoryResult.status !== 0) {
    throw new Error("Docker container inventory is unavailable.");
  }

  const records = inventoryResult.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => parseDockerJson(line, "Docker container inventory"))
    .filter(
      (container) =>
        container.Names?.endsWith(`_${SUPABASE_PROJECT_ID}`) ||
        container.Labels?.includes(`${SUPABASE_PROJECT_LABEL}=${SUPABASE_PROJECT_ID}`),
    );
  if (records.length === 0) return [];

  const inspectionResult = runCommand(
    "docker",
    ["inspect", ...records.map((container) => container.ID)],
    "Hito Docker containers",
  );
  if (inspectionResult.status !== 0) {
    throw new Error("Hito Docker container inspection is unavailable.");
  }

  return parseDockerJson(inspectionResult.stdout, "Hito Docker containers");
}

function inspectHitoNetworks() {
  const inventoryResult = runCommand(
    "docker",
    ["network", "ls", "--format", "{{json .}}"],
    "Docker network inventory",
  );
  if (inventoryResult.status !== 0) {
    throw new Error("Docker network inventory is unavailable.");
  }

  const records = inventoryResult.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => parseDockerJson(line, "Docker network inventory"))
    .filter(
      (network) =>
        network.Name === SUPABASE_NETWORK_NAME ||
        network.Labels?.includes(`${SUPABASE_PROJECT_LABEL}=${SUPABASE_PROJECT_ID}`),
    );
  if (records.length === 0) return [];

  const inspectionResult = runCommand(
    "docker",
    ["network", "inspect", ...records.map((network) => network.ID)],
    "Hito Docker networks",
  );
  if (inspectionResult.status !== 0) {
    throw new Error("Hito Docker network inspection is unavailable.");
  }

  return parseDockerJson(inspectionResult.stdout, "Hito Docker networks");
}

function validateExpectedHitoVolumes() {
  const inventoryResult = runCommand(
    "docker",
    [
      "volume",
      "ls",
      "--format",
      "{{.Name}}",
      "--filter",
      `label=${SUPABASE_PROJECT_LABEL}=${SUPABASE_PROJECT_ID}`,
    ],
    "Hito Docker volume inventory",
  );
  if (inventoryResult.status !== 0) {
    throw new Error("Hito Docker volume inventory is unavailable.");
  }

  const names = new Set(inventoryResult.stdout.split(/\r?\n/).filter(Boolean));
  if (!setsEqual(names, EXPECTED_VOLUMES)) {
    throw new Error("The retained Hito volume inventory is unexpected.");
  }

  const inspectionResult = runCommand(
    "docker",
    ["volume", "inspect", ...names],
    "Hito Docker volumes",
  );
  if (inspectionResult.status !== 0) {
    throw new Error("Hito Docker volume inspection is unavailable.");
  }

  for (const volume of parseDockerJson(inspectionResult.stdout, "Hito Docker volumes")) {
    if (
      volume.Labels?.[SUPABASE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID ||
      volume.Labels?.[COMPOSE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID
    ) {
      throw new Error("A retained Hito volume has an unexpected project identity.");
    }
  }
}

function validateHostListeners(expectedRunning) {
  for (const port of EXPECTED_PUBLICATIONS.keys()) {
    const listenerResult = runCommand(
      "lsof",
      ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"],
      `host listener ${port}`,
    );
    const isListening = listenerResult.status === 0 && listenerResult.stdout.trim().length > 0;
    if (isListening !== expectedRunning) {
      throw new Error(
        expectedRunning
          ? `Expected Hito host listener ${port} is absent.`
          : `Unexpected host listener ${port} remains after Hito stop.`,
      );
    }
  }
}

function stopHitoStack() {
  const containersBefore = inspectHitoContainers();
  const networksBefore = inspectHitoNetworks();
  if (containersBefore.length === 0 && networksBefore.length === 0) {
    validateStoppedHitoState();
    return;
  }

  for (const container of containersBefore) {
    if (container.Config?.Labels?.[SUPABASE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID) {
      throw new Error("Refusing to stop a container without the exact Hito project label.");
    }
  }
  for (const network of networksBefore) {
    if (network.Labels?.[SUPABASE_PROJECT_LABEL] !== SUPABASE_PROJECT_ID) {
      throw new Error("Refusing to stop a network without the exact Hito project label.");
    }
  }

  const stopResult = runPinnedSupabase(
    ["stop", "--project-id", SUPABASE_PROJECT_ID],
    "project-qualified local Supabase stop",
  );
  if (stopResult.status !== 0) {
    throw new Error("Pinned project-qualified Hito stop failed.");
  }

  validateStoppedHitoState();
}

function readLocalSupabaseStatus() {
  const result = runPinnedSupabase(["status", "-o", "env"], "local Supabase status");
  if (result.status !== 0) {
    throw new Error("Local Supabase is unavailable through the admitted Docker Desktop lifecycle.");
  }

  return parseEnvOutput(result.stdout);
}

function runPinnedSupabase(arguments_, owner) {
  return runCommand(
    "npx",
    ["--offline", "--yes", `supabase@${SUPABASE_CLI_VERSION}`, ...arguments_],
    owner,
  );
}

function runCommand(command, arguments_, owner) {
  const result = spawnSync(command, arguments_, {
    cwd: rootDir,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) {
    throw new Error(`${owner} could not be executed.`);
  }
  return result;
}

function printSafeStatus({ mode, runtime, supabaseOrigin, exposure, networkAdmission, envFile }) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode,
        runtime,
        dockerContext: DOCKER_CONTEXT,
        supabaseProjectId: SUPABASE_PROJECT_ID,
        supabaseOrigin: supabaseOrigin ?? null,
        exposureMode: exposure?.mode ?? "stopped",
        wildcardIpv4: exposure?.ipv4 ?? null,
        wildcardIpv6: exposure?.ipv6 ?? null,
        publishedPorts: exposure?.publishedPorts ?? {},
        networkConstraint: "trusted-private-only",
        networkAdmission: networkAdmission?.classification ?? null,
        networkRouteClass: networkAdmission?.routeClass ?? null,
        disposableDataOnly: true,
        finalStoppedRequired: true,
        envFile,
        serviceCredentialPrinted: false,
      },
      null,
      2,
    ),
  );
}

function parseDockerJson(output, owner) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${owner} did not return valid JSON.`);
  }
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

function parseLocalApiTarget(value) {
  try {
    const parsed = new URL(value);
    return LOOPBACK_HOSTNAMES.has(parsed.hostname.toLowerCase()) ? { origin: parsed.origin } : null;
  } catch {
    return null;
  }
}

function normalizedContainerName(container) {
  return String(container.Name ?? "").replace(/^\//, "");
}

function setsEqual(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
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
    "# Managed by npm run supabase:local:configure. Docker Desktop wildcard development exposure; trusted/private network and disposable data only.",
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
