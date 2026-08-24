alter table public.adaptive_training_detailed_candidates
	add constraint adaptive_training_detailed_candidates_user_id_id_key unique (user_id, id);

create table public.adaptive_training_block_confirmations (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	blueprint_id uuid not null,
	blueprint_version integer not null check (blueprint_version > 0),
	blueprint_sha256 text not null check (blueprint_sha256 ~ '^[0-9a-f]{64}$'),
	detailed_candidate_id uuid not null,
	candidate_version integer not null check (candidate_version > 0),
	candidate_sha256 text not null check (candidate_sha256 ~ '^[0-9a-f]{64}$'),
	interval_start_date date not null,
	interval_end_date date not null check (interval_end_date >= interval_start_date),
	calendar_workout_ids uuid[] not null check (cardinality(calendar_workout_ids) > 0),
	input_fingerprint_sha256 text not null check (input_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
	evidence_revision_fingerprint_sha256 text not null check (
		evidence_revision_fingerprint_sha256 ~ '^[0-9a-f]{64}$'
	),
	calendar_fingerprint_sha256 text not null check (
		calendar_fingerprint_sha256 ~ '^[0-9a-f]{64}$'
	),
	block_mode text not null check (
		block_mode in (
			'initial_four_week',
			'normal_four_week',
			'target_taper_boundary',
			'resolved_interruption_bridge'
		)
	),
	predecessor_confirmation_id uuid,
	confirmed_at timestamptz not null default now(),
	constraint adaptive_training_block_confirmations_owner_blueprint_fkey
		foreign key (user_id, blueprint_id)
		references public.adaptive_training_blueprint_versions (user_id, id)
		on delete cascade,
	constraint adaptive_training_block_confirmations_owner_candidate_fkey
		foreign key (user_id, detailed_candidate_id)
		references public.adaptive_training_detailed_candidates (user_id, id)
		on delete cascade,
	constraint adaptive_training_block_confirmations_owner_predecessor_fkey
		foreign key (user_id, predecessor_confirmation_id)
		references public.adaptive_training_block_confirmations (user_id, id)
		on delete restrict,
	unique (user_id, detailed_candidate_id),
	unique (user_id, id)
);

create table public.adaptive_training_continuation_input_revisions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	blueprint_id uuid not null,
	revision integer not null check (revision > 0),
	content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
	supersedes_revision integer,
	active_projection_preferences jsonb not null default '[]'::jsonb check (
		jsonb_typeof(active_projection_preferences) = 'array'
	),
	horizon_check_in jsonb check (
		horizon_check_in is null or jsonb_typeof(horizon_check_in) = 'object'
	),
	created_at timestamptz not null default now(),
	constraint adaptive_training_continuation_input_revisions_owner_blueprint_fkey
		foreign key (user_id, blueprint_id)
		references public.adaptive_training_blueprint_versions (user_id, id)
		on delete cascade,
	constraint adaptive_training_continuation_input_revisions_supersedes_check
		check (
			(revision = 1 and supersedes_revision is null)
			or (revision > 1 and supersedes_revision = revision - 1)
		),
	unique (user_id, blueprint_id, revision),
	unique (user_id, id)
);

create index adaptive_training_block_confirmations_owner_blueprint_idx
	on public.adaptive_training_block_confirmations (
		user_id,
		blueprint_id,
		confirmed_at,
		id
	);

create index adaptive_training_continuation_inputs_owner_blueprint_idx
	on public.adaptive_training_continuation_input_revisions (
		user_id,
		blueprint_id,
		revision desc
	);

create or replace function public.reject_adaptive_training_lineage_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	raise exception 'Adaptive training confirmations and continuation inputs are immutable.';
end;
$$;

create trigger adaptive_training_block_confirmations_reject_update
before update on public.adaptive_training_block_confirmations
for each row
execute function public.reject_adaptive_training_lineage_update();

create trigger adaptive_training_continuation_input_revisions_reject_update
before update on public.adaptive_training_continuation_input_revisions
for each row
execute function public.reject_adaptive_training_lineage_update();

create function public.retain_adaptive_training_continuation_input_revision(
	p_user_id uuid,
	p_blueprint_id uuid,
	p_blueprint_version integer,
	p_blueprint_sha256 text,
	p_active_projection_preferences jsonb,
	p_horizon_check_in jsonb
)
returns table (
	revision_id uuid,
	revision integer,
	content_sha256 text,
	supersedes_revision integer
)
language plpgsql
set search_path = ''
as $$
declare
	v_blueprint public.adaptive_training_blueprint_versions%rowtype;
	v_preference jsonb;
	v_projection jsonb;
	v_first_projection jsonb;
	v_second_projection jsonb;
	v_latest public.adaptive_training_continuation_input_revisions%rowtype;
	v_retained public.adaptive_training_continuation_input_revisions%rowtype;
	v_content_sha256 text;
begin
	if p_user_id is null
		or p_blueprint_id is null
		or p_blueprint_version <= 0
		or coalesce(p_blueprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or jsonb_typeof(coalesce(p_active_projection_preferences, 'null'::jsonb)) <> 'array'
		or p_horizon_check_in is not null
	then
		raise exception 'Slice 4A accepts projection preferences only; check-in content is not admitted yet.';
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_blueprint_id::text, 0));

	select * into v_blueprint
	from public.adaptive_training_blueprint_versions blueprint
	where blueprint.id = p_blueprint_id
		and blueprint.user_id = p_user_id;

	if not found then
		raise exception 'The adaptive Blueprint was not found for its owner.';
	end if;

	if v_blueprint.version is distinct from p_blueprint_version
		or v_blueprint.content_sha256 is distinct from p_blueprint_sha256
	then
		raise exception 'The adaptive Blueprint version is stale.';
	end if;

	for v_preference in
		select value from jsonb_array_elements(p_active_projection_preferences)
	loop
		if jsonb_typeof(v_preference) <> 'object' then
			raise exception 'A projection preference must be an object.';
		end if;

		if v_preference->>'kind' = 'avoid_projection_date' then
			if (select count(*) from jsonb_object_keys(v_preference)) <> 3
				or coalesce(v_preference->>'projectionId', '') = ''
				or coalesce(v_preference->>'date', '') !~ '^\d{4}-\d{2}-\d{2}$'
			then
				raise exception 'The exact-date projection preference is invalid.';
			end if;

			select projection into v_projection
			from jsonb_array_elements(v_blueprint.blueprint_content->'projections') projection
			where projection->>'projection_id' = v_preference->>'projectionId';

			if v_projection is null
				or v_projection->>'date' is distinct from v_preference->>'date'
			then
				raise exception 'The exact-date preference does not match an immutable Blueprint projection.';
			end if;
		elsif v_preference->>'kind' = 'swap_projection_slots' then
			if (select count(*) from jsonb_object_keys(v_preference)) <> 3
				or coalesce(v_preference->>'firstProjectionId', '') = ''
				or coalesce(v_preference->>'secondProjectionId', '') = ''
				or v_preference->>'firstProjectionId' = v_preference->>'secondProjectionId'
			then
				raise exception 'The projection-slot swap preference is invalid.';
			end if;

			select projection into v_first_projection
			from jsonb_array_elements(v_blueprint.blueprint_content->'projections') projection
			where projection->>'projection_id' = v_preference->>'firstProjectionId';
			select projection into v_second_projection
			from jsonb_array_elements(v_blueprint.blueprint_content->'projections') projection
			where projection->>'projection_id' = v_preference->>'secondProjectionId';

			if v_first_projection is null or v_second_projection is null then
				raise exception 'The swap preference must reference two immutable Blueprint projections.';
			end if;
		else
			raise exception 'The projection preference kind is not supported.';
		end if;
	end loop;

	v_content_sha256 := encode(
		extensions.digest(
			convert_to(
				jsonb_build_object(
					'activeProjectionPreferences', p_active_projection_preferences,
					'horizonCheckIn', p_horizon_check_in
				)::text,
				'UTF8'
			),
			'sha256'
		),
		'hex'
	);

	select * into v_latest
	from public.adaptive_training_continuation_input_revisions input_revision
	where input_revision.user_id = p_user_id
		and input_revision.blueprint_id = p_blueprint_id
	order by input_revision.revision desc
	limit 1;

	if v_latest.id is not null and v_latest.content_sha256 = v_content_sha256 then
		return query select v_latest.id, v_latest.revision, v_latest.content_sha256,
			v_latest.supersedes_revision;
		return;
	end if;

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
		coalesce(v_latest.revision, 0) + 1,
		v_content_sha256,
		v_latest.revision,
		p_active_projection_preferences,
		p_horizon_check_in
	)
	returning * into v_retained;

	return query select v_retained.id, v_retained.revision, v_retained.content_sha256,
		v_retained.supersedes_revision;
end;
$$;

create or replace function public.apply_adaptive_initial_detailed_block_materialization(
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
	v_confirmation public.adaptive_training_block_confirmations%rowtype;
	v_candidate_workouts jsonb;
	v_insert jsonb;
	v_event jsonb;
	v_result jsonb;
	v_inserted_workouts jsonb := '[]'::jsonb;
	v_mutation_events jsonb := '[]'::jsonb;
	v_calendar_workout_ids uuid[];
	v_evidence_fingerprint text;
	v_workout_count integer;
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
		or v_candidate.interval_start_date::text is distinct from v_candidate_workouts->0->>'date'
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
		from public.adaptive_training_block_confirmations confirmation
		where confirmation.user_id = p_user_id
			and confirmation.detailed_candidate_id = p_candidate_id
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

		if v_insert->>'workout_date' is distinct from v_candidate_workouts->v_index->>'date'
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

	select array_agg((prepared.workout->>'id')::uuid order by prepared.ordinality)
	into v_calendar_workout_ids
	from jsonb_array_elements(p_workout_inserts) with ordinality prepared(workout, ordinality);

	v_evidence_fingerprint := encode(
		extensions.digest(
			convert_to(
				jsonb_build_object(
					'kind', 'initial_block_confirmation',
					'dueWorkoutCount', 0,
					'workoutIds', to_jsonb(v_calendar_workout_ids)
				)::text,
				'UTF8'
			),
			'sha256'
		),
		'hex'
	);

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
		v_candidate.interval_start_date,
		v_candidate.interval_end_date,
		v_calendar_workout_ids,
		p_input_fingerprint_sha256,
		v_evidence_fingerprint,
		p_workout_review_checksum,
		'initial_four_week',
		null
	)
	returning * into v_confirmation;

	return jsonb_build_object(
		'ok', true,
		'blueprint_id', p_blueprint_id,
		'detailed_candidate_id', p_candidate_id,
		'block_confirmation_id', v_confirmation.id,
		'calendar_row_count', v_workout_count,
		'inserted_workouts', v_inserted_workouts,
		'mutation_events', v_mutation_events
	);
end;
$$;

alter table public.adaptive_training_block_confirmations enable row level security;
alter table public.adaptive_training_continuation_input_revisions enable row level security;

create policy "adaptive_training_block_confirmations_select_own"
	on public.adaptive_training_block_confirmations for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "adaptive_training_continuation_input_revisions_select_own"
	on public.adaptive_training_continuation_input_revisions for select to authenticated
	using ((select auth.uid()) = user_id);

revoke all privileges on table public.adaptive_training_block_confirmations
	from public, anon, authenticated, service_role;
revoke all privileges on table public.adaptive_training_continuation_input_revisions
	from public, anon, authenticated, service_role;
grant select on table public.adaptive_training_block_confirmations to authenticated;
grant select on table public.adaptive_training_continuation_input_revisions to authenticated;
grant select, insert, delete on table public.adaptive_training_block_confirmations to service_role;
grant select, insert, delete on table public.adaptive_training_continuation_input_revisions
	to service_role;

revoke all on function public.reject_adaptive_training_lineage_update() from public, anon, authenticated;
revoke all on function public.retain_adaptive_training_continuation_input_revision(
	uuid,
	uuid,
	integer,
	text,
	jsonb,
	jsonb
) from public, anon, authenticated;
grant execute on function public.retain_adaptive_training_continuation_input_revision(
	uuid,
	uuid,
	integer,
	text,
	jsonb,
	jsonb
) to service_role;

comment on table public.adaptive_training_block_confirmations is
	'Immutable owner-private Source Authoring lineage recorded atomically with block materialisation; it never grants Calendar authority.';
comment on table public.adaptive_training_continuation_input_revisions is
	'Append-only owner-private Blueprint scheduling preferences and optional check-in input; projections remain non-executable Source intent.';
