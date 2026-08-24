create or replace function public.retain_adaptive_training_continuation_candidate(
	p_user_id uuid,
	p_blueprint_id uuid,
	p_blueprint_version integer,
	p_blueprint_sha256 text,
	p_predecessor_confirmation_id uuid,
	p_source_response_id uuid,
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
		or p_source_response_id is null
		or p_blueprint_version <= 0
		or coalesce(p_blueprint_sha256, '') !~ '^[0-9a-f]{64}$'
		or p_interval_start_date is null
		or p_interval_end_date < p_interval_start_date
		or jsonb_typeof(coalesce(p_candidate_content, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_candidate_content->'workoutDocuments', 'null'::jsonb)) <> 'array'
		or jsonb_array_length(p_candidate_content->'workoutDocuments') = 0
		or jsonb_typeof(coalesce(p_input_snapshot, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_input_provenance, 'null'::jsonb)) <> 'object'
		or p_input_provenance->>'retainedResponseId' is distinct from p_source_response_id::text
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

	if not exists (
		select 1
		from public.ai_plan_generation_responses response
		where response.id = p_source_response_id
			and response.user_id = p_user_id
			and response.schema_outcome = 'accepted'
			and (
				response.compiler_outcome = 'accepted'
				or (
					response.compiler_outcome = 'rejected'
					and p_input_provenance->>'retainedResponseOriginalCompilerOutcome' = 'rejected'
					and p_input_provenance->>'recompiledFromCompilerVersion'
						is not distinct from response.version_context->>'compilerVersion'
					and coalesce(p_input_provenance->>'compilerVersion', '')
						~ '^adaptive_continuation_compiler_v[0-9]+$'
					and p_input_provenance->>'compilerVersion'
						is distinct from p_input_provenance->>'recompiledFromCompilerVersion'
					and p_input_provenance->>'recompiledDiagnosticCode'
						is not distinct from response.diagnostic_code
					and response.attempt_result->>'outcome' = 'technical_rejection'
					and response.attempt_result ? 'candidateRecordId'
					and jsonb_typeof(response.attempt_result->'candidateRecordId') = 'null'
				)
			)
	) then
		raise exception 'The accepted or immutably recompiled retained continuation response was not found for its owner.';
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
		if v_candidate.source_response_id is distinct from p_source_response_id
			or v_candidate.interval_start_date is distinct from p_interval_start_date
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
		source_response_id,
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
		p_source_response_id,
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

comment on function public.retain_adaptive_training_continuation_candidate(
	uuid,
	uuid,
	integer,
	text,
	uuid,
	uuid,
	date,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) is
	'Retains one owner-bound immutable continuation candidate from either its originally accepted response or an immutable rejected response recompiled under an explicitly frozen newer compiler; creates no Calendar rows.';
