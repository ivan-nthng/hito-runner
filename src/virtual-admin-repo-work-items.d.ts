declare module "virtual:hito-admin-repo-work-items" {
  const snapshot: {
    marker: "HITO_ADMIN_REPO_SNAPSHOT_V1";
    digest: string;
    sourceGeneration: string;
    countsByRoot: Record<string, number>;
    documents: Array<{
      sourcePath: string;
      sourceType:
        | "backlog_doc"
        | "product_brief"
        | "frontend_spec"
        | "active_plan"
        | "archived_plan";
      content: string;
    }>;
  };

  export default snapshot;
}
