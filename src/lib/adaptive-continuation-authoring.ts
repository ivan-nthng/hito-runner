import {
  compileAiAuthoredContinuationDetailedBlock,
  type AiAuthoredBlueprintSummary,
  type AiAuthoredContinuationCompileResult,
} from "@/lib/ai-authored-plan-first-compiler";
import {
  AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES,
  aiAuthoredDetailedBlockSchema,
  buildAiAuthoredPlanFirstOpenAiSchema,
} from "@/lib/ai-authored-plan-first-provider-contract";
import { resolveCanonicalWorkoutModel } from "@/lib/rich-workout-model";
import type {
  ContinuationDecisionInputV1,
  ContinuationDecisionResultV1,
} from "@/lib/adaptive-training-decision";
import type { StructuredPlanAuthoringInput } from "@/lib/structured-plan-authoring-schema";
import { z } from "zod";

export const ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION =
  "adaptive_continuation_authoring_brief_v2" as const;
export const ADAPTIVE_CONTINUATION_PROMPT_VERSION = "adaptive_continuation_prompt_v9" as const;
export const ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION =
  "adaptive_continuation_provider_response_v3" as const;
export const ADAPTIVE_CONTINUATION_COMPILER_VERSION = "adaptive_continuation_compiler_v5" as const;
export const ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME =
  "hito_adaptive_continuation_block_v1" as const;

const adaptiveContinuationProviderResponseSchema = z
  .object({
    contract_version: z.literal(ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION),
    detailed_block: aiAuthoredDetailedBlockSchema,
  })
  .strict();

export type AdaptiveContinuationProviderResponse = z.infer<
  typeof adaptiveContinuationProviderResponseSchema
>;

export interface AdaptiveContinuationAuthoringBriefV2 {
  version: typeof ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION;
  decision: Pick<
    Extract<ContinuationDecisionResultV1, { status: "authoring_ready" }>,
    | "version"
    | "policyVersion"
    | "status"
    | "authoringMode"
    | "interval"
    | "projectionIds"
    | "comparableContextKeys"
  > & {
    progress: {
      quality: Extract<
        ContinuationDecisionResultV1,
        { status: "authoring_ready" }
      >["fitnessProfile"]["quality"];
      explicitMissingReasons: string[];
      comparableContexts: Array<{
        contextKey: string;
        acceptedFitDayCount: number;
        compatibleRpeDayCount: number;
        detailChangeEligible: boolean;
      }>;
    };
  };
  blueprint: {
    id: string;
    version: number;
    sha256: string;
    selectedTargetDate: string;
  };
  predecessorConfirmationId: string;
  projections: ContinuationDecisionInputV1["projections"];
  constraints: {
    profileFingerprint: string;
    continuationInputFingerprint: string;
    targetIntervalOccupancyFingerprint: string;
    calendarOutcomeFingerprint: string;
    evidenceRevisionFingerprint: string;
    activePreferenceCount: number;
    occupiedDates: string[];
  };
}

export function buildAdaptiveContinuationAuthoringPrompt(input: {
  brief: AdaptiveContinuationAuthoringBriefV2;
  originalAuthoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
}) {
  const requestedFamilies = new Set(
    input.brief.projections.map((projection) => projection.workoutFamily),
  );
  const allowedIdentitiesByFamily = Object.fromEntries(
    [...requestedFamilies]
      .sort()
      .map((workoutFamily) => [
        workoutFamily,
        AI_AUTHORED_PLAN_FIRST_WORKOUT_IDENTITY_VALUES.filter(
          (workoutIdentity) =>
            resolveCanonicalWorkoutModel({ workoutType: "quality", workoutIdentity })
              .workoutFamily === workoutFamily,
        ),
      ]),
  );
  if (Object.values(allowedIdentitiesByFamily).some((identities) => identities.length === 0)) {
    throw new Error("A continuation projection uses a workout family with no canonical identity.");
  }
  const targetBoundaryEndpointInstruction = buildTargetBoundaryEndpointInstruction(input);
  const hasFactualPaceAuthority = Boolean(
    input.originalAuthoringInput.runnerFacts.benchmark ||
    input.originalAuthoringInput.planGoalIntent.targetFinishTime,
  );
  const heartRateBandInstruction = `The accepted provider-neutral heart-rate guidance bands are exactly: ${input.originalAuthoringInput.runnerFacts.heartRateProfile.zones
    .map((zone) => `${zone.reference} ${zone.minBpm}-${zone.maxBpm} bpm`)
    .join(
      ", ",
    )}. Every heart-rate command must stay inside its named band; prefer the full band unless a narrower range has a specific authored stage cue.`;
  const schemaInput: StructuredPlanAuthoringInput = {
    ...input.originalAuthoringInput,
    schedule: {
      ...input.originalAuthoringInput.schedule,
      startDate: input.brief.decision.interval.startDate,
    },
  };
  const initialSchema = buildAiAuthoredPlanFirstOpenAiSchema(schemaInput) as unknown as {
    $defs?: Record<string, unknown>;
    properties?: Record<string, unknown>;
  };
  const detailedBlockSchema = initialSchema.properties?.detailed_block;
  if (!detailedBlockSchema) {
    throw new Error("The canonical provider schema has no detailed-block contract.");
  }
  const responseSchema = {
    type: "object",
    additionalProperties: false,
    required: ["contract_version", "detailed_block"],
    properties: {
      contract_version: {
        type: "string",
        const: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
      },
      detailed_block: detailedBlockSchema,
    },
    ...(initialSchema.$defs ? { $defs: initialSchema.$defs } : {}),
  };
  const systemPrompt = [
    "You are Hito's continuation authoring engine for one already accepted immutable Blueprint.",
    `Return only JSON for ${ADAPTIVE_CONTINUATION_RESPONSE_SCHEMA_NAME}.`,
    "Author only the exact reviewed projection slots in the supplied interval. Do not return a Blueprint, plan, Calendar row, result, evidence identity, mutation token, alternate option, or later-horizon detail.",
    "Every returned workout must match its projection date, phase and workout family. The final_workout is the chronologically last returned workout.",
    `For each projection date, workout_identity must belong to its supplied workoutFamily using this exact canonical map: ${JSON.stringify(allowedIdentitiesByFamily)}. Never substitute an identity from another family.`,
    ...(input.brief.decision.interval.blockMode === "resolved_interruption_bridge"
      ? [
          "A resolved-interruption bridge is conservative return-to-running, never normal-build density. In its first seven days, keep each timed long workout at or below 60 runnable minutes, every other timed workout at or below 35 runnable minutes, and total timed runnable volume at or below 165 minutes. In days 8-14, keep each timed long workout at or below 75 runnable minutes. Do not use distance-only prescriptions to evade these reviewable duration limits.",
        ]
      : []),
    "Return every supplied projection date exactly once across detailed_block.workouts and detailed_block.final_workout. The final_workout date must not also appear in workouts; do not omit, duplicate, or add a date.",
    "Use the supplied decision mode. fact_shaped may change detail only for comparable contexts explicitly marked detailChangeEligible. blueprint_faithful and constraint_only must not invent performance adaptation from missing FIT or RPE facts.",
    "FIT/RPE fact shaping is permitted only for workout families named in comparableContextKeys. Every other family must keep a distinct family-faithful executable command; a steady command must never duplicate an easy command signature.",
    heartRateBandInstruction,
    ...(!hasFactualPaceAuthority
      ? [
          "The runner has neither a factual benchmark nor an explicit target finish time. Do not use primary_execution_mode=pace or emit an executable pace command on any runnable unit or Repeat child. Use only the available provider-neutral heart-rate or controlled-effort execution truth permitted by the strict schema; never infer pace precision from the goal distance, age, generic level, or prior authored workouts.",
        ]
      : []),
    ...(targetBoundaryEndpointInstruction ? [targetBoundaryEndpointInstruction] : []),
    ...(targetBoundaryEndpointInstruction
      ? [
          "In the same target/taper boundary, every substantive distance-interval work repeat must be no faster than the frozen benchmark and its local cue must include RPE max N/10 with N no greater than 8.",
        ]
      : []),
    "Every runnable unit section and every ordered Repeat child must carry exactly one numeric target. For pace, target.command is exactly M:SS/km or M:SS-M:SS/km. For heart rate, target.command is exactly NNN-NNN bpm and band_reference names the supplied guidance band.",
    "Never put effort, RPE, talk-test, easy, conversational, or another descriptive phrase in target.command; keep it in cue text. Repeat parents are structural and never own a target.",
    "Preserve the canonical target, Repeat, hydration, title and executable-leaf rules of the strict schema. Do not echo private runner text or factual identifiers.",
  ].join("\n");
  return {
    systemPrompt,
    userPrompt: JSON.stringify({
      contractVersion: ADAPTIVE_CONTINUATION_PROVIDER_CONTRACT_VERSION,
      brief: input.brief,
    }),
    responseSchema,
  };
}

export function compileAdaptiveContinuationProviderResponse(input: {
  response: unknown;
  brief: AdaptiveContinuationAuthoringBriefV2;
  blueprint: AiAuthoredBlueprintSummary;
  originalAuthoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
  explicitRetainedTargetBoundaryRepair?: boolean;
}): AiAuthoredContinuationCompileResult {
  const parsed = adaptiveContinuationProviderResponseSchema.safeParse(input.response);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "adaptive_continuation_provider_schema_invalid",
      issues: parsed.error.issues.slice(0, 16).map((issue) => ({
        code: "adaptive_continuation_provider_schema_invalid",
        path: issue.path.join(".") || "root",
        message: issue.message,
      })),
    };
  }
  const detailedBlock = input.explicitRetainedTargetBoundaryRepair
    ? repairRetainedTargetBoundarySafety({
        detailedBlock: parsed.data.detailed_block,
        brief: input.brief,
        originalAuthoringInput: input.originalAuthoringInput,
      })
    : parsed.data.detailed_block;
  const endpointIssues = validateTargetBoundaryEndpoint({
    detailedBlock,
    brief: input.brief,
    originalAuthoringInput: input.originalAuthoringInput,
  });
  if (endpointIssues.length > 0) {
    return {
      ok: false,
      reason: endpointIssues[0]!.code,
      issues: endpointIssues,
    };
  }
  const intervalIssues = validateTargetBoundaryDistanceIntervals({
    detailedBlock,
    brief: input.brief,
    originalAuthoringInput: input.originalAuthoringInput,
  });
  if (intervalIssues.length > 0) {
    return {
      ok: false,
      reason: intervalIssues[0]!.code,
      issues: intervalIssues,
    };
  }
  return compileAiAuthoredContinuationDetailedBlock({
    response: detailedBlock,
    authoringInput: input.originalAuthoringInput,
    blueprint: input.blueprint,
    interval: input.brief.decision.interval,
    projections: input.brief.projections,
  });
}

function buildTargetBoundaryEndpointInstruction(input: {
  brief: AdaptiveContinuationAuthoringBriefV2;
  originalAuthoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
}) {
  const benchmark = input.originalAuthoringInput.runnerFacts.benchmark;
  if (
    input.brief.decision.interval.blockMode !== "target_taper_boundary" ||
    input.originalAuthoringInput.planGoalIntent.targetFinishTime ||
    input.brief.decision.comparableContextKeys.length > 0 ||
    !benchmark ||
    benchmark.kind !== "recent_5k"
  ) {
    return null;
  }
  const range = completionFirstEndpointRange(benchmark.paceSecondsPerKm);
  return `The selected-distance completion/checkpoint endpoint has no target finish time and no comparable performance evidence. Its substantive main pace command must be exactly ${range}; this is a conservative completion-first benchmark-bound guide, never a predicted result or performance adaptation.`;
}

function validateTargetBoundaryEndpoint(input: {
  detailedBlock: AdaptiveContinuationProviderResponse["detailed_block"];
  brief: AdaptiveContinuationAuthoringBriefV2;
  originalAuthoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
}) {
  const benchmark = input.originalAuthoringInput.runnerFacts.benchmark;
  if (
    input.brief.decision.interval.blockMode !== "target_taper_boundary" ||
    input.originalAuthoringInput.planGoalIntent.targetFinishTime ||
    input.brief.decision.comparableContextKeys.length > 0 ||
    !benchmark ||
    benchmark.kind !== "recent_5k" ||
    input.detailedBlock.final_workout.workout_identity !==
      "selected_distance_completion_or_checkpoint"
  ) {
    return [];
  }
  const commands = substantiveEndpointPaceCommands(input.detailedBlock.final_workout);
  const conservativeSlowest = benchmark.paceSecondsPerKm + 15;
  const invalid =
    commands.length === 0 ||
    commands.some((command) => {
      const range = parsePaceCommand(command);
      return (
        !range ||
        range.fastestSecondsPerKm < benchmark.paceSecondsPerKm ||
        range.slowestSecondsPerKm < conservativeSlowest ||
        range.fastestSecondsPerKm === range.slowestSecondsPerKm
      );
    });
  return invalid
    ? [
        {
          code: "adaptive_continuation_target_endpoint_unproven_performance_precision",
          path: "detailed_block.final_workout.sections",
          message:
            "A completion/checkpoint endpoint without target time or comparable evidence must use a conservative range no faster than the frozen benchmark.",
        },
      ]
    : [];
}

function repairRetainedTargetBoundarySafety(input: {
  detailedBlock: AdaptiveContinuationProviderResponse["detailed_block"];
  brief: AdaptiveContinuationAuthoringBriefV2;
  originalAuthoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
}) {
  const repaired = structuredClone(input.detailedBlock);
  const benchmark = input.originalAuthoringInput.runnerFacts.benchmark;
  if (
    input.brief.decision.interval.blockMode !== "target_taper_boundary" ||
    input.originalAuthoringInput.planGoalIntent.targetFinishTime ||
    input.brief.decision.comparableContextKeys.length > 0 ||
    !benchmark ||
    benchmark.kind !== "recent_5k" ||
    repaired.final_workout.workout_identity !== "selected_distance_completion_or_checkpoint"
  ) {
    return repaired;
  }
  const range = completionFirstEndpointRange(benchmark.paceSecondsPerKm);
  for (const section of repaired.final_workout.sections) {
    if (section.kind === "hydration" || section.segment_type !== "main") continue;
    if (section.kind === "unit") {
      if (section.target.primary_execution_mode === "pace") section.target.command = range;
      continue;
    }
    for (const child of section.children) {
      if (child.target.primary_execution_mode === "pace") child.target.command = range;
    }
  }
  for (const workout of repaired.workouts) {
    if (
      resolveCanonicalWorkoutModel({
        workoutType: "quality",
        workoutIdentity: workout.workout_identity,
      }).workoutIdentity !== "distance_intervals"
    ) {
      continue;
    }
    for (const section of workout.sections) {
      if (section.kind !== "repeat") continue;
      for (const child of section.children) {
        if (child.role !== "work" || child.target.primary_execution_mode !== "pace") continue;
        child.target.command = range;
        child.cue = withRpeCeiling(child.cue, 8);
      }
    }
  }
  return repaired;
}

function validateTargetBoundaryDistanceIntervals(input: {
  detailedBlock: AdaptiveContinuationProviderResponse["detailed_block"];
  brief: AdaptiveContinuationAuthoringBriefV2;
  originalAuthoringInput: Omit<StructuredPlanAuthoringInput, "requestContext">;
}) {
  const benchmark = input.originalAuthoringInput.runnerFacts.benchmark;
  if (
    input.brief.decision.interval.blockMode !== "target_taper_boundary" ||
    input.originalAuthoringInput.planGoalIntent.targetFinishTime ||
    input.brief.decision.comparableContextKeys.length > 0 ||
    !benchmark ||
    benchmark.kind !== "recent_5k"
  ) {
    return [];
  }
  for (const workout of input.detailedBlock.workouts) {
    if (
      resolveCanonicalWorkoutModel({
        workoutType: "quality",
        workoutIdentity: workout.workout_identity,
      }).workoutIdentity !== "distance_intervals"
    ) {
      continue;
    }
    for (const section of workout.sections) {
      if (section.kind !== "repeat") continue;
      for (const child of section.children) {
        if (child.role !== "work" || child.target.primary_execution_mode !== "pace") continue;
        const range = parsePaceCommand(child.target.command);
        const rpe = readRpeCeiling(child.cue);
        if (!range || range.fastestSecondsPerKm < benchmark.paceSecondsPerKm || !rpe || rpe > 8) {
          return [
            {
              code: "adaptive_continuation_target_taper_distance_intervals_unproven_intensity",
              path: `detailed_block.workouts.${workout.date}.sections`,
              message:
                "Target/taper distance intervals without comparable evidence must be benchmark-bound and include a local RPE ceiling no greater than 8/10.",
            },
          ];
        }
      }
    }
  }
  return [];
}

function substantiveEndpointPaceCommands(
  endpoint: AdaptiveContinuationProviderResponse["detailed_block"]["final_workout"],
) {
  const commands: string[] = [];
  for (const section of endpoint.sections) {
    if (section.kind === "hydration" || section.segment_type !== "main") continue;
    if (section.kind === "unit") {
      if (section.target.primary_execution_mode === "pace") commands.push(section.target.command);
      continue;
    }
    for (const child of section.children) {
      if (child.target.primary_execution_mode === "pace") commands.push(child.target.command);
    }
  }
  return commands;
}

function completionFirstEndpointRange(benchmarkSecondsPerKm: number) {
  return `${formatPace(benchmarkSecondsPerKm)}-${formatPace(benchmarkSecondsPerKm + 15)}/km`;
}

function withRpeCeiling(cue: string | null, maximum: number) {
  const marker = `RPE max ${maximum}/10`;
  const withoutPrior = (cue ?? "Controlled repeat.")
    .replace(/\s*RPE max \d+\/10\.?/gi, "")
    .trim()
    .replace(/[.!?]?$/, ".");
  const availableBaseLength = 160 - marker.length - 1;
  const boundedBase = withoutPrior.slice(0, availableBaseLength).trimEnd();
  return `${boundedBase} ${marker}`;
}

function readRpeCeiling(cue: string | null) {
  const match = /\bRPE max (\d+)\/10\b/i.exec(cue ?? "");
  return match ? Number(match[1]) : null;
}

function formatPace(secondsPerKm: number) {
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, "0")}`;
}

function parsePaceCommand(command: string) {
  const match = /^(\d{1,2}):([0-5]\d)(?:-(\d{1,2}):([0-5]\d))?\/km$/.exec(command);
  if (!match) return null;
  const first = Number(match[1]) * 60 + Number(match[2]);
  const second = match[3] == null ? first : Number(match[3]) * 60 + Number(match[4]);
  return {
    fastestSecondsPerKm: Math.min(first, second),
    slowestSecondsPerKm: Math.max(first, second),
  };
}
