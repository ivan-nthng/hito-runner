import { hitoDateFromIso } from "@/components/ui/hito-date-time-utils";
import { buildPlannedWorkoutLanguage } from "@/lib/planned-workout-language";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";
import {
  listManualWorkoutTemplates,
  listVisibleManualWorkoutStarterTemplates,
  type ManualWorkoutTemplate,
} from "@/lib/manual-workout-authoring/templates";
import { workoutTypeColorVar } from "@/lib/workout-color-tokens";
import type { PlannedWorkoutLanguageReadModel } from "@/lib/planned-workout-language";
import type {
  ManualWorkoutBlockInput,
  ManualWorkoutConstructorEntryInput,
  ManualWorkoutDraftInput,
  ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import {
  getManualWorkoutRepeatGroupChildren,
  isManualWorkoutRepeatRecoveryBlock,
} from "@/lib/manual-workout-authoring/repeat-groups";
import type { WorkoutSegmentLike } from "@/lib/rich-workout-model";
import { workoutGlyphFromCalendarIconKey, type WorkoutGlyphKind } from "@/lib/workout-glyph";

export const MANUAL_WORKOUT_TEMPLATES = listManualWorkoutTemplates();
export const VISIBLE_MANUAL_WORKOUT_STARTER_TEMPLATES = listVisibleManualWorkoutStarterTemplates();

export function buildManualDraftInput({
  activePlanId,
  activePlanSourceKind,
  contextMode,
  date,
  notes,
  targetTruthMode,
  template,
  title,
  entries,
}: {
  activePlanId?: string;
  activePlanSourceKind?: string;
  contextMode: "no_active_plan_draft" | "existing_active_plan";
  date: string;
  entries?: ManualWorkoutConstructorEntryInput[];
  notes: string;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  template: ManualWorkoutTemplate;
  title: string;
}): ManualWorkoutDraftInput {
  return {
    templateKey: template.templateKey,
    workoutDate: date,
    title: title.trim() || template.defaultTitle,
    notes: notes.trim() || null,
    targetTruthMode,
    entries: entries
      ? cloneManualWorkoutEntries(entries)
      : cloneManualWorkoutEntries(template.defaultEntries),
    context: {
      mode: contextMode,
      ...(activePlanId ? { activePlanId } : {}),
      ...(activePlanSourceKind ? { activePlanSourceKind } : {}),
      targetDateProtection: "none",
    },
  };
}

export function cloneManualWorkoutEntries(
  entries: ManualWorkoutConstructorEntryInput[],
): ManualWorkoutConstructorEntryInput[] {
  return entries.map((entryValue) => {
    if (entryValue.kind === "repeat_group") {
      const children = getManualWorkoutRepeatGroupChildren(entryValue.group).map(
        cloneManualWorkoutBlock,
      );
      const recoveryBlock = children.find((child) =>
        isManualWorkoutRepeatRecoveryBlock(child.blockKey),
      );

      return {
        kind: "repeat_group",
        group: {
          ...entryValue.group,
          children,
          workBlock: children[0] ?? cloneManualWorkoutBlock(entryValue.group.workBlock),
          ...(recoveryBlock ? { recoveryBlock } : {}),
        },
      };
    }

    return {
      kind: "block",
      block: cloneManualWorkoutBlock(entryValue.block),
    };
  });
}

function cloneManualWorkoutBlock(block: ManualWorkoutBlockInput): ManualWorkoutBlockInput {
  return {
    ...block,
    ...(block.target ? { target: { ...block.target } } : {}),
  };
}

export function getDefaultManualWorkoutTemplate(templateKey: ManualWorkoutTemplate["templateKey"]) {
  return (
    MANUAL_WORKOUT_TEMPLATES.find((template) => template.templateKey === templateKey) ??
    MANUAL_WORKOUT_TEMPLATES[0]!
  );
}

export function templateRunnerFacingLanguage(
  template: ManualWorkoutTemplate,
): PlannedWorkoutLanguageReadModel {
  return buildPlannedWorkoutLanguage({
    workoutType: template.workoutType,
    sourceWorkoutType: template.templateKey,
    workoutFamily: template.workoutFamily,
    workoutIdentity: template.workoutIdentity,
    calendarIconKey: template.calendarIconKey,
    title: template.defaultTitle,
    steps: manualWorkoutEntriesToLanguageSteps(template.defaultEntries),
  });
}

export function templateRunnerFacingLabel(template: ManualWorkoutTemplate) {
  return templateRunnerFacingLanguage(template).runnerFacingWorkoutTypeLabel;
}

export function manualTemplateRunnerLabelFromKey(templateKey: string) {
  const template = MANUAL_WORKOUT_TEMPLATES.find((item) => item.templateKey === templateKey);

  return template ? templateRunnerFacingLabel(template) : "Workout";
}

export function formatReadableDate(iso: string) {
  const date = hitoDateFromIso(iso) ?? parseIsoDateAsLocalCalendarDay(iso);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(date);
}

export function workoutToneColor(template: ManualWorkoutTemplate) {
  return workoutTypeColorVar(
    templateRunnerFacingLanguage(template).runnerFacingWorkoutType,
    "base",
  );
}

export function templateWorkoutColorIndicatorStyle(template: ManualWorkoutTemplate) {
  const type = templateRunnerFacingLanguage(template).runnerFacingWorkoutType;

  return {
    background: workoutTypeColorVar(type, "base"),
    borderColor: workoutTypeColorVar(type, "border"),
    boxShadow: `0 0 0 2px ${workoutTypeColorVar(type, "ring")}`,
  };
}

export function templateIconKind(template: ManualWorkoutTemplate | null | undefined) {
  return workoutGlyphFromCalendarIconKey(template?.calendarIconKey ?? "easy") as WorkoutGlyphKind;
}

export function templateIconTone(template: ManualWorkoutTemplate | null | undefined) {
  return template ? workoutToneColor(template) : "var(--color-muted-foreground)";
}

export function targetTruthModeLabel(mode: ManualWorkoutTargetTruthMode | string) {
  if (mode === "none") return "Rest / no run";
  return "Structure-first guidance";
}

export function targetTruthModeCopy(mode: ManualWorkoutTargetTruthMode) {
  if (mode === "none") {
    return "Use this for rest or no-run days. Hito will not create a running target.";
  }

  return "Follow the reviewed workout structure. Hito will not invent pace or personal heart-rate targets.";
}

export function formatManualDraftStructure(totalDurationMin: number, totalDistanceKm: number) {
  const parts: string[] = [];

  if (totalDurationMin > 0) {
    parts.push(formatDurationMin(totalDurationMin));
  }

  if (totalDistanceKm > 0) {
    parts.push(formatDistanceMeters(totalDistanceKm * 1000));
  }

  return parts.length ? parts.join(" · ") : "Reviewed structure";
}

function parseIsoDateAsLocalCalendarDay(iso: string) {
  const [year = "1970", month = "01", day = "01"] = iso.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function manualWorkoutEntriesToLanguageSteps(
  entries: ManualWorkoutConstructorEntryInput[],
): WorkoutSegmentLike[] {
  return entries.map((entryValue) => {
    if (entryValue.kind === "repeat_group") {
      const repeatChildren = getManualWorkoutRepeatGroupChildren(entryValue.group);
      const children = repeatChildren.map(manualWorkoutBlockToLanguageStep);
      const recoveryIndex = repeatChildren.findIndex((child) =>
        isManualWorkoutRepeatRecoveryBlock(child.blockKey),
      );

      return {
        type: "repeats",
        segment_type: "repeat_group",
        label: entryValue.group.groupLabel ?? null,
        repeat_count: entryValue.group.repeatCount,
        children,
        work: children[0] ?? manualWorkoutBlockToLanguageStep(entryValue.group.workBlock),
        recovery: recoveryIndex >= 0 ? (children[recoveryIndex] ?? null) : null,
      };
    }

    return manualWorkoutBlockToLanguageStep(entryValue.block);
  });
}

function manualWorkoutBlockToLanguageStep(block: ManualWorkoutBlockInput): WorkoutSegmentLike {
  return {
    type: block.blockKey,
    segment_type: block.blockKey,
    label: block.label ?? null,
    duration_min: block.durationSeconds ? block.durationSeconds / 60 : null,
    distance_km: block.distanceMeters ? block.distanceMeters / 1000 : null,
    target: block.target ?? null,
  };
}
