alter table public.runner_profiles
	add column if not exists first_name text,
	add column if not exists last_name text,
	add column if not exists display_name text,
	add column if not exists avatar_url text,
	add column if not exists avatar_storage_path text,
	add column if not exists age smallint check (age is null or age between 0 and 120),
	add column if not exists weight_kg numeric(5, 2) check (weight_kg is null or weight_kg between 0 and 500),
	add column if not exists height_cm numeric(5, 2) check (height_cm is null or height_cm between 0 and 300);

alter table public.workout_logs
	add column if not exists body_notes jsonb not null default '[]'::jsonb
	check (jsonb_typeof(body_notes) = 'array');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'profile-avatars',
	'profile-avatars',
	true,
	5242880,
	array[
		'image/jpeg',
		'image/png',
		'image/webp'
	]
)
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;
