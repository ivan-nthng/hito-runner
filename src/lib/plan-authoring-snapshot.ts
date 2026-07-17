import { z } from "zod";
import type { Json } from "@/lib/supabase/database";
import { structuredPlanAuthoringInputSchema } from "@/lib/structured-plan-authoring";

type StructuredAuthoringInput = z.output<typeof structuredPlanAuthoringInputSchema>;

export type PlanAuthoringSnapshotSource =
  | "structured_first_plan"
  | "ai_authored_plan_first"
  | "text_authoring"
  | "active_plan_refresh";

export interface PlanScopedStructuredAuthoringMetadataInput {
  source: PlanAuthoringSnapshotSource;
  authoringInput: StructuredAuthoringInput;
  goalStyle?: "relaxed" | "balanced" | "ambitious" | "target_time" | null;
  targetTime?: string | null;
  metricPolicySummary?: string | null;
  reviewAssumptions?: string[];
}

export interface AdditionalPlanPersistenceMetadata {
  goalMetadata?: Json | null;
  planPreferences?: Json | null;
}

export function buildPlanScopedStructuredAuthoringMetadata({
  source,
  authoringInput,
  goalStyle,
  targetTime,
  metricPolicySummary,
  reviewAssumptions,
}: PlanScopedStructuredAuthoringMetadataInput): AdditionalPlanPersistenceMetadata {
  const safeAuthoringInput = sanitizeStructuredAuthoringInput(authoringInput);
  const normalizedGoalStyle = normalizeGoalStyle(goalStyle ?? safeAuthoringInput.goal.goalStyle);
  const normalizedTargetTime = sanitizeString(
    targetTime ?? safeAuthoringInput.goal.targetTime ?? extractTargetTime(safeAuthoringInput),
    32,
  );
  const planGoalIntent = safeAuthoringInput.planGoalIntent ?? null;
  const snapshot = toJson({
    schema_version: "plan-scoped-structured-authoring-v1",
    source,
    authoring_input: safeAuthoringInput,
    ...(planGoalIntent ? { plan_goal_intent: planGoalIntent } : {}),
    ...(normalizedGoalStyle ? { goal_style: normalizedGoalStyle } : {}),
    ...(normalizedTargetTime ? { target_time: normalizedTargetTime } : {}),
    ...(metricPolicySummary
      ? { metric_policy_summary: sanitizeString(metricPolicySummary, 300) }
      : {}),
    ...(reviewAssumptions?.length
      ? {
          review_assumptions: reviewAssumptions
            .map((assumption) => sanitizeString(assumption, 300))
            .filter((assumption): assumption is string => Boolean(assumption))
            .slice(0, 8),
        }
      : {}),
  });

  return {
    goalMetadata: toJson({
      ...(normalizedGoalStyle ? { goal_style: normalizedGoalStyle } : {}),
      ...(normalizedTargetTime ? { target_time: normalizedTargetTime } : {}),
      ...(planGoalIntent ? { plan_goal_intent: planGoalIntent } : {}),
    }),
    planPreferences: toJson({
      structured_authoring_input: safeAuthoringInput,
      structured_authoring_snapshot: snapshot,
    }),
  };
}

export function mergePlanPersistenceMetadata(
  base: Json | null,
  additional: Json | null | undefined,
) {
  const baseRecord = asJsonRecord(base);
  const additionalRecord = asJsonRecord(additional);

  if (!baseRecord && !additionalRecord) {
    return null;
  }

  return toJson({
    ...(baseRecord ?? {}),
    ...(additionalRecord ?? {}),
  });
}

function sanitizeStructuredAuthoringInput(
  input: StructuredAuthoringInput,
): StructuredAuthoringInput {
  const parsed = structuredPlanAuthoringInputSchema.parse(input);

  return structuredPlanAuthoringInputSchema.parse({
    ...parsed,
    constraints: {
      injuryConstraints: parsed.constraints.injuryConstraints,
      hardConstraints: parsed.constraints.hardConstraints
        .filter((constraint) => !isRawTransientConstraint(constraint))
        .slice(0, 10),
    },
    preferences: {
      ...parsed.preferences,
      notes: sanitizeString(parsed.preferences.notes, 500),
    },
  });
}

function isRawTransientConstraint(value: string) {
  return /^(confirmed transcript|raw transcript|runner transcript):/i.test(value.trim());
}

function extractTargetTime(input: StructuredAuthoringInput) {
  const text = [input.goal.goalLabel, ...input.constraints.hardConstraints].join(" ");
  const match = text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);

  return match?.[0] ?? null;
}

function normalizeGoalStyle(value: unknown) {
  return value === "relaxed" ||
    value === "balanced" ||
    value === "ambitious" ||
    value === "target_time"
    ? value
    : null;
}

function sanitizeString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength).trim() : null;
}

function asJsonRecord(value: Json | null | undefined): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
