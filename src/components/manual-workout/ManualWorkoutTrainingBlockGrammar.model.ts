import {
  displayExecutableTargetEntries,
  displayTargetEntries,
  repeatChildSteps,
  repeatCountForStep,
  segmentColorMeta,
} from "@/lib/training";
import {
  formatHitoProductMessage,
  getHitoKnownProductMessage,
  getHitoProductMessage,
} from "@/lib/ui-locale-messages";
import { DEFAULT_RESOLVED_UI_LOCALE, formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";
import type { WorkoutDocumentSection } from "@/lib/workout-document";

export type ManualWorkoutReadbackEntry =
  | {
      kind: "segment";
      id: string;
      markerColor: string;
      ordinal?: string;
      roleLabel?: string;
      title: string;
      targetSummary: string;
      durationSummary: string;
      nested?: boolean;
    }
  | {
      kind: "repeat";
      id: string;
      repeatCount: number;
      title: string;
      summary: string;
      children: ManualWorkoutReadbackSegmentEntry[];
    };

type ManualWorkoutReadbackSegmentEntry = Extract<ManualWorkoutReadbackEntry, { kind: "segment" }>;

export function workoutDocumentSectionsToManualReadbackEntries(
  steps: WorkoutDocumentSection[],
  locale: ResolvedUiLocale = DEFAULT_RESOLVED_UI_LOCALE,
): ManualWorkoutReadbackEntry[] {
  return steps.map((step, index) => {
    const repeatCount = repeatCountForStep(step);
    const children = repeatChildSteps(step);

    if (repeatCount && children.length > 0) {
      return {
        kind: "repeat",
        id: `manual-preview-repeat-${index}-${repeatCount}`,
        repeatCount,
        title: getHitoProductMessage(locale, "Repeats"),
        summary: repeatChildrenSummary(children.length, locale),
        children: children.map((child, childIndex) =>
          stepToReadbackSegment(
            child,
            {
              id: `manual-preview-repeat-${index}-child-${childIndex}-${child.label ?? child.type}`,
              nested: true,
            },
            locale,
          ),
        ),
      };
    }

    return stepToReadbackSegment(
      step,
      {
        id: `manual-preview-segment-${index}-${step.label ?? step.type}`,
        ordinal: String(index + 1).padStart(2, "0"),
      },
      locale,
    );
  });
}

function stepToReadbackSegment(
  step: WorkoutDocumentSection,
  options: {
    id: string;
    nested?: boolean;
    ordinal?: string;
    roleLabel?: string;
  },
  locale: ResolvedUiLocale,
): ManualWorkoutReadbackSegmentEntry {
  const meta = stepMeta(step);

  return {
    kind: "segment",
    id: options.id,
    markerColor: meta.color,
    nested: options.nested,
    ordinal: options.ordinal,
    roleLabel: options.roleLabel,
    title: step.label ?? getHitoKnownProductMessage(locale, meta.label),
    targetSummary: stepTargetSummary(step, locale),
    durationSummary: stepStructureSummary(step, locale),
  };
}

function stepTargetSummary(step: WorkoutDocumentSection, locale: ResolvedUiLocale) {
  const allEntries = displayTargetEntries(step.target);
  const executableEntries = displayExecutableTargetEntries(step.target);
  const executableKeys = new Set(executableEntries.map((entry) => entry.key));
  const entries = [
    ...executableEntries,
    ...allEntries.filter((entry) => !executableKeys.has(entry.key)),
  ].slice(0, 2);

  if (entries.length === 0) return getHitoProductMessage(locale, "No target");

  return entries
    .map((entry) => `${getHitoKnownProductMessage(locale, entry.label)} · ${entry.value}`)
    .join(" · ");
}

function stepStructureSummary(step: WorkoutDocumentSection, locale: ResolvedUiLocale) {
  const durationMin = step.duration_min ?? step.prescription?.duration_min;
  const distanceKm = step.distance_km ?? step.prescription?.distance_km;
  const parts = [
    durationMin ? formatSegmentDuration(durationMin, locale) : null,
    distanceKm ? formatPrescriptionDistance(distanceKm, locale) : null,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(" · ");

  return step.guidance ?? getHitoProductMessage(locale, "Structure");
}

function stepMeta(step: WorkoutDocumentSection) {
  return segmentColorMeta(
    `${step.segment_type ?? ""} ${step.type} ${step.label ?? ""}`,
    step.target,
  );
}

function repeatChildrenSummary(childCount: number, locale: ResolvedUiLocale) {
  return childCount === 1
    ? getHitoProductMessage(locale, "1 section repeats together")
    : formatHitoProductMessage(locale, "{count} sections repeat together", { count: childCount });
}

function formatSegmentDuration(durationMin: number, locale: ResolvedUiLocale) {
  const totalSeconds = Math.max(1, Math.round(durationMin * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minuteLabel = locale === "pt-BR" ? "min" : "min";
  const secondLabel = locale === "pt-BR" ? "s" : "sec";

  if (minutes <= 0) return `${formatUiNumber(seconds, locale)} ${secondLabel}`;
  if (seconds === 0) return `${formatUiNumber(minutes, locale)} ${minuteLabel}`;
  return `${formatUiNumber(minutes, locale)} ${minuteLabel} ${formatUiNumber(seconds, locale)} ${secondLabel}`;
}

function formatPrescriptionDistance(distanceKm: number, locale: ResolvedUiLocale) {
  if (distanceKm > 0 && distanceKm < 2) {
    return `${formatUiNumber(Math.round(distanceKm * 1000), locale)} m`;
  }

  return `${formatUiNumber(distanceKm, locale, { maximumFractionDigits: 2 })} km`;
}
