import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, resolve } from "node:path";

export const qaRuntimeRootEnvName = "HITO_QA_RUNTIME_ROOT";
export const QA_MANAGED_RUNTIME_SLOTS = Object.freeze({
  qa_fixture: Object.freeze({
    host: "127.0.0.1",
    port: 3000,
    fixtureProfile: null,
  }),
  camelot: Object.freeze({
    host: "localhost",
    port: 3100,
    fixtureProfile: "camelot",
  }),
});

export function resolveQaRuntimePaths({ rootDir = process.cwd() } = {}) {
  const workspaceRoot = resolve(rootDir);
  const runtimeRoot = resolveQaRuntimeRoot(workspaceRoot);
  const runtimeParentDir = dirname(runtimeRoot);
  const stateDir = resolve(runtimeParentDir, ".qa-runtime-state");
  const buildOutputRoot = resolve(runtimeParentDir, "qa-build-output");
  const nitroBuildDir = resolve(buildOutputRoot, "nitro");
  const nitroOutputDir = resolve(buildOutputRoot, "output");
  const nitroDevOutputDir = resolve(buildOutputRoot, "dev-output");

  return {
    runtimeRoot,
    serverDir: resolve(runtimeRoot, "server"),
    publicDir: resolve(runtimeRoot, "public"),
    nitroManifest: resolve(runtimeRoot, "nitro.json"),
    serverEntry: resolve(runtimeRoot, "server/index.mjs"),
    stateDir,
    statePath: resolve(stateDir, "qa-local-server-state.json"),
    logPath: resolve(stateDir, "qa-local-server.log"),
    lockPath: resolve(stateDir, "build-output.lock.json"),
    freshnessPath: resolve(runtimeRoot, ".hito-build-freshness.json"),
    buildOutputRoot,
    buildOutputNodeModulesDir: resolve(buildOutputRoot, "node_modules"),
    nitroBuildDir,
    nitroOutputDir,
    nitroServerDir: resolve(nitroOutputDir, "server"),
    nitroPublicDir: resolve(nitroOutputDir, "public"),
    nitroOutputManifest: resolve(nitroOutputDir, "nitro.json"),
    nitroStagedPublicDir: resolve(nitroBuildDir, "vite/public"),
    nitroSsrServiceDir: resolve(nitroBuildDir, "vite/services/ssr"),
    nitroDevOutputDir,
    nitroDevServerDir: resolve(nitroDevOutputDir, "server"),
    nitroDevPublicDir: resolve(nitroDevOutputDir, "public"),
    viteCacheDir: resolve(buildOutputRoot, "vite-cache"),
    finalizeBackupDir: resolve(runtimeParentDir, "qa-runtime-finalize-backup"),
    finalizedPreviousDir: resolve(runtimeParentDir, "qa-runtime-previous"),
    finalizedStagingDir: resolve(runtimeParentDir, "qa-runtime-staging"),
    publicSnapshotDir: resolve(runtimeParentDir, "qa-runtime-public-snapshot"),
  };
}

export function resolveQaManagedSlotPaths({ rootDir = process.cwd(), slot = "qa_fixture" } = {}) {
  const slotContract = QA_MANAGED_RUNTIME_SLOTS[slot];
  if (!slotContract) {
    throw new Error(
      `Unknown managed QA runtime slot ${JSON.stringify(slot)}. Expected one of: ${Object.keys(
        QA_MANAGED_RUNTIME_SLOTS,
      ).join(", ")}.`,
    );
  }

  const canonicalPaths = resolveQaRuntimePaths({ rootDir });
  const slotsRoot = resolve(dirname(canonicalPaths.runtimeRoot), "managed-runtime-slots");
  const slotRoot = resolve(slotsRoot, slot);
  const runtimeRoot = resolve(slotRoot, "runtime");
  const stateDir = resolve(slotRoot, "state");

  return {
    slot,
    ...slotContract,
    slotsRoot,
    slotRoot,
    runtimeRoot,
    serverDir: resolve(runtimeRoot, "server"),
    publicDir: resolve(runtimeRoot, "public"),
    nitroManifest: resolve(runtimeRoot, "nitro.json"),
    serverEntry: resolve(runtimeRoot, "server/index.mjs"),
    freshnessPath: resolve(runtimeRoot, ".hito-build-freshness.json"),
    stateDir,
    statePath: resolve(stateDir, "qa-local-server-state.json"),
    logPath: resolve(stateDir, "qa-local-server.log"),
    leasePath: resolve(stateDir, "runtime-lease.json"),
    stagingRuntimeRoot: resolve(slotRoot, "runtime-staging"),
    previousRuntimeRoot: resolve(slotRoot, "runtime-previous"),
  };
}

export function ensureQaBuildOutputNodeModulesLink({ rootDir = process.cwd() } = {}) {
  const paths = resolveQaRuntimePaths({ rootDir });
  const workspaceNodeModulesDir = resolve(rootDir, "node_modules");
  const linkPath = paths.buildOutputNodeModulesDir;

  if (!existsSync(workspaceNodeModulesDir)) {
    throw new Error(
      `Cannot prepare local QA build output: missing workspace node_modules at ${workspaceNodeModulesDir}`,
    );
  }

  mkdirSync(paths.buildOutputRoot, { recursive: true });

  const existingLink = lstatIfExists(linkPath);
  if (existingLink) {
    if (!existingLink.isSymbolicLink()) {
      throw new Error(
        `Refusing to replace non-symlink local QA build dependency path: ${linkPath}`,
      );
    }

    const currentTarget = resolve(dirname(linkPath), readlinkSync(linkPath));
    if (currentTarget === workspaceNodeModulesDir) {
      return linkPath;
    }

    rmSync(linkPath, { recursive: true, force: true });
  }

  symlinkSync(workspaceNodeModulesDir, linkPath, "dir");
  return linkPath;
}

export function generatedSiblingConflictPaths(path) {
  const parentDir = dirname(path);
  const canonicalName = basename(path);

  if (!existsSync(parentDir)) {
    return [];
  }

  return readdirSync(parentDir)
    .filter(
      (entry) => entry !== canonicalName && canonicalGeneratedSiblingName(entry) === canonicalName,
    )
    .map((entry) => resolve(parentDir, entry));
}

export function isGeneratedSiblingConflictName(entryName) {
  return canonicalGeneratedSiblingName(entryName) !== entryName;
}

function resolveQaRuntimeRoot(workspaceRoot) {
  const configuredRoot = process.env[qaRuntimeRootEnvName]?.trim();

  if (configuredRoot) {
    return resolve(expandHome(configuredRoot));
  }

  const workspaceSlug = safeWorkspaceSlug(basename(workspaceRoot));
  const workspaceHash = createHash("sha256").update(workspaceRoot).digest("hex").slice(0, 12);

  return resolve(
    homedir(),
    "Library/Caches/hito-running",
    `${workspaceSlug}-${workspaceHash}`,
    "qa-runtime",
  );
}

function expandHome(path) {
  return path === "~" || path.startsWith("~/") ? resolve(homedir(), path.slice(2)) : path;
}

function safeWorkspaceSlug(value) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "workspace";
}

function canonicalGeneratedSiblingName(entryName) {
  const extensionConflict = /^(.*) \d+(\.[^/.]+)$/.exec(entryName);
  if (extensionConflict) {
    return `${extensionConflict[1]}${extensionConflict[2]}`;
  }

  const bareConflict = /^(.*) \d+$/.exec(entryName);
  return bareConflict ? bareConflict[1] : entryName;
}

function lstatIfExists(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}
