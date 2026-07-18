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
begin
	if p_mutation_kind not in ('add', 'clear', 'move')
		or jsonb_typeof(coalesce(p_plan_update, 'null'::jsonb)) <> 'object'
		or not (p_plan_update ? 'end_date')
		or jsonb_typeof(coalesce(p_plan_update->'goal_metadata', 'null'::jsonb))
			not in ('object', 'null')
		or jsonb_typeof(coalesce(p_plan_update->'plan_preferences', 'null'::jsonb))
			not in ('object', 'null')
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed active-plan workout mutation payload is invalid.'
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
			'message', 'The active plan changed before the workout mutation was saved.'
		);
	end if;

	if p_mutation_kind = 'add' then
		if jsonb_typeof(coalesce(p_workout_insert, 'null'::jsonb)) <> 'object'
			or (p_workout_insert->>'workout_date')::date < p_current_date
			or (p_workout_insert->>'workout_date')::date < v_plan.start_date
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'protected_day',
				'message', 'The reviewed workout can no longer be added on that date.'
			);
		end if;

		if exists (
			select 1
			from public.planned_workouts
			where plan_cycle_id = p_plan_id
				and user_id = p_user_id
				and workout_date = (p_workout_insert->>'workout_date')::date
		) then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The target date changed before the workout was added.'
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
			(p_workout_insert->>'workout_date')::date,
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
			and plan_cycle_id = p_plan_id
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
				select 1
				from public.workout_logs
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1
				from public.workout_result_assets
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1
				from public.workout_actual_metrics
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1
				from public.workout_comparisons
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
			or exists (
				select 1
				from public.workout_ai_insights
				where user_id = p_user_id and planned_workout_id = v_source.id
			)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be changed.'
			);
		end if;

		if p_mutation_kind = 'move' then
			if jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
				or (p_workout_update->>'workout_date')::date < p_current_date
				or (p_workout_update->>'workout_date')::date < v_plan.start_date
			then
				return jsonb_build_object(
					'ok', false,
					'reason', 'protected_day',
					'message', 'The reviewed workout can no longer move to that date.'
				);
			end if;

			if p_expected_target_workout is null
				or p_expected_target_workout = 'null'::jsonb
			then
				if exists (
					select 1
					from public.planned_workouts
					where plan_cycle_id = p_plan_id
						and user_id = p_user_id
						and workout_date = (p_workout_update->>'workout_date')::date
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
					and plan_cycle_id = p_plan_id
					and workout_date = (p_workout_update->>'workout_date')::date
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
						select 1
						from public.workout_logs
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1
						from public.workout_result_assets
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1
						from public.workout_actual_metrics
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1
						from public.workout_comparisons
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
					or exists (
						select 1
						from public.workout_ai_insights
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
					and plan_cycle_id = p_plan_id
				returning *
				into v_deleted_workout;
			end if;

			update public.planned_workouts
			set workout_date = (p_workout_update->>'workout_date')::date,
				weekday = p_workout_update->>'weekday',
				week_number = (p_workout_update->>'week_number')::integer
			where id = v_source.id
				and user_id = p_user_id
				and plan_cycle_id = p_plan_id
			returning *
			into v_mutated_workout;
		else
			delete from public.planned_workouts
			where id = v_source.id
				and user_id = p_user_id
				and plan_cycle_id = p_plan_id
			returning *
			into v_deleted_workout;
		end if;
	end if;

	update public.plan_cycles
	set end_date = (p_plan_update->>'end_date')::date,
		goal_metadata = nullif(p_plan_update->'goal_metadata', 'null'::jsonb),
		plan_preferences = nullif(p_plan_update->'plan_preferences', 'null'::jsonb)
	where id = p_plan_id
		and user_id = p_user_id
		and status = 'active'
	returning *
	into v_plan;

	if not found then
		raise exception 'Active plan changed during workout mutation persistence.';
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

create or replace function public.apply_reviewed_plan_persistence(
	p_user_id uuid,
	p_profile jsonb,
	p_plan jsonb,
	p_workouts jsonb,
	p_expected_active_plan_id uuid,
	p_expected_active_plan_updated_at timestamptz,
	p_expected_history jsonb,
	p_archive_goal_metadata jsonb,
	p_logs jsonb,
	p_evidence_relinks jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_current_plan public.plan_cycles%rowtype;
	v_inserted_plan public.plan_cycles%rowtype;
	v_archived_plan public.plan_cycles%rowtype;
	v_item jsonb;
	v_relink jsonb;
	v_actual_ids jsonb;
	v_payload_ids jsonb;
	v_row_count integer;
	v_is_replacement boolean := p_expected_active_plan_id is not null;
	v_source_log public.workout_logs%rowtype;
begin
	if jsonb_typeof(coalesce(p_profile, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_plan, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workouts, 'null'::jsonb)) <> 'array'
		or jsonb_typeof(coalesce(p_expected_history, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_logs, 'null'::jsonb)) <> 'array'
		or jsonb_typeof(coalesce(p_evidence_relinks, 'null'::jsonb)) <> 'array'
		or (
			v_is_replacement
			and jsonb_typeof(coalesce(p_archive_goal_metadata, 'null'::jsonb))
				not in ('object', 'null')
		)
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed plan persistence payload is invalid.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	if v_is_replacement then
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
				'message', 'The active plan changed before the reviewed replacement was saved.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(workout.id::text) order by workout.id), '[]'::jsonb)
		into v_actual_ids
		from public.planned_workouts workout
		where workout.user_id = p_user_id
			and workout.plan_cycle_id = p_expected_active_plan_id;

		if v_actual_ids is distinct from coalesce(p_expected_history->'workout_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan workouts changed before replacement persistence.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(log.id::text) order by log.id), '[]'::jsonb)
		into v_actual_ids
		from public.workout_logs log
		join public.planned_workouts workout on workout.id = log.planned_workout_id
		where log.user_id = p_user_id
			and workout.plan_cycle_id = p_expected_active_plan_id;

		if v_actual_ids is distinct from coalesce(p_expected_history->'log_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan logs changed before replacement persistence.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(asset.id::text) order by asset.id), '[]'::jsonb)
		into v_actual_ids
		from public.workout_result_assets asset
		join public.planned_workouts workout on workout.id = asset.planned_workout_id
		where asset.user_id = p_user_id
			and workout.plan_cycle_id = p_expected_active_plan_id;

		if v_actual_ids is distinct from coalesce(p_expected_history->'asset_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan result assets changed before replacement persistence.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(metric.id::text) order by metric.id), '[]'::jsonb)
		into v_actual_ids
		from public.workout_actual_metrics metric
		join public.planned_workouts workout on workout.id = metric.planned_workout_id
		where metric.user_id = p_user_id
			and workout.plan_cycle_id = p_expected_active_plan_id;

		if v_actual_ids is distinct from coalesce(p_expected_history->'metric_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan actual metrics changed before replacement persistence.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(comparison.id::text) order by comparison.id), '[]'::jsonb)
		into v_actual_ids
		from public.workout_comparisons comparison
		join public.planned_workouts workout on workout.id = comparison.planned_workout_id
		where comparison.user_id = p_user_id
			and workout.plan_cycle_id = p_expected_active_plan_id;

		if v_actual_ids
			is distinct from coalesce(p_expected_history->'comparison_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan comparisons changed before replacement persistence.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(insight.id::text) order by insight.id), '[]'::jsonb)
		into v_actual_ids
		from public.workout_ai_insights insight
		join public.planned_workouts workout on workout.id = insight.planned_workout_id
		where insight.user_id = p_user_id
			and workout.plan_cycle_id = p_expected_active_plan_id;

		if v_actual_ids is distinct from coalesce(p_expected_history->'insight_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan AI insights changed before replacement persistence.'
			);
		end if;

		select coalesce(
			jsonb_agg(to_jsonb(item.value->>'source_log_id') order by item.value->>'source_log_id'),
			'[]'::jsonb
		)
		into v_payload_ids
		from jsonb_array_elements(p_logs) item;

		if v_payload_ids is distinct from coalesce(p_expected_history->'log_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_input',
				'message', 'The reviewed replacement log carry-forward payload is incomplete.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(item.value->>'id') order by item.value->>'id'), '[]'::jsonb)
		into v_payload_ids
		from jsonb_array_elements(p_evidence_relinks) item
		where item.value->>'table' = 'workout_result_assets';

		if v_payload_ids is distinct from coalesce(p_expected_history->'asset_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_input',
				'message', 'The reviewed replacement result-asset payload is incomplete.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(item.value->>'id') order by item.value->>'id'), '[]'::jsonb)
		into v_payload_ids
		from jsonb_array_elements(p_evidence_relinks) item
		where item.value->>'table' = 'workout_actual_metrics';

		if v_payload_ids is distinct from coalesce(p_expected_history->'metric_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_input',
				'message', 'The reviewed replacement actual-metrics payload is incomplete.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(item.value->>'id') order by item.value->>'id'), '[]'::jsonb)
		into v_payload_ids
		from jsonb_array_elements(p_evidence_relinks) item
		where item.value->>'table' = 'workout_comparisons';

		if v_payload_ids is distinct from coalesce(p_expected_history->'comparison_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_input',
				'message', 'The reviewed replacement comparison payload is incomplete.'
			);
		end if;

		select coalesce(jsonb_agg(to_jsonb(item.value->>'id') order by item.value->>'id'), '[]'::jsonb)
		into v_payload_ids
		from jsonb_array_elements(p_evidence_relinks) item
		where item.value->>'table' = 'workout_ai_insights';

		if v_payload_ids is distinct from coalesce(p_expected_history->'insight_ids', '[]'::jsonb)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_input',
				'message', 'The reviewed replacement AI-insight payload is incomplete.'
			);
		end if;
	else
		if exists (
			select 1
			from public.plan_cycles
			where user_id = p_user_id and status = 'active'
		) then
			return jsonb_build_object(
				'ok', false,
				'reason', 'active_plan_exists',
				'message', 'An active plan already exists.'
			);
		end if;
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
		(case when v_is_replacement then 'archived' else 'active' end)::public.plan_cycle_status,
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
	returning *
	into v_inserted_plan;

	for v_item in
		select value from jsonb_array_elements(p_workouts)
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

	for v_item in
		select value from jsonb_array_elements(p_logs)
	loop
		select *
		into v_source_log
		from public.workout_logs
		where id = (v_item->>'source_log_id')::uuid
			and user_id = p_user_id
			and planned_workout_id = (v_item->>'source_workout_id')::uuid
		for update;

		if not found then
			raise exception 'Carry-forward source log changed during reviewed replacement persistence.';
		end if;

		insert into public.workout_logs (
			id,
			planned_workout_id,
			user_id,
			outcome,
			actual_distance_km,
			actual_duration_min,
			rpe,
			notes,
			intervals_completed,
			body_notes,
			logged_at,
			updated_at
		)
		values (
			(v_item->>'id')::uuid,
			(v_item->>'planned_workout_id')::uuid,
			p_user_id,
			v_source_log.outcome,
			v_source_log.actual_distance_km,
			v_source_log.actual_duration_min,
			v_source_log.rpe,
			v_source_log.notes,
			v_source_log.intervals_completed,
			v_source_log.body_notes,
			v_source_log.logged_at,
			v_source_log.updated_at
		);
	end loop;

	if v_is_replacement then
		update public.plan_cycles
		set status = 'archived',
			goal_metadata = nullif(p_archive_goal_metadata, 'null'::jsonb)
		where id = v_current_plan.id
			and user_id = p_user_id
			and status = 'active'
		returning *
		into v_archived_plan;

		if not found then
			raise exception 'Active plan changed during reviewed replacement persistence.';
		end if;

		for v_relink in
			select value from jsonb_array_elements(p_evidence_relinks)
		loop
			if v_relink->>'table' = 'workout_result_assets' then
				update public.workout_result_assets
				set planned_workout_id = (v_relink->>'target_workout_id')::uuid,
					workout_log_id = (v_relink->>'target_workout_log_id')::uuid
				where id = (v_relink->>'id')::uuid
					and user_id = p_user_id
					and planned_workout_id = (v_relink->>'source_workout_id')::uuid
					and workout_log_id
						is not distinct from (v_relink->>'source_workout_log_id')::uuid;
			elsif v_relink->>'table' = 'workout_actual_metrics' then
				update public.workout_actual_metrics
				set planned_workout_id = (v_relink->>'target_workout_id')::uuid,
					workout_log_id = (v_relink->>'target_workout_log_id')::uuid
				where id = (v_relink->>'id')::uuid
					and user_id = p_user_id
					and planned_workout_id = (v_relink->>'source_workout_id')::uuid
					and workout_log_id
						is not distinct from (v_relink->>'source_workout_log_id')::uuid;
			elsif v_relink->>'table' = 'workout_comparisons' then
				update public.workout_comparisons
				set planned_workout_id = (v_relink->>'target_workout_id')::uuid,
					difference_payload = v_relink->'target_difference_payload'
				where id = (v_relink->>'id')::uuid
					and user_id = p_user_id
					and planned_workout_id = (v_relink->>'source_workout_id')::uuid
					and difference_payload = v_relink->'source_difference_payload';
			elsif v_relink->>'table' = 'workout_ai_insights' then
				update public.workout_ai_insights
				set planned_workout_id = (v_relink->>'target_workout_id')::uuid
				where id = (v_relink->>'id')::uuid
					and user_id = p_user_id
					and planned_workout_id = (v_relink->>'source_workout_id')::uuid;
			else
				raise exception 'Unsupported carry-forward evidence table.';
			end if;

			get diagnostics v_row_count = row_count;
			if v_row_count <> 1 then
				raise exception 'Carry-forward evidence changed during reviewed replacement persistence.';
			end if;
		end loop;

		update public.plan_cycles
		set status = 'active'
		where id = v_inserted_plan.id
			and user_id = p_user_id
			and status = 'archived'
		returning *
		into v_inserted_plan;

		if not found then
			raise exception 'Reviewed replacement plan could not become active.';
		end if;
	end if;

	return jsonb_build_object(
		'ok', true,
		'plan_cycle', to_jsonb(v_inserted_plan),
		'archived_plan', case
			when v_archived_plan.id is null then null
			else to_jsonb(v_archived_plan)
		end,
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
	uuid,
	timestamptz,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_plan_persistence(
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
) to service_role;
