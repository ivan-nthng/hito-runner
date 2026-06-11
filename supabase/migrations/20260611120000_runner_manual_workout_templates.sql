create table if not exists public.runner_manual_workout_templates (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	display_name text not null check (
		char_length(trim(display_name)) between 1 and 80
		and display_name !~ '[[:cntrl:]]'
	),
	icon_key text not null check (
		icon_key in (
			'rest',
			'recovery',
			'easy',
			'steady',
			'long',
			'tempo',
			'intervals',
			'progression',
			'race',
			'hills',
			'trail'
		)
	),
	template_key text not null check (char_length(trim(template_key)) between 1 and 120),
	template_version text not null default 'manual_workout_template_registry_v1' check (
		template_version = 'manual_workout_template_registry_v1'
	),
	source_kind text not null default 'manual_saved_workout_template_v1' check (
		source_kind = 'manual_saved_workout_template_v1'
	),
	source_status text not null default 'saved_from_reviewed_manual_workout' check (
		source_status = 'saved_from_reviewed_manual_workout'
	),
	workout_source_kind text not null default 'manual_workout_authoring_v1' check (
		workout_source_kind = 'manual_workout_authoring_v1'
	),
	review_payload_version text not null default 'manual_workout_review_payload_v1' check (
		review_payload_version = 'manual_workout_review_payload_v1'
	),
	source_review_checksum text not null check (
		source_review_checksum ~ '^[0-9a-f]{64}$'
	),
	source_workout_identity text not null check (
		char_length(trim(source_workout_identity)) between 1 and 120
	),
	source_workout_family text not null check (
		char_length(trim(source_workout_family)) between 1 and 80
	),
	target_truth_mode text not null check (
		target_truth_mode in ('structure_only', 'editable_default_hr', 'none')
	),
	draft_payload jsonb not null check (jsonb_typeof(draft_payload) = 'object'),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists runner_manual_workout_templates_user_updated_idx
	on public.runner_manual_workout_templates (user_id, updated_at desc, created_at desc);

create index if not exists runner_manual_workout_templates_user_template_idx
	on public.runner_manual_workout_templates (user_id, template_key);

drop trigger if exists runner_manual_workout_templates_set_updated_at
	on public.runner_manual_workout_templates;
create trigger runner_manual_workout_templates_set_updated_at
before update on public.runner_manual_workout_templates
for each row
execute function public.set_updated_at();

alter table public.runner_manual_workout_templates enable row level security;

create policy "runner_manual_workout_templates_select_own"
	on public.runner_manual_workout_templates
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "runner_manual_workout_templates_insert_own"
	on public.runner_manual_workout_templates
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "runner_manual_workout_templates_update_own"
	on public.runner_manual_workout_templates
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "runner_manual_workout_templates_delete_own"
	on public.runner_manual_workout_templates
	for delete
	to authenticated
	using (auth.uid() = user_id);
