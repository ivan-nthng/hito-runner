create or replace function public.retain_adaptive_training_source_candidate(
	p_user_id uuid,
	p_source_response_id uuid,
	p_blueprint_version integer,
	p_source_contract_version text,
	p_compiler_version text,
	p_blueprint_content jsonb,
	p_candidate_version integer,
	p_interval_start_date date,
	p_interval_end_date date,
	p_candidate_content jsonb,
	p_input_snapshot jsonb,
	p_input_provenance jsonb,
	p_fact_references jsonb,
	p_confirmation_lineage jsonb
)
returns table (
	blueprint_id uuid,
	blueprint_version integer,
	blueprint_sha256 text,
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
	v_candidate public.adaptive_training_detailed_candidates%rowtype;
	v_blueprint_sha256 text;
	v_candidate_sha256 text;
	v_input_fingerprint_sha256 text;
begin
	if (select auth.role()) <> 'service_role' then
		raise exception 'Adaptive training source retention requires the service role.';
	end if;

	if not exists (
		select 1
		from public.ai_plan_generation_responses response
		where response.id = p_source_response_id
			and response.user_id = p_user_id
			and (
				(
					response.schema_outcome = 'accepted'
					and response.compiler_outcome = 'accepted'
				)
				or (
					response.schema_outcome = 'rejected'
					and response.compiler_outcome = 'not_run'
					and response.diagnostic_code = 'ai_authored_plan_first_provider_schema_invalid'
					and response.diagnostic_path is not null
					and response.request_context is not null
					and response.version_context is not null
					and response.request_fingerprint_sha256 is not null
					and response.version_fingerprint_sha256 is not null
					and response.response_sha256 = p_input_provenance->>'retainedResponseSha256'
					and p_input_provenance->>'kind' = 'structured_authoring_input'
					and p_input_provenance->>'retainedResponseId' = p_source_response_id::text
					and p_input_provenance->>'sourceContractVersion' = p_source_contract_version
					and p_input_provenance->>'compilerVersion' = p_compiler_version
					and response.version_context->>'compilerVersion' = p_compiler_version
					and p_input_provenance->>'immutableRecompileKind'
						= 'immutable_initial_response_recompile_v1'
					and p_input_provenance->>'retainedResponseOriginalSchemaOutcome'
						= response.schema_outcome
					and p_input_provenance->>'retainedResponseOriginalCompilerOutcome'
						= response.compiler_outcome
					and p_input_provenance->>'recompiledDiagnosticCode'
						= response.diagnostic_code
					and p_input_provenance->>'recompiledDiagnosticPath'
						= response.diagnostic_path
					and p_input_provenance->>'retainedRequestFingerprintSha256'
						= response.request_fingerprint_sha256
					and p_input_provenance->>'retainedVersionFingerprintSha256'
						= response.version_fingerprint_sha256
					and p_input_provenance->>'materialRequestIdentityVersion'
						= 'ai_first_plan_material_request_identity_v1'
					and coalesce(p_input_provenance->>'materialRequestFingerprintSha256', '')
						~ '^[0-9a-f]{64}$'
					and coalesce(p_input_provenance->>'aliasNormalizationCount', '')
						~ '^[1-9][0-9]*$'
					and response.attempt_result->>'outcome' = 'technical_rejection'
					and response.attempt_result ? 'candidateRecordId'
					and jsonb_typeof(response.attempt_result->'candidateRecordId') = 'null'
					and not (response.request_context ? 'requestContext')
					and (
						response.request_context
							#- '{runnerCapability,vectorId}'
							#- '{runnerCapability,snapshot,snapshotId}'
					) = (
						p_input_snapshot
							#- '{runnerCapability,vectorId}'
							#- '{runnerCapability,snapshot,snapshotId}'
					)
				)
			)
	) then
		raise exception 'The accepted or proven immutable retained source response was not found for its owner.';
	end if;

	v_blueprint_sha256 := encode(
		extensions.digest(convert_to(p_blueprint_content::text, 'UTF8'), 'sha256'),
		'hex'
	);
	v_candidate_sha256 := encode(
		extensions.digest(convert_to(p_candidate_content::text, 'UTF8'), 'sha256'),
		'hex'
	);
	v_input_fingerprint_sha256 := encode(
		extensions.digest(convert_to(p_input_snapshot::text, 'UTF8'), 'sha256'),
		'hex'
	);

	insert into public.adaptive_training_blueprint_versions (
		user_id,
		source_response_id,
		version,
		source_contract_version,
		compiler_version,
		blueprint_content,
		content_sha256
	)
	values (
		p_user_id,
		p_source_response_id,
		p_blueprint_version,
		p_source_contract_version,
		p_compiler_version,
		p_blueprint_content,
		v_blueprint_sha256
	)
	on conflict (user_id, source_response_id, version) do nothing
	returning * into v_blueprint;

	if v_blueprint.id is null then
		select * into strict v_blueprint
		from public.adaptive_training_blueprint_versions stored
		where stored.user_id = p_user_id
			and stored.source_response_id = p_source_response_id
			and stored.version = p_blueprint_version;

		if v_blueprint.source_contract_version is distinct from p_source_contract_version
			or v_blueprint.compiler_version is distinct from p_compiler_version
			or v_blueprint.blueprint_content is distinct from p_blueprint_content then
			raise exception 'The retained Blueprint version conflicts with immutable source truth.';
		end if;
	end if;

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
		v_blueprint.id,
		p_candidate_version,
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
	on conflict do nothing
	returning * into v_candidate;

	if v_candidate.id is null then
		select * into strict v_candidate
		from public.adaptive_training_detailed_candidates stored
		where stored.user_id = p_user_id
			and stored.blueprint_id = v_blueprint.id
			and stored.input_fingerprint_sha256 = v_input_fingerprint_sha256
			and stored.candidate_sha256 = v_candidate_sha256;

		if v_candidate.version is distinct from p_candidate_version
			or v_candidate.interval_start_date is distinct from p_interval_start_date
			or v_candidate.interval_end_date is distinct from p_interval_end_date
			or v_candidate.candidate_content is distinct from p_candidate_content
			or v_candidate.input_snapshot is distinct from p_input_snapshot
			or v_candidate.input_provenance is distinct from p_input_provenance
			or v_candidate.fact_references is distinct from p_fact_references
			or v_candidate.confirmation_lineage is distinct from p_confirmation_lineage then
			raise exception 'The retained detailed-block candidate conflicts with immutable source truth.';
		end if;
	end if;

	return query
	select
		v_blueprint.id,
		v_blueprint.version,
		v_blueprint.content_sha256,
		v_candidate.id,
		v_candidate.version,
		v_candidate.candidate_sha256,
		v_candidate.input_fingerprint_sha256;
end;
$$;

revoke all on function public.retain_adaptive_training_source_candidate(
	uuid,
	uuid,
	integer,
	text,
	text,
	jsonb,
	integer,
	date,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) from public, anon, authenticated;

grant execute on function public.retain_adaptive_training_source_candidate(
	uuid,
	uuid,
	integer,
	text,
	text,
	jsonb,
	integer,
	date,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) to service_role;

comment on function public.retain_adaptive_training_source_candidate(
	uuid,
	uuid,
	integer,
	text,
	text,
	jsonb,
	integer,
	date,
	date,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	jsonb
) is
	'Retains one immutable owner-bound initial candidate from either its originally accepted response or the narrowly proven immutable alias-only first-plan recompile; volatile capability revision identities are ignored only after all current material runner facts, source fingerprints, authoring inputs and version fingerprints match; creates no Calendar or confirmation rows.';
