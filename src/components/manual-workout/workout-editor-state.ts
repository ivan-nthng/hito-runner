import type { Json } from "@/lib/supabase/database";
import type { ReviewedWorkoutCommandCandidate } from "@/lib/workout-authoring-review";
import type {
  WorkoutDocument,
  WorkoutDocumentRepeatChildPrescription,
  WorkoutDocumentSection,
} from "@/lib/workout-document";

export type WorkoutEditorState = {
  mode: "create" | "edit";
  origin: "scratch" | "built_in" | "saved_template" | "calendar";
  document: WorkoutDocument;
  provenanceReference: Json;
  expectedFingerprint: Json | null;
  candidate: ReviewedWorkoutCommandCandidate | null;
  phase: "editing" | "reviewing" | "review_ready" | "confirming" | "blocked";
  issues: string[];
};

export function createWorkoutEditorState(
  input: Pick<WorkoutEditorState, "mode" | "origin" | "document" | "provenanceReference"> & {
    expectedFingerprint?: Json | null;
  },
): WorkoutEditorState {
  return {
    ...input,
    expectedFingerprint: input.expectedFingerprint ?? null,
    candidate: null,
    phase: "editing",
    issues: [],
  };
}

export function editWorkoutEditorDocument(
  state: WorkoutEditorState,
  document: WorkoutDocument,
): WorkoutEditorState {
  const normalized = normalizeDocumentOrder(document);
  return {
    ...state,
    document: normalized,
    candidate: null,
    phase: "editing",
    issues: workoutDocumentEditorIssues(normalized),
  };
}

export function workoutDocumentEditorIssues(document: WorkoutDocument) {
  const issues: string[] = [];
  if (!document.title.trim()) issues.push("Enter a workout title.");
  if (document.workoutType !== "rest" && document.steps.length === 0) {
    issues.push("Add at least one workout section.");
  }
  const ids = new Set<string>();
  for (const section of document.steps) {
    if (!section.segment_id || ids.has(section.segment_id)) {
      issues.push("Workout sections require unique stable identities.");
    }
    if (section.segment_id) ids.add(section.segment_id);
    const prescription = section.prescription;
    if (prescription?.mode === "time" && !(Number(prescription.duration_min) > 0)) {
      issues.push(`${section.label ?? "Section"} requires positive minutes.`);
    }
    if (prescription?.mode === "distance" && !(Number(prescription.distance_km) > 0)) {
      issues.push(`${section.label ?? "Section"} requires a positive distance.`);
    }
    if (prescription?.mode === "repeats") {
      if (!(Number(prescription.repeat_count) >= 2 && Number(prescription.repeat_count) <= 50)) {
        issues.push(`${section.label ?? "Repeat"} requires 2–50 repeats.`);
      }
      const childIds = new Set<string>();
      for (const child of prescription.children ?? []) {
        if (!child.segment_id || childIds.has(child.segment_id)) {
          issues.push("Repeat sections require unique stable identities.");
        }
        childIds.add(child.segment_id);
        validateTarget(child.target, child.label ?? "Repeat section", issues);
      }
    } else {
      validateTarget(section.target, section.label ?? "Section", issues);
    }
  }
  return [...new Set(issues)];
}

function validateTarget(target: WorkoutDocumentSection["target"], label: string, issues: string[]) {
  if (!target) return;
  if (target.primary_execution_mode === "pace" && !target.pace && !target.pace_min_per_km_range) {
    issues.push(`${label} requires a pace value.`);
  }
  if (
    target.primary_execution_mode === "heart_rate" &&
    !target.hr_bpm_cap &&
    !target.hr_bpm_range
  ) {
    issues.push(`${label} requires a heart-rate value.`);
  }
  if (target.primary_execution_mode === "effort") {
    const rpe = Number(target.rpe);
    if (!Number.isFinite(rpe) || rpe < 0 || rpe > 10) {
      issues.push(`${label} requires RPE from 0 to 10.`);
    }
  }
}

export function applyWorkoutEditorReview(
  state: WorkoutEditorState,
  candidate: ReviewedWorkoutCommandCandidate,
): WorkoutEditorState {
  const document =
    candidate.command.operation === "materialize"
      ? candidate.command.documents[0]
      : candidate.command.document;
  return document
    ? { ...state, document, candidate, phase: "review_ready", issues: [] }
    : {
        ...state,
        candidate: null,
        phase: "blocked",
        issues: ["Review returned no Workout document."],
      };
}

export function moveWorkoutSectionById(
  document: WorkoutDocument,
  segmentId: string,
  targetId: string,
  position: "before" | "after",
) {
  return { ...document, steps: moveById(document.steps, segmentId, targetId, position) };
}

export function moveWorkoutRepeatChildById(
  document: WorkoutDocument,
  parentId: string,
  segmentId: string,
  targetId: string,
  position: "before" | "after",
) {
  return updateWorkoutSection(document, parentId, (section) => {
    if (section.prescription?.mode !== "repeats") return section;
    return {
      ...section,
      children: undefined,
      prescription: {
        ...section.prescription,
        children: moveById(section.prescription.children ?? [], segmentId, targetId, position),
      },
    };
  });
}

export function updateWorkoutSection(
  document: WorkoutDocument,
  segmentId: string,
  update: (section: WorkoutDocumentSection) => WorkoutDocumentSection,
) {
  return normalizeDocumentOrder({
    ...document,
    steps: document.steps.map((section) =>
      section.segment_id === segmentId ? update(section) : section,
    ),
  });
}

export function updateWorkoutRepeatChild(
  document: WorkoutDocument,
  parentId: string,
  segmentId: string,
  update: (child: WorkoutDocumentRepeatChildPrescription) => WorkoutDocumentRepeatChildPrescription,
) {
  return updateWorkoutSection(document, parentId, (section) => {
    if (section.prescription?.mode !== "repeats") return section;
    return {
      ...section,
      children: undefined,
      prescription: {
        ...section.prescription,
        children: (section.prescription.children ?? []).map((child) =>
          child.segment_id === segmentId ? update(child) : child,
        ),
      },
    };
  });
}

export function normalizeDocumentOrder(document: WorkoutDocument): WorkoutDocument {
  return {
    ...document,
    steps: document.steps.map((section, index) => ({
      ...section,
      sequence: index + 1,
      ...(section.prescription?.mode === "repeats"
        ? {
            children: undefined,
            prescription: {
              ...section.prescription,
              children: (section.prescription.children ?? []).map((child, childIndex) => ({
                ...child,
                sequence: childIndex + 1,
              })),
            },
          }
        : {}),
    })),
  };
}

function moveById<T extends { segment_id?: string }>(
  values: T[],
  sourceId: string,
  targetId: string,
  position: "before" | "after",
) {
  const from = values.findIndex((value) => value.segment_id === sourceId);
  const over = values.findIndex((value) => value.segment_id === targetId);
  if (from < 0 || over < 0 || sourceId === targetId) return values;
  const next = [...values];
  const [moved] = next.splice(from, 1);
  if (!moved) return values;
  const adjustedTarget = next.findIndex((value) => value.segment_id === targetId);
  next.splice(position === "after" ? adjustedTarget + 1 : adjustedTarget, 0, moved);
  return next.map((value, index) => ({ ...value, sequence: index + 1 }));
}
