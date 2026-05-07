import { z } from "zod";
import type { RunnerProfileSummary, Step, WorkoutType } from "@/lib/training";

export const LEGACY_IMPORT_ROOT_KEYS = [
  "plan_name",
  "generated_for",
  "start_date",
  "week_1_preview[]",
] as const;

export const LEGACY_IMPORT_ITEM_KEYS = ["date", "weekday", "workout", "details", "target"] as const;

export const FUTURE_TEMPLATE_VERSION = "training-plan-v2";
export const FUTURE_TEMPLATE_DOWNLOAD_PATH = "/templates/hito-training-plan-v2-template.json";

export const importedPlanWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekday: z.string().trim().min(1),
  workout: z.string().trim().min(1),
  details: z.string().trim().min(1),
  target: z.string().trim().nullable(),
});

export const importedPlanSchema = z.object({
  plan_name: z.string().trim().min(1),
  generated_for: z.string().trim().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_1_preview: z.array(importedPlanWorkoutSchema).min(1),
});

export type ImportedPlan = z.infer<typeof importedPlanSchema>;

export interface ImportedWorkoutSeed {
  workoutDate: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  workoutType: WorkoutType;
  title: string;
  notes: string | null;
  steps: Step[];
  displayOrder: number;
}

export interface ImportedPlanSeed {
  profile: RunnerProfileSummary;
  title: string;
  goalSummary: string;
  sourceTemplate: string;
  startDate: string;
  endDate: string;
  workouts: ImportedWorkoutSeed[];
}

export interface ImportedPlanSummary {
  planName: string;
  generatedFor: string;
  days: number;
  workouts: number;
}

export function validateImportedPlanJson(raw: string) {
  try {
    const parsedJson = JSON.parse(raw) as unknown;
    return importedPlanSchema.safeParse(parsedJson);
  } catch {
    return null;
  }
}

export function summarizeImportedPlan(plan: ImportedPlan): ImportedPlanSummary {
  return {
    planName: plan.plan_name,
    generatedFor: plan.generated_for,
    days: plan.week_1_preview.length,
    workouts: plan.week_1_preview.filter((item) => !/rest|recovery$/i.test(item.workout)).length,
  };
}

export function buildImportedPlanSeed(plan: ImportedPlan): ImportedPlanSeed {
  const workouts = plan.week_1_preview
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry, index) => {
      const workoutType = inferWorkoutType(entry.workout);
      const title =
        entry.details.toLowerCase() === "recovery"
          ? entry.workout
          : `${entry.workout} · ${entry.details}`;

      return {
        workoutDate: entry.date,
        weekday: entry.weekday,
        weekNumber: 1,
        phase: "Imported week",
        workoutType,
        title,
        notes: buildNotes(entry.details, entry.target),
        steps: buildSteps(workoutType, entry.details, entry.target),
        displayOrder: index,
      };
    });

  const profile = buildImportedProfile(plan, workouts);

  return {
    profile,
    title: plan.plan_name,
    goalSummary: `Imported JSON week for ${plan.generated_for}.`,
    sourceTemplate: "json-import-v1",
    startDate: plan.start_date,
    endDate: workouts.at(-1)?.workoutDate ?? plan.start_date,
    workouts,
  };
}

function buildImportedProfile(
  plan: ImportedPlan,
  workouts: ImportedWorkoutSeed[],
): RunnerProfileSummary {
  const baselineSessionsPerWeek = workouts.filter(
    (workout) => workout.workoutType !== "rest",
  ).length;
  const baselineLongRunKm = workouts
    .filter((workout) => workout.workoutType === "long_run")
    .map((workout) => estimateDistanceKm(workout.steps, workout.workoutType))
    .reduce((max, value) => Math.max(max, value), 0);

  return {
    goalType: inferGoalType(plan.plan_name),
    goalLabel: plan.plan_name,
    baselineSessionsPerWeek,
    baselineLongRunKm,
    baselineNotes: `Imported from JSON for ${plan.generated_for}.`,
  };
}

function inferGoalType(planName: string): RunnerProfileSummary["goalType"] {
  if (/marathon|race/i.test(planName)) {
    return "first_race";
  }

  if (/distance|build/i.test(planName)) {
    return "distance_build";
  }

  return "build_consistency";
}

function inferWorkoutType(workout: string): WorkoutType {
  if (/rest|recovery$/i.test(workout)) {
    return "rest";
  }

  if (/interval|tempo|speed|quality/i.test(workout)) {
    return "quality";
  }

  if (/long/i.test(workout)) {
    return "long_run";
  }

  if (/steady/i.test(workout)) {
    return "steady_or_easy";
  }

  return "easy";
}

function buildNotes(details: string, target: string | null) {
  if (!target) {
    return details;
  }

  return `${details} · Target: ${target}`;
}

function buildSteps(workoutType: WorkoutType, details: string, target: string | null): Step[] {
  if (workoutType === "rest") {
    return [];
  }

  const targetPayload = parseTarget(target);
  const intervalMatch = details.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(m|km)/i);

  if (intervalMatch) {
    const repeats = Number(intervalMatch[1]);
    const workDistanceKm = normalizeDistance(Number(intervalMatch[2]), intervalMatch[3]);

    return [
      {
        type: "intervals",
        repeats,
        work: {
          type: "work",
          distance_km: workDistanceKm,
          ...(targetPayload ? { target: targetPayload } : {}),
        },
        recovery: {
          type: "recovery",
        },
      },
    ];
  }

  const distanceMatch = details.match(/(\d+(?:\.\d+)?)\s*km/i);
  const durationMatch = details.match(/(\d+(?:\.\d+)?)\s*min/i);

  return [
    {
      type: "run",
      ...(distanceMatch ? { distance_km: Number(distanceMatch[1]) } : {}),
      ...(durationMatch ? { duration_min: Number(durationMatch[1]) } : {}),
      ...(targetPayload ? { target: targetPayload } : {}),
    },
  ];
}

function parseTarget(target: string | null) {
  if (!target) {
    return undefined;
  }

  const hrMatch = target.match(/HR\s*(\d{2,3})\s*-\s*(\d{2,3})/i);

  if (hrMatch) {
    return {
      hr_bpm: `${hrMatch[1]}-${hrMatch[2]}`,
    };
  }

  return {
    cue: target,
  };
}

function estimateDistanceKm(steps: Step[], workoutType: WorkoutType) {
  let totalDistanceKm = 0;

  for (const step of steps) {
    if (step.distance_km) {
      totalDistanceKm += step.distance_km;
    }
  }

  if (totalDistanceKm > 0) {
    return Number(totalDistanceKm.toFixed(1));
  }

  let totalDurationMin = 0;

  for (const step of steps) {
    if (step.duration_min) {
      totalDurationMin += step.duration_min;
    }
  }

  if (!totalDurationMin) {
    return 0;
  }

  const paceMap: Record<WorkoutType, number> = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };
  const pace = paceMap[workoutType];

  if (!pace) {
    return 0;
  }

  return Number((totalDurationMin / pace).toFixed(1));
}

function normalizeDistance(distance: number, unit: string) {
  return unit.toLowerCase() === "km" ? distance : Number((distance / 1000).toFixed(3));
}
