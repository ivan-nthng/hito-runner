#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const command = process.argv[2] ?? "status";
const trustedPrivateFlag = "--trusted-private-network";

if (!new Set(["start", "status", "reset", "stop"]).has(command)) {
  throw new Error("Usage: npm run camelot:<start|status|reset|stop>.");
}

if (command === "start") {
  await startCamelot();
} else if (command === "status") {
  printReceipt(await readCamelotStatus());
} else if (command === "reset") {
  const reset = runTestUser("camelot-reset");
  printReceipt({ ok: true, action: "camelot-reset", reset, ...(await readCamelotStatus()) });
} else {
  stopCamelot();
}

async function startCamelot() {
  try {
    const check = runProcess(
      process.execPath,
      ["scripts/configure-local-supabase-env.mjs", "--check", trustedPrivateFlag],
      { allowFailure: true },
    );
    if (check.status !== 0) {
      runProcess(process.execPath, [
        "scripts/configure-local-supabase-env.mjs",
        "--start",
        trustedPrivateFlag,
      ]);
      runProcess(process.execPath, [
        "scripts/configure-local-supabase-env.mjs",
        trustedPrivateFlag,
      ]);
    }
    const seed = runTestUser("camelot-seed");
    runProcess(process.execPath, [
      "scripts/qa-local-server.mjs",
      "restart",
      "--slot",
      "camelot",
      "--provider-mode",
      "qa_fixture",
      "--fixture-profile",
      "camelot",
    ]);
    printReceipt({ ok: true, action: "camelot-start", seed, ...(await readCamelotStatus()) });
  } catch (error) {
    runProcess(process.execPath, ["scripts/qa-local-server.mjs", "stop", "--slot", "camelot"], {
      allowFailure: true,
    });
    throw error;
  }
}

async function readCamelotStatus() {
  const server = parseJson(
    runProcess(process.execPath, [
      "scripts/qa-local-server.mjs",
      "status",
      "--slot",
      "camelot",
      "--provider-mode",
      "qa_fixture",
      "--fixture-profile",
      "camelot",
      "--json",
    ]).stdout,
    "managed QA server status",
  );
  const fixture = runTestUser("camelot-status");
  const publicSavedPlanReadback = parseJson(
    runProcess(process.execPath, [
      "--env-file=.env.local",
      "--import",
      "tsx",
      "scripts/validate-restored-saved-plan-server-fn.ts",
      "--runtime-url",
      "http://localhost:3100",
      "--role",
      "camelot",
      "--read-only",
    ]).stdout,
    "public Saved plan readback",
  );
  if (
    !server.ok ||
    server.slot !== "camelot" ||
    server.port !== 3100 ||
    server.providerMode !== "qa_fixture" ||
    server.fixtureProfile !== "camelot" ||
    fixture.externalProviderDispatchCount !== 0 ||
    publicSavedPlanReadback.listedReviewCount !== 1 ||
    publicSavedPlanReadback.restoreStatus !== "review_ready" ||
    publicSavedPlanReadback.canonicalWorkoutDocumentCount !== 28 ||
    publicSavedPlanReadback.confirmationCount !== 0 ||
    publicSavedPlanReadback.calendarRowCount !== 0 ||
    publicSavedPlanReadback.externalProviderDispatchCount !== 0 ||
    publicSavedPlanReadback.foreignPoolLoginRejected !== true
  ) {
    throw new Error("Camelot status failed its managed local zero-provider boundary.");
  }
  return {
    profile: "camelot",
    fixtureVersion: fixture.fixtureVersion,
    localOnly: true,
    server,
    fixture,
    publicSavedPlanReadback,
  };
}

function stopCamelot() {
  const cleanup = runTestUser("camelot-reset", ["--mode", "zero"]);
  if (
    cleanup.uiState !== "canonical_zero" ||
    cleanup.storageObjects !== 0 ||
    cleanup.leaseReleased !== true ||
    Object.values(cleanup.ownedRows).some((count) => count !== 0)
  ) {
    throw new Error("Camelot cleanup did not reach exact owner-bound zero.");
  }
  const server = runProcess(
    process.execPath,
    ["scripts/qa-local-server.mjs", "stop", "--slot", "camelot"],
    { allowFailure: true },
  );
  if (server.status !== 0) {
    throw new Error("The repository-managed QA server did not stop cleanly.");
  }
  printReceipt({
    ok: true,
    action: "camelot-stop",
    profile: "camelot",
    managedQaServer: "stopped",
    sharedProjectQualifiedSupabase: "unchanged",
    cleanup: {
      ownedRows: cleanup.ownedRows,
      storageObjects: cleanup.storageObjects,
      leaseReleased: cleanup.leaseReleased,
      authIdentityRetained: cleanup.authIdentityRetained,
    },
  });
}

function runTestUser(action, args = []) {
  const result = runProcess(process.execPath, [
    "--env-file=.env.local",
    "scripts/test-user.mjs",
    action,
    ...args,
  ]);
  return parseJson(result.stdout, action);
}

function runProcess(executable, args, { allowFailure = false } = {}) {
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`Camelot lifecycle step ${args[1] ?? args[0]} failed closed.`);
  }
  return result;
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Camelot ${label} did not return its expected safe JSON receipt.`);
  }
}

function printReceipt(receipt) {
  console.log(JSON.stringify(receipt, null, 2));
}
