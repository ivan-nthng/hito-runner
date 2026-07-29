import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseArgs, validateOptionCombinations } from "./artifact-hygiene/cli.mjs";
import { applyQaDeleteAfterExpiryArchive } from "./artifact-hygiene/qa-archive.mjs";
import { buildQaFolderManifestReport } from "./artifact-hygiene/qa-folder-manifest.mjs";
import { LOCAL_ARTIFACT_ARCHIVE_ROOT } from "./artifact-hygiene/policy.mjs";
import { safeLstat } from "./artifact-hygiene/utils.mjs";

const OLD_MTIME = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const rootDir = await mkdtemp(join(tmpdir(), "hito-artifact-hygiene-contract-"));

try {
  await buildProofTree(rootDir);
  const report = await buildQaFolderManifestReport(rootDir, { qaOwner: "devtools" });
  validatePackageBoundaries(report);
  validateOwnership(report);
  validateProtectionAndResidue(report);
  validateOwnerSelection(report);
  validateCliBoundary();
  await validateSelectionDriftRefusal(rootDir, report);

  console.log(
    "Artifact hygiene package ownership, retention, selection, and drift contracts passed.",
  );
} finally {
  await rm(rootDir, { recursive: true, force: true });
}

async function buildProofTree(rootDir) {
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/generated-plan-coach-proof/review.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/generated-plan-coach-proof/playwright-output/trace.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/generated-plan-coach-proof/tool-output/result.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/local-inspector-copy-proof/browser/proof.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/manual-workout-vendor-proof/proof.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/manual-workout-vendor-proof/pw/node_modules/vendor.js",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/plan-creation-parent-ref/browser/proof.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/plan-creation-active-ref/browser/proof.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/admin-local-inspector-proof/proof.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/manual-workout-sensitive-nested/browser/auth/session.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/local-inspector-failed-nested/browser/failure/trace.json",
  );
  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/local-inspector-generated-output/browser/playwright-output/trace.json",
  );
  await writeOldFile(rootDir, "qa-artifacts/logs/generated.log");

  await writeTextFile(
    rootDir,
    "docs/reference.md",
    "Evidence: qa-artifacts/screenshots/2026-06-01/plan-creation-parent-ref\n",
  );
  await writeTextFile(
    rootDir,
    "docs/plans/active/proof-plan.md",
    "Evidence: qa-artifacts/screenshots/2026-06-01/plan-creation-active-ref\n",
  );
}

function validatePackageBoundaries(report) {
  const generatedPlan = requireEntry(report, "generated-plan-coach-proof");

  assert.equal(
    generatedPlan.path,
    "qa-artifacts/screenshots/2026-06-01/generated-plan-coach-proof",
  );
  assert.equal(generatedPlan.files, 3);
  assert.equal(generatedPlan.retentionUnit, "whole_evidence_package");
  assert.equal(
    report.entries.some((entry) => entry.path.endsWith("/playwright-output")),
    false,
  );
  assert.equal(
    report.entries.some((entry) => entry.path.endsWith("/browser")),
    false,
  );
  assert.equal(
    report.entries.some((entry) => entry.path.endsWith("/tool-output")),
    false,
  );
}

function validateOwnership(report) {
  const generatedPlan = requireEntry(report, "generated-plan-coach-proof");
  const inspectorCopy = requireEntry(report, "local-inspector-copy-proof");
  const ambiguous = requireEntry(report, "admin-local-inspector-proof");

  assert.equal(generatedPlan.packageIdentity, "generated-plan-coach-proof");
  assert.equal(generatedPlan.inferredFlags.inferredOwner, "unknown");
  assert.equal(generatedPlan.candidateRetentionClass, "unknown/manual-review");
  assert.equal(inspectorCopy.inferredFlags.inferredOwner, "devtools");
  assert.equal(
    inspectorCopy.inferredFlags.ownershipSignals.includes("manual_workout_authoring"),
    false,
  );
  assert.equal(ambiguous.inferredFlags.inferredOwner, "unknown");
  assert.deepEqual(ambiguous.inferredFlags.ownershipSignals.sort(), ["admin", "devtools"]);
  assert.equal(ambiguous.candidateRetentionClass, "unknown/manual-review");
}

function validateProtectionAndResidue(report) {
  const parentReferenced = requireEntry(report, "plan-creation-parent-ref");
  const activePlanReferenced = requireEntry(report, "plan-creation-active-ref");
  const generatedVendor = requireEntry(report, "manual-workout-vendor-proof");
  const sensitiveNested = requireEntry(report, "manual-workout-sensitive-nested");
  const failedNested = requireEntry(report, "local-inspector-failed-nested");
  const generatedOutput = requireEntry(report, "local-inspector-generated-output");
  const unscoped = requireEntry(report, "logs");

  assert.equal(parentReferenced.directReferenceHits, 1);
  assert.equal(parentReferenced.candidateRetentionClass, "promote-to-docs-digest");
  assert.equal(activePlanReferenced.inferredFlags.activePlanLinked, true);
  assert.equal(activePlanReferenced.candidateRetentionClass, "keep-until-plan-archive");
  assert.equal(generatedVendor.inferredFlags.generatedVendorResidue, true);
  assert.equal(generatedVendor.candidateRetentionClass, "unknown/manual-review");
  assert.equal(sensitiveNested.inferredFlags.securityAuthAdminSensitive, true);
  assert.equal(sensitiveNested.candidateRetentionClass, "unknown/manual-review");
  assert.equal(failedNested.inferredFlags.failedOrBlocked, true);
  assert.equal(failedNested.candidateRetentionClass, "unknown/manual-review");
  assert.equal(generatedOutput.inferredFlags.generatedVendorResidue, true);
  assert.equal(generatedOutput.candidateRetentionClass, "unknown/manual-review");
  assert.equal(unscoped.inferredFlags.unscopedEvidencePackage, true);
  assert.equal(unscoped.candidateRetentionClass, "unknown/manual-review");
}

function validateOwnerSelection(report) {
  const selection = report.ownerSelection;

  assert.ok(selection);
  assert.equal(selection.mode, "dry_run");
  assert.equal(selection.mutation, false);
  assert.equal(selection.owner, "devtools");
  assert.equal(selection.retentionUnit, "whole_evidence_package");
  assert.equal(selection.restoreBoundary, "whole_evidence_package_only");
  assert.equal(selection.partialRestoreAllowed, false);
  assert.equal(selection.selectionIdentity.length, 64);
  assert.equal(selection.selectedPackageCount, 1);
  assert.equal(selection.selectedPackages[0]?.packageIdentity, "local-inspector-copy-proof");
  assert.equal(selection.selectedPackages[0]?.restore.partialRestoreAllowed, false);
}

function validateCliBoundary() {
  const dryRunOptions = parseArgs(["--qa-folder-manifest", "--qa-owner", "devtools"]);
  validateOptionCombinations(dryRunOptions);
  assert.equal(dryRunOptions.qaOwner, "devtools");
  assert.equal(dryRunOptions.applyQaDeleteAfterExpiryArchive, false);

  assert.throws(
    () =>
      validateOptionCombinations(
        parseArgs(["--apply-delete-after-expiry-archive", "--qa-owner", "devtools"]),
      ),
    /requires --qa-owner and --qa-selection-id/,
  );
  assert.throws(
    () => parseArgs(["--qa-archive-owner", "devtools"]),
    /Unknown option: --qa-archive-owner/,
  );
}

async function validateSelectionDriftRefusal(rootDir, originalReport) {
  const originalSelectionId = originalReport.ownerSelection.selectionIdentity;
  const unchangedReport = await buildQaFolderManifestReport(rootDir, { qaOwner: "devtools" });
  assert.equal(unchangedReport.ownerSelection.selectionIdentity, originalSelectionId);

  await writeOldFile(
    rootDir,
    "qa-artifacts/screenshots/2026-06-01/local-inspector-copy-proof/browser/drift.json",
  );
  const driftedReport = await buildQaFolderManifestReport(rootDir, { qaOwner: "devtools" });
  assert.notEqual(driftedReport.ownerSelection.selectionIdentity, originalSelectionId);

  await assert.rejects(
    applyQaDeleteAfterExpiryArchive(rootDir, driftedReport, {
      qaOwner: "devtools",
      qaSelectionId: originalSelectionId,
    }),
    /reviewed selection .* drifted/,
  );
  assert.equal(await safeLstat(join(rootDir, LOCAL_ARTIFACT_ARCHIVE_ROOT)), null);
  assert.ok(
    await safeLstat(
      join(
        rootDir,
        "qa-artifacts/screenshots/2026-06-01/local-inspector-copy-proof/browser/proof.json",
      ),
    ),
  );
}

function requireEntry(report, packageIdentity) {
  const entry = report.entries.find((candidate) => candidate.packageIdentity === packageIdentity);
  assert.ok(entry, `Missing proof package ${packageIdentity}.`);
  return entry;
}

async function writeOldFile(rootDir, relativePath) {
  const absolutePath = join(rootDir, relativePath);
  await mkdir(join(absolutePath, ".."), { recursive: true });
  await writeFile(absolutePath, "{}\n");
  await utimes(absolutePath, OLD_MTIME, OLD_MTIME);
}

async function writeTextFile(rootDir, relativePath, content) {
  const absolutePath = join(rootDir, relativePath);
  await mkdir(join(absolutePath, ".."), { recursive: true });
  await writeFile(absolutePath, content);
}
