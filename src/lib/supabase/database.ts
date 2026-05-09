export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      runner_profiles: {
        Row: {
          user_id: string;
          goal_type: "build_consistency" | "first_race" | "distance_build";
          goal_label: string;
          baseline_sessions_per_week: number;
          baseline_long_run_km: number;
          baseline_notes: string | null;
          setup_state: "completed";
          setup_completed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          goal_type: "build_consistency" | "first_race" | "distance_build";
          goal_label: string;
          baseline_sessions_per_week: number;
          baseline_long_run_km: number;
          baseline_notes?: string | null;
          setup_state?: "completed";
          setup_completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["runner_profiles"]["Insert"]>;
      };
      plan_cycles: {
        Row: {
          id: string;
          user_id: string;
          status: "active" | "archived";
          title: string;
          goal_summary: string;
          source_template: string;
          schema_version: string;
          source_kind: string | null;
          start_date: string;
          end_date: string;
          target_date: string | null;
          goal_metadata: Json | null;
          plan_preferences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "active" | "archived";
          title: string;
          goal_summary: string;
          source_template: string;
          schema_version?: string;
          source_kind?: string | null;
          start_date: string;
          end_date: string;
          target_date?: string | null;
          goal_metadata?: Json | null;
          plan_preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plan_cycles"]["Insert"]>;
      };
      planned_workouts: {
        Row: {
          id: string;
          plan_cycle_id: string;
          user_id: string;
          workout_date: string;
          weekday: string;
          week_number: number;
          phase: string;
          workout_type: "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";
          source_workout_id: string | null;
          source_workout_type: string | null;
          title: string;
          notes: string | null;
          planned_rpe: number | null;
          estimated_fatigue: string | null;
          recovery_priority: string | null;
          steps: Json;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_cycle_id: string;
          user_id: string;
          workout_date: string;
          weekday: string;
          week_number: number;
          phase: string;
          workout_type: "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";
          source_workout_id?: string | null;
          source_workout_type?: string | null;
          title: string;
          notes?: string | null;
          planned_rpe?: number | null;
          estimated_fatigue?: string | null;
          recovery_priority?: string | null;
          steps: Json;
          display_order: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["planned_workouts"]["Insert"]>;
      };
      workout_logs: {
        Row: {
          id: string;
          planned_workout_id: string;
          user_id: string;
          outcome: "completed" | "partial" | "skipped";
          actual_distance_km: number | null;
          actual_duration_min: number | null;
          rpe: number | null;
          notes: string | null;
          intervals_completed: number | null;
          logged_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          planned_workout_id: string;
          user_id?: string;
          outcome: "completed" | "partial" | "skipped";
          actual_distance_km?: number | null;
          actual_duration_min?: number | null;
          rpe?: number | null;
          notes?: string | null;
          intervals_completed?: number | null;
          logged_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Insert"]>;
      };
    };
  };
}
