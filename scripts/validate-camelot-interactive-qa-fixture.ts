import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import {
  CAMELOT_INTERACTIVE_QA_FIXTURE_VERSION,
  evaluateCamelotRuntimeBoundary,
  isLocalAuthAccountAllowedForCamelotProfile,
  sanitizeCamelotPresentationFileName,
} from "../src/lib/camelot-interactive-qa-fixture";
import { QA_TESTER_POOL } from "./lib/qa-test-user-lifecycle.mjs";
import { QA_MANAGED_RUNTIME_SLOTS, resolveQaManagedSlotPaths } from "./lib/qa-runtime-paths.mjs";

const allowed = evaluateCamelotRuntimeBoundary({
  authProvider: "local",
  appBaseUrl: "http://127.0.0.1:3000",
  supabaseUrl: "http://127.0.0.1:54321",
  env: fixtureEnv(),
});
assert.deepEqual(allowed, { allowed: true, profile: "camelot" });

for (const [label, boundary] of [
  ["profile", evaluateCamelotRuntimeBoundary(runtime({ HITO_QA_FIXTURE_PROFILE: "" }))],
  ["vercel", evaluateCamelotRuntimeBoundary(runtime({ VERCEL: "1" }))],
  [
    "provider",
    evaluateCamelotRuntimeBoundary(runtime({ HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "real" })),
  ],
  ["auth", evaluateCamelotRuntimeBoundary({ ...runtime(), authProvider: "supabase" })],
  [
    "application",
    evaluateCamelotRuntimeBoundary({ ...runtime(), appBaseUrl: "https://hito.example" }),
  ],
  [
    "supabase",
    evaluateCamelotRuntimeBoundary({ ...runtime(), supabaseUrl: "https://project.supabase.co" }),
  ],
] as const) {
  assert.equal(boundary.allowed, false, `${label} boundary must fail closed.`);
}

assert.equal(
  sanitizeCamelotPresentationFileName("../../Morning\u0000 run?.fit"),
  "Morning run_.fit",
);
assert.equal(sanitizeCamelotPresentationFileName("\u0000"), "selected-activity.fit");
assert.equal(QA_TESTER_POOL.camelot.username, "camelot");
assert.equal(QA_TESTER_POOL.camelot.email, "camelot@local.test");
assert.equal(isLocalAuthAccountAllowedForCamelotProfile("camelot", fixtureEnv()), true);
assert.equal(
  isLocalAuthAccountAllowedForCamelotProfile("qa-adaptive-quality", fixtureEnv()),
  false,
);
assert.equal(
  isLocalAuthAccountAllowedForCamelotProfile("qa-adaptive-quality", {
    ...fixtureEnv(),
    HITO_QA_FIXTURE_PROFILE: "",
  }),
  true,
);
assert.equal(CAMELOT_INTERACTIVE_QA_FIXTURE_VERSION, "camelot_interactive_qa_fixture_v1");
assert.deepEqual(QA_MANAGED_RUNTIME_SLOTS.qa_fixture, {
  host: "127.0.0.1",
  port: 3000,
  fixtureProfile: null,
});
assert.deepEqual(QA_MANAGED_RUNTIME_SLOTS.camelot, {
  host: "localhost",
  port: 3100,
  fixtureProfile: "camelot",
});
const regressionSlot = resolveQaManagedSlotPaths({ slot: "qa_fixture" });
const camelotSlot = resolveQaManagedSlotPaths({ slot: "camelot" });
assert.notEqual(regressionSlot.runtimeRoot, camelotSlot.runtimeRoot);
assert.notEqual(regressionSlot.statePath, camelotSlot.statePath);
assert.notEqual(regressionSlot.logPath, camelotSlot.logPath);
assert.notEqual(regressionSlot.leasePath, camelotSlot.leasePath);

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
for (const action of ["start", "status", "restart", "stop"]) {
  assert.match(packageJson.scripts[`qa:server:${action}`], /--slot qa_fixture/);
}
for (const action of ["start", "status", "reset", "stop"]) {
  assert.equal(
    packageJson.scripts[`camelot:${action}`],
    `node ./scripts/camelot-interactive-qa.mjs ${action}`,
  );
}

const serverLifecycleSource = await readFile("scripts/qa-local-server.mjs", "utf8");
assert.match(serverLifecycleSource, /publishManagedSlotArtifact/);
assert.match(serverLifecycleSource, /--slot <qa_fixture\|camelot>/);
const cleanBuildSource = await readFile("scripts/clean-build-output.mjs", "utf8");
assert.doesNotMatch(cleanBuildSource, /qa-local-server\.mjs["', ]+stop/);
const camelotLifecycleSource = await readFile("scripts/camelot-interactive-qa.mjs", "utf8");
assert.match(camelotLifecycleSource, /"--slot",\s*"camelot"/);
assert.doesNotMatch(camelotLifecycleSource, /configure-local-supabase-env\.mjs", "--stop"/);

const uploadRoute = await readFile("src/routes/api.workout-result.upload.tsx", "utf8");
const interceptorIndex = uploadRoute.indexOf("interceptCamelotSelectedActivityFile");
const realIngestIndex = uploadRoute.indexOf("await ingestGarminWorkoutResult");
assert.ok(interceptorIndex >= 0 && realIngestIndex > interceptorIndex);
const ingestSource = await readFile(
  "src/lib/workout-result-import/ingest-garmin-result.ts",
  "utf8",
);
const interceptorSource = ingestSource.slice(
  ingestSource.indexOf("export async function interceptCamelotSelectedActivityFile"),
  ingestSource.indexOf("export async function ingestLocalQaFixtureWorkoutResult"),
);
assert.doesNotMatch(interceptorSource, /arrayBuffer\s*\(/);

const hostedAttempt = spawnSync(process.execPath, ["scripts/test-user.mjs", "camelot-status"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-value",
    SUPABASE_SECRET_KEY: "secret-test-value",
  },
  encoding: "utf8",
});
assert.notEqual(hostedAttempt.status, 0);
assert.match(hostedAttempt.stderr, /Refusing hosted test-user access/);
assert.doesNotMatch(hostedAttempt.stderr, /secret-test-value|public-test-value/);

const realProfileAttempt = spawnSync(
  process.execPath,
  [
    "scripts/qa-local-server.mjs",
    "help",
    "--provider-mode",
    "real",
    "--fixture-profile",
    "camelot",
  ],
  { cwd: process.cwd(), encoding: "utf8" },
);
assert.notEqual(realProfileAttempt.status, 0);
assert.match(realProfileAttempt.stderr, /requires --provider-mode qa_fixture/);

console.log("Camelot interactive QA fixture contract validated.");

function runtime(
  override: Record<string, string | undefined> = {},
): Parameters<typeof evaluateCamelotRuntimeBoundary>[0] {
  return {
    authProvider: "local",
    appBaseUrl: "http://127.0.0.1:3000",
    supabaseUrl: "http://127.0.0.1:54321",
    env: { ...fixtureEnv(), ...override },
  };
}

function fixtureEnv() {
  return {
    HITO_QA_FIXTURE_PROFILE: "camelot",
    HITO_AI_GENERATED_PLAN_PROVIDER_MODE: "qa_fixture",
    HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
  };
}
