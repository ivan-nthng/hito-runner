create or replace function public.apply_active_plan_schedule_reflow(
	p_user_id uuid,
	p_plan_id uuid,
	p_expected_plan_updated_at timestamptz,
	p_plan_preferences jsonb,
	p_applied_at timestamptz,
	p_updates jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_plan public.plan_cycles%rowtype;
	v_update jsonb;
	v_workout public.planned_workouts%rowtype;
	v_workout_id uuid;
	v_from_date date;
	v_to_date date;
	v_weekday text;
	v_week_number integer;
	v_display_order integer;
	v_blocked_days jsonb := '[]'::jsonb;
	v_applied_count integer := 0;
	v_row_count integer := 0;
begin
	if jsonb_typeof(coalesce(p_updates, '[]'::jsonb)) <> 'array' then
		return jsonb_build_object(
			'ok', false,
			'reason', 'apply_failed',
			'message', 'Schedule changes could not be applied. Review the schedule again.'
		);
	end if;

	p_plan_preferences := coalesce(p_plan_preferences, '{}'::jsonb);

	if jsonb_typeof(p_plan_preferences->'blocked_days') = 'array' then
		v_blocked_days := p_plan_preferences->'blocked_days';
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
			'reason', 'stale_preview',
			'message', 'The active plan changed before schedule changes could be applied.'
		);
	end if;

	for v_update in
		select value from jsonb_array_elements(p_updates)
	loop
		begin
			v_workout_id := (v_update->>'workoutId')::uuid;
			v_from_date := (v_update->>'fromDate')::date;
			v_to_date := (v_update->>'toDate')::date;
			v_weekday := v_update->>'weekday';
			v_week_number := (v_update->>'weekNumber')::integer;
			v_display_order := (v_update->>'displayOrder')::integer;
		exception
			when others then
				return jsonb_build_object(
					'ok', false,
					'reason', 'apply_failed',
					'message', 'Schedule changes could not be applied. Review the schedule again.'
				);
		end;

		if v_workout_id is null
			or v_from_date is null
			or v_to_date is null
			or v_weekday is null
			or v_week_number is null
			or v_display_order is null
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'apply_failed',
				'message', 'Schedule changes could not be applied. Review the schedule again.'
			);
		end if;

		if exists (
			select 1
			from jsonb_array_elements_text(v_blocked_days) as blocked(day_name)
			where blocked.day_name = v_weekday
		) then
			return jsonb_build_object(
				'ok', false,
				'reason', 'fixed_rest_day_violation',
				'message', 'The reviewed schedule would place a workout on a fixed rest day.'
			);
		end if;

		select *
		into v_workout
		from public.planned_workouts
		where id = v_workout_id
			and user_id = p_user_id
			and plan_cycle_id = p_plan_id
		for update;

		if not found
			or v_workout.workout_date is distinct from v_from_date
			or v_workout.workout_type = 'rest'
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_preview',
				'message', 'A workout changed before schedule changes could be applied. Review the schedule again.'
			);
		end if;

		if exists (
			select 1
			from public.workout_logs
			where planned_workout_id = v_workout_id
				and user_id = p_user_id
		)
		or exists (
			select 1
			from public.workout_result_assets
			where planned_workout_id = v_workout_id
				and user_id = p_user_id
		)
		or exists (
			select 1
			from public.workout_actual_metrics
			where planned_workout_id = v_workout_id
				and user_id = p_user_id
		)
		or exists (
			select 1
			from public.workout_comparisons
			where planned_workout_id = v_workout_id
				and user_id = p_user_id
		)
		or exists (
			select 1
			from public.workout_ai_insights
			where planned_workout_id = v_workout_id
				and user_id = p_user_id
		) then
			return jsonb_build_object(
				'ok', false,
				'reason', 'protected_history_conflict',
				'message', 'A workout gained a log or Garmin evidence before schedule changes could be applied. Review the schedule again.'
			);
		end if;
	end loop;

	update public.plan_cycles
	set plan_preferences = p_plan_preferences,
		updated_at = p_applied_at
	where id = p_plan_id
		and user_id = p_user_id
		and status = 'active';

	for v_update in
		select value from jsonb_array_elements(p_updates)
	loop
		v_workout_id := (v_update->>'workoutId')::uuid;
		v_to_date := (v_update->>'toDate')::date;
		v_weekday := v_update->>'weekday';
		v_week_number := (v_update->>'weekNumber')::integer;
		v_display_order := (v_update->>'displayOrder')::integer;

		update public.planned_workouts
		set workout_date = v_to_date,
			weekday = v_weekday,
			week_number = v_week_number,
			display_order = v_display_order
		where id = v_workout_id
			and user_id = p_user_id
			and plan_cycle_id = p_plan_id;

		get diagnostics v_row_count = row_count;

		if v_row_count <> 1 then
			raise exception 'schedule reflow update failed for workout %', v_workout_id;
		end if;

		v_applied_count := v_applied_count + 1;
	end loop;

	return jsonb_build_object(
		'ok', true,
		'applied_workout_count', v_applied_count
	);
end;
$$;

revoke execute on function public.apply_active_plan_schedule_reflow(
	uuid,
	uuid,
	timestamptz,
	jsonb,
	timestamptz,
	jsonb
) from public;

grant execute on function public.apply_active_plan_schedule_reflow(
	uuid,
	uuid,
	timestamptz,
	jsonb,
	timestamptz,
	jsonb
) to service_role;
