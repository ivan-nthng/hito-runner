-- Runner Activity writes and private provenance readback are server-owned. The
-- authenticated product consumes their runner-safe API projections instead of
-- the raw Data API tables.
revoke all privileges on table
	public.workout_result_assets,
	public.workout_actual_metrics,
	public.workout_comparisons,
	public.workout_ai_insights,
	public.runner_activities,
	public.runner_activity_sources,
	public.runner_activity_source_revisions,
	public.runner_activity_revisions,
	public.runner_activity_planned_workout_matches,
	public.runner_activity_fact_snapshots,
	public.runner_activity_evidence_revisions,
	public.runner_activity_metric_observations,
	public.runner_activity_metric_snapshots
from authenticated;

-- Server actions use the canonical secret-key client. Restate its least-privilege
-- access here so this migration is safe after either legacy or current defaults.
grant select, insert, update, delete on table
	public.workout_result_assets,
	public.workout_actual_metrics,
	public.workout_comparisons,
	public.runner_activities,
	public.runner_activity_sources,
	public.runner_activity_source_revisions,
	public.runner_activity_revisions,
	public.runner_activity_planned_workout_matches
to service_role;

grant select, insert, update on table public.workout_ai_insights to service_role;

grant select, insert, delete on table
	public.runner_activity_fact_snapshots,
	public.runner_activity_evidence_revisions,
	public.runner_activity_metric_observations,
	public.runner_activity_metric_snapshots
to service_role;
