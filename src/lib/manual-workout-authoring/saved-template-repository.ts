import type { Database, Json } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type RunnerManualWorkoutTemplateRow =
  Database["public"]["Tables"]["runner_manual_workout_templates"]["Row"];
export type RunnerManualWorkoutTemplateInsert =
  Database["public"]["Tables"]["runner_manual_workout_templates"]["Insert"];

export type ManualWorkoutSavedTemplateRepository = {
  insertTemplate: (
    row: RunnerManualWorkoutTemplateInsert,
  ) => Promise<RunnerManualWorkoutTemplateRow>;
  listTemplatesForUser: (userId: string) => Promise<RunnerManualWorkoutTemplateRow[]>;
  getTemplateForUser: (
    userId: string,
    templateId: string,
  ) => Promise<RunnerManualWorkoutTemplateRow | null>;
  deleteTemplateForUser: (userId: string, templateId: string) => Promise<boolean>;
};

export function createSupabaseSavedTemplateRepository(): ManualWorkoutSavedTemplateRepository {
  const supabase = createAdminSupabaseClient();

  return {
    async insertTemplate(row) {
      const result = await supabase
        .from("runner_manual_workout_templates")
        .insert(row)
        .select("*")
        .single();

      if (result.error || !result.data) {
        throw new Error(result.error?.message ?? "Saved workout template insert failed.");
      }

      return result.data;
    },
    async listTemplatesForUser(userId) {
      const result = await supabase
        .from("runner_manual_workout_templates")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data ?? [];
    },
    async getTemplateForUser(userId, templateId) {
      const result = await supabase
        .from("runner_manual_workout_templates")
        .select("*")
        .eq("user_id", userId)
        .eq("id", templateId)
        .maybeSingle();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data ?? null;
    },
    async deleteTemplateForUser(userId, templateId) {
      const result = await supabase
        .from("runner_manual_workout_templates")
        .delete()
        .eq("user_id", userId)
        .eq("id", templateId)
        .select("id")
        .maybeSingle();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return Boolean(result.data);
    },
  };
}

export function toManualSavedTemplateJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
