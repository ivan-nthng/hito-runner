alter table public.planned_workouts
	add column workout_family text,
	add column workout_identity text,
	add column calendar_icon_key text,
	add column goal_context jsonb,
	add column metric_mode jsonb;
