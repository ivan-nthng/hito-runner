alter table public.runner_profiles
	add column if not exists heart_rate_profile jsonb;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'runner_profiles_heart_rate_profile_object_check'
	) then
		alter table public.runner_profiles
				add constraint runner_profiles_heart_rate_profile_object_check
				check (
					heart_rate_profile is null
						or coalesce((
							jsonb_typeof(heart_rate_profile) = 'object'
							and heart_rate_profile ->> 'version' = 'personal_hr_profile_v1'
							and heart_rate_profile - array['version', 'zones'] = '{}'::jsonb
							and jsonb_typeof(heart_rate_profile -> 'zones') = 'array'
							and jsonb_array_length(heart_rate_profile -> 'zones') = 5
							and heart_rate_profile -> 'zones' -> 0 ->> 'reference' = 'Z1'
							and heart_rate_profile -> 'zones' -> 1 ->> 'reference' = 'Z2'
							and heart_rate_profile -> 'zones' -> 2 ->> 'reference' = 'Z3'
							and heart_rate_profile -> 'zones' -> 3 ->> 'reference' = 'Z4'
							and heart_rate_profile -> 'zones' -> 4 ->> 'reference' = 'Z5'
							and (heart_rate_profile -> 'zones' -> 0)
								- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
							and (heart_rate_profile -> 'zones' -> 1)
								- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
							and (heart_rate_profile -> 'zones' -> 2)
								- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
							and (heart_rate_profile -> 'zones' -> 3)
								- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
							and (heart_rate_profile -> 'zones' -> 4)
								- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
							and not jsonb_path_exists(
								heart_rate_profile,
								'$.zones[*] ? (
									!exists(@.minBpm)
									|| @.minBpm.type() != "number"
									|| @.minBpm < 1
									|| @.minBpm > 300
									|| @.minBpm != @.minBpm.floor()
									|| !exists(@.maxBpm)
									|| @.maxBpm.type() != "number"
									|| @.maxBpm < 1
									|| @.maxBpm > 300
									|| @.maxBpm != @.maxBpm.floor()
									|| @.minBpm > @.maxBpm
								)'
							)
						), false)
				);
	end if;
end $$;
