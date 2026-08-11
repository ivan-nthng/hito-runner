create or replace function public.clear_calendar_future_workouts(
	p_user_id uuid,
	p_current_date date
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_cleared_workout_count integer;
begin
	if p_user_id is null or p_current_date is null then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Future Calendar deletion requires a runner and runner-local date.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	lock table
		public.planned_workouts,
		public.workout_logs,
		public.workout_result_assets,
		public.workout_actual_metrics,
		public.workout_comparisons,
		public.workout_ai_insights,
		public.runner_activity_planned_workout_matches
	in share row exclusive mode;

	if exists (
		select 1
		from public.planned_workouts workout
		where workout.user_id = p_user_id
			and workout.workout_date >= p_current_date
			and (
				exists (
					select 1 from public.workout_logs row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_result_assets row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_actual_metrics row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_comparisons row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_ai_insights row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.runner_activity_planned_workout_matches row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
			)
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'protected_future_schedule',
			'message', 'Future Calendar deletion cannot remove logged or evidence-backed workouts.'
		);
	end if;

	with deleted as (
		delete from public.planned_workouts
		where user_id = p_user_id
			and workout_date >= p_current_date
		returning id
	)
	select count(*)::integer into v_cleared_workout_count from deleted;

	return jsonb_build_object(
		'ok', true,
		'current_date', p_current_date,
		'cleared_workout_count', v_cleared_workout_count
	);
end;
$$;

revoke execute on function public.clear_calendar_future_workouts(uuid, date)
from public, anon, authenticated;

grant execute on function public.clear_calendar_future_workouts(uuid, date)
to service_role;

drop function if exists public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	bigint
);

create function public.apply_reviewed_plan_persistence(
	p_user_id uuid,
	p_profile jsonb,
	p_plan jsonb,
	p_workouts jsonb,
	p_current_date date,
	p_expected_profile_revision bigint default null
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_profile_revision bigint;
	v_persistence_result jsonb;
begin
	if jsonb_typeof(coalesce(p_profile, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_plan, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workouts, 'null'::jsonb)) <> 'array'
		or p_current_date is null
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed plan materialization payload is invalid.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	if p_expected_profile_revision is not null then
		select baseline_revision
		into v_profile_revision
		from public.runner_profiles
		where user_id = p_user_id
		for update;

		if not found or v_profile_revision is distinct from p_expected_profile_revision then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The runner baseline changed before the reviewed plan was saved.'
			);
		end if;
	end if;

	v_persistence_result := public.apply_reviewed_future_schedule_persistence(
		p_user_id,
		p_plan,
		p_workouts,
		p_current_date,
		false
	);

	if coalesce(v_persistence_result->>'ok', 'false') <> 'true' then
		return v_persistence_result;
	end if;

	insert into public.runner_profiles (
		user_id,
		goal_type,
		goal_label,
		baseline_sessions_per_week,
		baseline_long_run_km,
		baseline_notes,
		age,
		weight_kg,
		height_cm,
		training_preferences,
		setup_state
	)
	values (
		p_user_id,
		(p_profile->>'goal_type')::public.runner_goal_type,
		p_profile->>'goal_label',
		(p_profile->>'baseline_sessions_per_week')::smallint,
		(p_profile->>'baseline_long_run_km')::numeric,
		p_profile->>'baseline_notes',
		(p_profile->>'age')::smallint,
		(p_profile->>'weight_kg')::numeric,
		(p_profile->>'height_cm')::numeric,
		nullif(p_profile->'training_preferences', 'null'::jsonb),
		'completed'
	)
	on conflict (user_id) do update
	set goal_type = excluded.goal_type,
		goal_label = excluded.goal_label,
		baseline_sessions_per_week = excluded.baseline_sessions_per_week,
		baseline_long_run_km = excluded.baseline_long_run_km,
		baseline_notes = excluded.baseline_notes,
		age = case
			when p_profile ? 'age' then excluded.age
			else public.runner_profiles.age
		end,
		weight_kg = case
			when p_profile ? 'weight_kg' then excluded.weight_kg
			else public.runner_profiles.weight_kg
		end,
		height_cm = case
			when p_profile ? 'height_cm' then excluded.height_cm
			else public.runner_profiles.height_cm
		end,
		training_preferences = case
			when p_profile ? 'training_preferences' then excluded.training_preferences
			else public.runner_profiles.training_preferences
		end,
		setup_state = 'completed';

	return v_persistence_result;
end;
$$;

revoke execute on function public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	date,
	bigint
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	date,
	bigint
) to service_role;
