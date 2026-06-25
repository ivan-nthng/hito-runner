import type { Database } from "@/lib/supabase/database";
import {
  displayExecutableTargetEntries,
  deriveWorkoutRichModel,
  formatDate,
  formatDistanceKm,
  formatDurationMin,
  primaryWorkoutTarget,
  stepPlannedDistanceKm,
  workoutDuration,
  type Step,
  type StepPrescription,
  type StepUnitPrescription,
  type StepTarget,
  type WorkoutType,
} from "@/lib/training";
import type {
  CalendarIconKey,
  CanonicalGoalContext,
  CanonicalMetricMode,
  CanonicalWorkoutFamily,
  CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import { resolveActivePlanSourceStatus } from "@/lib/active-plan-workout-editing/policy";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedPlannedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];

export type PlanExportFormat = "json" | "markdown";

export interface ActivePlanExportPayload {
  plan: {
    schemaVersion: string;
    planId: string;
    title: string;
    goalSummary: string;
    createdFor: string;
    effectiveStartDate: string;
    effectiveEndDate: string;
    targetDate: string | null;
    sourceKind: string | null;
    sourceStatus: string | null;
    exportedAt: string;
  };
  summary: {
    dayCount: number;
    workoutCount: number;
    weeksCount: number;
  };
  workouts: ActivePlanExportWorkout[];
}

export interface ActivePlanExportWorkout {
  workoutId: string;
  date: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  workoutType: WorkoutType;
  sourceWorkoutType: string | null;
  workoutFamily: CanonicalWorkoutFamily;
  workoutIdentity: CanonicalWorkoutIdentity;
  calendarIconKey: CalendarIconKey;
  goalContext: CanonicalGoalContext | null;
  metricMode: CanonicalMetricMode;
  title: string;
  notes: string | null;
  steps: Step[];
  displayDistanceKm: number | null;
  displayDurationMin: number | null;
  primaryTarget: Array<{ key: string; label: string; value: string }>;
  primaryGuidance: string | null;
}

export interface PlanExportDocument {
  format: PlanExportFormat;
  filename: string;
  contentType: string;
  body: string;
  payload: ActivePlanExportPayload;
}

export function buildActivePlanExportPayload(args: {
  planCycle: PersistedPlanCycleRow;
  workouts: PersistedPlannedWorkoutRow[];
  exportedAt?: string;
}): ActivePlanExportPayload {
  const orderedWorkouts = args.workouts
    .slice()
    .sort(
      (left, right) =>
        left.workout_date.localeCompare(right.workout_date) ||
        left.display_order - right.display_order ||
        left.title.localeCompare(right.title),
    )
    .map((workout) => workoutRowToExportWorkout(workout));

  const firstWorkoutDate = orderedWorkouts[0]?.date ?? args.planCycle.start_date;
  const lastWorkoutDate = orderedWorkouts.at(-1)?.date ?? args.planCycle.end_date;
  const weeks = new Set(orderedWorkouts.map((workout) => workout.weekNumber));

  return {
    plan: {
      schemaVersion: "training-plan-v2",
      planId: buildSafePlanExportId(args.planCycle, firstWorkoutDate),
      title: args.planCycle.title,
      goalSummary: args.planCycle.goal_summary,
      createdFor: "Hito saved runner",
      effectiveStartDate: firstWorkoutDate,
      effectiveEndDate: lastWorkoutDate,
      targetDate: args.planCycle.target_date,
      sourceKind: args.planCycle.source_kind,
      sourceStatus: resolveActivePlanSourceStatus(args.planCycle),
      exportedAt: args.exportedAt ?? new Date().toISOString(),
    },
    summary: {
      dayCount: orderedWorkouts.length,
      workoutCount: orderedWorkouts.filter((workout) => workout.workoutType !== "rest").length,
      weeksCount: weeks.size,
    },
    workouts: orderedWorkouts,
  };
}

export function buildPlanExportDocument(
  payload: ActivePlanExportPayload,
  format: PlanExportFormat,
): PlanExportDocument {
  const filenameBase = buildFilenameBase(payload);

  if (format === "markdown") {
    return {
      format,
      filename: `${filenameBase}.md`,
      contentType: "text/markdown; charset=utf-8",
      body: renderPlanExportMarkdown(payload),
      payload,
    };
  }

  return {
    format,
    filename: `${filenameBase}.json`,
    contentType: "application/json; charset=utf-8",
    body: renderPlanExportJson(payload),
    payload,
  };
}

export function renderPlanExportJson(payload: ActivePlanExportPayload) {
  return `${JSON.stringify(activePlanExportToTrainingPlanV2(payload), null, 2)}\n`;
}

export function renderPlanExportMarkdown(payload: ActivePlanExportPayload) {
  const lines: string[] = [
    `# ${payload.plan.title}`,
    "",
    payload.plan.goalSummary,
    "",
    `- Start: ${formatDate(payload.plan.effectiveStartDate)}`,
    `- End: ${formatDate(payload.plan.effectiveEndDate)}`,
  ];

  if (payload.plan.targetDate) {
    lines.push(`- Target date: ${formatDate(payload.plan.targetDate)}`);
  }

  lines.push(
    `- Workouts: ${payload.summary.workoutCount} across ${payload.summary.dayCount} days`,
    "",
  );

  let currentWeek: number | null = null;

  for (const workout of payload.workouts) {
    if (workout.weekNumber !== currentWeek) {
      currentWeek = workout.weekNumber;
      lines.push(`## Week ${currentWeek}`, "");
    }

    lines.push(`### ${formatDate(workout.date)} - ${workout.title}`);
    lines.push(`- Type: ${humanizeWorkoutType(workout.sourceWorkoutType ?? workout.workoutType)}`);

    if (workout.workoutType !== "rest") {
      lines.push(
        `- Focus: ${humanizeWorkoutType(workout.workoutFamily)} · ${humanizeWorkoutType(workout.workoutIdentity)}`,
      );
    }

    const metrics = formatWorkoutMetrics(workout);
    if (metrics) {
      lines.push(`- Plan: ${metrics}`);
    }

    const executionLine = formatExecutionLine(workout.metricMode);
    if (executionLine) {
      lines.push(`- Execution: ${executionLine}`);
    }

    const targetLine = formatTargetLine(workout.primaryTarget);
    if (targetLine) {
      lines.push(`- Target: ${targetLine}`);
    }

    if (workout.primaryGuidance) {
      lines.push(`- Guidance: ${workout.primaryGuidance}`);
    }

    if (workout.notes) {
      lines.push(`- Notes: ${workout.notes}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function activePlanExportToTrainingPlanV2(payload: ActivePlanExportPayload) {
  return {
    schema_version: "training-plan-v2",
    plan_id: payload.plan.planId,
    plan_name: payload.plan.title,
    source_kind: payload.plan.sourceKind ?? "hito_active_plan_export",
    ...(payload.plan.sourceStatus ? { source_status: payload.plan.sourceStatus } : {}),
    created_at: payload.plan.exportedAt,
    generated_for: payload.plan.createdFor,
    export_metadata: buildPlanExportMetadata(payload),
    goal: {
      goal_type: "distance_build",
      goal_label: payload.plan.goalSummary,
      ...(payload.plan.targetDate
        ? {
            target_event: {
              date: payload.plan.targetDate,
            },
          }
        : {}),
    },
    start_date: payload.plan.effectiveStartDate,
    target_date: payload.plan.targetDate ?? undefined,
    planned_workouts: payload.workouts.map((workout) => ({
      workout_id: workout.workoutId,
      date: workout.date,
      weekday: workout.weekday,
      week_number: workout.weekNumber,
      phase: workout.phase,
      workout_type: toExportWorkoutType(workout.workoutType),
      source_workout_type: workout.sourceWorkoutType ?? workout.workoutIdentity,
      workout_family: workout.workoutFamily,
      workout_identity: workout.workoutIdentity,
      calendar_icon_key: workout.calendarIconKey,
      ...(workout.goalContext ? { goal_context: toExportGoalContext(workout.goalContext) } : {}),
      metric_mode: toExportMetricMode(workout.metricMode),
      title: workout.title,
      summary: buildWorkoutSummary(workout),
      segments: workoutToTrainingPlanV2Segments(workout),
    })),
  };
}

function workoutToTrainingPlanV2Segments(workout: ActivePlanExportWorkout) {
  if (workout.steps.length > 0) {
    return workout.steps.map((step, index) => stepToTrainingPlanV2Segment(step, index));
  }

  return [
    {
      segment_id: `${workout.workoutId}-segment-1`,
      sequence: 1,
      segment_type: workout.workoutType === "rest" ? "rest" : "main",
      label: workout.workoutType === "rest" ? "Rest" : workout.title,
      prescription: { mode: "none" },
    },
  ];
}

function workoutRowToExportWorkout(row: PersistedPlannedWorkoutRow): ActivePlanExportWorkout {
  const steps = Array.isArray(row.steps) ? (row.steps as unknown as Step[]) : [];
  const workout = {
    steps,
    type: row.workout_type,
  };
  const primaryTarget = primaryWorkoutTarget(workout);
  const richWorkout = deriveWorkoutRichModel({
    type: row.workout_type,
    sourceWorkoutType: row.source_workout_type,
    workoutFamily: row.workout_family,
    workoutIdentity: row.workout_identity,
    calendarIconKey: row.calendar_icon_key,
    goalContext: row.goal_context,
    metricMode: row.metric_mode,
    title: row.title,
    steps,
  });

  return {
    workoutId: row.source_workout_id ?? buildSafeWorkoutExportId(row),
    date: row.workout_date,
    weekday: row.weekday,
    weekNumber: row.week_number,
    phase: row.phase,
    workoutType: row.workout_type,
    sourceWorkoutType: row.source_workout_type,
    workoutFamily: richWorkout.workoutFamily,
    workoutIdentity: richWorkout.workoutIdentity,
    calendarIconKey: richWorkout.calendarIconKey,
    goalContext: richWorkout.goalContext,
    metricMode: richWorkout.metricMode,
    title: row.title,
    notes: row.notes,
    steps,
    displayDistanceKm: row.workout_type === "rest" ? null : explicitWorkoutDistanceKm(steps),
    displayDurationMin: row.workout_type === "rest" ? null : workoutDuration(workout),
    primaryTarget: displayExecutableTargetEntries(primaryTarget, richWorkout.metricMode),
    primaryGuidance: findPrimaryGuidance(steps),
  };
}

function buildPlanExportMetadata(payload: ActivePlanExportPayload) {
  return {
    export_format_version: "hito_active_plan_export_v1",
    exported_at: payload.plan.exportedAt,
    source_kind: payload.plan.sourceKind ?? "hito_active_plan_export",
    ...(payload.plan.sourceStatus ? { source_status: payload.plan.sourceStatus } : {}),
    row_counts: {
      day_count: payload.summary.dayCount,
      workout_count: payload.summary.workoutCount,
      weeks_count: payload.summary.weeksCount,
    },
    privacy: {
      internal_database_ids_omitted: true,
      auth_ids_omitted: true,
      provider_tokens_omitted: true,
    },
  };
}

function buildSafePlanExportId(planCycle: PersistedPlanCycleRow, firstWorkoutDate: string) {
  const source = planCycle.source_kind ?? "active_plan";
  const sourceSlug = slugify(source) || "active-plan";
  const dateSlug = slugify(firstWorkoutDate) || "undated";
  const titleSlug = slugify(planCycle.title).slice(0, 40) || "plan";

  return `hito-export-${sourceSlug}-${dateSlug}-${titleSlug}`;
}

function buildSafeWorkoutExportId(row: PersistedPlannedWorkoutRow) {
  const dateSlug = slugify(row.workout_date) || "undated";
  const typeSlug = slugify(row.source_workout_type ?? row.workout_identity ?? row.workout_type);
  const order = Number.isFinite(row.display_order) ? row.display_order : 0;

  return `hito-workout-${dateSlug}-${typeSlug || "workout"}-${order}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toExportGoalContext(goalContext: CanonicalGoalContext) {
  return {
    goal_type: goalContext.goalType,
    ...(goalContext.goalStyle ? { goal_style: goalContext.goalStyle } : {}),
    ...(goalContext.terrainFocus ? { terrain_focus: goalContext.terrainFocus } : {}),
    ...(goalContext.targetDate ? { target_date: goalContext.targetDate } : {}),
    ...(goalContext.targetTime ? { target_time: goalContext.targetTime } : {}),
  };
}

function toExportMetricMode(metricMode: CanonicalMetricMode) {
  return {
    guidance: metricMode.guidance,
    executable_mode: metricMode.executableMode,
    pace_targets_allowed: metricMode.paceTargetsAllowed,
    hr_targets_allowed: metricMode.hrTargetsAllowed,
    hr_target_source: metricMode.hrTargetSource,
    ...(metricMode.hrTargetLabel ? { hr_target_label: metricMode.hrTargetLabel } : {}),
    ...(metricMode.hrTargetSourceNote
      ? { hr_target_source_note: metricMode.hrTargetSourceNote }
      : {}),
    reason: metricMode.reason,
  };
}

function explicitWorkoutDistanceKm(steps: Step[]) {
  const total = steps.reduce((sum, step) => sum + stepPlannedDistanceKm(step), 0);
  return total > 0 ? total : null;
}

function stepToTrainingPlanV2Segment(step: Step, index: number) {
  const target = exportTarget(step.target);
  const prescription = buildStepExportPrescription(step);
  const segmentType = toExportSegmentType(step.segment_type ?? step.type, Boolean(prescription));
  const segment = {
    segment_id: step.segment_id ?? `segment-${index + 1}`,
    sequence: step.sequence ?? index + 1,
    segment_type: segmentType,
    ...(stringValue(step.label) ? { label: stringValue(step.label) } : {}),
    ...(stringValue(step.guidance) ? { guidance: stringValue(step.guidance) } : {}),
    ...(prescription ? { prescription } : {}),
    ...(!prescription && step.duration_min ? { duration_min: step.duration_min } : {}),
    ...(!prescription && step.distance_km ? { distance_km: step.distance_km } : {}),
    ...(target ? { target } : {}),
  };

  if (!prescription && !("duration_min" in segment) && !("distance_km" in segment)) {
    return {
      ...segment,
      prescription: { mode: "none" },
    };
  }

  return segment;
}

function buildStepExportPrescription(step: Step) {
  if (step.prescription) {
    return exportPrescription(step.prescription);
  }

  if (!step.repeats || !step.work) {
    return null;
  }

  const repeatUnit = stepToUnitPrescription(step.work);
  if (!repeatUnit) {
    return null;
  }

  const recoveryUnit = step.recovery ? stepToUnitPrescription(step.recovery) : null;

  return {
    mode: "repeats",
    repeat_count: step.repeats,
    repeat_unit: repeatUnit,
    ...(recoveryUnit ? { recovery_unit: recoveryUnit } : {}),
  };
}

function exportPrescription(prescription: StepPrescription) {
  return {
    mode: prescription.mode,
    ...(prescription.duration_min ? { duration_min: prescription.duration_min } : {}),
    ...(prescription.distance_km ? { distance_km: prescription.distance_km } : {}),
    ...(prescription.repeat_count ? { repeat_count: prescription.repeat_count } : {}),
    ...(prescription.repeat_unit ? { repeat_unit: prescription.repeat_unit } : {}),
    ...(prescription.recovery_unit ? { recovery_unit: prescription.recovery_unit } : {}),
  };
}

function stepToUnitPrescription(step: Step): StepUnitPrescription | null {
  if (step.prescription?.mode === "time" && step.prescription.duration_min) {
    return {
      mode: "time",
      duration_min: step.prescription.duration_min,
    };
  }

  if (step.prescription?.mode === "distance" && step.prescription.distance_km) {
    return {
      mode: "distance",
      distance_km: step.prescription.distance_km,
    };
  }

  if (step.duration_min) {
    return {
      mode: "time",
      duration_min: step.duration_min,
    };
  }

  if (step.distance_km) {
    return {
      mode: "distance",
      distance_km: step.distance_km,
    };
  }

  return null;
}

function exportTarget(target: StepTarget | undefined) {
  if (!target) {
    return null;
  }

  const output: Record<string, string | number> = {};
  const push = (key: string, value: string | number | undefined) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      output[key] = value;
    } else if (typeof value === "string" && value.trim()) {
      output[key] = value.trim();
    }
  };

  push("intensity", target.intensity);
  push("hr_bpm_range", target.hr_bpm_range ?? target.hr_bpm);
  push("hr_target_source", target.hr_target_source);
  push("label", target.label);
  push("source_note", target.source_note);
  push("pace_min_per_km_range", target.pace_min_per_km_range ?? target.pace_range_min_km);
  push("pace", target.pace);
  push("rpe", target.rpe);
  push("cadence_spm_range", target.cadence_spm_range);
  push("cue", target.cue);
  push("hint", target.hint);

  for (const [key, value] of Object.entries(target.extra ?? {})) {
    push(key, value);
  }

  return Object.keys(output).length > 0 ? output : null;
}

function findPrimaryGuidance(steps: Step[]) {
  for (const step of steps) {
    const guidance = stringValue(step.guidance);
    if (guidance) {
      return guidance;
    }

    const cue = stringValue(step.target?.cue);
    if (cue) {
      return cue;
    }

    const hint = stringValue(step.target?.hint);
    if (hint) {
      return hint;
    }
  }

  return null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildWorkoutSummary(workout: ActivePlanExportWorkout) {
  const metrics = formatWorkoutMetrics(workout);
  const type = humanizeWorkoutType(workout.sourceWorkoutType ?? workout.workoutType);

  if (metrics) {
    return `${metrics} ${type.toLowerCase()}.`;
  }

  return workout.workoutType === "rest" ? "Rest and recovery." : type;
}

function formatWorkoutMetrics(workout: ActivePlanExportWorkout) {
  const parts: string[] = [];

  if (workout.displayDistanceKm != null) {
    parts.push(`${formatDistanceKm(workout.displayDistanceKm)} km`);
  }

  if (workout.displayDurationMin != null && workout.displayDurationMin > 0) {
    parts.push(formatDurationMin(workout.displayDurationMin));
  }

  return parts.join(" / ");
}

function formatTargetLine(entries: ActivePlanExportWorkout["primaryTarget"]) {
  const visibleEntries = entries.filter(
    (entry) =>
      entry.key !== "extra" && entry.value.trim() && !entry.value.toLowerCase().includes("object"),
  );

  return visibleEntries.map((entry) => `${entry.label}: ${entry.value}`).join("; ");
}

function formatExecutionLine(metricMode: CanonicalMetricMode) {
  switch (metricMode.executableMode) {
    case "pace_executable":
      return "Pace-executable targets supplied by Hito.";
    case "hr_executable":
      return "Personal heart-rate targets supplied by Hito.";
    case "mixed_metric_executable":
      return "Pace and personal heart-rate targets supplied by Hito.";
    case "structure_only_executable":
      return "Executable duration, distance, repeat, work, or recovery structure; no pace or personal HR target.";
    case "correction_required":
      return "Correction required before this can be treated as watch-executable.";
    case "effort_only":
      return "Readable guidance only; no watch-executable target contract.";
    case "none":
      return "No execution targets.";
    case "unknown":
      return "Metric execution mode unknown.";
    default:
      return null;
  }
}

function toExportWorkoutType(value: string) {
  const allowed = new Set([
    "easy",
    "steady_or_easy",
    "rest",
    "long_run",
    "quality",
    "tempo",
    "intervals",
    "progression",
    "race",
    "recovery",
  ]);

  return allowed.has(value) ? value : "quality";
}

function toExportSegmentType(value: string | undefined, hasRepeatPrescription = false) {
  const normalized = value?.trim() || "main";
  const allowed = new Set([
    "warmup",
    "main",
    "cooldown",
    "recovery",
    "rest",
    "mobility",
    "mobility_optional",
    "strength",
    "activation",
    "drills",
    "strides",
    "recovery_jog",
    "fueling",
    "tempo_block",
    "interval_block",
  ]);

  if (
    (normalized === "strides" ||
      normalized === "interval_block" ||
      normalized === "tempo_block" ||
      normalized === "intervals") &&
    !hasRepeatPrescription
  ) {
    return "main";
  }

  if (allowed.has(normalized)) {
    return normalized;
  }

  if (normalized === "easy" || normalized === "run" || normalized === "tempo") {
    return "main";
  }

  if (normalized === "intervals" && hasRepeatPrescription) {
    return "interval_block";
  }

  return "main";
}

function humanizeWorkoutType(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildFilenameBase(payload: ActivePlanExportPayload) {
  const title = slugify(payload.plan.title) || "hito-training-plan";
  const startDate = payload.plan.effectiveStartDate?.trim();

  return startDate ? `${title}-${startDate}` : title;
}
