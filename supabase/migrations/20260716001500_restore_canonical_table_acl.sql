-- Fresh databases create these tables as postgres, whose local default privileges do not grant
-- application CRUD. Keep table ACL aligned with the existing RLS policies and server-only usage.

revoke all privileges on table
	public.runner_profiles,
	public.plan_cycles,
	public.planned_workouts,
	public.workout_logs,
	public.workout_result_assets,
	public.workout_actual_metrics,
	public.workout_comparisons,
	public.workout_ai_insights,
	public.runner_entitlements,
	public.runner_capability_usage,
	public.runner_manual_workout_templates,
	public.admin_capture_items
from public, anon, authenticated, service_role;

-- Authenticated access exactly mirrors the operations covered by current own-row RLS policies.
grant select, insert, update on table
	public.runner_profiles,
	public.plan_cycles,
	public.planned_workouts,
	public.workout_logs,
	public.workout_result_assets,
	public.workout_actual_metrics,
	public.workout_ai_insights
to authenticated;

grant select, insert on table
	public.workout_comparisons
to authenticated;

grant select on table
	public.runner_entitlements,
	public.runner_capability_usage
to authenticated;

grant select, insert, update, delete on table
	public.runner_manual_workout_templates
to authenticated;

-- Server actions use service_role and bypass RLS, but still require explicit PostgreSQL ACL.
grant select, insert, update, delete on table
	public.runner_profiles,
	public.plan_cycles,
	public.planned_workouts,
	public.workout_logs,
	public.workout_result_assets,
	public.workout_actual_metrics,
	public.workout_comparisons,
	public.admin_capture_items
to service_role;

grant select, insert, update on table
	public.workout_ai_insights,
	public.runner_capability_usage
to service_role;

grant select on table
	public.runner_entitlements
to service_role;

grant select, insert, delete on table
	public.runner_manual_workout_templates
to service_role;
