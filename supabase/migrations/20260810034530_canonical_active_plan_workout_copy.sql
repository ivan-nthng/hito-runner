drop function if exists public.apply_active_plan_workout_copy(
	uuid,
	uuid,
	timestamptz,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb
);

create or replace function public.apply_active_plan_workout_mutation(
	p_user_id uuid,
	p_plan_id uuid,
	p_expected_plan_updated_at timestamptz,
	p_current_date date,
	p_mutation_kind text,
	p_expected_source_workout jsonb,
	p_expected_target_workout jsonb,
	p_workout_insert jsonb,
	p_workout_update jsonb,
	p_plan_update jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_plan public.plan_cycles%rowtype;
	v_source public.planned_workouts%rowtype;
	v_target public.planned_workouts%rowtype;
	v_mutated_workout public.planned_workouts%rowtype;
	v_deleted_workout public.planned_workouts%rowtype;
	v_source_fingerprint jsonb;
	v_target_fingerprint jsonb;
	v_target_date date;
begin
	if p_mutation_kind not in ('add', 'clear', 'move')
		or jsonb_typeof(coalesce(p_plan_update, 'null'::jsonb)) <> 'object'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed calendar workout mutation payload is invalid.'
		);
	end if;

	-- Serialize all calendar mutations for one runner so the runner-wide empty-date
	-- predicate stays exact even when different saved-plan provenance rows are involved.
	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select *
	into v_plan
	from public.plan_cycles
	where id = p_plan_id
		and user_id = p_user_id;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The saved workout provenance is no longer available.'
		);
	end if;

	if p_mutation_kind = 'add' then
		if jsonb_typeof(coalesce(p_workout_insert, 'null'::jsonb)) <> 'object'
			or (p_workout_insert->>'workout_date')::date < p_current_date
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'protected_day',
				'message', 'The reviewed workout can no longer be added on that date.'
			);
		end if;

		v_target_date := (p_workout_insert->>'workout_date')::date;

		if p_expected_source_workout is not null
			and p_expected_source_workout <> 'null'::jsonb
		then
			if jsonb_typeof(p_expected_source_workout) <> 'object' then
				return jsonb_build_object(
					'ok', false,
					'reason', 'invalid_input',
					'message', 'The copied workout fingerprint is invalid.'
				);
			end if;

			select *
			into v_source
			from public.planned_workouts
			where id = (p_expected_source_workout->>'id')::uuid
				and user_id = p_user_id
			for share;

			if not found then
				return jsonb_build_object(
					'ok', false,
					'reason', 'stale_review',
					'message', 'The copied source workout changed before Paste.'
				);
			end if;

			v_source_fingerprint := jsonb_build_object(
				'id', v_source.id::text,
				'workoutDate', v_source.workout_date::text,
				'weekday', v_source.weekday,
				'weekNumber', v_source.week_number,
				'phase', v_source.phase,
				'workoutType', v_source.workout_type::text,
				'sourceWorkoutId', v_source.source_workout_id,
				'sourceWorkoutType', v_source.source_workout_type,
				'workoutFamily', v_source.workout_family,
				'workoutIdentity', v_source.workout_identity,
				'calendarIconKey', v_source.calendar_icon_key,
				'goalContext', v_source.goal_context,
				'metricMode', v_source.metric_mode,
				'title', v_source.title,
				'notes', v_source.notes,
				'plannedRpe', v_source.planned_rpe,
				'estimatedFatigue', v_source.estimated_fatigue,
				'recoveryPriority', v_source.recovery_priority,
				'steps', v_source.steps
			);

			if v_source_fingerprint is distinct from p_expected_source_workout then
				return jsonb_build_object(
					'ok', false,
					'reason', 'stale_review',
					'message', 'The copied source prescription changed before Paste.'
				);
			end if;

			if v_source.workout_type = 'rest' then
				return jsonb_build_object(
					'ok', false,
					'reason', 'protected_day',
					'message', 'Rest rows are not copyable workout prescriptions.'
				);
			end if;
		end if;

		if exists (
			select 1
			from public.planned_workouts
			where user_id = p_user_id
				and workout_date = v_target_date
		) then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'Paste requires a truly empty date; the existing row is unchanged.'
			);
		end if;

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
			(p_workout_insert->>'id')::uuid,
			p_plan_id,
			p_user_id,
			v_target_date,
			p_workout_insert->>'weekday',
			(p_workout_insert->>'week_number')::integer,
			p_workout_insert->>'phase',
			(p_workout_insert->>'workout_type')::public.workout_type,
			p_workout_insert->>'source_workout_id',
			p_workout_insert->>'source_workout_type',
			p_workout_insert->>'workout_family',
			p_workout_insert->>'workout_identity',
			p_workout_insert->>'calendar_icon_key',
			nullif(p_workout_insert->'goal_context', 'null'::jsonb),
			nullif(p_workout_insert->'metric_mode', 'null'::jsonb),
			p_workout_insert->>'title',
			p_workout_insert->>'notes',
			(p_workout_insert->>'planned_rpe')::smallint,
			p_workout_insert->>'estimated_fatigue',
			p_workout_insert->>'recovery_priority',
			p_workout_insert->'steps',
			(p_workout_insert->>'display_order')::integer
		)
		returning *
		into v_mutated_workout;
	else
		if jsonb_typeof(coalesce(p_expected_source_workout, 'null'::jsonb)) <> 'object' then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_input',
				'message', 'The reviewed source workout fingerprint is invalid.'
			);
		end if;

		select *
		into v_source
		from public.planned_workouts
		where id = (p_expected_source_workout->>'id')::uuid
			and user_id = p_user_id
		for update;

		if not found then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The source workout changed before the mutation was saved.'
			);
		end if;

		v_source_fingerprint := jsonb_build_object(
			'id', v_source.id::text,
			'workoutDate', v_source.workout_date::text,
			'weekday', v_source.weekday,
			'weekNumber', v_source.week_number,
			'phase', v_source.phase,
			'workoutType', v_source.workout_type::text,
			'sourceWorkoutId', v_source.source_workout_id,
			'sourceWorkoutType', v_source.source_workout_type,
			'workoutFamily', v_source.workout_family,
			'workoutIdentity', v_source.workout_identity,
			'calendarIconKey', v_source.calendar_icon_key,
			'goalContext', v_source.goal_context,
			'metricMode', v_source.metric_mode,
			'title', v_source.title,
			'notes', v_source.notes,
			'plannedRpe', v_source.planned_rpe,
			'estimatedFatigue', v_source.estimated_fatigue,
			'recoveryPriority', v_source.recovery_priority,
			'steps', v_source.steps
		);

		if v_source_fingerprint is distinct from p_expected_source_workout then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The source workout changed before the mutation was saved.'
			);
		end if;

		if v_source.workout_type = 'rest'
			or exists (
				select 1 from public.workout_logs
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1 from public.workout_result_assets
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1 from public.workout_actual_metrics
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1 from public.workout_comparisons
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1 from public.workout_ai_insights
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved or cleared.'
			);
		end if;

		if p_mutation_kind = 'move' then
			if jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
				or (p_workout_update->>'workout_date')::date < p_current_date
			then
				return jsonb_build_object(
					'ok', false,
					'reason', 'protected_day',
					'message', 'The reviewed workout can no longer move to that date.'
				);
			end if;

			v_target_date := (p_workout_update->>'workout_date')::date;

			if p_expected_target_workout is null
				or p_expected_target_workout = 'null'::jsonb
			then
				if exists (
					select 1 from public.planned_workouts
					where user_id = p_user_id
						and workout_date = v_target_date
						and id <> v_source.id
				) then
					return jsonb_build_object(
						'ok', false,
						'reason', 'stale_review',
						'message', 'The target date changed before the workout was moved.'
					);
				end if;
			else
				if jsonb_typeof(p_expected_target_workout) <> 'object' then
					return jsonb_build_object(
						'ok', false,
						'reason', 'invalid_input',
						'message', 'The reviewed replacement workout fingerprint is invalid.'
					);
				end if;

				select *
				into v_target
				from public.planned_workouts
				where id = (p_expected_target_workout->>'id')::uuid
					and user_id = p_user_id
					and workout_date = v_target_date
				for update;

				if not found then
					return jsonb_build_object(
						'ok', false,
						'reason', 'stale_review',
						'message', 'The target workout changed before the move was saved.'
					);
				end if;

				v_target_fingerprint := jsonb_build_object(
					'id', v_target.id::text,
					'workoutDate', v_target.workout_date::text,
					'weekday', v_target.weekday,
					'weekNumber', v_target.week_number,
					'phase', v_target.phase,
					'workoutType', v_target.workout_type::text,
					'sourceWorkoutId', v_target.source_workout_id,
					'sourceWorkoutType', v_target.source_workout_type,
					'workoutFamily', v_target.workout_family,
					'workoutIdentity', v_target.workout_identity,
					'calendarIconKey', v_target.calendar_icon_key,
					'goalContext', v_target.goal_context,
					'metricMode', v_target.metric_mode,
					'title', v_target.title,
					'notes', v_target.notes,
					'plannedRpe', v_target.planned_rpe,
					'estimatedFatigue', v_target.estimated_fatigue,
					'recoveryPriority', v_target.recovery_priority,
					'steps', v_target.steps
				);

				if v_target_fingerprint is distinct from p_expected_target_workout then
					return jsonb_build_object(
						'ok', false,
						'reason', 'stale_review',
						'message', 'The target workout changed before the move was saved.'
					);
				end if;

				if v_target.workout_date <= p_current_date
					or exists (
						select 1 from public.workout_logs
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1 from public.workout_result_assets
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1 from public.workout_actual_metrics
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1 from public.workout_comparisons
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1 from public.workout_ai_insights
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
				then
					return jsonb_build_object(
						'ok', false,
						'reason', 'protected_day',
						'message', 'The target workout became protected before the move was saved.'
					);
				end if;

				delete from public.planned_workouts
				where id = v_target.id
					and user_id = p_user_id
				returning *
				into v_deleted_workout;
			end if;

			update public.planned_workouts
			set workout_date = v_target_date,
				weekday = p_workout_update->>'weekday',
				week_number = (p_workout_update->>'week_number')::integer
			where id = v_source.id
				and user_id = p_user_id
			returning *
			into v_mutated_workout;
		else
			delete from public.planned_workouts
			where id = v_source.id
				and user_id = p_user_id
			returning *
			into v_deleted_workout;
		end if;
	end if;

	return jsonb_build_object(
		'ok', true,
		'mutation_kind', p_mutation_kind,
		'plan_cycle', to_jsonb(v_plan),
		'mutated_workout', case
			when v_mutated_workout.id is null then null
			else to_jsonb(v_mutated_workout)
		end,
		'deleted_workout', case
			when v_deleted_workout.id is null then null
			else to_jsonb(v_deleted_workout)
		end
	);
end;
$$;

revoke execute on function public.apply_active_plan_workout_mutation(
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
) from public, anon, authenticated;

grant execute on function public.apply_active_plan_workout_mutation(
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
) to service_role;

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
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed workout edit payload is invalid.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select *
	into v_plan
	from public.plan_cycles
	where id = p_plan_id
		and user_id = p_user_id;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The saved workout provenance is no longer available.'
		);
	end if;

	select *
	into v_workout
	from public.planned_workouts
	where id = p_workout_id
		and user_id = p_user_id
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

	if v_workout.workout_type = 'rest' or v_workout.workout_date < p_current_date then
		return jsonb_build_object(
			'ok', false,
			'reason', 'protected_day',
			'message', 'Past planned workouts and Rest days cannot be edited.'
		);
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
	returning *
	into v_workout;

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
) from public, anon, authenticated;

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
