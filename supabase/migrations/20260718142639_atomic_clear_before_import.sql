create or replace function public.apply_reviewed_import_persistence(
	p_user_id uuid,
	p_profile jsonb,
	p_plan jsonb,
	p_workouts jsonb,
	p_expected_active_plan_id uuid,
	p_expected_active_plan_updated_at timestamptz,
	p_expected_history jsonb,
	p_archive_goal_metadata jsonb,
	p_logs jsonb,
	p_evidence_relinks jsonb,
	p_clear_before_import boolean
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_current_plan public.plan_cycles%rowtype;
	v_archived_plan public.plan_cycles%rowtype;
	v_actual_history jsonb;
	v_result jsonb;
begin
	if p_clear_before_import is null then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Reviewed import persistence requires an explicit clear-before-import intent.'
		);
	elsif p_clear_before_import is false then
		return public.apply_reviewed_plan_persistence(
			p_user_id,
			p_profile,
			p_plan,
			p_workouts,
			p_expected_active_plan_id,
			p_expected_active_plan_updated_at,
			p_expected_history,
			p_archive_goal_metadata,
			p_logs,
			p_evidence_relinks
		);
	end if;

	if p_expected_active_plan_id is null
		or p_expected_active_plan_updated_at is null
		or jsonb_typeof(coalesce(p_expected_history, 'null'::jsonb)) <> 'object'
		or coalesce(p_logs, 'null'::jsonb) is distinct from '[]'::jsonb
		or coalesce(p_evidence_relinks, 'null'::jsonb) is distinct from '[]'::jsonb
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Clear-before-import requires one reviewed active-plan snapshot without history transfer.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	lock table
		public.planned_workouts,
		public.workout_logs,
		public.workout_result_assets,
		public.workout_actual_metrics,
		public.workout_comparisons,
		public.workout_ai_insights
	in share row exclusive mode;

	select *
	into v_current_plan
	from public.plan_cycles
	where id = p_expected_active_plan_id
		and user_id = p_user_id
		and status = 'active'
	for update;

	if not found
		or v_current_plan.updated_at is distinct from p_expected_active_plan_updated_at
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The active plan changed before clear-before-import was saved.'
		);
	end if;

	if p_archive_goal_metadata is distinct from v_current_plan.goal_metadata then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The active-plan metadata changed before clear-before-import was saved.'
		);
	end if;

	select jsonb_build_object(
		'workout_ids',
		coalesce((
			select jsonb_agg(to_jsonb(workout.id::text) order by workout.id)
			from public.planned_workouts workout
			where workout.user_id = p_user_id
				and workout.plan_cycle_id = p_expected_active_plan_id
		), '[]'::jsonb),
		'log_ids',
		coalesce((
			select jsonb_agg(to_jsonb(log.id::text) order by log.id)
			from public.workout_logs log
			join public.planned_workouts workout on workout.id = log.planned_workout_id
			where log.user_id = p_user_id
				and workout.plan_cycle_id = p_expected_active_plan_id
		), '[]'::jsonb),
		'asset_ids',
		coalesce((
			select jsonb_agg(to_jsonb(asset.id::text) order by asset.id)
			from public.workout_result_assets asset
			join public.planned_workouts workout on workout.id = asset.planned_workout_id
			where asset.user_id = p_user_id
				and workout.plan_cycle_id = p_expected_active_plan_id
		), '[]'::jsonb),
		'metric_ids',
		coalesce((
			select jsonb_agg(to_jsonb(metric.id::text) order by metric.id)
			from public.workout_actual_metrics metric
			join public.planned_workouts workout on workout.id = metric.planned_workout_id
			where metric.user_id = p_user_id
				and workout.plan_cycle_id = p_expected_active_plan_id
		), '[]'::jsonb),
		'comparison_ids',
		coalesce((
			select jsonb_agg(to_jsonb(comparison.id::text) order by comparison.id)
			from public.workout_comparisons comparison
			join public.planned_workouts workout on workout.id = comparison.planned_workout_id
			where comparison.user_id = p_user_id
				and workout.plan_cycle_id = p_expected_active_plan_id
		), '[]'::jsonb),
		'insight_ids',
		coalesce((
			select jsonb_agg(to_jsonb(insight.id::text) order by insight.id)
			from public.workout_ai_insights insight
			join public.planned_workouts workout on workout.id = insight.planned_workout_id
			where insight.user_id = p_user_id
				and workout.plan_cycle_id = p_expected_active_plan_id
		), '[]'::jsonb)
	)
	into v_actual_history;

	if v_actual_history is distinct from p_expected_history then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The active-plan history changed before clear-before-import was saved.'
		);
	end if;

	update public.plan_cycles
	set status = 'archived'
	where id = v_current_plan.id
		and user_id = p_user_id
		and status = 'active'
	returning *
	into v_archived_plan;

	if not found then
		raise exception 'Active plan changed during clear-before-import persistence.';
	end if;

	v_result := public.apply_reviewed_plan_persistence(
		p_user_id,
		p_profile,
		p_plan,
		p_workouts,
		null,
		null,
		jsonb_build_object(
			'workout_ids', '[]'::jsonb,
			'log_ids', '[]'::jsonb,
			'asset_ids', '[]'::jsonb,
			'metric_ids', '[]'::jsonb,
			'comparison_ids', '[]'::jsonb,
			'insight_ids', '[]'::jsonb
		),
		null,
		'[]'::jsonb,
		'[]'::jsonb
	);

	if coalesce((v_result->>'ok')::boolean, false) is not true then
		raise exception using
			message = coalesce(
				v_result->>'message',
				'The imported plan could not be persisted after clearing the reviewed schedule.'
			);
	end if;

	return jsonb_set(v_result, '{archived_plan}', to_jsonb(v_archived_plan), true);
end;
$$;

revoke execute on function public.apply_reviewed_import_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	uuid,
	timestamptz,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	boolean
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_import_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	uuid,
	timestamptz,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	boolean
) to service_role;
