import { readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

import {
  MANIFEST_KIND_FILE,
  MANIFEST_KIND_SYMLINK,
  MAX_SAMPLES,
  OLD_LOG_DAYS,
  RECENT_LOG_DAYS,
} from "./policy.mjs";
import { ageDays, formatBytes, safeLstat } from "./utils.mjs";

export async function buildTargetReport(rootDir, target, options) {
  const absolutePath = resolve(rootDir, target.path);
  const includeManifest = options.manifest && !target.includedInParent;
  const summary = await summarizePath(absolutePath, rootDir, {
    includeManifest,
    target,
  });
  const retentionCategory = classifyRetention({ summary, target });
  const report = {
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

  if (includeManifest) {
    report.manifest = {
      enabled: true,
      entries: summary.manifestEntries,
      categorySummary: summarizeManifestEntries(summary.manifestEntries),
    };
  }

  return report;
}

export async function summarizePath(absolutePath, rootDir, options = {}) {
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
      addManifestEntry(summary, rootDir, currentPath, stat, options);
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
    addManifestEntry(summary, rootDir, currentPath, stat, options);
  }

  summary.manifestEntries.sort((a, b) => a.path.localeCompare(b.path));

  return summary;
}

export function summarizeTotals(entries) {
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

export function summarizeManifestCategories(entries) {
  return summarizeManifestEntries(entries.flatMap((entry) => entry.manifest?.entries ?? []));
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
    manifestEntries: [],
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

function addManifestEntry(summary, rootDir, absolutePath, stat, options) {
  if (!options.includeManifest) {
    return;
  }

  summary.manifestEntries.push(buildManifestEntry(rootDir, absolutePath, stat, options.target));
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

function buildManifestEntry(rootDir, absolutePath, stat, target) {
  const retentionCategory = classifyManifestRetention({ stat, target });

  return {
    path: relative(rootDir, absolutePath) || ".",
    artifactKind: target.artifactKind,
    kind: stat.isSymbolicLink() ? MANIFEST_KIND_SYMLINK : MANIFEST_KIND_FILE,
    protectedEvidence: target.protectedEvidence === true,
    retentionCategory,
    suggestedAction: buildManifestSuggestedAction({ target, retentionCategory }),
    deletionAllowedByThisTool: false,
    compressionAllowedByThisTool: false,
    bytes: stat.size,
    humanSize: formatBytes(stat.size),
    mtime: stat.mtime.toISOString(),
    ageDays: ageDays(stat.mtime),
  };
}

function classifyManifestRetention({ stat, target }) {
  if (target.protectedEvidence) {
    return "protected_qa_evidence";
  }

  if (target.artifactKind === "generated_test_runner_residue") {
    return "generated_test_runner_residue";
  }

  const itemAge = ageDays(stat.mtime);

  if (itemAge <= RECENT_LOG_DAYS) {
    return "recent_raw_logs";
  }

  if (itemAge <= OLD_LOG_DAYS) {
    return "old_logs_archive_candidate";
  }

  return "very_old_logs_delete_candidate_for_future_approval";
}

function buildManifestSuggestedAction({ target, retentionCategory }) {
  if (target.protectedEvidence) {
    return "Protected QA evidence. Count only; do not delete, compress, or mark disposable.";
  }

  switch (retentionCategory) {
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

function summarizeManifestEntries(entries) {
  const categories = new Map();

  for (const entry of entries) {
    const current = categories.get(entry.retentionCategory) ?? {
      retentionCategory: entry.retentionCategory,
      files: 0,
      bytes: 0,
      humanSize: "0 B",
      deletionAllowedByThisTool: false,
      compressionAllowedByThisTool: false,
    };

    current.files += 1;
    current.bytes += entry.bytes;
    current.humanSize = formatBytes(current.bytes);
    categories.set(entry.retentionCategory, current);
  }

  return Array.from(categories.values()).sort((a, b) =>
    a.retentionCategory.localeCompare(b.retentionCategory),
  );
}
