import { runRepoWorkItemImporterCli } from "./import-repo-work-items-to-admin-backlog";

const result = await runRepoWorkItemImporterCli();
process.exitCode = result.exitCode;
