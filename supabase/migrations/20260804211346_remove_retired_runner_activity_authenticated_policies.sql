-- Runner Activity and workout-result projection rows are server-owned. The
-- authenticated product uses runner-safe API projections, so retaining the old
-- direct Data API policies would make an accidental future GRANT unsafe.
drop policy if exists runner_activities_select_own on public.runner_activities;
drop policy if exists runner_activity_evidence_select_own on public.runner_activity_evidence_revisions;
drop policy if exists runner_activity_fact_snapshots_select_own on public.runner_activity_fact_snapshots;
drop policy if exists runner_activity_metric_observations_select_own on public.runner_activity_metric_observations;
drop policy if exists runner_activity_metric_snapshots_select_own on public.runner_activity_metric_snapshots;
drop policy if exists runner_activity_matches_select_own on public.runner_activity_planned_workout_matches;
drop policy if exists runner_activity_revisions_select_own on public.runner_activity_revisions;
drop policy if exists runner_activity_source_revisions_select_own on public.runner_activity_source_revisions;
drop policy if exists runner_activity_sources_select_own on public.runner_activity_sources;

drop policy if exists workout_actual_metrics_insert_own on public.workout_actual_metrics;
drop policy if exists workout_actual_metrics_select_own on public.workout_actual_metrics;
drop policy if exists workout_actual_metrics_update_own on public.workout_actual_metrics;
drop policy if exists workout_ai_insights_insert_own on public.workout_ai_insights;
drop policy if exists workout_ai_insights_select_own on public.workout_ai_insights;
drop policy if exists workout_ai_insights_update_own on public.workout_ai_insights;
drop policy if exists workout_comparisons_insert_own on public.workout_comparisons;
drop policy if exists workout_comparisons_select_own on public.workout_comparisons;
drop policy if exists workout_result_assets_insert_own on public.workout_result_assets;
drop policy if exists workout_result_assets_select_own on public.workout_result_assets;
drop policy if exists workout_result_assets_update_own on public.workout_result_assets;
