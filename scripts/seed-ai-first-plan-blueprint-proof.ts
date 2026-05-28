import type { User } from "@supabase/supabase-js";
import {
  createFirstPlanFromReviewedCanonicalPlanForUser,
  type PersistedPlannedWorkoutRow,
} from "../src/lib/active-plan-persistence";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import type { TrainingPlanV2 } from "../src/lib/imported-plan";
import { buildPlanScopedStructuredAuthoringMetadata } from "../src/lib/plan-authoring-snapshot";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";
import {
  buildStructuredFirstPlanDraftReview,
  buildStructuredFirstPlanProfilePatch,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanAuthoringInput,
  type StructuredFirstPlanOnboardingInput,
} from "../src/lib/structured-first-plan-onboarding";
import { structuredPlanAuthoringInputSchema } from "../src/lib/structured-plan-authoring";

type ParsedArgs = Record<string, string | true>;

const VISUAL_PROOF_SOURCE_KIND = "ai_first_plan_blueprint_v1";
const VISUAL_PROOF_REQUIRED_IDENTITY = "marathon_steady_specificity";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_TIMEOUT_MS = 240_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 20_000;
const DEFAULT_ATTEMPTS = 1;

const options = parseArgs(process.argv.slice(2));

if (hasFlag(options, "help")) {
  printHelp();
  process.exit(0);
}

const config = buildConfig(options);
const supabase = createAdminSupabaseClient();
const user = await findAuthUserByEmail(config.email);

if (!user) {
  throw new Error(
    `No Supabase auth user found for ${config.email}. Create one first with:\n${buildCreateCommand(
      config,
    )}`,
  );
}

const existingActivePlan = await getActivePlanSummary(user.id);

if (existingActivePlan) {
  throw new Error(
    [
      `Disposable tester ${config.email} already has active plan ${existingActivePlan.id}.`,
      "Reset or delete the tester before seeding this visual proof.",
      `Reset: npm run test-user -- reset --email ${config.email}`,
      `Delete: ${buildCleanupCommand(config.email)}`,
    ].join("\n"),
  );
}

const onboardingInput = buildMarathonVisualProofOnboardingInput();
const authoringInput = buildMarathonVisualProofAuthoringInput();
const generation = await generateAcceptedBlueprint({ authoringInput, config });

const reviewedPlan = generation.result.canonicalPlan;
const review = buildStructuredFirstPlanDraftReview(onboardingInput, reviewedPlan, authoringInput);
const profilePatch = buildStructuredFirstPlanProfilePatch(onboardingInput);
const confirm = await countOpenAiRequests(async () =>
  createFirstPlanFromReviewedCanonicalPlanForUser(
    user.id,
    reviewedPlan,
    profilePatch,
    buildPlanScopedStructuredAuthoringMetadata({
      source: "ai_first_plan_blueprint",
      authoringInput,
      goalStyle: authoringInput.goal.goalStyle,
      targetTime: authoringInput.goal.targetTime,
      metricPolicySummary:
        generation.result.metadata.metricPolicySummary ?? review.planShape.metricPolicy,
      reviewAssumptions:
        generation.result.metadata.reviewAssumptions.length > 0
          ? generation.result.metadata.reviewAssumptions
          : review.assumptions,
    }),
  ),
);
const persisted = await loadPersistedProof(user.id);
const verification = verifyPersistedProof({
  reviewedPlan,
  persistedRows: persisted.workouts,
  persistedSourceKind: persisted.plan.source_kind,
});

if (!verification.ok) {
  throw new Error(
    [
      "Saved blueprint visual proof failed post-save verification.",
      ...verification.issues,
      `Cleanup: ${buildCleanupCommand(config.email)}`,
    ].join("\n"),
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      action: "seed_ai_first_plan_blueprint_visual_proof",
      persisted: true,
      proofKind: "bounded_visual_fixture",
      fixture: config.fixture,
      fixtureNote:
        "This is an 8-week ops visual-proof fixture, not the full default marathon horizon.",
      tester: {
        email: config.email,
        username: config.username,
        password: config.password,
        authUserId: user.id,
        loginPath: "/login",
      },
      cleanupCommand: buildCleanupCommand(config.email),
      createCommand: buildCreateCommand(config),
      modelPolicy: {
        recommendedModel: DEFAULT_MODEL,
        modelUsed: generation.result.metadata.model,
        timeoutMs: config.timeoutMs,
        maxOutputTokens: config.maxOutputTokens,
        attempts: config.attempts,
        attemptUsed: generation.attempt,
        elapsedMs: generation.result.metadata.elapsedMs,
      },
      reviewed: {
        planName: reviewedPlan.plan_name,
        sourceKind: reviewedPlan.source_kind,
        sourceStatus: generation.result.metadata.status,
        fallbackReason: generation.result.metadata.fallbackReason,
        validationIssueCount: generation.result.metadata.validationIssueCount,
        deterministicFallbackBoundary: generation.result.metadata.blueprintTrace
          ?.deterministicFallbackBoundary ?? {
          used: false,
          reason: null,
        },
        rowCount: reviewedPlan.planned_workouts.length,
        startDate: reviewedPlan.start_date,
        endDate: reviewedPlan.planned_workouts.at(-1)?.date ?? reviewedPlan.target_date ?? null,
        identityCounts: countPlanIdentities(reviewedPlan),
        firstEightWeeks: summarizePlanWeeks(reviewedPlan),
      },
      persistedPlan: {
        id: persisted.plan.id,
        title: persisted.plan.title,
        sourceKind: persisted.plan.source_kind,
        startDate: persisted.plan.start_date,
        endDate: persisted.plan.end_date,
        targetDate: persisted.plan.target_date,
        rowCount: persisted.workouts.length,
        richRowCount: verification.richRowCount,
        nonRestRowsWithSteps: verification.nonRestRowsWithSteps,
        containsMarathonSteadySpecificity: verification.containsRequiredIdentity,
        identityCounts: countPersistedIdentities(persisted.workouts),
        firstEightWeeks: summarizePersistedWeeks(persisted.workouts),
      },
      exactness: {
        reviewedRowCountEqualsPersisted: verification.rowCountMatches,
        reviewedEndDateEqualsPersisted: verification.endDateMatches,
        reviewedRowsMatchPersistedRows: verification.rowsMatch,
        mismatches: verification.mismatches,
      },
      safety: {
        deterministicFallbackReintroduced: false,
        directAiPersistence: false,
        confirmOpenAiRequestCount: confirm.openAiRequestCount,
        fallbackAttempts: generation.failures,
      },
      applyResult: confirm.result,
    },
    null,
    2,
  ),
);

function buildConfig(args: ParsedArgs) {
  const email = requiredString(args.email, "--email");
  const username = optionalString(args.username);
  const password = optionalString(args.password);
  const fixture = optionalString(args.fixture) ?? "marathon-balanced-visual-proof";

  if (fixture !== "marathon-balanced-visual-proof") {
    throw new Error("--fixture currently supports only marathon-balanced-visual-proof.");
  }

  return {
    email,
    username,
    password,
    fixture,
    model: optionalString(args.model) ?? process.env.OPENAI_PLAN_MODEL ?? DEFAULT_MODEL,
    timeoutMs: positiveInteger(args["timeout-ms"], DEFAULT_TIMEOUT_MS, "--timeout-ms"),
    maxOutputTokens: positiveInteger(
      args["max-output-tokens"],
      DEFAULT_MAX_OUTPUT_TOKENS,
      "--max-output-tokens",
    ),
    attempts: positiveInteger(args.attempts, DEFAULT_ATTEMPTS, "--attempts"),
  };
}

async function generateAcceptedBlueprint({
  authoringInput,
  config,
}: {
  authoringInput: StructuredFirstPlanAuthoringInput;
  config: ReturnType<typeof buildConfig>;
}) {
  const failures: Array<{
    attempt: number;
    reason: string;
    sourceStatus?: string;
    fallbackReason?: string | null;
    elapsedMs?: number | null;
    validationIssueCount?: number;
    issues: string[];
  }> = [];

  for (let attempt = 1; attempt <= config.attempts; attempt += 1) {
    const result = await generateAiFirstPlanDraftPreview({
      input: authoringInput,
      inputKind: "structured_authoring",
      contractMode: "blueprint",
      allowDeterministicFallback: false,
      model: config.model,
      timeoutMs: config.timeoutMs,
      maxOutputTokens: config.maxOutputTokens,
      referenceExample: null,
    });

    if (!result.ok) {
      failures.push({
        attempt,
        reason: result.reason,
        sourceStatus: "metadata" in result ? result.metadata.sourceStatus : undefined,
        fallbackReason: "metadata" in result ? result.metadata.fallbackReason : null,
        elapsedMs: "metadata" in result ? result.metadata.elapsedMs : null,
        validationIssueCount:
          "metadata" in result ? result.metadata.validationIssueCount : result.issues.length,
        issues: result.issues.slice(0, 8),
      });
      continue;
    }

    const validationIssues = validateAcceptedVisualProof(result.canonicalPlan, result.metadata);

    if (validationIssues.length > 0) {
      failures.push({
        attempt,
        reason: "accepted_blueprint_not_visual_proof_ready",
        sourceStatus: result.metadata.status,
        fallbackReason: result.metadata.fallbackReason,
        elapsedMs: result.metadata.elapsedMs,
        validationIssueCount: result.metadata.validationIssueCount,
        issues: validationIssues,
      });
      continue;
    }

    return {
      attempt,
      result,
      failures,
    };
  }

  throw new Error(
    JSON.stringify(
      {
        ok: false,
        action: "seed_ai_first_plan_blueprint_visual_proof",
        reason: "blueprint_visual_proof_unavailable",
        message:
          "Live blueprint did not produce a saveable visual-proof plan. No plan was persisted.",
        model: config.model,
        timeoutMs: config.timeoutMs,
        maxOutputTokens: config.maxOutputTokens,
        attempts: config.attempts,
        failures,
      },
      null,
      2,
    ),
  );
}

function validateAcceptedVisualProof(
  plan: TrainingPlanV2,
  metadata: Awaited<ReturnType<typeof generateAiFirstPlanDraftPreview>> extends infer Result
    ? Result extends { ok: true; metadata: infer Metadata }
      ? Metadata
      : never
    : never,
) {
  const issues: string[] = [];
  const deterministicFallbackUsed =
    metadata.blueprintTrace?.deterministicFallbackBoundary.used ?? false;

  if (plan.source_kind !== VISUAL_PROOF_SOURCE_KIND) {
    issues.push(
      `source_kind was ${plan.source_kind ?? "missing"}, expected ${VISUAL_PROOF_SOURCE_KIND}.`,
    );
  }

  if (!["ai_authored", "repaired_ai_draft"].includes(metadata.status)) {
    issues.push(`sourceStatus was ${metadata.status}, expected ai_authored or repaired_ai_draft.`);
  }

  if (metadata.fallbackReason) {
    issues.push(`fallbackReason was ${metadata.fallbackReason}, expected null.`);
  }

  if (metadata.validationIssueCount !== 0) {
    issues.push(`validationIssueCount was ${metadata.validationIssueCount}, expected 0.`);
  }

  if (deterministicFallbackUsed) {
    issues.push("deterministicFallbackBoundary.used was true.");
  }

  if (
    !plan.planned_workouts.some(
      (workout) => workout.workout_identity === VISUAL_PROOF_REQUIRED_IDENTITY,
    )
  ) {
    issues.push(`Plan did not contain ${VISUAL_PROOF_REQUIRED_IDENTITY}.`);
  }

  return issues;
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const user =
      data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase()) ??
      null;

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function getActivePlanSummary(userId: string) {
  const { data, error } = await supabase
    .from("plan_cycles")
    .select("id, title, source_kind")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function loadPersistedProof(userId: string) {
  const { data: plan, error: planError } = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (planError) {
    throw new Error(planError.message);
  }

  const { data: workouts, error: workoutError } = await supabase
    .from("planned_workouts")
    .select(
      "id, plan_cycle_id, user_id, workout_date, weekday, week_number, phase, workout_type, source_workout_type, workout_family, workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes, planned_rpe, estimated_fatigue, recovery_priority, steps, display_order",
    )
    .eq("plan_cycle_id", plan.id)
    .order("workout_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (workoutError) {
    throw new Error(workoutError.message);
  }

  return {
    plan,
    workouts: workouts ?? [],
  };
}

function verifyPersistedProof({
  reviewedPlan,
  persistedRows,
  persistedSourceKind,
}: {
  reviewedPlan: TrainingPlanV2;
  persistedRows: PersistedPlannedWorkoutRow[];
  persistedSourceKind: string | null;
}) {
  const reviewedRows = [...reviewedPlan.planned_workouts].sort(compareReviewedWorkouts);
  const rowCountMatches = reviewedRows.length === persistedRows.length;
  const reviewedEndDate = reviewedRows.at(-1)?.date ?? null;
  const persistedEndDate = persistedRows.at(-1)?.workout_date ?? null;
  const endDateMatches = reviewedEndDate === persistedEndDate;
  const richRowCount = persistedRows.filter(hasPersistedRichFields).length;
  const nonRestRowCount = persistedRows.filter((workout) => workout.workout_type !== "rest").length;
  const nonRestRowsWithSteps = persistedRows.filter(
    (workout) => workout.workout_type !== "rest" && workout.steps.length > 0,
  ).length;
  const containsRequiredIdentity = persistedRows.some(
    (workout) => workout.workout_identity === VISUAL_PROOF_REQUIRED_IDENTITY,
  );
  const mismatches = buildRowMismatches(reviewedRows, persistedRows);
  const rowsMatch = mismatches.length === 0;
  const issues: string[] = [];

  if (persistedSourceKind !== VISUAL_PROOF_SOURCE_KIND) {
    issues.push(
      `Persisted plan source_kind was ${persistedSourceKind ?? "missing"}, expected ${VISUAL_PROOF_SOURCE_KIND}.`,
    );
  }

  if (!rowCountMatches) {
    issues.push(
      `Reviewed row count ${reviewedRows.length} did not equal persisted ${persistedRows.length}.`,
    );
  }

  if (!endDateMatches) {
    issues.push(
      `Reviewed end date ${reviewedEndDate ?? "missing"} did not equal persisted ${persistedEndDate ?? "missing"}.`,
    );
  }

  if (richRowCount !== persistedRows.length) {
    issues.push(`Only ${richRowCount}/${persistedRows.length} persisted rows have rich fields.`);
  }

  if (nonRestRowsWithSteps !== nonRestRowCount) {
    issues.push(
      `Only ${nonRestRowsWithSteps}/${nonRestRowCount} persisted non-rest rows have executable steps.`,
    );
  }

  if (!containsRequiredIdentity) {
    issues.push(`Persisted rows did not contain ${VISUAL_PROOF_REQUIRED_IDENTITY}.`);
  }

  if (!rowsMatch) {
    issues.push(`Reviewed/persisted row comparison found ${mismatches.length} mismatch(es).`);
  }

  return {
    ok: issues.length === 0,
    issues,
    rowCountMatches,
    endDateMatches,
    rowsMatch,
    mismatches,
    richRowCount,
    nonRestRowCount,
    nonRestRowsWithSteps,
    containsRequiredIdentity,
  };
}

function buildRowMismatches(
  reviewedRows: TrainingPlanV2["planned_workouts"],
  persistedRows: PersistedPlannedWorkoutRow[],
) {
  const mismatchCount = Math.max(reviewedRows.length, persistedRows.length);
  const mismatches: Array<{
    index: number;
    reviewed?: Record<string, unknown>;
    persisted?: Record<string, unknown>;
  }> = [];

  for (let index = 0; index < mismatchCount; index += 1) {
    const reviewed = reviewedRows[index];
    const persisted = persistedRows[index];

    if (!reviewed || !persisted) {
      mismatches.push({
        index,
        reviewed: reviewed ? summarizeReviewedWorkout(reviewed) : undefined,
        persisted: persisted ? summarizePersistedWorkout(persisted) : undefined,
      });
      continue;
    }

    const matches =
      reviewed.date === persisted.workout_date &&
      reviewed.week_number === persisted.week_number &&
      reviewed.weekday === persisted.weekday &&
      (reviewed.workout_family ?? null) === persisted.workout_family &&
      (reviewed.workout_identity ?? null) === persisted.workout_identity &&
      (reviewed.calendar_icon_key ?? null) === persisted.calendar_icon_key;

    if (!matches) {
      mismatches.push({
        index,
        reviewed: summarizeReviewedWorkout(reviewed),
        persisted: summarizePersistedWorkout(persisted),
      });
    }

    if (mismatches.length >= 8) {
      break;
    }
  }

  return mismatches;
}

function buildMarathonVisualProofOnboardingInput(): StructuredFirstPlanOnboardingInput {
  return parseStructuredFirstPlanOnboardingInput({
    profile: {
      age: 38,
      weightKg: 74,
      heightCm: 178,
    },
    benchmark: {
      kind: "recent_5k_time",
      recent5kTime: "24:30",
    },
    availability: {
      runningDaysPerWeek: 5,
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
    },
    goal: {
      goalDistance: "marathon",
      goalStyle: "balanced",
      terrainFocus: "standard",
      targetTime: null,
      targetDate: null,
    },
    strength: {
      preference: "mobility",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
    comment: "Disposable QA visual proof for the AI-authored blueprint marathon specificity path.",
  });
}

function buildMarathonVisualProofAuthoringInput(): StructuredFirstPlanAuthoringInput {
  return structuredPlanAuthoringInputSchema.parse({
    goal: {
      goalType: "marathon",
      goalLabel: "Marathon · Balanced visual proof",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: "Balanced marathon visual proof",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-07-26",
      preparationHorizonWeeks: 8,
    },
    runnerProfile: {
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 18,
      baselineLongRunDurationMin: null,
      age: 38,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary:
        "Currently running five days per week with a comfortable long run near 18 km.",
    },
    availability: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
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
      notes:
        "Ops-only visual proof fixture for saved ai_first_plan_blueprint_v1 marathon specificity.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  });
}

async function countOpenAiRequests<T>(operation: () => Promise<T>) {
  const originalFetch = globalThis.fetch;
  let openAiRequestCount = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes("api.openai.com")) {
      openAiRequestCount += 1;
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  try {
    const result = await operation();

    return {
      result,
      openAiRequestCount,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function hasPersistedRichFields(workout: PersistedPlannedWorkoutRow) {
  return Boolean(
    workout.workout_family &&
    workout.workout_identity &&
    workout.calendar_icon_key &&
    workout.goal_context &&
    workout.metric_mode,
  );
}

function compareReviewedWorkouts(
  left: TrainingPlanV2["planned_workouts"][number],
  right: TrainingPlanV2["planned_workouts"][number],
) {
  if (left.date !== right.date) {
    return left.date.localeCompare(right.date);
  }

  if (left.week_number !== right.week_number) {
    return left.week_number - right.week_number;
  }

  return left.title.localeCompare(right.title);
}

function summarizeReviewedWorkout(workout: TrainingPlanV2["planned_workouts"][number]) {
  return {
    date: workout.date,
    weekday: workout.weekday,
    weekNumber: workout.week_number,
    title: workout.title,
    sourceWorkoutType: workout.source_workout_type ?? null,
    workoutFamily: workout.workout_family ?? null,
    workoutIdentity: workout.workout_identity ?? null,
    calendarIconKey: workout.calendar_icon_key ?? null,
    segmentCount: workout.segments.length,
  };
}

function summarizePersistedWorkout(workout: PersistedPlannedWorkoutRow) {
  return {
    date: workout.workout_date,
    weekday: workout.weekday,
    weekNumber: workout.week_number,
    title: workout.title,
    sourceWorkoutType: workout.source_workout_type,
    workoutFamily: workout.workout_family,
    workoutIdentity: workout.workout_identity,
    calendarIconKey: workout.calendar_icon_key,
    segmentCount: workout.steps.length,
  };
}

function countPlanIdentities(plan: TrainingPlanV2) {
  return countBy(plan.planned_workouts, (workout) => workout.workout_identity ?? "unknown");
}

function countPersistedIdentities(workouts: PersistedPlannedWorkoutRow[]) {
  return countBy(workouts, (workout) => workout.workout_identity ?? "unknown");
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function summarizePlanWeeks(plan: TrainingPlanV2) {
  const byWeek = new Map<number, TrainingPlanV2["planned_workouts"]>();

  for (const workout of plan.planned_workouts) {
    byWeek.set(workout.week_number, [...(byWeek.get(workout.week_number) ?? []), workout]);
  }

  return [...byWeek.entries()]
    .sort(([left], [right]) => left - right)
    .slice(0, 8)
    .map(([weekNumber, workouts]) => ({
      weekNumber,
      identities: workouts.map(
        (workout) =>
          workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type,
      ),
      titles: workouts.map((workout) => workout.title),
    }));
}

function summarizePersistedWeeks(workouts: PersistedPlannedWorkoutRow[]) {
  const byWeek = new Map<number, PersistedPlannedWorkoutRow[]>();

  for (const workout of workouts) {
    byWeek.set(workout.week_number, [...(byWeek.get(workout.week_number) ?? []), workout]);
  }

  return [...byWeek.entries()]
    .sort(([left], [right]) => left - right)
    .slice(0, 8)
    .map(([weekNumber, weekWorkouts]) => ({
      weekNumber,
      identities: weekWorkouts.map(
        (workout) =>
          workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type,
      ),
      titles: weekWorkouts.map((workout) => workout.title),
    }));
}

function buildCleanupCommand(email: string) {
  return `npm run test-user -- delete --email ${email} --confirm-email ${email}`;
}

function buildCreateCommand(config: {
  email: string;
  username?: string | null;
  password?: string | null;
}) {
  const username = config.username ?? "qa-blueprint-visual";
  const password = config.password ?? "<choose-local-password>";

  return `npm run test-user -- create --email ${config.email} --username ${username} --password ${password}`;
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const entry = args[index];

    if (!entry.startsWith("--")) {
      throw new Error(`Unexpected argument: ${entry}`);
    }

    const key = entry.slice(2);
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

function requiredString(value: string | true | undefined, label: string) {
  const resolved = optionalString(value);

  if (!resolved) {
    throw new Error(`${label} is required.`);
  }

  return resolved;
}

function optionalString(value: string | true | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function positiveInteger(value: string | true | undefined, fallback: number, label: string) {
  const resolved = optionalString(value);

  if (!resolved) {
    return fallback;
  }

  const parsed = Number.parseInt(resolved, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function hasFlag(args: ParsedArgs, name: string) {
  return args[name] === true;
}

function printHelp() {
  console.log(`Seed a disposable saved ai_first_plan_blueprint_v1 visual proof plan.

Usage:
  npm run seed-ai-first-plan-blueprint-proof -- --email <tester-email> [options]

Required:
  --email <email>              Existing disposable tester Supabase auth email.

Options:
  --username <username>        Printed for QA browser login handoff.
  --password <password>        Printed for QA browser login handoff.
  --model <model>              OpenAI model. Default: OPENAI_PLAN_MODEL or ${DEFAULT_MODEL}.
  --timeout-ms <ms>            Blueprint request timeout. Default: ${DEFAULT_TIMEOUT_MS}.
  --max-output-tokens <n>      Max output tokens. Default: ${DEFAULT_MAX_OUTPUT_TOKENS}.
  --attempts <n>               Live blueprint attempts before failing. Default: ${DEFAULT_ATTEMPTS}.
  --fixture <name>             Only marathon-balanced-visual-proof is supported.

Create tester first:
  ${buildCreateCommand({
    email: "qa-blueprint-visual@local.test",
    username: "qa-blueprint-visual",
    password: "qa-blueprint-visual-pass",
  })}

Recommended visual proof:
  OPENAI_PLAN_MODEL=${DEFAULT_MODEL} npm run seed-ai-first-plan-blueprint-proof -- --email qa-blueprint-visual@local.test --username qa-blueprint-visual --password qa-blueprint-visual-pass --timeout-ms ${DEFAULT_TIMEOUT_MS} --max-output-tokens ${DEFAULT_MAX_OUTPUT_TOKENS}
`);
}
