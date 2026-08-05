-- A planned workout has at most one current FIT projection. Finalization swaps
-- match, metrics, and parsed-asset state atomically so incomplete work cannot
-- become runner-visible completion.

do $$
begin
	if exists (
		select 1
		from public.runner_activity_planned_workout_matches
		where planned_workout_id is not null
		group by user_id, planned_workout_id
		having count(*) > 1
	) then
		raise exception 'Cannot enforce one current activity match while duplicate planned-workout matches exist.';
	end if;

	if exists (
		select 1
		from public.workout_actual_metrics
		where planned_workout_id is not null and status <> 'superseded'
		group by user_id, planned_workout_id
		having count(*) > 1
	) then
		raise exception 'Cannot enforce one current metrics projection while duplicate active metrics exist.';
	end if;
end;
$$;

create unique index runner_activity_matches_one_current_workout_idx
	on public.runner_activity_planned_workout_matches (user_id, planned_workout_id)
	where planned_workout_id is not null;

create unique index workout_actual_metrics_one_current_workout_idx
	on public.workout_actual_metrics (user_id, planned_workout_id)
	where planned_workout_id is not null and status <> 'superseded';

-- Workout logs are written through the server action that preserves FIT facts
-- and runner-authored subjective evidence. Direct Data API writes would bypass
-- that contract even when own-row RLS succeeds.
revoke insert, update, delete on table public.workout_logs from authenticated;
drop policy if exists workout_logs_insert_own on public.workout_logs;
drop policy if exists workout_logs_update_own on public.workout_logs;

create or replace function public.finalize_runner_activity_planned_workout_projection(
	p_user_id uuid,
	p_planned_workout_id uuid,
	p_activity_id uuid,
	p_activity_revision_id uuid,
	p_source_revision_id uuid,
	p_asset_id uuid,
	p_metrics_id uuid,
	p_comparison_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
	if not exists (
		select 1
		from public.planned_workouts workout
		join public.runner_activities activity
			on activity.id = p_activity_id
			and activity.user_id = p_user_id
			and activity.sport = 'run'
			and activity.recording_kind = 'recorded'
			and activity.quality_state = 'accepted'
			and activity.current_revision_id = p_activity_revision_id
		join public.runner_activity_revisions activity_revision
			on activity_revision.id = p_activity_revision_id
			and activity_revision.user_id = p_user_id
			and activity_revision.activity_id = p_activity_id
			and activity_revision.source_revision_id = p_source_revision_id
		join public.runner_activity_source_revisions source_revision
			on source_revision.id = p_source_revision_id
			and source_revision.user_id = p_user_id
		join public.runner_activity_sources source
			on source.id = source_revision.source_id
			and source.user_id = p_user_id
			and source.activity_id = p_activity_id
			and source.current_revision_id = p_source_revision_id
		join public.workout_result_assets asset
			on asset.id = p_asset_id
			and asset.user_id = p_user_id
			and asset.planned_workout_id = p_planned_workout_id
			and asset.activity_source_revision_id = p_source_revision_id
			and asset.primary_file_kind = 'fit'
		join public.workout_actual_metrics metrics
			on metrics.id = p_metrics_id
			and metrics.user_id = p_user_id
			and metrics.planned_workout_id = p_planned_workout_id
			and metrics.result_asset_id = p_asset_id
			and metrics.activity_id = p_activity_id
			and metrics.activity_revision_id = p_activity_revision_id
			and metrics.source_kind = 'garmin_fit'
		join public.workout_comparisons comparison
			on comparison.id = p_comparison_id
			and comparison.user_id = p_user_id
			and comparison.planned_workout_id = p_planned_workout_id
			and comparison.actual_metrics_id = p_metrics_id
			and comparison.comparison_formula_version = 'deterministic_workout_comparison_v1'
		where workout.id = p_planned_workout_id
			and workout.user_id = p_user_id
			and exists (
				select 1
				from jsonb_array_elements(comparison.difference_payload->'signals') signal
				where signal->>'key' = 'activity_type'
					and signal->>'status' = 'matched'
					and lower(trim(signal->>'actualValue')) in ('run', 'running')
			)
	) then
		raise exception 'The planned-workout FIT projection is not a complete current running chain.';
	end if;

	if exists (
		select 1
		from public.runner_activity_planned_workout_matches
		where user_id = p_user_id
			and activity_id = p_activity_id
			and planned_workout_id is not null
			and planned_workout_id <> p_planned_workout_id
	) then
		raise exception 'The runner activity is already attached to another planned workout.';
	end if;

	update public.runner_activity_planned_workout_matches
	set planned_workout_id = null
	where user_id = p_user_id
		and planned_workout_id = p_planned_workout_id
		and activity_id <> p_activity_id;

	insert into public.runner_activity_planned_workout_matches (
		user_id, activity_id, planned_workout_id, source_revision_id, match_method
	) values (
		p_user_id, p_activity_id, p_planned_workout_id, p_source_revision_id, 'runner_selected'
	)
	on conflict (activity_id) do update
	set planned_workout_id = excluded.planned_workout_id,
		source_revision_id = excluded.source_revision_id,
		match_method = excluded.match_method
	where runner_activity_planned_workout_matches.user_id = excluded.user_id;

	update public.workout_actual_metrics
	set status = 'superseded'
	where user_id = p_user_id
		and planned_workout_id = p_planned_workout_id
		and id <> p_metrics_id
		and status <> 'superseded';

	update public.workout_actual_metrics
	set status = 'normalized'
	where id = p_metrics_id and user_id = p_user_id;

	update public.workout_result_assets
	set parse_status = 'parsed', parse_error = null
	where id = p_asset_id and user_id = p_user_id;
end;
$$;

revoke execute on function public.finalize_runner_activity_planned_workout_projection(
	uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.finalize_runner_activity_planned_workout_projection(
	uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) to service_role;

create or replace function public.list_runner_fit_completed_planned_workouts(
	p_user_id uuid,
	p_planned_workout_ids uuid[]
)
returns table (planned_workout_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
	select match.planned_workout_id
	from public.runner_activity_planned_workout_matches match
	join public.runner_activities activity
		on activity.id = match.activity_id
		and activity.user_id = p_user_id
		and activity.sport = 'run'
		and activity.recording_kind = 'recorded'
		and activity.quality_state = 'accepted'
	join public.runner_activity_revisions activity_revision
		on activity_revision.id = activity.current_revision_id
		and activity_revision.user_id = p_user_id
		and activity_revision.activity_id = activity.id
		and activity_revision.source_revision_id = match.source_revision_id
	join public.runner_activity_source_revisions source_revision
		on source_revision.id = match.source_revision_id
		and source_revision.user_id = p_user_id
	join public.runner_activity_sources source
		on source.id = source_revision.source_id
		and source.user_id = p_user_id
		and source.activity_id = activity.id
		and source.current_revision_id = source_revision.id
	join public.workout_actual_metrics metrics
		on metrics.user_id = p_user_id
		and metrics.planned_workout_id = match.planned_workout_id
		and metrics.activity_id = activity.id
		and metrics.activity_revision_id = activity_revision.id
		and metrics.source_kind = 'garmin_fit'
		and metrics.status <> 'superseded'
	join public.workout_result_assets asset
		on asset.id = metrics.result_asset_id
		and asset.user_id = p_user_id
		and asset.planned_workout_id = match.planned_workout_id
		and asset.activity_source_revision_id = source_revision.id
		and asset.parse_status = 'parsed'
		and asset.primary_file_kind = 'fit'
	join public.workout_comparisons comparison
		on comparison.user_id = p_user_id
		and comparison.planned_workout_id = match.planned_workout_id
		and comparison.actual_metrics_id = metrics.id
		and comparison.comparison_formula_version = 'deterministic_workout_comparison_v1'
	where match.user_id = p_user_id
		and match.planned_workout_id = any(p_planned_workout_ids)
		and exists (
			select 1
			from jsonb_array_elements(comparison.difference_payload->'signals') signal
			where signal->>'key' = 'activity_type'
				and signal->>'status' = 'matched'
				and lower(trim(signal->>'actualValue')) in ('run', 'running')
		);
$$;

revoke execute on function public.list_runner_fit_completed_planned_workouts(uuid, uuid[])
	from public, anon, authenticated;
grant execute on function public.list_runner_fit_completed_planned_workouts(uuid, uuid[])
	to service_role;
