create or replace function public.apply_calendar_workout_content_edit(
	p_user_id uuid,
	p_plan_id uuid,
	p_workout_id uuid,
	p_expected_plan_updated_at timestamptz,
	p_current_date date,
	p_expected_workout jsonb,
	p_workout_update jsonb,
	p_plan_goal_metadata jsonb,
	p_plan_preferences jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_plan public.plan_cycles%rowtype;
	v_workout public.planned_workouts%rowtype;
begin
	if jsonb_typeof(coalesce(p_expected_workout, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_plan_goal_metadata, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_plan_preferences, 'null'::jsonb)) <> 'object'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed workout document edit payload is invalid.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select *
	into v_plan
	from public.plan_cycles
	where id = p_plan_id
		and user_id = p_user_id
	for update;

	if not found or v_plan.updated_at is distinct from p_expected_plan_updated_at then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The workout provenance changed before the edit was saved.'
		);
	end if;

	select *
	into v_workout
	from public.planned_workouts
	where id = p_workout_id
		and user_id = p_user_id
		and plan_cycle_id = p_plan_id
	for update;

	if not found or to_jsonb(v_workout) is distinct from p_expected_workout then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The planned workout changed before the edit was saved.'
		);
	end if;

	if v_workout.workout_type = 'rest' or v_workout.workout_date < p_current_date then
		return jsonb_build_object(
			'ok', false,
			'reason', 'protected_day',
			'message', 'Past planned workouts and Rest days cannot be edited.'
		);
	end if;

	if exists (
			select 1
			from public.workout_logs
			where user_id = p_user_id
				and planned_workout_id = p_workout_id
		)
		or exists (
			select 1
			from public.workout_result_assets
			where user_id = p_user_id
				and planned_workout_id = p_workout_id
		)
		or exists (
			select 1
			from public.workout_actual_metrics
			where user_id = p_user_id
				and planned_workout_id = p_workout_id
		)
		or exists (
			select 1
			from public.workout_comparisons
			where user_id = p_user_id
				and planned_workout_id = p_workout_id
		)
		or exists (
			select 1
			from public.workout_ai_insights
			where user_id = p_user_id
				and planned_workout_id = p_workout_id
		)
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'protected_day',
			'message', 'Logged, skipped, or evidence-backed workouts cannot be edited.'
		);
	end if;

	update public.plan_cycles
	set goal_metadata = p_plan_goal_metadata,
		plan_preferences = p_plan_preferences
	where id = p_plan_id
		and user_id = p_user_id
	returning *
	into v_plan;

	if not found then
		raise exception 'Workout provenance changed during document edit persistence.';
	end if;

	update public.planned_workouts
	set workout_type = (p_workout_update->>'workout_type')::public.workout_type,
		workout_family = p_workout_update->>'workout_family',
		workout_identity = p_workout_update->>'workout_identity',
		calendar_icon_key = p_workout_update->>'calendar_icon_key',
		metric_mode = p_workout_update->'metric_mode',
		title = p_workout_update->>'title',
		notes = p_workout_update->>'notes',
		steps = p_workout_update->'steps'
	where id = p_workout_id
		and user_id = p_user_id
		and plan_cycle_id = p_plan_id
	returning *
	into v_workout;

	if not found then
		raise exception 'Planned workout changed during document edit persistence.';
	end if;

	return jsonb_build_object(
		'ok', true,
		'plan_cycle', to_jsonb(v_plan),
		'edited_workout', to_jsonb(v_workout)
	);
end;
$$;

revoke execute on function public.apply_calendar_workout_content_edit(
	uuid,
	uuid,
	uuid,
	timestamptz,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) from public, anon, authenticated;

grant execute on function public.apply_calendar_workout_content_edit(
	uuid,
	uuid,
	uuid,
	timestamptz,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) to service_role;
