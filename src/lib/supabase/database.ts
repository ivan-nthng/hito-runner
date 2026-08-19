export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_capture_items: {
        Row: {
          archived_at: string | null;
          bounding_rect: Json | null;
          created_at: string;
          created_by_label: string | null;
          created_by_user_id: string;
          dom_path: string | null;
          element_text: string | null;
          id: string;
          item_type: string;
          metadata: Json;
          nearby_heading: string | null;
          note: string;
          page_url: string;
          priority: string | null;
          route: string | null;
          selector: string | null;
          status: string;
          target_role: string | null;
          title: string | null;
          updated_at: string;
          viewport_height: number | null;
          viewport_width: number | null;
        };
        Insert: {
          archived_at?: string | null;
          bounding_rect?: Json | null;
          created_at?: string;
          created_by_label?: string | null;
          created_by_user_id: string;
          dom_path?: string | null;
          element_text?: string | null;
          id?: string;
          item_type: string;
          metadata?: Json;
          nearby_heading?: string | null;
          note: string;
          page_url: string;
          priority?: string | null;
          route?: string | null;
          selector?: string | null;
          status?: string;
          target_role?: string | null;
          title?: string | null;
          updated_at?: string;
          viewport_height?: number | null;
          viewport_width?: number | null;
        };
        Update: {
          archived_at?: string | null;
          bounding_rect?: Json | null;
          created_at?: string;
          created_by_label?: string | null;
          created_by_user_id?: string;
          dom_path?: string | null;
          element_text?: string | null;
          id?: string;
          item_type?: string;
          metadata?: Json;
          nearby_heading?: string | null;
          note?: string;
          page_url?: string;
          priority?: string | null;
          route?: string | null;
          selector?: string | null;
          status?: string;
          target_role?: string | null;
          title?: string | null;
          updated_at?: string;
          viewport_height?: number | null;
          viewport_width?: number | null;
        };
        Relationships: [];
      };
      ai_plan_generation_responses: {
        Row: {
          compiler_outcome: string;
          created_at: string;
          diagnostic_code: string | null;
          diagnostic_path: string | null;
          generation_id: string;
          id: string;
          provider_response_id: string | null;
          response_body: string;
          response_sha256: string;
          schema_outcome: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          compiler_outcome?: string;
          created_at?: string;
          diagnostic_code?: string | null;
          diagnostic_path?: string | null;
          generation_id: string;
          id?: string;
          provider_response_id?: string | null;
          response_body: string;
          response_sha256: string;
          schema_outcome?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          compiler_outcome?: string;
          created_at?: string;
          diagnostic_code?: string | null;
          diagnostic_path?: string | null;
          generation_id?: string;
          id?: string;
          provider_response_id?: string | null;
          response_body?: string;
          response_sha256?: string;
          schema_outcome?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      calendar_workout_mutation_events: {
        Row: {
          after_workout: Json | null;
          before_workout: Json | null;
          created_at: string;
          displaced_workout: Json | null;
          event_payload: Json;
          id: number;
          legacy_ordinal: number | null;
          migrated_from_plan_id: string | null;
          mutation_checksum: string | null;
          mutation_kind: string;
          mutation_payload_version: string | null;
          occurred_at: string | null;
          planned_workout_id: string;
          review_checksum: string;
          review_payload_version: string;
          source_workout_date: string | null;
          source_workout_id: string | null;
          target_date: string | null;
          target_workout_id: string | null;
          undo_expires_at: string | null;
          undo_of_event_id: number | null;
          user_id: string;
        };
        Insert: {
          after_workout?: Json | null;
          before_workout?: Json | null;
          created_at?: string;
          displaced_workout?: Json | null;
          event_payload: Json;
          id?: never;
          legacy_ordinal?: number | null;
          migrated_from_plan_id?: string | null;
          mutation_checksum?: string | null;
          mutation_kind: string;
          mutation_payload_version?: string | null;
          occurred_at?: string | null;
          planned_workout_id: string;
          review_checksum: string;
          review_payload_version: string;
          source_workout_date?: string | null;
          source_workout_id?: string | null;
          target_date?: string | null;
          target_workout_id?: string | null;
          undo_expires_at?: string | null;
          undo_of_event_id?: number | null;
          user_id: string;
        };
        Update: {
          after_workout?: Json | null;
          before_workout?: Json | null;
          created_at?: string;
          displaced_workout?: Json | null;
          event_payload?: Json;
          id?: never;
          legacy_ordinal?: number | null;
          migrated_from_plan_id?: string | null;
          mutation_checksum?: string | null;
          mutation_kind?: string;
          mutation_payload_version?: string | null;
          occurred_at?: string | null;
          planned_workout_id?: string;
          review_checksum?: string;
          review_payload_version?: string;
          source_workout_date?: string | null;
          source_workout_id?: string | null;
          target_date?: string | null;
          target_workout_id?: string | null;
          undo_expires_at?: string | null;
          undo_of_event_id?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_workout_mutation_events_undo_of_event_id_fkey";
            columns: ["undo_of_event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_workout_mutation_events";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_cycles: {
        Row: {
          created_at: string;
          end_date: string;
          goal_metadata: Json | null;
          goal_summary: string;
          id: string;
          library_removed_at: string | null;
          plan_preferences: Json | null;
          saved_plan_payload: Json | null;
          saved_plan_review_checksum: string | null;
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
          library_removed_at?: string | null;
          plan_preferences?: Json | null;
          saved_plan_payload?: Json | null;
          saved_plan_review_checksum?: string | null;
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
          library_removed_at?: string | null;
          plan_preferences?: Json | null;
          saved_plan_payload?: Json | null;
          saved_plan_review_checksum?: string | null;
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
          calendar_icon_key: string | null;
          created_at: string;
          display_order: number;
          estimated_fatigue: string | null;
          goal_context: Json | null;
          id: string;
          metric_mode: Json | null;
          notes: string | null;
          origin_kind: string;
          phase: string;
          plan_cycle_id: string | null;
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
          workout_family: string | null;
          workout_identity: string | null;
          workout_type: Database["public"]["Enums"]["workout_type"];
        };
        Insert: {
          calendar_icon_key?: string | null;
          created_at?: string;
          display_order: number;
          estimated_fatigue?: string | null;
          goal_context?: Json | null;
          id?: string;
          metric_mode?: Json | null;
          notes?: string | null;
          origin_kind: string;
          phase: string;
          plan_cycle_id?: string | null;
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
          workout_family?: string | null;
          workout_identity?: string | null;
          workout_type: Database["public"]["Enums"]["workout_type"];
        };
        Update: {
          calendar_icon_key?: string | null;
          created_at?: string;
          display_order?: number;
          estimated_fatigue?: string | null;
          goal_context?: Json | null;
          id?: string;
          metric_mode?: Json | null;
          notes?: string | null;
          origin_kind?: string;
          phase?: string;
          plan_cycle_id?: string | null;
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
          workout_family?: string | null;
          workout_identity?: string | null;
          workout_type?: Database["public"]["Enums"]["workout_type"];
        };
        Relationships: [
          {
            foreignKeyName: "planned_workouts_source_owner_fkey";
            columns: ["user_id", "plan_cycle_id"];
            isOneToOne: false;
            referencedRelation: "plan_cycles";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
      runner_activities: {
        Row: {
          created_at: string;
          current_revision_id: string | null;
          distance_km: number | null;
          elapsed_duration_min: number | null;
          historical_timezone: string | null;
          id: string;
          local_date: string | null;
          quality_state: string;
          recording_kind: string;
          sport: string;
          started_at: string | null;
          timer_duration_min: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_revision_id?: string | null;
          distance_km?: number | null;
          elapsed_duration_min?: number | null;
          historical_timezone?: string | null;
          id?: string;
          local_date?: string | null;
          quality_state?: string;
          recording_kind: string;
          sport: string;
          started_at?: string | null;
          timer_duration_min?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_revision_id?: string | null;
          distance_km?: number | null;
          elapsed_duration_min?: number | null;
          historical_timezone?: string | null;
          id?: string;
          local_date?: string | null;
          quality_state?: string;
          recording_kind?: string;
          sport?: string;
          started_at?: string | null;
          timer_duration_min?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "runner_activities_current_revision_id_fkey";
            columns: ["current_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_revisions";
            referencedColumns: ["id"];
          },
        ];
      };
      runner_activity_evidence_revisions: {
        Row: {
          activity_id: string;
          activity_revision_id: string;
          actor_user_id: string;
          captured_at: string;
          change_reason: string;
          completion_outcome: string | null;
          created_at: string;
          evidence_kind: string;
          id: string;
          lifecycle_state: string;
          official_context: string | null;
          official_distance_m: number | null;
          official_elapsed_seconds: number | null;
          official_event_date: string | null;
          origin: string;
          predecessor_revision_id: string | null;
          revision_number: number;
          session_rpe: number | null;
          user_id: string;
          workout_log_id: string | null;
        };
        Insert: {
          activity_id: string;
          activity_revision_id: string;
          actor_user_id: string;
          captured_at: string;
          change_reason: string;
          completion_outcome?: string | null;
          created_at?: string;
          evidence_kind: string;
          id?: string;
          lifecycle_state: string;
          official_context?: string | null;
          official_distance_m?: number | null;
          official_elapsed_seconds?: number | null;
          official_event_date?: string | null;
          origin: string;
          predecessor_revision_id?: string | null;
          revision_number: number;
          session_rpe?: number | null;
          user_id: string;
          workout_log_id?: string | null;
        };
        Update: {
          activity_id?: string;
          activity_revision_id?: string;
          actor_user_id?: string;
          captured_at?: string;
          change_reason?: string;
          completion_outcome?: string | null;
          created_at?: string;
          evidence_kind?: string;
          id?: string;
          lifecycle_state?: string;
          official_context?: string | null;
          official_distance_m?: number | null;
          official_elapsed_seconds?: number | null;
          official_event_date?: string | null;
          origin?: string;
          predecessor_revision_id?: string | null;
          revision_number?: number;
          session_rpe?: number | null;
          user_id?: string;
          workout_log_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "runner_activity_evidence_revisions_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "runner_activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_evidence_revisions_activity_revision_id_fkey";
            columns: ["activity_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_evidence_revisions_predecessor_revision_id_fkey";
            columns: ["predecessor_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_evidence_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_evidence_revisions_workout_log_id_fkey";
            columns: ["workout_log_id"];
            isOneToOne: false;
            referencedRelation: "workout_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      runner_activity_fact_snapshots: {
        Row: {
          calculation_status: string;
          created_at: string;
          creation_cause: string;
          cutoff_date: string;
          exclusions: Json;
          facts: Json;
          formula_version: string;
          id: string;
          input_activity_revisions: Json;
          input_fingerprint_sha256: string;
          missing_field_reasons: Json;
          snapshot_family: string;
          user_id: string;
          window_end: string;
          window_start: string;
          window_timezone_basis: string;
        };
        Insert: {
          calculation_status: string;
          created_at?: string;
          creation_cause: string;
          cutoff_date: string;
          exclusions: Json;
          facts: Json;
          formula_version: string;
          id?: string;
          input_activity_revisions: Json;
          input_fingerprint_sha256: string;
          missing_field_reasons: Json;
          snapshot_family: string;
          user_id: string;
          window_end: string;
          window_start: string;
          window_timezone_basis: string;
        };
        Update: {
          calculation_status?: string;
          created_at?: string;
          creation_cause?: string;
          cutoff_date?: string;
          exclusions?: Json;
          facts?: Json;
          formula_version?: string;
          id?: string;
          input_activity_revisions?: Json;
          input_fingerprint_sha256?: string;
          missing_field_reasons?: Json;
          snapshot_family?: string;
          user_id?: string;
          window_end?: string;
          window_start?: string;
          window_timezone_basis?: string;
        };
        Relationships: [];
      };
      runner_activity_metric_observations: {
        Row: {
          activity_id: string;
          activity_revision_id: string;
          analyzed_bounds: Json;
          availability: string;
          calculated_at: string;
          comparability_cohort: string | null;
          confidence: string;
          eligibility: Json;
          evidence_revision_id: string | null;
          exclusions: Json;
          id: string;
          input_fingerprint_sha256: string;
          metric_formula_version: string;
          metric_key: string;
          metric_variant: string;
          observation_count: number;
          source_revision_id: string;
          unavailable_reason: string | null;
          unit: string;
          user_id: string;
          value: number | null;
        };
        Insert: {
          activity_id: string;
          activity_revision_id: string;
          analyzed_bounds: Json;
          availability: string;
          calculated_at?: string;
          comparability_cohort?: string | null;
          confidence: string;
          eligibility: Json;
          evidence_revision_id?: string | null;
          exclusions: Json;
          id?: string;
          input_fingerprint_sha256: string;
          metric_formula_version: string;
          metric_key: string;
          metric_variant: string;
          observation_count?: number;
          source_revision_id: string;
          unavailable_reason?: string | null;
          unit: string;
          user_id: string;
          value?: number | null;
        };
        Update: {
          activity_id?: string;
          activity_revision_id?: string;
          analyzed_bounds?: Json;
          availability?: string;
          calculated_at?: string;
          comparability_cohort?: string | null;
          confidence?: string;
          eligibility?: Json;
          evidence_revision_id?: string | null;
          exclusions?: Json;
          id?: string;
          input_fingerprint_sha256?: string;
          metric_formula_version?: string;
          metric_key?: string;
          metric_variant?: string;
          observation_count?: number;
          source_revision_id?: string;
          unavailable_reason?: string | null;
          unit?: string;
          user_id?: string;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "runner_activity_metric_observations_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "runner_activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_metric_observations_activity_revision_id_fkey";
            columns: ["activity_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_metric_observations_evidence_revision_id_fkey";
            columns: ["evidence_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_evidence_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_metric_observations_source_revision_id_fkey";
            columns: ["source_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_source_revisions";
            referencedColumns: ["id"];
          },
        ];
      };
      runner_activity_metric_snapshots: {
        Row: {
          as_of_date: string;
          calculation_status: string;
          created_at: string;
          creation_cause: string;
          formula_set_version: string;
          formula_versions: Json;
          id: string;
          input_activity_revisions: Json;
          input_evidence_revisions: Json;
          input_fingerprint_sha256: string;
          metric_payload: Json;
          observation_ids: Json;
          user_id: string;
        };
        Insert: {
          as_of_date: string;
          calculation_status: string;
          created_at?: string;
          creation_cause: string;
          formula_set_version: string;
          formula_versions: Json;
          id?: string;
          input_activity_revisions: Json;
          input_evidence_revisions: Json;
          input_fingerprint_sha256: string;
          metric_payload: Json;
          observation_ids: Json;
          user_id: string;
        };
        Update: {
          as_of_date?: string;
          calculation_status?: string;
          created_at?: string;
          creation_cause?: string;
          formula_set_version?: string;
          formula_versions?: Json;
          id?: string;
          input_activity_revisions?: Json;
          input_evidence_revisions?: Json;
          input_fingerprint_sha256?: string;
          metric_payload?: Json;
          observation_ids?: Json;
          user_id?: string;
        };
        Relationships: [];
      };
      runner_activity_planned_workout_matches: {
        Row: {
          activity_id: string;
          created_at: string;
          id: string;
          match_method: string;
          planned_workout_id: string | null;
          source_revision_id: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          id?: string;
          match_method: string;
          planned_workout_id?: string | null;
          source_revision_id: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          id?: string;
          match_method?: string;
          planned_workout_id?: string | null;
          source_revision_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "runner_activity_planned_workout_matches_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "runner_activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_planned_workout_matches_planned_workout_id_fkey";
            columns: ["planned_workout_id"];
            isOneToOne: false;
            referencedRelation: "planned_workouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_planned_workout_matches_source_revision_id_fkey";
            columns: ["source_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_source_revisions";
            referencedColumns: ["id"];
          },
        ];
      };
      runner_activity_revisions: {
        Row: {
          activity_id: string;
          activity_local_date: string | null;
          activity_started_at: string | null;
          created_at: string;
          field_provenance: Json;
          id: string;
          normalized_summary: Json;
          normalizer_version: string;
          revision_number: number;
          source_revision_id: string;
          total_distance_km: number | null;
          total_elapsed_duration_min: number | null;
          total_timer_duration_min: number | null;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          activity_local_date?: string | null;
          activity_started_at?: string | null;
          created_at?: string;
          field_provenance: Json;
          id?: string;
          normalized_summary: Json;
          normalizer_version: string;
          revision_number: number;
          source_revision_id: string;
          total_distance_km?: number | null;
          total_elapsed_duration_min?: number | null;
          total_timer_duration_min?: number | null;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          activity_local_date?: string | null;
          activity_started_at?: string | null;
          created_at?: string;
          field_provenance?: Json;
          id?: string;
          normalized_summary?: Json;
          normalizer_version?: string;
          revision_number?: number;
          source_revision_id?: string;
          total_distance_km?: number | null;
          total_elapsed_duration_min?: number | null;
          total_timer_duration_min?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "runner_activity_revisions_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "runner_activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_revisions_source_revision_id_fkey";
            columns: ["source_revision_id"];
            isOneToOne: true;
            referencedRelation: "runner_activity_source_revisions";
            referencedColumns: ["id"];
          },
        ];
      };
      runner_activity_source_revisions: {
        Row: {
          capabilities: Json;
          created_at: string;
          id: string;
          normalizer_version: string;
          observed_at: string | null;
          raw_asset_kind: string;
          raw_file_size_bytes: number;
          raw_mime_type: string;
          raw_original_file_name: string;
          raw_state: string;
          raw_storage_bucket: string | null;
          raw_storage_path: string | null;
          revision_number: number;
          source_id: string;
          user_id: string;
        };
        Insert: {
          capabilities: Json;
          created_at?: string;
          id?: string;
          normalizer_version: string;
          observed_at?: string | null;
          raw_asset_kind: string;
          raw_file_size_bytes: number;
          raw_mime_type: string;
          raw_original_file_name: string;
          raw_state: string;
          raw_storage_bucket?: string | null;
          raw_storage_path?: string | null;
          revision_number: number;
          source_id: string;
          user_id: string;
        };
        Update: {
          capabilities?: Json;
          created_at?: string;
          id?: string;
          normalizer_version?: string;
          observed_at?: string | null;
          raw_asset_kind?: string;
          raw_file_size_bytes?: number;
          raw_mime_type?: string;
          raw_original_file_name?: string;
          raw_state?: string;
          raw_storage_bucket?: string | null;
          raw_storage_path?: string | null;
          revision_number?: number;
          source_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "runner_activity_source_revisions_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      runner_activity_sources: {
        Row: {
          activity_id: string;
          created_at: string;
          current_revision_id: string | null;
          id: string;
          source_fingerprint_sha256: string;
          source_kind: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          current_revision_id?: string | null;
          id?: string;
          source_fingerprint_sha256: string;
          source_kind: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          current_revision_id?: string | null;
          id?: string;
          source_fingerprint_sha256?: string;
          source_kind?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "runner_activity_sources_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "runner_activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "runner_activity_sources_current_revision_id_fkey";
            columns: ["current_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_source_revisions";
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
      runner_manual_workout_templates: {
        Row: {
          created_at: string;
          display_name: string;
          draft_payload: Json;
          icon_key: string;
          id: string;
          review_payload_version: string;
          source_kind: string;
          source_review_checksum: string;
          source_status: string;
          source_workout_family: string;
          source_workout_identity: string;
          target_truth_mode: string;
          template_key: string;
          template_version: string;
          updated_at: string;
          user_id: string;
          workout_source_kind: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          draft_payload: Json;
          icon_key: string;
          id?: string;
          review_payload_version?: string;
          source_kind?: string;
          source_review_checksum: string;
          source_status?: string;
          source_workout_family: string;
          source_workout_identity: string;
          target_truth_mode: string;
          template_key: string;
          template_version?: string;
          updated_at?: string;
          user_id: string;
          workout_source_kind?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          draft_payload?: Json;
          icon_key?: string;
          id?: string;
          review_payload_version?: string;
          source_kind?: string;
          source_review_checksum?: string;
          source_status?: string;
          source_workout_family?: string;
          source_workout_identity?: string;
          target_truth_mode?: string;
          template_key?: string;
          template_version?: string;
          updated_at?: string;
          user_id?: string;
          workout_source_kind?: string;
        };
        Relationships: [];
      };
      runner_profiles: {
        Row: {
          age: number | null;
          avatar_storage_path: string | null;
          avatar_url: string | null;
          baseline_long_run_km: number | null;
          baseline_notes: string | null;
          baseline_revision: number;
          baseline_sessions_per_week: number | null;
          calendar_timezone: string;
          calendar_timezone_source: string;
          created_at: string;
          display_name: string | null;
          first_name: string | null;
          fitness_level: string | null;
          goal_label: string | null;
          goal_type: Database["public"]["Enums"]["runner_goal_type"] | null;
          heart_rate_profile: Json | null;
          height_cm: number | null;
          hidden_manual_workout_template_keys: string[];
          last_name: string | null;
          setup_completed_at: string;
          setup_state: Database["public"]["Enums"]["runner_setup_state"];
          training_preferences: Json | null;
          ui_locale_preference: string;
          updated_at: string;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          age?: number | null;
          avatar_storage_path?: string | null;
          avatar_url?: string | null;
          baseline_long_run_km?: number | null;
          baseline_notes?: string | null;
          baseline_revision?: number;
          baseline_sessions_per_week?: number | null;
          calendar_timezone?: string;
          calendar_timezone_source?: string;
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          fitness_level?: string | null;
          goal_label?: string | null;
          goal_type?: Database["public"]["Enums"]["runner_goal_type"] | null;
          heart_rate_profile?: Json | null;
          height_cm?: number | null;
          hidden_manual_workout_template_keys?: string[];
          last_name?: string | null;
          setup_completed_at?: string;
          setup_state?: Database["public"]["Enums"]["runner_setup_state"];
          training_preferences?: Json | null;
          ui_locale_preference?: string;
          updated_at?: string;
          user_id: string;
          weight_kg?: number | null;
        };
        Update: {
          age?: number | null;
          avatar_storage_path?: string | null;
          avatar_url?: string | null;
          baseline_long_run_km?: number | null;
          baseline_notes?: string | null;
          baseline_revision?: number;
          baseline_sessions_per_week?: number | null;
          calendar_timezone?: string;
          calendar_timezone_source?: string;
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          fitness_level?: string | null;
          goal_label?: string | null;
          goal_type?: Database["public"]["Enums"]["runner_goal_type"] | null;
          heart_rate_profile?: Json | null;
          height_cm?: number | null;
          hidden_manual_workout_template_keys?: string[];
          last_name?: string | null;
          setup_completed_at?: string;
          setup_state?: Database["public"]["Enums"]["runner_setup_state"];
          training_preferences?: Json | null;
          ui_locale_preference?: string;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      workout_actual_metrics: {
        Row: {
          activity_id: string | null;
          activity_local_date: string | null;
          activity_revision_id: string | null;
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
          activity_id?: string | null;
          activity_local_date?: string | null;
          activity_revision_id?: string | null;
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
          activity_id?: string | null;
          activity_local_date?: string | null;
          activity_revision_id?: string | null;
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
            foreignKeyName: "workout_actual_metrics_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "runner_activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_actual_metrics_activity_revision_id_fkey";
            columns: ["activity_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_revisions";
            referencedColumns: ["id"];
          },
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
          comparison_formula_version: string;
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
          comparison_formula_version?: string;
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
          comparison_formula_version?: string;
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
          activity_source_revision_id: string | null;
          asset_kind: string;
          created_at: string;
          file_size_bytes: number;
          id: string;
          mime_type: string;
          original_file_name: string;
          parse_error: string | null;
          parse_status: string;
          planned_workout_id: string | null;
          primary_file_kind: string | null;
          primary_file_name: string | null;
          storage_bucket: string | null;
          storage_path: string | null;
          updated_at: string;
          user_id: string;
          workout_log_id: string | null;
        };
        Insert: {
          activity_source_revision_id?: string | null;
          asset_kind: string;
          created_at?: string;
          file_size_bytes: number;
          id?: string;
          mime_type: string;
          original_file_name: string;
          parse_error?: string | null;
          parse_status: string;
          planned_workout_id?: string | null;
          primary_file_kind?: string | null;
          primary_file_name?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          updated_at?: string;
          user_id: string;
          workout_log_id?: string | null;
        };
        Update: {
          activity_source_revision_id?: string | null;
          asset_kind?: string;
          created_at?: string;
          file_size_bytes?: number;
          id?: string;
          mime_type?: string;
          original_file_name?: string;
          parse_error?: string | null;
          parse_status?: string;
          planned_workout_id?: string | null;
          primary_file_kind?: string | null;
          primary_file_name?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          updated_at?: string;
          user_id?: string;
          workout_log_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_result_assets_activity_source_revision_id_fkey";
            columns: ["activity_source_revision_id"];
            isOneToOne: false;
            referencedRelation: "runner_activity_source_revisions";
            referencedColumns: ["id"];
          },
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
      append_runner_activity_evidence_revision: {
        Args: {
          p_activity_id: string;
          p_captured_at?: string;
          p_change_reason?: string;
          p_completion_outcome?: string;
          p_evidence_kind: string;
          p_expected_activity_revision_id: string;
          p_expected_predecessor_id?: string;
          p_lifecycle_state: string;
          p_official_context?: string;
          p_official_distance_m?: number;
          p_official_elapsed_seconds?: number;
          p_official_event_date?: string;
          p_origin?: string;
          p_session_rpe?: number;
          p_user_id: string;
          p_workout_log_id?: string;
        };
        Returns: {
          evidence_revision_id: string;
          reused_exact_evidence: boolean;
          revision_number: number;
        }[];
      };
      apply_calendar_workout_content_edit: {
        Args: {
          p_current_date: string;
          p_expected_workout: Json;
          p_mutation_event: Json;
          p_user_id: string;
          p_workout_id: string;
          p_workout_update: Json;
        };
        Returns: Json;
      };
      apply_calendar_workout_mutation: {
        Args: {
          p_current_date: string;
          p_expected_source_workout: Json;
          p_expected_target_workout: Json;
          p_mutation_event: Json;
          p_mutation_kind: string;
          p_user_id: string;
          p_workout_insert: Json;
          p_workout_update: Json;
        };
        Returns: Json;
      };
      apply_reviewed_future_schedule_persistence: {
        Args: {
          p_current_date: string;
          p_replace_future_workouts: boolean;
          p_source_plan_id: string;
          p_user_id: string;
          p_workouts: Json;
        };
        Returns: Json;
      };
      apply_reviewed_plan_persistence: {
        Args: {
          p_current_date: string;
          p_expected_profile_revision?: number;
          p_profile: Json;
          p_source_plan_id: string;
          p_user_id: string;
          p_workouts: Json;
        };
        Returns: Json;
      };
      clear_calendar_future_workouts: {
        Args: { p_current_date: string; p_user_id: string };
        Returns: Json;
      };
      delete_runner_activity_from_history: {
        Args: { p_activity_id: string; p_user_id: string };
        Returns: boolean;
      };
      finalize_runner_activity_planned_workout_projection: {
        Args: {
          p_activity_id: string;
          p_activity_revision_id: string;
          p_asset_id: string;
          p_comparison_id: string;
          p_metrics_id: string;
          p_planned_workout_id: string;
          p_source_revision_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      list_hito_applied_migration_versions: {
        Args: never;
        Returns: {
          version: string;
        }[];
      };
      list_runner_activity_history_page: {
        Args: {
          p_cursor_activity_id?: string;
          p_cursor_sort_date?: string;
          p_cursor_sort_started_at?: string;
          p_page_size: number;
          p_user_id: string;
        };
        Returns: {
          activity_id: string;
          created_at: string;
          current_revision_id: string;
          distance_km: number;
          elapsed_duration_min: number;
          historical_timezone: string;
          local_date: string;
          quality_state: string;
          recording_kind: string;
          sort_date: string;
          sort_started_at: string;
          sport: string;
          started_at: string;
          timer_duration_min: number;
        }[];
      };
      list_runner_fit_completed_planned_workouts: {
        Args: { p_planned_workout_ids: string[]; p_user_id: string };
        Returns: {
          planned_workout_id: string;
        }[];
      };
      persist_runner_activity_garmin_source: {
        Args: {
          p_activity_revision: Json;
          p_source_fingerprint_sha256: string;
          p_source_revision: Json;
          p_user_id: string;
        };
        Returns: {
          activity_id: string;
          activity_revision_id: string;
          raw_state: string;
          raw_storage_bucket: string;
          raw_storage_path: string;
          reused_exact_source: boolean;
          source_id: string;
          source_revision_id: string;
        }[];
      };
      sync_workout_log_runner_activity_rpe: {
        Args: {
          p_change_reason?: string;
          p_planned_workout_id: string;
          p_removed_completion_outcome?: string;
          p_removed_workout_log_id?: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
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
  graphql_public: {
    Enums: {},
  },
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
