-- Gate 2 projects runner-owned activity truth into immutable factual snapshots.
-- It does not store another activity representation or any coaching metric.

create table public.runner_activity_fact_snapshots (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	snapshot_family text not null check (snapshot_family in ('calendar_week', 'rolling_28_day')),
	window_start date not null,
	window_end date not null,
	cutoff_date date not null,
	window_timezone_basis text not null check (window_timezone_basis = 'historical_local_date'),
	input_fingerprint_sha256 text not null check (input_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
	formula_version text not null,
	calculation_status text not null check (calculation_status = 'current'),
	facts jsonb not null,
	input_activity_revisions jsonb not null,
	exclusions jsonb not null,
	missing_field_reasons jsonb not null,
	creation_cause text not null check (
		creation_cause in ('read_reconciliation', 'ingestion', 'backfill', 'source_removal', 'activity_delete', 'correction')
	),
	created_at timestamptz not null default now(),
	check (window_start <= window_end),
	check (cutoff_date between window_start and window_end),
	unique (
		user_id,
		snapshot_family,
		window_start,
		window_end,
		cutoff_date,
		formula_version,
		input_fingerprint_sha256
	)
);

create index runner_activity_fact_snapshots_user_window_idx
	on public.runner_activity_fact_snapshots (
		user_id,
		snapshot_family,
		window_end desc,
		created_at desc
	);

create index runner_activities_user_history_idx
	on public.runner_activities (user_id, local_date desc, started_at desc, id desc);

alter table public.runner_activity_fact_snapshots enable row level security;

create policy "runner_activity_fact_snapshots_select_own"
	on public.runner_activity_fact_snapshots for select to authenticated
	using ((select auth.uid()) = user_id);

revoke all privileges on table public.runner_activity_fact_snapshots
	from public, anon, authenticated, service_role;
grant select on table public.runner_activity_fact_snapshots to authenticated;
grant select, insert, delete on table public.runner_activity_fact_snapshots to service_role;

-- Keyset pagination stays at the canonical activity boundary so callers never
-- load an unbounded history or recreate historical ordering in the browser.
create or replace function public.list_runner_activity_history_page(
	p_user_id uuid,
	p_page_size integer,
	p_cursor_sort_date date default null,
	p_cursor_sort_started_at timestamptz default null,
	p_cursor_activity_id uuid default null
)
returns table (
	activity_id uuid,
	current_revision_id uuid,
	sport text,
	recording_kind text,
	started_at timestamptz,
	local_date date,
	historical_timezone text,
	elapsed_duration_min numeric,
	timer_duration_min numeric,
	distance_km numeric,
	quality_state text,
	created_at timestamptz,
	sort_date date,
	sort_started_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
	select
		activity.id,
		activity.current_revision_id,
		activity.sport,
		activity.recording_kind,
		activity.started_at,
		activity.local_date,
		activity.historical_timezone,
		activity.elapsed_duration_min,
		activity.timer_duration_min,
		activity.distance_km,
		activity.quality_state,
		activity.created_at,
		coalesce(activity.local_date, activity.started_at::date, activity.created_at::date),
		coalesce(
			activity.started_at,
			activity.local_date::timestamp at time zone 'UTC',
			activity.created_at
		)
	from public.runner_activities activity
	where activity.user_id = p_user_id
		and activity.sport = 'run'
		and activity.recording_kind = 'recorded'
		and activity.quality_state = 'accepted'
		and (
			p_cursor_sort_date is null
			or (
				p_cursor_sort_started_at is not null
				and p_cursor_activity_id is not null
				and (
					coalesce(activity.local_date, activity.started_at::date, activity.created_at::date),
					coalesce(
						activity.started_at,
						activity.local_date::timestamp at time zone 'UTC',
						activity.created_at
					),
					activity.id
				) < (p_cursor_sort_date, p_cursor_sort_started_at, p_cursor_activity_id)
			)
		)
	order by
		coalesce(activity.local_date, activity.started_at::date, activity.created_at::date) desc,
		coalesce(
			activity.started_at,
			activity.local_date::timestamp at time zone 'UTC',
			activity.created_at
		) desc,
		activity.id desc
	limit greatest(1, least(p_page_size, 101));
$$;

revoke execute on function public.list_runner_activity_history_page(uuid, integer, date, timestamptz, uuid)
	from public, anon, authenticated;
grant execute on function public.list_runner_activity_history_page(uuid, integer, date, timestamptz, uuid)
	to service_role;

-- Profile contribution removal and canonical history deletion are one database
-- transaction. Raw storage deletion remains the source-retention owner's step.
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
