#!/usr/bin/env node
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { readActiveBuildOutputLock } from "./lib/build-output-lock.mjs";
import { resolveQaRuntimePaths } from "./lib/qa-runtime-paths.mjs";
import { validateLocalBuildOutput } from "./validate-build-output-integrity.mjs";

const rootDir = process.cwd();
const qaRuntimePaths = resolveQaRuntimePaths({ rootDir });
const host = "127.0.0.1";
const port = 3000;
const healthUrl = `http://${host}:${port}/`;
const logsDir = qaRuntimePaths.stateDir;
const statePath = qaRuntimePaths.statePath;
const logPath = qaRuntimePaths.logPath;
const finalizedOutputDir = qaRuntimePaths.runtimeRoot;
const finalizedServerDir = resolve(finalizedOutputDir, "server");
const finalizedPublicDir = resolve(finalizedOutputDir, "public");
const serverEntry = resolve(finalizedServerDir, "index.mjs");
const nitroManifest = resolve(finalizedOutputDir, "nitro.json");
const publicDir = finalizedPublicDir;
const requiredBuildArtifacts = [
  serverEntry,
  nitroManifest,
  resolve(publicDir, "favicon.svg"),
  resolve(publicDir, "templates/hito-training-plan-v2-template.json"),
];
const recoverableGeneratedConflictRoots = [
  resolve(rootDir, ".output"),
  resolve(rootDir, "node_modules/.nitro"),
  resolve(rootDir, "logs/build-output-finalized"),
  qaRuntimePaths.buildOutputRoot,
  qaRuntimePaths.nitroBuildDir,
  qaRuntimePaths.nitroOutputDir,
  qaRuntimePaths.viteCacheDir,
  qaRuntimePaths.runtimeRoot,
  qaRuntimePaths.finalizeBackupDir,
  qaRuntimePaths.finalizedPreviousDir,
  qaRuntimePaths.finalizedStagingDir,
  qaRuntimePaths.publicSnapshotDir,
];
const serveCommandLabel = "npm run serve:local";
const staleBuildGraceMs = 1000;
const transportLogMaxBytes = 5 * 1024 * 1024;
const transportLogArchiveDir = resolve(logsDir, "transport-log-archive");
const structuredEventsRoot = resolve(rootDir, "logs/local-runtime-observability");
const providerMode = resolveProviderMode(process.argv.slice(3));

const command = process.argv[2] ?? "status";

try {
  switch (command) {
    case "status":
      await statusCommand();
      break;
    case "start":
      await startCommand();
      break;
    case "restart":
      await restartCommand();
      break;
    case "stop":
      await stopCommand();
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      throw new Error(`Unknown qa-local-server command: ${command}`);
  }
} catch (error) {
  console.error(`[qa-local-server] ${formatError(error)}`);
  process.exitCode = 1;
}

async function statusCommand() {
  const status = await resolveServerStatus();

  printStatus(status);

  if (status.serverStatus !== "current") {
    process.exitCode = 1;
  }
}

async function startCommand() {
  ensureLogsDir();
  ensureBuildOutputLifecycleIsIdle();
  await ensureBuildOutput();
  ensureBuildOutputLifecycleIsIdle();

  const currentBuild = readBuildFingerprint();
  if (!currentBuild) {
    throw new Error(`Build output is missing after build. Expected ${serverEntry}.`);
  }

  const status = await resolveServerStatus();
  if (
    status.healthy &&
    status.serverStatus === "current" &&
    status.state?.providerMode === providerMode
  ) {
    persistState({
      launcherPid: status.state?.launcherPid ?? null,
      serverPid: status.serverPid,
      startedAt: status.state?.startedAt ?? new Date().toISOString(),
      adopted: status.state?.serverPid !== status.serverPid,
      command: serveCommandLabel,
      host,
      port,
      buildFingerprint: currentBuild,
      runtimeRoot: finalizedOutputDir,
      providerMode,
    });
    console.log(`[qa-local-server] Reusing current built QA server on ${healthUrl}`);
    printStatus(await resolveServerStatus());
    return;
  }

  if (status.serverPid && status.compatibleServer && status.state?.providerMode !== providerMode) {
    console.log(
      `[qa-local-server] Restarting ${status.state?.providerMode ?? "unknown"} provider runtime as ${providerMode}.`,
    );
    await stopServerPid({
      launcherPid: status.state?.launcherPid ?? null,
      serverPid: status.serverPid,
      removeState: true,
    });
  } else if (
    status.serverPid &&
    ["stale", "unsafe_bind"].includes(status.serverStatus) &&
    status.compatibleServer
  ) {
    console.log(
      `[qa-local-server] Restarting stale built QA server on ${healthUrl} (pid ${status.serverPid}).`,
    );
    await stopServerPid({
      launcherPid: status.state?.launcherPid ?? null,
      serverPid: status.serverPid,
      removeState: true,
    });
  } else if (status.serverPid) {
    throw new Error(
      `Port ${port} is already used by an unmanaged process (pid ${status.serverPid}). Stop it before starting the canonical QA server.`,
    );
  }

  rotateTransportLogIfOversized();
  const launcher = spawn("npm", ["run", "serve:local"], {
    cwd: rootDir,
    detached: true,
    stdio: ["ignore", openSync(logPath, "a"), openSync(logPath, "a")],
    env: {
      ...process.env,
      HOST: host,
      NITRO_HOST: host,
      PORT: String(port),
      NITRO_PORT: String(port),
      HITO_AI_GENERATED_PLAN_PROVIDER_MODE: providerMode,
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE: providerMode === "qa_fixture" ? "true" : "false",
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE_DELAY_MS:
        providerMode === "qa_fixture"
          ? (process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE_DELAY_MS ?? "")
          : "",
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE_SCENARIO:
        providerMode === "qa_fixture"
          ? (process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE_SCENARIO ?? "")
          : "",
    },
  });

  launcher.unref();

  const serverPid = await waitForHealthyServer();
  persistState({
    launcherPid: launcher.pid ?? null,
    serverPid,
    startedAt: new Date().toISOString(),
    adopted: false,
    command: serveCommandLabel,
    host,
    port,
    buildFingerprint: currentBuild,
    runtimeRoot: finalizedOutputDir,
    providerMode,
  });

  console.log(`[qa-local-server] Started canonical built QA server on ${healthUrl}`);
  printStatus(await resolveServerStatus());
}

async function restartCommand() {
  await stopCommand({ quietWhenStopped: true });
  await startCommand();
}

async function stopCommand(options = {}) {
  const status = await resolveServerStatus();

  if (!status.serverPid) {
    removeState();
    if (!options.quietWhenStopped) {
      console.log("[qa-local-server] No process is listening on port 3000.");
    }
    return;
  }

  if (!status.compatibleServer) {
    throw new Error(
      `Refusing to stop unmanaged process on port ${port} (pid ${status.serverPid}).`,
    );
  }

  await stopServerPid({
    launcherPid: status.state?.launcherPid ?? null,
    serverPid: status.serverPid,
    removeState: true,
  });

  if (!options.quietWhenStopped) {
    console.log(`[qa-local-server] Stopped canonical QA server on ${healthUrl}`);
  }
}

async function ensureBuildOutput() {
  if (hasUsableBuildOutput()) {
    return;
  }

  console.log("[qa-local-server] Build output is missing or broken; running npm run build.");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`npm run build failed with exit code ${result.status ?? "unknown"}.`);
  }

  const integrity = readBuildIntegrity();
  if (integrity.status !== "present") {
    throw new Error(
      `Build output is not usable after npm run build: ${integrity.error ?? integrity.status}.`,
    );
  }
}

async function resolveServerStatus() {
  const state = readState();
  const pids = listeningPids();
  const serverPid = resolveServerPid(pids, state);
  const commandLine = serverPid ? processCommand(serverPid) : null;
  const loopbackListener = serverPid ? hasOnlyLoopbackListeners(serverPid) : false;
  const currentRuntimeCommand = serverPid ? isCompatibleServerCommand(commandLine) : false;
  const legacyRuntimeServer = serverPid ? isLegacyWorkspaceRuntimeCommand(commandLine) : false;
  const compatibleServer = currentRuntimeCommand || legacyRuntimeServer;
  const currentRuntimeServer = currentRuntimeCommand && loopbackListener;
  const healthy = serverPid ? await isHealthy() : false;
  const buildIntegrity = readBuildIntegrity();
  const buildFingerprint = buildIntegrity.status === "present" ? readBuildFingerprint() : null;
  const buildStatus = buildIntegrity.status;
  const processStartMs = serverPid ? processStartedAtMs(serverPid) : null;
  const processIsOlderThanBuild =
    Boolean(processStartMs && buildFingerprint) &&
    processStartMs < buildFingerprint.indexMtimeMs - staleBuildGraceMs;
  const serverStatus = !serverPid
    ? "stopped"
    : !compatibleServer
      ? "unmanaged"
      : !loopbackListener
        ? "unsafe_bind"
        : !currentRuntimeServer
          ? "stale"
          : !healthy
            ? "unhealthy"
            : buildStatus !== "present" || !buildFingerprint
              ? "stale"
              : processIsOlderThanBuild
                ? "stale"
                : "current";

  return {
    state,
    pids,
    serverPid,
    commandLine,
    loopbackListener,
    currentRuntimeServer,
    legacyRuntimeServer,
    compatibleServer,
    healthy,
    buildStatus,
    buildIntegrity,
    buildFingerprint,
    processStartMs,
    serverStatus,
  };
}

function resolveServerPid(pids, state) {
  if (state?.serverPid && pids.includes(state.serverPid)) {
    return state.serverPid;
  }

  return pids.find((pid) => isManagedServerCommand(processCommand(pid))) ?? pids[0] ?? null;
}

async function waitForHealthyServer() {
  const startedAt = Date.now();
  const timeoutMs = 30_000;

  while (Date.now() - startedAt < timeoutMs) {
    const pids = listeningPids();
    const serverPid =
      pids.find(
        (pid) => isCompatibleServerCommand(processCommand(pid)) && hasOnlyLoopbackListeners(pid),
      ) ?? null;

    if (serverPid && (await isHealthy())) {
      return serverPid;
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${healthUrl}. See ${logPath}.`);
}

async function stopServerPid({ launcherPid, serverPid, removeState: shouldRemoveState }) {
  if (launcherPid && isPidAlive(launcherPid)) {
    terminatePidGroup(launcherPid);
  }

  if (serverPid && isPidAlive(serverPid)) {
    terminatePid(serverPid);
  }

  await waitForStopped(serverPid);

  if (launcherPid && isPidAlive(launcherPid)) {
    terminatePid(launcherPid, "SIGKILL");
  }

  if (serverPid && isPidAlive(serverPid)) {
    terminatePid(serverPid, "SIGKILL");
  }

  if (shouldRemoveState) {
    removeState();
  }
}

async function waitForStopped(pid) {
  const startedAt = Date.now();

  while (pid && isPidAlive(pid) && Date.now() - startedAt < 5000) {
    await delay(250);
  }
}

async function isHealthy() {
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(3000),
      headers: { "user-agent": "hito-qa-local-server-runner" },
    });

    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

function listeningPids() {
  try {
    const output = execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
      encoding: "utf8",
    }).trim();

    return output
      ? output
          .split(/\s+/)
          .map((entry) => Number(entry))
          .filter((pid) => Number.isInteger(pid) && pid > 0)
      : [];
  } catch {
    return [];
  }
}

function hasOnlyLoopbackListeners(pid) {
  try {
    const output = execFileSync(
      "lsof",
      ["-nP", "-a", "-p", String(pid), `-iTCP:${port}`, "-sTCP:LISTEN", "-Fn"],
      { encoding: "utf8" },
    );
    const addresses = output
      .split(/\r?\n/)
      .filter((line) => line.startsWith("n"))
      .map((line) => line.slice(1));

    return addresses.length > 0 && addresses.every(isLoopbackListenAddress);
  } catch {
    return false;
  }
}

function isLoopbackListenAddress(address) {
  return (
    address.startsWith("127.0.0.1:") ||
    address.startsWith("localhost:") ||
    address.startsWith("[::1]:") ||
    address.startsWith("::1:")
  );
}

function processCommand(pid) {
  try {
    return execFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function processStartedAtMs(pid) {
  try {
    const output = execFileSync("ps", ["-p", String(pid), "-o", "lstart="], {
      encoding: "utf8",
    }).trim();
    const parsed = Date.parse(output);

    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

function isCompatibleServerCommand(commandLine) {
  return Boolean(
    commandLine &&
    (commandLine.includes("scripts/serve-local-qa-runtime.mjs") ||
      commandLine.includes(serverEntry)) &&
    commandLine.includes("--port 3000"),
  );
}

function isLegacyWorkspaceRuntimeCommand(commandLine) {
  return Boolean(
    commandLine &&
    (commandLine.includes("logs/build-output-finalized/server/index.mjs") ||
      commandLine.includes(".output/server/index.mjs")) &&
    commandLine.includes("--port 3000"),
  );
}

function isManagedServerCommand(commandLine) {
  return isCompatibleServerCommand(commandLine) || isLegacyWorkspaceRuntimeCommand(commandLine);
}

function readBuildFingerprint() {
  if (!hasCompleteBuildOutput()) {
    return null;
  }

  const indexStat = statSync(serverEntry);
  const publicStat = statSync(publicDir);
  const nitroStat = existsSync(nitroManifest) ? statSync(nitroManifest) : null;

  return {
    indexMtimeMs: Math.round(indexStat.mtimeMs),
    indexSize: indexStat.size,
    nitroMtimeMs: nitroStat ? Math.round(nitroStat.mtimeMs) : null,
    nitroSize: nitroStat ? nitroStat.size : null,
    publicMtimeMs: Math.round(publicStat.mtimeMs),
  };
}

function hasCompleteBuildOutput() {
  return requiredBuildArtifacts.every((artifactPath) => existsSync(artifactPath));
}

function hasUsableBuildOutput() {
  return readBuildIntegrity().status === "present";
}

function readBuildIntegrity() {
  const activeBuildLock = readActiveBuildOutputLock({ rootDir });

  if (activeBuildLock) {
    return {
      status: "locked",
      summary: null,
      error: `Build output lifecycle is already running (owner pid ${activeBuildLock.ownerPid}, acquired at ${activeBuildLock.acquiredAt}).`,
    };
  }

  if (!hasCompleteBuildOutput()) {
    return {
      status: "missing",
      summary: null,
      error: null,
    };
  }

  try {
    cleanupRecoverableGeneratedSiblingConflicts();

    return {
      status: "present",
      summary: validateLocalBuildOutput({ rootDir }),
      error: null,
    };
  } catch (error) {
    return {
      status: "broken",
      summary: null,
      error: formatError(error),
    };
  }
}

function cleanupRecoverableGeneratedSiblingConflicts() {
  for (const generatedRoot of recoverableGeneratedConflictRoots) {
    cleanupGeneratedSiblingConflictsRecursively(generatedRoot);
  }
}

function cleanupGeneratedSiblingConflictsRecursively(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const entry of readdirSync(path)) {
    const entryPath = resolve(path, entry);

    if (isGeneratedSiblingConflictName(entry)) {
      rmSync(entryPath, {
        recursive: true,
        force: true,
        maxRetries: 8,
        retryDelay: 125,
      });
      continue;
    }

    const stats = lstatSync(entryPath);
    if (stats.isDirectory() && !stats.isSymbolicLink()) {
      cleanupGeneratedSiblingConflictsRecursively(entryPath);
    }
  }
}

function isGeneratedSiblingConflictName(entryName) {
  return / \d+(?:\.[^/.]+)?$/.test(entryName);
}

function ensureBuildOutputLifecycleIsIdle() {
  const activeBuildLock = readActiveBuildOutputLock({ rootDir });

  if (activeBuildLock) {
    throw new Error(
      `Build output lifecycle is already running (owner pid ${activeBuildLock.ownerPid}, acquired at ${activeBuildLock.acquiredAt}). Wait for it to finish before starting the QA server.`,
    );
  }
}

function readState() {
  try {
    if (!existsSync(statePath)) {
      return null;
    }

    const parsed = JSON.parse(readFileSync(statePath, "utf8"));

    return {
      launcherPid: typeof parsed.launcherPid === "number" ? parsed.launcherPid : null,
      serverPid: typeof parsed.serverPid === "number" ? parsed.serverPid : null,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : null,
      adopted: Boolean(parsed.adopted),
      command: typeof parsed.command === "string" ? parsed.command : null,
      host: typeof parsed.host === "string" ? parsed.host : null,
      port: typeof parsed.port === "number" ? parsed.port : null,
      buildFingerprint:
        parsed.buildFingerprint && typeof parsed.buildFingerprint === "object"
          ? parsed.buildFingerprint
          : null,
      runtimeRoot: typeof parsed.runtimeRoot === "string" ? parsed.runtimeRoot : null,
      providerMode:
        parsed.providerMode === "qa_fixture" || parsed.providerMode === "real"
          ? parsed.providerMode
          : null,
    };
  } catch {
    return null;
  }
}

function persistState(state) {
  ensureLogsDir();
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function removeState() {
  rmSync(statePath, { force: true });
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function terminatePidGroup(pid) {
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    terminatePid(pid);
  }
}

function terminatePid(pid, signal = "SIGTERM") {
  try {
    process.kill(pid, signal);
  } catch {
    // The process may already have exited; stop remains idempotent.
  }
}

function ensureLogsDir() {
  mkdirSync(logsDir, { recursive: true });
  const fd = openSync(logPath, "a");
  closeSync(fd);
}

function rotateTransportLogIfOversized() {
  if (!existsSync(logPath) || statSync(logPath).size < transportLogMaxBytes) {
    return;
  }

  mkdirSync(transportLogArchiveDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  renameSync(logPath, resolve(transportLogArchiveDir, `qa-local-server-${timestamp}.log`));
}

function printStatus(status) {
  const lines = [
    `[qa-local-server] ${status.serverStatus}`,
    `url: ${healthUrl}`,
    `pid: ${status.serverPid ?? "none"}`,
    `managed: ${Boolean(status.state?.serverPid && status.state.serverPid === status.serverPid)}`,
    `compatible: ${status.compatibleServer}`,
    `loopbackBind: ${status.loopbackListener}`,
    `healthy: ${status.healthy}`,
    `build: ${status.buildStatus}`,
    `runtime: ${finalizedOutputDir}`,
    `log: ${logPath}`,
    `events: ${structuredEventsRoot}`,
    `providerMode: ${status.state?.providerMode ?? "unknown"}`,
    "query: npm run local:logs -- --limit 50",
  ];

  if (status.buildIntegrity?.error) {
    lines.push(`buildError: ${status.buildIntegrity.error}`);
  }

  if (status.commandLine) {
    lines.push(`command: ${status.commandLine}`);
  }

  console.log(lines.join("\n"));
}

function printHelp() {
  console.log(`Usage: node ./scripts/qa-local-server.mjs <status|start|restart|stop> [--provider-mode <real|qa_fixture>]

Commands:
  status   Show whether the canonical built QA server is running on ${healthUrl}
  start    Reuse or start the built server (provider mode defaults to real)
  restart  Stop and start the built server in the requested provider mode
  stop     Stop only the managed/compatible built QA server

Local state:
  runtime: ${finalizedOutputDir}
  ${statePath}
  ${logPath}`);
}

function delay(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function resolveProviderMode(args) {
  const index = args.indexOf("--provider-mode");
  const value = index >= 0 ? args[index + 1] : "real";

  if (value !== "real" && value !== "qa_fixture") {
    throw new Error("--provider-mode must be real or qa_fixture.");
  }

  return value;
}
