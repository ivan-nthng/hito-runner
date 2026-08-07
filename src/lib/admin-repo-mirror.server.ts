import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADMIN_REPO_WORK_ITEM_SOURCE_ROOTS,
  synchronizeRepoWorkItems,
  type AdminRepoWorkItemDocument,
} from "../../scripts/import-repo-work-items-to-admin-backlog";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database";

export type AdminRepoMirrorSourceMode = "filesystem" | "bundle";

type SynchronizeOptions = {
  supabase: SupabaseClient<Database>;
  sourceRevision?: string;
};

type RequestSynchronizerOptions = SynchronizeOptions & {
  requestUrl: string;
  supabaseUrl: string;
};

export function resolveAdminRepoMirrorSourceMode(
  requestUrl: string,
  supabaseUrl: string,
): AdminRepoMirrorSourceMode | null {
  const requestIsLoopback = isLoopbackRuntimeUrl(requestUrl);
  const supabaseIsLoopback = isLoopbackRuntimeUrl(supabaseUrl);

  if (requestIsLoopback && supabaseIsLoopback) {
    return "filesystem";
  }

  if (!requestIsLoopback && !supabaseIsLoopback) {
    return "bundle";
  }

  return null;
}

export function createAdminRepoMirrorSynchronizer(options: RequestSynchronizerOptions) {
  const sourceMode = resolveAdminRepoMirrorSourceMode(options.requestUrl, options.supabaseUrl);

  if (sourceMode === "filesystem") {
    return () => synchronizeFilesystemAdminRepoMirror(options);
  }

  if (sourceMode === "bundle") {
    return () => synchronizeBundledAdminRepoMirror(options);
  }

  return undefined;
}

let activeRepoMirrorSync: Promise<void> | null = null;
let synchronizedBundleDigest: string | null = null;

export function synchronizeFilesystemAdminRepoMirror(options: SynchronizeOptions) {
  return runSynchronizedProjection(() =>
    synchronizeRepoWorkItems({
      rootDir: process.cwd(),
      archiveStale: false,
      sourceRevision: options.sourceRevision,
      supabase: options.supabase,
    }),
  );
}

export async function synchronizeBundledAdminRepoMirror(options: SynchronizeOptions) {
  const { loadBundledAdminRepoWorkItems } = await import("./admin-repo-mirror-bundle.server");
  const snapshot = loadBundledAdminRepoWorkItems();
  validateBundledSnapshot(snapshot);

  if (synchronizedBundleDigest === snapshot.digest) {
    return;
  }

  await runSynchronizedProjection(
    () =>
      synchronizeRepoWorkItems({
        documents: snapshot.documents,
        archiveStale: false,
        sourceGeneration: snapshot.sourceGeneration,
        sourceRevision: options.sourceRevision,
        supabase: options.supabase,
      }),
    snapshot.digest,
  );
}

async function runSynchronizedProjection(
  synchronize: () => ReturnType<typeof synchronizeRepoWorkItems>,
  bundleDigest?: string,
) {
  if (!activeRepoMirrorSync) {
    activeRepoMirrorSync = synchronize()
      .then((report) => {
        if (!report.ok) {
          throw new Error("Canonical repository work-item identities conflict.");
        }

        if (bundleDigest) {
          synchronizedBundleDigest = bundleDigest;
        }
      })
      .finally(() => {
        activeRepoMirrorSync = null;
      });
  }

  return activeRepoMirrorSync;
}

function validateBundledSnapshot(snapshot: {
  marker: string;
  digest: string;
  sourceGeneration: string;
  countsByRoot: Record<string, number>;
  documents: AdminRepoWorkItemDocument[];
}) {
  if (snapshot.marker !== "HITO_ADMIN_REPO_SNAPSHOT_V1") {
    throw new Error("Deployed repository work-item snapshot marker is invalid.");
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(snapshot.sourceGeneration)) {
    throw new Error("Deployed repository work-item snapshot generation is invalid.");
  }

  for (const root of ADMIN_REPO_WORK_ITEM_SOURCE_ROOTS) {
    if (!snapshot.countsByRoot[root] || snapshot.countsByRoot[root] <= 0) {
      throw new Error(`Required deployed repository work-item source is unavailable: ${root}`);
    }
  }

  const digest = createHash("sha256")
    .update(
      snapshot.documents
        .map((document) => `${document.sourceType}\0${document.sourcePath}\0${document.content}`)
        .join("\0\n"),
    )
    .digest("hex");

  if (digest !== snapshot.digest) {
    throw new Error("Deployed repository work-item snapshot digest does not match its documents.");
  }
}
