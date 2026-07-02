export const DAY_MS = 24 * 60 * 60 * 1000;
export const RECENT_LOG_DAYS = 7;
export const OLD_LOG_DAYS = 30;
export const MAX_SAMPLES = 8;
export const MAX_REFERENCE_HIT_SAMPLES = 8;
export const MANIFEST_KIND_FILE = "file";
export const MANIFEST_KIND_SYMLINK = "symlink";
export const E4_QA_EVIDENCE_BUCKET =
  "qa-artifacts/screenshots/2026-05-30/long-horizon-review-copy-fix-qa";
export const E4_WEBP_QUALITY = 82;
export const QA_FOLDER_ROOT = "qa-artifacts";
export const LOCAL_ARTIFACT_ARCHIVE_ROOT = ".local-artifact-archive";
export const QA_COMPRESSION_DEFAULT_CLASS = "compress-after-policy";
export const QA_COMPRESSION_DEFAULT_OWNER = "manual_workout_authoring";
export const QA_DELETE_AFTER_DAYS = 14;
export const QA_COMPRESS_AFTER_DAYS = 7;
export const QA_REFERENCE_SCAN_ROOTS = [
  "docs",
  "src",
  "scripts",
  "package.json",
  "AGENTS.md",
  "agents",
  "skills",
];
export const QA_REFERENCE_TEXT_EXTENSIONS = new Set([
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
export const QA_REFERENCE_SKIP_DIRS = new Set([
  ".git",
  ".output",
  "logs",
  "node_modules",
  "qa-artifacts",
  "test-results",
]);
export const QA_MANUAL_KEEP_MARKER_RE = /^(?:\.keep|\.hito-keep|keep|keep\.md)$/i;
export const QA_SENSITIVE_TOKEN_RE =
  /(?:^|[-_/])(admin|auth|login|security|credential|credentials|session|supabase|remote|production)(?:$|[-_/])/i;
export const QA_FAILED_BLOCKED_TOKEN_RE =
  /(?:^|[-_/])(failed|failure|blocked|blocker|regression|broken)(?:$|[-_/])/i;
export const QA_COMPRESSION_IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png"]);
export const QA_COMPRESSION_GENERATED_VENDOR_PATH_RE =
  /(?:^|\/)(?:pw\/)?node_modules(?:\/|$)|(?:^|\/)playwright-core\/lib\/(?:server|tools)(?:\/|$)/;
export const STALE_REPO_LOCAL_QA_RUNTIME_RETENTION = "stale_repo_local_qa_runtime_residue";
export const STALE_REPO_LOCAL_QA_RUNTIME_PATHS = new Set([
  "logs/qa-local-server.log",
  "logs/qa-local-server-state.json",
]);

export const DEFAULT_TARGETS = [
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
    artifactKind: "stale_repo_local_qa_server_log",
    includedInParent: "logs",
    description:
      "Legacy repo-local QA server stdout/stderr log. Current managed QA server writes to the non-iCloud cache runtime state directory.",
  },
  {
    path: "logs/qa-local-server-state.json",
    artifactKind: "stale_repo_local_qa_server_state",
    includedInParent: "logs",
    description:
      "Legacy repo-local QA server PID/build state. Current managed QA server state lives in the non-iCloud cache runtime state directory.",
  },
  {
    path: "test-results",
    artifactKind: "generated_test_runner_residue",
    description: "Generated test-runner residue such as Playwright .last-run state.",
  },
];

export const QA_ARTIFACT_TARGET = {
  path: "qa-artifacts",
  artifactKind: "protected_qa_evidence",
  protectedEvidence: true,
  description: "Protected local QA evidence. Count only; never mark disposable in this tool.",
};
