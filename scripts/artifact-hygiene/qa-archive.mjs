import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import { LOCAL_ARTIFACT_ARCHIVE_ROOT, QA_FOLDER_ROOT } from "./policy.mjs";
import { isSafeQaDeleteAfterExpiryArchiveCandidate } from "./qa-folder-manifest.mjs";
import { formatBytes } from "./utils.mjs";

export async function applyQaDeleteAfterExpiryArchive(rootDir, qaFolderManifest) {
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

function buildQaArchivePath(rootDir) {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return resolve(
    rootDir,
    LOCAL_ARTIFACT_ARCHIVE_ROOT,
    `qa-artifacts-delete-after-expiry-${timestamp}`,
  );
}
