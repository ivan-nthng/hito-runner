import { z } from "zod";
import {
  isBodyNoteArea,
  isBodyNoteSensation,
  isBodyNoteTiming,
  type BodyNote,
} from "@/lib/body-notes";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const bodyNoteSchema = z
  .object({
    area: z.string().trim(),
    severity: z.number().int().min(1).max(5),
    timing: z.string().trim(),
    sensation: z.string().trim().nullable(),
    note: z.string().trim().max(300).nullable(),
  })
  .transform((value): BodyNote => {
    if (!isBodyNoteArea(value.area)) {
      throw new Error("Choose a supported body area.");
    }

    if (!isBodyNoteTiming(value.timing)) {
      throw new Error("Choose when the issue showed up.");
    }

    if (value.sensation && !isBodyNoteSensation(value.sensation)) {
      throw new Error("Choose a supported sensation.");
    }

    const sensation =
      value.sensation && isBodyNoteSensation(value.sensation) ? value.sensation : null;

    return {
      area: value.area,
      severity: value.severity as BodyNote["severity"],
      timing: value.timing,
      sensation,
      note: value.note || null,
    };
  });

export const workoutLogInputSchema = z
  .object({
    plannedWorkoutId: z.string().uuid(),
    outcome: z.enum(["completed", "partial", "skipped"]),
    actualDistanceKm: z.number().min(0).max(200).nullable(),
    actualDurationMin: z.number().int().min(0).max(1440).nullable(),
    rpe: z.number().int().min(1).max(10).nullable(),
    notes: z.string().trim().max(1000).nullable(),
    intervalsCompleted: z.number().int().min(0).max(100).nullable(),
    bodyNotes: z.array(bodyNoteSchema).max(8),
  })
  .transform((value) => {
    if (value.outcome === "skipped") {
      return {
        ...value,
        actualDistanceKm: null,
        actualDurationMin: null,
        rpe: null,
        intervalsCompleted: null,
      };
    }

    return value;
  });

export type WorkoutLogInput = z.output<typeof workoutLogInputSchema>;

export async function saveWorkoutLogForUser(userId: string, data: WorkoutLogInput) {
  const supabase = createAdminSupabaseClient();
  const plannedWorkout = await supabase
    .from("planned_workouts")
    .select("id, user_id, workout_type")
    .eq("id", data.plannedWorkoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (plannedWorkout.error) {
    throw new Error(plannedWorkout.error.message);
  }

  if (!plannedWorkout.data) {
    throw new Error("Planned workout not found.");
  }

  if (plannedWorkout.data.workout_type === "rest") {
    throw new Error("Rest days cannot be logged as completed workouts.");
  }

  const upsertResult = await supabase
    .from("workout_logs")
    .upsert(
      {
        planned_workout_id: data.plannedWorkoutId,
        user_id: userId,
        outcome: data.outcome,
        actual_distance_km: data.actualDistanceKm,
        actual_duration_min: data.actualDurationMin,
        rpe: data.rpe,
        notes: data.notes,
        intervals_completed: data.intervalsCompleted,
        body_notes: data.bodyNotes,
      },
      { onConflict: "planned_workout_id" },
    )
    .select("id")
    .single();

  if (upsertResult.error) {
    throw new Error(upsertResult.error.message);
  }

  return {
    ok: true,
    id: upsertResult.data.id,
  };
}
