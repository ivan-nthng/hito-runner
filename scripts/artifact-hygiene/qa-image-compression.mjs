import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";

import {
  E4_QA_EVIDENCE_BUCKET,
  E4_WEBP_QUALITY,
  LOCAL_ARTIFACT_ARCHIVE_ROOT,
  MANIFEST_KIND_FILE,
  MAX_SAMPLES,
  QA_ARTIFACT_TARGET,
  QA_COMPRESSION_DEFAULT_CLASS,
  QA_COMPRESSION_DEFAULT_OWNER,
  QA_COMPRESSION_GENERATED_VENDOR_PATH_RE,
  QA_COMPRESSION_IMAGE_EXTENSIONS,
  QA_FOLDER_ROOT,
} from "./policy.mjs";
import { summarizePath } from "./target-report.mjs";
import {
  formatBytes,
  formatReportPath,
  formatSafeTimestamp,
  isSameOrNestedPath,
  percentSavings,
  replaceFileExtension,
  safeLstat,
  sha256,
} from "./utils.mjs";

export async function buildE4QaEvidenceCompressionReport(rootDir, options) {
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

export async function buildQaManifestSelectedCompressionReport(rootDir, qaFolderManifest, options) {
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

export async function buildQaCompressionApplySafetyDryRunReport(
  rootDir,
  qaFolderManifest,
  options,
) {
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

export async function applyQaImageCompression(rootDir, safetyReport) {
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
