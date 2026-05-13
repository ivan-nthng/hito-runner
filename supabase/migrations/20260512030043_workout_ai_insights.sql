create table public.workout_ai_insights (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	planned_workout_id uuid not null references public.planned_workouts (id) on delete cascade,
	actual_metrics_id uuid not null references public.workout_actual_metrics (id) on delete cascade,
	comparison_id uuid not null unique references public.workout_comparisons (id) on delete cascade,
	model text not null,
	response_id text,
	status text not null check (status in ('final', 'superseded')),
	analysis_summary text not null,
	difference_explanation text not null,
	next_workout_recommendation text not null,
	recommendation_level text not null check (recommendation_level in ('keep', 'soft_adjust', 'review')),
	caution_flags jsonb not null default '[]'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index workout_ai_insights_planned_workout_created_idx
	on public.workout_ai_insights (planned_workout_id, created_at desc);

create index workout_ai_insights_user_created_idx
	on public.workout_ai_insights (user_id, created_at desc);

create trigger workout_ai_insights_set_updated_at
before update on public.workout_ai_insights
for each row
execute function public.set_updated_at();

alter table public.workout_ai_insights enable row level security;

create policy "workout_ai_insights_select_own"
	on public.workout_ai_insights
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "workout_ai_insights_insert_own"
	on public.workout_ai_insights
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "workout_ai_insights_update_own"
	on public.workout_ai_insights
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
