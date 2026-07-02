#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, sep } from "node:path";

const ROOT_DIR = process.cwd();
const LEDGER_PATH = "docs/metrics/line-count-ledger.jsonl";
const GENERATED_ROUTE_TREE = "src/routeTree.gen.ts";
const GROUP_ORDER = [
  "product_src",
  "scripts",
  "docs_current_tasks_md",
  "docs_archive_md",
  "agent_instructions",
  "supabase",
  "root_config_docs",
  "other",
];
const INCLUDE_ROOTS = new Set(["src", "scripts", "docs", "agents", "skills", "supabase"]);
const EXCLUDED_DIRS = new Set([
  ".git",
  ".local-artifact-archive",
  ".next",
  ".nitro",
  ".output",
  ".turbo",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "logs",
  "node_modules",
  "qa-artifacts",
  "test-results",
]);
const EXCLUDED_LOCKFILES = new Set([
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const ROOT_TEXT_FILES = new Set([
  ".env.example",
  ".eslintignore",
  ".gitignore",
  ".npmrc",
  "AGENTS.md",
  "Dockerfile",
  "README.md",
]);
const SIZE_THRESHOLDS = {
  watch: 700,
  refactorCandidate: 1000,
  activeDecompositionCandidate: 1500,
  activeMarkdownCompressionCandidate: 2000,
};
const MAX_LIST_ITEMS = 20;

main();

function main() {
  const previousSnapshot = readPreviousSnapshot();
  const files = collectMaintainedFiles();
  const fileReports = files.map(buildFileReport).sort((a, b) => a.path.localeCompare(b.path));
  const groups = summarizeGroups(fileReports);
  const oversized = summarizeOversized(fileReports);
  const dirtyWorktree = summarizeDirtyWorktree();
  const excludedRoots = summarizeExcludedRoots();
  const snapshot = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    maintainedFiles: fileReports.length,
    maintainedLines: sum(fileReports.map((file) => file.lines)),
    groups,
    thresholds: SIZE_THRESHOLDS,
    oversizedCounts: oversized.counts,
    topOversizedProductFiles: oversized.productFiles.slice(0, MAX_LIST_ITEMS),
    topOversizedDocs: oversized.docs.slice(0, MAX_LIST_ITEMS),
    topOversizedScripts: oversized.scripts.slice(0, MAX_LIST_ITEMS),
    dirtyWorktree,
    exclusions: {
      roots: [...EXCLUDED_DIRS].sort(),
      lockfiles: [...EXCLUDED_LOCKFILES].sort(),
      generatedFiles: [GENERATED_ROUTE_TREE, LEDGER_PATH],
      excludedRoots,
    },
  };

  snapshot.deltaFromPrevious = buildDelta(previousSnapshot, snapshot);
  appendLedgerSnapshot(snapshot);
  printReport(snapshot);
}

function collectMaintainedFiles() {
  const collected = [];
  const rootEntries = safeReadDir(ROOT_DIR);

  for (const entry of rootEntries) {
    const absolutePath = join(ROOT_DIR, entry.name);
    const relPath = normalizePath(entry.name);

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      if (INCLUDE_ROOTS.has(entry.name)) {
        walkDirectory(absolutePath, relPath, collected);
      }
      continue;
    }

    if (entry.isFile() && shouldIncludeRootFile(relPath)) {
      collected.push(relPath);
    }
  }

  return collected.sort();
}

function walkDirectory(absoluteDir, relDir, collected) {
  for (const entry of safeReadDir(absoluteDir)) {
    const absolutePath = join(absoluteDir, entry.name);
    const relPath = normalizePath(join(relDir, entry.name));

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name, relPath)) {
        continue;
      }
      walkDirectory(absolutePath, relPath, collected);
      continue;
    }

    if (entry.isFile() && shouldIncludeMaintainedFile(relPath)) {
      collected.push(relPath);
    }
  }
}

function safeReadDir(path) {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

function shouldSkipDirectory(name, relPath) {
  return EXCLUDED_DIRS.has(name) || EXCLUDED_DIRS.has(relPath);
}

function shouldIncludeRootFile(relPath) {
  const name = basename(relPath);
  if (EXCLUDED_LOCKFILES.has(name)) {
    return false;
  }
  return ROOT_TEXT_FILES.has(name) || TEXT_EXTENSIONS.has(extname(name));
}

function shouldIncludeMaintainedFile(relPath) {
  const name = basename(relPath);
  if (EXCLUDED_LOCKFILES.has(name)) {
    return false;
  }
  if (relPath === GENERATED_ROUTE_TREE || relPath === LEDGER_PATH) {
    return false;
  }
  return TEXT_EXTENSIONS.has(extname(name));
}

function buildFileReport(relPath) {
  const absolutePath = join(ROOT_DIR, relPath);
  const content = readFileSync(absolutePath, "utf8");
  return {
    path: relPath,
    group: groupForPath(relPath),
    lines: countLines(content),
  };
}

function countLines(content) {
  if (content.length === 0) {
    return 0;
  }
  const newlineCount = content.split("\n").length - 1;
  return content.endsWith("\n") ? newlineCount : newlineCount + 1;
}

function groupForPath(relPath) {
  if (relPath === "AGENTS.md" || relPath.startsWith("agents/") || relPath.startsWith("skills/")) {
    return "agent_instructions";
  }
  if (relPath.startsWith("src/")) {
    return "product_src";
  }
  if (relPath.startsWith("scripts/")) {
    return "scripts";
  }
  if (relPath.startsWith("supabase/")) {
    return "supabase";
  }
  if (relPath.startsWith("docs/") && extname(relPath) === ".md") {
    return isArchiveDoc(relPath) ? "docs_archive_md" : "docs_current_tasks_md";
  }
  if (!relPath.includes("/")) {
    return "root_config_docs";
  }
  return "other";
}

function isArchiveDoc(relPath) {
  return (
    relPath.startsWith("docs/archive/") ||
    relPath.startsWith("docs/archives/") ||
    relPath.includes("/archive/") ||
    relPath.includes("/archived/")
  );
}

function summarizeGroups(fileReports) {
  const groups = Object.fromEntries(GROUP_ORDER.map((group) => [group, { files: 0, lines: 0 }]));

  for (const report of fileReports) {
    groups[report.group] ??= { files: 0, lines: 0 };
    groups[report.group].files += 1;
    groups[report.group].lines += report.lines;
  }

  return groups;
}

function summarizeOversized(fileReports) {
  const productFiles = [];
  const docs = [];
  const scripts = [];
  const counts = {
    productWatch700: 0,
    productRefactor1000: 0,
    productActiveDecomposition1500: 0,
    scriptWatch700: 0,
    scriptRefactor1000: 0,
    scriptActiveDecomposition1500: 0,
    activeMarkdownCompression2000: 0,
  };

  for (const report of fileReports) {
    if (report.group === "product_src" && report.lines >= SIZE_THRESHOLDS.watch) {
      counts.productWatch700 += 1;
      if (report.lines >= SIZE_THRESHOLDS.refactorCandidate) {
        counts.productRefactor1000 += 1;
      }
      if (report.lines >= SIZE_THRESHOLDS.activeDecompositionCandidate) {
        counts.productActiveDecomposition1500 += 1;
      }
      productFiles.push({ ...report, risk: riskForLines(report.lines) });
    }

    if (report.group === "scripts" && report.lines >= SIZE_THRESHOLDS.watch) {
      counts.scriptWatch700 += 1;
      if (report.lines >= SIZE_THRESHOLDS.refactorCandidate) {
        counts.scriptRefactor1000 += 1;
      }
      if (report.lines >= SIZE_THRESHOLDS.activeDecompositionCandidate) {
        counts.scriptActiveDecomposition1500 += 1;
      }
      scripts.push({ ...report, risk: riskForLines(report.lines) });
    }

    if (
      (report.group === "docs_current_tasks_md" || report.group === "docs_archive_md") &&
      report.lines >= SIZE_THRESHOLDS.watch
    ) {
      if (
        report.group === "docs_current_tasks_md" &&
        report.lines >= SIZE_THRESHOLDS.activeMarkdownCompressionCandidate
      ) {
        counts.activeMarkdownCompression2000 += 1;
      }
      docs.push({
        ...report,
        risk:
          report.group === "docs_current_tasks_md" &&
          report.lines >= SIZE_THRESHOLDS.activeMarkdownCompressionCandidate
            ? "docs_compression_candidate"
            : riskForLines(report.lines),
      });
    }
  }

  const byLargest = (a, b) => b.lines - a.lines || a.path.localeCompare(b.path);
  return {
    counts,
    productFiles: productFiles.sort(byLargest),
    docs: docs.sort(byLargest),
    scripts: scripts.sort(byLargest),
  };
}

function riskForLines(lines) {
  if (lines >= SIZE_THRESHOLDS.activeDecompositionCandidate) {
    return "active_decomposition_candidate";
  }
  if (lines >= SIZE_THRESHOLDS.refactorCandidate) {
    return "refactor_candidate";
  }
  if (lines >= SIZE_THRESHOLDS.watch) {
    return "watch";
  }
  return "normal";
}

function summarizeDirtyWorktree() {
  let output = "";
  try {
    output = execFileSync("git", ["status", "--short", "--untracked-files=all"], {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  const lines = output.split("\n").filter(Boolean);
  const summary = {
    available: true,
    total: lines.length,
    trackedModified: 0,
    trackedAdded: 0,
    trackedDeleted: 0,
    trackedRenamed: 0,
    trackedCopied: 0,
    untracked: 0,
    other: 0,
    topLevelPaths: {},
  };

  for (const line of lines) {
    const status = line.slice(0, 2);
    const path = normalizePath(line.slice(3).replace(/^.* -> /, ""));
    const topLevel = path.split("/")[0] || ".";
    summary.topLevelPaths[topLevel] = (summary.topLevelPaths[topLevel] ?? 0) + 1;

    if (status === "??") {
      summary.untracked += 1;
      continue;
    }

    const statusChars = new Set(status.trim().split(""));
    if (statusChars.has("M")) {
      summary.trackedModified += 1;
    }
    if (statusChars.has("A")) {
      summary.trackedAdded += 1;
    }
    if (statusChars.has("D")) {
      summary.trackedDeleted += 1;
    }
    if (statusChars.has("R")) {
      summary.trackedRenamed += 1;
    }
    if (statusChars.has("C")) {
      summary.trackedCopied += 1;
    }
    if (![..."MADRC"].some((char) => statusChars.has(char))) {
      summary.other += 1;
    }
  }

  summary.topLevelPaths = Object.fromEntries(
    Object.entries(summary.topLevelPaths).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  );
  return summary;
}

function summarizeExcludedRoots() {
  const roots = {};
  for (const relPath of [
    "node_modules",
    "qa-artifacts",
    "logs",
    ".output",
    ".local-artifact-archive",
    "test-results",
    "dist",
    "build",
    ".turbo",
    ".vercel",
  ]) {
    roots[relPath] = pathExists(join(ROOT_DIR, relPath));
  }
  roots[GENERATED_ROUTE_TREE] = pathExists(join(ROOT_DIR, GENERATED_ROUTE_TREE));
  return roots;
}

function pathExists(path) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function readPreviousSnapshot() {
  const absolutePath = join(ROOT_DIR, LEDGER_PATH);
  if (!pathExists(absolutePath)) {
    return null;
  }

  const lines = readFileSync(absolutePath, "utf8").split("\n").filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      continue;
    }
  }
  return null;
}

function buildDelta(previousSnapshot, snapshot) {
  if (!previousSnapshot) {
    return null;
  }

  const groupDeltas = {};
  for (const group of GROUP_ORDER) {
    groupDeltas[group] = {
      files: snapshot.groups[group].files - (previousSnapshot.groups?.[group]?.files ?? 0),
      lines: snapshot.groups[group].lines - (previousSnapshot.groups?.[group]?.lines ?? 0),
    };
  }

  return {
    previousGeneratedAt: previousSnapshot.generatedAt,
    maintainedFiles: snapshot.maintainedFiles - (previousSnapshot.maintainedFiles ?? 0),
    maintainedLines: snapshot.maintainedLines - (previousSnapshot.maintainedLines ?? 0),
    groups: groupDeltas,
  };
}

function appendLedgerSnapshot(snapshot) {
  const absolutePath = join(ROOT_DIR, LEDGER_PATH);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(snapshot)}\n`, { flag: "a" });
}

function printReport(snapshot) {
  console.log("Hito source-size snapshot");
  console.log(`generatedAt: ${snapshot.generatedAt}`);
  console.log(`ledger: ${LEDGER_PATH}`);
  console.log(`maintainedFiles: ${snapshot.maintainedFiles}`);
  console.log(`maintainedLines: ${snapshot.maintainedLines}`);
  console.log("");
  console.log("Group totals:");
  for (const group of GROUP_ORDER) {
    const value = snapshot.groups[group];
    console.log(`  ${group}: ${value.lines} lines / ${value.files} files`);
  }
  console.log("");
  console.log("Oversized counts:");
  for (const [key, value] of Object.entries(snapshot.oversizedCounts)) {
    console.log(`  ${key}: ${value}`);
  }
  printFileList("Top oversized product files:", snapshot.topOversizedProductFiles);
  printFileList("Top oversized docs:", snapshot.topOversizedDocs);
  printFileList("Top oversized scripts:", snapshot.topOversizedScripts);
  console.log("");
  printDirtyWorktree(snapshot.dirtyWorktree);
  console.log("");
  printDelta(snapshot.deltaFromPrevious);
  console.log("");
  console.log("Excluded generated/artifact roots present:");
  for (const [path, exists] of Object.entries(snapshot.exclusions.excludedRoots)) {
    console.log(`  ${path}: ${exists ? "present_excluded" : "absent"}`);
  }
}

function printFileList(title, files) {
  console.log("");
  console.log(title);
  if (files.length === 0) {
    console.log("  none");
    return;
  }
  for (const file of files) {
    console.log(`  ${file.lines} lines | ${file.risk} | ${file.path}`);
  }
}

function printDirtyWorktree(dirtyWorktree) {
  console.log("Dirty worktree:");
  if (!dirtyWorktree.available) {
    console.log(`  unavailable: ${dirtyWorktree.reason}`);
    return;
  }
  console.log(`  total: ${dirtyWorktree.total}`);
  console.log(`  trackedModified: ${dirtyWorktree.trackedModified}`);
  console.log(`  trackedAdded: ${dirtyWorktree.trackedAdded}`);
  console.log(`  trackedDeleted: ${dirtyWorktree.trackedDeleted}`);
  console.log(`  trackedRenamed: ${dirtyWorktree.trackedRenamed}`);
  console.log(`  trackedCopied: ${dirtyWorktree.trackedCopied}`);
  console.log(`  untracked: ${dirtyWorktree.untracked}`);
  console.log(`  other: ${dirtyWorktree.other}`);
  console.log("  topLevelPaths:");
  for (const [path, count] of Object.entries(dirtyWorktree.topLevelPaths)) {
    console.log(`    ${path}: ${count}`);
  }
}

function printDelta(delta) {
  console.log("Delta from previous snapshot:");
  if (!delta) {
    console.log("  none: first ledger snapshot");
    return;
  }
  console.log(`  previousGeneratedAt: ${delta.previousGeneratedAt}`);
  console.log(`  maintainedFiles: ${formatSigned(delta.maintainedFiles)}`);
  console.log(`  maintainedLines: ${formatSigned(delta.maintainedLines)}`);
  for (const group of GROUP_ORDER) {
    const value = delta.groups[group];
    console.log(
      `  ${group}: ${formatSigned(value.lines)} lines / ${formatSigned(value.files)} files`,
    );
  }
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : String(value);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function basename(path) {
  return path.split("/").at(-1) ?? path;
}

function normalizePath(path) {
  return path.split(sep).join("/");
}
