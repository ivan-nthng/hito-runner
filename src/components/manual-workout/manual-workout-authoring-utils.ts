import { hitoDateFromIso } from "@/components/ui/hito-date-time-utils";
import { buildPlannedWorkoutLanguage } from "@/lib/planned-workout-language";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";
import {
  listManualWorkoutTemplates,
  type ManualWorkoutTemplate,
} from "@/lib/manual-workout-authoring/templates";
import { workoutTypeColorVar } from "@/lib/workout-color-tokens";
import type { PlannedWorkoutLanguageReadModel } from "@/lib/planned-workout-language";
import { workoutGlyphFromCalendarIconKey, type WorkoutGlyphKind } from "@/lib/workout-glyph";

export const MANUAL_WORKOUT_TEMPLATES = listManualWorkoutTemplates();

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
  return template
    ? workoutTypeColorVar(templateRunnerFacingLanguage(template).runnerFacingWorkoutType, "content")
    : "var(--color-muted-foreground)";
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
