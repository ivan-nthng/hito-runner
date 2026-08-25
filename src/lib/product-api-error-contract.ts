type NoProductApiFailureParameters = Readonly<Record<string, never>>;

export type HitoProductApiFailureParameterMap = {
  avatar_file_required: NoProductApiFailureParameters;
  avatar_file_empty: NoProductApiFailureParameters;
  avatar_file_too_large: { readonly maxBytes: number };
  avatar_file_type_unsupported: { readonly allowedMimeTypes: readonly string[] };
  avatar_profile_required: NoProductApiFailureParameters;
  avatar_auth_required: NoProductApiFailureParameters;
  avatar_upload_failed: NoProductApiFailureParameters;
  runner_activity_auth_required: {
    readonly operation: "history_read" | "progress_read" | "delete" | "source_remove";
  };
  runner_activity_history_request_invalid: NoProductApiFailureParameters;
  runner_activity_history_unavailable: NoProductApiFailureParameters;
  runner_activity_progress_period_invalid: { readonly period: string };
  runner_activity_progress_unavailable: NoProductApiFailureParameters;
  runner_activity_not_found: { readonly operation: "delete" | "source_remove" };
  runner_activity_delete_failed: NoProductApiFailureParameters;
  runner_activity_source_remove_failed: NoProductApiFailureParameters;
  workout_result_auth_required: { readonly operation: "upload" | "remove" };
  workout_result_invalid_request: { readonly operation: "upload" | "remove" };
  workout_result_file_type_unsupported: {
    readonly operation: "upload";
    readonly acceptedKinds: readonly ["fit", "zip"];
  };
  workout_result_file_too_large: {
    readonly operation: "upload";
    readonly maxBytes: number;
  };
  workout_result_workout_unavailable: { readonly operation: "upload" | "remove" };
  workout_result_rest_day_unsupported: { readonly operation: "upload" };
  workout_result_archive_activity_missing: { readonly operation: "upload" };
  workout_result_archive_multiple_activities: {
    readonly operation: "upload";
    readonly maxActivities: 1;
  };
  workout_result_file_unreadable: { readonly operation: "upload" };
  workout_result_activity_already_recorded: { readonly operation: "upload" };
  workout_result_storage_failed: { readonly operation: "upload" | "remove" };
  workout_result_persistence_failed: { readonly operation: "upload" | "remove" };
};

export type HitoProductApiFailureCode = keyof HitoProductApiFailureParameterMap;

export type HitoProductApiFailure<
  Code extends HitoProductApiFailureCode = HitoProductApiFailureCode,
> = Code extends HitoProductApiFailureCode
  ? {
      readonly ok: false;
      readonly code: Code;
      readonly params: HitoProductApiFailureParameterMap[Code];
    }
  : never;

export function buildHitoProductApiFailure<Code extends HitoProductApiFailureCode>(
  code: Code,
  params: HitoProductApiFailureParameterMap[Code],
): HitoProductApiFailure<Code> {
  return { ok: false, code, params } as HitoProductApiFailure<Code>;
}
