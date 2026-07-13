import {
  displayTargetSupportEntries,
  repeatChildSteps,
  repeatCountForStep,
  type Step,
} from "@/lib/training";
import type { WorkoutDocumentNote } from "@/components/workout-structure/WorkoutDocumentReadback";

export function workoutDocumentNotesForSteps(steps: Step[], limit = 8): WorkoutDocumentNote[] {
  const notes = steps.flatMap((step, stepIndex) =>
    workoutDocumentNotesForStep(step, `${stepIndex}`),
  );

  return dedupeWorkoutDocumentNotes(notes).slice(0, limit);
}

export function dedupeWorkoutDocumentNotes(notes: WorkoutDocumentNote[]) {
  const seen = new Set<string>();

  return notes.filter((note) => {
    const key = note.value.trim().replace(/\s+/g, " ").toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function workoutDocumentNotesForStep(step: Step, key: string): WorkoutDocumentNote[] {
  const repeatCount = repeatCountForStep(step);
  const repeatChildren = repeatChildSteps(step);
  const ownNotes = buildWorkoutDocumentNotes(step, key);

  if (!repeatCount || repeatChildren.length === 0) return ownNotes;

  return [
    ...ownNotes,
    ...repeatChildren.flatMap((child, index) =>
      buildWorkoutDocumentNotes(child, `${key}-child-${index + 1}`),
    ),
  ];
}

function buildWorkoutDocumentNotes(step: Step, key: string): WorkoutDocumentNote[] {
  const notes: Array<WorkoutDocumentNote | null> = [
    readGuidanceEntry("Cue", step.guidance),
    ...displayTargetSupportEntries(step.target).map((entry) => ({
      key: `${key}-${entry.label}`,
      label: entry.label,
      value: entry.value,
    })),
  ];

  return notes.filter((entry): entry is WorkoutDocumentNote => entry != null);
}

function readGuidanceEntry(label: string, value: unknown) {
  const normalized = readGuidanceText(value);

  return normalized ? { key: `${label}-${normalized}`, label, value: normalized } : null;
}

function readGuidanceText(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();

    return normalized || null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const nested = (value as { guidance?: unknown }).guidance;

  return typeof nested === "string" && nested.trim() ? nested.trim() : null;
}
