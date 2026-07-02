import { readdir, readFile } from "node:fs/promises";
import { basename, extname, relative, resolve } from "node:path";

import {
  MAX_REFERENCE_HIT_SAMPLES,
  QA_ARTIFACT_TARGET,
  QA_COMPRESS_AFTER_DAYS,
  QA_DELETE_AFTER_DAYS,
  QA_FAILED_BLOCKED_TOKEN_RE,
  QA_FOLDER_ROOT,
  QA_MANUAL_KEEP_MARKER_RE,
  QA_REFERENCE_SCAN_ROOTS,
  QA_REFERENCE_SKIP_DIRS,
  QA_REFERENCE_TEXT_EXTENSIONS,
  QA_SENSITIVE_TOKEN_RE,
} from "./policy.mjs";
import { summarizePath } from "./target-report.mjs";
import { ageDays, formatBytes, safeLstat } from "./utils.mjs";

export async function buildQaFolderManifestReport(rootDir, options = {}) {
  const qaRootPath = resolve(rootDir, QA_FOLDER_ROOT);
  const qaRootStat = await safeLstat(qaRootPath);

  if (!qaRootStat?.isDirectory()) {
    return {
      enabled: true,
      mode: "dry_run",
      mutation: false,
      scope: "local_gitignored_qa_artifacts_only",
      root: QA_FOLDER_ROOT,
      exists: false,
      referenceScan: {
        status: "not_run",
        reason: "qa_artifacts_root_missing",
      },
      deletionAllowedByThisTool: false,
      compressionAllowedByThisTool: false,
      entries: [],
    };
  }

  const referenceCorpus = await buildQaReferenceCorpus(rootDir);
  const candidateFolders = await collectQaArtifactCandidateFolders(rootDir, qaRootPath);
  const entries = [];

  for (const candidateFolder of candidateFolders) {
    entries.push(await buildQaFolderManifestEntry(rootDir, candidateFolder, referenceCorpus));
  }

  return {
    enabled: true,
    mode: "dry_run",
    mutation: false,
    evidenceMutation: false,
    scope: "local_gitignored_qa_artifacts_only",
    trackedEvidenceRootsExcluded: ["docs/process/screenshots", "docs/tasks/backlog/assets"],
    root: QA_FOLDER_ROOT,
    exists: true,
    policy: {
      deleteAfterDays: QA_DELETE_AFTER_DAYS,
      compressAfterDays: QA_COMPRESS_AFTER_DAYS,
      deletion: options.applyQaDeleteAfterExpiryArchive
        ? "archive_quarantine_only_for_manifest_safe_delete_after_expiry"
        : "out_of_scope",
      compression: options.applyQaImageCompression
        ? "image_only_webp_q82_for_manifest_safe_compress_after_policy"
        : "out_of_scope",
      applyModeAvailable:
        options.applyQaDeleteAfterExpiryArchive || options.applyQaImageCompression,
    },
    referenceScan: {
      status: referenceCorpus.status,
      roots: QA_REFERENCE_SCAN_ROOTS,
      scannedFiles: referenceCorpus.files.length,
      skippedRoots: referenceCorpus.skippedRoots,
    },
    totals: summarizeQaFolderManifestEntries(entries),
    deletionAllowedByThisTool: false,
    compressionAllowedByThisTool: false,
    entries,
  };
}

export function isSafeQaDeleteAfterExpiryArchiveCandidate(entry) {
  const flags = entry.inferredFlags ?? {};

  return (
    entry.path.startsWith(`${QA_FOLDER_ROOT}/`) &&
    entry.candidateRetentionClass === "delete-after-expiry" &&
    entry.directReferenceHits === 0 &&
    flags.localQaArtifactsOnly === true &&
    flags.activePlanLinked === false &&
    flags.securityAuthAdminSensitive === false &&
    flags.failedOrBlocked === false &&
    flags.unknownOwnership === false &&
    flags.manuallyMarkedKeep === false
  );
}

async function collectQaArtifactCandidateFolders(rootDir, qaRootPath) {
  const candidates = [];
  await collectQaArtifactCandidateFolder(rootDir, qaRootPath, qaRootPath, candidates);
  return candidates.sort((a, b) => a.path.localeCompare(b.path));
}

async function collectQaArtifactCandidateFolder(rootDir, qaRootPath, absolutePath, candidates) {
  const entries = await readdir(absolutePath);
  let hasFilesInSubtree = false;
  let childCandidateCount = 0;

  for (const entry of entries) {
    const childPath = resolve(absolutePath, entry);
    const childStat = await safeLstat(childPath);

    if (!childStat) {
      continue;
    }

    if (childStat.isDirectory()) {
      const childResult = await collectQaArtifactCandidateFolder(
        rootDir,
        qaRootPath,
        childPath,
        candidates,
      );
      hasFilesInSubtree = hasFilesInSubtree || childResult.hasFilesInSubtree;
      childCandidateCount += childResult.candidateCount;
      continue;
    }

    if (childStat.isFile() || childStat.isSymbolicLink()) {
      hasFilesInSubtree = true;
    }
  }

  const isQaRoot = absolutePath === qaRootPath;
  const isLeafEvidenceFolder = hasFilesInSubtree && childCandidateCount === 0;

  if (!isQaRoot && isLeafEvidenceFolder) {
    candidates.push({
      absolutePath,
      path: relative(rootDir, absolutePath),
    });
    return {
      hasFilesInSubtree: true,
      candidateCount: 1,
    };
  }

  return {
    hasFilesInSubtree,
    candidateCount: childCandidateCount,
  };
}

async function buildQaFolderManifestEntry(rootDir, candidateFolder, referenceCorpus) {
  const summary = await summarizePath(candidateFolder.absolutePath, rootDir, {
    includeManifest: true,
    target: QA_ARTIFACT_TARGET,
  });
  const filePaths = summary.manifestEntries.map((entry) => entry.path);
  const referenceHits = findQaReferenceHits(candidateFolder.path, filePaths, referenceCorpus);
  const flags = buildQaFolderFlags(candidateFolder.path, summary, referenceHits);
  const retention = classifyQaFolderRetention(summary, referenceHits, flags);

  return {
    path: candidateFolder.path,
    files: summary.files,
    directories: summary.directories,
    symlinks: summary.symlinks,
    bytes: summary.bytes,
    humanSize: formatBytes(summary.bytes),
    newestContentMtime: summary.newestContentMtime?.toISOString() ?? null,
    newestContentAgeDays: summary.newestContentMtime ? ageDays(summary.newestContentMtime) : null,
    oldestContentMtime: summary.oldestContentMtime?.toISOString() ?? null,
    oldestContentAgeDays: summary.oldestContentMtime ? ageDays(summary.oldestContentMtime) : null,
    referenceScanStatus: referenceCorpus.status,
    directReferenceHits: referenceHits.length,
    referenceHitSamples: referenceHits.slice(0, MAX_REFERENCE_HIT_SAMPLES),
    inferredFlags: flags,
    candidateRetentionClass: retention.retentionClass,
    reason: retention.reason,
    suggestedAction: retention.suggestedAction,
    deletionAllowedByThisTool: false,
    compressionAllowedByThisTool: false,
  };
}

function buildQaFolderFlags(folderPath, summary, referenceHits) {
  const owner = inferQaFolderOwner(folderPath);

  return {
    localQaArtifactsOnly:
      folderPath === QA_FOLDER_ROOT || folderPath.startsWith(`${QA_FOLDER_ROOT}/`),
    activePlanLinked: referenceHits.some((hit) => hit.path.startsWith("docs/plans/active/")),
    directlyReferenced: referenceHits.length > 0,
    securityAuthAdminSensitive: QA_SENSITIVE_TOKEN_RE.test(folderPath),
    failedOrBlocked: QA_FAILED_BLOCKED_TOKEN_RE.test(folderPath),
    unknownOwnership: owner === "unknown",
    manuallyMarkedKeep: summary.manifestEntries.some((entry) =>
      QA_MANUAL_KEEP_MARKER_RE.test(basename(entry.path)),
    ),
    inferredOwner: owner,
  };
}

function inferQaFolderOwner(folderPath) {
  const normalized = folderPath.toLowerCase();

  if (/(?:^|[-_/])admin(?:$|[-_/])|backlog/.test(normalized)) {
    return "admin";
  }

  if (
    /hito[-_/]?ds|design[-_/]?system|modal|dropdown|calendar[-_/]?workout[-_/]?playground/.test(
      normalized,
    )
  ) {
    return "hito_ds";
  }

  if (/manual|workout[-_/]?authoring|copy|move|clear|delete|restore/.test(normalized)) {
    return "manual_workout_authoring";
  }

  if (
    /onboarding|first[-_/]?plan|plan[-_/]?creation|selected[-_/]?plan|preset|long[-_/]?horizon|review[-_/]?copy/.test(
      normalized,
    )
  ) {
    return "plan_creation";
  }

  if (/running[-_/]?coach|coach[-_/]?review|plan[-_/]?engine|scenario/.test(normalized)) {
    return "running_plan_engine";
  }

  if (/qa[-_/]?server|build|nitro|artifact|log/.test(normalized)) {
    return "devtools";
  }

  return "unknown";
}

function classifyQaFolderRetention(summary, referenceHits, flags) {
  const newestAge = summary.newestContentMtime ? ageDays(summary.newestContentMtime) : null;
  const referencedOutsideActivePlan =
    referenceHits.length > 0 &&
    !referenceHits.every((hit) => hit.path.startsWith("docs/plans/active/"));

  if (!flags.localQaArtifactsOnly) {
    return qaFolderRetention(
      "unknown/manual-review",
      "not_under_local_qa_artifacts_root",
      "Manual review required; this tool only classifies local gitignored qa-artifacts/ folders.",
    );
  }

  if (flags.manuallyMarkedKeep) {
    return qaFolderRetention(
      "keep-permanent",
      "manual_keep_marker_present",
      "Keep; the folder contains an explicit keep marker.",
    );
  }

  if (flags.activePlanLinked) {
    return qaFolderRetention(
      "keep-until-plan-archive",
      "direct_reference_from_active_plan",
      "Keep until the owning active plan or QA gate is archived.",
    );
  }

  if (referencedOutsideActivePlan) {
    return qaFolderRetention(
      "promote-to-docs-digest",
      "direct_reference_outside_active_plan",
      "Review before mutation; direct docs/source references may need tracked digest or permanent evidence.",
    );
  }

  if (flags.securityAuthAdminSensitive) {
    return qaFolderRetention(
      "unknown/manual-review",
      "security_auth_admin_sensitive_path",
      "Manual review required before any future local evidence mutation.",
    );
  }

  if (flags.failedOrBlocked) {
    return qaFolderRetention(
      "unknown/manual-review",
      "failed_or_blocked_evidence_path",
      "Manual review required because failed or blocked QA evidence can be diagnostically important.",
    );
  }

  if (flags.unknownOwnership) {
    return qaFolderRetention(
      "unknown/manual-review",
      "unknown_folder_ownership",
      "Manual review required because the folder owner could not be inferred safely.",
    );
  }

  if (newestAge === null) {
    return qaFolderRetention(
      "unknown/manual-review",
      "missing_content_mtime",
      "Manual review required because the folder has no file content timestamp.",
    );
  }

  if (newestAge >= QA_DELETE_AFTER_DAYS) {
    return qaFolderRetention(
      "delete-after-expiry",
      "unreferenced_safe_local_folder_past_delete_ttl",
      "Candidate for a future explicit apply-capable deletion slice; this dry-run does not delete.",
    );
  }

  if (newestAge >= QA_COMPRESS_AFTER_DAYS) {
    return qaFolderRetention(
      "compress-after-policy",
      "unreferenced_safe_local_folder_past_compression_ttl",
      "Candidate for a future explicit compression review slice; this dry-run does not compress.",
    );
  }

  return qaFolderRetention(
    "unknown/manual-review",
    "too_recent_for_local_retention_threshold",
    "Keep for now; the folder is younger than the local QA artifact compression threshold.",
  );
}

function qaFolderRetention(retentionClass, reason, suggestedAction) {
  return {
    retentionClass,
    reason,
    suggestedAction,
  };
}

function summarizeQaFolderManifestEntries(entries) {
  const classSummary = new Map();

  for (const entry of entries) {
    const current = classSummary.get(entry.candidateRetentionClass) ?? {
      candidateRetentionClass: entry.candidateRetentionClass,
      folders: 0,
      files: 0,
      bytes: 0,
      humanSize: "0 B",
      deletionAllowedByThisTool: false,
      compressionAllowedByThisTool: false,
    };

    current.folders += 1;
    current.files += entry.files;
    current.bytes += entry.bytes;
    current.humanSize = formatBytes(current.bytes);
    classSummary.set(entry.candidateRetentionClass, current);
  }

  const bytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);

  return {
    candidateFolders: entries.length,
    files: entries.reduce((sum, entry) => sum + entry.files, 0),
    bytes,
    humanSize: formatBytes(bytes),
    classSummary: Array.from(classSummary.values()).sort((a, b) =>
      a.candidateRetentionClass.localeCompare(b.candidateRetentionClass),
    ),
  };
}

async function buildQaReferenceCorpus(rootDir) {
  const files = [];
  const skippedRoots = [];

  for (const scanRoot of QA_REFERENCE_SCAN_ROOTS) {
    const absolutePath = resolve(rootDir, scanRoot);
    const stat = await safeLstat(absolutePath);

    if (!stat) {
      skippedRoots.push({
        path: scanRoot,
        reason: "missing",
      });
      continue;
    }

    await collectQaReferenceFiles(rootDir, absolutePath, stat, files);
  }

  const corpusFiles = [];

  for (const filePath of Array.from(new Set(files)).sort()) {
    const absolutePath = resolve(rootDir, filePath);
    const content = await readFile(absolutePath, "utf8");
    corpusFiles.push({
      path: filePath,
      lines: content.split(/\r?\n/),
    });
  }

  return {
    status: "completed",
    files: corpusFiles,
    skippedRoots,
  };
}

async function collectQaReferenceFiles(rootDir, absolutePath, stat, files) {
  const relativePath = relative(rootDir, absolutePath);

  if (stat.isDirectory()) {
    if (QA_REFERENCE_SKIP_DIRS.has(basename(absolutePath))) {
      return;
    }

    for (const entry of await readdir(absolutePath)) {
      const childPath = resolve(absolutePath, entry);
      const childStat = await safeLstat(childPath);

      if (childStat) {
        await collectQaReferenceFiles(rootDir, childPath, childStat, files);
      }
    }

    return;
  }

  if (stat.isFile() && isQaReferenceTextPath(relativePath)) {
    files.push(relativePath);
  }
}

function isQaReferenceTextPath(path) {
  if (path === "package.json" || path === "AGENTS.md") {
    return true;
  }

  return QA_REFERENCE_TEXT_EXTENSIONS.has(extname(path).toLowerCase());
}

function findQaReferenceHits(folderPath, filePaths, referenceCorpus) {
  if (referenceCorpus.status !== "completed") {
    return [];
  }

  const needles = [folderPath, `${folderPath}/`, ...filePaths];
  const hits = [];

  for (const file of referenceCorpus.files) {
    for (let lineIndex = 0; lineIndex < file.lines.length; lineIndex += 1) {
      const line = file.lines[lineIndex];
      const matchedNeedle = needles.find((needle) => needle && line.includes(needle));

      if (matchedNeedle) {
        hits.push({
          path: file.path,
          line: lineIndex + 1,
          matched: matchedNeedle,
        });
      }
    }
  }

  return hits;
}
