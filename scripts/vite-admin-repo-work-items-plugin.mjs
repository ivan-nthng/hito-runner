import { collectAdminRepoWorkItemSnapshot } from "./lib/admin-repo-work-item-snapshot.mjs";
import { resolve } from "node:path";

const VIRTUAL_MODULE_ID = "virtual:hito-admin-repo-work-items";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export function hitoAdminRepoWorkItemsPlugin({ rootDir }) {
  const sourceGeneration = new Date().toISOString();

  return {
    name: "hito:admin-repo-work-items-snapshot",
    enforce: "pre",
    resolveId(id) {
      return id === VIRTUAL_MODULE_ID ? RESOLVED_VIRTUAL_MODULE_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
        return null;
      }

      const snapshot = collectAdminRepoWorkItemSnapshot(rootDir);

      for (const document of snapshot.documents) {
        this.addWatchFile(resolve(rootDir, document.sourcePath));
      }

      return `export default ${JSON.stringify({ ...snapshot, sourceGeneration })};`;
    },
  };
}
