create table public.workout_result_assets (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	planned_workout_id uuid not null references public.planned_workouts (id) on delete cascade,
	workout_log_id uuid references public.workout_logs (id) on delete set null,
	asset_kind text not null check (asset_kind in ('garmin_zip', 'garmin_fit')),
	storage_bucket text not null,
	storage_path text not null unique,
	original_file_name text not null,
	mime_type text not null,
	file_size_bytes bigint not null check (file_size_bytes > 0),
	parse_status text not null check (parse_status in ('uploaded', 'extracted', 'parsed', 'failed')),
	primary_file_kind text check (primary_file_kind is null or primary_file_kind in ('fit')),
	primary_file_name text,
	parse_error text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index workout_result_assets_user_created_idx
	on public.workout_result_assets (user_id, created_at desc);

create index workout_result_assets_planned_workout_created_idx
	on public.workout_result_assets (planned_workout_id, created_at desc);

create table public.workout_actual_metrics (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	planned_workout_id uuid not null references public.planned_workouts (id) on delete cascade,
	workout_log_id uuid references public.workout_logs (id) on delete set null,
	result_asset_id uuid not null references public.workout_result_assets (id) on delete cascade,
	source_kind text not null check (source_kind in ('garmin_fit')),
	status text not null check (status in ('normalized', 'reviewed', 'superseded')),
	activity_started_at timestamptz,
	activity_local_date date,
	actual_duration_min numeric(6, 2) check (actual_duration_min is null or actual_duration_min >= 0),
	actual_distance_km numeric(6, 2) check (actual_distance_km is null or actual_distance_km >= 0),
	actual_avg_hr integer,
	actual_max_hr integer,
	actual_avg_power integer,
	actual_max_power integer,
	actual_avg_cadence integer,
	actual_calories integer,
	actual_elevation_gain_m integer,
	actual_elevation_loss_m integer,
	actual_interval_count integer check (actual_interval_count is null or actual_interval_count >= 0),
	actual_step_payload jsonb,
	lap_payload jsonb,
	summary_payload jsonb not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index workout_actual_metrics_planned_workout_created_idx
	on public.workout_actual_metrics (planned_workout_id, created_at desc);

create index workout_actual_metrics_asset_idx
	on public.workout_actual_metrics (result_asset_id);

create trigger workout_result_assets_set_updated_at
before update on public.workout_result_assets
for each row
execute function public.set_updated_at();

create trigger workout_actual_metrics_set_updated_at
before update on public.workout_actual_metrics
for each row
execute function public.set_updated_at();

alter table public.workout_result_assets enable row level security;
alter table public.workout_actual_metrics enable row level security;

create policy "workout_result_assets_select_own"
	on public.workout_result_assets
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "workout_result_assets_insert_own"
	on public.workout_result_assets
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "workout_result_assets_update_own"
	on public.workout_result_assets
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "workout_actual_metrics_select_own"
	on public.workout_actual_metrics
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "workout_actual_metrics_insert_own"
	on public.workout_actual_metrics
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "workout_actual_metrics_update_own"
	on public.workout_actual_metrics
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'workout-result-assets',
	'workout-result-assets',
	false,
	26214400,
	array[
		'application/octet-stream',
		'application/zip',
		'application/x-zip-compressed'
	]
)
on conflict (id) do nothing;
