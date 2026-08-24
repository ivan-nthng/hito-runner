alter table public.ai_plan_generation_responses
	add constraint ai_plan_generation_responses_user_id_id_key unique (user_id, id);

create table public.adaptive_training_blueprint_versions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	source_response_id uuid not null,
	version integer not null check (version > 0),
	source_contract_version text not null check (
		source_contract_version ~ '^[a-z0-9._-]{1,120}$'
	),
	compiler_version text not null check (compiler_version ~ '^[a-z0-9._-]{1,120}$'),
	blueprint_content jsonb not null check (jsonb_typeof(blueprint_content) = 'object'),
	content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
	created_at timestamptz not null default now(),
	constraint adaptive_training_blueprint_versions_owner_response_fkey
		foreign key (user_id, source_response_id)
		references public.ai_plan_generation_responses (user_id, id)
		on delete cascade,
	unique (user_id, source_response_id, version),
	unique (user_id, id)
);

create table public.adaptive_training_detailed_candidates (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	blueprint_id uuid not null,
	version integer not null check (version > 0),
	interval_start_date date not null,
	interval_end_date date not null check (interval_end_date >= interval_start_date),
	candidate_content jsonb not null check (jsonb_typeof(candidate_content) = 'object'),
	candidate_sha256 text not null check (candidate_sha256 ~ '^[0-9a-f]{64}$'),
	input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
	input_fingerprint_sha256 text not null check (
		input_fingerprint_sha256 ~ '^[0-9a-f]{64}$'
	),
	input_provenance jsonb not null check (jsonb_typeof(input_provenance) = 'object'),
	fact_references jsonb not null check (jsonb_typeof(fact_references) = 'array'),
	confirmation_lineage jsonb not null check (jsonb_typeof(confirmation_lineage) = 'object'),
	created_at timestamptz not null default now(),
	constraint adaptive_training_detailed_candidates_owner_blueprint_fkey
		foreign key (user_id, blueprint_id)
		references public.adaptive_training_blueprint_versions (user_id, id)
		on delete cascade,
	unique (user_id, blueprint_id, version),
	unique (user_id, blueprint_id, input_fingerprint_sha256, candidate_sha256)
);

create index adaptive_training_blueprint_versions_owner_created_idx
	on public.adaptive_training_blueprint_versions (user_id, created_at desc, id desc);

create index adaptive_training_detailed_candidates_owner_created_idx
	on public.adaptive_training_detailed_candidates (user_id, created_at desc, id desc);

create or replace function public.reject_adaptive_training_source_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	raise exception 'Adaptive training Blueprint versions and detailed candidates are immutable.';
end;
$$;

create trigger adaptive_training_blueprint_versions_reject_update
before update on public.adaptive_training_blueprint_versions
for each row
execute function public.reject_adaptive_training_source_update();

create trigger adaptive_training_detailed_candidates_reject_update
before update on public.adaptive_training_detailed_candidates
for each row
execute function public.reject_adaptive_training_source_update();

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
set search_path = public
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
			and response.schema_outcome = 'accepted'
			and response.compiler_outcome = 'accepted'
	) then
		raise exception 'The accepted retained source response was not found for its owner.';
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

alter table public.adaptive_training_blueprint_versions enable row level security;
alter table public.adaptive_training_detailed_candidates enable row level security;

create policy "adaptive_training_blueprint_versions_select_own"
	on public.adaptive_training_blueprint_versions for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "adaptive_training_detailed_candidates_select_own"
	on public.adaptive_training_detailed_candidates for select to authenticated
	using ((select auth.uid()) = user_id);

revoke all privileges on table public.adaptive_training_blueprint_versions
	from public, anon, authenticated, service_role;
revoke all privileges on table public.adaptive_training_detailed_candidates
	from public, anon, authenticated, service_role;
grant select on table public.adaptive_training_blueprint_versions to authenticated;
grant select on table public.adaptive_training_detailed_candidates to authenticated;
grant select, delete on table public.adaptive_training_blueprint_versions to service_role;
grant select, delete on table public.adaptive_training_detailed_candidates to service_role;

revoke all on function public.reject_adaptive_training_source_update() from public;
revoke all on function public.reject_adaptive_training_source_update() from anon;
revoke all on function public.reject_adaptive_training_source_update() from authenticated;
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

comment on table public.adaptive_training_blueprint_versions is
	'Immutable owner-private Source Authoring Blueprint versions. Projection intent is non-executable and never Calendar authority.';
comment on table public.adaptive_training_detailed_candidates is
	'Immutable owner-private detailed-block review candidates with frozen inputs and confirmation lineage; never Calendar workouts.';
comment on column public.adaptive_training_blueprint_versions.source_response_id is
	'References the existing retained completed response; raw provider JSON is not duplicated.';
comment on column public.adaptive_training_detailed_candidates.confirmation_lineage is
	'Immutable source lineage only. Calendar materialisation requires a separately reviewed confirmation boundary.';
