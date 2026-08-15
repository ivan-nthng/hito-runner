import { spawnSync } from "node:child_process";
import process from "node:process";

const sourceChecks = [
  tsCheck("plan-authoring-doctrine", "scripts/validate-plan-authoring-doctrine.ts"),
  tsCheck("plan-goal-intent", "scripts/validate-plan-goal-intent-contract.ts"),
  tsCheck("generated-plan", "scripts/validate-ai-generated-running-plan-creation.ts"),
  tsCheck("planned-workout-language", "scripts/validate-planned-workout-language.ts"),
  tsCheck("running-plan-confirm", "scripts/validate-running-plan-engine-confirm.ts"),
  tsCheck("manual-workout-authoring", "scripts/validate-manual-workout-authoring.ts"),
  tsCheck("calendar-authority-retirement", "scripts/validate-active-plan-schedule-edit-preview.ts"),
  tsCheck("workout-comparison", "scripts/validate-workout-evidence-comparison.ts"),
  tsCheck("runner-auth", "scripts/validate-runner-auth-session.ts"),
  tsCheck("runner-calendar-context", "scripts/validate-runner-calendar-context.ts"),
  tsCheck("ui-locale-profile", "scripts/validate-ui-locale-profile.ts"),
  tsCheck("admin-auth", "scripts/validate-admin-auth-session.ts"),
  tsCheck("runtime-observability", "scripts/validate-local-runtime-observability.ts"),
  nodeCheck("qa-build-freshness", "scripts/validate-qa-build-freshness.mjs"),
  nodeCheck("test-user-lifecycle", "scripts/validate-qa-test-user-lifecycle.mjs"),
  tsCheck("admin-capture-backlog", "scripts/validate-admin-capture-backlog.ts"),
];

const localDatabaseChecks = [
  tsCheck("calendar-overflow-actions", "scripts/validate-calendar-overflow-future-actions.ts"),
  tsCheck("running-plan-confirm-persistence", "scripts/validate-running-plan-engine-confirm.ts", [
    "--require-persistence",
  ]),
  tsCheck("manual-workout-persistence", "scripts/validate-manual-workout-authoring.ts", [
    "--require-persistence",
  ]),
  tsCheck("runner-activity-foundation", "scripts/validate-runner-activity-foundation.ts"),
  tsCheck("runner-activity-gate-4", "scripts/validate-runner-activity-gate-4.ts"),
  tsCheck("runner-activity-read-models", "scripts/validate-runner-activity-read-models.ts", [
    "--scale=3000",
  ]),
  tsCheck("runner-calendar-context", "scripts/validate-runner-calendar-context.ts", [
    "--require-persistence",
  ]),
  tsCheck("ui-locale-profile", "scripts/validate-ui-locale-profile.ts", ["--require-persistence"]),
];

const runtimeUrl = argumentValue("--runtime-url");
const includeLocalDatabase = process.argv.includes("--local-db");
const includeRuntime = process.argv.includes("--runtime");
const includeRelease = process.argv.includes("--release");
const listOnly = process.argv.includes("--list");
const selectedSourceChecks = sourceChecks.filter(
  (check) =>
    !(
      includeLocalDatabase &&
      ["running-plan-confirm", "manual-workout-authoring"].includes(check.name)
    ) && !(includeRuntime && check.name === "runner-auth"),
);

if (includeRuntime && !runtimeUrl) {
  console.error("[validate-backend] --runtime requires --runtime-url=<loopback URL>.");
  process.exit(2);
}
if (runtimeUrl && !includeRuntime) {
  console.error("[validate-backend] --runtime-url is valid only together with --runtime.");
  process.exit(2);
}

const runtimeChecks = runtimeUrl
  ? [
      tsCheck(
        "runner-activity-foundation-runtime",
        "scripts/validate-runner-activity-foundation.ts",
        [`--runtime-url=${runtimeUrl}`],
      ),
      tsCheck(
        "runner-activity-read-models-runtime",
        "scripts/validate-runner-activity-read-models.ts",
        [`--runtime-url=${runtimeUrl}`],
      ),
      tsCheck("runner-auth-runtime", "scripts/validate-runner-auth-session.ts", [
        `--runtime-url=${runtimeUrl}`,
      ]),
    ]
  : [];
const releaseChecks = [
  commandCheck("production-build", "npm", ["run", "build"]),
  nodeCheck("build-output-integrity", "scripts/validate-build-output-integrity.mjs"),
  commandCheck("supabase-deployment-parity", "npm", ["run", "supabase:deployment:parity"]),
];
const checks = [
  ...selectedSourceChecks,
  ...(includeLocalDatabase ? localDatabaseChecks : []),
  ...(includeRuntime ? runtimeChecks : []),
  ...(includeRelease ? releaseChecks : []),
];
const enabledGroups = [
  "source",
  ...(includeLocalDatabase ? ["local-db"] : []),
  ...(includeRuntime ? ["runtime"] : []),
  ...(includeRelease ? ["release"] : []),
];

if (listOnly) {
  for (const check of checks) console.log(`${check.name}: ${formatCommand(check)}`);
  printSkippedGroups();
  process.exit(0);
}

for (const [index, check] of checks.entries()) {
  console.log(`[validate-backend] ${index + 1}/${checks.length} ${check.name}`);
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`[validate-backend] failed: ${check.name}`);
    process.exit(result.status ?? 1);
  }
}

console.log(
  `[validate-backend] ${enabledGroups.join("+")} suite passed (${checks.length} checks).`,
);
printSkippedGroups();

function tsCheck(name, file, extraArgs = []) {
  return commandCheck(name, process.execPath, ["--import", "tsx", file, ...extraArgs]);
}

function nodeCheck(name, file) {
  return commandCheck(name, process.execPath, [file]);
}

function commandCheck(name, command, args) {
  return { name, command, args };
}

function formatCommand(check) {
  return [check.command, ...check.args].join(" ");
}

function argumentValue(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function printSkippedGroups() {
  const skipped = [
    ...(!includeLocalDatabase ? ["local-db"] : []),
    ...(!includeRuntime ? ["runtime"] : []),
    ...(!includeRelease ? ["release"] : []),
  ];
  if (skipped.length > 0) {
    console.log(`[validate-backend] skipped groups: ${skipped.join(", ")}`);
  }
}
