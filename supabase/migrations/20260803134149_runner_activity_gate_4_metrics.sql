-- Gate 4 adds immutable runner assertions and derived metric truth to the
-- existing canonical activity graph. It does not persist streams or create a
-- second activity/profile owner.

alter table public.runner_activities
	alter column distance_km type numeric(9, 4);

alter table public.runner_activity_revisions
	alter column total_distance_km type numeric(9, 4);

create table public.runner_activity_evidence_revisions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	activity_id uuid not null references public.runner_activities (id) on delete cascade,
	activity_revision_id uuid not null references public.runner_activity_revisions (id) on delete cascade,
	evidence_kind text not null check (evidence_kind in ('session_rpe', 'official_result')),
	revision_number integer not null check (revision_number > 0),
	predecessor_revision_id uuid references public.runner_activity_evidence_revisions (id) on delete set null,
	lifecycle_state text not null check (lifecycle_state in ('asserted', 'withdrawn')),
	session_rpe integer check (session_rpe is null or session_rpe between 1 and 10),
	completion_outcome text check (completion_outcome is null or completion_outcome in ('completed', 'partial', 'skipped')),
	official_distance_m numeric(9, 3),
	official_elapsed_seconds numeric(10, 3),
	official_event_date date,
	official_context text check (official_context is null or char_length(official_context) <= 200),
	origin text not null check (origin in ('runner_direct', 'workout_log_backfill')),
	workout_log_id uuid references public.workout_logs (id) on delete set null,
	change_reason text not null check (
		change_reason in ('initial', 'correction', 'withdrawal', 'workout_log_sync', 'activity_revision_changed')
	),
	captured_at timestamptz not null,
	actor_user_id uuid not null references auth.users (id) on delete cascade,
	created_at timestamptz not null default now(),
	unique (activity_id, evidence_kind, revision_number),
	check (
		(
			evidence_kind = 'session_rpe'
			and official_distance_m is null
			and official_elapsed_seconds is null
			and official_event_date is null
			and official_context is null
			and (
				(lifecycle_state = 'asserted' and session_rpe is not null and completion_outcome in ('completed', 'partial'))
				or (lifecycle_state = 'withdrawn' and session_rpe is null and completion_outcome in ('completed', 'partial', 'skipped'))
			)
		)
		or (
			evidence_kind = 'official_result'
			and session_rpe is null
			and completion_outcome is null
			and (
				(
					lifecycle_state = 'asserted'
					and official_distance_m = any (array[
						1000::numeric, 1609.344::numeric, 5000::numeric, 10000::numeric,
						15000::numeric, 21097.5::numeric, 42195::numeric, 50000::numeric,
						80467.2::numeric, 100000::numeric, 160934.4::numeric
					])
					and official_elapsed_seconds > 0
					and official_event_date is not null
				)
				or (
					lifecycle_state = 'withdrawn'
					and official_distance_m is null
					and official_elapsed_seconds is null
					and official_event_date is null
					and official_context is null
				)
			)
		)
	)
);

create index runner_activity_evidence_user_activity_idx
	on public.runner_activity_evidence_revisions (user_id, activity_id, evidence_kind, revision_number desc);

create table public.runner_activity_metric_observations (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	activity_id uuid not null references public.runner_activities (id) on delete cascade,
	activity_revision_id uuid not null references public.runner_activity_revisions (id) on delete cascade,
	source_revision_id uuid not null references public.runner_activity_source_revisions (id) on delete cascade,
	evidence_revision_id uuid references public.runner_activity_evidence_revisions (id) on delete cascade,
	metric_key text not null check (metric_key in ('personal_best_elapsed', 'session_rpe_load')),
	metric_variant text not null,
	metric_formula_version text not null,
	availability text not null check (availability in ('available', 'unavailable')),
	value numeric,
	unit text not null check (unit in ('seconds', 'arbitrary_units')),
	analyzed_bounds jsonb not null,
	eligibility jsonb not null,
	exclusions jsonb not null,
	comparability_cohort text,
	confidence text not null check (confidence in ('complete', 'partial', 'unavailable')),
	observation_count integer not null default 1 check (observation_count > 0),
	unavailable_reason text,
	input_fingerprint_sha256 text not null check (input_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
	calculated_at timestamptz not null default now(),
	unique (user_id, metric_key, metric_formula_version, input_fingerprint_sha256),
	check (
		(availability = 'available' and value is not null and confidence in ('complete', 'partial') and unavailable_reason is null)
		or (availability = 'unavailable' and value is null and confidence = 'unavailable' and unavailable_reason is not null)
	)
);

create index runner_activity_metric_observations_user_metric_idx
	on public.runner_activity_metric_observations (user_id, metric_key, metric_formula_version, calculated_at desc);

create table public.runner_activity_metric_snapshots (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	as_of_date date not null,
	formula_set_version text not null,
	formula_versions jsonb not null,
	input_fingerprint_sha256 text not null check (input_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
	calculation_status text not null check (calculation_status = 'current'),
	metric_payload jsonb not null,
	observation_ids jsonb not null,
	input_activity_revisions jsonb not null,
	input_evidence_revisions jsonb not null,
	creation_cause text not null check (
		creation_cause in (
			'read_reconciliation', 'ingestion', 'backfill', 'source_removal',
			'activity_delete', 'correction', 'evidence_mutation', 'formula_recalculation'
		)
	),
	created_at timestamptz not null default now(),
	unique (user_id, as_of_date, formula_set_version, input_fingerprint_sha256)
);

create index runner_activity_metric_snapshots_user_date_idx
	on public.runner_activity_metric_snapshots (user_id, as_of_date desc, created_at desc);

alter table public.runner_activity_evidence_revisions enable row level security;
alter table public.runner_activity_metric_observations enable row level security;
alter table public.runner_activity_metric_snapshots enable row level security;

create policy "runner_activity_evidence_select_own"
	on public.runner_activity_evidence_revisions for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "runner_activity_metric_observations_select_own"
	on public.runner_activity_metric_observations for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "runner_activity_metric_snapshots_select_own"
	on public.runner_activity_metric_snapshots for select to authenticated
	using ((select auth.uid()) = user_id);

revoke all privileges on table
	public.runner_activity_evidence_revisions,
	public.runner_activity_metric_observations,
	public.runner_activity_metric_snapshots
from public, anon, authenticated, service_role;

grant select on table
	public.runner_activity_evidence_revisions,
	public.runner_activity_metric_observations,
	public.runner_activity_metric_snapshots
to authenticated;

grant select, insert, delete on table
	public.runner_activity_evidence_revisions,
	public.runner_activity_metric_observations,
	public.runner_activity_metric_snapshots
to service_role;

create or replace function public.append_runner_activity_evidence_revision(
	p_user_id uuid,
	p_activity_id uuid,
	p_expected_activity_revision_id uuid,
	p_evidence_kind text,
	p_lifecycle_state text,
	p_session_rpe integer default null,
	p_completion_outcome text default null,
	p_official_distance_m numeric default null,
	p_official_elapsed_seconds numeric default null,
	p_official_event_date date default null,
	p_official_context text default null,
	p_origin text default 'runner_direct',
	p_workout_log_id uuid default null,
	p_change_reason text default 'initial',
	p_captured_at timestamptz default now(),
	p_expected_predecessor_id uuid default null
)
returns table (
	evidence_revision_id uuid,
	revision_number integer,
	reused_exact_evidence boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
	v_activity public.runner_activities%rowtype;
	v_previous public.runner_activity_evidence_revisions%rowtype;
	v_next_revision integer;
	v_inserted_id uuid;
begin
	select * into v_activity
	from public.runner_activities
	where id = p_activity_id and user_id = p_user_id
	for update;

	if v_activity.id is null then
		raise exception 'Runner activity was not found.';
	end if;

	if v_activity.current_revision_id is distinct from p_expected_activity_revision_id then
		raise exception 'Runner activity revision is stale.';
	end if;

	if p_evidence_kind not in ('session_rpe', 'official_result')
		or p_lifecycle_state not in ('asserted', 'withdrawn')
		or p_origin not in ('runner_direct', 'workout_log_backfill') then
		raise exception 'Runner activity evidence metadata is invalid.';
	end if;

	select * into v_previous
	from public.runner_activity_evidence_revisions
	where activity_id = p_activity_id and evidence_kind = p_evidence_kind
	order by revision_number desc
	limit 1;

	if p_change_reason = 'initial' and v_previous.id is not null then
		raise exception 'Runner activity evidence already exists.';
	end if;

	if p_change_reason in ('correction', 'withdrawal')
		and (v_previous.id is null or v_previous.id is distinct from p_expected_predecessor_id) then
		raise exception 'Runner activity evidence revision is stale.';
	end if;

	if v_previous.id is not null
		and v_previous.activity_revision_id = p_expected_activity_revision_id
		and v_previous.lifecycle_state = p_lifecycle_state
		and v_previous.session_rpe is not distinct from p_session_rpe
		and v_previous.completion_outcome is not distinct from p_completion_outcome
		and v_previous.official_distance_m is not distinct from p_official_distance_m
		and v_previous.official_elapsed_seconds is not distinct from p_official_elapsed_seconds
		and v_previous.official_event_date is not distinct from p_official_event_date
		and v_previous.official_context is not distinct from nullif(trim(p_official_context), '')
		and v_previous.origin = p_origin
		and v_previous.workout_log_id is not distinct from p_workout_log_id then
		return query select v_previous.id, v_previous.revision_number, true;
		return;
	end if;

	v_next_revision := coalesce(v_previous.revision_number, 0) + 1;

	insert into public.runner_activity_evidence_revisions (
		user_id, activity_id, activity_revision_id, evidence_kind, revision_number,
		predecessor_revision_id, lifecycle_state, session_rpe, completion_outcome,
		official_distance_m, official_elapsed_seconds, official_event_date, official_context,
		origin, workout_log_id, change_reason, captured_at, actor_user_id
	) values (
		p_user_id, p_activity_id, p_expected_activity_revision_id, p_evidence_kind, v_next_revision,
		v_previous.id, p_lifecycle_state, p_session_rpe, p_completion_outcome,
		p_official_distance_m, p_official_elapsed_seconds, p_official_event_date,
		nullif(trim(p_official_context), ''), p_origin, p_workout_log_id, p_change_reason,
		p_captured_at, p_user_id
	)
	returning id into v_inserted_id;

	return query select v_inserted_id, v_next_revision, false;
end;
$$;

revoke execute on function public.append_runner_activity_evidence_revision(
	uuid, uuid, uuid, text, text, integer, text, numeric, numeric, date, text,
	text, uuid, text, timestamptz, uuid
) from public, anon, authenticated;
grant execute on function public.append_runner_activity_evidence_revision(
	uuid, uuid, uuid, text, text, integer, text, numeric, numeric, date, text,
	text, uuid, text, timestamptz, uuid
) to service_role;

create or replace function public.sync_workout_log_runner_activity_rpe(
	p_user_id uuid,
	p_planned_workout_id uuid,
	p_change_reason text default 'workout_log_sync',
	p_removed_workout_log_id uuid default null,
	p_removed_completion_outcome text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_log public.workout_logs%rowtype;
	v_activity public.runner_activities%rowtype;
	v_previous public.runner_activity_evidence_revisions%rowtype;
	v_match_count integer;
	v_state text;
begin
	select * into v_log
	from public.workout_logs
	where user_id = p_user_id and planned_workout_id = p_planned_workout_id;

	select count(*)
	into v_match_count
	from public.runner_activity_planned_workout_matches
	where user_id = p_user_id and planned_workout_id = p_planned_workout_id;

	if v_match_count <> 1 then
		return;
	end if;

	select * into v_activity
	from public.runner_activities activity
	where activity.user_id = p_user_id
		and activity.id = (
			select match.activity_id
			from public.runner_activity_planned_workout_matches match
			where match.user_id = p_user_id
				and match.planned_workout_id = p_planned_workout_id
			limit 1
		);

	if v_activity.current_revision_id is null then
		return;
	end if;

	select * into v_previous
	from public.runner_activity_evidence_revisions
	where user_id = p_user_id
		and activity_id = v_activity.id
		and evidence_kind = 'session_rpe'
	order by revision_number desc
	limit 1;

	if p_removed_workout_log_id is not null then
		if v_previous.id is null
			or v_previous.origin <> 'workout_log_backfill' then
			return;
		end if;

		perform public.append_runner_activity_evidence_revision(
			p_user_id,
			v_activity.id,
			v_activity.current_revision_id,
			'session_rpe',
			'withdrawn',
			null,
			p_removed_completion_outcome,
			null, null, null, null,
			'workout_log_backfill',
			null,
			p_change_reason,
			now(),
			null
		);
		return;
	end if;

	if v_log.id is null then
		return;
	end if;

	if v_previous.id is not null and v_previous.captured_at > v_log.updated_at then
		return;
	end if;

	v_state := case
		when v_log.outcome in ('completed', 'partial') and v_log.rpe is not null then 'asserted'
		else 'withdrawn'
	end;

	perform public.append_runner_activity_evidence_revision(
		p_user_id,
		v_activity.id,
		v_activity.current_revision_id,
		'session_rpe',
		v_state,
		case when v_state = 'asserted' then v_log.rpe else null end,
		v_log.outcome::text,
		null, null, null, null,
		'workout_log_backfill',
		v_log.id,
		p_change_reason,
		v_log.updated_at,
		null
	);
end;
$$;

revoke execute on function public.sync_workout_log_runner_activity_rpe(
	uuid, uuid, text, uuid, text
)
	from public, anon, authenticated, service_role;

create or replace function public.sync_workout_log_runner_activity_rpe_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if tg_op = 'DELETE' then
		perform public.sync_workout_log_runner_activity_rpe(
			old.user_id,
			old.planned_workout_id,
			'workout_log_sync',
			old.id,
			old.outcome::text
		);
		return old;
	end if;

	if tg_op = 'UPDATE' and old.planned_workout_id is distinct from new.planned_workout_id then
		perform public.sync_workout_log_runner_activity_rpe(old.user_id, old.planned_workout_id);
	end if;

	perform public.sync_workout_log_runner_activity_rpe(new.user_id, new.planned_workout_id);
	return new;
end;
$$;

create or replace function public.sync_runner_activity_match_rpe_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if tg_op = 'DELETE' then
		perform public.sync_workout_log_runner_activity_rpe(old.user_id, old.planned_workout_id);
		return old;
	end if;

	if tg_op = 'UPDATE' and (
		old.user_id is distinct from new.user_id
		or old.planned_workout_id is distinct from new.planned_workout_id
	) then
		perform public.sync_workout_log_runner_activity_rpe(old.user_id, old.planned_workout_id);
	end if;

	perform public.sync_workout_log_runner_activity_rpe(new.user_id, new.planned_workout_id);
	return new;
end;
$$;

create trigger workout_logs_sync_runner_activity_rpe
	after insert or update or delete on public.workout_logs
	for each row execute function public.sync_workout_log_runner_activity_rpe_trigger();

create trigger runner_activity_matches_sync_runner_activity_rpe
	after insert or update or delete on public.runner_activity_planned_workout_matches
	for each row execute function public.sync_runner_activity_match_rpe_trigger();

create or replace function public.sync_runner_activity_revision_rpe_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_match public.runner_activity_planned_workout_matches%rowtype;
	v_match_count integer;
	v_evidence public.runner_activity_evidence_revisions%rowtype;
begin
	select count(*) into v_match_count
	from public.runner_activity_planned_workout_matches
	where user_id = new.user_id and activity_id = new.id;

	if v_match_count <> 1 then
		return new;
	end if;

	select * into v_match
	from public.runner_activity_planned_workout_matches
	where user_id = new.user_id and activity_id = new.id;

	select * into v_evidence
	from public.runner_activity_evidence_revisions
	where user_id = new.user_id
		and activity_id = new.id
		and evidence_kind = 'session_rpe'
	order by revision_number desc
	limit 1;

	if v_evidence.id is not null then
		perform public.append_runner_activity_evidence_revision(
			new.user_id,
			new.id,
			new.current_revision_id,
			'session_rpe',
			v_evidence.lifecycle_state,
			v_evidence.session_rpe,
			v_evidence.completion_outcome,
			null, null, null, null,
			v_evidence.origin,
			v_evidence.workout_log_id,
			'activity_revision_changed',
			v_evidence.captured_at,
			null
		);
	elsif v_match.planned_workout_id is not null then
		perform public.sync_workout_log_runner_activity_rpe(
			new.user_id,
			v_match.planned_workout_id,
			'activity_revision_changed'
		);
	end if;

	return new;
end;
$$;

create trigger runner_activities_sync_revision_rpe
	after update of current_revision_id on public.runner_activities
	for each row
	when (old.current_revision_id is distinct from new.current_revision_id)
	execute function public.sync_runner_activity_revision_rpe_trigger();

-- Backfill only exact one-log/one-match/one-current-activity relations. Ambiguous
-- planned-workout links remain unavailable rather than being guessed.
do $$
declare
	v_relation record;
begin
	for v_relation in
		select log.user_id, log.planned_workout_id
		from public.workout_logs log
		join public.runner_activity_planned_workout_matches match
			on match.user_id = log.user_id
			and match.planned_workout_id = log.planned_workout_id
		group by log.user_id, log.planned_workout_id
		having count(match.id) = 1
	loop
		perform public.sync_workout_log_runner_activity_rpe(
			v_relation.user_id,
			v_relation.planned_workout_id
		);
	end loop;
end;
$$;

create or replace function public.delete_runner_activity_from_history(
	p_user_id uuid,
	p_activity_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
	v_deleted_id uuid;
begin
	delete from public.runner_activity_fact_snapshots
	where user_id = p_user_id;

	delete from public.runner_activity_metric_snapshots
	where user_id = p_user_id;

	delete from public.runner_activities
	where id = p_activity_id and user_id = p_user_id
	returning id into v_deleted_id;

	if v_deleted_id is null then
		raise exception 'Runner activity was not found.';
	end if;

	return true;
end;
$$;

revoke execute on function public.delete_runner_activity_from_history(uuid, uuid)
	from public, anon, authenticated;
grant execute on function public.delete_runner_activity_from_history(uuid, uuid)
	to service_role;
