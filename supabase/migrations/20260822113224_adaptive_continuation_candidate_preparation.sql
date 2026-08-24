create or replace function public.retain_adaptive_training_continuation_input_revision(
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
	v_check_in_confirmation_id uuid;
	v_leaf_confirmation_count integer;
begin
	if p_user_id is null
		or p_blueprint_id is null
		or p_blueprint_version <= 0
		or coalesce(p_blueprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or jsonb_typeof(coalesce(p_active_projection_preferences, 'null'::jsonb)) <> 'array'
	then
		raise exception 'The adaptive continuation input is invalid.';
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

	if p_horizon_check_in is not null then
		if jsonb_typeof(p_horizon_check_in) <> 'object'
			or (select count(*) from jsonb_object_keys(p_horizon_check_in)) <> 8
			or coalesce(p_horizon_check_in->>'confirmationId', '') = ''
			or jsonb_typeof(p_horizon_check_in->'goalAssumptionCurrent') <> 'boolean'
			or jsonb_typeof(p_horizon_check_in->'availabilityConfirmed') <> 'boolean'
			or p_horizon_check_in->>'manageability' not in ('too_much', 'manageable', 'too_little')
			or (
				p_horizon_check_in->'materialChangeReason' <> 'null'::jsonb
				and (
					jsonb_typeof(p_horizon_check_in->'materialChangeReason') <> 'string'
					or length(p_horizon_check_in->>'materialChangeReason') > 500
				)
			)
			or p_horizon_check_in->>'healthLimitation' not in ('no', 'yes', 'unsure')
			or p_horizon_check_in->>'interruptionStatus' not in ('none', 'resolved', 'unresolved')
			or p_horizon_check_in->>'clinicianGuidance' not in (
				'not_applicable',
				'permits_running',
				'restricts_running',
				'unclear'
			)
		then
			raise exception 'The adaptive horizon check-in is invalid.';
		end if;

		begin
			v_check_in_confirmation_id := (p_horizon_check_in->>'confirmationId')::uuid;
		exception when invalid_text_representation then
			raise exception 'The adaptive horizon check-in confirmation is invalid.';
		end;

		select count(*) into v_leaf_confirmation_count
		from public.adaptive_training_block_confirmations confirmation
		where confirmation.id = v_check_in_confirmation_id
			and confirmation.user_id = p_user_id
			and confirmation.blueprint_id = p_blueprint_id
			and not exists (
				select 1
				from public.adaptive_training_block_confirmations child
				where child.user_id = p_user_id
					and child.blueprint_id = p_blueprint_id
					and child.predecessor_confirmation_id = confirmation.id
			);

		if v_leaf_confirmation_count <> 1 then
			raise exception 'The adaptive horizon check-in does not match the current confirmed block.';
		end if;
	end if;

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

create function public.retain_adaptive_training_continuation_candidate(
	p_user_id uuid,
	p_blueprint_id uuid,
	p_blueprint_version integer,
	p_blueprint_sha256 text,
	p_predecessor_confirmation_id uuid,
	p_interval_start_date date,
	p_interval_end_date date,
	p_candidate_content jsonb,
	p_input_snapshot jsonb,
	p_input_provenance jsonb,
	p_fact_references jsonb,
	p_confirmation_lineage jsonb
)
returns table (
	candidate_id uuid,
	candidate_version integer,
	candidate_sha256 text,
	input_fingerprint_sha256 text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_blueprint public.adaptive_training_blueprint_versions%rowtype;
	v_confirmation public.adaptive_training_block_confirmations%rowtype;
	v_candidate public.adaptive_training_detailed_candidates%rowtype;
	v_candidate_sha256 text;
	v_input_fingerprint_sha256 text;
	v_next_version integer;
begin
	if (select auth.role()) <> 'service_role' then
		raise exception 'Adaptive continuation candidate retention requires the service role.';
	end if;

	if p_user_id is null
		or p_blueprint_id is null
		or p_predecessor_confirmation_id is null
		or p_blueprint_version <= 0
		or coalesce(p_blueprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or p_interval_start_date is null
		or p_interval_end_date < p_interval_start_date
		or jsonb_typeof(coalesce(p_candidate_content, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_candidate_content->'workoutDocuments', 'null'::jsonb)) <> 'array'
		or jsonb_array_length(p_candidate_content->'workoutDocuments') = 0
		or jsonb_typeof(coalesce(p_input_snapshot, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_input_provenance, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_fact_references, 'null'::jsonb)) <> 'array'
		or jsonb_typeof(coalesce(p_confirmation_lineage, 'null'::jsonb)) <> 'object'
		or p_confirmation_lineage->>'kind' <> 'continuation_detailed_block_candidate'
		or p_confirmation_lineage->>'state' <> 'unconfirmed'
		or p_confirmation_lineage->>'predecessorConfirmationId'
			is distinct from p_predecessor_confirmation_id::text
		or p_input_snapshot#>>'{confirmation,id}'
			is distinct from p_predecessor_confirmation_id::text
	then
		raise exception 'The adaptive continuation candidate payload is invalid.';
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

	select * into v_confirmation
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
		);

	if not found then
		raise exception 'The adaptive continuation candidate predecessor is stale.';
	end if;

	if p_interval_start_date <= v_confirmation.interval_end_date then
		raise exception 'The adaptive continuation candidate overlaps its confirmed Calendar interval.';
	end if;

	v_candidate_sha256 := encode(
		extensions.digest(convert_to(p_candidate_content::text, 'UTF8'), 'sha256'),
		'hex'
	);
	v_input_fingerprint_sha256 := encode(
		extensions.digest(convert_to(p_input_snapshot::text, 'UTF8'), 'sha256'),
		'hex'
	);

	select * into v_candidate
	from public.adaptive_training_detailed_candidates stored
	where stored.user_id = p_user_id
		and stored.blueprint_id = p_blueprint_id
		and stored.input_fingerprint_sha256 = v_input_fingerprint_sha256
		and stored.candidate_sha256 = v_candidate_sha256;

	if v_candidate.id is not null then
		if v_candidate.interval_start_date is distinct from p_interval_start_date
			or v_candidate.interval_end_date is distinct from p_interval_end_date
			or v_candidate.candidate_content is distinct from p_candidate_content
			or v_candidate.input_snapshot is distinct from p_input_snapshot
			or v_candidate.input_provenance is distinct from p_input_provenance
			or v_candidate.fact_references is distinct from p_fact_references
			or v_candidate.confirmation_lineage is distinct from p_confirmation_lineage
		then
			raise exception 'The retained continuation candidate conflicts with immutable source truth.';
		end if;

		return query select v_candidate.id, v_candidate.version, v_candidate.candidate_sha256,
			v_candidate.input_fingerprint_sha256;
		return;
	end if;

	select coalesce(max(stored.version), 0) + 1 into v_next_version
	from public.adaptive_training_detailed_candidates stored
	where stored.user_id = p_user_id
		and stored.blueprint_id = p_blueprint_id;

	insert into public.adaptive_training_detailed_candidates (
		user_id,
		blueprint_id,
		version,
		interval_start_date,
		interval_end_date,
		candidate_content,
		candidate_sha256,
		input_snapshot,
		input_fingerprint_sha256,
		input_provenance,
		fact_references,
		confirmation_lineage
	)
	values (
		p_user_id,
		p_blueprint_id,
		v_next_version,
		p_interval_start_date,
		p_interval_end_date,
		p_candidate_content,
		v_candidate_sha256,
		p_input_snapshot,
		v_input_fingerprint_sha256,
		p_input_provenance,
		p_fact_references,
		p_confirmation_lineage
	)
	returning * into v_candidate;

	return query select v_candidate.id, v_candidate.version, v_candidate.candidate_sha256,
		v_candidate.input_fingerprint_sha256;
end;
$$;

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

revoke all on function public.retain_adaptive_training_continuation_candidate(
	uuid,
	uuid,
	integer,
	text,
	uuid,
	date,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) from public, anon, authenticated;

grant execute on function public.retain_adaptive_training_continuation_candidate(
	uuid,
	uuid,
	integer,
	text,
	uuid,
	date,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) to service_role;

comment on function public.retain_adaptive_training_continuation_candidate(
	uuid,
	uuid,
	integer,
	text,
	uuid,
	date,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) is
	'Atomically retains one immutable owner-bound continuation review candidate or returns its exact idempotent version. It never writes Runner Calendar rows.';
