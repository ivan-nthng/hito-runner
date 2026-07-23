import { readFile } from "node:fs/promises";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import { AI_AUTHORED_PLAN_FIRST_SOURCE_KIND } from "../src/lib/ai-authored-plan-first-compiler";
import { selectedDistanceEndpointMainDistanceMeters } from "../src/lib/plan-creation-engine";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "../src/lib/structured-plan-authoring-schema";
import {
  hasFlag,
  parseArgs,
  parseFixtureKind,
  parsePositiveIntegerOption,
  printHelp,
  resolveMode,
  stringOption,
  type FixtureKind,
  type ScriptMode,
} from "./ai-first-plan-draft-ops/cli";
import { buildDefaultAuthoringInput } from "./ai-first-plan-draft-ops/fixtures";

const options = parseArgs(process.argv.slice(2));

if (hasFlag(options, "help")) {
  printHelp();
  process.exit(0);
}

const mode = resolveMode(options);
const fixtureKind = parseFixtureKind(options.fixture);
const inputFile = stringOption(options["input-file"]);
const inputSource = inputFile ? "input_file" : "fixture";
const fixtureLabel = inputFile ? null : fixtureKind;
const input = await readInput(options, fixtureKind);
const authoringInput = structuredPlanAuthoringInputSchema.parse(input);
const timeoutMs = parsePositiveIntegerOption(options["timeout-ms"]) ?? 45_000;
const maxOutputTokens = parsePositiveIntegerOption(options["max-output-tokens"]) ?? 32_000;
const requirePlanFirstProof = hasFlag(options, "require-plan-first-proof");
const fetchImpl = mode === "live" ? undefined : buildMockOpenAiFetch(mode, authoringInput);

const result = await generateAiFirstPlanDraftPreview({
  input,
  timeoutMs,
  maxOutputTokens,
  apiKey: mode === "live" ? undefined : "mock-openai-key",
  model: mode === "live" ? undefined : AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  fetchImpl,
});

if (!result.ok) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        mode,
        contractMode: "plan_first",
        inputSource,
        fixture: fixtureLabel,
        reason: result.reason,
        message: "message" in result ? result.message : undefined,
        issues: result.issues,
        sourceKind: "metadata" in result ? result.metadata.sourceKind : undefined,
        sourceStatus: "metadata" in result ? result.metadata.sourceStatus : undefined,
        unavailableReason: "metadata" in result ? result.metadata.unavailableReason : undefined,
        validationIssueCount:
          "metadata" in result ? result.metadata.validationIssueCount : result.issues.length,
        model: "metadata" in result ? result.metadata.model : undefined,
        responseId: "metadata" in result ? result.metadata.responseId : undefined,
        elapsedMs: "metadata" in result ? result.metadata.elapsedMs : undefined,
        debug: "metadata" in result ? result.metadata.debug : undefined,
      },
      null,
      2,
    ),
  );
  process.exitCode = result.reason === "structured_input_invalid" || requirePlanFirstProof ? 1 : 0;
} else {
  const proof = buildPlanFirstProof(result.canonicalPlan);
  const proofOk = !requirePlanFirstProof || proof.ok;

  console.log(
    JSON.stringify(
      {
        ok: proofOk,
        mode,
        contractMode: "plan_first",
        inputSource,
        fixture: fixtureLabel,
        persisted: false,
        planName: result.canonicalPlan.plan_name,
        schemaVersion: result.canonicalPlan.schema_version,
        sourceKind: result.canonicalPlan.source_kind,
        sourceStatus: result.metadata.status,
        reason: proofOk ? undefined : "plan_first_proof_failed",
        issues: proofOk ? undefined : proof.issues,
        validationIssueCount: result.metadata.validationIssueCount,
        validationIssues: result.metadata.validationIssues.slice(0, 6),
        model: result.metadata.model,
        responseId: result.metadata.responseId,
        elapsedMs: result.metadata.elapsedMs,
        debug: result.metadata.debug,
        workoutCount: result.canonicalPlan.planned_workouts.length,
        weekCount: countWeeks(result.canonicalPlan),
        sampleWeeks: buildSampleWeeks(result.canonicalPlan),
        planFirstProof: proof,
      },
      null,
      2,
    ),
  );
  process.exitCode = proofOk ? 0 : 1;
}

async function readInput(
  parsedOptions: Record<string, string | true>,
  parsedFixtureKind: FixtureKind,
) {
  const inputFile = stringOption(parsedOptions["input-file"]);
  if (inputFile) {
    return JSON.parse(await readFile(inputFile, "utf8")) as unknown;
  }

  return buildDefaultAuthoringInput(parsedFixtureKind);
}

function buildMockOpenAiFetch(
  parsedMode: Exclude<ScriptMode, "live">,
  authoringInput: StructuredPlanAuthoringInput,
): typeof fetch {
  if (parsedMode === "mock_timeout") {
    return async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("The operation was aborted."), { name: "AbortError" }));
        });
      });
  }

  if (parsedMode === "mock_invalid") {
    return async () =>
      new Response(
        JSON.stringify({
          id: "mock-invalid-plan-first",
          status: "completed",
          output_text: JSON.stringify({
            workouts: [],
            endpoint: null,
          }),
          usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
  }

  return buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput,
    today: authoringInput.schedule.startDate,
  });
}

function buildPlanFirstProof(
  plan: Awaited<ReturnType<typeof generateAiFirstPlanDraftPreview>> extends {
    ok: true;
    canonicalPlan: infer Plan;
  }
    ? Plan
    : never,
) {
  const endpointWorkout = plan.planned_workouts.find(
    (workout) => workout.source_workout_type === "final_selected_distance_day",
  );
  const repeatCount = plan.planned_workouts.reduce(
    (total, workout) =>
      total + workout.segments.filter((segment) => segment.prescription.mode === "repeats").length,
    0,
  );
  const targetProof = buildExecutionTargetProof(plan);
  const issues: string[] = [];

  if (plan.source_kind !== AI_AUTHORED_PLAN_FIRST_SOURCE_KIND) {
    issues.push(`Expected source_kind ${AI_AUTHORED_PLAN_FIRST_SOURCE_KIND}.`);
  }
  if (plan.goal.goal_type !== "distance_goal" || !plan.goal.distance_meters) {
    issues.push("Expected distance_goal with distance_meters.");
  }
  if (!endpointWorkout) {
    issues.push("Missing final selected-distance endpoint workout.");
  }
  if (
    endpointWorkout &&
    selectedDistanceEndpointMainDistanceMeters({
      endpointKind: endpointWorkout.source_workout_type,
      segments: endpointWorkout.segments,
    }) == null
  ) {
    issues.push("Endpoint workout does not expose selected distance truth.");
  }
  if (repeatCount <= 0) {
    issues.push("No ordered repeat structures survived compilation.");
  }
  if (targetProof.runnableLeafCount <= 0) {
    issues.push("No runnable leaves survived compilation.");
  }
  if (targetProof.invalidRunnableLeafCount > 0) {
    issues.push(
      `${targetProof.invalidRunnableLeafCount} runnable leaves lack one exclusive numeric pace or BPM target.`,
    );
  }
  if (targetProof.targetedRepeatParentCount > 0) {
    issues.push(`${targetProof.targetedRepeatParentCount} Repeat parents own executable targets.`);
  }
  if (targetProof.invalidHydrationCount > 0) {
    issues.push(`${targetProof.invalidHydrationCount} Hydration steps own executable truth.`);
  }
  return {
    ok: issues.length === 0,
    issues,
    endpoint: endpointWorkout
      ? {
          date: endpointWorkout.date,
          distanceMeters: selectedDistanceEndpointMainDistanceMeters({
            endpointKind: endpointWorkout.source_workout_type,
            segments: endpointWorkout.segments,
          }),
        }
      : null,
    repeatCount,
    ...targetProof,
  };
}

function buildExecutionTargetProof(plan: Parameters<typeof buildPlanFirstProof>[0]) {
  let runnableLeafCount = 0;
  let paceLeafCount = 0;
  let heartRateLeafCount = 0;
  let invalidRunnableLeafCount = 0;
  let targetedRepeatParentCount = 0;
  let hydrationCount = 0;
  let invalidHydrationCount = 0;

  const inspectTarget = (target: Record<string, unknown> | undefined) => {
    runnableLeafCount += 1;
    const mode = target?.primary_execution_mode;
    const pace = typeof target?.pace === "string" && target.pace.length > 0;
    const bpm = typeof target?.hr_bpm_range === "string" && target.hr_bpm_range.length > 0;
    const valid = (mode === "pace" && pace && !bpm) || (mode === "heart_rate" && bpm && !pace);

    if (!valid) {
      invalidRunnableLeafCount += 1;
      return;
    }
    if (mode === "pace") paceLeafCount += 1;
    if (mode === "heart_rate") heartRateLeafCount += 1;
  };

  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      if (segment.segment_type === "rest") continue;
      if (segment.segment_type === "fueling") {
        hydrationCount += 1;
        if (segment.prescription.mode !== "none" || segment.target || segment.recovery_target) {
          invalidHydrationCount += 1;
        }
        continue;
      }
      if (segment.prescription.mode === "repeats") {
        if (segment.target || segment.recovery_target) targetedRepeatParentCount += 1;
        for (const child of segment.prescription.children ?? []) {
          inspectTarget(child.target as Record<string, unknown> | undefined);
        }
        continue;
      }
      inspectTarget(segment.target as Record<string, unknown> | undefined);
    }
  }

  return {
    runnableLeafCount,
    paceLeafCount,
    heartRateLeafCount,
    invalidRunnableLeafCount,
    targetedRepeatParentCount,
    hydrationCount,
    invalidHydrationCount,
  };
}

function countWeeks(plan: Parameters<typeof buildSampleWeeks>[0]) {
  return new Set(plan.planned_workouts.map((workout) => workout.week_number)).size;
}

function buildSampleWeeks(plan: {
  planned_workouts: Array<{
    week_number: number;
    date: string;
    workout_type: string;
    workout_identity?: string;
    source_workout_type?: string;
    title?: string;
  }>;
}) {
  return Array.from(new Set(plan.planned_workouts.map((workout) => workout.week_number)))
    .slice(0, 3)
    .map((weekNumber) => ({
      weekNumber,
      workouts: plan.planned_workouts
        .filter((workout) => workout.week_number === weekNumber)
        .map((workout) => ({
          date: workout.date,
          type: workout.workout_type,
          identity: workout.workout_identity ?? workout.source_workout_type,
          title: workout.title,
        })),
    }));
}
