#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_LOG_DAYS = 7;
const OLD_LOG_DAYS = 30;
const MAX_SAMPLES = 8;
const MAX_REFERENCE_HIT_SAMPLES = 8;
const MANIFEST_KIND_FILE = "file";
const MANIFEST_KIND_SYMLINK = "symlink";
const E4_QA_EVIDENCE_BUCKET = "qa-artifacts/screenshots/2026-05-30/long-horizon-review-copy-fix-qa";
const E4_WEBP_QUALITY = 82;
const QA_FOLDER_ROOT = "qa-artifacts";
const LOCAL_ARTIFACT_ARCHIVE_ROOT = ".local-artifact-archive";
const QA_COMPRESSION_DEFAULT_CLASS = "compress-after-policy";
const QA_COMPRESSION_DEFAULT_OWNER = "manual_workout_authoring";
const QA_DELETE_AFTER_DAYS = 14;
const QA_COMPRESS_AFTER_DAYS = 7;
const QA_REFERENCE_SCAN_ROOTS = [
  "docs",
  "src",
  "scripts",
  "package.json",
  "AGENTS.md",
  "agents",
  "skills",
];
const QA_REFERENCE_TEXT_EXTENSIONS = new Set([
  ".css",
  ".cjs",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const QA_REFERENCE_SKIP_DIRS = new Set([
  ".git",
  ".output",
  "logs",
  "node_modules",
  "qa-artifacts",
  "test-results",
]);
const QA_MANUAL_KEEP_MARKER_RE = /^(?:\.keep|\.hito-keep|keep|keep\.md)$/i;
const QA_SENSITIVE_TOKEN_RE =
  /(?:^|[-_/])(admin|auth|login|security|credential|credentials|session|supabase|remote|production)(?:$|[-_/])/i;
const QA_FAILED_BLOCKED_TOKEN_RE =
  /(?:^|[-_/])(failed|failure|blocked|blocker|regression|broken)(?:$|[-_/])/i;
const QA_COMPRESSION_IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png"]);
const QA_COMPRESSION_GENERATED_VENDOR_PATH_RE =
  /(?:^|\/)(?:pw\/)?node_modules(?:\/|$)|(?:^|\/)playwright-core\/lib\/(?:server|tools)(?:\/|$)/;

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
  validateOptionCombinations(options);

  if (options.help) {
    console.log(buildHelpText());
    return;
  }

  const rootDir = resolve(process.cwd(), options.rootDir);
  const hasApplyMutation =
    options.applyQaDeleteAfterExpiryArchive || options.applyQaImageCompression;
  const hasSampleOutput = options.writeE4CompressionSamples || options.writeQaCompressionSamples;
  const reportMode = options.applyQaDeleteAfterExpiryArchive
    ? "apply_quarantine"
    : options.applyQaImageCompression
      ? "apply_qa_image_compression"
      : "dry_run";
  const mutation = options.applyQaDeleteAfterExpiryArchive
    ? "archive_quarantine"
    : options.applyQaImageCompression
      ? "qa_image_compression"
      : hasSampleOutput
        ? "sample_output_only"
        : false;
  const evidenceMutation = options.applyQaDeleteAfterExpiryArchive
    ? "archive_quarantine_local_qa_artifacts"
    : options.applyQaImageCompression
      ? "webp_q82_local_qa_image_compression"
      : false;
  const targets = options.includeQaArtifacts
    ? [...DEFAULT_TARGETS, QA_ARTIFACT_TARGET]
    : DEFAULT_TARGETS;
  const entries = [];

  for (const target of targets) {
    entries.push(await buildTargetReport(rootDir, target, options));
  }

  const topLevelEntries = entries.filter((entry) => !entry.includedInParent);
  const report = {
    ok: true,
    mode: reportMode,
    mutation,
    evidenceMutation,
    applyModeAvailable: hasApplyMutation,
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

  if (options.manifest) {
    report.manifest = {
      enabled: true,
      scope: options.includeQaArtifacts
        ? "top_level_targets_with_protected_qa_evidence"
        : "logs_and_test_results",
      mutation: false,
      deletionAllowedByThisTool: false,
      compressionAllowedByThisTool: false,
      totalEntries: topLevelEntries.reduce(
        (sum, entry) => sum + (entry.manifest?.entries.length ?? 0),
        0,
      ),
      categorySummary: summarizeManifestCategories(topLevelEntries),
    };
  }

  if (options.e4CompressionEstimate) {
    report.qaEvidenceCompression = await buildE4QaEvidenceCompressionReport(rootDir, options);
  }

  if (options.qaFolderManifest) {
    report.qaFolderManifest = await buildQaFolderManifestReport(rootDir, options);
  }

  if (options.applyQaDeleteAfterExpiryArchive) {
    report.qaFolderArchiveApply = await applyQaDeleteAfterExpiryArchive(
      rootDir,
      report.qaFolderManifest,
    );
  }

  if (options.qaCompressionEstimate) {
    report.qaCompressionEstimate = await buildQaManifestSelectedCompressionReport(
      rootDir,
      report.qaFolderManifest,
      options,
    );
  }

  if (options.qaCompressionApplySafetyDryRun) {
    report.qaCompressionApplySafetyDryRun = await buildQaCompressionApplySafetyDryRunReport(
      rootDir,
      report.qaFolderManifest,
      options,
    );
  }

  if (options.applyQaImageCompression) {
    report.qaImageCompressionApply = await applyQaImageCompression(
      rootDir,
      report.qaCompressionApplySafetyDryRun,
    );
  }

  console.log(JSON.stringify(report, null, 2));
}

async function buildQaFolderManifestReport(rootDir, options = {}) {
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

async function applyQaDeleteAfterExpiryArchive(rootDir, qaFolderManifest) {
  if (!qaFolderManifest?.entries) {
    throw new Error("QA folder manifest is required before archive apply.");
  }

  const deleteAfterExpiryEntries = qaFolderManifest.entries.filter(
    (entry) => entry.candidateRetentionClass === "delete-after-expiry",
  );
  const unsafeDeleteAfterExpiryEntries = deleteAfterExpiryEntries.filter(
    (entry) => !isSafeQaDeleteAfterExpiryArchiveCandidate(entry),
  );

  if (unsafeDeleteAfterExpiryEntries.length > 0) {
    throw new Error(
      `Refusing archive apply because ${unsafeDeleteAfterExpiryEntries.length} delete-after-expiry entries failed safety checks.`,
    );
  }

  if (deleteAfterExpiryEntries.length === 0) {
    throw new Error("Refusing archive apply because no delete-after-expiry folders are present.");
  }

  const archivePath = buildQaArchivePath(rootDir);
  const archiveRelativePath = relative(rootDir, archivePath);
  await mkdir(archivePath, { recursive: true });

  const preApplyBytes = deleteAfterExpiryEntries.reduce((sum, entry) => sum + entry.bytes, 0);
  const plannedManifest = {
    status: "planned",
    mode: "archive_quarantine",
    generatedAt: new Date().toISOString(),
    sourceRoot: QA_FOLDER_ROOT,
    archiveRoot: archiveRelativePath,
    selectedRetentionClass: "delete-after-expiry",
    selectedFolders: deleteAfterExpiryEntries.map((entry) => ({
      path: entry.path,
      files: entry.files,
      bytes: entry.bytes,
      humanSize: entry.humanSize,
      retentionClass: entry.candidateRetentionClass,
      reason: entry.reason,
      referenceScanStatus: entry.referenceScanStatus,
      directReferenceHits: entry.directReferenceHits,
      inferredFlags: entry.inferredFlags,
    })),
    selectedFolderCount: deleteAfterExpiryEntries.length,
    selectedFileCount: deleteAfterExpiryEntries.reduce((sum, entry) => sum + entry.files, 0),
    preApplyTotalBytes: preApplyBytes,
    preApplyTotalHumanSize: formatBytes(preApplyBytes),
    referenceScan: qaFolderManifest.referenceScan,
    exclusionRules: [
      "candidateRetentionClass must be exactly delete-after-expiry",
      "directReferenceHits must be zero",
      "activePlanLinked must be false",
      "securityAuthAdminSensitive must be false",
      "failedOrBlocked must be false",
      "unknownOwnership must be false",
      "manuallyMarkedKeep must be false",
      "localQaArtifactsOnly must be true",
      "tracked docs evidence roots are excluded",
    ],
    restoreInstructions:
      "To restore, move each archived folder back from archiveRoot to its original path under qa-artifacts/. Do not partially restore without reviewing this manifest.",
  };

  const plannedManifestPath = resolve(archivePath, "manifest.json");
  await writeFile(plannedManifestPath, `${JSON.stringify(plannedManifest, null, 2)}\n`);

  const movedFolders = [];

  for (const entry of deleteAfterExpiryEntries) {
    const sourcePath = resolve(rootDir, entry.path);
    const destinationPath = resolve(archivePath, entry.path);
    await mkdir(dirname(destinationPath), { recursive: true });
    await rename(sourcePath, destinationPath);
    movedFolders.push({
      path: entry.path,
      archivedPath: relative(rootDir, destinationPath),
      files: entry.files,
      bytes: entry.bytes,
      humanSize: entry.humanSize,
    });
  }

  const result = {
    status: "complete",
    mode: "archive_quarantine",
    completedAt: new Date().toISOString(),
    archiveRoot: archiveRelativePath,
    manifestPath: relative(rootDir, plannedManifestPath),
    selectedRetentionClass: "delete-after-expiry",
    movedFolderCount: movedFolders.length,
    movedFileCount: movedFolders.reduce((sum, entry) => sum + entry.files, 0),
    movedBytes: movedFolders.reduce((sum, entry) => sum + entry.bytes, 0),
    movedHumanSize: formatBytes(movedFolders.reduce((sum, entry) => sum + entry.bytes, 0)),
    permanentDeletion: false,
    archiveQuarantine: true,
    trackedEvidenceRootsTouched: false,
    movedFolders,
  };

  const resultPath = resolve(archivePath, "apply-result.json");
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);

  return {
    ...result,
    resultPath: relative(rootDir, resultPath),
  };
}

function isSafeQaDeleteAfterExpiryArchiveCandidate(entry) {
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

function buildQaArchivePath(rootDir) {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return resolve(
    rootDir,
    LOCAL_ARTIFACT_ARCHIVE_ROOT,
    `qa-artifacts-delete-after-expiry-${timestamp}`,
  );
}

async function buildE4QaEvidenceCompressionReport(rootDir, options) {
  const bucketPath = resolve(rootDir, E4_QA_EVIDENCE_BUCKET);
  const bucketStat = await safeLstat(bucketPath);

  if (!bucketStat?.isDirectory()) {
    throw new Error(`E4 QA evidence bucket is missing: ${E4_QA_EVIDENCE_BUCKET}`);
  }

  const sampleOutputDir = options.writeE4CompressionSamples
    ? resolveRequiredSampleOutputDir(rootDir, bucketPath, options)
    : null;
  const sharp = await loadSharp();
  const pngFiles = (await readdir(bucketPath))
    .filter((entry) => extname(entry).toLowerCase() === ".png")
    .sort();
  const files = [];

  for (const fileName of pngFiles) {
    const filePath = resolve(bucketPath, fileName);
    const beforeStat = await lstat(filePath);

    if (!beforeStat.isFile()) {
      continue;
    }

    const originalMetadata = await sharp(filePath).metadata();
    const webp = await sharp(filePath)
      .webp({ quality: E4_WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
    const outputInfo = webp.info;
    const dimensionsPreserved =
      originalMetadata.width === outputInfo.width && originalMetadata.height === outputInfo.height;
    const webpFileName = `${basename(fileName, extname(fileName))}.webp`;
    let samplePath = null;

    if (sampleOutputDir) {
      await mkdir(sampleOutputDir, { recursive: true });
      const sampleAbsolutePath = resolve(sampleOutputDir, webpFileName);
      await writeFile(sampleAbsolutePath, webp.data);
      samplePath = formatReportPath(rootDir, sampleAbsolutePath);
    }

    const afterStat = await lstat(filePath);
    const originalUnchanged =
      beforeStat.size === afterStat.size &&
      beforeStat.mtimeMs === afterStat.mtimeMs &&
      beforeStat.ino === afterStat.ino;

    files.push({
      path: relative(rootDir, filePath),
      samplePath,
      originalBytes: beforeStat.size,
      originalHumanSize: formatBytes(beforeStat.size),
      webpBytes: webp.data.length,
      webpHumanSize: formatBytes(webp.data.length),
      savedBytes: beforeStat.size - webp.data.length,
      percentSavings: percentSavings(beforeStat.size, webp.data.length),
      originalDimensions: {
        width: originalMetadata.width ?? null,
        height: originalMetadata.height ?? null,
      },
      webpDimensions: {
        width: outputInfo.width ?? null,
        height: outputInfo.height ?? null,
      },
      dimensionsPreserved,
      quality: E4_WEBP_QUALITY,
      visualAcceptabilityReviewRequired: true,
      originalUnchanged,
      deletionAllowedByThisTool: false,
      compressionApplyAllowedByThisTool: false,
    });
  }

  const originalBytes = files.reduce((sum, file) => sum + file.originalBytes, 0);
  const webpBytes = files.reduce((sum, file) => sum + file.webpBytes, 0);

  return {
    enabled: true,
    mode: "dry_run",
    mutation: options.writeE4CompressionSamples ? "sample_output_only" : false,
    applyModeAvailable: false,
    bucket: E4_QA_EVIDENCE_BUCKET,
    bucketScope: "e4_long_horizon_review_copy_fix_qa_only",
    originalEvidenceMutation: false,
    sampleOutputCreated: options.writeE4CompressionSamples,
    sampleOutputDir: sampleOutputDir ? formatReportPath(rootDir, sampleOutputDir) : null,
    sampleOutputIsDisposableNonEvidence: options.writeE4CompressionSamples,
    codec: "webp",
    quality: E4_WEBP_QUALITY,
    files: files.length,
    originalBytes,
    originalHumanSize: formatBytes(originalBytes),
    estimatedWebpBytes: webpBytes,
    estimatedWebpHumanSize: formatBytes(webpBytes),
    estimatedSavedBytes: originalBytes - webpBytes,
    estimatedPercentSavings: percentSavings(originalBytes, webpBytes),
    allDimensionsPreserved: files.every((file) => file.dimensionsPreserved),
    allOriginalsUnchanged: files.every((file) => file.originalUnchanged),
    deletionAllowedByThisTool: false,
    compressionApplyAllowedByThisTool: false,
    visualAcceptabilityReviewRequired: true,
    stopCondition:
      files.every((file) => file.dimensionsPreserved) &&
      files.every((file) => file.originalUnchanged)
        ? null
        : "manual_review_required_before_any_future_apply_slice",
    entries: files,
  };
}

function selectQaCompressionFolders(qaFolderManifest, options, modeLabel) {
  if (!qaFolderManifest?.entries) {
    throw new Error("QA folder manifest is required before compression dry-run.");
  }

  const retentionClass = options.qaCompressionClass ?? QA_COMPRESSION_DEFAULT_CLASS;
  const owner = options.qaCompressionOwner ?? QA_COMPRESSION_DEFAULT_OWNER;

  if (retentionClass !== QA_COMPRESSION_DEFAULT_CLASS) {
    throw new Error(`${modeLabel} only supports ${QA_COMPRESSION_DEFAULT_CLASS} in this slice.`);
  }

  const selectedFolders = qaFolderManifest.entries.filter(
    (entry) =>
      entry.candidateRetentionClass === retentionClass &&
      entry.inferredFlags?.inferredOwner === owner,
  );
  const unsafeFolders = selectedFolders.filter(
    (entry) => !isSafeQaCompressionEstimateFolder(entry),
  );
  const eligibleFolders = selectedFolders.filter((entry) =>
    isSafeQaCompressionEstimateFolder(entry),
  );

  if (eligibleFolders.length === 0) {
    throw new Error(
      `No manifest-selected QA folders found for class=${retentionClass} owner=${owner}.`,
    );
  }

  return {
    retentionClass,
    owner,
    selectedFolders,
    unsafeFolders,
    eligibleFolders,
  };
}

async function buildQaManifestSelectedCompressionReport(rootDir, qaFolderManifest, options) {
  const { retentionClass, owner, unsafeFolders, eligibleFolders } = selectQaCompressionFolders(
    qaFolderManifest,
    options,
    "QA compression estimate",
  );

  const sampleOutputDir = options.writeQaCompressionSamples
    ? resolveRequiredQaCompressionSampleOutputDir(rootDir, options)
    : null;
  const sharp = await loadSharp();
  const folderReports = [];

  for (const folder of eligibleFolders) {
    folderReports.push(
      await buildQaCompressionFolderReport(rootDir, folder, sharp, sampleOutputDir),
    );
  }

  const imageEntries = folderReports.flatMap((folder) => folder.imageEntries);
  const nonImageEntries = folderReports.flatMap((folder) => folder.nonImageEntries);
  const originalImageBytes = imageEntries.reduce((sum, entry) => sum + entry.originalBytes, 0);
  const estimatedWebpBytes = imageEntries.reduce((sum, entry) => sum + entry.webpBytes, 0);
  const selectedBytes = eligibleFolders.reduce((sum, entry) => sum + entry.bytes, 0);

  return {
    enabled: true,
    mode: "dry_run",
    mutation: options.writeQaCompressionSamples ? "sample_output_only" : false,
    evidenceMutation: false,
    applyModeAvailable: false,
    selection: {
      candidateRetentionClass: retentionClass,
      inferredOwner: owner,
      selectedFolders: eligibleFolders.length,
      excludedUnsafeFolders: unsafeFolders.map((entry) => ({
        path: entry.path,
        directReferenceHits: entry.directReferenceHits,
        inferredFlags: entry.inferredFlags,
        reason: "excluded_by_compression_estimate_safety_filter",
      })),
    },
    policy: {
      codec: "webp",
      quality: E4_WEBP_QUALITY,
      compressionApplyAllowedByThisTool: false,
      deletionAllowedByThisTool: false,
      sampleOutputAllowedOnlyOutsideEvidenceRoots: true,
    },
    sampleOutputCreated: options.writeQaCompressionSamples,
    sampleOutputDir: sampleOutputDir ? formatReportPath(rootDir, sampleOutputDir) : null,
    sampleOutputIsDisposableNonEvidence: options.writeQaCompressionSamples,
    selectedBytes,
    selectedHumanSize: formatBytes(selectedBytes),
    imageFiles: imageEntries.length,
    imageOriginalBytes: originalImageBytes,
    imageOriginalHumanSize: formatBytes(originalImageBytes),
    estimatedWebpBytes,
    estimatedWebpHumanSize: formatBytes(estimatedWebpBytes),
    estimatedSavedBytes: originalImageBytes - estimatedWebpBytes,
    estimatedPercentSavings: percentSavings(originalImageBytes, estimatedWebpBytes),
    nonImageFiles: nonImageEntries.length,
    nonImageBytes: nonImageEntries.reduce((sum, entry) => sum + entry.bytes, 0),
    nonImageHumanSize: formatBytes(nonImageEntries.reduce((sum, entry) => sum + entry.bytes, 0)),
    nonImageSummary: summarizeQaCompressionNonImages(nonImageEntries),
    allDimensionsPreserved: imageEntries.every((entry) => entry.dimensionsPreserved),
    allOriginalsUnchanged: imageEntries.every((entry) => entry.originalUnchanged),
    visualAcceptabilityReviewRequired: imageEntries.length > 0,
    folders: folderReports,
  };
}

async function buildQaCompressionApplySafetyDryRunReport(rootDir, qaFolderManifest, options) {
  const { retentionClass, owner, selectedFolders, unsafeFolders, eligibleFolders } =
    selectQaCompressionFolders(qaFolderManifest, options, "QA compression apply-safety dry-run");
  const generatedAt = new Date();
  const rollbackRoot = buildQaImageCompressionRollbackRoot(rootDir, owner, generatedAt);
  const sharp = await loadSharp();
  const folderReports = [];

  for (const folder of eligibleFolders) {
    folderReports.push(
      await buildQaCompressionApplySafetyFolderReport(rootDir, folder, sharp, rollbackRoot),
    );
  }

  const selectedImageFiles = folderReports.flatMap((folder) => folder.selectedImageFiles);
  const nonImageEntries = folderReports.flatMap((folder) => folder.nonImageEntries);
  const selectedImageFolders = folderReports.filter(
    (folder) => folder.selectedImageFiles.length > 0,
  );

  if (selectedImageFiles.length === 0) {
    throw new Error("Refusing apply-safety dry-run because no image files were selected.");
  }

  if (!selectedImageFiles.every((entry) => entry.dryRunProof.originalUnchanged)) {
    throw new Error("Refusing apply-safety dry-run because at least one source image changed.");
  }

  const totalOriginalBytes = selectedImageFiles.reduce(
    (sum, entry) => sum + entry.original.size,
    0,
  );
  const estimatedPostCompressionBytes = selectedImageFiles.reduce(
    (sum, entry) => sum + entry.estimatedWebp.size,
    0,
  );
  const rollbackCopyPlan = selectedImageFiles.map((entry) => ({
    sourcePath: entry.original.path,
    destinationPath: entry.rollbackCopy.destinationPath,
    size: entry.original.size,
    sha256: entry.original.sha256,
    mtime: entry.original.mtime,
    requiredBeforeFutureApply: true,
  }));

  return {
    enabled: true,
    mode: "image_compression_apply_safety_dry_run",
    mutation: false,
    evidenceMutation: false,
    applyModeAvailable: false,
    scope: "local_gitignored_qa_artifacts_image_files_only",
    generatedAt: generatedAt.toISOString(),
    selection: {
      candidateRetentionClass: retentionClass,
      inferredOwner: owner,
      sourceCandidateFolders: selectedFolders.length,
      manifestSafeCandidateFolders: eligibleFolders.length,
      selectedImageFolders: selectedImageFolders.length,
      selectedImageFiles: selectedImageFiles.length,
      excludedUnsafeFolders: unsafeFolders.map((entry) => ({
        path: entry.path,
        directReferenceHits: entry.directReferenceHits,
        inferredFlags: entry.inferredFlags,
        reason: "excluded_by_compression_apply_safety_filter",
      })),
    },
    selectedFolders: selectedImageFolders.map((folder) => ({
      path: folder.path,
      imageFiles: folder.selectedImageFiles.length,
      originalBytes: folder.originalBytes,
      originalHumanSize: formatBytes(folder.originalBytes),
      estimatedPostCompressionBytes: folder.estimatedPostCompressionBytes,
      estimatedPostCompressionHumanSize: formatBytes(folder.estimatedPostCompressionBytes),
      estimatedSavedBytes: folder.originalBytes - folder.estimatedPostCompressionBytes,
      estimatedPercentSavings: percentSavings(
        folder.originalBytes,
        folder.estimatedPostCompressionBytes,
      ),
    })),
    selectedImageFiles,
    excludedNonImageGeneratedResidue: buildQaCompressionApplySafetyExclusion(
      nonImageEntries,
      eligibleFolders,
      selectedImageFolders,
    ),
    rollbackCopyPlan: {
      requiredBeforeFutureApply: true,
      mutation: false,
      evidenceMutation: false,
      root: formatReportPath(rootDir, rollbackRoot),
      outsideQaArtifacts: !isSameOrNestedPath(rollbackRoot, resolve(rootDir, QA_FOLDER_ROOT)),
      insideLocalArtifactArchive: isSameOrNestedPath(
        rollbackRoot,
        resolve(rootDir, LOCAL_ARTIFACT_ARCHIVE_ROOT),
      ),
      copies: rollbackCopyPlan,
    },
    restoreInstructions: [
      "No restore is needed for this dry-run because no qa-artifacts/ evidence is modified.",
      "Before any future apply, copy every original image to rollbackCopyPlan.root using the listed destinationPath, size, mtime, and sha256.",
      "To restore after a future apply, copy each rollback destination back to original.path, verify sha256 equals original.sha256, then remove the generated WebP path only after the original checksum passes.",
      "Re-run this dry-run and a qa-artifacts/ count/size check after restore before deleting rollback copies.",
    ],
    totals: {
      originalBytes: totalOriginalBytes,
      originalHumanSize: formatBytes(totalOriginalBytes),
      estimatedPostCompressionBytes,
      estimatedPostCompressionHumanSize: formatBytes(estimatedPostCompressionBytes),
      estimatedSavedBytes: totalOriginalBytes - estimatedPostCompressionBytes,
      estimatedPercentSavings: percentSavings(totalOriginalBytes, estimatedPostCompressionBytes),
    },
    safetyProof: {
      mutation: false,
      evidenceMutation: false,
      writesSamples: false,
      writesRollbackCopies: false,
      writesWebpOutputs: false,
      deletesOrMovesEvidence: false,
      selectedFilesArePngOnly: selectedImageFiles.every((entry) =>
        isQaCompressionPngPath(entry.original.path),
      ),
      selectedFilesAreImagesOnly: selectedImageFiles.every((entry) =>
        isQaCompressionImagePath(entry.original.path),
      ),
      selectedFilesInsideQaArtifacts: selectedImageFiles.every((entry) =>
        isQaArtifactsPath(entry.original.path),
      ),
      selectedFilesExcludeDisallowedRoots: selectedImageFiles.every((entry) =>
        isQaImageCompressionAllowedActivePath(entry.original.path),
      ),
      selectedFilesExcludeGeneratedVendorResidue: selectedImageFiles.every(
        (entry) => !isQaCompressionGeneratedVendorPath(entry.original.path),
      ),
      nonImageGeneratedResidueExcluded: true,
      generatedVendorImageResidueExcluded: true,
      allDimensionsPreserved: selectedImageFiles.every(
        (entry) => entry.estimatedWebp.dimensionsPreserved,
      ),
      allOriginalsUnchanged: selectedImageFiles.every(
        (entry) => entry.dryRunProof.originalUnchanged,
      ),
    },
  };
}

async function applyQaImageCompression(rootDir, safetyReport) {
  validateQaImageCompressionSafetyReport(rootDir, safetyReport);

  const selectedImageFiles = safetyReport.selectedImageFiles;
  const rollbackRoot = resolve(rootDir, safetyReport.rollbackCopyPlan.root);
  const rollbackRelativeRoot = formatReportPath(rootDir, rollbackRoot);
  const generatedAt = new Date();
  const manifestPath = resolve(rollbackRoot, "manifest.json");
  const resultPath = resolve(rollbackRoot, "apply-result.json");
  const sharp = await loadSharp();
  const preparedFiles = [];

  await mkdir(rollbackRoot, { recursive: true });

  for (const entry of selectedImageFiles) {
    preparedFiles.push(await prepareQaImageCompressionFile(rootDir, entry, sharp));
  }

  const plannedManifest = buildQaImageCompressionApplyManifest({
    generatedAt,
    rootDir,
    rollbackRelativeRoot,
    manifestPath,
    resultPath,
    safetyReport,
    preparedFiles,
  });

  await writeFile(manifestPath, `${JSON.stringify(plannedManifest, null, 2)}\n`);

  const rollbackCopies = [];

  for (const file of preparedFiles) {
    await mkdir(dirname(file.rollbackPath), { recursive: true });
    await copyFile(file.sourcePath, file.rollbackPath);
    await chmod(file.rollbackPath, file.beforeStat.mode);
    await utimes(file.rollbackPath, file.beforeStat.atime, file.beforeStat.mtime);

    const rollbackBytes = await readFile(file.rollbackPath);
    const rollbackStat = await lstat(file.rollbackPath);
    const rollbackHash = sha256(rollbackBytes);

    if (
      rollbackHash !== file.entry.original.sha256 ||
      rollbackStat.size !== file.entry.original.size
    ) {
      throw new Error(`Rollback verification failed for ${file.entry.original.path}.`);
    }

    rollbackCopies.push({
      originalPath: file.entry.original.path,
      rollbackPath: file.entry.rollbackCopy.destinationPath,
      size: rollbackStat.size,
      sha256: rollbackHash,
      mtime: rollbackStat.mtime.toISOString(),
      mtimeMs: rollbackStat.mtimeMs,
      verifiedBeforeEvidenceMutation: true,
    });
  }

  const appliedFiles = [];

  for (const file of preparedFiles) {
    await mkdir(dirname(file.outputPath), { recursive: true });
    await writeFile(file.outputPath, file.webpBuffer);

    const outputBytes = await readFile(file.outputPath);
    const outputStat = await lstat(file.outputPath);
    const outputHash = sha256(outputBytes);

    if (outputHash !== file.entry.estimatedWebp.sha256) {
      throw new Error(`WebP output verification failed for ${file.entry.estimatedWebp.path}.`);
    }

    await unlink(file.sourcePath);

    const sourceAfter = await safeLstat(file.sourcePath);
    const outputAfter = await lstat(file.outputPath);

    appliedFiles.push({
      original: {
        path: file.entry.original.path,
        size: file.entry.original.size,
        sha256: file.entry.original.sha256,
        mtime: file.entry.original.mtime,
        mtimeMs: file.entry.original.mtimeMs,
        dimensions: file.entry.original.dimensions,
        activePathRemoved: sourceAfter === null,
      },
      rollback: rollbackCopies.find((copy) => copy.originalPath === file.entry.original.path),
      output: {
        path: file.entry.estimatedWebp.path,
        size: outputStat.size,
        sha256: outputHash,
        mtime: outputAfter.mtime.toISOString(),
        mtimeMs: outputAfter.mtimeMs,
        dimensions: file.entry.estimatedWebp.dimensions,
        quality: E4_WEBP_QUALITY,
        verified: outputStat.size === file.entry.estimatedWebp.size,
      },
      savedBytes: file.entry.savedBytes,
      percentSavings: file.entry.percentSavings,
    });
  }

  const result = buildQaImageCompressionApplyResult({
    completedAt: new Date(),
    rootDir,
    rollbackRelativeRoot,
    manifestPath,
    resultPath,
    safetyReport,
    appliedFiles,
  });

  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);

  return {
    ...result,
    resultPath: relative(rootDir, resultPath),
  };
}

function validateQaImageCompressionSafetyReport(rootDir, safetyReport) {
  if (!safetyReport?.selectedImageFiles?.length) {
    throw new Error("Refusing QA image compression apply because no safety dry-run images exist.");
  }

  const rollbackRoot = resolve(rootDir, safetyReport.rollbackCopyPlan?.root ?? "");
  const qaRoot = resolve(rootDir, QA_FOLDER_ROOT);
  const archiveRoot = resolve(rootDir, LOCAL_ARTIFACT_ARCHIVE_ROOT);
  const proof = safetyReport.safetyProof ?? {};
  const requiredProof = [
    ["mutation", proof.mutation === false],
    ["evidenceMutation", proof.evidenceMutation === false],
    ["writesSamples", proof.writesSamples === false],
    ["writesRollbackCopies", proof.writesRollbackCopies === false],
    ["writesWebpOutputs", proof.writesWebpOutputs === false],
    ["deletesOrMovesEvidence", proof.deletesOrMovesEvidence === false],
    ["selectedFilesArePngOnly", proof.selectedFilesArePngOnly === true],
    ["selectedFilesAreImagesOnly", proof.selectedFilesAreImagesOnly === true],
    ["selectedFilesInsideQaArtifacts", proof.selectedFilesInsideQaArtifacts === true],
    ["selectedFilesExcludeDisallowedRoots", proof.selectedFilesExcludeDisallowedRoots === true],
    [
      "selectedFilesExcludeGeneratedVendorResidue",
      proof.selectedFilesExcludeGeneratedVendorResidue === true,
    ],
    ["nonImageGeneratedResidueExcluded", proof.nonImageGeneratedResidueExcluded === true],
    ["generatedVendorImageResidueExcluded", proof.generatedVendorImageResidueExcluded === true],
    ["allDimensionsPreserved", proof.allDimensionsPreserved === true],
    ["allOriginalsUnchanged", proof.allOriginalsUnchanged === true],
  ];
  const failedProof = requiredProof.filter(([, passed]) => !passed).map(([name]) => name);

  if (failedProof.length > 0) {
    throw new Error(
      `Refusing QA image compression apply because safety proof failed: ${failedProof.join(", ")}.`,
    );
  }

  if (
    safetyReport.rollbackCopyPlan.outsideQaArtifacts !== true ||
    safetyReport.rollbackCopyPlan.insideLocalArtifactArchive !== true ||
    isSameOrNestedPath(rollbackRoot, qaRoot) ||
    !isSameOrNestedPath(rollbackRoot, archiveRoot)
  ) {
    throw new Error(
      "Refusing QA image compression apply because rollback root is not the gitignored local artifact archive outside qa-artifacts/.",
    );
  }

  for (const entry of safetyReport.selectedImageFiles) {
    assertQaImageCompressionOriginalPathAllowed(entry.original.path);
    assertQaImageCompressionOutputPathAllowed(entry.estimatedWebp.path);

    if (entry.rollbackCopy.outsideQaArtifacts !== true) {
      throw new Error(
        `Refusing QA image compression apply because rollback path is inside qa-artifacts/: ${entry.rollbackCopy.destinationPath}`,
      );
    }
  }
}

async function prepareQaImageCompressionFile(rootDir, entry, sharp) {
  const sourcePath = resolve(rootDir, entry.original.path);
  const outputPath = resolve(rootDir, entry.estimatedWebp.path);
  const rollbackPath = resolve(rootDir, entry.rollbackCopy.destinationPath);
  const existingOutput = await safeLstat(outputPath);

  if (existingOutput) {
    throw new Error(
      `Refusing QA image compression apply because output already exists: ${entry.estimatedWebp.path}`,
    );
  }

  const beforeStat = await lstat(sourcePath);
  const originalBytes = await readFile(sourcePath);
  const afterReadStat = await lstat(sourcePath);
  const originalHash = sha256(originalBytes);

  if (
    beforeStat.size !== afterReadStat.size ||
    beforeStat.mtimeMs !== afterReadStat.mtimeMs ||
    beforeStat.ino !== afterReadStat.ino
  ) {
    throw new Error(
      `Refusing QA image compression apply because source changed while reading: ${entry.original.path}`,
    );
  }

  if (
    beforeStat.size !== entry.original.size ||
    beforeStat.mtimeMs !== entry.original.mtimeMs ||
    originalHash !== entry.original.sha256
  ) {
    throw new Error(
      `Refusing QA image compression apply because source no longer matches dry-run proof: ${entry.original.path}`,
    );
  }

  const originalMetadata = await sharp(sourcePath).metadata();

  if (
    originalMetadata.width !== entry.original.dimensions.width ||
    originalMetadata.height !== entry.original.dimensions.height
  ) {
    throw new Error(
      `Refusing QA image compression apply because source dimensions changed: ${entry.original.path}`,
    );
  }

  const webp = await sharp(sourcePath)
    .webp({ quality: E4_WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });
  const webpHash = sha256(webp.data);

  if (
    webpHash !== entry.estimatedWebp.sha256 ||
    webp.data.length !== entry.estimatedWebp.size ||
    webp.info.width !== entry.estimatedWebp.dimensions.width ||
    webp.info.height !== entry.estimatedWebp.dimensions.height
  ) {
    throw new Error(
      `Refusing QA image compression apply because regenerated WebP differs from dry-run proof: ${entry.original.path}`,
    );
  }

  return {
    entry,
    sourcePath,
    outputPath,
    rollbackPath,
    beforeStat,
    webpBuffer: webp.data,
  };
}

function buildQaImageCompressionApplyManifest({
  generatedAt,
  rootDir,
  rollbackRelativeRoot,
  manifestPath,
  resultPath,
  safetyReport,
  preparedFiles,
}) {
  return {
    status: "planned",
    mode: "qa_image_webp_q82_compression",
    generatedAt: generatedAt.toISOString(),
    sourceRoot: QA_FOLDER_ROOT,
    rollbackRoot: rollbackRelativeRoot,
    manifestPath: relative(rootDir, manifestPath),
    resultPath: relative(rootDir, resultPath),
    selectedRetentionClass: safetyReport.selection.candidateRetentionClass,
    inferredOwner: safetyReport.selection.inferredOwner,
    codec: "webp",
    quality: E4_WEBP_QUALITY,
    activeEvidenceOperation: "write_webp_sibling_then_remove_original_png_after_verification",
    rollbackCopiesWrittenBeforeEvidenceMutation: true,
    generatedVendorResidueMutation: false,
    trackedEvidenceRootsTouched: false,
    excludedNonImageGeneratedResidue: safetyReport.excludedNonImageGeneratedResidue,
    safetyProof: safetyReport.safetyProof,
    totals: {
      selectedImageFiles: preparedFiles.length,
      selectedImageFolders: safetyReport.selection.selectedImageFolders,
      originalBytes: safetyReport.totals.originalBytes,
      plannedWebpBytes: safetyReport.totals.estimatedPostCompressionBytes,
      plannedSavedBytes: safetyReport.totals.estimatedSavedBytes,
      plannedPercentSavings: safetyReport.totals.estimatedPercentSavings,
    },
    files: preparedFiles.map((file) => ({
      original: {
        ...file.entry.original,
        mode: file.beforeStat.mode,
      },
      rollback: {
        path: file.entry.rollbackCopy.destinationPath,
        size: file.entry.original.size,
        sha256: file.entry.original.sha256,
        mtime: file.entry.original.mtime,
        mtimeMs: file.entry.original.mtimeMs,
        copyBeforeEvidenceMutation: true,
      },
      output: file.entry.estimatedWebp,
      savedBytes: file.entry.savedBytes,
      percentSavings: file.entry.percentSavings,
    })),
    restoreInstructions: buildQaImageCompressionRestoreInstructions(),
  };
}

function buildQaImageCompressionApplyResult({
  completedAt,
  rootDir,
  rollbackRelativeRoot,
  manifestPath,
  resultPath,
  safetyReport,
  appliedFiles,
}) {
  const originalBytes = appliedFiles.reduce((sum, file) => sum + file.original.size, 0);
  const webpBytes = appliedFiles.reduce((sum, file) => sum + file.output.size, 0);
  const activeOriginalsRemoved = appliedFiles.filter(
    (file) => file.original.activePathRemoved,
  ).length;
  const rollbackCopiesVerified = appliedFiles.filter(
    (file) => file.rollback?.verifiedBeforeEvidenceMutation === true,
  ).length;
  const outputsVerified = appliedFiles.filter((file) => file.output.verified === true).length;

  return {
    status: "complete",
    mode: "qa_image_webp_q82_compression",
    completedAt: completedAt.toISOString(),
    rollbackRoot: rollbackRelativeRoot,
    manifestPath: relative(rootDir, manifestPath),
    resultPath: relative(rootDir, resultPath),
    selectedRetentionClass: safetyReport.selection.candidateRetentionClass,
    inferredOwner: safetyReport.selection.inferredOwner,
    codec: "webp",
    quality: E4_WEBP_QUALITY,
    selectedImageFiles: appliedFiles.length,
    activeOriginalsRemoved,
    rollbackCopiesVerified,
    outputsVerified,
    originalBytes,
    webpBytes,
    savedBytes: originalBytes - webpBytes,
    percentSavings: percentSavings(originalBytes, webpBytes),
    generatedVendorResidueMutation: false,
    trackedEvidenceRootsTouched: false,
    logsTouched: false,
    testResultsTouched: false,
    permanentDeletion: false,
    localEvidenceCompressed: true,
    rollbackArchiveRetained: true,
    excludedNonImageGeneratedResidue: safetyReport.excludedNonImageGeneratedResidue,
    safetyProof: {
      rollbackCopiesWrittenBeforeEvidenceMutation: rollbackCopiesVerified === appliedFiles.length,
      allOutputsVerified: outputsVerified === appliedFiles.length,
      allOriginalActivePngsRemoved: activeOriginalsRemoved === appliedFiles.length,
      allDimensionsPreserved: appliedFiles.every(
        (file) =>
          file.original.dimensions.width === file.output.dimensions.width &&
          file.original.dimensions.height === file.output.dimensions.height,
      ),
      selectedFilesExcludeGeneratedVendorResidue: true,
      generatedVendorResidueMutation: false,
    },
    files: appliedFiles,
    restoreInstructions: buildQaImageCompressionRestoreInstructions(),
  };
}

function buildQaImageCompressionRestoreInstructions() {
  return [
    "To restore one file, copy rollback.path back to original.path, then verify sha256 equals original.sha256.",
    "After the original PNG checksum passes, remove the matching output.path WebP if reverting the compression result.",
    "To restore the full batch, repeat this for every file in apply-result.json and then rerun the QA compression dry-run/count checks.",
    "Do not delete rollbackRoot until the compressed evidence state is accepted and no restore window is needed.",
  ];
}

async function buildQaCompressionFolderReport(rootDir, folder, sharp, sampleOutputDir) {
  const folderPath = resolve(rootDir, folder.path);
  const summary = await summarizePath(folderPath, rootDir, {
    includeManifest: true,
    target: QA_ARTIFACT_TARGET,
  });
  const imageEntries = [];
  const nonImageEntries = [];

  for (const manifestEntry of summary.manifestEntries) {
    if (manifestEntry.kind !== MANIFEST_KIND_FILE) {
      nonImageEntries.push({
        path: manifestEntry.path,
        bytes: manifestEntry.bytes,
        humanSize: manifestEntry.humanSize,
        reason: "non_file_manifest_entry",
      });
      continue;
    }

    if (isQaCompressionGeneratedVendorPath(manifestEntry.path)) {
      nonImageEntries.push({
        path: manifestEntry.path,
        bytes: manifestEntry.bytes,
        humanSize: manifestEntry.humanSize,
        extension: extname(manifestEntry.path).toLowerCase() || "(none)",
        reason: isQaCompressionImagePath(manifestEntry.path)
          ? "generated_vendor_image_not_estimated"
          : "generated_vendor_file_not_estimated",
      });
      continue;
    }

    if (!isQaCompressionImagePath(manifestEntry.path)) {
      nonImageEntries.push({
        path: manifestEntry.path,
        bytes: manifestEntry.bytes,
        humanSize: manifestEntry.humanSize,
        extension: extname(manifestEntry.path).toLowerCase() || "(none)",
        reason: "non_image_file_not_estimated",
      });
      continue;
    }

    imageEntries.push(
      await buildQaCompressionImageEstimate(rootDir, manifestEntry.path, sharp, sampleOutputDir),
    );
  }

  return {
    path: folder.path,
    files: folder.files,
    bytes: folder.bytes,
    humanSize: folder.humanSize,
    newestContentAgeDays: folder.newestContentAgeDays,
    oldestContentAgeDays: folder.oldestContentAgeDays,
    directReferenceHits: folder.directReferenceHits,
    inferredFlags: folder.inferredFlags,
    imageFiles: imageEntries.length,
    imageOriginalBytes: imageEntries.reduce((sum, entry) => sum + entry.originalBytes, 0),
    estimatedWebpBytes: imageEntries.reduce((sum, entry) => sum + entry.webpBytes, 0),
    nonImageFiles: nonImageEntries.length,
    nonImageBytes: nonImageEntries.reduce((sum, entry) => sum + entry.bytes, 0),
    imageEntries,
    nonImageEntries,
  };
}

async function buildQaCompressionImageEstimate(rootDir, relativePath, sharp, sampleOutputDir) {
  const sourcePath = resolve(rootDir, relativePath);
  const beforeStat = await lstat(sourcePath);
  const originalMetadata = await sharp(sourcePath).metadata();
  const webp = await sharp(sourcePath)
    .webp({ quality: E4_WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });
  const outputInfo = webp.info;
  const dimensionsPreserved =
    originalMetadata.width === outputInfo.width && originalMetadata.height === outputInfo.height;
  let samplePath = null;

  if (sampleOutputDir) {
    const sampleAbsolutePath = resolve(
      sampleOutputDir,
      replaceFileExtension(relativePath, ".webp"),
    );
    await mkdir(dirname(sampleAbsolutePath), { recursive: true });
    await writeFile(sampleAbsolutePath, webp.data);
    samplePath = formatReportPath(rootDir, sampleAbsolutePath);
  }

  const afterStat = await lstat(sourcePath);
  const originalUnchanged =
    beforeStat.size === afterStat.size &&
    beforeStat.mtimeMs === afterStat.mtimeMs &&
    beforeStat.ino === afterStat.ino;

  return {
    path: relativePath,
    samplePath,
    originalBytes: beforeStat.size,
    originalHumanSize: formatBytes(beforeStat.size),
    webpBytes: webp.data.length,
    webpHumanSize: formatBytes(webp.data.length),
    savedBytes: beforeStat.size - webp.data.length,
    percentSavings: percentSavings(beforeStat.size, webp.data.length),
    originalDimensions: {
      width: originalMetadata.width ?? null,
      height: originalMetadata.height ?? null,
    },
    webpDimensions: {
      width: outputInfo.width ?? null,
      height: outputInfo.height ?? null,
    },
    dimensionsPreserved,
    quality: E4_WEBP_QUALITY,
    visualAcceptabilityReviewRequired: true,
    originalUnchanged,
    compressionApplyAllowedByThisTool: false,
    deletionAllowedByThisTool: false,
  };
}

async function buildQaCompressionApplySafetyFolderReport(rootDir, folder, sharp, rollbackRoot) {
  const folderPath = resolve(rootDir, folder.path);
  const summary = await summarizePath(folderPath, rootDir, {
    includeManifest: true,
    target: QA_ARTIFACT_TARGET,
  });
  const selectedImageFiles = [];
  const nonImageEntries = [];

  for (const manifestEntry of summary.manifestEntries) {
    if (manifestEntry.kind !== MANIFEST_KIND_FILE) {
      nonImageEntries.push({
        path: manifestEntry.path,
        bytes: manifestEntry.bytes,
        humanSize: manifestEntry.humanSize,
        reason: "excluded_non_file_manifest_entry",
      });
      continue;
    }

    if (isQaCompressionGeneratedVendorPath(manifestEntry.path)) {
      nonImageEntries.push({
        path: manifestEntry.path,
        bytes: manifestEntry.bytes,
        humanSize: manifestEntry.humanSize,
        extension: extname(manifestEntry.path).toLowerCase() || "(none)",
        reason: isQaCompressionImagePath(manifestEntry.path)
          ? "excluded_generated_vendor_image_residue"
          : "excluded_generated_vendor_file_residue",
      });
      continue;
    }

    if (!isQaCompressionImagePath(manifestEntry.path)) {
      nonImageEntries.push({
        path: manifestEntry.path,
        bytes: manifestEntry.bytes,
        humanSize: manifestEntry.humanSize,
        extension: extname(manifestEntry.path).toLowerCase() || "(none)",
        reason: "excluded_non_image_generated_residue",
      });
      continue;
    }

    selectedImageFiles.push(
      await buildQaCompressionApplySafetyImageEntry(
        rootDir,
        manifestEntry.path,
        sharp,
        rollbackRoot,
      ),
    );
  }

  const originalBytes = selectedImageFiles.reduce((sum, entry) => sum + entry.original.size, 0);
  const estimatedPostCompressionBytes = selectedImageFiles.reduce(
    (sum, entry) => sum + entry.estimatedWebp.size,
    0,
  );

  return {
    path: folder.path,
    selectedImageFiles,
    nonImageEntries,
    originalBytes,
    estimatedPostCompressionBytes,
  };
}

async function buildQaCompressionApplySafetyImageEntry(rootDir, relativePath, sharp, rollbackRoot) {
  const sourcePath = resolve(rootDir, relativePath);
  const beforeStat = await lstat(sourcePath);
  const originalBytes = await readFile(sourcePath);
  const originalMetadata = await sharp(sourcePath).metadata();
  const webp = await sharp(sourcePath)
    .webp({ quality: E4_WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });
  const afterStat = await lstat(sourcePath);
  const outputInfo = webp.info;
  const webpPath = replaceFileExtension(relativePath, ".webp");
  const rollbackDestination = resolve(rollbackRoot, relativePath);
  const dimensionsPreserved =
    originalMetadata.width === outputInfo.width && originalMetadata.height === outputInfo.height;
  const originalUnchanged =
    beforeStat.size === afterStat.size &&
    beforeStat.mtimeMs === afterStat.mtimeMs &&
    beforeStat.ino === afterStat.ino;

  return {
    original: {
      path: relativePath,
      size: beforeStat.size,
      humanSize: formatBytes(beforeStat.size),
      mtime: beforeStat.mtime.toISOString(),
      mtimeMs: beforeStat.mtimeMs,
      dimensions: {
        width: originalMetadata.width ?? null,
        height: originalMetadata.height ?? null,
      },
      sha256: sha256(originalBytes),
    },
    estimatedWebp: {
      path: webpPath,
      size: webp.data.length,
      humanSize: formatBytes(webp.data.length),
      dimensions: {
        width: outputInfo.width ?? null,
        height: outputInfo.height ?? null,
      },
      sha256: sha256(webp.data),
      quality: E4_WEBP_QUALITY,
      dimensionsPreserved,
    },
    rollbackCopy: {
      destinationPath: formatReportPath(rootDir, rollbackDestination),
      outsideQaArtifacts: !isSameOrNestedPath(
        rollbackDestination,
        resolve(rootDir, QA_FOLDER_ROOT),
      ),
      sourcePath: relativePath,
      requiredBeforeFutureApply: true,
    },
    savedBytes: beforeStat.size - webp.data.length,
    percentSavings: percentSavings(beforeStat.size, webp.data.length),
    dryRunProof: {
      mutation: false,
      evidenceMutation: false,
      originalUnchanged,
    },
  };
}

function buildQaCompressionApplySafetyExclusion(
  nonImageEntries,
  eligibleFolders,
  selectedImageFolders,
) {
  const selectedImageFolderPaths = new Set(selectedImageFolders.map((folder) => folder.path));
  const imageEmptyFolders = eligibleFolders
    .filter((folder) => !selectedImageFolderPaths.has(folder.path))
    .map((folder) => folder.path);
  const bytes = nonImageEntries.reduce((sum, entry) => sum + entry.bytes, 0);
  const generatedVendorImageEntries = nonImageEntries.filter(
    (entry) => entry.reason === "excluded_generated_vendor_image_residue",
  );
  const generatedVendorImageBytes = generatedVendorImageEntries.reduce(
    (sum, entry) => sum + entry.bytes,
    0,
  );

  return {
    excluded: true,
    reason: "image_only_apply_safety_lane",
    mutation: false,
    evidenceMutation: false,
    files: nonImageEntries.length,
    bytes,
    humanSize: formatBytes(bytes),
    imageEmptyFolders,
    generatedResiduePolicy:
      "Excluded from image compression; handle only through a separate generated-residue manifest/quarantine gate.",
    generatedVendorImageResidue: {
      excluded: true,
      files: generatedVendorImageEntries.length,
      bytes: generatedVendorImageBytes,
      humanSize: formatBytes(generatedVendorImageBytes),
      samplePaths: generatedVendorImageEntries.slice(0, MAX_SAMPLES).map((entry) => entry.path),
    },
    summary: summarizeQaCompressionNonImages(nonImageEntries),
  };
}

function isSafeQaCompressionEstimateFolder(entry) {
  const flags = entry.inferredFlags ?? {};

  return (
    entry.path.startsWith(`${QA_FOLDER_ROOT}/`) &&
    entry.candidateRetentionClass === QA_COMPRESSION_DEFAULT_CLASS &&
    entry.directReferenceHits === 0 &&
    flags.localQaArtifactsOnly === true &&
    flags.activePlanLinked === false &&
    flags.securityAuthAdminSensitive === false &&
    flags.failedOrBlocked === false &&
    flags.unknownOwnership === false &&
    flags.manuallyMarkedKeep === false
  );
}

function buildQaImageCompressionRollbackRoot(rootDir, owner, generatedAt) {
  return resolve(
    rootDir,
    LOCAL_ARTIFACT_ARCHIVE_ROOT,
    "qa-image-compression",
    `${owner}-webp-q${E4_WEBP_QUALITY}-${formatSafeTimestamp(generatedAt)}`,
  );
}

function assertQaImageCompressionOriginalPathAllowed(path) {
  if (!isQaCompressionPngPath(path)) {
    throw new Error(`Refusing QA image compression apply because source is not a PNG: ${path}`);
  }

  if (!isQaImageCompressionAllowedActivePath(path)) {
    throw new Error(
      `Refusing QA image compression apply because source path is outside scope: ${path}`,
    );
  }
}

function assertQaImageCompressionOutputPathAllowed(path) {
  if (extname(path).toLowerCase() !== ".webp") {
    throw new Error(`Refusing QA image compression apply because output is not WebP: ${path}`);
  }

  if (!isQaImageCompressionAllowedActivePath(path)) {
    throw new Error(
      `Refusing QA image compression apply because output path is outside scope: ${path}`,
    );
  }
}

function isQaImageCompressionAllowedActivePath(path) {
  const normalized = path.replaceAll("\\", "/");

  if (!isQaArtifactsPath(normalized)) {
    return false;
  }

  if (isQaCompressionGeneratedVendorPath(normalized)) {
    return false;
  }

  return ![
    `${LOCAL_ARTIFACT_ARCHIVE_ROOT}/`,
    "docs/process/screenshots/",
    "docs/tasks/backlog/assets/",
    "logs/",
    "test-results/",
  ].some((prefix) => normalized.startsWith(prefix));
}

function isQaArtifactsPath(path) {
  const normalized = path.replaceAll("\\", "/");
  return normalized === QA_FOLDER_ROOT || normalized.startsWith(`${QA_FOLDER_ROOT}/`);
}

function isQaCompressionImagePath(path) {
  return QA_COMPRESSION_IMAGE_EXTENSIONS.has(extname(path).toLowerCase());
}

function isQaCompressionPngPath(path) {
  return extname(path).toLowerCase() === ".png";
}

function isQaCompressionGeneratedVendorPath(path) {
  return QA_COMPRESSION_GENERATED_VENDOR_PATH_RE.test(path.replaceAll("\\", "/"));
}

function replaceFileExtension(path, nextExtension) {
  const currentExtension = extname(path);

  if (!currentExtension) {
    return `${path}${nextExtension}`;
  }

  return `${path.slice(0, -currentExtension.length)}${nextExtension}`;
}

function summarizeQaCompressionNonImages(entries) {
  const byExtension = new Map();

  for (const entry of entries) {
    const extension = entry.extension ?? "(non-file)";
    const current = byExtension.get(extension) ?? {
      extension,
      files: 0,
      bytes: 0,
      humanSize: "0 B",
      samplePaths: [],
    };

    current.files += 1;
    current.bytes += entry.bytes;
    current.humanSize = formatBytes(current.bytes);

    if (current.samplePaths.length < MAX_SAMPLES) {
      current.samplePaths.push(entry.path);
    }

    byExtension.set(extension, current);
  }

  return Array.from(byExtension.values()).sort((a, b) => a.extension.localeCompare(b.extension));
}

async function buildTargetReport(rootDir, target, options) {
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

async function summarizePath(absolutePath, rootDir, options = {}) {
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

function summarizeManifestCategories(entries) {
  return summarizeManifestEntries(entries.flatMap((entry) => entry.manifest?.entries ?? []));
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

function buildNotes(options) {
  const notes = [
    options.applyQaDeleteAfterExpiryArchive
      ? "Apply mode is scoped to archive/quarantine for manifest-safe delete-after-expiry qa-artifacts/ folders."
      : options.applyQaImageCompression
        ? "Apply mode is scoped to manifest-safe manual-workout PNG evidence: rollback copies are written before WebP q82 replacement."
        : "Dry-run only: this command does not delete, compress, archive, or mutate files.",
    "Nested build-output entries are reported for visibility and are also included in the logs/ top-level total.",
  ];

  if (options.manifest) {
    notes.push(
      "Manifest mode is dry-run only and lists top-level target files without enabling apply, deletion, or compression.",
    );
  }

  if (options.qaFolderManifest && !options.applyQaDeleteAfterExpiryArchive) {
    notes.push(
      "QA folder manifest mode is dry-run only and classifies local qa-artifacts/ folders without enabling apply, deletion, or compression.",
    );
  }

  if (options.qaCompressionEstimate) {
    notes.push(
      "QA compression estimate mode is dry-run only; it estimates manifest-selected folders without rewriting qa-artifacts/.",
    );
  }

  if (options.qaCompressionApplySafetyDryRun) {
    notes.push(
      "QA compression apply-safety dry-run is image-only; it writes no WebP files, rollback copies, or evidence mutations.",
    );
  }

  if (options.applyQaImageCompression) {
    notes.push(
      "QA image compression apply mode writes rollback copies under .local-artifact-archive/ before replacing selected PNGs with WebP q82 siblings.",
    );
  }

  if (options.applyQaDeleteAfterExpiryArchive) {
    notes.push(
      "Apply mode is scoped to archive/quarantine only for current manifest-safe delete-after-expiry qa-artifacts/ folders.",
    );
  }

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

function validateOptionCombinations(options) {
  const applyModes = [
    options.applyQaDeleteAfterExpiryArchive,
    options.applyQaImageCompression,
  ].filter(Boolean);

  if (applyModes.length > 1) {
    throw new Error("Use only one apply mode per artifact:hygiene invocation.");
  }

  if (
    options.applyQaImageCompression &&
    (options.qaCompressionEstimate ||
      options.writeQaCompressionSamples ||
      options.e4CompressionEstimate ||
      options.writeE4CompressionSamples)
  ) {
    throw new Error(
      "Do not mix --apply-qa-image-compression with estimate or sample-output modes.",
    );
  }
}

function parseArgs(args) {
  const options = {
    rootDir: ".",
    includeQaArtifacts: false,
    manifest: false,
    qaFolderManifest: false,
    applyQaDeleteAfterExpiryArchive: false,
    qaCompressionEstimate: false,
    qaCompressionApplySafetyDryRun: false,
    applyQaImageCompression: false,
    qaCompressionClass: null,
    qaCompressionOwner: null,
    writeQaCompressionSamples: false,
    e4CompressionEstimate: false,
    writeE4CompressionSamples: false,
    sampleOutputDir: null,
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

    if (arg === "--manifest") {
      options.manifest = true;
      continue;
    }

    if (arg === "--qa-folder-manifest") {
      options.qaFolderManifest = true;
      continue;
    }

    if (arg === "--apply-delete-after-expiry-archive") {
      options.qaFolderManifest = true;
      options.applyQaDeleteAfterExpiryArchive = true;
      continue;
    }

    if (arg === "--qa-compression-estimate") {
      options.qaFolderManifest = true;
      options.qaCompressionEstimate = true;
      continue;
    }

    if (arg === "--qa-compression-apply-safety-dry-run") {
      options.qaFolderManifest = true;
      options.qaCompressionApplySafetyDryRun = true;
      continue;
    }

    if (arg === "--apply-qa-image-compression") {
      options.qaFolderManifest = true;
      options.qaCompressionApplySafetyDryRun = true;
      options.applyQaImageCompression = true;
      continue;
    }

    if (arg === "--write-qa-compression-samples") {
      options.qaFolderManifest = true;
      options.qaCompressionEstimate = true;
      options.writeQaCompressionSamples = true;
      continue;
    }

    if (arg === "--qa-compression-class") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --qa-compression-class.");
      }
      options.qaCompressionClass = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--qa-compression-class=")) {
      const value = arg.slice("--qa-compression-class=".length).trim();
      if (!value) {
        throw new Error("Missing value for --qa-compression-class.");
      }
      options.qaCompressionClass = value;
      continue;
    }

    if (arg === "--qa-compression-owner") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --qa-compression-owner.");
      }
      options.qaCompressionOwner = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--qa-compression-owner=")) {
      const value = arg.slice("--qa-compression-owner=".length).trim();
      if (!value) {
        throw new Error("Missing value for --qa-compression-owner.");
      }
      options.qaCompressionOwner = value;
      continue;
    }

    if (arg === "--e4-compression-estimate") {
      options.e4CompressionEstimate = true;
      continue;
    }

    if (arg === "--write-e4-compression-samples") {
      options.e4CompressionEstimate = true;
      options.writeE4CompressionSamples = true;
      continue;
    }

    if (arg === "--sample-output-dir") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --sample-output-dir.");
      }
      options.sampleOutputDir = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--sample-output-dir=")) {
      const value = arg.slice("--sample-output-dir=".length).trim();
      if (!value) {
        throw new Error("Missing value for --sample-output-dir.");
      }
      options.sampleOutputDir = value;
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
  npm run artifact:hygiene -- --manifest
  npm run artifact:hygiene -- --include-qa-artifacts
  npm run artifact:hygiene -- --manifest --include-qa-artifacts
  npm run artifact:hygiene -- --qa-folder-manifest
  npm run artifact:hygiene -- --qa-folder-manifest --apply-delete-after-expiry-archive
  npm run artifact:hygiene -- --qa-compression-estimate --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring
  npm run artifact:hygiene -- --qa-compression-apply-safety-dry-run --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring
  npm run artifact:hygiene -- --apply-qa-image-compression --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring
  npm run artifact:hygiene -- --write-qa-compression-samples --qa-compression-class compress-after-policy --qa-compression-owner manual_workout_authoring --sample-output-dir /tmp/hito-manual-workout-qa-compression-samples
  npm run artifact:hygiene -- --e4-compression-estimate
  npm run artifact:hygiene -- --write-e4-compression-samples --sample-output-dir /tmp/hito-e4-compression-samples
  node ./scripts/report-local-artifact-hygiene.mjs --root /tmp/hito-artifact-fixture

This is a dry-run reporter only. It inventories logs/, test-results/, and build-output residues.
Pass --manifest to include per-file dry-run classification for top-level targets.
Pass --qa-folder-manifest to add folder-level local qa-artifacts/ TTL/reference/sensitivity classification.
Pass --apply-delete-after-expiry-archive with --qa-folder-manifest to move only current manifest-safe delete-after-expiry qa-artifacts/ folders into .local-artifact-archive/.
Pass --qa-compression-estimate with --qa-compression-class and --qa-compression-owner to estimate WebP q82 savings for manifest-selected qa-artifacts/ folders.
Pass --qa-compression-apply-safety-dry-run to produce an image-only manifest with checksums, rollback copy plan, and restore instructions without writing evidence.
Pass --apply-qa-image-compression to replace only manifest-safe manual-workout PNG evidence with WebP q82 siblings after writing rollback copies to .local-artifact-archive/.
Pass --write-qa-compression-samples with --sample-output-dir outside evidence roots to write disposable review samples.
Pass --e4-compression-estimate for the no-apply WebP estimate for the approved E4 screenshot bucket.
Sample output requires --write-e4-compression-samples and an explicit --sample-output-dir outside the evidence bucket.
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

function resolveRequiredQaCompressionSampleOutputDir(rootDir, options) {
  if (!options.sampleOutputDir) {
    throw new Error(
      "--write-qa-compression-samples requires --sample-output-dir outside evidence roots.",
    );
  }

  const outputDir = resolve(rootDir, options.sampleOutputDir);
  const qaRoot = resolve(rootDir, QA_FOLDER_ROOT);
  const archiveRoot = resolve(rootDir, LOCAL_ARTIFACT_ARCHIVE_ROOT);

  if (isSameOrNestedPath(outputDir, qaRoot) || isSameOrNestedPath(outputDir, archiveRoot)) {
    throw new Error("QA compression sample output directory must be outside evidence roots.");
  }

  return outputDir;
}

async function loadSharp() {
  try {
    const sharpModule = await import("sharp");
    return sharpModule.default ?? sharpModule;
  } catch (error) {
    throw new Error(
      `Unable to load sharp for E4 WebP compression estimation: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function resolveRequiredSampleOutputDir(rootDir, bucketPath, options) {
  if (!options.sampleOutputDir) {
    throw new Error(
      "--write-e4-compression-samples requires --sample-output-dir outside the evidence bucket.",
    );
  }

  const outputDir = resolve(rootDir, options.sampleOutputDir);
  const relativeToBucket = relative(bucketPath, outputDir);

  if (
    !relativeToBucket ||
    (!relativeToBucket.startsWith("..") && !relativeToBucket.startsWith("/"))
  ) {
    throw new Error("Sample output directory must be outside the E4 evidence bucket.");
  }

  return outputDir;
}

function isSameOrNestedPath(candidatePath, parentPath) {
  const relativePath = relative(parentPath, candidatePath);

  return !relativePath || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}

function ageDays(date) {
  return Number(((Date.now() - date.getTime()) / DAY_MS).toFixed(2));
}

function percentSavings(originalBytes, candidateBytes) {
  if (originalBytes <= 0) {
    return 0;
  }

  return Number((((originalBytes - candidateBytes) / originalBytes) * 100).toFixed(2));
}

function formatReportPath(rootDir, absolutePath) {
  const relativePath = relative(rootDir, absolutePath);

  if (!relativePath || (!relativePath.startsWith("..") && !relativePath.startsWith("/"))) {
    return relativePath || ".";
  }

  return absolutePath;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function formatSafeTimestamp(date) {
  return date.toISOString().replace(/[:.]/g, "-");
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
