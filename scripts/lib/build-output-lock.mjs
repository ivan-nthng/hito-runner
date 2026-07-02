import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { resolveQaRuntimePaths } from "./qa-runtime-paths.mjs";

const lockFileName = "build-output.lock.json";

export function acquireBuildOutputLock({ rootDir }) {
  const lockPath = buildOutputLockPath(rootDir);
  const ownerPid = buildOutputLifecycleOwnerPid();
  const lock = readBuildOutputLock(lockPath);

  if (lock && isPidAlive(lock.ownerPid)) {
    throw new Error(
      `Another local build-output lifecycle is already running (owner pid ${lock.ownerPid}, acquired at ${lock.acquiredAt}). Wait for it to finish before running build or qa:server:restart again.`,
    );
  }

  if (lock) {
    removeBuildOutputLock(lockPath);
  }

  mkdirSync(dirname(lockPath), { recursive: true });
  const fd = openSync(lockPath, "wx");

  try {
    writeFileSync(
      fd,
      JSON.stringify(
        {
          ownerPid,
          acquiredByPid: process.pid,
          acquiredAt: new Date().toISOString(),
          command: process.env.npm_lifecycle_event ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    closeSync(fd);
  }
}

export function releaseBuildOutputLock({ rootDir }) {
  const lockPath = buildOutputLockPath(rootDir);
  const lock = readBuildOutputLock(lockPath);

  if (!lock) {
    return;
  }

  const currentOwnerPid = buildOutputLifecycleOwnerPid();
  if (lock.ownerPid === currentOwnerPid || !isPidAlive(lock.ownerPid)) {
    removeBuildOutputLock(lockPath);
  }
}

export function readActiveBuildOutputLock({ rootDir }) {
  const lockPath = buildOutputLockPath(rootDir);
  const lock = readBuildOutputLock(lockPath);

  if (!lock) {
    return null;
  }

  if (!isPidAlive(lock.ownerPid)) {
    removeBuildOutputLock(lockPath);
    return null;
  }

  return lock;
}

function buildOutputLockPath(rootDir) {
  return resolveQaRuntimePaths({ rootDir }).lockPath;
}

function readBuildOutputLock(lockPath) {
  if (!existsSync(lockPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(lockPath, "utf8"));

    return typeof parsed.ownerPid === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function buildOutputLifecycleOwnerPid() {
  return process.env.npm_lifecycle_event ? process.ppid || process.pid : process.pid;
}

function removeBuildOutputLock(lockPath) {
  unlinkSync(lockPath);
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
