import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";

export const qaBuildFreshnessSchemaVersion = 1;

const executableSourceDirectories = ["src", "public"];
const executableSourceFiles = [
  "docs/history/changelog.md",
  "docs/history/technical-log.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "scripts/finalize-build-output.mjs",
  "scripts/lib/qa-runtime-paths.mjs",
];
const optionalBuildEnvironmentFiles = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];
const buildEnvironmentNames = ["NODE_ENV", "NOW_BUILDER", "VERCEL"];
const buildEnvironmentPrefixes = ["NEXT_PUBLIC_", "VITE_"];

export function evaluateQaBuildFreshness({
  artifactFingerprint,
  freshnessPath,
  rootDir = process.cwd(),
}) {
  const sourceFingerprint = fingerprintQaExecutableInputs({ rootDir });

  if (!artifactFingerprint) {
    return {
      status: "stale",
      reason: "artifact_missing",
      sourceFingerprint,
    };
  }

  const receipt = readQaBuildFreshnessReceipt(freshnessPath);
  if (!receipt) {
    return {
      status: "stale",
      reason: "receipt_missing_or_invalid",
      sourceFingerprint,
    };
  }

  if (receipt.schemaVersion !== qaBuildFreshnessSchemaVersion) {
    return {
      status: "stale",
      reason: "receipt_schema_mismatch",
      sourceFingerprint,
    };
  }

  if (receipt.source.digest !== sourceFingerprint.digest) {
    return {
      status: "stale",
      reason: "executable_inputs_changed",
      sourceFingerprint,
    };
  }

  if (receipt.artifact.digest !== artifactFingerprint.digest) {
    return {
      status: "stale",
      reason: "artifact_changed",
      sourceFingerprint,
    };
  }

  return {
    status: "fresh",
    reason: "receipt_matches",
    sourceFingerprint,
  };
}

export function fingerprintQaExecutableInputs({ rootDir = process.cwd() } = {}) {
  const paths = [
    ...executableSourceDirectories.flatMap((directory) =>
      listFilesRecursively(resolve(rootDir, directory)),
    ),
    ...executableSourceFiles.map((path) => resolve(rootDir, path)),
    ...optionalBuildEnvironmentFiles
      .map((path) => resolve(rootDir, path))
      .filter((path) => existsSync(path)),
  ];
  const fileFingerprint = fingerprintPaths({ paths, rootDir });
  const environmentFingerprint = fingerprintBuildEnvironment();
  const digest = createHash("sha256")
    .update(`node:${process.version}\0${process.platform}\0${process.arch}\0`)
    .update(fileFingerprint.digest)
    .update(environmentFingerprint)
    .digest("hex");

  return {
    digest,
    fileCount: fileFingerprint.fileCount,
  };
}

export function fingerprintQaBuildArtifact({ freshnessPath, runtimeRoot }) {
  if (!existsSync(runtimeRoot)) {
    return null;
  }

  const excludedPath = resolve(freshnessPath);
  const paths = listFilesRecursively(runtimeRoot).filter((path) => resolve(path) !== excludedPath);
  return fingerprintPaths({ paths, rootDir: runtimeRoot });
}

export function writeQaBuildFreshnessReceipt({
  artifactFingerprint,
  freshnessPath,
  sourceFingerprint,
}) {
  const receipt = {
    schemaVersion: qaBuildFreshnessSchemaVersion,
    createdAt: new Date().toISOString(),
    source: sourceFingerprint,
    artifact: artifactFingerprint,
  };
  const temporaryPath = `${freshnessPath}.tmp-${process.pid}`;

  mkdirSync(dirname(freshnessPath), { recursive: true });

  try {
    writeFileSync(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    renameSync(temporaryPath, freshnessPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function readQaBuildFreshnessReceipt(freshnessPath) {
  try {
    if (!existsSync(freshnessPath)) {
      return null;
    }

    const parsed = JSON.parse(readFileSync(freshnessPath, "utf8"));
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.schemaVersion !== "number" ||
      !isFingerprint(parsed.source) ||
      !isFingerprint(parsed.artifact)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function fingerprintPaths({ paths, rootDir }) {
  const hash = createHash("sha256");
  const uniquePaths = [...new Set(paths.map((path) => resolve(path)))].sort();
  let fileCount = 0;

  for (const path of uniquePaths) {
    const relativePath = relative(rootDir, path).replaceAll("\\", "/");
    const stats = lstatSync(path);

    if (stats.isSymbolicLink()) {
      hash.update(`link:${relativePath}\0${readlinkSync(path)}\0`);
      fileCount += 1;
      continue;
    }

    if (!stats.isFile()) {
      continue;
    }

    hash.update(`file:${relativePath}\0${stats.size}\0`);
    hash.update(readFileSync(path));
    hash.update("\0");
    fileCount += 1;
  }

  return {
    digest: hash.digest("hex"),
    fileCount,
  };
}

function fingerprintBuildEnvironment() {
  const names = Object.keys(process.env)
    .filter(
      (name) =>
        buildEnvironmentNames.includes(name) ||
        buildEnvironmentPrefixes.some((prefix) => name.startsWith(prefix)),
    )
    .sort();
  const hash = createHash("sha256");

  for (const name of names) {
    hash.update(`${name}\0${process.env[name] ?? ""}\0`);
  }

  return hash.digest("hex");
}

function listFilesRecursively(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(directory).sort()) {
    const path = resolve(directory, entry);
    const stats = lstatSync(path);

    if (stats.isDirectory() && !stats.isSymbolicLink()) {
      files.push(...listFilesRecursively(path));
    } else if (stats.isFile() || stats.isSymbolicLink()) {
      files.push(path);
    }
  }

  return files;
}

function isFingerprint(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.digest === "string" &&
    typeof value.fileCount === "number"
  );
}
