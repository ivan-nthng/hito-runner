alter table public.runner_profiles
	drop constraint if exists runner_profiles_heart_rate_profile_object_check;

alter table public.runner_profiles
	add constraint runner_profiles_heart_rate_profile_object_check
	check (
		heart_rate_profile is null
		or coalesce((
			jsonb_typeof(heart_rate_profile) = 'object'
			and heart_rate_profile ->> 'version' = 'runner_hr_profile_v2'
			and (
				(
					heart_rate_profile ->> 'source' = 'estimated'
					and heart_rate_profile - array['version', 'source'] = '{}'::jsonb
				)
				or (
					heart_rate_profile ->> 'source' = 'personal'
					and heart_rate_profile - array['version', 'source', 'zones'] = '{}'::jsonb
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
							|| @.minBpm < 40
							|| @.minBpm > 220
							|| @.minBpm != @.minBpm.floor()
							|| !exists(@.maxBpm)
							|| @.maxBpm.type() != "number"
							|| @.maxBpm < 40
							|| @.maxBpm > 220
							|| @.maxBpm != @.maxBpm.floor()
							|| @.minBpm > @.maxBpm
						)'
					)
					and case
						when jsonb_path_exists(
							heart_rate_profile,
							'$.zones[*] ? (
								@.minBpm.type() != "number"
								|| @.maxBpm.type() != "number"
							)'
						) then false
						else
							((heart_rate_profile -> 'zones' -> 1 ->> 'minBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 0 ->> 'minBpm')::numeric)
							and ((heart_rate_profile -> 'zones' -> 2 ->> 'minBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 1 ->> 'minBpm')::numeric)
							and ((heart_rate_profile -> 'zones' -> 3 ->> 'minBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 2 ->> 'minBpm')::numeric)
							and ((heart_rate_profile -> 'zones' -> 4 ->> 'minBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 3 ->> 'minBpm')::numeric)
							and ((heart_rate_profile -> 'zones' -> 1 ->> 'maxBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 0 ->> 'maxBpm')::numeric)
							and ((heart_rate_profile -> 'zones' -> 2 ->> 'maxBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 1 ->> 'maxBpm')::numeric)
							and ((heart_rate_profile -> 'zones' -> 3 ->> 'maxBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 2 ->> 'maxBpm')::numeric)
							and ((heart_rate_profile -> 'zones' -> 4 ->> 'maxBpm')::numeric
								>= (heart_rate_profile -> 'zones' -> 3 ->> 'maxBpm')::numeric)
					end
				)
			)
		), false)
	) not valid;

-- Existing rows stay untouched. New or changed profile rows must use the current guidance-band
-- contract; validation succeeds immediately when historical rows already satisfy it.
do $$
begin
	begin
		alter table public.runner_profiles
			validate constraint runner_profiles_heart_rate_profile_object_check;
	exception
		when check_violation then
			null;
	end;
end $$;
