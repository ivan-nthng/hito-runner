update public.plan_cycles
set status = 'archived'
where status = 'active';

alter table public.plan_cycles
	alter column status set default 'archived'::public.plan_cycle_status;

drop index if exists public.plan_cycles_one_active_per_user_idx;

drop function if exists public.apply_active_plan_schedule_reflow(
	uuid,
	uuid,
	timestamptz,
	jsonb,
	timestamptz,
	jsonb
);

alter function public.apply_active_plan_workout_mutation(
	uuid,
	uuid,
	timestamptz,
	date,
	text,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) rename to apply_calendar_workout_mutation;

alter function public.apply_active_plan_workout_content_edit(
	uuid,
	uuid,
	uuid,
	timestamptz,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) rename to apply_calendar_workout_content_edit;

drop function if exists public.apply_reviewed_plan_persistence_with_profile_revision(
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
	bigint
);

drop function if exists public.apply_reviewed_import_persistence(
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
	boolean,
	date,
	boolean
);

drop function if exists public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	uuid,
	timestamptz,
	jsonb,
	jsonb,
	jsonb,
	jsonb
);

create function public.apply_reviewed_plan_persistence(
	p_user_id uuid,
	p_profile jsonb,
	p_plan jsonb,
	p_workouts jsonb,
	p_expected_profile_revision bigint default null
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_profile_revision bigint;
	v_inserted_plan public.plan_cycles%rowtype;
	v_item jsonb;
begin
	if jsonb_typeof(coalesce(p_profile, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_plan, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workouts, 'null'::jsonb)) <> 'array'
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

	if exists (
		select 1
		from public.planned_workouts
		where user_id = p_user_id
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'calendar_not_empty',
			'message', 'Initial plan materialization requires an empty runner Calendar.'
		);
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

	insert into public.plan_cycles (
		id,
		user_id,
		status,
		title,
		goal_summary,
		source_template,
		schema_version,
		source_kind,
		start_date,
		end_date,
		target_date,
		goal_metadata,
		plan_preferences
	)
	values (
		(p_plan->>'id')::uuid,
		p_user_id,
		'archived',
		p_plan->>'title',
		p_plan->>'goal_summary',
		p_plan->>'source_template',
		p_plan->>'schema_version',
		p_plan->>'source_kind',
		(p_plan->>'start_date')::date,
		(p_plan->>'end_date')::date,
		(p_plan->>'target_date')::date,
		nullif(p_plan->'goal_metadata', 'null'::jsonb),
		nullif(p_plan->'plan_preferences', 'null'::jsonb)
	)
	returning * into v_inserted_plan;

	for v_item in select value from jsonb_array_elements(p_workouts)
	loop
		insert into public.planned_workouts (
			id,
			plan_cycle_id,
			user_id,
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
			v_inserted_plan.id,
			p_user_id,
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
		'plan_cycle', to_jsonb(v_inserted_plan),
		'workouts', coalesce((
			select jsonb_agg(to_jsonb(workout) order by workout.display_order)
			from public.planned_workouts workout
			where workout.plan_cycle_id = v_inserted_plan.id
		), '[]'::jsonb)
	);
end;
$$;

revoke execute on function public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	bigint
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_plan_persistence(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	bigint
) to service_role;

create function public.apply_reviewed_future_schedule_persistence(
	p_user_id uuid,
	p_plan jsonb,
	p_workouts jsonb,
	p_current_date date,
	p_replace_future_workouts boolean
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_inserted_plan public.plan_cycles%rowtype;
	v_item jsonb;
	v_future_workout_count integer;
begin
	if jsonb_typeof(coalesce(p_plan, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workouts, 'null'::jsonb)) <> 'array'
		or p_current_date is null
		or p_replace_future_workouts is null
		or exists (
			select 1
			from jsonb_array_elements(p_workouts) item
			where (item->>'workout_date')::date < p_current_date
		)
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Future schedule materialization accepts only reviewed future rows.'
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

	insert into public.plan_cycles (
		id,
		user_id,
		status,
		title,
		goal_summary,
		source_template,
		schema_version,
		source_kind,
		start_date,
		end_date,
		target_date,
		goal_metadata,
		plan_preferences
	)
	values (
		(p_plan->>'id')::uuid,
		p_user_id,
		'archived',
		p_plan->>'title',
		p_plan->>'goal_summary',
		p_plan->>'source_template',
		p_plan->>'schema_version',
		p_plan->>'source_kind',
		(p_plan->>'start_date')::date,
		(p_plan->>'end_date')::date,
		(p_plan->>'target_date')::date,
		nullif(p_plan->'goal_metadata', 'null'::jsonb),
		nullif(p_plan->'plan_preferences', 'null'::jsonb)
	)
	returning * into v_inserted_plan;

	for v_item in select value from jsonb_array_elements(p_workouts)
	loop
		insert into public.planned_workouts (
			id,
			plan_cycle_id,
			user_id,
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
			v_inserted_plan.id,
			p_user_id,
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
		'plan_cycle', to_jsonb(v_inserted_plan),
		'replaced_future_workout_count', v_future_workout_count,
		'workouts', coalesce((
			select jsonb_agg(to_jsonb(workout) order by workout.display_order)
			from public.planned_workouts workout
			where workout.plan_cycle_id = v_inserted_plan.id
		), '[]'::jsonb)
	);
end;
$$;

revoke execute on function public.apply_reviewed_future_schedule_persistence(
	uuid,
	jsonb,
	jsonb,
	date,
	boolean
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_future_schedule_persistence(
	uuid,
	jsonb,
	jsonb,
	date,
	boolean
) to service_role;
