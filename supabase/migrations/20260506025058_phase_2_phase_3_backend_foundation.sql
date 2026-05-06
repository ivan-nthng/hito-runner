create extension if not exists pgcrypto;

create type public.runner_goal_type as enum (
	'build_consistency',
	'first_race',
	'distance_build'
);

create type public.plan_cycle_status as enum ('active', 'archived');

create type public.workout_type as enum (
	'easy',
	'steady_or_easy',
	'rest',
	'long_run',
	'quality'
);

create type public.workout_outcome as enum ('completed', 'partial', 'skipped');

create type public.runner_setup_state as enum ('completed');

create table public.runner_profiles (
	user_id uuid primary key references auth.users (id) on delete cascade,
	goal_type public.runner_goal_type not null,
	goal_label text not null,
	baseline_sessions_per_week smallint not null check (baseline_sessions_per_week between 0 and 7),
	baseline_long_run_km numeric(5, 2) not null check (baseline_long_run_km between 0 and 80),
	baseline_notes text,
	setup_state public.runner_setup_state not null default 'completed',
	setup_completed_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.plan_cycles (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	status public.plan_cycle_status not null default 'active',
	title text not null,
	goal_summary text not null,
	source_template text not null,
	start_date date not null,
	end_date date not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create unique index plan_cycles_one_active_per_user_idx
	on public.plan_cycles (user_id)
	where status = 'active';

create table public.planned_workouts (
	id uuid primary key default gen_random_uuid(),
	plan_cycle_id uuid not null references public.plan_cycles (id) on delete cascade,
	user_id uuid not null references auth.users (id) on delete cascade,
	workout_date date not null,
	weekday text not null,
	week_number integer not null check (week_number >= 1),
	phase text not null,
	workout_type public.workout_type not null,
	title text not null,
	notes text,
	steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
	display_order integer not null check (display_order >= 0),
	created_at timestamptz not null default now(),
	unique (plan_cycle_id, workout_date)
);

create index planned_workouts_user_date_idx on public.planned_workouts (user_id, workout_date);

create table public.workout_logs (
	id uuid primary key default gen_random_uuid(),
	planned_workout_id uuid not null unique references public.planned_workouts (id) on delete cascade,
	user_id uuid not null references auth.users (id) on delete cascade,
	outcome public.workout_outcome not null,
	actual_distance_km numeric(5, 2) check (actual_distance_km is null or actual_distance_km >= 0),
	actual_duration_min integer check (actual_duration_min is null or actual_duration_min >= 0),
	rpe integer check (rpe is null or rpe between 1 and 10),
	notes text,
	intervals_completed integer check (intervals_completed is null or intervals_completed >= 0),
	logged_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create or replace function public.sync_workout_log_user_id()
returns trigger
language plpgsql
as $$
declare
	resolved_user_id uuid;
begin
	select user_id
	into resolved_user_id
	from public.planned_workouts
	where id = new.planned_workout_id;

	if resolved_user_id is null then
		raise exception 'planned_workout_id % does not exist', new.planned_workout_id;
	end if;

	new.user_id = resolved_user_id;
	return new;
end;
$$;

create trigger runner_profiles_set_updated_at
before update on public.runner_profiles
for each row
execute function public.set_updated_at();

create trigger plan_cycles_set_updated_at
before update on public.plan_cycles
for each row
execute function public.set_updated_at();

create trigger workout_logs_set_updated_at
before update on public.workout_logs
for each row
execute function public.set_updated_at();

create trigger workout_logs_sync_user_id
before insert or update on public.workout_logs
for each row
execute function public.sync_workout_log_user_id();

alter table public.runner_profiles enable row level security;
alter table public.plan_cycles enable row level security;
alter table public.planned_workouts enable row level security;
alter table public.workout_logs enable row level security;

create policy "runner_profiles_select_own"
	on public.runner_profiles
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "runner_profiles_insert_own"
	on public.runner_profiles
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "runner_profiles_update_own"
	on public.runner_profiles
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "plan_cycles_select_own"
	on public.plan_cycles
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "plan_cycles_insert_own"
	on public.plan_cycles
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "plan_cycles_update_own"
	on public.plan_cycles
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "planned_workouts_select_own"
	on public.planned_workouts
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "planned_workouts_insert_own"
	on public.planned_workouts
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "planned_workouts_update_own"
	on public.planned_workouts
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "workout_logs_select_own"
	on public.workout_logs
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "workout_logs_insert_own"
	on public.workout_logs
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "workout_logs_update_own"
	on public.workout_logs
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
