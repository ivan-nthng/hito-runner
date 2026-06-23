import { hitoDateFromIso } from "@/components/ui/hito-date-time-utils";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";
import {
  listManualWorkoutTemplates,
  type ManualWorkoutTemplate,
} from "@/lib/manual-workout-authoring/templates";
import type {
  ManualWorkoutBlockInput,
  ManualWorkoutConstructorEntryInput,
  ManualWorkoutDraftInput,
  ManualWorkoutTargetTruthMode,
} from "@/lib/manual-workout-authoring/schema";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";

const MANUAL_TEMPLATE_GROUPS: Array<{
  id: string;
  label: string;
  match: (template: ManualWorkoutTemplate) => boolean;
}> = [
  {
    id: "rest-recovery",
    label: "Rest and recovery",
    match: (template) => template.workoutType === "rest" || template.workoutFamily === "recovery",
  },
  {
    id: "easy",
    label: "Easy aerobic",
    match: (template) =>
      template.workoutFamily === "easy" ||
      template.workoutFamily === "steady" ||
      template.workoutFamily === "progression",
  },
  {
    id: "long",
    label: "Long run",
    match: (template) => template.workoutFamily === "long",
  },
  {
    id: "quality",
    label: "Quality",
    match: (template) =>
      template.workoutFamily === "tempo" || template.workoutFamily === "intervals",
  },
  {
    id: "terrain",
    label: "Hills and terrain",
    match: (template) => template.workoutFamily === "hills" || template.workoutFamily === "trail",
  },
  {
    id: "adaptation",
    label: "Adaptation",
    match: (template) => template.templateKey === "run_walk_adaptation",
  },
];

export const MANUAL_WORKOUT_TEMPLATES = listManualWorkoutTemplates();

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
      return {
        kind: "repeat_group",
        group: {
          ...entryValue.group,
          workBlock: cloneManualWorkoutBlock(entryValue.group.workBlock),
          ...(entryValue.group.recoveryBlock
            ? { recoveryBlock: cloneManualWorkoutBlock(entryValue.group.recoveryBlock) }
            : {}),
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

export function groupManualTemplates() {
  const grouped = MANUAL_TEMPLATE_GROUPS.map((group) => ({
    ...group,
    templates: MANUAL_WORKOUT_TEMPLATES.filter(group.match),
  })).filter((group) => group.templates.length > 0);
  const groupedKeys = new Set(
    grouped.flatMap((group) => group.templates.map((template) => template.templateKey)),
  );
  const remaining = MANUAL_WORKOUT_TEMPLATES.filter(
    (template) => !groupedKeys.has(template.templateKey),
  );

  return remaining.length
    ? [
        ...grouped,
        { id: "other", label: "Other templates", match: () => false, templates: remaining },
      ]
    : grouped;
}

export function getDefaultManualWorkoutTemplate(templateKey: ManualWorkoutTemplate["templateKey"]) {
  return (
    MANUAL_WORKOUT_TEMPLATES.find((template) => template.templateKey === templateKey) ??
    MANUAL_WORKOUT_TEMPLATES[0]!
  );
}

export function formatReadableDate(iso: string) {
  const date = hitoDateFromIso(iso) ?? parseIsoDateAsLocalCalendarDay(iso);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(date);
}

export function templateShortLabel(template: ManualWorkoutTemplate) {
  if (template.workoutType === "rest") return "Rest";
  if (template.workoutFamily === "long") return "Long";
  if (template.workoutFamily === "tempo") return "Tempo";
  if (template.workoutFamily === "intervals") return "Intervals";
  if (template.workoutFamily === "hills") return "Hills";
  if (template.workoutFamily === "trail") return "Trail";
  if (template.workoutFamily === "recovery") return "Recovery";
  if (template.workoutFamily === "steady") return "Steady";
  if (template.workoutFamily === "progression") return "Progression";
  return "Easy";
}

export function workoutToneColor(template: ManualWorkoutTemplate) {
  if (template.workoutType === "rest") return "var(--color-muted-foreground)";
  if (template.workoutFamily === "long") return "var(--color-signal)";
  if (
    template.workoutFamily === "tempo" ||
    template.workoutFamily === "intervals" ||
    template.workoutFamily === "hills"
  ) {
    return "var(--color-warning)";
  }
  if (template.workoutFamily === "trail") return "var(--color-success)";
  if (template.workoutFamily === "recovery") return "var(--color-info)";
  return "var(--color-foreground)";
}

export function templateWorkoutIdentity(template: ManualWorkoutTemplate) {
  return {
    color: workoutToneColor(template),
    glyph: template.calendarIconKey as WorkoutGlyphKind,
    label: template.label,
    short: templateShortLabel(template),
  };
}

export function templateIconKind(template: ManualWorkoutTemplate | null | undefined) {
  return (template?.calendarIconKey ?? "easy") as WorkoutGlyphKind;
}

export function templateIconTone(template: ManualWorkoutTemplate | null | undefined) {
  return template ? workoutToneColor(template) : "var(--color-muted-foreground)";
}

export function targetTruthModeLabel(mode: ManualWorkoutTargetTruthMode | string) {
  if (mode === "editable_default_hr") return "Advisory HR guidance";
  if (mode === "none") return "Rest or no run";
  return "Structure guidance";
}

export function targetTruthModeCopy(mode: ManualWorkoutTargetTruthMode) {
  if (mode === "editable_default_hr") {
    return "Keep the workout structure and show editable, advisory HR guidance. This is not a personal HR target.";
  }

  if (mode === "none") {
    return "Use this for rest or no-run days. No workout target is created.";
  }

  return "Use duration, distance, repeats, work, and recovery. Pace and personal HR stay blank unless backend truth exists.";
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
