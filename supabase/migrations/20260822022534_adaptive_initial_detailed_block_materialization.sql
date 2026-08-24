create function public.apply_adaptive_initial_detailed_block_materialization(
	p_user_id uuid,
	p_current_date date,
	p_blueprint_id uuid,
	p_blueprint_version integer,
	p_blueprint_sha256 text,
	p_candidate_id uuid,
	p_candidate_version integer,
	p_candidate_sha256 text,
	p_input_fingerprint_sha256 text,
	p_expected_blueprint_content jsonb,
	p_expected_candidate_content jsonb,
	p_expected_input_snapshot jsonb,
	p_source_review_checksum text,
	p_workout_review_checksum text,
	p_workout_inserts jsonb,
	p_mutation_events jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
	v_blueprint public.adaptive_training_blueprint_versions%rowtype;
	v_candidate public.adaptive_training_detailed_candidates%rowtype;
	v_candidate_workouts jsonb;
	v_insert jsonb;
	v_event jsonb;
	v_result jsonb;
	v_inserted_workouts jsonb := '[]'::jsonb;
	v_mutation_events jsonb := '[]'::jsonb;
	v_workout_count integer;
	v_index integer;
begin
	if p_user_id is null
		or p_current_date is null
		or p_blueprint_id is null
		or p_candidate_id is null
		or p_blueprint_version <= 0
		or p_candidate_version <= 0
		or coalesce(p_blueprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or coalesce(p_candidate_sha256, '') !~ '^[0-9a-f]{64}$'
		or coalesce(p_input_fingerprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or coalesce(p_source_review_checksum, '') !~ '^[0-9a-f]{64}$'
		or coalesce(p_workout_review_checksum, '') !~ '^[0-9a-f]{64}$'
		or jsonb_typeof(coalesce(p_expected_blueprint_content, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_expected_candidate_content, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_expected_input_snapshot, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workout_inserts, 'null'::jsonb)) <> 'array'
		or jsonb_typeof(coalesce(p_mutation_events, 'null'::jsonb)) <> 'array'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The adaptive detailed-block confirmation payload is invalid.'
		);
	end if;

	v_workout_count := jsonb_array_length(p_workout_inserts);
	if v_workout_count = 0 or jsonb_array_length(p_mutation_events) <> v_workout_count then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The adaptive detailed-block confirmation must contain one audit event per workout.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select * into v_blueprint
	from public.adaptive_training_blueprint_versions blueprint
	where blueprint.id = p_blueprint_id
		and blueprint.user_id = p_user_id;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'ownership_failure',
			'message', 'The reviewed adaptive Blueprint was not found for this runner.'
		);
	end if;

	if v_blueprint.version is distinct from p_blueprint_version
		or v_blueprint.content_sha256 is distinct from p_blueprint_sha256
		or v_blueprint.blueprint_content is distinct from p_expected_blueprint_content
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The adaptive Blueprint no longer matches the reviewed immutable version.'
		);
	end if;

	select * into v_candidate
	from public.adaptive_training_detailed_candidates candidate
	where candidate.id = p_candidate_id
		and candidate.user_id = p_user_id
		and candidate.blueprint_id = p_blueprint_id;

	if not found then
		return jsonb_build_object(
			'ok', false,
			'reason', 'ownership_failure',
			'message', 'The reviewed detailed-block candidate was not found for this runner.'
		);
	end if;

	if v_candidate.version is distinct from p_candidate_version
		or v_candidate.candidate_sha256 is distinct from p_candidate_sha256
		or v_candidate.input_fingerprint_sha256 is distinct from p_input_fingerprint_sha256
		or v_candidate.candidate_content is distinct from p_expected_candidate_content
		or v_candidate.input_snapshot is distinct from p_expected_input_snapshot
		or coalesce(v_candidate.confirmation_lineage->>'state', '') <> 'unconfirmed'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The detailed-block candidate no longer matches the reviewed immutable source.'
		);
	end if;

	v_candidate_workouts := v_candidate.candidate_content->'canonicalPlan'->'planned_workouts';
	if jsonb_typeof(coalesce(v_candidate_workouts, 'null'::jsonb)) <> 'array'
		or jsonb_array_length(v_candidate_workouts) <> v_workout_count
		or v_candidate.interval_start_date::text
			is distinct from v_candidate_workouts->0->>'date'
		or v_candidate.interval_end_date::text
			is distinct from v_candidate_workouts->(v_workout_count - 1)->>'date'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_candidate',
			'message', 'The retained detailed-block candidate does not contain the exact reviewed workout set.'
		);
	end if;

	if exists (
		select 1
		from public.calendar_workout_mutation_events event
		where event.user_id = p_user_id
			and event.event_payload->'adaptive_training_confirmation'->>'detailed_candidate_id'
				= p_candidate_id::text
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'This detailed-block candidate was already confirmed.'
		);
	end if;

	for v_index in 0..(v_workout_count - 1) loop
		v_insert := p_workout_inserts->v_index;
		v_event := p_mutation_events->v_index;

		if jsonb_typeof(coalesce(v_insert, 'null'::jsonb)) <> 'object'
			or jsonb_typeof(coalesce(v_event, 'null'::jsonb)) <> 'object'
			or coalesce(v_insert->>'id', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_candidate',
				'message', 'A prepared Calendar row or audit event has an invalid structural shape.'
			);
		end if;

		if v_insert->>'user_id' is distinct from p_user_id::text
			or v_insert->>'origin_kind' is distinct from 'ai'
			or nullif(v_insert->>'plan_cycle_id', '') is not null
			or (v_insert->>'workout_date')::date < p_current_date
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_candidate',
				'message', 'A prepared Calendar row violates standalone owner, origin, or date policy.'
			);
		end if;

		if v_insert->>'workout_date'
				is distinct from v_candidate_workouts->v_index->>'date'
			or v_insert->>'source_workout_id'
				is distinct from v_candidate_workouts->v_index->>'workout_id'
			or v_insert->>'workout_type'
				is distinct from v_candidate_workouts->v_index->>'workout_type'
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_candidate',
				'message', 'A prepared Calendar row does not match the immutable candidate workout.'
			);
		end if;

		if v_event->>'planned_workout_id' is distinct from v_insert->>'id'
			or v_event->>'target_date' is distinct from v_insert->>'workout_date'
			or v_event->>'review_checksum' is distinct from p_workout_review_checksum
			or v_event->'adaptive_training_confirmation'->>'blueprint_id'
				is distinct from p_blueprint_id::text
			or v_event->'adaptive_training_confirmation'->>'detailed_candidate_id'
				is distinct from p_candidate_id::text
			or v_event->'adaptive_training_confirmation'->>'source_review_checksum'
				is distinct from p_source_review_checksum
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_candidate',
				'message', 'A prepared Calendar audit event does not match the reviewed candidate lineage.'
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
			'message', 'The reviewed detailed block contains duplicate Calendar identities or dates.'
		);
	end if;

	if exists (
		select 1
		from public.planned_workouts existing
		join jsonb_array_elements(p_workout_inserts) prepared(workout)
			on prepared.workout->>'workout_date' = existing.workout_date::text
		where existing.user_id = p_user_id
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'calendar_collision',
			'message', 'An existing Calendar workout occupies a reviewed detailed-block date.'
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
				'The atomic Calendar materialisation rejected a reviewed workout.'
			);
		end if;

		v_inserted_workouts := v_inserted_workouts || jsonb_build_array(v_result->'mutated_workout');
		v_mutation_events := v_mutation_events || jsonb_build_array(v_result->'mutation_event');
	end loop;

	return jsonb_build_object(
		'ok', true,
		'blueprint_id', p_blueprint_id,
		'detailed_candidate_id', p_candidate_id,
		'calendar_row_count', v_workout_count,
		'inserted_workouts', v_inserted_workouts,
		'mutation_events', v_mutation_events
	);
end;
$$;

revoke all on function public.apply_adaptive_initial_detailed_block_materialization(
	uuid,
	date,
	uuid,
	integer,
	text,
	uuid,
	integer,
	text,
	text,
	jsonb,
	jsonb,
	jsonb,
	text,
	text,
	jsonb,
	jsonb
) from public, anon, authenticated;

grant execute on function public.apply_adaptive_initial_detailed_block_materialization(
	uuid,
	date,
	uuid,
	integer,
	text,
	uuid,
	integer,
	text,
	text,
	jsonb,
	jsonb,
	jsonb,
	text,
	text,
	jsonb,
	jsonb
) to service_role;

comment on function public.apply_adaptive_initial_detailed_block_materialization(
	uuid,
	date,
	uuid,
	integer,
	text,
	uuid,
	integer,
	text,
	text,
	jsonb,
	jsonb,
	jsonb,
	text,
	text,
	jsonb,
	jsonb
) is
	'Atomically materialises one owner-bound, reviewed initial adaptive detail block as independent Runner Calendar workouts. Blueprint projections remain non-workout source intent.';
