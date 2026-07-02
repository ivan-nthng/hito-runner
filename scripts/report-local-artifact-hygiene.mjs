#!/usr/bin/env node
import { resolve } from "node:path";

import {
  buildHelpText,
  buildNotes,
  parseArgs,
  validateOptionCombinations,
} from "./artifact-hygiene/cli.mjs";
import {
  DEFAULT_TARGETS,
  OLD_LOG_DAYS,
  QA_ARTIFACT_TARGET,
  RECENT_LOG_DAYS,
} from "./artifact-hygiene/policy.mjs";
import { applyQaDeleteAfterExpiryArchive } from "./artifact-hygiene/qa-archive.mjs";
import { buildQaFolderManifestReport } from "./artifact-hygiene/qa-folder-manifest.mjs";
import {
  applyQaImageCompression,
  buildE4QaEvidenceCompressionReport,
  buildQaCompressionApplySafetyDryRunReport,
  buildQaManifestSelectedCompressionReport,
} from "./artifact-hygiene/qa-image-compression.mjs";
import {
  buildTargetReport,
  summarizeManifestCategories,
  summarizeTotals,
} from "./artifact-hygiene/target-report.mjs";

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
