export function buildNotes(options) {
  const notes = [
    options.applyQaDeleteAfterExpiryArchive
      ? options.qaArchiveOwner
        ? `Apply mode is scoped to archive/quarantine for manifest-safe delete-after-expiry qa-artifacts/ folders owned by ${options.qaArchiveOwner}.`
        : "Apply mode is scoped to archive/quarantine for manifest-safe delete-after-expiry qa-artifacts/ folders."
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
      options.qaArchiveOwner
        ? `Apply mode is scoped to archive/quarantine only for current manifest-safe delete-after-expiry qa-artifacts/ folders owned by ${options.qaArchiveOwner}.`
        : "Apply mode is scoped to archive/quarantine only for current manifest-safe delete-after-expiry qa-artifacts/ folders.",
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

export function validateOptionCombinations(options) {
  const applyModes = [
    options.applyQaDeleteAfterExpiryArchive,
    options.applyQaImageCompression,
  ].filter(Boolean);

  if (applyModes.length > 1) {
    throw new Error("Use only one apply mode per artifact:hygiene invocation.");
  }

  if (options.qaArchiveOwner && !options.applyQaDeleteAfterExpiryArchive) {
    throw new Error(
      "--qa-archive-owner can only be used with --apply-delete-after-expiry-archive.",
    );
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

export function parseArgs(args) {
  const options = {
    rootDir: ".",
    includeQaArtifacts: false,
    manifest: false,
    qaFolderManifest: false,
    applyQaDeleteAfterExpiryArchive: false,
    qaArchiveOwner: null,
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

    if (arg === "--qa-archive-owner") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --qa-archive-owner.");
      }
      options.qaArchiveOwner = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--qa-archive-owner=")) {
      const value = arg.slice("--qa-archive-owner=".length).trim();
      if (!value) {
        throw new Error("Missing value for --qa-archive-owner.");
      }
      options.qaArchiveOwner = value;
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

export function buildHelpText() {
  return `Usage:
  npm run artifact:hygiene
  npm run artifact:hygiene -- --manifest
  npm run artifact:hygiene -- --include-qa-artifacts
  npm run artifact:hygiene -- --manifest --include-qa-artifacts
  npm run artifact:hygiene -- --qa-folder-manifest
  npm run artifact:hygiene -- --qa-folder-manifest --apply-delete-after-expiry-archive
  npm run artifact:hygiene -- --qa-folder-manifest --apply-delete-after-expiry-archive --qa-archive-owner manual_workout_authoring
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
Pass --apply-delete-after-expiry-archive with --qa-folder-manifest to move only current manifest-safe delete-after-expiry qa-artifacts/ folders into .local-artifact-archive/. Pass --qa-archive-owner to limit that archive/quarantine apply to one inferred owner.
Pass --qa-compression-estimate with --qa-compression-class and --qa-compression-owner to estimate WebP q82 savings for manifest-selected qa-artifacts/ folders.
Pass --qa-compression-apply-safety-dry-run to produce an image-only manifest with checksums, rollback copy plan, and restore instructions without writing evidence.
Pass --apply-qa-image-compression to replace only manifest-safe manual-workout PNG evidence with WebP q82 siblings after writing rollback copies to .local-artifact-archive/.
Pass --write-qa-compression-samples with --sample-output-dir outside evidence roots to write disposable review samples.
Pass --e4-compression-estimate for the no-apply WebP estimate for the approved E4 screenshot bucket.
Sample output requires --write-e4-compression-samples and an explicit --sample-output-dir outside the evidence bucket.
qa-artifacts/ is protected evidence and is excluded unless --include-qa-artifacts is supplied.`;
}
