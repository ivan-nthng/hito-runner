alter table public.runner_profiles
	add column if not exists training_preferences jsonb;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'runner_profiles_training_preferences_object_check'
	) then
		alter table public.runner_profiles
			add constraint runner_profiles_training_preferences_object_check
			check (
				training_preferences is null
				or jsonb_typeof(training_preferences) = 'object'
			);
	end if;
end $$;
