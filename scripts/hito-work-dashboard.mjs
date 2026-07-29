#!/usr/bin/env node

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { parseCanonicalMarkdown } from "./admin-backlog-import/markdown.ts";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptsDir, "..");
const activePlansDir = path.join(repoRoot, "docs/plans/active");
const dashboardFile = path.join(repoRoot, "docs/work-dashboard.md");
const maxCellLength = 220;

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");
const skipAdmin = args.has("--no-admin");
const shouldHelp = args.has("--help") || args.has("-h");

if (isMainModule()) {
  await main();
}

async function main() {
  if (shouldHelp) {
    printHelp();
    return;
  }

  if (shouldApply && skipAdmin) {
    throw new Error("Use either --apply or --no-admin, not both.");
  }

  const generatedAt = new Date().toISOString();
  const adminResults = [];

  if (!skipAdmin) {
    const importArgs = shouldApply
      ? ["run", "import-admin-backlog-work-items", "--", "--timeout-ms", "30000"]
      : ["run", "import-admin-backlog-work-items", "--", "--dry-run", "--timeout-ms", "30000"];

    adminResults.push(
      await runCommand({
        label: shouldApply ? "Admin backlog live sync" : "Admin backlog dry-run",
        command: "npm",
        args: importArgs,
      }),
    );

    adminResults.push(
      await runCommand({
        label: "Admin backlog validator",
        command: "npm",
        args: ["run", "validate-admin-capture-backlog"],
      }),
    );
  }

  const activePlans = await readActivePlans();
  const dashboard = renderDashboard({
    generatedAt,
    mode: skipAdmin ? "dashboard-only" : shouldApply ? "live-admin-sync" : "safe-dry-run",
    adminResults,
    activePlans,
  });

  await writeDashboardFile(dashboard);

  console.log(dashboard);
  if (adminResults.some((result) => result.status === "failed")) {
    process.exitCode = 1;
  }
}

function isMainModule() {
  return Boolean(process.argv[1] && path.resolve(process.argv[1]) === scriptPath);
}

function printHelp() {
  console.log(`Hito work dashboard

Usage:
  npm run work:dashboard
    Safe refresh: run admin importer in dry-run mode, validate admin capture, then update docs/work-dashboard.md.

  npm run work:dashboard:apply
    Live admin sync: upsert repo-derived work items into Admin, validate, then update docs/work-dashboard.md.

  npm run work:dashboard:no-admin
    Dashboard-only refresh: do not call Admin scripts; only refresh docs/work-dashboard.md from active plans.

Direct node fallback:
  node --import tsx scripts/hito-work-dashboard.mjs [--no-admin|--apply]
`);
}

async function readActivePlans() {
  if (!existsSync(activePlansDir)) {
    return [];
  }

  const filenames = (await readdir(activePlansDir)).filter((name) => name.endsWith(".md")).sort();

  const plans = [];
  for (const filename of filenames) {
    const absolutePath = path.join(activePlansDir, filename);
    const content = await readFile(absolutePath, "utf8");
    plans.push(projectActivePlanMarkdown({ filename, absolutePath, content }));
  }

  return plans;
}

export function projectActivePlanMarkdown({ filename, absolutePath, content }) {
  const parsed = parseCanonicalMarkdown(content);
  const diagnostics = [...parsed.missingRequiredFields, ...parsed.invalidRequiredFields];
  const metadataState =
    parsed.metadataState === "complete"
      ? "canonical metadata"
      : parsed.metadataState === "legacy_debt"
        ? "legacy metadata debt"
        : `malformed metadata${diagnostics.length ? `: ${diagnostics.join(", ")}` : ""}`;

  return {
    title: truncate(extractTitle(content) ?? filename),
    file: `<${absolutePath}>`,
    workItemId: truncate(parsed.workItemId ?? "legacy metadata debt"),
    status: truncate(parsed.status ?? parsed.raw.Status ?? "unknown"),
    owner: truncate(parsed.owner ?? parsed.raw.Owner ?? "legacy metadata debt"),
    scope: truncate(parsed.scope ?? parsed.raw.Scope ?? "legacy metadata debt"),
    archiveIntent: truncate(
      parsed.archiveIntent ?? parsed.raw["Archive Intent"] ?? "legacy metadata debt",
    ),
    batch: truncate(parsed.batch ?? parsed.raw.Batch ?? "none"),
    frontendLane: truncate(parsed.frontendLane ?? parsed.raw["Frontend Lane"] ?? "none"),
    metadataState,
    nextRole: truncate(parsed.nextRole ?? parsed.raw["Next Recommended Role"] ?? "unknown"),
    task: truncate(parsed.task ?? "unknown"),
    stage: truncate(parsed.stage ?? "unknown"),
    latest: truncate(extractLatestNote(content) ?? "No latest note found"),
  };
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function extractLatestNote(content) {
  const ignored = new Set([
    "Work Item ID",
    "Status",
    "Type",
    "Priority",
    "Scope",
    "Archive Intent",
    "Batch",
    "Frontend Lane",
    "Next Recommended Role",
    "Task",
    "Stage",
    "Exact Handoff Prompt",
    "Suggested Next Step",
    "Owner",
    "Last Updated",
  ]);

  const headingRegex = /^##\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const heading = match[1].trim();
    if (ignored.has(heading)) {
      continue;
    }

    const bodyStart = headingRegex.lastIndex;
    const nextMatch = content.slice(bodyStart).match(/\n##\s+/);
    const body = nextMatch
      ? content.slice(bodyStart, bodyStart + nextMatch.index)
      : content.slice(bodyStart);
    const statusLine =
      body.match(/^\s*Status:\s*(.+)$/m)?.[1]?.trim() ??
      body.match(/^\s*-\s+(.+)$/m)?.[1]?.trim() ??
      "";

    return statusLine ? `${heading}: ${statusLine}` : heading;
  }

  return null;
}

function normalizeInline(value) {
  return value
    .replace(/```[\s\S]*?```/g, "[prompt block]")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value) {
  const normalized = normalizeInline(String(value));
  if (normalized.length <= maxCellLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxCellLength - 1)}...`;
}

function escapeMarkdown(value) {
  return String(value).replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function technicalLabel(value) {
  return `<sub><code>${escapeHtml(value)}</code></sub>`;
}

function technicalValue(value) {
  return `<code>${escapeHtml(value)}</code>`;
}

async function runCommand({ label, command, args }) {
  const startedAt = new Date().toISOString();
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: repoRoot,
      env: process.env,
      maxBuffer: 1024 * 1024 * 10,
    });
    return {
      label,
      status: "passed",
      command: renderCommand(command, args),
      startedAt,
      summary: summarizeCommandOutput(`${stdout}\n${stderr}`),
    };
  } catch (error) {
    return {
      label,
      status: "failed",
      command: renderCommand(command, args),
      startedAt,
      summary: summarizeCommandOutput(
        `${error.stdout ?? ""}\n${error.stderr ?? ""}\n${error.message ?? ""}`,
      ),
    };
  }
}

function renderCommand(command, args) {
  return [command, ...args.map((arg) => (/\s/.test(arg) ? JSON.stringify(arg) : arg))].join(" ");
}

function summarizeCommandOutput(output) {
  const jsonStart = output.indexOf("{");
  const jsonEnd = output.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const report = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
      if (report.mode && report.eligible && report.results) {
        const eligibleTotal = Object.values(report.eligible).reduce(
          (sum, value) => sum + Number(value ?? 0),
          0,
        );
        const missingMetadataCount = report.metadataQuality?.examples?.length ?? 0;
        return truncate(
          `${report.mode}: eligible ${eligibleTotal}; created ${report.results.created}; updated ${report.results.updated}; skipped ${report.results.skipped}; duplicates ${report.results.duplicateCount}; stale mirrors ${report.results.staleActiveRepoMirrorCount}; metadata examples ${missingMetadataCount}`,
        );
      }
      if (typeof report.ok === "boolean") {
        return truncate(`${report.ok ? "ok" : "failed"}: ${report.message ?? "JSON report"}`);
      }
    } catch {
      // Fall through to line-based summary.
    }
  }

  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const interesting = lines.filter((line) =>
    /(passed|failed|created|updated|skipped|eligible|dry-run|live|error|warning|missing|invalid|validated|import)/i.test(
      line,
    ),
  );
  return truncate((interesting.length ? interesting : lines).slice(-6).join(" / ") || "No output");
}

export function renderDashboard({ generatedAt, mode, adminResults, activePlans }) {
  const adminBlock = adminResults.length
    ? adminResults
        .map(
          (result) =>
            `- ${result.status === "passed" ? "OK" : "FAIL"} ${result.label}: \`${result.command}\` — ${result.summary}`,
        )
        .join("\n")
    : "- Skipped by `--no-admin`.";

  const activeWorkBlock = activePlans.length
    ? activePlans.map((plan, index) => renderActivePlanCard(plan, index)).join("\n\n---\n\n")
    : "_No active plans found._";

  return `# Hito Work Dashboard

Generated: ${generatedAt}
Mode: ${mode}

Keep this file open in a side pane. Re-run one command below whenever you want the Admin work-item
mirror and this dashboard to refresh.

## Update Commands

\`\`\`bash
# Safe refresh: Admin dry-run + validator + update this Markdown file
npm run work:dashboard

# Dashboard-only refresh: do not touch Admin at all
npm run work:dashboard:no-admin

# Live Admin sync: upsert repo-derived tasks into Admin + update this Markdown file
npm run work:dashboard:apply

# Direct node fallback, if npm scripts are unavailable
node --import tsx scripts/hito-work-dashboard.mjs
node --import tsx scripts/hito-work-dashboard.mjs --no-admin
\`\`\`

## Admin Commands

\`\`\`bash
# Dry-run repo-derived work-item import
npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000

# Live repo-derived work-item import
npm run import-admin-backlog-work-items -- --timeout-ms 30000

# Validate Admin Backlog capture/import rules
npm run validate-admin-capture-backlog
\`\`\`

## Useful Daily Commands

\`\`\`bash
npm run qa:server:status
npm run qa:server:restart
npm run build
npm run lint
npm run artifact:hygiene
npm run validate-manual-workout-authoring
node --import tsx ./scripts/validate-plan-authoring-doctrine.ts
node --import tsx ./scripts/validate-running-plan-engine-confirm.ts
\`\`\`

## Last Refresh

${adminBlock}

## Active Work

${activeWorkBlock}

## Safety Notes

- Default refresh is non-mutating for Admin because it uses \`--dry-run\`.
- Use \`npm run work:dashboard:apply\` only when you intentionally want to upsert repo-derived work
  items into Admin.
- This file is generated by \`scripts/hito-work-dashboard.mjs\`.
- You can edit the script, not this generated dashboard, if the format needs to change.
- Do not delete \`qa-artifacts/\` or logs from this helper; artifact cleanup has its own policy.
`;
}

function renderActivePlanCard(plan, index) {
  return `### ${index + 1}. [${escapeMarkdown(plan.title)}](${plan.file})

${technicalLabel("WORK ITEM ID")}

${technicalValue(plan.workItemId)}

${technicalLabel("STATUS")}

${technicalValue(plan.status)}

${technicalLabel("OWNER / SCOPE")}

${technicalValue(`${plan.owner} / ${plan.scope}`)}

${technicalLabel("BATCH / FRONTEND LANE")}

${technicalValue(`${plan.batch} / ${plan.frontendLane}`)}

${technicalLabel("ARCHIVE INTENT")}

${technicalValue(plan.archiveIntent)}

${technicalLabel("METADATA STATE")}

${technicalValue(plan.metadataState)}

#### Task
${plan.task}

${technicalLabel("STAGE")}

${technicalValue(plan.stage)}

${technicalLabel("LAST VISIBLE NOTE")}

${plan.latest}

${technicalLabel("NEXT ROLE")}

${technicalValue(plan.nextRole)}`;
}

async function writeDashboardFile(dashboard) {
  await mkdir(path.dirname(dashboardFile), { recursive: true });
  await writeFile(dashboardFile, `${dashboard.trim()}\n`, "utf8");
}
