alter table public.ai_plan_generation_responses
	add column request_context jsonb check (
		request_context is null or jsonb_typeof(request_context) = 'object'
	),
	add column request_fingerprint_sha256 text check (
		request_fingerprint_sha256 is null
		or request_fingerprint_sha256 ~ '^[0-9a-f]{64}$'
	),
	add column version_context jsonb check (
		version_context is null or jsonb_typeof(version_context) = 'object'
	),
	add column version_fingerprint_sha256 text check (
		version_fingerprint_sha256 is null
		or version_fingerprint_sha256 ~ '^[0-9a-f]{64}$'
	),
	add column provider_model text check (
		provider_model is null or length(provider_model) between 1 and 160
	),
	add column provider_attempt jsonb check (
		provider_attempt is null or jsonb_typeof(provider_attempt) = 'object'
	),
	add column attempt_result jsonb check (
		attempt_result is null or jsonb_typeof(attempt_result) = 'object'
	),
	add column running_coach_verdict jsonb check (
		running_coach_verdict is null or jsonb_typeof(running_coach_verdict) = 'object'
	),
	add column qa_verdict jsonb check (
		qa_verdict is null or jsonb_typeof(qa_verdict) = 'object'
	),
	add constraint ai_plan_generation_responses_attempt_context_complete check (
		(request_context is null
			and request_fingerprint_sha256 is null
			and version_context is null
			and version_fingerprint_sha256 is null
			and provider_model is null
			and provider_attempt is null)
		or
		(request_context is not null
			and request_fingerprint_sha256 is not null
			and version_context is not null
			and version_fingerprint_sha256 is not null
			and provider_model is not null
			and provider_attempt is not null)
	);

create index ai_plan_generation_responses_owner_request_context_idx
	on public.ai_plan_generation_responses (
		user_id,
		request_fingerprint_sha256,
		version_fingerprint_sha256,
		created_at desc
	)
	where request_fingerprint_sha256 is not null;

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

	if old.request_context is not null
		and (
			new.request_context is distinct from old.request_context
			or new.request_fingerprint_sha256 is distinct from old.request_fingerprint_sha256
			or new.version_context is distinct from old.version_context
			or new.version_fingerprint_sha256 is distinct from old.version_fingerprint_sha256
			or new.provider_model is distinct from old.provider_model
			or new.provider_attempt is distinct from old.provider_attempt
		) then
		raise exception 'AI plan generation request lineage is immutable.';
	end if;

	if old.attempt_result is not null
		and new.attempt_result is distinct from old.attempt_result then
		raise exception 'AI plan generation attempt result is final.';
	end if;

	if old.running_coach_verdict is not null
		and new.running_coach_verdict is distinct from old.running_coach_verdict then
		raise exception 'AI plan generation Running Coach verdict is final.';
	end if;

	if old.qa_verdict is not null
		and new.qa_verdict is distinct from old.qa_verdict then
		raise exception 'AI plan generation QA verdict is final.';
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

comment on column public.ai_plan_generation_responses.request_context is
	'Exact owner-private server-normalized request facts for one provider attempt; never Calendar or UI authority.';
comment on column public.ai_plan_generation_responses.request_fingerprint_sha256 is
	'Content address over request context, provider model, prompt hash and exact relevant version context.';
comment on column public.ai_plan_generation_responses.version_context is
	'Exact schema, prompt, policy and compiler version identifiers frozen for the provider attempt.';
comment on column public.ai_plan_generation_responses.provider_attempt is
	'Private request hashes, provider-reported usage, timestamps and latency; excludes credentials and raw prompts.';
comment on column public.ai_plan_generation_responses.attempt_result is
	'Immutable technical candidate, rejection or explicit no-prescription outcome for the retained response.';
comment on column public.ai_plan_generation_responses.running_coach_verdict is
	'One immutable privacy-safe Running Coach verdict appended after candidate review.';
comment on column public.ai_plan_generation_responses.qa_verdict is
	'One immutable privacy-safe QA verdict appended after candidate verification.';
