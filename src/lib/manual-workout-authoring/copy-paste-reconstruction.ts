import {
  getExistingPlanContext,
  type ExistingPlanContext,
  type PersistedPlannedWorkoutRow,
} from "@/lib/active-plan-persistence";
import {
  fetchManualWorkoutEvidenceWorkoutIds,
  isProtectedManualWorkoutTarget,
  type ManualWorkoutActivePlanAddDependencies,
} from "@/lib/manual-workout-authoring/active-plan-add";
import { persistedManualWorkoutHasUnsafeMetricTruth } from "@/lib/manual-workout-authoring/persisted-workout-safety";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_WORKOUT_TEMPLATE_KEY_VALUES,
  type ManualWorkoutAddToActivePlanResult,
  type ManualWorkoutBlockInput,
  type ManualWorkoutConstructorEntryInput,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftProcessingOptions,
  type ManualWorkoutRepeatSafetyKind,
  type ManualWorkoutTargetTruthMode,
  type ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { isManualWorkoutRepeatRecoveryBlock } from "@/lib/manual-workout-authoring/repeat-groups";
import { getManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import {
  canonicalFamilyToLegacyWorkoutType,
  normalizeCalendarIconKey,
  normalizeWorkoutFamily,
  normalizeWorkoutIdentity,
} from "@/lib/rich-workout-model";
import {
  todayIso,
  type Step,
  type StepRepeatChildPrescription,
  type StepTarget,
} from "@/lib/training";
import {
  AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE,
  AI_AUTHORED_PACE_PROVENANCE_VALUES,
  readWorkoutDocumentSections,
  workoutDocumentRepeatChildren,
} from "@/lib/workout-document";

const MANUAL_DRAFT_TITLE_MAX_LENGTH = 120;
const MANUAL_DRAFT_NOTES_MAX_LENGTH = 1_000;
const MANUAL_DRAFT_LABEL_MAX_LENGTH = 120;
const MANUAL_DRAFT_NOTE_TEXT_MAX_LENGTH = 500;
const MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH = 200;
const MANUAL_DRAFT_TARGET_LABEL_MAX_LENGTH = 120;
const MANUAL_DRAFT_TARGET_RPE_MAX_LENGTH = 32;

export interface ManualWorkoutCopyPasteSourceInput {
  activePlanId?: string;
  sourceWorkoutId?: string;
  sourceWorkoutDate?: string;
  targetDate: string;
}

export type ManualWorkoutCopyPasteFailureReason =
  | Extract<ManualWorkoutAddToActivePlanResult, { ok: false }>["reason"]
  | "source_workout_not_found"
  | "source_workout_not_in_active_plan"
  | "source_workout_not_supported"
  | "source_date_changed"
  | "client_payload_rejected"
  | "unsupported_payload";

export type ManualWorkoutCopyPasteReconstructionResult =
  | {
      ok: true;
      activePlanId: string;
      sourceWorkout: PersistedPlannedWorkoutRow;
      draftInput: ManualWorkoutDraftInput;
      processingOptions: ManualWorkoutDraftProcessingOptions;
    }
  | {
      ok: false;
      reason: ManualWorkoutCopyPasteFailureReason;
      message: string;
    };

export async function reconstructManualWorkoutCopyDraftForUser(
  userId: string,
  input: ManualWorkoutCopyPasteSourceInput,
  dependencies: ManualWorkoutActivePlanAddDependencies,
): Promise<ManualWorkoutCopyPasteReconstructionResult> {
  const getContext = dependencies.getExistingPlanContextForUser ?? getExistingPlanContext;
  const fetchEvidence =
    dependencies.fetchEvidenceWorkoutIds ?? fetchManualWorkoutEvidenceWorkoutIds;
  const currentDate = dependencies.currentDate ?? todayIso();
  let planContext: ExistingPlanContext;

  try {
    planContext = await getContext(userId);
  } catch {
    return {
      ok: false,
      reason: "persistence_failed",
      message: "The manual plan could not verify the current active-plan state.",
    };
  }

  const activePlan = planContext.activePlan;
  if (!activePlan) {
    return {
      ok: false,
      reason: "no_active_plan",
      message: "Create a manual user-built active plan before copying workouts.",
    };
  }

  if (input.activePlanId && activePlan.id !== input.activePlanId) {
    return {
      ok: false,
      reason: "stale_review",
      message: "The active manual plan changed. Refresh the calendar and review this copy again.",
    };
  }

  if (activePlan.source_kind !== MANUAL_USER_BUILT_PLAN_SOURCE_KIND) {
    return {
      ok: false,
      reason: "unsupported_active_plan_source",
      message: "Manual workout copy/paste is available only for manual user-built active plans.",
    };
  }

  const source = resolveSourceWorkout({
    userId,
    activePlanId: activePlan.id,
    workouts: planContext.existingWorkouts.workouts,
    sourceWorkoutId: input.sourceWorkoutId,
    sourceWorkoutDate: input.sourceWorkoutDate,
  });

  if (!source.ok) {
    return source;
  }

  const sourceEvidenceIds = await fetchEvidence(userId, [source.workout.id]);
  if (
    isProtectedManualWorkoutTarget(
      source.workout,
      currentDate,
      planContext.existingWorkouts.logsByWorkoutId,
      sourceEvidenceIds,
    )
  ) {
    return {
      ok: false,
      reason: "protected_day",
      message: "This source workout has protected history or evidence and cannot be copied here.",
    };
  }

  if (persistedManualWorkoutHasUnsafeMetricTruth(source.workout)) {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message: "This source workout has metric targets that cannot be copied safely.",
    };
  }

  const draft = buildManualWorkoutDraftInputFromPersistedWorkout(source.workout, input.targetDate, {
    activePlanId: activePlan.id,
    activePlanSourceKind: activePlan.source_kind,
  });

  if (!draft.ok) {
    return draft;
  }

  return {
    ok: true,
    activePlanId: activePlan.id,
    sourceWorkout: source.workout,
    draftInput: draft.draftInput,
    processingOptions: draft.processingOptions,
  };
}

function resolveSourceWorkout(input: {
  userId: string;
  activePlanId: string;
  workouts: readonly PersistedPlannedWorkoutRow[];
  sourceWorkoutId?: string;
  sourceWorkoutDate?: string;
}):
  | { ok: true; workout: PersistedPlannedWorkoutRow }
  | { ok: false; reason: ManualWorkoutCopyPasteFailureReason; message: string } {
  const matches = input.workouts.filter((workout) => {
    if (input.sourceWorkoutId) {
      return workout.id === input.sourceWorkoutId;
    }

    return workout.workout_date === input.sourceWorkoutDate;
  });

  if (matches.length !== 1) {
    return {
      ok: false,
      reason: "source_workout_not_found",
      message: "The source workout was not found in the current manual plan.",
    };
  }

  const workout = matches[0]!;
  if (workout.user_id !== input.userId || workout.plan_cycle_id !== input.activePlanId) {
    return {
      ok: false,
      reason: "source_workout_not_in_active_plan",
      message: "The source workout is not part of the current runner's active manual plan.",
    };
  }

  if (input.sourceWorkoutDate && workout.workout_date !== input.sourceWorkoutDate) {
    return {
      ok: false,
      reason: "source_date_changed",
      message: "The source workout is no longer on the copied date. Refresh the calendar.",
    };
  }

  return { ok: true, workout };
}

export function buildManualWorkoutDraftInputFromPersistedWorkout(
  workout: PersistedPlannedWorkoutRow,
  targetDate: string,
  context: {
    activePlanId: string;
    activePlanSourceKind: string | null;
  },
):
  | {
      ok: true;
      draftInput: ManualWorkoutDraftInput;
      processingOptions: ManualWorkoutDraftProcessingOptions;
    }
  | { ok: false; reason: ManualWorkoutCopyPasteFailureReason; message: string } {
  if (workout.workout_type === "rest") {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message: "Rest-only source days cannot be copied as manual workouts.",
    };
  }

  const templateKey = resolveSourceTemplateKey(workout);
  const processingOptions = buildPersistedWorkoutDraftProcessingOptions(workout);

  if (!templateKey || !processingOptions) {
    return {
      ok: false,
      reason: "source_workout_not_supported",
      message: "This source workout was not created from a supported manual workout template.",
    };
  }

  const reconstructedEntries = persistedStepsToManualEntries(
    readPersistedSteps(workout.steps),
    templateKey,
  );

  if (!reconstructedEntries.ok) {
    return reconstructedEntries;
  }

  const template = getManualWorkoutTemplate(templateKey);
  const draftInput: ManualWorkoutDraftInput = {
    templateKey,
    workoutDate: targetDate,
    title:
      normalizeManualDraftText(workout.title, MANUAL_DRAFT_TITLE_MAX_LENGTH) ??
      template.defaultTitle,
    notes:
      normalizeManualDraftText(workout.notes, MANUAL_DRAFT_NOTES_MAX_LENGTH) ??
      template.defaultNotes,
    targetTruthMode: deriveTargetTruthMode(workout),
    entries: reconstructedEntries.entries,
    context: {
      mode: "existing_active_plan",
      activePlanId: context.activePlanId,
      activePlanSourceKind: context.activePlanSourceKind ?? undefined,
      targetDateProtection: "none",
    },
  };

  return { ok: true, draftInput, processingOptions };
}

function resolveSourceTemplateKey(
  workout: PersistedPlannedWorkoutRow,
): ManualWorkoutTemplateKey | null {
  for (const candidate of [
    workout.source_workout_type,
    workout.workout_identity,
    workout.workout_family,
    workout.workout_type,
  ]) {
    if (isManualWorkoutTemplateKey(candidate)) {
      return candidate;
    }
  }

  const family = normalizeWorkoutFamily(workout.workout_family);
  if (!family) {
    return null;
  }

  switch (family) {
    case "recovery":
      return "recovery_jog";
    case "easy":
      return "easy_aerobic_run";
    case "steady":
      return "steady_aerobic_run";
    case "long":
      return "long_aerobic_run";
    case "tempo":
      return "controlled_tempo_session";
    case "intervals":
      return "time_intervals";
    case "progression":
    case "race":
      return "progression_run";
    case "hills":
      return "uphill_repeats";
    case "trail":
      return "technical_trail_easy";
    case "rest":
      return null;
  }
}

function buildPersistedWorkoutDraftProcessingOptions(
  workout: PersistedPlannedWorkoutRow,
): ManualWorkoutDraftProcessingOptions | null {
  const workoutIdentity = normalizeWorkoutIdentity(workout.workout_identity);
  const workoutFamily = normalizeWorkoutFamily(workout.workout_family);
  const calendarIconKey = normalizeCalendarIconKey(workout.calendar_icon_key);

  if (!workoutIdentity || !workoutFamily || !calendarIconKey || workoutFamily === "rest") {
    return null;
  }

  return {
    preservedWorkoutModel: {
      workoutType: canonicalFamilyToLegacyWorkoutType(workoutFamily, workoutIdentity),
      sourceWorkoutType: workout.source_workout_type ?? workoutIdentity,
      workoutFamily,
      workoutIdentity,
      calendarIconKey,
    },
  };
}

function persistedStepsToManualEntries(
  steps: Step[],
  templateKey: ManualWorkoutTemplateKey,
):
  | { ok: true; entries: ManualWorkoutConstructorEntryInput[] }
  | { ok: false; reason: ManualWorkoutCopyPasteFailureReason; message: string } {
  if (steps.length === 0) {
    return {
      ok: false,
      reason: "unsupported_payload",
      message: "This source workout has no executable segment structure to copy.",
    };
  }

  const entries: ManualWorkoutConstructorEntryInput[] = [];

  for (const step of steps) {
    const entry = persistedStepToEntry(step, templateKey);

    if (!entry) {
      return {
        ok: false,
        reason: "unsupported_payload",
        message:
          "This source workout has segment structure that cannot reconstruct a manual draft.",
      };
    }

    entries.push(entry);
  }

  return { ok: true, entries };
}

function persistedStepToEntry(
  step: Step,
  templateKey: ManualWorkoutTemplateKey,
): ManualWorkoutConstructorEntryInput | null {
  if (step.repeats || step.prescription?.mode === "repeats") {
    const children = repeatChildStepsForPersistedStep(step)
      .map((childStep) =>
        persistedStepToBlock(childStep, templateKey, repeatChildReconstructionRole(childStep)),
      )
      .filter((block): block is ManualWorkoutBlockInput => Boolean(block));
    const repeatCount = step.repeats ?? step.prescription?.repeat_count;
    const workBlock = children[0];
    const recoveryBlock = children.find((block) =>
      isManualWorkoutRepeatRecoveryBlock(block.blockKey),
    );

    if (!repeatCount || repeatCount < 2 || !workBlock) {
      return null;
    }

    return {
      kind: "repeat_group",
      group: {
        repeatCount,
        safetyKind: repeatSafetyKindForStep(step, templateKey),
        ...optionalStringField(
          "groupLabel",
          normalizeManualDraftText(step.label, MANUAL_DRAFT_LABEL_MAX_LENGTH),
        ),
        workBlock,
        ...(recoveryBlock ? { recoveryBlock } : {}),
        children,
      },
    };
  }

  const block = persistedStepToBlock(step, templateKey, "block");

  return block ? { kind: "block", block } : null;
}

function repeatChildStepsForPersistedStep(step: Step): Step[] {
  return workoutDocumentRepeatChildren(step);
}

function repeatChildReconstructionRole(step: Step): StepRepeatChildPrescription["role"] {
  switch (step.segment_type) {
    case "warm_up":
    case "run":
    case "walk":
    case "work":
    case "recover":
    case "finish":
    case "cooldown":
      return step.segment_type;
  }

  const signal = `${step.segment_type ?? ""} ${step.type ?? ""} ${step.label ?? ""}`.toLowerCase();

  if (signal.includes("warm")) return "warm_up";
  if (signal.includes("cool")) return "cooldown";
  if (signal.includes("recover")) return "recover";
  if (signal.includes("walk")) return "walk";
  if (signal.includes("finish")) return "finish";
  if (signal.includes("run")) return "run";
  return "work";
}

function persistedStepToBlock(
  step: Step,
  templateKey: ManualWorkoutTemplateKey,
  role: "block" | StepRepeatChildPrescription["role"],
): ManualWorkoutBlockInput | null {
  const blockKey = blockKeyForStep(step, templateKey, role);

  if (!blockKey) {
    return null;
  }

  const unit = blockUnitForStep(step);

  if (!unit.durationSeconds && !unit.distanceMeters) {
    return null;
  }

  const target = sanitizeStepTarget(step.target);

  return {
    blockKey,
    ...optionalStringField(
      "label",
      normalizeManualDraftText(step.label, MANUAL_DRAFT_LABEL_MAX_LENGTH),
    ),
    ...unit,
    ...optionalStringField(
      "noteText",
      normalizeManualDraftText(step.guidance, MANUAL_DRAFT_NOTE_TEXT_MAX_LENGTH),
    ),
    ...(target ? { target } : {}),
  };
}

function blockUnitForStep(step: Step) {
  const durationMin = step.duration_min ?? step.prescription?.duration_min;
  const distanceKm = step.distance_km ?? step.prescription?.distance_km;

  return {
    ...(durationMin ? { durationSeconds: Math.round(durationMin * 60) } : {}),
    ...(distanceKm ? { distanceMeters: Math.round(distanceKm * 1000) } : {}),
  };
}

function blockKeyForStep(
  step: Step,
  templateKey: ManualWorkoutTemplateKey,
  role: "block" | StepRepeatChildPrescription["role"],
): ManualWorkoutBlockInput["blockKey"] | null {
  if (role === "warm_up") return "warmup_block";
  if (role === "cooldown") return "cooldown_block";
  if (role === "finish") return "long_run_finish_block";
  if (role === "walk") return "rest_walk_jog_recovery_block";
  if (role === "recover") {
    return templateKey === "uphill_repeats" || templateKey === "run_walk_adaptation"
      ? "rest_walk_jog_recovery_block"
      : "interval_recovery_block";
  }
  if (role === "run") return "easy_run_block";

  const signal = `${step.segment_type ?? ""} ${step.type ?? ""}`.toLowerCase();

  if (role === "work" && templateKey === "easy_run_with_strides") {
    return "strides_block";
  }

  if (signal.includes("warmup")) return "warmup_block";
  if (signal.includes("cooldown")) return "cooldown_block";
  if (signal.includes("stride")) return "strides_block";
  if (signal.includes("tempo")) {
    return templateKey === "half_marathon_threshold_durability" ? "threshold_block" : "tempo_block";
  }
  if (signal.includes("threshold")) return "threshold_block";
  if (signal.includes("hill")) return "hill_work_block";
  if (signal.includes("progression")) return "progression_block";
  if (signal.includes("steady")) return "steady_run_block";
  if (signal.includes("long_run_finish")) return "long_run_finish_block";
  if (signal.includes("long_run_body")) return "long_run_body_block";
  if (signal.includes("interval")) {
    return templateKey === "uphill_repeats" ? "hill_work_block" : "interval_work_block";
  }

  switch (templateKey) {
    case "steady_aerobic_run":
    case "rolling_hills_session":
      return "steady_run_block";
    case "progression_run":
      return "progression_block";
    case "controlled_tempo_session":
      return "tempo_block";
    case "half_marathon_threshold_durability":
      return "threshold_block";
    case "time_intervals":
    case "distance_intervals":
      return role === "work" ? "interval_work_block" : "easy_run_block";
    case "long_aerobic_run":
    case "cutback_long_run":
    case "taper_long_run":
      return "long_run_body_block";
    case "long_run_with_steady_finish":
      return signal.includes("finish") ? "long_run_finish_block" : "long_run_body_block";
    case "uphill_repeats":
      return role === "work" ? "hill_work_block" : "steady_run_block";
    case "technical_trail_easy":
    case "run_walk_adaptation":
    case "recovery_jog":
    case "easy_aerobic_run":
    case "easy_run_with_strides":
      return "easy_run_block";
    case "rest_day":
      return null;
  }
}

function repeatSafetyKindForStep(
  step: Step,
  templateKey: ManualWorkoutTemplateKey,
): ManualWorkoutRepeatSafetyKind {
  const signal = `${step.type ?? ""} ${step.segment_type ?? ""}`.toLowerCase();
  const childRoles = new Set(
    workoutDocumentRepeatChildren(step).map((child) => child.segment_type),
  );

  if (childRoles.has("run") && childRoles.has("walk")) return "run_walk";
  if (signal.includes("tempo") || signal.includes("threshold")) return "tempo_repeats";
  if (signal.includes("hill") || signal.includes("climb") || signal.includes("downhill")) {
    return "hill_repeats";
  }
  if (signal.includes("stride")) return "strides";

  switch (templateKey) {
    case "controlled_tempo_session":
    case "half_marathon_threshold_durability":
      return "tempo_repeats";
    case "uphill_repeats":
      return "hill_repeats";
    case "run_walk_adaptation":
      return "run_walk";
    case "easy_run_with_strides":
      return "strides";
    default:
      return step.type === "strides" || step.segment_type === "strides" ? "strides" : "intervals";
  }
}

function sanitizeStepTarget(target: StepTarget | undefined): ManualWorkoutBlockInput["target"] {
  if (!target) {
    return undefined;
  }

  const isUserEnteredTarget =
    target.target_source === "user_entered" || target.target_source === "runner_entered";
  const isAiAuthoredTarget = target.target_source === AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE;
  const isEditableTarget = isUserEnteredTarget || isAiAuthoredTarget;
  const paceRange = normalizeManualDraftText(
    target.pace_min_per_km_range ?? target.pace_range_min_km,
    MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH,
  );
  const pace = normalizeManualDraftText(target.pace, MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH);
  const paceProvenance = AI_AUTHORED_PACE_PROVENANCE_VALUES.find(
    (candidate) => target.extra?.pace_provenance === candidate,
  );
  const hrBpmRange = normalizeManualDraftText(
    target.hr_bpm_range,
    MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH,
  );
  const hrBpmCap = normalizeHrBpmCap(target.hr_bpm_cap ?? target.hr_bpm);
  const hrZone =
    typeof target.extra?.hr_zone === "string"
      ? normalizeManualDraftText(target.extra.hr_zone, MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH)
      : null;
  const hrZoneReference =
    typeof target.extra?.hr_zone_reference === "string"
      ? normalizeManualDraftText(
          target.extra.hr_zone_reference,
          MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH,
        )
      : null;
  const hrProfileSource =
    target.extra?.hr_profile_source === "personal" ||
    target.extra?.hr_profile_source === "estimated"
      ? target.extra.hr_profile_source
      : null;
  const targetSource = isAiAuthoredTarget
    ? AI_AUTHORED_PLAN_GUIDANCE_TARGET_SOURCE
    : "user_entered";
  const sanitized: ManualWorkoutBlockInput["target"] = {
    ...(target.primary_execution_mode
      ? { primaryExecutionMode: target.primary_execution_mode }
      : {}),
    ...(isEditableTarget ? { targetSource } : {}),
    ...optionalStringField(
      "intensity",
      normalizeManualDraftText(target.intensity, MANUAL_DRAFT_TARGET_LABEL_MAX_LENGTH),
    ),
    ...optionalStringField(
      "label",
      normalizeManualDraftText(target.label, MANUAL_DRAFT_TARGET_LABEL_MAX_LENGTH),
    ),
    ...optionalStringField(
      "sourceNote",
      normalizeManualDraftText(target.source_note, MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH),
    ),
    ...optionalStringField(
      "cue",
      normalizeManualDraftText(target.cue, MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH),
    ),
    ...optionalStringField(
      "hint",
      normalizeManualDraftText(target.hint, MANUAL_DRAFT_TARGET_TEXT_MAX_LENGTH),
    ),
    ...(normalizeManualDraftRpe(target.rpe) ? { rpe: normalizeManualDraftRpe(target.rpe) } : {}),
    ...(isEditableTarget && pace
      ? {
          pace,
          paceTargetSource: targetSource,
        }
      : {}),
    ...(isEditableTarget && paceRange
      ? {
          paceMinPerKmRange: paceRange,
          paceTargetSource: targetSource,
        }
      : {}),
    ...(isAiAuthoredTarget && paceProvenance ? { paceProvenance } : {}),
    ...(isAiAuthoredTarget && hrZone ? { hrZone } : {}),
    ...(isAiAuthoredTarget && hrZoneReference ? { hrZoneReference } : {}),
    ...(isAiAuthoredTarget && hrProfileSource ? { hrProfileSource } : {}),
    ...(isAiAuthoredTarget &&
    (target.hr_target_source === "personal_hr_zone" ||
      target.hr_target_source === "default_estimated_hr" ||
      target.hr_target_source === "effort_only")
      ? { hrTargetSource: target.hr_target_source }
      : {}),
    ...(isAiAuthoredTarget && hrBpmRange ? { hrBpmRange } : {}),
    ...(isUserEnteredTarget && (target.hr_target_source === "user_entered" || hrBpmCap)
      ? { hrTargetSource: "user_entered" }
      : {}),
    ...(isUserEnteredTarget && hrBpmCap ? { hrBpmCap } : {}),
    ...(isUserEnteredTarget && hrBpmRange ? { hrBpmRange } : {}),
  };

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function readPersistedSteps(value: unknown): Step[] {
  return readWorkoutDocumentSections(value);
}

function deriveTargetTruthMode(workout: PersistedPlannedWorkoutRow): ManualWorkoutTargetTruthMode {
  const metricMode = readRecord(workout.metric_mode);

  if (metricMode.executable_mode === "none") {
    return "none";
  }

  return "structure_only";
}

function isManualWorkoutTemplateKey(value: unknown): value is ManualWorkoutTemplateKey {
  return (
    typeof value === "string" &&
    (MANUAL_WORKOUT_TEMPLATE_KEY_VALUES as readonly string[]).includes(value)
  );
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeManualDraftText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeManualDraftRpe(value: StepTarget["rpe"]): StepTarget["rpe"] | undefined {
  if (typeof value === "number") {
    return value;
  }

  return normalizeManualDraftText(value, MANUAL_DRAFT_TARGET_RPE_MAX_LENGTH);
}

function normalizeHrBpmCap(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value.trim().replace(/\s*bpm$/i, ""));
  return Number.isInteger(parsed) ? parsed : undefined;
}

function optionalStringField<Key extends string>(key: Key, value: string | undefined) {
  return value ? ({ [key]: value } as Record<Key, string>) : {};
}
