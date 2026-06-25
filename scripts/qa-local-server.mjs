#!/usr/bin/env node
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const host = "127.0.0.1";
const port = 3000;
const healthUrl = `http://${host}:${port}/`;
const logsDir = resolve(rootDir, "logs");
const statePath = resolve(logsDir, "qa-local-server-state.json");
const logPath = resolve(logsDir, "qa-local-server.log");
const finalizedOutputDir = resolve(rootDir, "logs/build-output-finalized");
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
const serveCommandLabel = "npm run serve:local";
const staleBuildGraceMs = 1000;

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
  await ensureBuildOutput();

  const currentBuild = readBuildFingerprint();
  if (!currentBuild) {
    throw new Error(
      "Build output is missing after build. Expected logs/build-output-finalized/server/index.mjs.",
    );
  }

  const status = await resolveServerStatus();
  if (status.healthy && status.serverStatus === "current") {
    persistState({
      launcherPid: status.state?.launcherPid ?? null,
      serverPid: status.serverPid,
      startedAt: status.state?.startedAt ?? new Date().toISOString(),
      adopted: status.state?.serverPid !== status.serverPid,
      command: serveCommandLabel,
      host,
      port,
      buildFingerprint: currentBuild,
    });
    console.log(`[qa-local-server] Reusing current built QA server on ${healthUrl}`);
    printStatus(await resolveServerStatus());
    return;
  }

  if (status.serverPid && status.serverStatus === "stale" && status.compatibleServer) {
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

  const launcher = spawn("npm", ["run", "serve:local"], {
    cwd: rootDir,
    detached: true,
    stdio: ["ignore", openSync(logPath, "a"), openSync(logPath, "a")],
    env: process.env,
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
  if (hasCompleteBuildOutput()) {
    return;
  }

  console.log("[qa-local-server] Build output is missing; running npm run build.");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`npm run build failed with exit code ${result.status ?? "unknown"}.`);
  }
}

async function resolveServerStatus() {
  const state = readState();
  const pids = listeningPids();
  const serverPid = resolveServerPid(pids, state);
  const commandLine = serverPid ? processCommand(serverPid) : null;
  const compatibleServer = serverPid ? isCompatibleServerCommand(commandLine) : false;
  const healthy = serverPid ? await isHealthy() : false;
  const buildFingerprint = readBuildFingerprint();
  const buildStatus = buildFingerprint ? "present" : "missing";
  const processStartMs = serverPid ? processStartedAtMs(serverPid) : null;
  const processIsOlderThanBuild =
    Boolean(processStartMs && buildFingerprint) &&
    processStartMs < buildFingerprint.indexMtimeMs - staleBuildGraceMs;
  const stateMatchesBuild =
    Boolean(state?.buildFingerprint && buildFingerprint) &&
    stableJson(state?.buildFingerprint) === stableJson(buildFingerprint);
  const serverStatus = !serverPid
    ? "stopped"
    : !compatibleServer
      ? "unmanaged"
      : !healthy
        ? "unhealthy"
        : !buildFingerprint
          ? "stale"
          : stateMatchesBuild || !processIsOlderThanBuild
            ? "current"
            : "stale";

  return {
    state,
    pids,
    serverPid,
    commandLine,
    compatibleServer,
    healthy,
    buildStatus,
    buildFingerprint,
    processStartMs,
    serverStatus,
  };
}

function resolveServerPid(pids, state) {
  if (state?.serverPid && pids.includes(state.serverPid)) {
    return state.serverPid;
  }

  return pids.find((pid) => isCompatibleServerCommand(processCommand(pid))) ?? pids[0] ?? null;
}

async function waitForHealthyServer() {
  const startedAt = Date.now();
  const timeoutMs = 30_000;

  while (Date.now() - startedAt < timeoutMs) {
    const pids = listeningPids();
    const serverPid = pids.find((pid) => isCompatibleServerCommand(processCommand(pid))) ?? null;

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
    (commandLine.includes("logs/build-output-finalized/server/index.mjs") ||
      commandLine.includes(".output/server/index.mjs")) &&
    commandLine.includes("--port 3000"),
  );
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

function printStatus(status) {
  const lines = [
    `[qa-local-server] ${status.serverStatus}`,
    `url: ${healthUrl}`,
    `pid: ${status.serverPid ?? "none"}`,
    `managed: ${Boolean(status.state?.serverPid && status.state.serverPid === status.serverPid)}`,
    `compatible: ${status.compatibleServer}`,
    `healthy: ${status.healthy}`,
    `build: ${status.buildStatus}`,
    `log: ${logPath}`,
  ];

  if (status.commandLine) {
    lines.push(`command: ${status.commandLine}`);
  }

  console.log(lines.join("\n"));
}

function printHelp() {
  console.log(`Usage: node ./scripts/qa-local-server.mjs <status|start|restart|stop>

Commands:
  status   Show whether the canonical built QA server is running on ${healthUrl}
  start    Reuse the current built server, or start npm run serve:local in the background
  restart  Stop the canonical built server and start it again
  stop     Stop only the managed/compatible built QA server

Local state:
  ${statePath}
  ${logPath}`);
}

function stableJson(value) {
  return JSON.stringify(value);
}

function delay(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
