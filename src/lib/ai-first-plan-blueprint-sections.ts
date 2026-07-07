import type {
  AiBlueprintRepeatChild,
  AiBlueprintSection,
  AiBlueprintWorkout,
  CanonicalSegment,
  NormalizationIssue,
} from "@/lib/ai-first-plan-blueprint-schema";
import { reduceRepeatChildrenToChildFirst } from "@/lib/planned-workout-block-contract";
import type { StepPrescription, StepTarget, StepUnitPrescription } from "@/lib/training";

export function normalizeAiAuthoredWorkoutSections({
  workout,
  date,
  issues,
}: {
  workout: AiBlueprintWorkout;
  date: string;
  issues: NormalizationIssue[];
}): CanonicalSegment[] {
  return workout.sections.map((section, index) =>
    normalizeAiAuthoredSection({
      workout,
      section,
      date,
      sequence: index + 1,
      issues,
    }),
  );
}

function normalizeAiAuthoredSection({
  workout,
  section,
  date,
  sequence,
  issues,
}: {
  workout: AiBlueprintWorkout;
  section: AiBlueprintSection;
  date: string;
  sequence: number;
  issues: NormalizationIssue[];
}): CanonicalSegment {
  if (section.kind !== "repeat" && section.prescription.mode === "none") {
    issues.push({
      code: "ai_authored_section_not_executable",
      path: `${date}.sections.${sequence}.prescription`,
      message: `${section.label} must carry executable duration or distance structure.`,
    });
  }

  const prescription = normalizeSectionPrescription({
    section,
    date,
    sequence,
    issues,
  });
  const target = section.kind === "repeat" ? undefined : normalizeEffortTarget(section.target);

  return {
    segment_id: `${slugify(workout.workoutIdentity)}_${date}_ai_section_${sequence}`,
    segment_type: segmentTypeForSection(section, workout),
    sequence,
    label: section.label,
    guidance: combineGuidance(section.guidance, section.purpose),
    prescription,
    ...(prescription.mode === "time" && prescription.duration_min
      ? { duration_min: prescription.duration_min }
      : {}),
    ...(prescription.mode === "distance" && prescription.distance_km
      ? { distance_km: prescription.distance_km }
      : {}),
    ...(target ? { target } : {}),
  };
}

function normalizeSectionPrescription({
  section,
  date,
  sequence,
  issues,
}: {
  section: AiBlueprintSection;
  date: string;
  sequence: number;
  issues: NormalizationIssue[];
}): StepPrescription {
  const prescription = section.prescription;

  if (prescription.mode === "repeats") {
    const rawChildren = (prescription.children ?? []).map((child, index) =>
      normalizeRepeatChild(child, index),
    );
    const reduced = reduceRepeatChildrenToChildFirst<StepTarget>({
      children: rawChildren,
    });

    if (reduced.children.length === 0) {
      issues.push({
        code: "ai_authored_repeat_without_children",
        path: `${date}.sections.${sequence}.children`,
        message: `${section.label} must include ordered repeat children.`,
      });
    }

    if (
      reduced.children.some(
        (child) =>
          child.prescription.mode === "none" ||
          (child.prescription.mode === "time" && !child.prescription.duration_min) ||
          (child.prescription.mode === "distance" && !child.prescription.distance_km),
      )
    ) {
      issues.push({
        code: "ai_authored_repeat_child_not_executable",
        path: `${date}.sections.${sequence}.children`,
        message: `${section.label} repeat children must carry executable duration or distance.`,
      });
    }

    return {
      mode: "repeats",
      repeat_count: prescription.repeat_count ?? 1,
      children: reduced.children,
    };
  }

  return normalizeUnitPrescription(prescription);
}

function normalizeRepeatChild(
  child: AiBlueprintRepeatChild,
  index: number,
): {
  role: "warm_up" | "run" | "walk" | "work" | "recover" | "finish" | "cooldown";
  label: string;
  sequence: number;
  guidance: string;
  prescription: StepUnitPrescription;
  target?: StepTarget;
} {
  const target = normalizeEffortTarget(child.target);

  return {
    role: repeatRoleForSectionKind(child.kind),
    label: child.label,
    sequence: index + 1,
    guidance: combineGuidance(child.guidance, child.purpose),
    prescription: normalizeUnitPrescription(child.prescription),
    ...(target ? { target } : {}),
  };
}

function normalizeUnitPrescription(input: {
  mode: "time" | "distance" | "none";
  duration_min: number | null;
  distance_km: number | null;
}): StepUnitPrescription {
  if (input.mode === "time") {
    return {
      mode: "time",
      ...(input.duration_min ? { duration_min: input.duration_min } : {}),
    };
  }

  if (input.mode === "distance") {
    return {
      mode: "distance",
      ...(input.distance_km ? { distance_km: input.distance_km } : {}),
    };
  }

  return { mode: "none" };
}

function normalizeEffortTarget(
  target: {
    intensity: string | null;
    cue: string | null;
    hint: string | null;
    rpe: number | null;
  } | null,
): StepTarget | undefined {
  if (!target) {
    return undefined;
  }

  const normalized: StepTarget = {
    target_source: "ai_authored_effort_guidance",
    hr_target_source: "effort_only",
    ...(target.intensity ? { intensity: target.intensity } : {}),
    ...(target.cue ? { cue: target.cue } : {}),
    ...(target.hint ? { hint: target.hint } : {}),
    ...(typeof target.rpe === "number" ? { rpe: target.rpe } : {}),
  };

  return Object.keys(normalized).length > 1 ? normalized : undefined;
}

function segmentTypeForSection(
  section: AiBlueprintSection,
  workout: AiBlueprintWorkout,
): NonNullable<CanonicalSegment["segment_type"]> {
  switch (section.kind) {
    case "warm_up":
      return "warmup";
    case "recover":
      return "recovery";
    case "cooldown":
      return "cooldown";
    case "repeat":
      return "interval_block";
    case "walk":
      return "recovery_jog";
    case "work":
      return workout.workoutFamily === "tempo" ? "tempo_block" : "main";
    case "run":
    case "finish":
      return "main";
  }
}

function repeatRoleForSectionKind(
  kind: AiBlueprintRepeatChild["kind"],
): "warm_up" | "run" | "walk" | "work" | "recover" | "finish" | "cooldown" {
  switch (kind) {
    case "warm_up":
      return "warm_up";
    case "recover":
      return "recover";
    default:
      return kind;
  }
}

function combineGuidance(guidance: string, purpose: string | null) {
  return purpose ? `${guidance} Purpose: ${purpose}` : guidance;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
}
