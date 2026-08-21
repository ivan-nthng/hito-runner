import {
  displayExecutableTargetEntries,
  displayTargetEntries,
  formatDurationMin,
  formatPrescriptionDistanceKm,
  repeatChildSteps,
  repeatCountForStep,
  segmentColorMeta,
} from "@/lib/training";
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
): ManualWorkoutReadbackEntry[] {
  return steps.map((step, index) => {
    const repeatCount = repeatCountForStep(step);
    const children = repeatChildSteps(step);

    if (repeatCount && children.length > 0) {
      return {
        kind: "repeat",
        id: `manual-preview-repeat-${index}-${repeatCount}`,
        repeatCount,
        title: "Repeats",
        summary: repeatChildrenSummary(children.length),
        children: children.map((child, childIndex) =>
          stepToReadbackSegment(child, {
            id: `manual-preview-repeat-${index}-child-${childIndex}-${child.label ?? child.type}`,
            nested: true,
          }),
        ),
      };
    }

    return stepToReadbackSegment(step, {
      id: `manual-preview-segment-${index}-${step.label ?? step.type}`,
      ordinal: String(index + 1).padStart(2, "0"),
    });
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
): ManualWorkoutReadbackSegmentEntry {
  const meta = stepMeta(step);

  return {
    kind: "segment",
    id: options.id,
    markerColor: meta.color,
    nested: options.nested,
    ordinal: options.ordinal,
    roleLabel: options.roleLabel,
    title: step.label ?? meta.label,
    targetSummary: stepTargetSummary(step),
    durationSummary: stepStructureSummary(step),
  };
}

function stepTargetSummary(step: WorkoutDocumentSection) {
  const allEntries = displayTargetEntries(step.target);
  const executableEntries = displayExecutableTargetEntries(step.target);
  const executableKeys = new Set(executableEntries.map((entry) => entry.key));
  const entries = [
    ...executableEntries,
    ...allEntries.filter((entry) => !executableKeys.has(entry.key)),
  ].slice(0, 2);

  if (entries.length === 0) return "No target";

  return entries.map((entry) => `${entry.label} · ${entry.value}`).join(" · ");
}

function stepStructureSummary(step: WorkoutDocumentSection) {
  const durationMin = step.duration_min ?? step.prescription?.duration_min;
  const distanceKm = step.distance_km ?? step.prescription?.distance_km;
  const parts = [
    durationMin ? formatDurationMin(durationMin, "segment") : null,
    distanceKm ? formatPrescriptionDistanceKm(distanceKm) : null,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(" · ");

  return step.guidance ?? "Structure";
}

function stepMeta(step: WorkoutDocumentSection) {
  return segmentColorMeta(
    `${step.segment_type ?? ""} ${step.type} ${step.label ?? ""}`,
    step.target,
  );
}

function repeatChildrenSummary(childCount: number) {
  return childCount === 1 ? "1 section repeats together" : `${childCount} sections repeat together`;
}
