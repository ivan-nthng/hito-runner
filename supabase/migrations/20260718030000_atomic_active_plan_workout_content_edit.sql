create or replace function public.apply_active_plan_workout_content_edit(
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
	v_actual_workout jsonb;
begin
	if jsonb_typeof(coalesce(p_expected_workout, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_plan_goal_metadata, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_plan_preferences, 'null'::jsonb)) <> 'object'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed workout edit payload is invalid.'
		);
	end if;

	select *
	into v_plan
	from public.plan_cycles
	where id = p_plan_id
		and user_id = p_user_id
		and status = 'active'
	for update;

	if not found or v_plan.updated_at is distinct from p_expected_plan_updated_at then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The active plan changed before the workout edit was saved.'
		);
	end if;

	select *
	into v_workout
	from public.planned_workouts
	where id = p_workout_id
		and user_id = p_user_id
		and plan_cycle_id = p_plan_id
	for update;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The planned workout changed before the edit was saved.'
		);
	end if;

	v_actual_workout := jsonb_build_object(
		'id', v_workout.id::text,
		'workoutDate', v_workout.workout_date::text,
		'weekday', v_workout.weekday,
		'weekNumber', v_workout.week_number,
		'phase', v_workout.phase,
		'workoutType', v_workout.workout_type::text,
		'sourceWorkoutId', v_workout.source_workout_id,
		'sourceWorkoutType', v_workout.source_workout_type,
		'workoutFamily', v_workout.workout_family,
		'workoutIdentity', v_workout.workout_identity,
		'calendarIconKey', v_workout.calendar_icon_key,
		'goalContext', v_workout.goal_context,
		'metricMode', v_workout.metric_mode,
		'title', v_workout.title,
		'notes', v_workout.notes,
		'plannedRpe', v_workout.planned_rpe,
		'estimatedFatigue', v_workout.estimated_fatigue,
		'recoveryPriority', v_workout.recovery_priority,
		'steps', v_workout.steps
	);

	if v_actual_workout is distinct from p_expected_workout then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The planned workout changed before the edit was saved.'
		);
	end if;

	if v_workout.workout_type = 'rest' or v_workout.workout_date <= p_current_date then
		return jsonb_build_object(
			'ok', false,
			'reason', 'protected_day',
			'message', 'Only future unlogged workouts can be edited.'
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
			'message', 'Logged or evidence-backed workouts cannot be edited.'
		);
	end if;

	update public.plan_cycles
	set goal_metadata = p_plan_goal_metadata,
		plan_preferences = p_plan_preferences
	where id = p_plan_id
		and user_id = p_user_id
		and status = 'active'
	returning *
	into v_plan;

	if not found then
		raise exception 'Active plan changed during workout edit persistence.';
	end if;

	update public.planned_workouts
	set phase = p_workout_update->>'phase',
		workout_type = (p_workout_update->>'workout_type')::public.workout_type,
		source_workout_id = p_workout_update->>'source_workout_id',
		source_workout_type = p_workout_update->>'source_workout_type',
		workout_family = p_workout_update->>'workout_family',
		workout_identity = p_workout_update->>'workout_identity',
		calendar_icon_key = p_workout_update->>'calendar_icon_key',
		goal_context = nullif(p_workout_update->'goal_context', 'null'::jsonb),
		metric_mode = nullif(p_workout_update->'metric_mode', 'null'::jsonb),
		title = p_workout_update->>'title',
		notes = p_workout_update->>'notes',
		planned_rpe = (p_workout_update->>'planned_rpe')::smallint,
		estimated_fatigue = p_workout_update->>'estimated_fatigue',
		recovery_priority = p_workout_update->>'recovery_priority',
		steps = p_workout_update->'steps',
		display_order = (p_workout_update->>'display_order')::integer
	where id = p_workout_id
		and user_id = p_user_id
		and plan_cycle_id = p_plan_id
	returning *
	into v_workout;

	if not found then
		raise exception 'Planned workout changed during workout edit persistence.';
	end if;

	return jsonb_build_object(
		'ok', true,
		'plan_cycle', to_jsonb(v_plan),
		'edited_workout', to_jsonb(v_workout)
	);
end;
$$;

revoke execute on function public.apply_active_plan_workout_content_edit(
	uuid,
	uuid,
	uuid,
	timestamptz,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) from public;

revoke execute on function public.apply_active_plan_workout_content_edit(
	uuid,
	uuid,
	uuid,
	timestamptz,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) from anon, authenticated;

grant execute on function public.apply_active_plan_workout_content_edit(
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
