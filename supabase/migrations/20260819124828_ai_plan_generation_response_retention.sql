create table public.ai_plan_generation_responses (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	generation_id text not null check (generation_id ~ '^[A-Za-z0-9._-]{1,160}$'),
	provider_response_id text check (
		provider_response_id is null
		or provider_response_id ~ '^[A-Za-z0-9._-]{1,200}$'
	),
	response_body text not null check (length(response_body) > 0),
	response_sha256 text not null check (response_sha256 ~ '^[0-9a-f]{64}$'),
	schema_outcome text not null default 'not_run' check (
		schema_outcome in ('not_run', 'accepted', 'rejected')
	),
	compiler_outcome text not null default 'not_run' check (
		compiler_outcome in ('not_run', 'accepted', 'rejected')
	),
	diagnostic_code text check (
		diagnostic_code is null
		or diagnostic_code ~ '^[a-z0-9._-]{1,120}$'
	),
	diagnostic_path text check (
		diagnostic_path is null
		or diagnostic_path ~ '^[A-Za-z0-9._\[\]-]{1,240}$'
	),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id, generation_id)
);

create unique index ai_plan_generation_responses_owner_provider_id_idx
	on public.ai_plan_generation_responses (user_id, provider_response_id)
	where provider_response_id is not null;

create index ai_plan_generation_responses_owner_created_idx
	on public.ai_plan_generation_responses (user_id, created_at desc, id desc);

create or replace function public.protect_ai_plan_generation_response_retention()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	if new.user_id is distinct from old.user_id
		or new.generation_id is distinct from old.generation_id
		or new.provider_response_id is distinct from old.provider_response_id
		or new.response_body is distinct from old.response_body
		or new.response_sha256 is distinct from old.response_sha256 then
		raise exception 'AI plan generation response identity and body are immutable.';
	end if;

	if old.schema_outcome <> 'not_run'
		and new.schema_outcome is distinct from old.schema_outcome then
		raise exception 'AI plan generation schema outcome is final.';
	end if;

	if old.compiler_outcome <> 'not_run'
		and new.compiler_outcome is distinct from old.compiler_outcome then
		raise exception 'AI plan generation compiler outcome is final.';
	end if;

	if (old.schema_outcome <> 'not_run' or old.compiler_outcome <> 'not_run')
		and (
			new.diagnostic_code is distinct from old.diagnostic_code
			or new.diagnostic_path is distinct from old.diagnostic_path
		) then
		raise exception 'AI plan generation diagnostic is final.';
	end if;

	return new;
end;
$$;

create trigger ai_plan_generation_responses_protect_retention
before update on public.ai_plan_generation_responses
for each row
execute function public.protect_ai_plan_generation_response_retention();

create trigger ai_plan_generation_responses_set_updated_at
before update on public.ai_plan_generation_responses
for each row
execute function public.set_updated_at();

alter table public.ai_plan_generation_responses enable row level security;

create policy "ai_plan_generation_responses_select_own"
	on public.ai_plan_generation_responses for select to authenticated
	using ((select auth.uid()) = user_id);

revoke all privileges on table public.ai_plan_generation_responses
	from public, anon, authenticated, service_role;
grant select on table public.ai_plan_generation_responses to authenticated;
grant select, insert, update, delete on table public.ai_plan_generation_responses to service_role;

revoke all on function public.protect_ai_plan_generation_response_retention() from public;
revoke all on function public.protect_ai_plan_generation_response_retention() from anon;
revoke all on function public.protect_ai_plan_generation_response_retention() from authenticated;

comment on table public.ai_plan_generation_responses is
	'Owner-private exact JSON returned by completed AI plan generation, retained before schema/compiler policy and never Calendar authority.';
comment on column public.ai_plan_generation_responses.response_body is
	'Exact parseable JSON text only; excludes provider envelopes, prompts, credentials, and tokens.';
comment on column public.ai_plan_generation_responses.schema_outcome is
	'Provider JSON schema result; not_run until that boundary executes.';
comment on column public.ai_plan_generation_responses.compiler_outcome is
	'Compiler-policy result; not_run until that boundary executes.';
