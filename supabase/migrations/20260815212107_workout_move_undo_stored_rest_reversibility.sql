create or replace function public.apply_calendar_workout_mutation(
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
	v_restored_workout public.planned_workouts%rowtype;
	v_restored_plan public.plan_cycles%rowtype;
	v_source_fingerprint jsonb;
	v_target_fingerprint jsonb;
	v_restore_displaced_rest jsonb;
	v_restore_payload jsonb;
	v_latest_edit jsonb;
	v_matching_rest_edit jsonb;
	v_next_edit jsonb;
	v_target_date date;
	v_source_original_date date;
begin
	if p_mutation_kind not in ('add', 'clear', 'move')
		or jsonb_typeof(coalesce(p_plan_update, 'null'::jsonb)) <> 'object'
		or (
			p_mutation_kind = 'move'
			and (
				not (p_plan_update ? 'end_date')
				or jsonb_typeof(coalesce(p_plan_update->'goal_metadata', 'null'::jsonb)) <> 'object'
				or jsonb_typeof(coalesce(p_plan_update->'plan_preferences', 'null'::jsonb)) <> 'object'
			)
		)
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed calendar workout mutation payload is invalid.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select *
	into v_plan
	from public.plan_cycles
	where id = p_plan_id
		and user_id = p_user_id
		and saved_plan_payload is null
	for update;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The saved workout provenance is no longer available.'
		);
	end if;

	if p_mutation_kind = 'move'
		and v_plan.updated_at is distinct from p_expected_plan_updated_at
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The workout provenance changed before the move was saved.'
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
			and plan_cycle_id = p_plan_id
		for update;

		if not found then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The source workout changed before the mutation was saved.'
			);
		end if;

		if p_mutation_kind = 'move' then
			v_source_fingerprint := to_jsonb(v_source);
		else
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
		end if;

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
			or exists (
				select 1 from public.runner_activity_planned_workout_matches
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
			v_source_original_date := v_source.workout_date;
			v_restore_displaced_rest := nullif(
				p_workout_update->'restore_displaced_rest',
				'null'::jsonb
			);
			v_latest_edit := coalesce(v_plan.goal_metadata->'active_plan_user_edit', '{}'::jsonb);
			v_next_edit := coalesce(
				p_plan_update#>'{goal_metadata,active_plan_user_edit}',
				'{}'::jsonb
			);

			if jsonb_typeof(v_next_edit) <> 'object'
				or v_next_edit->>'mutation_kind' <> 'user_moved_workout'
				or v_next_edit->>'planned_workout_id' <> v_source.id::text
				or v_next_edit->>'source_workout_date' <> v_source_original_date::text
				or v_next_edit->>'target_date' <> v_target_date::text
			then
				return jsonb_build_object(
					'ok', false,
					'reason', 'unsafe_target_state',
					'message', 'The reviewed move event does not match the locked workout state.'
				);
			end if;

			select history.item
			into v_matching_rest_edit
			from jsonb_array_elements(
				case
					when jsonb_typeof(v_plan.goal_metadata->'active_plan_user_edits') = 'array'
						then v_plan.goal_metadata->'active_plan_user_edits'
					else '[]'::jsonb
				end
			) with ordinality as history(item, ordinal)
			where history.item->>'mutation_kind' = 'user_moved_workout'
				and history.item->>'planned_workout_id' = v_source.id::text
				and history.item->>'source_workout_date' = v_target_date::text
				and history.item->>'target_date' = v_source_original_date::text
				and history.item#>>'{target_replacement,workoutType}' = 'rest'
			order by history.ordinal desc
			limit 1;

			if v_matching_rest_edit is not null
				and v_matching_rest_edit is distinct from v_latest_edit
			then
				if coalesce(v_matching_rest_edit->>'undo_expires_at', '')
					~ '^\d{4}-\d{2}-\d{2}T.*Z$'
					and (v_matching_rest_edit->>'undo_expires_at')::timestamptz <= clock_timestamp()
				then
					return jsonb_build_object(
						'ok', false,
						'reason', 'undo_expired',
						'message', 'The stored Rest Undo window expired without changing the Calendar.'
					);
				end if;

				return jsonb_build_object(
					'ok', false,
					'reason', 'stale_review',
					'message', 'The stored Rest Undo state is no longer the latest Calendar change.'
				);
			end if;

			if v_matching_rest_edit is not null and v_restore_displaced_rest is null then
				return jsonb_build_object(
					'ok', false,
					'reason', 'unsafe_target_state',
					'message', 'The reverse move omitted the authoritative displaced Rest state.'
				);
			end if;

			if v_matching_rest_edit is null and v_restore_displaced_rest is not null then
				return jsonb_build_object(
					'ok', false,
					'reason', 'unsafe_target_state',
					'message', 'The displaced Rest state has no matching authoritative move event.'
				);
			end if;

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
				if v_restore_displaced_rest is not null then
					return jsonb_build_object(
						'ok', false,
						'reason', 'unsafe_target_state',
						'message', 'A displaced Rest can only be restored onto an empty reviewed target.'
					);
				end if;

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

				v_target_fingerprint := to_jsonb(v_target);

				if v_target_fingerprint is distinct from p_expected_target_workout then
					return jsonb_build_object(
						'ok', false,
						'reason', 'stale_review',
						'message', 'The target workout changed before the move was saved.'
					);
				end if;

				if not exists (
					select 1
					from public.plan_cycles provenance
					where provenance.id = v_target.plan_cycle_id
						and provenance.user_id = p_user_id
				) then
					return jsonb_build_object(
						'ok', false,
						'reason', 'unsafe_target_state',
						'message', 'The replacement workout provenance is not owned by this runner.'
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
					or exists (
						select 1 from public.runner_activity_planned_workout_matches
						where user_id = p_user_id and planned_workout_id = v_target.id
					)
				then
					return jsonb_build_object(
						'ok', false,
						'reason', 'protected_day',
						'message', 'The target workout became protected before the move was saved.'
					);
				end if;

				if v_target.workout_type = 'rest' then
					if jsonb_typeof(v_next_edit) <> 'object'
						or v_next_edit->>'mutation_kind' <> 'user_moved_workout'
						or v_next_edit->>'planned_workout_id' <> v_source.id::text
						or v_next_edit->>'source_workout_date' <> v_source_original_date::text
						or v_next_edit->>'target_date' <> v_target_date::text
						or v_next_edit#>>'{target_replacement,workoutType}' <> 'rest'
						or v_next_edit->'previous_workout' is distinct from to_jsonb(v_target)
						or coalesce(v_next_edit->>'undo_expires_at', '')
							!~ '^\d{4}-\d{2}-\d{2}T.*Z$'
					then
						return jsonb_build_object(
							'ok', false,
							'reason', 'unsafe_target_state',
							'message', 'The stored Rest replacement event is incomplete or stale.'
						);
					end if;

					if (v_next_edit->>'undo_expires_at')::timestamptz <= clock_timestamp()
						or (v_next_edit->>'undo_expires_at')::timestamptz
							> clock_timestamp() + interval '45 seconds'
					then
						return jsonb_build_object(
							'ok', false,
							'reason', 'undo_expired',
							'message', 'The stored Rest Undo window is not valid for this move.'
						);
					end if;
				end if;

				delete from public.planned_workouts
				where id = v_target.id
					and user_id = p_user_id
				returning *
				into v_deleted_workout;
			end if;

			if v_restore_displaced_rest is not null then
				v_restore_payload := v_restore_displaced_rest - 'undo_expires_at';

				if jsonb_typeof(v_restore_displaced_rest) <> 'object'
					or coalesce(v_restore_displaced_rest->>'id', '')
						!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
					or coalesce(v_restore_displaced_rest->>'plan_cycle_id', '')
						!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
					or v_restore_displaced_rest->>'id' = v_source.id::text
					or v_restore_displaced_rest->>'user_id' <> p_user_id::text
					or v_restore_displaced_rest->>'workout_date' <> v_source_original_date::text
					or v_restore_displaced_rest->>'workout_type' <> 'rest'
					or v_matching_rest_edit is null
					or v_matching_rest_edit is distinct from v_latest_edit
					or v_matching_rest_edit->'previous_workout' is distinct from v_restore_payload
					or v_matching_rest_edit->>'undo_expires_at'
						is distinct from v_restore_displaced_rest->>'undo_expires_at'
				then
					return jsonb_build_object(
						'ok', false,
						'reason', 'unsafe_target_state',
						'message', 'The displaced Rest state does not match the authoritative reverse move.'
					);
				end if;

				if coalesce(v_restore_displaced_rest->>'undo_expires_at', '')
					!~ '^\d{4}-\d{2}-\d{2}T.*Z$'
				then
					return jsonb_build_object(
						'ok', false,
						'reason', 'unsafe_target_state',
						'message', 'The displaced Rest Undo expiry is invalid.'
					);
				end if;

				if (v_restore_displaced_rest->>'undo_expires_at')::timestamptz <= clock_timestamp() then
					return jsonb_build_object(
						'ok', false,
						'reason', 'undo_expired',
						'message', 'The stored Rest Undo window expired without changing the Calendar.'
					);
				end if;

				select *
				into v_restored_plan
				from public.plan_cycles
				where id = (v_restore_displaced_rest->>'plan_cycle_id')::uuid
					and user_id = p_user_id
				for share;

				if not found then
					return jsonb_build_object(
						'ok', false,
						'reason', 'unsafe_target_state',
						'message', 'The displaced Rest provenance is no longer owned by this runner.'
					);
				end if;

				if exists (
					select 1
					from public.planned_workouts
					where id = (v_restore_displaced_rest->>'id')::uuid
				) then
					return jsonb_build_object(
						'ok', false,
						'reason', 'stale_review',
						'message', 'The displaced Rest identity is no longer available for Undo.'
					);
				end if;
			end if;

			update public.planned_workouts
			set workout_date = v_target_date,
				weekday = p_workout_update->>'weekday',
				week_number = (p_workout_update->>'week_number')::integer
			where id = v_source.id
				and user_id = p_user_id
				and plan_cycle_id = p_plan_id
			returning *
			into v_mutated_workout;

			if v_restore_displaced_rest is not null then
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
					display_order,
					created_at
				)
				values (
					(v_restore_displaced_rest->>'id')::uuid,
					(v_restore_displaced_rest->>'plan_cycle_id')::uuid,
					p_user_id,
					(v_restore_displaced_rest->>'workout_date')::date,
					v_restore_displaced_rest->>'weekday',
					(v_restore_displaced_rest->>'week_number')::integer,
					v_restore_displaced_rest->>'phase',
					'rest'::public.workout_type,
					v_restore_displaced_rest->>'source_workout_id',
					v_restore_displaced_rest->>'source_workout_type',
					v_restore_displaced_rest->>'workout_family',
					v_restore_displaced_rest->>'workout_identity',
					v_restore_displaced_rest->>'calendar_icon_key',
					nullif(v_restore_displaced_rest->'goal_context', 'null'::jsonb),
					nullif(v_restore_displaced_rest->'metric_mode', 'null'::jsonb),
					v_restore_displaced_rest->>'title',
					v_restore_displaced_rest->>'notes',
					(v_restore_displaced_rest->>'planned_rpe')::smallint,
					v_restore_displaced_rest->>'estimated_fatigue',
					v_restore_displaced_rest->>'recovery_priority',
					v_restore_displaced_rest->'steps',
					(v_restore_displaced_rest->>'display_order')::integer,
					(v_restore_displaced_rest->>'created_at')::timestamptz
				)
				returning *
				into v_restored_workout;
			end if;

			update public.plan_cycles
			set end_date = (p_plan_update->>'end_date')::date,
				goal_metadata = nullif(p_plan_update->'goal_metadata', 'null'::jsonb),
				plan_preferences = nullif(p_plan_update->'plan_preferences', 'null'::jsonb)
			where id = p_plan_id
				and user_id = p_user_id
				and saved_plan_payload is null
			returning *
			into v_plan;

			if not found then
				raise exception 'Workout provenance changed during move persistence.';
			end if;
		else
			delete from public.planned_workouts
			where id = v_source.id
				and user_id = p_user_id
				and plan_cycle_id = p_plan_id
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
		end,
		'restored_workout', case
			when v_restored_workout.id is null then null
			else to_jsonb(v_restored_workout)
		end
	);
end;
$$;

revoke execute on function public.apply_calendar_workout_mutation(
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

grant execute on function public.apply_calendar_workout_mutation(
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
