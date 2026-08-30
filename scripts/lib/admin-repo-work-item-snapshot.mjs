import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, relative, resolve, sep } from "node:path";

export const ADMIN_REPO_SNAPSHOT_MARKER = "HITO_ADMIN_REPO_SNAPSHOT_V1";

export function loadAdminRepoSourceManifest(rootDir) {
  const manifestPath = resolve(rootDir, "scripts/admin-backlog-import/sources.json");

  if (!existsSync(manifestPath)) {
    throw new Error(`Admin repository source manifest is missing: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    throw new Error("Admin repository source manifest contains no required sources.");
  }

  return manifest;
}

export function collectAdminRepoWorkItemSnapshot(rootDir) {
  const manifest = loadAdminRepoSourceManifest(rootDir);
  const documents = [];
  const countsByRoot = {};

  for (const source of manifest.sources) {
    const sourceDir = resolve(rootDir, source.root);

    if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
      throw new Error(`Required repository work-item source is unavailable: ${source.root}`);
    }

    const files = collectMarkdownFiles(sourceDir).filter(
      (filePath) => basename(filePath).toLowerCase() !== "readme.md",
    );

    if (files.length === 0 && source.allowEmpty !== true) {
      throw new Error(`Required repository work-item source is empty: ${source.root}`);
    }

    countsByRoot[source.root] = files.length;

    for (const filePath of files) {
      documents.push({
        sourcePath: normalizePath(relative(rootDir, filePath)),
        sourceType: source.type,
        content: readFileSync(filePath, "utf8"),
      });
    }
  }

  documents.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
  const digest = createHash("sha256")
    .update(
      documents
        .map((document) => `${document.sourceType}\0${document.sourcePath}\0${document.content}`)
        .join("\0\n"),
    )
    .digest("hex");

  return {
    marker: ADMIN_REPO_SNAPSHOT_MARKER,
    digest,
    countsByRoot,
    documents,
  };
}

function collectMarkdownFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function normalizePath(input) {
  return sep === "/" ? input : input.split(sep).join("/");
}
