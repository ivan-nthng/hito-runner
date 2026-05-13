create table public.workout_comparisons (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	planned_workout_id uuid not null references public.planned_workouts (id) on delete cascade,
	actual_metrics_id uuid not null unique references public.workout_actual_metrics (id) on delete cascade,
	comparison_status text not null check (comparison_status in ('complete', 'partial', 'insufficient_data')),
	completion_state text not null check (completion_state in ('matched', 'partially_matched', 'unclear')),
	difference_payload jsonb not null,
	comparison_confidence numeric(5, 4) not null check (comparison_confidence >= 0 and comparison_confidence <= 1),
	created_at timestamptz not null default now()
);

create index workout_comparisons_planned_workout_created_idx
	on public.workout_comparisons (planned_workout_id, created_at desc);

create index workout_comparisons_user_created_idx
	on public.workout_comparisons (user_id, created_at desc);

alter table public.workout_comparisons enable row level security;

create policy "workout_comparisons_select_own"
	on public.workout_comparisons
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "workout_comparisons_insert_own"
	on public.workout_comparisons
	for insert
	to authenticated
	with check (auth.uid() = user_id);
