alter table public.adaptive_training_block_confirmations
	drop constraint adaptive_training_block_confirmations_owner_predecessor_fkey,
	add constraint adaptive_training_block_confirmations_owner_predecessor_fkey
		foreign key (user_id, predecessor_confirmation_id)
		references public.adaptive_training_block_confirmations (user_id, id)
		on delete cascade;

create function public.apply_adaptive_continuation_detailed_block_materialization(
	p_user_id uuid,
	p_current_date date,
	p_blueprint_id uuid,
	p_blueprint_version integer,
	p_blueprint_sha256 text,
	p_predecessor_confirmation_id uuid,
	p_candidate_id uuid,
	p_candidate_version integer,
	p_candidate_sha256 text,
	p_input_fingerprint_sha256 text,
	p_expected_candidate_content jsonb,
	p_expected_input_snapshot jsonb,
	p_review_seal_sha256 text,
	p_workout_inserts jsonb,
	p_mutation_events jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_blueprint public.adaptive_training_blueprint_versions%rowtype;
	v_predecessor public.adaptive_training_block_confirmations%rowtype;
	v_candidate public.adaptive_training_detailed_candidates%rowtype;
	v_latest_input public.adaptive_training_continuation_input_revisions%rowtype;
	v_profile public.runner_profiles%rowtype;
	v_confirmation public.adaptive_training_block_confirmations%rowtype;
	v_next_input public.adaptive_training_continuation_input_revisions%rowtype;
	v_candidate_workouts jsonb;
	v_reference jsonb;
	v_insert jsonb;
	v_event jsonb;
	v_result jsonb;
	v_inserted_workouts jsonb := '[]'::jsonb;
	v_mutation_events jsonb := '[]'::jsonb;
	v_calendar_workout_ids uuid[];
	v_block_mode text;
	v_target_date date;
	v_interval_start date;
	v_interval_end date;
	v_workout_count integer;
	v_preference jsonb;
	v_first_projection_date date;
	v_second_projection_date date;
	v_remaining_preferences jsonb := '[]'::jsonb;
	v_consumed_preference_count integer := 0;
	v_next_input_sha256 text;
begin
	if (select auth.role()) <> 'service_role' then
		return jsonb_build_object(
			'ok', false,
			'reason', 'ownership_failure',
			'message', 'Adaptive continuation confirmation requires the server owner.'
		);
	end if;

	if p_user_id is null
		or p_current_date is null
		or p_blueprint_id is null
		or p_predecessor_confirmation_id is null
		or p_candidate_id is null
		or p_blueprint_version <= 0
		or p_candidate_version <= 0
		or coalesce(p_blueprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or coalesce(p_candidate_sha256, '') !~ '^[0-9a-f]{64}$'
		or coalesce(p_input_fingerprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or coalesce(p_review_seal_sha256, '') !~ '^[0-9a-f]{64}$'
		or jsonb_typeof(coalesce(p_expected_candidate_content, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_expected_input_snapshot, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workout_inserts, 'null'::jsonb)) <> 'array'
		or jsonb_typeof(coalesce(p_mutation_events, 'null'::jsonb)) <> 'array'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The adaptive continuation confirmation payload is invalid.'
		);
	end if;

	v_workout_count := jsonb_array_length(p_workout_inserts);
	if v_workout_count = 0 or jsonb_array_length(p_mutation_events) <> v_workout_count then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_candidate',
			'message', 'The reviewed continuation must contain one audit event per workout.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
	perform pg_advisory_xact_lock(
		hashtextextended(p_user_id::text || ':' || p_blueprint_id::text, 0)
	);

	select * into v_blueprint
	from public.adaptive_training_blueprint_versions blueprint
	where blueprint.id = p_blueprint_id
		and blueprint.user_id = p_user_id
	for share;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'ownership_failure',
			'message', 'The reviewed adaptive Blueprint was not found for this runner.'
		);
	end if;
	if v_blueprint.version is distinct from p_blueprint_version
		or v_blueprint.content_sha256 is distinct from p_blueprint_sha256
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The adaptive Blueprint version changed after review.'
		);
	end if;

	select * into v_predecessor
	from public.adaptive_training_block_confirmations confirmation
	where confirmation.id = p_predecessor_confirmation_id
		and confirmation.user_id = p_user_id
		and confirmation.blueprint_id = p_blueprint_id
		and not exists (
			select 1
			from public.adaptive_training_block_confirmations child
			where child.user_id = p_user_id
				and child.blueprint_id = p_blueprint_id
				and child.predecessor_confirmation_id = confirmation.id
		)
	for share;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The continuation predecessor is no longer the current confirmed horizon.'
		);
	end if;

	select * into v_candidate
	from public.adaptive_training_detailed_candidates candidate
	where candidate.id = p_candidate_id
		and candidate.user_id = p_user_id
		and candidate.blueprint_id = p_blueprint_id
	for share;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'ownership_failure',
			'message', 'The reviewed continuation candidate was not found for this runner.'
		);
	end if;
	if v_candidate.version is distinct from p_candidate_version
		or v_candidate.candidate_sha256 is distinct from p_candidate_sha256
		or v_candidate.input_fingerprint_sha256 is distinct from p_input_fingerprint_sha256
		or v_candidate.candidate_content is distinct from p_expected_candidate_content
		or v_candidate.input_snapshot is distinct from p_expected_input_snapshot
		or v_candidate.blueprint_id is distinct from p_blueprint_id
		or v_candidate.confirmation_lineage->>'kind'
			is distinct from 'continuation_detailed_block_candidate'
		or v_candidate.confirmation_lineage->>'state' is distinct from 'unconfirmed'
		or v_candidate.confirmation_lineage->>'predecessorConfirmationId'
			is distinct from p_predecessor_confirmation_id::text
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The continuation candidate no longer matches its sealed review.'
		);
	end if;
	if exists (
		select 1
		from public.adaptive_training_block_confirmations confirmation
		where confirmation.user_id = p_user_id
			and confirmation.detailed_candidate_id = p_candidate_id
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'This continuation candidate was already confirmed.'
		);
	end if;

	v_candidate_workouts := v_candidate.candidate_content->'workoutDocuments';
	v_block_mode := v_candidate.candidate_content->>'blockMode';
	v_interval_start := v_candidate.interval_start_date;
	v_interval_end := v_candidate.interval_end_date;
	begin
		v_target_date := (v_blueprint.blueprint_content->>'selectedTargetDate')::date;
	exception when others then
		v_target_date := null;
	end;

	if jsonb_typeof(coalesce(v_candidate_workouts, 'null'::jsonb)) <> 'array'
		or jsonb_array_length(v_candidate_workouts) <> v_workout_count
		or v_candidate.candidate_content#>>'{interval,startDate}'
			is distinct from v_interval_start::text
		or v_candidate.candidate_content#>>'{interval,endDate}'
			is distinct from v_interval_end::text
		or v_candidate.input_snapshot#>>'{blueprint,id}' is distinct from p_blueprint_id::text
		or (v_candidate.input_snapshot#>>'{blueprint,version}')::integer
			is distinct from p_blueprint_version
		or v_candidate.input_snapshot#>>'{blueprint,sha256}' is distinct from p_blueprint_sha256
		or v_candidate.input_snapshot#>>'{confirmation,id}'
			is distinct from p_predecessor_confirmation_id::text
		or v_candidate.input_snapshot#>>'{confirmation,candidateId}'
			is distinct from v_predecessor.detailed_candidate_id::text
		or v_candidate.input_snapshot#>>'{confirmation,candidateSha256}'
			is distinct from v_predecessor.candidate_sha256
		or v_interval_start is distinct from v_predecessor.interval_end_date + 1
		or v_target_date is null
		or v_interval_end > v_target_date
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_candidate',
			'message', 'The continuation candidate does not bind the exact next confirmed horizon.'
		);
	end if;

	if (v_block_mode = 'normal_four_week' and v_interval_end <> v_interval_start + 27)
		or (
			v_block_mode = 'target_taper_boundary'
			and (
				v_interval_end <> v_target_date
				or v_interval_end - v_interval_start not between 0 and 13
			)
		)
		or (
			v_block_mode = 'resolved_interruption_bridge'
			and (
				v_interval_end <> v_interval_start + 13
				or exists (
					select 1
					from public.adaptive_training_block_confirmations confirmation
					where confirmation.user_id = p_user_id
						and confirmation.blueprint_id = p_blueprint_id
						and confirmation.block_mode = 'resolved_interruption_bridge'
				)
			)
		)
		or v_block_mode not in (
			'normal_four_week',
			'target_taper_boundary',
			'resolved_interruption_bridge'
		)
		or (v_candidate.confirmation_lineage->>'blockMode') is distinct from v_block_mode
		or coalesce((v_candidate.confirmation_lineage->>'bridgeExceptionUsed')::boolean, false)
			is distinct from (v_block_mode = 'resolved_interruption_bridge')
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_candidate',
			'message', 'The continuation block mode or target boundary is invalid.'
		);
	end if;

	select * into v_latest_input
	from public.adaptive_training_continuation_input_revisions input_revision
	where input_revision.user_id = p_user_id
		and input_revision.blueprint_id = p_blueprint_id
	order by input_revision.revision desc
	limit 1
	for share;

	if not found
		or v_latest_input.id::text
			is distinct from v_candidate.input_snapshot#>>'{continuationInput,id}'
		or v_latest_input.revision
			is distinct from (v_candidate.input_snapshot#>>'{continuationInput,revision}')::integer
		or v_latest_input.content_sha256
			is distinct from v_candidate.input_snapshot#>>'{continuationInput,sha256}'
		or v_latest_input.active_projection_preferences
			is distinct from v_candidate.input_snapshot#>'{continuationInput,activeProjectionPreferences}'
		or v_latest_input.horizon_check_in
			is distinct from v_candidate.input_snapshot#>'{continuationInput,horizonCheckIn}'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The continuation preferences or check-in changed after review.'
		);
	end if;

	select * into v_profile
	from public.runner_profiles profile
	where profile.user_id = p_user_id
	for share;
	if not found
		or coalesce(
			v_profile.training_preferences,
			'{"blocked_days":[],"preferred_long_run_day":null,"max_running_days_per_week":null}'::jsonb
		) is distinct from v_candidate.input_snapshot#>'{normalizedProfileConstraints,trainingPreferences}'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The normalized runner constraints changed after review.'
		);
	end if;

	if coalesce(v_candidate.input_snapshot#>>'{calendar,calendarOutcomeFingerprint}', '')
		!~ '^[0-9a-f]{64}$'
		or coalesce(v_candidate.input_snapshot#>>'{evidence,evidenceRevisionFingerprint}', '')
		!~ '^[0-9a-f]{64}$'
		or coalesce(
			v_candidate.input_snapshot#>>'{targetIntervalOccupancy,calendarOccupancyFingerprint}',
			''
		) !~ '^[0-9a-f]{64}$'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_candidate',
			'message', 'The continuation candidate is missing a frozen factual fingerprint.'
		);
	end if;

	perform 1
	from public.planned_workouts workout
	where workout.user_id = p_user_id
		and workout.id = any(v_predecessor.calendar_workout_ids)
	for share;
	perform 1
	from public.workout_logs log
	where log.user_id = p_user_id
		and log.planned_workout_id = any(v_predecessor.calendar_workout_ids)
	for share;
	perform 1
	from public.workout_result_assets asset
	where asset.user_id = p_user_id
		and asset.planned_workout_id = any(v_predecessor.calendar_workout_ids)
	for share;

	if exists (
		select 1
		from public.planned_workouts existing
		where existing.user_id = p_user_id
			and existing.workout_date between v_interval_start and v_interval_end
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'calendar_collision',
			'message', 'An existing Calendar workout occupies a reviewed continuation date.'
		);
	end if;

	for v_index in 0..(v_workout_count - 1) loop
		v_insert := p_workout_inserts->v_index;
		v_event := p_mutation_events->v_index;
		v_reference := v_event->'adaptive_training_confirmation';
		if jsonb_typeof(coalesce(v_insert, 'null'::jsonb)) <> 'object'
			or jsonb_typeof(coalesce(v_event, 'null'::jsonb)) <> 'object'
			or jsonb_typeof(coalesce(v_reference, 'null'::jsonb)) <> 'object'
			or coalesce(v_insert->>'id', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or v_insert->>'user_id' is distinct from p_user_id::text
			or v_insert->>'origin_kind' is distinct from 'ai'
			or nullif(v_insert->>'plan_cycle_id', '') is not null
			or (v_insert->>'workout_date')::date < p_current_date
			or (v_insert->>'workout_date')::date not between v_interval_start and v_interval_end
			or v_insert->>'workout_date'
				is distinct from v_candidate_workouts->v_index->>'workoutDate'
			or v_insert->>'source_workout_id'
				is distinct from v_candidate_workouts->v_index->>'sourceWorkoutId'
			or v_insert->>'workout_type'
				is distinct from v_candidate_workouts->v_index->>'workoutType'
			or v_event->>'planned_workout_id' is distinct from v_insert->>'id'
			or v_event->>'target_date' is distinct from v_insert->>'workout_date'
			or v_event->>'review_checksum' is distinct from p_review_seal_sha256
			or v_reference->>'predecessor_confirmation_id'
				is distinct from p_predecessor_confirmation_id::text
			or v_reference->>'detailed_candidate_id' is distinct from p_candidate_id::text
			or v_reference->>'detailed_candidate_sha256' is distinct from p_candidate_sha256
			or v_reference->>'input_fingerprint_sha256'
				is distinct from p_input_fingerprint_sha256
			or v_reference->>'block_mode' is distinct from v_block_mode
			or v_reference->>'source_review_checksum' is distinct from p_review_seal_sha256
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_candidate',
				'message', 'A prepared Calendar row or audit event is not the sealed continuation.'
			);
		end if;
	end loop;

	if (
		select count(distinct prepared.workout->>'id')
		from jsonb_array_elements(p_workout_inserts) prepared(workout)
	) <> v_workout_count
		or (
			select count(distinct prepared.workout->>'workout_date')
			from jsonb_array_elements(p_workout_inserts) prepared(workout)
		) <> v_workout_count
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_candidate',
			'message', 'The reviewed continuation contains duplicate Calendar identities or dates.'
		);
	end if;

	for v_index in 0..(v_workout_count - 1) loop
		v_result := public.apply_calendar_workout_mutation(
			p_user_id,
			p_current_date,
			'add',
			null,
			null,
			p_workout_inserts->v_index,
			null,
			p_mutation_events->v_index
		);
		if coalesce((v_result->>'ok')::boolean, false) is not true then
			raise exception '%', coalesce(
				v_result->>'message',
				'The atomic Calendar materialisation rejected a reviewed continuation workout.'
			);
		end if;
		v_inserted_workouts := v_inserted_workouts || jsonb_build_array(v_result->'mutated_workout');
		v_mutation_events := v_mutation_events || jsonb_build_array(v_result->'mutation_event');
	end loop;

	select array_agg((prepared.workout->>'id')::uuid order by prepared.ordinality)
	into v_calendar_workout_ids
	from jsonb_array_elements(p_workout_inserts) with ordinality prepared(workout, ordinality);

	insert into public.adaptive_training_block_confirmations (
		user_id,
		blueprint_id,
		blueprint_version,
		blueprint_sha256,
		detailed_candidate_id,
		candidate_version,
		candidate_sha256,
		interval_start_date,
		interval_end_date,
		calendar_workout_ids,
		input_fingerprint_sha256,
		evidence_revision_fingerprint_sha256,
		calendar_fingerprint_sha256,
		block_mode,
		predecessor_confirmation_id
	)
	values (
		p_user_id,
		p_blueprint_id,
		p_blueprint_version,
		p_blueprint_sha256,
		p_candidate_id,
		p_candidate_version,
		p_candidate_sha256,
		v_interval_start,
		v_interval_end,
		v_calendar_workout_ids,
		p_input_fingerprint_sha256,
		v_candidate.input_snapshot#>>'{evidence,evidenceRevisionFingerprint}',
		v_candidate.input_snapshot#>>'{calendar,calendarOutcomeFingerprint}',
		v_block_mode,
		p_predecessor_confirmation_id
	)
	returning * into v_confirmation;

	for v_preference in
		select value
		from jsonb_array_elements(v_latest_input.active_projection_preferences)
	loop
		v_first_projection_date := null;
		v_second_projection_date := null;
		if v_preference->>'kind' = 'avoid_projection_date' then
			select (projection->>'date')::date into v_first_projection_date
			from jsonb_array_elements(v_blueprint.blueprint_content->'projections') projection
			where projection->>'projection_id' = v_preference->>'projectionId';
			if v_first_projection_date between v_interval_start and v_interval_end then
				v_consumed_preference_count := v_consumed_preference_count + 1;
			else
				v_remaining_preferences := v_remaining_preferences || jsonb_build_array(v_preference);
			end if;
		elsif v_preference->>'kind' = 'swap_projection_slots' then
			select (projection->>'date')::date into v_first_projection_date
			from jsonb_array_elements(v_blueprint.blueprint_content->'projections') projection
			where projection->>'projection_id' = v_preference->>'firstProjectionId';
			select (projection->>'date')::date into v_second_projection_date
			from jsonb_array_elements(v_blueprint.blueprint_content->'projections') projection
			where projection->>'projection_id' = v_preference->>'secondProjectionId';
			if v_first_projection_date between v_interval_start and v_interval_end
				and v_second_projection_date between v_interval_start and v_interval_end
			then
				v_consumed_preference_count := v_consumed_preference_count + 1;
			else
				v_remaining_preferences := v_remaining_preferences || jsonb_build_array(v_preference);
			end if;
		end if;
	end loop;

	v_next_input_sha256 := encode(
		extensions.digest(
			convert_to(
				jsonb_build_object(
					'activeProjectionPreferences', v_remaining_preferences,
					'horizonCheckIn', null
				)::text,
				'UTF8'
			),
			'sha256'
		),
		'hex'
	);
	insert into public.adaptive_training_continuation_input_revisions (
		user_id,
		blueprint_id,
		revision,
		content_sha256,
		supersedes_revision,
		active_projection_preferences,
		horizon_check_in
	)
	values (
		p_user_id,
		p_blueprint_id,
		v_latest_input.revision + 1,
		v_next_input_sha256,
		v_latest_input.revision,
		v_remaining_preferences,
		null
	)
	returning * into v_next_input;

	return jsonb_build_object(
		'ok', true,
		'blueprint_id', p_blueprint_id,
		'detailed_candidate_id', p_candidate_id,
		'block_confirmation_id', v_confirmation.id,
		'predecessor_confirmation_id', p_predecessor_confirmation_id,
		'continuation_input_revision_id', v_next_input.id,
		'consumed_preference_count', v_consumed_preference_count,
		'calendar_row_count', v_workout_count,
		'inserted_workouts', v_inserted_workouts,
		'mutation_events', v_mutation_events
	);
end;
$$;

revoke all on function public.apply_adaptive_continuation_detailed_block_materialization(
	uuid,
	date,
	uuid,
	integer,
	text,
	uuid,
	uuid,
	integer,
	text,
	text,
	jsonb,
	jsonb,
	text,
	jsonb,
	jsonb
) from public, anon, authenticated;

grant execute on function public.apply_adaptive_continuation_detailed_block_materialization(
	uuid,
	date,
	uuid,
	integer,
	text,
	uuid,
	uuid,
	integer,
	text,
	text,
	jsonb,
	jsonb,
	text,
	jsonb,
	jsonb
) to service_role;

comment on function public.apply_adaptive_continuation_detailed_block_materialization(
	uuid,
	date,
	uuid,
	integer,
	text,
	uuid,
	uuid,
	integer,
	text,
	text,
	jsonb,
	jsonb,
	text,
	jsonb,
	jsonb
) is
	'Atomically confirms one still-current adaptive continuation candidate, materialises only its reviewed Calendar block, appends immutable lineage and consumes only interval preferences.';
