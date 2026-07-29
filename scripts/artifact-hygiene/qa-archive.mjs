import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import { LOCAL_ARTIFACT_ARCHIVE_ROOT, QA_FOLDER_ROOT } from "./policy.mjs";
import { isSafeQaDeleteAfterExpiryArchiveCandidate } from "./qa-evidence-package-selection.mjs";
import { formatBytes } from "./utils.mjs";

export async function applyQaDeleteAfterExpiryArchive(rootDir, qaFolderManifest, options = {}) {
  if (!qaFolderManifest?.entries || !qaFolderManifest.ownerSelection) {
    throw new Error("QA folder manifest is required before archive apply.");
  }

  const selectedOwner = options.qaOwner;
  const reviewedSelectionId = options.qaSelectionId;
  const selection = qaFolderManifest.ownerSelection;

  if (!selectedOwner || !reviewedSelectionId) {
    throw new Error(
      "Archive apply requires one reviewed --qa-owner and --qa-selection-id dry-run boundary.",
    );
  }
  if (selection.owner !== selectedOwner) {
    throw new Error(
      `Refusing archive apply because manifest owner ${selection.owner} does not match ${selectedOwner}.`,
    );
  }
  if (selection.selectionIdentity !== reviewedSelectionId) {
    throw new Error(
      `Refusing archive apply because reviewed selection ${reviewedSelectionId} drifted to ${selection.selectionIdentity}.`,
    );
  }
  if (selection.retentionUnit !== "whole_evidence_package") {
    throw new Error("Refusing archive apply because the selection is not package-atomic.");
  }

  const selectedPaths = new Set(selection.selectedPackages.map((entry) => entry.path));
  const deleteAfterExpiryEntries = qaFolderManifest.entries.filter((entry) =>
    selectedPaths.has(entry.path),
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
    throw new Error(
      `Refusing archive apply because no reviewed delete-after-expiry packages are present for owner ${selectedOwner}.`,
    );
  }
  if (deleteAfterExpiryEntries.length !== selection.selectedPackageCount) {
    throw new Error("Refusing archive apply because the reviewed package selection is incomplete.");
  }

  const archivePath = buildQaArchivePath(rootDir, selectedOwner);
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
    selectedInferredOwner: selectedOwner,
    reviewedSelectionId,
    retentionUnit: selection.retentionUnit,
    restoreBoundary: selection.restoreBoundary,
    partialRestoreAllowed: false,
    selectedFolders: deleteAfterExpiryEntries.map((entry) => ({
      path: entry.path,
      packageIdentity: entry.packageIdentity,
      contentIdentity: entry.contentIdentity,
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
      "ambiguousOwnership must be false",
      "generatedVendorResidue must be false",
      "unscopedEvidencePackage must be false",
      "manuallyMarkedKeep must be false",
      "localQaArtifactsOnly must be true",
      "tracked docs evidence roots are excluded",
      `inferredOwner must be exactly ${selectedOwner}`,
      `selectionIdentity must remain exactly ${reviewedSelectionId}`,
    ],
    restoreInstructions:
      "Restore each complete evidence package from archiveRoot to its exact original path under qa-artifacts/. Partial package restore is not allowed without manual review.",
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
    selectedInferredOwner: selectedOwner,
    reviewedSelectionId,
    retentionUnit: "whole_evidence_package",
    partialRestoreAllowed: false,
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

function buildQaArchivePath(rootDir, selectedOwner) {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const ownerSegment = selectedOwner ? `${sanitizeArchivePathSegment(selectedOwner)}-` : "";
  return resolve(
    rootDir,
    LOCAL_ARTIFACT_ARCHIVE_ROOT,
    `qa-artifacts-delete-after-expiry-${ownerSegment}${timestamp}`,
  );
}

function sanitizeArchivePathSegment(value) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "owner";
}
