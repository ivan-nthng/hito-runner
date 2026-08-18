create or replace function public.apply_calendar_workout_mutation(
	p_user_id uuid,
	p_current_date date,
	p_mutation_kind text,
	p_expected_source_workout jsonb,
	p_expected_target_workout jsonb,
	p_workout_insert jsonb,
	p_workout_update jsonb,
	p_mutation_event jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_source public.planned_workouts%rowtype;
	v_target public.planned_workouts%rowtype;
	v_mutated public.planned_workouts%rowtype;
	v_deleted public.planned_workouts%rowtype;
	v_restored public.planned_workouts%rowtype;
	v_event public.calendar_workout_mutation_events%rowtype;
	v_latest_event public.calendar_workout_mutation_events%rowtype;
	v_matching_undo_event public.calendar_workout_mutation_events%rowtype;
	v_restore jsonb;
	v_restore_origin text;
	v_target_date date;
	v_source_date date;
	v_undo_expires_at timestamptz;
	v_event_kind text;
begin
	if p_mutation_kind not in ('add', 'clear', 'move')
		or jsonb_typeof(coalesce(p_mutation_event, 'null'::jsonb)) <> 'object'
		or p_mutation_event->>'mutation_source' <> 'calendar_workout_mutation_v1'
		or coalesce(p_mutation_event->>'review_payload_version', '') = ''
		or coalesce(p_mutation_event->>'review_checksum', '') !~ '^[0-9a-f]{64}$'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed Calendar workout mutation payload is invalid.'
		);
	end if;

	v_event_kind := p_mutation_event->>'mutation_kind';
	if (p_mutation_kind = 'add' and v_event_kind not in ('user_added_workout', 'user_copied_workout'))
		or (p_mutation_kind = 'clear' and v_event_kind <> 'user_cleared_workout')
		or (p_mutation_kind = 'move' and v_event_kind <> 'user_moved_workout')
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The Calendar mutation kind does not match its review evidence.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	if p_mutation_kind = 'add' then
		if jsonb_typeof(coalesce(p_workout_insert, 'null'::jsonb)) <> 'object'
			or coalesce(p_workout_insert->>'id', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or coalesce(p_workout_insert->>'origin_kind', '') not in ('manual', 'ai', 'file_import')
			or (p_workout_insert->>'workout_date')::date < p_current_date
			or p_mutation_event->>'planned_workout_id' <> p_workout_insert->>'id'
			or p_mutation_event->>'target_date' <> p_workout_insert->>'workout_date'
			or p_mutation_event->>'origin_kind' is distinct from p_workout_insert->>'origin_kind'
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'protected_day',
				'message', 'The reviewed workout can no longer be added on that date.'
			);
		end if;

		v_target_date := (p_workout_insert->>'workout_date')::date;

		if nullif(p_workout_insert->>'plan_cycle_id', '') is not null
			and not exists (
				select 1 from public.plan_cycles source
				where source.id = (p_workout_insert->>'plan_cycle_id')::uuid
					and source.user_id = p_user_id
			)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'unsafe_source_state',
				'message', 'The workout source provenance is not owned by this runner.'
			);
		end if;

		if p_expected_source_workout is not null and p_expected_source_workout <> 'null'::jsonb then
			if v_event_kind <> 'user_copied_workout' then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'A copied workout requires copy review evidence.');
			end if;

			if jsonb_typeof(p_expected_source_workout) <> 'object' then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'The copied workout fingerprint is invalid.');
			end if;

			select * into v_source
			from public.planned_workouts
			where id = (p_expected_source_workout->>'id')::uuid and user_id = p_user_id
			for share;

			if not found or to_jsonb(v_source) is distinct from p_expected_source_workout
				or v_source.workout_type = 'rest'
				or p_mutation_event->>'source_workout_id' <> v_source.id::text
				or p_mutation_event->>'source_workout_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'stale_review',
					'message', 'The copied source workout changed before Paste.');
			end if;

			if (p_workout_insert->>'plan_cycle_id') is distinct from v_source.plan_cycle_id::text
				or p_workout_insert->>'origin_kind' is distinct from v_source.origin_kind
				or (p_workout_insert->>'week_number')::integer is distinct from v_source.week_number
				or p_workout_insert->>'phase' is distinct from v_source.phase
				or (p_workout_insert->'steps') is distinct from v_source.steps
				or (p_workout_insert->'metric_mode') is distinct from v_source.metric_mode
				or (p_workout_insert->'goal_context') is distinct from v_source.goal_context
				or p_workout_insert->>'workout_type' is distinct from v_source.workout_type::text
				or p_workout_insert->>'source_workout_id' is distinct from v_source.source_workout_id
				or p_workout_insert->>'source_workout_type' is distinct from v_source.source_workout_type
				or p_workout_insert->>'workout_family' is distinct from v_source.workout_family
				or p_workout_insert->>'workout_identity' is distinct from v_source.workout_identity
				or p_workout_insert->>'calendar_icon_key' is distinct from v_source.calendar_icon_key
				or p_workout_insert->>'title' is distinct from v_source.title
				or p_workout_insert->>'notes' is distinct from v_source.notes
				or p_workout_insert->>'planned_rpe' is distinct from v_source.planned_rpe::text
				or p_workout_insert->>'estimated_fatigue' is distinct from v_source.estimated_fatigue
				or p_workout_insert->>'recovery_priority' is distinct from v_source.recovery_priority
			then
				return jsonb_build_object('ok', false, 'reason', 'unsafe_source_state',
					'message', 'Paste must copy only the reviewed workout prescription.');
			end if;
		elsif v_event_kind <> 'user_added_workout'
			or p_mutation_event ? 'source_workout_id'
			or p_mutation_event ? 'source_workout_date'
		then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'A direct Calendar Add cannot claim copied-source evidence.');
		end if;

		if exists (
			select 1 from public.planned_workouts
			where user_id = p_user_id and workout_date = v_target_date
		) then
			return jsonb_build_object('ok', false, 'reason', 'stale_review',
				'message', 'Paste requires a truly empty date; the existing row is unchanged.');
		end if;

		insert into public.planned_workouts (
			id, plan_cycle_id, user_id, origin_kind, workout_date, weekday, week_number,
			phase, workout_type, source_workout_id, source_workout_type, workout_family,
			workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes,
			planned_rpe, estimated_fatigue, recovery_priority, steps, display_order
		) values (
			(p_workout_insert->>'id')::uuid,
			nullif(p_workout_insert->>'plan_cycle_id', '')::uuid,
			p_user_id,
			p_workout_insert->>'origin_kind',
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
		) returning * into v_mutated;

	else
		if jsonb_typeof(coalesce(p_expected_source_workout, 'null'::jsonb)) <> 'object' then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'The reviewed source workout fingerprint is invalid.');
		end if;

		select * into v_source
		from public.planned_workouts
		where id = (p_expected_source_workout->>'id')::uuid and user_id = p_user_id
		for update;

		if not found or to_jsonb(v_source) is distinct from p_expected_source_workout then
			return jsonb_build_object('ok', false, 'reason', 'stale_review',
				'message', 'The source workout changed before the mutation was saved.');
		end if;

		if p_mutation_event->>'planned_workout_id' <> v_source.id::text then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'The review evidence does not identify the locked workout.');
		end if;

		if p_mutation_event->>'origin_kind' is distinct from v_source.origin_kind
			or p_mutation_event->>'previous_workout_date' <> v_source.workout_date::text
		then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'The review evidence does not match the locked workout origin and date.');
		end if;

		if v_source.workout_type = 'rest'
			or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved or cleared.');
		end if;

		if p_mutation_kind = 'clear' then
			if v_source.workout_date < p_current_date
				or p_mutation_event->>'target_workout_id' <> v_source.id::text
				or p_mutation_event->>'target_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'Past workouts and stale review evidence cannot be cleared.');
			end if;

			delete from public.planned_workouts
			where id = v_source.id and user_id = p_user_id
			returning * into v_deleted;
		else
			if jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
				or p_workout_update ? 'restore_displaced_rest'
				or (p_workout_update->>'workout_date')::date < p_current_date
				or (p_workout_update->>'week_number')::integer <> v_source.week_number
			then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'The reviewed workout can no longer move to that date.');
			end if;

			v_target_date := (p_workout_update->>'workout_date')::date;
			v_source_date := v_source.workout_date;

			if p_mutation_event->>'source_workout_id' <> v_source.id::text
				or p_mutation_event->>'source_workout_date' <> v_source_date::text
				or p_mutation_event->>'target_date' <> v_target_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'The move review evidence does not match the locked Calendar dates.');
			end if;

			select * into v_latest_event
			from public.calendar_workout_mutation_events
			where user_id = p_user_id and planned_workout_id = v_source.id
			order by id desc limit 1;

			select * into v_matching_undo_event
			from public.calendar_workout_mutation_events
			where user_id = p_user_id
				and planned_workout_id = v_source.id
				and mutation_kind = 'user_moved_workout'
				and source_workout_date = v_target_date
				and target_date = v_source_date
				and undo_of_event_id is null
				and jsonb_typeof(displaced_workout) = 'object'
			order by id desc limit 1;

			if v_matching_undo_event.id is not null then
				if v_latest_event.id is distinct from v_matching_undo_event.id then
					return jsonb_build_object('ok', false, 'reason', 'stale_review',
						'message', 'The displaced workout Undo state is no longer the latest Calendar change.');
				end if;
				if v_matching_undo_event.undo_expires_at is null
					or v_matching_undo_event.undo_expires_at <= clock_timestamp()
				then
					return jsonb_build_object('ok', false, 'reason', 'undo_expired',
						'message', 'The displaced workout Undo window expired without changing the Calendar.');
				end if;
				if p_expected_target_workout is not null and p_expected_target_workout <> 'null'::jsonb then
					return jsonb_build_object('ok', false, 'reason', 'unsafe_target_state',
						'message', 'A displaced workout can only be restored onto its empty source date.');
				end if;
				v_restore := v_matching_undo_event.displaced_workout;
			end if;

			if p_expected_target_workout is null or p_expected_target_workout = 'null'::jsonb then
				if p_mutation_event->>'target_workout_id' <> v_source.id::text then
					return jsonb_build_object('ok', false, 'reason', 'invalid_input',
						'message', 'The move review evidence does not identify the empty target operation.');
				end if;

				if exists (
					select 1 from public.planned_workouts
					where user_id = p_user_id and workout_date = v_target_date and id <> v_source.id
				) then
					return jsonb_build_object('ok', false, 'reason', 'stale_review',
						'message', 'The target date changed before the workout was moved.');
				end if;
			else
				if v_restore is not null or jsonb_typeof(p_expected_target_workout) <> 'object' then
					return jsonb_build_object('ok', false, 'reason', 'unsafe_target_state',
						'message', 'The reviewed replacement target is invalid.');
				end if;

				select * into v_target
				from public.planned_workouts
				where id = (p_expected_target_workout->>'id')::uuid
					and user_id = p_user_id and workout_date = v_target_date
				for update;

				if not found or to_jsonb(v_target) is distinct from p_expected_target_workout then
					return jsonb_build_object('ok', false, 'reason', 'stale_review',
						'message', 'The target workout changed before the move was saved.');
				end if;

				if p_mutation_event->>'target_workout_id' <> v_target.id::text then
					return jsonb_build_object('ok', false, 'reason', 'invalid_input',
						'message', 'The move review evidence does not identify the locked target row.');
				end if;

				if v_target.workout_date <= p_current_date
					or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_target.id)
				then
					return jsonb_build_object('ok', false, 'reason', 'protected_day',
						'message', 'The target workout became protected before the move was saved.');
				end if;

				delete from public.planned_workouts where id = v_target.id and user_id = p_user_id
				returning * into v_deleted;
				v_restore := to_jsonb(v_target);
				v_undo_expires_at := clock_timestamp() + interval '45 seconds';
			end if;

			update public.planned_workouts
			set workout_date = v_target_date,
				weekday = p_workout_update->>'weekday'
			where id = v_source.id and user_id = p_user_id
			returning * into v_mutated;

			if v_matching_undo_event.id is not null then
				if jsonb_typeof(v_restore) <> 'object'
					or v_restore->>'user_id' <> p_user_id::text
					or v_restore->>'workout_date' <> v_source_date::text
					or coalesce(v_restore->>'workout_type', '') not in (
						'easy', 'steady_or_easy', 'rest', 'long_run', 'quality'
					)
					or coalesce(v_restore->>'id', '')
						!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
					or exists (select 1 from public.planned_workouts where id = (v_restore->>'id')::uuid)
				then
					raise exception 'Authoritative displaced workout state failed fail-closed restoration.';
				end if;

				v_restore_origin := v_restore->>'origin_kind';
				if v_restore_origin not in ('manual', 'ai', 'file_import') then
					raise exception 'Authoritative displaced workout origin is invalid.';
				end if;

				if nullif(v_restore->>'plan_cycle_id', '') is not null
					and not exists (
						select 1 from public.plan_cycles source
						where source.id = (v_restore->>'plan_cycle_id')::uuid
							and source.user_id = p_user_id
					)
				then
					raise exception 'Authoritative displaced workout provenance is no longer owned.';
				end if;

				insert into public.planned_workouts (
					id, plan_cycle_id, user_id, origin_kind, workout_date, weekday, week_number,
					phase, workout_type, source_workout_id, source_workout_type, workout_family,
					workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes,
					planned_rpe, estimated_fatigue, recovery_priority, steps, display_order, created_at
				) values (
					(v_restore->>'id')::uuid,
					nullif(v_restore->>'plan_cycle_id', '')::uuid,
					p_user_id,
					v_restore_origin,
					(v_restore->>'workout_date')::date,
					v_restore->>'weekday',
					(v_restore->>'week_number')::integer,
					v_restore->>'phase',
					(v_restore->>'workout_type')::public.workout_type,
					v_restore->>'source_workout_id',
					v_restore->>'source_workout_type',
					v_restore->>'workout_family',
					v_restore->>'workout_identity',
					v_restore->>'calendar_icon_key',
					nullif(v_restore->'goal_context', 'null'::jsonb),
					nullif(v_restore->'metric_mode', 'null'::jsonb),
					v_restore->>'title',
					v_restore->>'notes',
					(v_restore->>'planned_rpe')::smallint,
					v_restore->>'estimated_fatigue',
					v_restore->>'recovery_priority',
					v_restore->'steps',
					(v_restore->>'display_order')::integer,
					(v_restore->>'created_at')::timestamptz
				) returning * into v_restored;
			end if;
		end if;
	end if;

	insert into public.calendar_workout_mutation_events (
		user_id, mutation_kind, planned_workout_id, source_workout_id, target_workout_id,
		source_workout_date, target_date, before_workout, after_workout, displaced_workout,
		review_payload_version, review_checksum, mutation_payload_version, mutation_checksum,
		event_payload, occurred_at, undo_expires_at, undo_of_event_id
	) values (
		p_user_id,
		v_event_kind,
		coalesce(v_mutated.id, v_deleted.id),
		case
			when p_mutation_kind = 'add' and v_event_kind <> 'user_copied_workout' then null
			else v_source.id
		end,
		coalesce(v_deleted.id, v_mutated.id),
		coalesce(v_source_date, v_source.workout_date),
		coalesce(v_target_date, v_mutated.workout_date, v_deleted.workout_date),
		case
			when p_mutation_kind = 'add' or v_source.id is null then null
			else to_jsonb(v_source)
		end,
		case when v_mutated.id is null then null else to_jsonb(v_mutated) end,
		case
			when p_mutation_kind = 'move'
				and v_matching_undo_event.id is null
				and v_deleted.id is not null
				then to_jsonb(v_deleted)
			else null
		end,
		p_mutation_event->>'review_payload_version',
		p_mutation_event->>'review_checksum',
		p_mutation_event->>'mutation_payload_version',
		nullif(p_mutation_event->>'mutation_checksum', ''),
		p_mutation_event,
		clock_timestamp(),
		v_undo_expires_at,
		case when v_matching_undo_event.id is null then null else v_matching_undo_event.id end
	) returning * into v_event;

	return jsonb_build_object(
		'ok', true,
		'mutation_kind', p_mutation_kind,
		'mutated_workout', case when v_mutated.id is null then null else to_jsonb(v_mutated) end,
		'deleted_workout', case when v_deleted.id is null then null else to_jsonb(v_deleted) end,
		'restored_workout', case when v_restored.id is null then null else to_jsonb(v_restored) end,
		'mutation_event', to_jsonb(v_event),
		'undo_expires_at', v_event.undo_expires_at
	);
end;
$$;

revoke execute on function public.apply_calendar_workout_mutation(
	uuid, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.apply_calendar_workout_mutation(
	uuid, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
) to service_role;
