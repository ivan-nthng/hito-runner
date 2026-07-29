import { createHash } from "node:crypto";

import { QA_FOLDER_ROOT } from "./policy.mjs";
import { formatBytes } from "./utils.mjs";

export const QA_EVIDENCE_DATE_SEGMENT_RE = /^\d{4}-\d{2}-\d{2}(?:$|[-_])/;
export const QA_EVIDENCE_EXACT_DATE_SEGMENT_RE = /^\d{4}-\d{2}-\d{2}$/;

const QA_EVIDENCE_PACKAGE_SELECTION_VERSION = "qa_evidence_package_selection_v1";
const QA_EVIDENCE_NEUTRAL_IDENTITY_SEGMENTS = new Set(["debug", "screenshots"]);

export function buildQaEvidenceRelativePackageIdentity(folderPath) {
  return folderPath
    .split(/[\\/]+/)
    .slice(1)
    .filter(
      (segment) =>
        !QA_EVIDENCE_NEUTRAL_IDENTITY_SEGMENTS.has(segment.toLowerCase()) &&
        !QA_EVIDENCE_EXACT_DATE_SEGMENT_RE.test(segment),
    )
    .join("/");
}

export function inferQaFolderOwnership(packageIdentity) {
  const normalized = packageIdentity.toLowerCase();
  const ownershipPatterns = [
    ["admin", /(?:^|[-_/])(?:admin|backlog)(?:$|[-_/])/],
    ["hito_ds", /hito[-_]?ds|hitods|design[-_/]?system/],
    ["manual_workout_authoring", /manual[-_/]?workout|workout[-_/]?authoring/],
    [
      "plan_creation",
      /onboarding|first[-_/]?plan|plan[-_/]?creation|selected[-_/]?plan|plan[-_/]?preset|generated[-_/]?plan[-_/]?preview/,
    ],
    [
      "running_plan_engine",
      /running[-_/]?coach|coach[-_/]?review|running[-_/]?plan[-_/]?engine|plan[-_/]?engine|live[-_/]?provider/,
    ],
    ["devtools", /local[-_/]?(?:inspector|devtool|ui[-_/]?inspector)|qa[-_/]?server/],
  ];
  const signals = ownershipPatterns
    .filter(([, pattern]) => pattern.test(normalized))
    .map(([owner]) => owner);

  return {
    owner: signals.length === 1 ? signals[0] : "unknown",
    signals,
  };
}

export function buildQaEvidencePackageContentIdentity(manifestEntries) {
  const canonicalEntries = manifestEntries.map(({ path, kind, bytes, mtime }) => ({
    path,
    kind,
    bytes,
    mtime,
  }));

  return createHash("sha256").update(JSON.stringify(canonicalEntries)).digest("hex");
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
    flags.ambiguousOwnership === false &&
    flags.generatedVendorResidue === false &&
    flags.unscopedEvidencePackage === false &&
    flags.manuallyMarkedKeep === false
  );
}

export function buildQaOwnerArchiveSelection(entries, owner) {
  const reviewedPackages = entries
    .filter((entry) => entry.inferredFlags?.inferredOwner === owner)
    .map((entry) => ({
      ...buildQaArchiveSelectionPackage(entry),
      archiveEligible: isSafeQaDeleteAfterExpiryArchiveCandidate(entry),
    }));
  const selectedPackages = reviewedPackages.filter((entry) => entry.archiveEligible);
  assertNoOverlappingQaEvidencePackages(selectedPackages);
  const selectedFileCount = selectedPackages.reduce((sum, entry) => sum + entry.files, 0);
  const selectedBytes = selectedPackages.reduce((sum, entry) => sum + entry.bytes, 0);
  const selectionIdentity = createHash("sha256")
    .update(
      JSON.stringify({
        version: QA_EVIDENCE_PACKAGE_SELECTION_VERSION,
        owner,
        retentionClass: "delete-after-expiry",
        packages: selectedPackages.map(
          ({
            path,
            contentIdentity,
            files,
            directories,
            symlinks,
            bytes,
            candidateRetentionClass,
            reason,
            directReferenceHits,
          }) => ({
            path,
            contentIdentity,
            files,
            directories,
            symlinks,
            bytes,
            candidateRetentionClass,
            reason,
            directReferenceHits,
          }),
        ),
      }),
    )
    .digest("hex");

  return {
    enabled: true,
    mode: "dry_run",
    mutation: false,
    evidenceMutation: false,
    selectionVersion: QA_EVIDENCE_PACKAGE_SELECTION_VERSION,
    owner,
    retentionClass: "delete-after-expiry",
    retentionUnit: "whole_evidence_package",
    restoreBoundary: "whole_evidence_package_only",
    partialRestoreAllowed: false,
    selectionIdentity,
    reviewedPackageCount: reviewedPackages.length,
    selectedPackageCount: selectedPackages.length,
    selectedFileCount,
    selectedBytes,
    selectedHumanSize: formatBytes(selectedBytes),
    reviewedPackages,
    selectedPackages,
    excludedPackages: reviewedPackages
      .filter((entry) => !entry.archiveEligible)
      .map((entry) => ({
        ...entry,
        exclusionReason: buildQaArchiveSelectionExclusionReason(entry),
      })),
    futureApplyRequirement:
      "Pass this exact owner and selectionIdentity to a fresh apply invocation; any selection drift must refuse before archive writes.",
  };
}

function buildQaArchiveSelectionPackage(entry) {
  return {
    path: entry.path,
    packageIdentity: entry.packageIdentity,
    packageLayout: entry.packageLayout,
    contentIdentity: entry.contentIdentity,
    files: entry.files,
    directories: entry.directories,
    symlinks: entry.symlinks,
    bytes: entry.bytes,
    humanSize: entry.humanSize,
    candidateRetentionClass: entry.candidateRetentionClass,
    reason: entry.reason,
    directReferenceHits: entry.directReferenceHits,
    referenceHitSamples: entry.referenceHitSamples,
    inferredFlags: entry.inferredFlags,
    restore: {
      sourcePath: entry.path,
      archiveRelativePath: entry.path,
      unit: "whole_evidence_package",
      partialRestoreAllowed: false,
    },
  };
}

function buildQaArchiveSelectionExclusionReason(entry) {
  if (entry.candidateRetentionClass !== "delete-after-expiry") {
    return `retention_class_${entry.candidateRetentionClass}`;
  }

  const flags = entry.inferredFlags ?? {};
  const failedFlags = [
    ["direct_reference", entry.directReferenceHits > 0],
    ["active_plan", flags.activePlanLinked === true],
    ["sensitive", flags.securityAuthAdminSensitive === true],
    ["failed_or_blocked", flags.failedOrBlocked === true],
    ["unknown_owner", flags.unknownOwnership === true],
    ["ambiguous_owner", flags.ambiguousOwnership === true],
    ["generated_vendor_residue", flags.generatedVendorResidue === true],
    ["unscoped_evidence_package", flags.unscopedEvidencePackage === true],
    ["manual_keep", flags.manuallyMarkedKeep === true],
  ]
    .filter(([, failed]) => failed)
    .map(([name]) => name);

  return failedFlags.length > 0 ? failedFlags.join(",") : "archive_safety_guard";
}

function assertNoOverlappingQaEvidencePackages(packages) {
  const sortedPaths = packages.map((entry) => entry.path).sort();

  for (let index = 0; index < sortedPaths.length; index += 1) {
    const currentPath = sortedPaths[index];
    const nextPath = sortedPaths[index + 1];
    if (nextPath?.startsWith(`${currentPath}/`)) {
      throw new Error(
        `Refusing ambiguous partial evidence selection because ${nextPath} is nested under ${currentPath}.`,
      );
    }
  }
}
