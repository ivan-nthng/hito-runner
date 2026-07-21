alter table public.runner_profiles
	add column if not exists hidden_manual_workout_template_keys text[] not null default '{}';

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'runner_profiles_hidden_manual_workout_template_keys_check'
	) then
		alter table public.runner_profiles
			add constraint runner_profiles_hidden_manual_workout_template_keys_check
			check (
				hidden_manual_workout_template_keys <@ array[
					'rest_day',
					'recovery_jog',
					'easy_aerobic_run',
					'steady_aerobic_run',
					'long_aerobic_run',
					'progression_run',
					'controlled_tempo_session',
					'time_intervals',
					'uphill_repeats',
					'run_walk_adaptation'
				]::text[]
				and cardinality(hidden_manual_workout_template_keys) <= 10
			);
	end if;
end
$$;
