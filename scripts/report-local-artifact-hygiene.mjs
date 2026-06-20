#!/usr/bin/env node
import { lstat, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_LOG_DAYS = 7;
const OLD_LOG_DAYS = 30;
const MAX_SAMPLES = 8;

const DEFAULT_TARGETS = [
  {
    path: "logs",
    artifactKind: "local_logs",
    description: "Gitignored local logs and generated build-output snapshots.",
  },
  {
    path: "logs/build-output-finalized",
    artifactKind: "build_output_residue",
    includedInParent: "logs",
    description: "Finalized local build output snapshot used by the managed QA server flow.",
  },
  {
    path: "logs/build-output-finalize-backup",
    artifactKind: "build_output_residue",
    includedInParent: "logs",
    description: "Postbuild finalizer backup output from local Nitro builds.",
  },
  {
    path: "logs/build-output-public-snapshot",
    artifactKind: "build_output_residue",
    includedInParent: "logs",
    description: "Client public-output snapshot used by the local build finalizer.",
  },
  {
    path: "logs/qa-local-server.log",
    artifactKind: "qa_server_log",
    includedInParent: "logs",
    description: "Managed local QA server stdout/stderr log.",
  },
  {
    path: "logs/qa-local-server-state.json",
    artifactKind: "qa_server_state",
    includedInParent: "logs",
    description: "Managed local QA server PID/build state.",
  },
  {
    path: "test-results",
    artifactKind: "generated_test_runner_residue",
    description: "Generated test-runner residue such as Playwright .last-run state.",
  },
];

const QA_ARTIFACT_TARGET = {
  path: "qa-artifacts",
  artifactKind: "protected_qa_evidence",
  protectedEvidence: true,
  description: "Protected local QA evidence. Count only; never mark disposable in this tool.",
};

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mutation: false,
        reason: "local_artifact_hygiene_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(buildHelpText());
    return;
  }

  const rootDir = resolve(process.cwd(), options.rootDir);
  const targets = options.includeQaArtifacts
    ? [...DEFAULT_TARGETS, QA_ARTIFACT_TARGET]
    : DEFAULT_TARGETS;
  const entries = [];

  for (const target of targets) {
    entries.push(await buildTargetReport(rootDir, target));
  }

  const topLevelEntries = entries.filter((entry) => !entry.includedInParent);
  const report = {
    ok: true,
    mode: "dry_run",
    mutation: false,
    applyModeAvailable: false,
    generatedAt: new Date().toISOString(),
    rootDir,
    policy: {
      recentRawLogDays: RECENT_LOG_DAYS,
      oldLogDays: OLD_LOG_DAYS,
      qaArtifactsDefault: "excluded_protected_evidence",
      qaArtifactsIncluded: options.includeQaArtifacts,
      deletion: "out_of_scope",
      compression: "future_explicit_cleanup_only",
    },
    totals: summarizeTotals(topLevelEntries),
    entries,
    notes: buildNotes(options),
  };

  console.log(JSON.stringify(report, null, 2));
}

async function buildTargetReport(rootDir, target) {
  const absolutePath = resolve(rootDir, target.path);
  const summary = await summarizePath(absolutePath, rootDir);
  const retentionCategory = classifyRetention({ summary, target });

  return {
    path: target.path,
    artifactKind: target.artifactKind,
    description: target.description,
    includedInParent: target.includedInParent ?? null,
    protectedEvidence: target.protectedEvidence === true,
    exists: summary.exists,
    retentionCategory,
    suggestedAction: buildSuggestedAction({ summary, target, retentionCategory }),
    deletionAllowedByThisTool: false,
    compressionAllowedByThisTool: false,
    bytes: summary.bytes,
    humanSize: formatBytes(summary.bytes),
    files: summary.files,
    directories: summary.directories,
    symlinks: summary.symlinks,
    newestMtime: summary.newestMtime?.toISOString() ?? null,
    newestAgeDays: summary.newestMtime ? ageDays(summary.newestMtime) : null,
    oldestMtime: summary.oldestMtime?.toISOString() ?? null,
    oldestAgeDays: summary.oldestMtime ? ageDays(summary.oldestMtime) : null,
    newestContentMtime: summary.newestContentMtime?.toISOString() ?? null,
    newestContentAgeDays: summary.newestContentMtime ? ageDays(summary.newestContentMtime) : null,
    oldestContentMtime: summary.oldestContentMtime?.toISOString() ?? null,
    oldestContentAgeDays: summary.oldestContentMtime ? ageDays(summary.oldestContentMtime) : null,
    samples: summary.samples,
  };
}

async function summarizePath(absolutePath, rootDir) {
  const initial = await safeLstat(absolutePath);

  if (!initial) {
    return emptySummary(false);
  }

  const summary = emptySummary(true);
  const stack = [{ absolutePath, stat: initial }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const { stat, absolutePath: currentPath } = current;
    addMtime(summary, stat.mtime);

    if (stat.isSymbolicLink()) {
      summary.symlinks += 1;
      summary.bytes += stat.size;
      addContentMtime(summary, stat.mtime);
      addSample(summary, rootDir, currentPath);
      continue;
    }

    if (stat.isDirectory()) {
      summary.directories += 1;
      addSample(summary, rootDir, currentPath);

      for (const entry of await readdir(currentPath)) {
        const childPath = resolve(currentPath, entry);
        const childStat = await safeLstat(childPath);
        if (childStat) {
          stack.push({ absolutePath: childPath, stat: childStat });
        }
      }

      continue;
    }

    summary.files += 1;
    summary.bytes += stat.size;
    addContentMtime(summary, stat.mtime);
    addSample(summary, rootDir, currentPath);
  }

  return summary;
}

function classifyRetention({ summary, target }) {
  if (!summary.exists) {
    return "missing";
  }

  if (summary.files === 0 && summary.directories <= 1 && summary.symlinks === 0) {
    return "empty";
  }

  if (target.protectedEvidence) {
    return "protected_qa_evidence";
  }

  if (target.artifactKind === "generated_test_runner_residue") {
    return "generated_test_runner_residue";
  }

  const classificationMtime = summary.newestContentMtime ?? summary.newestMtime;
  const newestAge = classificationMtime ? ageDays(classificationMtime) : 0;

  if (newestAge <= RECENT_LOG_DAYS) {
    return "recent_raw_logs";
  }

  if (newestAge <= OLD_LOG_DAYS) {
    return "old_logs_archive_candidate";
  }

  return "very_old_logs_delete_candidate_for_future_approval";
}

function buildSuggestedAction({ summary, target, retentionCategory }) {
  if (!summary.exists) {
    return "No action; path is absent.";
  }

  if (target.protectedEvidence) {
    return "Protected QA evidence. Count only; do not delete, compress, or mark disposable.";
  }

  switch (retentionCategory) {
    case "empty":
      return "No action needed; path is empty.";
    case "generated_test_runner_residue":
      return "Generated test-runner residue. Eligible for future explicit cleanup, not deleted by this dry-run.";
    case "recent_raw_logs":
      return "Keep as recent local diagnostic output.";
    case "old_logs_archive_candidate":
      return "Candidate for future explicit compression/archive after owner approval.";
    case "very_old_logs_delete_candidate_for_future_approval":
      return "Candidate for future explicit deletion after owner approval.";
    default:
      return "Review manually.";
  }
}

function summarizeTotals(entries) {
  return {
    reportedTopLevelPaths: entries.length,
    existingTopLevelPaths: entries.filter((entry) => entry.exists).length,
    bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    humanSize: formatBytes(entries.reduce((sum, entry) => sum + entry.bytes, 0)),
    files: entries.reduce((sum, entry) => sum + entry.files, 0),
    directories: entries.reduce((sum, entry) => sum + entry.directories, 0),
    symlinks: entries.reduce((sum, entry) => sum + entry.symlinks, 0),
  };
}

function buildNotes(options) {
  const notes = [
    "Dry-run only: this command does not delete, compress, archive, or mutate files.",
    "Nested build-output entries are reported for visibility and are also included in the logs/ top-level total.",
  ];

  if (!options.includeQaArtifacts) {
    notes.push("qa-artifacts/ is protected evidence and is excluded by default.");
    notes.push("Pass --include-qa-artifacts to count qa-artifacts/ as protected evidence only.");
  } else {
    notes.push(
      "qa-artifacts/ was explicitly included as protected evidence and remains non-disposable.",
    );
  }

  return notes;
}

function parseArgs(args) {
  const options = {
    rootDir: ".",
    includeQaArtifacts: false,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--include-qa-artifacts") {
      options.includeQaArtifacts = true;
      continue;
    }

    if (arg === "--root") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --root.");
      }
      options.rootDir = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--root=")) {
      const value = arg.slice("--root=".length).trim();
      if (!value) {
        throw new Error("Missing value for --root.");
      }
      options.rootDir = value;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function buildHelpText() {
  return `Usage:
  npm run artifact:hygiene
  npm run artifact:hygiene -- --include-qa-artifacts
  node ./scripts/report-local-artifact-hygiene.mjs --root /tmp/hito-artifact-fixture

This is a dry-run reporter only. It inventories logs/, test-results/, and build-output residues.
qa-artifacts/ is protected evidence and is excluded unless --include-qa-artifacts is supplied.`;
}

async function safeLstat(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function emptySummary(exists) {
  return {
    exists,
    bytes: 0,
    files: 0,
    directories: 0,
    symlinks: 0,
    newestMtime: null,
    oldestMtime: null,
    newestContentMtime: null,
    oldestContentMtime: null,
    samples: [],
  };
}

function addMtime(summary, mtime) {
  if (!summary.newestMtime || mtime > summary.newestMtime) {
    summary.newestMtime = mtime;
  }

  if (!summary.oldestMtime || mtime < summary.oldestMtime) {
    summary.oldestMtime = mtime;
  }
}

function addContentMtime(summary, mtime) {
  if (!summary.newestContentMtime || mtime > summary.newestContentMtime) {
    summary.newestContentMtime = mtime;
  }

  if (!summary.oldestContentMtime || mtime < summary.oldestContentMtime) {
    summary.oldestContentMtime = mtime;
  }
}

function addSample(summary, rootDir, absolutePath) {
  if (summary.samples.length >= MAX_SAMPLES) {
    return;
  }

  summary.samples.push(relative(rootDir, absolutePath) || ".");
}

function ageDays(date) {
  return Number(((Date.now() - date.getTime()) / DAY_MS).toFixed(2));
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
