import { createHash } from "node:crypto";
import { lstat } from "node:fs/promises";
import { extname, relative } from "node:path";

import { DAY_MS } from "./policy.mjs";

export async function safeLstat(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export function isSameOrNestedPath(candidatePath, parentPath) {
  const relativePath = relative(parentPath, candidatePath);

  return !relativePath || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}

export function ageDays(date) {
  return Number(((Date.now() - date.getTime()) / DAY_MS).toFixed(2));
}

export function percentSavings(originalBytes, candidateBytes) {
  if (originalBytes <= 0) {
    return 0;
  }

  return Number((((originalBytes - candidateBytes) / originalBytes) * 100).toFixed(2));
}

export function formatReportPath(rootDir, absolutePath) {
  const relativePath = relative(rootDir, absolutePath);

  if (!relativePath || (!relativePath.startsWith("..") && !relativePath.startsWith("/"))) {
    return relativePath || ".";
  }

  return absolutePath;
}

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function formatSafeTimestamp(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function formatBytes(bytes) {
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

export function replaceFileExtension(path, nextExtension) {
  const currentExtension = extname(path);

  if (!currentExtension) {
    return `${path}${nextExtension}`;
  }

  return `${path.slice(0, -currentExtension.length)}${nextExtension}`;
}
