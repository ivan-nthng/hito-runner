-- Gate 1 keeps runner-owned recorded activity truth independent from any plan.
-- Existing workout-result rows remain a temporary comparison projection while the
-- feedback read model is migrated in a later, explicitly scoped removal gate.

create table public.runner_activities (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	sport text not null check (sport in ('run')),
	recording_kind text not null check (recording_kind in ('recorded')),
	started_at timestamptz,
	local_date date,
	historical_timezone text,
	elapsed_duration_min numeric(6, 2) check (elapsed_duration_min is null or elapsed_duration_min >= 0),
	timer_duration_min numeric(6, 2) check (timer_duration_min is null or timer_duration_min >= 0),
	distance_km numeric(7, 3) check (distance_km is null or distance_km >= 0),
	quality_state text not null default 'accepted' check (quality_state in ('accepted')),
	current_revision_id uuid,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.runner_activity_sources (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	activity_id uuid not null references public.runner_activities (id) on delete cascade,
	source_kind text not null check (source_kind in ('manual_garmin_fit')),
	source_fingerprint_sha256 text not null check (source_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
	current_revision_id uuid,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id, source_kind, source_fingerprint_sha256)
);

create table public.runner_activity_source_revisions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	source_id uuid not null references public.runner_activity_sources (id) on delete cascade,
	revision_number integer not null check (revision_number > 0),
	raw_storage_bucket text,
	raw_storage_path text,
	raw_asset_kind text not null check (raw_asset_kind in ('garmin_fit', 'garmin_zip')),
	raw_original_file_name text not null,
	raw_mime_type text not null,
	raw_file_size_bytes bigint not null check (raw_file_size_bytes > 0),
	raw_state text not null check (raw_state in ('available', 'removal_pending', 'removed')),
	observed_at timestamptz,
	capabilities jsonb not null,
	normalizer_version text not null,
	created_at timestamptz not null default now(),
	unique (source_id, revision_number),
	check (
		(raw_state in ('available', 'removal_pending') and raw_storage_bucket is not null and raw_storage_path is not null)
		or (raw_state = 'removed' and raw_storage_bucket is null and raw_storage_path is null)
	)
);

create table public.runner_activity_revisions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	activity_id uuid not null references public.runner_activities (id) on delete cascade,
	source_revision_id uuid not null references public.runner_activity_source_revisions (id) on delete restrict,
	revision_number integer not null check (revision_number > 0),
	activity_started_at timestamptz,
	activity_local_date date,
	total_elapsed_duration_min numeric(6, 2) check (total_elapsed_duration_min is null or total_elapsed_duration_min >= 0),
	total_timer_duration_min numeric(6, 2) check (total_timer_duration_min is null or total_timer_duration_min >= 0),
	total_distance_km numeric(7, 3) check (total_distance_km is null or total_distance_km >= 0),
	normalized_summary jsonb not null,
	field_provenance jsonb not null,
	normalizer_version text not null,
	created_at timestamptz not null default now(),
	unique (activity_id, revision_number),
	unique (source_revision_id)
);

create table public.runner_activity_planned_workout_matches (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	activity_id uuid not null references public.runner_activities (id) on delete cascade,
	planned_workout_id uuid references public.planned_workouts (id) on delete set null,
	source_revision_id uuid not null references public.runner_activity_source_revisions (id) on delete restrict,
	match_method text not null check (match_method in ('runner_selected')),
	created_at timestamptz not null default now(),
	unique (activity_id)
);

alter table public.runner_activities
	add constraint runner_activities_current_revision_id_fkey
	foreign key (current_revision_id)
	references public.runner_activity_revisions (id)
	on delete restrict;

alter table public.runner_activity_sources
	add constraint runner_activity_sources_current_revision_id_fkey
	foreign key (current_revision_id)
	references public.runner_activity_source_revisions (id)
	on delete restrict;

create index runner_activities_user_started_idx
	on public.runner_activities (user_id, started_at desc, id);

create index runner_activities_user_local_date_idx
	on public.runner_activities (user_id, local_date desc, id);

create index runner_activity_sources_activity_idx
	on public.runner_activity_sources (activity_id, created_at desc);

create index runner_activity_source_revisions_source_idx
	on public.runner_activity_source_revisions (source_id, revision_number desc);

create index runner_activity_revisions_activity_idx
	on public.runner_activity_revisions (activity_id, revision_number desc);

create index runner_activity_matches_workout_idx
	on public.runner_activity_planned_workout_matches (planned_workout_id, created_at desc);

alter table public.workout_comparisons
	add column comparison_formula_version text not null default 'deterministic_workout_comparison_v1';

alter table public.runner_activities enable row level security;
alter table public.runner_activity_sources enable row level security;
alter table public.runner_activity_source_revisions enable row level security;
alter table public.runner_activity_revisions enable row level security;
alter table public.runner_activity_planned_workout_matches enable row level security;

create policy "runner_activities_select_own"
	on public.runner_activities for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "runner_activity_sources_select_own"
	on public.runner_activity_sources for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "runner_activity_source_revisions_select_own"
	on public.runner_activity_source_revisions for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "runner_activity_revisions_select_own"
	on public.runner_activity_revisions for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "runner_activity_matches_select_own"
	on public.runner_activity_planned_workout_matches for select to authenticated
	using ((select auth.uid()) = user_id);

revoke all privileges on table
	public.runner_activities,
	public.runner_activity_sources,
	public.runner_activity_source_revisions,
	public.runner_activity_revisions,
	public.runner_activity_planned_workout_matches
from public, anon, authenticated, service_role;

grant select on table
	public.runner_activities,
	public.runner_activity_sources,
	public.runner_activity_source_revisions,
	public.runner_activity_revisions,
	public.runner_activity_planned_workout_matches
to authenticated;

grant select, insert, update, delete on table
	public.runner_activities,
	public.runner_activity_sources,
	public.runner_activity_source_revisions,
	public.runner_activity_revisions,
	public.runner_activity_planned_workout_matches
to service_role;

-- The legacy feedback tables are a plan-scoped projection, not activity truth.
-- A source revision owns raw evidence so plan lifecycle cascades cannot erase it.
alter table public.workout_result_assets
	drop constraint if exists workout_result_assets_storage_path_key,
	alter column planned_workout_id drop not null,
	alter column storage_bucket drop not null,
	alter column storage_path drop not null,
	add column activity_source_revision_id uuid references public.runner_activity_source_revisions (id) on delete cascade;

alter table public.workout_actual_metrics
	add column activity_id uuid references public.runner_activities (id) on delete cascade,
	add column activity_revision_id uuid references public.runner_activity_revisions (id) on delete set null;

create index workout_result_assets_activity_source_revision_idx
	on public.workout_result_assets (activity_source_revision_id);

create index workout_actual_metrics_activity_idx
	on public.workout_actual_metrics (activity_id, created_at desc);

-- Keep the review-confirmed feedback projection linked when a plan replacement
-- carries its evidence to a replacement workout. The activity remains the owner.
create or replace function public.sync_runner_activity_match_from_result_asset()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.activity_source_revision_id is not null
		and old.planned_workout_id is distinct from new.planned_workout_id then
		update public.runner_activity_planned_workout_matches
		set planned_workout_id = new.planned_workout_id
		where source_revision_id = new.activity_source_revision_id
			and planned_workout_id is not distinct from old.planned_workout_id;
	end if;
	return new;
end;
$$;

create trigger workout_result_assets_sync_runner_activity_match
	after update of planned_workout_id on public.workout_result_assets
	for each row
	execute function public.sync_runner_activity_match_from_result_asset();

create trigger runner_activities_set_updated_at
	before update on public.runner_activities
	for each row
	execute function public.set_updated_at();

create trigger runner_activity_sources_set_updated_at
	before update on public.runner_activity_sources
	for each row
	execute function public.set_updated_at();

-- One database transaction creates or advances the canonical graph. The
-- ingestion adapter supplies observed facts; it cannot leave partial pointers.
create or replace function public.persist_runner_activity_garmin_source(
	p_user_id uuid,
	p_source_fingerprint_sha256 text,
	p_source_revision jsonb,
	p_activity_revision jsonb
)
returns table (
	activity_id uuid,
	activity_revision_id uuid,
	source_id uuid,
	source_revision_id uuid,
	raw_state text,
	raw_storage_bucket text,
	raw_storage_path text,
	reused_exact_source boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
	v_source public.runner_activity_sources%rowtype;
	v_source_revision public.runner_activity_source_revisions%rowtype;
	v_activity_id uuid;
	v_source_id uuid;
	v_source_revision_id uuid;
	v_activity_revision_id uuid;
	v_next_source_revision integer;
	v_next_activity_revision integer;
begin
	select * into v_source
	from public.runner_activity_sources
	where user_id = p_user_id
		and source_kind = 'manual_garmin_fit'
		and source_fingerprint_sha256 = p_source_fingerprint_sha256
	for update;

	if found then
		select * into v_source_revision
		from public.runner_activity_source_revisions
		where id = v_source.current_revision_id
		for update;

		if v_source_revision.id is null then
			raise exception 'Canonical runner activity source is missing its current revision.';
		end if;

		if v_source_revision.raw_state = 'available' then
			return query
			select
				v_source.activity_id,
				activity.current_revision_id,
				v_source.id,
				v_source_revision.id,
				v_source_revision.raw_state,
				v_source_revision.raw_storage_bucket,
				v_source_revision.raw_storage_path,
				true
			from public.runner_activities activity
			where activity.id = v_source.activity_id
				and activity.user_id = p_user_id;
			return;
		end if;

		v_activity_id := v_source.activity_id;
		v_source_id := v_source.id;
		v_next_source_revision := v_source_revision.revision_number + 1;
		select coalesce(max(revision_number), 0) + 1 into v_next_activity_revision
	from public.runner_activity_revisions revision
	where revision.activity_id = v_activity_id;
	else
		v_activity_id := gen_random_uuid();
		v_source_id := gen_random_uuid();
		v_next_source_revision := 1;
		v_next_activity_revision := 1;

		insert into public.runner_activities (
			id, user_id, sport, recording_kind, started_at, local_date,
			historical_timezone, elapsed_duration_min, timer_duration_min,
			distance_km, quality_state
		) values (
			v_activity_id, p_user_id, 'run', 'recorded',
			nullif(p_activity_revision->>'activity_started_at', '')::timestamptz,
			nullif(p_activity_revision->>'activity_local_date', '')::date,
			nullif(p_activity_revision->>'activity_timezone', ''),
			nullif(p_activity_revision->>'total_elapsed_duration_min', '')::numeric,
			nullif(p_activity_revision->>'total_timer_duration_min', '')::numeric,
			nullif(p_activity_revision->>'total_distance_km', '')::numeric,
			'accepted'
		);

		insert into public.runner_activity_sources (
			id, user_id, activity_id, source_kind, source_fingerprint_sha256
		) values (
			v_source_id, p_user_id, v_activity_id, 'manual_garmin_fit', p_source_fingerprint_sha256
		);
	end if;

	v_source_revision_id := gen_random_uuid();
	v_activity_revision_id := gen_random_uuid();

	insert into public.runner_activity_source_revisions (
		id, user_id, source_id, revision_number, raw_storage_bucket,
		raw_storage_path, raw_asset_kind, raw_original_file_name, raw_mime_type,
		raw_file_size_bytes, raw_state, observed_at, capabilities, normalizer_version
	) values (
		v_source_revision_id, p_user_id, v_source_id, v_next_source_revision,
		p_source_revision->>'raw_storage_bucket', p_source_revision->>'raw_storage_path',
		p_source_revision->>'raw_asset_kind', p_source_revision->>'raw_original_file_name',
		p_source_revision->>'raw_mime_type', (p_source_revision->>'raw_file_size_bytes')::bigint,
		'available', nullif(p_source_revision->>'observed_at', '')::timestamptz,
		coalesce(p_source_revision->'capabilities', '{}'::jsonb), p_source_revision->>'normalizer_version'
	);

	insert into public.runner_activity_revisions (
		id, user_id, activity_id, source_revision_id, revision_number,
		activity_started_at, activity_local_date, total_elapsed_duration_min,
		total_timer_duration_min, total_distance_km, normalized_summary,
		field_provenance, normalizer_version
	) values (
		v_activity_revision_id, p_user_id, v_activity_id, v_source_revision_id,
		v_next_activity_revision,
		nullif(p_activity_revision->>'activity_started_at', '')::timestamptz,
		nullif(p_activity_revision->>'activity_local_date', '')::date,
		nullif(p_activity_revision->>'total_elapsed_duration_min', '')::numeric,
		nullif(p_activity_revision->>'total_timer_duration_min', '')::numeric,
		nullif(p_activity_revision->>'total_distance_km', '')::numeric,
		coalesce(p_activity_revision->'normalized_summary', '{}'::jsonb),
		coalesce(p_activity_revision->'field_provenance', '{}'::jsonb),
		p_activity_revision->>'normalizer_version'
	);

	update public.runner_activities
	set started_at = nullif(p_activity_revision->>'activity_started_at', '')::timestamptz,
		local_date = nullif(p_activity_revision->>'activity_local_date', '')::date,
		historical_timezone = nullif(p_activity_revision->>'activity_timezone', ''),
		elapsed_duration_min = nullif(p_activity_revision->>'total_elapsed_duration_min', '')::numeric,
		timer_duration_min = nullif(p_activity_revision->>'total_timer_duration_min', '')::numeric,
		distance_km = nullif(p_activity_revision->>'total_distance_km', '')::numeric,
		current_revision_id = v_activity_revision_id
	where id = v_activity_id and user_id = p_user_id;

	update public.runner_activity_sources
	set current_revision_id = v_source_revision_id
	where id = v_source_id and user_id = p_user_id;

	return query select v_activity_id, v_activity_revision_id, v_source_id,
		v_source_revision_id, 'available'::text,
		p_source_revision->>'raw_storage_bucket', p_source_revision->>'raw_storage_path', false;
end;
$$;

revoke execute on function public.persist_runner_activity_garmin_source(uuid, text, jsonb, jsonb)
	from public, anon, authenticated;
grant execute on function public.persist_runner_activity_garmin_source(uuid, text, jsonb, jsonb)
	to service_role;
