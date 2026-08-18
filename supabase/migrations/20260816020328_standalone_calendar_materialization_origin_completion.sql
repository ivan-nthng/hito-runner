drop function if exists public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	date,
	bigint
);

drop function if exists public.apply_reviewed_future_schedule_persistence(
	uuid,
	jsonb,
	jsonb,
	date,
	boolean
);

create function public.apply_reviewed_future_schedule_persistence(
	p_user_id uuid,
	p_source_plan_id uuid,
	p_workouts jsonb,
	p_current_date date,
	p_replace_future_workouts boolean
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_source_plan public.plan_cycles%rowtype;
	v_origin_kind text;
	v_item jsonb;
	v_future_workout_count integer;
begin
	if p_user_id is null
		or p_source_plan_id is null
		or jsonb_typeof(coalesce(p_workouts, 'null'::jsonb)) <> 'array'
		or p_current_date is null
		or p_replace_future_workouts is null
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Future schedule materialization requires one immutable source and reviewed future rows.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select source.*
	into v_source_plan
	from public.plan_cycles source
	where source.id = p_source_plan_id
		and source.user_id = p_user_id
		and source.status = 'archived'
		and source.saved_plan_payload is not null
		and source.saved_plan_review_checksum is not null
	for share;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'source_plan_not_found',
			'message', 'The reviewed immutable source plan is unavailable for this runner.'
		);
	end if;

	v_origin_kind := case v_source_plan.source_kind
		when 'manual_user_built_plan_v1' then 'manual'
		when 'ai_authored_plan_first_v1' then 'ai'
		when 'training_plan_v2_import' then 'file_import'
		else null
	end;

	if v_origin_kind is null
		or (
			v_source_plan.source_kind = 'training_plan_v2_import'
			and (
				coalesce(
					v_source_plan.goal_metadata->'training_plan_v2_import'->>'origin_source_kind',
					''
				) is distinct from coalesce(v_source_plan.saved_plan_payload->>'source_kind', '')
				or coalesce(
					v_source_plan.goal_metadata->'training_plan_v2_import'->>'origin_source_status',
					''
				) is distinct from coalesce(v_source_plan.saved_plan_payload->>'source_status', '')
			)
		)
		or (
			v_source_plan.source_kind <> 'training_plan_v2_import'
			and coalesce(v_source_plan.saved_plan_payload->>'source_kind', '')
				is distinct from coalesce(v_source_plan.source_kind, '')
		)
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'source_plan_not_supported',
			'message', 'The reviewed source plan does not have a supported immutable Calendar origin.'
		);
	end if;

	if exists (
		select 1
		from jsonb_array_elements(p_workouts) item
		where coalesce(item->>'user_id', '') is distinct from p_user_id::text
			or coalesce(item->>'plan_cycle_id', '') is distinct from p_source_plan_id::text
			or coalesce(item->>'origin_kind', '') is distinct from v_origin_kind
			or coalesce(item->>'source_workout_id', '') = ''
			or (
				coalesce(item->>'workout_type', '') <> 'rest'
				and not exists (
				select 1
				from jsonb_array_elements(v_source_plan.saved_plan_payload->'planned_workouts') source_workout
				where source_workout->>'workout_id' = item->>'source_workout_id'
				)
			)
			or (item->>'workout_date')::date < p_current_date
	) or exists (
		select 1
		from jsonb_array_elements(p_workouts) item
		group by item->>'workout_date'
		having count(*) > 1
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Future schedule materialization rows do not match their immutable source provenance.'
		);
	end if;

	lock table
		public.planned_workouts,
		public.workout_logs,
		public.workout_result_assets,
		public.workout_actual_metrics,
		public.workout_comparisons,
		public.workout_ai_insights,
		public.runner_activity_planned_workout_matches
	in share row exclusive mode;

	select count(*)::integer
	into v_future_workout_count
	from public.planned_workouts
	where user_id = p_user_id
		and workout_date >= p_current_date;

	if v_future_workout_count > 0 and p_replace_future_workouts is false then
		return jsonb_build_object(
			'ok', false,
			'reason', 'replacement_required',
			'message', 'Future workouts exist and require explicit replacement intent.'
		);
	end if;

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
			'message', 'Future schedule replacement cannot remove logged or evidence-backed workouts.'
		);
	end if;

	if p_replace_future_workouts then
		delete from public.planned_workouts
		where user_id = p_user_id
			and workout_date >= p_current_date;
	end if;

	for v_item in select value from jsonb_array_elements(p_workouts)
	loop
		insert into public.planned_workouts (
			id,
			plan_cycle_id,
			user_id,
			origin_kind,
			workout_date,
			weekday,
			week_number,
			phase,
			workout_type,
			source_workout_id,
			source_workout_type,
			workout_family,
			workout_identity,
			calendar_icon_key,
			goal_context,
			metric_mode,
			title,
			notes,
			planned_rpe,
			estimated_fatigue,
			recovery_priority,
			steps,
			display_order
		)
		values (
			(v_item->>'id')::uuid,
			v_source_plan.id,
			p_user_id,
			v_origin_kind,
			(v_item->>'workout_date')::date,
			v_item->>'weekday',
			(v_item->>'week_number')::integer,
			v_item->>'phase',
			(v_item->>'workout_type')::public.workout_type,
			v_item->>'source_workout_id',
			v_item->>'source_workout_type',
			v_item->>'workout_family',
			v_item->>'workout_identity',
			v_item->>'calendar_icon_key',
			nullif(v_item->'goal_context', 'null'::jsonb),
			nullif(v_item->'metric_mode', 'null'::jsonb),
			v_item->>'title',
			v_item->>'notes',
			(v_item->>'planned_rpe')::smallint,
			v_item->>'estimated_fatigue',
			v_item->>'recovery_priority',
			v_item->'steps',
			(v_item->>'display_order')::integer
		);
	end loop;

	return jsonb_build_object(
		'ok', true,
		'plan_cycle', to_jsonb(v_source_plan),
		'replaced_future_workout_count', v_future_workout_count,
		'workouts', coalesce((
			select jsonb_agg(to_jsonb(workout) order by workout.display_order)
			from public.planned_workouts workout
			where workout.user_id = p_user_id
				and workout.plan_cycle_id = v_source_plan.id
				and workout.id in (
					select (item->>'id')::uuid
					from jsonb_array_elements(p_workouts) item
				)
		), '[]'::jsonb)
	);
end;
$$;

revoke execute on function public.apply_reviewed_future_schedule_persistence(
	uuid,
	uuid,
	jsonb,
	date,
	boolean
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_future_schedule_persistence(
	uuid,
	uuid,
	jsonb,
	date,
	boolean
) to service_role;

create function public.apply_reviewed_plan_persistence(
	p_user_id uuid,
	p_profile jsonb,
	p_source_plan_id uuid,
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
	if p_user_id is null
		or jsonb_typeof(coalesce(p_profile, 'null'::jsonb)) <> 'object'
		or p_source_plan_id is null
		or jsonb_typeof(coalesce(p_workouts, 'null'::jsonb)) <> 'array'
		or p_current_date is null
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed source materialization payload is invalid.'
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
				'message', 'The runner baseline changed before the reviewed source was materialized.'
			);
		end if;
	end if;

	v_persistence_result := public.apply_reviewed_future_schedule_persistence(
		p_user_id,
		p_source_plan_id,
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
		age = case when p_profile ? 'age' then excluded.age else public.runner_profiles.age end,
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
	uuid,
	jsonb,
	date,
	bigint
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	uuid,
	jsonb,
	date,
	bigint
) to service_role;
