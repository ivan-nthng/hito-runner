import { readFile } from "node:fs/promises";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import { serverEnv } from "../src/lib/supabase/env";
import { applyImportedPlanForUser } from "../src/lib/active-plan-persistence";
import { generateCanonicalPlanFromText } from "../src/lib/openai-plan-authoring";
import { buildPlanScopedStructuredAuthoringMetadata } from "../src/lib/plan-authoring-snapshot";
import { RICH_WORKOUT_DRAFT_SCHEMA_VERSION } from "../src/lib/rich-workout-draft-authoring";
import { buildStructuredAuthoringPlan } from "../src/lib/structured-plan-authoring";
import type { FirstDayResolution } from "../src/lib/plan-apply-policy";
import type { TrainingPlanV2 } from "../src/lib/imported-plan";

type ParsedArgs = Record<string, string | true>;

const options = parseArgs(process.argv.slice(2));

if (hasFlag(options, "help")) {
  printHelp();
  process.exit(0);
}

const dryRun = hasFlag(options, "dry-run");
const useMockOpenAi = hasFlag(options, "mock-openai");
const enableRichWorkoutDraft = hasFlag(options, "rich-draft");
const timeoutMs = parsePositiveIntegerOption(options["timeout-ms"], "--timeout-ms");
const authoringText = await readAuthoringText(options);
const email = dryRun
  ? normalizeEmail(stringOption(options.email))
  : normalizeEmail(requireOption(options.email, "--email"));
const firstDayResolution = parseFirstDayResolution(options["first-day-resolution"]);
const requestedStartDate = stringOption(options["requested-start-date"]);
const restoreFunctions = [
  useMockOpenAi ? installMockOpenAi() : null,
  timeoutMs ? installFetchTimeout(timeoutMs) : null,
].filter((restore): restore is () => void => Boolean(restore));

try {
  const generatedPlan = await generateCanonicalPlanFromText(authoringText, {
    enableRichWorkoutDraft,
  });
  const sampleWorkout = buildSampleWorkoutSummary(generatedPlan.canonicalPlan);
  const baseOutput = {
    ok: true,
    dryRun,
    mockOpenAi: useMockOpenAi,
    richDraftRequested: enableRichWorkoutDraft,
    richDraftStatus: generatedPlan.richDraftMetadata.status,
    fallbackStatus:
      generatedPlan.richDraftMetadata.status === "deterministic_fallback" ? "used" : "not_used",
    richDraftFallbackReason: generatedPlan.richDraftMetadata.fallbackReason,
    workoutCount: generatedPlan.canonicalPlan.planned_workouts.length,
    nonRestWorkoutCount: generatedPlan.canonicalPlan.planned_workouts.filter(
      (workout) => workout.workout_type !== "rest",
    ).length,
    model: generatedPlan.model,
    responseId: generatedPlan.responseId,
    richDraftResponseId: generatedPlan.richDraftResponseId,
    sourceKind: generatedPlan.canonicalPlan.source_kind,
    schemaVersion: generatedPlan.canonicalPlan.schema_version,
    sampleWorkout,
  };

  if (dryRun) {
    console.log(JSON.stringify(baseOutput, null, 2));
  } else {
    const userId = await findAuthUserIdByEmail(email);

    if (!userId) {
      throw new Error(`Supabase auth user not found for ${email}. Create the tester first.`);
    }

    const applyResult = await applyImportedPlanForUser(
      userId,
      generatedPlan.canonicalPlan,
      firstDayResolution,
      requestedStartDate,
      null,
      buildPlanScopedStructuredAuthoringMetadata({
        source: "text_authoring",
        authoringInput: generatedPlan.authoringInput,
        reviewAssumptions: generatedPlan.richDraftMetadata.reviewAssumptions,
      }),
    );
    const persistedReadback = applyResult.ok ? await readPersistedPlanPreview(userId) : null;

    console.log(
      JSON.stringify(
        {
          ...baseOutput,
          email,
          applyResult: summarizeApplyResult(applyResult),
          activePlan: persistedReadback?.activePlan ?? null,
          previewWorkouts: persistedReadback?.previewWorkouts ?? [],
        },
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        dryRun,
        mockOpenAi: useMockOpenAi,
        richDraftRequested: enableRichWorkoutDraft,
        errorReason: classifyScriptError(error),
        message: boundedErrorMessage(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  for (const restore of restoreFunctions.reverse()) {
    restore();
  }
}

async function readAuthoringText(cliOptions: ParsedArgs) {
  const prompt = stringOption(cliOptions.prompt);

  if (prompt) {
    return prompt;
  }

  const promptFile = stringOption(cliOptions["prompt-file"]);

  if (promptFile) {
    return (await readFile(promptFile, "utf8")).trim();
  }

  throw new Error("Provide --prompt or --prompt-file.");
}

async function findAuthUserIdByEmail(targetEmail: string | null) {
  if (!targetEmail) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const matched = data.users.find((user) => normalizeEmail(user.email) === targetEmail) ?? null;

    if (matched) {
      return matched.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function readPersistedPlanPreview(userId: string) {
  const supabase = createAdminSupabaseClient();
  const activePlan = await supabase
    .from("plan_cycles")
    .select("id, title, start_date, end_date, source_template")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activePlan.error) {
    throw new Error(activePlan.error.message);
  }

  if (!activePlan.data) {
    return null;
  }

  const previewWorkouts = await supabase
    .from("planned_workouts")
    .select(
      "id, workout_date, title, workout_type, workout_family, workout_identity, calendar_icon_key",
    )
    .eq("plan_cycle_id", activePlan.data.id)
    .order("workout_date", { ascending: true })
    .limit(3);

  if (previewWorkouts.error) {
    throw new Error(previewWorkouts.error.message);
  }

  return {
    activePlan: activePlan.data,
    previewWorkouts: previewWorkouts.data,
  };
}

function buildSampleWorkoutSummary(plan: TrainingPlanV2) {
  const sample =
    plan.planned_workouts.find((workout) => workout.workout_type !== "rest") ??
    plan.planned_workouts[0];

  if (!sample) {
    return null;
  }

  const segmentTypes = sample.segments.map((segment) => segment.segment_type);

  return {
    date: sample.date,
    title: sample.title,
    workoutFamily: sample.workout_family ?? null,
    workoutIdentity: sample.workout_identity ?? null,
    calendarIconKey: sample.calendar_icon_key ?? null,
    segmentCount: sample.segments.length,
    segmentPresence: {
      warmup: segmentTypes.includes("warmup"),
      main: segmentTypes.some((segmentType) =>
        ["main", "tempo_block", "interval_block", "strides"].includes(segmentType),
      ),
      cooldown: segmentTypes.includes("cooldown"),
    },
  };
}

function summarizeApplyResult(result: Awaited<ReturnType<typeof applyImportedPlanForUser>>) {
  if (result.ok) {
    return result;
  }

  return {
    ok: false,
    status: result.status,
    reason: result.reason,
    effectiveStartDate: result.effectiveStartDate,
    normalizedFromStartDate: result.normalizedFromStartDate,
    conflict: result.conflict,
  };
}

function installMockOpenAi() {
  const originalFetch = globalThis.fetch;
  const originalOpenAiApiKey = serverEnv.openAiApiKey;
  const originalOpenAiPlanModel = serverEnv.openAiPlanModel;
  const fixtureAuthoringInput = buildMockAuthoringInput();
  const fixturePlan = buildStructuredAuthoringPlan(fixtureAuthoringInput);

  serverEnv.openAiApiKey = "mock-openai-key";
  serverEnv.openAiPlanModel = "mock-openai-model";
  globalThis.fetch = (async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      text?: { format?: { name?: string } };
    };
    const schemaName = body.text?.format?.name ?? "unknown";

    if (schemaName === "structured_plan_authoring_input") {
      return openAiFixtureResponse("mock-structured-response", fixtureAuthoringInput);
    }

    if (schemaName === "rich_workout_draft") {
      return openAiFixtureResponse("mock-rich-response", buildMockRichWorkoutDraft(fixturePlan));
    }

    return new Response(
      JSON.stringify({
        error: { message: `Unexpected mock OpenAI schema request: ${schemaName}` },
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
    serverEnv.openAiApiKey = originalOpenAiApiKey;
    serverEnv.openAiPlanModel = originalOpenAiPlanModel;
  };
}

function installFetchTimeout(timeoutMs: number) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await originalFetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

function buildMockAuthoringInput() {
  return {
    goal: {
      goalType: "10k",
      goalLabel: "10K · Balanced",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: "10K plan",
    },
    schedule: {
      startDate: "2026-05-25",
      targetDate: null,
      preparationHorizonWeeks: 8,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 4,
      baselineLongRunKm: 9,
      baselineLongRunDurationMin: null,
      age: 34,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:00.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:00", resultDate: null }],
      recent5kPaceSecondsPerKm: 288,
      currentEasyPaceRange: "6:20-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Saturday"],
      unavailableDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    constraints: {
      injuryConstraints: [],
      hardConstraints: [],
    },
    preferences: {
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Mock OpenAI fixture for text authoring ops validation.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  } satisfies Parameters<typeof buildStructuredAuthoringPlan>[0];
}

function buildMockRichWorkoutDraft(plan: TrainingPlanV2) {
  return {
    schemaVersion: RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
    assumptions: ["Mock rich draft kept Hito's deterministic rest days and metric gates."],
    workouts: plan.planned_workouts.map((workout) => {
      if (workout.workout_type === "rest") {
        return {
          workoutId: workout.workout_id,
          date: workout.date,
          workoutFamily: "rest",
          workoutIdentity: "rest_and_recovery",
          calendarIconKey: "rest",
          title: workout.title,
          summary: workout.summary,
          goalContext: toDraftGoalContext(workout),
          metricMode: toDraftMetricMode(workout),
          segments: [
            {
              segmentId: `${workout.workout_id}_mock_rest`,
              segmentType: "rest",
              label: "Rest",
              sequence: 1,
              prescription: emptyDraftPrescription("none"),
              guidance: "No running scheduled.",
              target: emptyDraftTarget(),
            },
          ],
        };
      }

      return {
        workoutId: workout.workout_id,
        date: workout.date,
        workoutFamily: workout.workout_family ?? "easy",
        workoutIdentity: workout.workout_identity ?? "easy_aerobic_run",
        calendarIconKey: workout.calendar_icon_key ?? "easy",
        title: `Ops rich ${workout.title}`,
        summary: `Ops smoke rich structure for ${workout.title}.`,
        goalContext: toDraftGoalContext(workout),
        metricMode: toDraftMetricMode(workout),
        segments: [
          buildDraftSegment(workout, "warmup", 1, "Warmup", 8),
          buildDraftSegment(workout, "main", 2, "Main work", 24),
          buildDraftSegment(workout, "cooldown", 3, "Cooldown", 6),
        ],
      };
    }),
  };
}

function buildDraftSegment(
  workout: TrainingPlanV2["planned_workouts"][number],
  segmentType: "warmup" | "main" | "cooldown",
  sequence: number,
  label: string,
  durationMin: number,
) {
  return {
    segmentId: `${workout.workout_id}_mock_${sequence}`,
    segmentType,
    label,
    sequence,
    prescription: {
      mode: "time",
      durationMin,
      distanceKm: null,
      repeatCount: null,
    },
    guidance: `${label} with clear effort control.`,
    target: {
      ...emptyDraftTarget(),
      intensity: segmentType === "main" ? "controlled effort" : "easy",
      cue: segmentType === "main" ? "Stay smooth and purposeful." : "Keep it relaxed.",
      hint: segmentType === "cooldown" ? "Finish conversational." : "Let breathing guide effort.",
    },
  };
}

function toDraftGoalContext(workout: TrainingPlanV2["planned_workouts"][number]) {
  return {
    goalType: workout.goal_context?.goal_type ?? "10k",
    goalStyle: workout.goal_context?.goal_style ?? null,
    terrainFocus: workout.goal_context?.terrain_focus ?? "standard",
    targetDate: workout.goal_context?.target_date ?? null,
    targetTime: workout.goal_context?.target_time ?? null,
  };
}

function toDraftMetricMode(workout: TrainingPlanV2["planned_workouts"][number]) {
  return {
    guidance: workout.metric_mode?.guidance ?? "effort",
    paceTargetsAllowed: workout.metric_mode?.pace_targets_allowed ?? false,
    hrTargetsAllowed: workout.metric_mode?.hr_targets_allowed ?? false,
    reason: workout.metric_mode?.reason ?? "Mock metric mode mirrors deterministic truth.",
  };
}

function emptyDraftPrescription(mode: "time" | "distance" | "repeats" | "none") {
  return {
    mode,
    durationMin: null,
    distanceKm: null,
    repeatCount: null,
  };
}

function emptyDraftTarget() {
  return {
    intensity: null,
    rpe: null,
    cue: null,
    hint: null,
    paceMinPerKmRange: null,
    pace: null,
    hrBpmRange: null,
    hrBpm: null,
  };
}

function openAiFixtureResponse(responseId: string, payload: unknown) {
  return new Response(
    JSON.stringify({
      id: responseId,
      output_text: JSON.stringify(payload),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function parseFirstDayResolution(value: string | true | undefined): FirstDayResolution | null {
  if (value == null || value === true) {
    return null;
  }

  if (value === "replace_first_day" || value === "ignore_first_day") {
    return value;
  }

  throw new Error("--first-day-resolution must be replace_first_day or ignore_first_day.");
}

function parsePositiveIntegerOption(value: string | true | undefined, label: string) {
  if (value == null || value === true) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = args[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function hasFlag(options: ParsedArgs, key: string) {
  const value = options[key];

  return value === true || value === "true" || value === "1";
}

function requireOption(value: string | true | undefined, label: string) {
  const normalized = stringOption(value);

  if (!normalized) {
    throw new Error(`Missing required option: ${label}.`);
  }

  return normalized;
}

function stringOption(value: string | true | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function classifyScriptError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "openai_request_timeout";
  }

  return "text_authoring_failed";
}

function boundedErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Text authoring failed.";
  return message.trim().slice(0, 240) || "Text authoring failed.";
}

function printHelp() {
  console.log(
    [
      "Usage:",
      '  npm run author-plan-from-text -- --dry-run --mock-openai --prompt "Create a balanced 10K plan"',
      '  npm run author-plan-from-text -- --dry-run --rich-draft --prompt "Create a balanced 10K plan"',
      '  npm run author-plan-from-text -- --email tester@example.com --rich-draft --prompt "Create a balanced 10K plan"',
      "",
      "Options:",
      "  --rich-draft             Opt into the TS OpenAI rich workout draft seam.",
      "  --dry-run                Generate and report bounded metadata without persisting.",
      "  --mock-openai            Use deterministic mock OpenAI responses for local validation.",
      "  --email <email>          Supabase auth user email for persistence mode.",
      "  --prompt <text>          Free-text plan request.",
      "  --prompt-file <path>     File containing free-text plan request.",
      "  --first-day-resolution   replace_first_day or ignore_first_day for conflicts.",
      "  --requested-start-date   Optional YYYY-MM-DD apply start date.",
      "  --timeout-ms             Optional per-OpenAI-call timeout for bounded live smoke.",
    ].join("\n"),
  );
}
