import type { Json } from "../../src/lib/supabase/database";
import { normalizeMetadata, sourceKey, workItemIdentityKey } from "./markdown";

export type RepoWorkItemIdentity = {
  workItemId: string | null;
  sourcePath: string;
  sourceType: string;
};

export type DuplicateWorkItemId = {
  workItemId: string;
  sourcePaths: string[];
};

type RepoMirrorRow = {
  metadata: Json;
};

export type RepoMirrorIndex<T extends RepoMirrorRow> = {
  byWorkItemId: Map<string, T>;
  bySource: Map<string, T>;
};

export function buildExistingRepoMirrorIndex<T extends RepoMirrorRow>(
  rows: T[],
): RepoMirrorIndex<T> {
  const byWorkItemId = new Map<string, T>();
  const bySource = new Map<string, T>();

  for (const row of rows) {
    const identity = readRepoMirrorIdentity(row.metadata);

    if (!identity) {
      continue;
    }

    bySource.set(sourceKey(identity.sourceType, identity.sourcePath), row);

    if (identity.workItemId) {
      byWorkItemId.set(identity.workItemId, row);
    }
  }

  return { byWorkItemId, bySource };
}

export function findExistingRepoMirrorRow<T extends RepoMirrorRow>(
  index: RepoMirrorIndex<T>,
  item: RepoWorkItemIdentity,
) {
  return (
    (item.workItemId ? index.byWorkItemId.get(item.workItemId) : undefined) ??
    index.bySource.get(sourceKey(item.sourceType, item.sourcePath))
  );
}

export function countRepoMirrorIdentityDuplicates(rows: RepoMirrorRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const identity = readRepoMirrorIdentity(row.metadata);

    if (!identity) {
      continue;
    }

    const key = workItemIdentityKey(identity.workItemId, identity.sourceType, identity.sourcePath);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.values()).filter((count) => count > 1).length;
}

export function findDuplicateWorkItemIds(
  items: Array<Pick<RepoWorkItemIdentity, "workItemId" | "sourcePath">>,
): DuplicateWorkItemId[] {
  const sourcePathsById = new Map<string, string[]>();

  for (const item of items) {
    if (!item.workItemId) {
      continue;
    }

    const sourcePaths = sourcePathsById.get(item.workItemId) ?? [];
    sourcePaths.push(item.sourcePath);
    sourcePathsById.set(item.workItemId, sourcePaths);
  }

  return Array.from(sourcePathsById.entries())
    .filter(([, sourcePaths]) => sourcePaths.length > 1)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([workItemId, sourcePaths]) => ({
      workItemId,
      sourcePaths: sourcePaths.sort(),
    }));
}

export function buildCurrentRepoMirrorKeys(items: RepoWorkItemIdentity[]) {
  const keys = new Set<string>();

  for (const item of items) {
    keys.add(sourceKey(item.sourceType, item.sourcePath));

    if (item.workItemId) {
      keys.add(workItemIdentityKey(item.workItemId, item.sourceType, item.sourcePath));
    }
  }

  return keys;
}

export function readRepoMirrorIdentity(metadataValue: Json): RepoWorkItemIdentity | null {
  const metadata = normalizeMetadata(metadataValue);

  if (metadata.imported_from_repo !== true) {
    return null;
  }

  const sourcePath = typeof metadata.source_path === "string" ? metadata.source_path : null;
  const sourceType = typeof metadata.source_type === "string" ? metadata.source_type : null;

  if (!sourcePath || !sourceType) {
    return null;
  }

  return {
    workItemId: typeof metadata.work_item_id === "string" ? metadata.work_item_id : null,
    sourcePath,
    sourceType,
  };
}
