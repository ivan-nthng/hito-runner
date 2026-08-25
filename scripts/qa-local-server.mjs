#!/usr/bin/env node
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  cpSync,
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
import { homedir } from "node:os";
import { resolve } from "node:path";
import { isPidAlive, readActiveBuildOutputLock } from "./lib/build-output-lock.mjs";
import {
  evaluateQaBuildFreshness,
  fingerprintQaBuildArtifact,
  fingerprintQaExecutableInputs,
  writeQaBuildFreshnessReceipt,
} from "./lib/qa-build-freshness.mjs";
import {
  QA_MANAGED_RUNTIME_SLOTS,
  qaRuntimeRootEnvName,
  resolveQaManagedSlotPaths,
  resolveQaRuntimePaths,
} from "./lib/qa-runtime-paths.mjs";
import { validateLocalBuildOutput } from "./validate-build-output-integrity.mjs";

const rootDir = process.cwd();
const qaRuntimePaths = resolveQaRuntimePaths({ rootDir });
const slot = resolveManagedSlot(process.argv.slice(3));
const slotPaths = resolveQaManagedSlotPaths({ rootDir, slot });
const host = slotPaths.host;
const port = slotPaths.port;
const healthUrl = `http://${host}:${port}/`;
const logsDir = slotPaths.stateDir;
const statePath = slotPaths.statePath;
const logPath = slotPaths.logPath;
const freshnessPath = slotPaths.freshnessPath;
const finalizedOutputDir = slotPaths.runtimeRoot;
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
const canonicalOutputDir = qaRuntimePaths.runtimeRoot;
const canonicalFreshnessPath = qaRuntimePaths.freshnessPath;
const canonicalRequiredBuildArtifacts = [
  qaRuntimePaths.serverEntry,
  qaRuntimePaths.nitroManifest,
  resolve(qaRuntimePaths.publicDir, "favicon.svg"),
  resolve(qaRuntimePaths.publicDir, "templates/hito-training-plan-v2-template.json"),
];
const recoverableGeneratedConflictRoots = [
  resolve(rootDir, ".output"),
  resolve(rootDir, "node_modules/.nitro"),
  resolve(rootDir, "logs/build-output-finalized"),
  qaRuntimePaths.buildOutputRoot,
  qaRuntimePaths.runtimeRoot,
  qaRuntimePaths.finalizeBackupDir,
  qaRuntimePaths.finalizedPreviousDir,
  qaRuntimePaths.finalizedStagingDir,
  qaRuntimePaths.publicSnapshotDir,
];
const serveCommandLabel = `node scripts/serve-local-qa-runtime.mjs --host ${host} --port ${port}`;
const staleBuildGraceMs = 1000;
const transportLogMaxBytes = 5 * 1024 * 1024;
const transportLogArchiveDir = resolve(logsDir, "transport-log-archive");
const structuredEventsRoot = resolve(
  homedir(),
  "Library/Caches/hito-running/local-runtime-observability",
);
const command = process.argv[2] ?? "status";
const providerMode = resolveProviderMode(process.argv.slice(3));
const fixtureProfile = resolveFixtureProfile(process.argv.slice(3), providerMode, slot, command);
const jsonOutput = process.argv.slice(3).includes("--json");

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

  if (jsonOutput) {
    console.log(JSON.stringify(publicStatus(status), null, 2));
  } else {
    printStatus(status);
  }

  if (status.serverStatus !== "current") {
    process.exitCode = 1;
  }
}

async function startCommand() {
  const lifecycleStartedAt = performance.now();
  ensureLogsDir();
  ensureBuildOutputLifecycleIsIdle();
  const buildResult = await ensureBuildOutput();
  ensureBuildOutputLifecycleIsIdle();

  const statusStartedAt = performance.now();
  const status = await resolveServerStatus();
  const initialStatusMs = elapsedMs(statusStartedAt);
  if (
    status.healthy &&
    status.serverStatus === "current" &&
    status.state?.providerMode === providerMode &&
    status.state?.fixtureProfile === fixtureProfile
  ) {
    const currentBuild = readBuildFingerprint();
    if (!currentBuild) {
      throw new Error(`Managed slot artifact is missing. Expected ${serverEntry}.`);
    }
    persistState({
      slot,
      launcherPid: status.state?.launcherPid ?? null,
      serverPid: status.serverPid,
      startedAt: status.state?.startedAt ?? new Date().toISOString(),
      adopted: status.state?.serverPid !== status.serverPid,
      command: serveCommandLabel,
      host,
      port,
      buildFingerprint: currentBuild,
      artifactFingerprint: readBuildArtifactFingerprint(),
      sourceFingerprint: status.buildFreshness.sourceFingerprint,
      runtimeRoot: finalizedOutputDir,
      providerMode,
      fixtureProfile,
      artifactDecision: buildResult.artifactDecision,
      lifecyclePhaseTimingsMs: withTotalTiming(
        {
          ...buildResult.phaseTimingsMs,
          status: initialStatusMs,
          serverStart: 0,
        },
        lifecycleStartedAt,
      ),
    });
    console.log(
      `[qa-local-server] Reusing current built QA server on ${healthUrl} (artifact ${buildResult.artifactDecision}).`,
    );
    printStatus(await resolveServerStatus());
    return;
  }

  if (
    status.serverPid &&
    status.compatibleServer &&
    (status.state?.providerMode !== providerMode || status.state?.fixtureProfile !== fixtureProfile)
  ) {
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

  publishManagedSlotArtifact();
  const currentBuild = readBuildFingerprint();
  if (!currentBuild) {
    throw new Error(`Managed slot artifact is missing after publish. Expected ${serverEntry}.`);
  }

  rotateTransportLogIfOversized();
  const serverStartStartedAt = performance.now();
  const launcher = spawn(
    process.execPath,
    [
      "--env-file=.env.local",
      "scripts/serve-local-qa-runtime.mjs",
      "--host",
      host,
      "--port",
      String(port),
    ],
    {
      cwd: rootDir,
      detached: true,
      stdio: ["ignore", openSync(logPath, "a"), openSync(logPath, "a")],
      env: {
        ...process.env,
        HOST: host,
        NITRO_HOST: host,
        PORT: String(port),
        NITRO_PORT: String(port),
        [qaRuntimeRootEnvName]: finalizedOutputDir,
        HITO_AI_GENERATED_PLAN_PROVIDER_MODE: providerMode,
        HITO_QA_FIXTURE_PROFILE: fixtureProfile ?? "",
        HITO_LOCAL_RUNTIME_OBSERVABILITY_ROOT: structuredEventsRoot,
        HITO_AI_GENERATED_PLAN_DEV_FIXTURE: providerMode === "qa_fixture" ? "true" : "false",
        HITO_AI_GENERATED_PLAN_DEV_FIXTURE_DELAY_MS:
          providerMode === "qa_fixture"
            ? (process.env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE_DELAY_MS ?? "")
            : "",
        HITO_AI_GENERATED_PLAN_DEV_FIXTURE_SCENARIO: "",
        ...(fixtureProfile === "camelot"
          ? { HITO_AI_GENERATED_PLAN_DEV_FIXTURE_SCENARIO: "camelot" }
          : {}),
      },
    },
  );

  launcher.unref();

  const serverPid = await waitForHealthyServer();
  persistState({
    slot,
    launcherPid: launcher.pid ?? null,
    serverPid,
    startedAt: new Date().toISOString(),
    adopted: false,
    command: serveCommandLabel,
    host,
    port,
    buildFingerprint: currentBuild,
    artifactFingerprint: readBuildArtifactFingerprint(),
    sourceFingerprint: fingerprintQaExecutableInputs({ rootDir }),
    runtimeRoot: finalizedOutputDir,
    providerMode,
    fixtureProfile,
    artifactDecision: buildResult.artifactDecision,
    lifecyclePhaseTimingsMs: withTotalTiming(
      {
        ...buildResult.phaseTimingsMs,
        status: initialStatusMs,
        serverStart: elapsedMs(serverStartStartedAt),
      },
      lifecycleStartedAt,
    ),
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
      console.log(`[qa-local-server] No process is listening in ${slot} slot on port ${port}.`);
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
    console.log(`[qa-local-server] Stopped ${slot} managed QA server on ${healthUrl}`);
  }
}

function publishManagedSlotArtifact() {
  const canonicalFingerprint = readCanonicalBuildArtifactFingerprint();
  if (!canonicalFingerprint || !hasCompleteCanonicalBuildOutput()) {
    throw new Error("Canonical QA build artifact is unavailable for managed slot publication.");
  }

  rmSync(slotPaths.stagingRuntimeRoot, { recursive: true, force: true });
  rmSync(slotPaths.previousRuntimeRoot, { recursive: true, force: true });
  mkdirSync(slotPaths.slotRoot, { recursive: true });
  cpSync(canonicalOutputDir, slotPaths.stagingRuntimeRoot, { recursive: true });

  const stagedFingerprint = fingerprintQaBuildArtifact({
    freshnessPath: resolve(slotPaths.stagingRuntimeRoot, ".hito-build-freshness.json"),
    runtimeRoot: slotPaths.stagingRuntimeRoot,
  });
  if (!stagedFingerprint || stagedFingerprint.digest !== canonicalFingerprint.digest) {
    rmSync(slotPaths.stagingRuntimeRoot, { recursive: true, force: true });
    throw new Error(
      `Managed ${slot} runtime snapshot does not match the canonical build artifact.`,
    );
  }

  if (existsSync(finalizedOutputDir)) {
    renameSync(finalizedOutputDir, slotPaths.previousRuntimeRoot);
  }
  renameSync(slotPaths.stagingRuntimeRoot, finalizedOutputDir);
  rmSync(slotPaths.previousRuntimeRoot, { recursive: true, force: true });
}

async function ensureBuildOutput() {
  const phaseTimingsMs = {};
  const integrityStartedAt = performance.now();
  const integrity = readCanonicalBuildIntegrity();
  phaseTimingsMs.integrity = elapsedMs(integrityStartedAt);

  const artifactStartedAt = performance.now();
  const artifactFingerprint =
    integrity.status === "present" ? readCanonicalBuildArtifactFingerprint() : null;
  phaseTimingsMs.artifactFingerprint = elapsedMs(artifactStartedAt);

  const freshnessStartedAt = performance.now();
  const freshness = evaluateQaBuildFreshness({
    artifactFingerprint,
    freshnessPath: canonicalFreshnessPath,
    rootDir,
  });
  phaseTimingsMs.freshness = elapsedMs(freshnessStartedAt);

  if (integrity.status === "present" && freshness.status === "fresh") {
    return {
      artifactDecision: "reused",
      phaseTimingsMs: {
        ...phaseTimingsMs,
        build: 0,
      },
    };
  }

  console.log(
    `[qa-local-server] Build artifact is ${integrity.status}/${freshness.reason}; running npm run build.`,
  );
  const sourceBeforeBuild = freshness.sourceFingerprint;
  const buildStartedAt = performance.now();
  const result = spawnSync("npm", ["run", "build"], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`npm run build failed with exit code ${result.status ?? "unknown"}.`);
  }
  phaseTimingsMs.build = elapsedMs(buildStartedAt);

  const postBuildIntegrityStartedAt = performance.now();
  const postBuildIntegrity = readCanonicalBuildIntegrity();
  phaseTimingsMs.postBuildIntegrity = elapsedMs(postBuildIntegrityStartedAt);
  if (postBuildIntegrity.status !== "present") {
    throw new Error(
      `Build output is not usable after npm run build: ${postBuildIntegrity.error ?? postBuildIntegrity.status}.`,
    );
  }

  const postBuildFreshnessStartedAt = performance.now();
  const sourceAfterBuild = fingerprintQaExecutableInputs({ rootDir });
  if (sourceAfterBuild.digest !== sourceBeforeBuild.digest) {
    throw new Error(
      "Executable inputs changed while npm run build was running; refusing to mark the artifact fresh.",
    );
  }

  const postBuildArtifactFingerprint = readCanonicalBuildArtifactFingerprint();
  if (!postBuildArtifactFingerprint) {
    throw new Error("Build artifact fingerprint is unavailable after npm run build.");
  }

  writeQaBuildFreshnessReceipt({
    artifactFingerprint: postBuildArtifactFingerprint,
    freshnessPath: canonicalFreshnessPath,
    sourceFingerprint: sourceAfterBuild,
  });

  const verifiedFreshness = evaluateQaBuildFreshness({
    artifactFingerprint: readCanonicalBuildArtifactFingerprint(),
    freshnessPath: canonicalFreshnessPath,
    rootDir,
  });
  phaseTimingsMs.postBuildFreshness = elapsedMs(postBuildFreshnessStartedAt);
  if (verifiedFreshness.status !== "fresh") {
    throw new Error(
      `Build freshness receipt did not verify after npm run build: ${verifiedFreshness.reason}.`,
    );
  }

  return {
    artifactDecision: "rebuilt",
    phaseTimingsMs,
  };
}

async function resolveServerStatus() {
  const statusStartedAt = performance.now();
  const processStartedAt = performance.now();
  const state = readState();
  const pids = listeningPids();
  const serverPid = resolveServerPid(pids, state);
  const commandLine = serverPid ? processCommand(serverPid) : null;
  const loopbackListener = serverPid ? hasOnlyLoopbackListeners(serverPid) : false;
  const currentRuntimeCommand = serverPid ? isCompatibleServerCommand(commandLine) : false;
  const legacyRuntimeServer = serverPid ? isLegacyWorkspaceRuntimeCommand(commandLine) : false;
  const compatibleServer = currentRuntimeCommand || legacyRuntimeServer;
  const currentRuntimeServer = currentRuntimeCommand && loopbackListener;
  const processMs = elapsedMs(processStartedAt);
  const healthStartedAt = performance.now();
  const healthy = serverPid ? await isHealthy() : false;
  const healthMs = elapsedMs(healthStartedAt);
  const integrityStartedAt = performance.now();
  const buildIntegrity = readManagedSlotIntegrity();
  const integrityMs = elapsedMs(integrityStartedAt);
  const artifactStartedAt = performance.now();
  const artifactFingerprint =
    buildIntegrity.status === "present" ? readBuildArtifactFingerprint() : null;
  const artifactFingerprintMs = elapsedMs(artifactStartedAt);
  const freshnessStartedAt = performance.now();
  const buildFreshness = evaluateQaBuildFreshness({
    artifactFingerprint,
    freshnessPath,
    rootDir,
  });
  const freshnessMs = elapsedMs(freshnessStartedAt);
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
              : buildFreshness.status !== "fresh"
                ? "stale"
                : processIsOlderThanBuild
                  ? "stale"
                  : "current";

  return {
    state,
    serverPid,
    commandLine,
    loopbackListener,
    compatibleServer,
    healthy,
    buildStatus,
    buildIntegrity,
    buildFreshness,
    serverStatus,
    phaseTimingsMs: withTotalTiming(
      {
        process: processMs,
        health: healthMs,
        integrity: integrityMs,
        artifactFingerprint: artifactFingerprintMs,
        freshness: freshnessMs,
      },
      statusStartedAt,
    ),
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
    commandLine.includes(`--port ${port}`),
  );
}

function isLegacyWorkspaceRuntimeCommand(commandLine) {
  return Boolean(
    slot === "qa_fixture" &&
    commandLine &&
    (commandLine.includes("logs/build-output-finalized/server/index.mjs") ||
      commandLine.includes(".output/server/index.mjs")) &&
    commandLine.includes(`--port ${port}`),
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

function readBuildArtifactFingerprint() {
  return fingerprintQaBuildArtifact({
    freshnessPath,
    runtimeRoot: finalizedOutputDir,
  });
}

function hasCompleteBuildOutput() {
  return requiredBuildArtifacts.every((artifactPath) => existsSync(artifactPath));
}

function readManagedSlotIntegrity() {
  if (!hasCompleteBuildOutput()) {
    return {
      status: "missing",
      error: null,
    };
  }

  return {
    status: "present",
    error: null,
  };
}

function readCanonicalBuildArtifactFingerprint() {
  return fingerprintQaBuildArtifact({
    freshnessPath: canonicalFreshnessPath,
    runtimeRoot: canonicalOutputDir,
  });
}

function hasCompleteCanonicalBuildOutput() {
  return canonicalRequiredBuildArtifacts.every((artifactPath) => existsSync(artifactPath));
}

function readCanonicalBuildIntegrity() {
  const activeBuildLock = readActiveBuildOutputLock({ rootDir });

  if (activeBuildLock) {
    return {
      status: "locked",
      error: `Build output lifecycle is already running (owner pid ${activeBuildLock.ownerPid}, acquired at ${activeBuildLock.acquiredAt}).`,
    };
  }

  if (!hasCompleteCanonicalBuildOutput()) {
    return {
      status: "missing",
      error: null,
    };
  }

  try {
    cleanupRecoverableGeneratedSiblingConflicts();
    validateLocalBuildOutput({ rootDir });

    return {
      status: "present",
      error: null,
    };
  } catch (error) {
    return {
      status: "broken",
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
      slot: parsed.slot === slot ? parsed.slot : null,
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
      artifactFingerprint:
        parsed.artifactFingerprint && typeof parsed.artifactFingerprint === "object"
          ? parsed.artifactFingerprint
          : null,
      sourceFingerprint:
        parsed.sourceFingerprint && typeof parsed.sourceFingerprint === "object"
          ? parsed.sourceFingerprint
          : null,
      runtimeRoot: typeof parsed.runtimeRoot === "string" ? parsed.runtimeRoot : null,
      providerMode:
        parsed.providerMode === "qa_fixture" || parsed.providerMode === "real"
          ? parsed.providerMode
          : null,
      fixtureProfile: parsed.fixtureProfile === "camelot" ? parsed.fixtureProfile : null,
      artifactDecision:
        parsed.artifactDecision === "reused" || parsed.artifactDecision === "rebuilt"
          ? parsed.artifactDecision
          : null,
      lifecyclePhaseTimingsMs: normalizePhaseTimings(parsed.lifecyclePhaseTimingsMs),
    };
  } catch {
    return null;
  }
}

function persistState(state) {
  ensureLogsDir();
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(
    slotPaths.leasePath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        slot,
        serverPid: state.serverPid,
        acquiredAt: state.startedAt,
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
}

function removeState() {
  rmSync(statePath, { force: true });
  rmSync(slotPaths.leasePath, { force: true });
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
    `slot: ${slot}`,
    `url: ${healthUrl}`,
    `pid: ${status.serverPid ?? "none"}`,
    `managed: ${Boolean(status.state?.serverPid && status.state.serverPid === status.serverPid)}`,
    `compatible: ${status.compatibleServer}`,
    `loopbackBind: ${status.loopbackListener}`,
    `healthy: ${status.healthy}`,
    `build: ${status.buildStatus}`,
    `runtime: ${finalizedOutputDir}`,
    `lease: ${slotPaths.leasePath}`,
    `log: ${logPath}`,
    `events: ${structuredEventsRoot}`,
    `providerMode: ${status.state?.providerMode ?? "unknown"}`,
    `fixtureProfile: ${status.state?.fixtureProfile ?? "none"}`,
    `artifactFreshness: ${status.buildFreshness.status}`,
    `freshnessReason: ${status.buildFreshness.reason}`,
    `artifactFingerprint: ${readBuildArtifactFingerprint()?.digest ?? "missing"}`,
    `sourceFingerprint: ${status.buildFreshness.sourceFingerprint?.digest ?? "missing"}`,
    `lastArtifactDecision: ${status.state?.artifactDecision ?? "none"}`,
    `phaseTimingsMs: ${formatPhaseTimings(status.phaseTimingsMs)}`,
    `lastLifecycleTimingsMs: ${formatPhaseTimings(status.state?.lifecyclePhaseTimingsMs)}`,
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
  console.log(`Usage: node ./scripts/qa-local-server.mjs <status|start|restart|stop> [--slot <qa_fixture|camelot>] [--provider-mode <real|qa_fixture>] [--fixture-profile <camelot>] [--json]

Commands:
  status   Show whether the ${slot} managed QA slot is running on ${healthUrl}
  start    Reuse or start only the selected slot (provider mode defaults to real)
  restart  Stop and start only the selected slot in the requested provider mode
  stop     Stop only the selected managed/compatible slot

Local state:
  slot: ${slot}
  runtime snapshot: ${finalizedOutputDir}
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

function elapsedMs(startedAt) {
  return Math.round((performance.now() - startedAt) * 100) / 100;
}

function withTotalTiming(phaseTimingsMs, startedAt) {
  return {
    ...phaseTimingsMs,
    total: elapsedMs(startedAt),
  };
}

function normalizePhaseTimings(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entries = Object.entries(value).filter(
    ([key, timing]) => key.length > 0 && typeof timing === "number" && Number.isFinite(timing),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function formatPhaseTimings(value) {
  if (!value) {
    return "none";
  }

  return Object.entries(value)
    .map(([phase, timing]) => `${phase}=${timing}`)
    .join(",");
}

function resolveProviderMode(args) {
  const index = args.indexOf("--provider-mode");
  const value = index >= 0 ? args[index + 1] : "real";

  if (value !== "real" && value !== "qa_fixture") {
    throw new Error("--provider-mode must be real or qa_fixture.");
  }

  return value;
}

function resolveManagedSlot(args) {
  const index = args.indexOf("--slot");
  const value = index >= 0 ? args[index + 1] : "qa_fixture";
  if (!Object.hasOwn(QA_MANAGED_RUNTIME_SLOTS, value)) {
    throw new Error("--slot must be qa_fixture or camelot.");
  }
  return value;
}

function resolveFixtureProfile(args, selectedProviderMode, selectedSlot, selectedCommand) {
  const index = args.indexOf("--fixture-profile");
  const value = index >= 0 ? args[index + 1] : null;
  if (value !== null && value !== "camelot") {
    throw new Error("--fixture-profile must be camelot when provided.");
  }
  if (value && selectedProviderMode !== "qa_fixture") {
    throw new Error("A fixture profile requires --provider-mode qa_fixture.");
  }
  if (
    selectedSlot === "camelot" &&
    (selectedCommand === "start" || selectedCommand === "restart") &&
    value !== "camelot"
  ) {
    throw new Error("The camelot managed slot requires --fixture-profile camelot.");
  }
  if (selectedSlot !== "camelot" && value !== null) {
    throw new Error("The camelot fixture profile requires --slot camelot.");
  }
  return value;
}

function publicStatus(status) {
  return {
    ok: status.serverStatus === "current",
    slot,
    serverStatus: status.serverStatus,
    url: healthUrl,
    port,
    managed: Boolean(status.state?.serverPid && status.state.serverPid === status.serverPid),
    loopbackBind: status.loopbackListener,
    healthy: status.healthy,
    providerMode: status.state?.providerMode ?? null,
    fixtureProfile: status.state?.fixtureProfile ?? null,
    artifactFreshness: status.buildFreshness.status,
    freshnessReason: status.buildFreshness.reason,
    artifactFingerprint: readBuildArtifactFingerprint()?.digest ?? null,
    sourceFingerprint: status.buildFreshness.sourceFingerprint?.digest ?? null,
    runtimeRoot: finalizedOutputDir,
    leaseActive: existsSync(slotPaths.leasePath),
  };
}
