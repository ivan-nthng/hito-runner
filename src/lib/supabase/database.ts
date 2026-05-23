export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      plan_cycles: {
        Row: {
          created_at: string;
          end_date: string;
          goal_metadata: Json | null;
          goal_summary: string;
          id: string;
          plan_preferences: Json | null;
          schema_version: string;
          source_kind: string | null;
          source_template: string;
          start_date: string;
          status: Database["public"]["Enums"]["plan_cycle_status"];
          target_date: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          goal_metadata?: Json | null;
          goal_summary: string;
          id?: string;
          plan_preferences?: Json | null;
          schema_version?: string;
          source_kind?: string | null;
          source_template: string;
          start_date: string;
          status?: Database["public"]["Enums"]["plan_cycle_status"];
          target_date?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          goal_metadata?: Json | null;
          goal_summary?: string;
          id?: string;
          plan_preferences?: Json | null;
          schema_version?: string;
          source_kind?: string | null;
          source_template?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["plan_cycle_status"];
          target_date?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      planned_workouts: {
        Row: {
          created_at: string;
          display_order: number;
          estimated_fatigue: string | null;
          id: string;
          notes: string | null;
          phase: string;
          plan_cycle_id: string;
          planned_rpe: number | null;
          recovery_priority: string | null;
          source_workout_id: string | null;
          source_workout_type: string | null;
          steps: Json;
          title: string;
          user_id: string;
          week_number: number;
          weekday: string;
          workout_date: string;
          workout_type: Database["public"]["Enums"]["workout_type"];
        };
        Insert: {
          created_at?: string;
          display_order: number;
          estimated_fatigue?: string | null;
          id?: string;
          notes?: string | null;
          phase: string;
          plan_cycle_id: string;
          planned_rpe?: number | null;
          recovery_priority?: string | null;
          source_workout_id?: string | null;
          source_workout_type?: string | null;
          steps?: Json;
          title: string;
          user_id: string;
          week_number: number;
          weekday: string;
          workout_date: string;
          workout_type: Database["public"]["Enums"]["workout_type"];
        };
        Update: {
          created_at?: string;
          display_order?: number;
          estimated_fatigue?: string | null;
          id?: string;
          notes?: string | null;
          phase?: string;
          plan_cycle_id?: string;
          planned_rpe?: number | null;
          recovery_priority?: string | null;
          source_workout_id?: string | null;
          source_workout_type?: string | null;
          steps?: Json;
          title?: string;
          user_id?: string;
          week_number?: number;
          weekday?: string;
          workout_date?: string;
          workout_type?: Database["public"]["Enums"]["workout_type"];
        };
        Relationships: [
          {
            foreignKeyName: "planned_workouts_plan_cycle_id_fkey";
            columns: ["plan_cycle_id"];
            isOneToOne: false;
            referencedRelation: "plan_cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      runner_capability_usage: {
        Row: {
          capability_key: string;
          created_at: string;
          period_key: string;
          updated_at: string;
          used_count: number;
          user_id: string;
        };
        Insert: {
          capability_key: string;
          created_at?: string;
          period_key?: string;
          updated_at?: string;
          used_count?: number;
          user_id: string;
        };
        Update: {
          capability_key?: string;
          created_at?: string;
          period_key?: string;
          updated_at?: string;
          used_count?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      runner_entitlements: {
        Row: {
          created_at: string;
          source: string;
          status: string;
          tier: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          source: string;
          status?: string;
          tier: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          source?: string;
          status?: string;
          tier?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      runner_profiles: {
        Row: {
          age: number | null;
          avatar_storage_path: string | null;
          avatar_url: string | null;
          baseline_long_run_km: number;
          baseline_notes: string | null;
          baseline_sessions_per_week: number;
          created_at: string;
          display_name: string | null;
          first_name: string | null;
          goal_label: string;
          goal_type: Database["public"]["Enums"]["runner_goal_type"];
          height_cm: number | null;
          last_name: string | null;
          setup_completed_at: string;
          setup_state: Database["public"]["Enums"]["runner_setup_state"];
          training_preferences: Json | null;
          updated_at: string;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          age?: number | null;
          avatar_storage_path?: string | null;
          avatar_url?: string | null;
          baseline_long_run_km: number;
          baseline_notes?: string | null;
          baseline_sessions_per_week: number;
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          goal_label: string;
          goal_type: Database["public"]["Enums"]["runner_goal_type"];
          height_cm?: number | null;
          last_name?: string | null;
          setup_completed_at?: string;
          setup_state?: Database["public"]["Enums"]["runner_setup_state"];
          training_preferences?: Json | null;
          updated_at?: string;
          user_id: string;
          weight_kg?: number | null;
        };
        Update: {
          age?: number | null;
          avatar_storage_path?: string | null;
          avatar_url?: string | null;
          baseline_long_run_km?: number;
          baseline_notes?: string | null;
          baseline_sessions_per_week?: number;
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          goal_label?: string;
          goal_type?: Database["public"]["Enums"]["runner_goal_type"];
          height_cm?: number | null;
          last_name?: string | null;
          setup_completed_at?: string;
          setup_state?: Database["public"]["Enums"]["runner_setup_state"];
          training_preferences?: Json | null;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      workout_actual_metrics: {
        Row: {
          activity_local_date: string | null;
          activity_started_at: string | null;
          actual_avg_cadence: number | null;
          actual_avg_hr: number | null;
          actual_avg_power: number | null;
          actual_calories: number | null;
          actual_distance_km: number | null;
          actual_duration_min: number | null;
          actual_elevation_gain_m: number | null;
          actual_elevation_loss_m: number | null;
          actual_interval_count: number | null;
          actual_max_hr: number | null;
          actual_max_power: number | null;
          actual_step_payload: Json | null;
          created_at: string;
          id: string;
          lap_payload: Json | null;
          planned_workout_id: string;
          result_asset_id: string;
          source_kind: string;
          status: string;
          summary_payload: Json;
          updated_at: string;
          user_id: string;
          workout_log_id: string | null;
        };
        Insert: {
          activity_local_date?: string | null;
          activity_started_at?: string | null;
          actual_avg_cadence?: number | null;
          actual_avg_hr?: number | null;
          actual_avg_power?: number | null;
          actual_calories?: number | null;
          actual_distance_km?: number | null;
          actual_duration_min?: number | null;
          actual_elevation_gain_m?: number | null;
          actual_elevation_loss_m?: number | null;
          actual_interval_count?: number | null;
          actual_max_hr?: number | null;
          actual_max_power?: number | null;
          actual_step_payload?: Json | null;
          created_at?: string;
          id?: string;
          lap_payload?: Json | null;
          planned_workout_id: string;
          result_asset_id: string;
          source_kind: string;
          status: string;
          summary_payload: Json;
          updated_at?: string;
          user_id: string;
          workout_log_id?: string | null;
        };
        Update: {
          activity_local_date?: string | null;
          activity_started_at?: string | null;
          actual_avg_cadence?: number | null;
          actual_avg_hr?: number | null;
          actual_avg_power?: number | null;
          actual_calories?: number | null;
          actual_distance_km?: number | null;
          actual_duration_min?: number | null;
          actual_elevation_gain_m?: number | null;
          actual_elevation_loss_m?: number | null;
          actual_interval_count?: number | null;
          actual_max_hr?: number | null;
          actual_max_power?: number | null;
          actual_step_payload?: Json | null;
          created_at?: string;
          id?: string;
          lap_payload?: Json | null;
          planned_workout_id?: string;
          result_asset_id?: string;
          source_kind?: string;
          status?: string;
          summary_payload?: Json;
          updated_at?: string;
          user_id?: string;
          workout_log_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_actual_metrics_planned_workout_id_fkey";
            columns: ["planned_workout_id"];
            isOneToOne: false;
            referencedRelation: "planned_workouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_actual_metrics_result_asset_id_fkey";
            columns: ["result_asset_id"];
            isOneToOne: false;
            referencedRelation: "workout_result_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_actual_metrics_workout_log_id_fkey";
            columns: ["workout_log_id"];
            isOneToOne: false;
            referencedRelation: "workout_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_ai_insights: {
        Row: {
          actual_metrics_id: string;
          analysis_summary: string;
          caution_flags: Json;
          comparison_id: string;
          created_at: string;
          difference_explanation: string;
          id: string;
          model: string;
          next_workout_recommendation: string;
          planned_workout_id: string;
          recommendation_level: string;
          response_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          actual_metrics_id: string;
          analysis_summary: string;
          caution_flags?: Json;
          comparison_id: string;
          created_at?: string;
          difference_explanation: string;
          id?: string;
          model: string;
          next_workout_recommendation: string;
          planned_workout_id: string;
          recommendation_level: string;
          response_id?: string | null;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          actual_metrics_id?: string;
          analysis_summary?: string;
          caution_flags?: Json;
          comparison_id?: string;
          created_at?: string;
          difference_explanation?: string;
          id?: string;
          model?: string;
          next_workout_recommendation?: string;
          planned_workout_id?: string;
          recommendation_level?: string;
          response_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_ai_insights_actual_metrics_id_fkey";
            columns: ["actual_metrics_id"];
            isOneToOne: false;
            referencedRelation: "workout_actual_metrics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_ai_insights_comparison_id_fkey";
            columns: ["comparison_id"];
            isOneToOne: true;
            referencedRelation: "workout_comparisons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_ai_insights_planned_workout_id_fkey";
            columns: ["planned_workout_id"];
            isOneToOne: false;
            referencedRelation: "planned_workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_comparisons: {
        Row: {
          actual_metrics_id: string;
          comparison_confidence: number;
          comparison_status: string;
          completion_state: string;
          created_at: string;
          difference_payload: Json;
          id: string;
          planned_workout_id: string;
          user_id: string;
        };
        Insert: {
          actual_metrics_id: string;
          comparison_confidence: number;
          comparison_status: string;
          completion_state: string;
          created_at?: string;
          difference_payload: Json;
          id?: string;
          planned_workout_id: string;
          user_id: string;
        };
        Update: {
          actual_metrics_id?: string;
          comparison_confidence?: number;
          comparison_status?: string;
          completion_state?: string;
          created_at?: string;
          difference_payload?: Json;
          id?: string;
          planned_workout_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_comparisons_actual_metrics_id_fkey";
            columns: ["actual_metrics_id"];
            isOneToOne: true;
            referencedRelation: "workout_actual_metrics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_comparisons_planned_workout_id_fkey";
            columns: ["planned_workout_id"];
            isOneToOne: false;
            referencedRelation: "planned_workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_logs: {
        Row: {
          actual_distance_km: number | null;
          actual_duration_min: number | null;
          body_notes: Json;
          id: string;
          intervals_completed: number | null;
          logged_at: string;
          notes: string | null;
          outcome: Database["public"]["Enums"]["workout_outcome"];
          planned_workout_id: string;
          rpe: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          actual_distance_km?: number | null;
          actual_duration_min?: number | null;
          body_notes?: Json;
          id?: string;
          intervals_completed?: number | null;
          logged_at?: string;
          notes?: string | null;
          outcome: Database["public"]["Enums"]["workout_outcome"];
          planned_workout_id: string;
          rpe?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          actual_distance_km?: number | null;
          actual_duration_min?: number | null;
          body_notes?: Json;
          id?: string;
          intervals_completed?: number | null;
          logged_at?: string;
          notes?: string | null;
          outcome?: Database["public"]["Enums"]["workout_outcome"];
          planned_workout_id?: string;
          rpe?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_logs_planned_workout_id_fkey";
            columns: ["planned_workout_id"];
            isOneToOne: true;
            referencedRelation: "planned_workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_result_assets: {
        Row: {
          asset_kind: string;
          created_at: string;
          file_size_bytes: number;
          id: string;
          mime_type: string;
          original_file_name: string;
          parse_error: string | null;
          parse_status: string;
          planned_workout_id: string;
          primary_file_kind: string | null;
          primary_file_name: string | null;
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          user_id: string;
          workout_log_id: string | null;
        };
        Insert: {
          asset_kind: string;
          created_at?: string;
          file_size_bytes: number;
          id?: string;
          mime_type: string;
          original_file_name: string;
          parse_error?: string | null;
          parse_status: string;
          planned_workout_id: string;
          primary_file_kind?: string | null;
          primary_file_name?: string | null;
          storage_bucket: string;
          storage_path: string;
          updated_at?: string;
          user_id: string;
          workout_log_id?: string | null;
        };
        Update: {
          asset_kind?: string;
          created_at?: string;
          file_size_bytes?: number;
          id?: string;
          mime_type?: string;
          original_file_name?: string;
          parse_error?: string | null;
          parse_status?: string;
          planned_workout_id?: string;
          primary_file_kind?: string | null;
          primary_file_name?: string | null;
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
          user_id?: string;
          workout_log_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_result_assets_planned_workout_id_fkey";
            columns: ["planned_workout_id"];
            isOneToOne: false;
            referencedRelation: "planned_workouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_result_assets_workout_log_id_fkey";
            columns: ["workout_log_id"];
            isOneToOne: false;
            referencedRelation: "workout_logs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      plan_cycle_status: "active" | "archived";
      runner_goal_type: "build_consistency" | "first_race" | "distance_build";
      runner_setup_state: "completed";
      workout_outcome: "completed" | "partial" | "skipped";
      workout_type: "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      plan_cycle_status: ["active", "archived"],
      runner_goal_type: ["build_consistency", "first_race", "distance_build"],
      runner_setup_state: ["completed"],
      workout_outcome: ["completed", "partial", "skipped"],
      workout_type: ["easy", "steady_or_easy", "rest", "long_run", "quality"],
    },
  },
} as const;
